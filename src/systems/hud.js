import { playSfx, stopBgm, getMusicVolume, getSfxVolume, setMusicVolume, setSfxVolume } from '../audio.js';

export const HudMethods = {

    createUI() {
        const W = this.cameras.main.width;

        // XP bar
        this.xpBarBg = this.add.rectangle(W / 2, 12, W - 40, 16, 0x333333).setScrollFactor(0).setDepth(100);
        this.xpBar   = this.add.rectangle(20, 12, 0, 14, 0x00ff88).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

        // HP bar
        this.add.rectangle(W / 2, 32, W - 40, 10, 0x333333).setScrollFactor(0).setDepth(100);
        this.hpBar = this.add.rectangle(20, 32, W - 40, 8, 0xff3333).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

        // Labels
        this.levelText = this.add.text(W - 10, 4, 'Lv.1', {
            fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
        }).setScrollFactor(0).setDepth(102).setOrigin(1, 0);

        this.timerText = this.add.text(W / 2, 5, '10:00', {
            fontSize: '13px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
        }).setScrollFactor(0).setDepth(102).setOrigin(0.5, 0);

        // Pause button
        this.isPaused = false;
        const pauseBtn = this.add.text(W - 10, 44, '⏸ PAUSE', {
            fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
            backgroundColor: '#333333', padding: { x: 12, y: 10 },
        }).setScrollFactor(0).setDepth(102).setOrigin(1, 0)
          .setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-20, -10, 120, 50), hitAreaCallback: Phaser.Geom.Rectangle.Contains });

        pauseBtn.on('pointerover', () => pauseBtn.setColor('#ffff00'));
        pauseBtn.on('pointerout',  () => pauseBtn.setColor(this._pauseBtnGlowTween ? '#ffdd00' : '#ffffff'));
        pauseBtn.on('pointerdown', () => this.togglePause(pauseBtn));

        // ESC and P also toggle pause (blocked in countdown, level clear, game over, upgrade screen)
        this.input.keyboard.on('keydown-ESC', () => { if (!this.isCountdown && !this.isLevelClear && !this.isGameOver && !this._evoMenuOpen) this.togglePause(pauseBtn); });
        this.input.keyboard.on('keydown-P',   () => { if (!this.isCountdown && !this.isLevelClear && !this.isGameOver && !this._evoMenuOpen) this.togglePause(pauseBtn); });
        this.input.keyboard.on('keydown-U',   () => { if (!this.isPaused) this.showLevelUp(); });
        this.input.keyboard.on('keydown-F',   () => {
            if (this.isPaused || this.isLevelingUp) return;
            if (!this.boss?.active) {
                this.gameTimerEvent.remove();
                this.gameTime = 0;
                this.spawnBoss();
            }
            for (let i = 0; i < 20; i++) {
                const wx = Phaser.Math.Between(100, 3100);
                const wy = Phaser.Math.Between(100, 3100);
                const item = this.physics.add.image(wx, wy, 'foodbox');
                item.setScale(1.10).setDepth(4);
                item.xpValue = 0;
                item.specialType = 'wormbox';
                this.tweens.add({ targets: item, scaleX: 1.30, scaleY: 1.30, duration: 350, yoyo: true, loop: -1 });
                this.crickets.add(item);
            }
            this.fastUpgrade    = true;
            this.pendingLevelUps = 28;
            this.showLevelUp();
        });
        this.input.keyboard.on('keydown-N',   () => {
            if (this.isPaused) return;
            this.gameTime = Math.max(0, this.gameTime - 60);
            // Apply 6 spawn-ramp ticks (one per 10s skipped)
            for (let i = 0; i < 6; i++) {
                if (this.spawnDelay > this.spawnMinDelay) {
                    this.spawnDelay = Math.max(this.spawnMinDelay, Math.floor(this.spawnDelay * 0.85));
                }
            }
            this.spawnTimer.reset({ delay: this.spawnDelay, callback: this.spawnEnemy, callbackScope: this, loop: true });
        });

        this.pauseBtn = pauseBtn;
        this.updatePauseBtnGlow();
    },

    togglePause(btn) {
        if (this.isLevelingUp) return;
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            playSfx(this, 'sfx_pause');
            this.physics.pause();
            this.time.paused = true;
            btn.setVisible(false);

            const W = this.cameras.main.width;
            const H = this.cameras.main.height;
            this.pauseOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setScrollFactor(0).setDepth(150);
            this.pauseLabel   = this.add.text(W / 2, H / 2 - 20, 'PAUSED', {
                fontSize: '48px', fontFamily: 'Arial Black, Arial',
                color: '#ffffff', stroke: '#000000', strokeThickness: 6,
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5);
            this.pauseSubLabel = this.add.text(W / 2, H / 2 + 30, 'PRESS ANY BUTTON TO RESUME', {
                fontSize: '14px', fontFamily: 'Arial', color: '#cccccc',
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5);

            this.pauseStatsLine = this.add.text(W / 2, H / 2 + 60, `Level ${this.playerLevel}   •   Kills: ${this.kills}   •   Damage: ${this.damageDealt}   •   Rerolls: ${this.rerolls}`, {
                fontSize: '13px', fontFamily: 'Arial', color: '#ffff88',
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5);

            const { weaponLine, boostLine } = this.buildLoadoutText();
            this.pauseWeaponLine = this.add.text(W / 2, H / 2 + 85, weaponLine, {
                fontSize: '11px', fontFamily: 'Arial', color: '#aaffaa',
                align: 'center', wordWrap: { width: W - 80 },
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5, 0);
            this.pauseBoostLine = this.add.text(W / 2, H / 2 + 120, boostLine, {
                fontSize: '11px', fontFamily: 'Arial', color: '#aaaaff',
                align: 'center', wordWrap: { width: W - 80 },
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5, 0);

            // EVOLUTIONS and QUIT sit side by side on one row (instead of stacked) so the
            // Boosts line above has room to wrap without running into either button. The
            // row's y is derived from the Boosts line's actual rendered height so a long,
            // wrapped loadout never overlaps it.
            const hasEvo = this.getAvailableEvolutions().length > 0;
            const evoQuitY = Math.min(H - 50, this.pauseBoostLine.y + this.pauseBoostLine.height + 20);
            this._evoBtnText = this.add.text(0, evoQuitY, '✦ EVOLUTIONS ✦', {
                fontSize: '14px', fontFamily: 'Arial Black, Arial',
                color: hasEvo ? '#ffff00' : '#444444',
                backgroundColor: hasEvo ? '#2a2200' : '#111111',
                padding: { x: 18, y: 7 },
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5).setInteractive({ useHandCursor: true });

            if (hasEvo) {
                this._evoFlashTween = this.tweens.add({ targets: this._evoBtnText, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
            }
            this._evoBtnText.on('pointerdown', () => {
                if (this._pauseQuitting) return;
                this._evoMenuOpen = true;
                this.showEvolutionMenu();
            });

            this._pauseQuitting = false;
            this._evoMenuOpen   = false;
            this.pauseQuitBtn = this.add.text(0, evoQuitY, '[ QUIT TO MAIN MENU ]', {
                fontSize: '13px', fontFamily: 'Arial', color: '#ff8888',
                backgroundColor: '#330000', padding: { x: 16, y: 8 },
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5).setInteractive({ useHandCursor: true });
            this.pauseQuitBtn.on('pointerover', () => this.pauseQuitBtn.setColor('#ffffff'));
            this.pauseQuitBtn.on('pointerout',  () => this.pauseQuitBtn.setColor('#ff8888'));
            this.pauseQuitBtn.on('pointerdown', () => {
                this._pauseQuitting = true;
                stopBgm();
                this.scene.start('LevelSelectScene');
            });

            // Lay the pair out side by side, centred as a group, using their actual
            // rendered widths so they never overlap regardless of font metrics.
            const evoQuitGap = 16;
            const evoQuitTotalW = this._evoBtnText.width + evoQuitGap + this.pauseQuitBtn.width;
            const evoQuitStartX = W / 2 - evoQuitTotalW / 2;
            this._evoBtnText.setX(evoQuitStartX + this._evoBtnText.width / 2);
            this.pauseQuitBtn.setX(evoQuitStartX + this._evoBtnText.width + evoQuitGap + this.pauseQuitBtn.width / 2);

            this.pausePadHint = this.add.text(10, H - 10, '🎮  Y  Quit to Menu    X  Evolutions', {
                fontSize: '11px', fontFamily: 'Arial', color: '#666666',
            }).setScrollFactor(0).setDepth(151).setOrigin(0, 1);

            this._pauseSliderSelected = null;
            this._pauseSliderRows     = null;
            this.createVolumeSlider('MUSIC', 20, 70,  getMusicVolume(), setMusicVolume, null, 'music');
            this.createVolumeSlider('SFX',   20, 100, getSfxVolume(),   setSfxVolume, 'sfx_item_collect', 'sfx');

            // Any key resumes (exclude P/ESC which already have their own toggle handlers)
            this.pauseAnyKey = this.input.keyboard.on('keydown', (e) => {
                if (this._evoMenuOpen) return;
                if (this.isPaused && e.key !== 'Escape' && e.key !== 'p' && e.key !== 'P') this.togglePause(btn);
            });
            // Register resume handlers on the next animation frame so the event
            // that triggered pause doesn't immediately re-fire and unpause
            requestAnimationFrame(() => {
                this.input.on('pointerdown', this._pausePointerHandler = () => {
                    if (this._evoMenuOpen || this._sliderInteracting) return;
                    if (this.isPaused && !this._pauseQuitting) this.togglePause(btn);
                });
                this.input.on('pointerup', this._pauseSliderReleaseHandler = () => {
                    this._sliderInteracting = false;
                });
                this.input.gamepad.on('down', this._pauseGamepadHandler = (pad, button) => {
                    if (this._evoMenuOpen) return;
                    // X opens the EVOLUTIONS menu instead of resuming (always openable)
                    if (button.index === 2) { this._evoMenuOpen = true; this.showEvolutionMenu(); return; }
                    // Y quits to the main menu instead of resuming
                    if (button.index === 3) { this.pauseQuitBtn.emit('pointerdown'); return; }
                    // A selects/highlights the SFX slider (first press) instead of resuming
                    if (button.index === 0) {
                        if (!this._pauseSliderSelected) { this._pauseSliderSelected = 'sfx'; this.updatePauseSliderOutline(); }
                        return;
                    }
                    // B un-highlights the selected slider instead of resuming; if nothing
                    // is selected, B falls through to the normal "any button resumes" case
                    if (button.index === 1 && this._pauseSliderSelected) {
                        this._pauseSliderSelected = null;
                        this.updatePauseSliderOutline();
                        return;
                    }
                    // D-pad up/down swaps the highlight between SFX and MUSIC while one is selected
                    if (this._pauseSliderSelected && (button.index === 12 || button.index === 13)) {
                        this._pauseSliderSelected = this._pauseSliderSelected === 'sfx' ? 'music' : 'sfx';
                        this.updatePauseSliderOutline();
                        return;
                    }
                    if (this.isPaused && button.index !== 9 && !this._pauseQuitting) this.togglePause(btn);
                });
                // Left stick up/down swaps the highlight the same way, while a slider is selected
                this._pauseSliderStickCooldown = 0;
                this.events.on('update', this._pauseSliderStickHandler = (_, delta) => {
                    if (!this._pauseSliderSelected) return;
                    this._pauseSliderStickCooldown -= delta;
                    if (this._pauseSliderStickCooldown > 0) return;
                    const pad = this.input.gamepad.getPad(0);
                    if (!pad) return;
                    if (Math.abs(pad.leftStick.y) > 0.5) {
                        this._pauseSliderSelected = this._pauseSliderSelected === 'sfx' ? 'music' : 'sfx';
                        this.updatePauseSliderOutline();
                        this._pauseSliderStickCooldown = 250;
                    }
                });
            });
        } else {
            this.physics.resume();
            this.time.paused = false;
            btn.setText('⏸ PAUSE');
            btn.setVisible(true);
            this.pauseOverlay?.destroy();
            this.pauseLabel?.destroy();
            this.pauseSubLabel?.destroy();
            this.pauseStatsLine?.destroy();
            this.pauseWeaponLine?.destroy();
            this.pauseBoostLine?.destroy();
            this.pauseQuitBtn?.destroy();
            this.pausePadHint?.destroy();
            this._evoBtnText?.destroy(); this._evoBtnText = null;
            if (this._evoFlashTween) { this._evoFlashTween.stop(); this._evoFlashTween = null; }
            this._evoMenuOpen = false;
            this._sliderInteracting = false;
            this.pauseVolumeElements?.forEach(el => el.destroy());
            this.pauseVolumeElements = null;
            this._pauseSliderOutline?.destroy(); this._pauseSliderOutline = null;
            this._pauseSliderSelected = null;
            this._pauseSliderRows     = null;
            this.input.keyboard.off('keydown', this.pauseAnyKey);
            this.input.off('pointerdown', this._pausePointerHandler);
            this.input.off('pointerup', this._pauseSliderReleaseHandler);
            this.input.gamepad.off('down', this._pauseGamepadHandler);
            this.events.off('update', this._pauseSliderStickHandler);
        }
    },

    // Draggable volume slider used in the pause menu (MUSIC/SFX). `onChange` is
    // called with a 0..1 value live as the knob is dragged. `previewSfxKey`, if
    // given, plays a throttled sample so SFX volume changes are audible live.
    // `sliderKey` ('music'/'sfx'), if given, registers this row's bounds so the
    // gamepad selection outline can be positioned over it.
    createVolumeSlider(label, x, y, value, onChange, previewSfxKey = null, sliderKey = null) {
        const trackW = 100;
        const trackX = x + 45;
        let lastPreview = 0;

        const labelText = this.add.text(x, y, label, {
            fontSize: '11px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
        }).setScrollFactor(0).setDepth(151).setOrigin(0, 0.5);

        const track = this.add.rectangle(trackX + trackW / 2, y, trackW, 6, 0x444444)
            .setStrokeStyle(1, 0x888888).setScrollFactor(0).setDepth(151).setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        const valueText = this.add.text(trackX + trackW + 12, y, `${Math.round(value * 100)}`, {
            fontSize: '10px', fontFamily: 'Arial', color: '#aaaaaa',
        }).setScrollFactor(0).setDepth(151).setOrigin(0, 0.5);

        const knob = this.add.circle(trackX + value * trackW, y, 8, 0xffdd00)
            .setStrokeStyle(2, 0x000000).setScrollFactor(0).setDepth(152).setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
        this.input.setDraggable(knob);

        const setFromX = (rawX) => {
            const clampedX = Phaser.Math.Clamp(rawX, trackX, trackX + trackW);
            knob.x = clampedX;
            const v = (clampedX - trackX) / trackW;
            valueText.setText(`${Math.round(v * 100)}`);
            onChange(v);
            if (previewSfxKey && Date.now() - lastPreview > 200) {
                lastPreview = Date.now();
                playSfx(this, previewSfxKey, 0.6);
            }
            return v;
        };

        // Set the flag on pointerdown (fires before the scene-level resume handler,
        // same technique the EVOLUTIONS button uses) so dragging/clicking the slider
        // doesn't also resume the paused game.
        knob.on('pointerdown', () => { this._sliderInteracting = true; });
        knob.on('drag', (pointer, dragX) => setFromX(dragX));

        track.on('pointerdown', (pointer) => {
            this._sliderInteracting = true;
            setFromX(pointer.x);
        });

        if (!this.pauseVolumeElements) this.pauseVolumeElements = [];
        this.pauseVolumeElements.push(labelText, track, valueText, knob);

        if (sliderKey) {
            if (!this._pauseSliderRows) this._pauseSliderRows = {};
            const rowLeft  = labelText.x - 6;
            const rowRight = valueText.x + valueText.width + 6;
            this._pauseSliderRows[sliderKey] = { centerX: (rowLeft + rowRight) / 2, width: rowRight - rowLeft, y };
        }
    },

    // Shows/moves/hides the gamepad selection outline around the currently
    // selected volume slider row (see _pauseSliderSelected).
    updatePauseSliderOutline() {
        const key = this._pauseSliderSelected;
        const row = key ? this._pauseSliderRows?.[key] : null;
        if (!row) {
            this._pauseSliderOutline?.destroy();
            this._pauseSliderOutline = null;
            return;
        }
        if (!this._pauseSliderOutline) {
            this._pauseSliderOutline = this.add.rectangle(row.centerX, row.y, row.width + 6, 22, 0xffffff, 0)
                .setStrokeStyle(2, 0xffffff).setScrollFactor(0).setDepth(153).setOrigin(0.5);
        } else {
            this._pauseSliderOutline.setPosition(row.centerX, row.y);
            this._pauseSliderOutline.setSize(row.width + 6, 22);
            this._pauseSliderOutline.setVisible(true);
        }
    },

    updateXPBar() {
        const W = this.cameras.main.width;
        this.xpBar.width = ((this.xp / this.xpToNext) * (W - 40));
        this.levelText.setText(`Lv.${this.playerLevel}`);
    },

    updateHPBar() {
        const W = this.cameras.main.width;
        this.hpBar.width = Math.max(0, (this.playerHealth / this.playerMaxHealth) * (W - 40));
    },

    // Sets the player on fire — the HP bar turns orange and 3 dmg/500ms ticks until the
    // burn expires. `extraMs` extends (rather than replaces) any time already remaining,
    // so repeatedly standing in a fire source (e.g. the Hand's heat lamp) stacks duration.
    applyPlayerBurn(extraMs) {
        const now = this.time.now;
        this.playerBurnUntil = Math.max(this.playerBurnUntil, now) + extraMs;
        if (this.playerBurning) return;
        this.playerBurning = true;
        this.hpBar.setFillStyle(0xff8800);
        this.playerBurnTimer = this.time.addEvent({
            delay: 500, loop: true,
            callback: () => {
                if (this.time.now >= this.playerBurnUntil) {
                    this.playerBurnTimer.remove();
                    this.playerBurnTimer = null;
                    this.playerBurning = false;
                    this.hpBar.setFillStyle(0xff3333);
                    return;
                }
                if (this.player.reviveInvincible) return;
                this.playerHealth -= 3;
                this.updateHPBar();
                this.playerDamageFlash();
                if (this.playerHealth <= 0) { this.playerHealth = 0; this.showDeathOverlay(); }
            },
        });
    },

};
