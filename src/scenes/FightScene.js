import * as Phaser from 'phaser';
import { CombatResultType, WinCondition, getEnumKeyByValue } from '../utils/combatDecoder';
import * as WebFont from 'webfontloader';
import { createPlayerAnimations } from '../animations/playerAnimations';
import { loadCharacterData } from '../utils/nftLoader';
import { loadCombatBytes } from '../utils/combatLoader';
import { CombatAnimator } from '../combat/combatAnimator';
import { CombatSequenceHandler } from '../combat/combatSequenceHandler';
import { VictoryHandler } from '../combat/victoryHandler';

export default class FightScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FightScene' });
        this.barConfig = {
            width: 200,
            height: 15,
            fillHeight: 16,
            padding: 2,
            y: 50,
            staminaGap: 8,
            p1x: 0,
            p2x: 0,
            textureWidth: 512,
            textureHeight: 64
        };
        this.combatData = null;
        this.SEQUENCE_DELAY = 1500;  // 2 seconds between actions
        this.COUNTER_DELAY = 1000;   // Additional 1 second for counter sequences
        this.INITIAL_DELAY = 1000;   // Kept the same
        this.countdownConfig = {
            fontSize: '120px',
            fontFamily: 'Bokor',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            duration: 750,
            scale: { from: 2, to: 0.5 },
            alpha: { from: 1, to: 0 }
        };

        // Add shared text style config
        this.titleTextConfig = {
            main: {
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
                    stroke: true
                }
            },
            shadow: {
                fontFamily: 'Bokor',
                fontSize: '144px',
                color: '#000000',
                alpha: 0.7
            },
            metallic: {
                fontFamily: 'Bokor',
                fontSize: '140px',
                color: '#ffffff'
            }
        };
        this.animator = null;
        this.sequenceHandler = null;
        this.victoryHandler = new VictoryHandler(this);
    }

    init(data) {
        this.player1Id = data.player1Id;
        this.player2Id = data.player2Id;
        this.player1Data = data.player1Data;
        this.player2Data = data.player2Data;

        // Remove async/await from init and move combat loading to create
        this.combatData = null;  // Initialize as null, will be loaded in create
    }

    async preload() {
        // Background and UI loading first
        this.load.image('sky', '/assets/backgrounds/forest2/Sky.png');
        this.load.image('bg-decor', '/assets/backgrounds/forest2/BG.png');
        this.load.image('middle-decor', '/assets/backgrounds/forest2/Middle.png');
        this.load.image('ground-02', '/assets/backgrounds/forest2/Ground_02.png');
        this.load.image('ground-01', '/assets/backgrounds/forest2/Ground_01.png');
        this.load.image('foreground', '/assets/backgrounds/forest2/Foreground.png');

        this.load.image('bar-bg', '/assets/ui/load_bar_bg.png');
        this.load.image('bar-fill-1', '/assets/ui/load_bar_1.png');
        this.load.image('bar-fill-2', '/assets/ui/load_bar_2.png');
        this.load.image('bar-fill-1-right', '/assets/ui/load_bar_1_right.png');
        this.load.image('bar-fill-2-right', '/assets/ui/load_bar_2_right.png');
        this.load.image('bar-dark', '/assets/ui/dark.png');

        // Load the spritesheets with explicit error handling
        if (this.player1Data?.spritesheetUrl && this.player1Data?.jsonData) {
            this.load.atlas('player1', this.player1Data.spritesheetUrl, this.player1Data.jsonData);
        }

        if (this.player2Data?.spritesheetUrl && this.player2Data?.jsonData) {
            this.load.atlas('player2', this.player2Data.spritesheetUrl, this.player2Data.jsonData);
        }

        // Add error handler for critical errors only
        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading file:', fileObj.key);
        });
    }

    async create() {
        try {
            // Add all layers in order with corrected depth and alpha FIRST
            const layers = [
                { key: 'sky', depth: 0, alpha: 0.75 },
                { key: 'bg-decor', depth: 1, alpha: 0.75 },
                { key: 'middle-decor', depth: 2, alpha: 0.8 },
                { key: 'foreground', depth: 3, alpha: 0.65 },
                { key: 'ground-01', depth: 4, alpha: 1 }
            ];

            // Add all layers with basic positioning and alpha
            layers.forEach(layer => {
                this.add.image(0, 0, layer.key)
                    .setOrigin(0, 0)
                    .setScale(0.5)
                    .setDepth(layer.depth)
                    .setAlpha(layer.alpha);
            });

            // THEN create sprites (only once)
            const groundY = 600;
            this.player = this.physics.add.sprite(125, groundY - 40, 'player1')
                .setFlipX(false)
                .setOrigin(0.5, 1)
                .setDisplaySize(300, 300)
                .setDepth(5);  // Make sure depth is set higher than background

            this.player2 = this.physics.add.sprite(835, groundY - 40, 'player2')
                .setFlipX(true)
                .setOrigin(0.5, 1)
                .setDisplaySize(300, 300)
                .setDepth(5);  // Make sure depth is set higher than background

            // After creating animations, force the origin for both sprites
            this.player.setOrigin(0.5, 1);
            this.player2.setOrigin(0.5, 1);

            // Before creating animations, ensure customData is set for both players
            if (this.player2Data?.jsonData) {
                const texture = this.textures.get('player2');
                const baseFrame = texture.get('__BASE');
                baseFrame.customData = this.player2Data.jsonData;
            }

            // Create animations for both players
            createPlayerAnimations(this, 'player1');
            createPlayerAnimations(this, 'player2', true);

            // Start with idle animations
            this.player.play('idle');
            this.player2.play('idle2');

            this.barConfig = {
                ...this.barConfig,
                width: 400,
                staminaWidth: 300,
                height: 26,
                staminaHeight: 15,
                fillHeight: 27,
                padding: 2,
                y: 50,
                labelPadding: 30,
                staminaGap: 8,
                p1x: this.cameras.main.centerX - 420,
                p2x: this.cameras.main.centerX + 20,
                nudgeFactor: 3
            };

            // Player 1 bars (right-aligned stamina, nudged left)
            this.p1Bars = {
                healthBg: this.add.image(this.barConfig.p1x, this.barConfig.y, 'bar-bg')
                    .setOrigin(0, 0)
                    .setDepth(98)
                    .setDisplaySize(this.barConfig.width, this.barConfig.height),
                healthFill: this.add.image(this.barConfig.p1x, this.barConfig.y, 'bar-fill-2')
                    .setOrigin(0, 0)
                    .setDepth(100)
                    .setDisplaySize(this.barConfig.width, this.barConfig.height),
                staminaBg: this.add.image(
                    (this.barConfig.p1x + this.barConfig.width - this.barConfig.staminaWidth) - this.barConfig.nudgeFactor,
                    this.barConfig.y + this.barConfig.height + this.barConfig.staminaGap,
                    'bar-bg'
                )
                    .setOrigin(0, 0)
                    .setDepth(98)
                    .setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight),
                staminaFill: this.add.image(
                    (this.barConfig.p1x + this.barConfig.width - this.barConfig.staminaWidth) - this.barConfig.nudgeFactor,
                    this.barConfig.y + this.barConfig.height + this.barConfig.staminaGap,
                    'bar-fill-1'
                )
                    .setOrigin(0, 0)
                    .setDepth(100)
                    .setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight),
                health: 100,
                stamina: 100
            };

            // Player 2 bars (left-aligned stamina, nudged right)
            this.p2Bars = {
                healthBg: this.add.image(this.barConfig.p2x, this.barConfig.y, 'bar-bg')
                    .setOrigin(0, 0)
                    .setDepth(98)
                    .setDisplaySize(this.barConfig.width, this.barConfig.height),
                healthFill: this.add.image(this.barConfig.p2x, this.barConfig.y, 'bar-fill-2-right')
                    .setOrigin(0, 0)
                    .setDepth(100)
                    .setDisplaySize(this.barConfig.width, this.barConfig.height),
                staminaBg: this.add.image(
                    this.barConfig.p2x + this.barConfig.nudgeFactor,
                    this.barConfig.y + this.barConfig.height + this.barConfig.staminaGap,
                    'bar-bg'
                )
                    .setOrigin(0, 0)
                    .setDepth(98)
                    .setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight),
                staminaFill: this.add.image(
                    this.barConfig.p2x + this.barConfig.nudgeFactor,
                    this.barConfig.y + this.barConfig.height + this.barConfig.staminaGap,
                    'bar-fill-1-right'
                )
                    .setOrigin(0, 0)
                    .setDepth(100)
                    .setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight),
                health: 100,
                stamina: 100
            };

            // Get the actual texture dimensions
            const fillTexture = this.textures.get('bar-fill-1');
            this.barConfig.textureWidth = fillTexture.source[0].width;
            this.barConfig.textureHeight = fillTexture.source[0].height;

            // Initial setup of crop rectangles using texture dimensions
            [this.p1Bars, this.p2Bars].forEach(bars => {
                bars.healthFill.setCrop(0, 0, this.barConfig.textureWidth, this.barConfig.textureHeight);
                bars.staminaFill.setCrop(0, 0, this.barConfig.textureWidth, this.barConfig.textureHeight);
            });

            // Enable physics
            this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);

            // Load combat bytes and decode first
            try {
                const combatData = await loadCombatBytes(this.player1Id, this.player2Id);
                console.log('Combat Data before assignment:', combatData);
                
                // Explicitly assign each property
                this.combatData = {
                    winner: combatData.winner,
                    condition: combatData.condition,
                    actions: [...combatData.actions]  // Create a new array copy
                };
                
                console.log('Combat Data after assignment:', this.combatData);

                if (!this.combatData?.actions?.length) {
                    throw new Error('No combat actions available');
                }

                // Update the x positions to be more centered
                this.barConfig.p1x = this.cameras.main.centerX - 420;  // Further left
                this.barConfig.p2x = this.cameras.main.centerX + 20;   // Keep right position

                // Add keyboard input
                this.fKey = this.input.keyboard.addKey('F');
                
                // Flag to prevent multiple triggers
                this.isFightSequencePlaying = false;

                // Store initial positions for reset functionality
                this.playerStartX = this.player.x;
                this.player2StartX = this.player2.x;

                // Define centerX for use in animations
                this.centerX = this.cameras.main.centerX;

                // Auto-start the fight sequence after a short delay
                this.time.delayedCall(1000, () => {
                    this.startFightSequence();
                });

                // Configure damage number style
                this.damageNumberConfig = {
                    fontSize: {
                        damage: '64px',
                        text: '52px'
                    },
                    fontFamily: 'Bokor',
                    duration: 1500,
                    rise: 200,
                    colors: {
                        damage: '#ff0000',
                        block: '#6666ff',
                        dodge: '#66ffff',
                        miss: '#ffffff',
                        counter: '#66ff66'
                    }
                };

                // Load fonts before creating text
                WebFont.load({
                    google: {
                        families: ['Bokor']
                    },
                    active: () => {
                        // Player labels - moved up 10px
                        this.add.text(this.barConfig.p1x + this.barConfig.width - 5, 
                            this.barConfig.y - this.barConfig.labelPadding - 10,  // Added extra 10px up
                            'PLAYER 1', 
                            {
                                fontFamily: 'Bokor',
                                fontSize: '32px',
                                color: '#ffffff',
                                stroke: '#000000',
                                strokeThickness: 4
                            }
                        )
                        .setOrigin(1, 0)
                        .setDepth(98);

                        this.add.text(this.barConfig.p2x + 5, 
                            this.barConfig.y - this.barConfig.labelPadding - 10,  // Added extra 10px up
                            'PLAYER 2', 
                            {
                                fontFamily: 'Bokor',
                                fontSize: '32px',
                                color: '#ffffff',
                                stroke: '#000000',
                                strokeThickness: 4
                            }
                        )
                        .setOrigin(0, 0)
                        .setDepth(98);
                    }
                });

                // Add R key for reset with proper configuration
                this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
                
                // Initialize fight sequence flag
                this.isFightSequencePlaying = false;
            } catch (error) {
                console.error('Error loading combat data:', error);
            }
        } catch (error) {
            console.error('Error in create method:', error);
        }
        this.animator = new CombatAnimator(this);
        console.log('Animator created:', this.animator); // Debug log
        
        this.sequenceHandler = new CombatSequenceHandler(this);
        
        this.victoryHandler = new VictoryHandler(this);
        console.log('Victory Handler created:', this.victoryHandler); // Debug log
        
        // Remove any existing listeners first
        this.events.removeListener('fightComplete');
        
        this.events.once('fightComplete', () => {
            console.log('FightComplete event triggered'); // Debug log
            const winningPlayerId = this.combatData.winner;
            console.log('Winner ID:', winningPlayerId); // Debug log
            
            if (!this.victoryHandler) {
                console.error('No victory handler!');
                return;
            }
            
            if (!this.animator) {
                console.error('No animator!');
                return;
            }
            
            console.log('Calling handleVictory with:', {
                winningPlayerId,
                player1: this.player,
                player2: this.player2,
                hasAnimator: !!this.animator
            });
            
            this.victoryHandler.handleVictory(winningPlayerId, this.player, this.player2);
        });
    }

    update() {
        // Check if keyboard exists before using it
        if (!this.rKey) return;  // Early return if keyboard isn't initialized yet

        // Simplified R key check without debug logging
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.resetFight();
        }

        // Check if players exist before updating their depths
        if (!this.player || !this.player2) return;

        // Dynamic depth adjustment based on who's attacking
        if (this.player.anims?.currentAnim?.key === 'attacking' ||
            this.player.anims?.currentAnim?.key === 'blocking') {
            this.player.setDepth(6);
            this.player2.setDepth(5);
        } else if (this.player2.anims?.currentAnim?.key === 'attacking2' ||
                   this.player2.anims?.currentAnim?.key === 'blocking2') {
            this.player2.setDepth(6);
            this.player.setDepth(5);
        } else {
            // Reset to default depth
            this.player.setDepth(5);
            this.player2.setDepth(5);
        }

        // Check if fKey exists before using it
        if (this.fKey && this.fKey.isDown && !this.isFightSequencePlaying) {
            this.startFightSequence();
        }
    }

    startFightSequence() {
        if (this.isFightSequencePlaying) {
            return;
        }

        console.log('Fight sequence started');
        this.isFightSequencePlaying = true;
        
        // Start countdown sequence
        this.startCountdown().then(() => {
            console.log('Countdown finished, starting combat');
            // Initial run to center
            this.animator.playAnimation(this.player, 'running');
            this.animator.playAnimation(this.player2, 'running', true);

            // Move players to center
            const moveToCenter = [
                this.tweens.add({
                    targets: this.player,
                    x: this.centerX - 75,
                    duration: 1000,
                    onComplete: () => {
                        this.animator.playAnimation(this.player, 'idle');
                    }
                }),
                this.tweens.add({
                    targets: this.player2,
                    x: this.centerX + 75,
                    duration: 1000,
                    onComplete: () => {
                        this.animator.playAnimation(this.player2, 'idle', true);
                        // Start combat sequence after both players are in position
                        if (this.combatData && this.combatData.actions) {
                            console.log('Starting combat sequence');
                            this.time.delayedCall(500, () => {
                                this.playCombatSequence(0);  // Start from first action
                            });
                        } else {
                            console.error('No combat data available');
                        }
                    }
                })
            ];
        });
    }

    // Add new countdown method
    startCountdown() {
        return new Promise(resolve => {
            const numbers = ['3', '2', '1', 'Fight!'];
            let index = 0;

            const showNumber = () => {
                if (index >= numbers.length) {
                    resolve();
                    return;
                }

                const number = numbers[index];
                const scale = number === 'Fight!' ? 1.25 : 2;
                const texts = this.createStyledText(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY,
                    number,
                    scale
                );

                // Set initial state
                [texts.shadowText, texts.mainText, texts.metalGradient].forEach(text => {
                    text.setAlpha(0);
                    text.setDepth(100);
                });

                if (number === 'Fight!') {
                    // Special animation for "Fight!"
                    this.tweens.add({
                        targets: [texts.shadowText, texts.mainText, texts.metalGradient],
                        alpha: {
                            from: 0,
                            to: (target) => target === texts.metalGradient ? 0.3 : target === texts.shadowText ? 0.7 : 1
                        },
                        scale: {
                            from: scale * 1.5,
                            to: scale
                        },
                        duration: 500,
                        ease: 'Back.out',
                        onComplete: () => {
                            this.time.delayedCall(750, () => {
                                this.tweens.add({
                                    targets: [texts.shadowText, texts.mainText, texts.metalGradient],
                                    alpha: 0,
                                    scale: scale * 0.8,
                                    duration: 500,
                                    ease: 'Power2',
                                    onComplete: () => {
                                        texts.shadowText.destroy();
                                        texts.mainText.destroy();
                                        texts.metalGradient.destroy();
                                        index++;
                                        showNumber();
                                    }
                                });
                            });
                        }
                    });
                } else {
                    // Numbers animation
                    this.tweens.add({
                        targets: [texts.shadowText, texts.mainText, texts.metalGradient],
                        alpha: {
                            from: 0,
                            to: (target) => target === texts.metalGradient ? 0.3 : target === texts.shadowText ? 0.7 : 1
                        },
                        scale: {
                            from: scale * 1.5,
                            to: scale * 0.5
                        },
                        duration: this.countdownConfig.duration,
                        ease: 'Power2',
                        onComplete: () => {
                            texts.shadowText.destroy();
                            texts.mainText.destroy();
                            texts.metalGradient.destroy();
                            index++;
                            showNumber();
                        }
                    });
                }
            };

            showNumber();
        });
    }

    // Add helper method for creating styled text
    createStyledText(x, y, text, scale = 1) {
        const shadowText = this.add.text(x + 4, y, text, this.titleTextConfig.shadow)
            .setOrigin(0.5)
            .setScale(scale);

        const mainText = this.add.text(x, y, text, this.titleTextConfig.main)
            .setOrigin(0.5)
            .setScale(scale);

        const metalGradient = this.add.text(x, y, text, this.titleTextConfig.metallic)
            .setOrigin(0.5)
            .setAlpha(0.3)
            .setScale(scale);

        return { shadowText, mainText, metalGradient };
    }

    playCombatSequence(actionIndex) {
        console.log('Playing combat sequence:', actionIndex);
        const action = this.combatData.actions[actionIndex];
        console.log('Current action:', action);
        
        const isLastAction = actionIndex === this.combatData.actions.length - 1;
        
        // Use the sequence handler
        this.sequenceHandler.handleSequence(action, isLastAction);

        // Listen for sequence completion
        this.events.once('sequenceComplete', (isLast) => {
            if (!isLast) {
                console.log('Scheduling next action...');
                this.time.delayedCall(this.SEQUENCE_DELAY, () => {
                    console.log('Moving to next action:', actionIndex + 1);
                    this.playCombatSequence(actionIndex + 1);
                });
            }
        });
    }

    startVictorySequence(winner, playerType) {
        const isPlayer2 = playerType === 'player2';
        const suffix = isPlayer2 ? '2' : '';
        const originalX = winner.x;
        
        const walkDistance = 300;
        const walkDuration = 3000;
        const finalPosition = isPlayer2 ? originalX + walkDistance : originalX - walkDistance;
        const halfwayPoint = isPlayer2 ? originalX + (walkDistance/2) : originalX - (walkDistance/2);
        
        this.time.delayedCall(1000, () => {
            winner.setFlipX(!isPlayer2);
            
            // Use the existing walking animation configuration
            this.animator.playAnimation(winner, 'walking', isPlayer2);
            
            const sequence = [
                {
                    targets: winner,
                    x: halfwayPoint,
                    duration: walkDuration/2,
                    ease: 'Linear'
                },
                {
                    targets: winner,
                    x: halfwayPoint,
                    duration: 800,
                    onStart: () => {
                        this.animator.playAnimation(winner, 'dodging', isPlayer2);
                    },
                    onComplete: () => {
                        // Resume walking animation using existing configuration
                        this.animator.playAnimation(winner, 'walking', isPlayer2);
                    }
                },
                {
                    targets: winner,
                    x: finalPosition,
                    duration: walkDuration/2,
                    ease: 'Linear',
                    onComplete: () => {
                        this.animator.playAnimation(winner, 'idle', isPlayer2);
                        this.time.delayedCall(500, () => {
                            this.playTauntSequence(winner, suffix);
                        });
                    }
                }
            ];

            this.tweens.chain({
                tweens: sequence
            });
        });
    }

    // Simplified taunt sequence
    playTauntSequence(winner, suffix, count = 0) {
        if (count >= 3) {
            this.animator.playAnimation(winner, 'idle', suffix === '2');
            return;
        }

        this.animator.playAnimation(winner, 'taunting', suffix === '2');
        winner.once('animationcomplete', () => {
            this.animator.playAnimation(winner, 'idle', suffix === '2');
            this.time.delayedCall(800, () => {
                this.playTauntSequence(winner, suffix, count + 1);
            });
        });
    }

    showDamageNumber(x, y, value, type = 'damage', scale = 1.0) {
        const color = this.damageNumberConfig.colors[type];
        const fontSize = typeof value === 'number' 
            ? this.damageNumberConfig.fontSize.damage 
            : this.damageNumberConfig.fontSize.text;

        const text = this.add.text(x, y - 50, value, {
            fontSize: fontSize,
            fontFamily: this.damageNumberConfig.fontFamily,
            color: color,
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        })
        .setOrigin(0.5, 0.5)
        .setDepth(100)
        .setScale(scale);

        // Add rise-and-fade animation
        this.tweens.add({
            targets: text,
            y: y - this.damageNumberConfig.rise - 50,
            alpha: 0,
            duration: this.damageNumberConfig.duration,
            ease: 'Power1',
            onComplete: () => {
                text.destroy();
            }
        });
    }

    updateHealthBars() {
        // Player 1 health bar (depleting from left side towards center)
        const p1HealthWidth = Math.floor(this.barConfig.textureWidth * (this.p1Bars.health / 100));
        const p1StaminaWidth = Math.floor(this.barConfig.textureWidth * (this.p1Bars.stamina / 100));
        
        this.p1Bars.healthFill.setDisplaySize(this.barConfig.width, this.barConfig.height);
        this.p1Bars.staminaFill.setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight);
        
        // Player 1 crops from left to right
        this.p1Bars.healthFill.setCrop(
            this.barConfig.textureWidth - p1HealthWidth,
            0,
            p1HealthWidth,
            this.barConfig.textureHeight
        );
        
        // Player 2 health bar (depleting from right side towards center)
        const p2HealthWidth = Math.floor(this.barConfig.textureWidth * (this.p2Bars.health / 100));
        const p2StaminaWidth = Math.floor(this.barConfig.textureWidth * (this.p2Bars.stamina / 100));
        
        this.p2Bars.healthFill.setDisplaySize(this.barConfig.width, this.barConfig.height);
        this.p2Bars.staminaFill.setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight);
        
        // Player 2 crops from right to left (reversed)
        this.p2Bars.healthFill.setCrop(
            0,  // Start from left edge
            0,
            p2HealthWidth,  // Only show the amount of health remaining
            this.barConfig.textureHeight
        );
        
        // Adjust the position of player 2's health fill to align with the right edge
        // this.p2Bars.healthFill.x = this.barConfig.p2x + this.barConfig.width - p2HealthWidth; // Remove this line
    }

    updateStaminaBars() {
        // Player 1 stamina (depleting left to right)
        const currentAction = this.combatData.actions[this.currentActionIndex];
        if (currentAction) {
            this.p1Bars.stamina -= currentAction.p1StaminaLost;
            this.p2Bars.stamina -= currentAction.p2StaminaLost;
        }

        // Update the stamina bar displays
        const p1StaminaWidth = Math.floor(this.barConfig.textureWidth * (this.p1Bars.stamina / 100));
        const p2StaminaWidth = Math.floor(this.barConfig.textureWidth * (this.p2Bars.stamina / 100));
        
        // Rest of the stamina bar update logic...
    }

    // Add a proper reset method
    resetFight() {
        this.isFightSequencePlaying = false;
        
        // Reset players to initial positions
        this.player.x = this.playerStartX;
        this.player2.x = this.player2StartX;
        
        // Reset animations
        this.animator.playAnimation(this.player, 'idle');
        this.animator.playAnimation(this.player2, 'idle', true);
        
        // Clear any ongoing tweens
        this.tweens.killAll();
        
        // Start a new sequence
        this.time.delayedCall(500, () => {
            this.startFightSequence();
        });
    }

    playVictoryAnimation(player) {
        const suffix = player === this.player2 ? '2' : '';
        player.isPlayingOneShot = true;

        const playNextAnimation = (animations) => {
            if (animations.length === 0) {
                this.animator.playAnimation(player, 'idle', suffix === '2');
                player.isPlayingOneShot = false;
                return;
            }

            const currentAnim = animations[0];
            const remainingAnims = animations.slice(1);

            // Make sure we append suffix to both the main animation and walking transition
            const currentAnimKey = currentAnim + suffix;
            const walkingAnimKey = 'walking' + suffix;

            this.animator.playAnimation(player, currentAnimKey, suffix === '2');
            player.once('animationcomplete', () => {
                // Use walking animation with correct suffix
                this.animator.playAnimation(player, walkingAnimKey, suffix === '2');
                player.scene.time.delayedCall(200, () => {
                    playNextAnimation(remainingAnims);
                });
            });
        };

        // Start the sequence
        playNextAnimation(['attacking', 'blocking', 'dodging']);
    }

    initializePlayers() {
        // Example setup for player1
        this.player1 = this.add.sprite(100, 100, 'player1SpriteKey');
        this.anims.create({
            key: 'attackAnimation',
            frames: this.anims.generateFrameNumbers('player1SpriteKey', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.player1.anims.load('attackAnimation');
        
        // Ensure player2 is set up similarly
        // ... existing player2 setup ...
    }

    startVictoryLap(winner, isPlayer2) {
        console.log('Starting victory lap for', isPlayer2 ? 'Player 2' : 'Player 1');
        
        // Play victory animation
        winner.play('victory');
        
        // After victory animation, start walking
        winner.once('animationcomplete', () => {
            console.log('Victory animation complete, starting walk');
            winner.play('walking');
            
            // Move the winner across the screen
            this.tweens.add({
                targets: winner,
                x: isPlayer2 ? -100 : this.game.config.width + 100,
                duration: 2000,
                ease: 'Linear',
                onComplete: () => {
                    console.log('Victory lap complete');
                    this.events.emit('victoryComplete');
                }
            });
        });
    }
}

