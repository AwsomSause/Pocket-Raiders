// DOMINION redesign R5 (pass 50, the Crew group): plain data for the redesigned crew pages (roster, ID card, loyalty,
// payday, uniforms) that the older view models don't cover. Display only: reads the block, never changes it, no RNG.

import { cantTake, crewOf, formedById, greenById, rankN, rankWord, taskLevel, withCrew } from './crew';
import { taskLabel, taskOdds } from './crewScreens';
import { DOMINION_DATA } from './data';
import { colourDef, teamColours, type TeamColours } from './founding';
import type { DominionBlock, Member } from './schema';
import { STAT_IDS } from './schema';
import { nextTrade } from './school';
import { suspicion } from './spies';

const C = () => DOMINION_DATA.crew;
/** "GRUNT" -> "Grunt". */
export const titleWord = (s: string): string => s.toLowerCase().replace(/(^|[\s·-])\S/g, (x) => x.toUpperCase());

/** One member as the redesigned pages show them. */
export interface R5Member {
  id: string; name: string; look: string; gender: 'm' | 'f';
  rank: string; rankN: number; rankId: string; level: number;
  /** 1-3 stars on the roster card (by rank: Grunt and below 1, up to Sergeant 2, Admin and up 3). */
  stars: number;
  /** The trait on the card: the first formed one, else the green one. */
  trait: { name: string; text: string };
  /** Every trait the file lists: formed ones ("Grew: ..." after the first), else the green one. */
  traits: { name: string; text: string }[];
  stats: { label: string; value: number }[];
  loyalty: number; morale: number; wage: number; unpaid: number;
  team: { species: string; level: number }[];
  /** Why they're out today (In a cell, Hurt, Held), or null. */
  out: string | null;
  /** They want a word (a talk is waiting for them). */
  word: boolean;
  suspicion: number;
  joined: number;
}

const OUT: Record<string, string> = { jail: 'In a cell', hurt: 'Hurt', held: 'Held by a rival team' };

export function r5Member(b: DominionBlock, m: Member): R5Member {
  const c = crewOf(m);
  const green = greenById(c.green);
  const formed = c.formed.map((id) => formedById(id)).filter((f): f is NonNullable<typeof f> => !!f);
  const traits = formed.length
    ? formed.map((f, i) => ({ name: i === 0 ? f.name : `Grew: ${f.name}`, text: f.text }))
    : [{ name: green?.name ?? titleWord(c.green), text: green?.effect ?? '' }];
  const n = rankN(m.rank);
  return {
    id: m.id, name: m.name, look: m.look, gender: m.gender,
    rank: titleWord(rankWord(m.rank)), rankN: n, rankId: m.rank, level: m.level,
    stars: n <= 4 ? 1 : n <= 10 ? 2 : 3,
    trait: { name: formed[0]?.name ?? traits[0]!.name, text: formed[0]?.text ?? traits[0]!.text },
    traits,
    stats: STAT_IDS.map((k) => ({ label: k[0]!.toUpperCase() + k.slice(1), value: m.stats[k] })),
    loyalty: m.loyalty, morale: m.morale, wage: m.wage, unpaid: m.unpaid,
    team: m.team.map((x) => ({ species: x.speciesId, level: x.level })),
    out: c.out ? OUT[c.out.why] ?? null : null,
    word: !!b.crew?.talks.some((t) => t.member === m.id),
    suspicion: suspicion(b, m.id),
    joined: m.joinedDay,
  };
}

export function r5Members(block: DominionBlock): R5Member[] {
  const b = withCrew(block);
  return b.members.map((m) => r5Member(b, m));
}

/** The roster's header: "6 of 8 · 2 want a word". */
export function r5RosterHead(block: DominionBlock): string {
  const ms = r5Members(block);
  const cap = block.rosterCap ?? ms.length;
  const want = ms.filter((m) => m.word).length;
  return `${ms.length} of ${Math.max(cap, ms.length)}${want ? ` · ${want} want${want === 1 ? 's' : ''} a word` : ''}`;
}

// ---------- the ID card's armband ----------

export interface R5Band { colours: TeamColours | null; colourName: string; team: string; initial: string; stripes: number }

/** The armband side panel: the team's colour and initial, and how many rank stripes the member wears. */
export function r5Band(b: DominionBlock, m: R5Member): R5Band {
  const tc = teamColours(b);
  const t = b.team;
  return {
    colours: tc,
    colourName: t ? colourDef(t.primary)?.name ?? '' : 'Grey',
    team: b.teamName ?? '',
    initial: tc?.initial ?? '',
    stripes: m.rankN,
  };
}

