import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { openHistory } from '../../src/core/story/record';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import { StoryV2Schema } from '../../src/core/story2/schema';
import { content } from './helpers';

// S7 acceptance: the Feat win-rate delta against a baseline. Even boss fights (same species, same level), the partner
// with one banked Feat versus none, over many seeds. Design target: under 6 points per run; one fight is the worst case.
const FOES = ['charmander', 'squirtle', 'bulbasaur', 'pikachu', 'eevee', 'machop', 'geodude', 'abra'];
function fight(seed: string, foe: string, banked: number): boolean {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  const lead = run.party[0]!;
  openHistory(content, run, lead.uid, lead.speciesId, 'starter');
  const attack = lead.moves.find((m) => content.moves.get(m.id)?.category !== 'status')?.id ?? 'tackle';
  lead.moves = [{ id: attack, pp: 99 }];
  const v2 = StoryV2Schema.parse({ mode: 'story_run' });
  v2.heartbond.partner = lead.uid;
  v2.feats.banked = banked;
  run.story.v2 = v2;
  run.battle = createBattle('trainer', [createPokemon(content, foe, lead.level + 2, `e-${seed}`)], 0, lead.uid, { classId: 'gym-leader', name: 'Boss', leaderId: null });
  run.phase = 'battle';
  let state = run;
  for (let t = 0; t < 60 && state.phase === 'battle' && state.battle && !state.battle.outcome; t += 1) state = takeTurn(content, state, { kind: 'move', index: 0 }).run;
  return state.battle?.outcome === 'win' || (state.phase !== 'battle' && state.party[0]!.hp > 0);
}

describe('Feat win-rate delta (baseline sim)', () => {
  it('one banked Feat moves an even boss fight by a bounded amount', () => {
    let base = 0;
    let feat = 0;
    const n = 64;
    for (let i = 0; i < n; i += 1) {
      const foe = FOES[i % FOES.length]!;
      if (fight(`sim${i}`, foe, 0)) base += 1;
      if (fight(`sim${i}`, foe, 1)) feat += 1;
    }
    const delta = (feat - base) / n;
    console.log(`feat-sim: baseline ${(base / n * 100).toFixed(1)}% with Feat ${(feat / n * 100).toFixed(1)}% delta ${(delta * 100).toFixed(1)} points`);
    expect(delta).toBeGreaterThanOrEqual(0);
    expect(delta).toBeLessThan(0.15);
  });
});
