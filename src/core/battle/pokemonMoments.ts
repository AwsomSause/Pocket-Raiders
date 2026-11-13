// Pokémon moments inside the battle engine (Beta 0.6 batch 1): the "last stand" moments (a fatal hit is survived) and the
// run-end revive "Failure Will (NOT) Be Tolerated". The rules live here; the data and rolls live in core/moments.
// Outcomes never depend on animation: the events below only describe what already happened.

import { calcStats, maxPp } from '../pokemon';
import { currentEnemy, freshStages, freshVolatile, type PokemonInstance } from '../state';
import { clampStage } from './damage';
import { momentKey, momentRoll, momentsFor, pokemonMoment, runClaimKey, type MomentEffect, type PokemonMoment } from '../moments/pokemonMoments';
import type { BattleContext, BattleEvent, Combatant } from './engine';

export type PMomentEvent = Extract<BattleEvent, { type: 'pmoment' }>;

const Claim = { cinematic: 'pm-cine' } as const;

/** Applies a moment's effect numbers. Returns the HP the Pokémon is left with (it was already going to be at least 1). */
function applyEffect(ctx: BattleContext, c: Combatant, fx: MomentEffect, m: PokemonMoment, turnKey: number): number {
  const content = ctx.content;
  const max = calcStats(content, c.mon).hp;
  let hp = 1;
  if (fx.healPct) hp = Math.min(max, 1 + Math.floor((max * fx.healPct) / 100));
  if (fx.cure) {
    c.mon.status = null;
    c.vol.confusion = 0;
  }
  for (const [stat, n] of Object.entries(fx.boost ?? {}) as [keyof typeof c.stages, number][]) c.stages[stat] = clampStage((c.stages[stat] ?? 0) + n);
  if (fx.boostBest) {
    const s = calcStats(content, c.mon);
    const stat = s.spa > s.atk ? 'spa' : 'atk';
    c.stages[stat] = clampStage((c.stages[stat] ?? 0) + fx.boostBest);
  }
  if (fx.partyHealPct) {
    for (const p of ctx.party) {
      if (p.uid === c.mon.uid || p.hp <= 0) continue;
      const pmax = calcStats(content, p).hp;
      p.hp = Math.min(pmax, p.hp + Math.floor((pmax * fx.partyHealPct) / 100));
    }
  }
  if (fx.ppRestore) for (const slot of c.mon.moves) slot.pp = Math.min(maxPp(content, slot), slot.pp + fx.ppRestore);
  const foe = currentEnemy(ctx.battle);
  for (const [stat, n] of Object.entries(fx.foeStage ?? {}) as [keyof typeof ctx.battle.enemyStages, number][]) ctx.battle.enemyStages[stat] = clampStage((ctx.battle.enemyStages[stat] ?? 0) + n);
  if (fx.foeConfuse && foe.hp > 0) ctx.battle.enemyVolatile.confusion = Math.max(ctx.battle.enemyVolatile.confusion, 3);
  if (fx.foeHpPct && foe.hp > 0) foe.hp = Math.max(1, foe.hp - Math.floor((calcStats(content, foe).hp * fx.foeHpPct) / 100));
  if (fx.foeStatus && foe.hp > 0 && !foe.status && ctx.moments && momentRoll(ctx.moments.seed, `${m.id}:status`, c.mon.uid, turnKey, fx.foeStatusChance / 100)) foe.status = { id: fx.foeStatus } as PokemonInstance['status'];
  if (fx.guard) ctx.battle.storyEffects.push(`pm-guard:${c.mon.uid}:${ctx.battle.turn + fx.guard}`);
  return hp;
}

/** May a cinematic of this tier play now? At most one per battle; the Moment Director has the run-wide say. */
function cinematicNow(ctx: BattleContext, tier: PokemonMoment['tier'], force = false): boolean {
  const hooks = ctx.moments;
  if (!hooks || tier === 'minor') return false;
  if (!force && (ctx.battle.storyEffects.includes(Claim.cinematic) || !hooks.cinematic(tier))) return false;
  ctx.battle.storyEffects.push(Claim.cinematic);
  hooks.noteCinematic(tier);
  return true;
}

