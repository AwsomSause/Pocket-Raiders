// Jet Pokédex batch 5 abilities (the 122 new ones that came with dex 63-207, see
// docs/status/jet-abilities.md). The pack's description is the rule. The simple
// parts sit in the shared tables in abilities.ts (weather and terrain setters,
// weather Speed, absorbs, status immunities, drop guards, flag boosts); this file
// holds the rest as data plus small pure helpers that the engine calls, and
// jetHooks.ts runs the parts that change the battle (entry, after a hit, end of turn).
//
// "May" with no number is 30%, the same as Static or Poison Touch.

import type { Move, TypeName, Weather } from '../contentSchema';

/** Every Jet batch 5 ability the engine runs (abilities.ts marks them supported). */
export const JET_ABILITIES: readonly string[] = [
  'bladed-plumage', 'terror-hood', 'drill-armor', 'queen-s-guard', 'toxic-rampage', 'foxfire-veil', 'dream-chorus', 'rot-bloom',
  'mycelium-network', 'fungal-dominion', 'mesmer-scales', 'regal-poise', 'blazing-mane', 'sun-sovereign', 'torrent-fists', 'bedrock-body',
  'solar-hooves', 'corona-crown', 'iai-stance', 'polar-tusk', 'aurora-body', 'lure-tongue', 'permafrost', 'dream-walker', 'hypnotic-gaze',
  'steel-knuckles', 'deep-pressure', 'jaws-of-the-deep', 'orbital-charge', 'withering', 'bone-collector', 'soulfire-runes', 'smog-furnace',
  'guardian-angel', 'reef-crown', 'venom-spines', 'tidal-crown', 'royal-plumes', 'last-laugh', 'silent-stage', 'barrier-shield',
  'frozen-throne', 'stampede', 'ancient-reaper', 'snowpack', 'living-mountain', 'eternal-winter', 'storm-sovereign', 'undying-flame',
  'psyche-edge', 'genesis-aura', 'coil-spring', 'tunnel-rush', 'starlight-knuckles', 'constellation-fists', 'lantern-lure', 'spirit-brood',
  'sonic-echo', 'deep-glow', 'inspiration', 'starlight-muse', 'all-seeing-eye', 'foresight-plumes', 'petal-waltz', 'royal-chorus',
  'pollen-breeze', 'cotton-cloud', 'sunflower-heart', 'high-noon', 'drake-wings', 'hyperbuzz', 'mossback', 'living-island', 'omen-feathers',
  'cursed-sigils', 'kingpin', 'mournful-song', 'requiem', 'living-script', 'orbiting-runes', 'battlements', 'siege-engine', 'sand-stinger',
  'sandstorm-shell', 'edge-glider', 'blade-storm', 'vampire-fangs', 'command-bark', 'iron-jaw', 'abyssal-spines', 'crystal-spines',
  'fermented-shell', 'living-hillside', 'frost-phantom', 'whiteout', 'eruption-core', 'glacier-hide', 'living-atoll', 'armored-shell',
  'full-broadside', 'abyss-ink', 'kraken-s-grip', 'frozen-present', 'crystal-plumage', 'warm-hearth', 'festival-flame', 'runner-blades',
  'downhill-run', 'three-heads', 'tread-armor', 'ghostlight-antlers', 'spirit-lantern', 'living-canvas', 'masterstroke', 'cyclone-spin',
  'heart-of-the-herd', 'thunderclap', 'volcanic-mane', 'purifying-aurora', 'deep-sea-tempest', 'rainbow-wings', 'season-cycle',
];

// ---------- move groups the descriptions name ----------

/** Groups of moves the descriptions name. Most come from move flags; the rest are listed by id. */
export type MoveGroup = 'slicing' | 'beak' | 'sound' | 'punch' | 'bite' | 'pulse' | 'dance' | 'bone' | 'kickSpin' | 'fireBreath' | 'contact' | 'recoil' | 'powder';

