export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Player (512x128 sheet = 4 frames of 128x128)
        this.load.spritesheet('snapper', 'assets/sprites/player/snapper.png', { frameWidth: 128, frameHeight: 128 });

        // Standard 2-frame enemies (path: enemy_<key>.png, 256x128 = 2 frames of 128x128)
        const enemies2 = [
            'lettuce_small', 'basil_small', 'lettuce_hopper', 'lettuce_shooter', 'basil_propeller',
            'rocket_small', 'rocket_knife', 'oregano_skunk', 'oregano_ghost', 'oregano_fan', 'rocket_sword',
            'coriander_small', 'coriander_whip', 'carrot_thug', 'carrot_wheel', 'coriander_hydra', 'coriander_carrot',
            'spinach_medium', 'spinach_small', 'mulberry_bat', 'mulberry_snake', 'spinach_cyclone',
            'basil_bomb', 'oregano_phantom', 'spinach_tempest', 'mulberry_monstrosity',
        ];
        enemies2.forEach(key => {
            this.load.spritesheet(key, `assets/sprites/enemies/enemy_${key}.png`, { frameWidth: 128, frameHeight: 128 });
        });

        // Multi-frame enemies (4 frames each: walk 0-1, special 2-3; lettuce_trap 3 frames)
        this.load.spritesheet('carrot_mole',        'assets/sprites/enemies/enemy_carrot_mole.png',        { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('carrot_dart',        'assets/sprites/enemies/enemy_carrot_dart.png',        { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('lettuce_trap',       'assets/sprites/enemies/enemy_lettuce_trap.png',       { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('rocket_bustersword', 'assets/sprites/enemies/enemy_rocket_bustersword.png', { frameWidth: 128, frameHeight: 128 });

        // Bosses (1024x256 sheet = 4 frames of 256x256: idle 0-1, attack 2-3)
        const bosses = ['lettuce_beetle', 'rocket_spider', 'carrot_scorpion', 'mulberry_mantis', 'yun_hand'];
        bosses.forEach(key => {
            this.load.spritesheet(key, `assets/sprites/bosses/boss_${key}.png`, { frameWidth: 256, frameHeight: 256 });
        });

        // Enemy projectiles (static images, 96x96)
        ['projectile_lettuce_shooter', 'projectile_oregano_ghost',
         'projectile_yun_hand_calcium', 'projectile_yun_hand_vitamin']
            .forEach(key => this.load.image(key, `assets/sprites/enemy_projectiles/${key}.png`));

        // Weapons (static images, 128x128)
        ['weapon_poop', 'weapon_pebble_flick', 'weapon_pupae_mines', 'weapon_skin_shed',
         'weapon_woodie_bounce', 'weapon_branch_throw', 'dubia_shields',
         'evol_bug_buster', 'evol_log_lob', 'evol_shining_shell', 'evol_spike_shedder',
         'evol_toxic_ocean']
            .forEach(key => this.load.image(key, `assets/sprites/weapons/${key}.png`));

        // Items (64x64 static)
        this.load.image('cricket', 'assets/sprites/items/cricket.png');
        this.load.image('dragonfly', 'assets/sprites/items/dragonfly.png');
        this.load.image('mealworm', 'assets/sprites/items/mealworm.png');
        this.load.image('vitaworm', 'assets/sprites/items/vitaworm.png');
        this.load.image('foodbox', 'assets/sprites/items/foodbox.png');
        this.load.image('fullbox', 'assets/sprites/items/fullbox.png');
        this.load.image('treasure', 'assets/sprites/items/treasure.png');

        // BGM (looping tracks)
        this.load.audio('bgm_title',     'assets/audio/bgm/title.wav');
        this.load.audio('bgm_lv1',       'assets/audio/bgm/lv1.wav');
        this.load.audio('bgm_lv2',       'assets/audio/bgm/lv2.wav');
        this.load.audio('bgm_lv3',       'assets/audio/bgm/lv3.wav');
        this.load.audio('bgm_lv4',       'assets/audio/bgm/lv4.wav');
        this.load.audio('bgm_lv5',       'assets/audio/bgm/lv5.wav');
        this.load.audio('bgm_boss',      'assets/audio/bgm/boss.wav');
        this.load.audio('bgm_finalboss', 'assets/audio/bgm/finalboss.wav');

        // SFX (ping.wav is intentionally unused per the audio asset guide)
        this.load.audio('sfx_boss_enters',      'assets/audio/sfx/boss_enters.wav');
        this.load.audio('sfx_enemy_hurt',       'assets/audio/sfx/enemy_hurt.wav');
        this.load.audio('sfx_player_hurt',      'assets/audio/sfx/player_hurt.wav');
        this.load.audio('sfx_levelup',          'assets/audio/sfx/levelup.wav');
        this.load.audio('sfx_item_collect',     'assets/audio/sfx/item_collect.wav');
        this.load.audio('sfx_item_heal',        'assets/audio/sfx/item_heal.wav');
        this.load.audio('sfx_pause',            'assets/audio/sfx/pause.wav');
        this.load.audio('sfx_upgrade_selected', 'assets/audio/sfx/upgrade_selected.wav');
        this.load.audio('sfx_level_selected',   'assets/audio/sfx/level_selected.wav');
        this.load.audio('sfx_win',              'assets/audio/sfx/win.wav');
        this.load.audio('sfx_gameover',         'assets/audio/sfx/gameover.wav');
    }

    create() {
        this.scene.start('TitleScene');
    }
}
