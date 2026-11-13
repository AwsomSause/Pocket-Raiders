// Beta 0.6 wide formats (E4): the shared registry and the Breather.
import { describe, expect, it } from 'vitest';
import { breatherShare } from '../../src/core/formats/breather';
import { battleEnded, cardOf, chooseOption, closeFormat, formatOver, startFormat } from '../../src/core/formats/registry';
import { currentFormat } from '../../src/core/formats/store';
import { maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const mk = (seed = 'fm1') => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
  const base = r.party[0]!;
  r.party = Array.from({ length: 4 }, (_, i) => ({ ...structuredClone(base), uid: `m${i}` }));
  return r;
};
const ctxOf = (run: ReturnType<typeof mk>) => ({ content, run });

describe('Breather', () => {
  it('heals the ones still up by 50% of max HP and brings back exactly the one chosen', () => {
    const run = mk();
    const max = maxHp(content, run.party[0]!);
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    run.party[2]!.hp = 0;
    expect(startFormat('breather', ctxOf(run))).toBe(true);
    const card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['m1', 'm2']);
    chooseOption(ctxOf(run), 'm2');
    expect(run.party[0]!.hp).toBe(Math.min(max, 1 + Math.ceil(max * 0.5)));
    expect(run.party[2]!.hp).toBe(Math.max(1, Math.ceil(maxHp(content, run.party[2]!) * 0.5)));
    expect(run.party[1]!.hp).toBe(0);
    expect(run.party[3]!.hp).toBe(maxHp(content, run.party[3]!));
    expect(formatOver(ctxOf(run))).toBe(true);
    expect(run.expansion!.cut!.checkpoint).toBe('breather');
  });

  it('with nobody down it offers a plain Rest', () => {
    const run = mk();
    run.party[0]!.hp = 2;
    startFormat('breather', ctxOf(run));
    const card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['rest']);
    chooseOption(ctxOf(run), 'rest');
    expect(run.party[0]!.hp).toBeGreaterThan(2);
  });

  it('never applies twice: choosing again, or starting again, changes nothing', () => {
    const run = mk();
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    startFormat('breather', ctxOf(run));
    chooseOption(ctxOf(run), 'm1');
    const after = JSON.stringify(run.party);
    chooseOption(ctxOf(run), 'm0');
    expect(JSON.stringify(run.party)).toBe(after);
    closeFormat(ctxOf(run));
    expect(startFormat('breather', ctxOf(run))).toBe(false);
  });

  it('a wrong uid revives nobody but still heals once', () => {
    const run = mk();
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    startFormat('breather', ctxOf(run));
    chooseOption(ctxOf(run), 'nope');
    expect(run.party[1]!.hp).toBe(0);
    expect(run.party[0]!.hp).toBeGreaterThan(1);
  });

  it('heals 35% when the poisoned gate was lost (boundary)', () => {
    expect(breatherShare([])).toBe(0.5);
    expect(breatherShare(['kanto.west-gate'])).toBe(0.35);
    expect(breatherShare(['any.cliff-stair', 'x'])).toBe(0.35);
    const run = mk();
    const max = maxHp(content, run.party[0]!);
    run.party[0]!.hp = 1;
    run.expansion = { siege: { lost: ['kanto.west-gate'] } };
    startFormat('breather', ctxOf(run));
    chooseOption(ctxOf(run), 'rest');
    expect(run.party[0]!.hp).toBe(Math.min(max, 1 + Math.ceil(max * 0.35)));
  });

  it('survives save and reload at both points; a damaged slot is dropped, not thrown on', () => {
    const run = mk();
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    startFormat('breather', ctxOf(run));
    let loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(cardOf(ctxOf(loaded as typeof run))!.over).toBe(false);
    chooseOption(ctxOf(loaded as typeof run), 'm1');
    loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(loaded)));
    expect(cardOf(ctxOf(loaded as typeof run))!.over).toBe(true);
    expect(startFormat('breather', ctxOf(loaded as typeof run))).toBe(false);
    const bad = mk();
    bad.expansion = { cut: { format: { id: 'bogus', state: 3 } } };
    expect(currentFormat(bad)).toBeNull();
    expect(cardOf(ctxOf(bad))).toBeNull();
  });

  it('formats without a battle hook ignore battle results', () => {
    const run = mk();
    startFormat('breather', ctxOf(run));
    expect(battleEnded(ctxOf(run), true)).toBe(true);
    expect(startFormat('convoy', ctxOf(run))).toBe(false);
  });
});
