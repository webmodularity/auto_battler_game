import * as Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
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

        // Create the animation text displays
        this.animText = this.add.text(16, 16, 'Player 1 Controls:', {
            fontSize: '18px',
            fill: '#fff'
        }).setDepth(100);

        this.animText2 = this.add.text(660, 16, 'Player 2 Controls (Hold Shift):', {
            fontSize: '18px',
            fill: '#fff'
        }).setDepth(100);
        
        // Define animation controls
        const animationControls = [
            { key: Phaser.Input.Keyboard.KeyCodes.ONE, anim: 'idle', name: '1: Idle', repeat: -1 },
            { key: Phaser.Input.Keyboard.KeyCodes.TWO, anim: 'walking', name: '2: Walking', repeat: -1 },
            { key: Phaser.Input.Keyboard.KeyCodes.THREE, anim: 'running', name: '3: Running', repeat: -1 },
            { key: Phaser.Input.Keyboard.KeyCodes.FOUR, anim: 'slashing', name: '4: Slash', repeat: 0 },
            { key: Phaser.Input.Keyboard.KeyCodes.FIVE, anim: 'kicking', name: '5: Kick', repeat: 0 },
            { key: Phaser.Input.Keyboard.KeyCodes.SIX, anim: 'sliding', name: '6: Slide', repeat: 1 },
            { key: Phaser.Input.Keyboard.KeyCodes.SEVEN, anim: 'hurt', name: '7: Hurt', repeat: 0 },
            { key: Phaser.Input.Keyboard.KeyCodes.EIGHT, anim: 'dying', name: '8: Die', repeat: 0 }
        ];

        // Add key controls text for both players
        let yPos = 50;
        animationControls.forEach(control => {
            // Player 1 controls (left side)
            this.add.text(16, yPos, control.name, {
                fontSize: '16px',
                fill: '#fff'
            }).setDepth(100);

            // Player 2 controls (right side)
            this.add.text(660, yPos, control.name, {
                fontSize: '16px',
                fill: '#fff'
            }).setDepth(100);
            yPos += 25;
        });

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

        // Add UI text at the end of create()
        const textConfig = { 
            fontSize: '16px', 
            fill: '#fff',
            fontFamily: 'monospace'
        };

        // Remove any existing text displays first (if any)
        this.children.list
            .filter(child => child.type === 'Text')
            .forEach(text => text.destroy());

        // Add new text displays
        this.add.text(16, 16, 'Player 1 Controls:', textConfig).setDepth(100);
        this.add.text(16, 40, '1: Idle\n2: Walking\n3: Running\n4: Slash\n5: Kick\n6: Slide\n7: Hurt\n8: Die', 
            textConfig).setDepth(100);

        this.add.text(this.cameras.main.width - 16, 16, 'Player 2 Controls (Hold Shift)', 
            {...textConfig, align: 'right'}).setOrigin(1, 0).setDepth(100);
        this.add.text(this.cameras.main.width - 16, 40, '1: Idle\n2: Walking\n3: Running\n4: Slash\n5: Kick\n6: Slide\n7: Hurt\n8: Die', 
            {...textConfig, align: 'right'}).setOrigin(1, 0).setDepth(100);

        // Setup animation completion handlers
        const nonLoopingAnims = ['slashing', 'kicking', 'sliding', 'hurt'];
        const nonLoopingAnims2 = ['slashing2', 'kicking2', 'sliding2', 'hurt2'];

        // Player 1 animation completions
        this.player.on('animationcomplete', (animation) => {
            if (nonLoopingAnims.includes(animation.key)) {
                this.player.play('idle', true);
            }
        });

        // Player 2 animation completions
        this.player2.on('animationcomplete', (animation) => {
            if (nonLoopingAnims2.includes(animation.key)) {
                this.player2.play('idle2', true);
            }
        });
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
}
