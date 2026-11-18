// Evil Mode slice 15, "the endings" (build plan section 3; design Part 23 and Part 22's Finales). Proves: every ending
// is reachable (by the simulator's autoplayer from a fixture); exactly one ending per run, in the order the design sets;
// every ending pays the same for the same distance; the count's arithmetic on five fixtures, one per band; minors' cards
// read "Home" in every ending; no text ranks endings; the profile is written once, with one field (Profile v21).

import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { foundForPlay, playRegion } from '../../src/core/evilMode/autoplay';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { step } from '../../src/core/evilMode/day';
import {
  bandOf, checkEndings, countSteps, countTotal, currentScene, endingCards, endingPay, endingScenes, hallCard, heirs, ledgerPage,
  pressable, startEnding, yearOn,
} from '../../src/core/evilMode/endings';
import { appendLog } from '../../src/core/evilMode/ledger';
import { roadChoice, roadModel } from '../../src/core/evilMode/roadScreens';
import { finishEvil } from '../../src/core/evilMode/session';
import { ENDING_IDS, EvilModeBlockSchema, type EndingId, type EvilModeBlock, type Venture } from '../../src/core/evilMode/schema';
import type { FoundingChoice } from '../../src/core/evilMode/start';
import { createProfile, finalizeRun } from '../../src/core/profile';
import { CURRENT_VERSIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { chooseStarter, createRun } from '../../src/core/run';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { EVIL_MODE_ID, foundInRun } from '../../src/core/evilMode/session';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto', ...over });
/** Slice 16: three regions are written, so these fixtures play Kanto as the run's third (last) region. */
const asLast = (b: EvilModeBlock): EvilModeBlock => ({ ...b, region: { ...b.region, crossed: ['johto', 'hoenn'] } });
const fresh = (seed = 'end-1', over: Partial<FoundingChoice> = {}): EvilModeBlock => asLast(foundForPlay(seed, choice(over)));
/** Plays an ending already begun to its last page (the autoplayer: first choice that moves it, battles lost). */
const finish = (b: EvilModeBlock): EvilModeBlock => {
  const r = playRegion(b, 'mix');
  expect(r.block.ending?.done, `${b.ending?.id} stalled`).toBe(true);
  return r.block;
};
const atNight = (b: EvilModeBlock): EvilModeBlock => ({ ...b, here: { ...b.here, beat: 'night' } });
const front = (i: number): Venture => ({ id: `v${i}`, cardId: 'front-cafe', kind: 'front', region: 0, district: 1, street: null, holdingId: null, person: null, since: 1, patience: null, waivedOn: null, honest: true, books: false, backRoom: false, openIn: [], straight: ['0:1'], doneOn: null, done: false });
const officers = (b: EvilModeBlock, loyalty = 8): EvilModeBlock => ({ ...b, crew: b.crew.map((c, i) => ({ ...c, loyalty, rank: i === 0 ? 'officer' : c.rank })) });

/** One fixture per ending, each begun the way the game begins it. */
function begun(id: EndingId, seed = 'end-1'): EvilModeBlock {
  const b = fresh(seed);
  if (id === 'lastRoom') return playRegion(b, 'mix').block;
  if (id === 'caught') return step({ ...b, team: { ...b.team, heat: 6 } }, { type: 'endPress', what: 'walkIn' }).block;
  if (id === 'straight') {
    const s = atNight({ ...b, team: { ...b.team, regard: 8 }, economy: { ...b.economy, running: [front(1), front(2), front(3)] } });
    return step(s, { type: 'endPress', what: 'straight' }).block;
  }
  if (id === 'handOff') {
    // One region written: the Hand-Off needs Region 2, so it's reachable here only by fixture (the plan's limit).
    const h = atNight(officers({ ...b, here: { ...b.here, region: 1 } }));
    return step(h, { type: 'endPress', what: 'handOff', heir: heirs(h)[0]!.id, line: 'Mind the kettle.' }).block;
  }
  if (id === 'scheme') {
    const after = { ...b, scheme: { ...b.scheme, moment: { ...b.scheme.moment, came: 'ready' as const } } };
    return checkEndings(b, after);
  }
  // The Recruit: the last room talked, the Hero offered, a Prodigy who was never lied to (by fixture: the plan's limit).
  const room = { open: 'x', speech: [], lines: [], asked: true, offered: true, shown: [], answer: null, outcome: 'talked' as const, stepped: null };
  const before = { ...b, hero: { ...b.hero!, personality: 'prodigy' as const, temper: 0 } };
  const after = { ...before, region: { ...before.region, phase: 'over' as const }, reck: { region: 0, lastDay: null, gone: 0, night: [], gate: [], walk: [], seen: [], room } };
  return checkEndings(before, after);
}

describe('every ending is reachable, and plays to its last page', () => {
  for (const id of ENDING_IDS) {
    it(`${id}: begins, plays every scene to the end, and the run then ends`, () => {
      const b = begun(id);
      expect(b.ending?.id).toBe(id);
      const done = finish(b);
      expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(done)))).toEqual(done);
      expect(endingScenes(done).length).toBeGreaterThan(0);
      expect(ledgerPage(done).length).toBeGreaterThan(0);
      // Once it's done nothing moves; the run-end page follows.
      expect(step(done, { type: 'endAct' }).ok).toBe(false);
      expect(step(done, { type: 'endTurn' } as never).ok).toBe(false);
    });
  }
  it('Kanto, the only region written, ends at the Last Room (the simulator reaches it on its own)', () => {
    const r = playRegion(fresh('end-kanto'), 'richest');
    expect(r.finished).toBe(true);
    expect(r.block.ending).toMatchObject({ id: 'lastRoom', done: true });
  });
});

