# 01x — KANTO: TEAM ROCKET — EXPANDED EDITION
### Script: *The Long Ledger*

> *"Small crimes pay the rent. Large crimes buy the building. I am interested in the city."* — Giovanni

**Extends:** `scripts/01_KANTO_TEAM_ROCKET.md` (the base script stays valid; this file adds to it)
**Template:** `docs/EXPANSION_DESIGN.md` · **Cross-region arc:** `docs/GRAND_ARC.md`
**Canon note:** Giovanni, Domino, Butch, Cassidy, Jessie, James, Meowth, Matori, Dr. Namba and Madame Boss are canon Team Rocket characters (games and anime). Ein is a canon Cipher admin (Colosseum). Armored Mewtwo follows the anime. The **Rocket Triad** (Surge, Koga, Sabrina) and **Dr. Blaine** as a former Rocket scientist are *what-if* versions inspired by the manga. Everything they say and do here is original writing. Species lists are my best recall and are marked approximate.

---

## E1. The Wider Scale

The base script is one night in one tower. The Expanded Edition treats Silph Co. as the last line of a ledger that has been filling all region long.

### E1.1 The plan at five scales

| Scale | What Rocket is doing | What the player sees | Where it pays off |
| --- | --- | --- | --- |
| 1 **Street** | Collecting "insurance" from shops; stealing Pokémon to order | Shuttered shops, a crying kid, a grunt with a receipt book | Event *Small Print* |
| 2 **City** | Running Celadon through the Game Corner; breeding **Black-Label** Pokémon in the basement kennels | Prize Pokémon with black ear tags; a mayor who will not comment | Raid 2, event *The Appointment* |
| 3 **Region** | Closing the roads into Saffron with two fed Snorlax; poaching the Safari Zone; reviving Mt. Moon's fossils as weapons | Detours on the map, empty Safari areas, a fossil that screams | Event *The Roadblock*, Raid 1, Raid 5 |
| 4 **Border** | Shipping rigged Pokémon out of Vermilion to Johto | Night freighters, sealed crates that breathe | Raid 4, event *Harbor Export* |
| 5 **World** | Paying a supplier called Cipher for the Capture Rig's pulse, with copies of every stolen Pokémon's data; building **Project M2** | A quiet man in a lab coat at the edge of three scenes | Climax Phase 6, `docs/GRAND_ARC.md` |

### E1.2 World-state track — *The Ledger Fills*

A step is gained when a raid is failed or declined, or when the climax is scheduled. A step is removed by a raid Success or better. Stored in `rocket.x.ledger` (0–5).

| Step | Name | Regional rule | Civilian mood |
| --- | --- | --- | --- |
| 1 | **Small Print** | One shop per city charges +10% ("insurance") | Nervous |
| 2 | **House Rules** | Game Corner prizes are Black-Label; one Pokémon Center per city closes at night | Careful |
| 3 | **Closed Roads** | Two routes are blocked by a Snorlax; detour nodes appear | Angry |
| 4 | **Export** | Wild encounter pools near Vermilion shrink by a quarter (poached) | Frightened |
| 5 | **Under New Management** | Saffron's gates are shut before the climax; the news runs Rocket adverts | Silent |

### E1.3 The bigger secret

The Master Ball is bait (base script §3). The real prize is the **ledger**: a list of every Pokémon Rocket has taken, who it was sold to and what it was sold for. It is not a book. It is a Porygon named **LEDGER**, and it can be copied. Giovanni has been paying his supplier, Cipher, in copies. With the Silph Scope silenced and Silph's own network in his hands, he can sell the region's Pokémon as data and never move a crate again.

Project M2 is the insurance policy: a Mewtwo in Silph-built armor, held under the Capture Rig. Giovanni does not intend to use it. He intends to *own* it, which is worse.

---

## E2. Expanded Cast

### E2.1 New officers and specialists

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.rocket.matori` | **Matori** | Executive (5) | canon (anime) | Strategist: Giovanni's secretary, keeper of his calendar | Hypno, Mr. Mime, Persian *(approximate)* | Precise, tired, never raises her voice |
| `sc.rocket.namba` | **Dr. Namba** | Commander (4) | canon (anime) | Scientist: inventor of the Capture Rig | Magneton, Porygon2, **Blackout** (Electrode) | Loud, vain; furious when his name is said wrong |
| `sc.rocket.madame-boss` | **Madame Boss** | Leader emerita (7) | canon (anime, audio drama) | Founder: Giovanni's mother, heard only by phone | None; she does not battle | Warm, amused, frightening |
| `sc.rocket.ein` | **Ein** | Liaison (4) | canon (Colosseum) | Scientist: Cipher's man inside the Rig lab | Lanturn, Pelipper, Manectric *(approximate)*; a Shadow Raikou joins them if it was taken in Johto (`cipher.beast.raikou`) | Soft, exact, interested only in results |
| `sc.rocket.vesper` | **Pit Boss Vesper** | Lieutenant (3) | original | Handler: runs the Game Corner count room | Hypno, Clefable, Wigglytuff | Friendly in the way a locked door is friendly |
| `sc.rocket.griggs` | **Foreman Griggs** | Lieutenant (3) | original | Enforcer: runs the Mt. Moon dig | Graveler, Machoke, Onix | Gruff, proud of his crew, underpaid |
| `sc.rocket.rudd` | **Poacher-Captain Rudd** | Commander (4) | original | Scout: leads the Safari night crews | Tauros, Scyther, Arbok | Patient, quiet, counts everything |

### E2.2 Team versions of characters you know

These are **what-if** versions. `rocket.x.triad = true` (default in the Extended Cut) uses them; `false` swaps each for an unnamed Executive with the same team and the codename in brackets.

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.rocket.triad-surge` | **Major Surge** *(Agent Volt)* | Executive (5) | what-if (manga-inspired) | Enforcer: runs the Vermilion docks for Rocket | Raichu, Magneton, Z-Electrode | Booming, jovial, means every threat |
| `sc.rocket.triad-koga` | **Shinobi Koga** *(Agent Shade)* | Executive (5) | what-if (manga-inspired) | Infiltrator: poisons the Safari watering holes so the herds can be taken asleep | Crobat, Weezing, Muk | Formal, sparing, ashamed and hiding it |
| `sc.rocket.triad-sabrina` | **Oracle Sabrina** *(Agent Third Eye)* | Executive (5) | what-if (manga-inspired) | Strategist: holds the psychic seal over Saffron | Z-Alakazam, Mr. Mime, Hypno | Flat, distant, already knows how this ends |
| `sc.rocket.blaine` | **Dr. Blaine, formerly of Rocket** | Ally | what-if (manga-inspired) | Scientist who built M2's first armor and walked away | Arcanine, Magmar | Riddles when calm, plain when it matters |
| `sc.rocket.rival-ace` | **Agent 010, "Blank Card"** (the rival) | Lieutenant (3) | what-if | The rival in a black uniform, in the Side-with variant | The rival's own team plus one Black-Label Pokémon | The rival's archetype, with the confidence sanded off |
| `sc.rocket.player-agent` | **Provisional Agent 000, "House Card"** (the player) | Specialist (2) | what-if | The player on the Inside Man and Stand-with routes | The player's team | — |

