// Regions and the campaign around them (GAME_DESIGN.md §4): regular regions
// in a random order, each visited once, with the Grand Region last. A region
// is 8 themed stages, then its Pokémon League (Elite Four, then champion).
// Each region raises the level cap (director decision D14).

import type { Boss, BossRole, Campaign, Content, Region, TypeName } from './contentSchema';
import { Rng, hashSeed } from './rng';
import { isHardcore } from './nuzlocke';
import { modifierLevelCap } from './rules';
import type { RunState } from './state';

export function getCampaign(content: Content, id: string): Campaign {
  const campaign = content.campaigns.get(id);
  if (!campaign) throw new Error(`Unknown campaign "${id}"`);
  return campaign;
}

import { BASE_STAGE_COLUMNS } from './stageLength';
export { BASE_STAGE_COLUMNS };
/** Every full-size stage gets this many extra nodes by default (30 instead of 20). */
export const STAGE_LENGTH_DEFAULT_BONUS = 10;
/** The `stageLength` setting: how many nodes to take off (−10) or add (+20) on top of the default. */
export const STAGE_LENGTH_RANGE = { min: -10, max: 20 } as const;

/** How many nodes a stage has for a campaign and a stage-length setting. Short test campaigns (under 20) and Story campaigns are left alone. */
export function stageColumnsFor(campaign: Pick<Campaign, 'columns'> & Partial<Pick<Campaign, 'mode'>>, stageLength = 0): number {
  // Story campaigns place their stops by authored column, so they keep the old length.
  if (campaign.columns < BASE_STAGE_COLUMNS || campaign.mode === 'story') return campaign.columns;
  const offset = Math.max(STAGE_LENGTH_RANGE.min, Math.min(STAGE_LENGTH_RANGE.max, Math.round(stageLength)));
  return campaign.columns + STAGE_LENGTH_DEFAULT_BONUS + offset;
}

/** A pacing column or step written for a 20-node stage, moved onto a stage of `columns` nodes (never the gym column). */
export function scaleColumn(column: number, columns: number): number {
  // Short test and Story campaigns keep their authored columns; only longer stages stretch.
  if (columns <= BASE_STAGE_COLUMNS) return Math.max(1, Math.min(columns - 1, column));
  return Math.max(1, Math.min(columns - 1, Math.round((column * columns) / BASE_STAGE_COLUMNS)));
}

/** The campaign as this run plays it: the same campaign with the run's own stage length (older runs keep their old one). */
export function runCampaign(content: Content, run: Pick<RunState, 'campaignId'> & { expansion?: { stageCols?: number | undefined } | undefined }): Campaign {
  return withStageColumns(getCampaign(content, run.campaignId), run.expansion?.stageCols);
}

/** A copy of the campaign with `cols` columns and its trainer-column ranges stretched to match. */
export function withStageColumns(campaign: Campaign, cols: number | undefined): Campaign {
  if (!cols || cols === campaign.columns) return campaign;
  const scale = (n: number) => scaleColumn(n, cols);
  return { ...campaign, columns: cols, trainerColumns: campaign.trainerColumns.map(([a, b]) => [scale(a), Math.max(scale(a), scale(b))] as [number, number]) };
}

export function getRegion(content: Content, id: string): Region {
  const region = content.regions.get(id);
  if (!region) throw new Error(`Unknown region "${id}"`);
  return region;
}

/** A shuffled list of regular regions (as many as the campaign wants), then the Grand Region if it has one. */
export function generateRegionOrder(content: Content, campaign: Campaign, rng: Rng, chosen: string | null = null, boost?: { seed: string; weights: Record<string, number> }): string[] {
  if (campaign.regions) return [...campaign.regions]; // a fixed order (the Orrery Circuit): no roll
  // Story-only regions are left out before the shuffle, so every Classic roll stays where it was.
  const all = [...content.regions.values()].filter((r) => !r.story);
  const shuffled = rng.shuffle(all.filter((r) => !r.grand).map((r) => r.id));
  // A chosen region (Regional Circuit) replaces the random pick, after the shuffle so no later roll moves.
  // A Game Event can make some regions likelier to open the run: a weighted first pick from its own seed-derived
  // generator (no map roll is spent), then the rest keep their shuffled order. Off (no weights) leaves every roll as it was.
  if (boost && Object.keys(boost.weights).length > 0 && !(campaign.regularRegions === 1 && chosen) && shuffled.length > 1) {
    const w = shuffled.map((id) => boost.weights[id] ?? 1);
    let roll = new Rng(hashSeed(`${boost.seed}::first-region`)).float() * w.reduce((a, b) => a + b, 0);
    let at = 0;
    while (at < w.length - 1 && roll >= w[at]!) { roll -= w[at]!; at++; }
    shuffled.unshift(...shuffled.splice(at, 1));
  }
  const regular = campaign.regularRegions === 1 && chosen && shuffled.includes(chosen) ? [chosen] : shuffled.slice(0, campaign.regularRegions);
  const grand = campaign.grandRegion ? all.filter((r) => r.grand).map((r) => r.id) : [];
  return [...regular, ...grand];
}

