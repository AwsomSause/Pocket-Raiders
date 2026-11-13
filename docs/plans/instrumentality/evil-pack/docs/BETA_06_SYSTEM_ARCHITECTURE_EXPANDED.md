# BETA 0.6 — SYSTEM ARCHITECTURE — EXPANDED EDITION

**Extends:** `docs/BETA_06_SYSTEM_ARCHITECTURE.md` (every rule there still holds; this file adds to it)
**Read with:** `docs/expanded/BETA_06_DESIGN_DOCUMENT_EXPANDED.md` (Volume II), `docs/GRAND_ARC.md`, `data/expansion.json`
*Engine-agnostic. Types are TypeScript-style pseudocode, as in the base document. Values come from Volume II; this document says where they live and how they run.*

---

## X1. What this file adds

The base architecture runs one arc per region: a Director, Heat, raids, a climax, a rival roll. The Expanded Edition adds a named cast, world-state tracks, story events, six battle formats, a longer climax, and one thread across regions. This document gives each of those a module, a data model and a deterministic way to run.

Three architectural rules carry over and are worth restating, because every new system leans on them:

1. **Authored text is data.** No name, line, trait or district is hard-coded. All of it is parsed from the scripts into `data/expansion.json`.
2. **Everything is seeded.** Every new roll has its own named stream (X11), so adding a system never changes another system's results.
3. **Pseudo Stages never advance `stageIndex`.** Every new phase, raid and event is a detour.

One rule is new:

4. **Every expansion layer is behind a flag, and the base path is the fallback.** With all flags off, no module in `expansion/` is loaded.

---

## X2. Module map, additions

```
expansion/
  expansionRegistry.ts    loads data/expansion.json: cast, special Pokémon, special Shadows, lines, events, raids
  settings.ts             climax.cut, grandArc.enabled, events.density, format.cards, per-region what-if switches
cast/
  dossier.ts              named characters: status (at-large | beaten | turned | ally), what-if conditions
  variantLines.ts         14 line rules as battle hooks
  specialPokemon.ts       signature traits as battle hooks; obtainability
tracks/
  worldTrack.ts           one reducer for all ten tracks
  trackEffects.ts         step -> world changes (lines, shop, routes, wild pool, one field rule)
events/
  storyEvents.ts          xe.* loader, trigger evaluation, density selection
  quietNodeScheduler.ts   one queue for everything that wants a quiet node (X10)
formats/
  format.ts               WideFormat interface
  siegeMap.ts  blackout.ts  front.ts  convoy.ts  colossus.ts  debate.ts
  breather.ts
arc/ (extended)
  climaxExtended.ts       builds the Extended Cut phase list from script data
  raidsExtended.ts        Raids 4-5, defended raids, levers
  standWithExtended.ts    Duty Roster, inverted Colossus, Audit
  rivalClimaxExtended.ts  wide Assists, keepsake and shadow terms, Breather scene
  rescueExtended.ts       holding clock, plans 4-5, complications, the Pound
  secondRivalExtended.ts  Errand, Eve, district, Annex, postcards
  returningTeamsExtended.ts  beats R1b, R2b, R3b, R5; three more stances; favors
shadow/ (extended)
  shadowKeys.ts           Named Shadows, key types, hints, missed-key fallback
  apex.ts                 12 Apex definitions, parts, signature moves
  reclaim.ts              Reclaim ambush variant
  snagMachines.ts         two Machines, Snag rules, the list
  reservoir.ts            tank banks, Reservoir Return
  heartScars.ts           24 scars
grandArc/
  liaisons.ts             nine liaisons, where each is fought
  dataRoms.ts             nine ROMs: earned-in-region | late | missing
  stockTrack.ts           run-wide track (uses worldTrack.ts)
  carried.ts              cross-region flags, read-if-present
  finale.ts               gate, phases, results
doom/ (extended)
  doomAnnexes.ts          five annexes from finale / rainbow / ledger flags
  doomGyms.ts             eight Gyms, Marks, placeholder Leaders
  takeover.ts             Takeover runner
  margin.ts               the Vote, margin.result
ui/ (new)
  siegeMapScreen.ts  trackPage.ts  dossierScreen.ts  fieldNotes.ts
  colossusPlate.ts  formatHud.ts  situationReportExtended.ts
tools/
  build_expansion.js      Markdown -> data/expansion.json, with validation
```

---

## X3. Data models

### X3.1 Cast and special Pokémon

