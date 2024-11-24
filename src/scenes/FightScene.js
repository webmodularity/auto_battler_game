import * as Phaser from 'phaser';
import { decodeCombatLog } from '../utils/combatDecoder';

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
        this.SEQUENCE_DELAY = 1500;  // Delay between actions
        this.COUNTER_DELAY = 750;   // Delay for counter-attacks
        this.INITIAL_DELAY = 1000;  // Delay before first action after reaching center
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
        
        // Your existing player load
        this.load.atlas('player', '/assets/characters/knight1/player.png', '/assets/characters/knight1/player.json');
        this.load.atlas('player2', '/assets/characters/knight2/player.png', '/assets/characters/knight2/player.json');

        // Load health/stamina bar assets
        this.load.image('bar-bg', '/assets/ui/load_bar_bg.png');
        this.load.image('bar-fill-1', '/assets/ui/load_bar_1.png');
        this.load.image('bar-fill-2', '/assets/ui/load_bar_2.png');
        this.load.image('bar-fill-1-right', '/assets/ui/load_bar_1_right.png');
        this.load.image('bar-fill-2-right', '/assets/ui/load_bar_2_right.png');
        this.load.image('bar-dark', '/assets/ui/dark.png');
    }

    create() {
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

        // Create player 1 (left side)
        this.player = this.add.sprite(125, 425, 'player');
        this.player.setScale(1.5);
        this.player.setDepth(5);

        // Create player 2 (right side)
        this.player2 = this.add.sprite(835, 425, 'player2');
        this.player2.setScale(1.5);
        this.player2.setDepth(5);
        this.player2.setFlipX(true); // Flip to face player 1

        // Create animations for both players
        this.createAnimations();

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
                damage: '48px',
                text: '36px'
            },
            fontFamily: 'Sniglet',
            duration: 1500,
            rise: 150,
            colors: {
                damage: '#ff0000',
                block: '#6666ff',
                dodge: '#66ffff',
                miss: '#ffffff',
                counter: '#66ff66'
            }
        };

        // Player labels - moved up 10px by subtracting from the y position
        this.add.text(this.barConfig.p1x + this.barConfig.width - 5, 
            this.barConfig.y - this.barConfig.labelPadding - 10,  // Subtract 10 from y position
            'PLAYER 1', 
            {
                fontFamily: 'Sniglet',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                fontStyle: 'bold'
            }
        )
        .setOrigin(1, 0)
        .setDepth(98);

        this.add.text(this.barConfig.p2x + 5, 
            this.barConfig.y - this.barConfig.labelPadding - 10,  // Subtract 10 from y position
            'PLAYER 2', 
            {
                fontFamily: 'Sniglet',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                fontStyle: 'bold'
            }
        )
        .setOrigin(0, 0)
        .setDepth(98);

        // Add R key for reset with proper configuration
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        
        // Initialize fight sequence flag
        this.isFightSequencePlaying = false;
    }

    createAnimations() {
        const animations = [
            { key: 'dying', prefix: 'Dying_', frames: 15 },
            { key: 'hurt', prefix: 'Hurt_', frames: 12 },
            { key: 'idle', prefix: 'Idle_', frames: 18 },
            { key: 'kicking', prefix: 'Kicking_', frames: 12 },
            { key: 'running', prefix: 'Running_', frames: 12 },
            { key: 'slashing', prefix: 'Slashing_', frames: 12 },
            { key: 'sliding', prefix: 'Sliding_', frames: 6 },
            { key: 'walking', prefix: 'Walking_', frames: 24 }
        ];

        // Create animations for both players
        ['', '2'].forEach(suffix => {
            animations.forEach(({ key, prefix, frames }) => {
                this.anims.create({
                    key: key + suffix,
                    frames: this.anims.generateFrameNames(suffix ? 'player2' : 'player', {
                        prefix: prefix,
                        start: 0,
                        end: frames - 1,
                        zeroPad: 3,
                        suffix: '.png'
                    }),
                    frameRate: 24,  // Consistent framerate for all animations
                    repeat: key === 'idle' || key === 'walking' || key === 'running' ? -1 : 0
                });
            });
        });

        // Start both players in idle animation
        this.player.play('idle');
        this.player2.play('idle2');
    }

    update() {
        // Simplified R key check without debug logging
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.resetFight();
        }

        // Dynamic depth adjustment based on who's attacking
        if (this.player.anims.currentAnim?.key === 'slashing' || 
            this.player.anims.currentAnim?.key === 'kicking') {
            this.player.setDepth(6);
            this.player2.setDepth(5);
        } else if (this.player2.anims.currentAnim?.key === 'slashing2' || 
                   this.player2.anims.currentAnim?.key === 'kicking2') {
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
        
        // Initial run to center
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

        // Wait for both players to reach center, then start idle animations
        Promise.all(moveToCenter.map(tween => new Promise(resolve => tween.once('complete', resolve))))
            .then(() => {
                // Play idle animations first
                this.player.play('idle');
                this.player2.play('idle2');
                
                // Wait before starting the fight sequence
                this.time.delayedCall(this.INITIAL_DELAY, () => {
                    this.playCombatSequence(0);
                });
            });
    }

    playCombatSequence(actionIndex) {
        const action = this.combatData.actions[actionIndex];
        const isLastAction = actionIndex === this.combatData.actions.length - 1;

        // Handle Player 1's MISS + Player 2's COUNTER sequence
        if (action.p1Result === 'MISS' && action.p2Result === 'COUNTER') {
            // First: Player 1's missed attack and MISS text
            this.player.play('slashing');
            this.showDamageNumber(this.player.x, this.player.y - 50, 'MISS', 'miss');

            // Handle Player 1's slash animation completion
            this.player.once('animationcomplete', () => {
                this.player.play('idle');
            });

            // After a short delay, show Player 2's counter sequence
            this.time.delayedCall(this.COUNTER_DELAY, () => {
                this.showDamageNumber(this.player2.x, this.player2.y - 50, 'COUNTER', 'counter');
                this.player2.play('slashing2');
                
                // After the slash animation starts, show damage and hurt animation
                this.time.delayedCall(400, () => {
                    this.player.play('hurt');
                    this.showDamageNumber(this.player.x, this.player.y - 50, action.p2Damage, 'damage');
                    
                    // Handle hurt animation completion and potential death
                    this.player.once('animationcomplete', () => {
                        if (isLastAction && this.combatData.winner === 2) {
                            this.time.delayedCall(400, () => {  // Add delay before death animation
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
            this.player.play('slashing');
            this.showDamageNumber(this.player.x, this.player.y - 50, 'MISS', 'miss');
            this.player2.play('sliding2');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, 'DODGE', 'dodge');
        }
        else if (action.p1Result === 'DODGE') {
            this.player2.play('slashing2');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, 'MISS', 'miss');
            this.player.play('sliding');
            this.showDamageNumber(this.player.x, this.player.y - 50, 'DODGE', 'dodge');
        }
        // Handle Player 2's MISS + Player 1's COUNTER sequence that ends the fight
        else if (action.p2Result === 'MISS' && action.p1Result === 'COUNTER' && isLastAction) {
            this.player2.play('slashing2');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, 'MISS', 'miss');

            this.time.delayedCall(this.COUNTER_DELAY, () => {
                this.showDamageNumber(this.player.x, this.player.y - 50, 'COUNTER', 'counter');
                this.player.play('slashing');
                
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
            this.player.play('slashing');
            this.showDamageNumber(this.player.x, this.player.y - 50, 'MISS', 'miss');
            
            this.player.once('animationcomplete', () => {
                this.player.play('idle');
            });
        }
        else if (action.p2Result === 'MISS' && action.p1Result !== 'DODGE' && action.p1Result !== 'BLOCK') {
            this.player2.play('slashing2');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, 'MISS', 'miss');
            
            this.player2.once('animationcomplete', () => {
                this.player2.play('idle2');
            });
        }

        // Handle Attack + Block sequence
        else if (action.p1Result === 'ATTACK' && action.p2Result === 'BLOCK') {
            this.player.play('slashing');
            
            this.time.delayedCall(this.COUNTER_DELAY, () => {
                this.player2.play('kicking2');
                this.showDamageNumber(this.player2.x, this.player2.y - 50, 'BLOCK', 'block');
            });
        }
        // Handle Player 2's MISS + Player 1's COUNTER sequence
        else if (action.p2Result === 'MISS' && action.p1Result === 'COUNTER') {
            this.player2.play('slashing2');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, 'MISS', 'miss');

            this.player2.once('animationcomplete', () => {
                this.player2.play('idle2');
            });

            this.time.delayedCall(this.COUNTER_DELAY, () => {
                this.showDamageNumber(this.player.x, this.player.y - 50, 'COUNTER', 'counter');
                this.player.play('slashing');
                
                this.time.delayedCall(400, () => {
                    this.player2.play('hurt2');
                    this.showDamageNumber(this.player2.x, this.player2.y - 50, action.p1Damage, 'damage');
                    
                    // Handle hurt animation completion and potential death
                    this.player2.once('animationcomplete', () => {
                        if (isLastAction && this.combatData.winner === 1) {
                            this.time.delayedCall(400, () => {  // Add delay before death animation
                                this.player2.play('dying2');
                            });
                        } else if (!isLastAction) {
                            this.player2.play('idle2');
                        }
                    });
                });

                this.player.once('animationcomplete', () => {
                    this.player.play('idle');
                });
            });
        }
        // Handle regular attacks
        else if (action.p1Result === 'ATTACK' && action.p1Damage > 0) {
            this.player.play('slashing');
            this.showDamageNumber(this.player2.x, this.player2.y - 50, action.p1Damage, 'damage');
            this.player2.play('hurt2');
        }
        else if (action.p2Result === 'ATTACK' && action.p2Damage > 0) {
            this.player2.play('slashing2');
            this.showDamageNumber(this.player.x, this.player.y - 50, action.p2Damage, 'damage');
            this.player.play('hurt');
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
    }

    showDamageNumber(x, y, value, type = 'damage') {
        const color = this.damageNumberConfig.colors[type];
        const fontSize = typeof value === 'number' 
            ? this.damageNumberConfig.fontSize.damage 
            : this.damageNumberConfig.fontSize.text;

        const text = this.add.text(x, y - 50, value, {  // Start higher above head
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
            y: y - this.damageNumberConfig.rise - 50,  // Rise from higher starting point
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
}