describe('the order, and one ending a run', () => {
  it('a Raid with no back way beats a pressed button: once one has begun, nothing presses another', () => {
    const caught = begun('caught');
    expect(step(atNight(caught), { type: 'endPress', what: 'straight' }).ok).toBe(false);
    expect(pressable(caught)).toEqual([]);
    expect(checkEndings(caught, { ...caught, region: { ...caught.region, phase: 'over' } }).ending!.id).toBe('caught');
  });
  it('the Scheme and the Last Room only in the last region; the Hand-Off from Region 2; Caught anywhere', () => {
    const b = fresh();
    const twoRegions = { ...b, settings: { ...b.settings, length: 'three' as const } };
    const ready = { ...twoRegions, scheme: { ...twoRegions.scheme, moment: { ...twoRegions.scheme.moment, came: 'ready' as const } } };
    // Kanto played as the run's last region: the Scheme begins. In the first region it doesn't, and there's no Hand-Off yet.
    expect(checkEndings(twoRegions, ready).ending?.id).toBe('scheme');
    const first = { ...twoRegions, region: { ...twoRegions.region, crossed: [] } };
    expect(checkEndings(first, { ...ready, region: first.region }).ending).toBeNull();
    expect(pressable(atNight(officers(first))).find((p) => p.what === 'handOff')!.problem).toBe(EVIL_DATA.endings.handOff.not.region);
    expect(step({ ...b, team: { ...b.team, heat: 6 } }, { type: 'endPress', what: 'walkIn' }).block.ending?.id).toBe('caught');
    expect(step({ ...b, team: { ...b.team, heat: 5 } }, { type: 'endPress', what: 'walkIn' }).ok).toBe(false);
  });
  it('Going Straight never at Whatever it takes, at Corruption above 0, with too few straight Fronts, or by day', () => {
    const b = { ...fresh(), team: { ...fresh().team, regard: 8 }, economy: { ...fresh().economy, running: [front(1), front(2), front(3)] } };
    const ok = (x: EvilModeBlock) => step(x, { type: 'endPress', what: 'straight' }).ok;
    expect(ok(atNight(b))).toBe(true);
    expect(ok(b)).toBe(false);
    expect(ok(atNight({ ...b, team: { ...b.team, line: 'whatever' } }))).toBe(false);
    expect(ok(atNight({ ...b, team: { ...b.team, corruption: 1 } }))).toBe(false);
    expect(ok(atNight({ ...b, economy: { ...b.economy, running: [front(1), front(2)] } }))).toBe(false);
    expect(ok(atNight({ ...b, economy: { ...b.economy, running: [front(1), front(2), { ...front(3), backRoom: true }] } }))).toBe(false);
  });
  it('the heir list never includes a minor or anyone under Loyalty 5', () => {
    const b = officers({ ...fresh(), here: { ...fresh().here, region: 1 } });
    const crew = b.crew.map((c, i) => (i === 0 ? { ...c, minor: true } : i === 1 ? { ...c, loyalty: 4, rank: 'officer' as const } : c));
    const list = heirs({ ...b, crew });
    expect(list.some((c) => c.minor || c.loyalty < 5)).toBe(false);
  });
  it('an ending begun is applied once: a reload and the same step never begin a second', () => {
    const b = begun('caught');
    const again = EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)));
    expect(again.applied.filter((a) => a.startsWith('ending:'))).toHaveLength(1);
    expect(checkEndings({ ...again, ending: null }, { ...again, ending: null, region: { ...again.region, phase: 'over' } }).ending).toBeNull();
  });
});

