// Evil Mode's economy (design Part 12 sections 1 and 2, Part 13 sections 1 and 2, Part 5 sections 2.2 to 2.4): Rackets on a
// street, Fronts in a holding, Works for a district; upkeep; and bankruptcy's three days (Short, Broke, Bust) with One Last
// Job, selling a Front and the Whip-Round. Every one is chosen on an Honest Card of thirteen fields. Pure: new blocks are
// returned. The one roll (a street at Dread 6+ that's had enough alone) draws on its own stream, `evil-economy`.

import { hashSeed, Rng } from '../rng';
import { holdingName, localOf, shiftMood, streetName, streetOf } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { inChair } from './gym';
import { appendLog, fill, money } from './ledger';
import { districtKey, inRoster, moveLoyalty, wageOf } from './people';
import { stageKind } from './region';
import { packField, LINE_IDS, RANKS, type CardField, type Crew, type EconCardDef, type EvilModeBlock, type Holding, type LogEntry, type Mood, type Venture } from './schema';

export const econOn = (data: EvilData = EVIL_DATA): boolean => data.economy.on;
const word = (k: string, data: EvilData): string => {
  const w = data.economy.words[k];
  return Array.isArray(w) ? w[0]! : w ?? k;
};
const words = (k: string, data: EvilData): string[] => {
  const w = data.economy.words[k];
  return Array.isArray(w) ? w : w ? [w] : [];
};
export const cardDef = (id: string, data: EvilData = EVIL_DATA): EconCardDef | undefined => data.economy.cards.find((c) => c.id === id);
const keyOf = (v: Pick<Venture, 'region' | 'district'>): string => `${v.region}:${v.district}`;
const townOf = (block: EvilModeBlock): string => block.district?.holdings.find((h) => h.kind === 'town')?.ref ?? '';
const roll = (seed: string, n: number, max: number): number => new Rng(hashSeed(`${seed}::evil-economy::${n}`)).int(1, max);

/** The Cards offered in this district (by `where`), in the file's order. None while the economy's off. */
export function offered(block: EvilModeBlock, data: EvilData = EVIL_DATA): EconCardDef[] {
  if (!econOn(data) || !block.district) return [];
  const n = block.district.n;
  return data.economy.cards.filter((c) => c.where.length === 0 || c.where.includes(n));
}

const MOOD_ORDER: Mood[] = ['shut', 'sullen', 'wary', 'easy', 'warm'];
/** A street's mood: the middle of its locals' moods (on a tie, the colder). Null with no locals on it. */
export function streetMood(block: EvilModeBlock, street: number, data: EvilData = EVIL_DATA): Mood | null {
  const ms = (block.district?.holdings ?? []).filter((h) => (h.kind === 'local' || h.kind === 'floor') && streetOf(h.step, data) === street && h.mood).map((h) => MOOD_ORDER.indexOf(h.mood!)).sort((a, b) => a - b);
  return ms.length ? MOOD_ORDER[ms[Math.floor((ms.length - 1) / 2)]!]! : null;
}

/** Streets the team holds at least one holding on (a racket needs one: Part 12 section 2.1). */
export function heldStreets(block: EvilModeBlock, data: EvilData = EVIL_DATA): number[] {
  const set = new Set((block.district?.holdings ?? []).filter((h) => h.owner === 'team' && h.kind !== 'gym').map((h) => streetOf(h.step, data)));
  return data.district.streets.map((_, i) => i).filter((i) => set.has(i));
}

/** Holdings a Front can open in: had by deed, lease or share (Paid for, or given: Persuade), a local or a floor, no Front yet. */
export function frontHoldings(block: EvilModeBlock): Holding[] {
  const taken = new Set(block.economy.running.filter((v) => v.kind === 'front' && v.holdingId).map((v) => v.holdingId));
  return (block.district?.holdings ?? []).filter((h) => h.owner === 'team' && (h.kind === 'local' || h.kind === 'floor') && (h.method === 'pay' || h.method === 'persuade') && !taken.has(h.id));
}

/** Why this person is on trade today, or null: out with a squad, or running a Front (they do nothing else). */
export function tradeProblem(block: EvilModeBlock, id: string): string | null {
  const c = block.crew.find((x) => x.id === id);
  const e = block.economy;
  if (!c || !e) return null;
  const front = e.running.find((v) => v.kind === 'front' && v.person === id);
  if (front) return `${c.name} runs ${cardDef(front.cardId)?.name ?? 'a Front'}.`;
  if (e.busy.day === block.here.day && e.busy.ids.includes(id)) return `${c.name} is out on trade today.`;
  return null;
}

/** Free today, for trade: in, grown, not resting, not on a job, not posted, not in a Gym's chair, not out on trade. */
function freeCrew(block: EvilModeBlock): Crew[] {
  const day = block.here.day;
  return inRoster(block).filter((c) => !c.minor && c.outOn !== day && !block.queue.some((j) => j.squad.includes(c.id)) && !block.posted.some((p) => p.id === c.id) && !inChair(block, c.id) && !tradeProblem(block, c.id));
}

const crosses = (p: Crew, tags: readonly string[], data: EvilData): boolean => p.line !== null && (data.people.lines.find((l) => l.n === p.line)?.tags ?? []).some((t) => tags.includes(t));

