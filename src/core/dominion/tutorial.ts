// DOMINION tutorial and opening (plans/evil-mode-rework/tutorial-mockups, Kice 2026-11-21: "build it nearly exactly").
// Pure: no Phaser, no RNG of its own. Rotom's fifteen lessons, the reward cards and the first-week pages are decided
// here from the block; the scene only draws them. A run keeps the help level it began with (`block.tut`); a block
// without it (every run before this slice, and every automated test) has no tutorial, so old runs play exactly as before.

import { z } from 'zod';
import raw from '../../data/dominion/tutorial.json';
import type { Content } from '../contentSchema';
import { newMon } from '../run';
import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import { foundingOpen } from './founding';
import { book, metaFor } from './reserve';
import type { DominionBlock } from './schema';

const S = z.string().min(1);
const Row = z.tuple([S, S]);
const Item = z.tuple([S, S, S]);
const Step = z.object({ text: S.optional(), key: S.optional(), list: z.array(Row).optional(), inline: z.array(Row).optional() }).strict();
const Lesson = z.object({ id: S, name: S, steps: z.array(Step).optional(), ladder: z.array(Row).optional() }).strict();
const Reward = z.object({ head: S, items: z.array(Item).min(1), note: S.optional(), noteAdmin: S.optional(), key: S }).strict();
export const TutorialFileSchema = z.object({
  _source: S,
  help: z.object({
    title: S, sub: S, rotom: S, phone: S, foot: S, firstTime: S, titleTip: S,
    options: z.array(z.object({ id: z.enum(['full', 'tips', 'off']), label: S, tag: S.optional(), line: S, stripe: S }).strict()).length(3),
  }).strict(),
  cold: z.object({
    skip: S,
    beats: z.array(z.object({
      id: S, cap: S.optional(), big: S.optional(), lines: z.array(S).min(1),
      paper: z.object({ name: S, edition: S, weather: S, price: S, head: S, body: S }).strict().optional(),
    }).strict()).length(3),
    reward: Reward,
  }).strict(),
  kit: Reward,
  setup: z.object({ boss: S, types: S, typesOne: S, member: S }).strict(),
  welcome: z.object({ title: S, text: S, step: S, key: S, foot: S }).strict(),
  lessons: z.array(Lesson).length(15),
  rattata: z.object({ species: S, level: z.number().int().min(1), lines: z.array(S).min(1), head: S, sent: S, where: S }).strict(),
  step: z.object({ head: S, stamp: S, stampEarn: S }).strict(),
  bills: z.object({ head: S, rent: S, wage: S, total: S, who: S, lines: z.array(S).min(1) }).strict(),
  rival: z.object({ label: S, who: S, lines: z.array(S).min(1), after: S }).strict(),
  week: z.object({ title: S, sub: S, head: S, next: S, nextSteps: z.array(S).min(1), tip: S, key: S }).strict(),
  gang: z.object({ who: S, stamp: S, sticker: S, ladder: z.array(Row).min(2), lines: z.array(S).min(1) }).strict(),
  founded: z.object({ head: S, band: S, mark: S, door: S, noto: S, key: S }).strict(),
  done: z.object({ stamp: S, rail: S, text: S, key: S }).strict(),
  replay: z.object({ title: S, sub: S, blade: S, bladeSub: S, setting: S, modes: z.array(Row).length(3) }).strict(),
  stop: S,
}).strict();
export const TUT = TutorialFileSchema.parse(raw);
export type TutMode = 'full' | 'tips' | 'off';


export const tutMode = (b: DominionBlock | null | undefined): TutMode => b?.tut?.mode ?? 'off';
export const seen = (b: DominionBlock, id: string): boolean => !!b.tut?.seen.includes(id);
/** The lesson's number on the rail (1-15) and its name. */
export const lessonNo = (id: string): number => TUT.lessons.findIndex((l) => l.id === id) + 1;
export const lessonDef = (id: string) => TUT.lessons.find((l) => l.id === id);

/** Where the player is, as the scene sees it. */
export type TutWhere = 'hq' | 'map' | 'card' | 'assign' | 'wheel' | 'menu' | 'founding' | 'other';

/** A lesson overlay due now: its seen id, the lesson it belongs to and which of its steps. */
export interface Due { id: string; lesson: string; step: number }

