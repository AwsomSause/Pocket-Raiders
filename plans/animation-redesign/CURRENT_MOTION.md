# What moves in the game today

A survey of the main game's code-made motion (tweens, CSS, scripted effects), taken 2026-11-20 from the `ui-mockups` branch. Evil Mode is left out. Paths are under `src/`. It is the starting point for `REANIMATE.md`.

MAIN GAME MOTION INVENTORY (code-made motion only; Evil/Dominion skipped). Paths are under /home/user/pkmn/src unless noted. Counts from node on src/data/moveAnims.json and src/data/ebdxAnims.json.

HEADLINE
- There are no Phaser particle emitters anywhere (0 hits for createEmitter/add.particles). Every "particle" is a tweened image, text or shape (for example ui/battleFx/familyFx.ts, ui/battleFx/abilityFx.ts sparks).
- Screen shake is either the field container shaken in 6 steps (ui/battleFx/battleFx.ts:414) or Phaser camera shake (about 37 call sites, e.g. ui/battleFx/cinematics.ts:297, ui/battleFx/familyFx.ts:169).
- New UI (ui/redux/redux.css) has about 55 @keyframes and about 60 animation rules; they are gated by prefers-reduced-motion and a .calm class.

1. BATTLE (scenes/BattleScene.ts unless noted)
- Pokémon idle: battler sprites are animated atlases. Every frame loops at 12 fps (ui/sprites.ts:19-33, 115); 3 species bounce-loop (ui/sprites.ts:16). Off when Sprite animations is off (ui/display.ts:14).
- Idle breathe: scaleY x1.035, 900 ms yoyo, forever (ui/aero.ts:108-115); starts 450 ms after send-out (BattleScene.ts:1359-1363).
- Send-out entrance: bounceIn scale 0.6 to 1, 420 ms Back.easeOut (ui/aero.ts:76-83).
- Send-out throw: player trainer frame strip (ui/playerTrainer.ts:8-10 moments throw/recall/win/hit/defeat; frame 5 releases ball, :16). Ball flies 700 ms along an arc with 120 px lift and 720 deg spin (ui/playerTrainer.ts:140-165). Trainer leans 14 px, 150 ms yoyo.
- Sending out via a sendOutMoment (BattleScene.ts:1121-1134), then trainerOut.
- Recall: sprite alpha to 0 over 250 ms (BattleScene.ts:5152-5158). The trainer plays recall pose. No ball-return visual exists. GAP.
- Faint: sprite alpha 0 and y+30 over 400 ms plus se.faint (BattleScene.ts:5133-5139). No death shake or cry visual. GAP.
- Hit flash / hit-stop: impact cue (ui/battleFx/battleFx.ts:390-412). Tint-fill white for hitStopMs (60 ms default; x1.4 crit, x1.2 super; core/presentation/cues.ts:125-140). Then a colour flash rectangle, 180 ms fade (battleFx.ts:397-400). Blink 70 ms if no hit-stop.
- Damage shake: battleFx.ts:414-424, 6 steps of 30 ms on the field only (menus still). Strength = min(4,level)*3*shakeIntensity px (cues.ts:~137).
- Damage numbers: battleFx.ts:426-441. Scale 0.6 to 1 in 120 ms Back.easeOut, rise 46 px over 500 ms after 500 ms delay. Off-motion fades at 700 ms.
- Possible double numbers: BattleScene.ts:5039 calls floatDamage (BattleScene.ts:2230, 900 ms rise) on HP drop as well as the number cue. Not verified whether both play. CHECK.
- HP bar drain: Bar.set (ui/widgets.ts:547-612). Duration 250+450*|delta| ms, Sine.easeOut; a ghost bar follows after 180 ms over 320 ms Quad.easeIn when dropping. KitBar in ui/battleUiStyles.ts:39 (same easing).
- EXP bar: same Bar class, animated at BattleScene.ts:1675-1681.
- Level-up: levelUpBanner (ui/battleFx/transitions.ts:10-24). Text 360 ms Back.easeOut from 0.4 scale; rises 46 px over 520 ms after 1000 ms; gold burst. Triggered at BattleScene.ts:5436.
- Stat up/down: statArrows (battleFx.ts:460-475): three arrows drift 60 px and fade over 600 ms, 300 ms wait. Plus word banner text.statUp/statDown (ui/battleFx/abilityFx.ts:234).
- Status conditions (full motion only): commonAnim status.brn/psn/par/slp/frz (core/presentation/cues.ts:230-236). Plus text.status banner. 'cant' for slp/frz/par replays the status anim. Confusion: commonAnim confusion (cues.ts:217-219). Residual burn/poison/leech/recoil/weather damage: number only, NO status animation (cues.ts:185-186, 214-215). GAP.
- Weather: commonAnim weather.* (cues.ts:207) plus a persistent layer: rain/hail/snow falling sprites, sand/snow scroll, sun glow (ui/battleFx/weather.ts:44-86). Falling sprites tween 520-3200 ms.
- Terrain: commonAnim terrain.* (cues.ts:210-212) from the move pack only (4 slots). No persistent terrain layer found. GAP (verify).
- Catch (animateBall, BattleScene.ts:5560-5600): trainer throw (sendOut, waits for release). Ball flies 450 ms Quad.easeOut. Foe sprite shrinks to 0.01 and fades (250 ms). Ball bounces 250 ms Bounce.easeOut. Each shake: 250 ms wait then 120 ms yoyo ±20 deg. Caught: burstReveal (spectacle.ts:140) plus Seal Case extra bursts, then alpha pulse 150 ms. Shiny: shinyCatchBurst gold ring (ui/battleFx/arenaLife.ts:159-185).
- Break-out: ball is destroyed and the foe sprite re-shown instantly, no burst. GAP (BattleScene.ts:5590-5593).
- Switching in: slideIn for the info box 420 px (BattleScene.ts:1606); foe switchIn camera pan and zoom 1.12 at 350 ms (BattleScene.ts:5179-5196).
- Trainer slide-in: trainerIn 520 ms Sine.easeOut from the left (BattleScene.ts:1137-1150). Trainer out: 400 ms delay, then alpha 0 and x-60 over 380 ms Quad.easeIn (BattleScene.ts:1152-1166).
- Ace announcement: burstReveal at foe then say() "sends out their ace" (BattleScene.ts:5200-5203). Rival: aceBurst (ui/battleFx/rivalStepIn.ts:66).
- Enemy healing item: commonAnim heal (cues.ts:199) plus heal number (cues.ts:200). Map healing stop has a green wash and 14 rising sparkles, 800 ms (scenes/MapScene.ts:546-558).
- Text box: typewriter via ui/dialogue/storyDialogue.ts:87 with LETTER_MS normal 30 ms/char (storyDialogue.ts:14). BUT battle textSpeed defaults to 'instant' (core/state.ts:2000), so battle messages do not type by default.
- Battle-start intro: introTransition (ui/battleFx/spectacle.ts:51-139). Wild: glass shutters 360 ms plus ball bloom, beat 1050 ms. Trainer: bars scale in, trainer slides 480 ms, VS (ui/battleFx/vsScreens.ts:37) . Opening foe reveal: openingReveal (ui/battleFx/opening.ts:52) camera pan 900 ms, zoom 1.7, veil fade 700 ms, rotate 1900 ms.
- Battle-end exit: exitWipe (spectacle.ts:312): rule-mask wipe (ui/battleFx/ruleWipe.ts:22, 520 ms) or two glass shutters 260 ms Bounce.
- Battle-start screen transition: ui/transitions.ts:19 forces a plain fade for the Battle scene whatever transitionStyle says.
- Critical hit: letterbox bars slide 'slideMs' with hold (ui/battleFx/skillMoments.ts:67-76) from BattleScene.ts:5042. Crit freeze with camera pick (skillMoments.ts:78), opt-in via skill prompts.
- KO/phase camera push: focusPush zoom (BattleScene.ts:2221-2229). cameraMove pan and zoom (BattleScene.ts:2191-2210) gated by battleCamera.
- Miss: target slides 36 px and fades 130 ms yoyo (BattleScene.ts:5141-5149).
- Boss phase: phaseBanner (ui/battleFx/spectacle.ts:366) plus arena light wash alpha 220 ms (ui/battleFx/arenaLife.ts:109-128) plus focusPush('phase') (BattleScene.ts:5456-5458).
- Second chance: say() lines then scene.start, a hard cut with no motion (BattleScene.ts:4551-4556). GAP.
- Rewind: text menu only, no motion found (BattleScene.ts:4037 showRewindMenu). GAP.
- Last Resort / mentor: mentorScene (ui/battleFx/mentorScene.ts) plus playMoment (BattleScene.ts:3982-4020).
- Two-turn charge: chargeUp (ui/battleFx/cinematics.ts:848).

