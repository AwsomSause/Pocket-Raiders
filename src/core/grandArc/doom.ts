// The Region of Doom, "The Margin" (Beta 0.7 D1), as an in-run epilogue: after the win (and the Citadark finale, if it was played) the
// player may walk into a tenth region built from THIS run's ledger only: how the run's evil teams ended, whether a regional Apex was
// taken, how the finale ended. No cross-run memory: no Doom Ledger, no Faller rank, nothing carried to another run (decision B2 = no).
// 14 districts, 8 Evil Gyms, a Doom Level (0 to 5) that falls 0.2 for each district taken back, and the Undercroft's Chairperson.
// A loss ends the visit as `fled`; the won run is never undone. Pure rules: `epilogue/director.ts` plays the plan. Own seeded stream `doom-*`.
// Not built (limited): Takeover raids, the Black Market shop, wild Ambush/Shadow rates in the district streets (shown, not applied), annexes.

import type { RunState } from '../state';
import { hashSeed, Rng } from '../rng';
import { epilogueOf, apexTaken, type EpiStep } from './finale';
import { finaleData } from './finaleData';

const D = finaleData.doom;

export interface DoomLedger {
  /** Evil teams this run met: the run's own, and any roaming team it fought. */
  teams: Array<{ id: string; end: 'none' | 'defeated' | 'exposed' | 'allied' | 'roaming' }>;
  apexTaken: boolean;
  finale: 'sung' | 'silent' | 'sold' | 'declined' | 'unseen';
  defector: boolean;
}

/** The run's own record of how its evil teams ended. Pure read. */
export function doomLedger(run: Pick<RunState, 'story' | 'expansion'>): DoomLedger {
  const evil = run.story.evil;
  const teams: DoomLedger['teams'] = [];
  if (evil?.teamId) teams.push({ id: evil.teamId, end: evil.end });
  for (const key of Object.keys(evil?.villains ?? {})) {
    const id = key.includes(':') ? key.split(':')[0]! : null;
    if (id && !teams.some((t) => t.id === id)) teams.push({ id, end: 'roaming' });
  }
  return { teams, apexTaken: apexTaken(run), finale: epilogueOf(run)?.finaleResult ?? 'unseen', defector: Boolean(evil?.defector) };
}

/** Doom Level 0 to 5: the teams in the ledger, +1 for a taken Apex, +1 for a finale left silent. At least 1 once anything is in the ledger. */
export function baseDoomLevel(l: DoomLedger): number {
  const raw = l.teams.length + (l.apexTaken ? 1 : 0) + (l.finale === 'silent' ? 1 : 0);
  return Math.max(1, Math.min(5, raw));
}

/** The Doom Level now: 0.2 lower for each district taken back, rounded to a tenth, never below 0. Falls monotonically. */
export const doomLevelNow = (base: number, taken: number): number => Math.max(0, Math.round((base - D.districtDrop * taken) * 10) / 10);

export interface DoomDistrict { id: string; name: string; theme: string; control: string; taken: boolean }

/** The 14 districts with who holds each: a ledger team holds its own districts; the rest are unclaimed. */
export function doomDistricts(run: Pick<RunState, 'story' | 'expansion'>): DoomDistrict[] {
  const l = doomLedger(run);
  const taken = epilogueOf(run)?.taken ?? [];
  return D.districts.map((d) => ({ id: d.id, name: d.name, theme: d.theme, control: d.teams.find((t) => l.teams.some((x) => x.id === t)) ?? 'unclaimed', taken: taken.includes(d.id) }));
}

export interface DoomGym { slot: number; district: string; leader: string; rule: string; spec: Extract<EpiStep, { t: 'battles' }> }

/**
 * The eight Evil Gyms. A leader comes from this run's ledger when it supplies one (the run's own executive, specialist and leader,
 * a pardoned or exposed leader, a defector, the rival); otherwise an invented placeholder from the data. The Chairperson is always generated.
 */
