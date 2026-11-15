> Filed 2026-11-14 from Kice's `catalog_overhaul_pack.zip` (`catalog_overhaul/FULL_SCALE_UPDATES.md`), word for word. These are eighteen pitches for future big updates, not build specs, so none is built in the catalog rebuild. Idea 1, Evil Mode, has full docs in the pack (`EVIL_MODE_BLUEPRINT.md`, `EVIL_MODE_FULL_1` to `_6`) and is on hold by Kice's order ("DO NOT BUILD EVIL MODE YET", 2026-11-14).

# EIGHTEEN IDEAS FOR FULL-SCALE UPDATES

**What a "full-scale update" means here.** Each of these is big enough to name a version after: a new mode, a new layer over every run, or a new kind of content with its own systems. Each says what it is, what it changes, what it needs, what it reuses from the design so far, and how big it is.
**Sizes:** **S** is a few systems and a hundred events' worth of writing; **M** is a mode's worth; **L** is a second game beside the first.
**All eighteen keep the standing rules:** no run's made unwinnable; no Shadow Pokémon's forced; harm to children's off-screen; trades are honest; no in-battle healing items.

## At a glance
| # | Update | One line | Size |
| --- | --- | --- | --- |
| 1 | **Evil Mode** | You run the team; the Hero's coming | L |
| 2 | **The Hero's Shadow** | Co-op and versus: one plays the Boss, one the Hero | M |
| 3 | **Gym Leader Mode** | You stand at Step 20, and they come to you | M |
| 4 | **The Living Region** | Towns remember, grow and fall across runs | L |
| 5 | **Professor Mode** | No battles won: a run of field research | M |
| 6 | **The Ranger Corps** | No Poké Balls: capture by befriending, and let go | M |
| 7 | **The Long Winter** | A survival run: one region, four seasons, a village to keep alive | M |
| 8 | **Contest Circuit Mode** | Become Top Coordinator, not Champion | M |
| 9 | **The Ancient Region** | A run in the past, where there are no Balls, no Gyms and no map | L |
| 10 | **Dynasty** | Runs as generations: your Champion's child starts the next | M |
| 11 | **The Town Builder** | Town and Hub nodes become yours to found | M |
| 12 | **The Deep Road** | A seventh region underground: the Mystery Dungeon, at full size | M |
| 13 | **The Frontier** | The endgame as a place: seven facilities, seven Brains, forever | M |
| 14 | **Partner Mode** | One Pokémon. No party. A whole run with your starter | S |
| 15 | **The Sea** | The map opens: sail between islands, in any order | L |
| 16 | **The Newsroom** | A run as a journalist: the story's the win | S |
| 17 | **The Second Chance** | Play as a Pokémon somebody released | M |
| 18 | **The Workshop** | Players make stages, events and teams, and share them | L |

---

## 1. Evil Mode
**In full:** `EVIL_MODE_BLUEPRINT.md`.
**The short of it.** Found a team; pick a Creed, a Line and a Doctrine; take districts holding by holding; hire, promote and send out Grunts who are people; build a base that somebody else has to walk through; and finish a Grand Scheme before a kid with a starter reaches your office.
**Why first.** Half of it's built already: Team Sky's screens, the inside routes, the Honest Card.

## 2. The Hero's Shadow *(needs 1)*
**Pitch.** Evil Mode for two. **One player's the Boss. The other's the Hero.** They play the same three regions at the same time, from opposite ends.
**What changes.** The Hero plays the main game, on a map where every trainer, Gym and event's been arranged by another person. The Boss sees a marker on the road that thinks.
| Mode | How it plays |
| --- | --- |
| **Versus** | First to their win: the Scheme, or the last room |
| **Co-op, secretly** | The fire scenes are real conversations. They can make a deal. The game doesn't tell them they can |
| **Asynchronous** | The Boss builds a region and a base; it's saved; anyone can play it as the Hero, later. The Boss gets the log |
**Needs.** Netcode for turn exchange; the watched-intrusion log, both ways. **Reuses** all of 1.
**The thing it's for.** The last room, when both people are real.

## 3. Gym Leader Mode
**Pitch.** You've been handed a Gym: a type, a town and an empty building. **Challengers come to you.** A run's a season.
**The loop.** Each stage's a week. Design the Gym's puzzle. Train a team that's *meant to be beaten by the right challenger* and to stop the wrong one. Take eight challengers. Run the town between them.
| System | What it is |
| --- | --- |
| **The Badge's meaning** | You decide what your Badge tests: nerve, kindness, patience, wit. Challengers who have it pass even when they lose |
| **The right loss** | A Leader's judged by who they let through. Lose well to a kid who's ready: Reputation up. Crush them: down |
| **The town** | Your Gym's the town's heart. The Town Roll becomes yours to fill |
| **The League's inspectors** | Twice a season. From SF, the Leader Who Failed Her Own Test, from the other side |
| **The one who'll be Champion** | One challenger a season's the real thing. You'll know. Everybody's a Leader for that match |
**Reuses.** Rival personalities for challengers; Rule Battles for Gym rules; the puzzle families; the past-Leader questlines as your colleagues.
**Ends** with the League asking you up, or the town asking you to stay.

