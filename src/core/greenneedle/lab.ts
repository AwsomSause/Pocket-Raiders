// Greenneedle gn.38, the Overgrown Laboratory: the subject that was made to be strong, and the form each ending gives it.
// The subject is cast from this region's pseudo-legendary line (a Pokémon of the region with a pseudo-legendary's bulk). It joins
// carrying the gn mark `lab-subject`; gn op `labForm` then gives it the ending's form:
//  - `belonging` (helped it leave): Belonging, +10% to every stat in this region and +5% everywhere after (5% for the run, 5% that
//    ends with the region: catalog overhaul `eventBoostsRegion`).
//  - `specification` (the work finished): Specification, its highest stat 20% higher, its lowest 10% lower (pokemon.ts calcStats).
//  - `self-made` (you stayed until it decided): it evolves by itself, and has Self-Made (battle/engine.ts).
import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import { getSpecies, maxHp } from '../pokemon';
import { evolve } from '../evolution';

/** Each region's pseudo-legendary line, first stage. */
export const LAB_BASE: Record<string, string> = {
  kanto: 'dratini', johto: 'larvitar', hoenn: 'bagon', sinnoh: 'gible', unova: 'deino', kalos: 'goomy', alola: 'jangmo-o', galar: 'dreepy', paldea: 'frigibax',
};
export const LAB_MARK = 'lab-subject';
export const LAB_FORMS = ['belonging', 'specification', 'self-made'] as const;
const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
const REGION_NAME = (id: string): string => id.charAt(0).toUpperCase() + id.slice(1);

/** The subject, wherever it is (party or box). */
export const labSubject = (run: Pick<RunState, 'party' | 'box'>): PokemonInstance | undefined => [...run.party, ...run.box].find((m) => m.gn?.includes(LAB_MARK));

/** Casts the subject for this region (once a run). */
export function labCast(content: Content, run: RunState, region: string): void {
  const base = LAB_BASE[region] ?? LAB_BASE.kanto!;
  if (Object.keys(run.story.flags).some((k) => k.startsWith('ev:cast-lab-subject:'))) return;
  run.story.flags[`ev:cast-lab-subject:${content.species.has(base) ? base : 'dratini'}`] = 1;
}

/** Gives the subject its ending's form. Returns the line to show. */
export function labForm(content: Content, run: RunState, form: string, region: string): string {
  const mon = labSubject(run);
  if (!mon || !(LAB_FORMS as readonly string[]).includes(form)) return '';
  if (form === 'belonging') {
    mon.fixedAbility = 'belonging';
    for (const s of STATS) {
      mon.eventBoosts = { ...mon.eventBoosts, [s]: (mon.eventBoosts?.[s] ?? 0) + 10 };
      mon.eventBoostsRegion = { ...mon.eventBoostsRegion, [s]: (mon.eventBoostsRegion?.[s] ?? 0) + 5 };
    }
    mon.marks = [...(mon.marks ?? []), `took its form in ${REGION_NAME(region)}`].slice(-8);
    mon.hp = maxHp(content, mon);
    return `${getSpecies(content, mon.speciesId).name} belongs to ${REGION_NAME(region)} now, as if it always had.`;
  }
  if (form === 'specification') {
    mon.fixedAbility = 'specification';
    mon.marks = [...(mon.marks ?? []), 'made, polished, and it knows it'].slice(-8);
    mon.hp = maxHp(content, mon);
    return `${getSpecies(content, mon.speciesId).name} has been finished.`;
  }
  const from = getSpecies(content, mon.speciesId);
  const to = from.evolutions.map((e) => e.to).find((id) => content.species.has(id));
  if (to) evolve(content, mon, to);
  mon.fixedAbility = 'self-made';
  mon.marks = [...(mon.marks ?? []), 'changed by itself, into something nobody designed'].slice(-8);
  mon.hp = maxHp(content, mon);
  return to ? `${from.name} changed, by itself, into ${getSpecies(content, to).name}.` : `${from.name} changed, by itself, in ways you can't name.`;
}
