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

### E key — max Angry + invulnerability (in-game)
Tops up the Angry boost to its max 5 stacks (each stack's +30 movement speed
is applied for any stacks not already owned) and grants permanent
invulnerability (sets the same `reviveInvincible` flag every damage source in
the game already checks). Blocked in the same states as U/F. Not a toggle —
invulnerability stays on for the rest of the run once granted.

### M key — toggle XP freeze (in-game)
Toggles a mode where insects and treasures are still collected (and
treasures still score) but can't add XP, grant a level, or open an upgrade
screen — the XP bar stays put no matter what you pick up. Press again to
unfreeze. Blocked in the same states as U/F.

### N key — skip 60 seconds of game time (in-game)
Advances the level timer forward by a full minute (clamped at 0, which
triggers the boss the same way naturally running out does). Enemy
introductions ramp automatically since they're gated off elapsed time
derived from the timer; the spawn-rate/live-enemy-cap ramp (a separate
real-clock 10s timer) is fast-forwarded 6 steps to match. No-ops once the
boss has already spawned. Blocked in the same states as U/F.

### 1–9 / 0 keys — deal a fraction of the boss's max HP (in-game)
While a boss is active, pressing a number key deals that many tenths of the
boss's max HP as damage — e.g. `3` deals 3/10 of max HP, `0` deals 10/10 (a
kill). No-ops if no boss is currently active/spawned. Blocked in the same
states as U/F.

### 🧪 ALL LEVELS — Level Select screen
A button on the Level Select screen that unlocks all 5 levels for the
current session regardless of save progress. Click once to enable (turns
gold), click again to restore normal unlock state. Resets when you leave
the scene.

---

## Previously removed (for reference)

These were cut at some point but are now restored above (U, F).
Listed here in case history is useful.

| Feature | Removed in | Notes |
|---|---|---|
| U / F | Session 27 | Re-added Session 49 |
| REVIVE button (death overlay) | Session 27, re-added Session 49 | Removed again per request — no longer restored |
| E key (max Bite + Hungry Forager) | Session 31 | Added and removed same session; E reused for max Angry + invulnerability |
