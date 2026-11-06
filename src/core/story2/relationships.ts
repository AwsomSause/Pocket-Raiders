// Story Overhaul S8: Story Run relationships. Every major NPC has a record (attributes, a computed stage, memories, flags) in
// run.story.v2.cast. Pure functions: no RNG, no clock. Stage rules, deltas, drift, ripples and callbacks follow the design doc's
// "Part IV · The relationship system". Rival Respect/Rivalry for the three story rivals stays in `v2.rel` (W3); this module is for
// the whole cast. Nothing here carries over between runs except the fold at the end (foldCastIntoProfile).
import type { Profile, RunState } from '../state';
import type { StoryV2 } from './schema';

export const ATTRS = ['trust', 'respect', 'affection', 'rivalry', 'suspicion', 'fear', 'loyalty'] as const;
export type Attr = (typeof ATTRS)[number];
export type CastRecord = StoryV2['cast'][string];
export type Deltas = Partial<Record<Attr, number>>;

/** Positive stages (rank 0..7) and negative stages (rank -1..-5). */
export const POSITIVE_STAGES = ['stranger', 'acquaintance', 'familiar', 'interested', 'friendly', 'trusted', 'close', 'devoted'] as const;
export const NEGATIVE_STAGES = ['wary', 'suspicious', 'disliked', 'hostile', 'nemesis'] as const;
export const stageRank = (stage: string): number => {
  const p = POSITIVE_STAGES.indexOf(stage as (typeof POSITIVE_STAGES)[number]);
  if (p >= 0) return p;
  const n = NEGATIVE_STAGES.indexOf(stage as (typeof NEGATIVE_STAGES)[number]);
  return n >= 0 ? -(n + 1) : 0;
};

/** The three gate events that top stages need, and the two that darken the worst ones. */
export const GATES = { trusted: 'share_a_risk', close: 'share_a_secret', devoted: 'choose_them', hostile: 'negative_scene', nemesis: 'betrayal' } as const;
/** An attribute must clear a stage threshold by this much, for a full Node, before the stage changes. */
export const HYSTERESIS = 5;
/** Memories older than this many Nodes are not used for callbacks (unless "never forget"). */
export const CALLBACK_WINDOW = 12;
export const NEVER_FORGET = 10;

export const freshRecord = (): CastRecord => ({ stage: 'stranger', attrs: {}, memories: [], flags: {}, gates: [], mem: [], scenes: 0, pending: null, last: null });
const get = (r: CastRecord, a: Attr): number => r.attrs[a] ?? 0;
const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/** The stage the numbers say right now. `margin` shifts every attribute threshold (positive: harder to reach, negative: easier to keep). */
export function computeStage(r: CastRecord, margin = 0): string {
  const trust = get(r, 'trust'), respect = get(r, 'respect'), affection = get(r, 'affection'), suspicion = get(r, 'suspicion'), loyalty = get(r, 'loyalty');
  const m = margin;
  // Negative ladder first: it wins when it applies. Hostile and Nemesis need their gate events.
  if (r.flags.met) {
    const disliked = trust < 15 - m && suspicion >= 50 + m;
    if (disliked && r.gates.includes(GATES.hostile) && r.gates.includes(GATES.nemesis)) return 'nemesis';
    if (disliked && r.gates.includes(GATES.hostile)) return 'hostile';
    if (disliked) return 'disliked';
    if (suspicion >= 40 + m) return 'suspicious';
    if (suspicion >= 20 + m) return 'wary';
  }
  if (!r.flags.met) return 'stranger';
  const sum = trust + respect + affection;
  const has = (g: string) => r.gates.includes(g);
  if (trust >= 85 + m && affection >= 85 + m && loyalty >= 85 + m && has(GATES.devoted)) return 'devoted';
  if (trust >= 75 + m && affection >= 60 + m && has(GATES.close)) return 'close';
  if (trust >= 60 + m && has(GATES.trusted)) return 'trusted';
  if (sum >= 110 + m && affection >= 30 + m) return 'friendly';
  if (sum >= 70 + m && r.scenes >= 2) return 'interested';
  if (sum >= 40 + m) return 'familiar';
  if (ATTRS.some((a) => get(r, a) > 5 + m)) return 'acquaintance';
  return 'acquaintance';
}

