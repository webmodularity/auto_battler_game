import * as Phaser from 'phaser';
import { LoadingScreen } from '../ui/loadingScreen';
import { loadCharacterData } from '../utils/nftLoader';
import { loadDuelDataFromTx } from '../utils/combatLoader';
import { createPublicClient, http } from 'viem';
import { DefaultPlayerSkinNFTABI } from '../abi';
import { PracticeGameABI } from '../abi';
import { PlayerABI } from '../abi';
import { SkinRegistryABI } from '../abi';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    init() {
        const params = new URLSearchParams(window.location.search);
        this.txId = params.get('txId');
        this.network = params.get('network') || import.meta.env.VITE_ALCHEMY_NETWORK;
        this.blockNumber = params.get('blockNumber') || '123456'; // Default block number
    
        // Only set player IDs if no txId (practice mode) and if not provided in URL
        if (!this.txId) {
            this.player1Id = params.get('player1Id');
            this.player2Id = params.get('player2Id');
        }
    }

    async preload() {
        this.loadingScreen = new LoadingScreen(this);
        this.preloadComplete = false;
        
        try {
            // Load background assets first
            this.loadBackgroundAssets();

            // Load audio assets
            this.load.audio('fight-music', '/assets/audio/bkg/bg.ogg');

            // If we have a txId, load the duel data first
            if (this.txId) {
                const duelData = await loadDuelDataFromTx(this.txId, this.network);
                this.player1Id = duelData.player1Id.toString();
                this.player2Id = duelData.player2Id.toString();
                this.combatBytesFromTx = duelData;  // Store the full decoded combat data
                this.winningPlayerId = duelData.winningPlayerId.toString();
                this.blockNumber = duelData.blockNumber; // Use block number from transaction
            } 
            // If no player IDs provided and no txId, randomly select players
            else if (!this.player1Id || !this.player2Id) {
                await this.selectRandomPlayers();
            }

            // Store promise to ensure we wait for data
            this.playerDataPromise = this.player1Id && this.player2Id 
                ? Promise.all([loadCharacterData(this.player1Id), loadCharacterData(this.player2Id)])
                : Promise.all([loadCharacterData('1')]);

            // Fetch block number separately if needed
            if (!this.txId) {
                await this.fetchBlockNumber();
            }

            this.preloadComplete = true;
            this.create();
        } catch (error) {
            console.error('Error loading player data:', error);
            this.loadingScreen.showError('Error loading player data');
        }

        if (this.sound.locked) {
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            const unmuteButton = this.add.text(width/2, height - 50, '🔈 Click to Enable Sound', {
                fontSize: '24px',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
                color: '#ffffff'
            })
            .setOrigin(0.5)
            .setInteractive()
            .setDepth(1002);

            unmuteButton.on('pointerdown', () => {
                this.sound.unlock();
                unmuteButton.destroy();
            });
        }
    }

    async selectRandomPlayers() {
        try {
            const networkName = import.meta.env.VITE_ALCHEMY_NETWORK.toLowerCase();
            const transport = http(`https://${networkName}.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`);
            const client = createPublicClient({
                transport
            });

            // Get player contract address from game contract first
            const gameContractAddress = import.meta.env.VITE_PRACTICE_GAME_CONTRACT_ADDRESS;
            const playerContractAddress = await client.readContract({
                address: gameContractAddress,
                abi: PracticeGameABI,
                functionName: 'playerContract'
            });

            // Get skin registry address from player contract
            const skinRegistryAddress = await client.readContract({
                address: playerContractAddress,
                abi: PlayerABI,
                functionName: 'skinRegistry'
            });

            // Get default skin NFT address from skin registry (index 0)
            const defaultSkinInfo = await client.readContract({
                address: skinRegistryAddress,
                abi: SkinRegistryABI,
                functionName: 'getSkin',
                args: [0] // Index 0 is DefaultPlayerSkinNFT
            });

            // Get the current token ID (total number of skins)
            const currentTokenId = await client.readContract({
                address: defaultSkinInfo.contractAddress,
                abi: DefaultPlayerSkinNFTABI,
                functionName: 'CURRENT_TOKEN_ID'
            });
            
            // Generate two unique random numbers between 1 and currentTokenId - 1
            const maxId = Number(currentTokenId) - 1;
            
            const id1 = Math.floor(Math.random() * maxId) + 1;
            let id2;
            do {
                id2 = Math.floor(Math.random() * maxId) + 1;
            } while (id2 === id1);
            
            this.player1Id = id1.toString();
            this.player2Id = id2.toString();

        } catch (error) {
            console.error('Error selecting random players:', error);
            console.error('Error details:', {
                message: error.message,
                cause: error.cause,
                stack: error.stack
            });
            // Fallback to default players 1 and 2 if something goes wrong
            this.player1Id = '1';
            this.player2Id = '2';
        }
    }

    async fetchBlockNumber() {
        const transport = http(`https://${this.network}.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`);
        const client = createPublicClient({
            transport
        });

        try {
            const block = await client.getBlockNumber();
            this.blockNumber = block.toString();
        } catch (error) {
            console.error('Error fetching block number:', error);
            this.blockNumber = 'Unknown';
        }
    }

    async create() {
        if (!this.preloadComplete) {
            return;
        }

        try {
            const playerData = await this.playerDataPromise;
     
            const loadComplete = new Promise(resolve => {
                this.load.on('complete', resolve);
                
                if (this.player1Id && this.player2Id) {
                    const [p1Data, p2Data] = playerData; 
                    this.load.atlas(`player${this.player1Id}`, p1Data.spritesheetUrl, p1Data.jsonData);
                    this.load.atlas(`player${this.player2Id}`, p2Data.spritesheetUrl, p2Data.jsonData);
                } else {
                    const [p1Data] = playerData;
                    this.load.atlas('player1', p1Data.spritesheetUrl, p1Data.jsonData);
                }
                
                this.load.start();
            });
     
            await loadComplete;
     
            if (this.player1Id && this.player2Id) {
                const [p1Data, p2Data] = playerData;
                this.scene.start('FightScene', {
                    player1Id: this.player1Id,
                    player2Id: this.player2Id,
                    player1Data: p1Data,
                    player2Data: p2Data,
                    player1Name: p1Data.name,
                    player2Name: p2Data.name,
                    network: this.network,
                    blockNumber: this.blockNumber,
                    txId: this.txId || 'Practice',
                    combatBytes: this.txId ? this.combatBytesFromTx : null  // Pass the full duel data object
                });
            } else {
                // Fallback to player1 vs player2 if something went wrong
                const [p1Data] = playerData;
                const p2Data = p1Data; // Use same data for both players as fallback
                this.scene.start('FightScene', {
                    player1Id: '1',
                    player2Id: '2',
                    player1Data: p1Data,
                    player2Data: p2Data,
                    player1Name: p1Data.name,
                    player2Name: p2Data.name,
                    network: this.network,
                    blockNumber: this.blockNumber,
                    txId: 'Practice',
                    combatBytes: null
                });
            }
            
            this.loadingScreen.hide();
        } catch (error) {
            console.error('Error loading player data:', error);
            this.loadingScreen.showError('Error loading game data');
        }
    }

    loadBackgroundAssets() {
        const paths = {
            'sky': 'assets/backgrounds/forest2/Sky.png',
            'bg-decor': 'assets/backgrounds/forest2/BG.png',
            'middle-decor': 'assets/backgrounds/forest2/Middle.png',
            'ground-02': 'assets/backgrounds/forest2/Ground_02.png',
            'ground-01': 'assets/backgrounds/forest2/Ground_01.png',
            'foreground': 'assets/backgrounds/forest2/Foreground.png'
        };

        Object.entries(paths).forEach(([key, path]) => {
            this.load.image(key, path);
        });
    }

    loadPlayerAssets(playerId, playerData) {
        if (playerData?.spritesheetUrl && playerData?.jsonData) {
            this.load.atlas(
                `player${playerId}`,
                playerData.spritesheetUrl,
                playerData.jsonData
            );
            // Store the data for later use
            this[`player${playerId}Data`] = playerData;
        }
    }
}