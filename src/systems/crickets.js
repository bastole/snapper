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
                if (dist < 36) {
                    enemy.trapArmed = false;
                    enemy.setAlpha(1);
                    // Flash and deal snap damage
                    this.tweens.add({ targets: enemy, scaleX: enemy.scaleX * 1.3, scaleY: enemy.scaleY * 1.3, duration: 80, yoyo: true });
                    if (!this.player.reviveInvincible) {
                        const now = this.time.now;
                        if (now - enemy.lastHitTime >= 1000) {
                            enemy.lastHitTime = now;
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
                if (d < 40) {
                    enemy.wanderTarget = this.pickCycloneWanderTarget();
                } else {
                    this.physics.moveTo(enemy, enemy.wanderTarget.x, enemy.wanderTarget.y, enemy.speed);
                }
                return;
            }
            if (enemy.trapArmed || enemy.bugCaught) { enemy.setVelocity(0, 0); return; }
            if (enemy.knockbackUntil && this.time.now < enemy.knockbackUntil) return;
            this.physics.moveToObject(enemy, this.player, enemy.speed);
        });

        this.crickets.getChildren().forEach(cricket => {
            if (cricket.specialType === 'treasure' || cricket.specialType === 'wormbox' || cricket.specialType === 'fullbox') return;
            const dist = Phaser.Math.Distance.Between(px, py, cricket.x, cricket.y);
            if (dist < this.magnetRange) {
                this.physics.moveToObject(cricket, this.player, 220);
            } else {
                if (cricket.body) cricket.body.setVelocity(0, 0);
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
            playSfx(this, 'sfx_item_heal');
            return;
        }
        if (cricket.specialType === 'treasure') {
            cricket.destroy();
            this.playerLevel++;
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
            playSfx(this, 'sfx_levelup');
            this.updateXPBar();
            this.showLevelUp();
        }
    },

    canDamageEnemy(enemy) {
        return enemy.active && !enemy.isUnderground && !enemy.mantisVanishing;
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
            enemy.speed += 18;
            const newScale = 0.32 - (3 - heads) * 0.04;
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
        const range = 110;
        const burst = this.add.circle(this.player.x, this.player.y, range, 0xffffff, 0.25).setDepth(20);
        this.tweens.add({ targets: burst, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 250, onComplete: () => burst.destroy() });
        const toKill = [];
        this.enemies.getChildren().slice().forEach(e => {
            if (!this.canDamageEnemy(e)) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
            if (dist < range) {
                const a = Math.atan2(e.y - this.player.y, e.x - this.player.x);
                this.applyKnockback(e, a, 220);
                this.damageDealt += 15; e.health -= 15;
                this.playEnemyHurtSfx();
                if (e.health <= 0) toKill.push(e);
            }
        });
        toKill.forEach(e => this.killEnemy(e));
        this._inInflateKnockback = false;
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

        this.playerHealth -= enemy.damage;
        this.updateHPBar();
        this.playerDamageFlash();
        if (this.inflateActive) this.inflateKnockback();
        if (enemy.emitsGas) this.applyPoison(2);

        // Bug Catcher — chance to immobilize the attacker
        if (this.bugCatcherChance > 0 && Math.random() < this.bugCatcherChance && enemy.active) {
            enemy.setVelocity(0, 0);
            enemy.bugCaught = true;
            enemy.setTint(0xbb66ff);
            this.time.delayedCall(this.bugCatcherDuration, () => {
                if (enemy.active) { enemy.bugCaught = false; enemy.clearTint(); }
            });
        }

        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            this.updateHPBar();
            this.showDeathOverlay();
        }
    },


};
