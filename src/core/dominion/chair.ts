// DOMINION slice D12: the Chair (lists/end-of-day-court.md, cards in lists/dilemmas.md). Every Evening from Day 2,
// before the Night, people come in one by one and each wants one thing; the Boss answers with one of two buttons (or
// hands one card a night to a crew member). Answers move the numbers the team already has (money, Heat, Regard, Dread,
// Morale, Loyalty); numbers later slices build (Tension D9, Hero Threat D11...) are kept in `chair.owed` for them.
// Everything is drawn and rolled on the stream `dominion-court`, so the Chair never moves another roll. Pure.
// Doesn't import empire.ts: fightEnd.ts (imported by run.ts) imports this file.

import { DOMINION_DATA } from './data';
import { addLoyalty, addMorale, crewOf, freshCrewState, leave, rankN, rng, traitNow } from './crew';
import { addHeat, scoutHome, syncHeat } from './field';
import { book, empireOf } from './book';
import type { ChairState, CourtCard, CourtFx, Crisis, DominionBlock, Lead, Lean, Member, TallyRow } from './schema';
import { addWorldStep, fill } from './worldTurn';

const R = () => DOMINION_DATA.courtRules;
const F = () => DOMINION_DATA.field;
const L = () => R().lines as Record<string, string>;
const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, n));
type Roll = ReturnType<typeof rng>;

export const cardById = (id: number): CourtCard | undefined => DOMINION_DATA.court[id - 1];

export const freshChair = (): ChairState => ({
  day: 0, open: false, docket: [], at: 0, result: null, handed: false, tally: [], seen: {}, follow: [], due: [], regulars: {}, tags: {},
  deals: [], owed: {}, fame: 0, cool: 0, locks: {}, stake: null, give: [], log: [], week: [0, 0, 0, 0],
  opts: { length: 'normal', numbers: 'arrows', speed: 'normal' },
});

/** The block's Chair, made the same way every time for a save from before D12. */
export function chairOf(b: DominionBlock): ChairState {
  return (b.chair ??= freshChair());
}

/** HQ tier 0 (Warehouse) to 5 (Citadel). */
export const tierOf = (b: DominionBlock): number => clamp(b.hqLevel - 1, 0, 5);
/** Card money is written at Warehouse scale. */
export const scale = (b: DominionBlock, n: number): number => n * R().tierPay[tierOf(b)]!;

/** A card is "live" when nothing in it waits for a later slice; "limited" when part of it does; else "disabled". */
export function cardStatus(c: CourtCard): 'supported' | 'limited' | 'disabled' {
  if (c.wait) return 'disabled';
  const part = (fx: CourtFx[]): boolean => fx.some((e) => e.k === 'note' || e.k === 'owed' || (e.k === 'deal' && e.ten !== undefined)
    || (e.k === 'chance' && (part(e.yes) || part(e.no))) || (e.k === 'later' && part(e.fx)) || (e.k === 'fight' && (part(e.win) || part(e.lose))));
  return part(c.a.fx) || part(c.b.fx) ? 'limited' : 'supported';
}

// ---------- who's who ----------

const free = (m: Member): boolean => !crewOf(m).out;
const memberById = (b: DominionBlock, id: string | null): Member | undefined => (id ? b.members.find((m) => m.id === id) : undefined);

/** The member(s) a card names, or null when nobody fits (the card isn't drawn). */
function named(b: DominionBlock, c: CourtCard, r: Roll): [string | null, string | null] | null {
  if (!c.named) return [null, null];
  const pick = (list: Member[]): Member | undefined => list[r.int(0, list.length - 1)];
  const ms = b.members;
  const by = (f: (m: Member) => boolean) => ms.filter(f);
  switch (c.named) {
    case 'any': { const m = pick(by(free)); return m ? [m.id, null] : null; }
    case 'first': return ms[0] ? [ms[0].id, null] : null;
    case 'jailed': { const m = pick(by((x) => crewOf(x).out?.why === 'jail')); return m ? [m.id, null] : null; }
    case 'hurt': { const m = pick(by((x) => crewOf(x).out?.why === 'hurt')); return m ? [m.id, null] : null; }
    case 'admin': { const m = pick(by((x) => free(x) && rankN(x.rank) >= rankN('admin'))); return m ? [m.id, null] : null; }
    case 'sergeant': { const m = pick(by((x) => free(x) && rankN(x.rank) >= rankN('sergeant'))); return m ? [m.id, null] : null; }
    case 'best': { const m = [...by(free)].sort((x, y) => y.level - x.level || x.id.localeCompare(y.id))[0]; return m ? [m.id, null] : null; }
    case 'lowLoy': { const m = [...ms].sort((x, y) => x.loyalty - y.loyalty || x.id.localeCompare(y.id))[0]; return m ? [m.id, null] : null; }
    case 'two':
    case 'admins': {
      const list = by((x) => free(x) && (c.named === 'two' || rankN(x.rank) >= rankN('admin')));
      if (list.length < 2) return null;
      const i = r.int(0, list.length - 1);
      const rest = list.filter((_, k) => k !== i);
      const a = list[i]!, z = rest[r.int(0, rest.length - 1)]!;
      // Two Admins: the first named is the more loyal one ("Pick the loyal one" lifts them).
      return c.named === 'admins' && z.loyalty > a.loyalty ? [z.id, a.id] : [a.id, z.id];
    }
    default: {
      // name:X (a Regular who joined): they may not be on the crew, and the card still comes.
      const want = c.named.slice(5);
      return [ms.find((m) => m.name === want)?.id ?? null, null];
    }
  }
}

