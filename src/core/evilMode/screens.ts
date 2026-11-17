// Evil Mode view models (design Part 29): what each screen needs, as plain data. Screens draw these and decide nothing.

import { EVIL_DATA, type EvilData } from './data';
import { beatStrip } from './day';
import { checkName, foundingProblem, loyaltyBand, methodsLit, type FoundingChoice } from './start';
import { LINE_IDS, type Beat, type EvilModeBlock, type LineId, type RunLength } from './schema';

/** Founding's pages in slice 1, then the summary (design Part 29 section 3.2). */
export const FOUNDING_PAGES = ['boss', 'name', 'creed', 'line', 'doctrine', 'summary'] as const;
export type FoundingPage = (typeof FOUNDING_PAGES)[number];
export const PAGE_TITLE: Record<FoundingPage, string> = { boss: '1. The Boss', name: '2. The name', creed: '3. The Creed', line: '4. The Line', doctrine: '5. The Doctrine', summary: 'Found it' };

export interface FoundingDraft {
  page: FoundingPage;
  /** Cursor inside the page (a card, a stop, a suggestion). */
  at: number;
  name: string;
  creed: string | null;
  line: LineId;
  doctrine: string | null;
  /** The summary's confirm is showing. */
  confirming: boolean;
}

export const newDraft = (): FoundingDraft => ({ page: 'boss', at: 0, name: '', creed: null, line: 'grey', doctrine: null, confirming: false });

/** Every suggested name, in list order (Things, Places, Words). */
export const allSuggestions = (data: EvilData = EVIL_DATA): string[] => Object.values(data.founding.names.lists).flat();

/** Whether Next can be pressed on this page. */
export function pageReady(d: FoundingDraft, data: EvilData = EVIL_DATA): boolean {
  switch (d.page) {
    case 'name': return checkName(d.name, data).ok;
    case 'creed': return d.creed !== null;
    case 'doctrine': return d.doctrine !== null;
    case 'summary': return foundingProblem(choiceOf(d), data) === null;
    default: return true;
  }
}

export const choiceOf = (d: FoundingDraft): FoundingChoice => ({ name: d.name, creed: d.creed ?? '', line: d.line, doctrine: d.doctrine ?? '' });

export interface FoundingModel {
  page: FoundingPage;
  pages: { id: FoundingPage; title: string; on: boolean; done: boolean }[];
  at: number;
  ready: boolean;
  opening: string[];
  oldLookLine: string | null;
  boss: { name: string; file: string | null; starter: string; starterFile: string | null };
  name: { value: string; problem: string | null; lists: { title: string; names: string[] }[]; suggestion: string };
  creeds: { id: string; name: string; line: string; pays: string; applies: string; room: string; scheme: string; chosen: boolean; limited: boolean }[];
  lines: { id: LineId; name: string; feel: string; chosen: boolean }[];
  methods: { name: string; word: string; lit: boolean }[];
  doctrines: { id: string; name: string; line: string; perk: string; weakness: string; kits: string[]; chosen: boolean }[];
  summary: { rows: [string, string][]; confirmLine: string; confirming: boolean; problem: string | null };
  /** The Grunt on the right third: what they say and wear so far. */
  grunt: { says: string; face: string; kit: string[]; looksAway: boolean; litCount: number };
}

