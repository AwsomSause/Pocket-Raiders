// The item catalog's effects (M8.75 item effects; data in itemCatalog.json,
// design in the "Item effects plan" Claude Doc).
//
// A catalog item taken from the reward draft works right away: attribute
// items, valuables, Wings, berries, healing items, PP Ups, TMs and HMs,
// fossils, and run-long perks like the Amulet Coin. Copies pile up where the
// entry's `stacksOn` says:
//   - "pokemon": on the Pokémon the player picks (Wings count toward `max`)
//   - "team" / "player": on the run (run.passives counts copies)
// A team or player item already at its max is still offered, and picking it
// is a free re-roll of the draft (director, answer 5).
// Battle, map and event items are "pending" and never offered until built.

import { natureEffectText, natureName, nudgeNature } from './natures';
import { runPerks } from './archetypes';
import { itemSlotLimit } from './trainerPerks';
import { addRunAttribute, attributeText, runAttributeEffects } from './attributes';
import { STAT_NAMES, TYPE_NAMES, type AttributeKey, type CatalogEffect, type CatalogEntry, type Content, type StatName } from './contentSchema';
import { addEvs, hyperTrain, ivsOf, MAX_IV } from './ivs';

const STAT_LABEL: Record<StatName, string> = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' };
import { changeFriendship } from './friendship';
import { addItem } from './items';
import { abilityOf, createPokemon, getSpecies, MAX_PP_UPS, maxHp, maxPp } from './pokemon';
import { activePerks, addMapItem, mapItemCopies, perksOf } from './mapItems';
import { discover } from './progress';
import { runLevelCap } from './regions';
import { eggStatus, layEgg } from './eggs';
import { isNative, wildEligibleSpecies } from './themes';
import { hashSeed, Rng } from './rng';
import { noItemCaps } from './rules';
import { noteMapGrowth } from './overhaul/growth';
import type { PendingDecision, PokemonInstance, RunState } from './state';

/** How many random moves a TM offers (an HM offers every one). */
export const TM_CHOICES = 3;

export type PassiveKind = Extract<CatalogEffect, { kind: 'passive' }>['passive'];

export function getCatalogEntry(content: Content, id: string): CatalogEntry {
  const entry = content.catalog.get(id);
  if (!entry) throw new Error(`Unknown catalog item "${id}"`);
  return entry;
}

/** Copies of a team or player item this run (map items: charges left or stage effects waiting). */
export function ownedCopies(run: RunState, entry: CatalogEntry): number {
  if (entry.effect?.kind === 'encounter' || entry.effect?.kind === 'perk') return mapItemCopies(run, entry);
  return run.passives?.[entry.id] ?? 0;
}

/** A team or player item already at its max: picking it re-rolls the draft instead. */
export function isFreeReroll(content: Content, run: RunState, entry: CatalogEntry): boolean {
  const max = effectiveMax(content, run, entry);
  return entry.stacksOn !== 'pokemon' && max !== null && ownedCopies(run, entry) >= max;
}

/** Kinds of item that give a lasting bonus; these stack only to `balance.itemCaps.bonusMax`. */
const BONUS_KINDS = new Set(['held', 'passive', 'statBoost', 'perk']);

/** How many of an item can stack this run: the catalog limit, lowered to the bonus cap unless No Item Caps is on. Map charges (repels) are not bonuses. */
export function effectiveMax(content: Content, run: Pick<RunState, 'rules'>, entry: CatalogEntry): number | null {
  if (entry.max === null) return null;
  if (!BONUS_KINDS.has(entry.effect?.kind ?? '') || (run.rules && noItemCaps(run.rules))) return entry.max;
  return Math.min(entry.max, content.balance.itemCaps.bonusMax);
}

/** The run-long bonus from every copy of every item with this passive, in percent. */
export function passivePercent(content: Content, run: RunState, passive: PassiveKind): number {
  let total = 0;
  for (const [id, copies] of Object.entries(run.passives ?? {})) {
    const effect = content.catalog.get(id)?.effect;
    if (effect?.kind === 'passive' && effect.passive === passive) total += effect.percent * copies;
  }
  return total;
}

