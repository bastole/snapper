import { playSfx } from '../audio.js';
export const LevelUpMethods = {

    // ─── Step 5: Level-up screen ─────────────────────────────────────────────────
    showLevelUp() {
        if (this.isGameOver) return;
        if (this.isLevelingUp) { this.pendingLevelUps++; return; }
        this.isLevelingUp = true;
        // Zero all enemy velocities immediately so they stop this frame,
        // before physics.pause() can take effect on the next step
        this.enemies.getChildren().forEach(e => { if (e.body) e.body.setVelocity(0, 0); });
        if (this.boss?.active && this.boss.body) this.boss.body.setVelocity(0, 0);

        this.physics.pause();
        this.time.paused = true;

        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const ui = []; // track elements so we can destroy them all at once

        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setScrollFactor(0).setDepth(200);
        ui.push(overlay);

        ui.push(this.add.text(W / 2, H / 2 - 150, 'LEVEL UP!', {
            fontSize: '40px', fontFamily: 'Arial Black, Arial',
            color: '#ffff00', stroke: '#000000', strokeThickness: 6,
        }).setScrollFactor(0).setDepth(201).setOrigin(0.5));

        ui.push(this.add.text(W / 2, H / 2 - 100, 'Choose one upgrade:', {
            fontSize: '15px', fontFamily: 'Arial', color: '#cccccc',
        }).setScrollFactor(0).setDepth(201).setOrigin(0.5));

        // Weapons — only offered if not yet owned; upgrades offered if already owned
        const weaponUpgrades = [
            {
                name: this.weaponCardLabel('bite', 'Bite'), desc: 'Faster bite — fires every 2s, +15 range, +10 damage', type: 'weapon',
                available: () => this.biteLevel === 1,
                effect: () => {
                    this.biteLevel = 2;
                    this.biteDamage += 10; this.biteRange += 15;
                    this.biteRate = Math.max(300, this.biteRate - 1000);
                    this.biteTimer.reset({ delay: this.biteRate, callback: this.doBite, callbackScope: this, loop: true });
                },
            },
            {
                name: this.weaponCardLabel('bite', 'Bite'), desc: 'Stronger bite — +20 range, +15 damage', type: 'weapon',
                available: () => this.biteLevel === 2,
                effect: () => {
                    this.biteLevel = 3;
                    this.biteDamage += 15; this.biteRange += 20;
                },
            },
            {
                name: this.weaponCardLabel('bite', 'Bite'), desc: 'Venomous bite — +20 range, +15 damage, slows enemies for 2s', type: 'weapon',
                available: () => this.biteLevel === 3,
                effect: () => {
                    this.biteLevel = 4;
                    this.biteDamage += 15; this.biteRange += 20;
                },
            },
            {
                name: this.weaponCardLabel('tailslap', 'Tail Slap'), desc: 'Sweeping arc attack behind you as you move', type: 'weapon',
                available: () => !this.ownedWeapons.has('tailslap') && !this.ownedWeapons.has('steelslam'),
                effect: () => {
                    this.ownedWeapons.add('tailslap');
                    this.tailSlapTimer = this.time.addEvent({ delay: 4000, callback: this.doTailSlap, callbackScope: this, loop: true });
                },
            },
            {
                name: this.weaponCardLabel('tailslap', 'Tail Slap'), desc: 'Widen the arc behind you to 180°', type: 'weapon',
                available: () => this.ownedWeapons.has('tailslap') && !this.tailSlapUpgraded,
                effect: () => { this.tailSlapUpgraded = true; },
            },
            {
                name: this.weaponCardLabel('poop', 'Poop'), desc: 'Fires an exploding continuous projectile in a random direction', type: 'weapon',
                available: () => !this.ownedWeapons.has('poop') && !this.ownedWeapons.has('toxicocean') && this.playerLevel >= 20,
                effect: () => {
                    this.ownedWeapons.add('poop');
                    this.poopTimer = this.time.addEvent({ delay: 8000, callback: this.doPoop, callbackScope: this, loop: true });
                },
            },
            {
                name: this.weaponCardLabel('poop', 'Poop'), desc: 'Field lasts 6 seconds instead of 3', type: 'weapon',
                available: () => this.ownedWeapons.has('poop') && !this.poopUpgraded,
                effect: () => { this.poopUpgraded = true; this.poopDuration = 6000; },
            },
            {
                name: this.weaponCardLabel('pebble', 'Pebble Flick'), desc: 'Fires 3 piercing pebbles toward the nearest enemy', type: 'weapon',
                available: () => !this.ownedWeapons.has('pebble') && !this.ownedWeapons.has('sunbakedambers'),
                effect: () => {
                    this.ownedWeapons.add('pebble');
                    this.pebbleTimer = this.time.addEvent({ delay: 8000, callback: this.doPebbleFlick, callbackScope: this, loop: true });
                },
            },
            {
                name: this.weaponCardLabel('pebble', 'Pebble Flick'), desc: 'Fire 9 pebbles that pierce 3 enemies', type: 'weapon',
                available: () => this.ownedWeapons.has('pebble') && this.pebbleCount < 9,
                effect: () => { this.pebbleCount = 9; this.pebblePierce = 3; },
            },
            {
                name: this.weaponCardLabel('lick', 'Lick'),
                desc: ['High-damage tongue at nearest enemy', '2 tongues, longer reach', '3 tongues, even longer reach'][this.lickLevel] ?? 'High-damage tongue at nearest enemy',
                type: 'weapon',
                available: () => this.lickLevel < 3,
                effect: () => {
                    this.lickLevel++;
                    if (this.lickLevel === 1) {
                        this.ownedWeapons.add('lick');
                        this.lickTimer = this.time.addEvent({ delay: 3500, callback: this.doLick, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: this.weaponCardLabel('hiss', 'Hiss'), desc: 'Slow enemies in a 45° cone for 2 seconds', type: 'weapon',
                available: () => !this.ownedWeapons.has('hiss') && !this.ownedWeapons.has('ragingroar'),
                effect: () => {
                    this.ownedWeapons.add('hiss');
                    this.hissTimer = this.time.addEvent({ delay: 5000, callback: this.doHiss, callbackScope: this, loop: true });
                },
            },
            {
                name: this.weaponCardLabel('hiss', 'Hiss'), desc: 'Widen cone to 90°', type: 'weapon',
                available: () => this.ownedWeapons.has('hiss') && !this.hissUpgraded,
                effect: () => { this.hissUpgraded = true; },
            },
            {
                name: this.weaponCardLabel('wormwhip', 'Worm Whip'),
                desc: ['Whip left or right, alternating each strike', 'Whip both sides at once, longer range'][this.wormWhipLevel] ?? 'Whip left or right',
                type: 'weapon',
                available: () => this.wormWhipLevel < 2,
                effect: () => {
                    this.wormWhipLevel++;
                    if (this.wormWhipLevel === 1) {
                        this.ownedWeapons.add('wormwhip');
                        this.wormWhipTimer = this.time.addEvent({ delay: 3000, callback: this.doWormWhip, callbackScope: this, loop: true });
                    } else {
                        this.wormWhipRange += 40;
                    }
                },
            },
            {
                name: this.weaponCardLabel('pupamines', 'Pupa Mines'),
                desc: ['Drop 1 exploding pupa mine', 'Drop 3 pupa mines', 'Drop 5 pupa mines'][this.pupaLevel] ?? 'Drop exploding pupa mines',
                type: 'weapon',
                available: () => this.pupaLevel < 3,
                effect: () => {
                    this.pupaLevel++;
                    if (this.pupaLevel === 1) {
                        this.ownedWeapons.add('pupamines');
                        this.pupaTimer = this.time.addEvent({ delay: 6000, callback: this.doPupaMines, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: this.weaponCardLabel('skinshed', 'Skin Shed'),
                desc: ['Fling a piece of shed skin that arcs downward', 'Fling 2 pieces of shed skin'][this.skinLevel] ?? 'Fling shed skin outward',
                type: 'weapon',
                available: () => this.skinLevel < 2,
                effect: () => {
                    this.skinLevel++;
                    if (this.skinLevel === 1) {
                        this.ownedWeapons.add('skinshed');
                        this.skinTimer = this.time.addEvent({ delay: 5000, callback: this.doSkinShed, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: this.weaponCardLabel('woodiebounce', 'Woodie Bounce'),
                desc: ['Launch 1 bouncing woodlouse (2 bounces)', 'Launch 2 woodlice (3 bounces)', 'Launch 3 woodlice (5 bounces each)'][this.woodieLevel] ?? 'Launch a bouncing woodlouse',
                type: 'weapon',
                available: () => this.woodieLevel < 3,
                effect: () => {
                    this.woodieLevel++;
                    if (this.woodieLevel === 1) {
                        this.ownedWeapons.add('woodiebounce');
                        this.woodieTimer = this.time.addEvent({ delay: 8000, callback: this.doWoodieBounce, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: this.weaponCardLabel('dubiashields', 'Dubia Shields'),
                desc: [
                    'Two roach shields orbit you, damaging anything they touch',
                    'Three shields orbit faster',
                    'Four shields orbit even faster',
                    'Two layers of shields orbit in opposite directions',
                ][this.dubiaLevel] ?? 'Dubia Shields',
                type: 'weapon',
                available: () => this.dubiaLevel < 4 && (this.dubiaLevel === 0 || Math.random() < 0.4),
                effect: () => {
                    this.dubiaLevel++;
                    if (this.dubiaLevel === 1) {
                        this.ownedWeapons.add('dubiashields');
                        this.createDubiaShield();
                        this.createDubiaShield();
                    } else if (this.dubiaLevel === 4) {
                        this.dubiaShields.forEach(s => s.destroy());
                        this.dubiaShields = [];
                        this.dubiaOuterAngle = 0;
                        for (let i = 0; i < 4; i++) this.createDubiaShield('inner');
                        for (let i = 0; i < 5; i++) this.createDubiaShield('outer');
                    } else {
                        this.createDubiaShield();
                    }
                },
            },
            {
                name: this.weaponCardLabel('poisonclaw', 'Poison Claw'),
                desc: [
                    'Lunge a venomous claw at nearest enemy (80px) — poisons for 3s',
                    'Longer reach (110px) — poisons for 5s',
                    'Even longer reach (140px) — poisons for 6s',
                    'Max reach (170px) — poisons for 7s',
                ][this.poisonClawLevel] ?? 'Poison Claw',
                type: 'weapon',
                available: () => this.poisonClawLevel < 4,
                effect: () => {
                    this.poisonClawLevel++;
                    if (this.poisonClawLevel === 1) {
                        this.ownedWeapons.add('poisonclaw');
                        this.poisonClawTimer = this.time.addEvent({ delay: 4000, callback: this.doPoisonClaw, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: this.weaponCardLabel('branchthrow', 'Branch Throw'),
                desc: ['Hurl a wide branch at the nearest enemy (breaks after 15 hits)', 'Wider branch', 'Even wider branch', 'Breaks after 30 hits instead'][this.branchLevel] ?? 'Branch Throw',
                type: 'weapon',
                available: () => this.branchLevel < 4,
                effect: () => {
                    this.branchLevel++;
                    if (this.branchLevel === 1) {
                        this.ownedWeapons.add('branchthrow');
                        this.branchTimer = this.time.addEvent({ delay: 6000, callback: this.doBranchThrow, callbackScope: this, loop: true });
                    } else if (this.branchLevel === 2) { this.branchWidth = 30; }
                    else if (this.branchLevel === 3)   { this.branchWidth = 40; }
                    else if (this.branchLevel === 4)   { this.branchMaxHits = 30; }
                },
            },
            {
                name: this.weaponCardLabel('dustkick', 'Dust Kick'),
                desc: ['Fire a short beam of dust — deals low damage and slows enemies 2s', 'Stronger kick', 'Stronger kick', 'Stronger kick', 'Much longer beam, slows for 10s'][this.dustKickLevel] ?? 'Dust Kick',
                type: 'weapon',
                available: () => this.dustKickLevel < 5,
                effect: () => {
                    this.dustKickLevel++;
                    if (this.dustKickLevel === 1) {
                        this.ownedWeapons.add('dustkick');
                        this.dustKickTimer = this.time.addEvent({ delay: 15000, callback: this.doDustKick, callbackScope: this, loop: true });
                    } else if (this.dustKickLevel === 5) {
                        this.dustKickLength = 400;
                        this.dustKickSlowDuration = 10000;
                    }
                },
            },
            {
                name: this.weaponCardLabel('scratch', 'Lucky Scratch'),
                desc: ['Scratch mark near you — damaged enemies have a higher Foodbox drop chance', 'Damaged enemies also have a higher Treasure drop chance', 'Bigger scratch, larger area'][this.scratchLevel] ?? 'Lucky Scratch',
                type: 'weapon',
                available: () => this.scratchLevel < 3,
                effect: () => {
                    this.scratchLevel++;
                    if (this.scratchLevel === 1) {
                        this.ownedWeapons.add('scratch');
                        this.scratchTimer = this.time.addEvent({ delay: 12000, callback: this.doLuckyScratch, callbackScope: this, loop: true });
                    }
                },
            },
            {
                name: this.weaponCardLabel('coldglare', 'Cold Glare'),
                desc: (() => {
                    if (!this.coldGlareActive)
                        return 'Freeze nearby enemies for 1s every 30s';
                    const cd   = this.coldGlareCooldown / 1000;
                    const slow = this.coldGlareSlow / 1000;
                    if (this.coldGlareCdLevel < 3) {
                        const nextCd = (this.coldGlareCooldown - 5000) / 1000;
                        return `Cooldown ${cd}s → ${nextCd}s  •  slow ${slow}s`;
                    }
                    const nextSlows = [4, 7, 10];
                    const nextSlow  = nextSlows[this.coldGlareSlLevel];
                    return `Slow ${slow}s → ${nextSlow}s  •  cooldown ${cd}s`;
                })(),
                type: 'weapon',
                available: () => !this.ownedWeapons.has('fourchills') && (!this.coldGlareActive || this.coldGlareCdLevel < 3 || this.coldGlareSlLevel < 3),
                effect: () => {
                    if (!this.coldGlareActive) {
                        this.coldGlareActive = true;
                        this.ownedWeapons.add('coldglare');
                        this.scheduleColdGlare();
                    } else if (this.coldGlareCdLevel < 3) {
                        this.coldGlareCdLevel++;
                        this.coldGlareCooldown -= 5000;
                    } else {
                        this.coldGlareSlLevel++;
                        this.coldGlareSlow = [4000, 7000, 10000][this.coldGlareSlLevel - 1] ?? 10000;
                    }
                },
            },
        ];

        // Passives — always available
        const passiveUpgrades = [
            { name: this.boostCardLabel('Inflate'),      desc: 'Taking damage knocks back and hurts nearby enemies', available: () => this.ownedPassives.filter(p => p === 'Inflate').length < 1, effect: () => { this.ownedPassives.push('Inflate');      this.inflateActive = true; } },
            { name: this.boostCardLabel('Shiny Scales'), desc: this.deflectChance === 0 ? '30% chance to deflect enemy projectiles back at them' : '60% chance to deflect enemy projectiles back at them', available: () => this.deflectChance < 0.60, effect: () => { this.ownedPassives.push('Shiny Scales'); this.deflectChance = this.deflectChance === 0 ? 0.30 : 0.60; } },
            { name: this.boostCardLabel('Angry'),           desc: 'Snapper moves faster',                available: () => this.ownedPassives.filter(p => p === 'Angry').length           < 5, effect: () => { this.ownedPassives.push('Angry');           this.playerSpeed += 30; } },
            { name: this.boostCardLabel('Aura Farming'),    desc: 'Snapper\'s attacks do more damage',   available: () => this.ownedPassives.filter(p => p === 'Aura Farming').length    < 5, effect: () => { this.ownedPassives.push('Aura Farming');    this.biteDamage += 10; this.tailSlapDamage += 10; this.poopDamage += 10; this.pebbleDamage += 10; this.lickDamage += 10; this.wormWhipDamage += 10; this.pupaDamage += 10; this.skinDamage += 10; this.woodieDamage += 10; this.dubiaShieldDamage += 10; } },
            { name: this.boostCardLabel('Hunter Instinct'), desc: 'Snapper\'s attacks reach further',    available: () => this.ownedPassives.filter(p => p === 'Hunter Instinct').length < 5, effect: () => { this.ownedPassives.push('Hunter Instinct'); this.biteRange += 25; this.tailSlapRange += 25; this.hissRange += 25; this.lickRangeBonus += 25; this.wormWhipRange += 25; this.pupaRadius += 15; this.dustKickLength += 40; } },
            { name: this.boostCardLabel('Basking'),         desc: 'Snapper\'s attacks fire faster',      available: () => this.ownedPassives.filter(p => p === 'Basking').length < 5, effect: () => {
                this.ownedPassives.push('Basking');
                this.biteRate = Math.max(300, this.biteRate - 150);
                this.biteTimer.reset({ delay: this.biteRate, callback: this.ownedWeapons.has('starvechomp') ? this.doStarvedChomp : this.doBite, callbackScope: this, loop: true });
                if (this.tailSlapTimer) this.tailSlapTimer.reset({ delay: Math.max(300, this.tailSlapTimer.delay - 150), callback: this.ownedWeapons.has('steelslam') ? this.doSteelSlam : this.doTailSlap, callbackScope: this, loop: true });
                if (this.poopTimer)     this.poopTimer.reset({     delay: Math.max(300, this.poopTimer.delay     - 150), callback: this.ownedWeapons.has('toxicocean') ? this.doToxicOcean : this.doPoop,     callbackScope: this, loop: true });
                if (this.pebbleTimer)   this.pebbleTimer.reset({   delay: Math.max(300, this.pebbleTimer.delay   - 150), callback: this.ownedWeapons.has('sunbakedambers') ? this.doSunbakedAmbers : this.doPebbleFlick, callbackScope: this, loop: true });
                if (this.hissTimer)     this.hissTimer.reset({     delay: Math.max(300, this.hissTimer.delay     - 150), callback: this.doHiss,        callbackScope: this, loop: true });
                if (this.lickTimer)       this.lickTimer.reset({     delay: Math.max(300, this.lickTimer.delay     - 150), callback: this.ownedWeapons.has('stickyshot') ? this.doStickyShot : this.doLick,          callbackScope: this, loop: true });
                if (this.wormWhipTimer)   this.wormWhipTimer.reset({ delay: Math.max(300, this.wormWhipTimer.delay - 150), callback: this.ownedWeapons.has('acidsnake') ? this.doAcidSnake : this.doWormWhip,       callbackScope: this, loop: true });
                if (this.pupaTimer)       this.pupaTimer.reset({     delay: Math.max(300, this.pupaTimer.delay     - 150), callback: this.ownedWeapons.has('bugbuster') ? this.doBugBuster : this.doPupaMines,      callbackScope: this, loop: true });
                if (this.skinTimer)         this.skinTimer.reset({         delay: Math.max(300, this.skinTimer.delay         - 150), callback: this.ownedWeapons.has('spikeshedder') ? this.doSpikeShedder : this.doSkinShed,               callbackScope: this, loop: true });
                if (this.woodieTimer)       this.woodieTimer.reset({       delay: Math.max(300, this.woodieTimer.delay       - 150), callback: this.ownedWeapons.has('shiningshells') ? this.doShiningShells : this.doWoodieBounce,           callbackScope: this, loop: true });
                if (this.poisonClawTimer)   this.poisonClawTimer.reset({   delay: Math.max(300, this.poisonClawTimer.delay   - 150), callback: this.ownedWeapons.has('flashclaw') ? this.doFlashclaw : this.doPoisonClaw,             callbackScope: this, loop: true });
                if (this.branchTimer)       this.branchTimer.reset({       delay: Math.max(300, this.branchTimer.delay       - 150), callback: this.ownedWeapons.has('loglob') ? this.doLogLob : this.doBranchThrow,            callbackScope: this, loop: true });
                if (this.dustKickTimer)     this.dustKickTimer.reset({     delay: Math.max(300, this.dustKickTimer.delay     - 150), callback: this.ownedWeapons.has('duststorm') ? this.doDuststorm : this.doDustKick,               callbackScope: this, loop: true });
                if (this.scratchTimer)      this.scratchTimer.reset({      delay: Math.max(300, this.scratchTimer.delay      - 150), callback: this.ownedWeapons.has('thrash') ? this.doLuckyThrash : this.doLuckyScratch, callbackScope: this, loop: true });
                if (this.coldGlareActive) { this.coldGlareCooldown = Math.max(5000, this.coldGlareCooldown - 1500); this.scheduleColdGlare(); }
            } },
            { name: this.boostCardLabel('Bug Bucket'),      desc: 'Snapper\'s max health increases by 25',  available: () => this.ownedPassives.filter(p => p === 'Bug Bucket').length     < 5, effect: () => { this.ownedPassives.push('Bug Bucket');      this.playerMaxHealth += 25; this.playerHealth = Math.min(this.playerHealth + 25, this.playerMaxHealth); this.updateHPBar(); } },
            { name: this.boostCardLabel('Well Fed'),        desc: 'Passively regenerate health faster', available: () => this.ownedPassives.filter(p => p === 'Well Fed').length < 3, effect: () => { this.ownedPassives.push('Well Fed'); this.startRegen(); } },
            { name: this.boostCardLabel('Hungry Forager'),  desc: 'Insects attract to Snapper from further', available: () => this.ownedPassives.filter(p => p === 'Hungry Forager').length < 4, effect: () => { this.ownedPassives.push('Hungry Forager'); this.magnetRange += 80; } },
            { name: this.boostCardLabel('Hard Scales'),     desc: 'Enemies deal less damage to Snapper',    available: () => this.ownedPassives.filter(p => p === 'Hard Scales').length    < 4, effect: () => { this.ownedPassives.push('Hard Scales');    this.enemies.getChildren().forEach(e => { e.damage = Math.max(1, e.damage - 2); }); } },
            {
                name: this.boostCardLabel('Polycephaly'),
                desc: `${Math.round((this.polycephalyChance + 0.10) * 100)}% chance for each attack to fire twice`,
                available: () => this.ownedPassives.filter(p => p === 'Polycephaly').length < 4,
                effect: () => { this.ownedPassives.push('Polycephaly'); this.polycephalyChance += 0.10; },
            },
            {
                name: this.boostCardLabel('Venom'),
                desc: (() => {
                    const first = this.venomChance === 0;
                    const nextChance = first ? 15 : Math.round((this.venomChance + 0.10) * 100);
                    const nextDur   = first ? '2.0' : ((this.venomDuration + 500) / 1000).toFixed(1);
                    return `${nextChance}% chance to poison enemies for ${nextDur}s`;
                })(),
                available: () => this.ownedPassives.filter(p => p === 'Venom').length < 3,
                effect: () => {
                    const first = this.venomChance === 0;
                    this.ownedPassives.push('Venom');
                    this.venomChance += first ? 0.15 : 0.10;
                    if (!first) this.venomDuration += 500;
                },
            },
            { name: this.boostCardLabel('Vitamin Supplements'), desc: 'Higher chance of Foodbox and Treasure drops', available: () => this.ownedPassives.filter(p => p === 'Vitamin Supplements').length < 4, effect: () => { this.ownedPassives.push('Vitamin Supplements'); this.vitaminBonus += 0.02; } },
            {
                name: this.boostCardLabel('Big Fangs'),
                desc: (() => {
                    const lvl = this.ownedPassives.filter(p => p === 'Big Fangs').length;
                    const chances = [5, 9, 14, 18];
                    const heals   = [5, 8, 14, 20];
                    const next = lvl + 1;
                    return `${chances[lvl]}% chance to heal ${heals[lvl]}% max HP on kill${next <= 3 ? ` → ${chances[next]}% / ${heals[next]}%` : ''}`;
                })(),
                available: () => this.ownedPassives.filter(p => p === 'Big Fangs').length < 4,
                effect: () => {
                    const lvl = this.ownedPassives.filter(p => p === 'Big Fangs').length;
                    const chances = [0.05, 0.09, 0.14, 0.18];
                    const heals   = [0.05, 0.08, 0.14, 0.20];
                    this.ownedPassives.push('Big Fangs');
                    this.bigFangsChance = chances[lvl];
                    this.bigFangsHeal   = heals[lvl];
                },
            },
            {
                name: this.boostCardLabel('Hyperactivity'),
                desc: (() => {
                    const lvl = this.ownedPassives.filter(p => p === 'Hyperactivity').length;
                    if (lvl === 0) return 'Every 70 kills: move faster for 5s';
                    if (lvl === 1) return 'Every 40 kills: move much faster for 12s';
                    return 'Every 24 kills: move very fast for 20s';
                })(),
                available: () => this.ownedPassives.filter(p => p === 'Hyperactivity').length < 3,
                effect: () => {
                    this.ownedPassives.push('Hyperactivity');
                    const lvl = this.ownedPassives.filter(p => p === 'Hyperactivity').length;
                    this.hyperactivityLevel = lvl;
                    if (lvl === 1) { this.hyperactivityKillGoal = 70; }
                    else if (lvl === 2) { this.hyperactivityKillGoal = 40; }
                    else { this.hyperactivityKillGoal = 24; }
                },
            },
            {
                name: this.boostCardLabel('Bug Catcher'),
                desc: (() => {
                    const lvl = this.ownedPassives.filter(p => p === 'Bug Catcher').length;
                    const chances = [10, 17, 25];
                    const durs    = [2,  6,  10];
                    const next = lvl + 1;
                    return `${chances[lvl]}% chance to immobilize attacker for ${durs[lvl]}s${next <= 2 ? ` → ${chances[next]}% / ${durs[next]}s` : ''}`;
                })(),
                available: () => this.ownedPassives.filter(p => p === 'Bug Catcher').length < 3,
                effect: () => {
                    const lvl = this.ownedPassives.filter(p => p === 'Bug Catcher').length;
                    const chances = [0.10, 0.17, 0.25];
                    const durs    = [2000, 6000, 10000];
                    this.ownedPassives.push('Bug Catcher');
                    this.bugCatcherChance   = chances[lvl];
                    this.bugCatcherDuration = durs[lvl];
                },
            },
        ];

        // Build the pool: all available weapons first, then passives
        const availableWeapons  = weaponUpgrades.filter(w => w.available());
        const availablePassives = passiveUpgrades.filter(p => !p.available || p.available());
        const allUpgrades = [...availableWeapons, ...availablePassives];

        // Loadout panel — shown below the cards
        const { weaponLine, boostLine } = this.buildLoadoutText();
        ui.push(this.add.text(W / 2, H / 2 + 110, weaponLine, {
            fontSize: '11px', fontFamily: 'Arial', color: '#aaffaa',
            align: 'center', wordWrap: { width: W - 80 },
        }).setScrollFactor(0).setDepth(201).setOrigin(0.5, 0));
        ui.push(this.add.text(W / 2, H / 2 + 135, boostLine, {
            fontSize: '11px', fontFamily: 'Arial', color: '#aaaaff',
            align: 'center', wordWrap: { width: W - 80 },
        }).setScrollFactor(0).setDepth(201).setOrigin(0.5, 0));

        const cardW  = 190;
        const cardH  = 130;
        const gap    = 20;
        const startX = W / 2 - (cardW * 1.5 + gap);

        // Reroll button (above cards, top-right area)
        const rerollBtn = this.add.text(W / 2, H / 2 - 73, `🎲 Reroll  (${this.rerolls})`, {
            fontSize: '13px', fontFamily: 'Arial', color: this.rerolls > 0 ? '#ffdd55' : '#666666',
            backgroundColor: '#222222', padding: { x: 12, y: 6 },
        }).setScrollFactor(0).setDepth(202).setOrigin(0.5);
        if (this.rerolls > 0) rerollBtn.setInteractive({ useHandCursor: true });
        ui.push(rerollBtn);

        // Card elements that get replaced on reroll (separate from persistent ui[])
        let cardEls = [];
        let rKeyHandler = null;
        let padHandler = null;
        let currentChoices = [];
        let selectedCard = 0;

        const pickCard = (upgrade) => {
            playSfx(this, 'sfx_upgrade_selected');
            upgrade.effect();
            this.updatePauseBtnGlow();
            rKeyHandler && this.input.keyboard.off('keydown-R', rKeyHandler);
            padHandler  && this.input.gamepad.off('down', padHandler);
            cardEls.forEach(el => el.destroy());
            ui.forEach(el => el.destroy());
            // Keep time.paused / physics.pause() (set when the level-up screen opened) in
            // effect for the whole countdown too, exactly like the regular pause menu — so
            // weapon cooldowns, enemy spawns, poison ticks, boss timers, etc. stay frozen
            // instead of silently ticking (and burning a cycle for nothing, since every
            // do*() function early-returns on isCountdown). The countdown label ticks via
            // real setTimeout, which runs independently of Phaser's paused clock.
            const isActive = () => this.scene.isActive();

            const countLabel = this.add.text(W / 2, H / 2, '3', {
                fontSize: '72px', fontFamily: 'Arial Black, Arial',
                color: '#ffffff', stroke: '#000000', strokeThickness: 8,
            }).setScrollFactor(0).setDepth(210).setOrigin(0.5);

            this.isCountdown = true;

            const resume = () => {
                if (!isActive()) return;
                countLabel.destroy();
                this.physics.resume();
                this.time.paused = false;
                this.isLevelingUp = false;
                this.isCountdown  = false;
                if (this.pendingLevelUps > 0) {
                    this.pendingLevelUps--;
                    this.time.delayedCall(this.fastUpgrade ? 0 : 200, () => this.showLevelUp());
                } else {
                    this.fastUpgrade = false;
                }
            };

            if (!this.fastUpgrade) {
                setTimeout(() => { if (isActive() && countLabel.active) countLabel.setText('2'); }, 500);
                setTimeout(() => { if (isActive() && countLabel.active) countLabel.setText('1'); }, 1000);
            }
            setTimeout(resume, this.fastUpgrade ? 0 : 1500);
        };

        const applyCardHighlight = () => {
            // cardEls layout: for each card i → indices i*3=card rect, i*3+1=title, i*3+2=desc
            currentChoices.forEach((upgrade, i) => {
                const card = cardEls[i * 3];
                if (!card) return;
                const isWeapon   = upgrade.type === 'weapon';
                const cardColor  = isWeapon ? 0x2a1a00 : 0x1a1a44;
                const hoverColor = isWeapon ? 0x7a4400 : 0x3333aa;
                card.setFillStyle(i === selectedCard ? hoverColor : cardColor);
                card.setStrokeStyle(i === selectedCard ? 3 : 0, 0xffffff);
            });
        };

        const drawCards = () => {
            cardEls.forEach(el => el.destroy());
            cardEls = [];
            selectedCard = 0;

            currentChoices = Phaser.Utils.Array.Shuffle([...allUpgrades]).slice(0, 3);

            currentChoices.forEach((upgrade, i) => {
                const cx = startX + i * (cardW + gap) + cardW / 2;
                const cy = H / 2 + 30;

                const isWeapon  = upgrade.type === 'weapon';
                const cardColor = isWeapon ? 0x2a1a00 : 0x1a1a44;
                const hoverColor= isWeapon ? 0x7a4400 : 0x3333aa;
                const titleColor= isWeapon ? '#ffaa00' : '#ffff00';

                const card = this.add.rectangle(cx, cy, cardW, cardH, cardColor)
                    .setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });

                const title = this.add.text(cx, cy - 32, upgrade.name, {
                    fontSize: '15px', fontFamily: 'Arial Black, Arial',
                    color: titleColor, align: 'center', wordWrap: { width: cardW - 20 },
                }).setScrollFactor(0).setDepth(202).setOrigin(0.5);

                const desc = this.add.text(cx, cy + 10, upgrade.desc, {
                    fontSize: '12px', fontFamily: 'Arial', color: '#cccccc',
                    align: 'center', wordWrap: { width: cardW - 20 },
                }).setScrollFactor(0).setDepth(202).setOrigin(0.5);

                cardEls.push(card, title, desc);

                card.on('pointerover', () => { selectedCard = i; applyCardHighlight(); });
                card.on('pointerout',  () => card.setFillStyle(cardColor));
                card.on('pointerdown', () => pickCard(upgrade));
            });

            applyCardHighlight();
        }; // end drawCards

        const doReroll = () => {
            if (this.rerolls <= 0) return;
            this.rerolls--;
            rerollBtn.setText(`🎲 Reroll  (${this.rerolls})`);
            if (this.rerolls === 0) {
                rerollBtn.setColor('#666666');
                rerollBtn.disableInteractive();
            }
            drawCards();
        };

        rerollBtn.on('pointerdown', doReroll);
        rKeyHandler = this.input.keyboard.on('keydown-R', doReroll);

        // Gamepad handler for level-up screen: LB(4)/RB(5) navigate, A(0) pick, Y(3) reroll
        padHandler = (pad, button) => {
            const idx = button.index;
            if (idx === 4 || idx === 14) { // LB or d-pad left
                selectedCard = (selectedCard + 2) % 3;
                applyCardHighlight();
            } else if (idx === 5 || idx === 15) { // RB or d-pad right
                selectedCard = (selectedCard + 1) % 3;
                applyCardHighlight();
            } else if (idx === 0) { // A = pick
                if (currentChoices[selectedCard]) pickCard(currentChoices[selectedCard]);
            } else if (idx === 3) { // Y = reroll
                doReroll();
            }
        };
        this.input.gamepad.on('down', padHandler);

        // Gamepad hint below reroll button
        ui.push(this.add.text(W / 2, H / 2 - 55, '🎮  LB / RB  Navigate    A  Pick    Y  Reroll', {
            fontSize: '11px', fontFamily: 'Arial', color: '#888888',
        }).setScrollFactor(0).setDepth(202).setOrigin(0.5));

        drawCards();
    }


};