## 4. The Living Region
**Pitch.** **The world stops resetting.** A save has one Kanto, one Johto, and so on, and every run leaves marks in them.
| It remembers | So that |
| --- | --- |
| Bridges mended, wells dug, trees planted | They're there next run, older |
| Towns helped or failed | A town helped three runs running grows a district; one failed three times is shuttered, with a note on the door |
| People | The Tough Junior's a Gym trainer in four runs. The widow's scarecrow has a garden round it |
| Your old teams | Retired Pokémon live somewhere. They can be visited. They age |
| What you did wrong | It doesn't nag. It's just there: a stump where the orchard wasn't replanted |
**Needs.** A region-state layer under the generator; "years" as a save-level clock; three states (thriving, plain, failing) for every town event. **Reuses** every Afterstory and **Save** flag already written: there are hundreds, and this is what they were for.
**The risk.** A save can go sour. **So: nothing's ever locked.** A failed town can always be brought back, and it's the best questline in it.

## 5. Professor Mode
**Pitch.** No Badges. No Champion. **You've a grant, a notebook and a region to understand.** The run's won by what you find out.
| System | What it is |
| --- | --- |
| **Questions** | The run opens with three, drawn from the region: "Why do the Magikarp jump at this fall?" "What's eating the Berries?" Each is a chain of observations across stages |
| **Observation, not battle** | Wild nodes become watch nodes: wait, follow, bait, record. Battles still exist; they're the clumsy way to learn something |
| **The Notebook** | Sketches, tracks, calls. It fills. Entries cross-reference. It's the run's score and its keepsake |
| **The paper** | At the end, the player assembles one, from what they've got. Rivals review it. One's unkind |
| **Assistants** | Up to three Pokémon, chosen for senses, not strength |
**Reuses.** The wild-scene families (Gentle Wild Scenes, the Teacher in the Stream, the Funeral in the Tall Grass) are already this mode's content; Dr. Vale's Delta Study is its tutorial; Professor Westwood's its patron saint.

## 6. The Ranger Corps
**Pitch.** **No Poké Balls.** A Ranger asks for help, gets it, and says thank you and goodbye.
| System | What it is |
| --- | --- |
| **Befriending** | Not a throw: a short exchange. Calm it, feed it, show it something. Each species has a way in |
| **Field moves** | A befriended Pokémon does one thing: cuts, carries, lights, crosses. Then it's released. Bond's with the species, across the run: "the Buizel of this river know you" |
| **One partner** | Who stays |
| **Missions** | A stage is a mission: a fire, a flood, a poaching ring, a lost child. It's the Region in Crisis and the Convoy, as the main game |
| **Nothing's owned** | The run ends with an empty belt and a full region |
**Reuses.** The Hazard System as its core; the rescues; SF58 The Valley; every evil-team Operation, as the thing you stop.

## 7. The Long Winter
**Pitch.** **One region. One village. Four seasons. Keep everyone alive till spring.** The 20-step map's the country round the village, and you go out and come back.
| System | What it is |
| --- | --- |
| **The village** | Thirty people, named. Stores of food, fuel and medicine, all shown |
| **Expeditions** | Each stage, a trip out along the steps and home again. Further's richer and colder |
| **Seasons** | Eight stages a season. Autumn's for stocking. Winter's for holding. The header matters more than it ever has |
| **The party as a household** | Fire types heat. Grass types grow. Each Pokémon has a job at home, and does it worse when it's taken on the road |
| **Nobody's lost** | Hard choices are about comfort, not death: who's cold, who's short. **Nobody starves on screen or off. Spring comes for everyone;** the question's how they remember the winter |
**Reuses.** Snowed In, the Snow That Won't Stop, the Four Seasons Snorlax, the Camp.

## 8. Contest Circuit Mode
**Pitch.** **Ribbons, not Badges. A Top Coordinator, not a Champion.** SF14 and the Showcase, as the whole game.
| System | What it is |
| --- | --- |
| **Five conditions** | Cool, Beautiful, Cute, Clever, Tough: raised by care, food and practice between stages |
| **Appeals** | A performance round: moves as combinations, judged for timing and surprise. It isn't a battle and uses different muscles |
| **Contest battles** | Then one: win by points, not knock-outs. A beautiful loss beats an ugly win |
| **The crowd** | Each town's taste differs. A stage's two types say what it likes |
| **Your rival** | Wants the same Ribbon Cup, and is nicer to their Pokémon than you are |
**Reuses.** The rhythm games written for the Water Ballet, the Showcase, the film audition; Bond as the real stat; the Aipom Who Wanted Contests.

