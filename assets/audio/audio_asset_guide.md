# Audio Asset Guide

This document describes the audio assets used in the game and how they should be implemented.

---

# Folder Structure

```
audio/
├── bgm/
└── sfx/
```

---

# SFX (`/sfx`)

Contains all in-game sound effects.

| File | Usage |
|------|-------|
| `boss_enters.wav` | Plays when a boss enters the level to alert the player. |
| `enemy_hurt.wav` | Plays when an enemy takes damage from the player's attack. |
| `player_hurt.wav` | Plays when the player takes damage from an enemy attack. |
| `levelup.wav` | Plays when the player gains a level. |
| `item_collect.wav` | Plays when the player collects an item. |
| `item_heal.wav` | Plays when a healing item is activated. |
| `pause.wav` | Plays when the game is paused. |
| `upgrade_selected.wav` | Plays when the player selects an upgrade. |
| `level_selected.wav` | Plays when the player selects a level. |
| `win.wav` | Plays on the victory screen after defeating the boss and completing a level. |
| `gameover.wav` | Plays on the Game Over screen. |
| `ping.wav` | Currently unused. Do not reference unless assigned a future purpose. |

---

# Background Music (`/bgm`)

Contains all seamless looping background music tracks.

| File | Usage |
|------|-------|
| `title.*` | Title screen and level selection screen. |
| `lvl1.*` | Background music for Level 1. |
| `lvl2.*` | Background music for Level 2. |
| `lvl3.*` | Background music for Level 3. |
| `lvl4.*` | Background music for Level 4. |
| `lvl5.*` | Background music for Level 5. |
| `boss.*` | Boss battle music for Levels 1–4. |
| `finalboss.*` | Final boss battle music for Level 5. |

> **Implementation Notes**
>
> - All BGM tracks should loop seamlessly.
> - Only one BGM track should play at a time.
> - When entering a boss fight, smoothly transition from the level BGM to the appropriate boss BGM.
> - When leaving a boss fight or completing the level, stop the boss music before transitioning to the next scene.
> - Sound effects should be able to overlap and play simultaneously without interrupting each other.