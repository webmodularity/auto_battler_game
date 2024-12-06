export class VictoryHandler {
    constructor(scene) {
        this.scene = scene;
        this.animator = scene.animator;
        this.VICTORY_DELAY = 1000;
    }

    handleVictory(winner, player1, player2) {
        console.log('VictoryHandler.handleVictory called with:', {
            winner,
            player1,
            player2,
            hasAnimator: !!this.animator,
            scene: this.scene
        });

        console.log('Victory check values:', {
            winner,
            player1Id: this.scene.player1Id,
            player2Id: this.scene.player2Id,
            typeof_winner: typeof winner,
            typeof_player1Id: typeof this.scene.player1Id,
            typeof_player2Id: typeof this.scene.player2Id
        });

        // Convert to same type for comparison if needed
        const winnerId = Number(winner);
        const p1Id = Number(this.scene.player1Id);
        const p2Id = Number(this.scene.player2Id);

        if (winnerId === p1Id) {
            console.log('Player 1 wins, calling playVictorySequence');
            this.playVictorySequence(player1, player2);
        } else if (winnerId === p2Id) {
            console.log('Player 2 wins, calling playVictorySequence');
            this.playVictorySequence(player2, player1, true);
        } else {
            console.error('Invalid winner ID:', winner);
        }
    }

    playVictorySequence(winner, loser, isPlayer2 = false) {
        console.log('Starting victory sequence');
        
        // Play dying animation for loser
        this.animator.playAnimation(loser, 'dying', !isPlayer2);

        // First add Victory text (moved up 50px from -40 to -90)
        const victoryText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 90,  // Moved up 50px
            'Victory',
            {
                fontFamily: 'Bokor',
                fontSize: '120px',
                color: '#ff3333',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center'
            }
        )
        .setOrigin(0.5)
        .setDepth(100)
        .setAlpha(0);

        // Fade in Victory text first
        this.scene.tweens.add({
            targets: victoryText,
            alpha: 1,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => {
                // After Victory text is in, add Player text (also moved up 50px from +40 to -10)
                const playerText = this.scene.add.text(
                    this.scene.cameras.main.centerX,
                    this.scene.cameras.main.centerY - 10,  // Moved up 50px
                    `Player ${isPlayer2 ? '2' : '1'}`,
                    {
                        fontFamily: 'Bokor',
                        fontSize: '60px',
                        color: '#ff3333',
                        stroke: '#000000',
                        strokeThickness: 6,
                        align: 'center'
                    }
                )
                .setOrigin(0.5)
                .setDepth(100)
                .setAlpha(0);

                // Slide in and fade in player text
                this.scene.tweens.add({
                    targets: playerText,
                    alpha: 1,
                    x: {
                        from: this.scene.cameras.main.centerX - 100,
                        to: this.scene.cameras.main.centerX
                    },
                    duration: 800,
                    ease: 'Power2'
                });
            }
        });

        // Track number of taunts (increased to 6)
        let tauntCount = 0;
        const MAX_TAUNTS = 10;  // Doubled from 3 to 6

        // After a delay, start victory taunting
        this.scene.time.delayedCall(this.VICTORY_DELAY, () => {
            const playTaunt = () => {
                console.log(`Playing taunt ${tauntCount + 1} of ${MAX_TAUNTS}`);
                this.animator.playAnimation(winner, 'taunting', isPlayer2);
                
                winner.once('animationcomplete', () => {
                    tauntCount++;
                    if (tauntCount < MAX_TAUNTS) {
                        playTaunt(); // Play another taunt
                    } else {
                        this.animator.playAnimation(winner, 'idle', isPlayer2); // Return to idle after all taunts
                    }
                });
            };

            playTaunt(); // Start the first taunt
        });
    }

    // Add helper method for creating styled text (same as FightScene)
    createStyledText(x, y, text, scale = 1) {
        const titleTextConfig = {
            main: {
                fontFamily: 'Bokor',
                fontSize: '140px',
                color: '#ffd700', // Golden color
                stroke: '#8b0000', // Dark red stroke
                strokeThickness: 12,
                shadow: { 
                    offsetX: 2, 
                    offsetY: 2, 
                    color: '#000000', 
                    blur: 5, 
                    fill: true,
                    stroke: true
                }
            },
            shadow: {
                fontFamily: 'Bokor',
                fontSize: '144px',
                color: '#000000',
                alpha: 0.7
            },
            metallic: {
                fontFamily: 'Bokor',
                fontSize: '140px',
                color: '#ffffff'
            }
        };

        const shadowText = this.scene.add.text(x + 4, y, text, titleTextConfig.shadow)
            .setOrigin(0.5)
            .setScale(scale);

        const mainText = this.scene.add.text(x, y, text, titleTextConfig.main)
            .setOrigin(0.5)
            .setScale(scale);

        const metalGradient = this.scene.add.text(x, y, text, titleTextConfig.metallic)
            .setOrigin(0.5)
            .setAlpha(0.3)
            .setScale(scale);

        return { shadowText, mainText, metalGradient };
    }
} 