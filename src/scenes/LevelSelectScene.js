import { playBgm, playSfx } from '../audio.js';

export default class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super('LevelSelectScene');
    }

    create() {
        playBgm(this, 'bgm_title');

        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height;

        this.add.text(cx, 50, 'SELECT LEVEL', {
            fontSize: '28px',
            fontFamily: 'Arial Black, Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
        }).setOrigin(0.5);

        const maxUnlocked = parseInt(localStorage.getItem('snapper_unlocked') ?? '1');
        let allUnlocked = false;
        let selectionReady = false;
        this.time.delayedCall(1000, () => { selectionReady = true; });

        const levelDefs = [
            { number: 1, name: 'Iceberg Lettuce & Basil'  },
            { number: 2, name: 'Rocket & Oregano'         },
            { number: 3, name: 'Coriander & Carrot'       },
            { number: 4, name: 'Spinach & Mulberry'       },
            { number: 5, name: 'The Garden'               },
        ];

        // Build level buttons — rebuilt when ALL LEVELS is toggled
        const buildButtons = () => {
            // Destroy existing level buttons
            levelBtns.forEach(b => b.destroy());
            levelBtns.length = 0;

            levelDefs.forEach((def, i) => {
                const unlocked = allUnlocked || def.number <= maxUnlocked;
                const y = 130 + i * 60;
                const colour = unlocked ? '#ffffff' : '#666666';
                const label  = unlocked
                    ? `Level ${def.number} – ${def.name}`
                    : `Level ${def.number} – ${def.name}  🔒`;

                const btn = this.add.text(cx, y, label, {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: colour,
                    backgroundColor: unlocked ? '#333333' : '#1a1a1a',
                    padding: { x: 20, y: 10 },
                }).setOrigin(0.5);

                if (unlocked) {
                    btn.setInteractive({ useHandCursor: true });
                    btn.on('pointerover', () => btn.setColor('#ffff00'));
                    btn.on('pointerout',  () => btn.setColor(colour));
                    btn.on('pointerdown', () => { if (selectionReady) { playSfx(this, 'sfx_level_selected'); this.scene.start('GameScene', { level: def.number }); } });
                }

                levelBtns.push(btn);
            });
        };

        const levelBtns = [];
        buildButtons();

        // White box outline drawn around whichever level is currently gamepad-selected
        const selectionOutline = this.add.rectangle(0, 0, 10, 10, 0xffffff, 0)
            .setStrokeStyle(4, 0xffffff).setDepth(5).setVisible(false);

        // Gamepad navigation
        let selectedIdx = 0;
        const maxUnlockedForNav = () => allUnlocked ? 5 : maxUnlocked;

        const updateHighlight = () => {
            levelDefs.forEach((_, i) => {
                const btn = levelBtns[i];
                if (!btn?.active) return;
                const unlocked = allUnlocked || levelDefs[i].number <= maxUnlocked;
                if (!unlocked) return;
                btn.setColor(i === selectedIdx ? '#ffff00' : '#ffffff');
            });

            const selectedBtn = levelBtns[selectedIdx];
            if (selectedBtn?.active) {
                selectionOutline.setPosition(selectedBtn.x, selectedBtn.y);
                selectionOutline.setSize(selectedBtn.width + 6, selectedBtn.height + 6);
                selectionOutline.setVisible(true);
            } else {
                selectionOutline.setVisible(false);
            }
        };

        this.input.gamepad.on('down', (pad, button) => {
            const idx = button.index;
            if (idx === 12) { // D-pad up
                selectedIdx = Math.max(0, selectedIdx - 1);
                updateHighlight();
            } else if (idx === 13) { // D-pad down
                selectedIdx = Math.min(maxUnlockedForNav() - 1, selectedIdx + 1);
                updateHighlight();
            } else if (idx === 0) { // A = confirm
                const def = levelDefs[selectedIdx];
                if (selectionReady && (allUnlocked || def.number <= maxUnlocked)) {
                    playSfx(this, 'sfx_level_selected');
                    this.scene.start('GameScene', { level: def.number });
                }
            } else if (idx === 1) { // B = back to title
                this.scene.start('TitleScene');
            }
        });

        // Poll left stick since 'down' only fires on button events
        this._padNavCooldown = 0;
        this.events.on('update', (_, delta) => {
            this._padNavCooldown -= delta;
            if (this._padNavCooldown > 0) return;
            const pad = this.input.gamepad.pad1;
            if (!pad) return;
            const y = pad.leftStick.y;
            if (y < -0.5) {
                selectedIdx = Math.max(0, selectedIdx - 1);
                updateHighlight();
                this._padNavCooldown = 200;
            } else if (y > 0.5) {
                selectedIdx = Math.min(maxUnlockedForNav() - 1, selectedIdx + 1);
                updateHighlight();
                this._padNavCooldown = 200;
            }
        });

        updateHighlight();

        // ALL LEVELS toggle — experimental testing button
        const allBtn = this.add.text(cx, cy - 20, '🧪 ALL LEVELS', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#888888',
            backgroundColor: '#1a1a1a',
            padding: { x: 14, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        allBtn.on('pointerover', () => allBtn.setColor('#ffff00'));
        allBtn.on('pointerout',  () => allBtn.setColor(allUnlocked ? '#ffaa00' : '#888888'));
        allBtn.on('pointerdown', () => {
            allUnlocked = !allUnlocked;
            allBtn.setColor(allUnlocked ? '#ffaa00' : '#888888');
            allBtn.setBackgroundColor(allUnlocked ? '#332200' : '#1a1a1a');
            buildButtons();
            updateHighlight();
        });
    }
}
