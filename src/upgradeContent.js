// Static reference data for the level-select INDEX menu. Mirrors the flavor text
// already shown on level-up cards (levelUp.js) and the evolution list (GameScene.js's
// evolutionDefs), but as plain data with no dependency on a live GameScene instance —
// the INDEX menu is opened from LevelSelectScene, which has no run in progress.
//
// Each weapon/boost's tier count (tiers.length) doubles as its max level, matching
// GameScene.js's weaponMaxLevel/boostMaxLevel tables exactly.

export const WEAPON_CONTENT = {
    bite: {
        label: 'Bite',
        tiers: [
            { desc: 'Circle AOE centred on Snapper, fires every 3s.' },
            { desc: 'Faster bite — fires every 2s, +15 range, +10 damage.' },
            { desc: 'Stronger bite — +20 range, +15 damage.' },
            { desc: 'Venomous bite — +20 range, +15 damage, slows enemies for 2s.' },
        ],
    },
    tailslap: {
        label: 'Tail Slap',
        tiers: [
            { desc: 'Sweeping arc attack behind you as you move.' },
            { desc: 'Widen the arc behind you to 180°.' },
        ],
    },
    poop: {
        label: 'Poop',
        tiers: [
            { desc: 'Fires an exploding continuous projectile in a random direction — the resulting field shrinks over time until it disappears.' },
            { desc: 'Field lasts 6 seconds instead of 3.' },
        ],
    },
    pebble: {
        label: 'Pebble Flick',
        tiers: [
            { desc: 'Fires 3 piercing pebbles toward the nearest enemy.' },
            { desc: 'Fire 9 pebbles that pierce 3 enemies.' },
        ],
    },
    hiss: {
        label: 'Hiss',
        tiers: [
            { desc: 'Slow enemies in a 45° cone for 2 seconds.' },
            { desc: 'Widen cone to 90°.' },
        ],
    },
    lick: {
        label: 'Lick',
        tiers: [
            { desc: 'High-damage tongue at nearest enemy.' },
            { desc: '2 tongues, longer reach.' },
            { desc: '3 tongues, even longer reach.' },
        ],
    },
    wormwhip: {
        label: 'Worm Whip',
        tiers: [
            { desc: 'Whip left or right, alternating each strike.' },
            { desc: 'Whip both sides at once, longer range.' },
        ],
    },
    pupamines: {
        label: 'Pupa Mines',
        tiers: [
            { desc: 'Drop 1 exploding pupa mine.' },
            { desc: 'Drop 3 pupa mines.' },
            { desc: 'Drop 5 pupa mines.' },
        ],
    },
    skinshed: {
        label: 'Skin Shed',
        tiers: [
            { desc: 'Fling a piece of shed skin that arcs downward.' },
            { desc: 'Fling 2 pieces of shed skin.' },
        ],
    },
    woodiebounce: {
        label: 'Woodie Bounce',
        tiers: [
            { desc: 'Launch 1 bouncing woodlouse at the nearest enemy (2 bounces).' },
            { desc: 'Launch 2 woodlice (3 bounces).' },
            { desc: 'Launch 3 woodlice (5 bounces each).' },
        ],
    },
    dubiashields: {
        label: 'Dubia Shields',
        tiers: [
            { desc: 'Two roach shields orbit you, damaging anything they touch.' },
            { desc: 'Three shields orbit faster.' },
            { desc: 'Four shields orbit even faster.' },
            { desc: 'Two layers of shields orbit in opposite directions.' },
        ],
    },
    poisonclaw: {
        label: 'Poison Claw',
        tiers: [
            { desc: 'Lunge a venomous claw at nearest enemy (80px) — poisons for 3s.' },
            { desc: 'Longer reach (110px) — poisons for 5s.' },
            { desc: 'Even longer reach (140px) — poisons for 6s.' },
            { desc: 'Max reach (170px) — poisons for 7s.' },
        ],
    },
    branchthrow: {
        label: 'Branch Throw',
        tiers: [
            { desc: 'Hurl a wide branch at the nearest enemy (breaks after 15 hits).' },
            { desc: 'Wider branch.' },
            { desc: 'Even wider branch.' },
            { desc: 'Breaks after 30 hits instead.' },
        ],
    },
    dustkick: {
        label: 'Dust Kick',
        tiers: [
            { desc: 'Fire a short beam of dust — deals low damage and slows enemies 2s.' },
            { desc: 'Longer beam, slows for 6s.' },
            { desc: 'Much longer beam, slows for 10s.' },
        ],
    },
    scratch: {
        label: 'Lucky Scratch',
        tiers: [
            { desc: 'Scratch mark near you — damaged enemies have a higher Foodbox drop chance.' },
            { desc: 'Damaged enemies also have a higher Treasure drop chance.' },
            { desc: 'Bigger scratch, larger area.' },
        ],
    },
    coldglare: {
        label: 'Cold Glare',
        tiers: [
            { desc: 'Freezes enemies in the radius for 1s, happens every 30s.' },
            { desc: 'Cooldown reduced: 30s → 20s.' },
            { desc: 'Cooldown reduced further: 20s → 15s. Slow duration extended: 1s → 4s.' },
            { desc: 'Slow duration extended further: 4s → 10s.' },
        ],
    },
};

