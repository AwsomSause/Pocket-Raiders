# 04x — SINNOH: TEAM GALACTIC — EXPANDED EDITION
### Script: *The Quiet Machine*

> *"I did not ask them to follow me. I observed that they would, and I allowed for it."* — Cyrus

**Extends:** `scripts/04_SINNOH_TEAM_GALACTIC.md` (the base script stays valid; this file adds to it)
**Template:** `docs/EXPANSION_DESIGN.md` · **Cross-region arc:** `docs/GRAND_ARC.md`
**Canon note:** Cyrus, Mars, Jupiter, Saturn, Charon, Looker, Cynthia, Buck, the lake guardians, Rotom's history with Charon, the Distortion World and the old man in Sunyshore who speaks of a grandson are canon to the games. Hunter J is canon to the anime; Sird is canon to the manga. Lovrina is a canon Cipher admin (XD). **Chief Engineer Volkner** is a *what-if* version. All dialogue is original. Species are my best recall and are marked approximate.

---

## E1. The Wider Scale

The base script is a mountain and an exit. The Expanded Edition shows the region going quiet on the way there, one subtraction at a time.

### E1.1 The plan at five scales

| Scale | What Galactic is doing | What the player sees | Where it pays off |
| --- | --- | --- | --- |
| 1 **Street** | Running free "wellness clinics" that return Pokémon calm, obedient and empty | A child whose Buneary no longer plays | Event *The Clinic* |
| 2 **City** | Drawing a third of Sinnoh's power through the Windworks and one bored engineer's relay | Brownouts; Pokémon Centers on half power | Raid 1, event *The Engineer* |
| 3 **Region** | Taking the three lake guardians, and with each one a piece of what the region is: memory, feeling, will | People who lose the thread of a sentence, who stop laughing, who sit down and do not get up | Raids 3 and 5; the world-state track |
| 4 **Border** | Paying a hunter with an airship to do the taking; sharing the Red Chain's design with an outside lab | A black ship over the Great Marsh; a pink ribbon tied to a prototype | Events *The Marsh Test*, *The Ribbon* |
| 5 **World** | Using the chain to hold time and space still long enough to subtract the spirit from everything that exists | Clocks that disagree; a hum from Mt. Coronet that can be heard in the next region | Climax Phases 6 and 7 |

### E1.2 World-state track — *The Subtraction*

Stored in `galactic.x.subtraction` (0–5). Step 3 has three parts, one per lake, and each is its own flag.

| Step | Name | Regional rule | Civilian mood |
| --- | --- | --- | --- |
| 1 | **Quiet** | One clinic per city; a Pokémon left there for a node returns with the *Spiritless* rule for 3 battles | Polite |
| 2 | **Brownout** | Pokémon Centers heal to 80%; night nodes are darker (accuracy −5% for both sides) | Tired |
| 3a | **Lake Acuity taken** (Uxie) | *Memory:* the map shows one fewer node ahead | Forgetful |
| 3b | **Lake Verity taken** (Mesprit) | *Feeling:* friendship and bond gains are halved | Flat |
| 3c | **Lake Valor taken** (Azelf) | *Will:* the player's Pokémon cannot land critical hits | Listless |
| 4 | **The Hum** | Wild Pokémon flee less and fight less; shops forget one item in stock | Vacant |
| 5 | **Zero Hour** | Clocks stop at each rest node until the player leaves; the climax is scheduled | Still |

Freeing a guardian removes its rule at once.

### E1.3 The bigger secret

The Spear Pillar is an exit (base script §3). Three people have plans that Cyrus has not accounted for, because accounting for them would require caring what they want.

**Charon** does not believe in the new world and never did. He wants the patents. He has a private dig on Stark Mountain and a buyer.

**Lovrina** of Cipher is the buyer. The Red Chain is the first lock strong enough to hold a legend under Shadow. She signs her lab notes with a heart.

**Cyrus** has already used the subtraction on himself. Not all of it. He tested the first stage, privately, a year ago, to be sure it was safe for the commanders. It was not, and he noted that, and he did not tell them, and he has felt very little about anything since. This is the part he would call a success.

---

## E2. Expanded Cast

