# Overhaul slice 25 (part): growth paths, first cut

A Pokémon that has proved itself over the run settles into one growth path, a small permanent damage edge (`core/overhaul/growth.ts`, numbers and switch in `balance.overhaulGrowth`: +5%, 8 KOs, 2 close calls).

- **Last Stand** (pack `last-stand`): 2 or more close calls, +5% damage under a quarter HP.
- **Striker** (pack `striker`): the single top KO count in the party (8 or more), +5% on super-effective hits.
- **Type path** (the first pack path of each of the 18 types, e.g. Fire-forged): a Pokémon of that type with 8 or more KOs, +5% damage with moves of its own type.
- Paths are given at camp rests, kept for the run (`growthPath` on the Pokémon, optional so no save bump), shown on the personality line of the info page. Run-only, no RNG.

Limits: only 20 of the 106 pack paths play, and their rules use the counters the game already keeps (KOs, close calls, types), not the pack's exact "earned by" text; the type paths use one flat bonus instead of each pack bonus. The other 86 paths need new battle counters and stay unplayed. Tests: `tests/unit/overhaulGrowth.test.ts`.

## Batch 2: counter paths (7 more, 27 of 106 play)
New per-Pokémon KO counters (`growth` on its story history, optional so no save bump) are filled where a KO is recorded (`story/hooks.ts`). A path needs 4 or more KOs of its kind and the single highest count in the party. Each gives +5% damage in its case:
- Rival Breaker (KOs on rival Pokémon), Gym Slayer, Elite Slayer, Champion Slayer (KOs in those battles).
- Loner (KOs as the last one standing; +5% when last alive).
- Deep Swimmer (Water KOs on Fire/Rock/Ground foes) and Forge-born (Steel KOs on Ice/Rock/Fairy foes), each +5% of that type against those foes.
These come before Last Stand, Striker and the type paths when a Pokémon qualifies.
Still unplayed (79): paths that need counters for turns, moves used, healing, nodes, items, time of day or town visits. They stay off rather than get a stand-in rule.

## Batch 3: move and hit counters (7 more, 34 of 106 play)
New counters filled in `story/hooks.ts` from the moves a Pokémon uses and the hits it lands (all in `growth` on its story history, no save bump):
- Steady (30 uses of 100%-accuracy damaging moves): +3% damage with them.
- Gambler (8 uses of moves of under 80% accuracy): +5% accuracy with those moves.
- Chorus Lead (10 sound moves): +3% damage with sound moves.
- Support (15 status moves): +5% accuracy with status moves.
- Tank Buster (12 hits on foes above 75% HP): +5% damage against foes above 75% HP.
- Bond Breaker (4 KOs on foes at full HP, most in the party): +5% damage against foes at full HP.
- Ember Heart (6 Fire moves used under 50% HP): +5% Fire damage under 50% HP.
Limits: the pack's exact "earned by" wording is simplified to these counters; 72 paths still need counters (turns, healing, nodes, time of day, items, town visits, eggs).

## Batch 4: run-map counters and run-stat paths (11 more, 45 of 106 play)
New counters in the same `growth` record (no save change). Node events credit the lead Pokémon; each path needs the most in the party (a tie gives nobody). All give a flat +5% damage, since the pack's own bonuses (XP, shop prices, hatch steps) are not battle rules:
- Pathfinder (10 battles won with no one fainting), Frontline Pet (4 shops visited), Egg Warm (2 eggs hatched), Treasure Nose (5 field items from wild nodes: hidden item or catch drop), Move Collector (3 TM/tutor moves taught, credited to the learner), Caretaker (5 berries fed to it, credited to the fed Pokémon).
- Read from what the run already keeps: Shiny Glint (shiny, 10+ battles), Elder (most battles, 20+), Late Bloomer (most evolutions, 2+), Trainer Pet (top trust+affection, 200+), Prodigy (first to reach level 30).
Still unplayed (61): Free Spirit (no wandering mechanic), Cheerleader (no morale boost), Fast Learner (profile mastery, not per run), time of day, in-battle turns/healing. Tests: `tests/unit/overhaulGrowth.test.ts`.

## Batch 5: time of day and weather (7 more, 52 of 106 play)
Uses the run clock's period (`periodOf`, passed to the battle as `ctx.period`) and the battle's weather and Tailwind. Counters in `story/hooks.ts`; once-per-battle marks in `battle.growthMarks`, first battle of a clock day in `battle.firstOfDay` and `clock.lastBattleDay` (all optional, no save bump):
- Night Owl (3 wins at night): +5% damage in night battles. Sunbather (3 wins in the morning or afternoon): +5% damage by day. Evening counts as neither.
- Moonlit (Fairy type, 6 Fairy attacks at night): +5% Fairy damage at night.
- Dawn Runner (2 wins that were the first battle of a clock day): +3% Speed in the first battle of a day.
- Weather-Wise (3 battles with weather up): +3% accuracy in any weather. Storm Chaser (3 battles where the weather was set twice or more): +3% Speed in rain and snow.
- Windrunner (Flying type, 5 turns it moved first under its own Tailwind): +3% Speed under its own Tailwind. The game has no gale weather, so only Tailwind counts.
Each needs the single top count in the party. Tests: `tests/unit/overhaulGrowth.test.ts`.

## Batch 5: turn counters (9 more, 61 of 106 play)
Counters are filled each turn of a singles battle for the Pokémon that started the turn (`turnCounters` in `growth.ts`, called from `story/hooks.ts`; none when it switched out). Two small battle flags (`waited`, `unhit` on the battle volatile, default false, so no save bump) remember the last turn. Paths need the pack's "most in the party" rule too:
- Lead-Out (5 battles as lead): +5% damage in turns 1–2. Opener (4 KOs on turn 1): +5% damage on its first turn out.
- Quiet Strength (20 turns not hit): +3% damage after a turn it was not hit. Patient (12 turns spent waiting, i.e. a no-damage move that did not miss): +5% damage after such a turn.
- Steady Hand (Normal types, 40 turns ending above 50% HP): +3% accuracy with Normal moves.
- Wall (300% of max HP absorbed while surviving the turn): +5% Defense above 50% HP. Bruiser (15 turns it hit and was hit): +3% damage and +3% Defense at full HP.
- Anchor (20 boss-fight turns on the field; boss = gym, elite, champion, rival): held-item and recovery-move healing restores 5% more.
- Dodger (10 foe misses): foes' accuracy ÷1.03 while it is above 75% HP.
Limits: Doubles battles do not fill these counters. "Damage absorbed" and "evasions" are simplified to hit damage taken and foe misses; Anchor boosts healing amounts by 5% (not +5% of max HP), and drain moves are not included. The rest need mechanics the game does not have yet (Free Spirit, Cheerleader, Fast Learner and others).
