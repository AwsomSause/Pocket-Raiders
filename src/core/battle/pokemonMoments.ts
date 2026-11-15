// Pokémon moments inside the battle engine (Beta 0.6 batch 1): the "last stand" moments (a fatal hit is survived) and the
// run-end revive "Failure Will (NOT) Be Tolerated". The rules live here; the data and rolls live in core/moments.
// Outcomes never depend on animation: the events below only describe what already happened.

import { calcStats, maxPp } from '../pokemon';
import { Rng, hashSeed } from '../rng';
import { currentEnemy, freshStages, freshVolatile, type PokemonInstance } from '../state';
import { calcDamage, clampStage, isStatusImmune, typeEffectiveness } from './damage';
import { POKEMON_MOMENTS, STARTER_TRIOS, MOMENT_COUNTERPARTS, MOMENT_GROUPS, momentKey, momentMatches, momentRoll, momentsFor, pokemonMoment, runClaimKey, type MomentEffect, type MomentTrigger, type PokemonMoment } from '../moments/pokemonMoments';
import { bondLevel } from '../co/who';
import type { BattleContext, BattleEvent, Combatant } from './engine';
import { startRevivalStatus } from './revivalStatus';

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
// Catalog Overhaul pack statuses (POKEMON_MOMENTS.md §0.4). All are battle tags, so nothing outlives the battle.
const ENDURE = 'pm-endure:';
const KINDLED = 'pm-kindled:';
const KINDLE_NEXT = 'pm-kindlenext:';
const REMEMBER_NEXT = 'pm-remembernext';
const REMEMBERED = 'pm-remembered:';
const ROOTED = 'pm-rooted:';
const NOCONFUSE = 'pm-noconfuse:';
const NEXTPRIO = 'pm-nextprio:';
const GROUND_FLYING = 'pm-groundflying:';
const HAUNT = 'pm-haunt:';
const CONTACT_HIT = 'pm-contacthit:';
const GUARD_NEXT = 'pm-guardnext:';
const GUARDED = 'pm-guarded:';
const SUPERCUT = 'pm-supercut:';
const STATPCT = 'pm-statpct:';
const PARADOX = 'pm-paradox:';
const BRAVE = 'pm-brave:';
// Group moments (PG1 to PG18).
const STATONE = 'pm-statone:';
const RUINX = 'pm-ruinx:';
const NOATTACK = 'pm-noattack:';
const TYPEGUARD = 'pm-typeguard:';
// Species and individual moments (PS, PI).
const EVOAFTER = 'pm-evoafter:';
const ENTRYBOOST = 'pm-entryboost:';
const BOTHSKIP = 'pm-bothskip:';
const COUNTERX = 'pm-counterx:';
const SLOWFIRST = 'pm-slowfirst:';
const WRONGFACE = 'pm-wrongface:';
const ACCALL = 'pm-accall:';
const SCHOOL = 'pm-school:';
const CRITS = 'pm-crits:';
/** Run flags: knockouts per Pokémon this run (PI5) and hits it survived on exactly 1 HP (PI3). */
export const KOS_FLAG = 'pm-kos:';
export const ONE_HP_FLAG = 'pm-one-hp:';
export { EVOAFTER as MOMENT_EVOLVE_AFTER };
/** PA4: a baby that landed a move this battle (run.ts reads it when the battle ends). */
export const BRAVE_HIT = 'pm-brave-hit:';
/** PA4: how many times a baby has been brave this run (a run flag, `pm-brave-count:<uid>`). */
export const BRAVE_COUNT = 'pm-brave-count:';

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
  const kindled = ctx.battle.storyEffects.filter((t) => t.startsWith(`${KINDLED}${c.mon.uid}:${moveType}:`)).reduce((n, t) => n * (1 + Number(t.split(':').pop()) / 100), 1);
  const slow = ctx.battle.storyEffects.includes(`${SLOWFIRST}${c.mon.uid}`) ? 2 : 1;
  return (tag ? 1 + Number(tag.slice(prefix.length)) / 100 : 1) * (moveTag ? 1 + Number(moveTag.slice(movePrefix.length)) / 100 : 1) * kindled * slow;
}

/** Remembered: +10% to every stat but HP for the rest of the battle. 1 when not. */
export function momentStatMult(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>): number {
  if (c.side !== 'player') return 1;
  const tags = ctx.battle.storyEffects;
  // The Pack: +N% per other pack member.
  const prefix = `${STATPCT}${c.mon.uid}:`;
  const pack = tags.filter((t) => t.startsWith(prefix)).reduce((n, t) => n + Number(t.slice(prefix.length)), 0);
  return (tags.includes(`${REMEMBERED}${c.mon.uid}`) ? 1.1 : 1) * (1 + pack / 100);
}

/** Sibling Rivalry and Two Halves (PG1, PG15): percent on single stats for the battle. Empty when none. */
export function momentStatPcts(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>): Partial<Record<'atk' | 'def' | 'spa' | 'spd' | 'spe', number>> {
  const out: Partial<Record<'atk' | 'def' | 'spa' | 'spd' | 'spe', number>> = {};
  if (c.side !== 'player') return out;
  const prefix = `${STATONE}${c.mon.uid}:`;
  for (const t of ctx.battle.storyEffects) {
    if (!t.startsWith(prefix)) continue;
    const [stat, pct] = t.slice(prefix.length).split(':') as ['atk' | 'def' | 'spa' | 'spd' | 'spe', string];
    out[stat] = (out[stat] ?? 0) + Number(pct);
  }
  return out;
}

/** Four Seals (PG11): the extra stat its Ruin ability lowers, or null. */
export function momentRuinExtra(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>): string | null {
  if (c.side !== 'player') return null;
  const t = ctx.battle.storyEffects.find((x) => x.startsWith(`${RUINX}${c.mon.uid}:`));
  return t ? t.split(':').pop()! : null;
}

/** The Ones Who Were Angry (PG12): it won't attack this foe. A line saying so, or null. */
export function momentRefusal(ctx: Pick<BattleContext, 'battle' | 'content'>, user: Pick<Combatant, 'side' | 'mon'>, target: Pick<Combatant, 'mon'>, category: string): string | null {
  if (user.side !== 'player' || category === 'status') return null;
  const t = ctx.battle.storyEffects.find((x) => x.startsWith(`${NOATTACK}${user.mon.uid}:`));
  if (!t || !t.slice(`${NOATTACK}${user.mon.uid}:`.length).split(',').includes(target.mon.speciesId)) return null;
  const name = (id: string) => ctx.content.species.get(id)?.name ?? id;
  return `${name(user.mon.speciesId)} won't look at ${name(target.mon.speciesId)}. It won't attack it.`;
}

