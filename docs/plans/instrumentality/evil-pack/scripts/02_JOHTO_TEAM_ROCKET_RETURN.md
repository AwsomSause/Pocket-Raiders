# 02 — JOHTO: TEAM ROCKET RETURNS
### Script: *The Radio Tower*

> *"A voice carries further than an army. Let us see how far the Boss can hear."* — Archer

**Team type:** Syndicate (leaderless, reorganizing) · **Primary team (CANON, RETURNING):** Team Rocket · **Returning team:** this is it: Rocket after Giovanni vanished
**Climax:** The Radio Tower — Goldenrod Radio Tower (Pseudo Region `pr.johto.radio-tower`)
**Regional hooks:** night bonus, Ruins of Alph, Bell Tower, `legend-lugia-shrine` (`REGIONAL_IDENTITY.md` §3.2)
**Canon note:** Archer, Ariana, Petrel, Proton and Giovanni are canon characters; their dialogue and the raids are original and follow the Johto games' events (Slowpoke Well, Mahogany hideout, Lake of Rage, the Radio Tower). Species are my best recall; verify before shipping.

---

## 1. Profile

| Field | Value |
| --- | --- |
| Template | Syndicate in reorganization (Executives run the cells; the Boss is missing) |
| Ideology | Rocket is not finished, only waiting. The Boss will come when he hears his name called loudly enough |
| Primary objective | Seize the Goldenrod Radio Tower and broadcast the call that brings Giovanni home |
| Secondary objectives | Sell Slowpoke tails to fund the operation; force Red Gyarados to evolve with a radio pulse; hold Mahogany as a headquarters |
| Preferred types | Poison, Dark, Normal, Fire (Houndoom, Murkrow, Koffing, Zubat lines) |
| AI personalities | Strategist, Zealot, Opportunist |
| Mercy | 0.1 (the Executives have nothing left to lose) |
| Shadow method | **Radio Wave Lock**: the Tower's signal overrides a Pokémon's instincts with a pulse |
| Colors / uniform | Black uniforms with a red R; Executives in white-trimmed coats |
| HQ | The Mahogany Hideout (beneath the souvenir shop); the Radio Tower during the takeover |
| Lifecycle | 4 Major (reorganized) → 5 Dominant at climax |

## 2. Hierarchy and Roster

| Name | Rank | Title | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- |
| **Giovanni** | Leader (7) | The Boss *(absent; cameo)* | Strategist | Rhyhorn, Dugtrio, Nidoqueen, Nidoking, **Rhydon** | Calm, cold, distant |
| **Archer** | Second (6) | Executive; acting leader | Zealot / Strategist | Houndoom, Murkrow, Koffing / Weezing, Zubat line *(approximate)* | Formal, intense, devoted |
| **Ariana** | Executive (5) | Executive | Enforcer / Handler | Arbok, Gloom / Vileplume, Murkrow *(approximate)* | Cool, curt |
| **Petrel** | Executive (5) | Executive (master of disguise) | Infiltrator | Koffing / Weezing, Golbat *(approximate)* | Quick, mocking |
| **Proton** | Executive (5) | Executive | Technician / Zealot | Koffing, Golbat, Houndour *(approximate)* | Brusque, proud |
| **Butch** | Lieutenant (3) | Rocket Agent | Enforcer | Houndour line, Raticate *(approximate)* | Smug |
| **Cassidy** | Lieutenant (3) | Rocket Agent | Enforcer | Raticate, Golbat *(approximate)* | Brash |
| **Jessie** | Specialist (2) | Rocket Agent | Infiltrator | Ekans / Arbok, Wobbuffet *(anime)* | Theatrical |
| **James** | Specialist (2) | Rocket Agent | Infiltrator | Koffing / Weezing, Growlithe *(anime)* | Dramatic |
| **Meowth** | Specialist (2) | Rocket Agent | Scout | Meowth / Persian | Scheming |
| **Radio Techs** | Specialist (2) | "Signal Technician" | Technician | Magnemite, Voltorb | Detached |
| **Rocket Grunts** | Grunt (1) | "Rocket Grunt" | Enforcer | Rattata, Zubat, Koffing, Ekans | Tough, loyal |

> **Org chart:** (Giovanni, absent) → Archer → (Ariana, Petrel, Proton) → (Butch, Cassidy) → (Jessie, James, Meowth) → Radio Techs → Grunts.

