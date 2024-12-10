export class VictoryHandler {
    constructor(scene) {
        this.scene = scene;
        this.animator = scene.animator;
        this.VICTORY_DELAY = 1000;
        this.WALK_DISTANCE = 100;
        this.WALK_DURATION = 1000;
    }

    handleVictory(winner, player1, player2) {
        const winnerId = Number(winner);
        const p1Id = Number(this.scene.player1Id);
        const p2Id = Number(this.scene.player2Id);

        if (winnerId === p1Id) {
            this.playVictorySequence(player1, player2);
        } else if (winnerId === p2Id) {
            this.playVictorySequence(player2, player1, true);
        } else {
            console.error('Invalid winner ID:', winner);
        }
    }

    playVictorySequence(winner, loser, isPlayer2 = false) {
        // Play dying animation for loser
        this.animator.playAnimation(loser, 'dying', !isPlayer2);

        // Get the player name from the scene data
        const winnerData = isPlayer2 ? this.scene.player2Data : this.scene.player1Data;
        const winnerName = winnerData?.name?.fullName || `Player ${isPlayer2 ? '2' : '1'}`;

        // First add Victory text
        const victoryText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 90,
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
                // After Victory text is in, add Player text
                const playerText = this.scene.add.text(
                    this.scene.cameras.main.centerX,
                    this.scene.cameras.main.centerY - 10,
                    winnerName,
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

        // After victory delay, turn and walk away, then taunt
        this.scene.time.delayedCall(this.VICTORY_DELAY, () => {
            // Turn away from opponent
            winner.setFlipX(!isPlayer2);
            
            // Play walking animation
            this.animator.playAnimation(winner, 'walking', isPlayer2);
            
            // Walk away from opponent
            this.scene.tweens.add({
                targets: winner,
                x: winner.x + (isPlayer2 ? this.WALK_DISTANCE : -this.WALK_DISTANCE),
                duration: this.WALK_DURATION,
                ease: 'Linear',
                onComplete: () => {
                    // After walking away, start taunting sequence
                    this.playTauntSequence(winner, isPlayer2);
                }
            });
        });
    }

    playTauntSequence(winner, isPlayer2, tauntCount = 0) {
        const MAX_TAUNTS = 7;
        
        if (tauntCount >= MAX_TAUNTS) {
            this.animator.playAnimation(winner, 'idle', isPlayer2);
            return;
        }

        this.animator.playAnimation(winner, 'taunting', isPlayer2);
        
        winner.once('animationcomplete', () => {
            tauntCount++;
            if (tauntCount < MAX_TAUNTS) {
                this.playTauntSequence(winner, isPlayer2, tauntCount);
            } else {
                this.animator.playAnimation(winner, 'idle', isPlayer2);
            }
        });
    }
} 