function eventFor(ctx: BattleContext, c: Combatant, m: PokemonMoment, hpAfter: number, cinematic: boolean): PMomentEvent {
  return { type: 'pmoment', side: c.side, uid: c.mon.uid, speciesId: c.mon.speciesId, id: m.id, name: m.name, tier: m.tier, hpAfter, cinematic, scene: Boolean(m.scene) && cinematic };
}

/** Halves damage while a Dig-In style guard is up. */
export function guardAmount(ctx: BattleContext, c: Combatant, amount: number): number {
  if (c.side !== 'player' || amount <= 0) return amount;
  const prefix = `pm-guard:${c.mon.uid}:`;
  const up = ctx.battle.storyEffects.some((s) => s.startsWith(prefix) && Number(s.slice(prefix.length)) >= ctx.battle.turn);
  return up ? Math.ceil(amount / 2) : amount;
}

/**
 * A hit would knock your Pokémon out: the first eligible last-stand moment whose roll succeeds saves it. Returns the HP it is
 * left with (at least 1), or null. The caller sets the HP. `turnKey` makes each turn's roll its own.
 */
export function tryLethalMoment(ctx: BattleContext, c: Combatant): number | null {
  const hooks = ctx.moments;
  if (!hooks || c.side !== 'player') return null;
  const turnKey = ctx.battle.turn;
  for (const m of momentsFor(ctx.content, c.mon, 'lethal')) {
    if (!m.effect) continue;
    const key = momentKey(m, c.mon.uid);
    if (m.limit === 'battle' ? ctx.battle.storyEffects.includes(key) : hooks.flags[key] !== undefined) continue;
    // The limit is spent even when the roll fails: one chance each, never a re-roll by reloading.
    if (m.limit === 'battle') ctx.battle.storyEffects.push(key);
    else hooks.flags[key] = 1;
    if (!momentRoll(hooks.seed, m.id, c.mon.uid, turnKey, m.chance)) continue;
    const hpAfter = applyEffect(ctx, c, m.effect, m, turnKey);
    (ctx.momentQueue ??= []).push(eventFor(ctx, c, m, hpAfter, cinematicNow(ctx, m.tier)));
    return hpAfter;
  }
  return null;
}

/**
 * The last Pokémon is down and the run would really end: Failure Will (NOT) Be Tolerated may bring a construct back, once
 * per run. Returns true when the battle goes on (the Pokémon is back up, Overcharged).
 */
export function tryRunEndMoment(ctx: BattleContext, events: BattleEvent[]): boolean {
  const hooks = ctx.moments;
  if (!hooks || !hooks.runWouldEnd()) return false;
  const m = pokemonMoment('failure-not-tolerated');
  if (!m?.effect || m.status === 'disabled' || hooks.flags[runClaimKey(m)] !== undefined) return false;
  const mon = ctx.party.find((p) => momentsFor(ctx.content, p, 'runEnd').includes(m));
  if (!mon) return false;
  // One claim per run, spent whether or not the roll succeeds, so a reload or replay cannot roll again.
  hooks.flags[runClaimKey(m)] = 1;
  if (!momentRoll(hooks.seed, m.id, mon.uid, ctx.battle.turn, m.chance)) return false;
  mon.overcharged = true;
  mon.hp = Math.max(1, Math.floor(calcStats(ctx.content, mon).hp));
  mon.status = null;
  // The Pokémon is back in front with clean stat stages; the rest of the party stays down.
  ctx.battle.activeIndex = ctx.party.indexOf(mon);
  ctx.battle.playerStages = freshStages();
  ctx.battle.playerVolatile = freshVolatile();
  ctx.battle.needsSwitch = false;
  ctx.battle.outcome = null;
  events.push({ type: 'pmoment', side: 'player', uid: mon.uid, speciesId: mon.speciesId, id: m.id, name: m.name, tier: m.tier, hpAfter: mon.hp, cinematic: cinematicNow(ctx, 'landmark', true), scene: true });
  return true;
}
