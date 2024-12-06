import * as Phaser from 'phaser';
import { CombatAnimator } from '../combat/combatAnimator';
import { CombatSequenceHandler } from '../combat/combatSequenceHandler';
import { HealthManager } from '../combat/healthManager';
import { VictoryHandler } from '../combat/victoryHandler';
import { DamageNumbers } from '../ui/damageNumbers';

export default class NewFightScene extends Phaser.Scene {
    constructor() {
        super({ key: 'FightScene' });
        
        // Core components
        this.animator = null;
        this.sequenceHandler = null;
        this.healthManager = null;
        this.victoryHandler = null;
        this.damageNumbers = null;

        // Basic scene properties
        this.player = null;
        this.player2 = null;
        this.combatData = null;
        
        // Configuration
        this.SEQUENCE_DELAY = 2000;
        this.COUNTER_DELAY = 1000;
        this.INITIAL_DELAY = 1000;
    }

    init(data) {
        this.player1Id = data.player1Id;
        this.player2Id = data.player2Id;
        this.player1Data = data.player1Data;
        this.player2Data = data.player2Data;
    }

    create() {
        // Initialize components
        this.animator = new CombatAnimator(this);
        this.sequenceHandler = new CombatSequenceHandler(this);
        this.healthManager = new HealthManager(this);
        this.victoryHandler = new VictoryHandler(this);
        this.damageNumbers = new DamageNumbers(this);

        // Setup players, health bars, etc.
        this.setupPlayers();
        this.healthManager.createBars();

        // Start combat sequence
        this.time.delayedCall(this.INITIAL_DELAY, () => {
            this.playCombatSequence(0);
        });
    }

    setupPlayers() {
        // Example player setup
        this.player = this.add.sprite(200, 300, 'player1');
        this.player2 = this.add.sprite(600, 300, 'player2');
        
        // Initialize animations
        this.animator.setupAnimationComplete(this.player);
        this.animator.setupAnimationComplete(this.player2, true);
    }

    playCombatSequence(actionIndex) {
        const action = this.combatData.actions[actionIndex];
        const isLastAction = actionIndex === this.combatData.actions.length - 1;
        
        // Use sequence handler
        const animationTriggered = this.sequenceHandler.handleSequence(action, isLastAction);

        if (!isLastAction && animationTriggered) {
            // Calculate appropriate delay based on action type
            const delay = this.calculateDelay(action);
            
            this.time.delayedCall(delay, () => {
                this.playCombatSequence(actionIndex + 1);
            });
        }
    }

    calculateDelay(action) {
        // Add extra delay for counter/riposte actions
        if (action.p1Result === CombatResultType.COUNTER || 
            action.p2Result === CombatResultType.COUNTER ||
            action.p1Result === CombatResultType.RIPOSTE ||
            action.p2Result === CombatResultType.RIPOSTE) {
            return this.SEQUENCE_DELAY + this.COUNTER_DELAY;
        }
        return this.SEQUENCE_DELAY;
    }
} 