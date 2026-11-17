// 100k survey sim: plays seeded bot runs with the default settings on and writes one JSON line per run (gzip parts).
// Built to one file first (tools/sim100k/build.mjs), then:  node dist-sim/sim.mjs <outDir> <total> <shard> <shards>
// Run n is always the same run (seed "k<n>"); finished runs in <outDir> are skipped, so a stopped job can be resumed.
import { appendFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import * as A from '../../tests/unit/autoplay';
import { content } from '../../tests/unit/helpers';
import * as B from '../lib/simBot';
import * as R from '../../src/core/run';
import { chooseBackstory } from '../../src/core/story2/module';
import { maxHp } from '../../src/core/pokemon';
import * as Ru from '../../src/core/rules';
import { EXPANSION_SETTINGS_DEFAULTS as XS } from '../../src/core/expansion/schema';
import { currentMenu, ensureNodeMenu, entryDone, entryLocked, pickMenuEntry } from '../../src/core/nodeMenu/flow';
import { chooseEvent, eventView } from '../../src/core/events';
import { currentEnemy, type RunState } from '../../src/core/state';
import { forcedMoveIndex, itemProblem } from '../../src/core/battle/engine';
import { nuzlockeCatchProblem } from '../../src/core/nuzlocke';

type Cnt = Record<string, number>;

// The game copies the whole run state on every action (structuredClone). Run state is plain JSON data, so a plain
// recursive copy gives the same result several times faster. SIM_SLOWCLONE=1 keeps the built-in one (to compare).
const nativeClone = globalThis.structuredClone;
function fastClone<T>(v: T): T {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) { const n = v.length; const out = new Array(n); for (let i = 0; i < n; i++) { const x = v[i]; out[i] = x !== null && typeof x === 'object' ? fastClone(x) : x; } return out as T; }
  const proto = Object.getPrototypeOf(v);
  if (proto !== Object.prototype && proto !== null) return nativeClone(v);
  const out: Record<string, unknown> = {};
  for (const k in v) { const x = (v as Record<string, unknown>)[k]; out[k] = x !== null && typeof x === 'object' ? fastClone(x) : x; }
  return out as T;
}
// The story log lists (events, chronicle, replays) only ever get new entries added, so copies share the old entries.
// SIM_VERIFY=1 freezes the shared entries, so any code that did change one would crash and show up in the results.
const SHARE = ['events', 'chronicle', 'replays'];
const VERIFY = !!process.env.SIM_VERIFY;
const TRACE = !!process.env.SIM_TRACE;
const deepFreeze = (o: unknown): void => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } };
function cloneRun<T>(v: T): T {
  const r = v as unknown as Record<string, unknown>;
  if (r === null || typeof r !== 'object' || Array.isArray(r) || !r.story || !r.rng || !r.party) return fastClone(v);
  const out: Record<string, unknown> = {};
  for (const k in r) {
    if (k !== 'story') { out[k] = fastClone(r[k]); continue; }
    const st = r.story as Record<string, unknown>; const so: Record<string, unknown> = {};
    for (const sk in st) {
      const x = st[sk];
      if (SHARE.includes(sk) && Array.isArray(x)) { if (VERIFY) for (const el of x) deepFreeze(el); so[sk] = x.slice(); } else so[sk] = fastClone(x);
    }
    out.story = so;
  }
  return out as T;
}
if (!process.env.SIM_SLOWCLONE) globalThis.structuredClone = ((v: unknown) => (process.env.SIM_NOSHARE ? fastClone(v) : cloneRun(v))) as typeof structuredClone;
const OUT = process.argv[2]!;
const TOTAL = Number(process.argv[3] ?? 100000);
const SHARD = Number(process.argv[4] ?? 0);
const SHARDS = Number(process.argv[5] ?? 1);
const STEPS = Number(process.env.SIM_STEPS ?? 12000);
const WALL_MS = Number(process.env.SIM_WALL ?? 240_000);
const GOD_PCT = Number(process.env.SIM_GOD ?? 0.3);
const HEAL_PCT = Number(process.env.SIM_HEAL ?? 29.5);
const GOD_STEPS = Number(process.env.SIM_GOD_STEPS ?? 30000);
const GOD_WALL = Number(process.env.SIM_GOD_WALL ?? 300_000);
mkdirSync(OUT, { recursive: true });

const mulberry = (a: number) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const archetypes = [...content.archetypes.values()].filter((a) => a.available !== false).map((a) => a.id);
const FIVE = ['red', 'blue', 'green', 'hilda', 'nate'].filter((id) => archetypes.includes(id));
const backstories = content.storyData.backstories.map((b) => b.id);
const regionIds = content.regions ? [...(content.regions as Map<string, unknown>).keys()] : [];

interface Scn { id: string; group: 'classic' | 'story' | 'mode'; modeId: string; difficultyId: string; campaignId?: string; w: number }
const scns: Scn[] = [
  { id: 'classic-standard', group: 'classic', modeId: 'standard', difficultyId: 'standard', w: 40 },
  { id: 'classic-veteran', group: 'classic', modeId: 'standard', difficultyId: 'veteran', w: 6 },
  { id: 'classic-champion', group: 'classic', modeId: 'standard', difficultyId: 'champion', w: 5 },
  { id: 'classic-nightmare', group: 'classic', modeId: 'standard', difficultyId: 'nightmare', w: 4 },
  { id: 'story', group: 'story', modeId: 'standard', difficultyId: 'standard', campaignId: 'orrery-circuit', w: 15 },
  ...['quick-route', 'adventure', 'daily', 'endless', 'endless-tower', 'spooky', 'regional-circuit', 'multi-region', 'research-expedition', 'nuzlocke', 'hardcore-nuzlocke', 'modifier-run', 'rule-draft', 'time-pressure', 'weekly'].map((m) => ({ id: `mode-${m}`, group: 'mode' as const, modeId: m, difficultyId: 'standard', w: 2 })),
].filter((s) => !Ru.rulesProblem({ modeId: s.modeId, difficultyId: s.difficultyId, modifierIds: [], deathBlock: false } as Parameters<typeof Ru.rulesProblem>[0]));
const scnW = scns.reduce((a, s) => a + s.w, 0);

