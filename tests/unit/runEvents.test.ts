// Beta 0.6 E3b: the 104 new run events (FE-44 to FE-75, EN-60 to EN-131). Count, gating, fairness, no selling, the new
// flags and effect, and the spacing rule against story events.

import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import type { EventDef } from '../../src/core/contentSchema';
import { addEventStops, applyEffect, conditionMet, eligibleEvents, xflagHolds } from '../../src/core/events';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { getCampaign } from '../../src/core/regions';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const runEvents = (): EventDef[] => [...content.events.values()].filter((e) => e.id.startsWith('xr.'));
const mk = (seed: string, on = true): RunState => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(on ? { expansion: { eventsDensity: 'full' as const, worldTracks: true } } : {}) }), 0);
  return r;
};

describe('the 104 run events', () => {
  it('are 32 forced scenes (FE-44 to FE-75) and 72 encounters (EN-60 to EN-131), with unique ids', () => {
    const all = runEvents();
    expect(all).toHaveLength(104);
    const fe = all.filter((e) => e.id.startsWith('xr.fe-')).map((e) => Number(e.id.slice(6)));
    const en = all.filter((e) => e.id.startsWith('xr.en-')).map((e) => Number(e.id.slice(6)));
    expect(fe.sort((a, b) => a - b)).toEqual(Array.from({ length: 32 }, (_, i) => 44 + i));
    expect(en.sort((a, b) => a - b)).toEqual(Array.from({ length: 72 }, (_, i) => 60 + i));
    expect(new Set(all.map((e) => e.id)).size).toBe(104);
  });
  it('the generated file is current', () => {
    expect(() => execFileSync('node', ['tools/build-run-events.ts', '--check'], { stdio: 'pipe' })).not.toThrow();
  });
  it('never appear in a run without the saga on (old rolls and old stages untouched)', () => {
    const r = mk('re-off', false);
    expect(eligibleEvents(content, r).some((e) => e.id.startsWith('xr.'))).toBe(false);
    addEventStops(content, r);
    expect(r.stage!.map.nodes.some((n) => n.sides.some((s) => s.eventId?.startsWith('xr.')))).toBe(false);
  });
  it('wait for their Expanded flags: with every flag false only the general events are eligible', () => {
    const r = mk('re-flags');
    r.stage!.index = 3;
    const open = new Set(eligibleEvents(content, r).map((e) => e.id));
    const flagged = runEvents().filter((e) => e.requires.some((c) => c.kind === 'xflag' || (c.kind === 'track' && c.atLeast >= 1)));
    expect(flagged.length).toBeGreaterThan(40);
    for (const e of flagged) expect(open.has(e.id), e.id).toBe(false);
    expect(runEvents().filter((e) => open.has(e.id)).length).toBeGreaterThan(10);
  });
  it('every forced scene has two or more ways out, one of them with no fight', () => {
    for (const e of runEvents().filter((x) => x.group.startsWith('Forced'))) {
      expect(e.choices.length, e.id).toBeGreaterThanOrEqual(2);
      expect(e.choices.some((c) => !c.success.battle && !(c.failure?.battle)), e.id).toBe(true);
    }
  });
  it('no event sells, pays coins, gives EXP candy, ends a run or takes a Key Item or Data ROM', () => {
    const text = JSON.stringify(runEvents()).toLowerCase();
    expect(text).not.toMatch(/\bsell|\bsold\b|\bcoins?\b|exp(erience)? candy|rare-candy/);
    for (const e of runEvents()) for (const c of e.choices) for (const fx of [...c.success.effects, ...(c.failure?.effects ?? [])]) {
      expect(['tradeAway', 'recruit', 'mentor', 'gauntlet', 'tournament', 'crisis'].includes(fx.kind), `${e.id}:${fx.kind}`).toBe(false);
    }
  });
  it('no battle is above an Executive-sized party', () => {
    for (const e of runEvents()) for (const c of e.choices) {
      const b = c.success.battle;
      if (b && b.kind === 'trainer') expect(b.size ?? 2, e.id).toBeLessThanOrEqual(3);
    }
  });
});

describe('the Expanded flags', () => {
  it('read the run', () => {
    const r = mk('re-xflag');
    for (const f of ['extendedCut', 'hasShadow', 'keyHinted', 'grandArc', 'liaisonSeen', 'romHeld', 'friendPresent', 'trioFriendly', 'wesMet']) expect(xflagHolds(r, f), f).toBe(false);
    r.story.flags['ev:wes-met'] = 1;
    r.story.flags['ev:liaison-seen'] = 1;
    r.story.flags['ev:rocket-trio-debt'] = 1;
    expect(xflagHolds(r, 'wesMet') && xflagHolds(r, 'liaisonSeen') && xflagHolds(r, 'trioFriendly')).toBe(true);
    r.party[0]!.shadow = { heart: 60, named: 'ss.x', hints: 1 } as never;
    expect(xflagHolds(r, 'hasShadow') && xflagHolds(r, 'keyHinted')).toBe(true);
    r.expansion = { ...r.expansion, climaxCut: 'extended' };
    expect(xflagHolds(r, 'extendedCut')).toBe(true);
  });
  it('an event waits on its flag through conditionMet', () => {
    const r = mk('re-cond');
    const ev = content.events.get('xr.en-106')!;
    expect(ev.requires.every((c) => conditionMet(content, r, c))).toBe(false);
  });
});

describe('shadowHeart', () => {
  it('eases every party Shadow, never below 1, and ignores other Pokémon', () => {
    const r = mk('re-heart');
    const [a, b] = [r.party[0]!, { ...r.party[0]!, uid: 'x2' }];
    a.shadow = { heart: 10, hints: 1 } as never;
    b.shadow = { heart: 2, hints: 1 } as never;
    r.party = [a, b, { ...r.party[0]!, uid: 'x3', shadow: undefined }];
    applyEffect(content, r, { kind: 'shadowHeart', amount: -15 }, new Rng(hashSeed('h')));
    expect(r.party[0]!.shadow!.heart).toBe(1);
    expect(r.party[1]!.shadow!.heart).toBe(1);
    expect(r.party[2]!.shadow).toBeUndefined();
  });
});

describe('spacing against story events', () => {
  it('a run event is never on a column next to a story event', () => {
    for (let n = 0; n < 12; n++) {
      const r = mk(`re-space-${n}`);
      r.regionOrder[r.regionIndex] = 'kanto';
      r.expansion = { ...r.expansion, climaxCut: 'extended' };
      const stages = getCampaign(content, r.campaignId).stagesPerRegion;
      for (let i = 0; i < stages; i++) {
        r.stage!.index = i;
        r.stage!.map.nodes.forEach((x) => (x.sides = []));
        addEventStops(content, r);
        const stops = r.stage!.map.nodes.flatMap((x) => x.sides.filter((s) => s.eventId).map((s) => ({ id: s.eventId!, column: x.column })));
        const xe = stops.filter((s) => s.id.startsWith('xe.'));
        const xr = stops.filter((s) => s.id.startsWith('xr.'));
        for (const a of xe) for (const b of xr) if (Math.abs(a.column - b.column) <= 1 && stops.length < r.stage!.map.nodes.length) throw new Error(`xr ${b.id} beside xe ${a.id}, seed ${n}`);
      }
    }
  });
});
