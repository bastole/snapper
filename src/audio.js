// Shared BGM/SFX helpers. Phaser's sound manager (this.sound) is the same global
// SoundManager singleton across every scene, so BGM state has to live outside any
// one scene to correctly answer "is this track already playing" across transitions.
let currentBgmKey = null;
let currentBgm = null;

export function playBgm(scene, key, volume = 0.45) {
    if (currentBgmKey === key && currentBgm?.isPlaying) return;
    currentBgm?.stop();
    currentBgm?.destroy();
    currentBgm = scene.sound.add(key, { loop: true, volume });
    currentBgm.play();
    currentBgmKey = key;
}

export function crossfadeBgm(scene, key, volume = 0.45, duration = 1000) {
    if (currentBgmKey === key) return;
    const oldBgm = currentBgm;
    const newBgm = scene.sound.add(key, { loop: true, volume: 0 });
    newBgm.play();
    scene.tweens.add({ targets: newBgm, volume, duration });
    if (oldBgm) {
        scene.tweens.add({ targets: oldBgm, volume: 0, duration, onComplete: () => { oldBgm.stop(); oldBgm.destroy(); } });
    }
    currentBgm = newBgm;
    currentBgmKey = key;
}

export function stopBgm() {
    currentBgm?.stop();
    currentBgm?.destroy();
    currentBgm = null;
    currentBgmKey = null;
}

export function pauseBgm() {
    if (currentBgm?.isPlaying) currentBgm.pause();
}

export function resumeBgm() {
    if (currentBgm?.isPaused) currentBgm.resume();
}

export function playSfx(scene, key, volume = 0.6) {
    scene.sound.play(key, { volume });
}
