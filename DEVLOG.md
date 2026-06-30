# Salad Slayer: Snapper – Dev Log

---

## Session 1 — 2026-06-29

### What we set up
- Created the game design document (`Salad Slayer - Snapper Leaf No Survivors.md`) covering all 5 levels, enemies, bosses, weapons, and passives
- Initialised the GitHub repo (`bastole/snapper`) and pushed everything
- Hosting target: **Netlify** (not yet deployed)
- Engine: **Phaser 3.88.2** (downloaded locally to `lib/phaser.min.js`)
- Language: **Vanilla JavaScript**, no TypeScript, no build tools

### Placeholder assets
- Generated **36 PNG sprite sheets** using PowerShell + System.Drawing
- Stored in `assets/sprites/player/`, `assets/sprites/enemies/`, `assets/sprites/bosses/`, `assets/sprites/items/`
- Colour coding: Blue = Player, Red = Enemies, Purple = Bosses, Yellow = Items
- All characters scaled to **25%** in-game (128px sprites → 32px on screen)

### Project skeleton
Created the full scene structure:
- `src/main.js` — Phaser game config (800×450, arcade physics, FIT scaling)
- `src/scenes/BootScene.js` — preloads all 36 assets as sprite sheets
- `src/scenes/TitleScene.js` — title screen with blinking "Press to Start"
- `src/scenes/LevelSelectScene.js` — 5 levels, only Level 1 unlocked
- `src/scenes/GameScene.js` — main gameplay (see below)
- `src/scenes/GameOverScene.js` — Retry and Main Menu buttons

---

### Gameplay loop built (all in GameScene.js)

#### Movement
- WASD + Arrow keys
- Diagonal normalised so player doesn't move faster at 45°
- Sprite flips horizontally based on direction
- Camera follows player across a 3200×3200 world

#### Enemy spawning
- Enemies spawn off the edges of the camera view
- Spawn rate starts at **2500ms**, ramps down every 10 seconds, caps at **400ms**
- Enemies have **collision with each other** so they don't pile up
- Enemies introduced gradually by time elapsed:
  - 0:00 – 2:00 → Iceberg Lettuce, Basil
  - 2:00 – 5:00 → + Lettuce Hopper
  - 5:00 – 8:00 → + Lettuce Shooter
  - 8:00 – 10:00 → + Basil Propeller

#### Level 1 enemies and stats
| Enemy | Health | Speed | Special |
|---|---|---|---|
| Iceberg Lettuce | 15 | 60 | — |
| Basil | 25 | 60 | — |
| Lettuce Hopper | 60 | 45 | Splits into 2 Iceberg Lettuces on death |
| Lettuce Shooter | 90 | 0 (stationary) | Fires projectiles at player every 3s |
| Basil Propeller | 120 | 180 | Very fast |

#### Weapons
All weapons fire automatically on timers. Visual effect always shows even if no enemies are nearby.

| Weapon | Damage | Rate | Notes |
|---|---|---|---|
| Bite | 20 | 3s | Circle AOE around Snapper, always active |
| Tail Slap | 25 | 4s | Arc in a random direction, upgrades to 180° |
| Poop | 30 | 4s | Projectile fired in a random direction |
| Pebble Flick | 15 | 8s | 3 piercing pebbles toward nearest enemy |

#### Cricket drops & XP
- Enemies drop a cricket on death
- Crickets must be **walked over** to collect (absorb range = 32px, same as player size)
- Collecting crickets fills the XP bar; levelling up opens the upgrade screen

#### Level-up screen
- Game pauses, 3 random cards offered
- **Orange cards** = new weapons (only offered if not yet owned, or upgrades if already unlocked)
- **Blue cards** = passive boosts
- Available weapons at level-up: Tail Slap, Tail Slap+, Poop, Pebble Flick, Pebble Flick+

#### Passive boosts
| Boost | Effect |
|---|---|
| Angry | +30 movement speed |
| Aura Farming | +10 damage to Bite, Tail Slap, Poop, Pebble Flick |
| Hunter Instinct | +25 range to Bite and Tail Slap (Poop/Pebble have no range) |
| Basking | −150ms delay on all active weapons (min 300ms each) |
| Bug Bucket | +25 max HP |
| Well Fed | Speeds passive regen from 1HP/20s → 1HP/10s |
| Hungry Forager | +80 cricket magnet range |
| Hard Scales | Reduces enemy damage |

#### Health & regen
- Passive regen always active: **1 HP every 20 seconds**
- Well Fed upgrade speeds it to **1 HP every 10 seconds**
- Enemies deal damage on contact with a 1-second cooldown per enemy

#### Boss — Lettuce Beetle
- Spawns when the 10-minute timer hits zero
- Regular spawning stops permanently when the boss appears
- **8000 HP** with a floating health bar and name label below the sprite
- Slowly walks toward player; charges at high speed every 3.5s (flashes as warning)
- All weapons (Bite, Tail Slap, Poop, Pebble Flick) damage the boss
- On death: **Level Clear screen** with Continue and Main Menu buttons