export const BOOST_CONTENT = {
    'Inflate': {
        label: 'Inflate',
        tiers: [
            { desc: 'Taking damage knocks back and hurts all enemies within 110px.' },
            { desc: 'Heavier damage and knockback, with a random ailment (poison, fire, slow, or immobilize) inflicted half the time.' },
        ],
    },
    'Shiny Scales': {
        label: 'Shiny Scales',
        tiers: [
            { desc: '30% chance to deflect enemy projectiles back at them.' },
            { desc: '60% chance to deflect enemy projectiles back at them.' },
        ],
    },
    'Angry': {
        label: 'Angry',
        tiers: [1, 2, 3, 4, 5].map(() => ({ desc: 'Snapper moves faster (+30 speed).' })),
    },
    'Aura Farming': {
        label: 'Aura Farming',
        tiers: [1, 2, 3, 4, 5].map(() => ({ desc: "Snapper's attacks do more damage (+10 to every active weapon)." })),
    },
    'Hunter Instinct': {
        label: 'Hunter Instinct',
        tiers: [1, 2, 3, 4, 5].map(() => ({ desc: "Snapper's attacks reach further (+25 range to most weapons, +15 to Pupa Mines, +40 to Dust Kick)." })),
    },
    'Basking': {
        label: 'Basking',
        tiers: [1, 2, 3, 4, 5].map(() => ({ desc: "Snapper's attacks fire faster (-150ms cooldown on every weapon timer, minimum 300ms; -1500ms for Cold Glare)." })),
    },
    'Bug Bucket': {
        label: 'Bug Bucket',
        tiers: [1, 2, 3, 4, 5].map(() => ({ desc: "Snapper's max health increases by 25." })),
    },
    'Well Fed': {
        label: 'Well Fed',
        tiers: [
            { desc: 'Passive regen speeds up: 1 HP every 15 seconds.' },
            { desc: 'Passive regen speeds up further: 2 HP every 10 seconds.' },
            { desc: 'Passive regen speeds up further: 3 HP every 8 seconds.' },
        ],
    },
    'Hungry Forager': {
        label: 'Hungry Forager',
        tiers: [1, 2, 3, 4].map(() => ({ desc: 'Insects attract to Snapper from further away (+160 magnet range).' })),
    },
    'Hard Scales': {
        label: 'Hard Scales',
        tiers: [1, 2, 3, 4].map(() => ({ desc: 'Enemies deal less contact damage to Snapper (-2, minimum 1).' })),
    },
    'Polycephaly': {
        label: 'Polycephaly',
        tiers: [
            { desc: '10% chance for each attack to fire twice.' },
            { desc: '20% chance for each attack to fire twice.' },
            { desc: '30% chance for each attack to fire twice.' },
            { desc: '40% chance for each attack to fire twice.' },
        ],
    },
    'Venom': {
        label: 'Venom',
        tiers: [
            { desc: '15% chance to poison enemies for 2.0s.' },
            { desc: '25% chance to poison enemies for 2.5s.' },
            { desc: '35% chance to poison enemies for 3.0s — also sets them on fire for 3s.' },
        ],
    },
    'Vitamin Supplements': {
        label: 'Vitamin Supplements',
        tiers: [1, 2, 3, 4].map(() => ({ desc: 'Higher chance of Foodbox and Treasure drops (+1%).' })),
    },
    'Big Fangs': {
        label: 'Big Fangs',
        tiers: [
            { desc: '5% chance to heal 5% max HP on kill.' },
            { desc: '9% chance to heal 8% max HP on kill.' },
            { desc: '14% chance to heal 14% max HP on kill.' },
            { desc: '18% chance to heal 20% max HP on kill.' },
        ],
    },
    'Hyperactivity': {
        label: 'Hyperactivity',
        tiers: [
            { desc: 'Every 70 kills: move faster for 5s.' },
            { desc: 'Every 40 kills: move much faster for 12s.' },
            { desc: 'Every 24 kills: move very fast for 20s.' },
        ],
    },
    'Bug Catcher': {
        label: 'Bug Catcher',
        tiers: [
            { desc: '10% chance to immobilize an attacking enemy for 2s.' },
            { desc: '17% chance to immobilize an attacking enemy for 6s.' },
            { desc: '25% chance to immobilize an attacking enemy for 10s.' },
        ],
    },
};

