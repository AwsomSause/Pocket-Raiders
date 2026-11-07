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

## Batch 6: status and setup moves (13 more)
Counters from the moves the Pokémon uses (`moveRoleCounters`) and from statuses that land on the foe during its turn (`story/hooks.ts`). A path needs the single top count in the party; type paths need the type. No save change.
- Live Wire (Electric, 3 paralysis inflicted): +5 points paralysis chance on its moves' side effects. Glacial Mind (Ice, 2 freezes): +3 freeze. Dream Weaver (Psychic, 3 sleeps or confusions): +3 sleep and confusion.
- Toxic Weaver (Poison, 4 Toxic or Toxic Spikes): its Toxic starts one step stronger.
- Rain Dancer (3 weather moves), Terrain Master (3 terrains), Trick Roomer (3 Trick/Wonder Room), Screen Keeper (4 screens): the first one set each battle lasts +1 turn.
- Hazard Setter (4 hazards set): hazards it set sting 1/32 max HP more that battle. Cleaner (3 removal moves): they restore 1/16 HP. Disruptor (6 stat-lowering moves): +5% accuracy with them. Buffer (6 self stat-raising moves): they restore 1/32 HP. Tricky Feet (3 moves blocked by its Protect): the first back-to-back Protect of a battle has +3% success.
Left off on purpose (3): Trapper (trapping has no turn count in the engine), Medic and Bodyguard (they need ally healing and ally protection, which only exist in doubles and nothing tracks them yet). Tests: `tests/unit/growthSetupPaths.test.ts`.

## Batch 7 (part 1): doubles battles fill the counters
In a doubles battle the story hooks now follow the engine's `focus` events, so KO, move, hit and status counters go to the Pokémon that acted (before, everything went to the left-hand Pokémon). The per-turn counters (`doublesTurnFacts` in `growth.ts`) are filled for both partners that began the turn: who moved, hit the foe, was hit, missed, switched out. Not counted in doubles: foe misses (Dodger), because a miss event does not say who was aimed at. Tests: `tests/unit/growthDoubles.test.ts`.

## Batch 7 (part 2): battle-situation paths (13 more, 87 of 106 play)
KO situations are read in `story/hooks.ts` (`koSituation`) and the engine reads the field at hit time (`growthSituation` in `engine.ts`). Each needs the single top count (min 4 unless noted):
- Hunter (KOs on a foe under 50% HP): +5% against foes under 50% HP. Sweeper (a KO when it already scored one this battle; mark `ko:<uid>` in `growthMarks`): +5% after its first KO of a battle. Comeback (KOs while your party had fewer Pokémon left than the foe): +5% in that case. Duelist (KOs when both sides were down to the last one): +5% in that case. Glass Cannon (6 KOs at 80%+ HP): +5% at full HP, -3% Defense.
- Speedster (15 turns it moved first) and Scarfer (KOs after moving first while holding a Choice item): +3% Speed once it has a KO this battle.
- Legend Hunter (100% of a Legendary's max HP dealt, in total): +5% against Legendary and Mythical-like foes. Rival Mirror (5 battles against a foe sharing a type): +3% against such foes. Grudge Keeper (KOs on a foe whose kind knocked out one of yours earlier, the game's existing grudge list): +5% against such foes.
- Silk Spinner (Bug, 4 Speed-lowering moves), Haunt Keeper (Ghost, 4 Ghost status moves), Trickster (Dark, 4 uses of Taunt, Torment or Fake Out): +5% accuracy with those moves (Taunt and Fake Out are already 100%, so Trickster mostly helps through accuracy drops).
Limits: Comeback and Duelist count the field at the end of the turn; Closer was not added (it is the same rule as Loner); Scout, Pivot, Lucky, Vanguard, Tidy, Berry Friend, Medic, Bodyguard, Trapper and the rest of the unplayed list are next. Tests: `tests/unit/growthBattleFacts.test.ts`.

