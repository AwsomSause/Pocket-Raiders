// Evil Mode slice 22: the nine Charters (design Part 28 sections 2 to 13). A Charter is a fixed page of data: it reads
// nothing but charters.json and the seed, never the profile and never an earlier run. Pure: no Phaser, no new stream
// (the Roster is drawn on `evil-people`, as a founded team's is).

import { z } from 'zod';
import chartersRaw from '../../data/evilMode/charters.json';
import { EVIL_DATA, type EvilData } from './data';
import { foundTeam } from './start';
import { bandOf, foundingRoster, teamLoyalty } from './people';
import { appendLog } from './ledger';
import { EvilModeBlockSchema, LINE_IDS, type CharterState, type Crew, type EvilModeBlock, type RunLength } from './schema';

const S = z.string().min(1);
const N = z.number().int();
const CharterSchema = z.object({
  id: S, name: S, teamName: S, question: S, status: z.enum(['supported', 'limited', 'disabled']),
  creed: S, line: z.enum(LINE_IDS), lineFixed: z.boolean().optional(), doctrine: S, region: S,
  look: z.object({ a: S, b: S, motto: z.string() }).strict(),
  patron: z.object({ name: S, age: N.min(18), talent: S, flaw: S, note: S }).strict(),
  start: z.object({ funds: N.min(0), heat: N.min(0).max(10), loyalty: N.min(0).max(10), regard: N.min(0).max(10), dread: N.min(0).max(10), corruption: N.min(0).max(10) }).strict(),
  roster: N.min(1).max(10), rooms: z.array(S).min(1), roll: N.min(1).optional(),
  methodsOff: z.array(S).optional(), heatCeiling: N.min(0).max(10).optional(), dreadFixed: z.boolean().optional(), noMinors: z.boolean().optional(),
  morning: z.array(S).min(1),
  desk: z.array(z.object({ day: N.min(1), title: S, text: S }).strict()).length(3),
  rule: z.object({ id: S, name: S, text: S }).strict(),
  oldGuard: z.object({ name: S, text: S, turnLine: S }).strict(),
  dayThree: S, figure: S, limits: S.optional(),
}).strict();
export const ChartersFileSchema = z.object({
  note: z.string(), on: z.boolean(), loyaltyDoubleDays: N.min(0), returnCosts: z.array(N.min(1)).min(1), rollPerDay: N.min(1),
  staffHeatCeiling: N.min(0), flareDues: N.min(0), flareMembers: N.min(1),
  jointName: z.object({ atLeast: N.min(0).max(10), names: z.array(S).min(1) }).strict(),
  tab: S, tabLine: S, lastPage: S,
  turn: z.object({
    title: S, fields: z.array(z.tuple([S, S])).length(4), staffChanges: S, take: S, walk: S, confirm: S, oldLookLine: S,
    fundsCap: N.min(0), regardPerBadges: N.min(1), regardCeiling: N.min(0).max(10), loyalty: N.min(0).max(10), dread: N.min(0).max(10), ledgerFirst: S, meetingDay: N.min(1),
  }).strict(),
  teams: z.record(z.string(), S),
  charters: z.array(CharterSchema).length(9),
}).strict();
export type Charter = z.infer<typeof CharterSchema>;
export type ChartersFile = z.infer<typeof ChartersFileSchema>;
export const CHARTERS: ChartersFile = ChartersFileSchema.parse(chartersRaw);

export const charterDef = (id: string | undefined, file: ChartersFile = CHARTERS): Charter | undefined => file.charters.find((c) => c.id === id);
export const charterOf = (block: Pick<EvilModeBlock, 'charter'>, file: ChartersFile = CHARTERS): Charter | undefined => charterDef(block.charter?.id, file);
/** Every Charter that can be taken (supported or limited): all nine, from the first play. Nothing unlocks them. */
export const chartersOpen = (file: ChartersFile = CHARTERS): Charter[] => (file.on ? file.charters.filter((c) => c.status !== 'disabled') : []);

const freshState = (c: Charter, crew: Crew[], file: ChartersFile): CharterState => ({
  id: c.id, rule: c.rule.id, returned: 0, returnedOn: 0, answered: 0, read: 0, streak: 0, answeredOn: 0, paidIn: [], missed: 0,
  // The Joint Command: every second person's blue (the Patron, first, is red), so both halves start the same size.
  blue: c.rule.id === 'two-colours' ? crew.filter((_, i) => i % 2 === 1).map((p) => p.id) : [],
  named: c.rule.id !== 'two-colours', dues: 0, duesOn: [], doubleTo: file.loyaltyDoubleDays,
});

