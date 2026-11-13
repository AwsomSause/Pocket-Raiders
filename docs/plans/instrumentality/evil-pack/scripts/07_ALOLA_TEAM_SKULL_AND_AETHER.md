# 07 — ALOLA: TEAM SKULL AND THE AETHER FOUNDATION
### Script: *The Beast of Paradise*

> *"Noise is how you tell the world you exist. Silence is how the world tells you it's decided otherwise."* — Guzma

**Team type:** Gang (Skull) and Foundation (Aether) · **Primary team (CANON):** Team Skull · **Second team (CANON):** The Aether Foundation · **Returning team:** none
**Climax:** The Beast of Paradise: Aether Paradise and the Ultra Wormhole (Pseudo Region `pr.alola.ultra-wormhole`)
**Regional hooks:** island hopping, Ultra wormhole sighting, `legend-sun-moon-shrine` (`REGIONAL_IDENTITY.md` §3.7)
**Canon note:** Guzma, Plumeria, Lusamine, Faba, Wicke and Gladion are canon characters; their dialogue and the raids are original and follow Sun and Moon and Ultra Sun and Ultra Moon (Po Town, Aether House, Aether Paradise, Ten Carat Hill). Species are my best recall; verify before shipping.

---

## 1. Profile

| Field | Team Skull | The Aether Foundation |
| --- | --- | --- |
| Template | Gang (Boss → Admin → Grunts) | Foundation (President → Branch Chief → Employees) |
| Ideology | Alola does not need Trials; the strong take what they want | Pokémon need protection; the Foundation will do whatever it takes to protect the beautiful |
| Primary objective | Hold Po Town, harass trainers and serve the Foundation as muscle | Open a path to Ultra Space and bring a Beast to Alola |
| Secondary objectives | Steal Pokémon from trainers; scare off Trial-goers | Collect rare Pokémon in the Conservation Area; recruit Gladion's allegiance |
| Preferred types | Poison, Dark, Bug, Normal (Salazzle, Golbat, Masquerain, Scizor, Golisopod, Ariados) | Fairy, Psychic, Normal, Water (Clefable, Lilligant, Mismagius, Milotic, Bewear, Alakazam) |
| AI personalities | Brawler, Opportunist, Gambler | Strategist, Zealot |
| Mercy | 0.5 (Guzma respects a good fight) | 0.1 (Lusamine does not forgive what is plain) |
| Shadow method | **Stolen Bond**: Skull's "borrowed" Pokémon are bound by the taker's whistle | **Conservation Hold**: the Foundation's lab seals a Pokémon's will |
| Colors / uniform | Black-and-white hoodies, bandanas, skull badges | White coats with an A, silver trim |
| HQ | Po Town; the Aether House (as a shared base) | Aether Paradise, a floating conservation island |
| Lifecycle | 2 Emerging → 4 Major at climax | 4 Major → 5 Dominant at climax |

## 2. Hierarchy and Roster

### 2.1 Team Skull

| Name | Rank | Title | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- |
| **Guzma** | Leader (7) | Boss | Brawler / Strategist | Masquerain, Scizor, Ariados, **Golisopod** (ace) *(SM/USUM; approximate)* | Loud, wounded, surprisingly loyal |
| **Plumeria** | Second (6) | Admin | Enforcer | Golbat line, **Salazzle** (ace) *(approximate)* | Tough, motherly, blunt |
| **Skull Grunts** | Grunt (1) | "Skull Grunt" | Enforcer | Rattata, Zubat, Yungoos, Salandit, Drowzee | Cocky, rapping |

### 2.2 The Aether Foundation

| Name | Rank | Title | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- |
| **Lusamine** | Leader (7) | President | Zealot / Strategist | Clefable, Lilligant, Mismagius, Milotic, Bewear, **Nihilego** (Ultra Beast) *(SM)* | Cold, tender, terrifying |
| **Faba** | Executive (5) | Branch Chief | Scientist / Enforcer | Alakazam, Hypno, Bruxish *(SM; approximate)* | Pompous, nervous |
| **Wicke** | Specialist (2) | Employee (inside contact) | Medic | (non-combat) | Warm, uneasy |
| **Gladion** | Lieutenant (3) | Former heir; defector | Scout / Enforcer | Silvally, Zoroark, Crobat *(SM)* | Dry, guarded |
| **Aether Employees** | Grunt (1) | "Aether Employee" | Technician | Clefairy, Alakazam, Porygon, Magnemite | Polite, unsettling |

