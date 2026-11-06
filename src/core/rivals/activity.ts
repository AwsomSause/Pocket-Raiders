// Rival activity, rumours and race paces (Story Overhaul W4, design 14.11 to 14.13 and 14.23).
// Called once a stage from simulateRivalWorld. All rolls use their own seeded streams (`w4-*`), so no existing
// roll moves and nothing here touches gameplay RNG. Outcomes of battles never depend on it: it only writes the
// optional `rival.world` fields (near, goal, condition, pace, heardOfYou, stuck, news), the lead (by at most 1
// a stage) and news lines. No save bump: every new field is optional.

import { z } from 'zod';
import data from '../../data/rivalActivity.json';
import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import { getSpecies } from '../pokemon';
import type { RunState } from '../state';
import { emit } from '../story/record';
import type { Rival, RivalWorldRecord } from '../story/schema';
import { isHostile } from './outcome';
import { freshRecord, rivalProgress, rivalStatus } from './progression';
import { voiceOf } from './voice';

const Pace = z.enum(['fast', 'steady', 'slow']);
const SITUATIONS = ['ahead', 'behind', 'even', 'champion'] as const;
const Lines = z.object({ ahead: z.array(z.string()).length(3), behind: z.array(z.string()).length(3), even: z.array(z.string()).length(3), champion: z.array(z.string()).length(3) });
export const UPDATE_TYPES = ['progress', 'battleReport', 'defeat', 'recovery', 'recruitment', 'evolution', 'ace', 'champion', 'mystery', 'personal'] as const;
type UpdateType = (typeof UPDATE_TYPES)[number];

const ActivitySchema = z.object({
  note: z.string(),
  pacing: z.object({ perStage: z.number().int(), perLeagueStage: z.number().int(), observedPerStage: z.number().int(), rivalGapStages: z.number().int(), templateRepeatStages: z.number().int(), rumorCorrectStages: z.number().int(), personalMinStates: z.array(z.string()), trueShare: z.number() }),
  race: z.object({ fastAmbition: z.number(), slowResilience: z.number(), gain: z.record(Pace, z.number()), stuckLosses: z.number().int(), stuckStages: z.number().int(), maxLeadChangePerStage: z.number().int(), nudgeAt: z.number().int() }),
  goals: z.array(z.string()),
  updates: z.array(z.object({ id: z.enum(UPDATE_TYPES), visibility: z.enum(['private', 'rumor', 'observed']), templates: z.array(z.string()).length(3) })).length(10),
  rumors: z.array(z.object({ id: z.string(), text: z.string(), truth: z.enum(['T', 'F', 'P']), payoff: z.string(), correction: z.string().optional() })).length(24),
  lines: z.record(z.string(), Lines),
});
export const RIVAL_ACTIVITY = ActivitySchema.parse(data);

/** Rumours whose payoff the game can back today. The rest stay off until the system they point at exists (W2, W8): never a false promise. */
export const LIVE_RUMOR_PAYOFFS = ['badge', 'training', 'recruitment', 'evolution', 'injured', 'rivalVsRival', 'friendEdge', 'none'] as const;
export const liveRumors = () => RIVAL_ACTIVITY.rumors.filter((r) => (LIVE_RUMOR_PAYOFFS as readonly string[]).includes(r.payoff));

/** Stage number that grows through the run (region * 100 + stage), for gaps and repeats. */
export const stageOrd = (run: Pick<RunState, 'regionIndex' | 'stage'>) => run.regionIndex * 100 + (run.stage?.index ?? 0);

/** Pace from character (spec 14.13): ambition 75+ is fast, resilience 35 or less is slow. */
export function paceOf(r: Pick<Rival, 'traits'>): z.infer<typeof Pace> {
  const c = RIVAL_ACTIVITY.race;
  return r.traits.ambition >= c.fastAmbition ? 'fast' : r.traits.resilience <= c.slowResilience ? 'slow' : 'steady';
}

const PACES = ['slow', 'steady', 'fast'] as const;
/** Pace nudged by results: three more wins than defeats speeds it up one step, the reverse slows it. Pure. */
export function nudgedPace(base: z.infer<typeof Pace>, w: Pick<RivalWorldRecord, 'wins' | 'defeats'>): z.infer<typeof Pace> {
  const at = RIVAL_ACTIVITY.race.nudgeAt;
  const shift = w.wins - w.defeats >= at ? 1 : w.defeats - w.wins >= at ? -1 : 0;
  return PACES[Math.max(0, Math.min(2, PACES.indexOf(base) + shift))]!;
}

