import { VALID_ANIMATIONS } from '../animations/playerAnimations';

export class CombatAnimator {
    constructor(scene) {
        this.scene = scene;
        
        // Use the valid animations from playerAnimations
        this.animationTypes = Object.keys(VALID_ANIMATIONS);

        // Flag to prevent animation interruption
        this.isPlayingOneShot = false;
    }

    playAnimation(sprite, animationType, isPlayer2 = false) {
        const suffix = isPlayer2 ? '2' : '';
        const animKey = animationType + suffix;
    
        // Check if animation exists and is valid
        if (this.scene.anims.exists(animKey)) {
            // For one-shot animations, always play
            if (VALID_ANIMATIONS[animationType]?.repeat === false) {
                sprite.play(animKey);
            } 
            // For repeating animations, only play if not already playing
            else if (!sprite.anims.isPlaying || sprite.anims.currentAnim.key !== animKey) {
                sprite.play(animKey);
            }
        } else {
            console.warn(`Animation ${animKey} not found!`);
        }
    }

    // One-shot animations that shouldn't be interrupted
    playOneShotAnimation(sprite, animationType, isPlayer2 = false) {
        if (VALID_ANIMATIONS[animationType]?.repeat === false) {
            this.isPlayingOneShot = true;
            this.playAnimation(sprite, animationType, isPlayer2);
        }
    }

    // Setup animation completion handler
    setupAnimationComplete(sprite, isPlayer2 = false) {        
        sprite.on('animationcomplete', (animation) => {
            const baseKey = isPlayer2 ? animation.key.replace('2', '') : animation.key;
            
            // Only switch to idle if it's a one-shot animation
            if (VALID_ANIMATIONS[baseKey]?.repeat === false) {
                // this.playAnimation(sprite, 'idle', isPlayer2);
                this.isPlayingOneShot = false;
            }
        });
    }

    canPlayAnimation() {
        return !this.isPlayingOneShot;
    }
} 