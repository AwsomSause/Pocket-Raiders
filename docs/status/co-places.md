# Catalog Overhaul: places (row 5) — status

Category "places": STORY_FAMILIES_14 (the Delves), _15 (reworks and run events), _17 (merged places).
Branch `claude/project-thread-lv5u1c`, PRs go into the shared branch `ui-mockups`.

## Where I stopped (2026-11-15, paused by the coordinator: five threads at a time)
- Built and pushed: `places-1`..`places-4` (12 Delves + Celestial Observatory as drawn pseudo-stages),
  `places-5` (SF93 Crystal Hollow, SF95 Deliveries, SF96 Winter Set, SF101 Reputation scenes),
  `places-6` (SF102 Standalone Choices, part 1: Swordbert and Shieldbert through the Cursola reef, with their later scenes).
- Engine pieces in this branch: `typeShift` effect and Devon ball (`weakened` rule); `src/core/co/placesRules.ts`
  (Bond vow, `sendAway`/`bringBack`, `stopWeight` and `bossLeadStages` modifiers); raid `power-spot-eruption`.
- Cherry-picked shared pieces: people 09d5391e + ffad393d, anime d8c1cd0e + 25f24b40 (drop on rebase once they land in `ui-mockups`).
- Next when resumed: `places-7` = SF102 part 2 (bond-ceremony .. cursed-treasure, two-visitors uses `sendAway shadow` +
  `bringBack purify`) and the six Pacts; unit tests for placesRules; then SF94, SF97-SF100, STORY_FAMILIES_17,
  placement file, flags list (`for` entries: sign-zacian, sign-zamazenta, readings-capped/erupts, evil-ambush, intel...),
  this re-read table, update notes, browser spec, `npm run check`, PR.
- Known: `tests/unit/story.test.ts` fingerprint is red from the new events; re-pin at rebase (never by hand-merge).

## Re-read log
| Ids | Doc section | Checked |
|---|---|---|
| delve-gate-*, dg-* (12 Delves) | STORY_FAMILIES_14 | 2026-11-15 |
| Celestial Observatory | STORY_FAMILIES_14 (Deoxys Telling) | 2026-11-15 |
| crystal-hollow-*, deliver-*, delivery-rider*, winter set, circuit-fans, merchant-remembers | STORY_FAMILIES_15 SF93, SF95, SF96, SF101 | 2026-11-15 |