/** The squad a Card would send, and who won't go (by their line). A Front sends one person of its talent. */
export function squadFor(block: EvilModeBlock, kind: 'racket' | 'front' | 'work' | 'lastJob', tags: readonly string[], needs: string | null, data: EvilData = EVIL_DATA): { squad: Crew[]; wont: Crew[] } {
  const free = freeCrew(block);
  const wont = free.filter((c) => crosses(c, tags, data));
  const go = free.filter((c) => !crosses(c, tags, data));
  if (kind === 'front') {
    const p = needs ? go.find((c) => c.talent === needs) : [...go].sort((a, b) => b.loyalty - a.loyalty)[0];
    return { squad: p ? [p] : [], wont };
  }
  const prefer = kind === 'racket' ? 'books' : kind === 'work' ? 'heart' : 'hands';
  const sorted = [...go.filter((c) => c.talent === prefer), ...go.filter((c) => c.talent !== prefer)];
  return { squad: sorted.slice(0, data.district.rules.squadMax), wont };
}

export interface TradeReq { cardId: string; street?: number; holdingId?: string }

const lineAtLeast = (block: EvilModeBlock, min: (typeof LINE_IDS)[number]): boolean => LINE_IDS.indexOf(block.team.line) >= LINE_IDS.indexOf(min);

/** Why a Card can't be done now, in plain words; null when it can. Checked by `step`, not only on screen. */
export function tradeReqProblem(block: EvilModeBlock, req: TradeReq, data: EvilData = EVIL_DATA): string | null {
  const def = cardDef(req.cardId, data);
  if (!econOn(data) || !def) return 'There is no such Card.';
  const d = block.district;
  if (!d || d.end) return "The district's over.";
  if (!offered(block, data).includes(def)) return fill(word('notHere', data), { town: townOf(block) });
  if (block.here.beat !== 'dispatch') return word('dispatchOnly', data);
  if (!lineAtLeast(block, def.minLine)) return fill(word('line', data), { line: data.founding.lines.find((l) => l.id === block.team.line)?.name ?? block.team.line });
  const running = block.economy.running;
  if (def.kind === 'racket') {
    if (data.region.on && stageKind(block.here.stage) === 'arrival') return word('arrival', data);
    if (def.creeds && !def.creeds.includes(block.team.creed)) return word('creedOnly', data);
    if (block.team.creed === 'belonging' && def.id !== 'tithe') return word('notOnNeighbours', data);
    const street = req.street ?? heldStreets(block, data)[0];
    if (street === undefined || !heldStreets(block, data).includes(street)) return word('noStreet', data);
    if (streetMood(block, street, data) === 'warm') return fill(word('warmStreet', data), { street: streetName(d, street, data) });
    if (running.some((v) => v.kind === 'racket' && keyOf(v) === districtKey(block) && (v.street === street || v.cardId === def.id))) return fill(word('already', data), { street: streetName(d, street, data) });
  } else if (def.kind === 'front') {
    const h = req.holdingId ? d.holdings.find((x) => x.id === req.holdingId) : frontHoldings(block)[0];
    if (!h || !frontHoldings(block).some((x) => x.id === h.id)) return running.some((v) => v.holdingId === req.holdingId) ? word('frontHere', data) : word('noHolding', data);
  } else if (running.some((v) => v.cardId === def.id && keyOf(v) === districtKey(block))) return fill(word('already', data), { street: def.name });
  if (def.cost > block.team.funds) return fill(word('short', data), { cost: money(def.cost), funds: money(block.team.funds) });
  const { squad } = squadFor(block, def.kind, def.tags, def.needs, data);
  if (!squad.length) return def.kind === 'front' && def.needs ? fill(word('needs', data), { talent: data.people.talents.find((t) => t.id === def.needs)?.name ?? def.needs }) : word('noSquad', data);
  return null;
}

/** A racket's takings a day: the Card's figure (the Tithe's a head), Profit +10%, a Books leading +25%; made honest, its honest figure. */
export function ventureDaily(block: EvilModeBlock, v: Pick<Venture, 'cardId' | 'honest' | 'books' | 'kind'>, data: EvilData = EVIL_DATA): number {
  const def = cardDef(v.cardId, data)!;
  const R = data.economy.rules.racket;
  const base = v.cardId === 'tithe' ? def.daily * inRoster(block).length : v.honest && def.honest ? def.honest.daily : def.daily;
  if (v.kind !== 'racket' || v.honest || base <= 0) return base;
  let n = base;
  if (block.team.creed === 'profit') n = Math.floor((n * (100 + R.profit)) / 100);
  if (v.books) n = Math.floor((n * (100 + R.books)) / 100);
  return n;
}

/** Days of patience a street starts with, by its mood (Power's Protection +2). Null for the Tithe: its patience is the Roster's. */
export function startPatience(block: EvilModeBlock, def: EconCardDef, street: number, data: EvilData = EVIL_DATA): number | null {
  if (def.id === 'tithe') return null;
  const R = data.economy.rules.racket;
  const m = streetMood(block, street, data);
  const p = m === 'easy' ? R.patience.easy : m === 'sullen' || m === 'shut' ? R.patience.sullen : R.patience.wary;
  return p + (block.team.creed === 'power' && def.id === 'protection' ? R.powerPatience : 0);
}

const kindName: Record<string, string> = { racket: 'A RACKET', front: 'A FRONT', work: 'A WORK' };