/** The Same Lab (PG13): damage it takes from the type its own type beats is cut. 1 when not. */
const BEATS: Record<string, string> = { grass: 'water', fire: 'grass', water: 'fire' };
export function momentTypeGuard(ctx: Pick<BattleContext, 'battle' | 'content'>, target: Pick<Combatant, 'side' | 'mon'>, moveType: string): number {
  if (target.side !== 'player') return 1;
  const t = ctx.battle.storyEffects.find((x) => x.startsWith(`${TYPEGUARD}${target.mon.uid}:`));
  if (!t) return 1;
  const own = ctx.content.species.get(target.mon.speciesId)?.types ?? [];
  return own.some((ty) => BEATS[ty] === moveType) ? 1 - Number(t.split(':').pop()) / 100 : 1;
}

/** Copy of a Copy (PS3): both sides lose this turn. The line, or null. */
export function momentSkipTurn(ctx: Pick<BattleContext, 'battle'>, user: Pick<Combatant, 'side'>): string | null {
  if (!ctx.battle.storyEffects.includes(`${BOTHSKIP}${ctx.battle.turn}`)) return null;
  return user.side === 'player' ? 'The two Ditto stare at each other. Neither can stop laughing.' : 'The other Ditto is laughing too hard to move.';
}

/** Just Standing There (PS9): its first Counter or Mirror Coat multiplier. 1 when not. */
export function momentCounterMult(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>): number {
  if (c.side !== 'player') return 1;
  const t = ctx.battle.storyEffects.find((x) => x.startsWith(`${COUNTERX}${c.mon.uid}:`));
  return t ? Number(t.split(':').pop()) : 1;
}

/** Wrong Face (PS12): its Illusion soaks the first super-effective hit as neutral. Spends the tag; true when it applies. */
export function momentWrongFace(ctx: Pick<BattleContext, 'battle'>, target: Pick<Combatant, 'side' | 'mon' | 'vol'>): boolean {
  const tag = `${WRONGFACE}${target.mon.uid}`;
  if (target.side !== 'player' || !target.vol.illusion || !ctx.battle.storyEffects.includes(tag)) return false;
  ctx.battle.storyEffects = ctx.battle.storyEffects.filter((t) => t !== tag);
  return true;
}

/** Lucky Star (PS15): the accuracy bonus in percent for every move in the battle. */
export function momentAccAll(ctx: Pick<BattleContext, 'battle'>): number {
  return ctx.battle.storyEffects.filter((t) => t.startsWith(ACCALL)).reduce((n, t) => Math.max(n, Number(t.slice(ACCALL.length))), 0);
}

/** The School (PS38): its School Form holds whatever its HP. */
export function momentSchoolHold(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>): boolean {
  return c.side === 'player' && ctx.battle.storyEffects.includes(`${SCHOOL}${c.mon.uid}`);
}

/** Critical hits this Pokémon has landed this battle (PS28). */
function momentCrits(ctx: Pick<BattleContext, 'battle'>, uid: string): number {
  const t = ctx.battle.storyEffects.find((x) => x.startsWith(`${CRITS}${uid}:`));
  return t ? Number(t.split(':').pop()) : 0;
}

/** One HP (PI3): a hit left it on exactly 1 HP; counted for the run. */
export function noteOneHp(ctx: BattleContext, mon: PokemonInstance): void {
  const flags = ctx.moments?.flags;
  if (flags) flags[`${ONE_HP_FLAG}${mon.uid}`] = Number(flags[`${ONE_HP_FLAG}${mon.uid}`] ?? 0) + 1;
}

/** Out of Time (PA12): its Protosynthesis or Quark Drive is on without sun or terrain. */
export function momentParadoxDrive(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>): boolean {
  return c.side === 'player' && ctx.battle.storyEffects.includes(`${PARADOX}${c.mon.uid}`);
}

/** Older Than the Map (PA5): the first super-effective hit it takes is cut. Returns the damage multiplier and spends the cut. */
export function momentSuperCut(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>, effectiveness: number): number {
  if (c.side !== 'player' || effectiveness <= 1) return 1;
  const prefix = `${SUPERCUT}${c.mon.uid}:`;
  const tag = ctx.battle.storyEffects.find((t) => t.startsWith(prefix));
  if (!tag) return 1;
  ctx.battle.storyEffects = ctx.battle.storyEffects.filter((t) => t !== tag);
  return 1 - Number(tag.slice(prefix.length)) / 100;
}

/**
 * Set in Stone (PA3): a Guarded Pokémon's guardian takes the next hit meant for it, from the bench, and holds on at 1 HP or
 * more. Returns the guardian when it did (the caller skips the damage), or null.
 */
export function momentGuardHit(ctx: BattleContext, c: Combatant, lost: number): PokemonInstance | null {
  if (c.side !== 'player' || lost <= 0) return null;
  const prefix = `${GUARDED}${c.mon.uid}:`;
  const tag = ctx.battle.storyEffects.find((t) => t.startsWith(prefix));
  if (!tag) return null;
  ctx.battle.storyEffects = ctx.battle.storyEffects.filter((t) => t !== tag);
  const guard = ctx.party.find((p) => p.uid === tag.slice(prefix.length));
  if (!guard || guard.hp <= 0 || guard.uid === c.mon.uid) return null;
  guard.hp = Math.max(1, guard.hp - lost);
  (ctx.momentQueue ??= []).push({ type: 'raid', tone: 'info', text: `${ctx.content.species.get(guard.speciesId)?.name ?? 'Its guardian'} steps forward and takes the hit!` });
  return guard;
}

/**
 * Sleeping Giants (PA15): a hit is about to knock out the Pokémon in front, and a giant on the bench gets up and takes it.
 * It takes the damage from the bench and holds at 1 HP or more; it does not stay in front (limited, see the status note).
 */
