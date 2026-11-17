# Catalog Overhaul Pack: foundation and the lead category

Source: `/mnt/project-files/catalog_overhaul_pack/` (Kice, 2026-11-14). Plan: `/mnt/project-files/plans/catalog-overhaul/PLAN.md`. Guide: `docs/catalog-overhaul.md`.

- Foundation: ledger of all 2,821 catalog ids with verdict, doc and owning category (`src/data/catalogOverhaul/ledger.json`), snapshot of where each old event sat (`oldPlacement.json`), build tool (`npm run co:build`), progress (`npm run co:status`), gate (`tests/unit/catalogOverhaul.test.ts`).
- Loader (`src/data/index.ts`): a `co-*.json` event replaces any event with the same id; ids in a co file's `remove` list stay in the data with `disabled: true` (never drawn, still loadable by a saved run).
- Kice's rules for this pack: same-run memory is allowed in full, nothing carries to another run; no Keepsakes, Souvenirs or Shards; 10 heals and 6 revives stay; Evil Mode is on hold ("DO NOT BUILD EVIL MODE YET", 2026-11-14).
- Scrapped: the 45 SCRAP ids are retired (`tools/events/co/lead-scrapped.ts`).
- Map placement (`src/core/co/placement.ts`, `src/core/co/attach.ts`): the pack's placement blocks from `src/data/catalogOverhaul/placement/<category>.json` put events on their step: must-see, optional, side branch, + node, Door, before or instead of the battle, tags (incl. tide), level offsets, budget, same-stage beats placed when earned. Tests: `coPlacement.test.ts` (23), `coAttach.test.ts` (6).
- Shared engine pieces from other threads pulled in so every thread rebases onto one base: new-events (takeNode, Bond selectors), people (region stamps, friendly fights, foeMoves, seeAgain), families-c (text tokens, record, rule prize, pick test), anime (flagAge, partyLine, laterEvent), families-b (pick memory, branches, lead type).
- Save: none (hold state and costs live in run counters).

## Re-read table
| Catalog ids | Doc and section | Checked |
|---|---|---|
| Placement rules | `STAGE_MAP_AND_PLACEMENT.md` sections 2 to 8, `PLACEMENT_ON_THE_MAP.md` sections 2 to 6: every line of the placement block, the three ways an event sits, budget, collision order, attach modes, rests, badges, tags | 2026-11-15 |
| 45 SCRAP ids (`wx-fallen-bridge`, `youngsters-shorts`, 43 `ovc-*-s1` vignettes) | `CATALOG_LEDGER.md`, every row with verdict SCRAP (45 rows, matches the ledger's own count); none has a later stage in the game | 2026-11-14 |

## Limits
- Town and Hub nodes do not exist yet: `attaches: "town"` events sit on their written step (the pack says so: "until towns exist: Step N"), and the Town's own four-event budget is not counted.
- Run-Long beats (one per region at Stage 3's Town) and Companion turning points use the shape's must-see marking but take their stage from `requires`/`stages` written by the owning thread; the placer does not count "two stages on" by itself (use `flagAge`).
- "Events on one route: 3 to 5" is a target, not enforced; the base game's own event stops still fill the rest of the stage.
- The rival slot (one rival beat a stage, steps 3 to 18) is the rivals thread's; the placer only keeps hard battles apart.
- When the Mach Bike rides past a wild node, a "before" or "instead" event there stays as an ordinary stop beside the node (there is no battle for it to come before).
