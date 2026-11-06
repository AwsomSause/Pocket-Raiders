// Social tools: seed leaderboard (S201), co-op draft (S202), hot-seat versus (S203), replay viewer (S204),
// pack voting (S205), run commentary (S213), fan art frame (S216).

import { describe, expect, it } from 'vitest';
import { localScores, playedSeeds, rankScores, seedLeaderboard } from '../../src/core/tools/seedLeaderboard';
import { COOP_SIZE, coopTeam, draftDone, pick, remaining, startCoop, whoseTurn } from '../../src/core/tools/coopDraft';
import { activeMon, hotSeatWinner, moveOptions, playTurn, startHotSeat } from '../../src/core/tools/hotSeat';
import { noteKey, parseNotes, setNote, viewAt } from '../../src/core/tools/spectator';
import { castVote, featured, parseVotes, tally, voteCode } from '../../src/core/tools/packVoting';
import { commentaryLine } from '../../src/core/tools/commentary';
import { FRAME_SLOTS, addPoster, fitSize, parsePosters, posterProblem, removePoster } from '../../src/core/tools/fanArt';
import { decodeTeamCode } from '../../src/core/shareCodes';
import { wildEligibleSpecies } from '../../src/core/themes';
import type { RunRecord } from '../../src/core/state';
import { content } from './helpers';

const rec = (o: Partial<RunRecord>): RunRecord => ({ runId: 'r', endedAt: '', seed: 's', archetypeId: 'a', campaignId: 'full', victory: false, regionsCleared: 0, regions: 8, badges: 0, encounters: 0, defeatedBy: null, party: [], bankCredits: 0, researchPoints: 0, achievements: [], moments: [], journal: [], epitaph: null, legacy: [], ...o });

describe('seed leaderboard (S201)', () => {
  it('ranks wins first, ignores assisted runs and other seeds, and adds a friend', () => {
    const h = [rec({ seed: 'x', victory: false, badges: 6 }), rec({ seed: 'x', victory: true, regionsCleared: 8, badges: 8, encounters: 90 }), rec({ seed: 'x', victory: true, assisted: true }), rec({ seed: 'y' })];
    expect(localScores(h, 'x')).toHaveLength(2);
    const board = seedLeaderboard(h, 'x', { from: 'Ann', victory: true, badges: 8, encounters: 40 });
    expect(board.map((b) => b.name)).toEqual(['You', 'Ann', 'You']);
    expect(playedSeeds(h)).toEqual([{ seed: 'x', runs: 2 }, { seed: 'y', runs: 1 }]);
    expect(seedLeaderboard([], 'x', null)).toEqual([]);
  });
  it('breaks ties by fewer encounters', () => {
    const r = rankScores([{ name: 'B', victory: true, regionsCleared: 8, badges: 8, encounters: 50, mine: false }, { name: 'A', victory: true, regionsCleared: 8, badges: 8, encounters: 30, mine: false }]);
    expect(r[0]!.name).toBe('A');
  });
});

describe('co-op draft (S202)', () => {
  const ids = wildEligibleSpecies(content).map((s) => s.id);
  it('alternates picks, refuses bad picks, and ends with a team code', () => {
    let d = startCoop(ids, 'seed', ['Ann', 'Bo']);
    if ('problem' in d) throw new Error(d.problem);
    expect(d.pool).toHaveLength(14);
    const again = startCoop(ids, 'seed', ['Ann', 'Bo']);
    expect(again).toEqual(d);
    expect(pick(d, 'not-a-species')).toEqual({ problem: 'That Pokémon is not in the pool.' });
    for (let i = 0; i < COOP_SIZE; i++) {
      expect(whoseTurn(d)).toBe(i % 2);
      const next = pick(d, remaining(d)[0]!);
      if ('problem' in next) throw new Error(next.problem);
      d = next;
    }
    expect(draftDone(d)).toBe(true);
    expect(pick(d, remaining(d)[0]!)).toEqual({ problem: 'The team is full.' });
    const { team, code } = coopTeam(d);
    expect(team).toHaveLength(6);
    const back = decodeTeamCode(code!, (id) => content.species.has(id));
    expect(back.ok && back.team.map((m) => m.speciesId)).toEqual(team.map((m) => m.speciesId));
  });
  it('refuses a pool that is too small, and has no team before the end', () => {
    expect(startCoop(['a', 'b'], 's', ['x', 'y'])).toEqual({ problem: 'Not enough Pokémon to draft from.' });
    const d = startCoop(ids, 's', ['', ''])!;
    if ('problem' in d) throw new Error();
    expect(d.names).toEqual(['Player 1', 'Player 2']);
    expect(coopTeam(d)).toEqual({ team: [], code: null });
  });
});

