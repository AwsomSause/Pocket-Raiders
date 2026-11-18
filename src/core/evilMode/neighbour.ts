// Evil Mode slice 13: a neighbour (design Part 15a sections 1 to 7). Every region has its canon team, and it was there
// first. Kanto's is Giovanni's Team Rocket: the seven stances and the ladder, his five ticks on fixed days, his messages
// (a card signed "— G."), the Sit-Down, the Chair, the Betrayal and the Legend, and what's left of a team that falls.
// Pure: new blocks are returned. Words and numbers are in neighbour.json. The `evil-neighbour` stream draws only the thing
// he asks; when a tick fires is fixed by day, never drawn. Each number is counted, so a reload draws the same.

import { hashSeed, Rng } from '../rng';
import { holdingName, localOf, shiftMood, takings } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill, money } from './ledger';
import { districtKey, inRoster, moveLoyalty } from './people';
import { dayIn } from './region';
import type { Crew, EvilModeBlock, Holding, NeighbourDef, NeighbourPost, NeighbourState, Stance, TableThing } from './schema';
import { logOf } from './pack';

type NB = NeighbourState;
const cap10 = (n: number) => Math.max(0, Math.min(10, n));
const capOp = (n: number) => Math.max(-3, Math.min(3, n));
const T = (data: EvilData) => data.neighbour.lines;

/** The n-th number `evil-neighbour` gives out in this run, 1..max. */
export const neighbourRoll = (seed: string, n: number, max: number): number => new Rng(hashSeed(`${seed}::evil-neighbour::${n}`)).int(1, max);

function draw(block: EvilModeBlock, max: number): { block: EvilModeBlock; roll: number } {
  const n = block.draws['evil-neighbour'] ?? 0;
  return { block: { ...block, draws: { ...block.draws, 'evil-neighbour': n + 1 } }, roll: neighbourRoll(block.district?.seed ?? '', n, max) };
}

export const neighbourOn = (data: EvilData = EVIL_DATA): boolean => data.neighbour.on;

/** The region's neighbour as written, or undefined (a region not written yet, or the setting's undo). */
export const neighbourDef = (region: number, data: EvilData = EVIL_DATA, side?: 'shore' | 'inland'): NeighbourDef | undefined => {
  if (!neighbourOn(data)) return undefined;
  const here = data.neighbour.neighbours.filter((n) => n.region === region);
  return here.find((n) => !n.side || !side || n.side === side) ?? here[0];
};

/**
 * Slice 16: which of a two-neighbour region's teams is next door (Hoenn: Aqua by the shore, Magma inland; Part 26a section
 * 4.1). A Tide team settles by the water and an Ember team inland; anyone else, by the seed (hashed, no stream).
 */
export function sideFor(seed: string, doctrine?: string): 'shore' | 'inland' {
  if (doctrine === 'tide') return 'shore';
  if (doctrine === 'ember') return 'inland';
  return new Rng(hashSeed(`${seed}::evil-side`)).int(1, 2) === 1 ? 'shore' : 'inland';
}

export const defOf = (nb: NB, data: EvilData = EVIL_DATA): NeighbourDef => data.neighbour.neighbours.find((n) => n.id === nb.id)!;

/** A tick's day in its stage (its written day, plus anything that's made it late). */
const tickPassed = (block: Pick<EvilModeBlock, 'here' | 'district'>, t: { stage: number; day: number }, late: number): boolean =>
  block.here.stage > t.stage || (block.here.stage === t.stage && dayIn(block) >= t.day + late);

/** Giovanni at Wary, never met. Ticks whose day has already passed (a block from before slice 13) count as happened. */
export function freshNeighbour(block: Pick<EvilModeBlock, 'here' | 'district'>, def: NeighbourDef): NB {
  return {
    id: def.id, region: def.region, stance: 'wary', whose: null, broke: null, opinion: 0, dread: def.dread, pen: def.pen,
    ticks: def.ticks.map((t) => {
      const past = block.here.stage > t.stage || (block.here.stage === t.stage && dayIn(block) > t.day);
      return { n: t.n, state: past ? ('fired' as const) : ('waiting' as const), day: null, late: 0 };
    }),
    slowed: false, warIn: null, sitDowns: [], sitting: null, invited: null, kept: null, posts: [], asked: null,
    chair: { tries: 0, lostStage: null }, fallen: null, fellDay: null, legend: 'none', legendDay: null, legendUid: null,
    understanding: null, scheme: null, cold: null,
  };
}

/** Made once, when the region has a neighbour and the block hasn't got one. */
export function ensureNeighbour(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (block.neighbour || !block.district) return block;
  const def = neighbourDef(block.here.region, data, sideFor(block.district.seed, block.team.doctrine));
  return def ? { ...block, neighbour: freshNeighbour(block, def) } : block;
}

const put = (block: EvilModeBlock, nb: NB): EvilModeBlock => ({ ...block, neighbour: nb });
const log = (block: EvilModeBlock, text: string, who: string[] = []): EvilModeBlock => appendLog(block, { kind: 'neighbour', who, text: `Day ${block.here.day}. ${text}` });
const postOf = (block: EvilModeBlock, nb: NB, text: string, kind: NeighbourPost['kind'] = 'note', choices: string[] = []): NB =>
  ({ ...nb, posts: [...nb.posts, { id: `p${nb.posts.length + 1}`, day: block.here.day, text, choices, answer: null, kind }] });

// ---- Stances ----

export const stanceDef = (s: Stance, data: EvilData = EVIL_DATA) => data.neighbour.stances.find((x) => x.id === s)!;
export const opinionWord = (o: number, data: EvilData = EVIL_DATA): string => data.neighbour.opinion.words[o + 3]!;
/** Part 15a section 2.1: "Allies" for Truce, Front, Merger or Understanding; "Rivals" for the rest. A summary, not a stance. */
export const summary = (nb: NB, data: EvilData = EVIL_DATA): 'Allies' | 'Rivals' => (data.neighbour.allies.includes(nb.stance) && !nb.broke ? 'Allies' : 'Rivals');

