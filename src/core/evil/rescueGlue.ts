// Rival Rescue Plan glue (Beta 0.6 R9): turns the run into what the Rescue screen needs. Pure reads.
// The "node" used by the rescue clock is the run's stage count: region * stages per region + stage index.

import type { Content } from '../contentSchema';
import { getCampaign, runCampaign } from '../regions';
import { overhaulOf } from '../rivals/overhaul';
import type { RunState } from '../state';
import { offerDue, rescueOf, RESCUE, type Archetype, type Offer, type RescueCtx } from './rescue';

/** The node counter the rescue clock runs on. Impound and offers must use the same number. */
export function rescueNode(content: Content, run: RunState): number {
  const per = runCampaign(content, run).stagesPerRegion;
  return run.regionIndex * per + (run.stage?.index ?? 0);
}

/** The last stage of the current region (the quiet node before the climax is the one before it). */
export function lastQuietNodeOfRegion(content: Content, run: RunState): number {
  const per = runCampaign(content, run).stagesPerRegion;
  return run.regionIndex * per + Math.max(0, per - 2);
}

/** The main rival's rescue archetype (its voice), or null when no rival is registered. */
export function rescueArchetype(run: RunState): Archetype | null {
  const main = Object.entries(run.expansion?.rival ?? {}).find(([, r]) => r.role === 'main')?.[1];
  return main ? (RESCUE.personalityArchetype[main.personality] ?? null) : null;
}

/** What the plan formula and the plan menu read. Intel comes from the run flag `intel`; a Defector of the region's team is someone inside. Operational Strength and trade items belong to other systems and read as none. */
export function rescueCtxFor(run: RunState): RescueCtx | null {
  const archetype = rescueArchetype(run);
  if (!archetype) return null;
  const intel = Math.min(100, Math.max(0, Number(run.story.flags['ev:intel'] ?? 0)) * RESCUE.tuning.intelPerPoint);
  const defector = !!run.story.evil?.defector;
  return { archetype, money: run.money, intel, os: 0, insider: defector, defector, tradeItem: false };
}

/** The offer to show on the map right now (a quiet moment: no pending battle), with the context to show it. */
export function pendingRescue(content: Content, run: RunState): { offer: Offer; ctx: RescueCtx; node: number } | null {
  if (!run.expansion?.rescue || run.phase !== 'map' || rescueOf(run).holds.every((h) => h.pokemon.length === 0)) return null;
  const ctx = rescueCtxFor(run);
  if (!ctx) return null;
  const node = rescueNode(content, run);
  const offer = offerDue(run, node, true);
  return offer ? { offer, ctx, node } : null;
}

/** A rescue plan already running at a quiet moment (after a guard fight, or a reload at the Door): the map reopens the Rescue screen where it left off. */
export function runningRescue(content: Content, run: RunState): { ctx: RescueCtx; node: number } | null {
  if (run.phase !== 'map' || !run.expansion?.rescue?.active) return null;
  const ctx = rescueCtxFor(run);
  return ctx ? { ctx, node: rescueNode(content, run) } : null;
}
