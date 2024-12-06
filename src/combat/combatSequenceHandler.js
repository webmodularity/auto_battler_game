import { CombatResultType } from '../utils/combatDecoder';
import { COMBAT_RESULT_TO_ANIMATION } from '../animations/playerAnimations';

export class CombatSequenceHandler {
    constructor(scene) {
        this.scene = scene;
        this.animator = scene.animator;
        this.DEFENSE_DELAY = 400;
    }

    handleSequence(action, isLastAction) {
        console.log('New Sequence:', action);
        
        // First, determine who's attacking by finding the offensive action
        const isOffensiveAction = result => {
            console.log('Checking offensive action for:', result); // Debug log
            
            // Convert result to string if it's not already
            const resultStr = result.toString().toUpperCase();
            
            return [
                'ATTACK',
                'CRIT',
                'EXHAUSTED'
            ].includes(resultStr);
        };

        // Debug logs to check values
        console.log('P1 Result:', action.p1Result, 'Type:', typeof action.p1Result);
        console.log('P2 Result:', action.p2Result, 'Type:', typeof action.p2Result);

        // Check which player has the offensive action
        if (isOffensiveAction(action.p2Result)) {
            console.log('Player 2 attacking with', action.p2Result);
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
            console.log('Player 1 attacking with', action.p1Result);
            this.playAttackSequence(
                this.scene.player,    // attacker
                this.scene.player2,   // defender
                action.p1Result,      // attack type
                action.p1Damage,      // attack damage
                action.p2Result,      // defense type
                false,               // is not player 2
                isLastAction
            );
        } else {
            console.warn('No offensive action found in sequence:', action);
            console.warn('CombatResultType.ATTACK =', CombatResultType.ATTACK);
        }

        return true;
    }

    playAttackSequence(attacker, defender, attackType, damage, defenseType, isPlayer2, isLastAction) {
        console.log(`${isPlayer2 ? 'Player 2' : 'Player 1'} attacking with ${attackType}`);
        console.log(`${!isPlayer2 ? 'Player 2' : 'Player 1'} should defend with ${defenseType}`);
    
        // 1. Play attack animation
        this.animator.playAnimation(attacker, 'attacking', isPlayer2);
    
        // 2. Show attack effects only for exhausted state
        const attackText = attackType.toString().toUpperCase();
        switch(attackText) {
            case 'EXHAUSTED':
                this.scene.showDamageNumber(attacker.x, attacker.y - 200, 'Exhausted!', 'exhausted');
                break;
        }
    
        attacker.once('animationcomplete', () => {
            console.log('Attack animation complete');
            this.animator.playAnimation(attacker, 'idle', isPlayer2);
            
            // Always play defense phase, even for misses
            this.scene.time.delayedCall(this.DEFENSE_DELAY, () => {
                console.log('Playing defense animation:', defenseType);
                this.playDefenseAnimation(defender, defenseType, damage, !isPlayer2, isLastAction, attackText === 'CRIT');
            });
        });
    }
    