describe('what every ending has', () => {
  it('every ending pays the same for the same distance', () => {
    const b = fresh('pay');
    const pays = ENDING_IDS.map((id) => endingPay(startEnding(b, id, 'test', null)).total);
    expect(new Set(pays).size).toBe(1);
    expect(endingPay({ ...b, region: { ...b.region, crossed: [...b.region.crossed, 'sinnoh'] } }).total).toBeGreaterThan(pays[0]!);
  });
  it("a minor's card reads Home in every ending", () => {
    const b = fresh('minor');
    const crew = b.crew.map((c, i) => (i === 0 ? { ...c, minor: true } : c));
    for (const id of ENDING_IDS) {
      const e = { ...b, crew, ending: { id, sub: null, via: 'test', day: 1, region: 0, step: 0, picks: {}, heir: null, done: true } };
      expect(yearOn(e, crew[0]!)).toContain('Home');
    }
  });
  it('no text ranks endings: the names, the cards and the last page carry none of the banned words', () => {
    const banned = new RegExp(`\\b(${EVIL_DATA.endings.banned.join('|')})\\b`, 'i');
    for (const n of Object.values(EVIL_DATA.endings.names)) expect(n).not.toMatch(banned);
    for (const id of ENDING_IDS) {
      const done = finish(begun(id));
      for (const c of endingCards(done)) expect(`${c.title} ${c.line}`, `${id} card`).not.toMatch(/\b(evil wins|good wins|villain)\b/i);
      for (const l of ledgerPage(done)) expect(l, `${id} page`).not.toMatch(/\b(evil wins|villain)\b/i);
      expect(endingCards(done).length).toBeLessThanOrEqual(14);
    }
  });
  it('the screens: each scene on show is answered by an id the step takes; the last page offers the run-end page', () => {
    let b = begun('caught');
    for (let i = 0; i < 80 && !b.ending!.done; i++) {
      const m = roadModel(b)!;
      expect(m.mode).toBe('ending');
      const c = m.choices[0]!;
      const a = roadChoice(c.id, '')!;
      const r = step(b, m.own ? { type: 'endAct', text: '' } : a);
      expect(r.ok, c.id).toBe(true);
      b = r.block;
    }
    expect(roadModel(b)!.choices.map((c) => c.id)).toEqual(['endDone']);
  });
});