const he = (m: Member | undefined) => (m?.gender === 'f' ? { He: 'She', he: 'she', him: 'her', his: 'her', boy: 'girl' } : { He: 'He', he: 'he', him: 'him', his: 'his', boy: 'boy' });
/** A card's text with the named member filled in. */
export function cardText(b: DominionBlock, t: string, memberId: string | null): string {
  const m = memberById(b, memberId);
  return fill(t, { name: m?.name ?? 'your member', ...he(m), rival: F().rivalTeam });
}

// ---------- red zones ----------

const HQ = () => F().hq;
const morale = (b: DominionBlock): number => (b.members.length ? b.members.reduce((a, m) => a + m.morale, 0) / b.members.length : 100);

/** The red zones the team is in now, in the Crisis order (the Hero's is D11's: Threat is only kept until then). */
export function redZones(b: DominionBlock): Crisis[] {
  const z = R().red, d = b.field.districts[HQ()]!;
  const on: Record<Crisis, boolean> = {
    money: b.funds < 0,
    heat: d.heat >= z.heat,
    morale: b.members.length > 0 && morale(b) < z.morale,
    regard: d.regard < z.regard && d.dread >= z.regardDread,
    loyalty: b.members.some((m) => m.loyalty < z.loyalty),
    threat: false,
  };
  return R().crisisOrder.filter((k) => on[k]);
}

// ---------- the Docket ----------

/** Visitors tonight: by HQ tier, +1 on Open House (every 7th evening), -1 when the Boss is Exhausted, then the setting. */
export function visitorsTonight(b: DominionBlock): number {
  const ch = chairOf(b);
  let n = R().visitors[tierOf(b)]! + (b.day % R().openHouseEvery === 0 ? 1 : 0) - (b.noRest >= DOMINION_DATA.start.clock.exhaustedAfter ? 1 : 0);
  if (ch.opts.length === 'off') return 0;
  if (ch.opts.length === 'short') n -= 1;
  if (ch.opts.length === 'long') n += 1;
  return Math.max(1, n);
}

const hasNeeds = (b: DominionBlock, c: CourtCard): boolean => {
  const stores = b.crew?.stores.length ?? 0;
  if (c.needs === 'racket') return b.field.rackets.length > 0;
  if (c.needs === 'stores') return stores >= 1;
  if (c.needs === 'stores2') return stores >= 2;
  if (c.sect === 'crisis' || c.crisis) return true;
  if (c.a.fx.concat(c.b.fx).some((e) => e.k === 'fight' || (e.k === 'chance' && e.yes.some((x) => x.k === 'fight')))) return !b.field.fight;
  return true;
};

/** Whether the card may be drawn tonight (live, tier, region, cooldown, once, needs). */
export function canDraw(b: DominionBlock, c: CourtCard): boolean {
  const ch = chairOf(b), t = tierOf(b), seen = ch.seen[c.id];
  if (c.wait || c.crisis || c.regular || c.followOnly || c.first) return false;
  if (t < c.tier[0] || t > c.tier[1]) return false;
  if (c.region && c.region !== F().region) return false;
  if (seen !== undefined && (c.once || c.oncePerRegion || b.day - seen < R().cooldown)) return false;
  return hasNeeds(b, c);
}

