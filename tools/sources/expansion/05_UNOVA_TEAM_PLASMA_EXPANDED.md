# 05x — UNOVA: TEAM PLASMA — EXPANDED EDITION
### Script: *The Kindest Lie*

> *"Free them, I said, and they wept and let go. Nobody asked me where the freed ones went. Nobody ever asks where."* — Ghetsis

**Extends:** `scripts/05_UNOVA_TEAM_PLASMA.md` (the base script stays valid; this file adds to it)
**Template:** `docs/EXPANSION_DESIGN.md` · **Cross-region arc:** `docs/GRAND_ARC.md`
**Canon note:** Ghetsis, Zinzolin, Colress, the Shadow Triad, the Sages (Rood, Giallo, Gorm, Bronius, Ryoku), N, Anthea, Concordia, Drayden, Hugh and his sister's stolen Purrloin, the frozen city of Opelucid, N's Castle and his childhood room, the Munna of the Dreamyard, Victini under Liberty Garden and the modified Genesect are canon to the games. Aldith, Barret, Schwarz and Weiss are canon to the anime. Snattle is a canon Cipher admin (XD). **The King's Likeness** (a Zoroark made to wear N's face) and the offer of **the Seventh Seat** are *what-if* inventions. As in the base script, N is not a member of Team Plasma. All dialogue is original. Species are my best recall and are marked approximate.

---

## E1. The Wider Scale

The base script is a frigate and a frozen chasm. The Expanded Edition follows the lie outward: from one child on a street corner letting go of a Lillipup, to a region with a wall of ice around it.

### E1.1 The plan at five scales

| Scale | What Plasma is doing | What the player sees | Where it pays off |
| --- | --- | --- | --- |
| 1 **Street** | Giving speeches until people release their Pokémon, then collecting the released ones "for safekeeping" | A crowd, a quiet man with a cane, a child crying, a van | Event *The Speech* |
| 2 **City** | Running Castelia's sewers as a depot; testing Colress's machine on two groups of Pokémon | Empty PC boxes; trainers who cannot say why they did it | Events *The Truth-Seeker*, *The Stolen One*; Raid 2 |
| 3 **Region** | Freezing Opelucid for the Splicers; raising N's old castle to stage a coronation; seizing Liberty Garden | A frost line that moves south on the map each stage | Raids 4 and 5; event *Liberty Garden* |
| 4 **Border** | Closing Unova's five bridges one by one; promising a city to an outside sponsor | Drawbridges up, ferries iced in, a campaign poster for an office that does not exist | Event *The Candidate*; the Siege Map |
| 5 **World** | Fusing Kyurem with a dragon of truth or ideals, and sealing the region so that every Pokémon in it is "liberated" into one man's keeping | The Frigate overhead; snow in summer | Climax Phases 6 and 7 |

### E1.2 World-state track — *The Frost Line*

Stored in `plasma.x.frost` (0–5).

| Step | Name | Regional rule | Civilian mood |
| --- | --- | --- | --- |
| 1 | **Pamphlets** | One speech per city; wild pools gain "released" Pokémon that will not fight back on the first turn | Thoughtful |
| 2 | **Let Go** | The PC holds four fewer Pokémon ("on deposit for liberation"); returned when the step is removed | Guilty |
| 3 | **The Frost Line** | The northern third of the map is under snow: ice hazards, Ice moves +10% for both sides | Cold |
| 4 | **The Bridges** | Two of five bridges are closed; routes across them cost an extra node | Trapped |
| 5 | **The Crown** | Snow everywhere; the climax is scheduled | Waiting for a king |

### E1.3 The bigger secret

The liberation is a lie (base script §3). The Expanded Edition says what kind.

Ghetsis means every word of "Pokémon should be free of trainers". He has simply never said the second half aloud: *and belong to me*. The **Liberation Lock** does not take a Pokémon from its trainer. It waits until the trainer lets go. A released Pokémon has no bond to break, and the Frigate's signal walks straight in. The hold of the Frigate is full of Pokémon whose trainers loved them enough to believe a speech.

The faithful were promised something too. N, the king who left, will return when the ice is complete. Ghetsis has a Zoroark that has been taught to wear his son's face.

And **Snattle** of Cipher has been promised Castelia. He has had the stationery printed.

---

## E2. Expanded Cast

### E2.1 New officers and specialists

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.plasma.gorm` | **Sage Gorm** | Executive (5) | canon (games) | Zealot: keeper of the old creed, posted to the castle | Sigilyph, Gothitelle, Braviary *(approximate)* | Sonorous; quotes speeches he wrote for someone else |
| `sc.plasma.bronius` | **Sage Bronius** | Executive (5) | canon (games) | Technician: master of the Frigate's cannon | **Icebreaker** (Excadrill), Vanilluxe, Magnezone *(approximate)* | Dry, practical, counts shells |
| `sc.plasma.ryoku` | **Sage Ryoku** | Executive (5) | canon (games) | Strategist: holds the desert and the Relic Castle | **Sandking** (Krookodile), Cofagrigus, Darmanitan *(approximate)* | Unhurried; talks about deserts as if they were people |
| `sc.plasma.aldith` | **Aldith** | Commander (4) | canon (anime) | Enforcer: field commander of the collection vans | **Somebody's Purrloin** (Liepard), Scolipede *(approximate)* | Brisk, impatient with doubt |
| `sc.plasma.barret` | **Barret** | Commander (4) | canon (anime) | Technician: runs the signal relays | Magnezone, Swoobat *(approximate)* | Flat; reads out readings |
| `sc.plasma.schwarz-weiss` | **Schwarz and Weiss** | Lieutenant (3) | canon (anime) | Scouts: a pair who finish each other's reports | Accelgor, Escavalier *(approximate)* | One curt, one curter |
| `sc.plasma.snattle` | **Snattle** | Liaison (4) | canon (XD) | Strategist: Cipher's man, candidate for an office Ghetsis invented for him | Lunatone, Solrock, Metagross, Castform *(approximate)* | Pompous, wounded, practising a wave |

### E2.2 Team versions of characters you know

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.plasma.kings-likeness` | **The King's Likeness** | Figurehead | what-if | A Zoroark made to stand on balconies as N, so the faithful will keep faith | None; it is the Pokémon (see E3) | Does not speak. Waves. The wave is slightly wrong. |
| `sc.plasma.boss-on-paper` | **Colress, Boss on Paper** | Executive (5) | canon (games) | Colress with the title of leader, which he regards as a filing convenience | **Proof** (Klinklang), **P2** (Genesect) | Delighted by everything, loyal to nothing but results |
| `sc.plasma.n` | **N** | Ally | canon (games) | The king who left, travelling with a dragon | Zoroark; Reshiram or Zekrom by seed | Fast, soft, hears Pokémon as speech |
| `sc.plasma.anthea-concordia` | **Anthea and Concordia** | Ally | canon (games) | N's foster sisters, who keep the house in Driftveil | None; they heal | Gentle; one speaks of love, the other of peace |
| `sc.plasma.drayden` | **Drayden** | Ally | canon (games) | Mayor of Opelucid, keeper of the Splicers | Haxorus | Gravel and iron; furious with himself |
| `sc.plasma.hugh` | **Hugh** | Ally | canon (games) | A trainer who has been looking for one stolen Purrloin for five years | Unfezant *(approximate)* | Blunt; "I'm about to unleash my rage" |
| `sc.plasma.rival-gray` | **Knight-Errant "Gray"** (the rival) | Lieutenant (3) | what-if | The rival in the old silver-and-white armor, in the Side-with variant | The rival's team plus one Overclocked Pokémon | The rival's archetype, reciting |
| `sc.plasma.player-seventh` | **The Seventh Sage** (the player) | Specialist (2) | what-if | The player on the Inside Man and Stand-with routes, offered the seat that has stood empty since the Sages broke | The player's team | — |

