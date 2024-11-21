import * as Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Load assets here
    }

    create() {
        this.add.text(400, 300, 'Auto Battler Game', {
            fontSize: '32px'
        }).setOrigin(0.5);
    }

    update() {
        // Game loop
    }
}