/** Ends a Node: the stage only moves when the numbers clear the thresholds by HYSTERESIS and stay there for a full Node. */
export function endNode(r: CastRecord): void {
  const up = computeStage(r, HYSTERESIS);
  const down = computeStage(r, -HYSTERESIS);
  const cur = stageRank(r.stage);
  let candidate: string | null = null;
  if (stageRank(up) > cur) candidate = up;
  else if (stageRank(down) < cur) candidate = down;
  // A negative stage can also be entered or left through the plain numbers when the ladder flips sign.
  else if (cur < 0 && stageRank(computeStage(r)) >= 0) candidate = computeStage(r);
  if (candidate === null) { r.pending = null; return; }
  if (r.pending === candidate) { r.stage = candidate; r.pending = null; } else r.pending = candidate;
}

/** First meeting: sets met and the stage. Idempotent. */
export function meet(r: CastRecord, node: number): void {
  if (r.flags.met) return;
  r.flags.met = true;
  r.stage = computeStage(r);
  r.last = { node, summary: 'met' };
}

export function change(r: CastRecord, deltas: Deltas, node: number, summary?: string): Deltas {
  const applied: Deltas = {};
  for (const [a, d] of Object.entries(deltas) as [Attr, number][]) {
    const next = clamp(get(r, a) + d);
    applied[a] = next - get(r, a);
    r.attrs[a] = next;
  }
  r.scenes += 1;
  r.last = { node, summary: summary ?? r.last?.summary ?? '' };
  return applied;
}

/** The typical deltas from the design doc table. */
export const ACTIONS: Record<string, Deltas> = {
  keep_promise: { trust: 10 },
  break_promise: { trust: -20, suspicion: 15 },
  win_respectfully: { respect: 8, rivalry: 4 },
  win_and_gloat: { respect: -5, rivalry: 8, affection: -5 },
  lose_gracefully: { respect: 6 },
  gift_liked: { affection: 5 },
  gift_disliked: { affection: -3 },
  save_from_danger: { trust: 15, affection: 10, loyalty: 10 },
  ignore_request: { trust: -3 },
  deceive_caught: { trust: -25, suspicion: 20 },
  defend_in_public: { respect: 6, loyalty: 6 },
  share_secret: { trust: 8, affection: 6 },
  betray_ally: { trust: -40, suspicion: 40, fear: 10 },
};

/** Drift at the end of a Node: Suspicion falls by 1 when nothing negative happened; Fear falls when Respect is high; Rivalry moves 1 toward its baseline. */
export function drift(r: CastRecord, hadNegativeEvent: boolean, rivalryBaseline = 0): void {
  if (!hadNegativeEvent && get(r, 'suspicion') > 0) r.attrs.suspicion = get(r, 'suspicion') - 1;
  if (get(r, 'respect') >= 60 && get(r, 'fear') > 0) r.attrs.fear = get(r, 'fear') - 1;
  const rv = get(r, 'rivalry');
  if (rv !== rivalryBaseline) r.attrs.rivalry = rv + Math.sign(rivalryBaseline - rv);
}

// ---------- the social graph ----------

export type LinkKind = 'friend' | 'family' | 'rival' | 'faction';
export interface Link { a: string; b: string; kind: LinkKind }
const RIPPLE: Record<LinkKind, number> = { friend: 0.2, family: 0.3, rival: -0.1, faction: 0.2 };
export const RIPPLE_CAP = 10;

/** What a change in one relationship does to the linked characters: a share of each changed attribute, capped at 10 points. */
export function ripples(links: readonly Link[], who: string, applied: Deltas): Record<string, Deltas> {
  const out: Record<string, Deltas> = {};
  for (const l of links) {
    const other = l.a === who ? l.b : l.b === who ? l.a : null;
    if (!other) continue;
    for (const [a, d] of Object.entries(applied) as [Attr, number][]) {
      const share = Math.trunc(d * RIPPLE[l.kind]);
      if (share === 0) continue;
      const bucket = (out[other] ??= {});
      bucket[a] = Math.max(-RIPPLE_CAP, Math.min(RIPPLE_CAP, (bucket[a] ?? 0) + share));
    }
  }
  return out;
}

