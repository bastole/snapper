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

### Evolutions menu — requirements popup
- Clicking a locked (unavailable) evolution card now shows a requirements popup
- Each requirement shows a green ✓ if already met, or a red ✗ with your current level vs what's needed (e.g. `✗ Bite ×4 — you have ×2`)
- Click anywhere to dismiss the popup

### Fullbox off-screen arrow
- Fullbox items now have a pink off-screen arrow (matching the item's pink colour)
- Treasure = gold arrow, Foodbox = red arrow, Fullbox = pink arrow

---

## Session 6 — 2026-07-07

### The Hand mini-bosses now use specialised AI
Previously, the 4 mini-bosses summoned during The Hand fight (Salad Bowl attack in phase 3, and the phase 4 respawn cycle) just walked straight at the player with no special attacks. Each now runs the same AI as its original level boss:
- **Lettuce Beetle mini** — charges at the player every 3.5s, identical telegraph + dash
- **Rocket Spider mini** — circle-strafes/wanders/chases (mode switches every 2–4s), leg slam every 5–10s (spawns 3 Rocket Swords); at 50% HP, speed boosts and spawns a ring of 5 Rocket Swords (scaled down from the original boss's 20)
- **Carrot Scorpion mini** — alternates chase/wander phases, claw swipe every 4s, stinger bury every 10–15s spawning 5 Carrot Moles + 3 Carrot Thugs (scaled down from 20+10)
- **Mulberry Mantis mini** — vanish → reappear → strike cycle identical to the original; at 10% HP heals to full and spawns a ring of 6 Spinach Cyclones (scaled down from 25), same phase-2 chase-run behaviour after enough cycles

Mini-bosses keep running their own AI even while The Hand itself is immobile (mid-slap, teleport, vacuum, etc.) — a bug caught during testing where the mini-boss update was accidentally gated behind The Hand's own immobility flag, fixed before landing.

Mulberry Mantis mini invulnerability while vanished is enforced via `canDamageEnemy` (new `mantisVanishing` check), matching how Carrot Mole invulnerability works while burrowed.

Verified directly in-browser via devtools by spawning all 4 mini-boss types and manually triggering each attack/phase function — confirmed correct enemy counts, state resets, and zero console errors.

---

## Session 7 — 2026-07-07

### Rerolls no longer have a cooldown
Removed the artificial 1-second delay between rerolls on the level-up screen — with banked rerolls you can now use them all back-to-back instantly instead of waiting a second between each click.

### Evolutions only require the weapon maxed
Previously an evolution needed both its weapon AND its paired boost fully upgraded. Now only the weapon needs to be maxed — the boost pairing is just a thematic suggestion, shown in the evolution menu as "Requires: Weapon maxed". The locked-card requirements popup now shows a single weapon line instead of two.

### "Current/max" displays everywhere
- Pause menu loadout and the level-up loadout panel now show `Bite (3/4)` instead of `Bite ×3`, for both weapons and boosts.
- Level-up cards now show what the pick would become if acquired — e.g. the very first Bite upgrade card reads `Bite (2/4)`, and a first-time Hiss unlock reads `Hiss (1/2)`.
- Added canonical `weaponMaxLevel`/`boostMaxLevel` tables plus `getWeaponLevel`/`getBoostLevel`/`weaponCardLabel`/`boostCardLabel` helpers so every display pulls from one source of truth instead of duplicated max-level maps.

### Hyperactivity description fix
The second Hyperactivity pick's description used to also preview its third (fully-upgraded) tier ("→ fully upgrade to 12 kills..."). That preview is removed — each card now only describes what picking it does, since the next tier's card shows its own info when offered.

### Bugs fixed along the way
- **Cold Glare max was off by one** — its max level was listed as 6 but the actual formula (1 unlock + 3 cooldown upgrades + 3 slow upgrades) reaches 7. Would have shown a broken `7/6` once the new fraction displays landed, so corrected to 7.
- **Passive boost caps weren't actually enforced** — boost `available()` gates (e.g. Angry capped at ×5) were defined but never checked when building the level-up card pool, only weapons were filtered. Capped boosts could theoretically keep appearing past their max forever. Fixed so passives are filtered the same way weapons are.

Verified directly in-browser via devtools: rapid-fired 5 reroll clicks with no delay between them, confirmed evolution availability with an unmaxed/unowned boost, read back rendered card/pause text to confirm exact fraction formatting at every tier, and confirmed a maxed boost's `available()` check now correctly returns false. Zero console errors throughout.

---

## Session 8 — 2026-07-07

### Transmutational Scratch → Lucky Scratch (and Trans. Thrash → Lucky Thrash)
Renamed the weapon and its evolution everywhere: evolution definition (id, weaponLabel, evolvedName), the level-up card, the pause/loadout display, and the internal function names (`doTransmutationalScratch` → `doLuckyScratch`, `doTransmutationalThrash` → `doLuckyThrash`, `evolveToTransmutationalThrash` → `evolveToLuckyThrash`). Internal state keys (`scratchLevel`, `scratchTimer`, `ownedWeapons` key `'scratch'`/`'thrash'`) were left as-is since they're not player-facing.

### Hyperactivity rebalanced
Speed buff halved and kill requirement doubled at every tier:
- Tier 1: 35 kills → 70 kills, +50px/s → +25px/s
- Tier 2: 20 kills → 40 kills, +100px/s → +50px/s
- Tier 3: 12 kills → 24 kills, +150px/s → +75px/s

Durations (5s/12s/20s) unchanged. Descriptions updated to match.

### Bug fixed: Hyperactivity tier 2 was giving tier 3's effect
The kill-handler only special-cased level 1 (`level === 1 ? 50 : 150`), so tier 2 and tier 3 silently gave the *same* speed boost and duration even though their descriptions promised different numbers — this is almost certainly why Hyperactivity "kept coming up" feeling like it did nothing new. Fixed to give each of the 3 tiers its own distinct boost/duration.

### All previously-uncapped boosts now have caps
Inflate, Basking, Polycephaly, and Venom had no `available` gate at all (unlike every other boost), meaning they could theoretically be picked forever past their documented max. Added `available` gates matching their existing `boostMaxLevel` entries (Inflate ×1, Basking ×5, Polycephaly ×4, Venom ×3), consistent with how every other capped boost already works.

### Title screen prompt text changed
"PRESS ANY KEY, CLICK, OR 🎮 A TO START" → "PRESS ANY BUTTON TO BEGIN".

### Bug fixed: evolved weapons showed no fraction in the loadout, breaking display consistency
This was the cause of "only some of the upgrades show a 1/3 next to the name" — evolved weapons (Starved Chomp, Steel Slam, etc.) pushed into the loadout line with just their bare name while every other weapon/boost showed a `(cur/max)` fraction, since an evolved weapon has no further levels to show. Fixed by tagging every evolved weapon with `(MAX)` instead, so the loadout line is now consistently `Name (cur/max)` or `Name (MAX)` for every entry, never bare.

Verified directly in-browser via devtools: dumped the full 31/27-card upgrade pool before/after maxing the 4 previously-uncapped boosts to confirm they now drop out, killed real enemies at all 3 Hyperactivity tiers to confirm distinct speed boosts (25/50/75), ran the Lucky Scratch → Lucky Thrash evolution end-to-end to confirm the weapon swap and retimed callback, and read back the loadout text with both an evolved and non-evolved weapon present to confirm the `(MAX)` fix. Zero console errors throughout.

---

## Session 9 — 2026-07-07

### Bug fixed: opening EVOLUTIONS from the pause menu also unpaused the game
The pause menu has three global "any input resumes" listeners (keyboard, mouse, gamepad) so that pressing almost anything while paused resumes play. Clicking the EVOLUTIONS button fired its own handler (open the menu) *and* the global pointerdown handler (resume) for the same click, leaving physics running underneath the evolutions overlay. Fixed with an `_evoMenuOpen` flag that the three global handlers now check before resuming. Every way of closing the evolutions menu (CLOSE button, ESC, picking an evolution, or the new gamepad B) now consistently drops you back to the paused pause-screen rather than resuming — the flag clears one frame after closing so the same click/press that closed the menu can't also fall through to the resume handlers.

### EVOLUTIONS menu now accessible via gamepad
Pressing **X** while paused opens the EVOLUTIONS menu (only when at least one evolution is available, same as the mouse button). Pressing **B** closes it, matching this project's existing "B = back" convention from the level-select screen. Added an on-screen "🎮 B Close" hint.

Verified directly in-browser via devtools: simulated the EVOLUTIONS button click together with the global pointerdown handler firing for the same event and confirmed the game stayed paused; simulated closing via the CLOSE button the same way and confirmed it returns to the paused screen (not resumed) both immediately and one frame later; simulated gamepad X-open and B-close directly through the input plugin and confirmed the same pause-preserving behavior. Zero console errors throughout.

---

## Session 10 — 2026-07-07

### EVOLUTIONS menu is now always openable
Previously the pause menu's EVOLUTIONS button was only clickable (and the gamepad X shortcut only worked) when at least one evolution was ready. Now the button and the X shortcut always open the menu, so players can browse locked evolutions and see requirements at any time. The button still stays dark/dormant (`#444444`, no glow) whenever nothing is available — only its appearance is gated, not access.

### The "⏸ PAUSE" button now flashes gold when an evolution is ready
Added `updatePauseBtnGlow()`, which starts the same gold flash tween used on the in-pause EVOLUTIONS button whenever `getAvailableEvolutions()` is non-empty, and stops it (back to plain white) when nothing is available. It's called after every upgrade pick and after applying an evolution, so players get a signal mid-run without needing to open pause first. The button's hover handlers now respect the glow state (hovering away returns to gold instead of resetting to white while an evolution is still pending).

Verified directly in-browser via devtools: confirmed the EVOLUTIONS button is clickable and opens a fully-locked menu with zero evolutions available; picked a real upgrade card that maxes a weapon and confirmed the pause button immediately starts glowing gold; applied the resulting evolution through the menu and confirmed the glow correctly turns back off. Zero console errors throughout.

---

## Session 11 — 2026-07-07

### EVOLUTIONS menu is now scrollable
With 16 evolutions in a 3-column grid, the list overflowed the 450px-tall screen and the bottom rows were unreachable. Added a scrollable viewport (between the title and the CLOSE button):
- A draggable gold tab on the far-right edge, sized proportionally to how much content overflows (like a normal scrollbar thumb) — only appears when there's actually something to scroll.
- **Right stick** scrolls continuously while the menu is open, scaled by frame delta.
- The "🎮 B Close" hint gains a "• RS Scroll" suffix only when scrolling is relevant.
- Locked-card requirement popups now account for the current scroll offset when positioning themselves, instead of using each card's original unscrolled position.

Scrolling is driven by directly repositioning each card's game objects (`y = baseY - scrollY`) rather than a Phaser Container+mask, since the scroll range is clamped so content never scrolls past the title or CLOSE button — no masking needed to avoid stray clickable/visible overlap.

The existing `_evoMenuOpen` pause-guard (from Session 9) already covers the new drag/scroll interactions for free, since dragging the tab starts with the same kind of pointerdown event the guard already intercepts, and right-stick movement never fires the gamepad "down"/pointer events the resume handlers listen for in the first place.

Verified directly in-browser via devtools: dragged the tab to the bottom of the track and confirmed the last row (Four Chills) became visible and the tab landed exactly at the track's bottom edge; simulated a full-deflection right-stick input and confirmed the tab scrolled back up; confirmed the scroll-update listener is properly removed when the menu closes; confirmed the game stayed paused throughout every drag/scroll interaction; and confirmed a locked-card popup opened at the correct on-screen position after scrolling. Zero console errors throughout.

---

## Session 12 — 2026-07-07

### Phase bosses now use one continuous health bar with divider lines instead of resetting to full
Mulberry Mantis (level 4 boss + its Hand-fight mini-boss) and The Hand (level 5) used to snap their health bar back to 100% every time a phase transition triggered at 10% HP, making it look like a fresh new bar each phase. Replaced with a single bar sized to cover every phase's health up front, with thin vertical white lines marking exactly where each phase transition occurs — the bar just drains straight through the marks now instead of jumping back up.

Added `computePhasedHealth(baseHealth, phaseCount)`: each non-final phase historically ended once 90% of its own health pool was dealt (then reset to full), and the final phase drains all the way to 0 — so the new total is `0.9×base` per non-final phase plus one full `base` for the last, which nets out to the *same total damage-to-kill* as before (e.g. Mulberry Mantis 8000 → 15200 total with a divider at the 8000 mark; The Hand 10000 → 37000 total with dividers at 28000/19000/10000).

`damageBoss()` and the mini-Mantis AI no longer reset `health` back to `maxHealth` at each transition — they just compare against the next entry in `boss.phaseBoundaries` and trigger the same phase-transition behavior (ring spawns, `triggerHandNextPhase()`, etc.) without touching health. Divider lines are created once at spawn (`createBossPhaseLines()`), repositioned every frame alongside the existing bar-follow logic on both the world-space and top-screen bars, hidden/shown in sync with Mantis's vanish/reappear, and cleaned up in `killBoss()`/`killEnemy()`.

Verified directly in-browser via devtools: spawned the real Mulberry Mantis and The Hand and confirmed `maxHealth`/`phaseBoundaries` match the expected totals (15200/[8000] and 37000/[28000,19000,10000]); confirmed the divider line's on-screen x-position matches the math exactly; drove damage across every phase boundary for both bosses and confirmed health keeps draining continuously (no jump back to full) while the phase/mantisPhase/handPhase state still advances correctly; confirmed both bosses still die cleanly when drained to 0; and confirmed the mini-Mantis in the Hand fight behaves identically, including its own divider line tracking and cleanup on death. Zero console errors throughout.

---

## Session 13 — 2026-07-07

### Pause menu: EVOLUTIONS and QUIT TO MAIN MENU moved side by side
Previously stacked as two separate rows below the Boosts line, they could get overlapped by the Boosts text once it wrapped to multiple lines with a big loadout. Now they sit on one row, laid out side by side and centred as a pair using their actual rendered widths (so they never overlap each other regardless of font metrics), and that row's y-position is derived from the Boosts line's real rendered height (`pauseBoostLine.y + pauseBoostLine.height + 20`, clamped to the screen) instead of a fixed offset — so it always sits just below the Boosts text no matter how many lines that wraps to.

Verified directly in-browser via devtools: tested with a maxed-out loadout (all 15 weapons + all 16 boosts, wrapping the Boosts line to 3 lines) and confirmed a positive gap between the Boosts text and the button row with no overlap; confirmed the two buttons never overlap each other; confirmed both a fresh minimal loadout and the maxed-out one look correct via screenshot; confirmed both EVOLUTIONS and QUIT TO MAIN MENU still work. Zero console errors throughout.

---

## Session 14 — 2026-07-07

### The Hand's health halved per phase
Changed its base health from 10000 to 5000 (the `computePhasedHealth` input), which halves every phase segment uniformly — new total 18500 (down from 37000) with dividers at 14000/9500/5000.

### Bug fixed: the vacuum supermove didn't actually pull anything
`doHandVacuum()` called `physics.moveTo(enemy, boss, 600)` exactly once when the vacuum started, but every enemy's own movement AI runs every frame afterward (`attractCrickets()` for regular enemies, the mini-boss AI dispatch for Hand-fight minis) and immediately overwrote that velocity on the very next frame. So nothing visibly moved for the whole duration — enemies just behaved normally until the timer fired and killed everyone in one instant burst, which is exactly what was reported ("doesn't vacuum anything, just instantly wipes everything").

Fixed by re-applying the pull velocity every single frame for the whole vacuum window, via a new `this.handVacuumActive` flag checked inside `updateHandAI()` (which already runs after both `attractCrickets()` and the mini-boss AI dispatch each frame, so it correctly wins the last word on velocity for that frame regardless of what any individual enemy's own AI wanted to do).

### Vacuum duration reduced to 4000ms
Down from 10000ms.

### Map slowly reddens during the vacuum
Added a full-screen red overlay (`scrollFactor(0)`, above the world but below UI) that fades in from alpha 0 to 0.35 linearly across the vacuum's duration, then fades back out once it resolves. Tracked via `this.handVacuumOverlay` and cleaned up both in the normal resolution path and in `killBoss()` in case the boss dies mid-vacuum.

### Upgrade descriptions no longer show raw px/s
Hyperactivity's three tiers used to read "+25px/s", "+50px/s", "+75px/s" — replaced with "move faster", "move much faster", "move very fast" respectively. Also reworded the Shining Shells evolution's "300px/s" flavor text to "fast-moving shells".

Verified directly in-browser via devtools: confirmed The Hand's new `maxHealth`/`phaseBoundaries` (18500/[14000,9500,5000]); proved the vacuum fix directly by manually stomping a mini-boss's velocity mid-vacuum and confirming `updateHandAI()` immediately re-asserts the pull toward the boss (previously the stomped velocity would have stuck); confirmed the red overlay starts at alpha 0 and ramps toward 0.35; pulled a live Hyperactivity card at all 3 tiers and confirmed the new wording; confirmed the Shining Shells evolution text no longer mentions px/s. Zero console errors throughout.

### New phase-4 attack: 10-projectile ring
Every 5s during phase 4, a 1/4 chance to fire a ring of 10 projectiles outward from the boss (evenly spaced, 15 damage each, 5s lifetime) — a lighter, more frequent attack layered alongside the existing phase-4 set-pieces (the two-ring 30-projectile volley, the vacuum, the mini-boss respawn checks). New `handProjTimer` cleaned up in `killBoss()` alongside the others.

Verified directly in-browser via devtools: confirmed the timer is created with the right delay/loop settings when phase 4 triggers; called the fire function directly and confirmed exactly 10 projectiles spawn, evenly spaced in a full circle (velocity magnitude ~220 each) with 15 damage; mocked `Math.random()` to force both the success and failure paths of the 1/4 roll and confirmed it fires exactly 10 projectiles on success and zero on failure; confirmed the timer is properly removed when the boss dies. Zero console errors throughout.

---

## Session 15 — 2026-07-07

### Boss name (on the top bar, above where the XP bar used to be) is now purple
Was plain white.

### The Hand gets 20% faster with every phase
Added `getHandSpeedMultiplier()` — `1.2^(handPhase-1)`, so phase 1 is baseline, phase 2 is ×1.2, phase 3 ×1.44, phase 4 ×1.728. Applied to its regular wander speed (200 base) and the tweezers-charge dash speed (420 base).

### The Hand freezes and trembles for 3s after every phase transition
Previously the next phase's behavior (teleport scheduling, ring scheduling, the phase-4 vacuum/projectiles, etc.) kicked off immediately when a phase boundary was crossed. Now `triggerHandNextPhase()` immobilizes the boss, jitters its position by ±3px every 40ms (a violent trembling in place, no real movement) for 3 seconds, restores its exact position, and only then starts the new phase's behavior — giving the transition a distinct "recovering" beat instead of instantly resuming full aggression.

Verified directly in-browser via devtools: confirmed the top boss label renders in `#bb66ff`; confirmed the speed multiplier compounds correctly across all 4 phases (1, 1.2, 1.44, 1.728) and that both the wander velocity and the tweezers-charge velocity scale by the expected exact amounts at a given phase; confirmed `handImmobile` flips true the instant a phase transition starts, and that the new phase's behavior (e.g. `handTeleportTimer` for phase 2) only appears after the freeze resolves, with `handImmobile` back to false and `handPhaseTransitioned` correctly reset at that point. Zero console errors throughout.

### Bug fixed: boss name on the top bar was rendered behind the phase divider lines
The top-bar phase divider lines were added at depth 103, one higher than the boss name label's depth 102 — so the lines rendered on top of (through) the text, hurting readability right where a divider happened to cross a letter. Bumped the label to depth 104 so it always renders above the lines. The world-space label above the boss sprite didn't have this problem (it sits ~65px above where its divider line is drawn), so only the top-bar label needed the fix.

Verified directly in-browser via devtools: confirmed the top boss label's depth (104) is now above all of its phase divider lines' depth (103); confirmed via screenshot that "THE HAND" renders cleanly on top of both divider lines on the top bar. Zero console errors throughout.

### Boss name and phase divider line colours swapped
The boss name label (top bar) is now white (`#ffffff`); the phase divider lines (both the top bar and the world-space bar above the boss) are now purple (`0xbb66ff`) — the reverse of what they were.

---

## Session 16 — 2026-07-07

### Vacuum supermove made more perceptible
Health-halving and the vacuum's continuous pull-every-frame fix were already in place from Session 14 — verified both directly in-browser this session (The Hand's `maxHealth`/`phaseBoundaries` already reflect the halved 5000 base, and instrumented timing confirmed the pull genuinely re-asserts every frame and the kill fires exactly at the configured duration, not early). But the user reported it still *feels* instant during real play, and the numbers explain why: a 4-second window plus a fast 600px/s pull means anything already close to the boss (the common case — bosses and minis both cluster near the player) snaps in almost immediately, leaving a long dead pause before the payoff, and the red tint topped out at only 0.35 alpha against a dark green background.

Strengthened both:
- Vacuum duration 4000ms → 6500ms, giving the pull more time to actually read as dragging things in rather than snapping them.
- Red overlay max alpha 0.35 → 0.55 (confirmed via screenshot at both low and peak alpha — genuinely hard to miss at 0.55).
- The Hand's own warning flash was previously just a brief 600ms blip at the very start; it now pulses continuously for the entire build-up (stopped and alpha reset to 1 when the vacuum resolves), so the boss visibly reads as "channeling" the whole time instead of flashing once and going quiet.

Verified directly in-browser via devtools: instrumented `killEnemy`/`physics.moveTo` calls to confirm timing precisely (ruled out an earlier false alarm caused by the test player dying mid-test, which freezes `time.paused` independently of the pause menu and was corrupting the readings); used a 10×-slowed timer/tween harness to safely inspect the visual mid-ramp without racing real time, confirming a mini-boss gets pulled from 500px away down to ~15px and the red overlay is barely visible early on but unmistakably red by the end. Zero console errors throughout.

Verified directly in-browser via devtools and screenshot: confirmed the label's style color and both line arrays' fill colors after the swap; visually confirmed "THE HAND" reads in white with purple dividers on both bars. Zero console errors throughout.

---

## Session 17 — 2026-07-07

### Vacuum supermove: blast radius halved, buildup set to exactly 5 seconds
Explosion radius 1500 → 750 (both the visual circle and the player-hit-detection radius now share one `BLAST_RADIUS` constant instead of the value being repeated). Vacuum buildup duration set to 5000ms (was 6500ms from last session's tuning).

Verified directly in-browser via devtools: instrumented the vacuum's own `delayedCall` and confirmed it fires at 5020ms elapsed (essentially exact); intercepted `Graphics.fillCircle` to confirm the explosion is actually drawn at radius 750. Zero console errors throughout.
