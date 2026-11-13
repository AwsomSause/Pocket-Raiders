# BETA 0.6 — YOU ARE (NOT) ALONE
## Design Document

*Goals, Evil Teams, the Regional Evil Team Arc, Raids, Climaxes, Pursuit, Hierarchy, Reputation, Operations, Leadership, Conflicts and World Events.*

*Companions in this pack:* `BETA_06_SYSTEM_ARCHITECTURE.md` · `BETA_06_IMPLEMENTATION_PLAN.md` · `SHADOW_POKEMON_SYSTEM.md` · `REGION_OF_DOOM.md` · `CLIMAX_RIVAL_INTEGRATION.md` · `scripts/*.md` (one scripted story per evil team) · `data/*` (catalogs).
*Builds on:* `THE_OVERHAUL_MASTER_PLAN.md`, `LIVING_WORLD_DESIGN_SPEC.md`, `RUN_NARRATIVE_GENERATOR.md`, `RECURRING_NPCS.md`, `REGIONAL_IDENTITY.md`, `RIVAL_MEMORY_REACTION_SYSTEM.md`.

> **Core philosophy:** the world is bigger, darker and more complicated than the player first realized. Every region hides an organization with a cause. You are not alone, and neither are they.

---

## 0. Scope, reading guide and assumptions

### 0.1 What changed from your Beta 0.6 text

Your original text defined four goals and seven pillars. All of them are kept. This document:

1. Adds the **Regional Evil Team Arc**: every region gets a scripted evil team story with optional raids, a news-report-opened climax, and rival involvement (§3–§8).
2. Adds the **Pursuit system**: once a team is provoked it can ambush you after nodes (§4).
3. Adds a full **hierarchy and roles** system for evil team trainers (§5).
4. Defines **Pseudo Regions and Pseudo Stages** as the container for raids, climaxes and other special content (§2).
5. Expands all seven original pillars with rules, numbers and tables (§9–§15).
6. Reconciles the persistent-world ideas with a run-based roguelike (§16).

### 0.2 Assumptions I made (please check these)

Your message left a few things open. These are the readings I used. Each is a data/config switch, so changing one does not mean rewriting the design.

| # | Assumption | Why | Where to change |
| --- | --- | --- | --- |
| A1 | **Every region has a canon evil team, with canon leaders and members (revised for the canon rewrite).** Kanto: Team Rocket. Johto: Team Rocket (Return). Hoenn: Team Aqua and Team Magma. Sinnoh: Team Galactic. Unova: Team Plasma (Black 2 / White 2 era). Kalos: Team Flare. Alola: Team Skull and the Aether Foundation. Galar: Macro Cosmos and Team Yell. Paldea: Team Star. **Two placeable returning teams** exist for any region (confirmed, D3): **Rocket Remnants** (Jessie, James and Meowth, Butch, Cassidy, Domino) and **Team Snag'em** (Gonzap, Wakin, Biden, Agrev). **Snag'em** also appears as a **side faction** in regions that already have an evil team. **Jessie, James and Meowth** are a **recurring trio** in every region (Sighting / Collision / Cache / Cameo, plus an ally or wild-card beat). | "rewrite EVERYTHING to fix the canon teams and leaders and their members (Also do Team Snag-em and Jessie/James/Meowth)" | `data/evil_teams.json` → `kind`, `region` |
| A2 | **Pseudo Region** = a self-contained map instance (a hideout, a raid zone, a climax site) that is entered from the normal map but is not part of the region's normal node graph. **Pseudo Stage** = a stage inserted into the run's stage sequence that does **not** advance the normal stage/difficulty counter. Neither term was defined in the files I could see, so §2 defines them. | You asked me to use them for raids and climaxes. | §2 |
| A3 | "**Sets off** the evil team" = the player triggers the **Ignition** scene (the first scripted confrontation) or otherwise provokes the team (accepting a raid, defeating a named member). From then on the team can **ambush** the player after nodes. | Natural reading of "once the trainer sets off the evil team." | §4 |
| A4 | Each region has **eight Gyms/Trials/Challenges**. The climax is rolled uniformly from **after Gym 6, 7 or 8**. Regions with fewer than eight clamp to the last three (`[N−2, N]`) (**confirmed**). | "After the 6–8th gym leader." | §3.3 |
| A5 | "**Beat you there**" = the rival reaches the evil team's climax site before you and engages them first. It is *not* a race the player can lose the run over. | Matches your news-report rule. | `CLIMAX_RIVAL_INTEGRATION.md` |
| A6 | A **raid loss does not end the run**, but it triggers heavy consequences (§6.5). **Losing the climax ends the run (confirmed).** The "stay out of it" choice is the safe alternative with its own costs. | You said raids may be lost and confirmed the climax may not. | §7.7, §7.8 |
| A7 | **Persistence:** faction state persists within a run by default. A **World Save** option (campaign mode) and the **Doom Ledger** (cross-run meta) are layered on top. **Confirmed (D7).** | The master plan is a roguelike; your Beta 0.6 text assumes a persistent world. | §16 |

### 0.2b Decisions you confirmed

| # | Your decision | Where it is applied |
| --- | --- | --- |
| D1 | **Losing the climax ends the run** | §7.8; defeat endings in each script (§10.11); rival defeat lines in `CLIMAX_RIVAL_INTEGRATION.md` §13 |
| D2 | **Impounded Pokémon:** about ten nodes after the Impound, or at the climax at the latest, **your rival comes to you with a plan** to get them back (dialogue for every rival type) | §6.5 (C1), `RIVAL_RESCUE_PLAN.md`, `PS-RESCUE` (§2.3) |
| D3 | **Any region should be good for returning teams** | §3.1, `RETURNING_TEAMS_ANYWHERE.md` (placement modes, module, 18 kits) |
| D4 | **Regions with fewer than 8 Gyms/Trials clamp** the climax roll | §0.2 A4, §3.3 |
| D5 | **Shadow Pokémon can be permanent party members** | §10, `SHADOW_POKEMON_SYSTEM.md` §12 |
| D6 | **"Stand with them" ships at launch** (the Inside Man climax route) | §12.4, §7.2, Appendix B, `STAND_WITH_THEM.md`, `scripts/10_STAND_WITH_THEM.md` |
| D7 | **Persistence is per-run**, with the always-on Doom Ledger; World Save stays opt-in | §16 |
| D8 | **A second rival exists** in some regions | §8, `SECOND_RIVAL.md` |
| D9 | **`climax.allowWithdraw` stays off by default.** (You asked what it is: an optional setting that lets a player pull out *between* climax phases. A withdrawal counts as "Stay out", one band worse on the Offscreen table, with no emblem. Off means the climax is a commitment.) | §7.8 |

### 0.3 Naming of rivals, characters and places

- **Canon rewrite:** the teams, leaders and members are canon characters. Their **dialogue, scenes, raids and climaxes are original**, adapted from the games' plots. Species lists are my recall (marked approximate) and must be verified. Nothing is copied from the games' scripts.
- Where the document says "the rival", it means the run's rival from `RIVAL_MEMORY_REACTION_SYSTEM.md` (8 archetypes).

---

## 1. Vision, goals and pillars

### 1.1 The four goals (unchanged)

| Goal | Statement |
| --- | --- |
| A | Evil Teams are **organizations**, not scattered NPCs |
| B | Villainy is an **active part of the world** |
| C | Shadow Pokémon are a **meaningful gameplay system** |
| D | A new **antagonist-focused region** exists (the Region of Doom) |

### 1.2 The seven pillars and the two layers

The seven pillars (A Evil Team System, B Shadow Pokémon, C Region of Doom, D Reputation & Allegiance, E Operations & Infiltration, F Leadership & Progression, G Conflicts & World Events) are organized into **two layers**:

| Layer | What it is | Pillars | Player experience |
| --- | --- | --- | --- |
| **Regional Story Layer** *(new in this document)* | One scripted evil team arc per region, delivered through Pseudo Stages | A, B, D, E (focused) | Every run has a guaranteed, authored, escalating villain story with a big payoff |
| **Simulation Layer** | Teams that act on their own: resources, wars, succession, events | A, F, G, C | The world feels alive; the Region of Doom is a living political map |

The Regional Story Layer is the **guaranteed spine**. The Simulation Layer **decorates and complicates** it: it changes which team members appear, what shape the situation is in at the climax, and what is happening in the Region of Doom.

### 1.3 Design promises

1. **Every region has a villain story with a beginning, a middle and a huge ending.**
2. **Your choices matter:** optional raids change the climax.
3. **You can fail and survive:** raids can be lost without losing the run, at a cost.
4. **The rival is part of the story** at the climax, every time.
5. **Villains are people:** hierarchy, personalities, internal conflicts, voices.
6. **Villains can win** (offscreen and onscreen).
7. **Nothing is hidden or unfair:** every consequence and every modifier is shown in a Situation Report before the climax.

---

## 2. Pseudo Regions and Pseudo Stages

### 2.1 Definitions