/** One step on the ladder (War, Rivals, Wary, Truce): toward War, or back toward Wary (never past it). */
export function stepStance(s: Stance, to: 'war' | 'wary', data: EvilData = EVIL_DATA): Stance {
  const L: readonly Stance[] = data.neighbour.ladder;
  const at = L.indexOf(s);
  if (to === 'war') return at < 0 ? 'rivals' : L[Math.max(0, at - 1)]!;
  const wary = L.indexOf('wary');
  return at < 0 || at >= wary ? s : L[at + 1]!;
}

/** The neighbour's holdings: tagged with their team and not the team's. None once they've fallen. */
export function isTheirs(h: Holding, nb: NB | null, data: EvilData = EVIL_DATA): boolean {
  return !!nb && !nb.fallen && h.owner !== 'team' && !!h.tags?.includes(defOf(nb, data).team);
}
/** A holding of theirs, now or once (a war job's target). */
const wasTheirs = (h: Holding | undefined, nb: NB, data: EvilData): boolean => !!h && !!h.tags?.includes(defOf(nb, data).team);

/** "Yours 14. Theirs 9.": every holding in this region's districts, this and those behind. */
export function counts(block: EvilModeBlock, data: EvilData = EVIL_DATA): { yours: number; theirs: number } {
  const all = [...(block.district ? [block.district] : []), ...block.region.past.map((p) => p.district)].flatMap((d) => d.holdings);
  return { yours: all.filter((h) => h.owner === 'team').length, theirs: all.filter((h) => isTheirs(h, block.neighbour, data)).length };
}

/** A job across the Truce's (or the Front's) line: its Card reads "Broke our word." (Part 15a section 4.5). */
export function acrossLine(block: EvilModeBlock, holdingId: string, data: EvilData = EVIL_DATA): boolean {
  const nb = block.neighbour;
  const h = block.district?.holdings.find((x) => x.id === holdingId);
  return !!nb && !!h && (nb.stance === 'truce' || nb.stance === 'front') && isTheirs(h, nb, data);
}

// ---- The Morning: messages and the clock ----

/**
 * The neighbour's Morning (Part 15a sections 3 and 7): the cold day ends; the fruit basket on its day (and monthly at
 * War); his invitation, answered or refused; each tick whose day has come fires, whatever the player's done; a Front's
 * Heat and tenth; the thing he asks. Once a day.
 */
export function neighbourMorning(block0: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  let block = ensureNeighbour(block0, data);
  const nb0 = block.neighbour;
  if (!nb0 || block.here.beat !== 'morning' || block.district?.end || block.region.phase !== 'day') return block;
  const key = `nb:m:${block.here.day}`;
  if (block.applied.includes(key)) return block;
  block = { ...block, applied: [...block.applied, key] };
  const def = defOf(nb0, data);
  const N = data.neighbour.numbers;
  let nb = nb0;
  const day = block.here.day;
  // Tick 4's cold day is over: every holding that went colder comes back one.
  if (nb.cold !== null && day > nb.cold && block.district) {
    block = { ...block, district: { ...block.district, holdings: block.district.holdings.map((h) => ({ ...h, mood: shiftMood(h.mood, 1) })) } };
    nb = { ...nb, cold: null };
  }
  if (!nb.fallen) {
    // The fruit basket (Part 15a section 7.3): Day 2 of the Arrival; at War, monthly, till it's over.
    const B = def.basket;
    if (block.here.stage === B.stage && dayIn(block) === B.day && !nb.posts.some((p) => p.kind === 'basket')) nb = postOf(block, nb, B.text, 'basket', B.choices);
    else if (nb.stance === 'war') {
      const last = [...nb.posts].reverse().find((p) => p.kind === 'basket');
      if (last && day - last.day >= N.basketEvery) nb = postOf(block, nb, B.war, 'basket', B.choices);
    }
    // His invitation, not come to: refusing one moves the stance a step toward War (Part 15a section 4.1).
    if (nb.invited !== null && day > nb.invited) nb = { ...nb, invited: null, stance: stepStance(nb.stance, 'war', data) };
  }
  // The clock: each tick fires on its day, whatever the player does. A stopped one never fires.
  for (let i = 0; i < 5; i++) {
    const t = nb.ticks[i]!;
    if (t.state !== 'waiting' || !tickPassed(block, def.ticks[i]!, t.late)) continue;
    const r = fireTick(put(block, nb), i, data);
    block = r;
    nb = r.neighbour!;
  }
  if (!nb.fallen && block.district) {
    // A Front: Heat −1 a day, to a floor of 2; a tenth of takings every seventh day (Part 15a section 2.2).
    if (nb.stance === 'front') {
      const heat = block.team.heat > N.frontHeatFloor ? block.team.heat - 1 : block.team.heat;
      block = { ...block, team: { ...block.team, heat } };
      if (day % N.frontEvery === 0) {
        const week = (block.district?.holdings ?? []).filter((h) => h.owner === 'team').reduce((s, h) => s + takings(h, data), 0) * N.frontEvery;
        const amount = Math.min(block.team.funds, Math.floor((week * N.frontTenth) / 100));
        block = log({ ...block, team: { ...block.team, funds: block.team.funds - amount } }, fill(T(data).frontTenth!, { amount: money(amount) }));
      }
    }
    // The thing they ask (a Front), or the order (the team's under them): on a district's first day, drawn once.
    const under = nb.stance === 'merger' && nb.whose === 'theirs';
    if ((nb.stance === 'front' || under) && dayIn(block) === 1 && nb.asked?.stage !== block.here.stage) {
      const r = draw(put(block, nb), def.asks.length);
      block = r.block;
      const a = def.asks[r.roll - 1]!;
      nb = { ...nb, asked: { n: a.n, day, stage: block.here.stage, done: null } };
      nb = postOf(block, nb, `${fill(under ? T(data).under! : T(data).ask!, { job: a.job })} From: ${a.from}. ${a.why}`, 'ask', ['Do it', 'Say no']);
    }
  }
  return put(block, nb);
}

