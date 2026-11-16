// Evil Teams (spec §16). One team works in each run's world. It is picked by a hash of the run seed once the run
// reaches `config.firstStage` (no gameplay stream is rolled), then:
//  - Storyline: seven beats (suspicious trainers, evidence, recognition, an executive, the executive returns, the
//    real plan, the hideout). Each beat is a forced map stop (core/evil/content.ts) that comes due `beatEvery`
//    stages after the last one. Every choice moves the story on; the hideout can end it by battle, by exposing the
//    team (enough operations stopped), with a defector's help, or by striking a deal.
//  - Operations: one per region. Stopping it (battle or disguise) leaves a lasting upside, letting it through or
//    helping leaves a lasting downside (`consequences` in evilTeams.json, added to the run's modifiers for good).
//    An operation still running when you leave its region succeeds.
//  - Heat: how hard the team pushes back. It adds levels and reinforcements to their battles and, past
//    `ambushAt`, ambushes.
//  - Recurring villains: the executive and leader remember every meeting. Their teams grow and their lines change
//    (first meeting, after you beat them, after they beat you, grudging respect).

import { beginClimax } from '../arc/climaxExtended';
import { standingLine } from '../arc/standWithExtended';
import { impoundFor } from '../raid/storyRaids';
import { activeHolds, impound, RESCUE, returnedElsewhere } from './rescue';
import { lastQuietNodeOfRegion, rescueNode } from './rescueGlue';
import type { ArchetypeModifier, Content, EventBattle, EventCondition, EventEffect } from '../contentSchema';
import { changeCrisis } from '../story/crisis';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { emit } from '../story/record';
import { evilConfig, HIDEOUT_AT_LEAGUE } from '../campaign/circuit';
import { recordChoice } from './choices';
import { beatTeamLeaders } from '../expansion/cast/dossier';
import { trackOnClimax, trackOnOperation } from '../expansion/trackRun';
import { applyInside, clearInside, crossInside, insideLine, insideMet, insideOn, rankOf, replacedByInside, routeOf } from './inside';
import { freshEvil, type EvilRank, type EvilState, type EvilTeam, type VillainRecord } from './schema';

type EvilCondition = Extract<EventCondition, { kind: 'evil' }>;
type EvilEffect = Extract<EventEffect, { kind: 'evil' }>;
type TrainerBattle = Extract<EventBattle, { kind: 'trainer' }>;

/** The run's Evil Team state (older runs are given a fresh one). */
export function evilOf(run: RunState): EvilState {
  if (!run.story.evil) run.story.evil = freshEvil();
  // A state written before the region-by-region story (or by a debug tool) gets the schema's defaults for the newer fields.
  const s = run.story.evil;
  s.region ??= -1;
  s.past ??= [];
  s.planFirst ??= null;
  s.mods ??= [];
  return s;
}

export function evilTeam(content: Content, run: RunState): EvilTeam | null {
  const id = run.story.evil?.teamId;
  return id ? (content.evilTeams.teams.find((t) => t.id === id) ?? null) : null;
}

const tell = (content: Content, run: RunState, def: string, text: string, importance: number) => emit(content, run, 'storyMoment', { actors: [], data: { def, suppressed: false }, importance, text });

const stoppedCount = (s: EvilState): number => s.ops.filter((o) => o.outcome === 'foiled' || o.outcome === 'infiltrated').length;
const successCount = (s: EvilState): number => s.ops.filter((o) => o.outcome === 'succeeded' || o.outcome === 'joined').length;

/** The operation running in the current region, if any. */
export function runningOp(run: RunState): EvilState['ops'][number] | null {
  return evilOf(run).ops.find((o) => o.region === run.regionIndex && o.outcome === 'running') ?? null;
}

