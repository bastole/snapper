// Bump CACHE_VERSION on every asset/code change that should reach already-
// installed players. Old caches are swept automatically in the activate
// handler below. Re-run scripts/generate-precache-list.ps1 and paste its
// output below whenever files are added/removed/renamed under src/,
// assets/, or lib/.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `snapper-pwa-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/lib/phaser.min.js',
  '/src/audio.js',
  '/src/main.js',
  '/src/progressIndex.js',
  '/src/upgradeContent.js',
  '/src/registerSW.js',
  '/src/scenes/BootScene.js',
  '/src/scenes/GameOverScene.js',
  '/src/scenes/GameScene.js',
  '/src/scenes/LevelSelectScene.js',
  '/src/scenes/TitleScene.js',
  '/src/systems/baseWeapons.js',
  '/src/systems/boss.js',
  '/src/systems/crickets.js',
  '/src/systems/enemyDeath.js',
  '/src/systems/enemySpawn.js',
  '/src/systems/evolutions.js',
  '/src/systems/evolutionUI.js',
  '/src/systems/gameFlow.js',
  '/src/systems/handBoss.js',
  '/src/systems/handMiniBoss.js',
  '/src/systems/hud.js',
  '/src/systems/levelUp.js',
  '/src/systems/movement.js',
  '/assets/audio/bgm/boss.wav',
  '/assets/audio/bgm/finalboss.wav',
  '/assets/audio/bgm/lv1.wav',
  '/assets/audio/bgm/lv2.wav',
  '/assets/audio/bgm/lv3.wav',
  '/assets/audio/bgm/lv4.wav',
  '/assets/audio/bgm/lv5.wav',
  '/assets/audio/bgm/title.wav',
  '/assets/audio/sfx/boss_enters.wav',
  '/assets/audio/sfx/enemy_hurt.wav',
  '/assets/audio/sfx/gameover.wav',
  '/assets/audio/sfx/item_collect.wav',
  '/assets/audio/sfx/item_heal.wav',
  '/assets/audio/sfx/levelup.wav',
  '/assets/audio/sfx/level_selected.wav',
  '/assets/audio/sfx/pause.wav',
  '/assets/audio/sfx/ping.wav',
  '/assets/audio/sfx/player_hurt.wav',
  '/assets/audio/sfx/upgrade_selected.wav',
  '/assets/audio/sfx/win.wav',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon-apple-touch-180.png',
  '/assets/icons/icon-maskable-192.png',
  '/assets/icons/icon-maskable-512.png',
  '/assets/sprites/bosses/carrot_scorpion.png',
  '/assets/sprites/bosses/lettuce_beetle.png',
  '/assets/sprites/bosses/mulberry_mantis.png',
  '/assets/sprites/bosses/rocket_spider.png',
  '/assets/sprites/bosses/the_hand.png',
  '/assets/sprites/enemies/basil.png',
  '/assets/sprites/enemies/basil_bomb.png',
  '/assets/sprites/enemies/basil_propeller.png',
  '/assets/sprites/enemies/carrot_dart.png',
  '/assets/sprites/enemies/carrot_mole.png',
  '/assets/sprites/enemies/carrot_thug.png',
  '/assets/sprites/enemies/carrot_wheel.png',
  '/assets/sprites/enemies/coriander.png',
  '/assets/sprites/enemies/coriander_carrot.png',
  '/assets/sprites/enemies/coriander_hydra.png',
  '/assets/sprites/enemies/coriander_whip.png',
  '/assets/sprites/enemies/iceberg_lettuce.png',
  '/assets/sprites/enemies/lettuce_hopper.png',
  '/assets/sprites/enemies/lettuce_shooter.png',
  '/assets/sprites/enemies/lettuce_trap.png',
  '/assets/sprites/enemies/mulberry_bat.png',
  '/assets/sprites/enemies/mulberry_monstrosity.png',
  '/assets/sprites/enemies/mulberry_snake.png',
  '/assets/sprites/enemies/oregano_fan.png',
  '/assets/sprites/enemies/oregano_ghost.png',
  '/assets/sprites/enemies/oregano_phantom.png',
  '/assets/sprites/enemies/oregano_skunk.png',
  '/assets/sprites/enemies/rocket.png',
  '/assets/sprites/enemies/rocket_great_sword.png',
  '/assets/sprites/enemies/rocket_knife.png',
  '/assets/sprites/enemies/rocket_sword.png',
  '/assets/sprites/enemies/small_spinach.png',
  '/assets/sprites/enemies/spinach.png',
  '/assets/sprites/enemies/spinach_cyclone.png',
  '/assets/sprites/enemies/spinach_tempest.png',
  '/assets/sprites/items/cricket.png',
  '/assets/sprites/items/dragonfly.png',
  '/assets/sprites/items/foodbox.png',
  '/assets/sprites/items/fullbox.png',
  '/assets/sprites/items/mealworm.png',
  '/assets/sprites/items/treasure.png',
  '/assets/sprites/items/vitaworm.png',
  '/assets/sprites/player/snapper.png',
  '/assets/sprites/player/snapper_old.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Deliberately not calling skipWaiting(): this is a real-time game
  // (timers, audio, gamepad state) — force-activating a new SW mid-session
  // could swap cached assets out from under a live tab. A tab left open
  // across a deploy keeps the old version until it's closed and reopened.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('snapper-pwa-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/').then((cached) => cached || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
