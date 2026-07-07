export default class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.add.text(cx, cy - 80, 'SALAD SLAYER: SNAPPER', {
            fontSize: '36px',
            fontFamily: 'Arial Black, Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        this.add.text(cx, cy - 30, 'Leaf No Survivors', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#aaffaa',
            fontStyle: 'italic',
        }).setOrigin(0.5);

        const prompt = this.add.text(cx, cy + 60, 'PRESS ANY BUTTON TO BEGIN', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffff00',
        }).setOrigin(0.5);

        // Blink the prompt
        this.tweens.add({
            targets: prompt,
            alpha: 0,
            duration: 600,
            yoyo: true,
            repeat: -1,
        });

        // Wait 750ms before accepting any input so bleed-through events from the previous scene are ignored
        const go = () => this.scene.start('LevelSelectScene');
        this.time.delayedCall(750, () => {
            this.input.once('pointerdown', go);
            this.input.keyboard.once('keydown', go);
            this.input.gamepad.once('down', go);
        });
    }
}
