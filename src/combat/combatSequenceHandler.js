import { CombatResultType } from '../utils/combatDecoder';
import { COMBAT_RESULT_TO_ANIMATION } from '../animations/playerAnimations';

export class CombatSequenceHandler {
    constructor(scene) {
        this.scene = scene;
        this.animator = scene.animator;
        this.DEFENSE_DELAY = 50;
    }

    handleSequence(action, isLastAction) {
        console.log('Raw Combat Action:', action);

        // Handle exhaustion first
        if (action.p1Result === 'EXHAUSTED') {
            this.scene.damageNumbers.show(
                this.scene.player.x, 
                this.scene.player.y - 200, 
                'Exhausted!', 
                'exhausted', 
                1.2
            );
            this.animator.playAnimation(this.scene.player, 'idle', false);
            // Add delay before completing sequence
            this.scene.time.delayedCall(1000, () => {
                this.completeSequence(isLastAction);
            });
            return;
        }

        if (action.p2Result === 'EXHAUSTED') {
            this.scene.damageNumbers.show(
                this.scene.player2.x, 
                this.scene.player2.y - 200, 
                'Exhausted!', 
                'exhausted', 
                1.2
            );
            this.animator.playAnimation(this.scene.player2, 'idle', true);
            // Add delay before completing sequence
            this.scene.time.delayedCall(1000, () => {
                this.completeSequence(isLastAction);
            });
            return;
        }

        // Get current values
        const currentP1Health = this.scene.healthManager.p1Bars.health;
        const currentP2Health = this.scene.healthManager.p2Bars.health;
        const currentP1Stamina = this.scene.healthManager.p1Bars.stamina;
        const currentP2Stamina = this.scene.healthManager.p2Bars.stamina;

        // Initialize new values with current values
        let newP1Health = currentP1Health;
        let newP2Health = currentP2Health;
        let newP1Stamina = Math.max(0, currentP1Stamina - (action.p1StaminaLost || 0));
        let newP2Stamina = Math.max(0, currentP2Stamina - (action.p2StaminaLost || 0));

        // Handle P2's defensive actions that deal damage
        if (['COUNTER', 'COUNTER_CRIT', 'RIPOSTE', 'RIPOSTE_CRIT'].includes(action.p2Result)) {
            const damage = Number(action.p2Damage);
            newP1Health = Math.max(0, currentP1Health - damage);
        }
        // If P2 gets HIT normally, apply P1's damage
        else if (action.p2Result === 'HIT' || action.p2Result === 'CRIT') {
            const damage = Number(action.p1Damage);
            newP2Health = Math.max(0, currentP2Health - damage);
        }

        // Handle P1's defensive actions that deal damage
        if (['COUNTER', 'COUNTER_CRIT', 'RIPOSTE', 'RIPOSTE_CRIT'].includes(action.p1Result)) {
            const damage = Number(action.p1Damage);
            newP2Health = Math.max(0, currentP2Health - damage);
        }
        // If P1 gets HIT normally, apply P2's damage
        else if (action.p1Result === 'HIT' || action.p1Result === 'CRIT') {
            const damage = Number(action.p2Damage);
            newP1Health = Math.max(0, currentP1Health - damage);
        }

        // Store the calculated values for the animation sequence
        this.pendingHealthUpdate = {
            p1Health: newP1Health,
            p2Health: newP2Health,
            p1Stamina: newP1Stamina,
            p2Stamina: newP2Stamina
        };

        console.log('Final health update:', {
            p1: { 
                oldHealth: currentP1Health, 
                newHealth: newP1Health,
                oldStamina: currentP1Stamina,
                newStamina: newP1Stamina,
                staminaLost: action.p1StaminaLost,
                result: action.p1Result,
                incomingDamage: action.p2Damage
            },
            p2: { 
                oldHealth: currentP2Health, 
                newHealth: newP2Health,
                oldStamina: currentP2Stamina,
                newStamina: newP2Stamina,
                staminaLost: action.p2StaminaLost,
                result: action.p2Result,
                incomingDamage: action.p1Damage
            }
        });

        // Update the health bars with actual values after a longer delay
        this.scene.time.delayedCall(1200, () => {
            this.scene.healthManager.updateBars(
                newP1Health,
                newP2Health,
                newP1Stamina,
                newP2Stamina
            );
        });

        // Continue with animation sequence
        if (this.isOffensiveAction(action.p2Result)) {
            this.playAttackSequence(
                this.scene.player2,
                this.scene.player,
                action.p2Result,
                action.p2Damage,
                action.p1Result,
                true,
                isLastAction,
                action
            );
        } else if (this.isOffensiveAction(action.p1Result)) {
            this.playAttackSequence(
                this.scene.player,
                this.scene.player2,
                action.p1Result,
                action.p1Damage,
                action.p2Result,
                false,
                isLastAction,
                action
            );
        }
    }