export function tryAllyLethalMoment(ctx: BattleContext, c: Combatant, lost: number): boolean {
  const hooks = ctx.moments;
  if (!hooks || c.side !== 'player') return false;
  for (const giant of ctx.party) {
    if (giant.uid === c.mon.uid || giant.hp <= 0) continue;
    for (const m of momentsFor(ctx.content, giant, 'allyLethal')) {
      const key = momentKey(m, giant.uid);
      if (ctx.battle.storyEffects.includes(key)) continue;
      ctx.battle.storyEffects.push(key);
      if (!momentRoll(hooks.seed, m.id, giant.uid, ctx.battle.turn, m.chance)) continue;
      giant.hp = Math.max(1, giant.hp - lost);
      const gc: Combatant = { side: 'player', mon: giant, stages: freshStages(), vol: freshVolatile(), flinched: false, protected: false };
      (ctx.momentQueue ??= []).push(eventFor(ctx, gc, m, giant.hp, cinematicNow(ctx, m.tier)));
      return true;
    }
  }
  return false;
}

/** Frozen in Place: it won't give ground, so it can't be switched out yet. */
export function momentRooted(ctx: Pick<BattleContext, 'battle'>, uid: string): boolean {
  const prefix = `${ROOTED}${uid}:`;
  return ctx.battle.storyEffects.some((t) => t.startsWith(prefix) && Number(t.slice(prefix.length)) >= ctx.battle.turn);
}

/** Resolute: it can't be confused. */
export function momentNoConfuse(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>): boolean {
  return c.side === 'player' && ctx.battle.storyEffects.includes(`${NOCONFUSE}${c.mon.uid}`);
}

/** Dig In: the first Ground move hits Flying-types. Returns the defender's types to use, and spends the edge when it is used. */
export function momentGroundTypes<T extends string>(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>, moveType: string, types: readonly T[]): readonly T[] {
  if (c.side !== 'player' || moveType !== 'ground' || !types.includes('flying' as T)) return types;
  const at = ctx.battle.storyEffects.indexOf(`${GROUND_FLYING}${c.mon.uid}`);
  if (at < 0) return types;
  ctx.battle.storyEffects.splice(at, 1);
  return types.filter((t) => t !== 'flying');
}

/** A contact move hit one of your Pokémon this turn (Spite in the Blood reads it when it falls). */
export function noteContactHit(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>): void {
  if (c.side !== 'player') return;
  const tag = `${CONTACT_HIT}${c.mon.uid}:${ctx.battle.turn}`;
  if (!ctx.battle.storyEffects.includes(tag)) ctx.battle.storyEffects.push(tag);
}

/** The opponent's ace: its highest-level Pokémon (the last one listed on a tie). */
function foeAce(ctx: BattleContext): PokemonInstance {
  const team = ctx.battle.enemyTeam;
  return team.reduce((best, m) => (m.level >= best.level ? m : best), team[0]!);
}

/** The Little Ones (PA4): a scared baby landed a move. Its Bond is paid when the battle ends. */
export function noteBraveHit(ctx: Pick<BattleContext, 'battle'>, c: Pick<Combatant, 'side' | 'mon'>): void {
  if (c.side !== 'player') return;
  const prefix = `${BRAVE}${c.mon.uid}:`;
  const tag = ctx.battle.storyEffects.find((t) => t.startsWith(prefix));
  if (!tag) return;
  ctx.battle.storyEffects = ctx.battle.storyEffects.filter((t) => t !== tag);
  ctx.battle.storyEffects.push(`${BRAVE_HIT}${c.mon.uid}:${tag.slice(prefix.length)}`);
}

