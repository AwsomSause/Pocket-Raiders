// DOMINION redesign R6, part 2: the rules behind the Clinic, Care time, Region Events, the Prize Corner and chapters
// (life.ts, life.json). Normal, boundary and failure cases; the same seed gives the same roll.
import { describe, expect, it } from 'vitest';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { careModel, chapterDue, chapterNow, clinicCost, eventPicks, regionEvent } from '../../src/core/dominion/life';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { maxHp } from '../../src/core/pokemon';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const L = DOMINION_DATA.life;
const start = (seed = 'life'): RunState => {
  const run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return out.run;
};
const blk = (r: RunState) => r.expansion!.dominion!;
const onDay = (r: RunState, day: number): RunState => {
  const x = structuredClone(r);
  blk(x).day = day;
  return x;
};

describe('life.json', () => {
  it('prizes and festival Pokémon exist in the game', () => {
    for (const p of L.coins.prizes) {
      if (p.species) expect(content.species.has(p.species), p.id).toBe(true);
      if (p.item) expect(content.catalog.has(p.item) || content.items.has(p.item), p.id).toBe(true);
    }
    for (const j of L.festival.jobs) if (j.mon) expect(content.species.has(j.mon)).toBe(true);
  });
});

describe('the Clinic', () => {
  it('prices by HP missing (5 a percent), heals one or all, and refuses when nobody needs it or money is short', () => {
    let r = start();
    expect(stepInRun(content, r, { t: 'clinic', uid: null }).ok).toBe(false);
    const mon = r.party[0]!;
    const max = maxHp(content, mon);
    r = structuredClone(r);
    r.party[0]!.hp = Math.round(max * 0.12);
    const cost = clinicCost(content, r.party[0]!);
    expect(cost).toBe(Math.ceil(((1 - r.party[0]!.hp / max) * 100 * L.clinic.perPct) / L.clinic.round) * L.clinic.round);
    blk(r).funds = cost - 1;
    const broke = stepInRun(content, r, { t: 'clinic', uid: mon.uid });
    expect(broke.ok).toBe(false);
    expect(broke.notice).toContain('Not enough money');
    blk(r).funds = cost + 100;
    const out = stepInRun(content, r, { t: 'clinic', uid: mon.uid });
    expect(out.ok).toBe(true);
    expect(out.run.party[0]!.hp).toBe(max);
    expect(blk(out.run).funds).toBe(100);
    // A fainted Pokémon costs the full price plus the fee.
    const f = structuredClone(r);
    f.party[0]!.hp = 0;
    expect(clinicCost(content, f.party[0]!)).toBe(100 * L.clinic.perPct + L.clinic.fainted);
  });
});

describe('Care time', () => {
  it('raises friendship once a day; a Puff costs money and counts as fed; a fainted one waits', () => {
    const r = start();
    const uid = r.party[0]!.uid;
    const f0 = r.party[0]!.friendship;
    const out = stepInRun(content, r, { t: 'care', uid, tool: 'puff' });
    expect(out.ok).toBe(true);
    expect(out.run.party[0]!.friendship).toBeGreaterThan(f0);
    expect(blk(out.run).funds).toBe(blk(r).funds - 100);
    const m = careModel(content, blk(out.run), out.run.party[0]!);
    expect(m.caredToday).toBe(true);
    expect(m.fed).toBe(L.care.lines.fedToday);
    const again = stepInRun(content, out.run, { t: 'care', uid, tool: 'brush' });
    expect(again.ok).toBe(false);
    expect(again.notice).toContain('Tomorrow');
    // The next day it can be cared for again.
    expect(stepInRun(content, onDay(out.run, blk(out.run).day + 1), { t: 'care', uid, tool: 'brush' }).ok).toBe(true);
    const ko = structuredClone(r);
    ko.party[0]!.hp = 0;
    expect(stepInRun(content, ko, { t: 'care', uid, tool: 'play' }).ok).toBe(false);
    expect(stepInRun(content, r, { t: 'care', uid, tool: 'nope' }).ok).toBe(false);
  });
});

