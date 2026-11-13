// Beta 0.6 E1 (part 2): the Dossier's view-model. Kice's pick is "Case Folders" (8) mixed with "Org Pyramid" (4): one folder
// tab per team, a case file for the chosen person, and the team's chain of command beside it. Pure data, no Phaser.
// Who is in it lives in `run.expansion.dossier` (id -> status + when first met). Nothing is listed until the run has met them.

import { CAST_STATUSES, CastEntrySchema, type CastEntry, type CastStatus } from './entry';
import { expansionData } from '../../../data/expansion';
import type { ExpansionCharacter } from '../data';
import type { RunState } from '../../state';

export { CAST_STATUSES, CastEntrySchema, type CastEntry, type CastStatus };

export type CastMark = 'canon' | 'what-if' | 'original';
export const TIER_NAMES = ['Associate', 'Grunt', 'Specialist', 'Lieutenant', 'Commander', 'Executive', 'Second', 'Leader'] as const;

/** Rank text reads "Executive (5)"; a rank with no number (Ally, Civilian, Hostage...) sits on the bottom row, T0. */
export function castTier(rank: string): number {
  return Math.min(7, Number(/\((\d+)\)/.exec(rank)?.[1] ?? 0));
}

/** The data says "canon (anime)", "what-if (manga-inspired)" or "original". */
export function castMark(basedOn: string): CastMark {
  return basedOn.startsWith('canon') ? 'canon' : basedOn.startsWith('what-if') ? 'what-if' : 'original';
}

export function teamLabel(team: string): string {
  return team.split('-').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
}

// Built on first use: events.ts imports this file, and the expansion data module is not ready yet while the core is loading.
let byId: Map<string, ExpansionCharacter> | undefined;
const characterById = (id: string) => (byId ??= new Map(expansionData.characters.map((c) => [c.id, c]))).get(id);

/** A character is an ally from the first meeting when the data calls them one; everyone else starts at large. */
function firstStatus(c: ExpansionCharacter): CastStatus {
  return /^Ally\b/.test(c.rank) ? 'ally' : 'at large';
}

/**
 * Meets a character (adds them to the Dossier) or changes their status. Meeting someone again never changes them.
 * Returns false for an id the cast does not have. Never touches an RNG stream.
 */
export function recordCast(run: RunState, id: string, status?: CastStatus): boolean {
  const c = characterById(id);
  if (!c) return false;
  const cast = ((run.expansion ??= {}).dossier ??= {});
  const have = cast[id];
  if (!have) cast[id] = { status: status ?? firstStatus(c), metAt: run.encountersCompleted };
  else if (status) have.status = status;
  return true;
}

export interface DossierEntry {
  id: string;
  name: string;
  rank: string;
  tier: number;
  tierName: string;
  team: string;
  mark: CastMark;
  status: CastStatus;
  /** "Overheard": the character's voice line. */
  voice: string;
  /** The note under the case file: why they are here (what-if), where they come from (canon) or what they do (original). */
  noteTitle: string;
  note: string;
  /** Their ace is only written down once you have beaten, turned or befriended them. */
  ace: string;
}

export interface DossierRow { tier: number; label: string; entries: DossierEntry[] }
export interface DossierFolder { team: string; label: string; entries: DossierEntry[]; rows: DossierRow[] }

function entryOf(c: ExpansionCharacter, cast: CastEntry): DossierEntry {
  const mark = castMark(c.basedOn);
  const tier = castTier(c.rank);
  return {
    id: c.id,
    name: c.name,
    rank: c.rank.replace(/\s*\(\d+\)$/, ''),
    tier,
    tierName: TIER_NAMES[tier]!,
    team: c.team,
    mark,
    status: cast.status,
    voice: c.voice,
    noteTitle: mark === 'what-if' ? 'WHAT-IF NOTE' : mark === 'canon' ? 'CANON NOTE' : 'ORIGINAL NOTE',
    note: mark === 'canon' ? `${c.role} (${c.basedOn.replace(/^canon\s*/, '').replace(/[()]/g, '') || 'the games'})` : c.role,
    ace: cast.status === 'at large' ? '???' : c.ace,
  };
}

/** One folder per team with anyone met, biggest folder first by name. Empty until the run has met someone. */
export function dossierFolders(run: Pick<RunState, 'expansion'>): DossierFolder[] {
  const cast = run.expansion?.dossier ?? {};
  const byTeam = new Map<string, DossierEntry[]>();
  for (const c of expansionData.characters) {
    const have = cast[c.id];
    if (!have) continue;
    (byTeam.get(c.team) ?? byTeam.set(c.team, []).get(c.team)!).push(entryOf(c, have));
  }
  return [...byTeam.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([team, list]) => {
      const entries = list.sort((a, b) => b.tier - a.tier || a.name.localeCompare(b.name));
      const rows: DossierRow[] = [];
      for (let t = 7; t >= 0; t--) rows.push({ tier: t, label: `T${t} ${TIER_NAMES[t]}`, entries: entries.filter((e) => e.tier === t) });
      return { team, label: teamLabel(team), entries, rows };
    });
}

/** Meets a team's top names (Executive and above, tier 5+): what you learn about an Evil Team once you have dealt with one of its operations. */
export function meetTeamHeads(run: RunState, team: string): string[] {
  const met: string[] = [];
  for (const c of expansionData.characters) {
    if (c.team !== team || castTier(c.rank) < 5 || run.expansion?.dossier?.[c.id]) continue;
    if (recordCast(run, c.id)) met.push(c.id);
  }
  return met;
}
