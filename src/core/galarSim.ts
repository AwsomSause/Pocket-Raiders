import type { Content, Move, StatBlock, StatName } from './contentSchema';
import { calcDamage, hitChance, multiHitCount, typeEffectiveness } from './battle/damage';
import { calcStats, createPokemon, getSpecies, maxHp } from './pokemon';
import { hashSeed, Rng } from './rng';

/**
 * The Galar Champion's Tournament's other matches, played for real (Kice 2026-11-20: "real simulated battles that decide your next enemy").
 * Each boss brings their own Elite Four team for the run's region (species, moves and training from bossTeams.json), every Pokémon gets
 * its real stats, and the two trainers trade blows with the game's damage formula, type chart, STAB, accuracy, crits and speed order
 * until one side has no Pokémon left. A sound simulation, not the full battle engine: status moves, abilities, held items, switching and
 * gimmicks are left out (docs/status/galar-bracket-sim.md). Every roll comes from its own stream hashed from the label, so no gameplay
 * stream moves and the same run always plays the same matches.
 */

export interface SimMon { speciesId: string; name: string; hp: number; max: number }
export interface SimBeat { text: string; /** Share of each side's total HP still standing (0..1). */ hpA: number; hpB: number }
export interface SimResult { winner: 'a' | 'b'; turns: number; /** Pokémon still standing at the end. */ leftA: number; leftB: number; beats: SimBeat[]; aceA: string | null; aceB: string | null }

export interface SimSide { bossId: string; name: string; level: number; teamIndex: number; role: 'elite' | 'champion' }

interface Fighter { speciesId: string; name: string; level: number; types: string[]; stats: StatBlock; hp: number; max: number; moves: Move[]; /** Turns it must sit out (Hyper Beam's recharge). */ rest: number; /** A two-turn move being charged (Solar Beam). */ charging: Move | null }

const STRUGGLE_POWER = 50;
/** Moves that only work in a situation this simulation does not model (a sleeping target, the first turn, a berry eaten, ...): trainers leave them out. */
const CONDITIONAL = new Set(['requiresSleepingTarget', 'focus', 'firstTurnOnly', 'suckerPunch', 'precondition', 'fixedDamage', 'ohko', 'counter', 'bide', 'asleepOnly', 'needsStatus', 'delayed', 'endeavor', 'halveTarget', 'callMove', 'callFrom', 'meFirst', 'beakBlast', 'upperHand', 'leaveOne', 'switchOut', 'beatUp']);

function fighters(content: Content, side: SimSide): Fighter[] {
  const boss = content.bosses.get(side.bossId);
  const teams = boss?.teams[side.role] ?? boss?.teams.elite;
  const team = teams?.[Math.max(0, Math.min(teams.length - 1, side.teamIndex))];
  const members = team?.members ?? (boss?.signature ?? []).map((speciesId) => ({ speciesId, moves: [] as string[], training: {} as Partial<Record<StatName, number>> }));
  const out: Fighter[] = [];
  members.forEach((m, i) => {
    if (!content.species.has(m.speciesId)) return;
    const mon = createPokemon(content, m.speciesId, side.level, `galar-sim:${side.bossId}:${i}`);
    for (const [stat, n] of Object.entries(m.training ?? {})) mon.vitamins[stat as StatName] = n ?? 0;
    const listed = m.moves.map((id) => content.moves.get(id)).filter((mv): mv is Move => !!mv && mv.supported !== false);
    const moves = (listed.length ? listed : mon.moves.map((s) => content.moves.get(s.id)).filter((mv): mv is Move => !!mv)).filter((mv) => mv.category !== 'status' && (mv.power ?? 0) > 0 && !Object.keys(mv.effects ?? {}).some((k) => CONDITIONAL.has(k)));
    const sp = getSpecies(content, m.speciesId);
    const max = maxHp(content, mon);
    out.push({ speciesId: m.speciesId, name: sp.name, level: side.level, types: [...sp.types], stats: calcStats(content, mon), hp: max, max, moves, rest: 0, charging: null });
  });
  return out;
}

