// DOMINION slice D29: the Assign a task page (round-4 mockup m3), split out of the Morning. Plain data for
// ui/redux/screens/dominion/assign.ts. D3's rules are untouched: the page lists the same tasks with the same odds and
// gives the order with the same 'assign' step the Morning used. Pure: no Phaser, no RNG.

import { cantTake, crewOf, memberLine, rankWord, taskById, withCrew } from './crew';
import { DOMINION_DATA } from './data';
import { fileModel, infoCard, taskIds, taskLabel, taskOdds, withPlace, type InfoCard, type TaskRow } from './crewScreens';
import type { DominionBlock, Member, StatId, Task } from './schema';
import { topModel, type TopModel } from './screens';

const C = () => DOMINION_DATA.crew;
/** Task cards on one page of the grid (mockup m3: three across, two down). */
export const ASSIGN_PAGE = 6;

export interface TaskCard {
  id: string; label: string; icon: string | null; odds: string; tone: TaskRow['tone'];
  /** What it brings in (the task's money, or its first level's yield) and its Heat. */
  pay: string; heat: string;
  /** The stat it uses and what can go wrong. */
  uses: string; risk: string;
  locked: string | null; on: boolean; best: boolean; current: boolean;
}
export interface AssignModel {
  top: TopModel;
  member: InfoCard & { line: string; stat: { label: string; value: number }; role: string; formed: { name: string; text: string } | null; temperament: string; record: string };
  cards: TaskCard[];
  /** The page of cards shown (ASSIGN_PAGE to a page) and how many pages. */
  page: number; pages: number;
  all: boolean; moreCount: number;
  /** Everyone else, for the strip on the right. */
  others: { id: string; i: number; name: string; look: string; task: string; tone: string }[];
  /** The selected member's district task: which district (P picks the next). */
  where: string | null;
  cta: string;
  colours: TopModel['colours'];
}

const statWord = (k: string): string => k[0]!.toUpperCase() + k.slice(1);

/** What a task brings in: its money range, else its first level's yield (tasks.json `levels[0]`). */
function payOf(t: Task): string {
  const f = t.effect?.funds;
  if (f) return `₽${f[0]}–${f[1]}`;
  return t.levels[0] ?? t.does;
}
function heatOf(t: Task): string {
  const h = t.effect?.heat;
  return h ? `Heat +${h}` : 'no Heat';
}

/** Mockup m3: `sel` the member, `at` the task under the cursor (index into the whole list), `all` the full list. */
export function assignModel(block: DominionBlock, sel: number, at: number, all: boolean): AssignModel {
  const b = withCrew(block);
  const m: Member = b.members[Math.min(sel, b.members.length - 1)]!;
  const c = crewOf(m);
  const ids = all ? taskIds(m) : C().quick;
  const live = ids.map((id) => ({ id, t: taskById(id)!, locked: cantTake(m, taskById(id)!) }));
  // Best fit: the open task with real odds (not a sure thing) this member is likeliest to pull off.
  let best: string | null = null, bestP = -1;
  for (const x of live) {
    if (x.locked || x.t.effect?.sure) continue;
    const p = Number.parseInt(taskOdds(b, m, x.id).odds, 10);
    if (p > bestP) { bestP = p; best = x.id; }
  }
  const cursor = Math.max(0, Math.min(at, ids.length - 1));
  const page = Math.floor(cursor / ASSIGN_PAGE);
  const cards = live.slice(page * ASSIGN_PAGE, page * ASSIGN_PAGE + ASSIGN_PAGE).map((x, k) => {
    const o = x.locked ? { odds: '—', tone: 'mu' as const } : taskOdds(b, m, x.id);
    return {
      id: x.id, label: taskLabel(x.id), icon: C().taskIcons[x.id] ?? null, ...o,
      pay: payOf(x.t), heat: heatOf(x.t), uses: x.t.stat ? `uses ${statWord(x.t.stat)}` : 'anyone can', risk: x.t.risk === '—' ? 'no risk' : x.t.risk,
      locked: x.locked, on: page * ASSIGN_PAGE + k === cursor, best: x.id === best, current: c.task === x.id,
    };
  });
  const sel2 = ids[cursor];
  const st = sel2 ? taskById(sel2)?.stat : null;
  const top = Object.entries(m.stats).sort((a, z) => z[1] - a[1])[0]!;
  const f = fileModel(b, b.members.indexOf(m));
  const info = infoCard(b, m);
  const first = f.formed[0];
  return {
    top: { ...topModel(b, `${DOMINION_DATA.start.start.hqName} · LV. ${b.hqLevel}`), regionLabel: 'YOU ARE HERE', region: 'Morning › Assign' },
    member: {
      ...info,
      line: memberLine(m, b.day),
      stat: st ? { label: statWord(st), value: m.stats[st as StatId] } : { label: statWord(top[0]), value: top[1] },
      role: `${rankWord(m.rank)} · ${info.out ?? `on ${withPlace(m)}`}`,
      formed: first ? { name: first.name, text: first.text } : null,
      temperament: f.temperament, record: f.record,
    },
    cards,
    page, pages: Math.max(1, Math.ceil(ids.length / ASSIGN_PAGE)),
    all, moreCount: taskIds(m).length,
    others: b.members.map((x, i) => ({ x, i })).filter(({ x }) => x.id !== m.id).map(({ x, i }) => {
      const xc = crewOf(x);
      return { id: x.id, i, name: x.name, look: x.look, task: xc.out ? (xc.out.why === 'jail' ? 'in a cell' : xc.out.why === 'held' ? 'held' : 'hurt') : withPlace(x), tone: xc.out ? 'rd' : 'gn' };
    }),
    where: f.out ? null : (taskById(c.task)?.effect?.kind === 'district' ? withPlace(m).split(' · ')[1] ?? null : null),
    cta: `Give the order`,
    colours: topModel(b, '').colours,
  };
}

/** How many tasks the page lists (the cursor wraps over these). */
export const assignCount = (block: DominionBlock, sel: number, all: boolean): number => {
  const b = withCrew(block);
  const m = b.members[Math.min(sel, b.members.length - 1)];
  return m ? (all ? taskIds(m).length : C().quick.length) : 0;
};
/** The task id at `at` (the order the page gives). */
export const assignTaskAt = (block: DominionBlock, sel: number, all: boolean, at: number): string | null => {
  const b = withCrew(block);
  const m = b.members[Math.min(sel, b.members.length - 1)];
  return m ? (all ? taskIds(m) : C().quick)[at] ?? null : null;
};
