# THE REGION OF DOOM — EXPANDED EDITION

**Extends:** `docs/REGION_OF_DOOM.md` (every rule there still holds; this file adds to it)
**Read with:** `docs/GRAND_ARC.md`, `docs/expanded/SHADOW_POKEMON_SYSTEM_EXPANDED.md`, `data/doom_leaders.json`
*Canon characters appear here only when a player's own history sends them. Every district, landmark, placeholder Leader and Chairperson is original to this project.*

---

## X1. What this file adds

The base document says what the Region of Doom is made of: 14 districts, 8 Gyms, a Doom Level and a final room. This file says what it is like to walk through.

| Section | Adds |
| --- | --- |
| X2 | The place in the story: what people call it and how you arrive |
| X3 | All 14 districts in depth, and five annexes that appear from Expanded Edition results |
| X4 | The Doom Level, step by step |
| X5 | The eight Gyms: arenas, rules, Doom Marks |
| X6 | The sixteen placeholder Leaders, with voices |
| X7 | The Chairperson and the last room |
| X8 | Takeovers in depth |
| X9 | What the Grand Arc leaves here |
| X10 | Who you meet, and why |
| X11 | Sixteen events |
| X12 | The Black Market Mile catalog |
| X13 | The Pale Garden |
| X14 | Rewards and the Epitaph |
| X15 | Dialogue bank |
| X16 | Three worked ledgers |
| X17 | Tests |

---

## X2. The place in the story

Nobody who lives there calls it the Region of Doom. That is the name on League paperwork. Residents call it **the Margin**: the strip of coast and old industry that sits between other regions' maps and belongs to none of them.

**Why it exists.** Every team that was not finished had to go somewhere. An Executive who slipped a cordon, a Leader who was pardoned and found no town that wanted him, a division that the player never fought because they chose to stay out: all of them drifted to the one place with no Gym circuit, no Champion and a harbor that does not ask for papers. The Margin is made of what the player left undone.

**How you arrive.** A ferry with no timetable leaves from the last port the player visited. It docks at **the Tollgate**, a customs shed where a clerk stamps the player's Trainer Card with whatever the Doom Ledger says about them.

> **TOLLGATE CLERK** *(reading the card, by ledger)*:
> - *(mostly sealed)* "You're the one who closes things. We don't get many of you. Mind the Mile."
> - *(mostly stayed)* "You're the one who walks past. Half this town owes you its job. They won't thank you."
> - *(any pardoned)* "You let one go. He's got a Gym now. He asks after you."
> - *(any triumphant)* "They won, where you come from. Some of them retired here. Winners' district is up the hill."
> - *(empty ledger)* "First time? Then it isn't yours yet. Come back when you've left something behind."

**Tone.** The Margin is not a ruin. It is a working town run by people who lost somewhere else. It is funny more often than it is frightening, and the frightening parts are quiet.

---

## X3. The districts in depth

Each district has three landmarks, a standing rule, a Takeover objective (X8) and one named local who is always there, whatever the ledger says.

### 1. Rocket Row
*A street of arcades with the prize counters boarded over, the top six floors of an office tower that was moved here one floor at a time, and a radio studio that still has its ON AIR lamp lit.*

| | |
| --- | --- |
| **Landmarks** | The Corner That Never Pays Out · Silph Annex (floors 5–11 only) · Studio R |
| **Held by** | Whichever Rocket entry in the ledger is strongest: Team Rocket, Rocket Returns, or the Remnants |
| **District rule** | *House Edge:* prize money from battles here is halved; the Game Corner pays it back double if the player wins the district |
| **Takeover** | Cut the three payout lines, then hold the counting room for 4 turns |
| **Local** | **Dolores**, a prize-counter clerk who has outlasted four bosses and keeps the real books under the till |

### 2. Tide and Ember
*A flooded cave mouth on one side of a headland and a smoking rim on the other. A footbridge joins them. Both sides claim the bridge.*

| | |
| --- | --- |
| **Landmarks** | The Drowned Stair · The Rim Kitchen (a canteen heated by the vent) · The Bridge of Sighs and Shouting |
| **Held by** | Team Aqua or Team Magma; if both are in the ledger, each holds a side and the bridge is Contested |
| **District rule** | *Two Weathers:* rain on the west side, harsh sun on the east, and the bridge alternates each turn |
| **Takeover** | Win one battle on each side within the same visit; the bridge then opens |
| **Local** | **Old Briney's cousin Mabs**, who rows people across under the bridge for a berry and an opinion |

### 3. Chain Quarter
*Stairs cut into a pillar of rock that goes nowhere, and a market at its foot selling links of red chain as lucky charms.*

| | |
| --- | --- |
| **Landmarks** | The Unfinished Stair · Link Market · The Observatory With No Roof |
| **Held by** | Team Galactic |
| **District rule** | *No Applause:* effects that depend on bond or friendship are silent here (they work at half strength) |
| **Takeover** | Climb the Stair in a Convoy of three battles before the market closes |
| **Local** | **Per**, a former Grunt who sells chain links and tells every customer they are fake, which is true |

### 4. Frost Crown
*A frozen canal lined with the hulls of ships that were never meant to be on water. Banners in black and white, some of them the wrong way up.*

| | |
| --- | --- |
| **Landmarks** | The Frigate Rib · The Sages' Table (seven chairs, three ever used) · The Thaw Line, repainted each spring |
| **Held by** | Team Plasma; split between the two halves if `plasma.x.where` recorded a schism |
| **District rule** | *Black Ice:* the first Pokémon each side sends out enters with −1 Speed |
| **Takeover** | Light the three braziers along the canal; each brazier lit removes Black Ice for one side |
| **Local** | **Sister Iola**, who runs a shelter for released Pokémon and has strong views on people who release them |

