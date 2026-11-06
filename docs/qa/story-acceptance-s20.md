# Story S20: acceptance report (partial)

`npm run sim:story -- 20` plays 20 seeded Story Runs (Orrery Circuit, smart test bot) for each of the 5 backstories, 100 runs in all. Seeds are `sr-<backstory>-<i>`; same seed gives the same run.

## Result: S20 is NOT accepted yet

| Backstory | Median battles | Median stops | Median story moments | Runs over | Runs won | Losses that kept the run going |
|---|---|---|---|---|---|---|
| Ex-Criminal | 11 | 2 | 44 | 20/20 | 0 | 18 |
| Champion's Heir | 11 | 2 | 38 | 20/20 | 0 | 14 |
| Viridian | 11 | 2 | 46 | 20/20 | 0 | 24 |
| Aether | 22 | 4 | 55 | 20/20 | 0 | 19 |
| Hisui | 11 | 2 | 38 | 20/20 | 0 | 21 |

- No errors or crashes in 100 runs. Same seed plays the same run (unit test `storyAcceptance.test.ts`, one short run per backstory, plus the module validator).
- Every run ended by a lost battle: 77 to trainers, 23 to wild Pokémon. No run cleared a region (median stage 0-1 of 26). Rival and story losses did continue the run, as designed (see the last column).
- The bot is the same weak test bot as `sim:overhaul` (it never passes region 1-2 there either), so these numbers show the early game only. They cannot yet judge balance, pacing of late Stops, or endings.

## Why it can't be accepted yet (needs "all" slices)
Not built or not wired when this was run: S2, S5, S7, S9, S10, S11, S12, S19 (other threads), and ending selection (the `endingGrid` in each backstory is only validated, nothing plays an ending). So "a full Story Run per backstory" to an ending is not possible today. See `docs/status/story-s20-acceptance.md` for the known-limits list.

## To finish S20
1. Land S9-S12 and the ending selector, then re-run `npm run sim:story -- 20`.
2. Give the sim a stronger bot (or a level boost, `STARTER_LEVEL=50`) so runs reach Region Gates, the League and endings.
3. Balance pass on whatever the late-game numbers show; final screenshots.