/** The region the run is in now. */
export function currentRegion(content: Content, run: RunState): Region {
  const id = run.regionOrder[run.regionIndex];
  if (!id) throw new Error(`The run has no region ${run.regionIndex + 1}`);
  return getRegion(content, id);
}

/**
 * The highest level any Pokémon can reach in a region: levelCapStart + levelCapStep × region number
 * (100, 150, 200, ...), never above balance.difficulty.maxLevel (D14).
 */
export function levelCap(content: Content, regionIndex: number): number {
  const { levelCapStep, levelCapStart, maxLevel } = content.balance.difficulty;
  return Math.min(maxLevel, (levelCapStart ?? levelCapStep) + levelCapStep * regionIndex);
}

/**
 * The level enemies climb toward in a region: levelCapStep × region number (50, 100, ...), never above maxLevel.
 * Kept apart from the party's level cap (Kice 2026-11-07) so the enemy curve and boss teams did not change.
 */
export function curveCap(content: Content, regionIndex: number): number {
  const { levelCapStep, maxLevel } = content.balance.difficulty;
  return Math.min(maxLevel, levelCapStep * (regionIndex + 1));
}

/** The level cap for the region the run is in now. */
export function runLevelCap(content: Content, run: Pick<RunState, 'regionIndex'> & Partial<Pick<RunState, 'stage' | 'campaignId' | 'rules'>>): number {
  const cup = run.rules ? modifierLevelCap(run.rules) : null;
  const region = Math.min(levelCap(content, run.regionIndex), cup ?? Infinity);
  if (!run.stage || run.stage.kind !== 'stage' || !run.campaignId) return region;
  // Hardcore Nuzlocke: no margin over the stage's last enemy.
  const margin = run.rules && isHardcore(run.rules) ? content.balance.difficulty.stageCapMargin : 0;
  return Math.min(region, stageLevelCap(content, runCampaign(content, run as Pick<RunState, 'campaignId' | 'expansion'>), run.regionIndex, run.stage.index) - margin);
}

/** What the party may reach in a stage: the level of that stage's last wild enemy plus balance.difficulty.stageCapMargin. */
export function stageLevelCap(content: Content, campaign: Campaign, regionIndex: number, stageIndex: number): number {
  const cfg = content.balance.difficulty;
  const cap = curveCap(content, regionIndex);
  const start = regionIndex === 0 ? cfg.baseLevel : curveCap(content, regionIndex - 1);
  const end = Math.max(start, cap - cfg.capMargin);
  const total = campaign.stagesPerRegion * campaign.columns - 1;
  const t = Math.min(1, ((stageIndex + 1) * campaign.columns - 1) / Math.max(1, total));
  return Math.min(cap, Math.round(start + (end - start) * Math.pow(t, cfg.curve)) + cfg.stageCapMargin);
}

/** Picks someone not used yet: from `local` first, then from everyone, then (if all are used) anyone. */
function pickFresh<T extends { id: string }>(all: T[], local: readonly string[], used: Set<string>, rng: Rng): T {
  const fresh = all.filter((p) => !used.has(p.id));
  const localFresh = fresh.filter((p) => local.includes(p.id));
  for (const list of [localFresh, fresh, all]) if (list.length > 0) return rng.pick(list);
  throw new Error('No one to pick');
}

/** The region's Elite Four (in battle order) and champion, none of them met before this run. Any boss can take either role. */
export function pickLeague(content: Content, region: Region, campaign: Campaign, used: readonly string[], rng: Rng): { eliteFour: string[]; champion: string } {
  const taken = new Set(used);
  const eliteFour: string[] = [];
  const all: Boss[] = [...content.bosses.values()].filter((b) => !b.story);
  for (let i = 0; i < campaign.eliteFourSize; i++) {
    const member = pickFresh(all, region.eliteFour, taken, rng);
    taken.add(member.id);
    eliteFour.push(member.id);
  }
  const champion = pickFresh(all, region.champions, taken, rng);
  return { eliteFour, champion: champion.id };
}

export type { BossRole };

export interface BossInfo {
  role: BossRole;
  name: string;
  /** "Gym Leader Brock", "Elite Four Lorelei", "Champion Lance". */
  title: string;
  /** The portrait for this role (a boss can have a champion outfit, for example). */
  spriteAssetId: string;
  types: TypeName[];
}

const ROLE_TITLES: Record<BossRole, string> = { gym: 'Gym Leader', elite: 'Elite Four', champion: 'Champion' };

export function getBoss(content: Content, id: string): Boss {
  const boss = content.bosses.get(id);
  if (!boss) throw new Error(`Unknown boss "${id}"`);
  return boss;
}

/** Looks up a gym leader, Elite Four member or champion by id and role. */
export function bossInfo(content: Content, role: BossRole, id: string): BossInfo {
  const person = getBoss(content, id);
  return { role, name: person.name, title: `${ROLE_TITLES[role]} ${person.name}`, spriteAssetId: person.sprites[role] ?? person.sprites.default, types: person.types };
}

/** Every portrait any boss uses (for loading assets). */
export function bossSpriteIds(content: Content): string[] {
  return [...content.bosses.values()].flatMap((b) => Object.values(b.sprites).filter((id): id is string => Boolean(id)));
}
