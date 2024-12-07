import * as Phaser from 'phaser';
import { createPlayerAnimations } from '../animations/playerAnimations';
import { loadCombatBytes } from '../utils/combatLoader';
import { CombatAnimator } from '../combat/combatAnimator';
import { CombatSequenceHandler } from '../combat/combatSequenceHandler';
import { VictoryHandler } from '../combat/victoryHandler';
import { HealthManager } from '../combat/healthManager';
import { DebugHealthManager } from '../combat/debugHealthManager';
import { DamageNumbers } from '../ui/damageNumbers';

export default class FightScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FightScene' });
        // Combat timing constants
        this.SEQUENCE_DELAY = 1500;
        this.COUNTER_DELAY = 750;
        this.INITIAL_DELAY = 500;
        this.USE_DEBUG = false;

        // UI Configurations
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

        this.titleTextConfig = {
            main: {
                fontFamily: 'Bokor',
                fontSize: '140px',
                color: '#ffd700',
                stroke: '#8b0000',
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
        this.player1Id = data.player1Id;
        this.player2Id = data.player2Id;
        this.player1Data = data.player1Data;
        this.player2Data = data.player2Data;
    }

    preload() {
        // Background assets
        const backgrounds = [
            { key: 'sky', path: '/assets/backgrounds/forest2/Sky.png' },
            { key: 'bg-decor', path: '/assets/backgrounds/forest2/BG.png' },
            { key: 'middle-decor', path: '/assets/backgrounds/forest2/Middle.png' },
            { key: 'ground-02', path: '/assets/backgrounds/forest2/Ground_02.png' },
            { key: 'ground-01', path: '/assets/backgrounds/forest2/Ground_01.png' },
            { key: 'foreground', path: '/assets/backgrounds/forest2/Foreground.png' }
        ];

        // UI assets
        const uiElements = [
            { key: 'bar-bg', path: '/assets/ui/load_bar_bg.png' },
            { key: 'bar-fill-1', path: '/assets/ui/load_bar_1.png' },
            { key: 'bar-fill-2', path: '/assets/ui/load_bar_2.png' },
            { key: 'bar-fill-1-right', path: '/assets/ui/load_bar_1_right.png' },
            { key: 'bar-fill-2-right', path: '/assets/ui/load_bar_2_right.png' },
            { key: 'bar-dark', path: '/assets/ui/dark.png' }
        ];

        // Load all assets
        [...backgrounds, ...uiElements].forEach(asset => {
            this.load.image(asset.key, asset.path);
        });

        // Load player spritesheets
        if (this.player1Data?.spritesheetUrl && this.player1Data?.jsonData) {
            this.load.atlas('player1', this.player1Data.spritesheetUrl, this.player1Data.jsonData);
        }
        if (this.player2Data?.spritesheetUrl && this.player2Data?.jsonData) {
            this.load.atlas('player2', this.player2Data.spritesheetUrl, this.player2Data.jsonData);
        }

        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading file:', fileObj.key);
        });
    }

    async create() {
        // 1. Scene Setup - Background Layers
        const layers = [
            { key: 'sky', depth: 0, alpha: 0.75 },
            { key: 'bg-decor', depth: 1, alpha: 0.75 },
            { key: 'middle-decor', depth: 2, alpha: 0.8 },
            { key: 'foreground', depth: 3, alpha: 0.65 },
            { key: 'ground-01', depth: 4, alpha: 1 }
        ];

        layers.forEach(layer => {
            this.add.image(0, 0, layer.key)
                .setOrigin(0, 0)
                .setScale(0.5)
                .setDepth(layer.depth)
                .setAlpha(layer.alpha);
        });

        // 2. Player Setup
        const groundY = 600;
        this.player = this.physics.add.sprite(125, groundY - 40, 'player1')
            .setFlipX(false)
            .setOrigin(0.5, 1)
            .setDisplaySize(300, 300)
            .setDepth(5);

        this.player2 = this.physics.add.sprite(835, groundY - 40, 'player2')
            .setFlipX(true)
            .setOrigin(0.5, 1)
            .setDisplaySize(300, 300)
            .setDepth(5);

        // 3. Animation Setup
        if (this.player2Data?.jsonData) {
            const texture = this.textures.get('player2');
            texture.get('__BASE').customData = this.player2Data.jsonData;
        }

        createPlayerAnimations(this, 'player1');
        createPlayerAnimations(this, 'player2', true);

        // 4. Manager Initialization
        this.healthManager = this.USE_DEBUG ? new DebugHealthManager(this) : new HealthManager(this);
        this.healthManager.createBars();
        this.animator = new CombatAnimator(this);
        this.sequenceHandler = new CombatSequenceHandler(this);
        this.damageNumbers = new DamageNumbers(this);
        this.victoryHandler = new VictoryHandler(this);

        // 5. Initial Animations
        this.player.play('idle');
        this.player2.play('idle2');

        // 6. Combat Setup
        try {
            const combatData = await loadCombatBytes(this.player1Id, this.player2Id);
            this.combatData = {
                winner: combatData.winner,
                condition: combatData.condition,
                actions: [...combatData.actions]
            };

            // Store initial positions and setup keyboard
            this.playerStartX = this.player.x;
            this.player2StartX = this.player2.x;
            this.centerX = this.cameras.main.centerX;
            this.fKey = this.input.keyboard.addKey('F');
            this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
            this.isFightSequencePlaying = false;

            // Auto-start fight
            this.time.delayedCall(1000, () => this.startFightSequence());
        } catch (error) {
            console.error('Error loading combat data:', error);
        }

        // 7. Event Setup
        this.events.once('fightComplete', () => {
            this.victoryHandler.handleVictory(this.combatData.winner, this.player, this.player2);
        });
    }

    // Game State Management
    update() {
        if (!this.rKey) return;

        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.resetFight();
        }

        if (!this.player || !this.player2) return;

        // Dynamic depth adjustment
        if (this.player.anims?.currentAnim?.key === 'attacking' ||
            this.player.anims?.currentAnim?.key === 'blocking') {
            this.player.setDepth(6);
            this.player2.setDepth(5);
        } else if (this.player2.anims?.currentAnim?.key === 'attacking2' ||
                   this.player2.anims?.currentAnim?.key === 'blocking2') {
            this.player2.setDepth(6);
            this.player.setDepth(5);
        } else {
            this.player.setDepth(5);
            this.player2.setDepth(5);
        }

        if (this.fKey && this.fKey.isDown && !this.isFightSequencePlaying) {
            this.startFightSequence();
        }
    }

    // Combat Sequence Methods
    startFightSequence() {
        if (this.isFightSequencePlaying) return;
        
        this.isFightSequencePlaying = true;
        
        this.startCountdown().then(() => {
            // Initial run to center
            this.animator.playAnimation(this.player, 'running');
            this.animator.playAnimation(this.player2, 'running', true);

            // Move players to center
            this.tweens.add({
                targets: this.player,
                x: this.centerX - 75,
                duration: 1000,
                onComplete: () => {
                    this.animator.playAnimation(this.player, 'idle');
                }
            });
            this.tweens.add({
                targets: this.player2,
                x: this.centerX + 75,
                duration: 1000,
                onComplete: () => {
                    this.animator.playAnimation(this.player2, 'idle', true);
                    if (this.combatData && this.combatData.actions) {
                        this.time.delayedCall(500, () => {
                            this.playCombatSequence(0);
                        });
                    } else {
                        console.error('No combat data available');
                    }
                }
            });
        });
    }

    playCombatSequence(actionIndex) {
        const action = this.combatData.actions[actionIndex];
        const isLastAction = actionIndex === this.combatData.actions.length - 1;
        
        this.sequenceHandler.handleSequence(action, isLastAction);

        this.events.once('sequenceComplete', (isLast) => {
            if (!isLast) {
                this.time.delayedCall(this.SEQUENCE_DELAY, () => {
                    this.playCombatSequence(actionIndex + 1);
                });
            }
        });
    }

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

    // UI Helper Methods
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
}

