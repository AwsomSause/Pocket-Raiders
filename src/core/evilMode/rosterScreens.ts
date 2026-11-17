// Evil Mode's Roster screen and its two scenes, as plain data (design Part 29 sections 7 and 8, Part 9 section 1,
// Part 7 section 11). The scene keeps the cursor (`RosterDraft`); these work out what to draw and decide nothing.
// No person's Loyalty is ever a figure here: a face and a word. The team's is never shown at all, only its band.

import { EVIL_DATA, type EvilData } from './data';
import { severance, cardOf, promoteLine, promoteProblem } from './roster';
import { realLine } from './line';
import { deckPerson, flawDef, inRoster, lineText, missingTalents, peopleText, talentDef, teamWont, wageOf } from './people';
import { swapsFor } from './dispatch';
import { fill, money } from './ledger';
import type { EvilModeBlock, Question } from './schema';
import { QUESTIONS } from './schema';

export interface RosterDraft {
  tab: number;
  row: number;
  /** The action cursor under the chosen row, or null. */
  act: number | null;
  /** The Office: a promotion being made. */
  office: string | null;
}

export const newRoster = (tab = 0): RosterDraft => ({ tab, row: 0, act: null, office: null });

export type RosterAct = { id: string; name: string; on: boolean; why: string | null };

/** Who's drawn as whom (faces.json), as the sprite's asset id. */
export const faceOf = (ref: string | null, data: EvilData = EVIL_DATA): string | null => (ref ? data.faces.find((f) => f.ref === ref)?.sprite ?? null : null);

export interface RosterModel {
  tabs: { name: string; sel: boolean }[];
  wont: { title: string; lines: string[] };
  missing: string[];
  people: null | {
    id: string; name: string; face: string | null; minor: boolean; rank: string; talent: string; flaw: string; line: string; band: { name: string; face: string };
    wage: string; why: string; left: string | null; sel: boolean; acts: (RosterAct & { sel: boolean })[] | null;
  }[];
  applicants: null | { ref: string; name: string; face: string | null; minor: boolean; talent: string; flaw: string; why: string; answer: string | null; waits: string; sel: boolean; acts: (RosterAct & { sel: boolean })[] | null }[];
  empty: string | null;
  rows: number;
  office: null | { title: string; name: string; face: string | null; says: string; answers: string[] };
}

const QUESTION_ACTS = QUESTIONS.map((q) => `q:${q}`);

/** The actions under a person's card, in order. */
export function personActs(block: EvilModeBlock, id: string, data: EvilData = EVIL_DATA): RosterAct[] {
  const p = block.crew.find((c) => c.id === id);
  if (!p || p.where !== 'in') return [];
  const why = promoteProblem(block, id, data);
  const cost = severance(block, p, data);
  return [
    { id: 'promote', name: 'Promote', on: !why, why },
    { id: 'letGoKind', name: fill(peopleText('letGoKind', data), { amount: cost.toLocaleString('en-GB') }), on: cost <= block.team.funds, why: cost <= block.team.funds ? null : `Not enough Funds for ${money(cost)}.` },
    { id: 'letGoCold', name: peopleText('letGoCold', data), on: true, why: null },
  ];
}

/** The actions under an applicant: hire, the one question (four, until one's asked), and two ways to say no. */
export function applicantActs(block: EvilModeBlock, ref: string, data: EvilData = EVIL_DATA): RosterAct[] {
  const a = block.applicants.find((x) => x.ref === ref);
  if (!a) return [];
  const full = inRoster(block).length >= data.people.rules.rosterCap;
  return [
    { id: 'hire', name: 'Hire', on: !full, why: full ? fill(peopleText('noBunk', data), { cap: data.people.rules.rosterCap }) : null },
    ...data.people.questions.map((q) => ({ id: `q:${q.id}`, name: q.ask, on: !a.q, why: a.q ? 'One question each.' : null })),
    { id: 'turnKind', name: 'Say no', on: true, why: null },
    { id: 'turnRude', name: 'Say no, rudely', on: true, why: null },
  ];
}

export const isQuestionAct = (id: string): Question | null => (QUESTION_ACTS.includes(id) ? (id.slice(2) as Question) : null);

