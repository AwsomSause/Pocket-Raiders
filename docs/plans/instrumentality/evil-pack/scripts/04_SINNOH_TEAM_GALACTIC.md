# 04 — SINNOH: TEAM GALACTIC
### Script: *The Spear Pillar*

> *"Emotion is a defect. A world without it is a world without waste."* — Cyrus

**Team type:** Paramilitary (a corporation that became a creed) · **Primary team (CANON):** Team Galactic · **Returning team:** none
**Climax:** The Spear Pillar — the summit of Mt. Coronet (Pseudo Region `pr.sinnoh.spear-pillar`)
**Regional hooks:** snow and ruins, `legend-time-space-trial`, tomb/glacier nodes (`REGIONAL_IDENTITY.md` §3.4)
**Canon note:** Cyrus, Mars, Jupiter, Saturn and Charon are canon characters; their dialogue and the raids are original and follow Diamond, Pearl and Platinum (Valley Windworks, the Galactic Building in Eterna, the three lakes, Veilstone, the Spear Pillar). Species are my best recall; verify before shipping.

---

## 1. Profile

| Field | Value |
| --- | --- |
| Template | Paramilitary (Leader → Commanders → Scientists → Grunts) |
| Ideology | Emotion causes conflict; a mind without it would end suffering. The universe is to be remade |
| Primary objective | Use the Red Chain on Dialga and Palkia at the Spear Pillar to unmake and remake the world |
| Secondary objectives | Drain the three lakes' guardians; run Valley Windworks as a power source; build the Galactic Building as a command hub |
| Preferred types | Poison, Dark, Normal, Psychic (Purugly, Skuntank, Toxicroak, Golbat, Honchkrow) |
| AI personalities | Strategist, Zealot, Brawler |
| Mercy | 0.1 (Cyrus does not forgive; he deletes) |
| Shadow method | **Red Chain Lock**: a Galactic-engineered chain that bends a Pokémon's will to a single hand |
| Colors / uniform | Silver-white bodysuits, bowl haircuts, a G on the chest |
| HQ | Veilstone Building; the Galactic Eterna Building; Spear Pillar |
| Lifecycle | 3 Established → 5 Dominant at climax |

## 2. Hierarchy and Roster

| Name | Rank | Title | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- |
| **Cyrus** | Leader (7) | Boss | Strategist / Zealot | Sneasel line, Golbat line, **Honchkrow** (ace), Gyarados *(DPPt)* | Cold, quiet, absolute |
| **Saturn** | Second (6) | Commander | Strategist / Enforcer | Kadabra, Bronzor, Toxicroak *(approximate)* | Stern, proud, loyal |
| **Charon** | Executive (5) | Galactic Scientist | Scientist / Technician | Houndoom, Weezing *(approximate)* | Soft-spoken, calculating |
| **Mars** | Commander (4) | Galactic Commander | Enforcer | Purugly, Golbat *(approximate)* | Fierce, fanatical |
| **Jupiter** | Commander (4) | Galactic Commander | Enforcer | Skuntank, Golbat *(approximate)* | Cold, cutting |
| **Galactic Scientists** | Specialist (2) | "Galactic Researcher" | Scientist | Magnemite, Koffing, Zubat | Detached |
| **Galactic Grunts** | Grunt (1) | "Galactic Grunt" | Enforcer | Zubat, Stunky, Glameow, Koffing, Murkrow | Disciplined, hollow |

> **Org chart:** Cyrus → Saturn → (Charon) → (Mars, Jupiter) → Researchers → Grunts.

## 3. Story Overview

**Logline:** A silent leader is rebuilding the universe, and he has the chain to do it. He needs three lakes' guardians, one power plant, and the summit of the oldest mountain in Sinnoh.

**Backstory.** Galactic began as a respectable company in Veilstone, selling energy. Cyrus rewrote its charter: the company's purpose was to dissolve emotion. He built a hierarchy that valued silence, a Building to hide in and a chain to hold the legends.