/** Opens tonight's sitting: Crisis first, then follow-ups due, a Regular's next step, then the draw. */
export function openSitting(block: DominionBlock, seed: string): DominionBlock {
  const b = structuredClone(block);
  const ch = chairOf(b);
  const r = rng(seed, 'dominion-court', b.day, 'docket');
  const docket: ChairState['docket'] = [];
  const push = (c: CourtCard, who: [string | null, string | null] | null): boolean => {
    if (!who || docket.some((d) => d.card === c.id)) return false;
    docket.push({ card: c.id, member: who[0], second: who[1] });
    return true;
  };
  // 1. One Crisis card at most, for the first red zone (Kice: a red zone never ends the run).
  const crisis = redZones(b).map((k) => DOMINION_DATA.court.find((c) => c.crisis === k && !c.wait)).find((c) => !!c);
  if (crisis) push(crisis, named(b, crisis, r));
  const first = ch.day === 0;
  if (first) {
    // The Regulars are picked on the first sitting (all four chains), with their first visits spread out.
    for (const c of DOMINION_DATA.court.filter((x) => x.regular && x.step === 1)) ch.regulars[String(c.regular)] = { step: 1, day: b.day + r.int(R().regulars.first[0], R().regulars.first[1]) };
  }
  const want = visitorsTonight(b);
  if (first) {
    // The first sitting has one scripted visitor: the first member's mum (card 1), so the player learns the Chair.
    const c = DOMINION_DATA.court.find((x) => x.first && !ch.seen[x.id]);
    if (c && want > 0) push(c, named(b, c, r));
  } else if (want > 0) {
    // 2. Follow-ups due today (the rest wait for the next sitting).
    for (const f of [...ch.follow].sort((x, y) => x.day - y.day || x.card - y.card)) {
      if (f.day > b.day || docket.length >= want + (crisis ? 1 : 0)) continue;
      const c = cardById(f.card);
      ch.follow = ch.follow.filter((x) => x !== f);
      if (!c || c.wait) continue;
      const who = f.member && memberById(b, f.member) ? [f.member, null] as [string, null] : named(b, c, r);
      push(c, who);
    }
    // 3. One Regular's next step, if one is due (Open House always lets one in).
    const due = Object.entries(ch.regulars).filter(([, s]) => s.step <= 3 && s.day <= b.day).sort((x, y) => x[1].day - y[1].day || Number(x[0]) - Number(y[0]))[0];
    if (due && (docket.length < want + (crisis ? 1 : 0) || b.day % R().openHouseEvery === 0)) {
      const c = DOMINION_DATA.court.find((x) => x.regular === Number(due[0]) && x.step === due[1].step);
      if (c && !c.wait && push(c, named(b, c, r))) due[1].step += 1;
    }
    // 4. The draw, weighted (region cards weigh more); no two crew cards in a row, two cards at most about the rival.
    let guard = 0;
    while (docket.length < want + (crisis ? 1 : 0) && guard++ < 40) {
      const last = cardById(docket.at(-1)?.card ?? 0);
      const rivals = docket.filter((d) => cardById(d.card)?.rival).length;
      const pool = DOMINION_DATA.court.filter((c) => canDraw(b, c) && !docket.some((d) => d.card === c.id)
        && !(c.sect === 'crew' && last?.sect === 'crew') && !(c.rival && rivals >= R().maxSameRival));
      if (!pool.length) break;
      const w = pool.map((c) => (c.region === F().region ? R().weights.region : R().weights.base));
      let roll = r.int(1, w.reduce((a, x) => a + x, 0));
      const c = pool.find((_, i) => (roll -= w[i]!) <= 0)!;
      push(c, named(b, c, r));
    }
  }
  ch.open = docket.length > 0;
  ch.day = b.day;
  ch.docket = docket;
  ch.at = 0;
  ch.result = null;
  ch.handed = false;
  ch.tally = [];
  return b;
}

/** The Evening's last step: the Chair sits tonight (from Day 2, once a day). */
export const chairDue = (b: DominionBlock): boolean => b.phase === 'evening' && b.day >= R().firstDay && chairOf(b).day !== b.day;
/** The visitor at the door, or null (the Tally, or no sitting). */
export function atDoor(b: DominionBlock): { card: CourtCard; member: string | null; second: string | null } | null {
  const ch = b.chair;
  if (!ch?.open) return null;
  const d = ch.docket[ch.at];
  const c = d ? cardById(d.card) : undefined;
  return d && c ? { card: c, member: d.member, second: d.second } : null;
}
export const inTally = (b: DominionBlock): boolean => !!b.chair?.open && b.chair.at >= b.chair.docket.length;

// ---------- the whisper and Hand it off ----------

/** What an answer does to one number (Warehouse money scaled), for the whisper and the hand-off. */
export function weigh(b: DominionBlock, fx: CourtFx[]): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (k: string, n: number): void => void (out[k] = (out[k] ?? 0) + n);
  for (const e of fx) {
    if (e.k === 'funds') add('money', scale(b, e.n) * (e.each ? Math.max(1, b.members.length) : 1));
    else if (e.k === 'deal') add('money', scale(b, e.n) * 4);
    else if (e.k === 'racket') add('money', Math.round(e.share * 100));
    else if (e.k === 'heat' || e.k === 'wanted' || e.k === 'heatAll') add('heat', e.n);
    else if (e.k === 'cool') add('heat', -e.n * 7);
    else if (e.k === 'regard' || e.k === 'dread' || e.k === 'morale') add(e.k, e.n);
    else if (e.k === 'loyalty') add('self', e.n);
    else if (e.k === 'tag') add('regard', e.tag === 'favour' ? 2 : -2);
    else if (e.k === 'chance') for (const [k, n] of Object.entries(weigh(b, e.yes))) add(k, Math.round((n * e.p) / 100));
    else if (e.k === 'later') for (const [k, n] of Object.entries(weigh(b, e.fx))) add(k, n);
  }
  return out;
}

