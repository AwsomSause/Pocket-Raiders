import { describe, expect, it } from 'vitest';
import { loreArchive, loreTotals, LORE_CATEGORIES } from '../../src/core/story2/loreView';
import { content } from './helpers';

const data = content.storyData;
const first = data.lore[0]!;

describe('lore archive view', () => {
  it('has the 11 categories and counts every lore entry once', () => {
    const cats = loreArchive(data, {}, true);
    expect(cats.map((c) => c.name)).toEqual([...LORE_CATEGORIES]);
    expect(loreTotals(cats)).toEqual({ found: 0, total: data.lore.length });
  });
  it('hides entries not found and shows state for found ones', () => {
    const cats = loreArchive(data, { [first.id]: { state: 'known', sources: ['ch_vance'] } }, true);
    const row = cats[first.category - 1]!.rows.find((r) => r.id === first.id)!;
    expect(row.state).toBe('known');
    expect(row.name).toBe(data.text[first.nameKey]);
    expect(row.sources).toBe(1);
    const hidden = cats.flatMap((c) => c.rows).find((r) => r.id !== first.id)!;
    expect(hidden.name).toBe('???');
    expect(hidden.text).toBe('???');
    expect(loreTotals(cats).found).toBe(1);
  });
  it('a rumor shows only the first sentence; a contested entry shows every reading; spoilers stay masked on a rumor with the guard on', () => {
    const multi = data.lore.find((l) => l.interpretations.length >= 2 && !l.spoiler)!;
    const contested = loreArchive(data, { [multi.id]: { state: 'contested', sources: [] } }, true)[multi.category - 1]!.rows.find((r) => r.id === multi.id)!;
    expect(contested.text).toContain('1. ');
    expect(contested.text).toContain('2. ');
    const spoiler = data.lore.find((l) => l.spoiler)!;
    const on = loreArchive(data, { [spoiler.id]: { state: 'rumor', sources: [] } }, true)[spoiler.category - 1]!.rows.find((r) => r.id === spoiler.id)!;
    const off = loreArchive(data, { [spoiler.id]: { state: 'rumor', sources: [] } }, false)[spoiler.category - 1]!.rows.find((r) => r.id === spoiler.id)!;
    expect(on.text).toBe('???');
    expect(off.text).not.toBe('???');
  });
  it('an unknown saved state counts as hidden', () => {
    const cats = loreArchive(data, { [first.id]: { state: 'weird', sources: [] } }, true);
    expect(loreTotals(cats).found).toBe(0);
  });
});
