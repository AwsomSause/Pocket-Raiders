# 06 — KALOS: TEAM FLARE
### Script: *The Ultimate Weapon*

> *"Beauty is worth the price of everything that is not beautiful."* — Lysandre

**Team type:** Corporation (a fashion-and-science front for a cult of aesthetes) · **Primary team (CANON):** Team Flare · **Returning team:** none
**Climax:** The Ultimate Weapon: the Team Flare Secret HQ at Geosenge Town (Pseudo Region `pr.kalos.geosenge-hq`)
**Regional hooks:** Mega Evolution, the ultimate-weapon legend, cathedral/orchard/market nodes, `legend-xerneas-yveltal` (`REGIONAL_IDENTITY.md` §3.6)
**Canon note:** Lysandre, Malva, Aliana, Bryony, Celosia, Mable and Xerosic are canon characters; their dialogue and the raids are original and follow X and Y (Power Plant, Frost Cavern, Lysandre Labs, Geosenge). Species are my best recall; verify before shipping.

---

## 1. Profile

| Field | Value |
| --- | --- |
| Template | Corporation (Leader → Admins → Scientists → Grunts) |
| Ideology | The world is ugly and overcrowded; only the beautiful deserve to survive it |
| Primary objective | Awaken the ultimate weapon at Geosenge with Xerneas or Yveltal's life-force and remake Kalos for the chosen few |
| Secondary objectives | Drain the Power Plant; recruit stylish allies; broadcast its message through the Elite Four |
| Preferred types | Fire, Dark, Poison, Psychic (Mienshao, Honchkrow, Pyroar, Gyarados, Aegislash) |
| AI personalities | Strategist, Zealot, Gambler |
| Mercy | 0.2 (Lysandre forgives nothing ugly) |
| Shadow method | **Life-Force Siphon**: the weapon's current bleeds a Pokémon's will into the machine |
| Colors / uniform | Crimson jumpsuits with white flame hoods; scientists in white coats with a red F |
| HQ | The Lysandre Labs in Lumiose (under the café); the Secret HQ at Geosenge |
| Lifecycle | 3 Established → 5 Dominant at climax |

## 2. Hierarchy and Roster

| Name | Rank | Title | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- |
| **Lysandre** | Leader (7) | Boss | Strategist / Zealot | Mienshao, Honchkrow, Pyroar, **Gyarados** (ace, Mega) *(XY)* | Elegant, restless, sincere |
| **Malva** | Second (6) | Admin; Elite Four Fire specialist; broadcaster | Spokesperson / Strategist | Pyroar, Torkoal, Chandelure, Talonflame *(XY; approximate)* | Cool, theatrical, loyal |
| **Xerosic** | Executive (5) | Admin; Scientist | Scientist | Crobat, Malamar, Weezing *(approximate)* | Arrogant, brilliant |
| **Aliana** | Commander (4) | Admin | Infiltrator / Technician | (approximate) | Flat, efficient |
| **Bryony** | Commander (4) | Admin | Enforcer | (approximate) | Sharp, proud |
| **Celosia** | Commander (4) | Admin | Enforcer / Handler | Aegislash *(manga)* | Haughty, vain |
| **Mable** | Commander (4) | Admin | Strategist | (approximate) | Cold, precise |
| **Flare Scientists** | Specialist (2) | "Flare Scientist" | Scientist | Magneton, Porygon2, Klefki | Detached |
| **Flare Grunts** | Grunt (1) | "Flare Grunt" | Enforcer | Zubat, Houndour, Skorupi, Pancham | Preening, hostile |

> **Org chart:** Lysandre → Malva → (Xerosic) → (Aliana, Bryony, Celosia, Mable) → Scientists → Grunts. **Jessie, James and Meowth** (script 00) appear as unaligned rivals.

## 3. Story Overview

**Logline:** A stylish cult is about to switch on a weapon that destroys everyone it does not like. Its Boss is a philanthropist who owns the café.

**Backstory.** Lysandre built Flare from a love of beauty and a loathing of waste. He recruited designers, scientists and a few Elite Four, and hid his lab under a Lumiose café. Thousands of years ago, a king built a weapon; Lysandre found it.

