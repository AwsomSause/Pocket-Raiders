// gn.47 The Pokémon League Exhibition: the match is watched on the battle screen (src/core/greenneedle/exhibition.ts, "watched").
// Doc: "The player watches. A CPU-versus-CPU battle, six on six, with commentary. ... Three times in the match, a prompt."
import { describe, expect, it } from 'vitest';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { EX_MOMENT_CHOICES, exMomentAnswer, exMomentDue, exMomentLines, exWatchAction, exWatching, MATCH_LEVEL, matchupOf } from '../../src/core/greenneedle/exhibition';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, openSide } from './helpers/gnPlay';
import { watchMatch, watchTurn } from './helpers/gnExhibition';

const name = (id: string): string => content.bosses.get(id)!.name;
/** In the seat, the match about to start: backed side `back` (or neither) for `reason`. */
function seat(seed: string, back: 'a' | 'b' | 'none' = 'a', reason = '"They\'re stronger."'): RunState {
  const run = gnRun(seed);
  open(run, 'gn-47-door');
  let r = choose(run, 'gn-47-door', 'Join the queue.').run;
  const m = matchupOf(r)!;
  r = back === 'none' ? choose(r, 'gn-47-queue', '"I don\'t mind who wins. I want to see it."').run : choose(choose(r, 'gn-47-queue', `${name(back === 'a' ? m.a : m.b)}.`).run, 'gn-47-why', reason).run;
  return choose(r, 'gn-47-match-1', 'Watch the match.').run;
}
const CHEER = ['Cheer.', 'Cheer.', 'Cheer.'];