    playAttackSequence(attacker, defender, attackResult, attackerDamage, defenderResult, isPlayer2, isLastAction, action) {
        // Convert to uppercase string for consistency
        const attackText = attackResult.toString().toUpperCase();
        
        // Play attack animation
        this.animator.playAnimation(attacker, 'attacking', isPlayer2);
        
        // Only play attack sound if it's not being defended against
        const isDefended = ['BLOCK', 'PARRY', 'COUNTER', 'COUNTER_CRIT', 'RIPOSTE', 'RIPOSTE_CRIT'].includes(defenderResult);
        if (!isDefended) {
            const weaponType = 'SwordAndShield';
            const armorType = 'Leather';
            const isCrit = attackResult === 'CRIT';
            const isMiss = defenderResult === 'MISS' || defenderResult === 'DODGE';
            this.scene.audioManager.playAttackSound(weaponType, armorType, isCrit, isMiss);
        }

        attacker.once('animationcomplete', () => {
            this.animator.playAnimation(attacker, 'idle', isPlayer2);
            
            this.scene.time.delayedCall(this.DEFENSE_DELAY, () => {
                if (['COUNTER', 'COUNTER_CRIT', 'RIPOSTE', 'RIPOSTE_CRIT'].includes(defenderResult)) {
                    const defenderDamage = !isPlayer2 ? action.p2Damage : action.p1Damage;
                    this.playDefenseAnimation(
                        defender,
                        defenderResult,
                        defenderDamage,
                        !isPlayer2,
                        isLastAction,
                        defenderResult.includes('CRIT')
                    );
                } else {
                    this.playDefenseAnimation(
                        defender, 
                        defenderResult, 
                        attackerDamage, 
                        !isPlayer2, 
                        isLastAction, 
                        attackText === 'CRIT'
                    );
                }
            });
        });
    }
    
