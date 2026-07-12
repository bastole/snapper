export const MovementMethods = {

    drawOffscreenArrows() {
        const g   = this.offscreenArrows;
        const cam = this.cameras.main;
        const W   = cam.width;
        const H   = cam.height;
        const pad = 18; // distance from screen edge to arrow tip

        g.clear();

        // Boss arrow — bright pink + larger for The Hand (level 5), purple for others
        if (this.boss?.active) {
            const sx = this.boss.x - cam.scrollX;
            const sy = this.boss.y - cam.scrollY;
            if (sx < 0 || sx > W || sy < 0 || sy > H) {
                const isHand = this.level === 5;
                const color  = isHand ? 0xff44cc : 0xcc44ff;
                const len    = isHand ? 18 : 10;
                const wing   = isHand ? 11 : 6;
                const cx = Phaser.Math.Clamp(sx, pad + 6, W - pad - 6);
                const cy = Phaser.Math.Clamp(sy, pad + 6, H - pad - 6);
                const angle = Math.atan2(sy - cy, sx - cx);
                const tx = cx + Math.cos(angle) * len;
                const ty = cy + Math.sin(angle) * len;
                const lx = cx + Math.cos(angle + Math.PI * 0.75) * wing;
                const ly = cy + Math.sin(angle + Math.PI * 0.75) * wing;
                const rx = cx + Math.cos(angle - Math.PI * 0.75) * wing;
                const ry = cy + Math.sin(angle - Math.PI * 0.75) * wing;
                g.fillStyle(color, 1);
                g.fillTriangle(tx, ty, lx, ly, rx, ry);
                g.lineStyle(isHand ? 2.5 : 1.5, 0x000000, 0.7);
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
                    const cx = Phaser.Math.Clamp(sx, pad + 4, W - pad - 4);
                    const cy = Phaser.Math.Clamp(sy, pad + 4, H - pad - 4);
                    const angle = Math.atan2(sy - cy, sx - cx);
                    const len = 10, wing = 6;
                    const tx = cx + Math.cos(angle) * len;
                    const ty = cy + Math.sin(angle) * len;
                    const lx = cx + Math.cos(angle + Math.PI * 0.75) * wing;
                    const ly = cy + Math.sin(angle + Math.PI * 0.75) * wing;
                    const rx = cx + Math.cos(angle - Math.PI * 0.75) * wing;
                    const ry = cy + Math.sin(angle - Math.PI * 0.75) * wing;
                    g.fillStyle(0xcc44ff, 1);
                    g.fillTriangle(tx, ty, lx, ly, rx, ry);
                    g.lineStyle(1.5, 0x000000, 0.6);
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
            const cx = Phaser.Math.Clamp(sx, pad + 4, W - pad - 4);
            const cy = Phaser.Math.Clamp(sy, pad + 4, H - pad - 4);

            // Angle pointing toward the item from the clamped edge point
            const angle = Math.atan2(sy - cy, sx - cx);

            // Arrow size
            const len  = 10;
            const wing = 6;

            const tx = cx + Math.cos(angle) * len;
            const ty = cy + Math.sin(angle) * len;

            const lx = cx + Math.cos(angle + Math.PI * 0.75) * wing;
            const ly = cy + Math.sin(angle + Math.PI * 0.75) * wing;
            const rx = cx + Math.cos(angle - Math.PI * 0.75) * wing;
            const ry = cy + Math.sin(angle - Math.PI * 0.75) * wing;

            g.fillStyle(color, 1);
            g.fillTriangle(tx, ty, lx, ly, rx, ry);

            // Subtle dark outline
            g.lineStyle(1.5, 0x000000, 0.6);
            g.strokeTriangle(tx, ty, lx, ly, rx, ry);
        });
    },

    // ─── Dubia Shields ───────────────────────────────────────────────────────────
    createDubiaShield(layer = 'single') {
        const shield = this.add.circle(this.player.x, this.player.y, 9, 0xcc7700);
        shield.setStrokeStyle(2, 0x884400);
        shield.setDepth(6);
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

        const defSpeedMult = this._dubiaDefendersActive ? 1.5 : 1.0;
        if (isFinal) {
            this.dubiaAngle      += 1.5 * defSpeedMult * dt;
            this.dubiaOuterAngle -= 1.0 * defSpeedMult * dt;
            const inner = this.dubiaShields.filter(s => s.layer === 'inner');
            const outer = this.dubiaShields.filter(s => s.layer === 'outer');
            inner.forEach((shield, i) => {
                const a = this.dubiaAngle + (i / inner.length) * Math.PI * 2;
                shield.setPosition(this.player.x + Math.cos(a) * 70, this.player.y + Math.sin(a) * 70);
            });
            outer.forEach((shield, i) => {
                const a = this.dubiaOuterAngle + (i / outer.length) * Math.PI * 2;
                shield.setPosition(this.player.x + Math.cos(a) * 120, this.player.y + Math.sin(a) * 120);
            });
        } else {
            const speeds = [1.2, 1.6, 2.0];
            this.dubiaAngle += (speeds[this.dubiaLevel - 1] ?? 1.2) * defSpeedMult * dt;
            this.dubiaShields.forEach((shield, i) => {
                const a = this.dubiaAngle + (i / this.dubiaShields.length) * Math.PI * 2;
                shield.setPosition(this.player.x + Math.cos(a) * 90, this.player.y + Math.sin(a) * 90);
            });
        }

        this.dubiaShields.forEach(shield => {
            this.enemies.getChildren().forEach(enemy => {
                if (!this.canDamageEnemy(enemy)) return;
                const dist = Phaser.Math.Distance.Between(shield.x, shield.y, enemy.x, enemy.y);
                if (dist >= 14) return;
                const lastHit = shield.hitCooldowns.get(enemy) ?? 0;
                if (now - lastHit < 800) return;
                shield.hitCooldowns.set(enemy, now);
                this.damageDealt += this.dubiaShieldDamage;
                enemy.health -= this.dubiaShieldDamage;
                this.tweens.add({ targets: enemy, alpha: 0.3, duration: 60, yoyo: true });
                this.checkHydraPhase(enemy);
                if (enemy.health <= 0) this.killEnemy(enemy);
            });
            if (this.boss?.active) {
                const dist = Phaser.Math.Distance.Between(shield.x, shield.y, this.boss.x, this.boss.y);
                if (dist < 48) {
                    const lastHit = shield.hitCooldowns.get(this.boss) ?? 0;
                    if (now - lastHit >= 800) {
                        shield.hitCooldowns.set(this.boss, now);
                        this.damageBoss(this.dubiaShieldDamage);
                    }
                }
            }
        });
    },

    handleMovement() {
        const speed = this.playerSpeed;
        let vx = 0, vy = 0;
        let usingAnalog = false;

        // Xbox controller: left stick takes priority; fall back to d-pad then keyboard
        const pad = this.input.gamepad.getPad(0);
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