/** The team this run's world gets (a hash of the seed, no stream rolled). The Narrative Director reads it as the antagonist before it shows up. */
export function plannedEvilTeamId(content: Content, run: Pick<RunState, 'seed' | 'perkEffects' | 'story'>): string | null {
  if (run.story.evil?.teamId) return run.story.evil.teamId;
  // Story Runs draw from the six original teams (Design v2 Part IV); Classic never sees them, so its draw is unchanged.
  const story = !!run.story.v2;
  // Roaming teams (Cipher, Rocket Remnants, Snag'em) are never a run's team.
  const drawable = content.evilTeams.teams.filter((t) => !t.roaming);
  const own = drawable.filter((t) => t.storyOnly === story);
  const pool = own.length > 0 ? own : drawable;
  if (pool.length === 0) return null;
  const focus = (run.perkEffects ?? []).flatMap((m) => (m.kind === 'evilTeamFocus' ? m.teams : []));
  const focused = pool.filter((t) => focus.includes(t.id));
  const teams = focused.length > 0 ? focused : pool;
  return teams[new Rng(hashSeed(`${run.seed}::evil-team`)).int(0, teams.length - 1)]!.id;
}

/**
 * Catalog Overhaul SF13: one team runs each region's storyline, seven steps across that region. True unless the campaign schedules
 * the beats itself (a Story Run: the Narrative Director owns them) or the run was saved under the old run-long story (`region` -1 with a team).
 */
export function regionalStory(content: Content, run: Pick<RunState, 'campaignId' | 'story'>): boolean {
  if (content.campaigns.get(run.campaignId)?.evil) return false;
  const s = run.story.evil;
  return !s?.teamId || s.region >= 0;
}

/** The team a region's story goes to: a team that calls the region home first, else a seeded draw among teams not yet met (no stream rolled). */
export function regionTeamId(content: Content, run: Pick<RunState, 'seed' | 'perkEffects' | 'story' | 'regionOrder' | 'regionIndex'>): string | null {
  const s = run.story.evil;
  const story = !!run.story.v2;
  const drawable = content.evilTeams.teams.filter((t) => !t.roaming);
  const own = drawable.filter((t) => t.storyOnly === story);
  const all = own.length > 0 ? own : drawable;
  const met = new Set((s?.past ?? []).map((p) => p.teamId));
  const fresh = all.filter((t) => !met.has(t.id));
  const pool = fresh.length > 0 ? fresh : all;
  if (pool.length === 0) return null;
  const here = run.regionOrder[run.regionIndex] ?? '';
  const pick = (teams: EvilTeam[], key: string): string => teams[new Rng(hashSeed(`${run.seed}::${key}`)).int(0, teams.length - 1)]!.id;
  const focus = (run.perkEffects ?? []).flatMap((m) => (m.kind === 'evilTeamFocus' ? m.teams : []));
  const focused = pool.filter((t) => focus.includes(t.id));
  if (focused.length > 0) return pick(focused, met.size === 0 ? 'evil-team' : `evil-team::${run.regionIndex}`);
  const home = pool.filter((t) => t.home.includes(here));
  if (home.length > 0) return pick(home, `evil-team-home::${here}`);
  // A team is kept for its own region when this run still goes there.
  const ahead = new Set(run.regionOrder.slice(run.regionIndex + 1));
  const free = pool.filter((t) => !t.home.some((r) => ahead.has(r)));
  return pick(free.length > 0 ? free : pool, met.size === 0 ? 'evil-team' : `evil-team::${run.regionIndex}`);
}

/** The run's remembered-flag key for a pack flag (`team.op_stopped.x` -> `ev:team-op-stopped-x`), as the `flag` effect and condition use it. */
const mem = (key: string): string => `ev:${key}`;
const bump = (run: RunState, key: string, by = 1): void => { run.story.flags[mem(key)] = Number(run.story.flags[mem(key)] ?? 0) + by; };
/** A remembered mark of a team's story (run flag `team-<team>-<mark>`, written by events or by the engine). */
const marked = (run: RunState, teamId: string, mark: string): boolean => Number(run.story.flags[mem(`team-${teamId}-${mark}`)] ?? 0) > 0;