```ts
type Mark = 'canon' | 'what-if' | 'original';
type CastStatus = 'unmet' | 'at-large' | 'beaten' | 'turned' | 'ally';

interface SpecialCharacter {
  id: `sc.${string}.${string}`;   // sc.<team>.<slug>
  team: string;                   // id in evil_teams.json, or 'cipher'
  name: string; rank: string;     // a ladder rank, or Ally | Liaison | Civilian | ...
  mark: Mark;
  role: string; ace: string; voice: string;
  winBack?: ConditionRef;         // required when mark === 'what-if'
  disabledBy?: SettingKey;        // e.g. 'rocket.x.triad'
}

type Obtainable = 'no' | 'yes' | 'ally-only' | 'returned';

interface SpecialPokemon {
  id: `sv.${string}.${string}`;
  team: string; name: string;
  species: string[];              // every entry must exist in the Pokédex
  lineId: LineId;
  trait: { name: string; text: string; announce: string };
  whereMet: string;
  obtainable: Obtainable; obtainCondition?: ConditionRef;
  keepsLineWhenObtained: boolean; // true for Tidebound, Cinderborn
}

interface VariantLine {
  id: LineId; team: string; ruleName: string; text: string;
  hooks: BattleHook[];            // onEntry, onHit, onTurnEnd, onSwitchIn ...
  isBinding: 'no' | 'partly' | 'yes';   // how it combines with Shadow state
  removableBy?: ('knock-off' | 'win' | 'purify' | 'rest-node')[];
}
```

### X3.2 Special Shadows

```ts
type ShadowClass = 'common' | 'named' | 'story' | 'apex';
type KeyType = 'person' | 'place' | 'object' | 'act' | 'story';

interface SpecialShadow {
  id: `ss.${string}.${string}`;
  code?: `XD${string}`;           // Apex only, XD001..XD012, unique
  team: string; name: string; species: string[];
  tier: 1 | 2 | 3 | 4;
  ability: ShadowAbilityId;       // one of 36
  moves: ShadowMoveId[];          // from the 30, or this script's signature move
  cls: ShadowClass;
  key?: { type: KeyType; condition: ConditionRef; hints: [LineRef, LineRef, LineRef] };
  obtainable: boolean;
}

// The base ShadowRecord (base §2) gains:
interface ShadowRecordExt {
  cls: ShadowClass;
  specialId?: string;             // ss.* id if this is a special Shadow
  keyState?: 'unhinted' | 'hinted-1' | 'hinted-2' | 'known' | 'met' | 'missed';
  stabilized: boolean;
  heartScars: HeartScarId[];      // max 2
  reclaimedThisRegion: boolean;
}

interface ApexDef {
  code: string; shadowId: string;
  parts: { id: string; name: string; removesMove: ShadowMoveId | 'obedience'; breakLine: LineRef }[];
  signatureMove: ShadowMoveId;    // must be removed by part 1 or part 2
  timerBySet?: Partial<Record<SetId, number>>;   // overrides the default table
  double?: string;                // the other Apex's code, for Sinnoh
}
```

### X3.3 Tracks and events

```ts
interface WorldTrackDef {
  id: string;                     // 'rocket.x.ledger'
  scope: 'region' | 'run';        // only cipher.x.stock is 'run'
  steps: [StepDef, StepDef, StepDef, StepDef, StepDef];
}
interface StepDef {
  name: string;
  effects: TrackEffect[];         // each is one of the allowed kinds in Volume II §X3.2
  civilianLine: LineRef; momentScene?: SceneRef;
}
type TrackEffect =
  | { kind: 'lines' | 'music' | 'weather' | 'lighting'; ref: string }
  | { kind: 'shop'; priceDelta: number /* -0.15..+0.15 */; stock?: string[] }
  | { kind: 'field-rule'; routes: string[]; rule: FieldRuleId; counter: string }
  | { kind: 'wild-pool'; add?: string[]; remove?: string[] }
  | { kind: 'event'; add?: string; remove?: string };

interface StoryEvent {
  id: `xe.${string}.${string}`;
  scale: 'street' | 'city' | 'region' | 'border';
  trigger: { node: NodeType[]; when: ConditionRef };
  anchor: boolean;                // one per region; always occurs
  forced: boolean;                // if true, must define onWin and onLose
  choices: { label: string; outcome: Outcome[] }[];   // 2 or 3
  battle?: { optional: boolean; tierDelta: 0 | 1 };
  writes: FlagWrite[];
}
```

### X3.4 The extended arc state

