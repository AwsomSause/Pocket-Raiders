// Art for an event's map stop, so the badge shows a picture instead of the plain "!" glyph.
// Picks, in order: the scene's Pokémon, the first cast member, a Pokémon the event gives, an item it gives,
// then a picture for its group. Presentation only: never touches gameplay state or RNG.
import type { Content } from '../core/contentSchema';
import type { EventDef } from '../core/contentSchema';

import { eventBackdrop } from '../core/presentation/eventStyles';

export type StopArt = { kind: 'pokemon'; species: string } | { kind: 'trainer'; assetId: string } | { kind: 'item'; assetId: string } | { kind: 'scene'; assetId: string };

/** Words in an event's id or name that call for a trainer picture (first match wins). */
const TRAINER_WORDS: [RegExp, string][] = [
  [/fisher|angler|boat/, 'trainer.fisherman'],
  [/hiker|hike|mountain guide/, 'trainer.hiker'],
  [/bug|insect|net/, 'trainer.bug_catcher'],
  [/biker|bike|racer|race/, 'trainer.biker'],
  [/guitar|band|singer|song|music|concert|busker|bard/, 'trainer.guitarist'],
  [/aroma|perfume|herb|garden|florist|flower/, 'trainer.aroma_lady'],
  [/psychic|fortune|seer|oracle|medium|tarot|dream/, 'trainer.psychic_m'],
  [/ghost|haunt|hex|curse|spook|witch/, 'trainer.hex_maniac'],
  [/dragon|tamer/, 'trainer.dragon_tamer'],
  [/fire|flame|torch|ember|campfire/, 'trainer.firebreather'],
  [/bird|falcon|feather|kite/, 'trainer.bird_keeper_m'],
  [/belt|martial|dojo|spar|train|monk|karate/, 'trainer.black_belt_m'],
  [/worker|builder|bridge|mine|miner|dig|repair|mechanic|tinker|engineer/, 'trainer.worker_m'],
  [/snow|ski|sled|frost|winter/, 'trainer.snow_worker_m'],
  [/fairy|tale|story|princess|dress|ribbon/, 'trainer.fairy_tale_girl'],
  [/thug|bully|gang|roughneck|punk|rival rough/, 'trainer.roughneck'],
  [/kid|child|boy|girl|youngster|lost|picnic|puddle|hopscotch|card/, 'trainer.youngster_m'],
];

/** Words that call for an item picture (first match wins). Ids are item asset ids. */
const ITEM_WORDS: [RegExp, string][] = [
  [/egg|nest|hatch/, 'item.mystery_egg'],
  [/coin|fountain|wager|bet|gambl|jackpot|slot|lotter/, 'item.coin_case'],
  [/shop|market|merchant|stall|sale|seller|swap|barter|trade|deal|bazaar|vend/, 'item.amulet_coin'],
  [/ticket|pass|invite|festival/, 'item.golden_mystic_ticket'],
  [/map|trail|path|road|route|sign|guide|compass|bridge|travel|journey|detour|shortcut/, 'item.map'],
  [/stone|gem|crystal|jewel|ore|mineral|glint|shard/, 'item.library/crystalshard'],
  [/fossil|ruin|ancient|relic|temple|tomb|shrine|artifact/, 'item.library/enigmafossil'],
  [/berry|bush|fruit|orchard|apple|harvest|tree|forage/, 'item.gen5/oran-berry'],
  [/food|cook|picnic|feast|meal|snack|bake|soup|tea|curry|cafe|kitchen/, 'item.library/maxsoup'],
  [/heal|nurse|rest|sleep|nap|bed|camp|spa|spring|hot/, 'item.potion'],
  [/medicine|medic|clinic|doctor|vitamin|tonic|elixir/, 'item.super_potion'],
  [/candy|sweet|treat|gift|present|surprise/, 'item.rare_candy'],
  [/lure|scent|bait|fish/, 'item.library/scentedlure'],
  [/key|lock|door|gate|vault|safe|chest|box|treasure|loot|cache|hoard|heist|steal|theft|thief/, 'item.library/hotelkey'],
  [/battle|fight|duel|challenge|tournament|arena|dojo|gym|boss|rematch/, 'item.focus_sash'],
  [/feather|wing|sky|fly|wind|breeze|storm/, 'item.gen5/pretty-wing'],
  [/charm|luck|fortune|wish|blessing|omen|star/, 'item.shiny_charm'],
  [/book|diary|journal|note|letter|lore|tale|story|library|scroll|sign/, 'item.library/researchnotes'],
  [/rain|weather|umbrella|cloud|fog|mist|snow|ice|hail|sun/, 'item.library/utilityumbrella'],
  [/machine|device|phone|radio|signal|gadget|tech|robot|lab|research|experiment/, 'item.scanner'],
  [/mask|disguise|shadow|dark|night|mystery|secret|strange|odd|weird|unknown|haunt/, 'item.library/mystemblem'],
  [/dance|party|celebrat|parade|fair|carnival|contest|show|performance/, 'item.library/contestcharm'],
  [/rival|compet|versus/, 'item.library/rogue-ribbon'],
  [/team|evil|villain|grunt|admin|boss|plot|scheme/, 'item.leaders_crest'],
  [/time|clock|memory|past|future/, 'item.library/timeflute'],
];

