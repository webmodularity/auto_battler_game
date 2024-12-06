export class DamageNumbers {
    constructor(scene) {
        this.scene = scene;
    }

    show(x, y, value, type = 'damage') {
        let color, prefix = '';
        
        switch(type) {
            case 'damage':
                color = '#ff0000';
                break;
            case 'miss':
                color = '#ffffff';
                prefix = '';
                break;
            case 'block':
                color = '#ffff00';
                break;
            case 'counter':
                color = '#00ff00';
                break;
            default:
                color = '#ffffff';
        }

        const text = this.scene.add.text(x, y, prefix + value, {
            fontSize: '32px',
            fill: color,
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: text,
            y: y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                text.destroy();
            }
        });
    }
} 