// Mirrors GameScene.js's evolutionDefs (id/weaponKey/weaponLabel/boostName/evolvedName/desc)
// as static data — the `effect` function isn't needed here since the INDEX menu only
// displays evolutions, it never applies them.
export const EVOLUTION_LIST = [
    { id: 'starved_chomp',   weaponKey: 'bite',         weaponLabel: 'Bite',            boostName: 'Hungry Forager',     evolvedName: 'Starved Chomp',   desc: 'Kills grant 2× XP instantly — no insect drop. More range & damage.' },
    { id: 'steel_slam',      weaponKey: 'tailslap',     weaponLabel: 'Tail Slap',       boostName: 'Hard Scales',        evolvedName: 'Steel Slam',      desc: 'Heavy arc — more damage, high knockback, immobilises for 500ms.' },
    { id: 'toxic_ocean',     weaponKey: 'poop',         weaponLabel: 'Poop',            boostName: 'Well Fed',           evolvedName: 'Toxic Ocean',     desc: 'Fires 3 toxic fields, bigger radius, slows enemies, drifts to crowds.' },
    { id: 'sunbaked_ambers', weaponKey: 'pebble',       weaponLabel: 'Pebble Flick',    boostName: 'Basking',            evolvedName: 'Sunbaked Ambers', desc: '30 ambers in a 360° ring every 8s — inflicts burn for 3.5s.' },
    { id: 'raging_roar',     weaponKey: 'hiss',         weaponLabel: 'Hiss',            boostName: 'Angry',              evolvedName: 'Raging Roar',     desc: 'Always-active 60° rotating cone — slows everything inside. Reverses direction every time an upgrade is claimed.' },
    { id: 'sticky_shot',     weaponKey: 'lick',         weaponLabel: 'Lick',            boostName: 'Vitamin Supplements',evolvedName: 'Sticky Shot',     desc: 'Fires 5 tongues at once every 1.5s — more damage, slows hit enemies.' },
    { id: 'acid_snake',      weaponKey: 'wormwhip',     weaponLabel: 'Worm Whip',       boostName: 'Venom',              evolvedName: 'Acid Snake',      desc: 'Both sides, 160° arc every 3.5s — poisons 6s, slows 2s.' },
    { id: 'bug_buster',      weaponKey: 'pupamines',    weaponLabel: 'Pupa Mines',      boostName: 'Bug Catcher',        evolvedName: 'Bug Buster',      desc: 'Sprays 8-12 mines lasting 45s — defeated enemies drop a Pupa Mine.' },
    { id: 'spike_shedder',   weaponKey: 'skinshed',     weaponLabel: 'Skin Shed',       boostName: 'Big Fangs',          evolvedName: 'Spike Shedder',   desc: 'Drops 3 spiky skins every 8s — far more damage, heals 1 HP per 10 kills.' },
    { id: 'shining_shells',  weaponKey: 'woodiebounce', weaponLabel: 'Woodie Bounce',   boostName: 'Shiny Scales',       evolvedName: 'Shining Shells',  desc: '3 fast-moving shells every 4s, unlimited ricochets 25s, auto-aim, kills explode.' },
    { id: 'dubia_defenders', weaponKey: 'dubiashields', weaponLabel: 'Dubia Shields',   boostName: 'Bug Bucket',         evolvedName: 'Dubia Defenders', desc: 'Shields spin faster — each fires a strong projectile every 5s; 5 hits on the same enemy triggers a small explosion.' },
    { id: 'flashclaw',       weaponKey: 'poisonclaw',   weaponLabel: 'Poison Claw',     boostName: 'Hunter Instinct',    evolvedName: 'Flashclaw',       desc: 'Double claw strike — immobilises 1s (10s cd per enemy), poisons 6s.' },
    { id: 'log_lob',         weaponKey: 'branchthrow',  weaponLabel: 'Branch Throw',    boostName: 'Aura Farming',       evolvedName: 'Log Lob',         desc: '2 logs rolling opposite ways — unbreakable 25s, high damage, knockback.' },
    { id: 'duststorm',       weaponKey: 'dustkick',     weaponLabel: 'Dust Kick',       boostName: 'Inflate',            evolvedName: 'Duststorm',       desc: 'Huge area — medium damage, slows all, immobilises nearest for 1.5s.' },
    { id: 'lucky_thrash',    weaponKey: 'scratch',      weaponLabel: 'Lucky Scratch',   boostName: 'Hyperactivity',      evolvedName: 'Lucky Thrash',    desc: 'Many scratches in a huge radius — greatly raises item drop chance + Fullbox.' },
    { id: 'four_chills',     weaponKey: 'coldglare',    weaponLabel: 'Cold Glare',      boostName: 'Polycephaly',        evolvedName: 'Four Chills',     desc: 'Huge ring — slows all 8s, immobilises closest 8s, heavy damage tapering with distance.' },
];

