// Greenneedle gn.new.28 The Ring Under the Bridge (tools/events/co/greenneedle-new-28.ts).
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, setFlag, win } from './helpers/gnPlay';

const go = (run: ReturnType<typeof gnRun>, id: string, label: string) => choose(run, id, label).run;
const next = (run: ReturnType<typeof gnRun>, id?: string): string => {
  const side = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.find((x) => x.kind === 'event' && !x.used && x.eventId!.startsWith('gn-new-28-'));
  return id ?? side!.eventId!;
};

describe('gn.new.28 The Ring Under the Bridge', () => {
  it('exists with its rooms', () => {
    for (const id of ['gn-new-28-bridge', 'gn-new-28-third', 'gn-new-28-recruiter', 'gn-new-28-dojo']) expect(content.events.get(id)).toBeTruthy();
  });
  it('winning all three gives the Scrafty with Rope-a-Dope and stops the ring', () => {
    let run = gnRun('n28-win');
    open(run, 'gn-new-28-bridge');
    run = go(run, 'gn-new-28-bridge', 'Enter.');
    run = win(go(run, next(run), 'Fight.'));
    run = win(go(run, next(run), 'Fight.'));
    run = win(go(run, next(run), 'Fight.'));
    run = go(run, next(run), 'Take the Scrafty.');
    const s = run.party.find((m) => m.speciesId === 'scrafty');
    expect(s).toBeTruthy();
    expect(s!.fixedAbility).toBe('rope-a-dope');
    expect(flagOf(run, 'ring-done')).toBe(1);
    expect(flagOf(run, 'ring-won-clean')).toBe(1);
    expect(flagOf(run, 'bridge-ring-stopped')).toBe(1);
  });
  it('throwing the second fight is remembered as a lie and gives no Scrafty', () => {
    let run = gnRun('n28-throw');
    open(run, 'gn-new-28-bridge');
    run = go(run, 'gn-new-28-bridge', 'Enter.');
    run = win(go(run, next(run), 'Fight.'));
    run = go(run, next(run), 'Go down in the second.');
    expect(flagOf(run, 'ring-threw')).toBe(1);
    expect(flagOf(run, 'honest-lied')).toBe(1);
    expect(flagOf(run, 'bridge-ring-stopped')).toBe(0);
    expect(run.party.some((m) => m.speciesId === 'scrafty')).toBe(false);
    // good money, and the ring is over for this run (it is not offered again)
    const before = run.money;
    run = go(run, next(run), 'Take the money.');
    expect(run.money - before).toBe(1200);
    expect(flagOf(run, 'ring-done')).toBe(1);
  });
  it('going round the back and leaving them also ends it: the ring is not offered twice', () => {
    let run = gnRun('n28-leave');
    open(run, 'gn-new-28-bridge');
    run = go(run, 'gn-new-28-bridge', 'Go round the back.');
    run = go(run, next(run), 'Leave them.');
    expect(flagOf(run, 'ring-done')).toBe(1);
    expect(flagOf(run, 'ring-freed')).toBe(0);
  });
  it('the chase spends a step; the owner is seen again by the one who sat in the crowd; the dojo is in a later region', () => {
    const cages = content.events.get('gn-new-28-back')!;
    expect(JSON.stringify(cages.choices[0]!.success.effects)).toContain('"kind":"takeNode"');
    const owner = content.events.get('gn-new-28-owner')!;
    expect(owner.callback).toBe(true);
    const run = gnRun('n28-owner');
    setFlag(run, 'ring-knows-owner');
    open(run, 'gn-new-28-owner');
    const r = go(run, 'gn-new-28-owner', 'Tell the two trainers who he is.');
    expect(flagOf(r, 'ring-owner-seen')).toBe(1);
    expect(flagOf(r, 'intel')).toBe(1);
    expect(JSON.stringify(content.events.get('gn-new-28-dojo')!.requires)).toContain('regionChanged');
    // the returning owner is not the bookmaker
    expect(JSON.stringify(content.events.get('gn-new-28-recruiter'))).not.toContain('Recruiter Lazenby');
  });
  it('Rope-a-Dope: each contact hit it takes adds 10% to its next attack, capped at 20%, and the attack spends it', () => {
    const mk = (seed: string) => {
      const scrafty = createPokemon(content, 'scrafty', 50, 's1');
      scrafty.fixedAbility = 'rope-a-dope';
      scrafty.moves = [{ id: 'brick-break', pp: 15 }, { id: 'splash', pp: 40 }];
      const foe = createPokemon(content, 'snorlax', 50, 'e1');
      foe.moves = [{ id: 'tackle', pp: 35 }];
      const battle = createBattle('wild', [foe], 0, scrafty.uid);
      const ctx: BattleContext = { content, battle, party: [scrafty], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
      return { scrafty, foe, battle, ctx };
    };
    const count = (b: { storyEffects: string[] }) => b.storyEffects.filter((e) => e === 'rope:s1').length;
    const a = mk('rope');
    for (let i = 0; i < 3; i++) resolveTurn(a.ctx, { kind: 'move', index: 1 });
    // three Tackles taken (unless one missed): never more than two are kept
    expect(count(a.battle)).toBe(2);
    resolveTurn(a.ctx, { kind: 'move', index: 0 });
    // the attack spent them (the foe's Tackle after it may have added one back)
    expect(count(a.battle)).toBeLessThanOrEqual(1);
    // the same attack, same dice, with and without two hits banked: 20% more power
    const dealt = (banked: number): number => {
      const b = mk('rope-dmg');
      b.foe.moves = [{ id: 'splash', pp: 40 }];
      for (let i = 0; i < banked; i++) b.battle.storyEffects.push('rope:s1');
      const hp = b.foe.hp;
      resolveTurn(b.ctx, { kind: 'move', index: 0 });
      return hp - b.foe.hp;
    };
    const plain = dealt(0);
    const one = dealt(1);
    const two = dealt(2);
    expect(plain).toBeGreaterThan(0);
    expect(one / plain).toBeGreaterThan(1.05);
    expect(one / plain).toBeLessThan(1.15);
    expect(two).toBeGreaterThan(one);
    expect(two / plain).toBeGreaterThan(1.15);
    expect(two / plain).toBeLessThan(1.25);
    // a Scrafty without the ability banks nothing
    const c = mk('rope-none');
    c.scrafty.fixedAbility = undefined;
    resolveTurn(c.ctx, { kind: 'move', index: 1 });
    expect(count(c.battle)).toBe(0);
  });
  it('the crowd learns the owner; the cages free every fighter', () => {
    let run = gnRun('n28-crowd');
    open(run, 'gn-new-28-bridge');
    run = go(run, 'gn-new-28-bridge', 'Sit in the crowd.');
    run = go(run, next(run), 'Memorise the face.');
    expect(flagOf(run, 'ring-knows-owner')).toBe(1);
    let r2 = gnRun('n28-back');
    open(r2, 'gn-new-28-bridge');
    r2 = go(r2, 'gn-new-28-bridge', 'Go round the back.');
    r2 = go(r2, next(r2), 'Open the cages.');
    r2 = go(r2, next(r2), 'Bow back.');
    expect(flagOf(r2, 'ring-freed')).toBe(1);
    expect(flagOf(r2, 'freed-caged')).toBe(1);
    expect(flagOf(r2, 'bridge-ring-stopped')).toBe(1);
    expect(r2.party.some((m) => m.speciesId === 'scrafty')).toBe(true);
  });
  it('losing a fight never ends the run', () => {
    let run = gnRun('n28-lose');
    open(run, 'gn-new-28-bridge');
    run = go(run, 'gn-new-28-bridge', 'Enter.');
    run = lose(go(run, next(run), 'Fight.'));
    expect(run.phase).not.toBe('over');
  });
});
