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
| 9 | SF150 Famous Faces, SF151 Item Returns, SF152 Milestones, SF153 Quiet Moments | 38 | built, re-read 2026-11-15 |
| 10 | SF154 Choice Rooms (+ the pocket closet's three returns) | 33 | built, re-read 2026-11-15 |
| 11 | SF155 Games and Shrines, SF156 Roadside, SF157 Seasonal Set Pieces | 29 | built, re-read 2026-11-15 |
| 12 | SF158 Seasonal and Cultural Festivals (32 weeks + the berry tree room) | 33 | built, re-read 2026-11-15 |
| 13 | SF159 Market Weeks, SF160 Activity and Throwback Weeks (50 weeks + 3 follow-ups) | 53 | built, re-read 2026-11-15 |
| 14 | SF161 Battle Moments (15 lines + 5 after-battle choices) | 5 rooms, 15 moments | built, re-read 2026-11-15 |

Calendar weeks (SF158 to SF160) stay in `gameEvents.json`; each week's doc choice is a co event with the week's own id, drawn only while that week runs (`gameEvent`). Its "for the week" effects last the region; "at every stage" puts that stop on each stage map (`placeEvent`). Five weeks' own rules were changed to match the doc (`gameEvents.json`): Black Friday and Coupon Week lost their flat discount (the choice gives it now), the Bankruptcy Sale lost its flat half price, Inflation Day is +20% prices (not +30%, no money bonus), and the Evolution Festival is 2 levels sooner (not 3). SF161 (15 battle moments) stays in `dramaEvents.json`: each moment speaks the doc's line, and the five with an after-battle choice open a room (`tools/events/co/singles-14.ts`) beside the next node.

## Engine pieces added

- SF161 (batch 14): a drama library moment can be narrated (`narrate`: spoken under your Pokémon's name, or the recalled foe's) and can open an after-battle room (`after`). The moment's Pokémon are kept in the story flag `moment-mon`, and the new who `moment` lands effects on them. New effect `coTrust` changes Bond Engine trust. The Unplanned Combination and Emotional Turning Point now mean your Pokémon (as the doc says); the trainer's own pair and turning point keep their old lines and rival memory as `foeCombination` and `foeTurningPoint`.
- `coCensus {per}` (SF154 The Census): pays `per` for each different type in the party.
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
| SF150 | ev-elite-four-exhibition, face-e4-chef, face-e4-practice, face-ace-scouting (+ `face-ace-scouting-return`, six nodes on), face-announcer, face-badge-collector, face-breeders-convention, face-chef-throwdown, face-coach-whistle, face-doctor-checkup, face-fisherman-legend, face-hiker-story, face-idol-backstage, face-jenny-checkpoint (+ `face-jenny-key`), face-journalist (+ `face-journalist-2/3`), face-mascot-costume, face-nurse-reunion, face-professor-pet (+ callback `face-professor-checkin`, a region later), face-ranger-escort |
| SF151 | file-data-card, fix-machine-part, penny-hack, return-gold-teeth, return-lost-item, trade-scanner |
| SF152 | milestone-crossroads, milestone-dawn, milestone-embers (+ `milestone-embers-trainer`, next node), milestone-summit |
| SF153 | quiet-bond, rk-birthday, rk-counting-sheep, rk-mood-swing, rk-perfect-day, rk-rest-day, rk-terrible-day, hold-the-hand, dream-memory |
| SF154 | rk-crossroads-four, rk-door-wood/iron/silver/gold, rk-chaos-dial, rk-elevator, rk-floor-1/2/3/4, rk-twin-nodes, rk-twin-left/right, rk-treasure-trap, rk-lucky-number, rk-probability-mage, rk-strangers-dice, rk-streak-1/2/3, rk-echo-item, rk-mastery-echo, rk-mirror-reversal, rk-pocket-closet (+ `rk-pocket-closet-return`, `-2`, `-3`), rk-census, rk-crowd-poll, rk-daily-puzzle, rk-holiday-surprise, rk-team-banner |
| SF155 | archaeology-dig, fossil-dig, bug-contest, cry-shrine, escape-room/-2, game-show-1/2/3, hide-and-seek, lore-riddle-1/2/3, mind-reader, parrot-teacher, parrot-repeats |
| SF156 | passing-caravan, sleeping-npc, tap-the-silhouette, voting-booth |
| SF158 | spooky-season, winter-festival, lunar-new-year, friendship-festival, spring-bloom, summer-splash, valentines-duo-week, cherry-blossom-picnic, pride-rainbow-parade, midsummer-night, fireworks-festival, autumn-harvest-moon, thanksgiving-feast, winter-solstice, spring-equinox, autumn-equinox, diwali-light-walk, mid-autumn-moon-cake, day-of-the-dead, brew-fair, harvest-festival, pokemon-day, earth-week, stargazing-nights, trainer-academy, berry-festival (+ `wk-berry-sprout`), new-moon-night, full-moon-rise, friday-the-13th, palindrome-date, weekend-warm-up, shiny-charm-day (each drawn only in its week) |
| SF159 | market-week, black-friday-sale, grand-opening-sale, berry-bonanza, held-item-hurricane (+ `wk-hurricane-again`), coupon-week, bankruptcy-sale (+ `wk-bankrupt-shop-open` next region), prize-wheel-weekend, lottery-draw, black-market-week, inflation-day, loyalty-points-week (+ `wk-loyalty-gift`), trade-in-week, tm-tuesday |
| SF160 | campfire-tales-week, hidden-path-week, mystery-dungeon-week, gen-1/3/5-throwback, treasure-map-week, caravan-week, weather-map-week, cave-expedition-week, island-hopping-week, volcano-eruption, earthquake-tremors, flood-event, blizzard-week, heat-wave, aurora-night, safari-zone-week, bug-contest-day, pokeathlon-day, underground-week, ruins-expedition, sunken-ship-dive, sky-tower-climb, magical-forest-week, ghost-town-week, festival-street-week, lighthouse-beacon-week, map-mutator-week, train-ride-special, friendship-level-week, evolution-festival, move-tutor-tour, ev-boot-camp, contest-spectacular, photography-week |
| SF161 | refusal, tacticalRevelation, comebackCall, aceReveal, unplannedCombination, failedTechnique, overdriveMisfire, veteransAdjustment, desperateSwitch, mercyMoment, breakingPoint, calmBeforeFinish, takesInitiative, unexpectedRespect, emotionalTurningPoint (status `rule`: battle lines); rooms `moment-refusal`, `moment-combo`, `moment-mercy`, `moment-initiative`, `moment-turning` |
| SF157 | academy-exam, earth-week-cleanup, friendship-picnic, harvest-berry-fair, pokemon-day-parade, spring-bloom-guardian, spring-egg-hunt, stargazing-meteor-watch, summer-beach-tournament (each still drawn only in its week) |

SF137 to SF160: every doc button checked by script against the built labels (all match); outcomes checked by hand against the doc row while writing and again after the standards pass.
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
| "Reputation +1" (Famous faces) | Run flag `rep`, the same one the people row uses | The per-region reputation, when it lands |
| E4 chef "their ace's moves shown" | Named in the text (Dragon Dance, Outrage, Extreme Speed) | An Elite Four preview |
| Ace scout "a loan Pokémon for one stage, returned after" | A Riolu-line Pokémon joins (3 levels up); six nodes on, the scout's room takes it back | A true end-of-stage return |
| Badge collector "a Gym's hidden requirement" | Shows the Gym team and names the rule (win without the lead fainting); flag `gym-secret` | A Gym bonus for meeting it |
| Journalist "each answer changes a rival line" | Flags `press-heart` / `press-bold` / `press-light` | The rivals row reading them |
| Ranger escort "the next two nodes can't be ambushes" | The next two nodes are scouted | An ambush guard |
| Data card "the Dex shows habitat" | ₽500 and flag `dex-habitat` | A Dex habitat view |
| Penny "one more held-item slot in storage" | Each Pokémon can hold one more item (run relic) | A storage slot, if Kice means that |
| Gold teeth "a Safari pass (SF113)" | Flag `safari-pass` | The Safari row reading it |
| Milestones "Fast: one fewer node per stage" | Skips one node now (this stage) | A per-stage length change |
| Milestones "Rich: more trainers, more prizes" | For the region: money ×1.25, a bonus-reward chance, foes +1 level | More trainer nodes |
| Quiet bond "paired +1 Speed when both battle together" | Your top-Bond Pokémon gets a lasting Speed boost | A pair rule |
| Birthday "real birthday (if the save has one)" | Any day | A birthday in the profile |
| Dream memory "an earlier scene replays, with the other choice" | Your most-used Pokémon's moment, told in words | A scene replay |
| Gold crown "the next three battles are against Aces" | The next three foes are 3 levels up and pay boss money ×1.5 | Ace trainer slots |
| Strangers' dice "80% to 120%" | Even odds: 80% or 120% shop prices until the stage's boss | A five-step roll |
| Mirror reversal "the last item loss is undone" | Gives back what the Memory Fog took (nothing if it took nothing) | A record of every item loss |
| Pocket closet | Stores a Rare Candy, Nugget or Star Piece; a later stage's wardrobe gives the same item back (the old ones multiplied healing items, which the battle rules no longer allow) | Nothing |
| Crowd poll "the options shown" | Two options, even odds | More options |
| Daily puzzle "the day's prize" | One of four prizes | A real daily rotation |
| Echo stone "a Common item" | Poké Ball, Great Ball or Repel (an event has at most four buttons) | Nothing |
| Mind reader "pick one of five" / parrot "a list of 6" | One button at 1 in 5; four words (an event has at most four buttons) | Nothing |
| Bug contest "named in the next region's contest" | The judge remembers you a region later; the Bug-type is not named | A species token |
| Escape room "the order the player met their team" | Your starter is named first; the rest is told | Nothing |
| Voting booth "the Pokémon who voted for the winner +1 Bond" | Even odds between two paths; the lead or top-Bond Pokémon gets +1 | Per-Pokémon votes |
| Sleeping trainer "the next rival's lead is shown" | Every battle ahead on the stage is shown | A rival preview |
| Cross-row flags (Tib SF2, Kindness SF128, Egg That Listened SF122, Mew and Deoxys Tellings, Shaymin Sign) | Set here: `tib-seen`, `tib-name-heard`, `kindness`, `egg-that-listened`, `telling-mew`, `telling-deoxys`, `sign-shaymin` | Those rows reading them |
| Twisted Spoon | New held item: Psychic moves +20% | Nothing |
| Weeks: "for the week" / "for the day" | Lasts the rest of the region | A calendar-length effect |
| Summer Splash "Swim": tide pools (SF141) | A 25% heal; the Beach Tournament is its own week event | A tide-pool scene |
| Duo Week "the paired effect (SF153)" | The picked Pokémon and your lead +1 Bond, Bond gains +10% for the region | A true paired effect |
| Harvest Moon "double Berries from trees" | Four Berries now and flag `harvest-moon` | Doubling every tree |
| Equinox "day and night events equally likely" | Not changed; the Sign is given | A day/night balance |
| Day of the Dead "if any `lost.<name>`, see them" | A moment is saved for the friend you remember; no name is read | Named lost Pokémon |
| Full Moon "25% heal per node at night" | One 25% heal | A heal on each node |
| Cross-row flags from the weeks | `spooky-costume` (SF16), `roster-trust` (people), `telling-darkrai`, `sign-light`, `sign-cresselia`, `sign-ho-oh`, `sign-shaymin` (legends), `lantern-sea-open` (places), `farmer-forgets-met` (SF3), `mirror-week` (SF41.7) | Those rows reading them |
| Black Friday "−30% on one item" | One item in every shop at 70% (`shopDeal`) | Picking the item |
| Held-Item Hurricane "one per stage" | One now and one more five stops on | One every stage |
| Coupon Week "a 10%-off coupon for the next purchase" | 10% off every purchase for the region | Per-purchase coupons |
| Loyalty points "₽1,000 spent: a Rare gift" | The gift comes six stops after signing up | Counting money spent |
| Trade-In Week "with the Honest Trade Card" | A trading post on every stage; flag `honest-trade-week` | The card itself (markets row) |
| Throwback weeks "the early-game variety slot" | A wild battle with an early Pokémon of that generation (the week already weights the species) | A variety slot |
| Wicker's Cart (SF5), Weather Station (SF123), Sunken City (SF41.1), Fairground stalls (SF92), Contest Circuit (SF14), Aurora rest (SF137) | The nearest built stop on every stage: merchant cart, weather vane, ghost ship (+ flag `sunken-city-open`), fun-and-games, contest hall, aurora night | Those stops (other rows) |
| Fairground stalls "every three nodes" | Once per stage | More often |
| Map Mutator "one oddity from SF135–SF136" | A lookout tower on every stage | A different oddity each stage |
| Heat Wave "night events up" | A rest and the stops ahead shown | A night weighting |
| EV Boot Camp "double effort in that stat" | That stat +10% (or +15% for Speed, HP) for the party this region | Effort values |
| Cross-row flags from SF159/SF160 | `honest-trade-week` (markets), `lost-island-lead`, `sunken-city-open` (places), `safari-pass` | Those rows reading them |
| Battle Moments "after the battle, one choice" | The room opens beside the next node (a side stop you can skip) | A screen right after the battle |
| Refusal "+1 trust" | Bond Engine trust +10 (trust runs 0 to 100) | A trust scale of its own |
| Two moments with choices in one battle | The room for each opens; both use the Pokémon of the later one | One Pokémon per room |