    playDefenseAnimation(defender, defenseType, damage, isPlayer2, isLastAction, isCrit = false) {
        console.log(`${isPlayer2 ? 'Player 2' : 'Player 1'} defending with ${defenseType}`);
        
        const defenseText = defenseType.toString().toUpperCase();
        const attacker = isPlayer2 ? this.scene.player : this.scene.player2;
        
        // Show defense text FIRST
        switch(defenseText) {
            case 'MISS':
                this.scene.showDamageNumber(defender.x, defender.y - 200, 'Miss!', 'miss');
                this.completeSequence(isLastAction);
                return;
            case 'DODGE':
                this.scene.showDamageNumber(defender.x, defender.y - 200, 'Dodge!', 'dodge');
                this.animator.playAnimation(defender, 'dodging', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.animator.playAnimation(defender, 'idle', isPlayer2);
                    this.completeSequence(isLastAction);
                });
                return;
            case 'HIT':
                if (isCrit) {
                    this.scene.showDamageNumber(defender.x, defender.y - 200, `-${damage}`, 'damage', 2.0);
                } else {
                    this.scene.showDamageNumber(defender.x, defender.y - 200, `-${damage}`, 'damage');
                }
                // Play hurt animation for regular hits
                this.animator.playAnimation(defender, 'hurt', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.animator.playAnimation(defender, 'idle', isPlayer2);
                    this.completeSequence(isLastAction);
                });
                return;
            case 'BLOCK':
                this.scene.showDamageNumber(defender.x, defender.y - 200, 'Block!', 'block');
                this.animator.playAnimation(defender, 'blocking', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.animator.playAnimation(defender, 'idle', isPlayer2);
                    this.completeSequence(isLastAction);
                });
                return;
            case 'COUNTER':
            case 'COUNTER_CRIT':
                this.scene.showDamageNumber(defender.x, defender.y - 200, 'Counter!', 'counter');
                this.animator.playAnimation(defender, 'blocking', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.scene.time.delayedCall(this.DEFENSE_DELAY, () => {
                        this.animator.playAnimation(defender, 'attacking', isPlayer2);
                        const damageScale = defenseText === 'COUNTER_CRIT' ? 2.0 : 1.0;
                        this.scene.showDamageNumber(attacker.x, attacker.y - 200, `-${damage}`, 'damage', damageScale);
                        defender.once('animationcomplete', () => {
                            this.animator.playAnimation(defender, 'idle', isPlayer2);
                            this.completeSequence(isLastAction);
                        });
                    });
                });
                return;
            case 'PARRY':
                this.scene.showDamageNumber(defender.x, defender.y - 200, 'Parry!', 'block');
                this.animator.playAnimation(defender, 'attacking', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.animator.playAnimation(defender, 'idle', isPlayer2);
                    this.completeSequence(isLastAction);
                });
                return;
            case 'RIPOSTE':
            case 'RIPOSTE_CRIT':
                this.scene.showDamageNumber(defender.x, defender.y - 200, 'Riposte!', 'counter');
                this.animator.playAnimation(defender, 'attacking', isPlayer2);
                defender.once('animationcomplete', () => {
                    this.scene.time.delayedCall(this.DEFENSE_DELAY, () => {
                        this.animator.playAnimation(defender, 'attacking', isPlayer2);
                        const damageScale = defenseText === 'RIPOSTE_CRIT' ? 2.0 : 1.0;
                        this.scene.showDamageNumber(attacker.x, attacker.y - 200, `-${damage}`, 'damage', damageScale);
                        defender.once('animationcomplete', () => {
                            this.animator.playAnimation(defender, 'idle', isPlayer2);
                            this.completeSequence(isLastAction);
                        });
                    });
                });
                return;
        }

        // Default case - play hurt animation if no special case was handled
        this.animator.playAnimation(defender, 'hurt', isPlayer2);
        defender.once('animationcomplete', () => {
            this.animator.playAnimation(defender, 'idle', isPlayer2);
            this.completeSequence(isLastAction);
        });
    }

    completeSequence(isLastAction) {
        console.log('Complete Sequence called, isLastAction:', isLastAction); // Debug log
        
        if (isLastAction) {
            console.log('This is the last action, emitting fightComplete'); // Debug log
            this.scene.events.emit('fightComplete');
        } else {
            console.log('Not last action, emitting regular sequenceComplete'); // Debug log
            this.scene.events.emit('sequenceComplete', isLastAction);
        }
    }

    startVictoryLap(winner, isPlayer2) {
        console.log('Starting victory lap for', isPlayer2 ? 'Player 2' : 'Player 1'); // Debug log
        
        // Play victory animation
        this.animator.playAnimation(winner, 'victory', isPlayer2);
        
        // After victory animation, start walking
        winner.once('animationcomplete', () => {
            console.log('Victory animation complete, starting walk'); // Debug log
            this.animator.playAnimation(winner, 'walking', isPlayer2);
            
            // Move the winner across the screen
            this.scene.tweens.add({
                targets: winner,
                x: isPlayer2 ? -100 : this.scene.game.config.width + 100,
                duration: 2000,
                ease: 'Linear',
                onComplete: () => {
                    console.log('Victory lap complete'); // Debug log
                    this.scene.events.emit('victoryComplete');
                }
            });
        });
    }
} 