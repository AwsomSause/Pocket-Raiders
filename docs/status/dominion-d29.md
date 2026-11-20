# Dominion D29: the Assign and District pages

Plan: BUILD_SLICES.md row D29. Mockups: `plans/evil-mode-rework/mockups-v4/` m3 (Assign a task) and m4 (District file), source `src/i1.py`.

## What the player can do
- **Assign a task** (m3, out of the Morning): picking a task on the Morning's Assign Task panel (click, or ▼ then Enter) opens its own page. The member stands on the left with a line in their own voice, rank, green or trait, armband, Loyalty, Skill and the stat the picked task uses; below, the personality that is forming (temperament? and their record) or the trait they have. The tasks are big cards: odds, pay, Heat, the stat it uses and its risk, a BEST FIT ribbon on the open task with the best real odds, ON IT on the member's current task, greyed with D3's reason when locked. The rest of the crew is on the right. ◀ ▶ switch member, ▲ ▼ walk the cards, M the full list (six to a page, page number shown), P the district for a district task, Enter (or a second click, or the button) **Give the order**, Esc or tab 1 back to the Morning. The top bar's last cell says "You are here: Morning › Assign"; the Roster tab is lit.
- **District file** (m4, out of the Region Map): Enter on the map (or a click on the map's file panel) opens the district under the cursor. Skyline behind; dials for Your control, Heat here and the rival's grip, with how far to Held (or how to keep it), Regard and Dread; the stamp (Outsider, Foothold, Held...); a red banner when the Hero is in town (once met or tracked), a patrol or a checkpoint; the targets as cards with what the picked action pays there, the owner's temper and the guard; the page's nine actions in Money, Muscle and Shadow columns with number keys 1-9 (a second press opens the Card), arrows walk the columns, T the next target, [ ] the page (later pages name their section). Enter opens the Card; Esc on the Card and the act's result both come back here. Esc goes back to the map. Key strip: breadcrumb "Region Map › Cerulean", Q Wheel, Esc Back.

## How it's built
- `src/core/dominion/assignScreen.ts` (`assignModel`, `assignCount`, `assignTaskAt`): same task list, odds and lock reasons as the Morning (`taskOdds`, `taskLabel`, `withPlace` now exported from `crewScreens.ts`). Pay = the task's `effect.funds`, else its first level's yield; Heat = `effect.heat`.
- `src/core/dominion/districtScreen.ts` (`districtModel`, `districtOrder`, `groupOf`): built on `mapModel` with the same `MapCursor`, so the Card and `act` are D2's. Target pay lines come from `cardModel` for the picked action.
- Groups are data: `field.json` `file` (groups, list section to group, `byAction` overrides Take and Catch into Money so the starting nine read 3/3/3 like the mockup, action and target icons, the page's words), checked by `FieldFileSchema`.
- Screens `src/ui/redux/screens/dominion/assign.ts` and `district.ts`; the crew controller owns `assign`, DominionScene owns `district` (acts `asTask`, `asGive`, `asAll`, `asWhere`, `asMember`, `asFlip`, `asOver`; `dfile`, `dfAct`, `dfTarget`, `dfPage`, `dfCard`).
- The Morning and the map keep their v4 layouts (s2, s3 are unchanged in round 4). The map's grid, CTA and Card still work as before; only Enter with the map focused now opens the file (the grid's own Enter still opens the Card).
- No rule change, no new RNG stream, no block or save bump.

## Tests
- `tests/unit/dominionPages.test.ts` (12): every action section has a group, icons exist, the starting nine order, every page keyed 1-n once; the District file matches the map's numbers, stamp and CTA, Held line, Hero banner, unknown district falls back, reading changes nothing; Assign cards match the Morning's odds, Best fit rule, pay/Heat/stat/risk from tasks.json, the full list's paging and out of range, the order is D3's assign step.
- `tests/e2e/dominionPages.spec.ts`: both pages by keys and clicks, three window sizes, no console errors. `dominionCrew.spec.ts` now gives Rook's order through the Assign page.

## Known limits
- The Assign page has no "time a task takes" line (m3 shows one): crew tasks have no duration in the data; the card shows the stat used and the risk instead.
- m3's "free/busy" labels: every member always has a task, so the crew strip shows each one's task.
- Esc on the Assign page goes to the Morning (D27's Boss Menu is reached from there).
