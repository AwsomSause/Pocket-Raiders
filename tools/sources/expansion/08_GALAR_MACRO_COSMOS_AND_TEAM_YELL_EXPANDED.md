# 08x — GALAR: MACRO COSMOS AND TEAM YELL — EXPANDED EDITION
### Script: *The Thousand-Year Plan*

> *"People say I think too far ahead. In a thousand years they will say I didn't think far enough. I intend to be right on both occasions."* — Chairman Rose

**Extends:** `scripts/08_GALAR_MACRO_COSMOS_AND_TEAM_YELL.md` (the base script stays valid; this file adds to it)
**Template:** `docs/EXPANSION_DESIGN.md` · **Cross-region arc:** `docs/GRAND_ARC.md`
**Canon note:** Chairman Rose, Oleana, Bede, Marnie, Piers, Leon, Sonia, Professor Magnolia, Peony, the Ball Guy, the brothers Sordward and Shielbert, Macro Cosmos's many subsidiaries, and the fact that Spikemuth has no Power Spot are canon to the games. Ardos is a canon Cipher admin (XD). **Research Chair Magnolia**, **the Ball Guy as a division of Macro Cosmos** and the named Team Yell captains are *what-if* inventions. Team Yell still has no leader. All dialogue is original. Species are my best recall and are marked approximate.
**Two organizations.** Macro Cosmos is the plan. Team Yell is a fan club that keeps standing in the road. One of them turns out to matter more than it looks.

---

## E1. The Wider Scale

The base script is a tower and a red sky. The Expanded Edition treats the Darkest Day the way its author does: as a launch, with a rollout schedule.

### E1.1 The plan at five scales

| Scale | What Macro Cosmos is doing (and Team Yell, beside it) | What the player sees | Where it pays off |
| --- | --- | --- | --- |
| 1 **Street** | Putting a logo on everything; handing out free Poké Balls with a little extra inside. *Yell:* blocking a road so a Silicobra can nap | A mascot who is very glad to see you; a row of fans with horns | Events *Have a Ball*, *Road Closed* |
| 2 **City** | Selling insurance against a disaster nobody has heard of yet; drafting the announcement of its solution | A kiosk; a printer left running | Events *Darkest Day Cover*, *For Immediate Release* |
| 3 **Region** | Capping the Wild Area's dens to harvest their energy; hiring two "royal" consultants to wake the Weald's guardians badly | Pokémon growing huge in the street for no reason; red in the clouds | Raids 2 and 4; event *Their Majesties* |
| 4 **Border** | Stopping the trains and flights it owns; shipping Wishing Stars to a "partner firm" | A departures board that says CANCELLED in six colors | Event *The Partner Firm* |
| 5 **World** | Waking a Pokémon that fell from the sky, to solve an energy shortage due in a thousand years, on live television | The Champion Cup final interrupted by its own sponsor | Climax Phases 6 and 7 |

### E1.2 World-state track — *The Forecast*

Stored in `galar.x.forecast` (0–5).

| Step | Name | Regional rule | Civilian mood |
| --- | --- | --- | --- |
| 1 | **Sponsored** | Partner shops sell at −5%; each purchase there adds +1 Heat (they report it) | Cheerful |
| 2 | **Tremors** | Once per stage a wild Pokémon Dynamaxes for one turn with no Power Spot | Excited, then not |
| 3 | **Red Cloud** | Wild Area weather is fixed; Dynamax in dens lasts one extra turn for the foe | Uneasy |
| 4 | **Service Suspended** | Rail and air nodes cost an extra step; one shop per city has "supply issues" | Stranded |
| 5 | **Launch Day** | The sky is red; the climax is scheduled | Watching the big screen |

### E1.3 The bigger secret

The Darkest Day is a product launch (base script §3). Three more things are true.

**He has hedged.** Macro Cosmos Insurance has been selling "Darkest Day cover" for a year. Macro Cosmos Bank holds the premiums. Macro Cosmos Construction has the rebuilding contracts, pre-signed. Rose does not think of this as profiteering. He thinks of it as being organized.

**He means it.** Rose was a coal miner. He watched a seam run out and a town die with it, and he has never stopped being the young man standing at that pithead. Galar's energy will run out in a thousand years. Everyone he tells says the same thing: *that's a long time*. He has stopped telling people.

**Team Yell is the cure.** Macro Cosmos's Shadow method, **Dynamax Overload**, traps a Pokémon in a Dynamax it cannot leave. The thing that breaks it is not a machine. It is a crowd that knows the Pokémon's name and shouts it. Spikemuth, the one town with no Power Spot, the town nobody visits, has been practising that for years, for one girl and her Morpeko. Nobody at Rose Tower has thought to check.

**Ardos** of Cipher is here as "a strategic partner". Cipher wants two things from Galar: a field test of a Shadow state the size of a region, and the energy to finish something it has been building for a very long time.

---

## E2. Expanded Cast

### E2.1 New officers and specialists

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.macro-cosmos.sordward` | **Sordward** | Executive (5) | canon (games) | Zealot: one of two brothers who claim descent from Galar's first kings and are retained as "heritage consultants" | **Sir Counterfeit** (Sirfetch’d), Doublade, Bisharp, Golisopod | Fruity, wounded; a "celebrity" who has to explain that he is one |
| `sc.macro-cosmos.shielbert` | **Shielbert** | Executive (5) | canon (games) | Zealot: the other brother | **The Honor Guard** (Falinks), Bronzong, Klinklang | The same, a third lower; they speak in turns |
| `sc.macro-cosmos.hollis` | **Director Hollis** | Commander (4) | original | Technician: head of Macro Cosmos Rail | Steelix, Klinklang, Copperajah | Clipped; announces delays as if they were weather |
| `sc.macro-cosmos.pryce` | **Director Pryce** | Commander (4) | original | Handler: head of Macro Cosmos Insurance | Mawile, Malamar, Grimmsnarl | Soothing, exact; reads the small print aloud |
| `sc.macro-cosmos.ardos` | **Ardos** | Liaison (4) | canon (XD) | Enforcer: Cipher's representative, and its master's loyal son | Alakazam, Kingdra, Heracross, Snorlax *(approximate)* | Cold, brief; does not explain himself twice |
| `sc.yell.gaz` | **Cheer Captain Gaz** | Lieutenant (3) | what-if | Enforcer: the loudest fan in Spikemuth; the base script's Cheer Captain, named | **Banner** (Galarian Linoone), Scrafty | A foghorn with feelings |
| `sc.yell.shaz` | **Chant Leader Shaz** | Specialist (2) | what-if | Scout: writes the chants; the base script's Chant Leader, named | Scraggy, Skuntank | Hoarse; counts everyone in |

### E2.2 Team versions of characters you know

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.macro-cosmos.ball-guy` | **The Ball Guy** | Lieutenant (3) | what-if | The League's mascot, as a wholly owned division of Macro Cosmos Customer Insights | Electrode, Voltorb, Amoonguss | Relentlessly delighted; the suit does not come off |
| `sc.macro-cosmos.chair-magnolia` | **Research Chair Magnolia** | Executive (5) | what-if | Professor Magnolia, whose Dynamax research made the bands and whose signature is on the Plant's first permit | Does not battle | Dry, formidable; has been waiting for someone to ask her the right question |
| `sc.macro-cosmos.leon` | **Leon, the Sponsored Champion** | Ally | canon (games) | The undefeated Champion, whose cape is made of Macro Cosmos logos | Charizard | Booming, generous, gets lost in corridors |
| `sc.macro-cosmos.peony` | **Peony** | Ally | canon (games) | Rose's brother: an ex-miner, an ex-Champion, a very loud dad | Copperajah, Aggron | Roars; calls everything an "adven-tour" |
| `sc.yell.piers` | **Piers** | Ally | canon (games) | Spikemuth's singer, who is *not* Team Yell's leader and is tired of saying so | **Frontman** (Obstagoon) | Low, flat, drained; comes alive on a stage |
| `sc.yell.marnie` | **Marnie** | Ally | canon (games) | The trainer Team Yell is yelling *for*. She did not ask them to | **Hangry** (Morpeko) | Quiet, level; one eyebrow |
| `sc.macro-cosmos.rival-pick` | **The Chairman's Pick** (the rival) | Lieutenant (3) | what-if | The rival with Rose's endorsement, in a jacket covered in logos | The rival's team plus one Overcharged Pokémon | The rival's archetype, reading a sponsor message |
| `sc.macro-cosmos.player-future` | **Junior Executive, Future Planning** (the player) | Specialist (2) | what-if | The player on the Inside Man and Stand-with routes; Rose invented the department for them | The player's team | — |
| `sc.yell.player-honorary` | **Honorary Yeller** (the player) | Associate | what-if | The player after cheering with Team Yell; comes with a towel | The player's team | — |