> **Two Plasmas.** The old uniform (white hoods, a knight's tabard) is worn by the faithful, who believe. The new one (black, a pirate's cut) is worn by Ghetsis's crew, who are paid. The player can tell which kind of Grunt they are facing before a word is said.

---

## E3. Special Pokémon — the Overclocked line

**Overclocked** Pokémon have been run through the Colress Machine, which "draws out a Pokémon's full potential" by removing its say in the matter.

**Line rule — *Overclocked*:** an Overclocked Pokémon's first move each time it enters has +1 priority. At the end of its third consecutive turn on the field it overheats: −1 to every stat until it switches out (announced: "The machine has asked too much.").

| ID | Name | Species | Signature trait | Where met | Can the player get it? |
| --- | --- | --- | --- | --- | --- |
| `sv.plasma.regent` | **Regent** | Hydreigon | *Three Mouths*: its moves that hit several targets do full damage to each | Ghetsis's ace | No |
| `sv.plasma.speechwriter` | **The Speechwriter** | Cofagrigus | *Ghostwritten*: the first status move used against it each battle is turned back on the user | Ghetsis | No |
| `sv.plasma.permafrost` | **Permafrost** | Cryogonal | *Never Thaws*: it cannot be burned, and Fire moves against it do not thaw frozen allies | Zinzolin | No |
| `sv.plasma.proof` | **Proof** | Klinklang | *Reproducible*: its stat boosts cannot be removed or copied | Colress | No |
| `sv.plasma.p2` | **P2** | Genesect | *Drive Swap*: its signature attack changes type each turn in a fixed cycle (Fire, Water, Electric, Ice), shown to both sides | Colress's lab; Phase 4 | Yes: if freed in Raid 2 it finds the player after the climax |
| `sv.plasma.likeness` | **The King's Likeness** | Zorua / Zoroark | *Wearing a Crown*: enters looking like its trainer's strongest Pokémon; the first hit against it does nothing and breaks the illusion | Raid 5; Phase 4 | Yes: it goes home with N, or with the player if N is absent |
| `sv.plasma.sandking` | **Sandking** | Krookodile / Dreadodile | *Buried Road*: in a sandstorm it cannot be hit by moves that missed last turn | Sage Ryoku | No |
| `sv.plasma.icebreaker` | **Icebreaker** | Excadrill / Z-Mega Excadrill | *Hull Drill*: its Ground and Steel moves ignore hail and ice hazards and break screens | Sage Bronius | No |
| `sv.plasma.believer` | **Believer** | Conkeldurr / Z-Mega Conkeldurr | *Unshaken*: it cannot be confused or made to flinch while Giallo has more Pokémon left than the player | Sage Giallo | No |
| `sv.plasma.somebodys-purrloin` | **Somebody's Purrloin** | Purrloin / Liepard | *Remembers a Name*: once per battle, if it would attack a Pokémon at full bond with its trainer, it hesitates and loses the turn | Aldith | Returned: it belongs to Hugh's sister |
| `sv.plasma.dreamer` | **Dreamer** | Munna / Musharna | *Dream Mist*: allies that are asleep can still act at half power | The Dreamyard | Yes: it follows whoever stops the kicking |
| `sv.plasma.votive` | **Votive** | Chandelure / Spooky Chandelure | *Candle for the King*: while it burns, its trainer's other Pokémon cannot be forced to switch | The faithful at N's Castle | No |

> Somebody's Purrloin and Dreamer are not Overclocked. Regent is: Ghetsis put his own ace through the machine first, to be certain it would not hurt. It hurt. He continued.

---

## E4. Special Shadow Pokémon

Plasma's method is the **Liberation Lock**; breaking the Relay that holds a Pokémon gives −40 Corruption (Shadow doc §6). A Liberation Lock can only take a Pokémon that has no trainer at that moment.

