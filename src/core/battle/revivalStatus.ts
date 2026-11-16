// The revival statuses of the last-stand moments (POKEMON_MOMENTS.md Part 2B, PA17 to PA31): Revenant, Wrathborn, Overgrown, Alpha's
// Howl, Collected, Critical Mass, Transcendent, Oathbound, Swarm, Crushing Depth, Spiteful, Primal, Supernova, Absolute Zero, Eclipsed.
// A run-end revival (battle/pokemonMoments.ts tryRunEndMoment) brings one Pokémon back at full HP with one of them until the battle ends.
// Every number is data (pokemonMoments.json `revivalStatuses`); stat multipliers apply in calcStats, so max HP changes too.
// The engine calls these at its hook points. No randomness here: the only roll is the revival itself.
import { calcStats, getSpecies } from '../pokemon';
import { currentEnemy, type PokemonInstance } from '../state';
import { calcDamage, clampStage, typeEffectiveness } from './damage';
import { REVIVAL_STATUSES, type RevivalStatus } from '../moments/pokemonMoments';
import type { BattleContext, BattleEvent, Combatant } from './engine';
import type { Move } from '../contentSchema';

const COUNT = 'pm-rev-count:';
const OATH = 'pm-rev-oath:';
const BODIES = 'pm-rev-bodies:';
const ACTED = 'pm-rev-acted:';
const FEE = 'pm-rev-fee:';
/** Eclipsed: night for the rest of the battle. */
export const REVIVAL_NIGHT = 'pm-rev-night';

export const revivalOf = (mon: Pick<PokemonInstance, 'revivalStatus'>): RevivalStatus | undefined => (mon.revivalStatus ? REVIVAL_STATUSES[mon.revivalStatus] : undefined);
const nameOf = (ctx: Pick<BattleContext, 'content'>, mon: PokemonInstance): string => mon.care?.nickname || getSpecies(ctx.content, mon.speciesId).name;
const tagNum = (ctx: Pick<BattleContext, 'battle'>, prefix: string, uid: string): number | null => {
  const t = ctx.battle.storyEffects.find((x) => x.startsWith(`${prefix}${uid}:`));
  return t === undefined ? null : Number(t.slice(prefix.length + uid.length + 1));
};
const setTag = (ctx: Pick<BattleContext, 'battle'>, prefix: string, uid: string, n: number | null): void => {
  ctx.battle.storyEffects = ctx.battle.storyEffects.filter((x) => !x.startsWith(`${prefix}${uid}:`));
  if (n !== null) ctx.battle.storyEffects.push(`${prefix}${uid}:${n}`);
};

/**
 * The revival happened: the status starts. Full HP (with its max HP multiplier), its stages, weather, night, countdown, oath and
 * bodies, and the honest line: what it pays and what it costs, before the battle resumes. `feePct` overrides the Collector's fee.
 */
export function startRevivalStatus(ctx: BattleContext, c: Combatant, id: string, events: BattleEvent[], feePct?: number): void {
  const s = REVIVAL_STATUSES[id];
  if (!s) return;
  const { battle } = ctx;
  const uid = c.mon.uid;
  c.mon.revivalStatus = id;
  c.mon.hp = calcStats(ctx.content, c.mon).hp;
  c.mon.status = null;
  for (const [stat, n] of Object.entries(s.stages ?? {})) c.stages[stat as keyof typeof c.stages] = clampStage((c.stages[stat as keyof typeof c.stages] ?? 0) + n);
  if (s.weather) battle.weather = { id: s.weather.id, turns: s.weather.turns };
  if (s.night) {
    if (!battle.storyEffects.includes(REVIVAL_NIGHT)) battle.storyEffects.push(REVIVAL_NIGHT);
    ctx.period = 'night';
  }
  if (s.countdown) setTag(ctx, COUNT, uid, s.countdown.turns);
  if (s.oathTurns) setTag(ctx, OATH, uid, battle.turn + s.oathTurns);
  if (s.bodies) setTag(ctx, BODIES, uid, s.bodies);
  if (s.noHeal) setTag(ctx, 'pm-rev-hp:', uid, c.mon.hp);
  const fee = feePct ?? s.feePct;
  if (fee !== undefined) setTag(ctx, FEE, uid, fee);
  const chip = fee !== undefined && s.feePct !== undefined && fee !== s.feePct ? s.chip.replace(`${s.feePct}%`, `${fee}%`) : s.chip;
  events.push({ type: 'raid', tone: 'warn', text: chip });
}