```ts
interface ArcStateExt extends ArcState {
  track: { id: string; step: 0 | 1 | 2 | 3 | 4 | 5; history: TrackChange[] };
  raids: { id: string; n: 1 | 2 | 3 | 4 | 5 | 6; offered: boolean; result?: RaidResult; defended?: boolean }[];
  eventsSeen: string[];           // xe.* ids
  cast: Record<string, CastStatus>;
  liaison?: { id: string; beaten: boolean; where?: 'raid' | 'climax' | 'audit' | 'late' };
  cut: 'standard' | 'extended';
  siege?: SiegeMapState;          // set in Phase 0b
  apex?: { code: string; result?: 'freed' | 'taken' };
  standwith?: StandWithState;     // see STAND_WITH_THEM_EXPANDED X13
  rescue?: RescueStateExt;        // see RIVAL_RESCUE_PLAN_EXPANDED X12
  friend?: FriendStateExt;        // see SECOND_RIVAL_EXPANDED X11
  roaming?: { stance: StanceId; favors: 0 | 1 | 2 | 3; beatsDone: string[] };
}
```

### X3.5 The run-wide state

```ts
interface GrandArcState {
  enabled: boolean;
  roms: Record<RomLetter, 'missing' | 'in-region' | 'late'>;   // K J H S U X A G P
  stock: 0 | 1 | 2 | 3 | 4 | 5;
  carried: Record<string, unknown>;   // flags in GRAND_ARC.md §4; read only if present
  apexResults: Record<string, 'freed' | 'taken'>;
  finale?: { offered: boolean; result?: 'sung' | 'silent' | 'sold' | 'declined';
             rainbow?: 'empty' | 'closed' | 'open' };
}
```

---

## X4. The Arc Director, extended

```
Dormant -> Rumors -> Ignited -> Pursuit
   -> Raid1? -> Raid2? -> [Raid4?] -> [Raid3 conditional] -> [Raid5?]
   -> ClimaxScheduled -> News -> Choice
   -> { ClimaxPS(standard | extended) | ClimaxAlliedPS(standard | extended) | StayOut }
   -> Aftermath -> Closed
   -> (after the run's last region) FinaleGate -> { FinalePS | Declined }
```

- Story events, track changes and roaming beats are **not** states. They are directives raised while the Director is in `Pursuit` or between raids, and they pass through the quiet-node scheduler (X10).
- Raid 4 is offered after Raid 2 resolves. Raid 5 is offered after Raid 3 resolves or when the track reaches step 4. Both are optional, like every raid.
- `FinaleGate` is evaluated once, after the Aftermath of the last regional climax in the run.

### X4.1 The track reducer

One pure function serves all ten tracks.

```ts
type TrackSignal =
  | { t: 'ignite' } | { t: 'raid'; result: RaidResult } | { t: 'idle-12-nodes' }
  | { t: 'climax-scheduled' } | { t: 'officer-turned' } | { t: 'script-event'; delta: -1 | 1 };

function reduceTrack(step: number, s: TrackSignal, regionActive: boolean): number {
  const d =
    s.t === 'ignite' ? +1 :
    s.t === 'raid' ? (s.result === 'failure' || s.result === 'declined' ? +1
                    : s.result === 'success' || s.result === 'triumph' ? -1 : 0) :
    s.t === 'idle-12-nodes' ? +1 :
    s.t === 'climax-scheduled' ? +1 :
    s.t === 'officer-turned' ? -1 : s.delta;
  const floor = regionActive ? 1 : 0;
  return clamp(step + d, floor, 5);
}
```

`trackEffects.apply(def, oldStep, newStep)` diffs the two steps' effect lists and raises directives. A static check at build time rejects any `TrackEffect` outside the allowed kinds, any price delta beyond ±15%, and any field rule without a `counter`.

### X4.2 The raid bound, with five raids

```ts
function osAfterRaids(baseOS: number, deltas: number[]): number {
  const total = clamp(sum(deltas), -2, +2);   // Volume I §6.6: still ±2 tiers in total
  return baseOS + total;
}
```

Levers from Raids 4 and 5 do not go through `osAfterRaids`. They write `SiegeMapState`, `ApexDef` part states, cast statuses, or phase flags, and a build-time check confirms each new raid's Lever touches only those.

---

## X5. Wide formats

### X5.1 One interface

```ts
interface WideFormat<S, R> {
  id: 'siege' | 'blackout' | 'front' | 'convoy' | 'colossus' | 'debate';
  setup(ctx: ClimaxCtx, rng: RNG): S;
  describe(s: S): FormatCard;                 // the one-screen explanation and the HUD model
  onBattleEnd?(s: S, b: BattleResult): S;     // formats that wrap ordinary battles
  onTurn?(s: S, t: TurnCtx): TurnDirective[]; // formats that add turn-level rules
  isOver(s: S): boolean;
  result(s: S): R;
}
```

Every format composes ordinary battles. None replaces the battle engine.