/**
 * Takes a Charter (Part 28 section 2): founding's pages 2 to 8 filled by the Charter, page 1 (the Boss, the starter)
 * the player's. Same Charter and seed: the same first Morning, desk and Roster, on any profile.
 */
export function takeCharter(id: string, opts: { boss: string; length: RunLength; seed?: string }, data: EvilData = EVIL_DATA, file: ChartersFile = CHARTERS): { ok: true; block: EvilModeBlock } | { ok: false; problem: string } {
  const c = charterDef(id, file);
  if (!file.on || !c || c.status === 'disabled') return { ok: false, problem: 'Choose a Charter.' };
  const region = data.region.on ? data.region.regions.find((r) => r.id === c.region && r.status !== 'disabled' && r.status !== 'invalid') : undefined;
  const choice = { name: 'Charter', creed: c.creed, line: c.line, doctrine: c.doctrine, ...(data.region.on ? { patron: 'nobody', region: region?.id ?? 'kanto' } : {}) };
  const out = foundTeam(choice, opts, data);
  if (!out.ok) return out;
  const seed = opts.seed ?? opts.boss;
  // The house is nearly full: the Charter's Patron, then the Founders drawn on `evil-people` (no minor: Part 28 12.2).
  const seats = Math.min(c.roster, data.people.rules.rosterCap) - 1;
  const roster = foundingRoster(seed, c.creed, { ...data, creeds: data.creeds.map((x) => (x.id === c.creed ? { ...x, start: { ...x.start, roster: seats } } : x)) });
  const patron: Crew = { id: 'charter-patron', ref: null, name: c.patron.name, age: c.patron.age, minor: false, talent: c.patron.talent as Crew['talent'], flaw: c.patron.flaw as Crew['flaw'], flawFound: true, line: null, lineHeard: false, rank: 'officer', loyalty: c.start.loyalty, where: 'in', outOn: null, jobs: 0, asked: 0, unpaid: 0, fitIn: null };
  const crew = [patron, ...roster.crew.filter((p) => !(c.noMinors && p.minor)).map((p) => ({ ...p, loyalty: c.start.loyalty }))];
  const b0 = out.block;
  let block: EvilModeBlock = {
    ...b0,
    from: 'charter',
    team: { ...b0.team, name: c.teamName, funds: c.start.funds, heat: c.start.heat, regard: c.start.regard, dread: c.start.dread, corruption: c.start.corruption, look: { ...b0.team.look, a: c.look.a, b: c.look.b } },
    crew,
    drawn: roster.crew.map((p) => p.id),
    draws: { ...b0.draws, 'evil-people': roster.draws },
    charter: freshState(c, crew, file),
  };
  // The first Morning and the desk are the Ledger's first lines (Part 28 sections 4.1, 4.2): the Charter's own, printed.
  block = appendLog(block, { kind: 'charter', who: [], text: `Day 1. ${c.morning.join(' ')}` });
  for (const d of c.desk) block = appendLog(block, { kind: 'charter', who: [], text: `On the desk, day ${d.day}: ${d.title}. ${d.text}` });
  block = appendLog(block, { kind: 'charter', who: [], text: `Across the line: ${c.oldGuard.name}. ${c.oldGuard.text}` });
  return { ok: true, block: EvilModeBlockSchema.parse(block) };
}

// ---- The house rules (Part 28 sections 4.3 to 12.4) ----

/** The roll (Part 28 section 2.3): a display figure, full roll × Loyalty ÷ 10, rounded down. It changes nothing. */
export const rollFigure = (full: number, loyalty: number): number => Math.floor((full * loyalty) / 10);

/** The Joint Command's two halves (Part 28 section 6.3): red and blue Loyalty, each the mean of its people in, rounded down. */
export function halves(block: Pick<EvilModeBlock, 'crew' | 'charter'>): { red: number; blue: number } | null {
  if (block.charter?.rule !== 'two-colours') return null;
  const blue = new Set(block.charter.blue);
  const ins = block.crew.filter((c) => c.where === 'in');
  const mean = (xs: Crew[]) => (xs.length ? Math.floor(xs.reduce((n, c) => n + c.loyalty, 0) / xs.length) : 0);
  return { red: mean(ins.filter((c) => !blue.has(c.id))), blue: mean(ins.filter((c) => blue.has(c.id))) };
}

