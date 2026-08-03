import { playBgm, playSfx } from '../audio.js';
import { getProgressIndex } from '../progressIndex.js';
import { WEAPON_CONTENT, BOOST_CONTENT, EVOLUTION_LIST, ENEMY_LIST } from '../upgradeContent.js';

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

        // INDEX — browse every weapon/boost/evolution ever unlocked across all playthroughs
        const indexBtn = this.add.text(this.cameras.main.width - 14, 14, '📖 INDEX', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#888888',
            backgroundColor: '#1a1a1a',
            padding: { x: 14, y: 8 },
        }).setOrigin(1, 0).setDepth(5).setInteractive({ useHandCursor: true });
        indexBtn.on('pointerover', () => indexBtn.setColor('#ffff00'));
        indexBtn.on('pointerout',  () => indexBtn.setColor('#888888'));
        indexBtn.on('pointerdown', () => this.showIndexMenu());

        // Gamepad hint for the Y-opens-INDEX shortcut above, matching the corner-hint
        // style used elsewhere (e.g. the in-game pause menu's gamepad hints in hud.js).
        this.add.text(10, this.cameras.main.height - 10, '🎮  Y  Index', {
            fontSize: '11px', fontFamily: 'Arial', color: '#666666',
        }).setOrigin(0, 1).setDepth(5);
    }

    // ─── INDEX menu — browse every weapon/boost/evolution/enemy ever seen, across every
    // playthrough (persisted via progressIndex.js), not just the current run ────────────
    showIndexMenu() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const depth = 300;

        this._indexMenuOpen = true;
        const progress = getProgressIndex();

        const weaponEntries = Object.entries(WEAPON_CONTENT).map(([key, data]) => ({
            section: 'weapon', key, label: data.label, tiers: data.tiers, gotten: progress.weapons[key] ?? 0,
        }));
        const boostEntries = Object.entries(BOOST_CONTENT).map(([name, data]) => ({
            section: 'boost', key: name, label: data.label, tiers: data.tiers, gotten: progress.boosts[name] ?? 0,
        }));
        const evoEntries = EVOLUTION_LIST.map(ev => ({
            section: 'evolution', key: ev.id, label: ev.evolvedName, desc: ev.desc,
            weaponLabel: ev.weaponLabel, boostName: ev.boostName,
            gotten: progress.evolutions[ev.id] ? 1 : 0,
        }));
        const enemyEntries = ENEMY_LIST.map(en => {
            const rec = progress.enemies[en.key];
            return {
                section: 'enemy', key: en.key, label: en.label, level: en.level, isBoss: en.isBoss,
                kills: rec?.kills ?? 0, losses: rec?.losses ?? 0,
                gotten: rec?.seen ? 1 : 0,
            };
        });
        const entriesFor = (sec) => sec === 'weapon' ? weaponEntries : sec === 'boost' ? boostEntries : sec === 'evolution' ? evoEntries : enemyEntries;

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(depth).setInteractive();
        const title = this.add.text(W / 2, 18, 'INDEX', {
            fontSize: '22px', fontFamily: 'Arial Black, Arial', color: '#ffff00',
            stroke: '#000000', strokeThickness: 5,
        }).setDepth(depth + 1).setOrigin(0.5);
        const persistentItems = [overlay, title];

        let section = 'weapon'; // 'weapon' | 'boost' | 'evolution' | 'enemy'
        let mode = 'grid';      // 'grid' | 'zoom'
        let modeItems = [];
        let zoomIdx = 0;
        let zoomTier = 1;

        // Grid gamepad navigation — same scheme as the in-game Evolutions menu
        // (D-pad/left-stick moves a white box outline, A zooms in on whatever it's on).
        let selectedIdx = 0;
        let selectionOutline = null;
        let cardRefs = [];   // { cx, baseY } per card, indexed same as the current section's entries
        let currentCardH = 62;

        const destroyModeItems = () => { modeItems.forEach(o => o.destroy()); modeItems = []; };

        const closeMenu = () => {
            destroyModeItems();
            tabBtns.forEach(b => b.destroy());
            persistentItems.forEach(o => o.destroy());
            this.input.keyboard.off('keydown', keyHandler);
            this.input.gamepad.off('down', padHandler);
            this.input.off('wheel', wheelHandler);
            this.events.off('update', navPollHandler);
            this.events.off('update', scrollUpdateHandler);
            requestAnimationFrame(() => { this._indexMenuOpen = false; });
        };

        // ─── Grid — scrollable, since Enemies (35 entries) overflows the screen even
        // though Weapons/Boosts/Evolutions (16 each) don't ─────────────────────────────
        const cols = 4, cardW = 168, gap = 12;
        const viewportTop = 82, viewportBottom = H - 40;
        const trackHeight = viewportBottom - viewportTop;
        let scrollY = 0, maxScroll = 0, thumb = null, scrollables = [];

        const applyScroll = (y) => {
            scrollY = Phaser.Math.Clamp(y, 0, maxScroll);
            scrollables.forEach(s => { s.obj.y = s.baseY - scrollY; });
            if (thumb) thumb.y = viewportTop + (maxScroll > 0 ? (scrollY / maxScroll) * (trackHeight - thumb.height) : 0);
            positionSelectionOutline();
        };

        const positionSelectionOutline = () => {
            const card = cardRefs[selectedIdx];
            if (!card || !selectionOutline) return;
            selectionOutline.setPosition(card.cx, card.baseY - scrollY + currentCardH / 2);
            selectionOutline.setSize(cardW + 6, currentCardH + 6);
            selectionOutline.setVisible(true);
        };

        const ensureSelectedVisible = () => {
            const card = cardRefs[selectedIdx];
            if (!card) return;
            const topY = card.baseY - scrollY;
            const botY = card.baseY - scrollY + currentCardH;
            if (topY < viewportTop) applyScroll(scrollY - (viewportTop - topY));
            else if (botY > viewportBottom) applyScroll(scrollY + (botY - viewportBottom));
            else positionSelectionOutline();
        };

        const moveGridSelection = (delta, sameRowOnly = false) => {
            const entries = entriesFor(section);
            const newIdx = selectedIdx + delta;
            if (newIdx < 0 || newIdx >= entries.length) return;
            if (sameRowOnly && Math.floor(newIdx / cols) !== Math.floor(selectedIdx / cols)) return;
            selectedIdx = newIdx;
            ensureSelectedVisible();
        };

        const buildGrid = () => {
            mode = 'grid';
            destroyModeItems();
            scrollY = 0; thumb = null; scrollables = []; cardRefs = [];
            const entries = entriesFor(section);
            const cardH = section === 'enemy' ? 70 : 62;
            currentCardH = cardH;
            if (selectedIdx >= entries.length) selectedIdx = 0;
            const rowGap = 10;
            const startX = W / 2 - (cols - 1) * (cardW + gap) / 2;

            entries.forEach((entry, i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const cx = startX + col * (cardW + gap);
                const baseCy = viewportTop + row * (cardH + rowGap);
                const known = entry.gotten > 0;

                const bg = this.add.rectangle(cx, baseCy, cardW, cardH, known ? 0x152a15 : 0x1a1a1a)
                    .setOrigin(0.5, 0).setDepth(depth + 1)
                    .setStrokeStyle(2, known ? 0x66cc66 : 0x444444)
                    .setInteractive({ useHandCursor: true });
                const nameText = this.add.text(cx, baseCy + 14, known ? entry.label : '???', {
                    fontSize: '11px', fontFamily: 'Arial Black, Arial', color: known ? '#ffffff' : '#555555',
                    wordWrap: { width: cardW - 12 }, align: 'center',
                }).setOrigin(0.5).setDepth(depth + 2);

                let subLabel, subColor;
                if (!known) { subLabel = 'not yet discovered'; subColor = '#3a3a3a'; }
                else if (entry.section === 'evolution') { subLabel = '✓ Unlocked'; subColor = '#88cc88'; }
                else if (entry.section === 'enemy') { subLabel = `Lv.${entry.level}${entry.isBoss ? '  •  BOSS' : ''}`; subColor = entry.isBoss ? '#ff8888' : '#88cc88'; }
                else { subLabel = `Reached Tier ${entry.gotten}/${entry.tiers.length}`; subColor = '#88cc88'; }
                const subText = this.add.text(cx, baseCy + 34, subLabel, {
                    fontSize: '9px', fontFamily: 'Arial', color: subColor,
                }).setOrigin(0.5).setDepth(depth + 2);

                modeItems.push(bg, nameText, subText);
                scrollables.push({ obj: bg, baseY: baseCy }, { obj: nameText, baseY: baseCy + 14 }, { obj: subText, baseY: baseCy + 34 });
                cardRefs.push({ cx, baseY: baseCy });

                if (known && entry.section === 'enemy') {
                    const statText = this.add.text(cx, baseCy + 52, `Kills ${entry.kills}  •  Losses ${entry.losses}`, {
                        fontSize: '8px', fontFamily: 'Arial', color: '#aaaaaa',
                    }).setOrigin(0.5).setDepth(depth + 2);
                    modeItems.push(statText);
                    scrollables.push({ obj: statText, baseY: baseCy + 52 });
                }

                bg.on('pointerover', () => bg.setFillStyle(known ? 0x1e3a1e : 0x2a2a2a));
                bg.on('pointerout',  () => bg.setFillStyle(known ? 0x152a15 : 0x1a1a1a));
                bg.on('pointerdown', () => { zoomIdx = i; zoomTier = known ? 1 : 0; buildZoom(); });
            });

            const rows = Math.max(1, Math.ceil(entries.length / cols));
            const contentBottom = viewportTop + (rows - 1) * (cardH + rowGap) + cardH;
            maxScroll = Math.max(0, contentBottom - viewportBottom);

            // White box outline drawn around whichever card is currently gamepad-selected
            selectionOutline = this.add.rectangle(0, 0, cardW + 6, cardH + 6, 0xffffff, 0)
                .setStrokeStyle(3, 0xffffff).setDepth(depth + 3).setOrigin(0.5).setVisible(false);
            modeItems.push(selectionOutline);

            // Scrollbar — a draggable tab on the far-right edge, matching the in-game
            // Evolutions menu's scrollbar exactly. Only appears when content overflows.
            if (maxScroll > 0) {
                const track = this.add.rectangle(W - 10, viewportTop + trackHeight / 2, 8, trackHeight, 0x000000, 0.35).setDepth(depth + 1);
                modeItems.push(track);
                const thumbHeight = Math.max(24, trackHeight * (trackHeight / (trackHeight + maxScroll)));
                thumb = this.add.rectangle(W - 10, viewportTop, 14, thumbHeight, 0xffdd55, 0.9)
                    .setOrigin(0.5, 0).setDepth(depth + 3).setInteractive({ useHandCursor: true });
                this.input.setDraggable(thumb);
                modeItems.push(thumb);
                thumb.on('drag', (pointer, dragX, dragY) => {
                    const clampedTop = Phaser.Math.Clamp(dragY, viewportTop, viewportBottom - thumb.height);
                    const ratio = (clampedTop - viewportTop) / (trackHeight - thumb.height);
                    applyScroll(ratio * maxScroll);
                });
            }

            const closeBtn = this.add.text(W / 2, H - 36, '[ CLOSE ]', {
                fontSize: '13px', fontFamily: 'Arial', color: '#aaaaaa',
                backgroundColor: '#222222', padding: { x: 16, y: 6 },
            }).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
            closeBtn.on('pointerout',  () => closeBtn.setColor('#aaaaaa'));
            closeBtn.on('pointerdown', () => closeMenu());
            modeItems.push(closeBtn);

            modeItems.push(this.add.text(W / 2, H - 4, maxScroll > 0
                ? '🎮  D-Pad/LS Navigate   A Zoom In   B Close   •   LB/RB Category   •   RS Scroll'
                : '🎮  D-Pad/LS Navigate   A Zoom In   B Close   •   LB/RB Category', {
                fontSize: '9px', fontFamily: 'Arial', color: '#888888',
            }).setDepth(depth + 2).setOrigin(0.5, 1));

            applyScroll(0);
        };

        // ─── Zoom — one entry blown up, positioned lower with ◀/▶ side arrows (identical
        // to the in-game Evolutions menu's) cycling to a different entry entirely, plus
        // (for weapons/boosts) a NEXT/PREVIOUS TIER pair in the box's bottom-right corner
        // paging within just that entry's already-reached tiers ─────────────────────────
        const zoomCx = W / 2, zoomCy = 210;

        const buildZoom = () => {
            mode = 'zoom';
            destroyModeItems();
            const entries = entriesFor(section);
            const entry = entries[zoomIdx];
            const known = entry.gotten > 0;
            const isEnemy = entry.section === 'enemy';
            const zoomW = 480, zoomH = isEnemy ? 250 : 190;

            const bg = this.add.rectangle(zoomCx, zoomCy, zoomW, zoomH, known ? 0x152a15 : 0x1a1a1a)
                .setDepth(depth + 1).setOrigin(0.5).setStrokeStyle(3, known ? 0x66cc66 : 0x444444);
            modeItems.push(bg);

            if (isEnemy) {
                // Sprite/animation shows either way — a locked enemy is tinted pure black
                // (silhouette: shape and movement readable, texture colors hidden) instead
                // of being omitted, so its outline is a discoverable hint without spoiling
                // what it actually looks like.
                const animKey = entry.isBoss ? `${entry.key}_idle` : `${entry.key}_walk`;
                if (!this.anims.exists(animKey)) {
                    this.anims.create({ key: animKey, frames: this.anims.generateFrameNumbers(entry.key, { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
                }
                const preview = this.add.sprite(zoomCx, zoomCy - 78, entry.key).setDepth(depth + 2);
                if (entry.isBoss) preview.setScale(0.4); else preview.setScale(0.8);
                if (!known) preview.setTint(0x000000);
                preview.play(animKey);
                modeItems.push(preview);

                const nameText = this.add.text(zoomCx, zoomCy - 5, known ? entry.label : '???', {
                    fontSize: '18px', fontFamily: 'Arial Black, Arial', color: known ? '#ffffff' : '#ffff44',
                }).setDepth(depth + 2).setOrigin(0.5);
                modeItems.push(nameText);
                modeItems.push(this.add.text(zoomCx, zoomCy + 20, known ? `Level ${entry.level}${entry.isBoss ? '   •   BOSS' : ''}` : 'Level ???', {
                    fontSize: '12px', fontFamily: 'Arial', color: known ? (entry.isBoss ? '#ff8888' : '#aaaaaa') : '#666666',
                }).setDepth(depth + 2).setOrigin(0.5));
                modeItems.push(this.add.text(zoomCx, zoomCy + 44, known ? `Kills: ${entry.kills}     Losses to this enemy: ${entry.losses}` : 'Kills: ???     Losses to this enemy: ???', {
                    fontSize: '11px', fontFamily: 'Arial', color: known ? '#dddddd' : '#666666',
                }).setDepth(depth + 2).setOrigin(0.5));
            } else {
                let nameLabel = '???', descLabel = '???';
                if (known) {
                    if (entry.section === 'evolution') {
                        nameLabel = entry.label;
                        descLabel = entry.desc;
                    } else {
                        nameLabel = `${entry.label} — Tier ${zoomTier}/${entry.tiers.length}`;
                        descLabel = entry.tiers[zoomTier - 1].desc;
                    }
                }
                const nameText = this.add.text(zoomCx, zoomCy - 68, nameLabel, {
                    fontSize: '18px', fontFamily: 'Arial Black, Arial', color: known ? '#ffffff' : '#ffff44',
                }).setDepth(depth + 2).setOrigin(0.5);
                const descText = this.add.text(zoomCx, zoomCy - 20, descLabel, {
                    fontSize: '12px', fontFamily: known ? 'Arial' : 'Arial Black, Arial', color: '#dddddd',
                    wordWrap: { width: zoomW - 60 }, align: 'center',
                }).setDepth(depth + 2).setOrigin(0.5);
                modeItems.push(nameText, descText);

                if (entry.section === 'evolution' && known) {
                    modeItems.push(this.add.text(zoomCx, zoomCy + 40, `Evolves from: ${entry.weaponLabel} (maxed) + ${entry.boostName}`, {
                        fontSize: '10px', fontFamily: 'Arial', color: '#aaaaaa',
                    }).setDepth(depth + 2).setOrigin(0.5));
                }

                // NEXT/PREVIOUS TIER — bottom-right corner of the box, weapons/boosts only,
                // only cycling through tiers actually reached (never the full possible max).
                if (entry.section !== 'evolution' && known) {
                    const tierY = zoomCy + zoomH / 2 - 18;
                    const canPrevTier = zoomTier > 1;
                    const canNextTier = zoomTier < entry.gotten;
                    const prevTierBtn = this.add.text(zoomCx + zoomW / 2 - 210, tierY, '◀ PREVIOUS TIER', {
                        fontSize: '9px', fontFamily: 'Arial', color: canPrevTier ? '#ffffff' : '#555555',
                        backgroundColor: '#222222', padding: { x: 8, y: 4 },
                    }).setDepth(depth + 2).setOrigin(0, 0.5);
                    const nextTierBtn = this.add.text(zoomCx + zoomW / 2 - 12, tierY, 'NEXT TIER ▶', {
                        fontSize: '9px', fontFamily: 'Arial', color: canNextTier ? '#ffffff' : '#555555',
                        backgroundColor: '#222222', padding: { x: 8, y: 4 },
                    }).setDepth(depth + 2).setOrigin(1, 0.5);
                    modeItems.push(prevTierBtn, nextTierBtn);
                    if (canPrevTier) {
                        prevTierBtn.setInteractive({ useHandCursor: true });
                        prevTierBtn.on('pointerover', () => prevTierBtn.setColor('#ffff00'));
                        prevTierBtn.on('pointerout',  () => prevTierBtn.setColor('#ffffff'));
                        prevTierBtn.on('pointerdown', () => { zoomTier--; buildZoom(); });
                    }
                    if (canNextTier) {
                        nextTierBtn.setInteractive({ useHandCursor: true });
                        nextTierBtn.on('pointerover', () => nextTierBtn.setColor('#ffff00'));
                        nextTierBtn.on('pointerout',  () => nextTierBtn.setColor('#ffffff'));
                        nextTierBtn.on('pointerdown', () => { zoomTier++; buildZoom(); });
                    }
                }
            }

            // ◀/▶ side arrows — identical styling to the in-game Evolutions menu's —
            // cycle to a different entry within the same section entirely, wrapping ends.
            const switchEntry = (delta) => {
                const list = entriesFor(section);
                zoomIdx = (zoomIdx + delta + list.length) % list.length;
                zoomTier = list[zoomIdx].gotten > 0 ? 1 : 0;
                buildZoom();
            };
            const arrowLeft = this.add.text(zoomCx - zoomW / 2 - 30, zoomCy, '◀', {
                fontSize: '28px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
            }).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            const arrowRight = this.add.text(zoomCx + zoomW / 2 + 30, zoomCy, '▶', {
                fontSize: '28px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
            }).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            arrowLeft.on('pointerover',  () => arrowLeft.setColor('#ffff00'));
            arrowLeft.on('pointerout',   () => arrowLeft.setColor('#ffffff'));
            arrowLeft.on('pointerdown',  () => switchEntry(-1));
            arrowRight.on('pointerover', () => arrowRight.setColor('#ffff00'));
            arrowRight.on('pointerout',  () => arrowRight.setColor('#ffffff'));
            arrowRight.on('pointerdown', () => switchEntry(1));
            modeItems.push(arrowLeft, arrowRight);

            const backBtn = this.add.text(W / 2, H - 36, '[ BACK ]', {
                fontSize: '13px', fontFamily: 'Arial', color: '#aaaaaa',
                backgroundColor: '#222222', padding: { x: 16, y: 6 },
            }).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
            backBtn.on('pointerout',  () => backBtn.setColor('#aaaaaa'));
            backBtn.on('pointerdown', () => backToGrid());
            modeItems.push(backBtn);

            modeItems.push(this.add.text(W / 2, H - 4, '🎮  ◀/▶ or LB/RB  Switch Entry   B  Back', {
                fontSize: '9px', fontFamily: 'Arial', color: '#888888',
            }).setDepth(depth + 2).setOrigin(0.5, 1));
        };

        // Section tabs
        const sections = [['weapon', 'WEAPONS'], ['boost', 'BOOSTS'], ['evolution', 'EVOLUTIONS'], ['enemy', 'ENEMIES']];
        const switchSection = (key) => {
            if (section === key) return;
            section = key;
            selectedIdx = 0;
            tabBtns.forEach((b, j) => b.setColor(sections[j][0] === section ? '#ffff00' : '#888888'));
            if (mode === 'zoom') { zoomIdx = 0; buildZoom(); } else buildGrid();
        };
        // LB/RB (or the shoulder-button indices, matching the same convention used
        // for the in-game Evolutions menu's zoom-entry cycling) step to the previous/
        // next tab, wrapping at the ends — only meaningful in grid mode, since zoom's
        // LB/RB is already used to cycle entries within the current tab.
        const cycleSection = (delta) => {
            const keys = sections.map(s => s[0]);
            const curIdx = keys.indexOf(section);
            switchSection(keys[(curIdx + delta + keys.length) % keys.length]);
        };
        // Returning to the grid re-selects whichever card was just zoomed in on, so the
        // white gamepad-selection box doesn't jump back to wherever it was left before.
        const backToGrid = () => { selectedIdx = zoomIdx; buildGrid(); };
        const tabBtns = sections.map(([key, label], i) => {
            const tx = W / 2 - 255 + i * 170;
            const btn = this.add.text(tx, 48, label, {
                fontSize: '12px', fontFamily: 'Arial Black, Arial',
                color: section === key ? '#ffff00' : '#888888',
                backgroundColor: '#222222', padding: { x: 12, y: 5 },
            }).setDepth(depth + 1).setOrigin(0.5).setInteractive({ useHandCursor: true });
            btn.on('pointerdown', () => switchSection(key));
            return btn;
        });

        const keyHandler = (e) => {
            if (e.key !== 'Escape') return;
            if (mode === 'zoom') backToGrid(); else closeMenu();
        };
        this.input.keyboard.on('keydown', keyHandler);

        const padHandler = (pad, button) => {
            const idx = button.index;
            if (idx === 1) { if (mode === 'zoom') backToGrid(); else closeMenu(); return; } // B
            if (mode === 'grid') {
                if (idx === 12) { moveGridSelection(-cols); return; }        // D-pad up
                if (idx === 13) { moveGridSelection(cols); return; }         // D-pad down
                if (idx === 14) { moveGridSelection(-1, true); return; }     // D-pad left
                if (idx === 15) { moveGridSelection(1, true); return; }      // D-pad right
                if (idx === 0) { zoomIdx = selectedIdx; zoomTier = entriesFor(section)[selectedIdx]?.gotten > 0 ? 1 : 0; buildZoom(); return; } // A = zoom in
                if (idx === 4) { cycleSection(-1); return; }                 // LB = previous category
                if (idx === 5) { cycleSection(1); return; }                  // RB = next category
            } else {
                if (idx === 4 || idx === 14) { const list = entriesFor(section); zoomIdx = (zoomIdx - 1 + list.length) % list.length; zoomTier = list[zoomIdx].gotten > 0 ? 1 : 0; buildZoom(); }
                else if (idx === 5 || idx === 15) { const list = entriesFor(section); zoomIdx = (zoomIdx + 1) % list.length; zoomTier = list[zoomIdx].gotten > 0 ? 1 : 0; buildZoom(); }
            }
        };
        this.input.gamepad.on('down', padHandler);

        // Continuous left-stick grid navigation (D-pad handled as discrete 'down' events above)
        let navCooldown = 0;
        const navPollHandler = (_, delta) => {
            if (mode !== 'grid') return;
            navCooldown -= delta;
            if (navCooldown > 0) return;
            const pad = this.input.gamepad.pad1;
            if (!pad) return;
            const sx = pad.leftStick.x, sy = pad.leftStick.y;
            if (sy < -0.5) { moveGridSelection(-cols); navCooldown = 200; }
            else if (sy > 0.5) { moveGridSelection(cols); navCooldown = 200; }
            else if (sx < -0.5) { moveGridSelection(-1, true); navCooldown = 200; }
            else if (sx > 0.5) { moveGridSelection(1, true); navCooldown = 200; }
        };
        this.events.on('update', navPollHandler);

        // Right-stick scroll (continuous, scaled by frame delta) — grid only
        const scrollUpdateHandler = (_, delta) => {
            if (mode !== 'grid' || maxScroll <= 0) return;
            const pad = this.input.gamepad.pad1;
            if (!pad) return;
            const ry = pad.rightStick.y;
            if (Math.abs(ry) > 0.2) applyScroll(scrollY + ry * 400 * (delta / 1000));
        };
        this.events.on('update', scrollUpdateHandler);

        const wheelHandler = (pointer, gameObjects, dx, dy) => {
            if (mode !== 'grid' || maxScroll <= 0) return;
            applyScroll(scrollY + dy * 0.5);
        };
        this.input.on('wheel', wheelHandler);

        buildGrid();
    }
}