### X5.2 Siege Map

```ts
type DistrictState = 'held' | 'contested' | 'lost';
interface District { id: string; name: string; state: DistrictState;
                     heldIf: ConditionRef[]; benefit: SiegeEffect; lostEffect: SiegeEffect;
                     holder?: AllyId; fallOrder: number }
interface SiegeMapState { districts: District[]; playerClaim?: string; locked: boolean }

function setupSiege(ctx: ClimaxCtx): SiegeMapState {
  const ds = ctx.script.districts.map(d => ({ ...d,
      state: d.heldIf.some(ctx.test) ? 'held' : 'contested' }));
  const toFall = Math.max(0, ctx.arc.track.step - 2);
  ds.filter(d => d.state === 'contested').sort(by('fallOrder')).slice(0, toFall)
    .forEach(d => d.state = 'lost');
  return { districts: ds, locked: false };
}
function resolveAfterPhase1(s: SiegeMapState): SiegeMapState {
  s.districts.forEach(d => { if (d.state === 'contested') d.state = d.holder ? 'held' : 'lost'; });
  return s;
}
function activeLostEffects(s: SiegeMapState): SiegeEffect[] {
  return s.districts.filter(d => d.state === 'lost').sort(by('fallOrder')).slice(0, 3).map(d => d.lostEffect);
}
```

`SiegeEffect` is a closed union (Breather heal, timer ±1, reveal first move, and so on, as listed in Volume II §X4.1). A static check rejects any effect that changes enemy level or team size.

### X5.3 Blackout

```ts
interface BlackoutState { condition: FieldRuleId; switchCount: 0 | 1 | 2 | 3; off: boolean; winsNeeded: number; wins: number }
// off when wins >= winsNeeded, or switchCount === 3, or the Breather is reached.
```

"Go for the Switch" is a battle action available only while `!off`: the active Pokémon does not attack; if it has not fainted at end of turn, `switchCount++`.

### X5.4 Front

```ts
interface Lane { id: 1 | 2 | 3; mine: PartyRef[]; ally?: AllyId; enemy: TrainerRef; state: 'open' | 'won' | 'lost' }
interface FrontState { lanes: [Lane, Lane, Lane]; commanded: 1 | 2 | 3; turn: number; required: boolean }

function frontTurn(s: FrontState, cmd: Command): FrontState {
  for (const lane of s.lanes) if (lane.state === 'open') {
    if (lane.id === s.commanded) resolvePlayerAndEnemy(lane, cmd);
    else if (lane.ally) resolveAllyAndEnemy(lane);
    else if (s.turn % 2 === 0) resolveEnemyOnly(lane, /* guard = */ 0.5);  // holding lane: hit every 2nd turn, 50% damage
  }
  return next(s);
}
// over when two lanes are won (win) or two are lost (loss).
```

### X5.5 Convoy

```ts
interface ConvoyState { distance: 0 | 1 | 2 | 3 | 4 | 5; battles: BattleSpec[]; index: number; par: number[] }
function onBattleEnd(s: ConvoyState, b: BattleResult): ConvoyState {
  if (!b.won) return { ...s, index: s.battles.length };     // wipe: phase rule applies
  const d = b.turns <= s.par[s.index] ? -1 : +1;
  return { ...s, distance: clamp(s.distance + d, 0, 5), index: s.index + 1 };
}
// caught: distance === 0, or finished with distance <= 2. Escaped: distance === 5, or finished with distance >= 3.
```

### X5.6 Colossus

```ts
interface ColossusState { apex: ApexDef; parts: { id: string; shield: number; max: number; broken: boolean }[];
                          timer: number; inverted: boolean; signatureWarned: boolean }

function partShield(setId: SetId, apexMaxHp: number, partCount: number): number {
  const pct = 0.14 + 0.02 * (setIndex(setId) - 1);          // Set-1 14% ... Set-9 30%
  return Math.round(apexMaxHp * pct * (partCount > 5 ? 2 / 3 : 1));
}
function routeDamage(s: ColossusState, dmg: number, target: string | 'spread'): ColossusState {
  const live = s.parts.filter(p => !p.broken);
  if (target === 'spread') live.forEach(p => hit(p, dmg / live.length));
  else hit(live.find(p => p.id === target)!, dmg);
  return s;                                                  // the body's HP never changes
}
// over when every part is broken (freed), or timer === 0 (loss; relaxed at the finale).
```

For the inverted Colossus on the Stand-with route, the same state is used with `inverted: true`: the defenders call `routeDamage`, and the player's side receives a 25% reduction while any part stands.

### X5.7 Debate