/** Methods a Charter never offers (the Staff Room: Take and Lean). Absent from Dispatch, not dark. */
export const methodsOff = (block: Pick<EvilModeBlock, 'charter'>, file: ChartersFile = CHARTERS): string[] => charterOf(block, file)?.methodsOff ?? [];

export type CharterAct = { what: 'return' } | { what: 'answer' } | { what: 'name'; name: string };
type R = { block: EvilModeBlock; problem: string | null; lines: string[] };

/** The next thing Carrow's valued: a fixed list, in order, so a return's price is known before it's paid. */
export const returnCost = (block: Pick<EvilModeBlock, 'charter'>, file: ChartersFile = CHARTERS): number => file.returnCosts[(block.charter?.returned ?? 0) % file.returnCosts.length]!;

/** A house rule's own act. */
export function charterAct(block: EvilModeBlock, act: CharterAct, file: ChartersFile = CHARTERS): R {
  const st = block.charter;
  const no = (problem: string): R => ({ block, problem, lines: [] });
  if (!st) return no('This team took no Charter.');
  const put = (b: EvilModeBlock, charter: CharterState, line: string, given = 0): R => ({ block: appendLog({ ...b, charter }, { kind: 'charter', who: [], text: `Day ${b.here.day}. ${line}`, ...(given ? { given } : {}) }), problem: null, lines: [line] });
  switch (act.what) {
    case 'return': {
      // Rocket (4.3): any Evening, one thing; it costs the valuation, pays Regard +1, never Funds, never cools Heat.
      if (st.rule !== 'ledger-returns') return no('Nothing here is returned.');
      if (block.here.beat !== 'evening') return no('Things go back at the Evening.');
      if (st.returnedOn === block.here.day) return no('One thing an Evening. Faye\'s already out with today\'s.');
      const cost = returnCost(block, file);
      if (block.team.funds < cost) return no(`It's valued at ₽${cost}. The team hasn't got it.`);
      const team = { ...block.team, funds: block.team.funds - cost, regard: Math.min(10, block.team.regard + 1) };
      return put({ ...block, team }, { ...st, returned: st.returned + 1, returnedOn: block.here.day }, `Returned: one thing, valued at ₽${cost}. Faye carries it. Regard +1.`, cost);
    }
    case 'answer': {
      // Rocket's Return (5.3): the register, every Morning. Seven running: Loyalty +1, once a region.
      if (st.rule !== 'roll-call') return no('Nobody here calls a roll.');
      if (block.here.beat !== 'morning') return no('The roll is called at the Morning.');
      if (st.answeredOn === block.here.day) return no('Already marked present.');
      const streak = st.streak + 1;
      const pay = streak >= 7 && !st.paidIn.includes(block.here.region);
      const crew = pay ? block.crew.map((c) => (c.where === 'in' ? { ...c, loyalty: Math.min(10, c.loyalty + 1) } : c)) : block.crew;
      return put({ ...block, crew }, { ...st, answered: st.answered + 1, streak, answeredOn: block.here.day, paidIn: pay ? [...st.paidIn, block.here.region] : st.paidIn }, pay ? 'Sabela: "Seven. That\'s the record." Loyalty +1.' : 'Sabela marks the register: present.');
    }
    case 'name': {
      // The Joint Command (6.3): offered once both halves reach 6; the Hall's vote names it.
      if (st.rule !== 'two-colours') return no('This team has its name.');
      if (st.named) return no('The Hall has named the team.');
      const h = halves(block)!;
      if (h.red < file.jointName.atLeast || h.blue < file.jointName.atLeast) return no(`The Hall won't vote until both halves are at ${file.jointName.atLeast}.`);
      if (!file.jointName.names.includes(act.name)) return no('That name isn\'t on the Hall\'s list.');
      return put({ ...block, team: { ...block.team, name: act.name.replace(/^Team /, '') } }, { ...st, named: true }, `The Hall votes. ${act.name}. Lior repaints the corridor that night, in green.`);
    }
  }
}

