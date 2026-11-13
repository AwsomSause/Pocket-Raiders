# 01 — KANTO: TEAM ROCKET
### Script: *The Silph Takeover*

> *"A boss is the one person in the building who is never in the room when it happens."* — Giovanni

**Team type:** Syndicate · **Primary team (CANON):** Team Rocket · **Returning team:** none (Rocket's later return is the Johto script)
**Climax:** The Silph Takeover — Silph Co. headquarters, Saffron City (Pseudo Region `pr.kanto.silph-tower`)
**Regional hooks:** Safari detour, Power Plant, city nodes, `legend-cerulean-cave` (`REGIONAL_IDENTITY.md` §3.1)
**Canon note:** Giovanni, Domino, Butch, Cassidy, Jessie, James and Meowth are canon characters. Their dialogue, the raids and the climax structure are original writing that follows the games' events (Mt. Moon, Celadon Game Corner, Pokémon Tower, Silph Co.). Species lists are my best recall of the games and anime and are marked in the roster; verify them against your source before shipping.

---

## 1. Profile

| Field | Value |
| --- | --- |
| Template | Syndicate (Boss → Executives and Agents → Scientists → Grunts) |
| Ideology | Pokémon are power, and power belongs to whoever is willing to take it |
| Primary objective | Seize Silph Co. and its Master Ball in one night, with the whole of Saffron sealed |
| Secondary objectives | Fund the operation through the Celadon Game Corner; strip Mt. Moon of fossils; sell what Pokémon Tower's ghosts will not protect |
| Preferred types | Poison, Ground, Normal, Dark (Rhyhorn line, Koffing line, Ekans line, Meowth line) |
| AI personalities | Strategist, Brawler, Opportunist |
| Mercy | 0.2 (Giovanni forgives nothing that costs him money) |
| Shadow method | **Capture Rig**, a Rocket-built harness that overrides a Pokémon's bond with a radio pulse |
| Colors / uniform | Black uniform, white gloves, a red R on the chest |
| HQ | The Celadon Game Corner basement; Silph Co. during the takeover |
| Lifecycle | 3 Established → 5 Dominant at climax |

## 2. Hierarchy and Roster

| Name | Rank | Title | Role | Ace / signature | Voice |
| --- | --- | --- | --- | --- | --- |
| **Giovanni** | Leader (7) | The Boss | Strategist | Rhyhorn, Dugtrio, Nidoqueen, Nidoking, **Rhydon** (ace); Persian beside him | Calm, courteous, absolutely cold |
| **Domino** | Commander (4) | Giovanni's Agent | Infiltrator / Handler | Persian, Raticate, Weezing *(species approximate)* | Silken, bored, sharp |
| **Butch** | Lieutenant (3) | Rocket Agent | Enforcer | Houndour line, Raticate *(approximate)* | Smug, a showman |
| **Cassidy** | Lieutenant (3) | Rocket Agent | Enforcer | Raticate, Golbat *(approximate)* | Brash, competitive |
| **Jessie** | Specialist (2) | Rocket Agent | Infiltrator | Ekans / Arbok, Wobbuffet, Lickitung *(anime)* | Theatrical, proud, always overreaching |
| **James** | Specialist (2) | Rocket Agent | Infiltrator | Koffing / Weezing, Growlithe, Victreebel *(anime)* | Dramatic, secretly gentle |
| **Meowth** | Specialist (2) | Rocket Agent | Scout | Meowth / Persian (the talking Pokémon himself) | Scheming, clever, resentful |
| **Rocket Scientists** | Specialist (2) | "Silph Researcher" | Scientist | Magnemite, Voltorb, Koffing | Detached |
| **Rocket Grunts** | Grunt (1) | "Rocket Grunt" | Enforcer | Rattata, Zubat, Koffing, Ekans, Machop | Tough, scared of the Boss |
| **Game Corner Guards** | Grunt (1) | "Casino Guard" | Enforcer | Raticate, Machoke, Drowzee | Bored |

> **Org chart:** Giovanni → Domino → (Butch, Cassidy) → (Jessie, James, Meowth) → Scientists → Grunts. Executives Archer, Ariana, Petrel and Proton are in Johto during this period (script 02).

## 3. Story Overview

**Logline:** Team Rocket is financing a takeover. The Game Corner's coins pay for it, Mt. Moon's fossils supply it, and Silph Co. is the prize: its Master Ball, its president, and its control of Saffron.

**Backstory.** Giovanni built Rocket out of a Pokémon trade that had no rules and a Gym that gave him a clean name. The Game Corner is the cashbox. The Gym is the alibi. Silph Co. makes the one device that would let a single trainer own any Pokémon alive.

**The twist.** The Master Ball is bait. Giovanni does not want to catch one Pokémon; he wants the Silph Scope and the ghosts in Pokémon Tower silenced, so that nothing he buys can tell on him. The takeover is a cover for a larger ledger of stolen Pokémon.

**Climax arc:** Saffron seals itself at dusk. Rocket holds Silph Co. The player must climb, break the lockdown and face the Boss.

## 4. Act 0 — Rumors

- **Mt. Moon trainer:** "There's a man in black at every fossil. They buy, then they don't ask."
- **Game Corner patron:** "The coin machine in the back never pays. Someone's very good at rigging it."
- **Kid at Cerulean:** "A guy in a black uniform stole my Pokémon. He had a talking Meowth with him."
- **Poster in Celadon:** "A fortune awaits at the Game Corner." (Intel +2: the poster's stamp is a red R.)
- **Item:** A dropped **Rocket coin** (Intel +2).

## 5. Act I — Ignition

*Trigger: after Gym 1–3. Outside Mt. Moon's cave, a pair in black uniforms and a talking Meowth are digging up a fossil.*

**Scene: The Dig**

> **JESSIE** *(dramatic, in a spotlight that does not exist)*: "A dig, and a fossil, and a stranger! Glorious. Hand over your Pokémon and kneel."
> **JAMES:** "Please don't kneel. We're under orders to be polite."
> **MEOWTH:** "We're under orders to be *successful*. Different thing."
> **PLAYER (choice):**
> 1. **"Is Rocket hiring?"** → Jessie, delighted, offers the Inside Man route: a black uniform and a "provisional agent" card. **Sets `rocket.insideman = true`, Heat −25.** *(Raids become infiltration variants.)*
> 2. **"Put it back."** → Meowth: "Never ask a Rocket to put it back." *(Battle: Jessie and James, a Multi Battle against two grunts.)*
> 3. **"I'll report you."** → James, quietly: "Please don't. It's a very bad month." *(Walk away; Heat +0; the pair remembers.)*
> *A Rocket Grunt hauls a crate of fossils toward a truck.*
> **GRUNT:** "Boss wants these in Celadon by morning."
> **PLAYER (choice):** Intervene (battle) / Follow the truck (Intel +3) / Ignore.
> **JESSIE (defeat):** "Blasting off again! But we'll be back. We're always back."

*Outcome: Team Rocket awake. Heat 20 (28 on battle).*

## 6. Pursuit — Ambush Dialogue

| Rank / Personality | Intro | Defeat |
| --- | --- | --- |
| Grunt — Rocket Grunt (Tough) | "Hand over your Pokémon, or I take them. Those are the two options." | "That wasn't one of them." |
| Grunt — Rocket Grunt (Nervous) | "I'm not supposed to lose. The Boss gets mad when we lose." | "Please don't tell the Boss." |
| Grunt — Casino Guard (Bored) | "House rules: no one leaves with the coins." | "House… takes a loss. Huh." |
| Grunt — Rocket Grunt (Opportunist) | "Nice team. Be a shame if it had to switch owners." | "Okay, okay. I was bluffing. Mostly." |
| Specialist — Silph Researcher (Detached) | "Your Pokémon is a valid test subject. Please hold still." | "Result: inconclusive. I'll file that." |
| Specialist — Jessie (Theatrical) | "Tremble, twerp! A Rocket agent has arrived!" | "Gaaah! We were so close this time!" |
| Specialist — James (Dramatic) | "I must apologize in advance. I'm quite good." | "Oh dear. I was winning in my head." |
| Specialist — Meowth (Scheming) | "Pay Day's mine. That's what I do. Pay up." | "Okay, okay! Ya got me. Next time, double." |
| Lieutenant — Butch (Smug) | "You're in my way. I never like that." | "A rare loss. Don't make it a habit." |
| Lieutenant — Cassidy (Brash) | "Move, or I move you. I don't care which." | "Hmph. Don't tell Butch." |
| Commander — Domino (Silken) | "The Boss asked me to take care of you. Politely." | "Oh. You're annoying. That's useful." |
| Commander — Domino (Bored) | "I've got a schedule. Don't make me late." | "Fine. Take your time. I'll take mine." |

## 7. Raid 1 — "Mt. Moon Fossil Dig"

**Offer (a ranger on the radio):** *"They've cleared half the cave of fossils and they're loading a truck. Stop them and you save the whole museum collection."*
**PR:** `pr.kanto.mt-moon-dig` — 3 levels: Cave Mouth → Fossil Hall → Loading Bay. **Security:** darkness (Flash), unstable ground, Zubat swarm.
**Objectives:** *Primary:* stop the fossil truck. *Secondary A:* recover the Helix or Dome fossil. *Secondary B:* defeat Jessie, James and Meowth.

**Key scene (Loading Bay):**
> **JESSIE:** "Prepare for the grandest failure of your life!"
> **JAMES:** "She means *ours*, probably."
> **MEOWTH:** "Don't confirm it!"
> *(Multi Battle: Jessie, James and Meowth against the player's two lead Pokémon; Trait: **Rocket Trio Routine**: once per battle, one of the trio's attacks is followed by an "improvised" second attack at half power; announced.)*
> **JESSIE (defeat):** "Blasting off again!" *(They are launched by a fallen crate and land three nodes away.)*

**Results (Lever: *The Fossils*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The truck is seized, the fossils returned, the trio humiliated | **Cashbox short:** Phase 1 −1 battle; the Silph guards are paid late | −3 |
| **Success** | Fossils recovered | Phase 1 −1 battle | −2 |
| **Partial** | Half the fossils saved | No change | −1 |
| **Failure** | The truck escapes | **Fossil money:** Rocket has funds for more guards; Phase 1 +1 battle | +2 |
| **Declined** | The cave is stripped | Unchanged | +1 |

**Failure consequences:** **C2 (Fine / Shakedown), C3 (Confiscation), C11.**

## 8. Raid 2 — "The Celadon Hideout"

**Offer (Erika's staff, or a Game Corner dealer):** *"The coin machine in the back opens onto a stairway. The basement is Rocket's real office."*
**PR:** `pr.kanto.celadon-hideout` — 4 floors: Game Corner → B1 Arcade → B2 Spin Maze → B4 Boss's Office. **Security:** spinner tiles, card-key locks, hidden doors.
**Objectives:** *Primary:* find the Lift Key and shut down the hideout's lift. *Secondary A:* free the dealer's kidnapped Pokémon. *Secondary B:* defeat Commander Domino.

**Key scene (B4):**
> **DOMINO:** "Giovanni told me someone would come this far. He said I'd enjoy it."
> *(Battle: Domino, with Persian, Raticate, Weezing, Arbok; Executive Ability: **Silk Glove**: once per battle, her active Pokémon is untouchable for one turn; announced.)*
> **DOMINO (defeat):** "You have my attention. That is dangerous."

**Results (Lever: *The Lift Key*):**

| Result | Immediate | Climax effect | OS |
| --- | --- | --- | --- |
| **Triumph** | The hideout empties; the Scope vault is open | **No retreat:** Giovanni cannot flee in Phase 4 (+1 Pokémon for him, no stalling) but his Persian is out | −3 |
| **Success** | The lift stops; the Scope found | Phase 2 −1 duel | −2 |
| **Partial** | The lift works but the lockdown trips | No change | −1 |
| **Failure** | You are locked in the Spin Maze and thrown out | **Escape route:** Giovanni has an extra Phase 4 Pokémon in reserve; +1 gauntlet battle | +2 |
| **Declined** | The hideout keeps running | Unchanged | +1 |

**Failure consequences:** **C1 (Impound: "kept in the Hideout"), C6 (Hostage), C11.**

## 9. Raid 3 — "Pokémon Tower" *(conditional)*

**Setup:** The ghosts of Pokémon Tower will not let Rocket pass; Rocket has taken Mr. Fuji hostage to remove them.
**PR:** `pr.kanto.pokemon-tower` — 2 floors; **Objectives:** free Mr. Fuji; use the Silph Scope; defeat Butch and Cassidy in a Double Battle (Houndoom, Raticate / Golbat, Arbok; Trait: **Rival Agents**: each boosts the other's Speed by 1 stage after a KO; announced).
**Results (Lever: *The Ghosts*):** Triumph: Fuji safe, the ghosts hunt Rocket (Phase 3 −1 Silph reinforcement wave); Success: Fuji safe; Partial: 0; Failure: the Tower is sealed and the Silph Scope is lost (+1 gauntlet); Declined: unchanged.

## 10. Climax — "The Silph Takeover"

### 10.1 News Report A

*Kanto Network News. Anchor: Mei Ling Ong. Chyron: BREAKING — SILPH CO. UNDER SIEGE.*

> **ANCHOR (Mei Ling Ong):** "Good evening. Silph Co. headquarters in Saffron City has been taken over by armed men in black uniforms. Staff say a red R is painted on the lobby floor."
> **ANCHOR:** "Police sources believe Team Rocket, an organization thought dormant, is demanding the company's Master Ball and the president."
> *(Camera: searchlights; black vans; a banner unrolling from the 11th floor reading ROCKET.)*
> **FIELD REPORTER:** "Saffron's gates have been shut. Traffic is being turned back. Nobody has been allowed in or out since six."
> *[Raid recap]* "Earlier, a trainer stopped a fossil truck at Mt. Moon…" / "The Celadon basement was partly shut down…" / "The Game Corner intervention failed."
> *(Freeze: the player at the Saffron gate.)* **Choice: [Take them on] / [Stay out of it]**

### 10.2 News Report B (rival beat you there)

> **ANCHOR:** "…witnesses saw a young trainer in {rivalOutfitTag}, with a {rivalAceType}-type Pokémon, slip through the guards at the rear entrance. Contact was lost on the 7th floor."
> **CHYRON:** `TRAINER INSIDE SILPH CO. — STATUS UNKNOWN`

### 10.3 The Choice
- **[Take them on]** → Pseudo Stage `PS-CLIMAX` begins. *(Situation Report accessible.)*
- **[Stay out of it]** → Offscreen Resolution (design doc §7.7); Silph resolves offscreen.
- **[Stand with them]** → `PS-CLIMAX-ALLIED` *(shown only if eligible: `rocket.insideman` set, reputation ≥ +45, not betrayed, no prior Turn; see `docs/STAND_WITH_THEM.md` and `scripts/10_STAND_WITH_THEM.md` §1)*.

### 10.4 Phase 1 — The Climb (Gauntlet)

*Gauntlet battles: 3 + round(OS/2), clamp 4–7. Rival variants adjust.*

| Floor | Trainer | Notes |
| --- | --- | --- |
| Lobby | Rocket Grunts ×2 | Poison/Normal; fluorescent light |
| 5F | Silph Researchers ×2 | Electric/Poison; Card Key lock |
| 7F | Cassidy | Normal/Dark; Trait: **Rival Agents** |
| 9F | Butch | Dark/Fire; mirrors Cassidy |
| 11F | Jessie, James and Meowth | Multi Battle; Trait: **Rocket Trio Routine** |

**Dialogue:**
> **CASSIDY:** "You're the pest? Good. I need the practice."
> **CASSIDY (defeat):** "Tch. Domino's going to laugh."

### 10.5 Phase 2 — The Officer

**Duel 1 — Domino, Giovanni's Agent** (Persian, Raticate, Weezing, Arbok, Mightyena; Executive Ability: **Silk Glove**, as in Raid 2.)
> **DOMINO:** "You came a long way to be disappointed."
> **DOMINO (defeat):** "Then he'll have to see you himself. I'm sorry for you."

**Duel 2 — (if Raid 3 declined or failed) Butch and Cassidy together** (Double Battle; Trait: **Rival Agents**.)

### 10.6 Phase 3 — The Set Piece: Saffron Sealed

*The company's emergency lockdown rolls down the stairwells. The president is on the 11th floor.*

**Objective:** Clear the **Card Key stations** (2–4 depending on Lever). Each is a battle in a hallway while **Rocket reinforcements** arrive every 3–4 turns (a Grunt joins the field, announced). **Timer:** 12 turns across the stations; each Raid result that cut the lockdown (Raid 1 or 2 Success or better) adds 1 turn.

**Broadcast (PA):**
> **GIOVANNI (voice):** "Saffron is closed. Ladies and gentlemen, please remain calm. The company is under new management."

**Complication:** If the Scope was not recovered (no Raid 3 Success), the Master Ball vault stays locked and a Rocket Scientist adds one more battle.

### 10.7 Phase 4 — Giovanni

*The President's office on the 11th floor, a city of lights behind him.* **Team:** Rhyhorn, Dugtrio, Nidoqueen, Nidoking, **Rhydon** (ace), with Persian at his side. **Doctrine: Earth Rule**: once per battle his Ground moves strike Flying and Levitating Pokémon as if Gravity were in effect (announced). **Boss phase:** at 50% ace HP, **The Boss Stands**: his Persian takes one hit for him, then he demands a recalculation; his ace gains +1 Defense.

> **GIOVANNI:** "You've been very tidy, coming all this way. I will be tidy in return."
> **PLAYER:** "Release the president."
> **GIOVANNI:** "A president is a signature. I need only the signature."
> *(Battle.)*
> **GIOVANNI (mid):** "Good. Show me what you've learned."
> **GIOVANNI (defeat):** "Ah. A decision I'll regret for a long time. I'll make others regret it too."

### 10.8 Rival variants (Kanto)

**Help (60%).** The rival fights in the stairwell, takes the 7th floor (Phase 1 −1) and holds a Card Key station in Phase 3. *Line:* "I remember that uniform from Mt. Moon. I'm ready this time."
**Beat-you (30%).** The rival reaches the 7th floor first; the lights go out and they are held by Cassidy in a supply room (Hurt/Captured). Rescue: cross the dark floor while the lockdown doors close (3 steps). *Line:* "I thought I could handle them alone. I couldn't."
**Side-with (10%).** *Hook:* a Rocket recruiter offered the rival a rare Pokémon in exchange for "a few small errands," and they took it. *Foreshadow:* (1) the rival carries a Rocket coin; (2) Meowth greets them by name; (3) their Pokémon has a Capture Rig scar.
> **Reveal:** The rival in the lobby: "I didn't think it would come to this. They gave me exactly what I asked for."
> **Turn responses:** [Offer to give it back together] (key for Friendly/Heir) / [Tell them it was never theirs to take] (key for Prodigy/Scholar) / [Challenge them to earn it fairly] (key for Hotshot/Mirror) / [Say you understand] (key for Bitter/Lone Wolf)

### 10.9 Resolution — The Master Ball

Silph's vault stands open. The Master Ball glints on its stand.

**Choice:**
1. **[Return it to Silph]** — The company reopens. *Effects:* Peacemaker Emblem; region reputation +15.
2. **[Destroy it]** — The vault blows its seal. *Effects:* `legend-cerulean-cave` Sighting flag planted; Rocket loses its prize for good.
3. **[Keep it]** — You walk out with it. *Effects:* a unique Key Item; Rocket Remnants (script 00) now hunt you; a later event: the Master Ball is stolen back.

**Giovanni (if Returned):** "Fine. The Ball is a symbol. I have others."

### 10.10 Stay Out — Offscreen Resolution (Kanto flavor)

Rocket holds Silph Co. for three days. Region effects: **Occupation** (Saffron gym trials suspended; city rest nodes heal 50%), **Prices +15%** (Silph supplies are scarce), **the Game Corner** (the hideout gains a branch). Rocket remnants join the Region of Doom with Silph's Master Ball prototype.

### 10.11 If You Fall (the run ends)

*A climax defeat ends the run. This is the scene and the Doom Ledger entry that close it.*

**Scene.** The screen goes to black. The party is on the floor. The Boss speaks last.
> **GIOVANNI:** "Take the Ball. Seal the city. And tell the rest of the region, from now on the lights are on my account."
> **BROADCAST (voice-over):** Kanto Network News: "Silph Co. has fallen. Team Rocket has issued a statement. It consists of one word: *thank you*."

**What happens to the region.** Silph is converted into Rocket's headquarters; Saffron's gates stay shut. Rocket does not rule Kanto outright; it rents out its protection to everyone.
**Rival coda.** The rival's line for this moment is in `CLIMAX_RIVAL_INTEGRATION.md` §13 (by archetype and by the variant that was rolled).
**Impounded Pokémon.** Any still held are not returned. The Doom Ledger records `lost-with-impounded`.
**Doom Ledger entry.** `rocket.ended = triumphant`; `run.ended = climax-defeat`. A triumphant team enters the Region of Doom with +1 Doom Level.

## 11. Aftermath

- **If Returned:** Mei Ling Ong: "Silph Co. has reopened. Its president has resumed his duties."
- **If Destroyed:** "The Master Ball is gone. Silph says it will build another. Nobody believes them."
- **If Kept:** "Silph is calling for a trainer to return the Ball. Rocket is calling for the same."
- **Rocket's fate:** Giovanni disappears; the Game Corner basement is left to the ghosts. Rocket reappears in Johto (script 02).
- **Doom Ledger entry:** `rocket.ended = returned | destroyed | kept`.

## 12. Art and audio notes

- **Rocket:** black uniforms, white gloves, red R; Giovanni in a dark suit with a Persian at his heel.
- **Silph Co.:** fluorescent halls, long corridors, a lobby with the R painted across the floor.
- **Music:** a polite orchestral loop that builds like a business meeting; the Boss's theme drops to a single piano.
