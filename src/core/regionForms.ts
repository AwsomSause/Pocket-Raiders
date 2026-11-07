// Regional form offers: when a Pokémon steps into a region where its species has a regional form, the player may let it
// take that form (free, once per Pokémon per region visit). Not a battle mechanic. Choices live in run.story.flags
// (`rform:<regionIndex>:<uid>`), so there is no save change. Camp > Form shift (a Moon Stone) still swaps back and forth.

import type { Content } from './contentSchema';
import { switchForm, formShiftTargets } from './formShift';
import { getSpecies } from './pokemon';
import type { RunState } from './state';

export interface RegionFormOffer { uid: string; speciesId: string; targets: string[] }

const flagOf = (run: Pick<RunState, 'regionIndex'>, uid: string): string => `rform:${run.regionIndex}:${uid}`;

const LINES: Record<string, string> = {
  alola: 'is loving the beaches of Alola. Want it to start surfing?',
  galar: 'is feeling the roar of the Galar crowds. Want it to try the local style?',
  sinnoh: 'senses something ancient in the Sinnoh mountains. Want it to take its Hisuian form?',
  paldea: 'is charging across the open plains of Paldea. Want it to take its Paldean form?',
};

/** Party Pokémon in their base form that have a regional form of the region the run is in and have not been asked yet here. */
export function regionFormOffers(content: Content, run: Pick<RunState, 'party' | 'regionOrder' | 'regionIndex' | 'story'>): RegionFormOffer[] {
  const region = run.regionOrder[run.regionIndex];
  if (!region) return [];
  const offers: RegionFormOffer[] = [];
  for (const mon of run.party) {
    if (getSpecies(content, mon.speciesId).form?.kind === 'regional') continue;
    if (run.story.flags[flagOf(run, mon.uid)] !== undefined) continue;
    const targets = formShiftTargets(content, mon).filter((t) => content.species.get(t)?.form?.region === region);
    if (targets.length > 0) offers.push({ uid: mon.uid, speciesId: mon.speciesId, targets });
  }
  return offers;
}

/** The prompt text for one offer. */
export function regionFormPrompt(content: Content, run: Pick<RunState, 'regionOrder' | 'regionIndex'>, offer: RegionFormOffer): string {
  const region = run.regionOrder[run.regionIndex] ?? '';
  const name = getSpecies(content, offer.speciesId).name;
  return `${name} ${LINES[region] ?? `likes it in ${content.regions.get(region)?.name ?? region}. Want it to take the local form?`}`;
}

/** Records the answer (target = null declines) and applies the form. Mutates the run; returns the message. */
export function answerRegionForm(content: Content, run: RunState, uid: string, target: string | null): string {
  const mon = run.party.find((m) => m.uid === uid);
  if (!mon) throw new Error('Choose a Pokémon');
  const offer = regionFormOffers(content, run).find((o) => o.uid === uid);
  if (!offer) throw new Error('No form offer for that Pokémon');
  run.story.flags[flagOf(run, uid)] = target ?? 'declined';
  if (target === null) return `${getSpecies(content, mon.speciesId).name} stays as it is.`;
  if (!offer.targets.includes(target)) throw new Error('That Pokémon has no such form here.');
  const from = getSpecies(content, mon.speciesId).name;
  return `${from} shifted into ${switchForm(content, run, mon, target).name}!`;
}