/** The Right Hand: the free member with the highest Loyalty (they stand beside the Chair). */
export function rightHand(b: DominionBlock): Member | null {
  return [...b.members].filter(free).sort((x, y) => y.loyalty - x.loyalty || x.id.localeCompare(y.id))[0] ?? null;
}

/** The team's weakest number now: what an honest Right Hand fixes first. */
function weakest(b: DominionBlock): 'money' | 'heat' | 'regard' | 'dread' | 'morale' {
  const d = b.field.districts[HQ()]!;
  const score: [ReturnType<typeof weakest>, number][] = [
    ['money', clamp(Math.round((b.funds / scale(b, 1000)) * 100))], ['heat', 100 - d.heat], ['regard', clamp(d.regard * 3)], ['dread', clamp(d.dread * 3)], ['morale', morale(b)],
  ];
  return score.sort((x, y) => x[1] - y[1])[0]![0];
}

/** The answer (0 or 1) that gives the most of a number (heat: the least Heat). Ties go to the first. */
function best(b: DominionBlock, c: CourtCard, k: string): 0 | 1 {
  const a = weigh(b, c.a.fx)[k] ?? 0, z = weigh(b, c.b.fx)[k] ?? 0;
  return (k === 'heat' ? z < a : z > a) ? 1 : 0;
}

/** The whisper (end-of-day-court.md §5.2): honest at Loyalty 50+, honest about money at 20-49, selfish below. */
export function whisper(b: DominionBlock, c: CourtCard, member: string | null): { who: Member; text: string; pick: 0 | 1 | null } | null {
  const m = rightHand(b);
  if (!m || c.crisis) return null;
  const r = rng(String(b.day), 'dominion-court', 'whisper', c.id);
  const W = R().whisper;
  const say = (list: string[], pick: 0 | 1 | null) => ({ who: m, pick, text: fill(list[r.int(0, list.length - 1)]!, { label: pick === null ? '' : (pick ? c.b : c.a).label }) });
  if (m.id === member && m.loyalty >= R().whisperMoney) return say(W.neutral, null);
  if (m.loyalty >= R().whisperHonest) return say(W.honest, best(b, c, weakest(b)));
  if (m.loyalty >= R().whisperMoney) {
    const a = weigh(b, c.a.fx).money ?? 0, z = weigh(b, c.b.fx).money ?? 0;
    return a === z ? say(W.neutral, null) : say(W.money, z > a ? 1 : 0);
  }
  return say(W.selfish, best(b, c, 'self'));
}

/** A member's lean (their latest trait): what they pick when a card is handed to them. */
export const leanOf = (m: Member): Lean | 'none' => R().leans[traitNow(m)] ?? 'none';

/** Who may take a handed card: Grunt rank or higher, free, and not named on it. */
export function handOffCrew(b: DominionBlock, c: CourtCard, d: { member: string | null; second: string | null }): Member[] {
  if (c.crisis) return [];
  return b.members.filter((m) => free(m) && rankN(m.rank) >= R().handOffRank && m.id !== d.member && m.id !== d.second);
}

/** What a member would pick (0 / 1), by their lean; no lean: a coin on the court stream. */
export function wouldPick(b: DominionBlock, c: CourtCard, m: Member, r: Roll | null): 0 | 1 {
  const lean = leanOf(m);
  if (lean === 'none') return r ? (r.int(0, 1) as 0 | 1) : 0;
  return best(b, c, lean === 'money' ? 'money' : lean);
}

// ---------- answering ----------

interface Ctx { b: DominionBlock; pick: 0 | 1; card: CourtCard; member: string | null; second: string | null; r: Roll; changes: Record<string, number>; lines: string[]; tag: 'favour' | 'grudge' | null; back: boolean }

const bump = (x: Ctx, k: string, n: number): void => {
  if (n) x.changes[k] = (x.changes[k] ?? 0) + n;
};

function money(x: Ctx, n: number, clean: boolean): void {
  const b = x.b;
  b.funds += n;
  if (n > 0) b.earned += n;
  book(b, clean ? 'chairClean' : 'chair', n);
  if (n < 0 && clean) empireOf(b).clean = Math.max(0, empireOf(b).clean + n);
  bump(x, 'funds', n);
}

