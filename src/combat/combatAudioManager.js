export class CombatAudioManager {
    constructor(scene) {
        this.scene = scene;
        this.soundsLoaded = false;
    }

    preloadSounds() {
        const sounds = [
            // Attack sounds
            { key: 'SwordAndShield-hit', path: 'assets/audio/weapons/sword_and_shield_hit.ogg' },
            { key: 'SwordAndShield-crit', path: 'assets/audio/weapons/sword_and_shield_crit.ogg' },
            { key: 'SwordAndShield-miss', path: 'assets/audio/weapons/sword_and_shield_miss.ogg' },
            
            // Defense sounds
            { key: 'shield-block', path: 'assets/audio/defense/shield_block.ogg' },
            { key: 'blade-parry', path: 'assets/audio/defense/blade_parry.ogg' },
        ];

        sounds.forEach(sound => {
            this.scene.load.audio(sound.key, sound.path);
        });

        // Add a completion listener
        this.scene.load.once('complete', () => {
            console.log('All sounds loaded');
            this.soundsLoaded = true;
        });

        // Add an error listener
        this.scene.load.on('loaderror', (fileObj) => {
            console.error('Error loading sound:', fileObj.key, fileObj);
        });
    }

    playAttackSound(weaponType, armorType, isCrit = false, isMiss = false) {
        console.log('playAttackSound called with:', { weaponType, armorType, isCrit, isMiss });
        
        // Only try to play if sounds are loaded
        if (!this.soundsLoaded) {
            console.warn('Sounds not yet loaded');
            return;
        }

        try {
            // Unlock audio context if needed
            if (this.scene.sound.locked) {
                console.log('Sound was locked, attempting to unlock');
                this.scene.sound.unlock();
            }

            const soundKey = this.determineSound(weaponType, armorType, isCrit, isMiss);
            console.log('Determined sound key:', soundKey);
            
            if (soundKey) {
                console.log('Attempting to play sound:', soundKey);
                const sound = this.scene.sound.play(soundKey);
                console.log('Sound play result:', sound);
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    playDefenseSound(defenseType, isCrit = false) {
        if (!this.soundsLoaded) return;

        try {
            const soundKey = this.determineDefenseSound(defenseType);
            if (soundKey) {
                this.scene.sound.play(soundKey);
                
                // For counter/riposte, we'll play the attack sound after a short delay
                if (['COUNTER', 'COUNTER_CRIT', 'RIPOSTE', 'RIPOSTE_CRIT'].includes(defenseType)) {
                    this.scene.time.delayedCall(200, () => {
                        const weaponType = 'SwordAndShield';
                        const attackSoundKey = this.determineSound(weaponType, null, isCrit);
                        this.scene.sound.play(attackSoundKey);
                    });
                }
            }
        } catch (error) {
            console.error('Error playing defense sound:', error);
        }
    }

    determineSound(weaponType, armorType, isCrit, isMiss = false) {
        // Add miss check before crit check
        if (isMiss) {
            return `${weaponType}-miss`;
        }
        return isCrit ? `${weaponType}-crit` : `${weaponType}-hit`;
    }

    determineDefenseSound(defenseType) {
        switch (defenseType) {
            case 'BLOCK':
                return 'shield-block';
            case 'PARRY':
                return 'blade-parry';
            case 'COUNTER':
            case 'COUNTER_CRIT':
                return 'shield-block'; // Counter starts with a block
            case 'RIPOSTE':
            case 'RIPOSTE_CRIT':
                return 'blade-parry'; // Riposte starts with a parry
            default:
                return null;
        }
    }
} 