// Evil Mode view models for the Board and Dispatch (design Part 29 sections 4 and 5), as plain data.
// The scene keeps the cursor and the job being built (`DispatchDraft`); these work out what to draw and decide nothing.
// The odds shown are the ones `oddsFor` gives, the same function the Evening rolls against.

import { defOf, isTheirs, neighbourNotes, stanceDef, unanswered } from './neighbour';
import { districtDef, fairPrice, heldCount, holdingName, kindDef, localOf, methodsFor } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { crewProblem, jobProblem, payAmount } from './dispatch';
import { oddsFor, oddsText } from './odds';
import { lineIndex } from './start';
import { fill } from './ledger';
import { likelyRoad, postProblem } from './hero';
import { JOB_METHODS, type EvilModeBlock, type Holding, type JobMethod, type LineId, type TakeThing } from './schema';
import { heatForecast, lineWhy, thingProblem } from './line';
import { wontText } from './people';
import { currentLeader, gymDoors, gymOn, standingText } from './gym';
import { dayIn, heardOf, mayStay, morningNotes, stageDays, stageKind, stageName, tallyOf, waysForward } from './region';
import { regionOf } from './regionRule';
import { postAtNight, postNotes } from './base';
import { stageRow } from './board';

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
  /** Slice 6: what a Take takes. */
  thing: TakeThing;
  /** Keys only: the cursor sits on the list's last row, "Send them". */
  onSend: boolean;
}

export const newDispatch = (): DispatchDraft => ({ step: 'where', at: 0, who: 0, how: 0, squad: [], offer: 100, thing: 'stock', onSend: false });

export interface CellModel {
  id: string; step: number; mark: string; kind: string; name: string;
  ring: 'none' | 'scouted' | 'holds' | 'turn';
  dot: string | null; mood: string | null;
  queued: boolean; lit: boolean; sel: boolean;
  /** Slice 5: the Hero's marker, their likely road tomorrow (the faint line), their home street, and somebody posted. */
  hero: boolean; road: boolean; home: boolean; posted: boolean;
}

export interface MethodButton { id: string; name: string; word: string; key: number; on: boolean; dark: string | null; chosen: boolean }

export interface BoardModel {
  title: string;
  day: string;
  warn: boolean;
  count: string;
  cells: CellModel[];
  panel: { name: string; kind: string; mood: string; earns: string; wants: string; fears: string; says: string; held: string; price: string;
    /** Slice 8: on the Gym, the right rail: the five ways, open or shut with a word why (Part 8a section 1.2). */
    rail: { name: string; open: boolean; done: boolean; why: string }[] };
  overnight: { title: string; lines: string[] }[];
  evening: string[];
  /** Slice 9: a district that's over: its tally; then the Road (who stays); or, after the Reckoning, the region's end. */
  end: { how: 'held' | 'taken' | 'arrival' | 'reckoning'; phase: 'tally' | 'road' | 'over' | 'day'; title: string; text: string; rows: [string, string][]; said: string;
    road: null | { title: string; stay: { id: string; text: string }[]; nobody: string; carried: string; heard: string; away: { id: string; text: string }[] } } | null;
  /** Slice 13: the neighbour's tag on the title row ("Rocket · Wary"), or null with no neighbour. */
  neighbour: string | null;
  dispatch: null | {
    step: DispatchStep;
    rows: { at: number; name: string; mood: string; known: string; queued: string | null; sel: boolean }[];
    crew: { id: string; name: string; inSquad: boolean; why: string | null; sel: boolean }[];
    nextSel: boolean;
    sendSel: boolean;
    methods: MethodButton[];
    offers: { pct: number; cost: string; chosen: boolean }[] | null;
    /** Slice 6: what a Take takes, each with why it can't be (null when it can). */
    things: { id: TakeThing; name: string; chosen: boolean; why: string | null }[] | null;
    /** Slice 6: "Heat tonight: 5 → 7 (Lean, step 4). At this pace: a Raid in three days." */
    heat: string;
    /** Slice 6: field 8 of the Card, before it's opened: who on the squad won't. */
    wont: string;
    oddsLine: string;
    problem: string | null;
    canQueue: boolean;
    queue: { holdingId: string; text: string }[];
    funds: string;
    /** Slice 5: Hold, on a holding that's yours: one person stands there against the kid (no Card). */
    hold: null | { label: string; problem: string | null };
    posted: { holdingId: string; text: string }[];
  };
  /** Slice 5: In person, the queued Outplays the Boss can go and play. */
  inPerson: null | { go: { holdingId: string; text: string; sel: boolean }[]; done: string | null };
  /** Slice 5: a battle the day's waiting on. */
  fight: string | null;
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
    // Slice 6: refused by the Line, by name. Every method is built now.
    if (lineIndex(line) < lineIndex(m.minLine)) dark = lineWhy(block, data);
    else if (!(JOB_METHODS as readonly string[]).includes(m.id)) dark = 'Not in this build yet.';
    else if (h && !methodsFor(h, data).includes(m.id as JobMethod)) dark = kindDef(h.kind, data).why ?? `Not at ${kindDef(h.kind, data).name.toLowerCase()}.`;
    return { id: m.id, name: m.name, word: m.word, key: i + 1, on: !dark, dark, chosen: d.how === i };
  });
}

