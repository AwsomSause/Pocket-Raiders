// Wide format 7: the Debate (plan E4; Paldea Phase 7, the Assembly). An argument decided by what the player can prove.
// Three exchanges. In each the opponent makes one claim; the player answers with a piece of evidence they hold (a Key Item in
// the bag or a story flag earned earlier in the region). Each exchange lists the things that win it. Evidence is never used up.
// A plain statement is always allowed and never wins. Three wins: no battle. Two wins: the opponent objects for one line, no
// battle. Fewer: one battle against the opponent at Leader-fight strength, in front of the room. Losing it never ends the run
// (a story loss: the party is healed) and only changes the tone of the ending: result in `run.story.flags['star.x.debate']`
// = 'clean' | 'objection' | 'settled' (won the battle) | 'lost'. No RNG; the battle uses the `format-battle` stream.
// The card tells how many of the evidence pieces you hold, never which ones win. Only Paldea has content so far: other regions'
// debates are rows of `DEBATE_TABLE`.

import { itemCount } from '../items';
import { launchFormatBattle } from './battle';
import { markDone } from './store';
import type { FormatCard, FormatCtx, WideFormat } from './types';

/** One piece of evidence: a story flag set to anything truthy, or a Key Item in the bag. */
export interface Evidence {
  id: string;
  label: string;
  flag?: string;
  /** The flag must equal this value (default: any non-empty value). */
  flagValue?: string;
  item?: string;
}

export interface Exchange {
  claim: string;
  /** Evidence ids that win this exchange (the player can use any of them). */
  winning: string[];
}

export interface DebateScript {
  region: string;
  title: string;
  opponent: string;
  intro: string;
  objection: string;
  evidence: Evidence[];
  exchanges: Exchange[];
  /** Words for the opponent when it comes to a battle. */
  settle: string;
}

export const DEBATE_TABLE: DebateScript[] = [
  {
    region: 'paldea',
    title: 'The Assembly',
    opponent: 'Harrow',
    intro: 'The Academy auditorium. Every seat full. Harrow in the front row, with a lawyer. Clavell must rule on the expulsions, and you speak for Team Star.',
    objection: 'Harrow\'s lawyer objects. Clavell overrules him.',
    settle: 'Harrow demands the matter be settled "in the customary manner of this region".',
    evidence: [
      { id: 'deletion-log', label: 'The deletion log', flag: 'star.x.deletion-log' },
      { id: 'tully', label: 'Tully, standing in the back row', flag: 'star.x.tully-stood' },
      { id: 'boots', label: 'The wrong boots', flag: 'star.x.wrong-boots' },
      { id: 'drum', label: 'The unmarked drum', flag: 'star.x.navi-drum' },
      { id: 'engine', label: 'The First Engine, pink', flag: 'star.x.first-engine' },
      { id: 'brochure', label: 'Nascour\'s brochure', item: 'nascour-brochure' },
    ],
    exchanges: [
      { claim: '"There is no record of any bullying. I should know. I kept the records."', winning: ['deletion-log', 'tully'] },
      { claim: '"Team Star extorted and assaulted travellers across the region."', winning: ['boots', 'drum'] },
      { claim: '"Even so: they built a weapon."', winning: ['engine', 'brochure'] },
    ],
  },
];

export type DebateResult = 'clean' | 'objection' | 'settled' | 'lost';

export interface DebateState {
  region: string;
  /** Evidence ids the player holds, fixed when the debate starts. */
  held: string[];
  index: number;
  won: number;
  /** One line per exchange already argued. */
  log: string[];
  pending: boolean;
  result: DebateResult | null;
}

const scriptOf = (region: string): DebateScript | undefined => DEBATE_TABLE.find((d) => d.region === region);

const holds = (e: Evidence, { run }: FormatCtx): boolean => {
  if (e.flag) {
    const v = run.story.flags[e.flag];
    if (e.flagValue !== undefined ? v === e.flagValue : Boolean(v)) return true;
  }
  return e.item !== undefined && itemCount(run.inventory, e.item) > 0;
};

function regionOf(input?: unknown): string {
  return typeof input === 'object' && input && 'region' in input && typeof (input as { region: unknown }).region === 'string' ? (input as { region: string }).region : 'paldea';
}

