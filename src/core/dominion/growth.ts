// DOMINION D10, Growth (Part 1 §3.2, Part 3 §5, Part 9 A10): the bigger options that turn a gang into an organisation.
// Buy Out (businesses), Raid (a chain of fights), Gym Takeover (five ways, Defiance and the Wall), Post Flyers (walk-in
// recruits), Bribe, Fence (stolen goods), Smuggle (routes that pay nightly), Kidnap, Hit a Lab, specialists, and the
// rest of the actions that waited on this slice. Every rule reads growth.json; every roll has its own stream.
// Registers into field.ts (Card hooks, effects, gates, the fight settler), crew.ts (task kinds) and the World Turn.

import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import {
  addActAfter, addActEffect, addCardGate, addCardHook, addFightSettler, addHeat, addLootHook, districtDef, edgeXp, foeLevel,
  setGrowthFoe, statusOf, targetDef, wanted, type ActFx, type Card,
} from './field';
import { addLoyalty, addMorale, addTaskKind, crewOf, freshCrewState, type TaskCtx } from './crew';
import { addClean, cleanOf, hqFx, spend } from './hqFx';
import { makeLead } from './recruit';
import { addTension, teamsHere } from './rivals';
import { peakOf } from './empire';
import type { DominionBlock, FieldFight, GrowthChain, GrowthSide, GrowthState, GymWay, Member, StatId } from './schema';
import { addWorldStep, fill } from './worldTurn';

const G = () => DOMINION_DATA.growth;
const F = () => DOMINION_DATA.field;
const Ln = (k: string): string => G().lines[k] ?? k;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
const round10 = (n: number): number => Math.round(n / 10) * 10;
const money = (n: number): string => n.toLocaleString('en-US');
const dname = (id: string): string => districtDef(id)?.name ?? id;
const weekly = (b: DominionBlock): boolean => b.day % DOMINION_DATA.start.clock.weekLength === 0;
const weekOf = (day: number): number => Math.floor((day - 1) / DOMINION_DATA.start.clock.weekLength) + 1;

// ---------- state ----------

export const freshGrowth = (): GrowthState => ({
  biz: {}, cornered: {}, gyms: {}, badges: [], gymScout: {}, shaken: {}, courted: [], flyers: {}, design: null, routes: [], contacts: [],
  hot: {}, papers: 0, dirt: [], loans: [], stall: 0, safehouses: [], mercs: 0, bigNight: 0, bribed: {}, chain: null,
});
/** The block's Growth (filled the same way every time, so a save from before D10 loads unchanged). */
export const growthOf = (b: DominionBlock): GrowthState => (b.growth ??= freshGrowth());
const EMPTY = freshGrowth();
/** Read-only (the Card and its gates never change the block). */
const peek = (b: DominionBlock): GrowthState => b.growth ?? EMPTY;

// ---------- look-ups ----------

export const bizOf = (target: string | null) => (target ? G().business.find((x) => x.target === target) : undefined);
export const gymIn = (district: string) => G().gyms.find((g) => g.district === district);
export const gymDef = (id: string) => G().gyms.find((g) => g.id === id);
export const wayDef = (id: GymWay) => G().ways.find((w) => w.id === id)!;
/** A member at work (not jailed or hurt) whose formed trait is `id` (crew.json formed: Road Hog, Orator...). */
const traitHere = (b: DominionBlock, id: string): Member | undefined => b.members.find((m) => crewOf(m).formed.includes(id) && !crewOf(m).out);
/** A Fence or Black Market contact: a hired Fence, a member in the Fence role, or a building that brings one (Black Market Counter, Pawn Shop). */
export const hasContact = (b: DominionBlock): boolean => peek(b).contacts.includes('fence') || hqFx(b).contact > 0 || b.members.some((m) => crewOf(m).role === 'fence' && !crewOf(m).out);
const patronWon = (b: DominionBlock, id: string): boolean => b.crew?.patrons[id]?.state === 'won';
/** Gyms the Boss owns (taken by Buy, Break, Blackmail or Convert). D14 (Monarch) counts these. */
export const ownedGyms = (b: DominionBlock): string[] => Object.entries(peek(b).gyms).filter(([, s]) => s.way && s.way !== 'beat').map(([id]) => id);
const owns = (b: DominionBlock, gymId: string): boolean => ownedGyms(b).includes(gymId);
const scouts = (b: DominionBlock, gymId: string): number => peek(b).gymScout[gymId] ?? 0;
const bandOf = (m: Member): number => DOMINION_DATA.pyramid.ranks.find((r) => r.id === m.rank)?.band ?? 1;
/** Members who can lead a Gym for you (A10: a Captain or higher). */
export const wallCandidates = (b: DominionBlock): Member[] => b.members.filter((m) => bandOf(m) >= G().gym.wallBand && !crewOf(m).out);
const maxRoutes = (b: DominionBlock, lv: number): number => G().smuggle.base + Math.floor((lv - 1) / 2) + hqFx(b).routes + (traitHere(b, 'road-hog') ? 1 : 0);
const rng = (seed: string, ...parts: (string | number)[]): Rng => new Rng(hashSeed(`${seed}::${parts.join('::')}`));
/** The mastery level of an action (1-5). */
const lvOf = (b: DominionBlock, id: string): number => {
  const xp = b.field.mastery[id] ?? 0;
  const t = F().mastery.thresholds;
  return 1 + t.filter((n) => xp >= n).length;
};

// ---------- the Card ----------

/** Adds a part to the odds and works the chance out again (the Card's own rule: capped, floored, a range if unscouted). */
function addPart(c: Card, label: string, n: number): void {
  if (!c.roll || !n) return;
  c.parts.push([label, n]);
  const O = F().odds;
  c.chance = clamp(c.base + c.parts.reduce((a, [, x]) => a + x, 0), O.min, O.max);
  c.range = c.exact ? [c.chance, c.chance] : [clamp(c.chance - O.rangeHalf, O.min, O.max), clamp(c.chance + O.rangeHalf, O.min, O.max)];
}
/** A sure thing: no roll, no police on a failure. */
function sure(c: Card): void {
  c.roll = false;
  c.chance = 100;
  c.exact = true;
  c.range = [100, 100];
  c.parts = [];
  c.police = 0;
}
function useStat(b: DominionBlock, c: Card, stat: StatId): void {
  const i = c.parts.findIndex(([l]) => l.startsWith('Boss '));
  if (i >= 0) c.parts.splice(i, 1);
  c.parts.unshift([`Boss ${stat[0]!.toUpperCase()}${stat.slice(1)} ${b.field.edge.stats[stat]}`, b.field.edge.stats[stat] * F().odds.statPer]);
  addPart(c, '', 0);
  const O = F().odds;
  c.chance = clamp(c.base + c.parts.reduce((a, [, x]) => a + x, 0), O.min, O.max);
}

