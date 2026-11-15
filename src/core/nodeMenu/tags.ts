// Beta 0.7 Node Event Menus P1: a menu category for every event and every side stop.
// Rules first (an event's stop, group, W5 tags and what its choices do), then hand-set overrides from
// src/data/nodeMenu.json `tagOverrides`. Pure: the same event always gets the same category.

import type { EventDef, EventOutcome } from '../contentSchema';
import { tagsOf } from '../events/priority';
import type { SideStop } from '../state';
import { nodeMenuData } from './data';
import type { MenuCategory } from './state';

const STOP_CATEGORY: Record<string, MenuCategory> = {
  merchant: 'shop', shop: 'shop', casino: 'shop', trade: 'shop',
  heal: 'recovery', rest: 'recovery', camp: 'recovery', well: 'recovery', daycare: 'recovery', berry: 'recovery',
  treasure: 'treasure', fossil: 'treasure',
  dojo: 'training', tutor: 'training', library: 'training', lab: 'training',
  contest: 'challenge', tower: 'challenge',
  ambush: 'battle', wild: 'battle', swarm: 'battle', special: 'battle', rare: 'battle', roamer: 'battle', hideout: 'battle',
  shrine: 'story', haunted: 'story', mirage: 'explore', landmark: 'explore', detour: 'explore', scout: 'explore', fish: 'explore',
};

const GROUP_CATEGORY: Record<string, MenuCategory> = {
  'Training and growth': 'training', Mentors: 'training', 'Form Research': 'training', 'Delta Research': 'training',
  'Helpers, gifts and kindness': 'social', 'Famous faces': 'social', 'Rival Interactions': 'social', 'Living Rival': 'social', Allies: 'social', 'Blissful Pokémon': 'social',
  'Games of chance': 'treasure', 'Key items and tickets': 'treasure', 'Story items': 'treasure', Relics: 'treasure',
  'Merchants and deals': 'shop', 'Rest spots': 'recovery', Camp: 'recovery', 'Campfire Tales': 'recovery',
  Puzzles: 'challenge', 'Z-Trials': 'challenge', 'Z-Form Trial': 'challenge', 'Tower of Legends': 'challenge', 'Mystery Dungeon': 'challenge',
};

const TAG_CATEGORY: [string, MenuCategory][] = [
  ['Shop', 'shop'], ['Recovery', 'recovery'], ['Treasure', 'treasure'], ['Relationship', 'social'], ['Rival', 'social'],
  ['Exploration', 'explore'], ['Dungeon', 'challenge'], ['Story', 'story'], ['Mystery', 'story'],
];

const LOOT = new Set(['item', 'itemFrom', 'money', 'relic', 'egg', 'legacyEgg']);
const HEAL = new Set(['heal', 'cure', 'rest', 'campBond', 'convoyHeal']);
const TRAIN = new Set(['levels', 'eggMove', 'research', 'mentor', 'attribute']);
const SOCIAL = new Set(['friendship', 'join', 'recruit', 'rivalMet', 'aid']);

/** True when choosing this event can start a battle (any choice, success or failure). */
export function eventHasBattle(e: Pick<EventDef, 'choices'>): boolean {
  return e.choices.some((c) => !!(c.success as EventOutcome).battle || !!(c.failure as EventOutcome | undefined)?.battle);
}

/** Share of choices whose main outcome is a battle. */
function battleShare(e: Pick<EventDef, 'choices'>): number {
  return e.choices.filter((c) => !!(c.success as EventOutcome).battle).length / e.choices.length;
}

function effectVotes(e: Pick<EventDef, 'choices'>): Partial<Record<MenuCategory, number>> {
  const votes: Partial<Record<MenuCategory, number>> = {};
  const vote = (c: MenuCategory) => (votes[c] = (votes[c] ?? 0) + 1);
  for (const c of e.choices) {
    for (const fx of (c.success as EventOutcome).effects ?? []) {
      if (LOOT.has(fx.kind)) vote('treasure');
      else if (HEAL.has(fx.kind)) vote('recovery');
      else if (TRAIN.has(fx.kind)) vote('training');
      else if (SOCIAL.has(fx.kind)) vote('social');
    }
  }
  return votes;
}

/** P1: the menu category of an event. */
export function eventCategory(e: Pick<EventDef, 'id' | 'stop' | 'group' | 'tags' | 'choices'>): MenuCategory {
  const override = nodeMenuData().tagOverrides[e.id];
  if (override) return override;
  if (battleShare(e) >= 0.5) return 'battle';
  const byStop = e.stop && e.stop !== 'event' ? STOP_CATEGORY[e.stop] : undefined;
  if (byStop) return byStop;
  const byGroup = GROUP_CATEGORY[e.group];
  if (byGroup) return byGroup;
  const tags = tagsOf(e);
  if (tags.includes('Combat') && battleShare(e) > 0) return 'battle';
  for (const [tag, cat] of TAG_CATEGORY) if ((tags as string[]).includes(tag)) return cat;
  const votes = Object.entries(effectVotes(e)).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (votes.length > 0) return votes[0]![0] as MenuCategory;
  return battleShare(e) > 0 ? 'battle' : 'story';
}

/** The category of a side stop (event stops use their event's category). */
export function sideCategory(side: SideStop, event: Pick<EventDef, 'id' | 'stop' | 'group' | 'tags' | 'choices'> | undefined): MenuCategory {
  switch (side.kind) {
    case 'heal': return 'recovery';
    case 'shop': case 'plaza': return 'shop';
    case 'fish': return 'explore';
    case 'raid': case 'totem': return 'battle';
    case 'expedition': return 'explore';
    case 'minigame': return 'challenge';
    case 'service': return 'social';
    case 'event': return event ? eventCategory(event) : 'story';
  }
}
