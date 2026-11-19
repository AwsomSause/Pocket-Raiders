// DOMINION view models (plain data for the redux screens in ui/redux/screens/dominion). Pure: no Phaser, no RNG.

import { foundingOpen, teamColours, type TeamColours } from './founding';
import { DOMINION_DATA } from './data';
import { openOrders, stepsShown } from './clock';
import type { DominionBlock, Member, Phase } from './schema';

const D = () => DOMINION_DATA.start;

export const SETUP_PAGES = ['boss', 'types', 'member'] as const;
export type SetupPage = (typeof SETUP_PAGES)[number];

/** The setup pages' draft, kept by the scene until "Begin" (Part 1 §1.1, Part 7 §1.1). */
export interface SetupDraft {
  page: SetupPage;
  /** Cursor on the type grid (0-17: the sixteen, then Dragon and Fairy, greyed). */
  at: number;
  types: string[];
  member: 'grunt' | 'admin';
  look: number;
  problem: string | null;
}

export const newSetup = (): SetupDraft => ({ page: 'boss', at: 0, types: [], member: 'grunt', look: 0, problem: null });

/** All eighteen types in grid order: the sixteen pickable ones, then the two that aren't. */
export const typeGrid = (): string[] => [...D().types.allowed, ...D().types.banned];

/** Toggles the type under the cursor. Picking a third replaces the older pick. */
export function toggleType(d: SetupDraft): SetupDraft {
  const t = typeGrid()[d.at];
  if (!t) return d;
  if (D().types.banned.includes(t)) return { ...d, problem: D().types.bannedLine };
  if (d.types.includes(t)) return { ...d, types: d.types.filter((x) => x !== t), problem: null };
  const types = d.types.length >= 2 ? [d.types[1]!, t] : [...d.types, t];
  return { ...d, types, problem: null };
}

const word = (n: number): string => (n <= 2 ? 'POOR' : n <= 4 ? 'FAIR' : n <= 6 ? 'GOOD' : n <= 8 ? 'GREAT' : 'ELITE');

/**
 * The crew card's three summary skills (Part 2 §1): Scouting = Wits + Stealth, Combat = Brawn + Nerve, Reliability from
 * Loyalty and Morale, one step lower while UNTRAINED. D3 adds the Green trait's skip chance.
 */
export function skills(m: Member): [string, string][] {
  const avg = (a: number, b: number): number => Math.round((a + b) / 2);
  const rel = Math.max(1, Math.round((m.loyalty + m.morale) / 40) - (m.untrained ? 1 : 0));
  return [['SCOUTING:', word(avg(m.stats.wits, m.stats.stealth))], ['COMBAT:', word(avg(m.stats.brawn, m.stats.nerve))], ['RELIABILITY:', word(rel)]];
}

const RANK_WORD: Record<string, string> = { grunt: 'GRUNT', admin: 'ADMIN' };

export interface TopModel {
  team: string;
  sub: string;
  initial: string;
  /** D7: the team's colours and mark (null before the Founding: blank emblem, grey armbands). */
  colours: TeamColours | null;
  /** D7: the Founding is ready (the HQ shows its banner, key O). */
  founding: boolean;
  day: string;
  phase: Phase;
  phaseWord: string;
  phaseColour: string;
  funds: string;
  heat: string;
  roster: string;
  region: string;
}

export function topModel(b: DominionBlock, sub = 'HEADQUARTERS'): TopModel {
  const ph = D().clock.phases.find((p) => p.id === b.phase)!;
  return {
    team: b.teamName ? b.teamName.toUpperCase() : 'UNNAMED CREW',
    sub,
    initial: b.team?.initial ?? (b.teamName ? b.teamName[0]!.toUpperCase() : ''),
    colours: teamColours(b),
    founding: foundingOpen(b),
    day: `DAY ${String(b.day).padStart(2, '0')}`,
    phase: b.phase,
    phaseWord: ph.word,
    phaseColour: ph.colour,
    funds: `₽${b.funds.toLocaleString('en-US')}`,
    heat: `${b.heat}%`,
    roster: `${b.members.length}/${b.rosterCap}`,
    region: D().start.region,
  };
}