function chainSides(b: DominionBlock, c: { def: { id: string }; district: { id: string }; target: { id: string; kind: string; foe: { name: string; cls: string; species: string[]; offset: number } } | null }, kind: GrowthChain['kind'], gymId: string | null): GrowthSide[] {
  if (gymId) {
    const g = gymDef(gymId)!;
    const leader: GrowthSide = { name: g.leader, cls: 'gym-leader', leaderId: g.leaderId, species: g.species, offset: g.offset };
    return kind === 'break' ? [...g.trainers, leader] : [leader];
  }
  const t = c.target;
  const base: GrowthSide = t ? { name: t.foe.name, cls: t.foe.cls, leaderId: null, species: t.foe.species, offset: t.foe.offset } : { name: 'Guards', cls: 'veteran', leaderId: null, species: ['growlithe'], offset: 0 };
  const n = kind === 'gauntlet' ? G().gauntlet.fights : G().raid.fights[t?.kind ?? 'site'] ?? 3;
  return Array.from({ length: n }, (_, i) => ({ ...base, name: i === n - 1 && kind === 'raid' ? `${base.name} (the boss)` : base.name, offset: base.offset + i * G().raid.levelStep }));
}

addCardHook((b, run, c) => {
  const e = c.play?.effect;
  const g = peek(b);
  // Business perks (+odds in their town) and hired muscle (fight jobs).
  for (const [id] of Object.entries(g.biz)) {
    const d = bizOf(id);
    if (d?.perk.kind === 'odds' && targetDef(id)?.district.id === c.district.id) addPart(c, `Your ${d.name}`, d.perk.n);
  }
  if (g.mercs >= b.day && c.play?.battle) addPart(c, 'Mercenaries', G().mercs.odds);
  for (const s of G().specialists) if (g.contacts.includes(s.id) && s.odds?.[c.def.id]) addPart(c, `Your ${s.name.replace(/^an? /, '')}`, s.odds[c.def.id]!);
  if (!e) return;
  switch (e) {
    case 'buyOut': {
      const d = bizOf(c.target?.id ?? null);
      if (!d) return;
      const forced = (g.cornered[d.target] ?? 0) >= G().buyOut.cornered;
      const off = G().buyOut.off[lvOf(b, c.def.id) - 1] ?? 0;
      const price = round10((d.price * (forced ? G().buyOut.forcedPct : 100) * (100 - off)) / 10000);
      c.money = price;
      c.note = `${d.name}: ₽${money(price)}${forced ? ' (Cornered: half price, dirty money is fine)' : ', clean money'} · pays ₽${d.income}/wk${d.clean ? ' clean' : ''} · ${d.text}`;
      if (forced) {
        c.heat = G().buyOut.forcedHeat;
        c.regard = G().buyOut.forcedRegard;
      } else c.note += ` · ${fill(Ln('cornerStep'), { n: g.cornered[d.target] ?? 0, need: G().buyOut.cornered })}`;
      return;
    }
    case 'gym': {
      const gym = gymIn(c.district.id);
      if (!gym) return;
      if (owns(b, gym.id)) {
        c.opts = [{ id: 'raise', label: `A raise (₽${money(G().gym.raise)})` }, ...wallCandidates(b).map((m) => ({ id: `appoint:${m.id}`, label: `Make ${m.name} Leader` }))];
        if (!c.opt || !c.opts.some((o) => o.id === c.opt)) c.opt = c.opts[0]!.id;
        const st = g.gyms[gym.id]!;
        const lead = st.leader ? b.members.find((m) => m.id === st.leader)?.name ?? null : null;
        c.note = `${gym.leader}'s Gym is yours (${wayDef(st.way!).name}). Defiance ${st.defiance}/10 · Leader: ${lead ?? gym.leader}`;
        sure(c);
        if (c.opt === 'raise') c.money = G().gym.raise;
        return;
      }
      const ways = (gym.only ?? G().ways.map((w) => w.id)).map((id) => wayDef(id));
      c.opts = ways.map((w) => ({ id: w.id, label: w.name }));
      if (!c.opt || !c.opts.some((o) => o.id === c.opt)) c.opt = c.opts[0]!.id;
      const w = wayDef(c.opt as GymWay);
      const fights = w.id === 'break' ? gym.trainers.length + 1 : w.id === 'beat' ? 1 : 0;
      c.note = `${gym.leader} (${gym.type}) · ${w.text}${fights ? ` ${fights} fight${fights > 1 ? 's' : ''}.` : ''}${gym.why ? ` ${gym.why}` : ''}`;
      if (w.id === 'blackmail') {
        if (g.shaken[gym.id] && g.shaken[gym.id]! >= b.day) addPart(c, `${gym.leader} is shaken`, 10);
      } else if (w.id === 'convert') {
        useStat(b, c, 'charm');
        addPart(c, 'Winning them over', w.chance - c.base);
      } else sure(c);
      // The disgraced Gym Leader (a Patron, crew.json): Gym takeovers +15%.
      if (c.roll && patronWon(b, 'disgraced-leader')) addPart(c, 'Ms. Kettering\'s advice', G().gym.patron);
      if (w.id === 'buy') c.money = G().gym.buy;
      return;
    }
    case 'bribe': {
      c.opts = G().bribe.map((x) => ({ id: x.id, label: `${x.name} (₽${x.cost})` }));
      if (!c.opt || !c.opts.some((o) => o.id === c.opt)) c.opt = c.opts[0]!.id;
      const x = G().bribe.find((y) => y.id === c.opt)!;
      c.money = x.cost;
      c.note = x.text;
      sure(c);
      return;
    }
    case 'specialist': {
      const left = G().specialists.filter((s) => !g.contacts.includes(s.id));
      c.opts = left.map((s) => ({ id: s.id, label: `${s.name[0]!.toUpperCase()}${s.name.slice(1)} (₽${money(s.cost)})` }));
      if (!c.opts.length) return;
      if (!c.opt || !c.opts.some((o) => o.id === c.opt)) c.opt = c.opts[0]!.id;
      const s = left.find((x) => x.id === c.opt)!;
      c.money = s.cost;
      c.note = `${s.text} Wage ₽${s.wage}/wk.`;
      sure(c);
      return;
    }
    case 'flyers': {
      const F_ = G().flyers;
      if (!g.design) {
        c.opts = F_.designs.map((d) => ({ id: d.id, label: d.name }));
        if (!c.opt || !c.opts.some((o) => o.id === c.opt)) c.opt = c.opts[0]!.id;
      }
      const des = F_.designs.find((d) => d.id === (g.design ?? c.opt));
      const up = g.flyers[c.district.id];
      c.money = up ? 0 : F_.cost;
      c.heat = F_.heat;
      c.note = `${des ? `${des.name}: ${des.motto} ` : ''}₽${F_.cost} a week per district. Walk-in recruits each week; police tear them down at Wanted ${F_.tornAt}.`;
      return;
    }
    case 'storm': {
      const kind = c.def.id === 'gauntlet' ? 'gauntlet' : 'raid';
      const sides = chainSides(b, c, kind, null);
      c.note = `${sides.length} fights in a row, no healing between.${kind === 'raid' ? ` Win all: the place's loot, Control +${G().raid.control}, Dread +${G().raid.dread}.` : ''}${c.bring.length ? ` ${fill(Ln('squad'), { names: c.bring.map((id) => b.members.find((m) => m.id === id)?.name ?? id).join(', ') })}` : ''}`;
      return;
    }
    case 'fence': {
      const rate = G().fence.rate[lvOf(b, c.def.id) - 1]! + hqFx(b).fence;
      const n = Object.values(g.hot).reduce((a, x) => a + x, 0);
      c.note = `${n} stolen item${n === 1 ? '' : 's'} in the Bag. The Fence pays ${Math.min(100, rate)}% (shops pay ${G().fence.shop}%).`;
      return;
    }
    case 'smuggle': {
      const lv = lvOf(b, c.def.id);
      c.note = `Routes ${g.routes.length}/${maxRoutes(b, lv)}. A big success (or Lv 3+) opens a route to ${c.district.name} that pays every night.`;
      return;
    }
    case 'loan':
      c.note = `₽${G().loan.out} out, ₽${G().loan.back} back in ${G().loan.days} days (${G().loan.defaultPct}% skip town).`;
      return;
    case 'mercs':
      c.note = `+${G().mercs.odds}% on every job with a fight, for ${G().mercs.days} days.`;
      return;
    case 'safehouse':
      c.note = `Heat in ${c.district.name} cools ${G().safehouse.cool} more each night.`;
      return;
    case 'stall':
      c.note = `₽${G().stall.weekly} a week, dirty.`;
      return;
  }
});