2. MOVE ANIMATIONS
- Source: src/data/moveAnims.json (generated) and src/data/ebdxAnims.json. Schema at src/core/presentation/moveAnims.ts:12-45.
- Pack choice (ui/... setting moveAnimPack, core/presentation/moveAnimPack.ts:19-23): Mixed = EBDX script first, then Essentials pack, then PokeRogue. PokeRogue-only and Essentials-only use one set with the other as stand-by.
- Playback: scripted EBDX moves run through ui/battleFx/scriptPlayer.ts:28 (420 script files). Frame animations run through ui/battleFx/animPlayer.ts:81 at 50 ms per frame (core/presentation/animFormat.ts:24). Sprite graphics and background tweens inside.
- Counts (1519 moves in moveAnims.json): 851 use their own PokeRogue anim file; 668 borrow another move's file (source "type"); 241 have an Essentials pack anim; 480 have an EBDX script; 968 have neither pack nor script (PokeRogue only); 94 have a charge anim. Every one of the 1147 anim files exists on disk. Shake: 0:384, 1:184, 2:284, 3:667 moves. Flash colour on 727 moves. Telegraph: normal 814, strong 658, quick 47.
- Generic fallback when no file loads (1.5 s timeout, battleFx.ts:39): first the 26-family effect (ui/battleFx/familyFx.ts:198; recipes in core/presentation/families.ts:39). Family is picked by moveFamily (families.ts:105). If no family, the basic lunge 24 px 90 ms plus colour tint 120 ms (battleFx.ts:367-388). Type sound plays first (battleFx.ts:358). Signature moves (Z/Max) also play the family burst on top (battleFx.ts:~318).
- Note: no anim file is missing on disk, so the fallback mainly runs for load failures and signature overlays.
- Mastery flourish: sparks and shine ring on the target (battleFx.ts:322).

