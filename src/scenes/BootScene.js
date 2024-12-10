import * as Phaser from 'phaser';
import { LoadingScreen } from '../ui/loadingScreen';
import { loadCharacterData } from '../utils/nftLoader';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    init() {
        const params = new URLSearchParams(window.location.search);
        this.player1Id = params.get('player1Id');
        this.player2Id = params.get('player2Id');
        this.txId = params.get('txId');
    }

    preload() {
        this.loadingScreen = new LoadingScreen(this);
        this.loadBackgroundAssets();
    
        // Store promise to ensure we wait for data
        this.playerDataPromise = this.player1Id && this.player2Id 
            ? Promise.all([loadCharacterData(this.player1Id), loadCharacterData(this.player2Id)])
            : Promise.all([loadCharacterData('1')]);

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
    
    async create() {
        try {
            const playerData = await this.playerDataPromise;
    
            // Create a promise that resolves when loading is complete
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
    
            // Wait for loading to complete
            await loadComplete;
    
            // Now safe to transition
            if (this.player1Id && this.player2Id) {
                const [p1Data, p2Data] = playerData;
                this.scene.start('FightScene', {
                    player1Id: this.player1Id,
                    player2Id: this.player2Id,
                    player1Data: p1Data,
                    player2Data: p2Data
                });
            } else {
                const [p1Data] = playerData;
                this.scene.start('TitleScene', { player1Data: p1Data });
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