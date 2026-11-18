# Evil Mode slice 19: Sinnoh, Unova, Kalos

- **Evil Mode slice 19, "three more regions"** (2026-11-17, build plan `/mnt/project-files/plans/evil-mode/31_THE_BUILD_PLAN.md` section 3; design Part 26b, Part 08c, Part 15a section 9, Part 15b sections 1 and 2, Part 30 section 7.4). Sinnoh, Unova and Kalos are written and `supported`; the Run length setting's "Six regions" is selectable (Kice's answer 2). Built on slice 16 (#1470).

## What's built
- **Three regions whole** (`src/data/evilMode/*.json`): eight stages each with streets and places, eight Leaders each (Part 08c; Clemont a minor), eight locals each (Part 26b; the honey man's daughter, the sailor's boy, Zinzolin, Alder, AZ, Gurkinn and Meyer locked as written), and the neighbours: Cyrus (Galactic; the Sit-Down's with Saturn), Ghetsis (Plasma; N a minor, never touched), Lysandre (Flare; the dinner, "Nearly"). Five ticks each.
- **Region rules** on the rule hook (`regionRule.ts`, new mod kinds): Sinnoh `loyaltyMove` ×0.5 (every Loyalty change, rounded toward nothing); Unova `standingMove` ×2 (every Regard and Dread change, losses too); Kalos `frontPay` ×1.5 and `arrivalRegard` +1 for a coat with no symbol (at the quay, or at founding). The halving and doubling are applied once per `step` (`regionMoves`), never across the Crossing.
- **Regional holdings** (new kinds): Sinnoh's lakes (Scout only; pay nothing), Unova's bridges (toll-house or the middle; pay tolls), Kalos's tables (Persuade, Pay a bill or Expose; no Lean or Take; pay no Funds).
- **The Speech** (Unova): the Town is a square (`square` on the region). Persuade there is the Speech: its Card gains a fourteenth field, "What you're leaving out", filled from the Ledger (the last job in the region that wasn't clean), or "Nothing" when nothing is. Given: every local in the district warms one; Regard +1 if honest, −1 when somebody says the other half (doubled by Unova's rule).
- **Second clocks** (`region.json` `clocks`; `crossing.ts` generalised): Sinnoh's mountain (stopped before if tick 3, the bomb, was stopped) and Kalos's light (tick 4, the room). Same rules as Hoenn's: start at the Reckoning's first morning, three days, half the held holdings Free at nought, never end a run; In person: the Boss goes (climb / Geosenge) or the Hero does.
- **Run length** (`runLength.ts`): "Six" can be picked only when six regions are written; a team asked for Six with fewer is founded Three.
- **Packing** (`pack.ts`, Part 30 section 7.4): at each Crossing, Log lines and Cards from regions older than the two before are packed (lossless LZW, no dependency). Readers use `logOf` / `cardsOf`. A six-region save measures about 290 KB (budget 300 KB); unpacked it was 424 KB.

## Saves
- No block version bump: `archive` is optional (absent until a fourth region), the new kinds and clock values only add enum members, and a Card may have 14 fields. Old saves read unchanged.

## Tests
`tests/unit/evilModeRegions2.test.ts` (26): the three regions' data; Loyalty halved in Sinnoh only; Regard and Dread doubled in Unova only; Kalos Fronts and the no-symbol Regard; the fourteenth field on the Speech's Card only, filled from the Ledger; Six can't be chosen before six regions exist; a six-region run replays, every Log line and Card reads back in order, save under 300 KB; both new clocks start, count, cost and stop as Hoenn's; the packer is lossless. Updated: Crossing (offer forced to Hoenn), founding (six open), Run length toggles, Maylene's Buy price. Browser `tests/e2e/evilModeRegions2.spec.ts`: cross to Sinnoh by tap; the mountain's and the light's clock stopped in person; screenshots at three sizes.

## Limits
- Not built: the region schemes (the Lights, the Speech's Sunday crowd by holding mood, the List), keeping a lake by a walk and the lake Signs, three held bridges delaying squads, a table lost by a Lean or held only out of uniform, the Pen battle and "Ask them if they want to go", the green cell, the castle's rampart (tick 5), Legends' Signs. The clocks' battle effects are lines on the Board only (as Hoenn's).
- Castelia and Lumiose have twenty steps like every district (the doc's sixteen and twenty holdings don't fit the board).
- Some Sit-Down lines are spoken by Saturn (Sinnoh) where the screen names the Boss; the engine still lets a Sit-Down call off a Kalos tick.
- Alola, Galar and Paldea waited for slice 20 (since built). Kice's "not in the first release" is about Part 27's six second-wave regions (Torren and the rest), not these.
- Undo: set Sinnoh, Unova and Kalos to `"status": "disabled"` in `src/data/evilMode/region.json`; Six then can't be picked and runs are Three.
