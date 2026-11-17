// Damian's Unofficial Gym (gn.05): the real Gym's reward is "Damian's ace's egg", so the ace he last sent out is remembered by species.
import type { Content } from '../contentSchema';
import type { RunState } from '../state';

const ACE_KEY = 'gn:damian-ace';

/** Called as a fight with Damian begins: the last Pokémon of his team is the one he actually trained. */
export function rememberAce(run: Pick<RunState, 'story'>, speciesId: string | undefined): void {
  if (speciesId) run.story.flags[ACE_KEY] = speciesId;
}

/** The species an egg of his ace hatches into (the first stage of its family), or undefined when he has not fought yet. */
export function aceEggSpecies(content: Content, run: Pick<RunState, 'story'>): string | undefined {
  const id = run.story.flags[ACE_KEY];
  let s = typeof id === 'string' ? content.species.get(id) : undefined;
  if (s?.form && s.form.kind !== 'regional' && s.form.kind !== 'alternate') s = content.species.get(s.form.base) ?? s;
  for (let guard = 0; s && s.evolutionStage > 1 && s.evolvesFrom && guard < 4; guard++) s = content.species.get(s.evolvesFrom) ?? s;
  return s?.id;
}
