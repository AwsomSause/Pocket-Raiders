// Pokémon moments inside the battle engine (Beta 0.6 batch 1): the "last stand" moments (a fatal hit is survived) and the
// run-end revive "Failure Will (NOT) Be Tolerated". The rules live here; the data and rolls live in core/moments.
// Outcomes never depend on animation: the events below only describe what already happened.

import { calcStats, maxPp } from '../pokemon';
import { Rng, hashSeed } from '../rng';
import { currentEnemy, freshStages, freshVolatile, type PokemonInstance } from '../state';
import { clampStage } from './damage';
import { isStatusImmune } from './damage';
import { momentKey, momentMatches, momentRoll, momentsFor, pokemonMoment, runClaimKey, type MomentEffect, type MomentTrigger, type PokemonMoment } from '../moments/pokemonMoments';
import type { BattleContext, BattleEvent, Combatant } from './engine';

export type PMomentEvent = Extract<BattleEvent, { type: 'pmoment' }>;

const Claim = { cinematic: 'pm-cine', start: 'pm-start' } as const;
const FADE = 'pm-fade:';
/** The one run-end revival a run gets, whichever moment uses it. */
export const RUN_END_CLAIM = 'pm:runend-used';
const NOFLINCH = 'pm-noflinch:';
const PENDING = 'pm-pending:';
const PRIO = 'pm-prio:';
const NIGHTMARE = 'pm-nightmare:';
const NEXTBOOST = 'pm-nextboost:';
const CONTACTPSN = 'pm-contactpsn:';
const MOVEBOOST = 'pm-moveboost:';

/** One seeded number in [0, 1) for a moment's own pick (a move to learn). Stateless: same inputs, same answer. */
function momentUnit(ctx: BattleContext, id: string, uid: string, turn: number): number {
  return new Rng(hashSeed(`${ctx.moments?.seed ?? ''}:pmoment:${id}:${uid}:${turn}`)).float();
}

/** Puts a move in the Pokémon's last slot for this battle (Mimic's backup puts the old move back at the end of the fight). */
function learnForBattle(ctx: BattleContext, c: Combatant, moveId: string): void {
  const mimic = ctx.battle.extra.mimic;
  const move = ctx.content.moves.get(moveId);
  if (!move || mimic[c.mon.uid] || c.mon.moves.some((m) => m.id === moveId)) return;
  const slot = Math.min(c.mon.moves.length, 3);
  mimic[c.mon.uid] = { kind: 'mimic', slot, moves: c.mon.moves.map((m) => ({ ...m })) };
  c.mon.moves[slot] = { id: moveId, pp: move.pp };
}

/** Flinch can't stop a Pokémon whose moment says so (Mewtwo Armored). */
export function momentNoFlinch(ctx: BattleContext, c: Combatant): boolean {
  return c.side === 'player' && ctx.battle.storyEffects.includes(`${NOFLINCH}${c.mon.uid}`);
}

/** Damage multiplier from a waiting "next move of this type" moment (Bug swarm). 1 when none. */
export function momentDamageMult(ctx: BattleContext, c: Combatant, moveType: string, moveId = ''): number {
  if (c.side !== 'player') return 1;
  const prefix = `${NEXTBOOST}${c.mon.uid}:${moveType}:`;
  const tag = ctx.battle.storyEffects.find((t) => t.startsWith(prefix));
  const movePrefix = `${MOVEBOOST}${c.mon.uid}:${moveId}:`;
  const moveTag = moveId ? ctx.battle.storyEffects.find((t) => t.startsWith(movePrefix)) : undefined;
  return (tag ? 1 + Number(tag.slice(prefix.length)) / 100 : 1) * (moveTag ? 1 + Number(moveTag.slice(movePrefix.length)) / 100 : 1);
}

/** The boosted hit landed: the waiting boost is spent. */
export function spendMomentBoost(ctx: BattleContext, c: Combatant, moveType: string): void {
  if (c.side !== 'player') return;
  const prefix = `${NEXTBOOST}${c.mon.uid}:${moveType}:`;
  const at = ctx.battle.storyEffects.findIndex((t) => t.startsWith(prefix));
  if (at >= 0) ctx.battle.storyEffects.splice(at, 1);
}

/** Toxic Blood is active on this Pokémon (contact attackers get poisoned). */
export function momentContactPoison(ctx: BattleContext, c: Combatant): boolean {
  return c.side === 'player' && ctx.battle.storyEffects.includes(`${CONTACTPSN}${c.mon.uid}`);
}

