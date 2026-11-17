// Mythical Promises stage 2: Wonders the player uses on purpose. They show as rows in the map's Items menu ("wonder:<id>") and, when they
// need a pick, as a `wonderChoice` decision (the same option screen the Visit uses). Charges and picks live in `promise.track`, in-run only.

import type { Content } from '../contentSchema';
import type { PendingDecision, RunState } from '../state';
import { bumpTrack, guestId, STANCE_NAME, trackOf } from './promises';

export interface WonderAction { id: string; title: string; text: string; problem: string | null }
export type WonderDecision = Extract<PendingDecision, { kind: 'wonderChoice' }>;

const STANCES = ['atk', 'def', 'spe', 'norm'] as const;
const STANCE_TEXT: Record<string, string> = { atk: '+15% damage dealt', def: '-15% damage taken', spe: 'acts first on turn one', norm: '+5% to everything' };

/** The Items-menu rows for the Guest's Wonder, if it has an action. */
export function wonderActions(_content: Content, run: RunState): WonderAction[] {
  const id = guestId(run);
  if (!id || !run.expansion?.promises) return [];
  const out: WonderAction[] = [];
  if (id === 'deoxys') {
    const ready = trackOf(run, 'restsUsed') > trackOf(run, 'stancesTaken');
    const now = ['none', 'Attack', 'Defense', 'Speed', 'Normal'][trackOf(run, 'stance')] ?? 'none';
    out.push({ id: 'stance', title: 'Deoxys: take a stance', text: `Pick a Forme for the party (now: ${now}). Once a rest.`, problem: ready ? null : 'Deoxys changes stance only after a rest.' });
  }
  return out;
}

/** Starts a Wonder from its row. Returns a decision to show, or null when it already happened (the message says what). */
export function startWonder(_content: Content, run: RunState, wonderId: string): { decision: WonderDecision | null; message: string } {
  const guest = guestId(run);
  if (wonderId === 'stance' && guest === 'deoxys') {
    return {
      decision: { kind: 'wonderChoice', mythicalId: 'deoxys', wonderId, title: 'Deoxys: choose the party\'s stance', options: STANCES.map((s) => ({ label: STANCE_NAME[s]!, description: STANCE_TEXT[s]!, value: s })) },
      message: '',
    };
  }
  throw new Error('That Wonder is not available');
}

/** Applies the pick. Never throws on a stale choice. */
export function resolveWonder(_content: Content, run: RunState, decision: WonderDecision, optionIndex: number): string {
  const pick = decision.options[optionIndex] ?? decision.options[0]!;
  if (decision.wonderId === 'stance' && guestId(run) === 'deoxys') {
    bumpTrack(run, 'stance', STANCES.indexOf(pick.value as (typeof STANCES)[number]) + 1);
    bumpTrack(run, 'stancesTaken', trackOf(run, 'restsUsed'));
    return `Deoxys takes the ${pick.label} stance: ${pick.description}.`;
  }
  return '';
}
