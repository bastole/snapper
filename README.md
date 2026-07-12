# Salad Slayer: Snapper – Leaf No Survivors

A browser-based survivor roguelite where you play as Snapper, a bearded dragon fighting through five vegetable-themed levels. Survive 10 minutes of escalating enemy waves, collect XP crickets, unlock weapons and passives, evolve your loadout, and defeat the boss to clear each level.

## Stack

- **Engine**: Phaser 3.88.2 (bundled at `lib/phaser.min.js`)
- **Language**: Vanilla JavaScript (ES modules)
- **Build tools**: None — open the HTML, the game runs
- **Canvas**: 800×450, arcade physics, FIT scaling

## Project structure

```
snapper/
├── index.html
├── lib/
│   └── phaser.min.js          # Phaser bundled locally
├── src/
│   ├── main.js                # Phaser game config + scene list
│   ├── audio.js               # Shared BGM/SFX module
│   ├── scenes/
│   │   ├── BootScene.js       # Preloads all assets
│   │   ├── TitleScene.js      # Title screen
│   │   ├── LevelSelectScene.js
│   │   ├── GameScene.js       # Core class (~320 lines); imports all systems
│   │   └── GameOverScene.js   # (legacy, unused — replaced by in-scene overlay)
│   └── systems/               # Gameplay logic split by domain
│       ├── movement.js        # Player movement, dubia shields, off-screen arrows
│       ├── hud.js             # UI bars, pause overlay, volume sliders
│       ├── enemySpawn.js      # Enemy spawning and wave ramp
│       ├── baseWeapons.js     # All 16 base weapon fire methods
│       ├── enemyDeath.js      # killEnemy — drops, XP, score
│       ├── crickets.js        # XP collection, damage collisions, knockback
│       ├── boss.js            # Boss AI for levels 1–4, HP bar, phase transitions
│       ├── gameFlow.js        # Death overlay, revive, level clear
│       ├── levelUp.js         # Level-up card screen
│       ├── evolutions.js      # Evolution stubs + evolved weapon methods
│       ├── evolutionUI.js     # Evolution menu, loadout display, regen, pause glow
│       ├── handBoss.js        # The Hand (level 5) AI and attacks
│       └── handMiniBoss.js    # Mini-boss AI injected during The Hand fight
└── assets/
    ├── sprites/
    │   ├── player/
    │   ├── enemies/
    │   ├── bosses/
    │   └── items/
    └── audio/
        ├── bgm/               # 8 background music tracks (.wav)
        ├── sfx/               # 12 sound effects (.wav)
        └── audio_asset_guide.md
```

## Running locally

The game uses ES modules (`type="module"`), so it must be served over HTTP — opening `index.html` directly as a `file://` URL will not work.

**Option 1 — Python (no install required)**
```bash
cd snapper
python3 -m http.server 8080
# open http://localhost:8080
```

**Option 2 — Node `serve`**
```bash
npx serve .
# open the URL it prints
```

**Option 3 — VS Code Live Server**
Right-click `index.html` → Open with Live Server.

## Controls

| Input | Keyboard | Gamepad |
|---|---|---|
| Move | WASD / Arrow keys | Left stick / D-pad |
| Pause | ESC | Start |
| Navigate menus | Mouse / keyboard | D-pad / Left stick |
| Confirm | Click / Enter | A |
| Back | — | B |
| Quit to menu (paused) | — | Y |
| Evolutions menu (paused) | — | X |
| Browse level-up cards | — | LB / RB |
| Scroll evolutions grid | — | Right stick |

## Debug keys (in-game)

| Key | Action |
|---|---|
| `U` | Trigger a level-up screen immediately |
| `N` | Skip 60 seconds of game time |
| `F` | Spawn boss + scatter 20 Foodboxes + open 29 upgrade screens |

## Gameplay summary

- Enemies spawn off-screen and walk toward the player; spawn rate ramps up every 10 seconds
- Killing enemies drops XP insects — walk over them to collect
- Filling the XP bar triggers a level-up screen with 3 random cards: weapons (orange) and passives (blue)
- All weapons fire automatically on timers; no manual aiming required
- At 10 minutes the boss spawns; defeating it clears the level
- Max out a weapon to unlock its evolution in the pause menu EVOLUTIONS screen
- The pause button glows gold when an evolution is ready

## Levels

| # | Theme | Boss |
|---|---|---|
| 1 | Lettuce & Basil | Lettuce Beetle |
| 2 | *(see GDD)* | Rocket Spider |
| 3 | Coriander & Carrot | Carrot Scorpion |
| 4 | Spinach & Mulberry | Mulberry Mantis |
| 5 | The Garden | The Hand |

## Deployment

Target host: **Netlify**. The entire repo is static — drop the folder into Netlify's site dashboard or connect the GitHub repo (`bastole/snapper`) and deploy from `master`. No build step needed.

## Links

- **GitHub**: https://github.com/bastole/snapper
- **Design doc**: `Salad Slayer - Snapper Leaf No Survivors.md`
- **Dev log**: `DEVLOG.md`
