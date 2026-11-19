// DOMINION slice D22: plain data for the Confront screen (mockup a6/k6). The scene's SpyController draws it with
// ui/redux/screens/dominion/spy.ts. A Rotom reply stored in the run's AI log (`run.ai`) replaces the offline reply of a
// typed turn; the tell shown is always the rules' tell.

import { storedAnswer } from '../ai/rules';
import type { AiLog } from '../ai/schema';
import { DOMINION_DATA } from './data';
import type { DominionBlock, SpyTurn } from './schema';
import { SPY_ENDS } from './schema';
import { pron, spiesOf, suspicion } from './spies';
import { teamDef, teamsHere } from './rivals';
import { topModel, type TopModel } from './screens';
import { fill } from './worldTurn';

const SP = () => DOMINION_DATA.spies;

/** The Rotom call id for a typed turn: stable for the moment, so a reload reads the stored answer. */
export const spyCallId = (member: string, day: number, turn: number): string => `spy:${member}:${day}:${turn}`;

export interface SpyModel {
  top: TopModel;
  name: string; look: string; member: string;
  sus: number; level: 'high' | 'mid' | 'low'; levelWord: string;
  clues: { day: number; text: string; hot: boolean }[];
  /** The newest clue, for the intercepted note on the table. */
  note: string;
  bossLook: string;
  turns: { you: string; them: string; tell: SpyTurn['tell']; rotom: boolean }[];
  tell: { word: string; colour: string } | null;
  chip: string | null;
  waiting: boolean;
  questions: { id: string; label: string; sub: string; off: boolean }[];
  left: number;
  ends: { id: string; label: string; sub: string; colour: string }[];
  ui: Record<string, string>;
}

export function spyModel(b: DominionBlock, log: AiLog | undefined, waiting = false): SpyModel | null {
  const talk = spiesOf(b).talk;
  const m = talk ? b.members.find((x) => x.id === talk.member) : null;
  if (!talk || !m) return null;
  const S = SP().suspicion, U = SP().ui;
  const n = suspicion(b, m.id);
  const level = n >= S.high ? 'high' : n >= S.confrontAt ? 'mid' : 'low';
  const clues = spiesOf(b).clues.filter((c) => c.member === m.id).slice(-3).map((c, i, a) => ({ day: c.day, text: c.text, hot: i === a.length - 1 }));
  const team = teamDef(teamsHere()[0]?.id ?? 'rocket');
  const q = (id: string): string => SP().questions.find((x) => x.id === id)?.label ?? id;
  const turns = talk.turns.map((t, i) => {
    const e = t.q === 'typed' ? storedAnswer(log, spyCallId(m.id, talk.day, i)) : null;
    const v = e?.s === 'ai' ? (e.v as { reply?: unknown } | undefined)?.reply : undefined;
    const rotom = typeof v === 'string' && !!v.trim();
    return { you: t.said ?? q(t.q), them: rotom ? (v as string) : t.reply, tell: t.tell, rotom };
  });
  const last = talk.turns.at(-1);
  const tell = last?.tell ? SP().tells[last.tell] : null;
  const lastRotom = turns.at(-1)?.rotom ?? false;
  const P = pron(m);
  const vars = { ...P, team: team?.name ?? 'the rivals', bribe: SP().talk.bribe };
  const left = SP().talk.turns - talk.turns.length;
  return {
    top: topModel(b),
    name: m.name, look: m.look, member: m.id,
    sus: n, level, levelWord: level === 'high' ? U.high! : level === 'mid' ? U.mid! : U.low!,
    clues,
    note: clues.at(-1)?.text ?? U.empty!,
    bossLook: team?.boss.look ?? 't-giovanni.png',
    turns,
    tell: tell ? { word: tell.word, colour: tell.colour } : null,
    chip: lastRotom && last ? fill(SP().rotom.chip, { tell: last.tell ? SP().tells[last.tell].word.toLowerCase().replace('overly ', '') : 'none' }) : null,
    waiting,
    questions: SP().questions.filter((x) => x.id !== 'typed').map((x) => ({
      id: x.id, label: x.label, sub: fill(x.sub, vars),
      off: left <= 0 || (x.id === 'bribe' && (talk.bribed || b.funds < SP().talk.bribe)),
    })),
    left,
    ends: SPY_ENDS.map((k) => {
      const e = SP().ends[k];
      return { id: k, label: fill(e.label, vars), sub: fill(e.sub, vars), colour: e.colour };
    }),
    ui: U,
  };
}
