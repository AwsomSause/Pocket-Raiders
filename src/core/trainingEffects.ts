// Run events G (training, growth and mastery): effects that change the lead's build.
// Nature changes, ability swaps, a stat nudge for the weakest stat, and learning a move of a chosen type.

import type { Content, EventEffect } from './contentSchema';
import { NATURE_IDS, nudgeNature } from './natures';
import { teachEggMove } from './mastery';
import { usableLearnset } from './pokemon';
import type { Rng } from './rng';
import type { RunState } from './state';

type TrainEffect = Extract<EventEffect, { kind: 'train' }>;
const STATS = ['atk', 'def', 'spa', 'spd', 'spe'] as const;

/** Short chip text for an outcome. */
export function trainEffectText(e: TrainEffect): string {
  switch (e.what) {
    case 'natureReroll': return "the lead's Nature changes";
    case 'natureNudge': return `the lead's Nature favours ${e.stat ?? 'a stat'}`;
    case 'abilitySwap': return "the lead's ability changes";
    case 'weakestStat': return "the lead's weakest stat is trained";
    case 'evolutionHint': return 'you learn how a party member evolves';
    case 'masteryShard': return "a Mastery Shard for the lead's species";
    case 'nap': return 'you sleep through the next wild stop';
    case 'learnMove': return e.type ? `the lead learns a ${e.type}-type move` : 'the lead swaps in a new move';
  }
}

/** Applies a training effect to the first healthy party member. Returns the outcome line, or '' when nothing changed. */
export function applyTrainEffect(content: Content, run: RunState, e: TrainEffect, rng: Rng): string {
  const lead = run.party.find((m) => m.hp > 0);
  if (!lead) return '';
  const species = content.species.get(lead.speciesId);
  if (!species) return '';
  const name = species.name;
  switch (e.what) {
    case 'natureReroll': {
      const next = rng.pick(NATURE_IDS.filter((n) => n !== lead.nature));
      lead.nature = next;
      return `${name}'s Nature becomes ${next}!`;
    }
    case 'natureNudge': {
      if (!e.stat) return '';
      const next = nudgeNature(lead.nature, e.stat);
      if (next === lead.nature) return '';
      lead.nature = next;
      return `${name}'s Nature becomes ${next}!`;
    }
    case 'abilitySwap': {
      const { normal, hidden } = species.abilities;
      const slots = [...normal.map((_, i) => i), ...(hidden ? [-1] : [])];
      if (slots.length < 2) return '';
      const at = Math.max(0, slots.indexOf(lead.abilitySlot === -1 ? -1 : lead.abilitySlot % Math.max(1, normal.length)));
      lead.abilitySlot = slots[(at + 1) % slots.length]!;
      const id = lead.abilitySlot === -1 ? hidden : normal[lead.abilitySlot];
      return `${name} now has ${id ? content.abilities.get(id)?.name ?? id : 'a new ability'}!`;
    }
    case 'weakestStat': {
      const cap = content.balance.vitaminMaxStacks;
      const stat = [...STATS].filter((s) => (lead.vitamins[s] ?? 0) < cap).sort((a, b) => species.baseStats[a] - species.baseStats[b])[0];
      if (!stat) return '';
      lead.vitamins[stat] = (lead.vitamins[stat] ?? 0) + 1;
      return `${name}'s ${stat} is trained up!`;
    }
    case 'evolutionHint': {
      const who = run.party.find((m) => (content.species.get(m.speciesId)?.evolutions.length ?? 0) > 0);
      const sp = who && content.species.get(who.speciesId);
      if (!who || !sp) return 'Nothing in your party has a further evolution.';
      const way = (ev: (typeof sp.evolutions)[number]) => {
        const to = content.species.get(ev.to)?.name ?? ev.to;
        const how = ev.item ? `with ${content.catalog.get(ev.item)?.name ?? ev.item}` : `at level ${ev.level}`;
        const extra = [ev.condition === 'atkGtDef' ? 'when Attack beats Defense' : ev.condition === 'atkLtDef' ? 'when Defense beats Attack' : ev.condition === 'atkEqDef' ? 'when Attack equals Defense' : '', ev.gender ? `(${ev.gender} only)` : '', ev.region ? `in ${ev.region}` : ''].filter(Boolean);
        return `${to} ${how}${extra.length ? ` ${extra.join(' ')}` : ''}`;
      };
      return `${sp.name} evolves into ${sp.evolutions.map(way).join(', or ')}.`;
    }
    case 'masteryShard': {
      const key = `shard:${lead.speciesId}`;
      run.itemCounters = { ...run.itemCounters, [key]: (run.itemCounters?.[key] ?? 0) + 1 };
      return `A Mastery Shard for ${name} (+${content.balance.mastery.shardBattles} battles toward its goals when the run ends)`;
    }
    case 'nap':
      run.itemCounters = { ...run.itemCounters, nap: 1 };
      return 'You sleep through the next wild stop.';
    case 'learnMove': {
      const ids = new Set([...usableLearnset(content, species).map((x) => x.move), ...(content.learnables.get(species.id) ?? [])]);
      const known = new Set(lead.moves.map((m) => m.id));
      const pool = [...ids].filter((id) => !known.has(id) && content.moves.get(id)?.supported && (!e.type || content.moves.get(id)!.type === e.type)).sort();
      if (pool.length === 0) return '';
      const id = rng.pick(pool);
      return teachEggMove(content, lead, id, []) ? `${name} learned ${content.moves.get(id)!.name}!` : '';
    }
  }
}
