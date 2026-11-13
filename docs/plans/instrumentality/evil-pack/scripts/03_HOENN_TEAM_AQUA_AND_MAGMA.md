# 03 — HOENN: TEAM AQUA AND TEAM MAGMA
### Script: *The Awakening*

> *"Two tides pull on the same shore. Whichever drowns the other, the shore changes."* — Archie

**Team type:** Company-style cult (Aqua) and Corporation-style cult (Magma) · **Primary team (CANON):** Team Aqua · **Second team (CANON):** Team Magma · **Returning team:** none
**Climax:** The Awakening — the Cave of Origin, Sootopolis City (Pseudo Region `pr.hoenn.cave-of-origin`)
**Regional hooks:** weather swing, ocean/beach/tide nodes, `legend-weather-crisis` (`REGIONAL_IDENTITY.md` §3.3)
**Canon note:** Archie, Maxie, Matt, Shelly, Tabitha and Courtney are canon characters; their dialogue and the raids are original and follow Emerald and Omega Ruby / Alpha Sapphire. Species are my best recall; verify before shipping. **Which team recruits you:** at Ignition the game seeds Aqua or Magma as the team that finds the player (50/50, `rng(hash(runSeed + 'hoenn-ignition'))`); the other is the second team and enters at Raid 2.

---

## 1. Profile

| Field | Team Aqua | Team Magma |
| --- | --- | --- |
| Template | Company (Leader → Admins → Grunts) | Corporation (Leader → Admins → Grunts) |
| Ideology | Pokémon deserve the sea; humanity has taken too much land | Humanity deserves more land; the sea has taken too much |
| Primary objective | Awaken Kyogre with the Blue Orb and flood the world | Awaken Groudon with the Red Orb and widen the land |
| Secondary objectives | Steal Slateport's submarine; seize the Weather Institute | Steal the Mt. Chimney meteorite; seize the Space Center |
| Preferred types | Water, Dark, Poison (Mightyena, Sharpedo, Crobat, Carvanha) | Fire, Ground, Dark (Mightyena, Camerupt, Numel, Zubat) |
| AI personalities | Strategist, Zealot | Strategist, Zealot |
| Mercy | 0.4 (Archie respects those who face the sea) | 0.3 (Maxie respects those who face the fire) |
| Shadow method | **Orb Resonance**: the Blue Orb binds sea Pokémon to the tide | **Orb Resonance**: the Red Orb binds land Pokémon to the heat |
| Colors / uniform | Navy bandanas, white stripes, anchor badges | Red hoodies with horns, flame badges |
| HQ | Lilycove Hideout; the stolen submarine | Lilycove Hideout (Magma); Jagged Pass |
| Lifecycle | 3 Established → 5 Dominant at climax | 3 Established → 5 Dominant at climax |

## 2. Hierarchy and Roster

### 2.1 Team Aqua

| Name | Rank | Title | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- |
| **Archie** | Leader (7) | Team Aqua Leader | Zealot / Strategist | Mightyena, Crobat, **Sharpedo** (ace) *(Emerald)* | Gruff, warm, dangerous |
| **Matt** | Executive (5) | Aqua Admin | Enforcer | Mightyena, Golbat, Sharpedo *(approximate)* | Brash, fearless |
| **Shelly** | Executive (5) | Aqua Admin | Technician | Mightyena, Sharpedo *(approximate)* | Sharp, snide |
| **Aqua Scientists** | Specialist (2) | "Aqua Researcher" | Scientist | Carvanha, Wailmer, Zubat | Eager |
| **Aqua Grunts** | Grunt (1) | "Aqua Grunt" | Enforcer | Zubat, Poochyena, Carvanha, Wailmer | Tough, loud |

### 2.2 Team Magma

| Name | Rank | Title | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- |
| **Maxie** | Leader (7) | Team Magma Leader | Zealot / Strategist | Mightyena, Crobat, **Camerupt** (ace) *(Emerald)* | Cold, composed, certain |
| **Tabitha** | Executive (5) | Magma Admin | Enforcer | Mightyena, Numel, Camerupt *(approximate)* | Gruff, devoted |
| **Courtney** | Executive (5) | Magma Admin | Scientist / Technician | Numel, Mightyena, Camerupt *(approximate)* | Eerily calm, mechanical |
| **Magma Scientists** | Specialist (2) | "Magma Researcher" | Scientist | Numel, Koffing, Zubat | Detached |
| **Magma Grunts** | Grunt (1) | "Magma Grunt" | Enforcer | Poochyena, Zubat, Numel, Baltoy | Tough, quick-tempered |

