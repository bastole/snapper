import { playSfx, pauseBgm, resumeBgm, stopBgm } from '../audio.js';
import { recordEnemyLoss } from '../progressIndex.js';
import { registerGamepadHint } from '../inputMode.js';
export const GameFlowMethods = {

    showDeathOverlay() {
        if (this._deathOverlayShown) return;
        this._deathOverlayShown = true;
        // Whichever enemy/boss last dealt damage (set at ~19 call sites across the
        // codebase right before each `this.playerHealth -=`) is credited with the loss
        // for the INDEX menu's "losses to" stat. Not tracked for the rare case of dying
        // to a status-effect tick (burn) with no fresh hit in between.
        if (this.lastDamageSource) recordEnemyLoss(this.lastDamageSource);

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

        addUI(this.add.text(W / 2, H / 2 - 180, 'GAME OVER', {
            fontSize: '96px', fontFamily: 'Arial Black, Arial',
            color: '#ff3333', stroke: '#000000', strokeThickness: 12,
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5));

        // RETRY
        const retryBtn = addUI(this.add.text(W / 2, H / 2 - 60, '[ RETRY ]', {
            fontSize: '40px', fontFamily: 'Arial',
            color: '#ffffff', backgroundColor: '#333333', padding: { x: 40, y: 20 },
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5).setInteractive({ useHandCursor: true }));
        retryBtn.on('pointerover', () => retryBtn.setColor('#ffff00'));
        retryBtn.on('pointerout',  () => retryBtn.setColor('#ffffff'));
        retryBtn.on('pointerdown', () => { stopBgm(); this.scene.start('GameScene', { level: this.level }); });

        // MAIN MENU
        const menuBtn = addUI(this.add.text(W / 2, H / 2 + 60, '[ MAIN MENU ]', {
            fontSize: '40px', fontFamily: 'Arial',
            color: '#ffffff', backgroundColor: '#333333', padding: { x: 40, y: 20 },
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5).setInteractive({ useHandCursor: true }));
        menuBtn.on('pointerover', () => menuBtn.setColor('#ffff00'));
        menuBtn.on('pointerout',  () => menuBtn.setColor('#ffffff'));
        menuBtn.on('pointerdown', () => { stopBgm(); this.scene.start('LevelSelectScene'); });

        // Gamepad: A = retry, B = menu
        this._deathPadHandler = (pad, button) => {
            const idx = button.index;
            if (idx === 0) retryBtn.emit('pointerdown');
            if (idx === 1) menuBtn.emit('pointerdown');
        };
        this.input.gamepad.on('down', this._deathPadHandler);
        addUI(registerGamepadHint(this.add.text(W / 2, H / 2 + 160, '🎮  A  Retry    B  Menu', {
            fontSize: '22px', fontFamily: 'Arial', color: '#666666',
        }).setScrollFactor(0).setDepth(501).setOrigin(0.5)));
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

        this.add.text(W / 2, H / 2 - 160, 'LEVEL CLEAR!', {
            fontSize: '104px', fontFamily: 'Arial Black, Arial',
            color: '#00ff88', stroke: '#000000', strokeThickness: 16,
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);

        this.add.text(W / 2, H / 2 - 20, `Level ${this.level} Complete`, {
            fontSize: '36px', fontFamily: 'Arial', color: '#ffffff',
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 56, `Player Level: ${this.playerLevel}   •   Kills: ${this.kills}   •   Damage: ${this.damageDealt}`, {
            fontSize: '30px', fontFamily: 'Arial', color: '#ffff88',
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);

        this.add.text(W / 2, H / 2 + 130, `Score: ${this.score}`, {
            fontSize: '56px', fontFamily: 'Arial Black, Arial',
            color: '#ffffff', stroke: '#000000', strokeThickness: 8,
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5);

        const levelNames = {
            1: 'Iceberg Lettuce & Basil',
            2: 'Rocket & Oregano',
            3: 'Coriander & Carrot',
            4: 'Spinach & Mulberry',
            5: 'The Garden',
        };
        const hasNextLevel = this.level < 5;
        const nextLabel = hasNextLevel ? `NEXT LEVEL\n${levelNames[this.level + 1]}` : '[ CONTINUE ]';
        const goNext = () => {
            if (hasNextLevel) this.scene.start('GameScene', { level: this.level + 1 });
            else this.scene.start('LevelSelectScene');
        };

        const next = this.add.text(W / 2, H / 2 + 220, nextLabel, {
            fontSize: '40px', fontFamily: 'Arial', color: '#ffffff', align: 'center',
            backgroundColor: '#226622', padding: { x: 48, y: 24 },
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setInteractive({ useHandCursor: true });
        next.on('pointerover', () => next.setColor('#00ff88'));
        next.on('pointerout',  () => next.setColor('#ffffff'));
        next.on('pointerdown', goNext);

        const menu = this.add.text(W / 2, H / 2 + 350, '[ MAIN MENU ]', {
            fontSize: '32px', fontFamily: 'Arial', color: '#aaaaaa',
            backgroundColor: '#333333', padding: { x: 40, y: 20 },
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5).setInteractive({ useHandCursor: true });
        menu.on('pointerover', () => menu.setColor('#ffffff'));
        menu.on('pointerout',  () => menu.setColor('#aaaaaa'));
        menu.on('pointerdown', () => this.scene.start('LevelSelectScene'));

        // Gamepad: A always moves on (next level, or Continue on the final level),
        // B always goes to the main menu — fixed bindings, not a toggle-then-confirm
        // scheme, so the hint below stays true regardless of anything else on screen.
        registerGamepadHint(this.add.text(W / 2, H / 2 + 430, hasNextLevel ? '🎮  A  Next Level    B  Main Menu' : '🎮  A  Continue    B  Main Menu', {
            fontSize: '22px', fontFamily: 'Arial', color: '#666666',
        }).setScrollFactor(0).setDepth(301).setOrigin(0.5));

        const lcPadHandler = (pad, button) => {
            const idx = button.index;
            if (idx === 0) goNext();                                    // A
            else if (idx === 1) this.scene.start('LevelSelectScene');   // B
        };
        this.input.gamepad.on('down', lcPadHandler);
    }


};