### 5. Weapon Yard
*A lab complex with its roof gone, and a row of cafés whose basements are all locked from the inside.*

| | |
| --- | --- |
| **Landmarks** | Café Encore · The Dry Fountain · Bay Zero, where something very large was once parked |
| **Held by** | Team Flare |
| **District rule** | *Cover Charge:* entering any building costs money; the price is shown first and is refunded if the player wins inside |
| **Takeover** | Find which of five café basements holds the generator (three clues), then win there |
| **Local** | **Monsieur Hippolyte**, a waiter who knows every member's order and will trade one secret for one honest compliment |

### 6. Po Quarter
*Graffiti to the rooftops. One pink mansion, immaculate, behind a fence.*

| | |
| --- | --- |
| **Landmarks** | Shady House Too · The Wall (everyone's tag is on it, including the player's, added on arrival) · The Malasada Truck |
| **Held by** | Team Skull, or the Aether Foundation if only Aether is in the ledger |
| **District rule** | *Called Out:* the first time each of the player's Pokémon switches in, it is tagged and loses 1/16 HP; winning a battle here adds the player's own tag, which does the same to foes |
| **Takeover** | Out-tag the Wall: win five quick battles, each adding a layer |
| **Local** | **Auntie Kiki**, who drives the truck and has fed every Grunt in the Quarter on credit |

### 7. Wormhole Beach
*A white gate standing alone on the sand, opening onto nothing. Stalls along the tideline sell machine parts with the serial numbers filed off.*

| | |
| --- | --- |
| **Landmarks** | The Gate to Nowhere · Snag Row · The Lifeguard Tower (a Looker Bureau listening post, badly disguised) |
| **Held by** | The Aether Foundation or Team Snag'em |
| **District rule** | *Finders Keepers:* a Snag attempt may be made against the player's Pokémon once per battle (announced, and blocked by the *Named* Heart Scar) |
| **Takeover** | Close the Gate: three Ultra-space ripples, each a battle, in any order |
| **Local** | **Tam**, a beachcomber who returns lost Poké Balls to their owners and never keeps one |

### 8. Plant and Tower
*An energy plant with one stack lit, a tower with every floor lit, and between them a fan hall where the chanting has not stopped in a year.*

| | |
| --- | --- |
| **Landmarks** | Stack Two · The Chairman's Lift (it only goes up) · The Hall, standing room only |
| **Held by** | Macro Cosmos; Team Yell hold the Hall regardless and are on nobody's side |
| **District rule** | *Peak Hours:* on even turns, both sides' Pokémon are treated as Dynamaxed for damage taken (they take 25% less) |
| **Takeover** | Win the crowd: three battles in the Hall, each judged by Team Yell's cheer meter |
| **Local** | **Gwenllian**, the Hall's caretaker, who decides who gets a drum |

### 9. Starfall Avenue
*Five garages in a row. Five Starmobiles on blocks. A school desk at the end of the street with a lamp on it.*

| | |
| --- | --- |
| **Landmarks** | The Five Bays · The Desk · The Stairs With No Building |
| **Held by** | Team Star |
| **District rule** | *Roll Call:* battles here open with a Star Barrage: the player's first three Pokémon are checked in before the fight, and any that faint in the first three turns are revived at 1 HP once |
| **Takeover** | Start all five engines: one battle per bay, any order, no healing between the last two |
| **Local** | **Mr. Sabal**, a retired caretaker who brings the kids soup and is the only adult they answer to |

### 10. Black Market Mile *(always present)*
*A mile of awnings. Everything is for sale and most of it works.* See X12.

| | |
| --- | --- |
| **Landmarks** | The Weighbridge · The Fence's Fence (a fence, owned by a fence) · Lot 49 |
| **Held by** | Mixed; changes hands every time the player leaves |
| **District rule** | *Caveat Emptor:* no refunds; every item shows its risk before purchase |
| **Takeover** | None: the Mile cannot be taken, only taxed (X8.4) |
| **Local** | **Linnea Ashdown**, the Black-Market Mayor, if she is not already serving as a Gym Leader; otherwise her deputy, **Pim** |

### 11. The Pale Garden *(always present)*
*A walled garden of white flowers. No sign. The gate is never locked.* See X13.

| | |
| --- | --- |
| **Landmarks** | The Well · The Bench · The Long Bed |
| **Held by** | Nobody. No team has ever taken it. Several have tried and came out quieter |
| **District rule** | *Safe:* no ambush, no Heat, no Snag, no battle unless the player starts it |
| **Takeover** | None |
| **Local** | **The Gardener**, who does not give a name |

### 12. Wire Row *(always present)*
*A street of repair shops, each with more antennae than customers.*

| | |
| --- | --- |
| **Landmarks** | The Exchange · Static (a café) · The Dead Letter Office |
| **Held by** | Mixed |
| **District rule** | *Rumor Mill:* at the start of each visit the player is told three things about the Margin; one of them is false, and Intel can tell which |
| **Takeover** | Trace a signal: a three-step puzzle with a battle at each relay |
| **Local** | **Marlowe Jessop**, the Wire Bishop, or her apprentice **Dot** |

### 13. Crown Yard *(always present)*
*A cobbled square with eight doors. Each leads to a Gym. A ninth door has been bricked up, and the bricks are new.*

