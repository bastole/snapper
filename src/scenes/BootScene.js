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
    }

    create() {
        this.scene.start('TitleScene');
    }
}