/** The gates the list's Unlock column names that the generic rules can't read (Part 1 §3.2, lists 151-600). */
addCardGate((b, run, c) => {
  const p = c.play;
  if (!p) return null;
  const g = peek(b);
  const ds = b.field.districts[c.district.id]!;
  const gym = gymIn(c.district.id);
  switch (p.gate) {
    case 'contact': if (!hasContact(b)) return Ln('contact'); break;
    case 'heat20': if (ds.heat < 20) return Ln('heat20'); break;
    case 'wanted60': if (wanted(b.field) < 60) return Ln('wanted60'); break;
    case 'gymScouted': if (!gym || scouts(b, gym.id) < 1) return Ln('gymScouted'); break;
    case 'gymAlly': if (!gym || !(owns(b, gym.id) || g.courted.includes(gym.id))) return Ln('gymAlly'); break;
    case 'fly': if (!run.party.some((m) => m.moves.some((x) => x.id === 'fly'))) return Ln('fly'); break;
    case 'surf': if (!run.party.some((m) => m.moves.some((x) => x.id === 'surf'))) return Ln('surf'); break;
    case 'jailed': if (!b.members.some((m) => crewOf(m).out?.why === 'jail')) return Ln('jailed'); break;
    case 'fell': if (!b.members.some((m) => crewOf(m).out?.why === 'hurt')) return Ln('fell'); break;
  }
  switch (p.effect) {
    case 'buyOut': {
      const d = bizOf(c.target?.id ?? null);
      if (!d) return Ln('noBiz');
      if (g.biz[d.target]) return fill(Ln('ownBiz'), { name: d.name });
      if (d.rival && statusOf(ds) === 'rival') return fill(Ln('rivalBiz'), { name: d.name, district: c.district.name });
      const forced = (g.cornered[d.target] ?? 0) >= G().buyOut.cornered;
      if (!forced && cleanOf(b) < c.money) return fill(Ln('needClean'), { n: money(c.money), have: money(cleanOf(b)) });
      break;
    }
    case 'gym': {
      if (!gym) return fill(Ln('noGym'), { district: c.district.name });
      if (owns(b, gym.id)) break;
      const way = c.opt as GymWay;
      if (gym.only && !gym.only.includes(way)) return gym.why ?? Ln('gymOnly');
      if (gym.minor && way !== 'beat') return Ln('gymMinor');
      if (way === 'beat' && g.badges.includes(gym.id)) return Ln('noBadge');
      if (way === 'buy' && cleanOf(b) < G().gym.buy) return fill(Ln('needClean'), { n: money(G().gym.buy), have: money(cleanOf(b)) });
      if (way === 'blackmail' && scouts(b, gym.id) < G().gym.blackmailScouts) return fill(Ln('gymScouts'), { district: c.district.name, n: G().gym.blackmailScouts - scouts(b, gym.id), leader: gym.leader });
      if (way === 'convert' && !g.badges.includes(gym.id)) return fill(Ln('gymNotBeaten'), { leader: gym.leader });
      if ((way === 'beat' || way === 'break') && !run.party.some((m) => m.hp > 0)) return F().lines.noTeam!;
      break;
    }
    case 'specialist': if (!c.opts.length) return fill(Ln('hiredAlready'), { name: 'every specialist' }); break;
    case 'fence': if (!Object.keys(g.hot).length) return Ln('noHot'); break;
    case 'safehouse': if (g.safehouses.includes(c.district.id)) return fill(Ln('safehouseHave'), { district: c.district.name }); break;
    case 'bigNight': if (g.bigNight === weekOf(b.day)) return Ln('bigNightDone'); break;
    case 'storm': if (!run.party.some((m) => m.hp > 0)) return F().lines.noTeam!; break;
  }
  return null;
});

