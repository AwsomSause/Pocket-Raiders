# 09 — PALDEA: TEAM STAR
### Script: *Starfall Street*

> *"We were never trying to wreck the school. We were trying to make it notice us."* — Cassiopeia

**Team type:** Delinquent crew with five Bases (Team Star) · **Primary team (CANON):** Team Star · **Second team:** none · **Returning team:** none
**Climax:** Starfall Street: the Star Barrage (Pseudo Region `pr.paldea.starfall-street`)
**Regional hooks:** open-world drift, Terastallization, Academy culture, `legend-ruin-quartet-shrine` (`REGIONAL_IDENTITY.md` §3.9)
**Canon note:** Cassiopeia (Penny), Giacomo, Mela, Atticus, Ortega and Eri are canon characters from Scarlet and Violet. Dialogue, raids and the climax are original and follow the games' structure (five Bases, the Starfall Street showdown). Species are my best recall; verify before shipping. This is the one team in the pack that is not villainous at heart; the design leans into that.

---

## 1. Profile

| Field | Team Star |
| --- | --- |
| Template | Crew (Boss → Bosses → Squads → Grunts) |
| Ideology | A school that ignored them will have to look; bullying does not get to win |
| Primary objective | Hold five Bases and keep "Star Barrage" battles going until the Academy acknowledges the crew |
| Secondary objectives | Defend the Bases; run the Star Barrage; keep Cassiopeia hidden |
| Preferred types | Dark, Fire, Poison, Fairy, Fighting (Houndoom, Torkoal, Revavroom line, Klefki, Hawlucha) *(SV; approximate)* |
| AI personalities | Brawler, Gambler, Zealot |
| Mercy | 0.9 (they are teenagers; most of them want to be talked down) |
| Shadow method | **Star Barrage Link**: a Terastal charge forced on a Pokémon through the Bases' Starmobiles; the crew calls it "borrowing" |
| Colors / uniform | Red-and-black Academy jackets with a star motif; Starmobile paint jobs |
| HQ | Five Bases scattered across Paldea; the crew meets on Starfall Street |
| Lifecycle | 2 Emerging → 3 Established at climax |

## 2. Hierarchy and Roster

| Name | Rank | Title | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- |
| **Cassiopeia (Penny)** | Leader (7) | Boss, "Cassiopeia" | Strategist / Zealot | Umbreon, Vaporeon, Flareon, Jolteon, Espeon, Leafeon, Glaceon, Sylveon *(SV; approximate)* | Hesitant, brilliant, hurt |
| **Giacomo** | Second (6) | Boss, Segin Squad (Dark) | Brawler | Houndoom, Mightyena, Skuntank, Revavroom *(SV; approximate)* | Cool, loyal |
| **Mela** | Commander (4) | Boss, Schedar Squad (Fire) | Brawler | Torkoal, Arcanine, Magcargo, Revavroom *(SV; approximate)* | Loud, protective |
| **Atticus** | Commander (4) | Boss, Navi Squad (Poison) | Strategist | Toxapex, Garbodor, Muk, Revavroom *(SV; approximate)* | Gentle, wry |
| **Ortega** | Commander (4) | Boss, Ruchbah Squad (Fairy) | Gambler | Klefki, Gardevoir, Mawile, Revavroom *(SV; approximate)* | Soft, mischievous |
| **Eri** | Commander (4) | Boss, Caph Squad (Fighting) | Brawler | Hawlucha, Lucario, Breloom, Revavroom *(SV; approximate)* | Direct, sporty |
| **Star Squad Captains** | Lieutenant (3) | "Squad Captain" | Enforcer | Revavroom line, Pawniard line | Cocky |
| **Star Specialists** | Specialist (2) | "Star Specialist" | Scout | Varies by Squad | Bright |
| **Star Grunts** | Grunt (1) | "Star Grunt" | Zealot | Varies by Squad | Defensive, young |
| **Star Associates** | Associate (0) | "Star Associate" | Technician | Pikachu-sized things, Starmobile mechanics | Eager |

> **Org chart:** Cassiopeia → Giacomo (Second) → four Squad Bosses (Commanders) → Squad Captains → Specialists → Grunts → Associates. **Jessie, James and Meowth** (script 00) show up as drifters.