/** Takes the lasting effects of Operations from regions the run has left off the run. */
function dropRegionMods(run: RunState, s: EvilState): void {
  const gone = s.mods.filter((m) => m.region !== run.regionIndex);
  if (gone.length === 0) return;
  for (const e of gone.flatMap((m) => m.effects)) {
    const at = (run.perkEffects ?? []).findIndex((m) => JSON.stringify(m) === JSON.stringify(e));
    if (at >= 0) run.perkEffects.splice(at, 1);
  }
  s.mods = s.mods.filter((m) => m.region === run.regionIndex);
}

/** The region's story is over (beaten, or the run moved on): Operations still running happen, and the team goes on the record. */
function closeRegionStory(content: Content, run: RunState, s: EvilState): void {
  const team = evilTeam(content, run);
  if (team) for (const op of s.ops) if (op.outcome === 'running') resolveOp(content, run, team, op, 'succeeded');
  if (s.teamId) s.past = [...s.past, { teamId: s.teamId, region: Math.max(0, s.region), end: s.end }];
  if (s.teamId) clearInside(run, s.teamId);
  Object.assign(s, { teamId: null, beat: 0, nextAt: 0, heat: 0, ops: [], villains: {}, defector: false, end: 'none', region: -1, planFirst: null });
}

/** Called as each stage begins (core/run.ts): counts stages, picks the team, ends a left-behind operation and starts this region's. */
export function evilStageStart(content: Content, run: RunState): void {
  const s = evilOf(run);
  const cfg = evilConfig(content, run);
  s.stages += 1;
  // HOENN_TEAMS 7.1: the uniform pays each stage, by rank, while you're inside (routes with `pay`).
  const payTeam = s.teamId ? content.evilTeams.teams.find((t) => t.id === s.teamId) : undefined;
  const payRoute = payTeam && insideOn(run, payTeam.id) ? routeOf(payTeam, run.regionOrder[run.regionIndex]) : undefined;
  if (payTeam && payRoute?.pay) {
    const wage = payRoute.pay[rankOf(run, payTeam.id, payRoute) - 1] ?? 0;
    if (wage > 0) {
      run.money += wage;
      tell(content, run, 'evil-pay', `${payTeam.name} pays you ₽${wage} for the stage.`, 30);
    }
  }
  if (regionalStory(content, run)) {
    if (s.teamId && s.region !== run.regionIndex) closeRegionStory(content, run, s);
    dropRegionMods(run, s);
    if (s.teamId || s.stages < cfg.firstStage || content.evilTeams.teams.length === 0) return;
    // One team per region: a region whose team story already ended stays quiet.
    if (s.past.some((p) => p.region === run.regionIndex)) return;
    const team = content.evilTeams.teams.find((t) => t.id === regionTeamId(content, run));
    if (!team) return;
    Object.assign(s, { teamId: team.id, region: run.regionIndex, beat: 0, nextAt: s.stages });
    tell(content, run, 'evil-team', `Rumours spread of ${team.name}. People say they mean to ${team.goal}.`, 55);
    return;
  }
  if (!s.teamId) {
    if (s.stages < cfg.firstStage || content.evilTeams.teams.length === 0) return;
    const team = content.evilTeams.teams.find((t) => t.id === plannedEvilTeamId(content, run))!;
    s.teamId = team.id;
    s.nextAt = s.stages;
    tell(content, run, 'evil-team', `Rumours spread of ${team.name}. People say they mean to ${team.goal}.`, 55);
  }
  const team = evilTeam(content, run);
  if (!team) return;
  // An operation left running in an earlier region goes through.
  for (const op of s.ops) if (op.outcome === 'running' && op.region !== run.regionIndex) resolveOp(content, run, team, op, 'succeeded');
  if (s.end !== 'none' || s.ops.some((o) => o.region === run.regionIndex)) return;
  const def = team.ops[s.ops.length % team.ops.length]!;
  s.ops.push({ id: def.id, region: run.regionIndex, outcome: 'running' });
  tell(content, run, 'evil-op', `${team.name} has started an operation in this region: ${def.name}. ${def.text}`, 60);
}

