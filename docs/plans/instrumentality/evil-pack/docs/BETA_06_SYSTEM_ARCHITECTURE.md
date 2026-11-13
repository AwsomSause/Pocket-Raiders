# BETA 0.6 — SYSTEM ARCHITECTURE

*Engine-agnostic. Types are TypeScript-style pseudocode because the project is built with Claude Code; adapt to your stack. Mechanics values come from `BETA_06_DESIGN_DOCUMENT.md`; this document says where they live and how they run.*

---

## 1. Module map

```
core/
  rng.ts                  seeded RNG (mulberry32 / hash), per-purpose streams
  runState.ts             RunState, stage graph, stageIndex
  eventLog.ts             Run Event Log (append-only)
factions/
  factionRegistry.ts      Faction definitions (14 canon teams + generated)
  hierarchy.ts            tiers 0-7, roles, promotion/demotion
  reputation.ts           -100..+100, 7 states, allegiance
  relations.ts            12x12 faction relation matrix, diplomacy
  leadershipAI.ts         utility scoring (§7)
  operations.ts           operations, missions, world events
  conflicts.ts            internal conflicts, betrayals
arc/
  arcDirector.ts          Act 0 -> Ignition -> Pursuit -> Raids -> Climax
  heat.ts                 Heat, Intel, Operational Strength (OS)
  pursuit.ts              ambush roll, tier selection
  raids.ts                raid orchestration, results, consequences
  climax.ts               news report, choice, phases, resolutions
  rivalClimax.ts          60/30/10 roll, variants, Assist, Turn formula
  rescuePlan.ts           Impound tracker, planDueAt, PS-RESCUE, offers (RIVAL_RESCUE_PLAN.md)
  returningTeams.ts       placement modes, Returning Team Module, kits (RETURNING_TEAMS_ANYWHERE.md)
pseudo/
  pseudoRegion.ts         PseudoRegion loader/unloader
  pseudoStage.ts          PseudoStage scheduler/runner
  checkpoints.ts          PS checkpoints, fall-back, extraction
shadow/
  shadow.ts               Shadow model, tiers, surge
  purification.ts         7 methods, Heart Scars
doom/
  doomLedger.ts           meta ledger
  regionOfDoom.ts         generator (§9)
ui/
  newsReport.ts           animated news report + choice
  situationReport.ts      Intel-gated briefing
  partyShadowRing.ts      purification ring
data/ (JSON)
  evil_teams.json ranks.json roles.json roster.json ambush_lines.json
  raids.json operations.json missions.json world_events.json
  internal_conflicts.json faction_relations.json shadow.json generator_pools.json
scripts/ (authored text; Markdown source compiled to JSON)
```

**Rule:** authored text (scripts) is data. No dialogue is hard-coded in logic modules.

## 2. Core data models

### 2.1 Factions and members

```ts
type TierIndex = 0|1|2|3|4|5|6|7;
type RoleId = 'enforcer'|'handler'|'technician'|'scientist'|'recruiter'|'scout'|'quartermaster'
  |'infiltrator'|'medic'|'spokesperson'|'strategist'|'zealot'|'defector-risk';

interface FactionDef {
  id: string; name: string; regionIds: string[];
  template: 'syndicate'|'order'|'company'|'corporation'|'cartel'|'ring'|'paramilitary'|'gang';
  kind: 'primary'|'secondary'|'returning'|'generated';
  doctrine: DoctrineId; shadowMethod: ShadowMethodId; mercy: number;
  preferredTypes: PokemonType[]; personalities: AIPersonality[];
  roster: MemberDef[]; scriptRef: string;
}
interface MemberDef {
  id: string; name: string; tier: TierIndex; title: string; roles: RoleId[];
  team: PokemonSpec[]; ace?: PokemonSpec; trait?: TraitId; ability?: ExecAbilityId;
  voice: string; canon: boolean; // true for canon characters (dialogue and scenes are original)
}
interface FactionState {
  factionId: string; awake: boolean; heat: number; intel: number; os: number;
  lifecycle: 1|2|3|4|5; livingMembers: Record<string, MemberState>;
  levers: Record<string, 'intact'|'weakened'|'broken'|'strengthened'>;
}
```

