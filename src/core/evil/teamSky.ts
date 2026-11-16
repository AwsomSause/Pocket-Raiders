// Team Sky, run by the player (HOENN_TEAMS part 6, with the screens' rules from 7.9 to 7.13). Once the story founds
// Sky (`sky-founded`), the team has Renown, Funds, two Heat meters and a roster whose Loyalty is shown per grunt.
// Each stage the recruit pool and the Dispatch Board refresh; missions run for a node or two and come back as a
// report in the grunt's voice. The player hires, promotes, talks, dismisses, sets the doctrine, gives a Pokémon,
// builds base rooms and sends squads. Every roll is hashed from the run seed (`::team-sky::`), so no other system's
// roll moves. In-run only. Loyalty is never a hidden roll: what a choice will do is shown before it's made.

import { z } from 'zod';
import raw from '../../data/catalogOverhaul/sky.json';
import type { Content } from '../contentSchema';
import { typeEffectiveness } from '../battle/damage';
import { hashSeed, Rng } from '../rng';
import { PokemonInstanceSchema, type RunState } from '../state';
import { isLegendaryLike } from '../trainerPerks';
import { SKY_HOWS, TeamSkyStateSchema, type SkyCandidate, type SkyGrunt, type SkyHow, type SkyMission, type SkyMissionType, type TeamSkyState } from './teamSkySchema';

const Pays = z.object({ renown: z.number().int().optional(), loyalty: z.number().int().optional(), recruits: z.number().int().optional(), heat: z.number().int().optional(), funds: z.number().int().optional(), kind: z.number().int().optional(), intel: z.number().int().optional(), trouble: z.number().int().optional() });
const SkyDataSchema = z.object({
  status: z.enum(['supported', 'limited', 'disabled']), limits: z.string(),
  startFunds: z.number().int(), heatMax: z.number().int(), doctrineCost: z.number().int(), defaultTypes: z.array(z.string()).length(3),
  caps: z.array(z.object({ renown: z.number().int(), grunts: z.number().int(), squads: z.number().int(), admins: z.number().int() })).min(1),
  ranks: z.array(z.object({ id: z.string(), name: z.string(), missions: z.number().int(), loyalty: z.number().int(), cost: z.number().int(), mons: z.number().int(), gap: z.number().int(), gains: z.string() })).length(4),
  origins: z.array(z.object({ id: z.string(), name: z.string(), why: z.array(z.string()).min(1), answers: z.record(z.string(), z.string()) })).min(1),
  traits: z.array(z.object({ id: z.string(), name: z.string(), text: z.string(), plus: z.number().int(), on: z.array(z.string()) })).min(1),
  flaws: z.array(z.object({ id: z.string(), name: z.string(), text: z.string() })).min(1),
  names: z.array(z.string()).min(8), nicknames: z.array(z.string()).min(1),
  questions: z.array(z.object({ id: z.string(), label: z.string() })).length(3),
  aces: z.record(z.string(), z.array(z.string()).length(3)),
  archetypes: z.array(z.object({ id: z.string(), name: z.string(), pool: z.array(z.string()), perk: z.string() })).length(8),
  rooms: z.array(z.object({ id: z.string(), name: z.string(), cost: z.number().int(), text: z.string(), line: z.string() })),
  gadgets: z.array(z.object({ id: z.string(), name: z.string(), cost: z.number().int(), text: z.string() })),
  missions: z.array(z.object({ type: z.string(), name: z.string(), need: z.tuple([z.number().int(), z.number().int()]), nodes: z.tuple([z.number().int(), z.number().int()]), win: Pays, lose: z.string(), where: z.array(z.object({ at: z.string(), text: z.string(), tags: z.array(z.string()), against: z.string() })).min(1) })),
  how: z.record(z.enum(SKY_HOWS), z.object({ name: z.string(), text: z.string(), chance: z.number().int(), heat: z.number().int(), pay: z.number(), cost: z.number().int() })),
  reports: z.object({ win: z.record(z.string(), z.array(z.string()).min(1)), lose: z.record(z.string(), z.array(z.string()).min(1)) }),
  talk: z.object({ lines: z.array(z.string()).length(3), works: z.record(z.string(), z.number().int().min(0).max(2)), yes: z.string(), no: z.string() }),
  cracked: z.record(z.string(), z.string()),
  orders: z.array(z.object({ id: z.enum(['safe', 'pressure', 'judgement']), name: z.string(), text: z.string() })),
  window: z.record(z.string(), z.string()),
});
export const SKY = SkyDataSchema.parse(raw);
export type SkyAction =
  | { kind: 'open' }
  | { kind: 'ask'; id: string; q: string }
  | { kind: 'hire'; id: string }
  | { kind: 'promote'; id: string }
  | { kind: 'dismiss'; id: string }
  | { kind: 'talk'; id: string; line: number }
  | { kind: 'orders'; id: string; orders: 'safe' | 'pressure' | 'judgement' }
  | { kind: 'ace'; id: string; species: string }
  | { kind: 'give'; id: string; box: number }
  | { kind: 'takeBack'; id: string }
  | { kind: 'types'; types: string[] }
  | { kind: 'arch'; arch: string }
  | { kind: 'build'; room: string }
  | { kind: 'gadget'; id: string }
  | { kind: 'send'; mission: string; squad: string[]; how: SkyHow };

