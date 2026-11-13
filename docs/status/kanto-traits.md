# Kanto signature traits (workstream 13, E1 part 7)

State: `battle.extra.traits` (uid -> trait + counters), `extra.darkTurns`, `extra.payout`; all optional with defaults, so no save version bump. Rules: `src/core/expansion/traits.ts` (pure); engine hooks in `src/core/battle/engine.ts`; assignment in `src/core/expansion/variantAssign.ts` (`assignEvilTraits`, called from `startEventBattle`); Payout's money line in `src/core/run.ts`. Tests: `tests/unit/traits.test.ts`, `tests/unit/variantAssign.test.ts`.

| Trait | Pokémon | Built as | Reachable in a run today |
|---|---|---|---|
| Seat at the Table | Persian | on entry the foe's raised stats go to 0 | Kanto Rocket Specialist+ fights (Giovanni's lineup) |
| Drill Through | Rhydon / Rhyperior | its first Ground/Rock move each battle ignores Protect and screens | Rocket leader (Rhyperior) |
| The House Wins | Nidoking / Nidoqueen | when one faints the other gets +1 Attack and +1 Sp. Def (at once if out, else on entry) | Rocket leader |
| Double Entry | Porygon family | once per battle copies the foe's stat change | Rocket Specialist |
| Collections | Raticate | biting moves take the target's Berry | Rocket fights above Grunt rank only (Grunts never carry traits) |
| Fed and Paid | Snorlax | heals 1/8 HP each turn until Knock Off/Thief/Covet/Trick takes its food | The Roadblock event (flute branch): the wild Snorlax carries it, catchable |
| Payout | Dratini / Dragonair | when it KOs a foe the win's prize money doubles | New Kanto event *The Count Room*: Pit Boss Vesper's Dratini ("I'll play you for her"); winning also adds a Dratini to the party |
| Lights Out | Voltorb / Electrode | when it faints the field is dark 3 turns (accuracy x0.9 both sides) | Rocket Specialist |
| Translator | Meowth | once per battle the foe's next move is announced | Rocket Remnants Specialist+ |

**Limits:** Event battles name their special with `special: "<dossier id>"` (schema field on wild and trainer event battles). Traits last for the battle only: a Snorlax you catch or a Dratini you win does not carry its trait into your party. The Count Room is a stand-alone event (Raid 2's phase table is an outcome table, not scenes), written in `tools/events/expansion/kanto.ts` and built by `npm run data:xe-events`. Traits go on every matching Pokémon in a Specialist-or-higher lineup, not only on a named character. Double Entry copies the first change it sees, not "the last". Not simmed (the 60% gate covers variant lines, not the nine named traits).
