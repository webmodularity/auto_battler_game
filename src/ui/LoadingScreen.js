export class LoadingScreen {
    constructor(scene) {
        this.scene = scene;
        this.loadingGroup = scene.add.group();
        
        // Create loading screen elements
        this.createLoadingScreen();
    }

    createLoadingScreen() {
        const { width, height } = this.scene.cameras.main;
        
        // Semi-transparent background
        this.background = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
            .setOrigin(0)
            .setDepth(1000);
            
        // Loading text
        this.loadingText = this.scene.add.text(width/2, height/2 - 50, 'Loading...', {
            fontFamily: 'Bokor',
            fontSize: '32px',
            color: '#ffffff'
        })
        .setOrigin(0.5)
        .setDepth(1001);
        
        // Progress bar background
        this.progressBg = this.scene.add.rectangle(width/2 - 150, height/2 + 20, 300, 30, 0x666666)
            .setOrigin(0, 0.5)
            .setDepth(1001);
            
        // Progress bar fill
        this.progressBar = this.scene.add.rectangle(width/2 - 150, height/2 + 20, 0, 30, 0x00ff00)
            .setOrigin(0, 0.5)
            .setDepth(1001);
            
        // Add everything to the group
        this.loadingGroup.addMultiple([
            this.background,
            this.loadingText,
            this.progressBg,
            this.progressBar
        ]);
        
        // Setup loading progress events
        this.scene.load.on('progress', this.updateProgress, this);
    }

    updateProgress(value) {
        this.progressBar.width = 300 * value;
    }

    show() {
        this.loadingGroup.setVisible(true);
    }

    hide() {
        this.scene.tweens.add({
            targets: this.loadingGroup.getChildren(),
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.loadingGroup.setVisible(false);
            }
        });
    }

    showError(message) {
        this.loadingText.setText(message);
        this.loadingText.setColor('#ff0000');
        this.progressBar.setFillStyle(0xff0000);
    }

    destroy() {
        this.loadingGroup.destroy(true);
        this.scene.load.off('progress', this.updateProgress, this);
    }
} 