const flagOf = (run: RunState, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const setFlag = (run: RunState, k: string, n: number): void => { run.story.flags[`ev:${k}`] = n; };
const rng = (run: RunState, label: string): Rng => new Rng(hashSeed(`${run.seed}::team-sky::${label}`));
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const regionId = (run: RunState): string | undefined => run.regionOrder[run.regionIndex];

/** Sky is founded and hasn't been dissolved: the screens and the stage rules are on. */
export const skyFounded = (run: RunState): boolean => flagOf(run, 'sky-founded') > 0 && flagOf(run, 'sky-dissolved') === 0;
/** The saved state, or null before the founding (screens read this; they never create it). */
export const teamSkyOf = (run: RunState): TeamSkyState | null => (skyFounded(run) ? run.expansion?.teamSky ?? null : null);
export const skyRenown = (run: RunState, s: TeamSkyState): number => Math.max(0, s.renown + flagOf(run, 'sky-renown'));
export function skyCaps(run: RunState, s: TeamSkyState): { grunts: number; squads: number; admins: number } {
  const r = skyRenown(run, s);
  const row = [...SKY.caps].reverse().find((c) => r >= c.renown) ?? SKY.caps[0]!;
  return { grunts: row.grunts + (s.rooms.includes('roost') ? 4 : 0), squads: row.squads, admins: row.admins };
}
export const rankName = (rank: number): string => SKY.ranks[rank]?.name ?? 'Fledgling';
export const traitOf = (id: string) => SKY.traits.find((t) => t.id === id)!;
export const flawOf = (id: string) => SKY.flaws.find((f) => f.id === id)!;
export const originOf = (id: string) => SKY.origins.find((o) => o.id === id)!;
const hiredFrom = (origin: string): string => (origin === 'ex-magma' ? 'magma' : origin === 'ex-aqua' ? 'aqua' : '');

function person(r: Rng, s: TeamSkyState, origin: string, loyalty: number): Omit<SkyCandidate, 'fee' | 'why'> {
  const taken = new Set([...s.grunts.map((g) => g.name), ...s.candidates.map((c) => c.name)]);
  const free = SKY.names.filter((n) => !taken.has(n));
  const name = free.length ? r.pick(free) : `${r.pick(SKY.names)} ${s.next + 1}`;
  return { id: `g${(s.next += 1)}`, name, origin, trait: r.pick(SKY.traits).id, flaw: r.pick(SKY.flaws).id, skill: r.int(1, 5), loyalty: clamp(loyalty, 1, 10) };
}

/** HOENN_TEAMS 5.2: the first three come (Marlo, Dr. Tuff, and the freed spy or Lowen). */
function found(run: RunState): TeamSkyState {
  const s = TeamSkyStateSchema.parse({ funds: SKY.startFunds, region: run.regionIndex, loyaltyFlag: flagOf(run, 'sky-loyalty'), recruitsFlag: 0 });
  const spy = flagOf(run, 'hoenn-freed-spy') > 0;
  const first: SkyGrunt[] = [
    { id: 'marlo', name: 'Marlo', origin: 'ex-aqua', trait: 'diver', flaw: 'old-loyalties', skill: 4, loyalty: 7 },
    { id: 'tuff', name: 'Dr. Tuff', origin: 'ex-magma', trait: 'scout', flaw: 'glory-hound', skill: 5, loyalty: 6 },
    spy ? { id: 'spy', name: 'The freed spy', origin: 'ex-magma', trait: 'negotiator', flaw: 'old-loyalties', skill: 3, loyalty: 8 } : { id: 'lowen', name: 'Lowen', origin: 'drifter', trait: 'climber', flaw: 'hot-headed', skill: 2, loyalty: 8 },
  ].map((g) => ({ ...g, rank: 0, missions: 0, since: 0, hurt: 0, captured: false, cracked: 0, talked: -1, away: false }));
  s.grunts = first;
  s.doctrine.types = [...SKY.defaultTypes];
  return s;
}

function refresh(content: Content, run: RunState, s: TeamSkyState): void {
  const r = rng(run, `stage-${s.tick}`);
  // 6.2: three to five candidates; more deserters when Heat is high; people the player helped come free and keener.
  const helped = flagOf(run, 'kind-total') >= 3;
  const hot = s.heat.magma + s.heat.aqua >= 8;
  const count = r.int(3, 5) + Math.min(2, flagOf(run, 'sky-recruits') - s.recruitsFlag);
  s.recruitsFlag = flagOf(run, 'sky-recruits');
  s.candidates = [];
  for (let i = 0; i < Math.min(5, count); i++) {
    const pool = ['ex-magma', 'ex-aqua', 'townsfolk', 'ranger', 'drifter', ...(hot ? ['ex-magma', 'ex-aqua'] : []), ...(helped ? ['townsfolk'] : []), ...(flagOf(run, 'zinnia-trust') > 0 ? ['draconid'] : [])];
    const origin = r.pick(pool);
    const kind = origin === 'townsfolk' && helped;
    const base = person(r, s, origin, r.int(3, 7) + (kind ? 2 : 0) - (flagOf(run, 'sky-creed-above') ? 1 : 0));
    const wyrms = s.doctrine.mode === 'arch' && s.doctrine.arch === 'wyrms' ? 1.25 : 1;
    s.candidates.push({ ...base, fee: kind ? 0 : Math.round((r.int(0, 15) * 100 * wyrms) / 100) * 100, why: r.pick(originOf(origin).why) });
  }
  // 6.5: three to six missions a stage; a captured grunt's rescue stays on the board until it's run.
  const kept = s.missions.filter((m) => m.free && s.grunts.some((g) => g.id === m.free && g.captured));
  s.missions = [...kept];
  const n = r.int(3, 6);
  for (let i = 0; i < n; i++) {
    const def = r.pick(SKY.missions);
    const w = r.pick(def.where);
    s.missions.push({ id: `m${s.tick}-${i}`, type: def.type as SkyMissionType, at: w.at, text: w.text, tags: w.tags, against: w.against, need: r.int(def.need[0], def.need[1]), nodes: r.int(def.nodes[0], def.nodes[1]) });
  }
  void content;
}

/** Called at each stage start (after the Evil Team's own stage rules). Founds the state the first time. */
export function skyStageStart(content: Content, run: RunState): void {
  if (!skyFounded(run)) return;
  const block = (run.expansion ??= {});
  const fresh = !block.teamSky;
  const s = (block.teamSky ??= found(run));
  if (!fresh) s.tick += 1;
  const lines: string[] = [];
  // The story's `sky-loyalty` flag lifts everyone by what it gained since last stage.
  const lf = flagOf(run, 'sky-loyalty');
  if (lf !== s.loyaltyFlag) for (const g of s.grunts) g.loyalty = clamp(g.loyalty + lf - s.loyaltyFlag, 0, 10);
  s.loyaltyFlag = lf;
  if (s.region !== run.regionIndex) {
    s.region = run.regionIndex;
    if (regionId(run) !== 'hoenn') for (const g of s.grunts) if (g.flaw === 'homesick') g.loyalty = clamp(g.loyalty - 1, 0, 10);
  }
  if (s.rooms.includes('mess') && s.mess !== run.regionIndex) {
    s.mess = run.regionIndex;
    for (const g of s.grunts) g.loyalty = clamp(g.loyalty + 1, 0, 10);
  }
  if (s.doctrine.mode === 'arch' && s.doctrine.arch === 'strays') for (const g of s.grunts) g.loyalty = Math.max(g.loyalty, 2);
  // 6.3 Glory-Hound; 6.6 the cracked feather a stage before they go.
  for (const g of [...s.grunts]) {
    if (!fresh) g.since += 1;
    if (g.flaw === 'glory-hound' && g.rank < 3 && g.since > 0 && g.since % 2 === 0) g.loyalty = clamp(g.loyalty - 1, 0, 10);
    if (g.loyalty <= 2 && !g.captured && !g.away) {
      if (g.cracked > 0 && g.cracked < s.tick) {
        s.grunts = s.grunts.filter((x) => x.id !== g.id);
        const sold = rng(run, `leave-${g.id}-${s.tick}`).chance(0.5);
        if (sold) { s.heat.magma = clamp(s.heat.magma + 1, 0, SKY.heatMax); s.heat.aqua = clamp(s.heat.aqua + 1, 0, SKY.heatMax); }
        report(s, g.name, sold ? `${g.name} has gone, and somebody's been selling our routes. Heat +1 with both teams.` : `${g.name} has gone. The scarf's on the peg.`, false);
        if (g.gift) run.box.push(PokemonInstanceSchema.parse(g.gift));
      } else if (g.cracked === 0) g.cracked = s.tick;
    } else g.cracked = 0;
  }
  // Admins' standing orders while the player's away (7.10), as written in sky.json.
  for (const g of s.grunts.filter((x) => x.rank === 3 && x.orders)) {
    if (g.orders === 'pressure') { s.renown += 1; s.heat.magma = clamp(s.heat.magma + 1, 0, SKY.heatMax); s.heat.aqua = clamp(s.heat.aqua + 1, 0, SKY.heatMax); }
    if (g.orders === 'judgement') s.funds += 200;
  }
  // 7.9: Heat at full makes a raid on the base possible; it costs a third of the chest and resets that bar halfway.
  for (const side of ['magma', 'aqua'] as const) {
    if (s.heat[side] >= SKY.heatMax && skyBase(run)) {
      const lost = Math.floor(s.funds / 3);
      s.funds -= lost;
      s.heat[side] = Math.floor(SKY.heatMax / 2);
      report(s, 'Zinnia', `${side === 'magma' ? 'Magma' : 'Aqua'} raided the base while you were out. They took ₽${lost}. Nobody's hurt. Everybody's angry.`, false);
    } else if (!fresh && s.heat[side] > 0) s.heat[side] -= 1;
  }
  refresh(content, run, s);
  syncFlags(run, s);
  void lines;
}

/** The base the story chose (S3.2), if any. */
export function skyBase(run: RunState): string | null {
  for (const b of ['tower', 'ship', 'institute']) if (flagOf(run, `sky-base-${b}`) > 0) return b;
  return null;
}

function syncFlags(run: RunState, s: TeamSkyState): void {
  setFlag(run, 'sky-loyal-line', s.grunts.filter((g) => g.loyalty >= 8 && !g.captured).length);
  setFlag(run, 'sky-roster', s.grunts.length);
  setFlag(run, 'sky-renown-total', skyRenown(run, s));
}

function report(s: TeamSkyState, who: string, text: string, win: boolean): void {
  s.reports.unshift({ who, text, win, tick: s.tick });
  if (s.reports.length > 12) s.reports.length = 12;
}

/** Called each time the player moves to a node: squads in the field come one node closer, and back with a report. */
export function skyNodeTick(content: Content, run: RunState): void {
  const s = teamSkyOf(run);
  if (!s || s.away.length === 0) return;
  for (const a of [...s.away]) {
    a.left -= 1;
    if (a.left > 0) continue;
    s.away = s.away.filter((x) => x !== a);
    resolve(content, run, s, a);
  }
  syncFlags(run, s);
}

const typeDef = (t: string) => SKY.missions.find((m) => m.type === t)!;
const arch = (s: TeamSkyState, id: string): boolean => s.doctrine.mode === 'arch' && s.doctrine.arch === id;

/** 6.5 / 7.12: the success chance as a number, with who moved it and by how much. Never rolls. */
export function missionChance(s: TeamSkyState, m: SkyMission, squad: SkyGrunt[], how: SkyHow): { chance: number; parts: { who: string; delta: number; why: string }[] } {
  const parts: { who: string; delta: number; why: string }[] = [];
  if (squad.length === 0) return { chance: 0, parts };
  const combat = m.type === 'sabotage' || m.type === 'raid';
  let skill = Math.max(...squad.map((g) => g.skill)) + (squad.length - 1);
  if (combat && arch(s, 'wyrms')) { skill += 1; parts.push({ who: 'The Wyrms', delta: 10, why: '+1 Skill on combat' }); }
  if (arch(s, 'pack')) {
    if (squad.length >= 3) { skill += 1; parts.push({ who: 'The Pack', delta: 10, why: 'a squad of three' }); }
    if (squad.length === 1) { skill -= 1; parts.push({ who: 'The Pack', delta: -10, why: 'alone' }); }
  }
  let chance = 50 + 10 * (skill - m.need);
  for (const g of squad) {
    if (g === squad.reduce((a, b) => (b.skill > a.skill ? b : a))) parts.unshift({ who: g.name, delta: 10 * (g.skill - m.need), why: `Skill ${g.skill} against ${m.need}` });
    else parts.push({ who: g.name, delta: 10, why: 'one more pair of hands' });
    const t = traitOf(g.trait);
    const fits = t.on.length === 0 || t.on.some((x) => m.tags.includes(x) || x === m.type || (x === 'workshop' && s.rooms.includes('workshop')));
    if (t.plus && fits) { chance += t.plus; parts.push({ who: g.name, delta: t.plus, why: t.name }); }
    if (g.flaw === 'hot-headed' && how === 'quiet') { chance -= 10; parts.push({ who: g.name, delta: -10, why: 'Hot-Headed, on a Quiet job' }); }
  }
  const h = SKY.how[how];
  if (h.chance) { chance += h.chance; parts.push({ who: h.name, delta: h.chance, why: 'how' }); }
  if (arch(s, 'stormfront')) { chance += 5; parts.push({ who: 'The Stormfront', delta: 5, why: 'no weather penalty' }); }
  if (s.gadgets.includes('balloon') && (m.type === 'watch' || m.type === 'supply')) { chance += 5; parts.push({ who: 'Weather balloons', delta: 5, why: 'gadget' }); }
  if (s.gadgets.includes('kite') && m.type === 'parley') { chance += 10; parts.push({ who: 'Signal kites', delta: 10, why: 'gadget' }); }
  if (m.type === 'watch' && arch(s, 'watchers')) return { chance: 100, parts: [...parts, { who: 'The Watchers', delta: 0, why: 'Watch missions always succeed' }] };
  return { chance: clamp(chance, 5, 95), parts };
}

/** Why a grunt can't go on this mission, or null. */
export function cantGo(s: TeamSkyState, g: SkyGrunt, m: SkyMission): string | null {
  if (g.captured) return 'Captured.';
  if (g.away) return 'Away on a mission.';
  if (g.hurt > s.tick) return 'Their Pokémon are resting this stage.';
  if (g.id === m.free) return 'This is their rescue.';
  if (g.flaw === 'old-loyalties' && m.against && hiredFrom(g.origin) === m.against) return `Won't go against their old team.`;
  if (g.loyalty <= 4 && g.loyalty >= 3 && m.against && hiredFrom(g.origin) === m.against) return 'Grumbles, and refuses: it goes against where they came from.';
  return null;
}

export const missionNodes = (s: TeamSkyState, m: SkyMission): number => Math.max(1, m.nodes - (arch(s, 'flock') ? 1 : 0) - (s.gadgets.includes('glider') ? 1 : 0));
export const squadsOut = (s: TeamSkyState): number => s.away.length;

function resolve(content: Content, run: RunState, s: TeamSkyState, a: TeamSkyState['away'][number]): void {
  const squad = a.squad.map((id) => s.grunts.find((g) => g.id === id)).filter((g): g is SkyGrunt => !!g);
  for (const g of squad) g.away = false;
  const m = a.mission;
  const win = rng(run, `mission-${m.id}`).float() * 100 < a.chance;
  const def = typeDef(m.type);
  const h = SKY.how[a.how];
  const lead = squad.reduce((x, y) => (y.rank > x.rank || (y.rank === x.rank && y.skill > x.skill) ? y : x), squad[0]!);
  const mate = squad.find((g) => g !== lead)?.name ?? lead?.name ?? 'somebody';
  const r = rng(run, `report-${m.id}`);
  const lines = (win ? SKY.reports.win : SKY.reports.lose)[m.type] ?? ['Back.'];
  let text = r.pick(lines).replaceAll('{mate}', mate).replaceAll('{op}', s.intel[0] ?? 'the next Operation');
  const side = (m.against === 'magma' || m.against === 'aqua' ? m.against : null) as 'magma' | 'aqua' | null;
  const heatUp = (n: number) => {
    const loud = squad.some((g) => g.flaw === 'loud') && a.how === 'quiet' ? 1 : 0;
    let x = n + h.heat + loud;
    if (a.how === 'quiet' && arch(s, 'kites')) x = Math.floor(x / 2);
    x = Math.max(0, x);
    for (const k of side ? [side] : (['magma', 'aqua'] as const)) s.heat[k] = clamp(s.heat[k] + (side ? x : Math.ceil(x / 2)), 0, SKY.heatMax);
  };
  for (const g of squad) g.missions += 1;
  if (win) {
    const creed = (flagOf(run, 'sky-creed-balance') && m.type === 'sabotage') || (flagOf(run, 'sky-creed-small') && m.type === 'rescue') || (flagOf(run, 'sky-creed-above') && m.type === 'raid') ? 1 : 0;
    s.renown += (def.win.renown ?? 0) + creed;
    if (def.win.funds) {
      const greedy = squad.some((g) => g.flaw === 'greedy') ? 0.9 : 1;
      s.funds += Math.round(def.win.funds * h.pay * greedy);
    }
    if (def.win.loyalty) for (const g of squad) g.loyalty = clamp(g.loyalty + def.win.loyalty, 0, 10);
    if (def.win.kind) setFlag(run, 'kind-total', flagOf(run, 'kind-total') + def.win.kind * (flagOf(run, 'sky-creed-small') ? 2 : 1));
    if (def.win.recruits) setFlag(run, 'sky-recruits', flagOf(run, 'sky-recruits') + def.win.recruits);
    if (def.win.trouble) setFlag(run, `sky-parley-${m.against || 'both'}`, flagOf(run, `sky-parley-${m.against || 'both'}`) + 1);
    if (def.win.intel) {
      const op = nextOpName(content, run);
      s.intel.unshift(op);
      text = text.replaceAll('the next Operation', op);
      setFlag(run, `sky-watched-${m.against || 'both'}`, 1);
    }
    heatUp(def.win.heat ?? 0);
    if (m.free) {
      const g = s.grunts.find((x) => x.id === m.free);
      if (g) { g.captured = false; g.loyalty = clamp(g.loyalty + 2, 0, 10); text = `${g.name}'s out. They're quiet. They keep looking at you.`; }
    }
    s.last = 'win';
  } else {
    heatUp(1);
    if (m.type === 'supply') s.funds = Math.max(0, s.funds - 200);
    const medic = squad.some((g) => g.trait === 'medic') || s.rooms.includes('infirmary');
    if (!medic) for (const g of squad) g.hurt = s.tick + 1;
    const safe = s.grunts.some((g) => g.rank === 3 && g.orders === 'safe');
    if (m.type === 'raid' && !safe && squad.length > 0) {
      const taken = squad.find((g) => g !== lead) ?? lead!;
      taken.captured = true;
      text = text.replaceAll('{mate}', taken.name);
      s.missions.push({ id: `free-${taken.id}-${s.tick}`, type: 'rescue', at: `Wherever they've got ${taken.name}`, text: `Get ${taken.name} back.`, tags: [], against: m.against, need: 3, nodes: 1, free: taken.id });
    }
    s.last = 'lose';
  }
  if (a.how === 'kind') for (const g of squad) g.loyalty = clamp(g.loyalty + 1, 0, 10);
  report(s, `${rankName(lead?.rank ?? 0)} ${lead?.name ?? ''}`.trim(), text, win);
}

/** The region team's next Operation (what a Watch finds), in words. */
function nextOpName(content: Content, run: RunState): string {
  const ids = ['magma', 'aqua'];
  const pick = rng(run, `intel-${run.regionIndex}-${run.stage?.index ?? 0}`);
  const team = content.evilTeams.teams.find((t) => t.id === pick.pick(ids));
  const op = team?.ops.length ? pick.pick(team.ops) : null;
  return op ? `${team!.name}'s ${op.name}` : 'the next Operation';
}

/** What's missing for the next rank, in words (7.10), or null when it's ready. */
export function nextRankNeeds(run: RunState, s: TeamSkyState, g: SkyGrunt): string | null {
  if (g.rank >= 3) return 'Top rank.';
  const next = SKY.ranks[g.rank + 1]!;
  if (g.missions < next.missions) return `needs ${next.missions - g.missions} more mission${next.missions - g.missions === 1 ? '' : 's'}`;
  if (g.loyalty < next.loyalty) return `needs Loyalty ${next.loyalty}`;
  if (g.rank + 1 === 3 && s.grunts.filter((x) => x.rank === 3).length >= skyCaps(run, s).admins) return 'no Admin slot';
  if (s.funds < next.cost) return `needs ₽${next.cost}`;
  return null;
}

/** 6.4: the species the doctrine gives each rank (a live preview; no roll). */
export function doctrinePreview(content: Content, s: TeamSkyState): string[][] {
  let pool: { id: string; bst: number; base: boolean }[];
  const all = [...content.species.values()].filter((sp) => !isLegendaryLike(sp) && sp.dex <= 1025);
  const bst = (sp: (typeof all)[number]) => Object.values(sp.baseStats).reduce((a, b) => a + b, 0);
  if (s.doctrine.mode === 'arch' && s.doctrine.arch && s.doctrine.arch !== 'strays') {
    const ids = SKY.archetypes.find((a) => a.id === s.doctrine.arch)?.pool ?? [];
    pool = ids.map((id) => content.species.get(id)).filter((sp): sp is (typeof all)[number] => !!sp).map((sp) => ({ id: sp.id, bst: bst(sp), base: !sp.evolvesFrom }));
  } else if (s.doctrine.mode === 'types' && s.doctrine.types.length) {
    const types = new Set(s.doctrine.types);
    pool = all.filter((sp) => sp.types.some((t) => types.has(t)) && sp.dex <= 386).map((sp) => ({ id: sp.id, bst: bst(sp), base: !sp.evolvesFrom }));
  } else return [['Whatever they already had.'], [], [], []];
  pool.sort((a, b) => a.bst - b.bst || a.id.localeCompare(b.id));
  if (pool.length === 0) return [[], [], [], []];
  const at = (f: number) => pool[Math.min(pool.length - 1, Math.floor(f * (pool.length - 1)))]!.id;
  const name = (id: string) => content.species.get(id)?.name ?? id;
  const basics = pool.filter((p) => p.base);
  return [
    [name((basics[0] ?? pool[0]!).id)],
    [name(at(0.3)), name(at(0.4))],
    [name(at(0.6)), name(at(0.7)), name(at(0.75))],
    [name(at(0.85)), name(at(0.95)), name(at(1))],
  ];
}

/** 7.11 Matchups: how the doctrine does against Magma's and Aqua's usual teams. */
export function doctrineMatchups(content: Content, s: TeamSkyState): { magma: string; aqua: string } {
  let types: string[] = s.doctrine.types;
  if (s.doctrine.mode === 'arch') {
    const ids = SKY.archetypes.find((a) => a.id === s.doctrine.arch)?.pool ?? [];
    types = [...new Set(ids.flatMap((id) => content.species.get(id)?.types ?? []))];
  }
  const score = (foes: string[][]) => {
    if (types.length === 0) return 'even';
    const v = foes.reduce((sum, f) => sum + Math.max(...types.map((t) => typeEffectiveness(content.typeChart, t as never, f as never))), 0) / foes.length;
    return v >= 1.5 ? 'strong' : v < 1 ? 'weak' : 'even';
  };
  return { magma: score([['fire'], ['ground'], ['dark'], ['fire', 'ground']]), aqua: score([['water'], ['dark'], ['water', 'dark'], ['poison']]) };
}

export function windowLine(s: TeamSkyState): string {
  return SKY.window[s.last] ?? SKY.window.none!;
}

/** The hub's "Today" lines (7.9). */
export function todayLines(run: RunState, s: TeamSkyState): string[] {
  const out: string[] = [];
  const rep = s.reports.find((r) => r.tick === s.tick);
  if (rep) out.push(`${rep.who} is back: "${rep.text.slice(0, 60)}${rep.text.length > 60 ? '…' : ''}"`);
  const cracked = s.grunts.find((g) => g.cracked > 0);
  if (cracked) out.push(`${cracked.name} wants a word.`);
  const ready = s.grunts.find((g) => nextRankNeeds(run, s, g) === null);
  if (ready) out.push(`${ready.name} is ready for ${rankName(ready.rank + 1)}.`);
  if (s.rooms.includes('window') && flagOf(run, 'zinnia-gone') === 0) out.push('Zinnia is at the long window.');
  if (out.length === 0) out.push('A quiet day. The kite string taps the pole.');
  return out.slice(0, 3);
}

/** Every change the screens make goes through here; the message says what happened in plain words. */
export function skyAct(content: Content, run: RunState, a: SkyAction): string {
  if (!skyFounded(run)) return 'Team Sky has not been founded.';
  // Founded mid-stage (the event just played): the team starts now rather than at the next stage.
  if (!run.expansion?.teamSky) skyStageStart(content, run);
  const s = teamSkyOf(run)!;
  if (a.kind === 'open') return '';
  const grunt = (id: string) => s.grunts.find((g) => g.id === id);
  const done = (last: string, msg: string): string => { s.last = last; syncFlags(run, s); return msg; };
  switch (a.kind) {
    case 'ask': {
      const c = s.candidates.find((x) => x.id === a.id);
      if (!c) return 'They have gone.';
      if (c.answer) return c.answer;
      c.answer = `${c.name}: ${originOf(c.origin).answers[a.q] ?? '...'}`;
      return done('none', c.answer);
    }
    case 'hire': {
      const c = s.candidates.find((x) => x.id === a.id);
      if (!c) return 'They have gone.';
      if (s.grunts.length >= skyCaps(run, s).grunts) return 'No room. Build a Roost or let someone go.';
      if (s.funds < c.fee) return `The chest is short: the fee is ₽${c.fee}.`;
      s.funds -= c.fee;
      s.candidates = s.candidates.filter((x) => x !== c);
      const { fee: _f, why: _w, answer: _a, ...rest } = c;
      s.grunts.push({ ...rest, rank: 0, missions: 0, since: 0, hurt: 0, captured: false, cracked: 0, talked: -1, away: false });
      return done('hire', `${c.name} ties on the green scarf.`);
    }
    case 'promote': {
      const g = grunt(a.id);
      if (!g) return 'Nobody by that name.';
      const need = nextRankNeeds(run, s, g);
      if (need) return `${g.name} ${need}.`;
      const next = SKY.ranks[g.rank + 1]!;
      s.funds -= next.cost;
      g.rank += 1;
      g.since = 0;
      if (g.rank === 2) g.nick = SKY.nicknames[(Number(g.id.replace(/\D/g, '')) || g.name.length) % SKY.nicknames.length];
      // 6.3: whoever was passed over reacts by their flaw. A Glory-Hound sulks; a loyal one claps.
      const sulk = s.grunts.filter((x) => x !== g && x.flaw === 'glory-hound' && x.rank <= g.rank && x.missions >= g.missions - 1);
      for (const x of sulk) x.loyalty = clamp(x.loyalty - 1, 0, 10);
      const claps = s.grunts.filter((x) => x !== g && x.loyalty >= 8).map((x) => x.name);
      return done('promote', `You pin the badge on ${g.name}: ${next.name}${g.nick ? `, "${g.nick}"` : ''}. ${next.gains}${claps.length ? ` ${claps.slice(0, 2).join(' and ')} clap${claps.length === 1 ? 's' : ''}.` : ''}${sulk.length ? ` ${sulk.map((x) => x.name).join(' and ')} sulk${sulk.length === 1 ? 's' : ''}.` : ''}`);
    }
    case 'dismiss': {
      const g = grunt(a.id);
      if (!g) return 'Nobody by that name.';
      s.grunts = s.grunts.filter((x) => x !== g);
      if (g.gift) run.box.push(PokemonInstanceSchema.parse(g.gift));
      // 6.3: it costs Loyalty across the team unless they had it coming (a cracked feather is warning enough).
      const deserved = g.cracked > 0;
      if (!deserved) for (const x of s.grunts) x.loyalty = clamp(x.loyalty - 1, 0, 10);
      return done('dismiss', `${g.name} hands back the scarf.${deserved ? '' : ' The others watched. Loyalty −1 for everyone.'}${g.gift ? ' Your Pokémon goes back to the Box.' : ''}`);
    }
    case 'talk': {
      const g = grunt(a.id);
      if (!g) return 'Nobody by that name.';
      if (g.talked === s.tick) return `You've talked to ${g.name} this stage.`;
      g.talked = s.tick;
      const works = (SKY.talk.works[g.flaw] ?? 0) === a.line;
      if (works) { g.loyalty = clamp(g.loyalty + 2, 0, 10); g.cracked = 0; }
      return done('talk', `${g.name}: ${works ? SKY.talk.yes : SKY.talk.no}${works ? ' Loyalty +2.' : ''}`);
    }
    case 'orders': {
      const g = grunt(a.id);
      if (!g || g.rank < 3) return 'Only Admins take standing orders.';
      g.orders = a.orders;
      return done('none', `${g.name}: "${SKY.orders.find((o) => o.id === a.orders)!.name}. Understood."`);
    }
    case 'ace': {
      const g = grunt(a.id);
      if (!g || g.rank < 3) return 'Only Admins have an ace.';
      if (!(SKY.aces[g.trait] ?? []).includes(a.species)) return 'Not one of the three.';
      g.ace = a.species;
      return done('none', `${g.name}'s ace is ${content.species.get(a.species)?.name ?? a.species}.`);
    }
    case 'give': {
      const g = grunt(a.id);
      const mon = run.box[a.box];
      if (!g || g.rank < 2) return 'From Wingleader up.';
      if (g.gift) return `${g.name} already has one of yours.`;
      if (!mon) return 'No Pokémon there.';
      run.box.splice(a.box, 1);
      g.gift = mon as unknown as Record<string, unknown>;
      g.loyalty = clamp(g.loyalty + 2, 0, 10);
      return done('talk', `${content.species.get(mon.speciesId)?.name ?? 'It'} is ${g.name}'s now. Loyalty +2.`);
    }
    case 'takeBack': {
      const g = grunt(a.id);
      if (!g?.gift) return 'Nothing to ask back.';
      run.box.push(PokemonInstanceSchema.parse(g.gift));
      g.gift = undefined;
      g.loyalty = clamp(g.loyalty - 3, 0, 10);
      return done('dismiss', `${g.name} hands it back without a word. Loyalty −3.`);
    }
    case 'types':
    case 'arch': {
      const cost = s.doctrine.set ? SKY.doctrineCost : 0;
      if (s.funds < cost) return `Changing the doctrine costs ₽${cost}.`;
      if (a.kind === 'types' && (a.types.length !== 3 || new Set(a.types).size !== 3)) return 'Pick three different types.';
      if (a.kind === 'arch' && !SKY.archetypes.some((x) => x.id === a.arch)) return 'No such archetype.';
      s.funds -= cost;
      s.doctrine = a.kind === 'types' ? { mode: 'types', types: [...a.types], arch: '', set: true } : { mode: 'arch', types: [], arch: a.arch, set: true };
      if (a.kind === 'arch' && a.arch === 'strays') for (const g of s.grunts) g.loyalty = clamp(g.loyalty + 1, 0, 10);
      return done('doctrine', `The doctrine is set${cost ? ` (₽${cost})` : ''}. Every grunt's team is redrawn over the next stage.`);
    }
    case 'build': {
      const room = SKY.rooms.find((r) => r.id === a.room);
      if (!room) return 'No such room.';
      if (!skyBase(run)) return 'Sky has no base yet.';
      if (s.rooms.includes(room.id)) return 'Built already.';
      if (s.funds < room.cost) return `The ${room.name} costs ₽${room.cost}.`;
      s.funds -= room.cost;
      s.rooms.push(room.id);
      return done('build', `The ${room.name} is built. ${room.text}`);
    }
    case 'gadget': {
      const gd = SKY.gadgets.find((x) => x.id === a.id);
      if (!gd || !s.rooms.includes('workshop')) return 'Gadgets need the Workshop.';
      if (s.gadgets.includes(gd.id)) return 'Made already.';
      const cost = arch(s, 'machines') ? Math.floor(gd.cost / 2) : gd.cost;
      if (s.funds < cost) return `${gd.name} cost ₽${cost}.`;
      s.funds -= cost;
      s.gadgets.push(gd.id);
      return done('build', `${gd.name}: ${gd.text}`);
    }
    case 'send': {
      const m = s.missions.find((x) => x.id === a.mission);
      if (!m) return 'That mission is gone.';
      if (s.away.length >= skyCaps(run, s).squads) return 'Every squad is out.';
      const squad = a.squad.map(grunt).filter((g): g is SkyGrunt => !!g);
      if (squad.length === 0 || squad.length > 3) return 'Pick one to three grunts.';
      for (const g of squad) { const why = cantGo(s, g, m); if (why) return `${g.name}: ${why}`; }
      if (squad.some((g) => g.rank === 0) && squad.every((g) => g.rank === 0) && m.need >= 4) return 'Fledglings can only go with a Flyer or better on a hard mission.';
      const h = SKY.how[a.how];
      if (s.funds < h.cost) return `Kind costs ₽${h.cost}.`;
      s.funds -= h.cost;
      const { chance } = missionChance(s, m, squad, a.how);
      for (const g of squad) g.away = true;
      s.missions = s.missions.filter((x) => x !== m);
      s.away.push({ mission: m, squad: squad.map((g) => g.id), how: a.how, chance, left: missionNodes(s, m) });
      return done('dispatch', `${squad.map((g) => g.name).join(', ')} set out. Back in ${missionNodes(s, m)} node${missionNodes(s, m) === 1 ? '' : 's'}.`);
    }
  }
}