**The twist.** Cyrus doesn't want to rule the new universe. He wants to be absent from it. The Spear Pillar is not a throne; it is an exit.

**Climax arc:** At dawn the Chain closes on Dialga and Palkia at the Spear Pillar. The player must climb, break the Chain, face the Commanders and stop the Boss before the world is unmade.

## 4. Act 0 — Rumors

- **Hiker:** "The windmills at Valley Windworks haven't turned in weeks. Men in silver are working there."
- **Villager (Eterna):** "That new building in town is very tall and very quiet."
- **TV broadcaster:** "…and in power news, a company called Galactic has announced a new reactor."
- **Poster in Veilstone:** "A future without conflict. Galactic." (Intel +2: stamped with a G.)
- **Item:** A dropped **Galactic badge** (Intel +2).

## 5. Act I — Ignition

*Trigger: after Gym 1–3. At the Valley Windworks, a silver-suited woman is dismantling a windmill's control panel.*

**Scene: The Windworks**

> **MARS** *(fierce, with a Purugly at her side)*: "This power plant is ours. Run along, little trainer."
> **MARS:** "Team Galactic has need of this energy. You wouldn't understand."
> **PLAYER (choice):**
> 1. **"I'd like to help."** → Mars sizes the player up. "Cyrus says to welcome those who pay attention." **Sets `galactic.insideman = true`, Heat −25.** *(Raids become infiltration variants.)*
> 2. **"Leave the Windworks."** → Mars: "Make me." *(Battle: Mars + 2 Grunts; sunset environment.)*
> 3. **"I'll tell the police."** → Mars: "Tell them. They already work for us." *(Heat +0; Mars remembers your face.)*
> *The Windworks hums; a Grunt tends a dismantled generator.*
> **GRUNT:** "I'm just doing what Cyrus says. He says it's for the best."
> **PLAYER (choice):** Intervene (battle) / Ask the Grunt what he believes (Intel +3) / Ignore.
> **MARS (defeat):** "Cyrus will hear of this. And he will be disappointed in me. That is worse than you could ever be."

*Outcome: Team Galactic awake. Heat 20 (28 on battle).*

## 6. Pursuit — Ambush Dialogue

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Galactic Grunt (Disciplined) | "Cyrus requests your Pokémon. Please comply." | "Please… forgive me." |
| Grunt — Galactic Grunt (Hollow) | "I don't feel anything. That's what Cyrus promises." | "I felt that. Is that bad?" |
| Grunt — Galactic Grunt (Nervous) | "I'm just supposed to hold the line." | "Don't tell Mars." |
| Specialist — Galactic Researcher (Detached) | "Your Pokémon will make a good data point." | "Data: skewed. I'll start again." |
| Commander — Mars (Fierce) | "Cyrus is the world's only hope. I'll prove it." | "Not… not enough. I'll try again." |
| Commander — Jupiter (Cold) | "I will make this quick. Cyrus dislikes noise." | "That was unexpected. Do not repeat it." |
| Commander — Saturn (Stern) | "You are in the way of the Boss. That cannot continue." | "Then I will carry the shame myself." |
| Executive — Charon (Soft) | "Be calm. This will be over quickly." | "Fascinating. I'll need to rethink my approach." |
| Executive — Charon (Calculating) | "Your Pokémon's data is… interesting. I will keep it." | "Then it was all for nothing." |
| Leader — Cyrus (Cold, rare) | "You have chosen suffering. That is regrettable." | "Then you are the variable I did not count." |

## 7. Raid 1 — "Valley Windworks"

**Offer (a power plant engineer, by radio):** *"They've taken the control room and shut off half the region. Get the panel back."*
**PR:** `pr.sinnoh.valley-windworks` — 3 levels: Intake → Turbine Hall → Control Room. **Security:** wind hazard, rotating blades, Grunt patrols.
**Objectives:** *Primary:* restore the control panel and reopen the turbines. *Secondary A:* free the engineers. *Secondary B:* defeat Commander Mars.

