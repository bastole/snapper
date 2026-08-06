import { playBgm, playSfx } from '../audio.js';
import { getHighScore } from '../progressIndex.js';
import { trackInputMode, registerGamepadHint } from '../inputMode.js';
import { IndexMenuMethods } from '../systems/indexMenu.js';

export default class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super('LevelSelectScene');
    }

    create() {
        playBgm(this, 'bgm_title');
        trackInputMode(this);

        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height;

        this.add.text(cx, 100, 'SELECT LEVEL', {
            fontSize: '56px',
            fontFamily: 'Arial Black, Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 10,
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
            highScoreTexts.forEach(t => t.destroy());
            highScoreTexts.length = 0;

            levelDefs.forEach((def, i) => {
                const unlocked  = allUnlocked || def.number <= maxUnlocked;
                const completed = def.number < maxUnlocked;
                const y = 260 + i * 120;
                const colour = completed ? '#ffd700' : unlocked ? '#ffffff' : '#666666';
                const label  = unlocked
                    ? `Level ${def.number} – ${def.name}`
                    : `Level ${def.number} – ${def.name}  🔒`;

                const btn = this.add.text(cx, y, label, {
                    fontSize: '32px',
                    fontFamily: 'Arial',
                    color: colour,
                    backgroundColor: completed ? '#1a5c1a' : unlocked ? '#333333' : '#1a1a1a',
                    padding: { x: 40, y: 20 },
                }).setOrigin(0.5);

                if (unlocked) {
                    btn.setInteractive({ useHandCursor: true });
                    btn.on('pointerover', () => btn.setColor('#ffff00'));
                    btn.on('pointerout',  () => btn.setColor(colour));
                    btn.on('pointerdown', () => { if (selectionReady) { playSfx(this, 'sfx_level_selected'); this.scene.start('GameScene', { level: def.number }); } });

                    // High score, positioned just right of the button's actual rendered
                    // edge (widths vary per level's name) rather than a fixed offset.
                    const hiScore = this.add.text(btn.x + btn.width / 2 + 24, y, `High Score: ${getHighScore(def.number)}`, {
                        fontSize: '22px', fontFamily: 'Arial', color: '#ffdd55',
                    }).setOrigin(0, 0.5);
                    highScoreTexts.push(hiScore);
                }

                levelBtns.push(btn);
            });
        };

        const levelBtns = [];
        const highScoreTexts = [];
        buildButtons();

        // White box outline drawn around whichever level is currently gamepad-selected
        const selectionOutline = this.add.rectangle(0, 0, 10, 10, 0xffffff, 0)
            .setStrokeStyle(8, 0xffffff).setDepth(5).setVisible(false);

        // Gamepad navigation
        let selectedIdx = 0;
        const maxUnlockedForNav = () => allUnlocked ? 5 : maxUnlocked;

        const updateHighlight = () => {
            levelDefs.forEach((_, i) => {
                const btn = levelBtns[i];
                if (!btn?.active) return;
                const unlocked = allUnlocked || levelDefs[i].number <= maxUnlocked;
                if (!unlocked) return;
                const completed = levelDefs[i].number < maxUnlocked;
                btn.setColor(i === selectedIdx ? '#ffff00' : completed ? '#ffd700' : '#ffffff');
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
            // Gamepad 'down' is a raw event-emitter listener, not tied to display-object
            // hit-testing the way pointer clicks are (which Phaser's topOnly already blocks
            // for anything under the Index menu's overlay) — so it fires here too unless
            // explicitly gated while the Index menu owns input.
            if (this._indexMenuOpen) return;
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
            } else if (idx === 3) { // Y = open INDEX
                this.showIndexMenu();
            }
        });

        // Poll left stick since 'down' only fires on button events
        this._padNavCooldown = 0;
        this.events.on('update', (_, delta) => {
            if (this._indexMenuOpen) return;
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
        const allBtn = this.add.text(cx, cy - 40, '🧪 ALL LEVELS', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#888888',
            backgroundColor: '#1a1a1a',
            padding: { x: 28, y: 16 },
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

        // BACK — returns to the title screen, mirroring gamepad B's existing binding below
        const backBtn = this.add.text(28, 28, '[ BACK ]', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#888888',
            backgroundColor: '#1a1a1a',
            padding: { x: 28, y: 16 },
        }).setOrigin(0, 0).setDepth(5).setInteractive({ useHandCursor: true });
        backBtn.on('pointerover', () => backBtn.setColor('#ffff00'));
        backBtn.on('pointerout',  () => backBtn.setColor('#888888'));
        backBtn.on('pointerdown', () => this.scene.start('TitleScene'));

        // INDEX — browse every weapon/boost/evolution ever unlocked across all playthroughs
        const indexBtn = this.add.text(this.cameras.main.width - 28, 28, '📖 INDEX', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#888888',
            backgroundColor: '#1a1a1a',
            padding: { x: 28, y: 16 },
        }).setOrigin(1, 0).setDepth(5).setInteractive({ useHandCursor: true });
        indexBtn.on('pointerover', () => indexBtn.setColor('#ffff00'));
        indexBtn.on('pointerout',  () => indexBtn.setColor('#888888'));
        indexBtn.on('pointerdown', () => this.showIndexMenu());

        // Gamepad hint for the Y-opens-INDEX shortcut above, matching the corner-hint
        // style used elsewhere (e.g. the in-game pause menu's gamepad hints in hud.js).
        // Only actually visible while a gamepad is the last-used input method.
        registerGamepadHint(this.add.text(20, this.cameras.main.height - 20, '🎮  Y  Index', {
            fontSize: '22px', fontFamily: 'Arial', color: '#666666',
        }).setOrigin(0, 1).setDepth(5));
    }
}

Object.assign(LevelSelectScene.prototype, IndexMenuMethods);
