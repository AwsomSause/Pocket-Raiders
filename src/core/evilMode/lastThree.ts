// Evil Mode slice 20: the last three regions (design Part 26c; Part 8d; Part 15b sections 3 to 6; Part 5 section 2.6).
// Alola: no Gyms, so Buy and Replace are shut everywhere and say who shut them; each island's guardian has a regard no
// method moves; Aether is a third team (one conversation, three words); the girl with the bag. Galar: a pitch on
// television (a Beat's handshake turns its Dread into Regard), the Chairman's loan and its clause, the away ends.
// Paldea: the canteen tables, and Team Star with every lock: a Star base is reached by nothing but a Visit, and the
// stance list never shows War, Rivals, Front or Merger. Pure: new blocks are returned. Words and numbers are in
// region.json (`lastThree`) and neighbour.json. No stream is drawn here.

import { holdingName, kindDef, shiftMood } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { appendLog, fill, money } from './ledger';
import { defOf } from './neighbour';
import { moveLoyalty } from './people';
import { dayIn } from './region';
import type { EvilModeBlock, Holding, L3State, LastThreeDef, NeighbourState, Stance } from './schema';

export interface L3Out { block: EvilModeBlock; problem: string | null; lines: string[] }
const ok = (block: EvilModeBlock, lines: string[]): L3Out => ({ block, problem: null, lines });
const no = (block: EvilModeBlock, problem: string): L3Out => ({ block, problem, lines: [] });
const cap = (n: number) => Math.max(0, Math.min(10, n));

export const EMPTY_L3: L3State = { loan: null, offered: null, shake: null, aether: null, bag: null, bagAsk: false, visited: [], guardian: [] };
export const L3 = (data: EvilData = EVIL_DATA): LastThreeDef | undefined => (data.region.on ? data.region.lastThree : undefined);
export const l3Of = (block: Pick<EvilModeBlock, 'region'>): L3State => block.region.l3 ?? EMPTY_L3;
const putL3 = (block: EvilModeBlock, l3: L3State): EvilModeBlock => ({ ...block, region: { ...block.region, l3 } });
const inRegion = (block: Pick<EvilModeBlock, 'region'>, id: string | undefined, data: EvilData): boolean => data.region.on && !!id && block.region.id === id;
/** The district's stage index (0 the Arrival .. 7 the Reckoning). */
const stageN = (block: Pick<EvilModeBlock, 'here'>): number => block.here.stage - 1;

// ---- Alola: Buy and Replace shut everywhere, and who shut them (Part 8d section A.1) ----

/** Who shut a Gym way for the whole region, and why; null when the region leaves it open. */
export function regionShut(block: Pick<EvilModeBlock, 'here'>, way: string, data: EvilData = EVIL_DATA): { by: string; why: string } | null {
  const def = data.region.on ? data.region.regions.find((r) => r.index === block.here.region) : undefined;
  const s = def?.status === 'supported' || def?.status === 'limited' ? def.shut : undefined;
  if (!s || !(s.ways as readonly string[]).includes(way)) return null;
  return { by: s.by, why: s.why[way] ?? s.by };
}

// ---- Paldea: Team Star's locks (Part 15b section 5.1; Part 8d section P.1) ----

export const isStarBase = (h: Pick<Holding, 'kind'> | undefined): boolean => h?.kind === 'starBase';
/** The neighbour here keeps every lock: children (`minors`) with no War (`noWar`). */
export const lockedNeighbour = (block: Pick<EvilModeBlock, 'neighbour'>, data: EvilData = EVIL_DATA): boolean => {
  const nb = block.neighbour;
  if (!nb) return false;
  const def = defOf(nb, data);
  return !!def && def.minors && !!def.noWar;
};
/** The stances a locked neighbour can never stand at: they aren't on its screen (Part 1, E20). */
export const STAR_NEVER: readonly Stance[] = ['war', 'rivals', 'front', 'merger'];

