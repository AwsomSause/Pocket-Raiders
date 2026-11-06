// The ending (M9): what the finale says about this run. Pure: reads a finished run, changes nothing, draws no random numbers.

import type { Content } from './contentSchema';
import type { RunState } from './state';
import { effectiveAttributes } from './attributes';
import { runStamps } from './recap';
import { memoryLines } from './overhaul/memories';

export type EndingId = 'storm' | 'untouched' | 'rivals' | 'champion';

/** Which ending a won run earns: the first that applies, from the rarest. */
export function endingFor(run: RunState): EndingId {
  if (run.story.flags['ge:won']) return 'storm';
  if (runStamps(run).includes('Untouched')) return 'untouched';
  if (run.story.rivals.some((r) => r.state === 'ally' || r.state === 'contender')) return 'rivals';
  return 'champion';
}

/** The epilogue lines for the victory screen and the credits (empty for a run that was not won). */
export function buildEpilogue(content: Content, run: RunState): string[] {
  if (!run.victory) return [];
  const grand = content.regions.get('grand')?.name ?? 'the Grand Region';
  const storm = content.story.grandEnemy.name;
  const lines: Record<EndingId, string> = {
    storm: `${storm} was turned back for good, and the skies over ${grand} cleared.`,
    untouched: `Not one of your Pokémon fell on the road to the top of ${grand}. Legends will say it could not be done.`,
    rivals: `Your rivals were there at the end of ${grand}, and for once nobody wanted to fight.`,
    champion: `You stand at the top of ${grand}: the last champion, and the first of a new age.`,
  };
  const out = [lines[endingFor(run)]];
  // W10 (I437): the road you took is remembered: kindness, cruelty, and the small promises you kept.
  const f = run.story.flags;
  const good = effectiveAttributes(content, run).goodEvil ?? 0;
  if (good >= 5) out.push('People along the road still tell stories of your kindness.');
  else if (good <= -5) out.push('People along the road still speak of you in low voices.');
  if (Number(f['ev:charity'] ?? 0) > 0) out.push('The orphanage ledger keeps your name at the top of its page.');
  if (Number(f['ev:oath-steel'] ?? 0) > 0 || Number(f['ev:oath-mercy'] ?? 0) > 0) out.push('The shrine keeper marks your oath as kept.');
  if (Number(f['ev:umbrella-friend'] ?? 0) > 0) out.push('Somewhere, a stranger remembers the umbrella you shared.');
  out.push(...endingVariationLines(content, run), ...secretEndingLines(run), ...factionLines(run), ...memoryLines(content, run));
  return out;
}

/** Ending Variations (S120): extra lines from the team you built, the bonds you made and the choices you kept. Pure. */
export function endingVariationLines(content: Content, run: RunState): string[] {
  const out: string[] = [];
  const mons = run.party;
  if (mons.length === 0) return out;
  const typesOf = (id: string): string[] => content.species.get(id)?.types ?? [];
  const shared = typesOf(mons[0]!.speciesId).filter((t) => mons.every((m) => typesOf(m.speciesId).includes(t)));
  if (mons.length >= 4 && shared.length > 0) out.push(`Your whole team stood in one colour, ${shared[0]}, and the crowd chanted it back.`);
  else if (new Set(mons.flatMap((m) => typesOf(m.speciesId))).size >= 10) out.push('A team of every kind of Pokémon: the commentators ran out of words for it.');
  const close = mons.filter((m) => m.friendship >= 200).length;
  if (close >= Math.min(3, mons.length)) out.push('Your Pokémon would not leave your side after the final bell. Nobody tried to make them.');
  else if (mons.every((m) => m.friendship < 70) && mons.length >= 3) out.push('Your team won, but the victory felt quiet. There is still a friendship to be made.');
  if (mons.length === 1) out.push('One Pokémon, one road, one trophy. A legend of its own kind.');
  return out;
}

/** Secret Ending Hunts (S122): obscure conditions unlock hidden finales. A hidden ending replaces nothing; it adds its own line. Pure. */
export function secretEndingLines(run: RunState): string[] {
  const f = run.story.flags;
  const out: string[] = [];
  if (Number(f['ev:oath-steel'] ?? 0) > 0 && Number(f['ev:oath-mercy'] ?? 0) > 0) out.push('SECRET ENDING, The Two Oaths: the shrine keeper bows. Steel and mercy, both kept.');
  if (Number(f['ev:charity'] ?? 0) > 0 && Number(f['ev:umbrella-friend'] ?? 0) > 0 && Number(f['ev:mystery-solved'] ?? 0) > 0) out.push('SECRET ENDING, The Quiet Hero: a stranger you helped left a lantern lit for you at the gate.');
  if (Number(f['ev:betrayal-forgiven'] ?? 0) > 0) out.push('SECRET ENDING, A Second Chance: someone who once betrayed you stands in the crowd, and nods.');
  return out;
}

const FACTIONS: Array<[string, string]> = [['rangers', 'The Rangers'], ['scholars', 'The Scholars'], ['syndicate', 'The Syndicate']];

/** Reputation Factions (S114): standing with each crew, 0 to 3+ (event flags `rep-<crew>`). */
export const factionStanding = (run: RunState, key: string): number => Number(run.story.flags[`ev:rep-${key}`] ?? 0);

/** Epilogue lines for the crews that took notice of you. Pure. */
export function factionLines(run: RunState): string[] {
  return FACTIONS.filter(([k]) => factionStanding(run, k) >= 2).map(([k, name]) => `${name} count you as one of their own${factionStanding(run, k) >= 3 ? ' and keep a seat free for you' : ''}.`);
}
