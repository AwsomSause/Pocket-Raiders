# CANON SPACES — KANTO — EXPANDED EDITION
### Volume II: more for every town, the roads between them, and the Sevii Islands

**Extends:** `docs/CANON_SPACES_KANTO.md` (Volume I; every space and rule there still holds; this volume adds to it)
**Pack:** Beta 0.6 "You Are (Not) Alone" · **Region id:** `kanto`
*Scenes are original, written as nods to moments from the anime, the manga and the games. Manga nods are from recall and marked (approx.). Pokémon named here are checked against your Pokédex.*

---

## X0. How to read this volume

### X0.1 What is the same

- **The spec block** (Volume I §0.2): Kind and how it appears, Level, Beats, Odds, Reward / Cost / Fail, Flags.
- **Kinds:** `PS` Pseudo Stage, `MC` mandatory check, `EV` event, `HUB`, `SHOP`, `CUT`.
- **Ids:** `cs.kanto.<town>.<slug>`. Route spaces use `cs.kanto.route.<slug>`. The Sevii Islands use `cs.kanto.sevii.<slug>`.
- **Levels** are relative to the previous stage. Nothing here is ever more than +2.
- **Nothing here can end a run.** A loss in any space returns the player to the node with the stated cost.

### X0.2 What you asked for, kept

| Your instruction | In this volume |
| --- | --- |
| Remove Pallet Town | No space is set in Pallet Town, and nobody sends the player there |
| Remove all specified Gym battles | No Gym battle is specified. Gym Leaders who appear do so outside their Gyms, and never as the stage's Gym fight |
| Damian's Unofficial Gym is an optional event node | Unchanged. The two other "unofficial gym" scenes added here (AJ's tent, the feud in Dark City) follow the same rule: **optional events**, never progress |
| Remove the Elite Four and the Champion | None of the five appears, in any space, including on the Sevii Islands and the road to the Plateau |

### X0.3 The Town Roll with more spaces

Volume I rolls **2** spaces per town at stages 1–3 and **3** from stage 4, with at most 2 Pseudo Stages. **Those counts do not change.** This volume makes each town's Roll list longer, so that two runs through Kanto share fewer scenes. It does not make a town longer to clear.

One optional rule is added: `townRoll.bonus` (default **0**). Set to 1, each town offers one extra Roll space, for players who want a slower Kanto.

### X0.4 What is new

| Where | New spaces |
| --- | --- |
| Viridian City | 5 |
| Pewter City | 6 |
| Cerulean City | 7 |
| Vermilion City | 7 |
| Lavender Town | 5 |
| Celadon City | 7 |
| Fuchsia City | 7 |
| Saffron City | 6 |
| Cinnabar Island | 6 |
| The road to Indigo Plateau | 3 |
| Route spaces (any town) | 11 |
| The Sevii Islands (new, optional) | 20 |
| A second helping, across all of the above (X17) | 25 |
| **Total** | **115** |

Every new space is **Roll** unless its entry says **Trigger** (it fires when a condition is met) or **Always**.

---

## X1. VIRIDIAN CITY — more

### X1.1 The Spearow Storm (`cs.kanto.viridian.spearow`)
- **Kind:** `EV`, with one forced battle if accepted. **Appears:** Trigger: the first node of the run with rain. *Nod: the first episode of the anime.*
- **Level:** previous stage.
- **Beats:** A flock of Spearow, a thrown rock that was a mistake, a storm. One of the player's Pokémon is hurt and will not go into its Ball. The player may stand in front of it.
- **Odds:** [Stand in front] always works. [Run] works 70% of the time.
- **Reward:** Standing: that Pokémon gains Bond +2 at once, and the storm ends with something large and golden crossing the sky (a Ho-Oh Sighting flag for later regions). Running: nothing lost, nothing gained.
- **Fail:** None. The flock scatters either way.
- **Flags:** `kanto.viridian.spearow`, `kanto.sighting.rainbow`.

### X1.2 The Pokémon Center Siege (`cs.kanto.viridian.center`)
- **Kind:** `PS`, short. **Appears:** Roll (Interlude 0 only). *Nod: the anime's second episode.*
- **Level:** previous stage.
- **Beats:** The lights go out. Jessie, James and Meowth come through the skylight. The player's own Pokémon are in the healing machine, so the nurse hands over a tray of **Poké Balls from storage**: three rental Pokémon, chosen at random, one of which is always empty. Two battles in the dark.
- **Odds:** The empty Ball is picked first 1 time in 3 (announced: "It's empty!"). It costs the turn and nothing else.
- **Reward:** The Center heals for free for the rest of Kanto. Trio reputation +5 if the player lets them leave through the roof they came in by.
- **Fail:** The trio take one common item and leave. The Pokémon in the machine are untouched.
- **Flags:** `kanto.viridian.center.saved`.

### X1.3 The Healer in the Straw Hat (`cs.kanto.viridian.healer`)
- **Kind:** `EV`. **Appears:** Trigger: Stage 8 (the return), if any party Pokémon is fainted, has a status, or is a Shadow. *Nod: the manga (approx.).*
- **Beats:** At the forest's edge, a child in a straw hat asks to hold the player's most tired Pokémon. They close their eyes. They are asleep on their feet afterwards.
- **Reward:** One Pokémon of the player's choice is fully healed and cured; if it is a Shadow Pokémon, Corruption −10. The child will not take payment.
- **Cost:** None. It can be accepted once per run.
- **Flags:** `kanto.viridian.healer`.

### X1.4 The Convertible (`cs.kanto.viridian.convertible`)
- **Kind:** `EV`. **Appears:** Roll. *Nod: the anime rival's travelling fan club.*
- **Beats:** A red convertible is parked across Route 22, full of cheerleaders with pom-poms in the rival's colors. They will move it if the player can name three things about the rival. The answers come from the rival's memory log.
- **Odds:** Three right: they move, and one of them quietly hands over a note. Fewer: they chant for a full minute and then move anyway.
- **Reward:** Three right: Rival Attitude +0.5, and the note says where the rival will be next. Otherwise nothing.
- **Flags:** `kanto.viridian.convertible`.

### X1.5 Viridian Night Market (`cs.kanto.viridian.nightmarket`)
- **Kind:** `SHOP`. **Appears:** Always, Stage 8 only.
- **Beats:** The town the run started in has grown a market while the player was away. Stalls sell what earlier towns sold, at 10% off, and one stall sells back anything the player sold or lost to an event during this region.
- **Flags:** none.

---

## X2. PEWTER CITY — more

### X2.1 Ten Brothers and Sisters (`cs.kanto.pewter.siblings`)
- **Kind:** `EV`, a minigame. **Appears:** Roll. *Nod: the anime's family behind the Pewter Gym, away from the Gym.*
- **Beats:** A man selling "genuine rocks" by the road asks the player to mind ten children for an hour. Cook, mend, find the one who is hiding.
- **Odds:** Scored out of ten.
- **Reward:** 7 or more: a home-cooked meal (party healed 50%), a *Hard Stone*, and the eldest brother's travel advice (the next town's Roll list is shown). Fewer: the meal only, slightly burnt.
- **Flags:** `kanto.pewter.siblings`.

### X2.2 The Water Wheel (`cs.kanto.pewter.wheel`)
- **Kind:** `EV`. **Appears:** Roll. *Nod: the anime's trick of charging an Electric Pokémon at a hydro plant.*
- **Beats:** An idle generator on the river. The player may run one Pokémon through it: Electric types are **Charged** (Special Attack +1 on entry for the rest of the stage); a Rock or Ground type turns the wheel instead and earns money.
- **Cost:** The Pokémon starts its next battle at 80% HP. It worked hard.
- **Flags:** `kanto.pewter.wheel`.

### X2.3 The Museum After Hours (`cs.kanto.pewter.afterhours`)
- **Kind:** `PS`, short. **Appears:** Trigger: the Museum (Volume I §3.5) was visited and the player holds any fossil. *Nod: the manga's amber (approx.).*
- **Level:** +1.
- **Beats:** The guard is asleep. In the fossil hall something is moving behind the glass. Two battles against half-revived fossil Pokémon (Omanyte, Kabuto), then a choice at the amber case.
- **Reward:** [Take the amber to the lab] *Old Amber*, to be revived on Cinnabar. [Report it] the curator registers the player's fossils: this is the key for the Named Shadow **Shellshock**, if the player has it or later obtains it.
- **Fail:** The guard wakes up. The player is shown out. Nothing lost.
- **Flags:** `kanto.pewter.afterhours`, `kanto.pewter.fossil-registered`.

### X2.4 Route 3 Rematch Ladder (`cs.kanto.pewter.ladder`)
- **Kind:** `EV`, up to four battles. **Appears:** Roll. *Nod: the games' Route 3 gauntlet.*
- **Level:** previous stage, then +0, +1, +1.
- **Beats:** A Youngster who "likes shorts", a Lass, a Bug Catcher and a Hiker, standing in a line. Each one who loses calls the next. The player may stop after any battle.
- **Reward:** Money per battle; all four: a *Lucky Egg*.
- **Fail:** A loss ends the ladder and keeps what was won.
- **Flags:** `kanto.pewter.ladder`.

### X2.5 The Scientist Who Stayed (`cs.kanto.pewter.seymour`)
- **Kind:** `EV`, an escort. **Appears:** Roll, if Mt. Moon is in the menu. *Nod: the anime's scientist of Mt. Moon.*
- **Beats:** A thin man in a lab coat recites poetry about the Clefairy and asks to be walked to the Moon Stone chamber. He is no use in a fight and says so.
- **Odds:** One wild battle on the way (50%).
- **Reward:** A *Moon Stone*. He stays behind with the Clefairy, and waves. On any later visit to Mt. Moon he is there, with tea.
- **Flags:** `kanto.pewter.seymour`.

### X2.6 The Serum (`cs.kanto.pewter.serum`)
- **Kind:** `EV`, one battle. **Appears:** Trigger: Team Rocket is awake and Mt. Moon is in the menu. *Nod: the manga's forced evolution at Mt. Moon (approx.).*
- **Level:** +1.
- **Beats:** A Rocket Grunt with a syringe and a Rhyhorn that is being made to evolve too early. The Rhydon that results is strong and is in pain.
- **Reward:** Win: the Grunt runs, and the Rhydon can be [calmed] (it leaves; Rep +3) or [taken into custody] (it joins at Tier 1, Veiled, by the Capture Rig method). Intel +2 either way.
- **Fail:** The Grunt leaves with it. Heat +3.
- **Flags:** `kanto.pewter.serum`.

---

## X3. CERULEAN CITY — more

