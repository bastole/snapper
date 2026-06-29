export default class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super('LevelSelectScene');
    }

    create() {
        const cx = this.cameras.main.width / 2;

        this.add.text(cx, 50, 'SELECT LEVEL', {
            fontSize: '28px',
            fontFamily: 'Arial Black, Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5);

        const levels = [
            { number: 1, name: 'Iceberg Lettuce & Basil',  unlocked: true  },
            { number: 2, name: 'Rocket & Oregano',         unlocked: false },
            { number: 3, name: 'Coriander & Carrot',       unlocked: false },
            { number: 4, name: 'Spinach & Mulberry',       unlocked: false },
            { number: 5, name: 'The Garden',               unlocked: false },
        ];

        levels.forEach((level, i) => {
            const y = 130 + i * 60;
            const colour = level.unlocked ? '#ffffff' : '#666666';
            const label = level.unlocked
                ? `Level ${level.number} – ${level.name}`
                : `Level ${level.number} – ${level.name}  🔒`;

            const btn = this.add.text(cx, y, label, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: colour,
                backgroundColor: level.unlocked ? '#333333' : '#1a1a1a',
                padding: { x: 20, y: 10 },
            }).setOrigin(0.5);

            if (level.unlocked) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerover', () => btn.setColor('#ffff00'));
                btn.on('pointerout',  () => btn.setColor('#ffffff'));
                btn.on('pointerdown', () => this.scene.start('GameScene', { level: level.number }));
            }
        });
    }
}