export interface OrderRow { id: string; label: string; planned: boolean }

export interface HqModel {
  top: TopModel;
  phase: Phase;
  /** The left panel: Today's Orders (Evening plans, Day does), the Night Report (Morning) or Tonight (Night). */
  panel: 'orders' | 'report' | 'night';
  orders: OrderRow[];
  ordersNote: string;
  report: string[];
  actions: number;
  member: { title: string; name: string; rank: string; look: string; untrained: boolean; skills: [string, string][] };
  steps: { label: string; done: boolean }[] | null;
  says: string;
  /** The one button for moving the clock on, with its key hint. */
  next: { label: string; hint: string };
  morning: boolean;
  lockedTab: string;
}

export function hqModel(b: DominionBlock): HqModel {
  const d = D();
  const m = b.members[0]!;
  const open = openOrders(b);
  // Evening lists every open order (planned ones marked); the Day lists the plan first, then the rest.
  const ids = b.phase === 'day' ? [...b.orders.filter((o) => open.includes(o)), ...open.filter((o) => !b.orders.includes(o))] : open;
  const orders = ids.map((id) => ({ id, label: d.orders.find((o) => o.id === id)!.label, planned: b.orders.includes(id) }));
  const ordersNote = b.phase === 'evening'
    ? (orders.length ? `Plan tomorrow: ${b.orders.length} of ${d.clock.dayActions + d.clock.restBonus}.` : 'Nothing left to plan.')
    : orders.length ? `${b.actions} action${b.actions === 1 ? '' : 's'} left today.` : `No orders left. End the day: ₽${d.clock.oddJobPay} per unused action.`;
  const door = b.field.fight && !b.field.fight.begun ? b.field.fight.why : null;
  const next = b.phase === 'evening' ? { label: 'Night falls', hint: 'N' }
    : b.phase === 'night' ? (b.nightActions < 1 ? { label: 'Turn in', hint: 'Enter' } : { label: 'Rest', hint: 'Enter' })
    : b.phase === 'morning' && door ? { label: door === 'looker' ? 'Face Looker' : door === 'raid' ? 'Face the raid' : 'Fight', hint: 'Enter' }
    : b.phase === 'morning' ? { label: 'Start the day', hint: 'Enter' }
    : { label: `End Day${b.actions ? ` (+₽${b.actions * d.clock.oddJobPay})` : ''}`, hint: 'E' };
  const lines = m.rank === 'grunt' ? d.says.grunt : d.says.admin;
  return {
    top: topModel(b),
    phase: b.phase,
    panel: b.phase === 'morning' ? 'report' : b.phase === 'night' ? 'night' : 'orders',
    orders,
    ordersNote,
    report: b.report,
    actions: b.actions,
    member: {
      title: b.members.length === 1 ? `YOUR ONLY ${RANK_WORD[m.rank] ?? m.rank.toUpperCase()}` : 'ON DUTY',
      name: m.name.toUpperCase(),
      rank: RANK_WORD[m.rank] ?? m.rank.toUpperCase(),
      look: m.look,
      untrained: m.untrained,
      skills: skills(m),
    },
    steps: stepsShown(b) ? d.firstSteps.map((s) => ({ label: s.label, done: b.stepsDone.includes(s.id) })) : null,
    says: lines[(b.day - 1) % lines.length]!,
    next,
    morning: b.phase === 'morning',
    lockedTab: d.lockedTab,
  };
}

/** The opening scene's lines (Part 1 §1.3), by the first member. */
export const openingLines = (b: DominionBlock): string[] => (b.members[0]?.rank === 'admin' ? D().adminOpening : D().opening);