const SLICING_EXTRA = new Set(['leek-katana', 'fossil-scythe', 'razor-glide', 'scythe-wings', 'psyblade-rush', 'whiteout-slash', 'daish-strike']);
const PULSE_EXTRA = new Set(['broadside', 'barrel-barrage']);
const BEAK = new Set(['peck', 'drill-peck', 'pluck', 'beak-blast', 'drill-gale', 'imperial-plunge']);
const BONE = new Set(['bone-club', 'bonemerang', 'bone-rush', 'shadow-bone', 'ossuary-crush', 'soulfire-bone']);
const DANCE = new Set(['swords-dance', 'dragon-dance', 'quiver-dance', 'feather-dance', 'petal-dance', 'teeter-dance', 'lunar-dance', 'fiery-dance', 'revelation-dance', 'victory-dance', 'aqua-step', 'clangorous-soul', 'blossom-waltz']);
const KICK_SPIN = new Set(['rapid-spin', 'gyro-ball', 'spin-out', 'mortal-spin', 'ice-spinner', 'triple-axel', 'drill-run', 'stomp', 'flying-press']);
const FIRE_BREATH = new Set(['ember', 'flamethrower', 'fire-blast', 'heat-wave', 'inferno', 'overheat', 'fire-spin', 'dragon-breath', 'incinerate', 'mystical-fire', 'torch-song', 'burning-jealousy', 'smokestack-blast', 'ninefold-flame', 'phoenix-flare']);

export function inGroup(move: Pick<Move, 'id' | 'flags' | 'effects'>, group: MoveGroup): boolean {
  const flags = move.flags as readonly string[];
  switch (group) {
    case 'slicing': return flags.includes('slicing') || SLICING_EXTRA.has(move.id);
    case 'pulse': return flags.includes('pulse') || PULSE_EXTRA.has(move.id);
    case 'sound': case 'punch': case 'bite': case 'contact': case 'powder': return flags.includes(group);
    case 'beak': return BEAK.has(move.id);
    case 'bone': return BONE.has(move.id) || move.id.includes('bone');
    case 'dance': return DANCE.has(move.id);
    case 'kickSpin': return KICK_SPIN.has(move.id) || move.id.includes('kick') || move.id.includes('spin');
    case 'fireBreath': return FIRE_BREATH.has(move.id);
    case 'recoil': return Boolean(move.effects.recoil);
  }
}

/** Moves that put the target to sleep or confuse it (Hypnotic Gaze). */
export function causesSleepOrConfusion(move: Pick<Move, 'effects'>): boolean {
  return move.effects.status?.id === 'slp' || Boolean(move.effects.confuse) || Boolean(move.effects.drowsy);
}

// ---------- power ----------

type When = 'targetPoisoned' | 'targetJustIn' | 'targetShielded';
interface PowerRule { mult: number; types?: TypeName[]; groups?: MoveGroup[]; weather?: Weather[]; when?: When }

const SNOW: Weather[] = ['snow', 'hail'];