function share(team: Fighter[]): number {
  const max = team.reduce((n, f) => n + f.max, 0);
  return max > 0 ? team.reduce((n, f) => n + f.hp, 0) / max : 0;
}

/** Expected damage of a move, for picking: the same formula with an average roll and no crit. */
function expected(content: Content, user: Fighter, target: Fighter, move: Move): number {
  const eff = typeEffectiveness(content.typeChart, move.type, target.types as never);
  const physical = move.category === 'physical';
  const dmg = calcDamage(content.ruleset, { level: user.level, power: move.power ?? STRUGGLE_POWER, attack: physical ? user.stats.atk : user.stats.spa, defense: physical ? target.stats.def : target.stats.spd, attackStage: 0, defenseStage: 0, stab: user.types.includes(move.type), effectiveness: eff, crit: false, randomFactor: 92, burned: false, physical });
  const fx = move.effects;
  const hits = fx?.hits ? (fx.hits[0] + fx.hits[1]) / 2 : 1;
  // Drawbacks the trainer weighs: fainting the user, a turn of recharge, a turn of charging up.
  const cost = (fx?.selfFaint || fx?.userFaint ? 0.4 : 1) * (fx?.recharge ? 0.6 : 1) * (fx?.charge ? 0.55 : 1) * (fx?.recoil ? 1 - fx.recoil / 2 : 1);
  return eff === 0 ? 0 : dmg * hits * cost * ((move.accuracy ?? 100) / 100);
}

