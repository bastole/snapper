import { playBgm, crossfadeBgm, stopBgm, pauseBgm, resumeBgm, playSfx, getMusicVolume, getSfxVolume, setMusicVolume, setSfxVolume } from '../audio.js';
import { MovementMethods }    from '../systems/movement.js';
import { HudMethods }         from '../systems/hud.js';
import { EnemySpawnMethods }  from '../systems/enemySpawn.js';
import { BaseWeaponMethods }  from '../systems/baseWeapons.js';
import { EnemyDeathMethods }  from '../systems/enemyDeath.js';
import { CricketMethods }     from '../systems/crickets.js';
import { BossMethods }        from '../systems/boss.js';
import { GameFlowMethods }    from '../systems/gameFlow.js';
import { LevelUpMethods }     from '../systems/levelUp.js';
import { EvolutionMethods }   from '../systems/evolutions.js';
import { EvolutionUIMethods } from '../systems/evolutionUI.js';
import { HandBossMethods }    from '../systems/handBoss.js';
import { HandMiniBossMethods} from '../systems/handMiniBoss.js';

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
        // Remove any leftover gamepad/pointer listeners from the previous run to avoid stacking
        this.input.gamepad.removeAllListeners('down');
        this.input.removeAllListeners('pointerdown');
        this.input.removeAllListeners('pointermove');
        this.input.removeAllListeners('pointerup');

        // Phaser silently freezes the whole game loop while the browser tab/window is
        // unfocused (no movement, no physics, no overlaps) and instantly catches up once
        // focus returns — with no on-screen indication anything happened. That reads as
        // "collision stopped working" (nothing responds, then a delayed pile of damage
        // lands all at once). Make it visible instead by pausing properly on blur, the
        // same way the pause button does.
        this.game.events.off('blur', this._onGameBlur);
        this.game.events.on('blur', this._onGameBlur = () => {
            if (!this.isPaused && !this.isCountdown && !this.isLevelingUp && !this.isLevelClear && !this.isGameOver && !this._evoMenuOpen) {
                this.togglePause(this.pauseBtn);
            }
        });

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
            if (button.index === 9 && !this.isLevelingUp && !this.isCountdown && !this.isLevelClear && !this.isGameOver && !this._evoMenuOpen) this.togglePause(this.pauseBtn);
        });

        // Touch/mouse virtual joystick — drag anywhere outside a button/menu to move
        this.joystickActive    = false;
        this.joystickPointerId = null;
        this.joystickOrigin    = { x: 0, y: 0 };
        this.joystickVector    = { x: 0, y: 0 };
        this.setupTouchJoystick();

        // --- Groups ---
        this.enemies   = this.physics.add.group();
        this.crickets  = this.physics.add.group();
        this.offscreenArrows = this.add.graphics().setDepth(30).setScrollFactor(0);
        this.pupaGroup = this.physics.add.group(); // tracks live pupa mines for boss overlap

        // --- Player stats ---
        this.playerSpeed    = 160;
        this.playerHealth   = 100;
        this.playerMaxHealth = 100;
        this.playerBurning   = false;
        this.playerBurnUntil = 0;
        this.playerBurnTimer = null;
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
        this.gameTime        = 600;
        this.bossSpawned     = false;
        this.boss            = null;
        this.topBossHpBar    = null;
        this.topBossHpBarBg  = null;
        this.topBossLabel    = null;
        this.bossPhaseLines    = [];
        this.topBossPhaseLines = [];
        this.handFireZones   = [];
        this.handMiniBossArray = [];
        this.handVacuumActive  = false;
        this.handVacuumOverlay = null;

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
        this.biteLevel  = 1;
        this.starvedChompActive = false;
        this._roarAngle = 0;
        this._spikeShedderKills = 0;
        this._dubiaDefenderLastShot = 0;
        this._dubiaDefendersActive  = false;

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
        this.branchLength      = 120;
        this.branchMaxHits     = 15;
        this.dustKickLevel     = 0;
        this.dustKickLength    = 180;
        this.dustKickSlowDuration = 2000;
        this.scratchLevel      = 0;

        // --- New passives ---
        this.coldGlareActive   = false;
        this.coldGlareCooldown = 30000;
        this.coldGlareSlow     = 1000;
        this.coldGlareLevel    = 0;
        this.polycephalyChance = 0;
        this._polycephalyFiring = false;
        this.venomChance       = 0;
        this.venomDuration     = 2000;
        this.vitaminBonus      = 0;
        // Big Fangs
        this.bigFangsChance    = 0;
        this.bigFangsHeal      = 0;
        // Hyperactivity
        this.hyperactivityLevel    = 0;
        this.hyperactivityKillGoal = 70;
        this.hyperactivityKillsSince = 0;
        // Bug Catcher
        this.bugCatcherChance  = 0;
        this.bugCatcherDuration = 2000;

        // Track which weapons the player owns
        this.ownedWeapons  = new Set(['bite']);
        // Track which passive boosts the player has picked (allows repeats)
        this.ownedPassives = [];
        this.evolutionDefs = [
            { id: 'starved_chomp',         weaponKey: 'bite',        weaponLabel: 'Bite',                  boostName: 'Hungry Forager',      evolvedName: 'Starved Chomp',         desc: 'Kills grant 2× XP instantly — no insect drop. More range & damage.',         effect() { this.evolveToStarvedChomp(); } },
            { id: 'steel_slam',            weaponKey: 'tailslap',    weaponLabel: 'Tail Slap',             boostName: 'Hard Scales',          evolvedName: 'Steel Slam',            desc: 'Heavy arc — more damage, high knockback, immobilises for 500ms.',             effect() { this.evolveToSteelSlam(); } },
            { id: 'toxic_ocean',           weaponKey: 'poop',        weaponLabel: 'Poop',                  boostName: 'Well Fed',             evolvedName: 'Toxic Ocean',           desc: 'Fires 3 toxic fields, bigger radius, slows enemies, drifts to crowds.',      effect() { this.evolveToToxicOcean(); } },
            { id: 'sunbaked_ambers',       weaponKey: 'pebble',      weaponLabel: 'Pebble Flick',          boostName: 'Basking',              evolvedName: 'Sunbaked Ambers',       desc: '30 ambers in a 360° ring every 8s — inflicts burn for 3.5s.',               effect() { this.evolveToSunbakedAmbers(); } },
            { id: 'raging_roar',           weaponKey: 'hiss',        weaponLabel: 'Hiss',                  boostName: 'Angry',                evolvedName: 'Raging Roar',           desc: 'Always-active 60° rotating cone — slows everything inside.',                 effect() { this.evolveToRagingRoar(); } },
            { id: 'sticky_shot',           weaponKey: 'lick',        weaponLabel: 'Lick',                  boostName: 'Vitamin Supplements',  evolvedName: 'Sticky Shot',           desc: 'Fires 5 tongues at once every 1.5s — more damage, slows hit enemies.',       effect() { this.evolveToStickyShot(); } },
            { id: 'acid_snake',            weaponKey: 'wormwhip',    weaponLabel: 'Worm Whip',             boostName: 'Venom',                evolvedName: 'Acid Snake',            desc: 'Both sides, 160° arc every 3.5s — poisons 6s, slows 2s.',                   effect() { this.evolveToAcidSnake(); } },
            { id: 'bug_buster',            weaponKey: 'pupamines',   weaponLabel: 'Pupa Mines',            boostName: 'Bug Catcher',          evolvedName: 'Bug Buster',            desc: 'Sprays 8-12 mines lasting 45s — defeated enemies drop a Pupa Mine.',   effect() { this.evolveToBugBuster(); } },
            { id: 'spike_shedder',         weaponKey: 'skinshed',    weaponLabel: 'Skin Shed',             boostName: 'Big Fangs',            evolvedName: 'Spike Shedder',         desc: 'Drops 3 spiky skins every 8s — far more damage, heals 1 HP per 10 kills.',   effect() { this.evolveToSpikeShedder(); } },
            { id: 'shining_shells',        weaponKey: 'woodiebounce',weaponLabel: 'Woodie Bounce',         boostName: 'Shiny Scales',         evolvedName: 'Shining Shells',        desc: '3 fast-moving shells every 4s, unlimited ricochets 25s, auto-aim, kills explode.', effect() { this.evolveToShiningShells(); } },
            { id: 'dubia_defenders',       weaponKey: 'dubiashields',weaponLabel: 'Dubia Shields',         boostName: 'Bug Bucket',           evolvedName: 'Dubia Defenders',       desc: 'Shields spin faster — each fires a strong projectile every 5s.',             effect() { this.evolveToDubiaDefenders(); } },
            { id: 'flashclaw',             weaponKey: 'poisonclaw',  weaponLabel: 'Poison Claw',           boostName: 'Hunter Instinct',      evolvedName: 'Flashclaw',             desc: 'Double claw strike — immobilises 1s (10s cd per enemy), poisons 6s.',        effect() { this.evolveToFlashclaw(); } },
            { id: 'log_lob',               weaponKey: 'branchthrow', weaponLabel: 'Branch Throw',          boostName: 'Aura Farming',         evolvedName: 'Log Lob',               desc: '2 logs rolling opposite ways — unbreakable 25s, high damage, knockback.',     effect() { this.evolveToLogLob(); } },
            { id: 'duststorm',             weaponKey: 'dustkick',    weaponLabel: 'Dust Kick',             boostName: 'Inflate',              evolvedName: 'Duststorm',             desc: 'Huge area — medium damage, slows all, immobilises nearest for 1.5s.',        effect() { this.evolveToDuststorm(); } },
            { id: 'lucky_thrash',          weaponKey: 'scratch',     weaponLabel: 'Lucky Scratch',         boostName: 'Hyperactivity',        evolvedName: 'Lucky Thrash',          desc: 'Many scratches in a huge radius — greatly raises item drop chance + Fullbox.', effect() { this.evolveToLuckyThrash(); } },
            { id: 'four_chills',           weaponKey: 'coldglare',   weaponLabel: 'Cold Glare',            boostName: 'Polycephaly',          evolvedName: 'Four Chills',           desc: 'Huge ring — slows all 8s, immobilises closest 8s, halves their HP.',         effect() { this.evolveToFourChills(); } },
        ];
        this.appliedEvolutions = new Set();

        // Canonical max-level tables, used for evolution checks and for the "current/max" displays
        // in the level-up cards and pause menu loadout.
        this.weaponMaxLevel = {
            bite: 4, tailslap: 2, poop: 2, pebble: 2, hiss: 2, lick: 3,
            wormwhip: 2, pupamines: 3, skinshed: 2, woodiebounce: 3,
            dubiashields: 4, poisonclaw: 4, branchthrow: 4, dustkick: 5, scratch: 3, coldglare: 4,
        };
        this.boostMaxLevel = {
            'Inflate': 1, 'Shiny Scales': 2, 'Angry': 5, 'Aura Farming': 5,
            'Hunter Instinct': 5, 'Basking': 5, 'Bug Bucket': 5, 'Well Fed': 3,
            'Hungry Forager': 4, 'Hard Scales': 4, 'Polycephaly': 4, 'Venom': 3,
            'Vitamin Supplements': 4, 'Big Fangs': 4, 'Hyperactivity': 3, 'Bug Catcher': 3,
        };

        // --- Collisions ---
        this.physics.add.overlap(this.player, this.crickets, this.collectCricket, null, this);
        this.physics.add.overlap(this.player, this.enemies,  this.enemyHitPlayer, null, this);
        this.physics.add.collider(this.enemies, this.enemies, (a, b) => {
            this.trySpreadFire(a, b);
            this.trySpreadFire(b, a);
        }, null, this);

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
        this.regenDelay      = 20000;
        this.regenHealAmount = 1;
        this.regenTimer = this.time.addEvent({ delay: this.regenDelay, callback: this.doRegen, callbackScope: this, loop: true });

        // --- UI ---
        this.createUI();

        playBgm(this, `bgm_lv${this.level}`);
    }

    // ─── Background grid ────────────────────────────────────────────────────────
    addGrid(w, h) {
        const g = this.add.graphics();
        g.lineStyle(1, 0x2a5a2a, 0.5);
        for (let x = 0; x <= w; x += 128) { g.moveTo(x, 0); g.lineTo(x, h); }
        for (let y = 0; y <= h; y += 128) { g.moveTo(0, y); g.lineTo(w, y); }
        g.strokePath();
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
                if (this.boss.bugCaught) this.boss.setVelocity(0, 0);
                else this.physics.moveToObject(this.boss, this.player, 80 * (this.boss.slowFactor ?? 1));
            }
        }
        this.updateBossHealthBar();
        this.updateDubiaShields();
        if (this.ownedWeapons.has('ragingroar'))     this.updateRagingRoar();
        if (this.ownedWeapons.has('dubiadefenders')) this.updateDubiaDefenderShots();
        this.drawOffscreenArrows();
    }

}

Object.assign(GameScene.prototype, MovementMethods);
Object.assign(GameScene.prototype, HudMethods);
Object.assign(GameScene.prototype, EnemySpawnMethods);
Object.assign(GameScene.prototype, BaseWeaponMethods);
Object.assign(GameScene.prototype, EnemyDeathMethods);
Object.assign(GameScene.prototype, CricketMethods);
Object.assign(GameScene.prototype, BossMethods);
Object.assign(GameScene.prototype, GameFlowMethods);
Object.assign(GameScene.prototype, LevelUpMethods);
Object.assign(GameScene.prototype, EvolutionMethods);
Object.assign(GameScene.prototype, EvolutionUIMethods);
Object.assign(GameScene.prototype, HandBossMethods);
Object.assign(GameScene.prototype, HandMiniBossMethods);