```ts
interface DebateState { exchanges: { claim: LineRef; winning: (ItemId | FlagId)[] }[]; won: number; index: number }
// result: won === 3 -> 'clean'; won === 2 -> 'objection'; else -> 'battle'
```

### X5.8 The Extended Cut runner

```ts
function buildPhases(ctx: ClimaxCtx): Phase[] {
  if (ctx.arc.cut === 'standard') return ctx.script.basePhases;        // untouched base path
  const p = ctx.script.extendedPhases;                                 // parsed from the script's phase table
  return [
    p.news, p.siege,                 // 0, 0b
    p.approach,                      // 1: blackout or convoy
    p.gauntlet, savePoint(),         // 2
    p.officers,                      // 3 (liaison duel present only if grandArc.enabled)
    breather(healPct(ctx.arc.siege)), savePoint(),
    p.setPiece, p.leader,            // 4, 5
    p.apex,                          // 6: colossus
    ...(ctx.test(p.optional.when) ? [optional(p.optional)] : []),   // 7: cannot end the run
    p.resolution                     // 8
  ];
}
```

`savePoint()` is a save-and-quit point and, only when `climax.allowWithdraw` is on, a withdraw point. It is never a retry: a wipe in phases 1–6 calls the base `climax.defeat` path unchanged.

---

## X6. The Grand Arc

### X6.1 ROMs and carried flags

```ts
function awardRom(g: GrandArcState, letter: RomLetter, how: 'in-region' | 'late'): GrandArcState {
  if (!g.enabled) return g;
  if (g.roms[letter] === 'in-region') return g;              // never downgraded
  g.roms[letter] = how;
  const held = count(g.roms, v => v !== 'missing');
  if (held % 3 === 0) g.stock = Math.max(0, g.stock - 1) as any;   // every third ROM removes a Stock step
  return g;
}

function readCarried<T>(g: GrandArcState, key: string, otherwise: T): T {
  return key in g.carried ? g.carried[key] as T : otherwise;   // any-order rule: never assume a flag exists
}
```

**The any-order rule is enforced by the type.** `carried` can only be read through `readCarried`, which demands a default. A scene that needs "what happened in Johto" must say what it does when Johto has not happened.

### X6.2 The finale gate

```ts
function finaleGate(g: GrandArcState, run: RunState): 'offer' | 'skip' {
  if (!g.enabled || !run.isLastRegionClosed) return 'skip';
  return count(g.roms, v => v !== 'missing') >= 3 ? 'offer' : 'skip';   // skip writes finale.result = 'declined'
}

function xd001Locks(g: GrandArcState): number {
  const open = count(g.roms, v => v === 'in-region');                    // late ROMs do not open locks
  const extra = readCarried(g, 'cipher.lugia-reading', false) ? 1 : 0;
  const keyLair = readCarried(g, 'raid.key-lair.triumph', false) ? 1 : 0;
  return Math.max(0, 9 - open + extra - keyLair);                        // 0 => XD001 is not fought
}
```

### X6.3 The one relaxed rule

```ts
function onFinaleLoss(run: RunState): void {
  run.finale = { result: 'silent' };       // 'won, finale lost'
  // run.ended stays 'victory'. This is the only climax-shaped PS whose loss does not set run.ended.
}
```

A unit test asserts that `finale.ts` is the only module that can complete a climax-kind Pseudo Stage with a loss and leave `run.ended` untouched.

---

## X7. Shadow system, extended

### X7.1 Keys

```ts
function onKeyCondition(rec: ShadowRecordExt, def: SpecialShadow, ctx: Ctx): void {
  if (def.cls !== 'named' || rec.keyState === 'missed') return;
  if (ctx.test(def.key!.condition)) { rec.corruption = 0; rec.keyState = 'met'; grantScar(rec, scarFor(def.key!.type)); }
}
function onKeyImpossible(rec: ShadowRecordExt): void { rec.keyState = 'missed'; rec.cls = 'common'; }   // never a dead end
function purifyStrength(rec: ShadowRecordExt, base: number): number {
  return rec.cls === 'named' && rec.keyState !== 'missed' ? base * 0.5 : base;
}
```

A key met *before* the Pokémon is obtained is remembered as a flag; `obtain()` checks it and delivers the Pokémon Clear.

### X7.2 Obedience, with the new tiers of detail

```ts
function willDisobey(rec: ShadowRecordExt, rng: RNG, ctx: TurnCtx): 'obey' | 'hesitate' | 'disobey' {
  const tier = effectiveTier(rec, ctx);                    // Unfinished: -1 for obedience; Recall: +1
  if (rec.stabilized && tier === 3) return 'obey';
  const p = tier === 4 ? (rec.stabilized ? 0.10 : 0.25) : tier === 3 ? 0.15 : 0;
  if (rng() < p) return 'disobey';
  if (tier === 1 && rng() < 0.05) return 'hesitate';
  return 'obey';
}
// The result is computed at the START of the turn and shown before commands resolve (base §2.3).
```

