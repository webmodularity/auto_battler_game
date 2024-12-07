import { CombatResultType } from '../utils/combatDecoder';
import { COMBAT_RESULT_TO_ANIMATION } from '../animations/playerAnimations';

export class CombatSequenceHandler {
    constructor(scene) {
        this.scene = scene;
        this.animator = scene.animator;
        this.DEFENSE_DELAY = 400;
    }

    handleSequence(action, isLastAction) {
        const isOffensiveAction = result => {
            const resultStr = result.toString().toUpperCase();
            return ['ATTACK', 'CRIT', 'EXHAUSTED'].includes(resultStr);
        };

        if (isOffensiveAction(action.p2Result)) {
            this.playAttackSequence(
                this.scene.player2,   // attacker
                this.scene.player,    // defender
                action.p2Result,      // attack type
                action.p2Damage,      // attack damage
                action.p1Result,      // defense type
                true,                // is player 2
                isLastAction
            );
        } else if (isOffensiveAction(action.p1Result)) {
            this.playAttackSequence(
                this.scene.player,    // attacker
                this.scene.player2,   // defender
                action.p1Result,      // attack type
                action.p1Damage,      // attack damage
                action.p2Result,      // defense type
                false,               // is not player 2
                isLastAction
            );
        }
    }

    playAttackSequence(attacker, defender, attackType, damage, defenseType, isPlayer2, isLastAction) {
        this.animator.playAnimation(attacker, 'attacking', isPlayer2);
    
        const attackText = attackType.toString().toUpperCase();
        switch(attackText) {
            case 'EXHAUSTED':
                this.scene.damageNumbers.show(attacker.x, attacker.y - 200, 'Exhausted!', 'exhausted');
                break;
        }
    
        attacker.once('animationcomplete', () => {
            this.animator.playAnimation(attacker, 'idle', isPlayer2);
            
            this.scene.time.delayedCall(this.DEFENSE_DELAY, () => {
                this.playDefenseAnimation(defender, defenseType, damage, !isPlayer2, isLastAction, attackText === 'CRIT');
            });
        });
    }
    
    playDefenseAnimation(defender, defenseType, damage, isPlayer2, isLastAction, isCrit = false) {
        const defenseText = defenseType.toString().toUpperCase();
        const attacker = isPlayer2 ? this.scene.player : this.scene.player2;
        
        switch(defenseText) {
            case 'MISS':
                this.scene.damageNumbers.show(defender.x, defender.y - 200, 'Miss!', 'miss');
                this.completeSequence(isLastAction);
                return;
            case 'DODGE':
                this.scene.damageNumbers.show(defender.x, defender.y - 200, 'Dodge!', 'dodge');
                this.animator.playAnimation(defender, 'dodging', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.animator.playAnimation(defender, 'idle', isPlayer2);
                    this.completeSequence(isLastAction);
                });
                return;
            case 'HIT':
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
                this.scene.damageNumbers.show(defender.x, defender.y - 200, 'Block!', 'block');
                this.animator.playAnimation(defender, 'blocking', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.animator.playAnimation(defender, 'idle', isPlayer2);
                    this.completeSequence(isLastAction);
                });
                return;
            case 'COUNTER':
            case 'COUNTER_CRIT':
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
            case 'PARRY':
                this.scene.damageNumbers.show(defender.x, defender.y - 200, 'Parry!', 'block');
                this.animator.playAnimation(defender, 'attacking', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.animator.playAnimation(defender, 'idle', isPlayer2);
                    this.completeSequence(isLastAction);
                });
                return;
            case 'RIPOSTE':
            case 'RIPOSTE_CRIT':
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
} 