> **Org chart:** Archie → (Matt, Shelly) → Aqua Researchers → Aqua Grunts. Maxie → (Tabitha, Courtney) → Magma Researchers → Magma Grunts. **Jessie, James and Meowth** (script 00) appear as a third, unaligned presence.

## 3. Story Overview

**Logline:** Two cults want to wake the same two titans for opposite reasons. The player is stuck between them, and Sootopolis is where they collide.

**Backstory.** Aqua began as a marine-conservation group and became a creed. Magma began as a land-reclamation group and became a creed. Both found the Orbs, both found the legends, and both think the other is the end of the world.

**The twist.** Neither team can win. Whichever wakes its titan first calls the other, and the Cave of Origin cannot hold both. The leaders realize it in the moment it is too late; the player decides what happens after.

**Climax arc:** The Orbs resonate in the Cave of Origin. Primal Kyogre and Groudon rise at once. The player must keep both Orbs from being fully awakened, defeat the two leaders and choose what to do with the Orbs.

## 4. Act 0 — Rumors

- **Fisherman:** "There's a submarine missing from Slateport. Nobody saw it leave."
- **Hiker:** "Mt. Chimney's crater has a hole in it. Someone's been blasting."
- **TV weatherman:** "Unusual swell near Lilycove. The Coast Guard is looking into it."
- **Poster in Mauville:** "Join the cause. Choose your side." (Intel +2: two stamps, a blue anchor and a red flame.)
- **Item:** A dropped **Orb fragment** (Intel +2).

## 5. Act I — Ignition

*Trigger: after Gym 1–3. The seeded team appears; the other is mentioned in the same conversation.*

**Scene (Aqua seed): The Submarine**

> **MATT** *(grinning, on the Slateport pier)*: "Don't stare at the sub. That's rude."
> **MATT:** "Team Aqua. We're protecting the sea. Someone has to."
> **PLAYER (choice):**
> 1. **"I'd like to help."** → Matt offers the Inside Man route. **Sets `aqua.insideman = true`, Heat −25.** *(Raids become infiltration variants.)*
> 2. **"Give the sub back."** → Matt laughs. *(Battle: Matt + 2 Grunts; Rain environment, announced.)*
> 3. **"Who's the other team?"** → Matt, bristling: "Magma. They want the opposite of everything. Don't talk to them."

**Scene (Magma seed): The Meteorite**

> **TABITHA** *(gruff, at the Chimney cable car)*: "Move along. Meteorites are not for tourists."
> **TABITHA:** "Team Magma. We're making more world. Not everyone's brave enough to want that."
> **PLAYER (choice):**
> 1. **"I'd like to help."** → Tabitha offers the Inside Man route. **Sets `magma.insideman = true`, Heat −25.** *(Raids become infiltration variants.)*
> 2. **"Give the meteorite back."** → Tabitha: "Make me." *(Battle: Tabitha + 2 Grunts; Harsh Sun environment, announced.)*
> 3. **"Who's the other team?"** → Tabitha, flatly: "Aqua. They want to drown the lot of us."

> **ARCHIE / MAXIE (defeat of Matt or Tabitha):** "Hmph. Well fought. We'll meet again."

*Outcome: both teams awake. Heat 20 (28 on battle).*

## 6. Pursuit — Ambush Dialogue

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Aqua Grunt (Loud) | "The sea doesn't need your permission!" | "The sea… needs a better lawyer." |
| Grunt — Aqua Grunt (Nervous) | "We're not supposed to fight on land. I'm trying." | "I swear it's a trick." |
| Grunt — Magma Grunt (Hot-headed) | "Burn it all down! …Not you. Probably." | "You're hot stuff, I'll give you that." |
| Grunt — Magma Grunt (Tough) | "Magma's making more land. Step aside." | "Land… got a little smaller today." |
| Specialist — Aqua Researcher (Eager) | "I've catalogued your Pokémon. They're excellent test subjects." | "Okay. New data. Not good data." |
| Specialist — Magma Researcher (Detached) | "I calculate a 14% chance of your success. Proceed." | "Recalculating." |
| Executive — Matt (Brash) | "Team Aqua doesn't lose to kids. Today we won't start." | "Gah! Archie won't be happy." |
| Executive — Shelly (Snide) | "You think you're special? Everyone does." | "Ha. You are special. I hate that." |
| Executive — Tabitha (Gruff) | "I don't talk. I burn. Hold still." | "Tch. Not hot enough." |
| Executive — Courtney (Calm) | "Target acquired. Beginning analysis." | "Analysis: unexpected. Deviation noted." |