const pickMon = (b: DominionBlock, r: Roll): string => R().stray[r.int(0, R().stray.length - 1)]!;

function joinLead(x: Ctx, e: Extract<CourtFx, { k: 'join' }>): void {
  const b = x.b, st = (b.crew ??= freshCrewState()), r = x.r;
  const look = e.look ?? x.card.look;
  const [lo, hi] = R().joinStats;
  const stat = () => r.int(lo, hi);
  const greens = DOMINION_DATA.crew.greens;
  const used = new Set([...b.members.map((m) => m.name), ...st.leads.map((l) => l.name)]);
  const gender = /_f\b|_f$|female/.test(look) ? 'f' : 'm';
  const names = DOMINION_DATA.crew.recruit.names[gender].filter((n) => !used.has(n));
  const name = e.name && e.name !== 'brother' ? e.name : names[r.int(0, Math.max(0, names.length - 1))] ?? `Visitor ${x.card.id}`;
  const lead: Lead = {
    id: `C${b.day}-${x.card.id}`, name, cls: x.card.role ?? x.card.visitor, kind: 'townsfolk', look: look.startsWith('trainer/') ? look : 'trainer/pr/rocket_grunt_m', gender, role: null,
    stats: { brawn: stat(), nerve: stat(), wits: stat(), charm: stat(), stealth: stat() }, green: e.green ?? greens[r.int(0, greens.length - 1)]!.id,
    motive: DOMINION_DATA.crew.motives[0]!.id, hates: DOMINION_DATA.crew.recruit.pitches.at(-1)!.id, chance: 100, foundBy: 'chair', day: b.day, notBefore: 0, bonus: 0, waiting: true, pitch: null,
  };
  if (st.leads.some((l) => l.id === lead.id)) return;
  st.leads.push(lead);
  x.lines.push(fill(L().joined!, { name }));
  bump(x, 'join', 1);
}