| ID | Code | Name | Species | Tier | Shadow ability | Shadow moves | Purification key | Where met |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ss.plasma.captive-star` | — | **The Captive Star** | Victini | 2 Bound | Spotlight Sap | Ember of Grief, Cinder Ward | Open the basement door and step out of the way | Event *Liberty Garden* |
| `ss.plasma.oathbreaker` | — | **Oathbreaker** | Cobalion | 3 Gripped | Contract Clause | Umbral Rush, Dusk Brand, Null Pulse | Beat it without any of your Pokémon fainting | Mistralton Cave, world state 3 or higher |
| `ss.plasma.second-sun` | — | **The Second Sun** | Volcarona | 3 Gripped | Overbound | Ember of Grief, Hollow Tide, Gloam Crash | Carry it out of the Relic Castle into daylight | Relic Castle, with Sage Ryoku |
| `ss.plasma.old-guard` | — | **Old Guard** | Haxorus | 3 Gripped | Spotlight Sap | Gloam Crash, Dusk Brand, Weeping Maw | Thaw Opelucid (Raid 4) | Raid 4 |
| `ss.plasma.absolute` | XD008 | **Absolute** | Kyurem / Black Kyurem / White Kyurem | 4 Fallen | Contract Clause | Null Pulse, Heart Eclipse, Empty Crown | Story only: pull the three Splicer wedges | The Giant Chasm, Phase 6 |

**Signature Shadow move — Empty Crown:** 110 power; if the target has any stat boosts, they are taken from it and given to the user. Cost: +6 Corruption. Announced one turn ahead ("The cold reaches for something to wear.").

**Notes**
- **The Captive Star** has been shut under Liberty Garden for two hundred years by people who wanted to keep its power safe. Plasma did not have to lock it up. They only had to move in upstairs. It follows the Legendary Shadow rules.
- **Oathbreaker** swore to protect Pokémon from humans. The Lock has told it that Plasma is doing the same. It is not fully convinced, which is why it can be reached.
- **Old Guard** is Drayden's partner of fifty years. Drayden did not release it. He was frozen in place with the rest of the city, and for one hour had no hand free to hold a Poké Ball. That was enough.
- **Absolute** is Kyurem with N's dragon forced inside it. Which dragon, and so which form, follows the run's seed.

---

## E5. New Story Events

### E5.1 *The Speech* (`xe.unova.speech`) — Street

*Trigger: any town node after Ignition. A small crowd in a square. A tall man in a heavy robe, leaning on a cane, speaking gently.*

> **GHETSIS:** "…and I ask only this. When your Pokémon looks at you tonight, ask yourself: did it *choose* this? Did anyone ask it?"
> **GHETSIS:** "Love that cannot be refused is not love. It is a cage with a kind jailer. Open the door. If it stays, you will know. If it goes, you will have done the one truly generous thing of your life."
> *(Murmurs. A boy of about seven looks at his Lillipup for a long time, and then opens his hands.)*
> **BOY:** "…Go on. You can go, if you want."
> *(The Lillipup does not understand. It sits. The boy is led away by his mother, crying. When the square is empty, a Plasma Grunt with a carrier picks the Lillipup up.)*
> **PLAYER (choice):**
> 1. **[Heckle]** → **"Where do they go?"** **GHETSIS** *(a smile that arrives a moment late)*: "Wherever they wish, child. That is the *point*." *(Heat +5; three people in the crowd keep their Pokémon; `plasma.x.asked-where = true`.)*
> 2. **[Follow the carrier]** → A van, already half full. *(Battle: Grunt. Win: the Lillipup runs home. Rep +4, Intel +3.)*
> 3. **[Listen to the end]** → Nothing changes. One of your own Pokémon looks at you, and then pointedly sits on your foot. Bond +1.
> **GRUNT (defeat):** "It was *released*. Legally it's nobody's. That's the whole trick, that's the— I wasn't supposed to say 'trick'."

### E5.2 *The Dreamyard* (`xe.unova.dreamyard`) — Street

*Trigger: any ruin or factory node. Two Grunts in the new black uniform are kicking a Munna.*

> **GRUNT A:** "Come on! Dream Mist! Cough it up!"
> **GRUNT B:** "The Sage says it makes people *suggestible*. Give us the mist and you can go back to sleep!"
> **PLAYER (choice):** [Step in] → *(Battle: both Grunts.)* / [Wait] → *(A Musharna drifts out of the wall. The yard fills with pink fog. In it, both Grunts see Ghetsis standing over them, saying nothing. They run.)*
> **After:** the Munna follows the player (`sv.plasma.dreamer`). The fog leaves behind a **Dream Mist** item: used once, it lets the player see one hidden thing (the tells in *The Truth-Seeker*, the wrong wave in Raid 5, or a Lost district's effect before choosing a bridge).

### E5.3 *The Truth-Seeker* (`xe.unova.truth-seeker`) — City

*Trigger: any city, Heat 25 or more. A man in a lab coat with a remarkable blue curl of hair falls into step beside the player, already talking.*

> **COLRESS:** "Excuse me! A question, for science. What is it that brings out a Pokémon's power? I have two hypotheses and a great deal of equipment."
> **COLRESS:** "Hypothesis one: the bond between Pokémon and trainer. Sentimental, but the data are stubborn. Hypothesis two: a machine that simply *insists*. Tidier. I'm running both. One group is loved. The other is plugged in."
> **PLAYER (choice):**
> 1. **["The bond."]** → **COLRESS:** "Prove it to me sometime!" `plasma.x.colress = bond`.
> 2. **["The machine, if it works."]** → **COLRESS:** "A pragmatist! We'd get along. Come by the lab." `…= machine`; Raid 2 can be entered by the front door.
> 3. **["Did you ask the Pokémon?"]** → *(He stops walking. It is the first time.)* **COLRESS:** "…No. That is a *variable*. I've left out a *variable*." `…= asked`.
> **COLRESS (leaving):** "I'm the boss of Team Plasma, by the way. On paper. It was easier than arguing. Don't hold it against me, I haven't read the paper."

*In Phase 3, `bond` makes his duel a fair test, `machine` makes him fight to win, and `asked` means he has already switched his machine off.*

### E5.4 *Cold Storage* (`xe.unova.cold-storage`) — City

*Trigger: Driftveil, before Raid 3. A refrigerated warehouse. At the back, six Grunts are huddled around an old man in a robe who is sitting perfectly still.*

> **GRUNT:** "S-s-sage Zinzolin, c-can we *please*—"
> **ZINZOLIN:** "No. Here I can feel the edges of myself. Out there everything is lukewarm and I might be anyone."
> **ZINZOLIN** *(to the player)*: "You. You're warm. I can tell from here. It's a kind of rudeness."
> **PLAYER (choice):** ["Why follow him?"] → **ZINZOLIN:** "Because he is the only man I have met who is colder than this room. I wanted to see how far down it went." / [Battle] → *(Battle: Zinzolin with **Permafrost**, in cold storage: Ice moves +10%, and non-Ice Pokémon lose 1/16 HP every third turn.)* / [Give the Grunts your coat] → They give you a **Frigate duty roster** (Intel +5) and one of them, later, opens a hatch in Raid 1.
> **ZINZOLIN (defeat):** "Hm. Warmer. I resent it. Go away."

### E5.5 *The Candidate* (`xe.unova.candidate`) — Border

*Trigger: Castelia, world state 3 or higher. A podium on a pier. Bunting. Nobody is listening except four Grunts who have been told to clap.*

> **SNATTLE:** "…and so I say to the people of *Liberated Castelia*: a firm hand! Clean streets! Every Pokémon in its proper place, which is to say, *not yours*!"
> *(One clap. A second Grunt nudges the first.)*
> **SNATTLE:** "You there! Voter! A badge?" *(It reads SNATTLE FOR GOVERNOR. Under that, smaller: BY APPOINTMENT.)*
> **PLAYER:** "Appointed by who?"
> **SNATTLE:** "By the gentleman with the cane, in exchange for certain *technical assistance* from my organization. And once the region is sealed, nobody will be in a position to contest the count!"
> **PLAYER (choice):** [Take a badge] → Key Item **Campaign Badge**: one Grunt checkpoint in the climax waves you through. / [Debate him] → A three-question quiz on what he has just said; he contradicts himself each time. Win: Rep +6, and the four Grunts stop clapping. / [Challenge him] → *(Battle. Trait: **Incumbent**: his first Pokémon cannot be forced out and takes 20% less damage until it has attacked twice; announced.)*
> **SNATTLE (defeat):** "This will be reflected in the *polling*!"

*Writes: `cipher.seen.snattle`.*

### E5.6 *The Stolen One* (`xe.unova.stolen-one`) — Street

*Trigger: any time after the first ambush by Aldith. A spiky-haired trainer is going through a Grunt's Poké Balls one at a time, in the street.*

> **HUGH:** "Not this one. Not this one. Five years! I gave her that Purrloin for her birthday and one of *you* took it out of her arms!"
> **GRUNT:** "It'd be a Liepard by now, kid. It wouldn't even know her."
> **HUGH:** "…Say that again."
> **PLAYER (choice):** [Hold him back] → **HUGH:** "I'm about to unleash my rage, and you're *in the way*." *(He breathes. He lets the Grunt go. Rep +2.)* / [Help him search] → Intel +4: Commander Aldith's Liepard has a notch in its left ear. So did the Purrloin. `plasma.x.notch = true`. / [Tell him the Grunt's right] → He does not answer. He is in Phase 2 anyway.

*With `plasma.x.notch`, the player can call out in Aldith's battle. Somebody's Purrloin stops, mid-pounce.*

### E5.7 *The King's Room* (`xe.unova.kings-room`) — Region

*Trigger: the ruins near the League, before Raid 5. A half-buried doorway. Inside, untouched: a child's room. A toy train. A basketball. A music box.*

> **CONCORDIA:** "He was kept here. Only Pokémon that had been hurt by people were allowed in to see him. He grew up believing that was all people did."
> **ANTHEA:** "Our father called it an education."
> *(The music box is playing. Someone is sitting on the floor beside it, in a familiar green cap, back to the door.)*
> **PLAYER (choice):** [Speak to him] → He turns. The face is right. The eyes are a fox's. *(The King's Likeness bolts through a gap in the wall.)* `plasma.x.likeness-seen = true`. / [Wind the music box] → The figure's shoulders drop. For a moment it is only a Zoroark, listening. Then it is gone. / [Leave quietly] → No change.
> **ANTHEA:** "It was his friend, once. Father took it when N left. It has been made to *be* him ever since. I think it has started to forget which it is."

### E5.8 *Liberty Garden* (`xe.unova.liberty-garden`) — Region

*Trigger: Castelia's ferry, world state 2 or higher. A small island with a lighthouse. Grunts in the old white uniform, the faithful kind, standing guard.*

> **FAITHFUL GRUNT:** "There's a Pokémon under the lighthouse. Shut in for two hundred years. We came to *free* it. Then the order came down: hold the island, don't open the door."
> **FAITHFUL GRUNT:** "That's not what I joined for."
> **PLAYER (choice):** [Open the door] → The Grunt stands aside. *(In the basement: a small room, a small bed, a plate. `ss.plasma.captive-star`, Tier 2. It attacks once, sees the open door behind the player, and stops.)* It flies three circles over the harbor. Every Pokémon in the party gains the mark **Victory Star** (accuracy +5% for the region). / [Report the Grunt] → He is replaced by the new uniform. The island becomes a battle node. / ["Then quit."] → He takes off the hood. `plasma.x.faithful-doubt = +1`.

---

## E6. Raids, Expanded

### E6.1 Raid 1 — "The Plasma Frigate", deeper

**New phase order:** Gangway → **The Gun Deck** *(new)* → Hold → **The Liberated** *(new)* → Bridge.

**The Gun Deck.** The Frigate's ice cannon, and the man who feeds it.

> **SAGE BRONIUS:** "Forty shells. Each one freezes a city block. I've been told how many blocks are in Opelucid. I've done the division. It comes out even. That bothers me more than it should."
> *(Battle: Bronius with **Icebreaker**. Each of his turns the cannon charges; on the fourth it fires across the field: both sides' active Pokémon take ice damage and −1 Speed; announced.)*
> **BRONIUS (defeat):** "Thirty-nine shells. I'll report a misfire."

**The Liberated.** The lower hold. Rows of carriers, each with a tag: *RELEASED — ASPERTIA. RELEASED — NIMBASA. RELEASED — ACCUMULA.* Hundreds. They are all facing the same wall, where the Relay hums.

> **GRUNT (hold guard, old uniform):** "I was told this was a shelter. I've been telling *them* it's a shelter. They don't look sheltered."
> **PLAYER (choice):** [Break the Relay] → Every Pokémon in the hold turns round at once. The primary and Secondary A complete together; the alarm trips. / [Open the carriers by hand] → Slower (costs 3 turns of the raid timer), no alarm, and the guard helps: `plasma.x.faithful-doubt +1`.

**Zinzolin, extended:**

> **ZINZOLIN:** "He told you he wanted them free. He told *us* he wanted the world. He told himself something else again. I've stopped asking which is the lie. With him it's a matter of *temperature*."

### E6.2 Raid 2 — "Colress's Laboratory", deeper

**New phase order:** Lobby → Wards → **The Control Group** *(new)* → Incubation → Core.

**The Control Group.** Two rooms, a window between them. On one side, Pokémon wired to the machine: fast, glassy, shaking. On the other, Pokémon that Colress's assistants have simply been told to look after. A chart on the wall. The two lines are almost level. The second one is slightly higher.

> **PLASMA RESEARCHER:** "He's seen the chart. He says the sample's too small. He's said that for four months. He keeps making the sample bigger and it keeps *saying the same thing*."
> **PLAYER (choice):** [Switch off the machine room] → Twelve Overclocked Pokémon stop shaking. Plasma's Overclocked ambushers are one level weaker for the region. / [Take the chart] → Key Item **Colress's Chart**: shown to him in Phase 3, it ends his duel at once.

**P2.** In the Core, the thing in the incubator opens one red eye.

> **COLRESS:** "Three hundred million years old, and I've given it a cannon! Isn't it marvellous? It doesn't think so. It keeps trying to fold itself back into a rock."
> **COLRESS (defeat, extended):** "Fascinating! You won with the loved ones. I had rather hoped you would. It's very inconvenient for the grant."

### E6.3 Raid 3 — "The House in Driftveil", deeper

**New phase order:** The Yard → **The Kitchen** *(new)* → The Stair → The Shadow Triad.

**The Kitchen.** Anthea and Concordia are making soup for forty. The house is full of people in old white hoods who left, and Pokémon that nobody claimed.

> **CONCORDIA:** "They come here when they understand what they did. We don't ask them to say it. We give them something to carry."
> **ANTHEA:** "That one released her Herdier at a speech. She comes every day to see if it's turned up. It hasn't. She washes the dishes."
> **PLAYER (choice):** [Carry something] → *(One rest node.)* Heal to full; Rep +5; the house's defenders have +1 Pokémon each in the raid. / [Ask about N] → **ANTHEA:** "He writes. He never says where from. The letters smell of smoke or of lightning."

**The Shadow Triad, extended:**

> **SHADOW (one):** "He found us when we were nothing."
> **SHADOW (two):** "We do not believe his speeches."
> **SHADOW (three):** "We believe that he found us."
> **SHADOW TRIAD (defeat):** "…We will tell him the house stands. He will not be angry. He is never angry. It is worse."

### E6.4 Raid 4 — "Opelucid Under Ice" *(new)*

**Scale:** Region. **Offered:** world state 3 or higher, by a messenger Braviary carrying a frozen letter.
**Offer (the letter, in a hard square hand):** *"They want the Splicers. I have refused twice. The third answer will be the cannon. — Drayden."*
**PR:** `pr.unova.opelucid-ice` — 4 areas: The Frozen Gate → Ice Streets → The Gym Roof → The Vault. **Security:** sliding ice (each step carries the player to the next wall), ice spikes that block and unblock on a timer, townspeople frozen mid-stride who must not be struck.
**Objectives:** *Primary:* keep the DNA Splicers out of Plasma's hands. *Secondary A:* free Old Guard. *Secondary B:* defeat Sage Gorm. *Secondary C:* thaw the square.

**Phases**

1. **The Frozen Gate.** The city is a sculpture of itself. A child is frozen reaching for a balloon. The balloon is frozen too.
2. **Ice Streets.** A sliding puzzle with battles at three of its corners. Schwarz and Weiss hold the last.
   > **SCHWARZ:** "Target sighted."
   > **WEISS:** "Sighted."
   > **SCHWARZ:** "Engaging."
   > **WEISS:** "…You always get to say 'engaging'."
3. **The Gym Roof.** Drayden is frozen to the hips, arms free, still giving orders to nobody. **Old Guard** (`ss.plasma.old-guard`) circles above him, bound, and does not know him.
   > **DRAYDEN:** "Fifty years I've had him. I let go of the Ball for one hour. *One.* I couldn't feel my hands."
   > *(Battle: Old Guard, Tier 3. Drayden shouts its old commands during the fight; each one it almost obeys lowers its Corruption by 5.)*
   > **DRAYDEN (after):** "There you are, you old fool. …Not you. Him. Well. Both."
4. **The Vault.** Sage Gorm, reading aloud.
   > **SAGE GORM:** "'Liberation is the gift that asks nothing.' I wrote that line. He delivered it better. That is the difference between a sage and a king, and I have made my peace with which I am."
   > *(Battle: Gorm. Executive Ability: **Scripture**: at the start of the battle he names one move category, physical, special or status; the player's moves of that kind have −1 priority this battle; announced.)*
   > **SAGE GORM (defeat):** "The words were good. I maintain that. It was only ever the *use* of them."

**Results (Lever: *The Splicers*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The Splicers are safe; the city thaws; Old Guard is home | **One wedge short:** Absolute has two Splicer wedges, not three, in Phase 6; Drayden holds a bridge | −3 |
| **Success** | The Splicers are safe | Absolute enters Phase 6 one tier lower | −2 |
| **Partial** | Plasma gets one Splicer of the pair | No change | −1 |
| **Failure** | Plasma takes the Splicers; the cannon fires again | **Deep frost:** hail starts one tier thicker in Phase 4 | +2 |
| **Declined** | Opelucid stays frozen | Deep frost; the Frost Line moves one stage south | +1 |

**Failure consequences:** **C9 (Gym lockdown), C6 (Hostage: Drayden), C11.**

### E6.5 Raid 5 — "The Coronation" *(new)*

**Scale:** Region. **Offered:** after `xe.unova.kings-room`, or at world state 4.
**Offer (N, in person, for the first time; a dragon's shadow passes over as he speaks):** *"There's a boy on a balcony tonight who looks like me. Thousands of people are going to kneel. I can hear him from here. He's saying, over and over, in a voice only Pokémon use: 'I want to go home.'"*
**PR:** `pr.unova.plasma-castle` — 4 areas: The Rising Stair → The Hall of Sages → The King's Room → The Balcony. **Security:** the castle is still rising out of the ground (the map shifts a room every 4 turns), faithful crowds who are not enemies and must be passed without a battle, Sage wards on six doors.
**Objectives:** *Primary:* stop the coronation. *Secondary A:* free the Likeness. *Secondary B:* show the faithful the truth without a riot. *Secondary C:* defeat Sage Ryoku.

**Phases**

1. **The Rising Stair.** Stone still wet from the earth. Old-uniform Grunts line the steps, holding candles. With `plasma.x.faithful-doubt` at 2 or more, one in three steps aside unasked.
   > **FAITHFUL GRUNT:** "He's back. They said he's back. …You don't look glad. Why don't you look glad?"
2. **The Hall of Sages.** Seven chairs. Six have dust on them. The seventh has been polished.
   > **SAGE RYOKU:** "The desert keeps everything and judges nothing. I have tried to be the desert. It turns out a man gets *thirsty*."
   > *(Battle: Ryoku with **Sandking** and, if it was not freed, **the Second Sun**. Sandstorm.)*
   > **SAGE RYOKU (defeat):** "The seventh chair is for you, if you want it. He said so. I would not sit in it. It is the only one he has ever dusted himself."
3. **The King's Room.** The music box has been moved to the balcony door, to keep the Likeness calm.
4. **The Balcony.** Ten thousand candles below. Ghetsis at the Likeness's shoulder, one hand on its back like a ventriloquist.
   > **GHETSIS** *(to the crowd)*: "Your king has returned! He has seen the world of men and judged it! Kneel, and be free!"
   > *(The Likeness raises a hand. The wave is slightly wrong.)*
   > **PLAYER (choice):**
   > - **[Strike the Likeness]** → The illusion breaks in front of everyone. Screaming. Secondary B fails; the faithful scatter, and some of them fight.
   > - **[Wind the music box]** → *(Needs `plasma.x.likeness-seen` or Dream Mist.)* The tune carries. The figure on the balcony turns toward it, and its face runs like wet paint, and there is a Zoroark standing in a green cap, listening. The crowd is silent. Then, from the back, one voice: *"…Where do they go?"* Then another.
   > - **[Call N]** → *(Needs Raid 3 Success or better.)* A dragon lands on the parapet. The real one steps down. **N:** "Father. Let him go. He's said it eleven times while you were talking."
   > **GHETSIS** *(any outcome; the smile does not move)*: "A setback of staging. The *weather* is unaffected."

**Results (Lever: *The Faithful*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | No riot; the Likeness free; the faithful walk out | **A movement ends:** every old-uniform Grunt is gone from the climax (Phase 2 −1 battle, Phase 4 −1 guard) | −3 |
| **Success** | The coronation is stopped | Phase 2 −1 battle | −2 |
| **Partial** | Stopped, with a riot | No change | −1 |
| **Failure** | The king is crowned | **A king in the north:** the Likeness fights in Phase 4; faithful Grunts have +1 Pokémon | +2 |
| **Declined** | The king is crowned | A king in the north | +1 |

**Failure consequences:** **C8 (Reputation fall), C7 (Occupation), C11.**

---

## E7. The Climax — Extended Cut: "The Long Winter"

Checkpoints are after Phase 2 and at the Breather.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | Broadcast and Choice | — | base §10.1–10.3 | 0 |
| 0b | **The Five Bridges** | Siege Map | new | 0 |
| 1 | **The Frost Line** | Blackout | new | 2–3 |
| 2 | The Approach | Gauntlet | base Phase 1, extended | 4–6 |
| 3 | The Sage and the Scientist | Duels | base Phase 2, extended | 2–4 |
| — | **Breather** | Rest | new | 0 |
| 4 | The Frost Relays | Set piece | base Phase 3, extended | 2–4 |
| 5 | Ghetsis | Boss | base Phase 4, extended | 1 |
| 6 | **The Crown: Absolute** | Colossus | new | 1 |
| 7 | **The Thaw** | Convoy | new, optional | 2–3 |
| 8 | Resolution | — | base §10.9, extended | 0 |

### E7.1 Phase 0b — The Five Bridges (Siege Map)

Unova is held together by five bridges. Ghetsis is closing them.

| Bridge | Held if… | If Lost |
| --- | --- | --- |
| **Skyarrow** (to Castelia) | Snattle was beaten, or the debate was won | The Last Rest shop sells at +25% |
| **Driftveil Drawbridge** | Raid 3 Success or better | Anthea and Concordia cannot reach the Breather (heal 35%) |
| **Tubeline** (to Opelucid) | Raid 4 Success or better (Drayden) | Hail starts one tier thicker in Phase 4 |
| **Village Bridge** | Hugh is still searching (*The Stolen One*, any choice but the last) | Aldith's vans reach the Chasm: +1 battle in Phase 2 |
| **Marvelous Bridge** | Raid 5 Success or better (the faithful walked out across it) | The news of a king reaches the next region: its opening world state is +1 |

> **DRAYDEN** *(on the Tubeline, ice still in his beard)*: "I'm a mayor. I can't leave my city. So I've brought as much of it as would fit on a bridge."

### E7.2 Phase 1 — The Frost Line (Blackout)

The player crosses the line where summer stops. **Condition — *Deep Freeze*:** at the start of each turn one of the active Pokémon's moves, chosen at random and shown to its trainer, is frozen and cannot be picked; the same for the foe. It ends at the Chasm's rim, or at once if **Dreamer** is with the player ("Dreamer's mist keeps the cold off.").

Barret is running the last signal relay before the Chasm.

> **BARRET:** "Signal strength ninety-four. Released Pokémon within range: four thousand one hundred. Trainers within range: one. You're a rounding error."
> **BARRET (defeat):** "Signal strength… zero. That's not rounding."

### E7.3 Phase 2 — The Approach (extended)

| Area | Trainer | Notes |
| --- | --- | --- |
| Chasm edge | Plasma Grunts ×2 | base |
| **The Van Line** | Aldith with **Somebody's Purrloin** | With `plasma.x.notch` the Liepard can be called off |
| Ice bridge | Plasma Researchers ×2 | base; their Pokémon are Overclocked |
| Frigate deck | Giallo with **Believer** | Trait: **Believer's Fist** |
| Frigate deck | Rood | Trait: **Sage's Command** |
| **Gun Deck** | Bronius with **Icebreaker** | Only if he was not beaten in Raid 1 |
| Bridge | Shadow Triad | Trait: **Triple Shade** |

> **HUGH** *(arriving at a run, if the Village Bridge is Held)*: "That's her. The ear. *That's her.*"
> *(If the player calls the name Hugh shouts, the Liepard stops. It looks at Aldith. It looks at Hugh. It walks, with enormous dignity, to stand behind him.)*
> **ALDITH:** "It's a *Pokémon*. It doesn't—" **HUGH:** "Five years. It *does*."
> **ROOD (extended):** "I wrote to the house in Driftveil last week. I did not send it. A sage should not need to be *forgiven* by girls who make soup."
> **ROOD (defeat):** "…Perhaps I'll send it."

### E7.4 Phase 3 — The Sage and the Scientist (extended)

**Duel 1 — Zinzolin** (base).

**Duel 2 — Colress** (base), shaped by `plasma.x.colress`:
- `bond`: he switches the machine off for a fair test. His Pokémon lose *Overclocked* and fight at full bond instead.
- `machine`: he fights to win, with **Proof** and **P2** both Overclocked.
- `asked`: no battle. **COLRESS:** "I asked them. It took a translator and three weeks. The answer was 'no'. All of them. So I've switched it off, and I'd like to watch what you do next, if that's all right. For science."
- **Colress's Chart** ends the duel at any point: "Oh, you *brought* it. Yes. Yes, I can't keep saying the sample's too small."

**Duel 3 — Snattle** *(new; only if he was not beaten).* He has commandeered a lifeboat as a campaign office.

> **SNATTLE:** "As governor-designate I declare this an unlawful assembly!"
> *(Battle, with **Incumbent**.)*
> **SNATTLE (defeat):** "I *concede*. Under protest. Take the disc. It has my manifesto on it. Also some schematics."

*Reward:* **Data ROM U: "Open Hand"**.

**Duel 4 — conditional:** Gorm and Ryoku together, if neither was beaten in Raids 4 and 5.

### E7.5 Breather

A campfire in the lee of the ice wall. The house in Driftveil has come north.

> **ANTHEA:** "Sit. Let me see them." *(She touches each Poké Ball once.)*
> **CONCORDIA:** "We could never stop him. We could only mend what he sent back. So we're going to do that, right up to the end."

Heal 50% (35% if the Drawbridge is Lost), revive one Pokémon, checkpoint.

### E7.6 Phase 4 — The Frost Relays (extended)

The base set piece (Frost Relays, thickening hail) with these additions.

- **The Liberated.** Each relay is guarded by a ring of released Pokémon bound to it. They are Tier 2 Shadows. They do not have to be beaten: breaking a relay frees its ring. If the Raid 1 hold was emptied, each ring is half the size.
- **Someone comes back.** At the second relay a woman in an old white hood runs onto the ice shouting a name. One Herdier in the ring turns round. *(If the player carried something in the Kitchen, this relay's ring breaks without a battle.)*
- **The Likeness,** if it was crowned, fights at the last relay as N, with *Wearing a Crown*.
- **P2,** if Raid 2 was Failed, guards one relay.

**New PA lines** *(Ghetsis, on the Frigate's speakers, to the whole Chasm)*:

> "One relay. My friends, do not be troubled. A liberator expects resistance. It is how he knows he is right."
> "Two. …You, on the ice. You asked me a question once, in a square. I've thought of the answer. They go to *me*."
> "Three. Zinzolin. Colress. Anyone. …I see. Then I shall do it myself, as I have done everything."

### E7.7 Phase 5 — Ghetsis (extended)

The base fight (§10.7) with **Regent** and **the Speechwriter**. The base stage *Fusion* is moved out of this fight and becomes Phase 6.

**New boss stage — *The Second Half*** (at 50% ace HP): Ghetsis stops performing. His voice does not change; what he says does. Regent's *Overclocked* timer resets, and the overheating is passed to the player's active Pokémon instead (announced), once.

> **GHETSIS (opening, extended):** "Shall I tell you what I've learned from twenty years of speeches? People will give up anything, *anything*, if you tell them it is for the sake of the thing itself."
> **GHETSIS:** "'It would be happier without you.' Six words. I have emptied towns with them."
> **GHETSIS (The Second Half):** "Free. Yes. Free of *you*. Free of ten thousand soft-hearted amateurs. One will, one hand, one winter. I raised a boy to say the first half so sweetly that nobody would hear me finish the sentence."
> **GHETSIS (if `plasma.x.asked-where`):** "And *you* asked where. In front of people. I had the square cleared afterwards. I should have had it salted."
> **GHETSIS (defeat, extended):** "Beaten. By a *pet owner*." *(He lifts the cane. It is not a cane.)* "No matter. I do not need to defeat you. I need only to make it cold."

### E7.8 Phase 6 — The Crown: Absolute (Colossus)

*The cane splits into two wedges of grey metal and a third rises from the ice. Behind Ghetsis, something enormous and hollow lifts its head, and a second shape, fire-white or thunder-black, is dragged screaming into its chest.*

**Format.** **Absolute** (`ss.plasma.absolute`, XD008) is a Colossus held together by **three Splicer wedges**, each a shield bar. It cannot be knocked out while a wedge holds.

| Wedge | While it stands | When it is pulled |
| --- | --- | --- |
| **The First Half** | The absorbed dragon's signature move is used every third turn (announced) | The dragon inside starts to fight Kyurem: Absolute loses a turn in three |
| **The Second Half** | Empty Crown steals boosts | Empty Crown only removes them |
| **The Seal** | Hail at maximum; non-Ice Pokémon lose 1/16 HP a turn | The hail stops |

**Timer:** 12 turns. **Adjustments:** a Raid 4 Triumph removes one wedge at the start; N, if present, speaks to the dragon inside and holds one wedge loose for three turns; Drayden and Old Guard take one hit meant for the player; the rival (Help) pulls at a wedge beside the player.

> **GHETSIS:** "Freeze them. Not the Pokémon. The *child*. Freeze the child solid and let the Pokémon watch."
> *(Absolute turns its head toward the player, not the party. This is announced. The next attack targets the trainer: it is taken by whichever of the player's Pokémon has the highest bond, without being ordered to.)*
> **N** *(landing hard, or arriving on foot if he has no dragon left to ride)*: "I can hear them both. The one inside is saying the same thing my friend said on the balcony. Father, they *all* say it. Everything you've ever held has said it."
> **GHETSIS:** "You were *built* to hear them! I built you! And you used it to *listen*!"

**When the last wedge is pulled:** the two dragons come apart like a breath in cold air. Kyurem stands alone: grey, thin, empty, and for the first time not hungry.

**If the timer runs out:** the Seal completes. The Chasm closes over with ice. The climax is still won if Ghetsis was beaten, but XD008 enters the Region of Doom and Unova's world state stays at 5 for the Aftermath.

### E7.9 Phase 7 — The Thaw (Convoy, optional)

*Available if any Pokémon are still in the Frigate's hold.* The Frigate lifts off the ice with Ghetsis aboard and four thousand carriers below decks.

**Format:** a Convoy of three battles on the moving ship as it loses height (two if Raid 1 was a Triumph): the deck crew, the hold Relay's last guard, then the bridge.

> *(On the bridge: Ghetsis in the captain's chair, not moving. The Shadow Triad standing in front of him.)*
> **SHADOW (one):** "He does not hear us now."
> **SHADOW (two):** "He was beaten by something he said did not exist."
> **SHADOW (three):** "We will take him somewhere quiet. You will not follow. But first you may have the ship."
> *(Battle: the Shadow Triad, if the player insists. Otherwise they are gone between one frame and the next, and the chair is empty.)*

Win or walk: the Relay goes dark and the Frigate comes down gently on the snow, cargo doors open.

### E7.10 Phase 8 — Resolution (extended)

The Splicer choice (base §10.9) is unchanged. There is now a second question, and it is the one from the square.

**Where do they go?** Four thousand released Pokémon are standing on the ice.

1. **[Send out the lists]** — Names and towns from the carrier tags, read on every radio in Unova. *Effects:* over the next two regions, trainers arrive to find theirs. Not all of them. Reputation +20.
2. **[Let them choose]** — The doors stay open. Some walk south toward towns. Some walk into the Chasm with Kyurem. Some stay with the house in Driftveil. *Effects:* a new wild pool, "the Unclaimed", in Unova and the next region: they join without a battle if offered a Berry.
3. **[Ask N]** — He listens to each one. It takes him a week and he does not sleep. *Effects:* as option 1, with nobody mismatched; N is absent from any later event.

> **THE BOY FROM THE SQUARE** *(on the ice, older than seven now by one very long season)*: "…You sat down. I said you could go, and you just *sat down*, and I thought you didn't understand." *(The Lillipup, a Herdier now, sits down.)* "…Oh. You understood fine."

### E7.11 Rival and Stand-with additions

- **Help:** the rival pulls a wedge. *Line:* "It's cold, it's heavy and it's attached to a *god*. Next time *you* take the wedge and I'll do the talking."
- **Beat-you:** the rival is found frozen to a Relay, shielding one of the released ring with their coat.
- **Side-with:** the rival is **Knight-Errant "Gray"**, in the old armor: they believed the speech. A successful Turn is not an argument. The player hands them a carrier tag with a town on it and says nothing.
- **Stand with them:** the player is **the Seventh Sage**. In Phase 6 the third wedge is in the player's hand. See `scripts/10_STAND_WITH_THEM.md` §5; the new line is Ghetsis's: "The seventh seat. I dusted it myself. Do you know how long it has been since I did a thing with my own hands that was not a lie?"

---

## E8. Aftermath and the Thread

- **The house in Driftveil** needs a second kitchen.
- **Colress** publishes. The paper is titled *On the Insufficiency of Insistence*. It has one co-author, listed as "the control group".
- **The Likeness,** if freed, is seen with N at the edge of every later Unova scene: one of them is always a few steps behind, and it is never clear which.
- **Zinzolin** is found in the cold storage, alone. He says it is exactly cold enough. He is, for once, not being bitter.
- **The Sages** are collected one by one by a detective in a long coat who files very short reports.

**The Thread (`docs/GRAND_ARC.md`).** **Data ROM U: "Open Hand"** explains the Liberation Lock: it does not break a bond, it waits for one to be let go. Cipher wants that more than any of the others. A lock that needs force can be fought. A lock that needs only a persuasive speech scales.

> **SNATTLE (form letter, unsigned):** "Dear Constituent. Owing to circumstances, the office of Governor has been relocated. Please direct all correspondence to Lumiose, care of the lady with the television programme. She has *much* better lighting."

---

## E9. Dialogue Bank

### E9.1 New ambush lines

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Faithful (Earnest) | "I don't want to battle. Battling is what we're *against*. I've been told to do it anyway." | "I feel better and worse." |
| Grunt — Crew (Paid) | "Nothing personal. He pays by the carrier." | "I'm putting in for hazard." |
| Grunt — Van Driver (Tired) | "Released Pokémon are lost property. I'm lost property *services*." | "…Could you not tell the kid from the square you saw me?" |
| Grunt — Candle Bearer (Hushed) | "The king is coming back. Please don't make noise. He might hear." | "He didn't hear. I don't think anyone's there." |
| Specialist — Plasma Researcher (Twitchy) | "It's Overclocked. It's fine. It's *fine*. Don't look at the shaking." | "I'm unplugging it. I don't care what the chart says." |
| Lieutenant — Schwarz and Weiss (Curt) | "Engaging." / "…I wanted to say it." | "Disengaging." / "Fine. You can have that one." |
| Commander — Aldith (Brisk) | "Collection quota's short. You'll do." | "Write it off." |
| Commander — Barret (Flat) | "Reading: one hostile. Reading: about to be zero." | "Reading: error." |
| Executive — Sage Gorm (Sonorous) | "'The hand that holds must first be opened.' I wrote that. Open yours." | "It scanned better on the page." |
| Executive — Sage Bronius (Dry) | "One shell or one battle. The battle's cheaper." | "Marginally." |
| Executive — Sage Ryoku (Unhurried) | "Sand has all the time there is. Shall we?" | "Even the desert moves, in the end." |
| Liaison — Snattle (Pompous) | "Can I count on your vote? No? Then I shall count on your *defeat*!" | "A recount! I *demand* a recount!" |

### E9.2 Ghetsis's barks

| Moment | Line |
| --- | --- |
| Player lands a super-effective hit | "Well taught. By whom? Nobody. Remarkable what they pick up, running loose." |
| Player's Pokémon faints | "There. It suffers for you. I did say." |
| His Pokémon faints | "Replace it." |
| Player heals | "You bandage it so tenderly. And then you send it back out. I never understood why *I* was the villain." |
| A Shadow Pokémon disobeys the player | "Ah, one of mine. Did someone let go of it? Someone always does." |
| Last Pokémon each | "Now. No audience. Shall I tell you what I really think of them?" |

### E9.3 Speeches (heard in squares, by world state)

| Step | Ghetsis, to the crowd |
| --- | --- |
| 1 | "I ask only that you *consider* it." |
| 2 | "Your neighbor has already let go. Is your love smaller than hers?" |
| 3 | "The cold is not a punishment. It is the world holding its breath for what comes next." |
| 4 | "The bridges are raised for your protection. A liberated land must not be *re-infected*." |
| 5 | "Your king is coming. Kneel now and he will know you were faithful before it was easy." |

### E9.4 Civilians by world state

| Step | Line A | Line B |
| --- | --- | --- |
| 1 | "He made some good points. I didn't like that he made good points." | "I looked at my Minccino all evening. She just wanted her tea." |
| 2 | "I let him go. I thought I was being brave. The house is so quiet." | "My PC box is half empty and the screen says 'on deposit'. I never deposited anything." |
| 3 | "Snow in July. They say it's the dragon. They say a lot." | "The ones who released theirs keep walking out to the fields at night. Just standing there." |
| 4 | "Bridge is up. Been up three days. My mother's on the other side." | "There's a man running for governor. Of what? Who's *voting*?" |
| 5 | "They say the king's back. My husband's gone north with a candle. He doesn't even *like* candles." | "…Where do they go? Did anyone ever find out where they go?" |

### E9.5 Announcer lines for special Pokémon

| Pokémon | On entry |
| --- | --- |
| Any Overclocked Pokémon | "The machine insists. It moves first." |
| Regent | "Regent's three heads turn as one." |
| The King's Likeness | "A boy in a green cap steps forward. The wave is slightly wrong." |
| Somebody's Purrloin | "It has a notch in its left ear." |
| P2 | "P2 cycles its drive: next, Fire." |
| Old Guard | "The shadow tightens. It does not know the man shouting its name." |
| Absolute | "The cold reaches for something to wear." |

---

## E10. Flags and Wiring

| Flag | Set by | Read by |
| --- | --- | --- |
| `plasma.x.frost` (0–5) | Raids, climax schedule | Regional rules, speeches, civilians |
| `plasma.x.asked-where` | *The Speech* | Phase 4, Phase 5 |
| `plasma.x.colress` (`bond` / `machine` / `asked`) | *The Truth-Seeker* | Raid 2, Phase 3 |
| `plasma.x.notch` | *The Stolen One* | Phase 2 |
| `plasma.x.likeness-seen` | *The King's Room* | Raid 5 |
| `plasma.x.faithful-doubt` (0–3) | *Liberty Garden*, Raids 1 and 5 | Raid 5, Phase 2 |
| `plasma.x.kyurem` (`freed` / `sealed-in`) | Phase 6 | Aftermath, Region of Doom |
| `plasma.x.where` (`lists` / `choose` / `n`) | Phase 8 | Later regions |
| `cipher.seen.snattle`, `cipher.rom.u` | *The Candidate*, Phase 3 | `docs/GRAND_ARC.md` |

**Counts for this file:** 15 named characters (7 new officers, 8 team versions and allies), 12 special Pokémon, 5 special Shadow Pokémon (1 Apex), 8 story events, 3 deepened raids and 2 new raids, an 8-phase Extended Cut, and 5 dialogue tables.
