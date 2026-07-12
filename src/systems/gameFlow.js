import { playSfx, pauseBgm, resumeBgm, stopBgm } from '../audio.js';
export const GameFlowMethods = {

    showDeathOverlay() {
        if (this._deathOverlayShown) return;
        this._deathOverlayShown = true;

        playSfx(this, 'sfx_gameover');
        pauseBgm();

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
        retryBtn.on('pointerdown', () => { stopBgm(); this.scene.start('GameScene', { level: this.level }); });

        // MAIN MENU
        const menuBtn = addUI(this.add.text(W / 2, H / 2 + 120, '[ MAIN MENU ]', {
            fontSize: '20px', fontFamily: 'Arial',
            color: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 10 },
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5).setInteractive({ useHandCursor: true }));
        menuBtn.on('pointerover', () => menuBtn.setColor('#ffff00'));
        menuBtn.on('pointerout',  () => menuBtn.setColor('#ffffff'));
        menuBtn.on('pointerdown', () => { stopBgm(); this.scene.start('LevelSelectScene'); });

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
    },

    revivePlayer() {
        this.input.gamepad.off('down', this._deathPadHandler);
        this._deathOverlayShown = false;
        resumeBgm();

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
    },

    showLevelClear() {
        stopBgm();
        playSfx(this, 'sfx_win');
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


};
