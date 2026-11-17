// Greenneedle gn.32, the Crystal Caverns: the crystals the player carries through the stage, and the Crystal Golem that reads them.
// A crystal works while carried, this stage only: Red (one Pokémon's own-type moves +10%) and Blue (one Pokémon's second type
// changed) sit on that Pokémon as `crystal`, and leaving the stage takes them off (`endCrystals`, called by leavePseudoStage).
// Green evolves a Pokémon for good. The bag holds six. The Golem takes the type of the colour carried most (none or a tie: plain Rock).
import { TYPE_NAMES, type Content, type TypeName } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { getSpecies } from '../pokemon';
import { evolve } from '../evolution';

export const CRYSTAL_CHAIN = 'ps_gn_crystal';
export const COLOURS = ['red', 'blue', 'green', 'white', 'black'] as const;
export type Colour = (typeof COLOURS)[number];
export const BAG_MAX = 6;
/** The Golem's second type for each colour it reads. */
export const GOLEM_TYPE: Record<Colour, TypeName> = { red: 'fire', blue: 'water', green: 'grass', white: 'fairy', black: 'dark' };

const flagOf = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const setFlag = (run: RunState, key: string, n: number): void => {
  run.story.flags[`ev:${key}`] = n;
};
const isColour = (k: string | undefined): k is Colour => (COLOURS as readonly string[]).includes(k ?? '');

/** How many crystals are in the bag. */
export function bagCount(run: RunState): number {
  return COLOURS.reduce((sum, c) => sum + flagOf(run, `crystal-${c}`), 0);
}

/** The colour carried most (1 red ... 5 black), or 0 for none or a tie. */
export function mostCarried(run: RunState): number {
  const counts = COLOURS.map((c) => flagOf(run, `crystal-${c}`));
  const top = Math.max(...counts);
  if (top <= 0 || counts.filter((n) => n === top).length > 1) return 0;
  return counts.indexOf(top) + 1;
}

/**
 * A crystal picked up (or dropped). `picked`: the Pokémon chosen for a Red or Blue crystal, or the one a Green crystal evolves.
 * Returns the line to show.
 */
export function crystalOp(content: Content, run: RunState, op: 'crystal' | 'crystalDrop' | 'crystalMost', colour: string | undefined, type: string | undefined, picked: PokemonInstance | undefined): string {
  if (op === 'crystalMost') {
    setFlag(run, 'crystal-most', mostCarried(run));
    return '';
  }
  if (!isColour(colour)) return '';
  if (op === 'crystalDrop') {
    if (flagOf(run, `crystal-${colour}`) <= 0) return '';
    setFlag(run, `crystal-${colour}`, flagOf(run, `crystal-${colour}`) - 1);
    // The last Red or Blue crystal dropped takes its effect off the Pokémon it was on.
    if (flagOf(run, `crystal-${colour}`) === 0) for (const m of run.party) if (m.crystal) dropFrom(m, colour);
    setFlag(run, 'crystal-bag', bagCount(run));
    return `You set the ${colour} crystal down on the cave floor.`;
  }
  if (colour === 'green' && type === 'use') {
    // A Green crystal that was carried, used later: it leaves the bag only if the Pokémon can change.
    if (!picked || flagOf(run, 'crystal-green') <= 0) return '';
    const sp = getSpecies(content, picked.speciesId);
    const to = sp.evolutions.map((e) => e.to).find((id) => content.species.has(id));
    if (!to) return `${sp.name} holds the crystal, and nothing happens. It goes back in the bag.`;
    evolve(content, picked, to);
    setFlag(run, 'crystal-green', flagOf(run, 'crystal-green') - 1);
    setFlag(run, 'crystal-bag', bagCount(run));
    setFlag(run, 'crystal-green-used', 1);
    return `${sp.name} evolved into ${getSpecies(content, to).name}! The crystal goes dark.`;
  }
  if (bagCount(run) >= BAG_MAX) return 'Your bag is full. Six is all it holds.';
  if (colour === 'green' && picked) {
    // Green: the evolution is for good, and the crystal is used up.
    const sp = getSpecies(content, picked.speciesId);
    const to = sp.evolutions.map((e) => e.to).find((id) => content.species.has(id));
    if (!to) return `${sp.name} holds the crystal, and nothing happens. It goes back in the bag.`;
    evolve(content, picked, to);
    setFlag(run, 'crystal-green-used', 1);
    return `${sp.name} evolved into ${getSpecies(content, to).name}! The crystal goes dark.`;
  }
  setFlag(run, `crystal-${colour}`, flagOf(run, `crystal-${colour}`) + 1);
  setFlag(run, 'crystal-bag', bagCount(run));
  if (colour === 'red' && picked) {
    picked.crystal = { ...picked.crystal, red: true };
    return `The Red crystal warms in ${getSpecies(content, picked.speciesId).name}'s keeping.`;
  }
  if (colour === 'blue' && picked && type && (TYPE_NAMES as readonly string[]).includes(type)) {
    picked.crystal = { ...picked.crystal, blue: type as TypeName };
    return `${getSpecies(content, picked.speciesId).name} is part ${type[0]!.toUpperCase()}${type.slice(1)} while the crystal is carried.`;
  }
  return '';
}

function dropFrom(mon: PokemonInstance, colour: Colour): void {
  if (colour === 'red') delete mon.crystal!.red;
  if (colour === 'blue') delete mon.crystal!.blue;
  if (!mon.crystal!.red && !mon.crystal!.blue) delete mon.crystal;
}

/** Leaving the caverns: every carried crystal's effect ends (a Green crystal already used stays used). */
export function endCrystals(run: RunState): void {
  if (run.stage?.pseudo?.id !== CRYSTAL_CHAIN) return;
  for (const m of [...run.party, ...run.box]) delete m.crystal;
  for (const c of COLOURS) if (flagOf(run, `crystal-${c}`) > 0) setFlag(run, `crystal-${c}`, 0);
  setFlag(run, 'crystal-bag', 0);
}

/** A Golem phase begins (battle rule `golem`): it takes the type of the colour read before the phase (`crystal-most`). */
export function golemStart(run: RunState, battle: BattleState): void {
  const colour = COLOURS[flagOf(run, 'crystal-most') - 1];
  const golem = battle.enemyTeam[0];
  if (!golem) return;
  battle.storyEffects.push(`golem:${colour ?? 'none'}`);
  if (!colour) return;
  battle.enemyVolatile.typeList = ['rock', GOLEM_TYPE[colour]];
  // Red: burns on contact.
  if (colour === 'red') golem.fixedAbility = 'flame-body';
}

/** The colour the Golem took this phase, or null. */
export function golemColour(battle: Pick<BattleState, 'storyEffects'>): Colour | null {
  const tag = battle.storyEffects.find((t) => t.startsWith('golem:'))?.slice('golem:'.length);
  return isColour(tag) ? tag : null;
}

/** Blue: a new second type each turn, taken in turn from the player's own team's types. */
export function golemBlueType(content: Content, party: PokemonInstance[], turn: number): TypeName {
  const types = [...new Set(party.flatMap((m) => getSpecies(content, m.speciesId).types))].filter((t) => t !== 'rock');
  return types.length ? types[turn % types.length]! : 'water';
}
