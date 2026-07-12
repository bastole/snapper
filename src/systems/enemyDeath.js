import { playSfx } from '../audio.js';
export const EnemyDeathMethods = {

    killEnemy(enemy) {
        // Hand mini-bosses: just drop a dragonfly and clean up
        if (enemy.isBossMini) {
            const idx = this.handMiniBossArray?.indexOf(enemy);
            if (idx >= 0) this.handMiniBossArray.splice(idx, 1);
            if (!this.bossSpawned) {
                const drop = this.physics.add.image(enemy.x, enemy.y, 'dragonfly');
                drop.setScale(0.80).setDepth(3);
                drop.xpValue = 10;
                this.crickets.add(drop);
            }
            if (enemy.shootTimer)  enemy.shootTimer.remove();
            if (enemy.whipTimer)   enemy.whipTimer.remove();
            if (enemy.burrowTimer) enemy.burrowTimer.remove();
            this.cleanupMiniBossTimers(enemy);
            enemy.hpBarBg?.destroy();
            enemy.hpBar?.destroy();
            enemy.hpLabel?.destroy();
            enemy.phaseLine?.destroy();
            enemy.destroy();
            return;
        }
        this.kills++;

        // Spike Shedder — heals 1 HP per 10 kills
        if (this.ownedWeapons.has('spikeshedder')) {
            this._spikeShedderKills++;
            if (this._spikeShedderKills >= 10) {
                this._spikeShedderKills = 0;
                this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 1);
                this.updateHPBar();
            }
        }

        // Big Fangs — chance to heal on kill
        if (this.bigFangsChance > 0 && Math.random() < this.bigFangsChance) {
            const heal = Math.floor(this.playerMaxHealth * this.bigFangsHeal);
            this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + heal);
            this.updateHPBar();
        }

        // Hyperactivity — speed burst every N kills
        if (this.hyperactivityLevel > 0) {
            this.hyperactivityKillsSince++;
            if (this.hyperactivityKillsSince >= this.hyperactivityKillGoal) {
                this.hyperactivityKillsSince = 0;
                const boost  = this.hyperactivityLevel === 1 ? 25 : this.hyperactivityLevel === 2 ? 50  : 75;
                const dur    = this.hyperactivityLevel === 1 ? 5000 : this.hyperactivityLevel === 2 ? 12000 : 20000;
                this.playerSpeed += boost;
                this.time.delayedCall(dur, () => { this.playerSpeed -= boost; });
                // Brief tint flash to signal activation
                this.tweens.add({ targets: this.player, tint: 0xffff44, duration: 200, yoyo: true });
            }
        }

        if (this.kills >= this.nextRerollAt) {
            this.rerolls++;
            this.nextRerollAt += 300;
        }
        // Rare special item check. A Foodbox is the "base" rare drop; whenever one
        // would drop, it has a 1-in-8 chance of being upgraded into a Fullbox and,
        // failing that, a 1-in-20 chance of being upgraded into a Treasure — instead
        // of Treasure being its own independent roll capped at 2 per game (which used
        // to make it fire twice in the first minute, then never again).
        const rand = Math.random();
        const foodboxChance = 0.03 + (this.vitaminBonus ?? 0) + (enemy._scratchFoodbox ?? 0) + (enemy._scratchFullbox ?? 0) + (enemy._scratchTreasure ?? 0);
        if (rand < foodboxChance) {
            if (Math.random() < 0.125) {
                // Fullbox — 1 in 8 chance to replace a Foodbox; heals to full. Always
                // drops, even during the boss fight.
                const item = this.physics.add.image(enemy.x, enemy.y, 'fullbox');
                item.setScale(1.20).setDepth(4);
                item.xpValue = 0;
                item.specialType = 'fullbox';
                this.tweens.add({ targets: item, scaleX: 1.44, scaleY: 1.44, duration: 250, yoyo: true, loop: -1 });
                this.crickets.add(item);
            } else if (!this.bossSpawned && Math.random() < 0.05) {
                // Treasure — 1 in 20 chance to replace a Foodbox; instant level-up.
                // Never drops during the boss fight.
                const item = this.physics.add.image(enemy.x, enemy.y, 'treasure');
                item.setScale(1.10).setDepth(4);
                item.xpValue = 0;
                item.specialType = 'treasure';
                this.tweens.add({ targets: item, scaleX: 1.30, scaleY: 1.30, duration: 250, yoyo: true, loop: -1 });
                this.crickets.add(item);
            } else {
                // Foodbox — always drops, even during the boss fight
                const item = this.physics.add.image(enemy.x, enemy.y, 'foodbox');
                item.setScale(1.10).setDepth(4);
                item.xpValue = 0;
                item.specialType = 'wormbox';
                this.tweens.add({ targets: item, scaleX: 1.30, scaleY: 1.30, duration: 350, yoyo: true, loop: -1 });
                this.crickets.add(item);
            }
        } else if (this.bossSpawned) {
            // No XP insects once the boss is on the field
        } else {
            // Normal drop
            const dropTable = {
                lettuce_hopper:       { xpValue: 3,  key: 'vitaworm',  scale: 0.60 },
                lettuce_shooter:      { xpValue: 5,  key: 'mealworm',  scale: 0.70 },
                basil_propeller:      { xpValue: 10, key: 'dragonfly', scale: 0.80 },
                rocket_knife:         { xpValue: 3,  key: 'vitaworm',  scale: 0.60 },
                oregano_ghost:        { xpValue: 5,  key: 'mealworm',  scale: 0.70 },
                oregano_fan:          { xpValue: 5,  key: 'mealworm',  scale: 0.70 },
                rocket_sword:         { xpValue: 10, key: 'dragonfly', scale: 0.80 },
                coriander_whip:       { xpValue: 3,  key: 'vitaworm',  scale: 0.60 },
                carrot_mole:          { xpValue: 3,  key: 'vitaworm',  scale: 0.60 },
                coriander_hydra:      { xpValue: 5,  key: 'mealworm',  scale: 0.70 },
                carrot_dart:          { xpValue: 10, key: 'dragonfly', scale: 0.80 },
                carrot_wheel:         { xpValue: 5,  key: 'mealworm',  scale: 0.70 },
                mulberry_bat:         { xpValue: 3,  key: 'vitaworm',  scale: 0.60 },
                mulberry_snake:       { xpValue: 5,  key: 'mealworm',  scale: 0.70 },
                spinach_cyclone:      { xpValue: 10, key: 'dragonfly', scale: 0.80 },
                // Level 5 exclusives
                lettuce_trap:         { xpValue: 10, key: 'dragonfly', scale: 0.80 },
                basil_bomb:           { xpValue: 10, key: 'dragonfly', scale: 0.80 },
                rocket_great_sword:   { xpValue: 10, key: 'dragonfly', scale: 0.80 },
                oregano_phantom:      { xpValue: 10, key: 'dragonfly', scale: 0.80 },
                coriander_carrot:     { xpValue: 10, key: 'dragonfly', scale: 0.80 },
                spinach_tempest:      { xpValue: 10, key: 'dragonfly', scale: 0.80 },
                mulberry_monstrosity: { xpValue: 10, key: 'dragonfly', scale: 0.80 },
            };
            const drop = dropTable[enemy.texture?.key] ?? { xpValue: 1, scale: 0.50 };

            if (enemy._killedByStarvedChomp) {
                // Instant doubled XP, no cricket spawned
                const xpGain = (drop.xpValue ?? 1) * 2;
                this.xp += xpGain;
                this.updateXPBar();
                const t = this.add.text(enemy.x, enemy.y - 10, `+${xpGain} XP`, {
                    fontSize: '10px', fontFamily: 'Arial', color: '#ffff44',
                }).setDepth(25).setOrigin(0.5);
                this.tweens.add({ targets: t, y: t.y - 28, alpha: 0, duration: 600, onComplete: () => t.destroy() });
                while (this.xp >= this.xpToNext) {
                    this.xp -= this.xpToNext;
                    this.xpToNext = Math.floor(this.xpToNext * 1.2);
                    this.playerLevel++;
                    playSfx(this, 'sfx_levelup');
                    this.updateXPBar();
                    this.showLevelUp();
                }
            } else if (enemy._killedByBugBuster) {
                // Drop a live, regular (non-evolved) Pupa Mine right where the enemy died —
                // it triggers naturally like any other mine, no pickup step — AND the normal XP insect
                this.spawnPupaMine(enemy.x - 8, enemy.y);

                const cricket = this.physics.add.image(enemy.x + 8, enemy.y, drop.key ?? 'cricket');
                cricket.setScale(drop.scale).setDepth(3);
                cricket.xpValue = drop.xpValue;
                this.crickets.add(cricket);
            } else {
                const cricket = this.physics.add.image(enemy.x, enemy.y, drop.key ?? 'cricket');
                cricket.setScale(drop.scale).setDepth(3);
                cricket.xpValue = drop.xpValue;
                this.crickets.add(cricket);
            }
        }

        // Lettuce Hopper splits into 2 Iceberg Lettuces
        if (enemy.splits) {
            for (let i = 0; i < 2; i++) {
                const ox = enemy.x + Phaser.Math.Between(-20, 20);
                const oy = enemy.y + Phaser.Math.Between(-20, 20);
                const split = this.physics.add.sprite(ox, oy, 'iceberg_lettuce');
                split.setScale(0.25);
                split.setDepth(5);
                split.health = 40; split.maxHealth = 40;
                split.damage = 5;  split.speed = 60;
                split.lastHitTime = 0;
                split.splits = false; split.shoots = false; split.splitsInto = null; split.hydra = false; split.burrowed = false; split.whips = false; split.emitsGas = false; split.snakeWhip = false; split.isWanderer = false;
                if (!this.anims.exists('iceberg_lettuce_walk')) {
                    this.anims.create({ key: 'iceberg_lettuce_walk', frames: this.anims.generateFrameNumbers('iceberg_lettuce', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
                }
                split.play('iceberg_lettuce_walk');
                this.enemies.add(split);
            }
        }

        // Carrot Dart splits into 2 Carrot Wheels
        if (enemy.splitsInto === 'carrot_wheel') {
            for (let i = 0; i < 2; i++) {
                const ox = enemy.x + Phaser.Math.Between(-25, 25);
                const oy = enemy.y + Phaser.Math.Between(-25, 25);
                const wheelScale = (enemy.spawnScale ?? 0.25) * 0.6;
                const wheel = this.physics.add.sprite(ox, oy, 'carrot_wheel');
                wheel.setScale(wheelScale).setDepth(5);
                wheel.health = 22; wheel.maxHealth = 22;
                wheel.damage = 9;  wheel.speed = 130;
                wheel.lastHitTime = 0;
                wheel.splits = false; wheel.shoots = false; wheel.splitsInto = null; wheel.hydra = false; wheel.burrowed = false; wheel.whips = false; wheel.emitsGas = false; wheel.snakeWhip = false; wheel.isWanderer = false;
                const wKey = 'carrot_wheel_walk';
                if (!this.anims.exists(wKey)) {
                    this.anims.create({ key: wKey, frames: this.anims.generateFrameNumbers('carrot_wheel', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
                }
                wheel.play(wKey);
                this.physics.moveToObject(wheel, this.player, wheel.speed);
                this.enemies.add(wheel);
            }
        }

        // Basil Bomb: explodes in a ~47px radius on death (1/3 of pupa mine diameter)
        if (enemy.bomb) {
            const bombRadius = Math.round(this.pupaRadius * 2 / 3);
            const g = this.add.graphics().setDepth(20);
            g.fillStyle(0xff6600, 0.65);
            g.fillCircle(enemy.x, enemy.y, bombRadius);
            this.tweens.add({ targets: g, alpha: 0, scaleX: 1.4, scaleY: 1.4, duration: 300, onComplete: () => g.destroy() });
            if (!this.player.reviveInvincible) {
                const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                if (dist <= bombRadius) {
                    this.playerHealth -= enemy.explodeDamage;
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

        // Oregano Phantom: bursts into 3 randomly aimed poisonous projectiles on death
        if (enemy.phantom) {
            for (let i = 0; i < 3; i++) {
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
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
                    this.applyPoison(6);
                    if (this.playerHealth <= 0) {
                        this.playerHealth = 0;
                        this.showDeathOverlay();
                    }
                    proj.destroy();
                });
                this.scheduleProjectileDespawn(proj, 4000);
            }
        }

        if (enemy.shootTimer)   enemy.shootTimer.remove();
        if (enemy.whipTimer)    enemy.whipTimer.remove();
        if (enemy.burrowTimer)  enemy.burrowTimer.remove();
        if (enemy.dartTimer)    enemy.dartTimer.remove();
        if (enemy.cycloneTimer) enemy.cycloneTimer.remove();
        if (enemy.sweepTimer)   enemy.sweepTimer.remove();
        if (enemy.minionTimer)  enemy.minionTimer.remove();
        if (enemy.phantomTimer) enemy.phantomTimer.remove();
        if (enemy.spawnTimer)   enemy.spawnTimer.remove();
        enemy.destroy();
    },


};
