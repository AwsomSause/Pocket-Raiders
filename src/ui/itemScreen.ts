// Overhaul slice 7: the text behind the item screen's party preview (no Phaser here, so it can be unit-tested).

import type { Content, Item } from '../core/contentSchema';
import { itemEvolutionTargets } from '../core/evolution';
import { previewItemOn, statusName, type PreviewOptions, type TargetPreview } from '../core/itemPreview';
import { getSpecies, maxHp } from '../core/pokemon';
import { teraTypeOf } from '../core/items';
import type { PokemonInstance, RunState } from '../core/state';
import { summaryInfo } from './summaryLook';

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

/** The quick Pokémon summary: types, ability, nature, stats, moves with PP, held items, status, HP, evolution and run bonuses. */
export function quickSummaryText(content: Content, run: RunState | null, mon: PokemonInstance, regionId?: string): string {
  const info = summaryInfo(content, run, mon);
  const species = getSpecies(content, mon.speciesId);
  const max = maxHp(content, mon);
  const lines: string[] = [];
  lines.push(`${info.name}  Lv${info.level}  ·  ${info.types.map(cap).join(' / ')}`);
  lines.push(`HP ${mon.hp}/${max} (${Math.round((mon.hp / max) * 100)}%)  ·  Status: ${mon.hp <= 0 ? 'Fainted' : mon.status ? statusName(mon.status.id) : 'none'}`);
  lines.push(`Ability: ${info.ability ? `${info.ability.name}: ${info.ability.text}` : 'none'}`);
  lines.push(`Nature: ${info.nature ?? 'none'}  ·  Tera Type: ${cap(teraTypeOf(content, mon))}`);
  lines.push(info.stats.map((s) => `${s.label} ${s.value}${s.boosted ? '*' : ''}`).join('   '));
  lines.push('Moves:');
  for (const m of info.moves) lines.push(`  ${m.name}  (${cap(m.type)}, ${m.category}, power ${m.power})  PP ${m.pp}`);
  lines.push(`Held: ${info.held.length ? info.held.map((h) => `${h.name}${h.count > 1 ? ` ×${h.count}` : ''}`).join(', ') : 'nothing'}`);
  const evo = evolutionLine(content, mon, regionId);
  lines.push(evo || `Evolution: ${species.evolutions?.length ? 'later, by level or condition' : 'none'}`);
  if (mon.boosts?.length) lines.push(`Run bonuses: ${mon.boosts.length} battle boost${mon.boosts.length > 1 ? 's' : ''} ready`);
  if (info.record) lines.push(`This run: ${info.record}`);
  return lines.join('\n');
}

/** Which of your evolution items would evolve it right now (an item you are holding in the Bag is not needed). */
function evolutionLine(content: Content, mon: PokemonInstance, regionId?: string): string {
  const ways: string[] = [];
  for (const item of content.items.values()) {
    if (item.effect.kind !== 'evolve') continue;
    const to = itemEvolutionTargets(content, mon, item.id, regionId);
    if (to.length > 0) ways.push(`${item.name} → ${to.map((id) => getSpecies(content, id).name).join(' or ')}`);
  }
  return ways.length ? `Evolution: ${ways.join('; ')}` : '';
}

/** Previews for the whole party at once, for one item. `problemFor` lets a battle pass the engine's own reason. */
export function partyPreviews(content: Content, item: Item, party: readonly PokemonInstance[], opts: PreviewOptions & { problemFor?: (index: number) => string | null } = {}): TargetPreview[] {
  return party.map((mon, i) => previewItemOn(content, item, mon, { ...opts, problem: opts.problemFor ? opts.problemFor(i) : opts.problem }));
}
