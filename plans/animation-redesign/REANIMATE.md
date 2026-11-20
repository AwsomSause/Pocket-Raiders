# What to reanimate

Everything in the main game that already moves and should be animated again. 115 entries. Evil Mode and Dominion are left out, and so are Pokémon sprite frames, trainer throw frames and the move animation packs, which are kept as they are.

Each entry says what the game does today, what the redesign does, where to watch it in the mockups (`index.html`, or the live page), and where the code is. **(need)** marks the 14 entries that have to change: your six notes, gaps where the game shows nothing useful, and the two rules everything else depends on. **(want)** marks the 101 that work today and would simply be better. 75 entries have a mockup clip; 40 are described only.

Suggested order to build: the two rules (Reduced motion, Skip) first, then your six notes, then Battle basics, then the rest in the order of this page.

| Section | Entries |
|---|---|
| Battle basics | 12 |
| After battle | 1 |
| Moves | 17 |
| Conditions | 15 |
| Trainers | 6 |
| Catching | 1 |
| Gimmicks | 8 |
| Galar | 2 |
| Bosses | 6 |
| Camera | 2 |
| Short cuts | 1 |
| Flow | 2 |
| Events | 8 |
| Side roads | 9 |
| Screens | 13 |
| World | 10 |
| Rules for the whole set | 2 |
| **Total** | **115** |

## Battle basics

### 1. Send Out (want)
- **Today:** The ball flies a fixed 0.7s arc, then the Pokémon scales up from 60% with a bounce. Both sides look the same.
- **Redesign:** Pass 1: One clear order: ball leaves, ball lands, white flash and ring, the Pokémon grows out of the light and its colour fades in. Pass 2: The ball lands, squashes and bounces once before it opens. The Pokémon comes out tall and thin, lands flat and wide, and settles. Dust on both landings. Pass 3: The landing ring and a spray of sparks come in the Pokémon's own type colours: fire for Charizard, water for Blastoise. Pass 4: The rival skids in with dust, steps back and whips the ball. You slide in, wind up and release on the game's own throw frames, and the ball leaves from the hand. Each trainer steps out as their Pokémon lands. Pass 5: Plates fly in from their own sides with a spring instead of fading, and each line of text pops its bubble. Pass 7: The ground answers: the base dips and flashes under every landing. Pass 11: Entrances end with a cry sized to the Pokémon, and a heavy Pokémon shakes the screen and bounces the other side off its feet.
- **See it:** pass 1, improved up to pass 21, clip "Send Out"
- **In the game:** `src/ui/playerTrainer.ts:140, src/ui/aero.ts:76`
- **Build:** Built into the game (build slice 1).

### 2. Recall (need)
- **Today:** The Pokémon just fades out over 0.25s. No beam, no ball.
- **Redesign:** Pass 1: The classic red beam: the Pokémon turns red, a beam snaps back to your side and it shrinks away along it. Pass 2: The trainer side holds the ball out first. The Pokémon braces, then is pulled thin up the beam, and the ball jolts as it catches. Pass 4: Your trainer leans in from the edge holding the ball out, takes the Pokémon back and steps away.
- **See it:** pass 1, improved up to pass 4, clip "Recall"
- **In the game:** `src/scenes/BattleScene.ts:5152`
- **Note:** Gap in the survey: no ball-return picture exists.
- **Build:** Built into the game (build slice 1).

### 3. Attack and Hit (want)
- **Today:** A 24px lunge, a 60ms white fill, a colour flash and a 6-step shake. HP drains at the same time.
- **Redesign:** Pass 1: Lunge in, two white blinks and a knock-back on the target, then the HP bar drains while the number counts down. Pass 2: A wind-up lean back, a stretched dash, an 80ms freeze on contact, then the target squashes, is thrown back and springs upright. The HP plate jolts and a ghost bar shows what was lost. Pass 3: The user glows in the move's type before it goes, and the hit bursts in that type: electric bolts for Thunder Punch. Pass 5: The damage number springs out of the hit and a red SUPER EFFECTIVE! stamp slams on at an angle. The message bubble pops and shows a bouncing arrow when it is done. Pass 6: A super effective or critical hit now throws type-coloured rays behind the target (the game's own burst art, re-coloured). Pass 7: The target's base jolts with the hit, harder for a super effective or critical one. Pass 8: The air moves: pollen drifts through every outdoor battle and a cloud shadow slides across the ground. Pass 9: The message bubble grows a pointer that slides to whoever is acting: left for your Pokémon, right for the foe. Pass 12: Special moves are now fired, not lunged: the user rears back and a shot in the move's colour crosses the field. Big hits throw the target further. Pass 16: Hard hits now punch the camera in toward the target, and a knock-out gets a slow push. Pass 18: Every hit now lights the floor in its type's colour, and a big hit lights the other Pokémon too. Pass 19: Your trainer now reacts with a face and one word when a big hit lands, either way. Pass 21: Every battle now has its arena's life behind it, and big hits leave a mark on the ground.
- **See it:** pass 1, improved up to pass 21, clip "Attack and Hit"
- **In the game:** `src/ui/battleFx/battleFx.ts:367-424`

### 4. Faint (need)
- **Today:** The sprite slides down 30px and fades in 0.4s. No last hit moment.
- **Redesign:** Pass 1: The last hit lands, the bar empties, then the Pokémon sinks into the ground at its feet. Pass 2: A stagger left and right, the knees give, then the drop with a dust cloud. Pass 3: The last hit carries its type: embers for Flamethrower. Pass 7: The fainted side's base goes dark until the next Pokémon lands. Pass 11: It staggers back before it sinks. Pass 19: Your trainer cheers a knock-out and thanks a fallen partner. Pass 23: When a foe falls, its experience now leaves it as lights and flies to your bar.
- **See it:** pass 1, improved up to pass 23, clip "Faint"
- **In the game:** `src/scenes/BattleScene.ts:5133`
- **Note:** Gap in the survey: no last-hit moment.
- **Build:** Built into the game (build slice 1). The exp lights (pass 23) are in too. The trainer face chip (pass 19) comes with the Together slice.

### 5. HP Bar (want)
- **Today:** Drain time grows with the damage; a ghost bar follows. Colour changes snap.
- **Redesign:** Pass 1: One steady 0.6s drain with an ease at both ends, and the number counts with it. Green, yellow and red change as the bar passes each mark. Pass 2: The bar snaps down fast, a white ghost bar holds for a beat and then catches up. The whole plate takes a small jolt. Pass 5: The bar flashes as it crosses into yellow and into red, and in the red it pulses with a slow glow around the plate.
- **See it:** pass 1, improved up to pass 11, clip "HP Bar"
- **In the game:** `src/ui/widgets.ts:547`

### 6. Standing (want)
- **Today:** The game plays each Pokémon's own sprite frames and adds a small 0.9s up-down stretch.
- **Redesign:** Pass 1: Keep the sprite frames. Slow the breath to 1.9s and squeeze the width a little as the body rises, so it reads as breathing, not bobbing. Pass 2: The breath is a little deeper and the shadow shrinks as the body rises. Pass 11: Each Pokémon now stands in its own way: Charizard hovers over a shrinking shadow, Blastoise breathes slow and deep.
- **See it:** pass 1, improved up to pass 21, clip "Standing"
- **In the game:** `src/ui/aero.ts:108`

### 7. Switch (want)
- **Today:** The old Pokémon fades, the new one bounces in, and the info box slides 420px.
- **Redesign:** Pass 2: One unbroken move: beam back, the bar tucks down, the next ball is already in the air, the bar comes back with the new name. Pass 4: Your trainer steps in for the recall and again for the throw, so a switch reads as one person doing two things.
- **See it:** pass 2, improved up to pass 11, clip "Switch"
- **In the game:** `src/scenes/BattleScene.ts:1606, 5179`
- **Build:** Built into the game (build slice 1). It plays as the recall followed by the send-out; the bar tuck comes with the battle bars.

