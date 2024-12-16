import * as WebFont from 'webfontloader';

export class HealthManager {
    constructor(scene) {
        this.scene = scene;
        this.barConfig = {
            width: 400,
            staminaWidth: 300,
            height: 26,
            staminaHeight: 15,
            fillHeight: 27,
            padding: 2,
            y: 40,
            labelPadding: 20,
            staminaGap: 8,
            p1x: scene.cameras.main.centerX - 420,
            p2x: scene.cameras.main.centerX + 20,
            nudgeFactor: 3
        };
        this.p1Bars = null;
        this.p2Bars = null;

        // Add tweening properties
        this.tweens = {
            p1Health: null,
            p2Health: null,
            p1Stamina: null,
            p2Stamina: null,
            duration: 500 // Duration of health/stamina change animation
        };
    }

    createBars() {
        // Get max values from player data
        const p1MaxHealth = this.scene.player1Data.stats.maxHealth;
        const p2MaxHealth = this.scene.player2Data.stats.maxHealth;
        const p1MaxEndurance = this.scene.player1Data.stats.maxEndurance;
        const p2MaxEndurance = this.scene.player2Data.stats.maxEndurance;

        // Player 1 bars (right-aligned, white accent on left)
        this.p1Bars = {
            healthBg: this.scene.add.image(this.barConfig.p1x, this.barConfig.y, 'bar-bg')
                .setOrigin(0, 0)
                .setDepth(98)
                .setDisplaySize(this.barConfig.width, this.barConfig.height),
            healthFill: this.scene.add.image(this.barConfig.p1x + this.barConfig.width, this.barConfig.y, 'bar-fill-2')
                .setOrigin(1, 0)
                .setDepth(100)
                .setDisplaySize(this.barConfig.width, this.barConfig.height),
            staminaBg: this.scene.add.image(
                (this.barConfig.p1x + this.barConfig.width - this.barConfig.staminaWidth) - this.barConfig.nudgeFactor,
                this.barConfig.y + this.barConfig.height + this.barConfig.staminaGap,
                'bar-bg'
            )
                .setOrigin(0, 0)
                .setDepth(98)
                .setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight),
            staminaFill: this.scene.add.image(
                this.barConfig.p1x + this.barConfig.width - this.barConfig.nudgeFactor,
                this.barConfig.y + this.barConfig.height + this.barConfig.staminaGap,
                'bar-fill-1'
            )
                .setOrigin(1, 0)
                .setDepth(100)
                .setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight),
            health: p1MaxHealth,
            maxHealth: p1MaxHealth,
            stamina: p1MaxEndurance,
            maxStamina: p1MaxEndurance
        };

        // Player 2 bars (left-aligned, white accent on right)
        this.p2Bars = {
            healthBg: this.scene.add.image(this.barConfig.p2x, this.barConfig.y, 'bar-bg')
                .setOrigin(0, 0)
                .setDepth(98)
                .setDisplaySize(this.barConfig.width, this.barConfig.height),
            healthFill: this.scene.add.image(this.barConfig.p2x, this.barConfig.y, 'bar-fill-2-right')
                .setOrigin(0, 0)
                .setDepth(100)
                .setDisplaySize(this.barConfig.width, this.barConfig.height),
            staminaBg: this.scene.add.image(
                this.barConfig.p2x + this.barConfig.nudgeFactor,
                this.barConfig.y + this.barConfig.height + this.barConfig.staminaGap,
                'bar-bg'
            )
                .setOrigin(0, 0)
                .setDepth(98)
                .setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight),
            staminaFill: this.scene.add.image(
                this.barConfig.p2x + this.barConfig.nudgeFactor,
                this.barConfig.y + this.barConfig.height + this.barConfig.staminaGap,
                'bar-fill-1-right'
            )
                .setOrigin(0, 0)
                .setDepth(100)
                .setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight),
            health: p2MaxHealth,
            maxHealth: p2MaxHealth,
            stamina: p2MaxEndurance,
            maxStamina: p2MaxEndurance
        };

        // Load fonts and create player labels
        WebFont.load({
            google: {
                families: ['Bokor', 'Montserrat:700']
            },
            active: () => this.createPlayerLabels()
        });
    }

    createPlayerLabels() {
        const p1Name = this.scene.player1Data.name.fullName;
        const p2Name = this.scene.player2Data.name.fullName;

        // Player labels
        this.scene.add.text(
            this.barConfig.p1x + this.barConfig.width - 5, 
            this.barConfig.y - this.barConfig.labelPadding - 10,
            p1Name, 
            {
                fontFamily: 'Bokor',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        )
        .setOrigin(1, 0)
        .setDepth(98);

        this.scene.add.text(
            this.barConfig.p2x + 5, 
            this.barConfig.y - this.barConfig.labelPadding - 10,
            p2Name, 
            {
                fontFamily: 'Bokor',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        )
        .setOrigin(0, 0)
        .setDepth(98);
    }

    updateBars(p1Health, p2Health, p1Stamina, p2Stamina) {
        // Store target values
        const targetValues = {
            p1Health,
            p2Health,
            p1Stamina,
            p2Stamina
        };

        // Update stat displays if they exist
        if (this.scene.player1Stats) {
            const stats = { ...this.scene.player1Data.stats };
            stats.currentHealth = p1Health;
            stats.currentEndurance = p1Stamina;
            this.scene.player1Stats.update({ stats });
        }
        
        if (this.scene.player2Stats) {
            const stats = { ...this.scene.player2Data.stats };
            stats.currentHealth = p2Health;
            stats.currentEndurance = p2Stamina;
            this.scene.player2Stats.update({ stats });
        }

        // Kill any existing tweens
        if (this.tweens.p1Health) this.tweens.p1Health.stop();
        if (this.tweens.p2Health) this.tweens.p2Health.stop();
        if (this.tweens.p1Stamina) this.tweens.p1Stamina.stop();
        if (this.tweens.p2Stamina) this.tweens.p2Stamina.stop();

        // Create new tweens
        this.tweens.p1Health = this.scene.tweens.addCounter({
            from: this.p1Bars.health,
            to: targetValues.p1Health,
            duration: this.tweens.duration,
            onUpdate: (tween) => {
                this.p1Bars.health = tween.getValue();
                this.updateBarDisplays();
            }
        });

        this.tweens.p2Health = this.scene.tweens.addCounter({
            from: this.p2Bars.health,
            to: targetValues.p2Health,
            duration: this.tweens.duration,
            onUpdate: (tween) => {
                this.p2Bars.health = tween.getValue();
                this.updateBarDisplays();
            }
        });

        this.tweens.p1Stamina = this.scene.tweens.addCounter({
            from: this.p1Bars.stamina,
            to: targetValues.p1Stamina,
            duration: this.tweens.duration,
            onUpdate: (tween) => {
                this.p1Bars.stamina = tween.getValue();
                this.updateBarDisplays();
            }
        });

        this.tweens.p2Stamina = this.scene.tweens.addCounter({
            from: this.p2Bars.stamina,
            to: targetValues.p2Stamina,
            duration: this.tweens.duration,
            onUpdate: (tween) => {
                this.p2Bars.stamina = tween.getValue();
                this.updateBarDisplays();
            }
        });
    }

    // New method to handle the actual bar updates
    updateBarDisplays() {
        // Calculate the actual widths
        const p1HealthWidth = this.barConfig.width * (this.p1Bars.health / this.p1Bars.maxHealth);
        const p2HealthWidth = this.barConfig.width * (this.p2Bars.health / this.p2Bars.maxHealth);
        const p1StaminaWidth = this.barConfig.staminaWidth * (this.p1Bars.stamina / this.p1Bars.maxStamina);
        const p2StaminaWidth = this.barConfig.staminaWidth * (this.p2Bars.stamina / this.p2Bars.maxStamina);

        // Update Player 1 bars (right-aligned, drains right-to-left)
        this.p1Bars.healthFill.setX(this.barConfig.p1x + this.barConfig.width);
        this.p1Bars.healthFill.displayWidth = p1HealthWidth;
        
        this.p1Bars.staminaFill.setX(this.barConfig.p1x + this.barConfig.width - this.barConfig.nudgeFactor);
        this.p1Bars.staminaFill.displayWidth = p1StaminaWidth;

        // Update Player 2 bars (left-aligned, drains left-to-right)
        this.p2Bars.healthFill.displayWidth = p2HealthWidth;
        this.p2Bars.staminaFill.displayWidth = p2StaminaWidth;
    }
}