### 2.2 Arc and Pseudo Stages

```ts
type PSKind = 'news'|'raid'|'climax'|'climax-allied'|'after'|'ambush'|'infil'|'doom'|'hq';
interface PseudoStage {
  id: string; kind: PSKind; insertAfter: StageRef; pseudoRegion?: string;
  difficulty: Tier; rules: RuleSet; objectives?: Objective[]; phases?: Phase[];
  entry: EntryRule; exit: ExitRule; checkpoints: CheckpointDef[]; scriptRef: string;
}
type RaidResult = 'triumph'|'success'|'partial'|'failure'|'declined';
type ClimaxResult = 'victory'|'stayed-out'|'defeat'|'allied-rise'|'allied-throne'|'allied-turn'|'allied-defeat';
type SecondRivalRole = 'support'|'caught';

interface ArcState {
  regionId: string; factionId: string; climaxGym: number; // 6..8 (clamped)
  raids: { id: string; offered: boolean; result?: RaidResult }[];
  climaxScheduled: boolean; climaxResult?: ClimaxResult;
  rivalVariant?: 'help'|'beat'|'side'; // rolled once (§5)
  secondRival?: { archetype: string; role: SecondRivalRole; attitude: number }; // §5A; absent in ~50% of regions
  alliedStrength?: number; // 0..10, Inside Man only (STAND_WITH_THEM.md §3)
  consequences: ConsequenceId[];
}
```

**Pseudo Stages never advance `stageIndex`.** A `PS` is a detour node with its own entry/exit; the main stage graph is unchanged. Each PS has a `PseudoRegion` that is loaded lazily and unloaded on exit (memory budget in §8).

### 2.3 Run Event Log extensions

New event types: `arc.ignite`, `arc.pursuit.ambush`, `arc.raid.offered|started|result`, `arc.climax.scheduled|news|choice|phase|result`, `rival.climax.variant`, `rival.assist`, `faction.rep`, `faction.promote`, `shadow.*`, `doom.*`, `impound.applied`, `rescue.offered|accepted|declined|result`, `impound.returned`, `returning.placed`, `climax.defeat`. All events carry `{ runId, stageIndex, seedStream, payload }`.

## 3. Arc Director (state machine)

```
Dormant -> Rumors -> Ignited -> Pursuit -> Raid1(optional) -> Raid2(optional) -> [Raid3 conditional]
 -> ClimaxScheduled -> News -> Choice -> {ClimaxPS | StayOut} -> Aftermath -> Closed
```

Transitions are driven by `stageIndex` events (Gym wins) and player choices. Every state is serializable. The Director exposes `next(): ArcDirective[]` which the run loop consumes (insert a PS, show a scene, adjust Heat).

### 3.1 Scheduling rules

- Ignition at Gym 1–3 (seeded pick).
- Raid 1 offered after Gym `G-4..G-3`; Raid 2 after `G-2..G-1`; Raid 3 if ≥1 failure or both triumph.
- Climax is scheduled to fire after Gym `G`, rolled from `{6,7,8}`; regions with fewer than 8 Gyms clamp to `[N-2, N]`.
- If the player skips a Gym via a route (e.g., Elite challenge), the Director re-anchors to the next Gym completed; the climax never fires before Gym 6 (or `N-2`).

## 4. Pursuit and Heat

```ts
function ambushRoll(f: FactionState, node: NodeCtx, rng: RNG): AmbushDirective | null {
  if (!f.awake || node.ineligible) return null;
  if (node.sinceLastAmbush < MIN_GAP /*2*/ ) return null;
  if (f.ambushCount >= CAP_PER_REGION /*6*/) return null;
  let p = clamp(0.10 + 0.002 * f.heat, 0.10, 0.30);
  if (arc.climaxScheduled) p *= 0.5;
  const pity = node.eligibleSince >= 7;
  if (pity || rng() < p) return pickAmbusher(f, tierByHeat(f.heat), node, rng);
  return null;
}
```

