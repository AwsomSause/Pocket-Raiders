# Catalog Overhaul: revised single events (category `singles`)

Docs: `catalog_overhaul/STORY_FAMILIES_19.md` to `_22.md` (SF135 to SF161), 461 catalog ids, all REVISE.
Content: `tools/events/co/singles-<n>.ts` -> `src/data/events/co-singles-<n>.json`. Progress: `src/data/catalogOverhaul/status/singles.json`. Flags: `src/data/catalogOverhaul/flags/singles.json`. Test: `tests/unit/coSingles.test.ts`.

## Progress
| Batch | Sections | Ids | State |
|---|---|---|---|
| 1 | SF135 Map Stops, SF136 Travel and Shortcuts | 33 | built, re-read 2026-11-15 |
| 2 | SF137 Rests, SF139 Comic Encounters | 23 | drafted in `singles-2.ts`, not built |
| 3 | SF138 Road People | 26 | drafted in `singles-3.ts`, not built; needs `addStop: 'tutor'` and a `coAdvice` effect (not built yet) |
| 4 | SF140 Gentle Wild Scenes, SF141 Oddities | 49 | drafted in `singles-4.ts`, not built |
| later | SF142 to SF161 | 330 | not started (old events still play). SF142/SF143 read and old defs checked. |

## Paused 2026-11-15 (Kice: five threads at a time)
Where I stopped:
- Batch 1 is committed. The full `npm run check` rerun was stopped part way (typecheck passed; unit tests had not finished). Targeted tests passed. Next: rerun the full check, then open the batch 1 PR into `ui-mockups`.
- Batches 2 to 4 are drafts only (not built into JSON, not in the status file).
- New items still to add to `src/data/itemCatalog/singles.json` for batches 3 and 4 (kept out so batch 1 stays clean):
  - `tiny-mushroom`: Valuables, +₽50, +1 toward Peace (`ragePeace -1`), icon `tinymushroom`, common.
  - `mareep-wool`: Valuables, +₽300, icon `fluffy-tail`, uncommon.
  - `toy-pikachu`: Map and encounter item, max 1, next wild battle the wild Pokémon loses its first turn (`encounter` / `freeTurn`, like the Poké Doll), icon `poke-doll`.
- Batch 4 limits to log: "confused for one battle" is a ×0.75 lead damage tempEffect; "Charged" is Electric ×1.5 for one battle; the map grotto opens on the next node, not two on.

SF158 to SF160 (82 calendar weeks) live in `gameEvents.json` and SF161 (15 battle moments) in `dramaEvents.json`, not in the event files; they need their own build path.
Party-pick rests (SF137 "Who soaks first?") wait for the lead's party-picker field.

## Engine pieces added
- "A Rock- or Steel-type" uses the shared `partyTypes` condition (the `or` field was dropped). Test in `coSingles.test.ts`.
- Item `wooloo-wool` (Valuables, +₽200) in `src/data/itemCatalog/singles.json`.

## Re-read table (doc row against the built event: buttons, outcome, flags)
All checked 2026-11-15 against `STORY_FAMILIES_19.md`.

| Section | Catalog ids |
|---|---|
| SF135 | berry-tree, pokemon-center, training-ground, treasure-cache, villain-hideout, lookout-tower, ev-hidden-dungeon, ev-regional-festival, rare-sighting, shimmering-grass, route-detour, side-trail, galar-gigantamax-sighting, galar-runaway-wooloo, world-hidden-grotto, wx-sinkhole |
| SF136 | w4-balloon, w4-cave-echo, w4-graffiti-wall, w4-raft, w4-rock-climb, w4-tracks, w4-tracks-deep, w4-zip-line, stranded-cyclist, taxi-fare, mailman-shortcut, marooned-sailor, ask-directions, r130-drifting-wingull-island, r157-cave-spider-silk, r166-sudowoodo-gate, r145-bonsly-standoff |

Buttons match the doc word for word, except `w4-balloon` (the doc says "pick a reachable node", not a button text): "Hop in, and pick where to land."
Rooms added so a doc outcome can ask its own question: `berry-tree-pell` (callback), `festival-gift-swap`, `shimmering-grass-close`, `hidden-grotto-den`, `gmax-den-*` (5), `w4-graffiti-tag`, `r145-bonsly-railings`.

## Known limits (the doc asks for more than the engine has today)
| Doc says | Built as | Needs |
|---|---|---|
| "Skip two nodes" (raft, taxi), "skip to that node" (balloon) | The engine's ride: the next move lands two columns ahead (skips one) | A skip-N effect (asked of the lead) |
| An outcome that costs "a node" (Find R. Tanner, sinkhole way up, Sudowoodo wait, stuck in the silk) | No cost | A lose-time effect (asked of the lead) |
| Species and rarity shown before the player commits | A second room shows it where the species is fixed (Gigantamax) or describes it (grass, grotto); `rare-sighting` and the Alpha do not name the species | A species preview (asked of the lead) |
| "+1 catch step" (`rare-sighting`, Stay still) | Catch rate ×1.25 for the next wild fight | Catch steps, if the pack defines them elsewhere |
| Reputation +1 (`treasure-cache`) | Good +2 and research | A reputation effect |
| "Appears on real-time Tuesdays" (`galar-runaway-wooloo`) | Any day | A weekday condition |
| The Honest Trade Card, TRADES Pool 13 (`ev-regional-festival`) | A plain swap room with both gifts shown (Potion for a Sitrus Berry) | The markets thread's card |
| Three Torn Pages, SF75 (`ev-hidden-dungeon`) | Reads flag `torn-page` (3), which the old Torn Page events already set | families-c keeps setting it when it rebuilds SF75 |
| "An exit to the next stage's hidden node" (`world-hidden-grotto`) | A ride ahead, and this stage's hidden stops shown | Next-stage placement |
| A postcard hint about the next region's Gym (`mailman-shortcut`) | This stage's Gym team is shown | A next-region Gym preview |
| "One hidden node" / "two hidden nodes" (`lookout-tower`, `w4-graffiti-wall`) | Every hidden stop on the stage is shown | Nothing planned |
| "An Alpha (Alpha rules; calm or battle)" (`w4-tracks-deep`) | A strong wild fight; sets `calmed-alpha` on a win | The legends thread's Alpha rules |
| "A Gigantamax raid next node" | A room beside this node with the giant named, fought as a wild battle | A Gigantamax raid entry |
