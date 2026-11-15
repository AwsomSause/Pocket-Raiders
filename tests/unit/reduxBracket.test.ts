import { describe, expect, it } from 'vitest';
import { tourneyBracket } from '../../src/core/expansion/tourney';
import { bracketView, tourneyHome, tourneyPage, tourneyRounds } from '../../src/ui/redux/screens/bracket';
import type { ReduxCtx } from '../../src/ui/redux/stage';
import { content } from './helpers';

// The New UI bracket: the 32-entrant Fighting Tournament shown eight at a time (four groups and the finals),
// in the mock-ups' 8/4/2/1 columns. Matches not played yet must not show who wins them.

const run = { seed: 'bracket-test', party: [{ speciesId: 'mankey' }] } as unknown as Parameters<typeof tourneyBracket>[1];
const at = (now: number) => tourneyBracket(content, run, now);
const file = (): string | null => null;
const ctx: ReduxCtx = { k: 0, skin: {} as ReduxCtx['skin'], v: () => 0 };

describe('New UI tournament bracket', () => {
  it('every page has four columns of 8, 4, 2 and 1 slots', () => {
    for (const now of [0, 1, 3, 6]) {
      for (let page = 0; page < 5; page++) {
        const m = tourneyPage(at(now), file, page, 'T');
        expect(m.columns.map((c) => c.slots.length)).toEqual([8, 4, 2, 1]);
        expect(m.pages).toHaveLength(5);
        expect(m.page).toBe(page);
      }
    }
  });

  it('the four group pages together list all 32 entrants once, with the player in group A', () => {
    const view = at(1);
    const names = [0, 1, 2, 3].flatMap((p) => tourneyPage(view, file, p, 'T').columns[0]!.slots.map((s) => s?.name));
    expect(names).toEqual(view.entrants.map((e) => e.name));
    expect(tourneyPage(view, file, 0, 'T').columns[0]!.slots[0]?.you).toBe(true);
    expect(tourneyHome(view)).toBe(0);
  });

  it('does not show the winner of a match that has not been played', () => {
    // Sign-up and round 1 next: only the first column is known.
    for (const now of [0, 1]) {
      const m = tourneyPage(at(now), file, 0, 'T');
      expect(m.columns[0]!.slots.every((s) => s !== null)).toBe(true);
      for (const col of m.columns.slice(1)) expect(col.slots.every((s) => s === null)).toBe(true);
      expect(tourneyPage(at(now), file, 4, 'T').columns.every((c) => c.slots.every((s) => s === null))).toBe(true);
    }
    // Quarter-final next: the last eight are known, the semi-finalists are not.
    const q = tourneyPage(at(3), file, 4, 'T');
    expect(q.columns[0]!.slots.every((s) => s !== null)).toBe(true);
    expect(q.columns[1]!.slots.every((s) => s === null)).toBe(true);
    expect(tourneyHome(at(3))).toBe(4);
    // Champion: everything is known, and the champion is the player.
    const end = tourneyPage(at(6), file, 4, 'T');
    expect(end.columns.every((c) => c.slots.every((s) => s !== null))).toBe(true);
    expect(end.columns[3]!.slots[0]?.you).toBe(true);
    expect(end.text).toContain('Champion');
  });

  it('marks who is out, and clamps a page number that is out of range', () => {
    const m = tourneyPage(at(2), file, 0, 'T');
    // Round 1 is played: exactly four of group A's eight are out.
    expect(m.columns[0]!.slots.filter((s) => s?.out).length).toBe(4);
    expect(m.columns[1]!.slots.every((s) => s && !s.out)).toBe(true);
    expect(tourneyPage(at(2), file, 99, 'T').page).toBe(4);
    expect(tourneyPage(at(2), file, -3, 'T').page).toBe(0);
  });

  it('the round strip lights the next round and hides opponents that are not decided', () => {
    const chips = tourneyRounds(at(2));
    expect(chips.map((c) => c.state)).toEqual(['won', 'next', 'ahead', 'ahead', 'ahead']);
    expect(chips[1]!.who).not.toBe('?');
    expect(chips[2]!.who).toBe('?');
    expect(chips[3]!.who).toBe('?');
    expect(tourneyRounds(at(6)).every((c) => c.state === 'won')).toBe(true);
  });

  it('draws names as text, never as HTML', () => {
    const m = tourneyPage(at(1), file, 0, 'T');
    m.columns[0]!.slots[1] = { name: '<b>x</b>', file: null, you: false, out: false, named: false };
    const html = bracketView(ctx, m);
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toContain('<b>x</b>');
    expect(html.split('data-act="bracketPage"').length - 1).toBe(5);
  });
});
