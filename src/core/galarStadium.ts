import { z } from 'zod';
import stadiumJson from '../data/galarStadium.json';
import { hasKeyItem } from './battle/transform';
import type { Content } from './contentSchema';
import { bossRoleForClass } from './encounters';
import { addItem } from './items';
import { maxHp } from './pokemon';
import { currentRegion } from './regions';
import { hashSeed, Rng } from './rng';
import type { RunState } from './state';

/**
 * Galar Gym Challenge presentation (Beta 0.5, section 1.1 and 1.2): a televised stadium event.
 * Everything here is presentation only. It decides which crowd cue, camera cut and Champion line to show,
 * from a seed derived for the purpose, so it never touches the gameplay RNG streams and a skipped or failed
 * cue never changes a battle.
 */

export const CROWD_BEATS = ['bigHit', 'survived', 'evolve', 'dynamax', 'comeback', 'knockOut', 'tense', 'lastMon', 'calm'] as const;
export type CrowdBeat = (typeof CROWD_BEATS)[number];

const BeatSchema = z.enum(CROWD_BEATS);
const StadiumSchema = z.object({
  hostDefault: z.string().min(1),
  music: z.object({ buildUp: z.string(), battle: z.string(), finalMon: z.string(), note: z.string() }),
  cameraBalance: z.object({ maxPerBattle: z.number().int().min(0).max(8), minTurnsBetween: z.number().int().min(0), durationMs: z.number().int().min(300).max(4000), skippable: z.boolean() }),
  crowd: z.record(BeatSchema, z.object({ cue: z.string(), intensity: z.number().int().min(1).max(5) })),
  cameraCuts: z.array(z.object({
    id: z.string().min(1), label: z.string().min(1), beats: z.array(BeatSchema).min(1), weight: z.number().positive(), caption: z.string().min(1),
    needsImpressive: z.boolean().optional(), needsRival: z.boolean().optional(),
  })).min(6),
  bandIntro: z.object({ flag: z.string(), grantsItem: z.string(), hasBand: z.array(z.string()).min(1), givesBand: z.array(z.string()).min(2) }),
  hostLines: z.array(z.object({ id: z.string(), phase: z.enum(['welcome', 'early', 'mid', 'late', 'peer']), variant: z.enum(['any', 'struggling', 'impressive']), text: z.string() })).min(8),
});
export type GalarStadiumData = z.infer<typeof StadiumSchema>;
export const GALAR_STADIUM: GalarStadiumData = StadiumSchema.parse(stadiumJson);

export type HostPhase = 'welcome' | 'early' | 'mid' | 'late' | 'peer';

/** How far into the Gym Challenge the player is: gym 1 is the welcome, then it warms up to treating the player as a peer. */
export function hostPhase(gymNumber: number): HostPhase {
  if (gymNumber <= 1) return 'welcome';
  if (gymNumber <= 3) return 'early';
  if (gymNumber <= 5) return 'mid';
  if (gymNumber <= 7) return 'late';
  return 'peer';
}

export interface Performance {
  /** Losses at gyms this run so far (a loss never ends a Galar run, it only colours the Champion's line). */
  recentLosses: number;
  /** The last gym was won with no Pokémon fainted, or in few turns. */
  lastWasImpressive: boolean;
}

function lineRng(runSeed: string, gymNumber: number): Rng {
  return new Rng(hashSeed(`galar-stadium:host:${runSeed}:${gymNumber}`));
}

/** The Champion's pre-battle line for this gym. Struggling and impressive variants are used when they apply and a line exists; otherwise a plain one. */
export function hostLine(runSeed: string, gymNumber: number, perf: Performance, hostName: string): { id: string; text: string } {
  const phase = hostPhase(gymNumber);
  const variant = perf.lastWasImpressive ? 'impressive' : perf.recentLosses > 0 ? 'struggling' : 'any';
  const inPhase = GALAR_STADIUM.hostLines.filter((l) => l.phase === phase);
  const exact = inPhase.filter((l) => l.variant === variant);
  const pool = exact.length > 0 ? exact : inPhase.filter((l) => l.variant === 'any');
  const line = lineRng(runSeed, gymNumber).pick(pool);
  return { id: line.id, text: line.text.replaceAll('{host}', hostName) };
}

export interface BandIntro { lines: string[]; grantsItem: string | null; flag: string }

/** The first-gym scene. Acknowledges a Band the player already owns, otherwise the Champion hands one over. `null` once it has been seen. */
export function bandIntro(hasBand: boolean, flags: Readonly<Record<string, number>>, hostName: string): BandIntro | null {
  const data = GALAR_STADIUM.bandIntro;
  if ((flags[data.flag] ?? 0) > 0) return null;
  const lines = (hasBand ? data.hasBand : data.givesBand).map((l) => l.replaceAll('{host}', hostName));
  return { lines, grantsItem: hasBand ? null : data.grantsItem, flag: data.flag };
}