export function doomGyms(run: Pick<RunState, 'story' | 'expansion' | 'seed'>): DoomGym[] {
  const l = doomLedger(run);
  const evil = run.story.evil;
  const own = evil?.teamId ?? null;
  const base = baseDoomLevel(l);
  const rng = new Rng(hashSeed(`${run.seed}::doom-gyms`));
  return D.gyms.map((g) => {
    const ph = D.leaders[g.slot - 1]!;
    const levelBonus = D.levelsPerDoomLevel * base + g.slot;
    let spec: Extract<EpiStep, { t: 'battles' }> = { t: 'battles', key: `gym-${g.slot}`, name: ph.name, n: 1, size: Math.min(6, 3 + Math.ceil(g.slot / 2)), types: g.types, levelBonus, district: g.district };
    const fromTeam = (rank: 'executive' | 'specialist' | 'leader') => { spec = { ...spec, evil: rank }; };
    if (own) {
      if (g.source === 'executive') fromTeam('executive');
      else if (g.source === 'specialist') fromTeam('specialist');
      else if (g.source === 'leader') fromTeam('leader');
      else if (g.source === 'pardoned' && evil?.end === 'allied') fromTeam('leader');
      else if (g.source === 'exposed' && evil?.end === 'exposed') fromTeam('leader');
      else if (g.source === 'defector' && l.defector) fromTeam('specialist');
    }
    if (g.source === 'chair') spec = { ...spec, size: 6, types: [...g.types, rng.pick(['fire', 'water', 'grass', 'steel'])] };
    return { slot: g.slot, district: g.district, leader: spec.name, rule: g.rule, spec };
  });
}

/** The visit: the doorway card, four gyms, the Pale Garden's rest, four gyms, and the epitaph. */
export function planDoom(run: Pick<RunState, 'story' | 'expansion' | 'seed'>): EpiStep[] {
  const gyms = doomGyms(run).map((g) => g.spec);
  return [{ t: 'card', id: 'doom-enter' }, ...gyms.slice(0, 4), { t: 'breather' }, ...gyms.slice(4), { t: 'card', id: 'doom-end' }];
}

/** Is the Region of Doom offered now? On for the run, the run won, and not visited yet. */
export function doomAvailable(run: Pick<RunState, 'expansion' | 'victory'>): boolean {
  const ep = epilogueOf(run);
  return !!run.victory && !!ep?.doom && ep.doomResult === undefined;
}

const teamName = (id: string): string => id.replace(/-/g, ' ');

/** The Doom Ledger Epitaph for this run only: a short written summary shown on the last card. */
export function doomEpitaph(run: Pick<RunState, 'story' | 'expansion'>): string[] {
  const l = doomLedger(run);
  const ep = epilogueOf(run);
  const lines: string[] = [];
  if (l.teams.length === 0) lines.push('No team left anything on the Margin. It is a quiet place when nobody is owed anything.');
  else lines.push(`The Margin held ${l.teams.map((t) => teamName(t.id)).join(', ')}: ${l.teams.length === 1 ? 'one team' : `${l.teams.length} teams`}'s unfinished business.`);
  if (l.apexTaken) lines.push('A regional Apex that left in a helicopter stood in the Crown Yard, and nobody is sure whose it was.');
  if (l.finale === 'silent') lines.push('XD001 is a rumor in the Undercroft: a song with no singer.');
  const marks = ep?.marks ?? 0;
  lines.push(marks >= 8 ? 'All eight Doom Marks are yours. The Chairperson\'s chair is empty.' : marks > 0 ? `${marks} of 8 Doom Marks are yours. The Margin goes on without you.` : 'You walked out with nothing but the dust.');
  return lines;
}

/** The doorway card: what the Margin looks like for this run. */
export function doomEnterCard(run: Pick<RunState, 'story' | 'expansion'>): { title: string; lines: string[]; options: Array<{ id: string; label: string }> } {
  const ds = doomDistricts(run);
  const base = baseDoomLevel(doomLedger(run));
  const held = ds.filter((d) => d.control !== 'unclaimed');
  const ambush = Math.min(D.ambushCap, D.ambushBase + D.ambushPerLevel * base);
  return {
    title: 'The Region of Doom: the Margin',
    lines: [
      'A tenth region, drawn on the edge of the map from everything this run left unfinished. Fourteen districts, eight Evil Gyms, and a chair at the bottom of the Undercroft.',
      `Doom Level ${base} of 5. It falls 0.2 for each district you take back. Streets hold about ${ambush}% ambush odds (shown, not applied in this epilogue).`,
      held.length ? `Held right now: ${held.map((d) => `${d.name} (${teamName(d.control)})`).join(', ')}.` : 'No team holds a district: they are all unclaimed.',
      'A loss sends you out of the Margin. It never undoes your win.',
    ],
    options: [{ id: 'enter', label: 'Enter the Margin' }, { id: 'leave', label: 'Leave it' }],
  };
}
