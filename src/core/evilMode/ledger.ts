// The Ledger (design Part 25a section 5, Part 29 section 8, Part 30 section 7): the Log, its grammar, and every read of it.
// The Log is append only: nothing here edits or removes an entry. Given and Taken are kept as counters and as sums over
// the Log, and a test checks the two agree. Pure: new blocks are returned. No number is drawn.

import { holdingName, localOf, payAmount, streetOf, takings } from './board';
import { EVIL_DATA, type EvilData } from './data';
import type { JobDraft } from './odds';
import type { EvilModeBlock, Holding, LogEntry } from './schema';

export const money = (n: number): string => `₽${n.toLocaleString('en-GB')}`;

/** Fills {key} in a data template. A key with no value is left as written (a test checks none are left). */
export const fill = (t: string, v: Record<string, string | number>): string => t.replace(/\{(\w+)\}/g, (all, k: string) => (k in v ? String(v[k]) : all));

const lowerFirst = (t: string): string => t.charAt(0).toLowerCase() + t.slice(1);
const upperFirst = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

/** Who or where a line is about, with its street: "Mrs. Chiamaka Eze, 61, runs the ferry, Nugget Bridge". Names once scouted. */
export function holdingTo(h: Holding, data: EvilData = EVIL_DATA): string {
  const street = data.district.streets[streetOf(h.step, data)]?.name ?? '';
  if (h.kind === 'local') {
    if (h.scouted === 0) return `a local at step ${h.step}, ${street}`;
    const l = localOf(h, data)!;
    return `${l.who}, ${lowerFirst(l.trade.split(/[;.]/)[0]!.trim())}, ${street}`;
  }
  return `${h.ref}, ${street}`;
}

export const crewNames = (block: EvilModeBlock, ids: readonly string[]): string => ids.map((id) => block.crew.find((c) => c.id === id)?.name ?? id).join(', ');

/** The verb phrase for a job, by method (Part 25a section 5.2). No adjectives, no reasons. */
export function writtenFor(block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA): string {
  const W = data.ledger.written;
  const h = block.district!.holdings.find((x) => x.id === job.holdingId)!;
  const to = holdingTo(h, data);
  const l = localOf(h, data);
  if (job.method === 'scout') return fill(W.scout, { to });
  if (job.method === 'persuade') {
    if (h.kind === 'safehouse') return fill(W.persuadeRooms, { to });
    if (l && h.scouted === 0) return fill(W.persuadeUnknown, { to });
    if (l && l.take > 0) return fill(W.persuade, { to, amount: money(l.take) });
    return fill(W.persuadeFavour, { to });
  }
  if (job.method === 'pay') {
    const offer = data.district.methods.pay.offers.find((o) => o.pct === (job.offer ?? 100));
    return fill(offer?.fair ? W.payFair : W.payUnder, { to, amount: money(payAmount(h, job.offer, data)) });
  }
  return fill(h.kind === 'local' ? W.outplay : W.outplayGround, { to });
}

/** The Ledger's line for a job (Part 25a section 5.1): who, did what, to whom, on which day. It is the Card's twelfth field. */
export const sentenceFor = (block: EvilModeBlock, job: JobDraft, data: EvilData = EVIL_DATA): string =>
  `Day ${block.here.day}. ${crewNames(block, job.squad)}. ${upperFirst(writtenFor(block, job, data))}`;

/** A plain line of the Log for things that aren't jobs. */
export const lineFor = (block: EvilModeBlock, who: readonly string[], text: string): string =>
  `Day ${block.here.day}. ${who.length ? `${crewNames(block, who)}. ` : ''}${upperFirst(text)}`;