### 8. Miss (want)
- **Today:** The target slides 36px sideways and fades for 130ms.
- **Redesign:** The target sees it coming: a quick duck and side-step with a stretch, the attacker overshoots and skids, then both reset.
- **See it:** pass 2, improved up to pass 5, clip "Miss"
- **In the game:** `src/scenes/BattleScene.ts:5141`

### 9. Danger (want)
- **Today:** The bar turns red. Nothing else changes.
- **Redesign:** When HP drops under a fifth the bar pulses, the whole plate gets a slow red glow and the Pokémon breathes faster and sags. It stops the moment it is healed.
- **See it:** pass 5, improved up to pass 12, clip "Danger"
- **In the game:** `src/ui/widgets.ts:547`

### 10. Wild Encounter (want)
- **Today:** Glass shutters close and open in 0.36s with a ball bloom, then the Pokémon is simply there.
- **Redesign:** Pass 5: Two flashes, the screen splits into bars that pull apart, and the wild Pokémon slides in as a dark shape. Its colour floods in with its cry, its plate flies in, and only then do you throw. Pass 10: Now starts on the map: the stop pulses, the ball wipe shuts over it and opens on the arena, and the pass-5 entrance (dark shape, colour floods in with the cry, plate flies in) follows without a cut.
- **See it:** pass 5, improved up to pass 21, clip "Wild Encounter"
- **In the game:** `src/ui/battleFx/spectacle.ts:51`

### 11. Shiny Entrance (want)
- **Today:** A sparkle animation plays once over the sprite.
- **Redesign:** A shiny announces itself. Stars circle in and collapse onto it, a glint runs across the sprite, the whole arena brightens for a beat, and a star chip pins itself to the name plate so you cannot miss what you just found.
- **See it:** pass 11, clip "Shiny Entrance"

### 12. Damage number shown twice (need)
- **Today:** Two parts of the code can each float a number for the same hit. The survey could not confirm whether both play.
- **Redesign:** One number per hit, from the Numbers and Stamps design (pass 5). Check and remove the second.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/BattleScene.ts:5039, 2230; src/ui/battleFx/battleFx.ts:426`


## After battle

### 13. EXP and Level Up (want)
- **Today:** The EXP bar fills, then a "Level up" banner scales in and rises with a gold burst.
- **Redesign:** The bar fills fast and overshoots into a flash, the level number ticks over on the bar, and the Pokémon does two happy hops with dust on each landing.
- **See it:** pass 2, improved up to pass 23, clip "EXP and Level Up"
- **In the game:** `src/ui/battleFx/transitions.ts:10`


## Moves

### 14. Type Reel (want)
- **Today:** When a move has no animation file the game falls back to one of 26 shared effects, or a 24px lunge with a colour tint.
- **Redesign:** Eighteen impact kits, one per type, built from six shapes (sparks, rings, stars, streaks, bolts, chunks). They ride on top of every move animation so a hit always reads as its type, even on the fallback.
- **See it:** pass 3, improved up to pass 12, clip "Type Reel"
- **In the game:** `src/ui/battleFx/familyFx.ts:198`
- **Build:** Kept from the redesign: the hit reaction on the Pokémon and the type colour of numbers and stamps. Not built, by your rule that specific move animations are not added or changed: type-shaped effects drawn for the move itself.

### 15. Wind-up Tells (want)
- **Today:** A marker on the user before the move, in three styles: quick, normal, strong.
- **Redesign:** Pass 3: The user glows in the move's type colour while a ring closes in at its feet. Quick moves barely flicker, strong moves pull sparks inward and make the ground tremble. Pass 6: A strong move dims the arena and wraps the user in a rising aura while it charges, so you can feel the size of what is coming.
- **See it:** pass 3, improved up to pass 12, clip "Wind-up Tells"
- **In the game:** `src/core/presentation/cues.ts (telegraph cue)`

### 16. Numbers and Stamps (want)
- **Today:** A floating number (scale 0.6 to 1, rises 46px) and a small SUPER / WEAK / IMMUNE / CRIT badge.
- **Redesign:** The number springs out of the hit and lifts away. Super effective is a red stamp that slams on at an angle and shakes the screen; not very effective settles in softly in blue; a critical hit turns the number gold and bigger.
- **See it:** pass 5, improved up to pass 17, clip "Numbers and Stamps"
- **In the game:** `src/ui/battleFx/battleFx.ts:426`

### 17. Power Tiers (want)
- **Today:** Every damaging move shakes the screen by the same amount and knocks the target back the same 30px.
- **Redesign:** Three sizes of hit. A weak move is a tap: small spark, no shake. A normal move throws the target a body-width. A heavy move stops time for a moment, throws it most of the way off its base with two dust clouds, and the damage number is twice the size.
- **See it:** pass 12, improved up to pass 21, clip "Power Tiers"
- **In the game:** `src/core/presentation/cues.ts:137`

### 18. Charge-Up Move (want)
- **Today:** A text line on the first turn, the move animation on the second.
- **Redesign:** The first turn is a build-up you can watch: light is pulled in from all over the arena, the glow grows, and a CHARGING chip sits on the Pokémon through the foe's turn. The second turn lets it all go as one beam wider than the Pokémon.
- **See it:** pass 12, clip "Charge-Up Move"
- **In the game:** `src/ui/battleFx/cinematics.ts:848`
- **Build:** Kept from the redesign: the charge on the Pokémon (the pose, the gathering light, the arena dimming). Not built, by your rule that specific move animations are not added or changed: the beam.

### 19. Critical Hit (want)
- **Today:** The same hit with a text line afterwards.
- **Redesign:** Pass 12: At the moment of contact everything stops. Black bars close in from top and bottom, the camera jumps to the target, the colour drains for a quarter of a second, and then the hit lands with the yellow CRITICAL HIT stamp and a number half as big again. Pass 17: A critical or super effective hit now gets one negative frame and a white star at the point of contact.
- **See it:** pass 12, improved up to pass 19, clip "Critical Hit"
- **In the game:** `src/ui/battleFx/skillMoments.ts:67`

### 20. Close Range, Four Ways (want)
- **Today:** A move with no animation file plays one of 26 shared effects. For the four close-range families that is the same 24-pixel lunge, with a ring, a slash line or a burst drawn on the target.
- **Redesign:** The Pokémon acts the family out. A plain contact move is a shoulder dash and a ring. A bite closes two rows of teeth on the target and leaves claw marks. A punch lands as one fist-sized disc with six short lines. A heavy move crouches, glows, crosses nearly the whole field and leaves dust. You can tell the four apart with the sound off.
- **See it:** pass 24, clip "Close Range, Four Ways"
- **In the game:** `src/ui/battleFx/familyFx.ts:198, src/core/presentation/families.ts:39`
- **Build:** Kept from the redesign: the wind-up of the user and the reaction of the target. Not built, by your rule that specific move animations are not added or changed: the family shape (the 26 shared move effects).

### 21. Shots, Beams and Breath (want)
- **Today:** Projectile, beam, flame and dragon moves share two shapes: a dot that flies and a line that appears. Flame and dragon breath are the same line in two colours.
- **Redesign:** Four different things leave the mouth. A projectile is a ball with a tail that arcs. A beam gathers light first, then holds as a three-layer bar that pushes the user back. A flame is a stream of growing puffs that takes time to arrive. Dragon breath is the same stream, but the body glows first and it ends in a burst.
- **See it:** pass 24, clip "Shots, Beams and Breath"
- **In the game:** `src/ui/battleFx/familyFx.ts:198`
- **Build:** Kept from the redesign: the wind-up of the user and the reaction of the target. Not built, by your rule that specific move animations are not added or changed: the family shape (the 26 shared move effects).

### 22. Elements Have Shapes (want)
- **Today:** Wind, water, ground and ice moves differ mostly by colour. A wave and a gust are the same arc; a quake is a screen shake.
- **Redesign:** Each element gets a shape nothing else uses. Wind is three thin crescents and a cut. Water is three tall crescents that arrive as a ring. Ground never travels: rock teeth come up under the target, which hops. Ice arrives as a ball, grows a row of spikes from the floor, and the spikes shatter.
- **See it:** pass 24, clip "Elements Have Shapes"
- **In the game:** `src/ui/battleFx/familyFx.ts:198`
- **Build:** Kept from the redesign: the wind-up of the user and the reaction of the target. Not built, by your rule that specific move animations are not added or changed: the family shape (the 26 shared move effects).

### 23. Sparks, Sludge, Mind and Shadow (want)
- **Today:** Electric, poison, psychic, ghost and status moves are a dot or a ring in the type colour. A status move looks like a weak attack.
- **Redesign:** Five families that never touch the target. Lightning comes from the sky, three times. Poison is a lobbed ball that opens into a cloud and drips. A psychic move lifts the target off the ground, tilts it, and drops it. A ghost move darkens the field and opens two eyes behind the target. A status move is slow, does no damage, and leaves stars circling the head.
- **See it:** pass 24, clip "Sparks, Sludge, Mind and Shadow"
- **In the game:** `src/ui/battleFx/familyFx.ts:198`
- **Build:** Kept from the redesign: the wind-up of the user and the reaction of the target. Not built, by your rule that specific move animations are not added or changed: the family shape (the 26 shared move effects).

### 24. Care, Cover and Field (want)
- **Today:** Healing, protection and field moves play a sparkle on the user. Protect shows nothing when it actually blocks a hit.
- **Redesign:** Three families aimed at yourself. Healing rises from the feet and the bar fills as the lights pass the head. A barrier is a six-sided pane that stays up for the turn; when it blocks a hit it flashes, throws the hit back as sparks, and says so. A field move washes across the whole screen once and then changes the arena light for as long as it lasts.
- **See it:** pass 24, clip "Care, Cover and Field"
- **In the game:** `src/ui/battleFx/familyFx.ts:198`
- **Build:** Kept from the redesign: the wind-up of the user and the reaction of the target. Not built, by your rule that specific move animations are not added or changed: the family shape (the 26 shared move effects).

### 25. Explosion (want)
- **Today:** A charge glow, a burst on the user and a white wash. The user faints with the normal faint.
- **Redesign:** The loudest family gets silence first. The body shrinks and flashes faster and faster while rings close in on it. Everything stops for a held breath. Then white, a ring that leaves the screen, a long shake, and a scorch where it stood. The user does not sink away: it is simply gone when the light clears.
- **See it:** pass 24, clip "Explosion"
- **In the game:** `src/ui/battleFx/familyFx.ts:198`
- **Build:** Kept from the redesign: the wind-up of the user and the reaction of the target. Not built, by your rule that specific move animations are not added or changed: the family shape (the 26 shared move effects).

### 26. One Family, Four Types (want)
- **Today:** The family picks the shape and the type picks one flat colour.
- **Redesign:** The family decides how a move is built and the type dresses it. Here the beam family plays four times in a row: fighting, dark, water and normal. The gather, the held bar and the push-back never change. The three colours, the particles and what the hit leaves on the ground come from the type kit.
- **See it:** pass 24, clip "One Family, Four Types"
- **In the game:** `src/ui/battleFx/familyFx.ts:198`
- **Build:** Kept from the redesign: the wind-up of the user and the reaction of the target. Not built, by your rule that specific move animations are not added or changed: the family shape (the 26 shared move effects).

### 27. Family Reel: All 26 (want)
- **Today:** The 26 families are a table in the code: a startup, a travel and an impact for each. In play, most of them look alike.
- **Redesign:** The same table, drawn so every row is different at a glance. Each tile shows a user dot on the left and a target dot on the right and plays its family on a loop: who moves, what crosses, and what shape lands. Families that act on the user (Burst, Healing, Barrier, Field) play on the left dot. The seven clips before this one are these tiles at full size.
- **See it:** pass 24, clip "Family Reel: All 26"
- **In the game:** `src/core/presentation/families.ts:39`
- **Build:** Kept from the redesign: the wind-up of the user and the reaction of the target. Not built, by your rule that specific move animations are not added or changed: the family shape (the 26 shared move effects).

### 28. Mastery flourish (want)
- **Today:** Sparks and a shine ring on the target when a mastered move hits.
- **Redesign:** A mastered move plays its family startup one step bigger and its impact shape gets a gold edge, so mastery reads from the move itself.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/battleFx/battleFx.ts:322`

