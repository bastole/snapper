export const BaseWeaponMethods = {

    doBite() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x;
        const py = this.player.y;

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
            if (dist <= this.biteRange && this.canDamageEnemy(enemy)) {
                this.damageDealt += this.biteDamage; enemy.health -= this.biteDamage;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                this.maybeVenom(enemy);
                if (this.biteLevel >= 4 && !enemy.slowed) {
                    enemy.slowed = true; enemy.speed = Math.max(10, enemy.speed * 0.5);
                    enemy.setTint(0x88ddff);
                    this.time.delayedCall(2000, () => { if (enemy.active) { enemy.slowed = false; enemy.speed *= 2; enemy.clearTint(); } });
                }
                this.checkHydraPhase(enemy);
                if (enemy.health <= 0) this.killEnemy(enemy);
            }
        });
        if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= this.biteRange) {
            this.damageBoss(this.biteDamage);
            this.maybeVenomBoss();
            if (this.biteLevel >= 4) this.slowBoss(2000, 0.5, 0x88ddff);
        }

        // Always show bite circle so player can see the attack range
        const circle = this.add.circle(px, py, this.biteRange, 0xffffff, 0.12).setDepth(20);
        this.tweens.add({ targets: circle, alpha: 0, duration: 200, onComplete: () => circle.destroy() });
        this.maybePolycephaly(() => this.doBite());
    },

    doTailSlap() {
        if (this.isPaused || this.isCountdown) return;
        // Behind the player = opposite of movement direction
        const angle = (this.lastMoveAngle ?? 0) + Math.PI;
        const arc   = this.tailSlapUpgraded ? Math.PI : (Math.PI / 3);

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist > this.tailSlapRange) return;
            const toEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
            let diff = Phaser.Math.Angle.Wrap(toEnemy - angle);
            if (Math.abs(diff) <= arc / 2 && this.canDamageEnemy(enemy)) {
                this.damageDealt += this.tailSlapDamage; enemy.health -= this.tailSlapDamage; this.checkHydraPhase(enemy);
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                this.maybeVenom(enemy);
                if (enemy.health <= 0) this.killEnemy(enemy);
            }
        });
        if (this.boss?.active) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
            if (dist <= this.tailSlapRange) {
                const toEnemy = Math.atan2(this.boss.y - this.player.y, this.boss.x - this.player.x);
                if (Math.abs(Phaser.Math.Angle.Wrap(toEnemy - angle)) <= arc / 2) {
                    this.damageBoss(this.tailSlapDamage);
                    this.maybeVenomBoss();
                }
            }
        }

        // Arc visual
        const g = this.add.graphics().setDepth(20);
        g.lineStyle(2, 0xff8800, 0.6);
        g.beginPath();
        g.arc(this.player.x, this.player.y, this.tailSlapRange, angle - arc / 2, angle + arc / 2);
        g.strokePath();
        this.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
        this.maybePolycephaly(() => this.doTailSlap());
    },

    doPoop() {
        if (this.isPaused || this.isCountdown) return;
        const angle      = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed      = 220;
        const radius     = 120;
        const duration   = this.poopDuration;

        const poop = this.physics.add.image(this.player.x, this.player.y, 'cricket');
        poop.setTint(0x885500).setScale(0.3).setDepth(8);
        poop.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        poop.landed = false;

        const land = () => {
            if (poop.landed || !poop.active) return;
            poop.landed = true;
            const fx = poop.x, fy = poop.y;
            poop.destroy();

            // Lingering field visual
            const field = this.add.circle(fx, fy, radius, 0x552200, 0.55).setDepth(6);
            const ring  = this.add.graphics().setDepth(7);
            ring.lineStyle(3, 0x885500, 0.8);
            ring.strokeCircle(fx, fy, radius);

            // Tick damage every 500ms; skip if game is paused or mid level-up
            const tickTimer = this.time.addEvent({
                delay: 500,
                loop: true,
                callback: () => {
                    if (this.isPaused || this.isLevelingUp || this.isCountdown) return;
                    this.enemies.getChildren().forEach(enemy => {
                        if (Phaser.Math.Distance.Between(fx, fy, enemy.x, enemy.y) <= radius && this.canDamageEnemy(enemy)) {
                            this.damageDealt += this.poopDamage; enemy.health -= this.poopDamage;
                            this.playEnemyHurtSfx();
                            this.tweens.add({ targets: enemy, alpha: 0.2, duration: 60, yoyo: true });
                            if (enemy.health <= 0) this.killEnemy(enemy);
                        }
                    });
                    if (this.boss?.active && Phaser.Math.Distance.Between(fx, fy, this.boss.x, this.boss.y) <= radius) {
                        this.damageBoss(this.poopDamage);
                    }
                    // Pulse the field on each tick
                    this.tweens.add({ targets: field, alpha: 0.85, duration: 120, yoyo: true });
                },
            });

            // Fade out and destroy when field expires
            this.time.delayedCall(duration, () => {
                tickTimer.remove();
                this.tweens.add({ targets: [field, ring], alpha: 0, duration: 400,
                    onComplete: () => { field.destroy(); ring.destroy(); } });
            });
        };

        this.physics.add.overlap(poop, this.enemies, land);
        if (this.boss?.active) this.physics.add.overlap(poop, this.boss, land);
        this.time.delayedCall(800, land);
        this.maybePolycephaly(() => this.doPoop());
    },

    doPebbleFlick() {
        if (this.isPaused || this.isCountdown) return;
        // Fire toward nearest enemy; if none, fire right
        let targetAngle = 0;
        let nearest = null;
        let nearestDist = Infinity;
        this.enemies.getChildren().forEach(e => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
            if (d < nearestDist) { nearestDist = d; nearest = e; }
        });
        if (nearest) targetAngle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);

        const count  = this.pebbleCount;
        const spread = 0.25;

        for (let i = 0; i < count; i++) {
            const offset = (i - Math.floor(count / 2)) * spread;
            const a      = targetAngle + offset;
            const pebble = this.physics.add.image(this.player.x, this.player.y, 'cricket');
            pebble.setTint(0xaaaaaa);
            pebble.setScale(0.2);
            pebble.setDepth(8);
            pebble.setVelocity(Math.cos(a) * 300, Math.sin(a) * 300);
            pebble.damage = this.pebbleDamage;
            pebble.hits   = 0;

            this.physics.add.overlap(pebble, this.enemies, (p, enemy) => {
                if (this.isCountdown || !this.canDamageEnemy(enemy)) return;
                this.damageDealt += p.damage; enemy.health -= p.damage;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                if (enemy.health <= 0) this.killEnemy(enemy);
                p.hits++;
                if (p.hits >= this.pebblePierce) p.destroy();
            });
            if (this.boss?.active) {
                this.physics.add.overlap(pebble, this.boss, (p) => { this.damageBoss(p.damage); p.hits++; if (p.hits >= this.pebblePierce) p.destroy(); });
            }

            this.time.delayedCall(1000, () => { if (pebble.active) pebble.destroy(); });
        }
        this.maybePolycephaly(() => this.doPebbleFlick());
    },

    doHiss() {
        if (this.isPaused || this.isCountdown) return;
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const arc   = this.hissUpgraded ? Math.PI / 2 : Math.PI / 4;

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist > this.hissRange) return;
            const toEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
            if (Math.abs(Phaser.Math.Angle.Wrap(toEnemy - angle)) <= arc / 2) {
                if (enemy.slowed) return;
                enemy.slowed = true;
                const baseSpeed = enemy.speed;
                enemy.speed = baseSpeed * 0.5;
                this.tweens.add({ targets: enemy, alpha: 0, duration: 60, yoyo: true, repeat: 2,
                    onComplete: () => { if (enemy.active) enemy.setTint(0x88ddff); } });
                this.time.delayedCall(2000, () => {
                    if (enemy.active) {
                        enemy.speed = baseSpeed;
                        enemy.clearTint();
                        enemy.slowed = false;
                    }
                });
            }
        });
        if (this.boss?.active) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
            const toB  = Math.atan2(this.boss.y - this.player.y, this.boss.x - this.player.x);
            if (dist <= this.hissRange && Math.abs(Phaser.Math.Angle.Wrap(toB - angle)) <= arc / 2) {
                this.slowBoss(2000, 0.5, 0x88ddff);
            }
        }

        const g = this.add.graphics().setDepth(20);
        g.lineStyle(2, 0x44aaff, 0.6);
        g.beginPath();
        g.arc(this.player.x, this.player.y, this.hissRange, angle - arc / 2, angle + arc / 2);
        g.strokePath();
        this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
        this.maybePolycephaly(() => this.doHiss());
    },

    doLick() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x;
        const py = this.player.y;
        const lickRange = ([90, 120, 150][this.lickLevel - 1] || 90) + this.lickRangeBonus;
        const tongueCount = this.lickLevel;

        // Find up to tongueCount nearest enemies within range
        const targets = this.enemies.getChildren()
            .map(e => ({ e, d: Phaser.Math.Distance.Between(px, py, e.x, e.y) }))
            .filter(o => o.d <= lickRange && this.canDamageEnemy(o.e))
            .sort((a, b) => a.d - b.d)
            .slice(0, tongueCount)
            .map(o => o.e);

        for (let i = 0; i < tongueCount; i++) {
            const target = targets[i] || null;
            let tx = px + Math.cos((i / tongueCount) * Math.PI * 2) * lickRange;
            let ty = py + Math.sin((i / tongueCount) * Math.PI * 2) * lickRange;

            if (target) {
                tx = target.x; ty = target.y;
                this.damageDealt += this.lickDamage; target.health -= this.lickDamage;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: target, alpha: 0, duration: 60, yoyo: true, repeat: 1 });
                this.maybeVenom(target);
                if (target.health <= 0) this.killEnemy(target);
            }

            if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= lickRange) {
                this.damageBoss(this.lickDamage);
                this.maybeVenomBoss();
            }

            // Tongue visual: pink line from player to target point
            const g = this.add.graphics().setDepth(20);
            g.lineStyle(4, 0xff66aa, 0.9);
            g.beginPath();
            g.moveTo(px, py);
            g.lineTo(tx, ty);
            g.strokePath();
            g.fillStyle(0xff66aa, 0.9);
            g.fillCircle(tx, ty, 5);
            this.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() });
        }
        this.maybePolycephaly(() => this.doLick());
    },

    doWormWhip() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const arc = Math.PI * 0.65;
        const sides = this.wormWhipLevel >= 2 ? [-1, 1] : [this._whipSide];
        this._whipSide *= -1;

        sides.forEach(side => {
            const baseAngle = side === -1 ? Math.PI : 0;

            this.enemies.getChildren().forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
                if (dist > this.wormWhipRange) return;
                const toEnemy = Math.atan2(enemy.y - py, enemy.x - px);
                if (Math.abs(Phaser.Math.Angle.Wrap(toEnemy - baseAngle)) <= arc / 2 && this.canDamageEnemy(enemy)) {
                    this.damageDealt += this.wormWhipDamage; enemy.health -= this.wormWhipDamage;
                    this.playEnemyHurtSfx();
                    this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                    this.maybeVenom(enemy);
                    if (enemy.health <= 0) this.killEnemy(enemy);
                }
            });
            if (this.boss?.active) {
                const dist = Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y);
                const toB = Math.atan2(this.boss.y - py, this.boss.x - px);
                if (dist <= this.wormWhipRange && Math.abs(Phaser.Math.Angle.Wrap(toB - baseAngle)) <= arc / 2) {
                    this.damageBoss(this.wormWhipDamage);
                    this.maybeVenomBoss();
                }
            }

            const g = this.add.graphics().setDepth(20);
            g.lineStyle(3, 0xaa8844, 0.85);
            g.beginPath();
            g.arc(px, py, this.wormWhipRange, baseAngle - arc / 2, baseAngle + arc / 2);
            g.strokePath();
            // Whip tip dot
            const tipX = px + Math.cos(baseAngle) * this.wormWhipRange;
            const tipY = py + Math.sin(baseAngle) * this.wormWhipRange;
            g.fillStyle(0xddbb66, 1);
            g.fillCircle(tipX, tipY, 5);
            this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
        });
        this.maybePolycephaly(() => this.doWormWhip());
    },

    // Spawns a single, regular (non-evolved) Pupa Mine that triggers naturally on enemy
    // contact or after its fuse — used by Bug Buster kills, which drop one of these
    // directly at the death spot instead of a walk-over pickup.
    spawnPupaMine(x, y) {
        if (!this.pupaGroup) return;
        const mine = this.physics.add.image(x, y, 'cricket');
        mine.setTint(0xffdd00).setScale(0.3).setDepth(8);
        mine.exploded = false;
        const explodeMine = () => {
            if (mine.exploded || !mine.active || this.isCountdown) return;
            mine.exploded = true;
            const ex = mine.x, ey = mine.y;
            mine.destroy();
            const expl = this.add.circle(ex, ey, this.pupaRadius, 0xff6600, 0.6).setDepth(15);
            this.tweens.add({ targets: expl, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 280, onComplete: () => expl.destroy() });
            this.enemies.getChildren().forEach(e => {
                if (Phaser.Math.Distance.Between(ex, ey, e.x, e.y) <= this.pupaRadius && this.canDamageEnemy(e)) {
                    this.damageDealt += this.pupaDamage; e.health -= this.pupaDamage;
                    this.playEnemyHurtSfx();
                    if (e.health <= 0) this.killEnemy(e);
                }
            });
            if (this.boss?.active && Phaser.Math.Distance.Between(ex, ey, this.boss.x, this.boss.y) <= this.pupaRadius) {
                this.damageBoss(this.pupaDamage);
            }
        };
        mine.explodeFn = explodeMine;
        this.pupaGroup.add(mine);
        mine.setImmovable(true);
        mine.body.setAllowGravity(false);
        this.physics.add.overlap(mine, this.enemies, explodeMine);
        if (this.boss?.active) this.physics.add.overlap(mine, this.boss, explodeMine);
        this.tweens.add({ targets: mine, alpha: 0.3, duration: 400, yoyo: true, loop: -1 });
        this.time.delayedCall(10000, explodeMine);
    },

    doPupaMines() {
        if (this.isPaused || this.isCountdown) return;
        const counts = [1, 3, 5];
        const count  = counts[this.pupaLevel - 1] || 1;

        for (let i = 0; i < count; i++) {
            // Spread mines evenly in a circle around the player
            const spreadAngle = (i / count) * Math.PI * 2;
            const spreadDist  = count > 1 ? 40 : 0;
            const ox = this.player.x + Math.cos(spreadAngle) * spreadDist;
            const oy = this.player.y + Math.sin(spreadAngle) * spreadDist;

            const mine = this.physics.add.image(this.player.x, this.player.y, 'cricket');
            mine.setTint(0xffdd00);
            mine.setScale(0.3);
            mine.setDepth(8);
            mine.exploded = false;

            // Slide out to final position
            this.tweens.add({ targets: mine, x: ox, y: oy, duration: 200, ease: 'Quad.easeOut' });

            const explodeMine = () => {
                if (mine.exploded || !mine.active || this.isCountdown) return;
                mine.exploded = true;
                const ex = mine.x, ey = mine.y;
                mine.destroy();

                const expl = this.add.circle(ex, ey, this.pupaRadius, 0xff6600, 0.6).setDepth(15);
                this.tweens.add({ targets: expl, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 280,
                    onComplete: () => expl.destroy() });

                this.enemies.getChildren().forEach(enemy => {
                    if (Phaser.Math.Distance.Between(ex, ey, enemy.x, enemy.y) <= this.pupaRadius && this.canDamageEnemy(enemy)) {
                        this.damageDealt += this.pupaDamage; enemy.health -= this.pupaDamage;
                        this.playEnemyHurtSfx();
                        this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                        if (enemy.health <= 0) this.killEnemy(enemy);
                    }
                });
                if (this.boss?.active && Phaser.Math.Distance.Between(ex, ey, this.boss.x, this.boss.y) <= this.pupaRadius) {
                    this.damageBoss(this.pupaDamage);
                }
            };

            // Store explode fn on mine so boss overlap can trigger it
            mine.explodeFn = explodeMine;
            this.pupaGroup.add(mine);
            mine.setImmovable(true);
            mine.body.setAllowGravity(false);

            // Explode when any enemy or boss steps on it
            this.physics.add.overlap(mine, this.enemies, explodeMine);
            if (this.boss?.active) this.physics.add.overlap(mine, this.boss, explodeMine);

            // Pulse to show it's active; auto-explode after 10s if untouched
            this.tweens.add({ targets: mine, alpha: 0.3, duration: 400, yoyo: true, loop: -1 });
            this.time.delayedCall(10000, explodeMine);
        }
        this.maybePolycephaly(() => this.doPupaMines());
    },

    doSkinShed() {
        if (this.isPaused || this.isCountdown) return;
        const count = this.skinLevel;
        const cam   = this.cameras.main;

        for (let i = 0; i < count; i++) {
            const skin = this.physics.add.image(this.player.x, this.player.y, 'cricket');
            skin.setTint(0xddbb99);
            skin.setScale(0.55);
            skin.setDepth(8);
            // Fling outward then arc downward via gravity
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            skin.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
            skin.body.setGravityY(400);
            skin.hitEnemies = new Set();

            this.physics.add.overlap(skin, this.enemies, (s, enemy) => {
                if (s.hitEnemies.has(enemy) || !this.canDamageEnemy(enemy)) return;
                s.hitEnemies.add(enemy);
                this.damageDealt += this.skinDamage; enemy.health -= this.skinDamage;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                if (enemy.health <= 0) this.killEnemy(enemy);
            });
            if (this.boss?.active) {
                this.physics.add.overlap(skin, this.boss, (s) => {
                    if (s.hitEnemies.has(this.boss)) return;
                    s.hitEnemies.add(this.boss);
                    this.damageBoss(this.skinDamage);
                });
            }

            // Destroy when it exits the bottom of the camera view
            this.time.delayedCall(1000, () => { if (skin.active) skin.destroy(); });
        }
        this.maybePolycephaly(() => this.doSkinShed());
    },

    doWoodieBounce() {
        if (this.isPaused || this.isCountdown) return;
        const configs = [[1, 2], [2, 3], [3, 5]];
        const [count, maxBounces] = configs[this.woodieLevel - 1] || [1, 2];

        // Aim at the nearest enemy; fall back to a random direction if none are around
        let nearest = null, nearestDist = Infinity;
        this.enemies.getChildren().forEach(e => {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
            if (d < nearestDist) { nearestDist = d; nearest = e; }
        });
        const targetAngle = nearest
            ? Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x)
            : Phaser.Math.FloatBetween(0, Math.PI * 2);

        for (let i = 0; i < count; i++) {
            const angle  = targetAngle;
            const speed  = 230;
            const woodie = this.physics.add.image(this.player.x, this.player.y, 'cricket');
            woodie.setTint(0x886644);
            woodie.setScale(0.28);
            woodie.setDepth(8);
            woodie.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            woodie.bouncesLeft = maxBounces;
            woodie.hitEnemies  = new Set();

            this.physics.add.overlap(woodie, this.enemies, (w, enemy) => {
                if (this.isCountdown || !w.active || w.hitEnemies.has(enemy) || !this.canDamageEnemy(enemy)) return;
                w.hitEnemies.add(enemy);
                this.damageDealt += this.woodieDamage; enemy.health -= this.woodieDamage;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                if (enemy.health <= 0) this.killEnemy(enemy);
            });
            if (this.boss?.active) {
                this.physics.add.overlap(woodie, this.boss, (w) => {
                    if (!w.active) return;
                    this.damageBoss(this.woodieDamage);
                });
            }

            this.scheduleWoodieBounce(woodie, speed);
        }
        this.maybePolycephaly(() => this.doWoodieBounce());
    },

    scheduleWoodieBounce(woodie, speed) {
        this.time.delayedCall(700, () => {
            if (!woodie.active) return;
            if (woodie.bouncesLeft <= 0) { woodie.destroy(); return; }
            woodie.bouncesLeft--;
            woodie.hitEnemies.clear(); // fresh hit window after each bounce
            const newAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            woodie.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);
            this.tweens.add({ targets: woodie, alpha: 0.2, duration: 60, yoyo: true });
            this.scheduleWoodieBounce(woodie, speed);
        });
    },

    // ─── Helper: enemy poison (from Venom passive / Poison Claw) ────────────────
    applyEnemyPoison(enemy, durationMs) {
        if (!enemy?.active || enemy.poisoned) return;
        enemy.poisoned = true;
        enemy.setTint(0x44ff44);
        const ticks = Math.max(1, Math.floor(durationMs / 500));
        let done = 0;
        const t = this.time.addEvent({
            delay: 500, loop: true,
            callback: () => {
                if (!enemy.active) { t.remove(); return; }
                this.damageDealt += 3; enemy.health -= 3;
                this.playEnemyHurtSfx();
                done++;
                if (enemy.health <= 0) { this.killEnemy(enemy); t.remove(); return; }
                if (done >= ticks) {
                    t.remove();
                    if (enemy.active) { enemy.poisoned = false; enemy.clearTint(); }
                }
            },
        });
    },

    maybeVenom(enemy) {
        if (this.venomChance > 0 && Math.random() < this.venomChance) this.applyEnemyPoison(enemy, this.venomDuration);
    },

    // ─── Boss status effects — poison, fire, slow, immobilise ───────────────────
    // Bosses use the same status effects as regular enemies, applied to this.boss
    // directly and routed through damageBoss() so death/phase-transition checks
    // still run. Immobilise uses a single shared 3s cooldown regardless of which
    // weapon triggers it (enemies keep their own per-weapon cooldowns).
    applyBossPoison(durationMs) {
        const boss = this.boss;
        if (!boss?.active || boss.poisoned) return;
        boss.poisoned = true;
        boss.setTint(0x44ff44);
        const ticks = Math.max(1, Math.floor(durationMs / 500));
        let done = 0;
        const t = this.time.addEvent({
            delay: 500, loop: true,
            callback: () => {
                if (!boss.active) { t.remove(); return; }
                this.damageBoss(3);
                done++;
                if (!boss.active) { t.remove(); return; }
                if (done >= ticks) { t.remove(); boss.poisoned = false; boss.clearTint(); }
            },
        });
    },

    maybeVenomBoss() {
        if (this.venomChance > 0 && Math.random() < this.venomChance) this.applyBossPoison(this.venomDuration);
    },

    igniteBoss(durationMs) {
        const boss = this.boss;
        if (!boss?.active || boss.burned) return;
        boss.burned = true;
        boss.setTint(0xff2200);
        const ticks = Math.ceil(durationMs / 300);
        let done = 0;
        const bt = this.time.addEvent({
            delay: 300, loop: true,
            callback: () => {
                if (!boss.active) { bt.remove(); return; }
                this.damageBoss(6);
                done++;
                if (!boss.active) { bt.remove(); return; }
                if (done >= ticks) { bt.remove(); boss.burned = false; boss.clearTint(); }
            },
        });
    },

    slowBoss(durationMs, factor, tint) {
        const boss = this.boss;
        if (!boss?.active || boss.slowed) return;
        boss.slowed = true;
        boss.slowFactor = factor;
        boss.setTint(tint);
        this.time.delayedCall(durationMs, () => {
            if (boss.active) { boss.slowed = false; boss.slowFactor = 1; boss.clearTint(); }
        });
    },

    immobilizeBoss(durationMs) {
        const boss = this.boss;
        if (!boss?.active) return;
        const now = this.time.now;
        if (boss._nextImmobilizeAt && now < boss._nextImmobilizeAt) return;
        boss._nextImmobilizeAt = now + 3000;
        boss.bugCaught = true;
        boss.setTint(0xbb66ff);
        this.time.delayedCall(durationMs, () => { if (boss.active) { boss.bugCaught = false; boss.clearTint(); } });
    },

    maybePolycephaly(fn) {
        if (!this._polycephalyFiring && this.polycephalyChance > 0 && Math.random() < this.polycephalyChance) {
            this._polycephalyFiring = true;
            this.time.delayedCall(120, () => { fn(); this._polycephalyFiring = false; });
        }
    },

    // ─── Poison Claw ────────────────────────────────────────────────────────────
    doPoisonClaw() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const ranges    = [80, 110, 140, 170];
        const durations = [3000, 5000, 6000, 7000];
        const range     = (ranges[this.poisonClawLevel - 1] ?? 80) + this.lickRangeBonus;
        const duration  = durations[this.poisonClawLevel - 1] ?? 3000;
        const damage    = 15;

        let nearest = null, nearestDist = Infinity;
        this.enemies.getChildren().forEach(e => {
            if (!this.canDamageEnemy(e)) return;
            const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
            if (d <= range && d < nearestDist) { nearest = e; nearestDist = d; }
        });

        const angle = this.lastMoveAngle ?? 0;
        let tx = px + Math.cos(angle) * range;
        let ty = py + Math.sin(angle) * range;

        if (nearest) {
            tx = nearest.x; ty = nearest.y;
            this.damageDealt += damage; nearest.health -= damage;
            this.playEnemyHurtSfx();
            this.tweens.add({ targets: nearest, alpha: 0, duration: 60, yoyo: true, repeat: 1 });
            this.applyEnemyPoison(nearest, duration);
            if (nearest.health <= 0) this.killEnemy(nearest);
        }
        if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= range) {
            this.damageBoss(damage);
            this.applyBossPoison(duration);
        }

        // Visual: green claw line
        const g = this.add.graphics().setDepth(20);
        g.lineStyle(5, 0x44ff44, 0.9);
        g.beginPath(); g.moveTo(px, py); g.lineTo(tx, ty); g.strokePath();
        const ta = Math.atan2(ty - py, tx - px);
        g.fillStyle(0x44ff44, 1);
        for (let i = -1; i <= 1; i++) {
            const ca = ta + i * 0.45;
            g.fillTriangle(tx, ty, tx + Math.cos(ca + Math.PI) * 14, ty + Math.sin(ca + Math.PI) * 14,
                tx + Math.cos(ca + Math.PI + 0.4) * 7, ty + Math.sin(ca + Math.PI + 0.4) * 7);
        }
        this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });

        this.maybePolycephaly(() => this.doPoisonClaw());
    },

    // ─── Branch Throw ────────────────────────────────────────────────────────────
    doBranchThrow() {
        if (this.isPaused || this.isCountdown) return;
        let nearest = null, nearestDist = Infinity;
        this.enemies.getChildren().forEach(e => {
            if (!e.active) return;
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
            if (d < nearestDist) { nearest = e; nearestDist = d; }
        });

        // Aim angle = toward nearest enemy; travel angle = perpendicular (sideways sweep)
        const aimAngle    = nearest
            ? Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x)
            : (this.lastMoveAngle ?? 0);
        const travelAngle = aimAngle + Math.PI / 2;

        const barLen  = this.branchLength;
        const barW    = this.branchWidth;
        const speed   = 300;
        const maxHits = this.branchMaxHits;
        const dmg     = 22;

        const branch = this.physics.add.image(this.player.x, this.player.y, 'cricket');
        // Visual angle = aim direction so the bar faces the enemy; travel = perpendicular
        branch.setDisplaySize(barLen, barW).setTint(0x6b3a1f).setAngle(Phaser.Math.RadToDeg(aimAngle)).setDepth(8);
        branch.body.setSize(barLen, barW);
        branch.setVelocity(Math.cos(travelAngle) * speed, Math.sin(travelAngle) * speed);
        branch.hits = 0;
        branch.hitEnemies = new Set();

        this.physics.add.overlap(branch, this.enemies, (b, enemy) => {
            if (!b.active || b.hitEnemies.has(enemy) || !this.canDamageEnemy(enemy) || this.isCountdown) return;
            b.hitEnemies.add(enemy);
            b.hits++;
            this.damageDealt += dmg; enemy.health -= dmg;
            this.playEnemyHurtSfx();
            this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
            this.maybeVenom(enemy);
            if (enemy.health <= 0) this.killEnemy(enemy);
            if (b.hits >= maxHits && b.active) b.destroy();
        });
        if (this.boss?.active) {
            this.physics.add.overlap(branch, this.boss, (b) => { if (!b.active) return; this.damageBoss(dmg); this.maybeVenomBoss(); });
        }

        this.scheduleProjectileDespawn(branch, 15000);
        this.maybePolycephaly(() => this.doBranchThrow());
    },

    // ─── Dust Kick ───────────────────────────────────────────────────────────────
    doDustKick() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const angle  = (this.lastMoveAngle ?? 0) + Math.PI;
        const len    = this.dustKickLength;
        const width  = 30;
        const dmg    = 8;
        const cosA   = Math.cos(angle), sinA = Math.sin(angle);

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
                    enemy.slowed = true;
                    const baseSpeed = enemy.speed;
                    enemy.speed = baseSpeed * 0.5;
                    if (enemy.active) enemy.setTint(0x88ddff);
                    this.time.delayedCall(this.dustKickSlowDuration, () => {
                        if (enemy.active) { enemy.speed = baseSpeed; enemy.clearTint(); enemy.slowed = false; }
                    });
                }
            }
        });
        if (this.boss?.active) {
            const dx = this.boss.x - px, dy = this.boss.y - py;
            if ((dx * cosA + dy * sinA) >= 0 && Math.abs(-dx * sinA + dy * cosA) <= width / 2) {
                this.damageBoss(dmg);
                this.slowBoss(this.dustKickSlowDuration, 0.5, 0x88ddff);
            }
        }

        // Visual: dusty beam (rotated filled polygon)
        const g = this.add.graphics().setDepth(20);
        g.fillStyle(0xc8a020, 0.45);
        const hw = width / 2;
        g.fillPoints([
            { x: px - sinA * hw,        y: py + cosA * hw        },
            { x: px + cosA * len - sinA * hw, y: py + sinA * len + cosA * hw },
            { x: px + cosA * len + sinA * hw, y: py + sinA * len - cosA * hw },
            { x: px + sinA * hw,         y: py - cosA * hw        },
        ], true);
        this.tweens.add({ targets: g, alpha: 0, duration: 450, onComplete: () => g.destroy() });

        this.maybePolycephaly(() => this.doDustKick());
    },

    // ─── Lucky Scratch ────────────────────────────────────────────────────────────
    doLuckyScratch() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const a   = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const d   = Phaser.Math.FloatBetween(20, 80);
        const sx  = Phaser.Math.Clamp(px + Math.cos(a) * d, 32, 3168);
        const sy  = Phaser.Math.Clamp(py + Math.sin(a) * d, 32, 3168);
        const r   = this.scratchLevel >= 3 ? 80 : 60;
        const dmg = Phaser.Math.Between(15, 25);

        this.enemies.getChildren().forEach(enemy => {
            if (!this.canDamageEnemy(enemy)) return;
            if (Phaser.Math.Distance.Between(sx, sy, enemy.x, enemy.y) <= r) {
                this.damageDealt += dmg; enemy.health -= dmg;
                this.playEnemyHurtSfx();
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                // Tag this specific enemy for boosted drops
                enemy._scratchFoodbox  = (enemy._scratchFoodbox  ?? 0) + 0.12;
                if (this.scratchLevel >= 2) enemy._scratchTreasure = (enemy._scratchTreasure ?? 0) + 0.05;
                if (enemy.health <= 0) this.killEnemy(enemy);
            }
        });
        if (this.boss?.active && Phaser.Math.Distance.Between(sx, sy, this.boss.x, this.boss.y) <= r) {
            this.damageBoss(dmg);
        }

        // Visual: gold X mark
        const s = this.scratchLevel >= 3 ? 18 : 14;
        const g = this.add.graphics().setDepth(15);
        g.lineStyle(3, 0xffd700, 0.95);
        g.beginPath(); g.moveTo(sx - s, sy - s); g.lineTo(sx + s, sy + s); g.strokePath();
        g.beginPath(); g.moveTo(sx + s, sy - s); g.lineTo(sx - s, sy + s); g.strokePath();
        this.tweens.add({ targets: g, alpha: 0, duration: 2000, onComplete: () => g.destroy() });

        this.maybePolycephaly(() => this.doLuckyScratch());
    },

    // ─── Cold Glare ──────────────────────────────────────────────────────────────
    doColdGlare() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x, py = this.player.y;
        const range = 120;

        this.enemies.getChildren().forEach(enemy => {
            if (!this.canDamageEnemy(enemy) || enemy.slowed) return;
            if (Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y) > range) return;
            enemy.slowed = true;
            const baseSpeed = enemy.speed;
            enemy.speed = Math.max(0, baseSpeed * 0.15);
            if (enemy.active) enemy.setTint(0x88ddff);
            this.time.delayedCall(this.coldGlareSlow, () => {
                if (enemy.active) { enemy.speed = baseSpeed; enemy.clearTint(); enemy.slowed = false; }
            });
        });
        if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= range) {
            this.slowBoss(this.coldGlareSlow, 0.15, 0x88ddff);
        }

        // Visual: icy ring burst. Positioned at (px, py) with the shape drawn at local
        // (0, 0) so the scale tween below grows it around its own center instead of the
        // world origin (which is what made the ring appear to drift as it scaled up).
        const g = this.add.graphics().setDepth(20).setPosition(px, py);
        g.fillStyle(0x88ddff, 0.18);
        g.fillCircle(0, 0, range);
        g.lineStyle(3, 0xaaeeff, 0.9);
        g.strokeCircle(0, 0, range);
        this.tweens.add({ targets: g, alpha: 0, scaleX: 1.15, scaleY: 1.15, duration: 600,
            onComplete: () => g.destroy() });

        this.maybePolycephaly(() => this.doColdGlare());
        this.scheduleColdGlare();
    },

    scheduleColdGlare() {
        this.coldGlareTimer?.remove();
        this.coldGlareTimer = this.time.delayedCall(this.coldGlareCooldown, () => {
            if (this.coldGlareActive) this.doColdGlare();
        });
    }


};
