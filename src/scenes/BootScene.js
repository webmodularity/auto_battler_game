import * as Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width/4, height/2 - 30, width/2, 50);
        
        // Loading text
        const loadingText = this.add.text(width/2, height/2 - 50, 'Loading...', {
            font: '20px monospace',
            fill: '#ffffff'
        });
        loadingText.setOrigin(0.5, 0.5);
        
        // Progress text
        const percentText = this.add.text(width/2, height/2, '0%', {
            font: '18px monospace',
            fill: '#ffffff'
        });
        percentText.setOrigin(0.5, 0.5);

        // Loading event handlers
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width/4 + 10, height/2 - 20, (width/2 - 20) * value, 30);
            percentText.setText(parseInt(value * 100) + '%');
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // Load assets
        // Background layers
        this.load.image('sky', '/assets/backgrounds/forest2/Sky.png');
        this.load.image('bg-decor', '/assets/backgrounds/forest2/BG.png');
        this.load.image('middle-decor', '/assets/backgrounds/forest2/Middle.png');
        this.load.image('ground-02', '/assets/backgrounds/forest2/Ground_02.png');
        this.load.image('ground-01', '/assets/backgrounds/forest2/Ground_01.png');
        this.load.image('foreground', '/assets/backgrounds/forest2/Foreground.png');
        
        // Load player atlas
        const PLAYER_ID = '1';
        const IPFS_BASE_URL = 'https://ipfs.io/ipfs';
        const JSON_HASH = 'QmTZzCarXPyWK483Eve4NsQLwiJbCuWhAbnPx2sVRyfKqC';
        
        // Load JSON first
        this.load.json(`player${PLAYER_ID}-data`, `${IPFS_BASE_URL}/${JSON_HASH}`);
        
        // Wait for JSON to load before loading atlas
        this.load.once('filecomplete-json-player1-data', () => {
            const jsonData = this.cache.json.get(`player${PLAYER_ID}-data`);
            
            if (!jsonData.image_spritesheet) {
                console.error(`Error: No spritesheet data found for player${PLAYER_ID}`);
                return;
            }

            const spriteHash = jsonData.image_spritesheet.replace('ipfs://', '');
            
            this.load.atlas(
                `player${PLAYER_ID}`, 
                `${IPFS_BASE_URL}/${spriteHash}`,
                jsonData
            );
        });
    }

    create() {
        // Attach the JSON data to the texture
        const PLAYER_ID = '1';
        const jsonData = this.cache.json.get(`player${PLAYER_ID}-data`);
        const texture = this.textures.get(`player${PLAYER_ID}`);
        
        if (texture && jsonData) {
            texture.get('__BASE').customData = jsonData;
        }
        
        this.scene.start('TitleScene');
    }
} 