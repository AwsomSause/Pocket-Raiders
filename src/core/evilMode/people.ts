// Evil Mode's people (design Part 9, Part 10a, Part 5 section 5, Part 30 sections 3.3, 4 and 5): who someone is, from
// the deck; their wage by rank; their Loyalty as a face; the team's Loyalty (worked out, never stored); the lines a job
// crosses; and the `evil-people` stream. Pure: nothing here changes a block. Text comes from people.json.

import { hashSeed, Rng } from '../rng';
import { modify, PATRON_ID } from './regionRule';
import { EVIL_DATA, type EvilData } from './data';
import type { Crew, EvilModeBlock, Holding, JobMethod, Rank, Talent } from './schema';
import { localOf } from './board';

export type DeckPerson = EvilData['people']['people'][number];

export const deckPerson = (ref: string | null, data: EvilData = EVIL_DATA): DeckPerson | undefined => (ref ? data.people.people.find((p) => p.id === ref) : undefined);
export const talentDef = (t: Talent, data: EvilData = EVIL_DATA) => data.people.talents.find((x) => x.id === t)!;
export const flawDef = (f: string, data: EvilData = EVIL_DATA) => data.people.flaws.find((x) => x.id === f)!;
/** A flaw's name, or the word for none listed (Part 10b section 6: one person has none). */
export const flawName = (f: string | null, data: EvilData = EVIL_DATA): string => (f ? flawDef(f, data).name : 'None listed');
export const rankDef = (r: Rank, data: EvilData = EVIL_DATA) => data.people.ranks.find((x) => x.id === r)!;
export const peopleText = (k: string, data: EvilData = EVIL_DATA): string => {
  const t = data.people.text[k];
  return typeof t === 'string' ? t : '';
};

/** A person's line, as they'd say it (their own wording where the deck has one). */
export function lineText(p: Pick<Crew, 'line' | 'ref'>, data: EvilData = EVIL_DATA): string {
  if (p.line === null) return '';
  return deckPerson(p.ref, data)?.lineText ?? data.people.lines.find((l) => l.n === p.line)!.text;
}

/** Everyone still on the Roster. A person who left stays in the list (Part 30 section 3.3) but isn't "in". */
export const inRoster = (block: EvilModeBlock): Crew[] => block.crew.filter((c) => c.where === 'in');

// ---- Loyalty (Part 5 section 5) ----

/** A Loyalty figure's band: the face and the word. 0 has none (they're gone by morning). */
export function bandOf(loyalty: number, data: EvilData = EVIL_DATA): { name: string; face: string } {
  const b = data.founding.bands.find((x) => loyalty >= x.min) ?? data.founding.bands[data.founding.bands.length - 1]!;
  return { name: b.name, face: b.face };
}

/**
 * The team's Loyalty (Part 5 section 5.3, Part 30 section 4): the mean of everyone in, rounded down. Worked out each time
 * it's needed and never stored. With nobody in, the Creed's starting figure.
 */
export function teamLoyalty(block: EvilModeBlock, data: EvilData = EVIL_DATA): number {
  const ins = inRoster(block);
  if (!ins.length) return data.creeds.find((c) => c.id === block.team.creed)?.start.loyalty ?? 5;
  // Slice 9: a Grunt who's seen three Bosses keeps team Loyalty at 2 or more (Part 3 section 9.5), on the rule hook.
  const floor = data.region.on && block.team.patron ? modify(block, 'loyaltyFloor', {}, 0, data) : 0;
  // Slice 22: the Joint Command keeps Loyalty twice, red and blue, and the team's is the lower (Part 28 section 6.3).
  if (block.charter?.rule === 'two-colours') {
    const blue = new Set(block.charter.blue);
    const mean = (xs: Crew[]) => (xs.length ? Math.floor(xs.reduce((n, c) => n + c.loyalty, 0) / xs.length) : 10);
    return Math.max(floor, Math.min(mean(ins.filter((c) => !blue.has(c.id))), mean(ins.filter((c) => blue.has(c.id)))));
  }
  return Math.max(floor, Math.floor(ins.reduce((n, c) => n + c.loyalty, 0) / ins.length));
}

/** One cause moves one person's Loyalty by at most two (Part 5 section 5.2), between 0 and 10. */
export const moveLoyalty = (p: Crew, by: number, data: EvilData = EVIL_DATA): Crew => {
  const most = data.people.rules.loyalty.most;
  return { ...p, loyalty: Math.max(0, Math.min(10, p.loyalty + Math.max(-most, Math.min(most, by)))) };
};

// ---- Wages (Part 5 section 2.2) ----

