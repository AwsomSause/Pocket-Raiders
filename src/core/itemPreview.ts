// Overhaul slice 7: what an item would do to each party member, in plain words, before the player confirms.
// Pure: reads the content and the Pokémon, changes nothing, uses no RNG. The real effect is still `applyItemToPokemon`.

import type { Content, Item } from './contentSchema';
import { itemEvolutionTargets } from './evolution';
import { itemUseProblem } from './items';
import { natureName, nudgeNature } from './natures';
import { getSpecies, maxHp, maxPp } from './pokemon';
import type { PokemonInstance } from './state';

/** How the item sits with one Pokémon: shown as a coloured mark on its row. */
export type TargetMark = 'good' | 'fainted' | 'already' | 'blocked';

export interface TargetPreview {
  mark: TargetMark;
  /** A few words for the row, e.g. "HP 12 → 40" or "Fainted". */
  short: string;
  /** The full sentence for the footer: the exact effect, or the reason it can't be used. */
  detail: string;
}

export interface PreviewOptions {
  regionId?: string;
  /** Scales HP restored by healing items (the same number the real use gets). */
  healMultiplier?: number;
  /** An in-battle reason the item can't be used on this Pokémon (e.g. from the engine); wins over the item's own rules. */
  problem?: string | null;
}

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const STATUS_NAMES: Record<string, string> = { brn: 'Burn', psn: 'Poison', par: 'Paralysis', slp: 'Sleep', frz: 'Freeze' };
export const statusName = (id: string) => STATUS_NAMES[id] ?? id;

/** What `item` would do to `mon` right now. */
export function previewItemOn(content: Content, item: Item, mon: PokemonInstance, opts: PreviewOptions = {}): TargetPreview {
  const problem = opts.problem !== undefined && opts.problem !== null ? opts.problem : itemUseProblem(content, item, mon, opts.regionId);
  if (problem) {
    const fainted = mon.hp <= 0 && item.effect.kind !== 'revive';
    const already = /already|no status|hasn't fainted|no effect/i.test(problem);
    return { mark: fainted ? 'fainted' : already ? 'already' : 'blocked', short: fainted ? 'Fainted' : already ? shortReason(problem) : 'Can’t use', detail: problem };
  }
  const max = maxHp(content, mon);
  const mult = opts.healMultiplier ?? 1;
  const effect = item.effect;
  switch (effect.kind) {
    case 'healHp': {
      const after = Math.min(max, mon.hp + Math.floor(effect.amount * mult));
      return good(`HP ${mon.hp} → ${after}`, `Restores ${after - mon.hp} HP: ${mon.hp}/${max} → ${after}/${max}.`);
    }
    case 'cureStatus':
      return good(`Cures ${statusName(mon.status!.id)}`, `Cures ${statusName(mon.status!.id)}. HP stays ${mon.hp}/${max}.`);
    case 'fullRestore':
      return good(`HP → ${max}`, `Restores HP to ${max}/${max}${mon.status ? ` and cures ${statusName(mon.status.id)}` : ''}.`);
    case 'restorePp': {
      const amount = (effect as { amount: number }).amount;
      const low = mon.moves.filter((m) => m.pp < maxPp(content, m)).length;
      return good(`PP +${amount}`, `Restores up to ${amount} PP on each of its ${low} move${low === 1 ? '' : 's'} that is not full.`);
    }
    case 'revive': {
      const to = Math.max(1, Math.floor(max * effect.fraction));
      return good(`Revive ${to} HP`, `Brings it back with ${to}/${max} HP (${Math.round(effect.fraction * 100)}%) and no status.`);
    }
    case 'evolve': {
      const names = itemEvolutionTargets(content, mon, item.id, opts.regionId).map((id) => getSpecies(content, id).name);
      return good(`Evolves`, `Evolves into ${names.join(' or ')}.`);
    }
    case 'natureNudge': {
      const to = natureName(nudgeNature(mon.nature, effect.stat));
      return good(`Nature → ${to}`, `Nature ${natureName(mon.nature ?? 'hardy')} → ${to}.`);
    }
    case 'teraShard':
      return good(`Tera → ${cap(effect.type)}`, `Tera Type becomes ${cap(effect.type)}.`);
    default:
      return good('Works', item.description);
  }
}

function good(short: string, detail: string): TargetPreview {
  return { mark: 'good', short, detail };
}

function shortReason(problem: string): string {
  if (/HP is already full/i.test(problem)) return 'HP full';
  if (/PP is already full/i.test(problem)) return 'PP full';
  if (/no status/i.test(problem)) return 'No status';
  if (/hasn't fainted/i.test(problem)) return 'Not fainted';
  if (/already healthy/i.test(problem)) return 'Healthy';
  if (/already/i.test(problem)) return 'Already set';
  return 'No effect';
}

/** The item card: name, rarity, how many you own, what it says it does, and who can use it. */
export interface ItemCard {
  name: string;
  rarity: string;
  owned: number;
  description: string;
  /** Who it works on right now, e.g. "Works on 2 of 4 Pokémon". */
  applies: string;
  restrictions: string[];
}

export function itemCard(content: Content, item: Item, owned: number, previews: readonly TargetPreview[]): ItemCard {
  const ok = previews.filter((p) => p.mark === 'good').length;
  const restrictions: string[] = [];
  if (!item.usableInBattle) restrictions.push('Not usable in battle.');
  if (!item.usableOutside) restrictions.push('Only usable in battle.');
  if (item.target === 'fainted') restrictions.push('Only on a fainted Pokémon.');
  else if (item.target === 'party') restrictions.push('Not on a fainted Pokémon.');
  return {
    name: item.name,
    rarity: cap(content.catalog.get(item.id)?.rarity ?? 'common'),
    owned,
    description: item.description,
    applies: `Works on ${ok} of ${previews.length} Pokémon right now.`,
    restrictions,
  };
}

/** One line for the screen footer: card + the focused Pokémon's exact preview. */
export function itemFooter(card: ItemCard, preview: TargetPreview): string {
  return `${card.name} (${card.rarity}, you have ${card.owned}): ${card.description}  ▶ ${preview.detail}`;
}
