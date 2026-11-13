# 00x — ROAMING CAST: THE TRIO, TEAM SNAG'EM AND CIPHER — EXPANDED EDITION
### Script: *The Long Way Round*

> *"Every region we've been thrown out of had the same crates on the dock. Same stencil. I ain't sayin' I *noticed*. I'm sayin' I got eyes."* — Meowth

**Extends:** `scripts/00_ROAMING_CAST.md` (the base script stays valid; this file adds to it)
**Template:** `docs/EXPANSION_DESIGN.md` · **Cross-region arc:** `docs/GRAND_ARC.md` (this file holds that arc's finale)
**Canon note:** Jessie, James, Meowth and their long history of disguises, Butch, Cassidy, Domino, Giovanni and Team Rainbow Rocket are canon to the anime and games. Gonzap, Wakin, Biden, Agrev, Wes, Rui, Eagun, Duking, Professor Krane, Chobin, Trudly and Folly, the Hexagon Brothers, Evice (as Mayor Es Cade), Greevil (as Mr. Verich), Gorigan, the Relic Stone, Citadark Isle and **XD001, the Shadow Lugia**, are canon to Colosseum and XD. Dialogue, scenes and plots are original. Species are my best recall and are marked approximate.
**Three groups.** The **Rocket Remnants** are a running joke with a conscience. **Team Snag'em** are the hands. **Cipher** is what the hands work for. The base script covers the first two; this file adds the third and gives all three an ending.

---

## E1. The Wider Scale

The base script has no climax: the roaming cast feeds other teams'. The Expanded Edition gives them the last one.

### E1.1 The plan at five scales

| Scale | What they are doing | What the player sees | Where it pays off |
| --- | --- | --- | --- |
| 1 **Street** | *The trio:* a new disguise in every region, each worse than the last. *Snag'em:* taking one Pokémon at a time, mid-battle, in broad daylight | Three familiar silhouettes in unfamiliar hats; a trainer staring at an empty hand | Events *A Clever Disguise*, *First Snag* |
| 2 **City** | *Snag'em:* a warehouse in every port. *Cipher:* a spotless town with a kindly mayor | Crates with the same stencil; a fountain that is slightly too clean | Raids (base kits); event *The Mayor* |
| 3 **Region** | *Cipher:* a liaison with each local team, a Data ROM each (the regional scripts) | The quiet figure at the edge of three scenes | Every other Expanded script |
| 4 **Border** | *Cipher:* ships. Everything the nine regions made goes to one island | A cruise liner with a generous old man aboard | Event *Mr. Verich*; Raid 6 |
| 5 **World** | *Cipher:* XD001, a Shadow Pokémon built from every method at once, which its makers believe can never be purified. *Rocket:* someone is watching Cipher from the far side of a door | A storm that does not move with the weather | The Finale (E7) |

### E1.2 World-state track — *The Stock*

Stored in `cipher.x.stock` (0–5). This track is not per region. It runs across the whole run and is read at the Finale.

| Step | Name | Gained when | Effect at the Finale |
| --- | --- | --- | --- |
| 1 | **Samples** | Any liaison leaves a region unbeaten | +1 Admin duel in Phase 3 |
| 2 | **Shipments** | Any region's Apex Shadow enters the Region of Doom | That Apex stands guard in Phase 4 |
| 3 | **Three Beasts** | Raikou, Entei and Suicune were all shipped from Johto | The three liaisons who hold them return together |
| 4 | **The Reading** | `cipher.lugia-reading` is set (Johto Raid 5 Failed or Declined) | XD001 has one extra lock |
| 5 | **Complete** | Five or more regions were lost or stayed out of | The Finale's timer is 2 turns shorter |

A step is removed for every **three** Data ROMs the player holds.

### E1.3 The bigger secret

In the regional scripts each liaison explains a piece. Here is the whole.

Cipher did not want nine weapons. It wanted nine *methods*, tested by other people at other people's cost. A pulse that overrides a bond. A rhythm that carries it. A size that makes it regional. A chain that holds a legend. A lock that waits to be let in. A siphon that stores what it takes. A kindness that calls itself protection. A feed that scales. And at the last, proof that a heart will lend itself, if it is lonely enough.

**XD001** is all nine at once, built into a Lugia: the Pokémon whose song calms storms, made into the storm. **Grand Master Greevil** intends to sail it out of Citadark Isle and never need a liaison again.

**Team Snag'em** did not know. Gonzap thinks he runs a theft ring with one large client. He has been paying off a debt to Cipher for years and has never asked why the interest is denominated in Pokémon.

**The trio** worked it out before anyone, by accident, by being thrown off every dock in the world.

---

## E2. Expanded Cast

### E2.1 New officers and specialists

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.cipher.greevil` | **Grand Master Greevil** | Leader (7) | canon (XD) | Strategist: Cipher's master, an old man with the patience of money | Rhydon, Exeggutor, Tauros, and three birds (see E4); XD001 | Kindly, twinkling, then not |
| `sc.cipher.evice` | **Evice** | Second (6) | canon (Colosseum) | Zealot: Cipher's first master, long thought finished | Slaking, Salamence, Scizor, **Kingmaker** (see E4) *(approximate)* | Jolly, round, enormous; the laugh stops a beat before the smile does |
| `sc.cipher.gorigan` | **Gorigan** | Commander (4) | canon (XD) | Enforcer: runs the factory where the XD series was made | Primeape, Ursaring, Hariyama *(approximate)* | Hoots; pounds things; not stupid |
| `sc.cipher.hexagon` | **The Hexagon Brothers** | Lieutenant (3) | canon (XD) | Enforcers: six Peons in six colors who introduce themselves in order | One type each *(approximate)* | Six voices, one sentence |
| `sc.cipher.trudly-folly` | **Trudly and Folly** | Specialist (2) | canon (Colosseum) | Scouts: Miror B.'s two hangers-on, who do the carrying | Makuhita, Zangoose *(approximate)* | One complains; the other complains about the complaining |
| `sc.snagem.krane` | **Professor Krane** | Ally | canon (XD) | Scientist: built a Snag Machine to take Shadow Pokémon *back*, and a chamber to heal them | None; he purifies | Earnest, rumpled; apologizes to equipment |
| `sc.snagem.chobin` | **Chobin** | Ally | canon (XD) | Technician: an inventor's assistant with a submersible shaped like a whale | Sunkern, a very large robot | "Chobin thinks!" Third person. Always |

### E2.2 Team versions of characters you know

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.cipher.es-cade` | **Mayor Es Cade** | Civilian | canon (Colosseum) | Evice as the world knows him: the beloved mayor of a spotless town | None in public | Soft, fussy, apologetic |
| `sc.cipher.verich` | **Mr. Verich** | Civilian | canon (XD) | Greevil as the world knows him: a rich old gentleman who buys the whole bar a drink | None in public; two "bodyguards" | Warm; calls everyone "my young friend" |
| `sc.rocket-remnants.disguises` | **The Trio, Disguised** | Specialist (2) | canon (anime) | Jessie, James and Meowth in a different costume in every region (see E5.1) | As the base script | As themselves, badly hidden |
| `sc.rocket-remnants.rainbow-giovanni` | **Giovanni of Rainbow Rocket** | Leader (7) | canon (games) | A Giovanni from a world where Silph fell and nothing stopped him, looking through a door | Mewtwo, Honchkrow, Dugtrio, Nidoking, Rhyperior | The same courtesy, with nothing left to prove |
| `sc.snagem.wes` | **Wes** | Ally | canon (Colosseum) | Snag'em's best snagger, until the day he blew up their hideout and left with the Machine | **Sol and Luna** (Espeon, Umbreon) | Says almost nothing; a look does it |
| `sc.snagem.old-jacket` | **Wes in the Old Jacket** | Lieutenant (3) | what-if | Wes as Gonzap wants him back: jacket, arm-piece, a place at the table | Sol and Luna, and whatever he is told to take | Says even less |
| `sc.snagem.rui` | **Rui** | Ally | canon (Colosseum) | A girl who can see the dark aura around a Shadow Pokémon | Does not battle | Bright, stubborn; names the thing nobody else can see |
| `sc.snagem.rival-lifter` | **"Lifter"** (the rival) | Lieutenant (3) | what-if | The rival with a Snag Machine on one arm, in the Side-with variant where Snag'em is the region's team | The rival's team plus one Snagged Pokémon | The rival's archetype, not meeting anyone's eye |
| `sc.snagem.player-snagger` | **The New Snagger** (the player) | Specialist (2) | what-if | The player wearing a Snag Machine: Gonzap's, on the Inside Man route, or Krane's, on the other | The player's team | — |

> **Two Snag Machines.** Gonzap's takes any Pokémon from any trainer. Krane's takes only Shadow Pokémon. A player who wears Gonzap's and later meets Krane can have it re-tuned; Gonzap takes this personally.

---

## E3. Special Pokémon — the Patchwork and Snagged lines

**Line rule — *Patchwork*:** (Rocket Remnants) a Patchwork Pokémon carries one gadget, chosen at random from three when it enters and shown to the player: a **net** (the target's Speed −2 for 2 turns), a **smoke ball** (both sides' accuracy −1 for 2 turns), or a **spring** (it is launched back to its Ball and the next Pokémon comes in). The gadget goes off once, on the turn the Pokémon would first be hit (announced: "Something goes *sproing*.").

**Line rule — *Snagged*:** (Team Snag'em) a Snagged Pokémon was taken from its trainer and remembers. At the end of each turn there is a chance it refuses its snagger and skips its next turn: 20% on the first turn, +10% each turn after (announced: "It is looking for someone who isn't here."). Returned to its real trainer, it loses the rule.

| ID | Name | Species | Signature trait | Where met | Can the player get it? |
| --- | --- | --- | --- | --- | --- |
| `sv.rocket-remnants.wobbuffet` | **Wobbuffet!** | Wobbuffet | *Nobody Called You*: it may come out of its Ball by itself at the start of any turn, replacing Jessie's active Pokémon, and salute | Jessie | No |
| `sv.rocket-remnants.growlie` | **Growlie** | Growlithe / Arcanine | *Waited at the Gate*: +1 to all stats in any battle fought at James's side, which is every battle it is in | James, when things are serious | No |
| `sv.rocket-remnants.bottlecap` | **Bottlecap** | Mime Jr. | *Copies the Twerp*: its first move each battle is the last move the player's Pokémon used | James | No |
| `sv.rocket-remnants.top-cat` | **Top Cat** | Meowth | *Translator*: reveals the foe's next move once per battle; in this file he also reads crate stencils | With the trio | Ally only, and only when he decides |
| `sv.rocket-remnants.express` | **Express** | Delibird | *Special Delivery*: it brings the trio one random item at the start of a battle; one time in five it is something that explodes | The Boss's old messenger, still making the rounds | Yes: it has had no orders in years and will deliver for anyone who signs |
| `sv.snagem.overhead` | **Overhead** | Skarmory | *Eye in the Sky*: the player cannot flee, and the foe's switches are announced a turn early | Gonzap | No |
| `sv.snagem.sol-and-luna` | **Sol and Luna** | Espeon / Umbreon | *Matched Pair*: when one is hit, the other's next move has +1 priority | Wes | Ally only: they are Wes's |
| `sv.snagem.old-sparky` | **Old Sparky** | Pikachu | *Still Got It*: its first attack each battle is always a critical hit; after that it needs a sit-down (it skips every third turn) | Eagun, at the Relic Stone | Ally only: it is Eagun's, and has been for fifty years |
| `sv.snagem.dukings-plusle` | **Duking's Plusle** | Plusle | *Cheerleader*: while it is on the field its partner's moves cannot miss | Snag'em's warehouse | Returned: it belongs to a very large man who is crying |
| `sv.snagem.pocket-change` | **Pocket Change** | Tuftin | *Too Small to Snag*: a Snag Machine cannot lock onto it, and it shares that with one ally | A Snag'em Grunt's own, hidden in his jacket | Yes: he hands it over to keep it away from the boss |

---

## E4. Special Shadow Pokémon

The Rocket Remnants use the **Gadget Snare** and make no lasting Shadows. Team Snag'em uses the **Snag Machine** (destroying it gives −40). Cipher uses all of the methods (Shadow doc §6). In this file the team segment `cipher` marks Pokémon bound by Cipher itself.

| ID | Code | Name | Species | Tier | Shadow ability | Shadow moves | Purification key | Where met |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ss.snagem.first-snag` | — | **First Snag** | Makuhita / Hariyama | 1 Veiled | Dread Aura | Umbral Rush | Any method; it is the one Shadow meant to teach purification | Event *First Snag* |
| `ss.snagem.the-gift` | — | **The Gift** | Togetic / Togekiss | 2 Bound | Black Ledger | Dusk Brand, Siphon Lull | Heart Bond only: it has to be walked with | Offered by a Snag'em contact as a present |
| `ss.cipher.kingmaker` | — | **Kingmaker** | Tyranitar / Mega Tyranitar | 4 Fallen | Overbound | Gloam Crash, Weeping Maw, Heart Eclipse | Defeat Evice with the mask off | Finale, Phase 3 |
| `ss.cipher.disco` | — | **Encore, Please** | Dragonite / Z-Mega Dragonite | 3 Gripped | Spotlight Sap | Hollow Tide, Pale Echo, Rift Step | Beat it in time with the music (see Finale, Phase 3) | Finale, Phase 3: Miror B., who finally got one |
| `ss.cipher.whiteout` | — | **Whiteout** | Articuno | 3 Gripped | Frost Oath | Chain Hymn, Null Pulse, Cinder Ward | Open its tank in the Reservoir | Greevil |
| `ss.cipher.blackout` | — | **Blackout Wing** | Zapdos | 3 Gripped | Unbound Spark | Umbral Rush, Null Pulse, Dusk Brand | Open its tank in the Reservoir | Greevil |
| `ss.cipher.burnout` | — | **Burnout** | Moltres | 3 Gripped | Lantern Heart | Ember of Grief, Null Pulse, Gloam Crash | Open its tank in the Reservoir | Greevil |
| `ss.cipher.xd001` | XD001 | **XD001** | Lugia | 4 Fallen | Contract Clause | Hollow Tide, Null Pulse, Heart Eclipse, Storm Without a Song | Story only: nine locks, nine ROMs | Citadark Isle, Phase 6 |

**Signature Shadow move — Storm Without a Song:** 120 power, hits all foes; a Pokémon at full bond with its trainer takes half. It has no Corruption cost: XD001 was built so that using its power would never weaken the lock. Announced one turn ahead ("The wind forgets its tune.").

**Notes**
- **Encore, Please.** Every other admin was given a legend. Miror B. asked for one in every region. At the very end Cipher gave him a Dragonite, and he was so pleased he named it after applause.
- **The three birds** follow the Legendary Shadow rules. They are Greevil's, kept in three tanks in the Reservoir with their wills stored separately beside them.
- **XD001** is the only Shadow in the pack whose makers claim it cannot be purified at all. They are wrong by exactly the number of ROMs the player is carrying.

---

## E5. New Story Events

These events have `any` as their region. Each fires once per run unless it says otherwise.

### E5.1 *A Clever Disguise* (`xe.any.disguise`) — Street

*Trigger: once per region, at any town node. Three strangers. They are not strangers.*

| Region | The disguise | What gives it away |
| --- | --- | --- |
| Kanto | Fossil appraisers in tweed | Meowth is the "rare fossil" on the table and sneezes |
| Johto | A radio jingle trio, "The Rocketeers" | The jingle rhymes "trouble" with "double" |
| Hoenn | Weather forecasters | They predict "blasting off, with scattered us" |
| Sinnoh | Wellness consultants | James cries when a Pokémon comes back "calm" and tears up the brochure |
| Unova | Three "liberated Pokémon" in felt costumes | One of them is an actual Pokémon and is the least convincing |
| Kalos | Fashion models | Jessie will not stop winning, and the judges are afraid of her |
| Alola | A malasada truck | The malasadas are genuinely good. They have nearly gone straight twice |
| Galar | Macro Cosmos interns | Meowth has unionized the mailroom by lunch |
| Paldea | Transfer students | James is forty. Clive nods at him across the hall in grim solidarity |

> **JESSIE** *(any region, when recognized)*: "Curses! How did you see through our flawless disguise?"
> **PLAYER (choice):** ["The cat is talking."] / ["I didn't. Carry on."] / ["It's a really good disguise."]
> **JAMES** *(to the third; clasping his hands)*: "Do you *mean* it?"
> *(The second and third choices give trio reputation +5. In Alola, buying a malasada gives +10 and heals 20%.)*

### E5.2 *Landing Zone* (`xe.any.landing-zone`) — Street

*Trigger: any rest node within two nodes of a battle the trio lost. A crash in the bushes. A small crater. Three figures, slightly smoking, around the player's campfire as if invited.*

> **JAMES:** "We do apologize. One doesn't choose where one lands."
> **MEOWTH:** "You got soup? We ain't had soup since— where was it, the one with the volcano *and* the sea?"
> **JESSIE:** "Don't *beg*, Meowth. …Is that soup."
> *(If the player shares:)*
> **JAMES** *(producing a tin)*: "In return: my collection. Bottle caps. Every region. This one's from a harbor in Kanto, this one washed up in Olivine, this one I found on a dock in Slateport—"
> **MEOWTH:** "Tell 'em what's stamped on the back."
> **JAMES:** "Oh, they've all the same little mark. I thought it was the bottler."
> *(It is not the bottler. Intel +5; `cipher.x.caps = true`: the player learns that every team's crates came from one supplier, one region earlier than the story would otherwise say.)*
> **JESSIE** *(leaving, grandly)*: "We were never here. We are *never* anywhere. That is the *point* of us."

### E5.3 *The Prize Machine* (`xe.any.prize-machine`) — City

*Trigger: any city, after two trio encounters. A Pelipper lands with a capsule machine strapped to its back and looks at the trio expectantly.*

> **MEOWTH:** "Head office still sends it! There ain't even a head office! It just *shows up*!"
> **JESSIE:** "One turn of the handle, one Pokémon on loan. It's how we've always been supplied."
> **JAMES:** "It's rather sad, really. Somewhere there's a warehouse of Poké Balls being posted to nobody, by nobody, forever."
> **PLAYER (choice):** [Turn the handle] → The player borrows one random **Patchwork** Pokémon for the next battle only. It goes home by Pelipper afterwards. / [Follow the Pelipper] → *(Two nodes.)* An unmanned depot, lights on a timer, a conveyor still running. On the wall, a framed photograph of the Boss, and under it a second, newer frame, empty, with a plaque: RESERVED. Intel +4; `rocket.rainbow.depot = true`. / [Sign for it] → **Express**, the Delibird, takes the player's signature and now delivers to them.

### E5.4 *First Snag* (`xe.any.first-snag`) — Street

*Trigger: the first time Snag'em is present in a region. A roadside battle between two strangers. One of them raises an arm with a machine on it.*

> *(A flash. The other trainer's Makuhita is gone from the field. It is on the wrong side now, and there is something around it like smoke that only one person present seems to see.)*
> **RUI** *(grabbing the player's sleeve)*: "Did you see that? Around it. It's all *dark*. Nobody ever believes me. Tell me you see it."
> **SNAG'EM GRUNT:** "Nothing personal. It's a living."
> *(A young man in a long blue coat is leaning on a motorbike across the road, watching, saying nothing.)*
> **PLAYER (choice):** [Battle the Grunt] → *(Battle: includes `ss.snagem.first-snag`, Tier 1. Win: the Makuhita may be taken into custody or handed back.)* / [Ask Rui what she sees] → A tutorial on Shadow auras: the tier names, and which purification methods are open. / [Look at the man in the coat] → He looks back. He takes one glove off, shows the player the marks an arm-piece leaves, puts the glove on, and rides away. `snagem.x.wes = seen`.

### E5.5 *You Owe Me a Building* (`xe.any.old-jacket`) — Region

*Trigger: Snag'em present, after* First Snag*. A desert bar. Gonzap, huge, at a table for two. Wes, opposite. A folded jacket between them.*

> **GONZAP:** "Best snagger I ever trained. Then one morning my hideout's a hole in the ground and my best machine's on your arm, headed for the horizon."
> **WES:** "…"
> **GONZAP:** "You owe me a *building*. I've done the sums. With interest you owe me two."
> **GONZAP:** "I don't want the money. I want you back. Jacket's still your size. I had it let out; I figured you'd grown."
> *(Wes looks at the jacket. Rui, at the bar, has stopped pretending not to listen.)*
> **PLAYER (choice):**
> 1. **["Ask him who the client is."]** → **WES** *(the first words anyone has heard him say)*: "Who buys them, Gonzap." **GONZAP:** "A firm. Pays on time." **WES:** "What do they *do* with them." *(A long silence. Gonzap has never asked.)* `snagem.x.gonzap = asked`.
> 2. **[Say nothing]** → Wes puts the jacket on. He looks at himself in the bar mirror. He takes it off. He leaves it on the table, folded better than it was. `snagem.x.wes = out`.
> 3. **["He's not coming back."]** → **GONZAP:** "I know. I had to ask. A man has to *ask*." He pays for everyone's drinks, including the player's.

*With `snagem.x.gonzap = asked`, Gonzap changes sides in the Finale.*

### E5.6 *The Stone in the Forest* (`xe.any.relic-stone`) — Region

*Trigger: the first time the player owns a Shadow Pokémon at Tier 2 or higher. A village of old people and old Pokémon. A mossy stone in a clearing.*

> **EAGUN:** "Fifty years I've battled with this Pikachu. He's slower. So am I. We've agreed not to mention it."
> **EAGUN:** "That stone's been here longer than the village. They say a little green traveller who walks through time comes to rest by it. A Pokémon that's had its heart shut, you bring it here and you *wait* with it. That's all. Waiting's the whole trick."
> **PLAYER (choice):** [Wait with it] → *(One rest node.)* This is **Site Cleansing**: the Shadow Pokémon's Corruption drops by 40 to 100, as the Shadow doc says. / [Ask about the traveller] → If Celebi was freed in Johto, a green light crosses the clearing and one of the player's Pokémon gains a Heart Scar for free. If it was taken, the stone is cold, and Eagun says, "It hasn't been by this year. I don't like that." / [Battle Eagun] → **Old Sparky** lands one critical hit and then sits down. Eagun sits down too. Everybody laughs.

### E5.7 *Mr. Verich* (`xe.any.verich`) — Border

*Trigger: any sea crossing after four regions. The ship's bar. An old man with a silver moustache and two tall attendants. He is buying drinks for the room.*

> **MR. VERICH:** "My young friend! Sit. I insist. I have been hearing about you in every port. A remarkable career. Nine teams, is it? I do admire *thoroughness*."
> **MR. VERICH:** "I am only a retired businessman. I invested, here and there. A little in Kanto, a little in Johto. One likes to *diversify*."
> *(The two attendants stand behind his chair. One of them is looking at the floor. The player has met him, in a white laboratory, on an island.)*
> **PLAYER (choice):** ["What do you invest in?"] → **MR. VERICH:** "Methods, my young friend. Never products. A product can be seized. A *method* walks out in someone's head." / [Look at Eldes] → *(He does not look up. He turns one hand over, briefly, palm out: nine fingers and thumb folded in turn. Nine.)* Intel +5. / [Decline the drink] → **MR. VERICH** *(still twinkling)*: "Careful. I like that. It will make the end more interesting. I mean, of course, the end of the *voyage*."

*Writes: `cipher.seen.greevil`.*

### E5.8 *The Mayor* (`xe.any.es-cade`) — City

*Trigger: any city after six regions, if Snag'em or Cipher has been met. A town where every wall is white and the fountain runs both ways.*

> **MAYOR ES CADE:** "Oh! Oh, a visitor, oh dear, and me with the square not swept. Welcome, welcome to our little town. We have no crime here. None at all. Isn't that nice?"
> **TOWNSPERSON** *(quietly, as he passes)*: "Three trainers lost their Pokémon by the fountain last week. The mayor says they must have *mislaid* them."
> **MAYOR ES CADE:** "I do so worry about young people travelling alone. With such *valuable* partners. You must let me know where you're staying. So I can send a fruit basket."
> **PLAYER (choice):** [Tell him] → That night, an ambush: Trudly and Folly, with a net. *(Battle. Win: Intel +5.)* / [Lie] → Rui, if she is with the player, whispers: "There's nothing around *him*. That's the scary part. He's clear as glass. It's everything *near* him that's dark." `cipher.seen.evice = true`. / [Ask about the fountain] → **MAYOR ES CADE:** "It was a gift. From a friend of the town. A Mr. Verich. *Such* a generous man."

---

## E6. Raids, Expanded

The base script's four kit raids keep their objectives, results and Levers. Each gains one phase. Raids 5 and 6 are new and belong to Cipher; they are offered in any region where Snag'em is present, or in any region after the fifth.

### E6.1 The four kit raids, deeper

| Base raid | New phase | What happens |
| --- | --- | --- |
| **Balloon Dock** (`pr.any.balloon-dock`) | **The Sewing Room** | The trio's balloon is patched from every region's flag. Jessie is mending it and will not let anyone help. If the player threads a needle for her (a timing prompt), the trio stay out of the raid: "We were on a tea break. A long one." |
| **The Sub Hideout** (`pr.any.sub-hideout`) | **The Mess Deck** | Remnant Grunts playing cards for bottle caps. One has a photograph of the Boss in his locker and a second, of his own kids, taped over it. He can be talked into abandoning ship (Rep 15 or more): one fewer battle on the Bridge. |
| **Snag Warehouse** (`pr.any.snag-warehouse`) | **Lost and Found** | A caged room of Snagged Pokémon with their trainers' names on luggage tags. **Duking's Plusle** is here. So is a ledger: every tag has a second column, DELIVERED TO, and the same word in every row. |
| **Pyrite Plant** (`pr.any.pyrite-plant`) | **The Night Shift** | Wakin is working the line himself because half his crew has quit. "I don't like it either. I like *eating*." If Gonzap has been made to ask (`snagem.x.gonzap = asked`), Wakin shuts the line down before the battle and the raid scores Success at least. |

> **DOMINO** *(Sub Hideout, extended)*: "Agent 009. Still. Nobody's retired the number because nobody's left to do the paperwork. I keep the uniform pressed. Don't ask me who for."
> **GONZAP** *(Snag Warehouse, extended, if present)*: "Every one of these was somebody's. I know that. I'm a thief, not a fool. I just never looked at where the truck *went*."

### E6.2 Raid 5 — "The Under" *(new)*

**Scale:** City. **Offered:** by Rui, or by the crying giant whose Plusle was taken.
**Offer (Duking, sniffling, the size of a wardrobe):** *"They've got a whole town down a mineshaft. Fights every night. They put Shadow Pokémon in a cage and sell tickets. My Plusle's the* half-time show*."*
**PR:** `pr.any.the-under` — 4 areas: The Lift → Under Street → The Studio → The Cage. **Security:** a lift that needs a key from one of three fixers, bouncers, a live broadcast (a seen battle outside the Cage adds +1 alarm).
**Objectives:** *Primary:* stop the broadcast. *Secondary A:* free the Cage's fighters. *Secondary B:* win the Cage. *Secondary C:* find the subscription list.

**Phases**

1. **The Lift.** Trudly and Folly on the door.
   > **TRUDLY:** "Password."
   > **FOLLY:** "There isn't a password, Trudly."
   > **TRUDLY:** "There *should* be. I've said. Nobody listens."
   > *(Battle, or agree with Trudly that there should be a password, at length; he waves the player in out of gratitude.)*
2. **Under Street.** A whole high street under the ground: noodle stalls, a pawn shop, a ticket booth. Tonight's bill: SIX SHADOWS, ONE CAGE.
3. **The Studio.** Venus's set, or, if she was beaten in Kalos, an empty chair and a nervous floor manager reading her cue cards badly.
   > **FLOOR MANAGER:** "And now, uh. 'Darlings.' It says 'darlings'. And now, darlings, the main event!"
4. **The Cage.** Three rounds against Snagged and Shadow Pokémon. Between rounds the player may open one pen. Each freed fighter makes the crowd louder and the next round one Pokémon shorter.
   > **ANNOUNCER:** "The challenger is— the challenger is *letting them out*. Folks, I have never seen this. Do we, uh. Do we still bet?"

**Results (Lever: *The Broadcast*):**

| Result | Immediate | Effect at the Finale | OS |
| --- | --- | --- | --- |
| **Triumph** | Off the air; every pen open; the list in hand | **No audience:** `cipher.x.stock` −1; one fewer wave in the Finale's Phase 2 | −3 |
| **Success** | Off the air | One fewer wave in Phase 2 | −2 |
| **Partial** | The show ends early | No change | −1 |
| **Failure** | The player is thrown out of the lift, on camera | **Ratings:** `cipher.x.stock` +1 | +2 |
| **Declined** | The show goes on | Ratings | +1 |

**Failure consequences:** **C2 (Fine / Shakedown), C8 (Reputation fall), C11.**

### E6.3 Raid 6 — "The Key Lair" *(new)*

**Scale:** Border. **Offered:** after `xe.any.verich`, by Chobin, who arrives soaking wet.
**Offer:** *"Chobin's professor has been taken! Chobin followed the bad men's truck in the Robo Kyogre! Chobin found a factory! Chobin thinks it makes* Shadow Pokémon*! Chobin is very frightened and also very brave!"*
**PR:** `pr.any.cipher-key-lair` — 4 areas: The Loading Dock → The Line → The Pod Hall → The Chamber. **Security:** conveyor floors, shutters on a key sequence, Peons on every catwalk.
**Objectives:** *Primary:* free Professor Krane. *Secondary A:* stop the line. *Secondary B:* defeat Gorigan. *Secondary C:* read the pods.

**Phases**

1. **The Loading Dock.** Crates from nine regions, each with the stencil James has on his bottle caps.
2. **The Line.** A moving belt of empty Poké Balls passing under a machine that hums in a rhythm the player may have heard on a radio in Johto.
3. **The Pod Hall.** Twelve glass pods in a row, each with a plate.
   > *(XD001: OCCUPIED, the plate says, and the pod is not here; a mark on the floor shows where it was moved. XD002 through XD012: each is empty, and each plate has a second line. "FIELD-TESTED BY: Rocket (Kanto)." "FIELD-TESTED BY: Galactic (Sinnoh)." All eleven. Under the last: "COMPONENTS VERIFIED. ASSEMBLE."*)
   > **PROFESSOR KRANE** *(from a locked office, through the glass)*: "They didn't make eleven monsters. They made eleven *experiments* and one result. Oh dear. Oh dear, oh dear. I'd rather hoped I was wrong about that."
4. **The Chamber.** Gorigan, on a gantry, beating his chest.
   > **GORIGAN:** "HOO! Little hero! Gorigan runs the factory! Gorigan *built* the pods! You think Gorigan is the stupid one? *Everyone* thinks Gorigan is the stupid one! That is why they tell Gorigan *everything*!"
   > *(Battle. Trait: **Underestimated**: his Pokémon gain +1 Attack each time the player uses a status move on them; announced.)*
   > **GORIGAN (defeat):** "…Hoo. Fine. The professor is in the office. Key is under the mat. There is always a key under the mat. Nobody checks."

**Reward:** Krane brings his **Purify Chamber**. From now on any rest node can purify one Shadow Pokémon by 30 Corruption (once per node), and the Finale's Breather can purify fully.

**Results (Lever: *The Chamber*):**

| Result | Immediate | Effect at the Finale | OS |
| --- | --- | --- | --- |
| **Triumph** | Krane free; the line stopped; the pods read | **The key to the key:** XD001 has one fewer lock; the Purify Chamber works on Apex Shadows in the Reservoir | −3 |
| **Success** | Krane free | The Breather purifies fully | −2 |
| **Partial** | Krane free; the Chamber is damaged | The Breather purifies by 30 | −1 |
| **Failure** | The player is boxed and shipped out on the belt | **Assembled:** XD001 has one extra lock | +2 |
| **Declined** | The line runs | Assembled; Krane is absent from the Finale | +1 |

**Failure consequences:** **C1 (Impound), C6 (Hostage: Chobin), C11.**

---

## E7. The Finale — Extended Cut: "Citadark"

This is the climax of the cross-region arc (`docs/GRAND_ARC.md`). It is **optional**, it is offered **after the run's last regional climax**, and it needs **three or more Data ROMs**. Decision D1 is adjusted for it, in the player's favor: losing here does not undo a won run. The run is recorded as *won, finale lost*, and XD001 enters the Region of Doom.

Checkpoints are after Phase 2 and at the Breather.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | The Nine Locks | — | new | 0 |
| 0b | **The Alliance** | Siege Map | new | 0 |
| 1 | **The Crossing** | Convoy | new | 2–3 |
| 2 | The Climb | Gauntlet | new | 4–6 |
| 3 | The Admins | Duels | new | 2–5 |
| — | **Breather** | Rest | new | 0 |
| 4 | **The Reservoir** | Set piece | new | 2–4 |
| 5 | Grand Master Greevil | Boss | new | 1 |
| 6 | **XD001** | Colossus | new | 0–1 |
| 7 | **The Rainbow Door** | Front | new, conditional | 0–4 |
| 8 | Resolution | — | new | 0 |

### E7.1 Phase 0 — The Nine Locks

After the last region, at the next rest node, a Delibird lands with an envelope. It is the list Eldes wrote, or, if the player never met him, a bottle cap from James with a map scratched on the inside.

> **THE LIST:** *"An island with a volcano at its heart. A dome at the top. Under the dome, the only one of the series that was ever finished. They say it cannot be purified. They said that because they needed it to be true. Bring whatever you have."*
> **Choice: [Go] / [Not yet] / [Never]**

`[Never]` ends the run where it stands, with its victory intact.

### E7.2 Phase 0b — The Alliance (Siege Map)

Citadark Isle has four approaches and a dome. Each approach is Held by whoever the player's run has earned.

| Approach | Held if any of these is true | If Lost |
| --- | --- | --- |
| **The Whirlpool Gate** (sea) | Hoenn's titans both rest; or Johto's young Lugia went home; or Chobin is free | The Crossing has three battles, not two |
| **The Lava Flats** | Paldea's Engine was pulled apart (five Starmobiles arrive, honking); or Kanto's Blaine walked with the player | Lava hazard in Phase 2 (1/16 HP every third turn to non-Fire Pokémon) |
| **The Sky Lift** | Any one of: Lance (Johto), N with a dragon (Unova), Leon (Galar) | Phase 2 has one more wave |
| **The Cliff Stair** | Any one of: Cynthia or Looker (Sinnoh), Nanu (Alola), Diantha (Kalos) | The Breather heals 35% |
| **The Dome** | Never | See Phase 4 |

> **MELA** *(by radio, over engine noise, if Paldea's is Held)*: "WE BROUGHT ALL FIVE! THEY'RE STREET LEGAL NOW! MOSTLY!"
> **NANU** *(if Alola's)*: "I was retired. I want that on the record. Twice."

For every approach that is Held, one named ally fights one battle for the player somewhere in Phases 1 to 4.

### E7.3 Phase 1 — The Crossing (Convoy)

A ring of whirlpools around the island. The player crosses in whatever the Alliance has: Archie's submarine, a Lugia's wake, or the Robo Kyogre.

> **CHOBIN:** "Chobin is driving! Chobin has never driven in a *storm*! Chobin has also never driven! Hold on to Chobin!"

**Format:** a Convoy of two battles (three if the Gate is Lost) against Cipher patrol boats. The storm overhead is XD001's: at the end of every third turn both sides' active Pokémon lose 1/16 HP to wind (announced), unless a Pokémon at full bond is in the lead.

### E7.4 Phase 2 — The Climb

A stair cut into the volcano's flank.

| Landing | Trainer | Notes |
| --- | --- | --- |
| The Beach | Cipher Peons ×2 | Shadow Pokémon, Tier 2 |
| The Switchback | **The Hexagon Brothers** | Six one-Pokémon battles in a row, one type each; no healing between |
| The Barracks | Snag'em Grunts ×2, or none | Absent if Gonzap has changed sides |
| The Vents | Cipher Peon with a regional Apex's guard | Only for each Apex that entered the Region of Doom |
| The Gate | **Gonzap**, or Gonzap *holding* the gate | See below |

> **THE HEXAGON BROTHERS:** "Red!" "Blue!" "Yellow!" "Green!" "Brown!" "Purple!" **ALL:** "*We are the Hexagon Brothers!*" **PURPLE:** "…We practised that for a year. Nobody ever lets us finish."
> **GONZAP** *(if he never asked)*: "Client says stop you. Client pays. That's the whole of my philosophy, kid, and I've never needed a second page."
> **GONZAP** *(if `snagem.x.gonzap = asked`; he is standing with his back to the player, facing up the stair, with **Overhead** circling)*: "I asked. Took me nine years. You know what they told me? 'It's not your concern.' *My* stock. *My* trucks. Not my concern." *(He cracks his knuckles.)* "Go on through. Me and the boys are going to stand here and be very much somebody's concern."

### E7.5 Phase 3 — The Admins

Every liaison the player did **not** beat in their own region is here, in order. Each one beaten earlier is absent, and their ROM is already in the player's bag. A liaison beaten *here* gives up their ROM **late**: it opens that region's bank of tanks in Phase 4 but not its lock in Phase 6. No more than five duels are fought in this phase; if more admins remain, the Alliance holds the rest off and their ROMs are not gained.

| Admin | Present if… | Note |
| --- | --- | --- |
| **Gorigan** | Not beaten in Raid 6 | **Underestimated** |
| **Miror B.**, with **Encore, Please** | Always | The battle has a beat: every fourth turn is "the drop". A hit landed on the drop does double damage to the Shadow Dragonite and counts toward its purification; three such hits free it |
| Ein, Dakim, Lovrina, Snattle, Venus, Ardos, Nascour | Each, only if not beaten in their region | With their regional traits; Ein, Dakim and Venus each bring their beast if it was shipped |
| **Eldes** | Always, but he does not fight | He is standing at the last door, holding it open |
| **Evice**, as Mayor Es Cade, with **Kingmaker** | Always; last | See below |

> **MIROR B.:** "*Darling!* You came! And look, look what they *gave* me! He's huge! He's orange! I've named him after my favorite sound!"
> **MIROR B. (defeat, as the Dragonite shakes itself and blinks)**: "…Oh. He liked the music. He actually liked it. Nobody ever—" *(He sits down on the floor, enormous hair and all.)* "You can have the tape. I think I'm done, darling. I think I'd like to just *dance*."
> **MAYOR ES CADE** *(wringing his hands)*: "Oh dear, oh dear, you shouldn't be up here, it's not *safe*, let me just—" *(The hands stop. The voice drops an octave. The face does not change at all, which is the worst part.)*
> **EVICE:** "I ran this before the old man bought it out from under me. He diversified. *I* believed. Shall I show you the difference?"
> **EVICE (defeat):** "Hah. Hahaha! Twice! By children, twice! Oh, I do *love* this job."

### E7.6 Breather

A maintenance room. Krane has set up the Purify Chamber on a card table.

> **PROFESSOR KRANE:** "It's not my best work. It's held together with tape. But it turns. Put your Shadow Pokémon here, and four you trust around it. There. Now we wait. That's most of science, you know. Waiting near something."
> **RUI:** "It's getting lighter. Around it. Oh. Oh, look at it *go*."

Heal 50%, revive one Pokémon, checkpoint. One Shadow Pokémon in the party is purified (fully after a Raid 6 Success; by 30 otherwise).

### E7.7 Phase 4 — The Reservoir

*A hall the size of a stadium. Rows of tanks, floor to roof. Each one glows a little. Each one has a label: a region, a date, a name.*

This is what ROM X described. Every will Cipher ever took is here, stored. The Shadow Pokémon were only ever the empty half.

**Objective:** open tanks. **Each Data ROM the player holds opens one bank of tanks for free.** Each bank without a ROM must be fought for (one battle each, up to four). **Timer:** 12 turns across the hall.

- Opening a region's bank purifies, wherever they are, every special Shadow of that region that is still bound, and lowers by one tier every Shadow Pokémon in the player's own party that came from there.
- Any regional Apex that entered the Region of Doom is here in person, guarding its own bank, at Tier 4. Opening the bank frees it without a battle if the player has that region's ROM.
- **The three birds** are in three tanks at the far end with their wills beside them in three smaller ones. Opening the small tanks is the key.

> **RUI:** "They're not dark. The tanks. They're the opposite. It's like looking at the *sun* through a jar."
> **GREEVIL** *(on a balcony far above, leaning on the rail, calling down pleasantly)*: "Do be careful with those, my young friend! They're *inventory*!"

### E7.8 Phase 5 — Grand Master Greevil

*The dome. A desk. A view of the storm. An old man in a good suit, pouring two cups of tea.*

**Team:** Rhydon, Exeggutor, Tauros, and each of **Whiteout**, **Blackout Wing** and **Burnout** whose tank was not opened. **Doctrine: Diversified**: when one of his Pokémon faints, the next enters with a copy of its stat boosts (announced). **Boss phase:** at 50% ace HP, **Mr. Verich**: the twinkle comes back. He stops the battle for one turn and names a sum.

> **GREEVIL:** "Sit. No? They never sit. Tea, then, standing up."
> **GREEVIL:** "I want you to understand that I bear you no ill will. You've been excellent for business. Every team you broke, I learned why it broke. You've been my most thorough *auditor*."
> **GREEVIL:** "The others wanted things. A city, a sea, a silence, a king. Wanting is expensive. I only ever wanted the *patent*."
> **GREEVIL (Mr. Verich):** "Shall we be sensible? Name a number. Any number. I have never met a principle that didn't have one. I shall be so disappointed in you if you turn out to be the first."
> **PLAYER (choice):** [Name a number] *(the battle ends; the run is recorded as* sold*, and the Region of Doom gains its richest faction)* / [Refuse] / **["Nine."]** *(only with all nine ROMs)*
> **GREEVIL (if "Nine"):** "…Nine. All nine." *(The teacup stops halfway.)* "Then you've the whole method. In your *bag*. Do you know what that's worth?" **PLAYER:** "…" **GREEVIL:** "No. You don't. You've never once asked what anything was *worth*. That is what's wrong with you." *(His next Pokémon enters without the copied boosts.)*
> **GREEVIL (defeat):** "Well. That is the liaisons, the stock and the staff. A lesser man would call it a bad quarter." *(He presses something under the desk.)* "Fortunately the *product* is unaffected. It cannot be purified, you see. I had that put in the specification."

### E7.9 Phase 6 — XD001

*The dome's roof opens like an eye. Something comes down out of the storm on wings the color of a bruise. It is very large and it is silent, and that is what is wrong with it: this is the Pokémon that sings the sea calm, and it has no song.*

**Format.** **XD001** (`ss.cipher.xd001`) is a Colossus behind **nine locks**. Each lock is one of the nine methods. **Each Data ROM earned in its own region removes its own lock before the fight begins** (a late ROM does not). Each lock that remains is a shield bar to be broken, and while it stands it applies its region's condition to the field.

| ROM | Lock | Condition while it stands |
| --- | --- | --- |
| K | Rig Pulse | The player's Pokémon cannot be healed by items |
| J | Carrier Beat | Every fourth turn is "the drop": XD001 acts twice |
| H | Resonator | Weather flips each turn |
| S | Chain Lock | The player's active Pokémon cannot switch |
| U | Open Hand | A Pokémon below full bond may be turned for one turn |
| X | Siphon | Every Pokémon on the player's side loses 1/16 HP a turn |
| A | Kindness | The player's side cannot use protective moves |
| G | Overload | XD001 has double HP on every remaining lock |
| P | Borrowed | Storm Without a Song hits at full power even on bonded Pokémon |

**With all nine ROMs earned in their regions there is no battle.** The locks fall open one after another, each with the sound of the region it came from, and the player simply walks up to it.

**Timer:** 14 turns. **Adjustments:** every ally the run has earned takes one hit; the freed regional Apexes, if any, each break one lock from outside (a shape in the storm, a flash, gone); Krane's Chamber, carried up by Chobin, counts as one ROM of the player's choice.

**The trio's finest hour.** On the third turn, whatever is happening, a hot-air balloon shaped like a cat comes out of the storm backwards, on fire, and goes through the dome's main antenna.

> **JESSIE:** "PREPARE FOR TROUBLE!"
> **JAMES:** "WE DIDN'T PREPARE!"
> **MEOWTH:** "WE NEVER PREPARE!"
> *(The antenna was the Carrier Beat. If lock J was standing, it is not anymore.)*
> **GREEVIL** *(staring at the wreckage)*: "…Who are *they*?"
> **JAMES** *(from under a section of roof, with great dignity)*: "We've been in every one of your regions, sir. You never once noticed. We find that *hurtful*."

**When the last lock opens:** nothing happens for a moment. Then XD001 makes a small, cracked, uncertain sound. And another. The storm stops to listen. By the fourth note it has remembered the tune.

> *(Every Shadow Pokémon in the player's party drops one tier. The purple goes out of its wings from the tips inward, and what is left is silver.)*

**If the timer runs out:** it leaves through the roof, still silent, with the storm. The run is recorded as won, finale lost.

### E7.10 Phase 7 — The Rainbow Door (Front, conditional)

*Happens only if at least one regional Apex Shadow entered the Region of Doom during the run, or if Faba's visitor was never reported.* In the wrecked dome, the air opens like a door, and a man in a dark suit steps through with a cat at his heel. He is Giovanni. He is not the one the player met.

> **GIOVANNI OF RAINBOW ROCKET:** "So this is the world where it went wrong. I did wonder. Where I come from, a child never reached the eleventh floor."
> **GIOVANNI:** "I came to collect some research. I see it has been… *sung at*. No matter. I brought colleagues. Each of them from a world where *you* weren't there."

**Format: Front.** One lane for each region whose Apex was lost, up to four. In each lane stands that region's leader as they would have been had they won, with their Apex at their side and nothing in their eyes. The player acts in one lane per turn; each lane is held, when the player is elsewhere, by that region's allies.

**If no Apex was lost,** there are no colleagues. Giovanni steps through alone, looks around an empty hall, and looks at the player for some time.

> **GIOVANNI OF RAINBOW ROCKET:** "Nobody. In nine worlds I could always find at least one of them who'd won." *(He touches the brim of his hat.)* "My compliments. I shan't come back to this one. There's no profit in a world where people keep *stopping* it."
> *(The door closes. In the trio's depot, far away, an empty frame marked RESERVED falls off its nail.)*

### E7.11 Phase 8 — Resolution

- **Greevil.** Eldes comes up the stair. **ELDES:** "Father. It is finished. Come home." **GREEVIL:** "I've a second island. A third. I can rebuild in a—" **ELDES:** "I know you can. I am asking you not to." [Let him go with Eldes] (the old man is very quiet on the stair down; Ardos, if he was spared, is waiting at the bottom and takes his other arm) / [Hand him to Looker] (he offers Looker a number; Looker writes it down as evidence).
- **The Snag Machines.** [Destroy both] / [Keep Krane's] (a Key Item for later runs' Region of Doom: Shadow Pokémon there can be taken back) / [Give Gonzap's to Wes] (he looks at it for a while, and throws it into the sea himself).
- **Gonzap,** if he held the gate: he and Wes share one nod across a hall. That is the whole scene. **GONZAP:** "…You still owe me a building."
- **XD001.** It circles the island once and goes. Where it was, one silver feather. *(Key Item: **Silver Wing**. In any later run it marks the player as someone Lugia has met; `legend-lugia-shrine` begins with a Sighting.)*
- **The trio.** [Tell the news who broke the antenna] → They are heroes for one day. They hate it. They are offered medals and they steal the medals. / [Say nothing] → **MEOWTH:** "Good. We got a *reputation*."

### E7.12 Rival and Stand-with additions

- **The rival** is here in every variant. In Help they hold a lane in Phase 7 and a tank in Phase 4. In Beat-you they were on the island a day early and are found in the Reservoir, sitting in front of one glowing tank with a luggage tag on it, not saying whose. In Side-with, wherever it happened, this is where it is forgiven: no option, no prompt; they just fall into step.
- **Stand with them** has no version here. Cipher does not want an Inside Man. It wants customers. Greevil's offer in Phase 5 is the only door, and it is a sale, not a side.

---

## E8. Aftermath and the Thread

- **The Reservoir** is empty. It takes Krane and Rui three weeks to post every will home. Rui writes the addresses. She says she can read them off the glow.
- **Miror B.** opens a dance school. Enrollment: one Dragonite, four Ludicolo and, on Thursdays, a very embarrassed Gonzap.
- **The Hexagon Brothers** are hired by a children's television programme. They finally get to finish the introduction.
- **Mayor Es Cade's town** elects a new mayor. The fountain runs one way.
- **The depot** keeps posting Poké Balls to nobody. Express, the Delibird, keeps delivering them. Nobody has the heart to stop either.

**The Thread ends here.** `docs/GRAND_ARC.md` records how the Finale's result is written to the Doom Ledger and what it changes in the Region of Doom.

> **JAMES** *(last line of the pack; a campfire; a tin of bottle caps)*: "That's the lot. Nine regions. Same little mark on every one." *(He turns the last cap over. It is blank.)* "…Oh. This one's just a bottle cap." **JESSIE:** "Keep it." **MEOWTH:** "Yeah. Keep it. First clean one we ever found."

---

## E9. Dialogue Bank

### E9.1 New ambush lines

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Remnant (Weary) | "Boss ain't coming back. I know. I've still got the uniform. So." | "…I'm gonna go call my mum." |
| Grunt — Snag'em (Businesslike) | "Hold still. This'll only take one of them." | "Machine's jammed. It does that when I feel bad." |
| Grunt — Cipher Peon (Smug) | "Yours has a strong heart. Those fetch the most." | "I'll put it down as 'unavailable'." |
| Grunt — Cipher Peon (New) | "They said it doesn't hurt them. It doesn't, right? …Right?" | "I'm going to go and ask someone that again." |
| Specialist — Trudly and Folly (Bickering) | "I'll go first." "You went first last time." "And *lost*." "So let me—" | "This is *your* fault." "Everything's my fault, apparently." |
| Lieutenant — Biden (Loud) | "Wes got out! *I* should've been the one to get out! I'm *way* more rebellious!" | "See, this is why nobody lets me blow anything up." |
| Lieutenant — Agrev (Sour) | "Don't talk. I've had a week." | "And now it's a worse week." |
| Lieutenant — Hexagon Brothers (In order) | "Red!" "Blue!" "Yellow!" "Gr—" | "—een. Green. I was *green*." |
| Commander — Wakin (Gruff) | "Nothing clever. I hit things. Let's go." | "Clever would've helped." |
| Commander — Gorigan (Hooting) | "HOO! Gorigan will show you the *machine*! From *inside*!" | "Hoo. …Under the mat. The key's under the mat." |
| Leader — Gonzap (Blunt) | "I've stolen from better trainers than you. I've stolen from *worse*, too. Makes no odds." | "Huh. First time I've been robbed." |
| Second — Evice (Jolly) | "Oh dear, oh dear, a *challenger*. How *lovely*." | "Hahaha! *Wonderful.* Do come again." |

### E9.2 The trio's motto, by region

*One variation per region; they never get all the way through it.*

| Region | Where it goes wrong |
| --- | --- |
| Kanto | "To protect the world from devas—" *(Meowth: "Truck's leavin' without us!")* |
| Johto | "To unite all peoples within our—" *(the radio plays the jingle over them)* |
| Hoenn | "To denounce the evils of truth and—" *(it starts to rain; it stops; it starts)* |
| Sinnoh | "To extend our reach to the stars a—" *(a Spiritless Glameow watches, unmoved; James loses his nerve)* |
| Unova | "Jessie!" "James!" *(a Plasma Grunt: "Have you considered releasing the cat?")* |
| Kalos | "Team Rocket blasts off at the speed of—" *(a member: "Do they have a reservation?")* |
| Alola | "Surrender now or prepare to—" *(Bewear. From nowhere. It carries them off.)* |
| Galar | "Meowth, that's—" *(sixty thousand people chant something else)* |
| Paldea | They finish it. The whole thing. Team Star applauds. Jessie cries. |

### E9.3 Greevil's barks

| Moment | Line |
| --- | --- |
| Player lands a super-effective hit | "Efficient. I'd have hired you in a heartbeat." |
| Player's Pokémon faints | "A write-down. One learns not to feel those." |
| His Pokémon faints | "Depreciation." |
| Player heals | "Reinvesting. Good instinct." |
| A Shadow Pokémon disobeys the player | "Ah, one of the product line. How are you finding it? We welcome feedback." |
| Last Pokémon each | "Shall we call it even and split the island? No? Pity. It's a *nice* island." |

### E9.4 Crate stencils (what Meowth reads, by `cipher.x.stock`)

| Step | Stencil |
| --- | --- |
| 1 | THIS WAY UP. *(and, smaller:)* SAMPLES. |
| 2 | FRAGILE: LIVE. |
| 3 | THREE (3) UNITS. HANDLE WITH REVERENCE. |
| 4 | READING ENCLOSED. DO NOT PLAY ALOUD. |
| 5 | FINAL ASSEMBLY. NO RETURNS. |

### E9.5 Announcer lines for special Pokémon

| Pokémon | On entry |
| --- | --- |
| Any Patchwork Pokémon | "It is carrying something. Something goes *sproing*." |
| Any Snagged Pokémon | "It is looking for someone who isn't here." |
| Wobbuffet! | "Wobbuffet! Nobody called it." |
| Old Sparky | "Old Sparky's still got it. Once." |
| Encore, Please | "The shadow tightens. It is tapping one foot." |
| XD001 | "The wind forgets its tune." |

---

## E10. Flags and Wiring

| Flag | Set by | Read by |
| --- | --- | --- |
| `cipher.x.stock` (0–5) | Regional results (E1.2) | The Finale |
| `cipher.rom.k`, `.j`, `.h`, `.s`, `.u`, `.x`, `.a`, `.g`, `.p` | The regional scripts | Phases 4 and 6 |
| `cipher.x.caps` | *Landing Zone* | Intel, one region early |
| `cipher.seen.greevil`, `cipher.seen.evice` | *Mr. Verich*, *The Mayor* | Phase 3, Phase 5 |
| `snagem.x.wes` (`seen` / `out`), `snagem.x.gonzap` (`asked`) | *First Snag*, *You Owe Me a Building* | Raids, Phase 2, Phase 8 |
| `rocket.rainbow.depot`, `rocket.rainbow.contact` | *The Prize Machine*; Alola Raid 5 | Phase 7 |
| `finale.result` (`sung` / `silent` / `sold` / `declined`) | Phases 5, 6 and 0 | Doom Ledger, Region of Doom |

**Counts for this file:** 16 named characters (7 new officers and allies, 9 team versions and allies), 10 special Pokémon across two lines, 8 special Shadow Pokémon (1 Apex: XD001), 8 story events, 4 deepened raids and 2 new raids, an 8-phase Finale, and 5 dialogue tables.
