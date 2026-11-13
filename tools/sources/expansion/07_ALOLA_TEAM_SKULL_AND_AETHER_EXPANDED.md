# 07x — ALOLA: TEAM SKULL AND THE AETHER FOUNDATION — EXPANDED EDITION
### Script: *What We Keep*

> *"I only ever wanted to keep them safe. Do you understand? Things that are safe do not leave."* — Lusamine

**Extends:** `scripts/07_ALOLA_TEAM_SKULL_AND_AETHER.md` (the base script stays valid; this file adds to it)
**Template:** `docs/EXPANSION_DESIGN.md` · **Cross-region arc:** `docs/GRAND_ARC.md`
**Canon note:** Guzma, Plumeria, Lusamine, Faba, Wicke, Gladion, Lillie and Nebby, Mohn and the Poké Pelago, Nanu, Acerola and the Aether House, the three Type: Null, Lusamine's frozen collection, her fusion with Nihilego, and the Ultra Recon Squad are canon to the games. Tupp, Rapp and Zipp are canon to the anime. Eldes is a canon Cipher admin (XD). **Kahuna Guzma** and Mohn's partner **Tall Tale** are *what-if* inventions. All dialogue is original. Species are my best recall and are marked approximate.
**Two organizations.** Team Skull is the noise. The Aether Foundation is the plan. Everything below marks which one it belongs to.

---

## E1. The Wider Scale

The base script is a gang, a foundation and a gate. The Expanded Edition is about a family, and about what a person will do to stop anything from leaving them again.

### E1.1 The plan at five scales

| Scale | What Skull and Aether are doing | What the player sees | Where it pays off |
| --- | --- | --- | --- |
| 1 **Street** | *Skull:* tagging walls, blocking bus stops, "borrowing" Pokémon from kids | Graffiti on a trial gate; a boy at the Aether House whose Yungoos is gone | Events *Yo*, *The Aether House* |
| 2 **City** | *Skull:* holding Po Town, a whole town nobody else wanted. *Aether:* paying for it | A walled town in permanent rain; a white boat that visits at night | Raid 1; event *Rent* |
| 3 **Region** | *Aether:* collecting Pokémon from every island "for conservation", including one of the guardian deities | Fewer wild Pokémon; a ruin with its doors sealed in white | Raid 4; event *The Gallery* |
| 4 **Border** | *Aether:* thinning the wall between Alola and Ultra Space; taking advice from an outside consultant | Lights in the sky; visitors in suits who greet you with the wrong hand | Events *The Consultant*, *Recon* |
| 5 **World** | Opening the gate, so that a woman can go and live with the only creatures she believes will never leave | The sky over Aether Paradise coming apart like wet paper | Climax Phases 6 and 7 |

### E1.2 World-state track — *Noise and Silence*

Stored in `alola.x.quiet` (0–5).

| Step | Name | Regional rule | Civilian mood |
| --- | --- | --- | --- |
| 1 | **Tags** | One trial-site node per island is vandalized and closed | Annoyed |
| 2 | **Borrowed** | After any lost battle a random benched Pokémon may be "borrowed" for 3 nodes (always returned) | Wary |
| 3 | **Donations** | Aether staff stand at Pokémon Centers; wild encounter pools shrink by a fifth | Grateful, mostly |
| 4 | **Thin Places** | Once per stage a wild battle is interrupted by a glimpse of an Ultra Beast (one attack, then gone) | Frightened |
| 5 | **The Gate** | Daylight dims by a third; the climax is scheduled | Looking up |

### E1.3 The bigger secret

Skull is a decoy (base script §3). The Expanded Edition says what it is a decoy *for*.

Years ago Lusamine's husband, **Mohn**, walked into an Ultra Wormhole during an experiment and did not come back. She did not grieve. She organized. If things could be lost, then the answer was to keep them: in glass, in cold, in white rooms where nothing changes. Her collection began with his partner. Her children were next. The Foundation is the same instinct with a budget.

Nihilego's venom did not give her this. It only told her she was right.

**Eldes** of Cipher sold her the **Conservation Hold**: a Shadow lock that calls itself kindness. He has also read a report that she has not. Mohn is alive. He washed up years ago on a tiny island with no memory, and he grows beans there, and he is happy. Cipher's instructions are not to tell her. A client who has what she wants stops buying. Eldes follows the instruction and has not slept well since.

And **Guzma** believes that the only adult who ever told him he was worth something meant it.

---

## E2. Expanded Cast

### E2.1 New officers and specialists

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.skull.tupp` | **Tupp** | Lieutenant (3) | canon (anime) | Enforcer: loudest of a trio; thinks he is next in line | Salandit, Garbodor *(approximate)* | Brags in rhyme; the rhymes are forced |
| `sc.skull.rapp` | **Rapp** | Lieutenant (3) | canon (anime) | Scout: the trio's actual brain | Garbodor, Toxapex *(approximate)* | Bored, sharp; rolls her eyes audibly |
| `sc.skull.zipp` | **Zipp** | Lieutenant (3) | canon (anime) | Enforcer: says the last word of everyone else's sentence | Zubat line, Krookodile *(approximate)* | Echoes |
| `sc.aether.eldes` | **Eldes** | Liaison (4) | canon (XD) | Strategist: Cipher's consultant inside the Foundation, and its conscience, belatedly | Latios, Metagross, Flygon, Walrein *(approximate)* | Formal, grave, choosing each word to avoid a lie |
| `sc.aether.curator-pua` | **Curator Pua** | Lieutenant (3) | original | Handler: keeper of the Conservation Area's lower floors | Comfey, Oranguru, Porygon2 | Gentle, tidy; says "it's for the best" as punctuation |
| `sc.aether.dulse-zossie` | **Dulse and Zossie** | Visitors | canon (games) | Scouts from a city on the far side of the gate, where the light was stolen long ago | Poipole | He is stiff and literal; she is a child and delighted by everything |

### E2.2 Team versions of characters you know

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.skull.kahuna-guzma` | **Kahuna Guzma** | Leader (7) | what-if | Guzma as Lusamine has promised to make him: kahuna of a fifth island, hers | **Ya Boy** (Golisopod) | The same shout, with something hopeful under it that is hard to listen to |
| `sc.aether.mother-beast` | **The Mother Beast** | Leader (7) | canon (games) | Lusamine after she and Nihilego stop being two things | See E4 | Her own voice, and under it a chord |
| `sc.aether.heir-lillie` | **Lillie, Heir Apparent** | Hostage | canon (games), staged | Lillie in Foundation white, hair done the old way, reading a speech she did not write | None; Nebby is in the bag | Small, steady, getting steadier |
| `sc.aether.gladion` | **Gladion** | Ally or Lieutenant (3) | canon (games) | The son who stole one of the three Nulls and ran | **Null** (Silvally) | Dry; one hand over his face when embarrassed, which is often |
| `sc.skull.nanu` | **Nanu** | Ally | canon (games) | A kahuna, a retired international policeman, and Po Town's only law | Alolan Persian, Sableye, Krookodile | Slouched, sardonic; cannot be surprised, only tired |
| `sc.aether.mohn` | **The Man at the Pelago** | Civilian | canon (games) | A cheerful caretaker of an island for stray Pokémon, who cannot remember how he got there | None | Sunny, vague; hums a lullaby he cannot place |
| `sc.aether.wicke` | **Wicke** | Ally | canon (games) | Assistant Branch Chief; the Foundation's kindness, the real kind | None; she heals | Warm; apologizes for things that are not her fault |
| `sc.skull.rival-kin` | **Li'l Kin** (the rival) | Lieutenant (3) | what-if | The rival in a Skull bandana, in the Side-with variant | The rival's team plus one Tagged-Up Pokémon | The rival's archetype, trying out slang |
| `sc.skull.player-numbskull` | **Numbskull Number One** (the player, Skull) | Specialist (2) | what-if | The player on Skull's Inside Man route; Guzma's highest title | The player's team | — |
| `sc.aether.player-deputy` | **The Deputy Director** (the player, Aether) | Specialist (2) | what-if | The player on Aether's Stand-with route, in white | The player's team | — |

