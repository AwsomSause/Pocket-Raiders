# 09x — PALDEA: TEAM STAR — EXPANDED EDITION
### Script: *The Kids Who Stayed Out*

> *"We built five engines so the school would have to look at us. A man came and offered to buy them. That's when I knew what we'd built."* — Cassiopeia

**Extends:** `scripts/09_PALDEA_TEAM_STAR.md` (the base script stays valid; this file adds to it)
**Template:** `docs/EXPANSION_DESIGN.md` · **Cross-region arc:** `docs/GRAND_ARC.md`
**Canon note:** Cassiopeia (Penny), Giacomo, Mela, Atticus, Ortega, Eri, the five Starmobiles, Director Clavell and his student disguise "Clive", Arven and his Mabosstiff, the history of bullying behind Team Star and the old administration that erased the reports are canon to the games. Kieran is canon to the games' later chapters; his appearance here as **the Applicant** is a *what-if*. Nascour is a canon Cipher admin (Colosseum). The former vice-principal and the three former bullies are unnamed in the games; their names here are original. All dialogue is original. Species are my best recall and are marked approximate.
**This team is not the villain.** As in the base script, Team Star is a crew of kids who were failed. In the Expanded Edition the villain arrives from outside, and the last fight is fought beside Team Star, not against it.

---

## E1. The Wider Scale

The base script is five Bases and a street. The Expanded Edition asks what happens when something built out of loneliness turns out to be worth money.

### E1.1 The plan at five scales

| Scale | What is happening | What the player sees | Where it pays off |
| --- | --- | --- | --- |
| 1 **Street** | *Star:* kids who stopped going to class, passing flyers through locker vents | A first-year eating lunch in a toilet stall; a flyer with a star on it | Event *The Flyer* |
| 2 **City** | *Star:* five Bases, a battle league, a parallel school. *The Academy:* an ultimatum | Five banners on five hills; a new student with a remarkable haircut asking careful questions | Events *Clive*, *Read Receipts* |
| 3 **Region** | *The past:* eighteen months ago the bullying was reported, and the reports were deleted by the people paid to read them | An old wing of the Academy with its doors chained | Raid 5; event *The Old Hallway* |
| 4 **Border** | *Cipher:* a man with silver hair is touring the Bases offering scholarships, and asking how the engines work | Recruiters in uniforms that almost match | Event *Admissions*; Raid 4 |
| 5 **World** | *Cipher:* the five Starmobiles are, by accident, the cheapest Shadow engine ever built. Linked, they are worth more than everything the other regions made | Five engines running in a ring, and one voice on the loudspeaker that is not Cassiopeia's | Climax Phases 6 and 7 |

### E1.2 World-state track — *Attendance*

Stored in `star.x.attendance` (0–5). Here the track does not measure the team's progress. It measures how badly the adults are handling it.

| Step | Name | Regional rule | Civilian mood |
| --- | --- | --- | --- |
| 1 | **Empty Desks** | Star flyers at school and town nodes; Star Grunts ask a toll of nothing but a battle | Tutting |
| 2 | **Five Bases** | Routes near a Base have a checkpoint; friendly if the player has a Star badge | Curious |
| 3 | **Ultimatum** | The Academy posts expulsion notices; shops near the Academy will not serve anyone with a Star badge | Taking sides |
| 4 | **Buyers** | "Scholarship officers" at every Base gate; one in three Star Grunts met is a Cipher Peon in costume | Uneasy |
| 5 | **Barrage** | Five engines audible from anywhere in Mesagoza; the climax is scheduled | Gathering to watch |

### E1.3 The bigger secret

Star Barrage is meant to be seen, not to hurt (base script §3). Three things sit underneath it.

**The reports.** Eighteen months ago a group of students was bullied badly enough that some of them stopped coming to school. They reported it. The vice-principal of the time deleted the reports, one by one, to protect the Academy's ranking. When Team Star confronted the bullies and the bullies withdrew, the same man recorded Team Star as the aggressors, then resigned with the rest of the old staff before anyone checked. Cassiopeia has recovered every deleted file. She has never released them, because they name the victims. Her friends.

**The engine.** A Starmobile works by forcing a Terastal charge through a Pokémon that has not chosen it. Five lonely kids found that out by accident in a garage. It is the same principle Cipher spent years and fortunes on. **Nascour** has come to buy. He was polite the first time.

**The Director.** The new head of the Academy has been attending his own school in a pompadour wig, as a student called Clive, to find out what actually happened. Everyone knows. Nobody has the heart to tell him.

---

## E2. Expanded Cast

### E2.1 New officers and specialists

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.star.nascour` | **Nascour** | Liaison (5) | canon (Colosseum) | Strategist: Cipher's chief admin, here as a "scholarship officer" | Gardevoir, Xatu, Dusclops, Walrein, Blaziken, Metagross *(approximate)* | Soft, unhurried, patient in the way of something that has never needed to hurry |
| `sc.star.harrow` | **Former Vice-Principal Harrow** | Commander (4) | original | Handler: the man who deleted the reports; now Cipher's "Head of Admissions" | Oranguru, Farigiraf, Kingambit | Reasonable. Always reasonable. It is the worst thing about him |
| `sc.star.peon-brask` | **Peon Brask** | Lieutenant (3) | original | Enforcer: one of the three who did the bullying; has not changed | Annihilape, Bombirdier | Loud, grinning; laughs before the joke |
| `sc.star.peon-odette` | **Peon Odette** | Lieutenant (3) | original | Strategist: the one who thought of the worst of it | Glimmora, Brambleghast | Sweet, exact, remembers everyone's weak point |
| `sc.star.peon-tully` | **Peon Tully** | Lieutenant (3) | original | Scout: the one who went along with it | Maushold, Dachsbun | Mumbles; will not look at Eri |
| `sc.star.captain-zeb` | **Captain Zeb** | Lieutenant (3) | original | Technician: Ortega's chief mechanic, age fourteen | Varoom, Tinkaton | Talks only about torque |

### E2.2 Team versions of characters you know

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.star.clive` | **Clive** | Associate | canon (games) | Director Clavell, Academy head, in a wig, "getting down with the youth" | Oranguru, Abomasnow, Polteageist, Amoonguss *(approximate)* | A sixty-year-old man saying "sup" |
| `sc.star.penny` | **Penny** | Civilian | canon (games) | A shy student in an Eevee backpack who has nothing to do with Team Star, she says | See Cassiopeia | Mumbles; brilliant; cannot make eye contact; dreadful liar |
| `sc.star.arven-cook` | **Arven, Caph Squad's Cook** | Associate | what-if | An upperclassman who does not belong anywhere either, and has started bringing sandwiches | **Old Pal** (Mabosstiff) | Gruff; shows care by feeding people and denying it |
| `sc.star.applicant` | **The Applicant** | Associate | what-if | Kieran, a boy from a small town who is tired of being the weak one, and has two offers on the table | **Overlooked** (see E4), Dipplin | Shy, then not; the "then not" is the frightening part |
| `sc.star.rival-achird` | **Boss of Achird Squad** (the rival) | Commander (4) | what-if | The rival as boss of a sixth squad, in the Side-with variant. Achird is the sixth star of Cassiopeia | The rival's team plus one Tuned Pokémon | The rival's archetype, for once among friends |
| `sc.star.player-fulu` | **Fulu Squad** (the player) | Specialist (2) | what-if | The player on the Inside Man and Stand-with routes: a squad of one, named for the constellation's seventh star | The player's team | — |

