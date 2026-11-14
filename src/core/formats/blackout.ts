// Wide format 2: Blackout (plan E4; Kanto Phase 1 "The Streets"). A curfew city under a violet Seal. Three anchors (a Mr. Mime
// holding a wall of light across a street) each fight one trainer battle. While the Seal holds, every fight has the Seal's
// rules: no voluntary switching on the first turn, and Psychic moves hit 10% harder for BOTH sides. The Seal breaks when two
// of the three anchors are beaten; that fight and every one after it have no Seal. If the Triad is active the third anchor
// is Oracle Sabrina and she must be beaten too (3 battles, else 2). A lost fight heals the party (story loss), the anchor
// stays up, and the player may try again. No RNG here; the battles use their own seeded stream (`format-battle`).
// Sabrina's executive ability "Foresight Tax" is the battle rule `foresight` (core/battle/foresight.ts): she sees your first chosen
// move each turn until one of her Pokémon faints.

import { markCheckpoint, markDone, climaxRegion } from './store';
import { launchFormatBattle } from './battle';
import type { FormatCard, FormatCtx, WideFormat } from './types';

export const SEAL = { noSwitchFirstTurn: true, typeBoost: { type: 'psychic' as const, pct: 10 } };
export const SEAL_BREAKS_AT = 2;

export interface Anchor {
  id: string;
  name: string;
  /** Where the anchor stands. */
  place: string;
  species: string[];
  size: number;
  beaten: boolean;
  sabrina?: boolean;
}

export type BlackoutRegion = 'sinnoh' | 'hoenn';

export interface BlackoutState {
  /** Absent = Kanto (older saves). */
  region?: BlackoutRegion;
  anchors: Anchor[];
  triad: boolean;
  /** The anchor whose fight is running right now. */
  pending: string | null;
  /** Fights lost so far (each healed the party; the anchor stays up). */
  losses: number;
}

/** Beta 0.7 E9: Sinnoh's White Tunnel and Hoenn's Crater Lake. Same shape as Kanto's streets: three fights, a condition that holds until two fall. */
interface RegionBlackout { title: string; intro: string; holds: string; broken: string; done: string; anchors: Omit<Anchor, 'beaten'>[]; classId: string; types: string[]; rule: NonNullable<Parameters<typeof launchFormatBattle>[3]['rule']>; weather?: 'hail'; bossName?: string }
const REGIONS: Record<BlackoutRegion, RegionBlackout> = {
  sinnoh: {
    title: 'The White Tunnel',
    intro: 'The climb through the mountain. Snow blows sideways down the shaft.',
    holds: 'While the Whiteout holds: hail, and accuracy is 10% lower for both sides. It ends at the upper mouth (two anchors fall), or at once if Friday lifts you above the snow.',
    broken: 'The Whiteout is over. The wind drops and the snow settles.',
    done: 'The upper mouth is open.',
    anchors: [
      { id: 'a1', place: 'the wayside camp', name: 'Galactic Scientist (anchor)', species: ['kadabra', 'chansey', 'bronzong'], size: 2 },
      { id: 'a2', place: 'the ice cut', name: 'Galactic Commander Grunt (anchor)', species: ['golbat', 'stunky', 'glameow', 'croagunk'], size: 2 },
      { id: 'a3', place: 'the midpoint, by a camp stove', name: 'Commander Sird', species: ['starmie', 'persian', 'banette'], size: 3, sabrina: true },
    ],
    classId: 'worker', types: ['ice'], rule: { accuracyMult: 0.9 }, weather: 'hail', bossName: 'Commander Sird',
  },
  hoenn: {
    title: 'The Crater Lake',
    intro: 'The lake crossing to the cave. Nobody can tell whether it is raining.',
    holds: 'While the Swing holds: the weather flips between rain and sun every two turns. It ends when two anchors fall, or at once if Forecast calls the weather before it turns.',
    broken: 'The Swing has stopped. The sky is only a sky again.',
    done: 'The cave mouth is open.',
    anchors: [
      { id: 'a1', place: 'a rowing boat (Aqua)', name: 'Aqua Grunt (anchor)', species: ['sharpedo', 'mightyena', 'carvanha'], size: 2 },
      { id: 'a2', place: 'a raft (Magma)', name: 'Magma Grunt (anchor)', species: ['camerupt', 'numel', 'mightyena'], size: 2 },
      { id: 'a3', place: 'the lakeside resonator', name: 'Resonator Guard (anchor)', species: ['golem', 'swalot', 'sableye'], size: 2 },
    ],
    classId: 'roughneck', types: ['water', 'fire'], rule: { weatherCycle: ['rain', 'rain', 'sun', 'sun'] },
  },
};
const evSet = (run: FormatCtx['run'], key: string): boolean => Number(run.story.flags[`ev:${key}`] ?? 0) >= 1;

