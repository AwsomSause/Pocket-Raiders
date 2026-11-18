// The evolution scene (Kice 2026-11-17: "Evolution animation isn't implemented"): the classic sequence played
// whenever one of your Pokémon evolves, in battle or out of it. "What? X is evolving!" waits for an input, the
// Pokémon turns to light and flickers between its old and new shape faster and faster, a flash, the new form in
// colour, then "Congratulations!" waits for an input. Pure data here (timings, lines, which Pokémon changed);
// the drawing is src/ui/evolutionScene.ts. Presentation only: the evolution itself is already decided by the
// rules before this runs, so nothing here reads or changes a random stream or a save.

export type EvoMotion = 'full' | 'reduced' | 'off';

/** One step of the flicker: from `at` ms, the silhouette shows this form. */
export interface EvoBeat {
  at: number;
  show: 'from' | 'to';
}

export interface EvoTimeline {
  /** The silhouette flips (empty when motion is off). */
  beats: EvoBeat[];
  /** When the white flash fires and the new form is revealed. */
  revealAt: number;
  /** How long the flash takes to fade. */
  flashMs: number;
}

/** The classic rhythm: the first swap waits this long, each later one is this much quicker, never under the floor. */
export const EVO_FLICKER = { firstMs: 560, factor: 0.84, floorMs: 50, totalMs: 4200, flashMs: 420, reducedMs: 900 } as const;

/**
 * The flicker for one evolution. `speed` above 1 plays faster (the Animation speed setting). Full motion flips the
 * silhouette between the two forms on a shrinking beat; reduced motion skips the flicker and only cross-fades;
 * off reveals the new form at once. The last beat always shows the new form.
 */
export function evolutionTimeline(motion: EvoMotion, speed = 1): EvoTimeline {
  const k = speed > 0 ? 1 / speed : 1;
  if (motion === 'off') return { beats: [], revealAt: 0, flashMs: 0 };
  if (motion === 'reduced') return { beats: [{ at: 0, show: 'from' }], revealAt: Math.round(EVO_FLICKER.reducedMs * k), flashMs: 0 };
  const beats: EvoBeat[] = [{ at: 0, show: 'from' }];
  let t = 0;
  let gap: number = EVO_FLICKER.firstMs;
  while (t + gap < EVO_FLICKER.totalMs) {
    t += gap;
    beats.push({ at: Math.round(t * k), show: beats.length % 2 === 1 ? 'to' : 'from' });
    gap = Math.max(EVO_FLICKER.floorMs, gap * EVO_FLICKER.factor);
  }
  if (beats[beats.length - 1]!.show !== 'to') {
    t += gap;
    beats.push({ at: Math.round(t * k), show: 'to' });
  }
  return { beats, revealAt: Math.round((t + gap) * k), flashMs: Math.round(EVO_FLICKER.flashMs * k) };
}

/** Which form shows at `ms` into the flicker. */
export function evoFormAt(tl: EvoTimeline, ms: number): 'from' | 'to' {
  if (ms >= tl.revealAt) return 'to';
  let show: 'from' | 'to' = 'from';
  for (const b of tl.beats) if (b.at <= ms) show = b.show;
  return show;
}

/** The words of the scene, in order: the opening line, then the closing line and one per move learned. */
export function evolutionLines(fromName: string, toName: string, learned: readonly string[] = []): { intro: string; outro: string[] } {
  return {
    intro: `What? ${fromName} is evolving!`,
    outro: [`Congratulations! Your ${fromName} evolved into ${toName}!`, ...learned.map((m) => `${toName} learned ${m}!`)],
  };
}

export interface PartyLook {
  uid: string;
  speciesId: string;
  shiny?: boolean;
}

export interface SeenEvolution {
  uid: string;
  from: string;
  to: string;
  shiny: boolean;
}

/** The party's species by Pokémon, taken before an action, to see afterwards who evolved. */
export const partyLooks = (party: readonly PartyLook[]): Map<string, string> => new Map(party.map((m) => [m.uid, m.speciesId]));

/**
 * The Pokémon whose species changed since `before` and whose new species is one `isEvolution` accepts (so a form
 * change or a Pokémon that joined is not shown as an evolution). Party order.
 */
export function evolutionsSince(before: ReadonlyMap<string, string>, party: readonly PartyLook[], isEvolution: (from: string, to: string) => boolean): SeenEvolution[] {
  const out: SeenEvolution[] = [];
  for (const m of party) {
    const from = before.get(m.uid);
    if (!from || from === m.speciesId || !isEvolution(from, m.speciesId)) continue;
    out.push({ uid: m.uid, from, to: m.speciesId, shiny: !!m.shiny });
  }
  return out;
}