/** Refusals a Charter adds before any step (the Staff Room's locks, Part 28 section 12.2). Null: go ahead. */
export function charterRefuses(block: EvilModeBlock, action: { type: string; job?: { method?: string }; to?: string; ref?: string }, data: EvilData = EVIL_DATA, file: ChartersFile = CHARTERS): string | null {
  const c = charterOf(block, file);
  if (!c) return null;
  if (c.lineFixed && action.type === 'moveLine') return "The Line doesn't move here.";
  const off = c.methodsOff ?? [];
  if (off.length && (action.type === 'queueJob' || action.type === 'confirmCard' || action.type === 'askAnyway') && off.includes(action.job?.method ?? '')) return 'That was never offered.';
  if (c.noMinors && action.type === 'hire') {
    const a = block.applicants.find((x) => x.ref === action.ref);
    const p = a ? data.people.people.find((x) => x.id === a.ref) : undefined;
    if (p?.minor) return 'No child goes on this Roster.';
  }
  return null;
}

/**
 * After every step (Part 28 sections 2.3 and 9 to 12): the first week's Loyalty moves count double; the Staff Room's
 * Dread stays 0 and Heat stops at its ceiling; the roll-call's missed days and Flare's dues are counted on each new day.
 */
export function charterMoves(before: EvilModeBlock, after: EvilModeBlock, file: ChartersFile = CHARTERS): EvilModeBlock {
  const st = after.charter;
  const c = charterOf(after, file);
  if (!st || !c) return after;
  let out = after;
  if (before.here.day <= st.doubleTo && before.here.region === after.here.region) {
    const was = new Map(before.crew.map((p) => [p.id, p.loyalty]));
    let moved = false;
    const crew = out.crew.map((p) => {
      const w = was.get(p.id);
      if (w === undefined || w === p.loyalty) return p;
      moved = true;
      return { ...p, loyalty: Math.max(0, Math.min(10, w + 2 * (p.loyalty - w))) };
    });
    if (moved) out = { ...out, crew };
  }
  if (c.dreadFixed && out.team.dread !== 0) out = { ...out, team: { ...out.team, dread: 0 } };
  const ceiling = c.heatCeiling;
  if (ceiling !== undefined && out.team.heat > ceiling) out = { ...out, team: { ...out.team, heat: ceiling } };
  if (after.here.day > before.here.day) {
    const s = out.charter!;
    if (s.rule === 'roll-call') {
      const missed = s.answeredOn !== before.here.day;
      out = { ...out, charter: { ...s, read: s.read + 1, missed: s.missed + (missed ? 1 : 0), streak: missed ? 0 : s.streak } };
    }
    if (s.rule === 'members' && before.here.day % 7 === 0 && !s.duesOn.includes(before.here.day)) {
      const members = Math.min(file.flareMembers, out.crew.filter((p) => p.where === 'in').length);
      const paid = members * file.flareDues;
      out = appendLog({ ...out, team: { ...out.team, funds: out.team.funds + paid }, charter: { ...s, dues: s.dues + paid, duesOn: [...s.duesOn, before.here.day] } }, { kind: 'charter', who: [], text: `Day ${before.here.day}. Dinner. ${members} members laid for; dues ₽${paid}.` });
    }
  }
  return out;
}

/** The line the Ledger's last page gains on a Charter (Part 28 section 13): the question, and the run's figure. */
export function questionLine(block: EvilModeBlock, bossName: string, file: ChartersFile = CHARTERS): string | null {
  const c = charterOf(block, file);
  const s = block.charter;
  if (!c || !s) return null;
  const h = halves(block);
  const figure = c.figure
    .replace('{taken}', block.taken.toLocaleString('en-GB')).replace('{given}', block.given.toLocaleString('en-GB'))
    .replace('{returned}', String(s.returned)).replace('{answered}', String(s.answered)).replace('{days}', String(s.read))
    .replace('{red}', bandOf(h?.red ?? 0).name).replace('{blue}', bandOf(h?.blue ?? 0).name).replace('{dues}', s.dues.toLocaleString('en-GB'))
    .replace('{boss}', bossName);
  return file.lastPage.replace('{question}', c.question).replace('{figure}', figure);
}

