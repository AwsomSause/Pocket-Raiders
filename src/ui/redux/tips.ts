// New UI hover help: what a Pokémon's Ability card and a move's tooltip say, and the wait before they show.
// Display only: read from the content and the profile's Pokédex tally; nothing here changes a run or rolls anything.

import { moveFlagLabels, moveFullDescription } from '../../core/battle/moveText';
import { tallyOf } from '../../core/dexResearch';
import { abilityOf, getSpecies, maxPp } from '../../core/pokemon';
import { TOOLTIP_DELAY_MS } from '../../core/presentation/uiPrefs';
import type { PokemonInstance } from '../../core/state';
import { services } from '../../game/services';
import { fixedDamageLabel } from '../battleText';
import type { BattlePanel } from './screens/battle';

type Slot = PokemonInstance['moves'][number];

/** "Seen in 14 battles": the species' sightings in earlier runs (the Pokédex research tally). */
export function seenFact(speciesId: string): [string, string] {
  const seen = tallyOf(services().session.profile, speciesId).seen;
  return ['Seen in', seen ? `${seen} ${seen === 1 ? 'battle' : 'battles'}` : 'no earlier run'];
}

/** One of your own Pokémon: its Ability, what it does, the species' Hidden Ability and how often you have met the species. */
export function ownAbilityCard(mon: PokemonInstance, tag?: string): BattlePanel {
  const content = services().session.content;
  const id = abilityOf(content, mon);
  const ability = id ? content.abilities.get(id) : undefined;
  const who = tag ? { tag } : {};
  if (!ability) return { head: 'No Ability', ...who, chips: [], facts: [seenFact(mon.speciesId)], lines: ['This Pokémon has no Ability.'] };
  const hidden = getSpecies(content, mon.speciesId).abilities.hidden;
  const hiddenName = hidden ? content.abilities.get(hidden)?.name ?? null : null;
  return { head: ability.name, ...who, chips: [], facts: [...(hiddenName ? [['Hidden Ability', hidden === id ? 'This one' : hiddenName] as [string, string]] : []), seenFact(mon.speciesId)], lines: [ability.description] };
}

/** One move slot as the tooltip: type chip, the numbers, then what it does. `extra` rows go after Priority (the battle adds "Against X"). */
export function moveTipOf(slot: Slot | undefined, extra: readonly (readonly [string, string])[] = [], notes: readonly string[] = []): BattlePanel | null {
  const content = services().session.content;
  const move = slot ? content.moves.get(slot.id) : undefined;
  if (!slot || !move) return null;
  const power = move.power ? (slot.hyper ? `${move.power + content.balance.hyperMove.powerBonus} (Hyper +${content.balance.hyperMove.powerBonus})` : move.power) : fixedDamageLabel(move.effects.fixedDamage);
  return {
    head: move.name,
    chips: [move.type],
    facts: [
      ['Category', move.category.charAt(0).toUpperCase() + move.category.slice(1)],
      ['Power / Accuracy', `${power ?? '—'} / ${move.accuracy ?? '—'}`],
      ['PP', `${slot.pp} / ${maxPp(content, slot)}`],
      ['Priority', `${move.priority > 0 ? '+' : ''}${move.priority}`],
      ...extra.map(([a, b]) => [a, b] as [string, string]),
    ],
    lines: [moveFullDescription(move), ...moveFlagLabels(move), ...notes],
  };
}

/**
 * The `tip` handler for `mountRedux`: `show(key)` is called once the pointer has rested on a `data-tip` element for
 * the Tooltip delay setting, and `show(null)` when it leaves. With the setting Off nothing ever shows.
 */
export function hoverTips(show: (key: string | null) => void): (key: string | null) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let shown: string | null = null;
  return (key) => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (shown !== null) {
      shown = null;
      show(null);
    }
    const wait = TOOLTIP_DELAY_MS[services().session.settings.tooltipDelay];
    if (key === null || wait === null) return;
    timer = setTimeout(() => {
      timer = null;
      shown = key;
      show(key);
    }, wait);
  };
}
