// Beta 0.6 slice E1: the balance sim for variant lines. Two identical Pokémon fight; one carries the line. Over n seeded battles
// neither side may win more than 60% (plan E1). Pure: uses only the game's own battle engine and seeded streams.
import { createBattle, resolveTurn, type BattleContext } from '../core/battle/engine';
import type { Content } from '../core/contentSchema';
import { assignVariant } from '../core/expansion/variantLines';
import { createPokemon } from '../core/pokemon';
import { hashSeed, Rng } from '../core/rng';

export interface VariantSimResult { line: string | null; battles: number; variantWins: number; plainWins: number; draws: number; variantRate: number; plainRate: number }

const MOVES = ['surf', 'ice-beam', 'flamethrower', 'earthquake'];

/** `line` null runs the no-variant baseline (both sides plain), which should sit near 50%. */
export function simulateVariantLine(content: Content, line: string | null, battles: number, seed = 'variant-sim'): VariantSimResult {
  let variantWins = 0, plainWins = 0, draws = 0;
  for (let n = 0; n < battles; n++) {
    const pick = new Rng(hashSeed(`${seed}:${line}:${n}:pick`));
    const mk = (uid: string) => {
      const m = createPokemon(content, 'blastoise', 50, uid);
      m.moves = MOVES.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
      return m;
    };
    // The enemy side plays with the engine's AI and the player side picks moves at random, so the line goes on the player's
    // Pokémon in odd battles and the enemy's in even ones: the side bias cancels out.
    const onPlayer = n % 2 === 1;
    const player = mk(onPlayer ? 'variant' : 'plain'), enemy = mk(onPlayer ? 'plain' : 'variant');
    // createPokemon rolls IVs and nature from the uid, so copy them to make the two Pokémon truly identical.
    Object.assign(enemy, { ivs: { ...player.ivs }, nature: player.nature, hp: player.hp });
    const battle = createBattle('wild', [enemy], 0, player.uid);
    const weather = (['rain', 'sun', null] as const)[n % 3];
    if (weather) battle.weather = { id: weather, turns: 5 };
    if (line) assignVariant(battle.extra.variants, onPlayer ? player.uid : enemy.uid, line);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(`${seed}:${line}:${n}`)), captureRng: new Rng(hashSeed(`${seed}:${line}:${n}:c`)), catchMultiplier: 1 };
    for (let turn = 0; turn < 60 && !battle.outcome; turn++) resolveTurn(ctx, { kind: 'move', index: pick.int(0, MOVES.length - 1) });
    const [v, o] = onPlayer ? [player, enemy] : [enemy, player];
    if (v.hp > 0 && o.hp <= 0) variantWins++;
    else if (o.hp > 0 && v.hp <= 0) plainWins++;
    else draws++;
  }
  const decided = Math.max(1, variantWins + plainWins);
  return { line, battles, variantWins, plainWins, draws, variantRate: variantWins / decided, plainRate: plainWins / decided };
}

/** The most any side may win (plan E1). */
export const simLimit = (_line: string | null): number => 0.6;