export function evilConditionMet(content: Content, run: RunState, c: EvilCondition): boolean {
  const s = run.story.evil;
  if (c.heatBelow !== undefined && (s?.heat ?? 0) >= c.heatBelow) return false;
  if (c.heatBelow !== undefined && Object.keys(c).length === 2) return true; // {kind, heatBelow} alone
  if (!s?.teamId) return false;
  if (c.team !== undefined && s.teamId !== c.team) return false;
  // Volume III: on the inside route the outside story steps aside (core/evil/inside.ts).
  if (replacedByInside(run, s.teamId, c) || !insideMet(run, s.teamId, c, routeOf(content.evilTeams.teams.find((t) => t.id === s.teamId), run.regionOrder[run.regionIndex]))) return false;
  if (c.beat !== undefined && (s.beat !== c.beat || s.stages < s.nextAt || s.end !== 'none')) return false;
  if (c.after !== undefined && s.beat < c.after) return false;
  if (c.op !== undefined && !s.ops.some((o) => o.id === c.op && o.region === run.regionIndex && o.outcome === 'running')) return false;
  if (c.heat !== undefined && s.heat < c.heat) return false;
  if (c.defector !== undefined && s.defector !== c.defector) return false;
  if (c.ends !== undefined && !c.ends.includes(s.end)) return false;
  // SF130: a variety scene stopped bumps team-<id>-op-stopped too, and SF13's "stop all four" counts those as well.
  if (c.stopped !== undefined && Math.max(stoppedCount(s), Number(run.story.flags[mem(`team-${s.teamId}-op-stopped`)] ?? 0)) < c.stopped) return false;
  if (c.afterFirst && c.op !== s.planFirst && s.ops.some((o) => o.id === s.planFirst && o.region === run.regionIndex && o.outcome === 'running')) return false;
  if (c.has !== undefined && !marked(run, s.teamId, c.has)) return false;
  if (c.lacks !== undefined && marked(run, s.teamId, c.lacks)) return false;
  if (c.trouble !== undefined) {
    const played = marked(run, s.teamId, 'trouble');
    // A Story Run keeps the Director's own schedule: there the lieutenant's second meeting never waits for Trouble Inside.
    if (c.trouble && !played && regionalStory(content, run)) return false;
    if (!c.trouble && played) return false;
  }
  return true;
}

export function evilConditionText(c: EvilCondition): string {
  if (c.rank) return `Needs Rank ${c.rank} inside the team`;
  if (c.inside) return 'Only on the inside route';
  if (c.defector) return 'Needs someone on the inside';
  if (c.stopped) return `Needs ${c.stopped} of their operation${c.stopped === 1 ? '' : 's'} stopped`;
  if (c.heatBelow) return 'Only while the team is not hunting you';
  if (c.heat) return 'Only when the team is hunting you';
  return 'Needs the right moment in the Evil Team story';
}

/** What a recurring villain says, following how your past meetings went. */
export function villainLine(team: EvilTeam, rank: EvilRank, rec: VillainRecord | undefined): string {
  const lines = team.ranks[rank].lines;
  if (!rec || rec.met === 0) return lines.first;
  if (rec.won >= 2) return lines.respect;
  return rec.last === 'won' ? lines.beaten : lines.winning;
}

