// Evil Mode view models (design Part 29): what each screen needs, as plain data. Screens draw these and decide nothing.

import { dreadWord, heatStep } from './line';
import { EVIL_DATA, type EvilData } from './data';
import { beatStrip } from './day';
import { clockChip } from './crossing';
import { dayIn, stageName } from './region';
import { modify, regionOf } from './regionRule';
import { lookMood, stageRow } from './board';
import { stepsOn } from './hero';
import { checkName, foundingProblem, loyaltyBand, methodsLit, type FoundingChoice } from './start';
import { LINE_IDS, type Beat, type EvilModeBlock, type LineId, type RunLength } from './schema';

/** Founding's pages in slice 1, then the summary (design Part 29 section 3.2). */
export const FOUNDING_PAGES = ['boss', 'name', 'creed', 'line', 'doctrine', 'look', 'patron', 'region', 'summary'] as const;
export type FoundingPage = (typeof FOUNDING_PAGES)[number];
export const PAGE_TITLE: Record<FoundingPage, string> = { boss: '1. The Boss', name: '2. The name', creed: '3. The Creed', line: '4. The Line', doctrine: '5. The Doctrine', look: '6. The Look', patron: '7. The Patron', region: '8. The first region', summary: 'Found it' };
/** The Look page's rows (slice 9): two colours, a symbol, a cut, headgear, and the motto's three slots. */
export const LOOK_ROWS = ['a', 'b', 'symbol', 'cut', 'head', 'm0', 'm1', 'm2'] as const;
export type LookRow = (typeof LOOK_ROWS)[number];

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
  /** Slice 9: the Look, as an index into each row's list; the Patron; the first region. */
  look: Record<LookRow, number>;
  patron: string;
  region: string;
}

export const newDraft = (): FoundingDraft => ({ page: 'boss', at: 0, name: '', creed: null, line: 'grey', doctrine: null, confirming: false, look: { a: 11, b: 2, symbol: 0, cut: 0, head: 0, m0: 0, m1: 0, m2: 0 }, patron: 'nobody', region: 'kanto' });

/** Each Look row's choices, in order (region.json `look`). */
export function lookChoices(row: LookRow, data: EvilData = EVIL_DATA): string[] {
  const L = data.region.look;
  if (row === 'a') return L.a.map(([n]) => n);
  if (row === 'b') return L.b.map(([n]) => n);
  if (row === 'symbol') return L.symbols;
  if (row === 'cut') return L.cuts;
  if (row === 'head') return L.heads;
  return L.motto[Number(row.slice(1)) as 0 | 1 | 2].map((x) => x || '(nothing)');
}

/** Turn one Look row left or right (it wraps). */
export const turnLook = (d: FoundingDraft, row: LookRow, by: number, data: EvilData = EVIL_DATA): FoundingDraft => {
  const n = lookChoices(row, data).length;
  return { ...d, look: { ...d.look, [row]: (d.look[row] + by + n) % n } };
};

/** The Look as the founding choice keeps it: hex colours, names for the rest. */
export function lookOf(d: FoundingDraft, data: EvilData = EVIL_DATA): NonNullable<FoundingChoice['look']> {
  const L = data.region.look;
  return { a: L.a[d.look.a]![1], b: L.b[d.look.b]![1], symbol: L.symbols[d.look.symbol]!, cut: L.cuts[d.look.cut]!, head: L.heads[d.look.head]!, motto: [L.motto[0][d.look.m0]!, L.motto[1][d.look.m1]!, L.motto[2][d.look.m2] ?? ''] };
}

/** The motto, said: "Somebody's got to. And no further." */
export const mottoText = (m: [string, string, string]): string => `${m[0]} ${m[1]}.${m[2] ? ` ${m[2].charAt(0).toUpperCase()}${m[2].slice(1)}.` : ''}`;

/** Every suggested name, in list order (Things, Places, Words). */
export const allSuggestions = (data: EvilData = EVIL_DATA): string[] => Object.values(data.founding.names.lists).flat();

/** Whether Next can be pressed on this page. */
export function pageReady(d: FoundingDraft, data: EvilData = EVIL_DATA): boolean {
  switch (d.page) {
    case 'name': return checkName(d.name, data).ok;
    case 'creed': return d.creed !== null;
    case 'doctrine': return d.doctrine !== null;
    case 'summary': return foundingProblem(choiceOf(d, data), data) === null;
    case 'region': return data.region.regions.some((r) => r.id === d.region && r.status !== 'disabled' && r.status !== 'invalid');
    default: return true;
  }
}

