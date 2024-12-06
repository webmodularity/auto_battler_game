export class HealthManager {
    constructor(scene) {
        this.scene = scene;
        this.healthBars = {
            player1: null,
            player2: null
        };
        this.staminaBars = {
            player1: null,
            player2: null
        };
    }

    createBars() {
        // Create health bars
        this.healthBars.player1 = this.createHealthBar(200, 50);
        this.healthBars.player2 = this.createHealthBar(600, 50);

        // Create stamina bars
        this.staminaBars.player1 = this.createStaminaBar(200, 80);
        this.staminaBars.player2 = this.createStaminaBar(600, 80);
    }

    createHealthBar(x, y) {
        const width = 200;
        const height = 20;
        
        const bar = this.scene.add.graphics();
        bar.setScrollFactor(0);
        
        // Draw background
        bar.fillStyle(0x2c2c2c);
        bar.fillRect(x - width/2, y, width, height);
        
        // Draw health
        bar.fillStyle(0xff0000);
        bar.fillRect(x - width/2, y, width, height);
        
        return bar;
    }

    createStaminaBar(x, y) {
        const width = 200;
        const height = 10;
        
        const bar = this.scene.add.graphics();
        bar.setScrollFactor(0);
        
        // Draw background
        bar.fillStyle(0x2c2c2c);
        bar.fillRect(x - width/2, y, width, height);
        
        // Draw stamina
        bar.fillStyle(0x00ff00);
        bar.fillRect(x - width/2, y, width, height);
        
        return bar;
    }

    updateBars(player1Health, player2Health, player1Stamina, player2Stamina) {
        this.updateHealthBar(this.healthBars.player1, player1Health);
        this.updateHealthBar(this.healthBars.player2, player2Health);
        this.updateStaminaBar(this.staminaBars.player1, player1Stamina);
        this.updateStaminaBar(this.staminaBars.player2, player2Stamina);
    }

    updateHealthBar(bar, percentage) {
        bar.clear();
        const width = 200;
        const height = 20;
        const x = bar.x;
        const y = bar.y;

        // Draw background
        bar.fillStyle(0x2c2c2c);
        bar.fillRect(x - width/2, y, width, height);

        // Draw health
        bar.fillStyle(0xff0000);
        bar.fillRect(x - width/2, y, width * (percentage/100), height);
    }

    updateStaminaBar(bar, percentage) {
        bar.clear();
        const width = 200;
        const height = 10;
        const x = bar.x;
        const y = bar.y;

        // Draw background
        bar.fillStyle(0x2c2c2c);
        bar.fillRect(x - width/2, y, width, height);

        // Draw stamina
        bar.fillStyle(0x00ff00);
        bar.fillRect(x - width/2, y, width * (percentage/100), height);
    }
} 