/** A locked neighbour pulled back to Wary from any stance it can't have. Every step ends here, so no path reaches one. */
export function starLocks(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const nb = block.neighbour;
  if (!nb || !lockedNeighbour(block, data) || !STAR_NEVER.includes(nb.stance)) return block;
  const n: NeighbourState = { ...nb, stance: 'wary', whose: null };
  return { ...block, neighbour: n };
}

/** Every holding id an action names (a job's, a request's, a post's, a Scheme way's, a Dig's). */
function holdingIds(a: { type: string } & Record<string, unknown>): string[] {
  const out: string[] = [];
  if (typeof a.holdingId === 'string') out.push(a.holdingId);
  for (const k of ['job', 'req', 'piece']) {
    const o = a[k] as { holdingId?: unknown } | undefined;
    if (o && typeof o.holdingId === 'string') out.push(o.holdingId);
  }
  return out;
}

/**
 * The Star enumeration (build plan slice 20): no action of any kind reaches a Star base but a Visit, and nothing puts
 * Star at War, in the Chair, under a Merger, at the Pen or in the person slot. Asked by `canDo` before every step.
 */
export function starRefusal(block: EvilModeBlock, a: { type: string } & Record<string, unknown>, data: EvilData = EVIL_DATA): string | null {
  const T = L3(data)?.star;
  const refused = T?.refused ?? 'Not a child. Nothing in the mode does that.';
  const hs = block.district?.holdings ?? [];
  if (a.type !== 'regionAct' && holdingIds(a).some((id) => isStarBase(hs.find((h) => h.id === id)))) return refused;
  if (a.type === 'regionAct' && typeof a.code === 'string' && !a.code.startsWith('visit:')) {
    const id = a.code.split(':')[1];
    if (id && isStarBase(hs.find((h) => h.id === id))) return refused;
  }
  if (lockedNeighbour(block, data)) {
    if (a.type === 'chair') return refused;
    if (a.type === 'table' && (a.thing === 'person' || a.thing === 'pen')) return refused;
  }
  return null;
}

/** A Visit: the Boss, in person, at a Star base's gate. Never a method, never a job (Part 15b section 5.1). */
function visit(block: EvilModeBlock, id: string, data: EvilData): L3Out {
  const T = L3(data)!.star;
  const h = block.district?.holdings.find((x) => x.id === id);
  if (!h || !isStarBase(h)) return no(block, 'There is no Star base there.');
  if (block.here.beat !== 'inPerson') return no(block, 'In person only: at the In person beat.');
  if (block.inPerson?.day === block.here.day) return no(block, 'The Boss has already been out today.');
  const l3 = l3Of(block);
  if (l3.visited.includes(id)) return no(block, T.visited);
  const nb = block.neighbour;
  const v = nb ? defOf(nb, data).visits?.[String(stageN(block))] : undefined;
  const lines = [v ? `${v.crew}: ${v.says}` : fill(T.visitAct, { where: holdingName(h, data) })];
  let out = putL3({ ...block, inPerson: { day: block.here.day, holdingId: id } }, { ...l3, visited: [...l3.visited, id] });
  if (nb) out = { ...out, neighbour: { ...nb, opinion: Math.max(-3, Math.min(3, nb.opinion + T.opinion)) } };
  out = appendLog(out, { kind: 'neighbour', who: [], to: id, text: `Visited ${holdingName(h, data)}. Nobody was sent: the Boss went.` });
  return ok(out, lines);
}

// ---- Galar: the pitch (Part 8d section G.1) ----

/** After a Gym battle on a televised pitch: a won Beat waits on the handshake. */
export function afterGym(before: EvilModeBlock, after: EvilModeBlock, won: boolean, data: EvilData = EVIL_DATA): { block: EvilModeBlock; lines: string[] } {
  const P = L3(data)?.pitch;
  if (!P || !won || !inRegion(before, P.region, data) || before.fight?.kind !== 'gym') return { block: after, lines: [] };
  return { block: putL3(after, { ...l3Of(after), shake: after.here.day }), lines: [P.ask] };
}