/** The boosted hit landed: the waiting boost is spent. */
export function spendMomentBoost(ctx: BattleContext, c: Combatant, moveType: string, moveId = ''): void {
  if (c.side !== 'player') return;
  // Wait for It (PS13) is one move; Just Standing There (PS9) is one Counter or Mirror Coat.
  const spent = [`${SLOWFIRST}${c.mon.uid}`, ...(moveId === 'counter' || moveId === 'mirror-coat' ? [`${COUNTERX}${c.mon.uid}`] : [])];
  ctx.battle.storyEffects = ctx.battle.storyEffects.filter((t) => !spent.some((x) => t === x || t.startsWith(`${x}:`)));
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
  // Wait for It (PS13): its first move always goes last.
  if (ctx.battle.storyEffects.includes(`${SLOWFIRST}${c.mon.uid}`)) return -7;
  // Resolute, Takes Advantage: the next move after the moment (set on turn T, it counts from turn T+1, once).
  const next = `${NEXTPRIO}${c.mon.uid}:`;
  for (const tag of ctx.battle.storyEffects) {
    if (!tag.startsWith(next)) continue;
    const [turn, bonus] = tag.slice(next.length).split(':').map(Number) as [number, number];
    if (ctx.battle.turn > turn) return bonus;
  }
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
  const tags = ctx.battle.storyEffects;
  const add = (t: string): void => { if (!tags.includes(t)) tags.push(t); };
  if (fx.endure) add(`${ENDURE}${c.mon.uid}`);
  if (fx.kindle) add(`${KINDLED}${c.mon.uid}:${fx.kindle.type}:${fx.kindle.pct}`);
  if (fx.kindleNext) add(`${KINDLE_NEXT}${fx.kindleNext.type}:${fx.kindleNext.pct}`);
  if (fx.rememberedNext) add(REMEMBER_NEXT);
  if (fx.rooted) add(`${ROOTED}${c.mon.uid}:${ctx.battle.turn + fx.rooted}`);
  if (fx.resolute) {
    add(`${NOFLINCH}${c.mon.uid}`);
    add(`${NOCONFUSE}${c.mon.uid}`);
    c.vol.confusion = 0;
  }
  const nextPrio = fx.nextPriority ?? (fx.resolute ? 1 : 0);
  if (nextPrio) add(`${NEXTPRIO}${c.mon.uid}:${ctx.battle.turn}:${nextPrio}`);
  if (fx.foeBadPoison && foe.hp > 0 && !foe.status && !isStatusImmune('psn', content.species.get(foe.speciesId)?.types ?? [])) foe.status = { id: 'psn', bad: true, turns: 0 } as PokemonInstance['status'];
  if (fx.groundHitsFlying) add(`${GROUND_FLYING}${c.mon.uid}`);
  if (fx.revealAce && ctx.battle.enemyTeam.length > 0) {
    const ace = foeAce(ctx);
    (ctx.momentQueue ??= []).push({ type: 'raid', tone: 'info', text: `${content.species.get(c.mon.speciesId)?.name ?? 'It'} already knows: the last one will be ${content.species.get(ace.speciesId)?.name ?? ace.speciesId}, Lv. ${ace.level}.` });
  }
  if (fx.guardNext) add(`${GUARD_NEXT}${c.mon.uid}`);
  if (fx.braveBond) add(`${BRAVE}${c.mon.uid}:${fx.braveBond}`);
  if (fx.firstSuperCut) add(`${SUPERCUT}${c.mon.uid}:${fx.firstSuperCut}`);
  if (fx.paradoxDrive) add(`${PARADOX}${c.mon.uid}`);
  if (fx.packStat) {
    const pack = ctx.party.filter((p) => momentMatches(content, m, p.speciesId));
    for (const p of pack) add(`${STATPCT}${p.uid}:${fx.packStat * (pack.length - 1)}`);
  }
  // Group moments (PG).
  const scoped = (): PokemonInstance[] => ctx.party.filter((p) => p.hp > 0 && momentMatches(content, m, p.speciesId));
  const bestOf = (mon: PokemonInstance): 'atk' | 'def' | 'spa' | 'spd' | 'spe' => {
    const st = calcStats(content, mon);
    return (['atk', 'def', 'spa', 'spd', 'spe'] as const).reduce((a, b) => (st[b] > st[a] ? b : a));
  };
  if (fx.packBest) for (const p of scoped()) add(`${STATONE}${p.uid}:${bestOf(p)}:${fx.packBest}`);
  for (const [stat, pct] of Object.entries(fx.statPct ?? {})) add(`${STATONE}${c.mon.uid}:${stat}:${pct}`);
  const skyWeather = fx.weatherBySpecies?.[c.mon.speciesId];
  if (skyWeather && !ctx.battle.weather?.primal && !ctx.battle.extra.delta) ctx.battle.weather = { id: skyWeather, turns: 1 };
  if (fx.resoluteAll) for (const p of scoped()) { add(`${NOFLINCH}${p.uid}`); add(`${NOCONFUSE}${p.uid}`); }
  if (fx.bestDefStage) {
    const st = calcStats(content, c.mon);
    raise(st.spd > st.def ? 'spd' : 'def', fx.bestDefStage);
  }
  if (fx.boostTop) raise(bestOf(c.mon), fx.boostTop);
  if (fx.trickRoom) ctx.battle.field.trickRoom = Math.max(ctx.battle.field.trickRoom ?? 0, fx.trickRoom);
  if (fx.terrainTurns && ctx.battle.terrain) ctx.battle.terrain.turns = Math.max(ctx.battle.terrain.turns, fx.terrainTurns);
  const ruin = fx.ruinExtra?.[c.mon.speciesId];
  if (ruin) add(`${RUINX}${c.mon.uid}:${ruin}`);
  if (fx.noAttackFoe) add(`${NOATTACK}${c.mon.uid}:${fx.noAttackFoe.join(',')}`);
  if (fx.typeGuard) for (const p of scoped()) add(`${TYPEGUARD}${p.uid}:${fx.typeGuard}`);
  // Species and individual moments (PS, PI).
  if (fx.evolveAfter) add(`${EVOAFTER}${c.mon.uid}:${fx.evolveAfter.to}:${ctx.battle.turn + (fx.evolveAfter.turns ?? 0)}`);
  if (fx.entryBoost) add(`${ENTRYBOOST}${fx.entryBoost.species.join(',')}:${fx.entryBoost.stat}:${fx.entryBoost.n}`);
  if (fx.bothSkip) add(`${BOTHSKIP}${ctx.battle.turn}`);
  if (fx.counterMult) add(`${COUNTERX}${c.mon.uid}:${fx.counterMult}`);
  if (fx.slowFirst) add(`${SLOWFIRST}${c.mon.uid}`);
  if (fx.wrongFace) add(`${WRONGFACE}${c.mon.uid}`);
  if (fx.accAll) add(`${ACCALL}${fx.accAll}`);
  if (fx.schoolOnce) add(`${SCHOOL}${c.mon.uid}`);
  if (fx.spendFlag && ctx.moments) delete ctx.moments.flags[fx.spendFlag.replace('{uid}', c.mon.uid)];
  if (fx.revealNext && ctx.battle.kind === 'trainer') {
    const name = (id: string) => content.species.get(id)?.name ?? id;
    const next = ctx.battle.enemyTeam.find((e, i) => i > ctx.battle.enemyIndex && e.hp > 0);
    const brave = Number(ctx.moments?.flags[`${BRAVE_COUNT}${c.mon.uid}`] ?? 0) >= 3;
    const items = brave ? ctx.battle.enemyTeam.filter((e) => e.hp > 0 && e.held && Object.keys(e.held).length > 0).map((e) => `${name(e.speciesId)}: ${Object.keys(e.held!).map((id) => content.items.get(id)?.name ?? content.catalog.get(id)?.name ?? id).join(', ')}`) : [];
    const text = `${name(c.mon.speciesId)} already knows: ${next ? `${name(next.speciesId)} comes next` : 'there is no one after this one'}.${items.length ? ` It sees what they hold. ${items.join('; ')}.` : ''}`;
    (ctx.momentQueue ??= []).push({ type: 'raid', tone: 'info', text });
  }
  if (fx.randomMove) {
    const pool = [...content.moves.values()].filter((mv) => mv.power !== null && mv.category !== 'status' && !mv.flags.includes('typeless') && !c.mon.moves.some((x) => x.id === mv.id)).map((mv) => mv.id).sort();
    const pick = pool.length ? pool[Math.floor(momentUnit(ctx, `${m.id}:glitch`, c.mon.uid, turnKey) * pool.length)]! : null;
    if (pick) {
      learnForBattle(ctx, c, pick);
      (ctx.momentQueue ??= []).push({ type: 'raid', tone: 'info', text: `${content.species.get(c.mon.speciesId)?.name ?? 'It'}'s code rewrites itself. It knows ${content.moves.get(pick)?.name ?? pick} now.` });
    }
  }
  if (fx.haunting) add(`${HAUNT}${c.mon.uid}:${ctx.battle.turn + fx.haunting.turns}:${fx.haunting.pct}:${fx.haunting.foeAccDown ?? 0}`);
  return hp;
}