/** Applies an `evil` effect. Returns the change in words. */
export function applyEvilEffect(content: Content, run: RunState, e: EvilEffect): string {
  const team = evilTeam(content, run);
  const s = evilOf(run);
  if (!team) return '';
  // Hoenn: the Offer and the Counter-Offer move the player to the region's other team. Its story goes on from the same
  // beat; the Operations running here become the new team's (one for one), so nothing is lost or doubled.
  if (e.side && e.side !== team.id) {
    const to = content.evilTeams.teams.find((t) => t.id === e.side);
    if (!to) return '';
    const region = run.regionOrder[run.regionIndex];
    crossInside(run, team, to, region, !!e.demote);
    s.ops.filter((o) => o.region === run.regionIndex).forEach((o, i) => { o.id = to.ops[i % to.ops.length]!.id; });
    s.teamId = to.id;
    return `You're ${to.name} now.`;
  }
  const words: string[] = [];
  if (e.talk) words.push(`${team.ranks[e.talk].name}: ${villainLine(team, e.talk, s.villains[e.talk])}`);
  if (e.beat && s.beat < 7) {
    s.beat += 1;
    // E2: the real plan comes out (beat 6): the climax is now scheduled, so the region's track rises once.
    if (s.beat === 6) { trackOnClimax(run, run.regionIndex); beginClimax(run, run.regionOrder[run.regionIndex]); }
    // SF13 A7: The Plan shows all four Operations: from here each is a stop on the map until it is stopped or happens.
    // On the inside route the player is running the Operations, not stopping them: the Plan's four stay off the map.
    if (s.beat === 6 && s.region >= 0 && !insideOn(run, team.id)) {
      for (const def of team.ops) if (!s.ops.some((o) => o.id === def.id && o.region === run.regionIndex)) s.ops.push({ id: def.id, region: run.regionIndex, outcome: 'running' });
      // Part C: a colleague who defected stops their Operation from inside (Magma's Dr. Tuff only halves its effect, when it happens).
      const inside = team.inside && marked(run, team.id, 'defector-colleague') ? s.ops.find((o) => o.id === team.inside!.op && o.region === run.regionIndex && o.outcome === 'running') : undefined;
      if (inside && !team.inside!.half) {
        bump(run, `team-op-inside-${inside.id}`);
        words.push(`${resolveOp(content, run, team, inside, 'infiltrated')} (stopped from inside)`);
      } else if (inside) bump(run, `team-op-inside-${inside.id}`);
    }
    const cfg = evilConfig(content, run);
    // Story Run (Appendix S.7): after beat 6 the hideout waits for League entry (core/campaign/storyDirector.ts places it).
    // E1: the story's last beat comes after the final climax fight is won: the team's Leader is beaten for the Dossier.
    if (s.beat === 7) beatTeamLeaders(run, team.id);
    s.nextAt = s.beat === 6 && cfg.hideoutAtLeague ? HIDEOUT_AT_LEAGUE : s.stages + (s.region >= 0 ? 1 : cfg.beatEvery);
    words.push(s.beat === 7 ? `the ${team.name} story reaches its end` : `the ${team.name} story moves on (${s.beat}/7)`);
  }
  if (e.heat !== 0) {
    const before = s.heat;
    s.heat = Math.max(0, Math.min(content.evilTeams.config.heatMax, s.heat + e.heat));
    if (s.heat !== before) words.push(s.heat > before ? `${team.name} is angrier (heat ${s.heat})` : `${team.name} eases off (heat ${s.heat})`);
  }
  if (e.planFirst && !s.planFirst) {
    s.planFirst = e.planFirst;
    const name = team.ops.find((o) => o.id === e.planFirst)?.name ?? e.planFirst;
    bump(run, `team-${team.id}-plan-first-${e.planFirst}`);
    words.push(`${name} is marked on your map: stop it first`);
  }
  if (e.op) {
    const op = e.opId ? s.ops.find((o) => o.id === e.opId && o.region === run.regionIndex && o.outcome === 'running') : runningOp(run);
    if (op) words.push(resolveOp(content, run, team, op, e.op));
  }
  if (e.door) {
    // Their dates have come. With the files at Jenny's, the first one still running is held back a stage: it only happens if the team outlasts the Hideout.
    const left = s.ops.filter((o) => o.region === run.regionIndex && o.outcome === 'running');
    const jenny = Number(run.story.flags[mem(`team-${team.id}-files-jenny`)] ?? 0) > 0;
    left.forEach((op, i) => {
      if (jenny && i === 0) { op.delayed = true; words.push(`Officer Jenny's raid is still holding up ${team.ops.find((o) => o.id === op.id)?.name ?? op.id}`); }
      else words.push(resolveOp(content, run, team, op, 'succeeded'));
    });
  }
  if (e.mark) bump(run, `team-${team.id}-${e.mark}`);
  if (e.leave) { clearInside(run, team.id); bump(run, `team-${team.id}-left`); }
  if (e.standing || e.suspicion || e.rank) words.push(...applyInside(run, team, run.regionOrder[run.regionIndex], e));
  if (e.pen) {
    const node = rescueNode(content, run);
    let back = 0;
    for (const h of activeHolds(run).filter((x) => x.teamId === team.id)) back += returnedElsewhere(run, h.id, node, 'holding-pen').length;
    if (back > 0) words.push(`${back} of your Pokémon ${back === 1 ? 'is' : 'are'} back with you`);
  }
  if (e.steal) {
    const site = RESCUE.sites.some((x) => x.team === team.id);
    const hold = site ? impound(run, { teamId: team.id, regionId: run.regionOrder[run.regionIndex] ?? 'region', node: rescueNode(content, run), lastQuietNode: lastQuietNodeOfRegion(content, run), count: e.steal }) : null;
    const n = hold ? Math.min(e.steal, hold.pokemon.length) : 0;
    if (n > 0) words.push(`${team.name} took ${n === 1 ? 'one of your Pokémon' : `${n} of your Pokémon`} to their Holding Pen`);
  }
  if (e.mods) {
    // Like an Operation's lasting effect: on the run while it stays in this region (dropRegionMods takes them off).
    s.mods.push({ region: run.regionIndex, effects: e.mods });
    run.perkEffects = [...(run.perkEffects ?? []), ...e.mods];
    if (e.modsText) words.push(e.modsText);
  }
  if (e.defect && !s.defector) {
    s.defector = true;
    tell(content, run, 'evil-defector', `A ${team.ranks.grunt.name} defected from ${team.name} to help you.`, 70);
    words.push('a defector joins your side');
  }
  if (e.end && s.end === 'none') {
    s.end = e.end;
    bump(run, `team-${team.id}-beaten`);
    // An Operation Jenny held back never gets its date once the team is gone.
    if (e.end !== 'allied') for (const op of s.ops) if (op.outcome === 'running' && op.delayed) { op.outcome = 'foiled'; bump(run, `team-op-stopped-${op.id}`); bump(run, `team-${team.id}-op-stopped`); }
    const text = e.end === 'defeated' ? `${team.ranks.leader.name} is beaten and ${team.name} falls apart.` : e.end === 'exposed' ? `${team.name} is exposed to the world and flees the region.` : `You made a deal with ${team.ranks.leader.name}. ${team.name} answers to no one now.`;
    tell(content, run, `evil-end-${e.end}`, text, 90);
    words.push(text);
  }
  return words.join(' · ');
}

