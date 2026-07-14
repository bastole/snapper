import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// Phaser 3.88.2's GamepadPlugin.stopListeners() (called on every scene shutdown) loops
// over `this.gamepads` and calls `.removeAllListeners()` on every slot with no null check.
// If a slot is ever empty — which happens when a controller disconnects/reconnects, since
// browsers don't agree on Gamepad API index assignment (observed on Edge) — every
// subsequent scene transition throws and the game hard-crashes. Patched here (not in the
// vendored lib/phaser.min.js) so it survives a future Phaser version bump untouched.
//
// The empty slots are true sparse holes (never assigned), not explicit `undefined`
// values — Phaser's own `refreshPads()` only ever writes the native index a controller
// actually reports, so other indices are simply never set. That distinction matters:
// Array.prototype.map() SKIPS holes and leaves them unfilled in its output, so an earlier
// version of this patch (`this.gamepads.map(pad => pad || noopStub)`) silently failed to
// patch real hole-based gaps and still crashed. Array.from() with an explicit length
// iterates every index regardless of whether it's a hole, so it actually fills them.
//
// The substitution also isn't applied in place — swap in a throwaway array, run the
// original implementation against that, then restore the real array untouched — to avoid
// any risk of disturbing whatever internal bookkeeping (e.g. refreshPads' native-index
// sync) depends on the live array's exact shape.
{
    const proto = Phaser.Input.Gamepad.GamepadPlugin.prototype;
    const originalStopListeners = proto.stopListeners;
    const noopStub = { removeAllListeners() {} };
    proto.stopListeners = function () {
        const real = this.gamepads;
        this.gamepads = Array.from({ length: real.length }, (_, i) => real[i] || noopStub);
        try {
            return originalStopListeners.call(this);
        } finally {
            this.gamepads = real;
        }
    };
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    backgroundColor: '#000000',
    input: { gamepad: true, activePointers: 2 },
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