/** The Honest Card for a trade Card: thirteen fields, always in the same order (Part 12 section 1). */
export function tradeCard(block: EvilModeBlock, req: TradeReq, data: EvilData = EVIL_DATA): CardField[] {
  const def = cardDef(req.cardId, data)!;
  const d = block.district!;
  const street = def.kind === 'racket' ? (req.street ?? heldStreets(block, data)[0] ?? 0) : null;
  const h = def.kind === 'front' ? (req.holdingId ? d.holdings.find((x) => x.id === req.holdingId) : frontHoldings(block)[0]) : undefined;
  const { squad, wont } = squadFor(block, def.kind, def.tags, def.needs, data);
  const vars = { street: street !== null ? streetName(d, street, data) : '', town: townOf(block), person: squad[0]?.name ?? '?', holding: h ? holdingName(h, data) : '?' };
  const T = def.text;
  const where = street !== null ? vars.street : h ? vars.holding : vars.town;
  const books = def.kind === 'racket' && squad[0]?.talent === 'books';
  const daily = ventureDaily(block, { cardId: def.id, honest: false, books, kind: def.kind }, data);
  const blind = street !== null && d.holdings.some((x) => x.kind === 'local' && streetOf(x.step, data) === street && x.scouted === 0);
  const pat = street !== null ? startPatience(block, def, street, data) : null;
  const f: [string, boolean][] = [
    [`${kindName[def.kind]} · ${def.name.toUpperCase()} · ${where.toUpperCase()}`, false],
    [fill(T.takes, vars), false],
    [fill(T.from, vars), blind],
    [def.kind === 'work' || daily <= 0 ? fill(T.gives, vars) : `${money(daily)} a day${def.kind === 'front' ? ', clean: logged as trade' : ''}.${daily !== def.daily && def.id !== 'tithe' ? ` (The Card says ${money(def.daily)}; ${[block.team.creed === 'profit' ? 'Profit +10%' : '', books ? 'a Books leads +25%' : ''].filter(Boolean).join(', ')}.)` : ''}`, false],
    [`${fill(T.moves, vars)}${pat !== null ? ` Patience: about ${pat} days on a ${streetMood(block, street!, data) ?? 'wary'} street.` : ''}${def.cost ? ` Funds ↓ ${money(def.cost)}.` : ''}`, false],
    [def.kind === 'racket' ? word('oddsRacket', data) : word('odds', data), false],
    [squad.map((c, i) => `${c.name}${i === 0 ? ` ${word('lead', data)}` : ''}`).join(', ') || '—', false],
    [wont.length ? wont.map((c) => `${c.name} ("${(data.people.lines.find((l) => l.n === c.line)?.text ?? '').replace(/\.$/, '')}")`).join('. ') : word('nobodyWont', data), false],
    [fill(T.holds, vars), false],
    [fill(T.hero, vars), false],
  ];
  const unknown = f.map(([, u], i) => (u ? data.ledger.fields[i]! : null)).filter((x): x is string => !!x);
  f.push([unknown.length ? unknown.map((n) => `${n}: not scouted.`).join(' ') : word('notKnownNone', data), unknown.length > 0]);
  f.push([fill(T.written, vars), false]);
  f.push([fill(T.other, vars), false]);
  return f.map(([text, u], i) => ({ label: data.ledger.fields[i]!, text, unknown: u }));
}

/** Files a Card (kept with its day) and its Ledger line. */
function file(block: EvilModeBlock, cardId: string, fields: CardField[], who: string[], extra: Partial<LogEntry> = {}): EvilModeBlock {
  const id = `E${block.economy.cards.length + 1}`;
  const b = { ...block, economy: { ...block.economy, cards: [...block.economy.cards, { id, day: block.here.day, cardId, fields: fields.map(packField) }] } };
  return appendLog(b, { kind: 'econ', who, cardId: id, text: `Day ${block.here.day}. ${fields[11]!.text}`, unknowns: fields.slice(0, 10).filter((x) => x.unknown).length, ...extra });
}

const busy = (block: EvilModeBlock, ids: string[]): EvilModeBlock['economy'] => {
  const e = block.economy;
  const prev = e.busy.day === block.here.day ? e.busy.ids : [];
  return { ...e, busy: { day: block.here.day, ids: [...prev, ...ids] } };
};
const cap = (n: number) => Math.max(0, Math.min(10, n));

export interface TradeResult { block: EvilModeBlock; problem: string | null; lines: string[] }