// ---------- the fight chain (Raid, Break, Beat, the Gauntlet, a Defiant Leader) ----------

/** Leaves the chain's next fight waiting (the session starts it; the scene starts the next one when it comes back). */
function queue(b: DominionBlock, ch: GrowthChain): void {
  growthOf(b).chain = ch;
  b.field.fight = { why: 'growth', foe: 'growth', begun: false, action: ch.action, target: ch.target, district: ch.district, pass: true, big: ch.big, wager: 0, racket: null } as FieldFight;
}

/** The side for the next fight (fight.ts builds the battle from it). */
export function growthSide(b: DominionBlock, run: Pick<RunState, 'party'>): { name: string; classId: string; leaderId: string | null; species: string[]; level: number } | null {
  const ch = b.growth?.chain;
  const side = ch?.sides[ch.step];
  if (!ch || !side) return null;
  let off = side.offset;
  // A10: your appointed Leader is the Gym's team; a shaken Leader fights below their level.
  if (ch.gym && (b.growth!.shaken[ch.gym] ?? 0) >= b.day && side.leaderId) off -= G().gym.shakenLevels;
  return { name: side.name, classId: side.cls, leaderId: side.leaderId, species: side.species, level: foeLevel(b, run, off) };
}
setGrowthFoe((b, run) => {
  const s = growthSide(b, run);
  return s ? { name: s.name, species: s.species[0]!, level: s.level, wild: false } : { name: 'A guard', species: 'rattata', level: 5, wild: false };
});

function startChain(b: DominionBlock, x: ActFx, kind: GrowthChain['kind'], gymId: string | null): string {
  const c = x.card!;
  const sides = chainSides(b, c, kind, gymId);
  queue(b, { kind, action: x.action, target: x.target, district: x.district, gym: gymId, step: 0, sides, big: x.big });
  return fill(Ln('chainNext'), { n: 1, of: sides.length, name: sides[0]!.name });
}

function takeGym(b: DominionBlock, gymId: string, way: GymWay): string[] {
  const g = growthOf(b), gym = gymDef(gymId)!, Gy = G().gym;
  g.gyms[gymId] = { way, day: b.day, defiance: Gy.defiance.start[way] ?? 0, told: false, leader: null };
  const ds = b.field.districts[gym.district]!;
  ds.control = clamp(ds.control + Gy.control);
  ds.dread += Gy.takeDread;
  if (way === 'buy') ds.regard += Gy.regardBuy;
  if (!b.flags.includes('gym-taken')) b.flags.push('gym-taken');
  const lines = [fill(Ln('took'), { district: dname(gym.district), way: wayDef(way).name, control: Gy.control })];
  if (way === 'break') {
    b.field.hero += Gy.breakHero;
    lines.push(fill(Ln('fled'), { leader: gym.leader }));
  }
  return lines;
}

function beatGym(b: DominionBlock, gymId: string): string[] {
  const g = growthOf(b), gym = gymDef(gymId)!;
  if (!g.badges.includes(gymId)) g.badges.push(gymId);
  b.field.districts[gym.district]!.dread += G().gym.beatDread;
  if (!b.flags.includes('gym-beaten')) b.flags.push('gym-beaten');
  return [fill(Ln('beat'), { leader: gym.leader, badge: gym.badge })];
}

addFightSettler('growth', (content, b, run, fight, outcome) => {
  const g = growthOf(b), ch = g.chain;
  if (!ch) return [];
  const of = ch.sides.length;
  if (outcome !== 'win') {
    g.chain = null;
    if (ch.kind === 'defiant' && ch.gym) {
      delete g.gyms[ch.gym];
      return [fill(Ln('defiantLost'), { leader: gymDef(ch.gym)!.leader })];
    }
    addHeat(b, ch.district, G().raid.failHeat);
    return [fill(Ln('chainLost'), { n: ch.step + 1, of })];
  }
  if (ch.step + 1 < of) {
    const next = { ...ch, step: ch.step + 1 };
    queue(b, next);
    return [fill(Ln('chainNext'), { n: next.step + 1, of, name: next.sides[next.step]!.name })];
  }
  g.chain = null;
  const lines = [fill(Ln('chainWon'), { of })];
  const R = G().raid;
  if (ch.kind === 'beat' && ch.gym) lines.push(...beatGym(b, ch.gym));
  else if (ch.kind === 'break' && ch.gym) lines.push(...beatGym(b, ch.gym), ...takeGym(b, ch.gym, 'break'));
  else if (ch.kind === 'defiant' && ch.gym) {
    const st = g.gyms[ch.gym]!;
    st.defiance = G().gym.defiance.tell - 2;
    st.told = false;
    lines.push(fill(Ln('defiantWon'), { leader: gymDef(ch.gym)!.leader, n: st.defiance }));
  } else {
    const loot = openLoot(content, b, run, ch.kind === 'gauntlet' ? G().gauntlet.crate : R.crate, `${ch.action}-${b.day}`);
    if (ch.kind === 'raid') {
      const ds = b.field.districts[ch.district]!;
      ds.control = clamp(ds.control + R.control);
      ds.dread += R.dread;
      ds.rival = clamp(ds.rival + R.rival);
      const team = teamsHere()[0];
      if (team) addTension(b, team.id, 5);
      lines.push(fill(Ln('raidWon'), { target: targetDef(ch.target)?.target.name ?? dname(ch.district), loot, control: R.control, dread: R.dread }));
    } else lines.push(fill(Ln('gauntletWon'), { loot }));
  }
  return lines;
});

/** A crate's items into the Bag (stolen goods) and its cash into the funds. Rolled on `dominion-loot`. */
function openLoot(content: Content | null, b: DominionBlock, run: RunState, id: string, key: string): string {
  const c = F().crates[id];
  if (!c) return 'nothing';
  const r = rng(run.seed, 'dominion-loot', key);
  const total = c.items.reduce((a, [, w]) => a + w, 0);
  const got: Record<string, number> = {};
  for (let i = 0; i < c.picks; i++) {
    let x = r.int(1, total);
    for (const [item, w] of c.items) {
      x -= w;
      if (x <= 0) {
        got[item] = (got[item] ?? 0) + 1;
        break;
      }
    }
  }
  for (const [item, n] of Object.entries(got)) run.inventory[item] = (run.inventory[item] ?? 0) + n;
  markHot(b, got);
  const cash = round10(r.int(c.cash[0], c.cash[1]));
  b.funds += cash;
  b.earned += cash;
  const names = Object.entries(got).map(([i, n]) => `${n > 1 ? `${n} ` : ''}${content?.items.get(i)?.name ?? i}`);
  if (cash) names.push(`₽${money(cash)}`);
  return names.join(', ') || 'nothing much';
}

