// Choice scenes, the rival relationship record and hidden consequences (Story Overhaul W3, design 14.18 to 14.21).
// A scene's choice writes four deltas to the rival's relationship record, bridges to the live `ev:rival-friend` and
// `ev:rival-heat` flags (so rivalPath, Living Rival events and the finale assist keep working), and may queue a
// hidden consequence that surfaces 0 to 4 stages later, exactly once, even across save and load (the queue and the
// fired list live in run.story.v2, inside the v40 container). Nothing here draws from a gameplay RNG stream.

import { z } from 'zod';
import json from '../../data/rivalScenes.json';
import { FRIEND_FLAG, HEAT_FLAG } from '../rivals/living';
import { addReputation, type RepCategory } from '../rivals/reputation';
import { voiceOf } from '../rivals/voice';
import type { RunState } from '../state';
import { fnv1a } from '../story/moments';
import type { Rival } from '../story/schema';

const Rel = z.object({ respect: z.number().int(), rivalry: z.number().int(), affection: z.number().int(), suspicion: z.number().int() });
export const ScenesSchema = z.object({
  note: z.string(),
  limits: z.object({ choice: z.number().int().min(1), scene: z.number().int().min(1) }),
  scenes: z.array(z.object({
    id: z.string(), place: z.string(), hidden: z.string(), intro: z.string(), keyChoice: z.string(),
    choices: z.array(z.object({ id: z.string(), label: z.string(), rel: Rel, reply: z.string(), hidden: z.string().optional() })).min(2).max(4),
    reactions: z.record(z.string(), z.string()),
  })),
  consequences: z.record(z.string(), z.object({ min: z.number().int().min(0), max: z.number().int().min(0), cap: z.number().int().min(1), line: z.string(), flags: z.array(z.string()), rep: z.object({ category: z.string(), gain: z.string() }).optional() })),
});
export const SCENES = ScenesSchema.parse(json);
export type Scene = (typeof SCENES.scenes)[number];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const fill = (text: string, rival: string) => text.replace(/\{rival\}/g, rival);
/** A linear stage number (stages per region never exceed 30), used to schedule consequences. */
export const stageNumber = (run: Pick<RunState, 'regionIndex' | 'stage'>): number => run.regionIndex * 30 + (run.stage?.index ?? 0);

export interface RelRecord { respect: number; rivalry: number; affection: number; suspicion: number; met: boolean; gates: string[] }
export const freshRel = (): RelRecord => ({ respect: 0, rivalry: 0, affection: 0, suspicion: 0, met: true, gates: [] });

function v2(run: RunState) {
  const s = run.story.v2;
  if (!s) throw new Error('Choice scenes need a Story Run (run.story.v2)');
  return s;
}
export const relOf = (run: RunState, rivalId: string): RelRecord => (v2(run).rel[rivalId] ??= freshRel());

/** Where a scene may be offered: it has not been played with this rival yet. */
export const sceneAvailable = (run: RunState, sceneId: string, rivalId: string): boolean => !v2(run).scenesDone.includes(`${sceneId}:${rivalId}`);
export const sceneById = (id: string): Scene | undefined => SCENES.scenes.find((s) => s.id === id);

/** The four deltas of a choice, limited to +/-8 each (data is also checked by a test). */
function limited(rel: z.infer<typeof Rel>, cap: number) {
  return { respect: clamp(rel.respect, -cap, cap), rivalry: clamp(rel.rivalry, -cap, cap), affection: clamp(rel.affection, -cap, cap), suspicion: clamp(rel.suspicion, -cap, cap) };
}

export interface SceneResult { reply: string; reaction: string | null; deltas: z.infer<typeof Rel> }

/**
 * Plays a choice: writes the relationship deltas (record clamped to 0..100), bridges to the live flags, sets the
 * hidden flag and queues its consequence. Returns what to show. Playing the same scene with the same rival twice is refused.
 */
