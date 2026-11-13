# CANON SPACES — KANTO
### Expanded edition: every town, every anime and manga moment you listed, and the towns and moments that were missing

**Pack:** Beta 0.6 "You Are (Not) Alone" · **Region id:** `kanto` · **Builds on:** your Canon Spaces notes (all of your mechanics are kept; where I changed or added something it is marked **Added** or listed in §0.6)

---

## 0. How to read this document

### 0.1 What a Canon Space is
A **Canon Space** is a piece of a region's story that belongs to one town: a Pseudo Stage, a mandatory check, an optional event, a shop, a walkable hub or a cutscene. Every stage has an assigned town; the town supplies that stage's Canon Spaces. Pseudo Stages follow the pack's definition (design doc §2): they do **not** advance the stage counter, they use the previous stage's difficulty plus a stated offset, and they always end in a result.

| Kind | Code | What it is |
| --- | --- | --- |
| Pseudo Stage | `PS` | A scripted stage inserted between stages. Does not advance `stageIndex`. |
| Mandatory check | `MC` | A node you cannot skip. Resolves in one scene or one roll. |
| Event | `EV` | An optional node; accept or walk past. |
| Hub | `HUB` | A walkable town area with shops and services, like Hub Town. |
| Shop | `SHOP` | A store or service counter, usually inside a hub or a town node. |
| Cutscene | `CUT` | A scripted beat with no battle, or with one forced battle. |

**Space id format:** `cs.kanto.<town>.<slug>` (for example `cs.kanto.pewter.samurai`). Pseudo Regions use the pack's `pr.kanto.<site>` ids.

### 0.2 The spec block
Every space below gives the same few lines:

- **Kind / Appears:** what it is, and how it gets into a run (always, a chance, or after a trigger).
- **Level:** `±n` relative to the previous stage, or a fixed range.
- **Beats:** what happens, in order.
- **Odds:** every roll, written out.
- **Reward / Cost / Fail:** what you get, what it costs, and what a loss does.
- **Flags:** the run flags it writes (all flags live under `kanto.*`).
- **Added:** anything I added to your version.

### 0.3 The Town Roll (so every run has a different Kanto)
A town offers more spaces than a run will use. On entering a town's stage, the run builds that town's **menu**:

1. All spaces marked **Always** are placed.
2. Spaces marked **Roll** are drawn without replacement: **2** from the town's Roll list at stages 1–3, **3** from stage 4 onward, never more than **2** Pseudo Stages in one town's menu (so a town stays quick to clear).
3. A **Trigger** space (for example Flight North, which needs a Bug-type in a tower of Spearow trouble) is never rolled; it fires when its condition is met.
4. Spaces you have already completed in an earlier run of the same save may be re-rolled, but a space with a unique reward (a starter, a Z-Crystal) is skipped once its reward is owned, unless the space says it has a fallback reward.

> The Roll counts are my default. Change them in one place (`townRoll` in the region file) and every town follows.

### 0.4 Stage slots
Kanto has eight stages. **Gym battles are handled by the base game and are not specified here**; Canon Spaces fill each stage's town. Everything else is an **Interlude**, a non-advancing slot between two stages. The towns are placed in the order of the games.

| Slot | Town | Main spaces | Notes |
| --- | --- | --- | --- |
| Interlude 0 | **Viridian City** | Old Man's Lesson, Route 22 | Before Stage 1. |
| Stage 1 | **Pewter City** | Veridian Forest, Mt. Moon, Museum | |
| Stage 2 | **Cerulean City** | Damian's Unofficial Gym (optional event), Bridge, Cold Nights Rain, Squirtle Squad, Bill | |
| Stage 3 | **Vermilion City** | S.S. Anne, Tentacruel, Maiden's Peak, Flight North | |
| Interlude 3 | **Lavender Town** | Pokémon Tower | Between Stage 3 and Stage 4. |
| Stage 4 | **Celadon City** | Department Store, Game Corner, Mansion | |
| Stage 5 | **Fuchsia City** | Polluted Factory, Safari Land, Savanna, Jungle | |
| Stage 6 | **Saffron City** | Labyrinth, Route 25, Tournament, Silph Co. | |
| Stage 7 | **Cinnabar Island** | Mansion, Lab, Seafoam, New Island | |
| Stage 8 | **Viridian City** (return) | Route 22 final rematch, remaining Roll spaces | See §2. |
| Finale | **Indigo Plateau** | Victory Road, Cerulean Cave | After Stage 8. |

Your notes listed Saffron before Fuchsia. I used the games' order (Fuchsia, then Saffron) because the Silph Co. climax is rolled after Gym 6, 7 or 8 and Saffron then lands on Stage 6, which keeps the climax possible at the earliest allowed point. If you want your order, swap the two rows; nothing else depends on it.

### 0.5 Standard rewards and terms
- **Network Machine:** a single-use TM that teaches the chosen Pokémon any move it can learn by level, TM, tutor or egg. Used up on use.
- **Z-forms, Delta forms, Spooky forms:** these exist in your Pokédex file and I use them by name where they fit.
- **Heat, Intel, Rep:** the pack's three scales. Rewards that touch them are marked `Heat+1`, `Intel+2`, `Rep+3`.
- **Hub Town:** a walkable area with shops, the PC and the Move Relearner. Maiden's Peak and Celadon's Department Store behave as hubs.

### 0.6 What I changed or assumed in your version
1. **Names normalized:** Pewder → Pewter, Fushia → Fuchsia, Tentecrule → Tentacruel, Blastoice → Blastoise, Drifblon → Drifloon, Pseduo → Pseudo. The ability/move **Liquidation** is a Water move, so the Tentacool reward gets *Huge Power* as its ability and *Liquidation* as a known move.
2. **Magmuk:** I read this as your **Delta Muk (Fire Cage)** (Ground/Fire), which is in your Pokédex. If you meant a different Pokémon, change the one reference in Fuchsia.
3. **Galarian Grimer does not exist** in the games or in your Pokédex (Galarian Weezing exists, but Grimer has only Alolan and your Delta forms). **Galarian Trubbish does not exist either.** The Black Sludge choice is therefore **Alolan Grimer, Delta Grimer or Trubbish** (base form). Swap in any custom form you have.
4. **Damian's Unofficial Gym** is now an **optional event node** (Roll), not the stage's Gym. All other Gym battles and **Pallet Town** were removed at your request. Section numbers have gaps where removed content was; I kept the numbers so cross-references still work.
5. **Flight North's rescue** (the run-over screen cracking and the bug-type reviving your team) is a **one-time exception to D1** ("losing the climax ends the run"). It is called out in its section and in the table in §12.
6. **Mega and Dynamax forms for the bug-type:** Weedle's line has **Mega Beedrill**; Caterpie's line has **Gigantamax Butterfree** and your **Z-Mega Butterfree**. Both are in your Pokédex file.
7. **Egg moves** for the Hidden Village starters are my best recall; they are marked *(approx.)*. Replace them with your move data.

---

## 1. (Removed)

Pallet Town and all of its spaces were removed at your request. The number is kept so the cross-references in the rest of the document still work.

---

## 2. VIRIDIAN CITY — the first stop and the return
**Stage slots:** Interlude 0 (before Stage 1) and **Stage 8** (a return visit) · **Anchor:** Old Man, Route 22

### 2.1 Interlude 0 spaces

| Space | Kind | Appears |
| --- | --- | --- |
| The Old Man's Lesson | `CUT` | Always |
| Route 22 — The Rival | `MC` | Always |
| Viridian Mart: The Parcel | `EV` | Roll |
| Viridian Trainer School | `EV` | Roll |
| Diglett's Cave | `PS` | Roll |

### 2.2 The Old Man's Lesson (`cs.kanto.viridian.oldman`)
- **Beats:** the Old Man, half-asleep outside the Poké Mart, demonstrates catching. He catches a Weedle for you (a guaranteed catch tutorial).
- **Reward:** *Catching Charm* (first Poké Ball thrown this run has a **+25%** catch bonus), plus **5** Poké Balls.
- **Added:** *The Coffee Joke.* **20%** he has not had his coffee and the lesson becomes a comic fight against his Weedle at level 3. Win and you keep the Weedle (which becomes the seed for §5.4 if you choose to carry it, flag `kanto.weedle.seed`).
- **Flags:** `kanto.weedle.seed`

### 2.3 Route 22 — The Rival (`cs.kanto.viridian.route22`)
- **Beats:** the rival blocks the road to the League gate. The first rival fight of the run. **Added:** a guard at the League gate turns you back and says you need the Badges ("Come back when the whole region has heard of you").
- **Level:** previous stage +2.
- **Reward:** the first Rival Rescue Plan entry is created here (the rival flag is written even if you lose); *Rival Token* (1).
- **At Stage 8:** the rival returns here for a **final rematch** (level previous stage +4), and the Roll spaces already completed are skipped.
- **Flags:** `kanto.route22.fought`, `kanto.route22.rematch`

### 2.4 Viridian Mart — The Parcel (`cs.kanto.viridian.parcel`) — *Added*
- **Beats:** the clerk gives you **Oak's Parcel** to drop off at the next Pokémon Center. Carrying it adds a free detour node; delivering earns the **Pokédex Upgrade** (a one-time scouting bonus: the next five wild encounters show their Ability).
- **Odds:** the parcel is stolen by a Rattata or Meowth **25%** on the way (a Heat-neutral minor fight).
- **Flags:** `kanto.parcel.upgrade`

### 2.5 Viridian Trainer School (`cs.kanto.viridian.school`) — *Added*
- **Beats:** a classroom quiz: three questions about type matchups. Each right answer gives **+1** to a random stat on one Pokémon of your choice (max +3 total).
- **Fail:** no penalty.

### 2.6 Diglett's Cave (`cs.kanto.viridian.diglett`) — *Added*
- **Kind:** `PS` · **Level:** previous stage −1 · **Length:** 3 nodes.
- **Beats:** a tunnel of Diglett and Dugtrio holes. Every node is a pop-up Diglett fight (a swarm of Diglett variants, including **Alolan Diglett** and your **Delta Diglett**). The last node is a Dugtrio duel.
- **Odds:** **20%** the tunnel sprout reveals a **Sand Shrew** den (Sandshrew or Alolan Sandshrew).
- **Reward:** *Soft Sand*, **5%** a Dugtrio with *Sand Veil* and *Tri Attack*.

---

## 3. PEWTER CITY — Stage 1
**Anchor:** Veridian Forest and Mt. Moon · **Pseudo Stages:** Veridian Forest, Mt. Moon · **Hub:** none

| Space | Kind | Appears |
| --- | --- | --- |
| Veridian Forest (with the Samurai) | `PS` | Always |
| Mt. Moon | `PS` | Always |
| Brock's Rest Stop | `EV` | Roll |
| Pewter Museum of Science | `EV` | Roll |
| Magikarp Salesman | `EV` | Roll |
| Pewter Skies: The Flock | `EV` | Roll |