/** One tick of the clock (Part 15a sections 3.1 and 7.8). Marked fired with its day, so it can never fire twice. */
function fireTick(block0: EvilModeBlock, i: number, data: EvilData): EvilModeBlock {
  let block = block0;
  let nb = block.neighbour!;
  const def = defOf(nb, data);
  const t = def.ticks[i]!;
  const day = block.here.day;
  nb = { ...nb, ticks: nb.ticks.map((x, j) => (j === i ? { ...x, state: 'fired' as const, day } : x)) };
  // A neighbour that's fallen to the team has a clock that's the team's: what's left of it is stopped (Part 15a 3.1).
  if (nb.fallen) return put(block, { ...nb, ticks: nb.ticks.map((x, j) => (j === i ? { ...x, state: 'stopped' as const, day: null } : x)) });
  nb = postOf(block, nb, t.radio);
  const d = block.district!;
  if (t.n === 1) {
    // One holding outside the team's district goes Shut (the first district behind, its first that isn't the team's).
    const past = block.region.past.find((p) => p.district.holdings.some((h) => h.owner !== 'team' && h.mood !== null));
    if (past) {
      const id = past.district.holdings.find((h) => h.owner !== 'team' && h.mood !== null)!.id;
      const pastList = block.region.past.map((p) => (p === past ? { ...p, district: { ...p.district, holdings: p.district.holdings.map((h) => (h.id === id ? { ...h, mood: 'shut' as const } : h)) } } : p));
      block = { ...block, region: { ...block.region, past: pastList } };
    }
  } else if (t.n === 2) {
    nb = { ...nb, dread: cap10(nb.dread + 2), pen: def.penAfter, invited: day + 1 };
    nb = postOf(block, nb, T(data).invite!);
  } else if (t.n === 3) {
    // A district the team may hold has their people in it now: two more holdings in their colour.
    const tag = def.team;
    let n = 0;
    const holdings = d.holdings.map((h) => (n < 2 && h.owner !== 'team' && def.kinds.includes(h.kind) && !h.tags?.includes(tag) ? (n++, { ...h, tags: [...(h.tags ?? []), tag] }) : h));
    block = { ...block, district: { ...d, holdings } };
  } else if (t.n === 4) {
    block = { ...block, district: { ...d, holdings: d.holdings.map((h) => ({ ...h, mood: shiftMood(h.mood, -1) })) } };
    nb = { ...nb, cold: day };
  } else if (t.n === 5) {
    return fallToHero(put(block, nb), data);
  }
  return put(block, nb);
}

// ---- The Evening: war jobs, a broken line, a quiet district ----

/**
 * After the Evening's rolls (Part 15a sections 2.1, 2.2 and 4.5): a job against their holdings is a war job. Across a
 * Truce or a Front it breaks the word, said and written; otherwise the stance steps toward War. At War, Heat +2 the day
 * a war job runs, and a war the team's winning slows the clock four days, once a region. A district that ends with no
 * war job steps the stance back toward Wary, never past it. Once a day.
 */
export function neighbourEvening(block0: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  let block = block0;
  const nb0 = block.neighbour;
  const d = block.district;
  if (!nb0 || !d || nb0.fallen) return block;
  const key = `nb:e:${d.region}:${d.n}:${block.here.day}`;
  if (block.applied.includes(key)) return block;
  block = { ...block, applied: [...block.applied, key] };
  const L = T(data);
  const N = data.neighbour.numbers;
  let nb = nb0;
  const said: string[] = [];
  const war = logOf(block).some((e) => e.kind === 'job' && e.day === block.here.day && e.region === d.region && e.district === d.n && wasTheirs(d.holdings.find((h) => h.id === e.to), nb, data));
  if (war) {
    nb = { ...nb, warIn: districtKey(block) };
    if (nb.stance === 'truce' || nb.stance === 'front') {
      nb = { ...nb, stance: 'rivals', broke: 'player', opinion: capOp(nb.opinion + N.brokeOpinion), asked: null };
      block = log(block, L.broke!);
      said.push(L.brokeSaid!);
    } else if (nb.stance === 'war') {
      block = { ...block, team: { ...block.team, heat: cap10(block.team.heat + N.warHeat) } };
      const c = counts(put(block, nb), data);
      if (!nb.slowed && c.yours > c.theirs) {
        const i = nb.ticks.findIndex((t) => t.state === 'waiting');
        if (i >= 0) {
          nb = { ...nb, slowed: true, ticks: nb.ticks.map((t, j) => (j === i ? { ...t, late: t.late + N.warSlow } : t)) };
          said.push(L.slowed!);
        }
      }
    } else if (nb.stance !== 'merger') {
      nb = { ...nb, stance: stepStance(nb.stance === 'understanding' ? 'wary' : nb.stance, 'war', data) };
      said.push(fill(L.warStep!, { stance: stanceDef(nb.stance, data).word }));
    }
  }
  return said.length ? { ...put(block, nb), evening: [...block.evening, ...said] } : put(block, nb);
}

/** A district that's ended with no war job in it steps the stance back toward Wary, never past it. Once a district. */
export function neighbourDistrictEnd(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const nb = block.neighbour;
  const d = block.district;
  if (!nb || !d?.end || nb.fallen) return block;
  const key = `nb:end:${d.region}:${d.n}`;
  if (block.applied.includes(key)) return block;
  const out: EvilModeBlock = { ...block, applied: [...block.applied, key] };
  if (nb.warIn === districtKey(block) || (nb.stance !== 'war' && nb.stance !== 'rivals')) return out;
  const stance = stepStance(nb.stance, 'wary', data);
  return { ...put(out, { ...nb, stance }), evening: [...out.evening, fill(T(data).quiet!, { stance: stanceDef(stance, data).word })] };
}