function markHot(b: DominionBlock, got: Record<string, number>): void {
  const g = growthOf(b);
  for (const [item, n] of Object.entries(got)) g.hot[item] = (g.hot[item] ?? 0) + n;
}
addLootHook(markHot);

// ---------- the effects ----------

const crewPending = (b: DominionBlock) => (b.crew ??= freshCrewState()).pending;

addActEffect('crew', () => []);

addActEffect('buyOut', (b, x) => {
  const g = growthOf(b), d = bizOf(x.target)!;
  const forced = (g.cornered[d.target] ?? 0) >= G().buyOut.cornered;
  g.biz[d.target] = { day: b.day, forced };
  delete g.cornered[d.target];
  const ds = b.field.districts[x.district]!;
  ds.control = clamp(ds.control + 5);
  return [forced
    ? fill(Ln('bizForced'), { name: d.name, price: money(x.card!.money), heat: G().buyOut.forcedHeat, regard: -G().buyOut.forcedRegard })
    : fill(Ln('bizBought'), { name: d.name, price: money(x.card!.money), income: d.income, clean: d.clean ? ', clean' : '' })];
});

addActEffect('storm', (b, x) => [startChain(b, x, x.action === 'gauntlet' ? 'gauntlet' : 'raid', null)]);

addActEffect('gym', (b, x) => {
  const g = growthOf(b), gym = gymIn(x.district)!, opt = x.opt ?? 'beat';
  if (owns(b, gym.id)) {
    const st = g.gyms[gym.id]!;
    if (opt === 'raise') {
      st.defiance = Math.max(0, st.defiance - G().gym.raiseDrop);
      return [fill(Ln('raised'), { leader: gym.leader, n: G().gym.raiseDrop })];
    }
    const id = opt.startsWith('appoint:') ? opt.slice(8) : null;
    const m = id ? b.members.find((y) => y.id === id) : undefined;
    if (!m) return [];
    st.leader = m.id;
    return [fill(Ln('appointed'), { name: m.name, district: dname(gym.district) })];
  }
  switch (opt as GymWay) {
    case 'beat': return [startChain(b, x, 'beat', gym.id)];
    case 'break': return [startChain(b, x, 'break', gym.id)];
    case 'buy': return takeGym(b, gym.id, 'buy');
    case 'blackmail': return takeGym(b, gym.id, 'blackmail');
    case 'convert': {
      const lines = takeGym(b, gym.id, 'convert');
      // The Leader joins the crew's waiting list (they said yes); the World Turn makes them an Admin once they join.
      const st = (b.crew ??= freshCrewState());
      st.leads.push({
        id: `gym-${gym.id}`, name: gym.leader, cls: 'gym-leader', kind: 'route', look: `boss/${gym.leaderId}`, gender: 'm', role: null,
        stats: { brawn: 5, nerve: 6, wits: 5, charm: 6, stealth: 3 }, green: DOMINION_DATA.crew.greens[0]!.id, motive: DOMINION_DATA.crew.motives[0]!.id,
        hates: DOMINION_DATA.crew.recruit.pitches[0]!.id, chance: 100, foundBy: b.members[0]?.id ?? 'boss', day: b.day, notBefore: 0, bonus: 0, waiting: true, pitch: null,
      });
      lines.push(fill(Ln('converted'), { leader: gym.leader }));
      return lines;
    }
  }
  return [];
});

addActEffect('flyers', (b, x) => {
  const g = growthOf(b);
  if (!g.design && x.opt) g.design = x.opt;
  const again = !!g.flyers[x.district];
  g.flyers[x.district] = b.day;
  const out = [fill(Ln(again ? 'flyersAgain' : 'flyersUp'), { district: dname(x.district), cost: G().flyers.cost })];
  // A Broadcaster's flyers reach a second district: the next town on the list without any.
  const bc = traitHere(b, 'broadcaster');
  const next = bc ? F().districts.find((d) => d.id !== x.district && !g.flyers[d.id]) : undefined;
  if (bc && next) {
    g.flyers[next.id] = b.day;
    out.push(fill(Ln('broadcast'), { name: bc.name, district: next.name }));
  }
  return out;
});

addActEffect('bribe', (b, x) => {
  const g = growthOf(b);
  const o = G().bribe.find((y) => y.id === x.opt) ?? G().bribe[0]!;
  if (o.wanted) b.field.wanted = clamp(b.field.wanted + o.wanted);
  if (o.heat) addHeat(b, x.district, o.heat);
  if (o.days) {
    g.bribed[x.district] = b.day + o.days;
    if (b.field.patrol === x.district) b.field.patrol = null;
  }
  if (o.id === 'assistant') {
    const gym = gymIn(x.district);
    if (gym) g.gymScout[gym.id] = scouts(b, gym.id) + 1;
  }
  return [fill(Ln('bribed'), { who: o.name, text: o.text })];
});

addActEffect('fence', (b, x) => {
  const g = growthOf(b), run = x.run, content = x.content;
  if (!run) return [];
  const rate = Math.min(100, G().fence.rate[lvOf(b, x.action) - 1]! + hqFx(b).fence);
  let total = 0, count = 0;
  for (const [item, n] of Object.entries(g.hot)) {
    const have = Math.min(n, run.inventory[item] ?? 0);
    const price = content?.shop.find((s) => s.item === item)?.price ?? 200;
    if (have > 0) {
      run.inventory[item] = (run.inventory[item] ?? 0) - have;
      if (!run.inventory[item]) delete run.inventory[item];
      total += Math.round((price * have * rate) / 100);
      count += have;
    }
  }
  g.hot = {};
  b.funds += total;
  b.earned += total;
  return [count ? fill(Ln('fenced'), { n: money(total), items: `${count} item${count === 1 ? '' : 's'}`, pct: rate }) : Ln('noHot')];
});

addActEffect('smuggle', (b, x) => {
  const g = growthOf(b), lv = lvOf(b, x.action);
  if (!(x.big || lv >= 3)) return [];
  if (g.routes.some((r) => r.to === x.district)) return [];
  if (g.routes.length >= maxRoutes(b, lv)) return [Ln('routesFull')];
  const r = rng(x.run?.seed ?? '', 'dominion-route', b.day, x.district);
  const n = round10(r.int(G().smuggle.nightly[0], G().smuggle.nightly[1]));
  g.routes.push({ to: x.district, nightly: n, day: b.day });
  return [fill(Ln('route'), { district: dname(x.district), n })];
});

