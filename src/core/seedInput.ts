// Reads what a player types into the Seed & Codes page: a plain seed, or one of
// the share codes (PR1 seed code, GH1 ghost, CC1 challenge card, TM1 team).
// Pure: the scene applies the result (keeping a ghost, changing the desk).

import { decodeSeedCode } from './seedCode';
import { cardGhost, decodeChallengeCard, decodeTeamCode } from './shareCodes';
import { decodeGhostCode } from './ghost';
import type { RulesChoice } from './rules';

type Ghost = ReturnType<typeof cardGhost>;

export type SeedInputResult =
  /** Just a seed (null: a random one). */
  | { kind: 'seed'; seed: string | null }
  /** A code that sets the seed, maybe the trainer and rules, and maybe a score to race. */
  | { kind: 'code'; seed: string; archetypeId: string; rules: RulesChoice; notice: string; ghost?: Ghost }
  /** A team code only shows the team. */
  | { kind: 'info'; notice: string }
  | { kind: 'error'; notice: string };

export interface SeedInputEnv {
  hasArchetype: (id: string) => boolean;
  hasSpecies: (id: string) => boolean;
  speciesName: (id: string) => string;
  /** The trainer chosen now, kept when a code names one that is not available. */
  archetypeId: string;
}

export function readSeedInput(raw: string, env: SeedInputEnv): SeedInputResult {
  const value = raw.trim();
  const trainer = (id: string) => (env.hasArchetype(id) ? id : env.archetypeId);
  if (value.startsWith('GH1.')) {
    const g = decodeGhostCode(value);
    if (!g.ok) return { kind: 'error', notice: g.reason };
    return { kind: 'code', seed: g.parts.seed, archetypeId: trainer(g.parts.archetypeId), rules: g.parts.rules, notice: `Ghost of ${g.ghost.from} loaded: race their seed.`, ghost: g.ghost };
  }
  if (value.startsWith('CC1.')) {
    const c = decodeChallengeCard(value);
    if (!c.ok) return { kind: 'error', notice: c.reason };
    return { kind: 'code', seed: c.parts.seed, archetypeId: trainer(c.parts.archetypeId), rules: c.parts.rules, notice: c.note ?? `Challenge from ${c.score.from}: ${c.score.title}. Beat ${c.score.badges} badges.`, ghost: cardGhost(c.score) };
  }
  if (value.startsWith('TM1.')) {
    const t = decodeTeamCode(value, env.hasSpecies);
    if (!t.ok) return { kind: 'error', notice: t.reason };
    return { kind: 'info', notice: `Team: ${t.team.map((m) => `${env.speciesName(m.speciesId)} Lv${m.level}`).join(', ')}${t.note ? ` (${t.note})` : ''}` };
  }
  if (value.startsWith('PR1.')) {
    const p = decodeSeedCode(value);
    if (!p.ok) return { kind: 'error', notice: p.reason };
    return { kind: 'code', seed: p.parts.seed, archetypeId: trainer(p.parts.archetypeId), rules: p.parts.rules, notice: p.note ?? 'Seed code loaded: seed, trainer and rules set.' };
  }
  return { kind: 'seed', seed: value || null };
}