export function boardModel(block: EvilModeBlock, d: DispatchDraft, data: EvilData = EVIL_DATA): BoardModel {
  const dist = block.district!;
  const def = districtDef(dist, data);
  const row = stageRow(dist.region, dist.n, data);
  const R = data.district.rules;
  const day = block.here.day;
  // Slice 9: a district's days count from its own first Morning; the Arrival and the Reckoning have their own lengths.
  const di = dayIn(block);
  const days = stageDays(block, data);
  const left = days - di;
  const kind = data.region.on ? stageKind(block.here.stage) : 'district';
  const isDispatch = block.here.beat === 'dispatch' && !dist.end;
  const sel = dist.holdings[d.at] ?? dist.holdings[0]!;
  const queuedOn = (h: Holding) => block.queue.find((j) => j.holdingId === h.id);
  const road = likelyRoad(block, data);
  const cells: CellModel[] = dist.holdings.map((h, i) => ({
    id: h.id, step: h.step, mark: kindDef(h.kind, data).mark, kind: kindDef(h.kind, data).name, name: holdingName(h, data),
    ring: h.owner === 'team' ? (h.holds ? 'holds' : 'turn') : h.scouted > 0 ? 'scouted' : 'none',
    dot: h.scouted > 0 && h.mood ? data.district.moods.find((m) => m.id === h.mood)!.dot : null,
    mood: h.scouted > 0 ? moodName(h, data) : null,
    queued: !!queuedOn(h), lit: !isDispatch || methodsFor(h, data).length > 0, sel: i === d.at,
    hero: block.hero?.at === h.step, road: road.includes(h.step), home: !!block.hero?.home.holdings.includes(h.id) && block.hero.home.district === dist.n,
    posted: block.posted.some((p) => p.holdingId === h.id),
  }));
  const l = localOf(sel, data);
  const known = sel.scouted;
  const price = fairPrice(sel, data);
  const methodWord = (m?: string) => data.methods.find((x) => x.id === m)?.name ?? '';
  const nbDef = block.neighbour ? defOf(block.neighbour, data) : null;
  const nbTeam = nbDef?.team ?? '';
  const nbName = nbDef ? nbDef.teamName.replace('Team ', '') : '';
  const panel = {
    name: holdingName(sel, data),
    kind: `Step ${sel.step} · ${kindDef(sel.kind, data).name}${sel.floor ? ` · floor ${sel.floor}` : ''}${sel.tags?.some((t) => t !== nbTeam) ? ` · ${deedWord(block, data)}` : ''}${isTheirs(sel, block.neighbour, data) ? ` · ${nbName}'s` : ''}`,
    mood: sel.mood ? (known ? moodName(sel, data)! : '?') : '—',
    earns: l ? (known ? (l.take > 0 ? `${money(l.take)} a day to the team` : l.earns > 0 ? 'A favour, not money' : 'Nothing') : '—') : sel.kind === 'town' ? `${money(R.townTakings)} a day, held` : sel.kind === 'safehouse' ? `Rent ${money(R.safehouseRent)} a day, held` : '—',
    wants: l && known >= 2 ? l.want : '',
    fears: l && known >= 2 ? l.fear : '',
    says: l && known ? `"${l.says.replace(/^"|"$/g, '')}"` : '',
    held: sel.owner === 'team' ? `Yours. Day ${sel.since}. ${methodWord(sel.method)}. ${sel.holds ? 'It holds.' : 'It would turn.'}` : 'Nobody\'s.',
    price: (l || sel.kind === 'safehouse') && known ? (price === null ? (l?.noPrice ?? 'No price') : money(price)) : '—',
    rail: sel.kind === 'gym' && gymOn(data) ? gymDoors(block, data).map((x) => ({ name: x.name, open: x.open, done: x.done, why: x.open || x.done ? x.why : `${x.shutBy}: ${x.why}` })) : [],
  };
  // Slice 8: the Gym's panel names its Leader and their standing with the team.
  const leader = sel.kind === 'gym' && gymOn(data) ? currentLeader(block, data) : undefined;
  const st = leader ? standingText(block, data) : null;
  if (leader && st) Object.assign(panel, { name: `${leader.town} Gym · ${leader.name}`, mood: st.word, held: st.moved, says: leader.says });
  const name = (id: string) => dist.holdings.find((h) => h.id === id);
  const sheetLines = block.sheets.map((s) => ({ title: `Step ${name(s.holdingId)!.step} · ${holdingName({ ...name(s.holdingId)!, scouted: Math.max(1, name(s.holdingId)!.scouted) }, data)} · ${methodWord(s.method)} · ${s.won ? (s.method === 'scout' ? 'DONE' : 'WON') : 'LOST'}`, lines: [...s.lines, s.voice, s.played ? 'Played in person: not rolled.' : s.certain ? 'Certain.' : `Odds ${s.odds}%, rolled ${s.roll}.`] }));
  const count = heldCount(block);
  const model: BoardModel = {
    title: `${data.region.on ? `${stageName(block.here.stage, data)}: ` : ''}${def.town} · ${def.leader}'s ${kind === 'district' ? 'district' : 'town'}${row?.tower ? ` · ${row.tower}` : ''}`,
    day: `Day ${di} of ${days}${left >= 0 && left <= 2 && left > 0 ? ` · ${left} day${left === 1 ? '' : 's'} left` : left === 0 ? ' · the last day' : ''}`,
    warn: kind === 'district' && di >= 5,
    count: kind === 'district' ? `Held: ${count} of ${R.toHold}` : `Held: ${count}`,
    cells,
    panel,
    overnight: block.here.beat === 'morning' ? [...regionBlocks(block, data), ...(sheetLines.length ? [...sheetLines, { title: 'The money', lines: block.evening }] : [{ title: 'Overnight', lines: [di === 1 ? `${def.grievance} Twenty steps to the Gym, and none of them ours.` : 'Nothing came in.'] }])] : [],
    evening: block.here.beat === 'evening' ? block.evening : [],
    end: dist.end ? endModel(block, data) : null,
    neighbour: nbDef && block.neighbour ? `${nbName} · ${stanceDef(block.neighbour.stance, data).word}` : null,
    dispatch: null,
    inPerson: null,
    fight: null,
  };
  if (block.here.beat === 'evening') model.overnight = sheetLines;
  // Slice 5: the road. At the Morning, yesterday's walk; at beat 6, today's once walked.
  const hero = block.hero;
  if (hero?.today.length && (block.here.beat === 'morning' || (block.here.beat === 'hero' && hero.walked === day))) model.overnight = [{ title: `The kid · ${hero.name}`, lines: hero.today }, ...model.overnight];
  if (block.fight) {
    const fh = name(block.fight.holdingId)!;
    const who = block.crew.find((c) => c.id === block.fight!.personId)?.name ?? 'Somebody';
    model.fight = block.fight.kind === 'hold' ? `${who} is standing at ${holdingName({ ...fh, scouted: Math.max(1, fh.scouted) }, data)}, and the kid is here. Fight (Enter).` : `The Boss is at ${holdingName({ ...fh, scouted: Math.max(1, fh.scouted) }, data)}. Fight (Enter).`;
  }
  if (block.here.beat === 'inPerson' && !dist.end) {
    const outplays = block.queue.filter((j) => j.method === 'outplay' && !j.played);
    const went = block.inPerson?.day === day ? name(block.inPerson.holdingId) : undefined;
    model.inPerson = {
      go: went ? [] : outplays.map((j) => ({ holdingId: j.holdingId, text: `Go yourself: Outplay at step ${name(j.holdingId)!.step} · ${holdingName({ ...name(j.holdingId)!, scouted: Math.max(1, name(j.holdingId)!.scouted) }, data)}`, sel: name(j.holdingId)!.step - 1 === d.at })),
      done: went ? `The Boss went to step ${went.step} today.` : outplays.length ? null : 'Nothing to go to in person. (In person, only an Outplay is played yet.)',
    };
  }
  if (!isDispatch) return model;

  const rows = dispatchRows(block, data).map((i) => ({ h: dist.holdings[i]!, i }));
  const methods = methodButtons(block, sel, d, data);
  const chosen = methods[d.how];
  const method = chosen && chosen.on ? (chosen.id as JobMethod) : null;
  const job = method ? { holdingId: sel.id, method, squad: d.squad, ...(method === 'pay' ? { offer: d.offer } : {}), ...(method === 'take' ? { thing: d.thing } : {}) } : null;
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
    things: method === 'take' ? data.line.things.map((t) => ({ id: t.id, name: t.name, chosen: t.id === d.thing, why: thingProblem(sel, t.id, data) })) : null,
    heat: heatForecast(block, data),
    wont: job && job.squad.length ? wontText(block, job, data) : '',
    oddsLine,
    problem,
    canQueue: !problem,
    queue: block.queue.map((j) => ({ holdingId: j.holdingId, text: `${j.squad.map((id) => block.crew.find((c) => c.id === id)?.name ?? id).join(', ')} → step ${name(j.holdingId)!.step} · ${methodWord(j.method)}${j.method === 'pay' ? ` (${money(payAmount(name(j.holdingId)!, j.offer, data))})` : ''}` })),
    funds: money(block.team.funds),
    hold: sel.owner === 'team' && block.hero ? { label: d.squad.length === 1 ? `Hold: ${block.crew.find((c) => c.id === d.squad[0])?.name ?? ''} stands here` : 'Hold: pick one person to stand here', problem: d.squad.length === 1 ? postProblem(block, sel.id, d.squad[0]!) : 'Pick one person to stand here.' } : null,
    posted: block.posted.map((p) => ({ holdingId: p.holdingId, text: `${block.crew.find((c) => c.id === p.id)?.name ?? p.id} holds step ${name(p.holdingId)!.step} against the kid` })),
  };
  return model;
}