> **Team Yell has no leader.** Ask any of them and they will point at Piers. Ask Piers and he will put his head in his hands.

---

## E3. Special Pokémon — the Overcharged and Loud lines

**Line rule — *Overcharged*:** (Macro Cosmos) once per battle an Overcharged Pokémon may Dynamax for one turn with no Power Spot. On the turn after, it cannot act (announced: "It is paying for that.").

**Line rule — *Loud*:** (Team Yell) a Loud Pokémon's sound-based moves have +20% power, and it gains +1 Speed each time a Yell Grunt in the stands cheers (once per turn, if any are watching). If the player holds **Marnie's League Card**, every Loud Pokémon loses its first turn to embarrassment (announced: "It has remembered who it is cheering for.").

| ID | Name | Species | Signature trait | Where met | Can the player get it? |
| --- | --- | --- | --- | --- | --- |
| `sv.macro-cosmos.skyline` | **Skyline** | Duraludon / Gigantamax Duraludon | *Built to Last*: when its Dynamax ends it keeps half of the extra HP | Rose's ace | No |
| `sv.macro-cosmos.boardroom` | **Boardroom** | Perrserker | *Company Line*: while it is on the field, its allies' Steel moves gain +20% | Rose | No |
| `sv.macro-cosmos.foundry` | **Foundry** | Copperajah / Gigantamax Copperajah | *Heavy Industry*: its contact moves lower the target's Speed by 1 | Rose | No |
| `sv.macro-cosmos.first-friend` | **First Friend** | Garbodor / Gigantamax Garbodor | *Never Thrown Away*: once per battle it survives a knockout at 1 HP and gains +2 Defense | Oleana's ace | No |
| `sv.macro-cosmos.decorum` | **Decorum** | Hatterene / Gigantamax Hatterene | *Silence, Please*: it moves first against any Pokémon that used a sound move last turn | Bede | No |
| `sv.macro-cosmos.sir-counterfeit` | **Sir Counterfeit** | Sirfetch’d | *By Right of Blood*: its first attack each battle is always a critical hit; its second never is | Sordward | No |
| `sv.macro-cosmos.honor-guard` | **The Honor Guard** | Falinks | *Close Ranks*: takes 20% less damage for each of its trainer's Pokémon that has not yet fainted (up to 60%) | Shielbert | No |
| `sv.macro-cosmos.cabbie` | **Cabbie** | Corviknight / Gigantamax Corviknight | *Fare's Fair*: once per battle it carries a fainted ally off the field; that ally returns next battle at 25% HP | Any Flying Taxi rank | Yes: it resigns from Macro Cosmos Airlines at world state 4 and will fly for a decent tip |
| `sv.yell.frontman` | **Frontman** | Obstagoon | *No Encore*: it cannot be made to repeat a move, and its blocking move cannot be broken through | Piers's ace | No |
| `sv.yell.opening-act` | **The Opening Act** | Toxel / Vine Riff | *Warm Up the Crowd*: its first sound move raises the Speed of everything on its side | Piers's band | No |
| `sv.yell.encore` | **The Encore** | Toxel / Electric Oncore | *One More*: once per battle, after it knocks out a foe, it acts again at once | Piers's band | Yes: it follows the player out of the gig if they stay to the end |
| `sv.yell.hangry` | **Hangry** | Morpeko / Hangry Morpeko | *Mood Swing*: its signature move changes type with its mood each turn, and the mood is shown | Marnie | Ally only: it is Marnie's |
| `sv.yell.banner` | **Banner** | Galarian Zigzagoon / Galarian Linoone | *Flag Day*: when it enters, its side's next cheer counts double | Cheer Captain Gaz | No |

> First Friend was a Trubbish that a poor girl found behind a factory. She is the Chairman's secretary now. It is still the first Poké Ball on her belt. It is Overcharged because she volunteered it, to show the staff it was safe.

---

## E4. Special Shadow Pokémon

Macro Cosmos's method is **Dynamax Overload**; cutting the pulse gives −40 Corruption (Shadow doc §6). Team Yell's **Cheer Chant** binds nothing, and so Team Yell has no Shadow Pokémon at all. A crowd chanting a bound Pokémon's name gives −15 per chant.

