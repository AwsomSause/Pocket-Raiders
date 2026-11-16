// Catalog Overhaul Pack (legends, row C): the calendar and odds weeks (core/co/weeks.ts, gameEvents.json), the Shadow chain plugged
// into the Shadow system (co-legends-13.json, core/co/shadowChain.ts) and the Reputation readout (karma-echo).
import { describe, expect, it } from 'vitest';
import { planCoStage, readPlacement, type CoEntry } from '../../src/core/co/placement';
import { purifyShadow } from '../../src/core/co/shadowChain';
import { rivalInPseudo, WEEK_RIVAL_EVENT, weekFlags } from '../../src/core/co/weeks';
import { enterPseudoStage, PSEUDO } from '../../src/core/dungeon/pseudo';
import { chooseEvent } from '../../src/core/events';
import { blessingLegend } from '../../src/core/legends/signs';
import { chooseStarter, createRun } from '../../src/core/run';
import { makeShadow } from '../../src/core/shadow';
import type { RunState } from '../../src/core/state';
import status from '../../src/data/catalogOverhaul/status/legends.json';
import { content } from './helpers';

const ROW_C = ['shadow-black-market', 'shadow-lieutenant', 'shadow-outbreak', 'shadow-purified', 'shadow-sanctuary', 'shadow-sighting', 'shadow-stabilize', 'shadow-stronghold', 'shadow-triad', 'karma-echo', 'rivalry-week', 'gym-circuit', 'raid-rally', 'dragon-week', 'champions-gauntlet', 'legendary-beasts-chase', 'plasma-operation', 'tower-of-legends', 'world-boss-week', 'paradox-tide-week', 'gym-rematch-week', 'elite-four-sweep', 'champion-cup-weekend', 'team-rocket-invasion', 'aqua-magma-showdown', 'galactic-machination', 'flare-experiment', 'aether-rescue', 'mega-evolution-showcase', 'roadside-rival-week', 'mega-stone-hunt', 'leap-day-special'];
const WEEKS = ROW_C.slice(10);

const start = (seed: string, gameEvents: string[] = [], expansion: Parameters<typeof createRun>[1]['expansion'] = undefined): RunState =>
  structuredClone(chooseStarter(content, createRun(content, { runId: 'wk', seed, archetypeId: 'red', gameEvents, ...(expansion ? { expansion } : {}) }), 0));
const f = (run: RunState, key: string) => Number(run.story.flags[`ev:${key}`] ?? 0);

function at(run: RunState, eventId: string): RunState {
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: `x-${eventId}`, kind: 'event', used: false, eventId } as never);
  return run;
}
const pick = (run: RunState, eventId: string, choice: number) => chooseEvent(content, at(run, eventId), `x-${eventId}`, choice);

describe('row C status', () => {
  it('every row C id is recorded: the Shadow chain and karma-echo rebuilt, the weeks as rules', () => {
    const s = status as { built: Record<string, string>; rule: Record<string, string> };
    for (const id of ROW_C.slice(0, 10)) expect(s.built[id], id).toBeDefined();
    for (const id of WEEKS) expect(s.rule[id], id).toBeDefined();
  });
  it('every week names a live game event and features only live, enabled map events', () => {
    for (const id of WEEKS) {
      const week = content.gameEvents.get(id);
      expect(week, id).toBeDefined();
      for (const e of week!.mapEvents) expect(content.events.get(e)?.disabled, `${id} -> ${e}`).not.toBe(true);
    }
  });
  it('evil-team weeks focus their team; Z and Mega weeks feature the Anomaly openings', () => {
    const focus = (id: string) => content.gameEvents.get(id)!.modifiers.flatMap((m) => (m.kind === 'evilTeamFocus' ? m.teams : []));
    expect(focus('plasma-operation')).toEqual(['plasma']);
    for (const id of ['team-rocket-invasion', 'aqua-magma-showdown', 'galactic-machination', 'flare-experiment', 'aether-rescue']) expect(focus(id).length, id).toBeGreaterThan(0);
    for (const id of ['mega-evolution-showcase', 'mega-stone-hunt', 'z-move-trial']) expect(content.gameEvents.get(id)!.mapEvents).toEqual(expect.arrayContaining(['co-m1-absol', 'co-z3-cave']));
  });
});