## 3. Story Overview

**Logline:** Rocket has lost its Boss and is coming back anyway. The Executives will take the Goldenrod Radio Tower and broadcast a call that Giovanni cannot ignore.

**Backstory.** After Silph Co., Giovanni walked away and Rocket scattered. Archer kept the name alive in a basement beneath a souvenir shop, with Ariana, Petrel and Proton running cells across Johto. They sold Slowpoke tails to keep the lights on and tested a radio pulse that forced Gyarados to evolve.

**The twist.** The Tower broadcast is not an order; it is a **plea**. Archer does not want power. He wants the Boss back. If the broadcast completes, Giovanni may actually answer, and Archer has already prepared a welcome nobody else is ready for.

**Climax arc:** Rocket takes the Tower at dusk. The player must climb, silence the broadcast and decide what happens when the Boss is called.

## 4. Act 0 — Rumors

- **Fisherman:** "The Slowpoke at the Well keep losing their tails. Somebody's making a fine living."
- **Old man (Mahogany):** "The souvenir shop is always closed. There's a smell of coffee and gunpowder behind it."
- **Radio DJ:** "…and we're having a bit of static on the Tower's signal. Hold tight, folks."
- **Poster in Goldenrod:** "Rocket's future is bright. Join us." (Intel +2: stamped with a red R.)
- **Item:** A dropped **Rocket scarf** (Intel +2).

## 5. Act I — Ignition

*Trigger: after Gym 1–3. At the Slowpoke Well entrance, a black-uniformed Grunt is cutting a Slowpoke's tail with a pair of shears.*

**Scene: The Well**

> **PROTON** *(brusque, standing over the Grunt)*: "Nothing here. Move along."
> **PROTON:** "Rocket is being re-formed. Today it takes tails. Tomorrow it takes the sky."
> **PLAYER (choice):**
> 1. **"Is Rocket hiring?"** → Proton snorts, then sizes the player up. "We could use a dedicated pair of hands." **Sets `rocket-return.insideman = true`, Heat −25.** *(Raids become infiltration variants.)*
> 2. **"Stop cutting those tails."** → Proton: "Make me." *(Battle: Proton + 2 Grunts; poison cloud environment.)*
> 3. **"I'll tell the Rangers."** → Proton: "They already know. They are very slow." *(Heat +0; Proton remembers your face.)*
> *In the Well, a Slowpoke cries out; a Grunt flinches.*
> **GRUNT:** "We're supposed to do this, right? The Executives said so."
> **PLAYER (choice):** Intervene (battle) / Calm the Grunt (Intel +3) / Ignore.
> **PROTON (defeat):** "A mistake. A very small one. Archer will correct it."

*Outcome: Team Rocket awake. Heat 20 (28 on battle).*

## 6. Pursuit — Ambush Dialogue

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Rocket Grunt (Loyal) | "For Archer. For the Boss. Your Pokémon, please." | "For nothing, apparently." |
| Grunt — Rocket Grunt (Nervous) | "I didn't think anyone would find us here." | "Please, please don't tell Ariana." |
| Grunt — Rocket Grunt (Tough) | "Rocket is back. Remember that." | "…Rocket needs a bigger bench." |
| Specialist — Radio Tech (Detached) | "Broadcasting on every band. Say hello." | "Signal lost. Sorry." |
| Specialist — Jessie (Theatrical) | "Glorious! Another victim for the cause!" | "Why do we always lose to children?!" |
| Specialist — James (Dramatic) | "I'm sorry, but I will be using my best Pokémon." | "Oh, I should have stayed in bed." |
| Specialist — Meowth (Scheming) | "Do I look like I'm joking? I'm not. Pay up." | "Fine, fine! Ya win. This time." |
| Lieutenant — Butch (Smug) | "Rocket's got a new face. Mine." | "Tch. Don't make me tell Ariana." |
| Lieutenant — Cassidy (Brash) | "I don't lose. I just rearrange the board." | "That was a feint. Don't gloat." |
| Executive — Petrel (Mocking) | "Do you know which of us I am? No? Perfect." | "I'm… oh. You saw through me. Impressive." |
| Executive — Proton (Brusque) | "You waste my time. Prove you're worth it." | "A pity. Archer will hear about this." |
| Executive — Ariana (Cool) | "I like quick fights. Let's not prolong this." | "Quick, indeed. I'll remember you." |
| Executive — Archer (Formal) | "Rocket is not finished. You are the one who will be." | "I see. You have the Boss's eyes." |

