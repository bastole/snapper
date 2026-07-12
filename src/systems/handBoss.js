export const HandBossMethods = {

    // ─── The Hand Boss AI ────────────────────────────────────────────────────────

    updateHandAI() {
        const boss = this.boss;
        if (!boss?.active) return;

        // Always track mini-boss bars every frame regardless of immobility
        this.handMiniBossArray?.forEach(mb => {
            if (!mb.active) return;
            if (mb.hpBarBg) {
                mb.hpBarBg.setPosition(mb.x, mb.y + 30);
                mb.hpBar.x = mb.x - 30;
                mb.hpBar.y = mb.y + 30;
                mb.hpBar.width = 60 * Math.max(0, mb.health / mb.maxHealth);
                mb.hpLabel.setPosition(mb.x, mb.y - 44);
                if (mb.phaseLine) {
                    const f = mb.phaseBoundaries[0] / mb.maxHealth;
                    mb.phaseLine.setPosition(mb.x - 30 + f * 60, mb.y + 30);
                }
            }
        });

        // Mini-bosses keep fighting independently even while The Hand itself is immobile
        // (mid-slap, teleporting, vacuuming, etc.) — identical to their original level boss.
        this.handMiniBossArray?.forEach(mb => {
            if (!mb.active) return;
            switch (mb.miniType) {
                case 'lettuce_beetle':  this.updateMiniBeetleAI(mb);   break;
                case 'rocket_spider':   this.updateMiniSpiderAI(mb);   break;
                case 'carrot_scorpion': this.updateMiniScorpionAI(mb); break;
                case 'mulberry_mantis': this.updateMiniMantisAI(mb);   break;
                default: this.physics.moveToObject(mb, this.player, mb.speed ?? 90);
            }
        });

        // Vacuum: continuously override everyone's velocity every frame for the whole
        // duration, since their own AI would otherwise re-claim it the very next frame.
        if (this.handVacuumActive) {
            const vacTargets = [
                ...this.enemies.getChildren().filter(e => e.active && !e.isBossMini),
                ...(this.handMiniBossArray?.filter(b => b.active) ?? []),
            ];
            vacTargets.forEach(e => { if (e.body) this.physics.moveTo(e, boss.x, boss.y, 600); });
        }

        if (boss.handImmobile) return;
        // Player-inflicted immobilise only stops wander movement — supermoves are gated
        // by handImmobile above, not this — so they still fire on schedule.
        if (boss.bugCaught) { boss.setVelocity(0, 0); return; }

        if (!boss.handWanderTarget) boss.handWanderTarget = this.pickHandWanderTarget();
        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, boss.handWanderTarget.x, boss.handWanderTarget.y);
        if (dist < 40) {
            boss.handWanderTarget = this.pickHandWanderTarget();
        } else {
            this.physics.moveTo(boss, boss.handWanderTarget.x, boss.handWanderTarget.y, 200 * this.getHandSpeedMultiplier() * (boss.slowFactor ?? 1));
        }
    },

    // The Hand gets 20% faster with each phase it enters (phase 1 = baseline)
    getHandSpeedMultiplier() {
        return 1.2 ** ((this.boss?.handPhase ?? 1) - 1);
    },

    pickHandWanderTarget() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist  = Phaser.Math.Between(100, 300);
        return {
            x: Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 64, 3136),
            y: Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 64, 3136),
        };
    },

    scheduleHandSlap() {
        if (!this.boss?.active) return;
        this.handSlapTimer = this.time.delayedCall(Phaser.Math.Between(1000, 20000), () => {
            this.doHandSlap();
        });
    },

    doHandSlap() {
        const boss = this.boss;
        if (!boss?.active) return;

        boss.handImmobile = true;
        if (boss.body) boss.body.setVelocity(0, 0);

        const angle    = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
        const halfArc  = Math.PI / 2; // 90° each side = 180° total
        const radius   = 120;
        const g = this.add.graphics().setDepth(20);
        g.fillStyle(0xff8800, 0.5);
        g.slice(boss.x, boss.y, radius, angle - halfArc, angle + halfArc);
        g.fillPath();
        this.tweens.add({ targets: g, alpha: 0, duration: 600, onComplete: () => g.destroy() });

        // Damage player if within the arc
        const pDist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
        if (pDist <= radius && !this.player.reviveInvincible) {
            const pAngle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
            if (Math.abs(Phaser.Math.Angle.Wrap(pAngle - angle)) <= halfArc) {
                this.playerHealth -= 30;
                this.updateHPBar();
                this.playerDamageFlash();
                if (this.inflateActive) this.inflateKnockback();
                if (this.playerHealth <= 0) {
                    this.playerHealth = 0;
                    this.showDeathOverlay();
                }
            }
        }

        this.time.delayedCall(1500, () => {
            if (boss.active) boss.handImmobile = false;
            this.scheduleHandSlap();
        });
    },

    triggerHandNextPhase() {
        const boss = this.boss;
        if (!boss) return;
        boss.handPhase++;
        this.tweens.add({ targets: boss, alpha: 0.1, duration: 200, yoyo: true, repeat: 2 });

        // Freeze completely for 3s before the new phase's behaviour kicks in — the only
        // motion visible is a violent trembling in place, no wandering/attacking.
        boss.handImmobile = true;
        boss.setVelocity(0, 0);
        const baseX = boss.x, baseY = boss.y;
        const trembleTimer = this.time.addEvent({
            delay: 40, loop: true,
            callback: () => {
                if (!boss.active) return;
                boss.x = baseX + Phaser.Math.Between(-3, 3);
                boss.y = baseY + Phaser.Math.Between(-3, 3);
            },
        });

        const phase = boss.handPhase;
        this.time.delayedCall(3000, () => {
            trembleTimer.remove();
            if (!boss.active) return;
            boss.x = baseX;
            boss.y = baseY;
            boss.handImmobile = false;
            boss.handPhaseTransitioned = false;
            if (phase === 2) this.triggerHandPhase2();
            if (phase === 3) this.triggerHandPhase3();
            if (phase === 4) this.triggerHandPhase4();
        });
    },

    triggerHandPhase2() {
        this.scheduleHandTeleport();
    },

    triggerHandPhase3() {
        // First teleport immediately with the salad bowl
        this.doHandTeleport(true);
        this.scheduleHandPhase3Ring();
    },

    triggerHandPhase4() {
        this.scheduleHandBossRespawn();
        this.scheduleHandPhase4Rings();
        this.scheduleHandVacuum();
        this.scheduleHandPhase4Projectiles();
    },

    // Every 5s, a 1/4 chance to fire a ring of 10 projectiles — phase 4 only
    scheduleHandPhase4Projectiles() {
        if (!this.boss?.active) return;
        this.handProjTimer = this.time.addEvent({
            delay: 5000, loop: true,
            callback: () => { if (Math.random() < 0.25) this.doHandPhase4Projectiles(); },
        });
    },

    doHandPhase4Projectiles() {
        const boss = this.boss;
        if (!boss?.active) return;

        const COUNT = 10;
        for (let i = 0; i < COUNT; i++) {
            const a    = (i / COUNT) * Math.PI * 2;
            const proj = this.physics.add.image(boss.x, boss.y, 'iceberg_lettuce');
            proj.setScale(0.18).setDepth(7).setTint(0xff8800);
            proj.setVelocity(Math.cos(a) * 220, Math.sin(a) * 220);
            proj.damage = 15;
            this.physics.add.overlap(proj, this.player, () => {
                if (!proj.active || this.player.reviveInvincible) return;
                this.playerHealth -= proj.damage;
                this.updateHPBar();
                this.playerDamageFlash();
                if (this.inflateActive) this.inflateKnockback();
                if (this.playerHealth <= 0) { this.playerHealth = 0; this.showDeathOverlay(); }
                proj.destroy();
            });
            this.scheduleProjectileDespawn(proj, 5000);
        }
    },

    scheduleHandTeleport() {
        if (!this.boss?.active) return;
        this.handTeleportTimer = this.time.delayedCall(Phaser.Math.Between(5000, 25000), () => {
            this.doHandTeleport();
        });
    },

    doHandTeleport(forceSalad = false) {
        const boss = this.boss;
        if (!boss?.active) return;

        boss.handImmobile = true;
        if (boss.body) boss.body.setVelocity(0, 0);

        // Pick destination close to player so attacks land in view
        const tpAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const tpDist  = Phaser.Math.Between(250, 450);
        const newX = Phaser.Math.Clamp(this.player.x + Math.cos(tpAngle) * tpDist, 64, 3136);
        const newY = Phaser.Math.Clamp(this.player.y + Math.sin(tpAngle) * tpDist, 64, 3136);

        this.tweens.add({ targets: boss, alpha: 0, duration: 250, onComplete: () => {
            if (!boss.active) return;
            boss.setPosition(newX, newY);
            boss.handWanderTarget = null;

            // Roll weapon
            const roll = Math.random();
            let weapon = null;
            if (forceSalad)       weapon = 'salad';
            else if (roll < 0.15) weapon = 'tweezers';
            else if (roll < 0.30) weapon = 'heatlamp';
            else if (roll < 0.45) weapon = 'spray';
            boss.handWeapon = weapon;

            this.tweens.add({ targets: boss, alpha: 1, duration: 250 });

            // Stay immobile for 2s then act
            this.time.delayedCall(2000, () => {
                if (!boss.active) return;
                boss.handImmobile = false;
                if (weapon === 'tweezers') this.doTweezerCharge();
                else if (weapon === 'heatlamp') this.doHeatLamp();
                else if (weapon === 'spray')    this.doSprayBottle();
                else if (weapon === 'salad')    this.doSaladBowl();
                boss.handWeapon = null;
                // Schedule next teleport
                this.scheduleHandTeleport();
            });
        }});
    },

    doTweezerCharge() {
        const boss = this.boss;
        if (!boss?.active) return;

        boss.handImmobile = true;
        boss.body.setVelocity(0, 0);

        const targetX = this.player.x;
        const targetY = this.player.y;
        const angle   = Math.atan2(targetY - boss.y, targetX - boss.x);
        const dist    = Phaser.Math.Distance.Between(boss.x, boss.y, targetX, targetY) + 60;

        // Red rectangle telegraph — same style as Lettuce Beetle
        const warn = this.add.graphics().setDepth(18);
        warn.fillStyle(0xff0000, 0.25);
        warn.fillRect(0, -30, dist, 60);
        warn.setPosition(boss.x, boss.y);
        warn.setRotation(angle);
        this.tweens.add({ targets: boss, alpha: 0.3, duration: 75, yoyo: true, repeat: 1 });

        // Short 100ms react window, then charge
        this.time.delayedCall(100, () => {
            warn.destroy();
            if (!boss.active) return;
            const chargeAngle = Math.atan2(targetY - boss.y, targetX - boss.x);
            const chargeSpeed = 420 * this.getHandSpeedMultiplier();
            boss.body.setVelocity(Math.cos(chargeAngle) * chargeSpeed, Math.sin(chargeAngle) * chargeSpeed);
            this.time.delayedCall(450, () => {
                if (!boss.active) return;
                boss.body.setVelocity(0, 0);
                boss.handImmobile = false;
            });
        });
    },

    doHeatLamp() {
        const boss = this.boss;
        if (!boss?.active) return;

        boss.handImmobile = true;
        if (boss.body) boss.body.setVelocity(0, 0);

        // Spin 360° and drop 10 fire zones
        const COUNT  = 10;
        const RING_R = 90;
        for (let i = 0; i < COUNT; i++) {
            const a  = (i / COUNT) * Math.PI * 2;
            const fx = boss.x + Math.cos(a) * RING_R;
            const fy = boss.y + Math.sin(a) * RING_R;
            this.spawnHandFireZone(fx, fy, 55);
        }

        this.tweens.add({ targets: boss, angle: boss.angle + 360, duration: 1200, onComplete: () => {
            if (boss.active) boss.handImmobile = false;
        }});
    },

    spawnHandFireZone(x, y, radius) {
        const g = this.add.graphics().setDepth(12);
        g.fillStyle(0xff5500, 0.55);
        g.fillCircle(x, y, radius);

        // lastDamageTick starts at 0 so updateHandFireZones() ticks it almost immediately
        // if the player is already standing inside when it spawns.
        const zone = { x, y, radius, graphics: g, lastDamageTick: 0 };
        this.handFireZones.push(zone);

        // Fade and destroy after 6s
        this.tweens.add({ targets: g, alpha: 0.2, delay: 4000, duration: 2000, onComplete: () => {
            g.destroy();
            const idx = this.handFireZones.indexOf(zone);
            if (idx >= 0) this.handFireZones.splice(idx, 1);
        }});
    },

    updateHandFireZones() {
        if (!this.handFireZones?.length) return;
        const now = this.time.now;
        const px  = this.player.x;
        const py  = this.player.y;
        this.handFireZones.forEach(zone => {
            if (now - zone.lastDamageTick < 1000) return;
            const d = Phaser.Math.Distance.Between(zone.x, zone.y, px, py);
            if (d <= zone.radius && !this.player.reviveInvincible) {
                zone.lastDamageTick = now;
                // An eighth of the player's default (100) max health per second standing
                // in the fire, plus the fire status effect — its duration stacks by 1s
                // for every second spent in the flame.
                this.playerHealth -= 12.5;
                this.updateHPBar();
                this.playerDamageFlash();
                this.applyPlayerBurn(1000);
                if (this.inflateActive) this.inflateKnockback();
                if (this.playerHealth <= 0) { this.playerHealth = 0; this.showDeathOverlay(); }
            }
        });
    },

    doSprayBottle() {
        const boss = this.boss;
        if (!boss?.active) return;

        boss.handImmobile = true;
        if (boss.body) boss.body.setVelocity(0, 0);

        const fireBeam = (onDone) => {
            if (!boss.active) { onDone?.(); return; }
            const tx     = this.player.x;
            const ty     = this.player.y;
            const angle  = Math.atan2(ty - boss.y, tx - boss.x);
            const length = 300;

            const g = this.add.graphics().setDepth(20);
            g.fillStyle(0x88ffaa, 0.65);
            g.fillRect(0, -10, length, 20);
            g.setPosition(boss.x, boss.y);
            g.setRotation(angle);

            // Check hit
            const pDist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
            if (pDist <= length && !this.player.reviveInvincible) {
                const pAngle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
                if (Math.abs(Phaser.Math.Angle.Wrap(pAngle - angle)) <= 0.12) {
                    this.playerHealth -= 20;
                    this.updateHPBar();
                    this.playerDamageFlash();
                    if (this.inflateActive) this.inflateKnockback();
                    if (this.playerHealth <= 0) { this.playerHealth = 0; this.showDeathOverlay(); }
                }
            }

            this.time.delayedCall(400, () => {
                g.destroy();
                onDone?.();
            });
        };

        // 3 beams with 100ms gap
        fireBeam(() => this.time.delayedCall(100, () =>
            fireBeam(() => this.time.delayedCall(100, () =>
                fireBeam(() => {
                    if (boss.active) boss.handImmobile = false;
                })
            ))
        ));
    },

    doSaladBowl() {
        const boss = this.boss;
        if (!boss?.active) return;

        boss.handImmobile = true;
        if (boss.body) boss.body.setVelocity(0, 0);

        const label = this.add.text(boss.x, boss.y - 40, '🥗', {
            fontSize: '40px',
        }).setDepth(25).setOrigin(0.5);
        this.tweens.add({ targets: label, y: label.y + 80, alpha: 0, duration: 1000, onComplete: () => label.destroy() });

        this.time.delayedCall(600, () => {
            if (!boss.active) return;
            const configs = [
                { key: 'lettuce_beetle',  health: 4000,  damage: 15, speed: 70,  scale: 0.6 },
                { key: 'rocket_spider',   health: 6000,  damage: 18, speed: 80,  scale: 0.6 },
                { key: 'carrot_scorpion', health: 9000,  damage: 20, speed: 85,  scale: 0.65 },
                { key: 'mulberry_mantis', health: 4000,  damage: 12, speed: 100, scale: 0.6 },
            ];
            configs.forEach(cfg => this.spawnHandMiniBoss(cfg));
            boss.handImmobile = false;
        });
    },

    spawnHandMiniBoss(cfg) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist  = Phaser.Math.Between(300, 500);
        const sx    = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 64, 3136);
        const sy    = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 64, 3136);

        const mb = this.physics.add.sprite(sx, sy, cfg.key);
        mb.setScale(cfg.scale).setDepth(8);
        mb.body.setSize(mb.body.width * 0.75, mb.body.height * 0.75);
        mb.health      = cfg.health;
        mb.maxHealth   = cfg.health;
        mb.damage      = cfg.damage;
        mb.speed       = cfg.speed;
        mb.lastHitTime = 0;
        mb.isBossMini  = true;
        // Treat like a regular enemy so all weapons hit it
        mb.splits = false; mb.shoots = false; mb.splitsInto = null;
        mb.hydra = false; mb.burrowed = false; mb.whips = false;
        mb.emitsGas = false; mb.snakeWhip = false;
        mb.trap = false; mb.trapArmed = false; mb.bomb = false;
        mb.sweeps = false; mb.phantom = false;
        mb.spawnsCarrotCori = false; mb.spawnsAnySpinach = false;
        mb.vineWhip = false; mb.spawnsMinion = null;
        mb.isWanderer = false;
        mb.isCharging = false; mb.mantisVanishing = false;

        const animKey = `${cfg.key}_walk`;
        if (!this.anims.exists(animKey)) {
            this.anims.create({ key: animKey, frames: this.anims.generateFrameNumbers(cfg.key, { start: 0, end: 1 }), frameRate: 3, repeat: -1 });
        }
        mb.play(animKey);

        // World-space health bar under the mini-boss sprite
        mb.hpBarBg = this.add.rectangle(sx, sy + 30, 60, 8, 0x222222).setDepth(9);
        mb.hpBar   = this.add.rectangle(sx - 30, sy + 30, 60, 6, 0xff2222).setDepth(10).setOrigin(0, 0.5);
        mb.hpLabel = this.add.text(sx, sy - 44, cfg.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), {
            fontSize: '9px', fontFamily: 'Arial Black, Arial', color: '#ff8888',
        }).setDepth(10).setOrigin(0.5);

        this.enemies.add(mb);
        this.handMiniBossArray = this.handMiniBossArray || [];
        this.handMiniBossArray.push(mb);

        // Give each mini-boss the same AI/attack pattern as its original level boss
        mb.miniType = cfg.key;
        switch (cfg.key) {
            case 'lettuce_beetle':
                mb.miniChargeTimer = this.time.addEvent({ delay: 3500, callback: () => this.miniBeetleCharge(mb), loop: true });
                break;
            case 'rocket_spider':
                mb.aiMode         = 'circle';
                mb.aiSpeed        = mb.speed;
                mb.phaseTriggered = false;
                this.scheduleMiniSpiderSlam(mb);
                break;
            case 'carrot_scorpion':
                mb.isStinging        = false;
                mb.scorpionClawTimer = this.time.addEvent({ delay: 4000, callback: () => this.miniScorpionClawSwipe(mb), loop: true });
                this.scheduleMiniScorpionSting(mb);
                break;
            case 'mulberry_mantis': {
                // One continuous health bar covering both phases, with a divider line
                // instead of resetting to full at the phase-2 transition.
                const { total, boundaries } = this.computePhasedHealth([cfg.health, cfg.health]);
                mb.health      = total;
                mb.maxHealth   = total;
                mb.phaseBoundaries = boundaries;
                mb.phaseLine = this.add.rectangle(sx, sy + 30, 2, 10, 0xffffff, 0.9).setDepth(10);
                mb.mantisPhase          = 1;
                mb.mantisResting        = false;
                mb.mantisChasing        = false;
                mb.mantisVanishCycles   = 0;
                mb.mantisChaseThreshold = Phaser.Math.Between(5, 25);
                this.scheduleMiniMantisVanish(mb);
                break;
            }
        }
    },

    scheduleHandPhase3Ring() {
        if (!this.boss?.active) return;
        this.handRingTimer = this.time.delayedCall(Phaser.Math.Between(15000, 45000), () => {
            this.doHandRingAttack();
        });
    },

    doHandRingAttack() {
        const boss = this.boss;
        if (!boss?.active) return;

        if (Math.random() < 0.5) {
            // Enemy ring: 30 L5-exclusive enemies around boss
            const keys = ['lettuce_trap', 'basil_bomb', 'rocket_great_sword', 'oregano_phantom', 'coriander_carrot', 'spinach_tempest', 'mulberry_monstrosity'];
            const statMap = {
                lettuce_trap:         { health: 180, damage: 10, speed: 70,  scale: 0.28 },
                basil_bomb:           { health: 80,  damage: 0,  speed: 190, scale: 0.25 },
                rocket_great_sword:   { health: 90,  damage: 22, speed: 200, scale: 0.35 },
                oregano_phantom:      { health: 250, damage: 25, speed: 50,  scale: 0.35 },
                coriander_carrot:     { health: 500, damage: 30, speed: 20,  scale: 0.30 },
                spinach_tempest:      { health: 500, damage: 25, speed: 160, scale: 0.40 },
                mulberry_monstrosity: { health: 350, damage: 15, speed: 140, scale: 0.40 },
            };
            for (let i = 0; i < 30; i++) {
                const a    = (i / 30) * Math.PI * 2;
                const ex   = Phaser.Math.Clamp(boss.x + Math.cos(a) * 350, 64, 3136);
                const ey   = Phaser.Math.Clamp(boss.y + Math.sin(a) * 350, 64, 3136);
                const key  = Phaser.Utils.Array.GetRandom(keys);
                const stat = statMap[key];
                const e    = this.physics.add.sprite(ex, ey, key);
                e.setScale(stat.scale).setDepth(5);
                e.health = stat.health; e.maxHealth = stat.health;
                e.damage = stat.damage; e.speed = stat.speed;
                e.lastHitTime = 0;
                e.splits = false; e.shoots = false; e.splitsInto = null;
                e.hydra = false; e.burrowed = false; e.whips = false;
                e.emitsGas = false; e.snakeWhip = false;
                e.trap = (key === 'lettuce_trap'); e.trapArmed = e.trap; e.bomb = (key === 'basil_bomb');
                e.explodeDamage = e.bomb ? 30 : 0; e.sweeps = (key === 'rocket_great_sword');
                e.phantom = (key === 'oregano_phantom'); e.spawnsCarrotCori = false;
                e.spawnsAnySpinach = (key === 'spinach_tempest'); e.vineWhip = (key === 'mulberry_monstrosity');
                e.spawnsMinion = null; e.isWanderer = e.spawnsAnySpinach; e.isBossMini = false;
                if (e.trap) e.setAlpha(0.22);
                const aKey = `${key}_walk`;
                if (!this.anims.exists(aKey)) {
                    this.anims.create({ key: aKey, frames: this.anims.generateFrameNumbers(key, { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
                }
                e.play(aKey);
                if (!e.isWanderer) this.physics.moveToObject(e, this.player, e.speed);
                this.enemies.add(e);
            }
        } else {
            // Two rings of 30 projectiles, 2000ms apart
            const fireRing = () => {
                if (!boss.active) return;
                for (let i = 0; i < 30; i++) {
                    const a    = (i / 30) * Math.PI * 2;
                    const proj = this.physics.add.image(boss.x, boss.y, 'iceberg_lettuce');
                    proj.setScale(0.18).setDepth(7).setTint(0x88ffaa);
                    proj.setVelocity(Math.cos(a) * 250, Math.sin(a) * 250);
                    proj.damage = 15;
                    this.physics.add.overlap(proj, this.player, () => {
                        if (!proj.active || this.player.reviveInvincible) return;
                        this.playerHealth -= proj.damage;
                        this.updateHPBar();
                        this.playerDamageFlash();
                        if (this.inflateActive) this.inflateKnockback();
                        if (this.playerHealth <= 0) { this.playerHealth = 0; this.showDeathOverlay(); }
                        proj.destroy();
                    });
                    this.scheduleProjectileDespawn(proj, 5000);
                }
            };
            fireRing();
            this.time.delayedCall(2000, () => fireRing());
        }

        this.scheduleHandPhase3Ring();
    },

    scheduleHandPhase4Rings() {
        if (!this.boss?.active) return;
        this.handRingsTimer = this.time.delayedCall(Phaser.Math.Between(10000, 40000), () => {
            this.doHandPhase4Rings();
        });
    },

    doHandPhase4Rings() {
        const boss = this.boss;
        if (!boss?.active) return;

        const count = 2;
        let fired = 0;

        const fireRing = () => {
            if (!boss.active || fired >= count) return;
            fired++;
            for (let i = 0; i < 30; i++) {
                const a    = (i / 30) * Math.PI * 2;
                const proj = this.physics.add.image(boss.x, boss.y, 'iceberg_lettuce');
                proj.setScale(0.20).setDepth(7).setTint(0xff44cc);
                proj.setVelocity(Math.cos(a) * 200, Math.sin(a) * 200);
                this.physics.add.overlap(proj, this.player, () => {
                    if (!proj.active || this.player.reviveInvincible) return;
                    this.playerHealth = Math.floor(this.playerHealth / 2);
                    this.updateHPBar();
                    this.playerDamageFlash();
                    if (this.inflateActive) this.inflateKnockback();
                    if (this.playerHealth <= 0) { this.playerHealth = 0; this.showDeathOverlay(); }
                    proj.destroy();
                });
                this.scheduleProjectileDespawn(proj, 6000);
            }
            if (fired < count) this.time.delayedCall(1000, fireRing);
        };

        fireRing();
        this.scheduleHandPhase4Rings();
    },

    scheduleHandVacuum() {
        if (!this.boss?.active) return;
        this.handVacuumTimer = this.time.delayedCall(Phaser.Math.Between(20000, 55000), () => {
            this.doHandVacuum();
        });
    },

    doHandVacuum() {
        const boss = this.boss;
        if (!boss?.active) return;

        // Longer build-up (was 4s) so the pull has time to actually read as a vacuum
        // instead of enemies snapping to the boss and the kill feeling instant.
        const VACUUM_DURATION = 5000;

        boss.handImmobile = true;
        if (boss.body) boss.body.setVelocity(0, 0);

        // Boss pulses continuously for the whole build-up, not just a brief initial flash,
        // so it visibly reads as "channeling" the whole time.
        const chargeFlash = this.tweens.add({ targets: boss, alpha: 0.3, duration: 250, yoyo: true, repeat: -1 });

        // Map slowly reddens for the whole vacuum build-up
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const redOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 1)
            .setScrollFactor(0).setDepth(25).setAlpha(0);
        this.handVacuumOverlay = redOverlay;
        this.tweens.add({ targets: redOverlay, alpha: 0.55, duration: VACUUM_DURATION, ease: 'Sine.In' });

        // Continuously suck all enemies and mini-bosses toward the boss — the actual pull
        // happens every frame in updateHandAI() so their own AI can't re-claim velocity.
        this.handVacuumActive = true;

        // After the vacuum finishes: kill them all, then explode
        this.time.delayedCall(VACUUM_DURATION, () => {
            this.handVacuumActive = false;
            chargeFlash.stop();
            boss.setAlpha(1);
            if (!boss.active) { redOverlay.destroy(); this.handVacuumOverlay = null; return; }

            // Kill every sucked target
            const toKill = [
                ...this.enemies.getChildren().slice().filter(e => e.active && !e.isBossMini),
                ...(this.handMiniBossArray?.slice().filter(b => b.active) ?? []),
            ];
            toKill.forEach(e => this.killEnemy(e));

            // Screenshake
            this.cameras.main.shake(600, 0.04);

            // Fade the red tint back out
            this.tweens.add({ targets: redOverlay, alpha: 0, duration: 300, onComplete: () => { redOverlay.destroy(); this.handVacuumOverlay = null; } });

            // Explosion visual — circle grows from 0 → 750px in 400ms (blast radius halved)
            const BLAST_RADIUS = 750;
            const g = this.add.graphics().setDepth(26);
            g.fillStyle(0xffffff, 0.9);
            g.fillCircle(0, 0, BLAST_RADIUS);
            g.setPosition(boss.x, boss.y);
            g.setScale(0);

            let playerHit = false;
            this.tweens.add({
                targets: g, scaleX: 1, scaleY: 1, duration: 400, ease: 'Quad.Out',
                onUpdate: () => {
                    if (playerHit || this.player.reviveInvincible) return;
                    const currentR = BLAST_RADIUS * g.scaleX;
                    const d = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
                    if (d <= currentR) {
                        playerHit = true;
                        this.playerHealth -= 80;
                        this.updateHPBar();
                        this.playerDamageFlash();
                        if (this.inflateActive) this.inflateKnockback();
                        if (this.playerHealth <= 0) { this.playerHealth = 0; this.showDeathOverlay(); }
                    }
                },
                onComplete: () => {
                    this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
                    boss.handImmobile = false;
                    this.scheduleHandVacuum();
                },
            });
        });
    },

    scheduleHandBossRespawn() {
        if (!this.boss?.active) return;
        this.handBossSpawnTimer = this.time.delayedCall(Phaser.Math.Between(30000, 45000), () => {
            this.checkHandPhase4BossSpawn();
        });
    },

    checkHandPhase4BossSpawn() {
        if (!this.boss?.active) return;
        const arr    = this.handMiniBossArray ?? [];
        const active = arr.filter(b => b.active);
        const allWeakOrGone = active.length === 0 || active.every(b => b.health <= b.maxHealth * 0.2);

        if (allWeakOrGone) {
            const configs = [
                { key: 'lettuce_beetle',  health: 8000,  damage: 15, speed: 70,  scale: 0.6 },
                { key: 'rocket_spider',   health: 12000, damage: 18, speed: 80,  scale: 0.6 },
                { key: 'carrot_scorpion', health: 18000, damage: 20, speed: 85,  scale: 0.65 },
                { key: 'mulberry_mantis', health: 4000,  damage: 12, speed: 100, scale: 0.6 },
            ];
            configs.forEach(cfg => this.spawnHandMiniBoss(cfg));
        }

        this.scheduleHandBossRespawn();
    }

};