### 29. Heated and Hyper moments (23 story animations) (want)
- **Today:** 23 named story animations (overdrive, interaction, rival, bond, drama), each timed on its own.
- **Redesign:** Re-time all 23 on the set's shared beats (wind-up, hit-stop, hold, release). Each of the five groups gets one colour and one shape.
- **See it:** no mockup yet, described only
- **In the game:** `src/core/presentation/storyAnims.ts, src/ui/battleFx/storyFx.ts:94`

### 30. Moment scene (want)
- **Today:** Fade to black, static, then lines one at a time.
- **Redesign:** An iris closes on the Pokémon as in Event Opens (pass 9); the lines are typed with Message Rhythm (pass 23).
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/battleFx/momentScene.ts:132`


## Conditions

### 31. Healing (want)
- **Today:** A shared "heal" effect from the move pack and a green number.
- **Redesign:** Green plus-signs rise through the Pokémon, it brightens and gives one small hop, and the bar climbs with the number.
- **See it:** pass 3, improved up to pass 12, clip "Healing"
- **In the game:** `src/core/presentation/cues.ts:199`

### 32. Burn (want)
- **Today:** The shared burn animation plays once, then a text banner. The end-of-turn damage is a number only.
- **Redesign:** Flames climb the body from the feet, the BRN chip lands on the plate, and the Pokémon keeps a warm flicker. Each turn the flames flare up as the HP drops.
- **See it:** pass 8, improved up to pass 12, clip "Burn"
- **In the game:** `src/core/presentation/cues.ts:230`

### 33. Poison (want)
- **Today:** The shared poison animation plays once. The end-of-turn damage is a number only.
- **Redesign:** Purple bubbles rise through the body and pop, the Pokémon sags and takes on a sick tint. Each turn one big bubble swells over its head and bursts as the HP drops.
- **See it:** pass 8, clip "Poison"
- **In the game:** `src/core/presentation/cues.ts:230`

### 34. Paralysis (want)
- **Today:** The shared paralysis animation plays once; when it cannot move the same animation replays.
- **Redesign:** Bolts crawl over the body and it locks up: its idle animation stops and it twitches instead. When it fails to move it lunges a few pixels, snaps back and sparks.
- **See it:** pass 8, clip "Paralysis"
- **In the game:** `src/core/presentation/cues.ts:230`

### 35. Sleep (want)
- **Today:** No shared animation beyond a short one; the sprite keeps its normal idle while asleep.
- **Redesign:** It slumps, its breathing slows to a third, and Z's drift up from its head for as long as it sleeps. Waking up is a jump, a "!" and the Z's popping.
- **See it:** pass 8, clip "Sleep"
- **In the game:** `src/core/presentation/cues.ts:230`

### 36. Freeze (want)
- **Today:** The shared freeze animation plays once; the sprite keeps moving afterwards.
- **Redesign:** Ice grows up from the ground and closes over the Pokémon, which stops dead inside it. Glints run over the block while it is frozen. Thawing cracks it, then it shatters and steams.
- **See it:** pass 8, clip "Freeze"
- **In the game:** `src/core/presentation/cues.ts:230`

### 37. Confusion (want)
- **Today:** The shared confusion animation plays; hitting itself is a number and a text line.
- **Redesign:** Three stars circle its head and it sways under them for as long as it is confused. When it hurts itself it swings at nothing, the stars scatter and a bump star lands on its own head.
- **See it:** pass 8, clip "Confusion"
- **In the game:** `src/core/presentation/cues.ts:217`

### 38. Rain (want)
- **Today:** The move animation plays, then falling rain sprites loop until it ends.
- **Redesign:** Clouds roll in across the top and thunder flashes once before the first drops. Rain slants across in front of everything, puddle rings open on the ground, and a boosted Water move is called out by the weather chip.
- **See it:** pass 8, improved up to pass 21, clip "Rain"
- **In the game:** `src/ui/battleFx/weather.ts:44`

### 39. Harsh Sunlight (want)
- **Today:** The move animation plays, then a glow sits over the arena.
- **Redesign:** The light sweeps across the field from the top corner, a turning sun and lens circles stay in the sky, colours get richer and every shadow shrinks under its Pokémon.
- **See it:** pass 8, improved up to pass 21, clip "Harsh Sunlight"
- **In the game:** `src/ui/battleFx/weather.ts:44`

### 40. Sandstorm (want)
- **Today:** A scrolling sand layer; the end-of-turn damage is a number only.
- **Redesign:** A wall of sand crosses the screen and stays as two layers moving at different speeds with grit flying past. At the end of the turn the wind gusts, both Pokémon lean into it and take their chip damage together.
- **See it:** pass 8, clip "Sandstorm"
- **In the game:** `src/ui/battleFx/weather.ts:44`

### 41. Snow (want)
- **Today:** Falling snow sprites loop until it ends.
- **Redesign:** One flake lands first. Then the snow comes down slowly with a side-to-side drift, frost creeps in from the edges of the screen, and Ice types get a cold shimmer when their Defense rises.
- **See it:** pass 8, clip "Snow"
- **In the game:** `src/ui/battleFx/weather.ts:44`

### 42. Stat Changes (want)
- **Today:** Three arrows drift 60px and fade, with a word banner.
- **Redesign:** Chevrons in the stat's own colour sweep the whole body, up for a boost and down for a drop. A two-stage change sends two waves and bigger chevrons. A row of six pips next to the Pokémon shows where the stat stands.
- **See it:** pass 8, clip "Stat Changes"
- **In the game:** `src/ui/battleFx/battleFx.ts:460`

### 43. Ability Trigger (want)
- **Today:** A word banner with a few sparks.
- **Redesign:** The ability gets a flag that unrolls from its owner's side of the screen, and the Pokémon acts it out. Here Intimidate: Gyarados leans in, its glare crosses the field, and your Pokémon shrinks back as its Attack drops.
- **See it:** pass 8, clip "Ability Trigger"
- **In the game:** `src/ui/battleFx/abilityFx.ts:234`

### 44. Protect (want)
- **Today:** The Protect move animation, then "protected itself" text.
- **Redesign:** A shield of plates snaps together in front of the Pokémon and holds. The attack hits it, not the Pokémon: the plates flash where it lands, ripple, push the attacker back and then fold away.
- **See it:** pass 8, improved up to pass 12, clip "Protect"
- **In the game:** `src/core/presentation/cues.ts (protect slot)`

### 45. The 8 ability animations (want)
- **Today:** Eight registered ability animations share one banner and a few sparks.
- **Redesign:** Ability Trigger (pass 8) is the base. Each of the eight gets its own icon and one shape from the type kit.
- **See it:** no mockup yet, described only
- **In the game:** `src/core/presentation/abilityAnims.ts`


## Trainers

### 46. Trainer Intro (need)
- **Today:** Bars scale in, the trainer slides 0.48s and a VS card shows.
- **Redesign:** Pass 4: The trainer skids in, their name plate snaps out from behind them, and their Poké Balls drop onto the plate one by one with a bounce, so you can count the team before the fight. Pass 13: Every opposing trainer now arrives on a red and gold banner with speed lines. Pass 15: The Trainer Intro page from the UI mockups, moving: the two colours slam together, both trainers slide in, the VS badge spins in and thumps, the name tags rise with each team's balls and the trainer says their line. Then the page splits down its own slant and the first Pokémon are thrown out behind it without a cut.
- **See it:** pass 4, improved up to pass 15, clip "Trainer Intro"
- **In the game:** `src/ui/battleFx/spectacle.ts:51, src/ui/battleFx/vsScreens.ts:37`
- **Note:** Kice note: use the trainer intro from the UI mockups.

### 47. Ace Call (need)
- **Today:** A burst at the foe and the line "sends out their ace". The ace is just the last one standing.
- **Redesign:** Pass 4: The ace is announced before it lands. The trainer comes back on, an ACE banner slams across, the ball is thrown higher and slower, and the landing is twice as big, with a star and an Ace tag on its plate. Pass 14: When a trainer speaks, the bubble gets a name tab and their face in their own colour. Pass 15: The Ace Call from the UI mockups, moving: the trainer speaks first, then the navy band slams across on its slant, their portrait pops, the ace's name wipes on with its chips, and the ace itself arrives on the band as a dark shape that flashes into colour under a star. The band leaves and the ace leaps off it onto the field.
- **See it:** pass 4, improved up to pass 15, clip "Ace Call"
- **In the game:** `src/scenes/BattleScene.ts:5200`
- **Note:** Kice note: use the ace call from the UI mockups. Also the Ace rule: an ace must be announced.

### 48. Trainer Defeated (want)
- **Today:** The trainer slides back and the prize money line shows.
- **Redesign:** The beaten trainer walks back on, drops their shoulders, and the prize money flips out as coins that arc across to your side while the total counts up.
- **See it:** pass 4, improved up to pass 14, clip "Trainer Defeated"
- **In the game:** `src/scenes/BattleScene.ts:1152`

### 49. Last Resort and mentor scene (want)
- **Today:** A full-screen mentor scene, then a moment.
- **Redesign:** Use the split screen from pass 19 (trainer on one half, Pokémon on the other) so it matches the gimmick scenes.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/battleFx/mentorScene.ts, src/scenes/BattleScene.ts:3982`