function stolenMon(b: DominionBlock, x: ActFx, species: string, line: string): string {
  const level = Math.max(2, Math.min(b.levelCap, (x.run?.party.reduce((a, m) => Math.max(a, m.level), 5) ?? 5) - 2));
  crewPending(b).push({ k: 'mon', species, level, src: 'stolen' });
  return fill(Ln(line), { mon: species.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) });
}
addActEffect('kidnap', (b, x) => {
  const t = targetDef(x.target)?.target;
  const r = rng(x.run?.seed ?? '', 'dominion-kidnap', b.day, x.target ?? x.district);
  const pool = t?.foe.species ?? ['rattata'];
  return [stolenMon(b, x, pool[r.int(0, pool.length - 1)]!, 'kidnapped')];
});
addActEffect('labHit', (b, x) => {
  if (!x.big && lvOf(b, x.action) < 3) return [];
  const r = rng(x.run?.seed ?? '', 'dominion-lab', b.day, x.target ?? x.district);
  const pool = G().lab.rare;
  return [stolenMon(b, x, pool[r.int(0, pool.length - 1)]!, 'labRare')];
});
addActEffect('swap', (b, x) => {
  const r = rng(x.run?.seed ?? '', 'dominion-swap', b.day);
  const pool = DOMINION_DATA.crew.pools[DOMINION_DATA.start.start.region.toLowerCase()]?.catch ?? ['rattata'];
  const sp = pool[r.int(0, pool.length - 1)]!;
  crewPending(b).push({ k: 'mon', species: sp, level: Math.max(5, b.levelCap - 10), src: 'stolen' });
  return [];
});

addActEffect('loan', (b, x) => {
  const L = G().loan, due = b.day + L.days;
  growthOf(b).loans.push({ due, back: L.back });
  void x;
  return [fill(Ln('loanOut'), { out: L.out, back: L.back, due })];
});

addActEffect('specialist', (b, x) => {
  const g = growthOf(b), s = G().specialists.find((y) => y.id === x.opt);
  if (!s || g.contacts.includes(s.id)) return [];
  g.contacts.push(s.id);
  return [fill(Ln('hired'), { name: s.name, wage: s.wage })];
});

addActEffect('forge', (b) => {
  const g = growthOf(b);
  // A Counterfeiter makes papers cheaper: two for the work of one.
  g.papers += traitHere(b, 'counterfeiter') ? 2 : 1;
  return [fill(Ln('forged'), { n: g.papers })];
});

addActEffect('dirt', (b, x) => {
  const g = growthOf(b), t = targetDef(x.target);
  const key = x.target ?? x.district;
  if (!g.dirt.includes(key)) g.dirt.push(key);
  const out = [fill(Ln('dirt'), { owner: t?.target.owner.name ?? dname(x.district) })];
  const gym = gymIn(x.district);
  if (gym && t?.target.kind === 'gym') {
    g.gymScout[gym.id] = scouts(b, gym.id) + 1;
    out.push(fill(Ln('dirtGym'), { leader: gym.leader }));
  }
  return out;
});

addActEffect('stall', (b) => {
  const g = growthOf(b);
  g.stall = Math.max(g.stall, G().stall.weekly);
  return [fill(Ln('stallUp'), { n: g.stall })];
});

addActEffect('safehouse', (b, x) => {
  growthOf(b).safehouses.push(x.district);
  return [fill(Ln('safehouse'), { district: dname(x.district), n: G().safehouse.cool })];
});

addActEffect('jam', (b, x) => {
  if (b.field.patrol === x.district) b.field.patrol = null;
  growthOf(b).bribed[x.district] = Math.max(growthOf(b).bribed[x.district] ?? 0, b.day + 1);
  return [fill(Ln('jam'), { district: dname(x.district) })];
});

addActEffect('dodge', (b) => {
  b.field.lookerWeek = weekOf(b.day);
  return [Ln('dodged')];
});

addActEffect('mercs', (b) => {
  const g = growthOf(b);
  g.mercs = b.day + G().mercs.days - 1;
  return [fill(Ln('mercs'), { day: g.mercs })];
});

addActEffect('gymPress', (b, x) => {
  const gym = gymIn(x.district);
  if (!gym) return [];
  const day = b.day + G().gym.shakenDays;
  growthOf(b).shaken[gym.id] = day;
  return [fill(Ln('shaken'), { leader: gym.leader, day, n: G().gym.shakenLevels })];
});
addActEffect('gymCourt', (b, x) => {
  const g = growthOf(b), gym = gymIn(x.district);
  if (!gym) return [];
  if (!g.courted.includes(gym.id)) g.courted.push(gym.id);
  const st = g.gyms[gym.id];
  if (st) st.defiance = Math.max(0, st.defiance - G().gym.courtDrop);
  return [fill(Ln('courted'), { leader: gym.leader, n: st ? G().gym.courtDrop : 0 })];
});
addActEffect('gymRig', (b, x) => {
  const g = growthOf(b), gym = gymIn(x.district);
  if (!gym) return [];
  if (!g.badges.includes(gym.id)) g.badges.push(gym.id);
  addHeat(b, x.district, G().gym.rigHeat);
  return [fill(Ln('rigged'), { badge: gym.badge })];
});

addActEffect('bigNight', (b) => {
  growthOf(b).bigNight = weekOf(b.day);
  b.nightActions += 3;
  return [Ln('bigNight')];
});

// After any success: the list's own numbers, Extort cornering a shop, and scouting a Gym's town.
addActAfter((b, x, play) => {
  const out: string[] = [];
  if (play.morale) for (const m of b.members) addMorale(m, play.morale);
  if (play.loyalty) for (const m of b.members) addLoyalty(b, m, play.loyalty);
  if (play.friendship && play.effect !== 'pamper' && x.run) for (const m of x.run.party) m.friendship = Math.min(255, m.friendship + play.friendship);
  const def = DOMINION_DATA.actions.actions.find((a) => a.id === x.action);
  if (play.edge && def?.stat && def.stat !== 'all') {
    const l = edgeXp(b.field, def.stat, play.edge);
    if (l) out.push(l);
  }
  if (play.tension) {
    const team = teamsHere()[0];
    if (team) addTension(b, team.id, play.tension);
  }
  if (x.action === 'extort' && x.target && bizOf(x.target)) {
    const g = growthOf(b);
    g.cornered[x.target] = (g.cornered[x.target] ?? 0) + 1;
    if (g.cornered[x.target] === G().buyOut.cornered) out.push(fill(Ln('cornered'), { owner: targetDef(x.target)?.target.owner.name ?? 'The owner' }));
  }
  if (play.effect === 'scout' || play.effect === 'count' || play.effect === 'scoutDistrict') {
    const gym = gymIn(x.district);
    if (gym && !owns(b, gym.id)) growthOf(b).gymScout[gym.id] = scouts(b, gym.id) + 1;
  }
  return out;
});