/** Extra priority on a Pokémon's first turn (Sneasel's ambush). */
export function momentPriority(ctx: BattleContext, c: Combatant): number {
  if (c.side !== 'player') return 0;
  const prefix = `${PRIO}${c.mon.uid}:`;
  for (const tag of ctx.battle.storyEffects) {
    if (!tag.startsWith(prefix)) continue;
    const [turn, bonus] = tag.slice(prefix.length).split(':').map(Number) as [number, number];
    if (ctx.battle.turn === turn) return bonus;
  }
  return 0;
}

/** Applies a moment's effect numbers. Returns the HP the Pokémon is left with (it was already going to be at least 1). */
function applyEffect(ctx: BattleContext, c: Combatant, fx: MomentEffect, m: PokemonMoment, turnKey: number): number {
  const content = ctx.content;
  const foe = currentEnemy(ctx.battle);
  const max = calcStats(content, c.mon).hp;
  let hp = 1;
  if (fx.healPct) hp = Math.min(max, 1 + Math.floor((max * fx.healPct) / 100));
  if (fx.cure) {
    c.mon.status = null;
    c.vol.confusion = 0;
  }
  // Own boosts; with `boostTurns` they are taken back after that many turns (a fade tag the end of turn reads).
  const raise = (stat: keyof typeof c.stages, n: number): void => {
    const before = c.stages[stat] ?? 0;
    c.stages[stat] = clampStage(before + n);
    const gained = c.stages[stat] - before;
    if (fx.boostTurns && gained !== 0) ctx.battle.storyEffects.push(`${FADE}${c.mon.uid}:${ctx.battle.turn + fx.boostTurns - 1}:${stat}:${gained}`);
  };
  for (const [stat, n] of Object.entries(fx.boost ?? {}) as [keyof typeof c.stages, number][]) raise(stat, n);
  if (fx.boostBest) {
    const s = calcStats(content, c.mon);
    raise(s.spa > s.atk ? 'spa' : 'atk', fx.boostBest);
  }
  if (fx.critStage) {
    c.vol.momentCrit = Math.min(3, (c.vol.momentCrit ?? 0) + fx.critStage);
    if (fx.boostTurns) ctx.battle.storyEffects.push(`${FADE}${c.mon.uid}:${ctx.battle.turn + fx.boostTurns - 1}:crit:${fx.critStage}`);
  }
  if (fx.weather && !ctx.battle.weather?.primal && !ctx.battle.extra.delta) ctx.battle.weather = { id: fx.weather.id, turns: fx.weather.turns };
  if (fx.healNowPct && c.mon.hp > 0) c.mon.hp = Math.min(max, c.mon.hp + Math.floor((max * fx.healNowPct) / 100));
  if (fx.partyHealPct) {
    for (const p of ctx.party) {
      if (p.uid === c.mon.uid || p.hp <= 0) continue;
      const pmax = calcStats(content, p).hp;
      p.hp = Math.min(pmax, p.hp + Math.floor((pmax * fx.partyHealPct) / 100));
    }
  }
  if (fx.typeCopy && foe.hp > 0) c.vol.typeList = [...(content.species.get(foe.speciesId)?.types ?? [])];
  if (fx.learnFoeMove && foe.hp > 0) {
    const options = foe.moves.map((mv) => mv.id).filter((id) => !c.mon.moves.some((mv) => mv.id === id));
    if (options.length) learnForBattle(ctx, c, options[Math.floor(momentUnit(ctx, `${m.id}:sketch`, c.mon.uid, turnKey) * options.length)]!);
  }
  if (fx.learnTmMove) {
    const pool = [...(content.learnables.get(c.mon.speciesId) ?? [])].filter((id) => content.moves.has(id) && content.moves.get(id)!.power !== null && !c.mon.moves.some((mv) => mv.id === id)).sort();
    if (pool.length) learnForBattle(ctx, c, pool[Math.floor(momentUnit(ctx, `${m.id}:tm`, c.mon.uid, turnKey) * pool.length)]!);
  }
  if (fx.nextBoost) ctx.battle.storyEffects.push(`${NEXTBOOST}${c.mon.uid}:${fx.nextBoost.type}:${fx.nextBoost.pct}`);
  if (fx.moveBoost) ctx.battle.storyEffects.push(`${MOVEBOOST}${c.mon.uid}:${fx.moveBoost.move}:${fx.moveBoost.pct}`);
  if (fx.contactPoison) ctx.battle.storyEffects.push(`${CONTACTPSN}${c.mon.uid}`);
  if (fx.noFlinch) ctx.battle.storyEffects.push(`${NOFLINCH}${c.mon.uid}`);
  if (fx.firstPriority) ctx.battle.storyEffects.push(`${PRIO}${c.mon.uid}:${ctx.battle.turn}:${fx.firstPriority}`);
  if (fx.foeNightmarePct && foe.hp > 0) ctx.battle.storyEffects.push(`${NIGHTMARE}${fx.foeNightmarePct}`);
  if (fx.friendship) c.mon.friendship = Math.min(255, c.mon.friendship + fx.friendship);
  if (fx.statusLeft && c.mon.status) c.mon.status = { ...c.mon.status, left: fx.statusLeft };
  if (fx.sleepSelf && c.mon.hp > 0 && !c.mon.status) c.mon.status = { id: 'slp', turns: fx.sleepSelf };
  if (fx.ppRestore) for (const slot of c.mon.moves) slot.pp = Math.min(maxPp(content, slot), slot.pp + fx.ppRestore);
  for (const [stat, n] of Object.entries(fx.foeStage ?? {}) as [keyof typeof ctx.battle.enemyStages, number][]) ctx.battle.enemyStages[stat] = clampStage((ctx.battle.enemyStages[stat] ?? 0) + n);
  if (fx.foeConfuse && foe.hp > 0 && (!ctx.moments || momentRoll(ctx.moments.seed, `${m.id}:confuse`, c.mon.uid, turnKey, fx.foeConfuseChance / 100))) ctx.battle.enemyVolatile.confusion = Math.max(ctx.battle.enemyVolatile.confusion, 3);
  if (fx.foeHpPct && foe.hp > 0) foe.hp = Math.max(1, foe.hp - Math.floor((calcStats(content, foe).hp * fx.foeHpPct) / 100));
  if (fx.foeStatus && foe.hp > 0 && !foe.status && !isStatusImmune(fx.foeStatus, content.species.get(foe.speciesId)?.types ?? []) && ctx.moments && momentRoll(ctx.moments.seed, `${m.id}:status`, c.mon.uid, turnKey, fx.foeStatusChance / 100)) foe.status = { id: fx.foeStatus } as PokemonInstance['status'];
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
  return { type: 'pmoment', side: c.side, uid: c.mon.uid, speciesId: c.mon.speciesId, id: m.id, name: m.name, tier: m.tier, hpAfter, cinematic, scene: Boolean(m.scene) && cinematic, trigger: m.trigger };
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
  // Every run-end revival shares one use per run.
  if (!m?.effect || m.status === 'disabled' || hooks.flags[runClaimKey(m)] !== undefined || hooks.flags[RUN_END_CLAIM] !== undefined) return false;
  const mon = ctx.party.find((p) => momentsFor(ctx.content, p, 'runEnd').includes(m));
  if (!mon) return false;
  // One claim per run, spent whether or not the roll succeeds, so a reload or replay cannot roll again.
  hooks.flags[runClaimKey(m)] = 1;
  hooks.flags[RUN_END_CLAIM] = 1;
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
  events.push({ type: 'pmoment', side: 'player', uid: mon.uid, speciesId: mon.speciesId, id: m.id, name: m.name, tier: m.tier, hpAfter: mon.hp, cinematic: cinematicNow(ctx, 'landmark', true), scene: true, trigger: 'runEnd' });
  return true;
}