/** A Morning line for the house (the roll's figure, the register's count, the two halves), or null. */
export function houseLine(block: EvilModeBlock, file: ChartersFile = CHARTERS): string | null {
  const c = charterOf(block, file);
  const s = block.charter;
  if (!c || !s) return null;
  const loyalty = teamLoyalty(block);
  const parts = [c.rule.name];
  if (c.roll) parts.push(`The roll: ${rollFigure(Math.max(0, c.roll - 10 * s.missed), loyalty)}`);
  if (s.rule === 'ledger-returns') parts.push(`Returned: ${s.returned}`);
  if (s.rule === 'roll-call') parts.push(`Answered ${s.answered} of ${s.read + 1}`);
  const h = halves(block);
  // Loyalty is never shown as a figure (Part 29 test 3): each half's band word.
  if (h) parts.push(`Red: ${bandOf(h.red).name}. Blue: ${bandOf(h.blue).name}`);
  return parts.join(' · ');
}

/** The house rule's buttons for this beat (each also on the U key, first that can be pressed). */
export function houseActs(block: EvilModeBlock, file: ChartersFile = CHARTERS): { label: string; act: CharterAct; problem: string | null }[] {
  const s = block.charter;
  if (!s || block.ending) return [];
  const test = (act: CharterAct) => charterAct(block, act, file).problem;
  if (s.rule === 'ledger-returns' && block.here.beat === 'evening') return [{ label: `Return one thing (₽${returnCost(block, file)})`, act: { what: 'return' }, problem: test({ what: 'return' }) }];
  if (s.rule === 'roll-call' && block.here.beat === 'morning') return [{ label: 'Answer the roll: "Present."', act: { what: 'answer' }, problem: test({ what: 'answer' }) }];
  if (s.rule === 'two-colours' && !s.named) {
    const acts = file.jointName.names.map((name) => ({ label: `Vote: ${name}`, act: { what: 'name' as const, name }, problem: test({ what: 'name', name }) }));
    return acts[0]!.problem ? [] : acts;
  }
  return [];
}

/** The Founding screen's Charters tab (Part 29 section 3.2): nine tabs down the left; the chosen Charter's pages, its five things, and the trouble on day three, printed. */
export interface CharterTabModel {
  line: string;
  tabs: { id: string; name: string; sel: boolean; limited: boolean }[];
  sel: {
    id: string; name: string; question: string; rows: [string, string][]; desk: string[]; rule: string; oldGuard: string; dayThree: string; morning: string[]; limits: string | null;
    patron: string;
  };
  confirming: boolean;
  confirmLine: string;
}

export function charterTabModel(at: number, confirming: boolean, data: EvilData = EVIL_DATA, file: ChartersFile = CHARTERS): CharterTabModel {
  const open = chartersOpen(file);
  const c = open[Math.max(0, Math.min(open.length - 1, at))]!;
  const name = (list: { id: string; name: string }[], id: string) => list.find((x) => x.id === id)?.name ?? id;
  const lineName = data.founding.lines.find((l) => l.id === c.line)?.name ?? c.line;
  const s = c.start;
  return {
    line: file.tabLine,
    tabs: open.map((x, i) => ({ id: x.id, name: x.name, sel: i === at, limited: x.status === 'limited' })),
    sel: {
      id: c.id, name: c.name, question: c.question,
      rows: [
        ['Name', `Team ${c.teamName}`],
        ['Creed', name(data.creeds, c.creed)],
        ['Line', `${lineName}${c.lineFixed ? " (it can't be moved)" : ''}`],
        ['Doctrine', name(data.doctrines, c.doctrine)],
        ['Motto', c.look.motto ? `"${c.look.motto}"` : 'None. The field is empty.'],
        ['First region', data.region.regions.find((r) => r.id === c.region)?.name ?? c.region],
        ['The house', `${c.rooms.join(', ')}. A Roster of ${Math.min(c.roster, data.people.rules.rosterCap)}.`],
        ['Starts at', `₽${s.funds.toLocaleString('en-GB')} · Heat ${s.heat} · Regard ${s.regard} · Dread ${s.dread}`],
      ],
      desk: c.desk.map((d) => `Day ${d.day}: ${d.title}. ${d.text}`),
      rule: `${c.rule.name}. ${c.rule.text}`,
      oldGuard: `${c.oldGuard.name}. ${c.oldGuard.text}`,
      dayThree: c.dayThree,
      morning: c.morning,
      limits: c.status === 'limited' ? c.limits ?? null : null,
      patron: `${c.patron.name}, ${c.patron.note}`,
    },
    confirming,
    confirmLine: 'All of this is permanent except the Line. Press Take it again to take it.',
  };
}