/** Plays one match. `label` names the stream (the same label always plays the same match). */
export function simulateMatch(content: Content, a: SimSide, b: SimSide, label: string, maxTurns = 300): SimResult {
  const rng = new Rng(hashSeed(`galar-sim:${label}`));
  const teamA = fighters(content, a);
  const teamB = fighters(content, b);
  const aiOf = (s: SimSide): number => content.bosses.get(s.bossId)?.teams[s.role]?.[s.teamIndex]?.ai ?? 0.8;
  const ai = { a: aiOf(a), b: aiOf(b) };
  const beats: SimBeat[] = [];
  const say = (text: string): void => { beats.push({ text, hpA: share(teamA), hpB: share(teamB) }); };
  let ia = 0;
  let ib = 0;
  const live = (team: Fighter[], i: number): number => { while (i < team.length && team[i]!.hp <= 0) i++; return i; };
  ia = live(teamA, 0);
  ib = live(teamB, 0);
  if (teamA[ia] && teamB[ib]) say(`${a.name} sends out ${teamA[ia]!.name}. ${b.name} sends out ${teamB[ib]!.name}.`);
  let turns = 0;
  const pick = (user: Fighter, target: Fighter, smart: number): Move | null => {
    if (user.moves.length === 0) return null;
    if (rng.float() >= smart) return user.moves[rng.int(0, user.moves.length - 1)]!;
    return user.moves.reduce((best, m) => (expected(content, user, target, m) > expected(content, user, target, best) ? m : best), user.moves[0]!);
  };
  const strike = (user: Fighter, target: Fighter, move: Move | null, trainer: string): void => {
    const power = move?.power ?? STRUGGLE_POWER;
    const type = move?.type ?? 'normal';
    const fx = move?.effects;
    if (fx?.charge && user.charging !== move) { user.charging = move; return; }
    user.charging = null;
    if (fx?.recharge) user.rest = 1;
    if (fx?.selfFaint || fx?.userFaint) user.hp = 0;
    if (move && !rng.chance(hitChance(move.accuracy, 0, 0))) {
      if (user.hp === 0) say(`${trainer}'s ${user.name} goes down with ${move.name}, and misses!`);
      return;
    }
    const eff = move ? typeEffectiveness(content.typeChart, type as never, target.types as never) : 1;
    const crit = rng.chance(content.ruleset.critChanceByStage[Math.min(3, move?.critStage ?? 0)] ?? 0.04);
    const physical = (move?.category ?? 'physical') === 'physical';
    const dmg = calcDamage(content.ruleset, { level: user.level, power, attack: physical ? user.stats.atk : user.stats.spa, defense: physical ? target.stats.def : target.stats.spd, attackStage: 0, defenseStage: 0, stab: !!move && user.types.includes(type), effectiveness: eff, crit, randomFactor: rng.int(content.ruleset.randomFactorMin, 100), burned: false, physical });
    const hits = fx?.hits ? multiHitCount(fx.hits, rng) : 1;
    const dealt = Math.min(target.hp, dmg * hits);
    target.hp -= dealt;
    if (fx?.drain && user.hp > 0) user.hp = Math.min(user.max, user.hp + Math.max(1, Math.floor(dealt * fx.drain)));
    if (fx?.recoilMaxHp && user.hp > 0) user.hp = Math.max(0, user.hp - Math.floor(user.max * fx.recoilMaxHp));
    if ((fx?.recoil || !move) && user.hp > 0) user.hp = Math.max(0, user.hp - Math.max(1, Math.floor(move ? dealt * fx!.recoil! : user.max / 4)));
    if (user.hp === 0 && target.hp > 0) say(`${trainer}'s ${user.name} goes down with ${move?.name ?? 'Struggle'}.`);
    if (target.hp === 0) say(`${trainer}'s ${user.name} knocks out ${target.name} with ${move?.name ?? 'Struggle'}${eff > 1 ? ' (super effective!)' : crit ? ' (a critical hit!)' : ''}.`);
  };
  while (teamA[ia] && teamB[ib] && turns < maxTurns) {
    turns++;
    const fa = teamA[ia]!;
    const fb = teamB[ib]!;
    const ma = pick(fa, fb, ai.a);
    const mb = pick(fb, fa, ai.b);
    const pa = ma?.priority ?? 0;
    const pb = mb?.priority ?? 0;
    const aFirst = pa !== pb ? pa > pb : fa.stats.spe !== fb.stats.spe ? fa.stats.spe > fb.stats.spe : rng.chance(0.5);
    const order: [Fighter, Fighter, Move | null, string][] = aFirst ? [[fa, fb, ma, a.name], [fb, fa, mb, b.name]] : [[fb, fa, mb, b.name], [fa, fb, ma, a.name]];
    for (const [user, target, move, trainer] of order) {
      if (user.hp <= 0 || target.hp <= 0) continue;
      if (user.rest > 0) { user.rest--; continue; }
      strike(user, target, user.charging ?? move, trainer);
    }
    const na = live(teamA, ia);
    const nb = live(teamB, ib);
    if (na !== ia && teamA[na]) say(`${a.name} sends out ${teamA[na]!.name}.`);
    if (nb !== ib && teamB[nb]) say(`${b.name} sends out ${teamB[nb]!.name}.`);
    ia = na;
    ib = nb;
  }
  const leftA = teamA.filter((f) => f.hp > 0).length;
  const leftB = teamB.filter((f) => f.hp > 0).length;
  // Out of turns (two walls): the side with more HP left wins on the judges' decision.
  const winner: 'a' | 'b' = leftB === 0 ? 'a' : leftA === 0 ? 'b' : share(teamA) >= share(teamB) ? 'a' : 'b';
  say(`${winner === 'a' ? a.name : b.name} wins${turns >= maxTurns ? ' on the judges\' decision' : ''}, ${winner === 'a' ? leftA : leftB} Pokémon to ${winner === 'a' ? leftB : leftA}!`);
  return { winner, turns, leftA, leftB, beats, aceA: teamA.at(-1)?.speciesId ?? null, aceB: teamB.at(-1)?.speciesId ?? null };
}
