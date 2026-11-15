# Catalog Overhaul Pack: foundation and the lead category

Source: `/mnt/project-files/catalog_overhaul_pack/` (Kice, 2026-11-14). Plan: `/mnt/project-files/plans/catalog-overhaul/PLAN.md`. Guide: `docs/catalog-overhaul.md`.

- Foundation: ledger of all 2,821 catalog ids with verdict, doc and owning category (`src/data/catalogOverhaul/ledger.json`), snapshot of where each old event sat (`oldPlacement.json`), build tool (`npm run co:build`), progress (`npm run co:status`), gate (`tests/unit/catalogOverhaul.test.ts`).
- Loader (`src/data/index.ts`): a `co-*.json` event replaces any event with the same id; ids in a co file's `remove` list stay in the data with `disabled: true` (never drawn, still loadable by a saved run).
- Kice's rules for this pack: same-run memory is allowed in full, nothing carries to another run; no Keepsakes, Souvenirs or Shards; 10 heals and 6 revives stay; Evil Mode is on hold ("DO NOT BUILD EVIL MODE YET", 2026-11-14).
- Scrapped: the 45 SCRAP ids are retired (`tools/events/co/lead-scrapped.ts`).
- Save: none.

## Re-read table
| Catalog ids | Doc and section | Checked |
|---|---|---|
| 45 SCRAP ids (`wx-fallen-bridge`, `youngsters-shorts`, 43 `ovc-*-s1` vignettes) | `CATALOG_LEDGER.md`, every row with verdict SCRAP (45 rows, matches the ledger's own count); none has a later stage in the game | 2026-11-14 |

## Limits
- The pack's placement shapes (home step, window, level offsets) are not in core yet: next slice of this thread.
