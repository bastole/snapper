export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Player (512x128 sheet = 4 frames of 128x128)
        this.load.spritesheet('snapper', 'assets/sprites/player/snapper.png', { frameWidth: 128, frameHeight: 128 });

        // Enemies (256x128 sheet = 2 frames of 128x128)
        const enemies = [
            'iceberg_lettuce', 'basil', 'lettuce_hopper', 'lettuce_shooter', 'basil_propeller',
            'rocket', 'rocket_knife', 'oregano_skunk', 'oregano_ghost', 'oregano_fan', 'rocket_sword',
            'coriander', 'coriander_whip', 'carrot_mole', 'coriander_hydra', 'carrot_dart', 'carrot_wheel', 'carrot_thug',
            'spinach', 'small_spinach', 'mulberry_bat', 'mulberry_snake', 'spinach_cyclone',
            'lettuce_trap', 'basil_bomb', 'rocket_great_sword', 'oregano_phantom',
            'coriander_carrot', 'spinach_tempest', 'mulberry_monstrosity',
        ];
        enemies.forEach(key => {
            this.load.spritesheet(key, `assets/sprites/enemies/${key}.png`, { frameWidth: 128, frameHeight: 128 });
        });

        // Bosses (256x128 sheet = 2 frames of 128x128)
        const bosses = ['lettuce_beetle', 'rocket_spider', 'carrot_scorpion', 'mulberry_mantis', 'the_hand'];
        bosses.forEach(key => {
            this.load.spritesheet(key, `assets/sprites/bosses/${key}.png`, { frameWidth: 128, frameHeight: 128 });
        });

        // Items (32x32 static)
        this.load.image('cricket', 'assets/sprites/items/cricket.png');

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