/** Adds one entry. The only way the Log grows; there is no way it shrinks. */
export function appendLog(block: EvilModeBlock, e: Omit<LogEntry, 'id' | 'day' | 'region' | 'district'>): EvilModeBlock {
  const d = block.district;
  const entry: LogEntry = { id: `L${block.log.length + 1}`, day: block.here.day, region: d?.region ?? block.here.region, district: d?.n ?? block.here.stage, ...e };
  return { ...block, log: [...block.log, entry], given: block.given + (e.given ?? 0), taken: block.taken + (e.taken ?? 0) };
}

/** Given and Taken as sums over the Log. Never subtracted from each other (Part 23 section 8.2). */
export const logSums = (block: EvilModeBlock): { given: number; taken: number } =>
  block.log.reduce((s, e) => ({ given: s.given + (e.given ?? 0), taken: s.taken + (e.taken ?? 0) }), { given: 0, taken: 0 });

/** What a holding pays this Evening, after a waive or a halve. A safehouse's rent is never waived (it isn't income). */
export function takingsAt(h: Holding, rates: EvilModeBlock['rates'], data: EvilData = EVIL_DATA): number {
  const t = takings(h, data);
  if (t <= 0) return t;
  const r = rates[h.id];
  return r === 'waived' ? 0 : r === 'halved' ? Math.floor(t / 2) : t;
}

// ---- The book's pages (Part 29 section 8) ----

export interface InLine { holdingId: string; text: string; amount: number; rate: 'halved' | 'waived' | null; canWaive: boolean; canHalve: boolean; canAsk: boolean }

export interface TodayPages { in: InLine[]; inTotal: number; out: { text: string; amount: number }[]; outTotal: number }

const askKey = (block: EvilModeBlock, id: string): string => `ask:${block.district?.region ?? 0}:${block.district?.n ?? 0}:${id}`;

/** Today: left, every line a name; right, wages by person and rent. */
export function todayPages(block: EvilModeBlock, data: EvilData = EVIL_DATA): TodayPages {
  const d = block.district;
  const open = !!d && !d.end;
  const inc = (d?.holdings ?? []).filter((h) => takings(h, data) > 0).map((h): InLine => {
    const amount = takingsAt(h, block.rates, data);
    const rate = block.rates[h.id] ?? null;
    return {
      holdingId: h.id,
      text: `${money(amount)} · ${holdingName(h, data)} · since day ${h.since ?? block.here.day}${rate ? ` · ${rate}` : ''}`,
      amount, rate,
      canWaive: open && rate !== 'waived',
      canHalve: open && !rate,
      canAsk: open && h.kind === 'local' && !block.applied.includes(askKey(block, h.id)),
    };
  });
  const R = data.district.rules;
  const creed = block.team.creed;
  const inTotal = inc.reduce((n, l) => n + l.amount, 0);
  const out: { text: string; amount: number }[] = creed === 'belonging'
    ? [{ text: `Shares · half of the day's takings, split ${block.crew.length} ways`, amount: Math.floor(inTotal / 2) }]
    : block.crew.map((c) => ({ text: `${c.name} · wage`, amount: creed === 'cause' ? R.wageCause : R.wage }));
  for (const h of d?.holdings ?? []) if (takings(h, data) < 0) out.push({ text: `${holdingName(h, data)} · rent`, amount: -takings(h, data) });
  return { in: inc, inTotal, out, outTotal: out.reduce((n, l) => n + l.amount, 0) };
}

export type RunMark = 'went' | 'didnt' | 'called off' | 'pending';

/** The run: every Card confirmed, by day, as the Ledger's sentence, with its mark in the margin. */
export function runLines(block: EvilModeBlock): { cardId: string; day: number; text: string; mark: RunMark; unseen: boolean; who: string[] }[] {
  const result = new Map<string, RunMark>();
  for (const e of block.log) if (e.kind === 'job' && e.cardId && e.result) result.set(e.cardId, e.result);
  return block.log.filter((e) => e.kind === 'card' && e.cardId).map((e) => ({ cardId: e.cardId!, day: e.day, text: e.text, mark: result.get(e.cardId!) ?? 'pending', unseen: (e.unknowns ?? 0) > 0, who: e.who }));
}