| Term | Definition |
| --- | --- |
| **Region** | A normal map region with its own node graph, Gyms, trainers, events (e.g. Kanto). |
| **Pseudo Region (PR)** | A map instance with its own rooms/nodes, rules, environment pool and exits, entered from a normal node and exited back to it. It is not part of the region's regular progression graph and has no Gym count of its own. Examples: a hideout, a raid zone, the climax site. |
| **Stage** | One step of the run's linear progression (stage index drives difficulty, see master plan §10). |
| **Pseudo Stage (PS)** | A scripted step inserted *between* stages (or after a Gym). It does **not** increment `stageIndex`, and uses the difficulty of the stage it was inserted after, plus a stated offset. Examples: the News Report, a Raid, the Climax, the Aftermath. |

A Pseudo Stage usually *contains* a Pseudo Region; a Pseudo Region may exist without a Pseudo Stage (e.g., a recurring hideout the player can revisit, or a Region of Doom district).

### 2.2 Why use them

- Raids and climaxes need **bespoke maps**, **bespoke rules** (alarms, timers, floors, multi-phase bosses) and **bespoke scripting** that do not fit ordinary routes.
- They must not warp the run's **difficulty curve** or **node counts** (master plan §10, §17).
- They need **checkpoints, retreat rules and a clean exit** so a failed raid returns the player to the world.
- They give a single, consistent mechanism for **everything special**: news reports, raids, ambush micro-scenes, the climax, aftermath and Region of Doom districts.

### 2.3 Uses (catalog)

| Id | Type | Name | Contains PR? | Counts as stage? | Lives |
| --- | --- | --- | --- | --- | --- |
| `PS-NEWS` | PS | News Report | No (UI scene) | No | 25–40 s, skippable after first view |
| `PS-RAID` | PS | Raid | Yes (hideout/zone) | No | 6–12 min |
| `PS-CLIMAX` | PS | Climax | Yes (climax site) | No (but uses boss tier of stage + 1) | 15–25 min |
| `PS-AFTER` | PS | Aftermath | Optional | No | 2–4 min |
| `PS-AMBUSH` | micro-PS | Pursuit encounter | No (inline) | No | 1–3 min |
| `PS-INFIL` | PS | Infiltration run (stealth variant) | Yes | No | 8–12 min |
| `PS-RESCUE` | micro-PS | Rival's Rescue Plan for impounded Pokémon (3 beats at an annex of the holding site) | Yes (reuses a raid map) | No | 4–7 min |
| `PS-DOOM-x` | PR | Region of Doom district | Yes | Persistent (Doom Ledger) | open |
| `PR-HQ-x` | PR | Evil Team headquarters | Yes | Used by raids/climax | — |

### 2.4 Pseudo Stage definition (schema)

```ts
interface PseudoStage {
  id: string;                         // "ps.raid.kanto.ledger.r1"
  kind: "news" | "raid" | "climax" | "aftermath" | "ambush" | "infiltration";
  insertAfter: InsertRule;            // "gym:4" | "node:after-ambush" | "stage:climax"
  pseudoRegion?: PseudoRegionId;      // map to load, if any
  difficulty: { baseFrom: "previous-stage"; offsetLevels: number; aiTierMin: number };
  rules: PseudoRules;                 // timers, alarms, retreat, wipe handling
  objectives?: Objective[];           // see §6.2
  phases?: Phase[];                   // climax and big raids
  entry: { choice?: "optional" | "forced"; requires?: Condition[]; cost?: Cost };
  exit: { onResult: Record<ResultId, ExitSpec> };
  checkpoints: CheckpointSpec[];
  scriptRef: string;                  // "scripts/01_KANTO_TEAM_LEDGER.md#raid-1"
}

interface PseudoRegion {
  id: string;                         // "pr.kanto.ledger.exchange"
  rooms: RoomGraph;                   // nodes/rooms/floors, doors, keys
  environmentPool: EnvironmentId[];
  conditions: ConditionId[];          // announced battlefield conditions allowed here
  security?: SecuritySpec;            // alarms, patrols, cameras (see §13.3)
  entrances: Entrance[];
  exits: Exit[];
  persistence: "ephemeral" | "run" | "world";
}
```

### 2.5 Lifecycle rules

1. **Insertion.** The Pseudo Stage is scheduled at run start (positions are seeded) and re-validated before it appears.
2. **Entry.** Optional PS shows an invitation with a clear **risk preview** (what you could lose and gain). Forced PS (News, Climax once chosen) require confirmation.
3. **Isolation.** Inside a PR, normal progression systems pause: no new region events, no Gym progress, no stage increments. Faction simulation continues in compressed form (see §16.4).
4. **Checkpoints.** Each PS has checkpoints (e.g. after floor 1, after the commander). A wipe returns to the last checkpoint **once per raid** if the player accepts "Fall back"; otherwise it resolves as a Failure.
5. **Resource carry.** Party HP/PP and consumables carry in. Raid-only items (keycards, disguises) are dropped on exit.
6. **Exit.** Every PS ends in a **ResultId**: `triumph | success | partial | failure` (raids), `victory | stayed-out | defeat` (climax). The result writes flags and consequences (§6.4–§6.6, §7).
7. **Difficulty.** Level and AI tier are taken from the *previous* stage; the PS adds its own offset (see §6.3, §7.4). Pseudo Stages do **not** increase the stage-based reward ramp, but have their own reward tables.
8. **Save/Quit.** Saving inside a PS is allowed at checkpoints only. Quitting from inside a PS resumes at the last checkpoint.
9. **No dead ends.** The player can always exit a PR (by retreat, extraction or defeat) without softlocking; there is an automated test for this (§25 in implementation plan).

### 2.6 Interaction with the rest of the run

| System | Rule |
| --- | --- |
| Run Event Log | A PS writes `ps_enter`, `ps_checkpoint`, `ps_exit`, plus all usual battle events |
| Narrative generator | Raids/climax are `Crisis`-class beats; the Regional Evil Team Arc is a `mustClose` thread |
| Rival | Rival beats do not happen inside raids; the rival appears in the climax (§8) |
| Pokémon memories & chemistry | Normal; raids and climaxes create strong signature moments |
| Shops/rest | Not available inside a PS except where scripted |
| Modifiers | Run modifiers apply; stacking caps are unchanged (env + weather + condition + regional ≤ +30%) |

---

## 3. The Regional Evil Team Arc

### 3.1 Team assignment

| # | Region | Primary team (CANON) | Second team (CANON) | Org type | Script file |
| --- | --- | --- | --- | --- | --- |
| 0 | Any | **Rocket Remnants** (placeable) | **Team Snag'em** (placeable / side faction) | Roaming cells | `00_ROAMING_CAST.md` |
| 1 | Kanto | **Team Rocket** | — | Syndicate | `01_KANTO_TEAM_ROCKET.md` |
| 2 | Johto | **Team Rocket (Return)** | — | Syndicate in reorganization | `02_JOHTO_TEAM_ROCKET_RETURN.md` |
| 3 | Hoenn | **Team Aqua** | **Team Magma** | Company / Corporation | `03_HOENN_TEAM_AQUA_AND_MAGMA.md` |
| 4 | Sinnoh | **Team Galactic** | — | Paramilitary | `04_SINNOH_TEAM_GALACTIC.md` |
| 5 | Unova | **Team Plasma** (BW2) | — | Order | `05_UNOVA_TEAM_PLASMA.md` |
| 6 | Kalos | **Team Flare** | — | Corporation | `06_KALOS_TEAM_FLARE.md` |
| 7 | Alola | **Team Skull** | **Aether Foundation** | Gang / Foundation | `07_ALOLA_TEAM_SKULL_AND_AETHER.md` |
| 8 | Galar | **Macro Cosmos** | **Team Yell** | Corporation / Fan club | `08_GALAR_MACRO_COSMOS_AND_TEAM_YELL.md` |
| 9 | Paldea | **Team Star** | — | Crew | `09_PALDEA_TEAM_STAR.md` |

*Canon note.* The leaders and members are canon characters; the dialogue, scenes and raids are original and follow the games' plots. Species lists are my recall and are marked approximate; verify before shipping.