/** Applies an answer's effects. Members named on the card are looked up again (they may have left since). */
function apply(x: Ctx, fx: CourtFx[]): void {
  const b = x.b, ch = chairOf(b), hq = HQ(), d = b.field.districts[hq]!;
  const who = (w: 'named' | 'second' | 'all'): Member[] => (w === 'all' ? b.members : [memberById(b, w === 'named' ? x.member : x.second)].filter((m): m is Member => !!m));
  for (const e of fx) {
    switch (e.k) {
      case 'funds': money(x, scale(b, e.n) * (e.each ? Math.max(1, b.members.length) : 1), !!e.clean); break;
      case 'zero': if (b.funds < 0) money(x, -b.funds, false); break;
      case 'racket': {
        const top = [...b.field.rackets].sort((p, q) => q.weekly - p.weekly)[0];
        if (top) money(x, Math.round(top.weekly * e.share), false);
        break;
      }
      case 'heat': addHeat(b, hq, e.n); syncHeat(b); bump(x, 'heat', e.n); break;
      case 'heatAll': for (const id of Object.keys(b.field.districts)) addHeat(b, id, e.n); syncHeat(b); bump(x, 'heat', e.n); break;
      case 'wanted': b.field.wanted = clamp(b.field.wanted + e.n); syncHeat(b); bump(x, 'wanted', e.n); break;
      case 'regard': d.regard = clamp(d.regard + e.n); bump(x, 'regard', e.n); break;
      case 'dread': d.dread = clamp(d.dread + e.n); bump(x, 'dread', e.n); break;
      case 'morale': for (const m of b.members) addMorale(m, e.n); bump(x, 'morale', e.n); break;
      case 'fame': ch.fame = Math.max(0, ch.fame + e.n); bump(x, 'fame', e.n); break;
      case 'cool': ch.cool += e.n; bump(x, 'cool', e.n); break;
      case 'loyalty': for (const m of who(e.who)) { addLoyalty(b, m, e.n); bump(x, `loy:${m.id}`, e.n); } break;
      case 'xp': for (const m of who(e.who)) crewOf(m).xp += e.n; break;
      case 'wage': for (const m of who('named')) { m.wage += scale(b, e.n); bump(x, 'wage', scale(b, e.n)); } break;
      case 'happy': for (const m of b.members) for (const p of m.team) (p as { friendship?: number }).friendship = Math.min(255, ((p as { friendship?: number }).friendship ?? 70) + e.n); bump(x, 'happy', e.n); break;
      case 'levels': ch.give.push({ k: 'levels', n: e.n }); bump(x, 'levels', e.n); break;
      case 'mon': {
        if (e.n > 0) for (let i = 0; i < e.n; i++) ch.give.push({ k: 'mon', species: pickMon(b, x.r), level: R().strayLevel, member: null });
        else {
          const st = (b.crew ??= freshCrewState());
          for (let i = 0; i < -e.n && st.stores.length; i++) st.stores.splice(x.r.int(0, st.stores.length - 1), 1);
        }
        bump(x, 'mon', e.n);
        break;
      }
      case 'monMember': {
        const m = memberById(b, x.member);
        ch.give.push({ k: 'mon', species: pickMon(b, x.r), level: R().strayLevel, member: m && m.team.length < 6 ? m.id : null });
        bump(x, 'mon', e.n);
        break;
      }
      case 'item': ch.give.push({ k: 'item', id: e.id, n: e.n, held: !!e.held }); bump(x, 'item', e.n); break;
      case 'join': joinLead(x, e); break;
      case 'leave': {
        const m = memberById(b, x.member);
        if (m) { leave(b, m, 'chair', null, ''); x.lines.push(fill(L().left!, { name: m.name })); bump(x, 'members', -1); }
        break;
      }
      case 'jail': {
        const m = memberById(b, x.member);
        if (m) { crewOf(m).out = { why: 'jail', days: DOMINION_DATA.crew.rules.jailDays }; bump(x, 'jailed', 1); }
        break;
      }
      case 'free': { const m = memberById(b, x.member); const c = m ? crewOf(m) : null; if (c?.out?.why === 'jail') c.out = { why: 'jail', days: 1 }; break; }
      case 'out': { const m = memberById(b, x.member); const c = m ? crewOf(m) : null; if (c) c.out = { why: c.out?.why ?? 'hurt', days: e.n }; break; }
      case 'rest': { const m = memberById(b, x.member); if (m) crewOf(m).task = 'rest'; break; }
      case 'guard': {
        const m = memberById(b, x.member);
        if (m) { crewOf(m).task = 'guard-hq'; ch.locks[m.id] = b.day + e.n; }
        break;
      }
      case 'poach': {
        for (const m of [...b.members]) if (m.loyalty < e.below && x.r.int(1, 100) <= e.p) { leave(b, m, 'poached', null, ''); x.lines.push(fill(L().left!, { name: m.name })); bump(x, 'members', -1); }
        break;
      }
      case 'scout': scoutHome(b); bump(x, 'scout', 1); break;
      case 'racketAdd': {
        const t = F().districts.find((q) => q.id === hq)?.targets.find((q) => !b.field.rackets.some((k) => k.target === q.id));
        if (t) { b.field.rackets.push({ target: t.id, district: hq, weekly: Math.round((F().play.extort?.weekly ?? 100) * t.pay), day: b.day, kind: 'racket' }); bump(x, 'rackets', 1); }
        break;
      }
      case 'racketLose': {
        const i = b.field.rackets.length - 1;
        if (i >= 0) { b.field.rackets.splice(i, 1); bump(x, 'rackets', -1); }
        break;
      }
      case 'tag': {
        const p = e.who ?? (x.card.who === 'member' ? x.member ?? 'member' : x.card.who ?? `card-${x.card.id}`);
        ch.tags[p] = e.tag;
        x.tag = e.tag;
        break;
      }
      case 'follow': ch.follow.push({ card: e.card, day: b.day + e.days, member: x.member }); x.back = true; break;
      case 'owed': ch.owed[e.key] = (ch.owed[e.key] ?? 0) + e.n; bump(x, e.key, e.n); break;
      case 'note': x.lines.push(`${e.text} ${fill(L().waits!, { slice: e.slice })}`); break;
      case 'deal': {
        ch.deals.push({ card: x.card.id, n: scale(b, e.n), clean: !!e.clean, heat: e.heat ?? 0, risk: e.risk ?? 0, wanted: e.wanted ?? 0, mon: e.mon ?? 0, item: e.item ?? null, itemN: e.itemN ?? 0, ten: e.ten ?? 0 });
        bump(x, 'week', scale(b, e.n));
        break;
      }
      case 'chance': apply(x, x.r.int(1, 100) <= e.p ? e.yes : e.no); break;
      case 'later': ch.due.push({ day: b.day + e.days, card: x.card.id, member: x.member, fx: e.fx }); x.back = true; break;
      case 'fight': {
        if (b.field.fight || !x.card.foe) break;
        const pick = x.pick;
        b.field.fight = { why: 'court', foe: 'court', begun: false, action: String(pick), target: String(x.card.id), district: hq, pass: false, big: false, wager: 0, racket: null };
        ch.stake = { card: x.card.id, pick, member: x.member };
        x.lines.push(fill(L().fightSet!, { foe: x.card.foe.name }));
        break;
      }
    }
  }
}

function fightOf(fx: CourtFx[]): Extract<CourtFx, { k: 'fight' }> | null {
  for (const e of fx) {
    if (e.k === 'fight') return e;
    const inner = e.k === 'chance' ? fightOf([...e.yes, ...e.no]) : e.k === 'later' ? fightOf(e.fx) : null;
    if (inner) return inner;
  }
  return null;
}