> **The three Peons** are Brask, Odette and Tully. They left the Academy when Team Star stood up to them. Harrow found them work.

---

## E3. Special Pokémon — the Tuned line

**Tuned** Pokémon have been through a Base's garage. The squads call it "borrowing a Tera".

**Line rule — *Tuned*:** once per battle a Tuned Pokémon may Terastallize into its squad's type for 2 turns without a charged Tera Orb. When it ends, the Pokémon stalls: −1 Speed for the rest of the battle (announced: "It's borrowed. It has to give it back.").

| ID | Name | Species | Signature trait | Where met | Can the player get it? |
| --- | --- | --- | --- | --- | --- |
| `sv.star.segin-starmobile` | **Segin Starmobile** | Revavroom | *Dark Engine*: Dark type; lowers the foe's Attack on entry | Giacomo, Raid 1 | No |
| `sv.star.schedar-starmobile` | **Schedar Starmobile** | Revavroom | *Fire Engine*: Fire type; +1 Speed at the end of each turn | Mela, Raid 2 | No |
| `sv.star.navi-starmobile` | **Navi Starmobile** | Revavroom | *Poison Engine*: Poison type; scatters toxic spikes when hit by a physical move | Atticus, Raid 3 | No |
| `sv.star.ruchbah-starmobile` | **Ruchbah Starmobile** | Revavroom | *Fairy Engine*: Fairy type; sets a misty field on entry | Ortega, Raid 4 | No |
| `sv.star.caph-starmobile` | **Caph Starmobile** | Revavroom | *Fighting Engine*: Fighting type; +1 Defense each time it is hit | Eri | No |
| `sv.star.neon-moon` | **Neon Moon** | Eevee / Neon Moon | *Backdoor*: once per battle it ignores the foe's protective move and screens | Cassiopeia's hidden ace | No |
| `sv.star.pyro-spirit` | **Pyro Spirit** | Eevee / Pyro Spirit | *Firewall*: the first status move aimed at its side each battle fails | Cassiopeia | No |
| `sv.star.amp` | **Amp** | Wattrel / Kilowattrel / Megawattrel | *Bass Drop*: every fourth turn its Electric moves hit both foes | Giacomo's sound rig | Yes: it follows whoever fixes the speaker in Raid 1 |
| `sv.star.old-pal` | **Old Pal** | Mabosstiff | *Good Dog*: when its trainer's last other Pokémon faints, it enters at once with +1 to all stats | Arven | Ally only: it is Arven's |
| `sv.star.detention` | **Detention** | Gimmighoul / Roaming Form Gimmighoul / Gholdengo | *Lost Property*: after a won battle it finds one item the foe was holding | Under a desk in the Old Wing | Yes: it climbs into the player's bag in Raid 5 |

> The five Starmobiles are Tuned by definition: they are what the word means. Neon Moon and Pyro Spirit are not. Neon Moon is also the name Cassiopeia uses on the Academy's network, and has been for three years.

---

## E4. Special Shadow Pokémon

Team Star's method is the **Star Barrage Link**; grounding a Starmobile gives −30 Corruption (Shadow doc §6). **Team Star has never made a Shadow Pokémon on purpose.** Every Pokémon below was bound by Cipher, using what Team Star built.