### 50. Player trainer moments (hit, win, defeat frames) (want)
- **Today:** The player trainer has drawn frames for throw, recall, win, hit and defeat.
- **Redesign:** The frames stay. Trainer Reactions (pass 19) decides when each plays and adds the word chip.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/playerTrainer.ts:8`

### 51. Trainer intro strips and boss poses (want)
- **Today:** Intro strips play once at 12 frames a second and hold the last frame. 75 bosses are posed once.
- **Redesign:** The frames stay. After the last frame the trainer keeps a slow breathing loop instead of freezing.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/sprites.ts:175-208`


## Catching

### 52. Catch (want)
- **Today:** Ball flies 0.45s, the foe shrinks and fades, the ball bounces, each shake is a 120ms rock, then a burst.
- **Redesign:** The ball bonks the Pokémon and pops up before it opens, drops and bounces twice with dust, and three lamps above it light one per shake. On the click it squashes, three stars fly, and GOTCHA! stamps on.
- **See it:** pass 5, clip "Catch"
- **In the game:** `src/scenes/BattleScene.ts:5560`


## Gimmicks

### 53. Mega Evolution (need)
- **Today:** A 4.3s scene: pink crystal, shatter, white flash. With Fast Mega on, a short generic cut-in.
- **Redesign:** Pass 6: The bracelet throws six colours into the Pokémon, the game's orb closes around it and cracks while the arena dims, then it shatters outward and the Mega form lands with a roar. The Mega mark spins up and drops onto the name bar. 3.6s. Pass 16: Remake 1, goal: scale. The camera pushes in on Charizard and the cut-in page opens out of it until it is the whole screen. The orb closes around a Charizard five times its battle size while twelve streaks of colour drive in from every edge, cracks, and blows apart across the full width. Mega Charizard X lands on the page, the title slams, the four facts are dealt, and the page closes back onto the field where the Mega now stands. Pass 17: Remake 2, goal: impact. No easing, only cuts. Black frame: the bracelet in white. The battle in negative for three frames. Three comic panels slam on at an angle: Charizard's eyes, your raised arm, the word MEGA. Then a black-and-white frame of Charizard, the orb already cracked, three hard cracks with lightning, and it blows out in black and white shards before the colour arrives with the Mega form. Pass 18: Remake 3, goal: light. The arena goes dark and the Mega Bracelet is the only light in it. A beam carries that light to Charizard, who starts to glow, and the glow swallows the screen. Inside it the orb is a lamp: the Mega rainbow fans out of it as six real shafts of light, turning, and white needles leak out through the cracks. Mega Charizard X arrives as the exposure settles, and back on the field the arena stays lit in its colour. Pass 19: Remake 4, goal: together. The screen splits: you on the left raising the Mega Bracelet, Charizard on the right, a white seam between you and five heartbeats that speed up. The halves open like doors and you are standing side by side. The Key Stone lights in your hand, the Mega Stone answers on Charizard's chest, and six strands of colour run between the two before the orb closes. Afterwards you call out and Mega Charizard X answers. Pass 20: Remake 5, goal: one signature picture. Mega Evolution is glass. A double helix of colour climbs Charizard on the field, cracks run from it to every edge of the battle screen, and the screen goes black. Then the new picture slams together out of twenty-four shards, the corners first and Mega Charizard X's face last. When it is over the picture shatters again, and the pieces fall away from the field.
- **See it:** pass 6, improved up to pass 20, clip "Mega Evolution"
- **In the game:** `src/ui/battleFx/megaScene.ts:42, src/ui/battleFx/cinematics.ts:331`
- **Note:** Kice note: remade five times (passes 16 to 20).

