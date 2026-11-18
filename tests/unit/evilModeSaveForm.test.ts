// The Evil Mode block's save form (core/evilMode/saveForm.ts): lossless, deterministic, smaller, and an older loose
// block still loads. Also through the real save manager: a run with a block is written packed and read back whole.
import { describe, expect, it } from 'vitest';
import { foundForPlay, playRun } from '../../src/core/evilMode/autoplay';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { EvilModeBlockSchema } from '../../src/core/evilMode/schema';
import { fromSaveForm, isSaveForm, runToSaveForm, toSaveForm } from '../../src/core/evilMode/saveForm';

const choice = { name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto' } as const;

describe('the save form', () => {
  const block = playRun(foundForPlay('form', choice, EVIL_DATA, 'three'), 'mix').block;

  it('gives back the same block, and the same text every time', () => {
    const form = toSaveForm(block);
    expect(isSaveForm(form)).toBe(true);
    expect(fromSaveForm(JSON.parse(JSON.stringify(form)))).toEqual(JSON.parse(JSON.stringify(block)));
    expect(JSON.stringify(toSaveForm(block))).toBe(JSON.stringify(form));
  });

  it('is much smaller than the loose block', () => {
    expect(JSON.stringify(toSaveForm(block)).length).toBeLessThan(JSON.stringify(block).length * 0.7);
  });

  it('loads through the block schema; an older loose block still loads as it is (no version bump)', () => {
    const loose = JSON.parse(JSON.stringify(block));
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(toSaveForm(block))))).toEqual(EvilModeBlockSchema.parse(loose));
    expect(fromSaveForm(loose)).toBe(loose);
  });

  it('keeps awkward strings: ones that start with its own marks, short ones, empty ones, repeats', () => {
    const odd = { a: ['¤', '¦', '¤12', '¦gap', '', 'ab', 'same text', 'same text'], rows: [{ x: 1 }, { y: '¦' }, { x: null, z: ['¤t'] }, {}], n: [1, -2, 3.5, true, null] };
    expect(fromSaveForm(JSON.parse(JSON.stringify(toSaveForm(odd))))).toEqual(odd);
  });

  it('a run is written with its block packed and nothing else touched; a run without one is the same object', () => {
    const run = { phase: 'map', expansion: { other: 1, evilMode: block } };
    const saved = runToSaveForm(run);
    expect(saved.expansion.other).toBe(1);
    expect(isSaveForm(saved.expansion.evilMode)).toBe(true);
    expect(runToSaveForm(saved)).toBe(saved);
    const plain = { phase: 'map' };
    expect(runToSaveForm(plain)).toBe(plain);
  });

  it('a table id that isn\'t there is an error, not a silent blank', () => {
    expect(() => fromSaveForm({ '¤t': [], b: { x: '¤5' } })).toThrow(/missing/);
  });
});
