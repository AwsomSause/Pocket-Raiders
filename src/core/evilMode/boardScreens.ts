// Evil Mode view models for the Board and Dispatch (design Part 29 sections 4 and 5), as plain data.
// The scene keeps the cursor and the job being built (`DispatchDraft`); these work out what to draw and decide nothing.
// The odds shown are the ones `oddsFor` gives, the same function the Evening rolls against.

import { districtDef, fairPrice, heldCount, holdingName, kindDef, localOf, methodsFor } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { crewProblem, jobProblem, payAmount } from './dispatch';
import { oddsFor, oddsText } from './odds';
import { lineIndex } from './start';
import { JOB_METHODS, type EvilModeBlock, type Holding, type JobMethod, type LineId } from './schema';

export type DispatchStep = 'where' | 'who' | 'how';

export interface DispatchDraft {
  step: DispatchStep;
  /** The holding picked (an index into the board's 20). */
  at: number;
  /** Cursor inside the who list (crew rows, then Next) and inside the seven methods. */
  who: number;
  how: number;
  squad: string[];
  offer: number;
  /** Keys only: the cursor sits on the list's last row, "Send them". */
  onSend: boolean;
}

export const newDispatch = (): DispatchDraft => ({ step: 'where', at: 0, who: 0, how: 0, squad: [], offer: 100, onSend: false });

export interface CellModel {
  id: string; step: number; mark: string; kind: string; name: string;
  ring: 'none' | 'scouted' | 'holds' | 'turn';
  dot: string | null; mood: string | null;
  queued: boolean; lit: boolean; sel: boolean;
}

export interface MethodButton { id: string; name: string; word: string; key: number; on: boolean; dark: string | null; chosen: boolean }

export interface BoardModel {
  title: string;
  day: string;
  warn: boolean;
  count: string;
  cells: CellModel[];
  panel: { name: string; kind: string; mood: string; earns: string; wants: string; fears: string; says: string; held: string; price: string };
  overnight: { title: string; lines: string[] }[];
  evening: string[];
  end: { how: 'held' | 'taken'; text: string; rows: [string, string][] } | null;
  dispatch: null | {
    step: DispatchStep;
    rows: { at: number; name: string; mood: string; known: string; queued: string | null; sel: boolean }[];
    crew: { id: string; name: string; inSquad: boolean; why: string | null; sel: boolean }[];
    nextSel: boolean;
    sendSel: boolean;
    methods: MethodButton[];
    offers: { pct: number; cost: string; chosen: boolean }[] | null;
    oddsLine: string;
    problem: string | null;
    canQueue: boolean;
    queue: { holdingId: string; text: string }[];
    funds: string;
  };
}

const money = (n: number): string => `₽${n.toLocaleString('en-GB')}`;
const moodName = (h: Holding, data: EvilData) => data.district.moods.find((m) => m.id === h.mood)?.name ?? null;

/** Holdings the Dispatch list offers (any built method works there), by index into the board's 20. */
export const dispatchRows = (block: EvilModeBlock, data: EvilData = EVIL_DATA): number[] => (block.district?.holdings ?? []).flatMap((h, i) => (methodsFor(h, data).length > 0 ? [i] : []));

/** The seven method buttons, always in the same order (methods.json); the four built ones are lit by the holding. */
function methodButtons(block: EvilModeBlock, h: Holding | undefined, d: DispatchDraft, data: EvilData): MethodButton[] {
  const line: LineId = block.team.line;
  return data.methods.map((m, i) => {
    let dark: string | null = null;
    if (lineIndex(line) < lineIndex(m.minLine)) dark = 'Not on a Clean hands team.';
    else if (!(JOB_METHODS as readonly string[]).includes(m.id)) dark = 'Not in this build yet.';
    else if (h && !methodsFor(h, data).includes(m.id as JobMethod)) dark = kindDef(h.kind, data).why ?? `Not at ${kindDef(h.kind, data).name.toLowerCase()}.`;
    return { id: m.id, name: m.name, word: m.word, key: i + 1, on: !dark, dark, chosen: d.how === i };
  });
}

