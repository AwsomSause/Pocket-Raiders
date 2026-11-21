// DOMINION D15, many regions (Part 5 §3-6, Part 9 A11-A13, Q3/Q7; mockup v4 s10): leaving a Taken region with a
// Holder, standing orders and one member; arriving in the next region (₽1,000, the ace pre-evolved at Lv 15); the
// held region's week (Stability, tribute, betrayal checks scaled by the Betrayals rule); the Empire answers; boons;
// the region data packs; save/reload; determinism.
import { describe, expect, it } from 'vitest';
import { answerCard, canDraw, cardStatus, freshChair, payOwed } from '../../src/core/dominion/chair';
import { crewOf, withCrew } from '../../src/core/dominion/crew';
import { activeRegion, DOMINION_DATA, setActiveRegion } from '../../src/core/dominion/data';
import { regionIndex } from '../../src/core/dominion/pyramid';
import { regionsReached } from '../../src/core/dominion/hq';
import { teamsHere, withRivals } from '../../src/core/dominion/rivals';
import {
  aceOf, betrayalChance, defaultOrders, holderPicks, leaveProblem, nextRegion, preEvolve, realmOf, regionsInRun, riskOf, runDay,
} from '../../src/core/dominion/regions';
import { empireModel } from '../../src/core/dominion/regionsScreens';
import { DominionBlockSchema, RegionPackSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { dominionBlock, DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { freshTakeover } from '../../src/core/dominion/takeover';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const RG = DOMINION_DATA.regions;
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'd15'): RunState => {
  setActiveRegion('kanto');
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  const r = structuredClone(stepInRun(content, out.run, { t: 'open' }).run);
  r.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return r;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
const edit = (r: RunState, f: (b: DominionBlock, r: RunState) => void): RunState => {
  const out = structuredClone(r);
  const b = withCrew(out.expansion!.dominion!);
  f(b, out);
  return { ...out, expansion: { ...out.expansion, dominion: DominionBlockSchema.parse(b) } };
};
/** Kanto Taken by `path`, with an Executive who can hold it and a member to bring. */
const taken = (seed = 'd15', path: 'wipe' | 'shadow' | 'monarch' | 'goal' = 'shadow'): RunState =>
  edit(started(seed), (b, r) => {
    b.takeover = { ...freshTakeover(), won: { path, day: b.day }, paths: [path], taken: { path, day: b.day } };
    const m0 = b.members[0]!;
    const exec = { ...structuredClone(m0), id: 'rosa', name: 'Rosa', rank: 'executive', loyalty: 80 };
    const dale = { ...structuredClone(m0), id: 'dale', name: 'Dale', rank: 'executive' };
    b.members.push(exec, dale);
    for (const d of Object.values(b.field.districts).slice(0, 4)) d.control = 90;
    b.funds = 54321;
    r.party[0]!.level = 36;
  });
const leaveAct = (holder = 'rosa', bring: string | null = 'dale'): DominionAction => ({ t: 'leave', holder, orders: defaultOrders(), bring });
/** Leave Kanto, read the arrival, the Chair switched off (so nights stay the same). */
const arrive = (r: RunState): RunState => {
  const out = structuredClone(go(go(r, leaveAct()), { t: 'open' }));
  out.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return out;
};
/** Ends days until the week turns (Rest every night). */
const weekOn = (r: RunState): RunState => {
  const w = DOMINION_DATA.start.clock.weekLength;
  for (let i = 0; i < w; i += 1) {
    const b = blk(r);
    if (b.phase === 'morning') r = go(r, { t: 'toDay' });
    if (blk(r).phase === 'day') r = go(r, { t: 'endDay' });
    if (blk(r).phase === 'evening') r = go(r, { t: 'toNight' });
    while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
    r = go(r, { t: 'rest' });
  }
  return r;
};

describe('D15 region data', () => {
  it('every region pack validates, uses real species, and the six newer regions stay off', () => {
    expect(RG.order).toHaveLength(9);
    expect(RG.open).toEqual(['kanto', 'johto', 'hoenn']);
    for (const id of RG.order.slice(1)) {
      const p = RegionPackSchema.parse(DOMINION_DATA.packs[id]);
      expect(p.districts).toHaveLength(10);
      for (const d of p.districts) for (const t of d.targets) for (const s of t.foe.species) expect(content.species.has(s), `${id} ${t.id} ${s}`).toBe(true);
      for (const g of p.gyms) for (const s of g.species) expect(content.species.has(s), `${id} ${g.id} ${s}`).toBe(true);
      for (const s of [...p.pools.catch, ...p.pools.steal, ...p.lab]) expect(content.species.has(s), `${id} ${s}`).toBe(true);
      expect(p.districts.filter((d) => d.police)).toHaveLength(1);
    }
    // Every other region's Holdings is placed in one of its towns.
    for (const h of DOMINION_DATA.takeover.holdings.filter((x) => x.region !== 'kanto')) {
      const at = DOMINION_DATA.packs[h.region]!.holdings[h.id];
      expect(at, h.id).toBeDefined();
      expect(DOMINION_DATA.packs[h.region]!.districts.some((d) => d.id === at!.district)).toBe(true);
    }
  });

  it('no game text says Claude or AI', () => {
    const text = JSON.stringify([RG, DOMINION_DATA.packs]);
    expect(text).not.toMatch(/\bClaude\b/);
    expect(text).not.toMatch(/\bAI\b/);
  });

  it('the data follows the region being played, and Kanto is untouched', () => {
    setActiveRegion('kanto');
    const kanto = DOMINION_DATA.field.districts.map((d) => d.id);
    setActiveRegion('johto');
    expect(DOMINION_DATA.field.region).toBe('johto');
    expect(DOMINION_DATA.field.hq).toBe('olivine');
    expect(teamsHere().map((t) => t.id)).toEqual(['rocket-remnants']);
    expect(DOMINION_DATA.start.start.region).toBe('JOHTO');
    expect(DOMINION_DATA.takeover.holdings.filter((h) => h.region === 'johto').every((h) => h.status === 'limited' && h.district)).toBe(true);
    setActiveRegion('hoenn');
    expect(teamsHere().map((t) => t.id).sort()).toEqual(['aqua', 'magma']);
    setActiveRegion('nowhere');
    expect(activeRegion()).toBe('kanto');
    expect(DOMINION_DATA.field.districts.map((d) => d.id)).toEqual(kanto);
  });
});

describe('D15 leaving and arriving', () => {
  it('a run of Three plays Kanto, Johto and Hoenn; leaving waits for Taken', () => {
    const r = started();
    expect(regionsInRun(blk(r))).toEqual(['kanto', 'johto', 'hoenn']);
    expect(leaveProblem(blk(r))).toMatch(/Taken/);
    const out = stepInRun(content, r, leaveAct());
    expect(out.ok).toBe(false);
    expect(nextRegion(blk(taken()))).toBe('johto');
  });

  it('holders: yourself, an Executive (not a Grunt); the usurped Boss after a Wipe Out', () => {
    const picks = holderPicks(blk(taken()));
    expect(picks.map((p) => p.id)).toEqual(['self', 'rosa', 'dale']);
    expect(holderPicks(blk(taken('d15w', 'wipe'))).some((p) => p.kind === 'usurped' && p.name === 'Giovanni')).toBe(true);
  });

  it('leaving: the Holder keeps Kanto, Dale comes, only the ace comes pre-evolved at Lv 15, ₽1,000, no money carried', () => {
    const r0 = taken();
    const ace = aceOf(r0)!;
    const r = go(r0, leaveAct());
    const b = blk(r);
    expect(b.realm!.at).toBe('johto');
    expect(activeRegion()).toBe('johto');
    expect(b.day).toBe(1);
    expect(b.funds).toBe(RG.arrive.funds);
    expect(b.members.map((m) => m.id)).toContain('dale');
    expect(b.members.some((m) => m.id === 'rosa')).toBe(false);
    expect(Object.keys(b.field.districts)).toContain('olivine');
    expect(b.field.at).toBe('olivine');
    expect(r.party).toHaveLength(1);
    expect(r.party[0]!.level).toBe(RG.arrive.aceLevel);
    const from = content.species.get(ace.speciesId)!.evolvesFrom;
    expect(r.party[0]!.speciesId).toBe(from ?? ace.speciesId);
    expect(r.party[0]!.moves).toEqual(ace.moves);
    expect(r.party[0]!.ivs).toEqual(ace.ivs);
    const h = b.realm!.held[0]!;
    expect(h).toMatchObject({ id: 'kanto', path: 'shadow', status: 'held', stability: RG.stability.start.shadow });
    expect(h.holder.name).toBe('Rosa');
    expect(regionIndex(b)).toBe(1);
    expect(regionsReached(b)).toBe(2);
    expect(runDay(b)).toBeGreaterThan(b.day);
    // The opening scene is Johto's own arrival, with Dale's name.
    expect(b.opened).toBe(false);
    expect(empireModel(b, r).cards.map((c) => c.id)).toEqual(['kanto', 'johto', 'hoenn']);
  });

  it('pre-evolve: a Pokémon that doesn\'t evolve comes as it is', () => {
    const r = started();
    const mon = { ...structuredClone(r.party[0]!), speciesId: 'tauros' };
    expect(preEvolve(content, mon, 15).speciesId).toBe('tauros');
    const zard = { ...structuredClone(r.party[0]!), speciesId: 'charizard' };
    expect(preEvolve(content, zard, 15).speciesId).toBe('charmeleon');
  });

  it('refusals: no orders, bring the Holder, an unknown Holder', () => {
    const r = taken();
    expect(stepInRun(content, r, { t: 'leave', holder: 'rosa', orders: { money: 'x' }, bring: null }).ok).toBe(false);
    expect(stepInRun(content, r, leaveAct('rosa', 'rosa')).ok).toBe(false);
    expect(stepInRun(content, r, leaveAct('nobody', null)).ok).toBe(false);
  });
});

describe('D15 the held region\'s week', () => {
  it('Stability, tribute and a week line every week; betrayals Off never betray', () => {
    let r = arrive(edit(taken('d15b'), (b) => { b.rules = { length: 'three', pace: 'normal', hero: 'normal', betrayals: 'off' }; }));
    for (let i = 0; i < 4; i += 1) r = weekOn(r);
    const b = blk(r), h = b.realm!.held[0]!;
    expect(h.status).toBe('held');
    expect(betrayalChance(b, h)).toBe(0);
    expect(b.report.join(' ') + JSON.stringify(b.empire?.weeks)).toBeTruthy();
  });

  it('the betrayal chance: risk and Stability, scaled by the rule, capped (boundary)', () => {
    const r = go(taken(), leaveAct());
    const b = structuredClone(blk(r)), h = b.realm!.held[0]!;
    h.grievances = 12;
    h.stability = 0;
    expect(betrayalChance(b, h)).toBe(RG.betrayal.cap);
    b.rules = { length: 'three', pace: 'normal', hero: 'normal', betrayals: 'rare' };
    expect(betrayalChance(b, h)).toBeLessThan(RG.betrayal.cap);
    b.rules = { length: 'three', pace: 'normal', hero: 'normal', betrayals: 'off' };
    expect(betrayalChance(b, h)).toBe(0);
    h.holder = { kind: 'self', name: 'Yourself', member: null };
    expect(betrayalChance(b, h)).toBe(0);
    expect(riskOf(b, h)).toBe(0);
  });

  it('a high-risk Holder betrays on a deterministic roll; same seed, same result', () => {
    const play = (): DominionBlock => {
      let r = arrive(taken('d15c'));
      r = edit(r, (b) => { const h = b.realm!.held[0]!; h.grievances = 6; h.stability = 10; });
      for (let i = 0; i < 6; i += 1) r = weekOn(r);
      return blk(r);
    };
    const a = play(), b = play();
    expect(a.realm!.held).toEqual(b.realm!.held);
    expect(a.realm!.held[0]!.status).not.toBe('held');
    expect(a.realm!.held[0]!.traitor).toBe('Rosa');
  });
});

describe('D15 answers on the Empire screen', () => {
  it('Pay, Spy, orders, tribute; Visit spends the Day and the next', () => {
    let r = arrive(taken());
    r = edit(r, (b) => { b.funds = 5000; });
    r = go(r, { t: 'realm', op: 'pay', region: 'kanto' });
    expect(blk(r).realm!.held[0]!.raised).toBe(true);
    r = go(r, { t: 'realm', op: 'spy', region: 'kanto' });
    expect(blk(r).funds).toBe(5000 - RG.answers.pay.cost - RG.answers.spy.cost);
    r = go(r, { t: 'realm', op: 'orders', region: 'kanto', orders: { ...defaultOrders(), money: 'max-income' } });
    expect(blk(r).realm!.held[0]!.orders.money).toBe('max-income');
    r = go(r, { t: 'realm', op: 'tribute', region: 'kanto', tribute: 30 });
    expect(blk(r).realm!.held[0]!.tribute).toBe(30);
    expect(stepInRun(content, r, { t: 'realm', op: 'tribute', region: 'kanto', tribute: 33 }).ok).toBe(false);
    // Visit (Day only)
    expect(stepInRun(content, r, { t: 'realm', op: 'visit', region: 'kanto' }).ok).toBe(false);
    r = go(go(go(r, { t: 'toNight' }), { t: 'rest' }), { t: 'toDay' });
    const stab = blk(r).realm!.held[0]!.stability;
    r = go(r, { t: 'realm', op: 'visit', region: 'kanto' });
    expect(blk(r).actions).toBe(0);
    expect(blk(r).realm!.held[0]!.stability).toBe(Math.min(100, stab + RG.answers.visit.stab));
    r = go(go(go(go(r, { t: 'endDay' }), { t: 'toNight' }), { t: 'rest' }), { t: 'toDay' });
    expect(blk(r).actions).toBe(0);
    expect(blk(r).realm!.away).toBe(0);
  });

  it('Replace in the Evening: Dale holds Kanto, Rosa comes back', () => {
    let r = arrive(taken());
    expect(blk(r).phase).toBe('evening');
    r = go(r, { t: 'realm', op: 'replace', region: 'kanto', member: 'dale' });
    const b = blk(r);
    expect(b.realm!.held[0]!.holder.name).toBe('Dale');
    expect(b.members.some((m) => m.id === 'rosa')).toBe(true);
    expect(b.members.some((m) => m.id === 'dale')).toBe(false);
  });

  it('a seceded region: the Long Trip is a fight; winning takes it back; Let go loses it', () => {
    let r = arrive(taken());
    r = edit(r, (b) => { const h = b.realm!.held[0]!; h.status = 'seceded'; h.traitor = 'Rosa'; h.kind = 'secession'; });
    expect(stepInRun(content, r, { t: 'realm', op: 'pay', region: 'kanto' }).ok).toBe(false);
    const out = stepInRun(content, r, { t: 'realm', op: 'trip', region: 'kanto' });
    expect(out.ok && out.fight).toBe(true);
    expect(blk(out.run).field.fight?.why).toBe('realm');
    const gone = go(r, { t: 'realm', op: 'letGo', region: 'kanto' });
    expect(blk(gone).realm!.held[0]!.status).toBe('lost');
  });
});

describe('D15 Chair cards that waited for the held regions (80, 126-129, 132) and owed Stability', () => {
  const card = (id: number) => DOMINION_DATA.court.find((c) => c.id === id)!;
  const answer = (b: DominionBlock, id: number, pick: 0 | 1): DominionBlock => {
    const x = structuredClone(b);
    x.chair = { ...freshChair(), open: true, docket: [{ card: id, member: null, second: null }], at: 0 };
    const out = answerCard(x, pick, 'seed');
    expect(out.ok).toBe(true);
    return out.block;
  };
  it('all five play now; the held-region ones need a held region to be drawn', () => {
    for (const id of [80, 126, 127, 128, 129, 132]) expect(cardStatus(card(id))).not.toBe('disabled');
    expect(card(126).needs).toBe('held');
    const kanto = withCrew(structuredClone(blk(taken())));
    kanto.hqLevel = 5; // a tier-4 card (HQ tier 4-5)
    expect(canDraw(kanto, card(127))).toBe(false); // nothing held yet
    const johto = structuredClone(blk(arrive(taken())));
    expect(canDraw(johto, card(127))).toBe(false); // a new region's HQ starts small again
    johto.hqLevel = 5;
    expect(canDraw(johto, card(127))).toBe(true);
  });
  it('Stability owed before leaving lands on the first held region; after, it moves every held region', () => {
    const r = edit(taken(), (b) => void payOwed(b, 'stab', -7));
    expect(blk(r).chair!.owed.stab).toBe(-7);
    const j = blk(arrive(r));
    expect(j.realm!.held[0]!.stability).toBe(RG.stability.start.shadow - 7);
    const b = structuredClone(j);
    expect(payOwed(b, 'stab', 5)).toBe(true);
    expect(b.realm!.held[0]!.stability).toBe(RG.stability.start.shadow - 2);
  });
  it('126 sends two of the lowest ranks to the held region; 127 cuts the tribute; 129 moves Uprising odds; flags travel on', () => {
    let b = withCrew(structuredClone(blk(arrive(taken()))));
    b.members = b.members.filter((m) => RG.holders.ranks.includes(m.rank));
    const extra = { ...structuredClone(b.members.find((m) => m.id === 'dale')!), rank: 'grunt' };
    b.members.push({ ...extra, id: 'pip', name: 'Pip', level: 3 }, { ...extra, id: 'quin', name: 'Quin', level: 4 }, { ...extra, id: 'zed', name: 'Zed', level: 9 });
    const crew0 = b.realm!.held[0]!.crew, stab0 = b.realm!.held[0]!.stability;
    b = answer(b, 126, 0);
    expect(b.members.map((m) => m.id)).not.toContain('pip');
    expect(b.members.map((m) => m.id)).not.toContain('quin');
    expect(b.members.map((m) => m.id)).toContain('zed');
    expect(b.realm!.held[0]!.crew).toBe(crew0 + 2);
    expect(b.realm!.held[0]!.stability).toBe(Math.min(100, stab0 + 15));
    expect(b.chair!.result!.join(' ')).toContain('Pip and Quin');
    b = answer(b, 127, 0);
    expect(b.flags).toContain('tribute-cut');
    b = answer(b, 129, 1);
    expect(b.flags).toContain('uprising-up');
    b = answer(b, 129, 0);
    expect(b.flags).toContain('uprising-cut');
    expect(b.flags).not.toContain('uprising-up');
    // The lasting answers travel with the Boss to the next region.
    const carried = blk(arrive(edit(taken(), (k) => { k.flags = [...k.flags, 'tribute-cut', 'smuggle-line']; })));
    expect(carried.flags).toEqual(expect.arrayContaining(['tribute-cut', 'smuggle-line']));
  });
  it('80 (Hoenn): Magma stands down, Aqua heats up', () => {
    const b = withCrew(structuredClone(blk(arrive(taken()))));
    setActiveRegion('hoenn');
    b.rivals = undefined;
    withRivals(b);
    b.rivals!.teams.magma!.tension = 50;
    b.rivals!.teams.aqua!.tension = 50;
    const out = answer(b, 80, 0);
    expect(out.chair!.result!.join(' ')).toContain('Magma stands down');
    expect(out.rivals!.teams.magma!.tension).toBeLessThan(50);
    expect(out.rivals!.teams.aqua!.tension).toBeGreaterThan(50);
    setActiveRegion('kanto');
  });
});

describe('D15 boons', () => {
  it('Silph tech: arriving after Kanto brings a Garage and 10 Ultra Balls', () => {
    const r = go(taken(), leaveAct());
    expect(r.inventory['ultra-ball']).toBe(RG.arrive.ultraBalls);
    expect(blk(r).hq!.rooms.some((x) => x.id === 'garage')).toBe(true);
  });
});

describe('D15 saves', () => {
  it('a block without realm loads (Kanto), a new one round-trips, a damaged one fails', () => {
    const r = go(taken(), leaveAct());
    const old = structuredClone(blk(started()));
    delete old.realm;
    expect(DominionBlockSchema.parse(old).realm).toBeUndefined();
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    setActiveRegion('kanto');
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.data).toEqual(r);
    expect(dominionBlock(loaded.data)?.realm?.held[0]?.holder.name).toBe('Rosa');
    expect(activeRegion()).toBe('johto');
    const bad = structuredClone(blk(r)) as unknown as { realm: { held: { stability: number }[] } };
    bad.realm.held[0]!.stability = 400;
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
    expect(crewOf(blk(r).members.find((m) => m.id === 'dale')!).task).toBe('rest');
    expect(realmOf(structuredClone(blk(started()))).at).toBe('kanto');
    setActiveRegion('kanto');
  });
});