// ---------- the World Turn ----------

addWorldStep('world', (b, seed) => {
  if (!b.growth) return [];
  const g = b.growth, lines: string[] = [];
  const day = b.day;
  // Every night: smuggling routes pay (a hot district may see one seized), safehouses cool, loans fall due, the medic.
  let routePay = 0;
  for (const r of [...g.routes]) {
    const ds = b.field.districts[r.to];
    if (ds && ds.heat >= G().smuggle.seizeHeat && rng(seed, 'dominion-route', day, r.to).int(1, 100) <= G().smuggle.seizePct) {
      // A Burrower saves one route a week.
      const bur = traitHere(b, 'burrower');
      if (bur && g.burrowed !== weekOf(day)) {
        g.burrowed = weekOf(day);
        lines.push(fill(Ln('burrowed'), { name: bur.name, district: dname(r.to) }));
        routePay += r.nightly;
        continue;
      }
      g.routes = g.routes.filter((y) => y !== r);
      lines.push(fill(Ln('seized'), { district: dname(r.to) }));
      continue;
    }
    routePay += r.nightly;
  }
  if (routePay) {
    b.funds += routePay;
    b.earned += routePay;
    lines.push(fill(Ln('routePay'), { n: money(routePay) }));
  }
  for (const d of g.safehouses) if (b.field.districts[d]) addHeat(b, d, -G().safehouse.cool);
  for (const loan of g.loans.filter((l) => l.due <= day)) {
    if (rng(seed, 'dominion-loan', day, loan.due).int(1, 100) <= G().loan.defaultPct) lines.push(fill(Ln('loanGone'), { n: G().loan.out }));
    else {
      b.funds += loan.back;
      b.earned += loan.back;
      lines.push(fill(Ln('loanBack'), { n: loan.back }));
    }
  }
  g.loans = g.loans.filter((l) => l.due > day);
  if (g.contacts.includes('medic')) {
    const hurt = b.members.find((m) => crewOf(m).out?.why === 'hurt' && crewOf(m).out!.days > 1);
    if (hurt) {
      hurt.crew = { ...crewOf(hurt), out: { ...crewOf(hurt).out!, days: crewOf(hurt).out!.days - 1 } };
      lines.push(fill(Ln('medic'), { name: hurt.name }));
    }
  }
  // Bribed officers: no patrol in that district while the bribe lasts.
  for (const [d, until] of Object.entries(g.bribed)) {
    if (until < day) delete g.bribed[d];
    else if (b.field.patrol === d) b.field.patrol = null;
  }
  // A converted Leader who joined the crew is an Admin.
  for (const m of b.members) if (crewOf(m).cls === 'gym-leader' && m.rank !== 'admin' && bandOf(m) < 4) m.rank = 'admin';
  // An appointed Leader who left is no longer the Gym's.
  for (const st of Object.values(g.gyms)) if (st.leader && !b.members.some((m) => m.id === st.leader)) st.leader = null;
  if (!weekly(b)) return lines;
  // ---- weekly ----
  let bizPay = 0, bizClean = 0;
  for (const [id] of Object.entries(g.biz)) {
    const d = bizOf(id);
    const t = targetDef(id);
    if (!d || !t) continue;
    const ds = b.field.districts[t.district.id]!;
    if (d.clean) bizClean += d.income;
    else bizPay += d.income;
    switch (d.perk.kind) {
      case 'items': if (d.perk.item) crewPending(b).push({ k: 'item', id: d.perk.item, n: d.perk.n }); break;
      case 'regard': ds.regard += d.perk.n; break;
      case 'heatDown': addHeat(b, t.district.id, -d.perk.n); break;
      case 'heroDown': b.field.hero = Math.max(0, b.field.hero - d.perk.n); break;
      case 'income': bizClean += d.perk.n; break;
      case 'clean': {
        const n = Math.min(d.perk.n, Math.max(0, b.funds - cleanOf(b)));
        if (n > 0) {
          b.funds -= n;
          addClean(b, n);
        }
        break;
      }
    }
  }
  if (bizPay) {
    b.funds += bizPay;
    b.earned += bizPay;
  }
  if (bizClean) {
    addClean(b, bizClean);
    b.earned += bizClean;
  }
  if (bizPay + bizClean) lines.push(fill(Ln('bizWeek'), { n: money(bizPay + bizClean) }));
  if (g.stall) {
    b.funds += g.stall;
    b.earned += g.stall;
    lines.push(fill(Ln('stallWeek'), { n: g.stall }));
  }
  // Flyers: torn down at Wanted 40+, else they cost ₽100 a district and bring walk-ins.
  const up = Object.keys(g.flyers);
  if (up.length) {
    const w = wanted(b.field);
    if (w >= G().flyers.tornAt) {
      g.flyers = {};
      lines.push(fill(Ln('flyersTorn'), { n: w }));
    } else {
      const cost = up.length * G().flyers.cost;
      if (b.funds < cost) {
        g.flyers = {};
        lines.push(Ln('flyersBroke'));
      } else {
        spend(b, cost);
        lines.push(fill(Ln('flyersWeek'), { n: cost }));
        const des = G().flyers.designs.find((d) => d.id === g.design);
        let walked = 0;
        for (const d of up) {
          const ds = b.field.districts[d];
          if (des?.does === 'regard' && ds) ds.regard += des.n;
          // An Orator's flyers raise Regard too (+1 a week each district, Pride's +1 made +2).
          if (ds && traitHere(b, 'orator')) ds.regard += 1;
          if (des?.does === 'dread' && ds) ds.dread += des.n;
          const chance = G().flyers.walkIn + peakOf(b) * G().flyers.perStep + (des?.does === 'walkIn' ? des.n : 0) + hqFx(b).flyerPct;
          const finder = b.members[0];
          if (!finder || walked >= G().flyers.maxWalkIns) continue;
          if (rng(seed, 'dominion-flyers', day, d).int(1, 100) > chance) continue;
          const lead = makeLead(b, finder, `${seed}::flyers::${d}`);
          if (!lead) continue;
          lead.id = `F${day}-${d}`;
          walked += 1;
          lines.push(fill(Ln('walkIn'), { name: lead.name, cls: lead.cls }));
        }
      }
    }
  }
  // Gyms: Defiance (A10) for Leaders you Bought or Blackmailed.
  for (const [id, st] of Object.entries(g.gyms)) {
    const gym = gymDef(id);
    if (!gym || (st.way !== 'buy' && st.way !== 'blackmail')) continue;
    const ds = b.field.districts[gym.district]!;
    if (ds.dread > ds.regard) st.defiance = Math.min(G().gym.defiance.max, st.defiance + 1);
    const D = G().gym.defiance;
    if (st.defiance >= D.tell && !st.told) {
      st.told = true;
      addHeat(b, gym.district, D.heat);
      b.field.hero += D.hero;
      lines.push(fill(Ln('told'), { leader: gym.leader, heat: D.heat, hero: D.hero }));
    }
    if (st.defiance >= D.max && !b.field.fight) {
      queue(b, { kind: 'defiant', action: 'gym-takeover', target: null, district: gym.district, gym: id, step: 0, sides: [{ name: gym.leader, cls: 'gym-leader', leaderId: gym.leaderId, species: gym.species, offset: gym.offset }], big: false });
      lines.push(fill(Ln('breaks'), { leader: gym.leader }));
    }
  }
  // Specialists' wages, the chef, the forger's paper; interest on idle money (Treasury Hall, Investment Office).
  const wages = G().specialists.filter((s) => g.contacts.includes(s.id)).reduce((a, s) => a + s.wage, 0);
  if (wages) {
    spend(b, Math.min(wages, Math.max(0, b.funds)));
    lines.push(fill(Ln('specWage'), { n: wages }));
  }
  if (g.contacts.includes('chef')) {
    for (const m of b.members) addMorale(m, 2);
    lines.push(Ln('chef'));
  }
  const papers = (g.contacts.includes('forger') ? 1 : 0) + hqFx(b).papers;
  if (papers) g.papers += papers;
  const pct = hqFx(b).interest;
  if (pct && b.funds > 0) {
    const n = Math.min(1000, Math.round((b.funds * pct) / 100));
    if (n) {
      b.funds += n;
      b.earned += n;
      lines.push(fill(Ln('interest'), { n }));
    }
  }
  return lines;
});