## 9. The Ancient Region
**Pitch.** **A run in the past.** No Poké Balls as we know them. No Gyms. No map: the 20 steps are fog until walked. People are afraid of Pokémon, and you're the stranger who isn't.
| System | What it is |
| --- | --- |
| **The unmapped stage** | Nodes are hidden until adjacent. Scouting's a job. The map you draw is kept |
| **Nobles and Alphas** | No Gym at Step 20: a lord of the land, to be calmed. The Alpha questlines are this mode's bosses |
| **The first Balls** | Crafted from what's found. Weak. Precious |
| **The village's trust** | It starts at nothing. Each calmed Alpha, each Pokémon shown to be gentle, brings them out of their doors |
| **What it leaves behind** | **Things done here are ruins in every later run of the save:** a shrine you built's the Trapped Crypt; a pact you made's why the Hidden Village exists |
**Reuses.** The Noble Frenzy; Alphas; the First Gym; the Buried City. **With 4, it's the same world, earlier.**

## 10. Dynasty
**Pitch.** **A run's a life. The next run's their child's.**
| It passes down | How |
| --- | --- |
| One Pokémon | An egg from the old team's ace |
| A name | Shopkeepers say "you've your mother's way of standing" |
| A reputation | Good or bad. It opens doors and shuts them |
| An unfinished thing | Whatever the last run didn't do: a promise, a rival, a town |
| A house | The Road Home's house, with the photograph on the wall |
**The rival's a dynasty too.** Their child's the next rival. **The feud, or the friendship, is inherited,** and can be mended or made worse over four generations.
**Reuses.** The rival archive; "the Kid From the Next Run"; the Letter to Future You; every **Save** flag.

## 11. The Town Builder
**Pitch.** Town and Hub nodes are coming. **This makes one of them yours.** Somewhere in each region there's an empty lot: the Building Site, the Gym That Isn't Built Yet. Found a town on it.
| System | What it is |
| --- | --- |
| **Plots** | Twelve. Each takes a building |
| **Settlers** | **Everyone you've helped's a candidate.** The cook from the Rusted Anchor opens the inn. The Name Rater moves in and has opinions about the street names |
| **Services** | What's built is what your later runs can use: a tutor, a day-care, a bank |
| **Festivals** | Yours to hold. They draw the region |
| **It persists** | Across runs. It's the save's home |
**Reuses.** The Honest Market's 29 stalls; the Final Reunion's whole cast; SF's Services. **It's the Final Reunion, made permanent.**

## 12. The Deep Road
**Pitch.** **A seventh region, straight down.** No towns. No sky. Eight stages of twenty floors, each generated, each stranger.
| System | What it is |
| --- | --- |
| **Light** | A resource. It's the header |
| **The way back up** | Each stage, the choice: go on, or bank what you've found. The Descent, as a rule |
| **Deep species** | Regional forms nobody's seen; things with no eyes |
| **The expedition** | Four before you didn't come back. Their camps are the + nodes. Their journals are the story |
| **What's at the bottom** | Something asleep that the whole design's been pointing at: the Original Legendaries' own stage |
**Reuses.** The Mystery Dungeon; the Lost Expedition; the Descent; Rock Tunnel's dark; the Cook of the Dungeon.

## 13. The Frontier
**Pitch.** **The endgame's a place you can live in.** Seven facilities, seven Frontier Brains, each a rule nobody's met at full strength.
| Facility | Its rule |
| --- | --- |
| The Tower | Streaks. No items |
| The Factory | Rentals only: SF's Rule Battles, as a career |
| The Palace | You don't give orders. Your Pokémon fight by nature and Bond |
| The Pike | Three doors. The Honest Card on each, mostly |
| The Arena | Three turns, judged |
| The Dome | A bracket you can scout |
| The Pyramid | Dark; found items only |
**The Brains remember,** across runs, and adapt to the player's habits.
**Reuses.** `gn.42`; Rule Battles; the Training Ground; the Circuit's board.

## 14. Partner Mode
**Pitch.** **One Pokémon. The whole run.** Your starter, and nobody else.
| System | What it is |
| --- | --- |
| **Depth for breadth** | Six move slots. A skill tree drawn from its line. It learns from what it's survived |
| **It talks back** | Not in words. It refuses, sulks, insists. Bond's the whole game |
| **Double battles** | With whoever's travelling: a rival, an ally, a Grunt who's had enough |
| **It can't faint for good, and it can be hurt** | An injury's carried for a stage, and tended at rests |
| **The ending** | The Road Home, with two sets of footprints |
**Reuses.** The Starter's Roots; the Pokémon Moments, all of which become this one Pokémon's. **It's the smallest update here, and it might be the best one.**

