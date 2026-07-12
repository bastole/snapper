export const EnemySpawnMethods = {

    // ─── Step 2: Enemy spawning ───────────────────────────────────────────────────
    spawnEnemy() {
        if (this.enemies.getChildren().length >= 80) return;

        const cam    = this.cameras.main;
        const margin = 80;
        let x, y;

        const side = Phaser.Math.Between(0, 3);
        if (side === 0) {
            // Top edge — clamp X along edge, keep Y strictly above camera
            x = Phaser.Math.Clamp(Phaser.Math.Between(cam.scrollX, cam.scrollX + cam.width), 64, 3136);
            y = Math.max(64, cam.scrollY - margin);
        } else if (side === 1) {
            // Bottom edge — clamp X along edge, keep Y strictly below camera
            x = Phaser.Math.Clamp(Phaser.Math.Between(cam.scrollX, cam.scrollX + cam.width), 64, 3136);
            y = Math.min(3136, cam.scrollY + cam.height + margin);
        } else if (side === 2) {
            // Left edge — keep X strictly left of camera, clamp Y along edge
            x = Math.max(64, cam.scrollX - margin);
            y = Phaser.Math.Clamp(Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height), 64, 3136);
        } else {
            // Right edge — keep X strictly right of camera, clamp Y along edge
            x = Math.min(3136, cam.scrollX + cam.width + margin);
            y = Phaser.Math.Clamp(Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height), 64, 3136);
        }

        // Safety: if world edge forces the enemy inside the camera, nudge it out
        if (x > cam.scrollX && x < cam.scrollX + cam.width && y > cam.scrollY && y < cam.scrollY + cam.height) {
            x = cam.scrollX - margin;
        }

        // elapsed = seconds since level started
        const elapsed = 600 - this.gameTime;

        const pools = {
            1: [
                { key: 'iceberg_lettuce', health: 15,  damage: 5,  speed: 60,  scale: 0.25, minTime: 0   },
                { key: 'basil',           health: 25,  damage: 5,  speed: 60,  scale: 0.25, minTime: 0   },
                { key: 'lettuce_hopper',  health: 60,  damage: 8,  speed: 45,  scale: 0.35, minTime: 120, splits: true },
                { key: 'lettuce_shooter', health: 90,  damage: 6,  speed: 0,   scale: 0.25, minTime: 300, shoots: true },
                { key: 'basil_propeller', health: 120, damage: 10, speed: 180, scale: 0.25, minTime: 480 },
            ],
            2: [
                { key: 'rocket',        health: 20,  damage: 8,  speed: 70,  scale: 0.25, minTime: 0   },
                { key: 'oregano_skunk', health: 40,  damage: 10, speed: 50,  scale: 0.28, minTime: 0,   emitsGas: true },
                { key: 'rocket_knife',  health: 10,  damage: 15, speed: 150, scale: 0.25, minTime: 120 },
                { key: 'oregano_ghost', health: 80,  damage: 12, speed: 35,  scale: 0.30, minTime: 300 },
                { key: 'oregano_fan',   health: 60,  damage: 8,  speed: 0,   scale: 0.25, minTime: 300, shoots: true, projKey: 'oregano_fan', projTint: 0x44ff44, projScale: 0.14, poisonous: true },
                { key: 'rocket_sword',  health: 50,  damage: 18, speed: 155, scale: 0.25, minTime: 480 },
            ],
            3: [
                { key: 'coriander',        health: 30,  damage: 10, speed: 72,  scale: 0.25, minTime: 0   },
                { key: 'coriander_whip',   health: 60,  damage: 14, speed: 55,  scale: 0.28, minTime: 150, whips: true },
                { key: 'carrot_mole',      health: 75,  damage: 12, speed: 60,  scale: 0.26, minTime: 240, burrowed: true },
                { key: 'coriander_hydra',  health: 220, damage: 13, speed: 38,  scale: 0.32, minTime: 420, hydra: true },
                { key: 'carrot_dart',      health: 40,  damage: 17, speed: 145, scale: 0.25, minTime: 480, splitsInto: 'carrot_wheel', scaleMin: 0.18, scaleMax: 0.35 },
                { key: 'carrot_wheel',     health: 22,  damage: 9,  speed: 130, scale: 0.18, minTime: 480 },
            ],
            4: [
                { key: 'spinach',         health: 35,  damage: 11, speed: 68,  scale: 0.25, minTime: 0   },
                { key: 'small_spinach',   health: 18,  damage: 5,  speed: 110, scale: 0.22, minTime: 0   },
                { key: 'mulberry_bat',    health: 50,  damage: 13, speed: 140, scale: 0.27, minTime: 150 },
                { key: 'mulberry_snake',  health: 95,  damage: 15, speed: 48,  scale: 0.28, minTime: 300, shoots: true, projKey: 'mulberry_bat', projTint: 0x881144, projScale: 0.13, snakeWhip: true },
                { key: 'spinach_cyclone', health: 200, damage: 20, speed: 35,  scale: 0.30, minTime: 420, rare: true, spawnsEnemy: 'small_spinach', spawnsEnemyStats: { health: 18, damage: 9, speed: 110, scale: 0.22 } },
            ],
            5: [
                // 0:00 — cricket droppers (one from every prior level)
                { key: 'iceberg_lettuce', health: 15,  damage: 5,  speed: 60,  scale: 0.25, minTime: 0   },
                { key: 'basil',           health: 25,  damage: 5,  speed: 60,  scale: 0.25, minTime: 0   },
                { key: 'rocket',          health: 20,  damage: 6,  speed: 65,  scale: 0.25, minTime: 0   },
                { key: 'oregano_skunk',   health: 45,  damage: 8,  speed: 55,  scale: 0.25, minTime: 0,   emitsGas: true },
                { key: 'coriander',       health: 30,  damage: 10, speed: 72,  scale: 0.25, minTime: 0   },
                { key: 'spinach',         health: 35,  damage: 11, speed: 68,  scale: 0.25, minTime: 0   },
                { key: 'small_spinach',   health: 18,  damage: 5,  speed: 110, scale: 0.20, minTime: 0   },
                // 2:30 — vitaworm droppers
                { key: 'lettuce_hopper',  health: 60,  damage: 8,  speed: 45,  scale: 0.35, minTime: 150, splits: true },
                { key: 'rocket_knife',    health: 30,  damage: 15, speed: 110, scale: 0.25, minTime: 150 },
                { key: 'coriander_whip',  health: 60,  damage: 14, speed: 55,  scale: 0.25, minTime: 150, whips: true },
                { key: 'carrot_mole',     health: 75,  damage: 12, speed: 60,  scale: 0.25, minTime: 150, burrowed: true },
                { key: 'mulberry_bat',    health: 50,  damage: 13, speed: 140, scale: 0.25, minTime: 150 },
                // 3:30 — mealworm droppers
                { key: 'lettuce_shooter', health: 90,  damage: 6,  speed: 0,   scale: 0.25, minTime: 210, shoots: true },
                { key: 'oregano_ghost',   health: 150, damage: 12, speed: 35,  scale: 0.30, minTime: 210, emitsGas: true },
                { key: 'oregano_fan',     health: 80,  damage: 10, speed: 50,  scale: 0.25, minTime: 210, shoots: true, projKey: 'oregano_fan', projTint: 0x44ff44, projScale: 0.14, poisonous: true },
                { key: 'coriander_hydra', health: 220, damage: 13, speed: 38,  scale: 0.30, minTime: 210, hydra: true },
                { key: 'carrot_wheel',    health: 22,  damage: 9,  speed: 130, scale: 0.18, minTime: 210 },
                { key: 'mulberry_snake',  health: 95,  damage: 15, speed: 48,  scale: 0.28, minTime: 210, shoots: true, projKey: 'mulberry_bat', projTint: 0x881144, projScale: 0.13, snakeWhip: true },
                // 5:00 — dragonfly droppers
                { key: 'basil_propeller', health: 120, damage: 10, speed: 180, scale: 0.25, minTime: 300 },
                { key: 'rocket_sword',    health: 200, damage: 18, speed: 90,  scale: 0.35, minTime: 300 },
                { key: 'carrot_dart',     health: 40,  damage: 17, speed: 145, scale: 0.25, minTime: 300, splitsInto: 'carrot_wheel', scaleMin: 0.18, scaleMax: 0.35 },
                { key: 'spinach_cyclone', health: 200, damage: 20, speed: 35,  scale: 0.30, minTime: 300, rare: true, spawnsEnemy: 'small_spinach', spawnsEnemyStats: { health: 18, damage: 9, speed: 110, scale: 0.22 } },
                // 7:00 — Level 5 exclusives
                { key: 'lettuce_trap',         health: 180, damage: 10, snapDamage: 18, speed: 70,  scale: 0.28, minTime: 420, trap: true },
                { key: 'basil_bomb',           health: 80,  damage: 0,  explodeDamage: 30, speed: 190, scale: 0.25, minTime: 420, bomb: true },
                { key: 'rocket_great_sword',   health: 90,  damage: 22, speed: 200, scale: 0.35, minTime: 420, sweeps: true },
                { key: 'oregano_phantom',      health: 250, damage: 25, speed: 50,  scale: 0.35, minTime: 420, phantom: true },
                { key: 'coriander_carrot',     health: 500, damage: 30, speed: 20,  scale: 0.30, minTime: 420, spawnsCarrotCori: true },
                { key: 'spinach_tempest',      health: 500, damage: 25, speed: 160, scale: 0.40, minTime: 420, rare: true, spawnsAnySpinach: true },
                { key: 'mulberry_monstrosity', health: 350, damage: 15, speed: 140, scale: 0.40, minTime: 420, vineWhip: true, spawnsMinion: 'mulberry_bat' },
            ],
        };
        let typePool = (pools[this.level] ?? pools[1]).filter(t => elapsed >= t.minTime && (!t.rare || Math.random() < 0.2));
        if (typePool.length === 0) typePool = (pools[this.level] ?? pools[1]).filter(t => elapsed >= t.minTime && !t.rare);

        const def  = Phaser.Utils.Array.GetRandom(typePool);
        const type = def.key;

        const enemy = this.physics.add.sprite(x, y, type);
        const spawnScale = (def.scaleMin !== undefined)
            ? Phaser.Math.FloatBetween(def.scaleMin, def.scaleMax)
            : def.scale;
        enemy.setScale(spawnScale);
        enemy.spawnScale = spawnScale;
        enemy.setDepth(5);
        // Collision/hitbox shrunk to 75% of the visual sprite size (types below with their own
        // explicit body.setSize(...) already carry the same 75% reduction baked into their numbers).
        enemy.body.setSize(enemy.body.width * 0.75, enemy.body.height * 0.75);
        enemy.health        = def.health;
        enemy.maxHealth     = def.health;
        enemy.damage        = def.damage;
        enemy.speed         = def.speed;
        enemy.lastHitTime   = 0;
        enemy.splits        = def.splits       ?? false;
        enemy.shoots        = def.shoots       ?? false;
        enemy.emitsGas      = def.emitsGas    ?? false;
        enemy.splitsInto    = def.splitsInto   ?? null;
        enemy.hydra         = def.hydra        ?? false;
        enemy.burrowed      = def.burrowed     ?? false;
        enemy.whips         = def.whips        ?? false;
        enemy.snakeWhip     = def.snakeWhip    ?? false;
        enemy.trap             = def.trap             ?? false;
        enemy.trapArmed        = def.trap             ?? false;
        enemy.snapDamage       = def.snapDamage       ?? 0;
        enemy.bomb             = def.bomb             ?? false;
        enemy.explodeDamage    = def.explodeDamage    ?? 0;
        enemy.sweeps           = def.sweeps           ?? false;
        enemy.phantom          = def.phantom          ?? false;
        enemy.spawnsCarrotCori = def.spawnsCarrotCori ?? false;
        enemy.spawnsAnySpinach = def.spawnsAnySpinach ?? false;
        enemy.vineWhip         = def.vineWhip         ?? false;
        enemy.spawnsMinion     = def.spawnsMinion     ?? null;
        enemy.isWanderer    = false;
        enemy.wanderTarget  = null;
        if (enemy.hydra) { enemy.hydraHeads = 3; enemy.body.setSize(82.5, 82.5); }
        if (enemy.burrowed) {
            // Carrot Mole: alternates surfaced (stationary, vulnerable) and burrowed (moving, invulnerable)
            // Starts surfaced
            enemy.isUnderground = false;
            enemy.speed = 0; // stationary while surfaced
            const scheduleBurrow = () => {
                if (!enemy.active) return;
                // Surface phase: 3–10s, then burrow
                enemy.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 10000), () => {
                    if (!enemy.active) return;
                    // Go underground
                    enemy.isUnderground = true;
                    enemy.setAlpha(0.25);
                    enemy.body.setSize(30, 22.5);
                    enemy.speed = 80;
                    // Move toward player while underground for 3–5s
                    const burrowDur = Phaser.Math.Between(3000, 5000);
                    enemy.burrowTimer = this.time.delayedCall(burrowDur, () => {
                        if (!enemy.active) return;
                        // Resurface
                        enemy.isUnderground = false;
                        enemy.setAlpha(1);
                        enemy.body.setSize(45, 30);
                        enemy.speed = 0;
                        if (enemy.body) enemy.body.setVelocity(0, 0);
                        scheduleBurrow();
                    });
                });
            };
            scheduleBurrow();
        }

        // Shooters fire a projectile toward the player every 5–15 seconds
        if (enemy.shoots) {
            const scheduleShot = () => {
                if (!enemy.active) return;
                enemy.shootTimer = this.time.delayedCall(Phaser.Math.Between(5000, 15000), () => {
                    if (!enemy.active) return;
                    const cam    = this.cameras.main;
                    const margin = 50;
                    const inView = enemy.x > cam.scrollX + margin &&
                                   enemy.x < cam.scrollX + cam.width  - margin &&
                                   enemy.y > cam.scrollY + margin &&
                                   enemy.y < cam.scrollY + cam.height - margin;
                    if (inView) {
                        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                        const proj  = this.physics.add.image(enemy.x, enemy.y, def.projKey ?? 'iceberg_lettuce');
                        proj.setScale(def.projScale ?? 0.12).setDepth(7);
                        if (def.projTint) proj.setTint(def.projTint);
                        proj.setVelocity(Math.cos(angle) * 160, Math.sin(angle) * 160);
                        proj.damage = enemy.damage;
                        this.physics.add.overlap(proj, this.player, () => {
                            if (!proj.active || proj.deflected) return;
                            if (this.player.reviveInvincible) return;
                            if (this.deflectChance > 0 && Math.random() < this.deflectChance) {
                                proj.deflected = true;
                                this.tweens.add({ targets: this.player, alpha: 0.5, duration: 80, yoyo: true });
                                proj.setVelocity(-proj.body.velocity.x * 1.4, -proj.body.velocity.y * 1.4);
                                this.physics.add.overlap(proj, this.enemies, (p, e) => {
                                    if (!p.active) return;
                                    this.damageDealt += 20; e.health -= 20;
                                    this.playEnemyHurtSfx();
                                    this.tweens.add({ targets: e, alpha: 0.2, duration: 80, yoyo: true });
                                    if (e.health <= 0) this.killEnemy(e);
                                    p.destroy();
                                });
                                return;
                            }
                            this.playerHealth -= proj.damage;
                            this.updateHPBar();
                            this.playerDamageFlash();
                            if (def.poisonous) this.applyPoison();
                            if (this.playerHealth <= 0) {
                                this.playerHealth = 0;
                                this.showDeathOverlay();
                            }
                            proj.destroy();
                        });
                        this.scheduleProjectileDespawn(proj, 6000);
                    }
                    scheduleShot();
                });
            };
            scheduleShot();
        }

        // Oregano Skunk: larger gas-cloud physics body for proximity damage
        if (def.emitsGas) {
            enemy.body.setSize(66, 66);
            this.tweens.add({ targets: enemy, alpha: 0.55, duration: 900, yoyo: true, loop: -1 });
        }

        // Coriander Whip: wider contact hitbox for regular melee, plus a ranged lash attack
        if (def.whips) {
            enemy.body.setSize(52.5, 52.5); // wider hitbox so regular contact hits more reliably
            const scheduleWhip = () => {
                if (!enemy.active) return;
                enemy.whipTimer = this.time.delayedCall(Phaser.Math.Between(1000, 2000), () => {
                    if (!enemy.active) return;
                    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    if (dist <= 56) {
                        const now = this.time.now;
                        if (now - enemy.lastHitTime >= 1000) {
                            enemy.lastHitTime = now;
                            this.playerHealth -= enemy.damage;
                            this.updateHPBar();
                            this.playerDamageFlash();
                            if (this.inflateActive) this.inflateKnockback();
                            if (this.playerHealth <= 0) {
                                this.playerHealth = 0;
                                this.showDeathOverlay();
                            }
                        }
                        // Visual lash arc
                        const g = this.add.graphics().setDepth(20);
                        g.lineStyle(3, 0x88ff44, 0.8);
                        g.beginPath();
                        g.moveTo(enemy.x, enemy.y);
                        g.lineTo(this.player.x, this.player.y);
                        g.strokePath();
                        this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
                    }
                    scheduleWhip();
                });
            };
            scheduleWhip();
        }

        // Mulberry Snake: tail whip melee attack every 2–4s
        if (def.snakeWhip) {
            const scheduleSnakeWhip = () => {
                if (!enemy.active) return;
                enemy.whipTimer = this.time.delayedCall(Phaser.Math.Between(2000, 4000), () => {
                    if (!enemy.active) return;
                    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    if (dist <= 65) {
                        const now = this.time.now;
                        if (now - enemy.lastHitTime >= 1000) {
                            enemy.lastHitTime = now;
                            this.playerHealth -= enemy.damage;
                            this.updateHPBar();
                            this.playerDamageFlash();
                            if (this.inflateActive) this.inflateKnockback();
                            if (this.playerHealth <= 0) {
                                this.playerHealth = 0;
                                this.showDeathOverlay();
                            }
                        }
                        const g = this.add.graphics().setDepth(20);
                        g.lineStyle(3, 0xaa44cc, 0.8);
                        g.beginPath();
                        g.moveTo(enemy.x, enemy.y);
                        g.lineTo(this.player.x, this.player.y);
                        g.strokePath();
                        this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
                    }
                    scheduleSnakeWhip();
                });
            };
            scheduleSnakeWhip();
        }

        // Spinach Cyclone / Spinach Tempest: wanders within camera view; spawns minions periodically while alive
        if (def.spawnsEnemy) {
            enemy.isWanderer = true;
            this.tweens.add({ targets: enemy, angle: 360, duration: 900, loop: -1 });
            const spawnKey   = def.spawnsEnemy;
            const mStats     = def.spawnsEnemyStats ?? { health: 18, damage: 9, speed: 110, scale: 0.22 };
            const scheduleCycloneSpawn = () => {
                if (!enemy.active) return;
                enemy.cycloneTimer = this.time.delayedCall(Phaser.Math.Between(6000, 12000), () => {
                    if (!enemy.active) return;
                    const sx = enemy.x + Phaser.Math.Between(-80, 80);
                    const sy = enemy.y + Phaser.Math.Between(-80, 80);
                    const mini = this.physics.add.sprite(sx, sy, spawnKey);
                    mini.setScale(mStats.scale).setDepth(5);
                    mini.health = mStats.health; mini.maxHealth = mStats.health;
                    mini.damage = mStats.damage; mini.speed = mStats.speed;
                    mini.lastHitTime = 0;
                    mini.splits = false; mini.shoots = false; mini.splitsInto = null;
                    mini.hydra = false; mini.burrowed = false; mini.whips = false;
                    mini.emitsGas = false; mini.snakeWhip = false;
                    mini.trap = false; mini.trapArmed = false; mini.bomb = false; mini.sweeps = false; mini.spawnsMinion = null;
                    const animKey = `${spawnKey}_walk`;
                    if (!this.anims.exists(animKey)) {
                        this.anims.create({ key: animKey, frames: this.anims.generateFrameNumbers(spawnKey, { start: 0, end: 1 }), frameRate: 5, repeat: -1 });
                    }
                    mini.play(animKey);
                    this.physics.moveToObject(mini, this.player, mini.speed);
                    this.enemies.add(mini);
                    scheduleCycloneSpawn();
                });
            };
            scheduleCycloneSpawn();
        }

        // Lettuce Trap: starts dormant and nearly invisible; activates when the player steps on it
        if (def.trap) {
            enemy.setAlpha(0.22);
            if (enemy.body) enemy.body.setVelocity(0, 0);
        }

        // Rocket Great Sword: arc sweep attack every 3–5s
        if (def.sweeps) {
            const scheduleSweep = () => {
                if (!enemy.active) return;
                enemy.sweepTimer = this.time.delayedCall(Phaser.Math.Between(3000, 5000), () => {
                    if (!enemy.active) return;
                    const angle        = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    const halfArc      = 80 * (Math.PI / 180); // 160° total arc
                    const range        = 90;
                    const g = this.add.graphics().setDepth(20);
                    g.fillStyle(0xff8800, 0.45);
                    g.slice(enemy.x, enemy.y, range, angle - halfArc, angle + halfArc);
                    g.fillPath();
                    this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
                    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    if (dist <= range && !this.player.reviveInvincible) {
                        const playerAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                        if (Math.abs(Phaser.Math.Angle.Wrap(playerAngle - angle)) <= halfArc) {
                            const now = this.time.now;
                            if (now - (enemy.lastSweepHit ?? 0) >= 1000) {
                                enemy.lastSweepHit = now;
                                this.playerHealth -= enemy.damage;
                                this.updateHPBar();
                                this.playerDamageFlash();
                                if (this.inflateActive) this.inflateKnockback();
                                if (this.playerHealth <= 0) {
                                    this.playerHealth = 0;
                                    this.showDeathOverlay();
                                }
                            }
                        }
                    }
                    scheduleSweep();
                });
            };
            scheduleSweep();
        }

        // Mulberry Monstrosity: spawns a Mulberry Bat every 12–20s
        if (def.spawnsMinion) {
            const minionKey = def.spawnsMinion;
            const scheduleMinion = () => {
                if (!enemy.active) return;
                enemy.minionTimer = this.time.delayedCall(Phaser.Math.Between(12000, 20000), () => {
                    if (!enemy.active) return;
                    const sx = enemy.x + Phaser.Math.Between(-60, 60);
                    const sy = enemy.y + Phaser.Math.Between(-60, 60);
                    const mini = this.physics.add.sprite(sx, sy, minionKey);
                    mini.setScale(0.25).setDepth(5);
                    mini.health = 50; mini.maxHealth = 50;
                    mini.damage = 13; mini.speed = 140;
                    mini.lastHitTime = 0;
                    mini.splits = false; mini.shoots = false; mini.splitsInto = null;
                    mini.hydra = false; mini.burrowed = false; mini.whips = false;
                    mini.emitsGas = false; mini.snakeWhip = false;
                    mini.trap = false; mini.trapArmed = false; mini.bomb = false; mini.sweeps = false; mini.spawnsMinion = null;
                    const animKey = `${minionKey}_walk`;
                    if (!this.anims.exists(animKey)) {
                        this.anims.create({ key: animKey, frames: this.anims.generateFrameNumbers(minionKey, { start: 0, end: 1 }), frameRate: 5, repeat: -1 });
                    }
                    mini.play(animKey);
                    this.physics.moveToObject(mini, this.player, mini.speed);
                    this.enemies.add(mini);
                    scheduleMinion();
                });
            };
            scheduleMinion();
        }

        // Carrot Dart: telegraphed charge at the player every 3–6s
        if (def.splitsInto === 'carrot_wheel') {
            enemy.isCharging = false;
            const scheduleDartCharge = () => {
                if (!enemy.active) return;
                enemy.dartTimer = this.time.delayedCall(Phaser.Math.Between(3000, 6000), () => {
                    if (!enemy.active || enemy.isCharging) return;
                    enemy.isCharging = true;
                    if (enemy.body) enemy.body.setVelocity(0, 0);

                    const targetX = this.player.x;
                    const targetY = this.player.y;
                    const angle   = Math.atan2(targetY - enemy.y, targetX - enemy.x);
                    const dist    = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetX, targetY) + 40;

                    // Orange warning line toward player
                    const warn = this.add.graphics().setDepth(18);
                    warn.fillStyle(0xff8800, 0.30);
                    warn.fillRect(0, -14, dist, 28);
                    warn.setPosition(enemy.x, enemy.y);
                    warn.setRotation(angle);
                    this.tweens.add({ targets: warn, alpha: 0, delay: 140, duration: 160, onComplete: () => warn.destroy() });

                    // Flash enemy orange
                    this.tweens.add({ targets: enemy, alpha: 0.3, duration: 75, yoyo: true, repeat: 1 });

                    // Launch after 150ms freeze
                    this.time.delayedCall(150, () => {
                        if (!enemy.active) return;
                        const launchAngle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
                        const chargeSpeed = 600;
                        if (enemy.body) enemy.body.setVelocity(Math.cos(launchAngle) * chargeSpeed, Math.sin(launchAngle) * chargeSpeed);
                        this.time.delayedCall(500, () => {
                            if (!enemy.active) return;
                            if (enemy.body) enemy.body.setVelocity(0, 0);
                            enemy.isCharging = false;
                            scheduleDartCharge();
                        });
                    });
                });
            };
            scheduleDartCharge();
        }

        // Oregano Phantom: fires a poisonous projectile every 3–10s
        if (def.phantom) {
            const schedulePhantomShot = () => {
                if (!enemy.active) return;
                enemy.phantomTimer = this.time.delayedCall(Phaser.Math.Between(3000, 10000), () => {
                    if (!enemy.active) return;
                    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    const proj  = this.physics.add.image(enemy.x, enemy.y, 'oregano_fan');
                    proj.setScale(0.14).setDepth(7).setTint(0x44ff44);
                    proj.setVelocity(Math.cos(angle) * 160, Math.sin(angle) * 160);
                    proj.damage = enemy.damage;
                    this.physics.add.overlap(proj, this.player, () => {
                        if (!proj.active || proj.deflected) return;
                        if (this.player.reviveInvincible) return;
                        if (this.deflectChance > 0 && Math.random() < this.deflectChance) {
                            proj.deflected = true;
                            proj.setVelocity(-proj.body.velocity.x * 1.4, -proj.body.velocity.y * 1.4);
                            this.physics.add.overlap(proj, this.enemies, (p, e) => {
                                if (!p.active) return;
                                this.damageDealt += 20; e.health -= 20;
                                this.playEnemyHurtSfx();
                                this.tweens.add({ targets: e, alpha: 0.2, duration: 80, yoyo: true });
                                if (e.health <= 0) this.killEnemy(e);
                                p.destroy();
                            });
                            return;
                        }
                        this.playerHealth -= proj.damage;
                        this.updateHPBar();
                        this.playerDamageFlash();
                        this.applyPoison(6); // 3 seconds of poison
                        if (this.playerHealth <= 0) {
                            this.playerHealth = 0;
                            this.showDeathOverlay();
                        }
                        proj.destroy();
                    });
                    this.scheduleProjectileDespawn(proj, 5000);
                    schedulePhantomShot();
                });
            };
            schedulePhantomShot();
        }

        // Coriander Carrot: spawns 2 random coriander or carrot enemies every 5–12s
        if (def.spawnsCarrotCori) {
            const spawnPool = ['coriander', 'coriander_whip', 'coriander_hydra', 'carrot_mole', 'carrot_dart', 'carrot_wheel'];
            const spawnStats = {
                coriander:       { health: 30,  damage: 10, speed: 72,  scale: 0.25 },
                coriander_whip:  { health: 60,  damage: 14, speed: 55,  scale: 0.25 },
                coriander_hydra: { health: 220, damage: 13, speed: 38,  scale: 0.30 },
                carrot_mole:     { health: 75,  damage: 12, speed: 60,  scale: 0.25 },
                carrot_dart:     { health: 40,  damage: 17, speed: 145, scale: 0.25 },
                carrot_wheel:    { health: 22,  damage: 9,  speed: 130, scale: 0.18 },
            };
            const scheduleSpawn = () => {
                if (!enemy.active) return;
                enemy.spawnTimer = this.time.delayedCall(Phaser.Math.Between(5000, 12000), () => {
                    if (!enemy.active) return;
                    for (let i = 0; i < 2; i++) {
                        const sKey  = Phaser.Utils.Array.GetRandom(spawnPool);
                        const sData = spawnStats[sKey];
                        const sx    = enemy.x + Phaser.Math.Between(-60, 60);
                        const sy    = enemy.y + Phaser.Math.Between(-60, 60);
                        const mini  = this.physics.add.sprite(sx, sy, sKey);
                        mini.setScale(sData.scale).setDepth(5);
                        mini.health = sData.health; mini.maxHealth = sData.health;
                        mini.damage = sData.damage; mini.speed     = sData.speed;
                        mini.lastHitTime = 0;
                        mini.splits = false; mini.shoots = false; mini.splitsInto = null;
                        mini.hydra = (sKey === 'coriander_hydra'); mini.burrowed = (sKey === 'carrot_mole');
                        mini.whips = (sKey === 'coriander_whip');  mini.emitsGas = false;
                        mini.snakeWhip = false; mini.trap = false; mini.trapArmed = false;
                        mini.bomb = false; mini.sweeps = false; mini.phantom = false;
                        mini.spawnsCarrotCori = false; mini.spawnsAnySpinach = false; mini.vineWhip = false; mini.spawnsMinion = null;
                        mini.isWanderer = false;
                        if (mini.hydra) { mini.hydraHeads = 3; mini.body.setSize(82.5, 82.5); }
                        if (mini.burrowed) {
                            mini.isUnderground = false; mini.speed = 0;
                            const sb = () => {
                                if (!mini.active) return;
                                mini.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 10000), () => {
                                    if (!mini.active) return;
                                    mini.isUnderground = true; mini.setAlpha(0.25); mini.body.setSize(30, 22.5); mini.speed = 80;
                                    mini.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 5000), () => {
                                        if (!mini.active) return;
                                        mini.isUnderground = false; mini.setAlpha(1); mini.body.setSize(45, 30); mini.speed = 0;
                                        if (mini.body) mini.body.setVelocity(0, 0); sb();
                                    });
                                });
                            };
                            sb();
                        }
                        if (mini.whips) {
                            mini.body.setSize(52.5, 52.5);
                            const sw = () => {
                                if (!mini.active) return;
                                mini.whipTimer = this.time.delayedCall(Phaser.Math.Between(1000, 2000), () => {
                                    if (!mini.active) return;
                                    const d = Phaser.Math.Distance.Between(mini.x, mini.y, this.player.x, this.player.y);
                                    if (d <= 56) {
                                        const now = this.time.now;
                                        if (now - mini.lastHitTime >= 1000) {
                                            mini.lastHitTime = now;
                                            this.playerHealth -= mini.damage; this.updateHPBar();
                                            this.playerDamageFlash();
                                            if (this.inflateActive) this.inflateKnockback();
                                            if (this.playerHealth <= 0) { this.playerHealth = 0; this.showDeathOverlay(); }
                                        }
                                    }
                                    sw();
                                });
                            };
                            sw();
                        }
                        const aKey = `${sKey}_walk`;
                        if (!this.anims.exists(aKey)) {
                            this.anims.create({ key: aKey, frames: this.anims.generateFrameNumbers(sKey, { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
                        }
                        mini.play(aKey);
                        this.physics.moveToObject(mini, this.player, mini.speed);
                        this.enemies.add(mini);
                    }
                    scheduleSpawn();
                });
            };
            scheduleSpawn();
        }

        // Spinach Tempest: wanders + spawns a random spinach enemy every 2–8s
        if (def.spawnsAnySpinach) {
            enemy.isWanderer = true;
            this.tweens.add({ targets: enemy, angle: 360, duration: 600, loop: -1 });
            const spinachPool = [
                { key: 'spinach',       health: 35,  damage: 11, speed: 68,  scale: 0.25 },
                { key: 'small_spinach', health: 18,  damage: 5,  speed: 110, scale: 0.22 },
                { key: 'spinach_cyclone', health: 200, damage: 20, speed: 35, scale: 0.30, wanders: true },
            ];
            const scheduleTempestSpawn = () => {
                if (!enemy.active) return;
                enemy.cycloneTimer = this.time.delayedCall(Phaser.Math.Between(2000, 8000), () => {
                    if (!enemy.active) return;
                    const pick = Phaser.Utils.Array.GetRandom(spinachPool);
                    const sx   = enemy.x + Phaser.Math.Between(-80, 80);
                    const sy   = enemy.y + Phaser.Math.Between(-80, 80);
                    const mini = this.physics.add.sprite(sx, sy, pick.key);
                    mini.setScale(pick.scale).setDepth(5);
                    mini.health = pick.health; mini.maxHealth = pick.health;
                    mini.damage = pick.damage; mini.speed = pick.speed;
                    mini.lastHitTime = 0;
                    mini.splits = false; mini.shoots = false; mini.splitsInto = null;
                    mini.hydra = false; mini.burrowed = false; mini.whips = false;
                    mini.emitsGas = false; mini.snakeWhip = false;
                    mini.trap = false; mini.trapArmed = false; mini.bomb = false; mini.sweeps = false;
                    mini.phantom = false; mini.spawnsCarrotCori = false; mini.spawnsAnySpinach = false; mini.vineWhip = false; mini.spawnsMinion = null;
                    mini.isWanderer = pick.wanders ?? false;
                    if (mini.isWanderer) this.tweens.add({ targets: mini, angle: 360, duration: 900, loop: -1 });
                    const aKey = `${pick.key}_walk`;
                    if (!this.anims.exists(aKey)) {
                        this.anims.create({ key: aKey, frames: this.anims.generateFrameNumbers(pick.key, { start: 0, end: 1 }), frameRate: 5, repeat: -1 });
                    }
                    mini.play(aKey);
                    if (!mini.isWanderer) this.physics.moveToObject(mini, this.player, mini.speed);
                    this.enemies.add(mini);
                    scheduleTempestSpawn();
                });
            };
            scheduleTempestSpawn();
        }

        // Mulberry Monstrosity: vine whip attack within 100px every 2–5s, deals 20dmg
        if (def.vineWhip) {
            const scheduleVineWhip = () => {
                if (!enemy.active) return;
                enemy.whipTimer = this.time.delayedCall(Phaser.Math.Between(2000, 5000), () => {
                    if (!enemy.active) return;
                    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    if (dist <= 100) {
                        const now = this.time.now;
                        if (now - enemy.lastHitTime >= 1000) {
                            enemy.lastHitTime = now;
                            this.playerHealth -= 20;
                            this.updateHPBar();
                            this.playerDamageFlash();
                            if (this.inflateActive) this.inflateKnockback();
                            if (this.playerHealth <= 0) {
                                this.playerHealth = 0;
                                this.showDeathOverlay();
                            }
                        }
                        const g = this.add.graphics().setDepth(20);
                        g.lineStyle(4, 0x882244, 0.9);
                        g.beginPath();
                        g.moveTo(enemy.x, enemy.y);
                        g.lineTo(this.player.x, this.player.y);
                        g.strokePath();
                        this.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
                    }
                    scheduleVineWhip();
                });
            };
            scheduleVineWhip();
        }

        const animKey = `${type}_walk`;
        if (!this.anims.exists(animKey)) {
            this.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(type, { start: 0, end: 1 }),
                frameRate: 4,
                repeat: -1,
            });
        }
        enemy.play(animKey);
        this.enemies.add(enemy);

        // Move toward player every frame via physics
        this.physics.moveToObject(enemy, this.player, enemy.speed);
    },

    // Keep enemies chasing player (called via time event would lag; use overlap update instead)
    // We re-issue moveToObject in a slow repeating timer to keep direction fresh
    // Actually handled below in the overlap and a chase timer set up per enemy isn't ideal.
    // Simple solution: add a chase update in the scene update loop.

    // ─── Step 3: Bite weapon + enemy death + cricket drop ────────────────────────

};
