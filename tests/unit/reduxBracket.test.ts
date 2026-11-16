import { describe, expect, it } from 'vitest';
import { tourneyBracket } from '../../src/core/expansion/tourney';
import { bracketView, friendsPage, friendsPages, galarHome, galarPage, tourneyHome, tourneyPage, tourneyRounds } from '../../src/ui/redux/screens/bracket';
import { makeBracket } from '../../src/core/tools/bracket';
import { bracketTree } from '../../src/core/galarTournament';
import { chooseStarter, createRun, debugJumpToLeague } from '../../src/core/run';
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

describe("New UI bracket for Galar's Champion Tournament", () => {
  const league = (wins: number) => {
    let run = createRun(content, { runId: 'r', seed: 'TREE1', archetypeId: 'red' });
    run.regionOrder = ['galar', ...run.regionOrder.filter((r) => r !== 'galar')];
    run.regionIndex = 0;
    run = debugJumpToLeague(content, chooseStarter(content, run, 0));
    run.stage!.visited = ['a', 'b', 'c', 'd', 'e'].slice(0, wins);
    return run;
  };

  it('the tree lists who stands after every round already played, the player first', () => {
    expect(bracketTree(content, league(0)).lines.map((l) => l.length)).toEqual([32]);
    const tree = bracketTree(content, league(2));
    expect(tree.wins).toBe(2);
    expect(tree.lines.map((l) => l.length)).toEqual([32, 16, 8]);
    for (const line of tree.lines) expect(line[0]).toMatchObject({ you: true, name: 'You' });
    // The player's slot shows their lead Pokémon; everyone else their best-known one.
    expect(tree.lines[0]![0]!.ace).toBe(league(2).party[0]!.speciesId);
    expect(tree.lines[0]!.slice(1).some((e) => e.ace !== null)).toBe(true);
    expect(new Set(tree.lines[0]!.map((e) => e.id)).size).toBe(32);
    expect(bracketTree(content, league(5)).lines.map((l) => l.length)).toEqual([32, 16, 8, 4, 2, 1]);
  });

  it('is the same tree every time for one seed', () => {
    expect(bracketTree(content, league(3))).toEqual(bracketTree(content, league(3)));
  });

  it('pages show four columns, never a result that is not played, and mark who went out', () => {
    const tree = bracketTree(content, league(2));
    const groupA = galarPage(tree, file, 0, 'text');
    expect(groupA.title).toBe('Champion Tournament');
    expect(groupA.columns.map((c) => c.slots.length)).toEqual([8, 4, 2, 1]);
    expect(groupA.columns[0]!.slots.every(Boolean)).toBe(true);
    expect(groupA.columns[2]!.slots.every(Boolean)).toBe(true);
    expect(groupA.columns[3]!.slots).toEqual([null]);
    expect(groupA.columns[0]!.slots.filter((s) => s!.out)).toHaveLength(4);
    expect(groupA.columns[0]!.slots[0]).toMatchObject({ you: true, out: false });
    const finals = galarPage(tree, file, 4, 'text');
    expect(finals.columns[0]!.slots.every(Boolean)).toBe(true);
    expect(finals.columns[0]!.now).toBe(true);
    expect(finals.columns.slice(1).flatMap((c) => c.slots)).toEqual([null, null, null, null, null, null, null]);
    const all = [0, 1, 2, 3].flatMap((p) => galarPage(tree, file, p, '').columns[0]!.slots.map((s) => s!.name));
    expect(all).toEqual(tree.lines[0]!.map((e) => e.name));
  });

  it('opens on the player group, then on the finals from the quarter-final on', () => {
    expect(galarHome(bracketTree(content, league(0)))).toBe(0);
    expect(galarHome(bracketTree(content, league(1)))).toBe(0);
    expect(galarHome(bracketTree(content, league(2)))).toBe(4);
  });

  it('a won final shows the player as Champion', () => {
    const finals = galarPage(bracketTree(content, league(5)), file, 4, '');
    expect(finals.columns[3]!.slots[0]).toMatchObject({ you: true, name: 'You' });
  });

  it('draws the watch chip and keeps the page chips with a long text', () => {
    const html = bracketView(ctx, { ...galarPage(bracketTree(content, league(2)), file, 4, 'x'.repeat(140)), extra: 'W: watch a round 2 match' });
    expect(html).toContain('data-act="bracketWatch"');
    expect(html.split('data-act="bracketPage"').length - 1).toBe(5);
    expect(html).toContain('bottom:136px');
  });
});