const STREETS = [
  { id: 'a1', place: 'the Nugget Bridge crossing' },
  { id: 'a2', place: 'the Celadon Lane cordon' },
  { id: 'a3', place: 'the crossroads below Silph' },
];

export const beatenCount = (s: BlackoutState): number => s.anchors.filter((a) => a.beaten).length;
export const sealHolds = (s: BlackoutState): boolean => beatenCount(s) < SEAL_BREAKS_AT;
/** Over when the Seal is broken, and (with the Triad) Sabrina has fallen too. */
export const blackoutOver = (s: BlackoutState): boolean => beatenCount(s) >= SEAL_BREAKS_AT && (!s.triad || s.anchors.every((a) => !a.sabrina || a.beaten));

/** Anchors that can be faced now. With the Triad, Sabrina waits until the other two have fallen. */
function open(s: BlackoutState): Anchor[] {
  const rest = s.anchors.filter((a) => !a.beaten);
  const others = s.anchors.filter((a) => !a.sabrina);
  return rest.filter((a) => !a.sabrina || others.every((o) => o.beaten));
}

function setupRegion(region: BlackoutRegion, { content, run }: FormatCtx): BlackoutState {
  const cfg = REGIONS[region];
  const anchors: Anchor[] = cfg.anchors.map((a) => ({ ...a, species: a.species.filter((id) => content.species.has(id)), beaten: false }));
  // Hoenn: the lunch-break grunts row you across, so one battle is skipped.
  if (region === 'hoenn' && evSet(run, 'hoenn-truce-seed')) anchors[1]!.beaten = true;
  return { region, anchors, triad: region === 'sinnoh', pending: null, losses: 0 };
}

/** The region's condition holds while fewer than two anchors fell, unless a helper lifted it (Friday, Forecast). */
const lifted = (region: BlackoutRegion, run: FormatCtx['run']): boolean => (region === 'sinnoh' ? evSet(run, 'galactic-friday-lent') : evSet(run, 'hoenn-forecast-saved'));

function setup({ content, run }: FormatCtx, input?: unknown): BlackoutState {
  const asked = input && typeof input === 'object' && 'region' in input ? String((input as { region: unknown }).region) : '';
  const region = asked === 'sinnoh' || asked === 'hoenn' ? asked : climaxRegion(run) === 'sinnoh' || climaxRegion(run) === 'hoenn' ? (climaxRegion(run) as BlackoutRegion) : null;
  if (region) return setupRegion(region, { content, run });
  const triad = typeof input === 'object' && input && 'triad' in input ? Boolean((input as { triad: unknown }).triad) : Boolean(run.story.flags['rocket.x.triad']);
  const mime = ['mr-mime'].filter((id) => content.species.has(id));
  const sabrinaTeam = ['alakazam', 'mr-mime', 'hypno', 'kadabra'].filter((id) => content.species.has(id));
  const anchors: Anchor[] = STREETS.map((st, i) => {
    const sabrina = triad && i === 2;
    return {
      id: st.id,
      place: st.place,
      name: sabrina ? 'Oracle Sabrina' : 'Rocket Scientist (anchor)',
      species: sabrina ? sabrinaTeam : mime,
      size: sabrina ? 4 : 2,
      beaten: false,
      ...(sabrina ? { sabrina: true } : {}),
    };
  });
  return { anchors, triad, pending: null, losses: 0 };
}

