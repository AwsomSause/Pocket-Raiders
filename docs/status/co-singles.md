# Catalog Overhaul: revised single events (category `singles`)

Docs: `catalog_overhaul/STORY_FAMILIES_19.md` to `_22.md` (SF135 to SF161), 461 catalog ids, all REVISE.
Content: `tools/events/co/singles-<n>.ts` -> `src/data/events/co-singles-<n>.json`. Progress: `src/data/catalogOverhaul/status/singles.json`. Flags: `src/data/catalogOverhaul/flags/singles.json`. Test: `tests/unit/coSingles.test.ts`.

## Progress
| Batch | Sections | Ids | State |
|---|---|---|---|
| 1 | SF135 Map Stops, SF136 Travel and Shortcuts | 33 | built, re-read 2026-11-15 |
| 2 | SF137 Rests, SF139 Comic Encounters | 23 | built, re-read 2026-11-15 |
| 3 | SF138 Road People and Light Comedy | 26 | built, re-read 2026-11-15 |
| 4 | SF140 Gentle Wild Scenes, SF141 Wild Scenes and Oddities | 49 | built, re-read 2026-11-15 |
| 5 | SF142 Hidden Paths and Mystery Places, SF143 Ability Secrets | 35 | built, re-read 2026-11-15 |
| 6 | SF144 Challenges, SF145 Shops and Workshops | 39 | built, re-read 2026-11-15 |
| 7 | SF146 Study Stops, SF147 Evil-Team Pressure, SF148 Puzzles | 29 | built, re-read 2026-11-15 |
| 8 | SF149 Puzzle Gates | 24 | built, re-read 2026-11-15 |
| later | SF150 to SF161 | 203 | not started (old events still play) |

SF158 to SF160 (82 calendar weeks) live in `gameEvents.json` and SF161 (15 battle moments) in `dramaEvents.json`, not in the event files; they need their own build path.

## Engine pieces added
- Every fight a singles event starts is `friendly` (PLAN.md: no event ends a run); `friendlyAll` in `tools/events/co/_singlesKit.ts`, checked in `coSingles.test.ts`.
- "A Rock- or Steel-type" uses the shared `partyTypes` condition (the `or` field was dropped). Test in `coSingles.test.ts`.
- Items in `src/data/itemCatalog/singles.json`: `wooloo-wool` (+₽200), `tiny-mushroom` (+₽50, +1 toward Peace), `mareep-wool` (+₽300), `toy-pikachu` (next wild battle, the wild Pokémon loses its first turn, like the Poké Doll).
- `skipAhead` takes `nodes` (land that many nodes on, "skip two nodes") or `half` ("cuts the stage in half"), never past the nodes leading into the gym. Test in `coSingles.test.ts`.
- `coFog` effect: `take` loses up to two items (named, kept in order in `co:fog-items`), `give` returns them; `coEpitaph` writes the run's epitaph (`co:epitaph`, read by `runEpitaph` in `story/legacy.ts`). Tests in `coSingles.test.ts`.
- `addStop: 'tutor'` opens a Move Tutor service stop (`services.json` id `tutor`) on the current node. Test in `coSingles.test.ts`.
- `coAdvice` effect (`src/core/events/coSingles.ts`): `weakness` names the types that hit two or more of the party hard; `habits` names the most-used Pokémon, its favourite move and the least-used one. Reads only, changes nothing. Tests in `coSingles.test.ts`.

## Re-read table (doc row against the built event: buttons, outcome, flags)
All checked 2026-11-15 against `STORY_FAMILIES_19.md` and `_20.md`.