**The twist.** The Elite Four's newscast is Flare's megaphone: Malva, the fire specialist, hosts the climax broadcast. The player is not warned by the news; the player is addressed by it.

**Climax arc:** The weapon charges beneath Geosenge. The player must break through the Admins, cut the conduits and face the Boss before the light goes out.

## 4. Act 0 — Rumors

- **Cafe patron:** "The coffee at Lysandre's is excellent. The owner donates to museums."
- **Engineer:** "The Power Plant went dark last night. A lot of people in red coats left in a hurry."
- **TV broadcast:** "…Malva here, with tonight's special report. The future of Kalos is ours to design."
- **Poster in Lumiose:** "A beautiful world is a better world. Team Flare." (Intel +2: stamped with an F.)
- **Item:** A dropped **Flare pin** (Intel +2).

## 5. Act I — Ignition

*Trigger: after Gym 1–3. In a Lumiose boutique, an elegantly dressed Flare Admin is placing a stylish order for six hundred meters of red wire.*

**Scene: The Fitting**

> **ALIANA** *(flat, immaculate)*: "This is not a shop for shoppers. Please leave."
> **ALIANA:** "Team Flare is building a better Kalos. You may purchase a pin, or you may go."
> **PLAYER (choice):**
> 1. **"I'd like to join."** → Aliana studies the player's shoes. "Excellent taste." **Sets `flare.insideman = true`, Heat −25.** *(Raids become infiltration variants.)*
> 2. **"What's the wire for?"** → Aliana: "A project. Please don't ask again." *(Battle: Aliana + 2 Grunts; indoor, accuracy −5% both.)*
> 3. **"I'll tell the police."** → Aliana, gently: "Do." *(Heat +0; the boutique empties by morning.)*
> *A clerk is stuffing red wire into a crate marked PLANT.*
> **CLERK:** "It's for a fashion show. Probably."
> **PLAYER (choice):** Intervene (battle) / Follow the crate (Intel +3) / Ignore.
> **ALIANA (defeat):** "Disappointing. The Boss said you'd be a nuisance. He did not say how much."

*Outcome: Team Flare awake. Heat 20 (28 on battle).*

## 6. Pursuit — Ambush Dialogue

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Flare Grunt (Preening) | "Nice outfit. Mine's better." | "Okay. Maybe not *that* much better." |
| Grunt — Flare Grunt (Hostile) | "We're cleaning up Kalos. You're mess." | "Mess. I get it." |
| Grunt — Flare Grunt (Nervous) | "The Boss says I'm good. I'm not sure." | "Don't tell the Admins." |
| Specialist — Flare Scientist (Detached) | "Your Pokémon will make a fine test subject." | "Subject… unsuitable." |
| Specialist — Flare Scientist (Eager) | "Let's calibrate! Hold still!" | "That was not in the calibration." |
| Commander — Aliana (Flat) | "Please keep this short. I have a schedule." | "Rescheduled." |
| Commander — Bryony (Sharp) | "I don't lose to people who dress like that." | "You're better dressed than I thought." |
| Commander — Celosia (Haughty) | "I'm told I have a gift for making things beautiful. Watch." | "Hmph. You'll regret that." |
| Commander — Mable (Cold) | "Don't be afraid. It will be very cold." | "Cold… and over." |
| Executive — Xerosic (Arrogant) | "I'd say 'a pleasure,' but that would be generous." | "Hmph. I underestimated the variable." |
| Second — Malva (Cool) | "Good evening. Special report: you lose." | "That… was not in the script." |
| Leader — Lysandre (Elegant, rare) | "You have the eyes of a good person. That is unfortunate." | "Then the beauty was in you all along." |

## 7. Raid 1 — "The Power Plant"

**Offer (a plant engineer):** *"They've cut the plant's lines. Half of Lumiose is dark. The switch room is on the second floor."*
**PR:** `pr.kalos.power-plant` — 3 levels: Yard → Turbine Hall → Switch Room. **Security:** electric hazards, Grunt patrols, cameras.
**Objectives:** *Primary:* restore the plant's main feed. *Secondary A:* free the engineers. *Secondary B:* defeat Admin Aliana.