// ---- Messages ----

export interface Out { block: EvilModeBlock; problem: string | null; lines: string[] }
const no = (block: EvilModeBlock, problem: string): Out => ({ block, problem, lines: [] });

/** Answering a message (the basket, the thing he asks, the Pen, the Vault Card). Once each. */
export function answerPost(block: EvilModeBlock, id: string, i: number, data: EvilData = EVIL_DATA): Out {
  const nb = block.neighbour;
  const p = nb?.posts.find((x) => x.id === id);
  if (!nb || !p) return no(block, 'No such message.');
  if (p.answer !== null || !p.choices.length) return no(block, 'Already answered.');
  if (i < 0 || i >= p.choices.length) return no(block, 'No such answer.');
  const def = defOf(nb, data);
  const N = data.neighbour.numbers;
  let n: NB = { ...nb, posts: nb.posts.map((x) => (x.id === id ? { ...x, answer: i } : x)) };
  let out = block;
  let line = '';
  if (p.kind === 'basket') {
    n = { ...n, opinion: capOp(n.opinion + def.basket.opinion[i]!) };
    line = def.basket.said[i]!;
    if (i === 3) {
      const eyes = inRoster(block).find((c) => c.talent === 'eyes');
      line = `${eyes ? `${eyes.name} looks. ` : ''}${line}`;
    }
  } else if (p.kind === 'ask') {
    const a = def.asks.find((x) => x.n === n.asked?.n);
    if (!a || !n.asked) return no(block, 'Nothing is asked.');
    if (i === 0) {
      n = { ...n, asked: { ...n.asked, done: 'did' } };
      out = log(out, `Worked for ${def.boss}: ${a.job}`);
      line = def.askSaid.did;
    } else {
      // Saying no ends a Front: Rivals. Under them, it's an order refused: the same.
      n = { ...n, asked: { ...n.asked, done: 'no' }, stance: 'rivals', whose: null };
      line = def.askSaid.no;
    }
  } else if (p.kind === 'pen') {
    n = i === 0 ? { ...n, pen: 0 } : n;
    line = def.fall.pen.said[i]!;
    out = log(out, line);
  } else if (p.kind === 'vault') {
    if (i === 0) {
      n = { ...n, legend: 'kept' };
      out = { ...out, team: { ...out.team, dread: cap10(out.team.dread + N.legendDread), heat: Math.max(N.legendHeatFloor, cap10(out.team.heat + N.legendHeat)) } };
      out = { ...out, crew: out.crew.map((c) => (c.where === 'in' && c.flaw === 'kind' ? moveLoyalty(c, -1, data) : c)) };
      line = def.vault.kept;
    } else {
      // Opened: Regard +3, and it goes (the session takes it out of the party). Locals one warmer.
      n = { ...n, legend: 'freed' };
      out = { ...out, team: { ...out.team, regard: cap10(out.team.regard + N.freedRegard) } };
      if (out.district) out = { ...out, district: { ...out.district, holdings: out.district.holdings.map((h) => ({ ...h, mood: shiftMood(h.mood, 1) })) } };
      line = def.vault.freed;
    }
    out = log(out, line);
  }
  return { block: put(out, n), problem: null, lines: [line] };
}

/** Messages waiting on an answer. */
export const unanswered = (block: EvilModeBlock): NeighbourPost[] => (block.neighbour?.posts ?? []).filter((p) => p.choices.length > 0 && p.answer === null);

// ---- The Sit-Down ----

/** Who'd take the second chair: a Voice first, then a Heart, then the first Officer. */
export const secondChair = (block: EvilModeBlock): Crew | undefined => {
  const r = inRoster(block).filter((c) => !c.minor);
  return r.find((c) => c.talent === 'voice') ?? r.find((c) => c.talent === 'heart') ?? r.find((c) => c.rank === 'officer' || c.rank === 'executive');
};

/** The holding a Log line is about, in this district or one behind. */
const holdingOfEntry = (block: EvilModeBlock, e: { district: number; to?: string }): Holding | undefined =>
  [...(block.district ? [block.district] : []), ...block.region.past.map((p) => p.district)].find((d) => d.n === e.district)?.holdings.find((h) => h.id === e.to);

/** A Lean that went (rule 1, and the first exchange's slot): the Ledger line it quotes, or null. Always something real. */
export function messEntry(block: EvilModeBlock) {
  return logOf(block).find((e) => e.kind === 'job' && e.result === 'went' && e.method === 'lean') ?? null;
}

/** His four rules against the team's Ledger (Part 15a section 7.2). Rule 4 is never said aloud. */
export function rulesBroken(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const nb = block.neighbour!;
  const def = defOf(nb, data);
  const out: string[] = [];
  const lean = messEntry(block);
  if (lean) {
    const h = holdingOfEntry(block, lean);
    const l = h ? localOf(h, data) : undefined;
    out.push(fill(def.rules[0]!.broken, { holding: h ? holdingName(h, data) : 'a shop', who: l ? l.who.replace(/,.*$/, '') : 'The owner' }));
  }
  if (block.crew.some((c) => c.unpaid > 0 || c.left?.how === 'loyalty')) out.push(def.rules[1]!.broken);
  const took = logOf(block).find((e) => e.kind === 'job' && e.result === 'went' && e.method === 'take' && holdingOfEntry(block, e)?.kind === 'local');
  if (took) out.push(fill(def.rules[2]!.broken, { holding: holdingName(holdingOfEntry(block, took)!, data) }));
  return out;
}

