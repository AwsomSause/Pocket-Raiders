// Sweep benchmark: one player Pokémon alone vs a boss team at the same level. Prints sweep rate (all foes KO'd).
//   node tools/sweepbench.ts <playerSpecies> <bossId> <role> <teamIdx> <level> [trials] [ai]
import type * as SimT from '../src/quality/balanceSim.ts';
import type * as Data from '../src/data/index.ts';
import type * as EncT from '../src/core/encounters.ts';
import type * as PokeT from '../src/core/pokemon.ts';
import type * as Battle from '../src/core/battle/engine.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const { getContent } = await loadModule<typeof Data>('/src/data/index.ts');
const Sim = await loadModule<typeof SimT>('/src/quality/balanceSim.ts');
const Enc = await loadModule<typeof EncT>('/src/core/encounters.ts');
const Poke = await loadModule<typeof PokeT>('/src/core/pokemon.ts');

const c = getContent();
const [sp, bossId, role, idx, lv, trials = '200', aiArg] = process.argv.slice(2);
let level = Number(lv);
const boss = c.bosses.get(bossId!)!;
const team = (boss.teams as any)[role!][Number(idx)];
const RED = c.archetypes.get('red')!;
const regionIdx = Number(process.env.REGION ?? 0);
const plan = Enc.planChampion(c, RED, bossId!, regionIdx, Enc.leagueScale(c, regionIdx), new (await loadModule<any>('/src/core/rng.ts')).Rng(1));
const ai = aiArg ? Number(aiArg) : process.env.REAL ? plan.ai : team.ai;
if (process.env.BOSSTRAIN) { const n = Number(process.env.BOSSTRAIN); for (const m of plan.members) m.training = Object.fromEntries(['hp','atk','def','spa','spd','spe'].map((k) => [k, n])) as any; }
if (process.env.BOSSITEM) for (const m of plan.members) m.held = { [process.env.BOSSITEM]: 1 } as any;
const Gear = await loadModule<typeof import('../src/core/bossGear.ts')>('/src/core/bossGear.ts');
if (process.env.GEAR) plan.members = Gear.gearTeam(c, plan.members, process.env.GEAR as any, Number(process.env.ITEMS ?? 1));
const enemy = process.env.REAL ? () => plan.members.map((m: any, i: number) => Enc.createPlannedPokemon(c, m, `e${i}`)) : () => team.members.map((m: any, i: number) => Enc.createPlannedPokemon(c, { speciesId: m.speciesId, level, moves: m.moves, training: m.training }, `e${i}`));
let sweeps = 0, wins = 0, hpLeft = 0, kos = 0, turns = 0;
for (let t = 0; t < Number(trials); t++) {
  const p = Poke.createPokemon(c, sp!, level, 'p0'); for (const kv of (process.env.TRAIN ?? '').split(',').filter(Boolean)) { const [k, v] = kv.split(':'); (p.vitamins as any)[k!] = Number(v); }
  if (process.env.HELD) p.held = { [process.env.HELD]: 1 } as any;
  if (process.env.MOVES) p.moves = process.env.MOVES.split(',').map((id) => ({ id, pp: c.moves.get(id)!.pp }));
  p.hp = Poke.maxHp(c, p);
  const r = Sim.simulateBattleDetail(c, [p], enemy(), ai, `sb${t}`);
  if (r.winner === 'player') { wins++; hpLeft += r.playerHpFrac; }
  if (r.enemyAlive === 0) sweeps++;
  kos += r.enemyTeamSize - r.enemyAlive; turns += r.turns;
}
const n = Number(trials);
console.log(JSON.stringify({ sp, bossId, role, level, ai, foes: team.members.length, sweepRate: +(sweeps / n).toFixed(3), avgKOs: +(kos / n).toFixed(2), avgTurns: +(turns / n).toFixed(1), avgHpLeftWhenWon: wins ? +(hpLeft / wins).toFixed(2) : 0 }));
await closeModules();
if (process.env.SHOW) for (const m of plan.members) console.log(m.speciesId, m.level, JSON.stringify(m.training ?? {}), JSON.stringify(m.held ?? null), (m.moves ?? []).join('/'));
