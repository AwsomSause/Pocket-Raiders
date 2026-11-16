# Catalog Overhaul: families-b (row 3), STORY_FAMILIES_6.md

Branch `claude/project-thread-795gak` (resumed 2026-11-16 in batch 3; PR into ui-mockups, the lead combines it).

## What is built
- Built (co files `tools/events/co/families-b-1..7.ts`, JSON in `src/data/events/co-families-b-*.json`):
  - SF31 to SF41: six Doors (SF31, 34, 36, 37, 39, 40), singles SF32, SF33, SF35, SF38, the eight SF41 Stage-Three chains.
  - Road chains (STORY_FAMILIES_6 "Covers"): 26 two-step callbacks, 8 honest trades, 9 single scenes, 26 three-step Miniature Episodes, The Last Train (FE8).
- Status: `src/data/catalogOverhaul/status/families-b.json` (202 built, 21 merged, 75 rule). Placement: `src/data/catalogOverhaul/placement/families-b.json` (188 entries).
- Engine pieces: choice `branches`, picked-Pokémon memory, `leadType`/`picked`/`itemAny` conditions, `loseItem.from`, `every` match, captain's compass reveal, passed-by species (Mirror Lake), `join.recall`/`uncaught`.

## Still to do
- Retired 2026-11-16: 75 legend and Telling chain steps (rule, legends PR #1326); ovc-rival-note and ovc-rival-gift (merged into rival-map-note, rival-trap-gift).
- 21 owned ids left live, waiting on anime:
  - 21 anime ids: anime says each ovc-<name>-s1 merges into an12-paper-city, an13-ice-library, an14-thousand-lanterns, an15-mushroom-queen, an16-ember-pilgrim, an17-hundred-year-egg, an18-friend-you-didnt-make; s2/s3 ids to come. Add to REMOVE + merged once those events are on this branch.
- Greenneedle asked to set `last-stop-ticket` and `ovt-last-stop` in The Last Stop (Last Train needs them).

## Known limits
- "Next run" outcomes (circus returning, lighthouse revisit, fox gift) are same-run callbacks (no cross-run memory).
- Circus hat is a flag plus a journal line. Bell for Ultra Beast Tears is flag `city-bell` (legends must read it).
- Honest trades show both sides in text; the markets Honest Trade Card view is not wired yet.
- Strange Footprints' Alpha is a strong wild battle; legends' Alpha battle is not merged yet.
- Lighthouse letters readable in the hub: not built.

## Re-read table
| ids | doc section | date checked |
|---|---|---|
| ev-abandoned-expedition, lost-expedition-camp, lost-expedition-cache, ovc-lost-expedition-s2, -s3, fb-valley-egg | SF31 The Lost Expedition | 2026-11-16 |
| ev-pokemon-migration | SF32 The One Far From Home | 2026-11-16 |
| lighthouse, fb-harbour-island, fb-harbour-return | SF33 The Light at the Harbour | 2026-11-16 |
| lighthouse-entrance, lighthouse-1, -2, -final, fb-lighthouse-farewell, ovc-the-lighthouse-that-remembers-s1 | SF34 The Sunken Lighthouse | 2026-11-16 |
| old-foe-returns, fb-foe-stalks, fb-foe-after | SF35 The One That Beat You | 2026-11-16 |
| quarry-entrance, quarry-1, -2, -final, fb-quarry-after | SF36 The Old Quarry | 2026-11-16 |
| w4-dive, w4-dive-1, dz-dive-wreck, w4-dive-2, fb-chest-surface | SF37 The Captain's Chest | 2026-11-16 |
| w4-night-watch, fb-watch-dawn, fb-watch-again | SF38 Who Keeps Watch | 2026-11-16 |
| whispering-grove-entrance, -1, -2, -final | SF39 The Whispering Grove | 2026-11-16 |
| windswept-spire-entrance, -1, -2, -final | SF40 The Windswept Spire | 2026-11-16 |
| ovc-tide-lock-s1..s3, fb-city-low-tide; ovc-singing-whale; ovc-stone-giant; ovc-glass-forest; ovc-quiet-shrine-keeper, fb-fox-gift; ovc-midnight-circus, fb-circus-again; ovc-mirror-lake; ovc-the-day-everything-slept | SF41.1 to SF41.8 | 2026-11-16 |
| 26 two-step road chains (ovc-roadside-stand ... ovc-collector-request) | Ledger rows, REVISE "Two-step callbacks" | 2026-11-16 |
| 8 trades (ovc-swap-meet ... ovc-bug-contest), 9 single scenes (ovc-rain-shelter ... ovc-broken-machine) | Ledger rows, TRADE and REVISE "Single scenes" | 2026-11-16 |
| 26 Miniature Episodes (ovc-long-letter ... ovc-the-long-night-at-the-inn) | Ledger rows, QUESTLINE | 2026-11-16 |
| ovc-last-train-s1, fb-last-train-carriage | QUESTLINES_DEEPENED_1.md FE8 | 2026-11-16 |

Re-read method: every `**Choices.**` line of STORY_FAMILIES_6.md (58 lines) checked against the built choice labels (all present); Remembers lines and rewards read by hand; tests/unit/coFamiliesB.test.ts checks the writing rules.