| | |
| --- | --- |
| **Landmarks** | The Eight Doors · The Board (who holds what, updated in chalk) · The Bricked Door |
| **Held by** | Whoever holds the most districts |
| **District rule** | *Open Court:* any Leader the player has beaten may be challenged again here for practice, with no stakes |
| **Takeover** | Hold the square for 6 turns against one challenger from each team present |
| **Local** | **The Chalk Boy**, who keeps the Board and is never wrong |

### 14. The Undercroft *(always present)*
*Under Crown Yard. A long room, a long table, and as many chairs as there are teams in the ledger.* See X7.

### X3.1 Annexes

An annex is a small area attached to a district. It appears only when an Expanded Edition result calls for it, so the count of districts stays at 14.

| Annex | Attached to | Appears when | What is there |
| --- | --- | --- | --- |
| **The Depot** | Black Market Mile | `finale.result` is `silent` or `sold` (with `declined`, Cipher is only a rumor and the door stays bricked) | A Cipher warehouse. Shadow Pokémon are sold by the crate. A ninth, unofficial Gym can be fought here (X5.9) |
| **The Returns Office** | The Pale Garden | `finale.result = sung` | A post office. Rui and Krane work the counter. Wills are still being posted home, and the player can carry one |
| **The Rainbow Arcade** | Rocket Row | `rainbow.result = open` | An arcade cabinet that is a door. Leaders from runs that never happened (X9.3) |
| **The Chamber** | The Pale Garden | The player kept Krane's Machine at the finale | A Purify Chamber, free to use. Shadow Pokémon in the Margin can be taken back with the Machine |
| **The Winners' Hill** | Crown Yard | Any `triumphant` entry | A quiet, wealthy street where the teams that beat the player have retired. They are polite. It is the worst place in the Margin |

---

## X4. The Doom Level, step by step

The base formula is unchanged: `min(5, distinct teams in the Ledger + triumphant entries)`. Each district taken lowers it by 0.2.

| Level | Name | Sky and sound | Ambush rate | Wild Shadow rate (active territory) | Prices on the Mile | What the Tollgate clerk says |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | **Quiet** | Clear; gulls | 20% | 3% | Normal | "Slow week." |
| 1 | **Uneasy** | Haze; a radio somewhere | 23% | 6% | +5% | "Keep your Balls on your belt." |
| 2 | **Watched** | Overcast; the radio is nearer | 26% | 9% | +10% | "They know you're here. That's all. For now." |
| 3 | **Claimed** | Low cloud; banners on every corner | 29% | 12% | +15% | "Pick a side or walk fast." |
| 4 | **Occupied** | Red dusk at noon; loudspeakers | 32% | 15% | +20% | "Curfew's whenever they say." |
| 5 | **Doomed** | No sky to speak of; one long note | 35% | 15% | +25% | "You did this. Not on purpose. Still." |

**Thresholds.** The level shown is the stored value rounded down. Taking five districts lowers it by one full step. The level can never rise during a visit: nothing the player does inside the Margin makes it worse.

**What never changes with the level.** Trainer levels and team sizes follow the ordinary difficulty curve (design document §2.5). The Doom Level changes how *often* things happen and how the town looks. It does not make opponents stronger.

---

## X5. The eight Gyms

Each Gym is behind one of the eight doors in Crown Yard. Each has an arena, a rule, and a Doom Mark.

### X5.1 Gym 1 — The Executive's Gym
- **Leader:** the highest-ranked Executive still at large from the most recent Stay-Out.
- **Arena:** a boardroom with the table pushed against the wall.
- **Rule:** standard. The Leader opens by reading the player's own ledger entry back to them.
- **Mark:** **the Ledger Mark** — start each run with one Intel.
- **Likely faces:** Archer, Ariana, Shelly, Tabitha, Saturn, Colress, Xerosic, Plumeria, Oleana, Giacomo; from the Expanded cast, Matori, Sird or Hollis.

### X5.2 Gym 2 — The Second's Gym
- **Leader:** the highest-ranked Second in the ledger.
- **Arena:** the Leader's old office, kept exactly as it was.
- **Rule:** standard, plus the Second's signature Trait from their script, announced.
- **Mark:** **the Understudy's Mark** — the first ambush of each run is announced one node early.

### X5.3 Gym 3 — The Pardoned
- **Leader:** a Leader the player pardoned.
- **Arena:** a real, licensed Gym, with a real receptionist. The Leader is trying.
- **Rule:** *Mercy battle.* Neither side's Pokémon can be knocked out: at 1 HP a Pokémon steps back and is counted as out. The Leader thanks the player whatever the result.
- **Mark:** **the Mercy Mark** — once per run, a Pokémon that would faint outside a climax is left at 1 HP.
- **Note:** this is the Gym that Guzma, Giovanni or N most often ends up running. Their lines are in X15.

### X5.4 Gym 4 — The Exposed
- **Leader:** a Leader the player exposed.
- **Arena:** a press room. Empty chairs. One camera, still recording.
- **Rule:** an ambush before the battle: the Leader's last two loyalists, back to back, no healing.
- **Mark:** **the Headline Mark** — Heat gained from the first raid of each run is halved.

### X5.5 Gym 5 — The Defector
- **Leader:** a Defector from any run: someone the player talked out of a team.
- **Arena:** a kitchen. They cook while they talk.
- **Rule:** *Chemistry check.* Before the battle the Defector looks over the player's party. Each chemistry pair in it removes one Pokémon from the Defector's side (to a minimum of three). "You look after each other. Good. I'll go easy."
- **Mark:** **the Turncoat's Mark** — the first Defection offer in each run costs one less step.