function shake(block: EvilModeBlock, yes: boolean, data: EvilData): L3Out {
  const P = L3(data)!.pitch;
  const l3 = l3Of(block);
  if (l3.shake !== block.here.day) return no(block, 'No match today.');
  let out = putL3(block, { ...l3, shake: null });
  if (yes) out = { ...out, team: { ...out.team, dread: cap(out.team.dread - 1), regard: cap(out.team.regard + 1) } };
  out = appendLog(out, { kind: 'gym', who: [], text: yes ? P.yes : P.no });
  return ok(out, [yes ? P.yes : P.no]);
}

// ---- Galar: the Chairman's loan and its clause (Part 5 section 2.6; Part 15b section 4.3) ----

const loanOn = (block: Pick<EvilModeBlock, 'region'>, data: EvilData): boolean => inRegion(block, L3(data)?.loan.region, data);

/** The loan's Honest Card: thirteen fields, the clause in the thirteenth (Part 26c section 2.1). */
export const loanCard = (data: EvilData = EVIL_DATA): [string, string][] => (L3(data)?.loan.card ?? []).map(([a, b]) => [a, b]);

function takeLoan(block: EvilModeBlock, data: EvilData): L3Out {
  const K = L3(data)!.loan;
  const l3 = l3Of(block);
  if (l3.offered !== 'open') return no(block, 'Nobody has offered a loan.');
  const amount = K.amount;
  let out = putL3({ ...block, team: { ...block.team, funds: block.team.funds + amount } }, { ...l3, offered: 'taken', loan: { owed: amount, day: block.here.day, asked: false, vested: false, repaid: false } });
  out = appendLog(out, { kind: 'econ', who: [], text: fill(K.take, { amount: money(amount) }) });
  return ok(out, [fill(K.take, { amount: money(amount) })]);
}

function repay(block: EvilModeBlock, data: EvilData): L3Out {
  const K = L3(data)!.loan;
  const l3 = l3Of(block);
  const ln = l3.loan;
  if (!ln || ln.owed <= 0 || ln.vested) return no(block, 'Nothing is owed.');
  if (block.team.funds < ln.owed) return no(block, fill(K.short, { owed: money(ln.owed) }));
  let out = putL3({ ...block, team: { ...block.team, funds: block.team.funds - ln.owed } }, { ...l3, loan: { ...ln, owed: 0, repaid: true } });
  out = appendLog(out, { kind: 'econ', who: [], text: K.repaid });
  return ok(out, [K.repaid]);
}

/** The clause: every Front vests in Macro Cosmos. Only the Fronts; the debt's settled by them (Part 15b section 4.3). */
function vest(block: EvilModeBlock, line: string, data: EvilData): EvilModeBlock {
  const K = L3(data)!.loan;
  const l3 = l3Of(block);
  if (!l3.loan || l3.loan.vested || l3.loan.owed <= 0) return block;
  const fronts = block.economy.running.filter((v) => v.kind === 'front');
  let out = putL3({ ...block, economy: { ...block.economy, running: block.economy.running.filter((v) => v.kind !== 'front') } }, { ...l3, loan: { ...l3.loan, owed: 0, vested: true } });
  const text = fronts.length ? fill(line, { n: fronts.length }) : K.noFronts;
  out = appendLog(out, { kind: 'econ', who: [], text });
  return { ...out, evening: [...out.evening, text] };
}

/** Whether the clause has taken the Fronts (Going Straight then closes: Part 23). */
export const loanVested = (block: Pick<EvilModeBlock, 'region'>): boolean => !!l3Of(block).loan?.vested;

// ---- Alola: Aether, a third team (Part 15b section 6.3), and the girl with the bag (Part 26c section 1.6) ----

