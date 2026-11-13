// Wide format 3: Convoy (plan E4; Kanto Phase 7 "The Long Drive"). A run of back-to-back trainer battles along a moving
// route, with no healing between legs: an escort van, Poacher-Captain Rudd, then the car. One fewer leg if Raid 4 was a
// Triumph ("Paper trail"). The last leg is LEDGER (a Porygon-Z on the bonnet) and the player answers it first:
// "You're a list." fights it (win = the ledger is yours); "You're a witness." skips the battle and LEDGER joins.
// Lose any leg and the Convoy fails: nothing is lost except the ledger, and the climax result stands (a lost fight is a
// story loss, so the party is healed and the run goes on). The result is written once to `run.expansion.cut.ledger`
// ('won' | 'joined' | 'none') for the Resolution to read. No RNG here; the battles use the `format-battle` stream.
// Not built: LEDGER itself joining the party as a Pokémon (the special-Pokémon plumbing belongs to the Kanto saga slices).

import { raidRecord } from '../raid/storyRaids';
import { launchFormatBattle } from './battle';
import { cutOf, markDone } from './store';
import type { FormatCard, FormatCtx, WideFormat } from './types';

export interface ConvoyLeg {
  id: string;
  name: string;
  /** Shown on the card before the fight. */
  scene: string;
  species: string[];
  types: string[];
  size: number;
  levelBonus: number;
  /** The trainer class the battle screen draws. */
  classId: string;
  /** The last leg asks a question first (the LEDGER choice). */
  ledger?: boolean;
}

export interface ConvoyState {
  legs: ConvoyLeg[];
  /** Index of the next leg to face. */
  index: number;
  /** A leg's battle is running. */
  pending: boolean;
  outcome: 'running' | 'won' | 'failed';
  ledger: 'none' | 'won' | 'joined';
}

/** Raid 4's result is written by the raid slice (`raidRecord`); a Triumph shortens the Convoy. */
export function raid4Triumph(run: FormatCtx['run']): boolean {
  return raidRecord(run, 4)?.result === 'triumph';
}

function setup({ content, run }: FormatCtx, input?: unknown): ConvoyState {
  const short = typeof input === 'object' && input && 'short' in input ? Boolean((input as { short: unknown }).short) : raid4Triumph(run);
  const has = (ids: string[]): string[] => ids.filter((id) => content.species.has(id));
  const legs: ConvoyLeg[] = [
    { id: 'van', name: 'Rocket Escort', scene: 'An escort van, roof lights off, pulls out ahead of the car.', species: has(['arbok', 'weezing', 'muk']), types: ['poison'], size: 3, levelBonus: 0, classId: 'biker' },
    { id: 'rudd', name: 'Poacher-Captain Rudd', scene: 'Rudd leans out of a second truck. "Nothing personal. Everything is on an invoice."', species: has(['rhyhorn', 'arbok', 'muk']), types: ['poison', 'ground'], size: 4, levelBonus: 1, classId: 'roughneck' },
    { id: 'car', name: 'LEDGER', scene: 'The car does not stop. On the bonnet sits LEDGER, a Porygon-Z. ENTRY 9,999. OWNER: NONE. STATUS: UNSOLD. QUERY: WHAT AM I?', species: has(['porygon-z']), types: ['normal'], size: 1, levelBonus: 3, classId: 'worker', ledger: true },
  ];
  return { legs: short ? legs.filter((l) => l.id !== 'rudd') : legs, index: 0, pending: false, outcome: 'running', ledger: 'none' };
}

const over = (s: ConvoyState): boolean => s.outcome !== 'running';

function finish(s: ConvoyState, run: FormatCtx['run']): ConvoyState {
  cutOf(run).ledger = s.ledger;
  markDone(run, 'convoy');
  return s;
}

function describe(s: ConvoyState): FormatCard {
  const leg = s.legs[s.index];
  const lines = [`The Long Drive: ${s.legs.length} legs, no resting between them. Leg ${Math.min(s.index + 1, s.legs.length)} of ${s.legs.length}.`];
  if (s.outcome === 'won') {
    lines.push(s.ledger === 'joined' ? 'LEDGER: "...RECLASSIFYING." The ledger is yours.' : 'You caught the car. The ledger is yours.');
    return { title: 'The Long Drive', lines, options: [], over: true };
  }
  if (s.outcome === 'failed') return { title: 'The Long Drive', lines: [...lines, 'The car got away with the ledger. The climax result stands.'], options: [], over: true };
  if (!leg) return { title: 'The Long Drive', lines, options: [], over: true };
  lines.push(leg.scene);
  const options = leg.ledger
    ? [{ id: 'list', label: '"You\'re a list." (fight)', enabled: true }, { id: 'witness', label: '"You\'re a witness." (no fight)', enabled: true }]
    : [{ id: 'fight', label: `Fight ${leg.name}`, enabled: true }];
  return { title: 'The Long Drive', lines, options, over: false };
}

function choose(s: ConvoyState, id: string, ctx: FormatCtx): ConvoyState {
  const leg = s.legs[s.index];
  if (over(s) || s.pending || !leg) return s;
  if (leg.ledger && id === 'witness') return finish({ ...s, index: s.index + 1, outcome: 'won', ledger: 'joined' }, ctx.run);
  if (id !== (leg.ledger ? 'list' : 'fight')) return s;
  const ok = launchFormatBattle(ctx.content, ctx.run, 'convoy', { key: leg.id, name: leg.name, classId: leg.classId, types: leg.types as never, species: leg.species, size: leg.size, levelBonus: leg.levelBonus });
  return ok ? { ...s, pending: true } : s;
}

function onBattleEnd(s: ConvoyState, won: boolean, { run }: FormatCtx): ConvoyState {
  if (!s.pending) return s;
  const base = { ...s, pending: false };
  if (!won) return finish({ ...base, outcome: 'failed' }, run);
  const index = s.index + 1;
  return index >= s.legs.length ? finish({ ...base, index, outcome: 'won', ledger: 'won' }, run) : { ...base, index };
}

export const convoy: WideFormat<ConvoyState> = {
  id: 'convoy',
  setup,
  describe: (s) => describe(s),
  choose,
  onBattleEnd,
  isOver: over,
};