### X5.6 Gym 6 — The Rival
- **Leader:** the rival, in whichever variant the ledger records most often.
- **Arena:** wherever the two of them last fought, rebuilt badly from memory.
- **Rule:** *Rival callback.* The rival's team is the team they had at that last fight, plus one Pokémon the player released, traded or lost in any run.
- **Mark:** **the Rival's Mark** — the rival's first gift in each run is one grade better.
- **If no rival variant fits** (all runs were Help): the rival is not the Leader. They are sitting in the stands, and the Leader is a placeholder who keeps losing track of the battle because the rival is heckling.

### X5.7 Gym 7 — The Doctrine
- **Leader:** a Leader whose Doctrine was active when their run ended.
- **Arena:** dressed entirely in that Doctrine: flooded, frozen, lit, silent.
- **Rule:** the Doctrine is active for the whole battle. It is shown before the player commits.
- **Mark:** **the Doctrine Mark** — once per run, ignore one announced field effect for three turns.

### X5.8 Gym 8 — The Chair
- **Leader:** the Chairperson (X7). This Gym is the Undercroft itself.
- **Mark:** **the Chair Mark** — the title *Chairbreaker*, and one free reroll of a Legendary Sighting per run.

### X5.9 The ninth door (annex only)

If the Depot is present, the bricked-up door in Crown Yard can be opened from the Depot side. Behind it is a **Cipher** Gym with no Mark. Its Leader is whichever Cipher officer the ledger says got away: a liaison or Gonzap if the finale was `sold`, and Greevil himself, in a deckchair, if it was `silent`. Winning it closes the Depot for good and lowers the Doom Level by one full step.

### X5.10 Gym order and pacing

Gyms may be fought in any order. Each Gym's team size is fixed by how many Marks the player already holds, so the eighth fight is always the largest.

| Marks held | Leader's team size | Healing between ambush and Leader |
| --- | --- | --- |
| 0–1 | 4 | Full |
| 2–3 | 5 | Full |
| 4–5 | 5 | Half |
| 6–7 | 6 | Half |

---

## X6. The sixteen placeholder Leaders

When the ledger has nobody for a slot, the generator draws from `data/doom_leaders.json`. These sixteen are original characters. Their names, titles and type biases are in the data file; this table gives each a past and a voice.

| Name | Title | Type bias | Where they came from | First line |
| --- | --- | --- | --- | --- |
| Oswin Marchbanks | the Harbor Baroness | Normal | Owns the ferry, and so owns who arrives | "Everyone comes in on my boat. Most of them pay." |
| Pilar Quennell | the Lien Marshal | Dark | Collected debts for three teams and was paid by none | "I'm not here about you. I'm here about what you owe." |
| Brisa Pennyfeather | the Last Cantor | Ground | Led the singing in a fan hall until the hall closed | "We'll have a verse first. Then I'll bury you." |
| Ezekiel Grayle | the Quiet Foreman | Fighting | Ran a loading dock; never raised his voice, never needed to | *(nods at the arena floor)* |
| Quillon Marchbanks | the Gala Master | Fighting | Oswin's brother; throws parties so that people will stand still | "You're underdressed. Good. You'll move better." |
| Gideon Ravenscroft | the Signal Queen | Ghost | Kept a pirate station on the air for eleven years | "You're on in five. Four. Three." |
| Linnea Ashdown | the Black-Market Mayor | Normal | Elected, in a manner of speaking, by the Mile | "Everything here has a price. I just read them out." |
| Marlowe Jessop | the Wire Bishop | Psychic | Hears every call in the Margin and forgives most of them | "I already know why you've come. I'd like to hear you say it." |
| Isolde Marchbanks | the Crown Steward | Water | The Marchbanks who stayed respectable; keeps the keys to Crown Yard | "My family built this square. I'd thank you not to bleed on it." |
| Ansel Marchbanks | the Tidewarden | Ice | The youngest; watches the harbor ice and little else | "It freezes from the edges. So do people." |
| Fenna Grayle | the Archivist-General | Ghost | Ezekiel's sister; files every defeat the Margin has seen | "I have your record here. It's thicker than you'd like." |
| Halcyon Farrow | the Undertow Judge | Electric | A disbarred League referee | "I've been found unfit to judge. I do it anyway. Begin." |
| Corwin Ravenscroft | the Bookmaker-Emeritus | Electric | Took bets on every climax, including the player's | "I had you at nine to two. I'll be honest, I lost money." |
| Brisa Dunmore | the Needle Duchess | Dark | A tailor who sews uniforms for every side | "I've measured everyone who ever beat you. Arms out." |
| Corwin Oakhurst | the Frost Regent | Water | Holds Frost Crown when nobody else wants it | "I'm only minding it. That's what I said eight years ago." |
| Tobias Thornbury | the Chairperson | Ghost | See X7 | "Sit down. No, not that one. That one's yours." |

**Rules for placeholders.** They are never mistaken for canon characters and never replace one the ledger can supply. A placeholder fills a Gym only for this generation of the Margin: if a later run adds a real Executive, Second or Leader for that slot, the placeholder steps down and is found in the stands, complaining.

---

## X7. The Chairperson and the last room

**Tobias Thornbury** has chaired the Undercroft for as long as there has been a table. Nobody elected him. He was simply the first to sit down. The ledger's dominant ending decides which Thornbury the player meets.