Tier is recalculated only in `onTurnEnd`. Nothing reads a mid-turn tier.

### X7.3 Reclaim, Machines, Reservoir

```ts
function reclaimEligible(f: FactionState, party: Party, arc: ArcStateExt): PokemonRef | null {
  if (!f.awake || f.heat < 50 || arc.flags.reclaimDone) return null;
  return party.find(p => p.shadow?.boundBy === f.factionId && !(p.shadow.stabilized && p.benched)) ?? null;
}
function canSnag(target: BattlePokemon, machine: 'gonzap' | 'krane'): boolean {
  if (target.special?.cls === 'apex' || target.special?.cls === 'story') return false;
  if (target.heartScars.includes('named') || target.traits.includes('too-small-to-snag')) return false;
  return machine === 'gonzap' || !!target.shadow;          // Krane's takes only Shadow Pokémon
}
function openBank(region: RegionId, g: GrandArcState, party: Party, ask: (p: PokemonRef) => boolean): void {
  const full = g.roms[romOf(region)] === 'in-region';
  for (const p of party.filter(q => q.shadow?.originRegion === region)) {
    if (p.shadow!.stabilized && !ask(p)) continue;         // a Stabilized Pokémon is always asked
    p.shadow!.corruption = full ? 0 : dropOneTier(p.shadow!.corruption);
  }
}
```

---

## X8. Rival, rescue, Friend and Stand-with hooks

The four expanded companions add state and rules to existing modules. Each is a small extension, not a new system.

| Module | Adds | Key functions |
| --- | --- | --- |
| `rivalClimaxExtended.ts` | Wide Assists; two Turn terms; the Breather scene | `wideAssists(archetype)`, `turnScore(base, keepsake, shadowTerm)`, `breatherScene(attitude)` |
| `rescueExtended.ts` | Holding clock; plans 4 and 5; complications; the Pound | `holdingState(nodesHeld)`, `plansAvailable(ctx)`, `drawComplication(seed)`, `poundDistrict(siege)` |
| `secondRivalExtended.ts` | Errand, Eve, spar; district or Annex; postcards | `friendDistrict(siege)`, `annex(siege)`, `schedulePostcard(region)` |
| `standWithExtended.ts` | Duty Roster; inverted Colossus; Audit; orders | `dutyRoster(as)`, `invert(colossus)`, `audit(result)`, `firstOrders()` |

```ts
function turnScore(b: BaseTurnTerms, keepsake: boolean, playerShadow: 'none' | 'unstable-fallen-active' | 'purified-this-region'): number {
  const k = keepsake ? 1 : 0;
  const s = playerShadow === 'unstable-fallen-active' ? -1 : playerShadow === 'purified-this-region' ? 1 : 0;
  return b.attitude + b.choice + b.raidBonus + b.memoryBonus + k + s;   // turn if >= 3, as before
}

function assistBudget(cut: 'standard' | 'extended', primary: 'help' | 'beat' | 'side'): { total: number; friend: number } {
  const friend = primary === 'beat' ? 3 : primary === 'side' ? 2 : cut === 'extended' ? 2 : 1;
  return { total: cut === 'extended' ? 6 : 4, friend };
}
```

---

## X9. Region of Doom, extended

`generate(ledger, seed)` stays a pure function. It gains three inputs, all from the ledger: `finale.result`, `rainbow.result`, and the Apex results.

```ts
function annexes(l: DoomLedger): AnnexId[] {
  const a: AnnexId[] = [];
  if (l.finale === 'silent' || l.finale === 'sold') a.push('depot');
  if (l.finale === 'sung') a.push('returns-office');           // never together with 'depot'
  if (l.rainbow === 'open') a.push('rainbow-arcade');
  if (l.keptKraneMachine) a.push('chamber');
  if (l.entries.some(e => e.ended === 'triumphant')) a.push('winners-hill');
  return a;
}
function gymTeamSize(marksHeld: number): 4 | 5 | 6 { return marksHeld <= 1 ? 4 : marksHeld <= 5 ? 5 : 6; }
function ambushRate(level: number): number { return Math.min(0.35, 0.20 + 0.03 * Math.floor(level)); }
```

The district count stays 14 for every ledger. Annexes are attached to districts and are not districts.

---

## X10. The quiet-node scheduler