/** Starting a racket, opening a Front, or building a Work, from its Card (at Dispatch: a squad's day). */
export function trade(block: EvilModeBlock, req: TradeReq, data: EvilData = EVIL_DATA): TradeResult {
  const problem = tradeReqProblem(block, req, data);
  if (problem) return { block, problem, lines: [] };
  const def = cardDef(req.cardId, data)!;
  const d = block.district!;
  const R = data.economy.rules;
  const fields = tradeCard(block, req, data);
  const { squad } = squadFor(block, def.kind, def.tags, def.needs, data);
  const ids = squad.map((c) => c.id);
  let b = file(block, def.id, fields, ids);
  // A Work's Regard comes when it's finished; a racket's or a Front's at the start.
  let team = { ...b.team, funds: b.team.funds - def.cost, regard: def.kind === 'work' ? b.team.regard : cap(b.team.regard + def.moves.regard) };
  let crew = b.crew;
  const lines: string[] = [];
  const base: Omit<Venture, 'kind' | 'street' | 'holdingId' | 'person' | 'patience' | 'backRoom' | 'openIn' | 'doneOn' | 'done' | 'books'> = { id: `V${b.economy.cards.length}`, cardId: def.id, region: d.region, district: d.n, since: b.here.day, waivedOn: null, honest: false, straight: [] };
  let v: Venture;
  if (def.kind === 'racket') {
    const street = req.street ?? heldStreets(block, data)[0]!;
    const quiet = def.minLine === 'clean';
    v = { ...base, kind: 'racket', street, holdingId: null, person: null, patience: startPatience(block, def, street, data), backRoom: null, openIn: [], doneOn: null, done: false, books: squad[0]?.talent === 'books' };
    if (!quiet) {
      team = { ...team, dread: cap(team.dread + def.moves.dread) };
      const loud = R.racket.startHeat + def.moves.heat;
      const e = b.economy;
      b = { ...b, economy: { ...e, loud: { day: b.here.day, heat: Math.max(loud, e.loud?.day === b.here.day ? e.loud.heat : -99) } } };
      // Wonder (and Spite, away from its Target): "This isn't what we're here for." Loyalty −1 at the start.
      if (team.creed === 'wonder' || team.creed === 'spite') crew = crew.map((c) => (c.where === 'in' ? moveLoyalty(c, R.racket.wonderLoyalty, data) : c));
    }
    lines.push(fill(word('started', data), { name: def.name, street: streetName(d, street, data), dread: quiet ? 0 : def.moves.dread }));
  } else if (def.kind === 'front') {
    const h = req.holdingId ? d.holdings.find((x) => x.id === req.holdingId)! : frontHoldings(block)[0]!;
    const room = def.backRoom === false ? null : true;
    v = { ...base, kind: 'front', street: null, holdingId: h.id, person: ids[0]!, patience: null, backRoom: room, openIn: room ? [districtKey(block)] : [], doneOn: null, done: true, books: false };
    lines.push(fill(word('built', data), { name: def.name }));
  } else {
    v = { ...base, kind: 'work', street: null, holdingId: null, person: null, patience: null, backRoom: null, openIn: [], doneOn: def.running ? null : b.here.day + Math.max(1, def.days) - 1, done: false, books: false };
    // Feed the District: Loyalty +1, everyone, at the start.
    if (def.running) crew = crew.map((c) => (c.where === 'in' ? moveLoyalty(c, def.moves.loyalty, data) : c));
    lines.push(def.running ? `${def.name} runs from today.` : `${def.name}: ${def.days} day${def.days === 1 ? '' : 's'} to build.`);
  }
  b = { ...b, team, crew, economy: { ...busy(b, def.kind === 'front' ? [] : ids), running: [...b.economy.running, v] } };
  return { block: b, problem: null, lines };
}

/** The Boss's hand on something running (Part 12 section 2.2 and 2.5, Part 13 section 1.1). */
export type VentureAct = 'waive' | 'end' | 'honest' | 'backRoom';

export function ventureProblem(block: EvilModeBlock, id: string, act: VentureAct, data: EvilData = EVIL_DATA): string | null {
  const v = block.economy.running.find((x) => x.id === id);
  if (!econOn(data) || !v) return 'Nothing by that name is running.';
  const def = cardDef(v.cardId, data)!;
  if (act === 'backRoom') return v.kind !== 'front' ? 'Only a Front has a back room.' : v.backRoom === null ? word('noBackRoom', data) : null;
  if (v.kind !== 'racket') return 'Only a racket can be waived, ended or made honest.';
  if (block.district?.end) return "The district's over.";
  if (act === 'waive' || act === 'end') {
    if (block.here.beat !== 'morning') return word('morningOnly', data);
    if (v.honest) return `${def.honest!.name} isn't a racket any more.`;
    if (act === 'waive' && v.waivedOn === block.here.day) return 'Already waived today.';
    return null;
  }
  if (v.honest) return 'Already honest.';
  if (!def.honest) return 'There is no honest version of this.';
  if (block.here.beat !== 'morning' && block.here.beat !== 'dispatch') return 'Only at Morning or Dispatch.';
  const cost = honestCost(def, data);
  return cost > block.team.funds ? fill(word('short', data), { cost: money(cost), funds: money(block.team.funds) }) : null;
}

/** The honest version's price, less a tenth: the team already knows the street (Part 12 section 2.5). */
export const honestCost = (def: EconCardDef, data: EvilData = EVIL_DATA): number => Math.floor(((def.honest?.cost ?? 0) * (100 - data.economy.rules.racket.honestOff)) / 100);

/** The Card for making a racket honest: the same Card; only field 12 changes (and what it costs). */
export function honestCard(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): CardField[] {
  const v = block.economy.running.find((x) => x.id === id)!;
  const def = cardDef(v.cardId, data)!;
  const d = block.district!;
  const street = v.street !== null ? streetName(d, v.street, data) : '';
  const fields: [string, string][] = [
    [`${def.honest!.name.toUpperCase()} · MADE HONEST · ${street.toUpperCase()}`, ''],
    [`${money(honestCost(def, data))} of the team's (the price, less a tenth: the team knows the street).`, ''],
    [fill(def.text.from, { street, town: townOf(block) }), ''],
    [`${money(def.honest!.daily)} a day, for good.`, ''],
    [`Funds ↓ ${money(honestCost(def, data))}. The street: each one warmer.`, ''],
    [word('odds', data), ''],
    ['—', ''],
    [word('nobodyWont', data), ''],
    ['Holds, for good. It never turns again.', ''],
    ['The Hero\'s told: "Somebody over there changed their mind."', ''],
    [word('notKnownNone', data), ''],
    [def.honest!.written, ''],
    [`The quicker way: keep the racket. ${money(ventureDaily(block, v, data))} a day, until ${street}'s patience runs out.`, ''],
  ];
  return fields.map(([text], i) => ({ label: data.ledger.fields[i]!, text, unknown: false }));
}

