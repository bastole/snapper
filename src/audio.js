// Shared BGM/SFX helpers. Phaser's sound manager (this.sound) is the same global
// SoundManager singleton across every scene, so BGM state has to live outside any
// one scene to correctly answer "is this track already playing" across transitions.
let currentBgmKey = null;
let currentBgm = null;
let currentBgmBaseVolume = 0.45;

const MUSIC_VOL_KEY = 'snapper_musicVolume';
const SFX_VOL_KEY = 'snapper_sfxVolume';

function loadVolume(key) {
    const v = parseFloat(localStorage.getItem(key));
    return Number.isFinite(v) ? Phaser.Math.Clamp(v, 0, 1) : 1;
}

let musicVolume = loadVolume(MUSIC_VOL_KEY);
let sfxVolume   = loadVolume(SFX_VOL_KEY);

export function getMusicVolume() { return musicVolume; }
export function getSfxVolume()   { return sfxVolume; }

export function setMusicVolume(v) {
    musicVolume = Phaser.Math.Clamp(v, 0, 1);
    localStorage.setItem(MUSIC_VOL_KEY, String(musicVolume));
    if (currentBgm) currentBgm.setVolume(currentBgmBaseVolume * musicVolume);
}

export function setSfxVolume(v) {
    sfxVolume = Phaser.Math.Clamp(v, 0, 1);
    localStorage.setItem(SFX_VOL_KEY, String(sfxVolume));
}

export function playBgm(scene, key, volume = 0.45) {
    if (currentBgmKey === key && currentBgm?.isPlaying) return;
    currentBgm?.stop();
    currentBgm?.destroy();
    currentBgmBaseVolume = volume;
    currentBgm = scene.sound.add(key, { loop: true, volume: volume * musicVolume });
    currentBgm.play();
    currentBgmKey = key;
}

export function crossfadeBgm(scene, key, volume = 0.45, duration = 1000) {
    if (currentBgmKey === key) return;
    const oldBgm = currentBgm;
    const newBgm = scene.sound.add(key, { loop: true, volume: 0 });
    newBgm.play();
    scene.tweens.add({ targets: newBgm, volume: volume * musicVolume, duration });
    if (oldBgm) {
        scene.tweens.add({ targets: oldBgm, volume: 0, duration, onComplete: () => { oldBgm.stop(); oldBgm.destroy(); } });
    }
    currentBgm = newBgm;
    currentBgmKey = key;
    currentBgmBaseVolume = volume;
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
    scene.sound.play(key, { volume: volume * sfxVolume });
}