### 54. Terastallize (need)
- **Today:** A 2.2s scene: the crystal shakes and breaks; afterwards a jewel bobs 4px above the Pokémon.
- **Redesign:** Pass 6: Crystals from the game's Tera art grow out of the ground around the Pokémon one after another, rainbow rings pass through, and it all bursts into shards. The Tera crown drops onto its head in the new type's colour and stays, bobbing, with a soft glint on the sprite. Pass 16: Remake 1, goal: scale. Five crystals as tall as the screen punch up from the bottom edge one after another, each one jolting the picture, until Charizard is walled in. Pulse rings pass through, everything shatters across the whole screen, and the Terastallized form lands on the cut-in page under its jewel. Pass 17: Remake 2, goal: impact. The same hard-cut language: item in white on black, the battle in negative, three panels with the word TERA. The five crystals do not grow, they are simply there, one every two frames, each with a flash; one negative frame, and they are gone in shards. Pass 18: Remake 3, goal: light. Lights out, the Tera Orb glows, a beam reaches Charizard. Five crystals rise as dark shapes. One white beam comes in from the corner, enters the middle crystal and leaves the other side as a rainbow; the crystals light up one after another, and everything shatters into coloured facets. Afterwards the field is lit pale blue. Pass 19: Remake 4, goal: together. After the split screen and the heartbeats, you throw the Tera Orb: it arcs over Charizard's head, bursts into a beam of light, and the crystals grow where it lands, lighting you from the side. Afterwards you call out and Charizard answers. Pass 20: Remake 5, goal: one signature picture. Terastallizing goes inside the jewel. One crystal closes over Charizard on the field, and the camera goes into it: twelve mirrored slices of Charizard turn like a kaleidoscope, changing colour as they go, then fold into a single point of light that becomes the crown.
- **See it:** pass 6, improved up to pass 20, clip "Terastallize"
- **In the game:** `src/ui/battleFx/teraScene.ts:42`
- **Note:** Kice note: remade five times (passes 16 to 20).

### 55. Dynamax (need)
- **Today:** A 2.4s scene: recall, the band rises, the ball falls and shakes four times, a silhouette grows, the red giant roars.
- **Redesign:** Pass 6: The ball swells in your hand until it is too big to hold, you heave it up and over, and where it lands the Pokémon rises through red storm clouds while the camera pulls back to fit it. Its HP bar doubles in front of you and three turn lamps light. Pass 7: The game's raid storm spiral now turns behind the giant. Pass 16: Remake 1, goal: scale. Storm clouds roll in at the top and Charizard simply keeps growing: past the title, past the top of the screen, while the camera tilts up to follow and lightning walks across behind it. It lands on the cut-in page as the giant, and back on the field the camera has pulled out to fit it. Pass 17: Remake 2, goal: impact. After the panels and the word MAX, Charizard does not swell, it jumps: three sizes in three cuts, each with a shock ring across the floor and a bolt behind it, the third one past the top of the screen. One negative frame and the giant is on the page. Pass 18: Remake 3, goal: light. Lights out, the Dynamax Band glows. A column of red light comes down out of the storm cloud and Charizard's silhouette grows inside it while lightning lights the cloud from within. The column widens until it is the whole screen. Afterwards the arena is lit red from the giant. Pass 19: Remake 4, goal: together. After the split screen, you call Charizard back, the ball swells in your hand, and you hurl it over your shoulder. It bursts behind you and the giant rises with you standing small in front of it, in its shadow. That picture of the two sizes is the cutscene. Pass 20: Remake 5, goal: one signature picture. Dynamax is one long camera move. You throw the swollen ball up out of the top of the screen and the camera follows it. Cut: your shoes, and a foot the size of a house. The camera climbs the giant without a cut, through two layers of storm cloud, and stops at its face above the weather as it roars.
- **See it:** pass 6, improved up to pass 20, clip "Dynamax"
- **In the game:** `src/ui/battleFx/dynamaxScene.ts:52, src/ui/battleFx/cinematics.ts:516`
- **Note:** Kice note: remade five times (passes 16 to 20).

### 56. Dynamax Ends (want)
- **Today:** A 0.65s shrink.
- **Redesign:** The third lamp goes out, steam vents from the giant as it shrinks past its normal size and springs back, the clouds blow away and the camera settles. 1.4s.
- **See it:** pass 6, improved up to pass 7, clip "Dynamax Ends"
- **In the game:** `src/core/presentation/transformAnims.ts:15`

### 57. Z-Move (need)
- **Today:** A 1.9s cut-in: white silhouette, speed lines, a rainbow Z ring and the move title sliding in.
- **Redesign:** Pass 6: Trainer and Pokémon charge together: light flows from your Z-Ring into the Pokémon, a giant Z burns in behind it, the move's own title art slams across, and the hit lands as three blasts with the whole screen shaking. Pass 16: Remake 1, goal: scale. A rainbow Z spins in until it is taller than the screen, Z-Power streams in from every side, and Charizard burns white in the middle of it. The cut-in page shows the pose, the ring and the move's own title art, then closes onto the field for the hit. Pass 17: Remake 2, goal: impact. After the panels, the Z is not a shape that spins in: it is cut into the screen in three slashes, each with a flash, and holds for a breath over the black-and-white Charizard before the colour and the title art hit. Pass 18: Remake 3, goal: light. Lights out, the Z-Ring glows. A sun rises behind Charizard's silhouette, its rays turning, and the Z is written across it in three strokes of light. A lens flare cuts the screen and the silhouette burns white. The hit lands in a gold-lit arena. Pass 19: Remake 4, goal: together. After the split screen, you and Charizard strike the Z-pose in step: One, Two, Z. Each beat draws one stroke of the Z behind you both, and your Z-Power streams from your hand across to Charizard until it burns gold. Pass 20: Remake 5, goal: one signature picture. The Z-Move is the cutscene. Charizard leaves the top of the screen. Cut to the sky looking down: Blastoise small on the field, a shadow growing around it, and a fireball the size of the screen coming down. The damage is counted out in huge numbers, the move's title card holds, and Charizard lands back on a scorched field.
- **See it:** pass 6, improved up to pass 20, clip "Z-Move"
- **In the game:** `src/ui/battleFx/zMoveScene.ts:47, src/ui/battleFx/cinematics.ts:742`
- **Note:** Kice note: remade five times (passes 16 to 20).

