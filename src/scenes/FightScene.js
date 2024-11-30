import * as Phaser from 'phaser';
import { decodeCombatLog } from '../utils/combatDecoder';
import * as WebFont from 'webfontloader';
import { createPlayerAnimations } from '../animations/playerAnimations';

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
        this.SEQUENCE_DELAY = 2500;  // Changed from 1500 to 2500
        this.COUNTER_DELAY = 1250;   // Changed from 750 to 1250 (half of SEQUENCE_DELAY)
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
    }

    init(data) {
        if (data.combatLog) {
            try {
                this.combatData = decodeCombatLog(data.combatLog);
            } catch (error) {
                console.error('Error decoding combat log:', error);
            }
        }
    }

    preload() {
        // Load assets silently without debug messages
        this.load.on('filecomplete', () => {
            // Removed debug logging
        });

        // Load background layers
        this.load.image('sky', '/assets/backgrounds/forest2/Sky.png');
        this.load.image('bg-decor', '/assets/backgrounds/forest2/BG.png');
        this.load.image('middle-decor', '/assets/backgrounds/forest2/Middle.png');
        this.load.image('ground-02', '/assets/backgrounds/forest2/Ground_02.png');
        this.load.image('ground-01', '/assets/backgrounds/forest2/Ground_01.png');
        this.load.image('foreground', '/assets/backgrounds/forest2/Foreground.png');
        
        // Load player 1 assets (knight1)
        this.load.json('knight1Data', 'assets/characters/knight1/player.json');
        this.load.atlas(
            'knight1',
            'assets/characters/knight1/player.png',
            'assets/characters/knight1/player.json'
        );

        // Load player 2 assets (knight2)
        this.load.json('knight2Data', 'assets/characters/knight2/player.json');
        this.load.atlas(
            'knight2',
            'assets/characters/knight2/player.png',
            'assets/characters/knight2/player.json'
        );

        // Load health/stamina bar assets
        this.load.image('bar-bg', '/assets/ui/load_bar_bg.png');
        this.load.image('bar-fill-1', '/assets/ui/load_bar_1.png');
        this.load.image('bar-fill-2', '/assets/ui/load_bar_2.png');
        this.load.image('bar-fill-1-right', '/assets/ui/load_bar_1_right.png');
        this.load.image('bar-fill-2-right', '/assets/ui/load_bar_2_right.png');
        this.load.image('bar-dark', '/assets/ui/dark.png');
    }

    create() {
        // Create animations for both players without clearing
        createPlayerAnimations(this, 'knight1');
        createPlayerAnimations(this, 'knight2');

        // Create player sprites
        this.player = this.add.sprite(125, 425, 'knight1')
            .setFlipX(false);  // Ensure player 1 faces right
        this.player2 = this.add.sprite(835, 425, 'knight2')
            .setFlipX(true);   // Ensure player 2 faces left

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

        // Add all layers in order with corrected depth and alpha
        const layers = [
            { key: 'sky', depth: 0, alpha: 0.75 },
            { key: 'bg-decor', depth: 1, alpha: 0.75 },
            { key: 'middle-decor', depth: 2, alpha: 0.8 },
            { key: 'foreground', depth: 3, alpha: 0.65 },
            { key: 'ground-01', depth: 4, alpha: 1 }  // Keep ground fully opaque
        ];

        // Add all layers with basic positioning and alpha
        layers.forEach(layer => {
            this.add.image(0, 0, layer.key)
                .setOrigin(0, 0)
                .setScale(0.5)
                .setDepth(layer.depth)
                .setAlpha(layer.alpha);
        });

        // Update the x positions to be more centered
        this.barConfig.p1x = this.cameras.main.centerX - 420;  // Further left
        this.barConfig.p2x = this.cameras.main.centerX + 20;   // Keep right position

        // Add keyboard input
        this.fKey = this.input.keyboard.addKey('F');
        
        // Flag to prevent multiple triggers
        this.isFightSequencePlaying = false;

        // Store initial positions
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
    }

    update() {
        // Simplified R key check without debug logging
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.resetFight();
        }

        // Dynamic depth adjustment based on who's attacking
        if (this.player.anims.currentAnim?.key === 'attacking' ||  // Changed from 'slashing'
            this.player.anims.currentAnim?.key === 'blocking') {   // Changed from 'kicking'
            this.player.setDepth(6);
            this.player2.setDepth(5);
        } else if (this.player2.anims.currentAnim?.key === 'attacking2' ||  // Changed from 'slashing2'
                   this.player2.anims.currentAnim?.key === 'blocking2') {   // Changed from 'kicking2'
            this.player2.setDepth(6);
            this.player.setDepth(5);
        } else {
            // Reset to default depth
            this.player.setDepth(5);
            this.player2.setDepth(5);
        }

        if (this.fKey.isDown && !this.isFightSequencePlaying) {
            this.startFightSequence();
        }
    }

    startFightSequence() {
        if (this.isFightSequencePlaying || !this.combatData) {
            return;
        }

        this.isFightSequencePlaying = true;
        
        // Start countdown sequence
        this.startCountdown().then(() => {
            // Initial run to center (moved from original startFightSequence)
            this.player.play('running');
            this.player2.play('running2');

            // Move players to center
            const moveToCenter = [
                this.tweens.add({
                    targets: this.player,
                    x: this.centerX - 75,
                    duration: 1000
                }),
                this.tweens.add({
                    targets: this.player2,
                    x: this.centerX + 75,
                    duration: 1000
                })
            ];

            // Rest of the existing startFightSequence code...
            Promise.all(moveToCenter.map(tween => new Promise(resolve => tween.once('complete', resolve))))
                .then(() => {
                    this.player.play('idle');
                    this.player2.play('idle2');
                    
                    this.time.delayedCall(this.INITIAL_DELAY, () => {
                        this.playCombatSequence(0);
                    });
                });
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
        const action = this.combatData.actions[actionIndex];
        const isLastAction = actionIndex === this.combatData.actions.length - 1;
        let animationTriggered = false;

        // Handle Player 1's MISS + Player 2's COUNTER sequence
        if (action.p1Result === 'MISS' && action.p2Result === 'COUNTER') {
            animationTriggered = true;
            // First: Player 1's missed attack and MISS text
            this.player.play('attacking');
            this.showDamageNumber(this.player.x, this.player.y - 50, 'Miss', 'miss');

            // Handle Player 1's slash animation completion
            this.player.once('animationcomplete', () => {
                // Immediately start counter sequence
                this.showDamageNumber(this.player2.x, this.player2.y - 50, 'Counter', 'counter');
                this.player2.play('attacking2');
                
                // Short delay before damage
                this.time.delayedCall(400, () => {
                    this.player.play('hurt');
                    this.showDamageNumber(this.player.x, this.player.y - 50, action.p2Damage, 'damage');
                    
                    // Handle hurt animation completion and potential death
                    this.player.once('animationcomplete', () => {
                        if (isLastAction && this.combatData.winner === 2) {
                            this.time.delayedCall(400, () => {
                                this.player.play('dying');
                            });
                        } else if (!isLastAction) {
                            this.player.play('idle');
                        }
                    });
                });

                this.player2.once('animationcomplete', () => {
                    this.player2.play('idle2');
                });
            });
        }
        // Handle dodge sequences - add MISS for attacker
        else if (action.p2Result === 'DODGE') {
            animationTriggered = true;
            this.player.play('attacking');
            this.showDamageNumber(this.player.x, this.player.y - 50, 'Miss', 'miss');
            this.player2.play('dodging2');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, 'Dodge', 'dodge');
        }
        else if (action.p1Result === 'DODGE') {
            animationTriggered = true;
            this.player2.play('attacking2');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, 'Miss', 'miss');
            this.player.play('dodging');
            this.showDamageNumber(this.player.x, this.player.y - 50, 'Dodge', 'dodge');
        }
        // Handle Player 2's MISS + Player 1's COUNTER sequence that ends the fight
        else if (action.p2Result === 'MISS' && action.p1Result === 'COUNTER' && isLastAction) {
            animationTriggered = true;
            this.player2.play('attacking2');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, 'Miss', 'miss');

            this.player2.once('animationcomplete', () => {
                // Immediately start counter sequence
                this.showDamageNumber(this.player.x, this.player.y - 50, 'Counter', 'counter');
                this.player.play('attacking');
                
                this.time.delayedCall(400, () => {
                    this.player2.play('hurt2');
                    this.showDamageNumber(this.player2.x, this.player2.y - 50, action.p1Damage, 'damage');
                    
                    // Wait for hurt animation to complete before dying
                    this.player2.once('animationcomplete', () => {
                        this.player2.play('dying2');
                    });
                });
            });
        }
        // Handle regular MISS animations (not part of counter)
        else if (action.p1Result === 'MISS' && action.p2Result !== 'DODGE' && action.p2Result !== 'BLOCK') {
            animationTriggered = true;
            this.player.play('attacking');
            this.showDamageNumber(this.player.x, this.player.y - 50, 'Miss', 'miss');
            
            this.player.once('animationcomplete', () => {
                this.player.play('idle');
            });
        }
        else if (action.p2Result === 'MISS' && action.p1Result !== 'DODGE' && action.p1Result !== 'BLOCK') {
            animationTriggered = true;
            this.player2.play('attacking2');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, 'Miss', 'miss');
            
            this.player2.once('animationcomplete', () => {
                this.player2.play('idle2');
            });
        }

        // Handle Attack + Block sequence for Player 2 blocking
        else if (action.p1Result === 'ATTACK' && action.p2Result === 'BLOCK') {
            animationTriggered = true;
            this.player.play('attacking');
            this.time.delayedCall(400, () => {
                this.player2.play('blocking2');
                this.showDamageNumber(this.player2.x, this.player2.y - 50, 'Block', 'block');
            });
        }
        // Add new condition for Player 1 blocking
        else if (action.p1Result === 'BLOCK' && action.p2Result === 'ATTACK') {
            animationTriggered = true;
            this.player2.play('attacking2');
            this.time.delayedCall(400, () => {
                this.player.play('blocking');
                this.showDamageNumber(this.player.x, this.player.y - 50, 'Block', 'block');
            });
        }
        // Handle regular attacks
        else if (action.p1Result === 'ATTACK' && action.p1Damage > 0) {
            animationTriggered = true;
            this.player.play('attacking');
            this.showDamageNumber(this.player.x, this.player.y - 50, 'Hit', 'miss');  // Back to normal HIT
            this.time.delayedCall(400, () => {
                this.showDamageNumber(this.player2.x, this.player2.y - 50, action.p1Damage, 'damage');
                this.player2.play('hurt2');
            });
        }
        else if (action.p2Result === 'ATTACK' && action.p2Damage > 0) {
            animationTriggered = true;
            this.player2.play('attacking2');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, 'Hit', 'miss');  // Back to normal HIT
            this.time.delayedCall(400, () => {
                this.showDamageNumber(this.player.x, this.player.y - 50, action.p2Damage, 'damage');
                this.player.play('hurt');
            });
        }

        // If no animation was triggered, show the ??? symbol
        if (!animationTriggered) {
            console.warn('Unknown combat sequence:', action);
            this.showDamageNumber(this.cameras.main.centerX, this.cameras.main.centerY - 50, '???', 'miss');
        }

        // Handle animation completion for both players
        this.player.once('animationcomplete', () => {
            if (isLastAction && this.combatData.winner === 2 && action.p1Result !== 'COUNTER') {
                this.player.play('dying');
            } else if (this.player.anims.currentAnim.key !== 'dying') {
                this.player.play('idle');
            }
        });

        this.player2.once('animationcomplete', () => {
            if (isLastAction && this.combatData.winner === 1 && action.p2Result !== 'MISS') {
                this.player2.play('dying2');
            } else if (this.player2.anims.currentAnim.key !== 'dying2') {
                this.player2.play('idle2');
            }
        });

        // Continue to next action
        if (!isLastAction) {
            const delay = (action.p2Result === 'BLOCK' || action.p1Result === 'COUNTER' || 
                          action.p2Result === 'COUNTER' || action.p1Result === 'BLOCK')
                ? this.SEQUENCE_DELAY + this.COUNTER_DELAY 
                : this.SEQUENCE_DELAY;
            this.time.delayedCall(delay, () => {
                this.playCombatSequence(actionIndex + 1);
            });
        }

        // Add this at the end of the last action
        if (isLastAction) {
            // Wait a bit after death animation
            this.time.delayedCall(1500, () => {
                // Player 1 wins
                if (this.combatData.winner === 1) {
                    this.startVictorySequence(this.player, 'player1');
                }
                // Player 2 wins
                else if (this.combatData.winner === 2) {
                    this.startVictorySequence(this.player2, 'player2');
                }
            });
        }
    }

    startVictorySequence(winner, playerType) {
        const isPlayer2 = playerType === 'player2';
        const suffix = isPlayer2 ? '2' : '';
        const originalX = winner.x;
        
        // Configure distances and timings
        const walkDistance = 200;  // Reduced from 300 to stay further from edge
        const walkDuration = 2000;
        const finalPosition = isPlayer2 ? originalX + walkDistance : originalX - walkDistance;
        const halfwayPoint = isPlayer2 ? originalX + (walkDistance/2) : originalX - (walkDistance/2);
        
        // Start sequence after combat ends (reduced initial delay)
        this.time.delayedCall(1000, () => {
            // Turn and walk away
            winner.setFlipX(!isPlayer2);
            winner.play('walking' + suffix);
            
            // Walk to halfway point, dodge, then continue walking
            this.tweens.add({
                targets: winner,
                x: halfwayPoint,
                duration: walkDuration/2,
                ease: 'Linear',
                onComplete: () => {
                    // Perform dodge animation
                    winner.play('dodging' + suffix);
                    
                    winner.once('animationcomplete', () => {
                        // Continue walking to final position
                        winner.play('walking' + suffix);
                        
                        this.tweens.add({
                            targets: winner,
                            x: finalPosition,
                            duration: walkDuration/2,
                            ease: 'Linear',
                            onComplete: () => {
                                // Stop and prepare for taunts
                                winner.play('idle' + suffix);
                                
                                // Perform three taunts with pauses between
                                const performTaunt = (tauntNumber) => {
                                    if (tauntNumber >= 3) {
                                        // After all taunts, return to idle
                                        winner.play('idle' + suffix);
                                        return;
                                    }
                                    
                                    this.time.delayedCall(800, () => {
                                        winner.play('taunting' + suffix);
                                        
                                        // Wait for taunt animation to complete
                                        winner.once('animationcomplete', () => {
                                            winner.play('idle' + suffix);
                                            performTaunt(tauntNumber + 1);
                                        });
                                    });
                                };
                                
                                // Start the taunt sequence
                                performTaunt(0);
                            }
                        });
                    });
                }
            });

            // Add Victory text with same styling as before
            const victoryText = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY - 40,
                'Victory',
                {
                    fontFamily: 'Bokor',
                    fontSize: '120px',
                    color: '#ff3333',
                    stroke: '#000000',
                    strokeThickness: 8,
                    align: 'center'
                }
            )
            .setOrigin(0.5)
            .setDepth(100)
            .setAlpha(0);

            // Fade in Victory text
            this.tweens.add({
                targets: victoryText,
                alpha: 1,
                duration: 1000,
                ease: 'Power1',
                onComplete: () => {
                    // Add Player text below
                    const playerText = this.add.text(
                        this.cameras.main.centerX,
                        this.cameras.main.centerY + 40,
                        `Player ${isPlayer2 ? '2' : '1'}`,
                        {
                            fontFamily: 'Bokor',
                            fontSize: '60px',
                            color: '#ff3333',
                            stroke: '#000000',
                            strokeThickness: 6,
                            align: 'center'
                        }
                    )
                    .setOrigin(0.5)
                    .setDepth(100)
                    .setAlpha(0);

                    // Slide in and fade in player text
                    this.tweens.add({
                        targets: playerText,
                        alpha: 1,
                        x: {
                            from: this.cameras.main.centerX - 100,
                            to: this.cameras.main.centerX
                        },
                        duration: 800,
                        ease: 'Power2'
                    });
                }
            });
        });
    }

    showDamageNumber(x, y, value, type = 'damage') {
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
        .setDepth(100);

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
        const p1StaminaWidth = Math.floor(this.barConfig.textureWidth * (this.p1Bars.stamina / 100));
        this.p1Bars.staminaFill.setCrop(
            this.barConfig.textureWidth - p1StaminaWidth,
            0,
            p1StaminaWidth,
            this.barConfig.textureHeight
        ).setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight);

        // Player 2 stamina (depleting right to left)
        const p2StaminaWidth = Math.floor(this.barConfig.textureWidth * (this.p2Bars.stamina / 100));
        this.p2Bars.staminaFill.setCrop(
            0,
            0,
            p2StaminaWidth,
            this.barConfig.textureHeight
        ).setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight);
    }

    // Add a proper reset method
    resetFight() {
        this.isFightSequencePlaying = false;
        
        // Reset players to initial positions
        this.player.x = this.playerStartX;
        this.player2.x = this.player2StartX;
        
        // Reset animations
        this.player.play('idle');
        this.player2.play('idle2');
        
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
                player.play('idle' + suffix);
                player.isPlayingOneShot = false;
                return;
            }

            const currentAnim = animations[0];
            const remainingAnims = animations.slice(1);

            // Make sure we append suffix to both the main animation and walking transition
            const currentAnimKey = currentAnim + suffix;
            const walkingAnimKey = 'walking' + suffix;

            player.play(currentAnimKey);
            player.once('animationcomplete', () => {
                // Use walking animation with correct suffix
                player.play(walkingAnimKey);
                player.scene.time.delayedCall(200, () => {
                    playNextAnimation(remainingAnims);
                });
            });
        };

        // Start the sequence
        playNextAnimation(['attacking', 'blocking', 'dodging']);
    }
}

