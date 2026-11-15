# Catalog overhaul row 15: Greenneedle events

Branch `claude/project-thread-uehq47`, draft PR #1314 into `ui-mockups`.

## Status: resumed 2026-11-15 (merged ui-mockups with the catalog foundation)

| Event | State | Doc re-read |
|---|---|---|
| gn.01 Poli-Pond | done, tests pass | yes |
| gn.02 Pidgey's Resolve | done, unit + browser tests pass | yes |
| gn.03 | done, tests pass | yes |
| gn.04 Mt. Moon | done, tests pass | yes |
| gn.05 Damian's Unofficial Gym | done, tests pass | yes |
| gn.06 Bridge Crossing and the Hidden Village | done, 11 tests pass (Kanto: canon space cs-kanto-cerulean-bridge opens it; old hv-* scenes retired) | yes |
| gn.07–gn.62 | not started | |
| gn.new.01–38 | not started | |

## Limits (documented)
- gn.06 "a later run finds a signpost": cross-run memory is not allowed (Kice 2026-11-14), so a later bridge in the same run shows the sign and the village stall instead.

## Fixes found on the way
- Placement data: the placer reads `tags` as stage needs, so the doc's category labels now go to `kinds`, `needs` become `tags` ("cave|high" = either; `core/co/placement.ts` tagHolds), and the key event's own beat gives its step and stage. Before this no Greenneedle event was ever placed.

## Still to do
- Files 2–13 of the pack (gn.06–62; reconcile gn.13–16), then the 38 new events.
- gn.new.09 The Last Stop: when the Dusknoir punches the ticket set flag `last-stop-ticket` = 1 and start node timer `{ kind: 'flag', key: 'ovt-last-stop', amount: 0 }` (pairs with families-b row 3). Any scene that loses a Pokémon for good sets flag `lost-mon`.
- Tell the legends thread about `eventBattleLost` now using `choiceAt` and the `remembers` walk in `pseudo.ts`; tell the Kanto canon thread about retired ids (`pp-rematch-exceptional`).
- Samurai Slash power 70 → 60.
- Update fragment `docs/updates/catalog-overhaul/greenneedle.md`, Playwright spec, `npm run check`, mark PR ready.