| Section | Catalog ids |
|---|---|
| SF135 | berry-tree, pokemon-center, training-ground, treasure-cache, villain-hideout, lookout-tower, ev-hidden-dungeon, ev-regional-festival, rare-sighting, shimmering-grass, route-detour, side-trail, galar-gigantamax-sighting, galar-runaway-wooloo, world-hidden-grotto, wx-sinkhole |
| SF136 | w4-balloon, w4-cave-echo, w4-graffiti-wall, w4-raft, w4-rock-climb, w4-tracks, w4-tracks-deep, w4-zip-line, stranded-cyclist, taxi-fare, mailman-shortcut, marooned-sailor, ask-directions, r130-drifting-wingull-island, r157-cave-spider-silk, r166-sudowoodo-gate, r145-bonsly-standoff |

| SF137 | hot-spring, flower-field-rest, starry-camp, rest-field, rest-meadow, rest-photo, street-performer, tale-festival-night, chimecho-wind-rest, wx-aurora-night, wx-bioluminescent-bay, wx-blossom-storm, wx-rainbow-after-rain, r134-ember-pool, r162-magma-bubble-pools, r154-pokemon-parade-float |
| SF138 | the 26 road-people ids, with callbacks `birthday-kid-returns`, `blind-date-callback`, `borrowed-ally-cheer`, `soap-box-derby-shop`, `wedding-callback` and room `childs-drawing-toy` |
| SF139 | bug-superfan, clowning-around, dancing-lessons, delibird-y, field-trip, fun-and-games, fight-or-flight-2 |
| SF140 | the 38 gentle wild scenes, with rooms `r136-rhyhorn-sting`, `wynaut-hide-2`, `wynaut-hide-3` and callbacks `shed-skin-badge-return`, `r160-staryu-returns` |
| SF141 | the 11 oddities, with room `shiny-glint-close`, `traveler-grotto` (two nodes on) and callback `uncommon-breed-returns` |

| SF142 | hidden-path-keeper (+ room `hidden-path-test`), hidden-path-shortcut, hidden-path-signpost, mirage-island, mr-abandoned-observatory, mr-ancient-arena, mr-clockwork-crypt, mr-dragon-skeleton, mr-echoing-well, mr-graveyard-choir, mr-memory-fog, mr-memory-fog-clears, mr-mind-palace, mr-moss-obelisk, mr-poltergeist-poker, mr-prophecy-wall, mr-vault-key-a/b/c, mr-sealed-vault, mr-spectral-duelist, mr-starfall-seeker, mr-unwritten-library, mr-whispering-door, shrine-maiden, spooky-festival |
| SF143 | secret-arena-tunnel, secret-damp-cave, secret-flash-fire-door, secret-intimidate-gate, secret-keen-eye-ledge, secret-levitate-chasm, secret-magnet-vein, secret-pickup-burrow, secret-synchronize-whisper |
| SF144 | boss-rush-mini (+ room `boss-rush-poachers`), camp-counselor-contest, charity-match, collectors-test, double-date-doubles, double-trouble, eco-ranger-test, gym-scout, gym-trainer-ambush, held-item-gauntlet (+ `held-item-gauntlet-last`), hot-dog-duelists, lifeguard-test, marathon, mentors-examination, moot-court-showdown (+ `moot-court-1/2/3`, `moot-court-verdict`), pokeathlon, quiz-master, relay-battle, rookie-hazing (+ `rookie-hazing-joey`), speed-dating-trainers, speed-trial, strength-trial, time-trial-gate, trainers-test, triple-battle, twin-trainers, type-specialist, underdog-union, winstrate-family (+ `winstrate-vicky`) |
| SF145 | berry-smoothie, capsule-gacha, final-sale-banner (+ `final-sale-shop`), gift-wrap-station, gift-wrap-receiver, key-item-workshop-bike, key-item-workshop-rod, lost-property, street-tailor, rare-candy-cache |
| SF146 | battle-replay-theater, library, mastery-quiz, study-hall, tactical-chalkboard, veterans-notebook, graduation-ceremony, field-hidden-cave, field-overgrowth |
| SF147 | vt-contraband-detector, vt-contraband-gate (room), vt-gadget-sabotage, vt-mind-control-helmet, vt-ransom-note, rescued-callback, dz-sky-route |
| SF148 | rf-bingo-1/2/3 (each opens the next two nodes on), rf-crossword-cave (+ `rf-crossword-room`), rf-fossil-puzzle, rf-gear-box, rf-jigsaw-legend, rf-lantern-riddle, rf-map-sudoku, rf-mirror-beam, rf-mole-hunt, rf-move-trivia-1/2/3 (each opens the next) |
| SF149 | rf-odd-one-out, rf-painting-alignment, rf-pinball (+ `rf-pinball-ball`), rf-rune-tiles, rf-silhouette-1/2/3, rf-slide-whistle-safe (+ `rf-whistle-2/3`), rf-sonar-cave, rf-speed-typing, rf-star-chart, rf-tide-gauge (+ `rf-tide-2/3`), rf-tilt-maze, rf-weighted-scales (+ `rf-scales-2`), w4-express-train, w4-forest-maze, w4-lab-terminal, w4-mirror-maze, w4-pressure-plates, w4-plates-2/3, w4-portal-switches, w4-riddle-signpost, w4-sundial |