**Key scene (Control Room):**
> **MARS:** "You don't get to ruin this. Not after everything I've given."
> *(Battle: Mars, with Purugly, Golbat, Houndour, Stunky, Murkrow; Trait: **Fierce Loyalty**: once per battle, after her Pokémon faints, the next gets +1 Attack; announced.)*
> **MARS (defeat):** "…For Cyrus. For the dream."

**Results (Lever: *The Turbines*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The turbines turn; the region's power returns | **Power limited:** Galactic's Phase 3 Red Chain surge is weaker (−1 Chain) | −3 |
| **Success** | The control room is retaken | Phase 1 −1 battle | −2 |
| **Partial** | Half the turbines run | No change | −1 |
| **Failure** | Mars locks the room; the turbines stay stopped | **Power drawn:** +1 Chain; Galactic's Pokémon +5% HP | +2 |
| **Declined** | The Windworks stay dark | Unchanged | +1 |

**Failure consequences:** **C2 (Fine / Shakedown), C7 (Occupation), C11.**

## 8. Raid 2 — "The Galactic Building"

**Offer (a Veilstone informant):** *"Eterna's Galactic Building is where they plan everything. Find the command room."*
**PR:** `pr.sinnoh.eterna-building` — 4 floors: Lobby → Offices → Lab → Command Room. **Security:** warp panels, security cameras, laser doors.
**Objectives:** *Primary:* steal the Red Chain schematics. *Secondary A:* rescue captured Pokémon. *Secondary B:* defeat Commander Jupiter.

**Key scene (Command Room):**
> **JUPITER:** "I have been watching you for three floors. I am not impressed."
> *(Battle: Jupiter, with Skuntank, Golbat, Stunky, Murkrow, Purugly; Executive Ability: **Stench Cloud**: once per battle, her first status move cannot miss and lasts one extra turn; announced.)*
> **JUPITER (defeat):** "…Cyrus will be told."

**Results (Lever: *The Schematics*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The schematics are burned; the Building's lock is cracked | **Chain unfinished:** Phase 3 has 2 Red Chains, Cyrus's ace loses 5% HP | −3 |
| **Success** | Half the schematics are taken | 3 Red Chains | −2 |
| **Partial** | Some pages are lost | 3 Red Chains, 3-turn pulses | −1 |
| **Failure** | The alarm sounds; you are thrown out | **Chain complete:** 4 Red Chains, 2-turn pulses; Galactic +10% damage | +2 |
| **Declined** | The Building keeps its secrets | Unchanged | +1 |

**Failure consequences:** **C1 (Impound: "kept in the Building"), C9 (Gym lockdown), C11.**

## 9. Raid 3 — "Lake Valor" *(conditional)*

**Setup:** At Lake Valor a Galactic Bomb is rigged to force the lake guardian into submission. Disarm it and the Chain loses one of its three anchors.
**PR:** `pr.sinnoh.lake-valor` — 2 floors; **Objectives:** disarm the bomb; free the guardian; defeat Saturn (Kadabra, Bronzor, Toxicroak, Alakazam; Trait: **Cold Command**: his first Pokémon's Psychic moves hit +15%; announced).
**Results (Lever: *The Guardians*):** Triumph: the guardians go free (Phase 3 timer +3; Cyrus loses a Pokémon); Success: timer +2; Partial: 0; Failure: the bomb goes off and the Chain strengthens (+1 gauntlet); Declined: unchanged.

## 10. Climax — "The Spear Pillar"

### 10.1 News Report A

*Sinnoh Broadcasting. Anchor: Hana Brandt. Chyron: BREAKING — SPEAR PILLAR: THE SKY TEARS.*

> **ANCHOR (Hana Brandt):** "Good evening. The sky above Mt. Coronet is splitting. Witnesses on the slopes report two enormous shapes in the clouds."
> **ANCHOR:** "A group in silver uniforms, Team Galactic, has been seen at the Spear Pillar summit. Their leader has announced a plan to 'remake the universe.'"
> *(Camera: snow whipping; the sky folding like paper; a distant, steady light.)*
> **FIELD REPORTER (shouting over wind):** "Police have lost radio contact. The summit is closed to all."
> *[Raid recap]* "Earlier, a trainer restored the Windworks…" / "The Galactic Building was partly infiltrated…" / "The Lake Valor intervention failed."
> *(Freeze: the player at the mountain foot.)* **Choice: [Take them on] / [Stay out of it]**

### 10.2 News Report B (rival beat you there)

> **ANCHOR:** "…a young trainer in {rivalOutfitTag}, with a {rivalAceType}-type Pokémon, was seen climbing the east face of Mt. Coronet ahead of the Rangers. Contact was lost near the summit."
> **CHYRON:** `TRAINER NEAR SPEAR PILLAR — STATUS UNKNOWN`

### 10.3 The Choice
**[Take them on]** → `PS-CLIMAX`. **[Stay out of it]** → Offscreen Resolution.
**[Stand with them]** → `PS-CLIMAX-ALLIED` *(shown only if eligible: `galactic.insideman` set, reputation ≥ +45, not betrayed, no prior Turn; see `docs/STAND_WITH_THEM.md` and `scripts/10_STAND_WITH_THEM.md` §4)*.

### 10.4 Phase 1 — The Ascent (Gauntlet)

*Blizzard environment (Ice +10% both sides; weather cap respected). Gauntlet battles: 3 + round(OS/2), clamp 4–7.*

| Landing | Trainer | Notes |
| --- | --- | --- |
| Foot | Galactic Grunts ×2 | Poison/Dark; whiteout (accuracy −5% both) |
| Ridge | Galactic Researchers ×2 | Electric/Steel; 1 gadget each |
| Saddle | Commander Mars | Fire/Poison; Trait: **Fierce Loyalty** |
| Col | Commander Jupiter | Poison/Dark; Trait: **Stench Cloud** |
| Summit stair | Saturn | Psychic/Poison; Trait: **Cold Command** |

**Dialogue:**
> **SATURN:** "The Boss's hand will be steadier if it does not have to hold you off."
> **SATURN (defeat):** "…I'll hold the stair a little longer."

### 10.5 Phase 2 — The Scientist and the Commanders

**Duel 1 — Charon** (Houndoom, Weezing, Murkrow, Golbat, Muk; Executive Ability: **Red Chain Prototype**: once per battle, he links two of his Pokémon so a stat change on one applies to both; announced.)
> **CHARON:** "You've come far. Please don't touch the apparatus."
> **CHARON (defeat):** "A pity. The apparatus is the least of it."

**Duel 2 — Mars and Jupiter together** (Double Battle; Trait: **Commander Link**: when one faints, the other gets +1 Speed; announced.)

### 10.6 Phase 3 — The Set Piece: The Red Chain

*The Spear Pillar's disc glows. Dialga and Palkia, chained above, strain against the light.*

**Objective:** Break the **Red Chains** (2–4 depending on Levers). Each is a battle at a pillar while **space and time warp**: every 3 turns the field flips (Trick Room ↔ Gravity, announced one turn ahead).

**Broadcast (PA):**
> **CYRUS (voice):** "I'm not here to rule a world. I'm here to end the need for one."

**Complication:** If the Lake Valor bomb went off (no Raid 3 Success), a Chain-bound Lake Guardian joins the final Chain fight (one extra battle).

### 10.7 Phase 4 — Cyrus

*The Pillar's center, the Chain taut above him.* **Team:** Sneasel line (Weavile), Golbat line (Crobat), Gyarados, **Honchkrow** (ace). **Doctrine: Cold Calculus**: the first stat boost the player makes in each battle is mirrored to Cyrus's active Pokémon (announced). **Boss phase:** at 50% ace HP, **The Chain Tightens**: Dialga and Palkia pulse; both sides' Speed is reversed for 3 turns (Trick Room, announced).

> **CYRUS:** "You think emotion is a gift. I think it's the original sin."
> **PLAYER:** "People need it."
> **CYRUS:** "People have always needed what hurt them."
> *(Battle.)*
> **CYRUS (mid):** "Come on. Show me something I haven't counted."
> **CYRUS (defeat):** "Then it was not enough. I will go where there is nothing to count."

### 10.8 Rival variants (Sinnoh)

**Help (60%).** The rival climbs the east face, takes the Ridge (Phase 1 −1) and holds a Chain pillar in Phase 3. *Line:* "I'd rather feel something than nothing. Let's go."
**Beat-you (30%).** The rival reaches the Saddle first and is pinned under Mars's Purugly (Hurt/Captured). Rescue: cross the whiteout while the ground tilts (3 steps). *Line:* "I thought I could outrun the storm. I couldn't."
**Side-with (10%).** *Hook:* a Galactic Grunt offered the rival a way to "stop feeling afraid," and the rival said yes. *Foreshadow:* (1) the rival speaks in a flatter tone at the Gym; (2) a Grunt says "Good morning, comrade"; (3) their Pokémon has a Chain scar.
> **Reveal:** The rival at the Col: "I just wanted to stop being scared. Do you know how long I've been scared?"
> **Turn responses:** [Offer to stay scared together] (key for Friendly/Heir) / [Tell them what the Chain does] (key for Prodigy/Scholar) / [Challenge them to be afraid and go anyway] (key for Hotshot/Mirror) / [Say you understand] (key for Bitter/Lone Wolf)

### 10.9 Resolution — The Distortion

Cyrus staggers; the Chain flares; a black rift opens beneath the Pillar.

**Choice:**
1. **[Break the Chain]** — Dialga and Palkia are freed. *Effects:* Peacemaker Emblem; `legend-time-space-trial` resolved.
2. **[Seal the Pillar]** — You seal the Pillar's disc. *Effects:* Time and space stabilize; Cyrus is left on the Pillar.
3. **[Let Giratina take him]** — The rift closes around Cyrus. *Effects:* Cyrus is gone; Galactic ends as an organization; a later event: his name appears on a broadcast.

**Cyrus (if Chain broken):** "Then I have nothing. Good. That is what I wanted."

### 10.10 Stay Out — Offscreen Resolution (Sinnoh flavor)

The Chain closes; the sky tears for an hour and the Pillar goes quiet. Region effects: **Occupation** (Mt. Coronet is sealed; rest nodes heal 50%), **Prices +15%**, **the Chain** (Galactic gains a prototype for a second attempt). Galactic remnants join the Region of Doom.

### 10.11 If You Fall (the run ends)

*A climax defeat ends the run. This is the scene and the Doom Ledger entry that close it.*

**Scene.** The screen goes to black. The party is on the floor. The leader speaks last.
> **CYRUS:** "Remake it. All of it. Begin."
> **BROADCAST (voice-over):** Sinnoh Broadcasting: "The sky has closed. There is nothing more to report."

**What happens to the region.** The world is remade without feeling. Galactic does not rule; it ends the need for rule.
**Rival coda.** The rival's line for this moment is in `CLIMAX_RIVAL_INTEGRATION.md` §13 (by archetype and by the variant that was rolled).
**Impounded Pokémon.** Any still held are not returned. The Doom Ledger records `lost-with-impounded`.
**Doom Ledger entry.** `galactic.ended = triumphant`; `run.ended = climax-defeat`. A triumphant team enters the Region of Doom with +1 Doom Level.

## 11. Aftermath

- **If Chain broken:** Hana Brandt: "The sky is clear. Dialga and Palkia have gone."
- **If Sealed:** "The Spear Pillar is closed. Scholars say it will be many years before it opens."
- **If Giratina:** "Cyrus has not been seen. Galactic's buildings are empty."
- **Doom Ledger entry:** `galactic.ended = broken | sealed | consumed`.

## 12. Art and audio notes

- **Galactic:** silver-white bodysuits with a blue-silver bowl haircut; Cyrus in a long coat with a stiff collar.
- **Spear Pillar:** a circular stone dais at the mountain's peak; the sky distorts into folded geometry.
- **Music:** a cold electronic pulse; a lone piano under Cyrus's lines; it flips backwards when the field inverts.
