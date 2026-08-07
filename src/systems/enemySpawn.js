export const EnemySpawnMethods = {

    // Emergency spawn-rate boost — if the live enemy count is under 50 once the level
    // has run long enough, quadruples the spawn rate so the field doesn't feel empty.
    // Checking starts at 5 minutes elapsed on every level except Level 5, which starts
    // checking earlier, at 3 minutes elapsed (this.gameTime counts down from 600 to 0,
    // so "5 minutes elapsed" is gameTime <= 300 and "3 minutes elapsed" is gameTime <=
    // 420). Once triggered, the boost lingers for 5s after the count rises back above
    // 50, so it doesn't flicker on/off if the count hovers right at the line.
    getSpawnBoostMultiplier() {
        const boostStartsAt = this.level === 5 ? 420 : 300;
        const timeLeft = this.gameTime;
        const count    = this.enemies.getChildren().length;

        if (timeLeft <= boostStartsAt && count < 50) {
            this.spawnBoostUntil = this.time.now + 5000;
            return 4;
        }
        if (this.spawnBoostUntil && this.time.now < this.spawnBoostUntil) return 4;
        return 1;
    },

    // Fired by spawnTimer instead of spawnEnemy() directly — applies the boost above by
    // spawning extra enemies in the same tick via a fractional accumulator, so e.g. a
    // ×1.5 multiplier averages out to one extra enemy every other tick rather than
    // rounding away the fraction.
    spawnTick() {
        this._spawnAccumulator = (this._spawnAccumulator ?? 0) + this.getSpawnBoostMultiplier();
        while (this._spawnAccumulator >= 1) {
            this._spawnAccumulator -= 1;
            this.spawnEnemy();
        }
    },

    // ─── Step 2: Enemy spawning ───────────────────────────────────────────────────
    spawnEnemy() {
        if (this.enemies.getChildren().length >= this.maxEnemies) return;

        const cam    = this.cameras.main;
        const margin = 160;
        let x, y;

        const side = Phaser.Math.Between(0, 3);
        if (side === 0) {
            // Top edge — clamp X along edge, keep Y strictly above camera
            x = Phaser.Math.Clamp(Phaser.Math.Between(cam.scrollX, cam.scrollX + cam.width), 128, 6272);
            y = Math.max(128, cam.scrollY - margin);
        } else if (side === 1) {
            // Bottom edge — clamp X along edge, keep Y strictly below camera
            x = Phaser.Math.Clamp(Phaser.Math.Between(cam.scrollX, cam.scrollX + cam.width), 128, 6272);
            y = Math.min(6272, cam.scrollY + cam.height + margin);
        } else if (side === 2) {
            // Left edge — keep X strictly left of camera, clamp Y along edge
            x = Math.max(128, cam.scrollX - margin);
            y = Phaser.Math.Clamp(Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height), 128, 6272);
        } else {
            // Right edge — keep X strictly right of camera, clamp Y along edge
            x = Math.min(6272, cam.scrollX + cam.width + margin);
            y = Phaser.Math.Clamp(Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height), 128, 6272);
        }

        // Safety: if world edge forces the enemy inside the camera, nudge it out
        if (x > cam.scrollX && x < cam.scrollX + cam.width && y > cam.scrollY && y < cam.scrollY + cam.height) {
            x = cam.scrollX - margin;
        }

        // elapsed = seconds since level started
        const elapsed = 600 - this.gameTime;

        // All `scale`/`scaleMin`/`scaleMax` values below are 2× their original tuning
        // (enemies now render at twice their old visual size) — see spawnEnemy()'s
        // shared body.setSize(...) line below for the matching +50%-only hitbox growth.
        const pools = {
            1: [
                { key: 'lettuce_small', health: 15,  damage: 5,  speed: 120, scale: 1.00, minTime: 0   },
                { key: 'basil_small',   health: 25,  damage: 5,  speed: 120, scale: 1.00, minTime: 0   },
                { key: 'lettuce_hopper',  health: 60,  damage: 8,  speed: 90,  scale: 1.40, minTime: 120, splits: true },
                { key: 'lettuce_shooter', health: 90,  damage: 6,  speed: 0,   scale: 1.00, minTime: 300, shoots: true },
                { key: 'basil_propeller', health: 120, damage: 10, speed: 360, scale: 1.00, minTime: 480 },
            ],
            2: [
                { key: 'rocket_small',  health: 20,  damage: 8,  speed: 140, scale: 1.00, minTime: 0   },
                { key: 'oregano_skunk', health: 40,  damage: 10, speed: 100, scale: 1.12, minTime: 0,   emitsGas: true },
                { key: 'rocket_knife',  health: 10,  damage: 15, speed: 300, scale: 1.00, minTime: 120 },
                { key: 'oregano_ghost', health: 80,  damage: 12, speed: 70,  scale: 1.20, minTime: 300 },
                { key: 'oregano_fan',   health: 60,  damage: 8,  speed: 100, scale: 1.00, minTime: 300, fanAI: true, projKey: 'projectile_oregano_ghost', projTint: 0x44ff44, projScale: 2.24, poisonous: true },
                { key: 'rocket_sword',  health: 50,  damage: 18, speed: 310, scale: 1.00, minTime: 480 },
            ],
            3: [
                { key: 'coriander_small',  health: 30,  damage: 10, speed: 144, scale: 1.00, minTime: 0   },
                { key: 'coriander_whip',   health: 60,  damage: 14, speed: 110, scale: 1.12, minTime: 150, whips: true },
                { key: 'carrot_mole',      health: 75,  damage: 12, speed: 120, scale: 1.04, minTime: 240, burrowed: true },
                { key: 'coriander_hydra',  health: 220, damage: 13, speed: 76,  scale: 2.56, minTime: 420, hydra: true },
                { key: 'carrot_dart',      health: 40,  damage: 17, speed: 290, scale: 1.00, minTime: 480, splitsInto: 'carrot_wheel', scaleMin: 0.72, scaleMax: 1.40 },
                { key: 'carrot_wheel',     health: 22,  damage: 9,  speed: 260, scale: 0.72, minTime: 480 },
            ],
            4: [
                { key: 'spinach_medium',  health: 35,  damage: 11, speed: 136, scale: 1.00, minTime: 0   },
                { key: 'spinach_small',   health: 18,  damage: 5,  speed: 220, scale: 0.88, minTime: 0   },
                { key: 'mulberry_bat',    health: 50,  damage: 13, speed: 280, scale: 1.08, minTime: 150 },
                { key: 'mulberry_snake',  health: 95,  damage: 15, speed: 96,  scale: 1.12, minTime: 300, shoots: true, projKey: 'projectile_mulberry_snake', projScale: 2.08, snakeWhip: true },
                { key: 'spinach_cyclone', health: 200, damage: 20, speed: 70,  scale: 1.20, minTime: 420, rare: true, spawnsEnemy: 'spinach_small', spawnsEnemyStats: { health: 18, damage: 9, speed: 220, scale: 0.88 } },
            ],
            5: [
                // 0:00 — cricket droppers (one from every prior level)
                { key: 'lettuce_small',   health: 15,  damage: 5,  speed: 120, scale: 1.00, minTime: 0   },
                { key: 'basil_small',     health: 25,  damage: 5,  speed: 120, scale: 1.00, minTime: 0   },
                { key: 'rocket_small',    health: 20,  damage: 6,  speed: 130, scale: 1.00, minTime: 0   },
                { key: 'oregano_skunk',   health: 45,  damage: 8,  speed: 110, scale: 1.00, minTime: 0,   emitsGas: true },
                { key: 'coriander_small', health: 30,  damage: 10, speed: 144, scale: 1.00, minTime: 0   },
                { key: 'spinach_medium',  health: 35,  damage: 11, speed: 136, scale: 1.00, minTime: 0   },
                { key: 'spinach_small',   health: 18,  damage: 5,  speed: 220, scale: 0.80, minTime: 0   },
                // 2:30 — vitaworm droppers
                { key: 'lettuce_hopper',  health: 60,  damage: 8,  speed: 90,  scale: 1.40, minTime: 150, splits: true },
                { key: 'rocket_knife',    health: 30,  damage: 15, speed: 220, scale: 1.00, minTime: 150 },
                { key: 'coriander_whip',  health: 60,  damage: 14, speed: 110, scale: 1.00, minTime: 150, whips: true },
                { key: 'carrot_mole',     health: 75,  damage: 12, speed: 120, scale: 1.00, minTime: 150, burrowed: true },
                { key: 'mulberry_bat',    health: 50,  damage: 13, speed: 280, scale: 1.00, minTime: 150 },
                // 3:30 — mealworm droppers
                { key: 'lettuce_shooter', health: 90,  damage: 6,  speed: 0,   scale: 1.00, minTime: 210, shoots: true },
                { key: 'oregano_ghost',   health: 150, damage: 12, speed: 70,  scale: 1.20, minTime: 210, emitsGas: true },
                { key: 'oregano_fan',     health: 80,  damage: 10, speed: 100, scale: 1.00, minTime: 210, fanAI: true, projKey: 'projectile_oregano_ghost', projTint: 0x44ff44, projScale: 2.24, poisonous: true },
                { key: 'coriander_hydra', health: 220, damage: 13, speed: 76,  scale: 2.40, minTime: 210, hydra: true },
                { key: 'carrot_wheel',    health: 22,  damage: 9,  speed: 260, scale: 0.72, minTime: 210 },
                { key: 'mulberry_snake',  health: 95,  damage: 15, speed: 96,  scale: 1.12, minTime: 210, shoots: true, projKey: 'projectile_mulberry_snake', projScale: 2.08, snakeWhip: true },
                // 5:00 — dragonfly droppers
                { key: 'basil_propeller', health: 120, damage: 10, speed: 360, scale: 1.00, minTime: 300 },
                { key: 'rocket_sword',    health: 200, damage: 18, speed: 180, scale: 1.40, minTime: 300 },
                { key: 'carrot_dart',     health: 40,  damage: 17, speed: 290, scale: 1.00, minTime: 300, splitsInto: 'carrot_wheel', scaleMin: 0.72, scaleMax: 1.40 },
                { key: 'spinach_cyclone', health: 200, damage: 20, speed: 70,  scale: 1.20, minTime: 300, rare: true, spawnsEnemy: 'spinach_small', spawnsEnemyStats: { health: 18, damage: 9, speed: 220, scale: 0.88 } },
                // 7:00 — Level 5 exclusives
                { key: 'lettuce_trap',         health: 180, damage: 10, snapDamage: 18, speed: 140, scale: 1.12, minTime: 420, trap: true },
                { key: 'basil_bomb',           health: 80,  damage: 0,  explodeDamage: 30, speed: 380, scale: 1.00, minTime: 420, bomb: true },
                { key: 'rocket_bustersword',   health: 90,  damage: 22, speed: 400, scale: 1.40, minTime: 420, sweeps: true },
                { key: 'oregano_phantom',      health: 250, damage: 25, speed: 100, scale: 1.40, minTime: 420, phantom: true },
                { key: 'coriander_carrot',     health: 500, damage: 30, speed: 40,  scale: 1.20, minTime: 420, spawnsCarrotCori: true },
                { key: 'spinach_tempest',      health: 500, damage: 25, speed: 320, scale: 1.60, minTime: 420, rare: true, spawnsAnySpinach: true },
                { key: 'mulberry_monstrosity', health: 350, damage: 15, speed: 280, scale: 1.60, minTime: 420, vineWhip: true, spawnsMinion: 'mulberry_bat' },
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
        // Collision/hitbox is 56.25% of the (now-doubled) visual sprite size — since the
        // visual size just doubled but the hitbox should only grow 50% (not 100%), the
        // hitbox-to-visual ratio drops from the old 75% to 75% × (1.5/2) = 56.25%. Types
        // below with their own explicit body.setSize(...) apply the same ×0.75 to their
        // own old literal pixel values for the same reason.
        enemy.body.setSize(enemy.body.width * 0.5625, enemy.body.height * 0.5625);
        enemy.health        = def.health;
        enemy.maxHealth     = def.health;
        enemy.damage        = def.damage;
        enemy.speed         = def.speed;
        enemy.lastHitTime   = 0;
        enemy.splits        = def.splits       ?? false;
        enemy.shoots        = def.shoots       ?? false;
        enemy.fanAI         = def.fanAI        ?? false;
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
        // Oregano Skunk's art faces the opposite way from every other enemy's default —
        // invert the shared left/right facing logic in crickets.js just for this type.
        enemy.flipInverted  = def.key === 'oregano_skunk';
        if (enemy.hydra) { enemy.hydraHeads = 3; enemy.body.setSize(247.5, 247.5); }
        if (enemy.burrowed) {
            // Carrot Mole: alternates surfaced (stationary, vulnerable) and burrowed (moving, invulnerable)
            // Starts surfaced
            enemy.isUnderground = false;
            enemy.speed = 0; // stationary while surfaced
            // Per sprites.md, frames 0–1 are the underground-movement loop and frames 2–3
            // are the surfaced/vulnerable loop — surfaced should never show the underground
            // frames. `${type}_walk` (0–1) is created generically further down in this
            // function; register the surfaced loop here so both are ready before the burrow
            // cycle's delayed callbacks need to switch between them.
            const moleWalkKey   = `${type}_walk`;
            const moleSurfaceKey = `${type}_surface`;
            if (!this.anims.exists(moleSurfaceKey)) {
                this.anims.create({
                    key: moleSurfaceKey,
                    frames: this.anims.generateFrameNumbers(type, { start: 2, end: 3 }),
                    frameRate: 8,
                    repeat: -1,
                });
            }
            const scheduleBurrow = () => {
                if (!enemy.active) return;
                // Surface phase: 3–10s, then burrow
                enemy.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 10000), () => {
                    if (!enemy.active) return;
                    // Go underground
                    enemy.isUnderground = true;
                    enemy.body.setSize(45, 33.75);
                    enemy.speed = 160;
                    enemy.play(moleWalkKey);
                    // Move toward player while underground for 3–5s
                    const burrowDur = Phaser.Math.Between(3000, 5000);
                    enemy.burrowTimer = this.time.delayedCall(burrowDur, () => {
                        if (!enemy.active) return;
                        // Resurface
                        enemy.isUnderground = false;
                        enemy.body.setSize(67.5, 45);
                        enemy.speed = 0;
                        if (enemy.body) enemy.body.setVelocity(0, 0);
                        enemy.play(moleSurfaceKey);
                        scheduleBurrow();
                    });
                });
            };
            scheduleBurrow();
        }

        // Shooters fire a projectile toward the player every 5–15 seconds, only while
        // on camera. Shared with Oregano Fan's phase-3 gas shot below (fireEnemyShotIfInView).
        if (enemy.shoots) {
            const scheduleShot = () => {
                if (!enemy.active) return;
                enemy.shootTimer = this.time.delayedCall(Phaser.Math.Between(5000, 15000), () => {
                    if (!enemy.active) return;
                    this.fireEnemyShotIfInView(enemy, def);
                    scheduleShot();
                });
            };
            scheduleShot();
        }

        // Oregano Fan: cycles through 4 behavior phases, each lasting a random 2–10s —
        // (1) chase the player directly at base speed (100), (2) pathfind to a random
        // point within the camera view, (3) hold position and fire a gas projectile
        // every 1–5s while on camera, (4) a fast 200px/s zigzag chase. Movement for
        // phases 1/2/4 is driven every frame by crickets.js's updateOreganoFanAI()
        // (see the enemy.fanAI check in attractCrickets()); this block only owns the
        // phase-switch timer and the phase-3 shot timer.
        if (enemy.fanAI) {
            enemy.fanPhase       = 1;
            enemy.fanZigzagSpeed = 200;
            enemy.fanZigzagPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const scheduleFanPhase = () => {
                if (!enemy.active) return;
                enemy.fanPhaseTimer = this.time.delayedCall(Phaser.Math.Between(2000, 10000), () => {
                    if (!enemy.active) return;
                    enemy.fanPhase = enemy.fanPhase >= 4 ? 1 : enemy.fanPhase + 1;
                    if (enemy.fanPhase === 2) enemy.wanderTarget = null; // force a fresh pick for the new wander leg
                    scheduleFanPhase();
                });
            };
            scheduleFanPhase();

            const scheduleFanShot = () => {
                if (!enemy.active) return;
                enemy.fanShotTimer = this.time.delayedCall(Phaser.Math.Between(1000, 5000), () => {
                    if (!enemy.active) return;
                    if (enemy.fanPhase === 3) this.fireEnemyShotIfInView(enemy, def);
                    scheduleFanShot();
                });
            };
            scheduleFanShot();
        }

        // Oregano Skunk: larger gas-cloud physics body for proximity damage
        if (def.emitsGas) {
            enemy.body.setSize(99, 99);
        }

        // Coriander Whip: wider contact hitbox for regular melee, plus a ranged lash attack
        if (def.whips) {
            enemy.body.setSize(78.75, 78.75); // wider hitbox so regular contact hits more reliably
            const scheduleWhip = () => {
                if (!enemy.active) return;
                enemy.whipTimer = this.time.delayedCall(Phaser.Math.Between(1000, 2000), () => {
                    if (!enemy.active) return;
                    const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                    if (dist <= 112) {
                        const now = this.time.now;
                        if (now - enemy.lastHitTime >= 1000) {
                            enemy.lastHitTime = now;
                            this.lastDamageSource = enemy.texture.key;
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
                    if (dist <= 130) {
                        const now = this.time.now;
                        if (now - enemy.lastHitTime >= 1000) {
                            enemy.lastHitTime = now;
                            this.lastDamageSource = enemy.texture.key;
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
            const spawnKey   = def.spawnsEnemy;
            const mStats     = def.spawnsEnemyStats ?? { health: 18, damage: 9, speed: 220, scale: 0.88 };
            const scheduleCycloneSpawn = () => {
                if (!enemy.active) return;
                enemy.cycloneTimer = this.time.delayedCall(Phaser.Math.Between(6000, 12000), () => {
                    if (!enemy.active) return;
                    const sx = enemy.x + Phaser.Math.Between(-160, 160);
                    const sy = enemy.y + Phaser.Math.Between(-160, 160);
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

        // Lettuce Trap: starts dormant; activates when the player steps on it
        if (def.trap) {
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
                    const range        = 180;
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
                                this.lastDamageSource = enemy.texture.key;
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
                    const sx = enemy.x + Phaser.Math.Between(-120, 120);
                    const sy = enemy.y + Phaser.Math.Between(-120, 120);
                    const mini = this.physics.add.sprite(sx, sy, minionKey);
                    mini.setScale(1.00).setDepth(5);
                    mini.health = 50; mini.maxHealth = 50;
                    mini.damage = 13; mini.speed = 280;
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
                    warn.fillRect(0, -28, dist, 56);
                    warn.setPosition(enemy.x, enemy.y);
                    warn.setRotation(angle);
                    this.tweens.add({ targets: warn, alpha: 0, delay: 140, duration: 160, onComplete: () => warn.destroy() });

                    // Flash enemy orange
                    this.tweens.add({ targets: enemy, alpha: 0.3, duration: 75, yoyo: true, repeat: 1 });

                    // Launch after 150ms freeze
                    this.time.delayedCall(150, () => {
                        if (!enemy.active) return;
                        const launchAngle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
                        const chargeSpeed = 1200;
                        if (enemy.body) enemy.body.setVelocity(Math.cos(launchAngle) * chargeSpeed, Math.sin(launchAngle) * chargeSpeed);
                        if (!this.anims.exists('carrot_dart_fly'))
                            this.anims.create({ key: 'carrot_dart_fly', frames: this.anims.generateFrameNumbers('carrot_dart', { start: 2, end: 3 }), frameRate: 8, repeat: -1 });
                        if (enemy.active) enemy.play('carrot_dart_fly');
                        this.time.delayedCall(500, () => {
                            if (!enemy.active) return;
                            if (enemy.body) enemy.body.setVelocity(0, 0);
                            enemy.isCharging = false;
                            if (enemy.active) enemy.play('carrot_dart_walk');
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
                    const proj  = this.physics.add.image(enemy.x, enemy.y, 'projectile_oregano_ghost');
                    proj.setScale(1.12).setDepth(7); // half of 2.24 — enemy projectiles are half size, double damage
                    proj.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320);
                    proj.damage = enemy.damage * 2;
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
                        this.lastDamageSource = enemy.texture.key;
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
            const spawnPool = ['coriander_small', 'coriander_whip', 'coriander_hydra', 'carrot_mole', 'carrot_dart', 'carrot_wheel'];
            const spawnStats = {
                coriander_small: { health: 30,  damage: 10, speed: 144, scale: 1.00 },
                coriander_whip:  { health: 60,  damage: 14, speed: 110, scale: 1.00 },
                coriander_hydra: { health: 220, damage: 13, speed: 76,  scale: 2.40 },
                carrot_mole:     { health: 75,  damage: 12, speed: 120, scale: 1.00 },
                carrot_dart:     { health: 40,  damage: 17, speed: 290, scale: 1.00 },
                carrot_wheel:    { health: 22,  damage: 9,  speed: 260, scale: 0.72 },
            };
            const scheduleSpawn = () => {
                if (!enemy.active) return;
                enemy.spawnTimer = this.time.delayedCall(Phaser.Math.Between(5000, 12000), () => {
                    if (!enemy.active) return;
                    for (let i = 0; i < 2; i++) {
                        const sKey  = Phaser.Utils.Array.GetRandom(spawnPool);
                        const sData = spawnStats[sKey];
                        const sx    = enemy.x + Phaser.Math.Between(-120, 120);
                        const sy    = enemy.y + Phaser.Math.Between(-120, 120);
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
                        if (mini.hydra) { mini.hydraHeads = 3; mini.body.setSize(247.5, 247.5); }
                        if (mini.burrowed) {
                            mini.isUnderground = false; mini.speed = 0;
                            const sb = () => {
                                if (!mini.active) return;
                                mini.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 10000), () => {
                                    if (!mini.active) return;
                                    mini.isUnderground = true; mini.setAlpha(0.25); mini.body.setSize(45, 33.75); mini.speed = 160;
                                    mini.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 5000), () => {
                                        if (!mini.active) return;
                                        mini.isUnderground = false; mini.setAlpha(1); mini.body.setSize(67.5, 45); mini.speed = 0;
                                        if (mini.body) mini.body.setVelocity(0, 0); sb();
                                    });
                                });
                            };
                            sb();
                        }
                        if (mini.whips) {
                            mini.body.setSize(78.75, 78.75);
                            const sw = () => {
                                if (!mini.active) return;
                                mini.whipTimer = this.time.delayedCall(Phaser.Math.Between(1000, 2000), () => {
                                    if (!mini.active) return;
                                    const d = Phaser.Math.Distance.Between(mini.x, mini.y, this.player.x, this.player.y);
                                    if (d <= 112) {
                                        const now = this.time.now;
                                        if (now - mini.lastHitTime >= 1000) {
                                            mini.lastHitTime = now;
                                            this.lastDamageSource = mini.texture.key;
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
            const spinachPool = [
                { key: 'spinach_medium', health: 35,  damage: 11, speed: 136, scale: 1.00 },
                { key: 'spinach_small',  health: 18,  damage: 5,  speed: 220, scale: 0.88 },
                { key: 'spinach_cyclone', health: 200, damage: 20, speed: 70, scale: 1.20, wanders: true },
            ];
            const scheduleTempestSpawn = () => {
                if (!enemy.active) return;
                enemy.cycloneTimer = this.time.delayedCall(Phaser.Math.Between(2000, 8000), () => {
                    if (!enemy.active) return;
                    const pick = Phaser.Utils.Array.GetRandom(spinachPool);
                    const sx   = enemy.x + Phaser.Math.Between(-160, 160);
                    const sy   = enemy.y + Phaser.Math.Between(-160, 160);
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
                    if (dist <= 200) {
                        const now = this.time.now;
                        if (now - enemy.lastHitTime >= 1000) {
                            enemy.lastHitTime = now;
                            this.lastDamageSource = enemy.texture.key;
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
        // Carrot Mole starts surfaced (isUnderground = false, set above) — show the
        // surfaced loop (frames 2–3) from the very first frame instead of the
        // underground-movement loop the generic play() call just started.
        if (enemy.burrowed) enemy.play(`${type}_surface`);
        this.enemies.add(enemy);

        // Move toward player every frame via physics
        this.physics.moveToObject(enemy, this.player, enemy.speed);
    },

    // Fires a projectile from `enemy` toward the player, but only if the enemy is
    // currently on camera. Shared by every "shoots"-style enemy (Lettuce Shooter,
    // Mulberry Snake) and Oregano Fan's phase-3 gas shot.
    fireEnemyShotIfInView(enemy, def) {
        const cam    = this.cameras.main;
        const margin = 100;
        const inView = enemy.x > cam.scrollX + margin &&
                       enemy.x < cam.scrollX + cam.width  - margin &&
                       enemy.y > cam.scrollY + margin &&
                       enemy.y < cam.scrollY + cam.height - margin;
        if (!inView) return;
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const proj  = this.physics.add.image(enemy.x, enemy.y, def.projKey ?? 'projectile_lettuce_shooter');
        // Enemy projectiles are half visual size but double damage (not the Hand's — those
        // are spawned separately in handBoss.js and untouched by this helper).
        proj.setScale((def.projScale ?? 0.96) * 0.5).setDepth(7);
        if (def.projTint) proj.setTint(def.projTint);
        proj.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320);
        if (def.key !== 'mulberry_snake') proj.setAngularVelocity(Phaser.Math.FloatBetween(0.5, 1.5) * 360);
        proj.damage = enemy.damage * 2;
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
            this.lastDamageSource = enemy.texture.key;
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
    },

    // Keep enemies chasing player (called via time event would lag; use overlap update instead)
    // We re-issue moveToObject in a slow repeating timer to keep direction fresh
    // Actually handled below in the overlap and a chase timer set up per enemy isn't ideal.
    // Simple solution: add a chase update in the scene update loop.

    // ─── Step 3: Bite weapon + enemy death + cricket drop ────────────────────────

};
