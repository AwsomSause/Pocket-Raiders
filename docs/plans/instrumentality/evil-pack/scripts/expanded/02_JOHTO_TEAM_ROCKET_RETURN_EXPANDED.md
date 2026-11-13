# 02x — JOHTO: TEAM ROCKET RETURNS — EXPANDED EDITION
### Script: *Dead Air*

> *"I am not asking him to lead. I am asking him to pick up."* — Archer

**Extends:** `scripts/02_JOHTO_TEAM_ROCKET_RETURN.md` (the base script stays valid; this file adds to it)
**Template:** `docs/EXPANSION_DESIGN.md` · **Cross-region arc:** `docs/GRAND_ARC.md`
**Canon note:** Archer, Ariana, Petrel, Proton, Giovanni, Lance, Kurt, Eusine, DJ Mary and Buena are canon to the games. The Iron-Masked Marauder and his Dark Balls, Attila, Hun, Professor Sebastian, Tyson, Dr. Namba and the young Lugia named Silver are canon to the anime and its films. Miror B. is a canon Cipher admin (Colosseum). Petrel posing as the Director and as Giovanni, and the journey back to Tohjo Falls, follow the games. **The Heir** (Giovanni's son offered the chair) and **Mary of the Black Hour** are *what-if* versions. All dialogue is original. Species are my best recall and are marked approximate.

---

## E1. The Wider Scale

The base script is a tower and a plea. The Expanded Edition makes the plea a signal that the whole region can hear, and gives it a rhythm that Rocket did not write.

### E1.1 The plan at five scales

| Scale | What Rocket is doing | What the player sees | Where it pays off |
| --- | --- | --- | --- |
| 1 **Street** | Selling Slowpoke tails; testing the pulse on stray Pokémon | A market stall with a price nobody can pay; a Rattata walking in circles | Event *The Tail Market*, Raid 1 |
| 2 **City** | Replacing the Radio Director; running a midnight show of coded orders | A Director who has forgotten his own staff; a DJ who sounds frightened | Events *The False Director*, *The Black Hour* |
| 3 **Region** | Driving the Lake of Rage mad; hunting the three beasts of the Burned Tower; netting a young Lugia at the Whirl Islands | Red water, storm fronts that follow no weather, a tower that smokes again | Raids 3, 4 and 5 |
| 4 **Border** | Receiving rigged Pokémon from Vermilion at Olivine; pushing the signal east along the Magnet Train line | A lighthouse that flickers in time with the radio | Event *Olivine Arrival* |
| 5 **World** | Binding Celebi with a Dark Ball so that Archer can stop asking the Boss to return and simply go back to before he left | A forest that has lost a day | Climax Phases 6 and 7 |

### E1.2 World-state track — *The Signal Spreads*

Stored in `rocket-return.x.signal` (0–5). Gained and removed as in the design note §4.

| Step | Name | Regional rule | Civilian mood |
| --- | --- | --- | --- |
| 1 | **Static** | Radios in rest nodes play static; the Pokégear map loses one node of preview | Puzzled |
| 2 | **Jingle** | Shops play the Rocket jingle; Slowpoke tails appear in one shop per city | Uneasy |
| 3 | **Rage** | Wild Pokémon near water are one evolution stage higher at 20% odds | Frightened |
| 4 | **Carrier Wave** | The signal reaches the next region's border; one Kanto-style Black-Label Pokémon appears on Executive teams | Tired |
| 5 | **The Call** | Every radio carries Archer's voice; the climax is scheduled | Listening |

### E1.3 The bigger secret

The broadcast is a plea (base script §3). Archer's *welcome nobody else is ready for* is the part he has not told the other Executives. He has hired **the Iron-Masked Marauder**, Rocket's most dangerous freelancer, to take **Celebi** from Ilex Forest with a **Dark Ball**. If the Boss answers, Celebi is a gift. If the Boss does not answer, Archer will not need him to: he will go back three years, to the lobby of Silph Co., and make sure nobody ever has to ask.

The signal itself is a second secret. Proton built the transmitter, but the rhythm underneath it, the beat that makes a Pokémon stop listening to its trainer, came on a cassette from a man with a very large afro. **Miror B.** of Cipher is in Johto to collect three things for his colleagues. He is quite put out that none of them is for him.

---

## E2. Expanded Cast

### E2.1 New officers and specialists

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.rocket-return.marauder` | **The Iron-Masked Marauder** | Executive (5) | canon (film) | Enforcer: a freelancer who answers to money and then to no one | **Overlord** (Tyranitar), **Sliver** (Sneasel), Scizor | Booming, delighted with himself |
| `sc.rocket-return.attila` | **Attila** | Commander (4) | canon (anime special) | Enforcer: beast hunter | **Razor** (Skarmory), Muk | Loud, impatient |
| `sc.rocket-return.hun` | **Hun** | Commander (4) | canon (anime special) | Strategist: beast hunter | **Girder** (Steelix), Crobat | Quiet, exact; finishes Attila's sentences correctly |
| `sc.rocket-return.sebastian` | **Professor Sebastian** | Commander (4) | canon (anime special) | Scientist: maker of the Miracle Crystal | Magnezone, Electrode *(approximate)* | Lectures; applauds his own results |
| `sc.rocket-return.tyson` | **Tyson** | Lieutenant (3) | canon (anime) | Technician: chief of the Lake of Rage project | Fearow, Persian *(approximate)* | Businesslike, sure it is only a job |
| `sc.rocket-return.namba` | **Dr. Namba** | Commander (4) | canon (anime) | Scientist: runs the Whirl Islands net | Magneton, Electrode | Still furious about his name |
| `sc.rocket-return.miror-b` | **Miror B.** | Liaison (4) | canon (Colosseum) | Handler: Cipher's collector in Johto | Ludicolo, Ludicolo, Ludicolo, Sudowoodo | Sing-song, never stops moving, sharper than he looks |

### E2.2 Team versions of characters you know

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.rocket-return.false-director` | **The False Director** (Petrel) | Executive (5) | canon (games) | Infiltrator: Petrel wearing the Radio Director's face | **Understudy** (Ditto), Weezing | The Director's voice, a half-beat late |
| `sc.rocket-return.counterfeit-boss` | **The Counterfeit Boss** (Petrel) | Executive (5) | canon (games) | Infiltrator: Petrel practising to be Giovanni | Weezing, Golbat | Giovanni, done badly, with laughing |
| `sc.rocket-return.heir` | **The Heir** | Ally or Leader-designate (7) | what-if | Giovanni's son, offered his father's chair and a white-trimmed coat | Weavile, Crobat, Magnezone *(approximate)* | Furious, proud, allergic to the letter R |
| `sc.rocket-return.black-hour` | **Mary of the Black Hour** | Hostage | what-if | DJ Mary, made to read Rocket's midnight scripts under guard | None | Bright on air; shaking between songs |
| `sc.rocket-return.lance` | **Lance** | Ally | canon (games) | The dragon master investigating the Lake | Dragonite | Courteous; alarming when he gives an order |
| `sc.rocket-return.rival-dial-tone` | **Junior Executive "Dial Tone"** (the rival) | Lieutenant (3) | what-if | The rival in a white-trimmed coat, in the Side-with variant | The rival's team plus the Red Gyarados | The rival's archetype, reading from a script |
| `sc.rocket-return.player-standby` | **Executive-in-Waiting "Standby"** (the player) | Specialist (2) | what-if | The player on the Inside Man and Stand-with routes | The player's team | — |

> **Why the Heir matters.** Archer wants a Boss. If the father will not answer, the son has the name. The Heir despises Team Rocket and says so at length. What he does with the offer depends on the player (event *The Chair*).

---

## E3. Special Pokémon — the Dark Ball line

**Dark Ball** Pokémon were caught in the Marauder's black capsules. A Dark Ball does not ask. It takes a Pokémon at the height of its strength and leaves nothing else.

**Line rule — *Dark Ball*:** a Dark Ball Pokémon enters every battle with +1 Attack and +1 Special Attack, and loses 1/16 of its HP at the end of each turn (announced: "The Ball burns."). The rule ends when its trainer is beaten. A Dark Ball Pokémon taken into custody cracks its Ball and keeps only its signature trait.

| ID | Name | Species | Signature trait | Where met | Can the player get it? |
| --- | --- | --- | --- | --- | --- |
| `sv.rocket-return.overlord` | **Overlord** | Tyranitar / Mega Tyranitar | *Scorched Ground*: while its sandstorm blows, Berries cannot be eaten by either side | The Marauder's ace | No |
| `sv.rocket-return.sliver` | **Sliver** | Sneasel / Weavile | *Marked Prey*: +20% damage against the Pokémon it hit last turn | The Marauder | No |
| `sv.rocket-return.vigil` | **Vigil** | Houndoom / Mega Houndoom | *Keeps the Fire*: burns it inflicts cannot be cured by items for 2 turns | Archer | No |
| `sv.rocket-return.last-call` | **Last Call** | Murkrow / Honchkrow | *Last Call*: when it is Archer's last Pokémon, its first move has +1 priority | Archer's ace | No |
| `sv.rocket-return.understudy` | **Understudy** | Ditto | *Quick Change*: on entry it becomes the last Pokémon the player sent out | Petrel | Yes: it defects if Petrel is beaten in every disguise |
| `sv.rocket-return.razor` | **Razor** | Skarmory / Z-Skarmory | *Clean Cut*: its slicing moves ignore the target's Defense boosts | Attila | No |
| `sv.rocket-return.girder` | **Girder** | Steelix / Z-Steelix | *Load-Bearing*: takes 25% less damage while a partner is on the field | Hun | No |
| `sv.rocket-return.night-desk` | **Night Desk** | Noctowl / Z-Noctowl | *Night Desk*: reveals the player's held items at the start of the battle | Signal Technicians on the Tower's upper floors | Yes: a wild one waits on the roof after the climax |
| `sv.rocket-return.old-yawn` | **Old Yawn** | Slowpoke / Slowking | *The Yawn That Ended the Drought*: its Yawn also brings rain for 5 turns | The Slowpoke Well | Yes: it follows you after a Raid 1 Triumph |

> Vigil and Last Call are Archer's own and were never in a Dark Ball. They are listed here because they share the line's look in battle: a black ring on the Poké Ball that Archer wears as mourning.

---

## E4. Special Shadow Pokémon

Rocket Return's method is the **Radio Wave Lock**; cutting the broadcast that holds a Pokémon gives −35 Corruption (Shadow doc §6).

| ID | Code | Name | Species | Tier | Shadow ability | Shadow moves | Purification key | Where met |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ss.rocket-return.rage-signal` | — | **Rage Signal** | Gyarados / Mega Gyarados | 3 Gripped | Overbound | Hollow Tide, Gloam Crash, Umbral Rush | Destroy the Lake transmitter, then stand at the shore with it for one rest node | Raid 3; the red Gyarados of the Lake |
| `ss.rocket-return.silver` | — | **Silver** | Lugia | 2 Bound | Choir Hum | Hollow Tide, Siphon Lull | Story only: return it to its parent in the storm | Raid 5 |
| `ss.rocket-return.thunder-under-glass` | — | **Thunder Under Glass** | Raikou | 3 Gripped | Lurker | Umbral Rush, Dusk Brand, Null Pulse | Shatter the Miracle Crystal | Raid 4 |
| `ss.rocket-return.ash-crown` | — | **Ash Crown** | Entei | 3 Gripped | Dread Aura | Ember of Grief, Gloam Crash, Null Pulse | Shatter the Miracle Crystal | Raid 4 |
| `ss.rocket-return.north-wind` | — | **North Wind** | Suicune | 3 Gripped | Shroud | Hollow Tide, Chain Hymn, Null Pulse | Shatter the Miracle Crystal | Raid 4 |
| `ss.rocket-return.dark-celebi` | XD003 | **Dark Celebi** | Celebi | 4 Fallen | Echo of Another | Pale Echo, Heart Eclipse, Yesterday's Thorn | Story only: break the three Thorn Rings and call it by the name Kurt gave you | The Tower roof, Phase 6 |

**Signature Shadow move — Yesterday's Thorn:** 80 power; at the end of the next turn the target takes the same damage again ("It already happened."). The echo can be blocked by Protect. Cost: +6 Corruption. Announced one turn ahead ("The air smells of last autumn.").

**Notes**
- **The three beasts** follow the Legendary Shadow rules: they cannot be captured or Mentor-bound. Each beast that is *not* freed in Raid 4 leaves Johto in a Cipher crate and returns later as a liaison's own Shadow: Raikou with Ein, Entei with Dakim, Suicune with Venus (`cipher.beast.*`; see `docs/GRAND_ARC.md`).
- **Silver** is a young Lugia. It is never fought to a knockout: at 1 HP it hides behind the player.
- **Dark Celebi** copies an ability from the player's side each time it enters a new Thorn Ring.

---

## E5. New Story Events

### E5.1 *The Tail Market* (`xe.johto.tail-market`) — Street

*Trigger: any city node after Ignition. A folding table. A handwritten sign: SLOWPOKE TAIL. NUTRITIOUS. ₽1,000,000.*

> **VENDOR (a Grunt in a paper hat):** "One million. It's a premium product."
> **PLAYER:** "Has anyone ever paid that?"
> **VENDOR:** "No. Between us? I think the price is so nobody asks where they come from."
> **PLAYER (choice):**
> 1. **[Buy one]** *(if you somehow can)* → A **SlowpokeTail**. Kurt will never speak to you again. `rocket-return.x.bought-tail = true`.
> 2. **[Tip over the table]** → *(Battle: Vendor.)* **VENDOR (defeat):** "I *hated* the hat." *(Intel +3: the delivery slip names Azalea.)*
> 3. **["Do they grow back?"]** → **VENDOR:** "…Yeah. That's what they told us. So it's fine. That's why it's fine." *(He packs up and leaves. Rep +2; one fewer Grunt in Raid 1.)*

### E5.2 *The False Director* (`xe.johto.false-director`) — City

*Trigger: Goldenrod, world state 2 or higher. The Radio Tower is running tours. The Director greets the group himself.*

> **THE DIRECTOR:** "Welcome, welcome, to the, ah. The Radio Tower. Which I direct."
> **BUENA** *(whispering)*: "He asked me my name this morning. I've had the slot after his for six years."
> *(Three tells can be found on the tour: he salutes with the wrong hand; his office plant is dead; his coffee mug says WORLD'S BEST EXECUTIVE.)*
> **PLAYER (choice, after at least two tells):** ["What's today's password?"] → **THE DIRECTOR:** "The pass— of course. It's. 'Radio.'" **BUENA:** "It's *never* 'Radio'." *(He bolts for the lift. Intel +5; `rocket-return.x.director-known = true`: the real Director can be rescued in Phase 1.)*
> **PLAYER (choice, any time):** [Say nothing] → No change. / [Accuse him with fewer than two tells] → Security escorts you out; Heat +4.
> **THE DIRECTOR (lift doors closing, in Petrel's voice):** "Six years! Who keeps a *slot* for six years?"

### E5.3 *The Black Hour* (`xe.johto.black-hour`) — City

*Trigger: any rest node at night, world state 2 or higher. The radio is on.*

> **MARY (on air):** "…and that was 'Lullaby for a Lapras'. It's midnight, Johto. This is the, um. The Black Hour."
> **MARY:** "Tonight's weather for our friends in the north: *heavy cloud, three trucks, by the lake, before the second bell.* And for our friends in the west: *no rain. The well is dry.*"
> *(A chair scrapes. Someone coughs who is not Mary.)*
> **MARY** *(too brightly)*: "And remember, listeners: Rocket's future is bright!"
> **PLAYER (choice):** [Write it down] → Intel +4; the next raid offer shows its true guard count. / [Call the station] → **MARY** *(live, after a pause)*: "We have a caller. Go ahead, caller. …Yes. *Yes*, I'd love to take a request." *(Unlocks her rescue on the Tower's 3rd floor; the guard is on alert: +1 battle there.)* / [Turn it off] → No change.

### E5.4 *The Dragon Tamer* (`xe.johto.dragon-tamer`) — Region

*Trigger: Lake of Rage, world state 3, or the offer of Raid 2. A man in a cape is watching the red water.*

> **LANCE:** "Gyarados don't gather. They don't *share* a lake. Something is telling them to."
> **LANCE:** "I've traced a signal to a souvenir shop. I intend to be direct about it. You may come, if you can keep up."
> **PLAYER (choice):** ["I'll keep up."] → Lance joins Raid 2 as an ally: he clears the Corridor floor alone. / ["What does 'direct' mean?"] → **LANCE:** "Dragonite. The door, please." *(Offscreen: a crash.)* **LANCE:** "It means that." / ["I work alone."] → He nods. He holds a district on the Siege Map instead.

### E5.5 *Olivine Arrival* (`xe.johto.olivine-arrival`) — Border

*Trigger: Olivine, at night. A freighter with no name. In the lighthouse, Ampharos's light is flickering in four-four time.*

> **MIROR B.** *(on the dock, to a boombox, to nobody)*: "And *one* and *two* and— oh! An audience!"
> **MIROR B.:** "Don't mind the crates, darling, the crates are boring. Three more are coming that are *not* boring. One for the doctor, one for the brute, one for the beauty."
> **PLAYER:** "And yours?"
> **MIROR B.** *(the dancing stops for exactly one second)*: "…Mine is the *music*. Everyone forgets the music. Without the music it's just a radio."
> **PLAYER (choice):** [Ask about the music] → He hands over a cassette: **Carrier Beat (Side B)**, Intel +5, and the Phase 4 rhythm is shown one turn early. / [Challenge him] → *(Battle: three Ludicolo and a Sudowoodo. Trait: **Dance Floor**: his Pokémon swap places every second turn at no cost; announced.)* / [Go up the lighthouse] → Calm Ampharos (spend one status-healing item): Olivine's district starts Held.
> **MIROR B. (defeat):** "Fabulous! You've *no* rhythm but such conviction!"

*Writes: `cipher.seen.miror-b`. If the freighter left Vermilion full (Kanto Raid 4 Declined or Failed), two Black-Label Pokémon appear on Executive teams.*

### E5.6 *The Chair* (`xe.johto.heir`) — Region

*Trigger: Mahogany, after Raid 2 is offered. Outside the souvenir shop, a red-haired boy is being followed by a man in a white-trimmed coat.*

> **ARCHER:** "Your father's office is as he left it. I have had it dusted every week."
> **THE HEIR:** "Burn it."
> **ARCHER:** "You have his eyes. You have his name. The organization requires only—"
> **THE HEIR:** "He *lost*. He lost to a kid and he walked off. That's what I've got of his. Don't put a coat on it."
> *(Archer leaves a folded coat on the bench anyway. The Heir stares at it.)*
> **PLAYER (choice):**
> 1. **["You'd be better at it than him."]** → He looks at the coat for a long time. `rocket-return.x.heir = tempted`. *In Phase 5 he arrives wearing it, and takes it off only if the player wins.*
> 2. **["Then help me end it."]** → **THE HEIR:** "I'm not *helping you*. I'm going the same direction." `…= ally`. *He holds the Magnet Train Station on the Siege Map.*
> 3. **[Say nothing; sit down]** → *(A minute passes.)* **THE HEIR:** "…It's a nice coat. That's the worst part." `…= undecided`; resolved by a coin the player never sees (50/50 between the two above).

### E5.7 *The Shrine Keeper* (`xe.johto.shrine-keeper`) — Street

*Trigger: Azalea or Ilex Forest, any time after Raid 1. Kurt is sitting in front of the shrine with a calendar.*

> **KURT:** "Tuesday. I went to bed Tuesday. I woke up Thursday. The apricorns on the sill had ripened and nobody had turned them."
> **KURT:** "The forest's guardian keeps the days in order. Something's taken it out of its place, so the days are loose."
> **KURT:** "My grandfather called it a name, when he was small and it came to the shrine. Not its real name. Just what a child calls a friend."
> **PLAYER (choice):** [Ask the name] → Kurt tells you. *(Key Item: **A Child's Name**. It is not shown to the player in text; the game simply remembers that you know it.)* / [Ask about the Balls] → **KURT:** "A Ball should be a door. That fellow in the mask has made one with no inside handle." *(Reward: one **Apricorn Ball** of your choice.)*

### E5.8 *Bwa-ha-ha* (`xe.johto.counterfeit-boss`) — City

*Trigger: Raid 2, the Corridor floor. A door is ajar. Inside, someone is rehearsing.*

> **THE COUNTERFEIT BOSS:** "I am Giovanni! The magnificent! Bwa-ha-ha!"
> **THE COUNTERFEIT BOSS:** "No. *Lower.* 'I am… Giovanni.' Pause. Menace. Do I have a cat? He has a cat."
> **GRUNT:** "Sir, the real one never laughed."
> **THE COUNTERFEIT BOSS:** "Well, that's why nobody *liked* him!"
> **PLAYER (choice):** [Walk in] → *(Battle: Petrel as Giovanni. He uses Giovanni's battle lines, slightly wrong.)* / [Listen longer] → He practises the Hideout's door passwords aloud. *(Two locks open for free.)*
> **THE COUNTERFEIT BOSS (defeat):** "Did it sound like him at all? Be honest. …Archer misses him so much it's embarrassing. Somebody had to *try*."

---

## E6. Raids, Expanded

### E6.1 Raid 1 — "Slowpoke Well", deeper

**New phase order:** Entrance → Pools → **The Old Pool** *(new)* → Deep Cave.

Kurt is at the entrance with a bad back and a worse temper.

> **KURT:** "I went down there to give them a piece of my mind and fell off the ladder. Go on. Give them *your* piece of it."

**The Old Pool.** The oldest Slowpoke in the Well sits apart from the rest. It has regrown its tail more times than anyone has counted, and it is wearing a shell like a crown.

> **GRUNT (Tail-Cutter, shears lowered):** "I can't do that one. I did it once. It looked at me the whole time. It wasn't even angry."
> **PLAYER (choice):** [Send the Grunt home] → He leaves his uniform on the rocks; one fewer battle in the Deep Cave. / [Take the shears] → Secondary A completes here.
> *(Old Yawn opens one eye, and closes it.)*

**Triumph bonus:** `sv.rocket-return.old-yawn` follows the player out. When it yawns at the Well mouth, it rains on Azalea for the first time that season.

**Proton, extended:**

> **PROTON:** "They call me the scariest and cruelest man in Team Rocket. I wrote that myself. It saves time."
> **PROTON (defeat, extended):** "…It grows back. Everything grows back. That is the entire *principle*."

### E6.2 Raid 2 — "The Mahogany Hideout", deeper

**New phase order:** Shop → Corridor *(with the event* Bwa-ha-ha*)* → **Password Doors** *(new)* → Control Room → Radio Pulse Chamber.

**Password Doors.** Two doors want passwords that two different Grunts know. Each will say it if beaten, bribed (₽1,500) or overheard (*Bwa-ha-ha*).

> **GRUNT (door one):** "It's 'SLOWPOKETAIL'. Don't tell anyone. Actually, who are you going to tell? Everyone here knows it."
> **GRUNT (door two):** "'RATICATE TAIL'. Proton picks them. He's got a theme."

**The Pulse Chamber, extended.** The generator is powered by six Electrode that have been told to hold still. Secondary A (free the Red Gyarados) becomes available only after they are released: defeat them, or switch the cage off at the console (takes one turn during Ariana's battle).

> **ARIANA (extended):** "You brought the caped one. Lovely. Two against one. I *was* wondering what it would feel like to be the underdog."
> **LANCE** *(if present)*: "Madam, I would never. I'll stand here and be disappointed in you. It's quite effective."
> **ARIANA (defeat, extended):** "Archer isn't doing this for Rocket. Did you know? Nobody told the rest of us. I found his notes. It's one name, over and over, in a very neat hand."

### E6.3 Raid 3 — "Lake of Rage Transmitter", deeper

**New phase order:** Shoreline → **The Barge** *(new)* → Transmitter → **Red Water** *(new)*.

**The Barge.** Tyson runs the project from a flat boat in the middle of the lake.

> **TYSON:** "It's a pump. That's all it is. Signal goes in, Gyarados come out. I don't see what's upsetting about a pump."
> *(Battle: Tyson, on the barge. The lake is the hazard: at the end of every third turn a Gyarados surfaces and strikes a random Pokémon on the field, his or yours; announced.)*
> **TYSON (defeat):** "Fine. Turn it off. Then *you* explain to forty Gyarados that the meeting's cancelled."

**Red Water.** With the transmitter cut, the school disperses. One stays.

> *(Battle: `ss.rocket-return.rage-signal`, Tier 3. With the transmitter destroyed it enters at −35 Corruption, usually Tier 2.)*
> **Choice after:** [Take custody] / [Stand with it a while] *(spend the next rest node at the shore: it is purified and offers to join)* / [Leave it its lake].

### E6.4 Raid 4 — "The Burned Tower Hunt" *(new)*

**Scale:** Region. **Offered:** world state 3 or higher, or after Raid 1 at any state, by Eusine.
**Offer (Eusine, out of breath):** *"Ten years I've chased Suicune. Ten! And these two turn up with a crystal on a truck and it comes to* them*. I won't have it. I won't."*
**PR:** `pr.johto.burned-tower` — 4 areas: Ecruteak Streets → Tower Ruin → The Basement → The Crystal Rig. **Security:** falling timbers (a wrong step costs 1/8 HP to the lead), smoke (accuracy −5%), the Crystal's hum (Electric moves are drawn to it and fail).
**Objectives:** *Primary:* shatter the Miracle Crystal. *Secondary A, B, C:* free Raikou, Entei, Suicune (one each). *Secondary D:* defeat Attila and Hun.

**Phases**

1. **Ecruteak Streets.** The Kimono Girls have closed the theater and are standing in the road.
   > **KIMONO GIRL:** "The Tower has been ash for a hundred and fifty years. Tonight it is warm. Please be quick, and please be kind."
2. **Tower Ruin.** Professor Sebastian is giving a lecture to nobody.
   > **PROFESSOR SEBASTIAN:** "Observe! The Crystal absorbs electrical attack and returns it as obedience! I'd take questions, but none of you would understand the answers."
   > *(Battle: Sebastian. Trait: **Lecture Notes**: he names the move his Pokémon will use next turn, and it gains +20% power for having been explained; announced, by him, at length.)*
3. **The Basement.** Three crates, each humming at a different pitch. The player has time to open **two** before the alarm, or **three** if Eusine was brought along or the Kimono Girls' blessing was accepted in phase 1. Each crate opened is a short battle with the beast inside at Tier 3; at half HP it recognizes that it is being helped and stops.
   > **EUSINE** *(at Suicune's crate, very quietly)*: "…Oh. It's smaller than I pictured. No. No, it's exactly right."
4. **The Crystal Rig.** Attila and Hun.
   > **ATTILA:** "Three legends in one night! We'll be Executives by—"
   > **HUN:** "Morning."
   > **ATTILA:** "I was going to say Friday."
   > **HUN:** "It will be morning."
   > *(Double Battle: Razor and Girder lead. Trait: **Two-Man Job**: when one of them uses a move, the other's next move cannot miss; announced.)*
   > **HUN (defeat):** "I told you we should have brought a third crate."
   > **ATTILA:** "We *had* three crates!"
   > **HUN:** "A third *person*."

**Results (Lever: *The Three*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The Crystal is dust; all three beasts run free | **The beasts remember:** each one clears a Contested district on the Siege Map; no beast leaves Johto | −3 |
| **Success** | The Crystal is broken; two beasts free | Two districts cleared; one beast is shipped (`cipher.beast.*`) | −2 |
| **Partial** | One beast free | One district cleared; two shipped | −1 |
| **Failure** | You are carried out by the Kimono Girls | **Crystal relay:** Electric moves are 10% weaker for the player in Phase 4; three shipped | +2 |
| **Declined** | The Tower goes cold again by morning | Three shipped | +1 |

**Failure consequences:** **C6 (Hostage: Eusine), C9 (Gym lockdown), C11.**

### E6.5 Raid 5 — "The Silver Net" *(new)*

**Scale:** Region and Border. **Offered:** after Raid 2, by a Whirl Islands ferry captain.
**Offer:** *"There's a young one in the caves. The parent's been circling for three days. I've sailed forty years and I've never seen the sea hold its breath."*
**PR:** `pr.johto.whirl-islands` — 4 areas: Ferry Dock → Whirlpools → Sea Cave → The Net. **Security:** whirlpools (a failed crossing costs a turn of the storm timer), tide gates, a storm that grows every turn.
**Objectives:** *Primary:* free the young Lugia. *Secondary A:* disable the sonic net. *Secondary B:* defeat Dr. Namba. *Secondary C:* do it before the parent loses patience (**Storm timer: 14 turns** across the raid).

**Phases**

1. **Ferry Dock.** Butch and Cassidy are guarding the boats. Cassidy's Raticate has become **Big Tab** if the Kanto region was played.
   > **CASSIDY:** "You again. Do you just *appear* wherever we're working?"
   > **BUTCH:** "It's a small world. For them. It's getting smaller."
2. **Whirlpools.** Three crossings. Each needs a Water-type lead or an ally ferry (the captain, if paid ₽1,000 or if Rep is 15 or more).
3. **Sea Cave.** Dr. Namba, shouting over the surf.
   > **DR. NAMBA:** "A *juvenile* Lugia! Do you know what a mature one does when it calls? That's not a net, that's a *telephone*!"
   > **PLAYER:** "Dr. Nonba, the parent is—"
   > **DR. NAMBA:** "*NAMBA!* It's one syllable and then another syllable!"
   > *(Battle. Trait: **Feedback**: each time one of his Pokémon is hit by a sound move, the net weakens by one step, which helps Secondary A.)*
4. **The Net.** Silver is in a cage of sound, bound at Tier 2. It attacks because the net tells it to.
   > *(Battle: `ss.rocket-return.silver`. It cannot be knocked out. At 1 HP it hides behind the player's Pokémon. If the net is already disabled there is no battle at all.)*
   > *(The cave roof opens to the storm. Something vast lowers its head. It looks at the player, and at the young one, and the rain stops as if it had been switched off.)*

**Results (Lever: *The Storm*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | Silver goes home before the timer; the net is scrap | **Clear sky:** the static condition is removed from Phase 2; `legend-lugia-shrine` gains a second Sighting | −3 |
| **Success** | Silver goes home | Static is halved in Phase 2 | −2 |
| **Partial** | Silver goes home after the timer; the storm reaches Olivine | Olivine's district starts Contested | −1 |
| **Failure** | You are washed out of the cave | **Net data sold:** Cipher gains the Lugia readings; +1 Shadow Pokémon in Phase 4 | +2 |
| **Declined** | The storm sits on the coast for a week | Net data sold | +1 |

**Failure consequences:** **C1 (Impound), C7 (Occupation: ferries), C11.**

> **What Cipher wanted.** Whatever the result, a reading of a Lugia under a Lock exists. On Failure or Declined it reaches Cipher intact. That reading is where **XD001** begins (`docs/GRAND_ARC.md`).

---

## E7. The Climax — Extended Cut: "Dead Air"

Checkpoints are after Phase 2 and at the Breather.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | Broadcast and Choice | — | base §10.1–10.3 | 0 |
| 0b | **Goldenrod Under Static** | Siege Map | new | 0 |
| 1 | **The Underground** | Blackout | new | 2–3 |
| 2 | The Tower Climb | Gauntlet | base Phase 1, extended | 4–6 |
| 3 | The Executives | Duels | base Phase 2, extended | 2–4 |
| — | **Breather** | Rest | new | 0 |
| 4 | The Broadcast | Set piece | base Phase 3, extended | 3–5 |
| 5 | Archer | Boss | base Phase 4, extended | 1 |
| 6 | **The Welcome: Dark Celebi** | Colossus | new | 1 |
| 7 | **Tohjo Falls, Three Years Ago** | Duel | new, optional | 1 |
| 8 | Resolution | — | base §10.9, extended | 0 |

### E7.1 Phase 0b — Goldenrod Under Static (Siege Map)

| District | Held if… | If Lost |
| --- | --- | --- |
| **Magnet Train Station** | The Heir is an ally, or Lance was sent here | The signal reaches the border: world state stays 5 in the next region's opening |
| **Department Store** | Raid 1 Success or better (no tail money) | Shops are closed for the Last Rest |
| **The Underground** | `rocket-return.x.director-known` | Phase 1 has no shortcut |
| **Harbor Road (to Olivine)** | Ampharos was calmed, or Raid 5 Success or better | Two Black-Label Pokémon join Phase 2 |
| **The Plaza** | Raid 4 Triumph (a beast is standing in it) | The plaza battle in Phase 2 is a Double Battle |

> **EUSINE** *(if Raid 4 freed Suicune)*: "It's on the Department Store roof. Just standing there. Guarding the *shopping*. I've never been so proud."

### E7.2 Phase 1 — The Underground (Blackout)

The player enters by the Goldenrod Underground. **Condition — *Static*:** the names of the foe's moves are hidden until they are used, and held radios (Pokégear) cannot call allies. It ends when the basement relay is switched off.

A three-switch door puzzle (order shown on a wall if the Underground district is Held) leads to the warehouse.

> **THE REAL DIRECTOR** *(tied to a crate of karaoke machines)*: "He took my tie. I have had that tie since the station opened. I want it understood that I am angrier about the tie."
> *(Freeing him gives the **Basement Key** and removes one battle from Phase 2: he walks you in through the staff door.)*

**If the Heir is `tempted`,** he is here, wearing the coat, blocking the stair.

> **THE HEIR:** "They said I'd have the whole floor. A whole floor of people who do what I say. Do you know what I'd have *done* for that, a year ago?"
> *(Battle. Whatever the result he lets the player pass.)* "…It doesn't fit across the shoulders. Go."

### E7.3 Phase 2 — The Tower Climb (extended)

| Floor | Trainer | Notes |
| --- | --- | --- |
| Plaza | Rocket Grunts ×2 | base |
| **1F Reception** | Grunt in a receptionist's blazer | Asks for the password; a right answer (from Buena) skips the battle |
| 2F | Radio Techs ×2 | base |
| **3F Studio Two** | Guard on Mary of the Black Hour | Rescue; +1 battle if the station was called |
| 3F | Cassidy | base |
| 4F | Butch | base |
| **4F Record Library** | Signal Technician with **Night Desk** | Your held items are shown to the foe |
| 5F | Jessie, James and Meowth | base |

> **MARY (freed):** "Is the mic still live? …Good. *Johto, this is Mary. Everything I said after midnight this month was a lie. Especially about their future.*"
> *(Her broadcast calms one Contested district to Held.)*
> **MEOWTH (5F):** "Archer's got us on *reception*. I was almost top cat once! I had a *plan*!"

### E7.4 Phase 3 — The Executives (extended)

**Duel 1 — Ariana** (base). New line if Raid 2 was a Triumph: "You read his notes too, then. Don't look at me like that. I stayed anyway."

**Duel 2 — The False Director.** Petrel meets the player in the Director's office, in the Director's face.

> **THE FALSE DIRECTOR:** "Ah, a visitor! I'm afraid the tour is— oh, it's you. Then never mind." *(He peels the face off.)*
> *(Battle: Petrel, with **Understudy**. If the player has beaten Petrel as the Counterfeit Boss and exposed him on the tour, Understudy refuses to transform: "It's seen you win three times. It has formed a view.")*

**Duel 3 — Proton** (base).

**Duel 4 — conditional:** Attila and Hun, if Raid 4 was Failed or Declined.

### E7.5 Breather

Buena's studio. A sign: BUENA'S PASSWORD — ON AIR.

> **BUENA:** "Password for today is 'TEAROOM'. Say it back. Lovely. That's worth a prize, that is. I've only got cake."

Heal 50%, revive one Pokémon, checkpoint.

### E7.6 Phase 4 — The Broadcast (extended)

The base set piece (transmitter nodes, 12-turn countdown, static) gains a rhythm and a guest.

**The Carrier Beat.** Every fourth turn is **the drop** (announced a turn ahead, or two turns ahead with the cassette): all Shadow Pokémon on the field gain +10 Surge. A sound move used *on* the drop cancels it.

**Miror B., on the observation deck.** He is conducting the antenna with both hands.

> **MIROR B.:** "You hear it? Under the sad man's speech? *That's* me. He thinks it's a love letter. It's a *dance track*."
> **MIROR B.:** "The doctor wanted lightning, the brute wanted fire, the beauty wanted water. Nobody asked what the *artist* wanted."
> *(Battle: Ludicolo ×3 and Sudowoodo, with **Dance Floor**. For each beast shipped in Raid 4 he is in a better mood and one Ludicolo holds a Sitrus Berry.)*
> **MIROR B. (defeat):** "Take the tape, take it! A critic at last! …Tell them the music was good. They never say."

*Reward:* **Data ROM J: "Carrier Beat"**.

**New PA lines** *(Archer, as nodes fall)*:

> "One antenna is nothing. He could hear me through a tin can."
> "…Two. Boss, if the line is bad, I'll say it again. I'll say it as often as it takes."
> "Three. Then I'll stop asking."

### E7.7 Phase 5 — Archer (extended)

The base fight (§10.7) with **Vigil** and **Last Call**.

**New boss stage — *Open Mic*** (after *The Call*): Archer switches the studio microphone on. The battle is live across Johto. Each time one of his Pokémon faints, one Lost district on the Siege Map becomes Contested ("They can hear him losing."). Each time one of the player's faints, the static returns for one turn.

> **ARCHER (opening, extended):** "Three years. I kept the payroll. I kept the uniforms pressed. I kept his chair. You'll think that's pathetic. You're young. Wait until someone you'd follow anywhere goes somewhere you can't."
> **ARCHER (Open Mic):** "Let them listen. Let *him* listen. This is what it sounds like when we don't quit."
> **ARCHER (when Last Call is alone):** "Last call. I've always hated the phrase."
> **ARCHER (defeat, extended):** "…Nothing. Not even static." *(He looks up.)* "It doesn't matter. I made other arrangements. I'm so sorry. I really did hope I wouldn't need them."

### E7.8 Phase 6 — The Welcome: Dark Celebi (Colossus)

*The roof. The great dish. A man in an iron mask is leaning on the rail with a black ball in his hand, and the air around the antenna is the wrong season.*

> **THE MARAUDER:** "He paid half up front! Half! For *time itself*! Ha! I'd have done it for the look on your face."
> **ARCHER** *(from the stair, hoarse)*: "Open it. Take me back to the lobby. The day of the tower. I'll stop the child at the door."
> **THE MARAUDER:** "And here's my favorite part of every job. The part where I explain that it's *mine* now."

**Format.** Dark Celebi (`ss.rocket-return.dark-celebi`, XD003) is a Colossus inside three **Thorn Rings**. Each ring is a shield bar and a rule.

| Ring | While it stands | When it breaks |
| --- | --- | --- |
| **Last Week** | At the end of every third turn, both sides' active Pokémon return to the HP they had three turns ago (announced) | The rewind stops |
| **Last Year** | Yesterday's Thorn echoes twice | It echoes once |
| **Long Ago** | Celebi cannot be reached; Overlord and Sliver fight in front of it | The Marauder's Pokémon are out; Celebi is alone |

**Timer:** 12 turns. **Adjustments:** Archer, if beaten with the mic open, steps between the Marauder and the player for one turn ("Not *like this*."); the Heir as an ally breaks the first ring's shield by half; a freed beast shortens the timer's start by nothing and adds a free hit on Overlord.

> **THE MARAUDER (second ring):** "You're ruining a perfectly good monster!"
> **DARK CELEBI** *(not a voice; a smell of rain on leaves)*: …
> **THE MARAUDER (third ring):** "Fine! *Fine!* I'll take the cat-bird off the roof and the old man's forest for change!"

**When the third ring breaks:** if the player holds **A Child's Name**, a prompt appears with one option: **[Say it.]** The Dark Ball splits like a seed. If not, Celebi must be reduced to 1 HP first, and then the Ball splits.

> *(Celebi hangs in the air, small and green. It looks at Archer. It looks at the player. Then the roof is three years ago, for exactly as long as it takes to blink.)*

**If the timer runs out:** the Marauder leaves on a flying machine with the Ball. XD003 enters the Region of Doom; Ilex Forest loses a day at every rest node for the rest of the region (one random shop item changes).

### E7.9 Phase 7 — Tohjo Falls, Three Years Ago (optional)

*Available if Dark Celebi was freed.* Celebi takes the player, and nobody else, to a cave behind a waterfall. A radio is playing on a rock. A man in a dark suit is listening to it.

> **RADIO (Archer's voice, tinny):** "…Boss. If you can hear me, Rocket is still alive…"
> **GIOVANNI:** "I can hear you." *(To the player, without turning.)* "You're not from this afternoon. Your shoes are wrong for it."
> **GIOVANNI:** "They're calling me back. I was just deciding. It is a great deal easier to decide with someone to beat."
> *(Battle: Giovanni, the base roster of script 01, at this region's level. No Doctrine. He is out of practice and knows it.)*
> **GIOVANNI (defeat):** "Twice. By children. Once is an accident." *(He reaches down and switches off the radio.)* "Tell no one where I was. Tell *him* least of all. Let him think the signal failed. It's kinder than the truth, and I was never kind, so consider it a novelty."
> **GIOVANNI (victory; the fight is lost but the run does not end):** "Hm. Then perhaps I'll go. …No. No, a man who needed that to decide has already decided."

Either way the radio goes off. The player returns to the roof one second after they left.

*Writes: `rocket-return.x.tohjo = won | lost`. If won, the Resolution option [Let it play] gets no answer at all, and Archer's last line changes.*

### E7.10 Phase 8 — Resolution (extended)

The Call choice (base §10.9) is unchanged, with these additions.

- **[Let it play], after Tohjo Falls:** the call goes out on every band. Nothing comes back. **ARCHER:** "Then he heard it. He'd have answered a thing he hadn't heard." *(No Doom Level is added; Archer disbands the cell himself.)*
- **The coat.** If the Heir is present, the player chooses what happens to it: [Give it to Archer] (he folds it and keeps it; Rep +5) / [Leave it on the chair] (the Doom Ledger records `rocket-return.heir = vacant`) / [The Heir keeps it] (only if `tempted` and the player lost Phase 1's battle to him: a new Leader for the Region of Doom).
- **Celebi's gift,** if freed: one fainted or lost Pokémon from *this run* returns at the level it left ("It was only yesterday.").

### E7.11 Rival and Stand-with additions

- **Help:** the rival frees Mary before the player reaches the 3rd floor. *Line:* "She said my name on the radio! Did you hear? …You weren't listening. You were *fighting*. Fine."
- **Beat-you:** the rival is found in the Record Library, tied up with tape, under a pile of jingles.
- **Side-with:** the rival is **Junior Executive "Dial Tone"**, reading the Black Hour in Mary's place. A successful Turn has them finish the broadcast with the truth.
- **Stand with them:** the player is **"Standby"**. In Phase 6 the player is the one who must decide whether Archer gets his door. See `scripts/10_STAND_WITH_THEM.md` §2; the new line is Archer's: "Standby. If I go through, hold the roof for ten minutes. If I don't come back, hold it for nobody."

---

## E8. Aftermath and the Thread

- **If Celebi was freed:** *Johto Radio & TV:* "Residents of Azalea report that Thursday arrived on time."
- **If the Marauder escaped with it:** "Ilex Forest is closed to visitors. Rangers say it is, quote, 'not always there'."
- **Mary:** her show is renamed *The Morning After*. It opens every day with the correct weather.
- **Old Yawn**, if it followed the player, is waiting at the Well when the region ends, in case it is needed elsewhere.
- **Archer** (Cut, after Tohjo Falls): he is seen once more, at a bus stop, without the coat.

**The Thread (`docs/GRAND_ARC.md`).** **Data ROM J: "Carrier Beat"** proves the rhythm under the Radio Wave Lock is the same waveform as Kanto's Rig Pulse. The beasts that were shipped left on a boat for a desert region. And somewhere there is now a reading of a Lugia that did what it was told.

> **MIROR B. (postcard, delivered to the next rest node):** "Darling! Heading south. The brute has found a volcano and a seabed and intends to sell to both. Wear something waterproof and something fireproof. *Kisses.*"

---

## E9. Dialogue Bank

### E9.1 New ambush lines

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Tail Vendor (Embarrassed) | "Free sample? No? Then I have to fight you. It's in the script." | "The hat was the worst part." |
| Grunt — Tail-Cutter (Haunted) | "They grow back. They *grow back*. Send out your Pokémon." | "It looked at me the whole time." |
| Grunt — Night Courier (Hurried) | "I've got three trucks and a second bell. You're not on the schedule." | "Now I'm *late*." |
| Specialist — Signal Technician (Flat) | "You're interference. I remove interference." | "Noise floor's too high. I give up." |
| Specialist — Beast Tracker (Greedy) | "Footprints this size pay for a house. Out of my way." | "It was a very nice house." |
| Lieutenant — Tyson (Businesslike) | "Nothing personal. You're a line item." | "Write-off." |
| Commander — Attila (Loud) | "Hun! I found the kid!" | "Hun! The kid found *me*!" |
| Commander — Hun (Quiet) | "He's loud so that I don't have to be." | "…Noted." |
| Commander — Sebastian (Lecturing) | "A demonstration! Take notes, there will be a test." | "The *theory* is sound." |
| Executive — The Marauder (Booming) | "A challenger! I haven't had a *real* one since I started cheating!" | "Ha! Ha. …Hm." |
| Executive — The False Director (Late) | "Welcome to the, ah. The place. Which I run." | "The tie didn't even suit me." |
| Liaison — Miror B. (Sing-song) | "And *five*, six, seven, *battle*!" | "No rhythm! *Such* conviction!" |

### E9.2 Archer's barks

| Moment | Line |
| --- | --- |
| Player lands a super-effective hit | "He'd have seen that coming. I'm not him. I'm aware." |
| Player's Pokémon faints | "I'm sorry. I mean that. It changes nothing." |
| His Pokémon faints | "Hold the line. …Held as long as it could." |
| Player heals | "Good. Don't make this easy. He should hear a real fight." |
| A Shadow Pokémon disobeys the player | "The signal reaches you too. It reaches everyone but the one man." |
| Last Pokémon each | "Boss. Whatever happens next, I was here." |

### E9.3 Radio (heard at rest nodes, by world state)

| Step | Broadcast |
| --- | --- |
| 1 Static | "…kssh… and that's the news at… kssh… stay tuned for… kssh." |
| 2 Jingle | "♪ *Brighter days, darker nights, Rocket's future's shining bright!* ♪" |
| 3 Rage | "Lake of Rage boating is suspended. Listeners are advised that the fish are, quote, 'unionizing'." |
| 4 Carrier Wave | "Reception has improved across Johto. Engineers cannot explain why. Engineers are being asked to stop trying." |
| 5 The Call | "Boss. If you can hear me." *(on every station; the dial does nothing)* |

### E9.4 Civilians by world state

| Step | Line A | Line B |
| --- | --- | --- |
| 1 | "My radio's gone funny. Yours?" | "There's a stall selling tails. I didn't ask whose." |
| 2 | "I caught myself humming that jingle. I don't even know where I heard it." | "The Director walked right past me. Thirty years I've delivered his paper." |
| 3 | "The Magikarp in my pond evolved overnight. It doesn't fit in the pond." | "Ecruteak smells of smoke. The old tower. After all this time." |
| 4 | "My cousin in Kanto says they can hear our stations now. Only the one, though." | "The lighthouse blinks in time with the music. Ships are *dancing* in." |
| 5 | "He sounds so sad. Is it wrong that I hope his boss calls?" | "I unplugged it. It's still talking." |

### E9.5 Announcer lines for special Pokémon

| Pokémon | On entry |
| --- | --- |
| Overlord | "The Ball burns. Overlord doesn't notice." |
| Understudy | "Understudy has been studying *you*." |
| Last Call | "Last Call. The room goes quiet." |
| Old Yawn | "Old Yawn opens one eye." |
| Rage Signal | "The shadow tightens. The water turns red." |
| Dark Celebi | "The air smells of last autumn." |

---

## E10. Flags and Wiring

| Flag | Set by | Read by |
| --- | --- | --- |
| `rocket-return.x.signal` (0–5) | Raids, climax schedule | Radio, civilians, wild encounters |
| `rocket-return.x.bought-tail` | *The Tail Market* | Kurt |
| `rocket-return.x.director-known` | *The False Director* | Siege Map, Phase 1 |
| `rocket-return.x.heir` (`tempted` / `ally` / `undecided`) | *The Chair* | Phase 1, Phase 6, Phase 8 |
| `rocket-return.x.tohjo` (`won` / `lost`) | Phase 7 | Phase 8 |
| `rocket-return.x.celebi` (`freed` / `taken`) | Phase 6 | Aftermath, Region of Doom |
| `cipher.seen.miror-b`, `cipher.rom.j` | *Olivine Arrival*, Phase 4 | `docs/GRAND_ARC.md` |
| `cipher.beast.raikou`, `.entei`, `.suicune` | Raid 4 | Liaison teams in later regions |
| `cipher.lugia-reading` | Raid 5 (Failure or Declined) | `docs/GRAND_ARC.md` (XD001) |

**Counts for this file:** 14 named characters (7 new officers, 7 team versions and allies), 9 special Pokémon, 6 special Shadow Pokémon (1 Apex), 8 story events, 3 deepened raids and 2 new raids, an 8-phase Extended Cut, and 5 dialogue tables.
