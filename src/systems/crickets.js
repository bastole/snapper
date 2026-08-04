import { playSfx } from '../audio.js';
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
            if (enemy.isCharging || enemy.speed === 0) return;
            if (enemy.isWanderer) {
                if (!enemy.wanderTarget) enemy.wanderTarget = this.pickCycloneWanderTarget();
                const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, enemy.wanderTarget.x, enemy.wanderTarget.y);
                if (d < 80) {
                    enemy.wanderTarget = this.pickCycloneWanderTarget();
                } else {
                    this.physics.moveTo(enemy, enemy.wanderTarget.x, enemy.wanderTarget.y, enemy.speed);
                    // Sprites face right by default; flip when moving left.
                    if (enemy.wanderTarget.x > enemy.x) enemy.setFlipX(false);
                    else if (enemy.wanderTarget.x < enemy.x) enemy.setFlipX(true);
                }
                return;
            }
            if (enemy.trapArmed || enemy.bugCaught) { enemy.setVelocity(0, 0); return; }
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
            // Sprites face right by default; flip when moving left.
            if (vx > 0) enemy.setFlipX(false);
            else if (vx < 0) enemy.setFlipX(true);
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

    collectCricket(player, cricket) {
        if (cricket.specialType === 'fullbox') {
            cricket.destroy();
            this.playerHealth = this.playerMaxHealth;
            this.updateHPBar();
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
            this.playerLevel++;
            this.treasuresCollected++;
            this.updateScore();
            playSfx(this, 'sfx_levelup');
            this.updateXPBar();
            this.showLevelUp();
            return;
        }

        this.xp += cricket.xpValue ?? 1;
        cricket.destroy();
        playSfx(this, 'sfx_item_collect');
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
    // inherently stationary type (Lettuce Shooter/Oregano Fan always; Carrot Mole
    // while surfaced), a dormant Lettuce Trap waiting to be triggered, or any enemy
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
            // Speed increases and shrinks slightly as heads are lost
            enemy.speed += 36;
            const newScale = 1.28 - (3 - heads) * 0.16;
            enemy.setScale(newScale);
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
