// "What's in this run" (W12): one plain list of everything switched on for the current run.
// Pure: reads the run, changes nothing, uses no RNG.

import type { Content } from './contentSchema';
import type { RunState } from './state';
import { clockLabel, tideLabel } from './clock';
import { stageBounty } from './bounties';
import { getMutator } from './mutators';
import { getMode, getModifier, getDifficulty } from './rules';

export interface ContentRow {
  group: string;
  title: string;
  /** Short value shown on the right. */
  right: string;
  /** One-line explanation shown in the hint bar. */
  hint: string;
}

export function runContents(content: Content, run: RunState): ContentRow[] {
  const rows: ContentRow[] = [];
  const rules = run.rules;
  const mode = getMode(rules.modeId);
  const diff = getDifficulty(rules.difficultyId);
  rows.push({ group: 'Rules', title: 'Mode', right: mode?.name ?? rules.modeId, hint: mode?.blurb ?? '' });
  rows.push({ group: 'Rules', title: 'Difficulty', right: diff?.name ?? rules.difficultyId, hint: diff?.blurb ?? '' });
  for (const id of [...(mode?.bundles ?? []), ...rules.modifierIds]) {
    const m = getModifier(id);
    rows.push({ group: 'Rules', title: m?.name ?? id, right: 'Rule', hint: m?.blurb ?? '' });
  }
  if (rules.heat > 0) rows.push({ group: 'Rules', title: 'Heat', right: `Level ${rules.heat}`, hint: 'Harder enemies for a bigger reward.' });
  if (rules.deathBlock) rows.push({ group: 'Rules', title: 'Death-Block', right: rules.deathBlockUsed ? 'Used' : 'Ready', hint: 'Saves the run once from a wipe.' });
  rows.push({ group: 'Rules', title: 'Reward multiplier', right: `x${rules.rewardMultiplier.toFixed(2)}`, hint: rules.progressionEligible ? 'Scales what the run pays into your profile.' : 'Adventure pays no account rewards.' });
  if (rules.lockType) rows.push({ group: 'Rules', title: 'Type lock', right: rules.lockType, hint: 'Every Pokémon on your team must share this type.' });
  for (const id of run.mutators ?? []) {
    const m = getMutator(id);
    rows.push({ group: 'Picks', title: m?.name ?? id, right: m?.kind === 'curse' ? 'Curse' : 'Blessing', hint: m?.blurb ?? '' });
  }
  rows.push({ group: 'World', title: 'Time', right: clockLabel(run), hint: 'Shops, wild Pokémon and events change with the time of day.' });
  rows.push({ group: 'World', title: 'Tide', right: tideLabel(content, run), hint: 'The tide changes which water Pokémon appear and shop prices.' });
  const bounty = stageBounty(content, run);
  if (bounty) {
    const done = run.log.counters[`bounty.${bounty.key}`] ?? 0;
    rows.push({ group: 'World', title: 'Bounty', right: `${Math.min(done, bounty.target)}/${bounty.target} ${bounty.type}`, hint: `Defeat ${bounty.target} ${bounty.type}-type Pokémon on this stage for ₽${bounty.money}.` });
  }
  for (const edition of run.gameEvents) {
    const id = edition.split('@')[0] ?? edition;
    const ev = content.gameEvents.get(id);
    rows.push({ group: 'Events', title: ev?.name ?? id, right: edition.split('@')[1] ?? '', hint: ev?.description ?? 'A weekly or holiday event this run started under.' });
  }
  return rows;
}