describe('week run flags (Rivalry weeks)', () => {
  it('a Rivalry week opens the Rival Circuit and marks the week; other runs are untouched', () => {
    for (const id of ['rivalry-week', 'roadside-rival-week']) {
      const run = start('rw', [id]);
      expect(f(run, 'circuit-qualified'), id).toBe(1);
      expect(f(run, 'rivalry-week'), id).toBe(1);
    }
    const plain = start('rw');
    expect(f(plain, 'circuit-qualified')).toBe(0);
    expect(f(plain, 'rivalry-week')).toBe(0);
  });
  it('never lowers a flag that is already higher', () => {
    const run = start('rw');
    run.story.flags['ev:circuit-qualified'] = 3;
    run.perkEffects = [{ kind: 'startFlag', key: 'circuit-qualified', value: 1 }];
    weekFlags(run);
    expect(f(run, 'circuit-qualified')).toBe(3);
  });
  it('the rival waits in a pseudo-stage only during the week and once a rival is met, never in the boss room', () => {
    const rec = PSEUDO.records[0]!;
    const run = start('rw', ['rivalry-week']);
    run.story.rivals[0] = { ...run.story.rivals[0]!, encounters: 1 } as never;
    enterPseudoStage(content, run, rec.id);
    const sides = run.stage!.map.nodes.filter((n) => n.sides.some((s) => s.eventId === WEEK_RIVAL_EVENT));
    expect(sides.length).toBe(1);
    expect(sides[0]!.ace).not.toBe(true);
    rivalInPseudo(content, run); // a second call adds nothing
    expect(run.stage!.map.nodes.flatMap((n) => n.sides).filter((s) => s.eventId === WEEK_RIVAL_EVENT).length).toBe(1);
    const fresh = start('rw', ['rivalry-week']);
    for (const r of fresh.story.rivals) r.encounters = 0;
    enterPseudoStage(content, fresh, rec.id);
    expect(fresh.stage!.map.nodes.some((n) => n.sides.some((s) => s.eventId === WEEK_RIVAL_EVENT))).toBe(false);
    const off = start('rw');
    off.story.rivals[0] = { ...off.story.rivals[0]!, encounters: 1 } as never;
    enterPseudoStage(content, off, rec.id);
    expect(off.stage!.map.nodes.some((n) => n.sides.some((s) => s.eventId === WEEK_RIVAL_EVENT))).toBe(false);
  });
  it('the rival scene is never drawn at random', () => {
    expect(content.events.get(WEEK_RIVAL_EVENT)?.room).toBe(true);
  });
});

describe('Legend weeks (Paradox Tide, Leap Day)', () => {
  it('Paradox Tide raises a Dialga blessing\'s starting Influence by exactly 1', () => {
    let seed = '';
    for (let i = 0; i < 400 && !seed; i++) if (blessingLegend(start(`px${i}`, [], { blessings: true })) === 'dialga') seed = `px${i}`;
    expect(seed).not.toBe('');
    const base = start(seed, [], { blessings: true }).expansion!.blessing!.influence;
    expect(start(seed, ['paradox-tide-week'], { blessings: true }).expansion!.blessing!.influence).toBe(base + 1);
  });
  it('Paradox Tide leaves an unmatched blessing alone', () => {
    let seed = '';
    for (let i = 0; i < 400 && !seed; i++) {
      const l = blessingLegend(start(`py${i}`, [], { blessings: true }));
      if (l && l !== 'dialga') seed = `py${i}`;
    }
    const base = start(seed, [], { blessings: true }).expansion!.blessing!.influence;
    expect(start(seed, ['paradox-tide-week'], { blessings: true }).expansion!.blessing!.influence).toBe(base);
  });
  it('Leap Day gives one free Telling when Mythical Promises are on', () => {
    const told = (run: RunState) => Object.values(run.expansion?.promise?.tellings ?? {}).reduce((a, b) => a + b, 0);
    expect(told(start('lp', [], { mythicalPromises: true }))).toBe(0);
    expect(told(start('lp', ['leap-day-special'], { mythicalPromises: true }))).toBe(1);
    expect(told(start('lp', ['leap-day-special']))).toBe(0);
  });
});