Tiers by Heat: T1 Grunt (<30), T2 Grunt/Specialist (30–54), T3 Commander/Specialist (55–79), T4 Executive (≥80, max 2). Ambush difficulty is capped to the previous stage's tier +0. Counterplay: **Decoy Tag** cancels one ambush; an ambush win gives Intel +4 and OS −1.

## 5. Rival climax roll

```ts
function rollRivalVariant(runSeed: string, regionId: string): 'help'|'beat'|'side' {
  const r = rng(hash(runSeed + regionId + 'rival-climax'))();
  return r < 0.60 ? 'help' : r < 0.90 ? 'beat' : 'side';
}
```

- Rolled **once** when the climax is scheduled; stored in `ArcState.rivalVariant`; never re-rolled or changed by player action (exception: Turn resolution in `side` may change the *outcome*, not the variant).
- If the `side` variant is selected, three foreshadow beats are scheduled across the previous stages (stored in `rivalForeshadow`).
- A **replay test** asserts the same seed yields the same variant.
- A **distribution test** over 100,000 seeds asserts help ∈ [59%, 61%], beat ∈ [29%, 31%], side ∈ [9%, 11%].

## 5A. Second rival and Stand with them

```ts
function rollSecondRival(runSeed: string, regionId: string, primaryArchetype: string, primaryVariant: 'help'|'beat'|'side') {
  if (rng(hash(runSeed + regionId + 'second-rival-present'))() >= 0.50) return undefined;
  const pool = ARCHETYPES.filter(a => a !== primaryArchetype);              // 7 candidates
  const archetype = pool[Math.floor(rng(hash(runSeed + regionId + 'second-rival-archetype'))() * pool.length)];
  const forced = primaryVariant !== 'help';                                 // Beat-you / Side-with force Support
  const role = forced || rng(hash(runSeed + regionId + 'second-rival-climax'))() < 0.70 ? 'support' : 'caught';
  return { archetype, role, attitude: 1 };
}
```

- Stream isolation: the three second-rival streams are separate from `rival-climax`, so adding or removing the second rival never changes the primary roll.
- `PS-CLIMAX-ALLIED` is offered only when `insideman` is set, reputation ≥ +45, the player has not betrayed the team, and no prior Turn exists in the run. `alliedBattles = clamp(7 − round(AS/2), 3, 6)`. Allied Strength starts at 4 and changes per raid result (`STAND_WITH_THEM.md` §3).
- Ledger writes: `team.ended = victorious-allied`, `team.leader = player` (Take the Throne), or `routed` / `allied-defeat` on loss. An allied defeat ends the run like any climax defeat (D1).

## 6. Pseudo Region runtime

```ts
interface PseudoRegionRuntime {
  load(id: string): Promise<PRHandle>;   // map, tilesets, scripted actors
  enter(h: PRHandle, from: NodeRef): void;
  checkpoint(): CheckpointToken;         // for Fall Back
  exit(h: PRHandle, result: StageResult): void; // restores overworld, applies consequences
  dispose(h: PRHandle): void;
}
```

- **Entry:** snapshot party + position; PR is instanced (not shared across runs).
- **Fall Back (once per raid):** return to the last checkpoint with `Failure` pending; the raid result is `partial` if Primary is complete, otherwise `failure`.
- **Wipe:** raid result `failure` with expulsion to the entrance; no run-end.
- **Climax defeat:** **ends the run** (confirmed). `climax.result = 'defeat'` sets `run.ended = 'climax-defeat'`, plays the team's defeat ending (script §10.11) and the rival's line (`CLIMAX_RIVAL_INTEGRATION.md` §13), writes the Doom Ledger (`team.ended = 'triumphant'`, `+1 Doom Level`), and never returns impounded Pokémon (`lost-with-impounded`). `climax.allowWithdraw` (default off) lets the player withdraw at a phase checkpoint, resolving as Stay out one band worse.
- **No-dead-end rule:** every PS must have an exit reachable from every checkpoint (tested, see implementation plan).

