// Share codes (ideas S198, S200): a team code (TM1) and a challenge card (CC1) as one short line a friend can paste.
// The game has no server, so the code carries everything. Pure: no RNG, no Phaser.

import { decodeSeedCode, encodeSeedCode, type SeedCodeParts } from './seedCode';
import type { LegacyState } from './state';

type Ghost = LegacyState['ghosts'][string];
const TEAM = 'TM1';
const CARD = 'CC1';

const b64 = (s: string): string => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string): string => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export interface TeamMember { speciesId: string; level: number; shiny: boolean }
export type TeamCodeResult = { ok: true; team: TeamMember[]; note: string | null } | { ok: false; reason: string };

/** TM1.<data>: up to 6 Pokémon as species, level and shiny. */
export function encodeTeamCode(team: readonly TeamMember[]): string {
  return `${TEAM}.${b64(JSON.stringify(team.slice(0, 6).map((m) => [m.speciesId, m.level, m.shiny ? 1 : 0])))}`;
}

/** Members whose species this version does not know are dropped (and said so). */
export function decodeTeamCode(code: string, knownSpecies: (id: string) => boolean): TeamCodeResult {
  const bits = code.trim().split('.');
  if (bits[0] !== TEAM || bits.length !== 2) return { ok: false, reason: 'This is not a team code.' };
  try {
    const raw = JSON.parse(unb64(bits[1]!)) as unknown;
    if (!Array.isArray(raw)) return { ok: false, reason: 'The team code is damaged.' };
    const all = raw.slice(0, 6).map((r) => (Array.isArray(r) ? { speciesId: String(r[0]), level: Math.min(1000, Math.max(1, Math.trunc(Number(r[1])) || 1)), shiny: r[2] === 1 } : null));
    if (all.some((m) => !m)) return { ok: false, reason: 'The team code is damaged.' };
    const team = (all as TeamMember[]).filter((m) => knownSpecies(m.speciesId));
    if (team.length === 0) return { ok: false, reason: 'The team code has no Pokémon this version knows.' };
    return { ok: true, team, note: team.length < all.length ? `${all.length - team.length} Pokémon are not in this version and were left out.` : null };
  } catch {
    return { ok: false, reason: 'The team code is damaged.' };
  }
}

export interface ChallengeScore { from: string; title: string; victory: boolean; badges: number; encounters: number }
export type ChallengeResult = { ok: true; parts: SeedCodeParts; score: ChallengeScore; note: string | null } | { ok: false; reason: string };

/** CC1.<seed code>.<score>: the rule set (seed, trainer, rules) plus the score to beat. */
export function encodeChallengeCard(parts: SeedCodeParts, score: ChallengeScore): string {
  const clean: ChallengeScore = { ...score, from: score.from.slice(0, 24), title: score.title.slice(0, 40) };
  return [CARD, encodeURIComponent(encodeSeedCode(parts)).replace(/\./g, '%2E'), b64(JSON.stringify(clean))].join('.');
}

export function decodeChallengeCard(code: string): ChallengeResult {
  const bits = code.trim().split('.');
  if (bits[0] !== CARD || bits.length !== 3) return { ok: false, reason: 'This is not a challenge card.' };
  try {
    const seed = decodeSeedCode(decodeURIComponent(bits[1]!));
    if (!seed.ok) return seed;
    const raw = JSON.parse(unb64(bits[2]!)) as Partial<ChallengeScore>;
    if (typeof raw.from !== 'string') return { ok: false, reason: 'The challenge card is damaged.' };
    const num = (n: unknown) => Math.max(0, Math.trunc(Number(n)) || 0);
    const score: ChallengeScore = { from: raw.from.slice(0, 24), title: String(raw.title ?? 'Challenge').slice(0, 40), victory: !!raw.victory, badges: num(raw.badges), encounters: num(raw.encounters) };
    return { ok: true, parts: seed.parts, score, note: seed.note };
  } catch {
    return { ok: false, reason: 'The challenge card is damaged.' };
  }
}

/** A card kept as a ghost for its seed, so the end screen already compares your run against the score (no save change). */
export const cardGhost = (score: ChallengeScore): Ghost => ({ from: score.from, victory: score.victory, badges: score.badges, regionReached: 0, encounters: score.encounters, team: [], actions: [`Challenge: ${score.title}`] });