export function boardModel(block: EvilModeBlock, d: DispatchDraft, data: EvilData = EVIL_DATA): BoardModel {
  const dist = block.district!;
  const def = districtDef(dist, data);
  const R = data.district.rules;
  const day = block.here.day;
  const left = R.days - day;
  const isDispatch = block.here.beat === 'dispatch' && !dist.end;
  const sel = dist.holdings[d.at] ?? dist.holdings[0]!;
  const queuedOn = (h: Holding) => block.queue.find((j) => j.holdingId === h.id);
  const cells: CellModel[] = dist.holdings.map((h, i) => ({
    id: h.id, step: h.step, mark: kindDef(h.kind, data).mark, kind: kindDef(h.kind, data).name, name: holdingName(h, data),
    ring: h.owner === 'team' ? (h.holds ? 'holds' : 'turn') : h.scouted > 0 ? 'scouted' : 'none',
    dot: h.scouted > 0 && h.mood ? data.district.moods.find((m) => m.id === h.mood)!.dot : null,
    mood: h.scouted > 0 ? moodName(h, data) : null,
    queued: !!queuedOn(h), lit: !isDispatch || methodsFor(h, data).length > 0, sel: i === d.at,
  }));
  const l = localOf(sel, data);
  const known = sel.scouted;
  const price = fairPrice(sel, data);
  const methodWord = (m?: string) => data.methods.find((x) => x.id === m)?.name ?? '';
  const panel = {
    name: holdingName(sel, data),
    kind: `Step ${sel.step} · ${kindDef(sel.kind, data).name}`,
    mood: sel.mood ? (known ? moodName(sel, data)! : '?') : '—',
    earns: l ? (known ? (l.take > 0 ? `${money(l.take)} a day to the team` : l.earns > 0 ? 'A favour, not money' : 'Nothing') : '—') : sel.kind === 'town' ? `${money(R.townTakings)} a day, held` : sel.kind === 'safehouse' ? `Rent ${money(R.safehouseRent)} a day, held` : '—',
    wants: l && known >= 2 ? l.want : '',
    fears: l && known >= 2 ? l.fear : '',
    says: l && known ? `"${l.says.replace(/^"|"$/g, '')}"` : '',
    held: sel.owner === 'team' ? `Yours. Day ${sel.since}. ${methodWord(sel.method)}. ${sel.holds ? 'It holds.' : 'It would turn.'}` : 'Nobody\'s.',
    price: (l || sel.kind === 'safehouse') && known ? (price === null ? (l?.noPrice ?? 'No price') : money(price)) : '—',
  };
  const name = (id: string) => dist.holdings.find((h) => h.id === id);
  const sheetLines = block.sheets.map((s) => ({ title: `Step ${name(s.holdingId)!.step} · ${holdingName({ ...name(s.holdingId)!, scouted: Math.max(1, name(s.holdingId)!.scouted) }, data)} · ${methodWord(s.method)} · ${s.won ? (s.method === 'scout' ? 'DONE' : 'WON') : 'LOST'}`, lines: [...s.lines, s.voice, s.certain ? 'Certain.' : `Odds ${s.odds}%, rolled ${s.roll}.`] }));
  const count = heldCount(block);
  const model: BoardModel = {
    title: `${def.town} · ${def.leader}'s district`,
    day: `Day ${day} of ${R.days}${left >= 0 && left <= 2 && left > 0 ? ` · ${left} day${left === 1 ? '' : 's'} left` : left === 0 ? ' · the last day' : ''}`,
    warn: day >= 5,
    count: `Held: ${count} of ${R.toHold}`,
    cells,
    panel,
    overnight: block.here.beat === 'morning' ? (sheetLines.length ? [...sheetLines, { title: 'The money', lines: block.evening }] : [{ title: 'Overnight', lines: [day === 1 ? `${def.grievance} Twenty steps to the Gym, and none of them ours.` : 'Nothing came in.'] }]) : [],
    evening: block.here.beat === 'evening' ? block.evening : [],
    end: dist.end ? { how: dist.end.how, text: data.district.ends[dist.end.how], rows: [['Held', `${dist.end.count} of ${R.toHold}`], ['Holds', String(dist.holdings.filter((h) => h.owner === 'team' && h.holds).length)], ['Would turn', String(dist.holdings.filter((h) => h.owner === 'team' && !h.holds).length)], ['Day', `${dist.end.day} of ${R.days}`], ['Funds', money(block.team.funds)], ['Heat', String(block.team.heat)], ['Regard', String(block.team.regard)]] } : null,
    dispatch: null,
  };
  if (block.here.beat === 'evening') model.overnight = sheetLines;
  if (!isDispatch) return model;

  const rows = dispatchRows(block, data).map((i) => ({ h: dist.holdings[i]!, i }));
  const methods = methodButtons(block, sel, d, data);
  const chosen = methods[d.how];
  const method = chosen && chosen.on ? (chosen.id as JobMethod) : null;
  const job = method ? { holdingId: sel.id, method, squad: d.squad, ...(method === 'pay' ? { offer: d.offer } : {}) } : null;
  const problem = !chosen ? 'Pick a method.' : chosen.dark ?? (job ? jobProblem(block, job, data) : null);
  let oddsLine = '';
  if (job && (sel.owner !== 'team' || method === 'scout')) {
    oddsLine = oddsText(oddsFor(block, job, data));
  }
  model.dispatch = {
    step: d.step,
    rows: rows.map(({ h, i }) => ({ at: i, name: `${h.step}. ${holdingName(h, data)}`, mood: h.scouted && h.mood ? moodName(h, data)! : h.mood ? '?' : '', known: h.owner === 'team' ? 'Yours' : h.scouted >= 2 ? 'Scouted twice' : h.scouted ? 'Scouted' : 'Not scouted', queued: queuedOn(h) ? methodWord(queuedOn(h)!.method) : null, sel: i === d.at && !(d.step === 'where' && d.onSend) })),
    crew: block.crew.map((c, i) => ({ id: c.id, name: c.name, inSquad: d.squad.includes(c.id), why: crewProblem(block, c.id, sel.id), sel: d.step === 'who' && d.who === i })),
    nextSel: d.step === 'who' && d.who === block.crew.length,
    sendSel: d.step === 'where' && d.onSend,
    methods,
    offers: method === 'pay' && price !== null ? data.district.methods.pay.offers.map((o) => ({ pct: o.pct, cost: money(payAmount(sel, o.pct, data)), chosen: o.pct === d.offer })) : null,
    oddsLine,
    problem,
    canQueue: !problem,
    queue: block.queue.map((j) => ({ holdingId: j.holdingId, text: `${j.squad.map((id) => block.crew.find((c) => c.id === id)?.name ?? id).join(', ')} → step ${name(j.holdingId)!.step} · ${methodWord(j.method)}${j.method === 'pay' ? ` (${money(payAmount(name(j.holdingId)!, j.offer, data))})` : ''}` })),
    funds: money(block.team.funds),
  };
  return model;
}