| ID | Code | Name | Species | Tier | Shadow ability | Shadow moves | Purification key | Where met |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ss.macro-cosmos.lighthouse` | — | **Lighthouse** | Lapras / Gigantamax Lapras | 3 Gripped | Squall Mantle | Hollow Tide, Chain Hymn, Siphon Lull | Uncap its den, then have a crowd call it by its ferry name | Raid 4 |
| `ss.macro-cosmos.old-shift` | — | **The Old Shift** | Coalossal / Gigantamax Coalossal | 3 Gripped | Overbound | Ember of Grief, Gloam Crash, Cinder Ward | Peony's voice: it knew him when it was a Rolycoly and he was a lad with a lamp | Raid 1, the furnace hall |
| `ss.macro-cosmos.rusted-sword` | — | **The Sword That Slept** | Zacian / Crowned Zacian | 3 Gripped | Contract Clause | Umbral Rush, Dusk Brand, Null Pulse | Return the rusted sword to its hand | Raid 2, or Phase 7 |
| `ss.macro-cosmos.rusted-shield` | — | **The Shield That Slept** | Zamazenta / Crowned Zamazenta | 3 Gripped | Contract Clause | Cinder Ward, Gloam Crash, Null Pulse | Return the rusted shield to its arm | Raid 2, or Phase 7 |
| `ss.macro-cosmos.darkest-day` | XD011 | **The Darkest Day** | Eternatus / Eternamax Eternatus | 4 Fallen | Contract Clause | Hollow Tide, Heart Eclipse, Red Star | Story only: cut the three feeds, then outlast it | Above Hammerlocke, Phase 6 |

**Signature Shadow move — Red Star:** 110 power; double damage to a Dynamaxed target; the target's side cannot Dynamax or Mega Evolve for 3 turns. Cost: +6 Corruption. Announced one turn ahead ("The clouds turn the color of a wound.").

**Notes**
- **The Sword and the Shield.** Only one of the two is bound in a given run, by seed: the brothers can manage one at a time. The other arrives on its own in Phase 6. Both follow the Legendary Shadow rules.
- **Lighthouse** is the Lapras that Wild Area fishermen steer by. It has been the size of a hotel for a month and cannot shrink. It is very polite about it.
- **The Darkest Day** is not evil and not awake in any way a person would recognize. It is a hunger that fell out of the sky. Macro Cosmos is feeding it on purpose.

---

## E5. New Story Events

### E5.1 *Have a Ball* (`xe.galar.ball-guy`) — Street

*Trigger: any city node after Ignition. A figure with a Poké Ball for a head, arms wide.*

> **THE BALL GUY:** "Heya, Trainer! Have a ball! Go on! It's free! *Everything's free when you're the product!*"
> **PLAYER:** "…What?"
> **THE BALL GUY:** "I said, have a ball!"
> **PLAYER (choice):**
> 1. **[Take it]** → A rare Ball. Inside the hinge, a tiny grey bead. *(While carried: Heat +1 per stage, and Macro Cosmos ambushers always find the player. If the bead is found and crushed, the Ball is simply a very good Ball.)*
> 2. **[Inspect it first]** *(needs Intel 4 or more)* → The bead is found. **THE BALL GUY** *(the cheer does not change at all)*: "Whoopsie! That's just a little something to help us help you! Customer Insights loves you!" Intel +3.
> 3. **["Are you all right in there?"]** → *(A long pause. The head tilts.)* **THE BALL GUY** *(very quietly, same pitch)*: "I've a mortgage with Macro Cosmos Bank and a pension with Macro Cosmos Life. I am *having a ball*." *(Then, bright again:)* "Heya, Trainer!" `galar.x.ball-guy = seen`.

### E5.2 *Road Closed* (`xe.galar.road-closed`) — Street

*Trigger: any route node. Six people in black and pink, with towels and horns, standing across the road. Behind them a Silicobra is asleep in a sunbeam.*

> **CHEER CAPTAIN GAZ:** "OI! Road's shut! Li'l fella's havin' a kip and we'll not have him *disturbed*!"
> **CHANT LEADER SHAZ:** "One, two, three: *Let! Him! Sleep!*"
> **TEAM YELL:** "*LET! HIM! SLEEP!*"
> *(The Silicobra wakes up.)*
> **GAZ:** "…Now look what you made us do."
> **PLAYER (choice):** [Battle through] → *(Battle: Gaz with **Banner**; four Grunts cheer from the verge.)* / [Join the chant, quietly] → A timing prompt: three soft claps. The Silicobra goes back to sleep. **SHAZ:** "That's— that's *dynamics*, that is. Piano. We never do piano." `galar.x.yell = honorary`; the player is given a **Team Yell Towel**. / [Go round] → +1 step. They wave.
> **GAZ (defeat):** "Fair's fair. But you tell anyone we lost, we'll cheer *at* you. Up close."

### E5.3 *Darkest Day Cover* (`xe.galar.insurance`) — City

*Trigger: any city at world state 1 or higher. A neat kiosk: MACRO COSMOS INSURANCE — PEACE OF MIND.*

> **CLERK:** "Good afternoon! Could I interest you in our new product? It's flying off the shelves. 'Darkest Day cover'. Very reasonable."
> **PLAYER:** "What's a Darkest Day?"
> **CLERK:** "I asked that in training! They said it's an old legend, so the risk is theoretical, so the premium's nearly all margin. …It's sold forty thousand policies. Head office is *very* keen. For a legend."
> **PLAYER (choice):** [Buy a policy] → ₽3,000. *(If the player wins the climax, it pays out ₽15,000 in the Aftermath; Director Pryce signs the cheque personally, in tears.)* / [Read the small print] → Intel +4: the policy start date is printed. It is the day after the Champion Cup final. / ["Who set the start date?"] → **CLERK:** "It came down from the fiftieth floor. Everything does." *(She looks at the leaflet in her hand as if it had changed.)*

### E5.4 *For Immediate Release* (`xe.galar.press-release`) — City

*Trigger: Wyndon, before Raid 1 is resolved. The lobby of Rose Tower. A printer by reception is still warm.*

> *(One page in the tray. A draft.)*
> **THE PAGE:** *"FOR IMMEDIATE RELEASE. Macro Cosmos is proud to announce that the unprecedented energy event of [DATE] has been safely contained by Chairman Rose's Eternal Energy Initiative. 'I am only sorry,' said the Chairman, visibly moved, 'that it took a catastrophe to show Galar what it had.' [INSERT CASUALTY FIGURE IF LOW.]"*
> *(Heels on marble.)*
> **OLEANA:** "That is not yours."
> **PLAYER (choice):** [Hand it back] → She takes it. She does not thank you. Her hand is not steady. / [Keep it] → Key Item **Draft Release**. Heat +8. It can be shown to Leon, to Magnolia, or to the stadium in Raid 5. / ["Did you write this?"] → **OLEANA:** "I typed it. He dictated it walking up and down, the way he does when he's *happy*." *(A pause.)* "I've worked for him since I was nineteen. He paid for my mother's operation. He remembers every cleaner's name. And he said 'if low' without stopping." `galar.x.oleana = shaken`.

### E5.5 *The Old Seam* (`xe.galar.mine`) — Region

*Trigger: a mine node, world state 2 or higher. Old men on a bench by a closed pithead. One enormous man in a hard hat is telling a story with his whole body.*

> **PEONY:** "—and I says to him, I says, *Rose*, the seam's gone, you can dig till your arms drop off and all you'll find is the back of Galar! And he goes quiet. You know how he goes."
> **OLD MINER:** "He were never the same after the pit shut."
> **PEONY:** "He counted the lamps coming up that last day. Counted 'em twice. Then he says, 'This'll happen to the whole region. Not for a thousand years. But it'll happen.' And I laughed! I *laughed*, 'cause who thinks like that!"
> *(He stops. He takes the hard hat off.)*
> **PEONY:** "I shouldn't have laughed. He's my little brother. Nobody else were ever going to tell him it was all right to stop counting."
> **PLAYER (choice):** [Ask him to come to Wyndon] → He will hold a district on the Siege Map, and he is the purification key for **the Old Shift**. / [Ask about the Rolycoly] → A wild Rolycoly here will join for a lump of coal. / ["Is he wrong?"] → **PEONY:** "About the thousand years? No. That's what's so *flamin'* awful about it."

### E5.6 *Their Majesties* (`xe.galar.their-majesties`) — Region

*Trigger: any inn or the edge of the Weald, world state 3. Two men with hair shaped like a sword and a shield are being ignored by an entire pub.*

> **SORDWARD:** "We *are* celebrities."
> **SHIELBERT:** "We are in fact descended from the first kings of Galar."
> **SORDWARD:** "There were *two* kings. People forget."
> **SHIELBERT:** "The history says one hero. With a sword *and* a shield. Which is plainly a clerical error."
> **SORDWARD:** "The Chairman has retained us to *wake our ancestors' weapons*. He appreciates lineage."
> **PLAYER (choice):** ["Weapons?"] → **SHIELBERT:** "A sword. And a shield. Very old. They've been asleep in the woods." **SORDWARD:** "We'll be giving them a little *tonic*." *(He holds up a vial that glows the wrong red.)* Intel +5. / [Battle them] → *(Double Battle: Sir Counterfeit and the Honor Guard lead. Trait: **Hereditary**: whichever brother is beaten first, the other's Pokémon gain +1 to all stats out of sheer offense; announced.)* / [Ask for an autograph] → They are so pleased they tell you the day they are going to the Weald. Raid 2 can be started early.
> **SORDWARD (defeat):** "This is *treason*." **SHIELBERT:** "Against whom?" **SORDWARD:** "…Us. Presumably."

### E5.7 *The Partner Firm* (`xe.galar.partner-firm`) — Border

*Trigger: Wyndon station, world state 4. Every departure is cancelled. On the one platform still lit, the Chairman is shaking hands with a tall man in a dark uniform.*

> **ROSE:** "—and I think you'll find Galar's hospitality second to none! Have you tried the curry? You must try the curry."
> **ARDOS:** "I am here for the readings."
> **ROSE:** "Of course, of course. A man of focus! I admire that. Your people supplied the regulator for the Plant, I supply the energy; that's what I call a *partnership*."
> **ARDOS:** "My father calls it a purchase."
> *(Rose laughs, warmly, as if it were a joke. Ardos sees the player.)*
> **ARDOS:** "You. You have interfered with eight operations. My brother has gone soft and my colleagues have been careless. I am neither."
> **PLAYER (choice):** [Follow the crates] → Wishing Stars, hundreds, labelled for an island with no name. Intel +5; unlocks Raid 4. / [Challenge him] → *(Battle. Trait: **No Wasted Motion**: his Pokémon never use a move that would fail or be resisted if a better one exists, and he never switches; announced.)* / [Ask Rose what he sold] → **ROSE:** "Sold? My dear young friend, I've *shared*. One doesn't solve a thousand-year problem alone!"

*Writes: `cipher.seen.ardos`.*

### E5.8 *The Gig* (`xe.galar.gig`) — City

*Trigger: Spikemuth, any time after* Road Closed*. A shuttered arcade, a stage made of pallets, a thin man with a microphone and no backing band but two Pokémon with amplifier chests.*

> **PIERS:** "This one's for Spikemuth. No Power Spot. No stadium. No sponsors. Just us. Always was."
> *(He sings. It is not cheerful. The whole street knows the words.)*
> *(Halfway through, a Yell Grunt's Linoone, spooked by a tremor, swells to the size of a bus between the shopfronts: a forced Dynamax, with nowhere for it to go.)*
> **MARNIE** *(level, not loud)*: "Oi. *Stripes.* It's all right."
> **SHAZ:** "Her name's Stripes! One, two, three—"
> **TEAM YELL** *(not a cheer; a chant, low, in time)*: "*Stripes. Stripes. Stripes.*"
> *(It looks down at forty people saying its name. It gets smaller. It is a Linoone again, sitting in the road, embarrassed.)*
> **PIERS** *(into the microphone, deadpan)*: "…And that's why we don't Dynamax in Spikemuth."
> **PLAYER (choice):** [Stay to the end] → **The Encore** follows the player. `galar.x.chant = learned`: the player can call for a chant once per battle against a Dynamax Overload Shadow, for −15 Corruption. / [Ask Marnie how she did that] → **MARNIE:** "Didn't do anythin'. Just said her name. They forget who they are when they're that big." Intel +5, and the flag. / [Leave early] → No change. Piers notices.

---

## E6. Raids, Expanded

### E6.1 Raid 1 — "The Hammerlocke Energy Plant", deeper

**New phase order:** Gate → Turbine Hall → **The Furnace Hall** *(new)* → **The Permit Room** *(new)* → Reactor.

**The Furnace Hall.** The Plant's oldest floor still burns coal. Something the size of the room is the furnace: **the Old Shift** (`ss.macro-cosmos.old-shift`), a Coalossal held in Dynamax so that it never stops burning.

> **PLANT RESEARCHER:** "It's very efficient. It's been at full output for eleven months. We did wonder if it minded. There wasn't a form for that."
> *(Battle: Tier 3. If Peony is with the player he does not send out a Pokémon. He takes off his hard hat and shouts.)*
> **PEONY:** "OI! Coalie! It's Peony! From Number Two pit! You used to pinch me sandwiches! *Clocking-off time, lad!*"
> *(It looks at him. It gets smaller. Corruption −40.)*

**The Permit Room.** A wall of framed documents. The first, forty years old, authorizes "preliminary study of Galar particle density". It has two signatures. One is the Chairman's. The other is a professor's.

> **SONIA** *(reading it for the third time)*: "That's Gran's handwriting. That's her *signature*. She told me the Plant was nothing to do with her work."
> *(Key Item: **The First Permit**. It can be shown to Research Chair Magnolia.)*

**Oleana, extended:**

> **OLEANA:** "You think he's a monster. He isn't. A monster would be *easy*. He found me sorting rubbish behind a factory and he said, 'You're wasted here.' Nobody had ever said I was *anything* anywhere."
> **OLEANA (defeat, extended):** "…First Friend. Come back. That's enough. You've done enough for him." *(It is not clear which of them she is talking to.)*

### E6.2 Raid 2 — "The Slumbering Weald", deeper

**New phase order:** Edge → Grove → **The Altar** *(new)* → Hollow.

**The Altar.** A stone arch in the fog, a rusted sword and a rusted shield lying on it. Sordward and Shielbert are arguing over which one to pick up.

> **SORDWARD:** "The sword, obviously. I'm the *sword* one."
> **SHIELBERT:** "We agreed we'd each take our own!"
> **SORDWARD:** "We've only the one vial."
> *(A shape in the fog. Large. Four-legged. It has been watching them for some time.)*
> **SHIELBERT:** "…Sordward."
> **SORDWARD:** "Not now."
> *(He throws the vial. Red light. The shape screams. Which guardian it is follows the run's seed: `ss.macro-cosmos.rusted-sword` or `ss.macro-cosmos.rusted-shield`, Tier 3.)*
> *(Battle. The matching relic lies on the altar behind the brothers. Reaching it takes beating one of them. Carrying it to the guardian takes one turn. The moment it touches, the rust falls off, and the guardian is itself, and it looks at the two men.)*
> **SORDWARD:** "We are your *descendants*!"
> *(It considers this. It turns its back on them, which is worse, and walks into the fog.)*

**Reward:** the other relic stays on the altar. If the player takes it, the second guardian comes to them in Phase 6.

### E6.3 Raid 3 — "Spikemuth Blockade", deeper

**New phase order:** The Shutter → **The Arcade** *(new)* → Fan Hall → Yell Squad.

**The Arcade.** Spikemuth's one street. Closed shops, a noodle bar, a mural of Marnie that someone repaints every week.

> **YELL GRUNT (noodle bar):** "There's no jobs here since the Chairman built the stadiums everywhere *else*. No Power Spot, no stadium. No stadium, no crowds. No crowds, no town. So we cheer for the one good thing we've got."
> **YELL GRUNT (mural, with a brush):** "She hates it. She's never once asked us to stop."

**Piers** is on the stage at the end, coiling a cable.

> **PIERS:** "They're not a team. They're my gym trainers and half the high street in face paint. I've told them. They say 'yeah, boss'. I'm *not* their boss."
> **TEAM YELL** *(from the back)*: "YEAH, BOSS!"
> **PIERS** *(closing his eyes)*: "Every time."

With `galar.x.yell = honorary`, the squad battle at the end is a **cheer-off**, not a fight: three rhythm prompts, each louder than the last. Winning it counts as a Triumph.

### E6.4 Raid 4 — "The Capped Dens" *(new)*

**Scale:** Region. **Offered:** world state 3 or higher, by Sonia.
**Offer (Sonia, with a map covered in pins):** *"Every den in the Wild Area with a red beam has a Macro Cosmos Construction lid on it. They're not studying them. They're* tapping *them. And there's something huge stuck in the lake."*
**PR:** `pr.galar.wild-area-dens` — 4 areas: The Rolling Fields → The Capped Den → Lake Axewell → The Pipeline. **Security:** weather that changes with each area, Macro Cosmos Construction crews who are not fighters and will simply stand in the way, den lids that vent red energy on a timer.
**Objectives:** *Primary:* uncap three dens. *Secondary A:* free Lighthouse. *Secondary B:* defeat Director Hollis. *Secondary C:* trace the pipeline.

**Phases**

1. **The Rolling Fields.** A Flying Taxi lands beside the player without being called.
   > **CABBIE'S DRIVER:** "Not on the meter, this. Company's stopped all routes. Me and the bird thought we'd do one last run for someone who'd tip in *results*."
2. **The Capped Den.** A steel lid, bolted, humming. Under it something very large is turning over in its sleep.
   > **CONSTRUCTION FOREMAN:** "Can't let you near it, pal. Health and safety. …Whose? *Ours*, mostly."
3. **Lake Axewell.** **Lighthouse** (`ss.macro-cosmos.lighthouse`) fills half the lake. Fishing boats are tied up to it.
   > **FISHERMAN:** "That's Old Ferry. She's taken me across thirty years. She's been that size since the lids went on. She keeps apologizing. You can tell."
   > *(Battle: Tier 3. With `galar.x.chant`, the fishermen join in: "Fer-ry! Fer-ry!" Each chant is −15.)*
4. **The Pipeline.** Director Hollis on a maintenance trolley.
   > **DIRECTOR HOLLIS:** "This service is running approximately four hundred years ahead of schedule. Macro Cosmos Rail apologizes for any inconvenience to the present."
   > *(Battle. Trait: **Timetable**: he announces the order his Pokémon will come out, and keeps to it; each one that arrives "on time" gains +1 Speed.)*
   > **HOLLIS (defeat):** "…This service is cancelled."

**Secondary C:** the pipe does not go to Hammerlocke. It goes to the coast, and a ship. Intel +6.

**Results (Lever: *The Dens*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | Three dens open; Lighthouse is herself; the pipe is cut | **Starved feed:** the Darkest Day enters Phase 6 with two feeds, not three | −3 |
| **Success** | Three dens open | Tremors stop: no forced Dynamax in Phase 1 | −2 |
| **Partial** | One or two dens open | No change | −1 |
| **Failure** | The lids hold; you are driven back by the weather | **Full feed:** the Darkest Day starts Phase 6 one tier higher in power (its first Red Star comes a turn sooner) | +2 |
| **Declined** | The lids stay on | Full feed | +1 |

**Failure consequences:** **C5 (Blacklisted), C10 (Shadowed), C11.**

### E6.5 Raid 5 — "The Final" *(new)*

**Scale:** Region and World. **Offered:** automatically, at world state 4, as an invitation with a gold border.
**Offer (the invitation):** *"The Chairman requests your presence in his box for the Champion Cup Final. Smart dress. Refreshments provided. He has an announcement."*
**PR:** `pr.galar.wyndon-stadium` — 4 areas: The Concourse → The Chairman's Box → The Tunnel → The Pitch. **Security:** sixty thousand people, stewards, a broadcast that goes to the whole region, a Power Spot under the pitch.
**Objectives:** *Primary:* keep the stadium calm when the announcement comes. *Secondary A:* get the Draft Release onto the big screen. *Secondary B:* turn Research Chair Magnolia. *Secondary C:* reach Leon before the Chairman does.

**Phases**

1. **The Concourse.** The Ball Guy is working the turnstiles.
   > **THE BALL GUY:** "Heya, Trainer! Enjoy the match! *Exits are located to your left and I would use them at half-time!*"
   > *(If `galar.x.ball-guy = seen`, that last sentence is real, and he presses a steward's pass into the player's hand.)*
2. **The Chairman's Box.** Rose, beaming. Magnolia in the next seat, with a cane and a face like a closed door.
   > **ROSE:** "There you are! Sit, sit. Leon's about to walk out. Sixty thousand people. Isn't it marvellous? In a thousand years this will be a field. I can't *bear* it."
   > **PLAYER** *(showing the First Permit to Magnolia)*
   > **RESEARCH CHAIR MAGNOLIA:** "…Yes. That's mine. I measured the particles. He asked what could be *done* with them. I said I'd rather not speculate. He said, 'Then I shall,' and I let him, because it was funded and I was tired." *(She stands.)* "I've been waiting forty years for someone to put that in front of me. Give me your arm, child. We're going to the broadcast gantry."
3. **The Tunnel.** Leon, about to walk out, cape over one shoulder.
   > **LEON:** "The Chairman wants a word before kick-off. Says it can't wait. I told him: after the match. Sixty thousand people came to see a champion time. You don't walk out on that."
   > **PLAYER** *(showing the Draft Release)*
   > **LEON** *(reading; the grin goes out like a light)*: "'If low.'" *(He folds it very small.)* "Right. Change of plan. I'm still walking out there. I'm just not going to *battle*."
4. **The Pitch.** The big screen cuts to the Chairman's box.
   > **ROSE** *(to all of Galar)*: "Friends! I am sorry to interrupt. In a thousand years—" *(a groan from sixty thousand people who have heard this speech)* "—yes, yes. So I have decided not to wait. Look up."
   > *(The sky over Hammerlocke turns red on the screen. The crowd begins to stand.)*
   > **PLAYER (choice):**
   > - **[The gantry]** *(with Magnolia)* → The Draft Release fills the big screen. Sixty thousand people read "IF LOW" at the same time. The noise that follows is not panic. It is *booing*.
   > - **[The pitch]** *(with Leon)* → **LEON** *(center circle, no microphone, and every seat hears him)*: "Galar! Stay where you are! Champion's orders! We've had worse half-times!"
   > - **[The stands]** *(with `galar.x.yell = honorary`)* → Shaz counts them in. A chant goes round the bowl, one tier at a time, until the whole stadium is saying one slow word in time: "*Steady. Steady. Steady.*"

**Results (Lever: *The Crowd*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | No crush; the release is on screen; Magnolia and Leon have both turned | **Galar knows:** all five stadiums on the Siege Map start Held; Rose's Phase 5 opens with his approval rating on the big screen behind him | −3 |
| **Success** | No crush | Three stadiums start Held | −2 |
| **Partial** | The stadium empties in a hurry; some injuries | No change | −1 |
| **Failure** | Panic | **The story holds:** the press release goes out as written; +1 Pulse in Phase 4 | +2 |
| **Declined** | The player does not attend; Leon goes to the Chairman's box alone | The story holds; Leon is absent from the climax | +1 |

**Failure consequences:** **C8 (Reputation fall), C9 (Gym lockdown), C11.**

---

## E7. The Climax — Extended Cut: "Launch Day"

Checkpoints are after Phase 2 and at the Breather.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | Broadcast and Choice | — | base §10.1–10.3 | 0 |
| 0b | **Five Stadiums** | Siege Map | new | 0 |
| 1 | **The Last Train to Wyndon** | Convoy | new | 2–3 |
| 2 | The Tower Climb | Gauntlet | base Phase 1, extended | 4–6 |
| 3 | The Secretary | Duels | base Phase 2, extended | 2–4 |
| — | **Breather** | Rest | new | 0 |
| 4 | The Pulses | Set piece | base Phase 3, extended | 2–4 |
| 5 | Chairman Rose | Boss | base Phase 4, extended | 1 |
| 6 | **The Darkest Day** | Colossus | new | 1–2 |
| 7 | **Their Majesties' Encore** | Front | new, conditional | 2–3 |
| 8 | Resolution | — | base §10.9, extended | 0 |

### E7.1 Phase 0b — Five Stadiums (Siege Map)

When the sky turns, Galar goes where it always goes: to the nearest stadium. Each one is a shelter if its crowd is calm, and a disaster if it is not.

| Stadium | Held if… | If Lost |
| --- | --- | --- |
| **Motostoke** | Raid 1 Success or better (the Plant is throttled) | A forced Dynamax on the pitch: +1 Pulse in Phase 4 |
| **Hulbury** | Raid 4 Success or better (Lighthouse is ferrying people) | Rail and sea are both shut: the Last Rest has no shop |
| **Hammerlocke** | Peony is in Wyndon and Sonia has the permit | The Vault's records are taken: Rose's Doctrine triggers twice |
| **Spikemuth** | Always. It has no Power Spot, and nothing there can be forced to Dynamax | — |
| **Wyndon** | Raid 5 Success or better | Their Majesties have the pitch: Phase 7 is certain |

> **PIERS** *(on a crackling radio)*: "Spikemuth's full. First time in ten years. Half of Galar's in my arcade 'cause it's the one place nothing's gone massive. I'd laugh. I'm too tired."

### E7.2 Phase 1 — The Last Train to Wyndon (Convoy)

Macro Cosmos Rail has cancelled everything. One train is still moving: the Chairman's own, taking Wishing Stars to the Tower. The player boards it.

**Format:** a Convoy of three carriages (two after a Raid 4 Triumph). **Condition — *Power Surge*:** at the start of every third turn one random Pokémon on the field Dynamaxes for that turn, whichever side it is on (announced).

> **GUARD (Macro Cosmos Rail):** "Tickets, please. …You haven't got one. Nobody's got one. I've been checking an empty train for four hours because nobody told me to stop."
> **DIRECTOR HOLLIS** *(if not beaten in Raid 4; in the last carriage, with a flask)*: "We will shortly be arriving at the end of the line. This is, I believe, meant literally."

### E7.3 Phase 2 — The Tower Climb (extended)

Rose Tower has a floor for every subsidiary.

| Floor | Trainer | Notes |
| --- | --- | --- |
| Plaza | Macro Cosmos Employees ×2 | base |
| 10F | Plant Researchers ×2 | base; their Pokémon are Overcharged |
| **18F Macro Cosmos Insurance** | Director Pryce | Trait: **Small Print**; see below |
| 25F | Plant Security | Trait: **Security Net** |
| **30F Customer Insights** | The Ball Guy | Not a battle if `galar.x.ball-guy = seen` |
| 40F | Bede with **Decorum** | Trait: **Fairy Tale** |
| 50F | Executive | Trait: **Contract Clause** |

> **DIRECTOR PRYCE:** "Before we begin, I'm obliged to inform you that injuries sustained in this battle are excluded under clause nine, 'acts of the policyholder'."
> *(Trait: **Small Print**: the first time each of the player's Pokémon would be healed in this battle, the heal is halved; announced, at length.)*
> **PRYCE (defeat):** "I sold forty thousand policies against today. I told myself it was *prudence*. Do you know what an actuary calls it, when you price a thing you intend to cause?"
> **THE BALL GUY** *(30F, arms wide, blocking the lift)*: "Heya, Trainer! This floor is—" *(He stops. He looks at the red sky through the window. He reaches up with both hands and, for the first time, takes the head off. Underneath is an ordinary, tired, sweating man of about fifty.)* "…Lift's on your left. Mind how you go."
> **BEDE (extended):** "He picked me out of a *home*. He gave me a watch and a challenger's band and said I was special. Then I broke something he hadn't told me to break and he looked through me like glass." *(He adjusts the watch.)* "I'm still wearing it. Isn't that pathetic. Come on, then."

### E7.4 Phase 3 — The Secretary (extended)

**Duel 1 — Oleana** (base), with **First Friend**.

> **OLEANA (if `galar.x.oleana = shaken`):** "I know what the page said. I typed it. I'm still standing here. Do you want to know why? Because if I move, there is *nobody* left who'll tell him when to stop. So I'll stop you, and then I'll go upstairs, and I'll tell him. In that order. Please make it quick."
> **OLEANA (defeat):** "…Then you tell him. He won't hear it from me. He'd think I'd only got frightened."

**Duel 2 — the Executive** (base).

**Duel 3 — Ardos** *(new)*. He is waiting by the private lift.

> **ARDOS:** "My brother gave you a list. He has always mistaken regret for virtue. My father built Cipher with his own hands, and I will not see it taken apart by a child and a penitent."
> *(Battle, with **No Wasted Motion**. He is the hardest of the liaisons: +1 level over the phase.)*
> **ARDOS (defeat):** "…The disc. Take it. It changes nothing. What we were building is *built*." *(At the lift door, not turning round.)* "Tell Eldes that Father still asks after him. I don't know why I said that."

*Reward:* **Data ROM G: "Overload"**.

**Duel 4 — Sordward and Shielbert** *(conditional: only if they were not beaten in Raid 2)*.

### E7.5 Breather

The staff canteen on the 49th floor. Peony has found the kitchen.

> **PEONY:** "Curry! Made it meself! Bit of everything they had. Sit down, you look like a pit pony. He's upstairs, my brother. Counting. You go and tell him the lamps all came up. Every one. He'll know what it means."

Heal 50%, revive one Pokémon, checkpoint.

### E7.6 Phase 4 — The Pulses (extended)

The base set piece (Dynamax Pulses on the rooftops, shared Dynamax turns) with these additions.

- **The stadiums.** Every Held stadium sends its crowd's chant up the broadcast feed. Each one cancels one shared Dynamax turn for the foe.
- **The chant.** With `galar.x.chant`, the player may call a chant once per battle against a Dynamax Overload Shadow: −15 Corruption.
- **Team Yell** arrive on the roof by the service lift, all forty, with horns. After a Raid 3 Triumph they do not fight; they stand in a line along the parapet and shout the names of Pokémon they have never met, read off the Plant's manifest, and the Pulse nearest them goes dark.
  > **GAZ:** "RIGHT! Next one's called— can't read it— *FOUNDRY!* Give it some!"
  > **TEAM YELL:** "*FOUN-DRY! FOUN-DRY!*"
  > *(Somewhere above, a very large Copperajah looks down, puzzled, and gets smaller.)*

**New PA lines** *(Rose, on every screen in the building, unhurried)*:

> "One pulse. Quite all right. We budgeted for variance."
> "Two. I do wish you'd come up and *talk*. I'm a reasonable man. Everyone says so."
> "Three. Oleana? …Oleana, are you there? …Ah."

### E7.7 Phase 5 — Chairman Rose (extended)

The base fight (§10.7) with **Skyline**, **Boardroom** and **Foundry**. The base stage that brings Eternatus in is moved out of this fight and becomes Phase 6.

**New boss stage — *Any Questions?*** (at 50% ace HP): Rose stops, straightens his tie and gives a short press conference to the cameras while the battle continues. For 3 turns his Pokémon choose their own moves (AI one tier lower) and he answers questions nobody has asked. If the player uses the Draft Release as an item during this stage, his next Pokémon enters with −1 to all stats.

> **ROSE (opening, extended):** "Do you know what I see when I look at Galar? I see the lamps coming up out of Number Two pit on the last day. Forty-one lamps. I counted. I see every light in this region going out the same way, and everyone telling me it's a *long time off*."
> **ROSE:** "Somebody has to be the one who can't sleep. I'm good at it. I've had the practice."
> **ROSE (Any Questions?):** "Yes, you at the back. *Was it necessary?* An excellent question. Next. *Will there be casualties?* We anticipate a low—" *(He hears himself.)* "—next question."
> **ROSE (if Peony's message is delivered):** *(The player says: "The lamps all came up. Every one.")* "…Who told you to say that." *(He takes off his glasses and cleans them for rather a long time.)* "He always did think I was counting to make sure they were *there*. I was counting to make sure I hadn't *lost* one." *(Skyline's next move is skipped.)*
> **ROSE (defeat, extended):** "Well played. Truly. I'd endorse you." *(He looks up at the red sky with something like pride.)* "It doesn't matter, you understand. It's awake. That part was always going to work."

### E7.8 Phase 6 — The Darkest Day (Colossus)

*Above the Hammerlocke Energy Plant something unfolds that is mostly ribs. It is the color of the inside of an eyelid. The whole of Galar's Dynamax energy is running up into it through three red feeds.*

**Format, part 1.** **The Darkest Day** (`ss.macro-cosmos.darkest-day`, XD011) is a Colossus fed by **three feeds**, each a shield bar. While a feed stands, it cannot be knocked out and the player's Pokémon **cannot Dynamax** (it is drinking it all).

| Feed | While it stands | When it is cut |
| --- | --- | --- |
| **The Plant** | It heals 10% each turn | It stops healing |
| **The Dens** | Red Star comes every third turn | Every fifth |
| **The Stars** | The player's side cannot Dynamax | The player may |

**Format, part 2 — Eternamax.** When the third feed is cut it does not fall. It rises, and becomes a hand the size of the sky. Now the player's moves do nothing at all (announced: "Its power is overwhelming. Your Pokémon cannot move."). This lasts **two turns**. Then two shapes arrive.

> *(One comes down the red light like a blade. One lands like a door being shut. Whichever was bound earlier, it is here, unrusted. Whichever relic the player carries is taken from their hand.)*
> *(From this point the sword and the shield fight beside the player as allies, and the Colossus has one last shield bar.)*

**Timer:** 14 turns in all. **Adjustments:** a Raid 4 Triumph removes the Dens feed at the start; a Raid 2 Triumph (base Lever) makes part 1 a sleeping, one-move boss, as the base script says; Leon, if present, takes the first Red Star himself with his Charizard; each Held stadium's chant shortens the two helpless turns by nothing, but the game plays the sound of sixty thousand people saying the player's lead Pokémon's name.

> **LEON:** "I've never lost. Did you know that? Not once. I'm about to find out what it's like, and I'd rather it was to *that* than to anything smaller. Charizard! One more champion time!"
> **HOP or the rival** *(Help)*: "It's the *sky*. We're fighting the *sky*. …Okay. Okay. What's it weak to?"

**When the last bar breaks:** it folds up, rib by rib, and is the size of a Pokémon, and then it is in the Slumbering Weald's direction and gone, with two shapes pacing either side of it like wardens.

**If the timer runs out:** it does not destroy Galar. It simply stays. Dynamax becomes permanent and uncontrolled across the region; XD011 enters the Region of Doom.

### E7.9 Phase 7 — Their Majesties' Encore (Front, conditional)

*Happens if Sordward and Shielbert were never beaten, or Wyndon is Lost.* With every eye on the sky, the brothers go round the stadiums with what is left of their tonic.

**Format: Front,** three lanes: three stadiums, each with a Gigantamax Pokémon forced huge on the pitch and a crowd in the stands. The player acts in one lane per turn. A Held stadium's crowd chants its Pokémon down without help.

> **SORDWARD** *(on a stadium screen)*: "People of Galar! While you were distracted, your *rightful kings*—"
> **SHIELBERT:** "—plural—"
> **SORDWARD:** "—have taken the liberty of—"
> *(The feed is cut. It is replaced by a test card reading SPIKEMUTH PUBLIC ACCESS, and then by Piers, squinting at a camera.)*
> **PIERS:** "Is this on? Right. Galar. You know the one. After me." *(He starts to sing. In three stadiums, people who have never been to Spikemuth find that they know the words.)*

### E7.10 Phase 8 — Resolution (extended)

The Red Star choice (base §10.9) with these additions.

- **Rose.** [Let him turn himself in] *(as he does, if nobody stops him)* → He walks into Hammerlocke police station, gives his full name, and asks for a pencil. **ROSE:** "I'd like to make a statement. It's rather long. It begins a thousand years from now." / [Send Peony in first] → The brothers are shut in an interview room for two hours. Nobody knows what is said. Afterwards Rose asks for forty-one sheets of paper and writes a name at the top of each.
- **Oleana.** She runs the company for six weeks, long enough to refund every Darkest Day policy, and then resigns. First Friend is seen with her at a recycling plant. She has gone back, on purpose.
- **Bede.** [Tell him he was never glass] → He takes the watch off. He is found, later, in a pink cardigan, being shouted at by a very old woman, and looking as if it is the best thing that ever happened to him.
- **Spikemuth.** If Team Yell cut a Pulse: the League votes to build no stadium there. It votes to hold the *final* there. No Dynamax. Piers hates it. He writes a song.
- **The energy.** The thousand-year problem is still real. [Give it to Sonia] / [Give it to Magnolia] / [Give it to Rose, from his cell]: three different epilogue lines, and the third is the only one that says a number.

### E7.11 Rival and Stand-with additions

- **Help:** the rival stands beside Leon. *Line:* "I'm on a roof with the Champion fighting the weather. If I'd known siding with you came with *this* I'd have asked for a cape."
- **Beat-you:** the rival is found on the 30th floor wearing the Ball Guy's discarded head, "to get past security". It did not work. It is stuck.
- **Side-with:** the rival is **the Chairman's Pick**. The Turn is the Draft Release: they read "if low", and they take the jacket off.
- **Stand with them:** the player is **Junior Executive, Future Planning**. In Phase 6 the player holds the Stars feed open for Rose and must decide whether to let go. See `scripts/10_STAND_WITH_THEM.md` §8; the new line is Rose's: "Future Planning. A department of one. Do you know, I've never had anyone to *talk* to about the year three thousand."
- **Honorary Yeller:** not a Stand-with route. It is a towel. The player keeps it for the rest of the run, and Team Yell cheer from the stands of every later region's climax, having apparently followed on a coach.

---

## E8. Aftermath and the Thread

- **Lighthouse** is a Lapras again. The fishermen miss the mooring space and would not have it back for anything.
- **The Old Shift** goes home with Peony, who has nowhere to keep a Coalossal and is delighted.
- **The Ball Guy** returns to work. The head is the same. On the back of it, in marker, someone has written a first name.
- **Sordward and Shielbert** are given community service: tour guides at the Weald. They are very good at it. Nobody tells them.
- **Magnolia** publishes a correction to a paper forty years old. It is one line long.

**The Thread (`docs/GRAND_ARC.md`).** **Data ROM G: "Overload"** is not a lock. It is a *scale*: how to hold a Shadow state over a whole region at once, by feeding it. The pipeline from the dens went to a ship, and the ship's manifest names an island fortress and a cargo of Wishing Stars "sufficient for one (1) full revival".

> **ARDOS (a message left with the station-master at Wyndon, to be given to "the child who will be going south")**: "There is a school in the last region where the children have built engines. My father has sent a man to buy them. The children refused. I did not expect that. I am told you should hurry."

---

## E9. Dialogue Bank

### E9.1 New ambush lines

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Macro Cosmos Employee (Apologetic) | "I'm so sorry, I've been asked to delay you. Is now convenient?" | "I'll log it as 'unable to delay'. There's a dropdown." |
| Grunt — Construction Crew (Stolid) | "Site's closed, pal. Hard hats only. You haven't got a hard hat." | "Take mine." |
| Grunt — Yell (Booming) | "OI! You're in the way of our Marnie's *destiny*!" | "…She's goin' to be so embarrassed we did this." |
| Grunt — Yell (Tearful) | "I just think she's *great*, right, and nobody else from our town ever got *anywhere*—" | "Don't tell her I cried. Tell her I was dead hard." |
| Specialist — Plant Researcher (Detached) | "Subject is Overcharged to one hundred and forty percent. Please stand clear, or don't." | "It's fallen asleep. They do that after." |
| Lieutenant — The Ball Guy (Delighted) | "Heya, Trainer! Head office says I've to stop you! *Isn't that fun!*" | "Have a ball! Have— have all of them. Here." |
| Lieutenant — Cheer Captain Gaz (Foghorn) | "RIGHT, YOU! THREE CHEERS FOR GIVIN' UP! HIP HIP—" | "…Nobody said 'hooray'. That's on me." |
| Commander — Director Hollis (Clipped) | "We apologize for the delay to your journey. This is the delay." | "Normal service will not resume." |
| Commander — Director Pryce (Soothing) | "You're not covered for this, I'm afraid." | "I shall have to make a claim." |
| Executive — Sordward (Fruity) | "Kneel! …No? It's traditional." | "I shall remember this in my *memoirs*." |
| Executive — Shielbert (Fruity, lower) | "What he said. But *I* said it with dignity." | "Brother, they've done it again." |
| Liaison — Ardos (Cold) | "You are in my father's way." | "Hm." |

### E9.2 Rose's barks

| Moment | Line |
| --- | --- |
| Player lands a super-effective hit | "Oh, *well done*! You see, this is exactly the kind of talent Galar can't afford to lose!" |
| Player's Pokémon faints | "Regrettable. But one must take the long view." |
| His Pokémon faints | "Thank you for your service. I mean that. I shall name a wing after you." |
| Player heals | "Sensible. Never run a system at its limit. I say so in all my talks." |
| A Shadow Pokémon disobeys the player | "One of ours! It's had rather more energy than it knows what to do with. Haven't we all." |
| Last Pokémon each | "Just the two of us and a thousand years. Shall we?" |

### E9.3 Stadium tannoy (by world state)

| Step | Announcement |
| --- | --- |
| 1 | "Today's match is brought to you by Macro Cosmos: Bank, Rail, Air, Life, Construction and Insights. *We're everywhere you are.*" |
| 2 | "Spectators are advised that the large Wooloo on the pitch is *not* part of today's entertainment. Please remain seated." |
| 3 | "Due to atmospheric conditions, the roof will remain closed. The red light is nothing to worry about. It is being looked into by the people who caused it." |
| 4 | "All rail and air services from this stadium are cancelled. Macro Cosmos apologizes, in the sense of regretting that you are upset." |
| 5 | "Would the owner of the sky please report to the Chairman's office." |

### E9.4 Civilians by world state

| Step | Line A | Line B |
| --- | --- | --- |
| 1 | "Chairman's a marvel. Trains run on time, lights stay on. Never ask how a sausage is made." | "Ball Guy gave me a free Ball. Lovely fella. Bit *keen*." |
| 2 | "My Yamper went the size of a shed in the kitchen. For about a second. Then it was sick." | "There's a stall selling insurance against a fairy story. My wife bought two." |
| 3 | "Sky's gone a funny color over Hammerlocke. Like a bruise coming up." | "Team Yell blocked my street for an hour. For a *snake*. I'm not even cross. It was a nice snake." |
| 4 | "No trains, no taxis. I've walked from Motostoke. I've not walked anywhere since school." | "They're saying go to the stadium if it gets worse. Which one? *All* of them, apparently." |
| 5 | "It's on the big screen. The Chairman's talking. He looks so *pleased*." | "…Do you hear that? From the cheap seats? Someone's started a chant." |

### E9.5 Announcer lines for special Pokémon

| Pokémon | On entry |
| --- | --- |
| Any Overcharged Pokémon | "It can Dynamax once without a Power Spot. It will pay for that." |
| Any Loud Pokémon | "The stands are cheering. It gets faster." |
| Skyline | "Skyline blocks out the light." |
| First Friend | "First Friend was never thrown away." |
| The Encore | "The Encore: one more." |
| Lighthouse | "The shadow tightens. She is terribly sorry about the size of her." |
| The Darkest Day | "The clouds turn the color of a wound." |

---

## E10. Flags and Wiring

| Flag | Set by | Read by |
| --- | --- | --- |
| `galar.x.forecast` (0–5) | Raids, climax schedule | Regional rules, tannoy, civilians |
| `galar.x.ball-guy` (`seen`) | *Have a Ball* | Raid 5, Phase 2 |
| `galar.x.yell` (`honorary`) | *Road Closed* | Raid 3, Raid 5, later regions |
| `galar.x.oleana` (`shaken`) | *For Immediate Release* | Phase 3 |
| `galar.x.chant` (`learned`) | *The Gig* | Raid 4, Phase 4 |
| `galar.x.peony`, `galar.x.permit`, `galar.x.draft` | Events, Raid 1 | Raid 5, Phase 5 |
| `galar.x.eternatus` (`returned` / `stays`) | Phase 6 | Aftermath, Region of Doom |
| `cipher.seen.ardos`, `cipher.rom.g` | *The Partner Firm*, Phase 3 | `docs/GRAND_ARC.md` |

**Counts for this file:** 16 named characters (7 new officers, 9 team versions and allies), 13 special Pokémon across two lines, 5 special Shadow Pokémon (1 Apex), 8 story events, 3 deepened raids and 2 new raids, an 8-phase Extended Cut, and 5 dialogue tables.
