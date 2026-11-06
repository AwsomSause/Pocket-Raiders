import type { Content } from './contentSchema';
import { hasPerk } from './mapItems';
import { mapChoices, startEncounter } from './run';
import type { RunState } from './state';

// Omens (S380): with the Augur's Bell, each stop you can walk to shows a sign of how hard its fight is.
// The fight is planned on a copy of the run (like the Devon Scope), so looking never uses a gameplay roll.

export type OmenTier = 'calm' | 'uneasy' | 'dire';
export interface Omen {
  tier: OmenTier;
  text: string;
}

const TEXT: Record<OmenTier, string> = {
  calm: 'Calm omen: the signs are good, this fight should be easy.',
  uneasy: 'Uneasy omen: an even fight. Bring your best.',
  dire: 'Dire omen: the signs are bad, this fight is much stronger than you.',
};

/** How strong a fight looks against the team: foe level (plus a little per extra foe) minus the level of your best fighters. */
export function omenGap(content: Content, foes: readonly { level: number }[], party: RunState['party']): number {
  const o = content.balance.omen;
  const ready = party.filter((m) => m.hp > 0).sort((a, b) => b.level - a.level).slice(0, o.partySample);
  if (ready.length === 0 || foes.length === 0) return 0;
  const mine = ready.reduce((s, m) => s + m.level, 0) / ready.length;
  const theirs = foes.reduce((s, m) => s + m.level, 0) / foes.length + o.perExtraFoe * (foes.length - 1);
  return theirs - mine;
}

export function omenTier(content: Content, gap: number): OmenTier {
  const o = content.balance.omen;
  return gap <= o.calmAtMost ? 'calm' : gap >= o.direAtLeast ? 'dire' : 'uneasy';
}

/** The omens for the stops the player can walk to now (empty without the Augur's Bell). */
export function mapOmens(content: Content, run: RunState): Record<string, Omen> {
  if (!run.stage || run.phase !== 'map' || !hasPerk(content, run, 'omen')) return {};
  const out: Record<string, Omen> = {};
  for (const node of mapChoices(content, run)) {
    if (!['wild', 'trainer', 'gym', 'elite', 'champion'].includes(node.kind)) continue;
    const copy = structuredClone(run);
    if (!copy.party.some((p) => p.hp > 0)) break;
    startEncounter(content, copy, node);
    const foes = copy.battle?.enemyTeam;
    if (!foes?.length) continue;
    const tier = omenTier(content, omenGap(content, foes, copy.party));
    out[node.id] = { tier, text: TEXT[tier] };
  }
  return out;
}
