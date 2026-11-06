// Overhaul slice 22 (rival roles): each run's rivals play one of three roles, decided by who they are in this run
// (no new save data, no memory of earlier runs):
//   major      the guaranteed major rival: full counter-picks, as before.
//   additional the first other rival: lighter, at most one counter-pick over the run.
//   friendly   any further rival: spars, no counter-picks (it never studies your moves).
// Only the counter-picking changes; meetings, teams and lines stay as the rival engine has them.

import type { RunState } from '../state';

export type RivalRole = 'major' | 'additional' | 'friendly';
export interface RivalRolesConfig { enabled: boolean; additionalCounters: number }
export const DEFAULT_RIVAL_ROLES: RivalRolesConfig = { enabled: true, additionalCounters: 1 };

interface RoleRival { id: string; major?: boolean | undefined }

export function rivalRole(cfg: RivalRolesConfig, rivals: readonly RoleRival[], rival: RoleRival): RivalRole {
  // A rival the run does not list (a standalone record) plays as before.
  if (!cfg.enabled || rival.major || !rivals.some((r) => r.id === rival.id)) return 'major';
  const others = rivals.filter((r) => !r.major);
  return others[0]?.id === rival.id ? 'additional' : 'friendly';
}

/** How many counter-picks a rival may make in total in this run, given the normal cap. */
export function counterCap(cfg: RivalRolesConfig, role: RivalRole, normalCap: number): number {
  if (role === 'friendly') return 0;
  if (role === 'additional') return Math.min(cfg.additionalCounters, normalCap);
  return normalCap;
}

export const SPAR_NOTE = (name: string): string => `${name} is only sparring this time and keeps no tricks up their sleeve.`;

export function rivalRoleOf(run: Pick<RunState, 'story'>, cfg: RivalRolesConfig, rival: RoleRival): RivalRole {
  return rivalRole(cfg, run.story.rivals, rival);
}
