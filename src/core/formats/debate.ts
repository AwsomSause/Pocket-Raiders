// Wide format 7: the Debate (plan E4; Paldea Phase 7, the Assembly). A real argument, in rounds, decided by what you say and what
// you can prove. Three exchanges. In each the opponent makes a claim; you choose an ARGUMENT; the opponent REBUTS with one of three
// tactics (denial, smear, appeal to authority); you choose a REBUTTAL that answers that tactic. An argument is worth: a piece
// of evidence you hold (a Key Item or story flag earned earlier) 3, the apt reasoned argument 1, a weak one 0, bluster -1. The
// right rebuttal for the opponent's tactic adds 2, a wrong one nothing. An exchange is won at 3 or more: evidence carries it
// alone; reasoning wins it only if you also answer the rebuttal. Evidence is never used up, and you can always argue without it.
// Three wins: no battle. Two wins: the opponent objects for one line, no battle. Fewer: one battle against the opponent at
// Leader-fight strength, in front of the room. Losing it never ends the run (a story loss: the party is healed): result in
// `run.story.flags['star.x.debate']` = 'clean' | 'objection' | 'settled' | 'lost'. No RNG; the battle uses `format-battle`.
// The card tells how many evidence pieces you hold, never which win. Only Paldea has content so far (`DEBATE_TABLE`).

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
  /** An event story flag (`ev:<key>`) that also counts: the Paldea story events set these. */
  ev?: string;
  item?: string;
}

export type Tactic = 'denial' | 'smear' | 'authority';

/** The three answers to a rebuttal; the one whose `answers` is the opponent's tactic is right. */
export const COUNTERS: { id: Tactic; label: string }[] = [
  { id: 'denial', label: 'Name the date, the place and the witness.' },
  { id: 'smear', label: 'Leave me out of it. Ask what he is afraid of.' },
  { id: 'authority', label: 'Ask which ruling, and who signed it.' },
];

export const POINTS = { evidence: 3, apt: 1, weak: 0, bluster: -1, counter: 2, win: 3 } as const;

export interface Argument {
  id: 'apt' | 'weak' | 'bluster';
  label: string;
  /** How the opponent rebuts it. */
  tactic: Tactic;
  reply: string;
}

export interface Exchange {
  claim: string;
  /** Evidence ids that win this exchange (the player can use any of them). */
  winning: string[];
  /** How the opponent rebuts a piece of evidence (it still wins; this is only the scene). */
  evidenceTactic: Tactic;
  evidenceReply: string;
  arguments: Argument[];
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
      { id: 'deletion-log', label: 'The deletion log', flag: 'star.x.deletion-log', ev: 'star-reports-seen' },
      { id: 'tully', label: 'Tully, standing in the back row', flag: 'star.x.tully-stood', ev: 'star-tully-cracking' },
      { id: 'boots', label: 'The wrong boots', flag: 'star.x.wrong-boots', ev: 'star-oldhallway-beaten' },
      { id: 'drum', label: 'The unmarked drum', flag: 'star.x.navi-drum' },
      { id: 'engine', label: 'The First Engine, pink', flag: 'star.x.first-engine', ev: 'star-first-engine' },
      { id: 'brochure', label: 'Nascour\'s brochure', item: 'nascour-brochure', ev: 'star-brochure' },
    ],
    exchanges: [
      {
        claim: '"There is no record of any bullying. I should know. I kept the records."',
        winning: ['deletion-log', 'tully'],
        evidenceTactic: 'denial',
        evidenceReply: '"That is a forgery. Those entries were never mine."',
        arguments: [
          { id: 'apt', label: 'Ask the room who keeps a record that has nothing in it.', tactic: 'denial', reply: '"An empty record means an empty problem. I stand by my records."' },
          { id: 'weak', label: 'Say the students were treated badly.', tactic: 'smear', reply: '"Students. Delinquents, with a vehicle licence they printed themselves."' },
          { id: 'bluster', label: 'Shout that he is lying.', tactic: 'authority', reply: '"The chair will note that outburst. The Academy has ruled on conduct before."' },
        ],
      },
      {
        claim: '"Team Star extorted and assaulted travellers across the region."',
        winning: ['boots', 'drum'],
        evidenceTactic: 'smear',
        evidenceReply: '"Props, from people who dress up for a living."',
        arguments: [
          { id: 'apt', label: 'Ask how many travellers filed a report, and with whom.', tactic: 'authority', reply: '"The League\'s own bulletin lists the incidents. It has been circulated."' },
          { id: 'weak', label: 'Say they would never hurt anyone.', tactic: 'denial', reply: '"Would never. I have a drawer of statements that say otherwise."' },
          { id: 'bluster', label: 'Say the travellers deserved it.', tactic: 'smear', reply: '"There. In the student\'s own words."' },
        ],
      },
      {
        claim: '"Even so: they built a weapon."',
        winning: ['engine', 'brochure'],
        evidenceTactic: 'authority',
        evidenceReply: '"The Academy bylaws forbid unlicensed vehicles, whatever they are."',
        arguments: [
          { id: 'apt', label: 'Ask who ordered the parts, and who paid for them.', tactic: 'denial', reply: '"A procurement matter. Entirely routine. Nobody ordered a weapon."' },
          { id: 'weak', label: 'Say it was only a car.', tactic: 'authority', reply: '"Then it breaks regulation 14, and the Academy has ruled on regulation 14."' },
          { id: 'bluster', label: 'Say you would build it again.', tactic: 'smear', reply: '"I think the room has heard enough from this particular student."' },
        ],
      },
    ],
  },
];

export type DebateResult = 'clean' | 'objection' | 'settled' | 'lost';