/** A fight at the door a Chair answer set up has ended: its stakes. Called by fightEnd.ts. */
export function courtFightEnd(b: DominionBlock, outcome: 'win' | 'lose' | 'fled', seed: string): string[] {
  const ch = chairOf(b), s = ch.stake;
  ch.stake = null;
  const c = s ? cardById(s.card) : undefined;
  if (!s || !c?.foe) return [];
  const f = fightOf((s.pick ? c.b : c.a).fx);
  const x: Ctx = { b, pick: s.pick as 0 | 1, card: c, member: s.member, second: null, r: rng(seed, 'dominion-court', b.day, c.id, 'fight'), changes: {}, lines: [], tag: null, back: false };
  if (outcome === 'win') apply(x, f?.win ?? []);
  else if (outcome === 'lose') apply(x, f?.lose ?? []);
  return [fill(outcome === 'win' ? L().fightWon! : L().fightLost!, { foe: c.foe.name }), ...x.lines];
}

/** Answers the visitor at the door (0 = the left button, 1 = the right). `by`: the member it was handed to. */
export function answerCard(block: DominionBlock, choice: number, seed: string, by: string | null = null): { ok: boolean; block: DominionBlock; notice: string | null } {
  const door = atDoor(block);
  if (!door || block.chair!.result || (choice !== 0 && choice !== 1)) return { ok: false, block, notice: null };
  const b = structuredClone(block);
  const ch = chairOf(b), c = door.card;
  const x: Ctx = { b, pick: choice as 0 | 1, card: c, member: door.member, second: door.second, r: rng(seed, 'dominion-court', b.day, c.id, ch.at), changes: {}, lines: [], tag: null, back: false };
  const ans = choice ? c.b : c.a;
  apply(x, ans.fx);
  const lines = [fill(L().you!, { label: cardText(b, ans.label, door.member) }), ...x.lines];
  if (by) {
    const m = memberById(b, by)!;
    const lean = leanOf(m);
    addLoyalty(b, m, R().loyaltyHanded);
    if (lean !== 'none') { const fam = R().leanFamily[lean]!; crewOf(m).tally[fam] = (crewOf(m).tally[fam] ?? 0) + 1; }
    lines.unshift(`${fill(L().handed!, { member: m.name, label: ans.label })} ${R().lines.handedWhy[lean] ?? ''}`.trim());
    bump(x, `loy:${m.id}`, R().loyaltyHanded);
    ch.handed = true;
  }
  ch.seen[String(c.id)] = b.day;
  ch.log = [...ch.log, [b.day, c.id, choice] as [number, number, number]].slice(-R().logKeep);
  ch.week = [ch.week[0] + 1, ch.week[1] + (choice ? 0 : 1), ch.week[2] + (choice ? 1 : 0), ch.week[3] + (by ? 1 : 0)];
  ch.tally.push({ card: c.id, member: door.member, pick: choice, by, changes: x.changes, tag: x.tag, back: x.back });
  ch.result = lines;
  return { ok: true, block: b, notice: null };
}

/** Hands the card to a member: they pick by their lean, once per sitting. */
export function handOff(block: DominionBlock, memberId: string, seed: string): { ok: boolean; block: DominionBlock; notice: string | null } {
  const door = atDoor(block);
  if (!door || block.chair!.result) return { ok: false, block, notice: null };
  if (block.chair!.handed) return { ok: false, block, notice: L().handUsed! };
  const m = handOffCrew(block, door.card, door).find((x) => x.id === memberId);
  if (!m) return { ok: false, block, notice: L().noHandOff! };
  const pick = wouldPick(block, door.card, m, rng(seed, 'dominion-court', block.day, door.card.id, 'hand'));
  return answerCard(block, pick, seed, m.id);
}

/** Reads on after an answer: the next visitor, or the Tally. */
export function courtNext(block: DominionBlock): { ok: boolean; block: DominionBlock } {
  if (!block.chair?.open || !block.chair.result) return { ok: false, block };
  const b = structuredClone(block);
  const ch = chairOf(b);
  ch.result = null;
  ch.at += 1;
  return { ok: true, block: b };
}

