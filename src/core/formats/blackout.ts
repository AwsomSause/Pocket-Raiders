// Wide format 2: Blackout (plan E4; Kanto Phase 1 "The Streets"). A curfew city under a violet Seal. Three anchors (a Mr. Mime
// holding a wall of light across a street) each fight one trainer battle. While the Seal holds, every fight has the Seal's
// rules: no voluntary switching on the first turn, and Psychic moves hit 10% harder for BOTH sides. The Seal breaks when two
// of the three anchors are beaten; that fight and every one after it have no Seal. If the Triad is active the third anchor
// is Oracle Sabrina and she must be beaten too (3 battles, else 2). A lost fight heals the party (story loss), the anchor
// stays up, and the player may try again. No RNG here; the battles use their own seeded stream (`format-battle`).
// Not built: Sabrina's executive ability "Foresight Tax" (needs an AI hook in the battle engine).

import { markCheckpoint, markDone } from './store';
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

export interface BlackoutState {
  anchors: Anchor[];
  triad: boolean;
  /** The anchor whose fight is running right now. */
  pending: string | null;
  /** Fights lost so far (each healed the party; the anchor stays up). */
  losses: number;
}

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
  const ok = launchFormatBattle(ctx.content, ctx.run, 'blackout', {
    key: a.id,
    name: a.name,
    classId: 'psychic',
    types: ['psychic'],
    species: a.species,
    size: a.size,
    levelBonus: a.sabrina ? 2 : 0,
    ...(sealHolds(s) ? { rule: { ...SEAL } } : {}),
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
  id: 'blackout',
  setup,
  describe: (s) => describe(s),
  choose,
  onBattleEnd,
  isOver: blackoutOver,
};