// Tools > Tournament bracket: names typed by the player. Nothing is played, so only round one and the byes show.
describe('New UI bracket from typed names', () => {
  const made = (n: number) => { const r = makeBracket(Array.from({ length: n }, (_, i) => `P${i + 1}`), 'seed'); if (!r.ok) throw new Error(r.reason); return r; };
  const names = (m: ReturnType<typeof friendsPage>, col: number) => m.columns[col]!.slots.map((s) => s?.name ?? '?');

  it('eight names fit on one page of 8, 4, 2 and 1 slots with no page chips', () => {
    const r = made(8), m = friendsPage(r.rounds, 0, 'text');
    expect(friendsPages(8)).toEqual([]);
    expect(m.columns.map((c) => c.slots.length)).toEqual([8, 4, 2, 1]);
    expect(m.columns.map((c) => c.name)).toEqual(['Quarterfinal', 'Semifinal', 'Final', 'Winner']);
    expect([...names(m, 0)].sort()).toEqual([...r.names].sort());
    expect(names(m, 1)).toEqual(['?', '?', '?', '?']);
    expect(bracketView(ctx, m)).not.toContain('data-act="bracketPage"');
    expect(m.hints).toEqual([['Enter', 'copy'], ['Esc', 'back']]);
  });
  it('two names are one match and a winner', () => {
    const m = friendsPage(made(2).rounds, 0, '');
    expect(m.columns.map((c) => c.slots.length)).toEqual([2, 1]);
    expect(m.columns.map((c) => c.name)).toEqual(['Final', 'Winner']);
  });
  it('a bye shows as "(bye)" and its player is already through', () => {
    const r = made(5), m = friendsPage(r.rounds, 0, '');
    expect(m.columns.map((c) => c.slots.length)).toEqual([8, 4, 2, 1]);
    expect(names(m, 0).filter((n) => n === '(bye)')).toHaveLength(3);
    expect(m.columns[0]!.slots.filter((s) => s?.out).map((s) => s!.name)).toEqual(['(bye)', '(bye)', '(bye)']);
    // The three players with a bye stand in the next column; the fourth slot waits for its match.
    expect(names(m, 1).filter((n) => n !== '?')).toHaveLength(3);
    expect(names(m, 1).filter((n) => n === '?')).toHaveLength(1);
  });
  it('32 names: four groups of eight and the finals, every name listed once', () => {
    const r = made(32);
    expect(friendsPages(32)).toEqual(['Group A', 'Group B', 'Group C', 'Group D', 'Finals']);
    const seen = [0, 1, 2, 3].flatMap((p) => names(friendsPage(r.rounds, p, ''), 0));
    expect([...seen].sort()).toEqual([...r.names].sort());
    const finals = friendsPage(r.rounds, 4, '');
    expect(finals.columns.map((c) => c.slots.length)).toEqual([4, 2, 1]);
    expect(finals.columns.map((c) => c.name)).toEqual(['Semifinal', 'Final', 'Winner']);
    expect(finals.columns.every((c) => c.slots.every((s) => s === null))).toBe(true);
    expect(bracketView(ctx, finals).split('data-act="bracketPage"').length - 1).toBe(5);
    expect(finals.hints?.[0]).toEqual(['◀ ▶', 'group']);
  });
  it('16 names: two groups and the finals; a page out of range is clamped', () => {
    const r = made(16);
    expect(friendsPages(16)).toEqual(['Group A', 'Group B', 'Finals']);
    expect(friendsPage(r.rounds, 0, '').columns.map((c) => c.name)).toEqual(['Round of 16', 'Quarterfinal', 'Semifinal', 'Final']);
    expect(friendsPage(r.rounds, 99, '').page).toBe(2);
    expect(friendsPage(r.rounds, -3, '').page).toBe(0);
    expect(friendsPage(r.rounds, 2, '').columns.map((c) => c.slots.length)).toEqual([2, 1]);
  });
});
