# Catalog Overhaul: legends (row 13)

Branch `claude/project-thread-gdpy7l` (PR into `ui-mockups` not opened yet). Contract for other threads: `/mnt/project-files/plans/catalog-overhaul/LEGENDS_PIECES.md`.

## Done (pushed)
- Chain pseudo-stages per category (`src/data/catalogOverhaul/pseudo/<category>.json`, `start: 'opened'`, `team`).
- Alpha calm fights: wild event battle `alpha: true`, `rule.calm`, `calm` effects; items `calming-balm`, `az-flute`; Alpha Mark (+10% HP); `calmed-alpha` count; `partyAlpha` condition.
- Signs (`sign-<legend>` -> Influence and ladder lines) and Tellings (`telling-<mythical>`), mirror flags (`blessing-*`, `guest-*`, `promise-*`, `blessing-company/solitary`).
- Blessings and Ultra Beast Incursions on by default: settings v44 migration (coordinator gave v44). Automated browsers on fresh settings keep the old baseline unless `?legends=1`.
- Tests: `tests/unit/coLegendsEngine.test.ts`, settings v44 tests in `settingsV20.test.ts`, `tests/e2e/blessings.spec.ts` (8 passed with milestone1/2 specs). Targeted unit files pass; the full unit run was stopped before it finished (pause on 2026-11-15).

## Alphas A2-A11 (built 2026-11-15, `tools/events/co/legends-1.ts` -> `co-legends-1.json`, 42 events)
Door Alphas (A2 Black Tide, A3 Frostbound, A4 Hushed One) are chain pseudo-stages in `src/data/catalogOverhaul/pseudo/legends.json`. New: abilities Hush and Three Faces (`src/data/catalogOverhaul/abilities/legends.json`, engine.ts), moves Keeper's Lamp and Last Winter, held item Shed Horn (`src/data/itemCatalog/legends.json`). A ball-caught Alpha keeps only the Alpha Mark (run.ts). Tests: `tests/unit/coLegendsAlphas.test.ts`.

| Id | Doc | Re-read | Known limits |
|---|---|---|---|
| story-alpha-black-tide | A2 | 2026-11-15 | none |
| story-alpha-frostbound | A3 | 2026-11-15 | the egg is given hatched (Frigibax with Last Winter) |
| story-alpha-hushed-one | A4 | 2026-11-15 | AN36 "five signs" reads flag `prince-signs` (anime thread to set it) |
| story-alpha-orchard-warden | A5 | 2026-11-15 | "a rest node that gives Berries for the run" is given as Berries now |
| story-alpha-quarry-king | A6 | 2026-11-15 | the local Leader is unnamed |
| story-alpha-rooftop-watcher | A7 (DEEPENED_1) | 2026-11-15 | A1 Braviary remembers line not built (needs families-c's flag name) |
| story-alpha-sleeper | A8 (DEEPENED_1) | 2026-11-15 | the later-runs afterstory is cut (same-run memory rule) |
| story-alpha-static-choir | A9 (DEEPENED_1) | 2026-11-15 | power cut sets `choir-tripped` only; candlelight shops not built; "team awake" not checked |
| story-alpha-unwelcome-guest | A10 (DEEPENED_1) | 2026-11-15 | Perform does not check which performance was won |
| story-alpha-weeping-lantern | A11 (DEEPENED_1) | 2026-11-15 | released-Pokémon last name and the both-paths afterstory not built |

Keeper's Lamp's accuracy guard is not built (plain 80-power Water move).

## Mega Anomalies M1-M6 (built 2026-11-15, `tools/events/co/legends-2.ts` -> `co-legends-2.json`, 24 events)
Pack questlines, so the status file lists them under `extra` (M1-M6 -> entry event). Re-read against QUESTLINES_ALPHAS_AND_ANOMALIES.md part two.

| Code | Entry | Shape | Built | Limits |
|---|---|---|---|---|
| M1 | co-m1-absol | Companion A5, 11 | follow / break stone / grave, Absol joins or leaves | none |
| M2 | co-m2-harvest | Region A9, stages 2/5/8 | farm, bribe, mine (2 checkpoints), seam vs Celosia | none |
| M3 | co-m3-twins | Companion A6, 12 | cutter two nodes on, both whole or one scorched (your Charizard can calm it) | none |
| M4 | co-m4-mirror | Door A7, 14 | pseudo chain `ps_mirror_spider`: rooms 1-3, central room, merge or split | none |
| M5 | co-m5-tatsugiri | Single A4, 10 | contest or feed, verdict, tie gives a later ride | none |
| M6 | co-m6-flower | Single A17, 11-13 | fence, reactor, AZ's Flute | none |
| M7 | not built | | needs the rivals row's rival slot | waits on rivals |

The region Anomaly meter is run flag `mega-meter`; `syncLegendFlags` resets it to 0 when the region changes. Tests: `tests/unit/coLegendsMega.test.ts`.

## Where I stopped (paused 2026-11-15, Kice: five threads at a time)
- Resumed 2026-11-15 (merged ui-mockups; shared pieces are in the base now). Alphas and Megas M1-M6 done; next D1-D8.
- Still to build: M7 (rivals slot), D1-D8, Z1-Z7, L2-L15, MY1-MY22, U1-U9, the 382 RULE ids (ladder Trial/Recognition/Presence), placement/flags/status files, update fragment, PR.
- Run the full `npm run check` before opening the PR.