describe('hot-seat versus (S203)', () => {
  const ids = wildEligibleSpecies(content).map((s) => s.id).sort();
  const play = () => {
    const h = startHotSeat(content, ids.slice(0, 2), ids.slice(2, 4), 30, 'hs', ['A', 'B']);
    if ('problem' in h) throw new Error(h.problem);
    const log: unknown[] = [];
    while (hotSeatWinner(h) === null) {
      const first = (side: 0 | 1) => moveOptions(h, side).find((o) => o.pp > 0)!.index;
      const r = playTurn(h, first(0), first(1));
      if ('problem' in r) throw new Error(r.problem);
      log.push(r.events);
    }
    return { h, log };
  };
  it('plays to the end with both players picking, the same way twice', () => {
    const a = play();
    const b = play();
    expect(hotSeatWinner(a.h)).not.toBeNull();
    expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
  });
  it('uses the second player\'s pick for the foe', () => {
    const h = startHotSeat(content, ids.slice(0, 1), ids.slice(1, 2), 30, 'hs', ['A', 'B']);
    if ('problem' in h) throw new Error();
    const foe = activeMon(h, 1);
    const options = moveOptions(h, 1);
    const last = options.map((o) => o.pp > 0).lastIndexOf(true);
    const r = playTurn(h, moveOptions(h, 0).findIndex((o) => o.pp > 0), last);
    if ('problem' in r) throw new Error();
    const used = r.events.filter((e) => e.type === 'move' && e.side === 'enemy').map((e) => (e as { moveId: string }).moveId);
    if (used.length) expect(used[0]).toBe(foe.moves[last]!.id);
    expect(h.ctx.enemyPick).toBeUndefined();
  });
  it('refuses bad teams and bad picks', () => {
    expect(startHotSeat(content, [], ['pikachu'], 5, 's', ['a', 'b'])).toEqual({ problem: 'Each player needs 1 to 3 known Pokémon.' });
    expect(startHotSeat(content, ['nope'], ids.slice(0, 1), 5, 's', ['a', 'b'])).toEqual({ problem: 'Each player needs 1 to 3 known Pokémon.' });
    const h = startHotSeat(content, ids.slice(0, 1), ids.slice(1, 2), 5, 's', ['a', 'b']);
    if ('problem' in h) throw new Error();
    expect(playTurn(h, 99, 0)).toHaveProperty('problem');
    expect(playTurn(h, 0, -1)).toHaveProperty('problem');
    activeMon(h, 0).moves[0]!.pp = 0;
    expect(playTurn(h, 0, 0)).toHaveProperty('problem');
  });
});

describe('replay viewer (S204)', () => {
  const j = ['one', 'two', 'three'];
  it('clamps scrubbing and shows notes', () => {
    expect(viewAt(j, 'r', 99, {})).toMatchObject({ index: 2, line: 'three', atEnd: true });
    expect(viewAt(j, 'r', -5, {})).toMatchObject({ index: 0, atStart: true });
    expect(viewAt([], 'r', 0, {})).toMatchObject({ total: 0, line: null });
    const n = setNote({}, j, 'r', 1, ' nice <b>move ');
    if ('problem' in n) throw new Error();
    expect(viewAt(j, 'r', 1, n.notes).note).toBe('nice bmove');
    expect(noteKey('r', 1)).toBe('r#1');
  });
  it('refuses unknown steps, clears empty notes and survives damaged storage', () => {
    expect(setNote({}, j, 'r', 7, 'x')).toEqual({ problem: 'That step does not exist.' });
    const n = setNote({ 'r#0': 'a' }, j, 'r', 0, '  ');
    expect(n).toEqual({ notes: {} });
    expect(parseNotes('{bad')).toEqual({});
    expect(parseNotes('[1]')).toEqual({});
    expect(parseNotes('{"a":"b","c":3}')).toEqual({ a: 'b' });
  });
});