/** Ends an operation and adds its lasting consequence to the run (once per operation). */
function resolveOp(content: Content, run: RunState, team: EvilTeam, op: EvilState['ops'][number], outcome: Exclude<EvilState['ops'][number]['outcome'], 'running'>): string {
  op.outcome = outcome;
  // E2: a stopped operation counts as a raid won (the world-state track falls), one let through as a raid lost (it rises).
  trackOnOperation(run, op.region, op.id, outcome);
  const def = team.ops.find((o) => o.id === op.id);
  const cons = def ? content.evilTeams.consequences[def.kind] : undefined;
  const stopped = outcome === 'foiled' || outcome === 'infiltrated';
  const key = `evil:op:${op.id}:${op.region}`;
  // SF13 Part D: an Operation with its own lasting effect leaves that on the region when it happens (and nothing extra when stopped).
  const lasting = def?.lasting;
  // Part C (Magma): the colleague's true readings halve what their Operation leaves behind.
  const half = !stopped && !!lasting && team.inside?.half === true && team.inside.op === op.id && marked(run, team.id, 'defector-colleague');
  const side = lasting ? (stopped ? null : { text: half ? `${lasting.text} (Halved: the town was warned in time.)` : lasting.text, effects: half ? lasting.effects.map(halveModifier) : lasting.effects }) : cons ? (stopped ? cons.stopped : cons.through) : null;
  if (!run.story.flags[key]) {
    run.story.flags[key] = true;
    bump(run, stopped ? `team-op-stopped-${op.id}` : `team-op-done-${op.id}`);
    if (stopped) bump(run, `team-${team.id}-op-stopped`);
    if (side && lasting) {
      evilOf(run).mods.push({ region: op.region, effects: side.effects });
      for (const f of lasting.flags) {
        const { key: k, amount } = typeof f === 'string' ? { key: f, amount: 1 } : f;
        bump(run, k, half ? Math.max(1, Math.floor(amount / 2)) : amount);
      }
      const rise = half ? Math.floor((lasting.crisis ?? 0) / 2) : (lasting.crisis ?? 0);
      if (rise > 0) changeCrisis(content, run, rise);
    }
    if (side) run.perkEffects = [...(run.perkEffects ?? []), ...side.effects];
  }
  // R9: an operation that goes through (lost or left alone) is a failed raid: the team impounds some of your Pokémon, once per operation.
  const impoundKey = `evil:impound:${op.id}:${op.region}`;
  if (outcome === 'succeeded' && !run.story.flags[impoundKey]) {
    run.story.flags[impoundKey] = true;
    impoundFor(content, run, team.id, `op-${op.id}-${op.region}`);
  }
  const verb = { foiled: 'You shut down', infiltrated: 'You sabotaged', succeeded: `${team.name} pulled off`, joined: 'You helped with' }[outcome];
  const name = def?.name ?? op.id;
  recordChoice(content, run, { id: `${team.id}-op-${op.id}-${op.region}`, pick: outcome, text: `${verb} ${name}`, weight: 2 });
  const text = `${verb} ${name}.${side ? ` ${side.text}` : ''}`;
  tell(content, run, 'evil-op-end', text, stopped ? 70 : 60);
  return text;
}