### E2.1 New officers and specialists

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.galactic.sird` | **Sird** | Commander (4) | canon (manga) | Infiltrator: the fourth commander, who reports to someone else as well | Starmie, Persian, Banette *(approximate)* | Pleasant, unreadable, always leaving |
| `sc.galactic.hunter-j` | **Hunter J** | Contractor (5) | canon (anime) | Enforcer: a poacher for hire with an airship and a device that turns a Pokémon to bronze | **Warrant** (Salamence), Drapion, Ariados | Clipped, professional, contemptuous of causes |
| `sc.galactic.lovrina` | **Lovrina** | Liaison (4) | canon (XD) | Scientist: Cipher's observer on the Red Chain | Gardevoir, Mismagius, Delcatty, Roserade *(approximate)* | Sugary, vain, brilliant, bored by people |
| `sc.galactic.orderly-vance` | **Orderly Vance** | Lieutenant (3) | original | Handler: runs the wellness clinics | Chansey, Bronzong, Kadabra | Soothing; believes every word of the brochure |
| `sc.galactic.warden-pell` | **Warden Pell** | Lieutenant (3) | original | Enforcer: head of security at the Veilstone building | **Bulwark** (Bastiodon), Probopass, Magnezone | Speaks in regulations; has never broken one |
| `sc.galactic.cadet-io` | **Cadet Io** | Specialist (2) | original | Scout: a new recruit who still hums while working and keeps being told to stop | Glameow, Stunky, Croagunk | Young, earnest, losing something and not sure what |

### E2.2 Team versions of characters you know

| ID | Name | Rank | Based on | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- | --- |
| `sc.galactic.engineer-volkner` | **Chief Engineer Volkner** | Executive (5) | what-if | Sunyshore's Gym Leader, who built Galactic's power relay because it was the first hard problem anyone had brought him in years | **Relay** (Electivire), Luxray, Octillery | Bored, brilliant, slowly realizing |
| `sc.galactic.grunt-836` | **Grunt No. 836** (Looker) | Ally | canon (games) | An International Police detective in a Galactic uniform that does not fit | Croagunk | Dramatic whispers; announces his own codename |
| `sc.galactic.cynthia` | **Cynthia** | Ally | canon (games) | Historian of Sinnoh's myths, and its Champion | Garchomp | Warm, curious, formidable; easily distracted by ruins and ice cream |
| `sc.galactic.grandfather` | **The Old Man of Sunyshore** | Civilian | canon (games) | A grandfather on a bench who had a grandson once | None | Slow, kind, still puzzled |
| `sc.galactic.buck` | **Buck** | Ally | canon (games) | A treasure hunter on Stark Mountain | Claydol | Cocky, good-hearted |
| `sc.galactic.rival-mercury` | **Commander Mercury** (the rival) | Lieutenant (3) | what-if | The rival in a silver uniform, in the Side-with variant: the smallest planet and the quickest | The rival's team plus one Spiritless Pokémon | The rival's archetype, with the volume turned down |
| `sc.galactic.player-ceres` | **Probationer Ceres** (the player) | Specialist (2) | what-if | The player on the Inside Man and Stand-with routes: not quite a planet | The player's team | — |

> **Naming.** Galactic's commanders take the names of planets. Saturn chooses them. He gave the rival the nearest one to the sun "because it burns quickly", and the player a dwarf planet "pending review".

---

## E3. Special Pokémon — the Spiritless line

**Spiritless** Pokémon have been through Charon's subtraction. They are healthy. They obey. They do not play, sulk, or look up when their name is called.

**Line rule — *Spiritless*:** a Spiritless Pokémon's stats cannot be lowered by the foe, cannot be raised by anyone, and it cannot flinch, be taunted or be infatuated (announced: "It feels nothing about that."). The rule is removed by purifying it like a Tier 1 Shadow, or by returning Mesprit to Lake Verity, which restores every Spiritless Pokémon in the region at once.

| ID | Name | Species | Signature trait | Where met | Can the player get it? |
| --- | --- | --- | --- | --- | --- |
| `sv.galactic.absence` | **Absence** | Murkrow / Honchkrow | *No Witnesses*: when it knocks out a foe, the next Pokémon sent against it has its ability suppressed for 1 turn | Cyrus's ace | No |
| `sv.galactic.zero-kelvin` | **Zero Kelvin** | Sneasel / Weavile | *Absolute*: its Ice moves ignore the target's Defense and Special Defense boosts | Cyrus | No |
| `sv.galactic.remainder` | **Remainder** | Gyarados | *Subtraction*: each attack removes one stat boost from its target | Cyrus | No |
| `sv.galactic.empress` | **Empress** | Glameow / Purugly | *First Claw*: always moves first on the turn it enters | Mars | No |
| `sv.galactic.miasma` | **Miasma** | Stunky / Skuntank | *Lingering*: when it faints, the Pokémon that replaces its attacker is badly poisoned | Jupiter | No |
| `sv.galactic.verdict` | **Verdict** | Croagunk / Toxicroak | *Considered Strike*: +30% damage against a Pokémon that used a status move this turn | Saturn | No |
| `sv.galactic.bulwark` | **Bulwark** | Bastiodon / Bastiodoom | *Shut Door*: the foe cannot switch out during the first 2 turns it is on the field | Warden Pell; the Veilstone building | No |
| `sv.galactic.relay` | **Relay** | Electivire / Z-Electivire | *Grid Tie*: Electric moves used by anyone on the field heal it by 10% | Chief Engineer Volkner | No |
| `sv.galactic.friday` | **Friday** | Drifloon / Drifblim | *Carry Off*: once per battle it lifts its partner out of the way of one attack | The Windworks roof | Yes: it comes when the little girl at the Windworks calls it, and she lends it to you |
| `sv.galactic.poltergeist` | **The Poltergeist Engine** | Rotom / Heat Rotom / Wash Rotom / Frost Rotom / Fan Rotom / Mow Rotom | *Appliance Shift*: changes form at the end of each turn, in a fixed order shown to both sides | Charon | Yes: it leaves Charon when shown the page of his boyhood notebook |
| `sv.galactic.warrant` | **Warrant** | Salamence / Mega Salamence | *Bring It In*: its first hit on each new target cannot be survived by Sturdy or a Focus Sash | Hunter J | No |

> Friday, the Poltergeist Engine and Warrant are not Spiritless. Friday is a wild Drifloon Galactic uses as free transport. Rotom is the one thing Charon ever loved, and he put it in a generator. Warrant belongs to a contractor who would not let a client near her Pokémon.

---

## E4. Special Shadow Pokémon

Galactic's method is the **Red Chain Lock**; cutting the tether gives −35 Corruption (Shadow doc §6).

| ID | Code | Name | Species | Tier | Shadow ability | Shadow moves | Purification key | Where met |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ss.galactic.unknowing` | — | **Unknowing** | Uxie | 3 Gripped | Black Ledger | Null Pulse, Siphon Lull, Rift Step | Return it to Lake Acuity | Raid 5 |
| `ss.galactic.unfeeling` | — | **Unfeeling** | Mesprit | 3 Gripped | Dread Aura | Null Pulse, Chain Hymn, Rift Step | Return it to Lake Verity | Raid 5 |
| `ss.galactic.unwilling` | — | **Unwilling** | Azelf | 3 Gripped | Echo of Another | Null Pulse, Umbral Rush, Rift Step | Return it to Lake Valor | Raid 3 or Raid 5 |
| `ss.galactic.slag-heart` | — | **Slag Heart** | Heatran | 3 Gripped | Hollow Hide | Ember of Grief, Gloam Crash, Cinder Ward | Put the Magma Stone back | Raid 4 |
| `ss.galactic.long-night` | — | **The Long Night** | Darkrai / Z-Mega Darkrai | 4 Fallen | Shroud | Siphon Lull, Heart Eclipse, Pale Echo | A Lunar Wing, carried to Canalave | Event *The Town That Slept* |
| `ss.galactic.stillhour` | XD006 | **Stillhour** | Dialga / Origin Dialga | 4 Fallen | Contract Clause | Chain Hymn, Heart Eclipse, Stopped Clock | Story only: break its two Red Chains | The Spear Pillar, Phase 6 |
| `ss.galactic.farshore` | XD007 | **Farshore** | Palkia / Origin Palkia | 4 Fallen | Contract Clause | Rift Step, Gloam Crash, Folded Distance | Story only: break its two Red Chains | The Spear Pillar, Phase 6 |

**Signature Shadow move — Stopped Clock:** 100 power; the target's next move is delayed until the end of the following turn. Cost: +6 Corruption. Announced one turn ahead ("The second hand hesitates.").

**Signature Shadow move — Folded Distance:** 100 power; after it hits, the target is swapped with a random Pokémon from its trainer's bench. Cost: +6 Corruption. Announced one turn ahead ("The far wall is suddenly near.").