/** Closes the doors early: unseen visitors go home (a little Regard lost each). Not on a Crisis card. */
export function closeDoors(block: DominionBlock): { ok: boolean; block: DominionBlock; notice: string | null } {
  const door = atDoor(block);
  if (!door || block.chair!.result || door.card.crisis) return { ok: false, block, notice: null };
  const b = structuredClone(block);
  const ch = chairOf(b);
  const rest = ch.docket.slice(ch.at);
  const loss = R().lines.closeLoss * rest.length;
  const d = b.field.districts[HQ()]!;
  d.regard = clamp(d.regard - loss);
  for (const v of rest) {
    ch.tally.push({ card: v.card, member: v.member, pick: -1, by: null, changes: {}, tag: null, back: false });
    // A follow-up sent home comes back tomorrow.
    if (cardById(v.card)?.followOnly) ch.follow.push({ card: v.card, day: b.day + 1, member: v.member });
  }
  ch.at = ch.docket.length;
  return { ok: true, block: b, notice: fill(L().closed!, { n: rest.length, loss }) };
}

/** The Tally read: the sitting ends and the Night begins. */
export function endSitting(block: DominionBlock): DominionBlock {
  const b = structuredClone(block);
  const ch = chairOf(b);
  ch.open = false;
  ch.docket = [];
  ch.at = 0;
  ch.result = null;
  return b;
}

/** Cycles one of the three Chair settings (end-of-day-court.md §9). */
export function cycleOpt(block: DominionBlock, key: 'length' | 'numbers' | 'speed'): DominionBlock {
  const b = structuredClone(block);
  const o = chairOf(b).opts;
  if (key === 'length') o.length = R().lengths[(R().lengths.indexOf(o.length) + 1) % 4]!;
  else if (key === 'numbers') o.numbers = o.numbers === 'arrows' ? 'exact' : 'arrows';
  else o.speed = o.speed === 'normal' ? 'fast' : 'normal';
  return b;
}

/** A member's task locked by a Chair answer (a gatekeeper, guarding a mother's house), or null. */
export function lockedTask(b: DominionBlock, memberId: string): string | null {
  const until = b.chair?.locks[memberId];
  return until !== undefined && until >= b.day ? 'guard-hq' : null;
}

// ---------- the World Turn: deals, things due, Jenny's street, the weekly line ----------

function chairStep(b: DominionBlock, seed: string): string[] {
  const ch = b.chair;
  if (!ch) return [];
  const out: string[] = [];
  const r = rng(seed, 'dominion-court', b.day, 'world');
  if (ch.cool) { addHeat(b, HQ(), -ch.cool); syncHeat(b); }
  for (const [id, until] of Object.entries(ch.locks)) if (until < b.day) delete ch.locks[id];
  // Things due ("in 3 days").
  for (const d of ch.due.filter((x) => x.day <= b.day)) {
    const c = cardById(d.card);
    if (!c) continue;
    const x: Ctx = { b, pick: 0, card: c, member: d.member, second: null, r, changes: {}, lines: [], tag: null, back: false };
    apply(x, d.fx);
    const bits = Object.entries(x.changes).filter(([k]) => ['funds', 'heat'].includes(k)).map(([k, n]) => (k === 'funds' ? `₽${n > 0 ? '+' : ''}${n}` : `Heat ${n > 0 ? '+' : ''}${n}`));
    out.push(fill(L().later!, { line: `${c.name}: ${[...bits, ...x.lines].join(', ') || 'nothing came of it.'}` }));
  }
  ch.due = ch.due.filter((x) => x.day > b.day);
  // Weekly: the deals pay (or cost), and the week's Chair line.
  if (b.day % DOMINION_DATA.start.clock.weekLength === 0) {
    let net = 0;
    for (const deal of ch.deals) {
      b.funds += deal.n;
      if (deal.n > 0) b.earned += deal.n;
      book(b, deal.clean ? 'chairClean' : 'chair', deal.n);
      net += deal.n;
      if (deal.heat) addHeat(b, HQ(), deal.heat);
      if (deal.ten) ch.owed.ten = (ch.owed.ten ?? 0) + deal.ten;
      for (let i = 0; i < deal.mon; i++) ch.give.push({ k: 'mon', species: pickMon(b, r), level: R().strayLevel, member: null });
      if (deal.item) ch.give.push({ k: 'item', id: deal.item, n: deal.itemN, held: false });
      if (deal.risk && r.int(1, 100) <= deal.risk) {
        if (deal.heat && !deal.wanted) addHeat(b, HQ(), deal.heat * 4);
        if (deal.wanted) b.field.wanted = clamp(b.field.wanted + deal.wanted);
      }
    }
    syncHeat(b);
    if (ch.deals.length) out.push(fill(L().deal!, { n: `${net >= 0 ? '+' : ''}₽${net}` }));
    if (ch.week[0]) out.push(fill(L().week!, { n: ch.week[0], a: ch.week[1], b: ch.week[2], h: ch.week[3] }));
    ch.week = [0, 0, 0, 0];
  }
  return out;
}
addWorldStep('world', chairStep);

/** Visitors' Tally rows as they read (for tests and the screen). */
export const tallyOf = (b: DominionBlock): TallyRow[] => b.chair?.tally ?? [];
