import { playSfx } from '../audio.js';
export const EvolutionUIMethods = {

    // Current level/count for a weapon or boost, and the "current/max" fraction text used
    // by the level-up cards and pause menu loadout.
    getWeaponLevel(weaponKey) {
        const levels = {
            bite:         this.biteLevel,
            tailslap:     this.ownedWeapons.has('tailslap')     ? 1 + (this.tailSlapUpgraded ? 1 : 0) : 0,
            poop:         this.ownedWeapons.has('poop')         ? 1 + (this.poopUpgraded     ? 1 : 0) : 0,
            pebble:       this.ownedWeapons.has('pebble')       ? 1 + (this.pebbleCount > 3  ? 1 : 0) : 0,
            hiss:         this.ownedWeapons.has('hiss')         ? 1 + (this.hissUpgraded     ? 1 : 0) : 0,
            lick:         this.lickLevel,
            wormwhip:     this.wormWhipLevel,
            pupamines:    this.pupaLevel,
            skinshed:     this.skinLevel,
            woodiebounce: this.woodieLevel,
            dubiashields: this.dubiaLevel,
            poisonclaw:   this.poisonClawLevel,
            branchthrow:  this.branchLevel,
            dustkick:     this.dustKickLevel,
            scratch:      this.scratchLevel,
            coldglare:    this.coldGlareActive ? this.coldGlareLevel : 0,
        };
        return levels[weaponKey] ?? (this.ownedWeapons.has(weaponKey) ? 1 : 0);
    },

    getBoostLevel(boostName) {
        return this.ownedPassives.filter(p => p === boostName).length;
    },

    // "Label (cur/max)" for an owned/partially-owned weapon or boost
    weaponFractionLabel(weaponKey, label) {
        const max = this.weaponMaxLevel[weaponKey];
        if (!max) return label;
        const cur = Math.min(this.getWeaponLevel(weaponKey), max);
        return `${label} (${cur}/${max})`;
    },

    boostFractionLabel(boostName) {
        const max = this.boostMaxLevel[boostName];
        if (!max) return boostName;
        const cur = Math.min(this.getBoostLevel(boostName), max);
        return `${boostName} (${cur}/${max})`;
    },

    // "Label (would-be/max)" for a card offering the NEXT level of a weapon or boost
    weaponCardLabel(weaponKey, label) {
        const max = this.weaponMaxLevel[weaponKey];
        if (!max) return label;
        const wouldBe = Math.min(this.getWeaponLevel(weaponKey) + 1, max);
        return `${label} (${wouldBe}/${max})`;
    },

    boostCardLabel(boostName) {
        const max = this.boostMaxLevel[boostName];
        if (!max) return boostName;
        const wouldBe = Math.min(this.getBoostLevel(boostName) + 1, max);
        return `${boostName} (${wouldBe}/${max})`;
    },

    isWeaponMaxed(weaponKey) {
        const max = this.weaponMaxLevel[weaponKey];
        if (!max) return false;
        return this.getWeaponLevel(weaponKey) >= max;
    },

    isBoostMaxed(boostName) {
        const max = this.boostMaxLevel[boostName];
        if (!max) return false;
        return this.getBoostLevel(boostName) >= max;
    },

    getAvailableEvolutions() {
        // Requires the weapon fully maxed AND at least one pick of the paired boost
        // (the boost itself does not need to be maxed).
        return this.evolutionDefs.filter(ev =>
            !this.appliedEvolutions.has(ev.id) &&
            this.isWeaponMaxed(ev.weaponKey) &&
            this.getBoostLevel(ev.boostName) >= 1
        );
    },

    applyEvolution(ev) {
        this.appliedEvolutions.add(ev.id);
        ev.effect.call(this);
    },

    _getEvoReqLines(ev) {
        // Returns { weaponLine, boostLine } describing current vs required progress
        const weaponMaxed = this.isWeaponMaxed(ev.weaponKey);
        const max = this.weaponMaxLevel[ev.weaponKey] ?? 1;
        const cur = Math.min(this.getWeaponLevel(ev.weaponKey), max);
        const weaponLine = weaponMaxed
            ? `✓ ${ev.weaponLabel} (${cur}/${max}) — READY`
            : `✗ ${ev.weaponLabel} (${cur}/${max}) — not fully upgraded`;

        const boostOwned = this.getBoostLevel(ev.boostName) >= 1;
        const boostLine = boostOwned
            ? `✓ ${ev.boostName} — READY`
            : `✗ ${ev.boostName} — not yet picked`;

        return { weaponLine, boostLine };
    },

    showEvolutionMenu() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const depth = 200;
        // Every evolution is shown, including ones already acquired (rendered in a
        // distinct white/black "owned" style further down) so the grid layout and
        // controller navigation stay stable regardless of progress.
        const evos = this.evolutionDefs;

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setScrollFactor(0).setDepth(depth).setInteractive();
        const title = this.add.text(W / 2, 30, 'EVOLUTIONS', {
            fontSize: '28px', fontFamily: 'Arial Black, Arial', color: '#ffff00',
            stroke: '#000000', strokeThickness: 5,
        }).setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5);
        const persistentItems = [overlay, title];

        // Two "screens" share this menu: the grid (browse all evolutions) and the
        // zoom (a single evolution blown up, with prev/next arrows + an UNLOCK? button).
        // Only one is ever on screen; `modeItems` holds whichever is currently built so
        // switching between them just tears down and rebuilds that half.
        let mode = 'grid'; // 'grid' | 'zoom'
        let modeItems = [];
        let zoomIdx = 0;
        const destroyModeItems = () => { modeItems.forEach(o => o.destroy()); modeItems = []; };

        // Closes this menu (any method) without letting the same input also fall through
        // to the pause menu's "any input resumes" handlers.
        const closeMenu = () => {
            destroyModeItems();
            persistentItems.forEach(o => o.destroy());
            this.input.keyboard.off('keydown', keyHandler);
            this.input.gamepad.off('down', padHandler);
            this.events.off('update', scrollUpdateHandler);
            this.events.off('update', navPollHandler);
            requestAnimationFrame(() => { this._evoMenuOpen = false; });
        };

        // Shared so both mouse clicks and gamepad A (from the zoom screen) can unlock
        const acquireEvolution = (ev) => {
            closeMenu();
            if (this._evoFlashTween) { this._evoFlashTween.stop(); this._evoFlashTween = null; }
            this.applyEvolution(ev);
            this._updateEvoBtnAppearance();
        };

        // ─── Grid screen ────────────────────────────────────────────────────────
        const cardW = 200, cardH = 92, cols = 3;
        const startX = W / 2 - (cols - 1) * (cardW + 12) / 2;
        const startY = 75;

        // Scrollable viewport — below the title, above the CLOSE button/hint.
        // Cards beyond this range are reachable by dragging the tab on the right
        // edge, the right stick, or (if ever needed) a mouse wheel.
        const viewportTop    = 62;
        const viewportBottom = H - 42;
        const trackHeight    = viewportBottom - viewportTop;
        const rows           = Math.max(1, Math.ceil(evos.length / cols));
        const contentBottom  = startY + (rows - 1) * (cardH + 12) + cardH;
        const maxScroll       = Math.max(0, contentBottom - viewportBottom);
        let scrollY = 0;
        let thumb   = null;
        let scrollables = []; // { obj, baseY }
        let cardRefs = [];    // { ev, i, cx, baseY } — for gamepad grid navigation
        let selectedIdx = 0;
        let selectionOutline = null;

        const applyScroll = (y) => {
            scrollY = Phaser.Math.Clamp(y, 0, maxScroll);
            scrollables.forEach(s => { s.obj.y = s.baseY - scrollY; });
            if (thumb) {
                thumb.y = viewportTop + (maxScroll > 0 ? (scrollY / maxScroll) * (trackHeight - thumb.height) : 0);
            }
            positionSelectionOutline();
        };

        const positionSelectionOutline = () => {
            const card = cardRefs[selectedIdx];
            if (!card || !selectionOutline) return;
            selectionOutline.setPosition(card.cx, card.baseY - scrollY + cardH / 2);
            selectionOutline.setVisible(true);
        };

        const ensureSelectedVisible = () => {
            const card = cardRefs[selectedIdx];
            if (!card) return;
            const topY = card.baseY - scrollY;
            const botY = card.baseY - scrollY + cardH;
            if (topY < viewportTop) applyScroll(scrollY - (viewportTop - topY));
            else if (botY > viewportBottom) applyScroll(scrollY + (botY - viewportBottom));
            else positionSelectionOutline();
        };

        const moveGridSelection = (delta, sameRowOnly = false) => {
            const newIdx = selectedIdx + delta;
            if (newIdx < 0 || newIdx >= cardRefs.length) return;
            if (sameRowOnly && Math.floor(newIdx / cols) !== Math.floor(selectedIdx / cols)) return;
            selectedIdx = newIdx;
            ensureSelectedVisible();
        };

        const buildGrid = () => {
            mode = 'grid';
            destroyModeItems();
            scrollY = 0; thumb = null; scrollables = []; cardRefs = [];
            const available = this.getAvailableEvolutions();

            evos.forEach((ev, i) => {
                const isAcquired = this.appliedEvolutions.has(ev.id);
                const isAvail = !isAcquired && available.includes(ev);
                const col = i % cols;
                const row = Math.floor(i / cols);
                const cx = startX + col * (cardW + 12);
                const cy = startY + row * (cardH + 12);

                const bgColor     = isAcquired ? 0xffffff : (isAvail ? 0x3a3000 : 0x1a1a1a);
                const borderColor = isAcquired ? 0x000000 : (isAvail ? 0xffee00 : 0x444444);
                const nameColor   = isAcquired ? '#000000' : (isAvail ? '#ffff44' : '#555555');
                const recipeColor = isAcquired ? '#000000' : (isAvail ? '#aaaaaa' : '#333333');
                const descColor   = isAcquired ? '#000000' : (isAvail ? '#cccccc' : '#2a2a2a');
                const hoverColor  = isAcquired ? bgColor : (isAvail ? 0x554400 : 0x2a2a2a);

                const bg = this.add.rectangle(cx, cy, cardW, cardH, bgColor, 1)
                    .setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5, 0);
                const border = this.add.rectangle(cx, cy, cardW, cardH)
                    .setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5, 0)
                    .setStrokeStyle(2, borderColor);

                const nameText = this.add.text(cx, cy + 10, ev.evolvedName, {
                    fontSize: '12px', fontFamily: 'Arial Black, Arial',
                    color: nameColor,
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5, 0);
                const recipeText = this.add.text(cx, cy + 30, isAcquired ? '✓ EVOLVED' : `Requires: ${ev.weaponLabel} maxed + ${ev.boostName}`, {
                    fontSize: '9px', fontFamily: 'Arial', color: recipeColor,
                    wordWrap: { width: cardW - 12 }, align: 'center',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5, 0);
                const descText = this.add.text(cx, cy + 58, ev.desc, {
                    fontSize: '9px', fontFamily: 'Arial', color: descColor,
                    wordWrap: { width: cardW - 12 }, align: 'center',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5, 0);

                modeItems.push(bg, border, nameText, recipeText, descText);
                scrollables.push(
                    { obj: bg,         baseY: cy },
                    { obj: border,     baseY: cy },
                    { obj: nameText,   baseY: cy + 10 },
                    { obj: recipeText, baseY: cy + 30 },
                    { obj: descText,   baseY: cy + 58 },
                );
                cardRefs.push({ ev, i, cx, baseY: cy });

                // Pressing any card (locked, available, or already-evolved) zooms in on it.
                bg.setInteractive({ useHandCursor: true });
                bg.on('pointerover', () => bg.setFillStyle(hoverColor));
                bg.on('pointerout',  () => bg.setFillStyle(bgColor));
                bg.on('pointerdown', () => openZoom(i));
                if (isAvail) {
                    this.tweens.add({ targets: [bg, border], alpha: 0.6, duration: 500, yoyo: true, repeat: -1 });
                }
            });

            // ─── Controller navigation — same scheme as Level Select: D-pad/stick moves
            // a white box outline, A zooms in on whatever it's on ─────────────────────
            selectionOutline = this.add.rectangle(0, 0, cardW + 6, cardH + 6, 0xffffff, 0)
                .setStrokeStyle(3, 0xffffff).setScrollFactor(0).setDepth(depth + 6).setOrigin(0.5).setVisible(false);
            modeItems.push(selectionOutline);
            if (selectedIdx >= cardRefs.length) selectedIdx = 0;
            positionSelectionOutline();

            const closeBtn = this.add.text(W / 2, H - 24, '[ CLOSE ]', {
                fontSize: '13px', fontFamily: 'Arial', color: '#aaaaaa',
                backgroundColor: '#222222', padding: { x: 16, y: 6 },
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            closeBtn.on('pointerover',  () => closeBtn.setColor('#ffffff'));
            closeBtn.on('pointerout',   () => closeBtn.setColor('#aaaaaa'));
            closeBtn.on('pointerdown',  () => closeMenu());
            modeItems.push(closeBtn);

            modeItems.push(this.add.text(W / 2, H - 6, maxScroll > 0
                ? '🎮  D-Pad/LS Navigate   A Zoom In   B Close   •   RS Scroll'
                : '🎮  D-Pad/LS Navigate   A Zoom In   B Close', {
                fontSize: '10px', fontFamily: 'Arial', color: '#888888',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5));

            // Scrollbar — a draggable tab on the far right edge, only shown if content overflows
            if (maxScroll > 0) {
                const track = this.add.rectangle(W - 10, viewportTop + trackHeight / 2, 8, trackHeight, 0x000000, 0.35)
                    .setScrollFactor(0).setDepth(depth + 3);
                modeItems.push(track);

                const thumbHeight = Math.max(30, trackHeight * (trackHeight / (trackHeight + maxScroll)));
                thumb = this.add.rectangle(W - 10, viewportTop, 14, thumbHeight, 0xffdd55, 0.9)
                    .setScrollFactor(0).setDepth(depth + 4).setOrigin(0.5, 0)
                    .setInteractive({ useHandCursor: true });
                this.input.setDraggable(thumb);
                modeItems.push(thumb);

                thumb.on('drag', (pointer, dragX, dragY) => {
                    const clampedTop = Phaser.Math.Clamp(dragY, viewportTop, viewportBottom - thumb.height);
                    const ratio = (clampedTop - viewportTop) / (trackHeight - thumb.height);
                    applyScroll(ratio * maxScroll);
                });
            }

            applyScroll(scrollY);
        };

        // ─── Zoom screen — one evolution blown up, with prev/next arrows and an
        // UNLOCK? button that's only live when the evolution is actually available ──
        const zoomCx = W / 2, zoomCy = 150, zoomCardW = 480, zoomCardH = 200;

        const openZoom = (i) => { zoomIdx = i; buildZoom(); };
        const zoomStep = (delta) => { zoomIdx = (zoomIdx + delta + evos.length) % evos.length; buildZoom(); };
        const backToGrid = () => { selectedIdx = zoomIdx; buildGrid(); };

        const buildZoom = () => {
            mode = 'zoom';
            destroyModeItems();
            const ev = evos[zoomIdx];
            const isAcquired = this.appliedEvolutions.has(ev.id);
            const isAvail = !isAcquired && this.getAvailableEvolutions().includes(ev);
            const borderColor = isAcquired ? 0x000000 : (isAvail ? 0xffee00 : 0x444444);
            const bgColor   = isAcquired ? 0xffffff : 0x1a1a1a;
            const textColor = isAcquired ? '#000000' : '#dddddd';

            const bg = this.add.rectangle(zoomCx, zoomCy, zoomCardW, zoomCardH, bgColor, 1)
                .setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5);
            const border = this.add.rectangle(zoomCx, zoomCy, zoomCardW, zoomCardH)
                .setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5).setStrokeStyle(3, borderColor);
            const nameText = this.add.text(zoomCx, zoomCy - 78, ev.evolvedName, {
                fontSize: '20px', fontFamily: 'Arial Black, Arial', color: isAcquired ? '#000000' : '#ffff44',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
            const descText = this.add.text(zoomCx, zoomCy - 30, ev.desc, {
                fontSize: '12px', fontFamily: 'Arial', color: textColor,
                wordWrap: { width: zoomCardW - 60 }, align: 'center',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
            modeItems.push(bg, border, nameText, descText);

            if (isAcquired) {
                modeItems.push(this.add.text(zoomCx, zoomCy + 50, '✓ EVOLVED', {
                    fontSize: '13px', fontFamily: 'Arial Black, Arial', color: '#008800',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5));
            } else {
                const { weaponLine, boostLine } = this._getEvoReqLines(ev);
                modeItems.push(this.add.text(zoomCx, zoomCy + 40, weaponLine, {
                    fontSize: '11px', fontFamily: 'Arial', color: weaponLine.startsWith('✓') ? '#88ff88' : '#ff8888',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5));
                modeItems.push(this.add.text(zoomCx, zoomCy + 60, boostLine, {
                    fontSize: '11px', fontFamily: 'Arial', color: boostLine.startsWith('✓') ? '#88ff88' : '#ff8888',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5));
            }

            // Prev/next arrows — cycle through every evolution, wrapping at the ends
            const arrowLeft = this.add.text(zoomCx - zoomCardW / 2 - 30, zoomCy, '◀', {
                fontSize: '28px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            const arrowRight = this.add.text(zoomCx + zoomCardW / 2 + 30, zoomCy, '▶', {
                fontSize: '28px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            arrowLeft.on('pointerover',  () => arrowLeft.setColor('#ffff00'));
            arrowLeft.on('pointerout',   () => arrowLeft.setColor('#ffffff'));
            arrowLeft.on('pointerdown',  () => zoomStep(-1));
            arrowRight.on('pointerover', () => arrowRight.setColor('#ffff00'));
            arrowRight.on('pointerout',  () => arrowRight.setColor('#ffffff'));
            arrowRight.on('pointerdown', () => zoomStep(1));
            modeItems.push(arrowLeft, arrowRight);

            // UNLOCK? — dormant (greyed out, non-interactive) unless this evolution is
            // actually available (weapon maxed + boost owned, and not already acquired)
            const unlockY = zoomCy + zoomCardH / 2 + 34;
            const unlockBtn = this.add.text(zoomCx, unlockY, isAcquired ? '✓ EVOLVED' : 'UNLOCK?', {
                fontSize: '15px', fontFamily: 'Arial Black, Arial',
                color: isAvail ? '#003300' : '#777777',
                backgroundColor: isAvail ? '#ffee00' : '#2a2a2a',
                padding: { x: 20, y: 8 },
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
            modeItems.push(unlockBtn);
            if (isAvail) {
                unlockBtn.setInteractive({ useHandCursor: true });
                unlockBtn.on('pointerover', () => unlockBtn.setBackgroundColor('#ffff88'));
                unlockBtn.on('pointerout',  () => unlockBtn.setBackgroundColor('#ffee00'));
                unlockBtn.on('pointerdown', () => acquireEvolution(ev));
                this.tweens.add({ targets: unlockBtn, alpha: 0.6, duration: 500, yoyo: true, repeat: -1 });
            }

            const backBtn = this.add.text(W / 2, H - 24, '[ BACK ]', {
                fontSize: '13px', fontFamily: 'Arial', color: '#aaaaaa',
                backgroundColor: '#222222', padding: { x: 16, y: 6 },
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
            backBtn.on('pointerout',  () => backBtn.setColor('#aaaaaa'));
            backBtn.on('pointerdown', () => backToGrid());
            modeItems.push(backBtn);

            modeItems.push(this.add.text(W / 2, H - 6, '🎮  ◀ / ▶ or LB / RB  Switch    A  Unlock    B  Back', {
                fontSize: '10px', fontFamily: 'Arial', color: '#888888',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5));
        };

        // Continuous left-stick grid navigation (D-pad handled as discrete 'down' events below)
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

        // ESC: back out of zoom first, then close; on the grid it closes outright
        const keyHandler = (e) => {
            if (e.key !== 'Escape') return;
            if (mode === 'zoom') backToGrid(); else closeMenu();
        };
        this.input.keyboard.on('keydown', keyHandler);

        const padHandler = (pad, button) => {
            const idx = button.index;
            if (mode === 'grid') {
                if (idx === 1) { closeMenu(); return; }               // B = close
                if (idx === 12) { moveGridSelection(-cols); return; }        // D-pad up
                if (idx === 13) { moveGridSelection(cols); return; }         // D-pad down
                if (idx === 14) { moveGridSelection(-1, true); return; }     // D-pad left
                if (idx === 15) { moveGridSelection(1, true); return; }      // D-pad right
                if (idx === 0) { openZoom(selectedIdx); return; }            // A = zoom in
            } else {
                if (idx === 1) { backToGrid(); return; }                     // B = back to grid
                if (idx === 4 || idx === 14) { zoomStep(-1); return; }       // LB / d-pad left = prev
                if (idx === 5 || idx === 15) { zoomStep(1); return; }        // RB / d-pad right = next
                if (idx === 0) {                                             // A = unlock, if available
                    const ev = evos[zoomIdx];
                    const isAcquired = this.appliedEvolutions.has(ev.id);
                    const isAvail = !isAcquired && this.getAvailableEvolutions().includes(ev);
                    if (isAvail) acquireEvolution(ev);
                    return;
                }
            }
        };
        this.input.gamepad.on('down', padHandler);

        buildGrid();
    },

    _updateEvoBtnAppearance() {
        this.updatePauseBtnGlow();
        if (!this._evoBtnText) return;
        const hasAny = this.getAvailableEvolutions().length > 0;
        if (hasAny) {
            this._evoBtnText.setColor('#ffff00');
            if (!this._evoFlashTween) {
                this._evoFlashTween = this.tweens.add({ targets: this._evoBtnText, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
            }
        } else {
            this._evoBtnText.setColor('#444444');
            if (this._evoFlashTween) { this._evoFlashTween.stop(); this._evoFlashTween = null; }
            this._evoBtnText.setAlpha(1);
        }
    },

    // Flashes the in-game "⏸ PAUSE" button gold whenever an evolution is ready,
    // so players get a signal without needing to open the pause menu.
    updatePauseBtnGlow() {
        if (!this.pauseBtn) return;
        const hasEvo = this.getAvailableEvolutions().length > 0;
        if (hasEvo) {
            if (!this._pauseBtnGlowTween) {
                this.pauseBtn.setColor('#ffdd00');
                this._pauseBtnGlowTween = this.tweens.add({ targets: this.pauseBtn, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
            }
        } else if (this._pauseBtnGlowTween) {
            this._pauseBtnGlowTween.stop(); this._pauseBtnGlowTween = null;
            this.pauseBtn.setAlpha(1);
            this.pauseBtn.setColor('#ffffff');
        }
    },

    buildLoadoutText() {
        const weapons = [];
        const wl = (key, label) => this.weaponFractionLabel(key, label);
        // Evolved weapons are a terminal form beyond any level — tag them "(MAX)" so the
        // loadout line stays consistent with the "(cur/max)" fraction shown on everything else.
        if (this.ownedWeapons.has('starvechomp'))      weapons.push('Starved Chomp (MAX)');
        else if (this.ownedWeapons.has('bite'))        weapons.push(wl('bite', 'Bite'));
        if (this.ownedWeapons.has('steelslam'))        weapons.push('Steel Slam (MAX)');
        else if (this.ownedWeapons.has('tailslap'))    weapons.push(wl('tailslap', 'Tail Slap'));
        if (this.ownedWeapons.has('toxicocean'))       weapons.push('Toxic Ocean (MAX)');
        else if (this.ownedWeapons.has('poop'))        weapons.push(wl('poop', 'Poop'));
        if (this.ownedWeapons.has('sunbakedambers'))   weapons.push('Sunbaked Ambers (MAX)');
        else if (this.ownedWeapons.has('pebble'))      weapons.push(wl('pebble', 'Pebble Flick'));
        if (this.ownedWeapons.has('ragingroar'))       weapons.push('Raging Roar (MAX)');
        else if (this.ownedWeapons.has('hiss'))        weapons.push(wl('hiss', 'Hiss'));
        if (this.ownedWeapons.has('stickyshot'))       weapons.push('Sticky Shot (MAX)');
        else if (this.ownedWeapons.has('lick'))        weapons.push(wl('lick', 'Lick'));
        if (this.ownedWeapons.has('acidsnake'))        weapons.push('Acid Snake (MAX)');
        else if (this.ownedWeapons.has('wormwhip'))    weapons.push(wl('wormwhip', 'Worm Whip'));
        if (this.ownedWeapons.has('bugbuster'))        weapons.push('Bug Buster (MAX)');
        else if (this.ownedWeapons.has('pupamines'))   weapons.push(wl('pupamines', 'Pupa Mines'));
        if (this.ownedWeapons.has('spikeshedder'))     weapons.push('Spike Shedder (MAX)');
        else if (this.ownedWeapons.has('skinshed'))    weapons.push(wl('skinshed', 'Skin Shed'));
        if (this.ownedWeapons.has('shiningshells'))    weapons.push('Shining Shells (MAX)');
        else if (this.ownedWeapons.has('woodiebounce'))weapons.push(wl('woodiebounce', 'Woodie Bounce'));
        if (this.ownedWeapons.has('dubiadefenders'))   weapons.push('Dubia Defenders (MAX)');
        else if (this.ownedWeapons.has('dubiashields'))weapons.push(wl('dubiashields', 'Dubia Shields'));
        if (this.ownedWeapons.has('flashclaw'))        weapons.push('Flashclaw (MAX)');
        else if (this.ownedWeapons.has('poisonclaw'))  weapons.push(wl('poisonclaw', 'Poison Claw'));
        if (this.ownedWeapons.has('loglob'))           weapons.push('Log Lob (MAX)');
        else if (this.ownedWeapons.has('branchthrow')) weapons.push(wl('branchthrow', 'Branch Throw'));
        if (this.ownedWeapons.has('duststorm'))        weapons.push('Duststorm (MAX)');
        else if (this.ownedWeapons.has('dustkick'))    weapons.push(wl('dustkick', 'Dust Kick'));
        if (this.ownedWeapons.has('thrash'))           weapons.push('Lucky Thrash (MAX)');
        else if (this.ownedWeapons.has('scratch'))     weapons.push(wl('scratch', 'Lucky Scratch'));
        if (this.ownedWeapons.has('fourchills'))       weapons.push('Four Chills (MAX)');
        else if (this.coldGlareActive)                 weapons.push(wl('coldglare', 'Cold Glare'));

        const seen = new Set();
        const boosts = this.ownedPassives.filter(p => !seen.has(p) && seen.add(p))
            .map(name => this.boostFractionLabel(name));

        return {
            weaponLine: '⚔  ' + (weapons.length ? weapons.join('  •  ') : 'none yet'),
            boostLine:  '★  ' + (boosts.length  ? boosts.join('  •  ')  : 'none yet'),
        };
    },

    playerDamageFlash() {
        if (!this.player?.active) return;
        playSfx(this, 'sfx_player_hurt');
        this.tweens.killTweensOf(this.player);
        this.player.setAlpha(1);
        this.tweens.add({ targets: this.player, alpha: 0.3, duration: 100, yoyo: true });
    },

    scheduleProjectileDespawn(proj, delay) {
        this.time.delayedCall(delay, () => {
            if (!proj.active) return;
            if (this.isCountdown) this.scheduleProjectileDespawn(proj, 500);
            else proj.destroy();
        });
    },

    doRegen() {
        if (this.isCountdown) return;
        if (this.playerHealth < this.playerMaxHealth) {
            this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + this.regenHealAmount);
            this.updateHPBar();
        }
    },

    // Well Fed levels don't just speed up the same 1 HP tick — each level has its
    // own heal amount + interval: 1hp/15s, then 2hp/10s, then 3hp/8s.
    startRegen() {
        const level = this.ownedPassives.filter(p => p === 'Well Fed').length;
        const tiers = [
            { delay: 15000, heal: 1 },
            { delay: 10000, heal: 2 },
            { delay: 8000,  heal: 3 },
        ];
        const cfg = tiers[level - 1] ?? tiers[tiers.length - 1];
        this.regenDelay      = cfg.delay;
        this.regenHealAmount = cfg.heal;
        this.regenTimer.remove();
        this.regenTimer = this.time.addEvent({ delay: this.regenDelay, callback: this.doRegen, callbackScope: this, loop: true });
    },


};