export function playChoice(run: RunState, rival: Pick<Rival, 'id' | 'name' | 'voice' | 'archetype' | 'traits'>, sceneId: string, choiceId: string): SceneResult {
  const scene = sceneById(sceneId);
  const choice = scene?.choices.find((c) => c.id === choiceId);
  if (!scene || !choice) throw new Error(`Unknown scene choice ${sceneId}/${choiceId}`);
  if (!sceneAvailable(run, sceneId, rival.id)) throw new Error(`Scene ${sceneId} was already played with ${rival.id}`);
  const state = v2(run);
  state.scenesDone.push(`${sceneId}:${rival.id}`);
  const rel = relOf(run, rival.id);
  const d = limited(choice.rel, SCENES.limits.choice);
  rel.respect = clamp(rel.respect + d.respect, 0, 100);
  rel.rivalry = clamp(rel.rivalry + d.rivalry, 0, 100);
  rel.affection = clamp(rel.affection + d.affection, 0, 100);
  rel.suspicion = clamp(rel.suspicion + d.suspicion, 0, 100);
  // Bridge rule: positive Affection feeds the friend flag, positive Rivalry or Suspicion the heat flag.
  const flags = run.story.flags;
  if (d.affection > 0) flags[FRIEND_FLAG] = Number(flags[FRIEND_FLAG] ?? 0) + d.affection;
  const heat = Math.max(0, d.rivalry) + Math.max(0, d.suspicion);
  if (heat > 0) flags[HEAT_FLAG] = Number(flags[HEAT_FLAG] ?? 0) + heat;
  if (choice.hidden) {
    flags[`hid:${choice.hidden}`] = 1;
    queueConsequence(run, rival.id, choice.hidden);
  }
  const reaction = choiceId === scene.keyChoice ? (scene.reactions[voiceOf(rival)] ?? scene.reactions.default ?? null) : null;
  return { reply: fill(choice.reply, rival.name), reaction: reaction ? fill(reaction, rival.name) : null, deltas: d };
}

/** Queues a hidden consequence, if the data has one for it and its per-run cap is not used up. */
export function queueConsequence(run: RunState, rivalId: string, hidden: string): boolean {
  const c = SCENES.consequences[hidden];
  if (!c) return false;
  const state = v2(run);
  const used = state.queue.filter((q) => q.hidden === hidden).length + state.fired.filter((f) => f.split('|')[1] === hidden).length;
  if (used >= c.cap) return false;
  const span = c.max - c.min;
  const id = `${hidden}|${rivalId}|${used}`;
  const delay = c.min + (span > 0 ? fnv1a(`${run.seed}::${id}`) % (span + 1) : 0);
  state.queue.push({ id, hidden, rival: rivalId, due: stageNumber(run) + delay });
  return true;
}

export interface Surfaced { id: string; hidden: string; rival: string; line: string }

/**
 * The consequences due now. Each fires exactly once: it leaves the queue and is recorded in `fired` in the same step, so a
 * save and reload between calls cannot show it twice. Sets its flags and adds its reputation gain.
 */
export function surfaceConsequences(run: RunState, rivalName: (id: string) => string = (id) => id): Surfaced[] {
  const state = v2(run);
  const now = stageNumber(run);
  const due = state.queue.filter((q) => q.due <= now && !state.fired.includes(q.id));
  const out: Surfaced[] = [];
  for (const q of due.sort((a, b) => a.due - b.due || a.id.localeCompare(b.id))) {
    const c = SCENES.consequences[q.hidden];
    state.queue = state.queue.filter((x) => x.id !== q.id);
    state.fired.push(q.id);
    if (!c) continue;
    for (const f of c.flags) run.story.flags[f] = 1;
    if (c.rep) addReputation(run, c.rep.category as RepCategory, c.rep.gain);
    out.push({ id: q.id, hidden: q.hidden, rival: q.rival, line: fill(c.line, rivalName(q.rival)) });
  }
  return out;
}

export interface RelState { stage: 'neutral' | 'acquainted' | 'friendly' | 'trusted' | 'close' | 'disliked' | 'hostile' | 'nemesis'; flavors: ('respected' | 'competitive' | 'rivalry')[] }

/**
 * The spec's relationship state from the four attributes (design 14.21). Top and bottom stages always need a gate event,
 * so a number alone never reaches Close or Nemesis. Competitive, Respected and Rivalry are flavors on top of a stage.
 */
export function relState(rel: RelRecord): RelState {
  const g = (id: string) => rel.gates.includes(id);
  const flavors: RelState['flavors'] = [];
  if (rel.respect >= 50) flavors.push('respected');
  if (rel.rivalry >= 40) flavors.push('competitive');
  if (rel.rivalry >= 70) flavors.push('rivalry');
  let stage: RelState['stage'] = 'neutral';
  const disliked = rel.affection < 15 && rel.suspicion >= 50;
  if (disliked) stage = g('negative_scene') ? (g('betrayal') ? 'nemesis' : 'hostile') : 'disliked';
  else if (rel.affection >= 75 && g('share_a_secret')) stage = 'close';
  else if (rel.affection >= 60 && rel.respect >= 50 && g('share_a_risk')) stage = 'trusted';
  else if (rel.respect + rel.affection >= 80 && rel.affection >= 30) stage = 'friendly';
  else if (rel.met && rel.respect + rel.affection >= 40) stage = 'acquainted';
  return { stage, flavors };
}