const warmStreet = (holdings: Holding[], street: number, by: number, data: EvilData): Holding[] => holdings.map((h) => ((h.kind === 'local' || h.kind === 'floor') && streetOf(h.step, data) === street ? { ...h, mood: shiftMood(h.mood, by) } : h));

export function ventureAct(block: EvilModeBlock, id: string, act: VentureAct, data: EvilData = EVIL_DATA): TradeResult {
  const problem = ventureProblem(block, id, act, data);
  if (problem) return { block, problem, lines: [] };
  const v = block.economy.running.find((x) => x.id === id)!;
  const def = cardDef(v.cardId, data)!;
  const d = block.district!;
  const W = data.economy.written;
  const street = v.street !== null ? streetName(d, v.street, data) : '';
  const set = (b: EvilModeBlock, f: (x: Venture) => Venture | null): EvilModeBlock => ({ ...b, economy: { ...b.economy, running: b.economy.running.map((x) => (x.id === id ? f(x) : x)).filter((x): x is Venture => !!x) } });
  const log = (b: EvilModeBlock, text: string, extra: Partial<LogEntry> = {}) => appendLog(b, { kind: 'econ', who: [], text: `Day ${b.here.day}. ${text}`, ...extra });
  if (act === 'backRoom') {
    const open = !v.backRoom;
    const k = districtKey(block);
    let b = set(block, (x) => ({ ...x, backRoom: open, openIn: x.openIn.includes(k) ? x.openIn : [...x.openIn, k] }));
    b = log(b, fill(open ? W.backOpen! : W.backShut!, { name: def.name }));
    return { block: b, problem: null, lines: [fill(word(open ? 'backOpen' : 'backShut', data), { name: def.name })] };
  }
  if (act === 'waive') {
    const b = log(set(block, (x) => ({ ...x, waivedOn: block.here.day })), fill(W.waive!, { name: def.name }), { given: data.ledger.count.waive });
    return { block: b, problem: null, lines: [fill(word('waived', data), { name: def.name })] };
  }
  if (act === 'end') {
    const early = (v.patience ?? 0) >= data.economy.rules.racket.endEarlyLeft;
    let b = set(block, () => null);
    if (early && v.street !== null) b = { ...b, district: { ...d, holdings: warmStreet(d.holdings, v.street, 1, data) } };
    b = log(b, fill(W.end!, { name: def.name, street }));
    return { block: b, problem: null, lines: [fill(word(early ? 'endedEarly' : 'ended', data), { name: def.name, street })] };
  }
  // Made honest: the same Card, field 12 changes. It costs the honest price less a tenth; it pays less, for good, and never turns.
  const fields = honestCard(block, id, data);
  let b = file(block, def.id, fields, []);
  b = set(b, (x) => ({ ...x, honest: true, patience: null }));
  b = { ...b, team: { ...b.team, funds: b.team.funds - honestCost(def, data) } };
  if (v.street !== null) b = { ...b, district: { ...b.district!, holdings: warmStreet(b.district!.holdings, v.street, 1, data).map((h) => (h.owner === 'team' && streetOf(h.step, data) === v.street ? { ...h, holds: true } : h)) } };
  // The Tithe made a Subscription: the Ledger, open in the Hall. Loyalty +1.
  if (def.id === 'tithe') b = { ...b, crew: b.crew.map((c) => (c.where === 'in' ? moveLoyalty(c, 1, data) : c)) };
  return { block: b, problem: null, lines: [fill(word('honest', data), { name: def.name, honest: def.honest!.name, says: def.honest!.says })] };
}

// ---- The Evening: what's running pays, runs down, finishes; upkeep (Part 12 section 2.2, Part 13 sections 1.1 and 2.1) ----

export interface EconEvening { block: EvilModeBlock; income: number; upkeep: number; loud: number | null; lines: string[] }

