// DOMINION slice D11: the Hero (plans/evil-mode-rework BUILD_SLICES.md): who the Hero is (Q1/Q5), Threat and its five
// stages, the m11 interrupt (battle / run / Smoke Ball), encounter cards (O166-O185), the Legendaries, adapting, the
// hidden Disillusion, the final stand and recruiting the Hero, the five Hero actions and their gates, saves.
import { describe, expect, it } from 'vitest';
import { withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { actionDef, actionStatus, card } from '../../src/core/dominion/field';
import { beginDominionFight } from '../../src/core/dominion/fight';
import { dominionCatchBlock, endDominionFight } from '../../src/core/dominion/fightEnd';
import { activeLegends, afterStand, callFinalStand, heroAt, heroFor, heroOf, stageIndex, threatOf } from '../../src/core/dominion/hero';
import { heroModel, interruptModel } from '../../src/core/dominion/heroScreens';
import { ledgerModel } from '../../src/core/dominion/ledgerScreens';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const H = DOMINION_DATA.hero;
const domRun = (seed = 'dh', trainer = 'red'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: trainer, rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dh', trainer = 'red'): RunState => {
  const out = startInRun(content, domRun(seed, trainer), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return out.run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, out.notice ?? '').toBe(true);
  return out.run;
};
const answerAll = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
/** Evening -> Night -> Morning (the World Turn ran). */
const night = (r: RunState): RunState => answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' }));
/** Day 2, the Day phase. */
const day = (seed?: string, trainer?: string): RunState => go(night(go(started(seed, trainer), { t: 'open' })), { t: 'toDay' });
const edit = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withCrew(structuredClone(blk(r)));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const act = (action: string, target: string | null, district: string): DominionAction => ({ t: 'act', action, target, district, bring: [] });
const weekOf = (d: number): number => Math.floor((d - 1) / DOMINION_DATA.start.clock.weekLength) + 1;
/** Arms this week's foil for today (Threat 30, stage FOILS). */
const armed = (r: RunState): RunState => edit(r, (b) => {
  const h = heroOf(b);
  Object.assign(h, { threat: 30, stage: 1, foilWeek: weekOf(b.day), foilDay: b.day, foiled: false });
});

describe('DOMINION D11: who the Hero is (Q1, Q5)', () => {
  it('Kanto has its Heroes, path, allies and three Legendaries that are real species', () => {
    const k = H.regions.kanto!;
    expect(k.legends.map((l) => l.id)).toEqual(['moltres', 'zapdos', 'articuno']);
    for (const l of k.legends) expect(content.species.has(l.id)).toBe(true);
    expect(k.path!.length).toBeGreaterThanOrEqual(9);
    expect(H.encounters.rows.map((e) => e.id)).toEqual(Array.from({ length: 20 }, (_, i) => `O${166 + i}`));
    expect(H.threat.stages.map((s) => s.min)).toEqual([0, 25, 45, 65, 80]);
  });
  it('Q5: when the Boss is the region\'s Hero, the rival plays the Hero (an evolved trainer counts too)', () => {
    expect(heroFor('kanto', 'red', 's')).toBe('blue');
    expect(heroFor('kanto', 'evolved-red', 's')).toBe('blue');
    expect(heroFor('kanto', 'nate', 's')).toBe('red');
    expect(heroFor('unova', 'hilda', 's')).toBe(H.regions.unova!.standIn.hilda);
    expect(blk(started()).hero!.id).toBe('blue');
    expect(blk(started('dh', 'nate')).hero!.id).toBe('red');
  });
  it('a save from before D11 (no `hero`) loads, and the first step gives it a Hero', () => {
    const r = go(started(), { t: 'open' });
    const old = structuredClone(r);
    delete old.expansion!.dominion!.hero;
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(old);
    const back = new SaveManager(storage, content).loadRun();
    expect(back.status).toBe('ok');
    if (back.status !== 'ok') return;
    expect(blk(back.data).hero).toBeUndefined();
    expect(blk(go(back.data, { t: 'toNight' })).hero!.id).toBe('blue');
  });
  it('saves and reloads with the Hero', () => {
    const r = night(go(started('sv'), { t: 'open' }));
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') expect(loaded.data).toEqual(r);
  });
});

describe('DOMINION D11: Threat and its stages', () => {
  it('stage edges: 24/25 FOILS, 44/45 ATTACKS, 64/65 RAIDS, 79/80 ALLIES', () => {
    expect([0, 24, 25, 44, 45, 64, 65, 79, 80, 100].map(stageIndex)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
  it('Threat counts the Boss\'s harm; the World Turn moves the stage up and says so once', () => {
    let r = edit(go(started('th'), { t: 'open' }), (b) => { heroOf(b).harm = 30; });
    expect(threatOf(blk(r))).toBeGreaterThanOrEqual(30);
    r = night(r);
    const h = blk(r).hero!;
    expect(h.threat).toBeGreaterThanOrEqual(30);
    expect(h.stage).toBe(1);
    expect(blk(r).crew!.alerts.filter((a) => a.kind === 'hero' && a.text.includes('FOILS'))).toHaveLength(1);
    expect(ledgerModel(blk(r), r, 0).empire.hero).toEqual({ word: 'FOILS', n: h.threat });
  });
  it('the Hero walks the story path: badges move them on', () => {
    const r = edit(started(), (b) => { heroOf(b).badges = 2; });
    expect(heroAt(blk(r))).toBe(H.regions.kanto!.path![2]);
  });
});

describe('DOMINION D11: the Hero steps into a job (m11)', () => {
  it('a foiled job waits on a choice before any battle; Run loses the job and adds Heat', () => {
    const r0 = armed(day('fo'));
    const out = stepInRun(content, r0, act('catch', 'route-3', 'pewter'));
    expect(out.ok).toBe(true);
    expect(out.fight).toBeFalsy();
    expect(blk(out.run).field.fight).toMatchObject({ why: 'hero', foe: 'hero', begun: false });
    const m = interruptModel(blk(out.run), out.run.inventory)!;
    expect(m.hero).toBe('Blue');
    expect(m.smoke).toBe(0);
    // Once a week only.
    expect(blk(out.run).hero!.foiled).toBe(true);
    const heat = blk(out.run).heat;
    const ran = go(out.run, { t: 'interrupt', how: 'run' });
    expect(blk(ran).field.fight).toBeNull();
    expect(blk(ran).field.districts.pewter!.heat).toBeGreaterThanOrEqual(blk(out.run).field.districts.pewter!.heat + H.foil.runHeat);
    expect(blk(ran).heat).toBeGreaterThanOrEqual(heat);
  });
  it('Smoke Ball: refused without one; with one it is used up and either slips away or fights', () => {
    const r0 = stepInRun(content, armed(day('sm')), act('catch', 'route-3', 'pewter')).run;
    const none = stepInRun(content, r0, { t: 'interrupt', how: 'smoke' });
    expect(none.ok).toBe(false);
    expect(none.notice).toBe(H.lines.noSmoke);
    const withBall = { ...r0, inventory: { ...r0.inventory, [H.foil.smokeItem]: 1 } };
    const out = stepInRun(content, withBall, { t: 'interrupt', how: 'smoke' });
    expect(out.ok).toBe(true);
    expect(out.run.inventory[H.foil.smokeItem] ?? 0).toBe(0);
    if (out.fight) expect(blk(out.run).field.fight?.why).toBe('hero');
    else expect(blk(out.run).field.fight).toBeNull();
  });
  it('Battle: a trainer battle with the Hero; winning settles the job and the Hero has seen your types', () => {
    const r0 = stepInRun(content, armed(day('bt')), act('catch', 'route-3', 'pewter')).run;
    const out = stepInRun(content, r0, { t: 'interrupt', how: 'fight' });
    expect(out.ok && out.fight).toBe(true);
    const b = beginDominionFight(content, out.run)!;
    expect(b.battle?.kind).toBe('trainer');
    expect(Object.keys(blk(b).hero!.types).length).toBeGreaterThan(0);
    const won = structuredClone(b);
    const lines = endDominionFight(content, won, 'win');
    expect(lines.join(' ')).toContain('Blue');
    expect(blk(won).field.fight).toBeNull();
    expect(blk(won).hero!.seen).toBe(1);
    expect(blk(won).hero!.met).toBe(true);
  });
  it('no interrupt below FOILS, and the Hero\'s own actions never get one', () => {
    const calm = stepInRun(content, day('no'), act('catch', 'route-3', 'pewter'));
    expect(blk(calm.run).field.fight?.why).not.toBe('hero');
  });
  it('after two battles the Hero adapts to the type they saw most', () => {
    const r0 = edit(stepInRun(content, armed(day('ad')), act('catch', 'route-3', 'pewter')).run, (b) => {
      Object.assign(heroOf(b), { seen: 1, types: { fire: 9, water: 1 } });
    });
    const b = beginDominionFight(content, go(r0, { t: 'interrupt', how: 'fight' }))!;
    endDominionFight(content, b, 'lose');
    expect(blk(b).hero!.counters).toEqual(['fire']);
    expect(heroModel(blk(b), b).hero.counters).toEqual(['Fire']);
  });
});

describe('DOMINION D11: encounter cards (O166-O185)', () => {
  const dealt = (r: RunState, id: string): RunState => edit(r, (b) => { heroOf(b).meet = { id, day: b.day, district: heroAt(b) }; });
  it('Watch learns the route for two days and meets the Hero; Challenge starts a no-stakes battle', () => {
    const r = dealt(day('en'), 'O166');
    const m = heroModel(blk(r), r);
    expect(m.meet?.choices.map((c) => c.label)).toEqual(['Avoid', 'Watch', 'Challenge']);
    const w = go(r, { t: 'meet', choice: 1 });
    expect(blk(w).hero!.intel).toBe(blk(r).day + 2);
    expect(blk(w).hero!.met).toBe(true);
    expect(blk(w).hero!.meet).toBeNull();
    const c = stepInRun(content, r, { t: 'meet', choice: 2 });
    expect(c.fight).toBe(true);
    expect(blk(c.run).field.fight).toMatchObject({ why: 'challenge', foe: 'hero' });
  });
  it('a night card waits for the night; a missing choice fails', () => {
    const r = dealt(day('nt'), 'O184');
    expect(stepInRun(content, r, { t: 'meet', choice: 0 }).ok).toBe(false);
    expect(heroModel(blk(r), r).meet?.open).toBe(false);
    expect(stepInRun(content, dealt(day('nt'), 'O166'), { t: 'meet', choice: 9 }).ok).toBe(false);
  });
  it('Disillusion is never shown on the Hero file', () => {
    const r = edit(day('ds'), (b) => { heroOf(b).disill = 77; });
    expect(JSON.stringify(heroModel(blk(r), r))).not.toContain('77');
  });
});

describe('DOMINION D11: the Legendaries', () => {
  it('wake at 70 Dread, warn, strike; a Day fight drives one off and it can\'t be caught', () => {
    let r = edit(go(started('lg'), { t: 'open' }), (b) => { b.field.districts.pewter!.dread = 80; });
    r = night(r);
    expect(activeLegends(blk(r))).toEqual(['moltres']);
    expect(blk(r).hero!.legends.moltres!.next).toBe(blk(r).day + H.legends.warn);
    r = go(r, { t: 'toDay' });
    const m = heroModel(blk(r), r);
    expect(m.legends[0]).toMatchObject({ id: 'moltres', out: true, canFight: true, dial: 100 });
    expect(m.cta.act).toBe('legend');
    const actions = blk(r).actions;
    const s = stepInRun(content, r, { t: 'legend', legend: 'moltres' });
    expect(s.ok && s.fight).toBe(true);
    expect(blk(s.run).actions).toBe(actions - 1);
    const b = beginDominionFight(content, s.run)!;
    expect(b.battle?.kind).toBe('wild');
    expect(b.battle?.enemyTeam[0]?.speciesId).toBe('moltres');
    expect(dominionCatchBlock(b)).toBe(H.lines.legendNoCatch);
    endDominionFight(content, b, 'win');
    expect(blk(b).hero!.legends.moltres!.away).toBe(blk(b).day + H.legends.away);
    expect(activeLegends(blk(b))).toEqual([]);
  });
  it('can\'t fight one that isn\'t out, or at night', () => {
    expect(stepInRun(content, day('lx'), { t: 'legend', legend: 'moltres' }).ok).toBe(false);
  });
});

describe('DOMINION D11: the final stand and recruiting the Hero', () => {
  const standing = (seed: string): RunState => {
    let r = edit(go(started(seed), { t: 'open' }), (b) => callFinalStand(b));
    r = night(r);
    expect(blk(r).field.fight).toMatchObject({ why: 'stand', foe: 'hero' });
    return r;
  };
  it('losing makes it Contested: three towns drop to 45 Control, the Hero comes back in seven days', () => {
    const r = edit(standing('sl'), (b) => { for (const d of Object.values(b.field.districts)) d.control = 90; });
    const b = beginDominionFight(content, r)!;
    endDominionFight(content, b, 'lose');
    const ds = Object.values(blk(b).field.districts);
    expect(ds.filter((d) => d.control === H.stand.control)).toHaveLength(H.stand.take);
    expect(blk(b).hero!.stand).toMatchObject({ state: 'due', day: blk(b).day + H.stand.rematch, lost: 1 });
  });
  it('winning opens the choice; leave = Dread, recruit = Disillusion chance (0 never, capped at 80)', () => {
    const b = beginDominionFight(content, standing('sw'))!;
    endDominionFight(content, b, 'win');
    expect(blk(b).hero!.stand?.state).toBe('choose');
    expect(heroModel(blk(b), b).choose).toBe(true);
    const left = afterStand(blk(b), 'leave', 'x');
    expect(left.block.hero!.stand?.outcome).toBe('leave');
    const zero = edit(b, (x) => { heroOf(x).disill = 0; });
    for (const s of ['a', 'b', 'c', 'd']) expect(afterStand(blk(zero), 'recruit', s).joined).toBe(false);
    const full = edit(b, (x) => { heroOf(x).disill = 100; });
    const tries = Array.from({ length: 60 }, (_, i) => afterStand(blk(full), 'recruit', `s${i}`).joined);
    expect(tries.some(Boolean)).toBe(true);
    expect(tries.some((x) => !x)).toBe(true);
    expect(afterStand(blk(standing('sx')), 'leave', 'x').ok).toBe(false);
  });
  it('a recruited Hero joins the crew as an Executive with their own team', () => {
    const b = beginDominionFight(content, standing('sj'))!;
    endDominionFight(content, b, 'win');
    let r = edit(b, (x) => { heroOf(x).disill = 100; });
    let seedHit: RunState | null = null;
    for (let i = 0; i < 60 && !seedHit; i++) {
      const out = stepInRun(content, { ...r, seed: `sj${i}` }, { t: 'after', how: 'recruit' });
      if (out.ok && blk(out.run).hero!.stand?.outcome === 'joined') seedHit = out.run;
    }
    expect(seedHit).not.toBeNull();
    r = seedHit!;
    const m = blk(r).members.find((x) => x.name === 'Blue')!;
    expect(m.rank).toBe(H.stand.rank);
    expect(m.team.length).toBeGreaterThan(0);
  });
});

describe('DOMINION D11: the five Hero actions and the three Hero tasks', () => {
  it('all five are played; Shame needs a meeting, Duel needs ATTACKS (or a Hunt), both need the Hero\'s town', () => {
    const ids = ['shame-the-hero', 'duel-the-hero', 'recruit-a-hero-s-friend', 'ambush-the-hero-s-route', 'steal-the-hero-s-item'];
    for (const id of ids) expect(actionStatus(actionDef(id)!).play, id).toBe(true);
    const r = day('ga');
    const at = heroAt(blk(r));
    expect(card(blk(r), r, 'shame-the-hero', null, at)!.blocked).toBe(H.lines.notMet);
    const met = edit(r, (b) => { heroOf(b).met = true; });
    expect(card(blk(met), met, 'shame-the-hero', null, at)!.blocked).toBeNull();
    expect(card(blk(met), met, 'shame-the-hero', null, 'cerulean')!.blocked).toMatch(/./);
    expect(card(blk(met), met, 'duel-the-hero', null, at)!.blocked).toBe(H.lines.notStage);
    const forced = edit(met, (b) => { heroOf(b).forced = true; });
    expect(card(blk(forced), forced, 'duel-the-hero', null, at)!.blocked).toBeNull();
  });
  it('Track, Counter and Hunt the Hero are supported crew tasks', () => {
    for (const id of ['track-the-hero', 'counter-the-heros-story', 'hunt-the-hero']) {
      const t = DOMINION_DATA.tasks.find((x) => x.id === id)!;
      expect(t.status, id).toBe('supported');
      expect(t.effect?.kind).toBe('hero');
    }
  });
});

describe('DOMINION D11: determinism', () => {
  it('same seed, same steps: the same Hero', () => {
    const once = (): RunState => {
      let r = edit(go(started('det'), { t: 'open' }), (b) => { heroOf(b).harm = 50; b.field.districts.pewter!.dread = 75; });
      r = night(r);
      r = go(go(r, { t: 'toDay' }), { t: 'endDay' });
      return night(r);
    };
    expect(blk(once()).hero).toEqual(blk(once()).hero);
  });
});
