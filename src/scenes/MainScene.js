import * as Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.barConfig = {
            width: 350,
            height: 20,
            fillHeight: 16,
            padding: 2,
            y: 50,
            staminaGap: 8,
            p1x: 0,
            p2x: 0
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
    }

    create() {
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
        this.barConfig.p1x = this.cameras.main.centerX - 375;
        this.barConfig.p2x = this.cameras.main.centerX + 25;

        // Create containers for each player's bars
        this.p1Bars = {
            healthBorder: this.add.graphics().setDepth(100),
            healthFill: this.add.graphics().setDepth(99),
            staminaBorder: this.add.graphics().setDepth(100),
            staminaFill: this.add.graphics().setDepth(99),
            health: 100,
            stamina: 100
        };

        this.p2Bars = {
            healthBorder: this.add.graphics().setDepth(100),
            healthFill: this.add.graphics().setDepth(99),
            staminaBorder: this.add.graphics().setDepth(100),
            staminaFill: this.add.graphics().setDepth(99),
            health: 100,
            stamina: 100
        };

        const textConfig = {
            fontSize: '14px',
            fill: '#fff',
            fontFamily: 'monospace'
        };

        // Player labels
        this.add.text(this.barConfig.p1x + this.barConfig.width, this.barConfig.y - 20, 'PLAYER 1', textConfig)
            .setOrigin(1, 0)
            .setDepth(100);
        this.add.text(this.barConfig.p2x, this.barConfig.y - 20, 'PLAYER 2', textConfig)
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

        // Draw borders with adjusted positions
        this.p1Bars.healthBorder.lineStyle(2, 0x000000);
        this.p1Bars.healthBorder.strokeRect(
            Math.floor(this.barConfig.p1x),
            Math.floor(this.barConfig.y),
            this.barConfig.width,
            this.barConfig.height
        );

        this.p1Bars.staminaBorder.lineStyle(2, 0x000000);
        this.p1Bars.staminaBorder.strokeRect(
            Math.floor(this.barConfig.p1x),
            Math.floor(this.barConfig.y + this.barConfig.height + 5),
            this.barConfig.width,
            this.barConfig.height/2
        );

        this.p2Bars.healthBorder.lineStyle(2, 0x000000);
        this.p2Bars.healthBorder.strokeRect(
            Math.floor(this.barConfig.p2x),
            Math.floor(this.barConfig.y),
            this.barConfig.width,
            this.barConfig.height
        );

        this.p2Bars.staminaBorder.lineStyle(2, 0x000000);
        this.p2Bars.staminaBorder.strokeRect(
            Math.floor(this.barConfig.p2x),
            Math.floor(this.barConfig.y + this.barConfig.height + 5),
            this.barConfig.width,
            this.barConfig.height/2
        );

        // Set depths for all UI elements
        [this.p1Bars, this.p2Bars].forEach(bars => {
            Object.values(bars).forEach(item => {
                if (item instanceof Phaser.GameObjects.Graphics) {
                    item.setDepth(100);
                }
            });
        });

        // Initial fill of bars
        this.updateHealthBars();
        this.updateStaminaBars();

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
            if (this.keys.SEVEN.isDown && this.p1Bars.health > 0) {
                this.p1Bars.health = Math.max(0, this.p1Bars.health - 1);
                this.updateHealthBars();
            }
            if (this.keys.EIGHT.isDown && this.p2Bars.health > 0) {
                this.p2Bars.health = Math.max(0, this.p2Bars.health - 1);
                this.updateHealthBars();
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
        // Player 1 health bar
        this.p1Bars.healthFill.clear();
        this.p1Bars.healthBorder.clear();
        const p1Width = (this.barConfig.width - (this.barConfig.padding * 2)) * (this.p1Bars.health / 100);
        
        // Extra thick black outline
        this.p1Bars.healthBorder.lineStyle(4, 0x000000, 1);
        this.p1Bars.healthBorder.strokeRoundedRect(
            Math.floor(this.barConfig.p1x),
            Math.floor(this.barConfig.y),
            this.barConfig.width,
            this.barConfig.height,
            6  // More rounded corners
        );

        // Main fill with rounded corners
        this.p1Bars.healthFill.fillStyle(0xff3333);
        this.p1Bars.healthFill.fillRoundedRect(
            Math.floor(this.barConfig.p1x) + this.barConfig.padding,
            Math.floor(this.barConfig.y) + this.barConfig.padding,
            p1Width,
            this.barConfig.fillHeight,
            5
        );

        // Chunky highlight
        this.p1Bars.healthFill.fillStyle(0xff6666);
        this.p1Bars.healthFill.fillRoundedRect(
            Math.floor(this.barConfig.p1x) + this.barConfig.padding,
            Math.floor(this.barConfig.y) + this.barConfig.padding,
            p1Width,
            this.barConfig.fillHeight / 2,
            5
        );

        // Player 2 health bar
        this.p2Bars.healthFill.clear();
        this.p2Bars.healthBorder.clear();
        const p2Width = (this.barConfig.width - (this.barConfig.padding * 2)) * (this.p2Bars.health / 100);
        
        // Extra thick black outline
        this.p2Bars.healthBorder.lineStyle(4, 0x000000, 1);
        this.p2Bars.healthBorder.strokeRoundedRect(
            Math.floor(this.barConfig.p2x),
            Math.floor(this.barConfig.y),
            this.barConfig.width,
            this.barConfig.height,
            6
        );

        // Main fill with rounded corners
        this.p2Bars.healthFill.fillStyle(0xff3333);
        this.p2Bars.healthFill.fillRoundedRect(
            Math.floor(this.barConfig.p2x) + this.barConfig.padding,
            Math.floor(this.barConfig.y) + this.barConfig.padding,
            p2Width,
            this.barConfig.fillHeight,
            5
        );

        // Chunky highlight
        this.p2Bars.healthFill.fillStyle(0xff6666);
        this.p2Bars.healthFill.fillRoundedRect(
            Math.floor(this.barConfig.p2x) + this.barConfig.padding,
            Math.floor(this.barConfig.y) + this.barConfig.padding,
            p2Width,
            this.barConfig.fillHeight / 2,
            5
        );
    }

    updateStaminaBars() {
        const staminaY = this.barConfig.y + this.barConfig.height + this.barConfig.staminaGap;
        
        // Player 1 stamina bar
        this.p1Bars.staminaFill.clear();
        this.p1Bars.staminaBorder.clear();
        const p1Width = (this.barConfig.width - (this.barConfig.padding * 2)) * (this.p1Bars.stamina / 100);
        
        // Extra thick black outline with smaller radius
        this.p1Bars.staminaBorder.lineStyle(4, 0x000000, 1);
        this.p1Bars.staminaBorder.strokeRoundedRect(
            Math.floor(this.barConfig.p1x),
            Math.floor(staminaY),
            this.barConfig.width,
            this.barConfig.height/2,
            3  // Reduced from 6 to 3
        );

        // Main fill with smaller radius
        this.p1Bars.staminaFill.fillStyle(0xffcc00);
        this.p1Bars.staminaFill.fillRoundedRect(
            Math.floor(this.barConfig.p1x) + this.barConfig.padding,
            Math.floor(staminaY) + this.barConfig.padding,
            p1Width,
            this.barConfig.height/2 - this.barConfig.padding * 2,
            2  // Reduced from 5 to 2
        );

        // Chunky highlight with smaller radius
        this.p1Bars.staminaFill.fillStyle(0xffd633);
        this.p1Bars.staminaFill.fillRoundedRect(
            Math.floor(this.barConfig.p1x) + this.barConfig.padding,
            Math.floor(staminaY) + this.barConfig.padding,
            p1Width,
            (this.barConfig.height/2 - this.barConfig.padding * 2) / 2,
            2  // Reduced from 5 to 2
        );

        // Player 2 stamina bar (same changes)
        this.p2Bars.staminaFill.clear();
        this.p2Bars.staminaBorder.clear();
        const p2Width = (this.barConfig.width - (this.barConfig.padding * 2)) * (this.p2Bars.stamina / 100);
        
        this.p2Bars.staminaBorder.lineStyle(4, 0x000000, 1);
        this.p2Bars.staminaBorder.strokeRoundedRect(
            Math.floor(this.barConfig.p2x),
            Math.floor(staminaY),
            this.barConfig.width,
            this.barConfig.height/2,
            3  // Reduced from 6 to 3
        );

        this.p2Bars.staminaFill.fillStyle(0xffcc00);
        this.p2Bars.staminaFill.fillRoundedRect(
            Math.floor(this.barConfig.p2x) + this.barConfig.padding,
            Math.floor(staminaY) + this.barConfig.padding,
            p2Width,
            this.barConfig.height/2 - this.barConfig.padding * 2,
            2  // Reduced from 5 to 2
        );

        this.p2Bars.staminaFill.fillStyle(0xffd633);
        this.p2Bars.staminaFill.fillRoundedRect(
            Math.floor(this.barConfig.p2x) + this.barConfig.padding,
            Math.floor(staminaY) + this.barConfig.padding,
            p2Width,
            (this.barConfig.height/2 - this.barConfig.padding * 2) / 2,
            2  // Reduced from 5 to 2
        );
    }
}
