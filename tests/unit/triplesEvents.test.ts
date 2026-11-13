// Triple Battle event scenes (Beta 0.6 T4): event fights with a `format` (doubles or triples), Triple Trouble, the Whispering
// Grove's "Wake them", and the pack's doubles scenes (Double Trouble, the Twins, the Hot Dog Duelists).

import { describe, expect, it } from 'vitest';
import { autoCommands, monAt } from '../../src/core/battle/doubles';
import { isTriples, spotCount } from '../../src/core/battle/triples';
import { EventBattleSchema } from '../../src/core/contentSchema';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const on = { ...content, balance: { ...content.balance, triples: { ...content.balance.triples, enabled: true } } };
/** Triple battles switched off (the fallback a scene uses while the screen can't draw them). */
const off = { ...content, balance: { ...content.balance, triples: { ...content.balance.triples, enabled: false } } };

/** A run with `size` healthy Pokémon, standing on a node with this event beside it. */
function atEvent(seed: string, eventId: string, size = 3): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  for (let i = 1; i < size; i++) run.party.push({ ...structuredClone(run.party[0]!), uid: `extra${i}` });
  run.regionIndex = 1;
  run.stage!.index = 3;
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'ev', kind: 'event', used: false, eventId });
  return run;
}

const battleOf = (c: typeof content, run: RunState, choice: number) => chooseEvent(c, run, 'ev', choice).run;

describe('event battle format field', () => {
  it('is optional and only takes doubles or triples', () => {
    expect((EventBattleSchema.parse({ kind: 'wild' }) as { format?: string }).format).toBeUndefined();
    expect((EventBattleSchema.parse({ kind: 'trainer', name: 'A', format: 'triples' }) as { format?: string }).format).toBe('triples');
    expect(() => EventBattleSchema.parse({ kind: 'trainer', name: 'A', format: 'quads' })).toThrow();
  });
});