/** A moment's extra conditions: enough matching party members, or a weather on the field. */
function requirementsMet(ctx: BattleContext, m: PokemonMoment, c?: Combatant): boolean {
  const r = m.requires;
  if (!r) return true;
  if (r.status && !(c && (r.status.includes('confusion') && c.vol.confusion > 0 || (c.mon.status && (r.status as string[]).includes(c.mon.status.id))))) return false;
  if (r.foeTag && !(ctx.content.species.get(currentEnemy(ctx.battle).speciesId)?.tags as string[] | undefined)?.includes(r.foeTag)) return false;
  if (r.night && ctx.period !== 'night') return false;
  if (r.foeTypes) {
    const types = ctx.content.species.get(currentEnemy(ctx.battle).speciesId)?.types as string[] | undefined;
    if (!types || !r.foeTypes.every((t) => types.includes(t))) return false;
  }
  if (r.partyMatching && ctx.party.filter((p) => p.hp > 0 && momentMatches(ctx.content, m, p.speciesId)).length < r.partyMatching) return false;
  if (r.weather && ctx.battle.weather?.id !== r.weather) return false;
  return true;
}

/** At most this many entry moments (battle start or switch-in) play for one Pokémon at once, most specific first. */
const MAX_ENTRY_MOMENTS = 2;

/**
 * "Battle start" and "switch-in" moments: the Pokémon in front gets a small edge (or the foe a small setback). Each moment has
 * its own limit and roll, spent before rolling so a reload cannot try again. Events are added to `events` in order.
 */