**Notes**
- **The guardians** follow the Legendary Shadow rules. While one is bound, its regional rule (E1.2) is in force.
- **The Long Night** was not made by the Red Chain. Galactic's hum disturbed it, and it has been trying to keep one town asleep so that nobody there will have to feel what is coming. It thinks this is kindness.
- **Stillhour and Farshore** are never knocked out. They are fought for their chains (Phase 6).

---

## E5. New Story Events

### E5.1 *The Clinic* (`xe.sinnoh.clinic`) — Street

*Trigger: any city node after Ignition. A clean white storefront: GALACTIC WELLNESS — FREE CHECK-UPS. A small girl is sitting on the step with a Buneary that is looking at nothing.*

> **GIRL:** "They said she was anxious. She's not anxious now. She's not *anything* now. She used to hide my socks."
> **ORDERLY VANCE** *(in the doorway, gently)*: "Stress responses are down ninety percent. That's a wonderful result. You should be pleased."
> **PLAYER (choice):**
> 1. **["Put it back."]** → **VANCE:** "Put *what* back? Nothing was removed that she needed." *(Battle: Vance. His Pokémon are Spiritless.)*
> 2. **[Leave one of your Pokémon for a check-up]** → It returns with the *Spiritless* rule for 3 battles. Intel +5: you have seen the machine. The Pokémon's bond with you drops one step, and recovers when the rule ends.
> 3. **[Sit with the Buneary]** → *(One rest node.)* It does nothing. At the end it picks up one of the girl's socks, looks at it for a while, and puts it down again. `galactic.x.sock = true`.
> **VANCE (defeat):** "You're upset. I understand. We can help with that."

*If Mesprit is returned to its lake, the girl writes: "SHE HID BOTH SOCKS."*

### E5.2 *Fridays* (`xe.sinnoh.fridays`) — Street

*Trigger: the Valley Windworks, before or after Raid 1. A little girl is outside the fence. A sky full of Drifloon is carrying Grunts toward the roof, one each, like an airline.*

> **LITTLE GIRL:** "They're only supposed to come on Fridays. They come for *me* on Fridays. Now they come every day and they don't even look."
> **GRUNT** *(drifting past at head height, embarrassed)*: "It's very fuel-efficient."
> **PLAYER (choice):** [Call one down] → *(Needs a Berry.)* **Friday** lands on the girl's head. It will carry *you* to the Windworks roof: Raid 1 may start at the Control Room. / [Pop one] → A Grunt falls in a hedge. Heat +3. The girl will not speak to you.
> **LITTLE GIRL:** "My papa's inside. He runs the turbines. He said to tell anyone who asks that he's *not* helping them, he's just bad at saying no."

### E5.3 *Grunt No. 836* (`xe.sinnoh.grunt-836`) — City

*Trigger: Veilstone, Heat 30 or more. A Galactic Grunt is standing behind a signpost. The signpost is narrower than he is.*

> **GRUNT NO. 836** *(a stage whisper)*: "Psst. You. You have not seen me. I am not here. My codename is *Looker*. I should not have told you that."
> **LOOKER:** "I have infiltrated this organization for six weeks. Nobody suspects! They are a people without curiosity. It is the perfect cover and it is breaking my heart."
> **LOOKER:** "The warehouse has a door. The door wants a key. A Grunt in the canteen has the key. I cannot take it. I am *undercover*. But you…"
> **PLAYER (choice):** [Get the key] → A short battle in the canteen; **Storage Key**: Raid 5 gains a side entrance. / ["Your wig is crooked."] → **LOOKER:** "It is not a wig. It is the *regulation haircut*, and it is the bravest thing I have done." / ["What have you found?"] → Intel +5: "They have a room where they keep three small Pokémon in three large machines. I am not a sentimental man. I walked past that room once and I have not slept."

### E5.4 *The Bench in Sunyshore* (`xe.sinnoh.grandfather`) — Street

*Trigger: Sunyshore, any time. An old man is feeding Wingull.*

> **OLD MAN:** "I had a grandson. Clever. Too clever for the house. His parents wanted the top of the class, and when he wasn't, they wanted to know why, at length."
> **OLD MAN:** "He stopped coming down for supper. He was up there with his machines. Machines don't ask you why."
> **OLD MAN:** "I should have gone up. I used to stand at the bottom of the stairs and think, 'leave him be, he's busy.' That's what I've got. I left him be."
> **PLAYER (choice):** ["What was his name?"] → He tells you. `galactic.x.grandfather = true`. / [Sit a while] → He gives you a **Soothe Bell**. / ["Would you want to see him?"] → **OLD MAN:** "I'd want him to want it. That's a different thing, and I'm old enough to know."

*This flag changes one line in Phase 5 and adds one option in Phase 8.*

### E5.5 *The Marsh Test* (`xe.sinnoh.marsh-test`) — Region

*Trigger: Pastoria, world state 2 or higher. A boom from the Great Marsh. Smoke. A Grunt sprinting the other way. Above the smoke, a black airship turning slowly.*

> **GRUNT** *(running)*: "It worked! It worked! I didn't think it would— oh no. Oh, it *worked*."
> **HUNTER J** *(by loudspeaker from the ship, bored)*: "Test confirmed. Crater radius acceptable. Invoice to follow. And you, on the boardwalk: you are standing in a workplace."
> **PLAYER (choice):** [Chase the Grunt] → He gives up at once: "I just pressed it. They said press it. I thought it was a *drill*." Intel +4: the next bomb is for a lake. / [Signal the airship] → Hunter J sends one henchman down by cable. *(Battle. Win: `galactic.x.j-marked = true`; she will come for you personally in Phase 2.)* / [Help the Marsh wardens] → Rep +5; three bronzed Pokémon are found in the reeds and one of them can be restored at a Pokémon Center and kept.

### E5.6 *The Wall at Celestic* (`xe.sinnoh.celestic-wall`) — Region

*Trigger: Celestic Town, after Raid 2 is offered. A man in grey is looking at a cave painting. A tall woman in black is looking at him.*

> **CYNTHIA:** "It shows three beings around a light. People have read it as a creation story for two thousand years."
> **CYRUS:** "It is an instruction diagram. People have been sentimental for two thousand years."
> **CYNTHIA:** "You've never once wondered whether it's both?"
> **CYRUS:** "Wondering is the defect."
> *(He turns to leave, and stops in front of the player.)*
> **CYRUS:** "You have interfered four times. I have reviewed each instance. You were efficient. You did not gloat. You are the least wasteful person I have encountered this year."
> **CYRUS:** "I am going to make a world without grief. I would prefer that you were not standing in its way when I do. This is not a threat. I do not have the capacity for those anymore. It is a preference."
> **PLAYER (choice):** ["And joy?"] → **CYRUS:** "Subtracted with the rest. They share a mechanism. I checked." / ["What happened to you?"] → *(A pause that would be hesitation in anyone else.)* **CYRUS:** "Nothing is happening to me. That is the result." / [Say nothing] → **CYRUS:** "Yes. Exactly that."
> **CYNTHIA** *(after he has gone)*: "I've met a great many dangerous people. He's the first one I've wanted to make a cup of tea for. Don't tell anyone. I'm coming up that mountain with you."