describe('Triple Trouble', () => {
  it('is a triple battle against three kids when triple battles are on', () => {
    const run = battleOf(on, atEvent('tt', 'triple-battle'), 0);
    expect(run.phase).toBe('battle');
    expect(run.battle!.enemyTeam).toHaveLength(3);
    expect(isTriples(run.battle!)).toBe(true);
    const ctx = { battle: run.battle!, party: run.party, content: on };
    for (const s of [0, 1, 2] as const) expect(monAt(ctx, 'enemy', s)).toBeTruthy();
  });
  it('is on in the shipped balance, and drops to a double battle when triple battles are off', () => {
    expect(content.balance.triples.enabled).toBe(true);
    expect(isTriples(battleOf(content, atEvent('tt-def', 'triple-battle'), 0).battle!)).toBe(true);
    const run = battleOf(off, atEvent('tt-off', 'triple-battle'), 0);
    expect(spotCount(run.battle!)).toBe(2);
  });
  it('drops to doubles with two healthy Pokémon, and to a single battle with one (boundary)', () => {
    expect(spotCount(battleOf(on, atEvent('tt2', 'triple-battle', 2), 0).battle!)).toBe(2);
    expect(spotCount(battleOf(on, atEvent('tt1', 'triple-battle', 1), 0).battle!)).toBe(1);
  });
  it('"Just one of them" stays a single battle', () => {
    expect(spotCount(battleOf(on, atEvent('tt-one', 'triple-battle'), 1).battle!)).toBe(1);
  });
  it('is the same every time for the same seed', () => {
    const a = battleOf(on, atEvent('tt-same', 'triple-battle'), 0);
    const b = battleOf(on, atEvent('tt-same', 'triple-battle'), 0);
    expect(a.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(b.battle!.enemyTeam.map((m) => m.speciesId));
    expect(a.battle!.doubles).toEqual(b.battle!.doubles);
  });
});

describe('The Whispering Grove: Wake them', () => {
  it('wakes three wild Pokémon into a triple battle that plays to an end', () => {
    let run = battleOf(on, atEvent('grove', 'whispering-grove-1'), 1);
    expect(run.battle!.kind).toBe('wild');
    expect(run.battle!.enemyTeam).toHaveLength(3);
    expect(isTriples(run.battle!)).toBe(true);
    for (const m of run.party) m.level = 100;
    for (let turn = 0; turn < 80 && run.phase === 'battle' && !run.battle?.outcome; turn++) {
      const battle = run.battle!;
      const ctx = { battle, party: run.party, content: on };
      if (battle.needsSwitch) {
        const onField = [0, 1, 2].map((s) => monAt(ctx, 'player', s as 0 | 1 | 2)?.uid);
        const spare = run.party.findIndex((m) => m.hp > 0 && !onField.includes(m.uid));
        run = takeTurn(on, run, { kind: 'switch', partyIndex: spare }).run;
      } else run = takeTurn(on, run, { kind: 'double', commands: autoCommands(ctx) }).run;
    }
    expect(run.phase === 'battle' ? run.battle?.outcome : 'done').toBeTruthy();
  });
  it('"Push on" is still one wild Pokémon, rolled as before', () => {
    const a = battleOf(on, atEvent('grove-push', 'whispering-grove-1'), 0);
    expect(a.battle!.enemyTeam).toHaveLength(1);
    expect(spotCount(a.battle!)).toBe(1);
  });
  it('the extra wild Pokémon come from their own generator: the first foe is the one the fight would have without a format', () => {
    const def = structuredClone(on.events.get('whispering-grove-1')!);
    const battle = def.choices[1]!.success.battle!;
    delete (battle as { format?: string }).format;
    const plain = { ...on, events: new Map(on.events).set(def.id, def) };
    const tri = battleOf(on, atEvent('grove-same', 'whispering-grove-1'), 1);
    const single = battleOf(plain, atEvent('grove-same', 'whispering-grove-1'), 1);
    expect(single.battle!.enemyTeam).toHaveLength(1);
    expect(tri.battle!.enemyTeam[0]!.speciesId).toBe(single.battle!.enemyTeam[0]!.speciesId);
    expect(tri.battle!.enemyTeam[0]!.level).toBe(single.battle!.enemyTeam[0]!.level);
  });
});

describe('doubles scenes from the pack', () => {
  for (const [id, foes] of [['double-trouble', 2], ['twin-trainers', 2], ['hot-dog-duelists', 4]] as const) {
    it(`${id} is a double battle`, () => {
      const run = battleOf(content, atEvent(`d-${id}`, id, 2), 0);
      expect(spotCount(run.battle!)).toBe(2);
      expect(run.battle!.enemyTeam).toHaveLength(foes);
    });
  }
});

describe('more triple scenes from the packs', () => {
  // [event, choice, foes]: the Shadow Triad, the Plasma Yard guards, three Delibird, the Monster House, the Double Booking brawl.
  const scenes = [['shadow-triad', 0, 3], ['plasma-substage-yard', 1, 3], ['delibird-y', 2, 3], ['md-1-monster-house', 1, 3], ['xr.fe-72', 1, 3]] as const;
  for (const [id, choice, foes] of scenes) {
    it(`${id} is a triple battle when they are on, and doubles while they are off`, () => {
      const tri = battleOf(on, atEvent(`s-${id}`, id), choice);
      expect(tri.phase).toBe('battle');
      expect(tri.battle!.enemyTeam).toHaveLength(foes);
      expect(isTriples(tri.battle!)).toBe(true);
      expect(spotCount(battleOf(off, atEvent(`s-${id}`, id), choice).battle!)).toBe(2);
    });
  }
  it('the Monster House wakes three wild Pokémon when tiptoeing fails too', () => {
    const fail = content.events.get('md-1-monster-house')!.choices[0]!.failure!.battle!;
    expect(fail.kind).toBe('wild');
    expect((fail as { format?: string }).format).toBe('triples');
  });
});