export function rosterModel(block: EvilModeBlock, d: RosterDraft, data: EvilData = EVIL_DATA): RosterModel {
  const wont = teamWont(block, data);
  const base = {
    tabs: ['The Roster', 'At the notice board'].map((name, i) => ({ name, sel: d.tab === i })),
    wont: { title: peopleText('wontTitle', data), lines: [...realLine(block, data), ...(wont.length ? wont.map((w) => `"${w.line}" (${w.who.join(', ')})`) : [peopleText('wontEmpty', data)])] },
    missing: missingTalents(block, data),
    office: null as RosterModel['office'],
  };
  if (d.office) {
    const p = block.crew.find((c) => c.id === d.office);
    if (p) base.office = { title: peopleText('promoteTitle', data), name: p.name, face: faceOf(p.ref, data), says: promoteLine(p, data), answers: data.people.text.promoteAnswers as string[] };
  }
  if (d.tab === 0) {
    // Everyone who's ever had a card: those in first, then those who left (dimmed, with how).
    const list = [...inRoster(block), ...block.crew.filter((c) => c.where === 'left')];
    const how = { line: 'over their line', loyalty: 'gone by morning', letGo: 'let go', lineMoved: 'the Line moved', hero: 'went with the kid', arrested: 'arrested' } as const;
    return {
      ...base, applicants: null, empty: null, rows: list.length,
      people: list.map((p, i) => {
        const c = cardOf(block, p, data);
        const d0 = deckPerson(p.ref, data);
        return {
          id: p.id, name: p.age ? `${p.name}, ${p.age}` : p.name, face: faceOf(p.ref, data), minor: p.minor, rank: c.rank,
          talent: c.talent ? `${c.talent.mark} ${c.talent.name}` : '—', flaw: c.flaw ?? '—', line: c.line ?? '—', band: c.band,
          wage: block.team.creed === 'belonging' ? 'A share' : p.rank === 'officer' || p.rank === 'executive' ? 'A share of the day' : money(wageOf(block, p, 0, data)),
          why: d0 ? `"${d0.why}"` : 'A Grunt. No name given.',
          left: p.left ? `Left, day ${p.left.day}: ${how[p.left.how]}${p.left.how === 'letGo' ? (p.left.kindly ? ', kindly' : ', coldly') : ''}.` : null,
          sel: d.row === i,
          acts: d.row === i && d.act !== null ? personActs(block, p.id, data).map((a, j) => ({ ...a, sel: j === d.act })) : null,
        };
      }),
    };
  }
  const list = block.applicants;
  return {
    ...base, people: null, rows: list.length,
    empty: list.length ? null : peopleText(block.drawn.length >= data.people.people.filter((p) => p.deck === 'founders' || p.deck === 'kanto').length ? 'deckEmpty' : 'nobodyToday', data),
    applicants: list.map((a, i) => {
      const p = deckPerson(a.ref, data)!;
      const q = a.q ? data.people.questions.find((x) => x.id === a.q)! : null;
      const answer = q ? fill(q.answer, { flaw: flawDef(p.flaw, data).name, line: lineText({ ref: p.id, line: p.line }, data), why: p.why, quest: p.quest }) : null;
      const leaves = a.day + data.people.rules.waitDays - 1;
      return {
        ref: a.ref, name: `${p.name}, ${p.age}`, face: faceOf(a.ref, data), minor: !!p.minor,
        talent: `${talentDef(p.talent, data).mark} ${talentDef(p.talent, data).name}`, flaw: flawDef(p.flaw, data).name,
        why: `"${p.why}"`, answer: q ? `${q.ask} ${answer}` : null,
        waits: leaves <= block.here.day ? 'Gone tomorrow.' : `Waits until day ${leaves}.`,
        sel: d.row === i,
        acts: d.row === i && d.act !== null ? applicantActs(block, a.ref, data).map((x, j) => ({ ...x, sel: j === d.act })) : null,
      };
    }),
  };
}

/** The refusal in the yard (Part 7 section 11.1): who, their line, what they say, and the three answers. */
export function refusalModel(block: EvilModeBlock, data: EvilData = EVIL_DATA) {
  const r = block.refusal;
  if (!r) return null;
  const swaps = swapsFor(block, data);
  return {
    title: peopleText('refusalTitle', data),
    people: r.who.map((id) => {
      const p = block.crew.find((c) => c.id === id)!;
      return { name: p.name, face: faceOf(p.ref, data), line: lineText(p, data), says: p.talent ? talentDef(p.talent, data).refuses : 'No.' };
    }),
    answers: [
      { id: 'withdraw', name: peopleText('withdraw', data), on: true, why: null as string | null },
      { id: 'swap', name: swaps ? `${peopleText('swap', data)}: ${swaps.map((id) => block.crew.find((c) => c.id === id)!.name).join(', ')}` : peopleText('swap', data), on: !!swaps, why: swaps ? null : peopleText('swapNone', data) },
      { id: 'insist', name: peopleText('insist', data), on: true, why: null },
    ],
  };
}
export type RefusalModel = NonNullable<ReturnType<typeof refusalModel>>;
