// Greenneedle gn.new.23: The Appliance Shop (tools/events/co/greenneedle-new-23.ts; rules in src/core/greenneedle/appliance.ts).
import { describe, expect, it } from 'vitest';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { askDue } from '../../src/core/greenneedle/ask';
import { takeTurn } from '../../src/core/run';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const ERRAND = ['Point the fan at the washing.', 'Put the catch in the fridge.', 'Bake the bakery\'s bread.', 'Wash the dojo\'s forty uniforms.', 'Cut the school field.'];

/** Through the door and all five errands; `humming` is the appliance (1-5) it hummed through. */
function afterErrands(seed: string, humming: number): RunState {
  let run = gnRun(seed);
  open(run, 'gn-new-23-shop');
  run = choose(run, 'gn-new-23-shop', 'Hear him out.').run;
  expect(flagOf(run, 'appliance-hum')).toBeGreaterThanOrEqual(1);
  expect(flagOf(run, 'appliance-hum')).toBeLessThanOrEqual(5);
  setFlag(run, 'appliance-hum', humming);
  for (let i = 1; i <= 5; i++) {
    expect(opened(run, `gn-new-23-errand-${i}`)).toBe(true);
    run = choose(run, `gn-new-23-errand-${i}`, ERRAND[i - 1]!).run;
  }
  expect(opened(run, 'gn-new-23-after')).toBe(true);
  return run;
}
const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.some((x) => !x.used && x.eventId === id);
/** A Pokémon that joins waits in `pending` until the player confirms it. */
const party = (run: RunState): string[] => [...run.party.map((m) => m.speciesId), ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon.speciesId] : []))];