> **Org chart:** Lusamine → Faba → (Gladion, Wicke) → Employees. Guzma → Plumeria → Grunts. The Skull line answers, quietly, to the Foundation. **Jessie, James and Meowth** (script 00) appear as unaligned rivals.

## 3. Story Overview

**Logline:** A gang has been terrorizing the islands. Behind it, a foundation that saves Pokémon has been reaching for something much bigger.

**Backstory.** Skull started as a pack of kids no Trial would take. Guzma gave them a place and a name and a reputation for noise. Lusamine used that noise as cover: while the islands watched Po Town, the Foundation built its own gate to Ultra Space.

**The twist.** Skull is a decoy. Guzma serves the Foundation because Lusamine once told him he mattered, and he has believed it ever since. When the gate opens, the truth reaches him before it reaches the player.

**Climax arc:** The Foundation opens an Ultra Wormhole above Aether Paradise and pulls through a Beast. The player must cross the Paradise, break the gate and face a President who has stopped being quite human.

## 4. Act 0 — Rumors

- **Kid:** "Team Skull took my Pokémon. They said it was a prank. It wasn't a very funny prank."
- **Trial guide:** "Somebody's been painting skulls on the Trial sites."
- **Aether employee (smiling):** "We're a conservation foundation! We just love Pokémon."
- **Poster in Hau'oli:** "Protecting Pokémon, one island at a time. Aether Foundation." (Intel +2: the poster has a small skull inked in the corner.)
- **Item:** A dropped **Skull bandana** (Intel +2).

## 5. Act I — Ignition

*Trigger: after Gym 1–3 (Trial 1–3). On a beach, a group in black-and-white hoodies is trading insults with a Trial-goer.*

**Scene: The Beach**

> **PLUMERIA** *(tough, with a Salazzle at her heel)*: "Yo. You. Kid. Keep walkin'."
> **PLUMERIA:** "Team Skull's got this beach. Nothin' personal."
> **PLAYER (choice):**
> 1. **"Can I join?"** → Plumeria raises an eyebrow. "You got a rap?" **Sets `skull.insideman = true`, Heat −25.** *(Raids become infiltration variants.)*
> 2. **"Leave them alone."** → Plumeria: "Make me." *(Battle: Plumeria + 2 Grunts; beach environment, announced.)*
> 3. **"Who's the boss?"** → Plumeria, softly: "Guzma. He gets mad if you ask."
> *Nearby, a Grunt is snatching a trainer's Pokémon and running off.*
> **GRUNT:** "Finders keepers!"
> **PLAYER (choice):** Intervene (battle) / Call the Trial captain (Heat +0) / Ignore.
> **PLUMERIA (defeat):** "Tch. Not bad. Don't tell Guzma I said that."

*Outcome: Team Skull awake (the Foundation stirs). Heat 20 (28 on battle).*

## 6. Pursuit — Ambush Dialogue

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Skull Grunt (Cocky) | "Yo, yo! You're on Skull turf, bro!" | "Aw, man. That's not how the rhyme goes." |
| Grunt — Skull Grunt (Rapping) | "Gonna spit rhymes about how you're about to lose." | "Okay, that rhyme was weak. You win." |
| Grunt — Skull Grunt (Nervous) | "Boss said not to let anyone through. Please don't make me." | "Please don't tell Plumeria." |
| Grunt — Aether Employee (Polite) | "Please hand over your Pokémon for their safety." | "I… did not expect resistance." |
| Grunt — Aether Employee (Unsettling) | "They'll be safe with us. Truly." | "Oh. That was unfortunate." |
| Lieutenant — Aether defector Gladion (Dry) | "I'd tell you to walk away. You won't. So." | "Good. You're stronger than I thought." |
| Commander — Skull Admin Plumeria (Blunt) | "Skull doesn't need a Trial. Skull needs respect." | "Respect. Fine. You got it." |
| Executive — Aether Branch Chief Faba (Pompous) | "I am the Branch Chief of the Aether Foundation. You will be deferential." | "I… I must consult the President." |
| Executive — Skull Boss Guzma (Loud, rare) | "I'm the boss. I'm the best. Come prove otherwise." | "…Huh. Guess I'm not." |
| Executive — Aether President Lusamine (Cold, rare) | "My dear, you have no idea how much I adore you." | "How unfortunate. I do so hate unfinished work." |