/** A person's wage today. Officers and Executives take a share of the day's income instead. Belonging pays shares (dispatch). */
export function wageOf(block: EvilModeBlock, p: Crew, income: number, data: EvilData = EVIL_DATA): number {
  // Slice 9: a Patron with a pension in writing (Obadiah: ₽200 a day) draws exactly that.
  const pension = p.id === PATRON_ID && block.team.patron ? data.region.patrons.find((x) => x.id === block.team.patron)?.person?.wage : undefined;
  if (pension !== undefined) return pension;
  const r = rankDef(p.rank, data);
  if (r.share > 0) return Math.floor((Math.max(0, income) * r.share) / 100);
  return block.team.creed === 'cause' ? Math.floor(r.wage / 2) : r.wage;
}

// ---- Lines (Part 9 section 4, Part 7 section 11) ----

/** The tags a job carries for the lines to read (people.json `tags`). */
export function jobTags(block: EvilModeBlock, job: { holdingId: string; method: JobMethod }, data: EvilData = EVIL_DATA): string[] {
  const tags: string[] = [];
  if (block.here.day % 7 === 0) tags.push('sunday');
  const h = block.district?.holdings.find((x) => x.id === job.holdingId);
  if (job.method === 'outplay' && h?.kind === 'local') tags.push('fightLocal');
  // Slice 6: Lean, Take and Expose.
  tags.push(...darkTags(h, job.method, data));
  return tags;
}

/** A local's age, read off their name ("Mrs. Chiamaka Eze, 61"). */
const ageOf = (who: string): number | null => {
  const m = /, (\d+)(?:,|$)/.exec(who);
  return m ? Number(m[1]) : null;
};

/** The tags the three new methods carry for the lines to read (people.json `tags`, Part 9 section 4.1). */
export function darkTags(h: Holding | undefined, method: JobMethod, data: EvilData = EVIL_DATA): string[] {
  const l = h ? localOf(h, data) : undefined;
  const tags: string[] = [];
  if (method === 'lean') {
    tags.push('lean');
    if (l && ((ageOf(l.who) ?? 0) >= 60 || l.fear === 'Being alone')) tags.push('leanSmall');
    if (l && l.earns < 500) tags.push('leanPoor');
  }
  if (method === 'take') {
    tags.push('take');
    if (l && l.earns < 500) tags.push('takePoor');
  }
  if (method === 'expose') tags.push('exposePerson');
  return tags;
}


/** Everyone on the squad whose line this job crosses, and nobody else. */
export function crossers(block: EvilModeBlock, job: { holdingId: string; method: JobMethod; squad: readonly string[] }, data: EvilData = EVIL_DATA): Crew[] {
  const tags = jobTags(block, job, data);
  if (!tags.length) return [];
  return job.squad.map((id) => block.crew.find((c) => c.id === id)).filter((p): p is Crew => {
    if (!p || p.line === null) return false;
    const line = data.people.lines.find((l) => l.n === p.line)!;
    return line.tags.some((t) => tags.includes(t));
  });
}

/** Field 8 of the Card (Part 7 section 11): "Faye (\"won't frighten anyone smaller than me\")." or "Nobody." */
export function wontText(block: EvilModeBlock, job: { holdingId: string; method: JobMethod; squad: readonly string[] }, data: EvilData = EVIL_DATA): string {
  const who = crossers(block, job, data);
  if (!who.length) return peopleText('wontNone', data);
  const list = who.map((p) => `${p.name} ("${lineText(p, data).replace(/^Won't/, "won't").replace(/\.$/, '')}")`).join('. ');
  return peopleText('wontSome', data).replace('{list}', list);
}

/** "What this team, as it stands, won't do." (Part 7 section 11.3): every line on the Roster that's been heard, with whose it is. */
export function teamWont(block: EvilModeBlock, data: EvilData = EVIL_DATA): { line: string; who: string[] }[] {
  const by = new Map<string, string[]>();
  for (const p of inRoster(block)) {
    if (p.line === null || !p.lineHeard) continue;
    const t = data.people.lines.find((l) => l.n === p.line)!.text;
    by.set(t, [...(by.get(t) ?? []), p.name]);
  }
  return [...by.entries()].map(([line, who]) => ({ line, who }));
}

/** The talents nobody in has (Part 9 section 2.8), with what the Board says. Nameless Grunts have none. */
export function missingTalents(block: EvilModeBlock, data: EvilData = EVIL_DATA): string[] {
  const have = new Set(inRoster(block).map((p) => p.talent));
  return data.people.talents.filter((t) => !have.has(t.id)).map((t) => t.missing);
}

// ---- How they say the team's name (Part 9 section 1.1) ----