describe('gn.47 the Exhibition, watched on the battle screen', () => {
  it('six on six at the exhibition level, both Champions\' own teams; the player\'s team waits in the Box; the battle is marked as watched', () => {
    const before = gnRun('ex-start');
    const run = seat('ex-start');
    const m = matchupOf(run)!;
    expect(run.phase).toBe('battle');
    expect(run.battle!.spectate).toEqual({ kind: 'duel' });
    expect(exWatching(run)).toBe(true);
    expect(run.party.map((x) => x.speciesId)).toEqual(content.bosses.get(m.a)!.signature.slice(0, 6));
    expect(run.battle!.enemyTeam.map((x) => x.speciesId)).toEqual(content.bosses.get(m.b)!.signature.slice(0, 6));
    expect(run.party).toHaveLength(6);
    expect(run.battle!.enemyTeam).toHaveLength(6);
    expect([...run.party, ...run.battle!.enemyTeam].every((x) => x.level === MATCH_LEVEL)).toBe(true);
    expect(run.battle!.trainer!.name).toBe(name(m.b));
    expect(before.party.every((own) => run.box.some((x) => x.uid === own.uid))).toBe(true);
  });

  it('three moments, each once: before the first move, at half-way, and when one side is down to two; the doc\'s three choices', () => {
    let run = seat('ex-moments');
    expect(EX_MOMENT_CHOICES.map((c) => c.label)).toEqual(['Cheer.', 'Watch closely.', 'Look at the crowd.']);
    expect(exMomentDue(run)).toBe(1);
    expect(exMomentLines(content, run, 1)[0]).toMatch(/Six on six\. The stadium goes quiet/);
    expect(exMomentLines(content, run, 1).at(-1)).toBe(matchupOf(run)!.phases[0]);
    const cheer = exMomentAnswer(content, run, 'cheer');
    expect(cheer.join(' ')).toMatch(/You cheer, loud enough.*They heard that\./);
    expect(exMomentDue(run)).toBe(0);
    // Nothing is due: an answer does nothing; an unknown answer never counts.
    expect(exMomentAnswer(content, run, 'watch')).toEqual([]);
    expect(flagOf(run, 'ex-watched')).toBe(0);
    const downs: number[] = [];
    const asked: number[] = [1];
    for (let guard = 0; guard < 2000 && run.battle; guard += 1) {
      const due = exMomentDue(run);
      if (due) {
        expect(exMomentAnswer(content, run, 'nonsense')).toEqual([]);
        expect(exMomentDue(run)).toBe(due);
        asked.push(due);
        downs.push(run.party.filter((x) => x.hp <= 0).length + run.battle.enemyTeam.filter((x) => x.hp <= 0).length);
        exMomentAnswer(content, run, 'crowd');
        continue;
      }
      run = watchTurn(run).run;
    }
    expect(asked).toEqual([1, 2, 3]);
    expect(downs[0]).toBeGreaterThanOrEqual(3);
    expect(downs[1]).toBeGreaterThanOrEqual(4);
    expect(flagOf(run, 'ex-moment')).toBe(3);
  });

  it('the commentary box calls every knockout, with who has how many left', () => {
    const w = watchMatch(seat('ex-calls'), CHEER);
    expect(w.calls.length).toBeGreaterThanOrEqual(6);
    expect(w.calls.length).toBeLessThanOrEqual(11);
    expect(w.calls.every((c) => /^Commentary: .+(left|down to|nobody)/.test(c))).toBe(true);
    expect(w.calls.at(-1)).toMatch(/nobody/);
  });

  it('whoever wins on the field won: the result, the small moment, the reward by who was backed, and the After room', () => {
    for (const wins of ['a', 'b'] as const) {
      const start = seat(`ex-wins-${wins}`, 'a');
      const m = matchupOf(start)!;
      const w = watchMatch(start, CHEER, wins);
      expect(flagOf(w.run, 'ex-winner')).toBe(wins === 'a' ? 1 : 2);
      expect(w.lines[0]).toBe(m.phases[2].replaceAll('{winner}', name(wins === 'a' ? m.a : m.b)));
      expect(w.lines.join(' ')).toContain(wins === 'a' ? 'They look up at your seat, and nod.' : '"You backed me. On air. That was either kind or foolish."');
      expect(flagOf(w.run, 'ex-outcome')).toBe(wins === 'a' ? 1 : 4);
      expect(w.run.battle).toBeNull();
      expect(exWatching(w.run)).toBe(false);
      expect(openSide(w.run)!.eventId).toBe('gn-47-after');
    }
  });

  it('nothing in the match counts: the player\'s own team comes back exactly as it was, in order', () => {
    const before = gnRun('ex-own');
    before.party[0]!.hp = 3;
    const run = structuredClone(before);
    open(run, 'gn-47-door');
    let r = choose(run, 'gn-47-door', 'Join the queue.').run;
    r = choose(r, 'gn-47-queue', '"I don\'t mind who wins. I want to see it."').run;
    const boxed = r.box.length;
    const w = watchMatch(choose(r, 'gn-47-match-1', 'Watch the match.').run, CHEER);
    expect(w.run.party).toEqual(before.party);
    expect(w.run.box).toHaveLength(boxed);
    expect(w.run.money).toBe(r.money);
    expect(w.lines.join(' ')).toContain('Both of them wave at your row.');
  });

  it('watching closely sees the move last used on the field; three times, and the winner calls the player down', () => {
    const w = watchMatch(seat('ex-close'), ['Cheer.', 'Watch closely.', 'Watch closely.']);
    const seen = Object.keys(w.run.story.flags).filter((k) => k.startsWith('ev:ex-seen:') && Number(w.run.story.flags[k]) > 0).map((k) => k.slice('ev:ex-seen:'.length));
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((id) => content.moves.has(id))).toBe(true);
    expect(w.said[1]!.join(' ')).toMatch(/You watch the timing of .+, exactly\./);
    expect(flagOf(w.run, 'ex-watched')).toBe(2);
    const all = watchMatch(seat('ex-close-3'), ['Watch closely.', 'Watch closely.', 'Watch closely.']);
    expect(flagOf(all.run, 'ex-watched')).toBe(3);
    expect(flagOf(all.run, 'ex-invite')).toBe(1);
  });

  it('determinism: the same seed and the same answers give the same match, turn for turn', () => {
    const a = watchMatch(seat('ex-same'), CHEER);
    const b = watchMatch(seat('ex-same'), CHEER);
    expect(b.turns).toBe(a.turns);
    expect(b.calls).toEqual(a.calls);
    expect(b.lines).toEqual(a.lines);
    expect(flagOf(b.run, 'ex-winner')).toBe(flagOf(a.run, 'ex-winner'));
    // The answers are only words and flags: cheering or looking away never changes who wins.
    const c = watchMatch(seat('ex-same'), ['Look at the crowd.', 'Watch closely.', 'Cheer.']);
    expect(c.calls).toEqual(a.calls);
  });

  it('save and reload in the middle of the match: it goes on from the same turn to the same end', () => {
    let run = seat('ex-save');
    exMomentAnswer(content, run, 'cheer');
    for (let i = 0; i < 4; i += 1) run = watchTurn(run).run;
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(exWatching(loaded)).toBe(true);
    expect(loaded.battle!.spectate).toEqual({ kind: 'duel' });
    expect(exWatchAction(content, loaded)).toEqual(exWatchAction(content, run));
    const a = watchMatch(run, CHEER);
    const b = watchMatch(loaded, CHEER);
    expect(b.calls).toEqual(a.calls);
    expect(b.lines).toEqual(a.lines);
    expect(b.run.party).toEqual(a.run.party);
  });

  it('outside the match, the watch rules do nothing', () => {
    const run = gnRun('ex-none');
    expect(exWatching(run)).toBe(false);
    expect(exMomentDue(run)).toBe(0);
    expect(exWatchAction(content, run)).toEqual([]);
    expect(exMomentAnswer(content, run, 'cheer')).toEqual([]);
  });
});