/** By person: the same lines, sorted by who they name, in the order people joined. */
export function byPerson(block: EvilModeBlock): { name: string; lines: string[] }[] {
  const lines = runLines(block);
  return block.crew.map((c) => ({ name: c.name, lines: lines.filter((l) => l.who.includes(c.id)).map((l) => l.text) }));
}

// ---- Waive · Halve · Ask about (Part 29 section 8, Part 30 section 8) ----

export type IncomeAct = 'waive' | 'halve' | 'askAbout';

export function incomeProblem(block: EvilModeBlock, holdingId: string, act: IncomeAct, data: EvilData = EVIL_DATA): string | null {
  const line = todayPages(block, data).in.find((l) => l.holdingId === holdingId);
  if (!block.district || block.district.end) return "The district's over.";
  if (!line) return 'That line pays nothing.';
  if (act === 'waive' && !line.canWaive) return 'Already let off.';
  if (act === 'halve' && !line.canHalve) return line.rate === 'halved' ? 'Already halved.' : 'Already let off.';
  if (act === 'askAbout' && !line.canAsk) return 'Already asked, this district.';
  return null;
}

/** Waive or halve a line from the next Evening on. A waiver adds to Given (Part 23 section 8.2: "A debt waived"). */
export function setRate(block: EvilModeBlock, holdingId: string, act: 'waive' | 'halve', data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null } {
  const problem = incomeProblem(block, holdingId, act, data);
  if (problem) return { block, problem };
  const h = block.district!.holdings.find((x) => x.id === holdingId)!;
  const W = data.ledger.written;
  const full = takings(h, data);
  const text = act === 'waive' ? fill(W.waive, { to: holdingTo(h, data) }) : fill(W.halve, { to: holdingTo(h, data), amount: money(Math.floor(full / 2)), fair: money(full) });
  const b = { ...block, rates: { ...block.rates, [holdingId]: act === 'waive' ? ('waived' as const) : ('halved' as const) } };
  return { block: appendLog(b, { kind: act, who: [], to: holdingId, text: lineFor(block, [], text), ...(act === 'waive' ? { given: data.ledger.count.waive } : {}) }), problem: null };
}

/** Who collects a line: the lead of the last job that went there, or the first of the crew. */
function collector(block: EvilModeBlock, holdingId: string): string {
  const went = new Set(block.log.filter((e) => e.kind === 'job' && e.result === 'went').map((e) => e.cardId));
  const card = [...block.log].reverse().find((e) => e.kind === 'card' && e.to === holdingId && went.has(e.cardId));
  return card?.who[0] ?? block.crew[0]?.id ?? '';
}

/** "Ask about": one exchange with whoever collects; it tells what they want (the cheapest scouting in the game). Once a district each. */
export function askAbout(block: EvilModeBlock, holdingId: string, data: EvilData = EVIL_DATA): { block: EvilModeBlock; problem: string | null; line: string } {
  const problem = incomeProblem(block, holdingId, 'askAbout', data);
  if (problem) return { block, problem, line: '' };
  const h = block.district!.holdings.find((x) => x.id === holdingId)!;
  const l = localOf(h, data)!;
  const by = collector(block, holdingId);
  const said = fill(data.ledger.ask[h.step % data.ledger.ask.length]!, { who: l.who.split(',')[0]!, want: lowerFirst(l.want) });
  const line = `${crewNames(block, [by])}: "${said}"`;
  const district = { ...block.district!, holdings: block.district!.holdings.map((x) => (x.id === h.id ? { ...x, scouted: 2 } : x)) };
  const b = { ...block, district, applied: [...block.applied, askKey(block, h.id)] };
  return { block: appendLog(b, { kind: 'ask', who: [by], to: h.id, text: lineFor(block, [by], fill(data.ledger.written.ask, { to: holdingTo(h, data) })) }), problem: null, line };
}