/** A modifier at half strength: a multiplier halfway back to 1, an offset halved (rounded toward 0). Others are kept. */
function halveModifier(m: ArchetypeModifier): ArchetypeModifier {
  const x = m as ArchetypeModifier & { value?: number };
  if (typeof x.value !== 'number') return m;
  const integer = Number.isInteger(x.value) && /Offset$/.test(m.kind);
  return { ...x, value: integer ? Math.trunc(x.value / 2) : 1 + (x.value - 1) / 2 } as ArchetypeModifier;
}

export interface EvilBattlePlan {
  name: string;
  species: string[];
  size: number;
  levelBonus: number;
  shadow: number;
}

/** The record key of a villain: the rank, or `team:rank` for a roaming team. */
const villainKey = (b: TrainerBattle): string => (b.evilTeam ? `${b.evilTeam}:${b.evil}` : b.evil!);

/** The team, levels and rule for an Evil Team battle at this rank; counts the meeting for a recurring villain. */
export function evilBattle(content: Content, run: RunState, b: TrainerBattle): EvilBattlePlan | null {
  // A roaming team (`evilTeam` on the battle) fights by its own rules: no heat, no operations, and its own villain records.
  const roaming = b.evilTeam ? content.evilTeams.teams.find((t) => t.id === b.evilTeam && t.roaming) : undefined;
  const team = roaming ?? evilTeam(content, run);
  if (!team || !b.evil) return null;
  const s = evilOf(run);
  const cfg = content.evilTeams.config;
  const rank = team.ranks[b.evil];
  const key = villainKey(b);
  const rec = s.villains[key] ?? { met: 0, won: 0, lost: 0, last: 'none' };
  const heat = roaming ? 0 : s.heat;
  const recurring = b.evil === 'executive' || b.evil === 'leader';
  let size = b.size + (heat >= cfg.reinforceAt ? 1 : 0) + (recurring ? Math.min(2, rec.met) : 0);
  let levelBonus = Math.floor(heat / cfg.heatPerLevel) + (roaming ? 0 : successCount(s)) * cfg.levelsPerSuccess + (recurring ? rec.met * cfg.levelsPerMeeting : 0);
  let shadow = b.shadow;
  if (team.rule.kind === 'swarm') size += 1;
  if (team.rule.kind === 'elite') {
    size -= 1;
    levelBonus += 2;
  }
  if (team.rule.kind === 'shadow') shadow = Math.max(shadow, 1);
  size = Math.max(1, Math.min(6, size));
  let species = rank.species.slice(0, size);
  // SF13 A4: they studied you. On a rematch the last slot is the counter to your party's most common type.
  if (b.evilStudy && rec.met > 0) {
    const counter = cfg.counters[commonType(content, run) ?? ''];
    if (counter && content.species.has(counter) && !species.includes(counter)) species = [...species.slice(0, Math.max(0, size - 1)), counter];
  }
  // The meeting counts as theirs until you win it (evilBattleWon).
  s.villains[key] = { met: rec.met + 1, won: rec.won, lost: rec.lost + 1, last: 'lost' };
  return { name: rank.name, species, size, levelBonus, shadow: Math.min(shadow, size) };
}