describe('Region Events', () => {
  it('open on their days only, alternate festival and blackout, and close after one action', () => {
    const r = start();
    const E = L.events;
    expect(regionEvent(blk(onDay(r, E.first - 1)))).toBeNull();
    expect(regionEvent(blk(onDay(r, E.first)))!.kind).toBe(E.list[0]);
    expect(regionEvent(blk(onDay(r, E.first + E.lasts - 1)))).not.toBeNull();
    expect(regionEvent(blk(onDay(r, E.first + E.lasts)))).toBeNull();
    expect(regionEvent(blk(onDay(r, E.first + E.every)))!.kind).toBe(E.list[1 % E.list.length]);
    expect(stepInRun(content, onDay(r, E.first - 1), { t: 'regionEv', id: 'pickpocket' }).ok).toBe(false);

    const day = onDay(r, E.first);
    const picks = eventPicks(blk(day), regionEvent(blk(day))!);
    expect(picks.map((p) => p.id)).toEqual(L.festival.jobs.map((j) => j.id));
    for (const p of picks) expect(p.chance).toBeGreaterThanOrEqual(5);
    const a = stepInRun(content, day, { t: 'regionEv', id: 'stall' });
    const b = stepInRun(content, day, { t: 'regionEv', id: 'stall' });
    expect(a.ok).toBe(true);
    expect(a.roll).toEqual(b.roll);
    expect(a.roll!.chance).toBe(picks.find((p) => p.id === 'stall')!.chance);
    if (a.roll!.r <= a.roll!.chance) expect(blk(a.run).funds).toBe(blk(day).funds + 1400);
    else expect(blk(a.run).funds).toBe(blk(day).funds);
    expect(stepInRun(content, a.run, { t: 'regionEv', id: 'pickpocket' }).ok).toBe(false);
    // Letting it pass closes it too, and nothing else changes.
    const pass = stepInRun(content, day, { t: 'regionEv', id: null });
    expect(pass.ok).toBe(true);
    expect(blk(pass.run).funds).toBe(blk(day).funds);
    expect(stepInRun(content, pass.run, { t: 'regionEv', id: 'stall' }).ok).toBe(false);
  });

  it('a blackout: dark buildings get the bonus', () => {
    const r = onDay(start(), L.events.first + L.events.every);
    const ev = regionEvent(blk(r))!;
    expect(ev.kind).toBe('blackout');
    const picks = eventPicks(blk(r), ev);
    const dark = picks.filter((p) => p.dark);
    expect(dark.length).toBeGreaterThan(0);
    expect(picks.find((p) => p.id === 'corner')!.dark).toBe(false);
  });
});

describe('the Prize Corner', () => {
  it('buys coins, trades them for a prize, and swaps once a day', () => {
    let r = start();
    blk(r).funds = 30_000;
    for (let i = 0; i < 24; i++) {
      const o = stepInRun(content, r, { t: 'prize', op: 'buy' });
      expect(o.ok).toBe(true);
      r = o.run;
    }
    expect(blk(r).life!.coins).toBe(1200);
    expect(stepInRun(content, r, { t: 'prize', op: 'trade', id: 'amulet-coin' }).ok).toBe(false);
    const candy = r.inventory['rare-candy'] ?? 0;
    const t = stepInRun(content, r, { t: 'prize', op: 'trade', id: 'rare-candy' });
    expect(t.ok).toBe(true);
    expect(t.run.inventory['rare-candy']).toBe(candy + 1);
    expect(blk(t.run).life!.coins).toBe(0);
    const s = stepInRun(content, t.run, { t: 'prize', op: 'swap', id: 'dratini' });
    expect(s.ok).toBe(true);
    expect(s.roll).not.toBeNull();
    expect(stepInRun(content, s.run, { t: 'prize', op: 'swap', id: 'dratini' }).ok).toBe(false);
  });
});

describe('chapters', () => {
  it('no card at the start (the opening is chapter 1); founding brings chapter 2, and reading it clears it', () => {
    const r = start();
    expect(chapterNow(blk(r)).n).toBe(1);
    expect(chapterDue(blk(r))).toBeNull();
    expect(stepInRun(content, r, { t: 'chapter' }).ok).toBe(false);
    const named = structuredClone(r);
    blk(named).teamName = 'Team Nova';
    expect(chapterDue(blk(named))!.n).toBe(2);
    expect(chapterDue(blk(named))!.line).toContain('Kanto');
    const read = stepInRun(content, named, { t: 'chapter' });
    expect(read.ok).toBe(true);
    expect(chapterDue(blk(read.run))).toBeNull();
    // Notoriety high enough skips straight to the latest chapter.
    const big = structuredClone(read.run);
    blk(big).empire = { ...(blk(big).empire ?? { week: {}, weeks: [], press: false, visits: [], holders: [], collect: {}, guarded: [] }), peak: 6 } as never;
    expect(chapterDue(blk(big))!.title).toBe('The Siege');
  });
});