### 3.2 Veridian Forest (`cs.kanto.pewter.forest`, Pseudo Stage)
- **Kind:** `PS` · **Level:** previous stage −1 · **Length:** 6 nodes · **Pool:** Bug, Grass, Poison.
- **Your design (kept):** you catch a Bug-type in the forest; that Pokémon faces the Samurai's Bug-type 1-on-1 at the end. If it wins, you get a new Bug move, **Samurai Slash**, which guarantees a flinch on its first use.
- **Beats:**
  1. Enter. A Caterpie, Weedle or Pinsir-line wild encounter is guaranteed on node 2 (a "forest gift"); you must catch a Bug-type before node 5, or the forest gives you one at node 5 (a **Weedle** that was already waiting).
  2. Nodes 1–4: forest trainers (Bug Catchers). **Added:** nodes 3 and 4 offer a side path each (below).
  3. Node 5: *The Clearing.* A figure in old armor sits on a stump. This is the Samurai.
  4. Node 6: the **Samurai face-off.** A 1-on-1 between your caught Bug-type and the Samurai's Bug-type. Both are set to the same level (the stage's level). No items, no switching.
- **Samurai's Pokémon (approx.):** a **Scyther** (or **Pinsir**), chosen to counter yours (Scyther if yours is weak to Flying, Pinsir otherwise).
- **Reward (win):** **Samurai Slash**, taught to the winning Pokémon.
  - **Move spec:** Bug, Physical, 70 BP, 100% accuracy, 10 PP, makes contact, slicing. **The first time it is used in a battle, the target flinches (100%).** After that it behaves as a plain Bug move. It can be re-taught at the Move Relearner for one Pokémon per run.
- **Fail (loss):** no Pokémon is lost. The Samurai gives you a *Silver Powder* and a bow.
- **Odds / extras (Added):**
  - **Beedrill Swarm** (`MC`, node 3 side path, **40%**): a wave of three Weedle/Kakuna/Beedrill; win and the swarm leaves a **Poison Barb**.
  - **Hidden Honey Tree** (node 4 side path, **30%**): a Combee or Heracross den.
  - **Pokémon Hunters' Trap** (**10%**): a net trap drops on the party; Jessie's balloon is in the sky (a one-line sighting for Flight North).
  - **The Fog** (**10%**): a "forest fog" condition for the whole PS; accuracy −10% for everyone, and the wild Bug pool shifts to Ghost-flavored Bug (Shedinja can appear **1%**).
- **Flags:** `kanto.forest.bug` (species caught), `kanto.forest.samurai.won`.

### 3.3 Mt. Moon (`cs.kanto.pewter.moon`, Pseudo Stage)
- **Kind:** `PS` · **Level:** previous stage · **Length:** 7 nodes · **Pool:** Zubat, Geodude, Paras, Clefairy, Sandshrew, Rock/Ground/Fairy.
- **Your design (kept):** three events inside: **Clefairy Moon Watching**, **Fossil Recovery** and **Gem-Stone Mine**.
- **Tie to the Rocket raid:** the pack's Raid 1 (*Mt. Moon Fossil Dig*) happens at the cave **mouth** (before or after, depending on the raid trigger). If the raid was lost or declined, the Fossil Recovery scientist is **Rocket-allied** and fights with a Rocket team (+1 level); if the raid was a Triumph, the scientist is grateful and gives a bonus fossil.

#### 3.3.1 Clefairy Moon Watching (`cs.kanto.pewter.moon.clefairy`)
- **Kind:** `EV` · **Appears:** always inside Mt. Moon (node 4).
- **Beats:** at midnight a ring of Clefairy dance under the skylight. A dialogue scene with three prompts. Pick the right option for each prompt and you may take a Clefairy for free. It knows **Moonblast**.
- **Added:** the three prompts and their correct answers (so the check is a puzzle, not a coin flip):
  1. *"They are dancing. What do you do?"* — **Watch quietly.** (Wrong: join in, which scares them; clap, which spooks them.)
  2. *"A Clefairy offers you a Moon Stone shard."* — **Offer a berry in return.**
  3. *"The smallest Clefairy hides behind your leg."* — **Let it stay.**
- **Odds:** all three right → Clefairy (with Moonblast) **100%**; two right → **50%**; zero or one → no Clefairy, but a **Moon Stone shard**.
- **Flags:** `kanto.moon.clefairy`.
- **Anime nod:** the Clefairy dance at Mt. Moon and the sky-fallen Moon Stones.

#### 3.3.2 Fossil Recovery (`cs.kanto.pewter.moon.fossil`)
- **Kind:** `EV` · **Appears:** always (node 5).
- **Beats:** a scientist is cracking a fossil out of the wall. Fight him; win and you take the fossil.
- **Level:** previous stage. **Scientist's team:** Magnemite, Voltorb, Koffing (approx.), 3 Pokémon.
- **Reward:** one **random fossil**, weights **Kanto fossils 70%** (Helix, Dome, Old Amber; one-third each) and **other regions 30%**. The fossil is revived at Cinnabar Lab (§10.2); until then it counts as a held fossil item.
- **Added:** if you also have the *Old Amber* from the Pewter Museum (§3.5), the Museum curator's challenge unlocks a second fossil pick.