export function foundingModel(d: FoundingDraft, ctx: { bossName: string; bossFile: string | null; starter: string; starterFile: string | null; oldLook: boolean; length: RunLength }, data: EvilData = EVIL_DATA): FoundingModel {
  const i = FOUNDING_PAGES.indexOf(d.page);
  const creed = data.creeds.find((c) => c.id === d.creed);
  const doctrine = data.doctrines.find((x) => x.id === d.doctrine);
  const lineDef = data.founding.lines.find((l) => l.id === d.line)!;
  const check = checkName(d.name, data);
  const methods = methodsLit(d.line, data);
  const sugg = allSuggestions(data);
  return {
    page: d.page,
    pages: FOUNDING_PAGES.map((id, k) => ({ id, title: PAGE_TITLE[id], on: k === i, done: k < i })),
    at: d.at,
    ready: pageReady(d, data),
    opening: data.founding.opening,
    oldLookLine: ctx.oldLook ? data.founding.oldLookLine : null,
    boss: { name: ctx.bossName, file: ctx.bossFile, starter: ctx.starter, starterFile: ctx.starterFile },
    name: { value: d.name, problem: d.name ? check.problem : null, lists: Object.entries(data.founding.names.lists).map(([title, names]) => ({ title, names })), suggestion: sugg[d.at % sugg.length] ?? '' },
    creeds: data.creeds.map((c) => ({ id: c.id, name: c.name, line: c.line, pays: c.pays, applies: c.applies, room: c.room, scheme: c.scheme, chosen: c.id === d.creed, limited: c.status === 'limited' })),
    lines: data.founding.lines.map((l) => ({ id: l.id, name: l.name, feel: l.feel, chosen: l.id === d.line })),
    methods: methods.map((m) => ({ name: m.name, word: m.word, lit: m.lit })),
    doctrines: data.doctrines.map((x) => ({ id: x.id, name: x.name, line: x.line, perk: x.perk, weakness: x.weakness, kits: x.kits.map((k) => k.join(' + ')), chosen: x.id === d.doctrine })),
    summary: {
      rows: [
        ['Boss', ctx.bossName],
        ['Starter', ctx.starter],
        ['Name', check.ok ? `Team ${check.name}` : '(not chosen)'],
        ['Creed', creed ? `${creed.name}: "${creed.line}"` : '(not chosen)'],
        ['Line', lineDef.name],
        ['Doctrine', doctrine ? `${doctrine.name}: "${doctrine.line}"` : '(not chosen)'],
        ['Run length', ctx.length === 'six' ? 'Six regions' : 'Three regions'],
        ['First region', data.founding.region.name],
      ],
      confirmLine: data.founding.confirmLine,
      confirming: d.confirming,
      problem: foundingProblem(choiceOf(d), data),
    },
    grunt: {
      says: check.ok ? `Team ${check.name}!` : d.page === 'boss' ? '...' : 'Team... what, Boss?',
      face: creed?.face ?? 'plain',
      kit: doctrine?.kits[0] ?? [],
      looksAway: d.line === 'whatever',
      litCount: methods.filter((m) => m.lit).length,
    },
  };
}

/** A step left or right on the Line slider. */
export const moveLine = (line: LineId, by: number): LineId => LINE_IDS[Math.max(0, Math.min(LINE_IDS.length - 1, LINE_IDS.indexOf(line) + by))]!;

export interface FrameModel {
  team: { name: string; creed: string; line: string; doctrine: string; boss: string; a: string; b: string };
  /** The top strip (design Part 29 section 2.1). Corruption is null at 0: the slot isn't drawn. */
  strip: { funds: number; heat: number; loyalty: { name: string; face: string }; regard: number; dread: number; corruption: number | null };
  chips: string[];
  beats: { id: Beat; name: string; state: 'done' | 'now' | 'later' }[];
  button: string;
  text: string;
}

export function frameModel(block: EvilModeBlock, bossName: string, data: EvilData = EVIL_DATA): FrameModel {
  const t = block.team;
  const beatDef = (b: Beat) => data.founding.beats.find((x) => x.id === b)!;
  const now = beatDef(block.here.beat);
  return {
    team: {
      name: `Team ${t.name}`,
      creed: data.creeds.find((c) => c.id === t.creed)?.name ?? t.creed,
      line: data.founding.lines.find((l) => l.id === t.line)?.name ?? t.line,
      doctrine: data.doctrines.find((x) => x.id === t.doctrine)?.name ?? t.doctrine,
      boss: bossName,
      a: t.look.a,
      b: t.look.b,
    },
    strip: { funds: t.funds, heat: t.heat, loyalty: loyaltyBand(block, data), regard: t.regard, dread: t.dread, corruption: t.corruption > 0 ? t.corruption : null },
    chips: [`${data.founding.region.name} · District ${block.here.stage} · Day ${block.here.day}`],
    beats: beatStrip(block).map((s) => ({ id: s.beat, name: beatDef(s.beat).name, state: s.state })),
    button: now.button,
    text: now.empty,
  };
}
