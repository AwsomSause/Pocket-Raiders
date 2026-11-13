// Stand With Them (slice E8): the Inside Man route. Join a team at Ignition under a code name, climb a reputation ladder
// (access and information only, never statistics), and at the climax choose Rise, Take the Throne or Turn. Two shots:
// a lost Stand-with climax retries once, and the second loss gives the worst ending but never ends the run (decision A).
// Pure rules, no RNG, no Phaser.

import raw from '../../data/standWith.json';
import { z } from 'zod';
import type { Content } from '../contentSchema';
import type { Hold } from '../evil/rescue';
import { impoundFor } from '../raid/storyRaids';
import type { RunState } from '../state';
import { StandWithStateSchema, type StandWithState, type Verdict } from './standWithSchema';

const DataSchema = z.object({
  joinRep: z.number().int(), standWithRep: z.number().int(), throneRep: z.number().int(), officersMajorityRep: z.number().int(), mercyRunnerAt: z.number().int(), shots: z.number().int(),
  codeNames: z.array(z.object({ team: z.string(), region: z.string(), name: z.string(), alias: z.string(), givenBy: z.string(), meaning: z.string() })).min(1),
  ladder: z.array(z.object({ rep: z.number().int(), band: z.string(), rank: z.string(), hideout: z.string(), gives: z.array(z.string()).min(1) })).length(4),
  repChanges: z.record(z.string(), z.number().int()),
  verdicts: z.record(z.string(), z.object({ name: z.string(), text: z.string(), rank: z.string().optional() })),
});
export const STAND = DataSchema.parse(raw);

export const standWithOf = (run: Pick<RunState, 'expansion'>): StandWithState | null => run.expansion?.standWith ?? null;
export const codeNameFor = (teamId: string) => STAND.codeNames.find((c) => c.team === teamId);

/** The ladder rung a reputation has reached (null below the first). */
export function bandOf(rep: number) {
  let found: (typeof STAND.ladder)[number] | null = null;
  for (const b of STAND.ladder) if (rep >= b.rep) found = b;
  return found;
}

/** Why the player cannot join now, or null when they can: the run's own team must have a code name, and the player must not have joined. */
export function joinProblem(run: RunState): string | null {
  if (standWithOf(run)) return 'You already wear a team uniform.';
  const team = run.story.evil?.teamId;
  if (!team) return 'No team has noticed you yet.';
  if (!codeNameFor(team)) return 'This team has no use for an Inside Man.';
  return null;
}

/** Joins the run's team at Ignition: a code name, the uniform, reputation set to Recognized (+30). Returns the welcome line. */
export function joinInsideMan(run: RunState): string {
  const problem = joinProblem(run);
  if (problem) throw new Error(problem);
  const team = run.story.evil!.teamId!;
  const name = codeNameFor(team)!;
  run.expansion = { ...run.expansion, standWith: StandWithStateSchema.parse({ team, region: run.regionOrder[run.regionIndex] ?? name.region, rep: STAND.joinRep }) };
  return `${name.givenBy} names you ${name.name}, "${name.alias}". ${name.meaning}`;
}

/** The player's name on the route: used in every line spoken to them and in the Doom Ledger entry. */
export function codeNameOf(run: Pick<RunState, 'expansion'>): string | null {
  const s = standWithOf(run);
  const n = s && codeNameFor(s.team);
  return n ? `${n.name} "${n.alias}"` : null;
}

const clampRep = (n: number) => Math.max(-100, Math.min(100, n));

/**
 * Moves reputation by a named change from the table (`repChanges`) or a number. Refusing an order never drops you below the band you
 * already hold. Returns the new reputation, or null when you have not joined.
 */
export function changeRep(run: Pick<RunState, 'expansion'>, change: string | number): number | null {
  const s = standWithOf(run);
  if (!s) return null;
  const delta = typeof change === 'number' ? change : STAND.repChanges[change];
  if (delta === undefined) throw new Error(`Unknown reputation change "${change}"`);
  const floor = change === 'refuse-order' ? (bandOf(s.rep)?.rep ?? -100) : -100;
  s.rep = clampRep(Math.max(floor, s.rep + delta));
  return s.rep;
}

/** A small mercy was done. A noticed one costs 2 reputation and still counts. */
export function addMercy(run: Pick<RunState, 'expansion'>, noticed: boolean): void {
  const s = standWithOf(run);
  if (!s) return;
  s.mercies += 1;
  if (noticed) s.rep = clampRep(s.rep - 2);
}

/** Everything the player's rung gives (access and information), lowest rung first. */
export function accessOf(run: Pick<RunState, 'expansion'>): string[] {
  const s = standWithOf(run);
  return s ? STAND.ladder.filter((b) => s.rep >= b.rep).flatMap((b) => b.gives) : [];
}

/** What the hideout shows of the player's standing (readable without a menu), or null. */
export function standingLine(run: Pick<RunState, 'expansion'>): string | null {
  const s = standWithOf(run);
  const b = s && bandOf(s.rep);
  if (!s) return null;
  return `${codeNameOf(run)} · ${b ? `${b.band} (${s.rep >= 0 ? '+' : ''}${s.rep}), ${b.rank}. ${b.hideout}` : `Not yet trusted (${s.rep}).`}`;
}