/** The race situation seen from a rival: champion, ahead, behind or even. */
export function raceSituation(run: Pick<RunState, 'regionIndex' | 'stage'>, r: Rival): (typeof SITUATIONS)[number] {
  const st = rivalStatus(run, r);
  const lead = r.world?.lead ?? 0;
  return st === 'champion' ? 'champion' : lead > 0 ? 'ahead' : lead < 0 ? 'behind' : 'even';
}

/** One race line in the rival's voice (3 per voice and situation), stable for a rival at a stage. Pure. */
export function raceLine(run: RunState, r: Rival): string {
  const pool = RIVAL_ACTIVITY.lines[voiceOf(r)] ?? RIVAL_ACTIVITY.lines['stoic']!;
  const lines = pool[raceSituation(run, r)];
  return lines[new Rng(hashSeed(`${run.seed}::w4-line::${r.id}::${stageOrd(run)}`)).int(0, lines.length - 1)]!;
}

const title = (content: Content, r: Rival) => `${content.trainers.get(r.classId)?.name ?? 'Trainer'} ${r.name}`;
const flagFix = 'w4.fix';

interface Pending { id: string; ord: number; text: string }
const readFix = (run: RunState): Pending[] => {
  try {
    const v = run.story.flags[flagFix];
    return typeof v === 'string' ? (JSON.parse(v) as Pending[]) : [];
  } catch {
    return [];
  }
};
const writeFix = (run: RunState, list: Pending[]) => {
  run.story.flags[flagFix] = JSON.stringify(list);
};

/** Lead of every rival before the stage moved (pass to `rivalActivity`). */
export const snapshotLeads = (run: RunState): Record<string, number> => Object.fromEntries(run.story.rivals.map((r) => [r.id, r.world?.lead ?? 0]));

interface Candidate { rival: Rival | null; type: UpdateType | 'rumor'; idx: number; text: string; visibility: 'private' | 'rumor' | 'observed'; accurate: boolean; fix?: Pending; key: string; apply?: () => void }

/**
 * One stage of rival activity: race paces, tracker fields, then up to 2 news items (3 in a League stage; at most 1 observed;
 * `slots` already used by the older rumour line). Mutates `run`. Safe to call once per stage (the caller guards it).
 */