## 7. Raid 1 — "Mt. Chimney Meteorite"

**Offer (a Weather Institute scientist):** *"They've dug out the meteorite and they're rigging it to the crater. If it goes in, the volcano goes up."*
**PR:** `pr.hoenn.mt-chimney` — 3 levels: Cable Car → Crater Rim → Caldera. **Security:** lava tiles (heat hazard), falling ash, hidden Grunts.
**Objectives:** *Primary:* stop the meteorite from entering the crater. *Secondary A:* save the scientist. *Secondary B:* defeat Admin Tabitha.

**Key scene (Caldera):**
> **TABITHA:** "Maxie sent me. He said you'd be here. He was right."
> *(Battle: Tabitha, with Mightyena, Numel, Camerupt, Zubat, Poochyena; Executive Ability: **Magma Surge**: once per battle, his active Pokémon's Fire moves hit +20% for 2 turns; announced.)*
> **TABITHA (defeat):** "I'm sorry, Maxie."

**Results (Lever: *The Meteorite*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The meteorite is returned; the crater is cleared | **Red Orb weakened:** Magma's Phase 3 Orb Pedestal is brittle (−1 pedestal) | −3 |
| **Success** | The rig is cut; the meteorite saved | Magma Phase 1 −1 battle | −2 |
| **Partial** | The rig is disabled; the meteorite cracks | No change | −1 |
| **Failure** | The meteorite is seated; the crater rumbles | **Red Orb strong:** +1 Orb Pedestal; Magma's Pokémon +5% HP | +2 |
| **Declined** | The meteorite stays in Magma's hands | Unchanged | +1 |

**Failure consequences:** **C3 (Confiscation), C7 (Occupation), C11.**

## 8. Raid 2 — "Slateport Submarine"

**Offer (the harbormaster):** *"They've loaded the sub with provisions. If it leaves, the Seafloor Cavern is next."*
**PR:** `pr.hoenn.slateport-dock` — 3 decks: Pier → Engine Room → Control Bridge. **Security:** water tiles, cranes, patrolling Grunts.
**Objectives:** *Primary:* disable the submarine. *Secondary A:* rescue the crew. *Secondary B:* defeat Admin Matt (or Shelly, if Matt was beaten at Ignition).

**Key scene (Control Bridge):**
> **MATT:** "Archie's on the sub. You'll have to go through me."
> *(Battle: Matt, with Mightyena, Golbat, Sharpedo, Carvanha, Crobat; Executive Ability: **Riptide**: once per battle, his Water move can't be dodged or switched out of; announced.)*
> **MATT (defeat):** "Tell Archie I'm sorry. Tell him I tried."

**Results (Lever: *The Submarine*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The sub is scuttled; the crew freed | **Blue Orb weakened:** Aqua's Phase 3 Orb Pedestal is brittle (−1 pedestal) | −3 |
| **Success** | The sub is crippled | Aqua Phase 1 −1 battle | −2 |
| **Partial** | The engine is damaged | No change | −1 |
| **Failure** | The sub escapes; you are thrown overboard | **Blue Orb strong:** +1 Orb Pedestal; Aqua's Pokémon +5% HP | +2 |
| **Declined** | The sub leaves | Unchanged | +1 |

**Failure consequences:** **C1 (Impound: "kept aboard the sub"), C4 (Strength surge), C11.**

## 9. Raid 3 — "Mt. Pyre" *(conditional)*

**Setup:** Both Orbs are hidden in Mt. Pyre's summit. Whoever reaches them first decides the Awakening.
**PR:** `pr.hoenn.mt-pyre` — 2 floors; **Objectives:** reach the Orb altar; defend it from both teams; defeat Courtney (Numel, Camerupt, Mightyena, Zubat; Trait: **Analysis**: her second Pokémon copies the player's last stat boost; announced).
**Results (Lever: *The Orbs*):** Triumph: the Orbs are hidden (Phase 3 timer +3; both leaders lose a Pokémon); Success: timer +2; Partial: 0; Failure: both teams take their Orb (+1 gauntlet); Declined: unchanged.

## 10. Climax — "The Awakening"

### 10.1 News Report A

*Hoenn Coast News. Anchor: Lucan Reyes. Chyron: BREAKING — SOOTOPOLIS: THE TITANS RISE.*

> **ANCHOR (Lucan Reyes):** "Good evening. Two enormous shapes have been seen in the harbor of Sootopolis City: one in the water, one in the cliffs. The city has been evacuated."
> **ANCHOR:** "Coast Guard sources say two groups called Team Aqua and Team Magma woke the legendary Pokémon Kyogre and Groudon within hours of each other."
> *(Camera: a wall of rain over one side of the crater; a red sun burning over the other.)*
> **FIELD REPORTER (shouting):** "The weather is splitting the city in half. We have no way to get closer."
> *[Raid recap]* "Earlier, a trainer saved the meteorite at Mt. Chimney…" / "The Slateport submarine was partly disabled…" / "The Mt. Pyre intervention failed."
> *(Freeze: the player at the Sootopolis dock.)* **Choice: [Take them on] / [Stay out of it]**

### 10.2 News Report B (rival beat you there)

> **ANCHOR:** "…a young trainer in {rivalOutfitTag}, with a {rivalAceType}-type Pokémon, was seen swimming toward the Cave of Origin ahead of the Coast Guard. Contact was lost at the cave mouth."
> **CHYRON:** `TRAINER INSIDE THE CAVE OF ORIGIN — STATUS UNKNOWN`

### 10.3 The Choice
**[Take them on]** → `PS-CLIMAX`. **[Stay out of it]** → Offscreen Resolution.
**[Stand with them]** → `PS-CLIMAX-ALLIED` *(shown only if eligible: `aqua.insideman` or `magma.insideman` set, reputation ≥ +45, not betrayed, no prior Turn; see `docs/STAND_WITH_THEM.md` and `scripts/10_STAND_WITH_THEM.md` §3)*.

### 10.4 Phase 1 — The Descent (Gauntlet)

*Sootopolis harbor to the Cave of Origin. Gauntlet battles: 3 + round(OS/2), clamp 4–7.*

| Landing | Trainer | Notes |
| --- | --- | --- |
| Harbor | Aqua Grunts ×2 | Water/Dark; rain environment |
| Cliff path | Magma Grunts ×2 | Fire/Ground; harsh sun |
| Cave mouth | Aqua Researcher + Magma Researcher | Multi Battle; opposite weathers |
| Inner Cave | Admin Shelly (or Matt) | Water/Dark; Trait: **Riptide** |
| Inner Cave | Admin Courtney (or Tabitha) | Fire/Ground; Trait: **Magma Surge** |

**Dialogue:**
> **SHELLY:** "Archie said you'd show up. I told him you were just a kid."
> **SHELLY (defeat):** "…I hate being wrong."

### 10.5 Phase 2 — The Admins

**Duel 1 — Shelly** (Mightyena, Sharpedo, Carvanha, Crobat, Zubat; Executive Ability: **Wash Out**: once per battle, her first Water move clears the player's stat boosts; announced.)
> **SHELLY:** "This is what happens when you stand between us and the sea."
> **SHELLY (defeat):** "Then you can explain it to Archie."

**Duel 2 — Courtney** (Numel, Camerupt, Mightyena, Zubat, Koffing; Executive Ability: **Analysis**, as in Raid 3.)
> **COURTNEY:** "Deviation detected. Corrective action begins."
> **COURTNEY (defeat):** "…I do not like this result."

### 10.6 Phase 3 — The Set Piece: The Orbs Resonate

*The Cave of Origin shakes. The Blue Orb glows against the Red Orb. Both titans stir.*

**Objective:** Keep the **Orb pedestals** (2–4 depending on Levers) from being seated. Each is a battle at an altar, and the weather alternates **Rain ↔ Harsh Sun** every 2–3 turns (announced one turn ahead). Each shift boosts one type by 10% for **both sides** (caps respected).

**Broadcast (PA):**
> **ARCHIE (voice):** "The sea gave us life! It can have it back!"
> **MAXIE (voice):** "Humanity needs room! The land will rise!"

**Complication:** If Mt. Pyre was lost (no Raid 3 Success), both Orbs are already half-seated and a Primal Echo joins the final pedestal fight (one extra battle).

### 10.7 Phase 4 — Archie and Maxie

*The two leaders on opposite ledges of the altar, their titans coiling behind them.* **Part 1 — Maxie:** Mightyena, Crobat, **Camerupt** (ace, Primal Rage). **Doctrine: Heat Rule**: his Fire and Ground moves hit +10% in Harsh Sun (announced). **Part 2 — Archie:** Mightyena, Crobat, **Sharpedo** (ace, Primal Tide). **Doctrine: Tide Rule**: his Water and Dark moves hit +10% in Rain (announced). **Boss phase (both):** at 50% ace HP, **Titan's Roar**: the weather locks for 3 turns in the leader's favor.

> **ARCHIE:** "We could have shared this world."
> **MAXIE:** "No. We never could."
> **PLAYER:** "Stop the Orbs."
> *(Battle: Maxie then Archie, or both at once if Raid 3 failed.)*
> **MAXIE (defeat):** "I was wrong. The land isn't ours."
> **ARCHIE (defeat):** "I was wrong. The sea isn't ours, either."

### 10.8 Rival variants (Hoenn)

**Help (60%).** The rival swims in through the underwater tunnel, takes the harbor (Phase 1 −1) and holds an Orb pedestal in Phase 3. *Line:* "Whatever side they pick, they're both wrong."
**Beat-you (30%).** The rival reaches the cave first and is pinned between the two Orbs (Hurt/Captured). Rescue: cross the altar while the weather shifts (3 steps). *Line:* "I tried to stop both of them. I couldn't."
**Side-with (10%).** *Hook:* the rival joined one of the teams at Ignition, thinking it would help the Gym challenge. *Foreshadow:* (1) the rival wears a bandana at the Gym; (2) a Grunt calls them "comrade"; (3) their Pokémon has an Orb scar.
> **Reveal:** The rival at the Inner Cave: "I only joined for the access. I didn't see what it was for."
> **Turn responses:** [Offer to leave together] (key for Friendly/Heir) / [Tell them what the Orbs will do] (key for Prodigy/Scholar) / [Challenge them to stop it themselves] (key for Hotshot/Mirror) / [Say you understand] (key for Bitter/Lone Wolf)

### 10.9 Resolution — The Orbs

The two Orbs float above the altar, humming against each other. Rayquaza coils in the sky above.

**Choice:**
1. **[Call Rayquaza]** — The sky guardian descends and calms the titans. *Effects:* Peacemaker Emblem; `legend-weather-crisis` resolved.
2. **[Seal the Orbs]** — You seal both Orbs in the cave. *Effects:* the Orbs are Key Items you cannot use; both teams' Orb Resonance is lost.
3. **[Return the Orbs]** — You hand each Orb to its team. *Effects:* a truce between Aqua and Magma; they disband and become a humanitarian group; a later event: someone steals an Orb.

**Archie and Maxie (if Rayquaza is called):** *Archie:* "We wanted a world. It turns out it wanted us." *Maxie:* "We should have asked it first."

### 10.10 Stay Out — Offscreen Resolution (Hoenn flavor)

The titans clash for a day. Region effects: **Occupation** (Sootopolis is split: rest nodes heal 50% on one side only), **Prices +15%**, **the weather** (two Region of Doom factions gain an Orb contract). Aqua and Magma join the Region of Doom.

### 10.11 If You Fall (the run ends)

*A climax defeat ends the run. This is the scene and the Doom Ledger entry that close it.*

**Scene.** The screen goes to black. The party is on the floor. The leaders speak last.
> **ARCHIE:** "It's done. The sea is rising."
> **MAXIE:** "And so is the land. We have our wish, Archie. Both of them."
> **BROADCAST (voice-over):** Hoenn Coast News: "The titans have risen. We are unable to broadcast further."

**What happens to the region.** The titans fight; the weather splits the region in half. Neither team rules; both are swept away.
**Rival coda.** The rival's line for this moment is in `CLIMAX_RIVAL_INTEGRATION.md` §13 (by archetype and by the variant that was rolled).
**Impounded Pokémon.** Any still held are not returned. The Doom Ledger records `lost-with-impounded`.
**Doom Ledger entry.** `aqua.ended = triumphant`; `magma.ended = triumphant`; `run.ended = climax-defeat`. A triumphant team enters the Region of Doom with +1 Doom Level.

## 11. Aftermath

- **If Rayquaza:** Lucan Reyes: "The titans have retreated. Rayquaza has been seen over the Sky Pillar."
- **If Sealed:** "The Orbs are sealed in the cave. Both teams are in custody."
- **If Returned:** "Aqua and Magma are rebranding as relief organizations. Officials are skeptical."
- **Doom Ledger entry:** `aqua.ended`, `magma.ended` = rayquaza | sealed | returned.

## 12. Art and audio notes

- **Aqua:** navy bandanas, anchor badges; Archie with a captain's coat and a salt-streaked beard.
- **Magma:** red hoodies with horn hoods, flame badges; Maxie in a pressed jacket and glasses.
- **Cave of Origin:** a glowing rock cavern with two Orb pedestals; the weather splits at the ceiling.
- **Music:** a drum-and-chant for Aqua, a brass-and-hammer for Magma; they combine into a single storm in Phase 3.