function setup(ctx: FormatCtx, input?: unknown): DebateState {
  const region = regionOf(input);
  const script = scriptOf(region)!;
  return { region, held: script.evidence.filter((e) => holds(e, ctx)).map((e) => e.id), index: 0, won: 0, log: [], pending: false, result: null };
}

const finalCard = (script: DebateScript, s: DebateState): FormatCard => {
  const lines: string[] = [...s.log];
  if (s.result === 'clean') lines.push('Three wins. Clavell rules without a word from the lawyer.');
  else if (s.result === 'objection') lines.push(script.objection);
  else if (s.result === 'settled') lines.push(`${script.opponent} is beaten in front of the school. The room goes quiet, then rules in your favour.`);
  else if (s.result === 'lost') lines.push(`${script.opponent} carries the room. The ruling goes against you, and the story goes on without it.`);
  return { title: script.title, lines, options: [], over: true };
};

function describe(s: DebateState): FormatCard {
  const script = scriptOf(s.region)!;
  if (s.result) return finalCard(script, s);
  if (s.index >= script.exchanges.length) {
    return {
      title: script.title,
      lines: [...s.log, `${script.settle} You win ${s.won} of 3 exchanges. It comes to a battle.`],
      options: [{ id: 'battle', label: `Face ${script.opponent}`, enabled: !s.pending }],
      over: false,
    };
  }
  const ex = script.exchanges[s.index]!;
  const options = [
    ...script.evidence.filter((e) => s.held.includes(e.id)).map((e) => ({ id: `use:${e.id}`, label: `Put forward: ${e.label}`, enabled: true })),
    { id: 'plain', label: 'Answer plainly', enabled: true },
  ];
  return {
    title: script.title,
    lines: [
      ...(s.index === 0 ? [script.intro] : []),
      ...s.log,
      `Exchange ${s.index + 1} of 3. ${script.opponent}: ${ex.claim}`,
      `You hold ${s.held.length} of ${script.evidence.length} pieces of evidence. Evidence is never used up.`,
    ],
    options,
    over: false,
  };
}

function finish(s: DebateState, result: DebateResult, run: FormatCtx['run']): DebateState {
  run.story.flags['star.x.debate'] = result;
  markDone(run, 'debate');
  return { ...s, pending: false, result };
}

function choose(s: DebateState, id: string, ctx: FormatCtx): DebateState {
  const script = scriptOf(s.region)!;
  if (s.pending || s.result) return s;
  if (s.index >= script.exchanges.length) {
    if (id !== 'battle') return s;
    const ok = launchFormatBattle(ctx.content, ctx.run, 'debate', {
      key: 'settle',
      name: script.opponent,
      classId: 'veteran',
      size: 4,
      levelBonus: 2,
    });
    return ok ? { ...s, pending: true } : s;
  }
  const ex = script.exchanges[s.index]!;
  let win = false;
  let line = 'You answer plainly. It is not enough.';
  if (id.startsWith('use:')) {
    const eid = id.slice(4);
    const e = script.evidence.find((x) => x.id === eid);
    if (!e || !s.held.includes(eid)) return s;
    win = ex.winning.includes(eid);
    line = win ? `${e.label}: it settles this exchange.` : `${e.label}: it does not answer this claim.`;
  } else if (id !== 'plain') return s;
  const next: DebateState = { ...s, index: s.index + 1, won: s.won + (win ? 1 : 0), log: [...s.log, line] };
  if (next.index < script.exchanges.length) return next;
  if (next.won === 3) return finish(next, 'clean', ctx.run);
  if (next.won === 2) return finish(next, 'objection', ctx.run);
  return next;
}

function onBattleEnd(s: DebateState, won: boolean, { run }: FormatCtx): DebateState {
  if (!s.pending) return s;
  return finish(s, won ? 'settled' : 'lost', run);
}

export const debate: WideFormat<DebateState> = {
  id: 'debate',
  canStart: (_ctx, input) => scriptOf(regionOf(input)) !== undefined,
  setup,
  describe: (s) => describe(s),
  choose,
  onBattleEnd,
  isOver: (s) => s.result !== null,
};