### E5.7 *The Town That Slept* (`xe.sinnoh.town-slept`) — Region

*Trigger: Canalave, world state 3 or higher. The harbor is silent at noon. People are asleep at café tables, on benches, at the wheel of a moored ferry.*

> **SAILOR'S WIFE** *(awake, grey with it)*: "Three days. My boy first, then the street. They're not in pain. They're just not *here*."
> *(At night, a shape stands at the end of the pier, watching the windows like a nurse on a ward.)*
> **PLAYER (choice):** [Approach it] → *(Battle: `ss.galactic.long-night`, Tier 4. It does not attack first. If the player does not attack for three turns it says, without a voice: "They will not have to feel it end.")* / [Fetch a Lunar Wing] → *(A detour of two nodes to Fullmoon Island.)* The town wakes. The shape bows its head and is purified where it stands. / [Let them sleep] → Canalave has no shop or rest node this region; in the climax, nobody from Canalave suffers the *Zero Hour* effect.

### E5.8 *The Ribbon* (`xe.sinnoh.ribbon`) — Border

*Trigger: the Veilstone Department Store, world state 3. A young woman with pink hair is buying every ribbon on the shelf. A Galactic Scientist is carrying her bags.*

> **LOVRINA:** "The chain is *so* drab. Red, red, red. I told the little bald doctor: if it's going to hold a god, it should at least be *cute*."
> **SCIENTIST:** "Dr. Lovrina, the specifications are classified—"
> **LOVRINA:** "Oh, hush. This one doesn't know what a specification is. Do you, sweetie?" *(She looks at the player's lead Pokémon the way a jeweller looks at a stone.)* "Ooh. What a *strong* little heart it has. Those are the fun ones to close."
> **PLAYER (choice):** [Follow her] → Intel +5; unlocks Raid 4. / [Challenge her] → *(Battle. Trait: **Heart Lock**: the first of the player's Pokémon to land a critical hit each battle cannot use that move again for 2 turns; announced.)* / ["Who do you work for?"] → **LOVRINA:** "Someone with a much bigger chain to fill. Byeee."

*Writes: `cipher.seen.lovrina`.*

---

## E6. Raids, Expanded

### E6.1 Raid 1 — "Valley Windworks", deeper

**New phase order:** Intake → Turbine Hall → **The Relay Room** *(new)* → Control Room → **The Roof** *(new)*.

**The Relay Room.** A wall of switchgear, beautifully built. Chief Engineer Volkner is lying on the floor underneath it with a torch in his teeth.

> **CHIEF ENGINEER VOLKNER:** "If you're here to fight, wait. I'm at ninety-eight percent transmission efficiency. Do you know how long it's been since anything was *difficult*?"
> **PLAYER:** "Do you know what the power's for?"
> **VOLKNER:** "…I didn't ask. That's not like me. I ask everything." *(He slides out and sits up.)* "Why didn't I ask?"
> **PLAYER (choice):** [Tell him] → He goes very still, then throws the main breaker himself. `galactic.x.volkner = turned`; the raid's primary objective completes here. / [Battle him] → *(Battle: Volkner with **Relay**. Executive Ability: **Overbuilt**: his Electric moves cannot be absorbed or redirected; announced.)* **VOLKNER (defeat):** "That was the second interesting thing this year. The first one was a mistake."

**The Roof.** A hundred Drifloon are moored to the railings. Mars is cutting them loose one by one so that nobody can follow her out.

> **MARS (extended):** "The Boss doesn't shout. Did you know? Not once. You could set his desk on fire and he'd make a *note*. I'd burn the region down to hear him raise his voice for me."
> **MARS (defeat, extended):** "Go on, then. Tell him I lost. He'll write it down. He won't even be *disappointed*."

### E6.2 Raid 2 — "The Galactic Building", deeper

**New phase order:** Lobby → Offices → **The Quiet Ward** *(new)* → Lab → Command Room.

**The Quiet Ward.** A long room of padded bays. In each one, a Pokémon is sitting exactly where it was put. This is where the Spiritless line is made.

> **CADET IO** *(mopping, humming, then catching herself)*: "Sorry. I'm not supposed to. It's just very quiet in here and my head fills it in."
> **CADET IO:** "They said the Pokémon are happier. I asked how you can tell. They said that asking is a symptom."
> **PLAYER (choice):** ["Keep humming."] → She does. A Clefairy in the third bay turns its head. `galactic.x.io = doubting`; she will open a door in Raid 5. / ["Open the bays."] → She gives you her card and looks away. Six Spiritless Pokémon are released into the building; the alarm trips (the raid cannot score above Success); one of them follows the player out and can be kept.

> **JUPITER (extended):** "Mars wants him to notice her. Saturn wants to deserve him. I just want to be on the winning side when the lights go out. I'm the only honest one in the building."
> **JUPITER (defeat, extended):** "Hm. Then perhaps it isn't the winning side. I'll think about that. Quickly."

### E6.3 Raid 3 — "Lake Valor", deeper

**New phase order:** Shore → **The Dry Lake** *(new)* → The Cavern → Saturn.

**The Dry Lake.** The bomb has already gone off or is about to, by the raid's timer. Either way the player walks across a lakebed of flopping Magikarp. Hunter J's airship hangs over the island with a bronze statue swinging beneath it on a cable.

> **HUNTER J** *(loudspeaker)*: "Target acquired, client notified, contract closed. Whatever you're about to shout at me, I've been paid."
> *(If `galactic.x.j-marked` is set she lowers herself to the lakebed for a short battle; winning it cuts the cable and **Unwilling** is fought here, bronze cracking off it, one tier lower.)*

> **SATURN (extended):** "I've read his writings. All of them. I can't find the page where we come with him. I assume it's implied."
> **SATURN (defeat, extended):** "…It must be implied."

### E6.4 Raid 4 — "The Side Deal" *(new)*

**Scale:** Border. **Offered:** after `xe.sinnoh.ribbon`, or at world state 4, by Buck.
**Offer (Buck, grinning, singed):** *"There's an old guy in a lab coat halfway up Stark Mountain digging for a rock. He's not doing it for his boss. I can tell, 'cause he keeps looking over his shoulder. Wanna go ruin his day?"*
**PR:** `pr.sinnoh.stark-mountain` — 4 areas: Survival Area → Ash Slope → The Chamber → The Stone. **Security:** heat (non-Fire Pokémon lose 1/16 HP every third turn), ash fall (accuracy −5%), rolling boulders.
**Objectives:** *Primary:* keep the Magma Stone in the mountain. *Secondary A:* free Heatran. *Secondary B:* defeat Lovrina. *Secondary C:* take Charon's notebook.

**Phases**

1. **Survival Area.** Buck joins as a tag partner for the whole raid.
   > **BUCK:** "I call left. I always call left. If there's treasure it's mine, if there's lava it's yours."
2. **Ash Slope.** Charon's private crew: Scientists who think this is company business, and two who know it is not.
   > **GALACTIC RESEARCHER:** "This dig isn't on the roster. I checked. I'm choosing not to check again."
3. **The Chamber.** Lovrina, fanning herself with a clipboard.
   > **LOVRINA:** "It's *so* hot. I told him: bring it to *me*, I'm not climbing a volcano, I have a complexion. And then I thought, no, I want to *see* a chain go on a big one. So here I am. Sweating. For science."
   > *(Battle: Lovrina, with **Heart Lock**. If Suicune was shipped from Johto it is not here; that one is for someone else.)*
   > **LOVRINA (defeat):** "Ugh. Fine. Take the silly disc. I've got it memorized, I'm a *genius*."

   *Reward:* **Data ROM S: "Chain Lock"**.
4. **The Stone.** Charon has the Magma Stone in a carrying case. **Slag Heart** (`ss.galactic.slag-heart`) has followed it up from the deep, bound to whoever holds it.
   > **CHARON:** "Ah. The child. I'd hoped you were on the other mountain. Cyrus is the visionary. I am merely the one who remembered to file the patents."
   > **CHARON:** "He wants no world. I want this one, with my name on rather more of it. Surely that's the more reasonable ambition?"
   > *(Battle: Charon, then Slag Heart at Tier 3. Putting the Stone back on its plinth during the battle, which costs one of the player's turns, frees Heatran at once.)*
   > **CHARON (defeat):** "You'll want my notebook. Everyone does, in the end. Page one is a drawing of a lawnmower. Don't laugh."

**Secondary C:** the notebook's first page is a boy's drawing of a Rotom in a lawnmower, labelled *MY FRIEND*. Showing it to **the Poltergeist Engine** frees it (`sv.galactic.poltergeist`).

**Results (Lever: *The Side Deal*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The Stone is home; Heatran is free; Charon is in Looker's custody | **No Scientist:** Charon's duel is removed from Phase 3; the Red Chain Prototype ability is gone | −3 |
| **Success** | The Stone is home | Charon enters Phase 3 with one fewer Pokémon | −2 |
| **Partial** | The Stone is cracked; Charon escapes | No change | −1 |
| **Failure** | Charon leaves with the Stone | **Patent filed:** Charon's Phase 3 team includes Slag Heart | +2 |
| **Declined** | The mountain smokes | Patent filed | +1 |

**Failure consequences:** **C3 (Confiscation), C5 (Blacklisted), C11.**

### E6.5 Raid 5 — "The Three Machines" *(new)*

**Scale:** Region. **Offered:** when two or more lakes are taken, by Looker.
**Offer (Looker, removing his helmet with ceremony):** *"I have a key, a floor plan and no backup. The International Police sent a memo. The memo says 'observe'. I have observed. Now I would like to do something reckless with a civilian."*
**PR:** `pr.sinnoh.veilstone-hq` — 5 areas: Warehouse → Lobby → Dormitories → The Assembly Hall → The Machine Room. **Security:** warp panels, card locks, cameras (three alarms fail the raid), sleeping Grunts who must not be woken.
**Objectives:** *Primary:* free the guardians held here. *Secondary A:* destroy the chain forge. *Secondary B:* defeat Warden Pell. *Secondary C:* hear Cyrus's speech.

**Phases**

1. **Warehouse.** With the Storage Key this is a side door. Without it: Warden Pell.
   > **WARDEN PELL:** "Regulation 14: no visitors. Regulation 15: visitors who cite Regulation 14 are to be shown out. I've never had to use 15. I've been looking forward to it."
2. **Dormitories.** Rows of bunks. Every Grunt is asleep in exactly the same position. Cadet Io, if `doubting`, is awake, and holds the far door.
   > **CADET IO** *(whispering)*: "I hummed today. On purpose. Nobody stopped me. Nobody even noticed. I think that's worse."
3. **The Assembly Hall.** Five hundred Grunts in ranks. Cyrus at a lectern. The player watches from the gantry.
   > **CYRUS:** "You have given me your labor. I have given you a purpose. Tomorrow that exchange concludes."
   > **CYRUS:** "The world is incomplete because the spirit is incomplete. I will remove the error. There will be no more want, and so no more strife, and so no more of this."
   > *(Applause, perfectly synchronized. He leaves by a side door. In the corridor, to Saturn, in the same tone:)*
   > **CYRUS:** "They will not be coming. The new world has no requirement for them. Do not inform them. It would only cause feeling."
   > **SATURN:** "…Understood, sir."
   > *(Saturn does not move for some time after Cyrus has gone.)*
4. **The Machine Room.** Three tanks. In each, a small bright shape with a red band around it.
   > **SATURN:** "The button on the left opens the tanks. I am required to prevent you from pressing it."
   > *(Battle: Saturn. If the player heard the speech, he fights with half his team.)*
   > **SATURN (defeat):** "The chain is already forged. This changes nothing for him. I find that I want it done anyway. Press it."

   Each guardian freed here is fought briefly (`ss.galactic.unknowing`, `.unfeeling`, `.unwilling`), then flies for its lake. Its regional rule ends.

**Results (Lever: *The Three Spirits*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | All held guardians freed; the forge destroyed; no alarm | **Spirits return:** in Phase 4 each free guardian breaks one Red Chain pulse; Saturn stands aside in Phase 2 | −3 |
| **Success** | All held guardians freed | Each free guardian breaks one pulse | −2 |
| **Partial** | One freed | That guardian breaks one pulse | −1 |
| **Failure** | Three alarms; you are warped to the street | **Second chain:** Stillhour and Farshore each enter Phase 6 with one more chain | +2 |
| **Declined** | The tanks stay shut | Second chain | +1 |

**Failure consequences:** **C1 (Impound), C6 (Hostage: Looker), C11.**

---

## E7. The Climax — Extended Cut: "Zero Hour"

Checkpoints are after Phase 2 and at the Breather.

| # | Phase | Format | New or base | Battles |
| --- | --- | --- | --- | --- |
| 0 | Broadcast and Choice | — | base §10.1–10.3 | 0 |
| 0b | **The Mountain Under Siege** | Siege Map | new | 0 |
| 1 | **The White Tunnel** | Blackout | new | 2–3 |
| 2 | The Ascent | Gauntlet | base Phase 1, extended | 4–6 |
| 3 | The Scientist and the Commanders | Duels | base Phase 2, extended | 2–4 |
| — | **Breather** | Rest | new | 0 |
| 4 | The Red Chain | Set piece | base Phase 3, extended | 2–4 |
| 5 | Cyrus | Boss | base Phase 4, extended | 1 |
| 6 | **Zero Hour: Stillhour and Farshore** | Colossus | new | 1 |
| 7 | **The Distortion World** | Duel | new, optional | 1–2 |
| 8 | Resolution | — | base §10.9, extended | 0 |

### E7.1 Phase 0b — The Mountain Under Siege (Siege Map)

Mt. Coronet has four approaches and one summit.

| District | Held if… | If Lost |
| --- | --- | --- |
| **Oreburgh Gate** (south) | Raid 1 Success or better, or Volkner turned | The Last Rest heals 80% (brownout) |
| **Hearthome Road** (east) | Looker is free and Raid 5 was not Failed | Entry costs one battle with Warden Pell |
| **Celestic Path** (north-east) | Cynthia is coming up the mountain (*The Wall at Celestic*) | Cynthia arrives one phase late |
| **Snowpoint Trail** (north) | Raid 4 Success or better (Buck holds it) | Hunter J's airship has a clear run: +1 battle in Phase 2 |
| **The Summit** | Never | See Phase 4 |

> **LOOKER** *(at the cordon, in his own coat at last)*: "I have filed my report. It is one sentence. 'Send everyone.' They are sending four people and a van. So. It is us."

### E7.2 Phase 1 — The White Tunnel (Blackout)

The player climbs through the mountain. **Condition — *Whiteout*:** hail, accuracy −10% for both sides, and the player cannot see the foe's remaining party count. It ends at the tunnel's upper mouth, or at once if **Friday** is with the player ("Friday lifts you above the snow.").

**Sird** is waiting at the midpoint, alone, warming her hands at a camp stove.

> **SIRD:** "Commander Sird. The fourth one. Nobody remembers the fourth one, which is the point of me."
> **SIRD:** "I report to Cyrus on Mondays. I report to someone else on Thursdays. Neither of them asked me to stop you. But I'd like to see what you do, and reports need content."
> *(Battle: Sird. Trait: **Double Agent**: the first status condition inflicted on either side each battle is copied to the other side as well; announced.)*
> **SIRD (defeat):** "Good. That'll do for both reports." *(She puts the stove out and walks down the mountain, not up.)*

### E7.3 Phase 2 — The Ascent (extended)

| Landing | Trainer | Notes |
| --- | --- | --- |
| Foot | Galactic Grunts ×2 | base |
| **Snow Line** | Orderly Vance with a Spiritless squad | *Spiritless* applies to all four |
| Ridge | Galactic Researchers ×2 | base |
| Saddle | Mars with **Empress** | Trait: **Fierce Loyalty** |
| Col | Jupiter with **Miasma** | Trait: **Stench Cloud**; absent if she "thought about it quickly" and Raid 2 was a Triumph |
| **The Overhang** | Hunter J with **Warrant** | Only if the Snowpoint Trail is Lost or `j-marked` |
| Summit stair | Saturn with **Verdict** | Trait: **Cold Command**; stands aside after a Raid 5 Triumph |

> **HUNTER J:** "My contract ended at the third lake. This is unbilled. Consider it professional curiosity."
> *(Her wrist device fires on the first turn: one of the player's benched Pokémon is turned to bronze and cannot be sent out until she is beaten; announced.)*
> **HUNTER J (defeat):** "Noted. I don't take contracts against people who can do that. Bad for the margins."
> **SATURN** *(standing aside)*: "I was told to hold the stair. I am holding it. I am not obliged to hold it *against* anyone in particular."

### E7.4 Phase 3 — The Scientist and the Commanders (extended)

**Duel 1 — Charon** (base), with **the Poltergeist Engine** if it has not been freed. Removed after a Raid 4 Triumph.

> **CHARON (if the notebook was taken):** "You showed it the drawing. That was low. …It was the only friend I had, you know. I put it in a generator because it was *efficient*. I'm beginning to think I caught something from him."

**Duel 2 — Mars and Jupiter together** (base). New lines:

> **MARS:** "He's up there *alone*. If you get past us he'll have nobody."
> **JUPITER:** "He's always had nobody. He prefers it. That's the entire programme, Mars."
> **MARS (defeat):** "Then I'll go up after. I don't care what the new world needs. *I* need to see him."

**Duel 3 — Lovrina** *(conditional: only if she was not beaten in Raid 4).* She is sitting on an equipment case, painting her nails, a prototype chain coiled beside her with a bow on it.

**Duel 4 — Chief Engineer Volkner** *(conditional: only if he was neither turned nor beaten).* He has realized. He fights anyway, badly, and says "good" when he loses.

### E7.5 Breather

A hollow in the ruins below the summit. Cynthia has found an inscription and lost track of time.

> **CYNTHIA:** "Oh! You're here. Sit, sit. This carving predates the Pillar by a thousand years. It says, roughly: *'When the world was made it was made in three parts, and the third was the wish to go on.'* Isn't that something? Here. I brought ice cream. It's kept rather well."

Heal 50%, revive one Pokémon, checkpoint.

### E7.6 Phase 4 — The Red Chain (extended)

The base set piece (Red Chains at the pillars, Trick Room and Gravity flipping) with these additions.

- **Returning spirits.** Each guardian the player has freed appears at one pillar and cancels one field flip there.
- **Bound spirits.** Each guardian still bound is a Tier 3 Shadow defending a pillar, and its regional rule applies inside the battle too.
- **Cynthia** takes one pillar herself if the Celestic Path is Held.
  > **CYNTHIA:** "Garchomp. That one. Gently. …No, you're right, there isn't a gentle way."

**New PA lines.** There is no PA on the Spear Pillar. Cyrus simply speaks, and the mountain carries it.

> "One chain. The tolerance was two."
> "Two. I am recalculating. I am not concerned. I want that noted, for accuracy."
> "…Three. Curious. I appear to have a preference about the outcome."

### E7.7 Phase 5 — Cyrus (extended)

The base fight (§10.7) with **Absence**, **Zero Kelvin** and **Remainder**.

**New boss stage — *Subtraction*** (after *The Chain Tightens*, when his ace falls below 25% HP): Cyrus completes the process on himself. His remaining Pokémon gain the *Spiritless* rule. His orders stop: for the rest of the battle his side uses its strongest damaging move every turn and never switches. The player can read every move in advance.

> **CYRUS (opening, extended):** "I will explain, because you have earned an explanation and because afterwards there will be no one to give it to."
> **CYRUS:** "When I was a child I was sad for reasons I could not correct. I concluded that the sadness was not in the reasons. It was in the mechanism. I have spent my life locating the mechanism."
> **CYRUS (if `galactic.x.grandfather`):** *(The player says a name.)* "…That is my name. It has not been used in that tone for some years. I do not see the relevance." *(His ace's first move this battle is delayed one turn.)*
> **CYRUS (Subtraction):** "I am finishing it now. On myself. You will observe that I do not hesitate. That is the proof that it works."
> **CYRUS (after Subtraction, flat, to nobody):** "Honchkrow. Night Slash. Honchkrow. Night Slash."
> **CYRUS (defeat, extended):** "I lost. I note that I lost. I note nothing else." *(He turns to the chains.)* "It does not matter. It was never necessary to win. It was only necessary to arrive."

### E7.8 Phase 6 — Zero Hour: Stillhour and Farshore (Colossus)

*The air above the Pillar tears in two places. Out of one comes something that moves the way an hour moves. Out of the other comes something that is further away the closer it gets.*

**Format.** Two Colossi: **Stillhour** (`ss.galactic.stillhour`, XD006) and **Farshore** (`ss.galactic.farshore`, XD007). Each is held by **two Red Chains** (three after a Raid 5 Failure). They cannot be knocked out; the chains are the targets.

| While it has chains | Stillhour (time) | Farshore (space) |
| --- | --- | --- |
| Field rule | Every third turn is played twice (announced) | Every third turn, both sides' active Pokémon are swapped with benched ones (announced) |
| When one chain breaks | The repeat applies only to the player's side, which helps | The swap applies only to its own side |
| When both break | It stops, and looks at the hand that held it | It folds itself smaller, and waits |

**Timer:** 12 turns. **Adjustments:** each free guardian holds one chain slack for two turns; Cynthia, Looker and the rival (Help) each take one hit meant for the player; a turned Volkner cuts power to the summit, removing one chain's shield.

> **CYRUS** *(the chains wrapped round his forearm)*: "Now. Unmake it. Begin with the part that hurts."
> *(Nothing happens. The two shapes strain away from each other.)*
> **CYRUS:** "…They resist. Why do they resist? There is no spirit in a law of nature."
> **CYNTHIA:** "Of course there is. Who do you think the wall was *about*?"

**When the last chain breaks:** the tears do not close. A third opens beneath Cyrus, black and silent, and something with too many wings looks out of it.

> **CYRUS** *(the first expression he has worn all region; it is relief)*: "Ah. There *is* somewhere else."
> *(He steps into it. It was always an exit.)*

**If the timer runs out:** the chains hold for one more turn than the world can stand. The third tear opens anyway and takes Cyrus and both dragons; XD006 and XD007 enter the Region of Doom, and `legend-time-space-trial` stays unresolved.

### E7.9 Phase 7 — The Distortion World (optional)

*Available if the last chain was broken.* Cynthia looks at the tear, and at the player.

> **CYNTHIA:** "I'm going after him. Not to bring him to justice. I just don't think anyone should be alone in a place like that. You don't have to come."

A place where the floor is sometimes the wall. Gravity changes direction each turn (announced): Flying and Levitating Pokémon are grounded on odd turns and everything else floats on even ones.

**Part 1 — Cyrus, without the chain.** He is sitting on a rock that hangs upside down.

> **CYRUS:** "There is nothing here. No one. No time worth the name. It is exactly what I designed." *(A long silence.)* "It is very quiet. I had expected to prefer that."
> *(Battle: Cyrus's remaining Pokémon. They are no longer Spiritless; this place undoes it. Absence looks at him before it attacks, every turn, as if asking.)*
> **CYRUS (defeat):** "It looked at me. All through that. I took everything out of it and it is still *looking at me*."

**Part 2 — the one who lives here.** Origin Giratina is not a Shadow and is not fought to a knockout. It is angry that its world has been used as a door. The player must last 5 turns, or soothe it: any move that heals or protects an ally counts once; three counts end the battle.

> *(It lowers its head to the level of the player's eyes. Then it turns, and with one wing it opens a way back.)*

### E7.10 Phase 8 — Resolution (extended)

The Distortion choice (base §10.9) with these additions.

4. **[Bring him back]** *(only after Phase 7).* Cynthia offers her hand. Cyrus looks at it for a long time. *Effects:* Cyrus returns and is placed in Looker's custody; Galactic dissolves; the commanders each get a different ending (below). If `galactic.x.grandfather` is set, an old man is waiting at the foot of the mountain, and nobody says anything, and that is the scene.
- **[Let Giratina take him], after Phase 7:** Cyrus chooses to stay. **CYRUS:** "I have a great deal to observe. It may take some time. Tell them it was implied."
- **The commanders.** *Mars* climbs the Pillar alone and waits there. *Jupiter* is gone before the news breaks, with the petty cash. *Saturn* stays to wind the company down properly, and reads Cadet Io's resignation letter twice.
- **The Red Chain's design.** If the player holds ROM S: [Destroy it] / [Give it to Cynthia for the archive] / [Keep it] (a Key Item: once per run, bind a wild legendary encounter so that it cannot flee; Lovrina notices).

### E7.11 Rival and Stand-with additions

- **Help:** the rival frees a guardian in Phase 4 without being asked. *Line:* "It was *looking* at me. What was I supposed to do, finish my turn?"
- **Beat-you:** the rival is found bronzed on the Overhang, one of Hunter J's statues. Beating her restores them.
- **Side-with:** the rival is **Commander Mercury**. A successful Turn needs the player to make them laugh, of all things: the dialogue option is the worst joke in the game, and it works.
- **Stand with them:** the player is **Probationer Ceres**. In Phase 6 the player holds one chain for Cyrus and must decide whether to let go. See `scripts/10_STAND_WITH_THEM.md` §4; the new line is Cyrus's: "Ceres. You are still feeling something. I can see it from here. Hold the chain regardless."

---

## E8. Aftermath and the Thread

- **Each lake,** if its guardian is home: fog on the water in the morning, and a ripple with nothing under it.
- **The clinics** close. For a week every Pokémon Center in Sinnoh has a queue out of the door, and then a great many socks go missing across the region.
- **Volkner,** if turned, rebuilds Sunyshore's grid so well that the town has a blackout from the test, as tradition demands.
- **Cadet Io** opens the Veilstone building's doors and leaves them open. She hums the whole time.
- **Looker** files a second report. It is two sentences. The second is "Thank the civilian."

**The Thread (`docs/GRAND_ARC.md`).** **Data ROM S: "Chain Lock"** is the missing half of the waveform: the earlier ROMs make a Pokémon stop listening, and this one makes a *legend* stop refusing. Sird's Thursday reports went to the same address as Lovrina's lab notes.

> **LOVRINA (voicemail on a dropped Pokétch):** "Snattle, sweetie, it's me. The chain works on the big ones. Mm-hm. No, I'm *not* coming to your little castle, it's draughty. Just tell the old man with the cane that his dragon will fit."

---

## E9. Dialogue Bank

### E9.1 New ambush lines

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Clinic Greeter (Bright) | "Welcome! Is your Pokémon experiencing feelings? We can help!" | "I'm experiencing one now. Is that normal?" |
| Grunt — Drifloon Rider (Embarrassed) | "Please don't look at how I arrived." | "I'll walk back." |
| Grunt — Dormitory Guard (Hollow) | "Lights out was at nine. You are not in a bunk." | "…I don't remember my bunk number." |
| Grunt — Spiritless Handler (Calm) | "It won't flinch. It won't beg. It's very restful to command." | "It didn't mind losing. I think I do." |
| Specialist — Chain Forger (Exact) | "Four hundred links. Each one tested. You are a defect in the fifth hundred." | "Reject. Me, I mean." |
| Specialist — Cadet Io (Earnest) | "I'm sorry! I was told to! I'm not good at it yet!" | "Oh, thank goodness." |
| Lieutenant — Orderly Vance (Soothing) | "You seem agitated. Let's reduce that." | "I feel… agitated. How interesting." |
| Lieutenant — Warden Pell (Regulation) | "Regulation 15. At last." | "There's no regulation for this." |
| Commander — Sird (Pleasant) | "Don't mind me. I'm only here to take notes." | "Lovely. That's a full page." |
| Contractor — Hunter J (Clipped) | "You've been priced. It's a good number. Hold still." | "Recalculating the quote." |
| Executive — Chief Engineer Volkner (Bored) | "Fine. Show me something I haven't seen." | "…Huh. Do that again." |
| Liaison — Lovrina (Sugary) | "Ooh, a volunteer! I *love* a strong heart. They make the best noise when they shut." | "Rude. *So* rude. I'm telling everyone." |

### E9.2 Cyrus's barks

| Moment | Line |
| --- | --- |
| Player lands a super-effective hit | "Correct." |
| Player's Pokémon faints | "You grieve. That is the defect in operation. Observe it." |
| His Pokémon faints | "Recall." |
| Player heals | "You are prolonging it. I do not object. I do not anything." |
| A Shadow Pokémon disobeys the player | "The chain's cruder cousin. You carry my method and call me the villain." |
| Last Pokémon each | "A symmetry. I used to find those pleasing." |

### E9.3 Clocks (seen at rest nodes, by world state)

| Step | What the clock does |
| --- | --- |
| 1 | Runs one minute slow. |
| 2 | Stops during each brownout and starts again without being wound. |
| 3 | Chimes thirteen, once. Nobody mentions it. |
| 4 | Runs correctly, but the people looking at it disagree about what it says. |
| 5 | Shows the time you arrived, for as long as you stay. |

### E9.4 Civilians by world state

| Step | Line A | Line B |
| --- | --- | --- |
| 1 | "The clinic's free. My Glameow's so well-behaved now. So… well-behaved." | "They're very polite, the ones in the silver hair. I'll give them that." |
| 2 | "Power's out again. I've started going to bed at dusk like my grandmother." | "The Center could only half-heal my team. 'Rationing', the nurse said." |
| 3 | "I came into this room for something. I've been standing here an hour." *(Acuity)* | "My wife told me a joke this morning. I understood it. I just didn't *mind* it." *(Verity)* |
| 4 | "Can you hear that hum? No? Then I'll stop asking." | "I meant to leave town. I keep not doing it." *(Valor)* |
| 5 | "…" *(They are standing in the street, looking up at the mountain, not unhappy, not anything.)* | "It's nearly time. I don't know for what. I'm not worried. I can't seem to be." |

### E9.5 Announcer lines for special Pokémon

| Pokémon | On entry |
| --- | --- |
| Any Spiritless Pokémon | "It feels nothing about that." |
| Absence | "Absence arrives. The field seems emptier." |
| Friday | "Friday drifts in. It is pleased to see you." |
| The Poltergeist Engine | "The Poltergeist Engine cycles: next form, the lawnmower." |
| Unknowing / Unfeeling / Unwilling | "The shadow tightens. Something small is trying to remember itself." |
| Stillhour | "The second hand hesitates." |
| Farshore | "The far wall is suddenly near." |

---

## E10. Flags and Wiring

| Flag | Set by | Read by |
| --- | --- | --- |
| `galactic.x.subtraction` (0–5), `galactic.x.lake.acuity`, `.verity`, `.valor` | Raids, events | Regional rules, civilians, Phase 4 |
| `galactic.x.sock` | *The Clinic* | Aftermath |
| `galactic.x.volkner` (`turned`) | Raid 1 | Siege Map, Phase 3, Phase 6 |
| `galactic.x.io` (`doubting`) | Raid 2 | Raid 5, Aftermath |
| `galactic.x.grandfather` | *The Bench in Sunyshore* | Phase 5, Phase 8 |
| `galactic.x.j-marked` | *The Marsh Test* | Raid 3, Phase 2 |
| `galactic.x.dragons` (`freed` / `taken`) | Phase 6 | Aftermath, Region of Doom |
| `galactic.x.cyrus` (`returned` / `stayed` / `taken`) | Phase 8 | Aftermath |
| `cipher.seen.lovrina`, `cipher.rom.s` | *The Ribbon*, Raid 4 or Phase 3 | `docs/GRAND_ARC.md` |

**Counts for this file:** 13 named characters (6 new officers, 7 team versions and allies), 11 special Pokémon, 7 special Shadow Pokémon (2 Apex), 8 story events, 3 deepened raids and 2 new raids, an 8-phase Extended Cut, and 5 dialogue tables.
