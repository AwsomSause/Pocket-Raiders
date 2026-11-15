# Catalog Overhaul: legends (row 13)

Branch `claude/project-thread-gdpy7l` (PR into `ui-mockups` not opened yet). Contract for other threads: `/mnt/project-files/plans/catalog-overhaul/LEGENDS_PIECES.md`.

## Done (pushed)
- Chain pseudo-stages per category (`src/data/catalogOverhaul/pseudo/<category>.json`, `start: 'opened'`, `team`).
- Alpha calm fights: wild event battle `alpha: true`, `rule.calm`, `calm` effects; items `calming-balm`, `az-flute`; Alpha Mark (+10% HP); `calmed-alpha` count; `partyAlpha` condition.
- Signs (`sign-<legend>` -> Influence and ladder lines) and Tellings (`telling-<mythical>`), mirror flags (`blessing-*`, `guest-*`, `promise-*`, `blessing-company/solitary`).
- Blessings and Ultra Beast Incursions on by default: settings v44 migration (coordinator gave v44). Automated browsers on fresh settings keep the old baseline unless `?legends=1`.
- Tests: `tests/unit/coLegendsEngine.test.ts`, settings v44 tests in `settingsV20.test.ts`, `tests/e2e/blessings.spec.ts` (8 passed with milestone1/2 specs). Targeted unit files pass; the full unit run was stopped before it finished (pause on 2026-11-15).

## Where I stopped (paused 2026-11-15, Kice: five threads at a time)
- Next: cherry-pick the engine-only pieces content needs (people region stamps 09d5391e0, anime flagAge/laterEvent 9e2c05889, new-events takeNode ce0a5c9a, families-b 079ac3e0), then write `tools/events/co/legends-1.ts` with Alphas A2-A11 (A7-A11 from QUESTLINES_DEEPENED_1 lines 9-259), using `tools/events/co/_legendsKit.ts` (alpha, joinAlpha, gift, sign, telling).
- Still to build: abilities Hush and Three Faces, moves Keeper's Lamp and Last Winter (`src/data/catalogOverhaul/moves/legends.json`), item batch (shed horn, Warden sash, Delta Journal...), then M1-M7, D1-D8, Z1-Z7, L2-L15, MY1-MY22, U1-U9, the 382 RULE ids (ladder Trial/Recognition/Presence), placement/flags/status files, update fragment, PR.
- Run the full `npm run check` before opening the PR.
