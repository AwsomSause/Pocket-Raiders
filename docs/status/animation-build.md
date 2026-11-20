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

- Foe trainer step-in (pass 4): in a trainer battle (singles, full animations) the trainer skids in from the right onto
  the empty spot, steps back, whips the ball from the hand and leaves while it flies (`foeThrowClip`). Sized by what is
  drawn: at most 208 px tall and 176 px wide. Reduced/Off, doubles and wild battles keep the ball from the screen edge.
  An ace still lands by itself after its call.
- Trainer face chip (pass 19): on a big hit (super effective, critical, or 40% of max HP) and on a knock-out your trainer's face pops in at the bottom right with the mockup's word ("Nice hit!", "Yes!", "Hang in there!", "We did it!", "You did great."), at most one per 1.2 s (`cheerClip` in motionBasics, pictures in `src/ui/battleFx/cheerChip.ts`). None with animations off or with the Phantom look's own cards. Ring colours for Blue, Green, Nate and Hilda are picked by us (the mockup only shows Red). The info bar now tucks away during a switch and comes back with the new name while the Pokémon settles (pass 2; singles).
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
- Damage number shown twice (REANIMATE #12, a need): every hit floated two numbers (BattleScene's own and the event's
  cue). Now one, from the cue, as the mockup's pass 5: springs out 0.4 to full in 140 ms, hangs 450 ms, lifts 54 px and
  fades; white 44 px, critical 60 px yellow, healing green "+". It obeys Damage numbers (off: none) and Damage popup size.
- Miss (pass 2): the attacker leans back and dashes past where the target stood; the target side-steps away with a
  squash and stretch; dust at both feet; both spring home (`missClip`). Reduced: a small side-step only. Off: nothing.
  The MISS word is the existing badge.
- HP bar (pass 2 + 5): the bar snaps down in 0.28 s, the pale ghost bar holds and catches up (from 0.2 s, 0.32 s),
  the plate jolts 5 px with a spring, and the bar flashes once when it crosses into yellow or red. The New UI's own
  bar drains on the same 0.28 s.
- Danger (pass 5): under a fifth of HP (was a quarter) the plate glows red in a soft 1 s pulse, the bar pulses
  brighter every 0.5 s, and the Pokémon sags (3% wider, 5% shorter) and breathes in 0.75 s. A heal ends all of it
  and stands the Pokémon back up at its own size. Reduced/Off: a still glow only.
- Standing (pass 11): each Pokémon stands its own way between turns (`standKind`/`standLook`, `src/ui/battleFx/stance.ts`):
  steady breath 1.9 s with the width squeezing, hover (rises 8 px, 1.5 s), float (rises 12 px, tilts 2°), heavy
  (slow 2.8 s), twitch (fast breath and a small hop every 2.6 s), sway (tilts 2.5°). Chosen by species as in the
  mockup, then by first type; a Dynamaxed giant stands heavy. Sideways moves are left out (attack lunges move
  sideways). Faint, recall, miss and danger stop it and put the Pokémon back on its spot first. Full only. Limit:
  the contact shadow does not shrink with the breath yet.
- Shiny entrance (pass 11): six stars spiral in and collapse onto the foe; a flash, a white glint sweeps across it,
  the arena brightens for a beat and three rings go out; a yellow "SHINY" chip springs up over it and flies to the top
  of its name plate, where it stays until a plain Pokémon takes the plate (`shinyClip`). Reduced/Off: just the chip.
  Limit: the mockup's slow shimmer on the shiny afterwards is not in.
- Wild encounter (pass 5): a lone wild Pokémon (not doubles, raids, totems or the Phantom look's own card) opens with
  two white flashes; the screen is nine dark bars that pull apart left and right in turn; the Pokémon slides in from
  the right as a black shape; its colour floods in with its cry, three white rings and a hop; then its plate flies in
  and "A wild X appeared!" (`wildEntranceClip`, `BattleScene.wildEntranceMoment`). The bars stand in for the opening
  camera sweep. Reduced: the usual short fade, then the shape's colour fades in. Off: it is just there. Limit: the
  mockup's platform slides in with the Pokémon; ours is part of the arena picture, so it stays.
- Level up (pass 2): when your Pokémon levels up, a pale blue flash, the plate jolts up 6 px as the number ticks over,
  the Pokémon does two happy hops (46 px, then 30 px) with dust on each landing, and a yellow "LEVEL n" stamp springs
  out over it, hangs a second and lifts away (`levelUpClip`, `BattleScene.levelUpMoment`; replaces the old gold
  "LEVEL UP!" banner). Reduced: the stamp shows and fades. Off: just the number. Singles only.