## 7. Raid 1 — "Slowpoke Well"

**Offer (a local fisherman):** *"They're cutting tails by the dozen. The Slowpoke can't sleep. Shut it down."*
**PR:** `pr.johto.slowpoke-well` — 3 levels: Entrance → Pools → Deep Cave. **Security:** water tiles (Surf/Strength), hidden Grunts, Zubat swarm.
**Objectives:** *Primary:* shut down the tail-cutting operation. *Secondary A:* free the Slowpoke. *Secondary B:* defeat Executive Proton.

**Key scene (Deep Cave):**
> **PROTON:** "A child. They sent a child."
> *(Battle: Proton, with Koffing, Golbat, Houndour, Zubat, Weezing; Executive Ability: **Smog Screen**: once per battle, a poison fog reduces the player's accuracy by 15% for 2 turns; announced.)*
> **PROTON (defeat):** "…Archer will not be pleased."

**Results (Lever: *The Tails*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The operation ends; the Slowpoke are free | **Funds cut:** Phase 1 −1 battle; Phase 3 reinforcement wave delayed | −3 |
| **Success** | The shears are confiscated | Phase 1 −1 battle | −2 |
| **Partial** | Half the cave is cleared | No change | −1 |
| **Failure** | Proton barricades the Well and drives you out | **Funded:** +1 gauntlet battle; Archer's Phase 4 Pokémon get +5% HP | +2 |
| **Declined** | The cutting continues | Unchanged | +1 |

**Failure consequences:** **C2 (Fine / Shakedown), C5 (Blacklisted), C11.**

## 8. Raid 2 — "The Mahogany Hideout"

**Offer (a Ranger, via radio):** *"The souvenir shop is a front. Find the switch behind the Mahogany shop."*
**PR:** `pr.johto.mahogany-hq` — 4 floors: Shop → Corridor → Control Room → Radio Pulse Chamber. **Security:** hidden doors, warp panels, camera lines.
**Objectives:** *Primary:* shut down the radio pulse generator. *Secondary A:* free the Red Gyarados. *Secondary B:* defeat Executive Ariana.

**Key scene (Pulse Chamber):**
> **ARIANA:** "A child has made it this far. How diverting."
> *(Battle: Ariana, with Arbok, Gloom, Murkrow, Vileplume, Weezing; Executive Ability: **Spore Cloud**: once per battle, the first status move she uses cannot be blocked; announced.)*
> **ARIANA (defeat):** "…Fine. You interest me. Don't misuse it."

**Results (Lever: *The Pulse*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The pulse breaks; Gyarados is free | **Broadcast limited:** Phase 3 timer +3; the Radio Wave Lock is weaker (Shadow Surge cap −1) | −3 |
| **Success** | The pulse is switched off | Timer +2 | −2 |
| **Partial** | The generator is damaged | No change | −1 |
| **Failure** | The pulse spreads to the Lake of Rage | **Signal strong:** timer −2; one extra Rocket Shadow Pokémon in Phase 3 | +2 |
| **Declined** | The pulse keeps running | Unchanged | +1 |

**Failure consequences:** **C1 (Impound: "kept in the Hideout"), C10 (Shadowed), C11.**

## 9. Raid 3 — "Lake of Rage Transmitter" *(conditional)*

**Setup:** A hidden transmitter on the Lake of Rage forces Magikarp to evolve. Cut it and the Tower's relay loses its test-bed.
**PR:** `pr.johto.lake-of-rage-tower` — 2 floors; **Objectives:** destroy the transmitter; save the Red Gyarados; defeat Petrel (Koffing, Weezing, Golbat, Arbok; Trait: **Disguise**: his first switch-in copies the player's last move; announced).
**Results (Lever: *The Transmitter*):** Triumph: the relay is destroyed (Phase 3 −1 reinforcement wave); Success: partial; Partial: 0; Failure: the transmitter is reinforced (+1 gauntlet); Declined: unchanged.

## 10. Climax — "The Radio Tower"

### 10.1 News Report A

*Johto Radio & TV. Anchor: Nadia Voss. Chyron: BREAKING — RADIO TOWER SEIZED.*

> **ANCHOR (Nadia Voss):** "Good evening. The Goldenrod Radio Tower has been taken over by armed men in black. The station has gone off the air."
> **ANCHOR:** "A voice is broadcasting on every frequency, calling for 'the Boss to return.' Police believe it is a Team Rocket remnant."
> *(Camera: searchlights; black vans on the plaza; a banner reading ROCKET on the tower.)*
> **FIELD REPORTER:** "The Tower is sealed from the 2nd floor up. Staff are being held on the 4th. The Director's office is on the 5th."
> *[Raid recap]* "Earlier, a trainer shut the Well operation…" / "The Mahogany Hideout was partly disabled…" / "The Mahogany intervention failed."
> *(Freeze: the player at the plaza.)* **Choice: [Take them on] / [Stay out of it]**

### 10.2 News Report B (rival beat you there)

> **ANCHOR:** "…a young trainer in {rivalOutfitTag}, with a {rivalAceType}-type Pokémon, was seen slipping into the Tower through a service entrance. Contact was lost on the 3rd floor."
> **CHYRON:** `TRAINER INSIDE THE RADIO TOWER — STATUS UNKNOWN`

### 10.3 The Choice
**[Take them on]** → `PS-CLIMAX`. **[Stay out of it]** → Offscreen Resolution.
**[Stand with them]** → `PS-CLIMAX-ALLIED` *(shown only if eligible: `rocket-return.insideman` set, reputation ≥ +45, not betrayed, no prior Turn; see `docs/STAND_WITH_THEM.md` and `scripts/10_STAND_WITH_THEM.md` §2)*.

### 10.4 Phase 1 — The Tower Climb (Gauntlet)

*Tower base to the 5th floor. Gauntlet battles: 3 + round(OS/2), clamp 4–7.*

| Floor | Trainer | Notes |
| --- | --- | --- |
| Plaza | Rocket Grunts ×2 | Poison/Dark; searchlights (accuracy −5% both) |
| 2F | Radio Techs ×2 | Electric/Poison; static (Special moves −5%) |
| 3F | Lieutenant Cassidy | Normal/Dark; Trait: **Rival Agents** |
| 4F | Lieutenant Butch | Dark/Fire; mirrors Cassidy |
| 5F | Jessie, James and Meowth | Multi Battle; Trait: **Rocket Trio Routine** (see script 01) |

**Dialogue:**
> **BUTCH:** "Rocket doesn't forget. Neither do I."
> **BUTCH (defeat):** "Go on. The Executives are waiting."

### 10.5 Phase 2 — The Executives

**Duel 1 — Ariana** (Arbok, Gloom, Murkrow, Vileplume, Weezing; Executive Ability: **Spore Cloud**, as in Raid 2.)
> **ARIANA:** "Archer will be pleased. You're everything he feared."
> **ARIANA (defeat):** "…You'll want the next floor. Mind the static."

**Duel 2 — Petrel** (Koffing, Weezing, Golbat, Arbok, Muk; Executive Ability: **Disguise**, as in Raid 3.)
> **PETREL:** "You've seen through me. That's novel."
> **PETREL (defeat):** "Then it really is the end of the line."

**Duel 3 — Proton** (as in Raid 1; if Proton was defeated in Raid 1 his Ability is already known and **Smog Screen** lasts 1 turn.)

### 10.6 Phase 3 — The Set Piece: The Broadcast

*The Tower's transmitter hums. A countdown shows on every screen: THE CALL GOES OUT IN 12:00.*

**Objective:** Cut the **Transmitter nodes** (2–4 depending on Levers). Each is a battle in a control room while the **static** builds: every 3 turns, Special moves lose 5% accuracy for both sides (announced).

**Broadcast (PA):**
> **ARCHER (voice):** "Boss. If you can hear me, Rocket is still alive. We kept your name. We kept your place. Come home."

**Complication:** If the Mahogany generator was not shut down (no Raid 2 Success), an extra Rocket Shadow Pokémon joins the final transmitter node.

### 10.7 Phase 4 — Archer

*The Director's office on the 5th floor, the transmitter console humming.* **Team:** Houndoom, Murkrow, Weezing, Crobat, Arbok, **Honchkrow** (ace). **Doctrine: Radio Rule**: the first status move used against his team is bounced back once (announced). **Boss phase:** at 50% ace HP, **The Call**: the transmitter pulses; his ace gains +1 Speed and the player's team loses 5% accuracy for 3 turns.

> **ARCHER:** "You are the reason the Boss is not here. And I am sorry for you, because I'm going to ask him to remember it."
> **PLAYER:** "Giovanni isn't coming back."
> **ARCHER:** "Then I have nothing left but this."
> *(Battle.)*
> **ARCHER (mid):** "Come on. I need to be sure."
> **ARCHER (defeat):** "…Then it was never going to be enough. I should have known."

### 10.8 Rival variants (Johto)

**Help (60%).** The rival climbs through the maintenance shaft, takes the 3rd floor (Phase 1 −1) and holds a transmitter node in Phase 3. *Line:* "I remember Mahogany. I'm not letting them have this too."
**Beat-you (30%).** The rival reaches the 4th floor first and is trapped in the staff office by Ariana's Arbok (Hurt/Captured). Rescue: cross the static-filled corridor while the doors lock (3 steps). *Line:* "I could hear them from the stairwell. I had to try."
**Side-with (10%).** *Hook:* Rocket offered the rival the Red Gyarados, "freed" from the lake, and the rival believed it. *Foreshadow:* (1) the rival has a Gyarados they can't explain; (2) Petrel greets them by a nickname; (3) the rival's radio scrambles to the Tower's frequency.
> **Reveal:** The rival on the 4th floor: "They gave me a Pokémon I could never have caught. I didn't ask how."
> **Turn responses:** [Offer to release it together] (key for Friendly/Heir) / [Tell them what the pulse did to it] (key for Prodigy/Scholar) / [Challenge them to earn it fairly] (key for Hotshot/Mirror) / [Say you understand] (key for Bitter/Lone Wolf)

### 10.9 Resolution — The Call

The broadcast console blinks, a signal hanging open on every frequency.

**Choice:**
1. **[Cut the broadcast]** — The Tower falls silent. *Effects:* Peacemaker Emblem; Archer disbands the cell.
2. **[Reverse the signal]** — The pulse is turned on Rocket. *Effects:* `legend-lugia-shrine` Sighting flag planted; Rocket's Radio Wave Locks fail for the rest of the run.
3. **[Let it play]** — The call reaches the Boss. *Effects:* **Giovanni answers** (Region of Doom +1 Doom Level; Rocket in Kanto returns to Dominant); a later event: Giovanni's reply is a single sentence.

**Archer (if Cut):** "He'll never come. I knew it. I wanted to hear it said."

### 10.10 Stay Out — Offscreen Resolution (Johto flavor)

The broadcast runs for a night and a morning. Region effects: **Occupation** (Goldenrod's Tower is closed; rest nodes heal 50%), **Prices +15%**, **the Boss** (an answer comes from somewhere in Kanto). Rocket cells join the Region of Doom with the Tower's transmitter.

### 10.11 If You Fall (the run ends)

*A climax defeat ends the run. This is the scene and the Doom Ledger entry that close it.*

**Scene.** The screen goes to black. The party is on the floor. The leader speaks last.
> **ARCHER:** "Send the signal. All bands. Tell the Boss we are ready."
> **BROADCAST (voice-over):** Johto Radio & TV: "…Rocket has resumed operations. A statement will follow. It is already playing."

**What happens to the region.** The Tower stays Rocket's. Every radio in Johto carries the call; Giovanni, somewhere, answers. Rocket does not rule Johto; it speaks to it.
**Rival coda.** The rival's line for this moment is in `CLIMAX_RIVAL_INTEGRATION.md` §13 (by archetype and by the variant that was rolled).
**Impounded Pokémon.** Any still held are not returned. The Doom Ledger records `lost-with-impounded`.
**Doom Ledger entry.** `rocket-return.ended = triumphant`; `run.ended = climax-defeat`. A triumphant team enters the Region of Doom with +1 Doom Level.

## 11. Aftermath

- **If Cut:** Nadia Voss: "The Tower is back on the air. The transmitter has been dismantled."
- **If Reversed:** "The signal jammed every Rocket device in the region. Authorities are calling it a very expensive prank."
- **If Played:** "A reply was received. Officials are declining to comment on its contents."
- **Doom Ledger entry:** `rocket-return.ended = cut | reversed | played`.

## 12. Art and audio notes

- **Rocket:** black uniforms; Executives in white-trimmed coats; Archer with a dark overcoat and a stiff bearing.
- **Radio Tower:** a glass-and-steel spire with a dozen antennas; red light on the dish.
- **Music:** static layered over a slow march; the Boss's theme rises under the broadcast.