/** The user's moves are this much stronger (all listed rules that match multiply). */
export const JET_POWER: Record<string, PowerRule[]> = {
  'bladed-plumage': [{ mult: 1.3, groups: ['slicing', 'beak'] }],
  'drill-armor': [{ mult: 1.2, types: ['ground', 'steel'] }],
  'toxic-rampage': [{ mult: 1.3, when: 'targetPoisoned' }],
  'dream-chorus': [{ mult: 1.3, groups: ['sound'] }],
  'blazing-mane': [{ mult: 1.2, types: ['fire'] }],
  'sun-sovereign': [{ mult: 1.2, types: ['fire'] }],
  'torrent-fists': [{ mult: 1.3, groups: ['punch'] }],
  'corona-crown': [{ mult: 1.3, types: ['psychic', 'fire'], weather: ['sun'] }],
  'iai-stance': [{ mult: 1.3, groups: ['slicing'] }],
  'polar-tusk': [{ mult: 1.3, types: ['ice'] }],
  'aurora-body': [{ mult: 1.2, types: ['ice', 'fairy'], weather: SNOW }],
  'steel-knuckles': [{ mult: 1.3, groups: ['punch'] }],
  'deep-pressure': [{ mult: 1.3, when: 'targetJustIn' }],
  'bone-collector': [{ mult: 1.3, groups: ['bone'] }],
  'tidal-crown': [{ mult: 1.2, types: ['water'], weather: ['rain'] }],
  stampede: [{ mult: 1.3, groups: ['recoil'] }],
  'ancient-reaper': [{ mult: 1.3, groups: ['slicing'] }],
  'storm-sovereign': [{ mult: 1.2, types: ['electric'] }],
  'psyche-edge': [{ mult: 1.5, groups: ['slicing'] }],
  'tunnel-rush': [{ mult: 1.3, types: ['ground'] }],
  'starlight-knuckles': [{ mult: 1.2, groups: ['punch'] }],
  'constellation-fists': [{ mult: 1.3, groups: ['punch'] }],
  'sonic-echo': [{ mult: 1.3, groups: ['sound'] }],
  'petal-waltz': [{ mult: 1.5, groups: ['dance'] }],
  'royal-chorus': [{ mult: 1.3, groups: ['sound'] }],
  'pollen-breeze': [{ mult: 1.2, types: ['fairy'] }],
  'drake-wings': [{ mult: 1.2, types: ['bug', 'dragon'] }],
  hyperbuzz: [{ mult: 1.2, groups: ['sound'] }],
  requiem: [{ mult: 1.3, groups: ['sound'] }],
  'orbiting-runes': [{ mult: 1.2, types: ['rock'] }],
  'siege-engine': [{ mult: 1.5, when: 'targetShielded' }],
  'sand-stinger': [{ mult: 1.3, weather: ['sand'] }],
  'crystal-spines': [{ mult: 1.2, types: ['dragon'] }],
  'frost-phantom': [{ mult: 1.2, types: ['ice'], weather: SNOW }],
  'eruption-core': [{ mult: 1.3, types: ['fire'] }],
  'armored-shell': [{ mult: 1.2, groups: ['pulse'] }],
  'full-broadside': [{ mult: 1.5, groups: ['pulse'] }],
  'festival-flame': [{ mult: 1.3, types: ['fire'] }],
  'downhill-run': [{ mult: 1.2, groups: ['contact'] }],
  'spirit-lantern': [{ mult: 1.2, types: ['ghost', 'psychic'] }],
  'cyclone-spin': [{ mult: 1.3, groups: ['kickSpin'] }],
  'volcanic-mane': [{ mult: 1.2, types: ['fire', 'ground'] }],
};

export interface PowerView {
  move: Pick<Move, 'id' | 'flags' | 'effects'>;
  moveType: TypeName;
  weather: Weather | null;
  targetPoisoned: boolean;
  /** The target came in this turn (it hasn't finished a turn out yet). */
  targetJustIn: boolean;
  /** Reflect, Light Screen or Aurora Veil on the target's side, or a Substitute up. */
  targetShielded: boolean;
  /** The user's fainted teammates (Kingpin). */
  fallenAllies: number;
}

/** The power multiplier the user's ability gives this move (1 when none). */
export function jetPowerMult(ability: string | null, v: PowerView): number {
  if (!ability) return 1;
  let m = 1;
  for (const r of JET_POWER[ability] ?? []) {
    if (r.types && !r.types.includes(v.moveType)) continue;
    if (r.groups && !r.groups.some((g) => inGroup(v.move, g))) continue;
    if (r.weather && !(v.weather && r.weather.includes(v.weather))) continue;
    if (r.when === 'targetPoisoned' && !v.targetPoisoned) continue;
    if (r.when === 'targetJustIn' && !v.targetJustIn) continue;
    if (r.when === 'targetShielded' && !v.targetShielded) continue;
    m *= r.mult;
  }
  // Kingpin: +0.2 for each fallen teammate, up to 1.6.
  if (ability === 'kingpin') m *= Math.min(1.6, 1 + 0.2 * v.fallenAllies);
  return m;
}

// ---------- damage taken ----------

interface GuardRule { mult: number; types?: TypeName[]; category?: 'physical' | 'special'; superEffective?: true; fullHp?: true; weather?: Weather[]; screens?: true; singleTarget?: true }

