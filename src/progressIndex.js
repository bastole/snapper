// Persistent (localStorage-backed) record of the highest weapon level, highest boost
// pick count, and which evolutions have ever been reached across every playthrough —
// powers the level-select INDEX menu and the in-game Evolutions menu's "seen before"
// unmasking. Follows the same module-scope-state pattern as audio.js.

const STORAGE_KEY = 'snapper_progressIndex';

function loadIndex() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (raw && typeof raw === 'object') {
            return {
                weapons:    raw.weapons    ?? {},
                boosts:     raw.boosts     ?? {},
                evolutions: raw.evolutions ?? {},
                enemies:    raw.enemies    ?? {},
                highScores: raw.highScores ?? {},
            };
        }
    } catch { /* corrupt/missing data — start fresh */ }
    return { weapons: {}, boosts: {}, evolutions: {}, enemies: {}, highScores: {} };
}

let index = loadIndex();

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(index));
}

export function getProgressIndex() {
    return index;
}

// Only ever raises the recorded level — never lowers it, so re-picking a weapon you've
// already reached level 4 on in a past run doesn't need special-casing.
export function recordWeaponLevel(weaponKey, level) {
    if (!level || level <= (index.weapons[weaponKey] ?? 0)) return;
    index.weapons[weaponKey] = level;
    save();
}

export function recordBoostPick(boostName, level) {
    if (!level || level <= (index.boosts[boostName] ?? 0)) return;
    index.boosts[boostName] = level;
    save();
}

export function recordEvolution(evolutionId) {
    if (index.evolutions[evolutionId]) return;
    index.evolutions[evolutionId] = true;
    save();
}

function enemyEntry(enemyKey) {
    return index.enemies[enemyKey] ?? (index.enemies[enemyKey] = { seen: false, kills: 0, losses: 0 });
}

export function recordEnemySeen(enemyKey) {
    const e = enemyEntry(enemyKey);
    if (e.seen) return;
    e.seen = true;
    save();
}

export function recordEnemyKill(enemyKey) {
    enemyEntry(enemyKey).kills++;
    save();
}

export function recordEnemyLoss(enemyKey) {
    enemyEntry(enemyKey).losses++;
    save();
}

// Per-world-level (1-5) best score ever reached, shown next to each level's button
// on Level Select. Only ever raises the recorded value, same as recordWeaponLevel.
export function recordHighScore(level, score) {
    if (!score || score <= (index.highScores[level] ?? 0)) return;
    index.highScores[level] = score;
    save();
}

export function getHighScore(level) {
    return index.highScores[level] ?? 0;
}
