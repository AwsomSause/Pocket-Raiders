# Catalog Overhaul: rivals (row 12)

Rival questlines R1 to R24 from `QUESTLINES_RIVALS.md` and `RIVALS_PLACED.md`, plus the rival system notes they lean on.
Scenes: `tools/events/co/rivals-1.ts` to `rivals-7.ts` (`npm run co:build -- rivals-N`). Schedule: `src/data/rivalQuests.json`.
Engine: `src/core/rivals/questlines.ts`. Status: `src/data/catalogOverhaul/status/rivals.json`. Flags: `src/data/catalogOverhaul/flags/rivals.json`.

## Re-read log (each doc section re-read after its file was built, differences fixed)

| Catalog id | Bucket | Doc | Line | Checked |
| --- | --- | --- | --- | --- |
| `rival-gauntlet-entry` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R1 | R1 The Circuit | 2026-11-15 |
| `ev-rival-rematch` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R1 | R1 The Circuit | 2026-11-15 |
| `rival-one-turn-duel` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R1 | R1 The Circuit | 2026-11-15 |
| `living-rival-rescue` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R2 | R2 A Rival in Trouble | 2026-11-15 |
| `living-rival-returns-favor` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R2 | R2 A Rival in Trouble | 2026-11-15 |
| `rival-asks-help-grudge` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R2 | R2 A Rival in Trouble | 2026-11-15 |
| `ev-rival-emergency` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R2 | R2 A Rival in Trouble | 2026-11-15 |
| `living-rival-promise` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R3 | R3 The Promise Past the Ridge | 2026-11-15 |
| `living-rival-montage` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R3 | R3 The Promise Past the Ridge | 2026-11-15 |
| `ev-rival-sighted` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R3 | R3 The Promise Past the Ridge | 2026-11-15 |
| `living-rival-promise-kept` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R3 | R3 The Promise Past the Ridge | 2026-11-15 |
| `rival-map-note` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R3 | R3 The Promise Past the Ridge | 2026-11-15 |
| `rival-memorial` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R4 | R4 The Stone on the Hill | 2026-11-15 |
| `rival-mentor-appears` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R5 | R5 Their Mentor Comes Calling | 2026-11-15 |
| `rival-coaching` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R6 | R6 The Post-Mortem | 2026-11-15 |
| `rival-asks-advice` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R6 | R6 The Post-Mortem | 2026-11-15 |
| `rival-text-support` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R6 | R6 The Post-Mortem | 2026-11-15 |
| `rival-text-taunt` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R6 | R6 The Post-Mortem | 2026-11-15 |
| `rival-cosplay` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R7 | R7 Wearing Each Other's Colours | 2026-11-15 |
| `rival-swap` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R7 | R7 Wearing Each Other's Colours | 2026-11-15 |
| `rival-mind-games` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R8 | R8 The Fake Lead | 2026-11-15 |
| `rival-eavesdrop` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R8 | R8 The Fake Lead | 2026-11-15 |
| `living-rival-acknowledges-rival` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R8 | R8 The Fake Lead | 2026-11-15 |
| `living-rival-bad-day` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R9 | R9 A Rival's Bad Day | 2026-11-15 |
| `living-rival-photo-rival` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R10 | R10 Three Photographs | 2026-11-15 |
| `living-rival-photo-between` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R10 | R10 Three Photographs | 2026-11-15 |
| `living-rival-photo-friend` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R10 | R10 Three Photographs | 2026-11-15 |
| `rival-feud` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R11 | R11 Two Rivals, One Argument | 2026-11-15 |
| `w4-wandering-trainer` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R13 | R13 The One Who Follows | 2026-11-15 |
| `w4-wanderer-visit` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R13 | R13 The One Who Follows | 2026-11-15 |
| `w4-wanderer-challenge` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R13 | R13 The One Who Follows | 2026-11-15 |
| `rival-buyout` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R14 | R14 Emptied Shelves | 2026-11-15 |
| `rival-care-package` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R14 | R14 Emptied Shelves | 2026-11-15 |
| `rival-trap-gift` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R15 | R15 A Gift You Should Question | 2026-11-15 |
| `rival-mon-greeting` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R20 | R20 Greetings Between Teams | 2026-11-15 |
| `rival-shared-drink` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R22 | R22 One for the Road | 2026-11-15 |
| `rival-race` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R23 | R23 The Race for First Pick (pseudo-stage) | 2026-11-15 |
| `rival-nickname` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R24 | R24 What They Call You | 2026-11-15 |
| `living-rival-acknowledges` | built | QUESTLINES_RIVALS.md / RIVALS_PLACED.md R24 | R24 What They Call You (the real name) | 2026-11-15 |
| `rival-rematch` | merged into `ev-rival-rematch` | CATALOG_INDEX.md | | 2026-11-15 |
| `living-gauntlet-rest` | merged into `rival-gauntlet-entry` | CATALOG_INDEX.md | | 2026-11-15 |
| `rival-asks-help` | merged into `living-rival-rescue` | CATALOG_INDEX.md | | 2026-11-15 |
| `rival-asks-help-repaid` | merged into `living-rival-returns-favor` | CATALOG_INDEX.md | | 2026-11-15 |
| `rival-promise-make` | merged into `living-rival-promise` | CATALOG_INDEX.md | | 2026-11-15 |
| `rival-promise-kept` | merged into `living-rival-promise-kept` | CATALOG_INDEX.md | | 2026-11-15 |
| `living-rival-clash` | merged into `rival-swap` | CATALOG_INDEX.md | | 2026-11-15 |
| `rival-pair-setup` | merged into `rival-feud` | CATALOG_INDEX.md | | 2026-11-15 |
| `rival-gift` | merged into `rival-trap-gift` | CATALOG_INDEX.md | | 2026-11-15 |
| `rival-gauntlet-week` | rule | QUESTLINES_RIVALS.md R1 | R1 The Circuit: the gauntlet is the Circuit ladder (rival-gauntlet-entry) | 2026-11-15 |
| `living-rival-clash-retired` | scrapped (cross-run) | CATALOG_LEDGER.md | Run memory rule | 2026-11-15 |

