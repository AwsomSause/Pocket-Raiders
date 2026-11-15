# Catalog Overhaul row 17: new events (NE1 to NE100) and Pokémon Moments

Branch `claude/project-thread-d4o6wo` (into `ui-mockups`). Thread: "Build 100 new events and Pokémon moments".

## PAUSED 2026-11-15 12:20 UTC (Kice: only five threads at a time). Where I stopped
- Pushed: engine batch 1 (takeNode, Bond selectors), batch 2 (`src/core/co/neRules.ts`), quirks (`src/core/co/quirks.ts`, run save **v44**, claimed in STANDARDS.md), cherry-picks of people 09d5391e, families-c e243e9ca, anime d8c1cd0e, families-b 079ac3e0.
- Part 1 (NE1 to NE25): `tools/events/co/new-events-1.ts` built and passing `catalogOverhaul.test.ts` and `coNewEvents.test.ts`. An independent re-read found about 25 gaps: list in `co-new-events-part1-reread.md` (same folder). **Next: fix those.**
- Parts 2 to 4: full first drafts saved as `tools/events/co/_wip-new-events-2.ts`, `_wip-new-events-3.ts` (NE61-65 trades not started), `_wip-new-events-4.ts` (underscore = not built). Never built or tested. Notes per part: `co-new-events-part2-wip.md`, `-part3-wip.md`, `-part4-wip.md`. **Next: rename, build, fix, re-read each against its doc.**
- **Next on resume, first:** rebase onto the lead's foundation `claude/project-thread-0hal24` (PR #1316). The lead changed the friendship effect to `bond: N` (pack points) and DSL `bondUp` now emits `{ kind: 'friendship', bond: N, who }`; drop my duplicates of ce0a5c9a in the rebase.
- Still to do after that: placement file, status file (`extra`), flags file, item batch, Pokémon Moments to POKEMON_MOMENTS.md, one browser spec, `npm run check`, PR.

## Re-read table
| Part | Doc | Built | Re-read | Result |
|---|---|---|---|---|
| 1 | NEW_EVENTS_1.md NE1-NE25 | 2026-11-15 | 2026-11-15 (independent) | gaps listed, fixing |
| 2 | NEW_EVENTS_2.md NE26-NE50 | in progress | | |
| 3 | NEW_EVENTS_3.md NE51-NE75 | in progress | | |
| 4 | NEW_EVENTS_4.md NE76-NE100 | in progress | | |

## Decisions so far (for Kice)
- Cosmetic keepsakes from the scripts (feather, drawing, photo...) are run flags plus text, since Keepsakes/Souvenirs stay cut.
- Pack "Save" flags and anything carried to a later run are not built (same-run memory only).
- No old-man / gentleman trainer art exists, so those scenes show no figure (art needed).
- Delta Roselia in the game is Dark/Fairy; NE7's script describes an Ice/Grass one that makes frost. Kept the game's species; flagged for Kice.
- NE16's "promise broken" version is its own small scene (`ne16-only-the-note`), because every base choice needs the light.