describe('Caught: the count (section 7.6), five fixtures, one per band', () => {
  const listed = (b: EvilModeBlock, n: number): EvilModeBlock => {
    let out = b;
    for (let i = 0; i < n; i++) out = appendLog(out, { kind: 'job', who: [], method: 'lean', result: 'went', text: `Leaned on a shop, ${i}.` });
    return out;
  };
  it('each list item adds one, walking in takes two, and the band follows the total (a half rounds up)', () => {
    const b = fresh('count');
    const base = countTotal(countSteps(b, 'raided'));
    expect(countTotal(countSteps(b, 'walkedIn'))).toBe(base - EVIL_DATA.endings.rules.walkInOff);
    expect(countTotal(countSteps(b, 'walkedInLedger'))).toBe(base - EVIL_DATA.endings.rules.walkInOff - EVIL_DATA.endings.rules.ledgerOff);
    const bands = EVIL_DATA.endings.caught.bands;
    const targets = [0, 2, 5, 10, 15];
    targets.forEach((t, i) => {
      const n = Math.max(0, t - Math.ceil(base));
      const fx = listed(b, n);
      const total = countTotal(countSteps(fx, 'raided'));
      expect(total).toBe(base + n);
      expect(countSteps(fx, 'raided').filter((s) => s.delta === 1 && s.line.includes('Leaned')).length).toBe(n);
      if (Math.ceil(base) <= t) expect(bandOf(total)).toBe(bands[i]);
    });
    expect(bandOf(0.5)).toBe(bands[1]);
  });
  it('minors are never called as witnesses', () => {
    const b = fresh('count-minor');
    const crew = b.crew.map((c, i) => (i === 0 ? { ...c, minor: true } : c));
    const steps = countSteps({ ...b, crew }, 'raided');
    expect(steps.some((s) => s.line.includes(crew[0]!.name) && s.delta !== 0)).toBe(false);
  });
});

describe('the Hall of Fame card (Profile v21): written once, one field', () => {
  const evilRun = () => {
    const r0 = chooseStarter(content, createRun(content, { runId: 'hall', seed: 'hall', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
    const f = foundInRun(r0, choice(), 'three', 2);
    if (f.problem) throw new Error(f.problem);
    const block = finish(begun('caught', 'hall'));
    return { ...f.run, expansion: { ...f.run.expansion, evilMode: block } };
  };
  it('finishing ends the run; the profile gains exactly one card, and a second finalize writes nothing', () => {
    const run = finishEvil(evilRun())!;
    expect(run.phase).toBe('over');
    const p0 = createProfile(content, 'p');
    const { profile, applied } = finalizeRun(content, p0, run, '2026-11-17T00:00:00Z');
    expect(applied).toBe(true);
    expect(profile.evilHall).toHaveLength(1);
    expect(profile.evilHall[0]).toEqual(hallCard(run.expansion!.evilMode!, 'hall', '2026-11-17'));
    expect(finalizeRun(content, profile, run).profile.evilHall).toHaveLength(1);
    // One field: the rest of what an Evil Mode run adds is the ordinary run-end bookkeeping, as before this slice.
    const without = finalizeRun(content, p0, { ...run, expansion: { ...run.expansion, evilMode: { ...run.expansion!.evilMode!, ending: null } } }, '2026-11-17T00:00:00Z').profile;
    const { evilHall: a, ...restA } = profile;
    const { evilHall: b, ...restB } = without;
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(0);
    expect(restA).toEqual(restB);
  });
  it('an ending not yet read to its end cannot finish the run', () => {
    const r = evilRun();
    expect(finishEvil({ ...r, expansion: { ...r.expansion, evilMode: begun('caught', 'hall') } })).toBeNull();
  });
  it('a version 20 profile loads with an empty Hall of Fame; the version is 21', () => {
    expect(CURRENT_VERSIONS.profile).toBe(21);
    const storage = new MemoryStorageProvider();
    const { evilHall: _h, ...old } = createProfile(content, 'old');
    storage.set('pkr.profile', JSON.stringify({ format: 'pkmn-roguelike', record: 'profile', schemaVersion: 20, savedAt: '', data: old }));
    const { profile, warning } = new SaveManager(storage, content).loadOrCreateProfile(() => 'new');
    expect(warning).toBeUndefined();
    expect(profile.profileId).toBe('old');
    expect(profile.evilHall).toEqual([]);
  });
});

describe('saves: block v14', () => {
  it('v13 -> v14: no ending begun; an ending saved mid-scene loads at the same scene', () => {
    const b = fresh();
    const { ending: _e, ...old } = b;
    const out = EvilModeBlockSchema.parse(JSON.parse(JSON.stringify({ ...old, v: 13 })));
    expect(out).toMatchObject({ v: 15, ending: null });
    const mid = step(begun('caught'), { type: 'endAct' }).block;
    const again = EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(mid)));
    expect(currentScene(again)).toEqual(currentScene(mid));
  });
});