const expansionOf = (allOn: boolean) => ({
  finale: allOn || XS.finaleEnabled, doomEpilogue: allOn || XS.doomEpilogue, labyrinthResume: allOn || XS.labyrinthResume, stagePacing: XS.stagePacing, evolutionEncounters: XS.evolutionEncounters,
  leagueCounterPick: XS.leagueCounterPick, kantoCanon: XS.kantoSevii, grandArc: XS.grandArcEnabled, worldTracks: XS.worldTracks, eventsDensity: allOn ? 'full' as const : XS.eventsDensity,
  climaxCut: allOn ? 'extended' as const : XS.climaxCut, storyTraits: allOn || XS.storyTraits, rewinds: XS.rewinds, nodeMenus: XS.nodeMenus, blessings: XS.blessingsEnabled, ultraBeasts: XS.ultraBeastsEnabled,
  secondChancePct: XS.secondChancePct, heatedMoments: XS.heatedMoments, mythicalPromises: XS.mythicalsEnabled, wholeRunEvents: XS.wholeRunEvents,
});

function planOf(n: number) {
  const r = mulberry(n * 2654435761 + 97);
  let x = r() * scnW; let scn = scns[0]!;
  for (const s of scns) { if ((x -= s.w) < 0) { scn = s; break; } }
  const arch = r() < 0.5 && FIVE.length ? FIVE[Math.floor(r() * FIVE.length)]! : archetypes[Math.floor(r() * archetypes.length)]!;
  const g = r() * 100;
  const assist = g < GOD_PCT ? 'god' : g < GOD_PCT + HEAL_PCT ? 'heal' : 'none';
  const skill = r() < 0.5 ? 'strong' : 'smart';
  const curiosity = [0, 0.5, 1][Math.floor(r() * 3)]!;
  const settings = r() < 0.15 ? 'all-on' : 'default';
  const starterIdx = Math.floor(r() * 3);
  const backstory = scn.group === 'story' && backstories.length ? backstories[Math.floor(r() * backstories.length)]! : undefined;
  return { scn, arch, assist, skill, curiosity, settings, starterIdx, backstory, botSeed: Math.floor(r() * 2 ** 31) };
}

const bump = (m: Cnt, k: string, by = 1) => { m[k] = (m[k] ?? 0) + by; };
const norm = (s: string) => s.replace(/\b[pe]\d+\b/g, '#').replace(/\d{2,}/g, '#');
const NAMED = /rival|leader|elite|champion|boss|admin|legend/;

// Console noise from the game is a finding too.
let con: Cnt = {};
for (const lvl of ['warn', 'error'] as const) console[lvl] = (...a: unknown[]) => { bump(con, `${lvl}: ${norm(a.map(String).join(' ')).slice(0, 160)}`); };

