export const EvolutionMethods = {

    // ─── Evolution apply methods ──────────────────────────────────────────────

    evolveToStarvedChomp() {
        this.starvedChompActive = true;
        this.ownedWeapons.delete('bite'); this.ownedWeapons.add('starvechomp');
        this.biteDamage += 20; this.biteRange += 30;
        this.biteTimer.reset({ delay: this.biteRate, callback: this.doStarvedChomp, callbackScope: this, loop: true });
    },

    evolveToSteelSlam() {
        this.ownedWeapons.delete('tailslap'); this.ownedWeapons.add('steelslam');
        this.tailSlapDamage = Math.round(this.tailSlapDamage * 1.8);
        this.tailSlapTimer.reset({ delay: this.tailSlapTimer.delay, callback: this.doSteelSlam, callbackScope: this, loop: true });
    },

    evolveToToxicOcean() {
        this.ownedWeapons.delete('poop'); this.ownedWeapons.add('toxicocean');
        this.poopDamage = Math.round(this.poopDamage * 1.5);
        this.poopTimer.reset({ delay: this.poopTimer.delay, callback: this.doToxicOcean, callbackScope: this, loop: true });
    },

    evolveToSunbakedAmbers() {
        this.ownedWeapons.delete('pebble'); this.ownedWeapons.add('sunbakedambers');
        if (this.pebbleTimer) this.pebbleTimer.reset({ delay: 8000, callback: this.doSunbakedAmbers, callbackScope: this, loop: true });
    },

    evolveToRagingRoar() {
        this.ownedWeapons.delete('hiss'); this.ownedWeapons.add('ragingroar');
        if (this.hissTimer) { this.hissTimer.remove(); this.hissTimer = null; }
        // Raging Roar runs in the update loop — no timer needed
    },

    evolveToStickyShot() {
        this.ownedWeapons.delete('lick'); this.ownedWeapons.add('stickyshot');
        this.lickDamage = Math.round(this.lickDamage * 1.5);
        this.lickTimer.reset({ delay: 1500, callback: this.doStickyShot, callbackScope: this, loop: true });
    },

    evolveToAcidSnake() {
        this.ownedWeapons.delete('wormwhip'); this.ownedWeapons.add('acidsnake');
        this.wormWhipDamage = Math.round(this.wormWhipDamage * 1.5);
        this.wormWhipTimer.reset({ delay: 3500, callback: this.doAcidSnake, callbackScope: this, loop: true });
    },

    evolveToBugBuster() {
        this.ownedWeapons.delete('pupamines'); this.ownedWeapons.add('bugbuster');
        this.pupaTimer.reset({ delay: this.pupaTimer.delay, callback: this.doBugBuster, callbackScope: this, loop: true });
    },

    evolveToSpikeShedder() {
        this.ownedWeapons.delete('skinshed'); this.ownedWeapons.add('spikeshedder');
        this.skinDamage = Math.round(this.skinDamage * 2.5);
        this.skinTimer.reset({ delay: 8000, callback: this.doSpikeShedder, callbackScope: this, loop: true });
    },

    evolveToShiningShells() {
        this.ownedWeapons.delete('woodiebounce'); this.ownedWeapons.add('shiningshells');
        this.woodieDamage = Math.round(this.woodieDamage * 2.5);
        this.woodieTimer.reset({ delay: 4000, callback: this.doShiningShells, callbackScope: this, loop: true });
    },

    evolveToDubiaDefenders() {
        this.ownedWeapons.delete('dubiashields'); this.ownedWeapons.add('dubiadefenders');
        this.dubiaShieldDamage += 20;
        // Shields spin 1.5× faster — done by multiplying dubiaAngle increment in updateDubiaShields
        this._dubiaDefendersActive = true;
    },

    evolveToFlashclaw() {
        this.ownedWeapons.delete('poisonclaw'); this.ownedWeapons.add('flashclaw');
        this.poisonClawTimer.reset({ delay: this.poisonClawTimer.delay, callback: this.doFlashclaw, callbackScope: this, loop: true });
    },

    evolveToLogLob() {
        this.ownedWeapons.delete('branchthrow'); this.ownedWeapons.add('loglob');
        this.branchTimer.reset({ delay: this.branchTimer.delay, callback: this.doLogLob, callbackScope: this, loop: true });
    },

    evolveToDuststorm() {
        this.ownedWeapons.delete('dustkick'); this.ownedWeapons.add('duststorm');
        this.dustKickTimer.reset({ delay: this.dustKickTimer.delay, callback: this.doDuststorm, callbackScope: this, loop: true });
    },

    evolveToLuckyThrash() {
        this.ownedWeapons.delete('scratch'); this.ownedWeapons.add('thrash');
        this.scratchTimer.reset({ delay: this.scratchTimer.delay, callback: this.doLuckyThrash, callbackScope: this, loop: true });
    },

    evolveToFourChills() {
        this.ownedWeapons.delete('coldglare'); this.ownedWeapons.add('fourchills');
        // Stop the cold glare schedule — Four Chills uses its own cooldown
        this.coldGlareTimer?.remove();
        this.coldGlareActive = false;
        this.fourChillsTimer = this.time.addEvent({ delay: 25000, callback: this.doFourChills, callbackScope: this, loop: true });
    },

    // ─── Evolved weapon: Starved Chomp ────────────────────────────────────────
    doStarvedChomp() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
            if (dist <= this.biteRange && this.canDamageEnemy(enemy)) {
                this.damageDealt += this.biteDamage; enemy.health -= this.biteDamage;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                this.maybeVenom(enemy);
                if (this.biteLevel >= 4 && !enemy.slowed) {
                    enemy.slowed = true; enemy.speed = Math.max(10, enemy.speed * 0.5); enemy.setTint(0xaaddff);
                    this.time.delayedCall(2000, () => { if (enemy.active) { enemy.slowed = false; enemy.speed *= 2; enemy.clearTint(); } });
                }
                this.checkHydraPhase(enemy);
                if (enemy.health <= 0) { enemy._killedByStarvedChomp = true; this.killEnemy(enemy); }
            }
        });
        if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= this.biteRange) {
            this.damageBoss(this.biteDamage);
            this.maybeVenomBoss();
            if (this.biteLevel >= 4) this.slowBoss(2000, 0.5, 0xaaddff);
        }
        const circle = this.add.circle(px, py, this.biteRange, 0x88ff44, 0.18).setDepth(20);
        this.tweens.add({ targets: circle, alpha: 0, duration: 200, onComplete: () => circle.destroy() });
        this.maybePolycephaly(() => this.doStarvedChomp());
    },

    // ─── Evolved weapon: Steel Slam ───────────────────────────────────────────
    doSteelSlam() {
        if (this.isPaused || this.isCountdown) return;
        const angle = (this.lastMoveAngle ?? 0) + Math.PI;
        const arc   = Math.PI; // 180°
        const now   = this.time.now;
        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist > this.tailSlapRange) return;
            const toEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
            if (Math.abs(Phaser.Math.Angle.Wrap(toEnemy - angle)) <= arc / 2 && this.canDamageEnemy(enemy)) {
                this.damageDealt += this.tailSlapDamage; enemy.health -= this.tailSlapDamage; this.checkHydraPhase(enemy);
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                // Knockback
                const a = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
                this.applyKnockback(enemy, a, 400);
                // Immobilise (500ms, 8s cooldown per enemy)
                const lastSlam = enemy._lastSteelSlam ?? 0;
                if (now - lastSlam >= 8000 && !enemy.bugCaught) {
                    enemy._lastSteelSlam = now;
                    enemy.bugCaught = true;
                    this.time.delayedCall(500, () => { if (enemy.active) enemy.bugCaught = false; });
                }
                if (enemy.health <= 0) this.killEnemy(enemy);
            }
        });
        if (this.boss?.active) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
            const toB = Math.atan2(this.boss.y - this.player.y, this.boss.x - this.player.x);
            if (dist <= this.tailSlapRange && Math.abs(Phaser.Math.Angle.Wrap(toB - angle)) <= arc / 2) {
                this.damageBoss(this.tailSlapDamage);
                this.immobilizeBoss(500);
            }
        }
        const g = this.add.graphics().setDepth(20);
        g.lineStyle(3, 0xaaaaaa, 0.8); g.fillStyle(0x888888, 0.25);
        g.slice(this.player.x, this.player.y, this.tailSlapRange, angle - arc / 2, angle + arc / 2, false);
        g.fillPath(); g.strokePath();
        this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
        this.maybePolycephaly(() => this.doSteelSlam());
    },

    // ─── Evolved weapon: Toxic Ocean ──────────────────────────────────────────
    doToxicOcean() {
        if (this.isPaused || this.isCountdown) return;
        const radius   = 170; // ~1.4× poop radius
        const duration = this.poopDuration;
        for (let t = 0; t < 3; t++) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const poop  = this.physics.add.image(this.player.x, this.player.y, 'cricket');
            poop.setTint(0x226600).setScale(0.35).setDepth(8);
            poop.setVelocity(Math.cos(angle) * 180, Math.sin(angle) * 180);
            poop.landed = false;
            const land = () => {
                if (poop.landed || !poop.active) return;
                poop.landed = true;
                const fx = poop.x, fy = poop.y;
                poop.destroy();
                const field = this.add.circle(fx, fy, radius, 0x113300, 0.55).setDepth(6);
                const ring  = this.add.graphics().setDepth(7);
                ring.lineStyle(3, 0x44aa00, 0.8); ring.strokeCircle(fx, fy, radius);
                const tickTimer = this.time.addEvent({ delay: 500, loop: true, callback: () => {
                    if (this.isPaused || this.isLevelingUp || this.isCountdown) return;
                    this.enemies.getChildren().forEach(enemy => {
                        if (Phaser.Math.Distance.Between(fx, fy, enemy.x, enemy.y) <= radius && this.canDamageEnemy(enemy)) {
                            this.damageDealt += this.poopDamage; enemy.health -= this.poopDamage;
                            this.playEnemyHurtSfx();
                            this.tweens.add({ targets: enemy, alpha: 0.2, duration: 60, yoyo: true });
                            if (!enemy.slowed) {
                                enemy.slowed = true; const bs = enemy.speed; enemy.speed = bs * 0.5; enemy.setTint(0x88cc44);
                                this.time.delayedCall(2000, () => { if (enemy.active) { enemy.speed = bs; enemy.clearTint(); enemy.slowed = false; } });
                            }
                            if (enemy.health <= 0) this.killEnemy(enemy);
                        }
                    });
                    if (this.boss?.active && Phaser.Math.Distance.Between(fx, fy, this.boss.x, this.boss.y) <= radius) {
                        this.damageBoss(this.poopDamage);
                        this.slowBoss(2000, 0.5, 0x88cc44);
                    }
                    this.tweens.add({ targets: field, alpha: 0.85, duration: 120, yoyo: true });
                    // Drift toward largest nearby enemy cluster
                    let cx = 0, cy = 0, n = 0;
                    this.enemies.getChildren().forEach(e => {
                        if (Phaser.Math.Distance.Between(fx, fy, e.x, e.y) <= 250) { cx += e.x; cy += e.y; n++; }
                    });
                    if (n > 0 && field.active) {
                        const da = Math.atan2(cy / n - field.y, cx / n - field.x);
                        field.x += Math.cos(da) * 2; field.y += Math.sin(da) * 2;
                        ring.clear(); ring.lineStyle(3, 0x44aa00, 0.8); ring.strokeCircle(field.x, field.y, radius);
                    }
                } });
                this.time.delayedCall(duration, () => {
                    tickTimer.remove();
                    this.tweens.add({ targets: [field, ring], alpha: 0, duration: 400, onComplete: () => { field.destroy(); ring.destroy(); } });
                });
            };
            this.physics.add.overlap(poop, this.enemies, land);
            if (this.boss?.active) this.physics.add.overlap(poop, this.boss, land);
            this.time.delayedCall(800, land);
        }
        this.maybePolycephaly(() => this.doToxicOcean());
    },

    // Sets an enemy on fire for `duration` ms (red tint, 6 dmg every 300ms). No-ops if
    // already burning. Used both by Sunbaked Ambers' direct hit and by burn-on-contact spread.
    igniteEnemy(enemy, duration) {
        if (!enemy.active || enemy.burned) return;
        enemy.burned = true; enemy.setTint(0xff2200);
        const ticks = Math.ceil(duration / 300);
        let done = 0;
        const bt = this.time.addEvent({ delay: 300, loop: true, callback: () => {
            if (!enemy.active) { bt.remove(); return; }
            this.damageDealt += 6; enemy.health -= 6; done++;
            this.playEnemyHurtSfx();
            if (enemy.health <= 0) { this.killEnemy(enemy); bt.remove(); return; }
            if (done >= ticks) { bt.remove(); if (enemy.active) { enemy.burned = false; enemy.clearTint(); } }
        } });
    },

    // Burning enemies set fire to enemies they physically collide with, for a short 1s
    // burn — and each enemy can only catch fire this way once every 3s, so two enemies
    // stuck touching each other don't re-ignite one another every physics step.
    trySpreadFire(source, target) {
        if (!source.burned || target.burned || !target.active) return;
        const now = this.time.now;
        if (target._nextBurnContagionAt && now < target._nextBurnContagionAt) return;
        target._nextBurnContagionAt = now + 3000;
        this.igniteEnemy(target, 1000);
    },

    // ─── Evolved weapon: Sunbaked Ambers ──────────────────────────────────────
    doSunbakedAmbers() {
        if (this.isPaused || this.isCountdown) return;
        const count = 30, burnDur = 3500, dmg = this.pebbleDamage + 5;
        for (let i = 0; i < count; i++) {
            const a      = (i / count) * Math.PI * 2;
            const amber  = this.physics.add.image(this.player.x, this.player.y, 'cricket');
            amber.setTint(0xff8800).setScale(0.22).setDepth(8);
            amber.setVelocity(Math.cos(a) * 280, Math.sin(a) * 280);
            this.physics.add.overlap(amber, this.enemies, (am, enemy) => {
                if (!am.active || !this.canDamageEnemy(enemy)) return;
                am.destroy();
                this.damageDealt += dmg; enemy.health -= dmg;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                this.igniteEnemy(enemy, burnDur);
                if (enemy.health <= 0) this.killEnemy(enemy);
            });
            if (this.boss?.active) this.physics.add.overlap(amber, this.boss, (am) => { if (!am.active) return; am.destroy(); this.damageBoss(dmg); this.igniteBoss(burnDur); });
            this.time.delayedCall(1400, () => { if (amber.active) amber.destroy(); });
        }
        this.maybePolycephaly(() => this.doSunbakedAmbers());
    },

    // ─── Evolved weapon: Raging Roar (always-active, runs in update loop) ────
    updateRagingRoar() {
        if (this.isPaused || this.isLevelingUp || this.isCountdown) return;
        const dt  = this.game.loop.delta / 1000;
        this._roarAngle = (this._roarAngle + dt * 1.2) % (Math.PI * 2); // ~69°/s
        const arc = Math.PI / 3; // 60°
        this.enemies.getChildren().forEach(enemy => {
            if (!this.canDamageEnemy(enemy)) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist > this.hissRange) return;
            const toEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
            if (Math.abs(Phaser.Math.Angle.Wrap(toEnemy - this._roarAngle)) <= arc / 2) {
                if (!enemy.slowed) {
                    enemy.slowed = true; const bs = enemy.speed; enemy.speed = bs * 0.5; enemy.setTint(0xff8844);
                    this.time.delayedCall(350, () => { if (enemy.active) { enemy.speed = bs; enemy.clearTint(); enemy.slowed = false; } });
                }
            }
        });
        if (this.boss?.active) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
            const toB  = Math.atan2(this.boss.y - this.player.y, this.boss.x - this.player.x);
            if (dist <= this.hissRange && Math.abs(Phaser.Math.Angle.Wrap(toB - this._roarAngle)) <= arc / 2) {
                this.slowBoss(350, 0.5, 0xff8844);
            }
        }
        // Draw rotating cone every frame (clear previous via setDepth + low alpha tween)
        if (!this._roarGraphics) this._roarGraphics = this.add.graphics().setDepth(5);
        this._roarGraphics.clear();
        this._roarGraphics.fillStyle(0xff8844, 0.12);
        this._roarGraphics.slice(this.player.x, this.player.y, this.hissRange, this._roarAngle - arc / 2, this._roarAngle + arc / 2, false);
        this._roarGraphics.fillPath();
        this._roarGraphics.lineStyle(2, 0xff8844, 0.4);
        this._roarGraphics.strokePath();
    },

    // ─── Evolved weapon: Sticky Shot ──────────────────────────────────────────
    doStickyShot() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const lickRange = ([90, 120, 150][this.lickLevel - 1] || 150) + this.lickRangeBonus;
        const targets = this.enemies.getChildren()
            .map(e => ({ e, d: Phaser.Math.Distance.Between(px, py, e.x, e.y) }))
            .filter(o => o.d <= lickRange && this.canDamageEnemy(o.e))
            .sort((a, b) => a.d - b.d).slice(0, 5).map(o => o.e);
        for (let i = 0; i < 5; i++) {
            const target = targets[i] || null;
            let tx = px + Math.cos((i / 5) * Math.PI * 2) * lickRange;
            let ty = py + Math.sin((i / 5) * Math.PI * 2) * lickRange;
            if (target) {
                tx = target.x; ty = target.y;
                this.damageDealt += this.lickDamage; target.health -= this.lickDamage;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: target, alpha: 0, duration: 60, yoyo: true, repeat: 1 });
                if (!target.slowed) {
                    target.slowed = true; const bs = target.speed; target.speed = bs * 0.5; target.setTint(0xaaddff);
                    this.time.delayedCall(2000, () => { if (target.active) { target.speed = bs; target.clearTint(); target.slowed = false; } });
                }
                this.maybeVenom(target);
                if (target.health <= 0) this.killEnemy(target);
            }
            if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= lickRange) {
                this.damageBoss(this.lickDamage);
                this.maybeVenomBoss();
                this.slowBoss(2000, 0.5, 0xaaddff);
            }
            const g = this.add.graphics().setDepth(20);
            g.lineStyle(5, 0xffaa44, 0.9); g.beginPath(); g.moveTo(px, py); g.lineTo(tx, ty); g.strokePath();
            g.fillStyle(0xffaa44, 1); g.fillCircle(tx, ty, 6);
            this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
        }
        this.maybePolycephaly(() => this.doStickyShot());
    },

    // ─── Evolved weapon: Acid Snake ───────────────────────────────────────────
    doAcidSnake() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const arc = Math.PI * (160 / 180); // 160°
        [-1, 1].forEach(side => {
            const baseAngle = side === -1 ? Math.PI : 0;
            this.enemies.getChildren().forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
                if (dist > this.wormWhipRange) return;
                const toEnemy = Math.atan2(enemy.y - py, enemy.x - px);
                if (Math.abs(Phaser.Math.Angle.Wrap(toEnemy - baseAngle)) <= arc / 2 && this.canDamageEnemy(enemy)) {
                    this.damageDealt += this.wormWhipDamage; enemy.health -= this.wormWhipDamage;
                    this.playEnemyHurtSfx();
                    this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                    this.applyEnemyPoison(enemy, 6000);
                    if (!enemy.slowed) {
                        enemy.slowed = true; const bs = enemy.speed; enemy.speed = bs * 0.5; enemy.setTint(0x44ff88);
                        this.time.delayedCall(2000, () => { if (enemy.active) { enemy.speed = bs; enemy.clearTint(); enemy.slowed = false; } });
                    }
                    if (enemy.health <= 0) this.killEnemy(enemy);
                }
            });
            if (this.boss?.active) {
                const dist = Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y);
                const toB  = Math.atan2(this.boss.y - py, this.boss.x - px);
                if (dist <= this.wormWhipRange && Math.abs(Phaser.Math.Angle.Wrap(toB - baseAngle)) <= arc / 2) {
                    this.damageBoss(this.wormWhipDamage);
                    this.applyBossPoison(6000);
                    this.slowBoss(2000, 0.5, 0x44ff88);
                }
            }
            const g = this.add.graphics().setDepth(20);
            g.lineStyle(3, 0x44ff88, 0.85); g.beginPath();
            g.arc(px, py, this.wormWhipRange, baseAngle - arc / 2, baseAngle + arc / 2); g.strokePath();
            const tipX = px + Math.cos(baseAngle) * this.wormWhipRange;
            const tipY = py + Math.sin(baseAngle) * this.wormWhipRange;
            g.fillStyle(0x44ff44, 1); g.fillCircle(tipX, tipY, 5);
            this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
        });
        this.maybePolycephaly(() => this.doAcidSnake());
    },

    // ─── Evolved weapon: Bug Buster ───────────────────────────────────────────
    doBugBuster() {
        if (this.isPaused || this.isCountdown) return;
        const count  = Phaser.Math.Between(8, 12);
        const busDmg = 65;
        for (let i = 0; i < count; i++) {
            const a  = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const dr = Phaser.Math.FloatBetween(30, 80);
            const ox = Phaser.Math.Clamp(this.player.x + Math.cos(a) * dr, 32, 3168);
            const oy = Phaser.Math.Clamp(this.player.y + Math.sin(a) * dr, 32, 3168);
            const mine = this.physics.add.image(this.player.x, this.player.y, 'cricket');
            mine.setTint(0xffdd00).setScale(0.32).setDepth(8);
            mine.exploded = false;
            this.tweens.add({ targets: mine, x: ox, y: oy, duration: 250, ease: 'Quad.easeOut' });
            const explodeMine = () => {
                if (mine.exploded || !mine.active || this.isCountdown) return;
                mine.exploded = true;
                const ex = mine.x, ey = mine.y; mine.destroy();
                const expl = this.add.circle(ex, ey, this.pupaRadius * 2, 0xff6600, 0.65).setDepth(15);
                this.cameras.main.shake(200, 0.01);
                this.tweens.add({ targets: expl, alpha: 0, scaleX: 1.8, scaleY: 1.8, duration: 350, onComplete: () => expl.destroy() });
                this.enemies.getChildren().forEach(e => {
                    if (Phaser.Math.Distance.Between(ex, ey, e.x, e.y) <= this.pupaRadius * 2 && this.canDamageEnemy(e)) {
                        this.damageDealt += busDmg; e.health -= busDmg;
                        this.playEnemyHurtSfx();
                        if (e.health <= 0) { e._killedByBugBuster = true; this.killEnemy(e); }
                    }
                });
                if (this.boss?.active && Phaser.Math.Distance.Between(ex, ey, this.boss.x, this.boss.y) <= this.pupaRadius * 2) this.damageBoss(busDmg);
            };
            mine.explodeFn = explodeMine;
            this.pupaGroup.add(mine);
            mine.setImmovable(true);
            mine.body.setAllowGravity(false);
            this.physics.add.overlap(mine, this.enemies, explodeMine);
            if (this.boss?.active) this.physics.add.overlap(mine, this.boss, explodeMine);
            this.tweens.add({ targets: mine, alpha: 0.3, duration: 400, yoyo: true, loop: -1 });
            this.time.delayedCall(45000, explodeMine);
        }
        this.maybePolycephaly(() => this.doBugBuster());
    },

    // ─── Evolved weapon: Spike Shedder ────────────────────────────────────────
    doSpikeShedder() {
        if (this.isPaused || this.isCountdown) return;
        for (let i = 0; i < 3; i++) {
            const skin = this.physics.add.image(this.player.x, this.player.y, 'cricket');
            skin.setTint(0xdddddd).setScale(0.60).setDepth(8);
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            skin.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
            skin.body.setGravityY(350); skin.hitEnemies = new Set();
            this.physics.add.overlap(skin, this.enemies, (s, enemy) => {
                if (s.hitEnemies.has(enemy) || !this.canDamageEnemy(enemy)) return;
                s.hitEnemies.add(enemy);
                this.damageDealt += this.skinDamage; enemy.health -= this.skinDamage;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                if (enemy.health <= 0) this.killEnemy(enemy);
            });
            if (this.boss?.active) this.physics.add.overlap(skin, this.boss, (s) => { if (s.hitEnemies.has(this.boss)) return; s.hitEnemies.add(this.boss); this.damageBoss(this.skinDamage); });
            this.time.delayedCall(1200, () => { if (skin.active) skin.destroy(); });
        }
        this.maybePolycephaly(() => this.doSpikeShedder());
    },

    // ─── Evolved weapon: Shining Shells ───────────────────────────────────────
    doShiningShells() {
        if (this.isPaused || this.isCountdown) return;
        for (let i = 0; i < 3; i++) {
            const angle  = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const shell  = this.physics.add.image(this.player.x, this.player.y, 'cricket');
            shell.setTint(0xffffff).setScale(0.30).setDepth(8);
            shell.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
            shell.hitEnemies = new Set();
            this.physics.add.overlap(shell, this.enemies, (s, enemy) => {
                if (!s.active || s.hitEnemies.has(enemy) || !this.canDamageEnemy(enemy) || this.isCountdown) return;
                s.hitEnemies.add(enemy);
                this.damageDealt += this.woodieDamage; enemy.health -= this.woodieDamage;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                if (enemy.health <= 0) {
                    // Small explosion on kill
                    const ex = this.add.circle(enemy.x, enemy.y, 28, 0xffffff, 0.7).setDepth(16);
                    this.tweens.add({ targets: ex, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 200, onComplete: () => ex.destroy() });
                    this.killEnemy(enemy);
                }
                // Auto-aim to next enemy after hitting
                this.scheduleShiningShellBounce(s, 300);
            });
            if (this.boss?.active) this.physics.add.overlap(shell, this.boss, (s) => { if (!s.active) return; this.damageBoss(this.woodieDamage); this.scheduleShiningShellBounce(s, 300); });
            this.time.delayedCall(25000, () => { if (shell.active) shell.destroy(); });
        }
        this.maybePolycephaly(() => this.doShiningShells());
    },

    scheduleShiningShellBounce(shell, speed) {
        this.time.delayedCall(120, () => {
            if (!shell.active) return;
            shell.hitEnemies.clear();
            // Aim at nearest enemy
            let nearest = null, nearestDist = Infinity;
            this.enemies.getChildren().forEach(e => {
                const d = Phaser.Math.Distance.Between(shell.x, shell.y, e.x, e.y);
                if (d < nearestDist) { nearest = e; nearestDist = d; }
            });
            const a = nearest
                ? Math.atan2(nearest.y - shell.y, nearest.x - shell.x)
                : Phaser.Math.FloatBetween(0, Math.PI * 2);
            shell.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
            this.tweens.add({ targets: shell, alpha: 0.3, duration: 60, yoyo: true });
        });
    },

    // ─── Evolved weapon: Dubia Defenders (projectile shots) ──────────────────
    updateDubiaDefenderShots() {
        if (this.isPaused || this.isLevelingUp || this.isCountdown) return;
        const now = this.time.now;
        if (now - this._dubiaDefenderLastShot < 5000) return;
        this._dubiaDefenderLastShot = now;
        const dmg = this.dubiaShieldDamage + 15;
        this.dubiaShields.forEach(shield => {
            // Fire in the direction the shield is currently facing (outward from player)
            const a = Math.atan2(shield.y - this.player.y, shield.x - this.player.x);
            const proj = this.physics.add.image(shield.x, shield.y, 'cricket');
            proj.setTint(0xffaa00).setScale(0.25).setDepth(9);
            proj.setVelocity(Math.cos(a) * 350, Math.sin(a) * 350);
            this.physics.add.overlap(proj, this.enemies, (p, enemy) => {
                if (!p.active || !this.canDamageEnemy(enemy)) return;
                this.damageDealt += dmg; enemy.health -= dmg;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                if (enemy.health <= 0) this.killEnemy(enemy);
                p.destroy();
            });
            if (this.boss?.active) this.physics.add.overlap(proj, this.boss, (p) => { if (!p.active) return; this.damageBoss(dmg); p.destroy(); });
            this.time.delayedCall(2500, () => { if (proj.active) proj.destroy(); });
        });
    },

    // ─── Evolved weapon: Flashclaw ────────────────────────────────────────────
    doFlashclaw() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const ranges    = [80, 110, 140, 170];
        const range     = (ranges[this.poisonClawLevel - 1] ?? 170) + this.lickRangeBonus + 20;
        const dmg       = 25;
        const now       = this.time.now;
        const fireOnce  = () => {
            let nearest = null, nearestDist = Infinity;
            this.enemies.getChildren().forEach(e => {
                if (!this.canDamageEnemy(e)) return;
                const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
                if (d <= range && d < nearestDist) { nearest = e; nearestDist = d; }
            });
            const angle = this.lastMoveAngle ?? 0;
            const tx = nearest ? nearest.x : px + Math.cos(angle) * range;
            const ty = nearest ? nearest.y : py + Math.sin(angle) * range;
            if (nearest) {
                this.damageDealt += dmg; nearest.health -= dmg;
                this.playEnemyHurtSfx();
                this.applyEnemyPoison(nearest, 6000);
                // Immobilise (1s, 10s cooldown)
                const lastFlash = nearest._lastFlashclaw ?? 0;
                if (now - lastFlash >= 10000) {
                    nearest._lastFlashclaw = now;
                    nearest.bugCaught = true;
                    this.time.delayedCall(1000, () => { if (nearest.active) nearest.bugCaught = false; });
                }
                this.tweens.add({ targets: nearest, alpha: 0, duration: 60, yoyo: true, repeat: 1 });
                if (nearest.health <= 0) this.killEnemy(nearest);
            }
            if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= range) {
                this.damageBoss(dmg);
                this.applyBossPoison(6000);
                this.immobilizeBoss(1000);
            }
            const g = this.add.graphics().setDepth(20);
            g.lineStyle(5, 0xff44ff, 0.9); g.beginPath(); g.moveTo(px, py); g.lineTo(tx, ty); g.strokePath();
            const ta = Math.atan2(ty - py, tx - px); g.fillStyle(0xff44ff, 1);
            for (let c = -1; c <= 1; c++) { const ca = ta + c * 0.45; g.fillTriangle(tx, ty, tx + Math.cos(ca + Math.PI) * 14, ty + Math.sin(ca + Math.PI) * 14, tx + Math.cos(ca + Math.PI + 0.4) * 7, ty + Math.sin(ca + Math.PI + 0.4) * 7); }
            this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
        };
        fireOnce();
        this.time.delayedCall(200, () => { if (!this.isPaused && !this.isCountdown) fireOnce(); });
        this.maybePolycephaly(() => this.doFlashclaw());
    },

    // ─── Evolved weapon: Log Lob ──────────────────────────────────────────────
    doLogLob() {
        if (this.isPaused || this.isCountdown) return;
        let nearest = null, nearestDist = Infinity;
        this.enemies.getChildren().forEach(e => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
            if (d < nearestDist) { nearest = e; nearestDist = d; }
        });
        const aimAngle = nearest ? Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x) : (this.lastMoveAngle ?? 0);
        const dmg = Math.round(22 * 2.2);
        [aimAngle + Math.PI / 2, aimAngle - Math.PI / 2].forEach(travelAngle => {
            const log = this.physics.add.image(this.player.x, this.player.y, 'cricket');
            log.setDisplaySize(140, 28).setTint(0x4a2800).setAngle(Phaser.Math.RadToDeg(aimAngle)).setDepth(8);
            log.body.setSize(140, 28);
            log.setVelocity(Math.cos(travelAngle) * 200, Math.sin(travelAngle) * 200);
            log.hitCooldowns = new Map(); // per-enemy hit cooldown to prevent infinite knockback
            this.physics.add.overlap(log, this.enemies, (l, enemy) => {
                if (!l.active || !this.canDamageEnemy(enemy) || this.isCountdown) return;
                const lastHit = l.hitCooldowns.get(enemy) ?? 0;
                if (this.time.now - lastHit < 1500) return;
                l.hitCooldowns.set(enemy, this.time.now);
                this.damageDealt += dmg; enemy.health -= dmg;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                // Slight knockback
                const a = Math.atan2(enemy.y - l.y, enemy.x - l.x);
                this.applyKnockback(enemy, a, 60);
                if (enemy.health <= 0) this.killEnemy(enemy);
            });
            if (this.boss?.active) this.physics.add.overlap(log, this.boss, (l) => { if (!l.active) return; this.damageBoss(dmg); });
            this.scheduleProjectileDespawn(log, 25000);
        });
        this.maybePolycephaly(() => this.doLogLob());
    },

    // ─── Evolved weapon: Duststorm ────────────────────────────────────────────
    doDuststorm() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const angle  = (this.lastMoveAngle ?? 0) + Math.PI;
        const len    = this.dustKickLength * 1.6;
        const width  = 100;
        const dmg    = 15;
        const cosA   = Math.cos(angle), sinA = Math.sin(angle);
        const now    = this.time.now;
        this.enemies.getChildren().forEach(enemy => {
            if (!this.canDamageEnemy(enemy)) return;
            const dx = enemy.x - px, dy = enemy.y - py;
            const along = dx * cosA + dy * sinA;
            const perp  = Math.abs(-dx * sinA + dy * cosA);
            if (along >= 0 && along <= len && perp <= width / 2) {
                this.damageDealt += dmg; enemy.health -= dmg;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.3, duration: 80, yoyo: true });
                if (enemy.health <= 0) { this.killEnemy(enemy); return; }
                if (!enemy.slowed) {
                    enemy.slowed = true; const bs = enemy.speed; enemy.speed = bs * 0.5; enemy.setTint(0xc8a020);
                    this.time.delayedCall(3000, () => { if (enemy.active) { enemy.speed = bs; enemy.clearTint(); enemy.slowed = false; } });
                }
                // Immobilise very close enemies (80px, 12s cooldown)
                const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
                const lastStorm = enemy._lastDuststorm ?? 0;
                if (dist <= 80 && now - lastStorm >= 12000) {
                    enemy._lastDuststorm = now;
                    enemy.bugCaught = true;
                    this.time.delayedCall(1500, () => { if (enemy.active) enemy.bugCaught = false; });
                }
            }
        });
        if (this.boss?.active) {
            const dx = this.boss.x - px, dy = this.boss.y - py;
            if ((dx * cosA + dy * sinA) >= 0 && Math.abs(-dx * sinA + dy * cosA) <= width / 2) {
                this.damageBoss(dmg);
                this.slowBoss(3000, 0.5, 0xc8a020);
                if (Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= 80) this.immobilizeBoss(1500);
            }
        }
        const g = this.add.graphics().setDepth(20);
        g.fillStyle(0xc8a020, 0.40); const hw = width / 2;
        g.fillPoints([
            { x: px - sinA * hw,             y: py + cosA * hw             },
            { x: px + cosA * len - sinA * hw, y: py + sinA * len + cosA * hw },
            { x: px + cosA * len + sinA * hw, y: py + sinA * len - cosA * hw },
            { x: px + sinA * hw,              y: py - cosA * hw             },
        ], true);
        // Inner glow for immobilise zone
        g.fillStyle(0xffffff, 0.12); g.fillCircle(px, py, 80);
        this.tweens.add({ targets: g, alpha: 0, duration: 550, onComplete: () => g.destroy() });
        this.maybePolycephaly(() => this.doDuststorm());
    },

    // ─── Evolved weapon: Lucky Thrash ─────────────────────────────────────────
    doLuckyThrash() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const scratchCount = Phaser.Math.Between(8, 14);
        for (let n = 0; n < scratchCount; n++) {
            const a  = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const d  = Phaser.Math.FloatBetween(20, 150);
            const sx = Phaser.Math.Clamp(px + Math.cos(a) * d, 32, 3168);
            const sy = Phaser.Math.Clamp(py + Math.sin(a) * d, 32, 3168);
            const r  = 90, dmg = Phaser.Math.Between(20, 35);
            this.enemies.getChildren().forEach(enemy => {
                if (!this.canDamageEnemy(enemy)) return;
                if (Phaser.Math.Distance.Between(sx, sy, enemy.x, enemy.y) <= r) {
                    this.damageDealt += dmg; enemy.health -= dmg;
                    this.playEnemyHurtSfx();
                    this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                    enemy._scratchFoodbox  = (enemy._scratchFoodbox  ?? 0) + 0.25;
                    enemy._scratchTreasure = (enemy._scratchTreasure ?? 0) + 0.15;
                    enemy._scratchFullbox  = (enemy._scratchFullbox  ?? 0) + 0.08;
                    if (enemy.health <= 0) this.killEnemy(enemy);
                }
            });
            if (this.boss?.active && Phaser.Math.Distance.Between(sx, sy, this.boss.x, this.boss.y) <= r) this.damageBoss(dmg);
            const s = 22, g = this.add.graphics().setDepth(15);
            g.lineStyle(4, 0xff4400, 0.95);
            g.beginPath(); g.moveTo(sx - s, sy - s); g.lineTo(sx + s, sy + s); g.strokePath();
            g.beginPath(); g.moveTo(sx + s, sy - s); g.lineTo(sx - s, sy + s); g.strokePath();
            this.tweens.add({ targets: g, alpha: 0, duration: 1800, onComplete: () => g.destroy() });
        }
        this.maybePolycephaly(() => this.doLuckyThrash());
    },

    // ─── Evolved weapon: Four Chills ──────────────────────────────────────────
    doFourChills() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const range = 350, now = this.time.now;
        // Sort enemies by distance to find the closest ones
        const inRange = this.enemies.getChildren()
            .filter(e => this.canDamageEnemy(e) && Phaser.Math.Distance.Between(px, py, e.x, e.y) <= range)
            .sort((a, b) => Phaser.Math.Distance.Between(px, py, a.x, a.y) - Phaser.Math.Distance.Between(px, py, b.x, b.y));
        inRange.forEach(enemy => {
            // Slow all for 8s
            if (!enemy.slowed) {
                enemy.slowed = true; const bs = enemy.speed; enemy.speed = bs * 0.15; enemy.setTint(0x88ddff);
                this.time.delayedCall(8000, () => { if (enemy.active) { enemy.speed = bs; enemy.clearTint(); enemy.slowed = false; } });
            }
        });
        // Immobilise & halve HP of the 8 closest (15s cooldown per enemy)
        inRange.slice(0, 8).forEach(enemy => {
            const lastChill = enemy._lastFourChills ?? 0;
            if (now - lastChill < 15000) return;
            enemy._lastFourChills = now;
            enemy.bugCaught = true;
            enemy.health = Math.ceil(enemy.health / 2);
            this.tweens.add({ targets: enemy, alpha: 0.1, duration: 100, yoyo: true, repeat: 3 });
            this.time.delayedCall(2000, () => { if (enemy.active) enemy.bugCaught = false; });
        });
        // Boss: same slow + immobilise as regular enemies (using the shared 3s boss
        // immobilise cooldown), but no HP-halving — that stays enemy-only.
        if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= range) {
            this.slowBoss(8000, 0.15, 0x88ddff);
            this.immobilizeBoss(2000);
        }
        // Visual: large icy ring — same fix as Cold Glare: position the Graphics object
        // at (px, py) and draw at local (0, 0) so it scales in place, not from the origin.
        const g = this.add.graphics().setDepth(20).setPosition(px, py);
        g.fillStyle(0x88ddff, 0.10); g.fillCircle(0, 0, range);
        g.lineStyle(4, 0xaaeeff, 0.9); g.strokeCircle(0, 0, range);
        // Four arcing sparks
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            g.lineStyle(2, 0xffffff, 0.7);
            g.beginPath(); g.arc(0, 0, range * 0.5, a, a + Math.PI * 0.4); g.strokePath();
        }
        this.tweens.add({ targets: g, alpha: 0, scaleX: 1.12, scaleY: 1.12, duration: 800, onComplete: () => g.destroy() });
        this.maybePolycephaly(() => this.doFourChills());
        // reschedule
        this.fourChillsTimer?.remove();
        this.fourChillsTimer = this.time.addEvent({ delay: 25000, callback: this.doFourChills, callbackScope: this, loop: false });
    },

    // ─── Evolution system ──────────────────────────────────────────────────────


};
