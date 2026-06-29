# Salad Slayer: Snapper – Leaf No Survivors

## Game Overview

**Salad Slayer: Snapper – Leaf No Survivors** is a **Vampire Survivors-inspired** action roguelite designed as a **landscape web application**.

The player controls **Snapper**, a chibi Rankin's dragon (Pogona henrylawsoni), as he battles hordes of evil vegetables while collecting insects to gain experience and unlock powerful upgrades.

The game consists of **five levels**, each lasting **10 minutes**, culminating in a unique boss battle.

---

# Technical Specifications

* Engine: **PhaserJS**
* Language: **Vanilla JavaScript** (no TypeScript)
* Platform: Web browser (hosted on Netlify)
* Orientation: Landscape
* Controls:
  * Keyboard (desktop)
  * Virtual joystick (mobile)

---

# Art Direction

* Cute SD (super-deformed) proportions with an oversized head.
* Chibi character design.
* Japanese anime-inspired cel shading.
* Bright, colourful visuals with exaggerated animation loops.

### Graphics

| Asset | Size | Animation |
| ----- | ----- | ----- |
| Player | 128×128 px | 4-frame animation loop |
| Enemies | 128×128 px | 2-frame animation loop |
| Bosses | 128×128 px | 2-frame animation loop |
| Items | 32×32 px | Static |

---

# Main Character

## Snapper

Snapper is a tan-coloured **Rankin's dragon (Pogona henrylawsoni)**.

He is adventurous and absolutely loves eating insects such as crickets and mealworms—but hates vegetables.

When evil vegetables invade his home, Snapper must eat bugs, become stronger, and survive overwhelming waves of enemies.

---

# Gameplay

Enemies drop **Crickets**, which function similarly to experience gems in Vampire Survivors.

Collecting crickets fills the experience bar.

Upon leveling up, the player chooses **one of three randomly offered upgrades**.

---

# Levels

## Level 1 – Iceberg Lettuce & Basil

### Enemies

* Iceberg Lettuce
  * Bounces around and attacks.
* Basil
  * Bounces around and attacks.
* Lettuce Hopper
  * Large lettuce head that splits into Iceberg Lettuces when defeated.
* Lettuce Shooter
  * Stationary enemy that fires miniature lettuce heads vertically.
* Basil Propeller
  * Extremely fast flying basil.

### Boss – Lettuce Beetle

A giant green Hercules beetle covered in thick lettuce leaves.

Attack:

* Charges toward the player after displaying a warning indicator.

---

## Level 2 – Rocket & Oregano

### Enemies

* Rocket
  * Bounces around and attacks.
* Rocket Knife
  * Sharp rocket leaf with high damage but very low health.
* Oregano Skunk
  * Small furry skunk that emits damaging herbal gas.
* Oregano Ghost
  * Slow but tanky cloud of herbal gas.
* Oregano Fan
  * Fires herbal gas projectiles.
* Rocket Sword
  * Larger and stronger version of Rocket Knife.

### Boss – Rocket Spider

A giant spider with rocket leaves forming its legs and mandibles.

Attacks:

* Swift bite.
* Slams front legs into the ground, spawning Rocket Swords.

---

## Level 3 – Coriander & Carrot

### Enemies

* Coriander
  * Bounces around and attacks.
* Coriander Whip
  * Long stalk that lashes nearby players.
* Carrot Mole
  * Burrows underground while only its greens remain visible.
* Coriander Hydra
  * Three-headed plant creature.
  * Loses one head every third of its health.
* Carrot Dart
  * Bounces before launching itself.
  * Splits into Carrot Wheels on death.
* Carrot Wheel
  * Small rolling enemy.

### Boss – Carrot Scorpion

A massive orange scorpion with a giant carrot stinger.

Attacks:

* Powerful claw swipes.
* Buries its stinger for several seconds while spawning Carrot Moles.

---

## Level 4 – Spinach & Mulberry

### Enemies

* Spinach
  * Bounces around and attacks.
* Small Spinach
  * Faster version of Spinach that bounces around and attacks.
* Mulberry Bat
  * Two leaves joined by a stem with a mulberry fruit body.
* Mulberry Snake
  * Vine creature that whips its tail and spits mulberries.
* Spinach Cyclone
  * Rare whirlwind that spawns Small Spinach while on screen.

### Boss – Mulberry Mantis

A giant mantis formed from twisting mulberry vines.

Attacks:

* Rapid foreleg slashes.
* Turns invisible for approximately five seconds before striking.
* Flies overhead, dropping mulberries that hatch into Mulberry Bats or Mulberry Snakes.

---

## Final Level – The Garden

### Enemies

* Lettuce Trap
  * Camouflaged trap resembling a bear trap.
* Basil Bomb
  * Runs around before exploding.
* Rocket Great Sword
  * Giant flying sword capable of sweeping attacks.
* Oregano Phantom
  * Large ghost that slashes and fires herbal projectiles.
* Coriander Carrot
  * A carrot infested with coriander and covered in roots, dealing heavy damage.
* Spinach Tempest
  * Giant whirlwind capable of spawning additional spinach enemies.
* Mulberry Monstrosity
  * Living bush covered in vine arms and mulberry heads.

### Final Boss – The Hand

A gigantic human hand representing a reptile owner's attempts to care for Snapper.

Attacks:

* Ground slap.
* Tweezer swipe.
* Spray bottle beam attack (telegraphed).
* Heat lamp swing creating burning zones.

Phase Two:

* Summons a large bowl of salad.
* Previously defeated bosses emerge with reduced health.

---

# Weapons

| Weapon | Description |
| ----- | ----- |
| Bite | Small melee attack around Snapper. Upgrades to four bites. |
| Tail Slap | 60° sweeping attack. Upgrades to 180°. |
| Worm Whip | Alternating left-right whip attack. |
| Poop | Fires a pixelated poop projectile in a random direction. |
| Hiss | Slows enemies in a cone. Upgrades from 45° to 90°. |
| Lick | Tongue attacks nearby enemies. Upgrades to three longer tongues. |
| Pupa Mines | Places exploding mealworm pupae. Upgrades to five mines. |
| Skin Shed | Throws falling pieces of shed skin. Upgrades to two pieces. |
| Pebble Flick | Fires piercing pebbles. Upgrades from three to nine projectiles. |
| Woodie Bounce | Launches a bouncing woodlouse that ricochets before breaking. Upgrades to three projectiles with five bounces each. |

---

# Passive Boosts

| Upgrade | Effect |
| ----- | ----- |
| Inflate | Knock back and damage nearby enemies after taking damage. |
| Hard Scales | Reduces incoming damage. |
| Shiny Scales | Chance to deflect projectiles. |
| Angry | Increases movement speed. |
| Aura Farming | Increases weapon damage. |
| Hungry Forager | Increases item spawn rate. |
| Hunter Instinct | Increases weapon range. |
| Basking | Increases attack speed. |
| Bug Bucket | Increases maximum health. |
| Well Fed | Increases health regeneration. |

---

# Game Flow

1. Title Screen
   * "Press to Start"
2. Level Select
   * Only Level 1 is initially unlocked.
   * Subsequent levels unlock by defeating the previous boss.
3. Gameplay
   * Survive for ten minutes.
   * Defeat the boss.
   * Unlock the next level.
4. Game Over
   * Retry the level or return to the level select screen.