/** Moves of one type this Pokémon could learn by TM, tutor or egg (or level-up) that it doesn't know. */
export function teachableMoves(content: Content, mon: PokemonInstance, type: string): string[] {
  const species = getSpecies(content, mon.speciesId);
  const ids = new Set([
    ...(content.learnables.get(species.id) ?? (species.form ? content.learnables.get(species.form.base) : undefined) ?? []),
    ...species.learnset.map((e) => e.move),
  ]);
  return [...ids]
    .filter((id) => {
      const move = content.moves.get(id);
      return move?.supported === true && move.type === type && !mon.moves.some((m) => m.id === id);
    })
    .sort();
}

/** Why this item can't go to this Pokémon, or null if it can. Only for "pokemon" items. */
export function catalogTargetProblem(content: Content, run: RunState, entry: CatalogEntry, mon: PokemonInstance): string | null {
  const effect = entry.effect!;
  const fainted = mon.hp <= 0;
  switch (effect.kind) {
    case 'statBoost': {
      const copies = Math.round((mon.statBoosts?.[effect.stat] ?? 0) / effect.percent);
      const max = effectiveMax(content, run, entry);
      return max !== null && copies >= max ? 'That Pokémon has already had the maximum.' : null;
    }
    case 'nature':
      return (effect.battles ? mon.tempNature?.nature : mon.nature) === effect.nature ? `That Pokémon is already ${natureName(effect.nature)}.` : null;
    case 'teraType': {
      const types = getSpecies(content, mon.speciesId).types;
      return effect.mode !== 'random' && mon.teraType === (effect.mode === 'secondary' ? types[1] ?? types[0] : types[0]) ? 'That is already its Tera Type.' : null;
    }
    case 'ability': {
      const abilities = getSpecies(content, mon.speciesId).abilities;
      if (effect.mode === 'hidden') return !abilities.hidden ? 'That Pokémon has no hidden ability.' : mon.abilitySlot === -1 ? 'That Pokémon already has its hidden ability.' : null;
      return abilities.normal.length < 2 ? 'That Pokémon has only one ability to choose from.' : mon.abilitySlot === -1 ? 'A hidden ability can\'t be swapped with a Capsule.' : null;
    }
    case 'natureNudge':
      return nudgeNature(mon.nature, effect.stat) === (mon.nature ?? 'hardy') ? 'That Pokémon is already tuned that way.' : null;
    case 'ppUp':
      return mon.moves.some((m) => (m.ppUps ?? 0) < MAX_PP_UPS) ? null : "That Pokémon's moves already have the most PP they can.";
    case 'care':
      if (effect.revive) return fainted ? null : 'That Pokémon has not fainted.';
      if (fainted) return 'That Pokémon has fainted.';
      if (effect.heal && mon.hp >= maxHp(content, mon)) return "That Pokémon's HP is already full.";
      if (effect.cure && !mon.status) return 'That Pokémon has no status problem.';
      if (effect.ppMove && !mon.moves.some((m) => m.pp < maxPp(content, m))) return "That Pokémon's PP is already full.";
      return null;
    case 'teachMove':
      return teachableMoves(content, mon, effect.type).length > 0 ? null : `That Pokémon can't learn a new ${capitalize(effect.type)} move.`;
    case 'held': {
      const copies = mon.held?.[entry.id] ?? 0;
      // A trainer perk (Bill) can shrink how many different items one Pokémon holds.
      if (copies === 0 && Object.keys(mon.held ?? {}).length >= itemSlotLimit(content.balance.heldItemSlots, runPerks(content, run))) return 'That Pokémon has no free item slot.';
      const max = effectiveMax(content, run, entry);
      return max !== null && copies >= max ? `That Pokémon already holds ${copies === 1 ? 'one' : 'the most'}.` : null;
    }
    case 'battleBoost': {
      const stats = effect.boosts.map((b) => (b.kind === 'stage' ? b.stat : b.kind));
      const pending = (mon.boosts ?? []).filter((b) => stats.includes(b.kind === 'stage' ? b.stat : b.kind)).length;
      if (entry.max !== null && pending >= entry.max * effect.boosts.length) return 'That Pokémon already has the most of this boost.';
      if (effect.cure && fainted) return 'That Pokémon has fainted.';
      return null;
    }
    case 'feed': {
      // An EV berry only refuses when it would do nothing at all (no friendship change and no EVs to move).
      const evs = Object.entries(effect.evs ?? {}) as [StatName, number][];
      if (evs.length === 0 || effect.friendship !== 0) return null;
      return evs.some(([s, n]) => (n < 0 ? (mon.evs?.[s] ?? 0) > 0 : true)) ? null : 'That Pokémon has no EVs there to lower.';
    }
    case 'hyperTrain': {
      const real = ivsOf(mon);
      return STAT_NAMES.some((s) => real[s] < MAX_IV && !(mon.hyperTrained ?? []).includes(s)) ? null : 'Its stats already count as the best they can be.';
    }
    default:
      return null;
  }
}