> **Why the Triad works here.** Each of the three holds one scale of the plan: Surge the border (the docks), Koga the region (the Safari), Sabrina the city (the seal). Beating one before the climax removes that piece from the Siege Map (E7).
> **Domino's number.** Domino is Agent 009, "the Black Tulip". The rival's 010 is a deliberate insult from her: next in line, and blank.

---

## E3. Special Pokémon — the Black-Label line

**Black-Label** Pokémon are bred and conditioned in the Game Corner kennels and sold with a black ear tag. The name nods to the trading card game's "Dark" Rocket Pokémon without using the Dark type.

**Line rule — *Tagged*:** a Black-Label Pokémon cannot be forced to switch out, and the first hit it takes in each battle does 20% less damage (announced: "The tag holds it in place."). Knock Off, Thief or winning the battle removes the tag; a caught or freed Black-Label Pokémon loses the rule and keeps its signature trait.

| ID | Name | Species | Signature trait | Where met | Can the player get it? |
| --- | --- | --- | --- | --- | --- |
| `sv.rocket.chairman` | **Chairman** | Persian | *Seat at the Table*: on entry, clears the foe's stat boosts (announced) | Beside Giovanni in Phase 5 | No |
| `sv.rocket.vault-breaker` | **Vault-Breaker** | Rhydon / Z-Rhyperior | *Drill Through*: its first Ground or Rock move each battle ignores Protect and screens | Giovanni's ace | No |
| `sv.rocket.house-pair` | **The House Pair** | Nidoking / Nidoqueen | *The House Wins*: when one faints, the other gains +1 Attack and +1 Special Defense | Giovanni's team | No |
| `sv.rocket.ledger` | **LEDGER** | Porygon / Porygon2 / Porygon-Z | *Double Entry*: once per battle, copies the foe's last stat change onto itself | Raid 4, Phase 7 | Yes: custody after the Convoy, or as a Raid 4 Triumph reward |
| `sv.rocket.big-tab` | **Big Tab** | Raticate / Bruticate | *Collections*: its biting moves take the target's Berry | Cassidy's ace from Raid 3 onward | No |
| `sv.rocket.roadblock` | **The Roadblock** | Snorlax / Z-Mega Snorlax | *Fed and Paid*: heals 1/8 HP each turn until its food is knocked away | Event *The Roadblock* | Yes: wake it and catch it |
| `sv.rocket.jackpot` | **Jackpot** | Dratini / Dragonair | *Payout*: when it knocks out a foe, the winner's prize money for the battle is doubled | Raid 2 count room | Yes: the dealer lets you keep it, or you return it |
| `sv.rocket.blackout` | **Blackout** | Voltorb / Electrode / Z-Electrode | *Lights Out*: when it faints the field goes dark for 3 turns (accuracy −10% for both sides) | Dr. Namba; Phase 4 | No |
| `sv.rocket.meowth` | **Meowth, That's Right** | Meowth | *Translator*: once per battle he overhears the foe and reveals its next move | With Jessie and James | Ally only, on the Stand-with route |

---

## E4. Special Shadow Pokémon

All use the Shadow rules as written (`docs/SHADOW_POKEMON_SYSTEM.md`). Rocket's method is the **Capture Rig**; beating the technician who fitted a rig gives −30 Corruption (Shadow doc §6).

