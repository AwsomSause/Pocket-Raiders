// Impossible Feats and the Resolve Charge (design Part II, "Impossible Feats and Limit Break Memories").
//  - The Story Run partner earns a hidden Resolve Charge (0 to 100) from the sources in balance.story.feats.charge,
//    each capped per battle, per Act or per beat key through a ledger (a replay or reload cannot pay twice).
//  - At 100 the Charge banks one Feat (two once Heartbond level 9 is latched). The Keystone Memory banks one too.
//  - A banked Feat may fire only in a significant battle (boss, Gym, Elite, Champion, Rival, Alpha, story flag),
//    never in the first turns, within the run caps (per battle, per Act, per run, same Feat twice), and never when the
//    Dramatic Moments setting is Off (Hardcore forces Off). Prompt mode needs the player to arm it first.
//  - The battle engine checks each Feat's moment condition at its hook (engine.ts `tryFeat`) and reports a `feat`
//    event; `recordFeat` then spends the bank, pays Heartbond once (rank 80) and takes the Moment Director's slot.
// No RNG anywhere: a Feat is earned and telegraphed, never rolled.

import type { Content } from '../contentSchema';
import type { BattleState, RunState } from '../state';
import { isBossFight } from '../battle/spectacle';
import { isHardcore } from '../nuzlocke';
import { personalityOfMon } from '../overhaul/personality';
import { noteMoments } from '../story/momentDirector';
import { renderTemplate } from './templates';
import { temperamentOf } from './temperament';

export type FeatHook = 'damage' | 'faint' | 'type' | 'status' | 'order' | 'accuracy' | 'evade' | 'ability' | 'hazard' | 'redirect' | 'transform' | 'post' | 'turn' | 'move';
export interface FeatDef {
  id: string;
  hook: FeatHook;
  /** 'battle': once a battle (the per-battle cap already does this); 'run': once a run. */
  per: 'battle' | 'run';
  /** Only this backstory may use it. */
  backstory?: string;
  /** Built: the engine has its hook. Limited: in the catalog, no hook yet (never offered). */
  status: 'supported' | 'limited';
  /** Spark Shared rides on another Feat (doubles) instead of firing by itself. */
  rider?: boolean;
}

export const FEATS: readonly FeatDef[] = [
  { id: 'crack_the_barrier', hook: 'damage', per: 'battle', status: 'supported' },
  { id: 'not_yet', hook: 'faint', per: 'battle', status: 'supported' },
  { id: 'against_the_odds', hook: 'type', per: 'battle', status: 'supported' },
  { id: 'through_the_numbness', hook: 'status', per: 'battle', status: 'supported' },
  { id: 'faster_than_fear', hook: 'order', per: 'battle', status: 'supported' },
  { id: 'blind_strike', hook: 'accuracy', per: 'battle', status: 'supported' },
  { id: 'between_them_and_it', hook: 'redirect', per: 'battle', status: 'supported' },
  { id: 'refuse_to_fall', hook: 'faint', per: 'run', status: 'supported' },
  { id: 'break_the_rule', hook: 'ability', per: 'battle', status: 'supported' },
  { id: 'unmask_the_illusion', hook: 'transform', per: 'battle', status: 'supported' },
  { id: 'read_the_room', hook: 'evade', per: 'battle', status: 'supported' },
  { id: 'spark_shared', hook: 'post', per: 'battle', status: 'supported', rider: true },
  { id: 'call_of_the_wild', hook: 'turn', per: 'run', status: 'supported' },
  { id: 'old_tactics', hook: 'hazard', per: 'run', backstory: 'bs_ex_criminal', status: 'supported' },
  { id: 'resonance_pulse', hook: 'status', per: 'run', backstory: 'bs_aether', status: 'supported' },
  { id: 'old_style_surge', hook: 'move', per: 'run', backstory: 'bs_hisui', status: 'supported' },
];
export const FEAT_IDS = FEATS.map((f) => f.id);
const BY_ID = new Map(FEATS.map((f) => [f.id, f]));

type V2 = NonNullable<RunState['story']['v2']>;

/** The Act the run is in (from the blueprint's current Stop), 1 when unknown. */
export function currentAct(run: RunState): number {
  const v2 = run.story.v2;
  return v2?.blueprint?.stops[Math.max(0, (v2.stops.index ?? 1) - 1)]?.act ?? 1;
}

/** Off when the setting is Off or the run is Hardcore. */
export function dramaticMode(run: RunState): V2['dramatic'] {
  const v2 = run.story.v2;
  if (!v2 || isHardcore(run.rules)) return 'off';
  return v2.dramatic;
}

const battleKey = (run: RunState): string => `b${run.encountersCompleted}`;

