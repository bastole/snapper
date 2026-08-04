// Tracks which input method the player most recently used (module-scope, like
// audio.js, since — same as BGM state — this reflects a single physical player
// across every scene transition, not anything scene-local) so every on-screen
// "🎮 ..." gamepad-only hint across the game can hide the instant keyboard/mouse/
// touch is used and reappear the instant a gamepad button or stick is used again.
let usingGamepad = false;
const hints = new Set();

export function isUsingGamepad() { return usingGamepad; }

// Wrap a freshly created hint Text object with this: it immediately reflects the
// current mode, and keeps syncing to it on every later change until destroyed —
// self-unregisters via the object's own 'destroy' event, so none of the many
// places these hints get torn down (menu close, screen rebuild, etc.) need any
// extra cleanup code.
export function registerGamepadHint(text) {
    text.setVisible(usingGamepad);
    hints.add(text);
    text.once('destroy', () => hints.delete(text));
    return text;
}

function setMode(gamepad) {
    if (usingGamepad === gamepad) return;
    usingGamepad = gamepad;
    hints.forEach(h => { if (h.active) h.setVisible(gamepad); });
}

// Call once per scene in create(). keydown/pointerdown mark "not a gamepad";
// a gamepad button or stick movement past a deadzone marks "is a gamepad".
// pointermove is deliberately not included — incidental mouse movement while
// actually playing with a gamepad shouldn't flicker the hints off.
export function trackInputMode(scene) {
    scene.input.keyboard?.on('keydown', () => setMode(false));
    scene.input.on('pointerdown', () => setMode(false));
    scene.input.gamepad.on('down', () => setMode(true));

    // Stick movement alone doesn't fire a 'down' event, so poll it every frame —
    // mirrors the continuous-stick-nav pattern already used throughout this codebase.
    const DEAD = 0.3;
    scene.events.on('update', () => {
        const pad = scene.input.gamepad.pad1;
        if (!pad) return;
        const mag = Math.max(
            Math.abs(pad.leftStick.x), Math.abs(pad.leftStick.y),
            Math.abs(pad.rightStick.x), Math.abs(pad.rightStick.y),
        );
        if (mag > DEAD) setMode(true);
    });
}
