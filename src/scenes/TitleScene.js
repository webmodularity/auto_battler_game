import * as Phaser from 'phaser';
import WebFont from 'webfontloader';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
        this.bgLayers = {};
        this.playerSpeed = 2;
        this.BACKGROUND_WIDTH = 1920;
        this.BACKGROUND_HEIGHT = 1080;
    }

    preload() {
        // Add WebFont import at top of file if not already present
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
        
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
        this.createAnimations();

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
                const shadowText = this.add.text(width/2 + 4, (height/3) - 40, 'Heavy Helms', {
                    fontFamily: 'Bokor',
                    fontSize: '144px',
                    color: '#000000',
                    alpha: 0.7
                }).setOrigin(0.5);

                const mainText = this.add.text(width/2, (height/3) - 40, 'Heavy Helms', {
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
                const metalGradient = this.add.text(width/2, (height/3) - 40, 'Heavy Helms', {
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
            if (!['Idle', 'Running'].includes(animation.key)) {
                this.player.play('Idle');
                this.isPlayingOneShot = false;
            }
        });

        // Start with idle animation
        this.player.play('Idle');
    }

    createAnimations() {
        const animations = [
            { key: 'Dying', prefix: 'Dying_', frames: 15 },
            { key: 'Hurt', prefix: 'Hurt_', frames: 12 },
            { key: 'Idle', prefix: 'Idle_', frames: 18 },
            { key: 'Kicking', prefix: 'Kicking_', frames: 12 },
            { key: 'Running', prefix: 'Running_', frames: 12 },
            { key: 'Slashing', prefix: 'Slashing_', frames: 12 },
            { key: 'Sliding', prefix: 'Sliding_', frames: 6 },
            { key: 'Walking', prefix: 'Walking_', frames: 24 }
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
                repeat: key === 'Idle' || key === 'Walking' || key === 'Running' ? -1 : 0
            });
        });
    }

    update() {
        const MOVE_SPEED = 2;

        // Only process movement and new animations if we're not in a one-shot animation
        if (!this.isPlayingOneShot) {
            if (this.cursors.left.isDown) {
                this.player.setFlipX(true);
                this.player.play('Running', true);
                
                const nextX = this.player.x - MOVE_SPEED;
                if (nextX >= this.worldBounds.playerLeft) {
                    this.player.x = nextX;
                } else {
                    this.player.x = this.worldBounds.playerLeft;
                }
            }
            else if (this.cursors.right.isDown) {
                this.player.setFlipX(false);
                this.player.play('Running', true);
                
                const nextX = this.player.x + MOVE_SPEED;
                if (nextX <= this.worldBounds.playerRight) {
                    this.player.x = nextX;
                    
                    if (nextX >= this.worldBounds.playerRight - 10) {
                        this.cameras.main.fade(1000, 0, 0, 0);
                        this.time.delayedCall(1000, () => {
                            this.scene.start('FightScene', {
                                combatLog: "0x0100000000030400000003000e0f000000030100000a0200000c0200000c0100000a000000030400000004000000000000030000000304000000040000000000000300000003040000000200000c0100000a0100000a0200000c0200000c0100000a0000000304000000050000000100280a01000e0a05000000040000000000000301000e0a050000000200000c0100000a01000e0a05000000040000000000000300000003040000000200000c0100000a0000000304000000040000000000000300000003040000000400000000000003000000030300280f0400000000000003000000030400000004000000000000030000000304000000040000000000000301000e0a050000000200000c0100000a000000030400000003000e0f0000000301000e0a05000000"
                            });
                        });
                    }
                } else {
                    this.player.x = this.worldBounds.playerRight;
                }
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                this.player.play('Slashing', true);
                this.isPlayingOneShot = true;
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                this.player.play('Kicking', true);
                this.isPlayingOneShot = true;
            }
            else {
                // If no movement keys are pressed and we're not in a one-shot animation,
                // and we're currently running, switch back to Idle
                if (this.player.anims.currentAnim && 
                    this.player.anims.currentAnim.key === 'Running') {
                    this.player.play('Idle', true);
                }
                // If no animation is playing, also go back to Idle
                else if (!this.player.anims.isPlaying) {
                    this.player.play('Idle', true);
                }
            }
        }
    }
}