function aether(block: EvilModeBlock, i: number, data: EvilData): L3Out {
  const A = L3(data)!.aether;
  const l3 = l3Of(block);
  if (l3.aether) return no(block, 'She has had her conversation.');
  const word = (['against', 'apart', 'beside'] as const)[i];
  if (!word) return no(block, 'Not an answer.');
  let out = putL3(block, { ...l3, aether: word });
  // Against: she stops funding Skull's nuisance in the team's districts; that's all War with a foundation looks like.
  if (word === 'against' && out.neighbour) out = { ...out, neighbour: { ...out.neighbour, dread: Math.max(0, out.neighbour.dread - 1) } };
  out = appendLog(out, { kind: 'neighbour', who: [], text: A.said[i]! });
  return ok(out, [A.said[i]!]);
}

function bag(block: EvilModeBlock, what: 'nothing' | 'bridge' | 'tell' | 'sure' | 'back', data: EvilData): L3Out {
  const B = L3(data)!.bag;
  const l3 = l3Of(block);
  if (l3.bag) return no(block, 'The girl is gone. The boat left.');
  if (what === 'tell') return ok(putL3(block, { ...l3, bagAsk: true }), [B.sure]);
  if (what === 'back') return ok(putL3(block, { ...l3, bagAsk: false }), []);
  if (what === 'sure' && !l3.bagAsk) return no(block, 'Nothing to be sure of.');
  const i = what === 'nothing' ? 0 : what === 'bridge' ? 1 : 2;
  const chose = (['nothing', 'bridge', 'told'] as const)[i]!;
  let out = putL3(block, { ...l3, bag: chose, bagAsk: false });
  if (chose === 'told') {
    // Every Kind on the Roster, −3; and she has what she wanted (Part 26c section 1.6).
    out = { ...out, crew: out.crew.map((c) => (c.flaw === 'kind' ? moveLoyalty(c, B.kindLoss, data) : c)) };
    out = putL3(out, { ...l3Of(out), aether: l3Of(out).aether ?? 'beside' });
  }
  out = appendLog(out, { kind: 'neighbour', who: [], text: B.said[i]! });
  return ok(out, [B.said[i]!]);
}

// ---- Alola: a guardian's regard (Part 26c section 1.3) ----

const shrineOf = (block: EvilModeBlock): Holding | undefined => block.district?.holdings.find((h) => h.kind === 'shrine');

/** The odds term a Sullen (or Shut) guardian puts on every job on the island. */
export function shrineTerms(block: Pick<EvilModeBlock, 'district'>, data: EvilData = EVIL_DATA): { label: string; value: number }[] {
  const S = L3(data)?.shrine;
  const h = block.district?.holdings.find((x) => x.kind === 'shrine');
  if (!S || !h || (h.mood !== 'sullen' && h.mood !== 'shut')) return [];
  return [{ label: S.odds, value: S.sullenOdds }];
}

/** Each Evening on the island: Warm holdings speak well of the team (it rises); a Take today (it falls); at Shut, the guardian comes, once. */
function shrineEvening(block: EvilModeBlock, data: EvilData): EvilModeBlock {
  const S = L3(data)?.shrine;
  const h = shrineOf(block);
  if (!S || !h || !inRegion(block, S.region, data) || !block.district) return block;
  const d = block.district;
  const day = block.here.day;
  const took = block.log.some((e) => e.day === day && e.kind === 'job' && e.method === 'take' && e.result === 'went' && e.region === d.region && e.district === d.n);
  const warm = d.holdings.filter((x) => x.owner === 'team' && x.mood === 'warm').length;
  const by = took ? -1 : warm >= S.warmAt ? 1 : 0;
  if (!by) return block;
  let mood = shiftMood(h.mood, by);
  const lines = [took ? S.falls : S.rises];
  let l3 = l3Of(block);
  const island = S.islands[d.n] ?? d.n;
  if (mood === 'shut' && !l3.guardian.includes(island)) {
    // It comes once an island, says what it came to say, and goes. Afterwards the regard's Wary.
    lines.push(S.comes, S.after);
    l3 = { ...l3, guardian: [...l3.guardian, island] };
    mood = 'wary';
  }
  const out = putL3({ ...block, district: { ...d, holdings: d.holdings.map((x) => (x.id === h.id ? { ...x, mood } : x)) } }, l3);
  return { ...out, evening: [...out.evening, ...lines] };
}

