import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    backgroundColor: '#000000',
    input: { gamepad: true },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, TitleScene, LevelSelectScene, GameScene, GameOverScene],
};

window.game = new Phaser.Game(config);