## 6A. Rescue Plan scheduler

```ts
interface ImpoundRecord { pokemonIds: string[]; impoundNode: number; holdingTeamId: string; offers: number; resolved: boolean }

function planDueAt(rec: ImpoundRecord, arc: ArcState, runSeed: string): number {
  const wait = 9 + Math.floor(rng(hash(runSeed + arc.regionId + 'rescue-wait'))() * 3); // 9..11
  const lastQuiet = arc.climaxScheduled ? arc.lastQuietNodeBeforeClimax : Infinity;
  return Math.min(rec.impoundNode + wait, lastQuiet);
}
// offered only at a quiet node; at most two offers + one Late Plan; PS-RESCUE result in {full, partial, fail, deal}
```

The scheduler listens to `arc.raid.result` (C1 applied), `impound.returned` (cancel) and `node.entered` (offer check). Success rolls use `rng(hash(runSeed + regionId + 'rescue-roll'))`.

## 6B. Roaming Team Module

`returningTeams.ts` reads the placement (`default | seeded | chosen | stress | lead`) from run setup, loads the kit for each `(teamId, regionId)` pair, and emits the four RTM beats (Sighting, Collision, Cache, Cameo) as Arc Director directives. Hard caps: ≤ +1 battle and ≤ ±1 OS against the primary-only baseline.

## 7. Leadership AI (utility scoring)

Used by the World mode (opt-in) and the Region of Doom generator.

```
score(action) = w1*goalFit + w2*opportunity - w3*risk - w4*cost + w5*doctrineBias + noise
```

Actions: Expand, Recruit, Raid, Infiltrate, Ally, Betray, Purge, Retreat, Fortify. Weights per Leader archetype (Zealot: high goalFit and doctrineBias; Gambler: high opportunity; Strategist: low noise). Seeded noise: `rng(hash(worldSeed, tick, factionId))`. All scored decisions log to the event log as `faction.decision` with the top 3 candidates for debugging.

## 8. Performance and budgets

| Concern | Budget |
| --- | --- |
| PR load | ≤ 1.5 s on target hardware; stream assets; show the transition |
| PR memory | ≤ 120 MB per instance; one PR loaded at a time |
| Ambush roll | O(1) per node |
| Faction tick (World mode) | ≤ 5 ms for 12 factions |
| Save size | Arc + faction state ≤ 64 KB per run |

## 9. Region of Doom generator

Pure function: `generate(ledger: DoomLedger, seed: string): DoomRegion`. Steps are those in `REGION_OF_DOOM.md` §4. No I/O. Deterministic. Unit-testable with fixture ledgers (empty, one entry, full 9-region, adversarial).

## 10. Persistence

| Layer | Contents | Lifetime |
| --- | --- | --- |
| **Run** (default) | ArcState, FactionState for the region, raids, rep | Until the run ends |
| **Save-World** (opt-in) | Faction states across regions, relations, lifecycle | Until the save is deleted |
| **Doom Ledger** (always on) | Ended-states and aggregates (no personal data) | Profile lifetime |

Migration: each layer has a `schemaVersion`; migrations are pure functions with fixtures. The Doom Ledger migration must never drop entries.

## 11. UI contracts

- **News report:** `playNews(report: NewsReport): Promise<void>` then `await choice(['Take them on','Stay out of it'])`. The report is skippable only after the first full play on a profile. Variant B inserts the rival block.
- **Situation Report:** Intel gates (25/50/75) decide detail; always shows the **time/risk** summary.
- **Raid offers:** a modal with the result stakes and a "Decline" button; declining is always available.
- **Accessibility:** captions on all news audio; flashing effects limited; the choice button text is never obscured by animation.

## 12. Telemetry (opt-in, local by default)

Aggregate counters: raid results, climax results, rival variants, stay-out rate, ambush counts, Heat peaks. Used only for balance tuning against the target win-rate bands.