3. GIMMICKS
- Timing table: core/presentation/transformAnims.ts:15 (mega 4300, primal 2500, dynamax 2400, gigantamax 2400, dynamaxEnd 650, zmove 1900, tera 2200, evolve 2700 ms).
- Full scenes vs short: BattleScene.ts:5262-5380 picks full reference scenes (megaScene.ts:42, teraScene.ts:42, dynamaxScene.ts:52, zMoveScene.ts:47) unless the Fast X setting is on (fastMega, fastTera, fastDynamax, fastZMove; core/state.ts:2120-2125). The Fast path is cinematic() (ui/battleFx/cinematics.ts:81), with generic kinds.
- Mega: pink crystal shatter, white flash (cinematics.ts:331-386; megaScene.ts header).
- Dynamax/Gigantamax: ball recall, trainer slide-in, band rises, ball falls and shakes 4 times, silhouette grows, red giant roars (cinematics.ts:516-600).
- Z-Move: silhouette white, speed lines, rainbow Z-ring, title slides in (cinematics.ts:742-770).
- Tera: jewel floats and bobs, 4 px, sin/300 ms (BattleScene.ts:1398-1412). Crystal shakes (teraScene.ts:245, 297).
- Primal: same crystal path (cinematics.ts:50 crystal option).
- Galar stadium (ui/galar/stadiumDirector.ts): favour bar eases 500 ms (line 321); banner slides y60 hold 650 ms (line 264); camera cut art (ui/galar/cutArt.ts, 10 tweens) plus crowd sound cues. Ends with interview.
- Max Raid den / Dynamax band: no den-specific motion found beyond raid banners, raid arena look (ui/battleFx/cineLook.ts:12) and the phase banner. Verify.
- Totem Pokémon: aura is text only (BattleScene.ts:1953, 3062). No aura visual. GAP.
- Shadow / purified aura (blissful): burstReveal in aura colour (BattleScene.ts:2743-2744), shadow pulse via ui/battleFx/markAura.ts:72 (900 ms yoyo). Verify whether shadow counts as main game.
- Ultra Beast incursions: core/ultra/ has data and rules only. No presentation found in scenes or battleFx. GAP.
- Legendary blessing: scenes/BlessingScene.ts (black screen, item floats, lines one at a time). Legend title cards: core/presentation/legendAnims.ts:12-23 (12 shapes, 1200-1600 ms) and ui/battleFx/rivalStepIn.ts:115 legendFlash.
- Rewinds: menu only (see 1). Second Chance: hard cut (see 1). Heated/Hyper moments: storyAnim overdrive.* (core/presentation/storyAnims.ts, 23 ids) played by ui/battleFx/storyFx.ts:94. Momentscene: fade to black, static, then lines (ui/battleFx/momentScene.ts:132).

