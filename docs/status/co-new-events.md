# Catalog Overhaul row 17: new events (NE1 to NE100) and Pokémon Moments

Branch `claude/project-thread-d4o6wo` (into `ui-mockups`). Thread: "Build 100 new events and Pokémon moments".

## Where it stands (2026-11-15)
- **Built:** 95 of the 100 new events (199 scenes with their follow-ups), in `tools/events/co/new-events-1..4.ts`, built to `src/data/events/co-new-events-1..4.json` with `npm run co:build -- new-events-N`.
- **Waiting:** NE61 to NE65 (the trade events) wait on the markets row's `honestTrade` rule, so it is built once. The coordinator will see them built when markets resumes.
- **Placement and status:** `status/new-events.json` (199 ids under `extra`) and the placement blocks, written by `node tools/write-new-events-meta.ts`. The placement file is **staged** at `src/data/catalogOverhaul/placement-staged/new-events.json`, not in `placement/`: once loaded, the lead's placement scheduler puts these 95 events on every stage, which moved stage maps and broke about 12 older tests (stop counts, prize-money and map-item sims). The catalog lead should turn placement on for all rows together and re-pin those tests; until then the events are drawn the normal way (rarity, stage, requires).
- **Disabled:** NE100 The Road Home is written in full but `disabled`: it plays after the final battle (win or lose), and the run end has no hook to open a scene there yet. That screen is the New UI run end; one line turns it on once it can.
- **Memories held back:** 12 remembered variants read flags that only other rows' events set, and none of those events exist yet (eventMemory test: no memory may read a flag nothing sets). They stay written in the source; `WAITING_FLAGS` in `tools/events/co/_ne.ts` leaves them out of the build. Delete a key there when its setter lands: `little-league-look-after` (NE4), `took-egg` and `egg-returned` (NE5), `bought-stolen` (NE7), `elder-ditto-met` (NE10), `team-op-stopped-magma-drill` (NE12), `sign-broken` (NE13), `glove-duel-accepted` (NE23), `journalist-interview` (NE57), `haddon-ferried` (NE67), `lighthouse-lit` (NE79).
- **Kept from older builds:** the camp scenes (NE81 to NE85) replace `camp-rests.json` by id and keep its memories: the pair from the fire can settle the Argument, and the two who argued show up in the Photograph. New rival marks: `letter-burnt`, `swap-day`, `swap-ace-fond`, `sponsor-dropped` (rivalOverhaul.json).
- **New rules added for these scenes:** heal "others", clear-sky stages (no fronts), the "flag is 0" check, tokens `{nextRegion}` `{finalRegion}` `{lowestBond}`, one-on-one fights, a foe that endures to hit N, "a Z-Move was used" flag, Swap Day (`src/core/co/swap.ts`: trade teams with the main rival, everything goes back before a Gym, League fight or new stage), and quirks Protector and Dreamer (plus seven more in `quirks/new-events.json`).
- **Tests:** `coNewEvents.test.ts`, `coNewEventsRules.test.ts`, `coQuirks.test.ts`, `catalogOverhaul.test.ts`; browser `tests/e2e/coNewEvents.spec.ts` (NE1, NE41, NE91 in the New UI, tokens filled).
- **Next:** Pokémon Moments to `POKEMON_MOMENTS.md` (separate slice, after this PR).

## Re-read table (every part re-read against its doc after building)
| Part | Doc | Built | Re-read | Notes |
|---|---|---|---|---|
| 1 | NEW_EVENTS_1.md NE1-NE25 | 2026-11-15 | 2026-11-15 | `co-new-events-part1-reread.md` |
| 2 | NEW_EVENTS_2.md NE26-NE50 | 2026-11-15 | 2026-11-15 | `co-new-events-part2-reread.md` |
| 3 | NEW_EVENTS_3.md NE51-NE75 | 2026-11-15 (no NE61-65) | 2026-11-15 | `co-new-events-part3-reread.md` |
| 4 | NEW_EVENTS_4.md NE76-NE100 | 2026-11-15 | 2026-11-15 | `co-new-events-part4-reread.md` |

Each part note lists what was fixed, what still needs engine work, what was left out because it would carry to another run, and missing art.

## Decisions (for Kice)
- Cosmetic keepsakes from the scripts (feather, drawing, photo...) are run flags plus text, since Keepsakes/Souvenirs stay cut.
- Pack "Save" flags and anything carried to a later run are not built (same-run memory only). NE31 and NE35 were reworked so they no longer need a past run.
- No old-man / gentleman trainer art exists, so those scenes show no figure (art needed).
- Delta Roselia in the game is Dark/Fairy; NE7's script describes an Ice/Grass one that makes frost. Kept the game's species; flagged for Kice.
- NE16's "promise broken" version is its own small scene (`ne16-only-the-note`), because every base choice needs the light.
- Quirks Burrower and Warm have no rule in the pack, so they are not defined yet.
- No event ends a run, forces Shadow, or gives an in-battle heal item.

## Flags other threads read
Legends (LEGENDS_PIECES §6) reads: `zebedee-message`, `bell-oighrig`, `anselmo-believed`, `mega-grounded`, `beast-sent-home`, `guzzlord-found`, `nihilego-touched`, `kartana-honoured`, `stars-answered`, `promise-step-<m>`. Swap Day sets `ev:swap-fainted`. The Z-Move flag is `ev:z-move-used`.