*Second teams and roaming teams:* in Hoenn (Magma), Alola (Aether) and Galar (Team Yell) the second team is a **separate faction** with its own members, hierarchy and dialogue. Unova's Team Plasma is the BW2-era reorganization and Johto's Rocket is the post-Giovanni reorganization. The two **placeable roaming teams** (Rocket Remnants and Snag'em) can be dropped into any region as the region's own evil team (D3) or, for Snag'em, as a side faction in regions that already have one (50%). The **recurring trio** appear in every region as comic ambushers, uneasy allies and Stand-with wildcards (`scripts/00_ROAMING_CAST.md` §7).

Hoenn, Sinnoh and Kalos each also contain environmental hooks from `REGIONAL_IDENTITY.md` (weather swing, snow and ruins, Mega stones). Johto, Alola, Galar, and Paldea tie into the regional chains `legend-lugia-shrine`, `legend-sun-moon-shrine`, `legend-eternal-crisis` and `legend-ruin-quartet-shrine`.

### 3.2 Arc timeline

```
GYM  1    2    3    4    5    6    7    8
     │    │    │    │    │    │    │    │
Act 0 ─Rumors (world signs, NPC lines)─────────────────────────────►
     │  Ignition (Gym 1–3 window)
     │       └─ Pursuit begins: ambush chance after nodes ──────────►
     │            Raid 1 offered   (after Gym G-4..G-3)
     │                      Raid 2 offered (after Gym G-2..G-1)
     │                           [Raid 3 conditional, optional]
     │                                    CLIMAX SCHEDULED
     │                                    └─ News Report → Choice → Climax PS
     │                                                           Aftermath PS
G = climax gym ∈ {6, 7, 8}
```

| Beat | Window | Pseudo Stage | Required? |
| --- | --- | --- | --- |
| **Act 0 — Rumors** | From the region's first node | none | auto |
| **Ignition** | After Gym 1–3 (seeded) | micro PS (`PS-AMBUSH`-style scripted scene) | auto (forced scene), but the player may respond in several ways |
| **Pursuit** | Ignition → Climax | `PS-AMBUSH` | auto |
| **Raid 1** | After Gym `G−4` to `G−3` (min 2) | `PS-RAID` | **optional** |
| **Raid 2** | After Gym `G−2` to `G−1` | `PS-RAID` | **optional** |
| **Raid 3 ("Last Light")** | Between Raid 2 and the climax; only offered if the first two raids resulted in ≥ 1 `failure` *or* both `triumph` | `PS-RAID` | **optional**, bonus/last-chance |
| **Climax scheduled** | Immediately after Gym `G` | `PS-NEWS` | auto |
| **Climax** | After the player chooses "Take them on" | `PS-CLIMAX` | optional (choice) |
| **Aftermath** | After climax or stay-out | `PS-AFTER` | auto |

At least **two** optional raids are always offered before the climax (Raid 1 and Raid 2). Raid 3 is a conditional bonus.

### 3.3 Climax gym roll

At the start of each region, a seeded roll picks **G ∈ {6, 7, 8}** with equal probability (uniform, 1/3 each). The roll is stored in the Narrative State and cannot be re-rolled. Regions with fewer than 8 Gyms/Trials clamp to `[N−2, N]`; the climax is always after a Gym/Trial, never before Gym 6.

**Rules:**

- The climax News Report appears **after the Gym leader of Gym G is defeated** and the Gym's victory scene ends.
- If the player has not yet done the **Ignition**, the system forces Ignition at the latest after Gym 4 (so there is always an arc).
- If the player skipped both raids, the climax still happens; the Situation Report shows "unchecked operations".
- The Gym count after the climax continues normally (if G is 6, Gyms 7–8 follow after the Aftermath; the Elite Four/Champion remain at the end of the region).

### 3.4 Region-by-region climax summary (links to scripts)

| Region | Climax name | Climax site (Pseudo Region) | Set piece | Legendary hook |
| --- | --- | --- | --- | --- |
| Kanto | **The Silph Takeover** | Silph Co. headquarters, Saffron City | Floor-by-floor seizure; Saffron sealed | `legend-cerulean-cave` Sighting flag |
| Johto | **The Radio Tower** | Goldenrod Radio Tower | Rocket's broadcast takes over every frequency | `legend-lugia-shrine` Sighting flag |
| Hoenn | **The Awakening** | Cave of Origin, Sootopolis | Aqua or Magma wakes the weather primal | `legend-weather-crisis` flag |
| Sinnoh | **The Spear Pillar** | Summit of Mt. Coronet | The Red Chain calls the creation trio | `legend-time-space-trial` flag |
| Unova | **The Frozen Crown** | Giant Chasm and Plasma Frigate | The Crown is raised; the dragon is bound | `legend-unova-dragons` flag |
| Kalos | **The Ultimate Weapon** | Team Flare Secret HQ, Geosenge | Life-force becomes a weapon | `legend-xerneas-yveltal` Sighting flag (Mega Stone reward) |
| Alola | **The Beast of Paradise** | Aether Paradise and the Ultra Wormhole | The Gate opens; Skull was the decoy | `legend-sun-moon-shrine` / Ultra Beast Sighting flag |
| Galar | **The Darkest Day** | Rose Tower and the Energy Plant | Dynamax pulses blanket the region | `legend-eternal-crisis` flag |
| Paldea | **Starfall Street** | Mesagoza's long avenue | The Star Barrage staged by five Bases | `legend-paradise` flag |

---

## 4. Ignition and Pursuit

### 4.1 Awakening ("setting off") the team

A team is **dormant** until one of these happens (first to occur):

- The player plays the team's **Ignition** scene (scripted, between Gym 1 and Gym 3).
- The player **defeats a named member** of the team in an event chain.
- The player **accepts or fails** a raid offer.
- The player **steals from, rescues from, or refuses a recruitment** offer by the team.

When awakened: `team.state = "awake"`, `Heat = 20`, `pursuit.enabled = true`.

### 4.2 Heat

**Heat (0–100)** is how closely the team is watching the player.

| Event | Δ Heat |
| --- | --- |
| Defeat a Grunt | +3 |
| Defeat a Specialist / Commander | +6 |
| Defeat an Executive | +10 |
| Win an ambush | +2 (win) / +0 (lose, see §4.5) |
| Attempt a raid | +8 |
| Raid result `triumph` | +4 extra (they respect/fear you) |
| Rescue a Pokémon from the team | +5 |
| Take their recruitment offer | −25 (and sets *Inside Man* flag; see §12.4) |
| Each node with no team contact | −2 (floor at 10 once awake) |
| Use a Decoy Tag | −5 |
| Region's climax is scheduled | set to ≥ 60 |

### 4.3 Ambush rules ("a chance to force a battle after a node")

After each eligible node, if the team is awake and pursuit is enabled, roll for an ambush.

```
ambushChance = clamp( 0.10 + 0.002 * Heat , 0.10 , 0.30 )
               × 0.5 if climaxScheduled
               × 0.0 if gap < minGap or cap reached
```

| Parameter | Value |
| --- | --- |
| Eligible nodes | Any completed battle, event, or route node. **Not** Gym, boss, rival, legendary, raid, shop, rest, or the node directly after another ambush. |
| `minGap` | 2 nodes since the last ambush |
| Pity | Forced ambush if 7 eligible nodes pass with no ambush |
| Cap | 6 ambushes per region before the climax is scheduled |
| Battle type | Single trainer, forced. Cannot be fled. |
| Telegraph | A 1.5 s "You're being followed…" splash and a team-themed sting; a subtle pre-ambush *Tail* icon shows in the HUD if Heat ≥ 50 |
| Counterplay | **Decoy Tag** (consumable, shop or reward) cancels one ambush; an ambush can also be bribed away once per region with a team-themed item the player holds (shown in the Notebook) |
| Same trainer repeat | A defeated named ambusher is not drawn again unless promoted (§5.6) |

### 4.4 Ambusher composition by Heat tier

| Heat | Tier | Ambusher | Team size | AI tier | Notes |
| --- | --- | --- | --- | --- | --- |
| 10–29 | T1 | Grunt | 2 | 1 | Basic, team-themed |
| 30–54 | T2 | Grunt or Specialist | 2–3 | 1–2 | Specialist may use a gadget (see §5.4) |
| 55–79 | T3 | Commander (30%) or Specialist | 3–4 | 2–3 | Commander line + intel drop |
| 80–100 | T4 | Executive (max 2 per region) | 4 | 3 | Rare; story-relevant |

If the team has two sub-factions (a second team or a placed roaming team is present), the roll picks the faction by weights (primary 70% / second 30%) and uses that faction's roster and dialogue.

### 4.5 Ambush outcomes and rewards

| Outcome | Effect |
| --- | --- |
| **Win** | Money, a team-themed drop, **+4 Intel**, **−1 Operational Strength** (§4.6); rarely a rescue key |
| **Loss** | Standard defeat rules apply (ambushers are ordinary trainers, scaled fairly; they never exceed the difficulty of the node preceding them) |

> Ambush difficulty is capped at **the previous stage's trainer tier + 0** (not +1). They are meant to be harassment and attrition, not walls.

### 4.6 Intel and Operational Strength

- **Intel (0–100)** is gathered from ambushes, raids, NPC tips and documents. It feeds the **Situation Report** (§7.3): at 25/50/75 Intel the report reveals more about the climax (phases, boss team type, hazards, rival variant hints).
- **Operational Strength (OS)** is a number (default 10) representing how many squads the team can field at the climax. Each ambush win, raid success and sabotage reduces it; raid failures and skipped raids increase it (§6.6). OS directly sets the number of **gauntlet battles** in Climax Phase 1 and the number of reinforcements in Phase 3.

---

## 5. Hierarchy and Roles

### 5.1 Principles

1. **Ranks are gameplay.** A rank sets team size, AI tier, items, behaviors, rewards, dialogue register and where the trainer can appear.
2. **Structure reflects the organization.** A cult, a corporation and a gang do not share a ladder; each team uses a *template* (§5.5) with its own titles.
3. **People, not slots.** Every named member has a rank, a role, a personality, an ace and a place in the org chart (see each script's roster).
4. **Promotion is real.** Ranks change during a run (§5.6).

### 5.2 The universal ladder

Teams map their own titles onto this ladder. Tier numbers are used by systems; titles are cosmetic.

| Tier | Rank | Generic title | Typical count (large team) | Team size | AI tier | Held items | Appears in |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | **Associate** | Independent / hired hand | many | 1–2 | 0–1 | none | wild scenes, events |
| 1 | **Grunt** | Footsoldier | 40+ | 2 (3 late) | 1 | none–1 | ambush T1/T2, hideouts, raids |
| 2 | **Specialist** | Technician / Handler / Scout / Medic | 12 | 3 | 1–2 | gadget or item | ambush T2/T3, raid floors |
| 3 | **Lieutenant** | Squad leader / Enforcer | 6 | 3–4 | 2 | 1–2 | raid floor bosses, ambush T3 |
| 4 | **Commander** | Operation commander | 4 | 4 | 2–3 | 2 | raid bosses, ambush T3/T4 |
| 5 | **Executive** | Administrator / Director / Prelate | 2–3 | 4–5 | 3 | 3 | raid 2/3 bosses, climax gauntlet, ambush T4 |
| 6 | **Second** | Right hand | 1 | 5 | 3 | 3 + signature | climax Phase 2 |
| 7 | **Leader** | Founder / Chair / Captain | 1 | 6 | 3–4 | full + signature | climax Phase 3 (boss) |

### 5.3 Roles (what a person does)

Roles are orthogonal to rank. A rank 2 Handler is different from a rank 2 Medic.

| Role | Function in the organization | Gameplay signature | Typical rank band |
| --- | --- | --- | --- |
| **Enforcer** | Muscle; guards and chases | Plain high-power teams, Intimidate users | 1–4 |
| **Handler** | Controls Shadow/captured Pokémon | Shadow Pokémon on team (limited); Shadow Gauge shown (see Shadow doc) | 2–4 |
| **Technician** | Devices, security, vehicles | Gadget items; can trigger terrain/hazard once per battle | 2–4 |
| **Scientist** | Experiments, refining | Experimental Pokémon, status specialists, "Prototype" ability | 2–5 |
| **Recruiter** | Brings people in | Persuasion dialogue, offers; weaker teams but leaves gifts | 2–3 |
| **Scout** | Intelligence and tailing | Ambusher; reveals Intel on defeat | 1–3 |
| **Quartermaster** | Money, supplies, items | Item-heavy teams; shop access when Allied | 2–4 |
| **Infiltrator** | Disguise, sabotage | Appears disguised; fake-out reveal | 2–4 |
| **Medic** | Heals, revives | Revives and heals mid-battle (limited) | 2–3 |
| **Spokesperson** | Public face and media | Appears in news reports; negotiation scenes | 3–5 |
| **Strategist** | Plans operations | Uses counters (rival-style counter rule, cost 1) | 4–6 |
| **Zealot** | True believer | Fights past 25% HP w/o fleeing; special defeat lines | 1–5 |
| **Defector-risk** | Doubts the cause | Can be turned by dialogue/choices (§14.5) | 1–5 |

### 5.4 Rank gameplay details

**Grunt (Tier 1).** Two Pokémon from the team's type pool, no items, AI 1. Late in the arc, 3 Pokémon. Grunts have *personality variants* (Cheerful, Nervous, Fanatic, Bored, Opportunist, Reluctant) that affect dialogue and a small number of behaviors (e.g., a Reluctant grunt may offer a bribe-exit once).

**Specialist (Tier 2).** Three Pokémon. A **specialist tool** (once per battle): *Smoke Canister* (−1 accuracy to both sides' first move), *Signal Jammer* (disables one item use by the player for 2 turns, announced), *Field Kit* (revive one fainted Pokémon at 25%, announced) etc. Tools are telegraphed on the intro banner. Fairness: tools are opt-in per role and shown.

**Lieutenant (Tier 3).** Squad leader; 3–4 Pokémon, AI 2; leads a floor. Defeating a Lieutenant drops a **Keycard** or **Intel**.

**Commander (Tier 4).** Four Pokémon, AI 2–3; one **Operation Trait** (a stated, visible, team-themed rule such as "Tide Lock: this commander's team starts with rain for 3 turns; announced"). Traits obey the stacking caps. Commanders are raid bosses.

**Executive (Tier 5).** Four to five Pokémon, AI 3; an **Executive Ability** (one per battle, announced) and a counter slot (cost ≤ 2) against the player's most-used tactic (rival counter rule, `RIVAL_MEMORY_REACTION_SYSTEM.md` §11.4).

**Second (Tier 6).** Five Pokémon, AI 3, signature item, two Executive Abilities; the Climax's Phase 2 duel.

**Leader (Tier 7).** Six Pokémon, AI 3–4, boss phase mechanic (spec §16), Leader Doctrine (one rule that changes the field, telegraphed, no more than +10% in either direction), final speech.

### 5.5 Organization templates

Each team uses one template. The ladder maps to titles and spans.

| Template | Used by | Structure | Notes |
| --- | --- | --- | --- |
| **Syndicate** | Rocket (both scripts), Rocket Remnants, Team Snag'em | Boss → Executives → Agents → Grunts | Chain of favors; theft |
| **Order / Cult** | Team Plasma | Sages → Executives → Grunts | Faith and rank by devotion |
| **Company** | Team Aqua | Leader → Admins → Grunts | Contracts, pay grades |
| **Corporation** | Team Magma, Team Flare, Aether Foundation, Macro Cosmos | Chair → Directors → Managers → Associates | Departments, HR; reorganizations |
| **Paramilitary** | Team Galactic | Commander → Admins → Squad leaders → Troopers | Uniform, discipline |
| **Gang** | Team Skull, Team Yell, Team Star, Region of Doom custom teams | Boss → Lieutenants → Crew | Loose |

Template determines: the number of ranks, titles, promotion mechanics, whether grunts are **numbered/uniformed** (military) or **colorful** (gang), and how coups happen (§14.3).

### 5.6 Promotion, demotion and replacement

Within a run, the arc changes ranks:

| Trigger | Result |
| --- | --- |
| A named Lieutenant defeats the player in an ambush (loss) | Promoted to Commander at next appearance (+1 Pokémon, new line) |
| A named Commander is defeated twice | **Demoted** (loses a Pokémon, bitter dialogue) or **disgraced** (leaves) |
| A Lieutenant is killed off in a script beat | A Grunt is **promoted** to fill; gets a named line |
| Executive defeated at raid | Position **vacant**; the Second may fill it (changes the climax gauntlet) |
| Leader weakened (raids) | The Second may stage a *coup attempt* (see §14.3) |

Promotion rules exist so the team doesn't feel like a static pool.

### 5.7 Uniforms and presentation per rank

- **Grunt:** full uniform; masks or number badges.
- **Specialist:** uniform + role insignia.
- **Lieutenant:** modified uniform, a coat or sash.
- **Commander:** distinctive outfit, a signature prop.
- **Executive:** formal or ceremonial dress.
- **Second/Leader:** unique art (PixelLab prompt cards are in each script).

### 5.8 Org chart view (UI)

The Notebook (shared with the Rival Notebook UI) shows an **Org Chart** for each awake team: portraits (silhouettes until met), rank, role, status (active / defeated / promoted / missing), plus **Intel-gated** hints. Unknown members show "?" until Intel reveals them.

---

## 6. Raids

### 6.1 Raid framework

A **Raid** is an optional Pseudo Stage in which the player assaults a team facility or operation. The raid has a **pseudo region** (the facility), **three objectives**, **floors/rooms**, and **an outcome** that affects the climax.

```
Offer (risk preview) → Prepare (party/items/Intel) → Enter PR
→ Floor 1 → (checkpoint) → Floor 2 (commander) → Primary Objective
→ [Secondary objectives optional] → Extract → Result + Consequences
```

### 6.2 Objectives

Every raid has:

| Slot | Meaning |
| --- | --- |
| **Primary** | The thing that matters (e.g., "free the impounded Pokémon", "destroy the generator", "recover the ledger") |
| **Secondary A** | A bonus (e.g., "steal the keycard cache", "rescue the scientist") |
| **Secondary B** | A risk-reward (e.g., "defeat the Commander", "finish without tripping the alarm") |

### 6.3 Results

| Result | Condition | Notes |
| --- | --- | --- |
| **Triumph** | Primary + both Secondary objectives complete, no wipe | Best outcome |
| **Success** | Primary + at least one Secondary, no wipe | Strong outcome |
| **Partial** | Primary complete but retreat/extraction forced (alarm, time) or Secondary both failed | Mixed |
| **Failure** | Primary not completed, **or** a full party wipe **or** player aborts early | Heavy consequences, **run continues** |
| **Declined** | Player refuses the offer | No penalty; the operation proceeds (§6.6) |

**Difficulty:** raids use `previous stage level + 1` with team tier AI 2–3. Floors are arranged so a balanced party for that stage wins ~55% of raids (target band 50–65% for Success or better; see implementation plan).

### 6.4 Wipe handling ("allowed to lose and not lose the run")

When all party Pokémon faint inside a raid:

1. The raid ends immediately with **Failure**.
2. The player is **expelled** from the Pseudo Region (a short scripted exit: arrested, thrown out, dragged off, left at the gate…).
3. Party Pokémon are **healed to 1 HP / 0 PP restored** (so the player isn't stranded) — except any **Impounded** Pokémon (below).
4. The **Failure Consequences** menu (§6.5) is applied, scaled by the raid number and the team's Heat.
5. The run continues at the node before the raid with a **"Setback" status** (3 nodes of reduced rewards; shown).

**Fall back:** once per raid, at a checkpoint, a wiped player may use **Fall Back** instead: it returns to the checkpoint with half HP and a −1 retreat penalty on the final result (Success→Partial, Triumph→Success). Fall Back is not available after the Primary Objective.

**Retreat:** the player may choose **Extract** at any extraction point; the result is Partial if the Primary is complete, otherwise Failure (with reduced consequences, "Clean Retreat": half the Failure severity).

### 6.5 Consequence menu (heavy, not run-ending)

A Failure applies **three** consequences chosen from the table below by a seeded table keyed to the raid number and the team. **Heavy** here means they matter, but none can end the run or soft-lock it. Every consequence is listed in the offer's risk preview.

| Id | Consequence | Effect | Recoverable? |
| --- | --- | --- | --- |
| C1 | **Impound** | 1–3 Pokémon from the party are *seized* (bench Pokémon first; never the last two party members). About **ten nodes later, or at the last quiet node before the climax, the rival offers a Rescue Plan** (`RIVAL_RESCUE_PLAN.md`). They also return on climax victory, or earlier in Raid 3 / by rescue event | Yes (rival plan, rescue or climax) |
| C2 | **Fine / Shakedown** | Lose 40–60% of money | No |
| C3 | **Confiscation** | Lose a held item set (2–4 items, never Key Items) | Partially (some drop at climax) |
| C4 | **Strength surge** | Team OS +2 and one extra gauntlet battle in the climax | Reduced by later wins |
| C5 | **Blacklisted** | Region shops +30% prices for 6 nodes; one shop closed | Yes |
| C6 | **Hostage** | A recurring NPC or ally is captured; climax gains a **Rescue** objective | Yes |
| C7 | **Occupation** | One regional node type (e.g., Pokémon Center discount rest) is *occupied* for the rest of the region; rest nodes heal only 50% until reclaimed | Yes |
| C8 | **Reputation fall** | Region reputation −15; the team's reputation toward the player drops a step | Slowly |
| C9 | **Gym lockdown** | The next Gym requires an extra pre-battle trial (a shorter trainer gauntlet) | Yes |
| C10 | **Shadowed** | A random party Pokémon returns *with Shadow taint* (low corruption); cleansing is a Shadow side quest (see Shadow doc) | Yes |
| C11 | **Setback** | 3 nodes of −25% rewards (always applied) | Yes |

Triumph/Success bring the mirror image: rescues, intel, items, discounts, reduced OS (§6.6).

**Always applied on Failure:** C11 (Setback) + two random from C1–C10 (never C1 and C2 and C3 together; never more than two money-or-item losses).

**Partial** applies **one** consequence (never C1/C6/C10), and some benefits.

### 6.6 How raids shape the climax

Each raid result produces a **ClimaxMod**, tabulated in the Situation Report. The team's script lists three raid-specific effects per result. Generic accumulation:

| Quantity | Raid 1 Triumph | Success | Partial | Failure | Declined | Raid 2 Triumph | Success | Partial | Failure | Declined |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Operational Strength (OS) | −3 | −2 | −1 | +2 | +1 | −3 | −2 | −1 | +2 | +1 |
| Intel | +20 | +15 | +10 | +3 | 0 | +25 | +20 | +12 | +3 | 0 |
| Allies gained | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| Rival attitude effect | +1 | +0.5 | 0 | −0.5 | 0 | +1 | +0.5 | 0 | −0.5 | 0 |
| Team-specific *Lever* | Broken | Weakened | Dented | Strengthened | Unchanged | Broken | Weakened | Dented | Strengthened | Unchanged |

A **Lever** is a team-specific element of the climax that raids can break or strengthen (e.g., Rocket's *Fossils*, Galar's *Reactor*). Each team has three Levers (one per raid, plus a shared one) with concrete effects in its script.

**Bounds (fairness):** the total of all raid effects can change the climax by at most **±2 OS tiers, ±1 boss-phase condition and ±1 gauntlet floor** relative to baseline. A player who loses every raid faces a harder climax but never an impossible one; the Situation Report and Fall-back rules guarantee a fair path (see §7.4).

### 6.7 Skipping a raid

The player may decline. The raid still *happens* in the world (the operation proceeds): OS +1, Lever "Unchanged", and the team gains a resource. There is no penalty to the player and no reward. This ensures declining is a legitimate strategic choice (e.g., a weak run protecting its party) while attempting is the way to improve the climax.

### 6.8 Raid catalog (structure)

| Raid | Typical form | Primary objective (examples) | Setting (PR) |
| --- | --- | --- | --- |
| Raid 1 — "The Foothold" | Infiltration or assault on a mid-sized facility | Free impounded Pokémon / seize a ledger | Warehouse, depot, depot tower |
| Raid 2 — "The Lifeline" | Assault on the team's supply, power or comms | Destroy a generator / cut a signal / steal a key | Power plant, harbor, relay |
| Raid 3 — "Last Light" | Short, high-risk strike when the team is exposed or the player needs a swing | Capture a key figure / retrieve a missing component | Safehouse, convoy, chapel |

Each team's script defines all three with floors, dialogue and result tables.

---

## 7. The Climax

### 7.1 Overview

The climax is the region's villain story's payoff: a **huge, multi-phase Pseudo Stage** with a bespoke Pseudo Region, a set-piece mechanic, rival involvement, at least three boss fights, and a final moral or tactical choice.

### 7.2 The News Report (opening)

The climax is **opened as a news report**.

| Step | Behavior |
| --- | --- |
| 1 | After the Gym `G` victory, the game cuts to a **broadcast** scene (TV, radio or town screen depending on region): station sting, anchor, headline chyron, ticker, field reporter clip. |
| 2 | The report **summarizes the situation**: the team's act, the stakes, recent events. It includes **raid recap lines** (0–3), reflecting results (e.g., "Witnesses credit an unidentified trainer for freeing the depot." or "Authorities admit the intervention failed."). |
| 3 | If the **rival beat you there**, the report includes that fact (see `CLIMAX_RIVAL_INTEGRATION.md` §4): "A young trainer is already inside." |
| 4 | When the animation ends, the report **freezes on the final frame** and presents the **Choice**: **[Take them on]** or **[Stay out of it]**, plus **[Stand with them]** when the player is an eligible Inside Man (`STAND_WITH_THEM.md` §2). An Inside Man sees the news report as an **internal memo** (`scripts/10_STAND_WITH_THEM.md` Phase 0) instead. |
| 5 | The choice requires confirmation. "Stay out" is a legitimate, recorded decision (§7.7). |

**Presentation requirements:**
- Skippable after first view; choice is always shown even if the animation is skipped.
- 25–40 seconds long; subtitles on; reduced-flash mode.
- Region-specific style (news desks, tickers, anchors) in each script.
- Text slots fill from the Run Event Log (raid results, rival variant, team name, location).

### 7.3 The Situation Report

After the choice screen (and also accessible during it), a one-page **Situation Report** summarizes:

- Team name, leader (if known), OS, Levers (broken/intact), allies available, rival status (as known), hazards, expected phases (revealed by Intel).
- **What changes** because of earlier raids and ambushes.
- **Risks** if the player enters, and **costs** if they stay out.

Intel ≥ 25 reveals phase count; ≥ 50 reveals the boss team's type spread; ≥ 75 reveals the set-piece mechanic and rival hints.

### 7.4 Climax structure (universal template)

| Phase | Name | Contents | Fairness |
| --- | --- | --- | --- |
| **0** | **Broadcast & Choice** | News report, choice, Situation Report, then a **Last Rest** (a free full-heal node and shop before entering the climax; only if the player chose to take them on) | — |
| **1** | **Gauntlet** | `OS`-scaled number of trainer battles through the climax Pseudo Region (4–7 battles, 1–2 checkpoints). Raid effects, rival variant and allies shape it | Level = previous stage + 2; AI 2–3; no counters yet |
| **2** | **Second / Executives** | 1–2 duels with Executives or the Second, with a visible **Executive Ability** | AI 3; counter rule (cost ≤ 2) |
| **3** | **The Set Piece** | The team's signature mechanic fight, big and cinematic: a ritual, a storm, a broadcast, a stampede. Includes a time-limited **objective** (e.g., stop three bells, cut four cables) fought through battles | Telegraphed; timers are generous; failure drains HP/resources, not the run |
| **4** | **The Leader** | Boss battle with phase mechanic, Leader Doctrine, rival variant interplay | AI 3–4; fair win band 35–55% |
| **5** | **Resolution** | A final choice (spare/capture/decline/rescue), the leader's speech, the Legendary hook where applicable | Narrative, no combat |

Typical total battles: **8–12** (including 3+ named boss fights).

### 7.5 Baseline and modded difficulty

- **Baseline climax level:** previous stage + 2 (Leader ace: +3).
- **OS-scaled gauntlet:** `gauntletBattles = clamp(3 + round(OS/2), 4, 7)`.
- **Set-piece objective timer:** 12 turns baseline, ±2 for Lever state.
- **Raid-modded bounds:** ±2 OS tiers, ±1 phase condition, ±1 gauntlet floor (see §6.6).
- **Rival variant:** adds or removes a gauntlet battle and changes Phase 2/4 (see `CLIMAX_RIVAL_INTEGRATION.md`).
- **Win-rate band for a balanced reference party:** 40–60% for Phases 1–2, 35–55% for Phases 3–4, overall run-through 30–50%.

### 7.6 Rewards

| Reward | Notes |
| --- | --- |
| **Peacemaker Emblem** (region title/badge-like cosmetic) | Always on victory |
| Team-themed rare item | 1 guaranteed |
| Rescued Pokémon | Impounded Pokémon returned; Shadow Pokémon rescue option |
| Region reputation | +15 (+25 if Triumph on both raids) |
| Doom Ledger entry | A permanent record of how you ended the team |
| Legendary hook | Where listed: a Sighting/Trial flag in the narrative state (still subject to caps in the master plan §8) |
| Intel/Library entries | Collection Journal updates |

### 7.7 "Stay out of it"

If the player chooses **Stay out**, the climax resolves offscreen using a deterministic **Offscreen Resolution** table based on the rival variant, OS, Intel and raid results.

| Rival variant | OS ≤ 6 | OS 7–11 | OS ≥ 12 |
| --- | --- | --- | --- |
| **Help** (60%) | The rival and authorities stop the team; the player receives credit "by absence" (no emblem) | The rival stops the team at a cost (rival is injured; attitude +1 from respect) | The team wins locally; the rival retreats; region partially occupied |
| **Beat-you** (30%) | The rival wins alone; gloats | The rival loses; the team escapes; region partially occupied | The rival is captured; a hostage state persists |
| **Side-with** (10%) | The rival's move is exposed; team splinters | The rival and team hold; the region is occupied | The rival and team win; region fully occupied |

**Costs of staying out (always):**

1. No Peacemaker Emblem, no guaranteed rare item.
2. A **"Region under pressure"** modifier for the rest of the region: shop prices +15%, one rest node per route is "occupied" (half-heal), and ambushes by *remnants* continue at reduced rate.
3. The team's remnant joins the **Region of Doom** roster at higher strength (see `REGION_OF_DOOM.md`).
4. A **missed-moment** log entry; narrative flags change the epilogue.
5. Impounded Pokémon are **not returned** automatically. The rival's Rescue Plan was available before the climax; if the Pokémon are still held, a **Late Plan** (success −0.10) is guaranteed at the first rest node of the next region.

**Benefits of staying out:** no risk to the run; HP/resources preserved; useful for weak runs.

### 7.8 Climax loss

**Losing the climax ends the run (confirmed).** A wipe in Phases 1–4 triggers the **defeat ending** in the team's script (§10.11): the leader's last line, a broadcast voice-over, what happens to the region, and the rival's line for the variant that was rolled (`CLIMAX_RIVAL_INTEGRATION.md` §13). The Doom Ledger records the team as `triumphant` (the team enters the Region of Doom with +1 Doom Level) and the run as `climax-defeat`. Impounded Pokémon still held are recorded as `lost-with-impounded`.

Because the stakes are high, the design gives the player several honest ways to avoid a surprise loss:

1. **"Stay out of it"** is always offered, with its costs (§7.7).
2. **The Situation Report** (§7.3) shows a readiness label (Risky / Even / Likely / Safe) built from OS, Intel, the player's party level and the raid results. It is a guide, not a number, and has no hidden modifier.
3. **Last Rest** before Phase 1 (§7.4).
4. **Telegraphed phases**: every Executive Ability, Doctrine and boss-phase change is announced before it happens.
5. **Rival Assist** (Help variant) and the **rescue plan** (§6.5) exist to help the player prepare.
6. **Optional `climax.allowWithdraw` setting (default off):** at the checkpoint between phases the player may withdraw, which resolves as Stay out with one band worse on the Offscreen table and no emblem. It is off by default because it softens the stakes you chose.

There is no retry and no Mercy Checkpoint by default.

### 7.9 Aftermath (`PS-AFTER`)

A short scene that resolves the world state: broadcast follow-up, NPC reactions, rival coda (if involved), new shop/stage states, "the team afterwards" (disbanded, reformed, scattered to the Region of Doom). Writes the **Doom Ledger** entry.

---

## 8. The Rival at the Climax (summary)

The full design is in `CLIMAX_RIVAL_INTEGRATION.md`. Summary:

| Variant | Probability | What happens |
| --- | --- | --- |
| **Help** | **60%** | The rival meets you at the site and fights alongside you in one phase (support action + shared gauntlet), then holds the line for the Leader fight |
| **Beat-you** | **30%** | The rival arrived first. The news report says so. They have cleared part of the gauntlet but are overwhelmed; you find them in trouble and must rescue them and finish the job |
| **Side-with** | **10%** | The rival is with the team (motive depends on archetype); they fight you in Phase 2 or 4 and either break away or leave |

**Second rival (D8).** In about half of regions (seeded, 50%) a second rival, a "friend" with a different archetype, is present. They take a smaller role: Support (70%) or Caught (30%) at the climax, with guards that prevent a double betrayal. See `SECOND_RIVAL.md`.

The roll is made once per region when the climax is scheduled (using the seeded RNG), stored, and **never** altered by player actions (it is not a reward or a punishment). Rival archetype, attitude, memory and ending affect *how* the variant plays out, not whether it occurs.

---

## 9. Pillar A — Evil Team System

### 9.1 Official integration

The official teams in your list are supported as **data entries** that obey the same schema as custom teams. Their identity is protected (§9.4).

| Org | Template | Specialty | Notes in this release |
| --- | --- | --- | --- |
| Team Rocket | Syndicate | Theft, exploitation, underground | **Primary** in Kanto (script 01); **Returning** in Johto (script 02) |
| Team Aqua | Company | Ocean expansion | **Primary** in Hoenn (script 03) |
| Team Magma | Corporation | Land expansion, volcanic ops | **Second team** in Hoenn (script 03) |
| Team Galactic | Paramilitary | Cosmic ambitions | **Primary** in Sinnoh (script 04) |
| Team Plasma | Order | Liberation ideology, politics | **Primary** in Unova, BW2 era (script 05) |
| Team Flare | Corporation | Extremism, wealth, selective preservation | **Primary** in Kalos (script 06) |
| Team Skull | Gang | Disorganized street crime | **Primary** in Alola (script 07) |
| Aether Foundation | Corporation | Research, hidden agendas | **Second team** in Alola (script 07) |
| Team Yell | Gang | Aggressive fandom | **Second team** in Galar (script 08) |
| Macro Cosmos | Corporation | Industrial influence | **Primary** in Galar (script 08) |
| Team Star | Gang | School faction, delinquency | **Primary** in Paldea (script 09) |
| Team Snag'em | Syndicate | Stolen Pokémon, Snag Machine | **Placeable / side faction** (script 00) |
| Rocket Remnants | Syndicate | The trio and old colleagues | **Placeable; recurring trio** in every region (script 00) |
| The Explorers | Cartel | Mysterious concealed objectives | Region of Doom only |

*Interpretations:* each official team can be in **Original**, **Reformed**, **Split** or **Remnant** state (A1 of your text). Remnant is the Rocket Remnants state.

### 9.2 Organization data (what is stored)

Per your A3 list, plus fields needed by the new systems:

`id, name, region, kind (primary|secondary|returning|generated), template, ideology, primary/secondary objectives, leader, second, executives[], roster[], preferred types, preferred strategies (AI personality), resources (Money, Influence, Technology, Personnel, Pokémon, Territory, Research, Equipment, Intelligence), HQ, territory, member count, reputation, rival factions, current operations, state (dormant|awake|climax|defeated|remnant), heat, OS, levers[], script ref.`

### 9.3 Personalities and interactions (A5)

Each team has a **Team Personality** (how members speak, how they treat the player) and each member has an **individual voice** (reuses the 8 pack voices: boastful, formal, cheerful, menacing, poetic, terse, scholarly, folksy). Members never share identical dialogue: each script supplies per-rank and per-member lines.

| Team | Team personality | Treats the player as |
| --- | --- | --- |
| Team Rocket (Kanto) | Cold, businesslike | An obstacle or an asset |
| Team Rocket (Return) | Bitter, loyal to an absent boss | A threat to the plan |
| Team Aqua | Idealistic, defensive | A possible volunteer |
| Team Magma | Ambitious, fiery | A possible volunteer |
| Team Galactic | Cold, ideological | A lesser mind |
| Team Plasma | Righteous, manipulative | A Pokémon to be freed |
| Team Flare | Polished, superior | An untidy thing |
| Team Skull | Loud, defensive, loyal | A square |
| Aether Foundation | Warm, calm, hidden | A guest |
| Macro Cosmos | Corporate, upbeat, ruthless | A stakeholder |
| Team Yell | Silly, devoted | Someone who is not Marnie |
| Team Star | Defensive, kind | An Academy person (suspect) |
| Rocket Remnants | Dramatic, comic, bitter | Their chance to return |
| Team Snag'em | Blunt, mercenary | A source of Pokémon |

### 9.4 Rules for official teams (identity protection)

1. Procedural generation never edits official entries.
2. Official teams keep canon-flavored identities, ideologies and signature ideas, with **original** acting leaders and members written here.
3. Official teams can be *reformed* or *split* but never contradict established identity (a "reformed Plasma" still values liberation).

### 9.5 Custom team generation (A4)

The generator is used for the **Region of Doom**, for **custom teams** in World Save mode, and for **alternates** if a player disables a regional team. It follows these rules (from your quality list):

1. Theme first: pick a **Cause** (see §9.6), derive ideology, then structure.
2. Leader's voice and ace follow the ideology.
3. Team types follow the specialty (a smuggling fleet favors Water/Dark/Flying; a lab favors Psychic/Poison/Steel).
4. Objectives must be achievable with the game's systems (a raid, a theft, a ritual).
5. Names/logos must be unique among active teams.
6. Structure scales with size (§14.4 lifecycle).
7. Every generated team must have at least two operations that create gameplay.

`data/generator_cause_pool.json` seeds 24 causes, 24 name parts and 16 structure templates (see data pack).

### 9.6 Cause pool (24)

*Debt & Control:* Collect, Foreclose, Contract, Tax, Blackmail · *Faith & Meaning:* Awaken, Restore, Purify, Silence · *Power & Nature:* Storm, Quarry, Tame, Rewild, Drown · *Knowledge & Tech:* Archive, Perfect, Clone, Broadcast · *Status & Spectacle:* Fix, Dazzle, Exhibit · *Escape & Freedom:* Smuggle, Liberate, Vanish.

---

## 10. Pillar B — Shadow Pokémon

Summary here; the **full system** is `SHADOW_POKEMON_SYSTEM.md`.

- Shadow state with **Corruption (0–100)** and four **Shadow Tiers**.
- 14 Shadow Moves, 20 Shadow Abilities, 7 purification methods, mentor mechanic, rare variants.
- Teams have different **Shadow methods** (e.g., Rocket "Capture Rig", Galactic "Red Chain Lock", Snag'em "Snag Machine"); the full list is in `SHADOW_POKEMON_SYSTEM.md` §6.
- **Shadow Pokémon can be permanent party members (confirmed).** They are never forced out and never forced to be purified; see `SHADOW_POKEMON_SYSTEM.md` §12.
- Shadow Pokémon are a **tool for story**: impounded Pokémon (C1) and "Shadowed" (C10) connect directly to raids.
- Balance: Shadow Pokémon are **stronger in the short term but cost control, friendship and flexibility** (never universally superior).

---

## 11. Pillar C — Region of Doom

Summary here; the **full design** is `REGION_OF_DOOM.md`.

- A tenth region where defeated, surviving and independent teams congregate.
- Unlocked after clearing the first regional climax (or by choice later), persistent in the Doom Ledger.
- Evil Team Gyms (8 Evil Team Gyms led by Ledger-sourced or generated Leaders), territory control, black markets, headquarters, neutral settlements, central city.
- Dynamic power structure driven by the Simulation Layer (§14–§15).
- Regional teams you "stayed out of" return here stronger.

---

## 12. Pillar D — Reputation & Allegiance

### 12.1 Reputation values and states

Each team has a reputation toward the player: **−100 … +100**, mapped to states.

| State | Range | Behavior |
| --- | --- | --- |
| Hostile | −100…−60 | Ambushes at higher Heat; no talk |
| Distrusted | −59…−25 | Grunts mock, tail, Intel is harder |
| Neutral | −24…+24 | Indifferent |
| Recognized | +25…+44 | Members acknowledge you; small tips |
| Respected | +45…+69 | Offers, discounts at team shops |
| Allied | +70…+89 | Joint ops, exclusive shops |
| Inner Circle | +90…+100 | Full access; hidden story |

### 12.2 Reputation changes

| Action | Δ (primary team) |
| --- | --- |
| Defeat Grunt / Specialist / Commander / Executive / Leader | −1 / −2 / −4 / −8 / −15 |
| Raid Triumph / Success / Partial / Failure | −20 / −12 / −5 / +0 |
| Complete a team mission for them | +8 |
| Rescue their Pokémon from their rivals | +10 |
| Betray / sabotage while Allied | −40 |
| Support a rival org | −10 (and +8 to the rival org) |
| Make a team-favoring dialogue choice | +3 |

Reputation to the *primary regional team* is naturally negative as the arc proceeds; recruitment (below) is the only path that raises it.

### 12.3 Reputation as the Arc's counterweight

- High **Respected+** (reached via missions, not ambushes) can unlock **recruitment**.
- Low reputation increases Heat gain and unlocks harsher ambushes.
- A team's *reputation toward the player* and the player's *Heat* are separate: Heat is attention; reputation is attitude.

### 12.4 Recruitment and the Inside Man route

Every canon team offers recruitment at Ignition, each in its own voice: **Rocket** (a card key and a job), **Rocket (Return)** (a place in the cells), **Aqua** (the sea's side), **Magma** (the land's side), **Galactic** (a creed), **Plasma** (the freedom speech), **Flare** (a polished invitation), **Skull** ("you got a rap?"), **Macro Cosmos** (a corporate offer), **Star** (a roadblock that becomes a conversation). **Team Yell** (a chant) offers a comic version of the route that does not unlock the allied climax; the **Rocket Remnants** trio offer a comic version too. **Aether** is entered through Skull. Accepting sets `<team>.insideman`:

| Effect | Detail |
| --- | --- |
| Raids | Raid 1 and 2 become **infiltration** variants (`PS-INFIL`): stealth/disguise with team-issued uniform; failure = discovery |
| Heat | −25 at joining; ambushes stop; rival-faction (other team) ambushes may begin |
| Benefits | Team shop access, one exclusive item, exclusive trainers, access to the team's secret story |
| Consequences | Other factions' reputation −10; the **Betrayal** choice (below) |
| Raid fork | Each raid offers two buttons: **[Sabotage from inside]** (the normal infiltration raid) or **[Run the job]** (a Loyalty Job that raises reputation and Allied Strength instead of lowering Operational Strength). See `STAND_WITH_THEM.md` §3 |
| Climax | The News Report is replaced with an **internal memo** briefing; the choice becomes **[Stand with them]** (needs reputation ≥ +45, not betrayed, no prior Turn), **[Take them on]**, **[Stay out]**. "Stand with them" ships at launch (D6): `PS-CLIMAX-ALLIED`, nine sections in `scripts/10_STAND_WITH_THEM.md` (Hoenn covers Aqua and Magma), three endings (Rise / Take the Throne / Turn). |

### 12.5 Betrayal and defection (D3)

Leaving or betraying: former allies become hostile; the team hunts the player (Heat jumps to 80); you keep certain rewards; secret information can be exposed by an NPC; a rival organization may offer protection. Forgiveness depends on the team's **Mercy** value (Rocket 0.2, Rocket Return 0.1, Aqua 0.4, Magma 0.3, Galactic 0.1, Plasma 0.1, Flare 0.2, Skull 0.5, Aether 0.1, Macro Cosmos 0.2, Yell 0.8, Star 0.9, Rocket Remnants 0.9, Snag'em 0.3).

### 12.6 Faction-specific benefits (D4)

| Team | Allied/Respected benefit |
| --- | --- |
| Rocket | Underground market; Game Corner prizes; seized rare items |
| Rocket (Return) | Radio-tuned encounters; Rocket-branded gear |
| Aqua | Aquatic encounters; sub passage; tide charts |
| Magma | Volcanic encounters; drill shortcuts; heat gear |
| Galactic | Experimental equipment; Red Chain fragments |
| Plasma | Hidden-grotto encounters; "freed" Pokémon (conditional) |
| Flare | Cosmetic sets; Mega Stone fragments; Fairy encounters |
| Skull | Street shortcuts; Po Town access; Dark encounters |
| Aether | Conservation-area encounters; Ultra-wormhole sightings |
| Macro Cosmos | Gadget held items; Dynamax candy (limited) |
| Yell | Fan discounts; chant buffs (comic) |
| Star | Starmobile rides; Base shortcuts; Tera shards |
| Rocket Remnants | Underground market; rare thefts; comic gadgets |
| Snag'em | Shadow Pokémon access; Machine schematics |
| Explorers | See Region of Doom doc |

All benefits are mild or conditional and obey the item and stacking rules of the master plan (no +ATK items).

### 12.7 Faction relationships (D5)

A 15×15 relationship matrix (`data/faction_relations.json`) stores base relations (ally, rival, enemy, partner, former ally, ideological opponent, neutral). Starting values for the 14 canon teams (plus League authorities) are in the data pack; the simulation changes them over time (§15).

---

## 13. Pillar E — Operations, Missions, Infiltration, Raids

### 13.1 Team operations (independent)

`data/operations.json` contains **100** operations across eight families: Theft, Territory, Recruitment, Experiment, Sabotage, Smuggling, Public Stunts, Intelligence. Each lists requirements (resources), duration (ticks), success formula, visible signs, and consequences. Operations run in the simulation whether or not the player is present (compressed during a run, §16.4).

### 13.2 Player missions

Missions come from NPCs, posters, members, and events. `data/missions.json` contains **60** missions across the ten categories in your text (Infiltration, Sabotage, Rescue, Investigation, Theft, Raid, Interception, Negotiation, Targeted Battle (named "Duel" in-game), Defense). A mission has a giver, a pseudo-stage or standard node chain, objectives, a result table and reputation effects.

### 13.3 Infiltration (E3)

| Mechanic | Rule |
| --- | --- |
| Disguise | Uniform item; fools Grunts and Specialists; fails vs Commanders+ |
| Checkpoints | Dialogue checks (pass/fail by disguise, Intel, role knowledge) |
| Keycards | Tiered (A–D); drop from Lieutenants, hidden in rooms |
| Patrols | Visible patrol routes; contact = forced battle (alarm +1) |
| Detection meter | 0–3 alarms; at 3, the facility locks down (Extract or Fall Back) |
| Hidden passages | Found by Intel or investigation nodes |
| Distraction | Throwable decoys, ally actions, battlefield conditions |
| Cameras / automated security | Tech teams: cameras flag alarm; hacking nodes (Technician allies) disable |

Teams have different security signatures (listed in each script's raid sections).

### 13.4 Larger raids (E4)

Raid-scale events with allies (the rival, Gym leaders, police) use **Allied raids**: allies handle some floors and give the player buffs, but the player always leads the key fight.

---

## 14. Pillar F — Leadership & Progression

### 14.1 Resources

Per team: **Money, Influence, Technology, Personnel, Pokémon, Territory, Research, Equipment, Intelligence**. In the Regional Story Layer these are summarized by **OS** (Operational Strength) and the **Levers**. In the Simulation Layer (Region of Doom), they are fully tracked.

### 14.2 Leader progression

Leaders gain levels/Pokémon between encounters in a run (stage-scaled), change doctrine after repeated losses (e.g., a leader who loses twice adopts a counter doctrine), and may become obsessed (grudge), or interested (recruit) according to their personality. These are story beats in the scripts (the leader's reaction to Raid results).

### 14.3 Succession and coups

If a Leader is defeated in the Region of Doom (or weakened in raids), possible outcomes: executive takes over, coup, split, reform, rival group formation, radicalization, disbanding. Each team has a **Succession Table** (in data). In the arc, a Failed-twice team may suffer a **Coup Attempt** inside the climax (Second turns on Leader) — only if raid results favor it (see scripts).

### 14.4 Lifecycle (F4)

| Level | Name | Resources (guide) | Examples |
| --- | --- | --- | --- |
| 1 | Small Gang | Personnel 6–12 | Region of Doom start for custom teams |
| 2 | Emerging Organization | Personnel 13–30 | Skull, Star at Act 0 |
| 3 | Established Faction | Personnel 31–80 | Rocket, Aqua, Magma, Galactic at Ignition |
| 4 | Major Organization | Personnel 81–200 | Macro Cosmos, Plasma, Aether at climax |
| 5 | Dominant Power | 200+ | Rocket (original form), Galactic (original form) in Doom |

### 14.5 Internal conflicts (F5)

`data/internal_conflicts.json` has 40 conflicts (executive vs leader, rival commanders, doubtful members, rogue scientists, coups, defections, paranoia, factions within factions). Some are **visible beats** in the scripts (e.g., Rocket's Domino vs Butch and Cassidy over credit). Some are **randomly generated** in the Region of Doom. Defector-risk members (rank 1–5) can be turned through dialogue choices in raids.

### 14.6 Leadership AI (F6)

Leaders have a **Decision Profile**: Cautious, Ambitious, Calculating, Volatile, Zealous, Paranoid, Charismatic, Pragmatic. Decisions consume resources and produce operations, treaties, wars and purges. The AI is deterministic by seed and scored by utility (see architecture §7).

---

## 15. Pillar G — Faction Conflicts & World Events

### 15.1 Conflict scales (G1)

Minor dispute → Territorial → Operation → Open confrontation → Full-scale war. Each scale has a cost, duration, visible signs, and player-intervention options.

### 15.2 Territory and alliances (G2, G3)

Dynamic territory in the Region of Doom; temporary alliances with lifespans and failure conditions (Aqua/Magma style "common enemy" pacts, Regional teams uniting after a climax if the player stayed out).

### 15.3 World events (G4)

`data/world_events.json` holds **100** events with trigger conditions, frequency, scale and consequences, in these families: Heists, Brawls, Disappearances, Containment failures, Recruitment drives, Challenges, Reformations, Expansions, Discoveries, Coups.

### 15.4 World-state consequences (G5)

Visible changes (see Region of Doom doc): occupied towns, damaged HQs, new black markets, abandoned bases, new Gyms, replaced leaders. The Regional Story Layer contributes its own: the aftermath of a climax changes the region's map state for the rest of the run (e.g., the Exchange is shuttered; the Tower is silent).

---

## 16. Run Scope vs. World Scope (reconciling persistence)

Your text states "the Region of Doom should be persistent." The master plan describes **runs**. This design uses three persistence layers:

| Scope | What persists | Used for |
| --- | --- | --- |
| **Run** (default) | Team states, Heat, Intel, OS, raid results, rival variant, climax outcome — within the run only | The Regional Story Layer; all regional arcs |
| **Save / World** (opt-in "World Save") | Faction simulation across multiple runs on the same save: territories, leaders, succession, the Region of Doom map | Simulation Layer; Region of Doom |
| **Doom Ledger** (meta, always on) | A compact record per run of how each team ended; unlocks the Region of Doom and its districts | Cross-run flavor, unlocks, titles |

In the default (non-World) mode, the Region of Doom is generated from the Doom Ledger at entry: the teams you defeated are *defeated*, the ones you avoided are *stronger*, and the map is deterministic from the ledger and seed. This delivers "the world remembers" without a full persistent simulation.

### 16.1 Compressed simulation during a run

Between nodes, the simulation advances **ticks** (1 tick per 2 nodes, max 40 ticks per region). Only teams with active operations tick. The Regional Story Layer is authoritative: simulation can add flavor (graffiti, posters, minor events) but cannot contradict the script.

### 16.2 Villains can win

Operations succeed or fail on resource checks; the world must not secretly guarantee a player win. In the arc, this means raid failures and declined raids have real effects; in the Doom simulation, teams can conquer each other.

---

## 17. Fairness and anti-frustration

1. **Pseudo Stages never break the difficulty curve** (§2.5).
2. **Risk previews** before raids and the climax.
3. **Raid loss never ends the run.** The climax can end it, so it has a safe alternative (Stay out), a readiness label, and a Last Rest (§7.8).
4. **Bounds** on raid effects (±2 OS tiers).
5. **Impounded Pokémon always have a path home** (the rival's Rescue Plan at about ten nodes, Raid 3, a rescue event, climax victory, or the Late Plan).
6. **Ambush caps and counterplay** (Decoy Tags; caps; gaps).
7. **Telegraphed** tools, traits, abilities, doctrines, phase changes.
8. **Same fairness rules as the master plan:** stacking cap +30%, no hidden stat cheating, AI tier by rank, win-rate bands.
9. **Accessibility:** news reports skippable, flash reduction, text speed, color-blind safe Heat/OS UI, one-handed controls for infiltration timers.

---

## 18. Content targets

| Content | Target | Where |
| --- | --- | --- |
| Evil teams (arc) | 14 | `data/evil_teams` |
| Scripted stories (with climax and dialogue) | 10 (9 regional + 1 roaming cast) | `scripts/` |
| Named members | 14 teams, 5–12 each; the two roaming teams are smaller by design | `data/roster` |
| Ranks / roles | 8 tiers, 13 roles | `data/ranks`, `data/roles` |
| Raids | 31 (2–3 per region, including the roaming cast's 4) | `data/raids` |
| News reports | 3 variants × 9 regions + roaming inserts | scripts |
| Ambush lines | 30 per team | `data/ambush_lines` |
| Rival Rescue Plan lines | 14 stages × 8 archetypes = 112 | `data/rival_rescue.json` |
| Rival defeat lines | 8 × 3 = 24 | `data/rival_defeat_lines.json` |
| Returning-team kits | 2 teams × 9 regions = 18 | `data/returning_team_kits.json` |
| Defeat endings | 9 (one per script, §10.11) | `scripts/` |
| Operations | 100 | `data/operations` |
| Missions | 60 | `data/missions` |
| World events | 100 | `data/world_events` |
| Internal conflicts | 40 | `data/internal_conflicts` |
| Faction relations | 12×12 | `data/faction_relations` |
| Shadow moves/abilities/methods | 14 / 20 / 7 | `data/shadow` |
| Region of Doom districts | 14 | `REGION_OF_DOOM.md` |

---

## 19. Decisions

### Resolved (you confirmed these)

1. **Climax loss:** run-ending. See §7.8.
2. **Impounded Pokémon:** the rival comes with a plan at about ten nodes, or at the climax at the latest. See `RIVAL_RESCUE_PLAN.md`.
3. **Roaming teams:** any region. See `RETURNING_TEAMS_ANYWHERE.md`.
4. **Gym count:** clamp to `[N−2, N]` for regions with fewer than eight.
5. **Shadow Pokémon:** permanent party members. See `SHADOW_POKEMON_SYSTEM.md` §12.
6. **Stand with them:** included at launch. See `STAND_WITH_THEM.md` and `scripts/10_STAND_WITH_THEM.md`.
7. **Persistence:** per-run, with the Doom Ledger always on (§16).
8. **Second rival:** exists in some regions. See `SECOND_RIVAL.md`.
9. **Withdraw setting:** `climax.allowWithdraw` stays off by default (D9). It is an optional switch that lets a player withdraw between climax phases; a withdrawal resolves as "Stay out", one band worse on the Offscreen table, with no emblem.

### Still open

None. Everything that was a question has a decision. Numbers remain launch defaults for tuning.

---

## Appendix A — Region of Doom entry condition (short)

Clear the first regional climax **or** reach the endgame of any region **or** start a World Save in "Doom" mode. See `REGION_OF_DOOM.md`.

## Appendix B — "Stand with them"

Moved out of this document. It ships at launch (D6). The full design is in `STAND_WITH_THEM.md`; the nine team versions (memo, defenders, objective, authority, verdict, three endings) are in `scripts/10_STAND_WITH_THEM.md`.
