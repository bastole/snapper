export const MovementMethods = {

    drawOffscreenArrows() {
        const g   = this.offscreenArrows;
        const cam = this.cameras.main;
        const W   = cam.width;
        const H   = cam.height;
        const pad = 36; // distance from screen edge to arrow tip

        g.clear();

        // Boss arrow — bright pink + larger for The Hand (level 5), purple for others
        if (this.boss?.active) {
            const sx = this.boss.x - cam.scrollX;
            const sy = this.boss.y - cam.scrollY;
            if (sx < 0 || sx > W || sy < 0 || sy > H) {
                const isHand = this.level === 5;
                const color  = isHand ? 0xff44cc : 0xcc44ff;
                const len    = isHand ? 36 : 20;
                const wing   = isHand ? 22 : 12;
                const cx = Phaser.Math.Clamp(sx, pad + 12, W - pad - 12);
                const cy = Phaser.Math.Clamp(sy, pad + 12, H - pad - 12);
                const angle = Math.atan2(sy - cy, sx - cx);
                const tx = cx + Math.cos(angle) * len;
                const ty = cy + Math.sin(angle) * len;
                const lx = cx + Math.cos(angle + Math.PI * 0.75) * wing;
                const ly = cy + Math.sin(angle + Math.PI * 0.75) * wing;
                const rx = cx + Math.cos(angle - Math.PI * 0.75) * wing;
                const ry = cy + Math.sin(angle - Math.PI * 0.75) * wing;
                g.fillStyle(color, 1);
                g.fillTriangle(tx, ty, lx, ly, rx, ry);
                g.lineStyle(isHand ? 5 : 3, 0x000000, 0.7);
                g.strokeTriangle(tx, ty, lx, ly, rx, ry);
            }
        }

        // Mini-boss arrows (purple) during The Hand fight
        if (this.level === 5 && this.handMiniBossArray?.length) {
            this.handMiniBossArray.forEach(mb => {
                if (!mb?.active) return;
                const sx = mb.x - cam.scrollX;
                const sy = mb.y - cam.scrollY;
                if (sx < 0 || sx > W || sy < 0 || sy > H) {
                    const cx = Phaser.Math.Clamp(sx, pad + 8, W - pad - 8);
                    const cy = Phaser.Math.Clamp(sy, pad + 8, H - pad - 8);
                    const angle = Math.atan2(sy - cy, sx - cx);
                    const len = 20, wing = 12;
                    const tx = cx + Math.cos(angle) * len;
                    const ty = cy + Math.sin(angle) * len;
                    const lx = cx + Math.cos(angle + Math.PI * 0.75) * wing;
                    const ly = cy + Math.sin(angle + Math.PI * 0.75) * wing;
                    const rx = cx + Math.cos(angle - Math.PI * 0.75) * wing;
                    const ry = cy + Math.sin(angle - Math.PI * 0.75) * wing;
                    g.fillStyle(0xcc44ff, 1);
                    g.fillTriangle(tx, ty, lx, ly, rx, ry);
                    g.lineStyle(3, 0x000000, 0.6);
                    g.strokeTriangle(tx, ty, lx, ly, rx, ry);
                }
            });
        }

        this.crickets.getChildren().forEach(item => {
            if (!item.active) return;
            const type = item.specialType;
            if (type !== 'treasure' && type !== 'wormbox' && type !== 'fullbox') return;

            // Convert world coords to screen coords
            const sx = item.x - cam.scrollX;
            const sy = item.y - cam.scrollY;

            // Only draw arrow when item is outside the camera view
            if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) return;

            const color = type === 'treasure' ? 0xffd700 : type === 'fullbox' ? 0xff88ff : 0xff4444;

            // Clamp the arrow to the screen edge
            const cx = Phaser.Math.Clamp(sx, pad + 8, W - pad - 8);
            const cy = Phaser.Math.Clamp(sy, pad + 8, H - pad - 8);

            // Angle pointing toward the item from the clamped edge point
            const angle = Math.atan2(sy - cy, sx - cx);

            // Arrow size
            const len  = 20;
            const wing = 12;

            const tx = cx + Math.cos(angle) * len;
            const ty = cy + Math.sin(angle) * len;

            const lx = cx + Math.cos(angle + Math.PI * 0.75) * wing;
            const ly = cy + Math.sin(angle + Math.PI * 0.75) * wing;
            const rx = cx + Math.cos(angle - Math.PI * 0.75) * wing;
            const ry = cy + Math.sin(angle - Math.PI * 0.75) * wing;

            g.fillStyle(color, 1);
            g.fillTriangle(tx, ty, lx, ly, rx, ry);

            // Subtle dark outline
            g.lineStyle(3, 0x000000, 0.6);
            g.strokeTriangle(tx, ty, lx, ly, rx, ry);
        });
    },

    // ─── Dubia Shields ───────────────────────────────────────────────────────────
    createDubiaShield(layer = 'single') {
        const shield = this.add.image(this.player.x, this.player.y, 'dubia_shields');
        shield.setScale(1.12).setDepth(6);
        shield.layer = layer;
        shield.hitCooldowns = new Map();
        this.dubiaShields.push(shield);
        return shield;
    },

    updateDubiaShields() {
        if (this.dubiaLevel === 0) return;
        if (this.isPaused || this.isLevelingUp || this.isCountdown) return;

        const dt  = this.game.loop.delta / 1000;
        const now = this.time.now;
        const isFinal = this.dubiaLevel >= 4;

        const defSpeedMult   = this._dubiaDefendersActive ? 1.5 : 1.0;
        const regularShields = this.dubiaShields.filter(s => s.layer !== 'bonus');
        const bonusShields   = this.dubiaShields.filter(s => s.layer === 'bonus');

        if (isFinal) {
            this.dubiaAngle      += 1.5 * defSpeedMult * dt;
            this.dubiaOuterAngle -= 1.0 * defSpeedMult * dt;
            const inner = regularShields.filter(s => s.layer === 'inner');
            const outer = regularShields.filter(s => s.layer === 'outer');
            inner.forEach((shield, i) => {
                const a = this.dubiaAngle + (i / inner.length) * Math.PI * 2;
                shield.setPosition(this.player.x + Math.cos(a) * 140, this.player.y + Math.sin(a) * 140);
            });
            outer.forEach((shield, i) => {
                const a = this.dubiaOuterAngle + (i / outer.length) * Math.PI * 2;
                shield.setPosition(this.player.x + Math.cos(a) * 240, this.player.y + Math.sin(a) * 240);
            });
        } else {
            const speeds = [1.2, 1.6, 2.0];
            this.dubiaAngle += (speeds[this.dubiaLevel - 1] ?? 1.2) * defSpeedMult * dt;
            regularShields.forEach((shield, i) => {
                const a = this.dubiaAngle + (i / regularShields.length) * Math.PI * 2;
                shield.setPosition(this.player.x + Math.cos(a) * 180, this.player.y + Math.sin(a) * 180);
            });
        }

        // Dubia Defenders: bonus shields (one per 15 kills, see registerDubiaDefenderKill)
        // orbit further out than the regular ring(s), stacked in rings of up to 5, each
        // ring a fixed step further out than the last.
        if (bonusShields.length) {
            const baseRadius = (isFinal ? 240 : 180) + 60;
            this.dubiaBonusAngle += 1.2 * defSpeedMult * dt;
            bonusShields.forEach(shield => {
                const radius = baseRadius + shield.bonusLayer * 50;
                const a = this.dubiaBonusAngle + (shield.bonusSlot / 5) * Math.PI * 2;
                shield.setPosition(this.player.x + Math.cos(a) * radius, this.player.y + Math.sin(a) * radius);
            });
        }

        // Dubia Defenders: every shield (regular and bonus) pulses white-to-red constantly.
        if (this._dubiaDefendersActive) {
            const pulse = (Math.sin(now * 0.005) + 1) / 2;
            const g = Math.round(255 * (1 - pulse));
            const tint = Phaser.Display.Color.GetColor(255, g, g);
            this.dubiaShields.forEach(shield => shield.setTint(tint));
        }

        // Dubia Defenders' contact damage is a flat, fixed value rather than scaling
        // off dubiaShieldDamage (which continues to track Aura Farming picks purely
        // for the pre-evolution Dubia Shields weapon) — see the flat 50/40 values in
        // dubiaDefenderExplosion()/explodeDubiaBonusShield()/updateDubiaDefenderShots()
        // for the same reasoning applied to this weapon's other three attack forms.
        const contactDmg = this._dubiaDefendersActive ? 35 : this.dubiaShieldDamage;

        this.dubiaShields.forEach(shield => {
            this.enemies.getChildren().forEach(enemy => {
                if (!this.canDamageEnemy(enemy)) return;
                const dist = Phaser.Math.Distance.Between(shield.x, shield.y, enemy.x, enemy.y);
                if (dist >= 112) return;
                const lastHit = shield.hitCooldowns.get(enemy) ?? 0;
                if (now - lastHit < 800) return;
                shield.hitCooldowns.set(enemy, now);
                this.damageDealt += contactDmg;
                enemy.health -= contactDmg;
                this.tweens.add({ targets: enemy, alpha: 0.3, duration: 60, yoyo: true });
                this.checkHydraPhase(enemy);
                // Dubia Defenders: every 5th hit on the same enemy (from any shield)
                // triggers a small explosion, emitted by whichever shield is currently
                // closest to it.
                if (this._dubiaDefendersActive) {
                    enemy._dubiaDefenderHits = (enemy._dubiaDefenderHits ?? 0) + 1;
                    if (enemy._dubiaDefenderHits >= 5) {
                        enemy._dubiaDefenderHits = 0;
                        this.dubiaDefenderExplosion(enemy);
                    }
                }
                if (enemy.health <= 0) {
                    if (this._dubiaDefendersActive) this.registerDubiaDefenderKill();
                    this.killEnemy(enemy);
                }
            });
            if (this.boss?.active) {
                const dist = Phaser.Math.Distance.Between(shield.x, shield.y, this.boss.x, this.boss.y);
                if (dist < 384) {
                    const lastHit = shield.hitCooldowns.get(this.boss) ?? 0;
                    if (now - lastHit >= 800) {
                        shield.hitCooldowns.set(this.boss, now);
                        this.damageBoss(contactDmg);
                    }
                }
            }
        });
    },

    // Dubia Defenders: small AOE burst centered on whichever shield is currently
    // nearest the enemy that just took its 5th hit.
    dubiaDefenderExplosion(enemy) {
        let nearestShield = null, nearestDist = Infinity;
        this.dubiaShields.forEach(shield => {
            const d = Phaser.Math.Distance.Between(shield.x, shield.y, enemy.x, enemy.y);
            if (d < nearestDist) { nearestDist = d; nearestShield = shield; }
        });
        if (!nearestShield) return;
        const ex = nearestShield.x, ey = nearestShield.y;
        const radius = 100;
        const dmg = 50; // flat, only ever fires while Dubia Defenders is active

        const expl = this.add.circle(ex, ey, radius, 0xff8800, 0.5).setDepth(15);
        this.tweens.add({ targets: expl, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 250, onComplete: () => expl.destroy() });

        this.enemies.getChildren().forEach(e => {
            if (!this.canDamageEnemy(e)) return;
            if (Phaser.Math.Distance.Between(ex, ey, e.x, e.y) <= radius) {
                this.damageDealt += dmg; e.health -= dmg;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: e, alpha: 0.2, duration: 60, yoyo: true });
                if (e.health <= 0) { this.registerDubiaDefenderKill(); this.killEnemy(e); }
            }
        });
        if (this.boss?.active && Phaser.Math.Distance.Between(ex, ey, this.boss.x, this.boss.y) <= radius) {
            this.damageBoss(dmg);
        }
    },

    // Every 15 enemy kills credited to Dubia Defenders (direct shield contact or its
    // 5-hit-combo/bonus-shield explosions), spawn one more orbiting "bonus" shield on
    // the exterior. Rings hold up to 5 bonus shields each; once a ring is full, the
    // next one starts a new ring further out (see updateDubiaShields' radius formula).
    registerDubiaDefenderKill() {
        this.dubiaDefenderKills++;
        if (this.dubiaDefenderKills % 15 === 0) this.spawnDubiaBonusShield();
    },

    spawnDubiaBonusShield() {
        const shield = this.add.image(this.player.x, this.player.y, 'dubia_shields');
        shield.setScale(1.12).setDepth(6);
        shield.layer = 'bonus';
        shield.hitCooldowns = new Map();
        const idx = this.dubiaBonusShields.length;
        shield.bonusLayer = Math.floor(idx / 5);
        shield.bonusSlot  = idx % 5;
        this.dubiaShields.push(shield);
        this.dubiaBonusShields.push(shield);
        this.time.delayedCall(20000, () => this.explodeDubiaBonusShield(shield));
        return shield;
    },

    // A bonus shield's 20s-fuse detonation: AOE burst at its current position, then it's
    // removed and every remaining bonus shield is re-packed into the earliest ring/slot
    // (so rings never have a gap while a later ring holds shields).
    explodeDubiaBonusShield(shield) {
        if (!shield.active) return;
        const ex = shield.x, ey = shield.y;
        this.dubiaShields = this.dubiaShields.filter(s => s !== shield);
        this.dubiaBonusShields = this.dubiaBonusShields.filter(s => s !== shield);
        shield.destroy();
        this.dubiaBonusShields.forEach((s, i) => { s.bonusLayer = Math.floor(i / 5); s.bonusSlot = i % 5; });

        const radius = 100;
        const dmg = 50; // flat, only ever fires while Dubia Defenders is active
        const expl = this.add.circle(ex, ey, radius, 0xff2222, 0.55).setDepth(15);
        this.tweens.add({ targets: expl, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 250, onComplete: () => expl.destroy() });
        this.enemies.getChildren().forEach(e => {
            if (!this.canDamageEnemy(e)) return;
            if (Phaser.Math.Distance.Between(ex, ey, e.x, e.y) <= radius) {
                this.damageDealt += dmg; e.health -= dmg;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: e, alpha: 0.2, duration: 60, yoyo: true });
                if (e.health <= 0) { this.registerDubiaDefenderKill(); this.killEnemy(e); }
            }
        });
        if (this.boss?.active && Phaser.Math.Distance.Between(ex, ey, this.boss.x, this.boss.y) <= radius) {
            this.damageBoss(dmg);
        }
    },

    // ─── Touch/mouse virtual joystick ──────────────────────────────────────────
    // Dragging anywhere on screen that isn't a button/menu shows a joystick: an
    // outer ring at the drag's starting point, and an inner circle that follows
    // the drag direction, clamped to the ring's border.
    setupTouchJoystick() {
        const OUTER_R = 100;
        const INNER_R = 44;
        const DEAD    = 0.15;

        this.joystickOuter = this.add.circle(0, 0, OUTER_R, 0xffffff, 0.15)
            .setStrokeStyle(6, 0xffffff, 0.5).setScrollFactor(0).setDepth(90).setVisible(false);
        this.joystickInner = this.add.circle(0, 0, INNER_R, 0xffffff, 0.35)
            .setScrollFactor(0).setDepth(91).setVisible(false);

        // Card-picking (isLevelingUp but not yet counting down), the level-clear screen,
        // and the game-over overlay all have full-screen interactive UI the joystick
        // shouldn't fight with, so those still block it outright. Pause and the post-pick
        // countdown are handled specially in startJoystick below instead of being blocked:
        // - During the countdown, handleMovement() already isn't called at all (GameScene's
        //   update() early-returns on isLevelingUp, which stays true for the whole
        //   countdown too), so there's no motion to suppress — letting the joystick start
        //   and track a direction here just "primes" it, so movement begins the instant the
        //   countdown ends instead of needing the player to re-touch the screen.
        // - While paused, touching the joystick should itself immediately unpause and start
        //   moving in one motion rather than needing a separate tap to dismiss pause first.
        const isHardBlocked = () =>
            (this.isLevelingUp && !this.isCountdown) || this.isLevelClear || this.isGameOver;

        const startJoystick = (pointer) => {
            if (this.joystickPointerId !== null) return; // already tracking a finger/click
            if (isHardBlocked()) return;
            if (this.input.hitTestPointer(pointer).length > 0) return; // tapped a button/menu
            if (this.isPaused) {
                this.togglePause(this.pauseBtn);
                if (this.isPaused) return; // still paused (e.g. blocked by the post-open guard)
            }
            this.joystickPointerId = pointer.id;
            this.joystickOrigin.x = pointer.x;
            this.joystickOrigin.y = pointer.y;
            this.joystickOuter.setPosition(pointer.x, pointer.y).setVisible(true);
            this.joystickInner.setPosition(pointer.x, pointer.y).setVisible(true);
            this.joystickActive = true;
            this.joystickVector.x = 0; this.joystickVector.y = 0;
        };

        const updateJoystick = (pointer) => {
            if (!this.joystickActive || pointer.id !== this.joystickPointerId) return;
            const dx = pointer.x - this.joystickOrigin.x;
            const dy = pointer.y - this.joystickOrigin.y;
            const dist  = Math.min(OUTER_R, Math.sqrt(dx * dx + dy * dy));
            const angle = Math.atan2(dy, dx);
            this.joystickInner.setPosition(
                this.joystickOrigin.x + Math.cos(angle) * dist,
                this.joystickOrigin.y + Math.sin(angle) * dist,
            );
            const mag = dist / OUTER_R;
            this.joystickVector.x = mag >= DEAD ? Math.cos(angle) * mag : 0;
            this.joystickVector.y = mag >= DEAD ? Math.sin(angle) * mag : 0;
        };

        const endJoystick = (pointer) => {
            if (pointer.id !== this.joystickPointerId) return;
            this.joystickPointerId = null;
            this.joystickActive = false;
            this.joystickVector.x = 0; this.joystickVector.y = 0;
            this.joystickOuter.setVisible(false);
            this.joystickInner.setVisible(false);
        };

        this.input.on('pointerdown', startJoystick);
        this.input.on('pointermove', updateJoystick);
        this.input.on('pointerup', endJoystick);
    },

    handleMovement() {
        const speed = this.playerSpeed;
        let vx = 0, vy = 0;
        let usingAnalog = false;

        // Xbox controller: left stick takes priority; fall back to d-pad then keyboard.
        // Uses pad1 (first pad to ever connect, by connection order) rather than
        // getPad(0) (which matches the browser's native gamepad index) — some
        // browsers/OS combos assign a real controller a non-zero native index, which
        // made getPad(0) silently return nothing forever while button events (not
        // index-gated) kept working fine.
        const pad = this.input.gamepad.pad1;
        if (pad) {
            const sx = pad.leftStick.x;
            const sy = pad.leftStick.y;
            const DEAD = 0.15;
            if (Math.abs(sx) > DEAD || Math.abs(sy) > DEAD) {
                const mag = Math.min(1, Math.sqrt(sx * sx + sy * sy));
                vx = sx * speed * mag;
                vy = sy * speed * mag;
                usingAnalog = true;
            } else {
                // D-pad buttons: up=12, down=13, left=14, right=15
                if (pad.buttons[14]?.pressed) vx = -speed;
                if (pad.buttons[15]?.pressed) vx =  speed;
                if (pad.buttons[12]?.pressed) vy = -speed;
                if (pad.buttons[13]?.pressed) vy =  speed;
            }
        }

        // Touch/mouse virtual joystick — same priority as the analog stick, and
        // already circularly normalised so no diagonal renormalisation is needed
        if (!usingAnalog && vx === 0 && vy === 0 && this.joystickActive) {
            vx = this.joystickVector.x * speed;
            vy = this.joystickVector.y * speed;
            usingAnalog = true;
        }

        if (!usingAnalog && vx === 0 && vy === 0) {
            // Keyboard fallback
            if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -speed;
            if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  speed;
            if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -speed;
            if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy =  speed;
        }

        // Normalise diagonal for d-pad and keyboard (analog stick already has natural magnitude)
        if (!usingAnalog && vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

        // Analog stick or d-pad movement while paused counts as "any input" → unpause
        // (unless the Evolutions menu is open, which uses the same stick/d-pad for its
        // own card navigation, or a volume slider is selected and using the stick/d-pad
        // to swap between SFX/MUSIC — neither should also resume the game underneath)
        if (this.isPaused && !this._evoMenuOpen && !this._pauseSliderSelected && (vx !== 0 || vy !== 0)) {
            this.togglePause(this.pauseBtn);
            return;
        }

        this.player.setVelocity(vx, vy);
        const frozen = this.isPaused || this.isCountdown || this.isLevelingUp || this.isLevelClear;
        if (!frozen) {
            if (vx !== 0 || vy !== 0) this.lastMoveAngle = Math.atan2(vy, vx);
            if (vx < 0) this.player.setFlipX(true);
            else if (vx > 0) this.player.setFlipX(false);
        }
    },

};
