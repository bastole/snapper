export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create(data) {
        this.level = data?.level ?? 1;

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

        // --- Groups ---
        this.enemies = this.physics.add.group();
        this.crickets = this.physics.add.group();

        // --- Player stats ---
        this.playerSpeed    = 160;
        this.playerHealth   = 100;
        this.playerMaxHealth = 100;
        this.xp             = 0;
        this.xpToNext       = 10;
        this.playerLevel    = 1;
        this.magnetRange    = 32;
        this.isLevelingUp   = false;
        this.gameTime       = 600;

        // --- Bite weapon stats ---
        this.biteDamage = 20;
        this.biteRange  = 80;
        this.biteRate   = 3000;

        // --- Other weapon stats (initialised when unlocked) ---
        this.tailSlapDamage   = 25;
        this.tailSlapRange    = 100;
        this.tailSlapUpgraded = false;
        this.poopDamage       = 30;
        this.pebbleDamage     = 15;
        this.pebbleCount      = 3;
        this.pebblePierce     = 1;

        // Track which weapons the player owns
        this.ownedWeapons = new Set(['bite']);

        // --- Collisions ---
        this.physics.add.overlap(this.player, this.crickets, this.collectCricket, null, this);
        this.physics.add.overlap(this.player, this.enemies,  this.enemyHitPlayer, null, this);

        // --- Timers ---
        this.spawnTimer    = this.time.addEvent({ delay: 1500, callback: this.spawnEnemy,  callbackScope: this, loop: true });
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
        this.add.rectangle(W / 2, 12, W - 40, 16, 0x333333).setScrollFactor(0).setDepth(100);
        this.xpBar = this.add.rectangle(20, 12, 0, 14, 0x00ff88).setScrollFactor(0).setDepth(101).setOrigin(0, 0.5);

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
    }

    // ─── Step 1: Player movement ─────────────────────────────────────────────────
    handleMovement() {
        const speed = this.playerSpeed;
        let vx = 0, vy = 0;

        if (this.cursors.left.isDown  || this.wasd.left.isDown)  vx = -speed;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  speed;
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    vy = -speed;
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  vy =  speed;

        // Normalise diagonal so you don't move faster at 45°
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

        this.player.setVelocity(vx, vy);
        if (vx < 0) this.player.setFlipX(true);
        else if (vx > 0) this.player.setFlipX(false);
    }

    // ─── Step 2: Enemy spawning ───────────────────────────────────────────────────
    spawnEnemy() {
        const cam    = this.cameras.main;
        const margin = 80;
        let x, y;

        const side = Phaser.Math.Between(0, 3);
        if      (side === 0) { x = Phaser.Math.Between(cam.scrollX, cam.scrollX + cam.width); y = cam.scrollY - margin; }
        else if (side === 1) { x = Phaser.Math.Between(cam.scrollX, cam.scrollX + cam.width); y = cam.scrollY + cam.height + margin; }
        else if (side === 2) { x = cam.scrollX - margin; y = Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height); }
        else                 { x = cam.scrollX + cam.width + margin; y = Phaser.Math.Between(cam.scrollY, cam.scrollY + cam.height); }

        x = Phaser.Math.Clamp(x, 64, 3136);
        y = Phaser.Math.Clamp(y, 64, 3136);

        const types = ['iceberg_lettuce', 'basil'];
        const type  = Phaser.Utils.Array.GetRandom(types);

        const enemy = this.physics.add.sprite(x, y, type);
        enemy.setScale(0.25);
        enemy.setDepth(5);
        enemy.health        = 40;
        enemy.maxHealth     = 40;
        enemy.damage        = 5;
        enemy.speed         = 60;
        enemy.lastHitTime   = 0;

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
        const px = this.player.x;
        const py = this.player.y;

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
            if (dist <= this.biteRange) {
                enemy.health -= this.biteDamage;
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                if (enemy.health <= 0) this.killEnemy(enemy);
            }
        });

        // Always show bite circle so player can see the attack range
        const circle = this.add.circle(px, py, this.biteRange, 0xffffff, 0.12).setDepth(20);
        this.tweens.add({ targets: circle, alpha: 0, duration: 200, onComplete: () => circle.destroy() });
    }

    doTailSlap() {
        const angle = this.player.flipX ? Math.PI : 0;
        const arc   = this.tailSlapUpgraded ? Math.PI : (Math.PI / 3);

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist > this.tailSlapRange) return;
            const toEnemy = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
            let diff = Phaser.Math.Angle.Wrap(toEnemy - angle);
            if (Math.abs(diff) <= arc / 2) {
                enemy.health -= this.tailSlapDamage;
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                if (enemy.health <= 0) this.killEnemy(enemy);
            }
        });

        // Arc visual
        const g = this.add.graphics().setDepth(20);
        g.lineStyle(2, 0xff8800, 0.6);
        g.beginPath();
        g.arc(this.player.x, this.player.y, this.tailSlapRange, angle - arc / 2, angle + arc / 2);
        g.strokePath();
        this.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
    }

    doPoop() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = 220;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const poop = this.physics.add.image(this.player.x, this.player.y, 'cricket'); // reuse placeholder
        poop.setTint(0x885500);
        poop.setScale(0.3);
        poop.setDepth(8);
        poop.setVelocity(vx, vy);
        poop.damage = this.poopDamage;

        this.physics.add.overlap(poop, this.enemies, (p, enemy) => {
            enemy.health -= p.damage;
            this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
            if (enemy.health <= 0) this.killEnemy(enemy);
            p.destroy();
        });

        this.time.delayedCall(2000, () => { if (poop.active) poop.destroy(); });
    }

    doPebbleFlick() {
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
                enemy.health -= p.damage;
                this.tweens.add({ targets: enemy, alpha: 0.2, duration: 80, yoyo: true });
                if (enemy.health <= 0) this.killEnemy(enemy);
                p.hits++;
                if (p.hits >= this.pebblePierce) p.destroy();
            });

            this.time.delayedCall(1800, () => { if (pebble.active) pebble.destroy(); });
        }
    }

    killEnemy(enemy) {
        const cricket = this.physics.add.image(enemy.x, enemy.y, 'cricket');
        cricket.setScale(0.25);
        cricket.setDepth(3);
        cricket.xpValue = 1;
        this.crickets.add(cricket);
        enemy.destroy();
    }

    // ─── Step 4: Cricket collection + XP bar ─────────────────────────────────────
    attractCrickets() {
        const px = this.player.x;
        const py = this.player.y;

        this.enemies.getChildren().forEach(enemy => {
            this.physics.moveToObject(enemy, this.player, enemy.speed);
        });

        this.crickets.getChildren().forEach(cricket => {
            const dist = Phaser.Math.Distance.Between(px, py, cricket.x, cricket.y);
            if (dist < this.magnetRange) {
                this.physics.moveToObject(cricket, this.player, 220);
            } else {
                if (cricket.body) cricket.body.setVelocity(0, 0);
            }
        });
    }

    collectCricket(player, cricket) {
        this.xp += cricket.xpValue ?? 1;
        cricket.destroy();
        this.updateXPBar();

        if (this.xp >= this.xpToNext) {
            this.xp      -= this.xpToNext;
            this.xpToNext = Math.floor(this.xpToNext * 1.5);
            this.playerLevel++;
            this.updateXPBar();
            this.showLevelUp();
        }
    }

    enemyHitPlayer(player, enemy) {
        const now = this.time.now;
        if (now - enemy.lastHitTime < 1000) return;
        enemy.lastHitTime = now;

        this.playerHealth -= enemy.damage;
        this.updateHPBar();
        this.tweens.add({ targets: player, alpha: 0.3, duration: 100, yoyo: true });

        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            this.updateHPBar();
            this.time.delayedCall(500, () => this.scene.start('GameOverScene', { level: this.level }));
        }
    }

    tickTimer() {
        this.gameTime--;
        const mins = Math.floor(this.gameTime / 60);
        const secs = this.gameTime % 60;
        this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
        if (this.gameTime <= 0) this.scene.start('GameOverScene', { level: this.level });
    }

    // ─── Step 5: Level-up screen ─────────────────────────────────────────────────
    showLevelUp() {
        this.isLevelingUp = true;
        this.physics.pause();
        this.spawnTimer.paused     = true;
        this.biteTimer.paused      = true;
        this.gameTimerEvent.paused = true;
        this.regenTimer.paused     = true;

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
                name: 'Tail Slap', desc: 'Sweeping arc attack in front of you', type: 'weapon',
                available: () => !this.ownedWeapons.has('tailslap'),
                effect: () => {
                    this.ownedWeapons.add('tailslap');
                    this.tailSlapTimer = this.time.addEvent({ delay: 3000, callback: this.doTailSlap, callbackScope: this, loop: true });
                },
            },
            {
                name: 'Tail Slap+', desc: 'Widen arc to 180°', type: 'weapon',
                available: () => this.ownedWeapons.has('tailslap') && !this.tailSlapUpgraded,
                effect: () => { this.tailSlapUpgraded = true; },
            },
            {
                name: 'Poop', desc: 'Fires a projectile in a random direction', type: 'weapon',
                available: () => !this.ownedWeapons.has('poop'),
                effect: () => {
                    this.ownedWeapons.add('poop');
                    this.poopTimer = this.time.addEvent({ delay: 3500, callback: this.doPoop, callbackScope: this, loop: true });
                },
            },
            {
                name: 'Pebble Flick', desc: 'Fires 3 piercing pebbles toward the nearest enemy', type: 'weapon',
                available: () => !this.ownedWeapons.has('pebble'),
                effect: () => {
                    this.ownedWeapons.add('pebble');
                    this.pebbleTimer = this.time.addEvent({ delay: 3000, callback: this.doPebbleFlick, callbackScope: this, loop: true });
                },
            },
            {
                name: 'Pebble Flick+', desc: 'Fire 9 pebbles that pierce 3 enemies', type: 'weapon',
                available: () => this.ownedWeapons.has('pebble') && this.pebbleCount < 9,
                effect: () => { this.pebbleCount = 9; this.pebblePierce = 3; },
            },
        ];

        // Passives — always available
        const passiveUpgrades = [
            { name: 'Angry',           desc: 'Move faster',                   effect: () => { this.playerSpeed += 30; } },
            { name: 'Aura Farming',    desc: 'Bite does more damage',         effect: () => { this.biteDamage += 10; } },
            { name: 'Hunter Instinct', desc: 'Bigger bite range',             effect: () => { this.biteRange  += 25; } },
            { name: 'Basking',         desc: 'Bite attacks faster',           effect: () => { this.biteRate = Math.max(300, this.biteRate - 150); } },
            { name: 'Bug Bucket',      desc: 'Increase max health by 25',     effect: () => { this.playerMaxHealth += 25; this.playerHealth = Math.min(this.playerHealth + 25, this.playerMaxHealth); this.updateHPBar(); } },
            { name: 'Well Fed',        desc: 'Regenerate 5 HP every 3 sec',  effect: () => { this.startRegen(); } },
            { name: 'Hungry Forager',  desc: 'Crickets attract from further', effect: () => { this.magnetRange += 80; } },
            { name: 'Hard Scales',     desc: 'Enemies deal less damage',      effect: () => { this.enemies.getChildren().forEach(e => { e.damage = Math.max(1, e.damage - 2); }); } },
        ];

        // Build the pool: all available weapons first, then passives
        const availableWeapons  = weaponUpgrades.filter(w => w.available());
        const allUpgrades = [...availableWeapons, ...passiveUpgrades];

        const choices = Phaser.Utils.Array.Shuffle([...allUpgrades]).slice(0, 3);

        const cardW  = 190;
        const cardH  = 130;
        const gap    = 20;
        const startX = W / 2 - (cardW * 1.5 + gap);

        choices.forEach((upgrade, i) => {
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

            ui.push(card, title, desc);

            card.on('pointerover', () => card.setFillStyle(hoverColor));
            card.on('pointerout',  () => card.setFillStyle(cardColor));
            card.on('pointerdown', () => {
                upgrade.effect();
                ui.forEach(el => el.destroy());
                this.physics.resume();
                this.spawnTimer.paused     = false;
                this.biteTimer.paused      = false;
                this.gameTimerEvent.paused = false;
                this.regenTimer.paused     = false;
                this.isLevelingUp          = false;
            });
        });
    }

    doRegen() {
        if (this.playerHealth < this.playerMaxHealth) {
            this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 1);
            this.updateHPBar();
        }
    }

    // Well Fed upgrade — speeds regen up to 1 HP every 10 seconds
    startRegen() {
        this.regenDelay = 10000;
        this.regenTimer.remove();
        this.regenTimer = this.time.addEvent({ delay: this.regenDelay, callback: this.doRegen, callbackScope: this, loop: true });
    }
}