### 58. Primal Reversion (want)
- **Today:** Reuses the Mega crystal scene, 2.5 seconds.
- **Redesign:** Its own cut in the pass 20 style: the screen breaks into ancient-pattern slabs instead of glass.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/battleFx/cinematics.ts:50`

### 59. Shadow and purified aura (want)
- **Today:** A burst in the aura colour and a 0.9 second pulse. (The survey was not sure this is main-game.)
- **Redesign:** Use the Totem Aura design (pass 13) in the shadow colour. Purifying plays it backwards and ends in the Blessing light.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/BattleScene.ts:2743, src/ui/battleFx/markAura.ts:72`

### 60. What a gimmick leaves on the Pokémon (want)
- **Today:** A Tera jewel bobs 4 pixels above the Pokémon. Mega and Dynamax leave nothing.
- **Redesign:** Each gimmick leaves one lasting sign on the Pokémon and on its plate, as in the pass 16 after-states.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/BattleScene.ts:1398`


## Galar

### 61. Stadium Crowd (want)
- **Today:** Galar gym battles use a normal arena. The crowd is only in the music.
- **Redesign:** A stadium built for these battles: four rows of stands that bob to the beat, a banner wall in the gym's colour, floodlights. The crowd jumps and cameras flash on a super effective hit, sinks when you take one, and a Crowd meter swings between the two sides.
- **See it:** pass 7, clip "Stadium Crowd"
- **In the game:** `src/ui/galar/stadiumDirector.ts`

### 62. Favour bar, banners, camera cuts and interview (want)
- **Today:** The favour bar eases for 0.5s, a banner slides and holds, ten small moves on the cut art, then an interview.
- **Redesign:** All four join the Stadium Crowd design (pass 7): the bar moves with the crowd wave, banners unroll from the stands, the interview uses Trainer Call-out.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/galar/stadiumDirector.ts:264, 321; src/ui/galar/cutArt.ts`


## Bosses

### 63. VS Screen (want)
- **Today:** Bars scale in and a VS card shows for a moment.
- **Redesign:** The two colours slam in from either side and meet on the slant with a spark. Both trainers slide in leaning forward, the VS badge spins in between them and thumps, the name tags drop with each team's balls, and the rival gets a line before the screen splits open on the battle.
- **See it:** pass 13, clip "VS Screen"
- **In the game:** `src/ui/battleFx/vsScreens.ts:37`

### 64. Gym Leader (want)
- **Today:** A trainer intro with a longer text line.
- **Redesign:** The gym's rays open behind an empty stage. The badge at stake drops in glowing, the Leader strides in from the right and hits their pose, the name is stamped across, and what you are up against is dealt out line by line: type, team, boss power, prize.
- **See it:** pass 13, clip "Gym Leader"
- **In the game:** `src/ui/battleFx/spectacle.ts:51`

### 65. Legendary Encounter (want)
- **Today:** The Legendary has a transformation-style intro; the encounter itself starts like a wild battle.
- **Redesign:** Silence first: the screen is nearly black and the text arrives slowly. A shape is there before you can see it. Two eyes light, pressure lines push outward, and then the colour floods in with one shock ring that rattles the whole screen. Only then does the name appear.
- **See it:** pass 13, clip "Legendary Encounter"
- **In the game:** `src/core/presentation/legendAnims.ts:12`

### 66. Boss Phase Change (want)
- **Today:** Boss phases follow the game state with a text line.
- **Redesign:** When a boss ace drops to half, the fight visibly changes gear: the HP plate cracks and re-forms with a red edge, the arena darkens to the boss's colour, the ace flares and roars, and a PHASE 2 stamp lands. Nothing about the rules changes; you just cannot miss it.
- **See it:** pass 13, improved up to pass 14, clip "Boss Phase Change"
- **In the game:** `src/ui/battleFx/spectacle.ts:366, src/ui/battleFx/arenaLife.ts:109`

### 67. Enemy Heal (want)
- **Today:** A text line and the bar refills.
- **Redesign:** The trainer leans in from the edge and tosses the item. It arcs across, bursts into green light over their Pokémon, the bar climbs with a count, and one of the four heal pips on their plate goes dark so you always know how many they have left.
- **See it:** pass 13, clip "Enemy Heal"
- **In the game:** `src/core/presentation/cues.ts:199`

### 68. Legend title cards (12 shapes) (want)
- **Today:** Twelve title-card shapes, 1.2 to 1.6 seconds each.
- **Redesign:** Keep the twelve shapes. Each one opens with the Legendary Encounter beats (near black, eyes, colour flood), so the card ends the entrance and does not come before it.
- **See it:** no mockup yet, described only
- **In the game:** `src/core/presentation/legendAnims.ts:12, src/ui/battleFx/rivalStepIn.ts:115`


## Camera

### 69. Knock-out Camera (want)
- **Today:** The camera never moves in a normal battle.
- **Redesign:** The camera is now part of every fight. A hard hit punches in toward the target for a few frames; a knock-out gets a slow push toward the falling Pokémon and eases back out as the winner settles.
- **See it:** pass 16, improved up to pass 23, clip "Knock-out Camera"
- **In the game:** `src/scenes/BattleScene.ts:2221`

