import * as Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import FightScene from './scenes/FightScene';
//import NewFightScene from './scenes/NewFightScene';

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 540,
    parent: 'game',
    scene: [BootScene, FightScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
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
