import * as Phaser from 'phaser';

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
            y: 30,
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
        this.createAnimationsPlayer2();

        // Update the x positions to be more centered
        this.barConfig.p1x = this.cameras.main.centerX - 420;  // Further left
        this.barConfig.p2x = this.cameras.main.centerX + 20;   // Keep right position

        const textConfig = {
            fontSize: '14px',
            fill: '#fff',
            fontFamily: 'monospace'
        };

        // Player labels with minimal padding
        this.add.text(this.barConfig.p1x + this.barConfig.width - 10, this.barConfig.y - 20, 'PLAYER 1', textConfig)
            .setOrigin(1, 0)
            .setDepth(100);
        this.add.text(this.barConfig.p2x + 10, this.barConfig.y - 20, 'PLAYER 2', textConfig)
            .setOrigin(0, 0)
            .setDepth(100);

        // Animation keys with updated format
        const animConfig = {
            fontSize: '12px',
            fill: '#fff',
            fontFamily: 'monospace'
        };

        // Player 1 keys (left side)
        this.add.text(16, 100, 
            '1: Idle\n2: Walking\n3: Running\n4: Slash\n5: Kick\n6: Slide\n7: Hurt\n8: Die\nF: Fight!', 
            animConfig)
            .setDepth(100);

        // Player 2 keys (right side) with Shift prefix
        this.add.text(this.cameras.main.width - 16, 100,
            'S+1: Idle\nS+2: Walking\nS+3: Running\nS+4: Slash\nS+5: Kick\nS+6: Slide\nS+7: Hurt\nS+8: Die\nF: Fight!',
            animConfig)
            .setOrigin(1, 0)
            .setDepth(100);

        // Setup keyboard controls properly
        this.keys = this.input.keyboard.addKeys({
            ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
            TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
            THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
            FOUR: Phaser.Input.Keyboard.KeyCodes.FOUR,
            FIVE: Phaser.Input.Keyboard.KeyCodes.FIVE,
            SIX: Phaser.Input.Keyboard.KeyCodes.SIX,
            SEVEN: Phaser.Input.Keyboard.KeyCodes.SEVEN,
            EIGHT: Phaser.Input.Keyboard.KeyCodes.EIGHT,
            SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        // Setup animation complete handlers
        this.player.on('animationcomplete', (animation) => {
            // Only switch to idle if it's not already playing idle, looping animations, or dying
            if (!['idle', 'walking', 'running', 'dying'].includes(animation.key)) {
                this.player.play('idle');
            }
        });

        this.player2.on('animationcomplete', (animation) => {
            // Only switch to idle if it's not already playing idle, looping animations, or dying
            if (!['idle2', 'walking2', 'running2', 'dying2'].includes(animation.key)) {
                this.player2.play('idle2');
            }
        });

        // Start both players with idle animation
        this.player.play('idle');
        this.player2.play('idle2');

        // Add keyboard input
        this.fKey = this.input.keyboard.addKey('F');
        
        // Flag to prevent multiple triggers
        this.isFightSequencePlaying = false;

        // Store initial positions
        this.playerStartX = this.player.x;
        this.player2StartX = this.player2.x;
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
                repeat: key === 'idle' || key === 'walking' || key === 'running' ? -1 : 0
            });
        });
    }

    createAnimationsPlayer2() {
        const animations = [
            { key: 'dying2',    prefix: 'Dying_',    frames: 15 },
            { key: 'hurt2',     prefix: 'Hurt_',     frames: 12 },
            { key: 'idle2',     prefix: 'Idle_',     frames: 18 },
            { key: 'kicking2',  prefix: 'Kicking_',  frames: 12 },
            { key: 'running2',  prefix: 'Running_',  frames: 12 },
            { key: 'slashing2', prefix: 'Slashing_', frames: 12 },
            { key: 'sliding2',  prefix: 'Sliding_',  frames: 6 },
            { key: 'walking2',  prefix: 'Walking_',  frames: 24 }
        ];

        animations.forEach(({ key, prefix, frames }) => {
            this.anims.create({
                key: key,
                frames: this.anims.generateFrameNames('player2', {
                    prefix: prefix,
                    start: 0,
                    end: frames - 1,
                    zeroPad: 3,
                    suffix: '.png'
                }),
                frameRate: 24,
                repeat: key === 'idle2' || key === 'walking2' || key === 'running2' ? -1 : 0
            });
        });
    }

    update() {
        if (!this.keys || !this.player || !this.player2) return;

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

        if (this.keys.SHIFT.isDown) {
            // Player 2 controls (only when shift is held)
            if (this.keys.ONE.isDown) {
                this.player2.play('idle2', true);
            } else if (this.keys.TWO.isDown) {
                this.player2.play('walking2', true);
            } else if (this.keys.THREE.isDown) {
                this.player2.play('running2', true);
            } else if (this.keys.FOUR.isDown) {
                this.player2.play('slashing2', true);
            } else if (this.keys.FIVE.isDown) {
                this.player2.play('kicking2', true);
            } else if (this.keys.SIX.isDown) {
                this.player2.play('sliding2', true);
            } else if (this.keys.SEVEN.isDown) {
                this.player2.play('hurt2', true);
            } else if (this.keys.EIGHT.isDown) {
                this.player2.play('dying2', true);
            }
        } else {
            // Player 1 controls (only when shift is NOT held)
            if (this.keys.ONE.isDown) {
                this.player.play('idle', true);
            } else if (this.keys.TWO.isDown) {
                this.player.play('walking', true);
            } else if (this.keys.THREE.isDown) {
                this.player.play('running', true);
            } else if (this.keys.FOUR.isDown) {
                this.player.play('slashing', true);
            } else if (this.keys.FIVE.isDown) {
                this.player.play('kicking', true);
            } else if (this.keys.SIX.isDown) {
                this.player.play('sliding', true);
            } else if (this.keys.SEVEN.isDown) {
                this.player.play('hurt', true);
            } else if (this.keys.EIGHT.isDown) {
                this.player.play('dying', true);
            }
        }

        // Check for F key press
        if (this.fKey.isDown && !this.isFightSequencePlaying) {
            this.startFightSequence();
        }

        // Example: Press 7 to damage player 1, 8 to damage player 2
        if (!this.keys.SHIFT.isDown) {
            if (this.keys.SEVEN.isDown) {
                if (this.p1Bars.health > 0) {
                    this.p1Bars.health = Math.max(0, this.p1Bars.health - 1);
                    this.updateHealthBars();
                }
                if (this.p1Bars.stamina > 0) {
                    this.p1Bars.stamina = Math.max(0, this.p1Bars.stamina - 0.5); // Deplete stamina at half speed
                    this.updateStaminaBars();
                }
            }
            if (this.keys.EIGHT.isDown) {
                if (this.p2Bars.health > 0) {
                    this.p2Bars.health = Math.max(0, this.p2Bars.health - 1);
                    this.updateHealthBars();
                }
                if (this.p2Bars.stamina > 0) {
                    this.p2Bars.stamina = Math.max(0, this.p2Bars.stamina - 0.5); // Deplete stamina at half speed
                    this.updateStaminaBars();
                }
            }
        }
    }

    startFightSequence() {
        if (this.isFightSequencePlaying) return;
        this.isFightSequencePlaying = true;

        // Reset positions first
        this.player.x = this.playerStartX;
        this.player2.x = this.player2StartX;

        // Clean up any existing listeners
        this.player.removeAllListeners('animationcomplete-slashing');
        this.player.removeAllListeners('animationcomplete-hurt');
        this.player2.removeAllListeners('animationcomplete-slashing2');
        this.player2.removeAllListeners('animationcomplete-hurt2');

        // Calculate center point
        const centerX = this.cameras.main.centerX;
        
        // Start running animations
        this.player.play('running');
        this.player2.play('running2');

        // Tween for player 1
        this.tweens.add({
            targets: this.player,
            x: centerX - 75,
            duration: 1000,
            onComplete: () => {
                this.player.play('slashing');
            }
        });

        // Tween for player 2
        this.tweens.add({
            targets: this.player2,
            x: centerX + 75,
            duration: 1000,
            onComplete: () => {
                this.player2.play('slashing2');
            }
        });

        // Listen for slash animation completion
        this.player.once('animationcomplete-slashing', () => {
            this.player.play('hurt');
        });

        this.player2.once('animationcomplete-slashing2', () => {
            this.player2.play('hurt2');
        });

        // Listen for hurt animation completion
        this.player.once('animationcomplete-hurt', () => {
            this.player.play('dying');
        });

        this.player2.once('animationcomplete-hurt2', () => {
            this.player2.play('dying2');
        });

        // Reset only the sequence flag after animations start
        this.time.delayedCall(2000, () => {
            this.isFightSequencePlaying = false;
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
}