4. OUT OF BATTLE
- Title: 6 video clips crossfade every 9 s hold, 1.5 s fade (ui/titleClips.ts; core/presentation/titleClips.ts:5-6). "Press start" blink 650 ms alpha 0.2 yoyo (scenes/MainMenuScene.ts:158). Icon slide 260 ms Back (MainMenuScene.ts:100).
- Boot: fish bob 600 ms (scenes/BootScene.ts:176) and scale in (181). Loading looks: ui/loadingLooks.ts (9 looks, loops 700-1400 ms).
- Screen transitions (main.ts:150-162 calls enterTransition). ui/transitions.ts: fade 220 ms; bounce zoom 0.9 to 1 Back; wipe cover 300 ms slide; ripple ring scales to 30x over ~420 ms. Setting transitionStyle (core/state.ts:2079). Sheen sweep on every screen (sheenSweep).
- Hub Town (scenes/HubScene.ts, ui/hubTown/townView.ts): tile walk 140 ms, run 75 ms (townView.ts:17-18, 284-288); walk cycle 10 fps, run 14 fps. NPCs wander (ui/hubTown/crowd.ts: step 140 ms yoyo, idle walks). Day/night halo pulse 1300+ ms (ui/hubTown/townTime.ts:38). Growth: spout drops, sparkles (ui/hubTown/townGrowth.ts:42-78). Indicators bob 520 ms (ui/hubTown/indicators.ts:89).
- Pocket Town (scenes/TownScene.ts, ui/hubTown/pocketFolk.ts:139): folk walk 340 ms, anim 7 fps.
- Stage map (scenes/MapScene.ts, 2741 lines): travel token hops 380 ms with 34 px arc (MapScene.ts:1460-1490). Halo breathes on reachable nodes (1022-1025). Open paths carry light sparks (968-978, 1300 ms). Path lines are drawn static, no draw-on animation. GAP. Map parallax layers (764, 180 ms) and map wash on stop (551). Egg wobble on map (1180). Healing stop (546-558). Dream blur on resume (905). Welcome-back banner pans 900 ms (1384).
- Events (scenes/EventScene.ts, ui/eventStyles/*.ts, 8 styles, 3-12 tweens each): ui/redux/screens/event.ts, CSS ev-* keyframes (redux.css:133-195). Text typing: storyDialogue typeSpeech (speechSpeed setting). Reward pops in outcome cards: ui/redux/screens/event.ts burst marks.
- Pseudo-stages and reward: scenes/MapScene.ts:1388-1392 banner.
- Evolution: full scene (ui/evolutionScene.ts:237-306; timing core/presentation/evolutionScene.ts:26 EVO_FLICKER firstMs 560 factor 0.84 totalMs 4200 flashMs 420). Silhouette flicker faster and faster, white flash, reveal scale 1.15 to 1 Back 260 ms. Reduced: 900 ms, no flicker.
- Egg hatch: scenes/DecisionScene.ts:697-781. Caption rise 400 ms, egg hop 420 ms, three wobbles with cracks and camera shake 90 ms, burst scale 5.4 then flash 520 ms, rays 900 ms.
- Shop: scenes/ShopScene.ts plus ui/shopStyles/*.ts (8 styles). Coin count-up 380 ms (ui/shopStyles/common.ts:105); price pop 320 ms Back (common.ts:113); bazaar shake 60 ms x4 on fail (bazaar.ts:155); depot box slide 420 ms (depot.ts:136).
- Party/summary: ui/partyPanel.ts:418 (sprite sway 1400 ms), 496 (close fade 12 px), 662-663 hop/sway loops. Lively team toggle (livelyTeam). Party styles ui/partyStyles/*.ts (8 styles).
- Reward screen: scenes/RewardScene.ts and ui/rewardStyles/*.ts (9 styles). Card reveal 160 ms Back (holopack.ts:38), cut-in 360 ms slide (cutin.ts:25), gift lid 200 ms, sheen 800 ms yoyo, rays 40 s loop.
- Trade: scenes/TradeScene.ts with ui/tradeStyles/*.ts (13 styles, 2-7 tweens each).
- Level cap, expeditions, minigames: no specific motion found in the greps. Not inventoried further.
- Settings toggles that gate animation (core/settingsRegistry.ts, core/state.ts ~1990-2140): battleAnimations (full/reduced/off), disableAllAnimations, effectIntensity (Flashes), shakeIntensity (Screen shake), shakeHits (move hits), shakeStory (story moments), reducedFlash, reduceParticles, animationSpeed, animationIntensity, battleSpeed, battleCamera, critLetterbox, battleScreenEffects, spriteAnimations, menuAnimations, transitionStyle, abilityAnimations, battleTextAnimations, interactionAnimations, hyperAnimations, rivalAnimations, evolutionAnimations, transformAnimations, fastZMove, fastDynamax, fastTera, fastMega, mapParallax, livelyTeam, damageNumbers, textSpeed, speechSpeed, skipSeenDialogue, skipRecap, skipGuard, performancePreset, crtFilter, moveAnimPack.

5. TRAINER SPRITES
- Ordinary trainers: single stills (ui/sprites.ts:173 trainerVisual, static first frame).
- Intro strips (trainer.drive/*, ui/sprites.ts:197-208 posedSprite): play once at 12 fps and hold the last frame. Still when sprite animations off.
- Bosses with animated art: 75 ids in BOSS_ANIMATED (src/assets/catalog.ts:109), posed once (ui/sprites.ts:175-180).
- Throwing back sprites: 19 ids in BOSS_BACKS (catalog.ts ~line 135), posed at 10 fps (ui/sprites.ts:222-225).
- Player trainer: frame strip per moment (ui/playerTrainer.ts), see 1.
- Trainer leave-off / slide is tween (see 1).

6. PRESENTATION CUE SYSTEM (src/core/presentation/cues.ts)
- Cue union, 12 kinds (cues.ts:34-56): telegraph (marker on user before move, style normal/strong/quick); moveAnim (plays move file, pack/script/alt); pulse (reduced-motion tint stand-in); impact (hit-stop, shake, flash, blink); number (floating number); badge (SUPER/WEAK/IMMUNE/CRIT); commonAnim (status/heal/weather/terrain/confusion/protect/bind/seed slots); statArrows; abilityAnim (ability banner, ability.* ids); textAnim (text.super/crit/weak/immune/miss/statUp/statDown/status); storyAnim (overdrive.*, interaction.*, rival.*, bond.*, drama.*); momentScene (full-screen moment scene).
- Dispatcher: ui/battleFx/battleFx.ts:134-180 (playCue switch, one case per kind).
- Engine events mapped in cues.ts:109-249 (case per event type): move, damage, noEffect, miss, ability, hyper, pmoment, spectacle, switchIn, item, residual, recoil, confusionHit, bindDamage, seedDamage, drain, heal, charge, weather, terrain, weatherDamage, confused, confusion, protect, bound, seeded, status, cant, stat. Events handled directly in BattleScene, not via cues: faint (5133), switchOut (5152), evolved (5173), caught/animateBall (5560), raid phase (5456).
- Registry of named animations: core/presentation/animRegistry.ts (plan: ms, shakes, flashes, particles, reduced fallback). Other registrations: abilityAnims.ts (8 ids), storyAnims.ts (23), spectacleAnims.ts (6), transformAnims.ts (8), legendAnims.ts (12). A cue with no animation is a "snap" candidate: residual/recoil/weatherDamage ticks, faint, switchOut, break-out, second chance, rewind, totem aura, ultra beast, path draw.
- Reanimation candidates (no motion today): residual ticks, faint and recall (only fades), ball break-out, second chance hard cut, totem aura, ultra beast entry, terrain persistent layer, map path draw-on.

UNSURE / NOT VERIFIED
- Whether BattleScene.ts:5039 floatDamage duplicates the number cue.
- Max Raid den presentation and the raid shield visuals (only text found).
- Terrain persistent visual (only common anim found).
- Level cap, expeditions and minigames not searched in depth.