## 7. Raid 1 — "Po Town"

**Offer (a Trial captain):** *"They've taken over the town and put up a fence. Nobody's been in or out for days."*
**PR:** `pr.alola.po-town` — 3 levels: Gate → Square → Mansion. **Security:** spray-painted walls (slippery floor), Grunt patrols, Salazzle ambush.
**Objectives:** *Primary:* break into the Mansion. *Secondary A:* free the captured trainers. *Secondary B:* defeat Admin Plumeria.

**Key scene (Mansion):**
> **PLUMERIA:** "Guzma's up there. Gotta get through me first."
> *(Battle: Plumeria, with Golbat, Crobat, Salandit, Salazzle, Toxapex; Executive Ability: **Venom Toll**: once per battle, her first Poison move leaves the target poisoned and unable to be cured for 2 turns; announced.)*
> **PLUMERIA (defeat):** "Tch. You're strong. Guzma… he needs someone like you."

**Results (Lever: *The Town*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | Po Town is freed; Skull's noise falls silent | **Guzma wavers:** Phase 3 Guzma fights for the player, not the President | −3 |
| **Success** | The Mansion is entered | Phase 1 −1 battle | −2 |
| **Partial** | Half the town is cleared | No change | −1 |
| **Failure** | Plumeria expels you; Skull tightens the fence | **Skull loud:** +1 gauntlet battle; Guzma +5% HP | +2 |
| **Declined** | Skull holds Po Town | Unchanged | +1 |

**Failure consequences:** **C2 (Fine / Shakedown), C6 (Hostage), C11.**

## 8. Raid 2 — "Aether Paradise: Conservation Area"

**Offer (Wicke, by whisper):** *"They're not saving the Pokémon, they're keeping them. Something is going on in the lab below."*
**PR:** `pr.alola.aether-paradise` — 4 floors: Entrance → Conservation Area → Lab → Gate Room. **Security:** laser grids, glass tubes, Employee patrols.
**Objectives:** *Primary:* shut down the Gate Room's power. *Secondary A:* free the Pokémon in the tubes. *Secondary B:* defeat Branch Chief Faba.

**Key scene (Gate Room):**
> **FABA:** "You have no business here! The President's work is delicate!"
> *(Battle: Faba, with Alakazam, Hypno, Bruxish, Slowking, Mr. Mime; Executive Ability: **Barrier Mind**: once per battle, his first Psychic move creates a Reflect for 3 turns; announced.)*
> **FABA (defeat):** "No! The President will have my head!"

**Results (Lever: *The Gate*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The Gate Room goes dark; the tubes are freed | **Gate weakened:** Phase 3 Gate Nodes reduced by 1; Nihilego does not appear in Phase 4 | −3 |
| **Success** | The Gate's power is cut | Phase 2 −1 duel | −2 |
| **Partial** | The Gate is damaged | No change | −1 |
| **Failure** | The lab seals; you are thrown into the Conservation Area | **Gate open:** +1 Gate Node; Lusamine's Phase 4 ace gains +5% HP | +2 |
| **Declined** | The Gate Room stays active | Unchanged | +1 |

**Failure consequences:** **C1 (Impound: "kept in the Conservation Area"), C10 (Shadowed), C11.**

## 9. Raid 3 — "Ten Carat Hill" *(conditional)*

**Setup:** An old Ultra Space gate lies beneath Ten Carat Hill; the Foundation is trying to use it as a second route. Close it.
**PR:** `pr.alola.ten-carat-gate` — 2 floors; **Objectives:** seal the gate; free the trapped Pokémon; defeat Gladion (Silvally, Zoroark, Crobat; Trait: **Memory Drive**: his Silvally changes type once per battle; announced).
**Results (Lever: *The Second Gate*):** Triumph: Gladion joins you for Phase 3 as a Support NPC (timer +3); Success: timer +2; Partial: 0; Failure: the second gate opens (+1 gauntlet); Declined: unchanged.

## 10. Climax — "The Beast of Paradise"

### 10.1 News Report A

*Alola Broadcasting. Anchor: Kalani Mahoe. Chyron: BREAKING — A HOLE IN THE SKY.*

> **ANCHOR (Kalani Mahoe):** "Good evening. An enormous rift has opened above Aether Paradise. Residents of Hau'oli are reporting strange lights and sounds."
> **ANCHOR:** "The Aether Foundation says the event is a 'scheduled experiment.' Team Skull has been seen on the Paradise's perimeter."
> *(Camera: a purple wormhole above a floating island; shapes moving inside it.)*
> **FIELD REPORTER:** "Trial captains have been called. The Paradise's gates are locked."
> *[Raid recap]* "Earlier, a trainer freed Po Town…" / "The Conservation Area lab was partly shut down…" / "The Ten Carat Hill intervention failed."
> *(Freeze: the player at the Hau'oli dock.)* **Choice: [Take them on] / [Stay out of it]**

### 10.2 News Report B (rival beat you there)

> **ANCHOR:** "…a young trainer in {rivalOutfitTag}, with a {rivalAceType}-type Pokémon, was seen boarding a ferry toward Aether Paradise ahead of the captains. Contact was lost at the gate."
> **CHYRON:** `TRAINER INSIDE AETHER PARADISE — STATUS UNKNOWN`

### 10.3 The Choice
**[Take them on]** → `PS-CLIMAX`. **[Stay out of it]** → Offscreen Resolution.
**[Stand with them]** → `PS-CLIMAX-ALLIED` *(shown only if eligible: `skull.insideman` set, reputation ≥ +45, not betrayed, no prior Turn; see `docs/STAND_WITH_THEM.md` and `scripts/10_STAND_WITH_THEM.md` §7)*.

### 10.4 Phase 1 — The Approach (Gauntlet)

*Hau'oli dock to the Paradise's lab. Gauntlet battles: 3 + round(OS/2), clamp 4–7.*

| Area | Trainer | Notes |
| --- | --- | --- |
| Dock | Skull Grunts ×2 | Poison/Dark; salt spray (accuracy −5% both) |
| Entrance | Aether Employees ×2 | Psychic/Fairy; polite |
| Conservation Area | Lieutenant Gladion (if foe) | Normal/Dragon; Trait: **Memory Drive** |
| Lab | Plumeria | Poison/Dark; Trait: **Venom Toll** |
| Gate Room door | Faba | Psychic; Trait: **Barrier Mind** |

**Dialogue:**
> **GLADION:** "I'd say I'm sorry. But I'm not. You're in my way."
> **GLADION (defeat):** "…Go on. She won't listen to me. Maybe she'll listen to you."

### 10.5 Phase 2 — The Boss and the Chief

**Duel 1 — Guzma** (Masquerain, Scizor, Ariados, Pinsir, **Golisopod** (ace); Executive Ability: **Rowdy Respect**: once per battle, he doubles the damage of a move that would KO him; announced.)
> **GUZMA:** "I'm not the bad guy! I just wanna matter!"
> **GUZMA (defeat):** "…Lusamine was supposed to say I mattered. She didn't."

**Duel 2 — Faba** (as in Raid 2.)

### 10.6 Phase 3 — The Set Piece: The Gate

*A purple gate hangs open above the Paradise's heart. Something is pulling through.*

**Objective:** Close the **Gate Nodes** (2–4 depending on Levers). Each is a battle on a platform while **Ultra gravity** shifts every 3 turns (Gravity ↔ Magic Room, announced one turn ahead).

**Broadcast (PA):**
> **LUSAMINE (voice):** "Hush now. The beautiful ones are coming. They only need a little space."

**Complication:** If Ten Carat Hill was lost (no Raid 3 Success), a Beast-touched Pokémon attacks the final node (one extra battle).

### 10.7 Phase 4 — Lusamine

*The gate's center, the President in white with a halo of Nihilego tendrils.* **Team:** Clefable, Lilligant, Mismagius, Milotic, Bewear, **Nihilego** (ace, Ultra Beast). **Doctrine: Perfect Protection**: the first time her ace is hit each battle, its Defense rises +1 (announced). **Boss phase:** at 50% ace HP, **Fusion**: Nihilego's poison seeps into her team; the player's Pokémon take 6% HP at the end of each turn for 3 turns (announced).

> **LUSAMINE:** "You see, darling, the only way to protect the beautiful is to own them."
> **PLAYER:** "Lillie wants her mother back."
> **LUSAMINE:** "She'll have a better one. A truly lovely one."
> *(Battle.)*
> **LUSAMINE (mid):** "Faster! Show me what's beautiful in you!"
> **LUSAMINE (defeat):** "Oh. It's all so… ordinary. Is that all?"

### 10.8 Rival variants (Alola)

**Help (60%).** The rival sails in with a Trial captain, takes the Dock (Phase 1 −1) and holds a Gate Node in Phase 3. *Line:* "Whatever she's calling beautiful, it's not."
**Beat-you (30%).** The rival reaches the Lab first and is netted by Aether Employees (Hurt/Captured). Rescue: cross the Lab while the gravity shifts (3 steps). *Line:* "They were so polite. That's the scary part."
**Side-with (10%).** *Hook:* Skull recruited the rival with a Trial-skipping scheme. *Foreshadow:* (1) the rival wears a bandana at the Trial; (2) a Grunt says "Yo, boss's pal"; (3) their Pokémon has a Skull brand.
> **Reveal:** The rival in the Conservation Area: "They said I didn't have to earn it. I believed them."
> **Turn responses:** [Offer to earn it together] (key for Friendly/Heir) / [Tell them what it costs] (key for Prodigy/Scholar) / [Challenge them to win a fair Trial] (key for Hotshot/Mirror) / [Say you understand] (key for Bitter/Lone Wolf)

### 10.9 Resolution — The Gate

The wormhole shrinks, flickering. The President sags against the gate's frame, Nihilego curling above her.

**Choice:**
1. **[Close the Gate]** — The wormhole seals. *Effects:* Peacemaker Emblem; `legend-sun-moon-shrine` resolved; Nihilego is returned to Ultra Space.
2. **[Leave a window]** — You leave the gate ajar. *Effects:* a later event: Ultra Beasts visit Alola; Lusamine is placed in care.
3. **[Hand the Beast to the Foundation's staff]** — The Foundation's Employees take custody. *Effects:* region reputation +15; the Foundation is restructured under Wicke.

**Lusamine (if Closed):** "How lovely. Ending."

### 10.10 Stay Out — Offscreen Resolution (Alola flavor)

The gate opens and the Beast crosses. Region effects: **Occupation** (Aether Paradise is closed; rest nodes heal 50%), **Prices +15%**, **Skull** (the gang vanishes into the Foundation). Aether and Skull join the Region of Doom.

### 10.11 If You Fall (the run ends)

*A climax defeat ends the run. This is the scene and the Doom Ledger entry that close it.*

**Scene.** The screen goes to black. The party is on the floor. The leader speaks last.
> **LUSAMINE:** "Don't cry. There's room for you. There's room for all of you."
> **BROADCAST (voice-over):** Alola Broadcasting: "The wormhole is open. We are unable to… we are unable to describe what is crossing."

**What happens to the region.** The Beast crosses, and the Foundation brings the others after it. Aether does not rule Alola; it collects it.
**Rival coda.** The rival's line for this moment is in `CLIMAX_RIVAL_INTEGRATION.md` §13 (by archetype and by the variant that was rolled).
**Impounded Pokémon.** Any still held are not returned. The Doom Ledger records `lost-with-impounded`.
**Doom Ledger entry.** `skull.ended = triumphant`; `aether.ended = triumphant`; `run.ended = climax-defeat`. A triumphant team enters the Region of Doom with +1 Doom Level.

## 11. Aftermath

- **If Closed:** Kalani Mahoe: "The wormhole has closed. Skull has announced its disbanding."
- **If Window:** "Ultra Beasts have been spotted over Poni Island. The Foundation is under review."
- **If Staff:** "Aether Foundation reorganized under new management. Employees say the mood is better."
- **Doom Ledger entry:** `skull.ended`, `aether.ended` = closed | window | restructured.

## 12. Art and audio notes

- **Skull:** black-and-white hoodies, bandanas, skull badges; Guzma in a hoodie with a chain; Plumeria in a battered jacket.
- **Aether:** white coats with an A, silver trim; Lusamine in a white dress with a halo of tendrils.
- **Paradise:** a floating island with glass domes and white corridors; a purple wormhole above.
- **Music:** a trap beat for Skull; a lullaby for Aether; they braid together in Phase 3.