/** The ball each Apricorn becomes in an Apricorn Box. */
const APRICORN_BALLS: Record<string, string> = {
  'red-apricorn': 'level-ball',
  'blu-apricorn': 'lure-ball',
  'ylw-apricorn': 'moon-ball',
  'grn-apricorn': 'friend-ball',
  'pnk-apricorn': 'love-ball',
  'wht-apricorn': 'fast-ball',
  'blk-apricorn': 'heavy-ball',
};

/** Whether the item does something for this run right now (it's left out of the draft otherwise). */
export function isCatalogUseful(content: Content, run: RunState, entry: CatalogEntry): boolean {
  if (entry.status !== 'supported') return false;
  if (entry.stacksOn === 'pokemon') return run.party.some((mon) => catalogTargetProblem(content, run, entry, mon) === null);
  const effect = entry.effect!;
  if (effect.kind === 'teamCare') {
    if (effect.changes && Object.keys(effect.changes).length > 0) return true;
    return run.party.some(
      (mon) =>
        (effect.revive !== undefined && mon.hp <= 0) ||
        (effect.heal !== undefined && mon.hp > 0 && mon.hp < maxHp(content, mon)) ||
        (effect.pp !== undefined && mon.moves.some((m) => m.pp < maxPp(content, m))),
    );
  }
  if (effect.kind === 'fossil' || effect.kind === 'egg') return run.party.length > 0;
  return true;
}

export interface CatalogResult {
  messages: string[];
  pending: PendingDecision[];
}

/**
 * Applies a catalog item (mutates `run`). `target` is the chosen Pokémon for
 * "pokemon" items; `moneyMultiplier` is the trainer's money bonus; `rng` picks
 * a TM's random moves.
 */
