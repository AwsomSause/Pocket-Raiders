// DOMINION slice D13 view model: the Debate (mockup 8, round 4). Plain data for ui/redux/screens/dominion/debate.ts.
// Pure: no Phaser, no RNG. The scene's DebateController keeps the cursor (stance and line); previews (the Briefing
// Theater's marks) come from `scoreLine`, which reads the run and never rolls.

import { DOMINION_DATA } from './data';
import { bossOf, lineDef, resultOf, scoreLine } from './debate';
import { pronounsOf, weighsOf } from './debateTyped';
import { hqFx } from './hqFx';
import { teamDef } from './rivals';
import type { DominionBlock } from './schema';
import { fill } from './worldTurn';

const D = () => DOMINION_DATA.debate;

export interface DebateCursor { stance: number; line: number }
export interface DebateModel {
  boss: string; tag: string; colour: string; crest: string; portrait: string | null; mon: string | null;
  myCrest: string; myTag: string;
  round: { num: string; name: string; what: string }; turn: number; turns: number;
  conviction: number; start: number;
  verdict: { move: number; marks: { name: string; n: number }[] } | null;
  said: string;
  stances: { id: string; name: string; key: number; stripe: string; on: boolean; left: number }[];
  lines: { id: string; text: string; used: boolean; on: boolean; preview: { marks: number[]; move: number } | null; claim: string | null }[];
  aims: string;
  phase: 'argue' | 'choose' | 'done';
  result: { word: string; name: string; text: string; outcome: string[]; good: boolean } | null;
  notice: string | null;
}

/** The Debate on the table now, or null. */
export function debateModel(b: DominionBlock, cur: DebateCursor, notice: string | null = null): DebateModel | null {
  const l = b.debate?.live;
  if (!l) return null;
  const def = teamDef(l.team);
  const boss = bossOf(l.team);
  const per = D().turnsPerRound;
  const n = l.turns.length;
  const total = l.rounds.length * per;
  const rid = l.rounds[Math.min(l.rounds.length - 1, Math.floor(n / per))]!;
  const round = D().rounds.find((r) => r.id === rid)!;
  const last = l.turns[n - 1];
  const used = new Set(l.turns.map((t) => t.line));
  const see = hqFx(b).debateSee > 0;
  const them = l.who === 'boss' ? boss?.them ?? 'them' : 'them';
  const st = D().stances[cur.stance] ?? D().stances[0]!;
  const lines = D().lines.filter((x) => x.stance === st.id).map((x, i) => {
    const s = see && !used.has(x.id) ? scoreLine(b, l, x.id) : null;
    return {
      id: x.id, text: fill(x.text, { team: def?.name ?? 'your team', boss: l.name, my: b.teamName ?? 'my crew' }), used: used.has(x.id), on: i === cur.line,
      preview: s ? { marks: s.marks, move: s.move } : null, claim: x.claim ? D().claims[x.claim]!.what : null,
    };
  });
  const res = l.result ? D().results.find((r) => r.id === l.result)! : null;
  return {
    boss: l.name, tag: def?.tag ?? '', colour: boss?.colour ?? '#e05a4a', crest: boss?.crest ?? (def?.tag[0] ?? '?'),
    portrait: l.who === 'boss' ? boss?.portrait ?? null : null, mon: l.who === 'boss' ? boss?.mon ?? null : null,
    myCrest: (b.teamName ?? 'N')[0]!.toUpperCase(), myTag: b.teamName ? b.teamName.toUpperCase() : 'UNNAMED CREW',
    round: { num: round.num, name: round.name, what: round.what }, turn: Math.min(n + 1, total), turns: total,
    conviction: l.conviction, start: l.start,
    verdict: last ? { move: last.move, marks: D().marks.map((m, i) => ({ name: m.name, n: last.marks[i]! })) } : null,
    said: l.said,
    stances: D().stances.map((s, i) => ({
      id: s.id, name: fill(s.name, { them }), key: s.key, stripe: s.stripe, on: i === cur.stance,
      left: D().lines.filter((x) => x.stance === s.id && !used.has(x.id)).length,
    })),
    lines,
    aims: st.aims,
    phase: l.phase,
    result: res ? { word: res.word, name: res.name, text: res.text, outcome: l.outcome, good: res.id === 'convinced' || res.id === 'persuaded' } : null,
    notice,
  };
}