export function tryEntryMoments(ctx: BattleContext, c: Combatant, trigger: Extract<MomentTrigger, 'start' | 'enter'>, events: BattleEvent[]): void {
  const hooks = ctx.moments;
  if (!hooks || c.side !== 'player' || c.mon.hp <= 0) return;
  const turnKey = ctx.battle.turn;
  let played = 0;
  for (const m of momentsFor(ctx.content, c.mon, trigger)) {
    if (played >= MAX_ENTRY_MOMENTS) break;
    if (!m.effect) continue;
    if (!requirementsMet(ctx, m, c)) continue;
    const key = momentKey(m, c.mon.uid);
    if (m.limit === 'battle' ? ctx.battle.storyEffects.includes(key) : hooks.flags[m.limit === 'run' ? runClaimKey(m) : key] !== undefined) continue;
    if (m.limit === 'battle') ctx.battle.storyEffects.push(key);
    else hooks.flags[m.limit === 'run' ? runClaimKey(m) : key] = 1;
    if (!momentRoll(hooks.seed, m.id, c.mon.uid, turnKey, m.chance)) continue;
    applyEffect(ctx, c, m.effect, m, turnKey);
    events.push(eventFor(ctx, c, m, c.mon.hp, cinematicNow(ctx, m.tier)));
    played++;
  }
}

/** Battle start: runs once per battle, before the first turn's moves. */
export function tryStartMoments(ctx: BattleContext, c: Combatant, events: BattleEvent[]): void {
  if (ctx.battle.storyEffects.includes(Claim.start)) return;
  ctx.battle.storyEffects.push(Claim.start);
  tryEntryMoments(ctx, c, 'start', events);
}

/** End of a turn: timed moment boosts that have run their turns are taken back. */
export function fadeMomentBoosts(ctx: BattleContext, events: BattleEvent[]): void {
  const { battle } = ctx;
  // Darkrai's nightmare: a sleeping foe loses a slice of its HP each turn (never the last point).
  const nightmare = battle.storyEffects.find((s) => s.startsWith(NIGHTMARE));
  const foe = currentEnemy(battle);
  if (nightmare && foe.hp > 1 && foe.status?.id === 'slp') {
    const loss = Math.min(foe.hp - 1, Math.max(1, Math.floor((calcStats(ctx.content, foe).hp * Number(nightmare.slice(NIGHTMARE.length))) / 100)));
    foe.hp -= loss;
    events.push({ type: 'damage', side: 'enemy', amount: loss, hpAfter: foe.hp, effectiveness: 1, crit: false });
  }
  if (!battle.storyEffects.some((s) => s.startsWith(FADE))) return;
  const active = ctx.party[battle.activeIndex];
  battle.storyEffects = battle.storyEffects.filter((tag) => {
    if (!tag.startsWith(FADE)) return true;
    const [uid, until, stat, gained] = tag.slice(FADE.length).split(':') as [string, string, keyof typeof battle.playerStages, string];
    if (battle.turn < Number(until)) return true;
    if (active?.uid === uid && (stat as string) === 'crit') battle.playerVolatile.momentCrit = Math.max(0, (battle.playerVolatile.momentCrit ?? 0) - Number(gained));
    else if (active?.uid === uid) battle.playerStages[stat] = clampStage((battle.playerStages[stat] ?? 0) - Number(gained));
    return false;
  });
}

/**
 * Reactive moments, checked once at the end of a turn from what just happened: low HP (below the moment's percent), a KO the
 * Pokémon in front landed, a super-effective hit it took, a critical hit it took. At most two play per turn, in that order.
 * Limits are spent before the roll, like every moment. The effect applies from the next turn on.
 */
