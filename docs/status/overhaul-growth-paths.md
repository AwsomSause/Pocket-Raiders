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
