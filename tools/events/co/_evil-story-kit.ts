// Shared helpers for the evil-story co modules (files starting with "_" are not built).
import { type Json } from '../dsl.ts';

/** new-events' `takeNode` effect ("(a node)" as a cost). Off until it is on the shared branch: the choice then names the cost in words only. */
export const TAKE_NODE = false;
export const node = (nodes = 1): Json[] => (TAKE_NODE ? [{ kind: 'takeNode', ...(nodes > 1 ? { nodes } : {}) }] : []);

/** An `evil` effect (core/evil/teams.ts). */
export const evil = (o: { beat?: boolean; heat?: number; op?: 'foiled' | 'infiltrated' | 'succeeded' | 'joined'; opId?: string; planFirst?: string; door?: boolean; defect?: boolean; end?: 'defeated' | 'exposed' | 'allied'; talk?: string; mark?: string }): Json => ({ kind: 'evil', ...o });

/** A battle with the region's team at a rank. Levels: Grunts A-1, the lieutenant A+1, the boss A+2 (STAGE_MAP_AND_PLACEMENT section 2). */
export const foe = (rank: 'grunt' | 'specialist' | 'executive' | 'leader', name: string, size: number, o: { lv?: number; win?: Json[]; format?: 'doubles'; ally?: string; study?: boolean; pseudo?: boolean; chain?: number } = {}): Json => ({
  kind: 'trainer', evil: rank, name, size, levelBonus: o.lv ?? (rank === 'leader' ? 2 : rank === 'executive' ? 1 : rank === 'specialist' ? 0 : -1),
  ...(o.format ? { format: o.format } : {}), ...(o.ally ? { ally: o.ally } : {}), ...(o.study ? { evilStudy: true } : {}), ...(o.pseudo ? { pseudo: true } : {}), chain: o.chain ?? 1, win: o.win ?? [],
});

export const rivalTrust = (n: number): Json => ({ kind: 'rivalChange', feelings: { trust: n } });
export const crisis = (amount: number): Json => ({ kind: 'crisis', amount });
export const seen = (id: string): Json => ({ kind: 'eventSeen', id });
/** Reputation +1 / -1 (board: run flags `rep` and `rep-lost`). */
export const rep = (n: number): Json => ({ kind: 'flag', key: n >= 0 ? 'rep' : 'rep-lost', amount: Math.abs(n) });
/** Kindness +n (board: Good/Evil +n and `kind-total` +n). */
export const kind = (n: number): Json[] => [{ kind: 'attribute', key: 'goodEvil', amount: n }, { kind: 'flag', key: 'kind-total', amount: n }];
export const prompt = (id: string, needs: 'ok' | 'good' | 'perfect' = 'ok') => ({ id, needs });
/** Skill prompts used as the pack's small games: stealth (hold steady), a rhythm game, a chase. */
export const STEALTH = 'brace-hold';
export const RHYTHM = 'echo-rhythm';
