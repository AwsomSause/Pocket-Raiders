// Pocket look (the Pokémon-style UI redesign, plans/ui-redesign): small pure models its pages share.
// Presentation only: nothing here reads a random stream or changes a save.

import type { StageState } from '../state';

/** Where the run stands on its stage, for the progress ribbon: stops in all, the current one (0-based, -1 before the first), and which hold a Gym, Elite or Champion battle. */
export interface PocketRoad { n: number; at: number; gyms: number[] }

type RoadStage = Pick<StageState, 'current'> & { map: { columns: number; nodes: readonly { id: string; column: number; kind: string }[] } };

/** The stage as a ribbon of stops: one mark per column, the boss battles taller. Null when there is no stage. */
export function pocketRoad(stage: RoadStage | null | undefined): PocketRoad | null {
  if (!stage) return null;
  const n = stage.map.columns;
  const cur = stage.current ? stage.map.nodes.find((x) => x.id === stage.current) : undefined;
  const gyms = [...new Set(stage.map.nodes.filter((x) => x.kind === 'gym' || x.kind === 'elite' || x.kind === 'champion').map((x) => x.column - 1))].sort((a, b) => a - b);
  return { n, at: cur ? cur.column - 1 : -1, gyms };
}

/** "Stop 12 of 30" (before the first stop: "Start of 30 stops"). */
export const roadStop = (r: PocketRoad): string => (r.at < 0 ? `Start of ${r.n} stops` : `Stop ${r.at + 1} of ${r.n}`);
/** "Gym in 3 stops", "Gym next", "Gym now", or '' when no boss battle lies ahead. `word` names the battle (Gym, League). */
export function roadNext(r: PocketRoad, word = 'Gym'): string {
  const next = r.gyms.find((g) => g >= r.at);
  if (next === undefined) return '';
  const d = next - r.at;
  return d <= 0 ? `${word} now` : d === 1 ? `${word} next` : `${word} in ${d} stops`;
}

/** The trainer ID number on the Title and the Trainer Card: five digits made from the run seed or the save slot, the same every time. */
export function trainerId(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return String((h >>> 0) % 100000).padStart(5, '0');
}

/** Rotom's one line of news on the Title: the game event that ends soonest, or a plain hello when none is on. */
export function rotomNews(events: readonly { event: { name: string }; endsIn: number }[]): string {
  const e = [...events].sort((a, b) => a.endsIn - b.endsIn)[0];
  if (!e) return 'Bzzt! Ready when you are.';
  const days = Math.ceil(e.endsIn / 86400000);
  return `Bzzt! ${e.event.name} ends ${days <= 1 ? 'today' : `in ${days} days`}.`;
}

/** Rotom's line on the Pause menu: what lies ahead and what the party needs first. Plain facts of the run, no advice it cannot back. */
export function rotomTip(o: { next: string; fainted: number; hurt: number; size: number }): string {
  const ahead = o.next ? `${o.next}.` : 'The road is clear for now.';
  const care = o.fainted > 0 ? ` ${o.fainted} of your ${o.size} Pokémon ${o.fainted === 1 ? 'has' : 'have'} fainted: heal up first.` : o.hurt > 0 ? ` ${o.hurt} of your Pokémon ${o.hurt === 1 ? 'is' : 'are'} low on HP.` : ' Your party is in good shape.';
  return `"Bzzt! ${ahead}${care}"`;
}