export function applyCatalog(
  content: Content,
  run: RunState,
  entry: CatalogEntry,
  target: PokemonInstance | undefined,
  opts: { moneyMultiplier: number; rng: Rng },
): CatalogResult {
  const effect = entry.effect;
  if (entry.status !== 'supported' || !effect) throw new Error(`${entry.name} doesn't work yet`);
  if (entry.stacksOn === 'pokemon') {
    if (!target) throw new Error('Choose a Pokémon');
    const problem = catalogTargetProblem(content, run, entry, target);
    if (problem) throw new Error(problem);
  }
  const messages: string[] = [];
  const pending: PendingDecision[] = [];
  const friendshipGain = runAttributeEffects(content, run).friendship;
  const name = (mon: PokemonInstance) => getSpecies(content, mon.speciesId).name;
  const applyChanges = (changes: Partial<Record<AttributeKey, number>> | undefined) => {
    for (const [key, amount] of Object.entries(changes ?? {}) as [AttributeKey, number][]) {
      const value = addRunAttribute(content, run, key, amount);
      messages.push(`${attributeText(key, value)} for the rest of this run.`);
    }
  };
  const heal = (mon: PokemonInstance, amount: number) => {
    const before = mon.hp;
    mon.hp = Math.min(maxHp(content, mon), mon.hp + amount);
    return mon.hp - before;
  };
  const befriend = (mon: PokemonInstance, amount: number) => {
    changeFriendship(content, mon, amount, friendshipGain);
    messages.push(amount >= 0 ? `${name(mon)} likes you a little more.` : `${name(mon)} didn't like that…`);
  };

  // Team and player items are counted on the run (one-time battle boosts and map items with charges aren't kept there).
  const counted = effect.kind !== 'battleBoost' && effect.kind !== 'bagItem' && effect.kind !== 'egg' && ((effect.kind !== 'encounter' && effect.kind !== 'perk') || effect.lasts.for === 'run');
  if (entry.stacksOn !== 'pokemon' && counted) run.passives = { ...run.passives, [entry.id]: ownedCopies(run, entry) + 1 };

  // Apricorn Box: each Apricorn becomes a ball right away.
  if (entry.id.endsWith('-apricorn') && passivePercent(content, run, 'apricornBox') > 0) {
    const ball = APRICORN_BALLS[entry.id] ?? 'great-ball';
    addItem(run.inventory, ball, 1);
    messages.push(`The Apricorn Box turned it into a ${content.items.get(ball)?.name ?? 'ball'}.`);
  }

  switch (effect.kind) {
    case 'attributes': {
      applyChanges(effect.changes);
      const lead = run.party[0];
      if (lead && effect.healLead && lead.hp > 0) messages.push(`${name(lead)} recovered ${heal(lead, effect.healLead)} HP.`);
      if (lead && effect.leadFriendship) befriend(lead, effect.leadFriendship);
      break;
    }
    case 'money': {
      const amount = Math.floor(effect.amount * opts.moneyMultiplier);
      run.money += amount;
      messages.push(`You sold the ${entry.name} for ₽${amount}.`);
      applyChanges(effect.changes);
      if (effect.teamHeal) {
        for (const mon of run.party) if (mon.hp > 0) heal(mon, Math.floor(maxHp(content, mon) * effect.teamHeal));
        messages.push('Your team feels a little better.');
      }
      break;
    }
    case 'statBoost': {
      const mon = target!;
      const before = maxHp(content, mon);
      mon.statBoosts = { ...mon.statBoosts, [effect.stat]: (mon.statBoosts?.[effect.stat] ?? 0) + effect.percent };
      if (effect.stat === 'hp' && mon.hp > 0) mon.hp += maxHp(content, mon) - before;
      messages.push(`${name(mon)}'s ${STAT_LABELS[effect.stat]} rose a little!`);
      break;
    }
    case 'feed': {
      const mon = target ?? run.party[0];
      // Poffin Case doubles friendship from Berries; Pokéblock Case adds Charisma.
      const doubled = effect.friendship > 0 && passivePercent(content, run, 'feedFriendship') > 0;
      if (mon) befriend(mon, effect.friendship * (doubled ? 2 : 1));
      if (mon && effect.evs) {
        const before = maxHp(content, mon);
        for (const [stat, n] of Object.entries(effect.evs) as [StatName, number][]) {
          const moved = addEvs(content, mon, stat, n);
          if (moved !== 0) messages.push(`${name(mon)}'s ${STAT_LABEL[stat]} EVs ${moved > 0 ? 'rose' : 'fell'} by ${Math.abs(moved)}.`);
        }
        if (mon.hp > 0) mon.hp = Math.max(1, Math.min(maxHp(content, mon), mon.hp + maxHp(content, mon) - before));
      }
      if (mon && entry.family.startsWith('Berries')) noteMapGrowth(content, run, mon.uid, 'berryFeed');
      applyChanges(effect.changes);
      const blocks = passivePercent(content, run, 'feedCharisma');
      if (blocks > 0 && entry.family.startsWith('Berries')) applyChanges({ charisma: blocks });
      break;
    }
    case 'teraType': {
      const mon = target!;
      const types = getSpecies(content, mon.speciesId).types;
      mon.teraType = effect.mode === 'random' ? TYPE_NAMES[opts.rng.int(0, TYPE_NAMES.length - 1)]! : effect.mode === 'secondary' ? types[1] ?? types[0]! : types[0]!;
      messages.push(`${name(mon)}'s Tera Type became ${mon.teraType}.`);
      break;
    }
    case 'ability': {
      const mon = target!;
      const abilities = getSpecies(content, mon.speciesId).abilities;
      mon.abilitySlot = effect.mode === 'hidden' ? -1 : (Math.max(0, mon.abilitySlot) + 1) % abilities.normal.length;
      messages.push(`${name(mon)}'s ability became ${(abilityOf(content, mon) ?? 'none').replace(/-/g, ' ')}.`);
      break;
    }
    case 'hyperTrain': {
      const mon = target!;
      const before = maxHp(content, mon);
      const trained = hyperTrain(mon, effect.mode);
      messages.push(trained.length ? `${name(mon)} was hyper trained: ${trained.map((s) => STAT_LABEL[s]).join(', ')} now count${trained.length === 1 ? 's' : ''} as the best IV.` : `${name(mon)} is already at its best.`);
      if (mon.hp > 0) mon.hp = Math.max(1, Math.min(maxHp(content, mon), mon.hp + maxHp(content, mon) - before));
      break;
    }
    case 'natureNudge': {
      const mon = target!;
      mon.nature = nudgeNature(mon.nature, effect.stat);
      messages.push(`${name(mon)} became ${natureName(mon.nature)} (${natureEffectText(mon.nature)}).`);
      mon.hp = Math.min(mon.hp, maxHp(content, mon));
      break;
    }
    case 'nature': {
      const mon = target!;
      const before = maxHp(content, mon);
      if (effect.battles) {
        mon.tempNature = { nature: effect.nature, battles: effect.battles };
        messages.push(`${name(mon)} felt ${natureName(effect.nature)} (${natureEffectText(effect.nature)}) for ${effect.battles} battles.`);
      } else {
        mon.nature = effect.nature;
        messages.push(`${name(mon)} became ${natureName(effect.nature)} (${natureEffectText(effect.nature)}).`);
      }
      mon.hp = Math.min(mon.hp, maxHp(content, mon));
      void before;
      break;
    }
    case 'ppUp':
      pending.push({ kind: 'ppUp', uid: target!.uid, itemName: entry.name, ups: effect.ups });
      break;
    case 'care': {
      const mon = target!;
      if (effect.revive) {
        mon.hp = Math.max(1, Math.floor(maxHp(content, mon) * effect.revive));
        mon.status = null;
        messages.push(`${name(mon)} was revived!`);
      }
      if (effect.heal) messages.push(`${name(mon)} recovered ${heal(mon, effect.heal)} HP.`);
      if (effect.cure) {
        mon.status = null;
        messages.push(`${name(mon)} was cured.`);
      }
      if (effect.ppMove) {
        const slot = [...mon.moves].sort((a, b) => a.pp / maxPp(content, a) - b.pp / maxPp(content, b))[0]!;
        slot.pp = maxPp(content, slot);
        messages.push(`${content.moves.get(slot.id)!.name}'s PP was restored.`);
      }
      if (effect.friendship) befriend(mon, effect.friendship);
      applyChanges(effect.changes);
      break;
    }
    case 'teamCare': {
      for (const mon of run.party) {
        if (effect.revive && mon.hp <= 0) {
          mon.hp = Math.max(1, Math.floor(maxHp(content, mon) * effect.revive));
          mon.status = null;
        } else if (effect.heal && mon.hp > 0) {
          heal(mon, Math.floor(maxHp(content, mon) * effect.heal));
        }
        if (effect.cureSleep && mon.status?.id === 'slp') mon.status = null;
        if (effect.pp !== undefined) {
          for (const slot of mon.moves) slot.pp = effect.pp < 0 ? maxPp(content, slot) : Math.min(maxPp(content, slot), slot.pp + effect.pp);
        }
      }
      messages.push(`The ${entry.name} cared for your whole team.`);
      applyChanges(effect.changes);
      break;
    }
    case 'passive':
      messages.push(`${entry.name}: ${entry.description}.`);
      break;
    case 'held': {
      if (entry.stacksOn === 'pokemon') {
        const mon = target!;
        mon.held = { ...mon.held, [entry.id]: (mon.held?.[entry.id] ?? 0) + 1 };
        messages.push(`${name(mon)} is now holding ${mon.held[entry.id]! > 1 ? `${mon.held[entry.id]} ` : 'the '}${entry.name}${mon.held[entry.id]! > 1 ? 's' : ''}.`);
      } else {
        messages.push(`${entry.name}: ${entry.description}.`);
      }
      break;
    }
    case 'battleBoost': {
      const mons = entry.stacksOn === 'pokemon' ? [target!] : run.party.filter((m) => m.hp > 0);
      for (const mon of mons) {
        if (effect.cure && mon.status?.id === effect.cure) {
          mon.status = null;
          messages.push(`${name(mon)} was cured.`);
        }
        mon.boosts = [...(mon.boosts ?? []), ...effect.boosts];
      }
      messages.push(`${entry.description}: it takes effect in the next battle.`);
      break;
    }
    case 'encounter':
    case 'perk': {
      if (effect.kind === 'encounter') applyChanges(effect.changes);
      addMapItem(content, run, entry);
      messages.push(`${entry.name}: ${entry.description}.`);
      break;
    }
    case 'bagItem': {
      addItem(run.inventory, effect.item, effect.count);
      messages.push(`${entry.name} went into your Bag${effect.count > 1 ? ` ×${effect.count}` : ''}.`);
      break;
    }
    case 'fossil': {
      const levels = run.party.map((m) => m.level);
      const level = Math.max(1, Math.min(runLevelCap(content, run), Math.floor(levels.reduce((a, b) => a + b, 0) / Math.max(1, levels.length))));
      const mon = createPokemon(content, effect.species, level, `p${run.nextUid}`);
      run.nextUid += 1;
      discover(run, mon.speciesId, true);
      messages.push(`The ${entry.name} was revived into ${name(mon)}!`);
      pending.push({ kind: 'caught', mon });
      break;
    }
    case 'egg': {
      // Its own generator, so no other roll in this pick changes.
      const rng = new Rng(hashSeed(`${run.seed}::mystery-egg::${run.itemCounters?.['eggs-laid'] ?? 0}`));
      const region = run.regionOrder[run.regionIndex];
      const pool = wildEligibleSpecies(content).filter((s) => s.evolutionStage === 1);
      const speciesId = rng.weighted(pool.map((s) => ({ item: s.id, weight: isNative(content, s, region) ? content.balance.nativeWeight : 1 })));
      const levels = run.party.map((m) => m.level);
      const level = Math.max(1, Math.min(runLevelCap(content, run), Math.floor(levels.reduce((a, b) => a + b, 0) / Math.max(1, levels.length)) - 3));
      const shiny = runAttributeEffects(content, run).shinyChance * effect.shiny;
      const made = layEgg(content, run, speciesId, { level, left: effect.stages, unit: 'stage', source: entry.name, shinyMultiplier: shiny }, rng);
      messages.push(`You have an Egg! ${eggStatus(made)}.`);
      break;
    }
    case 'teachMove': {
      const choices = teachableMoves(content, target!, effect.type);
      // TM Case: more moves to pick from.
      const extra = perksOf(activePerks(content, run), 'tmChoices').reduce((sum, p) => sum + p.perk.extra, 0);
      const moveIds = effect.mode === 'hm' ? choices : opts.rng.shuffle(choices).slice(0, TM_CHOICES + extra);
      pending.push({ kind: 'teachMove', uid: target!.uid, itemName: entry.name, moveIds });
      break;
    }
  }
  return { messages, pending };
}

const STAT_LABELS = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' } as const;

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