export interface CrowdReaction { cue: string; intensity: number; music: string }

/** What the crowd does on a beat of the battle. The music steps up for the last Pokémon on either side. */
export function crowdReaction(beat: CrowdBeat): CrowdReaction {
  const c = GALAR_STADIUM.crowd[beat];
  if (!c) throw new Error(`No crowd reaction for ${beat}`);
  return { cue: c.cue, intensity: c.intensity, music: beat === 'lastMon' ? GALAR_STADIUM.music.finalMon : GALAR_STADIUM.music.battle };
}

export interface CutContext {
  runSeed: string;
  battleId: string;
  turn: number;
  beat: CrowdBeat;
  /** Cuts already shown in this battle, and the turn of the last one (null when none). */
  shown: number;
  lastCutTurn: number | null;
  /** The Champion is impressed (a strong comeback or a flawless run); lets the champion's silhouette cut appear. */
  impressive: boolean;
  /** A rival is in the audience for this match. */
  rivalWatching: boolean;
}

export interface CameraCut { id: string; label: string; caption: string; durationMs: number; skippable: boolean }

/** Picks a brief stadium camera cut for a battle beat, or null. Cuts are contextual (they only fit certain beats), rare, and never closer together than the balance gap. */
export function pickCameraCut(ctx: CutContext): CameraCut | null {
  const bal = GALAR_STADIUM.cameraBalance;
  if (ctx.shown >= bal.maxPerBattle) return null;
  if (ctx.lastCutTurn !== null && ctx.turn - ctx.lastCutTurn < bal.minTurnsBetween) return null;
  const options = GALAR_STADIUM.cameraCuts.filter((c) => c.beats.includes(ctx.beat) && (!c.needsImpressive || ctx.impressive) && (!c.needsRival || ctx.rivalWatching));
  if (options.length === 0) return null;
  const rng = new Rng(hashSeed(`galar-stadium:cut:${ctx.runSeed}:${ctx.battleId}:${ctx.turn}`));
  // Not every beat gets a cut: roughly one in three, so the battle camera stays the main view.
  if (!rng.chance(0.35)) return null;
  const cut = rng.weighted(options.map((o) => ({ item: o, weight: o.weight })));
  return { id: cut.id, label: cut.label, caption: cut.caption, durationMs: bal.durationMs, skippable: bal.skippable };
}

// ---------- wiring helpers (read the run; the only write is the Band intro) ----------

/** A Galar Gym Challenge battle: a gym leader fight in the Galar region (the stadium shows only there). */
export function isGalarStadiumBattle(content: Content, run: RunState): boolean {
  if (run.regionOrder.length === 0 || run.battle?.trainer == null) return false;
  if (bossRoleForClass(run.battle.trainer.classId) !== 'gym') return false;
  return currentRegion(content, run).id === 'galar';
}

/** Which gym of the Challenge this is (1 = first): badges won so far plus this one. */
export function galarGymNumber(run: RunState): number {
  return run.badges.length + 1;
}

/** How the player arrives: hurt (fainted Pokémon or low HP) reads as struggling, an untouched healthy party as impressive. Derived from the party, so nothing extra is saved. */
export function galarPerformance(content: Content, run: RunState): Performance {
  const party = run.party;
  if (party.length === 0) return { recentLosses: 0, lastWasImpressive: false };
  const share = party.reduce((n, m) => n + m.hp / Math.max(1, maxHp(content, m)), 0) / party.length;
  const fainted = party.filter((m) => m.hp <= 0).length;
  return { recentLosses: fainted > 0 || share < 0.5 ? 1 : 0, lastWasImpressive: fainted === 0 && share >= 0.9 && run.badges.length >= 2 };
}

/** The Champion who hosts this run's Challenge: the run's Galar champion if cast, else Leon. */
export function galarHost(content: Content, run: RunState): { id: string; name: string } {
  const id = run.roleCast.find((c) => c.role === 'champion' && c.regionIndex === run.regionIndex)?.id ?? GALAR_STADIUM.hostDefault;
  return { id, name: content.bosses.get(id)?.name ?? 'The Champion' };
}

const BAND_FLAG = () => GALAR_STADIUM.bandIntro.flag;

/**
 * Plays the first-gym Band intro once: marks it seen and, if the player has no Dynamax Band, gives one. Returns the lines to show, or null if already seen.
 * Mutates `run`; the caller saves it.
 */
export function claimBandIntro(content: Content, run: RunState): BandIntro | null {
  const flags: Record<string, number> = { [BAND_FLAG()]: Number(run.story.flags[BAND_FLAG()] ?? 0) };
  const intro = bandIntro(hasKeyItem(content, run.inventory, 'dynamax'), flags, galarHost(content, run).name);
  if (!intro) return null;
  run.story.flags[intro.flag] = 1;
  if (intro.grantsItem) addItem(run.inventory, intro.grantsItem, 1);
  return intro;
}