export function econEvening(block: EvilModeBlock, data: EvilData = EVIL_DATA): EconEvening {
  if (!econOn(data) || !block.district) return { block, income: 0, upkeep: 0, loud: null, lines: [] };
  const R = data.economy.rules;
  const day = block.here.day;
  const d = block.district;
  const here = districtKey(block);
  let b = block;
  let holdings = d.holdings;
  let team = { ...b.team };
  let crew = b.crew;
  let n = b.draws['evil-economy'] ?? 0;
  const lines: string[] = [];
  const rackets: string[] = [];
  const fronts: string[] = [];
  const upkeeps: string[] = [];
  let racketsIn = 0;
  let frontsIn = 0;
  let upkeep = 0;
  let floor = false;
  const logs: Omit<LogEntry, 'id' | 'day' | 'region' | 'district'>[] = [];
  const worksIn = [...b.economy.worksIn];
  const running: Venture[] = [];
  const W = data.economy.written;
  const heroAt = b.hero && b.hero.home ? b.hero.at : null;
  const leanedToday = new Set(b.log.filter((e) => e.kind === 'job' && e.day === day && e.method === 'lean' && e.result === 'went' && e.to).map((e) => e.to!));
  for (const v0 of b.economy.running) {
    let v: Venture | null = { ...v0 };
    const def = cardDef(v.cardId, data)!;
    const weekly = (day - v.since) > 0 && (day - v.since) % R.work.feedWeek === 0 && !v.honest ? def.weekly : undefined;
    if (v.kind === 'racket') {
      const street = v.street !== null ? streetName(d, v.street, data) : '';
      if (v.waivedOn === day) {
        if (v.patience !== null) v = { ...v, patience: v.patience + R.racket.waive };
      } else {
        const amt = ventureDaily({ ...b, team, crew }, v, data);
        racketsIn += amt;
        rackets.push(`${v.honest ? def.honest!.name : def.name} ${money(amt)}`);
        if (v.patience !== null && v.street !== null) {
          const before = v.patience;
          let p = before;
          if (team.dread >= R.racket.dreadFreeze) {
            // Dread 6+: it doesn't run down, until somebody's had enough alone: one in ten an Evening (Part 12 section 2.4).
            if (roll(d.seed, n++, R.racket.breakOneIn) === 1) {
              p = 0;
              const acts = words('acts', data);
              lines.push(fill(word('broke', data), { street, act: acts[(day + v.street) % acts.length]! }));
            }
          } else {
            const st = v.street;
            const leaned = d.holdings.some((h) => leanedToday.has(h.id) && streetOf(h.step, data) === st);
            const s = data.district.streets[st];
            const near = heroAt !== null && s ? Math.min(Math.abs(heroAt - s.from), Math.abs(heroAt - s.to), heroAt >= s.from && heroAt <= s.to ? 0 : 99) <= R.racket.heroSteps : false;
            p = Math.max(0, p - 1 + (leaned ? R.racket.leanOnStreet : 0) + (near ? R.racket.heroNear : 0));
          }
          v = { ...v, patience: p };
          if (p > 0 && p <= R.racket.warnAt && before > R.racket.warnAt) lines.push(fill(word('warn', data), { street }));
          if (p === 0) {
            // Shut: the street goes to the Hero, or the constable. Heat +2. What would turn on it, turned.
            team = { ...team, heat: cap(team.heat + R.racket.shutHeat) };
            const stn = v.street;
            holdings = holdings.map((h) => {
              if (streetOf(h.step, data) !== stn || h.kind === 'gym' || h.kind === 'town') return h;
              if (h.owner === 'team' && !h.holds) {
                const { method: _m, since: _s, ...rest } = h;
                return { ...rest, owner: 'nobody', mood: shiftMood(h.mood, -1) };
              }
              return h.kind === 'local' || h.kind === 'floor' ? { ...h, mood: h.mood === 'warm' ? h.mood : shiftMood(h.mood, -1) } : h;
            });
            lines.push(fill(word('shut', data), { street, name: def.name, heat: R.racket.shutHeat }));
            logs.push({ kind: 'econ', who: [], text: `Day ${day}. ${fill(W.shut!, { street, name: def.name })}` });
            v = null;
          }
        }
      }
      if (v && !v.honest && keyOf(v) === here) floor = true;
    } else if (v.kind === 'front') {
      const amt = ventureDaily({ ...b, team, crew }, v, data);
      if (amt > 0) {
        frontsIn += amt;
        fronts.push(`${def.name} ${money(amt)}`);
      }
    } else if (def.running) {
      upkeep += -def.daily;
      upkeeps.push(`${def.name} ${money(-def.daily)}`);
    } else if (!v.done && v.doneOn !== null && v.doneOn <= day) {
      // A Work's finished: Regard; Heat −2 for the first in a district; Loyalty +1 to the kind; Given +1.
      v = { ...v, done: true };
      const k = keyOf(v);
      const first = !worksIn.includes(k);
      if (first) worksIn.push(k);
      team = { ...team, regard: cap(team.regard + def.moves.regard), heat: first ? cap(team.heat + R.work.firstHeat) : team.heat };
      crew = crew.map((c) => (c.where === 'in' && ((c.talent && R.work.kindTalents.includes(c.talent)) || (c.flaw && R.work.kindFlaws.includes(c.flaw))) ? moveLoyalty(c, def.moves.loyalty, data) : c));
      lines.push(fill(word('buildingDone', data), { name: def.name, gives: `Regard +${def.moves.regard}.${first ? ` Heat ${R.work.firstHeat}: the first Work here.` : ''}` }));
      logs.push({ kind: 'econ', who: [], text: `Day ${day}. ${def.text.written}`, given: R.work.given });
    }
    if (v && weekly) {
      team = { ...team, dread: cap(team.dread + (weekly.dread ?? 0)), regard: cap(team.regard + (weekly.regard ?? 0)) };
      lines.push(`${def.name}: a week. ${weekly.dread ? `Dread ${weekly.dread > 0 ? '+' : ''}${weekly.dread}.` : ''}${weekly.regard ? ` Regard ${weekly.regard > 0 ? '+' : ''}${weekly.regard}.` : ''}`.trim());
    }
    if (v) running.push(v);
  }
  if (racketsIn) lines.unshift(fill(word('racketsPay', data), { amount: money(racketsIn), what: rackets.join(', ') }));
  if (frontsIn) lines.unshift(fill(word('frontsPay', data), { amount: money(frontsIn), what: fronts.join(', ') }));
  if (upkeep) lines.push(fill(word('upkeep', data), { amount: money(upkeep), what: upkeeps.join(', ') }));
  b = { ...b, team, crew, district: { ...d, holdings }, draws: { ...b.draws, 'evil-economy': n }, economy: { ...b.economy, running, worksIn } };
  for (const e of logs) b = appendLog(b, e);
  const started = b.economy.loud?.day === day ? b.economy.loud.heat : null;
  // A running racket's a floor under Heat: on a day it's the loudest, Heat stays where it is (Part 12 section 2.1).
  const loud = started !== null ? started : floor ? 0 : null;
  return { block: b, income: racketsIn + frontsIn, upkeep, loud, lines };
}

