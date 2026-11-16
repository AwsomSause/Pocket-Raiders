// gn.new.16 The Thing in the Well (tools/events/co/greenneedle-new-16.ts).
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { createPokemon } from '../../src/core/pokemon';
import { evolve } from '../../src/core/evolution';
import { eligibleEvents } from '../../src/core/events';
import { choose, flagOf, gnRun, open, scene } from './helpers/gnPlay';

describe('gn.new.16 The Thing in the Well', () => {
  it('is a must-see single at step 5 with the doc\'s four buttons, and the ability is real', () => {
    expect(content.coPlacement!.get('gn-new-16-well')).toMatchObject({ shape: 'single', home: 5, sits: 'must-see', earliest: 2 });
    expect(content.abilities.get('unlooked-for')).toBeTruthy();
    const run = gnRun('t-well-a');
    open(run, 'gn-new-16-well');
    expect(scene(run, 'gn-new-16-well').labels).toEqual(['Lower a light.', 'Lower a Pokémon.', 'Lower myself.', 'Lower a gift.']);
  });

  it('light and Pokémon only look; the well stays open', () => {
    const run = gnRun('t-well-b');
    open(run, 'gn-new-16-well');
    const r = choose(run, 'gn-new-16-well', 'Lower a light.').run;
    expect(flagOf(r, 'well-seen')).toBe(0);
    expect(scene(r, 'gn-new-16-again').labels).toHaveLength(4);
    expect(r.pending.some((p) => p.kind === 'caught')).toBe(false);
  });

  for (const [label, flagName] of [['Lift it out.', 'well-lifted'], ['Tell the village.', 'well-told']] as const) {
    it(`lowering yourself, then "${label}": the Feebas joins with Unlooked-For`, () => {
      let run = gnRun(`t-well-${flagName}`);
      open(run, 'gn-new-16-well');
      run = choose(run, 'gn-new-16-well', 'Lower myself.').run;
      expect(flagOf(run, 'well-seen')).toBe(1);
      expect(scene(run, 'gn-new-16-choose').labels).toEqual(['Lift it out.', 'Tell the village.', 'Leave it its bucket.']);
      run = choose(run, 'gn-new-16-choose', label).run;
      const feebas = run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : [])).find((m) => m.speciesId === 'feebas')!;
      expect(feebas.fixedAbility).toBe('unlooked-for');
      expect(flagOf(run, flagName)).toBe(1);
      expect(flagOf(run, 'well-done')).toBe(1);
    });
  }

  it('three gifts (Berry, Pearl, Heart Scale) give a Pearl, a Heart Scale, a Prism Scale; then the choice; leaving still gives the Feebas', () => {
    let run = gnRun('t-well-gifts');
    open(run, 'gn-new-16-well');
    run = choose(run, 'gn-new-16-well', 'Lower a gift.').run;
    run = choose(run, 'gn-new-16-gift', 'Lower a Berry.').run;
    expect(flagOf(run, 'well-gift')).toBe(1);
    run = choose(run, 'gn-new-16-gift2', 'Lower the Pearl.').run;
    run = choose(run, 'gn-new-16-gift3', 'Lower the Heart Scale.').run;
    expect(flagOf(run, 'well-gift')).toBe(3);
    expect(run.inventory['prism-scale']).toBe(1);
    run = choose(run, 'gn-new-16-choose', 'Leave it its bucket.').run;
    expect(run.pending.some((p) => p.kind === 'caught' && p.mon.fixedAbility === 'unlooked-for')).toBe(true);
    expect(flagOf(run, 'well-left')).toBe(1);
    expect(flagOf(run, 'well-done')).toBe(1);
  });

  it('Unlooked-For: when the Feebas evolves, the villagers come to look once', () => {
    let run = gnRun('t-well-look');
    const feebas = createPokemon(content, 'feebas', 20, 'p-feebas');
    feebas.gn = ['well-feebas'];
    run.party.push(feebas);
    expect(eligibleEvents(content, run).map((e) => e.id)).not.toContain('gn-new-16-look');
    evolve(content, feebas, 'milotic');
    expect(feebas.gn).toContain('well-evolved');
    open(run, 'gn-new-16-look');
    expect(scene(run, 'gn-new-16-look').labels).toEqual(['Let them look.']);
    run = choose(run, 'gn-new-16-look', 'Let them look.').run;
    expect(flagOf(run, 'well-looked')).toBe(1);
  });
});
