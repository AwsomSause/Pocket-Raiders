// Catalog Overhaul SF13 / SF18: words and event ids that depend on the region's Evil Team at the moment a scene plays.
// Shared scenes (the Hideout rooms, the Operation variety pool) are written once with tokens: {team}, {front}, {grunt},
// {lt} (the lieutenant), {colleague}, {boss}, plus {starter} and {lead} for the player's Pokémon. Pure: no RNG.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';

const TOKEN = /\{(team|teamId|front|grunt|lt|colleague|boss|starter|lead)\}/g;

const speciesName = (content: Content, id: string | undefined): string | null => (id ? (content.species.get(id)?.name ?? null) : null);

/** The token values for this run right now (a token with no value yet is left out, so the text keeps its fallback). */
export function eventTokens(content: Content, run: Pick<RunState, 'story' | 'party' | 'log'>): Record<string, string> {
  const words: Record<string, string> = {};
  const team = content.evilTeams.teams.find((t) => t.id === run.story.evil?.teamId);
  if (team) Object.assign(words, { team: team.name, teamId: team.id, front: team.front, grunt: team.ranks.grunt.name, lt: team.ranks.executive.name, colleague: team.ranks.specialist.name, boss: team.ranks.leader.name });
  const starter = run.party.find((m) => m.uid === run.log?.starterUid) ?? run.party[0];
  const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
  const s = speciesName(content, starter?.speciesId);
  const l = lead?.care?.nickname ?? speciesName(content, lead?.speciesId);
  if (s) words.starter = s;
  if (l) words.lead = l;
  return words;
}

const FALLBACK: Record<string, string> = { team: 'the team', front: 'the front company', grunt: 'Grunt', lt: 'the lieutenant', colleague: 'their colleague', boss: 'the boss', starter: 'partner', lead: 'lead Pokémon' };

/** A line with the tokens filled in. Text without a token comes back untouched (the common case). */
export function fillEventText(content: Content, run: Pick<RunState, 'story' | 'party' | 'log'>, text: string): string {
  if (!text.includes('{')) return text;
  const words = eventTokens(content, run);
  return text.replace(TOKEN, (all, key: string) => words[key] ?? FALLBACK[key] ?? all);
}

/** An event id that names the region's team (`evil-{teamId}-hideout-boss`), for `addEvent`. Null when it has a token and no team is active. */
export function resolveEventId(run: Pick<RunState, 'story'>, id: string): string | null {
  if (!id.includes('{teamId}')) return id;
  const team = run.story.evil?.teamId;
  return team ? id.replaceAll('{teamId}', team) : null;
}