// ---------- memory and callbacks ----------

export function remember(r: CastRecord, tag: string, salience: number, node: number): void {
  if (r.mem.some((m) => m.tag === tag && m.node === node)) return;
  r.mem.push({ tag, salience: Math.max(1, Math.min(10, Math.round(salience))), node });
}

/** The memory to mention in the next greeting: the highest salience from the last 12 Nodes, or a "never forget" memory. At most one. */
export function pickCallback(r: CastRecord, node: number): { tag: string; salience: number; node: number } | null {
  const pool = r.mem.filter((m) => m.salience >= NEVER_FORGET || node - m.node <= CALLBACK_WINDOW);
  if (pool.length === 0) return null;
  return [...pool].sort((x, y) => y.salience - x.salience || y.node - x.node || x.tag.localeCompare(y.tag))[0]!;
}

// ---------- what the numbers do ----------

export type CastClass = 'rival' | 'leader' | 'evil' | 'elite' | 'ally' | 'family' | 'researcher';

/** Effect ids the Director and event code may offer for this record (design doc consequence table). */
export function consequences(r: CastRecord, cls: CastClass): string[] {
  const out: string[] = [];
  const rank = stageRank(r.stage);
  if (cls === 'leader' && rank >= stageRank('friendly')) out.push('leader_special_item_or_lesson');
  if (cls === 'rival' && get(r, 'respect') >= 60) out.push('rival_warns_before_hard_battle');
  if (cls === 'rival' && get(r, 'rivalry') >= 70 && get(r, 'respect') >= 60) out.push('rival_requests_rematch');
  if (cls === 'researcher' && get(r, 'trust') >= 50) out.push('researcher_shares_lore');
  if (get(r, 'suspicion') >= 40) out.push('refuses_information_and_services');
  if ((cls === 'ally' || cls === 'family') && rank >= stageRank('trusted')) out.push('ally_joins_one_battle');
  if (r.stage === 'hostile' || r.stage === 'nemesis') out.push('may_ambush_or_sabotage');
  if (r.stage === 'close' || r.stage === 'devoted') out.push('reveals_secret_and_may_speak_in_finale');
  if (r.gates.includes('betrayed_by_player')) out.push('reputation_gossip_lowers');
  return out;
}

// ---------- end of run ----------

/** Folds a finished Story Run's cast into the profile's display archive (`profile.story.cast`): the run id and a short telling per character. */
export function foldCastIntoProfile(profile: Profile, run: RunState): void {
  const v2 = run.story.v2;
  if (!v2) return;
  for (const [id, rec] of Object.entries(v2.cast)) {
    if (!rec.flags.met) continue;
    const entry = (profile.story.cast[id] ??= { tellings: [], wins: 0, losses: 0, runs: [] });
    if (!entry.runs.includes(run.runId)) entry.runs = [...entry.runs, run.runId].slice(-20);
    const telling = `${id}:${rec.stage}`;
    if (!entry.tellings.includes(telling)) entry.tellings = [...entry.tellings, telling].slice(-6);
  }
}

/** Trust the player earned with non-rival characters becomes the existing `ev:trust-<npc>` flags, so finalizeRun's NpcMemory fold picks it up (rivals carry nothing across runs). */
export function castTrustFlags(run: RunState, rivalIds: ReadonlySet<string>): void {
  const v2 = run.story.v2;
  if (!v2) return;
  for (const [id, rec] of Object.entries(v2.cast)) {
    if (rivalIds.has(id) || !rec.flags.met) continue;
    const trust = get(rec, 'trust');
    if (trust >= 40) run.story.flags[`ev:trust-${id}`] = Math.min(10, Math.floor(trust / 10));
  }
}