/** A fitting item picture per event group, for events that name no cast, Pokémon or item. */
const GROUP_ITEM: Record<string, string> = {
  Camp: 'item.potion',
  'Merchants and deals': 'item.amulet_coin',
};

function walk(node: unknown, found: { species?: string; item?: string }): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const n of node) walk(n, found);
    return;
  }
  const o = node as Record<string, unknown>;
  const kind = o.kind;
  if ((kind === 'join' || kind === 'egg') && Array.isArray(o.species) && typeof o.species[0] === 'string') found.species ??= o.species[0];
  if (kind === 'item' && typeof o.id === 'string') found.item ??= o.id;
  if (kind === 'itemFrom' && Array.isArray(o.ids) && typeof o.ids[0] === 'string') found.item ??= o.ids[0];
  for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v, found);
}

/** True if one of the words starts a word in the text (so "net" does not match "magnet"). */
const starts = (re: RegExp, text: string): boolean => new RegExp(`\\b(?:${re.source})`).test(text);

const cache = new WeakMap<EventDef, StopArt | null>();

/** The art for an event's map stop, or null when nothing fits (the glyph stays). `hasAsset` says which asset ids exist. */
export function stopArtFor(content: Content, ev: EventDef, hasAsset: (id: string) => boolean): StopArt | null {
  const hit = cache.get(ev);
  if (hit !== undefined) return hit;
  const found: { species?: string; item?: string } = {};
  walk(ev.choices, found);
  const itemIcon = (id: string | undefined): string | undefined => {
    if (!id) return undefined;
    const icon = content.items.get(id)?.iconAssetId ?? content.rewards.get(`item:${id}`)?.iconAssetId ?? undefined;
    return icon && hasAsset(icon) ? icon : undefined;
  };
  const cast = ev.scene.cast.find((id) => hasAsset(id));
  const sceneMon = ev.scene.pokemon && content.species.has(ev.scene.pokemon) ? ev.scene.pokemon : undefined;
  const givenMon = found.species && content.species.has(found.species) ? found.species : undefined;
  const item = itemIcon(found.item);
  const groupIcon = GROUP_ITEM[ev.group];
  const text = `${ev.id} ${ev.name}`.toLowerCase().replace(/[-_]/g, ' ');
  const wordTrainer = TRAINER_WORDS.find(([re, id]) => starts(re, text) && hasAsset(id))?.[1];
  const wordItem = ITEM_WORDS.find(([re, id]) => starts(re, text) && hasAsset(id))?.[1];
  const sceneId = `pack.memories.eventbg.${eventBackdrop(ev.types, ev.group, 'afternoon')}`;
  const art: StopArt | null = sceneMon
    ? { kind: 'pokemon', species: sceneMon }
    : cast
      ? { kind: 'trainer', assetId: cast }
      : givenMon
        ? { kind: 'pokemon', species: givenMon }
        : item
          ? { kind: 'item', assetId: item }
          : wordTrainer
            ? { kind: 'trainer', assetId: wordTrainer }
            : wordItem
              ? { kind: 'item', assetId: wordItem }
              : groupIcon && hasAsset(groupIcon)
                ? { kind: 'item', assetId: groupIcon }
                : hasAsset(sceneId)
                  ? { kind: 'scene', assetId: sceneId }
                  : null;
  cache.set(ev, art);
  return art;
}