### 70. Opening reveal camera (want)
- **Today:** At the start of a battle the camera pans for 0.9s at 1.7 times zoom while a veil fades.
- **Redesign:** Fold it into Entrance Camera (pass 16), so the opening and every later send-out use the same camera move.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/battleFx/opening.ts:52`


## Short cuts

### 71. Short Cut (Seen Before) (want)
- **Today:** Fast Mega is a setting that swaps the scene for a generic cut-in. Tera, Dynamax and Z-Moves always play in full.
- **Redesign:** A roguelike shows you the same gimmick many times. The first time in a run you get the full cutscene. After that each one plays a one-second cut that keeps only its signature: for Mega Evolution, the cracks, one white frame, and the glass falling away from a Mega that is already standing there.
- **See it:** pass 20, clip "Short Cut (Seen Before)"
- **In the game:** `src/ui/battleFx/cinematics.ts:81`


## Flow

### 72. Using an Item (want)
- **Today:** A heal animation from the move pack and a green number.
- **Redesign:** The item is shown being used. It leaves the bag chip, hangs over the Pokémon, tips, and sprays; the green rises through the Pokémon from the feet up while the bar refills behind a white leading edge. The bag chip counts one down. A Revive, an X Attack and a status heal would use the same four beats with their own colour.
- **See it:** pass 23, clip "Using an Item"
- **In the game:** `src/core/presentation/cues.ts:199`

### 73. Message Rhythm (want)
- **Today:** Battle text appears instantly by default. With typing on, every letter takes the same 30 ms.
- **Redesign:** Typing is on, fast, and has rhythm. A comma is a short breath and a full stop a longer one. Moving on makes the bubble dip like a button being pressed. An important line punches the bubble and flashes its border; a quiet one types its dots slowly. The arrow bounces only when the game is waiting for you.
- **See it:** pass 23, clip "Message Rhythm"
- **In the game:** `src/ui/dialogue/storyDialogue.ts:14, src/core/state.ts:2000`


## Events

### 74. Event Opens (want)
- **Today:** The map fades out and the event page fades in with everything already in place.
- **Redesign:** The view closes on the map stop like a camera iris and opens on the place. The scene settles, the title strip slides in, you and your partner walk on from the left, the other person from the right, and only then the dialogue box rises and starts to talk.
- **See it:** pass 9, clip "Event Opens"
- **In the game:** `src/scenes/EventScene.ts, src/ui/redux/screens/event.ts`

### 75. Event Choice (need)
- **Today:** The choices appear as a list in place of the text.
- **Redesign:** Pass 9: The scene dims and steps back. What was just said shrinks into a chip at the top so you can still read it, and the choices are dealt up from the bottom like cards. The one you pick lifts, flashes and flies into the progress strip; the others fall away. Pass 15: On the corrected Event Choice page: the whole text box stays where it is, so you can still read what you were asked. The scene dims, the people step back into it, and the three choices are dealt in above the box like a hand of cards. The one you pick lifts, flashes and flies into the progress strip; the others fall away. Every piece is see-through, so nothing drags a cut-out along with it.
- **See it:** pass 9, improved up to pass 15, clip "Event Choice"
- **In the game:** `src/ui/redux/screens/event.ts`
- **Note:** Kice note: the choice has a cutout of a text bar.

### 76. Event Result (want)
- **Today:** The picture and text change in place.
- **Redesign:** The place changes the way you got there: climbing the lighthouse scrolls the old room down and the lamp room in from above while you keep walking. Whatever was waiting drops into view, your side jumps, and the text carries on.
- **See it:** pass 9, clip "Event Result"
- **In the game:** `src/ui/redux/screens/event.ts`

### 77. Event Reward (want)
- **Today:** Rewards appear after the text is dismissed and stay until you press a button.
- **Redesign:** Same rule, with a show: the heading drops in, each reward card flips over with a ring of light, and they wait. When you press Enter they fly off one at a time to where they now live: the wallet, the bag, the Reserve.
- **See it:** pass 9, clip "Event Reward"
- **In the game:** `src/ui/redux/screens/event.ts`

### 78. Legendary Blessing (need)
- **Today:** Three cards appear; the chosen one is highlighted.
- **Redesign:** Pass 9: Three beams of light come down first and the cards descend inside them. The one you take rises and burns gold while feathers fall; the other two tip back into the dark. Its line of legend appears underneath, and the card flies up into the run strip. Pass 15: The original cutscene, kept in its order and made holy. A bell tolls three times in the dark. Light comes down from above through a rose window, the object descends in it under a halo, and the Legendary appears behind it, vast and pale. The passage is written like scripture, one line at a time after an illuminated letter. Candles light, feathers fall, and at the end the light comes down on your partner, who bows under its own small halo.
- **See it:** pass 9, improved up to pass 15, clip "Legendary Blessing"
- **In the game:** `src/scenes/BlessingScene.ts`
- **Note:** Kice note: the original cutscene, remade holy. Overrides the UI mockups.

### 79. Starter Remembrance (want)
- **Today:** The three starter cards are shown at once.
- **Redesign:** Three Poké Balls roll in and stop under the Professor's words. They open one at a time, left to right, and each one turns into its card with the region stamp already on it. The first one you look at grows; the others wait their turn.
- **See it:** pass 9, clip "Starter Remembrance"
- **In the game:** `src/scenes/StarterSelectScene.ts`

### 80. Pseudo-stage banner (want)
- **Today:** A banner on the map.
- **Redesign:** The purple band from Event Stage Starts (pass 9), because a pseudo-stage always belongs to an event.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/MapScene.ts:1388`

### 81. Event screen styles (8) (want)
- **Today:** Eight event styles with 3 to 12 small tweens each.
- **Redesign:** All eight use the same four clips (Event Opens, Choice, Result, Reward). A style changes colours and frames, not timing.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/eventStyles/, src/ui/redux/redux.css:133`


## Side roads

### 82. Evolution (want)
- **Today:** A full scene already: the silhouette flickers faster and faster for 4.2s, a white flash, and the new form scales from 1.15 to 1.
- **Redesign:** The flicker stays, because that flicker is Pokémon. Everything around it is new. The room goes dark to one spotlight, two ribbons of light climb the Pokémon, each swap is bigger than the last and sends a ring across the floor, and when the new shape holds, the colour rises through it from the feet up. Then the name slams in, the stat gains count up in a column, and a new move drops in last. The B button hint pulses the whole time.
- **See it:** pass 22, clip "Evolution"
- **In the game:** `src/ui/evolutionScene.ts:237`

### 83. Egg Hatch (want)
- **Today:** The caption rises, the egg hops once, wobbles three times with cracks and a small shake, then a burst and a white flash.
- **Redesign:** The egg is given a little stage and a little patience. It rocks, stops, rocks harder; each crack is drawn as a line with light behind it; it jumps clean off the ground before it goes. The baby does not just appear: it sits in the bottom half of the shell, blinks at you, hops out, and the shell halves rock on the floor behind it.
- **See it:** pass 22, clip "Egg Hatch"
- **In the game:** `src/scenes/DecisionScene.ts:697`

### 84. Trade (want)
- **Today:** Thirteen trade screen styles with two to seven small tweens each: cards slide, a fade, the new Pokémon is shown.
- **Redesign:** One trade animation for all thirteen screens. Both Pokémon are called back, the two balls rise onto a pair of rails, and they pass each other in the middle of the screen in a flash, each leaving a trail in its trainer's colour. They drop on the far side and open. The two trainers stay on screen the whole time, because a trade is between people.
- **See it:** pass 22, clip "Trade"
- **In the game:** `src/ui/tradeStyles/`

### 85. Battle Reward (want)
- **Today:** Nine reward screen styles; a card reveals in 0.16s, a gift lid opens, a sheen sweeps.
- **Redesign:** Three cards are dealt face down onto the dimmed field, flip over one by one and lean toward your cursor as it passes. The one you pick lifts, flashes, and its item flies to your bag, where the count ticks up. The two you left tip over and fall off the bottom of the screen.
- **See it:** pass 22, clip "Battle Reward"
- **In the game:** `src/ui/rewardStyles/`

### 86. Run over (defeat or victory) (want)
- **Today:** Ten small tweens on the end-of-run screen.
- **Redesign:** The map path dims stop by stop back to the start, your team walks off together, then the run's numbers count up one line at a time.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/GameOverScene.ts`

### 87. Hall of Fame (want)
- **Today:** Three small tweens.
- **Redesign:** Each team member steps into a spotlight in order, with its level and the stop where it joined.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/HallOfFameScene.ts`

### 88. Credits (want)
- **Today:** A plain roll with three tweens.
- **Redesign:** The run's stops scroll past as a road, with your team walking along it under the names.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/CreditsScene.ts`

### 89. Minigames (want)
- **Today:** One shared screen with two tweens.
- **Redesign:** A three-beat count-in, score ticks that pop, and a finish stamp, the same for every minigame.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/MinigameScene.ts`

### 90. Legacy Gallery (want)
- **Today:** Two small tweens.
- **Redesign:** Past trainers stand in a row; the one you pick steps forward and its team is sent out behind it, ace last.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/LegacyGalleryScene.ts`


## Screens

### 91. Ball Wipe (want)
- **Today:** Screens change with a fade, or glass shutters for battles.
- **Redesign:** Every big change of place shuts like a Poké Ball and opens on the next screen: two halves slide in on the slant, meet, the button flashes, and they part. 0.8s, used for map to battle, battle to reward and town to road.
- **See it:** pass 10, clip "Ball Wipe"
- **In the game:** `src/ui/transitions.ts:19, src/ui/battleFx/spectacle.ts:312`

### 92. Title Screen (want)
- **Today:** The title appears complete after loading.
- **Redesign:** The title builds itself in under two seconds: the navy slab slides in on its slant, POCKET drops and RAIDERS slides under it, your trainer steps in from the right, the menu deals out row by row, Rotom's note and the Best badge pop, and your last team walks along the bottom.
- **See it:** pass 10, clip "Title Screen"
- **In the game:** `src/scenes/MainMenuScene.ts:100`