/** The region rule's word for a tag ("Deeded"). */
const deedWord = (block: EvilModeBlock, data: EvilData): string => regionOf(block, data)?.deeds?.word ?? 'Tagged';

/** The Morning's region blocks (slice 9): the lesson, letters and notes; and any way forward the team needs (Part 2 section 6). */
function regionBlocks(block: EvilModeBlock, data: EvilData): { title: string; lines: string[] }[] {
  const out: { title: string; lines: string[] }[] = [];
  const notes = morningNotes(block, data);
  if (notes.length) out.push({ title: stageName(block.here.stage, data), lines: notes });
  // Slice 13: the neighbour's messages and news today, and any waiting on an answer (answered on the neighbour page, K).
  const nb = block.neighbour;
  if (nb) {
    const lines = [...neighbourNotes(block), ...unanswered(block).map((p) => `${p.text} (Answer on the ${defOf(nb, data).boss} page: K.)`)];
    if (lines.length) out.push({ title: defOf(nb, data).boss, lines });
  }
  const ways = waysForward(block, data);
  if (ways.length) out.push({ title: 'The way forward', lines: ways.map((w) => `${w.state}: ${w.way}${w.waits ? ` (${w.waits}.)` : ''}`) });
  // Slice 10: the Listening Post's report, at Morning (the same Night with a Post next to the Office).
  const post = block.here.beat === 'morning' || (block.here.beat === 'night' && postAtNight(block, data)) ? postNotes(block, data) : [];
  if (post.length) out.push({ title: 'The Listening Post', lines: post });
  return out;
}

/** A district that's over (slice 9): the tally, then the Road; after the Reckoning, the region's end. */
function endModel(block: EvilModeBlock, data: EvilData): NonNullable<BoardModel['end']> {
  const d = block.district!;
  const e = d.end!;
  const t = data.region.on ? block.region.tallies.find((x) => x.n === d.n) ?? tallyOf(block, data) : null;
  const text = e.how === 'held' || e.how === 'taken' ? data.district.ends[e.how] : e.how === 'arrival' ? data.region.arrival.end : data.region.reckoning.end;
  const phase = data.region.on ? block.region.phase : 'day';
  const R = data.region.road;
  const road = phase === 'road' ? {
    title: R.title,
    stay: mayStay(block, data).map((c) => ({ id: c.id, text: fill(R.stay, { name: c.name }) })),
    nobody: R.nobody, carried: R.carried, heard: heardOf(block, data),
    away: block.crew.filter((c) => c.where === 'away').map((c) => ({ id: c.id, text: `Recall ${c.name}` })),
  } : null;
  return { how: e.how, phase, title: t?.title ?? text, text: phase === 'over' ? data.region.reckoning.over : text, rows: t?.rows ?? [], said: t?.said ?? '', road };
}
