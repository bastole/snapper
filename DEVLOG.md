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

### Xbox controller support
Full gamepad support added across all scenes:
- **Title screen** — press A to start (750ms input cooldown so previous-scene events don't bleed through)
- **Level select** — d-pad or left stick up/down to navigate, A to confirm, B to go back to title
- **In-game movement** — left analog stick (with deadzone 0.15 and variable speed based on stick magnitude); d-pad as fallback
- **Pause** — Start button toggles pause; any button (except Start) resumes
- **Level-up screen** — LB/RB or d-pad left/right to browse cards, A to pick, Y to reroll
- **Death screen** — A = retry, Y = revive, B = main menu; d-pad up/down toggles selected button highlight
- **Game Over scene** — A = retry, B = menu

### Mulberry Mantis boss (Level 4)
Full two-phase AI implemented:
- **Phase 1**: Chases player at 210 px/s. Every 5–10s, vanishes for 3–5s, reappears 80px from the player, then strikes 400ms later for 25 damage. After each strike, immediately resumes chasing.
- **Phase 2 trigger**: At 10% HP, heals to full 1000 HP (total damage to kill = 1900), then enters phase 2.
- **Phase 2**: Drops chasing entirely — repeats vanish → reappear → strike cycle with no pause between cycles, and rests 2s after each strike before the next vanish. Simultaneously spawns a ring of 25 Spinach Cyclones at 900px radius around itself.
- Boss is invisible and un-hittable while vanished (`setActive(false)`, physics body disabled).

### GAME OVER death overlay
In-game death now shows an overlay instead of switching scenes, keeping all upgrades:
- **REVIVE** — revives player at current position but ≥4000px from all enemies; 3s of blinking invincibility; all upgrades and levels kept
- **RETRY** — restart the level from scratch
- **MAIN MENU** — return to level select
- All XP insects destroyed and pending level-ups cancelled when overlay appears
- Gamepad: A = retry, Y = revive, B = menu

### Pause system overhaul
- All timers freeze via `this.time.paused = true/false` instead of individual timer flags
- Pause is now **blocked** while in: pause menu itself (prevents double-toggle), level-up screen, 3-2-1 countdown, Level Clear screen, and Game Over overlay
- Enemy spawn timers are permanently removed (`.remove()` + null) when boss spawns, so `time.paused = false` can never resume them

### Boss fight drops
- XP insects stop spawning and existing ones despawn when boss appears
- Treasure drops also blocked during boss fight
- Foodboxes (wormboxes) still drop normally throughout boss fight

### Dubia Shields rebalance
- Shield size halved: radius 18 → 9, hit detection range 28 → 14
- 60% rarer after the first pick: base rarity stays the same; from level 2 onwards appears with flat 40% chance per level-up screen (not compounding)

### Mulberry Bat speed nerf
- Speed reduced from 200 → 140 px/s

---

## Session 4 — 2026-07-01

### New weapons
- **Poison Claw** — lunges a lizard arm at the nearest enemy. 4 upgrades: each increases range (80 → 110 → 140 → 170px) and poison duration (3s → 5s → 6s → 7s)
- **Branch Throw** — fires a wide bar sideways (perpendicular to enemy direction) every 6s. Breaks after 15 hits (30 after 3 upgrades). Despawns after 15s.
- **Dust Kick** — beam of dust behind the player (opposite movement direction) every 15s. Low damage, slows all hit enemies for 2s. 4 upgrades: longer beam, up to 10s slow.
- **Transmutational Scratch** — X-shaped scratch spawns around the player every 12s. Damaged enemies have a higher Foodbox drop chance. Upgrade adds Treasure drop bonus and bigger scratch mark.
- **Cold Glare** — freezes (slows to 15% speed) all enemies within 120px for 1s, every 30s. 3 cooldown upgrades (30s → 15s), then 3 slow-duration upgrades (1s → 10s). Description updates live to show current → next values.

### New boosts
- **Polycephaly** — 10% chance per pick (up to 40%) for any attack to fire twice. Uses a re-entrancy flag so the second fire can never trigger a third.
- **Venom** — 15% base chance (up to 45%) for attacks to poison enemies for 2s (+0.5s per upgrade). Poison ticks 3 dmg/500ms, green tint.
- **Vitamin Supplements** — increases Foodbox and Treasure drop chance from all enemies.

### Shiny Scales rework
- Now one-time only (can't stack): deflects 60% of enemy projectiles back at attackers
- Deflected projectiles deal damage to enemies instead of the player

### Upgrade display overhaul
- Removed `+` suffix from all upgraded weapons in the pause menu
- Weapons now show `×2`, `×3` etc. when levelled up (same style as boosts)
- All new weapons (Poison Claw, Branch Throw, Dust Kick, Transmutational Scratch, Cold Glare, Dubia Shields) now listed in the pause menu loadout

### Bug fixes
- **Basil Bomb chain crash** — killing Basil Bombs with the Inflate knockback passive caused infinite recursion (`inflateKnockback → killEnemy → inflateKnockback → ...`). Fixed with a re-entrancy guard (`_inInflateKnockback` flag) so inflate can't chain-trigger itself.
- **RETRY double-press** — death overlay RETRY previously went to GameOverScene which had its own RETRY, requiring two presses. Now goes directly to GameScene.
- **Boss HP bar overlap** — timer text at y=5 overlapped the boss bar at y=12. Timer now hides when boss spawns and restores after boss dies.
- **Level reset** — `bossSpawned` wasn't reset on scene restart, blocking XP and Treasure drops on replayed levels. Now resets all boss state in `create()`.
- **Mulberry Mantis mini-boss HP** — mini-boss inside The Hand fight had 100 HP instead of 4,000. Fixed.
- **Cold Glare description** — was a static string that never updated after unlock. Replaced with a computed IIFE showing the current value and what the next upgrade will change.
- **Transmutational Scratch tagging** — bonus drop chance was applying to any enemy that died near the scratch zone, not just enemies the scratch hit directly. Fixed by tagging hit enemies on contact.
- **Lettuce Trap movement** — trap was still moving toward player while dormant underground. Now frozen (`velocity 0,0`) until triggered.

### What's still not built
- Level 5 — The Garden (enemies + The Hand boss)
- Mobile virtual joystick
- Sound effects and music
- Real sprite art (placeholder PNGs only)
- Netlify deployment

---

## Session 5 — 2026-07-01

### Weapon evolutions — all 16 implemented

Both the weapon AND the matching boost must be fully maxed to unlock an evolution. Evolutions are applied via the EVOLUTIONS button in the pause menu (glows yellow when one is available).

| Evolution | Replaces | Requires boost |
|---|---|---|
| **Starved Chomp** | Bite ×4 | Hungry Forager ×4 |
| **Steel Slam** | Tail Slap ×2 | Hard Scales ×4 |
| **Toxic Ocean** | Poop ×2 | Well Fed ×3 |
| **Sunbaked Ambers** | Pebble Flick ×2 | Basking ×5 |
| **Raging Roar** | Hiss ×2 | Angry ×5 |
| **Sticky Shot** | Lick ×3 | Vitamin Supplements ×4 |
| **Acid Snake** | Worm Whip ×2 | Venom ×3 |
| **Bug Buster** | Pupa Mines ×3 | Bug Catcher ×3 |
| **Spike Shedder** | Skin Shed ×2 | Big Fangs ×4 |
| **Shining Shells** | Woodie Bounce ×3 | Shiny Scales ×2 |
| **Dubia Defenders** | Dubia Shields ×4 | Bug Bucket ×5 |
| **Flashclaw** | Poison Claw ×4 | Hunter Instinct ×5 |
| **Log Lob** | Branch Throw ×4 | Aura Farming ×5 |
| **Duststorm** | Dust Kick ×5 | Inflate ×1 |
| **Trans. Thrash** | Trans. Scratch ×3 | Hyperactivity ×3 |
| **Four Chills** | Cold Glare ×6 | Polycephaly ×4 |

### Evolution highlights
- **Starved Chomp** — kills grant 2× XP instantly (no cricket drop); floating `+N XP` text appears
- **Raging Roar** — always-active rotating 60° cone; runs in the update loop, no timer
- **Bug Buster** — enemies killed by the blast drop a collectible pupa mine item (not a live mine — no recursion)
- **Shining Shells** — unlimited ricochets for 25s; after each bounce, auto-aims at nearest enemy; kills trigger small explosions
- **Dubia Defenders** — shields spin 1.5× faster; each fires a projectile outward every 5s
- **Spike Shedder** — heals 1 HP per 10 enemies killed (global counter while active)
- **Trans. Thrash** — large multi-scratch with much higher Foodbox + Treasure + Fullbox drop chance; base Trans. Scratch can no longer trigger Fullbox drops
- **Four Chills** — huge 350px ring; slows all 8s, immobilises+halves HP of 8 closest (15s cooldown per enemy)

### Pause menu
- Evolved weapon names now show in the loadout text (e.g. "Starved Chomp" replaces "Bite ×4")
- Boost caps added for all evolution-relevant boosts (Angry ×5, Aura Farming ×5, Hunter Instinct ×5, Basking ×5, Bug Bucket ×5, Well Fed ×3, Hungry Forager ×4, Hard Scales ×4, Vitamin Supplements ×4)
