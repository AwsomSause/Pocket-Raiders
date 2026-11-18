// The neighbour's page (design Part 15a; Part 29's New look): their Boss, the stance and what it means, the count, the
// five ticks, their messages in their own format, and the Sit-Down when one's going on. Every choice is a row: Up/Down
// picks, Enter does it. Decides nothing: each row is an action `step` checks again.

import { EVIL_DATA, type EvilData } from './data';
import type { EvilAction } from './day';
import { canSitDown, chairProblem, counts, defOf, legendProblem, opinionWord, sitChoices, stanceDef, summary, tableThings, unanswered } from './neighbour';
import { inRoster } from './people';
import { stageName } from './region';
import type { EvilModeBlock, TableThing } from './schema';

export interface NeighbourRow { label: string; open: boolean; why: string | null; action: EvilAction; sel: boolean; testid: string }

export interface NeighbourModel {
  title: string;
  colour: string;
  stance: { word: string; means: string; board: string; summary: string };
  facts: string[];
  ticks: { name: string; when: string; state: string; text: string }[];
  posts: { text: string; day: number; answered: string | null }[];
  /** A Sit-Down going on: what's been said, newest last. */
  sitting: string[] | null;
  rows: NeighbourRow[];
  hint: string;
}

const THING_LABEL: Record<TableThing, string> = { line: 'A line (Truce)', person: 'A person', job: 'A job not done: tick two', money: 'Money: a tenth', fact: 'A fact: where the Hero is', promise: 'A promise: nobody touches the child', pen: 'His Pen: "Open your Pen."' };

export function neighbourModel(block: EvilModeBlock, sel: number, data: EvilData = EVIL_DATA): NeighbourModel | null {
  const nb = block.neighbour;
  if (!nb || !data.neighbour.on) return null;
  const def = defOf(nb, data);
  const st = stanceDef(nb.stance, data);
  const c = counts(block, data);
  const s = nb.sitting;
  const rows: Omit<NeighbourRow, 'sel'>[] = [];
  if (s) {
    if (s.ex < 3) sitChoices(block, data).forEach((ch, i) => rows.push({ label: ch.text, open: ch.open, why: ch.why, action: { type: 'sitAnswer', i }, testid: `evil-nb-choice-${i}` }));
    else {
      const person = inRoster(block).find((p) => !p.minor && p.id !== s.chair);
      for (const t of tableThings(block, data)) rows.push({ label: t.thing === 'person' && person ? `${THING_LABEL.person}: ${person.name}` : THING_LABEL[t.thing], open: t.open, why: t.why, action: { type: 'table', thing: t.thing, ...(t.thing === 'person' && person ? { personId: person.id } : {}) }, testid: `evil-nb-table-${t.thing}` });
      rows.push({ label: 'Get up', open: true, why: null, action: { type: 'rise' }, testid: 'evil-nb-rise' });
    }
  } else {
    for (const p of unanswered(block)) p.choices.forEach((ch, i) => rows.push({ label: ch, open: true, why: null, action: { type: 'answerPost', id: p.id, i }, testid: `evil-nb-post-${p.id}-${i}` }));
    const sit = canSitDown(block, data);
    rows.push({ label: nb.invited === block.here.day ? `Go to ${def.boss}'s Sit-Down` : `Call a Sit-Down with ${def.boss}`, open: !sit, why: sit, action: { type: 'sitDown' }, testid: 'evil-nb-sit' });
    const chair = chairProblem(block, data);
    rows.push({ label: 'Challenge for the Chair', open: !chair, why: chair, action: { type: 'chair' }, testid: 'evil-nb-chair' });
    if (nb.legend !== 'none') {
      const cave = legendProblem(block, data);
      rows.push({ label: 'Go to the cave', open: !cave, why: cave, action: { type: 'legend' }, testid: 'evil-nb-legend' });
    }
  }
  const at = rows.length ? Math.max(0, Math.min(rows.length - 1, sel)) : 0;
  const tickState = (t: (typeof nb.ticks)[number]) => (t.state === 'fired' ? (t.day ? `Happened, day ${t.day}` : 'Happened') : t.state === 'stopped' ? 'Stopped' : t.late ? `Waiting (${t.late} days late)` : 'Waiting');
  return {
    title: `${def.teamName} · ${def.boss}`,
    colour: def.colour,
    stance: { word: st.word, means: st.means, board: st.board, summary: summary(nb, data) },
    facts: [
      nb.fallen ? (nb.fallen === 'team' ? 'Fell to the team.' : 'Fell to the Hero.') : `Yours ${c.yours}. Theirs ${c.theirs}.`,
      `Opinion: ${opinionWord(nb.opinion, data)}`,
      `Their Dread ${nb.dread}. Their Pen ${nb.pen}.`,
      `What he does right: ${def.does}`,
      ...(nb.whose === 'theirs' ? ['The team works for him now. One order a district.'] : []),
      ...(nb.scheme ? [`${nb.scheme.name}: four parts, every one stamped not clean. The other way: "${nb.scheme.other}"`] : []),
    ],
    ticks: def.ticks.map((t, i) => ({ name: `${t.n}. ${t.name}`, when: `${stageName(t.stage, data)}, day ${t.day}`, state: tickState(nb.ticks[i]!), text: t.text })),
    posts: [...nb.posts].reverse().slice(0, 8).map((p) => ({ text: p.kind === 'ask' ? `${p.text} — ${def.sign}` : p.text, day: p.day, answered: p.answer === null ? null : p.choices[p.answer] ?? null })),
    sitting: s ? s.lines.slice(s.ex === 3 ? -4 : -7) : null,
    rows: rows.map((r, i) => ({ ...r, sel: i === at })),
    hint: data.neighbour.lines.pick!,
  };
}
