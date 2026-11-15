# Catalog Overhaul: places (row 5) — status

Category "places": STORY_FAMILIES_14 (the Delves), _15 (reworks and run events), _17 (merged places).
Branch `claude/project-thread-lv5u1c`, PR into the shared branch `ui-mockups` (the batch lead merges it).

## State (2026-11-15)
- All 421 ledger ids closed: 391 built, 30 merged (`tools/catalog-overhaul/places-closeout.json`), 69 extra ids. Status: `src/data/catalogOverhaul/status/places.json` (`node tools/catalog-overhaul/places-status.ts`).
- Files: `tools/events/co/places-1.ts` .. `places-17.ts` (built to `src/data/events/co-places-N.json`), chains in `src/data/catalogOverhaul/pseudo/places.json`, hand-off flags in `src/data/catalogOverhaul/flags/places.json`.
- Engine pieces: `typeShift`, Devon ball (`weakened` rule), `src/core/co/placesRules.ts` (Bond vow, `sendAway`/`bringBack`, `stopWeight`, `bossLeadStages`), `upgradeItem`, opt-in challenge weeks (`optIn` on game events; `tempEffect` with a run rule ends with the region), heated moments (`heated` drama events, `noteHeatedMoment`), `replacedBy` on legendary events, raid `power-spot-eruption`.
- No placement file: STORY_FAMILIES_14/15/17 give no placement blocks, so events keep their old placement (new ids carry their own).
- Every event fight outside a pseudo-stage is `friendly` (unit test in `tests/unit/coPlaces.test.ts`).
- Retired: old dungeons ancient-ruin-steps, ancient-ruins, haunted-mansion, forgotten-lab (merged), treasure-dig (into the expedition).

## Re-read log
| Ids | Doc section | Checked |
|---|---|---|
| delve-gate-*, dg-* (12 Delves), Celestial Observatory | STORY_FAMILIES_14 | 2026-11-15 |
| crystal-hollow-*, deliver-*, winter set, reputation scenes | STORY_FAMILIES_15 SF93, SF95, SF96, SF101 | 2026-11-15 |
| SF102 standalone choices, Pacts | STORY_FAMILIES_15 SF102 | 2026-11-15 |
| relics, calendar criers, challenge boards | STORY_FAMILIES_17 SF94, SF97, SF98 | 2026-11-15 |
| legend-*, heated moments | STORY_FAMILIES_17 SF99, SF100 | 2026-11-15 |
| Safari, Frontier, Exhibition, Lost Island | STORY_FAMILIES_17 SF113-SF116 | 2026-11-15 |
| S.S. Anne, Mansion, Detective, ferries, Day-Care, Egg | STORY_FAMILIES_17 SF117-SF122 | 2026-11-15 |
| weather, Lab, auctions, fishing, hazards, volunteers | STORY_FAMILIES_17 SF123-SF128 | 2026-11-15 |
| single merges (70 ids) | STORY_FAMILIES_17 SF129 | 2026-11-15 |

## Known limits (approximations of the pack)
- "Ambushes x2" uses `stopWeight`; the Pact booth's "Trainers +2" uses `enemyLevelOffset`; the tide crown uses `firstMoveSure`; the tide seed's sea hazards and heat-battle growth are not counted.
- Calendar weeks: the rarity step uses `typeEncounterWeight`; several "Join in" bonuses are close approximations. Challenge weeks last the region; Only Unevolved does not limit who battles; Giant Week uses `enemyLevelOffset`; No Revival gives Bond to the whole party.
- Heated moments: the 6% gate is not applied (the caps are).
- SF99: the Evil Team "A Legend Stirs" gate is skipped (SF13 is another row).
- Safari has no Safari Ball item; the Frontier's "No items" is not enforced; the Kyogre/Groudon sign is a 50/50 roll; the Redo Ticket keeps the old 30% survival chance.
- SF129: the Cartographer reveals the stage's stops (not a whole region map); the challengers use existing fight rules (no switching, no items, hidden foe) for SF72; Alpha rules use Ultra Aura; homes owned by other rows get a flag, not the full questline (ghost ship, last stop, Mirror Lake, Little League, Ranger Mission, Taken Egg, Smuggling Ring, Delta habitat, defector arc).
- `tests/unit/story.test.ts` fingerprints and `tools/content-baseline.json` are re-pinned at rebase, never hand-merged.