    playDefenseAnimation(defender, defenseType, damage, isPlayer2, isLastAction, isCrit = false) {
        const defenseText = defenseType.toString().toUpperCase();
        const attacker = isPlayer2 ? this.scene.player : this.scene.player2;
        
        // Handle exhaustion first
        if (defenseText === 'EXHAUSTED') {
            this.scene.damageNumbers.show(
                defender.x, 
                defender.y - 200, 
                'Exhausted!', 
                'exhausted', 
                1.2
            );
            this.animator.playAnimation(defender, 'idle', isPlayer2);
            this.completeSequence(isLastAction);
            return;
        }
        
        switch(defenseText) {
            case 'MISS':
            case 'DODGE':
                // Remove sound playing from here
                this.scene.damageNumbers.show(
                    defender.x, 
                    defender.y - 200, 
                    defenseText === 'MISS' ? 'Miss!' : 'Dodge!', 
                    defenseText.toLowerCase()
                );
                
                if (defenseText === 'DODGE') {
                    this.animator.playAnimation(defender, 'dodging', isPlayer2);
                    defender.once('animationcomplete', () => {
                        this.animator.playAnimation(defender, 'idle', isPlayer2);
                        this.completeSequence(isLastAction);
                    });
                } else {
                    this.completeSequence(isLastAction);
                }
                return;
            case 'HIT':
                // Remove sound playing from here
                this.scene.damageNumbers.show(
                    defender.x, 
                    defender.y - 200, 
                    `-${damage}`, 
                    'damage', 
                    1.0,
                    isCrit
                );
                this.animator.playAnimation(defender, 'hurt', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.animator.playAnimation(defender, 'idle', isPlayer2);
                    this.completeSequence(isLastAction);
                });
                return;
            case 'BLOCK':
                this.scene.audioManager.playDefenseSound('BLOCK');
                this.scene.damageNumbers.show(defender.x, defender.y - 200, 'Block!', 'block');
                this.animator.playAnimation(defender, 'blocking', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.animator.playAnimation(defender, 'idle', isPlayer2);
                    this.completeSequence(isLastAction);
                });
                return;
            case 'PARRY':
                this.scene.audioManager.playDefenseSound('PARRY');
                this.scene.damageNumbers.show(defender.x, defender.y - 200, 'Parry!', 'block');
                this.animator.playAnimation(defender, 'attacking', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.animator.playAnimation(defender, 'idle', isPlayer2);
                    this.completeSequence(isLastAction);
                });
                return;
            case 'COUNTER':
            case 'COUNTER_CRIT':
                this.scene.audioManager.playDefenseSound(defenseText, defenseText === 'COUNTER_CRIT');
                this.scene.damageNumbers.show(defender.x, defender.y - 200, 'Counter!', 'counter');
                this.animator.playAnimation(defender, 'blocking', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.scene.time.delayedCall(this.DEFENSE_DELAY, () => {
                        this.animator.playAnimation(defender, 'attacking', isPlayer2);
                        this.scene.damageNumbers.show(
                            attacker.x, 
                            attacker.y - 200, 
                            `-${damage}`, 
                            'damage', 
                            1.0,
                            defenseText === 'COUNTER_CRIT'
                        );
                        defender.once('animationcomplete', () => {
                            this.animator.playAnimation(defender, 'idle', isPlayer2);
                            this.completeSequence(isLastAction);
                        });
                    });
                });
                return;
            case 'RIPOSTE':
            case 'RIPOSTE_CRIT':
                this.scene.audioManager.playDefenseSound(defenseText, defenseText === 'RIPOSTE_CRIT');
                this.scene.damageNumbers.show(defender.x, defender.y - 200, 'Riposte!', 'counter');
                this.animator.playAnimation(defender, 'attacking', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.scene.time.delayedCall(this.DEFENSE_DELAY, () => {
                        this.animator.playAnimation(defender, 'attacking', isPlayer2);
                        this.scene.damageNumbers.show(
                            attacker.x, 
                            attacker.y - 200, 
                            `-${damage}`, 
                            'damage', 
                            1.0,
                            defenseText === 'RIPOSTE_CRIT'
                        );
                        defender.once('animationcomplete', () => {
                            this.animator.playAnimation(defender, 'idle', isPlayer2);
                            this.completeSequence(isLastAction);
                        });
                    });
                });
                return;
        }

        this.animator.playAnimation(defender, 'hurt', isPlayer2);
        defender.once('animationcomplete', () => {
            this.animator.playAnimation(defender, 'idle', isPlayer2);
            this.completeSequence(isLastAction);
        });
    }

    completeSequence(isLastAction) {
        if (isLastAction) {
            this.scene.events.emit('fightComplete');
        } else {
            this.scene.events.emit('sequenceComplete', isLastAction);
        }
    }

    startVictoryLap(winner, isPlayer2) {
        this.animator.playAnimation(winner, 'victory', isPlayer2);
        
        winner.once('animationcomplete', () => {
            this.animator.playAnimation(winner, 'walking', isPlayer2);
            
            this.scene.tweens.add({
                targets: winner,
                x: isPlayer2 ? -100 : this.scene.game.config.width + 100,
                duration: 2000,
                ease: 'Linear',
                onComplete: () => {
                    this.scene.events.emit('victoryComplete');
                }
            });
        });
    }

    isOffensiveAction(result) {
        const resultStr = result.toString().toUpperCase();
        return ['ATTACK', 'CRIT'].includes(resultStr);
    }
}