// What a Pokédex species page says (pure; drawn by `ui/dexInfo.ts`). Unmet species stay hidden.

import type { Content } from '../contentSchema';
import { maxResearchLevel, nextResearchGoal, researchLevelOf, tallyOf } from '../dexResearch';
import { pokemonHeightM } from '../heights';
import type { Profile } from '../state';

export type DexState = 'unknown' | 'seen' | 'caught';

export function dexState(profile: Pick<Profile, 'speciesSeen' | 'speciesCaught'>, speciesId: string): DexState {
  if (profile.speciesCaught.includes(speciesId)) return 'caught';
  return profile.speciesSeen.includes(speciesId) ? 'seen' : 'unknown';
}

export interface DexPage {
  state: DexState;
  title: string;
  types: string;
  stats: string[];
  note: string;
  /** Species research (S497): level and what the next level needs. Empty until the species is met. */
  research: string;
}

const STATS = [['hp', 'HP'], ['atk', 'Atk'], ['def', 'Def'], ['spa', 'SpA'], ['spd', 'SpD'], ['spe', 'Spe']] as const;

export function dexPage(content: Content, profile: Pick<Profile, 'speciesSeen' | 'speciesCaught'> & Partial<Pick<Profile, 'dexResearch'>>, speciesId: string): DexPage {
  const sp = content.species.get(speciesId);
  if (!sp) throw new Error(`Unknown species "${speciesId}"`);
  const state = dexState(profile, speciesId);
  const no = `No. ${String(sp.dex).padStart(4, '0')}`;
  if (state === 'unknown') return { state, title: `${no}  ???`, types: '???', stats: [], note: 'Not met yet. Meet it in a run to fill this page.', research: '' };
  const types = sp.types.map((t) => `${t[0]!.toUpperCase()}${t.slice(1)}`).join(' / ');
  const total = STATS.reduce((n, [k]) => n + sp.baseStats[k], 0);
  return {
    state,
    title: `${no}  ${sp.name}`,
    types,
    stats: [...STATS.map(([k, label]) => `${label} ${sp.baseStats[k]}`), `Total ${total}`],
    note: state === 'caught' ? 'You have caught this Pokémon.' : 'Met, not caught yet.',
    research: researchLine(profile, speciesId),
  };
}

function researchLine(profile: Partial<Pick<Profile, 'dexResearch'>>, speciesId: string): string {
  const t = tallyOf(profile, speciesId);
  const level = researchLevelOf(t);
  const goal = nextResearchGoal(t);
  return `Research level ${level} of ${maxResearchLevel()}${goal ? ` · Next: ${goal}` : ' · Perfect!'}`;
}

/** The Pokédex "Data" page (Pokedex Data Page pack idea): abilities, breeding, evolutions and the level-up moves. */
export interface DexDataPage {
  state: DexState;
  title: string;
  /** Short labelled facts, one per line. */
  facts: string[];
  /** How it evolves, one line per way (empty for a final form). */
  evolutions: string[];
  /** Level-up moves ("Lv 12  Vine Whip"). */
  moves: string[];
}

/** A share as a percentage with at most one decimal, so 87.5 and 12.5 still add up to 100. */
const pct = (x: number): number => Math.round(x * 1000) / 10;
const title = (s: string): string => s.split('-').map((w) => `${w[0]!.toUpperCase()}${w.slice(1)}`).join(' ');

