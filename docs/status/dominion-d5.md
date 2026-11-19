- **DOMINION slice D5, "the HQ"** (Evil Mode rework, 2026-11-19; build plan `/mnt/project-files/plans/evil-mode-rework/BUILD_SLICES.md`, design Part 3 §3, Part 6 §3, Part 9 A21-A22): the HQ menu (mockup 6). Press B on the HQ (or click the building) to see the HQ drawn as a cut-open building with its rooms. From there the player buys rooms, upgrades the HQ, launders money, borrows from a Fence and views their buildings.

## What's built
- **Data** (validated with Zod in `schema.ts`, loaded in `data.ts`):
  - `src/data/dominion/hq.json`: the six HQ levels (Warehouse, Hideout, Compound, Fortress, Tower, Citadel) with cost, level cap, crew cap, room slots, Defense and what each needs; the 8 building tiers; every money rule (upkeep, sell and rebuild 60%, loans, laundering); the menu keys and the icons.
  - `src/data/dominion/buildings.json`: all 266 buildings from `lists/buildings.md` and `lists/buildings-pokemon-and-grunt.md`, plus Part 3's six extras. Made by `tools/dominion/buildings-to-json.py` (run it again if the lists change). Part 3's names win where the list differs (Training Room, Research Lab, Treasury, Operations Room).
- **Rules** in `src/core/dominion/`:
  - `hq.ts`: slots, storage, Defense, the crew cap, Upgrade (clean money only, 3 days, Defense halved meanwhile), Buy Room (ready the next morning), tier up, sell, rebuild, wear, buildings outside the HQ in held districts, laundering, loans and repaying, letting a member go, going broke (A22), and the nightly and weekly HQ World Turn step.
  - `hqFx.ts`: what working rooms add (actions, XP, recruiting, Heat, income, safe money and more), and clean vs dirty money (A21). All spending now goes through `spend()`, which takes dirty money first.
  - `hqScreens.ts`: view models for the HQ menu, View Assets and Money.
  - 13 actions that waited on a room now play once the room is built (heists, scams, Study, Launder and more). Tasks Study and Count the Take are now live.
- **Screens**:
  - `src/ui/redux/screens/dominion/hq.ts` draws mockup 6: the building, room grid, blueprint in the empty slot, yard, fence and Houndour guards from Lv. 3, searchlight, the Next Level panel and the Build a Room list; plus the View Assets and Money overlays.
  - `src/scenes/dominion/hqController.ts` keeps the cursors; DominionScene only forwards to it.
  - Keys: B opens it; arrows and Enter buy; ◀ ▶ picks the district for an outside building; U upgrade, H hire, M manage team, A View Assets (U/S/R inside it), L Money, Esc leave. L does not open the interaction log on this screen (Shift+L still does). A and S no longer also count as moves there.
  - 8 new pictures in `public/assets/images/dominion/` (see PROVENANCE.md).
  - Round-3 look (`mockups-v3`, screen 6): the CSS is ported again with `tools/dominion/port-mockup-css.py` (gold seams, medallion icons, Nova damask, striped meters, orbiting spark, panels rising in), and the HQ menu adds the screen's haze, bokeh, stars, colour grade, edge glow, sky searchlights, gold frame, and the spotlight, sunburst and glints on the blueprint. All of it stops with the game's animation setting.
  - Port tool fixes: `cubic-bezier(...)` in an animation no longer gets a `dm-` prefix, `@property` is kept unscoped (it broke the build), and the entrance delay counts from the first draw so a redraw doesn't replay it.

## Saves
- No block bump. `hq` is a new optional field on the D2 block (v2); a save without it gets an empty Warehouse.

## Lists: how much is in
- Buildings: 266 of 266 in the data. 65 are live (45 supported, 20 limited with a note), 201 are disabled. The disabled ones name the slice that turns them on: D9 47, D10 26, D4 17, D6 14, D15 6, D8 4, D13 2, D16 2, D11 1, D14 1, and 81 are marked "later" (no slice named yet).
- Field actions: 45 played (was 32). The rest still name their slice.
- Crew tasks: 33 live (was 31).

## Tests
- `tests/unit/dominionHq.test.ts`: 26 tests (data, build, upgrade, tiers, sell, rebuild, upkeep, broke, loans, laundering, outside buildings, failure cases, save and reload).
- `tests/e2e/dominionHq.spec.ts`: opens the HQ menu, is refused a too-dear room, builds a Bunk Room, opens View Assets and Money, passes the night (room ready, crew cap 5), draws a Lv. 3 Compound at 1280x720, 960x540 and 800x600, and reloads. Passed 4 runs in a row.
- Typecheck, build, content gate and asset report pass; all 114 Dominion and content unit tests pass. All 6 Dominion browser tests pass (the Crew spec now waits 200 ms after closing the hire list, like the HQ spec, because a key pressed straight after can be dropped). The full unit suite is left to CI (it takes over 50 minutes here).

## Limits (by plan)
- "A Gym taken or beaten" (Lv. 4) waits for D10, and "Feared" (Lv. 6) waits for D6. Until then the HQ stops at Lv. 3 (Lv. 5 also needs an Admin).
- Raids on the HQ (Defense in a fight) wait for D9.
- Regions reached is fixed at 1 until the region slices.
- Snag Desk and Shadow Lab wait for D16.