| Dominant ending | His manner | His team leans toward | His argument |
| --- | --- | --- | --- |
| `sealed` | **The Archivist**: tired, exact | Ghost and Steel: things that last | "You finish what you start. I admire it. Now finish this." |
| `stayed` | **The Landlord**: comfortable, grateful | Normal and Ground: things that settle | "You built this town by walking past. I only collect the rent." |
| `pardoned` | **The Creditor**: warm, counting | Fairy and Psychic: things that are owed | "Every one you forgave is at my table. Forgiveness is a loan. I hold the paper." |
| `exposed` | **The Editor**: quick, amused | Dark and Electric: things that travel | "You showed the world what they were. The world shrugged. I print what it shrugs at." |
| `triumphant` | **The Host**: gracious, unhurried | Dragon and Poison: things that win | "Do sit. They've all been so looking forward to seeing you again." |

### X7.1 The fight: The Table

| # | Phase | Format | Battles |
| --- | --- | --- | --- |
| 1 | **Roll of the Chairs** | Front: three lanes | 1 |
| 2 | **Any Other Business** | Gauntlet: one challenger for each district the player did *not* take, up to four | 0–4 |
| — | **Adjournment** | Breather: heal 50%, revive one | — |
| 3 | **The Chairperson** | Boss, team of six | 1 |
| 4 | **The Vote** | Choice | 0 |

- **Phase 1.** Each lane holds one Gym Leader the player has already beaten, back for a second try with one more Pokémon. Allies from the player's own history (X10) may hold a lane.
- **Phase 2.** Every district taken beforehand removes a challenger. A player who took every district skips the phase, and Thornbury remarks on the empty chairs.
- **Phase 3.** Thornbury's six are drawn one from each team in the ledger, each team's highest-tier pool, so his team is a portrait of the player's history. His last Pokémon is always a Ghost type, and it is always the one the player has seen in the stands all visit.
- **Phase 4.** The chairs vote on what the Margin becomes, and the player has the casting vote.

### X7.2 The Vote

| Choice | `margin.result` | The next visit |
| --- | --- | --- |
| **[Dissolve it.]** | `dissolved` | Doom Level starts one step lower. Districts are smaller. People have left; some of them wave from the ferry going the other way |
| **[Let it be a town.]** | `free-town` | The Margin gets a mayor (Linnea Ashdown, delighted) and one ordinary Pokémon Center. Ambush rate −5%. The Gyms stay, as Gyms |
| **[Take the chair.]** | `chaired` | Nothing changes at once. On the next visit the clerk calls the player "Chair," prices fall by 10%, and Gym 8 is the player's own best team from their last winning run, used by Thornbury, who is enjoying himself |

The Vote does not end the Region of Doom. The ledger keeps growing and the Margin is rebuilt from it each time.

---

## X8. Takeovers in depth

A **Takeover** replaces the Raid (base §6): one objective, hold the district.

### X8.1 Structure

1. **Read the Board.** In Crown Yard, the Chalk Boy's board shows who holds the district, their rank, and the objective. This is the risk preview.
2. **Approach.** Optional. One node of scouting buys one of: the Leader's first Pokémon revealed; one ambush cancelled; one turn added to the hold.
3. **Objective.** The district's own task (X3).
4. **Hold.** A final stand of 4–6 turns against the district's captain. The player does not have to knock out the captain's team; they have to still be standing.
5. **Result.**

| Result | Meaning | Effect |
| --- | --- | --- |
| **Triumph** | Objective done, hold won, no Pokémon fainted | District is Neutral; Doom Level −0.2; the district's local gives a gift; Heat −5 |
| **Success** | Objective done, hold won | District is Neutral; Doom Level −0.2 |
| **Partial** | Objective done, hold lost | District is Contested: its rule is off, its Gym door stays open, but the Doom Level does not move |
| **Failure** | Objective failed | Nothing is lost but the attempt. Heat +5. The captain has one line about it on the next try |

### X8.2 Neutral districts

A Neutral district has no rule, no ambushes and a shop. Its local runs it. In the default mode it stays Neutral for the rest of the visit. With a World Save, a Neutral district next to two held districts can be retaken between visits, and the Board shows the risk.

### X8.3 Help

Any ally the ledger provides (X10) can be asked to hold a district the player has taken. A held district cannot be retaken. Each ally holds one.

### X8.4 The Mile cannot be taken

Black Market Mile has no captain to beat. It can be **taxed**: after any three Takeovers, the Mile's brokers start paying the player a cut (a small sum at the start of each visit). Linnea Ashdown calls this "the cost of doing business with a going concern."

---

## X9. What the Grand Arc leaves here

`GRAND_ARC.md` §7 says what each finale result writes to the Ledger. This section shows where the player finds it.

### X9.1 By `finale.result`

| Result | In the Margin |
| --- | --- |
| `sung` | Cipher is absent. Wild Shadow rates in X4 are **halved**. The Returns Office is open. A feather is pinned behind the Tollgate clerk's desk, and the clerk will not say who left it |
| `silent` | The Depot is open, and Cipher counts as a faction at Doom Level 2. **XD001 roams**: it can be sighted over any coastal district at dusk. Meeting it is a Colossus fight with whatever locks were left; winning writes `sung` after all |
| `sold` | The Depot is the largest building on the Mile. Everyone knows the player's price. Shop prices are 10% lower for the player and every local's first line is cooler |
| `declined` | A rumor on Wire Row, and nothing else. If the rumor is followed across three visits it leads to a letter: the finale's Phase 0, offered again |

### X9.2 By Apex result

Each Apex marked `taken` appears in its team's district as a Legendary Shadow, under that team's banner (Shadow document §8, and the Colossus rules in the expanded Shadow document, X9). It guards the district's Takeover: the hold phase is fought with the Apex on the field, and each part broken shortens the hold by a turn. Freeing it writes `freed`.

