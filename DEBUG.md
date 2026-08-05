# Snapper — Debug Features

## Currently active

### Y key — hitbox overlay (in-game)
Toggles the Arcade Physics debug overlay while playing a level.
Shows the collision bodies for the player, all enemies, bosses, and every
projectile. Press again to hide and clear the overlay.

### U key — instant upgrade screen (in-game)
Opens an upgrade card screen immediately, same as leveling up normally.
Can be pressed repeatedly to stack upgrade picks. Blocked while paused,
mid-countdown, in a level-up screen, at the level-clear screen, or on the
game-over overlay.

### F key — full loadout cheat (in-game)
- Spawns the boss immediately (if not already spawned)
- Scatters 20 Foodboxes (full heal pickups) randomly across the map
- Queues 29 consecutive upgrade screens (with no delay between them)

Use this to build a maxed loadout fast and test evolutions and end-game
weapon interactions. Blocked in the same states as U.

### REVIVE button — death overlay
Appears on the game-over screen alongside RETRY and MAIN MENU. Revives
the player at a random position ≥4000px from all live enemies, restores
full HP, and grants 3 seconds of blinking invincibility. All upgrades,
weapon levels, and player level are kept. Gamepad: **Y**.

### 🧪 ALL LEVELS — Level Select screen
A button on the Level Select screen that unlocks all 5 levels for the
current session regardless of save progress. Click once to enable (turns
gold), click again to restore normal unlock state. Resets when you leave
the scene.

---

## Previously removed (for reference)

These were cut at some point but are now restored above (U, F, REVIVE).
Listed here in case history is useful.

| Feature | Removed in | Notes |
|---|---|---|
| U / F / REVIVE | Session 27 | Re-added Session 49 |
| E key (max Bite + Hungry Forager) | Session 31 | Added and removed same session — not restored |
