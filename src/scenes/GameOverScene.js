export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create(data) {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;
        const level = data?.level ?? 1;

        this.add.text(cx, cy - 80, 'GAME OVER', {
            fontSize: '48px',
            fontFamily: 'Arial Black, Arial',
            color: '#ff3333',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        // Retry button
        const retry = this.add.text(cx, cy + 20, '[ RETRY ]', {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        retry.on('pointerover', () => retry.setColor('#ffff00'));
        retry.on('pointerout',  () => retry.setColor('#ffffff'));
        retry.on('pointerdown', () => this.scene.start('GameScene', { level }));

        // Main menu button
        const menu = this.add.text(cx, cy + 90, '[ MAIN MENU ]', {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        menu.on('pointerover', () => menu.setColor('#ffff00'));
        menu.on('pointerout',  () => menu.setColor('#ffffff'));
        menu.on('pointerdown', () => this.scene.start('LevelSelectScene'));

        // Gamepad: A = retry, B = menu, hint text
        this.add.text(cx, cy + 155, '🎮  A  Retry    B  Menu', {
            fontSize: '13px', fontFamily: 'Arial', color: '#888888',
        }).setOrigin(0.5);

        let selectedBtn = 0; // 0 = retry, 1 = menu
        const highlight = () => {
            retry.setColor(selectedBtn === 0 ? '#ffff00' : '#ffffff');
            menu.setColor(selectedBtn === 1  ? '#ffff00' : '#ffffff');
        };
        highlight();

        this.input.gamepad.on('down', (pad, button) => {
            const idx = button.index;
            if (idx === 12 || idx === 13) { // d-pad up/down
                selectedBtn = selectedBtn === 0 ? 1 : 0;
                highlight();
            }
            if (idx === 0) { // A
                if (selectedBtn === 0) this.scene.start('GameScene', { level });
                else this.scene.start('LevelSelectScene');
            }
            if (idx === 1) { // B = menu
                this.scene.start('LevelSelectScene');
            }
        });
    }
}