#### UI
- XP bar (top, green)
- HP bar (top, red)
- Timer (top centre) — shows "BOSS" once boss spawns
- Level indicator (top right)
- **⏸ PAUSE button** (top right, below level) — also triggered by ESC key

---

### What's not built yet
- Levels 2–5 (enemies, bosses, world themes)
- Remaining weapons: Worm Whip, Hiss, Lick, Pupa Mines, Skin Shed, Woodie Bounce
- Mobile virtual joystick
- Sound effects and music
- Real sprite art (placeholder PNGs only)
- Netlify deployment
- Level unlock persistence (currently always unlocked only Level 1)
- Boss phase 2 behaviours (Lettuce Beetle only has the charge)

---

### Repo
- **GitHub**: https://github.com/bastole/snapper
- **Branch**: master
- **Last commit**: Aura Farming now boosts all weapon damage

---

## Session 2 — 2026-06-30

### New weapon — Dubia Shields
- Big amber circles orbit the player, damaging anything they touch (20 dmg base, 800ms cooldown per enemy)
- **Level 1**: 2 shields, single ring at 90px radius, 1.2 rad/s
- **Level 2**: 3 shields, 1.6 rad/s
- **Level 3**: 4 shields, 2.0 rad/s
- **Level 4 (final)**: two layers — 4 inner shields at 70px + 5 outer shields at 120px, rotating in opposite directions
- Boosted by Aura Farming (+10 dmg per pick)

### Level 3 — Coriander & Carrot (completed previous session, documented here)
Full enemy set implemented with all special behaviours:
| Enemy | HP | Dmg | Speed | Intro | Special |
|---|---|---|---|---|---|
| Coriander | 30 | 10 | 72 | 0:00 | — |
| Coriander Whip | 60 | 14 | 55 | 2:30 | Lash attack within 56px every 1–2s |
| Carrot Mole | 75 | 12 | 60 | 4:00 | Burrows 3–10s surfaced / 3–5s underground (invulnerable) |
| Coriander Hydra | 220 | 13 | 38 | 7:00 | Loses head at 2/3 and 1/3 HP |
| Carrot Dart | 40 | 17 | 145 | 8:00 | Random scale 0.18–0.35; telegraphed charge; splits into 2 Carrot Wheels |
| Carrot Wheel | 22 | 9 | 130 | 8:00 | Inherits 60% of dart's scale |
| Carrot Thug | 300 | 15 | 180 | Scorpion only | Spawned by boss stinger bury |

Boss — **Carrot Scorpion** (18000 HP):
- Two-phase AI: **chase** (3–8s at 220px/s) → **pathfinding** (15–25s, wanders to random points near player)
- Claw swipe every 4s
- Stinger bury every 10–15s: spawns 20 Carrot Moles + 10 Carrot Thugs shuffled over 6s

### Level 4 — Spinach & Mulberry
Full enemy set implemented:
| Enemy | HP | Dmg | Speed | Intro | Special |
|---|---|---|---|---|---|
| Spinach | 35 | 11 | 68 | 0:00 | — |
| Small Spinach | 18 | 5 | 110 | 0:00 | Fast |
| Mulberry Bat | 50 | 13 | 200 | 2:30 | Very fast |
| Mulberry Snake | 95 | 15 | 48 | 5:00 | Spits mulberry projectiles every 5–15s; tail whip within 65px every 2–4s |
| Spinach Cyclone | 200 | 20 | 35 | 7:00 | Rare (20% chance per spawn tick); pathfinds to random on-screen points; spawns Small Spinach every 6–12s |

Drop table: Spinach/Small Spinach → Cricket, Mulberry Bat → Vitaworm, Mulberry Snake → Mealworm, Spinach Cyclone → Dragonfly

### Poop weapon rebalance
- Damage halved: 30 → 15
- Cooldown doubled: 4s → 8s
- Only appears in upgrade pool from player level 20 onwards

### Boss UI improvements
- When boss spawns: XP bar replaced by a full-width red boss health bar at the top of screen with boss name
- Purple off-screen arrow points to boss location when boss is off-screen (same style as Treasure/Foodbox arrows)
- When boss is defeated: bar empties and shows **BOSS DEFEATED** text (XP bar does not return)

### Debug keys
- **U** — trigger an upgrade screen immediately
- **N** — skip 60s of game time (spawn rate ramps accordingly)
- **F** — spawn boss immediately + scatter 20 Foodboxes across the map + open 29 consecutive upgrade screens with no countdown between picks

### What's still not built
- Level 5 — The Garden (enemies + The Hand boss)
- Mulberry Mantis boss (Level 4 boss — AI not yet implemented)
- Mobile virtual joystick
- Sound effects and music
- Real sprite art (placeholder PNGs only)
- Netlify deployment