// ---- Galar's away ends and Paldea's canteen tables (Part 26c sections 2.3 and 3.3) ----

/** When a district ends: each full away end was on television (Regard); each held canteen table warms the room, once. */
export function l3DistrictEnd(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const T = L3(data);
  const d = block.district;
  if (!T || !d?.end) return block;
  const key = `l3:end:${d.region}:${d.n}`;
  if (block.applied.includes(key)) return block;
  const ends = d.holdings.filter((h) => h.kind === 'awayEnd' && h.owner === 'team').length;
  const tables = d.holdings.filter((h) => h.kind === 'canteen' && h.owner === 'team').length;
  if (!ends && !tables) return block;
  let out: EvilModeBlock = { ...block, applied: [...block.applied, key] };
  const lines: string[] = [];
  if (ends) { out = { ...out, team: { ...out.team, regard: cap(out.team.regard + ends * T.awayEnd.regard) } }; lines.push(fill(T.awayEnd.full, { n: ends })); }
  if (tables) { out = { ...out, district: { ...out.district!, holdings: out.district!.holdings.map((h) => (h.kind === 'local' ? { ...h, mood: shiftMood(h.mood, 1) } : h)) } }; lines.push(T.canteen.warm); }
  return { ...out, evening: [...out.evening, ...lines] };
}

// ---- The beats ----

/** Each Morning: Rose rings on the Arrival's day 2; interest at each new district; the clause at the Reckoning's first morning. */
export function l3Morning(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const T = L3(data);
  if (!T || block.here.beat !== 'morning' || !loanOn(block, data)) return block;
  const K = T.loan;
  let out = block;
  let l3 = l3Of(out);
  const n = stageN(out);
  if (n === 0 && dayIn(out) >= K.offerDay && l3.offered === null) {
    l3 = { ...l3, offered: 'open' };
    out = putL3(out, l3);
    out = { ...out, region: { ...out.region, notes: [...out.region.notes, K.rings, ...K.card.map(([a, b]) => `${a}: ${b}`)] } };
  }
  const ln = l3.loan;
  const key = `l3:interest:${out.region.id}:${n}`;
  if (ln && ln.owed > 0 && !ln.vested && n > 0 && dayIn(out) === 1 && !out.applied.includes(key)) {
    const add = Math.ceil((ln.owed * K.rate) / 100);
    out = putL3({ ...out, applied: [...out.applied, key] }, { ...l3, loan: { ...ln, owed: ln.owed + add } });
    out = { ...out, region: { ...out.region, notes: [...out.region.notes, fill(K.interest, { amount: money(add), owed: money(ln.owed + add) })] } };
  }
  if (n === 7 && dayIn(out) === 1) out = vest(out, K.called, data);
  return out;
}

/** Each Evening: the clause at Heat 8 ("reasonable apprehension"); the guardian's regard. */
export function l3Evening(block: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  const T = L3(data);
  if (!T) return block;
  let out = block;
  if (loanOn(out, data) && out.team.heat >= T.loan.heat) out = vest(out, T.loan.vested, data);
  return shrineEvening(out, data);
}

// ---- The In person list, and its acts ----

export interface RegionActRow { code: string; text: string }