/** Revenant: the lowest HP it has had; nothing may lift it above (checked at the end of each turn). */
export function revivalNoteHp(ctx: Pick<BattleContext, 'battle'>, mon: PokemonInstance): void {
  if (!revivalOf(mon)?.noHeal) return;
  const cap = tagNum(ctx, 'pm-rev-hp:', mon.uid);
  setTag(ctx, 'pm-rev-hp:', mon.uid, cap === null ? mon.hp : Math.min(cap, mon.hp));
}

/** Battle end: the status ends; HP is scaled back to the normal maximum (it keeps the share it has). */
export function endRevivalStatus(ctx: Pick<BattleContext, 'content'>, mon: PokemonInstance): void {
  if (!mon.revivalStatus) return;
  const before = calcStats(ctx.content, mon).hp;
  delete mon.revivalStatus;
  if (mon.hp > 0) mon.hp = Math.max(1, Math.min(calcStats(ctx.content, mon).hp, Math.round((mon.hp * calcStats(ctx.content, mon).hp) / before)));
}

/** Damage multiplier: the user's move power (all moves, then by type) times what the target takes. */
export function revivalPower(user: Combatant, target: Combatant, moveType: string): number {
  const u = user.side === 'player' ? revivalOf(user.mon) : undefined;
  const t = target.side === 'player' ? revivalOf(target.mon) : undefined;
  return (u?.movePower ?? 1) * (u?.typePower?.[moveType] ?? 1) * (t?.taken ?? 1);
}

/** Transcendent: Ground moves and contact moves don't touch it. */
export function revivalImmune(target: Combatant, moveType: string, contact: boolean): boolean {
  const s = target.side === 'player' ? revivalOf(target.mon) : undefined;
  return Boolean(s && (s.immuneTypes?.includes(moveType) || (s.immuneContact && contact)));
}

export const revivalNoFlinch = (c: Pick<Combatant, 'side' | 'mon'>): boolean => c.side === 'player' && Boolean(revivalOf(c.mon)?.noFlinch);
export const revivalNoSwitch = (mon: PokemonInstance | undefined): boolean => Boolean(mon && revivalOf(mon)?.noSwitch);
export const revivalStatusImmune = (c: Pick<Combatant, 'side' | 'mon'>): boolean => c.side === 'player' && Boolean(revivalOf(c.mon)?.statusImmune);
export const revivalNoHeal = (c: Pick<Combatant, 'side' | 'mon'>): boolean => c.side === 'player' && Boolean(revivalOf(c.mon)?.noHeal);
/** Absolute Zero: an Ice move's freeze chance (percent), 0 when none. */
export const revivalFreeze = (user: Combatant, moveType: string): number => (user.side === 'player' && moveType === 'ice' ? revivalOf(user.mon)?.freezePct ?? 0 : 0);
/** Eclipsed: evasion can't go above this. */
export const revivalEvasionCap = (c: Pick<Combatant, 'side' | 'mon'>): number | null => (c.side === 'player' ? revivalOf(c.mon)?.evasionCap ?? null : null);
/** Primal: Protosynthesis on, its bonus times `mult` on its `stats` best stats. */
export const revivalPrimal = (c: Pick<Combatant, 'side' | 'mon'>): { mult: number; stats: number } | null => (c.side === 'player' ? revivalOf(c.mon)?.primal ?? null : null);
/** Swarm: its damaging moves hit twice at this percent of their power. */
export const revivalTwice = (user: Combatant, move: Move): number | null => (user.side === 'player' && move.category !== 'status' ? revivalOf(user.mon)?.twicePct ?? null : null);

/** A move the status forbids, with why (Transcendent: physical; Swarm: Protect; Absolute Zero: the turn after it acts). Null = allowed. */
export function revivalBlocked(ctx: Pick<BattleContext, 'battle' | 'content'>, user: Combatant, move: Move): string | null {
  const s = user.side === 'player' ? revivalOf(user.mon) : undefined;
  if (!s) return null;
  const who = nameOf(ctx, user.mon);
  if (s.noPhysical && move.category === 'physical') return `${who} has let go of its body. It can't use physical moves!`;
  if (s.noProtect && move.effects.protect) return `${who} is a swarm now. It can't Protect!`;
  if (s.everyOther) {
    const acted = tagNum(ctx, ACTED, user.mon.uid);
    if (acted !== null && ctx.battle.turn === acted + 1) return `${who} is frozen still, gathering the cold. It can't act this turn.`;
  }
  return null;
}

/** Absolute Zero: note the turn it acted (the next one is skipped). */
export function revivalActed(ctx: Pick<BattleContext, 'battle'>, user: Combatant): void {
  if (user.side === 'player' && revivalOf(user.mon)?.everyOther) setTag(ctx, ACTED, user.mon.uid, ctx.battle.turn);
}

