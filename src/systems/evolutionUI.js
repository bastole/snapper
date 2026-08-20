import { playSfx } from '../audio.js';
import { getProgressIndex, recordEvolution } from '../progressIndex.js';
import { registerGamepadHint } from '../inputMode.js';
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
        recordEvolution(ev.id);
        ev.effect.call(this);
        this.evolutionsAppliedCount++;
        this.updateScore();
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
        const titleBaseY = 60;
        const title = this.add.text(W / 2, titleBaseY, 'EVOLUTIONS', {
            fontSize: '56px', fontFamily: 'Arial Black, Arial', color: '#ffff00',
            stroke: '#000000', strokeThickness: 10,
        }).setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5);
        const persistentItems = [overlay, title];

        // Two "screens" share this menu: the grid (browse all evolutions) and the
        // zoom (a single evolution blown up, with prev/next arrows + an UNLOCK? button).
        // Only one is ever on screen; `modeItems` holds whichever is currently built so
        // switching between them just tears down and rebuilds that half.
        let mode = 'grid'; // 'grid' | 'zoom'
        let modeItems = [];
        let zoomIdx = 0;
        // True for the 1500ms shake between pressing UNLOCK? and the evolution actually
        // landing — navigation is locked out so the animation can't be interrupted.
        let unlocking = false;
        let currentUnlockTrigger = null; // set by buildZoom(), used by the gamepad A handler

        // Nothing can be selected for 500ms after this menu opens — neither zooming into
        // a card from the grid (openZoom, below) nor pressing UNLOCK? once zoomed in — so
        // a reflexive click/press right as it appears can't blow past either unread.
        // Uses setTimeout rather than this.time.delayedCall since this menu only opens
        // from the pause menu (this.time.paused = true), same reasoning as the shake
        // tween above and the level-up screen's own 1000ms card-selection gate.
        let selectionReady = false;
        setTimeout(() => { selectionReady = true; }, 500);
        const destroyModeItems = () => { modeItems.forEach(o => o.destroy()); modeItems = []; };

        // Closes this menu (any method) without letting the same input also fall through
        // to the pause menu's "any input resumes" handlers.
        const closeMenu = () => {
            destroyModeItems();
            persistentItems.forEach(o => o.destroy());
            this.input.keyboard.off('keydown', keyHandler);
            this.input.gamepad.off('down', padHandler);
            this.input.off('pointerdown', gridDragStart);
            this.input.off('pointermove', gridDragMove);
            this.input.off('pointerup', gridDragEnd);
            this.events.off('update', scrollUpdateHandler);
            this.events.off('update', navPollHandler);
            // Blocks the pause menu's "any input resumes" handlers for a moment so the
            // click/press that closed this menu (or one shortly after) can't also
            // immediately unpause the game underneath it.
            this.lockPauseResume();
            requestAnimationFrame(() => { this._evoMenuOpen = false; });
        };

        // Shared so both mouse clicks and gamepad A (from the zoom screen) can unlock.
        // Stays on the same evolution's zoomed-in view afterward (rebuilt to show the
        // now-acquired "✓ EVOLVED" state) instead of closing the whole menu.
        const acquireEvolution = (ev) => {
            if (this._evoFlashTween) { this._evoFlashTween.stop(); this._evoFlashTween = null; }
            this.applyEvolution(ev);
            this._updateEvoBtnAppearance();
            buildZoom();
        };

        // ─── Grid screen ────────────────────────────────────────────────────────
        const cardW = 400, cardH = 184, cols = 3;
        const startX = W / 2 - (cols - 1) * (cardW + 24) / 2;
        const startY = 150;

        // Scrollable viewport — below the title, above the CLOSE button/hint.
        // Cards beyond this range are reachable by dragging the tab on the right
        // edge, the right stick, or (if ever needed) a mouse wheel.
        const viewportTop    = 124;
        const viewportBottom = H - 84;
        const trackHeight    = viewportBottom - viewportTop;
        const rows           = Math.max(1, Math.ceil(evos.length / cols));
        const contentBottom  = startY + (rows - 1) * (cardH + 24) + cardH;
        const maxScroll       = Math.max(0, contentBottom - viewportBottom);
        let scrollY = 0;
        let thumb   = null;
        let scrollables = []; // { obj, baseY }
        let cardRefs = [];    // { ev, i, cx, baseY } — for gamepad grid navigation
        let selectedIdx = 0;
        let selectionOutline = null;
        let thumbInteracting = false; // set by the thumb's own pointerdown, mirrors hud.js's _sliderInteracting

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
            // The title scrolls along with the grid (so it never sits underneath cards
            // passing over it — see the zoom-mode reset below), while CLOSE/the gamepad
            // hint stay fixed at the bottom, outside this scrollables list entirely.
            scrollY = 0; thumb = null; scrollables = [{ obj: title, baseY: titleBaseY }]; cardRefs = [];
            const available = this.getAvailableEvolutions();

            evos.forEach((ev, i) => {
                const isAcquired = this.appliedEvolutions.has(ev.id);
                const isAvail = !isAcquired && available.includes(ev);
                // The name/description "???" mystery only applies to an evolution never
                // seen in ANY past playthrough — once it's been acquired at least once,
                // ever, it stays revealed here even in a fresh run that hasn't re-earned
                // it yet. The white "EVOLVED"/owned styling below stays tied to isAcquired
                // (this run) only, since that reflects whether it's actually active now.
                const everAcquired = isAcquired || !!getProgressIndex().evolutions[ev.id];
                // Known-but-not-active: seen in a past run (name/desc revealed) but not
                // currently owned or available this run — needs its own readable colour
                // tier, distinct from the near-invisible dimming used for genuine "???"
                // mystery cards, since that dimming would make the now-visible text unreadable.
                const isKnownOnly = everAcquired && !isAcquired && !isAvail;
                const col = i % cols;
                const row = Math.floor(i / cols);
                const cx = startX + col * (cardW + 24);
                const cy = startY + row * (cardH + 24);

                const bgColor     = isAcquired ? 0xffffff : (isAvail ? 0x3a3000 : (isKnownOnly ? 0x22223a : 0x1a1a1a));
                const borderColor = isAcquired ? 0x000000 : (isAvail ? 0xffee00 : (isKnownOnly ? 0x7777bb : 0x444444));
                const nameColor   = isAcquired ? '#000000' : (isAvail ? '#ffff44' : (isKnownOnly ? '#aaaaee' : '#555555'));
                const recipeColor = isAcquired ? '#000000' : (isAvail ? '#aaaaaa' : (isKnownOnly ? '#9999cc' : '#333333'));
                const descColor   = isAcquired ? '#000000' : (isAvail ? '#cccccc' : (isKnownOnly ? '#ccccee' : '#2a2a2a'));
                const hoverColor  = isAcquired ? bgColor : (isAvail ? 0x554400 : (isKnownOnly ? 0x33335a : 0x2a2a2a));

                const bg = this.add.rectangle(cx, cy, cardW, cardH, bgColor, 1)
                    .setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5, 0);
                const border = this.add.rectangle(cx, cy, cardW, cardH)
                    .setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5, 0)
                    .setStrokeStyle(4, borderColor);

                // Name and description stay hidden (as "???") until the evolution has
                // been acquired at least once, ever; requirements are always shown.
                const nameText = this.add.text(cx, cy + 20, everAcquired ? ev.evolvedName : '???', {
                    fontSize: '24px', fontFamily: 'Arial Black, Arial',
                    color: nameColor,
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5, 0);
                const recipeText = this.add.text(cx, cy + 60, isAcquired ? '✓ EVOLVED' : `Requires: ${ev.weaponLabel} maxed + ${ev.boostName}`, {
                    fontSize: '18px', fontFamily: 'Arial', color: recipeColor,
                    wordWrap: { width: cardW - 24 }, align: 'center',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5, 0);
                const descText = this.add.text(cx, cy + 116, everAcquired ? ev.desc : '???', {
                    fontSize: '18px', fontFamily: everAcquired ? 'Arial' : 'Arial Black, Arial', color: descColor,
                    wordWrap: { width: cardW - 24 }, align: 'center',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5, 0);

                modeItems.push(bg, border, nameText, recipeText, descText);
                scrollables.push(
                    { obj: bg,         baseY: cy },
                    { obj: border,     baseY: cy },
                    { obj: nameText,   baseY: cy + 20 },
                    { obj: recipeText, baseY: cy + 60 },
                    { obj: descText,   baseY: cy + 116 },
                );
                cardRefs.push({ ev, i, cx, baseY: cy });

                // Pressing any card (locked, available, or already-evolved) zooms in on it.
                bg.setInteractive({ useHandCursor: true });
                bg.on('pointerover', () => bg.setFillStyle(hoverColor));
                bg.on('pointerout',  () => bg.setFillStyle(bgColor));
                // Fires on release, and only counts as a tap (not the start of a scroll
                // drag) if the pointer didn't move far — lets a touch/mouse-drag that
                // starts on a card scroll the grid (see gridDragStart/Move below) instead
                // of always opening whatever card the drag happened to start on.
                bg.on('pointerup', (pointer) => {
                    if (Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.x, pointer.y) < 12) openZoom(i);
                });
                if (isAvail) {
                    this.tweens.add({ targets: [bg, border], alpha: 0.6, duration: 500, yoyo: true, repeat: -1 });
                }
            });

            // ─── Controller navigation — same scheme as Level Select: D-pad/stick moves
            // a white box outline, A zooms in on whatever it's on ─────────────────────
            selectionOutline = this.add.rectangle(0, 0, cardW + 12, cardH + 12, 0xffffff, 0)
                .setStrokeStyle(6, 0xffffff).setScrollFactor(0).setDepth(depth + 6).setOrigin(0.5).setVisible(false);
            modeItems.push(selectionOutline);
            if (selectedIdx >= cardRefs.length) selectedIdx = 0;
            positionSelectionOutline();

            const closeBtn = this.add.text(W / 2, H - 48, '[ CLOSE ]', {
                fontSize: '26px', fontFamily: 'Arial', color: '#aaaaaa',
                backgroundColor: '#222222', padding: { x: 32, y: 12 },
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            closeBtn.on('pointerover',  () => closeBtn.setColor('#ffffff'));
            closeBtn.on('pointerout',   () => closeBtn.setColor('#aaaaaa'));
            closeBtn.on('pointerdown',  () => closeMenu());
            modeItems.push(closeBtn);

            modeItems.push(registerGamepadHint(this.add.text(W / 2, H - 12, maxScroll > 0
                ? '🎮  D-Pad/LS Navigate   A Zoom In   B Close   •   RS Scroll'
                : '🎮  D-Pad/LS Navigate   A Zoom In   B Close', {
                fontSize: '20px', fontFamily: 'Arial', color: '#888888',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5)));

            // Scrollbar — a draggable tab on the far right edge, only shown if content overflows
            if (maxScroll > 0) {
                const track = this.add.rectangle(W - 20, viewportTop + trackHeight / 2, 16, trackHeight, 0x000000, 0.35)
                    .setScrollFactor(0).setDepth(depth + 3);
                modeItems.push(track);

                const thumbHeight = Math.max(60, trackHeight * (trackHeight / (trackHeight + maxScroll)));
                thumb = this.add.rectangle(W - 20, viewportTop, 28, thumbHeight, 0xffdd55, 0.9)
                    .setScrollFactor(0).setDepth(depth + 4).setOrigin(0.5, 0)
                    .setInteractive({ useHandCursor: true });
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

            applyScroll(scrollY);
        };

        // ─── Zoom screen — one evolution blown up, with prev/next arrows and an
        // UNLOCK? button that's only live when the evolution is actually available ──
        const zoomCx = W / 2, zoomCy = 300, zoomCardW = 960, zoomCardH = 400;

        const openZoom = (i) => { if (unlocking || !selectionReady) return; zoomIdx = i; buildZoom(); };
        const zoomStep = (delta) => { if (unlocking) return; zoomIdx = (zoomIdx + delta + evos.length) % evos.length; buildZoom(); };
        const backToGrid = () => { if (unlocking) return; selectedIdx = zoomIdx; buildGrid(); };

        const buildZoom = () => {
            mode = 'zoom';
            destroyModeItems();
            currentUnlockTrigger = null;
            title.y = titleBaseY; // grid scroll may have moved it; zoom always shows it at rest
            const ev = evos[zoomIdx];
            const isAcquired = this.appliedEvolutions.has(ev.id);
            const isAvail = !isAcquired && this.getAvailableEvolutions().includes(ev);
            const everAcquired = isAcquired || !!getProgressIndex().evolutions[ev.id];
            const borderColor = isAcquired ? 0x000000 : (isAvail ? 0xffee00 : 0x444444);
            const bgColor   = isAcquired ? 0xffffff : 0x1a1a1a;
            const textColor = isAcquired ? '#000000' : '#dddddd';

            const bg = this.add.rectangle(zoomCx, zoomCy, zoomCardW, zoomCardH, bgColor, 1)
                .setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5);
            const border = this.add.rectangle(zoomCx, zoomCy, zoomCardW, zoomCardH)
                .setScrollFactor(0).setDepth(depth + 1).setOrigin(0.5).setStrokeStyle(3, borderColor);
            // Name stays hidden (as "???") only for an evolution never acquired in any
            // past playthrough — colours here were already readable in every state, so
            // revealing the text needs no colour changes, unlike the grid.
            const nameText = this.add.text(zoomCx, zoomCy - 156, everAcquired ? ev.evolvedName : '???', {
                fontSize: '40px', fontFamily: 'Arial Black, Arial', color: isAcquired ? '#000000' : '#ffff44',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
            modeItems.push(bg, border, nameText);

            // The "box" that shakes on unlock — bg/border/name/desc plus whichever
            // status line(s) sit above the description.
            const shakeTargets = [bg, border, nameText];

            // Requirements/EVOLVED status sits right below the name; the description
            // follows directly under that, so its vertical start depends on how many
            // status lines came before it (one for EVOLVED, two for weapon/boost).
            let descY;
            if (isAcquired) {
                const evolvedText = this.add.text(zoomCx, zoomCy - 60, '✓ EVOLVED', {
                    fontSize: '26px', fontFamily: 'Arial Black, Arial', color: '#008800',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
                modeItems.push(evolvedText);
                shakeTargets.push(evolvedText);
                descY = zoomCy + 20;
            } else {
                const { weaponLine, boostLine } = this._getEvoReqLines(ev);
                const weaponText = this.add.text(zoomCx, zoomCy - 80, weaponLine, {
                    fontSize: '22px', fontFamily: 'Arial', color: weaponLine.startsWith('✓') ? '#88ff88' : '#ff8888',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
                const boostText = this.add.text(zoomCx, zoomCy - 40, boostLine, {
                    fontSize: '22px', fontFamily: 'Arial', color: boostLine.startsWith('✓') ? '#88ff88' : '#ff8888',
                }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
                modeItems.push(weaponText, boostText);
                shakeTargets.push(weaponText, boostText);
                descY = zoomCy + 40;
            }

            const descText = this.add.text(zoomCx, descY, everAcquired ? ev.desc : '???', {
                fontSize: '24px', fontFamily: everAcquired ? 'Arial' : 'Arial Black, Arial', color: textColor,
                wordWrap: { width: zoomCardW - 120 }, align: 'center',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
            modeItems.push(descText);
            shakeTargets.push(descText);

            // Prev/next arrows — cycle through every evolution, wrapping at the ends
            const arrowLeft = this.add.text(zoomCx - zoomCardW / 2 - 60, zoomCy, '◀', {
                fontSize: '56px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            const arrowRight = this.add.text(zoomCx + zoomCardW / 2 + 60, zoomCy, '▶', {
                fontSize: '56px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
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
            const unlockY = zoomCy + zoomCardH / 2 + 68;
            const unlockBtn = this.add.text(zoomCx, unlockY, isAcquired ? '✓ EVOLVED' : 'UNLOCK?', {
                fontSize: '30px', fontFamily: 'Arial Black, Arial',
                color: isAvail ? '#003300' : '#777777',
                backgroundColor: isAvail ? '#ffee00' : '#2a2a2a',
                padding: { x: 40, y: 16 },
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5);
            modeItems.push(unlockBtn);
            if (isAvail) {
                unlockBtn.setInteractive({ useHandCursor: true });
                unlockBtn.on('pointerover', () => unlockBtn.setBackgroundColor('#ffff88'));
                unlockBtn.on('pointerout',  () => unlockBtn.setBackgroundColor('#ffee00'));
                const pulseTween = this.tweens.add({ targets: unlockBtn, alpha: 0.6, duration: 500, yoyo: true, repeat: -1 });

                // Pressing UNLOCK? shakes the info box with growing intensity for 1500ms
                // before the evolution actually lands and the "???" are revealed. Driven
                // by a tween rather than this.time.addEvent/delayedCall — the evolutions
                // menu only opens from the pause menu (time.paused = true), and Phaser's
                // Clock-based timers never advance while that's set, which would leave
                // the shake permanently stuck (same gotcha the level-up 3-2-1 countdown
                // hit before). Tweens aren't gated by time.paused — that's already why
                // this button's own idle pulse tween works while paused — so the shake
                // uses a value-only counter tween instead.
                const triggerUnlock = () => {
                    if (unlocking || !selectionReady) return;
                    unlocking = true;
                    pulseTween.stop();
                    unlockBtn.disableInteractive();
                    unlockBtn.setAlpha(1).setBackgroundColor('#2a2a2a').setColor('#777777');

                    const shakeBase = shakeTargets.map(o => ({ obj: o, x: o.x, y: o.y }));
                    this.tweens.addCounter({
                        from: 0, to: 1, duration: 1500, ease: 'Linear',
                        onUpdate: (tw) => {
                            const amp = 10 * tw.getValue();
                            shakeBase.forEach(({ obj, x, y }) => {
                                if (!obj.active) return;
                                obj.x = x + Phaser.Math.Between(-amp, amp);
                                obj.y = y + Phaser.Math.Between(-amp, amp);
                            });
                        },
                        onComplete: () => {
                            shakeBase.forEach(({ obj, x, y }) => { if (obj.active) { obj.x = x; obj.y = y; } });
                            unlocking = false;
                            acquireEvolution(ev);
                        },
                    });

                    // Screen brightens to full white in step with the shake (0-1500ms),
                    // holds white for 1000ms after the shake ends (1500-2500ms), then
                    // fades back to normal over a final 1000ms (2500-3500ms). Both legs
                    // are separate tweens timed via duration/delay so they run correctly
                    // regardless of time.paused, same as the shake above.
                    const flashOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 1)
                        .setAlpha(0).setScrollFactor(0).setDepth(250);
                    persistentItems.push(flashOverlay);
                    this.tweens.add({ targets: flashOverlay, alpha: 1, duration: 1500, ease: 'Linear' });
                    this.tweens.add({
                        targets: flashOverlay, alpha: 0, duration: 1000, delay: 2500, ease: 'Linear',
                        onComplete: () => flashOverlay.destroy(),
                    });
                };
                unlockBtn.on('pointerdown', triggerUnlock);
                currentUnlockTrigger = triggerUnlock;
            }

            const backBtn = this.add.text(W / 2, H - 48, '[ BACK ]', {
                fontSize: '26px', fontFamily: 'Arial', color: '#aaaaaa',
                backgroundColor: '#222222', padding: { x: 32, y: 12 },
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5).setInteractive({ useHandCursor: true });
            backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
            backBtn.on('pointerout',  () => backBtn.setColor('#aaaaaa'));
            backBtn.on('pointerdown', () => backToGrid());
            modeItems.push(backBtn);

            modeItems.push(registerGamepadHint(this.add.text(W / 2, H - 12, '🎮  ◀ / ▶ or LB / RB  Switch    A  Unlock    B  Back', {
                fontSize: '20px', fontFamily: 'Arial', color: '#888888',
            }).setScrollFactor(0).setDepth(depth + 2).setOrigin(0.5)));
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
                if (idx === 0) { currentUnlockTrigger?.(); return; }         // A = unlock, if available
            }
        };
        this.input.gamepad.on('down', padHandler);

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
                // Big radiating golden pulse ring, once immediately and then every 5s for as
                // long as an evolution stays available.
                this.spawnPauseBtnPulse();
                this._pauseBtnPulseTimer = this.time.addEvent({ delay: 5000, loop: true, callback: this.spawnPauseBtnPulse, callbackScope: this });
            }
        } else if (this._pauseBtnGlowTween) {
            this._pauseBtnGlowTween.stop(); this._pauseBtnGlowTween = null;
            this.pauseBtn.setAlpha(1);
            this.pauseBtn.setColor('#ffffff');
            this._pauseBtnPulseTimer?.remove(); this._pauseBtnPulseTimer = null;
        }
    },

    // A single expanding, fading gold ring centred on the pause button — drawn at local
    // (0, 0) and positioned via setPosition so it scales in place around its own center
    // (the same fix already applied to every other AOE ring in this codebase, e.g. Cold
    // Glare/Four Chills/Poop/Toxic Ocean, rather than drifting from a stale local offset).
    spawnPauseBtnPulse() {
        if (!this.pauseBtn) return;
        const b = this.pauseBtn.getBounds();
        const ring = this.add.graphics().setScrollFactor(0).setDepth(101).setPosition(b.centerX, b.centerY);
        ring.lineStyle(8, 0xffdd00, 0.9);
        ring.strokeCircle(0, 0, 32);
        this.tweens.add({
            targets: ring, scaleX: 5, scaleY: 5, alpha: 0, duration: 900, ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy(),
        });
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
