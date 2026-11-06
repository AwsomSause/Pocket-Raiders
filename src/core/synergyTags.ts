// Team Synergy Tags (ideas S65): a party built around one plan earns a tag, and the tag's lift for the lead at the
// start of every battle. Read from the party only, so there is no save change.

import type { Content, TypeName } from './contentSchema';
import type { RunState } from './state';
import type { StoryTriggerKind } from './story/schema';

export interface SynergyTag { id: string; name: string; trigger: StoryTriggerKind; lift: string; need: string }

type Member = { types: readonly TypeName[]; spe: number };

const countTypes = (team: Member[], types: TypeName[]) => team.filter((m) => m.types.some((t) => types.includes(t))).length;

const TAGS: (SynergyTag & { has: (team: Member[]) => boolean })[] = [
  { id: 'sun', name: 'Sun Team', trigger: 'teamSun', lift: '+1 Sp. Atk', need: '3 Fire or Grass Pokémon, at least one Fire', has: (t) => countTypes(t, ['fire', 'grass']) >= 3 && countTypes(t, ['fire']) >= 1 },
  { id: 'rain', name: 'Rain Team', trigger: 'teamRain', lift: '+1 Speed', need: '3 Water or Electric Pokémon, at least one Water', has: (t) => countTypes(t, ['water', 'electric']) >= 3 && countTypes(t, ['water']) >= 1 },
  { id: 'sand', name: 'Sand Team', trigger: 'teamSand', lift: '+1 Defense', need: '3 Rock, Ground or Steel Pokémon', has: (t) => countTypes(t, ['rock', 'ground', 'steel']) >= 3 },
  { id: 'snow', name: 'Snow Team', trigger: 'teamSnow', lift: '+1 Sp. Def', need: '2 Ice Pokémon', has: (t) => countTypes(t, ['ice']) >= 2 },
  { id: 'trickRoom', name: 'Trick Room Team', trigger: 'teamTrickRoom', lift: '+1 Attack', need: '3 Pokémon with base Speed 50 or less', has: (t) => t.filter((m) => m.spe <= 50).length >= 3 },
];

/** The tags this party has right now (fainted Pokémon still count: it is the team you built). */
export function teamTags(content: Content, run: Pick<RunState, 'party'>): SynergyTag[] {
  const team: Member[] = run.party.flatMap((m) => {
    const s = content.species.get(m.speciesId);
    return s ? [{ types: s.types, spe: s.baseStats.spe }] : [];
  });
  return TAGS.filter((t) => t.has(team)).map(({ has: _has, ...tag }) => tag);
}

/** Every tag with what it needs, for the Bonds screen. */
export const ALL_TAGS: SynergyTag[] = TAGS.map(({ has: _has, ...tag }) => tag);