export function dexDataPage(content: Content, profile: Pick<Profile, 'speciesSeen' | 'speciesCaught'>, speciesId: string): DexDataPage {
  const sp = content.species.get(speciesId);
  if (!sp) throw new Error(`Unknown species "${speciesId}"`);
  const state = dexState(profile, speciesId);
  const no = `No. ${String(sp.dex).padStart(4, '0')}`;
  if (state === 'unknown') return { state, title: `${no}  ???`, facts: [], evolutions: [], moves: [] };
  const abilityName = (id: string): string => content.abilities.get(id)?.name ?? title(id);
  const hidden = sp.abilities.hidden;
  const female = sp.femaleRatio;
  const facts = [
    `Abilities: ${sp.abilities.normal.map(abilityName).join(', ')}`,
    `Hidden ability: ${hidden ? (state === 'caught' ? abilityName(hidden) : '???') : 'none'}`,
    `Egg groups: ${sp.eggGroups.length ? sp.eggGroups.map(title).join(', ') : 'none'}`,
    `Gender: ${female === null || female === undefined ? 'unknown' : female === 0 ? 'male only' : female === 1 ? 'female only' : `${pct(1 - female)}% male, ${pct(female)}% female`}`,
    `Weight: ${sp.weight} kg`,
    `Catch rate: ${sp.catchRate}`,
    `Growth: ${title(sp.growthRate)}`,
  ];
  const evolutions = sp.evolutions.map((e) => {
    const how = [e.level ? `Lv ${e.level}` : '', e.item ? title(e.item) : '', e.condition ? title(String(e.condition)) : '', e.region ? `in ${title(e.region)}` : ''].filter(Boolean).join(', ');
    return `${content.species.get(e.to)?.name ?? title(e.to)}${how ? ` (${how})` : ''}`;
  });
  const moves = sp.learnset.slice(0, 14).map((e) => `Lv ${String(e.level).padStart(2, ' ')}  ${content.moves.get(e.move)?.name ?? title(e.move)}`);
  return { state, title: `${no}  ${sp.name}`, facts, evolutions, moves };
}

/** The New UI's species page (the mock-ups' `dex` page): the same facts as `dexPage`, in parts a layout can place. */
export interface DexCard {
  state: DexState;
  /** "No. 0006". */
  no: string;
  /** '???' until the species is met. */
  name: string;
  types: string[];
  /** Height, Weight, Caught, Battles. Empty until met. */
  facts: [string, string][];
  /** Caught or only met, then the research line. */
  note: string;
  stats: { label: string; value: number }[];
  /** The evolution line, first form first. `met` is false for a form the player has not met (drawn as a shadow). */
  line: { id: string; here: boolean; met: boolean }[];
  /** How the line goes on from here ("Charizard (Lv 36)"), or 'Final form'. '' until met. */
  next: string;
}

const LINE_MAX = 5;

export function dexCard(content: Content, profile: Pick<Profile, 'speciesSeen' | 'speciesCaught'> & Partial<Pick<Profile, 'dexResearch'>>, speciesId: string): DexCard {
  const page = dexPage(content, profile, speciesId);
  const sp = content.species.get(speciesId)!;
  const no = `No. ${String(sp.dex).padStart(4, '0')}`;
  if (page.state === 'unknown') return { state: 'unknown', no, name: '???', types: [], facts: [], note: page.note, stats: [], line: [], next: '' };
  const t = tallyOf(profile, speciesId);
  // Up to the first form (a loop in the data must not hang the page), then down while there is one way on.
  const up: string[] = [];
  for (let at = sp.evolvesFrom, guard = 0; at && content.species.has(at) && !up.includes(at) && guard < 4; at = content.species.get(at)!.evolvesFrom, guard++) up.unshift(at);
  const down: string[] = [];
  if (sp.evolutions.length > 1) down.push(...sp.evolutions.map((e) => e.to));
  else for (let at = sp.evolutions[0]?.to; at && content.species.has(at) && !down.includes(at) && at !== speciesId; at = content.species.get(at)!.evolutions[0]?.to) down.push(at);
  const ids = [...up, speciesId, ...down.filter((id) => content.species.has(id))].slice(0, LINE_MAX);
  if (!ids.includes(speciesId)) ids[ids.length - 1] = speciesId;
  const ways = dexDataPage(content, profile, speciesId).evolutions;
  return {
    state: page.state,
    no,
    name: sp.name,
    types: [...sp.types],
    facts: [['Height', `${pokemonHeightM(sp)} m`], ['Weight', sp.weight === undefined ? '?' : `${sp.weight} kg`], ['Caught', String(t.caught)], ['Battles', String(t.seen)]],
    note: page.research ? `${page.note} ${page.research}` : page.note,
    stats: STATS.map(([k, label]) => ({ label, value: sp.baseStats[k] })),
    line: ids.map((id) => ({ id, here: id === speciesId, met: dexState(profile, id) !== 'unknown' })),
    next: ways.length ? `Evolves into ${ways.join(', ')}` : 'Final form',
  };
}