export interface DebateState {
  region: string;
  /** Evidence ids the player holds, fixed when the debate starts. */
  held: string[];
  index: number;
  /** 'argue': pick an argument. 'rebut': the opponent has answered; pick a rebuttal. */
  stage: 'argue' | 'rebut';
  /** Points banked in this exchange so far, and the tactic the opponent is using. */
  points: number;
  tactic: Tactic | null;
  won: number;
  /** The lines of the exchange in play, and one line for each exchange already settled. */
  log: string[];
  recap: string[];
  pending: boolean;
  result: DebateResult | null;
}

const scriptOf = (region: string): DebateScript | undefined => DEBATE_TABLE.find((d) => d.region === region);

const holds = (e: Evidence, { run }: FormatCtx): boolean => {
  if (e.flag) {
    const v = run.story.flags[e.flag];
    if (e.flagValue !== undefined ? v === e.flagValue : Boolean(v)) return true;
  }
  if (e.ev !== undefined && Number(run.story.flags[`ev:${e.ev}`] ?? 0) >= 1) return true;
  return e.item !== undefined && itemCount(run.inventory, e.item) > 0;
};

function regionOf(input?: unknown): string {
  return typeof input === 'object' && input && 'region' in input && typeof (input as { region: unknown }).region === 'string' ? (input as { region: string }).region : 'paldea';
}

function setup(ctx: FormatCtx, input?: unknown): DebateState {
  const region = regionOf(input);
  const script = scriptOf(region)!;
  return { region, held: script.evidence.filter((e) => holds(e, ctx)).map((e) => e.id), index: 0, stage: 'argue', points: 0, tactic: null, won: 0, log: [], recap: [], pending: false, result: null };
}

const finalCard = (script: DebateScript, s: DebateState): FormatCard => {
  const lines: string[] = [...s.recap];
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
      lines: [...s.recap, `${script.settle} You win ${s.won} of 3 exchanges. It comes to a battle.`],
      options: [{ id: 'battle', label: `Face ${script.opponent}`, enabled: !s.pending }],
      over: false,
    };
  }
  const ex = script.exchanges[s.index]!;
  const head = [...(s.index === 0 && s.stage === 'argue' ? [script.intro] : []), ...s.recap, ...s.log];
  if (s.stage === 'rebut') {
    return {
      title: script.title,
      lines: [...head, 'Your answer to the rebuttal?'],
      options: COUNTERS.map((c) => ({ id: `reb:${c.id}`, label: c.label, enabled: true })),
      over: false,
    };
  }
  const options = [
    ...script.evidence.filter((e) => s.held.includes(e.id)).map((e) => ({ id: `arg:${e.id}`, label: `Put forward: ${e.label}`, enabled: true })),
    ...ex.arguments.map((a) => ({ id: `arg:${a.id}`, label: a.label, enabled: true })),
  ];
  return {
    title: script.title,
    lines: [
      ...head,
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

/** An argument has been chosen: bank its points and let the opponent rebut. */
function argue(s: DebateState, id: string, script: DebateScript): DebateState {
  const ex = script.exchanges[s.index]!;
  const eid = id.slice(4);
  const ev = script.evidence.find((x) => x.id === eid);
  if (ev) {
    if (!s.held.includes(eid)) return s;
    const wins = ex.winning.includes(eid);
    return {
      ...s,
      stage: 'rebut',
      points: wins ? POINTS.evidence : 0,
      tactic: ex.evidenceTactic,
      log: [...s.log, `You put forward ${ev.label}. ${wins ? 'It bears directly on the claim.' : 'It has nothing to do with this claim.'}`, `${script.opponent}: ${ex.evidenceReply}`],
    };
  }
  const arg = ex.arguments.find((a) => a.id === eid);
  if (!arg) return s;
  return {
    ...s,
    stage: 'rebut',
    points: POINTS[arg.id],
    tactic: arg.tactic,
    log: [...s.log, `You: ${arg.label}`, `${script.opponent}: ${arg.reply}`],
  };
}

/** A rebuttal has been chosen: settle the exchange and move on. */
function rebut(s: DebateState, id: string, ctx: FormatCtx, script: DebateScript): DebateState {
  const counter = COUNTERS.find((c) => c.id === id.slice(4));
  if (!counter || !s.tactic) return s;
  const right = counter.id === s.tactic;
  const total = s.points + (right ? POINTS.counter : 0);
  const win = total >= POINTS.win;
  const line = `Exchange ${s.index + 1}: ${win ? 'won' : 'lost'}${right ? '' : ' (your answer missed his tactic)'}.`;
  const next: DebateState = { ...s, index: s.index + 1, stage: 'argue', points: 0, tactic: null, won: s.won + (win ? 1 : 0), log: [], recap: [...s.recap, line] };
  if (next.index < script.exchanges.length) return next;
  if (next.won === 3) return finish(next, 'clean', ctx.run);
  if (next.won === 2) return finish(next, 'objection', ctx.run);
  return next;
}

function choose(s: DebateState, id: string, ctx: FormatCtx): DebateState {
  const script = scriptOf(s.region)!;
  if (s.pending || s.result) return s;
  if (s.index >= script.exchanges.length) {
    if (id !== 'battle') return s;
    const ok = launchFormatBattle(ctx.content, ctx.run, 'debate', { key: 'settle', name: script.opponent, classId: 'veteran', size: 4, levelBonus: 2 });
    return ok ? { ...s, pending: true } : s;
  }
  if (s.stage === 'argue' && id.startsWith('arg:')) return argue(s, id, script);
  if (s.stage === 'rebut' && id.startsWith('reb:')) return rebut(s, id, ctx, script);
  return s;
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
