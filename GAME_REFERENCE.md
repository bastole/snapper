# Salad Slayer: Snapper — Game Reference

---

## Table of Contents

1. [Weapons](#weapons)
2. [Passive Boosts](#passive-boosts)
3. [Evolutions](#evolutions)
4. [Levels & Enemies](#levels--enemies)
5. [Bosses](#bosses)
6. [Items & Drops](#items--drops)

---

## Weapons

All weapons fire automatically. The player starts with **Bite**. All others are unlocked via level-up cards.

---

### Bite
Always active. AOE circle centred on Snapper.

| Level | Damage | Range | Cooldown | Notes |
|---|---|---|---|---|
| 1 (default) | 20 | 80 | 3000ms | — |
| 2 | 30 | 95 | 2000ms | — |
| 3 | 45 | 115 | 2000ms | — |
| 4 | 60 | 135 | 2000ms | Slows hit enemies to 50% speed for 2s |

Max level: **4**

---

### Tail Slap
Arc behind Snapper (opposite to movement direction).

| Level | Damage | Arc | Cooldown |
|---|---|---|---|
| 1 | 25 | 60° | 4000ms |
| 2 | 25 | 180° | 4000ms |

Max level: **2**

---

### Poop
Fires a projectile that lands and creates a damaging field. Only offered at player level 20+.

| Level | Damage/tick | Field Radius | Field Duration | Cooldown |
|---|---|---|---|---|
| 1 | 15 (per 500ms) | 120 | 3000ms | 8000ms |
| 2 | 15 | 120 | 6000ms | 8000ms |

Max level: **2**

---

### Pebble Flick
Fires piercing pebbles toward the nearest enemy.

| Level | Damage | Pebbles | Pierce | Cooldown |
|---|---|---|---|---|
| 1 | 15 | 3 | 1 | 8000ms |
| 2 | 15 | 9 | 3 | 8000ms |

Max level: **2**

---

### Hiss
Slows enemies in a cone. No damage.

| Level | Arc | Slow | Slow Duration | Cooldown |
|---|---|---|---|---|
| 1 | 45° | 50% speed | 2s | 5000ms |
| 2 | 90° | 50% speed | 2s | 5000ms |

Max level: **2**

---

### Lick
Tongue attack targeting the nearest enemy.

| Level | Damage | Tongues | Range | Cooldown |
|---|---|---|---|---|
| 1 | 40 | 1 | 90 | 3500ms |
| 2 | 40 | 2 | 120 | 3500ms |
| 3 | 40 | 3 | 150 | 3500ms |

Max level: **3**

---

### Worm Whip
Alternating left/right arc attack (117° per side).

| Level | Damage | Behavior | Range | Cooldown |
|---|---|---|---|---|
| 1 | 25 | Alternates sides | 120 | 3000ms |
| 2 | 25 | Both sides simultaneously | 160 | 3000ms |

Max level: **2**

---

### Pupa Mines
Drops exploding mines that slide out from Snapper. 10s fuse.

| Level | Damage | Blast Radius | Mines | Cooldown |
|---|---|---|---|---|
| 1 | 50 | 70 | 1 | 6000ms |
| 2 | 50 | 70 | 3 | 6000ms |
| 3 | 50 | 70 | 5 | 6000ms |

Max level: **3**

---

### Skin Shed
Flings shed skin pieces outward; they arc down under gravity and despawn after 1000ms.

| Level | Damage | Pieces | Cooldown |
|---|---|---|---|
| 1 | 45 | 1 | 5000ms |
| 2 | 45 | 2 | 5000ms |

Max level: **2**

---

### Woodie Bounce
Launches a bouncing woodlouse that ricochets between enemies. Initial launch aims at the nearest enemy; each bounce re-aims randomly.

| Level | Damage | Woodlice | Bounces | Cooldown |
|---|---|---|---|---|
| 1 | 40 | 1 | 2 | 8000ms |
| 2 | 40 | 2 | 3 | 8000ms |
| 3 | 40 | 3 | 5 | 8000ms |

Max level: **3**

---

### Dubia Shields
Amber circles that orbit Snapper and damage anything they touch. Hit cooldown: 800ms per enemy.

| Level | Damage | Shields | Orbit Radius | Speed |
|---|---|---|---|---|
| 1 | 20 | 2 | 90 | 1.2 rad/s |
| 2 | 20 | 3 | 90 | 1.6 rad/s |
| 3 | 20 | 4 | 90 | 2.0 rad/s |
| 4 | 20 | 4 inner + 5 outer | 70 / 120 | Opposite directions |

Max level: **4**

---

### Poison Claw
Lunges a claw at the nearest enemy and applies poison (6 dmg/500ms).

| Level | Damage | Range | Poison Duration | Cooldown |
|---|---|---|---|---|
| 1 | 15 | 80 | 3s | 4000ms |
| 2 | 15 | 110 | 5s | 4000ms |
| 3 | 15 | 140 | 6s | 4000ms |
| 4 | 15 | 170 | 7s | 4000ms |

Max level: **4**

---

### Branch Throw
Fires a wide bar sideways (perpendicular to the nearest enemy). Breaks after N hits; despawns after 15s.

| Level | Damage | Bar Length | Max Hits | Cooldown |
|---|---|---|---|---|
| 1 | 22 | 120 | 15 | 6000ms |
| 2 | 22 | 180 | 15 | 6000ms |
| 3 | 22 | 240 | 15 | 6000ms |
| 4 | 22 | 240 | 30 | 6000ms |

Max level: **4**

---

### Dust Kick
Beam of dust fired behind Snapper (opposite movement). Slows all hit enemies to 50% speed.

| Level | Damage | Beam Length | Slow Duration | Cooldown |
|---|---|---|---|---|
| 1–4 | 8 | 180 | 2s | 15000ms |
| 5 | 8 | 400 | 10s | 15000ms |

Max level: **5**

---

### Lucky Scratch
A random X-shaped scratch mark within 80px of Snapper. Hit enemies gain a bonus drop chance for the rest of that enemy's life.

| Level | Damage | Radius | Drop Bonus | Cooldown |
|---|---|---|---|---|
| 1 | 15–25 | 60 | +12% Foodbox | 12000ms |
| 2 | 15–25 | 60 | +12% Foodbox, +5% Treasure | 12000ms |
| 3 | 15–25 | 80 | +12% Foodbox, +5% Treasure | 12000ms |

Max level: **3**

---

### Cold Glare
Freezes all enemies within range to 15% speed. Level 2 reduces cooldown; level 3 finishes the cooldown reduction and starts extending slow duration; level 4 extends slow duration further.

| Level | Range | Slow Duration | Cooldown |
|---|---|---|---|
| 1 | 120 | 1s | 30000ms |
| 2 | 120 | 1s | 20000ms |
| 3 | 120 | 4s | 15000ms |
| 4 | 120 | 10s | 15000ms |

Max level: **4**

---

## Passive Boosts

Passives stack with each pick up to their cap.

| Boost | Max | Per Pick |
|---|---|---|
| **Inflate** | 1 | On taking damage: knocks back all enemies within 110px (220px/s, 15 dmg, 150ms) |
| **Shiny Scales** | 2 | Pick 1: 30% chance to deflect projectiles back (20 dmg to enemy). Pick 2: 60% chance |
| **Angry** | 5 | +30 movement speed |
| **Aura Farming** | 5 | +10 damage to all active weapons |
| **Hunter Instinct** | 5 | +25 to Bite/Tail Slap/Hiss/Worm Whip range; +25 to Lick range; +15 to Pupa Mine blast radius; +40 to Dust Kick length |
| **Basking** | 5 | −150ms cooldown on all weapon timers (minimum 300ms); −1500ms Cold Glare cooldown |
| **Bug Bucket** | 5 | +25 max HP and current HP |
| **Well Fed** | 3 | Speeds up passive HP regen (base: 1 HP / 20s) |
| **Hungry Forager** | 4 | +80 pickup magnet range (base 32px) |
| **Hard Scales** | 4 | −2 contact damage from all enemies (min 1) |
| **Polycephaly** | 4 | +10% chance per attack to fire a second time (10→20→30→40%); re-entrancy guarded — no chains |
| **Venom** | 3 | Pick 1: 15% poison chance, 2.0s. Pick 2: 25%, 2.5s. Pick 3: 35%, 3.0s. Poison ticks 3 dmg/500ms |
| **Vitamin Supplements** | 4 | +2% to base Foodbox/Treasure drop chance per pick |
| **Big Fangs** | 4 | Chance to heal on kill. Pick 1: 5%/5% max HP. Pick 2: 9%/8%. Pick 3: 14%/14%. Pick 4: 18%/20% |
| **Hyperactivity** | 3 | Pick 1: +25 speed for 5s every 70 kills. Pick 2: +50 speed for 12s every 40 kills. Pick 3: +75 speed for 20s every 24 kills |
| **Bug Catcher** | 3 | Chance to immobilize an enemy that hits you. Pick 1: 10%/2s. Pick 2: 17%/6s. Pick 3: 25%/10s |

---

## Evolutions

An evolution permanently replaces a weapon with a more powerful form. **Requirement**: weapon at max level + at least 1 pick of the paired boost. Apply from the **EVOLUTIONS** screen in the pause menu (the pause button glows gold when one is ready).

| Evolution | Replaces | Paired Boost | What It Does |
|---|---|---|---|
| **Starved Chomp** | Bite ×4 | Hungry Forager | Kills grant 2× XP instantly with no insect drop. +20 dmg, +30 range on top of maxed Bite |
| **Steel Slam** | Tail Slap ×2 | Hard Scales | 180° arc; dmg ×1.8; 400px/s knockback (150ms window); immobilises hit enemies for 500ms (8s cooldown per enemy) |
| **Toxic Ocean** | Poop ×2 | Well Fed | 3 toxic fields per cast; radius ×1.4; dmg ×1.5; slows enemies 50% for 2s; fields drift toward enemy clusters |
| **Sunbaked Ambers** | Pebble Flick ×2 | Basking | 30 ambers in a full 360° ring every 8s; burns hit enemies for 3.5s (6 dmg/300ms); burning enemies spread fire on contact for 1s (3s contagion cooldown) |
| **Raging Roar** | Hiss ×2 | Angry | Always-active rotating 60° cone (~69°/s); 12 dmg per 500ms tick; slows all enemies inside to 50% (refreshes every tick); no timer — runs every frame |
| **Sticky Shot** | Lick ×3 | Vitamin Supplements | 5 tongues every 1.5s; dmg ×1.5; slows hit enemies 50% for 2s |
| **Acid Snake** | Worm Whip ×2 | Venom | Both sides simultaneously; 160° arc every 3.5s; poisons 6s; slows 50% for 2s |
| **Bug Buster** | Pupa Mines ×3 | Bug Catcher | 8–12 mines per cast; blast radius ×2; flat 65 dmg; fuse 45s; each kill drops a standard Pupa Mine + normal XP insect |
| **Spike Shedder** | Skin Shed ×2 | Big Fangs | 3 skins per cast every 8s; dmg ×2.5; heals 1 HP per 10 kills (tracked globally while active) |
| **Shining Shells** | Woodie Bounce ×3 | Shiny Scales | 3 shells every 4s; dmg ×2.5; unlimited ricochets for 25s; auto-aims nearest enemy after each bounce; kills trigger a small explosion |
| **Dubia Defenders** | Dubia Shields ×4 | Bug Bucket | Shields spin 1.5× faster; each fires a projectile every 5s (dmg = base+15, speed 350); +20 base shield damage |
| **Flashclaw** | Poison Claw ×4 | Hunter Instinct | Double strike (second fires 200ms later); 25 dmg per strike; poisons 6s; immobilises 1s (10s cooldown per enemy) |
| **Log Lob** | Branch Throw ×4 | Aura Farming | 2 logs rolling in opposite perpendicular directions; dmg ≈48; unbreakable for 25s; slight knockback (60px/s) |
| **Duststorm** | Dust Kick ×5 | Inflate | Width 100, length ×1.6; 15 dmg; slows 50% for 3s; immobilises enemies within 80px for 1.5s (12s cooldown per enemy) |
| **Lucky Thrash** | Lucky Scratch ×3 | Hyperactivity | 8–14 scratch marks per cast, radius 90, dmg 20–35; hit enemies gain +25% Foodbox, +15% Treasure, +8% Fullbox drop boost |
| **Four Chills** | Cold Glare ×4 | Polycephaly | 350px range every 25s; slows all to 15% for 8s; the 8 closest enemies are immobilised and have their HP halved (15s cooldown per enemy; bosses: slowed only, no HP halve) |

---

## Levels & Enemies

Enemy damage is contact damage (1s cooldown per enemy). Enemies introduced at a given time appear in the spawn pool from that point onward. Spawn rate starts at 2500ms and ramps down every 10s, capping at 400ms.

---

### Level 1 — Lettuce & Basil

| Enemy | HP | Dmg | Speed | Intro | Special |
|---|---|---|---|---|---|
| Iceberg Lettuce | 15 | 5 | 60 | 0:00 | — |
| Basil | 25 | 5 | 60 | 0:00 | — |
| Lettuce Hopper | 60 | 8 | 45 | 2:00 | On death: splits into 2 Iceberg Lettuces (HP 40, speed 60) |
| Lettuce Shooter | 90 | 6 | 0 | 5:00 | Stationary. Fires a projectile at player every 5–15s (speed 160) |
| Basil Propeller | 120 | 10 | 180 | 8:00 | — |

**Drops**: Cricket, Vitaworm (Hopper), Mealworm (Shooter), Dragonfly (Propeller)

---

### Level 2 — Rocket & Oregano

| Enemy | HP | Dmg | Speed | Intro | Special |
|---|---|---|---|---|---|
| Rocket | 20 | 8 | 70 | 0:00 | — |
| Oregano Skunk | 40 | 10 | 50 | 0:00 | Contact applies 2-tick poison to player |
| Rocket Knife | 10 | 15 | 150 | 2:00 | — |
| Oregano Ghost | 80 | 12 | 35 | 5:00 | — |
| Oregano Fan | 60 | 8 | 0 | 5:00 | Stationary. Fires a poisonous projectile every 5–15s |
| Rocket Sword | 50 | 18 | 155 | 8:00 | — |

**Drops**: Cricket, Vitaworm (Knife, Skunk), Mealworm (Ghost, Fan), Dragonfly (Sword)

---

### Level 3 — Coriander & Carrot

| Enemy | HP | Dmg | Speed | Intro | Special |
|---|---|---|---|---|---|
| Coriander | 30 | 10 | 72 | 0:00 | — |
| Coriander Whip | 60 | 14 | 55 | 2:30 | Lash attack every 1–2s within 56px |
| Carrot Mole | 75 | 12 | 0/80 | 4:00 | Burrows every 3–10s (3–5s underground, invulnerable while burrowed) |
| Coriander Hydra | 220 | 13 | 38 | 7:00 | Loses a head at 2/3 and 1/3 HP; each loss grants +18 speed and reduces scale |
| Carrot Dart | 40 | 17 | 145 | 8:00 | Scale randomised (0.18–0.35). Charges every 3–6s (600px/s). On death: 2 Carrot Wheels |
| Carrot Wheel | 22 | 9 | 130 | 8:00 | — |
| Carrot Thug *(boss only)* | 300 | 15 | 180 | — | Spawned by Carrot Scorpion's stinger bury |

**Drops**: Cricket, Vitaworm (Whip, Mole), Mealworm (Ghost, Hydra, Wheel), Dragonfly (Dart)

---

### Level 4 — Spinach & Mulberry

| Enemy | HP | Dmg | Speed | Intro | Special |
|---|---|---|---|---|---|
| Spinach | 35 | 11 | 68 | 0:00 | — |
| Small Spinach | 18 | 5 | 110 | 0:00 | — |
| Mulberry Bat | 50 | 13 | 140 | 2:30 | — |
| Mulberry Snake | 95 | 15 | 48 | 5:00 | Fires a projectile every 5–15s; tail whip within 65px every 2–4s |
| Spinach Cyclone | 200 | 20 | 35 | 7:00 | Rare (20% spawn chance). Wanders camera. Spawns Small Spinach every 6–12s |

**Drops**: Cricket, Vitaworm (Bat), Mealworm (Snake), Dragonfly (Cyclone)

---

### Level 5 — The Garden

Inherits enemies from all prior levels (mixed spawn pool) plus the following exclusives (all introduced at 7:00):

| Enemy | HP | Dmg | Speed | Special |
|---|---|---|---|---|
| Lettuce Trap | 180 | 10 / 18 (snap) | 70 | Nearly invisible (22% alpha) until player within 36px; snaps for 18 dmg, then moves normally |
| Basil Bomb | 80 | 30 (explosion) | 190 | Self-destructs on contact with player; explosion radius ≈47px |
| Rocket Great Sword | 90 | 22 | 200 | Arc sweep (160°, range 90) every 3–5s |
| Oregano Phantom | 250 | 25 | 50 | Fires poisonous projectile every 3–10s; on death bursts into 3 more projectiles |
| Coriander Carrot | 500 | 30 | 20 | Spawns 2 random coriander/carrot enemies every 5–12s |
| Spinach Tempest | 500 | 25 | 160 | Rare (20%). Wanders. Spawns random spinach enemy every 2–8s |
| Mulberry Monstrosity | 350 | 15 | 140 | Vine whip within 100px every 2–5s (20 dmg). Spawns a Mulberry Bat every 12–20s |

**Drops**: Dragonfly (all Level 5 exclusives)

---

## Bosses

Bosses spawn when the 10-minute timer hits zero. Regular enemy spawning stops permanently. The XP bar is replaced by a full-width boss HP bar. Defeating the boss shows the Level Clear screen.

---

### Lettuce Beetle — Level 1

- **HP**: 1500
- **Contact damage**: 20
- **Movement**: Walks toward player at 80px/s

| Attack | Cooldown | Mechanic |
|---|---|---|
| Charge | 3500ms | Flashes as a warning → launches at 320px/s for 800ms |

---

### Rocket Spider — Level 2

- **HP**: 2000
- **Contact damage**: 25 (also applies 2-tick poison to player on contact)
- **Movement**: Switches between circle-strafe (190px radius), wander, and chase every 2–4s (95px/s base)

| Attack | Cooldown | Mechanic |
|---|---|---|
| Leg Slam | 5–10s | Brief flash; spawns 3 Rocket Swords near the player |
| Phase 2 (≤50% HP) | — | Speed jumps to 220px/s; spawns a ring of 20 Rocket Swords around the boss |

---

### Carrot Scorpion — Level 3

- **HP**: 1600
- **Contact damage**: 28
- **Movement**: Alternates between chase (220px/s, 3–8s) and wander toward random points near the player (200px/s, 15–25s)

| Attack | Cooldown | Mechanic |
|---|---|---|
| Claw Swipe | 4000ms | Orange warning triangle → charges at 480px/s for 300ms |
| Stinger Bury | 10–15s | Immobile for 6.2s; spawns 10 Carrot Moles + 5 Carrot Thugs staggered over the duration |

---

### Mulberry Mantis — Level 4

- **HP**: 2200 total (phase boundary at 900 — bar keeps draining, no reset)
- **Contact damage**: 5–15 (random)
- **Phase 1**: Chases at 210px/s

| Attack | Trigger | Mechanic |
|---|---|---|
| Vanish → Strike | Every 5–10s | Turns invisible and invulnerable for 3–5s; reappears 80px from player; strikes 400ms later (25 dmg) |
| Phase 2 (HP ≤900) | One-time | Spawns ring of 25 Spinach Cyclones at 900px radius; stops chasing entirely; pure vanish→strike loop with 2s rest between cycles |

---

### The Hand — Level 5 (Final Boss)

- **HP**: 17000 total across 4 phases (boundaries at 14000 / 10000 / 6000; bar drains continuously)
- **Contact damage**: 30
- **Speed**: Scales with phase — 200 / 240 / 288 / 346 px/s (×1.2 per phase)
- **Phase transitions**: Boss freezes and trembles for 3s before each new phase begins

| Phase | HP Range | Attacks Added |
|---|---|---|
| 1 | 17000 → 14000 | Ground Slap |
| 2 | 14000 → 10000 | + Teleport |
| 3 | 10000 → 6000 | + Ring attacks |
| 4 | 6000 → 0 | + Vacuum supermove, 10-projectile ring (25% chance every 5s, 15 dmg each), mini-boss respawn waves |

**Vacuum supermove** (Phase 4): Continuously pulls all enemies toward the boss for 5000ms while the screen fades red (up to 0.55 alpha). At the end, destroys everything within 750px.

**Mini-bosses** (Phase 4): Summons one of each prior boss at scaled-down stats. Each runs its original AI:
- Lettuce Beetle mini — charges at player every 3.5s
- Rocket Spider mini — circle-strafes, wanders, leg slam every 5–10s; at 50% HP boosts speed and spawns 5 Rocket Swords
- Carrot Scorpion mini — alternates chase/wander, claw swipe every 4s, stinger bury every 10–15s (5 Carrot Moles + 3 Carrot Thugs)
- Mulberry Mantis mini — vanish→strike cycle; at 10% HP spawns ring of 6 Spinach Cyclones and enters phase 2 behaviour

---

## Items & Drops

### XP Insects

Collected by walking over them (base magnet range 32px, +80 per Hungry Forager pick).

| Item | XP | Dropped By |
|---|---|---|
| Cricket | 1 | Default — any enemy not listed below |
| Vitaworm | 3 | Lettuce Hopper, Rocket Knife, Oregano Skunk, Coriander Whip, Carrot Mole, Mulberry Bat |
| Mealworm | 5 | Lettuce Shooter, Oregano Ghost, Oregano Fan, Coriander Hydra, Carrot Wheel, Mulberry Snake |
| Dragonfly | 10 | Basil Propeller, Rocket Sword, Carrot Dart, Spinach Cyclone, all Level 5 enemies, Hand mini-bosses |

**Starved Chomp**: Kills grant 2× the normal XP instantly — no insect drops.  
**Bug Buster**: Each kill drops the normal XP insect *and* a live Pupa Mine at the death spot.

---

### Special Item Drops (on enemy death)

Base chance to roll a special drop: **3%** + 2% per Vitamin Supplements pick + any per-enemy Lucky Scratch/Thrash bonus.

When a special drop triggers, the type is determined as follows:

| Item | Rarity | Effect |
|---|---|---|
| **Fullbox** | 1 in 8 special drops | Heals player to full HP. Drops even during boss fight. Pink off-screen arrow when out of view |
| **Treasure** | 1 in 20 of remaining drops | Instant level-up. Does NOT drop during boss fight. Gold off-screen arrow |
| **Foodbox** | Remainder | Heals 50% of max HP. Drops during boss fight. Red off-screen arrow |

XP insects and Treasures are despawned when the boss spawns. Foodboxes and Fullboxes persist throughout the boss fight.