/** The district's over: its rackets end with it (nobody's there to collect); Feed the District ends; Fronts run well add Regard; Going Straight counts. */
export function econDistrictEnd(block: EvilModeBlock, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  if (!econOn(data) || !block.district) return { block, lines: [] };
  const R = data.economy.rules;
  const d = block.district;
  const here = districtKey(block);
  const lines: string[] = [];
  let runWell = 0;
  const running: Venture[] = [];
  for (const v of block.economy.running) {
    const def = cardDef(v.cardId, data)!;
    if (keyOf(v) === here && v.kind === 'racket' && !v.honest) {
      lines.push(fill(word('leftBehind', data), { name: def.name, street: v.street !== null ? streetName(d, v.street, data) : '' }));
      continue;
    }
    if (keyOf(v) === here && v.kind === 'work' && def.running) {
      lines.push(word('feedEnds', data));
      continue;
    }
    if (v.kind === 'front') {
      const p = block.crew.find((c) => c.id === v.person);
      if (p && p.where === 'in' && (!def.needs || p.talent === def.needs) && p.loyalty >= R.front.runWellLoyalty) {
        runWell += 1;
        lines.push(fill(word('runWell', data), { name: def.name, n: R.front.regardEach }));
      }
      // Going Straight: in profit, back room shut throughout this district, and open before it began (Part 13 section 1.3).
      if (keyOf(v) !== here && v.backRoom !== true && !v.openIn.includes(here) && def.daily > 0 && !v.straight.includes(here)) running.push({ ...v, straight: [...v.straight, here] });
      else running.push(v);
      continue;
    }
    running.push(v);
  }
  const team = { ...block.team, regard: cap(block.team.regard + Math.min(R.front.regardMost, runWell * R.front.regardEach)) };
  const out: EvilModeBlock = { ...block, team, economy: { ...block.economy, running } };
  const straight = goingStraight(out);
  if (straight > 0) lines.push(fill(word('straight', data), { n: straight, of: R.front.straightNeeds }));
  return { block: out, lines };
}

/** Fronts that have turned a profit with the back room shut for a whole district (three open Going Straight; Part 13 section 1.3). */
export const goingStraight = (block: EvilModeBlock): number => block.economy.running.filter((v) => v.kind === 'front' && v.straight.length > 0).length;

// ---- Bankrupt (Part 5 section 2.4): three stages, a day each; none ends the run ----

export const brokeStage = (block: EvilModeBlock): 0 | 1 | 2 | 3 => (Math.min(3, block.economy.broke) as 0 | 1 | 2 | 3);

/** A short Evening's Loyalty by stage: Short, nothing falls; Broke, those paid least −1; Bust, everyone −1. */
export function shortLoyalty(block: EvilModeBlock, crew: Crew[], stage: number, data: EvilData = EVIL_DATA): { crew: Crew[]; line: string } {
  const R = data.economy.rules.bankrupt;
  const inn = crew.filter((c) => c.where === 'in');
  if (stage <= 1) return { crew, line: word('short1', data) };
  if (stage === 2) {
    // Paid least: the lowest rank on the Roster (Grunts before Leads; an Officer's share is never the least).
    const least = Math.min(...inn.map((c) => RANKS.indexOf(c.rank)));
    const who = inn.filter((c) => RANKS.indexOf(c.rank) === least);
    return { crew: crew.map((c) => (who.includes(c) ? moveLoyalty(c, R.lowestFirst, data) : c)), line: fill(word('short2', data), { names: who.map((c) => c.name).join(', ') }) };
  }
  return { crew: crew.map((c) => (c.where === 'in' ? moveLoyalty(c, R.everyone, data) : c)), line: word('short3', data) };
}

export type BustWay = 'lastJob' | 'sell' | 'whip';

/** A day's wage bill (what the Whip-Round pays). */
export const wageBill = (block: EvilModeBlock, data: EvilData = EVIL_DATA): number => inRoster(block).reduce((n, c) => n + wageOf(block, c, 0, data), 0);

export function bustProblem(block: EvilModeBlock, way: BustWay, id: string | null = null, data: EvilData = EVIL_DATA): string | null {
  if (!econOn(data) || !block.district || block.district.end) return 'Not now.';
  const R = data.economy.rules.bankrupt;
  const st = block.economy.broke;
  if (st === 0) return word('notBroke', data);
  if (block.here.beat !== 'dispatch') return word('dispatchOnly', data);
  if (way === 'lastJob') {
    if (st < R.lastJobFrom) return `From the day the team's Broke (day ${R.lastJobFrom}).`;
    if (block.economy.lastJob) return word('lastJobOnce', data);
    if (!lineAtLeast(block, data.economy.bust.lastJob.minLine)) return fill(word('line', data), { line: data.founding.lines.find((l) => l.id === block.team.line)?.name ?? block.team.line });
    const L = data.economy.bust.lastJob;
    return squadFor(block, 'lastJob', L.tags, null, data).squad.length ? null : word('noSquad', data);
  }
  if (way === 'sell') {
    if (st < R.sellFrom) return `From the day the team's Bust (day ${R.sellFrom}).`;
    const f = block.economy.running.find((v) => v.kind === 'front' && (id === null || v.id === id));
    return f ? null : word('noFront', data);
  }
  if (st < R.whipFrom) return `From the day the team's Bust (day ${R.whipFrom}).`;
  if (block.team.regard < R.whipRegard) return word('whipRegard', data);
  if (block.economy.whip.includes(block.here.region)) return word('whipOnce', data);
  return null;
}