Each Apex marked `freed` can appear once as a **Legendary Sighting** (base §7): not a battle, a glimpse. Stillhour stops the harbor clock for a minute. Abyssal surfaces beyond the breakwater and goes down again. They are simply living nearby.

### X9.3 By `rainbow.result`

| Result | In the Margin |
| --- | --- |
| `empty` | A red letter on the Dead Letter Office wall, undelivered |
| `closed` | The Rainbow Arcade's cabinet is there, unplugged. Dolores uses it as a shelf |
| `open` | The Rainbow Arcade annex. One "world where they won" has a foothold: that team's Leader, with their Apex beside them, holds Rocket Row whatever the ledger says. Taking the Row closes the door and writes `closed` |

### X9.4 Smaller threads

| Flag from a run | In the Margin |
| --- | --- |
| `rocket.x.kept-ledger` | LEDGER the Porygon sorts mail at the Dead Letter Office and can tell the player which rumor is false, once per visit |
| Krane's Machine kept | The Chamber annex (X3.1); Shadow Pokémon here can be taken back |
| Gonzap's Machine given to Wes | Snag Row is half empty. A stallholder: "Somebody threw the good one in the sea. Killed the market." |
| Honorary Yeller | Team Yell in the Hall cheer for the player in every district, which helps nobody and is very loud |
| Any ROM never found | That liaison has a stall on the Mile, selling the ROM. The price is a battle |

---

## X10. Who you meet, and why

People appear in the Margin because of something the player did. None of them is guaranteed.

| Who | Appears when | What they do here |
| --- | --- | --- |
| **Jessie, James and Meowth** | Always, once the Remnants are in any ledger entry | A stall on the Mile that sells one useful thing and four useless ones. They do not recognize the player. They always recognize the player's Pikachu, if there is one |
| **Looker** | Any `exposed` ending | The Lifeguard Tower on Wormhole Beach. Trades Intel for evidence. Believes his disguise is working |
| **Rui** | Met in any run | The Pale Garden, or the Returns Office. Sees auras; gives the first key hint for any Named Shadow |
| **Wes** | The finale was reached | Leaning on the Tollgate. Says nothing. Holds one district if asked |
| **Giovanni** | `pardoned` | Gym 3. Runs it well. Has a waiting list |
| **Guzma** | `pardoned`, or Kahuna Guzma's route | Gym 3, or the Malasada Truck, depending on the day |
| **N** | Any Plasma entry | Walks through. Can be found once per visit, in a different district each time, talking to somebody's Pokémon |
| **Colress** | Any Plasma entry where he got away | Wire Row. Will retune one device for free because he wants to see what happens |
| **Lysandre** | `stayed`, Kalos | Café Encore, at the same table. Orders for two |
| **Lusamine** | Aether `pardoned` | Tends one bed in the Pale Garden under the Gardener's eye. Does not battle |
| **Cyrus** | Galactic `stayed` | The Observatory With No Roof. Looking up. A Mercy battle can be asked for; he agrees without interest and fights without flaw |
| **Rose** | Macro Cosmos `pardoned` | Gives a speech in the Hall every evening. The drum section talks over it |
| **Penny** | Any Star entry | The Desk at the end of Starfall Avenue. Fixes the Board's handwriting remotely |
| **The rival** | Always | Gym 6, or the stands |
| **The second rival** | They existed in any run (decision D8) | Holds a district without being asked, then pretends it was an accident |
| **The Defector** | Any Defection | Gym 5; cooks for the party after, win or lose |
| **A trainer whose Pokémon the player Snagged** | Gonzap's Machine was used and a Pokémon was never returned | Snag Row, asking every stallholder the same question. Returning the Pokémon here ends the thread and earns the *Named* Heart Scar for it |
| **Your own Memorial** | The player lost any run | A wall in the Pale Garden with the names of the parties that did not finish. Pokémon with the *Remembered* scar are listed first |

---

## X11. Sixteen events

Ids are `rod.event.<slug>`. Every event is optional. None can end the visit.

| Id | Where | What happens | Choices and results |
| --- | --- | --- | --- |
| `rod.event.stamp` | The Tollgate | The clerk offers to stamp the card with a false history | [Refuse] nothing · [Accept] ambush rate −5% this visit, and the rival notices |
| `rod.event.dolores-books` | Rocket Row | Dolores shows the real books | [Read them] learn which Gym Leader is weakest today · [Burn them] the Row's Takeover hold is one turn shorter |
| `rod.event.bridge-toll` | Tide and Ember | Both sides demand a toll for the bridge | [Pay Aqua] / [Pay Magma] that side's captain sits out the Takeover · [Row with Mabs] no toll, one wild battle |
| `rod.event.fake-links` | Chain Quarter | Per sells a "lucky" chain link | [Buy it] it does nothing; Per is grateful and gives a real tip · [Tell him to stop] he does, for a day |
| `rod.event.shelter` | Frost Crown | Sister Iola needs someone to walk the released Pokémon | [Help] one of them asks to join · [Donate] Heat −5 |
| `rod.event.table-for-two` | Weapon Yard | A table at Café Encore is laid for two; one chair is empty | [Sit] a conversation with whoever the ledger sends (X10) · [Leave] nothing |
| `rod.event.wall` | Po Quarter | The player's tag on the Wall has been crossed out | [Repaint it] a quick battle; win and the district rule favors the player this visit · [Leave it] a Grunt repaints it out of pity |
| `rod.event.lost-ball` | Wormhole Beach | Tam has found a Poké Ball with the player's ID on it | It is a Pokémon the player released in an earlier run. [Take it back] it rejoins · [Let Tam find it a home] bond +1 with the whole party |
| `rod.event.drum` | Plant and Tower | Gwenllian offers a drum | [Take it] Crowd Chant can be used once anywhere in the Margin · [Decline] Team Yell are offended for exactly one battle |
| `rod.event.soup` | Starfall Avenue | Mr. Sabal has too much soup | [Stay] full heal; a Star kid tells a secret about the fifth bay · [Go] nothing |
| `rod.event.lot-49` | Black Market Mile | A sealed lot, sold unseen | [Bid] one of: a rare item, a Shadow Pokémon in a crate, or a crate of packing straw (weights shown) |
| `rod.event.false-rumor` | Wire Row | Dot bets the player cannot spot the false rumor | [Guess right] an Intel pack · [Guess wrong] Dot keeps the stake and explains, kindly |
| `rod.event.chalk` | Crown Yard | The Chalk Boy hands over the chalk | [Write a name] one Gym Leader of the player's choice must fight next, at one Pokémon fewer |
| `rod.event.gardener` | The Pale Garden | The Gardener asks for help with the Long Bed | [Help] one Shadow Pokémon in the party loses 20 Corruption; the Gardener says who planted the first flower |
| `rod.event.hill` | The Winners' Hill | An invitation to tea from a team that beat the player | [Go] no battle; the Leader explains, pleasantly, what they did afterwards. The player may ask one question. Rematch unlocked at Crown Yard |
| `rod.event.last-ferry` | The Tollgate | On leaving, the clerk asks if the player wants to take anyone along | [Yes] one local comes to the next run as a one-time helper · [No] they wave |