// Every enemy/boss texture key that can appear in-game (matches BootScene.js's preload
// list exactly), tagged with its display name, the level it's originally from (enemies
// reused as "droppers" in Level 5 still list their home level, not every level they
// appear in), and whether it's a boss. Order matches each level's intro sequence.
//
// `scale` (non-boss entries only) is each enemy's original, pre-2x in-game visual scale
// (its value from wherever it first appears, by level order) — kept intentionally frozen
// here so the INDEX preview's relative sizing (see LevelSelectScene.js's zoom view) stays
// exactly as it always has, independent of any future in-game enemy-size rebalance.
export const ENEMY_LIST = [
    // Level 1 — Lettuce & Basil
    { key: 'lettuce_small', label: 'Lettuce', level: 1, isBoss: false, scale: 0.50 },
    { key: 'basil_small',   label: 'Basil',   level: 1, isBoss: false, scale: 0.50 },
    { key: 'lettuce_hopper',  label: 'Lettuce Hopper',  level: 1, isBoss: false, scale: 0.70 },
    { key: 'lettuce_shooter', label: 'Lettuce Shooter', level: 1, isBoss: false, scale: 0.50 },
    { key: 'basil_propeller', label: 'Basil Propeller', level: 1, isBoss: false, scale: 0.50 },
    { key: 'lettuce_beetle',  label: 'Lettuce Beetle',  level: 1, isBoss: true  },

    // Level 2 — Rocket & Oregano
    { key: 'rocket_small',  label: 'Rocket',  level: 2, isBoss: false, scale: 0.50 },
    { key: 'oregano_skunk', label: 'Oregano Skunk', level: 2, isBoss: false, scale: 0.56 },
    { key: 'rocket_knife',  label: 'Rocket Knife',  level: 2, isBoss: false, scale: 0.50 },
    { key: 'oregano_ghost', label: 'Oregano Ghost', level: 2, isBoss: false, scale: 0.60 },
    { key: 'oregano_fan',   label: 'Oregano Fan',   level: 2, isBoss: false, scale: 0.50 },
    { key: 'rocket_sword',  label: 'Rocket Sword',  level: 2, isBoss: false, scale: 0.50 },
    { key: 'rocket_spider', label: 'Rocket Spider', level: 2, isBoss: true  },

    // Level 3 — Coriander & Carrot
    { key: 'coriander_small', label: 'Coriander', level: 3, isBoss: false, scale: 0.50 },
    { key: 'coriander_whip',  label: 'Coriander Whip',  level: 3, isBoss: false, scale: 0.56 },
    { key: 'carrot_mole',     label: 'Carrot Mole',     level: 3, isBoss: false, scale: 0.52 },
    { key: 'coriander_hydra', label: 'Coriander Hydra', level: 3, isBoss: false, scale: 0.64 },
    { key: 'carrot_dart',     label: 'Carrot Dart',     level: 3, isBoss: false, scale: 0.53 },
    { key: 'carrot_wheel',    label: 'Carrot Wheel',    level: 3, isBoss: false, scale: 0.36 },
    { key: 'carrot_thug',     label: 'Carrot Thug',     level: 3, isBoss: false, scale: 0.60 },
    { key: 'carrot_scorpion', label: 'Carrot Scorpion', level: 3, isBoss: true  },

    // Level 4 — Spinach & Mulberry
    { key: 'spinach_medium',  label: 'Spinach',  level: 4, isBoss: false, scale: 0.50 },
    { key: 'spinach_small',   label: 'Small Spinach',   level: 4, isBoss: false, scale: 0.44 },
    { key: 'mulberry_bat',    label: 'Mulberry Bat',    level: 4, isBoss: false, scale: 0.54 },
    { key: 'mulberry_snake',  label: 'Mulberry Snake',  level: 4, isBoss: false, scale: 0.56 },
    { key: 'spinach_cyclone', label: 'Spinach Cyclone', level: 4, isBoss: false, scale: 0.60 },
    { key: 'mulberry_mantis', label: 'Mulberry Mantis', level: 4, isBoss: true  },

    // Level 5 — The Garden
    { key: 'lettuce_trap',          label: 'Lettuce Trap',          level: 5, isBoss: false, scale: 0.56 },
    { key: 'basil_bomb',            label: 'Basil Bomb',            level: 5, isBoss: false, scale: 0.50 },
    { key: 'rocket_bustersword',    label: 'Rocket Buster Sword',   level: 5, isBoss: false, scale: 0.70 },
    { key: 'oregano_phantom',       label: 'Oregano Phantom',       level: 5, isBoss: false, scale: 0.70 },
    { key: 'coriander_carrot',      label: 'Coriander Carrot',      level: 5, isBoss: false, scale: 0.60 },
    { key: 'spinach_tempest',       label: 'Spinach Tempest',       level: 5, isBoss: false, scale: 0.80 },
    { key: 'mulberry_monstrosity',  label: 'Mulberry Monstrosity',  level: 5, isBoss: false, scale: 0.80 },
    { key: 'yun_hand',              label: 'The Hand',              level: 5, isBoss: true  },
];
