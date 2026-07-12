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
            coldglare:    this.coldGlareActive ? 1 + this.coldGlareCdLevel + this.coldGlareSlLevel : 0,
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
        const available = this.getAvailableEvolutions();

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setScrollFactor(0).setDepth(depth).setInteractive();
        const title = this.add.text(W / 2, 30, 'EVOLUTIONS', {
            fontSize: '28px', fontFamily: 'Arial Black, Arial', color: '#ffff00',
            stroke: '#000000', strokeThickness: 5,
        }).setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5);

        const cardW = 200, cardH = 92, cols = 3;
        const startX = W / 2 - (cols - 1) * (cardW + 12) / 2;
        const startY = 75;
        const uiItems = [overlay, title];

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
        const scrollables = []; // { obj, baseY }
        const cardRefs = [];    // { ev, cx, baseY, isAcquired, isAvail } — for gamepad grid navigation

        const applyScroll = (y) => {
            scrollY = Phaser.Math.Clamp(y, 0, maxScroll);
            scrollables.forEach(s => { s.obj.y = s.baseY - scrollY; });
            if (thumb) {
                thumb.y = viewportTop + (maxScroll > 0 ? (scrollY / maxScroll) * (trackHeight - thumb.height) : 0);
            }
            positionSelectionOutline();
        };

        // Closes this menu (any method) without letting the same input also fall through
        // to the pause menu's "any input resumes" handlers.
        const closeMenu = () => {
            uiItems.forEach(o => o.destroy());
            if (this._evoReqPopup) { this._evoReqPopup.forEach(o => o.destroy()); this._evoReqPopup = null; }
            this.input.keyboard.off('keydown', escHandler);
            this.input.gamepad.off('down', padHandler);
            this.events.off('update', scrollUpdateHandler);
            this.events.off('update', navPollHandler);
            requestAnimationFrame(() => { this._evoMenuOpen = false; });
        };

        // Shared so both mouse clicks and gamepad A can trigger the same actions
        const acquireEvolution = (ev) => {
            closeMenu();
            if (this._evoFlashTween) { this._evoFlashTween.stop(); this._evoFlashTween = null; }
            this.applyEvolution(ev);
            this._updateEvoBtnAppearance();
        };

        const openReqPopup = (ev, cx, baseCy) => {
            if (this._evoReqPopup) { this._evoReqPopup.forEach(o => o.destroy()); this._evoReqPopup = null; }

            const { weaponLine, boostLine } = this._getEvoReqLines(ev);
            const popW = 310, popH = 104;
            const px = Phaser.Math.Clamp(cx, popW / 2 + 8, W - popW / 2 - 8);
            const py = Phaser.Math.Clamp((baseCy - scrollY) + cardH + 10, popH / 2 + 8, H - popH / 2 - 30);

            const pbg = this.add.rectangle(px, py, popW, popH, 0x111111, 0.96)
                .setScrollFactor(0).setDepth(depth + 10).setOrigin(0.5);
            const pborder = this.add.rectangle(px, py, popW, popH)
                .setScrollFactor(0).setDepth(depth + 10).setOrigin(0.5)
                .setStrokeStyle(2, 0x888888);
            const pTitle = this.add.text(px, py - 36, `Requirements — ${ev.evolvedName}`, {
                fontSize: '10px', fontFamily: 'Arial Black, Arial', color: '#dddddd',
            }).setScrollFactor(0).setDepth(depth + 11).setOrigin(0.5);
            const pWeapon = this.add.text(px, py - 12, weaponLine, {
                fontSize: '11px', fontFamily: 'Arial', color: weaponLine.startsWith('✓') ? '#88ff88' : '#ff8888',
            }).setScrollFactor(0).setDepth(depth + 11).setOrigin(0.5);
            const pBoost = this.add.text(px, py + 10, boostLine, {
                fontSize: '11px', fontFamily: 'Arial', color: boostLine.startsWith('✓') ? '#88ff88' : '#ff8888',
            }).setScrollFactor(0).setDepth(depth + 11).setOrigin(0.5);
            const pHint = this.add.text(px, py + 34, 'Click or press A to dismiss', {
                fontSize: '9px', fontFamily: 'Arial', color: '#555555',
            }).setScrollFactor(0).setDepth(depth + 11).setOrigin(0.5);

            this._evoReqPopup = [pbg, pborder, pTitle, pWeapon, pBoost, pHint];
            uiItems.push(...this._evoReqPopup);

            // Dismiss on next click anywhere (one-shot)
            this.input.once('pointerdown', () => {
                if (this._evoReqPopup) { this._evoReqPopup.forEach(o => o.destroy()); this._evoReqPopup = null; }
            });
        };

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

            uiItems.push(bg, border, nameText, recipeText, descText);
            scrollables.push(
                { obj: bg,         baseY: cy },
                { obj: border,     baseY: cy },
                { obj: nameText,   baseY: cy + 10 },
                { obj: recipeText, baseY: cy + 30 },
                { obj: descText,   baseY: cy + 58 },
            );
            cardRefs.push({ ev, cx, baseY: cy, isAcquired, isAvail });

            if (isAcquired) {
                // Already evolved — informational only, not interactive
            } else if (isAvail) {
                bg.setInteractive({ useHandCursor: true });
                bg.on('pointerover',  () => bg.setFillStyle(0x554400));
                bg.on('pointerout',   () => bg.setFillStyle(0x3a3000));
                bg.on('pointerdown',  () => acquireEvolution(ev));
                // Glow flash tween on available cards
                this.tweens.add({ targets: [bg, border], alpha: 0.6, duration: 500, yoyo: true, repeat: -1 });
            } else {
                // Clicking a locked card shows a requirements popup
                bg.setInteractive({ useHandCursor: true });
                bg.on('pointerover', () => bg.setFillStyle(0x2a2a2a));
                bg.on('pointerout',  () => bg.setFillStyle(0x1a1a1a));
                bg.on('pointerdown', () => openReqPopup(ev, cx, cy));
            }
        });

        // ─── Controller navigation — same scheme as Level Select: D-pad/stick moves
        // a white box outline, A confirms whatever it's on ──────────────────────────
        let selectedIdx = 0;
        const selectionOutline = this.add.rectangle(0, 0, cardW + 6, cardH + 6, 0xffffff, 0)
            .setStrokeStyle(3, 0xffffff).setScrollFactor(0).setDepth(depth + 6).setOrigin(0.5).setVisible(false);
        uiItems.push(selectionOutline);

        function positionSelectionOutline() {
            const card = cardRefs[selectedIdx];
            if (!card) { selectionOutline.setVisible(false); return; }
            selectionOutline.setPosition(card.cx, card.baseY - scrollY + cardH / 2);
            selectionOutline.setVisible(true);
        }

        const ensureSelectedVisible = () => {
            const card = cardRefs[selectedIdx];
            if (!card) return;
            const topY = card.baseY - scrollY;
            const botY = card.baseY - scrollY + cardH;
            if (topY < viewportTop) applyScroll(scrollY - (viewportTop - topY));
            else if (botY > viewportBottom) applyScroll(scrollY + (botY - viewportBottom));
            else positionSelectionOutline();
        };

        const moveSelection = (delta, sameRowOnly = false) => {
            const newIdx = selectedIdx + delta;
            if (newIdx < 0 || newIdx >= cardRefs.length) return;
            if (sameRowOnly && Math.floor(newIdx / cols) !== Math.floor(selectedIdx / cols)) return;
            selectedIdx = newIdx;
            ensureSelectedVisible();
        };

        const confirmSelection = () => {
            if (this._evoReqPopup) {
                this._evoReqPopup.forEach(o => o.destroy()); this._evoReqPopup = null;
                return;
            }
            const card = cardRefs[selectedIdx];
            if (!card || card.isAcquired) return;
            if (card.isAvail) acquireEvolution(card.ev);
            else openReqPopup(card.ev, card.cx, card.baseY);
        };

        positionSelectionOutline();

        // Continuous left-stick grid navigation (D-pad handled as discrete 'down' events below)
        let navCooldown = 0;
        const navPollHandler = (_, delta) => {
            navCooldown -= delta;
            if (navCooldown > 0) return;
            const pad = this.input.gamepad.getPad(0);
            if (!pad) return;
            const sx = pad.leftStick.x, sy = pad.leftStick.y;
            if (sy < -0.5) { moveSelection(-cols); navCooldown = 200; }
            else if (sy > 0.5) { moveSelection(cols); navCooldown = 200; }
            else if (sx < -0.5) { moveSelection(-1, true); navCooldown = 200; }
            else if (sx > 0.5) { moveSelection(1, true); navCooldown = 200; }
        };
        this.events.on('update', navPollHandler);

        const closeBtn = this.add.text(W / 2, H - 24, '[ CLOSE ]', {
            fontSize: '13px', fontFamily: 'Arial', color: '#aaaaaa',
            backgroundColor: '#222222', padding: { x: 16, y: 6 },
        }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerover',  () => closeBtn.setColor('#ffffff'));
        closeBtn.on('pointerout',   () => closeBtn.setColor('#aaaaaa'));
        closeBtn.on('pointerdown',  () => closeMenu());
        uiItems.push(closeBtn);

        uiItems.push(this.add.text(W / 2, H - 6, maxScroll > 0
            ? '🎮  D-Pad/LS Navigate   A Pick   B Close   •   RS Scroll'
            : '🎮  D-Pad/LS Navigate   A Pick   B Close', {
            fontSize: '10px', fontFamily: 'Arial', color: '#888888',
        }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5));

        // Scrollbar — a draggable tab on the far right edge, only shown if content overflows
        if (maxScroll > 0) {
            const track = this.add.rectangle(W - 10, viewportTop + trackHeight / 2, 8, trackHeight, 0x000000, 0.35)
                .setScrollFactor(0).setDepth(depth + 3);
            uiItems.push(track);

            const thumbHeight = Math.max(30, trackHeight * (trackHeight / (trackHeight + maxScroll)));
            thumb = this.add.rectangle(W - 10, viewportTop, 14, thumbHeight, 0xffdd55, 0.9)
                .setScrollFactor(0).setDepth(depth + 4).setOrigin(0.5, 0)
                .setInteractive({ useHandCursor: true });
            this.input.setDraggable(thumb);
            uiItems.push(thumb);

            thumb.on('drag', (pointer, dragX, dragY) => {
                const clampedTop = Phaser.Math.Clamp(dragY, viewportTop, viewportBottom - thumb.height);
                const ratio = (clampedTop - viewportTop) / (trackHeight - thumb.height);
                applyScroll(ratio * maxScroll);
            });
        }

        // Right-stick scroll (continuous, scaled by frame delta)
        const scrollUpdateHandler = (_, delta) => {
            if (maxScroll <= 0) return;
            const pad = this.input.gamepad.getPad(0);
            if (!pad) return;
            const ry = pad.rightStick.y;
            if (Math.abs(ry) > 0.2) applyScroll(scrollY + ry * 400 * (delta / 1000));
        };
        this.events.on('update', scrollUpdateHandler);

        // Close on ESC or gamepad B
        const escHandler = (e) => { if (e.key === 'Escape') closeMenu(); };
        this.input.keyboard.on('keydown', escHandler);
        const padHandler = (pad, button) => {
            const idx = button.index;
            if (idx === 1) { closeMenu(); return; }       // B = close
            if (idx === 12) { moveSelection(-cols); return; }        // D-pad up
            if (idx === 13) { moveSelection(cols); return; }         // D-pad down
            if (idx === 14) { moveSelection(-1, true); return; }     // D-pad left
            if (idx === 15) { moveSelection(1, true); return; }      // D-pad right
            if (idx === 0) { confirmSelection(); return; }           // A = pick/confirm
        };
        this.input.gamepad.on('down', padHandler);
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