// ---------- payday ----------

export interface R5PayRow { id: string; name: string; look: string; wage: number; mood: string; owed: number }
export interface R5Payday { week: number; total: number; nextDay: number; today: boolean; rows: R5PayRow[] }

/** This week's wages: who gets what and how they feel about it (unpaid weeks first). Payday runs in the World Turn. */
export function r5Payday(block: DominionBlock): R5Payday {
  const wk = DOMINION_DATA.start.clock.weekLength;
  const rows = block.members.map((m) => ({
    id: m.id, name: m.name, look: m.look, wage: m.wage, owed: m.unpaid,
    mood: m.unpaid ? `Owed ${m.unpaid} week${m.unpaid === 1 ? '' : 's'}` : m.wage === 0 ? 'Unpaid rank' : m.morale >= 80 ? 'Thrilled' : m.morale < 40 ? 'Wants more' : m.loyalty >= 85 ? 'Expected' : 'Fair',
  }));
  const next = Math.ceil(block.day / wk) * wk;
  return { week: Math.ceil(block.day / wk), total: rows.reduce((t, r) => t + r.wage, 0), nextDay: next, today: block.day % wk === 0, rows };
}

/** The loyalty rows, highest first, and what moves it (Part 2 §5). */
export function r5Loyalty(block: DominionBlock): { rows: { id: string; name: string; look: string; loyalty: number }[]; low: string | null } {
  const rows = block.members.map((m) => ({ id: m.id, name: m.name, look: m.look, loyalty: m.loyalty })).sort((a, x) => x.loyalty - a.loyalty || a.name.localeCompare(x.name));
  const lowest = rows[rows.length - 1];
  return { rows, low: lowest && lowest.loyalty < C().rules.disloyalAt ? lowest.name : null };
}

// ---------- Training (mockup `school`): the Training and Growth tasks for one member ----------

export interface R5TrainRow { id: string; label: string; sub: string; tag: string; locked: string | null; current: boolean; icon: string; uses: string; risk: string; level: string }
export interface R5Training { member: string; look: string; count: string; rows: R5TrainRow[] }

const TRAIN_ICONS: Record<string, string> = { trade: 'g-secret-key', tutor: 'g-dark-gem', train: 'g-black-belt', trainMon: 'g-ball', drills: 'g-choice-band', coach: 'g-journal', rest: 'g-tea' };
const statName = (k: string): string => k[0]!.toUpperCase() + k.slice(1);

/** The crew tasks of the Training and Growth group (tasks.json) that are switched on, for member `sel`: what each
 *  does at the member's level, the odds (or why it's locked), and whether it's the member's task now. */
export function r5Training(block: DominionBlock, sel: number): R5Training {
  const b = withCrew(block);
  const m = b.members[Math.max(0, Math.min(sel, b.members.length - 1))]!;
  const c = crewOf(m);
  const rows = DOMINION_DATA.tasks.filter((t) => t.group === 'Training and Growth' && t.status !== 'disabled').map((t): R5TrainRow => {
    const locked = cantTake(m, t);
    const lv = taskLevel(m, t.id);
    const trade = t.effect?.kind === 'trade' ? nextTrade(m) : null;
    return {
      id: t.id, label: taskLabel(t.id),
      sub: trade ? `Next trade: ${statName(trade)} · ${t.levels[0]}` : (t.levels[Math.max(0, lv - 1)] ?? t.does),
      tag: locked ? 'locked' : taskOdds(b, m, t.id).odds,
      locked, current: c.task === t.id, icon: TRAIN_ICONS[t.effect?.kind ?? ''] ?? 'g-black-belt',
      uses: t.stat ? `Uses ${statName(t.stat)}` : 'Anyone can',
      risk: !t.risk || t.risk === '—' ? 'No risk' : `Risk: ${t.risk}`,
      level: t.does,
    };
  });
  const open = rows.filter((r) => !r.locked);
  return { member: m.name, look: m.look, count: `Training · ${open.length} of ${rows.length} open`, rows: [...open, ...rows.filter((r) => r.locked)] };
}

// ---------- Mole hunt (mockup `mole`): the clue wall ----------

export interface R5Suspect { id: string; i: number; name: string; look: string; sus: number; clue: string }
export interface R5Mole { suspects: R5Suspect[]; note: { text: string; day: number } | null; confrontAt: number }

