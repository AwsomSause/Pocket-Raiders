// Catalog Overhaul row A (legends): Legendary keys, Mythical keys and Communion upgrades.
// The old event tickets, wings and stones are earned, never bought: a Legendary key is the Trial (its questline passed, or its blessing at
// Influence 5), a Mythical key is the Visit condition (three Tellings heard). Form items (Reveal Glass, DNA Splicers, the Meteorite, the
// Odd Keystone) are Communion upgrades. Each key opens its place (an event with `keyItem`) on the next stage; the place itself requires
// `key-<item>` so a key found any other way opens nothing. Data: src/data/catalogOverhaul/legendKeys.json. Same run only; no new RNG roll
// (the stream below only feeds giveItem, which draws nothing for a key item).

import { z } from 'zod';
import raw from '../../data/catalogOverhaul/legendKeys.json';
import { EventConditionSchema, type Content } from '../contentSchema';
import { conditionMet, giveItem } from '../events';
import { hashSeed, Rng } from '../rng';
import type { BattleState, RunState } from '../state';
import { syncLegendFlags } from './signs';

const KeySchema = z.object({
  item: z.string().min(1),
  place: z.string().min(1),
  kind: z.enum(['trial', 'visit', 'communion']),
  once: z.enum(['run', 'region']).default('run'),
  earn: z.array(z.array(EventConditionSchema).min(1)).min(1),
});
export type LegendKey = z.infer<typeof KeySchema>;
export const LEGEND_KEYS: readonly LegendKey[] = z.object({ note: z.string(), keys: z.array(KeySchema).min(1) }).parse(raw).keys;

/** Run flag set when a key is earned (1 = this run; with `once: 'region'` the region number + 1). Its place requires it. */
export const keyFlag = (item: string): string => `key-${item}`;
/** Ghost-type foes knocked out this run (the Odd Keystone's spirits). */
export const SPIRITS_FLAG = 'odd-spirits';

const flags = (run: RunState) => run.story.flags;
/** A key is live only while its rebuilt place is in the game (it requires `key-<item>`); content without the row A file (old seeds) gets nothing. */
const live = (content: Content, k: LegendKey): boolean => {
  const place = content.events.get(k.place);
  return !!place && !place.disabled && place.requires.some((c) => c.kind === 'flag' && c.key === keyFlag(k.item));
};

/** Gives every key whose earn conditions hold now and that was not given yet (this run, or this region). Returns journal lines. */
export function syncLegendKeys(content: Content, run: RunState): string[] {
  syncLegendFlags(run);
  const lines: string[] = [];
  for (const k of LEGEND_KEYS) {
    if (!live(content, k)) continue;
    const mark = k.once === 'region' ? run.regionIndex + 1 : 1;
    const at = Number(flags(run)[`ev:${keyFlag(k.item)}`] ?? 0);
    if (k.once === 'region' ? at === mark : at > 0) continue;
    if (!k.earn.some((group) => group.every((c) => conditionMet(content, run, c)))) continue;
    flags(run)[`ev:${keyFlag(k.item)}`] = mark;
    const held = (run.inventory[k.item] ?? 0) > 0 || (run.passives?.[k.item] ?? 0) > 0;
    if (!held) giveItem(content, run, k.item, 1, new Rng(hashSeed(`${run.seed}::legend-key::${k.item}::${mark}`)));
    const name = content.catalog.get(k.item)?.name ?? k.item;
    lines.push(k.kind === 'visit' ? `${name}: you believe, and now you have a way there.` : k.kind === 'trial' ? `${name}: earned. It points to somewhere on the road ahead.` : `${name}: a Communion upgrade is waiting on the road ahead.`);
  }
  if (lines.length > 0) run.journal = [...(run.journal ?? []), ...lines];
  return lines;
}

/** After a battle won (or ended in a catch): each Ghost-type foe knocked out is one spirit for the Odd Keystone. */
export function noteSpirits(content: Content, run: RunState, battle: BattleState): void {
  if (battle.outcome !== 'win' && battle.outcome !== 'caught') return;
  const keystone = LEGEND_KEYS.find((k) => k.item === 'odd-keystone');
  if (!keystone || !live(content, keystone)) return;
  const ghosts = battle.enemyTeam.filter((m) => m.hp <= 0 && content.species.get(m.speciesId)?.types.includes('ghost')).length;
  if (ghosts > 0) flags(run)[`ev:${SPIRITS_FLAG}`] = Number(flags(run)[`ev:${SPIRITS_FLAG}`] ?? 0) + ghosts;
}