## 3. Story Overview

**Logline:** A crew of students who stopped going to class built five Bases and a battle league. Underneath, a boss they all trust is about to ask for the one thing they cannot give: to be seen.

**Backstory.** Cassiopeia (Penny) started the crew to stop the bullying in her school. Each Squad Boss took in kids who did not fit. The crew grew into a parallel school: five Bases, a battle league and a secret.

**The twist.** The crew's ultimate battle, Star Barrage, is not meant to hurt anyone. It is meant to be so big that the Academy has to acknowledge them. The player's role is to find out whether that is possible without anyone getting hurt, and who among the Bosses is willing to let it stand.

**Climax arc:** Starfall Street, Mesagoza's long avenue: five Bases dock their Starmobiles and the crew prepares to stage the Star Barrage. The player must clear each Base's final defense and then face Cassiopeia.

## 4. Act 0 — Rumors

- **Student:** "Team Star's not a gang. They're… sort of a club? They have Starmobiles."
- **Teacher:** "Three students skipped again this week. I think they're in the Bases."
- **Trainer:** "Don't battle a Starmobile. They shut the field down." *(a rumble in the distance)*
- **Graffiti:** A star with the words "WE WERE HERE." (Intel +2.)
- **Item:** A dropped **Star Badge** (Intel +2).

## 5. Act I — Ignition

*Trigger: after Gym 1–3. A Starmobile blocks the road; two Star Grunts hop out.*

**Scene: The Roadblock**