// ---------- the crew's tasks (team-actions 151-600 and the D10 rows of 1-150) ----------

const R = () => DOMINION_DATA.crew;
const taskPay = (ctx: TaskCtx, k = 1): number => {
  const f = ctx.task.effect?.funds ?? [40, 160];
  return Math.round((f[0] + ((f[1] - f[0]) * (ctx.stat - 1)) / 9) * (1 + ctx.yieldPct / 100) * k);
};
function taskFail(b: DominionBlock, m: Member, ctx: TaskCtx): void {
  const e = ctx.task.effect;
  if (e?.risky) {
    const c = crewOf(m);
    m.crew = { ...c, pHeat: clamp(c.pHeat + (e.caughtHeat ?? 3)) };
    b.heat = clamp(b.heat + (e.caughtHeat ?? 3));
  }
  ctx.say('crew', fill(R().report.fail!, { name: m.name, task: ctx.label }));
}

addTaskKind('haul', (b, m, ok, ctx) => {
  if (!ok) return taskFail(b, m, ctx);
  const routes = b.growth?.routes.length ?? 0;
  // A Mule carries half as much again.
  const n = taskPay(ctx, (1 + routes * 0.25) * (crewOf(m).formed.includes('mule') ? 1.5 : 1));
  b.funds += n;
  b.earned += n;
  if (ctx.task.effect?.heat) b.heat = clamp(b.heat + ctx.task.effect.heat);
  ctx.say('money', fill(Ln('hauled'), { name: m.name, n }));
});
addTaskKind('front', (b, m, ok, ctx) => {
  if (!ok) return taskFail(b, m, ctx);
  // A front pays more with businesses to run (Part 3 §5.1): +10% a business.
  const n = taskPay(ctx, 1 + Object.keys(b.growth?.biz ?? {}).length * 0.1);
  addClean(b, n);
  b.earned += n;
  ctx.say('money', fill(Ln('fronted'), { name: m.name, n }));
});
addTaskKind('fence', (b, m, ok, ctx) => {
  if (!ok) return taskFail(b, m, ctx);
  const g = growthOf(b);
  const items = Object.values(g.hot).reduce((a, x) => a + x, 0);
  // The crew can't touch the Boss's Bag, so they fence what the crew lifted: a share of the day's loot as cash.
  const n = taskPay(ctx, items ? 1.5 : 1);
  b.funds += n;
  b.earned += n;
  ctx.say('money', fill(Ln('fencedTask'), { name: m.name, n }));
});
addTaskKind('flyers', (b, m, ok, ctx) => {
  if (!ok) return taskFail(b, m, ctx);
  const d = crewOf(m).where ?? DOMINION_DATA.field.hq;
  growthOf(b).flyers[d] = b.day;
  ctx.say('crew', fill(Ln('flyersTask'), { name: m.name, district: dname(d) }));
});
addTaskKind('revive', (b, m, ok, ctx) => {
  if (!ok) return taskFail(b, m, ctx);
  const pool = G().revive.species;
  const sp = pool[ctx.r.int(0, pool.length - 1)]!;
  const level = ctx.r.int(G().revive.level[0], G().revive.level[1]);
  crewPending(b).push({ k: 'mon', species: sp, level: Math.min(level, b.levelCap), by: m.id, src: 'rescued' });
  ctx.say('crew', fill(Ln('revived'), { name: m.name, mon: sp.replace(/\b\w/g, (c) => c.toUpperCase()) }));
});
addTaskKind('stock', (b, m, ok, ctx) => {
  if (!ok) return taskFail(b, m, ctx);
  const n = ctx.lv >= 3 ? 2 : 1;
  crewPending(b).push({ k: 'item', id: 'potion', n });
  ctx.say('crew', fill(Ln('stocked'), { name: m.name, n }));
});
