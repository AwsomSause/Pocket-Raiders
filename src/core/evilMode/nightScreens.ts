// Evil Mode's Office at Night, as plain data (design Part 29 sections 11.1-11.3). The scene keeps the cursor (`NightDraft`);
// this works out what to draw and decides nothing. No Loyalty figure is ever shown: a mood is a word.

import { EVIL_DATA, type EvilData } from './data';
import { actionProblem, answerProblem, knockDef, knockerName, knockVars, nightText, wallState } from './night';
import { inRoster } from './people';
import { fill } from './ledger';
import { faceOf } from './rosterScreens';
import type { EvilModeBlock } from './schema';

export type NightPane = 'room' | 'hear' | 'wall';

export interface NightDraft {
  pane: NightPane;
  row: number;
  /** The Wall: a thing chosen to take down, waiting on its confirm. */
  confirm: number | null;
  /** After an answer: their reply, then (after a press) what moved; then they go. */
  reply: { line: string; moved: string; step: 0 | 1 } | null;
}

export const newNight = (): NightDraft => ({ pane: 'room', row: 0, confirm: null, reply: null });

export type NightRow = { id: string; name: string; on: boolean; why: string | null };

export interface NightModel {
  title: string;
  door: null | { who: string; face: string | null; title: string; says: string; answers: NightRow[] };
  quiet: string | null;
  reply: NightDraft['reply'] & { who: string; face: string | null } | null;
  desk: NightRow[];
  hear: null | { id: string; name: string; face: string | null; mood: string }[];
  wall: null | { title: string; state: string; items: { what: string; from: string; day: number; down: boolean; desk: boolean; sel: boolean; confirm: boolean }[]; empty: string | null };
  /** The cursor's list length for this pane (the room counts answers or desk rows). */
  rows: number;
  row: number;
}

/** The desk's rows: Hear someone out, Sleep, the Wall, Lights out. */
export function deskRows(block: EvilModeBlock, data: EvilData = EVIL_DATA): NightRow[] {
  const why = actionProblem(block, data);
  const knock = !!block.night.knock;
  return [
    { id: 'hear', name: 'Hear someone out', on: !why, why },
    { id: 'sleep', name: 'Sleep', on: !why, why },
    { id: 'wall', name: 'The Wall', on: true, why: null },
    { id: 'lights', name: 'Lights out', on: !knock || knockDef(block.night.knock!.n, data)!.shut, why: knock && !knockDef(block.night.knock!.n, data)!.shut ? nightText('cantShut', data) : null },
  ];
}

export function nightModel(block: EvilModeBlock, d: NightDraft, lastWho: { name: string; ref: string | null } | null = null, data: EvilData = EVIL_DATA): NightModel {
  const k = block.night.knock;
  const def = k ? knockDef(k.n, data)! : null;
  const vars = k ? knockVars(block, k, data) : {};
  const p = k?.who ? block.crew.find((c) => c.id === k.who) : undefined;
  const door = k && def ? {
    who: knockerName(block, k, data), face: faceOf(p?.ref ?? null, data), title: `${def.title}${def.sun ? ' ☼' : ''}`, says: fill(def.says, vars),
    answers: [...def.answers.map((a, i) => ({ id: String(i), name: fill(a.say, vars), on: !answerProblem(block, i, data), why: answerProblem(block, i, data) })),
      { id: '3', name: nightText('notTonight', data), on: def.shut, why: def.shut ? null : nightText('cantShut', data) }],
  } : null;
  const desk = deskRows(block, data);
  const hear = d.pane === 'hear' ? inRoster(block).map((c) => ({ id: c.id, name: c.name, face: faceOf(c.ref, data), mood: c.mood.charAt(0).toUpperCase() + c.mood.slice(1) })) : null;
  const states = data.night.wallStates;
  const wall = d.pane === 'wall' ? {
    title: nightText('wallTitle', data),
    state: states[wallState(block, data)],
    items: block.night.wall.map((w, i) => {
      const it = data.night.wall.find((x) => x.id === w.item)!;
      return { what: it.what, from: it.from, day: w.day, down: w.down !== null, desk: it.kind === 'desk', sel: d.row === i, confirm: d.confirm === i };
    }),
    empty: block.night.wall.length ? null : nightText('wallEmpty', data),
  } : null;
  const rows = d.pane === 'hear' ? hear!.length : d.pane === 'wall' ? wall!.items.length : door && !d.reply ? door.answers.length : desk.length;
  return {
    title: nightText('officeTitle', data),
    door: d.reply ? null : door,
    quiet: !k && !d.reply ? nightText(block.night.doorOn === block.here.day ? 'doorDone' : 'doorQuiet', data) : null,
    reply: d.reply ? { ...d.reply, who: lastWho?.name ?? '', face: faceOf(lastWho?.ref ?? null, data) } : null,
    desk, hear, wall, rows, row: d.row,
  };
}
