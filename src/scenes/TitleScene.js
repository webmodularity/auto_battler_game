import * as Phaser from 'phaser';
import WebFont from 'webfontloader';
import { createPlayerAnimations } from '../animations/playerAnimations';
import { loadCharacterData } from '../utils/nftLoader';
import { CombatAnimator } from '../combat/combatAnimator';

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
        this.bgLayers = {};
        this.playerSpeed = 2;
        this.BACKGROUND_WIDTH = 1920;
        this.BACKGROUND_HEIGHT = 1080;
        this.animator = null;
    }

    init(data) {
        this.player1Data = data.player1Data;
    }

    create() {
        const PLAYER_ID = '1';
        const playerKey = `player${PLAYER_ID}`;
        
        // Set the custom data for the texture, similar to FightScene
        if (this.player1Data?.jsonData) {
            const texture = this.textures.get(playerKey);
            if (texture) {
                texture.get('__BASE').customData = this.player1Data.jsonData;
            }
        }
        
        // Now create animations after setting customData
        createPlayerAnimations(this, playerKey);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
    
        this.physics.world.setBounds(0, 0, this.BACKGROUND_WIDTH, height);
        this.cameras.main.setBounds(0, 0, this.BACKGROUND_WIDTH, height);
    
        const layers = [
            { key: 'sky', depth: 0, alpha: 0.75 },
            { key: 'bg-decor', depth: 1, alpha: 0.75 },
            { key: 'middle-decor', depth: 2, alpha: 0.8 },
            { key: 'foreground', depth: 3, alpha: 0.65 },
            { key: 'ground-02', depth: 4, alpha: 0.85 },
            { key: 'ground-01', depth: 5, alpha: 1 }
        ];
    
        // Create background layers with proper positioning
        layers.forEach(layer => {
            this.bgLayers[layer.key] = this.add.image(this.BACKGROUND_WIDTH/2, height, layer.key)
                .setOrigin(0.5, 1)
                .setScale(1)
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

        // Initialize the animator after player creation
        this.animator = new CombatAnimator(this);
        
        // Replace direct animation calls with animator methods
        this.animator.setupAnimationComplete(this.player);
        
        // Start with idle animation using animator
        this.animator.playAnimation(this.player, 'idle');
    }

    update() {     
        const MOVE_SPEED = 2;
     
        // Use animator's check for one-shot animations
        if (this.animator.canPlayAnimation()) {
            if (this.cursors.left.isDown) {
                this.player.setFlipX(true);
                this.animator.playAnimation(this.player, 'running');
                
                const nextX = this.player.x - MOVE_SPEED;
                if (nextX >= this.worldBounds.playerLeft) {
                    this.player.x = nextX;
                } else {
                    this.player.x = this.worldBounds.playerLeft;
                }
            }
            else if (this.cursors.right.isDown) {
                this.player.setFlipX(false);
                this.animator.playAnimation(this.player, 'running');
                
                const nextX = this.player.x + MOVE_SPEED;
                if (nextX <= this.worldBounds.playerRight) {
                    this.player.x = nextX;
                    
                    if (nextX >= this.worldBounds.playerRight - 10) {
                        if (this.isTransitioning) return;
                        this.isTransitioning = true;
                    
                        this.cameras.main.fade(1000, 0, 0, 0);
                        this.time.delayedCall(1000, () => {
                           const searchParams = new URLSearchParams();
                           searchParams.set('player1Id', '3');
                           searchParams.set('player2Id', '2');
                           
                           if (import.meta.env.VITE_ALCHEMY_NETWORK !== 'shape-sepolia') {
                               searchParams.set('network', import.meta.env.VITE_ALCHEMY_NETWORK);
                           }
                           
                           window.history.replaceState({}, '', `${window.location.pathname}?${searchParams}`);
                           this.scene.start('BootScene');
                        });
                    }
                } else {
                    this.player.x = this.worldBounds.playerRight;
                }
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                this.animator.playOneShotAnimation(this.player, 'attacking');
            }
     
            if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                this.animator.playOneShotAnimation(this.player, 'dodging');
                
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
                
                const targetX = this.player.x + (direction * 150);
                
                const boundedTargetX = Phaser.Math.Clamp(
                    targetX,
                    this.worldBounds.playerLeft,
                    this.worldBounds.playerRight
                );
                
                this.tweens.add({
                    targets: this.player,
                    x: boundedTargetX,
                    duration: 500,
                    ease: 'Quad.out',
                    onComplete: () => {
                        this.animator.playAnimation(this.player, 
                            this.cursors.left.isDown || this.cursors.right.isDown ? 'running' : 'idle'
                        );
                    }
                });
            }
            else if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
                if (this.player.anims.currentAnim && 
                    this.player.anims.currentAnim.key === 'running') {
                    this.animator.playAnimation(this.player, 'idle');
                }
                else if (!this.player.anims.isPlaying) {
                    this.animator.playAnimation(this.player, 'idle');
                }
            }
        }
     }
}