export function tryReactiveMoments(ctx: BattleContext, turnEvents: BattleEvent[], events: BattleEvent[]): void {
  const hooks = ctx.moments;
  const { battle } = ctx;
  const mon = ctx.party[battle.activeIndex];
  if (!hooks || !mon || mon.hp <= 0 || battle.outcome) return;
  const hit = turnEvents.filter((e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.side === 'player');
  const fired: Record<string, boolean> = {
    low: true,
    ko: turnEvents.some((e) => e.type === 'faint' && e.side === 'enemy'),
    super: hit.some((e) => e.effectiveness > 1),
    crit: hit.some((e) => e.crit),
    weather: Boolean(battle.weather),
    status: Boolean(mon.status) || battle.playerVolatile.confusion > 0,
  };
  const max = calcStats(ctx.content, mon).hp;
  const c: Combatant = { side: 'player', mon, stages: battle.playerStages, vol: battle.playerVolatile, flinched: false, protected: false };
  let played = 0;
  for (const trigger of ['low', 'ko', 'super', 'crit', 'weather', 'status'] as const) {
    if (!fired[trigger]) continue;
    for (const m of momentsFor(ctx.content, mon, trigger)) {
      if (played >= MAX_ENTRY_MOMENTS) return;
      if (!m.effect) continue;
      if (trigger === 'low' && !(m.hpBelow && mon.hp * 100 < max * m.hpBelow)) continue;
      if (!requirementsMet(ctx, m, c)) continue;
      const key = momentKey(m, mon.uid);
      if (m.limit === 'battle' ? battle.storyEffects.includes(key) : hooks.flags[runClaimKey(m)] !== undefined) continue;
      if (m.limit === 'battle') battle.storyEffects.push(key);
      else hooks.flags[runClaimKey(m)] = 1;
      if (!momentRoll(hooks.seed, m.id, mon.uid, battle.turn, m.chance)) continue;
      applyEffect(ctx, c, m.effect, m, battle.turn);
      events.push(eventFor(ctx, c, m, mon.hp, cinematicNow(ctx, m.tier)));
      played++;
    }
  }
}

/**
 * The player's Pokémon in front fell this turn. Two kinds of moment: its own "faint" moments (a parting shot at the foe), and
 * its party-mates' "ally" moments (a fallen friend stirs the survivors). An ally moment cannot buff a Pokémon on the bench, so it
 * waits as a pending tag and plays when that survivor is next sent out. Rolls and limits are spent at the fall.
 */
export function tryFaintMoments(ctx: BattleContext, turnEvents: BattleEvent[], events: BattleEvent[]): void {
  const hooks = ctx.moments;
  const { battle } = ctx;
  if (!hooks || battle.outcome) return;
  for (const f of turnEvents) {
    if (f.type !== 'faint' || f.side !== 'player') continue;
    const fallen = ctx.party.find((p) => p.uid === f.uid);
    if (!fallen) continue;
    const spend = (m: PokemonMoment, uid: string): boolean => {
      const key = momentKey(m, uid);
      if (m.limit === 'battle' ? battle.storyEffects.includes(key) : hooks.flags[runClaimKey(m)] !== undefined) return false;
      if (m.limit === 'battle') battle.storyEffects.push(key);
      else hooks.flags[runClaimKey(m)] = 1;
      return true;
    };
    // Its own parting shot.
    const c: Combatant = { side: 'player', mon: fallen, stages: battle.playerStages, vol: battle.playerVolatile, flinched: false, protected: false };
    for (const m of momentsFor(ctx.content, fallen, 'faint')) {
      if (!m.effect || !requirementsMet(ctx, m, c) || !spend(m, fallen.uid)) continue;
      if (!momentRoll(hooks.seed, m.id, fallen.uid, battle.turn, m.chance)) continue;
      applyEffect(ctx, c, m.effect, m, battle.turn);
      events.push(eventFor(ctx, c, m, fallen.hp, false));
      break;
    }
    // Survivors' ally moments wait for the next switch-in.
    for (const owner of ctx.party) {
      if (owner.uid === fallen.uid || owner.hp <= 0) continue;
      for (const m of momentsFor(ctx.content, owner, 'ally')) {
        if (!m.effect || (m.allyScope === 'same' && !momentMatches(ctx.content, m, fallen.speciesId))) continue;
        if (!requirementsMet(ctx, m)) continue;
        if (!spend(m, owner.uid)) continue;
        if (momentRoll(hooks.seed, m.id, owner.uid, battle.turn, m.chance)) battle.storyEffects.push(`${PENDING}${m.id}:${owner.uid}`);
      }
    }
  }
}

/** A survivor whose ally moment was waiting has just been sent out: it plays now. */
export function applyPendingMoments(ctx: BattleContext, c: Combatant, events: BattleEvent[]): void {
  const suffix = `:${c.mon.uid}`;
  const tags = ctx.battle.storyEffects.filter((t) => t.startsWith(PENDING) && t.endsWith(suffix));
  if (!tags.length) return;
  ctx.battle.storyEffects = ctx.battle.storyEffects.filter((t) => !tags.includes(t));
  for (const tag of tags) {
    const m = pokemonMoment(tag.slice(PENDING.length, tag.length - suffix.length));
    if (!m?.effect) continue;
    applyEffect(ctx, c, m.effect, m, ctx.battle.turn);
    events.push(eventFor(ctx, c, m, c.mon.hp, cinematicNow(ctx, m.tier)));
  }
}