describe('odds weeks: featured openings win the stage budget', () => {
  it('a featured entry is placed first in its tier; with no week the order is unchanged', () => {
    const run = start('od');
    const map = run.stage!.map;
    const entries: CoEntry[] = Array.from({ length: 20 }, (_, i) => ({ id: `e${i}`, p: readPlacement({ shape: 'Single' }), door: false }));
    const plain = planCoStage(map, entries, 'seed').map((x) => x.id);
    const left = entries.map((e) => e.id).find((id) => !plain.includes(id))!;
    expect(left).toBeDefined();
    const boosted = planCoStage(map, entries, 'seed', undefined, new Set([left])).map((x) => x.id);
    expect(boosted[0]).toBe(left);
    expect(planCoStage(map, entries, 'seed', undefined, new Set())).toEqual(planCoStage(map, entries, 'seed'));
  });
});

describe('the Shadow chain', () => {
  const shadowLead = (seed: string, heart = 40): RunState => {
    const run = start(seed);
    run.party.push(structuredClone(run.party[0]!));
    run.party[1]!.uid = `${run.party[1]!.uid}-b`;
    makeShadow(run.party[0]!, heart);
    return run;
  };
  it('The Haze Lifts purifies a party Shadow Pokémon for good', () => {
    const run = pick(shadowLead('sp'), 'shadow-purified', 0).run;
    expect(run.party.some((m) => m.shadow)).toBe(false);
  });
  it('purifyShadow skips a Pokémon that is not ready and does nothing without one', () => {
    const run = shadowLead('sp', 90);
    expect(purifyShadow(content, run, 50)).toBe('');
    expect(run.party[0]!.shadow?.heart).toBe(90);
    expect(purifyShadow(content, start('sp'), 100)).toBe('');
  });
  it('Steadying the Shadow soothes the Heart Gauge', () => {
    const run = pick(shadowLead('st', 40), 'shadow-stabilize', 0).run;
    expect(run.party.find((m) => m.shadow)!.shadow!.heart).toBe(30);
  });
  it('Reclaim: a Shadow left at the Sanctuary comes back purified, once', () => {
    let run = pick(shadowLead('rc'), 'shadow-sanctuary', 3).run;
    expect(run.coAway?.some((a) => a.key === 'shadow-sanctuary-ward')).toBe(true);
    expect(run.party.some((m) => m.shadow)).toBe(false);
    run = pick(run, 'shadow-purified', 1).run;
    expect(run.coAway?.some((a) => a.key === 'shadow-sanctuary-ward')).toBe(false);
    expect(run.party.length + run.box.length).toBeGreaterThanOrEqual(2);
    expect([...run.party, ...run.box].some((m) => m.shadow)).toBe(false);
    expect(f(run, 'sanctuary-reclaimed')).toBe(1);
  });
  it('the chain feeds the Shadow world: sightings raise activity, the stronghold lets the Lieutenant loose', () => {
    expect(f(pick(start('sw'), 'shadow-sighting', 0).run, 'shadow-activity')).toBe(1);
    const run = start('sw');
    run.story.flags['ev:shadow-activity'] = 2;
    const after = pick(run, 'shadow-stronghold', 1);
    expect(after.battle).toBe(true);
    const win = content.events.get('shadow-stronghold')!.choices[1]!.success.battle!.win;
    expect(win.some((e) => e.kind === 'flag' && e.key === 'lieutenant-loose')).toBe(true);
  });
  it('the Lieutenant\'s Shadow Pokémon is offered, never forced; Shadow Triad waits for Team Plasma', () => {
    const win = content.events.get('shadow-lieutenant')!.choices[0]!.success.battle!.win;
    expect(win.some((e) => e.kind === 'join' && e.shadow && !('direct' in e && e.direct))).toBe(true);
    expect(content.events.get('shadow-triad')!.requires).toEqual([expect.objectContaining({ kind: 'evil', team: 'plasma' })]);
  });
});

describe('the Reputation readout (karma-echo)', () => {
  it('reads the run\'s record back with its numbers', () => {
    const run = start('ke');
    run.story.flags['ev:rep'] = 4;
    run.story.flags['ev:kind-total'] = 6;
    const res = pick(run, 'karma-echo', 0);
    expect(res.text).toContain('4 good turns');
    expect(res.text).toContain('6 kindnesses');
    const low = start('ke');
    low.story.flags['ev:rep-lost'] = 3;
    expect(pick(low, 'karma-echo', 0).text).toContain('3 bad turns');
  });
});
