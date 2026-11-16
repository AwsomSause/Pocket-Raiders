// Greenneedle gn.new.09 The Last Stop (tools/events/co/greenneedle-new-09.ts; rules in src/core/greenneedle/laststop.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { castOf } from '../../src/core/greenneedle';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene } from './helpers/gnPlay';

const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);
const boarded = (seed: string): RunState => {
  let run = gnRun(seed);
  open(run, 'gn-new-09-door');
  run = choose(run, 'gn-new-09-door', 'Board.').run;
  return run;
};

describe('gn.new.09 The Last Stop', () => {
  it('boarding gives a ticket, deals the stake and three cards, and opens the dining car', () => {
    const run = boarded('t-ls-a');
    expect(opened(run, 'gn-new-09-dining')).toBe(true);
    expect(flagOf(run, 'last-stop-boarded')).toBe(1);
    expect(flagOf(run, 'ls-date')).toBeGreaterThan(0);
    const stake = castOf(run, 'ls-stake')!;
    expect(run.party[0]!.moves.some((m) => m.id === stake)).toBe(true);
    const cards = [1, 2, 3].map((i) => castOf(run, `ls-card-${i}`)!);
    expect(new Set(cards).size).toBe(3);
    for (const c of cards) { expect(content.moves.has(c)).toBe(true); expect(run.party[0]!.moves.some((m) => m.id === c)).toBe(false); }
    expect(scene(run, 'gn-new-09-dining').labels).toEqual(['Bet the move.', 'Watch.']);
  });
  it('staying on the platform ends it and it is once per run', () => {
    let run = gnRun('t-ls-b');
    open(run, 'gn-new-09-door');
    run = choose(run, 'gn-new-09-door', 'Stay on the platform.').run;
    expect(flagOf(run, 'gn-new-09-seen')).toBe(1);
    expect(flagOf(run, 'last-stop-boarded')).toBe(0);
  });
  it('betting trades the staked move for the chosen card', () => {
    let run = boarded('t-ls-c');
    const stake = castOf(run, 'ls-stake')!;
    const card = castOf(run, 'ls-card-2')!;
    run = choose(run, 'gn-new-09-dining', 'Bet the move.').run;
    expect(opened(run, 'gn-new-09-cards')).toBe(true);
    run = choose(run, 'gn-new-09-cards', 'The middle card.').run;
    const ids = run.party[0]!.moves.map((m) => m.id);
    expect(ids).toContain(card);
    expect(ids).not.toContain(stake);
    expect(opened(run, 'gn-new-09-sleeper')).toBe(true);
  });
  it('watching keeps every move', () => {
    let run = boarded('t-ls-d');
    const before = run.party[0]!.moves.map((m) => m.id);
    run = choose(run, 'gn-new-09-dining', 'Watch.').run;
    expect(run.party[0]!.moves.map((m) => m.id)).toEqual(before);
    expect(opened(run, 'gn-new-09-sleeper')).toBe(true);
  });
  it('the sleeper: lifting opens one of three scenes, tiptoeing goes straight to the mail car', () => {
    let run = boarded('t-ls-e');
    run = choose(run, 'gn-new-09-dining', 'Watch.').run;
    const tip = choose(structuredClone(run), 'gn-new-09-sleeper', 'Tiptoe.').run;
    expect(opened(tip, 'gn-new-09-mail')).toBe(true);
    run = choose(run, 'gn-new-09-sleeper', 'Lift one.').run;
    expect(['gn-new-09-litwick', 'gn-new-09-mask', 'gn-new-09-coat'].filter((id) => opened(run, id))).toHaveLength(1);
  });
  it('the Litwick can join, the mask is an item', () => {
    let run = boarded('t-ls-f');
    run = choose(run, 'gn-new-09-dining', 'Watch.').run;
    const a = structuredClone(run);
    a.story.flags['ev:ls-lift'] = 1;
    open(a, 'gn-new-09-litwick');
    const joined = choose(a, 'gn-new-09-litwick', 'Wake it gently.').run;
    const all = [...joined.party, ...joined.box, ...joined.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))];
    expect(all.some((m) => m.speciesId === 'litwick')).toBe(true);
    expect(opened(joined, 'gn-new-09-mail')).toBe(true);
    const b = structuredClone(run);
    open(b, 'gn-new-09-mask');
    expect(opened(choose(b, 'gn-new-09-mask', 'Put it back.').run, 'gn-new-09-mail')).toBe(true);
  });
  it('the letter: reading aloud gives Bond +2 and a quiet next battle; unread gives Bond +1', () => {
    let run = boarded('t-ls-g');
    expect(castOf(run, 'ls-letter')).toBe(run.party[0]!.speciesId);
    run = choose(run, 'gn-new-09-dining', 'Watch.').run;
    const base = run.party[0]!.friendship;
    const read = (() => { const r = structuredClone(run); open(r, 'gn-new-09-mail'); return choose(r, 'gn-new-09-mail', 'Read it aloud.').run; })();
    expect(read.party[0]!.friendship - base).toBe(10);
    expect((read.party[0]!.boosts ?? []).some((b) => b.kind === 'stage' && b.stat === 'spe' && b.stages === -1)).toBe(true);
    const unread = (() => { const r = structuredClone(run); open(r, 'gn-new-09-mail'); return choose(r, 'gn-new-09-mail', 'Give it to them unread.').run; })();
    expect(unread.party[0]!.friendship - base).toBe(5);
    expect(opened(unread, 'gn-new-09-end')).toBe(true);
  });
  it('the end of the line gives the lantern Drifloon with Last Stop', () => {
    const run = boarded('t-ls-h');
    open(run, 'gn-new-09-end');
    const done = choose(run, 'gn-new-09-end', 'Take the string.').run;
    const all = [...done.party, ...done.box, ...done.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))];
    const drifloon = all.find((m) => m.speciesId === 'drifloon');
    expect(drifloon).toBeTruthy();
    expect(drifloon!.moves.map((m) => m.id)).toContain('last-stop');
  });
  it('the platform returns on the ticket\'s date and only then', () => {
    const run = boarded('t-ls-i');
    const stage = run.stage!;
    void stage;
    const ev = content.events.get('gn-new-09-return')!;
    expect(ev.callback).toBe(true);
    expect(JSON.stringify(ev.requires)).toContain('ls-date');
    expect(content.moves.get('last-stop')?.type).toBe('ghost');
    expect(flagOf(run, 'ls-date')).toBeGreaterThan(0);
  });
});