/** The overlay lesson due on this page, or null. Order follows the mockups (c4 welcome, c5 top bar, c6 orders...). */
export function lessonDue(b: DominionBlock, where: TutWhere, foundingRow = 0): Due | null {
  if (tutMode(b) === 'off' || !b.opened) return null;
  const not = (id: string): boolean => !seen(b, id);
  const d = (id: string, lesson: string, step = 0): Due => ({ id, lesson, step });
  if (where === 'wheel') return not('wheel') ? d('wheel', 'wheel') : null;
  if (where === 'menu') return not('menu') ? d('menu', 'menu') : null;
  if (where === 'card') return not('card') ? d('card', 'card') : null;
  if (where === 'map') return not('map') ? d('map', 'map') : null;
  if (where === 'assign') return not('tasks-assign') ? d('tasks-assign', 'tasks', 1) : null;
  if (where === 'founding') return not('founding') ? d('founding', 'founding', Math.max(0, Math.min(3, foundingRow))) : null;
  if (where !== 'hq') return null;
  if (not('welcome')) return d('welcome', 'top', -1);
  if (not('top')) return d('top', 'top');
  if (b.phase === 'evening' && b.day === 1) {
    if (not('orders')) return d('orders', 'orders', b.orders.length >= 2 ? 1 : 0);
    if (not('steps')) return d('steps', 'steps');
    if (not('tasks')) return d('tasks', 'tasks');
  }
  if (b.phase === 'night' && not('night')) return d('night', 'night');
  if (b.heat > DOMINION_DATA.start.start.heat && not('heat')) return d('heat', 'heat');
  if (seen(b, 'rival-note') && not('rivals')) return d('rivals', 'rivals');
  return null;
}

/** The week's bills were paid last night (the World Turn's "Week N bills" line is in the Morning report). */
export const billsDue = (b: DominionBlock): boolean => b.report.some((l) => /^Week \d+ bills/.test(l));

export type TutPage =
  | { kind: 'kit' }
  | { kind: 'gift' }
  | { kind: 'step'; id: string }
  | { kind: 'bills' }
  | { kind: 'rival' }
  | { kind: 'week' }
  | { kind: 'gang' }
  | { kind: 'founded' }
  | { kind: 'done' };

/**
 * A whole tutorial page due before the HQ (the reward cards, the first week's scenes, the end). Rewards and the
 * story pages show in Full and Tips; the end of the walkthrough only in Full. Each shows once (its seen id).
 */
export function pageDue(b: DominionBlock, onHq: boolean): TutPage | null {
  const mode = tutMode(b);
  if (mode === 'off' || !b.opened || !onHq) return null;
  const not = (id: string): boolean => !seen(b, id);
  if (not('kit')) return { kind: 'kit' };
  for (const s of DOMINION_DATA.start.firstSteps) if (b.stepsDone.includes(s.id) && not(`step:${s.id}`)) return { kind: 'step', id: s.id };
  if (b.day >= 2 && b.phase === 'morning' && not('gift')) return { kind: 'gift' };
  if (billsDue(b) && not('bills-page')) return { kind: 'bills' };
  if (seen(b, 'bills-page') && b.phase === 'morning' && not('rival-note')) return { kind: 'rival' };
  if (seen(b, 'rival-note') && b.day >= DOMINION_DATA.start.clock.weekLength && (b.phase === 'evening' || b.phase === 'night') && not('week')) return { kind: 'week' };
  if (foundingOpen(b) && not('gang')) return { kind: 'gang' };
  if (b.team && not('founded')) return { kind: 'founded' };
  if (b.team && mode === 'full' && not('done')) return { kind: 'done' };
  return null;
}

/** The Week 1 Ledger (d13): how the first week went, read off the block (Day 1's numbers come from start.json). */
export function weekOne(b: DominionBlock): { funds: [number, number]; crew: string; roster: string; mons: number; caught: string[]; heat: [number, number]; steps: number; paid: number } {
  const s = DOMINION_DATA.start;
  const caught = (b.reserve?.box ?? []).map((m) => m.speciesId);
  const done = s.firstSteps.filter((x) => b.stepsDone.includes(x.id));
  return {
    funds: [s.start.funds, b.funds], crew: b.members.map((m) => m.name).join(', '), roster: `${b.members.length} / ${b.rosterCap}`,
    mons: (b.reserve?.box.length ?? 0) + b.members.reduce((n, m) => n + m.team.length, 0), caught,
    heat: [s.start.heat, b.heat], steps: done.length, paid: done.reduce((n, x) => n + x.reward, 0),
  };
}

export type TutOp = 'seen' | 'mode' | 'gift';

/** One tutorial step on the block (saved by the session like any other). `gift` is the Day 2 Rattata (d1-d2) and closes
 *  lesson 7 with it. Replaying a lesson (Boss Menu) is drawn only and changes nothing here. */
export function tutStep(content: Content, run: RunState, b: DominionBlock, op: TutOp, arg: string): { ok: boolean; notice: string | null } {
  if (op === 'seen' && !arg) return { ok: false, notice: null };
  const t = (b.tut ??= { mode: 'off', seen: [] });
  if (op === 'mode') {
    if (arg !== 'full' && arg !== 'tips' && arg !== 'off') return { ok: false, notice: null };
    t.mode = arg;
    return { ok: true, notice: null };
  }
  if (op === 'gift') {
    if (t.seen.includes('gift') || t.mode === 'off' || b.day < 2) return { ok: false, notice: null };
    const g = TUT.rattata;
    if (content.species.get(g.species)) {
      const mon = newMon(content, run, g.species, g.level, 'p');
      const r = book(b);
      r.box.push(mon);
      r.meta[mon.uid] = metaFor(content, mon.speciesId, 'caught', null, b.day);
    }
    t.seen.push('gift', 'mornings');
    return { ok: true, notice: null };
  }
  if (!t.seen.includes(arg)) t.seen.push(arg);
  return { ok: true, notice: null };
}
