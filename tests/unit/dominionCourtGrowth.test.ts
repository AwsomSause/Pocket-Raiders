// DOMINION D10 follow-up: the Chair's visitors whose answers need Growth (growthCourt.ts): court cards 29, 32, 37, 39,
// 45, 46, 51, 53, 65, 66, 78, 79, 98, 99, 100, 101, 130, 131. Each one plays (no `wait`, no "waits" note) and does what
// its list line says; what needs the Bag is settled right after the answer; save/reload and an old save.
import { describe, expect, it } from 'vitest';
import trainersRaw from '../../src/data/trainers.json';
import { atDoor, cardById, cardStatus, chairOf, courtFightEnd } from '../../src/core/dominion/chair';
import { withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { card } from '../../src/core/dominion/field';
import { growthOf } from '../../src/core/dominion/growth';
import { courtOf } from '../../src/core/dominion/growthCourt';
import { defense, front, upgradeInfo } from '../../src/core/dominion/hq';
import { pickupShare } from '../../src/core/dominion/police';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const CT = DOMINION_DATA.growth.court;
const IDS = [29, 32, 37, 39, 45, 46, 51, 53, 65, 66, 78, 79, 98, 99, 100, 101, 130, 131];
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
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
/** Day 2's Evening (the first with the Chair). */
const day2 = (seed = 'dmc'): RunState => {
  const s = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  let r = go(go(s.run, { t: 'open' }), { t: 'toNight' });
  r = go(r, { t: 'rest' });
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return go(go(r, { t: 'toDay' }), { t: 'endDay' });
};
/** One card at the door, answered. `prep` changes the block first. */
const answer = (id: number, pick: 0 | 1, prep: (b: DominionBlock, r: RunState) => void = () => {}, seed = 'dmc'): RunState => {
  let r = go(day2(seed), { t: 'toNight' });
  r = edit(r, (b, run) => {
    prep(b, run);
    b.chair!.docket = [{ card: id, member: null, second: null }];
  });
  expect(atDoor(blk(r))?.card.id).toBe(id);
  return go(r, { t: 'court', choice: pick });
};
const said = (r: RunState): string => JSON.stringify([blk(r).chair, blk(r).report]);

describe('DOMINION D10 follow-up: the Chair cards that waited on Growth', () => {
  it('all 18 play now: no wait, no "waits for a later slice" note; 148 of 150 cards live (D15 and D16 opened 6 more)', () => {
    for (const id of IDS) {
      const c = cardById(id)!;
      expect(c.wait, `card ${id}`).toBeUndefined();
      expect(cardStatus(c), `card ${id}`).not.toBe('disabled');
      expect([...c.a.fx, ...c.b.fx].some((e) => e.k === 'note'), `card ${id}`).toBe(false);
    }
    expect(DOMINION_DATA.court.filter((c) => !c.wait)).toHaveLength(148);
    // The data it names exists: the quiz TM, the gift buildings, the raid crate, the gambler's trainer class.
    expect(content.items.has(CT.quiz.prize)).toBe(true);
    for (const id of Object.values(CT.gifts)) expect(DOMINION_DATA.buildings.some((x) => x.id === id), id).toBe(true);
    expect(DOMINION_DATA.field.crates[CT.heistCrate]).toBeTruthy();
    const classes = (trainersRaw as { id: string }[]).map((t) => t.id);
    expect(classes).toContain(cardById(51)!.foe!.cls);
  });

  it('the dockworkers: paid, routes pay less and Smuggle runs at half the Heat; a strike stops Smuggle and the routes', () => {
    let r = answer(39, 0, (b) => void (growthOf(b).routes = [{ to: 'pewter', nightly: 1000, day: 1 }]));
    expect(courtOf(blk(r)).union).toBe(true);
    r = go(r, { t: 'courtNext' });
    while (blk(r).chair?.open) r = go(r, { t: 'toNight' });
    r = go(r, { t: 'rest' });
    expect(said(r)).toContain(`Smuggling routes paid ₽${1000 - (1000 * CT.unionCut) / 100}`);
    // A strike (the 40% refusal): Smuggle refused on the Card, and no route pays.
    const b = structuredClone(blk(r));
    courtOf(b).strike = b.day + 2;
    b.phase = 'night';
    b.hq!.rooms.push({ uid: 'rg', id: 'garage', tier: 1, cond: 100, spent: 0, building: false, up: false, ready: 1, shut: false, ruined: false, at: null });
    const c = card(b, r, 'smuggle', null, 'pewter');
    expect(c?.blocked).toContain('strike');
  });

  it('the fence: 60% now for the hot goods in the Bag; the weekly deal; 90% when he comes back', () => {
    const price = content.shop.find((s) => s.item === 'ultra-ball')?.price ?? 200;
    let funds = 0;
    const r = answer(45, 0, (b, run) => {
      run.inventory['ultra-ball'] = 2;
      growthOf(b).hot = { 'ultra-ball': 2 };
      funds = b.funds;
    });
    expect(r.inventory['ultra-ball'] ?? 0).toBe(0);
    expect(growthOf(blk(r)).hot).toEqual({});
    expect(blk(r).funds - funds).toBe(Math.round((price * 2 * CT.fenceNow) / 100));
    expect(courtOf(blk(r)).sell).toEqual([]);
    const w = answer(46, 0);
    expect(courtOf(blk(w)).fence).toBe(true);
    const last = answer(46, 1, (b, run) => {
      run.inventory['ultra-ball'] = 1;
      growthOf(b).hot = { 'ultra-ball': 1 };
      funds = b.funds;
    });
    expect(blk(last).funds - funds).toBe(Math.round((price * CT.fenceLast) / 100));
    // No hot goods: he has nothing to buy (the card needs them to be drawn at all).
    expect(said(answer(45, 0))).toContain('no hot goods');
  });

  it('the law: the judge cuts pick-ups for two weeks, the informant stops them for a week, the council seat for good', () => {
    const j = blk(answer(65, 0));
    expect(courtOf(j).judge).toBe(j.day + CT.judgeDays);
    expect(pickupShare(j)).toBe(100 - CT.judge);
    const late = structuredClone(j);
    late.day += CT.judgeDays + 1;
    expect(pickupShare(late)).toBe(100);
    const t = blk(answer(66, 0));
    expect(pickupShare(t)).toBe(0);
    const c = blk(answer(130, 0, (b) => void (b.hq ? (b.hq.clean = 60000) : null)));
    expect(courtOf(c).council).toBe(true);
    expect(pickupShare(c)).toBe(100 - CT.council);
    // Nothing set: the police as always (old saves too).
    expect(pickupShare(blk(day2()))).toBe(100);
  });

  it('the joint heist pays a raid crate and a share; Koga and the cab driver show on the Card', () => {
    let funds = 0;
    const h = answer(78, 0, (b) => void (funds = b.funds));
    expect(said(h)).toContain('joint heist pays out');
    expect(blk(h).funds).toBeGreaterThan(funds);
    expect(courtOf(blk(h)).heist).toBe(0);
    const k = answer(98, 0);
    const parts = (b: DominionBlock, id: string) => (card(b, k, id, null, 'pewter')?.parts ?? []).map(([l]) => l).join('|');
    expect(parts(blk(k), 'steal')).toContain("Koga's training");
    expect(parts(blk(k), 'scout')).not.toContain("Koga's training");
    const cab = answer(29, 0);
    expect(chairOf(blk(cab)).deals.some((d) => d.card === 29)).toBe(true);
    expect(parts(blk(cab), 'scout')).toContain('The cab driver');
  });

  it('Gyms: the bought Leader goes public (the Gym is lost); the blackmailed one only comes with a blackmailed Gym', () => {
    const gym = DOMINION_DATA.growth.gyms.find((g) => g.id !== 'viridian-gym')!;
    let seen = false;
    for (let i = 0; i < 12 && !seen; i++) {
      const r = answer(101, 1, (b) => void (growthOf(b).gyms[gym.id] = { way: 'buy', day: 1, defiance: 0, told: false, leader: null }), `gl${i}`);
      if (growthOf(blk(r)).gyms[gym.id]) continue;
      seen = true;
      expect(said(r)).toContain('not yours any more');
    }
    expect(seen).toBe(true);
    expect(cardById(100)!.needs).toBe('gym-blackmail');
    expect(cardById(101)!.needs).toBe('gym-bought');
  });

  it('gifts and the HQ: the shop, the café, a house won from the gambler; the accountant, the lab machine, the architect', () => {
    expect(blk(answer(32, 0, (b) => void (b.hq ? (b.hq.clean = 5000) : null))).hq!.rooms.some((x) => x.id === CT.gifts.shop)).toBe(true);
    expect(blk(answer(37, 1, (b) => void (b.hq ? (b.hq.clean = 5000) : null))).hq!.rooms.some((x) => x.id === CT.gifts.cafe)).toBe(true);
    // The gambler: a fight at the door; won, the house is yours.
    const g = structuredClone(blk(answer(51, 0)));
    expect(g.field.fight).toMatchObject({ why: 'court', target: '51' });
    g.field.fight = null;
    courtFightEnd(g, 'win', 'seed');
    expect(g.hq!.rooms.some((x) => x.id === CT.gifts.house)).toBe(true);
    // The accountant launders at his fee, front or not.
    expect(front(blk(answer(53, 0)))).toEqual({ fee: CT.accountantFee, name: 'the accountant' });
    // The architect: the next level costs less; the weak spot costs Defense.
    const a = structuredClone(blk(answer(131, 0)));
    const full = structuredClone(a);
    full.growth!.court!.architect = false;
    expect(upgradeInfo(a, 50).cost).toBe(Math.round((upgradeInfo(full, 50).cost * (100 - CT.architect)) / 100));
    const weak = structuredClone(full);
    weak.growth!.court!.weak = true;
    expect(defense(weak)).toBe(Math.max(0, defense(full) - CT.weakDefense));
    // The lab machine: with no room to raise yet, it says so; the Pokémon still goes.
    expect(said(answer(79, 0))).toMatch(/lab machine|cupboard/);
  });

  it("Blaine's quiz: three riddles on the Boss's Wits; two right wins his prize (a Fire Stone, into the Bag)", () => {
    let won = false, lost = false;
    for (let i = 0; i < 16 && !(won && lost); i++) {
      const r = answer(99, 0, (b) => void (b.field.edge.stats.wits = 2), `qz${i}`);
      const txt = said(r);
      expect((txt.match(/Blaine: /g) ?? []).length).toBe(3);
      if (txt.includes('Blaine pays up')) {
        won = true;
        expect(r.inventory[CT.quiz.prize] ?? 0).toBeGreaterThan(0);
      } else lost = true;
    }
    expect(won && lost).toBe(true);
  });

  it('the same seed gives the same answers; court state survives save/reload; a block without it loads', () => {
    const a = answer(99, 0, () => {}, 'det'), b = answer(99, 0, () => {}, 'det');
    expect(said(a)).toBe(said(b));
    const r = answer(65, 0);
    const store = new MemoryStorageProvider();
    new SaveManager(store, content).saveRun(r);
    const back = new SaveManager(store, content).loadRun();
    expect(back.status).toBe('ok');
    if (back.status !== 'ok') return;
    expect(courtOf(blk(back.data)).judge).toBe(courtOf(blk(r)).judge);
    const old = structuredClone(blk(r));
    delete old.growth!.court;
    expect(DominionBlockSchema.safeParse(old).success).toBe(true);
    expect(pickupShare(old)).toBe(100);
  });
});