---

## X12. The Black Market Mile catalog

Nothing here is required. Every item shows its risk before purchase.

| Item | What it does | Risk, shown at the stall |
| --- | --- | --- |
| **Forged Pass** | Skips one district's Approach | 25% chance the captain is waiting |
| **Intel Pack** | Three true facts about one Gym | None |
| **Decoy Tag** | Cancels the next ambush | None |
| **Recall Whistle (broken)** | −30 Corruption on one Shadow of the matching team | Works once |
| **Crate, unmarked** | A Shadow Pokémon, tier shown, species not | It may be Named; its key may be far away |
| **Borrowed Uniform** | Walk through one held district unchallenged | Heat +5 if seen changing |
| **Stadium Horn** | Starts a Crowd Chant without a crowd | The crowd it summons is Team Yell |
| **Chain Link (real)** | One Pokémon ignores *No Applause* | Per will be heartbroken |
| **Second-hand Snag Ball** | One Snag attempt with Krane's Machine | Fails against Named and Apex, as always |
| **Unlabelled Tape** | Plays a liaison's sales pitch; reveals one ROM's location in a future run | It is very long |
| **Cold Case** | Keeps one Pokémon *Preserved* for a visit | −1 Speed, as the line rule says |
| **Tuning Fork** | One Pokémon is *Tuned* for one battle | It stalls after, as the line rule says |
| **Accessory Box** | A random Couture accessory | Purely an item |
| **Receipt Book** | Shows what every stall paid for its stock | Three stalls stop serving the player |
| **Ferry Ticket (open)** | Leave and return without the Margin being regenerated | One use |
| **Map of the Undercroft** | Shows the chairs before Phase 1 | None |
| **Echo Jar** | Stores one Echo ability for the next run | The jar must not be opened early. Everyone opens it early |
| **Nothing, in a nice box** | Nothing | The stallholder is honest about this |

**Prices** rise with the Doom Level (X4) and fall if the player taxes the Mile, holds the Chair, or sold out to Cipher.

---

## X13. The Pale Garden

The Garden is the one place in the Margin that no result, level or ledger can make unsafe.

- **The Well.** A Purification Site. Site Cleansing here is worth the full 100 if the Garden has never been attacked in this profile's history, and it never has been.
- **The Bench.** A rest node. Shared Table works here without a meal: sitting is enough.
- **The Long Bed.** One white flower for every Pokémon purified in this profile, in any run. The count is shown. It is the only number in the game that only goes up.
- **The Gardener.** Answers three questions per visit and no more. Has no team. If the player tries to battle, the Gardener declines, and the option is removed for the visit.

> **THE GARDENER:** "They come in to take it. Every one of them. They get as far as the bench."
> **THE GARDENER** *(if asked who they are)*: "I was bound once. Somebody waited. That's all the story there is."

**Who planted the first flower** depends on the ledger: it is the first Pokémon the player ever purified, in any run. The Gardener names it.

---

## X14. Rewards and the Epitaph

### X14.1 Doom Marks

Eight Marks, one per Gym (X5). A Mark is cosmetic, plus one minor run-start perk. Perks never stack with themselves and are never required.

### X14.2 Echo abilities

Each Gym Leader who used a Shadow ability can teach it as an Echo (Shadow document §4): one per run, chosen at the start.

### X14.3 Legendary Sightings

Besides the freed Apex (X9.2), the Margin has three Sightings of its own: a Legendary bird over the harbor at each of dawn, noon and dusk, one per visit, species chosen by the ledger's most-visited region.

### X14.4 The Epitaph

The Epitaph is a short text written from the ledger and shown in the Hall. It is built from one line per category.