/** Haunting: the spirit's accuracy cut on the foe while it haunts (PA2). 0 when none. */
export function hauntAccuracyCut(ctx: Pick<BattleContext, 'battle'>): number {
  return ctx.battle.storyEffects.filter((t) => t.startsWith(HAUNT)).reduce((n, t) => Math.max(n, Number(t.split(':')[4] ?? 0)), 0);
}

/**
 * End of a turn: each haunting spirit strikes the foe with its best damaging move at reduced power (no roll: the plain
 * damage formula, so nothing random moves). It can't be targeted, because it is no longer on the field.
 */
export function tryHauntStrikes(ctx: BattleContext, events: BattleEvent[]): void {
  const { battle, content } = ctx;
  for (const tag of battle.storyEffects.filter((t) => t.startsWith(HAUNT))) {
    const [, uid, until, pct] = tag.split(':') as [string, string, string, string];
    const spirit = ctx.party.find((p) => p.uid === uid);
    const foe = currentEnemy(battle);
    if (!spirit || foe.hp <= 0 || battle.outcome) continue;
    const foeTypes = content.species.get(foe.speciesId)?.types ?? [];
    const own = content.species.get(spirit.speciesId)?.types ?? [];
    const stats = calcStats(content, spirit);
    const foeStats = calcStats(content, foe);
    let best = 0;
    for (const slot of spirit.moves) {
      const mv = content.moves.get(slot.id);
      if (!mv || !mv.power || mv.category === 'status') continue;
      const physical = mv.category === 'physical';
      const dmg = calcDamage(content.ruleset, {
        level: spirit.level, power: Math.max(1, Math.floor((mv.power * Number(pct)) / 100)), attack: physical ? stats.atk : stats.spa, defense: physical ? foeStats.def : foeStats.spd,
        attackStage: 0, defenseStage: 0, stab: own.includes(mv.type), effectiveness: typeEffectiveness(content.typeChart, mv.type, foeTypes), crit: false, randomFactor: 100, burned: false, physical, weather: 1, final: 1,
      });
      best = Math.max(best, dmg);
    }
    if (best > 0) {
      const dealt = Math.min(foe.hp, best);
      foe.hp -= dealt;
      events.push({ type: 'raid', tone: 'info', text: `${content.species.get(spirit.speciesId)?.name ?? 'Its'} spirit strikes from beyond the field!` });
      events.push({ type: 'damage', side: 'enemy', amount: dealt, hpAfter: foe.hp, effectiveness: 1, crit: false });
    }
    if (battle.turn >= Number(until)) battle.storyEffects = battle.storyEffects.filter((t) => t !== tag);
  }
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
  // Plain and Stubborn: a waiting "survive the next hit" is spent first.
  const endure = ctx.battle.storyEffects.indexOf(`${ENDURE}${c.mon.uid}`);
  if (endure >= 0) {
    ctx.battle.storyEffects.splice(endure, 1);
    (ctx.momentQueue ??= []).push({ type: 'raid', tone: 'info', text: `${ctx.content.species.get(c.mon.speciesId)?.name ?? 'It'} is still here.` });
    return 1;
  }
  for (const m of momentsFor(ctx.content, c.mon, 'lethal')) {
    if (!m.effect) continue;
    if (!requirementsMet(ctx, m, c)) continue;
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

const LAYERS = ['individual', 'species', 'group', 'archetype', 'type'] as const;

/** A run-end scene's remembered variants that hold for this Pokémon: a run flag (`{uid}` = it), its species, or enough of a group in the party. */
function remembered(ctx: BattleContext, m: PokemonMoment, mon: PokemonInstance): NonNullable<PokemonMoment['remembers']> {
  return (m.remembers ?? []).filter((r) =>
    (!r.flag || Number(ctx.moments?.flags[r.flag.replace('{uid}', mon.uid)] ?? 0) > 0) &&
    (!r.species || r.species.includes(mon.speciesId)) &&
    (!r.groupCount || ctx.party.filter((p) => MOMENT_GROUPS[r.groupCount!.group]?.includes(p.speciesId)).length >= r.groupCount.n));
}

/** A last-stand revival (PA1's shape: Overcharged, or a revival status). */
const isLastStand = (m: PokemonMoment): boolean => Boolean(m.effect?.overcharged || m.effect?.revivalStatus);

/** The scene's lines for this Pokémon: remembered lines swapped in or added, `[Name]` filled. */
export function revivalLines(ctx: BattleContext, m: PokemonMoment, mon: PokemonInstance): string[] {
  if (!m.scene) return [];
  const lines = [...m.scene.lines];
  for (const r of remembered(ctx, m, mon)) {
    if (r.line) lines[r.line[0]] = r.line[1];
    if (r.add) lines.push(r.add);
  }
  if (m.scene.rise) lines.push(m.scene.rise);
  const name = mon.care?.nickname || ctx.content.species.get(mon.speciesId)?.name || mon.speciesId;
  return lines.map((l) => l.replace(/\[Name\]/g, name));
}

/** A moment's chance for this Pokémon: Bond steps and named species can raise it (never money). */
function chanceFor(ctx: BattleContext, m: PokemonMoment, mon: PokemonInstance): number {
  let chance = m.chance;
  if (m.chanceBond) chance = Math.min(m.chanceBond.max, chance + Math.max(0, bondLevel(ctx.content, mon) - m.chanceBond.above) * m.chanceBond.perStep);
  if (m.chancePlus && (m.chancePlus.exact ? m.chancePlus.species.includes(mon.speciesId) : momentMatches(ctx.content, { ...m, scope: { lines: m.chancePlus.species } }, mon.speciesId))) chance += m.chancePlus.plus;
  for (const r of remembered(ctx, m, mon)) chance += r.chance ?? 0;
  // The Named One (PI4): a Pokémon you named gets +5% on whichever revival would bring it back.
  if (m.trigger === 'runEnd' && mon.care?.nickname) chance += 0.05;
  return Math.min(1, chance);
}

/**
 * The last Pokémon is down and the run would really end: a run-end revival may bring one Pokémon back (Failure Will (NOT) Be
 * Tolerated, the starter, a Legendary, the mascots...). Only one fires, and they all share one use per run (pack §0.3): the
 * order is individual, species, group, archetype, type, and inside a layer the highest Bond first. Every candidate gets its
 * one roll in that order; the shared use is spent whether or not one succeeds, so a reload cannot roll again.
 */
export function tryRunEndMoment(ctx: BattleContext, events: BattleEvent[]): boolean {
  const hooks = ctx.moments;
  if (!hooks || !hooks.runWouldEnd() || hooks.flags[RUN_END_CLAIM] !== undefined) return false;
  const combatant = (mon: PokemonInstance): Combatant => ({ side: 'player', mon, stages: freshStages(), vol: freshVolatile(), flinched: false, protected: false });
  const candidates: { m: PokemonMoment; mon: PokemonInstance; order: number }[] = [];
  ctx.party.forEach((mon, at) => {
    for (const m of momentsFor(ctx.content, mon, 'runEnd')) {
      if (!m.effect || hooks.flags[runClaimKey(m)] !== undefined || !requirementsMet(ctx, m, combatant(mon))) continue;
      candidates.push({ m, mon, order: LAYERS.indexOf(m.layer ?? 'archetype') * 1000 - bondLevel(ctx.content, mon) * 10 + at / 10 });
    }
  });
  // A Pokémon in more than one last-stand archetype uses the one with the higher chance; on a tie, the one listed first (pack Part 2B).
  const listed = (m: PokemonMoment) => POKEMON_MOMENTS.indexOf(m);
  for (const c of [...candidates]) {
    if (!isLastStand(c.m)) continue;
    const rival = candidates.find((o) => o !== c && o.mon === c.mon && isLastStand(o.m) && (chanceFor(ctx, o.m, o.mon) > chanceFor(ctx, c.m, c.mon) || (chanceFor(ctx, o.m, o.mon) === chanceFor(ctx, c.m, c.mon) && listed(o.m) < listed(c.m))));
    if (rival) candidates.splice(candidates.indexOf(c), 1);
  }
  if (candidates.length === 0) return false;
  candidates.sort((a, b) => a.order - b.order);
  hooks.flags[RUN_END_CLAIM] = 1;
  const won = candidates.find(({ m, mon }) => {
    hooks.flags[runClaimKey(m)] = 1;
    return momentRoll(hooks.seed, m.id, mon.uid, ctx.battle.turn, chanceFor(ctx, m, mon));
  });
  if (!won) return false;
  const { m, mon } = won;
  const fx = m.effect!;
  if (fx.overcharged) mon.overcharged = true;
  const max = calcStats(ctx.content, mon).hp;
  mon.hp = fx.overcharged ? max : fx.reviveHpPct ? Math.max(1, Math.floor((max * fx.reviveHpPct) / 100)) : 1;
  mon.status = null;
  // The Pokémon is back in front with clean stat stages; the rest of the party stays down.
  ctx.battle.activeIndex = ctx.party.indexOf(mon);
  ctx.battle.playerStages = freshStages();
  ctx.battle.playerVolatile = freshVolatile();
  ctx.battle.needsSwitch = false;
  ctx.battle.outcome = null;
  // Its other effects (Resolute, doubled Speed) start now.
  const c: Combatant = { side: 'player', mon, stages: ctx.battle.playerStages, vol: ctx.battle.playerVolatile, flinched: false, protected: false };
  const { reviveHpMult: _m, overcharged: _o, reviveHpPct: _p, healPct: _h, revivalStatus, ...rest } = fx;
  applyEffect(ctx, c, rest, m, ctx.battle.turn);
  const memories = remembered(ctx, m, mon);
  const lines = m.scene ? revivalLines(ctx, m, mon) : undefined;
  events.push({ type: 'pmoment', side: 'player', uid: mon.uid, speciesId: mon.speciesId, id: m.id, name: m.name, tier: m.tier, hpAfter: mon.hp, cinematic: cinematicNow(ctx, 'landmark', true), scene: Boolean(m.scene), trigger: 'runEnd', ...(lines ? { lines } : {}) });
  // PA17 to PA31: the revival status starts (full HP, its rules, and the honest line of what it costs).
  if (revivalStatus) {
    const fee = memories.reduce<number | undefined>((f, r) => (r.feePct !== undefined ? Math.min(f ?? 100, r.feePct) : f), undefined);
    startRevivalStatus(ctx, c, revivalStatus, events, fee);
    for (const r of memories) {
      if (r.resolute) applyEffect(ctx, c, { resolute: true, foeStatusChance: 0, foeConfuseChance: 0 }, m, ctx.battle.turn);
      for (const [stat, n] of Object.entries(r.boost ?? {})) c.stages[stat as keyof typeof c.stages] = clampStage((c.stages[stat as keyof typeof c.stages] ?? 0) + n);
    }
  }
  return true;
}

/** The Same Lab (PG13): all three starter lines of one region are in the party, this Pokémon among them. */
export function hasStarterTrio(content: BattleContext['content'], party: readonly PokemonInstance[], mon: PokemonInstance): boolean {
  const inLine = (line: readonly string[], p: PokemonInstance) => line.includes(p.speciesId);
  return STARTER_TRIOS.some((trio) => trio.some((line) => inLine(line, mon)) && trio.every((line) => party.some((p) => inLine(line, p))));
}

/** A moment's extra conditions: enough matching party members, or a weather on the field. */
function requirementsMet(ctx: BattleContext, m: PokemonMoment, c?: Combatant, ko?: readonly PokemonInstance[]): boolean {
  const r = m.requires;
  if (!r) return true;
  if (r.status && !(c && (r.status.includes('confusion') && c.vol.confusion > 0 || (c.mon.status && (r.status as string[]).includes(c.mon.status.id))))) return false;
  if (r.foeTag && !(ctx.content.species.get(currentEnemy(ctx.battle).speciesId)?.tags as string[] | undefined)?.includes(r.foeTag)) return false;
  if (r.night && ctx.period !== 'night') return false;
  if (r.foeTypes) {
    const types = ctx.content.species.get(currentEnemy(ctx.battle).speciesId)?.types as string[] | undefined;
    if (!types || !r.foeTypes.every((t) => types.includes(t))) return false;
  }
  if (r.named && ctx.battle.kind !== 'trainer') return false;
  if (r.foeLevelAbove && !(c && currentEnemy(ctx.battle).level - c.mon.level >= r.foeLevelAbove)) return false;
  if (r.flagAtLeast && !(c && Number(ctx.moments?.flags[r.flagAtLeast.key.replace('{uid}', c.mon.uid)] ?? 0) >= r.flagAtLeast.n)) return false;
  if (r.flagBelow && !(c && Number(ctx.moments?.flags[r.flagBelow.key.replace('{uid}', c.mon.uid)] ?? 0) < r.flagBelow.n)) return false;
  if (r.partyGroups && !r.partyGroups.every((g) => ctx.party.filter((p) => p.hp > 0 && MOMENT_GROUPS[g.group]?.includes(p.speciesId)).length >= g.n)) return false;
  if (r.foeSpecies && !r.foeSpecies.includes(currentEnemy(ctx.battle).speciesId)) return false;
  if (r.starterTrio && !(c && hasStarterTrio(ctx.content, ctx.party, c.mon))) return false;
  if (r.topBond && !(c && ctx.party.every((p) => p === c.mon || !momentMatches(ctx.content, m, p.speciesId) || bondLevel(ctx.content, p) < bondLevel(ctx.content, c.mon) || (bondLevel(ctx.content, p) === bondLevel(ctx.content, c.mon) && p.friendship <= c.mon.friendship)))) return false;
  if (r.starter && !(c && ctx.moments?.starterUid === c.mon.uid)) return false;
  if (r.notVsOwnTrio && c) {
    const trios = Object.entries(MOMENT_GROUPS).filter(([g, ids]) => g.startsWith('trio-') && ids.includes(c.mon.speciesId)).map(([, ids]) => ids);
    if (ctx.battle.enemyTeam.some((e) => trios.some((ids) => ids.includes(e.speciesId)))) return false;
  }
  if (r.foeWeakTo && c) {
    const foe = currentEnemy(ctx.battle);
    const own = ctx.content.species.get(c.mon.speciesId)?.types ?? [];
    const foeTypes = ctx.content.species.get(foe.speciesId)?.types ?? [];
    if (!foeTypes.some((t) => typeEffectiveness(ctx.content.typeChart, t, own) > 1)) return false;
    if (r.foeNotGroup && MOMENT_GROUPS[r.foeNotGroup]?.some((id) => momentMatches(ctx.content, { ...m, scope: { lines: [id] } }, foe.speciesId))) return false;
  }
  if (r.foeCounterpart && !(c && MOMENT_COUNTERPARTS[c.mon.speciesId]?.includes(currentEnemy(ctx.battle).speciesId))) return false;
  if (r.lastStanding && !(c && ctx.party.every((p) => p.uid === c.mon.uid || p.hp <= 0))) return false;
  if (r.fullHp && !(c && c.mon.hp >= calcStats(ctx.content, c.mon).hp)) return false;
  if (r.foeHpBelow) {
    const foe = currentEnemy(ctx.battle);
    if (!(foe.hp > 0 && foe.hp * 100 < calcStats(ctx.content, foe).hp * r.foeHpBelow)) return false;
  }
  if (r.tailwind && !(ctx.battle.sideEffects.player.tailwind > 0 || ctx.battle.extra.delta)) return false;
  if (r.contact && !(c && ctx.battle.storyEffects.includes(`${CONTACT_HIT}${c.mon.uid}:${ctx.battle.turn}`))) return false;
  if (r.foeAceTypes) {
    const types = ctx.battle.enemyTeam.length > 0 ? (ctx.content.species.get(foeAce(ctx).speciesId)?.types as string[] | undefined) : undefined;
    if (!types || !r.foeAceTypes.some((t) => types.includes(t))) return false;
  }
  if (r.partyMatching && ctx.party.filter((p) => p.hp > 0 && momentMatches(ctx.content, m, p.speciesId)).length < r.partyMatching) return false;
  // Species and individual moments (PS, PI). A Gym Leader's class id, as core/encounters names it (not imported: battle code stays clear of it).
  if (r.gymLeader && ctx.battle.trainer?.classId !== 'gym-leader') return false;
  if (r.disguiseBroken && !(c && ctx.battle.extra.brokenFace.includes(c.mon.uid))) return false;
  if (r.stageAtLeast && !(c && (c.stages[r.stageAtLeast.stat] ?? 0) >= r.stageAtLeast.n)) return false;
  if (r.moveUses && !(c && (c.mon.moves.find((x) => x.id === r.moveUses!.move)?.uses ?? 0) >= r.moveUses.n)) return false;
  if (r.critsAtLeast && !(c && momentCrits(ctx, c.mon.uid) >= r.critsAtLeast)) return false;
  if (r.koSpecies && !(ko ?? []).some((f) => r.koSpecies!.includes(f.speciesId))) return false;
  if (r.koLegendOrAce && !(ko ?? []).some((f) => (ctx.content.species.get(f.speciesId)?.tags as string[] | undefined)?.includes('legendary') || (ctx.battle.kind === 'trainer' && ctx.battle.enemyTeam.length > 1 && foeAce(ctx).uid === f.uid))) return false;
  if (r.finalBoss && !ctx.moments?.finalBoss) return false;
  if (r.mostKos && c) {
    const kos = (p: PokemonInstance) => Number(ctx.moments?.flags[`${KOS_FLAG}${p.uid}`] ?? 0);
    if (kos(c.mon) <= 0 || ctx.party.some((p) => p !== c.mon && kos(p) >= kos(c.mon))) return false;
  }
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
  // A "next move" priority is used up once the turn after it was set is over.
  battle.storyEffects = battle.storyEffects.filter((t) => !(t.startsWith(NEXTPRIO) && battle.turn > Number(t.split(':')[2])));
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
  if (!hooks || !mon) return;
  // Tallies, whatever else happens: the foes the Pokémon in front knocked out (for the run, PI5) and its critical hits (this battle, PS28).
  const koFoes = turnEvents.filter((e) => e.type === 'faint' && e.side === 'enemy').map((e) => battle.enemyTeam.find((f) => f.uid === (e as { uid: string }).uid)).filter((f): f is PokemonInstance => !!f);
  if (koFoes.length && mon.hp > 0) hooks.flags[`${KOS_FLAG}${mon.uid}`] = Number(hooks.flags[`${KOS_FLAG}${mon.uid}`] ?? 0) + koFoes.length;
  const crits = turnEvents.filter((e) => e.type === 'damage' && e.side === 'enemy' && e.crit).length;
  if (crits) {
    const had = momentCrits(ctx, mon.uid);
    battle.storyEffects = battle.storyEffects.filter((t) => !t.startsWith(`${CRITS}${mon.uid}:`));
    battle.storyEffects.push(`${CRITS}${mon.uid}:${had + crits}`);
  }
  // A won battle still hears the knockout that won it, for the moments about that foe (PS20, PS44).
  const wonOnKo = battle.outcome === 'win' && koFoes.length > 0;
  if (mon.hp <= 0 || (battle.outcome && !wonOnKo)) return;
  const hit = turnEvents.filter((e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.side === 'player');
  const fired: Record<string, boolean> = {
    low: true,
    ko: turnEvents.some((e) => e.type === 'faint' && e.side === 'enemy'),
    super: hit.some((e) => e.effectiveness > 1),
    crit: hit.some((e) => e.crit),
    weather: Boolean(battle.weather),
    status: Boolean(mon.status) || battle.playerVolatile.confusion > 0,
    turn: true,
  };
  const max = calcStats(ctx.content, mon).hp;
  const c: Combatant = { side: 'player', mon, stages: battle.playerStages, vol: battle.playerVolatile, flinched: false, protected: false };
  let played = 0;
  for (const trigger of ['low', 'ko', 'super', 'crit', 'weather', 'status', 'turn'] as const) {
    if (!fired[trigger]) continue;
    for (const m of momentsFor(ctx.content, mon, trigger)) {
      if (played >= MAX_ENTRY_MOMENTS) return;
      if (!m.effect) continue;
      if (battle.outcome && !(m.requires?.koSpecies || m.requires?.koLegendOrAce)) continue;
      if (trigger === 'low' && !(m.hpBelow && mon.hp * 100 < max * m.hpBelow)) continue;
      if (!requirementsMet(ctx, m, c, koFoes)) continue;
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
        if (!momentRoll(hooks.seed, m.id, owner.uid, battle.turn, m.chance)) continue;
        // A Small Kindness acts for whoever comes out next, so it plays now instead of waiting for its owner.
        if (m.effect.rememberedNext || m.effect.guardNext || m.effect.hauntFallen) {
          if (m.effect.rememberedNext && !battle.storyEffects.includes(REMEMBER_NEXT)) battle.storyEffects.push(REMEMBER_NEXT);
          if (m.effect.guardNext) battle.storyEffects.push(`${GUARD_NEXT}${owner.uid}`);
          // The Ferryman (PS18): it doesn't let go, and the fallen ally haunts the foe.
          if (m.effect.hauntFallen) battle.storyEffects.push(`${HAUNT}${fallen.uid}:${battle.turn + m.effect.hauntFallen.turns}:${m.effect.hauntFallen.pct}:0`);
          const oc: Combatant = { side: 'player', mon: owner, stages: battle.playerStages, vol: battle.playerVolatile, flinched: false, protected: false };
          events.push(eventFor(ctx, oc, m, owner.hp, false));
        } else battle.storyEffects.push(`${PENDING}${m.id}:${owner.uid}`);
      }
    }
  }
}

/** A survivor whose ally moment was waiting has just been sent out: it plays now. */
export function applyPendingMoments(ctx: BattleContext, c: Combatant, events: BattleEvent[]): void {
  const name = ctx.content.species.get(c.mon.speciesId)?.name ?? 'It';
  // The Empty Shell (PS2): the Ninjask it came from is faster each time it comes in.
  for (const tag of ctx.battle.storyEffects.filter((t) => t.startsWith(ENTRYBOOST))) {
    const [species, stat, n] = tag.slice(ENTRYBOOST.length).split(':') as [string, keyof typeof c.stages, string];
    if (c.mon.hp <= 0 || !species.split(',').includes(c.mon.speciesId)) continue;
    c.stages[stat] = clampStage((c.stages[stat] ?? 0) + Number(n));
    events.push({ type: 'raid', tone: 'info', text: `${name} comes in faster than ever. For the empty shell.` });
  }
  // Embers Left: the next Pokémon of the named type sent in is Kindled.
  const types = ctx.content.species.get(c.mon.speciesId)?.types ?? [];
  for (const tag of ctx.battle.storyEffects.filter((t) => t.startsWith(KINDLE_NEXT))) {
    const [, type, pct] = tag.split(':') as [string, string, string];
    if (!(types as string[]).includes(type)) continue;
    ctx.battle.storyEffects = ctx.battle.storyEffects.filter((t) => t !== tag);
    ctx.battle.storyEffects.push(`${KINDLED}${c.mon.uid}:${type}:${pct}`);
    events.push({ type: 'raid', tone: 'info', text: `Something still warm passes to ${name}. It is Kindled!` });
  }
  // Set in Stone: the next ally sent in is Guarded by the guardian, and its Defence rises.
  for (const tag of ctx.battle.storyEffects.filter((t) => t.startsWith(GUARD_NEXT))) {
    const guardUid = tag.slice(GUARD_NEXT.length);
    if (guardUid === c.mon.uid || c.mon.hp <= 0) continue;
    ctx.battle.storyEffects = ctx.battle.storyEffects.filter((t) => t !== tag);
    ctx.battle.storyEffects.push(`${GUARDED}${c.mon.uid}:${guardUid}`);
    c.stages.def = clampStage((c.stages.def ?? 0) + 1);
    events.push({ type: 'raid', tone: 'info', text: `${ctx.content.species.get(ctx.party.find((p) => p.uid === guardUid)?.speciesId ?? '')?.name ?? 'A guardian'} stands over ${name}. It is Guarded!` });
  }
  // A Small Kindness: the next Pokémon sent in is Remembered.
  if (ctx.battle.storyEffects.includes(REMEMBER_NEXT) && c.mon.hp > 0) {
    ctx.battle.storyEffects = ctx.battle.storyEffects.filter((t) => t !== REMEMBER_NEXT);
    ctx.battle.storyEffects.push(`${REMEMBERED}${c.mon.uid}`);
    events.push({ type: 'raid', tone: 'info', text: `${name} carries its fallen friend with it. It is Remembered!` });
  }
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