function playOne(n: number): Record<string, unknown> {
  const p = planOf(n);
  const s = p.scn;
  const seed = `k${n}`;
  const god = p.assist === 'god';
  const row: Record<string, unknown> = { n, seed, scn: s.id, group: s.group, mode: s.modeId, diff: s.difficultyId, arch: p.arch, assist: p.assist, bot: 'collector', skill: p.skill, cur: p.curiosity, set: p.settings, bs: p.backstory ?? null };
  con = {};
  const bot = mulberry(p.botSeed);
  const C: Record<string, Cnt> = {};
  const c = (name: string): Cnt => (C[name] ??= {});
  const bugs: string[] = [];
  const tl: unknown[][] = [];
  const t0 = Date.now();
  const stepFn = ((cc: typeof content, rr: RunState) => A.step(cc, rr, true, p.skill === 'strong')) as typeof A.step;
  let maxParty = 0; let steps = 0, turns = 0, maxMoney = 0, stuck = 0, lastSig = '', lastSeq = 0, tlKey = '', siKey = '', longBattles = 0, maxBattleTurns = 0, dmgDealt = 0, dmgTaken = 0;
  let cur: null | { kind: string; classId: string; name: string; named: boolean; turns: number; lv: number; myLv: number; res: string | null; lead: string } = null;
  const tried = new Set<string>(); const trace: string[] = []; let lastEx = '';
  let exploreNode = '', exploreCount = 0;
  let run: RunState;
  try {
    const rules = { modeId: s.modeId, difficultyId: s.difficultyId, modifierIds: [] as string[], deathBlock: false } as Parameters<typeof Ru.rulesProblem>[0];
    if (s.modeId === 'regional-circuit') (rules as { regionId?: string }).regionId = regionIds[n % Math.max(1, regionIds.length)];
    run = R.createRun(content, { runId: `k-${n}`, seed, archetypeId: p.arch, campaignId: s.campaignId ?? 'full', rules, expansion: expansionOf(p.settings === 'all-on') } as Parameters<typeof R.createRun>[1]);
  } catch (e) { row.error = `createRun: ${norm((e as Error).message).slice(0, 200)}`; row.errorStack = stackOf(e); return row; }
  row.starters = run.starterChoices;

  const nodeKind = (r: RunState): string => r.stage?.map.nodes.find((x) => x.id === r.stage!.current)?.kind ?? '';
  const where = (r: RunState): string => `${r.phase}${r.pending[0] ? '/' + r.pending[0].kind : ''}${r.battle ? '/' + r.battle.kind + ':' + (r.battle.trainer?.classId ?? '') : ''} r${r.regionIndex} s${r.stage?.index ?? '-'} ${nodeKind(r)}`;

  const closeBattle = (next: RunState) => {
    if (!cur) return;
    const lost = next.phase === 'over' && !next.victory;
    const res = lost ? 'lost' : cur.res ?? 'won';
    if (cur.kind === 'wild') bump(c('wb'), `${cur.lead}|${res}`);
    else {
      bump(c('tb'), `${cur.classId}|${res}`); bump(c('tbTurns'), cur.classId, cur.turns); bump(c('tbGap'), cur.classId, cur.lv - cur.myLv);
      if (cur.named) bump(c('nb'), `${cur.classId}:${cur.name}|${res}`);
    }
    maxBattleTurns = Math.max(maxBattleTurns, cur.turns);
    cur = null;
  };

  const storyEvent = (e: { type: string; data?: Record<string, unknown> }) => {
    const d = e.data ?? {};
    bump(c('sev'), e.type);
    switch (e.type) {
      case 'storyMoment':
        if (d.def) { bump(c('mom'), String(d.def)); if (d.suppressed) bump(c('momSup'), String(d.def)); }
        else if (d.dramaEvent) bump(c('drama'), String(d.dramaEvent));
        else if (d.storyLoss) bump(c('misc'), 'storyLoss');
        else bump(c('sx'), norm(`storyMoment|${Object.keys(d).join(',')}`).slice(0, 80));
        break;
      case 'battleEnded': if (cur) cur.res = String(d.result); bump(c('bres'), `${d.kind}|${d.result}`); break;
      case 'battleStarted': if (d.leaderId) bump(c('leaderMet'), String(d.leaderId)); break;
      case 'caught': bump(c('caught'), String(d.speciesId)); if (d.shiny) bump(c('shinyCaught'), String(d.speciesId)); break;
      case 'knockout': if (d.side === 'player') { bump(c('koBy'), String(d.bySpeciesId)); bump(c('koMove'), String(d.moveId)); bump(c('koOf'), String(d.speciesId)); } else bump(c('myKo'), String(d.bySpeciesId)); break;
      case 'evolved': bump(c('evo'), `${d.from}>${d.to}|${d.trigger}`); break;
      case 'eventChoice': bump(c('evc'), `${d.event}|${d.choice}|${d.success ? 1 : 0}`); break;
      case 'routeChosen': bump(c('route'), `${d.kind}${d.harder ? '+' : ''}`); break;
      case 'rivalProgress': bump(c('rp'), String(d.kind)); break;
      case 'nemesisFormed': bump(c('nem'), `${d.archetype}|${d.cause}`); bump(c('nemSp'), String(d.speciesId)); break;
      case 'survivedFatal': bump(c('sf'), String(d.cause)); break;
      case 'feeling': bump(c('feel'), String(d.turningPoint ?? Object.keys(d)[0])); break;
      case 'trainerEscaped': bump(c('esc'), String(d.classId)); break;
      case 'joinedParty': bump(c('join'), String(d.how)); break;
      case 'released': bump(c('rel'), String(d.speciesId)); break;
      case 'statusInflicted': bump(c('sst'), `${d.side}|${d.status}`); break;
      case 'rivalryFormed': bump(c('rivf'), String(d.kind)); break;
      case 'friendshipMilestone': bump(c('fm'), String(d.value)); break;
      case 'moveUsed': case 'levelUp': case 'switchIn': case 'switchOut': case 'rewardTaken': case 'closeCall': case 'runStarted': case 'runEnded': case 'starterChosen': break;
      default: {
        const bits = Object.entries(d).filter(([kk, v]) => (typeof v === 'string' || typeof v === 'boolean') && !/^(name|profile|nemesis|id|uid|text|rival|trainer|speciesId)$/.test(kk)).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(',');
        const m = c('sx'); const k = norm(`${e.type}|${bits}`).slice(0, 90);
        if (m[k] !== undefined || Object.keys(m).length < 150) bump(m, k);
      }
    }
  };

  const turnEvents = (evs: readonly Record<string, unknown>[]) => {
    for (const ev of evs) {
      const t = String(ev.type);
      bump(c('tev'), t);
      switch (t) {
        case 'move': bump(c(ev.side === 'player' ? 'pm' : 'em'), String(ev.moveId)); break;
        case 'damage': {
          const amt = Number(ev.amount) || 0;
          if (ev.side === 'enemy') dmgDealt += amt; else dmgTaken += amt;
          if (ev.crit) bump(c('misc'), `crit:${ev.side}`);
          const eff = Number(ev.effectiveness); if (eff > 1) bump(c('misc'), `se:${ev.side}`); else if (eff < 1) bump(c('misc'), `nve:${ev.side}`);
          if (!Number.isFinite(amt)) bugs.push(`bad damage ${ev.amount}`); else if (amt < 0) bump(c('misc'), `negDamage:${ev.side}`);
          break;
        }
        case 'hyper': bump(c('hyp'), `${ev.side}|${ev.defId}${ev.variant ? ':' + ev.variant : ''}`); break;
        case 'pmoment': bump(c('pmo'), `${ev.side}|${ev.id}|${ev.tier}|${ev.trigger}`); bump(c('pmoSp'), `${ev.speciesId}`); break;
        case 'turningPoint': bump(c('tp'), `${ev.side}|${ev.emotion}`); break;
        case 'transform': bump(c('tf'), `${ev.side}|${ev.kind}|${ev.to}`); break;
        case 'item': bump(c('itu'), String(ev.itemId)); break;
        case 'ball': bump(c('ball'), `${ev.itemId}|${ev.caught ? 1 : 0}`); break;
        case 'ability': bump(c('ab'), `${ev.side}|${ev.ability}`); break;
        case 'status': bump(c('st'), `${ev.side}|${ev.status}`); break;
        case 'weather': bump(c('wx'), `weather|${ev.weather}`); break;
        case 'terrain': bump(c('wx'), `terrain|${ev.terrain}`); break;
        case 'held': bump(c('heldUse'), `${ev.side}|${ev.itemId}`); break;
        case 'evolved': bump(c('bevo'), `${ev.side}|${ev.from}>${ev.to}`); break;
        case 'xp': case 'levelUp': case 'faint': case 'miss': case 'fail': case 'stat': case 'switchIn': case 'switchOut': case 'residual': case 'heal': case 'drain': case 'recoil': case 'learnedMove': case 'hits': break;
        default: {
          const sub = ev.kind ?? ev.reason ?? ev.hazard ?? ev.field ?? ev.effect ?? ev.state ?? ev.status ?? ev.tone ?? ev.emotion ?? '';
          bump(c('tx'), `${t}|${sub}`);
        }
      }
    }
  };

  /** The curious part of the bot: optional stops on the current node (through the node menu when there is one). */
  const explore = (r: RunState): RunState | null => {
    const needBalls = Object.entries(r.inventory).reduce((a, [id, q]) => a + ((content.items.get(id)?.effect as { kind?: string } | undefined)?.kind === 'catch' ? q : 0), 0) < 6 && r.money >= 400;
    if ((p.curiosity <= 0 && !needBalls) || !r.stage || r.stage.current == null) return null;
    const nk = `${r.regionIndex}.${r.stage.index}.${r.stage.current}`;
    if (nk !== exploreNode) { exploreNode = nk; exploreCount = 0; }
    if (exploreCount >= 8) return null;
    const node = r.stage.map.nodes.find((x) => x.id === r.stage!.current);
    if (!node) return null;
    const menu = currentMenu(r);
    type Opt = { key: string; entryId: string | null; sideId: string | null; cat: string; kind: string };
    const opts: Opt[] = [];
    if (menu) {
      for (const e of menu.entries) {
        if (e.required || e.kind === 'encounter' || (e.kind !== 'side' && e.kind !== 'micro')) continue;
        if (entryDone(r, e) || entryLocked(menu, e)) continue;
        opts.push({ key: `${nk}:${e.id}`, entryId: e.id, sideId: e.sideId ?? null, cat: e.category, kind: e.kind });
      }
    } else {
      for (const sd of node.sides) if (!sd.used && !(sd as { hidden?: boolean }).hidden) opts.push({ key: `${nk}:${sd.id}`, entryId: null, sideId: sd.id, cat: sd.kind === 'shop' ? 'shop' : '', kind: 'side' });
    }
    for (const o of opts) {
      if (tried.has(o.key)) continue;
      tried.add(o.key);
      if (bot() >= p.curiosity && !(needBalls && o.cat === 'shop')) continue;
      exploreCount++;
      let label = `${o.kind}|${o.cat}`;
      try {
        let next = r; let sideId = o.sideId;
        if (o.entryId) { const pr = pickMenuEntry(content, r, o.entryId); next = pr.run; sideId = pr.sideId; if (o.kind === 'micro') { bump(c('ex'), `micro|${o.cat}|${menu!.entries.find((x) => x.id === o.entryId)!.microId}`); return next; } }
        if (!sideId) continue;
        const side = next.stage!.map.nodes.find((x) => x.id === next.stage!.current)!.sides.find((x) => x.id === sideId);
        if (!side) continue;
        label = `${side.kind}|${o.cat}`;
        let out: RunState;
        if (side.kind === 'event') {
          label += `|${side.eventId}`;
          const open = eventView(content, next, sideId).choices.map((ch, i) => (ch.locked ? -1 : i)).filter((i) => i >= 0);
          if (!open.length) { bump(c('exSkip'), 'event-all-locked'); continue; }
          out = chooseEvent(content, next, sideId, open[Math.floor(bot() * open.length)]!).run;
        } else if (side.kind === 'heal' || side.kind === 'shop') {
          if (side.kind === 'heal' && (side.used || !next.party.some((m) => m.hp < maxHp(content, m)))) continue;
          out = R.visitSide(content, next, sideId).run;
        } else if (side.kind === 'raid') out = R.enterRaid(content, next, sideId);
        else if (side.kind === 'totem') out = R.enterTotem(content, next, sideId);
        else if (side.kind === 'fish') { const offer = R.fishingOffer(content, next, sideId); if (!offer.length) continue; out = R.fish(content, next, sideId, Math.floor(bot() * offer.length)); }
        else { bump(c('exSkip'), side.kind); continue; }
        if ((out.phase as string) === 'minigame' || (out.phase as string) === 'expedition') { bump(c('exSkip'), `${side.kind}->${out.phase}`); continue; }
        bump(c('ex'), label); lastEx = `${steps}:${label}`;
        return out;
      } catch (e) {
        bump(c('exErr'), `${label.split('|').slice(0, 2).join('|')}: ${norm((e as Error).message).slice(0, 110)}`);
      }
    }
    return null;
  };

  // The "collector" habits (director's ask, 2026-11-16): catch far more, keep the team varied, spread reward picks (no fossil habit).
  const RAR = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const isBall = (id: string): boolean => (content.items.get(id)?.effect as { kind?: string } | undefined)?.kind === 'catch';
  const typesOf = (id: string): string[] => content.species.get(id)?.types ?? [];
  const throwsBy = new Map<string, number>();
  const taken: Cnt = {};
  const tryDecide = (r: RunState, choices: Parameters<typeof R.resolveDecision>[2][]): RunState | null => { for (const ch of choices) { try { return R.resolveDecision(content, r, ch).run; } catch { /* next */ } } return null; };
  const collector = (r: RunState): { run: RunState; turn: R.TurnResult | null } | null => {
    if (r.phase === 'decision' && r.pending[0]?.kind === 'caught') {
      const got = (r.pending[0] as { mon: { speciesId: string } }).mon.speciesId;
      const dup = r.party.some((m) => m.speciesId === got);
      const full = r.party.length >= R.partyCapacity(content, r);
      let next: RunState | null = null;
      if (dup) next = tryDecide(r, [{ kind: 'sendToBox' }, { kind: 'release' }]);
      else if (!full) next = tryDecide(r, [{ kind: 'addToParty' }, { kind: 'sendToBox' }, { kind: 'release' }]);
      else {
        // Full team: a new type takes the place of the lowest-level member whose types the others already cover (never the lead).
        const mine = new Set(r.party.flatMap((m) => typesOf(m.speciesId)));
        const brings = typesOf(got).some((t) => !mine.has(t));
        let swap = -1;
        if (brings) r.party.forEach((m, i) => { if (i === 0) return; const others = new Set(r.party.filter((_, j) => j !== i).flatMap((o) => typesOf(o.speciesId))); if (typesOf(m.speciesId).every((t) => others.has(t)) && (swap < 0 || m.level < r.party[swap]!.level)) swap = i; });
        next = tryDecide(r, [...(swap >= 0 ? [{ kind: 'replace' as const, partyIndex: swap }] : []), { kind: 'sendToBox' }, { kind: 'release' }]);
        if (next && swap >= 0) bump(c('bot'), 'swapped in a new type');
      }
      if (next) { bump(c('bot'), dup ? 'duplicate sent to the box' : full ? 'caught with a full team' : 'caught and added'); return { run: next, turn: null }; }
    }
    if (r.phase === 'battle' && r.battle && r.battle.kind === 'wild' && !r.battle.needsSwitch && !(r.battle as { doubles?: unknown }).doubles && forcedMoveIndex(r.battle, r.party) === null) {
      const b = r.battle; const foe = currentEnemy(b); const me = r.party[b.activeIndex]!;
      const key = b.enemyTeam[0]?.uid ?? ''; const thrown = throwsBy.get(key) ?? 0;
      const isNew = !r.party.some((m) => m.speciesId === foe.speciesId) && !(r.box ?? []).some((m) => m.speciesId === foe.speciesId);
      const ball = ['ultra-ball', 'great-ball', 'premier-ball', 'poke-ball', ...Object.keys(r.inventory).filter(isBall)].find((id) => (r.inventory[id] ?? 0) > 0 && id !== 'master-ball');
      if (ball && thrown < 4 && me.hp / maxHp(content, me) >= 0.3 && (foe.hp <= maxHp(content, foe) * 0.5 || (isNew && foe.level <= me.level - 2)) && itemProblem({ content, battle: b, party: r.party, inventory: r.inventory, catchBlocked: nuzlockeCatchProblem(b) }, ball) === null) {
        try { const t = R.takeTurn(content, r, { kind: 'item', itemId: ball }); throwsBy.set(key, thrown + 1); bump(c('bot'), 'ball thrown'); return { run: t.run, turn: t }; } catch { /* fight on */ }
      }
    }
    if (r.phase === 'shop') {
      // Balls first (up to ten in the bag), then the usual potions.
      let next = r; let bought = 0;
      const have = () => Object.entries(next.inventory).reduce((a, [id, q]) => a + (isBall(id) ? q : 0), 0);
      for (const id of ['poke-ball', 'great-ball']) { while (have() < 16 && bought < 16) { try { next = R.buyItem(content, next, id).run; bought++; } catch { break; } } }
      if (bought) { bump(c('bot'), 'balls bought', bought); return B.botStep(content, next, stepFn); }
    }
    if (r.phase === 'reward' && r.draft?.length) {
      const order = r.draft.map((id, i) => { const rw = content.rewards.get(id); const kind = (rw?.effect as { kind?: string } | undefined)?.kind; const base = kind === 'levelUp' ? 50 : kind === 'vitamin' ? 30 : kind === 'attribute' ? 25 : kind === 'catalog' ? 20 : kind === 'addItem' ? (rw?.category === 'healing' ? 22 : 12) : kind === 'money' ? 8 : 5; return { i, id, v: base + Math.max(0, RAR.indexOf(rw?.rarity ?? '')) * 4 + bot() * 25 - 40 * (taken[id] ?? 0) - (/fossil/.test(id) ? 30 : 0) + (/ball/.test(id) ? 30 : 0) }; }).sort((a, b2) => b2.v - a.v);
      const targets = r.party.map((_, i) => i).sort(() => bot() - 0.5);
      for (const o of order) for (const t of targets.length ? targets : [0]) { try { const next = R.chooseReward(content, r, o.i, t).run; bump(taken, o.id); return { run: next, turn: null }; } catch { /* next */ } }
    }
    return null;
  };

  const stepCap = god ? GOD_STEPS : STEPS;
  const wallCap = god ? GOD_WALL : WALL_MS;
  try {
    while (steps < stepCap && run.phase !== 'over') {
      if (Date.now() - t0 > wallCap) { row.wallCapped = true; break; }
      if (run.phase === 'starter') { run = R.chooseStarter(content, run, Math.min(p.starterIdx, run.starterChoices.length - 1)); row.starter = run.party[0]?.speciesId ?? null; steps++; continue; }
      if (p.assist !== 'none' && run.phase === 'map') run = R.debugHealParty(content, run);
      if (run.phase === 'map' && !run.battle) run = ensureNodeMenu(content, run); // the game's map screen does this on arrival
      if (god && run.phase === 'battle' && run.party.some((m) => m.hp < maxHp(content, m) * 0.5)) run = R.debugHealParty(content, run);
      if (p.backstory && run.story.v2 && run.story.v2.protagonist?.backstory !== p.backstory) chooseBackstory(content, run, p.backstory);
      // Timeline: one line each time a new stage starts.
      const k = `${run.regionIndex}.${run.stage?.index ?? -1}`;
      if (k !== tlKey && run.stage) { tlKey = k; tl.push([run.regionIndex, run.regionOrder?.[run.regionIndex] ?? '', run.stage.index, run.stage.themeId ?? '', run.stage.leaderId ?? '', run.encountersCompleted, steps, Math.max(0, ...run.party.map((m) => m.level)), run.party.length, run.money]); }
      if (run.phase === 'battle' && !cur && run.battle) {
        const b = run.battle; const x = b as unknown as Record<string, unknown>;
        const key = `${run.encountersCompleted}|${run.stage?.index}|${b.enemyTeam[0]?.uid}`;
        if (key !== siKey && b.turn === 1 && !x.stepIn) {
          siKey = key;
          try { const res = R.rivalStepIn(content, run); if (res) { bump(c('stepIn'), `${res.kind}|${res.rival?.classId ?? ''}`); run = res.run; if (run.phase !== 'battle' || !run.battle) continue; } }
          catch (e) { bugs.push(`stepIn: ${norm((e as Error).message).slice(0, 120)}`); }
        }
        const bb = run.battle!; const y = bb as unknown as Record<string, unknown>;
        const rivalish = !!(y.firstRival || y.rival || y.rivalId || y.narrative || y.nemesis);
        const classId = bb.kind === 'wild' ? 'wild' : rivalish && !bb.trainer?.classId ? 'rival' : bb.trainer?.classId ?? 'trainer';
        const lv = Math.max(...bb.enemyTeam.map((e) => e.level));
        cur = { kind: bb.kind, classId, name: bb.trainer?.name ?? '', named: !!bb.trainer?.leaderId || rivalish || NAMED.test(classId), turns: 0, lv, myLv: Math.max(0, ...run.party.map((m) => m.level)), res: null, lead: bb.enemyTeam[0]?.speciesId ?? '' };
        bump(c('bnode'), `${nodeKind(run)}|${bb.kind}`);
        if (bb.kind === 'wild') { for (const e of bb.enemyTeam) { bump(c('wild'), e.speciesId); if ((e as { shiny?: boolean }).shiny) bump(c('wildShiny'), e.speciesId); } bump(c('wildLv'), String(Math.min(100, Math.floor(lv / 5) * 5))); }
        else { for (const e of bb.enemyTeam) bump(c('tsp'), e.speciesId); bump(c('tsize'), `${classId}|${bb.enemyTeam.length}`); if (y.doubles) bump(c('misc'), 'doubles'); if (y.raid) bump(c('misc'), 'raidBattle'); if (y.strategy) bump(c('strategy'), String((y.strategy as { id?: string }).id ?? y.strategy)); if (y.specialization) bump(c('spec'), String(y.specialization)); }
        for (const tag of ['firstRival', 'rival', 'rivalId', 'narrative', 'nemesis', 'memory', 'spectate', 'eventRule', 'sos', 'grudgeMons', 'arena', 'totem', 'raid', 'legend', 'shadow', 'boss']) if (y[tag]) bump(c('btag'), tag);
      }
      if (run.phase === 'decision' && run.pending[0]) bump(c('pend'), run.pending[0].kind);
      bump(c('ph'), run.phase);
      const before = run;
      if (TRACE) { trace.push(`${steps} ${where(run)} hp=${run.party.map((m) => `${m.speciesId}:${m.hp}/${maxHp(content, m)}`).join(',')} cur=${run.stage?.current} lastEx=${lastEx}`); if (trace.length > 14) trace.shift(); }
      let out: { run: RunState; turn: R.TurnResult | null } | null = null;
      try {
        if (run.phase === 'map') { const ex = explore(run); if (ex) out = { run: ex, turn: null }; }
        out ??= collector(run) ?? B.botStep(content, run, stepFn);
      } catch (e) {
        const err = e as Error;
        row.error = norm(err.message).slice(0, 220);
        row.errorWhere = where(run);
        row.errorStack = stackOf(err);
        row.errorSides = (run.stage?.map.nodes.find((x) => x.id === run.stage!.current)?.sides ?? []).filter((x) => !x.used).map((x) => `${x.kind}:${x.eventId ?? x.id}`).slice(0, 8);
        if (TRACE) process.stdout.write(`SIDES ${JSON.stringify(row.errorSides)}\n`);
        break;
      }
      run = out.run; steps++;
      if (out.turn) {
        turns++; if (cur) cur.turns++;
        turnEvents(out.turn.events as unknown as Record<string, unknown>[]);
        if (out.turn.wiped) bump(c('misc'), 'wiped'); if ((out.turn as { raidFailed?: boolean }).raidFailed) bump(c('misc'), 'raidFailed'); if ((out.turn as { clubLost?: boolean }).clubLost) bump(c('misc'), 'clubLost');
        if (cur && cur.turns === 150) { longBattles++; bump(c('longB'), `${cur.classId}|${cur.lead}`); }
      }
      if (run.story.seq !== lastSeq) {
        const evs = run.story.events; let i = evs.length;
        while (i > 0 && evs[i - 1]!.seq > lastSeq) i--;
        if (i === 0 && evs.length && evs[0]!.seq > lastSeq + 1) bump(c('misc'), 'storyLogGap');
        for (; i < evs.length; i++) storyEvent(evs[i] as unknown as { type: string; data?: Record<string, unknown> });
        lastSeq = run.story.seq;
      }
      if (cur && (!run.battle || run.phase !== 'battle')) closeBattle(run);
      // Invariants: numbers the rules must never break.
      for (const m of run.party) {
        const mh = maxHp(content, m);
        if (!Number.isFinite(m.hp) || m.hp < 0 || m.hp > mh) { bugs.push(`bad hp ${m.speciesId} ${m.hp}/${mh} @${where(run)}`); break; }
        if (m.level < 1 || m.level > content.balance.difficulty.maxLevel || !Number.isInteger(m.level)) { bugs.push(`bad level ${m.speciesId} ${m.level}`); break; }
        for (const mv of m.moves) if (mv.pp < 0 || !Number.isFinite(mv.pp)) { bugs.push(`bad pp ${m.speciesId} ${mv.id}`); break; }
        if (!content.species.has(m.speciesId)) { bugs.push(`unknown species ${m.speciesId}`); break; }
      }
      if (!Number.isFinite(run.money) || run.money < 0) bugs.push(`bad money ${run.money} @${where(run)}`);
      maxMoney = Math.max(maxMoney, run.money); if (run.party.length > maxParty) maxParty = run.party.length;
      for (const [id, q] of Object.entries(run.inventory)) if (q < 0 || !Number.isFinite(q)) bugs.push(`bad item count ${id} ${q}`);
      if (new Set(run.party.map((m) => m.uid)).size !== run.party.length) bugs.push('duplicate party uid');
      if (run.party.length > R.partyCapacity(content, run)) bump(c('misc'), 'partyOverCap');
      if (TRACE && bugs.length && !row.traced) { row.traced = 1; process.stdout.write(`FIRST BUG ${bugs[0]}\n${trace.join('\n')}\nlast turn events: ${JSON.stringify(out.turn?.events ?? []).slice(0, 1500)}\nmon: ${JSON.stringify(run.party.find((m) => m.hp > maxHp(content, m)) ?? null).slice(0, 900)}\n`); }
      if (bugs.length > 6) break;
      const sig = `${run.phase}|${run.encountersCompleted}|${run.money}|${run.party.map((m) => m.hp + ':' + m.xp).join(',')}|${run.battle?.turn ?? ''}|${run.pending.length}|${run.draft?.length ?? ''}|${run.stage?.current ?? ''}|${run.story.seq}`;
      if (sig === lastSig && before !== run) { if (++stuck >= 80) { bugs.push(`stalled @${where(run)}`); row.stalled = where(run); break; } } else stuck = 0;
      lastSig = sig;
    }
  } catch (e) { row.error = `loop: ${norm((e as Error).message).slice(0, 200)}`; row.errorStack = stackOf(e); }
  if (cur) { if (run.phase !== 'over') { bump(c('misc'), 'battleOpenAtEnd'); cur = null; } else closeBattle(run); }

  if (TRACE && (row.error || bugs.length)) process.stdout.write(`TRACE n=${n} err=${row.error ?? ''} bugs=${bugs.join(';')}\n${trace.join('\n')}\n`);
  if (process.env.SIM_DUMP) { const sz = (o: unknown): number => (o === null || typeof o !== 'object' ? 0 : 1 + Object.values(o as object).reduce((a: number, v) => a + sz(v) + 1, 0)); const top = Object.entries(run).map(([k, v]) => [k, sz(v)] as const).sort((a, b) => b[1] - a[1]).slice(0, 12); const sk = Object.entries(run.story).map(([k, v]) => [k, sz(v)] as const).sort((a, b) => b[1] - a[1]).slice(0, 10); process.stdout.write(`SIZES ${JSON.stringify(top)}\nSTORY ${JSON.stringify(sk)} events=${run.story.events.length}\n`); }
  const l = run.log; const mon = run.party; const x = (run.expansion ?? {}) as Record<string, any>; const st = run.story as unknown as Record<string, any>;
  const tr: Cnt = {};
  for (const t of Object.values((st.trainers ?? {}) as Record<string, any>)) { bump(tr, `${t.classId}|meet`, t.meetings ?? 0); bump(tr, `${t.classId}|w`, t.wins ?? 0); bump(tr, `${t.classId}|l`, t.losses ?? 0); if (t.specialization) bump(c('spec2'), t.specialization); }
  const flags: string[] = [...new Set(Object.keys(st.flags ?? {}).map((f) => (/^(codex|ev|pm|chain|drama:cd|choices|lead|act|sv2|rq|md|allstar|mirror|story|heated-region|first-rival|assisted|moment-mon|rare|lastFinisher|campfire|askLead|rivalSighting):?/.test(f) ? norm(f).replace(/#[+:#\w.-]*/g, '#') : f.split(/[:.]/)[0] + ':*')))].slice(0, 500);
  const ic: Cnt = {}; const evSeen: string[] = []; const recruits: string[] = [];
  for (const [key, v] of Object.entries(run.itemCounters ?? {})) {
    if (key.startsWith('event-seen:')) evSeen.push(key.slice(11));
    else if (key.startsWith('recruit:')) recruits.push(key.slice(8));
    else bump(ic, norm(key).replace(/:#.*$/, ':#').replace(/^(grudge|bondwins|co-region|later-event|eco|chain|capq|capq-done|owned|hunt):.*$/, '$1:*'), typeof v === 'number' && key.startsWith('attr:') ? v : 1);
  }
  Object.assign(row, {
    ms: Date.now() - t0, steps, turns, phase: run.phase, victory: run.victory, capped: run.phase !== 'over' && !row.error && !row.stalled && (steps >= stepCap || !!row.wallCapped),
    enc: run.encountersCompleted, regions: run.regionsCleared, regionOrder: run.regionOrder, regionIndex: run.regionIndex, badges: run.badges, stage: run.stage?.index ?? -1, stageKind: (run.stage as { kind?: string } | null)?.kind ?? null,
    theme: run.stage?.themeId ?? null, leader: run.stage?.leaderId ?? null, endNode: nodeKind(run), days: run.clock?.day ?? 0, loops: run.rules.loops ?? 0, heat: run.rules.heat ?? 0,
    maxParty, party: mon.map((m) => ({ s: m.speciesId, lv: m.level, f: m.friendship, sh: m.shiny ? 1 : 0, h: Object.keys(m.held ?? {}), m: m.moves.map((mv) => mv.id), n: m.nature, t: (m as { teraType?: string }).teraType ?? null, ms: ((m as { mastered?: string[] }).mastered ?? []).length })),
    box: run.box?.length ?? 0, eggs: run.eggs?.length ?? 0, topLv: Math.max(0, ...mon.map((m) => m.level)),
    money: run.money, maxMoney, inv: run.inventory, rewards: l.rewardsTaken, passives: run.passives, materials: run.materials, counters: l.counters,
    seen: l.speciesSeen.length, caughtN: l.speciesCaught.length, shiny: l.speciesShiny, lostTo: l.defeatedBy,
    lastBattle: run.phase === 'over' && run.battle ? { kind: run.battle.kind, classId: run.battle.trainer?.classId ?? null, name: run.battle.trainer?.name ?? null, leaderId: run.battle.trainer?.leaderId ?? null, turn: run.battle.turn, team: run.battle.enemyTeam.map((e) => `${e.speciesId}:${e.level}`) } : null,
    bugs, con, C, tl, longBattles, maxBattleTurns, dmgDealt, dmgTaken,
    flags, ic, evSeen, recruits, tr,
    softLosses: Number(st.flags?.['story:losses'] ?? 0) + Number(st.v2?.facts?.story_losses ?? 0), stops: st.v2?.stops?.done?.length ?? 0, storySeq: st.seq,
    evil: st.evil ? { team: st.evil.teamId, beat: st.evil.beat, heat: st.evil.heat, end: st.evil.end, defector: st.evil.defector, ops: (st.evil.ops ?? []).length, opKinds: (st.evil.ops ?? []).map((o: any) => o.kind ?? o.id ?? o.type ?? '?').slice(0, 30), villains: Object.keys(st.evil.villains ?? {}), past: (st.evil.past ?? []).map((q: any) => (typeof q === 'string' ? q : `${q.teamId ?? q.team ?? '?'}:${q.end ?? ''}`)), mods: st.evil.mods ?? [], planFirst: st.evil.planFirst ?? null } : null,
    rivals: (st.rivals ?? []).map((r: any) => ({ id: norm(String(r.id)), cls: r.classId, name: r.name, arch: r.archetype, style: r.style, state: r.state, arc: r.arc?.id, arcStage: r.arc?.stage, res: r.arc?.resolution, fac: r.faction, enc: r.encounters, prog: r.progress, setb: r.setbacks })),
    nemeses: (st.nemeses ?? []).map((q: any) => ({ sp: q.speciesId, src: q.source, arch: q.archetype, cause: q.cause, phase: q.phase, wins: q.wins, settled: q.settledAs })),
    standing: st.standing ? { sponsor: st.standing.sponsor, factions: st.standing.factions, bosses: st.standing.bosses } : null,
    mentoring: st.mentoring ? { bonds: Object.keys(st.mentoring.bonds ?? {}).length, returns: st.mentoring.returns ?? 0, defeated: (st.mentoring.defeated ?? []).length } : null,
    world: st.world ? { skipped: (st.world.skipped ?? []).length, cons: (st.world.consequences ?? []).length } : null,
    simw: st.sim ? { rumors: (st.sim.rumors ?? []).length, mystery: (st.sim.mystery ?? []).length, found: (st.sim.mystery ?? []).filter((q: any) => q.found).length, dist: (st.sim.disturbances ?? []).length, dungeons: st.sim.seen?.dungeons ?? [], pseudo: st.sim.seen?.pseudo ?? [] } : null,
    chron: (st.chronicle ?? []).length,
    bless: x.blessing ? { id: x.blessing.id, tier: x.blessing.tier, inf: x.blessing.influence, seen: x.blessing.seen, comm: x.blessing.communion, rite: x.blessing.riteUsed, ash: (x.blessing.ashRegions ?? []).length, st: (x.blessing.stagesDone ?? []).length } : null,
    ultra: x.ultra ? { contact: x.ultra.contact, beast: x.ultra.beastId, met: x.ultra.met, app: x.ultra.appetites, inc: x.ultra.incursionDone, left: x.ultra.left, home: x.ultra.homesick ? 1 : 0, tear: x.ultra.tearStop ? 1 : 0 } : null,
    promise: x.promise ? { tell: x.promise.tellings, visited: x.promise.visited, guest: x.promise.guest?.id ?? null, kept: x.promise.kept, left: x.promise.left } : null,
    xrival: x.rival ? Object.entries(x.rival as Record<string, any>).map(([id, r]) => ({ role: r.role, pers: r.personality, style: r.style, arc: r.arc, lead: r.lead, marks: r.marks, feel: r.feelings, pity: r.pityLosses, id: id.startsWith('friend') ? 'friend' : id })) : null,
    menus: x.nodeMenus?.tally ?? null, grandArc: x.grandArc ? { roms: (x.grandArc.roms ?? []).length, late: (x.grandArc.late ?? []).length, left: (x.grandArc.left ?? []).length } : null,
    canon: x.canon ? { flags: (x.canon.flags ?? []).length, done: x.canon.completed ?? [] } : null, heated: x.heatedLog ?? null,
    xkeys: Object.keys(x),
    raids: run.raids ? { e: run.raids.entered, w: run.raids.won, l: run.raids.lost, tier: run.raids.bestTier } : null, totems: run.totems ? { e: run.totems.entered, w: run.totems.won, l: run.totems.lost } : null,
    legendary: run.legendary ? { off: run.legendary.offered, done: run.legendary.completed, fail: run.legendary.failed, out: run.legendary.outcomes } : null,
    gimmicks: run.gimmicks?.uses ?? null, minigames: run.minigames ? { plays: run.minigames.plays, money: run.minigames.money } : null, plaza: run.plaza ? { rep: run.plaza.rep, visits: run.plaza.visits, foes: run.plaza.foes?.length ?? 0 } : null,
    streak: run.streaks?.best ?? 0, attrs: run.attributeModifiers, quest: run.runQuest ?? null, mentor: run.mentor ? 1 : 0, perks: (run.perkEffects ?? []).length, temp: (run.tempEffects ?? []).length,
    partyLife: run.partyLife ? { pairs: (run.partyLife.pairs ?? []).length, grudges: (run.partyLife.grudges ?? []).length } : null,
  });
  return row;
}

function stackOf(e: unknown): string {
  return ((e as Error).stack ?? '').split('\n').slice(1, 6).map((ln) => ln.trim().replace(/^at /, '').replace(/\(?file:\/\/\S*\/([^/]+:\d+):\d+\)?/, '($1)').slice(0, 90)).join(' | ');
}

const done = new Set<number>();
for (const f of readdirSync(OUT)) {
  if (!f.startsWith(`s${SHARD}of${SHARDS}.`) || !f.endsWith('.jsonl.gz')) continue;
  let text = '';
  try { text = gunzipSync(readFileSync(`${OUT}/${f}`)).toString('utf8'); } catch { continue; }
  for (const ln of text.split('\n')) { if (ln) try { done.add((JSON.parse(ln) as { n: number }).n); } catch { /* partial */ } }
}
const part = `${OUT}/s${SHARD}of${SHARDS}.${Date.now()}.jsonl.gz`;
let buf: string[] = []; let count = 0; const tStart = Date.now();
const flush = () => { if (buf.length) { appendFileSync(part, gzipSync(buf.join(''))); buf = []; } };
for (let n = SHARD; n < TOTAL; n += SHARDS) {
  if (done.has(n)) continue;
  let row: Record<string, unknown>;
  try { row = playOne(n); } catch (e) { row = { n, error: `fatal: ${(e as Error).message.slice(0, 200)}`, errorStack: stackOf(e) }; }
  buf.push(JSON.stringify(row) + '\n'); count++;
  if (buf.length >= 25) flush();
  if (count % 200 === 0) process.stdout.write(`shard ${SHARD}: ${count} new (+${done.size} before) in ${Math.round((Date.now() - tStart) / 1000)}s\n`);
}
flush();
process.stdout.write(`shard ${SHARD}/${SHARDS} done: ${count} new runs\n`);
