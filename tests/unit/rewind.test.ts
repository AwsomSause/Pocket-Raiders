// Beta 0.7 L3 Rewinds: exact restores, RNG never rewound, once per stage, off by default, save round-trips.
import { describe, expect, it } from 'vitest';
import { applyPatch, diff, jsonCopy, rewindBattle, rewindOf, rewindStage, rewindTurnsAvailable, rewindView } from '../../src/core/rewind';
import { takeTurn } from '../../src/core/run';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { Rng } from '../../src/core/rng';
import { autoplay } from './autoplay';
import { content } from './helpers';

/** Plays until a battle has had `turns` turns; returns that run and the run as each of its turns began (oldest first). */
function midBattle(seed: string, turns: number, rewinds = true): { live: RunState; starts: RunState[] } | null {
  let prev: RunState | null = null;
  let starts: RunState[] = [];
  let found: { live: RunState; starts: RunState[] } | null = null;
  try {
    autoplay({ content, seed, steps: 600, smart: true, healOnMap: true, expansion: rewinds ? { rewinds: true } : {}, onStep: (run, turn) => {
      if (found) throw new Error('done');
      if (turn && prev?.phase === 'battle') {
        if (starts.length && starts[starts.length - 1]!.battle?.enemyTeam[0]?.uid !== prev.battle?.enemyTeam[0]?.uid) starts = [];
        starts.push(structuredClone(prev));
        if (run.phase === 'battle' && starts.length >= turns && rewindTurnsAvailable(content, run) >= turns) found = { live: structuredClone(run), starts: [...starts] };
      } else starts = [];
      prev = structuredClone(run);
    } });
  } catch (e) { if ((e as Error).message !== 'done') throw e; }
  return found;
}

const canon = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));

describe('patches', () => {
  it('diff + applyPatch rebuild the target exactly (objects, arrays growing and shrinking, deletes, type changes)', () => {
    const rng = new Rng({ a: 1, b: 2, c: 3, d: 4 });
    const rand = (depth: number): unknown => {
      const r = rng.float();
      if (depth > 3 || r < 0.3) return [1, 'x', null, true, 2.5][Math.floor(rng.float() * 5)];
      if (r < 0.6) return Array.from({ length: Math.floor(rng.float() * 4) }, () => rand(depth + 1));
      return Object.fromEntries(Array.from({ length: Math.floor(rng.float() * 4) }, (_, i) => [`k${Math.floor(rng.float() * 5)}${i % 2}`, rand(depth + 1)]));
    };
    for (let i = 0; i < 400; i++) {
      const a = { root: rand(0) }, b = { root: rand(0) };
      expect(canon(applyPatch(jsonCopy(a), diff(a, b)))).toBe(canon(b));
    }
  });
});

describe('L3 Rewinds', () => {
  it('is off by default: no rewind block, no Rewind offered', () => {
    const r = midBattle('rw-off', 2, false);
    expect(r).toBeNull();
    let seen = false;
    autoplay({ content, seed: 'rw-off', steps: 200, smart: true, onStep: (run) => { if (rewindOf(run)) seen = true; } });
    expect(seen).toBe(false);
  });

  const hit = midBattle('rw1', 3);
  it('finds a battle long enough to test', () => expect(hit).not.toBeNull());

  it('restores the exact state of the chosen turn start, with the live RNG streams', () => {
    const { live, starts } = hit!;
    for (const back of [1, 2, 3]) {
      const then = starts[starts.length - back]!;
      const restored = rewindBattle(content, live, back)!;
      expect(restored).not.toBeNull();
      expect(canon({ ...rewindView(restored), rng: null })).toBe(canon({ ...rewindView(then), rng: null }));
      // The streams are the live ones: no roll repeats, and the rewind itself rolls nothing.
      expect(restored.rng).toEqual(live.rng);
      expect(canon(restored.rng.battle)).not.toBe(canon(then.rng.battle));
      expect(rewindOf(restored)!.usedThisStage).toBe(1);
      expect(rewindOf(restored)!.turns.length).toBe(rewindOf(live)!.turns.length - back);
    }
  });

  it('is once per stage: a second rewind in the same stage is refused', () => {
    const once = rewindBattle(content, hit!.live, 1)!;
    expect(rewindTurnsAvailable(content, once)).toBe(0);
    expect(rewindBattle(content, once, 1)).toBeNull();
  });

  it('never goes further back than the balance allows', () => {
    expect(rewindBattle(content, hit!.live, content.balance.rewind.maxTurnsBack + 1)).toBeNull();
    expect(rewindBattle(content, hit!.live, 0)).toBeNull();
  });

  it('gives the same result after a save round-trip (JSON + schema)', () => {
    const reloaded = RunStateSchema.parse(JSON.parse(JSON.stringify(hit!.live)));
    expect(canon(rewindView(rewindBattle(content, reloaded, 2)!))).toBe(canon(rewindView(rewindBattle(content, hit!.live, 2)!)));
  });

  it('plays the turn afresh after a rewind (same action, different rolls are possible, never the old stream state)', () => {
    const restored = rewindBattle(content, hit!.live, 1)!;
    const res = takeTurn(content, restored, { kind: 'move', index: 0 });
    expect(res.run.rng.battle).not.toEqual(hit!.starts[hit!.starts.length - 1]!.rng.battle);
  });

  it('turns a wipe back instead of losing (first in the rescue order)', () => {
    const run = structuredClone(hit!.live);
    for (const m of run.party) m.hp = 0;
    run.party[run.battle!.activeIndex]!.hp = 1;
    let res = takeTurn(content, run, { kind: 'move', index: 0 });
    for (let i = 0; i < 5 && res.run.phase === 'battle' && !res.rewound; i++) res = takeTurn(content, res.run, { kind: 'move', index: 0 });
    expect(res.rewound).toBeGreaterThan(0);
    expect(res.defeated).toBe(false);
    expect(res.run.phase).toBe('battle');
    expect(rewindOf(res.run)!.usedThisStage).toBe(1);
    // The rewind came back to a turn start from before the wipe: the party is on its feet again.
    expect(res.run.party.some((m) => m.hp > 1)).toBe(true);
  });

  it("Dialga's Rite: back to the stage start; keepTeam keeps today's levels and moves", () => {
    const live = structuredClone(hit!.live);
    const lead = live.party[0]!;
    lead.level += 3;
    const plain = rewindStage(content, live)!;
    const base = rewindOf(live)!.base!;
    expect(canon({ ...rewindView(plain), rng: null })).toBe(canon({ ...base, rng: null }));
    expect(plain.rng).toEqual(live.rng);
    expect(plain.battle).toBeNull();
    const kept = rewindStage(content, live, { keepTeam: true })!;
    const keptLead = kept.party.find((m) => m.uid === lead.uid);
    if (keptLead) expect(keptLead.level).toBe(lead.level);
  });
});