/** Up to three members on the wall: the most suspected first (Suspicion above 0 or a clue on file), each with their
 *  latest clue. `note` is the newest clue of all. Reads spies state only. */
export function r5Mole(b: DominionBlock): R5Mole {
  const clues = b.spies?.clues ?? [];
  const suspects = b.members.map((m, i) => {
    const mine = clues.filter((q) => q.member === m.id);
    return { id: m.id, i, name: m.name, look: m.look, sus: suspicion(b, m.id), clue: mine.at(-1)?.text ?? 'No clues yet', n: mine.length };
  }).filter((x) => x.sus > 0 || x.n > 0).sort((a, z) => z.sus - a.sus || z.n - a.n || a.i - z.i).slice(0, 3).map(({ n, ...x }) => (void n, x));
  const last = clues.at(-1);
  return { suspects, note: last ? { text: last.text, day: last.day } : null, confrontAt: DOMINION_DATA.spies.suspicion.confrontAt };
}

// ---------- New card (mockup `pull`): a member who just joined ----------

export interface R5Pull { m: R5Member; beds: string; best: { label: string; value: number }; wage: number }

export function r5Pull(block: DominionBlock, id: string): R5Pull | null {
  const b = withCrew(block);
  const raw = b.members.find((x) => x.id === id);
  if (!raw) return null;
  const m = r5Member(b, raw);
  const top = [...m.stats].sort((a, z) => z.value - a.value)[0]!;
  return { m, beds: `Barracks ${b.members.length} of ${b.rosterCap} beds`, best: { label: top.label, value: top.value }, wage: raw.wage };
}

// ---------- Boss Edge (mockup `levelup`): the Boss's five Edge stats ----------

export interface R5EdgeRow { label: string; value: number; xp: number; need: number; max: boolean }
export interface R5Edge { rows: R5EdgeRow[]; perPoint: number; cap: number }

export function r5Edge(b: DominionBlock): R5Edge {
  const E = DOMINION_DATA.field.edge;
  const e = b.field.edge;
  return {
    rows: STAT_IDS.map((k) => ({ label: statName(k), value: e.stats[k], xp: e.xp[k], need: e.stats[k] * E.xpPerPoint, max: e.stats[k] >= E.cap })),
    perPoint: DOMINION_DATA.field.odds.statPer, cap: E.cap,
  };
}

// ---------- People you know (mockup `people`) ----------

export interface R5Person { name: string; sprite: string; i: number | null }
export interface R5PeopleSide { title: string; colour: string; people: R5Person[] }

/** Picture keys in the pass-50 sprite set for the people the data names (the UI falls back to an initial). */
const PEOPLE_SPRITES: Record<string, string> = { giovanni: 't-gio', archer: 'c-archer', petrel: 't-petrel', proton: 't-proton', red: 't-red', blue: 't-blue', silver: 't-silver', ethan: 't-ethan', may: 't-may', looker: 't-looker' };

/** Who the run knows: the crew, the rival teams in play this region (Boss, admins and grunts), the region's Hero
 *  (once one is on your trail) and the officers who can question you. Reads the block and the data only. */
export function r5People(b: DominionBlock): R5PeopleSide[] {
  const crew: R5PeopleSide = { title: 'Your crew', colour: '#c1121f', people: b.members.map((m, i) => ({ name: m.name, sprite: m.look, i })) };
  const rivals = DOMINION_DATA.rivals.teams.filter((t) => t.on && (!b.rivals || t.id in b.rivals.teams)).map((t): R5PeopleSide => ({
    title: t.name, colour: t.colour,
    people: [{ name: t.boss.name, sprite: PEOPLE_SPRITES[t.boss.id] ?? '', i: null }, ...t.admins.map((a) => ({ name: a.name, sprite: PEOPLE_SPRITES[a.id] ?? '', i: null })), { name: t.grunt.name, sprite: t.id === 'rocket' ? 't-grunt' : '', i: null }],
  }));
  const hero = b.hero ? DOMINION_DATA.hero.heroes.find((h) => h.id === b.hero!.id) : undefined;
  const heroes: R5PeopleSide[] = hero ? [{ title: 'The Hero', colour: '#e0294a', people: [{ name: hero.name, sprite: PEOPLE_SPRITES[hero.id] ?? '', i: null }] }] : [];
  const law: R5PeopleSide = { title: 'The law', colour: '#3f7fd9', people: DOMINION_DATA.police.officers.map((o) => ({ name: o.name, sprite: o.sprite, i: null })) };
  return [crew, ...rivals, ...heroes, law];
}
