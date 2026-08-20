import { playSfx } from '../audio.js';

// Basil Bomb: distance at which it stops chasing and starts arming (see
// updateBasilBombArming below) — bigger than the explosion radius itself
// (enemyDeath.js's bombRadius, ~93px) so the player has room to notice the
// shake/grow and back off before it's actually committed.
const BASIL_BOMB_ARM_RADIUS = 150;

export const CricketMethods = {

    // ─── Step 4: Cricket collection + XP bar ─────────────────────────────────────
    attractCrickets() {
        const px = this.player.x;
        const py = this.player.y;

        this.enemies.getChildren().forEach(enemy => {
            // Lettuce Trap: snap shut when player walks over it
            if (enemy.trapArmed) {
                const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                if (dist < 72) {
                    enemy.trapArmed = false;
                    enemy.setFrame(1);
                    this.time.delayedCall(200, () => { if (enemy.active) enemy.setFrame(2); });
                    // Flash and deal snap damage
                    this.tweens.add({ targets: enemy, scaleX: enemy.scaleX * 1.3, scaleY: enemy.scaleY * 1.3, duration: 80, yoyo: true });
                    if (!this.player.reviveInvincible) {
                        const now = this.time.now;
                        if (now - enemy.lastHitTime >= 1000) {
                            enemy.lastHitTime = now;
                            this.lastDamageSource = enemy.texture.key;
                            this.playerHealth -= enemy.snapDamage;
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
                return; // stays stationary until snapped
            }
            if (enemy.isCharging) return;
            if (enemy.fanAI) { this.updateOreganoFanAI(enemy); return; }
            if (enemy.speed === 0) {
                // Stationary enemies (Lettuce Shooter, a surfaced Carrot Mole, etc.) never
                // move under their own power, but a knockback attack (Steel Slam, Inflate)
                // still slams a velocity burst directly into their body. Every other branch
                // below either holds that burst for its short knockbackUntil window and then
                // overwrites it with fresh AI-driven velocity, or explicitly zeroes it — this
                // branch used to do neither, so a knocked stationary enemy kept drifting in
                // that direction forever (nothing ever called setVelocity again) until it
                // slid clean off the edge of the world. Hold the knock, then re-zero once it
                // expires so it actually stays put like a stationary enemy should.
                if (enemy.knockbackUntil && this.time.now < enemy.knockbackUntil) return;
                enemy.setVelocity(0, 0);
                // Still visually track which side the player is on rather than freeze facing
                // whichever way they happened to spawn. Skipped for enemies currently
                // immobilised (bugCaught) — those keep holding their last facing, same as
                // before. (trapArmed already returned above.)
                if (!enemy.bugCaught) {
                    const facingRight = this.player.x > enemy.x;
                    enemy.setFlipX(enemy.flipInverted ? facingRight : !facingRight);
                }
                return;
            }
            if (enemy.isWanderer) {
                if (!enemy.wanderTarget) enemy.wanderTarget = this.pickCycloneWanderTarget();
                const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.wanderTarget.x, enemy.wanderTarget.y);
                if (d < 80) {
                    enemy.wanderTarget = this.pickCycloneWanderTarget();
                } else {
                    this.physics.moveTo(enemy, enemy.wanderTarget.x, enemy.wanderTarget.y, enemy.speed);
                    // Sprites face right by default; flip when moving left. (Inverted per-enemy
                    // for types like Oregano Skunk whose art faces the opposite way.)
                    const wanderRight = enemy.wanderTarget.x > enemy.x;
                    if (enemy.wanderTarget.x !== enemy.x) enemy.setFlipX(enemy.flipInverted ? wanderRight : !wanderRight);
                }
                return;
            }
            if (enemy.trapArmed || enemy.bugCaught) { enemy.setVelocity(0, 0); return; }
            // Basil Bomb: stationary once armed/primed (see updateBasilBombArming) — only
            // falls through to the normal chase movement below while still out of range.
            if (enemy.bomb && this.updateBasilBombArming(enemy)) return;
            if (enemy.knockbackUntil && this.time.now < enemy.knockbackUntil) return;

            // Give each enemy a fixed personal approach-angle bias plus a slow wobble, so a
            // crowd spreads out and curves in from different angles/with small detours instead
            // of every enemy beelining the exact same point and packing into one dense blob.
            // Lazily assigned on first use (same pattern as cricket._spinSpeed below) rather than
            // at every spawn site, since enemies are created from several different code paths.
            // Fades to 0 at close range so contact is still reliable — enemies converge for real
            // instead of orbiting the player forever without ever reaching them.
            if (enemy.approachOffset === undefined) {
                enemy.approachOffset  = Phaser.Math.FloatBetween(-25, 25) * (Math.PI / 180);
                enemy.detourAmplitude = Phaser.Math.FloatBetween(10, 20) * (Math.PI / 180);
                enemy.detourFreq      = Phaser.Math.FloatBetween(0.0006, 0.0015);
                enemy.detourPhase     = Phaser.Math.FloatBetween(0, Math.PI * 2);
            }
            const dist    = Phaser.Math.Distance.Between(enemy.x, enemy.y, px, py);
            const spread  = Phaser.Math.Clamp((dist - 120) / 480, 0, 1);
            const wobble  = Math.sin(this.time.now * enemy.detourFreq + enemy.detourPhase) * enemy.detourAmplitude;
            const bearing = Phaser.Math.Angle.Between(enemy.x, enemy.y, px, py);
            const angle   = bearing + (enemy.approachOffset + wobble) * spread;
            const vx = Math.cos(angle) * enemy.speed;
            enemy.setVelocity(vx, Math.sin(angle) * enemy.speed);
            // Sprites face right by default; flip when moving left. (Inverted per-enemy
            // for types like Oregano Skunk whose art faces the opposite way.)
            const movingRight = vx > 0;
            if (vx !== 0) enemy.setFlipX(enemy.flipInverted ? movingRight : !movingRight);
        });

        this.crickets.getChildren().forEach(cricket => {
            if (cricket.specialType === 'treasure' || cricket.specialType === 'wormbox' || cricket.specialType === 'fullbox') return;
            const dist = Phaser.Math.Distance.Between(px, py, cricket.x, cricket.y);
            if (dist < this.magnetRange) {
                this.physics.moveToObject(cricket, this.player, 440);
                if (cricket._spinSpeed === undefined) cricket._spinSpeed = Phaser.Math.FloatBetween(0.2, 1) * 360;
                cricket.setAngularVelocity(cricket._spinSpeed);
            } else {
                if (cricket.body) { cricket.body.setVelocity(0, 0); cricket.setAngularVelocity(0); }
            }
        });
    },

    // Oregano Fan's per-frame movement for whichever of its 4 phases is currently
    // active (the phase-switch timer and the phase-3 shot timer live in
    // enemySpawn.js's spawnEnemy(), alongside the other enemy-type timers).
    updateOreganoFanAI(enemy) {
        if (enemy.knockbackUntil && this.time.now < enemy.knockbackUntil) return;
        const px = this.player.x, py = this.player.y;

        if (enemy.fanPhase === 3) {
            // Holds position while lining up its next gas shot
            enemy.setVelocity(0, 0);
            const facingRight = px > enemy.x;
            enemy.setFlipX(enemy.flipInverted ? facingRight : !facingRight);
            return;
        }

        if (enemy.fanPhase === 2) {
            // Pathfinds to a random point within the camera's current view
            if (!enemy.wanderTarget) enemy.wanderTarget = this.pickCycloneWanderTarget();
            const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.wanderTarget.x, enemy.wanderTarget.y);
            if (d < 80) {
                enemy.wanderTarget = this.pickCycloneWanderTarget();
            } else {
                this.physics.moveTo(enemy, enemy.wanderTarget.x, enemy.wanderTarget.y, enemy.speed);
                const wanderRight = enemy.wanderTarget.x > enemy.x;
                if (enemy.wanderTarget.x !== enemy.x) enemy.setFlipX(enemy.flipInverted ? wanderRight : !wanderRight);
            }
            return;
        }

        // Phase 1: straight chase toward the player at base speed. Phase 4: the same
        // chase but faster and weaving side to side via a sine offset on the approach
        // angle, reading as a zigzag path in.
        const bearing = Phaser.Math.Angle.Between(enemy.x, enemy.y, px, py);
        let angle = bearing;
        let speed = enemy.speed;
        if (enemy.fanPhase === 4) {
            speed = enemy.fanZigzagSpeed;
            angle += Math.sin(this.time.now * 0.006 + enemy.fanZigzagPhase) * (Math.PI / 3);
        }
        const vx = Math.cos(angle) * speed;
        enemy.setVelocity(vx, Math.sin(angle) * speed);
        const movingRight = vx > 0;
        if (vx !== 0) enemy.setFlipX(enemy.flipInverted ? movingRight : !movingRight);
    },

    // Basil Bomb's arm/detonate state machine. Returns true if the bomb should hold
    // still this frame (armed or primed — attractCrickets() skips its normal chase
    // movement in that case), false if it's still out of range and should keep chasing
    // normally. Once primed (frame 3 held), the countdown to detonation is unstoppable —
    // only the shake/grow "armed" stage can be reverted by the player backing off.
    updateBasilBombArming(enemy) {
        if (enemy.bombPrimed) { enemy.setVelocity(0, 0); return true; }
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const inRange = dist <= BASIL_BOMB_ARM_RADIUS;
        if (inRange && !enemy.bombArmed) this.armBasilBomb(enemy);
        else if (!inRange && enemy.bombArmed) this.disarmBasilBomb(enemy);
        if (enemy.bombArmed) { enemy.setVelocity(0, 0); return true; }
        return false;
    },

    // Stops moving, then shakes in place while growing 20% over 500ms. If it's still
    // armed (not reverted) when the grow tween completes, primeBasilBomb() takes over.
    armBasilBomb(enemy) {
        enemy.bombArmed = true;
        enemy.setVelocity(0, 0);
        enemy.bombBaseScale = enemy.spawnScale ?? enemy.scaleX;
        enemy.bombBaseX = enemy.x;
        enemy.bombBaseY = enemy.y;
        enemy.bombGrowTween = this.tweens.add({
            targets: enemy, scaleX: enemy.bombBaseScale * 1.2, scaleY: enemy.bombBaseScale * 1.2,
            duration: 500, ease: 'Sine.easeOut',
            onComplete: () => { if (enemy.active && enemy.bombArmed) this.primeBasilBomb(enemy); },
        });
        // Violent jitter around its resting spot for the same 500ms — a value-only
        // counter tween rather than reading/writing a running total, so it can't drift.
        enemy.bombShakeTween = this.tweens.addCounter({
            from: 0, to: 1, duration: 500, ease: 'Linear',
            onUpdate: () => {
                if (!enemy.active) return;
                enemy.x = enemy.bombBaseX + Phaser.Math.Between(-8, 8);
                enemy.y = enemy.bombBaseY + Phaser.Math.Between(-8, 8);
            },
            onComplete: () => { if (enemy.active) { enemy.x = enemy.bombBaseX; enemy.y = enemy.bombBaseY; } },
        });
    },

    // Only reachable before priming — the player stepped back out of BASIL_BOMB_ARM_RADIUS
    // in time. Cancels the shake/grow and restores its exact pre-arm scale/position so it
    // can resume chasing from updateBasilBombArming()'s next "not in range" frame.
    disarmBasilBomb(enemy) {
        enemy.bombArmed = false;
        enemy.bombGrowTween?.stop();  enemy.bombGrowTween = null;
        enemy.bombShakeTween?.stop(); enemy.bombShakeTween = null;
        if (enemy.bombBaseScale !== undefined) enemy.setScale(enemy.bombBaseScale);
        if (enemy.bombBaseX !== undefined) { enemy.x = enemy.bombBaseX; enemy.y = enemy.bombBaseY; }
    },

    // The point of no return — holds the 3rd frame (index 2, otherwise unused by the
    // walk animation's 2-frame loop) for 200ms then detonates via the normal killEnemy()
    // death path, same as an unarmed bomb walking straight into the player.
    primeBasilBomb(enemy) {
        enemy.bombPrimed = true;
        enemy.bombShakeTween?.stop(); enemy.bombShakeTween = null;
        if (enemy.bombBaseX !== undefined) { enemy.x = enemy.bombBaseX; enemy.y = enemy.bombBaseY; }
        enemy.anims.stop();
        enemy.setFrame(2);
        enemy.bombDetonateTimer = this.time.delayedCall(200, () => {
            if (!enemy.active) return;
            this.killEnemy(enemy);
        });
    },

    collectCricket(player, cricket) {
        if (cricket.specialType === 'fullbox') {
            cricket.destroy();
            this.playerHealth = this.playerMaxHealth;
            this.updateHPBar();
            this.fullboxesCollected++;
            this.updateScore();
            playSfx(this, 'sfx_item_heal');
            return;
        }
        if (cricket.specialType === 'wormbox') {
            cricket.destroy();
            this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + this.playerMaxHealth * 0.5);
            this.updateHPBar();
            this.foodboxesCollected++;
            this.updateScore();
            playSfx(this, 'sfx_item_heal');
            return;
        }
        if (cricket.specialType === 'treasure') {
            cricket.destroy();
            this.treasuresCollected++;
            this.updateScore();
            playSfx(this, 'sfx_levelup');
            // M-key debug freeze: treasure is still consumed and scored, but grants
            // no instant level and opens no upgrade screen.
            if (!this.xpFrozen) {
                this.playerLevel++;
                this.updateXPBar();
                this.showLevelUp();
            }
            return;
        }

        cricket.destroy();
        playSfx(this, 'sfx_item_collect');
        // M-key debug freeze: insects are still collected, but the XP bar doesn't
        // move and can't trigger a level-up.
        if (this.xpFrozen) return;

        this.xp += cricket.xpValue ?? 1;
        this.updateXPBar();

        if (this.xp >= this.xpToNext) {
            this.xp      -= this.xpToNext;
            this.xpToNext = Math.floor(this.xpToNext * 1.2);
            this.playerLevel++;
            this.updateScore();
            playSfx(this, 'sfx_levelup');
            this.updateXPBar();
            this.showLevelUp();
        }
    },

    canDamageEnemy(enemy) {
        return enemy.active && !enemy.isUnderground && !enemy.mantisVanishing;
    },

    // True for an enemy that can't currently move under its own power — either an
    // inherently stationary type (Lettuce Shooter always; Carrot Mole while surfaced),
    // a dormant Lettuce Trap waiting to be triggered, or any enemy
    // currently frozen by an immobilize effect (Bug Catcher, Steel Slam, etc). Used
    // to let the enemy-vs-enemy collider skip physical separation for these — a
    // stationary shooter shouldn't be able to block/push around the crowd chasing
    // the player, or be shoved off its spot by that same crowd.
    isEnemyImmobile(enemy) {
        return enemy.speed === 0 || enemy.trapArmed || enemy.bugCaught;
    },

    playEnemyHurtSfx() {
        playSfx(this, 'sfx_enemy_hurt', 0.18);
    },

    checkHydraPhase(enemy) {
        if (!enemy.active || !enemy.hydra) return;
        const pct = enemy.health / enemy.maxHealth;
        const heads = pct > 2/3 ? 3 : pct > 1/3 ? 2 : 1;
        if (heads < enemy.hydraHeads) {
            enemy.hydraHeads = heads;
            // Speed increases as heads are lost; size stays fixed
            enemy.speed += 36;
            this.tweens.add({ targets: enemy, alpha: 0.1, duration: 120, yoyo: true, repeat: 2 });
        }
    },

    // Applies a burst of velocity and briefly locks the enemy out of the chase AI
    // (attractCrickets() re-issues moveToObject every frame, which would otherwise
    // overwrite the knockback velocity within a single frame — too fast to read as
    // a "knock" and instead looking like the enemy just kept walking) so the knock
    // actually carries the enemy backward for a short, snappy burst instead.
    applyKnockback(enemy, angle, speed, duration = 150) {
        if (!enemy.body) return;
        enemy.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        enemy.knockbackUntil = this.time.now + duration;
    },

    inflateKnockback() {
        if (this._inInflateKnockback) return;
        this._inInflateKnockback = true;
        // Level 2 (Inflate picked twice): double damage/knockback, 50% chance per
        // enemy hit to also inflict a random ailment for 1-3s.
        const level = this.ownedPassives.filter(p => p === 'Inflate').length;
        const dmg   = level >= 2 ? 30 : 15;
        const speed = level >= 2 ? 880 : 440;
        const range = 220;
        const burst = this.add.circle(this.player.x, this.player.y, range, 0xffffff, 0.25).setDepth(20);
        this.tweens.add({ targets: burst, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 250, onComplete: () => burst.destroy() });
        const toKill = [];
        this.enemies.getChildren().slice().forEach(e => {
            if (!this.canDamageEnemy(e)) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
            if (dist < range) {
                const a = Math.atan2(e.y - this.player.y, e.x - this.player.x);
                this.applyKnockback(e, a, speed);
                this.damageDealt += dmg; e.health -= dmg;
                this.playEnemyHurtSfx();
                if (level >= 2 && Math.random() < 0.5) this.inflictRandomAilment(e, 1000, 3000);
                if (e.health <= 0) toKill.push(e);
            }
        });
        toKill.forEach(e => this.killEnemy(e));
        this._inInflateKnockback = false;
    },

    // Applies one randomly-chosen status effect (poison, fire, slow, or immobilize)
    // to an enemy for a duration randomly picked between minMs and maxMs. Routes
    // through the same helpers/shared tint system every other weapon's status
    // effects use, so it flashes correctly alongside anything else already active.
    // Only rolls among ailments the enemy ISN'T already under — poison and slow in
    // particular are already near-ubiquitous from other weapons (Venom, Cold Glare,
    // Sticky Shot, etc.), so picking uniformly from all 4 regardless of what's
    // already active meant those rolls silently no-op'd most of the time (their own
    // apply functions already guard against re-triggering an active effect) while
    // immobilize — much rarer elsewhere — was left as the only one that visibly did
    // anything, making it look like the only possible outcome.
    inflictRandomAilment(enemy, minMs, maxMs) {
        if (!enemy?.active) return;
        const duration = Phaser.Math.Between(minMs, maxMs);
        const options = [];
        if (!enemy.poisoned)  options.push('poison');
        if (!enemy.burned)    options.push('fire');
        if (!enemy.slowed)    options.push('slow');
        if (!enemy.bugCaught) options.push('immobilize');
        if (options.length === 0) return; // already under every ailment at once
        const ailment = Phaser.Utils.Array.GetRandom(options);
        if (ailment === 'poison') {
            this.applyEnemyPoison(enemy, duration);
        } else if (ailment === 'fire') {
            this.igniteEnemy(enemy, duration);
        } else if (ailment === 'slow') {
            enemy.slowed = true; const bs = enemy.speed; enemy.speed = bs * 0.5; this.addStatusTint(enemy, 'slow', 0x88ddff);
            this.time.delayedCall(duration, () => { if (enemy.active) { enemy.speed = bs; this.removeStatusTint(enemy, 'slow'); enemy.slowed = false; } });
        } else if (ailment === 'immobilize') {
            enemy.bugCaught = true; enemy.setVelocity(0, 0);
            this.addStatusTint(enemy, 'immobilize', 0xbb66ff);
            this.time.delayedCall(duration, () => { if (enemy.active) { enemy.bugCaught = false; this.removeStatusTint(enemy, 'immobilize'); } });
        }
    },

    applyPoison(maxTicks = 4) {
        if (this.poisonTimer) { this.poisonTimer.remove(); this.poisonTimer = null; }
        this.isPoisoned = true;
        this.hpBar.setFillStyle(0x44ff44);
        let ticks = 0;
        this.poisonTimer = this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                if (this.isPaused || this.isLevelingUp) return;
                ticks++;
                this.playerHealth = Math.max(0, this.playerHealth - 3);
                this.updateHPBar();
                if (this.playerHealth <= 0) {
                    this.playerHealth = 0;
                    this.updateHPBar();
                    this.showDeathOverlay();
                }
                if (ticks >= maxTicks) {
                    this.poisonTimer.remove();
                    this.poisonTimer = null;
                    this.isPoisoned = false;
                    this.hpBar.setFillStyle(0xff3333);
                }
            },
        });
    },

    enemyHitPlayer(player, enemy) {
        if (enemy.isUnderground) return;
        if (player.reviveInvincible) return;
        // Basil Bomb has no contact damage — it detonates (handled in attractCrickets)
        if (enemy.bomb) { this.killEnemy(enemy); return; }
        const now = this.time.now;
        if (now - enemy.lastHitTime < 1000) return;
        enemy.lastHitTime = now;

        this.lastDamageSource = enemy.texture.key;
        this.playerHealth -= enemy.damage;
        this.updateHPBar();
        this.playerDamageFlash();
        if (this.inflateActive) this.inflateKnockback();
        if (enemy.emitsGas) this.applyPoison(2);

        // Bug Catcher — chance to immobilize the attacker
        if (this.bugCatcherChance > 0 && Math.random() < this.bugCatcherChance && enemy.active) {
            enemy.setVelocity(0, 0);
            enemy.bugCaught = true;
            this.addStatusTint(enemy, 'immobilize', 0xbb66ff);
            this.time.delayedCall(this.bugCatcherDuration, () => {
                if (enemy.active) { enemy.bugCaught = false; this.removeStatusTint(enemy, 'immobilize'); }
            });
        }

        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            this.updateHPBar();
            this.showDeathOverlay();
        }
    },


};
