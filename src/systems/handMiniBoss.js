export const HandMiniBossMethods = {

    cleanupMiniBossTimers(mb) {
        mb.miniChargeTimer?.remove();
        mb.miniSlamTimer?.remove();
        mb.scorpionClawTimer?.remove();
        mb.miniStingTimer?.remove();
        mb.miniVanishTimer?.remove();
        mb.miniChaseRunTimer?.remove();
    },

    // ─── Lettuce Beetle mini-boss AI ──────────────────────────────────────────────

    updateMiniBeetleAI(mb) {
        if (!mb.isCharging) this.physics.moveToObject(mb, this.player, mb.speed);
    },

    miniBeetleCharge(mb) {
        if (!mb?.active || mb.isCharging) return;
        mb.isCharging = true;
        mb.setVelocity(0, 0);

        const targetX = this.player.x;
        const targetY = this.player.y;
        const warn = this.add.graphics().setDepth(18);
        warn.fillStyle(0xff0000, 0.25);
        const angle = Math.atan2(targetY - mb.y, targetX - mb.x);
        const dist  = Phaser.Math.Distance.Between(mb.x, mb.y, targetX, targetY) + 60;
        warn.fillRect(0, -30, dist, 60);
        warn.setPosition(mb.x, mb.y);
        warn.setRotation(angle);

        this.tweens.add({ targets: mb, alpha: 0.3, duration: 75, yoyo: true, repeat: 1 });

        this.time.delayedCall(150, () => {
            warn.destroy();
            if (!mb.active) return;
            const chargeAngle = Math.atan2(targetY - mb.y, targetX - mb.x);
            mb.setVelocity(Math.cos(chargeAngle) * 320, Math.sin(chargeAngle) * 320);
            this.time.delayedCall(800, () => {
                if (!mb.active) return;
                mb.setVelocity(0, 0);
                mb.isCharging = false;
            });
        });
    },

    // ─── Rocket Spider mini-boss AI ───────────────────────────────────────────────

    updateMiniSpiderAI(mb) {
        if (!mb.phaseTriggered && mb.health <= mb.maxHealth * 0.5) {
            mb.phaseTriggered = true;
            this.triggerMiniSpiderPhase2(mb);
        }

        const now   = this.time.now;
        const speed = mb.aiSpeed ?? mb.speed ?? 95;

        if (!mb.aiSwitchAt || now >= mb.aiSwitchAt) {
            const modes = ['circle', 'circle', 'wander', 'chase'];
            mb.aiMode = Phaser.Utils.Array.GetRandom(modes);
            if (mb.aiMode === 'wander') {
                const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
                mb.wanderVX = Math.cos(a) * speed;
                mb.wanderVY = Math.sin(a) * speed;
            }
            mb.aiSwitchAt = now + Phaser.Math.Between(2000, 4000);
        }

        if (mb.aiMode === 'circle') {
            const dx   = mb.x - this.player.x;
            const dy   = mb.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDist = 190;
            const tx = -dy / dist;
            const ty =  dx / dist;
            const radial = (dist - targetDist) / 120;
            const rx = -(dx / dist) * radial;
            const ry = -(dy / dist) * radial;
            mb.setVelocity((tx + rx) * speed, (ty + ry) * speed);
        } else if (mb.aiMode === 'wander') {
            mb.setVelocity(mb.wanderVX, mb.wanderVY);
        } else {
            this.physics.moveToObject(mb, this.player, speed * 0.7);
        }
    },

    scheduleMiniSpiderSlam(mb) {
        if (!mb?.active) return;
        mb.miniSlamTimer = this.time.delayedCall(Phaser.Math.Between(5000, 10000), () => {
            this.miniSpiderLegSlam(mb);
            this.scheduleMiniSpiderSlam(mb);
        });
    },

    miniSpiderLegSlam(mb) {
        if (!mb?.active) return;
        this.tweens.add({ targets: mb, alpha: 0.3, duration: 100, yoyo: true });
        for (let i = 0; i < 3; i++) {
            const ox = this.player.x + Phaser.Math.Between(-130, 130);
            const oy = this.player.y + Phaser.Math.Between(-130, 130);
            const sword = this.physics.add.sprite(ox, oy, 'rocket_sword');
            sword.setScale(0.25).setDepth(5);
            sword.health = 30; sword.maxHealth = 30;
            sword.damage = 15; sword.speed = 100;
            sword.lastHitTime = 0;
            sword.splits = false; sword.shoots = false; sword.splitsInto = null; sword.hydra = false; sword.burrowed = false; sword.whips = false; sword.emitsGas = false;
            if (!this.anims.exists('rocket_sword_walk')) {
                this.anims.create({ key: 'rocket_sword_walk', frames: this.anims.generateFrameNumbers('rocket_sword', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
            }
            sword.play('rocket_sword_walk');
            this.enemies.add(sword);
        }
    },

    triggerMiniSpiderPhase2(mb) {
        mb.aiSpeed = (mb.aiSpeed ?? mb.speed ?? 95) * 2.32; // mirrors the 95→220 boost ratio from the original boss

        this.tweens.add({ targets: mb, alpha: 0.1, duration: 120, yoyo: true, repeat: 3 });

        const RING = 5; // scaled down from the original boss's ring of 20
        for (let i = 0; i < RING; i++) {
            const a  = (i / RING) * Math.PI * 2;
            const ox = mb.x + Math.cos(a) * 90;
            const oy = mb.y + Math.sin(a) * 90;
            const sword = this.physics.add.sprite(ox, oy, 'rocket_sword');
            sword.setScale(0.25).setDepth(5);
            sword.health = 30; sword.maxHealth = 30;
            sword.damage = 15; sword.speed = 155;
            sword.lastHitTime = 0;
            sword.splits = false; sword.shoots = false; sword.splitsInto = null; sword.hydra = false; sword.burrowed = false; sword.whips = false; sword.emitsGas = false;
            if (!this.anims.exists('rocket_sword_walk')) {
                this.anims.create({ key: 'rocket_sword_walk', frames: this.anims.generateFrameNumbers('rocket_sword', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
            }
            sword.play('rocket_sword_walk');
            this.enemies.add(sword);
        }
    },

    // ─── Carrot Scorpion mini-boss AI ─────────────────────────────────────────────

    updateMiniScorpionAI(mb) {
        if (!mb.active || mb.isCharging || mb.isStinging) return;
        const now = this.time.now;

        if (!mb.scorpionPhase) {
            mb.scorpionPhase    = 'chase';
            mb.scorpionSwitchAt = now + Phaser.Math.Between(3000, 8000);
            mb.wanderTarget     = null;
        }

        if (now >= mb.scorpionSwitchAt) {
            if (mb.scorpionPhase === 'chase') {
                mb.scorpionPhase    = 'wander';
                mb.wanderTarget     = this.pickScorpionWanderTarget();
                mb.scorpionSwitchAt = now + Phaser.Math.Between(15000, 25000);
            } else {
                mb.scorpionPhase    = 'chase';
                mb.wanderTarget     = null;
                mb.scorpionSwitchAt = now + Phaser.Math.Between(3000, 8000);
            }
        }

        if (mb.scorpionPhase === 'chase') {
            this.physics.moveToObject(mb, this.player, 220);
        } else {
            if (!mb.wanderTarget) mb.wanderTarget = this.pickScorpionWanderTarget();
            const dist = Phaser.Math.Distance.Between(mb.x, mb.y, mb.wanderTarget.x, mb.wanderTarget.y);
            if (dist < 40) {
                mb.wanderTarget = this.pickScorpionWanderTarget();
            } else {
                this.physics.moveTo(mb, mb.wanderTarget.x, mb.wanderTarget.y, 200);
            }
        }
    },

    scheduleMiniScorpionSting(mb) {
        if (!mb?.active) return;
        mb.miniStingTimer = this.time.delayedCall(Phaser.Math.Between(10000, 15000), () => {
            this.miniScorpionStingerBury(mb);
            this.scheduleMiniScorpionSting(mb);
        });
    },

    miniScorpionClawSwipe(mb) {
        if (!mb?.active || mb.isStinging) return;
        mb.isCharging = true;

        const angle = Phaser.Math.Angle.Between(mb.x, mb.y, this.player.x, this.player.y);
        const warn = this.add.graphics().setDepth(19);
        warn.fillStyle(0xff8800, 0.25);
        warn.fillTriangle(
            mb.x, mb.y,
            mb.x + Math.cos(angle - 0.5) * 160, mb.y + Math.sin(angle - 0.5) * 160,
            mb.x + Math.cos(angle + 0.5) * 160, mb.y + Math.sin(angle + 0.5) * 160,
        );
        this.tweens.add({ targets: warn, alpha: 0, delay: 140, duration: 200, onComplete: () => warn.destroy() });

        this.time.delayedCall(150, () => {
            if (!mb.active) return;
            const tx = this.player.x; const ty = this.player.y;
            this.physics.moveTo(mb, tx, ty, 480);
            this.tweens.add({ targets: mb, alpha: 0.4, duration: 80, yoyo: true });
            this.time.delayedCall(300, () => {
                if (mb.active) mb.body?.setVelocity(0, 0);
                mb.isCharging = false;
            });
        });
    },

    miniScorpionStingerBury(mb) {
        if (!mb?.active || mb.isStinging) return;
        mb.isStinging = true;
        mb.isCharging = true;
        if (mb.body) mb.body.setVelocity(0, 0);

        const buryTween = this.tweens.add({ targets: mb, alpha: 0.5, duration: 400, yoyo: true, loop: -1 });
        mb.setTint(0xff8800);

        // Reduced from the original boss's 20 moles + 10 thugs
        const spawnList = [
            ...Array(5).fill('mole'),
            ...Array(3).fill('thug'),
        ];
        Phaser.Utils.Array.Shuffle(spawnList);

        spawnList.forEach((type, i) => {
            this.time.delayedCall(i * 200, () => {
                if (!mb.active) return;
                const ox = this.player.x + Phaser.Math.Between(-220, 220);
                const oy = this.player.y + Phaser.Math.Between(-220, 220);

                if (type === 'mole') {
                    const mole = this.physics.add.sprite(ox, oy, 'carrot_mole');
                    mole.setScale(0.26).setDepth(5).setAlpha(0.35);
                    mole.health = 75; mole.maxHealth = 75;
                    mole.damage = 12; mole.speed = 0;
                    mole.lastHitTime = 0; mole.isUnderground = false;
                    mole.splits = false; mole.shoots = false; mole.splitsInto = null;
                    mole.hydra = false; mole.burrowed = true; mole.whips = false; mole.emitsGas = false;
                    mole.body.setSize(45, 30);
                    const mKey = 'carrot_mole_walk';
                    if (!this.anims.exists(mKey)) {
                        this.anims.create({ key: mKey, frames: this.anims.generateFrameNumbers('carrot_mole', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
                    }
                    mole.play(mKey);
                    const scheduleBurrow = () => {
                        if (!mole.active) return;
                        mole.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 10000), () => {
                            if (!mole.active) return;
                            mole.isUnderground = true;
                            mole.setAlpha(0.25); mole.body.setSize(30, 22.5); mole.speed = 80;
                            mole.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 5000), () => {
                                if (!mole.active) return;
                                mole.isUnderground = false;
                                mole.setAlpha(1); mole.body.setSize(45, 30); mole.speed = 0;
                                if (mole.body) mole.body.setVelocity(0, 0);
                                scheduleBurrow();
                            });
                        });
                    };
                    scheduleBurrow();
                    this.enemies.add(mole);
                } else {
                    const thug = this.physics.add.sprite(ox, oy, 'carrot_thug');
                    thug.setScale(0.30).setDepth(5);
                    thug.health = 300; thug.maxHealth = 300;
                    thug.damage = 15; thug.speed = 180;
                    thug.lastHitTime = 0;
                    thug.splits = false; thug.shoots = false; thug.splitsInto = null;
                    thug.hydra = false; thug.burrowed = false; thug.whips = false; thug.emitsGas = false;
                    thug.isUnderground = false; thug.isCharging = false;
                    const tKey = 'carrot_thug_walk';
                    if (!this.anims.exists(tKey)) {
                        this.anims.create({ key: tKey, frames: this.anims.generateFrameNumbers('carrot_thug', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
                    }
                    thug.play(tKey);
                    this.enemies.add(thug);
                }
            });
        });

        this.time.delayedCall(spawnList.length * 200 + 200, () => {
            if (!mb.active) return;
            buryTween.stop();
            mb.setAlpha(1).clearTint();
            mb.isStinging = false;
            mb.isCharging = false;
        });
    },

    // ─── Mulberry Mantis mini-boss AI ─────────────────────────────────────────────

    updateMiniMantisAI(mb) {
        if (mb.mantisPhase === 1 && mb.health <= mb.phaseBoundaries[0]) {
            mb.mantisPhase = 2;
            this.spawnMiniMantisPhase2Ring(mb);
        }

        if (!mb.active || mb.mantisVanishing || mb.mantisResting) return;
        if (mb.mantisPhase === 1 || mb.mantisChasing) {
            this.physics.moveToObject(mb, this.player, 210);
        }
    },

    scheduleMiniMantisVanish(mb) {
        if (!mb?.active) return;
        const chaseTime = mb.mantisPhase === 1
            ? Phaser.Math.Between(5000, 10000)
            : 0;
        mb.miniVanishTimer = this.time.delayedCall(chaseTime, () => {
            if (!mb?.active) return;
            this.miniMantisVanish(mb);
        });
    },

    miniMantisVanish(mb) {
        if (!mb?.active || mb.mantisChasing) return;
        mb.mantisVanishing = true;
        mb.isCharging       = true;
        mb.setVelocity(0, 0);

        this.tweens.add({ targets: mb, alpha: 0, duration: 200, onComplete: () => {
            if (!mb.active) return;
            mb.setVisible(false);
            mb.body.enable = false;
            mb.hpBarBg?.setVisible(false);
            mb.hpBar?.setVisible(false);
            mb.hpLabel?.setVisible(false);

            const hideDuration = Phaser.Math.Between(3000, 5000);
            this.time.delayedCall(hideDuration, () => {
                if (!mb.active) return;
                this.miniMantisReappear(mb);
            });
        }});
    },

    miniMantisReappear(mb) {
        if (!mb?.active) return;

        const angle  = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const offset = 80;
        mb.x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * offset, 64, 3136);
        mb.y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * offset, 64, 3136);

        mb.setVisible(true).setAlpha(0);
        mb.body.enable     = true;
        mb.mantisVanishing = false;
        mb.isCharging       = false;

        mb.hpBarBg?.setVisible(true);
        mb.hpBar?.setVisible(true);
        mb.hpLabel?.setVisible(true);

        this.tweens.add({ targets: mb, alpha: 1, duration: 150, onComplete: () => {
            if (!mb.active) return;
            this.time.delayedCall(400, () => {
                if (!mb.active) return;
                this.miniMantisStrike(mb);
            });
        }});
    },

    miniMantisStrike(mb) {
        if (!mb?.active) return;
        if (this.player.reviveInvincible) {
            mb.mantisResting = true;
            const restTime = mb.mantisPhase === 2 ? 2000 : 0;
            this.time.delayedCall(restTime, () => {
                if (!mb.active) return;
                mb.mantisResting = false;
                this.scheduleMiniMantisVanish(mb);
            });
            return;
        }

        this.tweens.add({ targets: mb, alpha: 0.2, duration: 80, yoyo: true, repeat: 1 });

        const dist = Phaser.Math.Distance.Between(mb.x, mb.y, this.player.x, this.player.y);
        if (dist < 80) {
            this.playerHealth -= 25;
            this.playerDamageFlash();
            this.updateHPBar();
            if (this.playerHealth <= 0) {
                this.playerHealth = 0;
                this.showDeathOverlay();
            }
        }

        if (mb.mantisPhase === 2) {
            mb.mantisVanishCycles++;
            mb.mantisResting = true;
            this.time.delayedCall(2000, () => {
                if (!mb.active) return;
                mb.mantisResting = false;
                if (mb.mantisVanishCycles >= mb.mantisChaseThreshold) {
                    mb.mantisVanishCycles   = 0;
                    mb.mantisChaseThreshold = Phaser.Math.Between(5, 25);
                    this.startMiniMantisChaseRun(mb);
                } else {
                    this.scheduleMiniMantisVanish(mb);
                }
            });
        } else {
            this.scheduleMiniMantisVanish(mb);
        }
    },

    startMiniMantisChaseRun(mb) {
        if (!mb?.active) return;
        mb.mantisChasing = true;
        const duration = Phaser.Math.Between(15000, 45000);
        mb.miniChaseRunTimer = this.time.delayedCall(duration, () => {
            if (!mb.active) return;
            mb.mantisChasing = false;
            mb.setVelocity(0, 0);
            this.scheduleMiniMantisVanish(mb);
        });
    },

    spawnMiniMantisPhase2Ring(mb) {
        const COUNT  = 6; // scaled down from the original boss's ring of 25
        const RADIUS = 350;
        for (let i = 0; i < COUNT; i++) {
            const angle = (i / COUNT) * Math.PI * 2;
            const cx = Phaser.Math.Clamp(mb.x + Math.cos(angle) * RADIUS, 64, 3136);
            const cy = Phaser.Math.Clamp(mb.y + Math.sin(angle) * RADIUS, 64, 3136);

            const cyclone = this.physics.add.sprite(cx, cy, 'spinach_cyclone');
            cyclone.setScale(0.30).setDepth(5);
            cyclone.health      = 200;
            cyclone.maxHealth   = 200;
            cyclone.damage      = 20;
            cyclone.speed       = 35;
            cyclone.lastHitTime = 0;
            cyclone.splits = false; cyclone.shoots = false; cyclone.splitsInto = null;
            cyclone.hydra = false; cyclone.burrowed = false; cyclone.whips = false;
            cyclone.emitsGas = false; cyclone.snakeWhip = false;
            cyclone.isWanderer = true;

            const animKey = 'spinach_cyclone_walk';
            if (!this.anims.exists(animKey)) {
                this.anims.create({ key: animKey, frames: this.anims.generateFrameNumbers('spinach_cyclone', { start: 0, end: 1 }), frameRate: 5, repeat: -1 });
            }
            cyclone.play(animKey);
            this.tweens.add({ targets: cyclone, angle: 360, duration: 900, loop: -1 });

            const scheduleSpawn = () => {
                if (!cyclone.active) return;
                cyclone.cycloneTimer = this.time.delayedCall(Phaser.Math.Between(6000, 12000), () => {
                    if (!cyclone.active) return;
                    const sx = cyclone.x + Phaser.Math.Between(-80, 80);
                    const sy = cyclone.y + Phaser.Math.Between(-80, 80);
                    const mini = this.physics.add.sprite(sx, sy, 'small_spinach');
                    mini.setScale(0.22).setDepth(5);
                    mini.health = 18; mini.maxHealth = 18;
                    mini.damage = 9;  mini.speed = 110;
                    mini.lastHitTime = 0;
                    mini.splits = false; mini.shoots = false; mini.splitsInto = null;
                    mini.hydra = false; mini.burrowed = false; mini.whips = false;
                    mini.emitsGas = false; mini.snakeWhip = false;
                    const miniAnim = 'small_spinach_walk';
                    if (!this.anims.exists(miniAnim)) {
                        this.anims.create({ key: miniAnim, frames: this.anims.generateFrameNumbers('small_spinach', { start: 0, end: 1 }), frameRate: 5, repeat: -1 });
                    }
                    mini.play(miniAnim);
                    this.physics.moveToObject(mini, this.player, mini.speed);
                    this.enemies.add(mini);
                    scheduleSpawn();
                });
            };
            scheduleSpawn();
            this.enemies.add(cyclone);
        }
    }


};