| ID | Code | Name | Species | Tier | Shadow ability | Shadow moves | Purification key | Where met |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ss.star.first-engine` | — | **The First Engine** | Varoom / Revavroom | 3 Gripped | Unbound Spark | Umbral Rush, Gloam Crash, Dusk Brand | Ortega rebuilds it: bring him three parts | Raid 4 |
| `ss.star.overlooked` | — | **Overlooked** | Applin / Dipplin / Hydrapple | 2 Bound | Echo of Another | Siphon Lull, Dusk Brand | Its trainer says one honest sentence to it | Event *The Applicant* |
| `ss.star.grudge-tablets` | — | **The Tablets of Grudge** | Wo-Chien | 3 Gripped | Relic Ward | Siphon Lull, Chain Hymn, Null Pulse | Read the deleted reports aloud at its shrine | Raid 5, or the shrine after it |
| `ss.star.time-capsule` | — | **The Time Capsule** | Roaring Moon / Iron Valiant | 4 Fallen | Unbound Spark | Gloam Crash, Weeping Maw, Heart Eclipse | Site Cleansing only; it does not belong to this age | Phase 1, if world state is 5 |
| `ss.star.cassiopeia-engine` | XD012 | **The Cassiopeia Engine** | Revavroom | 4 Fallen | Unbound Spark | Null Pulse, Heart Eclipse, Starfall Barrage | Story only: five Bosses pull five cores | Starfall Street, Phase 6 |

**Signature Shadow move — Starfall Barrage:** five hits of 22 power, one each of Dark, Fire, Poison, Fairy and Fighting type; each hit that is super effective adds +2 Corruption to the user. Cost: +6 Corruption. Announced one turn ahead ("Five engines turn over at once.").

**Notes**
- **The First Engine** is the Varoom that Ortega and Penny tuned in a shed, the first week. The bullies smashed it. Cipher bought the wreck from a scrap dealer and rebuilt it wrong.
- **The Tablets of Grudge** is one of Paldea's sealed treasures: the grudge of someone punished for writing down a ruler's misdeeds. Harrow pulled its stakes because he was told to. He has not thought about why that one, of the four, frightens him.
- **The Time Capsule** is a Pokémon from the wrong age, drawn up from the great crater by the Engine's test firings. Which one it is follows the run's seed.
- **The Cassiopeia Engine** is the five Starmobiles linked, with Cipher's hand on the link. It follows the Legendary Shadow rules.

---

## E5. New Story Events

### E5.1 *The Flyer* (`xe.paldea.flyer`) — Street

*Trigger: any Academy or town node. A corridor. A locker with a paper star taped inside the vent. From the toilets, the sound of someone trying to eat crisps quietly.*

> **FIRST-YEAR** *(through a stall door)*: "Occupied."
> **PLAYER:** "…It's lunchtime."
> **FIRST-YEAR:** "I know. That's why I'm in here."
> *(Under the door, a flyer slides out. A star. Five words:* YOU CAN SIT WITH US.*)*
> **FIRST-YEAR:** "Someone put that in my locker. I don't know who. Do you think it's a trick? Things like that are usually a trick."
> **PLAYER (choice):**
> 1. **["It's not a trick."]** → *(Needs to have met any Star Boss.)* The door opens a crack. `star.x.first-year = hopeful`.
> 2. **[Sit down outside the stall]** → *(One rest node.)* The player eats lunch on a corridor floor. After a while a second sandwich comes under the door. Heal 20%.
> 3. **["Who made you eat in there?"]** → **FIRST-YEAR:** "Nobody. That's the thing. Nobody did anything. They just all know not to sit next to me." Intel +2.
> *(Later in the region, at any Base: the same first-year, in a helmet two sizes too big, holding a wrench the wrong way round, grinning.)*

### E5.2 *Clive* (`xe.paldea.clive`) — City

*Trigger: any Academy node at world state 2 or higher. A student leans on a wall. He has a pompadour the size of a loaf. He is sixty.*

> **CLIVE:** "Sup. I am Clive. A student. Of this school. I am 'down' with Team Star, as we youths say. Do you know where one might 'hang' with them?"
> **PLAYER:** "…Director?"
> **CLIVE:** "Who? I know of no such man. I am *Clive*. I enjoy… skateboards."
> **PLAYER (choice):** ["Sure, Clive."] → He beams. He will join the player at one raid of their choice as an ally, and fight very well, and say "radical" once. `star.x.clive = friend`. / ["Why are you really here?"] → *(The posture goes out of him.)* **CLIVE:** "Because I was appointed to a school whose records for a certain year are blank. Blank records are not an accident. They are a *decision*. I should like to know whose." Intel +4. / ["Nice hair."] → **CLIVE:** "Thank you. It is my own. …It is *now* my own. I paid for it."

### E5.3 *Sandwiches* (`xe.paldea.sandwich`) — Street

*Trigger: outside any Base, before its raid. A tall student with a huge backpack is unloading foil parcels onto a wall. A very old dog is asleep on his feet.*

> **ARVEN:** "Don't get the wrong idea. I'm not *with* them. I just make too much. Somebody's got to eat it."
> **STAR GRUNT** *(mouth full)*: "He says that every day. He labels them. That one's got my name on."
> **ARVEN:** "*Because you're allergic to pickles*, that's not— that's just food safety."
> *(The dog lifts its head, looks at the player, decides they are acceptable, and goes back to sleep.)*
> **PLAYER (choice):** [Take a sandwich] → Heal 30%; a random stat +1 for the next battle. / ["Why here?"] → **ARVEN:** "My dad was a professor. Never home. I ate a lot of lunches by myself. These kids eat together. I like the noise." `star.x.arven = cook`. / [Pet the dog] → **ARVEN:** "He's had a hard few years. He's getting better. Scratch behind the left ear. *Left.*" Bond +1 with the player's lead.

### E5.4 *Read Receipts* (`xe.paldea.read-receipts`) — City

*Trigger: the Academy entrance hall, after Raid 1 is offered. A girl in an Eevee backpack is sitting behind a pillar with a laptop. The player's phone rings. On the laptop screen, the same call is being placed.*

> **CASSIOPEIA** *(on the phone, a voice changer)*: "This is Cassiopeia. I have been watching you. I have a proposal."
> **PENNY** *(behind the pillar, quite audible, not looking up)*: "…I have a proposal."
> **PLAYER (choice):** [Play along] → **CASSIOPEIA:** "The Bosses will not stand down unless they are beaten. They made me promise never to let them be talked out of it. So: beat them. Kindly." `star.x.penny = trusted`. / [Walk round the pillar] → *(She slams the laptop.)* **PENNY:** "I'm not— that's not— I was *doing homework*." *(A long pause.)* "…How long did you know?" **PLAYER:** "Since 'I have a proposal'." **PENNY:** "*Ugh.*" `…= known`; she will speak as herself from now on, which she finds much harder. / ["What's on the laptop?"] → **PENNY:** "Reports. Eighteen months old. Deleted by someone with staff access at 11:42 on a Friday night. I got them back. I've read them maybe two hundred times. They've got my friends' names in them and everything that was done." *(She closes it.)* "I can end this any day I like. I just have to show everyone the worst week of their lives."

### E5.5 *Admissions* (`xe.paldea.admissions`) — Border

*Trigger: any Base gate at world state 3 or higher. A man with long silver hair is talking to a ring of Star Grunts. He has a folder of brochures.*

> **NASCOUR:** "A full scholarship. Board, tuition, a laboratory of your own. My organization prizes exactly the kind of initiative your schools punish."
> **STAR GRUNT:** "What's the catch?"
> **NASCOUR:** "No catch. We would simply like to understand your engines. And, in time, to borrow them."
> *(The Base gate bangs open.)*
> **MELA:** "OI! Shampoo advert! We've told you twice! They're not for sale and neither are *they*!"
> **NASCOUR** *(not raising his voice at all)*: "I heard you both times. I have not come back to ask a third. I have come back so that you will remember that I asked."
> *(He sees the player. He inclines his head, exactly as far as courtesy requires.)*
> **NASCOUR:** "The one from the reports. Eight regions. You have cost us a great deal. I am not angry. Anger is for people who are not going to win."
> **PLAYER (choice):** [Take a brochure] → Intel +5: the "school" has an island for an address. / [Stand next to Mela] → Rep with Star +8. **MELA:** "…Okay. You can stay." / [Challenge him] → **NASCOUR:** "No. Not here, in front of children. I have *some* standards. They are simply not the ones you would like."

*Writes: `cipher.seen.nascour`.*

### E5.6 *The Old Hallway* (`xe.paldea.old-hallway`) — Region

*Trigger: any route at world state 4. Three "Star Grunts" at a checkpoint. The helmets are right. The boots are wrong.*

> **PEON BRASK:** "Hahaha— toll! Team Star toll! Hand it over, that's what we do, we're *delinquents*—"
> **PEON ODETTE** *(a smile like a paper cut)*: "You'll want to pay. Otherwise people will say Team Star beats up travellers. *Again.* That's rather the idea."
> **PEON TULLY:** *(says nothing; is looking at his boots.)*
> **PLAYER (choice):** [Battle them] → *(Battle: the three in turn. Trait: **Old Habits**: they always target the player's Pokémon with the lowest remaining HP; announced.)* / ["You're the ones from before."] → **ODETTE:** "We were *children*. It was *years* ago. Honestly, some people can't let anything go." **BRASK:** "Hahaha!" **TULLY:** "…It was eighteen months." *(They both look at him.)* `star.x.tully = cracking`. / [Call a real Star Grunt over] → Eri arrives. She does not say a word. She is a head taller than all three of them now. They leave.
> **TULLY** *(last to go, very low)*: "The big one. Eri. Tell her— no. Don't tell her anything. I don't get to."

### E5.7 *The Applicant* (`xe.paldea.applicant`) — Region

*Trigger: outside Caph Base, any time after* Admissions*. A boy with a purple-black fringe is holding two pieces of paper: a hand-drawn Star flyer and a glossy brochure.*

> **KIERAN:** "I came all the way from Kitakami. I'm sick of being the one who loses. I want to be *strong*. So strong nobody ever looks past me again."
> **KIERAN:** "These ones say I can sit with them. The man with the silver hair says he can make me win. I know which one I *should* pick. I know which one I *want*."
> *(His Dipplin is looking at the brochure and then at him, and it has shrunk back into its apple a little.)*
> **PLAYER (choice):**
> 1. **["Winning won't fix it."]** → **KIERAN:** "You'd say that. You *win*." *(He walks toward the silver-haired man.)* `star.x.kieran = cipher`. **Overlooked** will be bound.
> 2. **[Battle him, and lose on purpose]** → *(He knows. It makes it worse.)* As option 1.
> 3. **[Battle him properly, then stay]** → *(Win or lose, the player does not leave afterwards.)* **KIERAN:** "…Why are you still here?" **PLAYER:** "…" **KIERAN:** "Nobody stays after." *(Eri has come out of the Base with two water bottles. She throws him one.)* **ERI:** "We do. Come on. You can hold the pads." `…= star`.
> *If he goes to Cipher, he is met again in Phase 2, with `ss.star.overlooked`, and the key to freeing it is one sentence he has to say himself: "I'm sorry I stopped looking at you."*

### E5.8 *Shop Class* (`xe.paldea.shop-class`) — Street

*Trigger: Ruchbah Base's garage, before Raid 4. Ortega is under a chassis. Captain Zeb is handing him the wrong spanner on purpose.*

> **ORTEGA:** "The first one was a Varoom Penny found in a skip. We tuned it in my dad's garden shed with a hairdryer and a Tera shard off a field trip. It went *whoomp* and turned pink and we screamed for about an hour."
> **CAPTAIN ZEB:** "Torque was awful."
> **ORTEGA:** "Torque was *awful*. We loved it. Then the— then some people found the shed." *(He does not come out from under the car.)* "We built five more out of spite. Better ones. But that first one was the only one we built 'cause it was *fun*."
> **PLAYER (choice):** [Ask what happened to it] → **ORTEGA:** "Scrap dealer. I looked. Somebody'd already bought it. Paid ten times what it was worth. Who *does* that?" Intel +4; unlocks the purification of **the First Engine**. / [Hand him the right spanner] → **CAPTAIN ZEB** *(betrayed)*: "*Hey.*" Rep +3. / [Ask how the link works] → He explains. It takes four minutes. It is, the player gradually realizes, an exact description of how to make a Shadow Pokémon, told by someone who thinks he is describing a go-kart.

---

## E6. Raids, Expanded

In Paldea a "raid" on a Base is a challenge the squad expects and half wants. The two new raids reverse the usual direction: in one the player defends a Base, and in the other the player breaks into a school.

### E6.1 Raid 1 — "Segin Base", deeper

**New phase order:** Garage → **The Booth** *(new)* → Gym → Roof.

**The Booth.** Giacomo's sound rig: two stacks of speakers, a mixing desk made from a school desk, and a Kilowattrel wired in as the power supply and loving it. One speaker is blown.

> **STAR GRUNT:** "Boss says a base without a beat's just a car park. Speaker's been dead a week. He's been *humming* the bass part."
> **PLAYER (choice):** [Fix the speaker] *(any Electric- or Steel-type Pokémon in the party)* → **Amp** (`sv.star.amp`) hops onto the player's shoulder. The battle music for this raid changes. / [Leave it] → No change.

**Giacomo, extended:**

> **GIACOMO:** "Know why I'm first? 'Cause I asked to be. If the school's gonna send someone, they come through me. Segin's the star at the end of the W. The one out in front."
> **GIACOMO (defeat, extended):** "…Clean. No cheap shots. You're not who I thought they'd send." *(He takes off his headphones.)* "She's got something on her laptop she won't show us. I think she's protecting us from our own worst week. Tell her we're tougher than that. She won't believe *me*."

### E6.2 Raid 2 — "Schedar Base", deeper

**New phase order:** Courtyard → Furnace → **The Wall of Names** *(new)* → Overlook.

**The Wall of Names.** A long wall by the furnace where every kid who joins Schedar burns their old school tie and hangs the knot. There are sixty knots. Under each, in marker, a first name, and under some of them, a second thing in smaller writing: *ate lunch in the art cupboard. told he smelled. they hid her shoes.*

> **STAR GRUNT:** "Boss Mela makes us write what happened. Just once. Then it's on the wall and it's not in *you* anymore. That's the rule."
> *(At the far end, the first knot. The name is MELA. The smaller writing has been scrubbed out, hard, and written again, and scrubbed out again.)*

**Mela, extended:**

> **MELA:** "I was the one who said 'enough'. Did they tell you? I walked up to the three of them in the canteen with half the school watching and I said it. My voice cracked. Everybody *laughed*."
> **MELA:** "And then Eri stood up. And Atticus. And this tiny rich kid I'd never spoken to. And somebody I couldn't see sent a message to every phone in the room that just said: *They're right.*"
> **MELA (defeat, extended):** "I'd do it again. With my voice cracking. Tell the school *that*."

### E6.3 Raid 3 — "Navi Base", deeper

**New phase order:** The Marsh → **The Workshop** *(new)* → The Leak → Navi Squad.

**The Workshop.** Racks of costumes. Atticus sews the squads' uniforms himself.

> **ATTICUS:** "Verily, a visitor. Prithee excuse the pins. A uniform is a promise, thou seest: *thou art one of us, and I have measured thee to prove it.*"
> **ATTICUS** *(dropping the voice for one sentence)*: "They used to take my sketchbook and read it out. I started talking like this so that there'd be a *character* for them to laugh at, and not me. It stuck. I rather like him."
> **PLAYER (choice):** [Ask for a uniform] → He measures the player in silence and hands over a **Star Badge**, hand-stitched. Checkpoints are friendly from now on. / ["Who is the costume for?"] → A sixth mannequin, half-finished, no squad color. **ATTICUS:** "For whomsoever cometh next. There is always a next."

**The Leak, extended.** The poison in the marsh is not Navi's. A drum with no markings is leaking under the boardwalk. Its lid has a small stamped letter that is not a star. Intel +4.

### E6.4 Raid 4 — "The Buyers" *(new; the player defends)*

**Scale:** Border. **Offered:** world state 4, or after `xe.paldea.admissions`, by Ortega over a crackling radio.
**Offer:** *"There's a van at my gate with no plates and about thirty people in Star helmets getting out of it and* I don't know any of them*. I'm a mechanic! I do not have a* plan *for this!"*
**PR:** `pr.paldea.ruchbah-base` — 4 areas: The Gate → The Garage → The Test Track → The Vault. **Security:** it is the player's side that has the security: Ortega's traps (confetti cannons, a glitter floor, one real pitfall), which the player can arm at the start.
**Objectives:** *Primary:* keep the Ruchbah Starmobile out of the van. *Secondary A:* recover the First Engine. *Secondary B:* defeat Harrow. *Secondary C:* nobody under sixteen gets hurt.

**Phases**

1. **The Gate.** Three waves of Cipher Peons in Star costume. The player holds the gate with Captain Zeb and whichever Star Grunts are awake.
   > **CAPTAIN ZEB:** "They've got our helmets on. They haven't got our *boots*. Hit the ones with the wrong boots."
2. **The Garage.** Harrow, in a good coat, looking at the engines the way a man looks at a house he intends to buy.
   > **FORMER VICE-PRINCIPAL HARROW:** "You must understand, I bear these children no ill will. I never did. A school is a reputation. One protects the reputation and the children are protected with it. That is simply how institutions *work*."
   > **PLAYER:** "You deleted the reports."
   > **HARROW:** "I *managed* the reports. And when the matter resolved itself, I ensured the record reflected a version that would not follow anyone to university. You're welcome."
   > *(Battle. Trait: **For Your Own Good**: at the start of each turn he may forbid one of the player's four moves for that turn, with a reason; announced.)*
   > **HARROW (defeat):** "This will look very bad for them, you know. *Violence.* At a *Base*. I shall be sure it's written down."
3. **The Test Track.** The van is leaving with a tarpaulin-covered shape on a trailer. A Convoy of two battles down Ortega's go-kart circuit. Under the tarpaulin: **the First Engine** (`ss.star.first-engine`), rebuilt, red where it used to be pink.
   > **ORTEGA** *(over the radio, voice cracking)*: "That's— that's *ours*. That's the *first* one. What did they *do* to it?"
4. **The Vault.** If the trailer is stopped, Ortega gets his hands on it. With three parts (one from each earlier Base's garage) he strips Cipher's work out in front of the player.
   > **ORTEGA:** "Hairdryer. Hand me the— no, the *actual hairdryer*. This is how we did it the first time."
   > *(It goes* whoomp*. It turns pink. Corruption to zero. Ortega and Zeb scream for about a minute.)*

**Results (Lever: *The Fifth Engine*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The Starmobile is safe; the First Engine is home and pink; nobody hurt | **Only four:** the Cassiopeia Engine has four cores, not five; Ortega is an ally from Phase 1 | −3 |
| **Success** | The Starmobile is safe | Ortega's Phase 1 battle is skipped | −2 |
| **Partial** | The Starmobile is safe; the First Engine is gone | No change | −1 |
| **Failure** | The van takes both | **Six cores:** the Engine has a sixth core, the First Engine, bound | +2 |
| **Declined** | Ortega holds the gate alone. He loses. He is fourteen | Six cores; Ortega is absent from the climax, in the nurse's office | +1 |

**Failure consequences:** **C6 (Hostage: Captain Zeb), C4 (Strength surge), C11.**

### E6.5 Raid 5 — "The Old Wing" *(new)*

**Scale:** Region. **Offered:** after `xe.paldea.read-receipts`, by Penny, in person, with great difficulty.
**Offer (Penny, to the floor):** *"I have copies. Copies aren't proof. The originals are on a server in the Old Wing, which is locked, and I can open any lock in this school from my bedroom except that one, because that one is a* padlock*. I need someone who goes outside."*
**PR:** `pr.paldea.academy-old-wing` — 4 areas: The Chained Door → The Staff Corridor → The Records Room → The Roof. **Security:** it is a school at night: a caretaker with a torch, motion lights, a Gimmighoul in a filing cabinet. No Star Grunts and no Peons at first.
**Objectives:** *Primary:* take the original reports. *Secondary A:* find who deleted them and when. *Secondary B:* do it without being seen by the caretaker. *Secondary C:* decide who reads them.

**Phases**

1. **The Chained Door.** If `star.x.clive = friend`, a figure with a pompadour is already there, holding a ring of keys.
   > **CLIVE:** "Sup. I happened to be passing. With these keys. Which I found. On the *Director's* desk. Whom I am not."
2. **The Staff Corridor.** Old staff photographs. One year's is missing from its frame. A wild-eyed chest in a cabinet hops out and into the player's bag: **Detention** (`sv.star.detention`).
3. **The Records Room.** One terminal, still logged in. A deletion log: forty-one entries, one staff account, one Friday night.
   > **PENNY** *(in the player's earpiece)*: "That's it. That's the account. Okay. Okay okay okay. Copy the log. Don't read the reports. Please don't read the reports."
   > **PLAYER (choice):** [Don't read them] → `star.x.reports = sealed`. / [Read one] → *(The game shows one line and stops.)* `…= read`. Penny knows. She does not say anything for the rest of the raid.
4. **The Roof.** Harrow, with Brask and Odette. He has come for the same server.
   > **HARROW:** "Ah. I had hoped to do this quietly. Those files name *children*. I am here to protect them."
   > **PENNY** *(she has come up the stairs herself; she is shaking so hard the laptop rattles)*: "You're here to protect *you*. I've got the timestamp. Eleven forty-two. You went home and had *dinner* after."
   > *(Battle: Harrow, then the two Peons together. If Tully is `cracking` he is not with them. He is at the bottom of the stairs, holding the door shut against Cipher's backup, and nobody asked him to.)*

**Results (Lever: *The Record*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The originals and the log, unseen, unread | **The truth is ready:** Phase 7 can be won without a battle; the Tablets of Grudge can be purified | −3 |
| **Success** | The originals and the log | Phase 7 needs one fewer exchange | −2 |
| **Partial** | The log only | No change | −1 |
| **Failure** | Harrow wipes the server | **No record:** Phase 7 must be fought; the Academy's ultimatum stands into the Aftermath | +2 |
| **Declined** | The Old Wing stays chained | No record | +1 |

**Failure consequences:** **C8 (Reputation fall), C9 (Gym lockdown), C11.**

---

## E7. The Climax — Extended Cut: "Roll Call"

Checkpoints are after Phase 2 and at the Breather.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | Broadcast and Choice | — | base §10.1–10.3 | 0 |
| 0b | **The Five Bases** | Siege Map | new | 0 |
| 1 | **The Long Walk to School** | Blackout | new | 2–3 |
| 2 | The Squad Line | Gauntlet | base Phase 1, extended | 4–6 |
| 3 | The Bosses | Duels | base Phase 2, extended | 2–4 |
| — | **Breather** | Rest | new | 0 |
| 4 | The Star Barrage | Set piece | base Phase 3, extended | 3–5 |
| 5 | Cassiopeia | Boss | base Phase 4, extended | 1 |
| 6 | **The Cassiopeia Engine** | Colossus | new | 1 |
| 7 | **The Assembly** | Debate | new | 0–1 |
| 8 | Resolution | — | base §10.9, extended | 0 |

### E7.1 Phase 0b — The Five Bases (Siege Map)

Each Base either trusts the player or does not. A Base that trusts the player keeps its own Starmobile out of Cipher's hands when the link is taken.

| Base | Held if… | If Lost |
| --- | --- | --- |
| **Segin** (Dark) | Raid 1 Success or better | Its core in Phase 6 has an extra shield |
| **Schedar** (Fire) | Raid 2 Success or better, or the player stood next to Mela | Starfall Street is burning in Phase 2 |
| **Navi** (Poison) | Raid 3 Success or better, or the player wears Atticus's badge | The leak reaches the Street: poison hazard in Phase 2 |
| **Ruchbah** (Fairy) | Raid 4 Success or better | Six cores, not five |
| **Caph** (Fighting) | Kieran chose Star, or Arven is the squad's cook | The Applicant fights in Phase 2 with Overlooked |

> **ERI** *(on the phone, out of breath)*: "Caph's good. We've got the new kid on the gate. He's *terrifying*. In a good way now. Go. Go, go, go."

### E7.2 Phase 1 — The Long Walk to School (Blackout)

Mesagoza's great stair, every step of it. **Condition — *Tera Flicker*:** the Engine's test firings wash over the city: at the start of every third turn each active Pokémon's type is replaced by a random Tera type for that turn (announced, with the type). It ends at the top of the stair, or does not apply to a party carrying **Neon Moon's** counter-signal, which Penny sends if she trusts the player.

Peons in Star costume hold the landings.

> **PEON BRASK:** "Hahaha! Team Star says nobody gets to school today! That's what you'll tell them! Team *Star*!"
> **A REAL STAR GRUNT** *(coming up behind him, very small, very angry)*: "We've *never* stopped anyone getting to school! We just didn't *go*!"
> *(If the world state is 5, the last landing has something on it that should not exist yet, or anymore: `ss.star.time-capsule`.)*

### E7.3 Phase 2 — The Squad Line (extended)

Half the trainers in the line are Team Star and half are Cipher in costume. The game marks which is which the moment the player works out a tell: **Star never hits a Pokémon that is already down.**

| Station | Trainer | Notes |
| --- | --- | --- |
| Gate | Star Grunts ×2 | base |
| **Bike Racks** | Cipher Peons ×2, in costume | They target the lowest-HP Pokémon; that is the tell |
| Plaza | Star Specialist ×2 | base |
| Fountain | Squad Captain | Trait: **Revved Up** |
| **Fountain, far side** | Peon Odette | Trait: **Old Habits** |
| Starmobile 1 | Eri | Trait: **Sporty Rush**; an ally if Caph is Held |
| Starmobile 2 | Ortega | Trait: **Charm Offensive**; an ally after Raid 4 Success |
| **Clock Tower steps** | The Applicant, with **Overlooked** | Only if Kieran chose Cipher |

> **ODETTE:** "Oh, it's the transfer student who can't mind their own business. Do you know what the nice thing about a uniform is? Whatever I do in it, *they* did."
> **THE APPLICANT:** "He said I'd win. I'm winning. Look at me. I'm *winning*." *(Behind him, something that used to be a Dipplin is looking at the back of his head.)*
> *(Purification key: after the battle, win or lose, Eri walks up and holds out the pads. He has to say it himself. "I'm sorry I stopped looking at you." The Shadow goes out of it like air out of a tyre.)*

### E7.4 Phase 3 — The Bosses (extended)

**Duels 1 and 2** (base): Giacomo; Atticus or Mela.

**Duel 3 — Clive** *(new; only if `star.x.clive` is unset)*. A sixty-year-old in a wig steps out of the crowd.

> **CLIVE:** "As a fellow student, I must— no." *(He takes the wig off.)* "As Director of this Academy I must know whether you are making this better or worse. Forgive me. I only know one way to ask."
> *(Battle: Clavell. He is very good.)*
> **CLAVELL (defeat):** "Better, then. Go on. I shall be in the auditorium. I have a great deal of reading to do, and I gather a young lady has it."

**Duel 4 — Nascour** *(new)*. He is standing under the Academy clock, hands folded, watching the Starmobiles circle.

> **NASCOUR:** "Do you know what is remarkable? We spent eleven years closing the heart of a Pokémon by force. These children did it in a shed, in an afternoon, *by wanting something very badly*. I find that instructive."
> **NASCOUR:** "I asked nicely. I always ask nicely first. It establishes, afterwards, whose fault it was."
> *(Battle. Trait: **Patience**: for the first 3 turns his Pokémon only use protective and status moves; from turn 4 every one of his attacks has +20% power; announced.)*
> **NASCOUR (defeat):** "Well fought. Take the record." *(A disc.)* "It does not matter. I do not need to win *here*. I only needed the five of them to drive in a circle."

*Reward:* **Data ROM P: "Borrowed"**.

### E7.5 Breather

A picnic blanket in a side street. Arven has made far too much.

> **ARVEN:** "I'm not here to help. I was in the area. With forty sandwiches. Shut up and eat. …The one with the star on the wrapper's yours. I didn't *draw* the star. It was like that."

Heal 50%, revive one Pokémon, checkpoint. Old Pal licks whichever of the player's Pokémon is lowest on HP: it is cured of any status.

### E7.6 Phase 4 — The Star Barrage (extended)

The base set piece (five Starmobiles circling, 3–5 waves, a Terastal flash each wave) with one change that grows as it goes: **the link is being taken.**

- Each wave, one Starmobile's lights go from its squad's color to red, unless its Base is Held.
- A red Starmobile's squad stops fighting the player. They are trying to get their Boss out of the cab.
- The crowd, who came to watch a show, begins to understand it is not one.

**New loudspeaker lines.** The first voice is Cassiopeia's, through the changer. By the end it is not.

> **CASSIOPEIA:** "Wave one. This is Team Star. We're still here. *Look at us.*"
> **CASSIOPEIA:** "Wave two. You can expel us. You can't make us not have *happened*."
> **CASSIOPEIA:** "Wave thr— that's not my signal. Who's on my signal? *Who is on my*—"
> **NASCOUR** *(the same speakers, no changer, perfectly calm)*: "Thank you, children. That will do."

### E7.7 Phase 5 — Cassiopeia (extended)

The base fight (§10.7) with **Neon Moon** and **Pyro Spirit** added to her team.

**New boss stage — *Sent, Not Delivered*** (at 50% ace HP, replacing the base *Starfall* if the link has been taken): her phone, her laptop and the big screen behind her all show the same thing: her own commands, going out, and a second set arriving at the Starmobiles in their place. For 3 turns her Pokémon use moves she did not choose (announced: "That isn't her order."). She keeps fighting the player because she promised the Bosses she would, and fighting the screen with her other hand.

> **CASSIOPEIA (opening, extended):** "I'm not good at this part. Talking. I wrote a speech. It was eleven pages. Giacomo said cut it to one line. So: *we were here first, and you looked away.*"
> **CASSIOPEIA:** "I'm going to battle you now because they made me swear nobody would ever get to *talk* us out of it. Please be better than me. I've planned for you to be better than me."
> **PENNY (Sent, Not Delivered; no voice changer; she has dropped it):** "No, no, no, that's not *mine*, I didn't send that— Ortega, get OUT of the cab! Mela! *MELA!*"
> **PENNY (defeat, extended):** "It was supposed to be loud. That's all. It was supposed to be so loud they couldn't pretend." *(She looks at the five engines, all red now, pulling into a ring.)* "I built him a *weapon*. I thought I was building a *bell*."

### E7.8 Phase 6 — The Cassiopeia Engine (Colossus)

*The five Starmobiles lock nose to tail under the Academy clock. The ring starts to turn. The light coming off it is every Tera color at once, and then it is none of them.*

**Format.** **The Cassiopeia Engine** (`ss.star.cassiopeia-engine`, XD012) is a Colossus with **five cores**, one per Starmobile, each a shield bar (four after a Raid 4 Triumph, six after a Failure). It cannot be knocked out while a core is seated.

**This fight is fought beside Team Star.** Each Boss goes for their own core. A Boss whose Base is Held, or who was beaten kindly earlier, pulls their core in two turns without help. A Boss whose Base is Lost needs the player to break that core's shield first.

| Core | Boss | While it is seated |
| --- | --- | --- |
| **Segin** | Giacomo | The foe's Attack drops are reversed |
| **Schedar** | Mela | The Engine gains +1 Speed each turn |
| **Navi** | Atticus | Toxic spikes on the player's side |
| **Ruchbah** | Ortega | A misty field: no status on the Engine |
| **Caph** | Eri | It gains +1 Defense each time it is hit |

**Timer:** 12 turns. **Adjustments:** Clavell, wig off, takes one Starfall Barrage on his Oranguru; Arven sends in Old Pal for one turn when the player's last Pokémon is in danger; the first-year from the toilet stall, in an enormous helmet, pulls a lever nobody told them about and one core's shield drops by half; Team Yell, if the player is an Honorary Yeller, are somehow here, and chant.

> **GIACOMO:** "Segin's out front! Segin's *always* out front!"
> **MELA:** "My voice is NOT CRACKING! IT'S THE *ENGINE NOISE*!"
> **ATTICUS:** "Have at thee, thou *misbegotten carburettor*!"
> **ORTEGA:** "Torque's awful! *Good!*"
> **ERI:** "Kid! Pads! *Now!*" **KIERAN** *(if he chose Star)*: "*Got them!*"
> **NASCOUR** *(under the clock, watching five children take his machine apart with their hands)*: "…Hm. I had not allowed for that."

**When the last core is pulled:** the ring falls apart into five battered, ordinary Revavroom, each one nosing at its own Boss like a dog that has had a fright.

**If the timer runs out:** the Engine fires once. The Academy clock stops. Nobody is hurt; Penny had built in a governor, years ago, without telling anyone, because she was always afraid of exactly this. But Cipher has its recording, and XD012's design enters the Region of Doom.

### E7.9 Phase 7 — The Assembly (Debate)

*The Academy auditorium. Every seat full. Clavell at the lectern in his own hair. Team Star on the stage in a line. Harrow in the front row, with a lawyer.*

This phase is not a battle unless it goes wrong. Clavell must rule on the expulsions. The player speaks for Team Star in **three exchanges**. Each is won with evidence: a flag or a Key Item from earlier in the region.

| Exchange | Harrow says | Winning evidence |
| --- | --- | --- |
| 1 | "There is no record of any bullying. I should know. I kept the records." | The deletion log (Raid 5), or Tully, if `cracking`, standing up in the back row |
| 2 | "Team Star extorted and assaulted travellers across the region." | The wrong boots (any Peon beaten in costume), or the unmarked drum from Navi Base |
| 3 | "Even so: they built a weapon." | The First Engine, pink, driven onto the stage by Ortega; or Nascour's brochure |

- **Three wins:** no battle. Clavell rules.
- **Two wins:** Harrow's lawyer objects; Clavell overrules him.
- **Fewer:** Harrow demands that the matter be settled "in the customary manner of this region", and the player must battle him once more, here, in front of the school.

**The reports.** At the end Clavell asks whether anyone wishes to enter the original reports into the record. Everyone looks at Penny.

> **PENNY:** "They've got names in. My friends' names. And what was done."
> **MELA** *(not loud at all)*: "Mine's the first one. Read mine."
> **PENNY:** "Mela—"
> **MELA:** "It's on a wall already. I scrubbed it out nine times. *Read mine.*"
> *(Penny reads one paragraph. The auditorium is absolutely silent. Then Eri stands up. Then Atticus. Then a very small rich kid. Then, in the audience, a first-year in a helmet two sizes too big.)*

> **CLAVELL:** "Team Star. For building unlicensed vehicles, for truancy, and for causing me to purchase a wig, you are sentenced to community service: you will help me run this school properly. The expulsions are void. Mr. Harrow, the International Police are in the foyer. They have been very patient."

### E7.10 Phase 8 — Resolution (extended)

The Last Star choice (base §10.9) is unchanged. These are added.

- **The three.** Brask and Odette leave with Cipher's van. **Tully**, if he stood up: [Let Eri decide]. She looks at him for a long time. **ERI:** "You held a door. That's one. You owe about four hundred. Start with the lunch tables: wipe them, every day, and sit at whichever one's empty." He does.
- **The Applicant,** if he chose Cipher and was brought back: he goes home to Kitakami with a Star badge Atticus made him. It has no squad color. Atticus says that is the point.
- **The Starmobiles.** [Keep them as a club] (the Academy gains a motor club; Ortega is insufferable) / [Strip the links out] (they become five very fast, entirely legal cars) / [Give the designs to Clavell under seal].
- **Nascour** is not caught. He was never going to be. He leaves a card on the lectern.

### E7.11 Rival and Stand-with additions

- **Help:** the rival pulls a core with Giacomo. *Line:* "Why is everyone on this team *nice*? I came to fight delinquents! One of them gave me a sandwich!"
- **Beat-you:** the rival is found in a Base's garage, covered in glitter from one of Ortega's traps, being bandaged by three Star Grunts who are arguing about the right way to do it.
- **Side-with:** the rival is **Boss of Achird Squad**. This is the one region where a successful Turn is optional: the rival was right to join. They leave the squad only to stand next to the player in Phase 6, and go back afterwards.
- **Stand with them:** the player is **Fulu Squad**. Phases 1 to 5 are fought on Star's side against the Academy's hired security; Phase 6 is the same for everyone. See `scripts/10_STAND_WITH_THEM.md` §9; the new line is Penny's: "Fulu's the faintest star in the W. You can't see it from a city. It's still *in* it. I checked."

---

## E8. Aftermath and the Thread

- **The wall at Schedar** has a new section, on the Academy's side of it. Clavell hung the first knot. It is a very old school tie. Under it, in marker: *did not look.*
- **The first-year** eats lunch in the canteen. The helmet is on the table.
- **Clive** is seen once more, at the back of a motor club meeting, saying "radical".
- **Arven** is asked to cater the Academy's staff meetings. He says no. He turns up with sandwiches anyway.
- **Detention** has taken to sleeping in the lost-property box, on top of a pompadour wig.

**The Thread (`docs/GRAND_ARC.md`).** **Data ROM P: "Borrowed"** is the last of nine. It shows that a heart does not have to be forced shut. It can be *asked to lend itself*, by someone lonely enough to say yes. Every earlier ROM was a harder way of doing what five children did by accident.

> **NASCOUR (the card on the lectern; nine words, in a fine hand)**: "The children were never the product. They were the proof."

With nine ROMs, or as many as the run has gathered, the way to the last island is open.

---

## E9. Dialogue Bank

### E9.1 New ambush lines

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Star (Defensive) | "You're from the school, aren't you. You've got *school* written all over you." | "…You didn't laugh. They always laugh." |
| Grunt — Star (New) | "I only joined Tuesday! I don't know the handshake yet! Um. Battle?" | "Was that okay? Did I do it right?" |
| Grunt — Star Mechanic (Oily) | "Mind the paint. It's wet. Everything's wet. We only stopped building it an hour ago." | "It's fine. It needed sanding anyway." |
| Grunt — Cipher Peon in costume (Wrong) | "We are Team Star! We are… delinquent! Give us your lunch money, fellow youth!" | "The briefing said they *talk* like that." |
| Specialist — Star (Bright) | "I did the maths on this match-up. Want to see my working?" | "I forgot to carry the one." |
| Lieutenant — Captain Zeb (Torque) | "Four hundred newton-metres. Say hello." | "…Three-eighty. I'll retune." |
| Lieutenant — Peon Brask (Grinning) | "Hahaha! Remember me? No? *They* do." | "Ha… ha." |
| Lieutenant — Peon Odette (Sweet) | "I never laid a finger on anyone. I only ever *said* things." | "You'll regret that. I'll think of exactly how." |
| Lieutenant — Peon Tully (Mumbling) | "I've got to. They're watching. Sorry. I'm— sorry." | "Good. …Good." |
| Commander — Harrow (Reasonable) | "Let us settle this like sensible people. I'll go first." | "I shall be making a note of your conduct." |
| Associate — Clive (Radical) | "Sup. Let us 'throw down', as I believe it is termed." | "That was… 'sick'? Is that right? It felt right." |
| Liaison — Nascour (Patient) | "Take your time. I have all of it." | "Hm. Noted." |

### E9.2 Cassiopeia's barks

| Moment | Line |
| --- | --- |
| Player lands a super-effective hit | "Called it. I *called* that. It's on page four of the plan." |
| Player's Pokémon faints | "Sorry. Sorry! I don't— this part isn't supposed to feel good." |
| Her Pokémon faints | "Come back. You did the thing. Good. Good job. Sorry." |
| Player heals | "Okay. Yes. I'd have done that too." |
| A Shadow Pokémon disobeys the player | "That's a *link*. That's one of ours, bent. Where did you— who did that to it?" |
| Last Pokémon each | "This is the last line of the speech. I didn't cut this one." |

### E9.3 Group chat (seen on any Star Grunt's phone, by world state)

| Step | Message |
| --- | --- |
| 1 | **neon_moon:** new kid in the 2nd floor toilets again. someone flyer them. gently. |
| 2 | **mela🔥:** WHO PUT GLITTER IN THE FURNACE. **ortega:** it was for science |
| 3 | **atticus:** Forsooth, the school hath sent Letters. **eri:** just say they're expelling us. **atticus:** *Forsooth.* |
| 4 | **giacomo:** guy with the hair came back. third time. didn't ask anything. just looked. **neon_moon:** don't let anyone near the engines tonight. |
| 5 | **neon_moon:** it starts at noon. nobody gets hurt. that's the only rule. **neon_moon:** thank you for sitting with me. |

### E9.4 Civilians by world state

| Step | Line A | Line B |
| --- | --- | --- |
| 1 | "Kids skipping school. In my day we *also* skipped school, but we felt bad." | "My daughter says there's a club that'll sit with anyone. Is that so terrible?" |
| 2 | "Five Bases. Five! Who's paying for the bunting?" | "They've a battle league up there. Better attendance than the Academy's." |
| 3 | "Expulsion notices on every lamp-post. Somebody keeps drawing stars on them." | "I asked a teacher what the kids did wrong. She changed the subject. She's *good* at it." |
| 4 | "There's a recruiter at the gate. Silver hair. Never blinks. I didn't like how he looked at the engines." | "One of those Star kids shook me down on Route 3. Boots were wrong, though. Funny." |
| 5 | "The whole town's on Starfall Street. Bring a chair, they said. It's a *show*, they said." | "…That's not the girl's voice on the speakers anymore." |

### E9.5 Announcer lines for special Pokémon

| Pokémon | On entry |
| --- | --- |
| Any Tuned Pokémon | "It's borrowed. It has to give it back." |
| Any Starmobile | "The engine turns over. The squad cheers." |
| Neon Moon | "Neon Moon is in the system." |
| Old Pal | "Old Pal gets up. He is a good dog." |
| The First Engine | "The shadow tightens. It used to be pink." |
| Overlooked | "The shadow tightens. It is looking at the back of his head." |
| The Cassiopeia Engine | "Five engines turn over at once." |

---

## E10. Flags and Wiring

| Flag | Set by | Read by |
| --- | --- | --- |
| `star.x.attendance` (0–5) | Raids, climax schedule | Regional rules, group chat, civilians |
| `star.x.first-year` (`hopeful`) | *The Flyer* | Phase 6, Phase 7, Aftermath |
| `star.x.clive` (`friend`) | *Clive* | Raid 5, Phase 3 |
| `star.x.arven` (`cook`) | *Sandwiches* | Siege Map, Breather |
| `star.x.penny` (`trusted` / `known`) | *Read Receipts* | Raid 5, Phase 1 |
| `star.x.kieran` (`star` / `cipher`) | *The Applicant* | Siege Map, Phase 2, Phase 6 |
| `star.x.tully` (`cracking`) | *The Old Hallway* | Raid 5, Phase 7, Phase 8 |
| `star.x.reports` (`sealed` / `read`) | Raid 5 | Phase 7 |
| `star.x.engine` (`pulled` / `fired`) | Phase 6 | Aftermath, Region of Doom |
| `cipher.seen.nascour`, `cipher.rom.p` | *Admissions*, Phase 3 | `docs/GRAND_ARC.md` |

**Counts for this file:** 12 named characters (6 new officers, 6 team versions and allies), 10 special Pokémon, 5 special Shadow Pokémon (1 Apex), 8 story events, 3 deepened raids and 2 new raids, an 8-phase Extended Cut ending in a debate, and 5 dialogue tables.
