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
