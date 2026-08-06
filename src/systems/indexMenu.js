import { getProgressIndex, isWeaponFlagged, toggleWeaponFlag } from '../progressIndex.js';
import { WEAPON_CONTENT, BOOST_CONTENT, EVOLUTION_LIST, ENEMY_LIST } from '../upgradeContent.js';
import { registerGamepadHint } from '../inputMode.js';

// Shared by LevelSelectScene (browsing only) and GameScene's pause menu (browsing +
// flagging). Every element sets scrollFactor(0) since GameScene's camera follows the
// player — LevelSelectScene's camera never scrolls, so it's a harmless no-op there.
export const IndexMenuMethods = {

    // ─── INDEX menu — browse every weapon/boost/evolution/enemy ever seen, across every
    // playthrough (persisted via progressIndex.js), not just the current run. Pass
    // { flaggable: true } (only done from GameScene's pause menu) to also offer a
    // FLAG/UNFLAG button on weapon/boost entries ─────────────────────────────────────
    showIndexMenu(opts = {}) {
        const flaggable = !!opts.flaggable;
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
                scale: en.scale ?? 0.5,
                kills: rec?.kills ?? 0, losses: rec?.losses ?? 0,
                gotten: rec?.seen ? 1 : 0,
            };
        });
        const entriesFor = (sec) => sec === 'weapon' ? weaponEntries : sec === 'boost' ? boostEntries : sec === 'evolution' ? evoEntries : enemyEntries;

        // Flag state — weapons persist via progressIndex.js; boosts live only on the
        // GameScene instance (this.flaggedBoosts) and reset every round (see create()).
        const isEntryFlagged = (entry) => entry.section === 'weapon'
            ? isWeaponFlagged(entry.key)
            : entry.section === 'boost' ? !!this.flaggedBoosts?.has(entry.key) : false;
        const toggleEntryFlag = (entry) => {
            if (entry.section === 'weapon') { toggleWeaponFlag(entry.key); return; }
            if (!this.flaggedBoosts) this.flaggedBoosts = new Set();
            if (this.flaggedBoosts.has(entry.key)) this.flaggedBoosts.delete(entry.key);
            else this.flaggedBoosts.add(entry.key);
        };

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setScrollFactor(0).setDepth(depth).setInteractive();
        const title = this.add.text(W / 2, 36, 'INDEX', {
            fontSize: '44px', fontFamily: 'Arial Black, Arial', color: '#ffff00',
            stroke: '#000000', strokeThickness: 10,
        }).setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5);
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
            this.input.off('pointerdown', gridDragStart);
            this.input.off('pointermove', gridDragMove);
            this.input.off('pointerup', gridDragEnd);
            this.events.off('update', navPollHandler);
            this.events.off('update', scrollUpdateHandler);
            requestAnimationFrame(() => { this._indexMenuOpen = false; });
        };

        // ─── Grid — scrollable, since Enemies (35 entries) overflows the screen even
        // though Weapons/Boosts/Evolutions (16 each) don't ─────────────────────────────
        const cols = 4, cardW = 336, gap = 24;
        const viewportTop = 164, viewportBottom = H - 80;
        const trackHeight = viewportBottom - viewportTop;
        let scrollY = 0, maxScroll = 0, thumb = null, scrollables = [];
        let thumbInteracting = false; // set by the thumb's own pointerdown, mirrors hud.js's _sliderInteracting

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
            selectionOutline.setSize(cardW + 12, currentCardH + 12);
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
            const cardH = section === 'enemy' ? 140 : 124;
            currentCardH = cardH;
            if (selectedIdx >= entries.length) selectedIdx = 0;
            const rowGap = 20;
            const startX = W / 2 - (cols - 1) * (cardW + gap) / 2;

            entries.forEach((entry, i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const cx = startX + col * (cardW + gap);
                const baseCy = viewportTop + row * (cardH + rowGap);
                const known = entry.gotten > 0;
                const flagged = flaggable && known && isEntryFlagged(entry);

                const bg = this.add.rectangle(cx, baseCy, cardW, cardH, known ? 0x152a15 : 0x1a1a1a)
                    .setScrollFactor(0).setOrigin(0.5, 0).setDepth(depth + 1)
                    .setStrokeStyle(2, flagged ? 0xffd700 : (known ? 0x66cc66 : 0x444444))
                    .setInteractive({ useHandCursor: true });
                const nameText = this.add.text(cx, baseCy + 28, known ? `${flagged ? '🚩 ' : ''}${entry.label}` : '???', {
                    fontSize: '22px', fontFamily: 'Arial Black, Arial', color: known ? '#ffffff' : '#555555',
                    wordWrap: { width: cardW - 24 }, align: 'center',
                }).setScrollFactor(0).setOrigin(0.5).setDepth(depth + 2);

                let subLabel, subColor;
                if (!known) { subLabel = 'not yet discovered'; subColor = '#3a3a3a'; }
                else if (entry.section === 'evolution') { subLabel = '✓ Unlocked'; subColor = '#88cc88'; }
                else if (entry.section === 'enemy') { subLabel = `Lv.${entry.level}${entry.isBoss ? '  •  BOSS' : ''}`; subColor = entry.isBoss ? '#ff8888' : '#88cc88'; }
                else { subLabel = `Reached Tier ${entry.gotten}/${entry.tiers.length}`; subColor = '#88cc88'; }
                const subText = this.add.text(cx, baseCy + 68, subLabel, {
                    fontSize: '18px', fontFamily: 'Arial', color: subColor,
                }).setScrollFactor(0).setOrigin(0.5).setDepth(depth + 2);

                modeItems.push(bg, nameText, subText);
                scrollables.push({ obj: bg, baseY: baseCy }, { obj: nameText, baseY: baseCy + 28 }, { obj: subText, baseY: baseCy + 68 });
                cardRefs.push({ cx, baseY: baseCy });

                if (known && entry.section === 'enemy') {
                    const statText = this.add.text(cx, baseCy + 104, `Kills ${entry.kills}  •  Losses ${entry.losses}`, {
                        fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
                    }).setScrollFactor(0).setOrigin(0.5).setDepth(depth + 2);
                    modeItems.push(statText);
                    scrollables.push({ obj: statText, baseY: baseCy + 104 });
                }

                bg.on('pointerover', () => bg.setFillStyle(known ? 0x1e3a1e : 0x2a2a2a));
                bg.on('pointerout',  () => bg.setFillStyle(known ? 0x152a15 : 0x1a1a1a));
                // Fires on release, and only counts as a tap (not the start of a scroll
                // drag) if the pointer didn't move far — lets a touch/mouse-drag that
                // starts on a card scroll the grid (see gridDragStart/Move below) instead
                // of always opening whatever card the drag happened to start on.
                bg.on('pointerup', (pointer) => {
                    if (Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.x, pointer.y) < 12) {
                        zoomIdx = i; zoomTier = known ? 1 : 0; buildZoom();
                    }
                });
            });

            const rows = Math.max(1, Math.ceil(entries.length / cols));
            const contentBottom = viewportTop + (rows - 1) * (cardH + rowGap) + cardH;
            maxScroll = Math.max(0, contentBottom - viewportBottom);

            // White box outline drawn around whichever card is currently gamepad-selected
            selectionOutline = this.add.rectangle(0, 0, cardW + 12, cardH + 12, 0xffffff, 0)
                .setScrollFactor(0).setStrokeStyle(6, 0xffffff).setDepth(depth + 3).setOrigin(0.5).setVisible(false);
            modeItems.push(selectionOutline);

            // Scrollbar — a draggable tab on the far-right edge, matching the in-game
            // Evolutions menu's scrollbar exactly. Only appears when content overflows.
            if (maxScroll > 0) {
                const track = this.add.rectangle(W - 20, viewportTop + trackHeight / 2, 16, trackHeight, 0x000000, 0.35).setScrollFactor(0).setDepth(depth + 1);
                modeItems.push(track);
                const thumbHeight = Math.max(48, trackHeight * (trackHeight / (trackHeight + maxScroll)));
                thumb = this.add.rectangle(W - 20, viewportTop, 28, thumbHeight, 0xffdd55, 0.9)
                    .setScrollFactor(0).setOrigin(0.5, 0).setDepth(depth + 3).setInteractive({ useHandCursor: true });
                this.input.setDraggable(thumb);
                modeItems.push(thumb);
                // Fires before gridDragStart below (object-specific listeners run before
                // the scene-global ones for the same event), so gridDragStart can tell
                // this drag started on the thumb itself and not also try to scroll.
                thumb.on('pointerdown', () => { thumbInteracting = true; });
                thumb.on('drag', (pointer, dragX, dragY) => {
                    const clampedTop = Phaser.Math.Clamp(dragY, viewportTop, viewportBottom - thumb.height);
                    const ratio = (clampedTop - viewportTop) / (trackHeight - thumb.height);
                    applyScroll(ratio * maxScroll);
                });
            }

            const closeBtn = this.add.text(W / 2, H - 72, '[ CLOSE ]', {
                fontSize: '26px', fontFamily: 'Arial', color: '#aaaaaa',
                backgroundColor: '#222222', padding: { x: 32, y: 12 },
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
            closeBtn.on('pointerout',  () => closeBtn.setColor('#aaaaaa'));
            closeBtn.on('pointerdown', () => closeMenu());
            modeItems.push(closeBtn);

            modeItems.push(registerGamepadHint(this.add.text(W / 2, H - 8, maxScroll > 0
                ? '🎮  D-Pad/LS Navigate   A Zoom In   B Close   •   LB/RB Category   •   RS Scroll'
                : '🎮  D-Pad/LS Navigate   A Zoom In   B Close   •   LB/RB Category', {
                fontSize: '18px', fontFamily: 'Arial', color: '#888888',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5, 1)));

            applyScroll(0);
        };

        // ─── Zoom — one entry blown up, positioned lower with ◀/▶ side arrows (identical
        // to the in-game Evolutions menu's) cycling to a different entry entirely, plus
        // (for weapons/boosts) a NEXT/PREVIOUS TIER pair in the box's bottom-right corner
        // paging within just that entry's already-reached tiers, and (only when opened
        // flaggable, i.e. from the pause menu) a FLAG/UNFLAG button bottom-left ─────────
        const zoomCx = W / 2, zoomCy = 420;

        const buildZoom = () => {
            mode = 'zoom';
            destroyModeItems();
            const entries = entriesFor(section);
            const entry = entries[zoomIdx];
            const known = entry.gotten > 0;
            const isEnemy = entry.section === 'enemy';
            const zoomW = 960, zoomH = isEnemy ? 500 : 380;

            const bg = this.add.rectangle(zoomCx, zoomCy, zoomW, zoomH, known ? 0x152a15 : 0x1a1a1a)
                .setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5).setStrokeStyle(6, known ? 0x66cc66 : 0x444444);
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
                const preview = this.add.sprite(zoomCx, zoomCy - 156, entry.key).setScrollFactor(0).setDepth(depth + 2);
                // Non-boss enemies preview at a size relative to their own actual in-game
                // scale (× 3.2, chosen so the game's most common 0.5 scale lands on the old
                // flat 1.6 baseline) instead of one flat size for all of them — so e.g. the
                // Coriander Hydra (0.64) visibly dwarfs Small Spinach (0.44) here just like
                // it does in a real level. entry.scale is intentionally frozen at each
                // enemy's original pre-2x value (see upgradeContent.js), so this stays
                // exactly as it's always looked regardless of any later in-game size change.
                if (entry.isBoss) preview.setScale(0.8); else preview.setScale(entry.scale * 3.2);
                if (!known) preview.setTint(0x000000);
                preview.play(animKey);
                modeItems.push(preview);

                const nameText = this.add.text(zoomCx, zoomCy - 10, known ? entry.label : '???', {
                    fontSize: '36px', fontFamily: 'Arial Black, Arial', color: known ? '#ffffff' : '#ffff44',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
                modeItems.push(nameText);
                modeItems.push(this.add.text(zoomCx, zoomCy + 40, known ? `Level ${entry.level}${entry.isBoss ? '   •   BOSS' : ''}` : 'Level ???', {
                    fontSize: '24px', fontFamily: 'Arial', color: known ? (entry.isBoss ? '#ff8888' : '#aaaaaa') : '#666666',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5));
                modeItems.push(this.add.text(zoomCx, zoomCy + 88, known ? `Kills: ${entry.kills}     Losses to this enemy: ${entry.losses}` : 'Kills: ???     Losses to this enemy: ???', {
                    fontSize: '22px', fontFamily: 'Arial', color: known ? '#dddddd' : '#666666',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5));
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
                const nameText = this.add.text(zoomCx, zoomCy - 136, nameLabel, {
                    fontSize: '36px', fontFamily: 'Arial Black, Arial', color: known ? '#ffffff' : '#ffff44',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
                const descText = this.add.text(zoomCx, zoomCy - 40, descLabel, {
                    fontSize: '24px', fontFamily: known ? 'Arial' : 'Arial Black, Arial', color: '#dddddd',
                    wordWrap: { width: zoomW - 120 }, align: 'center',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
                modeItems.push(nameText, descText);

                if (entry.section === 'evolution' && known) {
                    modeItems.push(this.add.text(zoomCx, zoomCy + 80, `Evolves from: ${entry.weaponLabel} (maxed) + ${entry.boostName}`, {
                        fontSize: '20px', fontFamily: 'Arial', color: '#aaaaaa',
                    }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5));
                }

                // NEXT/PREVIOUS TIER — bottom-right corner of the box, weapons/boosts only,
                // only cycling through tiers actually reached (never the full possible max).
                if (entry.section !== 'evolution' && known) {
                    const tierY = zoomCy + zoomH / 2 - 36;
                    const canPrevTier = zoomTier > 1;
                    const canNextTier = zoomTier < entry.gotten;
                    const prevTierBtn = this.add.text(zoomCx + zoomW / 2 - 420, tierY, '◀ PREVIOUS TIER', {
                        fontSize: '18px', fontFamily: 'Arial', color: canPrevTier ? '#ffffff' : '#555555',
                        backgroundColor: '#222222', padding: { x: 16, y: 8 },
                    }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0, 0.5);
                    const nextTierBtn = this.add.text(zoomCx + zoomW / 2 - 24, tierY, 'NEXT TIER ▶', {
                        fontSize: '18px', fontFamily: 'Arial', color: canNextTier ? '#ffffff' : '#555555',
                        backgroundColor: '#222222', padding: { x: 16, y: 8 },
                    }).setScrollFactor(0).setDepth(depth + 2).setOrigin(1, 0.5);
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

                    // FLAG/UNFLAG — bottom-left corner, only offered from the pause menu
                    // (flaggable) and only for weapons/boosts already discovered. Pressing
                    // FLAG immediately flags the entry and swaps to a differently-coloured
                    // UNFLAG button that stays unpressable for 1000ms (so a reflexive
                    // second click can't instantly undo it). Un-flagging has no cooldown.
                    if (flaggable) {
                        let flagged = isEntryFlagged(entry);
                        const flagBtn = this.add.text(zoomCx - zoomW / 2 + 24, tierY, '', {
                            fontSize: '18px', fontFamily: 'Arial Black, Arial',
                            backgroundColor: '#000000', padding: { x: 16, y: 8 },
                        }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0, 0.5);
                        modeItems.push(flagBtn);
                        const paintFlagBtn = () => {
                            flagBtn.setText(flagged ? 'UNFLAG' : 'FLAG');
                            flagBtn.setColor(flagged ? '#ff6666' : '#ffffff');
                            flagBtn.setBackgroundColor(flagged ? '#330000' : '#224400');
                        };
                        paintFlagBtn();
                        flagBtn.setInteractive({ useHandCursor: true });
                        flagBtn.on('pointerover', () => flagBtn.setColor(flagged ? '#ffaaaa' : '#ffff00'));
                        flagBtn.on('pointerout',  () => paintFlagBtn());
                        flagBtn.on('pointerdown', () => {
                            toggleEntryFlag(entry);
                            flagged = !flagged;
                            paintFlagBtn();
                            if (flagged) {
                                flagBtn.disableInteractive();
                                flagBtn.setColor('#884444');
                                setTimeout(() => {
                                    if (!flagBtn.active) return; // menu closed/rebuilt since
                                    flagBtn.setInteractive({ useHandCursor: true });
                                    flagBtn.setColor('#ff6666');
                                }, 1000);
                            }
                        });
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
            const arrowLeft = this.add.text(zoomCx - zoomW / 2 - 60, zoomCy, '◀', {
                fontSize: '56px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            const arrowRight = this.add.text(zoomCx + zoomW / 2 + 60, zoomCy, '▶', {
                fontSize: '56px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            arrowLeft.on('pointerover',  () => arrowLeft.setColor('#ffff00'));
            arrowLeft.on('pointerout',   () => arrowLeft.setColor('#ffffff'));
            arrowLeft.on('pointerdown',  () => switchEntry(-1));
            arrowRight.on('pointerover', () => arrowRight.setColor('#ffff00'));
            arrowRight.on('pointerout',  () => arrowRight.setColor('#ffffff'));
            arrowRight.on('pointerdown', () => switchEntry(1));
            modeItems.push(arrowLeft, arrowRight);

            const backBtn = this.add.text(W / 2, H - 72, '[ BACK ]', {
                fontSize: '26px', fontFamily: 'Arial', color: '#aaaaaa',
                backgroundColor: '#222222', padding: { x: 32, y: 12 },
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
            backBtn.on('pointerout',  () => backBtn.setColor('#aaaaaa'));
            backBtn.on('pointerdown', () => backToGrid());
            modeItems.push(backBtn);

            modeItems.push(registerGamepadHint(this.add.text(W / 2, H - 8, '🎮  ◀/▶ or LB/RB  Switch Entry   B  Back', {
                fontSize: '18px', fontFamily: 'Arial', color: '#888888',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5, 1)));
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
            const tx = W / 2 - 510 + i * 340;
            const btn = this.add.text(tx, 96, label, {
                fontSize: '24px', fontFamily: 'Arial Black, Arial',
                color: section === key ? '#ffff00' : '#888888',
                backgroundColor: '#222222', padding: { x: 24, y: 10 },
            }).setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5).setInteractive({ useHandCursor: true });
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
            if (Math.abs(ry) > 0.2) applyScroll(scrollY + ry * 800 * (delta / 1000));
        };
        this.events.on('update', scrollUpdateHandler);

        const wheelHandler = (pointer, gameObjects, dx, dy) => {
            if (mode !== 'grid' || maxScroll <= 0) return;
            applyScroll(scrollY + dy * 0.5);
        };
        this.input.on('wheel', wheelHandler);

        // Touch/mouse drag-to-scroll — dragging vertically anywhere over the grid
        // viewport scrolls it (the natural mobile swipe gesture), rather than only
        // being scrollable by precisely dragging the thin scrollbar thumb.
        let gridDragActive = false, gridDragStartY = 0, gridDragBaseScroll = 0;
        const gridDragStart = (pointer) => {
            if (mode !== 'grid' || maxScroll <= 0 || thumbInteracting) return;
            if (pointer.y < viewportTop || pointer.y > viewportBottom) return;
            gridDragActive = true;
            gridDragStartY = pointer.y;
            gridDragBaseScroll = scrollY;
        };
        const gridDragMove = (pointer) => {
            if (!gridDragActive || !pointer.isDown) return;
            applyScroll(gridDragBaseScroll - (pointer.y - gridDragStartY));
        };
        const gridDragEnd = () => { gridDragActive = false; thumbInteracting = false; };
        this.input.on('pointerdown', gridDragStart);
        this.input.on('pointermove', gridDragMove);
        this.input.on('pointerup', gridDragEnd);

        buildGrid();
    },

};