### X3.1 The Water Ballet (`cs.kanto.cerulean.ballet`)
- **Kind:** `EV`, a performance and one battle. **Appears:** Roll. *Nod: the anime's underwater show. It is a show, not the Gym, and no Gym battle takes place.*
- **Beats:** Three sisters are putting on an underwater ballet and are one mermaid short. The player's Water-type (or any Pokémon that can swim) is cast. A rhythm minigame; then the trio arrive in a submarine and the finale becomes a battle in the pool, which the audience thinks is part of the show.
- **Odds:** With no swimming Pokémon, the player is given the role of a prince and a pair of water wings.
- **Reward:** *Mystic Water*; a standing ovation (Rep +3); and a Seel that liked the player's Pokémon asks to come along.
- **Fail:** The show goes on without the finale. *Mystic Water* only.
- **Flags:** `kanto.cerulean.ballet`.

### X3.2 Pokémon Tech (`cs.kanto.cerulean.tech`)
- **Kind:** `EV`, a quiz and one battle. **Appears:** Roll. *Nod: the anime's prep school for trainers who would rather not travel.*
- **Beats:** A fog-bound academy. A student is being hazed for failing a test. The player is given the same test (five type questions), then challenged by the top student, who has never lost on the simulator and has never battled outside it.
- **Level:** +1; her Pokémon are level-perfect and badly bonded.
- **Reward:** *Wise Glasses*; the hazed student gives a hand-drawn type chart (the player's type matchups are shown in battle for the rest of Kanto, if they were not already).
- **Fail:** She is gracious. Nothing lost.
- **Flags:** `kanto.cerulean.tech`.

### X3.3 AJ's Tent (`cs.kanto.cerulean.aj`)
- **Kind:** `EV`. **An optional event, like Damian's: it is not a Gym and gives no progress.** **Appears:** Roll. *Nod: the anime's wild trainer with ninety-eight straight wins.*
- **Beats:** A circus tent with a sign: *98 WINS, 0 LOSSES*. One battle against AJ and a Sandshrew trained to ignore water. He intends to leave for the League at one hundred.
- **Level:** +1.
- **Reward:** Win (his ninety-ninth challenger, his first loss): he shakes hands and gives a *Macho Brace*. Lose: the sign changes to 99, and he gives a *Soft Sand* for trying.
- **Flags:** `kanto.cerulean.aj`.

### X3.4 The Bike in the Window (`cs.kanto.cerulean.bike`)
- **Kind:** `SHOP` and a running joke. **Appears:** Always. *Nod: the games' million-yen bicycle and the anime's burnt one.*
- **Beats:** A bicycle priced at ₽1,000,000. The shop owner will accept a *Bike Voucher* (Volume I §6.3). Until the player owns a bike, any Electric move the player uses outdoors has a tiny chance to destroy a parked bicycle somewhere nearby, whose owner will then follow the player to the next town asking for a new one.
- **Odds:** 2% per Electric move outdoors; once per run.
- **Reward:** With the **Bicycle**: one route event per stage may be skipped, and the Cycling Road spaces open. Paying back the bike's owner (any bicycle, or ₽3,000) earns a travelling companion's goodwill: Rep +3.
- **Flags:** `kanto.cerulean.bike`, `kanto.cerulean.bike-debt`.

### X3.5 The Second Offer (`cs.kanto.cerulean.recruiter`)
- **Kind:** `EV`. **Appears:** Trigger: Bridge Crossing (Volume I §4.2) was won and Team Rocket is awake.
- **Beats:** The man at the end of the bridge was a recruiter. He is back, without the trainers, and with a better offer and a business card.
- **Reward:** [Take the card] the Inside Man route's Ignition offer can be accepted here, early (`rocket.insideman`, design document §12.4). [Refuse] he tips his hat: Heat +2, Intel +2. [Take the card and report it] Intel +5, and the police are told. Where the expanded Kanto script checks for a police tip (`rocket.x.wire`), this counts as one.
- **Flags:** `kanto.cerulean.recruiter`.

### X3.6 The Girl with the Stall (`cs.kanto.cerulean.stall`)
- **Kind:** `SHOP` and `EV`. **Appears:** Roll. *Nod: the manga's con artist (approx.).*
- **Beats:** A cheerful girl sells rare items at a third of their price. Every one is a fake: the Rare Candy is a boiled sweet, the Nugget is painted. The player may buy, haggle, or call her out.
- **Odds:** Calling her out works if the player has seen a real one of anything she sells.
- **Reward:** Called out: she laughs, packs up, and leaves one real item behind "for the trouble." She appears once more, later in Kanto, on the player's side, and picks one lock. Bought: the player owns a boiled sweet.
- **Flags:** `kanto.cerulean.stall`, `kanto.ally.stall-girl`.

### X3.7 The River Gyarados (`cs.kanto.cerulean.gyarados`)
- **Kind:** `EV`, one hard battle. **Appears:** Trigger: Team Rocket is awake. *Nod: the manga's rampaging Gyarados (approx.).*
- **Level:** +2 (the only +2 in the town; shown before accepting).
- **Beats:** A Gyarados is tearing up Route 24's river with a Rocket harness bolted behind its head. It is somebody's. That somebody is on the bank, shouting its name.
- **Reward:** Break the harness (target it instead of the Pokémon: three hits): the Gyarados is returned to its trainer; Rep +5; *Dragon Scale*. Knock it out instead: the harness is intact and Rocket recovers it; Heat +3.
- **Fail:** It swims downstream. It is met again at the Vermilion docks.
- **Flags:** `kanto.cerulean.gyarados`.

---

## X4. VERMILION CITY — more

### X4.1 The Capsized Liner (`cs.kanto.vermilion.capsized`)
- **Kind:** `PS`. **Appears:** Trigger: the S.S. Anne (Volume I §5.1) ended with the ship going down. *Nod: the anime's upside-down ship.*
- **Level:** previous stage.
- **Beats:** The ship is upside down on the seabed with an air pocket. Three rooms, each a small puzzle (a ladder made of Pokémon; a fire door that must be cut; a hull that must be burned through). Jessie, James and Meowth are trapped too, and the truce is real for the length of the stage.
- **Odds:** Each puzzle has two solutions by type; a party with neither may trade a turn of air for the trio's help.
- **Reward:** Out alive: Trio reputation +10, and whatever the player could carry (one item per room).
- **Fail:** The party is washed ashore at 1 HP. One room's item is lost.
- **Flags:** `kanto.vermilion.capsized`.

### X4.2 The Island of Giants (`cs.kanto.vermilion.giants`)
- **Kind:** `PS`. **Appears:** Roll, after any sea node. *Nod: the anime's island of giant Pokémon, and the one episode told from the Pokémon's side.*
- **Beats:** The party is separated from the player. **For this stage the player controls their Pokémon directly, on foot, with no trainer.** Their talk is subtitled. The giants on the island are machines (an amusement park's), and the stage ends on a runaway mine cart.
- **Level:** no ordinary battles; three chases.
- **Reward:** Every Pokémon that took part gains Bond +1, and any chemistry pair among them gains its bonus one stage early. The subtitles are kept in the Notebook.
- **Fail:** None. A failed chase is retried.
- **Flags:** `kanto.vermilion.giants`.

### X4.3 Porta Vista (`cs.kanto.vermilion.portavista`)
- **Kind:** `HUB`, small, with one event. **Appears:** Roll. *Nod: the anime's beach town.*
- **Beats:** A beach, a failing restaurant run by an old sailor, a developer who wants the land, and a talent contest whose prize would pay the debt. The player's Pokémon may enter.
- **Odds:** The contest is judged on Bond, not level.
- **Reward:** Win: money, and the restaurant feeds the party for free on any return. Lose: the sailor keeps the place anyway; someone anonymous paid.
- **Flags:** `kanto.vermilion.portavista`.

### X4.4 Naptime (`cs.kanto.vermilion.naptime`)
- **Kind:** `EV`, one battle. **Appears:** Roll. *Nod: the anime's town where the children went missing.*
- **Beats:** The children of a harbor town have wandered off, and are found in a park behaving like Pokémon. A members' club for people who cannot sleep has been using a Hypno, and its waves carry.
- **Reward:** Persuade the club (dialogue) or beat its chairman (battle): the children wake. A Drowzee the club had been keeping as a spare asks to leave with the player. Any party Pokémon with a headache (a Psyduck, for instance) is cured of it for one battle and is astonishing.
- **Flags:** `kanto.vermilion.naptime`.

### X4.5 The Dam (`cs.kanto.vermilion.dam`)
- **Kind:** `EV`, a choice. **Appears:** Roll. *Nod: the anime's dam that the Diglett would not allow.*
- **Beats:** A foreman is offering a fortune to any trainer who will clear the Diglett off his construction site. When the player reaches for a Poké Ball, none of them will open.
- **Reward:** [Side with the Diglett] the dam is moved; the Diglett plant a line of trees by morning; *Soft Sand*, and a Diglett joins if asked. [Insist] the Balls stay shut and the foreman pays someone else, who has the same problem.
- **Flags:** `kanto.vermilion.dam`.

### X4.6 The Photographer (`cs.kanto.vermilion.photographer`)
- **Kind:** `EV`, lasting one stage. **Appears:** Roll. *Nod: the anime's Pokémon photographer.*
- **Beats:** A boy with a camera has been hired (by the trio, who told him it was for a magazine) to "capture" the player's lead Pokémon. He means: on film. He follows the player for the whole stage.
- **Reward:** At the stage's end he hands over an album. Each thing that happened in the stage (a win with no faints, a rescue, a kindness, a blast-off) is a photograph, and each is worth a little: money, Rep, or a keepsake for the Notebook.
- **Flags:** `kanto.vermilion.photographer`.

### X4.7 The Itemfinder (`cs.kanto.vermilion.itemfinder`)
- **Kind:** `EV`. **Appears:** Always, at the Route 11 gate. *Nod: the games.*
- **Beats:** A researcher's assistant upstairs in the gatehouse counts the species the player has registered.
- **Reward:** Thirty or more: the **Itemfinder**. For the rest of Kanto, one node per stage hides an extra item and the Itemfinder beeps on it. Fewer: he says how many are needed, and waits.
- **Flags:** `kanto.vermilion.itemfinder`.

---

## X5. LAVENDER TOWN — more

### X5.1 The Name Rater (`cs.kanto.lavender.namerater`)
- **Kind:** `SHOP` (a service). **Appears:** Always. *Nod: the games.*
- **Beats:** An old man who has opinions about names. He will rename any Pokémon, and tells the player, unasked, what he thinks of the current one.
- **Reward:** A Pokémon given a nickname for the first time gains Bond +1 ("It likes having a name"). Once per Pokémon.
- **Flags:** none.

### X5.2 The Listening Post (`cs.kanto.lavender.radio`)
- **Kind:** `EV`. **Appears:** Roll; always if `grandArc.enabled` and Team Rocket is awake. *Nod: the tower that becomes a radio tower in later years.*
- **Beats:** A volunteer with a home-built radio on the hill above town has been picking up something that is not music: a short pulse, repeating, coming from the west. She has written it out as dots. She does not know what it is. The player may recognise it from a Capture Rig.
- **Reward:** Intel +3. If the player has seen a Capture Rig, the pulse is identified and the next rigged Pokémon the player meets is one tier lower. With the Grand Arc on, the pulse is the same one Johto's script opens with.
- **Flags:** `kanto.lavender.pulse`.

### X5.3 The Channelers' Vigil (`cs.kanto.lavender.vigil`)
- **Kind:** `EV`, one to three battles. **Appears:** Roll. *Nod: the games' possessed Channelers.*
- **Level:** previous stage.
- **Beats:** Three Channelers are holding a vigil at the Tower's door and something has got into them. Each can be calmed with a *Cleanse Tag*, talked down (if the player knows the name on the nearest grave), or battled (Gastly, Haunter).
- **Reward:** Each one calmed without a battle: a *Spell Tag*. All three: they walk the player up the first two floors of the Tower, those floors have no wild encounters, and the Tower's Purification Site can be used without a battle.
- **Flags:** `kanto.lavender.vigil`.

### X5.4 The Orphan (`cs.kanto.lavender.orphan`)
- **Kind:** `EV`. **Appears:** Always, at Mr. Fuji's house (Volume I §6.2). *Nod: the games' Cubone.*
- **Beats:** A Cubone that will not come out from under the table. It can be sat with. That is the whole event: the player chooses how long to stay (one, two or three "waits"), and nothing happens during them except that it moves a little closer each time.
- **Reward:** Three waits: the Cubone follows the player to the Tower. It is not a party member and does not battle. It is the **story key for Marrowmother** (expanded Shadow document §X8): with it at the top of the Tower, that scene can end the way it should.
- **Cost:** Each wait takes no node. It takes patience.
- **Flags:** `kanto.lavender.orphan` (0–3).

### X5.5 The Offering (`cs.kanto.lavender.offering`)
- **Kind:** `EV`. **Appears:** Trigger: this save has lost a run, or has ever released a Pokémon.
- **Beats:** The grave-keeper at the House of Memories asks if there is anyone the player would like to leave something for. A list is shown: Pokémon from earlier runs that did not finish. The player may leave one item.
- **Reward:** Nothing at once. In the Region of Doom, the item is on the Memorial wall in the Pale Garden, and that Pokémon is listed first.
- **Flags:** `kanto.lavender.offering`.

---

## X6. CELADON CITY — more

### X6.1 Scissor Street (`cs.kanto.celadon.salon`)
- **Kind:** `SHOP` and `EV`. **Appears:** Roll. *Nod: the anime's breeder and her salon.*
- **Beats:** A quiet salon run by a breeder who grooms for health, across the road from a loud one that grooms for looks (two familiar stylists and a cat). A grooming at the quiet salon takes no node.
- **Reward:** One Pokémon gains Bond +1 and is cured of any status. If the player then wins a "style-off" battle against the loud salon, the breeder asks the player to look after her Vulpix for a while. It joins.
- **Flags:** `kanto.celadon.salon`.

### X6.2 The Diner (`cs.kanto.celadon.diner`)
- **Kind:** `EV`. **Appears:** Always. *Nod: the games' Coin Case.*
- **Beats:** A man at the counter has lost everything at the Game Corner and would like someone else to have his *Coin Case*, so that he cannot go back. He has three tips about the machines. Two are superstition.
- **Reward:** The *Coin Case*, and one true tip: which machine pays out (the Game Corner's odds for one play are shown).
- **Flags:** `kanto.celadon.coincase`.

### X6.3 The Poster (`cs.kanto.celadon.poster`)
- **Kind:** `EV`. **Appears:** Trigger: the Game Corner (Volume I §7.3) has been visited and Team Rocket is awake. *Nod: the games' switch behind the poster.*
- **Beats:** A man in black is standing in front of a poster and is very bad at pretending not to guard it.
- **Reward:** [Wait until he leaves] Intel +4, and the Celadon Hideout raid (`pr.kanto.celadon-hideout`), when offered, starts one room further in. [Battle him] the same, plus Heat +3. [Press the switch now] the raid is offered immediately, at its normal odds, and the Situation Report says the player is going in early.
- **Flags:** `kanto.celadon.poster`.

### X6.4 The Developers' Room (`cs.kanto.celadon.devroom`)
- **Kind:** `EV`. **Appears:** Roll. *Nod: the games' office on the mansion's top floor.*
- **Beats:** Four tired people in a small office say they made all of this. One draws, one writes, one programs, and one will not say what he does. They ask how many Pokémon the player has met.
- **Reward:** By count: a *Rare Candy*, a *PP Up* or, for sixty or more, a hand-signed **Diploma** (a keepsake) and a Porygon they say was "left over."
- **Flags:** `kanto.celadon.devroom`.

### X6.5 The Bridge Run (`cs.kanto.celadon.bridgerun`)
- **Kind:** `PS`, a race. **Appears:** Roll, if the player has the Bicycle or is lent one. *Nod: the anime's bike gang and the medicine that had to cross the bridge.*
- **Level:** previous stage.
- **Beats:** A Pokémon Center nurse needs medicine taken across the unfinished Cycling Road bridge before a storm closes it. The bridge's biker gang will not let anyone through, and then, on hearing why, ride escort. A Convoy of three: two battles on the move and the drawbridge.
- **Reward:** Delivered in time: the gang's patch (bikers on Routes 16–18 no longer challenge the player; Heat −2), and the sick Pokémon's trainer gives a *Sitrus Berry* bundle. Late: delivered anyway; the patch only.
- **Fail:** The storm closes the bridge. The gang delivers it themselves and thinks less of the player.
- **Flags:** `kanto.celadon.bridgerun`.

### X6.6 The Greenhouse Fire (`cs.kanto.celadon.greenhouse`)
- **Kind:** `EV`, a timed rescue. **Appears:** Trigger: Perfume Heist (Volume I §7.7) was played, or Team Rocket's track is at step 2 or more. *Nod: the anime's fire, and the Gloom that had to be carried out. No Gym battle takes place.*
- **Beats:** The perfume greenhouse is burning. The owner is outside, held back by her staff. Her oldest Gloom is still inside. Six turns: Water moves clear a path; the smell stuns any Pokémon without a strong stomach (a Poison or Grass type is immune).
- **Reward:** Gloom carried out: a *Leaf Stone*, free perfume (a held item that calms wild Pokémon), and a friend in Celadon for the rest of the run.
- **Fail:** The firefighters get it out a minute later, singed. The owner thanks the player for trying.
- **Flags:** `kanto.celadon.greenhouse`.

### X6.7 The Unstable Eevee (`cs.kanto.celadon.vee`)
- **Kind:** `EV`, one battle and a choice. **Appears:** Trigger: Team Rocket is awake. *Nod: the manga's Eevee that would not stay one thing (approx.).*
- **Beats:** In a back room of the Game Corner's prize office there is an Eevee that has been made to change: Vaporeon, Jolteon, Flareon and back, a different one each time it is frightened. It is frightened most of the time.
- **Reward:** After the guard is beaten: [Give it a stone] it settles into that form for good and joins. [Give it time] it joins as an Eevee with the trait *Unsettled*: once per battle the player may choose its form for three turns, and it reverts after. It is slower to bond and worth it.
- **Flags:** `kanto.celadon.vee`.

---

## X7. FUCHSIA CITY — more

### X7.1 The Big P Ranch (`cs.kanto.fuchsia.ranch`)
- **Kind:** `PS`, a race. **Appears:** Roll. *Nod: the anime's Pokémon race.*
- **Beats:** A ranch family's rider is hurt the night before the race that keeps the ranch. The player is asked to ride her Ponyta. It burns anyone it does not trust; the first leg is slow and careful, the last is not.
- **Odds:** Three legs: hills, a river, a sprint against a Dodrio. Trust rises by one each leg the player does not use the whip.
- **Reward:** Win: the Ponyta evolves at the line. The family offers the player one of this year's foals: a Ponyta. *Charcoal*. Lose: the ranch is kept anyway, by a neighbor's loan; the foal is still offered.
- **Flags:** `kanto.fuchsia.ranch`.

### X7.2 The Child of the Herd (`cs.kanto.fuchsia.herd`)
- **Kind:** `EV`. **Appears:** Trigger: Safari Land (Volume I §8.3) is in the menu. *Nod: the anime's boy raised by Kangaskhan.*
- **Beats:** A small wild boy with a boomerang chases the player out of the long grass. His parents have been circling the reserve in a helicopter for five years. Poachers are also in the reserve tonight.
- **Reward:** Help the herd drive off the poachers (one battle beside a Kangaskhan): the parents land and decide to stay too. If the expanded raid *Safari Night Poach* is later played, the herd fights beside the player there and finds the truck that holds the **Matron**'s child one room sooner (she is a Named Shadow, and her child is her key).
- **Flags:** `kanto.fuchsia.herd`.

### X7.3 The Lake Nobody Fishes (`cs.kanto.fuchsia.dragonlake`)
- **Kind:** `EV`. **Appears:** Roll, inside Safari Land. *Nod: the anime's warden and the legend he guards.*
- **Beats:** An old warden with a revolver he has never fired tells the player that there is nothing in the far lake, and that he has protected the nothing for thirty years.
- **Odds:** If the player does not fish: he shows them, at dusk. If the player fishes: 10% Dratini, otherwise nothing, and he is disappointed either way.
- **Reward:** Shown: a *Dragon Scale*, and a Dragonair Sighting flag (one will help once, in a storm, later in the run). Fished and caught: a Dratini, and the warden does not speak to the player again.
- **Flags:** `kanto.fuchsia.dragonlake`.

### X7.4 The Rod Brothers and the Move Deleter (`cs.kanto.fuchsia.gurus`)
- **Kind:** `SHOP` (services). **Appears:** Always. *Nod: the games.*
- **Beats:** A Fishing Guru who gives a *Good Rod* to anyone who admits they like fishing; next door, a man who helps a Pokémon forget one move. In the Expanded Edition he can also help a Pokémon forget a **Shadow move** it no longer wants, at no cost. He does not ask why.
- **Flags:** none.

### X7.5 The Bird Keepers' Maze (`cs.kanto.fuchsia.birdmaze`)
- **Kind:** `EV`, up to five battles. **Appears:** Roll. *Nod: the games' Routes 13 to 15.*
- **Level:** previous stage.
- **Beats:** A fence maze on the cliff road, with a Bird Keeper at every corner. There is a short way through with two battles and a long way with five. The long way has the items.
- **Reward:** Short: money. Long: *Sharp Beak*, a hidden TM, and a Doduo that follows the player out of the maze of its own accord.
- **Flags:** `kanto.fuchsia.birdmaze`.

### X7.6 The Weakest Paras (`cs.kanto.fuchsia.paras`)
- **Kind:** `EV`, one unusual battle. **Appears:** Roll. *Nod: the anime's Paras that needed to win once.*
- **Beats:** A herbalist's Paras must evolve for her to finish a medicine, and it has never won anything. She asks for a battle. It cannot hurt the player's Pokémon. The task is to **lose convincingly**: use weak moves, miss on purpose, and let it land the last hit.
- **Odds:** The Paras faints if hit by anything above 40 power. The player's most disobedient Pokémon (a Gripped or Fallen Shadow, if any) may ruin it; the game warns of this.
- **Reward:** It evolves. The **Miracle Potion**: a full heal and cure for one Pokémon, usable in battle, one only.
- **Fail:** The Paras faints. She thanks the player anyway. It can be tried again at the next rest node.
- **Flags:** `kanto.fuchsia.paras`.

### X7.7 The Carnival (`cs.kanto.fuchsia.carnival`)
- **Kind:** `EV`, a chase. **Appears:** Roll. *Nod: the anime's failing magician and his marching Exeggutor.*
- **Beats:** A carnival magician with one Exeggcute and no audience has hypnotised a wild herd of Exeggutor to make a finale. They are now marching, in step, toward the carnival's own fuel store.
- **Odds:** They can be turned by Fire (two turns), by sound (three), or by waking the magician up to what he has done (dialogue; one turn).
- **Reward:** The carnival is saved. The magician gives the player his Exeggcute, which he says deserves a better act. *Miracle Seed*.
- **Flags:** `kanto.fuchsia.carnival`.

---

## X8. SAFFRON CITY — more

### X8.1 Mr. Psychic (`cs.kanto.saffron.mrpsychic`)
- **Kind:** `EV`. **Appears:** Always. *Nod: the games' man who knows why you have come.*
- **Beats:** "…Wait. Don't say a word. You wanted this." He hands over *TM Psychic*. Then he looks at the player a little longer than is comfortable.
- **Reward:** The TM, and one true sentence about the region's climax, drawn from the Situation Report (never the rival's variant). Intel +3.
- **Flags:** `kanto.saffron.mrpsychic`.

### X8.2 The House of Imitation (`cs.kanto.saffron.imite`)
- **Kind:** `EV`. **Appears:** Roll. *Nod: the anime's performer and the Ditto that could not change its face. Distinct from the Copycat Girl of Volume I §9.6.*
- **Beats:** A one-girl theatre, closed. Her Ditto can become anything except for its face, which stays a Ditto's, and audiences laugh at the wrong moments. She has stopped performing.
- **Odds:** A battle in which the Ditto copies the player's lead. Each time the player compliments the copy instead of attacking it (a dialogue action), its next transformation is closer. Three compliments complete it.
- **Reward:** She reopens. The player gets front-row tickets (a keepsake) and a second Ditto she has been training, which can hold a transformation after switching out.
- **Flags:** `kanto.saffron.imite`.

### X8.3 The Admissions Exam (`cs.kanto.saffron.exam`)
- **Kind:** `EV`, a quiz and a rental battle. **Appears:** Roll. *Nod: the anime's examination that almost nobody passes. It grants no badge and no League entry.*
- **Beats:** A written paper (silhouettes, type questions, one trick question), then a practical: three rental Pokémon the player has never used, against an instructor.
- **Reward:** Pass: a certificate (a keepsake), an *Exp. Candy* bundle, and the instructor's respect. Fail: the instructor explains every wrong answer, which is worth nearly as much.
- **Flags:** `kanto.saffron.exam`.

### X8.4 The Teleport Girl (`cs.kanto.saffron.teleport`)
- **Kind:** `SHOP` (a service). **Appears:** Always from Stage 6. *Nod: the city's Abra.*
- **Beats:** A girl with an Abra on her shoulder will send the player to the shop of any town already visited, and bring them back, for a fee. The Abra is asleep throughout.
- **Cost:** ₽1,500 a trip. It takes no node.
- **Flags:** none.

### X8.5 The Seam (`cs.kanto.saffron.seam`)
- **Kind:** `EV`. **Appears:** Trigger: Team Rocket's track is at step 3 (*Closed Roads*) or more. *Nod: the manga's wall around the city (approx.).*
- **Beats:** Saffron is behind a shimmer. Along its edge the player finds a place where the light bends: a tired Mr. Mime, holding its hands up, and a Rocket Scientist asleep in a folding chair beside it.
- **Reward:** [Watch quietly] the player learns what an anchor looks like: in the Extended Cut's Phase 1, all three anchors are marked on the map from the start. [Wake the Mr. Mime's trainer] one battle; win, and this Mr. Mime goes home: in Phase 1, one anchor counts as already beaten. Heat +5.
- **Flags:** `kanto.saffron.seam`.

### X8.6 Pidgey Post (`cs.kanto.saffron.post`)
- **Kind:** `EV`, an errand. **Appears:** Roll.
- **Beats:** The roads are slow, so the city's letters go by Pidgey, and the Pidgey are tired. The postmaster asks the player to carry a bundle to the next three towns they visit.
- **Reward:** Each letter delivered: a small thank-you from its reader (a berry, a tip, a rumor). All three: the postmaster's own Pidgeotto offers to carry one message for the player, anywhere in Kanto: one Rival Rescue Plan offer or one ally's help arrives a node early.
- **Flags:** `kanto.saffron.post` (0–3).

---

## X9. CINNABAR ISLAND — more

### X9.1 The Riddle Inn (`cs.kanto.cinnabar.inn`)
- **Kind:** `EV`. **Appears:** Roll. *Nod: the anime's innkeeper who speaks in riddles. No Gym battle takes place.*
- **Beats:** Every hotel on the island is full of tourists. A bald man in a bad wig offers a room at his inn to anyone who can answer three riddles. The answers are on a notice board behind him, if the player thinks to look.
- **Reward:** Each riddle answered: a hint for one Cinnabar space. All three: a free night (a full rest that takes no node) and *TM Fire Blast*, "left by a previous guest."
- **Fail:** A room over the kitchen. Half a rest.
- **Flags:** `kanto.cinnabar.inn`.

### X9.2 The Sleeper on the Beach (`cs.kanto.cinnabar.sleeper`)
- **Kind:** `EV`. **Appears:** Roll. *Nod: the anime's island of Squirtle and the Blastoise that would not wake.*
- **Beats:** An island of Squirtle and Wartortle, all asleep on the sand around their Blastoise, which has something round and pink stuck in one cannon. Anyone who gets close falls asleep too.
- **Odds:** A Pokémon that cannot be put to sleep, or one that is deaf to song, can walk up and pull it out. Otherwise: three attempts, each costing a turn of sleep.
- **Reward:** The Blastoise wakes. A Wartortle from the island joins if the player has no Squirtle line. *Blastoisinite* if the Squirtle Squad (Volume I §4.4) was befriended.
- **Flags:** `kanto.cinnabar.sleeper`.

### X9.3 The Backlog (`cs.kanto.cinnabar.backlog`)
- **Kind:** `SHOP` (a service). **Appears:** Always, in the Lab (Volume I §10.2). *Nod: the games' fossil reviver.*
- **Beats:** A researcher with a queue of fossils and no assistants. He will revive anything the player brings, and has three unclaimed fossils on the shelf that he will revive for anyone who will give them a home.
- **Odds:** The shelf holds one each of Omanyte, Kabuto and one unlabelled fossil (rolled from any fossil line in the Pokédex).
- **Reward:** Up to one shelf fossil, and any of the player's own.
- **Flags:** `kanto.cinnabar.backlog`.

### X9.4 The Trade Wing (`cs.kanto.cinnabar.trades`)
- **Kind:** `SHOP`. **Appears:** Always. *Nod: the games' in-game trades.*
- **Beats:** Three researchers each want one common Pokémon and offer one uncommon one. The offers are rolled per run from a fixed list of twelve.
- **Reward:** A traded Pokémon arrives with a nickname, a held item and Bond that grows half again as fast.
- **Flags:** `kanto.cinnabar.trades`.

### X9.5 The Big Wave (`cs.kanto.cinnabar.wave`)
- **Kind:** `PS`, a minigame. **Appears:** Roll, on the Seafoam side. *Nod: the anime's surfer and the wave that comes once in twenty years.*
- **Beats:** An old surfer and a blue-eyed Pikachu that can feel waves before they rise. Today is the day of the big one. The player rides it with one of their own Pokémon as the board.
- **Odds:** Three sets, each harder. A Water type forgives one mistake.
- **Reward:** All three: the surfer plants the player's flag on the rock beside two others. A party Pikachu learns *Surf*. Any other Pokémon used as the board gains Bond +2.
- **Fail:** The player is fished out. The surfer says there is always another wave. There is, next run.
- **Flags:** `kanto.cinnabar.wave`.

### X9.6 The Vial (`cs.kanto.cinnabar.vial`)
- **Kind:** `EV`. **Appears:** Trigger: Team Rocket is awake. *Nod: the manga's scientist who could not undo what he made (approx.).*
- **Beats:** An old man with burn scars on one arm, who will not give his name at first (if the Riddle Inn was played, he is the innkeeper, without the wig), asks the player to carry a sealed vial to the mainland. He made something for Team Rocket once. This is the only thing it still answers to.
- **Reward:** Intel +5. If the expanded Kanto event *Blaine Defects* has occurred, he adds a page from his own notes, and in the Extended Cut the fight with Project M2 has one more turn on its timer.
- **Flags:** `kanto.cinnabar.vial`.

---

## X10. THE ROAD TO INDIGO PLATEAU — more

*No Elite Four member and no Champion appears in these spaces. They end at the gate.*

### X10.1 The Torch (`cs.kanto.indigo.torch`)
- **Kind:** `EV`, an escort. **Appears:** Roll, on Route 23. *Nod: the anime's flame, carried to the stadium.*
- **Beats:** A torch lit from Moltres's fire is being run to the Plateau by relay, and the next runner has not turned up. The player is handed it. The trio want it, for reasons that change each time they explain them.
- **Odds:** One battle, fought with the torch in one hand: the player's first move each turn is chosen for them at random from the two they would most likely pick (announced).
- **Reward:** Delivered: an *Ember Charm* (a held item: Fire moves cannot be weakened by rain). The flame burns in the Plateau's bowl in every later run of this save.
- **Fail:** The flame goes out. A very old man relights it from a lantern he has been carrying for this exact purpose, and is not surprised.
- **Flags:** `kanto.indigo.torch`.

### X10.2 The Boulder Hall (`cs.kanto.indigo.boulders`)
- **Kind:** `EV`, a puzzle. **Appears:** Always, inside Victory Road (Volume I §11.1). *Nod: the games' Strength puzzles.*
- **Beats:** Three rooms of boulders and floor switches. A Pokémon that knows Strength, or any Pokémon heavier than 100 kg, can push. Each room has a quick answer and a complete one.
- **Reward:** Quick: through. Complete: a hidden item per room, and in the last room, a nest with a single warm feather in it (a Moltres Sighting flag).
- **Flags:** `kanto.indigo.boulders`.

### X10.3 The Village at the Gate (`cs.kanto.indigo.village`)
- **Kind:** `HUB`. **Appears:** Always, after Victory Road.
- **Beats:** Outside the Plateau's gate there is a fair that never quite packs up: souvenir stalls, a noodle cart, a man who paints badges on jackets, a stage where a Jigglypuff sometimes sings and everyone wakes up with ink on their faces. Trainers who are waiting to go in sit and compare routes.
- **Reward:** Shops; a full rest; and a board where the player may pin one thing from the journey (a keepsake). Later runs find it still pinned.
- **Flags:** `kanto.indigo.village`.

---

## X11. THE ROADS BETWEEN — more route spaces

Route spaces are rolled on the road between towns (Volume I §13). These eleven join that pool. Each is one node unless noted.

### X11.1 The Song (`cs.kanto.route.song`)
- **Kind:** `EV`. *Nod: the anime's Jigglypuff, who only wants someone to stay awake to the end.*
- **Beats:** A Jigglypuff with a marker pen for a microphone asks to sing. The player may listen, plug their ears, or try to stay awake (a timing minigame that gets harder each verse).
- **Reward:** Awake to the end: it is overjoyed and joins, holding the marker (a held item: the foe's first move after it sings is drawn on and has −1 accuracy). Asleep: everyone wakes with ink on their faces; the party's first Pokémon out in the next battle loses its first turn to embarrassment. Ears plugged: it puffs up and leaves.
- **Flags:** `kanto.route.song`.

### X11.2 Dark City (`cs.kanto.route.darkcity`)
- **Kind:** `EV`, one or two battles. **Optional, like Damian's: the two "gyms" are unofficial and give no progress.** *Nod: the anime's town with two feuding gyms.*
- **Beats:** A town with its shutters down. Two unlicensed gyms, one with an Electabuzz and one with a Scyther, have been fighting in the street for the right to call themselves official. Both try to hire the player. An inspector is in town, in disguise, eating at the only open diner.
- **Reward:** [Take a side] money from that side; the town stays shut. [Fight both] two battles; the feud ends; the diner's owner feeds the party. [Tell the inspector] no battles; both lose their signs; Rep +5.
- **Flags:** `kanto.route.darkcity`.

### X11.3 The Fossil Rush (`cs.kanto.route.canyon`)
- **Kind:** `PS`, short. *Nod: the anime's canyon and what was asleep under it.*
- **Level:** +1.
- **Beats:** A canyon full of amateur diggers. The trio's dynamite opens a cavern of Pokémon that have been asleep for a very long time and wake up hungry: Omastar, Kabutops, and above them an Aerodactyl that picks up one of the player's Pokémon and flies off with it.
- **Odds:** A chase of three turns. Flying or ranged moves bring it down; so does a lullaby, if the Song (X11.1) has been met.
- **Reward:** The carried Pokémon gains Bond +2 for the fright. A fossil of the player's choice, and a **strange egg** found in the rubble (X11.4).
- **Fail:** The Aerodactyl drops it, unharmed, a mile away. No egg.
- **Flags:** `kanto.route.canyon`, `kanto.route.egg`.

### X11.4 Who Keeps the Egg (`cs.kanto.route.egg`)
- **Kind:** `EV`. **Appears:** Trigger: five nodes after the egg is found. *Nod: the anime's egg, and the argument over it.*
- **Beats:** The egg hatches. It is a Togepi. It bonds to whoever it sees first. Everyone in the party wants it to be them, and the player must pick who is holding it at the moment.
- **Reward:** If a party Pokémon held it: that Pokémon and the Togepi become a chemistry pair. If the player held it: the Togepi's Bond starts at 3. If the rival or the Friend was present and was handed it: it is theirs, their Attitude rises by 1, and it is seen again at the climax.
- **Flags:** `kanto.route.egg-hatched`.

### X11.5 The Bargain Day-Care (`cs.kanto.route.daycare`)
- **Kind:** `EV`, one battle. *Nod: the anime's breeding center that was too cheap to be true.*
- **Beats:** A new day-care offers a week's boarding for almost nothing. Its two cheerful owners are **Butch and Cassidy**. The back room is full of other people's Pokémon in crates.
- **Odds:** If the player leaves a Pokémon, it is safe (it is on top of the pile) and is recovered in the battle. If the player looks in the back first, the battle starts with the element of surprise.
- **Reward:** The crates are opened. Rep +5; Intel +3; one grateful owner gives an item. Butch's name is got wrong by the police report.
- **Fail:** They leave in a van. The player's Pokémon, if left, is thrown out of the back of it, indignant.
- **Flags:** `kanto.route.daycare`.

### X11.6 The Estate (`cs.kanto.route.estate`)
- **Kind:** `EV`. *Nod: the anime's wedding that James ran away from.*
- **Beats:** A notice: a wealthy couple have died, and their missing son must be found to inherit. The player is carried along by Jessie and Meowth, who have done the sums. James does not want to go. At the estate: his parents (alive), his fiancée (with a whip), and a Growlithe in a kennel that has waited for him for years.
- **Reward:** [Help him run] Trio reputation +10; the Growlithe sees them off. [Stay out of it] the same thing happens without the player. In either case a *Fire Stone* is found in the driveway, and Meowth says something about family that he later denies.
- **Flags:** `kanto.route.estate`.

### X11.7 The Leek Thief (`cs.kanto.route.leek`)
- **Kind:** `EV`, a chase. *Nod: the anime's boy and his Farfetch'd.*
- **Beats:** A polite boy with a Farfetch'd asks the player to hold his bag for a moment. It is full of rocks. The player's bag is gone.
- **Odds:** He is found in the reeds two nodes later. He steals because his Farfetch'd has never won a battle, and he thinks nobody would want it.
- **Reward:** Everything is returned. [Battle the Farfetch'd, and let it see it can win] it stops; he stops; the player is given its spare *Leek*. [Take the bag and go] nothing more.
- **Flags:** `kanto.route.leek`.

### X11.8 The Hero's Visit (`cs.kanto.route.hero`)
- **Kind:** `EV`. *Nod: the anime's kindergarten.*
- **Beats:** A teacher has promised her class a visit from a Pokémon trainer. One small boy insists a Meowth once saved his life and will accept no other hero. The player's Pokémon may put on a show; the trio's Meowth, passing, may be talked into the part for a meal.
- **Reward:** Each party Pokémon that performs gains Bond +1. If Meowth plays the hero: Trio reputation +5, and he stays in character slightly too long.
- **Flags:** `kanto.route.hero`.

### X11.9 On Location (`cs.kanto.route.film`)
- **Kind:** `EV`. *Nod: the anime's film shoot.*
- **Beats:** A director is casting the lead opposite a famous and impossible Wigglytuff. Auditions: one of the player's Pokémon must hit a mark, hold a pose and cry on cue.
- **Odds:** Judged on Bond and on the Pokémon's nature. A stubborn Pokémon gets the part by refusing to be upstaged.
- **Reward:** Cast: money, a *Screen Ribbon* (a keepsake), and that Pokémon is recognised by fans in every later town (shop prices −5% while it leads the party). Not cast: a walk-on, and lunch.
- **Flags:** `kanto.route.film`.

### X11.10 The Stolen Badges (`cs.kanto.route.badges`)
- **Kind:** `EV`, one battle. *Nod: the anime's trainer with a Marowak.*
- **Level:** +1.
- **Beats:** A trainer with eight badges and a Marowak looks down on the player, loudly. That night the trio steal his badge case. He cannot enter the League without it, and comes to ask for help, less loudly.
- **Reward:** Recover the case (a battle with the trio, beside him): he battles the player afterwards as thanks, properly. Win or lose: a *Thick Club*, and one honest tip about the road ahead. The badges are his, and stay his.
- **Flags:** `kanto.route.badges`.

### X11.11 The Buried City (`cs.kanto.route.buried`)
- **Kind:** `PS`, a set piece. *Nod: the anime's ruins, and the two giants that woke in them.*
- **Level:** no ordinary battle.
- **Beats:** A storm uncovers a temple. Inside: a giant spoon, a black bell, and two relics that should not be put together and are. A Gengar and an Alakazam the size of buildings rise and fight each other across the valley, with no interest in anyone below.
- **Odds:** They cannot be beaten. They can be **put to sleep**: by the Song (X11.1), or by returning both relics to their niches while dodging the fight (six turns).
- **Reward:** An archaeologist's thanks, an ancient coin (sells very well, or can be left in the Museum for a plaque), and a Sighting flag for a Legendary of the player's region of origin.
- **Fail:** The giants tire themselves out by dawn. The valley is a mess. No coin.
- **Flags:** `kanto.route.buried`.

---

## X12. THE SEVII ISLANDS — a new, optional chain

### X12.1 How it fits

The Sevii Islands are an **optional Interlude** after Stage 7 (Cinnabar). A man on the Cinnabar dock offers a ferry pass. Accepting adds the island chain; declining costs nothing.

| Rule | Value |
| --- | --- |
| Slot | **Interlude 7**: between Stage 7 and Stage 8. It does not advance the stage counter |
| Length | The run visits **three** of the seven islands (the player picks from the ferry board), plus One Island, which is always first |
| Level | Stage 7's level, +0 to +2, shown on the ferry board per island |
| Spaces per island | Two or three; the player may do any or none |
| Gyms | None. The islands have no Gyms and no League |
| Return | From any island's dock, at any time |
| Setting | `kanto.sevii` (default **on**). Off: the man on the dock is not there |

**The thread.** A network engineer on One Island is trying to link Kanto's storage system to regions further away. He needs two gems, a **Ruby** and a **Sapphire**. Finding both finishes the chain and is how the player earns more **Network Machines** (Volume I §0.5).

### X12.2 One Island — Knot Island *(always first)*

**The Network Center (`cs.kanto.sevii.network`)**
- **Kind:** `HUB`, small. **Appears:** Always.
- **Beats:** A Pokémon Center with a machine the size of a wall and one engineer who has not slept. He gives the player a **Tri-Pass** (three islands) and asks them to keep an eye out for a red stone.
- **Reward:** A full rest. With the Ruby: one **Network Machine**. With the Ruby and the Sapphire: a second, and the machine comes on; from then on, in this save, Pokémon stored in earlier runs can be *seen* (not withdrawn) at any Center.
- **Flags:** `kanto.sevii.pass`, `kanto.sevii.ruby`, `kanto.sevii.sapphire`.

**Ember Spa and the Summit (`cs.kanto.sevii.ember`)**
- **Kind:** `PS`. *Nod: the games' Mt. Ember.*
- **Level:** +1.
- **Beats:** A hot spring at the mountain's foot (a free rest, once). Halfway up, two Team Rocket Grunts are digging and arguing about a password. At the summit, a scorched nest.
- **Reward:** Beat the Grunts: the **Ruby**, in the tunnel they opened, and the first half of a password. Reach the summit: a Moltres Sighting flag.
- **Fail:** The Grunts keep digging. The Ruby can be bought later on Two Island, expensively.
- **Flags:** `kanto.sevii.ember`, `kanto.sevii.password1`.

### X12.3 Two Island — Boon Island

**The Growing Stall (`cs.kanto.sevii.stall`)**
- **Kind:** `SHOP`. *Nod: the games' shop that stocks more as the player does more.*
- **Beats:** A shopkeeper with almost nothing to sell. Each Sevii space the player completes adds a row to her shelves.
- **Reward:** By the end, the best shop in Kanto. Her prices never rise.
- **Flags:** none (reads the count of Sevii flags).

**The Move Maniac (`cs.kanto.sevii.maniac`)**
- **Kind:** `SHOP` (a service). *Nod: the games.*
- **Beats:** A man who will teach any Pokémon a move it has forgotten, for mushrooms. He will also, for a Big Mushroom, teach one move the Pokémon *could have* learned at a lower level and never did.
- **Flags:** none.

**The Missing Girl (`cs.kanto.sevii.missing`)**
- **Kind:** `EV`. **Appears:** Trigger, sets up Three Island.
- **Beats:** The game-corner owner's small daughter went to pick berries on the next island and has not come back. He cannot leave the shop. He does not ask; he just says it, twice.
- **Flags:** `kanto.sevii.missing`.

### X12.4 Three Island — Kin Island

**The Bikers (`cs.kanto.sevii.bikers`)**
- **Kind:** `EV`, three battles. *Nod: the games' gang that rode over from the mainland.*
- **Level:** +0.
- **Beats:** A mainland biker gang has taken over the island's one street. The islanders are standing in a line across it, with their arms folded and no Pokémon.
- **Reward:** Three battles: the gang leaves. If the Bridge Run patch (X6.5) is held, they leave without a fight, embarrassed. The islanders give a *Full Restore* and directions to the forest.
- **Flags:** `kanto.sevii.bikers`.

**Berry Forest (`cs.kanto.sevii.berryforest`)**
- **Kind:** `PS`, short. *Nod: the games' lost girl and the Hypno.*
- **Level:** +1.
- **Beats:** A forest of berry trees and a small girl who is not lost, exactly, but cannot seem to leave. Something with a pendulum is behind her.
- **Reward:** Beat or outstare the Hypno: the girl walks home; her father gives a *Nest Ball* bundle and the stall gains two rows. The forest's berries can be picked: six, of the player's choice.
- **Flags:** `kanto.sevii.berryforest`.

### X12.5 Four Island — Floe Island

**Icefall Cave (`cs.kanto.sevii.icefall`)**
- **Kind:** `PS`. *Nod: the games' ice cave. No Elite Four member appears; the cave's defender here is a local.*
- **Level:** +1.
- **Beats:** Slippery floors, a waterfall, and at the back a cove where Lapras come to raise their young. Team Rocket poachers are loading crates. An islander named **Old Winter**, who has watched the cove for fifty years with a Dewgong, is standing in front of them and losing.
- **Reward:** Fight beside her (a Double Battle): the poachers leave; the second half of the Rocket password is on a dropped clipboard; a young Lapras follows the player to the cave mouth and may be invited further.
- **Fail:** One crate leaves. It is seen again in the Rocket Warehouse.
- **Flags:** `kanto.sevii.icefall`, `kanto.sevii.password2`.

**The Island Day-Care (`cs.kanto.sevii.daycare`)**
- **Kind:** `SHOP` (a service).
- **Beats:** An old couple who will look after two Pokémon while the player is on the islands. Pokémon left together return as a chemistry pair if they were not one already.
- **Flags:** none.

### X12.6 Five Island — Chrono Island

**The Rocket Warehouse (`cs.kanto.sevii.warehouse`)**
- **Kind:** `PS`. **Appears:** needs both halves of the password. *Nod: the games' warehouse, and the Rockets who had not heard the news.*
- **Level:** +2 (shown).
- **Beats:** A warehouse behind a password door. Crates stencilled for Vermilion, for Olivine, and for an address that is only a number. Two Admins and a Scientist who holds the **Sapphire**.
- **Odds:** What the Admins say depends on the run. If Kanto's climax is already won: "Disbanded? The Boss would *never*." They fight harder for it. If it is not: they are a supply depot, and nervous.
- **Reward:** The **Sapphire**. Intel +5; Heat +5. With the Grand Arc on, one crate holds a waveform printout that matches the Listening Post's dots (X5.2), and Meowth, if the trio are friendly, reads the stencil aloud.
- **Fail:** The Scientist leaves with the Sapphire for Six Island (see the Dotted Hole).
- **Flags:** `kanto.sevii.warehouse`.

**The Lost Cave (`cs.kanto.sevii.lostcave`)**
- **Kind:** `PS`, a maze. *Nod: the games' cave where the rocks point the way.*
- **Beats:** Each room has four exits. The number of boulders in the room says which is right. A wealthy young lady went in to prove she was not afraid and is now sitting very still in the last room, afraid.
- **Reward:** Walk her out: tea at her family's resort (a full rest), and a random valuable she insists on ("Whatever is in my bag. I do not carry anything dull.").
- **Flags:** `kanto.sevii.lostcave`.

**The Memorial Pillar (`cs.kanto.sevii.pillar`)**
- **Kind:** `EV`. *Nod: the games.*
- **Beats:** A boy stands at a stone on a small island. His Onix is buried here. He has run out of lemonade to leave for it, and it liked lemonade.
- **Reward:** Leave a drink: he gives *TM Metal Claw* and says its name. If the player has made an Offering in Lavender (X5.5), he recognises the look.
- **Flags:** `kanto.sevii.pillar`.

### X12.7 Six Island — Fortune Island

**The Dotted Hole (`cs.kanto.sevii.dottedhole`)**
- **Kind:** `PS`, a puzzle. *Nod: the games' ruin written in dots.*
- **Beats:** A door that opens to Cut. Inside, floors with holes in them and signs in raised dots: up, down, left, right. The dots are the same alphabet as the Listening Post's notes. At the bottom, the Sapphire's pedestal.
- **Reward:** If the Sapphire is still here (the Warehouse was not done or was failed): the **Sapphire**, and one battle with the Scientist who comes to take it. If it was already won: an inscription instead, which the engineer on One Island can read, and an Unown Sighting flag.
- **Flags:** `kanto.sevii.dottedhole`.

**Pattern Bush (`cs.kanto.sevii.patternbush`)**
- **Kind:** `EV`, up to six short battles. *Nod: the games' grass maze of Bug Catchers.*
- **Level:** +0.
- **Beats:** Tall grass cut into a pattern that can only be seen from the cliff above. Bug Catchers, a Heracross that nobody has caught, and a prize for whoever walks the whole pattern.
- **Reward:** The whole pattern: a Heracross encounter and a *Silver Powder*.
- **Flags:** `kanto.sevii.patternbush`.

**The Altering Cave (`cs.kanto.sevii.altering`)**
- **Kind:** `EV`. *Nod: the games' cave that was meant to change.*
- **Beats:** A plain cave. What lives in it is different in every run: the wild pool is rolled from another region entirely.
- **Reward:** One encounter the rest of Kanto cannot offer.
- **Flags:** none.

### X12.8 Seven Island — Quest Island

**Trainer Tower (`cs.kanto.sevii.tower`)**
- **Kind:** `PS`, a timed gauntlet. *Nod: the games.*
- **Level:** +1.
- **Beats:** A tower of trainers and a clock on the roof. Four modes: Single, Double, Knockout and Mixed. No items. The time is posted on a board with the times of everyone in this save who has climbed it.
- **Reward:** Finish: a prize by mode. Beat the save's best time: the owner's own held item, different each run.
- **Fail:** The player is walked back down, kindly.
- **Flags:** `kanto.sevii.tower`.

**The Tanoby Chambers (`cs.kanto.sevii.tanoby`)**
- **Kind:** `PS`, a puzzle. *Nod: the games' seven chambers and the key that opens them.*
- **Beats:** A boulder puzzle in a sea cave. Solving it changes something far away: seven small ruins on the south cliffs, empty before, are no longer empty.
- **Reward:** The chambers hold Unown, each chamber a different set of letters. Catching a full word (any four that spell something) earns a carved tile from the ruin-keeper. The word is kept in the Notebook.
- **Flags:** `kanto.sevii.tanoby`.

**Sevault Canyon (`cs.kanto.sevii.canyon`)**
- **Kind:** `EV`, up to four battles.
- **Level:** +2 (shown).
- **Beats:** The hardest ordinary trainers in Kanto train here because nobody comes. They are delighted to see somebody come.
- **Reward:** Money, and from the last of them, a dance. Performing it for a Pokémon that knows no status move teaches it one.
- **Flags:** `kanto.sevii.canyon`.

### X12.9 The far islands

Two more islands are on the ferry board in grey. Neither is part of the chain. Each becomes a destination only if the player holds its ticket, which is a rare reward elsewhere in the pack.

| Island | Ticket | What is there |
| --- | --- | --- |
| **Navel Rock** (`cs.kanto.sevii.navel`) | *Mystic Ticket* | A long stair up and a long stair down. A Ho-Oh Sighting at the top if `kanto.sighting.rainbow` is set (X1.1); a Lugia Sighting at the bottom otherwise |
| **Birth Island** (`cs.kanto.sevii.birth`) | *Aurora Ticket* | An empty island with one black triangle on it, which moves when approached. A puzzle of steps. A Deoxys Sighting |

Sightings follow the pack's Legendary Sighting rules. They are not battles here.

---

## X13. Index by source

| Source | Spaces in this volume |
| --- | --- |
| **Anime** | Spearow Storm, Center Siege, Convertible, Ten Brothers and Sisters, Water Wheel, Scientist Who Stayed, Water Ballet, Pokémon Tech, AJ's Tent, Capsized Liner, Island of Giants, Porta Vista, Naptime, The Dam, Photographer, Scissor Street, Bridge Run, Greenhouse Fire, Big P Ranch, Child of the Herd, Lake Nobody Fishes, Weakest Paras, Carnival, House of Imitation, Admissions Exam, Riddle Inn, Sleeper on the Beach, Big Wave, The Torch, and all eleven route spaces |
| **Manga** *(approx.)* | Healer in the Straw Hat, Museum After Hours, The Serum, Girl with the Stall, River Gyarados, Unstable Eevee, The Seam, The Vial |
| **Games** | Night Market, Route 3 Ladder, Bike in the Window, Itemfinder, Name Rater, Channelers' Vigil, The Orphan, The Diner, The Poster, Developers' Room, Rod Brothers and Move Deleter, Bird Keepers' Maze, Mr. Psychic, Teleport Girl, The Backlog, Trade Wing, Boulder Hall, and all twenty Sevii spaces |
| **Original to this pack** | Second Offer, Listening Post, The Offering, Pidgey Post, Village at the Gate |

---

## X14. Where these meet the Expanded Edition

| Space | Meets | How |
| --- | --- | --- |
| Museum After Hours | Named Shadow **Shellshock** | Registering the fossil is its key |
| The Orphan | Story-bound Shadow **Marrowmother** | The Cubone is the story key |
| Channelers' Vigil | Named Shadow **The Black Fog** | A calmed vigil makes the Tower's Site Cleansing available without a battle |
| Child of the Herd | Named Shadow **Matron**; Raid 5 *Safari Night Poach* | The herd fights beside the player and finds the truck sooner |
| The Serum, River Gyarados, Unstable Eevee | The Capture Rig; the Black-Label line | Each shows the method at Street scale before the script explains it |
| Second Offer | The Inside Man route; `rocket.x.wire` | An early recruitment, or a police tip |
| The Poster | Raid 2, *The Celadon Hideout* | Starts one room further in |
| Listening Post, Rocket Warehouse, Dotted Hole | The Grand Arc | The pulse, the crates and the dots are the same thread, and each stands alone if the Grand Arc is off |
| The Seam | Extended Cut Phase 1, *The Streets* | Anchors marked, or one counted as beaten |
| The Vial | Extended Cut Phase 6, *Project M2* | One more turn, if *Blaine Defects* occurred |
| The Offering, Memorial Pillar | The Region of Doom's Pale Garden | The Memorial wall |
| Spearow Storm | Navel Rock | Which Sighting is at the top |
| Healer in the Straw Hat, Rod Brothers and Move Deleter | The Shadow system | −10 Corruption once; forgetting a Shadow move |

Every link is optional in both directions. A space with its link unmet still gives its own reward.

---

## X15. Flag registry (additions, all `kanto.*`)

| Flag | Set by |
| --- | --- |
| `viridian.spearow`, `sighting.rainbow`, `viridian.center.saved`, `viridian.healer`, `viridian.convertible` | X1 |
| `pewter.siblings`, `pewter.wheel`, `pewter.afterhours`, `pewter.fossil-registered`, `pewter.ladder`, `pewter.seymour`, `pewter.serum` | X2 |
| `cerulean.ballet`, `cerulean.tech`, `cerulean.aj`, `cerulean.bike`, `cerulean.bike-debt`, `cerulean.recruiter`, `cerulean.stall`, `ally.stall-girl`, `cerulean.gyarados` | X3 |
| `vermilion.capsized`, `vermilion.giants`, `vermilion.portavista`, `vermilion.naptime`, `vermilion.dam`, `vermilion.photographer`, `vermilion.itemfinder` | X4 |
| `lavender.pulse`, `lavender.vigil`, `lavender.orphan`, `lavender.offering` | X5 |
| `celadon.salon`, `celadon.coincase`, `celadon.poster`, `celadon.devroom`, `celadon.bridgerun`, `celadon.greenhouse`, `celadon.vee` | X6 |
| `fuchsia.ranch`, `fuchsia.herd`, `fuchsia.dragonlake`, `fuchsia.birdmaze`, `fuchsia.paras`, `fuchsia.carnival` | X7 |
| `saffron.mrpsychic`, `saffron.imite`, `saffron.exam`, `saffron.seam`, `saffron.post` | X8 |
| `cinnabar.inn`, `cinnabar.sleeper`, `cinnabar.backlog`, `cinnabar.trades`, `cinnabar.wave`, `cinnabar.vial` | X9 |
| `indigo.torch`, `indigo.boulders`, `indigo.village` | X10 |
| `route.song`, `route.darkcity`, `route.canyon`, `route.egg`, `route.egg-hatched`, `route.daycare`, `route.estate`, `route.leek`, `route.hero`, `route.film`, `route.badges`, `route.buried` | X11 |
| `sevii.pass`, `sevii.ruby`, `sevii.sapphire`, `sevii.ember`, `sevii.password1`, `sevii.password2`, `sevii.missing`, `sevii.bikers`, `sevii.berryforest`, `sevii.icefall`, `sevii.warehouse`, `sevii.lostcave`, `sevii.pillar`, `sevii.dottedhole`, `sevii.patternbush`, `sevii.tower`, `sevii.tanoby`, `sevii.canyon` | X12 |

**Settings added:** `townRoll.bonus` (default 0), `kanto.sevii` (default on).

---

## X16. Questions, and counts

### X16.1 Questions for you

1. **The Sevii Islands as an Interlude.** I placed them after Cinnabar, optional, three islands per run. Would you rather they were a region of their own, or all seven in one run?
2. **Gym Leaders outside their Gyms.** Four scenes here involve a Gym Leader or a Gym Leader's family away from the Gym (Ten Brothers and Sisters, the Water Ballet, the Greenhouse Fire, the Riddle Inn), with no Gym battle. If "remove Gym battles" should also mean "keep Gym Leaders out of other scenes", these four can be re-cast with ordinary townspeople in one line each.
3. **"Unofficial gym" scenes.** AJ's Tent and Dark City follow the rule you set for Damian's (optional event, no progress). Say if you would rather have only Damian's.
4. **The Network Machine.** I made the Sevii chain the main way to earn more of them (two). Is two the right number?
5. The questions in Volume I §15.2 are still open.

### X16.2 Counts

| | Volume I | Volume II | Together |
| --- | --- | --- | --- |
| Towns and areas | 10 | +1 (the Sevii Islands, as seven islands and two far ones) | 11 |
| Spaces (`cs.kanto.*` ids) | 73 | 115 | 188 |
| Of which route spaces | — | 23 | — |
| Of which on the Sevii Islands | — | 25 | 25 |
| Settings added | — | `townRoll.bonus`, `kanto.sevii` | — |

---

## X17. STILL MORE — a second helping of 25

Your note said the list "keeps going and going." These twenty-five keep going. They follow the same spec block and the same rules (X0.2): no Pallet Town, no Gym battles, no Elite Four, no Champion. All are **Roll** unless marked.

### X17.1 In the towns

**The Kind Stranger (`cs.kanto.pewter.stranger`)**
- **Kind:** `EV`. **Appears:** Roll, inside Veridian Forest. *Nod: the manga's well-dressed man in the forest (approx.).*
- **Beats:** The player is lost, or a party Pokémon is poisoned. A man in a good suit, out walking, has an Antidote and knows the way. He asks about the player's Pokémon with real interest, and listens to the answers. He does not give his name.
- **Reward:** A cure, a shortcut out, and one sound piece of advice about Ground types. Much later, in the climax, the player recognises the suit. A line of the Leader's is different for it.
- **Flags:** `kanto.pewter.stranger`.

**Visitors (`cs.kanto.pewter.visitors`)**
- **Kind:** `EV`, a chase. **Appears:** Roll, near Mt. Moon. *Nod: the anime's Clefairy and their ship.*
- **Beats:** Things have been going missing all over town: kettles, clocks, a bicycle bell, one of the player's items. A man who believes in visitors from space is delighted. The trail leads to a cave where Clefairy are building something out of all of it.
- **Odds:** It launches whether or not the player interferes. It lands again 40% of the time.
- **Reward:** The player's item back, a *Comet Shard*, and (if it lands) a Clefairy that has decided to stay on the ground.
- **Flags:** `kanto.pewter.visitors`.

**Triage (`cs.kanto.vermilion.triage`)**
- **Kind:** `EV`, a minigame. **Appears:** Roll. *Nod: the anime's night at the overwhelmed clinic.*
- **Beats:** A lorry of Pokémon has overturned on the coast road and the nearest Center is full. A human doctor's surgery takes the overflow, and the doctor has never treated a Pokémon. The player and a Chansey sort the queue: who first, who can wait, who is only frightened.
- **Odds:** Six patients. Each right call saves time for the next.
- **Reward:** By calls made right: Potions; a *Lum Berry* bundle; at six, the doctor's Chansey teaches one party Pokémon *Soft-Boiled* or the nearest thing it can learn.
- **Fail:** Everyone is treated in the end. The player is thanked and handed a mop.
- **Flags:** `kanto.vermilion.triage`.

**The Building Site (`cs.kanto.vermilion.site`)**
- **Kind:** `EV`. **Appears:** Always. *Nod: the games' old man and the Machop that has been flattening the same lot for decades.*
- **Beats:** "I'm getting my land ready for a building." He says it every time. A Fighting-type from the party may help for a while.
- **Reward:** A Pokémon that helps gains a little experience and Bond +1. The building is not started. On a second visit in Stage 8, it is still not started. In any later run of this save, there is a single brick.
- **Flags:** `kanto.vermilion.site` (a count across runs).

**The Rival in the Tower (`cs.kanto.lavender.rival`)**
- **Kind:** `EV`, one battle. **Appears:** Trigger: Pokémon Tower is in the menu and a rival exists. *Nod: the manga's fight among the graves (approx.).*
- **Level:** +1.
- **Beats:** On the third floor the rival is standing very still, eyes open, with their Pokémon fighting things that are not there. Something has them. It lets go if it is beaten, or if the rival's name is said by someone they trust.
- **Odds:** At Warm attitude or better, saying their name works and there is no battle.
- **Reward:** Rival Attitude +1. They do not remember it clearly and are embarrassed anyway. They give the player the *Silph Scope* they came in with, if the player has none.
- **Flags:** `kanto.lavender.rival`.

**The Festival of Dolls (`cs.kanto.celadon.festival`)**
- **Kind:** `HUB` event, with an optional small tournament. **Appears:** Roll. *Nod: the anime's shopping festival.*
- **Beats:** For one day everything in the Department Store is nearly free, and the crowd is ferocious. On the roof, a four-battle knockout for a set of antique dolls. Jessie is in it, in earnest, because she never had any.
- **Level:** previous stage. No items in the tournament.
- **Reward:** Shop prices −50% for this visit. Tournament winner: the dolls (a keepsake). Giving them to Jessie afterwards: Trio reputation +10, and she does not know what to do with her face.
- **Flags:** `kanto.celadon.festival`.

**The Secret House (`cs.kanto.fuchsia.secrethouse`)**
- **Kind:** `EV`, a timed walk. **Appears:** Always, if Safari Land (Volume I §8.3) is in the menu. *Nod: the games' prize at the far end of the Zone.*
- **Beats:** A house at the very back of the reserve. A man inside gives a prize to anyone who reaches him before their step count runs out.
- **Odds:** 500 steps. Stopping to catch something costs steps. So does every patch of long grass.
- **Reward:** Reached: *HM Surf*, or if the player already has it, a *Golden Teeth* replica that the Warden finds very funny. Not reached: the loudspeaker calls time and the player is walked back.
- **Flags:** `kanto.fuchsia.secrethouse`.

**The Shell on the Tail (`cs.kanto.cinnabar.shellder`)**
- **Kind:** `EV`. **Appears:** Roll, on the Seafoam side. *Nod: the anime's professor who had studied one question for his whole life.*
- **Beats:** A professor, fifth of his line to hold the post, cannot work out why a Slowpoke evolves when a Shellder bites its tail. He has a Slowpoke, a rock pool, and a lot of portraits of his ancestors looking disappointed. The trio arrive, a Shellder is thrown, and the question answers itself in front of him.
- **Reward:** He is overjoyed, and then realises he has nothing left to study. A *King's Rock*. He asks the player for a new question: whatever the player suggests is what he is found working on in every later visit.
- **Flags:** `kanto.cinnabar.shellder`.

### X17.2 On the roads

**Where It Was Happy (`cs.kanto.route.goodbye`)**
- **Kind:** `EV`. *Nod: the anime's forest of wild Pikachu.*
- **Beats:** A wood full of the same species as the player's lead Pokémon, living wild and well. It has never been so happy. That evening the player may leave quietly and let it stay.
- **Odds:** If the player leaves: it comes running after them before the edge of the trees. Always. The others come out to see it off.
- **Reward:** Bond set to its maximum for that Pokémon. If the player does *not* try to leave, nothing changes; it was never going to stay.
- **Flags:** `kanto.route.goodbye`.

**The Training Course (`cs.kanto.route.k9`)**
- **Kind:** `EV`, a minigame. *Nod: the anime's police dogs.*
- **Beats:** The player is arrested, briefly, by six Growlithe, for looking like a burglar. By way of apology the officer in charge lets a party Pokémon try the training course: walls, a tunnel, and obeying a command with the trainer's voice disguised.
- **Odds:** The last test is passed only by a Pokémon whose Bond is Friendly or better. It knows the player by smell.
- **Reward:** Passed: Rep +3, an officer's whistle (the next authority or police encounter in the region is friendly), and where the expanded Kanto script checks for a police tip, this counts as one.
- **Flags:** `kanto.route.k9`.

**The Old Street (`cs.kanto.route.oldstreet`)**
- **Kind:** `EV`. **Appears:** Trigger: trio reputation +10 or more. *Nod: the anime's story of where Meowth learned to talk.*
- **Beats:** The road passes through a film town. Meowth goes quiet. There is an alley he knows, a gang of street cats who remember him, and a pampered cat in a window who once told him he was not good enough because he was not human enough. He learned to walk and talk for her. She said that made him a freak.
- **Reward:** [Stand with him] no battle; the gang's leader is faced down; Trio reputation +10. Meowth: "Don't tell them two I was here." From now on he is the trio member who warns the player when a favor is owed.
- **Flags:** `kanto.route.oldstreet`.

**Inside the Machine (`cs.kanto.route.transfer`)**
- **Kind:** `PS`. *Nod: the anime's trip into the transfer system. Staged without flashing effects.*
- **Level:** +1.
- **Beats:** A Pokémon Center's transfer machine is losing Poké Balls in transit. Its engineer sends the player *in*, with a Porygon as a guide. Inside: corridors of light, the trio with a Porygon of their own and a roadblock, and an anti-virus program that cannot tell thieves from visitors.
- **Odds:** Two battles, then a run for the exit ahead of the anti-virus (four turns).
- **Reward:** The lost Poké Balls go where they were sent. The guide Porygon asks to stay with the player. If the trio were helped to the exit too: Trio reputation +10.
- **Fail:** Everyone is ejected, dizzy. The Balls arrive a day late.
- **Flags:** `kanto.route.transfer`.

**Snowed In (`cs.kanto.route.snow`)**
- **Kind:** `EV`. *Nod: the anime's night in the snow.*
- **Beats:** A blizzard on a mountain road. The player digs a snow cave. The Pokémon will be warmer in their Balls, and will not go: every one of them comes back out to keep the player warm instead.
- **Odds:** A Fire type makes the night easy. Without one, the party huddles, and it is still enough.
- **Reward:** Every party Pokémon gains Bond +1. Any Shadow Pokémon in the party loses 5 Corruption: it stayed too.
- **Flags:** `kanto.route.snow`.

**The Bicycle Race (`cs.kanto.route.bikerace`)**
- **Kind:** `PS`, a race. **Appears:** Roll, if the player has the Bicycle. *Nod: the manga's race with a very heavy passenger (approx.).*
- **Beats:** A town race with a good prize. The rules say the rider's lead Pokémon must be on the bike. The player's heaviest Pokémon wants to be the one.
- **Odds:** Three legs. A heavy passenger is slow uphill and unstoppable downhill; a light one is the reverse.
- **Reward:** A place on the podium: a *Leftovers*, or a *Soothe Bell*. Last place with a Snorlax on the handlebars: the crowd's favorite, and a year of free food at the finish-line diner.
- **Flags:** `kanto.route.bikerace`.

**The Gamblers (`cs.kanto.route.gamblers`)**
- **Kind:** `EV`, up to three battles. *Nod: the games' Route 8.*
- **Level:** previous stage.
- **Beats:** Three Gamblers who decide everything by a coin: which Pokémon they lead with, which move they open with, whether they pay up.
- **Odds:** Shown before each battle: the coin. The player may call it. A right call lets the player pick the Gambler's lead.
- **Reward:** Double money per win. All three: an *Amulet Coin*.
- **Flags:** `kanto.route.gamblers`.

**The Vs. Seeker (`cs.kanto.route.seeker`)**
- **Kind:** `EV`. **Appears:** Always, at the first Center after Stage 2. *Nod: the games.*
- **Beats:** A woman at the Center's counter hands over a device she no longer uses.
- **Reward:** The **Vs. Seeker**: once per stage, a route trainer the player has already beaten may be challenged again, at the current stage's level, for money. It never works on officers, rivals or anyone with a name in the Dossier.
- **Flags:** `kanto.route.seeker`.

**The Fame Checker (`cs.kanto.route.fame`)**
- **Kind:** `EV`. **Appears:** Always, with the Vs. Seeker. *Nod: the games.*
- **Beats:** A small recorder that collects what people say about well-known trainers. Townsfolk across Kanto each have one remark.
- **Reward:** Each remark fills a line in the Notebook. In the Expanded Edition, six remarks about any **what-if** character (a Gym Leader on a team's payroll, say) reveal that character's way back in the Dossier.
- **Flags:** `kanto.route.fame` (a count).

**Lost and Found (`cs.kanto.route.underground`)**
- **Kind:** `EV`. *Nod: the games' Underground Paths.*
- **Beats:** A long tunnel under a city that is not letting anyone in. People drop things in the dark. A girl at the far end wants to trade one Pokémon for another and has been waiting some time.
- **Reward:** Two hidden items (three with the Itemfinder). The trade: a common Pokémon for one from the far side of the region, already nicknamed.
- **Flags:** `kanto.route.underground`.

**The Swimmers' Relay (`cs.kanto.route.relay`)**
- **Kind:** `EV`, a race and up to four battles. *Nod: the games' sea routes.*
- **Level:** previous stage.
- **Beats:** Swimmers on the open-water routes race each other from buoy to buoy and battle at each one. The player may join the relay on any Pokémon that can carry them.
- **Reward:** Money per buoy. First to the last buoy: a *Mystic Water* or *Wave Incense*, and a tired, pleased Pokémon (Bond +1).
- **Flags:** `kanto.route.relay`.

**The Aides (`cs.kanto.route.aides`)**
- **Kind:** `EV`. **Appears:** Always, one per gatehouse. *Nod: the games' researchers who count your species.*
- **Beats:** In the upstairs room of four route gates sits a researcher's aide with a clipboard. Each has one gift and one number.
- **Reward:** At 10 species registered: a lamp (dark routes no longer lower accuracy). At 20: an *Exp. Share*. At 30: the Itemfinder (X4.7). At 40: an *Amulet Coin*. None of them says who they work for, and none of them sends the player anywhere.
- **Flags:** `kanto.route.aides` (a count).

### X17.3 On the Sevii Islands

**The Joyful Game Corner (`cs.kanto.sevii.joyful`)**
- **Kind:** `HUB`, small. **Appears:** Always, on Two Island, once the Missing Girl is home. *Nod: the games.*
- **Beats:** Two minigames for small Pokémon: a jumping game (rope, rhythm) and a berry-picking race for anything with more than one head. No stakes.
- **Reward:** Berries by score. A party Pokémon that plays gains Bond +1, once.
- **Flags:** `kanto.sevii.joyful`.

**Treasure Beach (`cs.kanto.sevii.treasure`)**
- **Kind:** `EV`. **Appears:** Roll, on One Island. *Nod: the games.*
- **Beats:** A beach that gives things back at low tide.
- **Odds:** Three finds per visit; five with the Itemfinder. One find in ten is something the player lost earlier in the run.
- **Reward:** Pearls, a Star Piece, shells.
- **Flags:** `kanto.sevii.treasure`.

**The Lady of the Resort (`cs.kanto.sevii.resort`)**
- **Kind:** `EV`. **Appears:** Roll, on Five Island, after the Lost Cave. *Nod: the games.*
- **Beats:** The young lady from the Lost Cave is bored. She names a Pokémon she would like to see, a different one each time. If the player has one in the party, she claps.
- **Reward:** Each one shown: a valuable from her bag. She has no idea what any of it is worth.
- **Flags:** `kanto.sevii.resort` (a count).

**The Water Labyrinth (`cs.kanto.sevii.labyrinth`)**
- **Kind:** `EV`. **Appears:** Roll, between islands. *Nod: the games' man who judges how much a Pokémon likes its trainer.*
- **Beats:** A man who lives alone on a reef looks hard at the player's lead Pokémon and says nothing for some time.
- **Reward:** If its Bond is Friendly or better: he nods, and entrusts the player with an **Egg** he has been keeping warm. It hatches into a baby Pokémon from the player's home region. If not: "Come back when it looks at you differently."
- **Flags:** `kanto.sevii.labyrinth`.

**The Last Ferry (`cs.kanto.sevii.ferry`)**
- **Kind:** `CUT`. **Appears:** Always, on leaving the islands.
- **Beats:** The ferry back. The engineer from One Island is on the dock if the network came on; the girl from the berry forest is waving; the old woman from the ice cave is not, because she does not wave, but she is there. The mainland comes up out of the haze.
- **Reward:** A full rest. The Notebook gains a page with every island visited and one line for each person helped.
- **Flags:** `kanto.sevii.done`.

### X17.4 Sources and counts for this helping

| Source | Spaces |
| --- | --- |
| Anime | Visitors, Triage, Festival of Dolls, Shell on the Tail, Where It Was Happy, Training Course, Old Street, Inside the Machine, Snowed In |
| Manga *(approx.)* | Kind Stranger, Rival in the Tower, Bicycle Race |
| Games | Building Site, Secret House, Gamblers, Vs. Seeker, Fame Checker, Lost and Found, Swimmers' Relay, Aides, Joyful Game Corner, Treasure Beach, Lady of the Resort, Water Labyrinth |
| Original | The Last Ferry |

**Flags added:** `pewter.stranger`, `pewter.visitors`, `vermilion.triage`, `vermilion.site`, `lavender.rival`, `celadon.festival`, `fuchsia.secrethouse`, `cinnabar.shellder`, `route.goodbye`, `route.k9`, `route.oldstreet`, `route.transfer`, `route.snow`, `route.bikerace`, `route.gamblers`, `route.seeker`, `route.fame`, `route.underground`, `route.relay`, `route.aides`, `sevii.joyful`, `sevii.treasure`, `sevii.resort`, `sevii.labyrinth`, `sevii.done`.

**Totals for Volume II, with this helping:** 115 spaces (8 more in towns, 12 more on the roads, 5 more on the islands). With Volume I: **188**.

*No space in either volume is set in Pallet Town, specifies a Gym battle, or includes the Elite Four or the Champion.*
