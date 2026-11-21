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
- Light and heavy landings, and the cry (pass 11): a sent-out Pokémon of 22 kg or less bounces twice (18 px, then
  9) before its cry; one that stands heavy or weighs 300 kg or more comes down hard: an 11 px jolt, dust both ways,
  both plates rattle and the Pokémon across the field is bounced 16 px off its feet (`sendWeight`, `sendClip`). Every
  entrance ends with its cry: it leans back and thrusts forward while rings leave its mouth in its type's colour, two
  small ones, or three wide ones and a shake for a heavy or very tall one (`cryClip`). Reduced: the rings only.
  Limit: a Pokémon whose art is still loading is measured as a 120 px stand-in for the rings.
- Flinch (pass 11): when a Pokémon flinches it starts its lunge 30 px toward the foe, jerks to a stop and pulls its
  head down with a shiver, a "!" pops over it and a sweat drop falls, the dark FLINCHED stamp lands, and it backs up
  two steps before settling home (`flinchClip`). Reduced: one step back and the stamp. Off: only the line.
- Worn out (pass 11, on top of pass 5's danger glow): under a fifth of its HP the Pokémon slumps 8 px lower, tipped
  5 degrees, a little shorter and wider, its colour dulls, it breathes fast and shallow (0.62 s) and a sweat drop
  flicks off it every 0.45 s (`WORN`). Healed, it hops up, straightens, shakes it off and its colour comes back;
  fainting just ends it. Full motion only, like the danger sag it replaces.
- Winner's moment (pass 11): when a foe faints, your Pokémon (singles, still standing) hops twice, spinning once on
  the second, lands with dust, a gold note pops out with a spray of stars, then it leans toward you and a pink heart
  pops (`winClip`). A heavy one stamps once instead and the screen answers. The battle goes on after 1.3 s; the lean
  finishes while the EXP comes. Reduced: one small hop and the note.
- Toughed it out (pass 11): when a hit leaves your Pokémon on exactly 1 HP, it skids back with dust, drops low and
  shivers, the bar sparks, then it plants its feet with a gold glow, HUNG ON! lands and a pink heart floats up
  (`toughClip`). The battle goes on once it plants its feet. Reduced: a dip and the stamp.
- Waiting on you (pass 11): six seconds at the command menu with no key or tap and your Pokémon (singles) glances
  round with a yellow "?", then bounces twice with dust and the message box nudges (`waitClip`). Once a turn; it never
  takes the menu away, and choosing ends it. Reduced: only the "?". Off: nothing.
- Fixes found by GitHub's browser tests: a slump still settling in finishes before any other move of the Pokémon
  plays (it used to cut it short); after Hyper Beam's recharge a Pokémon springs back to exactly the height it stood
  at (it could end up a little smaller or bigger) and starts breathing only once it is there.
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
- Hit (pass 2 and 12, the target's side): with full animations a hit turns the target white for 80 ms and squashes it
  thin and tall; it is thrown 30 px away from the attacker (46 px for a super effective or critical hit) and springs
  home with dust where it landed (`hitClip`, `BattleScene.hitMoment`, through BattleFx's `recoil`). The battle still
  holds for the hit-stop. Quick hits in a row restart it from the spot, never from mid-recoil. The hit is also a light
  in the move's type colour (pass 18): a glow blooms on the target's body and a flat pool lights the floor under it; a
  big hit (super effective, critical or 40% of its HP) makes both bigger, throws it further and washes the other
  Pokémon in the colour; a sharp one (critical, super effective or 60%) flashes a 14-point white star where it lands
  (pass 17). Limits: the camera push on hard hits (pass 16) follows the Battle camera setting, which is off by
  default; the negative frame (pass 17) and the base jolt (pass 7, our platform is part of the arena picture) are not in. When a move's own
  animation is moving the target, it is left alone. Reduced/Off keep the battle's own blink. The attacker's side
  (wind-up and dash) is the move's own animation and is not changed (Kice's move rule).
- Healing (pass 3): a heal or drain on a Pokémon (full animations) shows the redesign's own heal instead of the
  pack's shared heal: ten green plus-signs rise through it one after another, it glows green and hops once, and a green
  ring spreads on the ground (`healClip`, `BattleScene.healMoment`, BattleFx `heal`). The HP bar now climbs with the
  number over 0.8 s (a drop still snaps in 0.28 s), on the canvas bar and the New UI's bar alike.
- Conditions (pass 8): each status now arrives, stays on the Pokémon and ticks, as the mockup's numbers
  (`src/core/presentation/motionConditions.ts`, `src/ui/battleFx/conditionLook.ts`, BattleFx `condition`). Burn: nine
  flames climb it, an orange wash pulses and two embers flicker at its feet; each turn they flare 2.6x and it flinches
  white. Poison (and Toxic): bubbles rise and pop, a purple wash; each turn a big bubble swells over its head and bursts.
  Paralysis: bolts crawl over it, a faint yellow wash, its frames stop and it twitches; when it can't move it lunges,
  locks up and a dark CAN'T MOVE stamp shows. Sleep: pink rings close in, it slumps away from the other side, breathes
  slowly and Z's drift up; waking it jumps up with sparkles and a "!". Freeze: ice grows up over it with a spring, its
  frames stop and glints flash; thawing cracks the ice and shatters it. A switch-in already statused wears its look at
  once; a cure with no moment takes it off. Reduced: the lasting looks without particles; Off: none. Singles only.
  Limits: poison's slight sag (the mockup's droop) is not built; the look sits over the sprite, not inside its outline.
- Stat changes (pass 8): a rise or fall now sends chevrons in the stat's own colour sweeping the whole body (up from
  the feet for a boost, down from the head for a drop; five a wave, one wave a stage, bigger for bigger changes), the
  colour washes over it at .45 and it stretches up or squashes down (`statClip`). A stamp says the stat ("ATTACK ▲",
  "DEFENSE ▼▼"; a boost in the stat's colour, a drop in sky blue) and six pips under it show where the stat now stands
  (the screen counts the stages it has shown; reset on a switch-in or Haze). It replaces the old three arrows and the
  "ATTACK +" word badge in singles (BattleFx `stat`). Attack red, Defense violet and Speed blue are the mockup's; Sp. Atk
  pink, Sp. Def green, Accuracy yellow and Evasion silver are ours. Reduced: the wash, stamp and pips. Limits: the
  mockup puts the pips beside the message box; the game's menu sits there, so they sit under the stamp. Baton Pass
  carries stages over but the pips start again from zero.
- The old pulsing status pattern (Deluxe Battle Kit) no longer shows in singles with animations on: it doubled up with
  the condition look and turned a paralysed Pokémon solid yellow. Doubles and triples still wear it.
- Condition and stat pictures (flames, bubbles, Z's, glints, chevrons) now sit on the field just over the Pokémon, so
  they pass under the info boxes and menus like the Pokémon does.
- Ability trigger (pass 8): an ability's flag (the mockup's dark plate, "<Name>'s Ability" in small yellow over the
  ability's name) unrolls from its owner's edge of the screen (the foe's from the left under its box, yours from the
  right over yours), holds 2 s and folds away. It replaces the old name banner and the black cinematic bars in singles;
  each category's small flourish (rings, sparks) still plays. Intimidate is acted out as the mockup (`intimidateClip`):
  it leans in 40 px and grows 1.12x while the field dims around it, two red glints flash at its eyes, its red glare
  sweeps across the field, and the other Pokémon is pushed back 18 px, trembles and springs home; then "ATTACK ▼"
  plays. The glare is aimed at the other Pokémon (the mockup's 24 degree tilt is that line on its stage). Reduced: the
  flag only. Limits: only Intimidate is acted out (the mockup shows only it); doubles keep the old banner.
- Weather (pass 8 "Rain", "Harsh Sunlight", "Sandstorm", "Snow", "Weather Clears"; `src/ui/battleFx/weatherLook.ts`,
  numbers in `src/core/presentation/motionWeather.ts`): each weather has the mockup's entrance (rain: clouds slide in,
  two lightning flashes and a shake; sun: a light sweep; sand: a wall of sand crosses with a shake; snow: one flake
  lands with a ring), then its layer stays (streaks and puddle rings; sun rays; two scrolling sand bands and grit;
  drifting flakes and a mist), the arena takes the mockup's colour grade, and a chip in the top corner counts the turns
  left. A water move in rain or a fire move in sun stamps "RAIN BOOST ×1.5" / "SUN BOOST ×1.5" on its first hit and the
  chip jumps. The sandstorm gusts once a turn: grit sweeps across and both Pokémon lean into it (`gustLeanClip`). When
  it ends the chip counts to 0 and pops, the layer thins, a beam of light crosses and the colour comes back. It replaces
  the pack's weather picture and the old mood tint for those four. Reduced: layer, grade and chip, no entrance or gust
  motion. Off: the older layer. Limits: hail keeps the older layer (no mockup); doubles get no lean.
- Terrain (pass 8 "Terrain"; `src/ui/battleFx/terrainLook.ts`): the terrain's carpet rolls out under both Pokémon
  (the mockup's oval, centre and size) and stays while it lasts: a yellow grid that hums for Electric, pink and white
  flowers on green for Grassy, pink and purple rings for Psychic, drifting pink mist for Misty. On arrival a ring in its
  colour crosses the ground from the user's feet, and each has its flourish (four bolts and a flicker; twelve grass
  blades grow, sway and sink; three rings and a hue turn; the mist drifts). Its chip counts the turns and sits under
  the weather chip when both are up. When it ends the chip pops away and the carpet fades. It replaces the pack's
  terrain picture. Reduced: carpet and chip, still. Off: nothing (as before). The steady hum, slow rings and mist
  drift while it lasts follow the mockup's notes (the clip itself only shows each arrival).
- Protect (pass 8 "Protect", from the blow on; `protectedClip`): when an attack meets Protect, three pale green rings
  burst where it lands in front of the protected Pokémon, the screen shakes, a green "PROTECTED" stamp slams in tilted
  and the attacker is pushed back 30 px and springs home. The shield of plates is the Protect move's own animation, so
  it is not drawn (move animations stay as they are). The stamp sits in front of the shield and up, clear of the info
  boxes (the mockup's spot is where the game has your box). Reduced: the stamp only. Doubles: nothing new.
- Stamps now slam in as the mockups do: hard ones (PROTECTED) drop in big and tilted with a small shake, soft ones (the
  weather boost) grow in; both hold 750 ms and lift away.
- Confusion (pass 8 "Confusion"; `DizzyStars`, `confusionHitClip`): when a Pokémon becomes confused three yellow stars
  pop in and circle its head (found from the top of its drawn body), and it sways under them, for as long as it stays
  confused. The "is confused!" check shows the stars instead of the pack's picture. When it hurts itself it swings
  40 px at nothing, a yellow star bursts on its head, it blinks white, squashes and springs back, and the screen
  shakes. Snapping out takes the stars away and it stands as before. Reduced: the stars stay still and no sway; the
  hurt is a blink. Limits: no CNF chip on the plate yet (the plates are the UI build's); doubles keep the pack picture;
  a battle reloaded mid-confusion shows the stars from the next confusion moment.
- End of turn (pass 8 "End of Turn"; `endTurnParade`, `src/ui/battleFx/endTurnLook.ts`): when a turn ends with
  effects (Leftovers and other healing items, poison, burn, sandstorm, hail, Leech Seed, binding), a row of chips
  drops in at the top right (under the weather and terrain chips), one per kind of effect, at most four. Each chip
  lights in its colour and swells as its effect plays, then settles dimmer. After the last one the chips lift away, a
  yellow line sweeps the screen and a TURN plate pops up and flips to the new turn number, then leaves. Reduced: the
  chips light without moving; no sweep or plate. Doubles: nothing new.
- **Power tiers (pass 12).** How hard a hit lands follows the share of HP it took. Under 30% it is a tap: the plain
  recoil, no screen shake. From 30% up it throws the Pokémon further (34 px plus up to 60 px more), with dust halfway
  and where it lands, and shakes the screen harder (5 to 13 px, scaled by the Screen shake setting, none when Battle
  screen effects is off). A critical or super effective hit counts 1.3 times. Near the top (80% power) it is heavy:
  the damage number is drawn twice the size. Full motion only.
- **Critical hit (pass 12) and hit stamps (pass 5).** At the moment a critical hit lands everything stops for 280 ms:
  the target goes white under a white star and ten yellow rays, black bars close in from the top and bottom of the
  screen, the camera jumps in on the target (when Battle screen effects is on) and the arena's colour drains to grey.
  Then the hit lands. The old pack word badges are replaced by the mockup stamps beside the target: a yellow
  CRITICAL HIT! slams on, a red SUPER EFFECTIVE! slams on just under it, and a blue "Not very effective…" or a dark
  NO EFFECT settles in softly. The old Crit letterbox and the Battle camera's crit push stay away while the freeze
  plays. Reduced: no freeze, the stamps without the slam.
- **Multi-hit (pass 12).** A move that hits two or more times gets a yellow combo counter beside the target (×1, ×2,
  ...) that pops and grows a little with every hit while the screen shakes a little harder. The per-hit numbers stay
  away; at the end the counter lifts off, a yellow HIT N TIMES! stamp slams on and the total slams in as one big
  number. Reduced: the counter without the pop or shake. Off: the plain numbers.
- **Recoil and drain (pass 12).** Recoil: a crack in the move's colour runs along the ground from the target back to
  the user, the user flashes that colour, winces (squashed, shaken left and right) and a dark RECOIL stamp settles
  beside it. Drain: seven green lights lift off the target one by one, arc across the field and sink into the user,
  each with a small green ring, while the user glows green; the healing number follows once the last has landed
  (this replaces the pack's heal sparkle for a drain). Reduced: the RECOIL stamp, and the usual heal for a drain.
- **Charge-up and the recharge turn (pass 12).** A two-turn move's first turn (Solar Beam, Sky Attack; not Dig or
  Fly, which hide the Pokémon): after the move's own charge animation, 26 lights are pulled in from all over the
  arena, a pale yellow glow grows on the Pokémon and a pulsing CHARGING chip pops on over it. Both stay through the
  foe's turn and go just before the move is let loose. After Hyper Beam and friends: once the move has played out, the
  Pokémon sags, greys, steam puffs off it and a grey RECHARGE chip hangs over it; when its "must recharge" turn ends
  the chip pops and it springs back up. Both follow the battle's own state (charging move, must recharge), so they also
  end if the Pokémon leaves. Reduced: the chips, glow and grey without movement. Off: nothing.
- **Contact punish (pass 12).** When Rocky Helmet, Rough Skin, Iron Barbs or Live Wire hurts the Pokémon that touched
  it: eight grey spikes jab out round the holder, the attacker bounces back with a white star on its nose, and the
  item's flag ("Toxel's Item / ROCKY HELMET", the same plate as the ability flag) slides out while its damage number
  shows (abilities already get their flag). Reduced: the flag and the number. Off: the number.
- **Priority move and entry hazards (pass 12).** A move with priority (Quick Attack, Extreme Speed, Aqua Jet) gets a
  yellow FIRST! tag slammed on above its user as it is announced. Stealth Rock: five grey stones are thrown from the
  setter, spin through the air, plant themselves round the other side's Pokémon and hover there, bobbing, with a
  "◆ ROCKS" chip by that side's plate (the chip also lists Spikes, Toxic Spikes and Sticky Web). When a Pokémon comes in,
  the stones stab inward at once, it flashes white and squashes, the screen shakes and its damage number shows. Rapid
  Spin or Defog drops the stones. The old floor rock marks step aside for the stones (they still show with motion
  Off); spikes and webs keep their floor marks. Not built (move animation): the priority dash and after-images.
- **One-hit KO (pass 12).** A one-hit KO move that lands gets a red ONE-HIT KO! stamp slammed on beside the target.
  Not built (Kice: Fissure is a move animation): the crack across the ground and the ground opening under it.