describe('gn.new.23 The Appliance Shop', () => {
  it('has the doc\'s five errands, no battles, and every choice list is at most four', () => {
    for (const id of ['gn-new-23-shop', 'gn-new-23-errand-1', 'gn-new-23-errand-5', 'gn-new-23-after', 'gn-new-23-name-1', 'gn-new-23-name-2', 'gn-new-23-hub']) {
      const e = content.events.get(id)!;
      expect(e, id).toBeDefined();
      expect(e.choices.length, id).toBeLessThanOrEqual(4);
      expect(JSON.stringify(e.choices), id).not.toContain('"battle"');
    }
    expect(scene(gnRun('a'), 'gn-new-23-after').labels).toEqual(['"You liked that one."', '"You don\'t have to pick."']);
  });
  it('naming the one it hummed through: it settles into that form and stays', () => {
    const forms = ['rotom-fan', 'rotom-frost', 'rotom-heat', 'rotom-wash', 'rotom-mow'];
    const names = ['The fan.', 'The fridge.', 'The oven.', 'The washer.', 'The mower.'];
    for (let i = 1; i <= 5; i++) {
      let run = afterErrands(`appl-right-${i}`, i);
      const n = party(run).length;
      run = choose(run, 'gn-new-23-after', '"You liked that one."').run;
      if (i <= 3) run = choose(run, 'gn-new-23-name-1', names[i - 1]!).run;
      else {
        run = choose(run, 'gn-new-23-name-1', 'Another one.').run;
        run = choose(run, 'gn-new-23-name-2', names[i - 1]!).run;
      }
      expect(party(run)).toHaveLength(n + 1);
      expect(party(run)).toContain(forms[i - 1]);
      expect(flagOf(run, 'appliance-done')).toBe(1);
    }
  });
  it('naming another one: it tries it, then picks for itself (the one it hummed through)', () => {
    let run = afterErrands('appl-wrong', 3);
    const n = party(run).length;
    run = choose(run, 'gn-new-23-after', '"You liked that one."').run;
    const r = choose(run, 'gn-new-23-name-1', 'The fan.');
    expect(r.text).toMatch(/goes back/);
    expect(party(r.run)).toHaveLength(n + 1);
    expect(party(r.run)).toContain('rotom-heat');
  });
  it('"You don\'t have to pick": a plain Rotom with House Call', () => {
    let run = afterErrands('appl-plain', 2);
    run = choose(run, 'gn-new-23-after', '"You don\'t have to pick."').run;
    const rotom = run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : [])).find((m) => m.speciesId === 'rotom')!;
    expect(rotom).toBeDefined();
    expect(rotom.fixedAbility).toBe('house-call');
    expect(rotom.moves.some((m) => m.id === 'house-call')).toBe(false);
  });
  it('House Call on a foe (nobody to ask): once a battle, on entry, a plain Rotom takes the form that hits hardest', () => {
    const mk = (mineId: string, seed: string, ability = true) => {
      const rotom = createPokemon(content, 'rotom', 40, 'r1');
      if (ability) rotom.fixedAbility = 'house-call';
      rotom.moves = [{ id: 'splash', pp: 40 }];
      const mine = createPokemon(content, mineId, 40, 'p1');
      mine.moves = [{ id: 'splash', pp: 40 }];
      const battle = createBattle('wild', [rotom], 0, mine.uid);
      const ctx: BattleContext = { content, battle, party: [mine], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
      resolveTurn(ctx, { kind: 'move', index: 0 });
      return { rotom, battle };
    };
    // Scizor (Bug/Steel): fire hits it four times as hard, so it is the oven.
    const a = mk('scizor', 'hc-a');
    expect(a.rotom.speciesId).toBe('rotom-heat');
    expect(a.battle.storyEffects).toContain('house-call:r1');
    // Garchomp (Dragon/Ground): ice four times: the fridge.
    expect(mk('garchomp', 'hc-b').rotom.speciesId).toBe('rotom-frost');
    // Nothing an appliance does hits a Kingdra (Water/Dragon) hard: it stays plain.
    expect(mk('kingdra', 'hc-c').rotom.speciesId).toBe('rotom');
    // A Rotom without the ability never changes.
    expect(mk('scizor', 'hc-d', false).rotom.speciesId).toBe('rotom');
  });

  it('House Call on your own Rotom: the battle asks which form, on entry, once a battle; it stays that form when withdrawn', () => {
    const start = (seed: string): RunState => {
      const run = gnRun(seed);
      const rotom = createPokemon(content, 'rotom', run.party[0]!.level, 'r1');
      rotom.fixedAbility = 'house-call';
      run.party = [rotom, createPokemon(content, 'snorlax', rotom.level, 'a1')];
      open(run, 'gn-32-phase-1');
      const r = choose(run, 'gn-32-phase-1', 'Fight.').run;
      r.battle!.enemyTeam[0]!.moves = [{ id: 'splash', pp: 40 }];
      return r;
    };
    const say = (r: RunState, label: string): RunState => {
      const ask = askDue(content, r)!;
      return takeTurn(content, r, { kind: 'answer', ask: ask.id, option: ask.options.find((o) => o.label === label)!.index }).run;
    };
    let run = start('hc-ask');
    // asked before the first command; two pages of answers (a question holds four)
    expect(askDue(content, run)!.options.map((o) => o.label)).toEqual(['The oven.', 'The washing machine.', 'The fridge.', 'Another.']);
    run = say(run, 'Another.');
    // saved with the battle: a reload in the middle of the question asks the same page again
    run = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(askDue(content, run)!.options.map((o) => o.label)).toEqual(['The fan.', 'The mower.', 'Stay as it is.', 'Back.']);
    run = say(run, 'Back.');
    const rng = structuredClone(run.rng);
    run = say(run, 'The washing machine.');
    // the player's pick, whatever the foe is; no turn used, nothing rolled
    expect(run.party[0]!.speciesId).toBe('rotom-wash');
    expect(run.battle!.turn).toBe(1);
    expect(run.rng).toEqual(rng);
    expect(run.battle!.storyEffects).toContain('house-call:r1');
    expect(askDue(content, run)).toBeNull();
    expect(() => takeTurn(content, run, { kind: 'answer', ask: 'house-call', option: 0 })).toThrow();
    // "stays that form until it faints": withdrawn and sent back, it is still the washing machine, and is not asked again
    run = takeTurn(content, run, { kind: 'switch', partyIndex: 1 }).run;
    run = takeTurn(content, run, { kind: 'switch', partyIndex: 0 }).run;
    expect(run.party[0]!.speciesId).toBe('rotom-wash');
    expect(askDue(content, run)).toBeNull();
    // "it may": staying plain is an answer too, and it is the one change this battle
    let plain = say(say(start('hc-plain'), 'Another.'), 'Stay as it is.');
    expect(plain.party[0]!.speciesId).toBe('rotom');
    expect(askDue(content, plain)).toBeNull();
    plain = takeTurn(content, plain, { kind: 'move', index: 0 }).run;
    expect(plain.party[0]!.speciesId).toBe('rotom');
    // a Rotom without the ability, or one already in a form, is never asked
    const none = start('hc-none');
    none.party[0]!.fixedAbility = undefined;
    expect(askDue(content, none)).toBeNull();
  });
  it('the shop is once per run and does not come back once done', () => {
    let run = afterErrands('appl-once', 1);
    run = choose(run, 'gn-new-23-after', '"You don\'t have to pick."').run;
    expect(flagOf(run, 'appliance-done')).toBe(1);
    const e = content.events.get('gn-new-23-shop')!;
    expect(JSON.stringify(e.requires)).toContain('appliance-done');
  });
  it('later in the run the shop mends a spent berry, free', () => {
    const run = gnRun('appl-hub');
    setFlag(run, 'appliance-done', 1);
    run.party[0]!.held = { 'oran-berry': 1 };
    open(run, 'gn-new-23-hub');
    const r = choose(run, 'gn-new-23-hub', 'Mend a held item.');
    expect(r.run.party[0]!.held?.['oran-berry']).toBe(2);
  });
});
