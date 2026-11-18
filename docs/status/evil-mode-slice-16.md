# Evil Mode slice 16: the Crossing

- **Evil Mode slice 16, "the Crossing"** (2026-11-17, build plan `/mnt/project-files/plans/evil-mode/31_THE_BUILD_PLAN.md` section 3; design Part 2 section 9, Part 26a, Part 08b, Part 15a section 8, Part 30): a Standard run is now three regions, Kanto, Johto and Hoenn. Built on slice 15 (#1465).

## What's built
- **The Crossing** (`src/core/evilMode/crossing.ts`), after a region's Reckoning when it isn't the run's last: two tickets (hashed from the seed, never a region already played), who comes (a third of the Roster stays, by name and reason; "We need you." once, at Loyalty 8+), the base (hand it over, sell it, leave an Officer in it, burn it), the quay's question about forms, and the boats (the Hero lands ahead, beside or behind by how the last room went).
- **What carries and what halves**: Funds and Loyalty carry; Heat halves; Regard and Dread halve unless the base was handed over (Regard whole) or burned (Dread whole). Garrisons and an Officer left in the old base pay half from across the water.
- **Johto and Hoenn whole** (`src/data/evilMode/*.json`): eight stages each, Leaders, eight locals each (Wally is a minor), neighbours Archer (Johto) and Archie or Maxie (Hoenn, by Doctrine side), region rules, holdings (Johto's kept places, Hoenn's water routes), schemes pace, Hoenn's letters and its second clock.
- **Level by absolute stage**: A = (region − 1) × 8 + stage. Region-of-run is `runIndex` (`region.ts`); the region's own index stays in `here.region`.
- **Region texts** name each region's own first and eighth Leader, town and name (`regionText`).
- **Screen (New look)**: the Crossing replaces the tally at the region's end, one step at a time; every choice is a button, Enter takes the first. Hoenn: In person shows "Carry a letter" before the Reckoning and "stop the clock" buttons while it runs; a clock chip on the frame.

## Saves
- Evil block **14 -> 15**: `region` gains `crossed`, `crossing`, `abroad`, `forms`, `letters`, `clock`. Old saves get empty values. Card fields can now be stored packed (text only) to fit the 300 KB budget: a three-region save measures about 270 KB.

## Tests
`tests/unit/evilModeCrossing.test.ts` (24): a full three-region run plays to an ending and replays; save under 300 KB; absolute stage; the Crossing (tickets, who stays, ask, what carries, landing, last region); the screen model walked step by step; region texts; Johto Persuade +10% and Take −20% stacked in order; Hoenn tide/hot; water and kept lapse; minors; data counts; letters stop tick 3; the clock never ends a run; v14 -> v15; a mid-Crossing reload. Browser `tests/e2e/evilModeCrossing.spec.ts`: pick Johto by tap, Enter through the quay, land in Johto; carry a letter in Hoenn; screenshots at three sizes.

## Limits
- Three of nine regions; sixteen founders, no applicants beyond three a region (the plan's limit).
- Not built: Johto's heat rule extras, the water route's Reach, the Frequency and Weather schemes, the kept place doubling a Take, the clock's "Together" stop. The forms question is asked and saved but Johto and Hoenn have no forms of their own yet.
- The Line move at the Crossing isn't drawn. Some shared neighbour lines still name Giovanni.
- Pryce's Gym price changed from ₽10,500 to ₽13,500 to match the price formula.
- Ventures from earlier regions keep running as before (no change across the water).
- Undo: set Johto and Hoenn to `"status": "disabled"` in `src/data/evilMode/region.json`; with one region written there is no Crossing and the run ends after Kanto.