/** Damage the holder takes is multiplied by these (all matching rules multiply). */
export const JET_GUARD: Record<string, GuardRule[]> = {
  'queen-s-guard': [{ mult: 0.75, superEffective: true }],
  'bedrock-body': [{ mult: 0.5, category: 'physical', fullHp: true }],
  'aurora-body': [{ mult: 0.75, weather: SNOW }],
  permafrost: [{ mult: 0.5, types: ['fire'] }],
  withering: [{ mult: 0.5, types: ['grass'] }],
  'barrier-shield': [{ mult: 0.75, screens: true }],
  snowpack: [{ mult: 0.75, weather: SNOW }],
  'living-mountain': [{ mult: 0.5, superEffective: true, fullHp: true }],
  'lantern-lure': [{ mult: 0.75, singleTarget: true }],
  mossback: [{ mult: 0.5, types: ['grass', 'water'] }],
  'living-island': [{ mult: 0.5, types: ['water'] }],
  'orbiting-runes': [{ mult: 0.75, category: 'special' }],
  battlements: [{ mult: 0.75, category: 'physical' }],
  'sandstorm-shell': [{ mult: 0.75, weather: ['sand'] }],
  'living-hillside': [{ mult: 0.5, types: ['water', 'ground'] }],
  'glacier-hide': [{ mult: 0.5, types: ['fire', 'fighting'] }],
  'warm-hearth': [{ mult: 0.5, types: ['ice'] }],
  'deep-sea-tempest': [{ mult: 0.75, weather: ['rain'] }],
};

/** Abilities whose guard also covers the holder's partner in a double battle. */
export const JET_ALLY_GUARD = new Set(['queen-s-guard', 'warm-hearth']);

export interface GuardView {
  moveType: TypeName;
  physical: boolean;
  effectiveness: number;
  fullHp: boolean;
  weather: Weather | null;
  /** Reflect, Light Screen or Aurora Veil on the holder's side. */
  screens: boolean;
  /** The move hits only this Pokémon (every move in a single battle). */
  singleTarget: boolean;
}

export function jetGuardMult(ability: string | null, v: GuardView): number {
  if (!ability) return 1;
  let m = 1;
  for (const r of JET_GUARD[ability] ?? []) {
    if (r.types && !r.types.includes(v.moveType)) continue;
    if (r.category && (r.category === 'physical') !== v.physical) continue;
    if (r.superEffective && v.effectiveness <= 1) continue;
    if (r.fullHp && !v.fullHp) continue;
    if (r.weather && !(v.weather && r.weather.includes(v.weather))) continue;
    if (r.screens && !v.screens) continue;
    if (r.singleTarget && !v.singleTarget) continue;
    m *= r.mult;
  }
  return m;
}

/** Crystal Plumage: Defense and Sp. Def ×1.5 in snow. */
export function jetDefenseMult(ability: string | null, weather: Weather | null): number {
  return ability === 'crystal-plumage' && weather !== null && SNOW.includes(weather) ? 1.5 : 1;
}

// ---------- small yes/no rules ----------

/** Floats like Levitate: Ground moves miss it, and it is not grounded (hazards, terrain, Arena Trap). */
export const JET_FLOATERS = new Set(['royal-plumes', 'cotton-cloud']);

/** Move types the holder is immune to (Spirit Lantern). Levitating ones are in JET_FLOATERS. */
export const JET_TYPE_IMMUNE: Record<string, TypeName[]> = { 'spirit-lantern': ['normal', 'fighting'] };

/** Critical hits can't land on it. */
export const JET_NO_CRIT = new Set(['drill-armor', 'armored-shell', 'cyclone-spin']);

/** Entry hazards don't touch it. */
export const JET_HAZARD_PROOF = new Set(['cotton-cloud', 'runner-blades', 'tread-armor']);

/** Can't be forced to switch out (Roar, Dragon Tail, Red Card). */
export const JET_ANCHORED = new Set(['bedrock-body', 'tread-armor']);

/** Abilities that keep the holder from flinching (Regal Poise) or being confused (Ghostlight Antlers). */
export const JET_NO_FLINCH = new Set(['regal-poise']);
export const JET_NO_CONFUSION = new Set(['ghostlight-antlers']);

/** The user's move can't miss. */
export function jetSureHit(ability: string | null, move: Pick<Move, 'id' | 'flags' | 'effects'>, moveType: TypeName, weather: Weather | null): boolean {
  switch (ability) {
    case 'all-seeing-eye': return true;
    case 'mycelium-network': case 'fungal-dominion': return inGroup(move, 'powder');
    case 'hypnotic-gaze': return causesSleepOrConfusion(move);
    case 'bone-collector': return inGroup(move, 'bone');
    case 'solar-hooves': return weather === 'sun' && inGroup(move, 'contact');
    case 'eternal-winter': return moveType === 'ice' && weather !== null && SNOW.includes(weather);
    default: return false;
  }
}

/** Accuracy multiplier for moves aimed at the holder (Mesmer Scales). */
export function jetEvasionMult(foeAbility: string | null): number {
  return foeAbility === 'mesmer-scales' ? 0.8 : 1;
}