/** Wrathborn: the move slot it must use (its highest-damage move against the foe in front), or null to keep the player's pick. */
export function revivalForcedSlot(ctx: Pick<BattleContext, 'content' | 'battle'>, mon: PokemonInstance): number | null {
  if (!revivalOf(mon)?.forceBest) return null;
  const { content } = ctx;
  const foe = currentEnemy(ctx.battle);
  const foeTypes = getSpecies(content, foe.speciesId).types;
  const own = getSpecies(content, mon.speciesId).types;
  const stats = calcStats(content, mon);
  const foeStats = calcStats(content, foe);
  let best: { slot: number; dmg: number } | null = null;
  mon.moves.forEach((slot, i) => {
    const mv = content.moves.get(slot.id);
    if (!mv || slot.pp <= 0 || mv.category === 'status' || !mv.power) return;
    const physical = mv.category === 'physical';
    const dmg = calcDamage(content.ruleset, {
      level: mon.level, power: mv.power, attack: physical ? stats.atk : stats.spa, defense: physical ? foeStats.def : foeStats.spd,
      attackStage: 0, defenseStage: 0, stab: own.includes(mv.type), effectiveness: typeEffectiveness(content.typeChart, mv.type, foeTypes), crit: false, randomFactor: 100, burned: false, physical, weather: 1, final: 1,
    });
    if (!best || dmg > best.dmg) best = { slot: i, dmg };
  });
  return (best as { slot: number } | null)?.slot ?? null;
}

/** Oathbound and Swarm change what a hit takes: an oath holds at 1 HP; a swarm loses one body per hit, whatever the damage. */
export function revivalTakeHit(ctx: BattleContext, c: Combatant, lost: number, isHit: boolean): number {
  const s = revivalOf(c.mon);
  if (!s || c.side !== 'player') return lost;
  const uid = c.mon.uid;
  if (s.bodies && isHit) {
    const left = Math.max(0, (tagNum(ctx, BODIES, uid) ?? s.bodies) - 1);
    setTag(ctx, BODIES, uid, left);
    const who = nameOf(ctx, c.mon);
    (ctx.momentQueue ??= []).push({ type: 'raid', tone: 'warn', text: left > 0 ? `One of ${who}'s bodies falls! ${left} left.` : `The last of ${who}'s bodies falls.` });
    return left > 0 ? 0 : c.mon.hp;
  }
  const oath = tagNum(ctx, OATH, uid);
  if (oath !== null && ctx.battle.turn <= oath && lost >= c.mon.hp) return Math.max(0, c.mon.hp - 1);
  return lost;
}

/** Crushing Depth and Spiteful: an attacker that lands a hit on it loses a stage (Speed, or its highest stat). */
export function revivalOnHit(ctx: BattleContext, attacker: Combatant, target: Combatant, events: BattleEvent[]): void {
  const s = target.side === 'player' ? revivalOf(target.mon) : undefined;
  if (!s?.onHit || attacker.mon.hp <= 0 || attacker.side === target.side) return;
  let stat: 'atk' | 'def' | 'spa' | 'spd' | 'spe' = 'spe';
  if (s.onHit === 'highest') {
    const st = calcStats(ctx.content, attacker.mon);
    stat = (['atk', 'def', 'spa', 'spd', 'spe'] as const).reduce((a, b) => (st[b] > st[a] ? b : a));
  }
  if (attacker.stages[stat] <= -6) return;
  attacker.stages[stat] = clampStage(attacker.stages[stat] - 1);
  events.push({ type: 'stat', side: attacker.side, stat, change: -1 });
}

/**
 * The end of each turn: HP lost or restored, the foe's stage drop, the field burning, the countdown and the oath. Runs before faints
 * are settled, so a Pokémon this knocks out falls this turn (and the run-end screen follows if it was the last).
 */
