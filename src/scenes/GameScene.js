export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create(data) {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;
        const level = data?.level ?? 1;

        // Show Snapper in the centre
        const snapper = this.add.sprite(cx, cy, 'snapper');
        this.anims.create({
            key: 'snapper_idle',
            frames: this.anims.generateFrameNumbers('snapper', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1,
        });
        snapper.play('snapper_idle');

        this.add.text(cx, cy - 160, `LEVEL ${level}`, {
            fontSize: '22px',
            fontFamily: 'Arial Black, Arial',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.add.text(cx, cy + 130, 'Gameplay coming soon!', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa',
        }).setOrigin(0.5);

        // ESC returns to level select
        this.add.text(cx, cy + 160, 'Press ESC to go back', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#666666',
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-ESC', () => this.scene.start('LevelSelectScene'));

        // Temp button to test Game Over screen
        const btn = this.add.text(cx, cy + 195, '[ Test Game Over ]', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ff6666',
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => this.scene.start('GameOverScene', { level }));
    }
}