| ID | Code | Name | Species | Tier | Shadow ability | Shadow moves | Purification key | Where met |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ss.rocket.amberjack` | — | **Amberjack** | Aerodactyl / Mega Aerodactyl | 3 Gripped | Lurker | Umbral Rush, Dusk Brand, Gloam Crash | Win one battle outdoors with it leading, after Namba's technician is beaten ("It sees the sky and remembers it.") | Raid 1, the Amber Lab |
| `ss.rocket.shellshock` | — | **Shellshock** | Kabutops / Z-Mega Kabutops | 2 Bound | Grim Resolve | Umbral Rush, Chain Hymn | Register its fossil at the Pewter Museum, or Site Cleansing | Phase 2, the 10th floor |
| `ss.rocket.marrowmother` | — | **Marrowmother** | Marowak / Alolan Marowak | 4 Fallen | Grim Resolve | Weeping Maw, Ember of Grief, Last Lamp | Story only: bring the orphan Cubone to the top of the Tower | Raid 3 |
| `ss.rocket.matron` | — | **Matron** | Kangaskhan / Mega Kangaskhan | 3 Gripped | Dread Aura | Gloam Crash, Chain Hymn, Dusk Brand | Return her child from the poachers' truck | Raid 5 |
| `ss.rocket.black-fog` | — | **The Black Fog** | Haunter / Z-Gengar | 4 Fallen | Shroud | Siphon Lull, Pale Echo, Heart Eclipse | Site Cleansing at Pokémon Tower only | Lavender at night, world state 3 or higher |
| `ss.rocket.m2` | XD002 | **M2** | Mewtwo / Mega Mewtwo X | 4 Fallen | Contract Clause | Null Pulse, Heart Eclipse, Mind Vault | Story only: break the four armor seals (Phase 6) | The roof of Silph Co. |

**Signature Shadow move — Mind Vault:** 100 power; the target's held item and ability are sealed for 2 turns; the user cannot use it twice in a row. Cost: +6 Corruption. Announced one turn ahead ("The armor hums.").

**Notes**
- **Marrowmother** appears as an Alolan Marowak: the Rig has burned her into a ghost of fire. She cannot be caught. When the Cubone reaches her, the Rig falls off by itself.
- **The Black Fog** is the one Shadow Rocket did not make. A Rig was fitted to a Haunter in the Tower; it ate the Rig. Grunts will not go to Lavender after dark.
- **M2** follows the Legendary Shadow rules: it cannot be captured or Mentor-bound.

---

## E5. New Story Events

Eight new scenes. Each lists its trigger, its choices and what it writes. None is required to finish the region.

### E5.1 *Small Print* (`xe.kanto.small-print`) — Street

*Trigger: any city node after Ignition. A bike shop with its shutter half down.*

> **SHOP OWNER:** "We're closed. We're not closed. We're… between payments."
> *(A Rocket Grunt steps out of the back with a receipt book.)*
> **GRUNT (Collector):** "Insurance. Fires, floods, people like me. You'd be amazed what a shop can catch."
> **PLAYER (choice):**
> 1. **"How much does he owe?"** → **GRUNT:** "Four thousand. For you, four thousand." *(Pay ₽4,000: the shop reopens with a permanent 10% discount; Heat −3; `rocket.x.paid-once = true`, and Collectors will ask you again.)*
> 2. **"Show me the policy."** → *(Battle: Collector, 2 Pokémon.)* **GRUNT (defeat):** "It's a verbal policy!" *(The receipt book drops: Intel +3. It lists eleven shops and one Gym.)*
> 3. **"Whose Pokémon is in that crate?"** → *(The crate in the back room holds a Growlithe with a black tag. Battle as above at +1 level; win and the Growlithe goes home. Rep +3.)*
> **SHOP OWNER (after):** "They'll send someone bigger. They always send someone bigger."

*Writes: `rocket.x.receipt-book`, Intel, Heat. The eleven shops become eleven possible Collector ambushes.*

### E5.2 *The Appointment* (`xe.kanto.appointment`) — City

*Trigger: Heat 35 or more, in Celadon or Saffron. A black car idles at the curb. A woman with a tablet steps out.*

> **MATORI:** "You're difficult to schedule. I have eleven minutes, so I'll be direct."
> **MATORI:** "The Boss has noticed you. Being noticed is expensive. He would like to make it cheap."
> *(She holds out an envelope.)*
> **MATORI:** "Fifty thousand. In return you take the eastern routes for one month. You see nothing in the west."
> **PLAYER (choice):**
> 1. **[Take the envelope]** → ₽50,000; Heat −20; Rep with Rocket +10; `rocket.x.bought = true`. *The next raid offered is withdrawn. Matori's Phase 3 line changes.*
> 2. **[Refuse]** → **MATORI:** "I'll put you down as 'declined'. He keeps that list short." *(Heat +5.)*
> 3. **[Take it, and take it to Officer Jenny]** → ₽0; Intel +6; `rocket.x.wire = true`. *The police hold one district for you on the Siege Map.*
> 4. **"Does he always send you?"** → **MATORI** *(a pause, the first)*: "He sends me when he'd rather not send Domino. You should take that as a compliment." *(No effect; unlocks a later line.)*
> **MATORI (leaving):** "Nine minutes. You're efficient. He'll like that, and it won't help you."

### E5.3 *The Roadblock* (`xe.kanto.roadblock`) — Region

*Trigger: world state 3. A Snorlax sleeps across the road. A catering truck with a red R is parked beside it, and two grunts are shovelling food.*

> **GRUNT A:** "Forty kilos a day. Each. Boss says it's cheaper than a wall."
> **GRUNT B:** "Walls don't snore."
> **PLAYER (choice):**
> 1. **[Play the Poké Flute]** *(needs the Flute)* → The Roadblock wakes hungry and angry. *(Battle: `sv.rocket.roadblock`; catchable.)*
> 2. **[Stop the food truck]** → *(Convoy: 3 battles; the truck tries to reach the second Snorlax.)* Win: both Snorlax wander off by morning; world state −1.
> 3. **[Feed it yourself]** *(spend 3 Berries)* → It rolls over. The road opens for you alone, once.
> **GRUNT A (defeat):** "Do you know what he's going to make us do? He's going to make us *build the wall*."

*Writes: `rocket.x.roadblock = flute | truck | fed`.*

### E5.4 *Harbor Export* (`xe.kanto.harbor-export`) — Border

*Trigger: Vermilion, world state 2 or higher, at night. A freighter with no name. Cranes moving in the dark.*

> **MAJOR SURGE:** "Hah! A tourist! Harbor's closed, kid. Has been since I took the job."
> **PLAYER:** "Those crates are breathing."
> **MAJOR SURGE:** "Good ears. Bad habit."
> *(A thin man in a lab coat checks a crate with a handheld reader. He does not look up.)*
> **EIN:** "Corruption is uneven on this batch, Major. Your technicians are rushing."
> **MAJOR SURGE:** "My technicians are *your* technicians, Doc."
> **EIN:** "Then I apologize to myself." *(He glances at the player's party, once, the way a tailor looks at cloth.)* "Interesting bonds. Strong ones take longer."
> **PLAYER (choice):** [Count the crates] (Intel +4; unlocks Raid 4) / [Challenge Surge] (Battle; win: `rocket.x.surge-down = true`) / [Leave].
> **EIN (if challenged, as he walks away):** "I don't stay for the practical. Send me the numbers."

*Writes: `cipher.seen.ein`, `rocket.x.manifest-count`. This is the first Cipher sighting in the region.*

### E5.5 *The Riddle Without a Joke* (`xe.kanto.blaine-defects`) — Region

*Trigger: Cinnabar, or any lab node after Raid 2. An old man in sunglasses is burning a notebook in a metal bin.*

> **BLAINE:** "Riddle. What wears armor and has never been in danger?"
> **PLAYER:** "…"
> **BLAINE:** "A prisoner. I built the first suit. I told myself it was to protect it."
> **BLAINE:** "Giovanni asked me to make it obey. I said the armor could do one or the other: protect it or hold it. He said, 'Then you know which.'"
> *(He pulls one page out of the fire.)*
> **BLAINE:** "Four seals. Shoulders, chest, crown. They vent in order, like a kettle. If you ever stand in front of it, don't fight it. Fight the suit."
> **PLAYER (choice):** [Take the page] → Key Item **Seal Diagram** (Phase 6 starts with one seal already cracked) / ["Come with me."] → Blaine joins the Siege Map as an ally who holds one district / ["Why didn't you stop him?"] → **BLAINE:** "No riddle for that one."

### E5.6 *The Phone in the Basement* (`xe.kanto.madame-call`) — City

*Trigger: Raid 2, any result except Declined. On the way out of the hideout, a desk phone rings.*

> **VOICE:** "Don't hang up, dear. Nobody hangs up on me. Not even my son."
> **VOICE:** "I built this from a card table and one stolen Pidgey. He's made it into a company. I'm proud. It's also boring."
> **VOICE:** "You're the first interesting thing in his books in years. So here is a mother's advice: he'll be on the roof. He always saves something for the roof."
> **PLAYER (choice):** ["Who is this?"] → **VOICE:** "The *founder*. Sit up straight." / ["Why help me?"] → **VOICE:** "I'm not. I'm watching." / [Hang up] → *(The phone rings again at the next rest node. She is laughing.)*

*Writes: `rocket.x.madame = true`. In Phase 6 the player gets one free turn before M2 acts ("You were warned about the roof.").*

### E5.7 *Growlie* (`xe.kanto.trio-conscience`) — Street

*Trigger: any time after the trio has lost to the player twice. A kennel van, door open. James is kneeling by a cage.*

> **JAMES:** "Shh. Shh, I know. I had one just like you."
> **JESSIE:** "James. We are *paid* to deliver these."
> **MEOWTH:** "We ain't been paid since Mt. Moon."
> **JAMES:** "Then it's not a delivery. It's just a van." *(He opens the cage. A tagged Growlithe bolts into the grass.)*
> *(They see the player.)*
> **JESSIE:** "…You saw nothing, twerp."
> **PLAYER (choice):** ["I saw nothing."] → `rocket.x.trio-debt = true` *(the trio opens the roof door in Phase 6)* / ["I'm telling Domino."] → *(Battle; Heat +4; no debt)* / ["Need help with the other cages?"] → *(Six more go free; Rep +5; debt set; Meowth: "Don't make it weird.")*

### E5.8 *Orphan* (`xe.kanto.orphan`) — Street

*Trigger: Lavender, before Raid 3. A Cubone sits outside the Tower and will not go in.*

> **MR. FUJI'S VOLUNTEER:** "It waits there every evening. Something upstairs cries, and it cries back."
> **PLAYER (choice):** [Sit with it] → *(Three evenings: three rest nodes spent here, in any order.)* The Cubone follows you as a **Walker**: it does not battle. `rocket.x.orphan = walker`. / [Leave it be] → Nothing changes; Marrowmother can still be laid to rest, but only by battle.

*If the Walker is with you at the top of the Tower, see Raid 3 in E6.*

---

## E6. Raids, Expanded

Raids 1–3 keep their base objectives, results and Levers. Each gains new phases below. Raids 4 and 5 are new. The total effect of all raids on the climax stays inside the bounds of design document §6.6.

### E6.1 Raid 1 — "Mt. Moon Fossil Dig", deeper

**New phase order:** Cave Mouth → Fossil Hall → **The Amber Lab** *(new)* → Loading Bay → **The Sky** *(new, conditional)*.

**The Amber Lab.** A tent behind the Fossil Hall. Inside: a revival machine wired to a Capture Rig, so that whatever wakes up wakes up bound.

> **FOREMAN GRIGGS:** "You're not supposed to see the tent. *I'm* not supposed to see the tent."
> **GRIGGS:** "We dig rocks. That's honest. What the doctor does to the rocks, that's above my pay. Everything's above my pay."
> *(Battle: Griggs. Trait: **Crew Loyalty**: his Pokémon cannot be made to flinch while another of his Pokémon is still standing; announced.)*
> **GRIGGS (defeat):** "…Tell you what. The amber one never took to the harness. Leave the tent flap open when you go."

**The Sky** *(only if the tent flap is left open, or the raid result is Partial or worse).* Amberjack breaks out through the cave roof.

> *(Battle on the mountainside: `ss.rocket.amberjack`, Tier 3. The Rig's antenna is a target: hitting Amberjack with an Electric or Rock move knocks the antenna loose and drops it one tier.)*
> **Choice after the battle:** [Take custody] (a Gripped Aerodactyl joins; Heat +2 once) / [Let it fly] (it returns as a rare wild encounter, Clear, as the Shadow doc's release rule says).

**New secondary objective C:** *Close the Amber Lab.* Completing it removes **Shellshock** from Phase 2 of the climax.

### E6.2 Raid 2 — "The Celadon Hideout", deeper

**New phase order:** Game Corner → B1 Arcade → **B1 Count Room** *(new)* → B2 Spin Maze → **B3 Kennels** *(new)* → B4 Boss's Office.

**The Count Room.**

> **PIT BOSS VESPER:** "Welcome to the only honest room in the building. Every coin that lies upstairs tells the truth down here."
> **VESPER:** "That's Jackpot. Top prize, nine thousand nine hundred coins. Nobody's ever won her. The machine isn't built to count that high."
> **PLAYER (choice):** ["Whose is she?"] → **VESPER:** "A dealer's. Was. He had a good week once." *(Unlocks Secondary A's location.)* / ["I'll play you for her."] → *(Battle: Vesper. Trait: **House Edge**: the first critical hit against her each battle becomes a normal hit; announced.)*
> **VESPER (defeat):** "House pays. First time for everything."

**The Kennels.** Rows of pens. Black tags. This is where the Black-Label line is made. A lever at the end opens every pen.

- **Pull it:** twelve Pokémon run for the stairs. Rep +6, Heat +6, and the alarm trips (the raid cannot score above Success). The Game Corner's prizes are ordinary for the rest of the region.
- **Leave it:** the raid can still Triumph. The kennels are listed in the Doom Ledger as `kennels.open = false`.

> **KENNEL GRUNT:** "I name them. We're not supposed to name them. That one's Biscuit."

### E6.3 Raid 3 — "Pokémon Tower", deeper

**New phase order:** Graves → Channelers → Butch and Cassidy → **The Top Floor** *(new)*.

Cassidy's Raticate has evolved. **Big Tab** (`sv.rocket.big-tab`) leads her side of the Double Battle.

**The Top Floor.** Mr. Fuji is tied to a chair. Between him and the stairs stands **Marrowmother**.

> **MR. FUJI:** "Don't hurt her. They put that thing on her after she was already gone. She only wants to know where her child is."
> *(If the Cubone Walker is with the player:)*
> *(The Cubone steps forward. Marrowmother's flames go from black to blue. The Rig falls off and breaks on the floor. She touches the Cubone's skull once and is not there anymore.)*
> **MR. FUJI:** "…There. That's all it ever was."
> *(Otherwise: Battle, `ss.rocket.marrowmother`, Tier 4. When her HP reaches zero she does not faint. She kneels. The scene above plays without the Cubone, and Mr. Fuji says: "She'll wait. They do.")*

**Reward (with the Cubone):** the Cubone joins the party with the Heart Scar *Steadfast* and the item **Mother's Bone** (its Ground moves gain +10%). **Lever bonus:** the ghosts fight for you in Phase 1 of the climax (one street battle is skipped).

### E6.4 Raid 4 — "The Vermilion Manifest" *(new)*

**Scale:** Border. **Offered:** after `xe.kanto.harbor-export`, between Raid 1 and Raid 2 windows.
**Offer (a dock worker, whispering):** *"That freighter leaves at four. Once it's past the breakwater, those Pokémon belong to another region's problem."*
**PR:** `pr.kanto.vermilion-docks` — 4 areas: Dockyard → Customs Shed → The Hold → Cast Off. **Security:** searchlights (a seen step adds +1 alarm), crane loads swinging over the path, a ship's horn that wakes reinforcements.
**Objectives:** *Primary:* stop the freighter leaving. *Secondary A:* take the manifest (LEDGER's backup). *Secondary B:* defeat Major Surge. *Secondary C:* get a reading from Ein's device.

**Phases**

1. **Dockyard.** Stealth across three crane rows. Each alarm point adds one Grunt battle. A crane operator can be talked round:
   > **CRANE OPERATOR:** "I just move boxes. I don't ask what's— okay, I know what's in the boxes. I've got kids."
   > *(Persuade: Rep 20 or more, or ₽2,000. He drops a load across the gate behind you: no reinforcements in the Customs Shed.)*
2. **Customs Shed.** Major Surge.
   > **MAJOR SURGE:** "I ran a clean Gym for ten years. Know what it paid? A plaque. Giovanni pays in *harbors*."
   > *(Battle: Surge. Executive Ability: **Shore Battery**: once per battle his Electric moves hit both of the player's active Pokémon; announced.)*
   > **MAJOR SURGE (defeat):** "Hah… Still got it, kid. Not me. *You*."
3. **The Hold.** Forty crates and one terminal. On the terminal sits a Porygon2 with a black tag: LEDGER's backup.
   > **LEDGER** *(text on the screen)*: `ENTRY 4,112. OWNER: PREVIOUS. STATUS: SOLD. QUERY: ARE YOU A BUYER?`
   > **PLAYER (choice):** ["No."] → `THEN YOU ARE AN ERROR.` *(Battle.)* / ["Show me entry 1."] → `ENTRY 1. ONE PIDGEY. OWNER: MADAME. STATUS: KEPT.` *(Intel +5; the battle is skipped.)*
4. **Cast Off.** The freighter's lines are being cut. **Timer: 8 turns** across two deck battles. If Ein is aboard:
   > **EIN:** "You've cost me a shipment. That's data too. Thank you."
   > *(He leaves by launch. If Secondary C was done, he drops nothing now; the reading becomes half of the Kanto Data ROM.)*

**Results (Lever: *The Manifest*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The freighter stays; forty Pokémon go home; LEDGER's backup is yours | **Paper trail:** the Convoy in Phase 7 is one battle shorter; `sv.rocket.ledger` can join now | −3 |
| **Success** | The freighter stays | Major Surge's district starts Held on the Siege Map | −2 |
| **Partial** | The ship sails half-empty | No change | −1 |
| **Failure** | The ship sails; you are left on the dock | **Export money:** +1 street battle in Phase 1 | +2 |
| **Declined** | The ship sails full | World state +1 | +1 |

**Failure consequences:** **C2 (Fine / Shakedown), C8 (Reputation fall), C11.**

### E6.5 Raid 5 — "Safari Night Poach" *(new)*

**Scale:** Region. **Offered:** world state 3 or higher, or after Raid 2 at any state.
**Offer (the Safari Warden, by lamplight):** *"They come after closing. They've put something in the water. The herds just lie down."*
**PR:** `pr.kanto.safari-night` — 4 areas: Gate → Watering Hole → The Long Grass → Truck Line. **Security:** night (wild Pokémon are drowsy and will not help), tripwires, a spotter with a Noctowl.
**Objectives:** *Primary:* stop the trucks. *Secondary A:* clean the watering hole. *Secondary B:* defeat Shinobi Koga. *Secondary C:* reunite Matron with her child.

**Phases**

1. **Gate.** Poacher-Captain Rudd is counting cages.
   > **RUDD:** "Thirty-one. Thirty-two. You'd be thirty-three if you were worth anything. Walk away."
2. **Watering Hole.** Koga stands on the far bank.
   > **SHINOBI KOGA:** "A sleeping draught. Nothing dies. I was specific about that."
   > **PLAYER:** "That's the part you're proud of?"
   > **SHINOBI KOGA:** "It is the part I can say aloud."
   > *(Battle: Koga. Executive Ability: **Slow Poison**: poison he inflicts cannot be cured for 2 turns; announced.)*
   > **SHINOBI KOGA (defeat):** "The antidote is the blue vial. Pour it upstream. Do not thank me."
3. **The Long Grass.** Matron (`ss.rocket.matron`) has been turned loose to guard the trucks. She fights anything that moves.
   > *(Battle: Tier 3. If the player has already opened the child's cage in the Truck Line by taking the side path, the child runs out mid-battle and Matron stops: Corruption −60 at once.)*
4. **Truck Line.** A Convoy of three trucks toward the gate. Rudd drives the last one.
   > **RUDD (defeat):** "Thirty-three cages. Thirty-three empty. That's a clean count, at least."

**Results (Lever: *The Herd*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | Every truck stopped; the water runs clean; Matron and her child are together | **The herd remembers:** a Tauros stampede clears one district on the Siege Map | −3 |
| **Success** | The trucks are stopped | Koga's district starts Held | −2 |
| **Partial** | One truck escapes | No change | −1 |
| **Failure** | The trucks leave; you wake at the gate | **Black-Label stock:** +1 Black-Label Pokémon on two gauntlet trainers | +2 |
| **Declined** | The Safari is stripped | Safari encounter pools halved for the region | +1 |

**Failure consequences:** **C3 (Confiscation), C10 (Shadowed), C11.**

---

## E7. The Climax — Extended Cut: "The Night of the Long Ledger"

`climax.cut = "extended"`. The base phases keep their rules; the table shows where the new ones sit. Checkpoints are after Phase 2 and at the Breather.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | Broadcast and Choice | — | base §10.1–10.3 | 0 |
| 0b | **The Sealed City** | Siege Map | new | 0 |
| 1 | **The Streets** | Blackout | new | 2–3 |
| 2 | The Climb | Gauntlet | base Phase 1, extended | 4–6 |
| 3 | The Officers | Duels | base Phase 2, extended | 2–3 |
| — | **Breather** | Rest | new | 0 |
| 4 | Saffron Sealed | Set piece | base Phase 3, extended | 2–4 |
| 5 | Giovanni | Boss | base Phase 4, extended | 1 |
| 6 | **The Roof: Project M2** | Colossus | new | 1 |
| 7 | **The Long Drive** | Convoy | new, optional | 2–3 |
| 8 | Resolution | — | base §10.9, extended | 0 |

### E7.1 Phase 0b — The Sealed City (Siege Map)

Saffron has four gates and five districts. Each district is **Held**, **Contested** or **Lost** when the climax begins.

| District | Held if… | If Lost |
| --- | --- | --- |
| **North Gate** (Route 5) | The rival is in the Help variant | The rival's battle is added to Phase 1 instead of removed |
| **East Gate** (Route 8) | Raid 3 Triumph (the ghosts) or `rocket.x.wire` (the police) | Reinforcements arrive one turn sooner in Phase 4 |
| **South Gate** (Route 6) | Raid 4 Success or better, or `rocket.x.surge-down` | Major Surge joins Phase 3 as a third duel |
| **West Gate** (Route 7) | Raid 5 Success or better | Shinobi Koga poisons the Breather (heal 35% instead of 50%) |
| **The Center** | Never; Oracle Sabrina holds it | See Phase 1 |

The player chooses a gate. A Held gate is a free entry. A Contested gate costs one battle. A Lost gate costs one battle and its effect.

> **OFFICER JENNY** *(at the cordon, if `rocket.x.wire`)*: "We can hold East for an hour. After that it's whoever's left standing. Don't be heroic. Be *quick*."

### E7.2 Phase 1 — The Streets (Blackout)

A curfew. Shop shutters. A violet shimmer over the rooftops: **the Seal**.

**Condition — *The Seal*:** no fleeing, no switching on the first turn of each battle, and Psychic moves gain +10% for both sides. It ends when two of the three **anchors** are beaten. Each anchor is a Mr. Mime holding a wall of light across a street.

> **ROCKET GRUNT (curfew patrol):** "Streets are closed, by order of— of the new management. I've got it written down."
> **ANCHOR TRAINER (Rocket Scientist):** "It's not a wall, technically. It's a very firm suggestion."

**If the Triad is active**, the last anchor is Sabrina herself, at the crossroads below Silph.

> **ORACLE SABRINA:** "I've seen this conversation. You ask me why. I tell you that a city this loud is easier to love when it is quiet."
> **PLAYER:** "And then?"
> **ORACLE SABRINA:** "And then I didn't look further. I never do, when it's me."
> *(Battle: Sabrina. Executive Ability: **Foresight Tax**: the first move the player selects each turn is revealed to her before she chooses; announced, and it stops for the battle once any of her Pokémon faints.)*
> **ORACLE SABRINA (defeat):** *(The shimmer over the roofs goes out.)* "Oh. It's noisy again. …I had forgotten I liked it."

### E7.3 Phase 2 — The Climb (extended)

Gauntlet battles follow the base formula (design document §7.5). New floors are drawn from this table when the formula asks for more than five.

| Floor | Trainer | Notes |
| --- | --- | --- |
| Lobby | Rocket Grunts ×2 | base |
| **3F Freight Lift** | Kennel Handler | Two Black-Label Pokémon; *Tagged* applies |
| 5F | Silph Researchers ×2 | base |
| 7F | Cassidy with **Big Tab** | Trait: **Rival Agents** |
| 9F | Butch | base |
| **10F Specimen Hall** | Rocket Scientist with **Shellshock** | Removed if Raid 1's Amber Lab was closed |
| 11F | Jessie, James and Meowth | base; see below |

> **KENNEL HANDLER:** "They told me to stop naming them. This one's Biscuit Two."
> **BUTCH:** "Don't say it. Whatever you're about to call me, don't."
> **BUTCH (defeat):** "It's *Butch*. It was always Butch."

**The trio on 11F.** If `rocket.x.trio-debt` is set, there is no battle.

> **JESSIE:** "We were told to stop you."
> **JAMES:** "We were also told we'd be paid."
> **MEOWTH:** "So here's the deal, twerp. We lost. Real dramatic. You shoulda seen it." *(He kicks over a potted plant and lies down next to it.)*
> **JESSIE:** "Roof door sticks. Lift the handle, *then* push."

### E7.4 Phase 3 — The Officers (extended)

**Duel 1 — Domino** (base §10.5). New lines:

> **DOMINO (opening, if the player took Matori's envelope):** "You took his money and came anyway. I'd admire that if it weren't my evening you were ruining."
> **DOMINO (at half her team):** "Agent 009. You should know the number. Somebody ought to remember it."

**Duel 2 — Matori** *(new)*. The 11th-floor anteroom. She is still holding the tablet.

> **MATORI:** "He has a helicopter at one, a call with Johto at two, and you, apparently, now."
> **MATORI:** "I'm not a fighter. I'm the reason fighters arrive on time."
> *(Battle: Matori, with Hypno, Mr. Mime, Persian, Kadabra. Executive Ability: **Rescheduled**: once per battle she swaps the turn order for one turn, so the slower Pokémon moves first; announced.)*
> **MATORI (defeat):** "I'll move his one o'clock." *(She does. That is the helicopter. Phase 7 becomes available.)*

**Duel 3 — conditional:** Butch and Cassidy together (base), or Major Surge if the South Gate was Lost.

### E7.5 Breather

The President's secretary pulls the player into a pantry on the 8th floor.

> **SECRETARY:** "I've worked here nineteen years. I know which doors he hasn't found. Sit. Eat something. You look like the stock price."

Heal 50%, revive one Pokémon, checkpoint. No shop.

### E7.6 Phase 4 — Saffron Sealed (extended)

The base set piece (Card Key stations, reinforcement waves, 12-turn timer) gains one objective: **the Rig Room**.

**The Rig Room.** On the 6th floor Dr. Namba runs the master pulse for every Capture Rig in the building.

> **DR. NAMBA:** "You! You're the one who's been breaking my equipment across four cities!"
> **PLAYER:** "Dr. Nanba?"
> **DR. NAMBA:** "*NAMBA!* It's Namba! It's on the door! It's on the *patent*!"
> *(Battle: Namba, with Magneton, Porygon2 and two **Blackout** Electrode. Each Blackout that faints darkens the field for 3 turns.)*
> **DR. NAMBA (defeat):** "The pulse was *elegant*. The other one, the quiet one, he only improved the casing. Write that down. *Namba.*"

**Shutting down the pulse:** every Shadow Pokémon in the building drops one tier for the rest of the climax, including M2. Skipping the Rig Room saves two turns of the timer.

**New PA lines** *(Giovanni, as stations fall)*:

> "One station. I've lost more than that at lunch."
> "Two. Matori, find out who trained this person and send them a gift."
> "Three. …Bring the car round. No. Bring the *other* thing round."

### E7.7 Phase 5 — Giovanni (extended)

The base fight (§10.7) with the named team: **The House Pair**, Dugtrio, Rhyhorn, **Vault-Breaker**, and **Chairman** at his side.

**New boss stage — *Hostile Takeover*** (after *The Boss Stands*): when Vault-Breaker falls below 25% HP, it tears off its own tag and becomes **Z-Rhyperior** (Rock/Steel). No healing. *Tagged* ends; *Drill Through* refreshes.

> **GIOVANNI (opening, extended):** "Sit. No? Then stand. I've read your file. Mt. Moon, Celadon, a harbor, a zoo. You've been auditing me."
> **GIOVANNI:** "Do you know what the ledger says about you? Nothing. You've taken nothing, sold nothing. You're the only blank page in Kanto. I find that *offensive*."
> **GIOVANNI (when Chairman takes the hit):** "He's been with me longer than the company. Mind him."
> **GIOVANNI (Hostile Takeover):** "It tore the tag off. …Good. I never liked a thing that needed one."
> **GIOVANNI (defeat, extended):** "You've won the office. Offices are furniture." *(He straightens his cuffs and walks to the private lift.)* "Come up, if you like. I keep the real asset where the air is thin."

### E7.8 Phase 6 — The Roof: Project M2 (Colossus)

*The helipad. Rain. A shape in grey armor kneels at the center, cabled to a generator. Ein stands under an umbrella at the far rail, writing.*

> **GIOVANNI:** "It doesn't have a name. I was told it had opinions about names."
> **EIN:** "Corruption ninety-one. It's still resisting. It's wonderful."
> **GIOVANNI:** "I didn't ask."

**Format.** M2 (`ss.rocket.m2`, XD002) is a Colossus with **four armor seals** (two shoulders, chest, crown), each with its own shield bar. It cannot be knocked out while a seal remains. Breaking a seal removes one of its moves, in this order: Mind Vault, Null Pulse, Heart Eclipse, and last its obedience.

**Timer:** 10 turns. **Adjustments:** the Seal Diagram starts with one seal cracked; the Rig Room shutdown lowers M2 one tier; `rocket.x.madame` gives one free turn; the trio's debt means the roof door opened quietly and Giovanni's first order is delayed a turn.

> **M2** *(a voice with no mouth, after the first seal)*: "…Who… is giving… the orders."
> **M2** *(after the third)*: "I can hear myself. Stop hitting me. Hit *it*."
> **GIOVANNI (third seal):** "Ein. Increase it."
> **EIN:** "It would die. I'd lose the sample." *(He closes his notebook.)* "I have what I came for. Good evening."

**When the fourth seal breaks:** the armor falls away. M2 stands. For one turn nothing happens.

> **M2:** "You broke the cage and not the thing in it. I'll remember that this happened. I will not remember it *fondly*. But I will remember."
> *(It is gone. `legend-cerulean-cave` is planted.)*

**If the timer runs out:** the helicopter lifts with M2 slung beneath it. The climax is still won if Giovanni was beaten, but XD002 enters the Region of Doom and `rocket.x.m2 = taken`.

### E7.9 Phase 7 — The Long Drive (Convoy, optional)

*Available if Matori moved the one o'clock.* Giovanni leaves by car for Viridian with the original LEDGER on the seat beside him.

**Format:** a Convoy of three battles (two if Raid 4 was a Triumph) along Route 7: an escort van, Poacher-Captain Rudd or a Black-Label Handler, then the car.

> **GIOVANNI (through the car window, not stopping):** "You're persistent. I'd have hired you. I want that understood before this goes any further."
> *(The last battle is not Giovanni. It is LEDGER, on the bonnet, as a Porygon-Z.)*
> **LEDGER:** `ENTRY 9,999. OWNER: NONE. STATUS: UNSOLD. QUERY: WHAT AM I?`
> **PLAYER (choice):** ["You're a list."] → *(Battle.)* / ["You're a witness."] → `…RECLASSIFYING.` *(No battle. LEDGER joins the player.)*

Catch the car: the ledger is yours (see Resolution). Lose the Convoy: nothing is lost except the ledger; the climax result stands.

### E7.10 Phase 8 — Resolution (extended)

The Master Ball choice (base §10.9) is unchanged. If the player holds the ledger there is a second choice.

1. **[Publish it]** — Every stolen Pokémon in Kanto can be traced. *Effects:* world state resets to 0; region reputation +20; Rocket Remnants (script 00) hunt you with +1 Heat tier in the next region.
2. **[Return them quietly]** — Officer Jenny and Mr. Fuji work through the list for months. *Effects:* reputation +10; three random earlier victims send gifts over the next two regions.
3. **[Keep it]** — Leverage over everyone who ever bought. *Effects:* a unique Key Item; shop prices −15% everywhere ("your name is known"); `rocket.x.kept-ledger = true`, and LEDGER, if it is in your party, loses its trust in you (its trait is disabled until you choose again).

> **GIOVANNI (phone, after any choice):** "Mother. …Yes. …No, the *roof*. …Yes, you told them. I'm aware you told them."

### E7.11 Rival and Stand-with additions

- **Help:** the rival holds the North Gate and joins Phase 6 for two turns. *Line:* "That's a *Pokémon* in there? …Okay. Okay. Which seal?"
- **Beat-you:** the rival is found in the Specimen Hall, not the supply room. They opened one cage before they were caught.
- **Side-with:** the rival is **Agent 010, "Blank Card"**. Domino introduces them: "Ten. Say hello to the reason you were promoted." A successful Turn makes the rival tear off their own tag-pin; they take Matori's duel for you.
- **Stand with them:** the player is **House Card**. Phase 6 is inverted: the player defends the generator while police helicopters arrive, and M2's seals are the player's shields. See `scripts/10_STAND_WITH_THEM.md` §1 for the endings; the new line is Giovanni's: "House Card. If it speaks to you, don't answer."

---

## E8. Aftermath and the Thread

- **If M2 walked free:** *Kanto Network News:* "A flash was seen over Cerulean last night. Meteorologists say it wasn't weather. They decline to say what it was."
- **If M2 was taken:** "A helicopter with no markings was tracked as far as the coast. Then, sources say, the radar simply declined to continue."
- **If the ledger was published:** a crowd outside every Pokémon Center, reading lists taped to the glass.
- **Blaine**, if he held a district: "Riddle. What's lighter after you put it down? …No. That one really is a riddle. Think about it."
- **The Triad:** each member beaten before the climax returns to their Gym "on leave". Each one not beaten is listed in the Doom Ledger as an Executive.

**The Thread (`docs/GRAND_ARC.md`).** Ein's readings and the manifest make **Data ROM K: "Rig Pulse"**. It is complete if Raid 4's Secondary C was done *or* the Rig Room was shut down. The ROM shows that the Capture Rig's pulse is not Rocket's design. The same waveform will be heard on a radio in Johto (script 02x).

> **MADAME BOSS (phone, last line of the region):** "He'll sulk for a year, then he'll try it again somewhere with a tower. He's always liked towers. Do drop in."

---

## E9. Dialogue Bank

### E9.1 New ambush lines

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Collector (Cheerful) | "Evening! Have you thought about what could happen to a team like that, uninsured?" | "I'll mark you 'paid in full'. Nobody checks." |
| Grunt — Kennel Handler (Soft) | "Don't make me send out Biscuit. Biscuit doesn't want to." | "Good. Biscuit didn't want to." |
| Grunt — Dock Hand (Tired) | "I move boxes. Tonight you're a box." | "Heavy box." |
| Grunt — Curfew Patrol (Officious) | "Papers. No? Then Pokémon. It's one or the other." | "I'll say you had papers." |
| Specialist — Rig Technician (Proud) | "Mark Four harness. Hand-fitted. Watch what it does." | "It's a prototype! *Everything's* a prototype!" |
| Specialist — Poacher (Quiet) | "Shh. You'll wake the stock." | "…Now they're awake." |
| Lieutenant — Griggs (Gruff) | "Nothing personal. I've got a crew to feed." | "Crew eats tomorrow, I suppose." |
| Lieutenant — Vesper (Smooth) | "Care to make it interesting? The house covers all bets." | "The house… will need a moment." |
| Commander — Rudd (Patient) | "I've counted you three times. You keep coming out as trouble." | "Recount." |
| Commander — Namba (Vain) | "Behold the work of Dr. *Namba*! Say it back to me!" | "You said it wrong *in your head*, I could tell!" |
| Executive — Matori (Precise) | "You have four minutes of my time. Use them to reconsider." | "You've overrun. I'll bill him." |
| Executive — Major Surge (Booming) | "Ten-hut! Inspection!" | "Dismissed. …Me, I mean. I'm dismissed." |

### E9.2 Giovanni's barks

| Moment | Line |
| --- | --- |
| Player lands a super-effective hit | "Noted." |
| Player's Pokémon faints | "A cost. You'll learn to stop counting them. I did." |
| His Pokémon faints | "Replaceable. That's the point of having many." |
| Player uses a healing item | "Spend it. Everyone does, near the end." |
| A Shadow Pokémon in the player's party disobeys | "Ah. You've been buying from my catalogue." |
| Last Pokémon each | "Now it's a conversation." |

### E9.3 The trio's banter (random, one per encounter)

| # | Exchange |
| --- | --- |
| 1 | **JESSIE:** "We've a new plan." **JAMES:** "It's the old plan." **MEOWTH:** "With a hat on it." |
| 2 | **JAMES:** "Do you think the Boss knows our names?" **MEOWTH:** "He knows our *expenses*." |
| 3 | **JESSIE:** "This time we have the element of surprise!" **JAMES:** "You said that out loud." |
| 4 | **MEOWTH:** "I learned to talk for this job. *Talk.* And they got me countin' fossils." |
| 5 | **JAMES:** "I rather like this twerp." **JESSIE:** "Don't *like* the twerp." **JAMES:** "From a distance, I meant." |
| 6 | **JESSIE:** "If we fail—" **MEOWTH:** "*When.*" **JESSIE:** "—*if* we fail, we fail with style." |

### E9.4 Civilians by world state

| Step | Line A | Line B |
| --- | --- | --- |
| 1 Small Print | "Prices went up. Nobody will say why. Everybody knows why." | "My neighbor paid. I'm thinking about it." |
| 2 House Rules | "My daughter won a Clefairy at the Corner. It flinches when I raise my hand to wave." | "The Center shuts at eight now. 'Staffing', they said." |
| 3 Closed Roads | "Two Snorlax, two roads. That's not nature. That's planning." | "I've been 'detouring' to work for a week." |
| 4 Export | "Used to be Pidgey on this route. Listen. Hear that? Me neither." | "They load at night. I've stopped looking at the harbor." |
| 5 Under New Management | "The advert said 'Rocket: we're already here.' It wasn't wrong." | "…" *(They shut the door.)* |

### E9.5 Announcer lines for special Pokémon

| Pokémon | On entry |
| --- | --- |
| Chairman | "Chairman takes a seat at the table. The foe's boosts are cleared!" |
| Vault-Breaker | "Vault-Breaker lowers its drill." |
| LEDGER | "LEDGER opens a new line." |
| Big Tab | "Big Tab has come to collect." |
| The Roadblock | "The Roadblock is fed and paid." |
| Marrowmother | "The shadow tightens. Something upstairs is crying." |
| M2 | "The armor hums." |

---

## E10. Flags and Wiring

| Flag | Set by | Read by |
| --- | --- | --- |
| `rocket.x.ledger` (0–5) | Raids, climax schedule | Civilians, shops, events |
| `rocket.x.triad` | Setting | E2.2, Siege Map |
| `rocket.x.paid-once`, `.receipt-book` | *Small Print* | Collector ambushes |
| `rocket.x.bought`, `.wire` | *The Appointment* | Raid offers, Siege Map, Domino's line |
| `rocket.x.roadblock` | *The Roadblock* | World state |
| `rocket.x.surge-down`, `.manifest-count`, `cipher.seen.ein` | *Harbor Export*, Raid 4 | Siege Map, Grand Arc |
| `rocket.x.madame`, `.trio-debt`, `.orphan` | Events | Phase 6, Phase 2, Raid 3 |
| `rocket.x.m2` (`freed` / `taken`) | Phase 6 | Aftermath, Region of Doom |
| `rocket.x.kept-ledger` | Phase 8 | LEDGER's trait, prices |
| `cipher.rom.k` | Raid 4 or Rig Room | `docs/GRAND_ARC.md` |

**Counts for this file:** 13 named characters (7 new officers, 6 team versions), 9 special Pokémon, 6 special Shadow Pokémon (1 Apex), 8 story events, 3 deepened raids and 2 new raids, an 8-phase Extended Cut, and 5 dialogue tables.
