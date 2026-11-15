# Catalog Overhaul: families-b (row 3), STORY_FAMILIES_6.md

**Paused 2026-11-15 (Kice: five threads at a time).** Work in progress on branch `claude/project-thread-795gak`.

## Where it stopped
- Built (co files `tools/events/co/families-b-1..7.ts`, JSON in `src/data/events/co-families-b-*.json`):
  - SF31 to SF41: six Doors (SF31, 34, 36, 37, 39, 40), singles SF32, SF33, SF35, SF38, the eight SF41 Stage-Three chains.
  - Road chains (STORY_FAMILIES_6 "Covers"): 26 two-step callbacks, 8 honest trades, 9 single scenes, 26 three-step Miniature Episodes, The Last Train (FE8).
- Status: `src/data/catalogOverhaul/status/families-b.json` (202 built, 17 merged). Placement: `src/data/catalogOverhaul/placement/families-b.json` (188 entries).
- Engine pieces: choice `branches`, picked-Pokémon memory, `leadType`/`picked`/`itemAny` conditions, `loseItem.from`, `every` match, captain's compass reveal, passed-by species (Mirror Lake), `join.recall`/`uncaught`.

## Still to do
- Re-read pass of each SF section and road chain against the pack; fill the table below with dates.
- flags/families-b.json; update fragment docs/updates/catalog-overhaul/families-b.md.
- Unit test for the category; one browser spec (New UI, resultGate extra Enter); npm run check; PR into ui-mockups.
- 100 owned ids left live, waiting on other rows:
  - 60 ovc-legend-* and the Tellings (strange-researcher, fallen-star, wishing-comet, star-compass, sky-whale): legends (rule names asked).
  - ovc-rival-note, ovc-rival-gift: rivals.
  - 21 anime ids: anime says each ovc-<name>-s1 merges into an12-paper-city, an13-ice-library, an14-thousand-lanterns, an15-mushroom-queen, an16-ember-pilgrim, an17-hundred-year-egg, an18-friend-you-didnt-make; s2/s3 ids to come. Add to REMOVE + merged once those events are on this branch.
- Greenneedle asked to set `last-stop-ticket` and `ovt-last-stop` in The Last Stop (Last Train needs them).

## Known limits
- "Next run" outcomes (circus returning, lighthouse revisit, fox gift) are same-run callbacks (no cross-run memory).
- Circus hat is a flag plus a journal line. Bell for Ultra Beast Tears is flag `city-bell` (legends must read it).
- Honest trades show both sides in text; the markets Honest Trade Card view is not wired yet.
- Strange Footprints' Alpha is a strong wild battle; legends' Alpha battle is not merged yet.
- Lighthouse letters readable in the hub: not built.

## Re-read table
| id | doc section | date checked |
|---|---|---|
| (pending) | | |
