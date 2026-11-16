// F221: the player's own numbers, worked out on this device from the run history. Nothing is sent anywhere. Pure.

import type { Profile } from '../state';

export interface LocalStats {
  runs: number;
  wins: number;
  winRate: number;
  assisted: number;
  avgEncounters: number;
  bestEncounters: number;
  avgRegions: number;
  topTrainers: { id: string; runs: number; wins: number }[];
  topKillers: { id: string; count: number }[];
  topPartyMembers: { id: string; count: number }[];
}

const top = <T extends string>(counts: Map<T, number>, n: number) => [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);

export function localStats(profile: Pick<Profile, 'runHistory'>): LocalStats {
  const h = profile.runHistory;
  const runs = h.length;
  const wins = h.filter((r) => r.victory).length;
  const byTrainer = new Map<string, { runs: number; wins: number }>();
  const killers = new Map<string, number>();
  const party = new Map<string, number>();
  for (const r of h) {
    const t = byTrainer.get(r.archetypeId) ?? { runs: 0, wins: 0 };
    t.runs += 1;
    if (r.victory) t.wins += 1;
    byTrainer.set(r.archetypeId, t);
    if (r.defeatedBy) killers.set(r.defeatedBy.speciesId, (killers.get(r.defeatedBy.speciesId) ?? 0) + 1);
    for (const m of r.party) party.set(m.speciesId, (party.get(m.speciesId) ?? 0) + 1);
  }
  const avg = (f: (r: (typeof h)[number]) => number) => (runs ? Math.round((h.reduce((s, r) => s + f(r), 0) / runs) * 10) / 10 : 0);
  return {
    runs,
    wins,
    winRate: runs ? Math.round((wins / runs) * 1000) / 10 : 0,
    assisted: h.filter((r) => r.assisted).length,
    avgEncounters: avg((r) => r.encounters),
    bestEncounters: h.reduce((m, r) => Math.max(m, r.encounters), 0),
    avgRegions: avg((r) => r.regionsCleared),
    topTrainers: [...byTrainer].sort((a, b) => b[1].runs - a[1].runs || a[0].localeCompare(b[0])).slice(0, 3).map(([id, v]) => ({ id, ...v })),
    topKillers: top(killers, 3).map(([id, count]) => ({ id, count })),
    topPartyMembers: top(party, 3).map(([id, count]) => ({ id, count })),
  };
}

/**
 * The same numbers as tiles and one line of text (New UI): eight tiles, the rest in words. `trainer` and `mon` turn
 * ids into names.
 */
export function statTiles(s: LocalStats, trainer: (id: string) => string, mon: (id: string) => string): { tiles: [string, string][]; text: string } {
  const t = s.topTrainers[0], m = s.topPartyMembers[0], k = s.topKillers[0];
  return {
    tiles: [
      ['Runs', String(s.runs)],
      ['Wins', String(s.wins)],
      ['Win rate', `${s.winRate}%`],
      ['Longest run', String(s.bestEncounters)],
      ['Average run', String(s.avgEncounters)],
      ['Regions per run', String(s.avgRegions)],
      ['Top trainer', t ? trainer(t.id) : '–'],
      ['Most used', m ? mon(m.id) : '–'],
    ],
    text: `Run length is counted in encounters.${k ? ` Beaten most by ${mon(k.id)} (${k.count}×).` : ''} Assisted runs: ${s.assisted}. Worked out on this device; nothing is sent anywhere.`,
  };
}