| Category | Line chosen by | Examples |
| --- | --- | --- |
| Opening | Number of runs | "They came through nine regions." / "They came back more often than was wise." |
| Method | Dominant ending | "They closed every door they found open." / "They walked past more than they fought." / "They forgave people who had not asked." |
| Cost | Runs lost | "It did not always go well." / "It went well. That is rarer than it sounds." |
| Shadow | Pokémon purified vs. kept | "They waited for the ones who were bound." / "They kept what they were given, and it stayed." |
| Rival | Most common variant | "Somebody walked beside them." / "Somebody was always a step ahead, and is owed an apology." |
| Finale | `finale.result` | "At the end there was a song." / "At the end there was a silence, and it is still there." |
| Margin | `margin.result` | "They left a town behind." / "They left nothing behind, on purpose." / "They sat down." |

---

## X15. Dialogue bank

### X15.1 Gym Leaders, by source

> **EXECUTIVE** *(Gym 1)*: "You didn't come. I waited at the site for six hours. I want that noted."
> **SECOND** *(Gym 2)*: "I kept the office the way it was left. Don't touch the desk."
> **PARDONED LEADER** *(Gym 3)*: "I have a receptionist now. I have *forms*. You did this to me."
> **GIOVANNI** *(Gym 3)*: "A Gym is a business. I always said so. It turns out an honest one makes less and sleeps better. I resent both facts."
> **GUZMA** *(Gym 3)*: "Yeah, yeah. Kahuna stuff. I do the paperwork and everything. Don't look at me like that."
> **N** *(passing through)*: "The Pokémon here are not unhappy. That confused me. I am still thinking about it."
> **EXPOSED LEADER** *(Gym 4)*: "Everyone knows what I did. You'd think that would be the end of it. It's only the end of being invited places."
> **DEFECTOR** *(Gym 5)*: "Sit. Eat first. I used to brief people on an empty stomach and look where that got us."
> **THE RIVAL** *(Gym 6)*: "I've had a long time to think about that last fight. I've decided I was right. Come and prove otherwise."
> **DOCTRINE LEADER** *(Gym 7)*: "I'm told it's over. I was told a great many things. The weather in here says different."

### X15.2 District barkers, by Doom Level

| Level | A voice on the street |
| --- | --- |
| 0 | "Fresh berries! Honest berries! First honest thing on this street!" |
| 1 | "Mind how you go. Not a warning. Just a habit." |
| 2 | "They've put a man on the corner. He's not selling anything." |
| 3 | "You'll want to pick your colors before the bridge." |
| 4 | "Shutters down at dusk. Dusk is when they say." |
| 5 | *(nobody is selling anything)* |

### X15.3 Takeover captains

> *(before)* "You've read the Board. Then you know I've held this longer than you've been coming here."
> *(hold, turn 3)* "Still up? Huh."
> *(on losing)* "Tell the Chalk Boy to spell my name right when he rubs it out."
> *(on winning)* "Go and have a sit in the Garden. Everyone does, after."

### X15.4 Thornbury

> *(the player enters)* "Sit down. No, not that one. That one's yours."
> *(Phase 2, empty chairs)* "Apologies have been received from… rather a lot of people. You've been busy."
> *(his last Pokémon)* "You'll have seen this one about. It likes to watch. So do I."
> *(defeated)* "Well. That's the first item of business this table has concluded in years. Shall we vote?"
> *(if the player takes the chair)* "Oh, thank goodness. Do you know how long I've wanted to *stand*?"

---

## X16. Three worked ledgers

**Ledger A: the finisher.** Nine runs, every team `sealed`, finale `sung`.
Districts: only the five fixed ones, plus one or two by small weights. Doom Level 5 by the formula (many distinct teams), but nearly every Gym is a placeholder and the Returns Office is open. Thornbury is the Archivist. The Margin is quiet, well-kept and slightly reproachful. The first Takeover drops the level at once.

**Ledger B: the pacifist.** Six runs, four Stay-Outs, two `pardoned`, finale `declined`.
Districts: nearly all fourteen, heavily held. Gyms 1, 2 and 3 are canon characters. Doom Level 5. Thornbury is the Landlord. Cipher is a rumor on Wire Row. This is the Margin at its largest, and it is the player's own doing: every door they walked past is a door here.

**Ledger C: the one who lost.** Three runs, two of them lost at the climax (`triumphant`), one `exposed`, no finale.
Districts: three team districts and the Winners' Hill. Doom Level 5 (two triumphant entries count twice). Gym 4 is the exposed Leader; the rest are placeholders. Thornbury is the Host. The Memorial wall in the Garden has two parties on it. The Margin here is smaller and sharper, and winning it is the game's way of letting a player answer a loss.

---

## X17. Tests

- The generator still produces exactly 14 districts; annexes are attached, never counted.
- Each annex appears only under its own condition, and never two contradictory annexes (the Depot and the Returns Office never coexist).
- The Doom Level never rises during a visit.
- Ambush rate equals `20% + 3% × level`, capped at 35%, before event modifiers; Wild Shadow rate never exceeds 15%, and is halved when `finale.result = sung`.
- Trainer levels and team sizes are unchanged by the Doom Level.
- Gym team size follows Marks held (X5.10).
- A Mercy battle cannot knock out a Pokémon on either side.
- A placeholder Leader is replaced when a later ledger supplies a real one.
- Every Takeover result leaves the player able to retry; Failure costs nothing but Heat.
- The Pale Garden never starts a battle, ambush or Snag under any ledger.
- Phase 2 of The Table has one challenger per team district not taken, capped at four, and none when every district was taken.
- `margin.result` changes only the next generation of the Margin.
- XD001 met in the Margin with `silent` uses the locks left at the finale, and winning rewrites the result to `sung`.
- Each event in X11 can be declined with no penalty.
- Every item on the Mile shows its risk text before purchase.
- The Epitaph has one line per category that applies: five lines before any finale or Vote, seven at most.
