import * as Phaser from 'phaser';
import { LoadingScreen } from '../ui/loadingScreen';
import { loadCharacterData, loadDuelDataFromTx } from '../utils/nftLoader';
import { Alchemy } from 'alchemy-sdk';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    init() {
        const params = new URLSearchParams(window.location.search);
        this.txId = params.get('txId');
        this.network = params.get('network') || import.meta.env.VITE_ALCHEMY_NETWORK;
        this.blockNumber = params.get('blockNumber') || '123456'; // Default block number
    
        // Only set player IDs if no txId (practice mode)
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

            // If we have a txId, load the duel data first
            if (this.txId) {
                const duelData = await loadDuelDataFromTx(this.txId, this.network);
                this.player1Id = duelData.player1Id.toString();
                this.player2Id = duelData.player2Id.toString();
                this.combatBytes = duelData.combatBytes;
                this.winningPlayerId = duelData.winningPlayerId.toString();
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

    async fetchBlockNumber() {
        const alchemy = new Alchemy({
            apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
            network: this.network
        });

        try {
            const block = await alchemy.core.getBlockNumber();
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
                    combatBytes: this.txId ? {
                        winner: this.winningPlayerId,
                        actions: this.combatBytes
                    } : null
                });
            } else {
                const [p1Data] = playerData;
                this.scene.start('TitleScene', { 
                    player1Data: p1Data,
                    player1Name: p1Data.name 
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