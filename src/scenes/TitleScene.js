import * as Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
        this.bgLayers = {};
        this.playerSpeed = 2;
        this.BACKGROUND_WIDTH = 1920;
        this.BACKGROUND_HEIGHT = 1080;
    }

    preload() {
        // Load forest1 background layers
        this.load.image('sky', '/assets/backgrounds/forest1/Sky.png');
        this.load.image('bg-decor', '/assets/backgrounds/forest1/BG_Decor.png');
        this.load.image('middle-decor', '/assets/backgrounds/forest1/Middle_Decor.png');
        this.load.image('ground-02', '/assets/backgrounds/forest1/Ground_02.png');
        this.load.image('ground-01', '/assets/backgrounds/forest1/Ground_01.png');
        this.load.image('foreground', '/assets/backgrounds/forest1/Foreground.png');

        // Load player atlas
        this.load.atlas('player', '/assets/characters/knight1/player.png', '/assets/characters/knight1/player.json');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Set world bounds to match background width
        this.physics.world.setBounds(0, 0, this.BACKGROUND_WIDTH, height);
        
        // Configure camera to follow player within world bounds
        this.cameras.main.setBounds(0, 0, this.BACKGROUND_WIDTH, height);

        // Add all layers in order with corrected depth and alpha
        const layers = [
            { key: 'sky', depth: 0, alpha: 0.75 },
            { key: 'bg-decor', depth: 1, alpha: 0.75 },
            { key: 'middle-decor', depth: 2, alpha: 0.8 },
            { key: 'foreground', depth: 3, alpha: 0.65 },
            { key: 'ground-02', depth: 4, alpha: 0.85 },
            { key: 'ground-01', depth: 5, alpha: 1 }
        ];

        // Create background layers with proper positioning - full size
        layers.forEach(layer => {
            this.bgLayers[layer.key] = this.add.image(this.BACKGROUND_WIDTH/2, height, layer.key)
                .setOrigin(0.5, 1)  // Anchor to bottom center
                .setScale(1)        // Full size
                .setDepth(layer.depth)
                .setAlpha(layer.alpha);
        });

        // Create UI container with adjusted positions
        this.uiContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(20);

        // Move title text higher up
        const titleText = this.add.text(width/2, height/6, 'KNIGHT FIGHT', {
            font: '64px monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 5, fill: true }
        }).setOrigin(0.5);

        // Move start text higher up
        const startText = this.add.text(width/2, height/3, 'Run Right to Fight!', {
            font: '32px monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 5, fill: true }
        }).setOrigin(0.5);

        // Add texts to UI container
        this.uiContainer.add([titleText, startText]);

        // Increase sprite width buffer for tighter boundaries
        const SPRITE_WIDTH = 75;  // Increased from 50 to 75 for more padding
        this.worldBounds = {
            playerLeft: SPRITE_WIDTH + 25,  // Added extra padding on left
            playerRight: this.BACKGROUND_WIDTH - (SPRITE_WIDTH + 25)  // Added extra padding on right
        };

        // Create player starting in center
        this.player = this.add.sprite(this.BACKGROUND_WIDTH/2, height - 150, 'player')
            .setScale(1.5)
            .setDepth(6);

        // Make camera follow the player without physics
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);  // Smoother following
        this.cameras.main.setBounds(0, 0, this.BACKGROUND_WIDTH, height);

        // Setup keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Create animations
        if (!this.anims.exists('idle')) {
            const animations = [
                { key: 'idle', prefix: 'Idle_', frames: 18 },
                { key: 'running', prefix: 'Running_', frames: 12 },
                { key: 'slashing', prefix: 'Slashing_', frames: 12 },
                { key: 'kicking', prefix: 'Kicking_', frames: 12 }
            ];

            animations.forEach(({ key, prefix, frames }) => {
                this.anims.create({
                    key: key,
                    frames: this.anims.generateFrameNames('player', {
                        prefix: prefix,
                        start: 0,
                        end: frames - 1,
                        zeroPad: 3,
                        suffix: '.png'
                    }),
                    frameRate: 24,
                    repeat: key === 'idle' || key === 'running' ? -1 : 0
                });
            });
        }

        // Setup animation complete handler
        this.player.on('animationcomplete', (animation) => {
            if (!['idle', 'running'].includes(animation.key)) {
                this.player.play('idle');
            }
        });

        // Start with idle animation
        this.player.play('idle');
    }

    update() {
        const MOVE_SPEED = 2;

        if (this.cursors.left.isDown) {
            this.player.setFlipX(true);
            this.player.play('running', true);
            
            const nextX = this.player.x - MOVE_SPEED;
            if (nextX >= this.worldBounds.playerLeft) {
                this.player.x = nextX;
            } else {
                this.player.x = this.worldBounds.playerLeft;
            }
        }
        else if (this.cursors.right.isDown) {
            this.player.setFlipX(false);
            this.player.play('running', true);
            
            const nextX = this.player.x + MOVE_SPEED;
            if (nextX <= this.worldBounds.playerRight) {
                this.player.x = nextX;
                
                // Check if player has reached the right side
                if (nextX >= this.worldBounds.playerRight - 10) {  // Added small buffer
                    // Add transition effect
                    this.cameras.main.fade(1000, 0, 0, 0);
                    this.time.delayedCall(1000, () => {
                        this.scene.start('MainScene');
                    });
                }
            } else {
                this.player.x = this.worldBounds.playerRight;
            }
        }
        else if (this.cursors.up.isDown) {
            this.player.play('slashing', true);
        }
        else if (this.cursors.down.isDown) {
            this.player.play('kicking', true);
        }
        else {
            this.player.play('idle', true);
        }
    }
}
