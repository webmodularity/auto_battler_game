import * as Phaser from 'phaser';
import MainScene from './scenes/MainScene';

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent: 'game',
    scene: [MainScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    // Add these scaling settings
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 960,
            height: 540
        },
        max: {
            width: 960,
            height: 540
        }
    },
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: false
    }
};

new Phaser.Game(config);