export function rivalActivity(content: Content, run: RunState, before: Record<string, number>, slots: number): void {
  const story = run.story;
  const cfg = RIVAL_ACTIVITY;
  const ord = stageOrd(run);
  const idx = run.stage?.index ?? 0;
  const theme = content.themes.get(run.stage?.themeId ?? '')?.name ?? 'the road';
  const live = story.rivals.filter((r) => r.state !== 'retired');

  // 1. Tracker and race (14.11, 14.13).
  for (const r of live) {
    const w = (r.world ??= freshRecord(run.regionIndex));
    const rng = new Rng(hashSeed(`${run.seed}::w4-pace::${ord}::${r.id}`));
    w.pace = nudgedPace(w.pace ?? paceOf(r), w);
    w.near = idx < 3 ? 'early' : idx < 6 ? 'mid' : 'late';
    const was = before[r.id] ?? w.lead;
    const cap = cfg.race.maxLeadChangePerStage;
    let lead = w.lead;
    if ((w.stuck ?? 0) > 0) {
      lead = Math.min(lead, was);
      w.stuck = (w.stuck ?? 0) - 1;
    } else if (isHostile(r) && r.cooldown === 0 && lead === was && rng.float() < cfg.race.gain[w.pace]!) {
      lead = was + 1;
    }
    lead = Math.max(was - cap, Math.min(was + cap, lead));
    if (lead !== w.lead) rivalProgress(content, run, r, 'setPace', { lead });
    // A slow rival that lost twice in a row off-screen is stuck.
    const lastTwo = w.milestones.slice(-cfg.race.stuckLosses);
    if (w.pace === 'slow' && !(w.stuck) && lastTwo.length === cfg.race.stuckLosses && lastTwo.every((m) => m.kind === 'unseenLoss' && m.at === `${run.regionIndex}.${idx}`)) w.stuck = cfg.race.stuckStages;
    const status = rivalStatus(run, r);
    const last = w.milestones.at(-1);
    w.condition = w.condition === 'injured' ? 'recovering' : r.cooldown > 0 ? 'recovering' : last?.kind === 'unseenLoss' || last?.kind === 'lostToPlayer' ? 'losing' : last && ['unseenWin', 'badge', 'rank', 'beatPlayer'].includes(last.kind) ? 'winning' : 'fine';
    w.goal = status === 'championCandidate' || status === 'champion' ? 'champion' : last?.kind === 'lostToPlayer' || w.condition === 'losing' ? 'revenge' : w.condition === 'recovering' ? 'train' : rng.pick(['gym', 'gym', 'catch', 'explore', 'train'] as const);
    w.heardOfYou = w.heardOfYou || r.encounters > 0 || w.fame >= 10;
  }

  // 2. News (14.12): pending corrections first, then fresh items.
  const max = run.stage?.kind === 'league' ? cfg.pacing.perLeagueStage : cfg.pacing.perStage;
  let budget = Math.max(0, max - slots);
  let observed = 0;
  const fix = readFix(run);
  const rng = new Rng(hashSeed(`${run.seed}::w4-news::${ord}`));
  const stageName = `${run.regionIndex}.${idx}`;
  const mon = (r: Rival) => {
    const id = r.memory.lastBattle.team.length ? rng.pick(r.memory.lastBattle.team) : r.ace;
    return id ? getSpecies(content, id).name : 'Pokémon';
  };
  const fill = (t: string, r: Rival | null, other: Rival | null) =>
    t.replaceAll('{rival}', r ? title(content, r) : 'A trainer').replaceAll('{other}', other ? title(content, other) : 'a stranger').replaceAll('{gym}', `${theme} Gym`).replaceAll('{town}', `the ${theme} town`).replaceAll('{place}', `the ${theme} route`)
      .replaceAll('{species}', r ? mon(r) : 'Pokémon').replaceAll('{ace}', r?.ace ? getSpecies(content, r.ace).name : 'ace Pokémon').replaceAll('{team}', 'evil team');
  const show = (c: Candidate) => {
    emit(content, run, 'rivalryFormed', { data: { outcome: 'update', type: c.type, visibility: c.visibility, accurate: c.accurate, text: c.text, ...(c.rival ? { rival: c.rival.id } : {}) }, text: c.text });
    if (c.rival?.world) {
      c.rival.world.newsAt = ord;
      c.rival.world.news = [...(c.rival.world.news ?? []), c.key].slice(-8);
    }
    c.apply?.();
    budget -= 1;
    if (c.visibility === 'observed') observed += 1;
  };

  const due = fix.filter((f) => ord - f.ord >= 1);
  const rest = fix.filter((f) => !due.includes(f));
  for (const f of due) {
    if (budget <= 0 || observed >= cfg.pacing.observedPerStage) {
      rest.push(f); // still owed; the 2-stage limit is enforced below
      continue;
    }
    show({ rival: null, type: 'rumor', idx: 0, text: f.text, visibility: 'observed', accurate: true, key: `fix:${f.id}@${ord}` });
  }
  writeFix(run, rest);

  const cands: Candidate[] = [];
  const repeated = (key: string) => live.some((r) => (r.world?.news ?? []).some((n) => n.startsWith(key.split('@')[0]!) && ord - Number(n.split('@')[1]) < cfg.pacing.templateRepeatStages));
  const roomy = (r: Rival) => ord - (r.world?.newsAt ?? -999) >= cfg.pacing.rivalGapStages;
  const personalOk = (r: Rival) => cfg.pacing.personalMinStates.includes(r.state);
  for (const r of live) {
    if (!roomy(r)) continue;
    const w = r.world!;
    const thisStage = w.milestones.filter((m) => m.at === stageName).map((m) => m.kind);
    const other = live.find((o) => o.id !== r.id) ?? null;
    const weights: Partial<Record<UpdateType, number>> = {
      progress: thisStage.includes('badge') || thisStage.includes('unseenWin') ? 3 : 1,
      defeat: thisStage.includes('unseenLoss') ? 4 : 0,
      recovery: w.condition === 'recovering' ? 3 : 0,
      recruitment: 1,
      evolution: 1,
      ace: r.ace ? 1 : 0,
      champion: w.goal === 'champion' ? 3 : 0,
      battleReport: other ? (thisStage.includes('beatRival') || thisStage.includes('lostToRival') ? 3 : 1) : 0,
      mystery: personalOk(r) && (r.cooldown > 0 || w.stuck) ? 2 : 0,
      personal: personalOk(r) ? 1 : 0,
    };
    const types = UPDATE_TYPES.filter((t) => (weights[t] ?? 0) > 0);
    if (types.length === 0) continue;
    const type = rng.weighted(types.map((t) => ({ item: t, weight: weights[t]! })));
    const def = cfg.updates.find((u) => u.id === type)!;
    const templateIdx = rng.int(0, 2);
    const key = `${type}:${templateIdx}@${ord}`;
    if (repeated(key)) continue;
    let text = fill(def.templates[templateIdx]!, r, other);
    let accurate = true;
    if (def.visibility === 'rumor' && rng.float() >= cfg.pacing.trueShare) {
      // 25% of rumours are wrong: the player hears the opposite, and an observed update sets it right.
      accurate = false;
      const flipped = type === 'defeat' || type === 'recovery' ? 'progress' : 'defeat';
      const tplDef = cfg.updates.find((u) => u.id === flipped)!;
      cands.push({ rival: r, type, idx: templateIdx, accurate, visibility: 'rumor', key, text: `Word is that ${fill(tplDef.templates[templateIdx]!, r, other)}`, fix: { id: key, ord, text: `The rumour was off: ${text}` } });
      continue;
    }
    if (def.visibility === 'observed' && (type === 'progress' || type === 'champion')) text = `${text} "${raceLine(run, r)}"`;
    cands.push({ rival: r, type, idx: templateIdx, accurate, visibility: def.visibility === 'rumor' ? 'rumor' : def.visibility, key, text: def.visibility === 'rumor' ? `Word is that ${text}` : text });
  }
  // The 24 rumours, only ones the game can back today; each needs a rival that fits.
  const lastWins = (r: Rival) => r.world!.milestones.some((m) => m.at === stageName && m.kind === 'badge');
  const hurt = live.find((r) => r.world!.condition === 'losing' && isHostile(r));
  const enemies = story.rivalGraph.find((e) => e.kind === 'enemies');
  const friends = story.rivalGraph.find((e) => e.kind === 'friends');
  const byId = (id: string) => live.find((r) => r.id === id) ?? null;
  const pick = rng.pick(liveRumors());
  const rumorKey = `rumor:${pick.id}@${ord}`;
  if (!repeated(rumorKey) && (story.flags[`w4.rumor.${pick.id}`] === undefined)) {
    let who: Rival | null = null;
    let other: Rival | null = null;
    let ok = true;
    let apply: (() => void) | undefined;
    if (pick.payoff === 'badge') { who = live.find(lastWins) ?? null; ok = !!who; }
    else if (pick.payoff === 'injured') { who = hurt ?? null; ok = !!who; apply = () => { if (who?.world) who.world.condition = 'injured'; }; }
    else if (pick.payoff === 'rivalVsRival') { who = enemies ? byId(enemies.a) : null; other = enemies ? byId(enemies.b) : null; ok = !!(who && other); }
    else if (pick.payoff === 'friendEdge') { who = friends ? byId(friends.a) : null; other = friends ? byId(friends.b) : null; ok = !!(who && other); }
    else if (pick.payoff === 'recruitment' || pick.payoff === 'evolution') { who = live.find((r) => r.offscreen.some((o) => o.at === stageName && (pick.payoff === 'evolution' ? /evol/i.test(o.eventType + o.text) : /(catch|trade|recruit|new)/i.test(o.eventType + o.text)))) ?? null; ok = !!who; }
    else if (pick.text.includes('{rival}')) { who = live[0] ?? null; ok = !!who; }
    if (ok) {
      const text = `Word is that ${fill(pick.text, who, other)}`;
      cands.push({ rival: who, type: 'rumor', idx: 0, accurate: pick.truth !== 'F', visibility: 'rumor', key: rumorKey, text, ...(pick.truth === 'F' && pick.correction ? { fix: { id: pick.id, ord, text: fill(pick.correction, who, other) } } : {}), ...(apply ? { apply } : {}) });
    }
  }

  // Deterministic order, then the pacing caps.
  const order = new Rng(hashSeed(`${run.seed}::w4-order::${ord}`));
  const shuffled = cands.map((c) => ({ c, k: order.float() })).sort((a, b) => a.k - b.k).map((x) => x.c);
  const added: Pending[] = [];
  for (const c of shuffled) {
    if (budget <= 0) break;
    if (c.visibility === 'observed' && observed >= cfg.pacing.observedPerStage) continue;
    if (c.visibility === 'private') continue; // private text only after a reveal (not built yet)
    show(c);
    if (c.fix) added.push(c.fix);
    if (c.type === 'rumor') story.flags[`w4.rumor.${pick.id}`] = true;
  }
  if (added.length) writeFix(run, [...readFix(run), ...added]);
}