Many systems now want "the next quiet node": the Rescue Plan's offers, rival scenes, the Friend's four encounters, story events, roaming beats, postcards, and the general Run Events pool. One scheduler owns the queue, so that nothing stacks.

```ts
type QuietKind = 'rescue-offer' | 'rival-scene' | 'friend-encounter' | 'story-event-anchor'
               | 'story-event' | 'roaming-beat' | 'postcard' | 'run-event';

const PRIORITY: Record<QuietKind, number> = {
  'rescue-offer': 1, 'rival-scene': 2, 'friend-encounter': 3, 'story-event-anchor': 4,
  'story-event': 5, 'roaming-beat': 6, 'postcard': 7, 'run-event': 8
};

function pickForNode(q: QuietRequest[], node: NodeCtx, last: QuietKind | null): QuietRequest | null {
  if (!node.quiet || node.hasAmbush) return null;
  const ok = q.filter(r => r.eligible(node))
              .filter(r => !(isStory(r.kind) && isStory(last)))        // no two story events in a row
              .filter(r => !(r.hasBattle && node.afterRaidOffer));     // no two long things in a row
  return ok.sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind] || a.due - b.due)[0] ?? null;
}
```

- **One item per node.** Everything else waits.
- **Nothing starves.** A request that has waited five nodes rises one priority level; a request with a hard deadline (the climax-eve Rescue offer, the Friend's Eve) is placed first on its last eligible node.
- **Postcards never block anything** and may share a node with a `run-event`.

---

## X11. Seed streams

Every new roll has its own stream, so that no system's presence changes another's results. Stream key: `hash(runSeed, regionId?, name)`.

| Stream name | Used for |
| --- | --- |
| `events-density` | Which five of eight story events occur |
| `event-<id>` | Any roll inside one story event |
| `roaming-stance` | Whether a kit uses one of the three new stances |
| `roaming-double-booking` | The 40% Double Booking roll |
| `rescue-complication` | Which of 12 complications |
| `rescue-cellmate` | The 20% cellmate roll |
| `friend-postcard` | Enclosure choice |
| `shadow-obey-<pokemonId>-<turn>` | Disobedience and hesitation |
| `shadow-reclaim` | Whether an ambush becomes a Reclaim |
| `siege-fall-order` | Tie-breaks when a script lists no order |
| `convoy-par` | ±1 variation in par, if enabled |
| `doom-annex`, `doom-gym-<n>`, `doom-chair` | Region of Doom generation |
| `finale-<phase>` | Any roll inside the finale |

The base streams (`rival-climax`, `second-rival-*`, `rescue-wait`, `rescue-roll`, `roaming-placement`) are unchanged, and a replay test asserts that turning any Expanded setting on or off leaves every base roll identical.

---

## X12. The data pipeline

```
scripts/expanded/*.md  --tools/build_expansion.js-->  data/expansion.json
                                                   -> docs/SPECIAL_VARIANTS_AND_SHADOWS.md (generated)
docs/expanded/*.md     --(human-readable specs; tables with a Species column are validated)--
tools/verify_beta06.js  sections 15-16: expansion in sync, minimums met, species valid
```

### X12.1 `data/expansion.json`

| Key | Contents |
| --- | --- |
| `scripts` | One entry per expanded script: counts and word totals |
| `characters` | 143 entries (X3.1) |
| `specialPokemon` | 110 entries |
| `specialShadows` | 58 entries, 12 with a code |
| `signatureMoves` | 12 entries |
| `variantLines` | 14 entries |
| `events` | 80 ids |
| `raids` | 20 site ids |

### X12.2 Data still to be extracted

The parser currently extracts rosters and ids. Four more tables are specified in the scripts in a fixed shape and are the next things to extract. Until then, they are read from the Markdown by hand.

| Future file | From | Shape |
| --- | --- | --- |
| `data/tracks.json` | Scripts §E1.2 | `WorldTrackDef[]` |
| `data/siege_maps.json` | Scripts §E7 Phase 0b | `District[]` per region |
| `data/climax_extended.json` | Scripts §E7 phase tables | Phase lists per region |
| `data/apex.json` | Scripts §E4 and §E7 Phase 6 | `ApexDef[]` |

### X12.3 Validation rules, as code

The build fails on: a malformed id; an unknown team; a species absent from the Pokédex; a tier, ability or move absent from the Shadow data; a duplicate Apex code; a what-if character with no way back; a signature move not removed by an Apex's first two parts; a `TrackEffect` outside the allowed kinds; a Siege effect that changes enemy strength; a forced event without both outcomes; a script under its minimums.

---

## X13. Persistence and migration

| Layer | New contents | Notes |
| --- | --- | --- |
| **Run** | `ArcStateExt` per region; `GrandArcState`; `roaming.favors`; Friends met; settings in force | All per run (decision D7) |
| **Doom Ledger** | `finale.result`, `rainbow.result`, `xd002`..`xd012` results, `margin.result`, `hostage:friend`, Marks held, `keptKraneMachine`, flowers in the Long Bed | Meta. Never dropped by a migration |
| **Save-World** | Unchanged | Opt-in, as before |

- **Schema versions.** `ArcState` v2 adds the fields in X3.4, all optional, so a v1 save loads with the Expanded layers simply absent. `DoomLedger` v2 adds the fields above with defaults.
- **Mid-run toggles.** Changing `climax.cut` or `events.density` between regions is safe. Changing `grandArc.enabled` mid-run is allowed in one direction only: on to off. Turning it back on in the same run would leave ROM states inconsistent, so the setting is locked until the run ends.
- **Save size.** The budget rises from 64 KB to **96 KB** per run for arc and faction state. The largest new item is cast status (143 small enums).

---

## X14. Performance and budgets

| Concern | Budget |
| --- | --- |
| Loading `expansion.json` | Once per session; ≤ 40 ms; indexed by id |
| Track reducer and effects diff | O(effects); ≤ 1 ms |
| Quiet-node scheduler | O(n log n) over at most a few dozen requests; ≤ 1 ms per node |
| Siege Map setup | O(districts × conditions); ≤ 2 ms |
| Front turn | Three ordinary turn resolutions; no extra AI search depth |
| Colossus damage routing | O(parts) |
| Extended Cut memory | Still one Pseudo Region loaded at a time. Phase 6 and Phase 7 may need a second map: unload before loading (the Breather is the natural place) |
| Region of Doom generation | ≤ 50 ms for a full ledger with all annexes |

---

## X15. UI contracts

```ts
showSiegeMap(state: SiegeMapState, allies: AllyCard[]): Promise<SiegeMapState>   // returns the locked state
showFormatCard(card: FormatCard, mode: 'first-time' | 'always' | 'never'): Promise<void>
colossusPlate.update(s: ColossusState): void          // body HP always rendered as locked
announce(line: LineRef, when: 'before-resolve'): Promise<void>   // traits, line rules, signature moves, format events
trackPage.render(def: WorldTrackDef, step: number, next: { name: string; cause: string }): void
dossier.set(id: string, status: CastStatus): void
fieldNotes.reveal(id: string, part: 'name' | 'trait' | 'key-type' | 'key'): void
```

- `announce(..., 'before-resolve')` is the contract behind Volume II's promise P5. The battle loop may not apply an announced effect until the promise resolves.
- `showSiegeMap` must render both the benefit and the Lost effect of every district at once, and the reason for each starting state.
- No screen may show a capture prompt for a special Pokémon whose `obtainable` is `no`.

---

## X16. Telemetry (opt-in, local by default)

Added counters, for tuning only: track step at each climax; districts Held, Contested and Lost at Phase 0b; Blackout turns before the switch; Front lanes won and lost; Convoy outcomes; Colossus turns used and parts pre-broken; Phase 7 taken or skipped; ROMs earned in-region and late; finale result; keys met and missed; Reclaim outcomes; cut in use.

---

## X17. Invariants

These are checked by tests and, where possible, by types.

1. With every Expanded setting off, no `expansion/`, `formats/`, `tracks/`, `events/` or `grandArc/` module is loaded, and a full run's event log is identical to the base build's for the same seed.
2. Toggling any single Expanded setting leaves every base seed stream's output unchanged.
3. No code path outside `climax.defeat` sets `run.ended` to a loss; `finale.ts` cannot call it.
4. `osAfterRaids` output is always within ±2 of its input.
5. No `TrackEffect` or `SiegeEffect` references enemy level, team size or AI tier.
6. `activeLostEffects` never returns more than three.
7. A Front with no allies is winnable by the reference party in simulation.
8. A Convoy's `escaped` result never calls `climax.defeat`.
9. A Colossus body's HP never decreases; a Colossus always ends by parts or by timer.
10. Every `SpecialShadow` of class `named` has a key, three hints, and a reachable `missed` fallback.
11. Every what-if `SpecialCharacter` has a `winBack` condition that at least one path through its region satisfies.
12. `carried` is never read except through `readCarried`.
13. The quiet-node scheduler never places two items on one node (postcards excepted) and never delays a deadline item past its deadline.
14. `DoomLedger` migrations preserve every entry and every Expanded field.
15. Every `announce` call for an effect precedes that effect's application in the event log.