describe('pack voting (S205)', () => {
  const installed = ['pack-a', 'pack-b'];
  it('counts one vote per voter, moves a re-vote and features the leader', () => {
    let v = {};
    for (const code of [voteCode('pack-a', 'Ann'), voteCode('pack-a', 'Bo'), voteCode('pack-b', 'Cy')]) {
      const r = castVote(v, code, installed);
      if ('problem' in r) throw new Error(r.problem);
      v = r.votes;
    }
    expect(featured(v, installed)).toBe('pack-a');
    const moved = castVote(v, voteCode('pack-a', 'Ann').replace('pack-a', 'pack-b'), installed);
    if ('problem' in moved) throw new Error();
    expect(tally(moved.votes, installed).map((t) => t.votes)).toEqual([2, 1]);
    expect(featured(moved.votes, installed)).toBe('pack-b');
  });
  it('refuses junk, unknown packs; a tie or no votes features nothing; bad storage is empty', () => {
    expect(castVote({}, 'nope', installed)).toEqual({ problem: 'That is not a vote code.' });
    expect(castVote({}, 'PV1.other-pack.Ann', installed)).toEqual({ problem: 'That pack is not installed here.' });
    expect(featured({}, installed)).toBeNull();
    expect(featured({ 'pack-a': ['x'], 'pack-b': ['y'] }, installed)).toBeNull();
    expect(parseVotes('oops')).toEqual({});
  });
});

describe('run commentary (S213)', () => {
  const f = { seed: 's', encounters: 3, badges: 0, leadHp: 0.8, partySize: 4, fainted: 0 };
  it('is the same for the same facts and reacts to danger', () => {
    expect(commentaryLine(f)).toBe(commentaryLine({ ...f }));
    expect(commentaryLine({ ...f, leadHp: 0.1 })).toMatch(/lead|front line|thread|rest/i);
    expect(commentaryLine({ ...f, encounters: 0 })).not.toBe('');
    expect(commentaryLine({ ...f, badges: 3, encounters: 7 })).not.toContain('{n}');
  });
});

describe('fan art frame (S216)', () => {
  const ok = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
  it('keeps valid jpeg posters up to the slot limit and removes them', () => {
    let p: ReturnType<typeof parsePosters> = [];
    for (let i = 0; i < FRAME_SLOTS; i++) {
      const r = addPoster(p, `art ${i}`, ok);
      if ('problem' in r) throw new Error(r.problem);
      p = r;
    }
    expect(addPoster(p, 'x', ok)).toHaveProperty('problem');
    expect(removePoster(p, 0)).toHaveLength(FRAME_SLOTS - 1);
  });
  it('refuses non-jpeg and huge images, and damaged storage loads empty', () => {
    expect(posterProblem('data:text/html;base64,AAAA')).not.toBeNull();
    expect(posterProblem('data:image/jpeg;base64,' + 'A'.repeat(200_000))).not.toBeNull();
    expect(parsePosters('{bad')).toEqual([]);
    expect(parsePosters(JSON.stringify([{ title: 'a', dataUrl: ok }, { title: 'b', dataUrl: 'evil' }, 5]))).toHaveLength(1);
  });
  it('shrinks big images and never enlarges small ones', () => {
    expect(fitSize(1024, 512)).toEqual({ w: 256, h: 128 });
    expect(fitSize(100, 50)).toEqual({ w: 100, h: 50 });
    expect(fitSize(0, 0)).toEqual({ w: 1, h: 1 });
  });
});