> **STAR GRUNT:** "Hey. You. Yeah. This road's closed for Team Star business."
> **STAR GRUNT:** "Wait, are you from the Academy? Because if you are, we're not going back."
> **PLAYER (choice):**
> 1. **"Why not?"** → The Grunt hesitates. "…Because nobody asked why we left." *(Sets `star.insideman = true`: the Bases' kids tell you things. Heat −15; the Squad Boss at Raid 1 is willing to talk before fighting.)*
> 2. **"Move your Starmobile."** → The Grunts bristle. *(Battle: 2 Star Grunts; Dark/Fire; Trait: **Revved Up**: first move gains priority.)*
> 3. **"I'll walk around."** → A Grunt sighs. "Good. Don't tell the others."
> *Farther along, a Squad Captain watches, then leaves.*
> **SQUAD CAPTAIN:** "Boss says we don't hurt kids. She didn't say we don't win."
> **PLAYER (choice):** Follow the Captain (Intel +3) / Ask a Grunt (Intel +1) / Ignore.
> **STAR GRUNT (defeat):** "Okay. Okay. …You're not that bad."

*Outcome: Team Star awake. Heat 8 (14 on battle). The crew is not hostile unless provoked.*

## 6. Pursuit — Ambush Dialogue

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Star Grunt (Defensive) | "We're not bad! We just don't want to go back!" | "Okay! You're strong! …Go on." |
| Grunt — Star Grunt (Young) | "Boss says we win by being loud." | "Loud wasn't enough." |
| Grunt — Star Grunt (Scared) | "I'm not supposed to be out here. Please don't tell anyone." | "I'm so dead." |
| Specialist — Star Specialist (Bright) | "Star Barrage is coming. Prepare to be amazed!" | "Amazed… by how badly I lost." |
| Lieutenant — Squad Captain (Cocky) | "I run the Starmobile on this road. Move." | "I'll just reverse." |
| Commander — Eri (Direct) | "No hard feelings, but I'm not letting you through." | "That was good. Really good." |
| Commander — Ortega (Soft) | "Sweetie, you're in my Base. That's not smart." | "Oh! You actually won! …Congratulations." |
| Commander — Atticus (Gentle) | "I'd rather not fight. But I will if I have to." | "Thank you for being gentle about it." |
| Commander — Mela (Loud) | "NO ONE touches my squad! NO ONE!" | "…Fine. You didn't touch them." |
| Second — Giacomo (Cool) | "Don't make this personal. It's already personal." | "Heh. Okay. That was fair." |
| Leader — Cassiopeia (Hesitant, rare) | "I… I'd rather not do this. But I will." | "Thank you. I think I needed that." |

## 7. Raid 1 — "Segin Base"

**Offer (a Star Associate):** *"Giacomo's been running the Segin Base like a fortress. He says he's protecting us."*
**PR:** `pr.paldea.segin-base` — 3 floors: Garage → Gym → Roof. **Security:** Starmobile traffic (movement hazards), Dark-type squad patrols.
**Objectives:** *Primary:* dismantle the Base's Starmobile (the Segin Barrage Link). *Secondary A:* free the "borrowed" Pokémon. *Secondary B:* defeat Giacomo.

**Key scene (Roof):**
> **GIACOMO:** "I don't hate you. I just can't let you through. She needs us."
> *(Battle: Giacomo, with Houndoom, Mightyena, Skuntank, Revavroom; Trait: **Smoke Screen Rev**: once per battle, his Starmobile reduces both sides' accuracy by 10% for 2 turns; announced.)*
> **GIACOMO (defeat):** "…Okay. Okay. Tell her we tried."

**Results (Lever: *The Barrage Link*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | Segin's Link is dismantled; Giacomo steps aside | **Segin Down:** Phase 1 −1 battle; Giacomo's Duel in Phase 2 is skipped | −3 |
| **Success** | The Link is damaged | Phase 1 −1 battle | −2 |
| **Partial** | Segin falls but Giacomo stays loyal | No change | −1 |
| **Failure** | The Base repels you; the Starmobile fires | **Barrage strong:** +1 gauntlet; Star Pokémon +5% HP | +2 |
| **Declined** | The Base stays up | Unchanged | +1 |

**Failure consequences:** **C1 (Impound: "held in the Segin garage"), C5 (route blocked), C11.**

## 8. Raid 2 — "Schedar Base"

**Offer (a Star Grunt, secretly):** *"Mela's Base is the loudest. If you can win there, the rest will hear about it."*
**PR:** `pr.paldea.schedar-base` — 3 floors: Courtyard → Furnace → Overlook. **Security:** fire hazards (burn chance +10% on contact), Mela's squad.
**Objectives:** *Primary:* shut the furnace Link. *Secondary A:* calm Mela's squad. *Secondary B:* defeat Mela.

**Key scene (Overlook):**
> **MELA:** "You come at my squad and you come at ME."
> *(Battle: Mela, with Torkoal, Arcanine, Magcargo, Revavroom; Trait: **Heat Wave Rev**: once per battle, her Starmobile burns the field for 3 turns, 1/16 damage per turn; announced.)*
> **MELA (defeat):** "…Fine. FINE. They're safe. That's all I wanted."

**Results (Lever: *The Furnace*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The furnace goes cold; Mela joins you | **Mela's Squad:** a Squad Boss ally in Phase 1 | −3 |
| **Success** | The furnace is throttled | Phase 3 timer +1 | −2 |
| **Partial** | The furnace is damaged | No change | −1 |
| **Failure** | The furnace flares | **Burning Street:** Starfall Street is on fire (burn hazard in Phase 1) | +2 |
| **Declined** | The furnace burns | Unchanged | +1 |

**Failure consequences:** **C2 (Gym lockdown), C4 (Strength surge), C11.**

## 9. Raid 3 — "Navi Base" *(conditional)*

**Setup:** Atticus's Navi Base is slowly poisoning the water supply by accident through a leaking Starmobile. Fix it before anyone gets sick.
**PR:** `pr.paldea.navi-base` — 2 floors; **Objectives:** reach the leak; stabilize the poison; defeat the Navi squad (Toxapex, Garbodor, Muk; Trait: **Toxic Leak**: poison chance +10% on contact; announced).
**Results (Lever: *The Leak*):** Triumph: Atticus joins your side (Phase 3 timer +3; poison hazard removed); Success: timer +2; Partial: 0; Failure: the leak spreads (+1 gauntlet, poison hazard on the Street); Declined: unchanged.

## 10. Climax — "Starfall Street"

### 10.1 News Report A

*Paldea Today. Anchor: a local anchor. Chyron: BREAKING — STARMOBILES ON THE AVENUE.*

> **ANCHOR:** "Good evening. Five vehicles are blocking the avenue in front of the Academy in Mesagoza. Students in jackets are on top of them, chanting."
> **ANCHOR:** "A representative of the group has said they want to talk to the Academy's board."
> *(Camera: five Starmobiles, a crowd, a girl in the center, shaking.)*
> **FIELD REPORTER:** "The students say it is a battle. The Academy says it is a protest. The students say it is both."
> *[Raid recap]* "Earlier, a trainer took apart the Segin Base's Starmobile…" / "The Schedar furnace was shut down…" / "The Navi leak was contained."
> *(Freeze: the player at the Mesagoza gates.)* **Choice: [Take them on] / [Stay out of it]**

### 10.2 News Report B (rival beat you there)

> **ANCHOR:** "…a student in {rivalOutfitTag}, with a {rivalAceType}-type Pokémon, was seen pushing through the crowd and entering the avenue. Contact was lost after a Starmobile moved."
> **CHYRON:** `STUDENT ON STARFALL STREET — STATUS UNKNOWN`

### 10.3 The Choice
**[Take them on]** → `PS-CLIMAX`. **[Stay out of it]** → Offscreen Resolution.
**[Stand with them]** → `PS-CLIMAX-ALLIED` *(shown only if eligible: `star.insideman` set, reputation ≥ +45, not betrayed, no prior Turn; see `docs/STAND_WITH_THEM.md` and `scripts/10_STAND_WITH_THEM.md` §9)*.

### 10.4 Phase 1 — The Squad Line (Gauntlet)

*Mesagoza gates to Starfall Street. Gauntlet battles: 3 + round(OS/2), clamp 4–7.*

| Station | Trainer | Notes |
| --- | --- | --- |
| Gate | Star Grunts ×2 | Dark/Fire; Starmobile noise (accuracy −5% both) |
| Plaza | Star Specialist ×2 | Poison/Fairy; 1 gadget each |
| Fountain | Squad Captain | Fighting/Dark; Trait: **Revved Up** |
| Starmobile 1 | Eri | Fighting; Trait: **Sporty Rush** |
| Starmobile 2 | Ortega | Fairy; Trait: **Charm Offensive** |

**Dialogue:**
> **ERI:** "Stop. Please. I don't want to hurt you."
> **ERI (defeat):** "I guess I can't stop you. Be nice to her."

### 10.5 Phase 2 — The Bosses

**Duel 1 — Giacomo** (as in Raid 1; skipped if Segin was a Triumph.)
> **GIACOMO:** "She needs us. We need her. Don't take that away."
> **GIACOMO (defeat):** "…Okay. Okay. Go to her."

**Duel 2 — Atticus** (as in Raid 3; or Mela if Schedar was a Triumph, as an ally).

### 10.6 Phase 3 — The Set Piece: The Star Barrage

*Five Starmobiles circle the avenue; the crowd chants.* **Objective:** Survive the **Barrage** (3–5 waves). Each wave, a Starmobile charges and a Terastal flash hits one of the player's Pokémon (random). Break each Starmobile's link by defeating its Squad (a battle per wave).

**Complication:** If the Segin Link was dismantled (Raid 1 Success or better), the first wave is skipped. If Mela joined (Raid 2 Triumph), she holds one wave for you.

**Broadcast:**
> **CASSIOPEIA (voice):** "Please… please just listen. We're not trying to hurt anyone."

### 10.7 Phase 4 — Cassiopeia

*The avenue's center, under the giant Academy clock.* **Team:** Umbreon, Vaporeon, Flareon, Jolteon, Espeon, Glaceon *(SV; approximate)*; **ace Sylveon** (Terastal). **Doctrine: Star Barrage**: her team Terastallizes once, in turns of her choosing, and the wave's chosen Terastal type applies (announced). **Boss phase:** at 50% ace HP, **Starfall**: stars fall for 3 turns, 1/16 damage to the player's side only if they are of a different Tera type.

> **CASSIOPEIA:** "I just wanted someone to look at us."
> **PLAYER:** "I'm looking."
> **CASSIOPEIA:** "Then please don't look away when I lose."
> *(Battle.)*
> **CASSIOPEIA (mid):** "Don't hold back! If you hold back, it doesn't count!"
> **CASSIOPEIA (defeat):** "…Thank you. I mean it. Thank you."

### 10.8 Rival variants (Paldea)

**Help (60%).** The rival has already talked three Squad Captains into standing down, and holds one wave of the Barrage (Phase 3 −1 wave). *Line:* "They're not villains. They're just loud. Let me handle the loud ones."
**Beat-you (30%).** The rival tried to break up the Barrage directly and was swept away by a Starmobile (Hurt/Captured). Rescue: cross the avenue during a wave (3 steps). *Line:* "I thought I could just push through. I was wrong."
**Side-with (10%).** *Hook:* the rival is a former Academy student who left the same way the crew did. *Foreshadow:* (1) the rival wears a Team Star pin they never explain; (2) a Squad Captain calls them "Boss's friend"; (3) their Pokémon has a Starmobile sticker.
> **Reveal:** The rival at the fountain: "Someone finally asked why I left. They said yes before I could."
> **Turn responses:** [Offer to listen to the crew together] (key for Friendly/Heir) / [Tell them the crew needs a way out, not in] (key for Prodigy/Scholar) / [Challenge them to win the argument at the Academy] (key for Hotshot/Mirror) / [Say you understand] (key for Bitter/Lone Wolf)

### 10.9 Resolution — The Last Star

The Starmobiles go still. The crowd falls quiet. Cassiopeia sits down on the curb.

**Choice:**
1. **[Walk her to the Academy]** — The player and the crew go in together to talk. *Effects:* Peacemaker Emblem; `legend-ruin-quartet-shrine` resolved.
2. **[Disband the Bases]** — The five Bases are shut down by the crew themselves. *Effects:* region reputation +15; Team Star ends as a crew.
3. **[Leave the decision to them]** — The crew votes. *Effects:* a later event: Team Star reopens as a club.

**Cassiopeia (if walked in):** "I never thought it'd be this easy. It wasn't, but it feels easy."

### 10.10 Stay Out — Offscreen Resolution (Paldea flavor)

The Star Barrage runs for three nights. Region effects: **Occupation** (Mesagoza is closed; rest nodes heal 50%), **Prices +10%**, **Terastal storm** (random Tera type changes for wild Pokémon). Team Star becomes a standing movement. The Academy is forced to react, badly.

### 10.11 If You Fall (the run ends)

*A climax defeat ends the run. This is the scene and the Doom Ledger entry that close it.*

**Scene.** The screen goes to black. The party is on the pavement. The leader speaks last.
> **CASSIOPEIA:** "…I'm so sorry. I didn't want it to end like this. Please don't hate us."
> **BROADCAST (voice-over):** Paldea Today: "…the Academy has agreed to talk to the students. The students say the talks came too late."

**What happens to the region.** The Star Barrage ends with a standoff that nobody wins; Team Star becomes a permanent presence on the avenue.
**Rival coda.** The rival's line for this moment is in `CLIMAX_RIVAL_INTEGRATION.md` §13 (by archetype and by the variant that was rolled).
**Impounded Pokémon.** Any still held are not returned. The Doom Ledger records `lost-with-impounded`.
**Doom Ledger entry.** `star.ended = triumphant`; `run.ended = climax-defeat`. A triumphant team enters the Region of Doom with +1 Doom Level.

## 11. Aftermath

- **If Walked:** "The students and the board are in the same room for the first time in years."
- **If Disbanded:** "Team Star has dissolved. The Starmobiles are being repurposed."
- **If Left to them:** "Team Star has voted to remain a club. The vote was close."
- **Doom Ledger entry:** `star.ended` = walked | disbanded | club.

## 12. Art and audio notes

- **Team Star:** red-and-black Academy jackets with star motifs; Starmobiles with neon underglow; Cassiopeia in an oversized hoodie and a mask.
- **Starfall Street:** a long avenue, a giant Academy clock, five parked Starmobiles.
- **Music:** a punk-rock march for the Bases; a quiet piano theme for Cassiopeia; both layer in the Barrage.
