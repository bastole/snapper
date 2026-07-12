import { playSfx, crossfadeBgm } from '../audio.js';
export const BossMethods = {

    tickTimer() {
        if (this.isCountdown) return;
        this.gameTime--;
        const mins = Math.floor(this.gameTime / 60);
        const secs = this.gameTime % 60;
        this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
        if (this.gameTime <= 0) {
            this.gameTimerEvent.remove();
            this.spawnBoss();
        }
    },

    // ─── Boss ────────────────────────────────────────────────────────────────────
    spawnBoss() {
        playSfx(this, 'sfx_boss_enters');

        // Stop all regular spawning immediately when the warning appears
        this.spawnTimer.remove();
        this.spawnRampTimer.remove();
        this.spawnTimer = null;
        this.spawnRampTimer = null;

        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        const bossCfg = this.level === 5
            ? { key: 'the_hand',        label: 'THE HAND',        health: 5000, damage: 30, scale: 0.8 }
            : this.level === 4
            ? { key: 'mulberry_mantis', label: 'MULBERRY MANTIS', health: 8000, damage: Phaser.Math.Between(5, 15), scale: 0.6 }
            : this.level === 3
            ? { key: 'carrot_scorpion', label: 'CARROT SCORPION', health: 18000, damage: 28, scale: 0.65 }
            : this.level === 2
            ? { key: 'rocket_spider',   label: 'ROCKET SPIDER',   health: 12000, damage: 25, scale: 0.6 }
            : { key: 'lettuce_beetle',  label: 'LETTUCE BEETLE',  health: 8000,  damage: 20, scale: 0.6, chargeDelay: 3500 };

        // Warning banner
        const warn = this.add.text(W / 2, H / 2 - 60, `⚠  ${bossCfg.label} APPROACHES  ⚠`, {
            fontSize: '22px', fontFamily: 'Arial Black, Arial',
            color: '#ff3333', stroke: '#000', strokeThickness: 5,
        }).setScrollFactor(0).setDepth(300).setOrigin(0.5);
        this.tweens.add({ targets: warn, alpha: 0, delay: 2500, duration: 600, onComplete: () => warn.destroy() });

        // Spawn boss after warning
        this.time.delayedCall(2800, () => {
            // Clear all existing XP insects and treasures; wormboxes stay
            this.bossSpawned = true;
            crossfadeBgm(this, this.level === 5 ? 'bgm_finalboss' : 'bgm_boss', 0.45, 1000);
            this.crickets.getChildren().slice().forEach(c => {
                if (c.specialType !== 'wormbox' && c.specialType !== 'fullbox') c.destroy();
            });

            const bossX = this.player.x + 450;
            const bossY = this.player.y;

            this.boss = this.physics.add.sprite(bossX, bossY, bossCfg.key);
            this.boss.setScale(bossCfg.scale);
            this.boss.setDepth(8);
            this.boss.health      = bossCfg.health;
            this.boss.maxHealth   = bossCfg.health;
            this.boss.damage      = bossCfg.damage;
            this.boss.lastHitTime = 0;
            this.boss.isCharging  = false;
            // Status effects (poison/fire/slow/immobilise) — see applyBossPoison/igniteBoss/slowBoss/immobilizeBoss
            this.boss.poisoned          = false;
            this.boss.burned            = false;
            this.boss.slowed            = false;
            this.boss.slowFactor        = 1;
            this.boss.bugCaught         = false;
            this.boss._nextImmobilizeAt = 0;

            const animKey = `${bossCfg.key}_walk`;
            if (!this.anims.exists(animKey)) {
                this.anims.create({ key: animKey, frames: this.anims.generateFrameNumbers(bossCfg.key, { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
            }
            this.boss.play(animKey);

            // Boss health bar (world-space)
            this.bossHpBarBg = this.add.rectangle(bossX, bossY + 30, 80, 10, 0x222222).setDepth(9);
            this.bossHpBar   = this.add.rectangle(bossX - 40, bossY + 30, 80, 8, 0xff2222).setDepth(10).setOrigin(0, 0.5);
            this.bossHpLabel = this.add.text(bossX, bossY - 48, bossCfg.label, {
                fontSize: '11px', fontFamily: 'Arial Black, Arial', color: '#ff4444',
            }).setDepth(10).setOrigin(0.5);

            // Top-bar boss health bar — replaces XP bar
            const W = this.cameras.main.width;
            this.xpBar.setVisible(false);
            this.xpBarBg.setVisible(false);
            this.topBossHpBarBg = this.add.rectangle(W / 2, 12, W - 40, 16, 0x440000).setScrollFactor(0).setDepth(100);
            this.topBossHpBar   = this.add.rectangle(20, 12, W - 40, 14, 0xff2222).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);
            this.topBossLabel   = this.add.text(W / 2, 12, bossCfg.label, {
                fontSize: '10px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
            }).setScrollFactor(0).setDepth(104).setOrigin(0.5, 0.5);

            // Damage + overlap
            this.physics.add.overlap(this.player, this.boss, this.bossHitPlayer, null, this);
            this.physics.add.overlap(this.boss, this.pupaGroup, (boss, mine) => { if (mine.explodeFn) mine.explodeFn(); });

            if (this.level === 5) {
                // The Hand: multi-phase boss — one continuous health bar covering all 4
                // phases, with divider lines instead of resetting to full each transition.
                // Each phase has its own HP pool (1500 / 2000 / 2000 / 3000), sized to that
                // pool exactly — a phase only ends once its own section is fully drained.
                const { total, boundaries } = this.computePhasedHealth([1500, 2000, 2000, 3000], true);
                this.boss.health      = total;
                this.boss.maxHealth   = total;
                this.boss.phaseBoundaries = boundaries;
                this.createBossPhaseLines(boundaries);
                this.boss.handPhase            = 1;
                this.boss.handImmobile         = false;
                this.boss.handWanderTarget     = null;
                this.boss.handPhaseTransitioned = false;
                this.boss.lastHitTime          = 0;
                this.handFireZones             = [];
                this.handMiniBossArray         = [];
                this.scheduleHandSlap();
            } else if (this.level === 4) {
                // Mulberry Mantis: chases at high speed; vanishes every 5–10s.
                // One continuous health bar covering both phases, with a divider line
                // instead of resetting to full at the phase-2 transition.
                const { total, boundaries } = this.computePhasedHealth([bossCfg.health, bossCfg.health]);
                this.boss.health      = total;
                this.boss.maxHealth   = total;
                this.boss.phaseBoundaries = boundaries;
                this.createBossPhaseLines(boundaries);
                this.boss.mantisPhase          = 1;
                this.boss.mantisVanishing      = false;
                this.boss.mantisResting        = false;
                this.boss.mantisChasing        = false;
                this.boss.mantisVanishCycles   = 0;
                this.boss.mantisChaseThreshold = Phaser.Math.Between(5, 25);
                this.scheduleMantisVanish();
            } else if (this.level === 3) {
                // Carrot Scorpion: chases player; claw swipe every 4s; stinger bury every 8–14s
                this.boss.isStinging = false;
                this.bossChargeTimer = this.time.addEvent({ delay: 4000, callback: this.scorpionClawSwipe, callbackScope: this, loop: true });
                const scheduleStinger = () => {
                    this.bossLegSlamTimer = this.time.delayedCall(Phaser.Math.Between(10000, 15000), () => {
                        this.scorpionStingerBury();
                        scheduleStinger();
                    });
                };
                scheduleStinger();
            } else if (this.level === 2) {
                // Rocket Spider: wanders/circles — no charge; leg slam every 5–10s
                this.boss.aiMode         = 'circle';
                this.boss.aiSpeed        = 95;
                this.boss.phaseTriggered = false;
                const scheduleNextSlam = () => {
                    this.bossLegSlamTimer = this.time.delayedCall(Phaser.Math.Between(5000, 10000), () => {
                        this.bossLegSlam();
                        scheduleNextSlam();
                    });
                };
                scheduleNextSlam();
            } else {
                // Lettuce Beetle: simple charge attack
                this.bossChargeTimer = this.time.addEvent({ delay: bossCfg.chargeDelay, callback: this.bossCharge, callbackScope: this, loop: true });
            }

            this.timerText.setVisible(false);
        });
    },

    // Bosses with health-reset phases instead get one continuous bar sized to cover every
    // phase, with vertical divider lines marking where each phase transition occurs — the
    // bar just keeps draining through the marks instead of snapping back to full.
    // `phaseHealths` gives each phase's own pool (they don't need to match), so each bar
    // section is sized to its actual phase health. By default (fullDepletion = false), each
    // non-final phase historically ended (and reset) once 90% of its health was dealt, to
    // preserve old total damage-to-kill values; pass fullDepletion = true to instead have a
    // phase end only once its own pool is fully drained (its bar section's true size). The
    // final phase always drains all the way to 0 either way.
    computePhasedHealth(phaseHealths, fullDepletion = false) {
        const segments = fullDepletion
            ? phaseHealths.slice()
            : phaseHealths.map((h, i) => i < phaseHealths.length - 1 ? h * 0.9 : h);
        const total = segments.reduce((a, b) => a + b, 0);
        const boundaries = [];
        let cumulative = 0;
        for (let i = 0; i < segments.length - 1; i++) {
            cumulative += segments[i];
            boundaries.push(total - cumulative);
        }
        return { total, boundaries };
    },

    createBossPhaseLines(boundaries) {
        this.bossPhaseLines = boundaries.map(() =>
            this.add.rectangle(this.boss.x, this.boss.y + 30, 2, 12, 0xbb66ff, 0.9).setDepth(11)
        );
        const W = this.cameras.main.width;
        this.topBossPhaseLines = boundaries.map(() =>
            this.add.rectangle(W / 2, 12, 2, 16, 0xbb66ff, 0.9).setScrollFactor(0).setDepth(103)
        );
    },

    updateBossHealthBar() {
        if (!this.boss || !this.bossHpBar) return;
        const pct = Math.max(0, this.boss.health / this.boss.maxHealth);
        this.bossHpBar.width    = 80 * pct;
        this.bossHpBarBg.x      = this.boss.x;
        this.bossHpBarBg.y      = this.boss.y + 30;
        this.bossHpBar.x        = this.boss.x - 40;
        this.bossHpBar.y        = this.boss.y + 30;
        this.bossHpLabel.x      = this.boss.x;
        this.bossHpLabel.y      = this.boss.y - 48;
        if (this.topBossHpBar) {
            const W = this.cameras.main.width;
            this.topBossHpBar.width = (W - 40) * pct;
        }
        this.bossPhaseLines.forEach((line, i) => {
            const f = this.boss.phaseBoundaries[i] / this.boss.maxHealth;
            line.x = this.boss.x - 40 + f * 80;
            line.y = this.boss.y + 30;
        });
        if (this.topBossPhaseLines.length) {
            const W = this.cameras.main.width;
            this.topBossPhaseLines.forEach((line, i) => {
                const f = this.boss.phaseBoundaries[i] / this.boss.maxHealth;
                line.x = 20 + f * (W - 40);
            });
        }
    },

    bossHitPlayer(player, boss) {
        if (player.reviveInvincible) return;
        const now = this.time.now;
        if (now - boss.lastHitTime < 1000) return;
        boss.lastHitTime = now;
        this.playerHealth -= boss.damage;
        this.updateHPBar();
        this.playerDamageFlash();
        if (this.inflateActive) this.inflateKnockback();
        if (this.level === 2) this.applyPoison();
        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            this.updateHPBar();
            this.showDeathOverlay();
        }
    },

    bossCharge() {
        if (!this.boss || !this.boss.active || this.boss.isCharging) return;
        this.boss.isCharging = true;

        // Freeze and lock target position right now
        this.boss.setVelocity(0, 0);
        const targetX = this.player.x;
        const targetY = this.player.y;

        // Red danger zone: wide line from boss to player showing charge path
        const warn = this.add.graphics().setDepth(18);
        warn.fillStyle(0xff0000, 0.25);
        const angle = Math.atan2(targetY - this.boss.y, targetX - this.boss.x);
        const dist  = Phaser.Math.Distance.Between(this.boss.x, this.boss.y, targetX, targetY) + 60;
        // Draw as a rotated rectangle centred on the charge path
        warn.fillRect(0, -30, dist, 60);
        warn.setPosition(this.boss.x, this.boss.y);
        warn.setRotation(angle);

        // Flash boss red to signal incoming charge
        this.tweens.add({ targets: this.boss, alpha: 0.3, duration: 75, yoyo: true, repeat: 1 });

        // After 150ms freeze, launch the charge and clear the warning
        this.time.delayedCall(150, () => {
            warn.destroy();
            if (!this.boss?.active) return;
            const chargeAngle = Math.atan2(targetY - this.boss.y, targetX - this.boss.x);
            this.boss.setVelocity(Math.cos(chargeAngle) * 320, Math.sin(chargeAngle) * 320);
            this.time.delayedCall(800, () => {
                if (!this.boss?.active) return;
                this.boss.setVelocity(0, 0);
                this.boss.isCharging = false;
            });
        });
    },

    updateCarrotScorpionAI() {
        const boss = this.boss;
        if (!boss?.active || boss.isCharging || boss.isStinging) return;
        const now = this.time.now;

        // Initialise phase state on first call
        if (!boss.scorpionPhase) {
            boss.scorpionPhase    = 'chase';
            boss.scorpionSwitchAt = now + Phaser.Math.Between(3000, 8000);
            boss.wanderTarget     = null;
        }

        if (now >= boss.scorpionSwitchAt) {
            if (boss.scorpionPhase === 'chase') {
                boss.scorpionPhase    = 'wander';
                boss.wanderTarget     = this.pickScorpionWanderTarget();
                boss.scorpionSwitchAt = now + Phaser.Math.Between(15000, 25000);
            } else {
                boss.scorpionPhase    = 'chase';
                boss.wanderTarget     = null;
                boss.scorpionSwitchAt = now + Phaser.Math.Between(3000, 8000);
            }
        }

        // Immobilised: movement is skipped for the frame, but phase timers/attacks above
        // keep running exactly as before.
        if (boss.bugCaught) { boss.setVelocity(0, 0); return; }
        const slow = boss.slowFactor ?? 1;

        if (boss.scorpionPhase === 'chase') {
            this.physics.moveToObject(boss, this.player, 220 * slow);
        } else {
            // Wander: keep picking new waypoints until the phase timer runs out
            if (!boss.wanderTarget) {
                boss.wanderTarget = this.pickScorpionWanderTarget();
            }
            const dist = Phaser.Math.Distance.Between(boss.x, boss.y, boss.wanderTarget.x, boss.wanderTarget.y);
            if (dist < 40) {
                boss.wanderTarget = this.pickScorpionWanderTarget();
            } else {
                this.physics.moveTo(boss, boss.wanderTarget.x, boss.wanderTarget.y, 200 * slow);
            }
        }
    },

    pickScorpionWanderTarget() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist  = Phaser.Math.Between(100, 300);
        return {
            x: Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 64, 3136),
            y: Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 64, 3136),
        };
    },

    pickCycloneWanderTarget() {
        const cam = this.cameras.main;
        return {
            x: Phaser.Math.Clamp(cam.scrollX + Phaser.Math.Between(60, cam.width  - 60), 64, 3136),
            y: Phaser.Math.Clamp(cam.scrollY + Phaser.Math.Between(60, cam.height - 60), 64, 3136),
        };
    },

    updateRocketSpiderAI() {
        const boss = this.boss;
        const now  = this.time.now;
        const speed = (boss.aiSpeed ?? 95) * (boss.slowFactor ?? 1);

        // Switch AI mode every 2–4 seconds
        if (!boss.aiSwitchAt || now >= boss.aiSwitchAt) {
            const modes = ['circle', 'circle', 'wander', 'chase'];
            boss.aiMode = Phaser.Utils.Array.GetRandom(modes);
            if (boss.aiMode === 'wander') {
                const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
                boss.wanderVX = Math.cos(a) * speed;
                boss.wanderVY = Math.sin(a) * speed;
            }
            boss.aiSwitchAt = now + Phaser.Math.Between(2000, 4000);
        }

        // Immobilised: skip movement for the frame, but AI-mode bookkeeping above and any
        // scheduled attacks keep running exactly as before.
        if (boss.bugCaught) { boss.setVelocity(0, 0); return; }

        if (boss.aiMode === 'circle') {
            const dx   = boss.x - this.player.x;
            const dy   = boss.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const targetDist = 190;
            // Orbit clockwise (tangent direction)
            const tx = -dy / dist;
            const ty =  dx / dist;
            // Radial nudge to hold orbit distance
            const radial = (dist - targetDist) / 120;
            const rx = -(dx / dist) * radial;
            const ry = -(dy / dist) * radial;
            boss.setVelocity((tx + rx) * speed, (ty + ry) * speed);
        } else if (boss.aiMode === 'wander') {
            boss.setVelocity(boss.wanderVX, boss.wanderVY);
        } else { // chase
            this.physics.moveToObject(boss, this.player, speed * 0.7);
        }
    },

    bossLegSlam() {
        if (!this.boss?.active) return;
        // Brief flash warning on boss
        this.tweens.add({ targets: this.boss, alpha: 0.3, duration: 100, yoyo: true });
        // Spawn 3 Rocket Swords near the player
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

    scorpionClawSwipe() {
        if (!this.boss?.active || this.boss.isStinging) return;
        this.boss.isCharging = true;

        // Orange warning zone in front of boss
        const angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        const warn = this.add.graphics().setDepth(19);
        warn.fillStyle(0xff8800, 0.25);
        warn.fillTriangle(
            this.boss.x, this.boss.y,
            this.boss.x + Math.cos(angle - 0.5) * 160, this.boss.y + Math.sin(angle - 0.5) * 160,
            this.boss.x + Math.cos(angle + 0.5) * 160, this.boss.y + Math.sin(angle + 0.5) * 160,
        );
        this.tweens.add({ targets: warn, alpha: 0, delay: 140, duration: 200, onComplete: () => warn.destroy() });

        this.time.delayedCall(150, () => {
            if (!this.boss?.active) return;
            const tx = this.player.x; const ty = this.player.y;
            this.physics.moveTo(this.boss, tx, ty, 480);
            this.tweens.add({ targets: this.boss, alpha: 0.4, duration: 80, yoyo: true });
            this.time.delayedCall(300, () => {
                if (this.boss?.active) this.boss.body?.setVelocity(0, 0);
                this.boss.isCharging = false;
            });
        });
    },

    scorpionStingerBury() {
        if (!this.boss?.active || this.boss.isStinging) return;
        this.boss.isStinging = true;
        if (this.boss.body) this.boss.body.setVelocity(0, 0);

        const buryTween = this.tweens.add({ targets: this.boss, alpha: 0.5, duration: 400, yoyo: true, loop: -1 });
        this.boss.setTint(0xff8800);

        // Spawn 20 Carrot Moles + 10 Carrot Thugs spread over 6s (every 200ms)
        const spawnList = [
            ...Array(20).fill('mole'),
            ...Array(10).fill('thug'),
        ];
        Phaser.Utils.Array.Shuffle(spawnList);

        spawnList.forEach((type, i) => {
            this.time.delayedCall(i * 200, () => {
                if (!this.boss?.active) return;
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
                    // Start the burrow cycle on this mole
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

        // End bury after 6.2s (all 30 enemies spawned + small buffer)
        this.time.delayedCall(6200, () => {
            if (!this.boss?.active) return;
            buryTween.stop();
            this.boss.setAlpha(1).clearTint();
            this.boss.isStinging = false;
        });
    },

    updateMulberryMantisAI() {
        const boss = this.boss;
        if (!boss?.active || boss.mantisVanishing || boss.mantisResting) return;
        if (boss.bugCaught) { boss.setVelocity(0, 0); return; }
        if (boss.mantisPhase === 1 || boss.mantisChasing) {
            this.physics.moveToObject(boss, this.player, 210 * (boss.slowFactor ?? 1));
        }
    },

    scheduleMantisVanish() {
        if (!this.boss?.active) return;
        const boss = this.boss;

        // In phase 2 the mantis only rests then vanishes again; in phase 1 it chases first
        const chaseTime = boss.mantisPhase === 1
            ? Phaser.Math.Between(5000, 10000)
            : 0; // phase 2: vanish immediately after rest

        this.bossChargeTimer = this.time.delayedCall(chaseTime, () => {
            if (!boss?.active) return;
            this.mantisVanish();
        });
    },

    mantisVanish() {
        const boss = this.boss;
        if (!boss?.active || boss.mantisChasing) return;

        boss.mantisVanishing = true;
        boss.setVelocity(0, 0);

        // Flash out then go invisible
        this.tweens.add({ targets: boss, alpha: 0, duration: 200, onComplete: () => {
            if (!this.boss) return;
            boss.setActive(false).setVisible(false);
            boss.body.enable = false;

            // Hide the world-space health bar label while vanished
            this.bossHpBarBg?.setVisible(false);
            this.bossHpBar?.setVisible(false);
            this.bossHpLabel?.setVisible(false);
            this.bossPhaseLines.forEach(l => l.setVisible(false));

            // Wait 3–5s then reappear next to player
            const hideDuration = Phaser.Math.Between(3000, 5000);
            this.time.delayedCall(hideDuration, () => {
                // this.boss is nulled out by killBoss; check that before reappearing
                if (!this.boss) return;
                this.mantisReappear();
            });
        }});
    },

    mantisReappear() {
        const boss = this.boss;
        if (!boss) return;

        // Reappear just off to one side of the player
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const offset = 80;
        boss.x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * offset, 64, 3136);
        boss.y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * offset, 64, 3136);

        boss.setActive(true).setVisible(true).setAlpha(0);
        boss.body.enable = true;
        boss.mantisVanishing = false;

        this.bossHpBarBg?.setVisible(true);
        this.bossHpBar?.setVisible(true);
        this.bossHpLabel?.setVisible(true);
        this.bossPhaseLines.forEach(l => l.setVisible(true));

        // Flash in
        this.tweens.add({ targets: boss, alpha: 1, duration: 150, onComplete: () => {
            if (!this.boss) return;
            // Wait 400ms then strike
            this.time.delayedCall(400, () => {
                if (!this.boss) return;
                this.mantisStrike();
            });
        }});
    },

    mantisStrike() {
        const boss = this.boss;
        if (!boss?.active) return;
        if (this.player.reviveInvincible) {
            // Still schedule next cycle even if strike was blocked
            boss.mantisResting = true;
            const restTime = boss.mantisPhase === 2 ? 2000 : 0;
            this.time.delayedCall(restTime, () => {
                if (!this.boss) return;
                this.boss.mantisResting = false;
                this.scheduleMantisVanish();
            });
            return;
        }

        // Red flash warning
        this.tweens.add({ targets: boss, alpha: 0.2, duration: 80, yoyo: true, repeat: 1 });

        // Deal 25 damage if player is still nearby
        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
        if (dist < 80) {
            this.playerHealth -= 25;
            this.playerDamageFlash();
            this.updateHPBar();
            if (this.playerHealth <= 0) {
                this.playerHealth = 0;
                this.showDeathOverlay();
            }
        }

        if (boss.mantisPhase === 2) {
            boss.mantisVanishCycles++;
            boss.mantisResting = true;
            this.time.delayedCall(2000, () => {
                if (!this.boss) return;
                this.boss.mantisResting = false;
                if (this.boss.mantisVanishCycles >= this.boss.mantisChaseThreshold) {
                    this.boss.mantisVanishCycles   = 0;
                    this.boss.mantisChaseThreshold = Phaser.Math.Between(5, 25);
                    this.startMantisChaseRun();
                } else {
                    this.scheduleMantisVanish();
                }
            });
        } else {
            // Phase 1: immediately resume chasing; scheduleMantisVanish handles the next 5–10s window
            this.scheduleMantisVanish();
        }
    },

    startMantisChaseRun() {
        const boss = this.boss;
        if (!boss?.active) return;
        boss.mantisChasing = true;
        const duration = Phaser.Math.Between(15000, 45000);
        this.time.delayedCall(duration, () => {
            if (!this.boss) return;
            this.boss.mantisChasing = false;
            this.boss.setVelocity(0, 0);
            this.scheduleMantisVanish();
        });
    },

    damageBoss(amount) {
        if (!this.boss || !this.boss.active) return;
        this.playEnemyHurtSfx();
        this.damageDealt += amount; this.boss.health -= amount;
        this.tweens.add({ targets: this.boss, alpha: 0.2, duration: 80, yoyo: true });
        this.updateBossHealthBar();
        if (this.level === 4 && this.boss.mantisPhase === 1 && this.boss.health <= this.boss.phaseBoundaries[0]) {
            this.boss.mantisPhase = 2;
            this.spawnMantisPhase2Ring();
        }
        if (this.level === 2 && !this.boss.phaseTriggered && this.boss.health <= this.boss.maxHealth * 0.5) {
            this.boss.phaseTriggered = true;
            this.triggerRocketSpiderPhase2();
        }
        if (this.level === 5 && this.boss && !this.boss.handPhaseTransitioned) {
            const nextBoundary = this.boss.phaseBoundaries[this.boss.handPhase - 1];
            if (this.boss.handPhase < 4 && nextBoundary !== undefined && this.boss.health <= nextBoundary) {
                this.boss.handPhaseTransitioned = true;
                this.triggerHandNextPhase();
                return;
            }
        }
        if (this.boss.health <= 0) this.killBoss();
    },

    triggerRocketSpiderPhase2() {
        const boss = this.boss;
        boss.aiSpeed = 220; // player base 160 + 2× Angry (+30 each)

        // Red flash warning
        this.tweens.add({ targets: boss, alpha: 0.1, duration: 120, yoyo: true, repeat: 3 });

        // Ring of 20 Rocket Swords around the boss
        for (let i = 0; i < 20; i++) {
            const a  = (i / 20) * Math.PI * 2;
            const ox = boss.x + Math.cos(a) * 90;
            const oy = boss.y + Math.sin(a) * 90;
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

    spawnMantisPhase2Ring() {
        const COUNT  = 25;
        const RADIUS = 900;
        for (let i = 0; i < COUNT; i++) {
            const angle = (i / COUNT) * Math.PI * 2;
            const cx = Phaser.Math.Clamp(this.boss.x + Math.cos(angle) * RADIUS, 64, 3136);
            const cy = Phaser.Math.Clamp(this.boss.y + Math.sin(angle) * RADIUS, 64, 3136);

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

            // Each cyclone periodically spawns Small Spinach
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
    },

    killBoss() {
        if (this.bossChargeTimer)    this.bossChargeTimer.remove();
        if (this.bossLegSlamTimer)   this.bossLegSlamTimer.remove();
        if (this.handSlapTimer)      this.handSlapTimer.remove();
        if (this.handTeleportTimer)  this.handTeleportTimer.remove();
        if (this.handRingTimer)      this.handRingTimer.remove();
        if (this.handBossSpawnTimer) this.handBossSpawnTimer.remove();
        if (this.handRingsTimer)     this.handRingsTimer.remove();
        if (this.handVacuumTimer)    this.handVacuumTimer.remove();
        if (this.handProjTimer)      this.handProjTimer.remove();
        this.handVacuumActive = false;
        this.handVacuumOverlay?.destroy(); this.handVacuumOverlay = null;
        this.handFireZones?.forEach(z => { z.damageTimer?.remove(); z.graphics?.destroy(); });
        this.handFireZones = [];
        this.handMiniBossArray?.forEach(b => {
            if (!b.active) return;
            this.cleanupMiniBossTimers(b);
            b.hpBarBg?.destroy(); b.hpBar?.destroy(); b.hpLabel?.destroy(); b.phaseLine?.destroy();
            b.destroy();
        });
        this.handMiniBossArray = [];
        this.bossHpBar?.destroy();
        this.bossHpBarBg?.destroy();
        this.bossHpLabel?.destroy();
        this.bossPhaseLines.forEach(l => l.destroy());    this.bossPhaseLines    = [];
        this.topBossPhaseLines.forEach(l => l.destroy()); this.topBossPhaseLines = [];
        if (this.topBossHpBar)   { this.topBossHpBar.width = 0; }
        if (this.topBossLabel)   { this.topBossLabel.setText('BOSS DEFEATED'); }
        this.timerText.setVisible(true);
        this.boss.destroy();
        this.boss = null;
        this.showLevelClear();
    },


};
