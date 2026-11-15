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

## Delta Anomalies D1-D8 (built 2026-11-15, `tools/events/co/legends-3.ts` -> `co-legends-3.json`, 43 events)
Catalog ids: `delta-clue-nest/-scales/-song` and `delta-research-battle` rebuilt (D1); `form-clue-*` and `form-research-battle` merged into them; `delta-research-week` is a rule (the calendar week). D1-D8 listed under `extra`.

| Code | Entry | Built | Limits |
|---|---|---|---|
| D1 | co-d1-linden (+ linden-again) | Journal, clues need it, 3 clues open the habitat (Catch / Study / Sample), named at 3 studied, Lens at 5, letter if only caught | the Delta Lens is a flag and a Moment: map question marks not built |
| D2 | co-d2-valley (chain d2, 3 beats) | carry the ember (Fire-type), a recent faint dims it (Revive or let go), Charmander starter never fails, Ho-Oh Sign; carried = Delta Charizard + Delta Charizardite, forced = no stone | "the carrier faints" is read as any party faint in the last 18 fights |
| D3 | co-d3-hill | awake one by the run's own season, visits in four seasons wake the fifth, gran gives Leftovers, a caught one keeps the fifth asleep | uses the in-run calendar (28-day seasons), not the real date; "bring it back to stand in it" not built |
| D4 | co-d4-cove (chain d4, 3 beats) | 5 finds by tell over three beats, wrong guesses count, elder needs all 5 and no misses (4 with your own Ditto), pick one of 4 types | 5 finds stand in for 18 |
| D5 | co-d5-dump | six cage fights, the boss (report / pay 3000 / guards), leave = scattered | released-species cage not built |
| D6 | co-d6-marsh | vent (Ground-type, doubles vs water/ice), take the Wooper, tend (back a region later), Groudon blessing or Groudon in party opens it | none |
| D7 | co-d7-crossing-1..3 (stages 3/6/8) | signal by Flying-type, sound move or Flash; three signals bring it down; stay / catch / pod; Lugia Sign | none |
| D8 | co-d8-cloud (+ rest 1-3) | coax over rests, apple skips one, Pikachu starter lands at once | "no battles between rests" not enforced; "comes down at the Final Reunion" not built |

Tests: `tests/unit/coLegendsDelta.test.ts`.

## Z Anomalies (built 2026-11-15, `tools/events/co/legends-4.ts` -> `co-legends-4.json`, 59 events)
Catalog ids rebuilt: the 18 `island-trial-*` (Z1), `z-sigil-ruin`, `z-sigil-pool`, `z-form-trial` (Z2); `z-move-trial` is a rule (the calendar week). Z3, Z4, Z6, Z7 under `extra`. Z5 (Darkrai) waits for the Mythicals.

| Code | Entry | Built | Limits |
|---|---|---|---|
| Z1 | island-trial-<type> | the first Trial gives the Z-Ring; Start = Totem (Alpha-sized) fight; Ask = the Totem's reason, then a calm fight (crystal + the item it guarded); Grand Trial after three (Kahuna Olivia), no battle if all three calmed; crystal of the starter's type; Swarm Totem lets you in at 3 calmed Alphas | puzzle stage is one line of text; captains for Electric (Calder) and Psychic (Lune) chosen by me since the pack names 14 originals for 15 slots; "remembers a past run" cut (same-run rule) |
| Z2 | z-sigil-ruin | pairs: ruin, then pool a stage later, then the Z-form test (catch it to keep it); keep the sigils = `sigils-held`; Oriel's rubbing on the third pair | "re-shape one of yours" is the sigils spent in Z3/Z4/Z6 for a Z-Mega stone; no general re-shape |
| Z3 | co-z3-cave | spring / Fire-type / stay (Never-Melt Ice); Fire starter = Z-Haunter at once; sigils = Gengarite Z | none |
| Z4 | co-z4-night-1 (3 nights) | follow / grab / leave, the grave, Straight Spoon (held, Psychic +10%), three bent spoons; sigils = Alakazite Z | none |
| Z6 | co-z6-dojo | three friendly spars across the region, Doran or the sigils (Snorlaxite Z), Munchlax; leaving = an Alpha Snorlax a region later | Road Roster remembers not built |
| Z7 | co-z7-hill | needs 3 calmed Alphas at night; Hunt (calm a fleeing Furret), Hold (survive 5 turns, 7 if a Noble was beaten), Howl (a sound move); bow at 6 calmed; fed Poochyena skips the hunt; 3 rounds = Poochyena with **Pack Call** (new ability, engine) | "next region's Alphas calm/hostile" is a flag only (`alphayena-bowed`/`-prey`) |

Tests: `tests/unit/coLegendsZ.test.ts` (incl. Pack Call). Old-seed fingerprints: legends items added to `LATE_ITEMS` in story.test.ts (no re-pin).

## Where I stopped (paused 2026-11-15, Kice: five threads at a time)
- Resumed 2026-11-15 (merged ui-mockups; shared pieces are in the base now). Alphas, Megas, Deltas and Z (not Z5) done; next L2-L15, MY1-MY22 (+Z5), U1-U9.
- Still to build: M7 (rivals slot), D1-D8, Z1-Z7, L2-L15, MY1-MY22, U1-U9, the 382 RULE ids (ladder Trial/Recognition/Presence), placement/flags/status files, update fragment, PR.
- Run the full `npm run check` before opening the PR.