### 93. Boot screen (want)
- **Today:** A fish bobs every 0.6s and scales in.
- **Redesign:** The game opens with the Ball Wipe (pass 10), so the first thing you see is in the same language as the rest.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/BootScene.ts:176`

### 94. Loading looks (9) (want)
- **Today:** Nine loading looks that loop every 0.7 to 1.4 seconds.
- **Redesign:** Keep the nine. Put them on one 1.2 second beat and end each by handing off to the Next Stop Card (pass 10).
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/loadingLooks.ts`

### 95. Title background clips and Press Start (want)
- **Today:** Six video clips crossfade every 9 seconds. Press Start blinks.
- **Redesign:** The crossfade stays. Press Start breathes on the same 0.9 second beat as a Pokémon standing, instead of blinking.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/titleClips.ts, src/scenes/MainMenuScene.ts:158`

### 96. Screen transition styles (want)
- **Today:** Four styles to choose from (fade, bounce, wipe, ripple). Battles always get a plain fade whatever is chosen.
- **Redesign:** One family: Ball Wipe into battles, a slanted wipe between screens, an iris for events. The setting picks the speed, not a different style.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/transitions.ts:19, src/main.ts:150`

### 97. Sheen sweep on every screen (want)
- **Today:** A shine sweeps across every screen as it arrives.
- **Redesign:** Keep it only for screens that arrive with a win or a reward, so the shine means something.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/transitions.ts (sheenSweep)`

### 98. New UI page motion (about 55 CSS animations) (want)
- **Today:** About 55 small animations in the new UI stylesheet, each timed on its own.
- **Redesign:** One timing table for the whole game (0.12s pop, 0.25s slide, 0.4s settle), so pages and battles move at the same speeds.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/redux/redux.css`

### 99. Settings (want)
- **Today:** Five small tweens.
- **Redesign:** Switches flick, sliders show their effect live. Battle effects plays the Reduced Motion clip (pass 25) in a small window as you change it.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/SettingsScene.ts`

### 100. Save Slots (want)
- **Today:** Two small tweens; the three cards are simply there.
- **Redesign:** The three cards are dealt in. The one you pick opens like a trainer card and the others tuck behind it.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/SaveSlotsScene.ts`

### 101. Trainer Select (want)
- **Today:** Four small tweens.
- **Redesign:** The trainer you point at steps forward and plays its win frame; the others step back and dim.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/TrainerSelectScene.ts`

### 102. Briefing (want)
- **Today:** Two small tweens.
- **Redesign:** The lines stamp in one by one like a mission card, on the Message Rhythm beat.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/BriefingScene.ts`

### 103. Party and summary panel (want)
- **Today:** Sprites sway every 1.4s, hop in loops, and the panel fades shut. Eight party styles.
- **Redesign:** Party tiles pop in order like the Pause Menu. The Pokémon you point at plays its own Idle Style (pass 11).
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/partyPanel.ts:418, 662`


## World

### 104. Map: Moving On (need)
- **Today:** Path lines are static; the marker jumps to the stop you pick.
- **Redesign:** The stop you just cleared gets a stamp. The paths to the next stops draw themselves outward and those stops start to pulse. Pick one and you hop along the line in three bounces, land with a puff, and the view closes on the stop.
- **See it:** pass 10, clip "Map: Moving On"
- **In the game:** `src/scenes/MapScene.ts:1460`
- **Note:** Kice note: smaller map that shows 8 stops with room to spare. Also fills a gap: paths are never drawn on today.

### 105. Poké Mart: Buying (want)
- **Today:** The count changes and the money number updates.
- **Redesign:** What you buy hops off its shelf and lands in the basket, which bumps and adds up. At check-out your coins fly to the counter, a SOLD stamp lands, and the clerk thanks you.
- **See it:** pass 10, clip "Poké Mart: Buying"
- **In the game:** `src/ui/shopStyles/common.ts:105`

### 106. Hub Town: walking and the crowd (want)
- **Today:** You walk a tile in 0.14s and run one in 0.075s. Townsfolk wander.
- **Redesign:** Speeds stay. The walker squashes a little on start and stop, and townsfolk turn to look as you pass.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/hubTown/townView.ts:284, src/ui/hubTown/crowd.ts`

### 107. Hub Town: day and night, growth, signs (want)
- **Today:** A halo pulses with the time of day, growth shows sparkles, signs bob every 0.52s.
- **Redesign:** All three follow the Time of Day clock from pass 21, so the town and the battles share one sky.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/hubTown/townTime.ts:38, townGrowth.ts:42, indicators.ts:89`

### 108. Pocket Town folk (want)
- **Today:** Folk walk a step in 0.34s at 7 frames a second.
- **Redesign:** Same rules as the Hub Town crowd.
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/hubTown/pocketFolk.ts:139`

### 109. Map: halos, path sparks and depth (want)
- **Today:** Reachable stops breathe, open paths carry light sparks, the layers shift a little.
- **Redesign:** Keep all three. The halos pulse in order along the path from where you stand, so the eye is led to the next stops.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/MapScene.ts:764, 968-1025`

### 110. Map: healing stop (want)
- **Today:** A green wash and 14 rising sparkles, 0.8 seconds.
- **Redesign:** Use the Healing family (pass 24): lights rise from each party icon in order and each bar fills as they pass.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/MapScene.ts:546`

### 111. Map: the egg (want)
- **Today:** The egg wobbles on the map.
- **Redesign:** The wobble gets stronger the closer the egg is to hatching, and matches the first beat of Egg Hatch (pass 22).
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/MapScene.ts:1180`

### 112. Map: welcome back (want)
- **Today:** A banner pans for 0.9s and a dream blur clears when you resume.
- **Redesign:** The blur clears outward from your marker, then the Next Stop Card says where you were.
- **See it:** no mockup yet, described only
- **In the game:** `src/scenes/MapScene.ts:905, 1384`

### 113. Shop screen styles (8) (want)
- **Today:** Coins count up in 0.38s, a price pops, the stall shakes on a failed buy, a box slides.
- **Redesign:** All eight use the Poké Mart: Buying beats (hop off the shelf, basket bump, coins fly, SOLD).
- **See it:** no mockup yet, described only
- **In the game:** `src/ui/shopStyles/`


## Rules for the whole set

### 114. Reduced Motion: Three Levels (need)
- **Today:** The game has a Reduced motion setting. It shortens some tweens and leaves others alone, case by case.
- **Redesign:** One rule for the whole set, shown on one hit. Full: wind-up, hit-stop, shake, flash, particles and camera. Reduced: the screen never shakes, flashes or moves; the wind-up is short; the shapes, the number and the bar stay. Off: the bar, the number and the text change, and nothing else moves. What happened is readable at every level, because no clip in this set uses motion as the only way to say something.
- **See it:** pass 25, clip "Reduced Motion: Three Levels"
- **In the game:** `src/core/settingsRegistry.ts (battleAnimations and about 40 other switches)`
- **Note:** Needed before anything is built: one rule for what Reduced and Off keep.

### 115. Hold to Skip, and Short Cuts (need)
- **Today:** Some cutscenes can be skipped with a key press and some cannot. A skipped cutscene cuts to black and back.
- **Redesign:** Two rules. First: every cutscene over two seconds can be skipped by holding a button. A small bar fills while you hold, so one stray press never loses a scene, and the skip is one white frame straight to the last picture of the cutscene, never to black. Second: the Cutscene length setting swaps a long cutscene for its own short cut, made for it, like the one-second Mega.
- **See it:** pass 25, clip "Hold to Skip, and Short Cuts"
- **In the game:** `src/core/state.ts:2120 (fastMega, fastTera, fastDynamax, fastZMove)`
- **Note:** Needed before anything is built: one rule for skipping.