/** Boss, Gym, Elite, Champion, Rival, Alpha, Totem or raid fight. */
export function significantBattle(battle: BattleState): boolean {
  return isBossFight(battle) || Boolean(battle.rivalId) || Boolean(battle.alpha) || Boolean(battle.totem) || Boolean(battle.raid);
}

/** A story-critical final fight (Refuse to Fall): the Champion, or a fight the story flags as final (fact `final_battle`). */
export function finalStoryBattle(run: RunState, battle: BattleState): boolean {
  return battle.trainer?.classId === 'champion' || run.story.v2?.facts['final_battle'] === true;
}

const eliteOrChampion = (battle: BattleState): boolean => battle.trainer?.classId === 'elite-four' || battle.trainer?.classId === 'champion';

function bankMax(content: Content, v2: V2): number {
  const f = content.balance.story.feats;
  return v2.heartbond.latched.includes(9) ? f.bankAtLevel9 : f.bank;
}

function addCharge(content: Content, v2: V2, points: number): boolean {
  const f = content.balance.story.feats;
  const st = v2.feats;
  st.charge = Math.min(f.chargeMax, st.charge + points);
  if (st.charge >= f.chargeMax && st.banked < bankMax(content, v2)) {
    st.banked += 1;
    st.charge = 0;
    return true;
  }
  return false;
}

/**
 * Pays one Charge source. `scope` names the battle, Act or beat it belongs to (defaults: this battle, this Act).
 * Returns whether a Feat was banked. No Charge with Dramatic Moments Off; capped per scope through the ledger.
 */
export function gainCharge(content: Content, run: RunState, source: string, scope?: string): { gained: number; banked: boolean } {
  const v2 = run.story.v2;
  const rule = content.balance.story.feats.charge[source];
  if (!v2 || !rule || !v2.heartbond.partner || dramaticMode(run) === 'off') return { gained: 0, banked: false };
  const key = scope ?? (rule.per === 'act' ? `act${currentAct(run)}` : battleKey(run));
  const prefix = `${key}:${source}:`;
  const used = v2.feats.gains.filter((g) => g.startsWith(prefix)).length;
  if (used >= rule.limit) return { gained: 0, banked: false };
  v2.feats.gains.push(`${prefix}${used}`);
  if (v2.feats.gains.length > 400) v2.feats.gains.splice(0, v2.feats.gains.length - 400);
  return { gained: rule.points, banked: addCharge(content, v2, rule.points) };
}

/** The Keystone Memory's guaranteed Feat slot: banks one (once a run, up to the bank limit). */
export function keystoneFeat(content: Content, run: RunState): boolean {
  const v2 = run.story.v2;
  if (!v2 || dramaticMode(run) === 'off' || v2.feats.gains.includes('keystone')) return false;
  v2.feats.gains.push('keystone');
  if (v2.feats.banked >= bankMax(content, v2)) return false;
  v2.feats.banked += 1;
  return true;
}

/** Prompt mode: the player pressed "Memory stirs"; the next qualifying moment may fire the Feat. */
export function armFeat(run: RunState): boolean {
  const v2 = run.story.v2;
  if (!v2 || v2.feats.banked <= 0 || dramaticMode(run) !== 'prompt') return false;
  v2.feats.armed = true;
  return true;
}

/** What the engine needs this turn: the partner's uid and the Feats it may fire (moment conditions are checked at the hook). */
export interface FeatGate { uid: string; allowed: readonly string[]; final: boolean; boss: boolean; fired?: string; broke?: readonly string[]; detail?: string }

/**
 * The Feats the partner may fire this turn, or null. Checks the setting, the bank, the battle, the turn, the run caps,
 * the backstory and the per-Feat rules; the engine checks the moment itself.
 */
