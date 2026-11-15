# Catalog overhaul row 15: Greenneedle events

Branch `claude/project-thread-uehq47`, draft PR #1314 into `ui-mockups`.

## Status: PAUSED (2026-11-15, Kice: five threads at a time)

| Event | State | Doc re-read |
|---|---|---|
| gn.01 Poli-Pond | done, tests pass | yes |
| gn.02 Pidgey's Resolve | IN PROGRESS (see below) | no |
| gn.03 | done, tests pass | yes |
| gn.04 Mt. Moon | done, tests pass | yes |
| gn.05 Damian's Unofficial Gym | done, tests pass | yes |
| gn.06–gn.62 | not started | |
| gn.new.01–38 | not started | |

## Where I stopped (gn.02)

Engine and scene data are converted to the doc and build. Typecheck is NOT green yet. Left to do:
- `src/core/sky/story.ts`: import `FEAROW_BY_STAGE`, `FEAROW_START` from `./text`; fix the leftover `rematchWon` ternary in the `rematchLost` branch (TS2367).
- `tests/unit/skyRivalry.test.ts` lines ~137, 143, 230: `fearowMoves` now takes the stage number; first meeting is alone only on stage 3 or 6.
- `src/scenes/BattleScene.ts` ~2069–2090 cheer menu: "Who are you cheering for?" with "Pidgeot!" / "Fearow!"; update `tests/e2e/skyRivalry.spec.ts:91`.
- gn.02 unit tests, then re-read the doc.

## Still to do after gn.02
- Files 2–13 of the pack (gn.06–62; reconcile gn.13–16), then the 38 new events.
- gn.new.09 The Last Stop: when the Dusknoir punches the ticket set flag `last-stop-ticket` = 1 and start node timer `{ kind: 'flag', key: 'ovt-last-stop', amount: 0 }` (pairs with families-b row 3). Any scene that loses a Pokémon for good sets flag `lost-mon`.
- Tell the legends thread about `eventBattleLost` now using `choiceAt` and the `remembers` walk in `pseudo.ts`; tell the Kanto canon thread about retired ids (`pp-rematch-exceptional`).
- Samurai Slash power 70 → 60.
- Update fragment `docs/updates/catalog-overhaul/greenneedle.md`, Playwright spec, `npm run check`, mark PR ready.