/** What can be done in person here, this region (the Board's In person list). */
export function regionActs(block: EvilModeBlock, data: EvilData = EVIL_DATA): RegionActRow[] {
  const T = L3(data);
  if (!T || block.here.beat !== 'inPerson' || !block.district || block.district.end) return [];
  const l3 = l3Of(block);
  const n = stageN(block);
  const out: RegionActRow[] = [];
  if (loanOn(block, data)) {
    if (l3.offered === 'open') out.push({ code: 'loan:take', text: fill(T.loan.takeAct, { amount: money(T.loan.amount) }) }, { code: 'loan:no', text: T.loan.decline });
    if (l3.loan && l3.loan.owed > 0 && !l3.loan.vested) {
      if (!l3.loan.asked) out.push({ code: 'loan:ask', text: T.loan.askAct });
      out.push({ code: 'loan:repay', text: fill(T.loan.repayAct, { owed: money(l3.loan.owed) }) });
    }
  }
  if (inRegion(block, T.pitch.region, data) && l3.shake === block.here.day) out.push({ code: 'shake:yes', text: T.pitch.acts[0] }, { code: 'shake:no', text: T.pitch.acts[1] });
  if (inRegion(block, T.aether.region, data) && n >= T.aether.stage && !l3.aether) T.aether.choices.forEach((text, i) => out.push({ code: `aether:${i}`, text }));
  if (inRegion(block, T.bag.region, data) && n === T.bag.stage && !l3.bag) {
    if (l3.bagAsk) out.push({ code: 'bag:sure', text: T.bag.sureAct }, { code: 'bag:back', text: T.bag.choices[0]! });
    else T.bag.choices.forEach((text, i) => out.push({ code: `bag:${['nothing', 'bridge', 'tell'][i]}`, text }));
  }
  if (inRegion(block, T.star.region, data) && block.inPerson?.day !== block.here.day) {
    for (const h of block.district.holdings) if (isStarBase(h) && !l3.visited.includes(h.id)) out.push({ code: `visit:${h.id}`, text: fill(T.star.visitAct, { where: holdingName(h, data) }) });
  }
  return out;
}

/** One of the acts above. Refuses what isn't on the list, so a forced code can't do what the screen wouldn't. */
export function regionAct(block: EvilModeBlock, code: string, data: EvilData = EVIL_DATA): L3Out {
  if (!L3(data)) return no(block, 'Not in this build.');
  if (!regionActs(block, data).some((r) => r.code === code)) return no(block, 'Not now.');
  const [what, arg] = code.split(':') as [string, string];
  if (what === 'loan') {
    if (arg === 'take') return takeLoan(block, data);
    if (arg === 'no') { const K = L3(data)!.loan; return ok(appendLog(putL3(block, { ...l3Of(block), offered: 'declined' }), { kind: 'econ', who: [], text: K.decline }), [K.decline]); }
    if (arg === 'ask') return askClause(block, data);
    return repay(block, data);
  }
  if (what === 'shake') return shake(block, arg === 'yes', data);
  if (what === 'aether') return aether(block, Number(arg), data);
  if (what === 'bag') return bag(block, arg as 'nothing' | 'bridge' | 'tell' | 'sure' | 'back', data);
  if (what === 'visit') return visit(block, code.slice('visit:'.length), data);
  return no(block, 'Not now.');
}

/** Asking what "reasonable" means: he tells the truth, delighted (Part 15b section 4.3). */
export function askClause(block: EvilModeBlock, data: EvilData = EVIL_DATA): L3Out {
  const K = L3(data)?.loan;
  const l3 = l3Of(block);
  if (!K || !l3.loan) return no(block, 'Nothing has been signed.');
  return ok(putL3(block, { ...l3, loan: { ...l3.loan, asked: true } }), [K.ask]);
}

/** The Star neighbour's stance words (no War, no Rivals, no Front, no Merger on its screen). */
export const stanceList = (block: Pick<EvilModeBlock, 'neighbour'>, data: EvilData = EVIL_DATA): Stance[] =>
  data.neighbour.stances.map((s) => s.id).filter((s) => !(lockedNeighbour(block, data) && STAR_NEVER.includes(s)));

/** Whether a holding's kind can never be the team's (a shrine, a Star base). */
export const neverHeld = (h: Pick<Holding, 'kind'>, data: EvilData = EVIL_DATA): boolean => kindDef(h.kind, data).methods.length === 0 && h.kind !== 'town' && h.kind !== 'gym';

