// Evil Mode founding to a first state (design Part 3, Part 30 section 2.1). Pure: no Phaser, no randomness.
// Slice 1 builds pages 1 to 5 (Boss, name, Creed, Line, Doctrine). The Look, Patron and region pages arrive later, so a
// team is cream and green, has no Patron, and starts in Kanto.

import { EVIL_DATA, type EvilData } from './data';
import { layDistrict } from './board';
import { bandOf, foundingRoster, teamLoyalty } from './people';
import { arriveApplicants } from './roster';
import { LINE_IDS, STREAMS, type EvilModeBlock, EvilModeBlockSchema, type LineId, type RunLength } from './schema';

export interface FoundingChoice {
  name: string;
  creed: string;
  line: LineId;
  doctrine: string;
}

export interface NameCheck {
  ok: boolean;
  /** The name as it will be stored (trimmed, single spaces). */
  name: string;
  /** Why it can't be used, in plain words; null when it can. */
  problem: string | null;
}

const LETTERS = /^[A-Za-z][A-Za-z' -]*$/;
const VOWEL = /[aeiouy]/i;

/** "Team ___": one to fourteen letters, not a team already in the game, and something a Grunt can say aloud. */
export function checkName(raw: string, data: EvilData = EVIL_DATA): NameCheck {
  const name = raw.trim().replace(/\s+/g, ' ');
  const max = data.founding.names.maxLength;
  const no = (problem: string): NameCheck => ({ ok: false, name, problem });
  if (!name) return no('Give the team a name.');
  if (name.length > max) return no(`Keep it to ${max} letters or fewer.`);
  if (!LETTERS.test(name)) return no('Letters only, please.');
  if (data.founding.names.taken.some((t) => t.toLowerCase() === name.toLowerCase())) return no(`Team ${name} already exists. Pick another.`);
  if (!VOWEL.test(name)) return no(`Nobody can say "Team ${name}" aloud. Try one with a vowel.`);
  return { ok: true, name, problem: null };
}

/** Where a Line sits on the slider: Clean hands 0, Grey 1, Whatever it takes 2. */
export const lineIndex = (line: LineId): number => LINE_IDS.indexOf(line);

/** The methods a Line allows (design Part 7 section 1; "lit" on the Line page). */
export function methodsLit(line: LineId, data: EvilData = EVIL_DATA): { id: string; name: string; word: string; lit: boolean }[] {
  return data.methods.map((m) => ({ id: m.id, name: m.name, word: m.word, lit: lineIndex(line) >= lineIndex(m.minLine) }));
}

/** Why a founding can't go ahead, or null. Every page must be filled with something that exists. */
export function foundingProblem(choice: FoundingChoice, data: EvilData = EVIL_DATA): string | null {
  const name = checkName(choice.name, data);
  if (!name.ok) return name.problem;
  const creed = data.creeds.find((c) => c.id === choice.creed);
  if (!creed || creed.status === 'disabled' || creed.status === 'invalid') return 'Choose a Creed.';
  if (!LINE_IDS.includes(choice.line)) return 'Choose a Line.';
  const doctrine = data.doctrines.find((d) => d.id === choice.doctrine);
  if (!doctrine || doctrine.status === 'disabled' || doctrine.status === 'invalid') return 'Choose a Doctrine.';
  return null;
}

/**
 * Founding to the first morning (design Part 3 section 11): Funds, Heat, Regard and Dread by Creed, then the Line's
 * changes (Whatever it takes: Heat +1; Clean hands: Regard +1). Day 1, Morning, Kanto District 1.
 */
export function foundTeam(choice: FoundingChoice, opts: { boss: string; length: RunLength; seed?: string }, data: EvilData = EVIL_DATA): { ok: true; block: EvilModeBlock } | { ok: false; problem: string } {
  const problem = foundingProblem(choice, data);
  if (problem) return { ok: false, problem };
  const creed = data.creeds.find((c) => c.id === choice.creed)!;
  const line = data.founding.lines.find((l) => l.id === choice.line)!;
  const cap = (n: number): number => Math.min(10, n);
  const regard = cap(creed.start.regard + line.regard);
  const dread = cap(creed.start.dread);
  // Slice 4: the starting Roster, drawn from the Founders on `evil-people` (design Part 10a section 2).
  const roster = foundingRoster(opts.seed ?? opts.boss, creed.id, data);
  const block: EvilModeBlock = {
    v: 6,
    from: 'founding',
    settings: { length: opts.length },
    team: {
      name: checkName(choice.name, data).name,
      sayable: true,
      boss: opts.boss,
      creed: creed.id,
      line: choice.line,
      lineMovedInRegion: [],
      doctrine: choice.doctrine,
      look: { ...data.founding.look },
      patron: null,
      funds: creed.start.funds,
      heat: cap(creed.start.heat + line.heat),
      regard,
      dread,
      corruption: 0,
    },
    here: { region: 0, stage: 1, day: 1, beat: 'morning' },
    draws: Object.fromEntries(STREAMS.map((s) => [s, 0])) as EvilModeBlock['draws'],
    applied: [],
    district: layDistrict(opts.seed ?? opts.boss, 0, 1, { regard, dread }, data),
    crew: roster.crew,
    queue: [],
    sheets: [],
    evening: [],
    log: [],
    cards: [],
    given: 0,
    taken: 0,
    rates: {},
    applicants: [],
    drawn: roster.crew.map((c) => c.id),
    refusal: null,
    hero: null,
    fight: null,
    posted: [],
    inPerson: null,
    proof: [],
    lineMove: null,
  };
  block.draws['evil-people'] = roster.draws;
  return { ok: true, block: EvilModeBlockSchema.parse(arriveApplicants(block, data)) };
}

/**
 * The team's Loyalty band (design Part 5 section 5.1). Loyalty is never stored for the team: it is worked out from the
 * Roster (people.ts `teamLoyalty`): the mean of everyone in, rounded down.
 */
export function loyaltyBand(block: EvilModeBlock, data: EvilData = EVIL_DATA): { name: string; face: string } {
  return bandOf(teamLoyalty(block, data), data);
}
