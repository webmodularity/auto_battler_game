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
            health: 100,
            stamina: 100
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
            health: 100,
            stamina: 100
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
        this.p1Bars.health = p1Health;
        this.p2Bars.health = p2Health;
        this.p1Bars.stamina = p1Stamina;
        this.p2Bars.stamina = p2Stamina;

        this.updateHealthBars();
        this.updateStaminaBars();
    }

    updateHealthBars() {
        const p1HealthWidth = Math.floor(this.p1Bars.healthFill.width * (this.p1Bars.health / 100));
        const p2HealthWidth = Math.floor(this.p2Bars.healthFill.width * (this.p2Bars.health / 100));

        this.p1Bars.healthFill.setCrop(
            this.p1Bars.healthFill.width - p1HealthWidth,
            0,
            p1HealthWidth,
            this.p1Bars.healthFill.height
        );

        this.p2Bars.healthFill.setCrop(
            0,
            0,
            p2HealthWidth,
            this.p2Bars.healthFill.height
        );
    }

    updateStaminaBars() {
        const p1StaminaWidth = Math.floor(this.p1Bars.staminaFill.width * (this.p1Bars.stamina / 100));
        const p2StaminaWidth = Math.floor(this.p2Bars.staminaFill.width * (this.p2Bars.stamina / 100));

        this.p1Bars.staminaFill.setCrop(
            this.p1Bars.staminaFill.width - p1StaminaWidth,
            0,
            p1StaminaWidth,
            this.p1Bars.staminaFill.height
        );

        this.p2Bars.staminaFill.setCrop(
            0,
            0,
            p2StaminaWidth,
            this.p2Bars.staminaFill.height
        );
    }
}