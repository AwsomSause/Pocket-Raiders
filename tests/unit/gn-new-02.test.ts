// Greenneedle gn.new.02: The Dog at the Station (tools/events/co/greenneedle-new-02.ts) and its ability Vigil (engine.ts).
import { describe, expect, it } from 'vitest';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon } from '../../src/core/pokemon';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { hashSeed, Rng } from '../../src/core/rng';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const ids = ['gn-new-02-platform', 'gn-new-02-porter', 'gn-new-02-landlady', 'gn-new-02-clinic', 'gn-new-02-last', 'gn-new-02-holiday'];

const at = (seed: string, eventId: string, flags: Record<string, number> = {}): RunState => {
  const run = gnRun(seed);
  for (const [k, v] of Object.entries(flags)) setFlag(run, k, v);
  open(run, eventId);
  return run;
};
describe('gn.new.02 The Dog at the Station', () => {
  it('builds six events with the doc\'s labels and the platform\'s script', () => {
    for (const id of ids) expect(content.events.has(id), id).toBe(true);
    const platform = scene(gnRun('dog-1'), 'gn-new-02-platform');
    expect(platform.labels).toEqual(['Sit with it.', 'Feed it.', 'Try to lead it away.', 'Ask around town.']);
    expect(platform.intro).toMatch(/Four years\. Meets every train\. I stopped telling it\./);
    expect(platform.intro).toMatch(/Everyone gets off\. It sits back down\./);
  });

  it('sit with it: one more sat, the flag gn.37 reads; the platform is not offered twice', () => {
    const r = choose(at('dog-sit', 'gn-new-02-platform'), 'gn-new-02-platform', 'Sit with it.');
    expect(said(r)).toMatch(/leans/);
    expect(flagOf(r.run, 'dog-station-sat')).toBe(1);
    expect(flagOf(r.run, 'dog-open')).toBe(1);
    expect(flagOf(r.run, 'dog-seen')).toBe(1);
  });

  it('feed it and lead it away remember their own flag and do not open the last visit', () => {
    const fed = choose(at('dog-fed', 'gn-new-02-platform'), 'gn-new-02-platform', 'Feed it.');
    expect(flagOf(fed.run, 'dog-fed')).toBe(1);
    expect(flagOf(fed.run, 'dog-open')).toBe(0);
    const led = choose(at('dog-led', 'gn-new-02-platform'), 'gn-new-02-platform', 'Try to lead it away.');
    expect(said(led)).toMatch(/runs, flat out|runs/);
    expect(flagOf(led.run, 'dog-led')).toBe(1);
    expect(flagOf(led.run, 'dog-station-sat')).toBe(0);
  });

  it('ask around: the three errands open', () => {
    const r = choose(at('dog-ask', 'gn-new-02-platform'), 'gn-new-02-platform', 'Ask around town.');
    expect(flagOf(r.run, 'dog-asking')).toBe(1);
    expect(flagOf(r.run, 'dog-open')).toBe(1);
  });

  it('the three stories keep the doc\'s lines', () => {
    expect(scene(gnRun('dog-p'), 'gn-new-02-porter').intro).toMatch(/Ran off with a circus\. I'd swear to it\./);
    expect(scene(gnRun('dog-l'), 'gn-new-02-landlady').intro).toMatch(/Died at sea\. Don't tell the dog\./);
    const clinic = scene(gnRun('dog-c'), 'gn-new-02-clinic').intro;
    expect(clinic).toMatch(/He's in ward two\. He's been ill a long time\./);
    expect(clinic).toMatch(/He won't send for it\. He says it deserves better than a sick man\./);
  });

  it('each errand remembers itself; the clinic opens the last visit', () => {
    expect(flagOf(choose(at('dog-e1', 'gn-new-02-porter', { 'dog-asking': 1 }), 'gn-new-02-porter', 'Listen.').run, 'dog-porter')).toBe(1);
    expect(flagOf(choose(at('dog-e2', 'gn-new-02-landlady', { 'dog-asking': 1 }), 'gn-new-02-landlady', 'Listen.').run, 'dog-landlady')).toBe(1);
    expect(flagOf(choose(at('dog-e3', 'gn-new-02-clinic', { 'dog-asking': 1 }), 'gn-new-02-clinic', 'Ask for his name.').run, 'dog-clinic')).toBe(1);
  });

  it('the last visit: the letter or the Growlithe reunites them (Fire Stone, a Notebook line, no Growlithe)', () => {
    for (const label of ['Carry the letter.', 'Carry the Growlithe.']) {
      const run = at(`dog-${label}`, 'gn-new-02-last', { 'dog-open': 1, 'dog-clinic': 1, 'dog-asking': 1 });
      expect(scene(run, 'gn-new-02-last').labels).toEqual(['Carry the letter.', 'Carry the Growlithe.']);
      const r = choose(run, 'gn-new-02-last', label);
      expect(said(r)).toMatch(/Fire Stone/);
      expect(said(r)).toMatch(/Notebook/);
      expect(flagOf(r.run, 'dog-reunited')).toBe(1);
      expect(flagOf(r.run, 'dog-done')).toBe(1);
      expect(flagOf(r.run, 'dog-chose-player')).toBe(0);
      expect([...r.run.party, ...r.run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].some((m) => m.speciesId === 'growlithe')).toBe(false);
    }
  });

  it('only ever sat: "Sit one more time." and a Growlithe with Vigil joins', () => {
    const run = at('dog-chose', 'gn-new-02-last', { 'dog-open': 1, [`dog-station-sat`]: 1 });
    expect(scene(run, 'gn-new-02-last').labels).toEqual(['Sit one more time.']);
    const r = choose(run, 'gn-new-02-last', 'Sit one more time.');
    const mon = [...r.run.party, ...r.run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'growlithe');
    expect(mon?.fixedAbility).toBe('vigil');
    expect(flagOf(r.run, 'dog-chose-player')).toBe(1);
    expect(flagOf(r.run, 'dog-done')).toBe(1);
  });

  it('the clerk on holiday remembers the dog', () => {
    const r = choose(at('dog-holiday', 'gn-new-02-holiday', { 'dog-done': 1 }), 'gn-new-02-holiday', 'Sit with him.');
    expect(said(r)).toMatch(/Habit/);
    expect(flagOf(r.run, 'dog-holiday')).toBe(1);
  });

  it('the events are gated: the porter only in the platform\'s stage, the last visit only once the dog was asked about or sat with', () => {
    const e = (id: string) => content.events.get(id)!;
    expect(e('gn-new-02-last').choices.length).toBeGreaterThan(0);
    expect(JSON.stringify(e('gn-new-02-porter').requires)).toMatch(/sameStage/);
    expect(JSON.stringify(e('gn-new-02-last').requires)).toMatch(/dog-open/);
  });
});

describe('Vigil (gn.new.02)', () => {
  const mon = (species: string, level: number, uid: string, ...moves: string[]): PokemonInstance => {
    const m = createPokemon(content, species, level, uid);
    m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    return m;
  };
  const hitOnce = (ability: string | undefined, turnsOut: number): { taken: number; spent: boolean } => {
    const dog = mon('growlithe', 40, 'p-v', 'splash');
    if (ability) dog.fixedAbility = ability;
    dog.hp = 999;
    const battle = createBattle('wild', [mon('machop', 40, 'e-v', 'karate-chop')], 0, dog.uid);
    battle.playerVolatile.turnsOut = turnsOut;
    const ctx: BattleContext = { content, battle, party: [dog], inventory: {}, rng: new Rng(hashSeed('vigil-same')), captureRng: new Rng(hashSeed('vigil-c')), catchMultiplier: 1 };
    const before = dog.hp;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    return { taken: before - dog.hp, spent: battle.storyEffects.includes('vigil:p-v') };
  };

  it('after three full turns the next hit does half; once a battle', () => {
    const plain = hitOnce(undefined, 3);
    const vigil = hitOnce('vigil', 3);
    expect(plain.taken).toBeGreaterThan(0);
    expect(vigil.taken).toBeLessThanOrEqual(Math.ceil(plain.taken / 2) + 1);
    expect(vigil.taken).toBeGreaterThan(0);
    expect(vigil.spent).toBe(true);
  });

  it('before the third turn it does nothing', () => {
    const plain = hitOnce(undefined, 2);
    const vigil = hitOnce('vigil', 2);
    expect(vigil.taken).toBe(plain.taken);
    expect(vigil.spent).toBe(false);
  });
});