/** The result's banner for a Conviction (used by the results overlay and tests). */
export const resultWord = (c: number): string => resultOf(c).word;
export { lineDef };

// ---------- D20: the Rotom path (Rotom mockup a4, round 4 `mockups-v4` #k4) ----------

/** What the controller holds while a typed turn plays out (presentation only; the turn itself is in the save). */
export interface TypedCursor {
  turn: number;
  text: string;
  /** judging: the judge is reading; speaking: the reply is arriving or typing itself; read: the whole reply is shown. */
  stage: 'judging' | 'speaking' | 'read';
  /** Characters of the reply shown so far (the typewriter, or the stream). */
  shown: number;
  /** The streamed reply so far (before it is stored on the turn). */
  stream: string | null;
  /** The chips: 'Quick' / 'Deep' when Rotom answered, null when the rules did. */
  judgeChip: string | null;
  replyChip: string | null;
}

export interface TypedModel {
  boss: string; tag: string; colour: string; crest: string; portrait: string | null; mon: string | null; myCrest: string; myTag: string;
  round: { num: string; name: string; of: string }; roundPips: number;
  words: string;
  values: { name: string; n: number }[] | null;
  raw: number | null; move: number | null; lo: number | null; hi: number | null; capped: boolean;
  conviction: number;
  reply: string; shown: string; stage: TypedCursor['stage'];
  judgeChip: string | null; replyChip: string | null;
  lines: Record<string, string>;
}

/** The k4 page for the typed turn the controller is playing, or null. */
export function typedModel(b: DominionBlock, cur: TypedCursor): TypedModel | null {
  const l = b.debate?.live;
  if (!l) return null;
  const base = debateModel(b, { stance: 0, line: 0 });
  if (!base) return null;
  const t = l.turns[cur.turn]?.typed ? l.turns[cur.turn]! : null;
  const per = D().turnsPerRound;
  const rid = l.rounds[Math.min(l.rounds.length - 1, Math.floor(cur.turn / per))]!;
  const round = D().rounds.find((r) => r.id === rid)!;
  const reply = cur.stream ?? (t ? t.voice ?? t.reply : '');
  const v = { boss: l.name, ...pronounsOf(b) };
  const lines = Object.fromEntries(Object.entries(D().typed.text).map(([k, s]) => [k, fill(s, { ...v, lo: t ? signed(t.typed!.lo) : '', hi: t ? signed(t.typed!.hi) : '' })]));
  return {
    boss: base.boss, tag: base.tag, colour: base.colour, crest: base.crest, portrait: base.portrait, mon: base.mon, myCrest: base.myCrest, myTag: base.myTag,
    round: { num: round.num, name: round.name, of: D().rounds.find((r) => r.id === l.rounds[l.rounds.length - 1])?.num ?? round.num }, roundPips: Math.round(((cur.turn + 1) / (l.rounds.length * per)) * 50) / 10,
    words: cur.text,
    values: t ? weighsOf(l.team).map((name, i) => ({ name, n: t.typed!.values[i]! })) : null,
    raw: t ? t.typed!.raw : null, move: t ? t.move : null, lo: t ? t.typed!.lo : null, hi: t ? t.typed!.hi : null,
    capped: !!t && t.typed!.raw !== t.move,
    conviction: l.conviction,
    reply, shown: reply.slice(0, Math.max(0, cur.shown)), stage: cur.stage,
    judgeChip: cur.judgeChip, replyChip: cur.replyChip,
    lines,
  };
}

const signed = (n: number): string => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n)}`;