/** The type most of your party shares (ties go to the lead's first type, then to the earlier type name). Null with an empty party. */
export function commonType(content: Content, run: Pick<RunState, 'party'>): string | null {
  const count = new Map<string, number>();
  for (const p of run.party) for (const t of content.species.get(p.speciesId)?.types ?? []) count.set(t, (count.get(t) ?? 0) + 1);
  if (count.size === 0) return null;
  const lead = content.species.get(run.party[0]?.speciesId ?? '')?.types[0];
  return [...count.entries()].sort((a, b) => b[1] - a[1] || Number(b[0] === lead) - Number(a[0] === lead) || a[0].localeCompare(b[0]))[0]![0];
}

/** You won an Evil Team battle: the villain remembers it. */
export function evilBattleWon(run: RunState, b: TrainerBattle): void {
  if (!b.evil) return;
  const key = villainKey(b);
  const rec = evilOf(run).villains[key];
  if (!rec) return;
  evilOf(run).villains[key] = { met: rec.met, won: rec.won + 1, lost: Math.max(0, rec.lost - 1), last: 'won' };
}

/** The Story screen's summary of the run's Evil Team. */
export function evilSummary(content: Content, run: RunState): { title: string; lines: string[]; color: string } | null {
  const team = evilTeam(content, run);
  if (!team) return null;
  const s = evilOf(run);
  const end = { none: s.beat === 7 ? 'they escaped' : `story ${s.beat}/7`, defeated: 'defeated', exposed: 'exposed', allied: 'your allies' }[s.end];
  const lines = [`${team.philosophy} Goal: ${team.goal}. Rule: ${team.rule.text}`];
  lines.push(`Heat ${s.heat}/${content.evilTeams.config.heatMax}.${s.defector ? ' A defector is on your side.' : ''}`);
  for (const op of s.ops) {
    const def = team.ops.find((o) => o.id === op.id);
    lines.push(`Region ${op.region + 1}: ${def?.name ?? op.id} (${op.outcome === 'running' ? 'still running' : op.outcome})`);
  }
  const standing = standingLine(run);
  if (standing) lines.push(standing);
  const inside = insideLine(run, team, run.regionOrder[run.regionIndex]);
  if (inside) lines.push(inside);
  for (const rank of ['executive', 'leader'] as const) {
    const rec = s.villains[rank];
    if (rec && rec.met > 0) lines.push(`${team.ranks[rank].name}: met ${rec.met}, you won ${rec.won}.`);
  }
  return { title: `${team.name} (${team.style === 'open' ? 'openly hostile' : team.style === 'secret' ? 'works in secret' : `hides behind ${team.front}`}): ${end}`, lines, color: team.color };
}