/** The locals who'd put money in a tin: those the team asked (Persuade) or did right by, in this district. */
const tinNames = (block: EvilModeBlock, data: EvilData): string[] => (block.district?.holdings ?? []).filter((h) => h.owner === 'team' && (h.method === 'persuade' || h.method === 'outplay') && localOf(h, data)).map((h) => localOf(h, data)!.who.replace(/,.*$/, ''));

/** The Card for a way out of bankruptcy (thirteen fields, like any). */
export function bustCard(block: EvilModeBlock, way: BustWay, id: string | null = null, data: EvilData = EVIL_DATA): CardField[] {
  const B = data.economy.bust;
  const f = block.economy.running.find((v) => v.kind === 'front' && (id === null || v.id === id));
  const fdef = f ? cardDef(f.cardId, data) : undefined;
  const sellAmt = fdef ? Math.floor((fdef.cost * data.economy.rules.bankrupt.sellBack) / 100) : 0;
  const names = tinNames(block, data);
  const vars = { name: fdef?.name ?? '', person: block.crew.find((c) => c.id === f?.person)?.name ?? '', amount: money(way === 'whip' ? wageBill(block, data) : sellAmt), names: names.length ? names.join(', ') : B.whip.names };
  const def = way === 'lastJob' ? B.lastJob : way === 'sell' ? B.sell : B.whip;
  const T = def.text;
  const sq = way === 'lastJob' ? squadFor(block, 'lastJob', B.lastJob.tags, null, data) : { squad: [] as Crew[], wont: [] as Crew[] };
  const rows: string[] = [
    `${def.name.toUpperCase()}${way === 'sell' && fdef ? ` · ${fdef.name.toUpperCase()}` : ''}`,
    fill(T.takes, vars), fill(T.from, vars), fill(T.gives, vars), fill(T.moves, vars),
    word('odds', data),
    sq.squad.length ? sq.squad.map((c, i) => `${c.name}${i === 0 ? ` ${word('lead', data)}` : ''}`).join(', ') : way === 'whip' ? 'The Boss, in the Mess.' : '—',
    sq.wont.length ? sq.wont.map((c) => c.name).join(', ') : word('nobodyWont', data),
    fill(T.holds, vars), fill(T.hero, vars), word('notKnownNone', data), fill(T.written, vars), fill(T.other, vars),
  ];
  return rows.map((text, i) => ({ label: data.ledger.fields[i]!, text, unknown: false }));
}

export function bust(block: EvilModeBlock, way: BustWay, id: string | null = null, data: EvilData = EVIL_DATA): TradeResult {
  const problem = bustProblem(block, way, id, data);
  if (problem) return { block, problem, lines: [] };
  const fields = bustCard(block, way, id, data);
  const B = data.economy.bust;
  if (way === 'lastJob') {
    const sq = squadFor(block, 'lastJob', B.lastJob.tags, null, data).squad.map((c) => c.id);
    let b = file(block, 'lastJob', fields, sq, { taken: B.lastJob.taken });
    b = { ...b, team: { ...b.team, funds: b.team.funds + B.lastJob.gives, heat: cap(b.team.heat + B.lastJob.heat), dread: cap(b.team.dread + B.lastJob.dread) }, economy: { ...busy(b, sq), lastJob: true } };
    return { block: b, problem: null, lines: [fill(word('lastJob', data), { amount: money(B.lastJob.gives), heat: B.lastJob.heat, dread: B.lastJob.dread })] };
  }
  if (way === 'sell') {
    const f = block.economy.running.find((v) => v.kind === 'front' && (id === null || v.id === id))!;
    const def = cardDef(f.cardId, data)!;
    const amount = Math.floor((def.cost * data.economy.rules.bankrupt.sellBack) / 100);
    let b = file(block, 'sell', fields, f.person ? [f.person] : []);
    b = { ...b, team: { ...b.team, funds: b.team.funds + amount }, economy: { ...b.economy, running: b.economy.running.filter((v) => v.id !== f.id) } };
    return { block: b, problem: null, lines: [fill(word('sold', data), { name: def.name, amount: money(amount) })] };
  }
  const amount = wageBill(block, data);
  const n = data.economy.rules.bankrupt.whipLoyalty;
  let b = file(block, 'whip', fields, [], { given: tinNames(block, data).length || 1 });
  b = { ...b, team: { ...b.team, funds: b.team.funds + amount }, crew: b.crew.map((c) => (c.where === 'in' ? moveLoyalty(c, n, data) : c)), economy: { ...b.economy, whip: [...b.economy.whip, block.here.region] } };
  return { block: b, problem: null, lines: [fill(word('whip', data), { amount: money(amount), n })] };
}