export function revivalEndOfTurn(ctx: BattleContext, player: Combatant, enemy: Combatant, events: BattleEvent[]): void {
  const { battle, content } = ctx;
  if (battle.outcome) return;
  const mon = player.mon;
  const s = revivalOf(mon);
  if (!s || mon.hp <= 0) return;
  const who = nameOf(ctx, mon);
  const max = calcStats(content, mon).hp;
  const hurt = (c: Combatant, pct: number, text: string) => {
    if (c.mon.hp <= 0) return;
    const m = calcStats(content, c.mon).hp;
    const amount = Math.min(c.mon.hp, Math.max(1, Math.floor((m * pct) / 100)));
    c.mon.hp -= amount;
    events.push({ type: 'raid', tone: 'warn', text });
    events.push({ type: 'damage', side: c.side, amount, hpAfter: c.mon.hp, effectiveness: 1, crit: false });
  };
  if (s.turnHpPct && s.turnHpPct < 0) hurt(player, -s.turnHpPct, `${who} is paying for coming back.`);
  if (s.turnHpPct && s.turnHpPct > 0 && mon.hp < max) {
    const gain = Math.min(max - mon.hp, Math.max(1, Math.floor((max * s.turnHpPct) / 100)));
    mon.hp += gain;
    events.push({ type: 'heal', side: 'player', amount: gain, hpAfter: mon.hp });
  }
  if (s.fieldChipPct) {
    hurt(enemy, s.fieldChipPct, `The heat of ${who} burns the whole field!`);
    hurt(player, s.fieldChipPct, `${who} burns too.`);
  }
  if (s.foeStage && enemy.mon.hp > 0 && enemy.stages[s.foeStage.stat] > -6) {
    enemy.stages[s.foeStage.stat] = clampStage(enemy.stages[s.foeStage.stat] + s.foeStage.n);
    events.push({ type: 'raid', tone: 'info', text: `${who} howls. The foe shrinks back.` });
    events.push({ type: 'stat', side: 'enemy', stat: s.foeStage.stat, change: s.foeStage.n });
  }
  // Revenant: nothing heals it. A drain or an item that slipped through this turn is undone, and said so.
  const cap = tagNum(ctx, 'pm-rev-hp:', mon.uid);
  if (s.noHeal && cap !== null && mon.hp > cap && mon.hp > 0) {
    mon.hp = cap;
    events.push({ type: 'raid', tone: 'info', text: `${who} can't be healed. The life won't stay in it.` });
  }
  if (s.noHeal) revivalNoteHp(ctx, mon);
  const count = tagNum(ctx, COUNT, mon.uid);
  if (s.countdown && count !== null && mon.hp > 0) {
    const next = count - 1;
    setTag(ctx, COUNT, mon.uid, next);
    if (next > 0) events.push({ type: 'raid', tone: 'warn', text: `${who}'s core: ${next}.` });
    else explode(ctx, player, enemy, s.countdown.move, events);
  }
  const oath = tagNum(ctx, OATH, mon.uid);
  if (oath !== null && battle.turn >= oath && mon.hp > 0 && enemy.mon.hp > 0) {
    setTag(ctx, OATH, mon.uid, null);
    events.push({ type: 'raid', tone: 'warn', text: `The oath is spent. ${who} falls where it stood.` });
    events.push({ type: 'damage', side: 'player', amount: mon.hp, hpAfter: 0, effectiveness: 1, crit: false });
    mon.hp = 0;
  }
}

/** Critical Mass at 0: it uses Explosion on the foe in front and faints. If that was the foe's last Pokémon, the battle is won. */
function explode(ctx: BattleContext, player: Combatant, enemy: Combatant, moveId: string, events: BattleEvent[]): void {
  const { content } = ctx;
  const mon = player.mon;
  const mv = content.moves.get(moveId);
  events.push({ type: 'raid', tone: 'phase', text: `${nameOf(ctx, mon)}'s core: 0. It uses ${mv?.name ?? 'Explosion'}!` });
  if (mv?.power && enemy.mon.hp > 0) {
    const stats = calcStats(content, mon);
    const foeStats = calcStats(content, enemy.mon);
    const foeTypes = getSpecies(content, enemy.mon.speciesId).types;
    const dmg = calcDamage(content.ruleset, {
      level: mon.level, power: mv.power, attack: stats.atk, defense: foeStats.def, attackStage: player.stages.atk, defenseStage: enemy.stages.def,
      stab: getSpecies(content, mon.speciesId).types.includes(mv.type), effectiveness: typeEffectiveness(content.typeChart, mv.type, foeTypes), crit: false, randomFactor: 100, burned: false, physical: true, weather: 1, final: 1,
    });
    const dealt = Math.min(enemy.mon.hp, dmg);
    enemy.mon.hp -= dealt;
    events.push({ type: 'damage', side: 'enemy', amount: dealt, hpAfter: enemy.mon.hp, effectiveness: typeEffectiveness(content.typeChart, mv.type, foeTypes), crit: false });
  }
  events.push({ type: 'damage', side: 'player', amount: mon.hp, hpAfter: 0, effectiveness: 1, crit: false });
  mon.hp = 0;
  // Both out at once: the player wins if the foe had no one left (pack: "If the explosion faints the last opposing Pokémon too, the battle is won").
  ctx.doubleKoLoser = undefined;
}

/** Collected: the Collector's fee (percent of this battle's prize money), 0 when no one was collected. */
export function revivalFee(battle: { storyEffects: string[] }): number {
  return battle.storyEffects.filter((t) => t.startsWith(FEE)).reduce((n, t) => Math.max(n, Number(t.split(':').pop())), 0);
}