> **Kahuna Guzma.** He failed his island challenge as a kid and was never made a captain. Lusamine has told him Aether Paradise is an island, and an island needs a kahuna. Whether he is still wearing the title by the climax depends on Raid 5.

---

## E3. Special Pokémon — the Tagged-Up and Preserved lines

**Line rule — *Tagged-Up*:** (Team Skull) when a Tagged-Up Pokémon enters it sprays a tag on the field. Until it faints, the first time each foe switches in it loses 1/16 HP and is "called out" (its name appears in the tag; purely for show, and the Grunts love it).

**Line rule — *Preserved*:** (Aether Foundation) a Preserved Pokémon has been kept cold. It enters with −1 Speed, cannot be given a status condition, and takes 25% less damage from the first hit after it enters (announced: "It was kept very carefully.").

| ID | Name | Species | Signature trait | Where met | Can the player get it? |
| --- | --- | --- | --- | --- | --- |
| `sv.skull.ya-boy` | **Ya Boy** | Wimpod / Golisopod | *Back Again*: when it retreats at half HP it may return on the next turn with +1 Attack, once per battle | Guzma's ace | No |
| `sv.skull.big-sis` | **Big Sis** | Salandit / Salazzle | *Looks After Her Own*: each time an ally faints she gains +1 Special Attack and +1 Speed | Plumeria's ace | No |
| `sv.skull.lil-g` | **Li'l G** | Wimpod | *Runs, Comes Back*: it flees a battle at half HP and returns at the end with an item it found | Guzma's childhood bedroom | Yes: if nothing in the room is touched |
| `sv.skull.doorman` | **The Doorman** | Mimikyu / Busted Mimikyu | *Two Coats*: its disguise absorbs two hits where others absorb one | The Shady House, Raid 1 | Yes: it follows whoever knocks first |
| `sv.skull.the-hood` | **The Hood** | Dartrix / Decidueye (Assassian) | *Takes from the Rich*: when it knocks out a foe holding an item, the item goes to its trainer | Po Town's rooftops | Yes: it joins whoever returns the Yungoos |
| `sv.skull.capn` | **Cap'n** | Yungoos / Gumshoos | *Stakeout*: +50% damage against a Pokémon that switched in this turn | The Aether House | Returned: it belongs to a boy there |
| `sv.skull.landlord` | **Landlord** | Alolan Meowth / Alolan Persian | *Rent Is Due*: after each battle its trainer gains a little money from the loser, whoever wins | Nanu | No |
| `sv.aether.madame` | **Madame** | Clefable | *In Mother's Image*: copies the stat boosts of Lusamine's last Pokémon to leave the field | Lusamine | No |
| `sv.aether.embrace` | **Embrace** | Bewear | *Won't Let Go*: its contact moves stop the target switching out for 2 turns | Lusamine | No |
| `sv.aether.null` | **Null** | Type: Null / Silvally | *Memory Drive*: changes type once per battle to resist the last move that hit it | Gladion | No |
| `sv.aether.promotion` | **Promotion** | Bruxish | *Senior Staff*: its Psychic moves have +1 priority against a Pokémon of lower level | Faba | No |
| `sv.aether.beans` | **Beans** | Poipole / Naganadel | *From Elsewhere*: immune to the *Thin Light* condition, and shares that with its side | Zossie | Yes: she gives it to the player if asked nicely, and it is clear she had been hoping to be asked |
| `sv.aether.nebby` | **Nebby** | Cosmog / Cosmoem / Solgaleo / Lunala | *Won't Stay in the Bag*: at the start of a battle it may leave the bag and move one of the player's Pokémon out of danger, once | With Lillie | Ally only: it is Lillie's, or its own |

> Li'l G, the Doorman, the Hood, Cap'n and Landlord are not Tagged-Up. Null, Beans and Nebby are not Preserved. Nebby's final form follows the run's seed.

---

## E4. Special Shadow Pokémon

Skull uses the **Stolen Bond** (returning a Pokémon to its owner gives −30). Aether uses the **Conservation Hold** (freeing a Pokémon from the Paradise gives −35). See Shadow doc §6.

