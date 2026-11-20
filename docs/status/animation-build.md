# Animation build (the redesign, in the real game)

Kice 2026-11-20: build the animation redesign (`plans/animation-redesign/`, 25 passes) into the game, as close to
the mockups as possible. The UI build owns how things look; this build owns how things move. Rule: specific move
animations are never added or changed; the Pokémon and the surroundings may move.

## How it is built

- **A clip is data.** `src/core/presentation/motionClip.ts` holds the mockup kit's timeline (`at`, `to`, `wait`,
  `also`, `arc`, the same easing curves) in milliseconds, and `sampleClip(clip, t)` gives every part's numbers at a
  moment. No Phaser, no game state, no gameplay RNG, so the timings are unit-tested against the mockups.
- **One player.** `src/ui/battleFx/motionPlayer.ts` samples the clip on the scene clock (so battle speed and the
  Animation speed setting apply), puts the numbers on the sprites, and draws the one-shot effects (dust, ring, beam,
  flash, exp lights). It always ends (a real-clock watchdog) and leaves the parts in the clip's end state.
- **One rule for the settings** (pass 25): Full plays everything. Reduced keeps the shapes that say what happened and
  drops wind-ups, flashes, particles. Off (or Disable all animations) moves nothing and takes no time. Flashes follow
  the Flashes and Reduced flash settings, dust and lights follow Particle effects.

## Slice 1: battle basics (done)

| Clip | What the player sees | Where |
|---|---|---|
| Send-out | The ball arcs from the hand, lands, bounces once and bursts with a ring; the Pokémon pops out white, stretches up, lands flat and wide, settles; dust on both landings. Used for the opening throw and every switch-in, both sides. | `sendClip`, `BattleScene.sendMoment` |
| Recall | The ball is held out, the Pokémon turns red, braces, is pulled thin up a red beam, the ball jolts as it catches. | `recallClip`, `BattleScene.recallMoment` |
| Faint | A stagger away from the other side, a sway, the knees give, then it sinks into the ground at its feet with dust; its base stays dark until the next Pokémon lands. | `faintClip`, `BattleScene.faintMoment`, `dimBase` |
| Exp lights | A fallen foe's experience leaves it as seven lights that fly to your Exp bar; the bar fills as they arrive. | `expLightsClip`, the `xp` event |

Tests: `tests/unit/motionBasics.test.ts` (timings against the mockups, the Reduced and Off rule),
`tests/e2e/motionBasics.spec.ts` (the clips in a real battle at Full, Reduced and Off; sprites left as the battle expects).

## Known limits

- The foe's ball comes from the screen edge (the mockup's pass 2); the foe trainer stepping in to throw (pass 4) comes
  with the trainer intro slice.
- The trainer face chip on a knock-out (pass 19) is not in yet. The info bar now tucks away during a switch and comes back with the new name while the Pokémon settles (pass 2; singles).
- Double battles use the new faint, recall and send-out for the focused Pokémon; the dark base and exp lights are singles only.
- The faint's camera push is still the game's own KO camera (it already follows the Battle camera setting).

## Slice 2: Kice's six notes (in progress)

| Note | State | Where |
|---|---|---|
| Blessing, "more religious-themed and holy" | Done. The original cutscene in its order, made holy as in pass 15: a bell tolls three times (a synthesised bell), light comes down through a turning rose window, the object descends under a halo, the Legendary appears behind it vast and pale, the passage is written a line at a time after an illuminated letter, candles catch from the middle out, feathers fall, and your partner bows under its own small halo. Reduced: each part fades in place, no flashes, particles or drifting. Off: the whole picture at once. | `src/scenes/BlessingScene.ts`, `src/ui/blessingRite.ts`, `playBellToll` in `src/ui/procAudio.ts` |
| Gimmick cutscenes, "wayyy more extravagant" | Done: pass 20, the final remake, beat for beat. **Mega** is glass: a double helix of colour climbs it, it turns white, cracks run to every edge, the new picture slams together from 24 shards (far corners first, the face last), locks with title and facts, and shatters off the field. **Tera** goes inside the jewel: a crystal closes over it, the camera dives in, twelve mirrored slices turn like a kaleidoscope and fold into the crown. **Dynamax** is one long camera climb from the trainer's shoes up the giant, through storm and lightning, to its roar. **Z-Move** is seen from the sky: the target small below, its shadow growing, the Pokémon coming down in its Z-Power, the damage (already decided by the rules) counted out, then the move's name card. Fast Mega / Tera / Z-Move / Dynamax, Reduced and Off keep the short cinematic as before. The four old reference scenes (megaScene, teraScene, dynamaxScene, zMoveScene) are removed. | `src/ui/battleFx/gimmickStage.ts`, `megaGlass.ts`, `teraJewel.ts`, `dynamaxPan.ts`, `zMoveSky.ts`; `BattleScene` `megaPage`, `gimmickPage`; test `tests/e2e/gimmickCutscenes.spec.ts` |
| Ace call | Battle half done: the ace is now announced BEFORE it lands. The trainer speaks, the ace's card plays over an empty field (the boss band, or the ACE! stamp), then the ace leaps onto its spot: it comes down, squashes flat and wide, dust, a gold ring and a star. Reduced: squash and ring. Off: it is just there. The Pocket look's band card (UI build, PR #1529) gets its motion next. | `aceLandClip` in `motionBasics.ts`, `BattleScene.aceCall`, `aceLandMoment` |
| Trainer intro, event choice, small map | The UI build draws the pages; this build moves them once they are in. | |

Limits: the Z-Move mockup drops a fireball; by Kice's move rule the move's own effect is never drawn, so what falls is the Pokémon wrapped in its own light. The gimmick pages are drawn on the canvas in the mockups' layout until the Pocket look's own gimmick page exists. The light shaft is back on the blessing screen by the approved mockup (the spotlight and plinth were removed on
2026-11-16; there is still no plinth). The bell is synthesised because the packs have no bell sound.

## Next

The rest of slice 2, then conditions, arenas, side roads, screens and flow from the two lists.
The lists in `plans/animation-redesign/REANIMATE.md` and `NEW_ANIMATIONS.md` carry a **Build** line per entry.
