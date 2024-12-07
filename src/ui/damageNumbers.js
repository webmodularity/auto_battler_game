import * as WebFont from 'webfontloader';

export class DamageNumbers {
    constructor(scene) {
        this.scene = scene;
        this.damageNumberConfig = {
            fontSize: {
                damage: '64px',
                text: '52px'
            },
            fontFamily: 'Bokor',
            duration: 1500,
            rise: 200,
            colors: {
                damage: '#ff0000',    // Red
                block: '#6666ff',     // Blue
                dodge: '#66ffff',     // Cyan
                miss: '#ffffff',      // White
                counter: '#66ff66',   // Green
                exhausted: '#ff9900'  // Orange for exhausted
            }
        };
    }

    show(x, y, text, type = 'damage', scale = 1.0, isCrit = false) {
        const color = this.damageNumberConfig.colors[type];
        const fontSize = typeof text === 'number' ? 
            this.damageNumberConfig.fontSize.damage : 
            this.damageNumberConfig.fontSize.text;

        // Apply crit scaling if needed
        const finalScale = isCrit ? scale * 2.0 : scale;

        const damageText = this.scene.add.text(x, y - 50, text, {
            fontSize: fontSize,
            fontFamily: this.damageNumberConfig.fontFamily,
            color: color,
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        })
        .setOrigin(0.5, 0.5)
        .setDepth(100)
        .setScale(finalScale);

        this.scene.tweens.add({
            targets: damageText,
            y: y - this.damageNumberConfig.rise - 50,
            alpha: 0,
            duration: this.damageNumberConfig.duration,
            ease: 'Power1',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
} 