// Catalog Overhaul Pack, category "places" (STORY_FAMILIES_15 SF102): the small rules the standalone choices and the Pacts need.
// - Bond Ceremony: a vowed Pokémon can't be released or traded, its friendship can't fall, and if it is lost the vow becomes a
//   Mark the whole party carries (a relic: friendship grows faster).
// - Away: a Pokémon stays behind somewhere (the Cursola reef) and comes back later through an event, stronger.
// - Risk Dial: a `stopWeight` modifier makes one kind of map stop (ambushes) more common.
// - Shadow Boon: a `bossLeadStages` modifier moves the lead's stats at the start of the next boss battle.
// Pure rules, no RNG, no Phaser. Only type imports, so the battle engine can read the modifiers without an import cycle
// (bringing a Pokémon back levels it up, so `bringBack` lives in ./placesAway.ts).
import type { ArchetypeModifier, Content, TypeName } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';

/** The relic a lost vowed Pokémon leaves behind: the party carries its promise. */
export const VOW_MARK = { id: 'vow-mark', name: 'Mark of the Vow', effects: [{ kind: 'friendshipMultiplier', value: 1.25 }] as ArchetypeModifier[] };

/** Whether this Pokémon is bound by the vow (it can't be released, traded or swapped out). */
export const isVowed = (mon: Pick<PokemonInstance, 'vowed'> | undefined): boolean => mon?.vowed === true;

/** A vowed Pokémon was lost for good: the Mark of the Vow joins the run's perks (once). Returns true when the mark was made. */
export function markLostVow(run: RunState, lost: readonly PokemonInstance[]): boolean {
  if (!lost.some(isVowed) || run.story.flags[`relic:${VOW_MARK.id}`]) return false;
  run.story.flags[`relic:${VOW_MARK.id}`] = true;
  run.story.flags['ev:vow-mark'] = 1;
  run.perkEffects = [...(run.perkEffects ?? []), ...VOW_MARK.effects];
  return true;
}

/** Sends a Pokémon away under `key` (the first of `type` when a type is named, else the given one); never the last one. Returns it, or null. */
export function sendAway(content: Content, run: RunState, key: string, chosen: PokemonInstance | undefined, type?: TypeName, shadow = false): PokemonInstance | null {
  if (run.party.length < 2) return null;
  const fits = (m: PokemonInstance) => (!type || (content.species.get(m.speciesId)?.types ?? []).includes(type)) && (!shadow || m.shadow !== undefined);
  const mon = chosen && fits(chosen) ? chosen : run.party.find(fits);
  if (!mon || isVowed(mon)) return null;
  run.party = run.party.filter((m) => m.uid !== mon.uid);
  run.coAway = [...(run.coAway ?? []).filter((a) => a.key !== key), { key, mon, region: run.regionIndex }];
  run.story.flags[`ev:${key}`] = 1;
  if (run.story.flags[`ev:${key}-at`] === undefined) run.story.flags[`ev:${key}-at`] = run.regionIndex + 1;
  return mon;
}

/** How much more often map stops of this kind are drawn (1 when no Risk Dial is set). */
export function stopWeightOf(perks: readonly ArchetypeModifier[] | undefined, stop: string | undefined): number {
  if (!stop || !perks) return 1;
  let w = 1;
  for (const m of perks) if (m.kind === 'stopWeight' && m.stop === stop) w *= m.value;
  return w;
}

/** The stage change the Shadow Boon's debt puts on your lead at the start of a boss battle (0 when none is owed). */
export function bossLeadStagesOf(perks: readonly ArchetypeModifier[] | undefined): number {
  let n = 0;
  for (const m of perks ?? []) if (m.kind === 'bossLeadStages') n += m.value;
  return Math.max(-6, Math.min(6, n));
}

/** SF94: the relic grows. Every copy of `from` (in the bag, or held by a party or box Pokémon) becomes `to`. Returns how many changed. */
export function upgradeItem(run: RunState, from: string, to: string): number {
  let n = 0;
  const bag = run.inventory[from] ?? 0;
  if (bag > 0) {
    delete run.inventory[from];
    run.inventory[to] = (run.inventory[to] ?? 0) + bag;
    n += bag;
  }
  for (const mon of [...run.party, ...run.box]) {
    const held = mon.held?.[from] ?? 0;
    if (held <= 0) continue;
    delete mon.held![from];
    mon.held![to] = (mon.held![to] ?? 0) + held;
    n += held;
  }
  return n;
}