function describe(s: BlackoutState, run?: FormatCtx['run']): FormatCard {
  if (s.region) return describeRegion(s, run);
  const left = s.anchors.filter((a) => !a.beaten);
  const sealed = sealHolds(s);
  const lines = [
    'Curfew. The shutters are down and a violet shimmer sits over the rooftops: the Seal.',
    sealed
      ? 'While the Seal holds: no switching on the first turn of a fight, and Psychic moves hit 10% harder for both sides. It breaks when two anchors fall.'
      : 'The Seal is broken. The streets are only streets again.',
    `Anchors beaten: ${s.anchors.filter((a) => a.beaten).length} of ${s.anchors.length}.${s.losses ? ` Fights lost: ${s.losses} (your team was healed each time).` : ''}`,
  ];
  if (blackoutOver(s)) return { title: 'The Streets', lines: [...lines, 'The way to the tower is open.'], options: [], over: true };
  const can = open(s);
  const options = left.map((a) => ({
    id: a.id,
    label: `${a.name} at ${a.place}`,
    enabled: can.some((c) => c.id === a.id),
    ...(can.some((c) => c.id === a.id) ? {} : { note: 'She waits for the others to fall.' }),
  }));
  return { title: 'The Streets', lines, options, over: false };
}

function describeRegion(s: BlackoutState, run?: FormatCtx['run']): FormatCard {
  const cfg = REGIONS[s.region!];
  const holds = sealHolds(s) && !(run && lifted(s.region!, run));
  const lines = [cfg.intro, holds ? cfg.holds : cfg.broken, `Anchors beaten: ${beatenCount(s)} of ${s.anchors.length}.${s.losses ? ` Fights lost: ${s.losses} (your team was healed each time).` : ''}`];
  if (blackoutOver(s)) return { title: cfg.title, lines: [...lines, cfg.done], options: [], over: true };
  const can = open(s);
  const options = s.anchors.filter((a) => !a.beaten).map((a) => ({ id: a.id, label: `${a.name} at ${a.place}`, enabled: can.some((c) => c.id === a.id), ...(can.some((c) => c.id === a.id) ? {} : { note: 'Waits for the others to fall.' }) }));
  return { title: cfg.title, lines, options, over: false };
}

function choose(s: BlackoutState, id: string, ctx: FormatCtx): BlackoutState {
  if (s.pending) return s;
  if (s.region) {
    const a = open(s).find((x) => x.id === id);
    if (!a) return s;
    const cfg = REGIONS[s.region];
    const on = sealHolds(s) && !lifted(s.region, ctx.run);
    const ok = launchFormatBattle(ctx.content, ctx.run, 'blackout', {
      key: a.id, name: a.name, classId: cfg.classId, types: cfg.types as never, species: a.species, size: a.size, levelBonus: a.sabrina ? 2 : 0,
      ...(on ? { rule: cfg.rule, ...(cfg.weather ? { weather: cfg.weather } : {}) } : { rule: {} }),
    });
    return ok ? { ...s, pending: a.id } : s;
  }
  const a = open(s).find((x) => x.id === id);
  if (!a) return s;
  const ok = launchFormatBattle(ctx.content, ctx.run, 'blackout', {
    key: a.id,
    name: a.name,
    classId: a.sabrina ? 'psychic' : 'worker',
    ...(a.sabrina ? { sprite: 'sabrina' } : {}),
    types: ['psychic'],
    species: a.species,
    size: a.size,
    levelBonus: a.sabrina ? 2 : 0,
    ...(sealHolds(s) || a.sabrina ? { rule: { ...(sealHolds(s) ? SEAL : {}), ...(a.sabrina ? { foresight: true } : {}) } } : {}),
  });
  return ok ? { ...s, pending: a.id } : s;
}

function onBattleEnd(s: BlackoutState, won: boolean, { run }: FormatCtx): BlackoutState {
  if (!s.pending) return s;
  const next: BlackoutState = won
    ? { ...s, pending: null, anchors: s.anchors.map((a) => (a.id === s.pending ? { ...a, beaten: true } : a)) }
    : { ...s, pending: null, losses: s.losses + 1 };
  if (blackoutOver(next)) {
    markDone(run, 'blackout');
    markCheckpoint(run, 'blackout');
  }
  return next;
}

export const blackout: WideFormat<BlackoutState> = {
  canStart: (ctx, input) => input !== undefined || ['kanto', 'sinnoh', 'hoenn'].includes(climaxRegion(ctx.run)),
  id: 'blackout',
  setup,
  describe: (s, ctx) => describe(s, ctx.run),
  choose,
  onBattleEnd,
  isOver: blackoutOver,
};
