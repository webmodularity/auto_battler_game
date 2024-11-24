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
    }

    init(data) {
        console.log('FightScene init called with data:', data);

        if (data.combatLog) {
            const combatLog = "0x020001160a05000005000001260a01160a05000002000c01000a01160a05000005000001260a";
            console.log('Raw combat log:', combatLog);
            
            try {
                this.combatData = decodeCombatLog(combatLog);
                console.log('Decoded combat data:', this.combatData);
                
                console.log('Winner:', this.combatData.winner);
                console.log('Condition:', this.combatData.condition);
                console.log('Number of actions:', this.combatData.actions.length);
                console.log('Actions:', JSON.stringify(this.combatData.actions, null, 2));
            } catch (error) {
                console.error('Error decoding combat log:', error);
            }
        } else {
            console.log('No combat log provided in scene data');
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

        if (this.fKey.isDown && !this.isFightSequencePlaying) {
            this.startFightSequence();
        }
    }

    startFightSequence() {
        console.log('Starting fight sequence');
        if (this.isFightSequencePlaying || !this.combatData) {
            console.log('Cannot start sequence:', { 
                isPlaying: this.isFightSequencePlaying, 
                hasData: !!this.combatData 
            });
            return;
        }
        this.isFightSequencePlaying = true;

        // Reset positions
        this.player.x = this.playerStartX;
        this.player2.x = this.player2StartX;

        console.log('Running to center');
        // Initial run to center
        this.player.play('running');
        this.player2.play('running2');

        // Move players to center
        const moveToCenter = [
            this.tweens.add({
                targets: this.player,
                x: this.centerX - 75,
                duration: 1000,
                onComplete: () => console.log('Player 1 reached center')
            }),
            this.tweens.add({
                targets: this.player2,
                x: this.centerX + 75,
                duration: 1000,
                onComplete: () => console.log('Player 2 reached center')
            })
        ];

        Promise.all(moveToCenter.map(tween => new Promise(resolve => tween.once('complete', resolve))))
            .then(() => {
                console.log('Both players at center, starting combat');
                this.playCombatSequence(0);
            });
    }

    playCombatSequence(actionIndex) {
        console.log('Playing action', actionIndex);
        const SEQUENCE_DELAY = 1500; // 1.5 second pause between sequences
        
        // Check if we've reached the end of actions
        if (actionIndex >= this.combatData.actions.length) {
            console.log('Combat sequence complete');
            // Death animation should already be playing from the last hit
            this.isFightSequencePlaying = false;
            return;
        }

        const action = this.combatData.actions[actionIndex];
        const isLastAction = actionIndex === this.combatData.actions.length - 1;

        // Helper to get animation based on result type
        const getAnimation = (resultType, isPlayer2) => {
            const suffix = isPlayer2 ? '2' : '';
            const anim = {
                'ATTACK': `slashing${suffix}`,
                'BLOCK': `kicking${suffix}`,
                'DODGE': `sliding${suffix}`,
                'HIT': `hurt${suffix}`,
                'MISS': `idle${suffix}`
            }[resultType] || `idle${suffix}`;
            return anim;
        };

        // Play animations
        const p1Anim = getAnimation(action.p1Result, false);
        const p2Anim = getAnimation(action.p2Result, true);
        
        console.log('Playing animations:', { p1: p1Anim, p2: p2Anim });
        
        // Play animations
        this.player.play(p1Anim);
        this.player2.play(p2Anim);

        // Handle animation completion
        this.player.once('animationcomplete', () => {
            // If this is the last action and this player lost, play death animation
            if (isLastAction && this.combatData.winner === 2) {
                this.player.play('dying');
            } else if (this.player.anims.currentAnim.key !== 'dying') {
                this.player.play('idle');
            }
        });

        this.player2.once('animationcomplete', () => {
            // If this is the last action and this player lost, play death animation
            if (isLastAction && this.combatData.winner === 1) {
                this.player2.play('dying2');
            } else if (this.player2.anims.currentAnim.key !== 'dying2') {
                this.player2.play('idle2');
            }
        });

        // Only delay and continue if not the last action
        if (!isLastAction) {
            this.time.delayedCall(SEQUENCE_DELAY, () => {
                this.playCombatSequence(actionIndex + 1);
            });
        }
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
