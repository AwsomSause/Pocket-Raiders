import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { freshSos } from '../../src/core/battle/sos';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

/** Plays a doomed fight: the lead has 1 HP against a Mewtwo. */
function doomed(run: RunState): ReturnType<typeof takeTurn> {
  const r = structuredClone(run);
  const lead = r.party[0]!;
  lead.hp = 1;
  r.battle = createBattle('wild', [createPokemon(content, 'mewtwo', 90, 'foe')], 0, lead.uid);
  r.battle.sos = { ...freshSos(), answered: 1 };
  let res = takeTurn(content, r, { kind: 'move', index: 0 });
  for (let i = 0; i < 6 && res.run.phase === 'battle' && !res.wiped; i++) res = takeTurn(content, res.run, { kind: 'move', index: 0 });
  return res;
}

function start(withNet: boolean): RunState {
  const base = chooseStarter(content, createRun(content, { runId: 'sn', seed: 'sn', archetypeId: 'red' }), 0);
  if (withNet) base.passives = { ...base.passives, 'safety-net': 1 };
  return toBattle(base);
}

describe('Safety Net (S382)', () => {
  it('is a supported catalog item with the perk', () => {
    const e = content.catalog.get('safety-net')!.effect!;
    expect(e.kind).toBe('perk');
  });
  it('without it a wipe ends the run', () => {
    const res = doomed(start(false));
    expect(res.defeated).toBe(true);
  });
  it('undoes one wipe: healed party, fight replays, then it is spent', () => {
    const run = start(true);
    expect(run.recorder).toBeTruthy();
    const res = doomed(run);
    expect(res.wiped).toBe(true);
    expect(res.defeated).toBe(false);
    expect(res.run.itemCounters?.['safety-net-used']).toBe(1);
    const lead = res.run.party[0]!;
    expect(lead.hp).toBe(maxHp(content, lead));
    expect(res.run.recorder).toBeUndefined();
    expect(doomed(res.run).defeated).toBe(true);
  });
});