export const choiceOf = (d: FoundingDraft, data: EvilData = EVIL_DATA): FoundingChoice => ({ name: d.name, creed: d.creed ?? '', line: d.line, doctrine: d.doctrine ?? '', ...(data.region.on ? { look: lookOf(d, data), patron: d.patron, region: d.region } : {}) });

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
  /** Slice 9: the Look page's rows (each with its choice and a warning where the Look does something), the Patrons, the nine tickets. */
  look: { rows: { id: LookRow; label: string; value: string; sel: boolean }[]; notes: string[]; motto: string; a: string; b: string };
  patrons: { id: string; name: string; who: string; line: string; gives: string; chosen: boolean; limited: string | null }[];
  regions: { id: string; name: string; ticket: string[]; open: boolean; waits: string | null; chosen: boolean }[];
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
  const patronDef = data.region.patrons.find((p) => p.id === d.patron);
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
        ['Look', `${lookChoices('a', data)[d.look.a]} and ${lookChoices('b', data)[d.look.b]}; ${lookChoices('cut', data)[d.look.cut]!.toLowerCase()}. "${mottoText(lookOf(d, data).motto!)}"`],
        ['Patron', `${patronDef?.name ?? 'Nobody'}${patronDef && patronDef.id !== 'nobody' ? `: ${patronDef.who}` : ''}`],
        ['Run length', ctx.length === 'six' ? 'Six regions' : 'Three regions'],
        ['First region', data.region.regions.find((r) => r.id === d.region)?.name ?? data.founding.region.name],
      ],
      confirmLine: data.founding.confirmLine,
      confirming: d.confirming,
      problem: foundingProblem(choiceOf(d, data), data),
    },
    look: {
      rows: LOOK_ROWS.map((id, k) => ({ id, label: LOOK_LABEL[id], value: lookChoices(id, data)[d.look[id]] ?? '', sel: d.page === 'look' && d.at === k })),
      notes: lookNotes(d, data),
      motto: mottoText(lookOf(d, data).motto!),
      a: lookOf(d, data).a, b: lookOf(d, data).b,
    },
    patrons: data.region.patrons.map((p) => ({ id: p.id, name: p.name, who: p.who, line: p.line, gives: p.gives, chosen: p.id === d.patron, limited: p.limit ?? null })),
    regions: data.region.regions.map((r) => ({ id: r.id, name: r.name, ticket: r.ticket.map((t) => t.replace('{homes}', String(homesFor(r.homes, d.doctrine)))), open: r.status !== 'disabled' && r.status !== 'invalid', waits: r.waits ?? null, chosen: r.id === d.region })),
    grunt: {
      says: d.page === 'patron' && patronDef ? (patronDef.id === 'nobody' ? '(An echo.)' : `"${patronDef.line}"`) : d.page === 'look' && check.ok ? `"${mottoText(lookOf(d, data).motto!)}"` : check.ok ? `Team ${check.name}!` : d.page === 'boss' ? '...' : 'Team... what, Boss?',
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
  strip: { funds: number; heat: number; loyalty: { name: string; face: string }; regard: number; dread: number; corruption: number | null;
    /** Slice 6: the Heat ladder's word and what the law's doing; amber lamps up to `amberTo`, red after; a red rule from `rule`; Dread's word. */
    heatTip: string; amberTo: number; rule: boolean; dreadTip: string };
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
    strip: {
      funds: t.funds, heat: t.heat, loyalty: loyaltyBand(block, data), regard: t.regard, dread: t.dread, corruption: t.corruption > 0 ? t.corruption : null,
      heatTip: `Heat ${t.heat}. ${heatStep(t.heat, data).word}: ${heatStep(t.heat, data).doing}`, amberTo: data.line.heat.lamps.amberTo, rule: t.heat >= data.line.heat.lamps.rule,
      dreadTip: `Dread ${t.dread}. ${dreadWord(t.dread, data)}.`,
    },
    chips: regionChips(block, data),
    beats: beatStrip(block).map((s) => ({ id: s.beat, name: beatDef(s.beat).name, state: s.state })),
    button: now.button,
    text: now.empty,
  };
}

/**
 * The corner chips (slice 9): the region, the stage and its day; the region's one rule, on the frame all region (Part 26a
 * section 1.2); with the Champion who quit as Patron, the Hero's next Gym and the days until (Part 3 section 9.4).
 */
export function regionChips(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  if (!data.region.on) return [`${data.founding.region.name} · District ${block.here.stage} · Day ${block.here.day}`];
  const region = regionOf(block, data);
  const out = [`${region?.name ?? data.founding.region.name} · ${stageName(block.here.stage, data)} · Day ${dayIn(block)}`];
  if (region?.rule) out.push(`${region.name}: ${region.rule.name}`);
  const clock = clockChip(block, data);
  if (clock) out.push(clock);
  if (modify(block, 'heroGym', {}, 0, data) > 0 && block.hero && block.district) {
    const row = stageRow(block.district.region, block.district.n, data);
    const steps = Math.max(0, 20 - block.hero.at);
    const pace = Math.max(1, stepsOn(block.hero, block.here.day, data));
    out.push(`The kid's next Gym: ${row?.town ?? 'the Gym'}, about ${Math.ceil(steps / pace)} day${Math.ceil(steps / pace) === 1 ? '' : 's'}`);
  }
  return out;
}

const LOOK_LABEL: Record<LookRow, string> = { a: 'First colour', b: 'Second colour', symbol: 'A symbol', cut: 'A cut', head: 'Headgear', m0: 'Motto, 1', m1: 'Motto, 2', m2: 'Motto, 3' };

/** What the Look does, printed beside it (Part 3 section 8): black and red, the armband, and the Patron's eyebrow. */
function lookNotes(d: FoundingDraft, data: EvilData): string[] {
  const L = data.region.look;
  const out: string[] = [];
  const look = lookOf(d, data);
  if (lookMood(look, data) < 0) out.push(L.cold.line);
  if (look.cut === L.warm.cut) out.push(L.warm.line);
  if (look.motto?.[2] === 'whatever it takes' && d.line === 'clean') out.push(L.eyebrow);
  return out;
}

/** How many of a region's six districts a Doctrine's at home in (the ticket's third line). */
const homesFor = (homes: Record<string, number[]> | undefined, doctrine: string | null): number => (doctrine ? homes?.[doctrine]?.length ?? 0 : 0);