/** Extra priority from the user's ability. `firstMove`: nothing used since it came in; `slicedYet`: a slicing move already used since it came in. */
export function jetPriorityBonus(ability: string | null, move: Pick<Move, 'id' | 'flags' | 'effects' | 'category'>, s: { firstMove: boolean; slicedYet: boolean; fullHp: boolean }): number {
  switch (ability) {
    case 'coil-spring': case 'tunnel-rush': return s.firstMove ? 1 : 0;
    case 'iai-stance': return inGroup(move, 'slicing') && !s.slicedYet ? 1 : 0;
    case 'edge-glider': return inGroup(move, 'slicing') && s.fullHp ? 1 : 0;
    case 'foresight-plumes': return move.category === 'status' ? 1 : 0;
    default: return 0;
  }
}

/** Torrent Fists: Normal punches become Water. */
export function jetMoveType(ability: string | null, move: Pick<Move, 'id' | 'flags' | 'effects'>, type: TypeName): TypeName {
  if (ability === 'torrent-fists' && type === 'normal' && inGroup(move, 'punch') && !(move.flags as readonly string[]).includes('typeless')) return 'water';
  return type;
}

/** Requiem (sound) and Full Broadside (pulse): a single-target move hits every foe in a double battle. */
export function jetSpreads(ability: string | null, move: Pick<Move, 'id' | 'flags' | 'effects' | 'category'>): boolean {
  if (move.category === 'status') return false;
  return (ability === 'requiem' && inGroup(move, 'sound')) || (ability === 'full-broadside' && inGroup(move, 'pulse'));
}

/** Iron Jaw (bites) gets through Protect. */
export function jetPiercesProtect(ability: string | null, move: Pick<Move, 'id' | 'flags' | 'effects'>): boolean {
  return ability === 'iron-jaw' && inGroup(move, 'bite');
}

/** Sonic Echo's sound moves go past a Substitute (they already do in this game; kept for the rule's record). */
export function jetIgnoresSubstitute(ability: string | null, move: Pick<Move, 'id' | 'flags' | 'effects'>): boolean {
  return ability === 'sonic-echo' && inGroup(move, 'sound');
}

/** Three Heads: biting and fire-breathing moves that aren't already multi-hit strike three times, each at 40% power. */
export const THREE_HEADS = { hits: 3, power: 0.4 };
export function jetThreeHeads(ability: string | null, move: Pick<Move, 'id' | 'flags' | 'effects'>): boolean {
  return ability === 'three-heads' && !move.effects.hits && (inGroup(move, 'bite') || inGroup(move, 'fireBreath'));
}

/** Masterstroke: against two types, the move counts only the type it does best against. */
export function masterstrokeEffectiveness(single: number[]): number {
  return single.length > 1 ? Math.max(...single) : (single[0] ?? 1);
}

/** Season Cycle: every 4 turns its second type moves on: Spring (Grass), Summer (Fire), Fall (Ghost), Winter (Ice). */
export const SEASONS: { name: string; type: TypeName }[] = [
  { name: 'Spring', type: 'grass' },
  { name: 'Summer', type: 'fire' },
  { name: 'Fall', type: 'ghost' },
  { name: 'Winter', type: 'ice' },
];
export function seasonAt(turn: number): { name: string; type: TypeName } {
  return SEASONS[Math.floor(turn / 4) % 4]!;
}

/** End-of-turn healing (share of max HP) and when it applies. `allies`: its partner heals too; `selfToo: false`: only the partner. */
export const JET_TURN_HEAL: Record<string, { share: number; weather?: Weather[]; terrain?: 'grassy' | 'psychic'; rainOrPsychic?: true; berry?: true; allies?: true; selfToo?: false }> = {
  'mycelium-network': { share: 1 / 16 },
  'fungal-dominion': { share: 1 / 8 },
  'reef-crown': { share: 1 / 16, allies: true },
  snowpack: { share: 1 / 16, weather: SNOW },
  mossback: { share: 1 / 16, terrain: 'grassy' },
  'living-atoll': { share: 1 / 16, rainOrPsychic: true, allies: true },
  'heart-of-the-herd': { share: 1 / 16, allies: true, selfToo: false },
  'fermented-shell': { share: 1 / 8, berry: true },
};
