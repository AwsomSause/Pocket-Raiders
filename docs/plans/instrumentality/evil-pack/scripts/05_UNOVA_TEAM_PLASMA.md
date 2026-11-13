# 05 — UNOVA: TEAM PLASMA
### Script: *The Frozen Crown*

> *"I told you once that I was setting Pokémon free. I told you a great many things."* — Ghetsis

**Team type:** Order (a movement with a hidden owner) · **Primary team (CANON, RETURNING):** Team Plasma, after N's departure and the Black 2 / White 2 reorganization · **Returning team:** this is it
**Climax:** The Frozen Crown — the Giant Chasm and the Plasma Frigate (Pseudo Region `pr.unova.giant-chasm`)
**Regional hooks:** city environment, rebel-gym chains, `legend-unova-dragons` (`REGIONAL_IDENTITY.md` §3.5)
**Canon note:** Ghetsis, Zinzolin, Colress, the Shadow Triad and the Sages (Rood, Giallo, Gorm, Bronius, Ryoku) are canon characters; N is a canon NPC who is **not** a member in this script. Dialogue, raids and the climax are original and follow Black 2 and White 2. Species are my best recall; verify before shipping.

---

## 1. Profile

| Field | Value |
| --- | --- |
| Template | Order with a hidden owner (Sages → Executives → Grunts) |
| Ideology | Pokémon should be free of trainers; Ghetsis uses the cause to rule |
| Primary objective | Freeze Unova with Kyurem and the Plasma Frigate, then crown Ghetsis |
| Secondary objectives | Revive Genesect; recruit the disillusioned; keep N's loyalists from rejoining |
| Preferred types | Dark, Ice, Poison, Psychic (Cofagrigus, Seismitoad, Eelektross, Drapion, Hydreigon, Weavile, Beartic, Cryogonal) |
| AI personalities | Strategist, Zealot, Gambler |
| Mercy | 0.1 (Ghetsis uses mercy as a tactic) |
| Shadow method | **Liberation Lock**: a "freed" Pokémon is bound to the Frigate's signal and cannot leave |
| Colors / uniform | White and grey knight-style tunics (Ghetsis's loyalists wear dark Neo-Plasma coats) |
| HQ | The Plasma Frigate; Colress's laboratory; Giant Chasm |
| Lifecycle | 4 Major (reorganized) → 5 Dominant at climax |

## 2. Hierarchy and Roster

| Name | Rank | Title | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- |
| **Ghetsis** | Leader (7) | Sage; true leader | Strategist / Zealot | Cofagrigus, Bouffalant, Seismitoad, Eelektross, Drapion, **Hydreigon** (ace); Kyurem as the weapon | Smooth, cruel, patient |
| **Zinzolin** | Second (6) | Sage | Strategist / Zealot | Cryogonal, Beartic, Weavile *(approximate)* | Bitter, ruthless |
| **Colress** | Executive (5) | Plasma Scientist | Scientist | Magneton, Beheeyem, Klinklang *(approximate)* | Eager, detached, curious |
| **Rood** | Executive (5) | Sage | Zealot | (approximate) | Stern |
| **Giallo** | Executive (5) | Sage | Enforcer | (approximate) | Surly |
| **Shadow Triad** | Commander (4) | Operatives | Infiltrator | (battle as three: Bisharp, Drifblim, Golurk; approximate) | Silent, cryptic |
| **Plasma Scientists** | Specialist (2) | "Plasma Researcher" | Scientist | Magnemite, Klink, Elgyem | Detached |
| **Plasma Grunts** | Grunt (1) | "Plasma Grunt" | Enforcer | Patrat, Purrloin, Zubat, Koffing | Hollow, scripted |

> **Org chart:** Ghetsis → Zinzolin → (Colress, Rood, Giallo) → Shadow Triad → Researchers → Grunts. N and his loyalists stand outside it.

## 3. Story Overview

**Logline:** Two years after N's defeat, Team Plasma is back in two pieces: the faithful who care for abandoned Pokémon, and the faction that Ghetsis is using to freeze the region.

**Backstory.** Ghetsis lost N and the throne, but not the Frigate or Kyurem. With Zinzolin and Colress he rebuilt Plasma around a promise of liberation, while N's remaining loyalists quietly sheltered abandoned Pokémon in a house above a gym.

**The twist.** The liberation is a lie that the player has already seen. Ghetsis does not want to free Pokémon; he wants to freeze the region so that no one can leave it. Colress, who believes in progress for its own sake, will bargain either way.

**Climax arc:** Ghetsis activates Kyurem and the DNA Splicers at the Giant Chasm. The player must reach the Chasm, stop the fusion and face a Leader who has already lost once.

## 4. Act 0 — Rumors

- **Ace Trainer:** "A ship has been docked at Undella Bay for weeks. No one gets near it."
- **Researcher:** "That scientist, Colress, keeps asking about a Pokémon called Genesect."
- **Kid in Driftveil:** "There's a house where Plasma people feed abandoned Pokémon. They're nice. I think."
- **Poster in Castelia:** "Pokémon should be free. Join us." (Intel +2: stamped with a P.)
- **Item:** A dropped **Plasma badge** (Intel +2).

## 5. Act I — Ignition

*Trigger: after Gym 1–3. At the Castelia docks, a pair of Plasma Grunts are handing out leaflets while a third shuts the harbor gate.*

**Scene: The Leaflet**

> **ZINZOLIN** *(bitter, on the gangway)*: "Your Pokémon are suffering. You don't see it. We do."
> **ZINZOLIN:** "Team Plasma is the only voice they have left. Will you lend yours?"
> **PLAYER (choice):**
> 1. **"I'd like to listen."** → Zinzolin, startled, offers the Inside Man route. **Sets `plasma.insideman = true`, Heat −25.** *(Raids become infiltration variants.)*
> 2. **"Your plan is a lie."** → Zinzolin: "A familiar accusation." *(Battle: Zinzolin + 2 Grunts; hail environment, announced.)*
> 3. **"Where's N?"** → Zinzolin, curtly: "Gone. A failure. Ask him yourself if you can find him."
> *A Grunt stands over a cage of Pokémon.*
> **GRUNT:** "We're freeing them. Aren't we? The Sage said so."
> **PLAYER (choice):** Intervene (battle) / Ask the Grunt what he sees (Intel +3) / Ignore.
> **ZINZOLIN (defeat):** "Ghetsis will hear this. He will not be pleased."

*Outcome: Team Plasma awake. Heat 20 (28 on battle).*

## 6. Pursuit — Ambush Dialogue

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Plasma Grunt (Scripted) | "Release your Pokémon. They deserve to be free." | "…I'm supposed to say something else." |
| Grunt — Plasma Grunt (Hollow) | "I stopped asking what the Sages mean. It's easier." | "That was hard to listen to." |
| Grunt — Plasma Grunt (Doubtful) | "I joined to help Pokémon. I'm not sure that's what we do." | "Maybe you're right." |
| Specialist — Plasma Researcher (Detached) | "Your Pokémon exhibits unusual attachment. Fascinating." | "Hypothesis revised." |
| Commander — Shadow Triad (Silent) | "…" | "…" |
| Executive — Colress (Eager) | "Your results are interesting. I would like more of them." | "Fascinating! The experiment continues." |
| Executive — Rood (Stern) | "The Sages will not be questioned by a child." | "Then we have much to answer for." |
| Executive — Giallo (Surly) | "Fighting is easy. Believing is hard." | "Ha. I guess neither of us has it figured out." |
| Second — Zinzolin (Bitter) | "I am cold. I am patient. Neither is good for you." | "Cold… and defeated. It happens." |
| Leader — Ghetsis (Smooth, rare) | "You've made a very bad decision. Let me show you how bad." | "…A minor setback." |

## 7. Raid 1 — "The Plasma Frigate"

**Offer (a ferry captain):** *"It's been docked for weeks, but last night its lights came on. Something's loaded."*
**PR:** `pr.unova.plasma-frigate` — 3 decks: Gangway → Hold → Bridge. **Security:** ice patches (slide hazard), deck cannons, Grunt patrols.
**Objectives:** *Primary:* cut the Frigate's engine. *Secondary A:* free the Pokémon in the hold. *Secondary B:* defeat Sage Zinzolin.

**Key scene (Bridge):**
> **ZINZOLIN:** "You have no idea what the Frigate is for."
> *(Battle: Zinzolin, with Cryogonal, Beartic, Weavile, Vanilluxe, Glaceon; Executive Ability: **Frostbite Wave**: once per battle, his first Ice move inflicts Frostbite 30% chance on the target; announced.)*
> **ZINZOLIN (defeat):** "Cold. Always so cold."

**Results (Lever: *The Frigate*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The engine is disabled; the hold is freed | **Frigate crippled:** Phase 3 Frost Relays reduced by 1; the Frigate cannot reach the Chasm in time | −3 |
| **Success** | The engine stalls | Phase 1 −1 battle | −2 |
| **Partial** | The hold is half-freed | No change | −1 |
| **Failure** | The engine roars; you are thrown overboard | **Frigate ready:** +1 Frost Relay; Plasma's Pokémon +5% HP | +2 |
| **Declined** | The Frigate sails | Unchanged | +1 |

**Failure consequences:** **C1 (Impound: "kept in the hold"), C8 (Reputation fall), C11.**

## 8. Raid 2 — "Colress's Laboratory"

**Offer (a researcher defector):** *"Colress revived Genesect. If he finishes, the project goes live."*
**PR:** `pr.unova.genesect-lab` — 4 floors: Lobby → Wards → Incubation → Core. **Security:** laser grids, cryo-cells, Grunt patrols.
**Objectives:** *Primary:* disable the Genesect incubator. *Secondary A:* free the research subjects. *Secondary B:* defeat Executive Colress.

**Key scene (Core):**
> **COLRESS:** "You came all the way here for a Pokémon? I came to understand its power. We want the same thing, different outcome."
> *(Battle: Colress, with Magneton, Beheeyem, Klinklang, Genesect (revived, test), Magnezone; Executive Ability: **Data Collection**: once per battle, he copies the player's last used move; announced.)*
> **COLRESS (defeat):** "Oh. The data is *wonderful*. Thank you."

**Results (Lever: *The Incubator*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The incubator is destroyed; the subjects are free | **No Genesect:** Ghetsis loses his Phase 3 Genesect support | −3 |
| **Success** | The incubator is shut down | Phase 2 −1 duel | −2 |
| **Partial** | The incubator is damaged | No change | −1 |
| **Failure** | The lab seals; Colress's Genesect escapes | **Genesect free:** +1 Frost Relay guard; Colress aids Ghetsis in Phase 4 | +2 |
| **Declined** | The lab keeps running | Unchanged | +1 |

**Failure consequences:** **C4 (Strength surge), C10 (Shadowed), C11.**

## 9. Raid 3 — "The House in Driftveil" *(conditional)*

**Setup:** N's loyalists shelter abandoned Pokémon in a house above the gym; Ghetsis wants them gone. Defend them.
**PR:** `pr.unova.driftveil-house` — 2 floors; **Objectives:** hold the house against Plasma raiders; talk to N's loyalists; defeat the Shadow Triad (Bisharp, Drifblim, Golurk; Trait: **Triple Shade**: the three act as one; once per battle, they get a free extra action; announced).
**Results (Lever: *The Loyalists*):** Triumph: the loyalists rally (Phase 3 timer +3; N joins as a Support NPC in Phase 4); Success: timer +2; Partial: 0; Failure: the house is burned and the loyalists scatter (+1 gauntlet); Declined: unchanged.

## 10. Climax — "The Frozen Crown"

### 10.1 News Report A

*Unova Broadcasting. Anchor: Dmitri Anselm. Chyron: BREAKING — UNOVA FREEZING.*

> **ANCHOR (Dmitri Anselm):** "Good evening. Snow is falling over Castelia City in the middle of summer, and temperatures are dropping across the region."
> **ANCHOR:** "A ship identified as the Plasma Frigate has been seen at the Giant Chasm. Our reporter on the scene says there is a figure standing on its bow."
> *(Camera: snow on neon signs; the Frigate's searchlights on a dark mountain; a shape the size of a building behind the clouds.)*
> **FIELD REPORTER:** "Ghetsis has announced a plan to 'free Unova.' Experts say the plan involves a Pokémon called Kyurem."
> *[Raid recap]* "Earlier, a trainer crippled the Frigate…" / "The Genesect lab was partly shut down…" / "The Driftveil intervention failed."
> *(Freeze: the player at the Chasm gate.)* **Choice: [Take them on] / [Stay out of it]**

### 10.2 News Report B (rival beat you there)

> **ANCHOR:** "…a young trainer in {rivalOutfitTag}, with a {rivalAceType}-type Pokémon, was seen entering the Giant Chasm ahead of the League. Contact was lost on the ice."
> **CHYRON:** `TRAINER INSIDE THE GIANT CHASM — STATUS UNKNOWN`

### 10.3 The Choice
**[Take them on]** → `PS-CLIMAX`. **[Stay out of it]** → Offscreen Resolution.
**[Stand with them]** → `PS-CLIMAX-ALLIED` *(shown only if eligible: `plasma.insideman` set, reputation ≥ +45, not betrayed, no prior Turn; see `docs/STAND_WITH_THEM.md` and `scripts/10_STAND_WITH_THEM.md` §5)*.

### 10.4 Phase 1 — The Approach (Gauntlet)

*Giant Chasm to the Frigate's ice-bridge. Gauntlet battles: 3 + round(OS/2), clamp 4–7.*

| Area | Trainer | Notes |
| --- | --- | --- |
| Chasm edge | Plasma Grunts ×2 | Dark/Poison; hail environment (Ice +10% both) |
| Ice bridge | Plasma Researchers ×2 | Psychic/Steel; Frost field |
| Frigate deck | Sage Giallo | Fighting/Dark; Trait: **Believer's Fist** |
| Frigate deck | Sage Rood | Psychic/Dark; Trait: **Sage's Command** |
| Bridge | Shadow Triad | Trait: **Triple Shade** |

**Dialogue:**
> **GIALLO:** "I used to believe. Then I got tired. Neither is the same as being right."
> **GIALLO (defeat):** "Go on. The Chasm doesn't care about us."

### 10.5 Phase 2 — The Sage and the Scientist

**Duel 1 — Zinzolin** (as in Raid 1.)
> **ZINZOLIN:** "You've come this far. That alone will cost you."
> **ZINZOLIN (defeat):** "Then Ghetsis is alone. As he wished."

**Duel 2 — Colress** (as in Raid 2.)
> **COLRESS:** "I'll simply watch what happens next. Do continue."
> **COLRESS (defeat):** "…It's rude of you to win. I'm fascinated."

### 10.6 Phase 3 — The Set Piece: The Frost Relays

*The Chasm's ice cracks. Kyurem stirs beneath the Frigate; the DNA Splicers hum.*

**Objective:** Break the **Frost Relays** (2–4 depending on Levers). Each is a battle on the ice, and the **hail** thickens every 3 turns: each tier boosts Ice moves by 10% for **both sides** and reduces Accuracy by 5% (caps respected).

**Broadcast (PA):**
> **GHETSIS (voice):** "Pokémon, you are free! Trainers, you are not!"

**Complication:** If Driftveil was lost (no Raid 3 Success), the Splicers are already half-loaded and a Fusion Echo joins the final Relay (one extra battle).

### 10.7 Phase 4 — Ghetsis

*The Frigate's bow, snow pouring around him, Kyurem rearing behind.* **Team:** Cofagrigus, Bouffalant, Seismitoad, Eelektross, Drapion, **Hydreigon** (ace). **Doctrine: The Liberator's Lie**: the first time the player's Pokémon faints each battle, Ghetsis's ace gains +1 to its highest attacking stat (announced). **Boss phase:** at 50% ace HP, **Fusion**: Kyurem (fused) enters as a second ace; its first move fires with a Fusion Flare/Bolt of the player's weaker type (announced).

> **GHETSIS:** "You have been such a help to me. You have shown me exactly what to do."
> **PLAYER:** "You never wanted to free Pokémon."
> **GHETSIS:** "No. I wanted to be the only one who could."
> *(Battle.)*
> **GHETSIS (mid):** "Closer! Show me you can!"
> **GHETSIS (defeat):** "No! I do not lose! I *do not*… lose."

### 10.8 Rival variants (Unova)

**Help (60%).** The rival crosses the ice with a borrowed sled, takes the Chasm edge (Phase 1 −1) and holds a Frost Relay in Phase 3. *Line:* "This is the same man. I'm not letting him do it twice."
**Beat-you (30%).** The rival reaches the Frigate deck first and is frozen against a pylon (Hurt/Captured). Rescue: cross the deck while the hail thickens (3 steps). *Line:* "He said he was setting them free. I believed him for a second."
**Side-with (10%).** *Hook:* the rival believed the liberation promise and joined Plasma at Ignition to "help the Pokémon." *Foreshadow:* (1) the rival wears a Plasma pin at the Gym; (2) a Grunt calls them "friend of the Sages"; (3) their Pokémon has a Frigate scar.
> **Reveal:** The rival at the Frigate deck: "It sounded right. I didn't ask who it was right *for*."
> **Turn responses:** [Offer to free them properly together] (key for Friendly/Heir) / [Tell them what the Frigate holds] (key for Prodigy/Scholar) / [Challenge them to decide for themselves] (key for Hotshot/Mirror) / [Say you understand] (key for Bitter/Lone Wolf)

### 10.9 Resolution — The Splicers

The DNA Splicers hang over the ice, a dragon's silhouette half-formed beneath them.

**Choice:**
1. **[Free the dragon]** — You break the Splicers; Kyurem is released. *Effects:* Peacemaker Emblem; `legend-unova-dragons` Sighting flag planted.
2. **[Seal the Chasm]** — You seal Kyurem back in the ice. *Effects:* Unova's snow melts; Plasma's Frigate is stranded.
3. **[Hand the Splicers to N]** — N takes the Splicers and walks away. *Effects:* a later event: N returns with Reshiram or Zekrom; Plasma disbands.

**Ghetsis (if Freed):** "Liberated, you say? Oh, that's rich."

### 10.10 Stay Out — Offscreen Resolution (Unova flavor)

Kyurem fuses and the region freezes for a week. Region effects: **Occupation** (Castelia and Icirrus are snowbound; rest nodes heal 50%), **Prices +15%**, **the Frigate** (Plasma remnants gain a second hull). Plasma joins the Region of Doom.

### 10.11 If You Fall (the run ends)

*A climax defeat ends the run. This is the scene and the Doom Ledger entry that close it.*

**Scene.** The screen goes to black. The party is on the floor. The leader speaks last.
> **GHETSIS:** "Freeze it all. Quietly. Let them find out by morning."
> **BROADCAST (voice-over):** Unova Broadcasting: "The temperature is minus forty. This is… this is our final broadcast."

**What happens to the region.** The Frigate freezes Unova. Ghetsis does not rule; he takes the title of the last man standing.
**Rival coda.** The rival's line for this moment is in `CLIMAX_RIVAL_INTEGRATION.md` §13 (by archetype and by the variant that was rolled).
**Impounded Pokémon.** Any still held are not returned. The Doom Ledger records `lost-with-impounded`.
**Doom Ledger entry.** `plasma.ended = triumphant`; `run.ended = climax-defeat`. A triumphant team enters the Region of Doom with +1 Doom Level.

## 11. Aftermath

- **If Freed:** Dmitri Anselm: "The snow has stopped. The Giant Chasm is quiet again."
- **If Sealed:** "Kyurem has been sealed. The Frigate is in custody."
- **If N:** "N was seen leaving the Chasm with an unidentified object. Plasma has announced its dissolution."
- **Doom Ledger entry:** `plasma.ended = freed | sealed | disbanded`.

## 12. Art and audio notes

- **Plasma:** grey-and-white knight tunics, a P on the chest; Ghetsis in a tall hat with a cape; Zinzolin in a dark fur-trimmed robe.
- **Giant Chasm:** an ice-walled crater with a shipwreck of a Frigate balanced across it.
- **Music:** a hymn that slowly decays into feedback; Ghetsis's laugh under every line.