export function saysName(p: Pick<Crew, 'talent' | 'flaw'>, teamName: string, data: EvilData = EVIL_DATA): string {
  if (!p.talent) return `${teamName}.`;
  const s = talentDef(p.talent, data).says.replace(/\{name\}/g, teamName);
  return p.flaw ? flawDef(p.flaw, data).say.replace(/\{s\}/g, s) : s;
}

// ---- The `evil-people` stream (Part 30 section 5) ----

/** The n-th number `evil-people` gives out in this run, 1..max. The count is stored, so a reload draws the same. */
export const peopleRoll = (seed: string, n: number, max: number): number => new Rng(hashSeed(`${seed}::evil-people::${n}`)).int(1, max);

/** How likely a deck person is to turn up, by Creed (Part 10a section 1.1). Whole numbers; no number drawn. */
export function weightOf(p: DeckPerson, creed: string, data: EvilData = EVIL_DATA): number {
  const W = data.people.rules.weights;
  const c = data.people.rules.creeds[creed];
  const marks: string[] = [p.talent, ...(p.flaw ? [p.flaw] : []), ...(p.age < W.youngUnder ? ['young'] : []), ...(p.age > W.oldOver ? ['old'] : [])];
  let w = W.base + W.more * (c?.more.filter((m) => marks.includes(m)).length ?? 0);
  if (c?.less.some((m) => marks.includes(m))) w = Math.max(1, Math.floor(w / W.lessDivide));
  return w;
}

/**
 * The deck for a region (Part 10a section 1): the region's own twelve (by its id: Kanto, Johto, Hoenn so far), and the
 * Founders beside them only in the run's first region (`run` is the region-of-run, 0 for the first). Nobody twice a run.
 * Those who come only when (deck 'special') are never drawn: they arrive on their own (quest.ts `specialArrivals`).
 */
export function deckFor(region: number, drawn: readonly string[], data: EvilData = EVIL_DATA, run = 0): DeckPerson[] {
  const id = data.region.regions.find((r) => r.index === region)?.id ?? (region === 0 ? 'kanto' : '');
  const decks: string[] = [id, ...(run === 0 ? ['founders'] : [])];
  return data.people.people.filter((p) => decks.includes(p.deck) && !drawn.includes(p.id) && p.status !== 'disabled' && p.status !== 'invalid');
}

/** One weighted draw from a pool, using the stream's n-th number. */
export function drawOne(pool: readonly DeckPerson[], creed: string, seed: string, n: number, data: EvilData = EVIL_DATA): DeckPerson | null {
  if (!pool.length) return null;
  const weights = pool.map((p) => weightOf(p, creed, data));
  let r = peopleRoll(seed, n, weights.reduce((a, b) => a + b, 0));
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return pool[i]!;
  }
  return pool[pool.length - 1]!;
}

/** A deck person made a Roster card: a Grunt, at the Creed's starting Loyalty. The flaw's shown at hiring (Part 9 section 3); the line only if they said it. */
export function personFrom(d: DeckPerson, loyalty: number, known: { line?: boolean } = {}): Crew {
  return { id: d.id, ref: d.id, name: d.name, age: d.age, minor: !!d.minor, talent: d.talent, flaw: d.flaw, flawFound: true, line: d.line, lineHeard: !!known.line, rank: 'grunt', loyalty, where: 'in', outOn: null, jobs: 0, asked: 0, unpaid: 0, fitIn: null, mood: 'easy', knocks: 0 };
}

/**
 * The starting Roster (Part 10a section 2): the Creed's count, drawn from the Founders on `evil-people`, of at least two
 * different talents. Nobody under eighteen is put on it: a minor has to apply, and can be told no.
 */
export function foundingRoster(seed: string, creed: string, data: EvilData = EVIL_DATA): { crew: Crew[]; draws: number } {
  const c = data.creeds.find((x) => x.id === creed)!;
  const n = Math.min(c.start.roster, data.people.rules.rosterCap);
  let pool = data.people.people.filter((p) => p.deck === 'founders' && !p.minor);
  const out: DeckPerson[] = [];
  let draws = 0;
  while (out.length < n && pool.length) {
    let cand = pool;
    // The last seat goes to a second talent if everyone so far shares one.
    if (out.length === n - 1 && n > 1 && new Set(out.map((p) => p.talent)).size === 1) cand = pool.filter((p) => p.talent !== out[0]!.talent);
    const p = drawOne(cand, creed, seed, draws, data)!;
    draws += 1;
    out.push(p);
    pool = pool.filter((x) => x.id !== p.id);
  }
  return { crew: out.map((p) => personFrom(p, c.start.loyalty)), draws };
}

/** The district key a once-a-district rule is kept against. */
export const districtKey = (block: EvilModeBlock): string => `${block.here.region}:${block.district?.n ?? block.here.stage}`;