export function featGate(content: Content, run: RunState): FeatGate | null {
  const v2 = run.story.v2;
  const battle = run.battle;
  const uid = v2?.heartbond.partner;
  if (!v2 || !battle || !uid || v2.feats.banked <= 0) return null;
  const mode = dramaticMode(run);
  if (mode === 'off' || (mode === 'prompt' && !v2.feats.armed)) return null;
  const f = content.balance.story.feats;
  if (!significantBattle(battle) || battle.turn + 1 < f.minTurn) return null;
  if (eliteOrChampion(battle) && v2.facts['answer_lock'] === true) return null;
  const used = v2.feats.used;
  const key = battleKey(run);
  const act = currentAct(run);
  if (used.filter((u) => u.battle === key).length >= f.caps.battle) return null;
  if (used.filter((u) => u.act === act).length >= f.caps.act || used.length >= f.caps.run) return null;
  const mon = run.party.find((m) => m.uid === uid);
  if (!mon || mon.hp <= 0) return null;
  const temperament = temperamentOf(personalityOfMon(mon).id);
  const level8 = v2.heartbond.latched.includes(8);
  const final = finalStoryBattle(run, battle);
  const boss = isBossFight(battle) || Boolean(battle.rivalId);
  const backstory = v2.module?.backstory ?? v2.protagonist?.backstory;
  const allowed = FEATS.filter((d) => {
    if (d.status !== 'supported' || d.rider) return false;
    if (d.backstory && d.backstory !== backstory) return false;
    const times = used.filter((u) => u.id === d.id).length;
    if (times >= f.caps.sameFeat || (d.per === 'run' && times >= 1)) return false;
    if (d.id === 'not_yet') return boss;
    if (d.id === 'refuse_to_fall') return final;
    if (d.id === 'read_the_room') return temperament === 'tm_intelligent' || level8;
    if (d.id === 'against_the_odds') return boss || Boolean(battle.doubles);
    if (d.id === 'between_them_and_it') return Boolean(battle.doubles);
    if (d.id === 'call_of_the_wild') return !battle.doubles && (backstory === 'bs_viridian' || Number(v2.facts['rapport'] ?? 0) >= 6);
    return true;
  }).map((d) => d.id);
  const broke = v2.feats.gains.filter((g) => g.startsWith('brk:')).map((g) => g.slice(4));
  return allowed.length ? { uid, allowed, final, boss, broke } : null;
}

/**
 * The engine reported a Feat: spend the bank, record it and take the Moment Director's major slot. Heartbond pays
 * `feat` through `heartbondTurn` in the same ranked call as clutch and Hyper, so only one of them pays that turn. Returns false if nothing was banked (the engine never fires without one).
 */
export function recordFeat(content: Content, run: RunState, id: string, detail?: string): boolean {
  const v2 = run.story.v2;
  const uid = v2?.heartbond.partner;
  if (!v2 || !uid || !BY_ID.has(id) || v2.feats.banked <= 0) return false;
  v2.feats.banked -= 1;
  v2.feats.armed = false;
  v2.feats.used.push({ id, battle: battleKey(run), act: currentAct(run) });
  v2.feats.first ??= id;
  if (id === 'break_the_rule' && detail) v2.feats.gains.push(`brk:${detail}`);
  noteMoments(run, 'major');
  if (run.battle) run.story.majorCuesThisBattle += 1;
  return true;
}

/** The partner's most memorable memory, as a phrase ("the rockfall"), or null. Deterministic: importance, then latest. */
export function memoryPhrase(run: RunState, uid: string): string | null {
  const mem = [...(run.story.histories[uid]?.memories ?? [])].sort((a, b) => b.importance - a.importance || b.seq - a.seq)[0];
  if (!mem) return null;
  const t = mem.text.trim().replace(/[.!]+$/, '');
  return t ? t[0]!.toLowerCase() + t.slice(1) : null;
}

/** The Feat's message: its own line, then "{pokemon} remembered {memory}." when it has a memory to quote. */
export function featLines(text: Readonly<Record<string, string>>, id: string, pokemon: string, memory: string | null): string[] {
  const out: string[] = [];
  const own = text[`feat.${id}.line`];
  if (own) out.push(renderTemplate(own, { pokemon }));
  if (memory && text['feat.remembered']) out.push(renderTemplate(text['feat.remembered'], { pokemon, memory }));
  return out;
}

/**
 * Spark Shared: a Feat fired in a double battle also gives the partner's ally +1 to every stat (stages, so a switch
 * clears it). Returns the ally's uid, or null.
 */
export function sparkShared(run: RunState): string | null {
  const battle = run.battle;
  const uid = run.story.v2?.heartbond.partner;
  const d = battle?.doubles;
  if (!battle || !d || !uid) return null;
  const primary = run.party[battle.activeIndex];
  const second = d.player.index >= 0 ? run.party[d.player.index] : undefined;
  const ally = primary?.uid === uid ? second : second?.uid === uid ? primary : undefined;
  if (!ally || ally.hp <= 0) return null;
  const stages = ally === primary ? battle.playerStages : d.player.stages;
  for (const k of ['atk', 'def', 'spa', 'spd', 'spe'] as const) stages[k] = Math.min(6, stages[k] + 1);
  return ally.uid;
}

/** Whether the partner's HP frame should show the Resolve spark (a Feat is banked and Dramatic Moments is on). */
export function featCharged(run: RunState): boolean {
  return dramaticMode(run) !== 'off' && (run.story.v2?.feats.banked ?? 0) > 0;
}

export const featDef = (id: string): FeatDef | undefined => BY_ID.get(id);
