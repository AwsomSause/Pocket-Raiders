// DOMINION slice D24: plain data for the interview room (mockup a8) and the release page (mockup a9). The views in
// ui/redux/screens/dominion/police.ts only draw what these hand them.

import { DOMINION_DATA } from './data';
import { districtDef } from './field';
import { answerLabel, officerById } from './police';
import type { AnswerKind, DominionBlock, Outcome, ReleaseLine } from './schema';
import { fill } from './worldTurn';

const P = () => DOMINION_DATA.police;
const dName = (id: string): string => districtDef(id)?.name ?? id;

export interface EvidenceCard { id: string; label: string; text: string; down: boolean; hit: boolean; kind: string; mon: string | null }
export interface LastAnswer { said: string; consistent: boolean; fits: string; persuasive: number; delta: number; rotom: boolean }
export interface QuestionModel {
  station: string;
  suspect: string;
  boss: boolean;
  officer: { name: string; kind: string; sprite: string; mon: string };
  belief: number;
  /** The last answer's change (the meter's red chunk) and where the chunk sits. */
  delta: number;
  bands: { free: number; bail: number };
  /** Where the meter now points: free, bail or held. */
  now: Outcome;
  evidence: EvidenceCard[];
  line: { who: string; text: string };
  last: LastAnswer | null;
  tell: string | null;
  answers: { kind: AnswerKind; label: string; key: string; cost: number }[];
  turn: number;
  turns: number;
  /** The judge chip: Rotom's or the rules' (never "Claude" or "AI"). */
  chip: string;
  rotom: boolean;
}

export const QUICK: readonly AnswerKind[] = ['alibi', 'deny', 'blame', 'lawyer', 'bribe'];

export function questionModel(b: DominionBlock): QuestionModel | null {
  const q = b.police?.q;
  if (!q) return null;
  const o = officerById(q.officer), last = q.turns.at(-1) ?? null, B = P().bands;
  const hit = last?.contradicts ?? null;
  const ev = hit ? q.evidence.find((e) => e.id === hit) : undefined;
  const now: Outcome = q.belief >= B.free ? 'free' : q.belief >= B.bail ? 'bail' : 'held';
  return {
    station: `${dName(q.district)} Police`,
    suspect: q.name,
    boss: q.who === 'boss',
    officer: { name: o.name, kind: o.kind, sprite: o.sprite, mon: o.mon },
    belief: q.belief,
    delta: last?.delta ?? 0,
    bands: { free: B.free, bail: B.bail },
    now,
    evidence: q.evidence.map((e) => {
      const down = q.down.includes(e.id);
      return { id: e.id, label: P().evidence.kinds[e.kind].label, text: down ? '?' : e.text, down, hit: e.id === hit, kind: e.kind, mon: down ? null : e.mon ?? null };
    }),
    line: { who: o.name.toUpperCase(), text: last ? last.reply : fill(o.lines.open, { district: dName(q.district) }) },
    last: last
      ? { said: last.text, consistent: last.consistent, fits: ev ? `no · ${P().evidence.kinds[ev.kind].label}` : 'yes', persuasive: last.persuasive, delta: last.delta, rotom: last.rotom }
      : null,
    tell: ev ? 'CONTRADICTS EVIDENCE' : null,
    answers: QUICK.map((k, i) => ({ kind: k, label: answerLabel(k), key: String(i + 1), cost: P().answers[k].cost ?? 0 })),
    turn: q.turns.length,
    turns: P().turns,
    chip: fill(last?.rotom ? P().lines.rotomOn : P().lines.rotomOff, { n: q.evidence.length }),
    rotom: !!last?.rotom,
  };
}

export interface ReleaseModel {
  title: string;
  stamp: string;
  outcome: Outcome;
  when: string;
  belief: number;
  weight: number;
  /** Where the weight marker sits on the bar (0-100). */
  weightPct: number;
  crew: ReleaseLine[];
  hq: ReleaseLine[];
  cell: string;
  parting: string;
  boss: boolean;
  name: string;
}

export function releaseModel(b: DominionBlock): ReleaseModel | null {
  const r = b.police?.last;
  if (!r || r.seen) return null;
  return {
    title: r.outcome === 'held' ? 'Held, then released' : 'Released',
    stamp: P().lines.outcomes[r.outcome].toUpperCase(),
    outcome: r.outcome,
    when: `Day ${r.day}, 6 AM`,
    belief: r.belief,
    weight: r.weight,
    weightPct: Math.round(100 - r.belief),
    crew: r.lines.filter((l) => l.group === 'crew'),
    hq: r.lines.filter((l) => l.group === 'hq'),
    cell: r.cell,
    parting: r.parting,
    boss: r.who === 'boss',
    name: r.name,
  };
}

/** The tag shown on a consequence row (MORALE, RAID, …). */
export const tagOf = (l: ReleaseLine): string => P().lines.tags[l.tag];
