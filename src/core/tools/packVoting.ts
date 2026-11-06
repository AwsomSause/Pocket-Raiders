// Community Content Voting (idea S205): friends who play together pick which installed mod packs to feature. There is
// no server: each person's vote is a short code ("PV1.<pack id>.<voter>") passed by hand, one vote per voter, and the
// packs with the most votes are featured (their seeds come first on the Seed Board). Votes stay on this device. Pure.

export interface Votes { [packId: string]: string[] }

const CODE = /^PV1\.([a-z0-9][a-z0-9-]{1,40})\.([A-Za-z0-9 _-]{1,16})$/;
export const MAX_VOTERS = 50;

export const voteCode = (packId: string, voter: string): string => `PV1.${packId}.${voter.trim().slice(0, 16).replace(/[^A-Za-z0-9 _-]/g, '') || 'Friend'}`;

/** Adds a vote code. A voter has one vote in total: voting again moves it. Packs not installed are refused. */
export function castVote(votes: Votes, code: string, installed: readonly string[]): { votes: Votes } | { problem: string } {
  const m = CODE.exec(code.trim());
  if (!m) return { problem: 'That is not a vote code.' };
  const [, packId, voter] = m as unknown as [string, string, string];
  if (!installed.includes(packId)) return { problem: 'That pack is not installed here.' };
  const next: Votes = {};
  for (const [id, who] of Object.entries(votes)) next[id] = who.filter((v) => v !== voter);
  const all = Object.values(next).reduce((n, w) => n + w.length, 0);
  if (all >= MAX_VOTERS && !Object.values(votes).some((w) => w.includes(voter))) return { problem: `Only ${MAX_VOTERS} voters can be kept.` };
  next[packId] = [...(next[packId] ?? []), voter];
  return { votes: next };
}

/** Installed packs by votes (most first), then by id. */
export function tally(votes: Votes, installed: readonly string[]): { packId: string; votes: number }[] {
  return installed.map((packId) => ({ packId, votes: votes[packId]?.length ?? 0 })).sort((a, b) => b.votes - a.votes || a.packId.localeCompare(b.packId));
}

/** The featured pack: the one with the most votes, or null on no votes or a tie at the top. */
export function featured(votes: Votes, installed: readonly string[]): string | null {
  const t = tally(votes, installed);
  return t[0] && t[0].votes > 0 && t[0].votes !== t[1]?.votes ? t[0].packId : null;
}

export function parseVotes(raw: string | null): Votes {
  try {
    const v: unknown = JSON.parse(raw ?? '{}');
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return {};
    const out: Votes = {};
    for (const [k, w] of Object.entries(v)) if (Array.isArray(w)) out[k] = w.filter((x): x is string => typeof x === 'string').slice(0, MAX_VOTERS);
    return out;
  } catch {
    return {};
  }
}