Not rebuilt, kept live as they are (the pack gives only the one-line catalog entry, which the event already matches):
`ev-rivals-victory`, `ev-rivals-defeat`, `rival-gloat`, `rival-grudge-spot`, `rival-berry-boss`, `rival-views`.
R17 The Pen Pal is SF6 (`STORY_FAMILIES_1.md`, families thread); R17 adds nothing of its own here.

## Known limits

- Questline stops are placed when a stage starts, on a hashed node, not on the exact Step the doc names. R13 and R16's later meetings use stops further along the map (`ahead`) where the doc gives steps.
- R8: the signpost's "long path" is text only.
- R10: the three photos are chosen by Friendship and Respect thresholds.
- R11: the Rival Report entries and the Final Reunion are folded into the finale's end scene.
- R12, R13, R16: anything the doc carries to a later run is replaced by a scene next region in the same run (Kice: memory only within one run).
- R13: the Stranger becomes a secondary rival through scenes; they are not a registered rival.
- R15: the climax outcomes are flags (`rival-told-sponsor`, `rival-sponsor-denied`, `rival-sponsor-silent`) for the Evil Team climax to read.
- R16: the Wants to Stop meter is the `calm` battle rule: each turn Kieran's Pokémon takes no damage fills it; 3 ends the fight. It shows as a battle line, not a bar. The stall choice needs all three helping choices.
- R18: the midnight clock is 8 turns (the `clock` rule); the countdown shows as battle lines, not a header timer. Needs the host to pass in 31 December. The Rival Archive (next 31 December) is cross-run and left out. "+1 Speed next session" is a +50% Speed modifier on your next battle.
- R19: the Champion scene plays at the last stage before the League (League rooms are not event nodes). "Rematch next run" is a line only.
- R20: the four greetings key off how many times you have met the rival, not the rival node itself. Starter Rivalry's +1 stages apply to questline rival fights, to both whole sides, and the music does not change.
- R21: the inn's three clue rooms are one chain on one node; the header does not switch to Storm (the scene shows rain).
- R22: One for the Road gets its stop at the start of the next stage, not the next bench. The last drink plays before the League, not after it.
- R23: the race is a chain pseudo-stage (`ps_rival_race`). The rival's sprite does not move on the map yet (needs the UI thread); the result comes from how many rooms you cleared fast (3 of 4 wins first pick).
- R24: the real name is a scene at the last stage before the League, not a line inside the final battle.
- Rival Report news feed is not wired; reports appear as text in scenes.
- Non-rival questline fights (the Stranger, Kieran) now count as story losses (`quest.soft`), never the end of a run, until the people branch's `friendly` lands.
