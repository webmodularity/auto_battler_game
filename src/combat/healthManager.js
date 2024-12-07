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
            y: 50,
            labelPadding: 30,
            staminaGap: 8,
            p1x: scene.cameras.main.centerX - 420,
            p2x: scene.cameras.main.centerX + 20,
            nudgeFactor: 3
        };
        this.p1Bars = null;
        this.p2Bars = null;
    }

    createBars() {
        // Get max values from player data
        const p1MaxHealth = this.scene.player1Data.stats.maxHealth;
        const p2MaxHealth = this.scene.player2Data.stats.maxHealth;
        const p1MaxEndurance = this.scene.player1Data.stats.maxEndurance;
        const p2MaxEndurance = this.scene.player2Data.stats.maxEndurance;

        console.log('Initial Health Values:', {
            p1MaxHealth,
            p2MaxHealth,
            p1MaxEndurance,
            p2MaxEndurance
        });

        // Player 1 bars (right-aligned stamina, nudged left)
        this.p1Bars = {
            healthBg: this.scene.add.image(this.barConfig.p1x, this.barConfig.y, 'bar-bg')
                .setOrigin(0, 0)
                .setDepth(98)
                .setDisplaySize(this.barConfig.width, this.barConfig.height),
            healthFill: this.scene.add.image(this.barConfig.p1x, this.barConfig.y, 'bar-fill-2')
                .setOrigin(0, 0)
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
                (this.barConfig.p1x + this.barConfig.width - this.barConfig.staminaWidth) - this.barConfig.nudgeFactor,
                this.barConfig.y + this.barConfig.height + this.barConfig.staminaGap,
                'bar-fill-1'
            )
                .setOrigin(0, 0)
                .setDepth(100)
                .setDisplaySize(this.barConfig.staminaWidth, this.barConfig.staminaHeight),
            health: p1MaxHealth,
            maxHealth: p1MaxHealth,
            stamina: p1MaxEndurance,
            maxStamina: p1MaxEndurance
        };

        // Player 2 bars (left-aligned stamina, nudged right)
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
                families: ['Bokor']
            },
            active: () => this.createPlayerLabels()
        });
    }

    createPlayerLabels() {
        // Player labels
        this.scene.add.text(
            this.barConfig.p1x + this.barConfig.width - 5, 
            this.barConfig.y - this.barConfig.labelPadding - 10,
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

        this.scene.add.text(
            this.barConfig.p2x + 5, 
            this.barConfig.y - this.barConfig.labelPadding - 10,
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

    updateBars(p1Health, p2Health, p1Stamina, p2Stamina) {
        console.log('HealthManager raw values:', {
            p1: {
                health: p1Health,
                maxHealth: this.p1Bars.maxHealth,
                stamina: p1Stamina,
                maxStamina: this.p1Bars.maxStamina
            },
            p2: {
                health: p2Health,
                maxHealth: this.p2Bars.maxHealth,
                stamina: p2Stamina,
                maxStamina: this.p2Bars.maxStamina
            }
        });

        // Store the actual values
        this.p1Bars.health = p1Health;
        this.p2Bars.health = p2Health;
        this.p1Bars.stamina = p1Stamina;
        this.p2Bars.stamina = p2Stamina;

        // Calculate the actual width for health bars (should be full width if health = maxHealth)
        const p1HealthWidth = this.barConfig.width * (p1Health / this.p1Bars.maxHealth);
        const p2HealthWidth = this.barConfig.width * (p2Health / this.p2Bars.maxHealth);
        
        // Calculate the actual width for stamina bars
        const p1StaminaWidth = this.barConfig.width * (p1Stamina / this.p1Bars.maxStamina);
        const p2StaminaWidth = this.barConfig.width * (p2Stamina / this.p2Bars.maxStamina);

        // Update health bar displays
        this.p1Bars.healthFill.displayWidth = p1HealthWidth;
        this.p2Bars.healthFill.displayWidth = p2HealthWidth;

        // Update stamina bar displays
        this.p1Bars.staminaFill.displayWidth = p1StaminaWidth;
        this.p2Bars.staminaFill.displayWidth = p2StaminaWidth;
    }
}