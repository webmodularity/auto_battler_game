import * as Phaser from 'phaser';
import WebFont from 'webfontloader';
import { createPlayerAnimations } from '../animations/playerAnimations';
import { loadCharacterData } from '../utils/nftLoader';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
        this.bgLayers = {};
        this.playerSpeed = 2;
        this.BACKGROUND_WIDTH = 1920;
        this.BACKGROUND_HEIGHT = 1080;
    }

    preload() {
        this.load.image('sky', 'assets/backgrounds/parallax-mountain/sky.png');
        this.load.image('bg-decor', 'assets/backgrounds/parallax-mountain/bg-decor.png');
        this.load.image('middle-decor', 'assets/backgrounds/parallax-mountain/middle-decor.png');
        this.load.image('foreground', 'assets/backgrounds/parallax-mountain/foreground.png');
        this.load.image('ground-01', 'assets/backgrounds/parallax-mountain/ground-01.png');
        this.load.image('ground-02', 'assets/backgrounds/parallax-mountain/ground-02.png');

        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.key);
        });
    }

    create() {
        const PLAYER_ID = '1';
        const playerKey = `player${PLAYER_ID}`;
        
        // Get the JSON data from the loaded atlas instead of trying to load it separately
        const jsonData = this.textures.get(playerKey).get('__BASE').customData;
        if (!jsonData) {
            console.error('No JSON data available for animations');
            return;
        }
        
        createPlayerAnimations(this, playerKey);
        
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

        // Create player starting in center with proper ground position
        this.player = this.add.sprite(this.BACKGROUND_WIDTH/2, height, playerKey)
            .setScale(1)
            .setDepth(6)
            .setOrigin(0.5, 1);
        
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

        // Add these debug lines
        console.log('Current animation frames:', this.player.anims.currentAnim?.frames);
        console.log('Available frame names:', this.textures.get(playerKey).getFrameNames());

        // Add this debug line
        const frame = this.textures.get('player1').get('idle_000.png');
        console.log('Frame dimensions:', frame.width, frame.height);
    }

    update() {
        const MOVE_SPEED = 2;
        const DODGE_SPEED = 4;  // Speed for dodge sliding

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
                            Promise.all([
                                loadCharacterData('1'),
                                loadCharacterData('2')
                            ]).then(([player1Data, player2Data]) => {
                                this.scene.start('FightScene', {
                                    player1Id: '1',
                                    player2Id: '2',
                                    player1Data,
                                    player2Data
                                });
                            }).catch(error => {
                                console.error('Error loading character data:', error);
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

            // Check for dodge (down arrow) regardless of running state
            if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                this.player.play('dodging', true);
                this.isPlayingOneShot = true;
                
                // Determine direction based on either current running direction or facing direction
                let direction;
                if (this.cursors.left.isDown) {
                    direction = -1;
                    this.player.setFlipX(true);
                } else if (this.cursors.right.isDown) {
                    direction = 1;
                    this.player.setFlipX(false);
                } else {
                    direction = this.player.flipX ? -1 : 1;
                }
                
                const targetX = this.player.x + (direction * 150); // Slide distance
                
                // Calculate bounded target position
                const boundedTargetX = Phaser.Math.Clamp(
                    targetX,
                    this.worldBounds.playerLeft,
                    this.worldBounds.playerRight
                );
                
                this.tweens.add({
                    targets: this.player,
                    x: boundedTargetX,
                    duration: 500, // Duration of dodge animation
                    ease: 'Quad.out',
                    onComplete: () => {
                        this.isPlayingOneShot = false;
                        if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
                            this.player.play('idle', true);
                        }
                    }
                });
            }
            // Only play idle if we're not dodging and not moving
            else if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
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
