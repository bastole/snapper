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

---

## Session 18 — 2026-07-07

### Sound effects and BGM wired up
Pulled `assets/audio/audio_asset_guide.md` plus 20 `.wav` files (8 BGM, 12 SFX) from git and wired every one of them to its documented trigger. `ping.wav` is left unused, exactly as the guide says.

Added `src/audio.js` — a small shared module holding BGM state at module scope (Phaser's `this.sound` is the same global `SoundManager` singleton across every scene, so "don't restart the title track going Title→LevelSelect" and "only one BGM ever" need state that outlives any single scene):
- `playBgm(scene, key, volume)` — no-ops if the same key is already playing, otherwise stops+destroys the old track and starts the new one looped.
- `crossfadeBgm(scene, key, volume, duration)` — used only for the level→boss BGM transition the guide asks for; fades the old track out while fading the new one in.
- `stopBgm()` / `pauseBgm()` / `resumeBgm()` — stop-and-destroy vs. pause/resume (pause is used for the death overlay specifically, so reviving resumes the same track instead of restarting it).
- `playSfx(scene, key, volume)` — fire-and-forget `scene.sound.play()`, which always creates an independent overlappable instance per the guide's "SFX should overlap without interrupting each other."

**BGM hooked**: `bgm_title` on `TitleScene`/`LevelSelectScene` (same track, no restart between the two); `bgm_lv{level}` on entering a level; crossfade to `bgm_boss`/`bgm_finalboss` (level 5) when a boss actually becomes active, 2.8s after its warning banner; `stopBgm()` on level clear and on every path that leaves a level without reviving (RETRY, MAIN MENU from the death overlay, and the pause menu's QUIT TO MAIN MENU — the last two weren't explicitly listed in the guide but needed the same treatment, since BGM is only *paused* while the death overlay is up, and leaving without stopping it first would leak an orphaned, still-paused `Sound` object into the next scene).

**SFX hooked**: `boss_enters` (start of `spawnBoss()`), `pause` (entering the pause menu), `win`/`gameover` (level clear / death overlay), `upgrade_selected` (picking a level-up card), `level_selected` (choosing a level, both mouse and gamepad — not the ALL LEVELS debug toggle), `item_collect` (normal XP pickups and the Bug Buster pupa-mine drop), `item_heal` (Fullbox and Wormbox pickups specifically, as distinct from plain XP), `levelup` (all three places `playerLevel++` actually happens — normal XP overflow, Treasure pickup, and the Starved Chomp instant-kill overflow loop inside `killEnemy()`, which a naive read of the code could easily miss since it's not in the obvious `collectCricket()` spot), `player_hurt` (a single hook inside `playerDamageFlash()`, since that function already runs alongside essentially every place the player takes damage — 21 damage sites, 22 flash calls, already centralized before this session).

**`enemy_hurt` — the one with real scale**: found 34 separate inline `this.damageDealt += X; enemy.health -= X;` sites across every weapon function (base and evolved), no shared damage-application function to hook into. Added a one-line `playEnemyHurtSfx()` helper (deliberately quieter than other SFX, since AOE weapons can trigger it many times in one frame) and inserted a call after each of the 34 sites via a small Node script operating on exact line numbers (safer than 34 individual string-matching edits given how many of those lines are byte-for-byte identical, e.g. multiple `this.damageDealt += dmg; enemy.health -= dmg;`). Boss damage turned out to already run through one centralized function, `damageBoss()` — a single extra hook there covers every boss fight instead of needing its own scattered pass.

Confirmed `GameOverScene.js` is dead code (registered in `main.js`'s scene list but `this.scene.start('GameOverScene')` is never called anywhere — the in-scene `showDeathOverlay()` overlay replaced it) and left it untouched; wiring `gameover.wav` there would never fire.

Verified directly in-browser via devtools: confirmed all 19 expected keys loaded into `game.cache.audio` (and `ping` did not); re-ran the 34-site damage-line grep after the mechanical pass to confirm no line was altered or missed, and confirmed exactly 35 `playEnemyHurtSfx()` calls (34 + the `damageBoss` hook); drove the actual game flow end-to-end (Title → LevelSelect → a real level → damaging enemies and a boss → leveling up → pausing → a full boss-BGM crossfade → the death overlay → revive → RETRY/MAIN MENU/pause-quit) while inspecting `game.sound.sounds` directly at each step, confirming exactly one BGM `Sound` object ever exists, the right one is playing at the right volume, old tracks are genuinely stopped-and-destroyed (not leaked) on every scene transition, and the death overlay's pause/revive resumes the exact same track rather than restarting it. Zero console errors throughout.

---

## Session 19 — 2026-07-07

### Bug fixed: evolved weapons reverting back to their base form after picking Basking
Root cause: the **Basking** boost ("Snapper's attacks fire faster", pickable up to 5 times) speeds up every weapon by calling `.reset()` on each weapon's timer — but it hard-coded the callback to the *base* attack function every single time (e.g. `callback: this.doTailSlap`), regardless of whether that weapon had since been evolved. Since Basking is common and gets picked repeatedly over a run, evolving a weapon and then picking Basking again silently swapped Steel Slam back to plain Tail Slap, Toxic Ocean back to Poop, Sunbaked Ambers back to Pebble Flick, Sticky Shot back to Lick, Acid Snake back to Worm Whip, Bug Buster back to Pupa Mines, Spike Shedder back to Skin Shed, Shining Shells back to Woodie Bounce, Flashclaw back to Poison Claw, Log Lob back to Branch Throw, Duststorm back to Dust Kick, Lucky Thrash back to Lucky Scratch, and Starved Chomp back to plain Bite — exactly the "disappeared after some time, replaced with the old weapon" symptom. Fixed by having each of those thirteen `.reset()` calls pick the evolved callback when the evolved weapon key is present in `ownedWeapons`, falling back to the base callback otherwise.

Found and fixed a second, related bug while auditing every other place a weapon's `ownedWeapons` key is read: five "unlock this weapon" level-up cards (Tail Slap, Poop, Pebble Flick, Hiss, Cold Glare) gated their availability on `!ownedWeapons.has(baseKey)` — but evolving a weapon deletes that same base key (e.g. `evolveToSteelSlam()` does `ownedWeapons.delete('tailslap')`), so the plain "unlock Tail Slap" card could wrongly reappear in the level-up pool after evolving and, if picked, would create a brand-new timer pointed back at the base attack. Fixed by also requiring the evolved key to be absent (`!ownedWeapons.has('tailslap') && !ownedWeapons.has('steelslam')`, etc.). Also fixed `evolveToFourChills()`, which added `'fourchills'` to `ownedWeapons` but never deleted `'coldglare'` (every other evolve function deletes its base key) — harmless on its own since Cold Glare's own checks use the `coldGlareActive` flag rather than the `ownedWeapons` key, but fixed for consistency with the other 15 evolutions.

Verified directly in-browser via devtools: manually unlocked and maxed Tail Slap, evolved it to Steel Slam, and confirmed the timer's callback was `doSteelSlam`; then replayed the exact Basking `.reset()` call from the fixed code and confirmed the callback was still `doSteelSlam` afterward (previously would have flipped to `doTailSlap`); separately confirmed that after evolving, the old buggy "unlock Tail Slap" availability check would have returned `true` (card wrongly offered again) while the fixed check correctly returns `false`. Zero console errors throughout.

---

## Session 20 — 2026-07-07

### All items doubled in size
Every pickup (XP crickets/mealworms/dragonflies, Treasure, Foodbox, Fullbox, the Bug Buster collectible pupa mine, and the Hand mini-boss dragonfly drop) uses the same `'cricket'` texture with a per-type `setScale(...)` — doubled every one of them, including the "pulse" tween's peak scale for each (e.g. Fullbox `0.60 → 1.20`, pulsing to `0.72 → 1.44`; the normal XP drop-table scales `0.30/0.35/0.40/0.25 → 0.60/0.70/0.80/0.50`).

### Enemy collision/hitbox reduced by 25%, visual size unchanged
Added `enemy.body.setSize(enemy.body.width * 0.75, enemy.body.height * 0.75)` right after every enemy's `setScale(...)` in the shared `spawnEnemy()` function, and the same for Hand mini-bosses in `spawnHandMiniBoss()` — this shrinks only the Arcade Physics body (used for both enemy-vs-enemy collision and enemy-vs-player/weapon hits), leaving the sprite's on-screen size untouched. The five enemy types that already had a hand-picked `body.setSize(...)` (Coriander Hydra, Carrot Mole burrowed/surfaced, Oregano gas-cloud, Coriander Whip — plus their minion/clone duplicates) had their literal pixel values multiplied by 0.75 directly (`110→82.5`, `40×30→30×22.5`, `60×40→45×30`, `88→66`, `70→52.5`) so they shrink by the same proportion as every other enemy.

Verified directly in-browser via devtools: spawned enemies and confirmed the resulting physics body converges (after Phaser's own scale-sync pass) to exactly 75% of the sprite's display size (e.g. a 32px-wide sprite → 24px hitbox); confirmed a killed enemy's cricket drop renders at the new doubled scale (`0.30 → 0.60` for a Vitaworm drop); confirmed the hydra special-case body math still resolves to a sane positive size. Zero console errors throughout.

---

## Session 21 — 2026-07-07

### Bug fixed: weapon knockback barely visible, made enemies look like they were just walking backwards
`attractCrickets()` runs every single frame in the main `update()` loop and unconditionally re-issues `this.physics.moveToObject(enemy, this.player, enemy.speed)` for every regular enemy. The three places that apply knockback (Steel Slam, the Inflate passive, Log Lob) only ever called `enemy.body.setVelocity(...)` once — so the very next frame's `moveToObject` call immediately overwrote that velocity back to the enemy's normal (much slower) chase speed toward the player. The knockback velocity was only ever in effect for a single ~16ms frame, so the actual displacement was tiny; what was visible instead was the enemy's normal slow walk resuming almost immediately, reading as "just walking backwards" rather than a snappy knock.

Added `applyKnockback(enemy, angle, speed, duration = 150)`, which sets the velocity as before but also stamps `enemy.knockbackUntil = this.time.now + duration`. `attractCrickets()` now checks that stamp before re-issuing `moveToObject` and skips the chase re-assertion while an enemy is still within its knockback window, letting the burst velocity actually carry it backward for a real, visible 150ms before the chase AI resumes — a fast, distinct snap instead of an instantly-erased nudge. Steel Slam (400 px/s), the Inflate passive (220 px/s), and Log Lob's "slight" knockback (60 px/s) all now route through this helper.

Verified directly in-browser via devtools: applied a Steel-Slam-strength knockback to a spawned enemy and confirmed the velocity survived an immediately-following `attractCrickets()` call (previously would have been overwritten back to chase speed in that same call); fast-forwarded past the 150ms window and confirmed the enemy correctly resumed chasing at its normal speed; called `inflateKnockback()` directly on a nearby enemy and confirmed it now stamps `knockbackUntil` and applies velocity the same way. Zero console errors throughout.

---

## Session 22 — 2026-07-07

### Bug fixed: Cold Glare's (and Four Chills') blue ring visibly drifted as it appeared
Both `doColdGlare()` and `doFourChills()` created their icy-ring `Graphics` object at the default position (0, 0) and then drew the circle at local coordinates `(px, py)` — the player's actual position. The fade-out tween scales the `Graphics` object itself (`scaleX`/`scaleY` → 1.15 / 1.12), and Phaser scales a Graphics object's content around its own position, not around wherever the shape happens to be drawn locally. Since the object's position was (0, 0) but the circle was drawn far away at (px, py), scaling up multiplied that entire offset too — the ring's center visibly slid outward from the world origin instead of staying put, worse the further from (0,0) the player was standing. Fixed by positioning the `Graphics` object at `(px, py)` via `setPosition` and drawing the circle at local `(0, 0)` instead, so the scale tween now pivots around the ring's own center and it grows in place.

### The upgrade-pick countdown now freezes timers exactly like the pause menu
`showLevelUp()` already pauses everything the same way the pause menu does (`physics.pause()` + `time.paused = true`), but the instant a card was picked, `pickCard()` set `time.paused = false` again — needed only so the 3-2-1 countdown's own `time.delayedCall`s could fire, since Phaser's Clock refuses to advance individual timers while the whole clock is paused. That side effect unpaused *every* other timer in the scene too: weapon cooldowns, the enemy spawn timer, poison ticks, boss attack timers, etc. Every weapon's `do*()` function already early-returns on `isCountdown`, so no attack actually fired, but the cooldown timer itself still ran to completion and reset — silently burning a full cycle for nothing during the ~1.5s countdown, then starting a fresh full-length cooldown afterward. Fixed by keeping `time.paused` (and physics) untouched for the whole countdown and switching the 3-2-1 label's ticks and the final `resume()` call to real `setTimeout`, which runs independently of Phaser's paused clock — so the countdown still animates, but every cooldown now stays frozen in place and picks up exactly where it left off once the countdown actually ends, matching pause behavior exactly. `resume()` guards on `this.scene.isActive()` first since it's no longer auto-cancelled by Phaser on scene shutdown the way a `delayedCall` would be.

Verified directly in-browser via devtools: confirmed the Cold Glare/Four Chills `Graphics` object's `(x, y)` now matches the player's exact position instead of the world origin, so the scale tween can no longer drag it away from center; opened the level-up screen, picked a card, and sampled `biteTimer.elapsed` and `time.paused` at multiple points through the full countdown — elapsed stayed frozen at the exact same value the entire time (previously it would have kept advancing) and only resumed ticking after the countdown genuinely finished; confirmed the 3-2-1 label still counts down correctly and destroys itself on resume. Zero console errors throughout.

---

## Session 23 — 2026-07-07

### Enemies killed by Bug Buster now drop a pupa mine AND an XP insect
Previously `killEnemy()` treated a Bug Buster kill (`enemy._killedByBugBuster`) as mutually exclusive with a normal XP drop — it dropped only the collectible pupa mine item, no cricket. Now it drops both: the collectible mine (offset 8px left of the death spot) and the regular XP insect from the same drop-table entry the kill would have used anyway (offset 8px right), so Bug Buster kills no longer cost the player their usual XP.

### Bug fixed: the mine spawned from picking up a collectible pupa mine used Bug Buster's stats, not the base weapon's
Walking over the collectible pupa mine (dropped by a Bug Buster kill) spawns a fresh live mine — but that spawned mine was hard-coded to Bug Buster's numbers (`pupaRadius * 2` blast, `pupaDamage * 2.5` damage, 45s fuse) and even tagged its own kills with `_killedByBugBuster = true`, which would have chained into *more* collectible mine drops indefinitely. Per the request, this pickup should behave like a plain, non-evolved Pupa Mine regardless of whether the player currently has Bug Buster — fixed to use the regular `pupaRadius`/`pupaDamage`/10s fuse and dropped the `_killedByBugBuster` tag, so a kill from this mine now drops a normal single XP insect like any other regular Pupa Mines kill, with no chaining.

Verified directly in-browser via devtools: killed an enemy with `_killedByBugBuster` set and confirmed exactly 2 drops appear (`pupamine_collectible` + a normal XP insect using the correct drop-table scale); manually invoked the pickup path (`collectCricket` with a fake `pupamine_collectible` item) while Bug Buster was owned and confirmed the spawned mine dealt exactly `pupaDamage` (50) to a test enemy — not the 125 Bug Buster would deal — and left `_killedByBugBuster` unset on the kill. Also measured total damage output of one full cast of each against a fixed high-HP target: base Pupa Mines (5 mines × 50 dmg) = **250 total**; Bug Buster (11 mines that run × 125 dmg) = **1,375 total**. Zero console errors throughout.

---

## Session 24 — 2026-07-07

### Bug Buster kills now drop a live mine directly instead of a walk-over pickup
Per follow-up request, removed the pickup step entirely: `killEnemy()`'s Bug Buster branch now calls a new `spawnPupaMine(x, y)` helper that spawns a real, regular (non-evolved) Pupa Mine right at the death spot — it triggers naturally on enemy contact or its 10s fuse, exactly like any other mine, with no player interaction required. Removed the now-dead `pupamine_collectible` item type entirely: the `collectCricket()` pickup handler that used to spawn a mine on walk-over, and the three leftover `specialType === 'pupamine_collectible'` checks in the off-screen arrow filter, the cricket-magnet exclusion list, and the boss-fight cricket cleanup exclusion.

### Bug Buster damage changed to a flat 65 per mine
Was `pupaDamage * 2.5` (125 with default stats, and scaling with Aura Farming). Now a flat `65`, per request.

### New: burning enemies (Sunbaked Ambers) spread fire to enemies they touch
Extracted the inline burn-application code from `doSunbakedAmbers()` into a reusable `igniteEnemy(enemy, duration)` method (red tint, 6 dmg every 300ms, no-ops if already burning). Added `trySpreadFire(source, target)`, wired into the existing `this.enemies`-vs-`this.enemies` physics collider: whenever two enemies physically touch, if one is burning and the other isn't, the second catches fire for **1 second** (a much shorter burn than the direct 3.5s ember hit). Each enemy can only catch fire this way once every **3 seconds** — tracked per-enemy via `_nextBurnContagionAt` — so two enemies stuck touching each other don't re-ignite one another every physics step.

Verified directly in-browser via devtools: confirmed a Bug Buster kill drops exactly one live mine (with a working `explodeFn`, added to `pupaGroup`) plus one normal XP insect, no collectible item; confirmed `doBugBuster()`'s mines now deal exactly 65 damage each; simulated a burning enemy colliding with a non-burning one and confirmed the target catches fire; confirmed a second attempt immediately after is correctly blocked by the 3s cooldown, then succeeds again once the cooldown is manually expired; let a contagion burn run to completion and confirmed it deals exactly 4 ticks × 6 dmg = 24 total over ~1.2s before extinguishing. Zero console errors throughout.

Noted but left alone (pre-existing, not introduced this session, flagged as a separate follow-up task): `this.pupaGroup.add(mine)` resets `body.immovable`/`body.allowGravity` back to their defaults even after `setImmovable(true)`/`setAllowGravity(false)` were called first, on every mine-spawning code path including the original `doPupaMines()`. Mines have therefore never actually been immovable/gravity-locked as the code intended — not user-visible in a game with no gravity, but worth a real fix (call the setters after `pupaGroup.add()` instead of before).

---

## Session 26 — 2026-07-10

### GameScene.js split into 13 focused system files

`GameScene.js` had grown to **6,957 lines** (~180 methods in a single class) — too large to navigate meaningfully. Split into 13 system modules using **prototype mixin injection**: each file exports a plain object of methods, and `Object.assign(GameScene.prototype, XxxMethods)` installs them after the class definition. All `this.*` references inside every method body resolve to the live GameScene instance at call-time, so zero code changes were needed inside any method body. This matches the style of the existing `audio.js` — no new architectural patterns introduced.

**Final structure:**

```
src/
  scenes/
    GameScene.js       ← 318 lines (was 6,957): constructor, create, addGrid, update + 14 imports + 13 Object.assign calls
  systems/
    movement.js        ← player movement, dubia shields, off-screen arrows
    hud.js             ← UI bars, pause overlay, volume sliders
    enemySpawn.js      ← spawnEnemy and all per-level wave logic
    baseWeapons.js     ← all 16 base weapon fire methods
    enemyDeath.js      ← killEnemy (XP drops, rare drops, score)
    crickets.js        ← XP collection, damage collisions, knockback, playEnemyHurtSfx
    boss.js            ← boss AI for levels 1–4, HP bar, phase transitions, crossfadeBgm
    gameFlow.js        ← showDeathOverlay, revivePlayer, showLevelClear
    levelUp.js         ← showLevelUp (level-up card screen)
    evolutions.js      ← all 16 evolveToXxx stubs + 19 evolved weapon methods
    evolutionUI.js     ← evolution menu, loadout display, playerDamageFlash, regen, pause glow
    handBoss.js        ← The Hand (level 5) AI and all attacks (non-contiguous in source: parts 1 and 2 concatenated around the mini-boss section)
    handMiniBoss.js    ← four mini-boss AI sets injected during The Hand fight
```

**Conversion mechanic:** class method syntax has no commas; object literal methods need them. Used a brace-depth-aware Python converter to append `,` after every top-level method-closing `    }` line. Template literals and callback closures briefly confused the depth tracker, leaving 29 method-close braces without commas across `baseWeapons.js`, `gameFlow.js`, `handBoss.js`, and `handMiniBoss.js`. Fixed by scanning for `    }` lines followed (after optional blank/comment lines) by a new method signature and patching them in one pass.

**Audio imports:** each system file imports only the audio functions it actually calls directly from `'../audio.js'`. Files that call `this.playEnemyHurtSfx()` (a prototype method defined in `crickets.js`) need no audio import of their own. Verified that all 35 `playEnemyHurtSfx()` call sites from the original audio session are intact (34 weapon/damage sites + 1 `damageBoss` hook).

### README.md and GAME_REFERENCE.md created

- **README.md** — stack, project structure, three ways to run locally (Python, npx serve, VS Code Live Server), controls table (keyboard + gamepad), debug keys, level table, deployment notes.
- **GAME_REFERENCE.md** — complete gameplay reference: all 16 weapons with per-level stats, all 16 passives with per-pick effects and caps, all 16 evolutions with requirements and descriptions, all enemies per level (HP/damage/speed/specials), all 5 bosses (phases and attacks), all item and drop types.

### Audio audit (no changes)

After the split, a full audit confirmed the audio wiring is unchanged: every direct audio function call (`playSfx`, `crossfadeBgm`, `stopBgm`, `pauseBgm`, `resumeBgm`, `playBgm`) is in a file that imports it; `setMusicVolume`/`setSfxVolume` are passed as function references in `hud.js` which imports both; the `audio.js` module singleton state is shared correctly across all importers via the ES module cache. No audio regressions introduced.

---

## Session 25 — 2026-07-08

### Real item art wired up (was sitting unused on disk)
Investigation found that 6 new item PNGs (`dragonfly`, `mealworm`, `vitaworm`, `foodbox`, `fullbox`, `treasure`, all 64×64) had been added to `assets/sprites/items/` alongside the existing `cricket.png`, but `BootScene.js` only ever loaded `cricket`, and every item drop in `GameScene.js` faked its identity by tinting the one shared cricket texture. Fixed:
- `BootScene.js` now loads all 7 item textures (and the stale "32x32" comment is corrected to "64x64").
- Every item-drop site (the `F` debug key's wormbox scatter, the Hand mini-boss dragonfly drop, and the fullbox/foodbox/treasure rare drops in `killEnemy()`) now spawns its real texture instead of a tinted cricket, with the now-redundant `.setTint(...)` calls removed.
- The normal XP `dropTable` (Vitaworm/Mealworm/Dragonfly per enemy) had its `tint` fields replaced with a `key` field, and the two spawn sites read `drop.key ?? 'cricket'` instead of always spawning `'cricket'` and tinting it.
- Enemy and boss sprites remain 100% untouched placeholders — out of scope for this pass.

### Controller: white box outline on Level Select
The gamepad/stick-selected level in `LevelSelectScene.js` now gets a real white outline drawn around its button box (a dedicated `Rectangle` with `setStrokeStyle`, repositioned/resized to match whichever button is selected) — an earlier attempt used `Text.setStroke()` on the label itself, which only outlined the glyphs, not the box; corrected per follow-up feedback. Also fixed a pre-existing gap where toggling the ALL LEVELS debug button rebuilt the level buttons without re-applying the highlight/outline to the new objects.

### Pause menu: Y now quits to the main menu, with a corner control hint
Previously the gamepad Y button did nothing but resume the game while paused. Added a check in the pause gamepad handler so **Y** now triggers the same "quit to main menu" action as clicking `[ QUIT TO MAIN MENU ]`, and added a bottom-left corner hint reading `🎮 Y Quit to Menu   X Evolutions` (cleaned up alongside the rest of the pause UI on resume).

### Evolutions now also require the paired boost (not maxed, just owned)
Turned out the weapon-maxed + boost-owned-at-least-once gating (`getAvailableEvolutions()`) and all 16 weapon↔boost pairings were already implemented exactly as requested. The actual bug: `_getEvoReqLines()` computed both a `weaponLine` and a `boostLine`, but the locked-card requirements popup only ever destructured and displayed `weaponLine` — the boost requirement was invisible to players. Fixed by rendering both lines in the popup (and resizing the popup box to fit).

### Evolutions menu: controller navigation + visible "already evolved" cards
Two changes to `showEvolutionMenu()`:
- **Controller navigation**, mirroring Level Select's scheme: D-pad up/down jumps by row, left/right moves within the same row (no wrap to adjacent rows), the left stick does the same continuously (200ms repeat cooldown), and a white box outline (matching Level Select's) tracks the selected card and auto-scrolls the viewport when the selection moves out of view. **A** picks an available card, opens the requirements popup on a locked card (or dismisses it if already open), and does nothing on an already-acquired card. Bottom hint updated to `🎮 D-Pad/LS Navigate · A Pick · B Close · RS Scroll`.
- **Acquired evolutions are no longer hidden** from the grid (previously `appliedEvolutions` were filtered out entirely) — they now render in an inverted "owned" style: white box, black border, black text, with the recipe line replaced by `✓ EVOLVED`, and are non-interactive.

Verified directly in-browser via devtools: confirmed all 7 item textures load into `game.cache.image` and that every drop site (debug wormbox scatter, Hand mini-boss drop, fullbox/foodbox/treasure rare drops, and all 4 dropTable categories with `Math.random` pinned to force each branch) spawns the correct real texture with correct xpValue/specialType; simulated gamepad d-pad/stick input on Level Select and confirmed the white outline follows selection and survives the ALL LEVELS rebuild; simulated gamepad Y on the pause menu and confirmed it correctly quits to `LevelSelectScene` (scene-manager transition confirmed on the next tick); confirmed the evolutions popup now shows both weapon and boost requirement lines with correct ✓/✗ coloring; drove the evolutions grid entirely via simulated gamepad events (D-pad right, A) and confirmed it correctly applied an evolution end-to-end (including the `ownedWeapons` key swap), confirmed A on a locked card opens the popup and a second A dismisses just the popup while B closes the whole menu, and confirmed an acquired card renders white/black and ignores input. Zero console errors throughout.

---

## Session 27 — 2026-07-13

### Level 5 (The Garden) is complete
With The Hand's final phase behaviour, mini-boss AI, and health rebalance all landed and verified, Level 5 — the last of the five planned levels — is now considered done. All five levels, all 5 bosses, all 16 weapons, all 16 evolutions, and all planned passives are implemented.

### Cold Glare shortened from 7 levels to 4
Kept only the 1st/3rd/5th/7th stat rows of the original progression: L1 (30000ms cooldown / 1s slow) → L2 (20000ms / 1s) → L3 (15000ms / 4s) → L4 (15000ms / 10s). Replaced the old dual `coldGlareCdLevel`/`coldGlareSlLevel` counters with a single `coldGlareLevel` (1–4) driven by a small lookup table. `weaponMaxLevel.coldglare` dropped 7 → 4; Four Chills' evolution requirement text updated to `Cold Glare ×4`. Caught and fixed a crash of my own making along the way: the level-up card's description is computed eagerly for every card even ones filtered out by `available()`, so at level 4 it tried to read a "next level" that no longer existed — fixed by falling back to the last table entry.

### The Hand's health doubled
Each of its 4 phase pools doubled: `[1500, 2000, 2000, 3000]` → `[3000, 4000, 4000, 6000]` (total 8500 → 17000 HP), verified via `computePhasedHealth` boundaries.

### Evolutions menu: zoom view with prev/next arrows and an UNLOCK? button
Pressing (or gamepad A on) any card in the Evolutions grid now opens a zoomed-in detail view instead of instantly acquiring it or popping up a small requirements box: shows the evolution's name, description, and weapon/boost requirement lines (✓/✗ colored). **◀/▶** buttons (also LB/RB or d-pad left/right) cycle through every evolution, wrapping at the ends. An **UNLOCK?** button sits below — bright and clickable only when the evolution is actually available, otherwise greyed out and inert; already-acquired evolutions show a disabled "✓ EVOLVED" state instead. A **[ BACK ]** button (also B/ESC) returns to the grid, re-selecting the card you zoomed in from. The old locked-card popup was removed since the zoom view now covers the same info directly.

### Branch Throw's "widening" upgrade now lengthens instead of widens
The two upgrade picks (`'Wider branch'` / `'Even wider branch'` — description text left unchanged per request) now grow `branchLength` (a new stat, replacing a hardcoded `120` constant: 120 → 180 → 240) instead of `branchWidth`, which now stays fixed at its base value of 20 for every level. Verified the branch's `displayWidth` grows while `displayHeight` stays constant across all three levels.

### Mobile/touchscreen support
- **Virtual joystick**: dragging anywhere on screen outside a button/menu (checked via `input.hitTestPointer`, plus a state guard for pause/countdown/level-up/level-clear/game-over) shows a joystick — an outer ring at the drag's origin and an inner circle that follows the drag, clamped to the ring's border, with a small deadzone. Feeds `handleMovement()` at the same priority tier as the gamepad analog stick (after gamepad, before keyboard).
- `activePointers: 2` in the Phaser config so a joystick drag and a button tap can register as two simultaneous touches; `touch-action: none` on the canvas so the browser doesn't hijack drags for page-scroll/zoom.
- Menu/button touch support needed no code changes — Phaser's `pointerdown`/drag handling already covers touch identically to mouse across every screen; only the new movement drag was missing.

### Debug features removed (REVIVE, U, N, F) — ALL LEVELS kept
Removed the `U`/`N`/`F` debug keys and the death overlay's REVIVE button (and the now-dead `revivePlayer()` function) per request; the death screen now shows only RETRY/MAIN MENU. Left the generic `reviveInvincible` damage-immunity flag checks scattered through the enemy/boss/projectile code alone — they're a reusable invincibility mechanism, not debug-specific, and now simply never trigger since nothing sets the flag anymore. The `ALL LEVELS` toggle on Level Select was explicitly preserved, untouched.

### QUIT TO MAIN MENU now goes to the title screen, not level select
Changed `this.scene.start('LevelSelectScene')` → `this.scene.start('TitleScene')` in the pause menu's quit handler.

### Boss health rebalance
Lettuce Beetle 8000→1500, Rocket Spider 12000→2000, Carrot Scorpion 18000→1600, Mulberry Mantis restructured to a flat 2200 total with its phase-2 transition landing exactly at 900 HP remaining (switched from the old "two equal 8000-HP pools" formula to explicit `computePhasedHealth([1300, 900], true)`). Carrot Scorpion's stinger bury now spawns 10 Carrot Moles + 5 Carrot Thugs (was 20 + 10).

### Bug fixed: Raging Roar could permanently freeze enemies (NaN speed)
Raging Roar's rotating-cone tick unconditionally computed `enemy.speed = enemy._roarBaseSpeed * 0.5`, but only captured `_roarBaseSpeed` when `!enemy.slowed` — if a *different* weapon (e.g. Dust Kick) had already slowed the enemy and set `slowed = true` first, Raging Roar skipped the capture and divided `undefined` by 2, producing `NaN` speed. `NaN` velocity permanently freezes an enemy's movement (though not its position — it can still be hit if the player walks into it), and since Raging Roar continuously sweeps 360°, a loadout with both Raging Roar and Dust Kick would accumulate a growing pile of frozen "statue" enemies over a few minutes — which is what got reported as "lost collision" (the frozen pile jams the player's path via their still-solid enemy-vs-enemy collider, while contact damage from the frozen enemies themselves stops since they can no longer close distance). Fixed by tracking Raging Roar's own base-speed capture independently of the shared `slowed` flag. Also gave Raging Roar actual damage (12 per 500ms tick, previously dealt none) and made its slow refresh every tick instead of a single weak 350ms pulse, so an enemy caught in the sweeping cone stays slowed continuously.

### Audio sliders made controller-accessible
The pause menu's MUSIC/SFX sliders could already be *selected* via gamepad (A to start, B to stop, D-pad up/down or left-stick Y to swap between them) but had no way to actually change the volume value, and no on-screen hint that any of this existed. Added: a corner hint reading `🎮 A Sliders`, swapping to `🎮 ◀▶ Adjust ▲▼ Swap B Back` once a slider is selected; D-pad left/right nudges the selected slider 5% per press; left-stick X-axis continuously adjusts it, scaled by deflection and frame time.

### Mobile border/alignment fixed
Two separate issues: (1) `body { height: 100vh }` doesn't account for a mobile browser's address bar dynamically showing/hiding, so the flex-centered canvas could be misaligned — changed to `100dvh` with `100vh` as a fallback. (2) The real bug: Phaser's own `autoCenter: CENTER_BOTH` computes and applies its own `margin-top`/`margin-left` to center the canvas within `body`, but the CSS was *also* flex-centering `body` — stacking two centering offsets. Barely visible on desktop's mild letterboxing, but a glaring ~300px misalignment on a phone's much larger portrait letterbox gap. Fixed by removing the redundant CSS flex-centering and letting Phaser's `autoCenter` be the single source of truth. Verified the canvas's rendered position matches true-center math exactly on both a 375×812 mobile viewport and desktop.

### Bug fixed: a real crash inside the vendored Phaser 3.88.2 engine itself
Root cause, tracked down from a user-supplied stack trace: `GamepadPlugin.stopListeners()` (called on every scene shutdown, i.e. every scene transition) loops over its internal `gamepads` array and calls `.removeAllListeners()` on every slot with no null check. If a slot is ever empty — which happens when a controller disconnects/reconnects, since browsers don't agree on Gamepad API index assignment (observed on Edge) — every subsequent scene transition throws and hard-crashes the game, and it keeps happening on every future scene load since the empty slot never gets cleared.

Fixed by patching `GamepadPlugin.prototype.stopListeners` from `main.js` (not editing the vendored `lib/phaser.min.js`, so it survives a future Phaser version bump): swap in a same-length substitute array with empty slots filled by a no-op stub, run the original implementation against that, then restore the real array completely untouched afterward.

Took two attempts to get right, both caught by the user actually reproducing the crash again after each fix:
1. First attempt used `this.gamepads.filter(Boolean)`, which **reassigns/compacts** the array — this fixed the crash but broke gamepad movement, because it silently shifted a controller connected at a non-zero native index down into the wrong array slot, corrupting `getPad()`'s lookup on every later frame while button *events* (a separate code path, not index-gated) kept working fine.
2. Second attempt swapped to `this.gamepads.map(pad => pad || noopStub)`, preserving array structure — but `Array.prototype.map()` silently **skips genuine sparse holes** (indices that were never assigned) and leaves them unfilled in its output; it only fills indices holding an *explicit* `undefined` value. Since Phaser's `refreshPads()` only ever writes the native index a controller actually reports, the empty slots are true holes, not explicit undefined — so the crash still reproduced. My own verification test at the time used an array literal (`[undefined, pad]`), which assigns explicit `undefined`, not a hole, so it passed despite the real bug still being present.
3. Final fix: `Array.from({ length }, (_, i) => real[i] || noopStub)`, which iterates every index by length regardless of whether it's a hole, so it actually fills every gap. Verified this time with a genuinely sparse array (`sparse[1] = pad; sparse.length = 2`, confirmed index 0 is a true hole via `0 in sparse === false`) run through the real `stopListeners()` call and a full natural scene transition.

### Bug fixed: gamepad movement silently didn't work (separate from the crash above)
Every polling-based gamepad read in the codebase (`handleMovement`, Level Select nav, pause sliders, evolutions menu nav/scroll, level-clear nav — 6 sites total) hardcoded `this.input.gamepad.getPad(0)`. Phaser's `getPad(index)` scans for a pad whose **native browser-assigned index** equals the argument — it is not an array-position lookup. If the browser assigns a real controller a non-zero native index (the same underlying Edge-specific quirk behind the crash bug above), `getPad(0)` silently returns nothing forever, while button *events* (Start for pause, A/B/D-pad for menus) kept working since those aren't index-gated — exactly matching the report "pressing works, moving doesn't." Fixed by switching all 6 sites to `gamepad.pad1`, a public Phaser getter that tracks the first controller to ever connect by *connection order*, immune to native index assignment. Verified by simulating a controller at native index 1 (then again at index 2): confirmed `getPad(0)` found nothing while `pad1` found it correctly, and confirmed `handleMovement()` produced correct velocity from that pad's stick input in both cases.

### Boss spawn now clears all live Pupa Mines / Bug Buster mines
Previously a player could pre-stage a pile of mines before the boss arrived and instantly burst it on spawn. The boss's spawn sequence now destroys every mine in `pupaGroup` (which tracks both regular Pupa Mines and Bug Buster's mines, since they share the same group) alongside the existing cricket/treasure cleanup.

### Dubia Shields restored to 100% reoccurrence; owned weapons weighted +15% to reappear
Dubia Shields previously had a 40% chance gate suppressing it from the level-up pool after the first pick — removed, restored to the same 100% baseline as every other weapon. Separately, added a general mechanic: every weapon card was tagged with an explicit `weaponKey`, and the level-up screen's card draw switched from a flat unweighted shuffle to a weighted sampling-without-replacement pick, where any weapon already owned (level > 0) is 15% more likely to be drawn than everything else (unowned weapons and all passives stay at baseline weight). Verified via a 4000-trial statistical comparison between an owned and an unowned weapon under otherwise identical conditions — observed draw ratio 1.18, matching the intended +15%.

### Immobilised enemies/boss now flash purple, distinct from slow's light blue
All 6 `bugCaught` sites (base Bug Catcher passive, Steel Slam, Flashclaw, Duststorm, Four Chills, and the shared `immobilizeBoss()`) now `setTint(0xbb66ff)`/`clearTint()` around the immobilise window. Several of these previously had no tint at all; the base Bug Catcher passive had a light-blue-ish tint that was easy to confuse with the slow status. Duststorm and Four Chills can slow and immobilise the same enemy in one hit — purple correctly shows on top since it's applied after the slow tint in the same code path.

### Woodie Bounce now fires at the nearest enemy instead of a random direction
The initial launch angle is now aimed at the nearest enemy (falls back to a random direction only if none exist); each bounce's *re-aim* after impact is still random, since that's the intended "bounce" behaviour. Card description updated to say "at the nearest enemy" (was previously silent on aiming at all).

### Bug Buster description fixed
Was stale from before Session 24 removed the walk-over pickup step ("huge blasts drop collectible pupa mines"). Corrected to "defeated enemies drop a Pupa Mine" — mines drop and arm automatically now, there's nothing to collect.

Verified directly in-browser via scripted devtools testing throughout (fresh page reloads, direct function calls, simulated pointer/gamepad events, and statistical trials where relevant): zero console errors on every change in this session once each fix was finalized.

---

## Session 28 — 2026-07-28

### Mulberry Mantis now fades out slowly instead of flashing away
Both the level-4 boss and its Hand-fight mini-boss reprise already stopped moving and faded to alpha 0 before vanishing, but the fade was a snappy 200ms flash. Slowed to 1000ms in both `boss.js` and `handMiniBoss.js` so it reads as a deliberate fade rather than a blink.

### Spinach Cyclone / Spinach Tempest no longer passively spin; XP insects spawn at random angles
Removed the continuous `angle: 360, loop: -1` rotation tween from all 5 spots it was applied (regular Spinach Cyclone spawn, Spinach Tempest, a wandering Cyclone spawned by Tempest, and the two Mulberry Mantis phase-2 cyclone-ring spawns in `boss.js`/`handMiniBoss.js`). Separately, every real XP insect drop (cricket/vitaworm/mealworm/dragonfly — not Foodbox/Fullbox/Treasure, and not weapon projectiles that happen to reuse the cricket texture) now spawns with `setAngle(Phaser.Math.Between(0, 359))` for visual variety.

### Spawn-rate ramp steepened 50%
The per-10-second spawn delay multiplier went from ×0.85 (15% cut) to ×0.775 (22.5% cut) in `GameScene.js` — enemies now reach the 400ms density floor by ~80s into a level instead of ~113s.

### New per-projectile passive rotation
Added `setAngularVelocity` spin to specific projectiles: Poop, Pebble Flick, the shared Lettuce Shooter/Oregano Fan pellet (explicitly excluding Mulberry Snake's spit, which shares that same code path), and Oregano Phantom's death-burst all spin at a random 0.5–1.5 rotations/sec; Woodie Bounce, Toxic Ocean, and Sunbaked Ambers spin at a random 1.6–2 rot/s; Skin Shed spins at a fixed 0.2 rot/s. XP insects also now spin (0.2–1 rot/s, randomized per insect) for as long as they're actually being magnet-pulled toward the player, and stop spinning the instant they're out of magnet range again.

### Boss health rebalanced again
Lettuce Beetle 1500→3000, Rocket Spider 2000→3800, Carrot Scorpion 1600→2500, Mulberry Mantis 2200→4000 (phase 2 now starts at 1200 HP remaining instead of 900), The Hand 17000→12500 total across phase pools of 2000/3000/3500/4000 (was 3000/4000/4000/6000). Fixed a stale comment along the way that still described the pre-rebalance Hand phase pools.

### All bosses now take half damage from every source
Added a single `× 0.5` multiplier inside the shared `damageBoss()` — the one function every weapon (base and evolved) routes boss damage through — so all 5 main bosses effectively have double their stated HP against any weapon's raw damage number. Deliberately scoped to just the real bosses: the weaker mini-boss reprises The Hand summons during its own fight take damage through the regular per-enemy path, not `damageBoss()`, so they're unaffected and still take full damage like any other enemy.

### Shared multi-status tint system; Venom's final level now also ignites
Every status effect (poison, fire, slow, immobilize) used to call `setTint()`/`clearTint()` directly, so two effects active on the same enemy at once silently overwrote each other's color — a real, pre-existing bug (e.g. Acid Snake already applies poison+slow to the same target). Added `addStatusTint`/`removeStatusTint`/`_refreshStatusTint` in `baseWeapons.js`: each effect now registers its own color under its own key; with one active color it shows steady (identical to the old behavior), with two or more it flashes between all of them every 200ms. Routed all ~22 existing call sites through it (poison and fire/burn for both enemy and boss, every slow application across 9 different weapons, and every immobilize application across 6 sites). Venom's 3rd/final pick now also ignites whatever it poisons for 3s, using this same system so it correctly flashes alongside the poison instead of one hiding the other; the level-up card text updates to state this only on the final pick.

### LEVEL CLEAR's CONTINUE button renamed to NEXT LEVEL, jumps straight into the next level
Now reads "NEXT LEVEL" with the upcoming level's name on a second line inside the same button, and clicking it (or gamepad A) starts `GameScene` directly at `level + 1` instead of returning to Level Select. Falls back to the old `[ CONTINUE ]` → Level Select behavior on clearing level 5, since there's no level 6. Fixed a latent bug found along the way: the gamepad A handler on this screen always resumed to Level Select regardless of which button (Next/Menu) was actually highlighted — harmless before since both went to the same place, but would have broken gamepad navigation now that they diverge.

### Dust Kick compacted from 5 levels to 3
Levels 2–4 previously read "Stronger kick" but silently changed nothing — only the unlock (level 1) and the old level 5 actually touched any stat. Compacted to 3 real levels with the same start/end stats: unlock (180 length / 2s slow) → 290/6s → 400/10s (final). Updated `weaponMaxLevel.dustkick` and Duststorm's evolution requirement text to match.

### Inflate given a second level
First pick unchanged. Second pick — described exactly as *"Heavier damage and knockback, with a random ailment inflicted half the time."* — doubles damage (15→30) and knockback speed (220→440), and gives each enemy hit a 50% chance to also get a randomly-picked ailment (poison, fire, slow, or immobilize) for 1–3s. Added a shared `inflictRandomAilment()` helper that routes through the same status-effect functions/tint system everything else uses.

Bug found and fixed the same day this shipped: the random ailment kept landing on immobilize (purple) every time, making it look broken/undiversified. Root cause — `applyEnemyPoison`/`igniteEnemy` and the slow/immobilize branches all silently no-op if that enemy already has that status, and poison/slow in particular are already near-ubiquitous from other weapons in a real loadout, so those rolls very often did nothing visible while immobilize (rarer elsewhere) was the one that reliably landed. Fixed by only rolling among the ailments the enemy *isn't* already under, so a successful roll always visibly applies and all four get a genuine, even chance.

### Four Chills reworked: tapering damage instead of halving HP
Removed the "halve HP of the 8 closest enemies" effect entirely. Replaced with tapering AOE damage to *everything* in the 350px ring (not just the 8 closest) — peak damage at the player's feet is 1.5× a single Sticky Shot attack's damage (90 by default, computed dynamically off current `lickDamage` even without owning Sticky Shot), tapering linearly to 0 at the edge. This also now hits the boss, which the old percentage-based halve deliberately excluded. Slow (all in range, 8s) and immobilize (8 closest, 15s cooldown each) are unchanged; added a guard so immobilize skips anything the new damage already killed.

### Dubia Defenders: 5th hit on the same enemy triggers a small explosion
Each enemy tracks its own hit counter (only while Dubia Defenders is active, not the base weapon); on the 5th hit it resets and a 50px-radius explosion fires, dealing the current shield damage to everything caught in the blast. The explosion is centered on whichever shield is currently closest to that enemy — recalculated fresh at the moment of the 5th hit, since hits toward one enemy can come from different orbiting shields over time.

### Evolutions menu: hidden names until acquired, shake-then-reveal on unlock, stays open afterward
Names and descriptions in both the grid and the zoomed-in view now show as bold `???` until that evolution is actually acquired *this run* (requirements stay visible). Since `appliedEvolutions` is a fresh `Set()` per `GameScene.create()` with no persistence, this already resets every run for free. Pressing UNLOCK? no longer instantly applies the evolution — it shakes the info box for 1500ms with intensity ramping from 0 to a 10px jitter, locks out navigation for that window, then reveals the real name/description. Layered a full-screen white flash on top: brightens to full white across that same 1500ms, holds for 1000ms, then fades back to normal over a final 1000ms (3500ms total). Claiming an evolution also no longer kicks you out of the menu back to the paused pause-screen — it now rebuilds the same zoomed-in "close up" view showing the new "✓ EVOLVED" state instead.

Two real bugs surfaced and fixed while building this: (1) the shake/flash were originally built on `this.time.addEvent`/`delayedCall`, which never advance while `time.paused` is true — and the evolutions menu only ever opens from the paused pause menu — so the whole thing froze permanently the instant UNLOCK? was pressed (this is the exact same class of gotcha the level-up 3-2-1 countdown hit in an earlier session). Fixed by switching to Phaser tweens throughout, which aren't gated by `time.paused` (confirmed by grepping the codebase — only `physics.pause()` and `time.paused` are ever toggled, the Tween Manager never is). (2) In deleting the old immediate-unlock path there was a leftover stray closing brace from a removed nested guard, which `node --check` caught before it ever reached the game.

### Poop rebalanced: no more level-20 gate, 30s cooldown, half damage, shrinks to nothing
Removed the `playerLevel >= 20` restriction on its level-up card entirely. Fire rate slowed from 8s to 30s. Damage halved (15→7.5 per tick). The field now scales continuously from full size down to nothing over its whole lifetime instead of staying full-size and only fading alpha at the very end — the damage hit-radius tracks the live shrinking scale so what you can actually get hurt by always matches what's drawn on screen.

### Toxic Ocean rebalanced: half damage, delayed shrink, real 90px/s chase
Damage multiplier on evolve dropped from ×1.5 to ×0.75 (half of the old boost off the same base). Fields now stay full-size for the first 4000ms after landing, then shrink to nothing over their own duration (same mechanic as Poop's fix above, just delayed). The drift-toward-nearest-enemy-cluster behavior, previously a barely-perceptible ~4px/s, now moves at a true 90px/s.

Two pre-existing bugs got fixed alongside this, since cranking the chase speed up would have made both painfully obvious otherwise: the field's damage/boss checks were using the *original landing coordinates* rather than the field's current drifted position, so the visible field could wander away from where it actually dealt damage; and the ring outline was drawn at absolute world coordinates instead of positioned via `setPosition` + drawn at local origin, the same "scale tween drifts an off-center shape" class of bug already fixed once for Cold Glare/Four Chills and for Poop's own shrink.

### Pause menu: 1-second cooldown before unpausing; Cold Glare fixed to actually affect everyone in range
`togglePause()` now blocks any resume attempt for a full second after pausing — using `performance.now()` rather than `this.time.now`, since `this.time` itself freezes the instant `isPaused` becomes true and would never let a full second elapse. Every resume path (pause button, ESC/P, any key, any click, any gamepad button) already shares this one function, so a single guard at the top covers all of them.

Separately, Cold Glare was skipping any enemy that was *already* slowed by anything else — and slow is applied by nearly every other weapon in the game, so in a real loadout most enemies in its radius were never actually touched by it. Fixed using the same independent-base-speed-capture pattern already established for Raging Roar: it now always affects every enemy in range, correctly re-applying/extending the slow even on an enemy something else already slowed, without corrupting whatever speed that enemy should eventually return to.

### A note on verification this session
The Browser pane's preview tab had `document.visibilityState` stuck on `hidden` for the entire session regardless of fronting it, which stalls Phaser's own asset loader and blocks any real in-game playthrough or screenshot — a session-specific tooling limitation, not a game bug (confirmed by manually pumping the game's own step loop, which ran fine; the loader was starved of real network/render ticks, not stuck in a code loop). Every change in this session was instead verified via `node --check` syntax validation on every edited file, and isolated Node-side simulations of the actual formulas/state machines involved (spawn ramp curve, boss phase-health math, the multi-status tint flash logic, the ailment-distribution fix, damage/chase-speed numbers) rather than live in-browser confirmation. Recommend a manual playthrough pass to confirm visually, particularly the evolutions-menu shake/flash sequence and the Toxic Ocean chase behavior.

---

## Session 29 — 2026-07-28

### Spawn-rate ramp made much steeper; live enemy cap now grows over time
The per-10-second spawn-delay multiplier went from ×0.775 to **×0.5** in `GameScene.js` — enemies now hit the 400ms density floor by **~30s** into a level instead of ~80s.

Previously the live enemy cap was a hardcoded `80` inside `spawnEnemy()` (`enemySpawn.js`), never changing for the rest of the level. Added `this.maxEnemies` (starts at 80), which now grows **+6 every same 10-second ramp tick** up to a ceiling of `this.maxEnemiesCap = 250`, reached around the 5-minute mark and held for the rest of the level. `spawnEnemy()`'s cap check now reads `this.maxEnemies` instead of the old literal `80`.

Verified via a Node-side simulation of both curves (not live in-browser — see the tooling note below): confirmed spawn delay reaches its 400ms floor at t=30s, and the enemy cap climbs 80→86→92→…→250 on schedule.

### Bug found and fixed: Shining Shells could deal massive uncapped damage to bosses in a single pass
Diagnosed from a user report: fighting the Lettuce Beetle (3000 HP, all bosses take 50% damage per [Session 28](#session-28--2026-07-28)), one weapon removed roughly a quarter of its health twice, about 10–15 seconds apart. Traced to `doShiningShells()` in `evolutions.js`: the shell-vs-enemy overlap callback dedupes each hit with a `hitEnemies` Set so a shell can only damage a given enemy once before rerouting, but the shell-vs-boss overlap callback had **no equivalent guard** — Arcade Physics fires an `overlap` callback on every single frame two bodies remain touching, so a shell clipping through (rather than just grazing) the boss's hitbox could deal `woodieDamage` (100 raw / 50 net) again on every frame of that overlap. At 60fps, even a quarter-second graze is 15 frames × 50 = 750 net damage — exactly a quarter of the boss's 3000 HP — explaining the reported symptom precisely. Every other continuous-contact weapon in the codebase (e.g. Dubia Shields, `movement.js`) already guards against this with an explicit per-target hit cooldown; Shining Shells' boss branch was the one exception.

Fixed by adding a `shell.hitBoss` flag mirroring the existing `hitEnemies` Set pattern: set `true` on the first overlapping frame, checked-and-skipped on every frame after, and cleared back to `false` in `scheduleShiningShellBounce()` (the same 120ms-later rebound point that already clears `hitEnemies`) — so a shell now deals exactly one hit per pass through the boss, never one hit per frame.

### A note on verification this session
Same Browser-pane `document.visibilityState`-stuck-hidden limitation as last session persisted, so this was again verified without a live playthrough: `node --check` on every edited file, plus a Node-side simulation of the new spawn-delay/enemy-cap ramp curves. The Shining Shells fix is a straightforward, minimal structural mirror of the already-proven `hitEnemies` dedup pattern used two lines above it in the same function, so it wasn't separately simulated — recommend confirming in a real Lettuce Beetle fight that a lingering shell no longer strips a large chunk of boss health in one graze.

---

## Session 30 — 2026-08-01

### Evolution damage numbers rebalanced (9 evolutions), per explicit request
All values switched from being derived off the base weapon's stat (e.g. `× 1.8`, `× 1.5`) to flat numbers, since the request specified exact target numbers rather than multipliers:
- **Steel Slam**: 45 → **60** dmg
- **Sticky Shot**: 60 → **110** dmg per tongue
- **Acid Snake**: 38 → **75** dmg per side
- **Shining Shells**: 100 → **80** dmg per shell hit
- **Flashclaw**: 25 → **50** dmg per strike (double strike still fires twice, so 100 total per cast, up from 50)
- **Duststorm**: 15 → **60** dmg
- **Lucky Thrash**: random 20–35 per scratch mark → random **10–250** per mark (much wider swing, leaning further into the "Lucky" theme)
- **Four Chills**: was computed as `1.5×` a live Sticky-Shot-equivalent damage (90 by default, scaling with Lick/Aura Farming) → flat **130** at the center, still tapering linearly to 0 at the 350px edge

### Log Lob reworked: repeat-hit tick instead of one hit per pass
Previously each log dealt ≈48 dmg once per enemy, gated by a 1500ms per-enemy cooldown, so an enemy brushing through only ever took one hit even though the log's own knockback (60px/s) nudges it back toward the log's path. Per request ("50dmg every 500ms of an enemy being within it... knock the enemy back so it can hit 2 or 3 times"), changed the per-enemy hit cooldown from 1500ms → 500ms and the damage from ≈48 → flat **50**, so the existing knockback now reads as intended: a hit knocks the enemy back, it drifts back into the log's path, and it can take 2–3 hits total over the log's lifetime instead of just one.

### Docs updated
[GAME_REFERENCE.md](GAME_REFERENCE.md)'s evolutions table updated to match every number above.

### A note on verification this session
`node --check` on the edited file (`src/systems/evolutions.js`) confirmed no syntax errors. All changes are direct numeric substitutions or a cooldown-constant change in already-working code paths (Log Lob's overlap/knockback logic was untouched, only the two constants). Recommend a real playthrough to confirm Log Lob's 2–3 hit combo reads well and Lucky Thrash's new 10–250 swing feels appropriately "lucky" rather than just random.

---

## Session 31 — 2026-08-01

### Bug fixed: Woodie Bounce re-aimed on a fixed timer, not on actually hitting anything
`doWoodieBounce()`'s bounce logic (`scheduleWoodieBounce()`) picked a new random direction every 700ms unconditionally, regardless of whether the woodlouse had touched an enemy — so it "ricocheted" on a clock, and could sail straight through empty space changing direction on its own. Per request, reworked so a bounce only happens as a direct reaction to hitting an enemy or the boss: the enemy/boss overlap callbacks in `doWoodieBounce()` now call a new `bounceWoodieOffEnemy(woodie, speed)` (replacing the old always-firing `scheduleWoodieBounce()`), which decrements `bouncesLeft`, picks a new random direction, and — mirroring the same pattern Shining Shells already uses for its own ricochet — waits 120ms before clearing `hitEnemies` so the woodlouse has time to actually move away before it can register another hit on what it just bounced off. Since nothing else now guarantees a despawn if a woodlouse never connects with anything, added an 8000ms safety `delayedCall` to destroy it regardless.

### Shining Shells: aim now has a real miss chance instead of homing dead-on
`scheduleShiningShellBounce()` (the post-bounce re-aim) previously computed the exact angle to the nearest enemy's current position every time — a guaranteed hit unless the enemy moved between frames. Per request ("fire and ricochet in the general direction... so it won't always hit"), added `pickShellAimAngle(fromX, fromY)`: finds the nearest enemy same as before, but then aims at a random point within `SHELL_AIM_SPREAD` (76.8px — one Fullbox's drawn diameter, 64px texture × 1.20 scale) of it, so the real target zone is a circle two Fullboxes wide centered on the enemy. Falls back to a fully random direction with no enemies around, same as before. Wired into both `scheduleShiningShellBounce()` (the ricochet) and, per the "fire... in the general direction" half of the request, `doShiningShells()`'s initial launch angle too — previously that was fully random with no aim assist at all, now it's the same imprecise nearest-enemy aim as every ricochet.

### Docs updated
[GAME_REFERENCE.md](GAME_REFERENCE.md): Woodie Bounce's description now states it only bounces on a real hit (with the 8s safety despawn noted); Shining Shells' evolution row now describes the ~77px aim spread instead of "auto-aims nearest enemy."

### A note on verification this session
Same Browser-pane `document.visibilityState`-stuck-hidden loader stall as recent sessions blocked a live playthrough again (confirmed still present: spoofing `visibilityState`/dispatching `visibilitychange` did not unstick Phaser's asset loader, which stayed parked mid-`BootScene` load). Verified via `node --check` on both edited files (`baseWeapons.js`, `evolutions.js`) and a manual read-through confirming no other code path still referenced the removed `scheduleWoodieBounce`. Recommend a real playthrough to confirm Woodie Bounce's bounce timing feels right in practice and that Shining Shells' new spread reads as "usually hits, sometimes grazes past" rather than "rarely connects."

### New: emergency spawn-rate boost for the final stretch before the boss
Per request (revised twice mid-request to the final tiered version below): if the live enemy count is too thin for how close the boss fight is, the spawn rate temporarily multiplies to fill the field back out. Added `getSpawnBoostMultiplier()` in `enemySpawn.js`, checked against `this.gameTime` (counts down from 600 to 0) and the live `this.enemies.getChildren().length`. Three time-gated tiers, only the strongest currently-matching one applies (they don't stack, since the time windows nest inside each other):
- ≤7:00 left, <5 enemies → ×1.5 (+50%)
- ≤5:00 left, <10 enemies → ×2.5 (+150%)
- ≤2:00 left, <20 enemies → ×4 (+300%)

Once a tier triggers, the boost lingers for 5s after the trigger condition stops being true (time window ends or the count climbs back over the threshold) — carried over from the original ask, so the boost doesn't flicker on/off if the count hovers right at the line.

Implementation-wise, rather than touching `spawnTimer`'s delay (which the existing 10s ramp already owns, and repeatedly `.reset()`-ing a timer with the same delay would just perpetually restart its countdown and stop it from ever firing), the timer's callback was swapped from `spawnEnemy` directly to a new `spawnTick()`, which adds the current multiplier to a fractional accumulator and spawns one enemy each time the accumulator crosses 1 — so a ×1.5 multiplier correctly averages one extra enemy every other tick instead of a naive `Math.round()` losing the fraction. Updated both places `spawnTimer` is constructed/reset (initial creation and the ramp's `.reset()` call) in `GameScene.js` to use `spawnTick` instead of `spawnEnemy`.

### Docs updated
[GAME_REFERENCE.md](GAME_REFERENCE.md)'s Levels & Enemies section now documents the emergency spawn boost tiers in a table.

### A note on verification this session
Same Browser-pane loader stall persisted — verified via `node --check` on `enemySpawn.js` and `GameScene.js`, plus a manual trace confirming `spawnTick`/`getSpawnBoostMultiplier` are correctly exposed on `GameScene.prototype` via the existing `EnemySpawnMethods` mixin. Recommend a real playthrough near the boss timer to confirm the tiers trigger at the right moments and the fractional accumulator's spawn pacing feels smooth rather than bursty.

### Bug fixed: Toxic Ocean's field teleported in 45px jumps instead of sliding
Its chase-the-nearest-cluster movement recalculated a target point every 500ms tick and immediately snapped `field.x`/`field.y` straight there, so the field visibly teleported in discrete steps rather than gliding. Per request, replaced the instant jump with a 500ms linear tween spanning the exact gap until the next tick (`field.moveTween`, stopped and replaced each tick rather than left to stack), with the ring's position kept in sync via the tween's `onUpdate`. Damage/boss-range checks still read `field.x`/`field.y` once per tick same as before — only the visual motion between ticks changed. Left the once-per-tick `ring.clear()`/`lineStyle()`/`strokeCircle()` redraw out of the new code since it was redundant (the ring's local-space shape never changed between ticks, so it only ever needed to be drawn once, at creation).

### A note on verification this session (Toxic Ocean fix)
Same loader stall — verified via `node --check` only. The change is a narrowly-scoped swap from a direct assignment to a tracked, single-property Phaser tween in an already-working code path, so no other behavior should be affected; recommend a real playthrough to confirm the field now visibly glides rather than steps, and that it doesn't visibly jitter if two chase recalculations land back-to-back.

### Lettuce Beetle now escalates continuously as its HP drops
Per request: walk speed and charge speed both now scale up to +50% (80→120px/s, 320→480px/s), and the delay between charges scales down to -50% (3500ms→1750ms), all tracking smoothly with current HP rather than being fixed values — full strength at full HP, hitting the cap exactly at 0 HP (i.e. the moment it dies).

Added three small helpers in `boss.js`: `getLettuceBeetleProgress()` (0 at full HP → 1 at 0 HP, linear), `getLettuceBeetleSpeedFactor()` (1× → 1.5×, applied to both walk and charge speed), and `getLettuceBeetleChargeDelay()` (reads a new `boss.baseChargeDelay` set at spawn → scales down to 0.5×). The charge timer itself had to change shape to support this: it was a fixed-delay `loop: true` timer, which can't have its delay change mid-flight without disrupting the loop, so it's now a self-rescheduling `delayedCall` chain (the same pattern already used elsewhere in this file, e.g. `scheduleStinger`/`scheduleNextSlam`) that recomputes the delay fresh from current HP before every charge. `bossCharge()`'s dash velocity and the regular chase-speed line in `GameScene.js`'s `update()` (the generic `else` branch that only ever runs for the level-1 boss, since every other boss has its own dedicated AI branch) both now multiply by the same speed factor. Scoped to only the real level-1 boss fight — the separate Lettuce Beetle mini-boss reprise summoned during The Hand fight (`handMiniBoss.js`'s `miniBeetleCharge`) has its own independent charge logic and wasn't touched, since the request was about "the Lettuce Beetle" (the level 1 boss), not that reprise.

### Docs updated
[GAME_REFERENCE.md](GAME_REFERENCE.md)'s Lettuce Beetle entry now notes the escalation and the capped end-of-fight numbers.

### A note on verification this session (Lettuce Beetle escalation)
Same loader stall — verified via `node --check` on `boss.js` and `GameScene.js`, and confirmed `this.bossChargeTimer.remove()` in `killBoss()` still correctly cancels whichever `delayedCall` is currently pending regardless of the timer type change. Recommend a real playthrough (or dropping the boss to low HP via devtools) to confirm the beetle visibly speeds up and charges more often as it nears death, and that the ramp feels smooth rather than jumpy.

### Enemies now spread out and approach from different angles instead of blobbing
Per request: every regular enemy's chase movement in `attractCrickets()` (`crickets.js`) — previously a flat `physics.moveToObject(enemy, this.player, enemy.speed)` aiming every enemy at the exact same point every frame, which is what caused them to pack into a dense blob directly behind/around the player — now adds a per-enemy angular bias plus a slow wobble on top of the bearing to the player:
- `approachOffset`: a fixed ±25° bias, randomized once per enemy
- a slow sine-wave "detour" wobble (±10–20° amplitude, random period) layered on top
- both fade out linearly between 300px and 60px from the player, reaching 0 at 60px — so at range enemies visibly curve in from their own angle and weave a little, but up close they straighten out and aim directly at the player again, so contact/damage stays reliable instead of enemies orbiting forever without ever landing a hit

Both values are lazily assigned on an enemy the first time `attractCrickets()` sees it (`enemy.approachOffset === undefined` check), mirroring the existing `cricket._spinSpeed` lazy-init pattern a few lines below in the same file — chosen specifically because enemies are constructed from ~6 different code paths across `enemySpawn.js` (the main `spawnEnemy()` plus five separate mini-spawn blocks for Spinach Cyclone/Tempest, Coriander Carrot, and Mulberry Monstrosity), and lazily defaulting inside the one shared movement function avoids having to touch every single spawn site. Scoped to only the enemies that already reach the plain chase line — charging enemies, wanderers, burrowed/stationary enemies, trapped/immobilised enemies, and enemies mid-knockback all still return earlier in the function untouched, so their existing special movement is unaffected.

### A note on verification this session (enemy spread)
Same loader stall confirmed once more (tried again this session; identical stuck-at-51.6% `BootScene` load progress) — verified via `node --check` on `crickets.js` and a standalone Node script confirming the distance→spread fade curve clamps correctly to 0 at ≤60px and 1 at ≥300px. Recommend a real playthrough with a large group chasing the player to confirm the spread reads as "converging from an arc" rather than either "no visible difference" (offset too small) or "enemies visibly missing the player" (offset not fading out fast enough at close range).

### Emergency spawn-boost enemy-count thresholds doubled
Per request, doubled all three trigger thresholds from the [emergency spawn boost](#new-emergency-spawn-rate-boost-for-the-final-stretch-before-the-boss) added earlier this session — the boost percentages (+50%/+150%/+300%) and time windows (≤7:00/≤5:00/≤2:00) are unchanged, only how many live enemies it takes to trigger each tier:
- <5 → **<10** (last 7 min, +50%)
- <10 → **<20** (last 5 min, +150%)
- <20 → **<40** (last 2 min, +300%)

### Docs updated
[GAME_REFERENCE.md](GAME_REFERENCE.md)'s emergency spawn boost table updated to the new thresholds.

### Branch Throw and Log Lob: same-enemy hit cooldown standardized to 300ms
Per request, both weapons now use a shared timing rule — the same enemy can be hit again every 300ms rather than either a one-hit-ever limit or a different cooldown:
- **Log Lob**: per-enemy hit cooldown lowered from 500ms (set earlier this session) to 300ms.
- **Branch Throw** (base weapon): previously used a permanent `hitEnemies` `Set` — once a bar hit a given enemy, that enemy could never be hit by that same bar again, only different enemies, up to its Max Hits cap. Switched to the same `hitCooldowns` `Map`-based pattern Log Lob already uses, so a bar sitting on/sweeping through the same enemy can now hit it again every 300ms instead of only once. Note this means `hits`/Max Hits (15 or 30) now also counts repeat hits on one enemy, so a bar parked on a single target can burn through its hit budget faster than before — an intentional side effect of allowing repeat hits at all, not a separate change.

### Docs updated
[GAME_REFERENCE.md](GAME_REFERENCE.md)'s Branch Throw and Log Lob entries updated to describe the 300ms repeat-hit window.

### Bug fixed: Poop and Toxic Ocean's field kept shrinking in real time while paused/countdown/leveling up
Both fields' shrink-to-nothing animation is a Phaser `tweens.add({..., duration, ease: 'Linear'})` call — and per the established pattern from earlier sessions (the level-up countdown bug in [Session 22](#session-22--2026-07-07), the evolutions-menu shake/flash bug in [Session 28](#session-28--2026-07-28)), Phaser's Tween Manager runs on real wall-clock time and is never gated by `this.time.paused` the way `time.addEvent` timers are — only `physics.pause()` and `time.paused` get toggled by this game's pause system. So the field's shrink tween kept animating in the background at full real-time speed even while the game was paused, mid-countdown, in the level-up screen, on the level-clear screen, or on the death overlay — meaning a field could visibly shrink away (or even fully disappear) while the player couldn't even see or interact with the game.

Fixed with a small per-frame sync in `GameScene.update()`: any shrink tween is now pushed into `this.pausableShrinkTweens` (`{ tween, field }` pairs) right after creation in both `doPoop()` (`baseWeapons.js`) and `doToxicOcean()` (`evolutions.js`), and the very first thing `update()` does every frame — before its own `isLevelingUp` early-return, so it still applies during level-up — is pause or resume every tracked tween based on `isPaused || isCountdown || isLevelingUp || isLevelClear || isGameOver`. Entries are pruned once their `field` is no longer `.active` (i.e. the tween already completed and destroyed it), so nothing needs an explicit reset on scene restart — a stale entry from a previous life of the same scene instance (this codebase's scenes don't always get a fresh instance on restart, per [Session 4](#session-4--2026-07-01)'s `bossSpawned` reset bug) just gets filtered out harmlessly. Scoped to only these two shrink tweens, not a blanket `tweens.pauseAll()` — a global pause would have also frozen the pause menu's own UI tweens (e.g. the EVOLUTIONS button's gold glow, and the evolutions-menu shake/flash which was specifically built to keep animating while the game is paused).

### A note on verification this session (Branch Throw/Log Lob + shrink-pause fix)
Same loader stall — verified via `node --check` on all four edited files (`baseWeapons.js`, `evolutions.js`, `GameScene.js`, plus the earlier `enemySpawn.js` change). The shrink-pause fix in particular would benefit from a real playthrough: pause the game (or open a level-up screen) while a Poop or Toxic Ocean field is mid-shrink and confirm its size is frozen exactly where it was, then confirm it resumes shrinking from that same size after unpausing rather than jumping or restarting.

### Pause button now radiates a big gold pulse ring every 5s while an evolution is ready
Per request, added on top of the existing gold alpha-flash on the "⏸ PAUSE" button (`updatePauseBtnGlow()` in `evolutionUI.js`): a new `spawnPauseBtnPulse()` draws an expanding, fading gold ring centred on the button (starts at radius 16, scales to 5× over 900ms while fading out, `Cubic.easeOut`) — fired once immediately when an evolution first becomes available, then every 5s via a new `this._pauseBtnPulseTimer` for as long as one stays available, and cleaned up (`.remove()`) the moment none are. Positioned the same way every other AOE ring in this codebase already is (`setPosition` to the button's center, drawn at local `(0, 0)`) to avoid the "ring drifts from a stale local offset while scaling" bug class this project has hit and fixed several times before (Cold Glare, Four Chills, Poop, Toxic Ocean).

### A note on verification this session (pause button pulse)
Same loader stall — verified via `node --check` on `evolutionUI.js`. Recommend a real playthrough to confirm the ring is actually centred on the button (its bounds are read live via `pauseBtn.getBounds()`, so this should hold regardless of how wide the button's text/padding renders) and that the 5s cadence reads as a clear "look here" pulse rather than being too subtle or too frequent.

### New debug key: E instantly maxes Bite and Hungry Forager
Per request, added a `keydown-E` handler in `hud.js` (alongside the existing ESC/P pause handlers) that jumps Bite to level 4 and Hungry Forager to 4 picks. Applies only the increments for whichever levels/picks aren't already reached (checked against current `biteLevel` and how many `'Hungry Forager'` entries are already in `ownedPassives`) rather than hard-setting `biteDamage`/`biteRange`/`magnetRange` to their level-4 baseline values outright — since Aura Farming and Hunter Instinct both add directly into `biteDamage`/`biteRange` respectively, a flat overwrite would have erased any of those bonuses already picked before pressing E. Calls `updatePauseBtnGlow()` afterward since maxing Bite while owning at least one Hungry Forager pick is exactly the requirement for the Starved Chomp evolution, so the pause button's glow (and new pulse, added earlier this session) should react immediately if that's the only thing standing between the player and it being available. Blocked while paused/countdown/leveling-up/level-clear/game-over, matching how the existing debug-key-shaped input in this codebase is normally guarded. This is the only debug key left after [Session 27](#session-27--2026-07-13) removed U/N/F.

### A note on verification this session (debug E key)
Same loader stall — verified via `node --check` on `hud.js` and a manual trace confirming `biteLevel`/`ownedPassives`/`magnetRange` are all initialized earlier in `create()` before `createUI()` (where the new handler is registered) runs. Recommend a real playthrough to confirm pressing E from a fresh level instantly reflects `Bite (4/4)` and `Hungry Forager (4/4)` in the pause menu loadout, and that pressing it again afterward doesn't further inflate damage/range/magnet values.

### Debug E key removed
Per follow-up request, removed the `keydown-E` handler added earlier this session — `hud.js` is back to just ESC/P for pause.

### New: persistent cross-run INDEX — every weapon/boost/evolution ever unlocked, browsable from Level Select
A large feature spanning several files:

- **`src/progressIndex.js`** (new) — `localStorage`-backed record (`snapper_progressIndex`) of the highest weapon level, highest boost pick count, and which evolution ids have ever been reached, across every playthrough — independent of the current run's `ownedWeapons`/`ownedPassives`/`appliedEvolutions`, which still reset every level like before. Follows `audio.js`'s module-scope-state pattern: `recordWeaponLevel`/`recordBoostPick` only ever raise the stored value, `recordEvolution` is a one-way flag, `getProgressIndex()` returns the live in-memory record.
- **`src/upgradeContent.js`** (new) — static per-tier name/description text for all 16 weapons and 16 boosts (mirrors the flavor text already shown on level-up cards in `levelUp.js`, but as plain data with no live-game-state dependency, since it needs to render from `LevelSelectScene` where no run is in progress), plus a static copy of the evolution list (id/weaponKey/weaponLabel/boostName/evolvedName/desc) mirroring `GameScene.js`'s `evolutionDefs`. Verified programmatically that every weapon/boost's `tiers.length` exactly matches `GameScene.js`'s `weaponMaxLevel`/`boostMaxLevel` tables (16/16 both match) and that the evolution list has all 16 entries.
- **Recording hooks**: `levelUp.js`'s `pickCard()` now calls `recordWeaponLevel`/`recordBoostPick` right after `upgrade.effect()` runs. Weapon cards already carry `weaponKey`, so those record directly via `getWeaponLevel()`. Boost cards don't carry an explicit name field, but every one of the 16 boost `effect()`s pushes exactly its own name onto `ownedPassives` — so comparing `ownedPassives.length` before/after reveals which boost fired without needing to touch any of the 16 individual card definitions. `evolutionUI.js`'s `applyEvolution()` calls `recordEvolution(ev.id)` alongside the existing `appliedEvolutions.add(ev.id)`.
- **`showEvolutionMenu()` (in-game, pause menu) update**: per request, an evolution's name/description now unmask permanently once acquired in *any* past run (`everAcquired = isAcquired || !!getProgressIndex().evolutions[ev.id]`), not just the current one — a fresh run that hasn't re-earned it yet still sees the real name/flavor text instead of "???". The white "✓ EVOLVED"/owned styling stays tied to `appliedEvolutions` (current run) only, since that reflects whether it's actually active right now — a genuinely new visual state was needed for "known but not currently owned" (a dim blue-tinted card, `isKnownOnly`) since the existing "locked" color scheme was deliberately near-invisible to keep true mysteries hidden, which would have made the newly-revealed text unreadable if left as-is. The zoom view needed no color changes since its "not acquired" colors were already normal/readable in every case.
- **INDEX menu** (`LevelSelectScene.js`) — a new **📖 INDEX** button (top-right corner) opens a WEAPONS/BOOSTS/EVOLUTIONS-tabbed grid (4×4, no scrolling needed — 16 entries fit the 450px-tall screen without it). An unreached upgrade shows as **???**; a reached one shows its real name plus how many tiers have been reached (e.g. "Reached Tier 3/4"). Clicking a card zooms in: weapons/boosts show **◀ PREVIOUS TIER** / **NEXT TIER ▶** together in the bottom-right corner of the box, cycling only through the tiers actually reached (never the upgrade's full theoretical max) with the current tier's real description; evolutions have no tiers (single unlock) and instead show name + description + "Evolves from: X (maxed) + Y". ESC and gamepad B close (or back out of zoom first).
- **Gamepad input-leak fix caught while building this**: `LevelSelectScene`'s base gamepad `'down'` listener (D-pad nav / A to start a level / B to return to Title) is a raw event-emitter registration, not tied to Phaser's pointer hit-testing — unlike mouse clicks on the Index overlay (which Phaser's default `topOnly` already blocks from reaching anything underneath), gamepad button events fire to every registered listener regardless of what's on top. Without a guard, pressing A or B while the Index menu was open would have silently started a level or bounced back to the Title screen behind the overlay. Fixed with a `this._indexMenuOpen` flag (mirroring `GameScene`'s existing `_evoMenuOpen` pattern), checked at the top of the base handler and the left-stick poll, set when the menu opens and cleared via `requestAnimationFrame` on close (deferred one frame so the same B-press that closes the menu can't also fall through to "back to Title").

### Docs updated
[GAME_REFERENCE.md](GAME_REFERENCE.md) gained a new "INDEX Menu" section (with a table-of-contents entry) describing the feature and how it's persisted/recorded.

### A note on verification this session (INDEX feature)
The usual Browser-pane loader stall blocked reaching Level Select the normal way (`BootScene` parked mid-load, same as every other verification attempt this session) — but this time worked around it successfully rather than falling back to static-only checks: stubbed `scene.sound.add` to return a no-op fake sound object (sidestepping `playBgm`'s cache lookup, since `LevelSelectScene.create()` calls it on the very first line) and called `scene.create()` directly, bypassing the stuck scene manager entirely. This got a fully live, interactive `LevelSelectScene` running in the browser. Confirmed via direct `.emit('pointerdown')` calls on the actual game objects (not simulated coordinates): the INDEX button opens the menu; all three tabs (WEAPONS/BOOSTS/EVOLUTIONS) render correctly; a weapon with no recorded progress shows "???"; after injecting test progress via the real `recordWeaponLevel`/`recordBoostPick`/`recordEvolution` functions (dynamic `import()` of `progressIndex.js` from devtools), Bite correctly showed "Reached Tier 3/4", zooming in showed "Bite — Tier 1/4" with the correct tier-1 description, and NEXT TIER correctly advanced through "Tier 2/4" → "Tier 3/4" with each tier's real description, greying out at tier 3 (the recorded max) without ever exposing tier 4; the Angry boost and Starved Chomp evolution zoom views both rendered correctly, including the evolution's "Evolves from: Bite (maxed) + Hungry Forager" recipe line. Cleared the injected test `localStorage` entry afterward. The one thing this pass couldn't reach was the in-game (pause-menu) Evolutions menu's `everAcquired` unmasking, since faking a live `GameScene` (which needs real sprite/texture assets, not just audio) was out of scope for this workaround — that specific piece was verified by code review only and would benefit from a real playthrough check.

---

## Session 32 — 2026-08-01

### INDEX menu: new ENEMIES tab (kills/losses/level/boss), scrollbar, repositioned zoom + cross-entry arrows
A large follow-up to the INDEX menu built in the previous session, adding a full "enemy dex" on top of the existing weapons/boosts/evolutions tabs, plus two UI refinements requested mid-session for the zoom view across every tab.

**Tracking infrastructure** (`progressIndex.js`, `upgradeContent.js`):
- `progressIndex.js` gained an `enemies` bucket: `{ [textureKey]: { seen, kills, losses } }`, with `recordEnemySeen`/`recordEnemyKill`/`recordEnemyLoss`.
- `upgradeContent.js` gained `ENEMY_LIST` — all 35 enemy/boss texture keys (30 regular + 5 bosses, cross-checked 1:1 against `BootScene.js`'s preload list) tagged with display name, home level (the level an enemy is *introduced* in — Level 5's reused "droppers" like Iceberg Lettuce still list Level 1, not every level they appear in), and an `isBoss` flag.

**Seen tracking** — rather than touching the ~8 different places an enemy sprite gets created (`spawnEnemy()` plus five separate minion-spawn blocks in `enemySpawn.js`, Carrot Scorpion's mole/thug bury in `boss.js`, Hand mini-boss summons in `handBoss.js`), wrapped `this.enemies.add()` itself in `GameScene.js` — every one of those paths already calls it before an enemy becomes real, so it's a single choke point. The 5 main bosses never go through `this.enemies` (tracked separately as `this.boss`), so `spawnBoss()` gets its own `recordEnemySeen()` call.

**Kill tracking** — one line each at the top of the already-unified `killEnemy()` (`enemyDeath.js`) and `killBoss()` (`boss.js`).

**Loss tracking** — the hardest part. Added `this.lastDamageSource = <enemy/boss>.texture.key` right before **19 of the ~20** places across the codebase that do `this.playerHealth -=` (found via a full-codebase grep, then read individually to find whichever enemy/boss variable was actually in scope at each site): `crickets.js` (Lettuce Trap snap, `enemyHitPlayer`), `boss.js` (`bossHitPlayer`, Mulberry Mantis strike), `enemySpawn.js` (shooter projectiles, Coriander Whip lash, Mulberry Snake tail whip, Rocket Great Sword sweep, Oregano Phantom shot, Coriander Carrot minion whip, Mulberry Monstrosity vine whip), `enemyDeath.js` (Basil Bomb explosion, Oregano Phantom death-burst), `handBoss.js` (all 6 of The Hand's attacks), `handMiniBoss.js` (Mulberry Mantis mini-boss strike). Skipped only the player-burn status tick in `hud.js` (no clean single source at that point — an accepted minor gap, not tracked as a loss cause). `showDeathOverlay()` (`gameFlow.js`) then calls `recordEnemyLoss(this.lastDamageSource)` once per actual death.

**Bug caught mid-edit**: `updateHandFireZones()`'s fire-tick damage referenced a bare `boss` variable that doesn't exist in that function's scope (only `this.boss` does) — copy-pasting the same pattern used in every neighboring function without checking would have thrown a `ReferenceError` the very first time a player stood in Hand fire. Caught by cross-referencing every `const boss = this.boss;` declaration against which function each edit actually landed in, and fixed to `this.boss.texture.key`.

**ENEMIES tab UI** (`LevelSelectScene.js`): 35 cards (never-seen ones show **???**, no sprite hint); a seen card shows name, `Lv.N` (+ `BOSS` tag, red-tinted), and `Kills N • Losses N`. Zooming in on a seen enemy shows an actual **animated sprite** — creates/plays the same `{key}_walk` 2-frame animation used in-game — plus level/boss-tag/kill/loss stats; an unseen enemy's zoom shows no sprite at all, keeping its appearance a mystery too.

**Scrollbar** (per request — "There should be a scroll bar at the edge of the INDEX menu"): `buildGrid()` is now generically scrollable — viewport clipping, a draggable thumb + track on the right edge (visually matching the in-game Evolutions menu's), and mouse wheel support. Only appears when a tab's content actually overflows, which in practice is only ENEMIES (35 entries / 4 cols = 9 rows vs. weapons/boosts/evolutions' 16 entries / 4 rows, which still fit without it).

**Zoom repositioned + cross-entry arrows** (per a mid-session follow-up — "Position the enlarged form of the upgrade lower, and add two arrows on either side, identical to the ones in the EVOLUTIONS menu"): moved every tab's zoom box down (`zoomCy` 150 → 210) so it sits clearly below the tab row instead of crowding it, and added **◀ / ▶** side arrows — styled identically to the in-game Evolutions menu's — to every zoom view (all 4 tabs), cycling to a *different* entry within the same tab entirely and wrapping at the ends. This is layered on top of, not instead of, weapons/boosts' existing bottom-right **NEXT/PREVIOUS TIER** pair — the two control different things (side arrows switch which upgrade/enemy is focused; tier buttons page within whichever one is currently focused).

### Docs updated
[GAME_REFERENCE.md](GAME_REFERENCE.md)'s INDEX Menu section rewritten to cover the Enemies tab, scrollbar, and the repositioned zoom + arrow behavior.

### A note on verification this session
Same loader stall for a real playthrough, but the audio-stub workaround from last session worked again and let this get a genuinely thorough live check: opened the Index, switched to ENEMIES, confirmed the scrollbar exists and actually scrolls (mouse-wheel emitted directly, confirmed a card's `y` shifted by the expected amount, confirmed scrolling to max reveals the last enemy in the list within the viewport bounds); injected real test progress via the actual `recordEnemySeen`/`recordEnemyKill`/`recordEnemyLoss` functions (dynamic `import()`) and confirmed a killed-3-times Iceberg Lettuce, a lost-to-once Lettuce Beetle (with its `BOSS` tag), and a merely-seen The Hand all rendered their exact correct stats; zoomed into Lettuce Beetle and confirmed a real `Sprite` game object exists, using texture `lettuce_beetle`, actively playing animation `lettuce_beetle_walk`; clicked the right-arrow and confirmed it advanced to a genuinely different (unseen) enemy with no sprite and "???"/"Not yet encountered"; separately confirmed the weapon zoom's new lower position (name text now at the expected `y=142` for `zoomCy=210`), that exactly 2 side arrows exist, and that clicking one correctly switches from Bite to the next weapon (Tail Slap, unseen, correctly masked) while the NEXT/PREVIOUS TIER pair remains present only for known weapon/boost entries. Cleared the injected test `localStorage` data afterward.

### Bug fixed: PREVIOUS TIER button overlapped NEXT TIER, covering its "S"
Both buttons are positioned independently (`◀ PREVIOUS TIER` left-anchored, `NEXT TIER ▶` right-anchored) in the zoom box's bottom-right corner — at 9px font, "◀ PREVIOUS TIER" is wide enough that its right edge (previously ~591px) actually extended past `NEXT TIER ▶`'s left edge (~552px), a ~39px overlap that visually clipped the tail end of "PREVIOUS" behind the other button. Moved `PREVIOUS TIER`'s anchor further left (`zoomW/2 - 148` → `zoomW/2 - 210`). Verified directly (see below) the two buttons now sit 28px apart with zero overlap.

### A note on verification (PREVIOUS TIER button fix)
Live-verified via the same audio-stub workaround: opened a known weapon's zoom view, read both buttons' actual rendered `getBounds()` in the browser, and confirmed `prevBtn.right (526) < nextBtn.left (554)` — a clean 28px gap, no overlap.

---

## Session 33 — 2026-08-02

### The game is now an installable, fully offline-capable PWA
Added a complete Progressive Web App layer on top of the existing static, no-build-tools deploy — no bundler or npm dependency introduced, matching the project's existing constraint.

- **App icon** — no dedicated icon asset existed before, so one was generated from the player sprite (`assets/sprites/player/snapper.png`, frame 0) via a new `scripts/generate-icons.ps1` (PowerShell + `System.Drawing`, the same tool Session 1 used for the original placeholder sprites). Produces 5 PNGs in a new `assets/icons/` folder: `icon-192`/`icon-512` (90% scale, standard), `icon-maskable-192`/`icon-maskable-512` (60% scale, 20% safe-zone inset so OS circle/squircle masks don't clip the dragon), and `icon-apple-touch-180` (iOS home-screen icon, referenced directly since iOS ignores manifest icons). All composited onto opaque black (`#000000`) backgrounds — the source sprite is transparent, and maskable icons need opaque backing to avoid a white flash on some Android launchers; black also matches the game's actual runtime background and the new theme-color.
- **`manifest.json`** (new, root) — `display: "standalone"`, `orientation: "landscape"` (matches the native 800×450 internal resolution), `background_color`/`theme_color` both `#000000`, `start_url`/`scope` both `"/"` (Netlify serves this repo at the domain root).
- **`sw.js`** (new, root) — cache-first-with-network-fallback service worker precaching all 94 runtime files (root shell + `lib/phaser.min.js` + every file under `src/` and `assets/`, excluding `.DS_Store`/`.md` docs) so the whole game plays offline after first load. Versioned cache name (`snapper-pwa-v1`) with an `activate` handler that sweeps any old `snapper-pwa-*` cache automatically — bump `CACHE_VERSION` on any future asset/code change. Deliberately doesn't call `skipWaiting()`/`clients.claim()`: this is a real-time game (timers/audio/gamepad), so a tab left open across a deploy keeps serving its old cached version until closed and reopened, rather than force-swapping assets under a live session.
- **`src/registerSW.js`** (new) — tiny standalone module registering `sw.js` on `window load`, kept separate from `main.js` (reserved for Phaser config) per the project's one-concern-per-file style.
- **`index.html`** — added manifest link, icon links, `theme-color`/apple-mobile-web-app meta tags, and `viewport-fit=cover` on the existing viewport tag (for future safe-area support; no conflicting CSS existed yet).
- **`scripts/generate-precache-list.ps1`** (new) — one-time dev helper that walks `lib/`/`src/`/`assets/` and prints a ready-to-paste `PRECACHE_URLS` array for `sw.js`, so the ~94-file list doesn't need hand-typing when files are added/removed later.

### Bug caught during verification: `/index.html` is redirect-prone on some static hosts
Precaching `/index.html` as a separate entry from `/` seemed harmless until directly curling every precached URL against a local dev server (`serve`) turned up a 301 redirect from `/index.html` → `/` (a "clean URLs" behavior some static-file servers apply by default). Since the fetch handler already intercepts *every* navigation-mode request and serves the cached shell regardless of the requested path, `/index.html` never needed its own precache entry — removed it from both `sw.js`'s `PRECACHE_URLS` and the generator script, and pointed the navigation fallback at `/` instead. Netlify's own default behavior may not redirect `/index.html` at all, but avoiding the dependency entirely is simpler than relying on redirected-response caching support.

### A note on verification this session
The Browser pane couldn't reach the local dev server this session — external navigation (`https://example.com`) worked fine, confirming the pane itself was functional, but every attempt to navigate to `http://localhost` was denied, and the Claude-in-Chrome extension wasn't connected as a fallback — so no live in-browser screenshot, Lighthouse audit, or offline-reload test was possible (a different flavor of the same category of tooling gap noted in recent sessions' preview-tab issues, though this time it was a navigation block rather than a stuck loader). Verified everything reachable without a live page instead: `node --check` on both new JS files, `JSON.parse` on `manifest.json`, and — the check that actually matters most for a precaching service worker, since `cache.addAll()` fails atomically if even one URL 404s — curled all 94 `PRECACHE_URLS` entries plus `manifest.json`/`sw.js`/`registerSW.js`/all 5 icons directly against the running dev server and confirmed every single one returns `200`. Icon composition was visually confirmed by directly viewing the generated PNGs (dragon well within the maskable safe zone, clean black backing). Recommend a real browser pass to confirm SW registration/activation in DevTools Application panel, an offline-reload playthrough, a Lighthouse PWA audit, and an actual install-and-launch to check the icon/landscape-lock/splash screen.

---

## Session 34 — 2026-08-02

### Verified two existing mechanics still work as documented
Spent time confirming, rather than changing, two behaviors: the Lettuce Trap's dormant-until-triggered movement (spawned one via devtools, confirmed it holds perfectly still — alpha and position both unchanged — through 3+ real seconds and 20 direct update ticks while other enemies spawned around it, then confirmed it correctly snaps, reveals, and starts chasing once the player enters its 36px radius) and the INDEX menu's per-boss tracking (spawned/killed/lost-to a real Lettuce Beetle boss via devtools, confirmed `seen`/`kills`/`losses` all recorded correctly in `progressIndex.js` and rendered correctly in both the ENEMIES grid card and its zoomed detail view, including the `BOSS` tag and a live animated sprite). No bugs found in either case.

### Locked enemies in the INDEX now show a black silhouette instead of nothing
Previously, zooming into a never-encountered enemy showed no sprite at all — just `???` text and "Not yet encountered". Per request, the zoom view (`LevelSelectScene.js`) now always creates the enemy's real sprite and plays its actual walk animation, but tints it pure black (`setTint(0x000000)`) when locked — shape and movement are a discoverable hint, but the actual colors stay hidden. The text below it now mirrors the known-case layout exactly (`Level ???` / `Kills: ???  Losses to this enemy: ???`) instead of the old generic one-line message. Verified live: a locked enemy's zoom shows its correct texture animating in black, while a known enemy's zoom is untouched (full color, real stats).

### Cold Glare and Bite descriptions clarified
Cold Glare's summary text (in-game unlock card, INDEX menu, and `GAME_REFERENCE.md`) was ambiguous about whether "30s" was the freeze's *duration* or how often it *recurs* — clarified everywhere to the requested exact wording: "Freezes enemies in the radius for 1s, happens every 30s." Bite's description said "Always active," which undersold that it's actually a timer-based pulse (fires every 3s, 2s once upgraded, per `GameScene.js`'s `biteRate`) rather than a continuous effect — updated in `upgradeContent.js` and `GAME_REFERENCE.md` to state the real cadence.

### Controller support added to the INDEX menu and Level Select
Per request: pressing **Y** on Level Select now opens the INDEX menu (previously mouse-only), with a new corner hint (`🎮  Y  Index`). Once open, the menu is now fully controller-navigable, matching the in-game Evolutions menu's scheme — D-pad/left-stick moves a white selection box around the grid, **A** zooms into the selected card, **B** backs out of zoom (re-selecting the same card) or closes the menu from the grid, and right-stick scrolls the ENEMIES tab when it overflows. **LB/RB** now switch between the four category tabs (WEAPONS/BOOSTS/EVOLUTIONS/ENEMIES, wrapping at the ends) while in the grid — zoom mode keeps LB/RB's existing job of cycling between individual entries within the current tab, so the two don't conflict. Added matching hint text to both the grid (`🎮  D-Pad/LS Navigate   A Zoom In   B Close   •   LB/RB Category`) and zoom (`🎮  ◀/▶ or LB/RB  Switch Entry   B  Back`) screens.

Bug caught and fixed in the same pass: the new hint text overlapped the existing CLOSE/BACK buttons by several pixels — repositioned both buttons up for a clean gap, confirmed via live `getBounds()` measurement.

Verified live end-to-end via simulated gamepad events on a real running scene: Y opens the menu, LB/RB cycle categories with correct wraparound, D-pad navigation moves the selection box to the exact expected card, A zooms into that exact entry, and B returns to the grid with the selection correctly re-synced to the card just viewed.

### LEVEL CLEAR screen: A/B given fixed roles, with a hint that actually describes them
Previously this screen's gamepad support was a toggle-then-confirm scheme (D-pad/stick highlights NEXT LEVEL or MAIN MENU, A confirms whichever is highlighted) with a hint that just said "A Confirm ↕ Navigate" — technically accurate but not what was asked for. Per request, replaced with fixed, direct bindings matching how `GameOverScene` and the death overlay already do it: **A** always advances (next level, or Continue on level 5's clear screen, since there's no level 6), **B** always goes to the main menu, regardless of any highlight state. Removed the now-pointless toggle/highlight code entirely. Hint now reads `🎮  A  Next Level    B  Main Menu` (or `🎮  A  Continue    B  Main Menu` on the level 5 variant). Verified live: A correctly restarts `GameScene` at the next level, B correctly returns to `LevelSelectScene`, and both hint variants render their correct text.

### Alpha-based abilities revoked from every enemy except the ones that make it *entirely* vanish
Per request: audited every enemy/boss ability that changes alpha, then removed the ones that only ever reach a *partial* transparency (never true invisibility), keeping only the two that fade all the way to alpha `0`:
- **Removed**: Carrot Mole's burrow dim (alpha `0.25` while underground) — in the original level-3 spawn, the Carrot Scorpion boss's stinger-bury minions, and The Hand's mini-boss reprise of that same attack (three copies of the same mechanic, all fixed). Also removed Lettuce Trap's dormant near-invisibility (alpha `0.22`), and Oregano Skunk/Oregano Ghost's continuous gas-cloud alpha pulse (between `1` and `0.55`). In every case only the alpha call was removed — the actual mechanic (invulnerability while burrowed, the trap's snap trigger, the gas hitbox) is untouched, so these enemies now stay fully opaque throughout.
- **Kept unchanged**: Mulberry Mantis's vanish (boss and its Hand mini-boss reprise) and The Hand's teleport, since both genuinely fade to alpha `0` and disappear completely.

Confirmed via grep that nothing in the codebase reads `.alpha` for actual game logic anywhere (it's purely cosmetic), so removing these calls has zero effect beyond the visual. Verified each change live: forced a Carrot Mole through its real burrow-timer code path (using a temporary `Phaser.Math.Between` override to make the normally-3–10s random delay fire almost instantly, since accelerating Phaser's own clock via `time.timeScale` proved unreliable in this environment) and confirmed it goes underground — invulnerable, faster, moving — while staying at alpha `1`; confirmed a live Oregano Skunk holds alpha `1` across 1.2 real seconds (long enough that its old pulse would have visibly dipped); confirmed a Lettuce Trap spawns at alpha `1` and stays there through its snap trigger.

### Bug fixed: every code change since the PWA landed was invisible to anyone with the site already cached
Several features shipped this session (INDEX menu gamepad navigation, the Y-opens-INDEX shortcut and its corner hint, the LEVEL CLEAR screen's A/B rebinding, locked-enemy silhouettes, the alpha-ability revocations, the Cold Glare/Bite text fixes) were reported as completely absent in an actual playthrough — no hints, Y did nothing, no controller nav in the INDEX menu. Root cause: `sw.js`'s `CACHE_VERSION` was left at `'v1'` (its value from the moment the PWA was first built, in [Session 33](#session-33--2026-08-02)) through every single one of those edits. Since the service worker is cache-first and its own header comment says to bump the version on every change, anyone who had loaded the site even once before today kept getting served the exact JS snapshot from before any of today's features existed — the fetch handler was working exactly as designed, just serving a stale snapshot, since nothing had ever told it a new version existed.

Fixed by bumping `CACHE_VERSION` to `'v2'` (re-ran `scripts/generate-precache-list.ps1` first to confirm the 94-file list itself hadn't changed — it hadn't, no files were added/removed, so only the version string needed updating).

Verified the fix two ways: (1) confirmed `cache.addAll()` still succeeds against the current file list when replayed directly (all 94 URLs fetch cleanly, no atomic-failure risk); (2) simulated the actual affected scenario — created a fake stale `snapper-pwa-v1` cache, then did a genuine fresh page load (real click through the title screen into Level Select, not a devtools scene-jump) and confirmed the `🎮 Y Index` hint rendered, a real gamepad Y-button event opened the INDEX menu, and RB correctly switched category — all through the actual `registerSW.js` load-time registration path, not manual scripting.

Note for future sessions: this is an easy mistake to repeat, since nothing enforces the bump — the reminder is only a comment at the top of `sw.js`. Bump `CACHE_VERSION` in the same commit as any change under `src/`, `assets/`, `lib/`, or `index.html`.

### A note on verification this session
Diagnosing this required a lot of trial and error with the Service Worker/Cache Storage APIs directly in the Browser pane, since this same origin's Cache Storage had accumulated a lot of leftover state from many manual register/unregister cycles across earlier sessions' testing — several intermediate checks gave confusing results (an "activated" worker with an empty precache) that turned out to be artifacts of that leftover state rather than real bugs, only resolved by testing in a freshly-cleared tab with a genuine full page navigation instead of manual `register()` calls. The one test that actually matters — does the page receive current code through the service worker, and does a real user-shaped flow (click through title, press Y) work end to end — passed cleanly.

---

## Session 35 — 2026-08-03

### Real sprite art integrated; all placeholders retired

New real-art PNGs added to `assets/sprites/` with a revised naming convention. Every placeholder was retired and the codebase updated throughout.

**New file conventions:**
- Enemies: `assets/sprites/enemies/enemy_<key>.png`
- Bosses: `assets/sprites/bosses/boss_<key>.png`
- Enemy projectiles: `assets/sprites/enemy_projectiles/projectile_<name>.png` (new folder)
- Weapons: `assets/sprites/weapons/weapon_<name>.png` / `evol_<name>.png` (new folder)

**Eight entities renamed** (internal texture key and ENEMY_LIST label updated everywhere):

| Old key | New key | Label |
|---|---|---|
| `iceberg_lettuce` | `lettuce_small` | Small Lettuce |
| `basil` | `basil_small` | Small Basil |
| `rocket` | `rocket_small` | Small Rocket |
| `coriander` | `coriander_small` | Small Coriander |
| `spinach` | `spinach_medium` | Medium Spinach |
| `small_spinach` | `spinach_small` | Small Spinach |
| `rocket_great_sword` | `rocket_bustersword` | Rocket Buster Sword |
| `the_hand` | `yun_hand` | The Hand |

Renames propagated to all 13 affected files: `BootScene.js`, `upgradeContent.js`, `enemySpawn.js` (spawn pools, sub-pools, `spawnsEnemy` fields), `boss.js`, `handBoss.js`, `handMiniBoss.js`, `enemyDeath.js` (drop table, Hopper split spawn).

**Boss frame size change** — all boss sprites are now 256×256 per frame (was 128×128) with 4 frames: idle (f0–f1) and attack (f2–f3). `BootScene.js` updated to `frameWidth: 256, frameHeight: 256`. Boss scale in `boss.js` halved (was `0.8`, now `0.4`) to maintain the same on-screen footprint. Two named animations now created per boss at spawn: `{key}_idle` (frames 0–1, 4fps) and `{key}_attack` (frames 2–3, 8fps). Attack animations triggered at the start of each boss's signature moves and return to idle when they resolve:
- **Lettuce Beetle**: attack on charge flash/dash, idle on charge expiry
- **Rocket Spider**: attack on leg slam, idle after
- **Carrot Scorpion**: attack on claw swipe and stinger bury start, idle when each ends
- **Mulberry Mantis**: attack during the 400ms strike window after reappear, idle after
- **The Hand (Yun Hand)**: attack on ground slap, tweezers charge, spray, and projectile ring; idle when each resolves

INDEX zoom view updated: boss sprites now play `{key}_idle` (not `{key}_walk`) and are displayed at `setScale(0.4)` to fit the 256×256 frames within the zoom box.

**New multi-frame enemies:**
- `carrot_dart` — 4 frames: idle loop (0–1), darting/flying (2–3). Switches to `carrot_dart_fly` animation when the charge velocity fires; returns to `carrot_dart_walk` when the charge resolves.
- `carrot_mole` — 4 frames: underground idle (0–1), surfacing/attack (2–3). Plays `carrot_mole_attack` when the mole transitions from burrowed to surfaced (500ms, then returns to `carrot_mole_walk`).
- `lettuce_trap` — 3 frames: dormant (0), snap activation (1), post-snap (2). Frames advance in `crickets.js` at the snap trigger point (`trapArmed = false`) — frame 1 immediately, frame 2 after 200ms.
- `rocket_bustersword` — 4 frames (idle 0–1, additional 2–3 available).

**Weapon sprites wired up** — every weapon and evolution that previously spawned a tinted `'cricket'` image now uses its dedicated texture key; tint calls removed and scales halved to compensate for 128×128 vs 64×64:

| Weapon/Evo | New key |
|---|---|
| Poop (travel) | `weapon_poop` |
| Pebble Flick + Sunbaked Ambers ambers | `weapon_pebble_flick` |
| Pupa Mines + Bug Buster mines | `weapon_pupae_mines` / `evol_bug_buster` |
| Skin Shed + Spike Shedder | `weapon_skin_shed` / `evol_spike_shedder` |
| Woodie Bounce + Shining Shells | `weapon_woodie_bounce` / `evol_shining_shell` |
| Branch Throw | `weapon_branch_throw` (keeps `setDisplaySize` for hitbox) |
| Toxic Ocean travel | `evol_toxic_ocean` |
| Log Lob | `evol_log_lob` (keeps `setDisplaySize` for hitbox) |
| Dubia Shields + Dubia Defenders projectile | `dubia_shields` |

Dubia Shields visual changed from `this.add.circle(...)` → `this.add.image(..., 'dubia_shields').setScale(0.14)` in `movement.js`. Hit detection is position-based and unaffected.

*(Sunbaked Ambers has no dedicated sprite yet — uses `weapon_pebble_flick` with an amber tint, flagged for artist.)*

**Enemy projectile sprites wired up** — replaced all reused enemy textures used as projectiles:
- Lettuce Shooter shots: `def.projKey` fallback `'iceberg_lettuce'` → `'projectile_lettuce_shooter'`
- Oregano Fan + Oregano Phantom shots (including death burst): `'oregano_fan'` → `'projectile_oregano_ghost'`
- The Hand phase-4 ring: `'iceberg_lettuce'` → `'projectile_yun_hand_calcium'`
- The Hand phase-3 salad rings + spray: `'iceberg_lettuce'` → `'projectile_yun_hand_vitamin'`

**`sw.js`** — `CACHE_VERSION` bumped `v2` → `v3`; `PRECACHE_URLS` updated to reflect all new and renamed asset paths (old placeholder paths removed, new `enemy_`/`boss_` prefixed paths and the two new folders added).

**`sprites.md`** added to the repo root documenting every sprite file, its dimensions, and frame breakdown.

---

## Session 36 — 2026-08-03

### Two remaining placeholder sprites replaced with dedicated art

**Sunbaked Ambers** — the evolution previously noted as still using `weapon_pebble_flick` with an amber tint (flagged in Session 35) now has its own sprite: `evol_sunbaked_amber.png`. The tint call was removed and the texture key updated to `'evol_sunbaked_amber'` in `evolutions.js`. Already preloaded in `BootScene.js`.

**Mulberry Snake projectile** — the spit projectile was previously using `'iceberg_lettuce'` as the generic shooter fallback (no `projKey` was set in its enemy definition). Now has a dedicated `projectile_mulberry_snake.png`; `projKey: 'projectile_mulberry_snake'` and `projScale: 0.13` added to both Level 4 spawn pool entries in `enemySpawn.js`. The existing `if (def.key !== 'mulberry_snake')` guard that already excluded snake spit from the per-projectile spin (`setAngularVelocity`) was already in place.

`sw.js` — `CACHE_VERSION` bumped `v3` → `v4`; both new asset paths added to `PRECACHE_URLS`. `sprites.md` updated to list both new files.

---

## Session 37 — 2026-08-03

### Resolution upgrade: 800×450 → 1600×900 (honest ×2 scale)

The game's base resolution was doubled from 800×450 to 1600×900. No camera zoom or Phaser scale tricks — every hardcoded pixel value in the game was multiplied by 2.

**`src/main.js`** — `width: 800, height: 450` → `width: 1600, height: 900`.

**World size** — `WORLD_W`/`WORLD_H` 3200×3200 → 6400×6400 in `GameScene.js`. World boundary clamps updated throughout: `64 → 128`, `3136 → 6272` (spawn/boss/wander systems); `32 → 64`, `3168 → 6336` (evolution mine/zone placement where a tighter margin was intentional).

**Player** — `playerSpeed` 320 → 640; `setScale` 0.5 → 1.0; `magnetRange` 64 → 128; `pupaRadius` 140 → 280.

**All enemy spawn pool entries** (`enemySpawn.js`) — `speed` and `scale` doubled for all 35+ entries across pools 1–5. Projectile scales, body sizes, and AI thresholds (wander arrival, melee range, charge speed, scatter ranges) all doubled.

**Boss system** (`boss.js`) — all boss config scales, world HP bar geometry, phase line positions, warning banner, AI speeds (chase, wander, charge), attack ranges and offsets doubled. Top-bar HP bar uses screen-relative `W`/`H` constants so it adapts automatically. `updateBossHealthBar` fully updated.

**Hand boss** (`handBoss.js`, `handMiniBoss.js`) — spawn positions, projectile scales/velocities, mini-boss stats, cyclone ring radius and entity scales, world clamps all doubled.

**Weapon systems** (`baseWeapons.js`, `evolutions.js`) — all projectile scales, velocities, attack radii, claw/branch/log ranges, dust kick lengths, and lineStyle widths doubled.

**HUD** (`hud.js`) — XP bar at y=24, HP bar at y=64; both bars span `W−80` with heights 32/28 and 20/16. Font sizes doubled (kill counter, timer, weapon labels). All bars use `W`/`H` constants so they scale automatically with resolution.

**UI overlays** (`levelUp.js`, `evolutionUI.js`, `gameFlow.js`) — font sizes, card dimensions, overlay positions all doubled. Poison Claw reach descriptions updated to match new pixel values (160/220/280/340px).

**Player movement** (`movement.js`) — off-screen arrow indicators: pad, triangle dimensions, lineStyle widths all doubled. Dubia Shield orbit radii (70→140, 90→180, 120→240), hit detection distance (14→28, 48→96), and shield scale (0.14→0.28) doubled.

**Enemy behaviour** (`crickets.js`) — trap snap range (36→72), wander arrival (40→80), spread formula constants (120/480), magnet speed (220→440), Inflate knockback speed/range all doubled. Hydra phase transition speed bonus and scale formula doubled.

**Enemy death** (`enemyDeath.js`) — all XP insect scales, floating text font/offsets, split-spawn scatter, and phantom death burst scale/velocity doubled.

**`sw.js`** — `CACHE_VERSION` bumped `v4` → `v5` to force PWA cache refresh.

---

## Session 38 — 2026-08-03

### Fix: GameScene.js values doubled twice (×4 instead of ×2)

Session 37's edits to `GameScene.js` were applied twice — a parallel agent that was supposed to touch only the spawn/boss/cricket files also re-edited `GameScene.js`, doubling values that had already been doubled. This produced ×4 values throughout `GameScene.js` while all other files remained correct at ×2.

**Symptoms:** Snapper appeared far too large and moved far too fast compared to the original game feel.

**Fix:** Halved all the over-doubled values in `GameScene.js` back to the correct ×2 targets:

| Property | Wrong (×4) | Correct (×2) |
|---|---|---|
| `playerSpeed` | 640 | 320 |
| `magnetRange` | 128 | 64 |
| `biteRange` | 320 | 160 |
| `tailSlapRange` | 400 | 200 |
| `hissRange` | 480 | 240 |
| `wormWhipRange` | 480 | 240 |
| `pupaRadius` | 280 | 140 |
| `branchWidth` | 80 | 40 |
| `branchLength` | 480 | 240 |
| `dustKickLength` | 720 | 360 |
| Grid stride | 512 | 256 |
| Lettuce Beetle walk speed | `320 × factor` | `160 × factor` |
| `player.setScale` | 1.0 | 0.5 |

No other files were affected — all 17 other JS files were confirmed correct at ×2.

**`sw.js`** — `CACHE_VERSION` bumped `v5` → `v6`.

---

## Session 39 — 2026-08-04

### Bug fixed: enemy/boss/player animations kept playing during pause, countdown, level-up, level-clear, and game-over

Per request. Same root cause family as several earlier sessions' pause-leak bugs (shrink tweens in [Session 22](#session-22--2026-07-07)/[31](#session-31--2026-08-01), the evolutions-menu shake/flash in [Session 28](#session-28--2026-07-28)): Phaser's sprite animation frame-advance runs off the real game loop's delta time, gated only by each animation's own `paused` flag — never by `time.paused`, which this game's pause system exclusively toggles. So every walking/attacking sprite kept flipping frames in real time no matter what overlay was covering the screen.

Fixed with the global switch built for exactly this: `scene.anims` is one `AnimationManager` instance shared across every scene in the game (confirmed live — `bootScene.anims === game.anims`), and `pauseAll()`/`resumeAll()` toggle a `paused` flag on every registered animation *definition*, which every sprite's per-instance `AnimationState.update()` checks before advancing a frame — so one call reaches every enemy, boss, and the player at once, with no per-sprite bookkeeping needed. Added a `blocked` check to `GameScene.update()` (the same `isPaused || isCountdown || isLevelingUp || isLevelClear || isGameOver` condition already driving the shrink-tween pause from Session 31, now computed once and reused for both) that calls `this.anims.pauseAll()`/`resumeAll()` every frame — both calls are internally guarded (no-op if already in that state), so calling them unconditionally every frame is cheap and can't fight itself.

Since the manager is shared game-wide, leaving `GameScene` while still paused (e.g. QUIT TO MAIN MENU from the pause menu) would otherwise leak a globally-paused animation manager into `LevelSelectScene`, freezing its own dex-preview animations forever. Guarded with `this.events.once('shutdown', () => this.anims.resumeAll())` in `create()` — a single choke point that covers every exit path (retry, both death-overlay buttons, level-clear's both buttons, and the pause menu's quit) without needing to touch each one individually.

### A note on verification this session
The Browser pane's `document.visibilityState`-stuck-hidden issue (recurring since [Session 28](#session-28--2026-07-28)) was present again, but this time diagnosed one level deeper: `game.loop.delta`/`game.loop.frame` were themselves stuck at `0`, meaning the real RAF-driven step loop genuinely never advances while the pane reports hidden — not a network/loader-specific stall as previously assumed, since `BootScene`'s loader was still visibly crawling (32/80 assets, `isLoading: true`) rather than fully dead. Confirmed a first verification attempt was actually a false pass for this reason: watching a live sprite's frame stay put during `pauseAll()` proves nothing when nothing advances regardless. Corrected by manually driving `sprite.anims.update(time, delta)` with synthetic timestamps/deltas, bypassing the frozen real loop entirely — confirmed 3 seconds of simulated animation time produced zero frame change while `pauseAll()` was active, then a single further tick advanced the frame immediately after `resumeAll()`. Also verified `scene.anims === game.anims` directly (same object reference) to confirm the shared-instance assumption the whole fix depends on. `node --check` on `GameScene.js` confirmed no syntax errors. Recommend a real playthrough to confirm the visual result: pause mid-fight and see every enemy/boss freeze mid-frame instead of just stopping in place while still animating.

**`sw.js`** — `CACHE_VERSION` bumped `v6` → `v7`.

---

## Session 40 — 2026-08-04

### Enemies doubled in visual size, hitbox grown only 50% (not 100%)

Per request: every regular enemy renders at 2× its old size, but the collision body only grows 1.5× — a deliberate mismatch (visuals read as noticeably chunkier without a proportional difficulty spike from bigger hitboxes), continuing the same "hitbox ≠ visual size" precedent [Session 20](#session-20--2026-07-07) established when it first shrank hitboxes to 75% of the visual sprite.

The shared per-enemy hitbox line in `spawnEnemy()` (`enemySpawn.js`) went from `enemy.body.setSize(enemy.body.width * 0.75, ...)` to `* 0.5625` — derived once and reused everywhere: since `body.width` at that call site is still the *unscaled* raw frame size (Arcade Physics only re-multiplies by the sprite's current `scaleX` on the next physics step, confirmed by reading the vendored `phaser.min.js`'s `Body.updateBounds()`), the final on-screen hitbox works out to `multiplier × frame × newScale`. Solving for "1.5× the old hitbox, given the new scale is already 2× the old scale" gives `multiplier = 0.75 × (1.5/2) = 0.5625`. Every other literal `body.setSize(w, h)` pixel pair tied to a specific enemy's own hitbox override (Coriander Hydra's 165×165, Carrot Mole's 90×60/60×45 burrowed-cycle sizes, Oregano Skunk's 132×132 gas cloud, Coriander Whip's 105×105) got the same `× 0.75` treatment for the identical reason, applied everywhere each one is duplicated: `enemySpawn.js`'s main pools *and* its Coriander Carrot minion sub-spawn, `boss.js`'s Carrot Scorpion stinger-bury, and `handMiniBoss.js`'s Hand-fight reprise of that same stinger-bury.

Every `scale`/`scaleMin`/`scaleMax` value for a regular enemy was doubled — the main level pools (`enemySpawn.js`), every duplicated sub-spawn that mirrors those same enemy types (Spinach Cyclone/Tempest's periodic minion spawns, Mulberry Monstrosity's Bat minion, Coriander Carrot's minion pool, Carrot Scorpion's Mole/Thug bury and its Hand mini-boss reprise, Rocket Spider's Rocket Sword leg-slam/phase-2 ring and its reprise, Mulberry Mantis's phase-2 Cyclone ring and its reprise, and The Hand's own phase-3 enemy-ring `statMap`), the Lettuce Hopper→Small-Lettuce split and Carrot Dart→Carrot-Wheel split (the wheel split is proportional to the dart's own `spawnScale` so it inherited the doubling for free — only its `?? 0.50` undefined-fallback needed bumping to `1.00`), and the Coriander Hydra's live phase-shrink formula in `crickets.js` (`0.64 - (3-heads)*0.08` → `1.28 - (3-heads)*0.16`). Boss sprites themselves (`boss.js`'s `bossCfg.scale`, and `handBoss.js`'s Hand-fight mini-boss *reprise* config, which reuses full boss textures/AI at a reduced scale) were deliberately left untouched — the request was about enemies, and this codebase already treats bosses as a separate sizing category (256×256 frames vs. enemies' 128×128, since [Session 35](#session-35--2026-08-03)).

### INDEX menu: enemy preview now sized relative to each enemy's real in-game scale, frozen independent of any future rebalance

The zoom-in preview previously rendered *every* non-boss enemy at one flat `setScale(1.6)`, so e.g. Carrot Wheel and Mulberry Monstrosity looked identical size in the INDEX despite being wildly different in a real level — this was already true before today's resize and remained true after it (since the enemy-doubling change above doesn't touch this hardcoded constant), so per request it was addressed directly instead of just avoided: `upgradeContent.js`'s `ENEMY_LIST` gained a `scale` field on every non-boss entry, holding each enemy's *original* (pre-2x) in-game scale value from wherever it first appears by level order — intentionally a frozen, independent copy rather than a live read of `enemySpawn.js`'s numbers, specifically so the INDEX's look today can never drift again just because a future session rebalances live gameplay sizes (the "should not affect the enemy index display" half of the request). `LevelSelectScene.js`'s zoom view now does `preview.setScale(entry.scale * 3.2)` for non-boss entries — the `× 3.2` constant is chosen so the game's single most common scale value (0.50, shared by 10 of the 30 regular enemies) lands exactly on the old flat 1.6, so typical enemies look unchanged while outliers now visibly differ (Coriander Hydra 0.64 → 2.05 vs. Small Spinach 0.44 → 1.41). Boss previews keep their existing flat `0.8`, unaffected.

### A note on verification this session
The Browser pane's real-time step loop was confirmed fully frozen again this session (`game.loop.frame` stuck at `0`, `BootScene`'s loader parked at 32/80 — the same underlying issue traced one level deeper in [Session 39](#session-39--2026-08-04)), so no live playthrough was possible. Verified instead: `node --check` on all 8 touched files; grepped every touched file afterward for any remaining un-doubled `scale:`/`setScale(0.…)`/`body.setSize(…)` literal tied to an enemy to confirm nothing was missed and nothing outside the enemy category (player, weapons, projectiles, bosses) was accidentally touched; and — most substantively — spun up a real scene in the already-running (but frame-frozen) game instance and manually drove two `physics.add.sprite` objects with the actual vendored Arcade Physics code through the exact old-vs-new `setScale()`/`body.setSize()`/`body.updateBounds()` sequence used in `spawnEnemy()`, then read back `displayWidth`/`body.width` directly: confirmed the visual size ratio is exactly `2` and the hitbox ratio is exactly `1.5`, empirically proving the `0.5625` multiplier derivation against the real engine rather than just algebra. The INDEX's new relative-sizing formula was checked by hand (0.50 × 3.2 = 1.6, unchanged; 0.64 × 3.2 = 2.048 vs. 0.44 × 3.2 = 1.408) rather than live-rendered. Recommend a real playthrough to confirm the visual result reads as intended (enemies chunkier but not proportionally harder to avoid) and a look at the INDEX's Coriander Hydra vs. Small Spinach entries side-by-side.

### Stray pre-existing bug noticed, not fixed (out of scope)
While touching Coriander Carrot's minion-spawn block (`enemySpawn.js`, around the `spawnsCarrotCori` handler), noticed its Carrot Mole minion still calls `mini.setAlpha(0.25)`/`setAlpha(1)` for the burrow dim — [Session 34](#session-34--2026-08-02)'s "remove partial-alpha abilities" pass explicitly listed removing this exact mechanic from three other copies (the main level-3 spawn, Carrot Scorpion's stinger bury, and the Hand mini-boss reprise of that bury) but missed this fourth copy. Left untouched since it's unrelated to this session's request; flagged separately for a follow-up.

**`sw.js`** — `CACHE_VERSION` bumped `v7` → `v8`.

---

## Session 41 — 2026-08-04

### Touch joystick: usable during the level-up countdown (primes a direction, doesn't move yet) and instantly unpauses + starts moving from pause

Per request, both changes live in `setupTouchJoystick()`'s `startJoystick` gate (`movement.js`), which previously refused to start the joystick at all (`isBlocked()`) while paused, counting down, leveling up, at level-clear, or at game-over — one flat block covering five very different states.

Replaced with `isHardBlocked()` — `(isLevelingUp && !isCountdown) || isLevelClear || isGameOver` — which still fully blocks the joystick during card-picking (full-screen interactive cards) and the level-clear/game-over overlays, but no longer blocks it during the countdown or while paused, each handled specially:

- **Countdown**: needed no new logic at all. `GameScene.update()` already early-returns before calling `handleMovement()` for the whole level-up sequence (`if (this.isLevelingUp) return;`), and `isLevelingUp` stays `true` through the countdown too (only clearing in `levelUp.js`'s `resume()` once it ends) — so even with the joystick now allowed to *start* and track drags via its own always-on `pointermove` listener, nothing calls `setVelocity` on the player until `handleMovement()` runs again after the countdown resolves. At that point it immediately reads whatever `joystickVector` the ongoing drag has already produced — exactly "primed, moves the instant it ends" for free, with zero risk of it firing early.
- **Pause**: `startJoystick` now calls `this.togglePause(this.pauseBtn)` itself the moment a touch starts while paused (after the existing `hitTestPointer` check, so tapping the EVOLUTIONS/QUIT buttons or a volume slider still behaves exactly as before and doesn't also trigger this), then continues on to actually start the joystick in the same synchronous handler — so the same touch that dismisses pause also begins tracking a direction immediately, instead of requiring a first tap to resume and a second one to start moving. If `togglePause()` refuses (the pre-existing 1-second post-open guard in `hud.js`), `isPaused` is still `true` afterward and `startJoystick` bails without starting anything, matching how every other resume path already respects that guard.

No new double-resume risk with the existing generic `_pausePointerHandler` (also registered on `this.input.on('pointerdown', ...)`, added later when pause opens): if it still fires for the same touch event after `startJoystick` has already unpaused, its own `if (this.isPaused && ...)` check is now false, so it's a no-op either way regardless of listener call order.

### A note on verification this session
Same Browser-pane loader/step-loop freeze as recent sessions (`document.visibilityState` stuck `hidden`, `game.loop.frame` stuck at `0`), so no live touch-drag test was possible. Verified via `node --check` on `movement.js`, and — since the change is pure state-machine branching rather than new Phaser mechanics — extracted the exact `isHardBlocked()` expression and the pause-then-start sequence into standalone Node scripts and ran them against every relevant flag combination (countdown, card-picking, plain pause, level-clear, game-over, normal play, a stale pause vs. one still inside the 1s guard window): all matched the intended behavior. Recommend a real touch/mobile pass to confirm the joystick visually appears and drags correctly during a countdown, and that a single touch-and-drag from the pause screen both dismisses it and starts the player moving in one motion.

**`sw.js`** — `CACHE_VERSION` bumped `v8` → `v9`.

---

## Session 42 — 2026-08-04

### New: `src/inputMode.js` — gamepad hints hide on keyboard/touch, reappear on controller use

Per request. Added a small module (mirrors `audio.js`'s module-scope-singleton pattern, since this is one physical player's current input method, shared across every scene transition, not scene-local state) holding a single `usingGamepad` flag:

- `trackInputMode(scene)` — call once per scene in `create()`. Registers `keydown`/`pointerdown` → not-gamepad, gamepad `'down'` → gamepad, plus a per-frame `scene.events.on('update', ...)` poll for stick movement past a 0.3 deadzone (buttons fire discrete events; sticks don't, so this mirrors the continuous-stick-nav polling pattern already used everywhere else in this codebase). `pointermove` deliberately excluded — incidental mouse movement while actually playing on a gamepad shouldn't flicker hints off.
- `registerGamepadHint(text)` — wrap any freshly-created `🎮 ...` hint `Text` object with this. It sets the object's initial visibility to the current mode immediately, and keeps it synced on every later mode change via a shared `Set` — self-unregistering through the object's own `'destroy'` event, so none of the many places these hints get torn down (menu close, tab switch, screen rebuild) need any extra cleanup code.

Wired `trackInputMode()` into `TitleScene`, `LevelSelectScene`, and `GameScene` (not `GameOverScene` — confirmed dead code since [Session 18](#session-18--2026-07-07), never actually reachable). Wrapped all 11 live `🎮 ...` hint texts across the game: Level Select's `Y Index` hint and the INDEX menu's grid/zoom hints, the in-game pause menu's quit/evolutions hint and its volume-slider hint, the level-up screen's `LB/RB Navigate` hint, the death overlay's and level-clear screen's hints, and both of the in-game Evolutions menu's grid/zoom hints.

### Touch/mouse drag-to-scroll on the Evolutions menu and INDEX menu grids

Per the "menu navigation available on touchscreen" half of the request: audited every menu in the game (Level Select, the INDEX menu's 4 tabs, the in-game pause menu including its volume sliders, the Evolutions menu, the level-up card screen, the death overlay, the level-clear screen) and confirmed every button/card/arrow/tab/slider already works identically via touch and mouse — Phaser's `pointerdown`/`drag` handling has covered touch the same as mouse since [Session 27](#session-27--2026-07-13), and that already held true everywhere. The one genuine gap: the two scrollable grids (Evolutions menu in `evolutionUI.js`, INDEX menu's ENEMIES tab in `LevelSelectScene.js`) could only be scrolled by precisely dragging a thin 28px scrollbar tab, the right stick, or a mouse wheel — no swipe-the-content gesture, the natural mobile expectation.

Added generic drag-to-scroll to both grids' viewports: a scene-scoped `pointerdown`/`pointermove`/`pointerup` trio tracks vertical drag distance and feeds it straight into the existing `applyScroll()` function, active only while `mode === 'grid'` and the drag started within the viewport's Y-range. Since a drag starting on a card would otherwise be ambiguous with a tap, switched each grid's card-click handler from `pointerdown` (fires instantly, before any movement is knowable) to `pointerup` gated on `Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.x, pointer.y) < 12` — Phaser's `Pointer` already tracks `downX`/`downY` itself, so this needed no manual per-card tracking. To avoid double-handling when the user drags the scrollbar tab specifically (its own native Phaser `drag` event would otherwise fire alongside my new generic scroll, producing conflicting jumps), added a `thumbInteracting` flag set by the thumb's own `pointerdown` (mirrors `hud.js`'s existing `_sliderInteracting` flag, same conflict-avoidance pattern) and checked by the new generic handler before it starts tracking a drag.

### A note on verification this session
Same Browser-pane loader/step-loop freeze as recent sessions persisted at the start, but this time the audio-stub-and-call-`.create()`-directly workaround from Sessions 31/32 got a genuinely live, interactive `LevelSelectScene` running despite it (stubbed `scene.sound.add` to sidestep the not-yet-loaded `bgm_title` audio key, then called `create()` on the scene's own already-instantiated object). This gave a much stronger check than usual: first validated `inputMode.js`'s exact module code in isolation via a faithful fake-Phaser-scene Node harness (registration, initial-visibility-on-register, mode flips on keydown/pointerdown/gamepad-down/stick-poll, and that a destroyed hint safely stops reacting) — all passed. Then, in the live scene: confirmed both live gamepad hints (`🎮 Y Index` and the INDEX menu's grid hint) start hidden by default; simulated a real `gamepad.emit('down', ..., {index:0})` and confirmed both immediately became visible, including a hint freshly created *after* the mode was already gamepad (proving the "reflects current mode at registration time" behavior, not just "reacts to changes"); simulated a `keyboard.emit('keydown', ...)` and confirmed both hid again. For the drag-scroll: navigated to the ENEMIES tab (the one section that actually overflows), read a real card's `y` position, dispatched a synthetic `pointerdown`→`pointermove` (upward 150px) sequence directly through `scene.input.emit(...)`, and confirmed the card moved exactly 150px in the matching direction — the actual `applyScroll()` code path, not a mock. `node --check` on all 9 touched/added files, plus grepped for any leftover un-wrapped `🎮` hint or stray `pointerdown` card handler that should've become `pointerup` — none found. Didn't get to live-test the in-game Evolutions menu specifically (would need a full `GameScene` with a player/enemies/physics groups, much heavier to fake than `LevelSelectScene`), but it's the identical code pattern already proven working above, so this is lower-risk than usual. Also curled all 113 `sw.js` `PRECACHE_URLS` (added `/src/inputMode.js`) against a live dev server and confirmed every one returns 200.

### Docs updated
[README.md](README.md)'s controls table gained a **Touch** column (previously undocumented despite the touch joystick existing since [Session 27](#session-27--2026-07-13)) plus a note on the new hint auto-hide/show behavior.

**`sw.js`** — `CACHE_VERSION` bumped `v9` → `v10`; `/src/inputMode.js` added to `PRECACHE_URLS`.

---

## Session 43 — 2026-08-04

Five separate requests landed this session.

### New: in-run score, shown in the pause menu, with a per-level high score on Level Select

`Score = playerLevel × 10 + kills + foodboxesCollected × 10 + treasuresCollected × 1000`, per request. Added `this.score`, `this.foodboxesCollected`, `this.treasuresCollected` to `GameScene`'s stat block (alongside `kills`/`damageDealt`/`rerolls`), and a new `updateScore()` in `hud.js` that recomputes `this.score` from those four numbers and checks it against the per-level high score. Wired a call to it at every site where one of those four numbers actually changes: `enemyDeath.js`'s `kills++` and its Starved Chomp instant-level-up loop, and `crickets.js`'s Foodbox pickup (new `foodboxesCollected++`), Treasure pickup (new `treasuresCollected++`), and the normal XP-overflow level-up — recomputing (and re-banking the high score) continuously through a run rather than only at the end, so it's still recorded even if the player quits mid-run. Added to the pause menu's existing stats line, right after `Level N`.

High scores persist per world-level (1–5) via a new `highScores` bucket in `progressIndex.js` (`recordHighScore`/`getHighScore`, same "only ever raises" pattern as `recordWeaponLevel`) and render next to each level's button on Level Select, positioned off the button's actual rendered right edge (widths vary per level name) rather than a fixed offset — only for unlocked levels, rebuilt alongside the buttons themselves when ALL LEVELS is toggled.

### New: BACK button on Level Select

Top-left corner (mirroring INDEX's top-right placement), returns to `TitleScene` — the same destination gamepad B already had, now with a touch/mouse equivalent.

### INDEX: enemy size qualifiers removed except Small Spinach

Per request, `upgradeContent.js`'s `ENEMY_LIST` labels for `lettuce_small`/`basil_small`/`rocket_small`/`coriander_small`/`spinach_medium` dropped their "Small"/"Medium" prefix (→ Lettuce, Basil, Rocket, Coriander, Spinach); `spinach_small` explicitly kept as "Small Spinach" per the stated exception. Texture keys, home levels, and in-game behavior are untouched — display label only.

### Enemies now flip to face the direction they're actually moving

The regular per-frame chase movement in `attractCrickets()` (`crickets.js`) previously never touched `flipX`, so every enemy's sprite always rendered in its texture's default orientation regardless of which way it was walking. Since this game's enemy art faces left by default (the same default the player's own sprite doesn't share — `movement.js`'s player flip was already the opposite convention: unflipped = facing right), added `setFlipX(true)` when the enemy's computed horizontal velocity is positive (moving right) and `setFlipX(false)` when negative, in both the main chase branch and the separate wanderer branch (Spinach Cyclone/Tempest, using the sign of `wanderTarget.x - enemy.x` instead of a velocity component, since `physics.moveTo` computes velocity internally). Scoped to just this one shared function — enemies mid-charge/dash/leg-slam (Carrot Dart, Rocket Buster Sword, boss attacks) return out of `attractCrickets()` before reaching movement at all and have their own separate velocity-setting code, left untouched as a reasonable scope boundary given how many special-case attack movements exist across `enemySpawn.js`/`boss.js`/`handMiniBoss.js`.

### Level-up cards can't be picked until 1000ms after the screen opens

Per request. Both selection paths — a card's own `pointerdown` and gamepad A — now check a `selectionReady` flag that starts `false` and flips to `true` via `setTimeout(..., 1000)` when `showLevelUp()` opens. Uses `setTimeout` rather than `this.time.delayedCall` since `this.time` is paused for the entire level-up screen (the exact same reason `pickCard()`'s own 3-2-1 countdown a few lines below already had to use `setTimeout`). Scoped as a local closure variable (not a scene property), so each individual level-up screen — including ones chained back-to-back via `pendingLevelUps` — gets its own fresh 1000ms window. Reroll is unaffected (not a "selection").

### A note on verification this session
Same Browser-pane frozen step-loop as recent sessions, but the audio-stub-and-call-`.create()`-directly workaround got `LevelSelectScene` genuinely live again. Confirmed end-to-end, against the real running module code: `recordHighScore(1, 4321)` via a live dynamic `import()`, followed by tearing down and rebuilding the scene's display list, showed `High Score: 4321` next to Level 1's button; emitting a real `pointerdown` on the `[ BACK ]` text confirmed `scene.start('TitleScene')` fires; read `ENEMY_LIST` directly and confirmed all 5 renamed labels plus the untouched `Small Spinach` exception. For the two pieces too deep in `GameScene` to spin up live, called the actual exported functions directly with a minimal fake `this`: `HudMethods.updateScore.call(...)` with `{level:3, playerLevel:5, kills:42, foodboxesCollected:2, treasuresCollected:1}` produced exactly `1112` (`5×10+42+2×10+1×1000`) and correctly banked it as level 3's high score via the real `progressIndex.js`; calling it again with lower stats confirmed the banked high score didn't drop. For the flip fix, called `CricketMethods.attractCrickets.call(...)` with two fake enemies (one needing to move left to reach the player, one needing to move right) against a fake `player`/`time`/`enemies`/`crickets` and confirmed the real function set `flipX: false` for the leftward-moving one and `flipX: true` for the rightward-moving one. Didn't get a live check on the level-up 1000ms gate specifically (`showLevelUp()` pulls in far more `GameScene` state — the full weapon/boost card pool — than was practical to fake this session); it's a direct structural copy of the countdown timer three lines below it in the same function, which is already proven working, so lower risk than usual. `node --check` on all 8 touched/added files.

**`sw.js`** — `CACHE_VERSION` bumped `v10` → `v11`.

---

## Session 44 — 2026-08-04

### Bug fixed: stationary/immobile enemies (Lettuce Shooter, dormant traps, immobilized enemies) physically blocked the crowd instead of letting it pass through

Per request. `GameScene.js`'s enemy-vs-enemy registration was a single `physics.add.collider(this.enemies, this.enemies, fireSpreadCallback, null, this)` — a real Arcade Physics **collider** (not overlap), meaning every enemy pair that touched got physically pushed apart, with zero exceptions. A stationary Lettuce Shooter or Oregano Fan (`speed: 0`), a dormant Lettuce Trap waiting to be triggered, or any enemy currently frozen by an immobilize effect (Bug Catcher, Steel Slam, Duststorm, Four Chills, etc.) therefore acted as a solid wall the rest of the crowd had to path around, instead of being something enemies could walk straight through the way a "can't move" obstacle logically should allow.

Added `isEnemyImmobile(enemy)` to `crickets.js` (next to the existing `canDamageEnemy` shared-state helper): `enemy.speed === 0 || enemy.trapArmed || enemy.bugCaught` — covers permanently-stationary types, Carrot Mole while surfaced (its `speed` is set to `0` whenever surfaced, per its existing burrow-cycle code), the dormant-trap state, and any weapon-driven immobilize.

Split the single collider into two independent registrations in `GameScene.js`, since Arcade Physics ties a collider's callback to whether its process callback allows separation to actually happen — there's no single API call that means "detect the touch but only sometimes push apart":
- `physics.add.overlap(this.enemies, this.enemies, fireSpreadCallback, null, this)` — unconditional, unchanged from before; fire-spread (`trySpreadFire`) keeps working exactly as it always has regardless of whether either enemy can move, since catching fire from a passing enemy you're touching doesn't depend on being physically shoved.
- `physics.add.collider(this.enemies, this.enemies, null, (a, b) => !this.isEnemyImmobile(a) && !this.isEnemyImmobile(b), this)` — physical push-apart only, with no callback of its own (`null`), skipped entirely whenever either enemy in the pair is currently immobile.

### A note on verification this session
Hit a real dead end trying to verify this the way recent sessions have (manually driving Arcade Physics from devtools against the frozen Browser-pane loop): calling `world.step(t)` — and separately `world.update(t, delta)` — directly, then reading sprite `.x`/`.y`, showed **zero movement even for two perfectly ordinary, fully-overlapping enemies with an unmodified stock collider**, i.e. the baseline itself appeared broken before any of my changes were even involved. Chased this for a while (checked `intersects()` directly — true; checked `world.separate()`'s own return value — true; checked body `velocity`/`overlapX` after separation — untouched), and concluded the manual fixed-timestep stepping this environment requires (there's no real RAF loop to observe) just doesn't reliably reproduce Arcade Physics's actual per-frame position commit outside its normal harness — a limitation of the verification method, not evidence of an engine bug (this collider is bog-standard, unmodified Phaser API being used exactly as documented).

Rather than trust an inconclusive position-based test, verified the actual thing this session's change controls — the process-callback gate — directly against the real `world.separate()` function, which per its own source (read from the vendored `phaser.min.js`) exits immediately and skips all separation math the instant the process callback returns `false`, before touching either body. Called it with the real `isEnemyImmobile`-based process callback across four cases: one enemy immobile via `speed: 0` → `false` (correctly skipped); both normal → `true` (real separation still attempted, confirming ordinary enemy-vs-enemy blocking is unchanged); immobile via `bugCaught` → `false`; immobile via `trapArmed` → `false`. All four matched expectations exactly. Also re-confirmed (from the very first test, before chasing the position-tracking dead end) that the separate overlap registration's fire-spread callback still fires for both an immobile-involved pair and a fully-normal pair alike. `node --check` on both touched files. Recommend a real playthrough near a Lettuce Shooter or a dormant Lettuce Trap with a crowd of regular enemies nearby to visually confirm they now path straight through it instead of bunching up against it.

**`sw.js`** — `CACHE_VERSION` bumped `v11` → `v12`.

---

## Session 45 — 2026-08-04

### Pause menu: EVOLUTIONS/QUIT buttons pushed further down, away from the Boosts line

Per request. `hud.js`'s existing dynamic layout (`evoQuitY = min(H-50, pauseBoostLine.y + pauseBoostLine.height + gap)`, added [Session 13](#session-13--2026-07-07)) already read the Boosts line's real rendered height so the row wouldn't overlap a wrapped loadout — just with too small a buffer. Bumped the gap from `20` to `50`. Verified live: with a real `togglePause()` call, the button row now sits exactly 50px below the Boosts text's actual bottom edge (previously 20).

### Snapper (the player) is 50% larger

`GameScene.js`: `player.setScale(0.5)` → `0.75`. Verified live — a real `GameScene.create()` call confirms `player.scaleX === 0.75`.

### Log Lob knockback reduced, so it doesn't repeat-hit an enemy excessively

`evolutions.js`'s `doLogLob()`: knockback speed dropped from 120 to 60. The existing design (from [Session 30](#session-30--2026-08-01)) deliberately knocks a hit enemy a short distance so it drifts back into the log's path for 2-3 repeat hits rather than one — but with the log itself now twice as big (see below), the same knockback distance was overshooting that intent. Halved to compensate.

### Player and enemy projectiles doubled in size

Per request ("these projectiles also include pupa mines, dubia shields, and so on" — read broadly, covering every weapon-spawned physics object, not just things that fly through the air). Doubled every projectile `setScale`/`setDisplaySize` value across the game:

- **`baseWeapons.js`**: Poop (0.30→0.60), Pebble Flick (0.20→0.40), Pupa Mines (both spawn sites, 0.30→0.60), Skin Shed (0.56→1.12), Woodie Bounce (0.28→0.56).
- **`evolutions.js`**: Toxic Ocean (0.36→0.72), Sunbaked Ambers (0.22→0.44), Bug Buster (0.32→0.64), Spike Shedder (0.60→1.20), Shining Shells (0.30→0.60), Dubia Defenders' fired shot (0.24→0.48), Log Lob (280×56 → 560×112, both display size and physics body).
- **`movement.js`**: Dubia Shields (0.28→0.56) — plus its hand-rolled hit-detection distances (it's a plain `add.image` with manual `Phaser.Math.Distance.Between` checks, not physics overlap, so scale alone doesn't affect what it actually hits): 28→56 for enemies, 96→192 for the boss, so the bigger shield's hitbox now matches what it visually looks like.
- **`enemySpawn.js`**: the generic shooter fallback scale (0.12→0.24, used by Lettuce Shooter), Oregano Fan's shot (0.28→0.56, both level-2 and level-5 pool entries), Mulberry Snake's spit (0.26→0.52, both entries), Oregano Phantom's live shot (0.28→0.56).
- **`handBoss.js`**: The Hand's phase-4 10-projectile ring (0.36→0.72), phase-3 30-projectile rings (0.36→0.72), phase-4 heavier 2-ring volley (0.40→0.80).
- **`enemyDeath.js`**: Oregano Phantom's death-burst projectiles (0.28→0.56).

Every one of these uses a real Arcade Physics body auto-sized from the sprite's scale (no separate hitbox reduction the way enemies themselves have — see [Session 40](#session-40--2026-08-04)), so doubling the visual scale correctly doubles the actual hit area too, with the single exception of Dubia Shields noted above.

**Deliberately left untouched**: Branch Throw's bar dimensions, which are controlled by `this.branchWidth`/`this.branchLength` player stats rather than a fixed scale. Investigating this turned up a separate, pre-existing bug — `levelUp.js`'s upgrade tiers set `branchLength` to `180`/`240`, stale pre-[Session 37](#session-37--2026-08-03) values that were never doubled alongside `GameScene.js`'s own already-doubled initial `240`, so picking "Wider branch" today actually *shrinks* it (240→180) instead of growing it. Doubling just the initial constant without also fixing this would make it worse, so left alone this session and flagged separately (spawned as a follow-up task) rather than guessing at a fix while also trying to land the projectile-size change.

### A note on verification this session
The Browser pane's frozen step-loop was present again, but this session the audio-stub-and-call-`.create()`-directly workaround worked on `GameScene` itself for the first time (previous sessions only managed it for the lighter `LevelSelectScene`) — all the key textures (`snapper`, `weapon_poop`, `dubia_shields`, `evol_log_lob`) turned out to already be loaded despite the stuck loader, so a real, fully-initialized `GameScene` (physics groups, colliders, timers, the works) came up cleanly. This gave much stronger verification than the process-callback-only approach used last session: confirmed `player.scaleX === 0.75` directly; called `doPoop()`/`doPebbleFlick()` for real and read the spawned sprites' actual `scaleX` (0.60, 0.40); called `doLogLob()` and read the spawned log's real `displayWidth`/`displayHeight`/`body.width`/`body.height` (560×112, all four); called `createDubiaShield()` and read its scale (0.56); for the shield's hit-detection range specifically, positioned a real enemy sprite at exactly 55px and separately 57px from the shield and called the actual `updateDubiaShields()` — the 55px enemy took real damage, the 57px one didn't, precisely confirming the 56px boundary (had to work around `this.time.now` being frozen at `0` — since the loop never runs — which was making the shield's 800ms hit-cooldown check `0 - 0 < 800` incorrectly block every "first" hit regardless of distance; fixed by manually advancing `gs.time.now` before each check, a test-harness-only adjustment). Confirmed the pause-menu button positioning fix by calling the real `togglePause()` and reading back `_evoBtnText.y` relative to the actual rendered `pauseBoostLine` bounds. `node --check` on all 8 touched files. The Log Lob knockback value itself (a plain constant, no interesting logic to exercise) was confirmed by fetching the actually-served file content rather than executed. Recommend a real playthrough to confirm the bigger projectiles/player/log all read well visually together and that Log Lob no longer visibly over-hits.

**`sw.js`** — `CACHE_VERSION` bumped `v12` → `v13`.

---

## Session 46 — 2026-08-05

### Bite attack (and Starved Chomp evolution) range increased 25%

Per request. The bite attack's "size" is entirely controlled by `this.biteRange` — a single pixel-radius value used for both the `Phaser.Math.Distance.Between` damage hitbox check and the visual circle flash drawn in `doBite()` / `doStarvedChomp()`. Making it 25% bigger means scaling every value that contributes to `biteRange` by ×1.25 across three files:

- **`GameScene.js`**: base `biteRange` 160 → **200**.
- **`levelUp.js`**: the three bite upgrade deltas — L2 +15 → **+19**, L3 +20 → **+25**, L4 +20 → **+25** — and the Hunter Instinct passive's per-stack bite bonus +25 → **+31**. Card descriptions updated to match.
- **`evolutions.js`**: `evolveToStarvedChomp()`'s one-time evolution range bonus +30 → **+38**.

`doStarvedChomp()` reads `this.biteRange` directly for both the hitbox distance check (line 110) and the green circle visual (line 128), so no changes were needed there — the scaling propagates automatically.

Range progression after this change (all values ≈ ×1.25 of previous):

| State | Old | New |
|---|---|---|
| Base | 160 | 200 |
| After L2 upgrade | 175 | 219 |
| After L3 upgrade | 195 | 244 |
| After L4 upgrade | 215 | 269 |
| After Starved Chomp evolution | 245 | 307 |
| Max (+ 5× Hunter Instinct) | 370 | 462 |

`GAME_REFERENCE.md` updated: Bite table ranges corrected (they were stale pre-2x-upscale values — the base was showing 80 instead of the actual 160), Hunter Instinct passive entry split to show Bite's now-distinct +31 vs the other weapons' unchanged +25, and Starved Chomp evolution row updated from +30 → +38.

**`sw.js`** — `CACHE_VERSION` bumped `v13` → `v14`.