| ID | Code | Name | Species | Tier | Shadow ability | Shadow moves | Purification key | Where met |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ss.skull.rent-money` | — | **Rent Money** | Alolan Raticate | 2 Bound | Debt Collector | Umbral Rush, Dusk Brand | Walk it back to its trial site | Raid 1; a Totem Pokémon Skull "borrowed" to prove they could |
| `ss.aether.tall-tale` | — | **Tall Tale** | Alolan Exeggutor | 3 Gripped | Relic Ward | Gloam Crash, Siphon Lull, Cinder Ward | Take it to the Pelago | Event *The Gallery*: Exhibit One |
| `ss.aether.null-three` | — | **Null Three** | Type: Null / Silvally | 4 Fallen | Lantern Heart | Null Pulse, Gloam Crash, Last Lamp | Break the control helmet, which takes trust, not force | Raid 3 |
| `ss.aether.guardian-in-glass` | — | **The Guardian in Glass** | Tapu Lele | 3 Gripped | Shroud | Null Pulse, Chain Hymn, Rift Step | The island must call it: the kahuna and three people the player has helped | Raid 4 |
| `ss.aether.mother-beast` | XD010 | **The Mother Beast** | Nihilego | 4 Fallen | Contract Clause | Siphon Lull, Chain Hymn, Keepsake | Story only: part the three veils and be heard | Ultra Space, Phase 6 |

**Signature Shadow move — Keepsake:** 90 power; the target is sealed in glass until the end of the next turn: it cannot act and cannot be harmed. Cost: +6 Corruption. Announced one turn ahead ("She is choosing what to keep.").

**Notes**
- **Rent Money** is the comic one. It is large, it is bored, and Skull has no idea what to do with it now that they have it.
- **Tall Tale** was Mohn's partner. It was the first thing Lusamine froze, the week he vanished, "so that at least one of them would stay". It has been smiling in a tube for years.
- **Null Three** is the Beast Killer that went wrong. Lantern Heart is deliberate: something in it keeps trying to cure itself.
- **The Mother Beast** is Lusamine and Nihilego together. It is the only Apex Shadow that is partly a person, and the only one that can be *talked* to. It follows the Legendary Shadow rules.

---

## E5. New Story Events

### E5.1 *Yo* (`xe.alola.yo`) — Street

*Trigger: any route node after Ignition. Three Skull Grunts are blocking a bus stop. They are not waiting for a bus.*

> **TUPP:** "Yo, yo, yo! This stop's closed, 'cause we got *exposed*, to the, uh—"
> **RAPP:** "Don't."
> **TUPP:** "—to the *road*!"
> **ZIPP:** "Road!"
> **RAPP:** "We're blocking a bus stop on an island with one bus. It comes Tuesdays. It's Thursday."
> **PLAYER (choice):**
> 1. **[Battle them]** → *(Battle: the trio, one after another. Trait: **Hype Man**: each time one of them is beaten, the next one's first move has +20% power; announced, by Zipp.)*
> 2. **[Rap back]** → A three-beat rhythm prompt. Succeed: they are so impressed they move. **TUPP:** "…Okay that was actually—" **RAPP:** "Better than yours. Say it." **TUPP:** "*Different* than mine." *(Rep with Skull +5; `alola.x.bars = true`.)*
> 3. **[Wait for the bus]** → *(One rest node.)* It is Thursday. No bus comes. At dusk Rapp shares her malasada without comment. Heal 20%.
> **TUPP (defeat):** "We'll be back! When it's—" **ZIPP:** "Tuesday!"

### E5.2 *The Aether House* (`xe.alola.aether-house`) — Street

*Trigger: Ula'ula, before Raid 1. A worn building with a white logo. Children. One of them is not playing.*

> **BOY:** "They took Cap'n. The Skull guys. They said they were 'borrowing' him. I said for how long. They laughed."
> **ACEROLA:** "The Foundation built this place for kids with nobody. Then it stopped sending money. Then it stopped sending *letters*. I do the cooking now. I'm eleven."
> *(At the door, later: Plumeria, alone, holding a Yungoos by the scruff like a kitten.)*
> **PLUMERIA:** "One of my idiots took this. From an *orphan*. I've dealt with it."
> **PLUMERIA:** "Don't look at me like that. I've got forty kids in a town with no roof who think I'm their big sister. Somebody's got to have standards."
> **PLAYER (choice):** ["Why stay with him?"] → **PLUMERIA:** "Guzma? 'Cause he took every one of us in when the island said we were nothing. He's a mess. He's *our* mess." `alola.x.plumeria = respect`. / [Take the Yungoos in for her] → **The Hood** is watching from the roof; it follows the player. / ["Who paid for Po Town?"] → *(She says nothing for a while.)* "…White boat. Every month. I never asked. I should've asked." Intel +5.

### E5.3 *Rent* (`xe.alola.rent`) — City

*Trigger: the Po Town police station, outside the wall. An old man in a red shirt is asleep on a sofa under eleven Alolan Meowth.*

> **NANU:** "Mm. Visitor. Don't mind the cats. They're the staff."
> **NANU:** "I'm the kahuna here. I'm also the police. I'm also the landlord. Those kids over the wall pay me rent to *exist* near them. Keeps them from thinking nobody's watching. Somebody ought to be watching."
> **PLAYER:** "You could clear the town in an afternoon."
> **NANU:** "Sure. And then forty kids with nowhere to go are forty kids with nowhere to go *and* no wall. I was a cop for thirty years. You learn the difference between a problem and a place to put one."
> **PLAYER (choice):** ["Who's really behind them?"] → **NANU:** "Somebody with money and a boat and a nice smile. I've met the type. Used to hunt things that came through holes in the sky. Lost a partner doing it. Don't ask." Intel +4. / [Ask for help] → He will hold Ula'ula on the Siege Map, "since I live here anyway". / [Pet a Meowth] → It allows it. Heal 10%.

### E5.4 *The Trophy Room* (`xe.alola.guzmas-room`) — City

*Trigger: a house on Route 2, after Raid 1 is offered. A tired woman lets the player in. A man is watching golf with the sound up.*

> **GUZMA'S MOTHER:** "His room's upstairs. I haven't moved anything. He was such a *serious* little boy."
> *(A shelf of trophies. Every one is second place. A rack of golf clubs, each bent in the middle, the same way.)*
> **GUZMA'S FATHER** *(from downstairs, not turning round)*: "Kid never could finish anything. I tried to toughen him up. You see how that went."
> *(Under the bed, a Wimpod. It is looking at the door, as it has every day for years.)*
> **PLAYER (choice):** [Touch nothing; sit on the floor] → The Wimpod comes out. `sv.skull.lil-g` joins. `alola.x.room = seen`. / [Take a trophy] → A Key Item, **Second Place**. Showing it to Guzma in Phase 3 enrages him: his team gains +1 Attack and he loses the ability to think (his AI drops one tier). / [Straighten a golf club] → It will not straighten. The father says, "Leave those." It is the only time he sounds afraid.

### E5.5 *The Gallery* (`xe.alola.gallery`) — Region

*Trigger: Aether Paradise, during or after Raid 2. A private room. White. Very cold. Rows of glass.*

> *(A Pikachu, mid-leap. A Slowpoke, yawning. A Corsola. A Petilil. Dozens. Frost on the inside of each tube. And at the end, in the tallest case, a palm-necked Exeggutor with three grinning heads.)*
> **LILLIE** *(in the doorway; she has not come in)*: "Mother calls them her children. She says she's keeping them beautiful. She used to say the same about me. She chose my clothes until I was eleven."
> **LILLIE:** "That one was Father's. Tall Tale. It used to carry me on its neck. She put it in there the week he… and she said, 'There. Now one of them has to stay.'"
> **PLAYER (choice):** [Open one case] → A small one: the Petilil. It thaws, blinks, and bolts. The alarm trips. / [Open Tall Tale's] → *(Battle: `ss.aether.tall-tale`, Tier 3. All three heads are crying. It does not stop smiling.)* / [Leave them; mark the room] → Intel +5; in Phase 4 the whole gallery can be released at once.
> **LILLIE:** "I ran away with a Pokémon in a bag because I couldn't watch her put it in a tube. That's the bravest thing I've ever done, and I did it shaking."

### E5.6 *The Consultant* (`xe.alola.consultant`) — Border

*Trigger: any Aether-staffed Pokémon Center at world state 3, or the Paradise's lower lab. A tall man in a dark coat among all the white.*

> **ELDES:** "You are the trainer from the reports. Kanto, Johto, Hoenn, further. You have met my colleagues. I will not apologize for them. I will say that I am not *like* them, and I will understand if you find the distinction thin."
> **ELDES:** "I am here to advise the President on the Conservation Hold. It preserves a Pokémon exactly as it is. No pain. No change. She finds that… consoling."
> **PLAYER:** "And you?"
> **ELDES:** "I find that I have been asked not to mention a certain small island to her. I am a man who follows instructions." *(He looks directly at the player.)* "*I* have been asked not to mention it. You have been asked nothing at all."
> **PLAYER (choice):** ["Which island?"] → **ELDES:** "I could not possibly say that it is north of Akala and has a great many beans." Unlocks *The Pelago*. / [Challenge him] → **ELDES:** "If you wish. I will not use my strongest. That is not contempt. I am simply tired of winning for them." *(Battle. Trait: **Reluctant Hand**: his Pokémon never land a critical hit and never use a move that would knock out a Pokémon already below a quarter HP; announced.)*

*Writes: `cipher.seen.eldes`.*

### E5.7 *Recon* (`xe.alola.recon`) — Border

*Trigger: any node at world state 4. Two figures in white-and-blue suits are examining a palm tree with instruments. They greet the player by raising the wrong hand, in the wrong shape, with great sincerity.*

> **DULSE:** "Greetings. We are from a place you would call 'elsewhere'. Our world's light was taken, a long time ago, by a being that was in pain. We live in a tower in the dark."
> **ZOSSIE:** "Your sun is *so bright*! Is it always on? Do you get to keep it?"
> **DULSE:** "The wall between your world and the others is being worn thin from this side. On purpose. We came to say: please do not. What lives in the thin places is not unkind. It is only lost, and frightened, and very strong."
> **ZOSSIE:** "This is Beans! He's a Poipole! He came with us! He likes your sun too!"
> **PLAYER (choice):** [Ask about the light-thief] → Intel +4; a line of foreshadowing for `docs/GRAND_ARC.md`. / ["Can I hold Beans?"] → **ZOSSIE:** "…Do you want to *keep* him? Captain said I mustn't ask anyone. But you asked *me*!" `sv.aether.beans` joins. / [Show them a Poké Ball] → **DULSE:** "A container for a friend. …Our world has no such thing. Perhaps that is why we lost ours."

### E5.8 *The Pelago* (`xe.alola.pelago`) — Region

*Trigger: after* The Consultant*, a boat ride of one node. A dot of an island. Bean rows. Hammocks. Stray Pokémon everywhere, all of them content.*

> **THE MAN AT THE PELAGO:** "Hello, hello! A visitor! Sit, have a bean. I grow them. I don't know why. My hands seemed to know how."
> **THE MAN:** "I woke up on that beach some years back. Not a thing in my head. The Pokémon here looked after me, so now I look after them. It seems a fair trade!"
> *(He hums as he works. A lullaby. If Lillie's or Gladion's name has come up in the player's region, the game lets the player recognize it.)*
> **PLAYER (choice):** ["What's the song?"] → **THE MAN:** "This? I don't know. It comes when I'm happy. I think I used to sing it *to* someone. Two someones? Small." *(He stops humming. He looks at his hands.)* "…Isn't that strange." `alola.x.mohn = found`. / [Say nothing; help with the beans] → *(One rest node.)* Heal to full. He gives the player a **Rainbow Bean**. / [Tell him who he is] → **THE MAN:** "I… no. No, I don't— that's a lovely story. I'd like it to be mine. But I can't *find* it." *(Not yet. The flag is set anyway.)*

*With `alola.x.mohn = found`, Tall Tale can be purified, and one option opens in Phase 6 and one in Phase 8.*

---

## E6. Raids, Expanded

### E6.1 Raid 1 — "Po Town", deeper

**New phase order:** Gate → **The Rain Wall** *(new)* → Square → **The Shady House** *(new rooms)* → Mansion.

**The Rain Wall.** It is always raining in Po Town and nowhere else. Tupp, Rapp and Zipp man a barricade of shopping trolleys.

> **RAPP:** "Password."
> **PLAYER:** "…"
> **RAPP:** "There isn't one. Boss says a password's just a door for people who can read. Battle or go home."
> *(With `alola.x.bars`, Tupp vouches for the player and the barricade opens.)*

**The Shady House.** A ruined mansion that forty kids have made into a home with spray paint and stolen furniture. A small figure in a rag with a bandana tied round its neck opens the front door from inside.

> *(It is a Mimikyu. It looks up. It holds the door. This is `sv.skull.doorman`.)*
> **SKULL GRUNT (kitchen, stirring a pot):** "Yo, wipe your feet. Big Sis'll kill you. *Then* me."
> **SKULL GRUNT (stairs):** "I failed my trial at eleven. My dad said don't come back till I passed. That was four years ago. Boss said, 'So don't go back.' Best thing anyone ever said to me."

In the cellar, in a paddling pool, sulking: **Rent Money** (`ss.skull.rent-money`). Nobody here knows how to give a Totem back.

**Guzma, extended.** He is on a throne made of two armchairs.

> **GUZMA:** "Ya boy Guzma's home! And who's this? Somebody the island *likes*. Somebody who got a trial and a pat on the head."
> **GUZMA:** "You know what I got? Second place. Eleven times. Know what my old man did with second place?"
> *(Battle. If `alola.x.room = seen`, the player may answer: "I've seen the clubs." His first move is skipped.)*
> **GUZMA (defeat, extended):** "Guzma! What is *wrong* with you!" *(He hits himself in the head, twice, hard. Plumeria catches his wrist the third time. She does not let go.)*

### E6.2 Raid 2 — "Aether Paradise: Conservation Area", deeper

**New phase order:** Entrance → Conservation Area → **Sublevel B2** *(new)* → Lab → Gate Room.

**Sublevel B2.** Not on the visitor map. Curator Pua keeps it.

> **CURATOR PUA:** "These are the ones we couldn't release. Too hurt, too frightened. We keep them stable. It's for the best."
> **PLAYER:** "Stable how?"
> **CURATOR PUA:** "They don't get worse." *(A pause.)* "They don't get anything. It's for the best."
> *(Battle: Pua. Her Pokémon are Preserved.)*

A terminal here holds the **Beast Killer file**: three Type: Null, numbered. One was stolen by the President's son. One is in cold storage in her room. One "exceeded containment on Ten Carat Hill and is presumed viable". Intel +5; unlocks the full version of Raid 3.

**Wicke** finds the player in the lift.

> **WICKE:** "Oh! Oh, you shouldn't be— no, you *should*. Somebody should. Here: this opens the lab. I've been carrying it for a month, hoping someone would bump into me."

**Faba, extended:**

> **FABA:** "I am the *last line of defense* of the Aether Foundation! It says so on my door! I had the door made!"
> **FABA (defeat, extended):** "This changes nothing! I have *other* prospects. A gentleman called only yesterday. Very well dressed. Large letter on his chest." *(He realizes he has said this aloud.)*

### E6.3 Raid 3 — "Ten Carat Hill", deeper

**New phase order:** The Cave → Gladion → **Farthest Hollow** *(new)*.

**Gladion, extended:**

> **GLADION:** "Mother made three of them to kill gods. Then she got scared of what she'd made and put masks on them so they'd stay quiet. I took one. I named it Null because that's what she'd made it."
> **GLADION (defeat, extended):** "…It's not Null anymore. I should call it something else. I'm bad at names. Don't help."

**Farthest Hollow.** The third one. It has been alone here since it broke out. The control helmet has grown into the scar tissue.

> *(Battle: `ss.aether.null-three`, Tier 4. It cannot be reasoned with by force. Each turn the player does **not** attack it (heals, protects, or simply waits) counts once. Gladion's Silvally, if he is an ally, stands in front of it and takes hits without answering. At five counts the helmet cracks down the middle.)*
> *(Under it: an ordinary, frightened face. It has never seen the sky without a visor.)*
> **GLADION:** "There you are. …I'm bad at names. You pick."

Freed, it becomes a Silvally and may join the player or stay with Gladion.

### E6.4 Raid 4 — "The Guardian in Glass" *(new)*

**Scale:** Region. **Offered:** world state 3 or higher, by Kahuna Olivia.
**Offer:** *"The Foundation came to the Ruins of Life with clipboards and a very nice letter. They said Tapu Lele was 'at risk'. At risk of* what*? It's a* god*."*
**PR:** `pr.alola.ruins-of-life` — 4 areas: The Sealed Door → The Offering Hall → The Cold Room → The Altar. **Security:** white containment doors, a cooling system that lowers Speed each turn it runs, polite staff who call for help in a whisper.
**Objectives:** *Primary:* free Tapu Lele. *Secondary A:* shut down the cooling. *Secondary B:* defeat Curator Pua. *Secondary C:* bring three voices.

**Phases**

1. **The Sealed Door.** An Aether Employee with a lanyard.
   > **AETHER EMPLOYEE:** "I'm so sorry, the site is closed for conservation. Would you like a leaflet? It explains why this is for the best."
2. **The Offering Hall.** Berries left by islanders have been tidied into labelled trays.
3. **The Cold Room.** Curator Pua, again, sadder.
   > **CURATOR PUA:** "It scattered its scales over the whole island, for fun, to see who'd fight over being healed. That's not safe. That's not *responsible*. In here it can't hurt itself or anyone."
   > **PLAYER:** "It's not hurt."
   > **CURATOR PUA:** "It will be. Everything is, eventually, if you let it out."
4. **The Altar.** The guardian in a column of frost, bound (`ss.aether.guardian-in-glass`).
   > *(Battle: Tier 3. It cannot be purified by the player alone. **Secondary C:** Olivia calls it, and with her any three people of Akala the player has helped this region (shop owners, the bus-stop Grunts if they were fed, the boy from the Aether House if he is visiting). Each voice is −20 Corruption.)*
   > **OLIVIA:** "Lele! You vain, careless, beautiful thing. Come out and cause trouble. We *miss* it."

**Results (Lever: *The Guardians*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | Tapu Lele free; the cooling destroyed; three voices | **The islands wake:** all four guardians hold their islands on the Siege Map; Phase 7 cannot be lost | −3 |
| **Success** | Tapu Lele free | Akala is Held | −2 |
| **Partial** | The cooling is off, the seal remains | No change | −1 |
| **Failure** | You are walked out, with a leaflet | **A second exhibit:** the Foundation moves on another ruin; one more island starts Lost | +2 |
| **Declined** | The ruin stays white | A second exhibit | +1 |

**Failure consequences:** **C7 (Occupation), C8 (Reputation fall), C11.**

### E6.5 Raid 5 — "The Fifth Island" *(new)*

**Scale:** Region and Border. **Offered:** after Raid 1 and Raid 2 have both been offered, by Gladion or by Plumeria, whichever the player has spoken to more.
**Offer (Plumeria):** *"She's throwing him a party. White tablecloths. She's going to make him a* kahuna*. He's been practising his bow in the mirror. I've never been so scared of anything in my life."*
**PR:** `pr.alola.aether-gala` — 4 areas: The Dock → The Terrace → The Private Office → The Dais. **Security:** a guest list, staff who escort the under-dressed to the door, glass floors over the Conservation Area.
**Objectives:** *Primary:* get the truth to Guzma before he kneels. *Secondary A:* reach Lillie. *Secondary B:* find out who Faba is meeting. *Secondary C:* take Eldes's report.

**Phases**

1. **The Dock.** Skull Grunts in borrowed white jackets, sleeves too long.
   > **SKULL GRUNT:** "Yo, we're *catering*. Don't tell nobody. Boss said be respectful. I don't know which fork is the respectful one."
2. **The Terrace.** Lillie at a lectern, in Foundation white, a prepared speech in both hands.
   > **LILLIE** *(reading)*: "'It is my honor, as heir, to…'" *(She sees the player in the crowd. She folds the paper once.)* "No. I'm sorry. I'd like to say something else."
   > *(If the player reaches her first, she says it. If not, a staff member takes her arm, kindly.)*
3. **The Private Office.** Two doors. Behind one, Faba is shaking hands with a man whose face is turned away; all the player sees is a black sleeve and, on the desk, a single red letter on a card. Intel +5; `rocket.rainbow.contact = true` for `docs/GRAND_ARC.md`. Behind the other, Eldes, alone, with a folder.
   > **ELDES:** "This is a report on the survivor of an accident. I am forbidden to deliver it. I am going to put it on this desk and look out of the window for one minute."
4. **The Dais.** Lusamine, radiant, a lei of white flowers in her hands. Guzma in front of her, in a jacket that almost fits.
   > **LUSAMINE:** "Every island has its kahuna. Mine has gone without for too long. You were overlooked, dear boy. They always overlook the ones who need it most. I never have."
   > **GUZMA** *(very quietly; nobody has ever heard him be quiet)*: "…Yeah. Yeah, okay. Okay."
   > **PLAYER (choice):**
   > - **[Show him the white boat's ledger]** *(needs Plumeria's Intel)* → Payments to Po Town, monthly, under the heading DISTRACTION.
   > - **["Ask her what Skull is *for*."]** → He does. She answers him honestly. She has never seen a reason not to.
   > - **[Say nothing; let Plumeria speak]** *(needs `alola.x.plumeria = respect`)* → **PLUMERIA:** "G. Look at me. Not her. *Me.* Who came and got you every time?"
   > **LUSAMINE:** "Oh, don't make that face. Of course you were a diversion. A *wonderful* one. I meant every kind word. I simply also had a use for you. Can't both be true?"
   > **GUZMA:** *(He takes the lei off. He holds it. He does not throw it. He puts it down on the dais very carefully, the way you put something down when your hands are shaking.)*

**Results (Lever: *The Decoy*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | Guzma knows; Lillie has spoken; the report is taken | **Skull walks:** no Skull Grunts in the climax (Phase 1 −1, Phase 2 −1); Guzma fights beside the player from Phase 4 | −3 |
| **Success** | Guzma knows | Guzma's Phase 3 duel is skipped | −2 |
| **Partial** | He has heard it and does not believe it | No change | −1 |
| **Failure** | He kneels. He is crowned | **Kahuna Guzma:** his Phase 3 team is one level higher and Ya Boy is Tagged-Up *and* Preserved | +2 |
| **Declined** | He is crowned | Kahuna Guzma | +1 |

**Failure consequences:** **C6 (Hostage: Lillie), C4 (Strength surge), C11.**

---

## E7. The Climax — Extended Cut: "What We Keep"

Checkpoints are after Phase 2 and at the Breather.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | Broadcast and Choice | — | base §10.1–10.3 | 0 |
| 0b | **Four Islands** | Siege Map | new | 0 |
| 1 | **The Crossing** | Blackout | new | 2–3 |
| 2 | The Approach | Gauntlet | base Phase 1, extended | 4–6 |
| 3 | The Boss and the Chief | Duels | base Phase 2, extended | 1–3 |
| — | **Breather** | Rest | new | 0 |
| 4 | The Gate | Set piece | base Phase 3, extended | 2–4 |
| 5 | Lusamine | Boss | base Phase 4, extended | 1 |
| 6 | **The Deep: The Mother Beast** | Colossus | new | 1 |
| 7 | **The Beasts Come Through** | Front | new, conditional | 2–4 |
| 8 | Resolution | — | base §10.9, extended | 0 |

### E7.1 Phase 0b — Four Islands (Siege Map)

| District | Held if… | If Lost |
| --- | --- | --- |
| **Melemele** | The player rapped back, or waited for the bus | Skull's blockade in Phase 1 has one more boat |
| **Akala** | Raid 4 Success or better (Olivia and Tapu Lele) | *Thin Light* is stronger: glimpses every 2 turns |
| **Ula'ula** | Nanu was asked | Rent Money, if not returned, fights in Phase 2 |
| **Poni** | Dulse and Zossie were met, and the player was civil | No warning before Phase 7 |
| **Aether Paradise** | Never | See Phase 2 |

> **NANU** *(by radio, bored)*: "Ula'ula's fine. I've deputized the cats. Go do the hero thing. I'll be on the sofa."

### E7.2 Phase 1 — The Crossing (Blackout)

A boat to the Paradise under a sky with holes in it. **Condition — *Thin Light*:** every third turn something on the far side of the sky strikes one random Pokémon on the field, either side, for 1/8 HP (announced as "a glimpse"). It ends at the dock, or does not apply at all if **Beans** is with the player.

Skull's last blockade is three rowing boats lashed together.

> **TUPP:** "End of the line! By order of Kahuna— of the Boss! Of *Kahuna Boss*!"
> **RAPP:** "He doesn't know what to call him either. None of us do. He came back from that party *different*."
> *(After a Raid 5 Triumph there is no blockade. The three of them are on the dock, holding the mooring rope for the player.)*
> **ZIPP:** "…Rope."

### E7.3 Phase 2 — The Approach (extended)

| Area | Trainer | Notes |
| --- | --- | --- |
| Dock | Skull Grunts ×2 | base; absent after a Raid 5 Triumph |
| Entrance | Aether Employees ×2 | base |
| **Reception** | Aether Employee with a leaflet | Not a battle if the player takes the leaflet and reads it aloud. It is long. |
| Conservation Area | Gladion (if foe) | base; an ally after Raid 3 Success or better |
| **Sublevel B2** | Curator Pua | Preserved team; absent if beaten in Raid 4 |
| Lab | Plumeria with **Big Sis** | Trait: **Venom Toll**; see below |
| Gate Room door | Faba with **Promotion** | Trait: **Barrier Mind** |

> **PLUMERIA:** "I'm not here for her. I'm here because *he's* in there, and wherever he is, that's where my kids think home is. Move me if you can."
> **PLUMERIA (defeat):** "Good. You're strong enough. Go get my idiot back."
> *(With `alola.x.plumeria = respect` and Raid 5 Success or better, she does not fight. She walks with the player as far as the door.)*

### E7.4 Phase 3 — The Boss and the Chief (extended)

**Duel 1 — Guzma** (base), as himself or as **Kahuna Guzma**.

> **KAHUNA GUZMA:** "Kahuna of Aether. Got a ring to it. Got a *jacket*. You know how long I waited for a jacket?"
> **GUZMA (if he knows):** "She told me. To my face. Smiling. You know the worst part? I'm *still here*. 'Cause where else has ya boy got?"
> **PLAYER (choice, if he knows):** ["Po Town."] → **GUZMA:** "…That dump." **PLUMERIA:** "*Our* dump." *(No battle.)*

**Duel 2 — Faba** (base).

**Duel 3 — Eldes** *(new)*. He is standing in front of the last door with his hands behind his back.

> **ELDES:** "I am required to stop you. I have been required to do a great many things. I find I can meet this requirement in a very *literal* fashion."
> *(Battle, with **Reluctant Hand**. He sends out one Pokémon. When it faints he does not send another.)*
> **ELDES:** "There. I have opposed you. It is on the record." *(He holds out a disc and a folder.)* "This is the lock's design. And this is the name of a small island. I should have given her the second one years ago. I told myself it was not my decision. It is remarkable what a man can tell himself, in a white room."

*Reward:* **Data ROM A: "Kindness"**. If the report was not taken in Raid 5, it is given here.

### E7.5 Breather

Wicke's office. A kettle. A paper bag.

> **WICKE:** "Malasadas. I bought too many. I always buy too many, I keep thinking the children will come back. Sit down, dear. You're allowed to sit down."

Heal 50%, revive one Pokémon, checkpoint.

### E7.6 Phase 4 — The Gate (extended)

The base set piece (Gate Nodes, Gravity and Magic Room shifting) with these additions.

- **The gallery.** If the room was marked, the player can spend one turn at any node's console to open every case in the President's room. Dozens of thawing Pokémon stream through the Gate Room; for three turns reinforcements cannot reach the player.
- **Nebby.** Lillie is here, in her own clothes, with the bag open.
  > **LILLIE:** "It's all right. You don't have to get in the bag. You never have to get in the bag again."
  > *(Nebby closes one Gate Node by sitting in it. It is exhausted afterwards and becomes very still, and very heavy.)*
- **Guzma,** after a Raid 5 Triumph, holds a node alone. **GUZMA:** "Ya boy's got this one! First thing I ever *finished*!"

**New PA lines** *(Lusamine, from the gate, pleased)*:

> "One node. Oh, well done. I do like determined children. I had two."
> "Two. You'll tire, you know. Everything tires. That's why it needs looking after."
> "Three. Never mind. It's open enough. It only ever needed to be open enough for *me*."

### E7.7 Phase 5 — Lusamine (extended)

The base fight (§10.7) with **Madame** and **Embrace**. The base stage *Fusion* is moved out of this fight and becomes Phase 6.

**New boss stage — *Everything in Its Place*** (at 50% ace HP): she begins to tidy. At the end of each turn the player's active Pokémon is returned to its Ball and replaced by the next in party order (announced: "She puts it back where it belongs."). It ends when Bewear faints.

> **LUSAMINE (opening, extended):** "Lillie. You've done something to your hair. And those *clothes*. Come here and I'll fix it."
> **LILLIE:** "No, Mother."
> **LUSAMINE:** *(A long, pleasant silence.)* "I don't have a daughter who says no. I have a daughter who is perfect. I'll wait for her to come back."
> **LUSAMINE** *(to the player)*: "You think I'm cruel. I'm the only one who isn't. Everyone else lets go. They call it love. They wave from the beach. *I hold on.*"
> **LUSAMINE (if the report is in the player's hands):** "What's that? A file. Eldes's hand. Give it to me." *(She reads one line. The folder drops.)* "…That isn't. No. He would have *come back*. He wouldn't be— *beans*?"
> **LUSAMINE (defeat, extended):** "I'm going where nothing leaves." *(She takes Guzma by the wrist, or tries to; if he knows the truth, he pulls away, and she goes alone.)* "They have no faces to change. No voices to say no. I'll keep them all."

### E7.8 Phase 6 — The Deep: The Mother Beast (Colossus)

*Nebby wakes. It is not small anymore. It carries the player and Lillie through the gate into a sea with no water in it: black rock, glass threads, a hundred pale drifting bells. At the center, the largest of them, and inside it a woman's shape, smiling.*

**Format.** **The Mother Beast** (`ss.aether.mother-beast`, XD010) is a Colossus wrapped in **three veils**. It cannot be knocked out. Each veil is a shield bar, and behind each is something she is holding.

| Veil | What it holds | While it stands | To part it |
| --- | --- | --- | --- |
| **The Collection** | Every Pokémon she ever froze, as glass shapes | Keepsake seals one of the player's Pokémon every third turn | Break the shield; if the gallery was opened, it is already half gone |
| **The Children** | Two small figures, a boy and a girl, in matching white | The player's Pokémon cannot switch out | Lillie speaks; Gladion too, if he is an ally |
| **The Husband** | An empty shape, the outline of a man | She heals 10% each turn | Break the shield; or, with `alola.x.mohn = found`, say where he is |

**Timer:** 12 turns. **Adjustments:** Guzma, if he came through with her, is tangled in the threads and frees himself at the first veil ("Ya boy is NOT a keepsake!"); Nebby takes one Keepsake for the player; Beans, native here, cancels one veil's rule for two turns.

> **THE MOTHER BEAST:** "Look how still they are. Look how they stay."
> **LILLIE** *(second veil)*: "Mother. I'm not perfect. I'm not finished. I'm going to change and you're going to *miss* it if you stay in here."
> **GLADION:** "You made three monsters to protect us from the thing you're wearing. I took one. I named it. It's *fine*. We're fine. Come and see."
> **THE MOTHER BEAST** *(third veil; the chord under her voice wavers)*: "He left. He walked into the light and he *left* me."
> **PLAYER (if `alola.x.mohn = found`):** ["He didn't leave. He's lost. He grows beans. He hums the lullaby."]
> *(The largest bell goes dark. The woman inside it is only a woman, floating, and very tired.)*
> **LUSAMINE:** "…Which one?" *(Lillie hums it.)* "Oh."

**When the third veil parts:** Nihilego lets go. It was never holding her. It drifts back to the others, small.

**If the timer runs out:** Nebby pulls everyone out and the gate collapses with her on the far side. The climax is won if she was beaten in Phase 5, but XD010 enters the Region of Doom and Phase 7 is certain.

### E7.9 Phase 7 — The Beasts Come Through (Front, conditional)

*Happens if the gate was not closed cleanly: the timer ran out, or the Resolution leaves a window.* Four tears, four islands.

**Format: Front,** four lanes: Buzzwole or Pheromosa on Melemele, Xurkitree on Akala, Guzzlord on Ula'ula, Celesteela or Kartana on Poni. The player acts in one lane per turn. An island that is Held has its kahuna and guardian in the lane and will hold it without help. An island that is Lost has nobody.

> **DULSE** *(arriving, urgent, if Poni is Held)*: "They are not attacking. They are *afraid*. Do not destroy them. Show them the way back. We will hold the door."
> *(Each Beast needs to be brought below half HP, not knocked out, and then it turns for its tear. A Beast knocked out stays in Alola as a wild legend for the Region of Doom.)*
> **NANU** *(on Ula'ula, as something the size of a hill eats a road sign)*: "Used to do this for a living. Hated it then." *(He cracks his neck.)* "Persian. Let's go and be gentle at it."

After a Raid 4 Triumph this phase plays itself: all four islands hold, and the player only watches.

### E7.10 Phase 8 — Resolution (extended)

The Gate choice (base §10.9) with these additions.

- **The Pelago.** If `alola.x.mohn = found` and Lusamine came back: a boat, a small island, bean rows. She gets out. He looks up and smiles at a stranger. *She does not tell him.* She asks if she can help with the beans. **THE MAN:** "Of course! Do you know, I've the oddest feeling you're good at this." Tall Tale, if it was freed, is already there.
- **Guzma.** [Send him home to Po Town] (Skull becomes the town's own, legally; Nanu signs the lease, sighing) / [Send him to Hala] (he restarts his island challenge at twenty-something, to enormous mockery, and finishes it) / [Let him choose] (he does both, badly, at once).
- **The Foundation.** The base option to hand it to its staff now names Wicke as President and Gladion, unwillingly, as her deputy. Sublevel B2 is the first floor she closes.
- **Faba.** If the player saw the card on his desk: [Tell Wicke] (he is demoted to reception, and the leaflet becomes his to hand out) / [Say nothing] (the door he opened stays open; see `docs/GRAND_ARC.md`).

### E7.11 Rival and Stand-with additions

- **Help:** the rival holds an island in Phase 7. *Line:* "It's forty feet tall and it's *crying*. I can't hit it. Can I— I'm going to try talking. Don't laugh."
- **Beat-you:** the rival is found in the gallery, in an empty tube that had been made ready, unhurt, cold, furious.
- **Side-with:** the rival is **Li'l Kin**. The Turn happens in the Shady House kitchen, not in a battle: the player is handed a ladle.
- **Stand with them:** as **Numbskull Number One**, the player's loyalty is to Guzma, and the route ends at Raid 5 one way or another. As **the Deputy Director**, the player holds the gate for Lusamine in Phase 4 and must decide in Phase 6 whether to help part the veils from inside. See `scripts/10_STAND_WITH_THEM.md` §7; the new line is Lusamine's: "Deputy. You've never once tried to leave. I can't tell you what that means to me. I shan't ever let you."

---

## E8. Aftermath and the Thread

- **Po Town:** it stops raining on a Wednesday. Nobody knows what to do. Rapp opens a window.
- **Rent Money** is escorted back to Verdant Cavern by forty Skull Grunts in procession. Tupp writes a rap about it. It is not good. It is sincere.
- **The Aether House** gets a letter, and then money, and then Wicke herself, with too many malasadas.
- **Lillie** cuts her hair.
- **Dulse and Zossie** go home with one photograph: the sun, slightly out of focus, with Zossie's thumb in the corner.

**The Thread (`docs/GRAND_ARC.md`).** **Data ROM A: "Kindness"** is the last piece of the lock: the earlier ROMs take a will by pulse, by rhythm, by weight, by chain, by a let-go, by a drain. This one takes it by *convincing the holder it is for the best*. Eldes has added a page in his own hand: every site Cipher has used, in order, and at the end of the list an island fortress and one line: *"XD001 is nearly ready. It was built from all of these. Stop my father."*

> **ELDES (last line of the page):** "I am aware that I have no right to ask. I am asking. — E."

---

## E9. Dialogue Bank

### E9.1 New ambush lines

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Skull (Rapping) | "Yo, check it: your team's *wack*, give it back, that's a— that's a *fact*!" | "I had a fourth line. You didn't let me do the fourth line." |
| Grunt — Skull (Homesick) | "I'm s'posed to shake you down. Got any food instead? Serious question." | "…So, about the food." |
| Grunt — Skull Caterer (Out of place) | "I'm in a *jacket*. Don't make this worse." | "Got soup on the jacket." |
| Grunt — Aether Employee (Polite) | "I'm terribly sorry, but I do have to stop you. Would you like a leaflet first?" | "Do take the leaflet anyway." |
| Grunt — Aether Collector (Sincere) | "That one looks stressed. We can take it off your hands. It's for the best." | "It… didn't look stressed just then. It looked happy." |
| Specialist — Aether Cryo-Tech (Careful) | "Please don't break anything. Some of them have been still for *years*." | "…That one moved. Did you see? It *moved*." |
| Lieutenant — Tupp (Loud) | "It's ya boy's boy! Tupp! In the—" | "—dirt. In the dirt. Fine." |
| Lieutenant — Rapp (Bored) | "I'd rather not. You'd rather not. Let's get it over with." | "Told him it was Thursday." |
| Lieutenant — Curator Pua (Gentle) | "I'll be as kind as I can. It's for the best." | "…Is it? I've said it so often." |
| Second — Plumeria (Blunt) | "You hurt one of my kids, I end you. You help one, I owe you. Which is it today?" | "Owe you, then. I hate owing." |
| Executive — Faba (Pompous) | "Branch Chief Faba! *The* Branch Chief! There is only the one branch!" | "I shall be writing a memo!" |
| Liaison — Eldes (Grave) | "I regret this. I say so before, since afterwards it sounds like an excuse." | "As it should be." |

### E9.2 Leader barks

| Moment | Guzma | Lusamine |
| --- | --- | --- |
| Player lands a super-effective hit | "Tch! Lucky! …Nah. Not lucky. I know lucky." | "How rough. You'll bruise it." |
| Player's Pokémon faints | "That's what happens! That's what *always* happens!" | "There. Now it's resting. Isn't that better?" |
| Their Pokémon faints | "Get up. Get— nah, stay down, buddy. You did good. I mean it." | "You've spoiled it. I'll have to put it away." |
| Player heals | "Oh, you get *do-overs*? Must be nice!" | "You see? You look after yours too. We're the same, you and I." |
| A Shadow Pokémon disobeys the player | "Hah! Yours don't listen either! …That ain't funny, actually." | "It doesn't want to be yours. Poor thing. Give it to me." |
| Last Pokémon each | "One left. Story of my life. *Second place.* Not today." | "Just us, then. I do so prefer it when it's just us." |

### E9.3 Graffiti (seen on walls, by world state)

| Step | Tag |
| --- | --- |
| 1 | SKULL WUZ HERE. *(Under it, smaller, different paint:)* so was I. nobody asked. |
| 2 | BORROWED NOT STOLEN. *(Crossed out. Rewritten:)* borrowed. *(Crossed out again.)* |
| 3 | WHERE DID ALL THE WINGULL GO |
| 4 | THE SKY IS LEAKING. *(Next to it, a careful stencil of a jellyfish.)* |
| 5 | BIG SIS SAYS COME HOME. ALL OF YOU. NOW. |

### E9.4 Civilians by world state

| Step | Line A | Line B |
| --- | --- | --- |
| 1 | "Those Skull kids sprayed the trial gate. In *pink*. I'm almost impressed." | "They're loud, but have you seen where they live?" |
| 2 | "They 'borrowed' my Rockruff. Brought it back fed and washed. I don't know what to think." | "The Foundation people are lovely. So *clean*." |
| 3 | "They took in every stray on the beach. For conservation. The beach is very quiet now." | "My grandmother left a berry at the ruins. The door was shut. It's never been shut." |
| 4 | "Something looked at me out of the sky last night. I don't mean a bird." | "Two people in funny suits asked me what a 'sunset' was for." |
| 5 | "It's noon and it looks like evening." | "The kahuna says don't be afraid of what comes through. Be afraid for it." |

### E9.5 Announcer lines for special Pokémon

| Pokémon | On entry |
| --- | --- |
| Any Tagged-Up Pokémon | "It sprays a tag. Your Pokémon has been called out!" |
| Any Preserved Pokémon | "It was kept very carefully." |
| Ya Boy | "Ya Boy is in the house!" |
| The Doorman | "The Doorman holds the door." |
| Nebby | "Nebby is out of the bag." |
| Null Three | "The shadow tightens. Something behind the mask is trying to get well." |
| The Mother Beast | "She is choosing what to keep." |

---

## E10. Flags and Wiring

| Flag | Set by | Read by |
| --- | --- | --- |
| `alola.x.quiet` (0–5) | Raids, climax schedule | Regional rules, graffiti, civilians |
| `alola.x.bars` | *Yo* | Raid 1, Siege Map |
| `alola.x.plumeria` (`respect`) | *The Aether House* | Raid 5, Phase 2, Phase 3 |
| `alola.x.room` (`seen`) | *The Trophy Room* | Raid 1 |
| `alola.x.gallery` (`marked` / `opened`) | *The Gallery* | Phase 4, Phase 6 |
| `alola.x.mohn` (`found`) | *The Pelago* | Tall Tale, Phase 5, Phase 6, Phase 8 |
| `alola.x.guzma` (`knows` / `crowned`) | Raid 5 | Phases 1–4 |
| `alola.x.gate` (`closed` / `collapsed` / `window`) | Phase 6, Phase 8 | Phase 7, Aftermath, Region of Doom |
| `rocket.rainbow.contact` | Raid 5 | `docs/GRAND_ARC.md` |
| `cipher.seen.eldes`, `cipher.rom.a` | *The Consultant*, Phase 3 | `docs/GRAND_ARC.md` |

**Counts for this file:** 16 named characters (6 new officers and visitors, 10 team versions and allies), 13 special Pokémon across two lines, 5 special Shadow Pokémon (1 Apex), 8 story events, 3 deepened raids and 2 new raids, an 8-phase Extended Cut, and 5 dialogue tables.
