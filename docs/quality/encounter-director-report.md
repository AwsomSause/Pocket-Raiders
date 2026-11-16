# Encounter Director report

Written by `tests/unit/encounterDirector.test.ts` (part of `npm run check`): 10000 wild and 2000 trainer teams per early stage, region 1, column 3, trainer Red. Full numbers (level, rarity and evolution-stage spreads, top species) are in `encounter-director-report.json`.

| Stage | Source | Intended levels | Levels seen | Samples | Species | Threat avg / max | Draws rejected | Fallbacks | Invalid | Locked picks | One-hit KO |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | wild | 4–5 | 4, 5 | 10000 | 85 | 52.974 / 79 (budget 86.937) | 6.0% | 0 | 0 | 0 | 0.00% |
| 1 | trainer | 4–5 | 4, 5, 6 | 2000 | 86 | 52.919 / 102 (budget 102.96) | 2.9% | 0 | 0 | 0 | 0.00% |
| 2 | wild | 6–8 | 6, 7, 8 | 10000 | 141 | 54.609 / 90 (budget 91.189) | 2.2% | 0 | 0 | 0 | 0.00% |
| 2 | trainer | 6–8 | 7, 8, 9 | 4000 | 143 | 55.519 / 106 (budget 110.768) | 0.7% | 0 | 0 | 0 | 0.00% |
| 3 | wild | 10–12 | 10, 11, 12 | 10000 | 294 | 58.643 / 99 (budget 97.594) | 0.4% | 0 | 0 | 0 | 0.00% |
| 3 | trainer | 10–12 | 11, 12, 13 | 6000 | 267 | 60.308 / 114 (budget 121.197) | 0.5% | 0 | 0 | 0 | 0.00% |
| 4 | wild | 14–16 | 14, 15, 16 | 10000 | 330 | 63.067 / 105 (budget 103.993) | 1.0% | 0 | 0 | 0 | 0.00% |
| 4 | trainer | 14–16 | 15, 16, 17 | 6000 | 298 | 67.232 / 114 (budget 131.582) | 1.1% | 0 | 0 | 0 | 0.00% |

One-hit KO = the foe's best attack at a max roll, neutral type, no crit, beats an all-70 Pokémon of the same level. Party loss and win rates are measured by the playtest bot (`node tools/playtest.ts`, `docs/quality/playtest/`), not here.
