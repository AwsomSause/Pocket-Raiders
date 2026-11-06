// Story Overhaul S9: the Orrery Circuit's original cast and badge rules (Part IV-D). Pure helpers, no gameplay RNG.
// 8 gym towns per region, 2 leaders each (a Gym Fork); 6 of the 8 badges let a run leave a region. The 9 authored towns hold the
// 18 original leaders; the other 15 hold pool leaders. The cast is drawn once from hash streams of the run seed (`circuit_cast`,
// `circuit_fork`), so no other roll moves, and it is stored in `run.story.v2.circuit` so a reload gives the same leaders.
import { z } from 'zod';
import raw from '../../data/story/circuitCast.json';
import { excludedIds, record } from '../rolePool';
import type { Boss, Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { CircuitStateSchema, type CircuitState } from '../story2/schema';
import { isStoryCampaign } from './circuit';

const Prose = z.string();
const Sprite = z.string().regex(/^(boss\.drive|trainer\.pr|trainer\.drive)\//);
export const CircuitCastSchema = z.object({
  v: z.literal(1),
  source: z.string(),
  towns: z.array(z.object({ region: z.number().int().min(0).max(2), stage: z.number().int().min(1).max(8), town: z.string(), regionGate: z.boolean(), act: z.number().int().nullable(), authored: z.array(z.string()), pool: z.boolean() })).length(24),
  leaders: z.array(z.object({
    id: z.string(), name: z.string(), region: z.number().int(), type: z.string(), town: z.string(), badge: z.string(), badgeIcon: z.string(), age: z.number().int(), persona: Prose, ace: z.string(), conflict: Prose, hook: Prose,
    scene: z.object({ id: z.string(), title: z.string(), setting: Prose, lines: z.array(Prose).min(2), choices: z.array(z.object({ label: Prose, outcome: Prose })).length(3) }),
    pre: Prose, mid: Prose, win: Prose, lose: Prose, likes: z.array(Prose).min(1), dislikes: z.array(Prose), badgeStory: Prose, sprite: Sprite, signature: z.array(z.string()).min(3),
  })).length(18),
  elite: z.array(z.object({ id: z.string(), name: z.string(), slot: z.number().int().min(1).max(4), epithet: z.string(), age: z.number().int(), types: z.array(z.string()).min(1), personality: Prose, motivation: Prose, strategy: Prose, ace: Prose, scenes: z.array(Prose).length(5), sprite: Sprite, signature: z.array(z.string()).min(3) }).passthrough()).length(4),
  champion: z.object({ id: z.string(), name: z.string(), types: z.array(z.string()), ace: Prose, sprite: Sprite, signature: z.array(z.string()).min(3) }).passthrough(),
  ashdown: z.object({ id: z.string(), name: z.string(), ace: Prose, sprite: Sprite }).passthrough(),
  teams: z.array(z.object({ id: z.string(), name: z.string() })).length(6),
  teamLeaders: z.array(z.object({ id: z.string(), name: z.string(), team: z.string().nullable(), sprite: Sprite }).passthrough()).length(5),
  lieutenants: z.array(z.object({ id: z.string(), name: z.string(), team: z.string().nullable(), sprite: Sprite }).passthrough()).length(10),
  grunts: z.array(z.object({ id: z.string(), team: z.string(), key: z.string(), line: z.string().max(156) })).length(48),
  overlays: z.array(z.object({ id: z.string(), name: z.string(), region: z.string(), persona: Prose, conflict: Prose, linked: Prose, line: Prose })).length(6),
});
export type CircuitCast = z.infer<typeof CircuitCastSchema>;
export type CircuitLeader = CircuitCast['leaders'][number];

export const CIRCUIT: CircuitCast = CircuitCastSchema.parse(raw);

/** Gym towns per region, badges needed to leave one, passes allowed (Appendix S.2 and S.3). */
export const TOWNS_PER_REGION = 8;
export const BADGES_REQUIRED = 6;
export const PASSES_PER_REGION = TOWNS_PER_REGION - BADGES_REQUIRED;
export const REGIONS = 3;

/** The boss id of an original character (bosses.json, `story: true`). */
export const origBossId = (id: string): string => `orig-${id}`;
const gymKey = (region: number, index: number): number => region * TOWNS_PER_REGION + index;

export const townAt = (region: number, index: number) => CIRCUIT.towns.find((t) => t.region === region && t.stage === index + 1);
const leaderByName = (name: string): CircuitLeader | undefined => CIRCUIT.leaders.find((l) => name.endsWith(l.name.replace(/^Captain /, '')));

/** The Elite Four (in battle order) and the Champion of a Story Run's League: the authored defaults. */
export function authoredLeague(): { eliteFour: string[]; champion: string } {
  return { eliteFour: [...CIRCUIT.elite].sort((a, b) => a.slot - b.slot).map((e) => origBossId(e.id)), champion: origBossId(CIRCUIT.champion.id) };
}

const circuitRng = (seed: string, stream: string): Rng => new Rng(hashSeed(`${seed}::${stream}`));

/** Pool leaders for one town: two bosses of different types, unused, not a rival or the run's evil team leader. */
function poolPair(content: Content, run: RunState, rng: Rng, used: Set<string>, blocked: Set<string>): [string, string] {
  const core = new Set([...content.regions.values()].flatMap((r) => r.gymLeaders));
  const fresh = [...content.bosses.values()].filter((b) => !b.story && core.has(b.id) && !used.has(b.id) && !blocked.has(b.id));
  const fallback = [...content.bosses.values()].filter((b) => !b.story && !used.has(b.id));
  const draw = (list: Boss[], not?: Boss): Boss => {
    const diff = list.filter((b) => b.id !== not?.id && (!not || b.types[0] !== not.types[0]));
    return rng.pick(diff.length > 0 ? diff : list.filter((b) => b.id !== not?.id));
  };
  const first = draw(fresh.length >= 2 ? fresh : fallback);
  const second = draw(fresh.length >= 2 ? fresh : fallback, first);
  used.add(first.id);
  used.add(second.id);
  return [first.id, second.id];
}

/** Builds the 24-town cast. Authored towns keep their two leaders (door order from `circuit_fork`); pool towns draw from `circuit_cast`. */
export function buildCircuitCast(content: Content, run: RunState): CircuitState['cast'] {
  const castRng = circuitRng(run.seed, 'circuit_cast');
  const forkRng = circuitRng(run.seed, 'circuit_fork');
  const used = new Set<string>();
  const blocked = excludedIds(content, run);
  const out: CircuitState['cast'] = [];
  for (let region = 0; region < REGIONS; region++) {
    for (let index = 0; index < TOWNS_PER_REGION; index++) {
      const town = townAt(region, index)!;
      const ids: [string, string] = town.pool ? poolPair(content, run, castRng, used, blocked) : (town.authored.map((n) => origBossId(leaderByName(n)!.id)) as [string, string]);
      const swap = forkRng.chance(0.5);
      out.push({ doors: swap ? [ids[1], ids[0]] : ids });
    }
  }
  return out;
}

/** The run's Circuit state, built once (and rebuilt if a stored door no longer resolves). Null for Classic runs. */
export function ensureCircuit(content: Content, run: RunState): CircuitState | null {
  if (!isStoryCampaign(content, run.campaignId) || !run.story.v2) return null;
  const v2 = run.story.v2;
  const c = v2.circuit ?? CircuitStateSchema.parse({});
  const ok = c.cast.length === REGIONS * TOWNS_PER_REGION && c.cast.every((t) => t.doors.every((id) => content.bosses.has(id)));
  if (!ok) c.cast = buildCircuitCast(content, run);
  v2.circuit = c;
  return c;
}

/** The two leaders of a gym stage, in door order. */
export function forkOf(content: Content, run: RunState, region: number, index: number): [string, string] | null {
  return ensureCircuit(content, run)?.cast[gymKey(region, index)]?.doors ?? null;
}

/** Enters a door (the first one unless the player chose): records the choice and marks the other leader passed over. Returns the boss id. */
export function chooseDoor(content: Content, run: RunState, region: number, index: number, door?: 0 | 1): string | null {
  const c = ensureCircuit(content, run);
  const doors = c?.cast[gymKey(region, index)]?.doors;
  if (!c || !doors) return null;
  const key = String(gymKey(region, index));
  const id = c.chosen[key] ?? doors[door ?? 0];
  c.chosen[key] = id;
  const other = doors.find((d) => d !== id)!;
  if (!c.passedOver.includes(other)) c.passedOver.push(other);
  if (!c.met.includes(id)) c.met.push(id);
  return id;
}

/** Counted badges won in a region (guest badges never count). */
export const countedBadges = (c: CircuitState, region: number): number => c.badges.filter((b) => b.counted && b.regionId === region).length;

/** Records a won gym (or Guest Match) badge once. */
export function recordBadge(c: CircuitState, leaderId: string, region: number, source: 'gym' | 'guest'): boolean {
  if (c.badges.some((b) => b.leaderId === leaderId)) return false;
  c.badges.push({ leaderId, regionId: region, counted: source === 'gym', source });
  if (source === 'guest') c.merit += 1;
  return true;
}

/** A town may be passed while the region still has passes left. Passing marks both leaders passed over (unmet, so they only write a letter). */
export function passTown(content: Content, run: RunState, region: number, index: number): boolean {
  const c = ensureCircuit(content, run);
  const doors = c?.cast[gymKey(region, index)]?.doors;
  if (!c || !doors) return false;
  const key = String(gymKey(region, index));
  const used = c.passed.filter((k) => Math.floor(Number(k) / TOWNS_PER_REGION) === region).length;
  if (c.passed.includes(key) || c.chosen[key] || used >= PASSES_PER_REGION) return false;
  c.passed.push(key);
  for (const d of doors) if (!c.passedOver.includes(d)) c.passedOver.push(d);
  return true;
}

/** A region lets the player leave once 6 counted badges are won. */
export const canLeaveRegion = (c: CircuitState, region: number): boolean => countedBadges(c, region) >= BADGES_REQUIRED;

/** The League Approach needs 18 counted badges, 6 in each region. */
export const leagueGateOpen = (c: CircuitState): boolean => Array.from({ length: REGIONS }, (_, r) => canLeaveRegion(c, r)).every(Boolean);

/** Awards the Region Warden's Charter Seal once (a visual). */
export function awardCharterSeal(c: CircuitState, region: number): boolean {
  if (!canLeaveRegion(c, region) || c.seals.includes(region)) return false;
  c.seals.push(region);
  return true;
}

/** Leaders who may send a Guest Match invitation at a region's Rematch Day: passed over and met. The rest write a letter. */
export function rematchDay(c: CircuitState, region: number): { invitations: string[]; letters: string[] } {
  const inRegion = (id: string): boolean => { const k = c.cast.findIndex((t) => t.doors.includes(id)); return k >= 0 && Math.floor(k / TOWNS_PER_REGION) === region; };
  const over = c.passedOver.filter(inRegion);
  return { invitations: over.filter((id) => c.met.includes(id) && !c.badges.some((b) => b.leaderId === id)), letters: over.filter((id) => !c.met.includes(id)) };
}

/** Takes the region's one Guest Match. Returns false when it is already used or the leader did not invite. */
export function chooseGuestMatch(c: CircuitState, region: number, leaderId: string): boolean {
  if (c.guest[String(region)] || !rematchDay(c, region).invitations.includes(leaderId)) return false;
  c.guest[String(region)] = leaderId;
  return true;
}

/** Called from run.ts when a gym leader is beaten: records the badge for a Story Run's Circuit leader. */
export function noteGymWin(content: Content, run: RunState, leaderId: string): void {
  const c = ensureCircuit(content, run);
  if (!c) return;
  const k = c.cast.findIndex((t) => t.doors.includes(leaderId));
  if (k < 0) return;
  const region = Math.floor(k / TOWNS_PER_REGION);
  const guest = c.guest[String(region)] === leaderId;
  if (recordBadge(c, leaderId, region, guest ? 'guest' : 'gym')) awardCharterSeal(c, region);
}

/** A Story Run's League: the authored Elite Four and Selene, logged on `run.roleCast` like any cast. */
export function castAuthoredLeague(content: Content, run: RunState, regionIndex: number): { eliteFour: string[]; champion: string } {
  const league = authoredLeague();
  league.eliteFour.forEach((id, i) => record(content, run, 'elite', regionIndex, i, id));
  record(content, run, 'champion', regionIndex, 0, league.champion);
  return league;
}

/** The boss who runs the gym at a Story Run stage (the first door unless the player chose another). Null in Classic. */
export function circuitLeader(content: Content, run: RunState, region: number, index: number): Boss | null {
  const id = chooseDoor(content, run, region, index);
  return id ? content.bosses.get(id) ?? null : null;
}
