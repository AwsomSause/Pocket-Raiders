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
import type { TypeName } from '../contentSchema';
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

export interface BlackoutState {
  /** The region whose streets these are (absent in older saves: Kanto). */
  region?: string;
  anchors: Anchor[];
  triad: boolean;
  /** The anchor whose fight is running right now. */
  pending: string | null;
  /** Fights lost so far (each healed the party; the anchor stays up). */
  losses: number;
}

/** Alola's Crossing and Paldea's stair (Beta 0.7 E9). Same anchor rules; the condition is Thin Light in Alola (Beans cancels it) and none yet in Paldea (Tera Flicker is not built). */
export const BLACKOUT_REGIONS: Record<string, { places: string[]; foe: string; species: string[]; types: TypeName[]; title: string; intro: string[]; over: string; thinLight: boolean }> = {
  alola: {
    places: ['the first rowing boat', 'the second rowing boat', 'the third rowing boat'], foe: 'Skull Grunt (blockade)', species: ['salandit', 'yungoos', 'wimpod', 'mareanie'], types: ['dark', 'poison'], title: 'The Crossing', thinLight: true,
    intro: ['A boat to the Paradise under a sky with holes in it. Skull\'s last blockade is three rowing boats lashed together.', 'Tupp: "End of the line! By order of Kahuna Boss!" Rapp: "He came back from that party different."'],
    over: 'The blockade is broken. The dock is ahead.',
  },
  paldea: {
    places: ['the lower landing', 'the middle landing', 'the top landing'], foe: 'Peon (landing)', species: ['pawniard', 'houndour', 'mabosstiff', 'gimmighoul'], types: ['dark', 'fighting'], title: 'The Long Walk to School', thinLight: false,
    intro: ['Mesagoza\'s great stair, every step of it. Peons in Star costume hold the landings.', 'Peon Brask: "Team Star says nobody gets to school today! That\'s what you\'ll tell them!" A real Star Grunt, very small and very angry: "We\'ve never stopped anyone getting to school! We just didn\'t go!"'],
    over: 'You reach the top of the stair.',
  },
};

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

function setup({ content, run }: FormatCtx, input?: unknown): BlackoutState {
  const region = climaxRegion(run);
  const rc = BLACKOUT_REGIONS[region];
  if (rc && input === undefined) {
    const species = rc.species.filter((id) => content.species.has(id));
    const anchors: Anchor[] = rc.places.map((place, i) => ({ id: `a${i + 1}`, place, name: rc.foe, species, size: 2, beaten: false }));
    return { region, anchors, triad: false, pending: null, losses: 0 };
  }
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

function describe(s: BlackoutState): FormatCard {
  const rc = s.region ? BLACKOUT_REGIONS[s.region] : undefined;
  if (rc) {
    const done = blackoutOver(s);
    const lines = [...rc.intro, `Anchors beaten: ${beatenCount(s)} of ${s.anchors.length}.${s.losses ? ` Fights lost: ${s.losses} (your team was healed each time).` : ''}`];
    if (done) return { title: rc.title, lines: [...lines, rc.over], options: [], over: true };
    return { title: rc.title, lines: rc.thinLight && sealHolds(s) ? [...lines, 'Thin Light: every third turn a glimpse from the far side of the sky strikes one Pokémon on the field. It ends when two blockades fall.'] : lines, options: s.anchors.filter((a) => !a.beaten).map((a) => ({ id: a.id, label: `${a.name} at ${a.place}`, enabled: true })), over: false };
  }
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

function choose(s: BlackoutState, id: string, ctx: FormatCtx): BlackoutState {
  if (s.pending) return s;
  const a = open(s).find((x) => x.id === id);
  if (!a) return s;
  const rc = s.region ? BLACKOUT_REGIONS[s.region] : undefined;
  if (rc) {
    const beans = Number(ctx.run.story.flags['ev:alola-beans-joined'] ?? 0) >= 1;
    const ok = launchFormatBattle(ctx.content, ctx.run, 'blackout', { key: a.id, name: a.name, classId: 'roughneck', types: rc.types, species: a.species, size: a.size, levelBonus: 0, ...(rc.thinLight && sealHolds(s) && !beans ? { rule: { thinLight: true } } : {}) });
    return ok ? { ...s, pending: a.id } : s;
  }
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
  canStart: (ctx, input) => input !== undefined || climaxRegion(ctx.run) === 'kanto' || climaxRegion(ctx.run) in BLACKOUT_REGIONS,
  id: 'blackout',
  setup,
  describe: (s) => describe(s),
  choose,
  onBattleEnd,
  isOver: blackoutOver,
};
