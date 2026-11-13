// Where a first-rival character comes from (its starters) and its signature Pokémon (src/data/rivalHome.json).
import home from '../../data/rivalHome.json';
import major from '../../data/majorRivals.json';

interface Signature { species: string; firstFightOnly: boolean }
const starters = home.regionStarters as Record<string, string[]>;
const signatures = home.signature as Record<string, Signature>;
const homes = (major.characters as Record<string, { home: string }>);

/** The three starters of the region this character comes from, or null for an unknown name. */
export const homeStarters = (name: string): string[] | null => starters[homes[name]?.home ?? ''] ?? null;
/** The Pokémon this character always has, or null. */
export const signatureOf = (name: string): Signature | null => signatures[name] ?? null;

/** Beta 0.6 B3: every starter line's first stage plus each rival's signature Pokémon. Ordinary trainers never field these. */
export const reservedTrainerSpecies: ReadonlySet<string> = new Set([...Object.values(starters).flat(), ...Object.values(signatures).map((x) => x.species)]);
