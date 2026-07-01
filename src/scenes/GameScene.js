export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create(data) {
        this.level = data?.level ?? 1;

        // Reset any stale state left over from a previous run on this same scene instance
        this._deathOverlayShown = false;
        this.time.paused        = false;
        this.physics.resume();
        // Remove any leftover gamepad listener from the previous run to avoid stacking
        this.input.gamepad.removeAllListeners('down');

        const WORLD_W = 3200;
        const WORLD_H = 3200;

        this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

        // Background
        this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x1a3a1a);
        this.addGrid(WORLD_W, WORLD_H);

        // --- Player ---
        this.player = this.physics.add.sprite(WORLD_W / 2, WORLD_H / 2, 'snapper');
        this.player.setScale(0.25);
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.anims.create({
            key: 'snapper_walk',
            frames: this.anims.generateFrameNumbers('snapper', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1,
        });
        this.player.play('snapper_walk');

        // Camera
        this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // --- Input ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });

        // Gamepad: Start (9) = pause (pauseBtn stored as this.pauseBtn after UI is built)
        this.input.gamepad.on('down', (pad, button) => {
            if (button.index === 9 && !this.isLevelingUp && !this.isCountdown && !this.isLevelClear && !this.isGameOver) this.togglePause(this.pauseBtn);
        });

        // --- Groups ---
        this.enemies   = this.physics.add.group();
        this.crickets  = this.physics.add.group();
        this.offscreenArrows = this.add.graphics().setDepth(30).setScrollFactor(0);
        this.pupaGroup = this.physics.add.group(); // tracks live pupa mines for boss overlap

        // --- Player stats ---
        this.playerSpeed    = 160;
        this.playerHealth   = 100;
        this.playerMaxHealth = 100;
        this.xp             = 0;
        this.xpToNext       = 5;
        this.playerLevel    = 1;
        this.magnetRange    = 32;
        this.isLevelingUp   = false;
        this.isCountdown    = false;
        this.isLevelClear   = false;
        this.isGameOver     = false;
        this.pendingLevelUps = 0;
        this.fastUpgrade    = false;
        this.lastMoveAngle  = 0;
        this.kills          = 0;
        this.damageDealt    = 0;
        this.rerolls        = 0;
        this.nextRerollAt   = 300;
        this.wormboxSpawned  = 0;
        this.treasureSpawned = 0;
        this.gameTime        = 600;
        this.bossSpawned     = false;
        this.boss            = null;
        this.topBossHpBar    = null;
        this.topBossHpBarBg  = null;
        this.topBossLabel    = null;
        this.handFireZones   = [];
        this.handMiniBossArray = [];

        // --- Passive boost flags ---
        this.inflateActive  = false;
        this.deflectChance  = 0;

        // --- Status effects ---
        this.isPoisoned  = false;
        this.poisonTimer = null;

        // --- Bite weapon stats ---
        this.biteDamage = 20;
        this.biteRange  = 80;
        this.biteRate   = 3000;

        // --- Other weapon stats (initialised when unlocked) ---
        this.tailSlapDamage   = 25;
        this.tailSlapRange    = 100;
        this.tailSlapUpgraded = false;
        this.poopDamage       = 15;
        this.poopDuration     = 3000;
        this.poopUpgraded     = false;
        this.pebbleDamage     = 15;
        this.pebbleCount      = 3;
        this.pebblePierce     = 1;
        this.hissRange        = 120;
        this.hissUpgraded     = false;
        this.lickDamage       = 40;
        this.lickLevel        = 0;
        this.lickRangeBonus   = 0;
        this.wormWhipDamage   = 25;
        this.wormWhipRange    = 120;
        this.wormWhipLevel    = 0;
        this._whipSide        = 1;
        this.pupaDamage       = 50;
        this.pupaRadius       = 70;
        this.pupaLevel        = 0;
        this.skinDamage       = 45;
        this.skinLevel        = 0;
        this.woodieDamage     = 40;
        this.woodieLevel      = 0;
        this.dubiaShieldDamage = 20;
        this.dubiaLevel        = 0;
        this.dubiaShields      = [];
        this.dubiaAngle        = 0;
        this.dubiaOuterAngle   = 0;

        // --- New weapons ---
        this.poisonClawLevel   = 0;
        this.branchLevel       = 0;
        this.branchWidth       = 20;
        this.branchMaxHits     = 15;
        this.dustKickLevel     = 0;
        this.dustKickLength    = 180;
        this.dustKickSlowDuration = 2000;
        this.scratchLevel      = 0;

        // --- New passives ---
        this.coldGlareActive   = false;
        this.coldGlareCooldown = 30000;
        this.coldGlareSlow     = 1000;
        this.coldGlareCdLevel  = 0;
        this.coldGlareSlLevel  = 0;
        this.polycephalyChance = 0;
        this._polycephalyFiring = false;
        this.venomChance       = 0;
        this.venomDuration     = 2000;
        this.vitaminBonus      = 0;

        // Track which weapons the player owns
        this.ownedWeapons  = new Set(['bite']);
        // Track which passive boosts the player has picked (allows repeats)
        this.ownedPassives = [];

        // --- Collisions ---
        this.physics.add.overlap(this.player, this.crickets, this.collectCricket, null, this);
        this.physics.add.overlap(this.player, this.enemies,  this.enemyHitPlayer, null, this);
        this.physics.add.collider(this.enemies, this.enemies);

        // --- Timers ---
        this.spawnDelay    = 2500; // initial delay between each enemy spawn (ms)
        this.spawnMinDelay = 400;  // fastest it can ever get (ms)
        this.spawnTimer    = this.time.addEvent({ delay: this.spawnDelay, callback: this.spawnEnemy, callbackScope: this, loop: true });

        // Gradually increase spawn rate every 10 seconds, capped at spawnMinDelay
        this.spawnRampTimer = this.time.addEvent({
            delay: 10000,
            loop: true,
            callback: () => {
                if (this.spawnDelay > this.spawnMinDelay) {
                    this.spawnDelay = Math.max(this.spawnMinDelay, Math.floor(this.spawnDelay * 0.85));
                    this.spawnTimer.reset({ delay: this.spawnDelay, callback: this.spawnEnemy, callbackScope: this, loop: true });
                }
            },
        });
        this.biteTimer     = this.time.addEvent({ delay: this.biteRate, callback: this.doBite, callbackScope: this, loop: true });
        this.gameTimerEvent = this.time.addEvent({ delay: 1000, callback: this.tickTimer,  callbackScope: this, loop: true });

        // Passive regen — always on, 1 HP every 20 seconds
        this.regenDelay = 20000;
        this.regenTimer = this.time.addEvent({ delay: this.regenDelay, callback: this.doRegen, callbackScope: this, loop: true });

        // --- UI ---
        this.createUI();
    }

    // ─── Background grid ────────────────────────────────────────────────────────
    addGrid(w, h) {
        const g = this.add.graphics();
        g.lineStyle(1, 0x2a5a2a, 0.5);
        for (let x = 0; x <= w; x += 128) { g.moveTo(x, 0); g.lineTo(x, h); }
        for (let y = 0; y <= h; y += 128) { g.moveTo(0, y); g.lineTo(w, y); }
        g.strokePath();
    }

    // ─── UI ─────────────────────────────────────────────────────────────────────
    createUI() {
        const W = this.cameras.main.width;

        // XP bar
        this.xpBarBg = this.add.rectangle(W / 2, 12, W - 40, 16, 0x333333).setScrollFactor(0).setDepth(100);
        this.xpBar   = this.add.rectangle(20, 12, 0, 14, 0x00ff88).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

        // HP bar
        this.add.rectangle(W / 2, 32, W - 40, 10, 0x333333).setScrollFactor(0).setDepth(100);
        this.hpBar = this.add.rectangle(20, 32, W - 40, 8, 0xff3333).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

        // Labels
        this.levelText = this.add.text(W - 10, 4, 'Lv.1', {
            fontSize: '12px', fontFamily: 'Arial', color: '#ffffff',
        }).setScrollFactor(0).setDepth(102).setOrigin(1, 0);

        this.timerText = this.add.text(W / 2, 5, '10:00', {
            fontSize: '13px', fontFamily: 'Arial Black, Arial', color: '#ffffff',
        }).setScrollFactor(0).setDepth(102).setOrigin(0.5, 0);

        // Pause button
        this.isPaused = false;
        const pauseBtn = this.add.text(W - 10, 44, '⏸ PAUSE', {
            fontSize: '11px', fontFamily: 'Arial', color: '#ffffff',
            backgroundColor: '#333333', padding: { x: 12, y: 10 },
        }).setScrollFactor(0).setDepth(102).setOrigin(1, 0)
          .setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-20, -10, 120, 50), hitAreaCallback: Phaser.Geom.Rectangle.Contains });

        pauseBtn.on('pointerover', () => pauseBtn.setColor('#ffff00'));
        pauseBtn.on('pointerout',  () => pauseBtn.setColor('#ffffff'));
        pauseBtn.on('pointerdown', () => this.togglePause(pauseBtn));

        // ESC and P also toggle pause (blocked in countdown, level clear, game over, upgrade screen)
        this.input.keyboard.on('keydown-ESC', () => { if (!this.isCountdown && !this.isLevelClear && !this.isGameOver) this.togglePause(pauseBtn); });
        this.input.keyboard.on('keydown-P',   () => { if (!this.isCountdown && !this.isLevelClear && !this.isGameOver) this.togglePause(pauseBtn); });
        this.input.keyboard.on('keydown-U',   () => { if (!this.isPaused) this.showLevelUp(); });
        this.input.keyboard.on('keydown-F',   () => {
            if (this.isPaused || this.isLevelingUp) return;
            if (!this.boss?.active) {
                this.gameTimerEvent.remove();
                this.gameTime = 0;
                this.spawnBoss();
            }
            for (let i = 0; i < 20; i++) {
                const wx = Phaser.Math.Between(100, 3100);
                const wy = Phaser.Math.Between(100, 3100);
                const item = this.physics.add.image(wx, wy, 'cricket');
                item.setScale(0.55).setTint(0xff4488).setDepth(4);
                item.xpValue = 0;
                item.specialType = 'wormbox';
                this.tweens.add({ targets: item, scaleX: 0.65, scaleY: 0.65, duration: 350, yoyo: true, loop: -1 });
                this.crickets.add(item);
            }
            this.fastUpgrade    = true;
            this.pendingLevelUps = 28;
            this.showLevelUp();
        });
        this.input.keyboard.on('keydown-N',   () => {
            if (this.isPaused) return;
            this.gameTime = Math.max(0, this.gameTime - 60);
            // Apply 6 spawn-ramp ticks (one per 10s skipped)
            for (let i = 0; i < 6; i++) {
                if (this.spawnDelay > this.spawnMinDelay) {
                    this.spawnDelay = Math.max(this.spawnMinDelay, Math.floor(this.spawnDelay * 0.85));
                }
            }
            this.spawnTimer.reset({ delay: this.spawnDelay, callback: this.spawnEnemy, callbackScope: this, loop: true });
        });

        this.pauseBtn = pauseBtn;
    }

    togglePause(btn) {
        if (this.isLevelingUp) return;
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            this.time.paused = true;
            btn.setVisible(false);

            const W = this.cameras.main.width;
            const H = this.cameras.main.height;
            this.pauseOverlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setScrollFactor(0).setDepth(150);
            this.pauseLabel   = this.add.text(W / 2, H / 2 - 20, 'PAUSED', {
                fontSize: '48px', fontFamily: 'Arial Black, Arial',
                color: '#ffffff', stroke: '#000000', strokeThickness: 6,
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5);
            this.pauseSubLabel = this.add.text(W / 2, H / 2 + 30, 'PRESS ANY BUTTON TO RESUME', {
                fontSize: '14px', fontFamily: 'Arial', color: '#cccccc',
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5);

            this.pauseStatsLine = this.add.text(W / 2, H / 2 + 60, `Level ${this.playerLevel}   •   Kills: ${this.kills}   •   Damage: ${this.damageDealt}   •   Rerolls: ${this.rerolls}`, {
                fontSize: '13px', fontFamily: 'Arial', color: '#ffff88',
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5);

            const { weaponLine, boostLine } = this.buildLoadoutText();
            this.pauseWeaponLine = this.add.text(W / 2, H / 2 + 85, weaponLine, {
                fontSize: '11px', fontFamily: 'Arial', color: '#aaffaa',
                align: 'center', wordWrap: { width: W - 80 },
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5, 0);
            this.pauseBoostLine = this.add.text(W / 2, H / 2 + 120, boostLine, {
                fontSize: '11px', fontFamily: 'Arial', color: '#aaaaff',
                align: 'center', wordWrap: { width: W - 80 },
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5, 0);

            this._pauseQuitting = false;
            this.pauseQuitBtn = this.add.text(W / 2, H / 2 + 175, '[ QUIT TO MAIN MENU ]', {
                fontSize: '13px', fontFamily: 'Arial', color: '#ff8888',
                backgroundColor: '#330000', padding: { x: 16, y: 8 },
            }).setScrollFactor(0).setDepth(151).setOrigin(0.5).setInteractive({ useHandCursor: true });
            this.pauseQuitBtn.on('pointerover', () => this.pauseQuitBtn.setColor('#ffffff'));
            this.pauseQuitBtn.on('pointerout',  () => this.pauseQuitBtn.setColor('#ff8888'));
            this.pauseQuitBtn.on('pointerdown', () => {
                this._pauseQuitting = true;
                this.scene.start('LevelSelectScene');
            });

            // Any key resumes (exclude P/ESC which already have their own toggle handlers)
            this.pauseAnyKey = this.input.keyboard.on('keydown', (e) => {
                if (this.isPaused && e.key !== 'Escape' && e.key !== 'p' && e.key !== 'P') this.togglePause(btn);
            });
            // Register resume handlers on the next animation frame so the event
            // that triggered pause doesn't immediately re-fire and unpause
            requestAnimationFrame(() => {
                this.input.on('pointerdown', this._pausePointerHandler = () => {
                    if (this.isPaused && !this._pauseQuitting) this.togglePause(btn);
                });
                this.input.gamepad.on('down', this._pauseGamepadHandler = (pad, button) => {
                    if (this.isPaused && button.index !== 9 && !this._pauseQuitting) this.togglePause(btn);
                });
            });
        } else {
            this.physics.resume();
            this.time.paused = false;
            btn.setText('⏸ PAUSE');
            btn.setVisible(true);
            this.pauseOverlay?.destroy();
            this.pauseLabel?.destroy();
            this.pauseSubLabel?.destroy();
            this.pauseStatsLine?.destroy();
            this.pauseWeaponLine?.destroy();
            this.pauseBoostLine?.destroy();
            this.pauseQuitBtn?.destroy();
            this.input.keyboard.off('keydown', this.pauseAnyKey);
            this.input.off('pointerdown', this._pausePointerHandler);
            this.input.gamepad.off('down', this._pauseGamepadHandler);
        }
    }

    updateXPBar() {
        const W = this.cameras.main.width;
        this.xpBar.width = ((this.xp / this.xpToNext) * (W - 40));
        this.levelText.setText(`Lv.${this.playerLevel}`);
    }

    updateHPBar() {
        const W = this.cameras.main.width;
        this.hpBar.width = Math.max(0, (this.playerHealth / this.playerMaxHealth) * (W - 40));
    }

    // ─── Update loop ─────────────────────────────────────────────────────────────
    update() {
        if (this.isLevelingUp) return;
        this.handleMovement();
        this.attractCrickets();
        if (this.boss?.active) {
            if (this.level === 5) {
                this.updateHandAI();
                this.updateHandFireZones();
            } else if (this.level === 4) {
                this.updateMulberryMantisAI();
            } else if (this.level === 2) {
                this.updateRocketSpiderAI();
            } else if (this.level === 3) {
                this.updateCarrotScorpionAI();
            } else if (!this.boss.isCharging) {
                this.physics.moveToObject(this.boss, this.player, 80);
            }
        }
        this.updateBossHealthBar();
        this.updateDubiaShields();
        this.drawOffscreenArrows();
    }

    drawOffscreenArrows() {
        const g   = this.offscreenArrows;
        const cam = this.cameras.main;
        const W   = cam.width;
        const H   = cam.height;
        const pad = 18; // distance from screen edge to arrow tip

        g.clear();

        // Boss arrow — bright pink + larger for The Hand (level 5), purple for others
        if (this.boss?.active) {
            const sx = this.boss.x - cam.scrollX;
            const sy = this.boss.y - cam.scrollY;
            if (sx < 0 || sx > W || sy < 0 || sy > H) {
                const isHand = this.level === 5;
                const color  = isHand ? 0xff44cc : 0xcc44ff;
                const len    = isHand ? 18 : 10;
                const wing   = isHand ? 11 : 6;
                const cx = Phaser.Math.Clamp(sx, pad + 6, W - pad - 6);
                const cy = Phaser.Math.Clamp(sy, pad + 6, H - pad - 6);
                const angle = Math.atan2(sy - cy, sx - cx);
                const tx = cx + Math.cos(angle) * len;
                const ty = cy + Math.sin(angle) * len;
                const lx = cx + Math.cos(angle + Math.PI * 0.75) * wing;
                const ly = cy + Math.sin(angle + Math.PI * 0.75) * wing;
                const rx = cx + Math.cos(angle - Math.PI * 0.75) * wing;
                const ry = cy + Math.sin(angle - Math.PI * 0.75) * wing;
                g.fillStyle(color, 1);
                g.fillTriangle(tx, ty, lx, ly, rx, ry);
                g.lineStyle(isHand ? 2.5 : 1.5, 0x000000, 0.7);
                g.strokeTriangle(tx, ty, lx, ly, rx, ry);
            }
        }

        // Mini-boss arrows (purple) during The Hand fight
        if (this.level === 5 && this.handMiniBossArray?.length) {
            this.handMiniBossArray.forEach(mb => {
                if (!mb?.active) return;
                const sx = mb.x - cam.scrollX;
                const sy = mb.y - cam.scrollY;
                if (sx < 0 || sx > W || sy < 0 || sy > H) {
                    const cx = Phaser.Math.Clamp(sx, pad + 4, W - pad - 4);
                    const cy = Phaser.Math.Clamp(sy, pad + 4, H - pad - 4);
                    const angle = Math.atan2(sy - cy, sx - cx);
                    const len = 10, wing = 6;
                    const tx = cx + Math.cos(angle) * len;
                    const ty = cy + Math.sin(angle) * len;
                    const lx = cx + Math.cos(angle + Math.PI * 0.75) * wing;
                    const ly = cy + Math.sin(angle + Math.PI * 0.75) * wing;
                    const rx = cx + Math.cos(angle - Math.PI * 0.75) * wing;
                    const ry = cy + Math.sin(angle - Math.PI * 0.75) * wing;
                    g.fillStyle(0xcc44ff, 1);
                    g.fillTriangle(tx, ty, lx, ly, rx, ry);
                    g.lineStyle(1.5, 0x000000, 0.6);
                    g.strokeTriangle(tx, ty, lx, ly, rx, ry);
                }
            });
        }

        this.crickets.getChildren().forEach(item => {
            if (!item.active) return;
            const type = item.specialType;
            if (type !== 'treasure' && type !== 'wormbox') return;

            // Convert world coords to screen coords
            const sx = item.x - cam.scrollX;
            const sy = item.y - cam.scrollY;

            // Only draw arrow when item is outside the camera view
            if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) return;

            const color = type === 'treasure' ? 0xffd700 : 0xff4444;

            // Clamp the arrow to the screen edge
            const cx = Phaser.Math.Clamp(sx, pad + 4, W - pad - 4);
            const cy = Phaser.Math.Clamp(sy, pad + 4, H - pad - 4);

            // Angle pointing toward the item from the clamped edge point
            const angle = Math.atan2(sy - cy, sx - cx);

            // Arrow size
            const len  = 10;
            const wing = 6;

            const tx = cx + Math.cos(angle) * len;
            const ty = cy + Math.sin(angle) * len;

            const lx = cx + Math.cos(angle + Math.PI * 0.75) * wing;
            const ly = cy + Math.sin(angle + Math.PI * 0.75) * wing;
            const rx = cx + Math.cos(angle - Math.PI * 0.75) * wing;
            const ry = cy + Math.sin(angle - Math.PI * 0.75) * wing;

            g.fillStyle(color, 1);
            g.fillTriangle(tx, ty, lx, ly, rx, ry);

            // Subtle dark outline
            g.lineStyle(1.5, 0x000000, 0.6);
            g.strokeTriangle(tx, ty, lx, ly, rx, ry);
        });
    }

    // ─── Dubia Shields ───────────────────────────────────────────────────────────
    createDubiaShield(layer = 'single') {
        const shield = this.add.circle(this.player.x, this.player.y, 9, 0xcc7700);
        shield.setStrokeStyle(2, 0x884400);
        shield.setDepth(6);
        shield.layer = layer;
        shield.hitCooldowns = new Map();
        this.dubiaShields.push(shield);
        return shield;
    }

    updateDubiaShields() {
        if (this.dubiaLevel === 0) return;
        if (this.isPaused || this.isLevelingUp || this.isCountdown) return;

        const dt  = this.game.loop.delta / 1000;
        const now = this.time.now;
        const isFinal = this.dubiaLevel >= 4;

        if (isFinal) {
            this.dubiaAngle      += 1.5 * dt;
            this.dubiaOuterAngle -= 1.0 * dt;
            const inner = this.dubiaShields.filter(s => s.layer === 'inner');
            const outer = this.dubiaShields.filter(s => s.layer === 'outer');
            inner.forEach((shield, i) => {
                const a = this.dubiaAngle + (i / inner.length) * Math.PI * 2;
                shield.setPosition(this.player.x + Math.cos(a) * 70, this.player.y + Math.sin(a) * 70);
            });
            outer.forEach((shield, i) => {
                const a = this.dubiaOuterAngle + (i / outer.length) * Math.PI * 2;
                shield.setPosition(this.player.x + Math.cos(a) * 120, this.player.y + Math.sin(a) * 120);
            });
        } else {
            const speeds = [1.2, 1.6, 2.0];
            this.dubiaAngle += (speeds[this.dubiaLevel - 1] ?? 1.2) * dt;
            this.dubiaShields.forEach((shield, i) => {
                const a = this.dubiaAngle + (i / this.dubiaShields.length) * Math.PI * 2;
                shield.setPosition(this.player.x + Math.cos(a) * 90, this.player.y + Math.sin(a) * 90);
            });
        }

        this.dubiaShields.forEach(shield => {
            this.enemies.getChildren().forEach(enemy => {
                if (!this.canDamageEnemy(enemy)) return;
                const dist = Phaser.Math.Distance.Between(shield.x, shield.y, enemy.x, enemy.y);
                if (dist >= 14) return;
                const lastHit = shield.hitCooldowns.get(enemy) ?? 0;
                if (now - lastHit < 800) return;
                shield.hitCooldowns.set(enemy, now);
                this.damageDealt += this.dubiaShieldDamage;
                enemy.health -= this.dubiaShieldDamage;
                this.tweens.add({ targets: enemy, alpha: 0.3, duration: 60, yoyo: true });
                this.checkHydraPhase(enemy);
                if (enemy.health <= 0) this.killEnemy(enemy);
            });
            if (this.boss?.active) {
                const dist = Phaser.Math.Distance.Between(shield.x, shield.y, this.boss.x, this.boss.y);
                if (dist < 48) {
                    const lastHit = shield.hitCooldowns.get(this.boss) ?? 0;
                    if (now - lastHit >= 800) {
                        shield.hitCooldowns.set(this.boss, now);
                        this.damageBoss(this.dubiaShieldDamage);
                    }
                }
            }
        });
    }

    // ─── Step 1: Player movement ─────────────────────────────────────────────────
    handleMovement() {
        const speed = this.playerSpeed;
        let vx = 0, vy = 0;
        let usingAnalog = false;

        // Xbox controller: left stick takes priority; fall back to d-pad then keyboard
        const pad = this.input.gamepad.getPad(0);
        if (pad) {
            const sx = pad.leftStick.x;
            const sy = pad.leftStick.y;
            const DEAD = 0.15;
            if (Math.abs(sx) > DEAD || Math.abs(sy) > DEAD) {
                const mag = Math.min(1, Math.sqrt(sx * sx + sy * sy));
                vx = sx * speed * mag;
                vy = sy * speed * mag;
                usingAnalog = true;
            } else {
                // D-pad buttons: up=12, down=13, left=14, right=15
                if (pad.buttons[14]?.pressed) vx = -speed;
                if (pad.buttons[15]?.pressed) vx =  speed;
                if (pad.buttons[12]?.pressed) vy = -speed;
                if (pad.buttons[13]?.pressed) vy =  speed;
            }
        }

        if (!usingAnalog && vx === 0 && vy === 0) {
            // Keyboard fallback
            if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -speed;
            if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  speed;
            if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -speed;
            if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy =  speed;
        }

        // Normalise diagonal for d-pad and keyboard (analog stick already has natural magnitude)
        if (!usingAnalog && vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

        // Analog stick or d-pad movement while paused counts as "any input" → unpause
        if (this.isPaused && (vx !== 0 || vy !== 0)) {
            this.togglePause(this.pauseBtn);
            return;
        }

        this.player.setVelocity(vx, vy);
        const frozen = this.isPaused || this.isCountdown || this.isLevelingUp || this.isLevelClear;
        if (!frozen) {
            if (vx !== 0 || vy !== 0) this.lastMoveAngle = Math.atan2(vy, vx);
            if (vx < 0) this.player.setFlipX(true);
            else if (vx > 0) this.player.setFlipX(false);
        }
    }

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
        if (enemy.hydra) { enemy.hydraHeads = 3; enemy.body.setSize(110, 110); }
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
                    enemy.body.setSize(40, 30);
                    enemy.speed = 80;
                    // Move toward player while underground for 3–5s
                    const burrowDur = Phaser.Math.Between(3000, 5000);
                    enemy.burrowTimer = this.time.delayedCall(burrowDur, () => {
                        if (!enemy.active) return;
                        // Resurface
                        enemy.isUnderground = false;
                        enemy.setAlpha(1);
                        enemy.body.setSize(60, 40);
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
            enemy.body.setSize(88, 88);
            this.tweens.add({ targets: enemy, alpha: 0.55, duration: 900, yoyo: true, loop: -1 });
        }

        // Coriander Whip: wider contact hitbox for regular melee, plus a ranged lash attack
        if (def.whips) {
            enemy.body.setSize(70, 70); // wider hitbox so regular contact hits more reliably
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
                        if (mini.hydra) { mini.hydraHeads = 3; mini.body.setSize(110, 110); }
                        if (mini.burrowed) {
                            mini.isUnderground = false; mini.speed = 0;
                            const sb = () => {
                                if (!mini.active) return;
                                mini.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 10000), () => {
                                    if (!mini.active) return;
                                    mini.isUnderground = true; mini.setAlpha(0.25); mini.body.setSize(40, 30); mini.speed = 80;
                                    mini.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 5000), () => {
                                        if (!mini.active) return;
                                        mini.isUnderground = false; mini.setAlpha(1); mini.body.setSize(60, 40); mini.speed = 0;
                                        if (mini.body) mini.body.setVelocity(0, 0); sb();
                                    });
                                });
                            };
                            sb();
                        }
                        if (mini.whips) {
                            mini.body.setSize(70, 70);
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
    }

    // Keep enemies chasing player (called via time event would lag; use overlap update instead)
    // We re-issue moveToObject in a slow repeating timer to keep direction fresh
    // Actually handled below in the overlap and a chase timer set up per enemy isn't ideal.
    // Simple solution: add a chase update in the scene update loop.

    // ─── Step 3: Bite weapon + enemy death + cricket drop ────────────────────────
    doBite() {
        if (this.isPaused || this.isCountdown) return;
        const px = this.player.x;
        const py = this.player.y;

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
            if (dist <= this.biteRange && this.canDamageEnemy(enemy)) {
                this.damageDealt += this.biteDamage; enemy.health -= this.biteDamage;
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                this.maybeVenom(enemy);
                this.checkHydraPhase(enemy);
                if (enemy.health <= 0) this.killEnemy(enemy);
            }
        });
        if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= this.biteRange) {
            this.damageBoss(this.biteDamage);
        }

        // Always show bite circle so player can see the attack range
        const circle = this.add.circle(px, py, this.biteRange, 0xffffff, 0.12).setDepth(20);
        this.tweens.add({ targets: circle, alpha: 0, duration: 200, onComplete: () => circle.destroy() });
        this.maybePolycephaly(() => this.doBite());
    }

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
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                this.maybeVenom(enemy);
                if (enemy.health <= 0) this.killEnemy(enemy);
            }
        });
        if (this.boss?.active) {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
            if (dist <= this.tailSlapRange) {
                const toEnemy = Math.atan2(this.boss.y - this.player.y, this.boss.x - this.player.x);
                if (Math.abs(Phaser.Math.Angle.Wrap(toEnemy - angle)) <= arc / 2) this.damageBoss(this.tailSlapDamage);
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
    }

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
    }

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
    }

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
                    onComplete: () => { if (enemy.active) enemy.setTint(0x88ccff); } });
                this.time.delayedCall(2000, () => {
                    if (enemy.active) {
                        enemy.speed = baseSpeed;
                        enemy.clearTint();
                        enemy.slowed = false;
                    }
                });
            }
        });

        const g = this.add.graphics().setDepth(20);
        g.lineStyle(2, 0x44aaff, 0.6);
        g.beginPath();
        g.arc(this.player.x, this.player.y, this.hissRange, angle - arc / 2, angle + arc / 2);
        g.strokePath();
        this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
        this.maybePolycephaly(() => this.doHiss());
    }

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
                this.tweens.add({ targets: target, alpha: 0, duration: 60, yoyo: true, repeat: 1 });
                this.maybeVenom(target);
                if (target.health <= 0) this.killEnemy(target);
            }

            if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= lickRange) {
                this.damageBoss(this.lickDamage);
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
    }

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
    }

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
            mine.setImmovable(true);
            mine.body.setAllowGravity(false);
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

            // Explode when any enemy or boss steps on it
            this.physics.add.overlap(mine, this.enemies, explodeMine);
            if (this.boss?.active) this.physics.add.overlap(mine, this.boss, explodeMine);

            // Pulse to show it's active; auto-explode after 10s if untouched
            this.tweens.add({ targets: mine, alpha: 0.3, duration: 400, yoyo: true, loop: -1 });
            this.time.delayedCall(10000, explodeMine);
        }
        this.maybePolycephaly(() => this.doPupaMines());
    }

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
    }

    doWoodieBounce() {
        if (this.isPaused || this.isCountdown) return;
        const configs = [[1, 2], [2, 3], [3, 5]];
        const [count, maxBounces] = configs[this.woodieLevel - 1] || [1, 2];

        for (let i = 0; i < count; i++) {
            const angle  = Phaser.Math.FloatBetween(0, Math.PI * 2);
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
    }

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
    }

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
                done++;
                if (enemy.health <= 0) { this.killEnemy(enemy); t.remove(); return; }
                if (done >= ticks) {
                    t.remove();
                    if (enemy.active) { enemy.poisoned = false; enemy.clearTint(); }
                }
            },
        });
    }

    maybeVenom(enemy) {
        if (this.venomChance > 0 && Math.random() < this.venomChance) this.applyEnemyPoison(enemy, this.venomDuration);
    }

    maybePolycephaly(fn) {
        if (!this._polycephalyFiring && this.polycephalyChance > 0 && Math.random() < this.polycephalyChance) {
            this._polycephalyFiring = true;
            this.time.delayedCall(120, () => { fn(); this._polycephalyFiring = false; });
        }
    }

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
            this.tweens.add({ targets: nearest, alpha: 0, duration: 60, yoyo: true, repeat: 1 });
            this.applyEnemyPoison(nearest, duration);
            if (nearest.health <= 0) this.killEnemy(nearest);
        }
        if (this.boss?.active && Phaser.Math.Distance.Between(px, py, this.boss.x, this.boss.y) <= range) {
            this.damageBoss(damage);
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
    }

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

        const barLen  = 120;
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
            this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
            this.maybeVenom(enemy);
            if (enemy.health <= 0) this.killEnemy(enemy);
            if (b.hits >= maxHits && b.active) b.destroy();
        });
        if (this.boss?.active) {
            this.physics.add.overlap(branch, this.boss, (b) => { if (!b.active) return; this.damageBoss(dmg); });
        }

        this.scheduleProjectileDespawn(branch, 15000);
        this.maybePolycephaly(() => this.doBranchThrow());
    }

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
                this.tweens.add({ targets: enemy, alpha: 0.3, duration: 80, yoyo: true });
                if (enemy.health <= 0) { this.killEnemy(enemy); return; }
                if (!enemy.slowed) {
                    enemy.slowed = true;
                    const baseSpeed = enemy.speed;
                    enemy.speed = baseSpeed * 0.5;
                    if (enemy.active) enemy.setTint(0xc8a020);
                    this.time.delayedCall(this.dustKickSlowDuration, () => {
                        if (enemy.active) { enemy.speed = baseSpeed; enemy.clearTint(); enemy.slowed = false; }
                    });
                }
            }
        });
        if (this.boss?.active) {
            const dx = this.boss.x - px, dy = this.boss.y - py;
            if ((dx * cosA + dy * sinA) >= 0 && Math.abs(-dx * sinA + dy * cosA) <= width / 2) this.damageBoss(dmg);
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
    }

    // ─── Transmutational Scratch ─────────────────────────────────────────────────
    doTransmutationalScratch() {
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

        this.maybePolycephaly(() => this.doTransmutationalScratch());
    }

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

        // Visual: icy ring burst
        const g = this.add.graphics().setDepth(20);
        g.fillStyle(0x88ddff, 0.18);
        g.fillCircle(px, py, range);
        g.lineStyle(3, 0xaaeeff, 0.9);
        g.strokeCircle(px, py, range);
        this.tweens.add({ targets: g, alpha: 0, scaleX: 1.15, scaleY: 1.15, duration: 600,
            onComplete: () => g.destroy() });

        this.maybePolycephaly(() => this.doColdGlare());
        this.scheduleColdGlare();
    }

    scheduleColdGlare() {
        this.coldGlareTimer?.remove();
        this.coldGlareTimer = this.time.delayedCall(this.coldGlareCooldown, () => {
            if (this.coldGlareActive) this.doColdGlare();
        });
    }

    killEnemy(enemy) {
        // Hand mini-bosses: just drop a dragonfly and clean up
        if (enemy.isBossMini) {
            const idx = this.handMiniBossArray?.indexOf(enemy);
            if (idx >= 0) this.handMiniBossArray.splice(idx, 1);
            if (!this.bossSpawned) {
                const drop = this.physics.add.image(enemy.x, enemy.y, 'cricket');
                drop.setScale(0.40).setTint(0x44ccff).setDepth(3);
                drop.xpValue = 10;
                this.crickets.add(drop);
            }
            if (enemy.shootTimer)  enemy.shootTimer.remove();
            if (enemy.whipTimer)   enemy.whipTimer.remove();
            if (enemy.burrowTimer) enemy.burrowTimer.remove();
            enemy.hpBarBg?.destroy();
            enemy.hpBar?.destroy();
            enemy.hpLabel?.destroy();
            enemy.destroy();
            return;
        }
        this.kills++;
        if (this.kills >= this.nextRerollAt) {
            this.rerolls++;
            this.nextRerollAt += 300;
        }
        // Rare special item check — each capped at 2 per game
        const rand = Math.random();
        const foodboxChance  = 0.025 + (this.vitaminBonus ?? 0) + (enemy._scratchFoodbox  ?? 0);
        const treasureChance = 0.056 + (this.vitaminBonus ?? 0) + (enemy._scratchTreasure ?? 0);
        if (rand < foodboxChance) {
            // Foodbox — always drops, even during the boss fight
            const item = this.physics.add.image(enemy.x, enemy.y, 'cricket');
            item.setScale(0.55).setTint(0xff4488).setDepth(4);
            item.xpValue = 0;
            item.specialType = 'wormbox';
            this.tweens.add({ targets: item, scaleX: 0.65, scaleY: 0.65, duration: 350, yoyo: true, loop: -1 });
            this.crickets.add(item);
        } else if (this.bossSpawned) {
            // No XP insects or Treasure once the boss is on the field
        } else if (rand < treasureChance && this.treasureSpawned < 2) {
            this.treasureSpawned++;
            const item = this.physics.add.image(enemy.x, enemy.y, 'cricket');
            item.setScale(0.55).setTint(0xffd700).setDepth(4);
            item.xpValue = 0;
            item.specialType = 'treasure';
            this.tweens.add({ targets: item, scaleX: 0.65, scaleY: 0.65, duration: 250, yoyo: true, loop: -1 });
            this.crickets.add(item);
        } else {
            // Normal drop
            const dropTable = {
                lettuce_hopper:       { xpValue: 3,  tint: 0x88ff44, scale: 0.30 }, // Vitaworm
                lettuce_shooter:      { xpValue: 5,  tint: 0xffaa00, scale: 0.35 }, // Mealworm
                basil_propeller:      { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
                rocket_knife:         { xpValue: 3,  tint: 0x88ff44, scale: 0.30 }, // Vitaworm
                oregano_ghost:        { xpValue: 5,  tint: 0xffaa00, scale: 0.35 }, // Mealworm
                oregano_fan:          { xpValue: 5,  tint: 0xffaa00, scale: 0.35 }, // Mealworm
                rocket_sword:         { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
                coriander_whip:       { xpValue: 3,  tint: 0x88ff44, scale: 0.30 }, // Vitaworm
                carrot_mole:          { xpValue: 3,  tint: 0x88ff44, scale: 0.30 }, // Vitaworm
                coriander_hydra:      { xpValue: 5,  tint: 0xffaa00, scale: 0.35 }, // Mealworm
                carrot_dart:          { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
                carrot_wheel:         { xpValue: 5,  tint: 0xffaa00, scale: 0.35 }, // Mealworm
                mulberry_bat:         { xpValue: 3,  tint: 0x88ff44, scale: 0.30 }, // Vitaworm
                mulberry_snake:       { xpValue: 5,  tint: 0xffaa00, scale: 0.35 }, // Mealworm
                spinach_cyclone:      { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
                // Level 5 exclusives
                lettuce_trap:         { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
                basil_bomb:           { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
                rocket_great_sword:   { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
                oregano_phantom:      { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
                coriander_carrot:     { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
                spinach_tempest:      { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
                mulberry_monstrosity: { xpValue: 10, tint: 0x44ccff, scale: 0.40 }, // Dragonfly
            };
            const drop = dropTable[enemy.texture?.key] ?? { xpValue: 1, tint: 0xffffff, scale: 0.25 };

            const cricket = this.physics.add.image(enemy.x, enemy.y, 'cricket');
            cricket.setScale(drop.scale).setTint(drop.tint).setDepth(3);
            cricket.xpValue = drop.xpValue;
            this.crickets.add(cricket);
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
    }

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
            if (enemy.trapArmed) { enemy.setVelocity(0, 0); return; }
            this.physics.moveToObject(enemy, this.player, enemy.speed);
        });

        this.crickets.getChildren().forEach(cricket => {
            if (cricket.specialType === 'treasure' || cricket.specialType === 'wormbox') return;
            const dist = Phaser.Math.Distance.Between(px, py, cricket.x, cricket.y);
            if (dist < this.magnetRange) {
                this.physics.moveToObject(cricket, this.player, 220);
            } else {
                if (cricket.body) cricket.body.setVelocity(0, 0);
            }
        });
    }

    collectCricket(player, cricket) {
        if (cricket.specialType === 'wormbox') {
            cricket.destroy();
            this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + this.playerMaxHealth * 0.5);
            this.updateHPBar();
            return;
        }
        if (cricket.specialType === 'treasure') {
            cricket.destroy();
            this.playerLevel++;
            this.updateXPBar();
            this.showLevelUp();
            return;
        }

        this.xp += cricket.xpValue ?? 1;
        cricket.destroy();
        this.updateXPBar();

        if (this.xp >= this.xpToNext) {
            this.xp      -= this.xpToNext;
            this.xpToNext = Math.floor(this.xpToNext * 1.2);
            this.playerLevel++;
            this.updateXPBar();
            this.showLevelUp();
        }
    }

    canDamageEnemy(enemy) {
        return enemy.active && !enemy.isUnderground;
    }

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
    }

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
                if (e.body) e.body.setVelocity(Math.cos(a) * 220, Math.sin(a) * 220);
                this.damageDealt += 15; e.health -= 15;
                if (e.health <= 0) toKill.push(e);
            }
        });
        toKill.forEach(e => this.killEnemy(e));
        this._inInflateKnockback = false;
    }

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
    }

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

        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            this.updateHPBar();
            this.showDeathOverlay();
        }
    }

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
    }

    // ─── Boss ────────────────────────────────────────────────────────────────────
    spawnBoss() {
        // Stop all regular spawning immediately when the warning appears
        this.spawnTimer.remove();
        this.spawnRampTimer.remove();
        this.spawnTimer = null;
        this.spawnRampTimer = null;

        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        const bossCfg = this.level === 5
            ? { key: 'the_hand',        label: 'THE HAND',        health: 10000, damage: 30, scale: 0.8 }
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
            this.crickets.getChildren().slice().forEach(c => {
                if (c.specialType !== 'wormbox') c.destroy();
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
            }).setScrollFactor(0).setDepth(102).setOrigin(0.5, 0.5);

            // Damage + overlap
            this.physics.add.overlap(this.player, this.boss, this.bossHitPlayer, null, this);
            this.physics.add.overlap(this.boss, this.pupaGroup, (boss, mine) => { if (mine.explodeFn) mine.explodeFn(); });

            if (this.level === 5) {
                // The Hand: multi-phase boss
                this.boss.handPhase            = 1;
                this.boss.handImmobile         = false;
                this.boss.handWanderTarget     = null;
                this.boss.handPhaseTransitioned = false;
                this.boss.lastHitTime          = 0;
                this.handFireZones             = [];
                this.handMiniBossArray         = [];
                this.scheduleHandSlap();
            } else if (this.level === 4) {
                // Mulberry Mantis: chases at high speed; vanishes every 5–10s
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
    }

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
    }

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
    }

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
    }

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

        if (boss.scorpionPhase === 'chase') {
            this.physics.moveToObject(boss, this.player, 220);
        } else {
            // Wander: keep picking new waypoints until the phase timer runs out
            if (!boss.wanderTarget) {
                boss.wanderTarget = this.pickScorpionWanderTarget();
            }
            const dist = Phaser.Math.Distance.Between(boss.x, boss.y, boss.wanderTarget.x, boss.wanderTarget.y);
            if (dist < 40) {
                boss.wanderTarget = this.pickScorpionWanderTarget();
            } else {
                this.physics.moveTo(boss, boss.wanderTarget.x, boss.wanderTarget.y, 200);
            }
        }
    }

    pickScorpionWanderTarget() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist  = Phaser.Math.Between(100, 300);
        return {
            x: Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 64, 3136),
            y: Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 64, 3136),
        };
    }

    pickCycloneWanderTarget() {
        const cam = this.cameras.main;
        return {
            x: Phaser.Math.Clamp(cam.scrollX + Phaser.Math.Between(60, cam.width  - 60), 64, 3136),
            y: Phaser.Math.Clamp(cam.scrollY + Phaser.Math.Between(60, cam.height - 60), 64, 3136),
        };
    }

    updateRocketSpiderAI() {
        const boss = this.boss;
        const now  = this.time.now;
        const speed = boss.aiSpeed ?? 95;

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
    }

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
    }

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
    }

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
                    mole.body.setSize(60, 40);
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
                            mole.setAlpha(0.25); mole.body.setSize(40, 30); mole.speed = 80;
                            mole.burrowTimer = this.time.delayedCall(Phaser.Math.Between(3000, 5000), () => {
                                if (!mole.active) return;
                                mole.isUnderground = false;
                                mole.setAlpha(1); mole.body.setSize(60, 40); mole.speed = 0;
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
    }

    updateMulberryMantisAI() {
        const boss = this.boss;
        if (!boss?.active || boss.mantisVanishing || boss.mantisResting) return;
        if (boss.mantisPhase === 1 || boss.mantisChasing) {
            this.physics.moveToObject(boss, this.player, 210);
        }
    }

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
    }

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

            // Wait 3–5s then reappear next to player
            const hideDuration = Phaser.Math.Between(3000, 5000);
            this.time.delayedCall(hideDuration, () => {
                // this.boss is nulled out by killBoss; check that before reappearing
                if (!this.boss) return;
                this.mantisReappear();
            });
        }});
    }

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

        // Flash in
        this.tweens.add({ targets: boss, alpha: 1, duration: 150, onComplete: () => {
            if (!this.boss) return;
            // Wait 400ms then strike
            this.time.delayedCall(400, () => {
                if (!this.boss) return;
                this.mantisStrike();
            });
        }});
    }

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
    }

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
    }

    damageBoss(amount) {
        if (!this.boss || !this.boss.active) return;
        this.damageDealt += amount; this.boss.health -= amount;
        this.tweens.add({ targets: this.boss, alpha: 0.2, duration: 80, yoyo: true });
        this.updateBossHealthBar();
        if (this.level === 4 && this.boss.mantisPhase === 1 && this.boss.health <= this.boss.maxHealth * 0.1) {
            this.boss.mantisPhase = 2;
            this.boss.health      = this.boss.maxHealth;
            this.updateBossHealthBar();
            this.spawnMantisPhase2Ring();
        }
        if (this.level === 2 && !this.boss.phaseTriggered && this.boss.health <= this.boss.maxHealth * 0.5) {
            this.boss.phaseTriggered = true;
            this.triggerRocketSpiderPhase2();
        }
        if (this.level === 5 && this.boss && !this.boss.handPhaseTransitioned) {
            if (this.boss.handPhase < 4 && this.boss.health <= this.boss.maxHealth * 0.1) {
                this.boss.handPhaseTransitioned = true;
                this.boss.health = this.boss.maxHealth;
                this.updateBossHealthBar();
                this.triggerHandNextPhase();
                return;
            }
        }
        if (this.boss.health <= 0) this.killBoss();
    }

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
    }

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
    }

    killBoss() {
        if (this.bossChargeTimer)    this.bossChargeTimer.remove();
        if (this.bossLegSlamTimer)   this.bossLegSlamTimer.remove();
        if (this.handSlapTimer)      this.handSlapTimer.remove();
        if (this.handTeleportTimer)  this.handTeleportTimer.remove();
        if (this.handRingTimer)      this.handRingTimer.remove();
        if (this.handBossSpawnTimer) this.handBossSpawnTimer.remove();
        if (this.handRingsTimer)     this.handRingsTimer.remove();
        if (this.handVacuumTimer)    this.handVacuumTimer.remove();
        this.handFireZones?.forEach(z => { z.damageTimer?.remove(); z.graphics?.destroy(); });
        this.handFireZones = [];
        this.handMiniBossArray?.forEach(b => {
            if (!b.active) return;
            b.hpBarBg?.destroy(); b.hpBar?.destroy(); b.hpLabel?.destroy();
            b.destroy();
        });
        this.handMiniBossArray = [];
        this.bossHpBar?.destroy();
        this.bossHpBarBg?.destroy();
        this.bossHpLabel?.destroy();
        if (this.topBossHpBar)   { this.topBossHpBar.width = 0; }
        if (this.topBossLabel)   { this.topBossLabel.setText('BOSS DEFEATED'); }
        this.timerText.setVisible(true);
        this.boss.destroy();
        this.boss = null;
        this.showLevelClear();
    }

    showDeathOverlay() {
        if (this._deathOverlayShown) return;
        this._deathOverlayShown = true;

        this.isGameOver = true;
        this.pendingLevelUps = 0;
        // Destroy all XP insects on the map
        this.crickets.getChildren().slice().forEach(c => c.destroy());

        // Pause everything
        this.physics.pause();
        this.time.paused = true;

        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        const ui = [];
        const addUI = el => { ui.push(el); return el; };
        const destroyUI = () => ui.forEach(el => el.destroy());

        addUI(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75)
            .setScrollFactor(0).setDepth(500));

        addUI(this.add.text(W / 2, H / 2 - 90, 'GAME OVER', {
            fontSize: '48px', fontFamily: 'Arial Black, Arial',
            color: '#ff3333', stroke: '#000000', strokeThickness: 6,
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5));

        // REVIVE
        const reviveBtn = addUI(this.add.text(W / 2, H / 2 - 10, '[ REVIVE ]', {
            fontSize: '24px', fontFamily: 'Arial',
            color: '#00ffaa', backgroundColor: '#003322', padding: { x: 20, y: 10 },
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5).setInteractive({ useHandCursor: true }));
        reviveBtn.on('pointerover', () => reviveBtn.setColor('#ffffff'));
        reviveBtn.on('pointerout',  () => reviveBtn.setColor('#00ffaa'));
        reviveBtn.on('pointerdown', () => { destroyUI(); this.revivePlayer(); });

        // RETRY
        const retryBtn = addUI(this.add.text(W / 2, H / 2 + 60, '[ RETRY ]', {
            fontSize: '20px', fontFamily: 'Arial',
            color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 10 },
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5).setInteractive({ useHandCursor: true }));
        retryBtn.on('pointerover', () => retryBtn.setColor('#ffff00'));
        retryBtn.on('pointerout',  () => retryBtn.setColor('#ffffff'));
        retryBtn.on('pointerdown', () => this.scene.start('GameScene', { level: this.level }));

        // MAIN MENU
        const menuBtn = addUI(this.add.text(W / 2, H / 2 + 120, '[ MAIN MENU ]', {
            fontSize: '20px', fontFamily: 'Arial',
            color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 10 },
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5).setInteractive({ useHandCursor: true }));
        menuBtn.on('pointerover', () => menuBtn.setColor('#ffff00'));
        menuBtn.on('pointerout',  () => menuBtn.setColor('#ffffff'));
        menuBtn.on('pointerdown', () => this.scene.start('LevelSelectScene'));

        addUI(this.add.text(W / 2, H / 2 + 168, 'REVIVE keeps your upgrades and spawns you safely away from enemies', {
            fontSize: '11px', fontFamily: 'Arial', color: '#888888',
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5));

        // Gamepad: A = retry, Y = revive, B = menu
        this._deathPadHandler = (pad, button) => {
            const idx = button.index;
            if (idx === 0) retryBtn.emit('pointerdown');
            if (idx === 3) reviveBtn.emit('pointerdown');
            if (idx === 1) menuBtn.emit('pointerdown');
        };
        this.input.gamepad.on('down', this._deathPadHandler);
        addUI(this.add.text(W / 2, H / 2 + 185, '🎮  A  Retry    Y  Revive    B  Menu', {
            fontSize: '11px', fontFamily: 'Arial', color: '#666666',
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5));
    }

    revivePlayer() {
        this.input.gamepad.off('down', this._deathPadHandler);
        this._deathOverlayShown = false;

        // Find a spot at least 4000px from every active enemy
        const SAFE_DIST = 4000;
        const WORLD = 3200;
        const enemies = this.enemies.getChildren().filter(e => e.active);

        let bestX = WORLD / 2, bestY = WORLD / 2, bestMinDist = -1;
        const attempts = 60;
        for (let i = 0; i < attempts; i++) {
            const angle = (i / attempts) * Math.PI * 2;
            // Try rings at varying distances from world centre
            for (const radius of [1200, 800, 400]) {
                const cx = Phaser.Math.Clamp(WORLD / 2 + Math.cos(angle) * radius, 100, WORLD - 100);
                const cy = Phaser.Math.Clamp(WORLD / 2 + Math.sin(angle) * radius, 100, WORLD - 100);
                const minDist = enemies.reduce((min, e) => {
                    return Math.min(min, Phaser.Math.Distance.Between(cx, cy, e.x, e.y));
                }, Infinity);
                if (minDist >= SAFE_DIST) {
                    bestX = cx; bestY = cy;
                    bestMinDist = minDist;
                    break;
                }
                if (minDist > bestMinDist) {
                    bestMinDist = minDist;
                    bestX = cx; bestY = cy;
                }
            }
            if (bestMinDist >= SAFE_DIST) break;
        }

        // Move player to safe spot and restore health
        this.player.setPosition(bestX, bestY);
        this.player.setAlpha(1);
        this.playerHealth = this.playerMaxHealth;
        this.updateHPBar();

        // Brief invincibility flash so they don't immediately take damage
        this.player.reviveInvincible = true;
        this.tweens.add({
            targets: this.player, alpha: 0.4, duration: 150, yoyo: true, repeat: 9,
            onComplete: () => { this.player.alpha = 1; this.player.reviveInvincible = false; },
        });

        // Resume everything
        this.physics.resume();
        this.time.paused = false;
    }

    showLevelClear() {
        this.isLevelClear = true;
        // Unlock the next level
        const currentMax = parseInt(localStorage.getItem('snapper_unlocked') ?? '1');
        if (this.level >= currentMax) {
            localStorage.setItem('snapper_unlocked', String(this.level + 1));
        }

        this.physics.pause();
        this.time.paused = true;

        const W = this.cameras.main.width;
        const H = this.cameras.main.height;

        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setScrollFactor(0).setDepth(300);

        this.add.text(W / 2, H / 2 - 80, 'LEVEL CLEAR!', {
            fontSize: '52px', fontFamily: 'Arial Black, Arial',
            color: '#00ff88', stroke: '#000000', strokeThickness: 8,
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 10, `Level ${this.level} Complete`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffffff',
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 28, `Player Level: ${this.playerLevel}   •   Kills: ${this.kills}   •   Damage: ${this.damageDealt}`, {
            fontSize: '15px', fontFamily: 'Arial', color: '#ffff88',
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);

        const next = this.add.text(W / 2, H / 2 + 70, '[ CONTINUE ]', {
            fontSize: '22px', fontFamily: 'Arial', color: '#ffffff',
            backgroundColor: '#226622', padding: { x: 24, y: 12 },
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setInteractive({ useHandCursor: true });
        next.on('pointerover', () => next.setColor('#00ff88'));
        next.on('pointerout',  () => next.setColor('#ffffff'));
        next.on('pointerdown', () => this.scene.start('LevelSelectScene'));

        const menu = this.add.text(W / 2, H / 2 + 140, '[ MAIN MENU ]', {
            fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
            backgroundColor: '#333333', padding: { x: 20, y: 10 },
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setInteractive({ useHandCursor: true });
        menu.on('pointerover', () => menu.setColor('#ffffff'));
        menu.on('pointerout',  () => menu.setColor('#aaaaaa'));
        menu.on('pointerdown', () => this.scene.start('LevelSelectScene'));

        // Gamepad: d-pad/stick to toggle, A to confirm
        this.add.text(W / 2, H / 2 + 185, '🎮  A  Confirm    ↕  Navigate', {
            fontSize: '11px', fontFamily: 'Arial', color: '#666666',
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);

        let lcSelected = 0; // 0 = continue, 1 = menu
        const lcButtons = [next, menu];
        const lcColors  = ['#00ff88', '#ffffff'];
        const lcDefault = ['#ffffff', '#aaaaaa'];
        const lcHighlight = () => {
            lcButtons.forEach((b, i) => b.setColor(i === lcSelected ? lcColors[i] : lcDefault[i]));
        };
        lcHighlight();

        const lcPadHandler = (pad, button) => {
            const idx = button.index;
            if (idx === 12 || idx === 13) {
                lcSelected = lcSelected === 0 ? 1 : 0;
                lcHighlight();
            } else if (idx === 0) {
                this.scene.start('LevelSelectScene');
            }
        };
        this.input.gamepad.on('down', lcPadHandler);

        // Also handle left-stick for navigation
        this._lcNavCooldown = 0;
        this.events.on('update', (_, delta) => {
            if (!this.isLevelClear) return;
            this._lcNavCooldown -= delta;
            if (this._lcNavCooldown > 0) return;
            const pad = this.input.gamepad.getPad(0);
            if (!pad) return;
            const y = pad.leftStick.y;
            if (Math.abs(y) > 0.5) {
                lcSelected = lcSelected === 0 ? 1 : 0;
                lcHighlight();
                this._lcNavCooldown = 250;
            }
        });
    }

    // ─── Step 5: Level-up screen ─────────────────────────────────────────────────
    showLevelUp() {
        if (this.isGameOver) return;
        if (this.isLevelingUp) { this.pendingLevelUps++; return; }
        this.isLevelingUp = true;
        // Zero all enemy velocities immediately so they stop this frame,
        // before physics.pause() can take effect on the next step
        this.enemies.getChildren().forEach(e => { if (e.body) e.body.setVelocity(0, 0); });
        if (this.boss?.active && this.boss.body) this.boss.body.setVelocity(0, 0);

        this.physics.pause();
        this.time.paused = true;

        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const ui = []; // track elements so we can destroy them all at once

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setScrollFactor(0).setDepth(200);
        ui.push(overlay);

        ui.push(this.add.text(W / 2, H / 2 - 150, 'LEVEL UP!', {
            fontSize: '40px', fontFamily: 'Arial Black, Arial',
            color: '#ffff00', stroke: '#000000', strokeThickness: 6,
        }).setScrollFactor(0).setDepth(201).setOrigin(0.5));

        ui.push(this.add.text(W / 2, H / 2 - 100, 'Choose one upgrade:', {
            fontSize: '15px', fontFamily: 'Arial', color: '#cccccc',
        }).setScrollFactor(0).setDepth(201).setOrigin(0.5));

        // Weapons — only offered if not yet owned; upgrades offered if already owned
        const weaponUpgrades = [
            {
                name: 'Tail Slap', desc: 'Sweeping arc attack behind you as you move', type: 'weapon',
                available: () => !this.ownedWeapons.has('tailslap'),
                effect: () => {
                    this.ownedWeapons.add('tailslap');
                    this.tailSlapTimer = this.time.addEvent({ delay: 4000, callback: this.doTailSlap, callbackScope: this, loop: true });
                },
            },
            {
                name: 'Tail Slap', desc: 'Widen the arc behind you to 180°', type: 'weapon',
                available: () => this.ownedWeapons.has('tailslap') && !this.tailSlapUpgraded,
                effect: () => { this.tailSlapUpgraded = true; },
            },
            {
                name: 'Poop', desc: 'Fires an exploding continuous projectile in a random direction', type: 'weapon',
                available: () => !this.ownedWeapons.has('poop') && this.playerLevel >= 20,
                effect: () => {
                    this.ownedWeapons.add('poop');
                    this.poopTimer = this.time.addEvent({ delay: 8000, callback: this.doPoop, callbackScope: this, loop: true });
                },
            },
            {
                name: 'Poop', desc: 'Field lasts 6 seconds instead of 3', type: 'weapon',
                available: () => this.ownedWeapons.has('poop') && !this.poopUpgraded,
                effect: () => { this.poopUpgraded = true; this.poopDuration = 6000; },
            },
            {
                name: 'Pebble Flick', desc: 'Fires 3 piercing pebbles toward the nearest enemy', type: 'weapon',
                available: () => !this.ownedWeapons.has('pebble'),
                effect: () => {
                    this.ownedWeapons.add('pebble');
                    this.pebbleTimer = this.time.addEvent({ delay: 8000, callback: this.doPebbleFlick, callbackScope: this, loop: true });
                },
            },
            {
                name: 'Pebble Flick', desc: 'Fire 9 pebbles that pierce 3 enemies', type: 'weapon',
                available: () => this.ownedWeapons.has('pebble') && this.pebbleCount < 9,
                effect: () => { this.pebbleCount = 9; this.pebblePierce = 3; },
            },
            {
                name: 'Lick',
                desc: ['High-damage tongue at nearest enemy', '2 tongues, longer reach', '3 tongues, even longer reach'][this.lickLevel] ?? 'High-damage tongue at nearest enemy',
                type: 'weapon',
                available: () => this.lickLevel < 3,
                effect: () => {
                    this.lickLevel++;
                    if (this.lickLevel === 1) {
                        this.ownedWeapons.add('lick');
                        this.lickTimer = this.time.addEvent({ delay: 3500, callback: this.doLick, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: 'Hiss', desc: 'Slow enemies in a 45° cone for 2 seconds', type: 'weapon',
                available: () => !this.ownedWeapons.has('hiss'),
                effect: () => {
                    this.ownedWeapons.add('hiss');
                    this.hissTimer = this.time.addEvent({ delay: 5000, callback: this.doHiss, callbackScope: this, loop: true });
                },
            },
            {
                name: 'Hiss', desc: 'Widen cone to 90°', type: 'weapon',
                available: () => this.ownedWeapons.has('hiss') && !this.hissUpgraded,
                effect: () => { this.hissUpgraded = true; },
            },
            {
                name: 'Worm Whip',
                desc: ['Whip left or right, alternating each strike', 'Whip both sides at once, longer range'][this.wormWhipLevel] ?? 'Whip left or right',
                type: 'weapon',
                available: () => this.wormWhipLevel < 2,
                effect: () => {
                    this.wormWhipLevel++;
                    if (this.wormWhipLevel === 1) {
                        this.ownedWeapons.add('wormwhip');
                        this.wormWhipTimer = this.time.addEvent({ delay: 3000, callback: this.doWormWhip, callbackScope: this, loop: true });
                    } else {
                        this.wormWhipRange += 40;
                    }
                },
            },
            {
                name: 'Pupa Mines',
                desc: ['Drop 1 exploding pupa mine', 'Drop 3 pupa mines', 'Drop 5 pupa mines'][this.pupaLevel] ?? 'Drop exploding pupa mines',
                type: 'weapon',
                available: () => this.pupaLevel < 3,
                effect: () => {
                    this.pupaLevel++;
                    if (this.pupaLevel === 1) {
                        this.ownedWeapons.add('pupamines');
                        this.pupaTimer = this.time.addEvent({ delay: 6000, callback: this.doPupaMines, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: 'Skin Shed',
                desc: ['Fling a piece of shed skin that arcs downward', 'Fling 2 pieces of shed skin'][this.skinLevel] ?? 'Fling shed skin outward',
                type: 'weapon',
                available: () => this.skinLevel < 2,
                effect: () => {
                    this.skinLevel++;
                    if (this.skinLevel === 1) {
                        this.ownedWeapons.add('skinshed');
                        this.skinTimer = this.time.addEvent({ delay: 5000, callback: this.doSkinShed, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: 'Woodie Bounce',
                desc: ['Launch 1 bouncing woodlouse (2 bounces)', 'Launch 2 woodlice (3 bounces)', 'Launch 3 woodlice (5 bounces each)'][this.woodieLevel] ?? 'Launch a bouncing woodlouse',
                type: 'weapon',
                available: () => this.woodieLevel < 3,
                effect: () => {
                    this.woodieLevel++;
                    if (this.woodieLevel === 1) {
                        this.ownedWeapons.add('woodiebounce');
                        this.woodieTimer = this.time.addEvent({ delay: 8000, callback: this.doWoodieBounce, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: 'Dubia Shields',
                desc: [
                    'Two roach shields orbit you, damaging anything they touch',
                    'Three shields orbit faster',
                    'Four shields orbit even faster',
                    'Two layers of shields orbit in opposite directions',
                ][this.dubiaLevel] ?? 'Dubia Shields',
                type: 'weapon',
                available: () => this.dubiaLevel < 4 && (this.dubiaLevel === 0 || Math.random() < 0.4),
                effect: () => {
                    this.dubiaLevel++;
                    if (this.dubiaLevel === 1) {
                        this.ownedWeapons.add('dubiashields');
                        this.createDubiaShield();
                        this.createDubiaShield();
                    } else if (this.dubiaLevel === 4) {
                        this.dubiaShields.forEach(s => s.destroy());
                        this.dubiaShields = [];
                        this.dubiaOuterAngle = 0;
                        for (let i = 0; i < 4; i++) this.createDubiaShield('inner');
                        for (let i = 0; i < 5; i++) this.createDubiaShield('outer');
                    } else {
                        this.createDubiaShield();
                    }
                },
            },
            {
                name: 'Poison Claw',
                desc: [
                    'Lunge a venomous claw at nearest enemy (80px) — poisons for 3s',
                    'Longer reach (110px) — poisons for 5s',
                    'Even longer reach (140px) — poisons for 6s',
                    'Max reach (170px) — poisons for 7s',
                ][this.poisonClawLevel] ?? 'Poison Claw',
                type: 'weapon',
                available: () => this.poisonClawLevel < 4,
                effect: () => {
                    this.poisonClawLevel++;
                    if (this.poisonClawLevel === 1) {
                        this.ownedWeapons.add('poisonclaw');
                        this.poisonClawTimer = this.time.addEvent({ delay: 4000, callback: this.doPoisonClaw, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: 'Branch Throw',
                desc: ['Hurl a wide branch at the nearest enemy (breaks after 15 hits)', 'Wider branch', 'Even wider branch', 'Breaks after 30 hits instead'][this.branchLevel] ?? 'Branch Throw',
                type: 'weapon',
                available: () => this.branchLevel < 4,
                effect: () => {
                    this.branchLevel++;
                    if (this.branchLevel === 1) {
                        this.ownedWeapons.add('branchthrow');
                        this.branchTimer = this.time.addEvent({ delay: 6000, callback: this.doBranchThrow, callbackScope: this, loop: true });
                    } else if (this.branchLevel === 2) { this.branchWidth = 30; }
                    else if (this.branchLevel === 3)   { this.branchWidth = 40; }
                    else if (this.branchLevel === 4)   { this.branchMaxHits = 30; }
                },
            },
            {
                name: 'Dust Kick',
                desc: ['Fire a short beam of dust — deals low damage and slows enemies 2s', 'Stronger kick', 'Stronger kick', 'Stronger kick', 'Much longer beam, slows for 10s'][this.dustKickLevel] ?? 'Dust Kick',
                type: 'weapon',
                available: () => this.dustKickLevel < 5,
                effect: () => {
                    this.dustKickLevel++;
                    if (this.dustKickLevel === 1) {
                        this.ownedWeapons.add('dustkick');
                        this.dustKickTimer = this.time.addEvent({ delay: 15000, callback: this.doDustKick, callbackScope: this, loop: true });
                    } else if (this.dustKickLevel === 5) {
                        this.dustKickLength = 400;
                        this.dustKickSlowDuration = 10000;
                    }
                },
            },
            {
                name: 'Transmutational Scratch',
                desc: ['Scratch mark near you — damaged enemies have a higher Foodbox drop chance', 'Damaged enemies also have a higher Treasure drop chance', 'Bigger scratch, larger area'][this.scratchLevel] ?? 'Transmutational Scratch',
                type: 'weapon',
                available: () => this.scratchLevel < 3,
                effect: () => {
                    this.scratchLevel++;
                    if (this.scratchLevel === 1) {
                        this.ownedWeapons.add('scratch');
                        this.scratchTimer = this.time.addEvent({ delay: 12000, callback: this.doTransmutationalScratch, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: 'Cold Glare',
                desc: (() => {
                    if (!this.coldGlareActive)
                        return 'Freeze nearby enemies for 1s every 30s';
                    const cd   = this.coldGlareCooldown / 1000;
                    const slow = this.coldGlareSlow / 1000;
                    if (this.coldGlareCdLevel < 3) {
                        const nextCd = (this.coldGlareCooldown - 5000) / 1000;
                        return `Cooldown ${cd}s → ${nextCd}s  •  slow ${slow}s`;
                    }
                    const nextSlows = [4, 7, 10];
                    const nextSlow  = nextSlows[this.coldGlareSlLevel];
                    return `Slow ${slow}s → ${nextSlow}s  •  cooldown ${cd}s`;
                })(),
                type: 'weapon',
                available: () => !this.coldGlareActive || this.coldGlareCdLevel < 3 || this.coldGlareSlLevel < 3,
                effect: () => {
                    if (!this.coldGlareActive) {
                        this.coldGlareActive = true;
                        this.ownedWeapons.add('coldglare');
                        this.scheduleColdGlare();
                    } else if (this.coldGlareCdLevel < 3) {
                        this.coldGlareCdLevel++;
                        this.coldGlareCooldown -= 5000;
                    } else {
                        this.coldGlareSlLevel++;
                        this.coldGlareSlow = [4000, 7000, 10000][this.coldGlareSlLevel - 1] ?? 10000;
                    }
                },
            },
        ];

        // Passives — always available
        const passiveUpgrades = [
            { name: 'Inflate',      desc: 'Taking damage knocks back and hurts nearby enemies', effect: () => { this.ownedPassives.push('Inflate');      this.inflateActive = true; } },
            { name: 'Shiny Scales', desc: '60% chance to deflect enemy projectiles back at them', available: () => this.deflectChance === 0, effect: () => { this.ownedPassives.push('Shiny Scales'); this.deflectChance = 0.60; } },
            { name: 'Angry',           desc: 'Snapper moves faster',                effect: () => { this.ownedPassives.push('Angry');           this.playerSpeed += 30; } },
            { name: 'Aura Farming',    desc: 'Snapper\'s attacks do more damage',   effect: () => { this.ownedPassives.push('Aura Farming');    this.biteDamage += 10; this.tailSlapDamage += 10; this.poopDamage += 10; this.pebbleDamage += 10; this.lickDamage += 10; this.wormWhipDamage += 10; this.pupaDamage += 10; this.skinDamage += 10; this.woodieDamage += 10; this.dubiaShieldDamage += 10; } },
            { name: 'Hunter Instinct', desc: 'Snapper\'s attacks reach further',    effect: () => { this.ownedPassives.push('Hunter Instinct'); this.biteRange += 25; this.tailSlapRange += 25; this.hissRange += 25; this.lickRangeBonus += 25; this.wormWhipRange += 25; this.pupaRadius += 15; this.dustKickLength += 40; } },
            { name: 'Basking',         desc: 'Snapper\'s attacks fire faster',      effect: () => {
                this.ownedPassives.push('Basking');
                this.biteRate = Math.max(300, this.biteRate - 150);
                this.biteTimer.reset({ delay: this.biteRate, callback: this.doBite, callbackScope: this, loop: true });
                if (this.tailSlapTimer) this.tailSlapTimer.reset({ delay: Math.max(300, this.tailSlapTimer.delay - 150), callback: this.doTailSlap, callbackScope: this, loop: true });
                if (this.poopTimer)     this.poopTimer.reset({     delay: Math.max(300, this.poopTimer.delay     - 150), callback: this.doPoop,     callbackScope: this, loop: true });
                if (this.pebbleTimer)   this.pebbleTimer.reset({   delay: Math.max(300, this.pebbleTimer.delay   - 150), callback: this.doPebbleFlick, callbackScope: this, loop: true });
                if (this.hissTimer)     this.hissTimer.reset({     delay: Math.max(300, this.hissTimer.delay     - 150), callback: this.doHiss,        callbackScope: this, loop: true });
                if (this.lickTimer)       this.lickTimer.reset({     delay: Math.max(300, this.lickTimer.delay     - 150), callback: this.doLick,          callbackScope: this, loop: true });
                if (this.wormWhipTimer)   this.wormWhipTimer.reset({ delay: Math.max(300, this.wormWhipTimer.delay - 150), callback: this.doWormWhip,       callbackScope: this, loop: true });
                if (this.pupaTimer)       this.pupaTimer.reset({     delay: Math.max(300, this.pupaTimer.delay     - 150), callback: this.doPupaMines,      callbackScope: this, loop: true });
                if (this.skinTimer)         this.skinTimer.reset({         delay: Math.max(300, this.skinTimer.delay         - 150), callback: this.doSkinShed,               callbackScope: this, loop: true });
                if (this.woodieTimer)       this.woodieTimer.reset({       delay: Math.max(300, this.woodieTimer.delay       - 150), callback: this.doWoodieBounce,           callbackScope: this, loop: true });
                if (this.poisonClawTimer)   this.poisonClawTimer.reset({   delay: Math.max(300, this.poisonClawTimer.delay   - 150), callback: this.doPoisonClaw,             callbackScope: this, loop: true });
                if (this.branchTimer)       this.branchTimer.reset({       delay: Math.max(300, this.branchTimer.delay       - 150), callback: this.doBranchThrow,            callbackScope: this, loop: true });
                if (this.dustKickTimer)     this.dustKickTimer.reset({     delay: Math.max(300, this.dustKickTimer.delay     - 150), callback: this.doDustKick,               callbackScope: this, loop: true });
                if (this.scratchTimer)      this.scratchTimer.reset({      delay: Math.max(300, this.scratchTimer.delay      - 150), callback: this.doTransmutationalScratch, callbackScope: this, loop: true });
                if (this.coldGlareActive) { this.coldGlareCooldown = Math.max(5000, this.coldGlareCooldown - 1500); this.scheduleColdGlare(); }
            } },
            { name: 'Bug Bucket',      desc: 'Snapper\'s max health increases by 25',  effect: () => { this.ownedPassives.push('Bug Bucket');      this.playerMaxHealth += 25; this.playerHealth = Math.min(this.playerHealth + 25, this.playerMaxHealth); this.updateHPBar(); } },
            { name: 'Well Fed',        desc: (() => { const d = Math.round(this.regenDelay * 0.8 / 100) / 10; return `Speed up regen to 1 HP every ${d}s`; })(), effect: () => { this.ownedPassives.push('Well Fed'); this.startRegen(); } },
            { name: 'Hungry Forager',  desc: 'Insects attract to Snapper from further', effect: () => { this.ownedPassives.push('Hungry Forager'); this.magnetRange += 80; } },
            { name: 'Hard Scales',     desc: 'Enemies deal less damage to Snapper',    effect: () => { this.ownedPassives.push('Hard Scales');    this.enemies.getChildren().forEach(e => { e.damage = Math.max(1, e.damage - 2); }); } },
            {
                name: 'Polycephaly',
                desc: `${Math.round((this.polycephalyChance + 0.10) * 100)}% chance for each attack to fire twice`,
                effect: () => { this.ownedPassives.push('Polycephaly'); this.polycephalyChance += 0.10; },
            },
            {
                name: 'Venom',
                desc: (() => {
                    const first = this.venomChance === 0;
                    const nextChance = first ? 15 : Math.round((this.venomChance + 0.10) * 100);
                    const nextDur   = first ? '2.0' : ((this.venomDuration + 500) / 1000).toFixed(1);
                    return `${nextChance}% chance to poison enemies for ${nextDur}s`;
                })(),
                effect: () => {
                    const first = this.venomChance === 0;
                    this.ownedPassives.push('Venom');
                    this.venomChance += first ? 0.15 : 0.10;
                    if (!first) this.venomDuration += 500;
                },
            },
            { name: 'Vitamin Supplements', desc: 'Higher chance of Foodbox and Treasure drops', effect: () => { this.ownedPassives.push('Vitamin Supplements'); this.vitaminBonus += 0.02; } },
        ];

        // Build the pool: all available weapons first, then passives
        const availableWeapons  = weaponUpgrades.filter(w => w.available());
        const allUpgrades = [...availableWeapons, ...passiveUpgrades];

        // Loadout panel — shown below the cards
        const { weaponLine, boostLine } = this.buildLoadoutText();
        ui.push(this.add.text(W / 2, H / 2 + 110, weaponLine, {
            fontSize: '11px', fontFamily: 'Arial', color: '#aaffaa',
            align: 'center', wordWrap: { width: W - 80 },
        }).setScrollFactor(0).setDepth(201).setOrigin(0.5, 0));
        ui.push(this.add.text(W / 2, H / 2 + 135, boostLine, {
            fontSize: '11px', fontFamily: 'Arial', color: '#aaaaff',
            align: 'center', wordWrap: { width: W - 80 },
        }).setScrollFactor(0).setDepth(201).setOrigin(0.5, 0));

        const cardW  = 190;
        const cardH  = 130;
        const gap    = 20;
        const startX = W / 2 - (cardW * 1.5 + gap);

        // Reroll button (above cards, top-right area)
        let rerollCooldown = false;
        const rerollBtn = this.add.text(W / 2, H / 2 - 73, `🎲 Reroll  (${this.rerolls})`, {
            fontSize: '13px', fontFamily: 'Arial', color: this.rerolls > 0 ? '#ffdd55' : '#666666',
            backgroundColor: '#222222', padding: { x: 12, y: 6 },
        }).setScrollFactor(0).setDepth(202).setOrigin(0.5);
        if (this.rerolls > 0) rerollBtn.setInteractive({ useHandCursor: true });
        ui.push(rerollBtn);

        // Card elements that get replaced on reroll (separate from persistent ui[])
        let cardEls = [];
        let rKeyHandler = null;
        let padHandler = null;
        let currentChoices = [];
        let selectedCard = 0;

        const pickCard = (upgrade) => {
            upgrade.effect();
            rKeyHandler && this.input.keyboard.off('keydown-R', rKeyHandler);
            padHandler  && this.input.gamepad.off('down', padHandler);
            cardEls.forEach(el => el.destroy());
            ui.forEach(el => el.destroy());
            // Unpause time so the 3-2-1 countdown delayedCalls can fire;
            // physics stays paused until resume() is called below
            this.time.paused = false;

            const countLabel = this.add.text(W / 2, H / 2, '3', {
                fontSize: '72px', fontFamily: 'Arial Black, Arial',
                color: '#ffffff', stroke: '#000000', strokeThickness: 8,
            }).setScrollFactor(0).setDepth(210).setOrigin(0.5);

            this.isCountdown = true;

            const resume = () => {
                countLabel.destroy();
                this.physics.resume();
                this.time.paused = false;
                this.isLevelingUp = false;
                this.isCountdown  = false;
                if (this.pendingLevelUps > 0) {
                    this.pendingLevelUps--;
                    this.time.delayedCall(this.fastUpgrade ? 0 : 200, () => this.showLevelUp());
                } else {
                    this.fastUpgrade = false;
                }
            };

            if (!this.fastUpgrade) {
                this.time.delayedCall(500,  () => { if (countLabel.active) countLabel.setText('2'); });
                this.time.delayedCall(1000, () => { if (countLabel.active) countLabel.setText('1'); });
            }
            this.time.delayedCall(this.fastUpgrade ? 0 : 1500, resume);
        };

        const applyCardHighlight = () => {
            // cardEls layout: for each card i → indices i*3=card rect, i*3+1=title, i*3+2=desc
            currentChoices.forEach((upgrade, i) => {
                const card = cardEls[i * 3];
                if (!card) return;
                const isWeapon   = upgrade.type === 'weapon';
                const cardColor  = isWeapon ? 0x2a1a00 : 0x1a1a44;
                const hoverColor = isWeapon ? 0x7a4400 : 0x3333aa;
                card.setFillStyle(i === selectedCard ? hoverColor : cardColor);
                card.setStrokeStyle(i === selectedCard ? 3 : 0, 0xffffff);
            });
        };

        const drawCards = () => {
            cardEls.forEach(el => el.destroy());
            cardEls = [];
            selectedCard = 0;

            currentChoices = Phaser.Utils.Array.Shuffle([...allUpgrades]).slice(0, 3);

            currentChoices.forEach((upgrade, i) => {
                const cx = startX + i * (cardW + gap) + cardW / 2;
                const cy = H / 2 + 30;

                const isWeapon  = upgrade.type === 'weapon';
                const cardColor = isWeapon ? 0x2a1a00 : 0x1a1a44;
                const hoverColor= isWeapon ? 0x7a4400 : 0x3333aa;
                const titleColor= isWeapon ? '#ffaa00' : '#ffff00';

                const card = this.add.rectangle(cx, cy, cardW, cardH, cardColor)
                    .setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });

                const title = this.add.text(cx, cy - 32, upgrade.name, {
                    fontSize: '15px', fontFamily: 'Arial Black, Arial',
                    color: titleColor, align: 'center', wordWrap: { width: cardW - 20 },
                }).setScrollFactor(0).setDepth(202).setOrigin(0.5);

                const desc = this.add.text(cx, cy + 10, upgrade.desc, {
                    fontSize: '12px', fontFamily: 'Arial', color: '#cccccc',
                    align: 'center', wordWrap: { width: cardW - 20 },
                }).setScrollFactor(0).setDepth(202).setOrigin(0.5);

                cardEls.push(card, title, desc);

                card.on('pointerover', () => { selectedCard = i; applyCardHighlight(); });
                card.on('pointerout',  () => card.setFillStyle(cardColor));
                card.on('pointerdown', () => pickCard(upgrade));
            });

            applyCardHighlight();
        }; // end drawCards

        const doReroll = () => {
            if (this.rerolls <= 0 || rerollCooldown) return;
            this.rerolls--;
            rerollCooldown = true;
            rerollBtn.setText(`🎲 Reroll  (${this.rerolls})`);
            if (this.rerolls === 0) {
                rerollBtn.setColor('#666666');
                rerollBtn.disableInteractive();
            }
            drawCards();
            this.time.delayedCall(1000, () => { rerollCooldown = false; });
        };

        rerollBtn.on('pointerdown', doReroll);
        rKeyHandler = this.input.keyboard.on('keydown-R', doReroll);

        // Gamepad handler for level-up screen: LB(4)/RB(5) navigate, A(0) pick, Y(3) reroll
        padHandler = (pad, button) => {
            const idx = button.index;
            if (idx === 4 || idx === 14) { // LB or d-pad left
                selectedCard = (selectedCard + 2) % 3;
                applyCardHighlight();
            } else if (idx === 5 || idx === 15) { // RB or d-pad right
                selectedCard = (selectedCard + 1) % 3;
                applyCardHighlight();
            } else if (idx === 0) { // A = pick
                if (currentChoices[selectedCard]) pickCard(currentChoices[selectedCard]);
            } else if (idx === 3) { // Y = reroll
                doReroll();
            }
        };
        this.input.gamepad.on('down', padHandler);

        // Gamepad hint below reroll button
        ui.push(this.add.text(W / 2, H / 2 - 55, '🎮  LB / RB  Navigate    A  Pick    Y  Reroll', {
            fontSize: '11px', fontFamily: 'Arial', color: '#888888',
        }).setScrollFactor(0).setDepth(202).setOrigin(0.5));

        drawCards();
    }

    buildLoadoutText() {
        const weapons = [];
        const lv = (n) => n > 1 ? ` ×${n}` : '';
        if (this.ownedWeapons.has('bite'))         weapons.push('Bite');
        if (this.ownedWeapons.has('tailslap'))     weapons.push('Tail Slap'      + lv(1 + (this.tailSlapUpgraded ? 1 : 0)));
        if (this.ownedWeapons.has('poop'))         weapons.push('Poop'           + lv(1 + (this.poopUpgraded     ? 1 : 0)));
        if (this.ownedWeapons.has('pebble'))       weapons.push('Pebble Flick'   + lv(1 + (this.pebbleCount > 3  ? 1 : 0)));
        if (this.ownedWeapons.has('hiss'))         weapons.push('Hiss'           + lv(1 + (this.hissUpgraded     ? 1 : 0)));
        if (this.ownedWeapons.has('lick'))         weapons.push('Lick'           + lv(this.lickLevel));
        if (this.ownedWeapons.has('wormwhip'))     weapons.push('Worm Whip'      + lv(this.wormWhipLevel));
        if (this.ownedWeapons.has('pupamines'))    weapons.push('Pupa Mines'     + lv(this.pupaLevel));
        if (this.ownedWeapons.has('skinshed'))     weapons.push('Skin Shed'      + lv(this.skinLevel));
        if (this.ownedWeapons.has('woodiebounce')) weapons.push('Woodie Bounce'  + lv(this.woodieLevel));
        if (this.ownedWeapons.has('dubiashields')) weapons.push('Dubia Shields'  + lv(this.dubiaLevel));
        if (this.ownedWeapons.has('poisonclaw'))   weapons.push('Poison Claw'    + lv(this.poisonClawLevel));
        if (this.ownedWeapons.has('branchthrow'))  weapons.push('Branch Throw'   + lv(this.branchLevel));
        if (this.ownedWeapons.has('dustkick'))     weapons.push('Dust Kick'      + lv(this.dustKickLevel));
        if (this.ownedWeapons.has('scratch'))      weapons.push('Trans. Scratch'  + lv(this.scratchLevel));
        if (this.coldGlareActive)                  weapons.push('Cold Glare'     + lv(1 + this.coldGlareCdLevel + this.coldGlareSlLevel));

        const counts = {};
        this.ownedPassives.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
        const boosts = Object.entries(counts).map(([name, n]) => n > 1 ? name + ' \xd7' + n : name);

        return {
            weaponLine: '⚔  ' + (weapons.length ? weapons.join('  •  ') : 'none yet'),
            boostLine:  '★  ' + (boosts.length  ? boosts.join('  •  ')  : 'none yet'),
        };
    }

    playerDamageFlash() {
        if (!this.player?.active) return;
        this.tweens.killTweensOf(this.player);
        this.player.setAlpha(1);
        this.tweens.add({ targets: this.player, alpha: 0.3, duration: 100, yoyo: true });
    }

    scheduleProjectileDespawn(proj, delay) {
        this.time.delayedCall(delay, () => {
            if (!proj.active) return;
            if (this.isCountdown) this.scheduleProjectileDespawn(proj, 500);
            else proj.destroy();
        });
    }

    doRegen() {
        if (this.isCountdown) return;
        if (this.playerHealth < this.playerMaxHealth) {
            this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 1);
            this.updateHPBar();
        }
    }

    startRegen() {
        this.regenDelay = Math.max(500, Math.round(this.regenDelay * 0.8));
        this.regenTimer.remove();
        this.regenTimer = this.time.addEvent({ delay: this.regenDelay, callback: this.doRegen, callbackScope: this, loop: true });
    }

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
            }
        });

        if (boss.handImmobile) return;

        if (!boss.handWanderTarget) boss.handWanderTarget = this.pickHandWanderTarget();
        const dist = Phaser.Math.Distance.Between(boss.x, boss.y, boss.handWanderTarget.x, boss.handWanderTarget.y);
        if (dist < 40) {
            boss.handWanderTarget = this.pickHandWanderTarget();
        } else {
            this.physics.moveTo(boss, boss.handWanderTarget.x, boss.handWanderTarget.y, 200);
        }

        // Chase mini-bosses toward player
        this.handMiniBossArray?.forEach(mb => {
            if (!mb.active) return;
            this.physics.moveToObject(mb, this.player, mb.speed ?? 90);
        });
    }

    pickHandWanderTarget() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist  = Phaser.Math.Between(100, 300);
        return {
            x: Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 64, 3136),
            y: Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 64, 3136),
        };
    }

    scheduleHandSlap() {
        if (!this.boss?.active) return;
        this.handSlapTimer = this.time.delayedCall(Phaser.Math.Between(1000, 20000), () => {
            this.doHandSlap();
        });
    }

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
    }

    triggerHandNextPhase() {
        const boss = this.boss;
        if (!boss) return;
        boss.handPhase++;
        this.tweens.add({ targets: boss, alpha: 0.1, duration: 200, yoyo: true, repeat: 2 });

        const phase = boss.handPhase;
        if (phase === 2) this.triggerHandPhase2();
        if (phase === 3) this.triggerHandPhase3();
        if (phase === 4) this.triggerHandPhase4();

        // Reset transition flag after short delay so next phase can trigger
        this.time.delayedCall(600, () => {
            if (boss.active) boss.handPhaseTransitioned = false;
        });
    }

    triggerHandPhase2() {
        this.scheduleHandTeleport();
    }

    triggerHandPhase3() {
        // First teleport immediately with the salad bowl
        this.doHandTeleport(true);
        this.scheduleHandPhase3Ring();
    }

    triggerHandPhase4() {
        this.scheduleHandBossRespawn();
        this.scheduleHandPhase4Rings();
        this.scheduleHandVacuum();
    }

    scheduleHandTeleport() {
        if (!this.boss?.active) return;
        this.handTeleportTimer = this.time.delayedCall(Phaser.Math.Between(5000, 25000), () => {
            this.doHandTeleport();
        });
    }

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
    }

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
            boss.body.setVelocity(Math.cos(chargeAngle) * 420, Math.sin(chargeAngle) * 420);
            this.time.delayedCall(450, () => {
                if (!boss.active) return;
                boss.body.setVelocity(0, 0);
                boss.handImmobile = false;
            });
        });
    }

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
    }

    spawnHandFireZone(x, y, radius) {
        const g = this.add.graphics().setDepth(12);
        g.fillStyle(0xff5500, 0.55);
        g.fillCircle(x, y, radius);

        const zone = { x, y, radius, graphics: g, lastDamageTick: 0 };
        this.handFireZones.push(zone);

        // Initial hit on spawn
        const d = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
        if (d <= radius && !this.player.reviveInvincible) {
            this.playerHealth -= 15;
            this.updateHPBar();
            this.playerDamageFlash();
            if (this.inflateActive) this.inflateKnockback();
            if (this.playerHealth <= 0) { this.playerHealth = 0; this.showDeathOverlay(); }
        }

        // Fade and destroy after 6s
        this.tweens.add({ targets: g, alpha: 0.2, delay: 4000, duration: 2000, onComplete: () => {
            g.destroy();
            const idx = this.handFireZones.indexOf(zone);
            if (idx >= 0) this.handFireZones.splice(idx, 1);
        }});
    }

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
                this.playerHealth -= 10;
                this.updateHPBar();
                this.playerDamageFlash();
                if (this.playerHealth <= 0) { this.playerHealth = 0; this.showDeathOverlay(); }
            }
        });
    }

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
    }

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
    }

    spawnHandMiniBoss(cfg) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist  = Phaser.Math.Between(300, 500);
        const sx    = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 64, 3136);
        const sy    = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 64, 3136);

        const mb = this.physics.add.sprite(sx, sy, cfg.key);
        mb.setScale(cfg.scale).setDepth(8);
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
    }

    scheduleHandPhase3Ring() {
        if (!this.boss?.active) return;
        this.handRingTimer = this.time.delayedCall(Phaser.Math.Between(15000, 45000), () => {
            this.doHandRingAttack();
        });
    }

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
    }

    scheduleHandPhase4Rings() {
        if (!this.boss?.active) return;
        this.handRingsTimer = this.time.delayedCall(Phaser.Math.Between(10000, 40000), () => {
            this.doHandPhase4Rings();
        });
    }

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
    }

    scheduleHandVacuum() {
        if (!this.boss?.active) return;
        this.handVacuumTimer = this.time.delayedCall(Phaser.Math.Between(20000, 55000), () => {
            this.doHandVacuum();
        });
    }

    doHandVacuum() {
        const boss = this.boss;
        if (!boss?.active) return;

        boss.handImmobile = true;
        if (boss.body) boss.body.setVelocity(0, 0);

        // Flash warning
        this.tweens.add({ targets: boss, alpha: 0.1, duration: 150, yoyo: true, repeat: 3 });

        // Suck all enemies and mini-bosses toward the boss
        const targets = [
            ...this.enemies.getChildren().filter(e => e.active && !e.isBossMini),
            ...(this.handMiniBossArray?.filter(b => b.active) ?? []),
        ];
        targets.forEach(e => {
            if (e.body) this.physics.moveTo(e, boss.x, boss.y, 600);
        });

        // After 4500ms: kill them all, then explode
        this.time.delayedCall(4500, () => {
            if (!boss.active) return;

            // Kill every sucked target
            const toKill = [
                ...this.enemies.getChildren().slice().filter(e => e.active && !e.isBossMini),
                ...(this.handMiniBossArray?.slice().filter(b => b.active) ?? []),
            ];
            toKill.forEach(e => this.killEnemy(e));

            // Screenshake
            this.cameras.main.shake(600, 0.04);

            // Explosion visual — circle grows from 0 → 1500px in 400ms
            const g = this.add.graphics().setDepth(26);
            g.fillStyle(0xffffff, 0.9);
            g.fillCircle(0, 0, 1500);
            g.setPosition(boss.x, boss.y);
            g.setScale(0);

            let playerHit = false;
            this.tweens.add({
                targets: g, scaleX: 1, scaleY: 1, duration: 400, ease: 'Quad.Out',
                onUpdate: () => {
                    if (playerHit || this.player.reviveInvincible) return;
                    const currentR = 1500 * g.scaleX;
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
    }

    scheduleHandBossRespawn() {
        if (!this.boss?.active) return;
        this.handBossSpawnTimer = this.time.delayedCall(Phaser.Math.Between(30000, 45000), () => {
            this.checkHandPhase4BossSpawn();
        });
    }

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
}