#### 3.3.3 Gem-Stone Mine (`cs.kanto.pewter.moon.mine`)
- **Kind:** `EV` · **Appears:** always (node 6).
- **Beats:** a wall of ore deposits. Use a **Fighting-type move** on the deposit (a party Pokémon that knows a Fighting move can "punch" it; a prompt appears for each such move). One punch breaks one deposit.
- **Reward:** a **random evolution stone** from a weighted table and a **Rock-type wild encounter** (the deposit's guardian).
  - **Stone weights (approx.):** Moon 22%, Fire 14%, Water 14%, Thunder 14%, Leaf 14%, Sun 12%, Everstone 10%.
  - **Rock encounter:** Geodude, Onix, Rhyhorn, Omanyte-shell fossils, Alolan Geodude or Delta rock forms; a level at the stage level.
- **Added:** if no Pokémon knows a Fighting move, you can *rent a pickaxe* for **₽200** (breaks 1 deposit, no Rock encounter). **10%** the deposit is a **Gem Vein**: a *Rare Candy* and a *Metal Coat*.
- **Flags:** `kanto.moon.mine`.

### 3.4 Brock's Rest Stop (`cs.kanto.pewter.rest`) — *Added*
- **Anime nod:** Brock cooks for the group.
- **Beats:** a camp node. Brock offers **Brock's Stew**: a once-per-run consumable that gives all Pokémon **+1 stage** to a stat of your choice at the start of the next boss fight, and heals each by **15%**.
- **Odds:** the stew is perfect **50%**; weak (heal only) **40%**; Brock burns it **10%** (nothing).

### 3.5 Pewter Museum of Science (`cs.kanto.pewter.museum`) — *Added*
- **Beats:** the museum has an exhibit of fossils. If you hold a fossil you can **register** it: the museum pays in coins and gives a *Fossil Registry* badge. A registered fossil still counts for revival. **Old Amber** is on display; the curator will trade it if you answer a three-question quiz on fossils.
- **Odds:** if you have no fossil the curator hands over a **Fossil Fragment** (a half-fossil that completes with one more).

### 3.6 Magikarp Salesman (`cs.kanto.pewter.magikarp`) — *Added*
- **Beats:** a man on Route 4 sells a Magikarp for ₽500.
- **Odds:** **35%** it is a genuinely good Magikarp (high IVs, *Swift Swim*); **65%** a normal one with the *Splash* joke. Either evolves into a Gyarados you can use at Cerulean (§4.1).
- **Flags:** `kanto.magikarp`.

### 3.7 Pewter Skies: The Flock (`cs.kanto.pewter.flock`) — *Added*
- **Beats:** a Spearow flock harasses a Pidgey. Stop them (a 3-wave horde) and the Pidgey joins you.
- **Anime nod:** the Spearow flock that starts the series.
- **Flags:** `kanto.flock.seen`; seeds §5.4 (the Spearow bully).

---

## 4. CERULEAN CITY — Stage 2
**Anchor:** the Bridge · **Pseudo Stages:** Bridge Crossing/Hidden Village, Cold Nights Rain, Bill's Lighthouse

| Space | Kind | Appears |
| --- | --- | --- |
| Damian's Unofficial Gym | `EV` | Roll (optional) |
| Bridge Crossing | `MC` | Always |
| The Hidden Village | `PS` | Trigger (the 50% fall) |
| Cold Nights Rain | `PS` | Roll |
| Squirtle Squad | `EV` | Roll |
| Bill's Lighthouse | `PS` | Roll |
| Cerulean Burglary | `EV` | Roll |
| Route 5 Day-Care | `SHOP` | Roll |
| Cerulean Cave | `PS` | Locked (after Indigo) |

### 4.1 Damian's Unofficial Gym (`cs.kanto.cerulean.damian`)
- **Kind:** `EV` — an **optional event node**. **Appears:** Roll. Walking past costs nothing, and it is not the stage's Gym.
- **Your design (kept):** a short traditional Gym where you fight **two trainers**, then Damian the Gym Leader.
- **Level:** previous stage. **Reward:** the **Unofficial Badge** (a keepsake item; it does not count toward progress) and **TM Water Pulse**.
- **Added:** *The Sign Reads "Unofficial."* The trainers are two of Damian's friends (a Swimmer and a Fire Spirit Trainer). Damian's team is Water- and Fire-flavored. **The Charmander connection:** in the anime Damian is the trainer who left Charmander on a rock. If Cold Nights Rain (§4.3) rolls Charmander as its Fire-type, Damian is the "previous owner" you fight at the end. If you played his event first, his dialogue there refers to it; if not, he is a stranger who never calls himself a Leader.
- **Flags:** `kanto.cerulean.damian.won`.

### 4.2 Bridge Crossing (`cs.kanto.cerulean.bridge`)
- **Your design (kept):** an event you cannot skip, in the middle of the stage. **50%** you cross safely; **50%** you fall. A fall boots up a Pseudo Stage that contains the **Hidden Village**.
- **Beats (safe):** you cross. **Added:** *Nugget Bridge.* Five trainers wait on the bridge, and at the end a Rocket Grunt offers you a spot on the team ("We pay well"). **Refusing** gives a **Nugget** and *Intel+1*. **Accepting** is a trap: the grunt is a plant, you win a free fight, you get a Nugget, and `rocket.recruit.offered` is set (no other effect; it is a hook for the Stand-with-Them path).
- **Beats (fall):** the bridge breaks, you fall into the river and wake up in a valley. This starts the **Hidden Village** Pseudo Stage (§4.2.1).
- **Flags:** `kanto.bridge.fell`, `rocket.recruit.offered`.

#### 4.2.1 The Hidden Village (`cs.kanto.cerulean.hidden-village`, Pseudo Stage)
- **Kind:** `PS` · **Level:** previous stage · **Length:** 4 nodes plus the village event.
- **Your design (kept):** the Hidden Village has an event tied to it with the **Grass Starters**, a different event for each. All events have the same odds, but only one appears per run. Completing the event rewards you the starter **with its egg move**.
- **How the roll works:** nine events, one per Grass starter, each **1 in 9** (about 11.1%). Exactly one is chosen when the Pseudo Stage is created. A starter you already own in the party still appears as an option and the event still pays out (the reward is a second copy with the egg move).
- **How an event resolves:** each is a short challenge of one or two beats. **Succeed** and you get the starter with its egg move. **Fail** and you get a *Miracle Seed* and may retry once from the first beat.

| # | Starter | Event | Challenge | Egg move *(approx.)* |
| --- | --- | --- | --- | --- |
| 1 | Bulbasaur | **The Venusaur Garden** | Carry water to a wilting giant Venusaur and drive off three Poison-type thieves (3 short fights). | Skull Bash |
| 2 | Chikorita | **Bayleef's Dew** | Find the village's lost dew bottle by following sweet scent clues (3 dialogue picks). | Ancient Power |
| 3 | Treecko | **The Rooftop Race** | Cross a rooftop course against a Treecko elder (a 3-tap timing run). | Crunch |
| 4 | Turtwig | **The Slow Planting** | Plant a sapling and wait three turns of weather (a patience puzzle: choose to wait each time). | Superpower |
| 5 | Snivy | **The Dignity Test** | Greet a proud Snivy with the right manners (3 etiquette picks); a wrong pick makes it turn its back. | Dragon Pulse |
| 6 | Chespin | **The Feast** | Cook a dish for a hungry Chespin; pick ingredients it likes (3 picks from 6). | Pin Missile |
| 7 | Rowlet | **The Night Watch** | Walk a moonlit patrol without waking the village (stealth: avoid 3 sleeping Pokémon). | Defog |
| 8 | Grookey | **The Jam Session** | Match a drum rhythm on tree stumps (a 4-beat repeat game). | Power Whip |
| 9 | Sprigatito | **The Berry Heist** | Chase a Sprigatito who stole your berry and win it back (a 3-node chase). | Leech Seed |

- **Added (village services):** a **Healing Pool** (full heal, once), a **Berry Shrine** (a berry each), and **Village Elder**, who tells a legend of the grass starters (Intel text).
- **Exit:** you climb back to the bridge with a rope. The Hidden Village counts as a Pseudo Stage; the stage does not advance.
- **Flags:** `kanto.hidden.starter` (which event), `kanto.hidden.done`.

### 4.3 Cold Nights Rain (`cs.kanto.cerulean.rain`, Pseudo Stage)
- **Kind:** `PS` (permanent **rain** and **night**) · **Level:** previous stage +1 · **Length:** 5 nodes.
- **Your design (kept):** the opening **cannot be skipped**. A short animation fades in on a rare Fire-type standing out in the rain. The player gets a prompt: **save it** or **go on their way.** The stage has permanent rain and night. At the end you fight the Pokémon's **previous owner**; once you win, the Pokémon warms up to you and asks to join.
- **Which Fire-type (Added):** one of the table below, chosen when the stage is created.

| Fire-type | Weight | Note |
| --- | --- | --- |
| Charmander | 30% | The anime's abandoned Charmander. The previous owner is **Damian**, whether or not you played his optional event. |
| Growlithe / Hisuian Growlithe | 15% | A hunter's lost partner. |
| Vulpix / Alolan Vulpix | 12% | A lost show Pokémon. |
| Ponyta / Galarian Ponyta | 10% | A runaway racing foal. |
| Cyndaquil / Torchic / Chimchar / Tepig / Fennekin / Litten / Scorbunny / Fuecoco | 33% total | One of the other Fire starters, evenly split. |

- **Beats:**
  1. *Opening (unskippable).* The Fire-type shivers on a rock. You choose **Save** or **Leave**. **Leave** ends the Pseudo Stage at once: nothing is gained, nothing is lost, and the next stage begins.
  2. *The Warmth Meter.* After **Save**, the Pokémon follows you as a **Walker** (not a party member). Its **Warmth** starts at 3 of 5 and drops by 1 each rain node; campfire nodes, a Charcoal, a Fire move used on the camp and a Berry restore it. At 0 it faints (this ends the stage as a failure).
  3. *Rain and night rules.* Fire moves are halved in rain; Water moves are boosted; wild encounters are Water/Electric/Ghost-leaning at night.
  4. *The previous owner.* At the end the trainer who abandoned the Pokémon is waiting. A battle (a full team at the stage level).
- **Reward (win):** the Pokémon joins at level equal to the stage, carrying a *Charcoal* (or its signature held item).
- **Fail:** if Warmth reaches 0, the Pokémon is taken by the previous owner and the run goes on; no other cost.
- **Added:** *The Lost Trainer's Letter* (**25%**, on a rain node): a note that gives the previous owner's team type in advance (Intel+1).
- **Flags:** `kanto.rain.fire`, `kanto.rain.saved`.

### 4.4 Squirtle Squad (`cs.kanto.cerulean.squad`)
- **Your design (kept):** fight **three Squirtle**, then a **Wartortle**; if you are **high enough level** you also fight a **Blastoise**. On winning, you are offered a **Squirtle Squad member with its shades**, which knows **Swagger** and **Hex**, with the ability **Contrary**.
- **Level gate (Added):** the Blastoise appears if your highest-level Pokémon is **at least the stage level + 3**.
- **Reward:** the Squad Squirtle. **Held item: Cool Shades** (immune to the Intimidate ability; first use of each status move has +1 priority, announced). It is a normal party member.
- **Added:** the squad stages a **Fire Brigade Prank** before the fight: a hose hazard (the first turn of each battle, a shot of water lowers Speed by 1 on your lead; announced). The Blastoise is the squad's "boss" and uses **Skull Bash** and **Water Spout**.
- **Odds:** **65%** the squad is the pranksters; **35%** it is a **Squad Standoff** (the squad is already beaten by an Officer, so you only fight the Blastoise).
- **Flags:** `kanto.squad.joined`.

### 4.5 Bill's Lighthouse (`cs.kanto.cerulean.bill`, Pseudo Stage)
- **Your design (kept):** a Pseudo Stage where you have to **find Bill's lighthouse**. When you find it, Bill rewards you with **access to his PC**.
- **Level:** previous stage −1 · **Length:** 5 nodes.
- **The search (Added):** the beacon is only visible at night; each node gives a clue (a light on the sea, a ship horn, a Wingull path). Three correct clues (out of five) lead to the lighthouse. A wrong clue sends you back one node.
- **The Teleporter Mishap (Added, from the games):** Bill is stuck in a Pokémon body after a machine accident. Press the console to separate him. He thanks you and gives the **S.S. Anne Ticket**.
- **Reward:** access to **Bill's PC** (Pokémon storage on the road), the **S.S. Anne Ticket** (needed for §5.1), and **Bill's Egg Notes** (Egg Move info).
- **Flags:** `kanto.bill.pc`, `kanto.ssanne.ticket`.

### 4.6 Cerulean Burglary (`cs.kanto.cerulean.burglary`) — *Added*
- **Beats:** a house has a wall smashed in and a Rocket Grunt is escaping with the family's TM. Chase and fight (one battle).
- **Reward:** **TM Dig**. **Heat−1** (Rocket is embarrassed).

### 4.7 Route 5 Day-Care (`cs.kanto.cerulean.daycare`) — *Added*
- **Kind:** `SHOP`. The Day-Care couple raise a Pokémon for you for a stage and return it with +3 levels and an Egg if compatible.

### 4.8 Cerulean Cave (`cs.kanto.cerulean.cave`) — *Added, locked*
- **Appears:** only **after Indigo Plateau**. See §11.3 (Mewtwo).
- **Flags:** `kanto.mewtwo.met`, `kanto.secret`

---

## 5. VERMILION CITY — Stage 3
**Anchor:** the harbor · **Pseudo Stages:** S.S. Anne, Maiden's Peak, Flight North · **Raid:** Kaiju Tentacruel · **Hub:** Maiden's Peak market

| Space | Kind | Appears |
| --- | --- | --- |
| S.S. Anne | `PS` | Roll (needs the Ticket from Bill; see §4.5) |
| Kaiju Tentacruel | `EV` (raid) | Roll |
| Maiden's Peak | `PS` + `HUB` | Roll |
| Flight North | `MC` | **Always** (mandatory check) |
| Diglett Port: The Fan Club Fish | `EV` | Roll |
| Vermilion Harbor Market | `SHOP` | Roll |

### 5.1 S.S. Anne (`cs.kanto.vermilion.ssanne`, Pseudo Stage)
- **Your design (kept):** a **huge** Pseudo Stage with **only trainer battles**. **Every node has two trades:** one is a normal-ish trade, the other always has a **regional Pokémon or a Pokémon with the "region gene"** (Pikachu → Alolan Raichu, for example). At the end is always a **rival fight**, then the ship's captain gives you a **Network Machine**.
- **Appears:** Roll, needs `kanto.ssanne.ticket`. Without the Ticket the dock guard turns you away and the space is unavailable this run.
- **Level:** previous stage +1 · **Length:** 12 nodes on 3 decks (4 nodes per deck: Lower, Main, Upper).
- **Beats:**
  1. *Boarding.* The ship's horn; a sailor takes your ticket.
  2. *Decks.* Every node is a **trainer battle** (no wild encounters) followed by **two trade offers** from passengers.
  3. *The Captain.* After the twelfth node the captain is seasick in his cabin. You help him (a short rub-the-back prompt) and he rewards you.
  4. *The Rival.* The rival stops you on the way off the ship. A full fight.
  5. *Reward.* The **Network Machine**.
- **The trades (your design, specified):**
  - **Trade A — the normal trade:** you give a Pokémon of your choice; you get a Pokémon of the same level and a similar stat total (within ±40 BST) from the Kanto pool, with a random Nature. 1-for-1.
  - **Trade B — the region trade:** you hand over a **base-form** Pokémon that has a regional or "region gene" counterpart; you get the regional version at the same level. Only offered if your party or box contains a matching Pokémon; otherwise it offers a different regional Pokémon in exchange for any one.
  - **Trade table (what the passengers want and give; all species are in your Pokédex file):**

| You give | You get |
| --- | --- |
| Pikachu | Alolan Raichu |
| Raichu | Alolan Raichu |
| Rattata / Raticate | Alolan Rattata / Alolan Raticate |
| Sandshrew / Sandslash | Alolan Sandshrew / Alolan Sandslash |
| Vulpix / Ninetales | Alolan Vulpix / Alolan Ninetales |
| Diglett / Dugtrio | Alolan Diglett / Alolan Dugtrio |
| Meowth / Persian | Alolan Meowth / Alolan Persian (or Galarian Meowth) |
| Geodude / Graveler / Golem | Alolan Geodude / Graveler / Golem |
| Grimer / Muk | Alolan Grimer / Alolan Muk |
| Exeggcute / Exeggutor | Alolan Exeggutor |
| Cubone / Marowak | Alolan Marowak |
| Ponyta / Rapidash | Galarian Ponyta / Galarian Rapidash |
| Slowpoke / Slowbro | Galarian Slowpoke / Galarian Slowbro |
| Farfetch'd | Galarian Farfetch'd |
| Koffing / Weezing | Galarian Weezing |
| Mr. Mime | Galarian Mr. Mime |
| Growlithe / Arcanine | Hisuian Growlithe / Hisuian Arcanine |
| Voltorb / Electrode | Hisuian Voltorb / Hisuian Electrode |
| Qwilfish | Hisuian Qwilfish |
| Any Pokémon with a **Delta** form | Its Delta form (rare: 1 offer per ship) |

  - **Rules:** a regional trade-in never loses a held item; the traded-for Pokémon keeps the same level and gains **+1 Friendship**; a regional trade can be taken **once per node**.
- **The Network Machine** is described in §0.5. **Added:** the machine is single-use, as you specified. The captain also gives a *Captain's Compass* (see below).
- **Added (more S.S. Anne):**
  - **The Galley** (node 3): a chef gives you a **Meal** that heals and gives one temporary buff (random from 5).
  - **The Stowaways** (node 7, **20%**): Jessie, James and Meowth are hiding in a barrel; a comic double battle with their Rocket Remnants team. **Reward:** *Rocket Remnants* intel (Intel+1) and a ruined balloon (a hook for §5.4).
  - **The Passenger Duel** (node 9, **30%**): a rich passenger challenges you to a high-stakes 2-on-2 for a *Premium Ball*.
  - **The Pokémon Cup** (node 10, **15%**): a ship-deck tournament, 3 rounds, for a *Rare Candy*.
  - **The Captain's Compass:** a held item that lets the holder see wild encounter levels in the next Pseudo Stage.
- **Fail:** if you black out, you are put ashore at Vermilion with no loss except the trades you did not take.
- **Flags:** `kanto.ssanne.done`, `kanto.ssanne.machine`.

### 5.2 Kaiju Tentacruel (`cs.kanto.vermilion.kaiju`)
- **Your design (kept):** fight a **giant raid Tentacruel** (not Dynamax) to earn a **Tentacool with Huge Power and Liquidation**.
- **Kind:** `EV` raid · **Level:** previous stage +3 · **Format:** a single raid boss with shields.
- **The boss (Added):** the harbor's Tentacruel has grown huge after the harbor pollution (a Pokémon that is big, not Dynamax). It uses **Wrap**, **Acid Armor**, **Hydro Pump** and a signature **Tidal Surge** (clears hazards and hits both sides). It has **three shield bars**; at each bar it summons Tentacool.
- **Anime nod:** the giant Tentacruel that wrecks a harbor town.
- **Reward:** a **Tentacool** with ability **Huge Power**, knowing **Liquidation**. It evolves normally. Also **Poison Barb** and **Mystic Water**.
- **Added:** *Raid Support Boats.* Optional: the harbor boats give you +1 helper turn per shield (one extra attack from a Water-type NPC).
- **Fail:** the Tentacruel retreats; the harbor market is closed this stage (no Harbor Market).
- **Flags:** `kanto.kaiju.won`.

### 5.3 Maiden's Peak (`cs.kanto.vermilion.maiden`, Pseudo Stage + Hub)
- **Your design (kept):** a Pseudo Stage where you **chase down a mysterious lady**. In the stage is a **huge bustling market** with tons for sale, a **specific-move TM shop**, a **trading district** and an **egg district**; it is a **walkable area just like Hub Town**. At the end you catch up to the lady, but she **vanishes into thin air**. She leaves behind the **Fairium-Z**; **if you already have it she leaves behind three Fairy HMs.**
- **Level:** previous stage · **Length:** 6 nodes plus the walkable market.
- **Anime nod:** the Ghost of Maiden's Peak legend.
- **The chase (Added):** the lady is glimpsed five times (a veil, a lantern, a laugh, a footprint in frost, a reflection). At each sighting you choose which way to run (left or right); two correct turns out of the first three let you reach her at the top, otherwise you reach the top by the long route and she is gone already (the reward is the same, but you skip the **Lady's Blessing**, below).
- **The market districts (Added):**

| District | What it sells or does |
| --- | --- |
| **Lantern Row** | Consumables: Potions, Revives, status cures, Poké Balls. Prices +10%. |
| **TM Hall — the specific-move shop** | You choose a **move** from a board of 24 (rotating) and buy its TM at a fixed price (₽ by power). Moves are grouped by type. |
| **Swap Alley — the trading district** | Trade a Pokémon with a market trader: three offers per visit, each a 1-for-1 with a stat-total range and an optional Nature pick. |
| **Egg Row — the egg district** | Buy a mystery Egg (₽ price), trade an Egg, hatch an Egg for steps, and use the **Egg Move Tutor** (one egg move taught per visit, price by rarity). |
| **The Tea House** | Rest (full heal); an old woman shares a clue about the lady (Intel). |

- **The ending (kept):** she vanishes. **Reward:** **Fairium-Z** (a Z-Crystal for Fairy-type Z-Moves). If you already hold it: **three Fairy HMs** (a reusable TM each). **Proposed HMs (approx.):** Dazzling Gleam, Play Rough, Moonblast (fieldless HMs: they can be taught to any Pokémon that can learn them).
- **Added:** the **Lady's Blessing** (if you caught her on the first route): a *Fairy Feather* (a Fairy-type boost item) and the Tea House stays open as a Hub for the rest of the run.
- **Flags:** `kanto.maiden.zcrystal`, `kanto.maiden.hms`, `kanto.maiden.blessing`.

### 5.4 Flight North (`cs.kanto.vermilion.flightnorth`) — the big one
- **Your design (kept, restated in full):**
  - **A mandatory check.** **50%** nothing happens. **50%** Jessie, James and Meowth steal all your Pokémon.
  - If they steal your Pokémon, you **black out** and wake in a new **Pseudo Stage** where you have **no Pokémon**.
  - You go to the first node and a **Spearow** appears and **bullies** you; a **Caterpie or Weedle** appears and knocks the Spearow out. This **Bug-type is the only Pokémon you have** in the Pseudo Stage.
  - Going through the stage, the Pokémon should **evolve to its final stage**. At the end you face **Jessie/James/Meowth's Venomoth**. If you begin to lose, a **shiny version of your Bug-type** appears and knocks out the Venomoth. At the end you say goodbye to your Bug-type and carry on with your original team.
  - The Pseudo Stage's **level range is 5–20**. If the Pokémon hasn't evolved by the trainer battle, it **evolves in battle through love for its trainer**.
  - **Later:** if you **lose your run**, the game-over screen shows, then **cracks repeatedly before shattering** to reveal the Bug-type. The Bug-type **revives your whole team** and fights alongside you as its **Mega Form or Dynamax Form**. Once you win the battle your Bug-type came back for, you are prompted to **carry it with you for the journey**. It will have its **Mega Stone** and a signature move, **"North's Wind"**. That move **revives one of your team members, then boosts the user's Special Attack and Speed.**
- **Kind:** `MC` then `PS` · **Level:** 5–20 (scaled across the stage) · **Length:** 7 nodes.

#### 5.4.1 The check
- **Odds:** the check rolls **50 / 50**. **Added:** each of these shifts the 50%: a Squirtle Squad member in the party (−5% theft chance, they "know the trio's tricks"), a Pokémon with Rocket-hate (−5% if `rocket.heat ≥ 30`), the Stowaways seen on the S.S. Anne (+5%, they know your face).
- **The theft (Added):** a short scene: the trio's balloon descends with the "Prepare for trouble" motto, a net falls, and the player's party is whisked away. *"Meowth, that's right!"* The party is stored; none of it is lost for good. `kanto.flight.stolen=true`.

#### 5.4.2 The Pseudo Stage — "Flight North"
- **The start:** you wake in a field, no Pokémon, no Poké Balls. The first node is the **Spearow bully**: it attacks you (a cutscene, not a battle).
- **The rescuer:** a **Caterpie or Weedle** (50% each, or the one you carried from Viridian if `kanto.weedle.seed` exists) knocks the Spearow out. It follows you. It is your **only Pokémon** until the stage ends. **Added:** the Spearow flock (§3.7) is the bully's flock if `kanto.flock.seen`.
- **Evolution path (specified):**
  - **Caterpie line:** Caterpie (L5) → Metapod (L7) → **Butterfree** (L10). *Mega/Dynamax form:* **Gigantamax Butterfree** (or your **Z-Mega Butterfree** if you prefer the Mega version).
  - **Weedle line:** Weedle (L5) → Kakuna (L7) → **Beedrill** (L10). *Mega form:* **Mega Beedrill**, holding **Beedrillite**.
  - The stage levels it at about one level per node; it reaches the final stage by node 5 in the normal case.
- **Nodes (Added):**
  1. The Spearow bully (cutscene).
  2. *The Meadow* — wild battles at level 5–7 with your Bug-type alone. Two weak wild fights.
  3. *Cocoon Night* — the Bug-type evolves into its cocoon; a rest node.
  4. *The Stream* — a tougher wild battle.
  5. *Hatching* — it evolves into its final stage. A wild flock of Pidgey is beaten with it.
  6. *The Trio's Camp* — the trio's camp, fought from the shadows; they hold your Pokémon in a cage.
  7. *The Boss* — Jessie/James/Meowth's **Venomoth**.
- **The boss fight (kept):** your Bug-type (level 18–20) against the trio's **Venomoth** (level 20). If you begin to lose (**your Bug-type drops below 25% HP**), a **shiny version of your Bug-type** appears and knocks out the Venomoth with one move (cutscene). The trio blast off.
- **Evolution by love (kept):** if your Bug-type has not reached its final stage by the Venomoth fight, it evolves mid-battle through its bond.
- **The goodbye (kept):** the shiny Bug-type and your Bug-type say goodbye; the Pseudo Stage ends; your original team is returned. Nothing is lost.
- **Reward:** *Gratitude* (a bond flag). **No Pokémon is gained here.**

#### 5.4.3 The Return (Second Wind)
- **When:** you **lose a run** after Flight North has happened (`kanto.flight.stolen=true`), at any point.
- **Beats:**
  1. The game-over screen appears.
  2. It **cracks** several times.
  3. It **shatters** to reveal your Bug-type in its Mega or Gigantamax form (Beedrill, or Butterfree).
  4. It **revives your whole team** at full HP and fights alongside you.
  5. You fight the **same battle again**, with the Bug-type as a **temporary seventh member** (not a Mega Stone slot).
- **Win:** you are prompted: **carry them with you for the rest of the journey?** If yes, the Bug-type joins as a permanent party member. It carries its **Mega Stone** (Beedrillite for Beedrill) or its Gigantamax factor (Butterfree), and knows **North's Wind**.
- **Lose again:** the run ends. This rescue is **once per run**, and it does not stack with other rescues.
- **North's Wind (move spec):** Flying, Status, targets the user's side, 100% accuracy, 5 PP. **Revives one fainted party member at 50% HP, then raises the user's Special Attack and Speed by 1 stage each.** Fails if no party member has fainted.
- **Conflict with D1:** D1 says losing the climax ends the run. **This rescue is an exception, once per run, and only if Flight North happened.** It also applies at the climax. If you do not want it to apply at the climax, set `rescue.climaxEligible=false` in the region file.
- **Flags:** `kanto.flight.stolen`, `kanto.flight.bug`, `kanto.flight.rescue.used`, `kanto.flight.keeps`.

### 5.6 More Vermilion (`Roll`) — *Added*
- **Diglett Port: The Fan Club Fish** (`cs.kanto.vermilion.fishclub`): a fisher teaches you the Fishing mini-game; reward: *Good Rod* and a Basculin or Corphish.
- **Vermilion Harbor Market** (`cs.kanto.vermilion.market`): sells Water-type items; sells a **Ticket** for the S.S. Anne for ₽2,000 if you lost it (the Ticket is otherwise a Bill reward).

---

## 6. LAVENDER TOWN — Interlude 3
**Slot:** between Stage 3 and Stage 4 · **Anchor:** Pokémon Tower · **Pseudo Stages:** Pokémon Tower, Power Plant, Rock Tunnel

| Space | Kind | Appears |
| --- | --- | --- |
| Pokémon Tower | `PS` | Always |
| Mr. Fuji's House | `EV` | Roll |
| Pokémon Fan Club | `EV` | Roll |
| Rock Tunnel Blackout | `PS` | Roll |
| Abandoned Power Plant | `PS` | Roll |
| Lavender Volunteers | `SHOP` | Roll |
| Haunter's Prank | `EV` | Roll |

### 6.1 Pokémon Tower (`cs.kanto.lavender.tower`, Pseudo Stage)
- **Kind:** `PS` · **Level:** previous stage · **Length:** 7 floors (7 nodes).
- **Two versions:** if the Rocket raid *Pokémon Tower* is active (`pr.kanto.pokemon-tower`), this is the **raid**. If it is not, this is the **ordinary tower**: a graveyard of Ghost-types and mourners.
- **Beats (ordinary tower):**
  1. *The Graves.* Floors of memorial stones. Ghost-type wild encounters are invisible without the **Silph Scope** (they appear as "???"). Without the Scope, you may only fight Channelers.
  2. *The Channelers.* Possessed mediums fight with Ghost-types. A Channeler's possession ends when you win.
  3. *The Marowak.* On the top floors a ghost Marowak guards the grave of its child (a Cubone). You cannot capture it. Beating it releases it.
  4. *The Top.* An old man (Mr. Fuji) is trapped (see §6.2).
- **The Memorial Wall (Added, roguelike hook):** a wall of names. Every Pokémon that has fainted **permanently in this run** is listed. You may leave flowers for any of them. Each flower is a **Parting Gift** from the ghosts: a *Spell Tag*, a *Soul Dew* shard, or a random Ghost-type egg. Capped at three gifts.
- **Haunter's Ghost (Added, anime nod):** **25%** a Haunter plays a prank on you (a short minigame). If you laugh along (a prompt), it gives you a *Spell Tag*; if you chase it, you fight it.
- **Reward:** *Silph Scope*, **Cubone with Lightning Rod and Bone Rush** (if you released the Marowak), and the **Pokémon Tower Scroll** (a stat boost for Ghost-types).
- **Flags:** `kanto.tower.cleared`, `kanto.tower.memorial`.

### 6.2 Mr. Fuji's House (`cs.kanto.lavender.fuji`) — *Added*
- **Beats:** Mr. Fuji runs a home for lost Pokémon. Adopt one of three (a baby-stage Pokémon) with a stat bonus.
- **Reward:** the adoptee, **Poké Flute** (wakes sleeping Pokémon in the field; used by Snorlax events) and **Fuji's Blessing** (+1 Friendship to the whole party).

### 6.3 Pokémon Fan Club (`cs.kanto.lavender.fanclub`) — *Added*
- **Beats:** the chairman talks for a long time about his Rapidash. Listen (a patience prompt) and he gives you a **Bike Voucher** (a movement bonus: skip one node per stage). Interrupt him and he gives you a Poké Doll.
- **Anime nod:** the endlessly proud fan.

### 6.4 Rock Tunnel Blackout (`cs.kanto.lavender.rocktunnel`, Pseudo Stage) — *Added*
- **Kind:** `PS` · **Level:** previous stage · **Length:** 5 nodes · **Condition:** **dark cave** (accuracy −10%, wild encounters hidden).
- **Beats:** a cave with no light. You need **Flash** (a move or a *Flashlight* item) to see the encounters. Without it, each node's encounter is random and you cannot flee.
- **Reward:** *Flashlight*, **Onix** with Sturdy, **TM Rock Slide**.

### 6.5 Abandoned Power Plant (`cs.kanto.lavender.powerplant`, Pseudo Stage) — *Added*
- **Kind:** `PS` · **Level:** previous stage +2 · **Length:** 6 nodes.
- **Beats:** an old plant full of Voltorb and Electrode disguised as items. At the end, **Zapdos** (a roaming legendary, level-fixed, catchable at low odds). **Anime nod:** the Electric legendary of the plant.
- **Odds:** the boss is Zapdos in **40%**; otherwise an Electrode horde.
- **Reward:** *Magnet*, *Thunder Stone*, and Zapdos if caught.

### 6.6 Lavender Volunteers (`cs.kanto.lavender.volunteers`) — *Added*
- **Kind:** `SHOP`. They sell Ghost-type goods: *Spell Tag*, *Ghost Gem*, *Escape Rope*. They also revive a fainted Pokémon once, for ₽500.

---

## 7. CELADON CITY — Stage 4
**Anchor:** the Department Store · **Raid tie:** the Celadon Hideout (Raid 2) · **Hub:** Department Store

| Space | Kind | Appears |
| --- | --- | --- |
| Celadon Department Store | `HUB` | Always |
| Game Corner | `EV` | Roll |
| Celadon Mansion | `EV` | Roll |
| Eeveelution Brothers | `EV` | Roll |
| Tea House & Gardens | `SHOP` | Roll |
| Perfume Heist | `EV` | Roll |
| Rooftop Vending | `EV` | Roll |

### 7.2 Celadon Department Store (`cs.kanto.celadon.mart`, Hub)
- **Kind:** `HUB` with six floors:
  1. **Service counter** — healing.
  2. **Trainer's Market** — Potions, Poké Balls.
  3. **TM Counter** — fixed TMs (5 per visit, rotating).
  4. **Wise Man** — type-boosting items.
  5. **Evolution Stones** — one of each Kanto stone (prices ×1.5).
  6. **Rooftop** — vending machines (see §7.8).
- **Added:** a **Doll Floor** (a Poké Doll to escape one battle).

### 7.3 Game Corner (`cs.kanto.celadon.gamecorner`)
- **Kind:** `EV` · The Game Corner is the cashbox of the Rocket arc (see the Rocket script, §8).
- **Beats:** a coin-slot mini-game: **buy** coins at ₽10 each; the slot machines pay out with a **luck stat** (your Pokémon with Lucky Egg/Amulet Coin raise the odds).
- **Prizes (Added):** Abra, Clefairy, Scyther or Pinsir, Porygon, Dratini (in the originals); here five prizes drawn from **five tiers** (a common, uncommon, rare, very rare, jackpot) with a coin price each.
- **The back machine (Rocket tie):** if the Rocket raid is active, the machine in the back never pays out (a Rocket plant); pulling the lever seven times opens the stairway to the Hideout (the raid entry).
- **Fail:** lose all your coins and the Game Corner gives you a *Bad Luck Charm* (−1 Luck for a stage). Heat is unaffected.

### 7.4 Celadon Mansion (`cs.kanto.celadon.mansion`)
- **Kind:** `EV` · Four floors:
  1. **Lobby** — gift of an **Eevee** (see §7.5 for the Eeveelution twist).
  2. **Game Freak room** — shows your Pokédex progress; at certain counts you earn a **Diploma** (a permanent bonus).
  3. **Rooftop** — a quiet view; a Pokémon you leave here for a stage gains friendship.
  4. **The Mansion Secret** — a Rocket plan on the wall (Intel+2) if the Rocket arc is active.
- **Reward:** Eevee (level 5), the Diploma, and *Mansion Key*.

### 7.5 Eeveelution Brothers (`cs.kanto.celadon.eevee`) — *Added*
- **Anime nod:** Rainer, Sparky and Pyro, the three brothers who each have an Eeveelution and each ask you to pick an Eeveelution stone.
- **Beats:** three brothers, three stones (Water, Thunder, Fire). You may pick **one**. Whichever you pick, the brother who loses is angry and **fights you** (a 1-on-1). Win the fight and you earn the **Eeveelution** that matches the stone, at the level of the stage.
- **Odds:** the stone you pick is the Eevee evolution you receive (**100%**). **25%** a fourth brother appears with a Leaf or Ice Stone (Leafeon/Glaceon).
- **Reward:** the Eeveelution and the matching evolution stone.
- **Flags:** `kanto.eevee`.

### 7.6 Tea House & Gardens (`cs.kanto.celadon.tea`) — *Added*
- **Kind:** `SHOP`. Erika's tea restores PP and cures status for the whole party. A *Rest* option fully heals for ₽300.

### 7.7 Perfume Heist (`cs.kanto.celadon.perfume`) — *Added*
- **Anime nod:** the Rocket trio in disguise at Erika's perfume garden.
- **Beats:** the garden's perfume is being stolen by "gardener girls" who are really the trio. You can unmask them (a clue puzzle) and fight them in a double battle (their Rocket Remnants team) or look away.
- **Reward:** **Perfume Vial** (a Grass-type boost item). Unmasking gives `Rep+2`.

### 7.8 Rooftop Vending (`cs.kanto.celadon.rooftop`) — *Added*
- **Beats:** three drink machines (Fresh Water, Soda Pop, Lemonade). Buy any of them (₽200–350). A thirsty guard at a later stage trades something rare for a drink: store them.
- **Anime nod:** none; this is a callback to the games' Saffron guards.
- **Reward:** the drinks, usable as healing (heal 30/50/70 HP).

---

## 8. FUCHSIA CITY — Stage 5
**Anchor:** Safari Land · **Pseudo Stages:** Polluted Factory, Deep Savanna, Lush Jungle · **Zone:** Safari Land

| Space | Kind | Appears |
| --- | --- | --- |
| Polluted Factory | `PS` | Roll |
| Safari Land | `EV` (zone) | Roll |
| Deep Savanna | `PS` | Roll |
| Lush Jungle | `PS` | Roll |
| Warden's Gold Teeth | `EV` | Roll (needs Safari Land) |
| Tauros Stampede | `EV` | Roll (inside Safari Land) |
| Fuchsia Zoo | `SHOP` | Roll |
| The Snag Test | `EV` | Roll (roaming cameo, §12.2) |

### 8.2 Polluted Factory (`cs.kanto.fuchsia.factory`, Pseudo Stage)
- **Your design (kept):** go through a Pseudo Stage where you fight **all kinds of grimy and gunky Pokémon**. The final Pokémon is a **raid battle against Magmuk (Uncatchable)**. When you win you are given **Black Sludge** and the **choice** between three Pokémon.
- **Kind:** `PS` · **Level:** previous stage +1 · **Length:** 6 nodes.
- **The pool:** Grimer, Muk, Koffing, Weezing, Trubbish, Garbodor, Stunky, Skuntank, Alolan Grimer and Muk, Delta Grimer and Muk, Galarian Weezing, Gulpin, Swalot. Wild fights here carry a **Sludge** field condition: Poison moves +10% for everyone; the Steel-types take no damage from it.
- **Nodes (Added):**
  1. *The Gate.* A foreman asks you to sign a waiver (a joke prompt).
  2. *The Pipes.* Pipe hazards: a pipe bursts after the first turn and applies **Poison** to the lead (a 25% roll; Poison types are immune).
  3. *The Vats.* A worker battle (a Scientist).
  4. *The Sludge Trench.* A horde of three Grimer.
  5. *The Control Room.* A short puzzle: close three valves (3 dialogue picks) to avoid the boss's first-turn **Toxic Spikes**.
  6. *The Furnace.* The raid.
- **The raid boss — Magmuk (Uncatchable):** I read this as your **Delta Muk (Fire Cage)** (Ground/Fire). It is a raid with shields; it **cannot be caught**. **Moves (suggested):** Earth Power, Flamethrower, Gunk Shot, Sludge Wave. It adds **Molten Sludge** to the field on its first turn: a field that hurts non-Fire, non-Poison, non-Ground Pokémon by 1/16 per turn.
- **Reward (win):** **Black Sludge**, and your **choice of one**:
  - **Alolan Grimer** (Poison/Dark, *Poison Touch*, hidden *Power of Alchemy*)
  - **Delta Grimer** (Ground, *Stench* / *Sticky Hold*, hidden *Poison Touch*)
  - **Trubbish** (Poison, *Stench* / *Sticky Hold*, hidden *Aftermath*)
  *(Your notes listed "Galarian Grimer" and "Galarian Trubbish". Neither exists, so I used the base Trubbish; see §0.6 item 3.)*
- **Fail:** the factory shuts; the Pokémon you caught here are lost (wild ones only; your party is safe).
- **Flags:** `kanto.factory.cleared`, `kanto.factory.pick`.

### 8.3 Safari Land (`cs.kanto.fuchsia.safari`)
- **Your design (kept):** it **acts like normal Safari Zone logic** but with a **huge population of possible Pokémon**.
- **What "normal Safari logic" means here:** an entry fee (₽500), **30 Safari Balls**, a step limit (**500 steps**), no battles. In each encounter you can **throw a ball, throw bait, throw a rock, or run**. Bait makes the Pokémon easier to catch but more likely to flee; a rock makes it angrier (harder to catch, less likely to flee). Your own Pokémon do not fight.
- **The population (Added):** four areas (Center, Area 1, Area 2, Area 3). Each area draws from the **whole Kanto pool plus a rotating 40% of Pokémon from other regions** (a few rare regional forms), with **rarity weights** so the same Safari is different every run. The **Deep Savanna** (§8.4) and **Lush Jungle** (§8.5) are Pseudo Stages that are reached from Safari Land's far gate and carry their own pools.
- **Odds:** **8%** a rare "star" Pokémon (Chansey, Kangaskhan, Tauros, Scyther, Pinsir, Dratini, Dragonair or Heracross). **2%** a Pokémon with a Delta or Hisuian form.
- **Flags:** `kanto.safari.balls`, `kanto.safari.steps`.

### 8.4 Deep Savanna (`cs.kanto.fuchsia.savanna`, Pseudo Stage)
- **Your design (kept):** a Pseudo Stage with **Ground-types and sand-related Pokémon**.
- **Kind:** `PS` · **Level:** previous stage +1 · **Length:** 6 nodes · **Condition:** **sandstorm** on every battle's first turn (Rock/Ground/Steel take no damage).
- **Pool (Added):** Sandshrew, Alolan Sandshrew, Trapinch, Hippopotas, Diglett, Cacnea, Maractus, Sandile, Krokorok, Gible, Larvitar, Rhyhorn, Tauros, Heliolisk, Dunsparce, Stunfisk, Palossand.
- **Nodes (Added):** two watering holes (heal 30%); a **Dust Devil** (a hazard: the lead loses 1/8 HP and Speed −1); a **Dune Duel** (a ground-type trainer); and a **Sandstorm Camp** (rest).
- **Reward:** *Soft Sand*, *Smooth Rock*, **Gible** with Rough Skin, or a **Trapinch** (a choice of one).
- **Odds:** **10%** the oasis at node 4 hides a **Sand Veil** Diglett group.

### 8.5 Lush Jungle (`cs.kanto.fuchsia.jungle`, Pseudo Stage)
- **Your design (kept):** a Pseudo Stage with **lots of Grass and Poison types**.
- **Kind:** `PS` · **Level:** previous stage +1 · **Length:** 6 nodes · **Condition:** **humid** (Grass moves +10%, Fire moves −10%).
- **Pool (Added):** Oddish, Gloom, Bellsprout, Weepinbell, Paras, Exeggcute, Tangela, Venonat, Ledian, Foongus, Bounsweet, Roselia, Budew, Seedot, Lotad, Petilil, Spinarak, Ariados.
- **Nodes (Added):** two vine hazards (a tangle that skips your first move); a **Poison Spore cloud** (a Poison status roll); a **Hidden Ruin** (a clue puzzle); a **Jungle Chief** trainer; and a **Treehouse** (rest).
- **Reward:** *Miracle Seed*, *Black Sludge*, **Tangela** with Chlorophyll, or **Foongus** with Regenerator (a choice of one).
- **Odds:** **15%** a **Venusaur** is sleeping at the heart of the jungle (a catchable bonus boss).

### 8.6 Warden's Gold Teeth (`cs.kanto.fuchsia.warden`) — *Added*
- **Beats:** the Safari Warden has lost his gold teeth somewhere in the Zone. Find them (a three-node search). In return he gives **TM Strength** and a **Safari Pass** (an extra 10 Safari Balls).
- **Odds:** the teeth are in the Center **40%**, Area 2 **35%**, Area 3 **25%**.

### 8.7 Tauros Stampede (`cs.kanto.fuchsia.tauros`) — *Added*
- **Anime nod:** the herd of Tauros.
- **Beats:** a rumbling. A herd of Tauros charges. Choose **dodge**, **bait** or **rock**. A Tauros herd of up to 6 can be caught with the Safari Balls you have left; each caught Tauros past the first becomes a *Tauros Charm* (an item that boosts physical Normal moves).
- **Odds:** dodge **100%** safe, no catch; bait **40%** per ball; rock **25%** per ball but the herd stampedes (−1 ball per throw).
- **Reward:** Tauros (Intimidate), **Tauros Charm** items.

### 8.8 Fuchsia Zoo (`cs.kanto.fuchsia.zoo`) — *Added*
- **Kind:** `SHOP`. See rare Pokémon (Intel on a type), and the Zoo sells a **Rare Candy** at ₽10,000 once.

---

## 9. SAFFRON CITY — Stage 6
**Anchor:** Sabrina's Labyrinth · **Pseudo Stages:** Sabrina's Labyrinth · **Climax site:** Silph Co. · **Hub:** none

| Space | Kind | Appears |
| --- | --- | --- |
| Sabrina's Labyrinth | `PS` | Roll |
| Route 25 | `MC` | **Always** |
| Fighting Tournament | `EV` | Trigger (needs the Mankey) |
| Fighting Dojo | `EV` | Roll |
| Copycat Girl | `EV` | Roll |
| Silph Co. Lobby | `CUT` | Always (sets up the climax) |
| Magnet Train | `EV` | Roll |

### 9.2 Sabrina's Labyrinth (`cs.kanto.saffron.labyrinth`, Pseudo Stage)
- **Your design (kept in full):**
  - **If initiated**, your Pokémon are **scattered** throughout a Pseudo Stage. With no Pokémon, the **first fight in the stage ends in a loss no matter what.**
  - After the battle, a **tombstone** appears on screen, then a **swarm of ghost types** flies behind it, then it fades into a new cutscene.
  - A **Shuppet, Duskull, Drifloon or Ghastly** flies up and **offers to help** you get your body and your Pokémon back. That Pokémon is the **only usable Pokémon** in the stage.
  - You play through the stage and **collect your Pokémon**, but you **cannot use them until you get your body back.**
  - If you **lose in your ghost form** you don't actually lose; you go back to the **start state of the stage with zero progress**.
  - At the end of the stage your Pokémon should be **fully evolved** (bend levels; **Dusclops evolves from love** during the battle).
  - The end of the stage initiates a battle between **Sabrina and her Alakazam**. If you are about to lose, the Ghost-type **commands all the other ghosts around it to attack Alakazam**, ending her and **returning your body**. The Ghost-type bids you farewell and disappears; the Pseudo Stage is over.
  - **In the next region, at the parallel stage where you found this Pokémon**, the stage opens on a **black screen with a jumpscare** of the Pokémon. It then **asks to join your team**, always **holding its Mega Stone** if it has one, with the signature move **"Haunting"**.
  - **"Haunting"** unleashes an army of **stage-one Ghost-types** at the enemy and gives the enemy a new status, **"Haunted"**: a turn lowers a random stat, then a turn rolls confusion, then the cycle repeats.
- **Appears:** Roll. **How it starts (Added):** a fortune-teller offers to "read your aura" (an optional prompt) or a town guide offers a "special entrance". Accepting starts the Labyrinth. The fight with Sabrina at the end is part of this space. Whether winning it also counts as the stage's Gym win is a switch, `saffron.labyrinth.countsAsGym` (default **off**, because Gym battles are handled by the base game).
- **Level:** the ghost scales from **L10 to L40** across the stage (bend levels so it is fully evolved at the end); the first (scripted) loss is at stage level. Alakazam is the ghost's level +2, capped at the stage level +6.
- **Length:** 7 nodes. Your party is split into **up to six pieces**, one in each of nodes 1–6; node 7 is Sabrina.
- **Which ghost (Added):** four options, equal weights (**25%** each):

| Ghost | Line | Final form | Stone / bond | Evolves |
| --- | --- | --- | --- | --- |
| Shuppet | Shuppet → Banette | **Banette** (Mega: Banettite) | holds **Banettite** | L37; at the end of node 5 under the stage's level bend |
| Duskull | Duskull → Dusclops → Dusknoir | **Dusknoir** | no Mega | Dusclops → Dusknoir by **love** during the Alakazam fight (bend levels as stated) |
| Drifloon | Drifloon → Drifblim | **Drifblim** | no Mega | L28 under the level bend |
| Ghastly | Ghastly → Haunter → Gengar | **Gengar** (Mega: Gengarite) | holds **Gengarite** | Haunter at 25, **Gengar by love** in the battle |

- **The collection nodes (Added):** each of nodes 1–6 shows one of your party members trapped in a "shadow lantern". Free it by clearing the node's trial: a battle with a ghost-possessed trainer, a mirror puzzle, a memory game, a choice of two doors, a balance test, and a final riddle. **You can't use the freed Pokémon yet**; they follow you as spirits.
- **Ghost-form rules:** the ghost fights alone (a 1-Pokémon party). A wipe returns you to the start of the stage with no progress, the freed Pokémon remain freed. Using a Revive does nothing. Healing is by campfire nodes only.
- **The farewell (kept):** the Ghost-type leaves. Your body and all your Pokémon return.
- **Next-region return (kept, specified):** `kanto.sabrina.ghost = <species>` is stored in the run. In **the next region's Stage 6** (the same stage number, "the parallel stage"), that stage opens on a black screen with a jump-scare of the Pokémon, then offers to join. It comes **at the level of that stage**, holding its Mega Stone if it has one, and knowing **Haunting**. If the next region has no Stage 6, the return fires at the closest stage. If there is no next region, it appears at the end of the run as a final-boss helper.
- **Haunting (move spec):** Ghost, Status, targets the foe's side, 100% accuracy, 5 PP. **Summons four stage-one Ghost-type spirits that each strike once (power 25, ignoring Substitute), then applies *Haunted*.** **Haunted:** at the end of the foe's turn 1: a random stat −1; turn 2: confusion; turn 3: a random stat −1; and so on. Ends if the foe switches out. It cannot be used twice in a row.
- **Fail:** if you decline the Labyrinth, nothing changes.
- **Flags:** `kanto.sabrina.ghost`, `kanto.sabrina.labyrinth.done`, `kanto.sabrina.haunting.owed`.

### 9.3 Route 25 (`cs.kanto.saffron.route25`)
- **Your design (kept):** a **mandatory check**. The player is stopped by a **horde of Angry Mankey** and has to fight **five Mankey in a row**. When they finish, a Mankey wants to join your team. It knows **Swords Dance** and **Mach Punch**.
- **Level:** previous stage +1. The five Mankey are a gauntlet with no healing in between (a heal prompt between the 3rd and 4th, **Added**).
- **Reward:** the **Mankey** (level equal to the stage), with Swords Dance and Mach Punch; it can evolve into Primeape (and is the Pokémon the Tournament needs).
- **Added:** *Mankey's Wrath.* The fifth Mankey is a **Primeape** (a boss variant) that uses Rage. If you win without any Pokémon fainting, the Mankey also holds a **Black Belt**.
- **Flags:** `kanto.mankey` (set when it joins).

### 9.4 Fighting Tournament (`cs.kanto.saffron.tournament`)
- **Your design (kept in full):** **only appears if you let Mankey join you.** If you sign up, you are put into a **32-bracket tournament** with **you and only your Mankey or Primeape**. The tournament has **only Fighting types** and scales **exactly to your Mankey/Primeape**. The last fight is always against a **rival Mankey/Primeape**. If you haven't evolved Mankey by that point, it **evolves in the heat of the battle**; **the same goes for the enemy Mankey**. When you win, your Mankey/Primeape is **crowned the winner** and receives a **new ability + Dynamic Punch + a new form** (this Primeape **never evolves into Annihilape**). The new ability **raises a random stat by two every time it's sent out**, and **the first attack always has priority**. The new form is **just the champion belt around its waist.**
- **Kind:** `EV` (a multi-battle tournament, 5 rounds). **Level:** matched to your Mankey/Primeape's level on each round (±0).
- **Bracket (Added):** 32 → 16 → 8 → 4 → 2 → 1: **five rounds**. Each round is a **1-on-1** with a Fighting-type scaled to your Pokémon (its BST ±10% and its level equal). You may switch between rounds only to heal (it heals 40% between rounds). If your Mankey faints you are out; the bracket's prize for that round is the reward.
- **Round prizes (Added):**

| Round | Opponent | Prize |
| --- | --- | --- |
| 1 (32) | Machop / Mankey | *Muscle Band* |
| 2 (16) | Meditite / Timburr | *Protein* |
| 3 (8) | Hitmonlee / Hitmonchan | *Focus Sash* |
| 4 (4) | Machoke / Poliwrath | *Black Belt* |
| 5 (final) | **Rival Mankey/Primeape** | The title, the belt, the ability, **Dynamic Punch** |

- **The final (kept):** your Mankey/Primeape vs the **rival's Mankey/Primeape**. If yours is still a Mankey, it **evolves mid-battle**; so does the rival's.
- **The new ability (your design, named by me):** **Champion's Fury** *(working name; rename it)*. **Each time it is sent out, a random stat rises by 2 stages; its first attack of each time on the field has +1 priority.**
- **The new form:** the Primeape wears the champion belt (a cosmetic form change; no stat change). **It can never evolve into Annihilape** (set `evo.block.annihilape=true`).
- **Flags:** `kanto.tournament.won`.

### 9.5 Fighting Dojo (`cs.kanto.saffron.dojo`) — *Added*
- **Beats:** a Fighting Dojo in town. The master challenges you to a 1-on-1 with his Machamp. Win and you choose **Hitmonlee or Hitmonchan** (a free Pokémon).
- **Odds:** **15%** you are offered a Hitmontop as a third option.

### 9.6 Copycat Girl (`cs.kanto.saffron.copycat`) — *Added*
- **Anime nod:** the girl who mimics everything you say and do.
- **Beats:** a short copy-game (four prompts); the girl repeats your picks. Win (match all four) and she gives **TM Mimic**; she says a line copying your Pokémon's cry.

### 9.7 Silph Co. Lobby (`cs.kanto.saffron.silph`) — *Added*
- **Kind:** `CUT` · **Beats:** a lobby visit before the takeover. The president thanks you and gives you a **Lapras** (level equal to the stage; a Transport-type Water Pokémon) if `rocket.heat` is below 40. If the climax has already been resolved, the building is open.
- **Climax link:** the Silph Takeover is rolled **after Gym 6, 7 or 8** (design doc §3.3). If it is rolled after Gym 6, it can happen directly after this stage.

### 9.8 Magnet Train (`cs.kanto.saffron.train`) — *Added*
- **Beats:** a train toward the next region. Optional: ride it (**skips one stage's Interlude** but gives no Roll rewards). Used to cross to the next region.

---

## 10. CINNABAR ISLAND — Stage 7
**Anchor:** Cinnabar Lab · **Pseudo Stages:** Pokémon Mansion, Seafoam Islands, New Island · **Hub:** Cinnabar Lab

| Space | Kind | Appears |
| --- | --- | --- |
| Cinnabar Lab | `HUB` | Always |
| Pokémon Mansion | `PS` | Roll |
| Seafoam Islands | `PS` | Roll |
| New Island | `PS` | Roll (weight 1) |
| Cinnabar Volcano | `EV` | Roll |

### 10.2 Cinnabar Lab (`cs.kanto.cinnabar.lab`, Hub)
- **Kind:** `HUB` · **Services:**
  - **Fossil Revival:** trade a fossil for the Pokémon: Helix → Omanyte, Dome → Kabuto, Old Amber → Aerodactyl, and other fossils (from Mt. Moon's other-region 30%) → their Pokémon. One revival per Lab visit.
  - **Pokémon Fusion Display** (cosmetic).
  - **Lab Trades:** a scientist trades a Pokémon (Electrode/Voltorb/Porygon) at a fair rate.
- **Added:** the Lab's scientist gives you a **Fossil Fragment** if you register a Mt. Moon fossil (§3.5).

### 10.3 Pokémon Mansion (`cs.kanto.cinnabar.mansion`, Pseudo Stage)
- **Kind:** `PS` · **Level:** previous stage +1 · **Length:** 6 nodes · **Condition:** **burned-out ruins** (Fire/Poison/Electric pool).
- **Beats:** a burned-down mansion with secret doors and statues. Find the **Secret Key** (a three-switch puzzle). Along the way: **diary pages** that tell of Mewtwo's creation (Intel+2 each; four pages; the last connects to Giovanni's cover).
- **Boss:** a *Rocket Scientist* (a leftover) with a Muk or Weezing.
- **Reward:** *Secret Key* (a quest item), **TM Fire Spin** or a Fire-type fossil.

### 10.4 Seafoam Islands (`cs.kanto.cinnabar.seafoam`, Pseudo Stage)
- **Kind:** `PS` · **Level:** previous stage +2 · **Length:** 6 nodes · **Condition:** **ice cave** with strong currents.
- **Beats:** an icy cavern. Boulders must be pushed into holes to stop the current (a 3-step puzzle). Wild encounters: Seel, Dewgong, Shellder, Slowpoke, Jynx, Golbat, Zubat, Psyduck.
- **Boss:** at the bottom, **Articuno** (low catch rate) in **35%** of runs; otherwise a **Dewgong** horde.
- **Reward:** *Never-Melt Ice*, *Icy Rock*, **Articuno** if caught. **Added:** a Galarian Articuno may appear (**10%** instead).

### 10.5 New Island (`cs.kanto.cinnabar.newisland`, Pseudo Stage)
- **Anime nod:** *Mewtwo Strikes Back*: the storm, the castle and the clone battle.
- **Kind:** `PS` · **Level:** previous stage +3 · **Length:** 5 nodes · **Condition:** **thunderstorm**.
- **Beats:** a mysterious invitation brings you to an island castle. In a storm, the host reveals a laboratory of **clones**. The main fight is the **Clone Battle**: a team of **clones of your own Pokémon** (same species, no items, +10% stats, no abilities) fights you. You can't switch to your clones.
- **Reward:** *Clone Core* (copy one Pokémon's moves to another once) and a **Mew sighting**: **10%** you can try to catch Mew at the end.
- **Fail:** your best Pokémon is "scanned" (nothing is lost).

### 10.6 Cinnabar Volcano (`cs.kanto.cinnabar.volcano`) — *Added*
- **Beats:** a trek up the volcano for the Burn Heal herb. Fire hazard per node (a 1/16 burn chance). At the top, a Magmar, Charmeleon or Ponyta awaits. Reward: *Fire Stone*, *Heat Rock*.

---

## 11. INDIGO PLATEAU — the end of Kanto
**Slot:** the **Finale**, after Stage 8.

### 11.1 Victory Road (`cs.kanto.indigo.road`, Pseudo Stage) — *Added*
- **Kind:** `PS` · **Level:** previous stage +2 · **Length:** 7 nodes · **Pool:** Rock, Ground and Fighting types: Machop line, Geodude line, Onix, Rhyhorn, Marowak, Zubat, Golbat.
- **Beats:** boulder puzzles on every second node; the rival's last stand at the top of the road; and **Moltres** at the end (35% of runs; otherwise an Arcanine).
- **Reward:** *Hard Stone*, and **Moltres** if caught.

### 11.3 Cerulean Cave (`cs.kanto.cerulean.cave`, post-game) — *Added*
- **Appears:** only after Victory Road. **Boss:** **Mewtwo** (uncatchable in the first encounter; catchable on a second visit). A final secret.
- **Reward:** the **Kanto Secret** title and Mewtwo (second visit).

---

## 12. THE ROAMING CAST IN KANTO

The roaming groups (Rocket Remnants and Team Snag'em, `scripts/00_ROAMING_CAST.md`) appear in Kanto through the canon spaces below. All of their appearances follow the pack's returning-teams rules (`docs/RETURNING_TEAMS_ANYWHERE.md`): they cost nothing if you ignore them, and each one is a one-line hook, not a new system.

### 12.1 Jessie, James and Meowth — the Kanto beats

| # | Where | Beat | Kind |
| --- | --- | --- | --- |
| 1 | Veridian Forest | A balloon in the sky; the motto, heard far away. (A sighting; **10%**.) | Sighting |
| 2 | Mt. Moon | The Fossil Dig raid (existing, Raid 1). | Raid |
| 3 | S.S. Anne | **The Stowaways** in a barrel; a comic double battle. | Battle |
| 4 | Vermilion | **Flight North:** the theft, the Pseudo Stage and the Venomoth. | Mandatory check |
| 5 | Celadon | **The Perfume Heist:** the trio in disguise. | Battle |
| 6 | Fuchsia | Safari Zone: they try to catch a Tauros with a net (a mock fight). | Optional (**25%**) |
| 7 | Silph Co. | They appear in the climax gauntlet as a Phase-1 trio (existing). | Climax |

### 12.2 Butch, Cassidy and Team Snag'em

- **Butch and Cassidy** appear in the existing Pokémon Tower raid (Raid 3). **Added:** if the Pokémon Tower is the ordinary tower (§6.1), a Rocket scout watches from the top floor and Butch/Cassidy are the scout's reinforcements (a Double Battle, Intel+1).
- **Team Snag'em (The Snag Test, `cs.kanto.fuchsia.snag`)** — *Added.* **Roll**, 20% in Fuchsia. Gonzap's operatives test the Snag Machine on a Safari trainer's Pokémon. You see a Pokémon snagged mid-battle and may intervene (a 2-on-1). Win and you take the **Snag Ball** prototype; lose and the snagged Pokémon is added to their roster for later.
- **Flags:** `kanto.snag.seen`, `kanto.snag.ball`.

---

## 13. MORE SPECIAL MOMENTS AND ROUTES (any town)

These are **Route Events**: they are rolled on the road between towns (not tied to one town) and fill the gaps in the Town Roll. Each is one node unless noted.

### 13.1 Anime moments

| Space | Anime nod | Beat | Reward |
| --- | --- | --- | --- |
| **Snorlax Blockade** (`cs.kanto.route.snorlax`) | The sleeping Snorlax on the road | A Snorlax blocks the path. Wake it with the **Poké Flute** (from Mr. Fuji, §6.2) or fight it (very tanky). | Snorlax (catchable), *Leftovers* |
| **Charizard Valley** (`cs.kanto.route.charizard`) | The valley of Charizard | A high plateau of Charizard and trainers. A 3-battle gauntlet; each wins a Charizard feather. | *Charcoal*, **Charizard X/Y stone** (50%) |
| **Pidgeotto's Farewell** (`cs.kanto.route.pidgeotto`) | The Pidgeotto who leaves | A Pidgeotto befriended in the Pewter flock (§3.7) can be released here; if you do, it returns later as a Pidgeot at the climax with a boost. | *Sharp Beak*, an ally flag |
| **Bulbasaur's Gathering** (`cs.kanto.route.bulbasaur`) | The Bulbasaur gathering in the woods | A gathering of Bulbasaur at night; join their dance (a rhythm game). | **Bulbasaur** or **Ivysaur** with a *Miracle Seed* |
| **Haunter's Mansion** (`cs.kanto.route.haunter`) | The ghost who loves tricks | A Haunter hosts a party; play along or fight. | *Spell Tag*, **Haunter** |
| **The Pikachu Who Hates Evolving** (`cs.kanto.route.thunderstone`) | A Pikachu that refuses a Thunder Stone | A Thunder Stone appears. The Pikachu (if you have one) pushes it away. Respect the choice for an *Light Ball* upgrade; force it and you get a Raichu (and a sulk). | *Light Ball* or Raichu |
| **Lapras's Song** (`cs.kanto.route.lapras`) | The lost Lapras on the coast | A Lapras sings at night. Reunite it with its family (a short escort) or catch it. | **Lapras** (Water Absorb, Sing) |
| **Pokémon Tournament Poster** (`cs.kanto.route.poster`) | The tournament poster | A wall poster for a tournament in a later town; sets a Tournament flag for Saffron (§9.4). | Intel |

### 13.2 Game and route moments

| Route | Event | Beat |
| --- | --- | --- |
| **Route 1** | Pidgey Rush | A Pidgey and Rattata horde in the grass (a warm-up fight). |
| **Route 2** | The Cut Tree | A tree blocks the path; use Cut (or **Samurai Slash**, §3.2, which also counts). |
| **Route 3** | The Tough Junior | A Junior Trainer's challenge for a *Potion*. |
| **Route 4** | The Magikarp Salesman | See §3.6. |
| **Route 9–10** | Rock Tunnel | See §6.4. |
| **Route 12** | Fishing Contest | A fishing minigame; the best catch wins a *Super Rod*. |
| **Route 15** | The Evolution Stone Seller | A seller offers stones; haggle for a discount. |
| **Route 16–17** | Cycling Road | A bike race against Bikers. Win for *Bike Voucher* (§6.3) or a *Quick Claw*. |
| **Route 18** | The Biker Gang | A Rocket-aligned gang; Heat−1 if you win. |
| **Route 22** | The Rival | See §2.3. |
| **Route 23** | The Badge Check | A guard checks your Badges (flavor text and a shortcut to Victory Road if you have six or more). |

### 13.3 Manga moments (marked *approx.*)
- **Red and Blue's rival rematch** at Silph Co. (the rival's variants in the climax).
- **Sabrina's lament** (a flashback after the Labyrinth, Intel+1).
- **Erika's Perfume** as a battle condition (the garden's sleep spores).

---

## 14. FLAG REGISTRY (all `kanto.*`)

| Flag | Set by | Used by |
| --- | --- | --- |
| `kanto.weedle.seed` | Old Man's Lesson | Flight North |
| `kanto.flock.seen` | The Flock (§3.7) | Flight North |
| `kanto.forest.bug`, `kanto.forest.samurai.won` | Veridian Forest | Samurai Slash |
| `kanto.moon.clefairy`, `.mine` | Mt. Moon | Cinnabar Lab (fossils) |
| `kanto.bridge.fell`, `rocket.recruit.offered` | Bridge Crossing | Hidden Village, Rocket arc |
| `kanto.hidden.starter`, `.done` | Hidden Village | — |
| `kanto.rain.fire`, `.saved` | Cold Nights Rain | Damian dialogue |
| `kanto.squad.joined` | Squirtle Squad | Flight North odds |
| `kanto.bill.pc`, `kanto.ssanne.ticket` | Bill's Lighthouse | S.S. Anne |
| `kanto.ssanne.done`, `.machine` | S.S. Anne | Network Machine |
| `kanto.kaiju.won` | Kaiju Tentacruel | Vermilion Harbor Market |
| `kanto.maiden.zcrystal`, `.hms`, `.blessing` | Maiden's Peak | — |
| `kanto.flight.stolen`, `.bug`, `.rescue.used`, `.keeps` | Flight North | Run-end rescue |
| `kanto.tower.cleared`, `.memorial` | Pokémon Tower | Spell Tag |
| `kanto.eevee` | Eeveelution Brothers | — |
| `kanto.factory.cleared`, `.pick` | Polluted Factory | — |
| `kanto.safari.balls`, `.steps` | Safari Land | — |
| `kanto.sabrina.ghost`, `.labyrinth.done`, `.haunting.owed` | Labyrinth | **Next region, Stage 6** |
| `kanto.mankey`, `kanto.tournament.won` | Route 25, Tournament | Dojo |
| `kanto.snag.seen`, `.ball` | The Snag Test | Roaming cast |

---

## 15. CONFLICTS, QUESTIONS AND WIRING NOTES

### 15.1 Interactions with decisions already made

| Decision | Interaction |
| --- | --- |
| **D1** — losing the climax ends the run | **Flight North's rescue is a one-time exception** (§5.4.3). Set `rescue.climaxEligible` to choose whether it applies in the climax. |
| **Rival Rescue Plan** | The Route 22 fights (the first and the Stage 8 rematch) write the rival's state (§2.3). |
| **Returning teams anywhere** | The trio and Snag'em cameos (§12) use the existing rules. |
| **Per-run persistence** | `kanto.sabrina.ghost` is the one flag that crosses regions inside a run; it is stored on the run record. |
| **Raids and the climax** | Mt. Moon, the Celadon Game Corner and Pokémon Tower already have raids. The canon spaces are the **ordinary** versions; the raid versions replace or sit at the mouth of them (§3.3, §6.1, §7.3). |

### 15.2 Questions for you
1. **Flight North's rescue:** should it also save you from a **climax** loss? (I allow it, behind one switch.)
2. **Magmuk:** is this your Delta Muk (Fire Cage)?
3. **The Black Sludge choice:** which custom form should replace "Galarian Grimer"?
4. **Stage order:** Fuchsia then Saffron (the games' order), or Saffron then Fuchsia (your order)?
5. **Town Roll counts:** are 2 (early) and 3 (later) optional spaces per town the right amount?
6. **Sabrina's Labyrinth:** should beating Sabrina there count as the Saffron stage's Gym win? (It does not by default.)

### 15.3 What to wire (for whoever builds it)
1. Add `townRoll` and the **stage slots** table (§0.4) to the region file.
2. Each space in the tables above is one record: `{ id, town, kind, appears, trigger?, level, length?, flags[] }`.
3. Add the new move and ability records: **Samurai Slash**, **North's Wind**, **Haunting**, **Champion's Fury**, **Liquidation** (the Water move), plus the **Network Machine** item.
4. Hook `kanto.sabrina.ghost` and `kanto.flight.rescue.used` into the run-end handler.
5. Add the **Hidden Village** event table (nine rows) and the **S.S. Anne trade** table (§5.1) as data files.

---

## 16. COUNTS

| Item | Count |
| --- | --- |
| Towns | 10 (Viridian, Pewter, Cerulean, Vermilion, Lavender, Celadon, Fuchsia, Saffron, Cinnabar, Indigo Plateau) |
| Spaces listed in the town tables | 60 (19 Pseudo Stages, 28 events, 4 mandatory checks, 5 shops, 2 cutscenes, 2 hubs) |
| Also specified outside the tables | Cerulean Cave, the 9 Hidden Village events, the 3 Mt. Moon events, the Samurai face-off, 12 route events |
| Space ids (`cs.kanto.*`) | 73 |
| Your original spaces, all kept | 23: Veridian Forest, Samurai face-off, Mt. Moon with its three events; Damian's Unofficial Gym (now an optional event), Bridge Crossing, Hidden Village, Cold Nights Rain, Squirtle Squad, Bill's Lighthouse; S.S. Anne, Kaiju Tentacruel, Maiden's Peak, Flight North; Sabrina's Labyrinth, Route 25, Fighting Tournament; Polluted Factory, Safari Land, Deep Savanna, Lush Jungle |