## 15. The Sea
**Pitch.** **The map stops being a road.** A region's an archipelago; you've a boat; go where you like.
| System | What it is |
| --- | --- |
| **Open order** | Eight islands, eight Gyms, any order. Levels follow you |
| **The boat** | A second base: a crew, a hold, a galley. It's upgraded, and named |
| **Weather and tide** | The header, made into the map |
| **What's between** | Wrecks, whirlpools, a whale the size of a town, an island that wasn't there yesterday |
| **A crew** | The Rusted Anchor's; or your own |
**Reuses.** The Sevii Islands' ferry board as the whole structure; the Lost Island; the Captain's Chest; the Sky Whale.
**The cost.** It breaks the 20-step map, which everything's placed on. Each island keeps a short strip of steps so that the placement work survives.

## 16. The Newsroom
**Pitch.** **You're a reporter with a deadline.** The Champion's somebody else. You're following them, and everything they walk past.
| System | What it is |
| --- | --- |
| **Stories** | Each stage has three happening. You can cover one properly |
| **Sources** | People talk to someone who listened last time. It's Reputation, as a contact book |
| **What you print** | Changes the region: a racket exposed closes; a kindness reported spreads |
| **The team's lawyers** | And worse |
| **The front page** | Assembled at each stage's end. A run's a bound volume of eight |
**Reuses.** The evil teams' Files and Intel are already a reporter's notebook; the Fame Checker; the Photographer; the Bargain Day-Care's police report.

## 17. The Second Chance
**Pitch.** **You're a Pokémon. Somebody let you go.** Find out why; find somebody new, or go home, or decide you don't need either.
| System | What it is |
| --- | --- |
| **No trainer** | You pick your own moves, and nobody heals you. Rests are found |
| **Other Pokémon** | A pack, made on the road. Each was somebody's |
| **People** | Seen from knee height. Some are kind. You can't tell which until it's late |
| **The scent** | Your old trainer's trail, across the region. It can be followed |
| **Three endings** | They come back for you. You find someone better. You lead the others somewhere that's theirs |
**Reuses.** Every abandoned-Pokémon story in the design (Damian's Charmander, the Tepig at the post, the Forgotten Partner, the Ghost Left Behind) is this mode's cast. **It's those stories from the inside.** Told gently: nothing's hurt on screen.

## 18. The Workshop
**Pitch.** **Hand players the tools this design was made with.**
| Tool | Makes |
| --- | --- |
| **The Stage Editor** | A 20-step stage: nodes, paths, a Gym, a header |
| **The Event Editor** | An event in the placement format: opening, script, choices, outcomes, flags. It checks the rules: no trap choices; costs shown |
| **The Team Editor** | An evil team: Creed, ranks, a seven-step plan, a Leader who confides |
| **The Region Kit** | Eight stages, a Town Roll, a canon cast |
| **Sharing** | Codes. Ratings. A weekly featured region |
**Needs.** The data formats frozen; a validator (most of the rules in this design are checkable); moderation.
**Reuses.** The placement block's already a schema. `tools/` already has builders and checkers.
**It's last on the list because everything before it's what it would be used to make.**

---

# HOW THEY FIT TOGETHER

| If you build | It makes these cheaper |
| --- | --- |
| **4. The Living Region** | 9, 10, 11: they're all "the save remembers" |
| **1. Evil Mode** | 2, 3: the same chair, other sides of it |
| **11. The Town Builder** | 3, 7: a town you run |
| **14. Partner Mode** | 17: one creature, deeply |
| **5. Professor Mode** | 6, 16: runs without Badges |
| **18. The Workshop** | Everything after it |

## An order, if you want one
| Step | Update | Why then |
| --- | --- | --- |
| 1 | **14. Partner Mode** | Small. Tests whether depth beats breadth. Uses only what exists |
| 2 | **4. The Living Region** | It turns hundreds of written Afterstories into a system, and four later updates stand on it |
| 3 | **1. Evil Mode** (its prototype: the district, people, the Hero) | The biggest new idea; decide after the prototype |
| 4 | **11. The Town Builder** | Town nodes are coming anyway |
| 5 | **3. Gym Leader Mode** | It's Evil Mode's and the Town Builder's parts, recombined |
| 6 | **13. The Frontier** | Endgame, for the players who've finished all of that |
| Then | 5, 6, 8 (the modes without Badges); 9, 10 (time); 12, 15 (new maps); 7, 16, 17 (the odd ones); 2 and 18 last |