/** Rule 1 kept perfectly: every local the team holds, this region, is known by name (scouted). The Understanding needs it. */
export function knowsEveryName(block: EvilModeBlock): boolean {
  const held = [...(block.district ? [block.district] : []), ...block.region.past.map((p) => p.district)].flatMap((d) => d.holdings).filter((h) => h.owner === 'team' && h.kind === 'local');
  return held.length > 0 && held.every((h) => h.scouted >= 1) && !messEntry(block);
}

function sitProblem(block: EvilModeBlock, data: EvilData): string | null {
  const nb = block.neighbour;
  const L = T(data);
  if (!nb || !neighbourOn(data)) return L.off!;
  if (nb.fallen) return L.fallen!;
  if (nb.sitting) return L.sitting!;
  if (block.fight) return L.fight!;
  if (block.here.beat !== 'inPerson') return L.inPersonOnly!;
  if (block.inPerson?.day === block.here.day) return L.outToday!;
  const invited = nb.invited === block.here.day;
  if (!invited && nb.sitDowns.some((s) => s.stage === block.here.stage)) return L.once!;
  return null;
}

/** Whether a Sit-Down can be called now, and why not. */
export const canSitDown = (block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null => sitProblem(block, data);

/** Calling a Sit-Down (war job 5, the Boss in person), or answering his call. Uses the Boss's outing. */
export function sitDown(block: EvilModeBlock, data: EvilData = EVIL_DATA): Out {
  const p = sitProblem(block, data);
  if (p) return no(block, p);
  const nb = block.neighbour!;
  const def = defOf(nb, data);
  const n = nb.sitDowns.length + 1;
  const caller = nb.invited === block.here.day ? 'them' as const : 'player' as const;
  const chair = secondChair(block)?.id ?? null;
  let lines: string[];
  if (n === 1) {
    const lean = messEntry(block);
    const h = lean ? holdingOfEntry(block, lean) : undefined;
    const l = h ? localOf(h, data) : undefined;
    const F = def.sitDown.first;
    lines = [def.ground, `${def.boss}: ${F.opens}`, `${def.boss}: ${lean ? fill(F.mess, { holding: h ? holdingName(h, data) : 'a shop', who: l ? l.who.replace(/,.*$/, '') : 'The owner' }) : F.warm}`, ...(lean ? [`You: ${F.you}`, `${def.boss}: ${F.book}`] : [])];
  } else {
    const S = def.sitDown.second;
    const broken = rulesBroken(block, data);
    lines = [def.ground, `${def.boss}: ${S.opens}`, ...(broken.length ? broken.map((b) => `${def.boss}: "${b}"`) : [S.stands, `${def.boss}: ${S.kept}`])];
  }
  const sitting: NonNullable<NB['sitting']> = { n, caller, ex: 0, chair, offered: false, son: false, said: [], table: [], lines };
  return { block: put({ ...block, inPerson: { day: block.here.day, holdingId: block.district!.holdings[19]!.id } }, { ...nb, sitting, invited: null }), problem: null, lines };
}

export interface SitChoice { text: string; open: boolean; why: string | null }

/** The choices in front of the Boss at this exchange (the table's are separate). */
export function sitChoices(block: EvilModeBlock, data: EvilData = EVIL_DATA): SitChoice[] {
  const nb = block.neighbour;
  const s = nb?.sitting;
  if (!nb || !s || s.ex === 3) return [];
  const def = defOf(nb, data);
  const F = def.sitDown.first;
  const chair = block.crew.find((c) => c.id === s.chair);
  const o = (text: string): SitChoice => ({ text, open: true, why: null });
  if (s.son) return def.sitDown.son.choices.map(o);
  if (s.ex === 0 && s.n === 1) return F.choices.map((text, i) => (i === F.voiceOnly && chair?.talent !== 'voice' ? { text, open: false, why: 'Needs a Voice in the second chair.' } : o(text)));
  if (s.ex === 0) return [o('Go on.'), ...(knowsEveryName(block) ? [o(def.sitDown.son.you)] : [])];
  if (s.ex === 1) return F.frontChoices.map(o);
  const whys = def.sitDown.whys[block.team.creed] ?? def.sitDown.whys.profit!;
  return [...whys, F.dontKnow].map(o);
}

/** One answer at the exchange in front of the Boss. Then the next exchange, and then the table. */
export function sitAnswer(block: EvilModeBlock, i: number, data: EvilData = EVIL_DATA): Out {
  const nb = block.neighbour;
  const s = nb?.sitting;
  if (!nb || !s) return no(block, T(data).notSitting!);
  const ch = sitChoices(block, data)[i];
  if (!ch) return no(block, 'No such answer.');
  if (!ch.open) return no(block, ch.why ?? 'Not open.');
  const def = defOf(nb, data);
  const F = def.sitDown.first;
  let n: NB = nb;
  let out = block;
  let ss = { ...s, said: [...s.said, ch.text] };
  const lines = [`You: ${ch.text}`];
  if (s.son) {
    const S = def.sitDown.son;
    const u = (['write', 'stop', 'none'] as const)[i]!;
    lines.push(fill(S.said[i]!, { crew: inRoster(block).length }));
    n = { ...n, understanding: u, ...(u === 'none' ? { stance: 'understanding' as const, broke: null } : {}) };
    // Heart +1, once, if they were in the room.
    const heart = block.crew.find((c) => c.id === s.chair && c.talent === 'heart');
    if (u === 'none' && heart) out = { ...out, crew: out.crew.map((c) => (c.id === heart.id ? moveLoyalty(c, 1, data) : c)) };
    if (u === 'none') out = log(out, 'An Understanding with Giovanni.');
    ss = { ...ss, son: false, ex: n.kept === null ? 2 : 3 };
  } else if (s.ex === 0 && s.n === 1) {
    lines.push(`${def.boss}: ${F.answers[i]}`.replace(`${def.boss}: He`, 'He'));
    if (i === 0 || i === 1) ss = { ...ss, offered: true, ex: 1 };
    else if (i === 2) { n = { ...n, stance: 'war' }; ss = { ...ss, ex: 2 }; }
    else { n = { ...n, opinion: capOp(n.opinion + 1) }; ss = { ...ss, offered: true, ex: 1 }; }
    if (ss.ex === 1) lines.push(`${def.boss}: ${F.offer}`);
    else lines.push(`${def.boss}: ${F.ask}`);
  } else if (s.ex === 0) {
    if (i === 1) { ss = { ...ss, son: true }; lines.push(...def.sitDown.son.lines); }
    else ss = { ...ss, ex: n.kept === null ? 2 : 3 };
    if (ss.ex === 2) lines.push(`${def.boss}: ${F.ask}`);
  } else if (s.ex === 1) {
    lines.push(F.frontSaid[i]!);
    if (i === 0) {
      n = { ...n, stance: 'front', broke: null };
      out = { ...out, crew: out.crew.map((c) => (c.where === 'in' && c.flaw === 'proud' ? moveLoyalty(c, data.neighbour.numbers.frontProud, data) : c)) };
      out = log(out, '"Worked for Giovanni." A chapter of Team Rocket.');
    }
    ss = { ...ss, ex: 2 };
    lines.push(`${def.boss}: ${F.ask}`);
  } else {
    n = { ...n, kept: ch.text };
    lines.push(F.wrote);
    ss = { ...ss, ex: 3 };
  }
  return { block: put(out, { ...n, sitting: { ...ss, lines: [...s.lines, ...lines] } }), problem: null, lines };
}

/** What can go on the table now, and why not (Part 15a section 4.3, Giovanni's kinds). */
export function tableThings(block: EvilModeBlock, data: EvilData = EVIL_DATA): { thing: TableThing; open: boolean; why: string | null }[] {
  const nb = block.neighbour;
  const s = nb?.sitting;
  if (!nb || !s || s.ex !== 3) return [];
  const N = data.neighbour.numbers;
  const full = s.table.length >= N.maxTable;
  const one = (thing: TableThing, why: string | null) => ({ thing, open: !why && !full && !s.table.includes(thing), why: s.table.includes(thing) ? 'Already on the table.' : full ? 'Three things each side.' : why });
  const tick2 = nb.ticks[1]!.state === 'waiting';
  return [
    one('line', !s.offered || nb.stance === 'war' || nb.stance === 'front' || nb.stance === 'merger' ? 'He hasn\'t offered a line.' : null),
    one('person', inRoster(block).some((c) => !c.minor && c.id !== s.chair) ? null : 'Nobody to hand over.'),
    one('job', s.n === 1 && tick2 ? null : 'Only tick two, before it fires.'),
    one('money', block.team.funds >= 10 ? null : 'Not enough to offer.'),
    one('fact', block.hero ? null : 'Nothing he wants to know.'),
    one('promise', nb.sitDowns.some((x) => x.table.includes('promise')) ? 'Already agreed.' : null),
    one('pen', s.n >= 2 && nb.pen > 0 && !nb.sitDowns.some((x) => x.table.includes('pen')) ? null : 'Not till the second Sit-Down.'),
  ];
}

/**
 * Putting one thing on the table. Agreed things are written down at once. A person's handed over; a minor never: the
 * slot refuses them, whoever asks.
 */
export function putOnTable(block: EvilModeBlock, thing: TableThing, personId?: string, data: EvilData = EVIL_DATA): Out {
  const nb = block.neighbour;
  const s = nb?.sitting;
  if (!nb || !s) return no(block, T(data).notSitting!);
  const def = defOf(nb, data);
  const X = def.sitDown.table;
  if (thing === 'person') {
    const p = block.crew.find((c) => c.id === personId && c.where === 'in');
    if (p?.minor) return no(block, X.minor);
  }
  const t = tableThings(block, data).find((x) => x.thing === thing);
  if (!t) return no(block, 'Nothing goes on the table yet.');
  if (!t.open) return no(block, t.why ?? 'Not now.');
  let n: NB = { ...nb, sitting: { ...s, table: [...s.table, thing] } };
  let out = block;
  let line: string;
  if (thing === 'line') {
    n = { ...n, stance: 'truce', broke: null };
    line = X.line;
  } else if (thing === 'person') {
    const p = block.crew.find((c) => c.id === personId && c.where === 'in' && c.id !== s.chair);
    if (!p) return no(block, 'Pick somebody on the Roster.');
    out = { ...out, crew: out.crew.map((c) => (c.id === p.id ? { ...c, where: 'left' as const, left: { day: block.here.day, how: 'letGo' as const } } : c)) };
    n = { ...n, opinion: capOp(n.opinion + 1) };
    line = `${p.name}: ${X.person}`;
  } else if (thing === 'job') {
    if (n.opinion < 0) {
      line = X.jobNo;
    } else {
      // The reach is called off; the big job comes two days late (Part 15a section 3.1).
      const late = data.neighbour.numbers.stopLate;
      n = { ...n, ticks: n.ticks.map((x, j) => (j === 1 ? { ...x, state: 'stopped' as const } : j === 2 ? { ...x, late: x.late + late } : x)) };
      line = X.job;
    }
  } else if (thing === 'money') {
    const amount = Math.floor(block.team.funds / 10);
    out = { ...out, team: { ...out.team, funds: out.team.funds - amount } };
    n = { ...n, opinion: capOp(n.opinion + 1) };
    line = `${money(amount)}. ${X.money}`;
  } else if (thing === 'fact') {
    line = X.fact;
  } else if (thing === 'promise') {
    line = X.promise;
  } else {
    const P = def.sitDown.pen;
    const opens = Math.min(n.pen, P.opens);
    n = { ...n, pen: n.pen - opens };
    line = [`You: ${P.you}`, P.laughs, `You: ${P.count}`, `${def.boss}: ${P.goOn}`, P.empty].join(' ');
  }
  out = log(out, `At the table with ${def.boss}: ${line}`);
  return { block: put(out, n), problem: null, lines: [line] };
}

/** Getting up. The Sit-Down's kept: who called it, the second chair, what was said, what went on the table. */
export function rise(block: EvilModeBlock, data: EvilData = EVIL_DATA): Out {
  const nb = block.neighbour;
  const s = nb?.sitting;
  if (!nb || !s) return no(block, T(data).notSitting!);
  const def = defOf(nb, data);
  const rec = { n: s.n, stage: block.here.stage, day: block.here.day, caller: s.caller, chair: s.chair, said: s.said, table: s.table };
  const line = def.sitDown.rise;
  return { block: log(put(block, { ...nb, sitting: null, sitDowns: [...nb.sitDowns, rec] }), `Sat down with ${def.boss}.`), problem: null, lines: [line] };
}

// ---- The Chair ----

/** Whether the Chair can be challenged now, and why not (Part 15a section 5.1). */
export function chairProblem(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  const nb = block.neighbour;
  const L = T(data);
  if (!nb || !neighbourOn(data)) return L.off!;
  const def = defOf(nb, data);
  if (nb.fallen) return L.fallen!;
  if (def.minors) return L.chairMinors!;
  if (block.here.stage < data.neighbour.numbers.chairFromStage) return L.chairEarly!;
  const c = counts(block, data);
  if (!nb.sitDowns.length && !(nb.stance === 'war' && c.yours > c.theirs)) return L.chairShut!;
  if (nb.chair.lostStage !== null && (nb.chair.tries >= 2 || block.here.stage <= nb.chair.lostStage)) return L.chairDone!;
  if (nb.sitting) return L.sitting!;
  if (block.fight) return L.fight!;
  if (block.here.beat !== 'inPerson') return L.inPersonOnly!;
  if (block.inPerson?.day === block.here.day) return L.outToday!;
  return null;
}

/** The Boss's six against theirs, at A+2. The stake's the same both ways. */
export function chairAct(block: EvilModeBlock, data: EvilData = EVIL_DATA): Out {
  const p = chairProblem(block, data);
  if (p) return no(block, p);
  const def = defOf(block.neighbour!, data);
  const h = block.district!.holdings[19]!.id;
  return { block: { ...block, inPerson: { day: block.here.day, holdingId: h }, fight: { kind: 'chair', holdingId: h, begun: false } }, problem: null, lines: [`${def.boss}: ${def.chair.says}`] };
}

/** The Chair's result. Won: the canon team falls, to the player. Lost: a soft loss; the team's kept, and it's theirs. */
export function chairResult(block: EvilModeBlock, won: boolean, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const nb = block.neighbour!;
  const def = defOf(nb, data);
  const cleared: EvilModeBlock = { ...block, fight: null };
  const chair = { tries: nb.chair.tries + 1, lostStage: won ? nb.chair.lostStage : block.here.stage };
  if (!won) {
    const n: NB = { ...nb, chair, stance: 'merger', whose: 'theirs', asked: null };
    const lines = [def.chair.lost, ...(chair.tries < 2 ? [def.chair.again] : [])];
    return { block: log(put(cleared, n), def.chair.lost), lines };
  }
  const r = fallToTeam(put(cleared, { ...nb, chair }), data);
  return { block: r.block, lines: [def.chair.won, ...r.lines] };
}

// ---- When a canon team falls (Part 15a sections 6 and 7.9) ----

/** The Betrayal's line, the same evening. */
const betrayalLine = (def: NeighbourDef) => `${def.betrayal.who}: ${def.betrayal.says} ${def.betrayal.grabs}`;

/** A fallen team's Scheme: four parts already stamped not clean, and "The other way" in seven words. */
export const inheritedScheme = (def: NeighbourDef): NonNullable<NB['scheme']> => ({
  from: def.team, name: def.fall.scheme.name, parts: def.fall.scheme.parts.map((part) => ({ part, clean: false as const })), other: def.fall.scheme.other, inherited: true,
});

/**
 * Rocket falls to the team (the Chair won): the Betrayal that evening and the Legend waiting in the cave; Giovanni
 * leaves; Ariana joins if there's a bed; Proton never; the Grunts who fit take beds; their holdings are the team's at
 * Wary; their Pen's opened (Clean hands: no choice) or the team's to decide; their Scheme arrives stamped not clean;
 * the Hero's reason is rewritten. What's left of the clock is stopped.
 */
export function fallToTeam(block0: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  let block = block0;
  const nb0 = block.neighbour!;
  const def = defOf(nb0, data);
  const F = def.fall;
  const N = data.neighbour.numbers;
  const day = block.here.day;
  const lines: string[] = [betrayalLine(def), F.boss];
  let nb: NB = { ...nb0, fallen: 'team', fellDay: day, stance: 'merger', whose: 'team', legend: 'waiting', legendDay: day, asked: null, invited: null, scheme: inheritedScheme(def), ticks: nb0.ticks.map((t) => (t.state === 'waiting' ? { ...t, state: 'stopped' as const } : t)) };
  // The people.
  const cap = data.people.rules.rosterCap;
  const crew = [...block.crew];
  const beds = () => cap - crew.filter((c) => c.where === 'in').length;
  for (const a of F.admins) {
    lines.push(`${a.name}: ${a.says}`);
    if (a.joins && !a.never && beds() > 0 && !crew.some((c) => c.id === `nb-${a.id}`)) {
      crew.push({ id: `nb-${a.id}`, ref: null, name: a.name, age: null, minor: false, talent: a.talent ?? null, flaw: a.flaw ?? null, flawFound: true, line: null, lineHeard: false, rank: 'officer', loyalty: N.joinLoyalty, where: 'in', outOn: null, jobs: 0, asked: 0, unpaid: 0, fitIn: null });
    }
  }
  let took = 0;
  for (let i = 1; i <= F.grunts && beds() > 0; i++) {
    crew.push({ id: `nb-g${i}`, ref: null, name: `${def.teamName.replace('Team ', '')} Grunt ${i}`, age: null, minor: false, talent: null, flaw: null, flawFound: false, line: null, lineHeard: false, rank: 'grunt', loyalty: N.joinLoyalty, where: 'in', outOn: null, jobs: 0, asked: 0, unpaid: 0, fitIn: null });
    took++;
  }
  lines.push(fill(F.gruntsSaid, { beds: took }));
  block = { ...block, crew };
  // Their holdings, this district and those behind: the team's, at Wary.
  const take = (hs: Holding[]) => hs.map((h) => (h.owner !== 'team' && h.tags?.includes(def.team) ? { ...h, owner: 'team' as const, mood: 'wary' as const, holds: true, since: day } : h));
  block = { ...block, district: block.district ? { ...block.district, holdings: take(block.district.holdings) } : block.district, region: { ...block.region, past: block.region.past.map((p) => ({ ...p, district: { ...p.district, holdings: take(p.district.holdings) } })) } };
  lines.push(F.holdings);
  // Their Pen.
  if (block.team.line === 'clean') {
    nb = { ...nb, pen: 0 };
    lines.push(F.pen.clean);
  } else nb = postOf(block, nb, `${F.pen.choice} ${nb.pen}.`, 'pen', F.pen.choices);
  nb = postOf(block, nb, def.basket.chair);
  // The Hero's reason's about the team now.
  if (block.hero) block = { ...block, hero: { ...block.hero, learned: [...block.hero.learned, F.hero] } };
  lines.push(F.hero);
  block = log(put(block, nb), `${def.teamName} fell to the team. ${def.betrayal.who} made a grab.`);
  return { block, lines };
}

/**
 * Tick 5: the Hero walks into their base (Part 15a sections 3.3, 6.2 and 7.7). The Betrayal's on the Radio next
 * morning. At Truce, Front or Understanding the team's offered the race to the cave, tonight only; otherwise the Hero
 * meets the Legend. A team that was under them is its own again. What the Boss said in the back room is read out.
 */
export function fallToHero(block0: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  let block = block0;
  const nb0 = block.neighbour!;
  if (nb0.fallen) return block;
  const def = defOf(nb0, data);
  const L = T(data);
  const ally = (nb0.stance === 'truce' || nb0.stance === 'front' || nb0.stance === 'understanding') && !nb0.broke;
  let nb: NB = { ...nb0, fallen: 'hero', fellDay: block.here.day, legend: ally ? 'race' : 'hero', legendDay: block.here.day, asked: null, invited: null };
  nb = postOf(block, nb, L.fellHero!);
  nb = postOf(block, nb, fill(L.betrayalRadio!, { who: def.betrayal.who, grabs: def.betrayal.grabs }));
  nb = postOf(block, nb, ally ? L.race! : L.heroLegend!);
  if (nb0.stance === 'merger' && nb0.whose === 'theirs') {
    nb = postOf(block, { ...nb, whose: null, stance: 'wary' }, def.chair.free);
  }
  if (block.hero) {
    const learned = [...(nb.kept ? [`${def.boss} read out what the Boss said in a back room: ${nb.kept}`] : []), ...(nb.understanding === 'stop' ? [def.sitDown.son.stop] : [])];
    if (learned.length) block = { ...block, hero: { ...block.hero, learned: [...block.hero.learned, ...learned] } };
  }
  return log(put(block, nb), L.fellHero!);
}

// ---- The Legend (Part 15a section 6.3) ----

export function legendProblem(block: EvilModeBlock, data: EvilData = EVIL_DATA): string | null {
  const nb = block.neighbour;
  const L = T(data);
  if (!nb || !neighbourOn(data)) return L.off!;
  const open = nb.legend === 'waiting' || (nb.legend === 'race' && nb.legendDay === block.here.day);
  if (!open) return nb.legend === 'none' || nb.legend === 'hero' || nb.legend === 'race' ? L.noLegend! : L.legendDone!;
  if (block.fight) return L.fight!;
  if (block.here.beat !== 'inPerson') return L.inPersonOnly!;
  if (block.inPerson?.day === block.here.day) return L.outToday!;
  return null;
}

/** Into the cave: the Legend at A+3, catchable. Once a region. */
export function legendAct(block: EvilModeBlock, data: EvilData = EVIL_DATA): Out {
  const p = legendProblem(block, data);
  if (p) return no(block, p);
  const h = block.district!.holdings[19]!.id;
  return { block: { ...block, inPerson: { day: block.here.day, holdingId: h }, fight: { kind: 'legend', holdingId: h, begun: false } }, problem: null, lines: [] };
}

/** The Legend's fight is over: caught (the Vault Card waits for the morning), beaten, or lost. Never twice. */
export function legendResult(block: EvilModeBlock, won: boolean, caught: string | null, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const nb = block.neighbour!;
  const def = defOf(nb, data);
  const L = T(data);
  const cleared: EvilModeBlock = { ...block, fight: null };
  if (caught) {
    let n: NB = { ...nb, legend: 'caught', legendUid: caught };
    n = postOf(block, n, `${def.vault.title}. ${def.vault.card.map(([a, b]) => `${a}: ${b}`).join(' ')}`, 'vault', def.vault.choices);
    return { block: log(put(cleared, n), L.caught!), lines: [L.caught!] };
  }
  const line = won ? L.notCaught! : L.legendLost!;
  return { block: log(put(cleared, { ...nb, legend: 'fought' }), line), lines: [line] };
}

/** The neighbour's lines for the Morning: today's messages. */
export const neighbourNotes = (block: EvilModeBlock): string[] => (block.neighbour?.posts ?? []).filter((p) => p.day === block.here.day && !p.choices.length).map((p) => p.text);