export interface StandWithStatus { shown: boolean; open: boolean; reason: string | null }

/** The [Stand with them] button: hidden if you never joined, locked with the reason if you cannot, open otherwise. */
export function standWithStatus(run: Pick<RunState, 'expansion'>): StandWithStatus {
  const s = standWithOf(run);
  if (!s) return { shown: false, open: false, reason: null };
  if (s.betrayed) return { shown: true, open: false, reason: 'You betrayed this team; they are hunting you.' };
  if (s.turned) return { shown: true, open: false, reason: 'You used Turn earlier in this run. The team remembers.' };
  if (s.rep < STAND.standWithRep) return { shown: true, open: false, reason: `Needs reputation +${STAND.standWithRep} (Respected); you have ${s.rep}.` };
  return { shown: true, open: true, reason: null };
}

/** How the Apex ended the climax's Phase 6, from the player's side. */
export type ApexPhase = 'hold' | 'letgo' | 'broken' | 'none';

/** Which verdicts are open (the Apex clause, X9.1). Take the Throne also needs +70. */
export function verdictsOpen(run: Pick<RunState, 'expansion'>, apex: ApexPhase): Verdict[] {
  const s = standWithOf(run);
  if (!s) return [];
  const out: Verdict[] = [];
  if (apex !== 'letgo') out.push('rise');
  if (apex !== 'letgo' && s.rep >= STAND.throneRep) out.push('throne');
  out.push('turn');
  return out;
}

export interface VerdictInput {
  apex: ApexPhase;
  /** Take the Throne with the Apex still bound: keep it bound (`taken`) or free it. */
  keepApexBound?: boolean;
  /** Beat-you rival (Captured): release them or hand them to the team. Only Rise and Take the Throne offer it. */
  rival?: 'release' | 'handOver';
}
export interface VerdictResult { verdict: Verdict; lines: string[]; hold: Hold | null }

/**
 * Records the verdict. Rise and Take the Throne leave the Apex `taken` if it was held (Throne lets you free it), `freed` if broken; Turn
 * always frees it and can never be undone. A rival handed over is held by the team until the run ends, then freed (B1), and the team
 * impounds Pokémon from your bench so the Rival Rescue offer can start.
 */
export function resolveVerdict(content: Content, run: RunState, verdict: Verdict, input: VerdictInput): VerdictResult {
  const s = standWithOf(run);
  if (!s) throw new Error('You have not joined a team.');
  if (s.verdict) throw new Error('The verdict was already given.');
  if (!verdictsOpen(run, input.apex).includes(verdict)) throw new Error(`${STAND.verdicts[verdict]!.name} is not open.`);
  s.verdict = verdict;
  const lines = [STAND.verdicts[verdict]!.text];
  if (verdict === 'turn') s.turned = true;
  s.apex = input.apex === 'none' ? null : verdict === 'turn' || input.apex === 'broken' ? 'freed' : verdict === 'throne' ? (input.keepApexBound ? 'taken' : 'freed') : 'taken';
  if (s.apex) s.ledger.push(s.apex);
  s.ledger.push(`verdict:${verdict}`);
  let hold: Hold | null = null;
  if (input.rival && verdict !== 'turn') {
    if (input.rival === 'handOver') {
      s.rivalHandedOver = true;
      s.ledger.push('rival-handed-over');
      hold = impoundFor(content, run, s.team, 'rival-handed-over');
      lines.push(hold ? 'The team takes your rival, and some of your bench with them.' : 'The team takes your rival.');
    } else {
      s.ledger.push('rival-released');
      lines.push('You let your rival walk.');
    }
  }
  return { verdict, lines, hold };
}

/** Second Shot: the first lost Stand-with climax retries (the caller heals the party); the second gives the worst ending and the run goes on. */
export function lostStandWithClimax(run: Pick<RunState, 'expansion'>): 'retry' | 'worst' {
  const s = standWithOf(run);
  if (!s) throw new Error('You have not joined a team.');
  s.lost = Math.min(STAND.shots, s.lost + 1);
  if (s.lost < STAND.shots) return 'retry';
  s.ledger.push('allied-defeat');
  return 'worst';
}

/** At the run's end a handed-over rival is freed (B1); it is never held in the Region of Doom. Returns true when one was freed. */
export function freeHandedOverRival(run: Pick<RunState, 'expansion'>): boolean {
  const s = standWithOf(run);
  if (!s?.rivalHandedOver) return false;
  s.rivalHandedOver = false;
  s.ledger.push('rival-freed-at-run-end');
  return true;
}

/** Take the Throne: how many officers side with the player (of `officers`), and whether the runner steps forward first. */
export function officersSide(run: Pick<RunState, 'expansion'>, officers: number): { withPlayer: number; runnerFirst: boolean } {
  const s = standWithOf(run);
  if (!s) return { withPlayer: 0, runnerFirst: false };
  // At +85 or more the majority side with the player; below that they are the minority.
  const withPlayer = s.rep >= STAND.officersMajorityRep ? Math.floor(officers / 2) + 1 : Math.ceil(officers / 2) - 1;
  return { withPlayer: Math.max(0, withPlayer), runnerFirst: s.mercies >= STAND.mercyRunnerAt };
}