## Batch 8: ally, trap and defence paths (7 more, 94 of 106 play)
Counters in `story/hooks.ts`, effects in `engine.ts`/`held.ts`. Each needs the single top count:
- Medic (3 heals of a teammate by its healing moves, doubles): its healing moves restore 5% more (also Anchor's rule). Bodyguard (3 uses of Follow Me, Rage Powder, Wide Guard or Quick Guard in doubles, or a hit taken for a teammate by Protective Instinct): +5% Protect chain success, once per battle.
- Trapper (3 uses of binding or trapping moves): its binding moves bind one turn longer, once per battle (the engine does have a bind count; Mean Look style trapping has none, so only binds benefit).
- Berry Friend (4 Berries eaten that did something): held healing Berries restore 5% more. Vanguard (4 switch-ins that took a hit from the foe's move the same turn): +5% Defense and Sp. Def on the turn it switches in.
- Lucky (3 critical hits from moves with no crit boost): +1% crit chance. Scale Guard (Dragon, 8 resisted hits taken): takes 3% less from Dragon, Ice and Fairy moves.
Left off on purpose: Fossil Memory (Rock types are immune to sandstorm, so its edge would do nothing). Still unplayed (12): Scout, Pivot, Tidy, Thorn Warden, Dojo Student, Burrower (no charge-interrupt mechanic), Shield Sibling, Closer (same as Loner), Free Spirit, Cheerleader, Fast Learner, Fossil Memory. Tests: `tests/unit/growthAllyPaths.test.ts`.

## Batch 9: move-history paths (2 more, 96 of 106 play)
Read from the per-move use counts each Pokémon's story history already keeps (`history.moves`), so no new counters:
- Fast Learner (2 or more moves used 10+ times this run, single top in the party): at the end of the run its moves' uses count 5% extra (`masteryCredit` in `moveMastery.ts`, rounded up), which is the same as needing 5% fewer uses for Move Mastery ranks.
- Dojo Student (Fighting type, 15+ uses of one Fighting move, single top): +3% accuracy with that move. The move is remembered on the Pokémon as `growthMove` (optional field, no save bump).
Fast Learner is checked before Dojo Student.
Still unplayed (10) and why: Closer (same rule as Loner), Fossil Memory (Rock is immune to sandstorm, the edge would do nothing), Burrower (no charge-interrupt chance in the engine), Free Spirit (no "wander off" node mechanic), Cheerleader (no team morale), Shield Sibling (pair bonds are not visible to the battle), Scout, Pivot, Tidy and Thorn Warden (no counter for first strikes against unseen foes, pivot switch-ins, hazards avoided or contact punishments yet). Tests: `tests/unit/growthMoveHistory.test.ts`.

## Batch 10: Tidy and Thorn Warden (98 of 106 play)
- Tidy: counter `tidyHazard` (6+, most in party) from clearing hazards (Rapid Spin, Defog, Tidy Up) and from dodging them on switch-in (Heavy-Duty Boots, or a flyer with no Stealth Rock down). Edge: entry-hazard damage taken −5% (`growthHazardMultiplier`).
- Thorn Warden (Grass): counter `thornHit` (5+) each time its Rough Skin, Iron Barbs, Static-style contact status, or a contact-punishing Protect move hits a foe. Edge: +5% damage to a foe that made contact this turn or last (engine marks `contact:<uid>:<turn>`). Rocky Helmet is not counted yet (held-item module).
- The engine leaves `avoid:`/`thorn:` marks in `growthMarks`; `story/hooks.ts` turns them into counters. No save bump.
Still unplayed (8): Closer, Fossil Memory, Burrower, Free Spirit, Cheerleader, Shield Sibling, Scout, Pivot (reasons as above; Scout and Pivot need first-strike and pivot-switch tracking). Tests: `tests/unit/growthHazardContact.test.ts`.

## Batch 11: Scout and Pivot (100 of 106 play)
- Scout: counter `scoutFirst` (5+, most in party) each time it moves first, on a foe's first turn out, against a foe with higher base Speed (story hooks). Edge: +3% accuracy on moves against a foe on its first turn out (`growthAccuracyMultiplier`, `scout`).
- Pivot: counter `pivotOut` (4+) for a U-turn-style exit, or a voluntary switch out after it dealt damage this stay (engine marks `dealt:<uid>`, `pivotOut:<uid>`). Edge: +5% damage on the first turn out of the Pokémon sent in right after a U-turn-style exit (`pivotIn:<uid>` mark). Settled as: the path holder must itself be the one sent in.
- Forced switches (Roar etc.) do not count. No save bump (marks live in the optional `growthMarks`).
Still unplayed (6): Closer, Fossil Memory, Burrower, Free Spirit, Cheerleader, Shield Sibling. Tests: `tests/unit/growthScoutPivot.test.ts`.