**Key scene (Switch Room):**
> **ALIANA:** "You are interrupting a schedule. This will be brief."
> *(Battle: Aliana, with Magneton, Crobat, Houndoom, Skorupi, Klefki; Executive Ability: **Blackout**: once per battle, her first Electric move drains the player's Terrain; announced.)*
> **ALIANA (defeat):** "…I will report this as a delay."

**Results (Lever: *The Current*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The plant is back on; Lumiose is lit | **Weapon starved:** Phase 3 Conduits reduced by 1; the charge slows | −3 |
| **Success** | The feed is restored | Phase 1 −1 battle | −2 |
| **Partial** | Half the grid returns | No change | −1 |
| **Failure** | Aliana overloads the plant | **Weapon fed:** +1 Conduit; Flare's Pokémon +5% HP | +2 |
| **Declined** | The plant stays dark | Unchanged | +1 |

**Failure consequences:** **C2 (Fine / Shakedown), C5 (Blacklisted), C11.**

## 8. Raid 2 — "Frost Cavern"

**Offer (a Ranger):** *"Flare is mining something in Frost Cavern. They've sealed the lower level. Whatever it is, it isn't ice."*
**PR:** `pr.kalos.frost-cavern` — 3 floors: Mouth → Ice Hall → Dig Site. **Security:** ice-slide hazards, frozen pools, Grunt patrols.
**Objectives:** *Primary:* destroy the dig's cooling rig. *Secondary A:* rescue the miners. *Secondary B:* defeat Admin Mable.

**Key scene (Dig Site):**
> **MABLE:** "You'll want to leave. It's about to get colder."
> *(Battle: Mable, with Glalie, Weavile, Abomasnow, Cryogonal, Aegislash; Executive Ability: **Whiteout**: once per battle, her first Ice move sets a 3-turn hail; announced.)*
> **MABLE (defeat):** "…I did not expect to be warm."

**Results (Lever: *The Cooling Rig*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The rig is smashed; the dig is flooded | **Core cooling failed:** the weapon overheats; Phase 3 timer +3 | −3 |
| **Success** | The rig is disabled | Timer +2 | −2 |
| **Partial** | The rig is damaged | No change | −1 |
| **Failure** | The cavern collapses on the miners | **Core cooled:** timer −2; +1 gauntlet battle | +2 |
| **Declined** | The dig continues | Unchanged | +1 |

**Failure consequences:** **C1 (Impound: "kept in the Dig"), C6 (Hostage: a miner), C11.**

## 9. Raid 3 — "Lysandre Labs" *(conditional)*

**Setup:** Beneath the café, the Labs hold Flare's stolen life-force data. Destroy it and the weapon loses its targeting.
**PR:** `pr.kalos.lysandre-labs` — 2 floors; **Objectives:** destroy the data core; free the research subjects; defeat Xerosic (Crobat, Malamar, Weezing, Muk; Trait: **Hypnotic Core**: his first Malamar move reverses the player's stat changes; announced).
**Results (Lever: *The Data*):** Triumph: the data is erased (Phase 3 −1 Conduit; Lysandre loses a Pokémon); Success: timer +2; Partial: 0; Failure: the core is moved to Geosenge (+1 gauntlet); Declined: unchanged.

## 10. Climax — "The Ultimate Weapon"

### 10.1 News Report A

*Kalos Television. Anchor: **Malva** (Elite Four). Chyron: SPECIAL REPORT — THE FUTURE OF KALOS.*

> **ANCHOR (Malva):** "Good evening. This is Malva with a special report. Team Flare, a cooperative of Kalos' finest minds, is today unveiling a project of historic proportions."
> **ANCHOR:** "At 21:00, a new era begins at Geosenge Town. I invite all Kalosians to watch. Those who do not will be assisted."
> *(Camera: a red-lit menhir circle; crimson-clad figures; a crater opening in the earth.)*
> **FIELD REPORTER:** "Police have lost contact with Geosenge. Military units are on route. The Elite Four have not responded to our calls."
> *[Raid recap]* "Earlier, a trainer restored the Power Plant…" / "Frost Cavern's rig was partly disabled…" / "The Lysandre Labs intervention failed."
> *(Freeze: the player at the Geosenge turn-off.)* **Choice: [Take them on] / [Stay out of it]**

### 10.2 News Report B (rival beat you there)

> **ANCHOR (Malva):** "…I'm told a young trainer in {rivalOutfitTag}, with a {rivalAceType}-type Pokémon, has entered Geosenge ahead of the military. This is not an approved participant. Please ignore this segment."
> **CHYRON:** `TRAINER INSIDE GEOSENGE — STATUS UNKNOWN`

### 10.3 The Choice
**[Take them on]** → `PS-CLIMAX`. **[Stay out of it]** → Offscreen Resolution.
**[Stand with them]** → `PS-CLIMAX-ALLIED` *(shown only if eligible: `flare.insideman` set, reputation ≥ +45, not betrayed, no prior Turn; see `docs/STAND_WITH_THEM.md` and `scripts/10_STAND_WITH_THEM.md` §6)*.

### 10.4 Phase 1 — The Descent (Gauntlet)

*Geosenge menhirs to the Secret HQ. Gauntlet battles: 3 + round(OS/2), clamp 4–7.*

| Level | Trainer | Notes |
| --- | --- | --- |
| Menhir circle | Flare Grunts ×2 | Fire/Dark; red-lit (Fire +10% both) |
| Surface | Flare Scientists ×2 | Electric/Psychic; 1 gadget each |
| Hall | Admin Celosia | Steel/Ghost; Trait: **Vanity** |
| Hall | Admin Bryony | Dark/Poison; Trait: **Proud Strike** |
| HQ door | Admin Mable | Ice; Trait: **Whiteout** |

**Dialogue:**
> **CELOSIA:** "Everything I wear has a purpose. Even this fight."
> **CELOSIA (defeat):** "Not a single stitch out of place. How rude."

### 10.5 Phase 2 — The Scientist and the Broadcaster

**Duel 1 — Xerosic** (as in Raid 3.)
> **XEROSIC:** "Please don't touch the console. It's very expensive."
> **XEROSIC (defeat):** "My model said you could not do that."

**Duel 2 — Malva** (Pyroar, Torkoal, Chandelure, Talonflame, Houndoom; Executive Ability: **On Air**: once per battle, her first Fire move is announced a turn ahead and cannot be avoided by switching; announced.)
> **MALVA:** "I'm broadcasting this live. Try to look surprised."
> **MALVA (defeat):** "…Cut. We're off the air."

### 10.6 Phase 3 — The Set Piece: The Conduits

*The weapon's core glows beneath the menhirs; the earth hums.*

**Objective:** Cut the **Conduits** (2–4 depending on Levers). Each is a battle at a menhir while the **weapon charge** rises: every 3 turns, both sides' Fire and Electric moves hit 10% harder (announced).

**Broadcast (PA):**
> **LYSANDRE (voice):** "In a few moments there will be nothing left to be sorry about."

**Complication:** If the data core was moved (no Raid 3 Success), the weapon already has its target and a Targeting Echo joins the final Conduit (one extra battle).

### 10.7 Phase 4 — Lysandre

*The weapon's chamber, the light beating behind him like a heart.* **Team:** Mienshao, Honchkrow, Pyroar, **Gyarados** (ace, Mega). **Doctrine: Perfect Form**: his Mega Evolution is announced one turn ahead; once Mega, his ace's Dark and Water moves hit +10%. **Boss phase:** at 50% ace HP, **The Weapon Pulses**: both sides' Fire and Electric moves are boosted +10% for 3 turns.

> **LYSANDRE:** "You are beautiful. I am sorry. I cannot let beauty exist alongside the rest."
> **PLAYER:** "People live here."
> **LYSANDRE:** "People are why we need a new world."
> *(Battle.)*
> **LYSANDRE (mid):** "Come now! Show me beauty!"
> **LYSANDRE (defeat):** "Then it was never about the world. It was about me."

### 10.8 Rival variants (Kalos)

**Help (60%).** The rival fights through the menhir circle, takes the Surface (Phase 1 −1) and holds a Conduit in Phase 3. *Line:* "Whatever he's building, it's ugly."
**Beat-you (30%).** The rival reaches the Hall first and is pinned beneath Celosia's Aegislash (Hurt/Captured). Rescue: cross the Hall while the charge builds (3 steps). *Line:* "I thought I could outsmart them. I couldn't."
**Side-with (10%).** *Hook:* a Flare Admin flattered the rival's style and offered them a "creative director" role. *Foreshadow:* (1) the rival wears a crimson ribbon at the Gym; (2) a Grunt calls them "our model"; (3) their Pokémon has a Flare brand.
> **Reveal:** The rival at the Hall: "They said I had taste. No one else ever said that."
> **Turn responses:** [Offer to make something better together] (key for Friendly/Heir) / [Tell them what the weapon will cost] (key for Prodigy/Scholar) / [Challenge them to create something real] (key for Hotshot/Mirror) / [Say you understand] (key for Bitter/Lone Wolf)

### 10.9 Resolution — The Weapon

The weapon's core hovers, dimming. Xerneas (or Yveltal) hangs in the dark above it.

**Choice:**
1. **[Dismantle the weapon]** — The core is taken apart. *Effects:* Peacemaker Emblem; the legendary is freed.
2. **[Return the life-force]** — You open the conduits and let the energy flow back. *Effects:* `legend-xerneas-yveltal` Sighting flag planted; Kalos's wild Pokémon surge with energy for a week.
3. **[Seal Geosenge]** — You seal the chamber. *Effects:* the weapon is lost; Flare's remnants guard the seal.

**Lysandre (if Dismantled):** "Then I am just a man who loved beauty too much."

### 10.10 Stay Out — Offscreen Resolution (Kalos flavor)

The weapon fires at 21:00. Region effects: **Occupation** (Lumiose is dark for a day; rest nodes heal 50%), **Prices +15%**, **the Elite Four** (Malva's broadcast stays on every channel). Flare joins the Region of Doom.

### 10.11 If You Fall (the run ends)

*A climax defeat ends the run. This is the scene and the Doom Ledger entry that close it.*

**Scene.** The screen goes to black. The party is on the floor. The leader speaks last.
> **LYSANDRE:** "Good. Now we can begin. Fire the weapon."
> **BROADCAST (voice-over):** Kalos Television: "…this is Malva. It is beautiful. It is all so very beautiful."

**What happens to the region.** The weapon fires; the chosen are spared. Flare does not rule Kalos; it edits it.
**Rival coda.** The rival's line for this moment is in `CLIMAX_RIVAL_INTEGRATION.md` §13 (by archetype and by the variant that was rolled).
**Impounded Pokémon.** Any still held are not returned. The Doom Ledger records `lost-with-impounded`.
**Doom Ledger entry.** `flare.ended = triumphant`; `run.ended = climax-defeat`. A triumphant team enters the Region of Doom with +1 Doom Level.

## 11. Aftermath

- **If Dismantled:** The Kalos anchor: "The weapon has been disassembled. Team Flare is in custody."
- **If Returned:** "The wild Pokémon of Kalos are unusually active. Scientists call it 'a celebration.'"
- **If Sealed:** "Geosenge is closed to the public. The Kalos Preservation Society says the seal will hold."
- **Doom Ledger entry:** `flare.ended = dismantled | returned | sealed`.

## 12. Art and audio notes

- **Flare:** crimson jumpsuits with white flame hoods; Lysandre in a pressed red suit with a pointed collar; Malva in a black-and-orange anchor suit.
- **Geosenge:** an ancient menhir circle lit from below; a crater in the earth.
- **Music:** an elegant waltz that curdles into a siren; it drops into a single heartbeat under Lysandre.
