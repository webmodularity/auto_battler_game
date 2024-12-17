import * as Phaser from 'phaser';
import { LoadingScreen } from '../ui/loadingScreen';
import { loadCharacterData } from '../utils/nftLoader';
import { loadDuelDataFromTx } from '../utils/combatLoader';
import { createPublicClient, http } from 'viem';
import { DefaultPlayerSkinNFTABI } from '../abi';
import { PracticeGameABI } from '../abi';
import { PlayerABI } from '../abi';
import { SkinRegistryABI } from '../abi';
import { GameEngineABI } from '../abi'; // Import GameEngineABI

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
            const p1Id = params.get('player1Id');
            const p2Id = params.get('player2Id');
            
            // Only set player IDs if both are valid numbers
            if (p1Id && p2Id && !isNaN(p1Id) && !isNaN(p2Id)) {
                this.player1Id = p1Id;
                this.player2Id = p2Id;
            }
            // Otherwise, leave them undefined so selectRandomPlayers() will be called
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
            else if (typeof this.player1Id === 'undefined' || typeof this.player2Id === 'undefined') {
                await this.selectRandomPlayers();
            }

            // Load player data
            const playerData = await Promise.all([
                loadCharacterData(this.player1Id), 
                this.player2Id ? loadCharacterData(this.player2Id) : null
            ]);

            // Store the loaded player data
            [this.player1Data, this.player2Data] = playerData;

            // Get loadout info for both players
            const transport = http(`https://${this.network}.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`);
            const client = createPublicClient({
                transport
            });

            // Get skin registry from player contract
            const skinRegistryAddress = await client.readContract({
                address: import.meta.env.VITE_PLAYER_CONTRACT_ADDRESS,
                abi: PlayerABI,
                functionName: 'skinRegistry'
            });

            // Get skin info for both players
            const [skinInfo1, skinInfo2] = await Promise.all([
                client.readContract({
                    address: skinRegistryAddress,
                    abi: SkinRegistryABI,
                    functionName: 'getSkin',
                    args: [this.player1Data.stats.skinIndex]
                }),
                this.player2Data ? client.readContract({
                    address: skinRegistryAddress,
                    abi: SkinRegistryABI,
                    functionName: 'getSkin',
                    args: [this.player2Data.stats.skinIndex]
                }) : null
            ]);

            // Get attributes from the skin contracts
            const [loadout1, loadout2] = await Promise.all([
                client.readContract({
                    address: skinInfo1.contractAddress,
                    abi: DefaultPlayerSkinNFTABI,
                    functionName: 'getSkinAttributes',
                    args: [this.player1Data.stats.skinTokenId]
                }),
                this.player2Data ? client.readContract({
                    address: skinInfo2.contractAddress,
                    abi: DefaultPlayerSkinNFTABI,
                    functionName: 'getSkinAttributes',
                    args: [this.player2Data.stats.skinTokenId]
                }) : null
            ]);

            // Map the loadout enum values to strings based on IPlayerSkinNFT interface
            const weaponTypes = [
                'SwordAndShield',    // 0
                'MaceAndShield',     // 1
                'Greatsword',        // 2
                'Battleaxe',         // 3
                'Quarterstaff',      // 4
                'Spear',             // 5
                'RapierAndShield'    // 6
            ];
            const armorTypes = [
                'Plate',     // 0
                'Chain',     // 1
                'Leather',   // 2
                'Cloth'      // 3
            ];
            const stanceTypes = [
                'Defensive', // 0
                'Balanced',  // 1
                'Offensive'  // 2
            ];

            // Add loadout info to player data
            if (this.player1Data && loadout1) {
                // The loadout comes back as an object with numeric properties
                const weapon = Number(loadout1.weapon ?? loadout1[0] ?? 0);
                const armor = Number(loadout1.armor ?? loadout1[1] ?? 0);
                const stance = Number(loadout1.stance ?? loadout1[2] ?? 0);
                
                this.player1Data.stats.weapon = this.abbreviateWeaponName(weaponTypes[weapon] ?? 'None');
                this.player1Data.stats.armor = armorTypes[armor] ?? 'None';
                this.player1Data.stats.stance = stanceTypes[stance] ?? 'None';
            }

            if (this.player2Data && loadout2) {
                // The loadout comes back as an object with numeric properties
                const weapon = Number(loadout2.weapon ?? loadout2[0] ?? 0);
                const armor = Number(loadout2.armor ?? loadout2[1] ?? 0);
                const stance = Number(loadout2.stance ?? loadout2[2] ?? 0);
                
                this.player2Data.stats.weapon = this.abbreviateWeaponName(weaponTypes[weapon] ?? 'None');
                this.player2Data.stats.armor = armorTypes[armor] ?? 'None';
                this.player2Data.stats.stance = stanceTypes[stance] ?? 'None';
            }

            // Start loading player-specific assets
            if (this.player1Id && this.player2Id) {
                this.load.atlas(`player${this.player1Id}`, this.player1Data.spritesheetUrl, this.player1Data.jsonData);
                this.load.atlas(`player${this.player2Id}`, this.player2Data.spritesheetUrl, this.player2Data.jsonData);
            } else {
                this.load.atlas('player1', this.player1Data.spritesheetUrl, this.player1Data.jsonData);
            }
            this.load.start();

            // Fetch block number separately if needed
            if (!this.txId) {
                await this.fetchBlockNumber();
            }

            this.preloadComplete = true;
            this.create();
        } catch (error) {
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
            this.blockNumber = 'Unknown';
        }
    }

    async create() {
        if (!this.preloadComplete) {
            return;
        }

        try {
            if (this.player1Id && this.player2Id) {
                this.scene.start('FightScene', {
                    player1Id: this.player1Id,
                    player2Id: this.player2Id,
                    player1Data: this.player1Data,
                    player2Data: this.player2Data,
                    player1Name: this.player1Data.name,
                    player2Name: this.player2Data.name,
                    network: this.network,
                    blockNumber: this.blockNumber,
                    txId: this.txId || 'Practice',
                    combatBytes: this.combatBytesFromTx
                });
            } else {
                // Fallback to player1 vs player2 if something went wrong
                const p1Data = this.player1Data;
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
        } catch (error) {
            this.loadingScreen.showError('Error starting fight');
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

    async loadPlayerAssets(playerId, playerData) {
        if (!playerData || !playerData.spritesheetUrl || !playerData.jsonData) {
            return;
        }

        return new Promise((resolve) => {
            this.load.once(`filecomplete-atlas-player${playerId}`, resolve);
            this.load.atlas(`player${playerId}`, playerData.spritesheetUrl, playerData.jsonData);
            this.load.start();
        });
    }

    abbreviateWeaponName(weapon) {
        const abbreviations = {
            'Quarterstaff': 'Quarterstaff',
            'Greatsword': 'Greatsword',
            'ShortSword': 'S.Sword',
            'BattleAxe': 'B.Axe',
            'Warhammer': 'W.Hammer',
            'SwordAndShield': 'Sword',
            'MaceAndShield': 'Mace',
            'RapierAndShield': 'Rapier'
        };
        return abbreviations[weapon] || weapon;
    }
}