SF137 to SF149: every doc button checked by script against the built labels (all match); outcomes checked by hand against the doc row while writing and again after the standards pass.
Buttons match the doc word for word, except `w4-balloon` (the doc says "pick a reachable node", not a button text): "Hop in, and pick where to land."
Rooms added so a doc outcome can ask its own question: `berry-tree-pell` (callback), `festival-gift-swap`, `shimmering-grass-close`, `hidden-grotto-den`, `gmax-den-*` (5), `w4-graffiti-tag`, `r145-bonsly-railings`.

## Known limits (the doc asks for more than the engine has today)
| Doc says | Built as | Needs |
|---|---|---|
| "Skip to that node" (balloon) | The next move lands two columns ahead (skips one) | A pick-a-node landing |
| Species and rarity shown before the player commits | A second room shows it where the species is fixed (Gigantamax) or describes it (grass, grotto); `rare-sighting` and the Alpha do not name the species | A species preview (asked of the lead) |
| "+1 catch step" (`rare-sighting`, Stay still) | Catch rate ×1.25 for the next wild fight | Catch steps, if the pack defines them elsewhere |
| "Appears on real-time Tuesdays" (`galar-runaway-wooloo`) | Any day | A weekday condition |
| The Honest Trade Card, TRADES Pool 13 (`ev-regional-festival`) | A plain swap room with both gifts shown (Potion for a Sitrus Berry) | The markets thread's card |
| Three Torn Pages, SF75 (`ev-hidden-dungeon`) | Reads flag `torn-page` (3), which the old Torn Page events already set | families-c keeps setting it when it rebuilds SF75 |
| "An exit to the next stage's hidden node" (`world-hidden-grotto`) | A ride ahead, and this stage's hidden stops shown | Next-stage placement |
| A postcard hint about the next region's Gym (`mailman-shortcut`) | This stage's Gym team is shown | A next-region Gym preview |
| "One hidden node" / "two hidden nodes" (`lookout-tower`, `w4-graffiti-wall`) | Every hidden stop on the stage is shown | Nothing planned |
| "An Alpha (Alpha rules; calm or battle)" (`w4-tracks-deep`) | A strong wild fight; sets `calmed-alpha` on a win | The legends thread's Alpha rules |
| "A Gigantamax raid next node" | A room beside this node with the giant named, fought as a wild battle | A Gigantamax raid entry |
| "Confused for one battle" (Paras patch, two sips of juice) | The lead deals ×0.75 damage for its next battle | A start-of-battle confusion effect |
| "Start the next battle Charged" (static storm) | Electric moves ×1.5 for the next battle | A start-of-battle Charge effect |
| Playstyle mentor "hints at which Ultra Beast is coming" | The habits advice only | An Ultra Beast forecast (legends) |
| "All Fire-types +1 Bond" (bonfire rests) | The first Pokémon of the type | A by-type Bond selector |
| `delibird-y` no longer has a triple battle (the doc has none) | Present swap only | Nothing |
| "Once per save" (`mirage-island`) | Once per run | Nothing: Kice's rule, nothing carries between runs |
| "The whole region map is shown" (observatory) | Every hidden stop and 12 columns ahead on this stage | A region map view |
| Mind Palace: "relive a battle from this run, and retry it" | A battle against "A Memory" (a trainer, harder for a loss); a win teaches the lead a move (`train learnMove`) | A replay of a recorded battle |
| Moss obelisk: "the region's crisis strand (SF1) is named" | The runes describe the region's crisis meter (three wordings by level) | SF1 strand names (families-a) |
| Ancient arena: "the crowd's favourite move is taught to one Pokémon" | The lead learns Mega Punch after three exhibition bouts | A pick-who-learns step |
| Starfall seeker: "one lucky node named, its rewards ×1.5" | The next battle's prize money ×1.5 | A marked lucky node |
| Echoing well: "one future node is named" | The map shows two more columns ahead | A single-node reveal |
| Spooky festival "a costume" | Text only (your lead dresses as a ghost) | A costume system; SF16 start is flag `hollow-lantern-seen` for families-a |
| Signs for "the run's legend" (Latias, Dialga, Dragon) | The flag is always set; the legends thread decides if it counts | Nothing |
| Ways out the doc does not list (the gate: no event strands the player) | `lifeguard-test` "Shout for the lifeguard.", `strength-trial` "Leave it.", `capsule-gacha` "Walk on.", `final-sale-shop` "Buy nothing." | Nothing |
| Camp counsellor / double date: "a random (named) Road Roster trainer" as partner | A fixed partner Pokémon (Growlithe; Rosa's Pikachu) fighting beside you | The people thread's Road Roster |
| Moot court: "each win weakens their lead (−1 level)" | Each right answer: your damage +10% for that battle | A foe-level change for one fight |
| Eco Ranger: "the Ranger outpost opens" | A healing stop opens beside the node, and flag `ranger-outpost` | The outpost itself (people/places) |
| Type specialist: "they become a trainer at the next Gym, and wave" | Flag `type-specialist-hired` and a moment | A Gym trainer slot |
| Bike workshop: "the bike skips one more node per use" | The bike goes up a tier (Bicycle to Mach to Acro) for ₽500 | A per-use skip count |
| Lost property: "an item from the player's past run" | 1 in 5 a dated valuable someone left behind | Nothing: Kice's rule, nothing carries between runs |
| Capsule gacha "a cosmetic" | A little toy your lead keeps (+1 Bond) | A cosmetics system |
| Held-item gauntlet / Winstrates / rookie hazing: four or five in a row | Three in a row, then a room for the rest (the engine chains three) | Longer chains |
| Study stops: "preview the next Gym Leader's team" | The whole team of the region's next Gym, shown in text | A one-Pokémon preview, if Kice wants less |
| Bingo: "mark the squares you've seen" | A fixed card; rows, columns or the whole card pay by which events you saw this run | A random card |
| Sky route: "fly over the next part of the stage" | Skip three nodes ahead | Nothing |
| Evil-team pressure "remembers" | Flags `evil-key`, `evil-trail-lost`, `evil-knows-lead` (same run only), for the evil-story row to read | evil-story reading them |
| Fossil puzzle reward | The fossil Pokémon joins directly (no revive step) | A fossil reviver stop |
| Field moves (Cut, Strength, Surf, Rock Climb and more) | Need a living party member who knows the move; Bright Powder is a new held item (10% evasion) | Nothing |
| Silhouettes: "three names" (the region's starter, Gym 1's ace) | The buttons describe the answer ("This region's Grass starter.", "The first Gym Leader's ace."); the third is your lead by name | Per-region name buttons |
| Rune tiles: "a Sign" | Flag `sign-own` (a Sign for whichever Legendary blesses the run; the legends row turns it into Influence) | Nothing |
| Step puzzles (slide whistle, tide gauge, scales) | One room per step; a wrong step carries on but cannot win | Nothing |
