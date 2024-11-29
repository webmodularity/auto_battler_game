import * as Phaser from 'phaser';
import WebFont from 'webfontloader';
import { createPlayerAnimations } from '../animations/playerAnimations';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
        this.bgLayers = {};
        this.playerSpeed = 2;
        this.BACKGROUND_WIDTH = 1920;
        this.BACKGROUND_HEIGHT = 1080;
    }

    preload() {
        this.load.json('playerData', 'assets/characters/knight1/player_updated.json');
        
        this.load.once('filecomplete-json-playerData', () => {
            const jsonData = this.cache.json.get('playerData');
            this.load.atlas(
                'player',
                'assets/characters/knight1/player.png',
                jsonData
            );
        });

        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.key);
        });
    }

    create() {
        const jsonData = this.cache.json.get('playerData');
        if (!jsonData) {
            console.error('No JSON data available for animations');
            return;
        }
        
        createPlayerAnimations(this, 'player');
        
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

        // Load fonts before creating text
        WebFont.load({
            google: {
                families: ['Bokor']
            },
            active: () => {
                // Create main title with enhanced gaming style effects
                const shadowText = this.add.text(width/2 + 4, (height/3) - 40, 'Shape Arena', {
                    fontFamily: 'Bokor',
                    fontSize: '144px',
                    color: '#000000',
                    alpha: 0.7
                }).setOrigin(0.5);

                const mainText = this.add.text(width/2, (height/3) - 40, 'Shape Arena', {
                    fontFamily: 'Bokor',
                    fontSize: '140px',
                    color: '#ffd700', // Golden color
                    stroke: '#8b0000', // Dark red stroke
                    strokeThickness: 12,
                    shadow: { 
                        offsetX: 2, 
                        offsetY: 2, 
                        color: '#000000', 
                        blur: 5, 
                        fill: true,
                        stroke: true  // Added to ensure shadow applies to entire text
                    }
                }).setOrigin(0.5);

                // Add a metallic gradient overlay effect
                const metalGradient = this.add.text(width/2, (height/3) - 40, 'Shape Arena', {
                    fontFamily: 'Bokor',
                    fontSize: '140px',
                    color: '#ffffff',
                }).setOrigin(0.5).setAlpha(0.3);

                // Set initial state for entrance animation
                [shadowText, mainText, metalGradient].forEach(text => {
                    text.setAlpha(0);
                    text.y -= 50; // Start slightly above final position
                });

                // Create entrance animation
                this.tweens.add({
                    targets: [shadowText, mainText, metalGradient],
                    y: `+=${50}`,
                    alpha: {
                        from: 0,
                        to: (target) => target === metalGradient ? 0.3 : target === shadowText ? 0.7 : 1
                    },
                    duration: 1000,
                    ease: 'Back.out',
                    onComplete: () => {
                        // Start the floating animation after entrance
                        this.tweens.add({
                            targets: [mainText, shadowText, metalGradient],
                            y: '+=10',
                            duration: 2000,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.inOut'
                        });

                        // Add a pulsing effect to the metallic overlay
                        this.tweens.add({
                            targets: metalGradient,
                            alpha: 0.1,
                            duration: 1500,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.inOut'
                        });
                    }
                });

                // Add texts to UI container
                this.uiContainer.add([shadowText, mainText, metalGradient]);
            }
        });

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
        
        // Add flags to prevent animation interruption
        this.isPlayingOneShot = false;

        // Setup animation complete handler - modified version
        this.player.on('animationcomplete', (animation) => {
            // Only switch to idle if it's not already playing idle or running
            if (!['idle', 'running'].includes(animation.key)) {
                this.player.play('idle');
                this.isPlayingOneShot = false;
            }
        });

        // Start with idle animation
        this.player.play('idle');
    }

    update() {
        const MOVE_SPEED = 2;

        // Only process movement and new animations if we're not in a one-shot animation
        if (!this.isPlayingOneShot) {
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
                    
                    if (nextX >= this.worldBounds.playerRight - 10) {
                        this.cameras.main.fade(1000, 0, 0, 0);
                        this.time.delayedCall(1000, () => {
                            this.scene.start('FightScene', {
                                combatLog: "0x02000100070a0500070005000d0001000d0a0100070a050007000600140c01001f0a01000e0a05000e0005001f0001001f0a01000e0a05000e0005000d0001000d0a0100070a0500070005000d0001000d0a"
                            });
                        });
                    }
                } else {
                    this.player.x = this.worldBounds.playerRight;
                }
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                this.player.play('attacking', true);
                this.isPlayingOneShot = true;
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                this.player.play('blocking', true);
                this.isPlayingOneShot = true;
            }
            else {
                // If no movement keys are pressed and we're not in a one-shot animation,
                // and we're currently running, switch back to idle
                if (this.player.anims.currentAnim && 
                    this.player.anims.currentAnim.key === 'running') {
                    this.player.play('idle', true);
                }
                // If no animation is playing, also go back to idle
                else if (!this.player.anims.isPlaying) {
                    this.player.play('idle', true);
                }
            }
        }
    }
}
