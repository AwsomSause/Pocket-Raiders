// DOMINION slice D5: the HQ (plans/evil-mode-rework BUILD_SLICES.md; Part 3 §3, Part 6 §3, Part 9 A21-A22;
// lists/buildings.md and buildings-pokemon-and-grunt.md).
import { describe, expect, it } from 'vitest';
import { withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { card } from '../../src/core/dominion/field';
import { defense, heldDistricts, hqStep, maxTier, slotsFree, storageCap, upgradeInfo } from '../../src/core/dominion/hq';
import { buildingDef, cleanOf, hasRoom, hqFx, hqOf, roomFor } from '../../src/core/dominion/hqFx';
import { assetsModel, baseModel, moneyModel, shortFx } from '../../src/core/dominion/hqScreens';
import { hireList } from '../../src/core/dominion/recruit';
import { DOMINION_MODE_ID, settleCrew, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun, newMon } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const HQ = DOMINION_DATA.hq;
const domRun = (seed = 'dm5'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dm5'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return stepInRun(content, out.run, { t: 'open' }).run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
const refused = (r: RunState, a: DominionAction): string | null => {
  const out = stepInRun(content, r, a);
  expect(out.ok).toBe(false);
  expect(out.run).toBe(r);
  return out.notice;
};
const answerAll = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
/** Evening -> Night -> Rest -> Morning. */
const night = (r: RunState): RunState => answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' }));
/** Evening to the next Evening. */
const round = (r: RunState): RunState => go(go(night(r), { t: 'toDay' }), { t: 'endDay' });
const withRun = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withCrew(structuredClone(blk(r)));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
/** Pewter (the HQ's district) held, money and clean money set. */
const rich = (r: RunState, funds: number, clean = 0): RunState => withRun(r, (b) => {
  b.field.districts.pewter!.control = 60;
  b.funds = funds;
  b.hq!.clean = clean;
});
const uidOf = (r: RunState, id: string): string => hqOf(blk(r)).rooms.find((x) => x.id === id)!.uid;

describe('DOMINION D5: the lists as data', () => {
  it('all 266 buildings are in (150 + 50 Pokémon + 60 Grunt + 6 from Part 3), word for word, eight tiers each', () => {
    const all = DOMINION_DATA.buildings;
    expect(all).toHaveLength(266);
    expect(all.filter((b) => /^\d+$/.test(b.n))).toHaveLength(150);
    expect(all.filter((b) => b.n.startsWith('P'))).toHaveLength(50);
    expect(all.filter((b) => b.n.startsWith('G'))).toHaveLength(60);
    expect(new Set(all.map((b) => b.id)).size).toBe(266);
    for (const b of all) expect(b.ladder).toHaveLength(8);
    const bunk = buildingDef('bunk-room')!;
    expect([bunk.cost, bunk.t1, bunk.ladder[0], bunk.ladder[7]]).toEqual([800, 'Crew cap +2', 'Cots', 'Residence']);
    // Part 3 names where the poster renamed a room; the list's own Treasury (#88) keeps its row as Treasury Hall.
    expect(buildingDef('treasury')!.listName).toBe('Vault');
    expect(buildingDef('treasury-hall')!.n).toBe('88');
    expect(buildingDef('operations-room')!.listName).toBe('War Room');
    for (const id of HQ.poster) expect(buildingDef(id), id).toBeDefined();
  });
  it('every building is supported, limited (says what waits) or disabled (names its slice); live ones have an effect', () => {
    const st = { supported: 0, limited: 0, disabled: 0 };
    for (const b of DOMINION_DATA.buildings) {
      st[b.status] += 1;
      if (b.status === 'disabled') expect(b.waits, b.id).toMatch(/^(D\d+|later)$/);
      else expect(Object.keys(b.fx).length, b.id).toBeGreaterThan(0);
    }
    expect(st.supported + st.limited).toBe(65);
    expect(st.disabled).toBe(201);
  });
  it('the six HQ levels match Part 3 §3.1 and A21 (cost, level cap, crew cap, slots, Defense)', () => {
    expect(HQ.levels.map((l) => [l.name, l.cost, l.levelCap, l.crewCap, l.slots, l.defense])).toEqual([
      ['The Warehouse', 0, 15, 3, 3, 1], ['Hideout', 3000, 25, 5, 6, 2], ['Compound', 12000, 40, 10, 10, 4],
      ['Fortress', 40000, 60, 18, 15, 6], ['Tower', 120000, 80, 28, 21, 8], ['Citadel', 300000, null, 40, 28, 10],
    ]);
    expect(roomFor('War Room')).toBe('operations-room');
    expect(roomFor('Day 1')).toBeNull();
  });
});

describe('DOMINION D5: the HQ on a new run', () => {
  it('starts as the Warehouse: 3 slots, Defense 1, crew cap 3, and the ₽1,000 is clean', () => {
    const b = blk(started());
    expect(hqOf(b).clean).toBe(1000);
    expect([b.hqLevel, b.rosterCap, b.levelCap, slotsFree(b), defense(b), storageCap(b)]).toEqual([1, 3, 15, 3, 1, 20]);
  });
  it('a D3 save (no `hq`) loads unchanged, then reads as an empty HQ with no clean money', () => {
    const r = started();
    const old = structuredClone(blk(r));
    delete old.hq;
    const parsed = DominionBlockSchema.parse(old);
    expect(parsed.hq).toBeUndefined();
    expect(hqOf(parsed)).toEqual({ rooms: [], next: 1, upgrade: null, clean: 0, wash: [], loan: null, broke: false });
    // It plays on: the first clean money (odd jobs) fills it in.
    const run = { ...r, expansion: { ...r.expansion, dominion: parsed } };
    const after = round(run);
    expect(blk(after).hq).toBeDefined();
  });
});

describe('DOMINION D5: rooms', () => {
  it('Buy Room: pays, takes a slot, works from the next morning (Bunk Room: crew cap 3 -> 5)', () => {
    let r = go(started(), { t: 'build', building: 'bunk-room', district: null });
    expect(blk(r).funds).toBe(200);
    expect(slotsFree(blk(r))).toBe(2);
    expect(blk(r).rosterCap).toBe(3);
    expect(defense(blk(r))).toBe(0);
    r = night(r);
    expect(blk(r).rosterCap).toBe(5);
    expect(blk(r).report.join(' ')).toContain('The Bunk Room is ready.');
    expect(defense(blk(r))).toBe(1);
  });
  it('slots run out (boundary: three one-slot rooms fill the Warehouse); a two-slot room needs two', () => {
    let r = rich(started(), 20000);
    for (const id of ['bunk-room', 'mess-hall', 'laundry']) r = go(r, { t: 'build', building: id, district: null });
    expect(slotsFree(blk(r))).toBe(0);
    expect(refused(r, { t: 'build', building: 'rec-room', district: null })).toContain('No free room slot');
    r = go(rich(started(), 20000), { t: 'build', building: 'bunk-room', district: null });
    r = go(r, { t: 'build', building: 'mess-hall', district: null });
    expect(refused(r, { t: 'build', building: 'barracks', district: null })).toContain('No free room slot');
  });
  it('failure: no money, the wrong HQ level, a building whose effect waits for a later slice', () => {
    const r = started();
    expect(refused(r, { t: 'build', building: 'barracks', district: null })).toContain('₽4000');
    expect(refused(rich(r, 50000), { t: 'build', building: 'operations-room', district: null })).toContain('HQ Lv. 2');
    expect(refused(rich(r, 50000), { t: 'build', building: 'mail-room', district: null })).toContain('later part');
  });
  it('tiers: T2 needs HQ Lv. 2 (boundary), costs T1 x 2.5, keeps working at T1 until done, then counts x1.5', () => {
    let r = night(go(rich(started(), 20000), { t: 'build', building: 'bunk-room', district: null }));
    const uid = uidOf(r, 'bunk-room');
    expect(maxTier(blk(r))).toBe(1);
    expect(refused(r, { t: 'tierUp', room: uid })).toContain("can't go higher");
    r = withRun(r, (b) => { b.hqLevel = 2; });
    const before = blk(r).funds;
    r = go(r, { t: 'tierUp', room: uid });
    expect(before - blk(r).funds).toBe(2000);
    expect(hqFx(blk(r)).crewCap).toBe(2);
    r = go(go(r, { t: 'toDay' }), { t: 'endDay' });
    r = night(r);
    expect(hqOf(blk(r)).rooms[0]!.tier).toBe(2);
    expect(hqFx(blk(r)).crewCap).toBe(3);
    expect(blk(r).report.join(' ')).toContain('Bunks (T2)');
  });
  it('Operations Room +1 Day action; Night Shift a second Night action; the Luxury Suite makes a rest worth one more', () => {
    let r = rich(started(), 50000);
    r = withRun(r, (b) => { b.hqLevel = 3; });
    for (const id of ['operations-room', 'night-shift', 'luxury-suite']) r = go(r, { t: 'build', building: id, district: null });
    r = night(r);
    expect(blk(r).nightActions).toBe(2);
    r = go(r, { t: 'toDay' });
    // 3 + 1 rested + 1 (Operations Room) + 1 (Luxury Suite on a rest)
    expect(blk(r).actions).toBe(6);
  });
  it('a room opens its actions: Study needs the Library (failure without, works with)', () => {
    let r = rich(started(), 20000);
    const c = card(blk(r), r, 'study', null, 'pewter', []);
    expect(c!.blocked).toContain('Build the Library first');
    expect(stepInRun(content, r, { t: 'act', action: 'study', target: null, district: 'pewter', bring: [] }).ok).toBe(false);
    r = night(go(r, { t: 'build', building: 'library', district: null }));
    r = go(go(r, { t: 'toDay' }), { t: 'endDay' });
    expect(hasRoom(blk(r), 'library')).toBe(true);
    const out = stepInRun(content, r, { t: 'act', action: 'study', target: null, district: 'pewter', bring: [] });
    expect(out.ok, out.notice ?? '').toBe(true);
    expect(blk(out.run).field.edge.xp.wits).toBe(3);
    // The crew task Study waits for the same room.
    expect(DOMINION_DATA.tasks.find((t) => t.id === 'study')!.room).toBe('library');
  });
  it('Recruitment Center: Hire Grunt costs 25% less; Training Room adds Train XP', () => {
    let r = rich(started(), 20000);
    const base = hireList(blk(r), r.seed).map((h) => h.price);
    r = night(go(r, { t: 'build', building: 'recruitment-center', district: null }));
    const b = blk(r);
    expect(hireList({ ...b, day: 1 }, r.seed).map((h) => h.price)).toEqual(base.map((p) => Math.round(p * 0.75)));
    expect(hqFx(b).recruit).toBe(10);
  });
  it('Condition: unpaid upkeep costs 10 a week; at 0 the room is ruined, a tier lower, and rebuilt at 60%', () => {
    let r = night(go(rich(started(), 10000), { t: 'build', building: 'laundry', district: null }));
    r = withRun(r, (b) => {
      b.funds = 0;
      b.hq!.rooms[0]!.cond = 10;
    });
    const b = structuredClone(blk(r));
    b.day = 7;
    const lines = hqStep(b);
    expect(lines.join(' ')).toContain('Upkeep unpaid');
    expect(b.hq!.rooms[0]!.ruined).toBe(true);
    expect(b.hq!.rooms[0]!.cond).toBe(0);
    const ruined = { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse({ ...b, funds: 1000 }) } };
    const out = go(ruined, { t: 'rebuild', room: b.hq!.rooms[0]!.uid });
    expect(blk(out).funds).toBe(1000 - Math.round(700 * 0.6));
  });
  it('selling gives back 60% as clean money; upkeep is 4% a week of what was spent', () => {
    let r = night(go(rich(started(), 10000), { t: 'build', building: 'barracks', district: null }));
    const b = structuredClone(blk(r));
    b.day = 7;
    const f0 = b.funds;
    expect(hqStep(b).join(' ')).toContain('Upkeep on the buildings: ₽160');
    expect(f0 - b.funds).toBe(160);
    r = go(r, { t: 'sell', room: uidOf(r, 'barracks') });
    expect(hqOf(blk(r)).clean).toBe(2400);
    expect(slotsFree(blk(r))).toBe(3);
  });
});

describe('DOMINION D5: clean money, upgrades and outside buildings (A21)', () => {
  it('odd jobs are clean; spending takes dirty money first, so clean never tops the funds', () => {
    let r = round(started());
    expect(hqOf(blk(r)).clean).toBeGreaterThanOrEqual(1000);
    r = withRun(r, (b) => { b.funds = 300; });
    expect(cleanOf(blk(r))).toBe(300);
  });
  it('Upgrade HQ needs clean money and its needs; dirty money is refused (failure)', () => {
    const r = withRun(started(), (b) => { b.funds = 9000; b.hq!.clean = 1000; });
    expect(refused(r, { t: 'upgrade' })).toContain('Districts 0 of 1');
    expect(refused(rich(r, 9000, 1000), { t: 'upgrade' })).toContain('clean money');
  });
  it('the upgrade takes three days with Defense halved, then raises level cap, crew cap and slots', () => {
    let r = go(rich(started(), 5000, 3000), { t: 'upgrade' });
    expect(blk(r).funds).toBe(2000);
    expect(hqOf(blk(r)).clean).toBe(0);
    expect(defense(blk(r))).toBe(0);
    expect(refused(r, { t: 'upgrade' })).toContain('already');
    for (let i = 0; i < 2; i++) r = round(r);
    expect(blk(r).hqLevel).toBe(1);
    r = night(r);
    expect([blk(r).hqLevel, blk(r).levelCap, blk(r).rosterCap, slotsFree(blk(r)), defense(blk(r))]).toEqual([2, 25, 5, 6, 2]);
    expect(blk(r).report.join(' ')).toContain('HQ Lv. 2');
  });
  it('a Front Shop stands in a held district (failure elsewhere), pays clean every night and launders at 10%', () => {
    let r = rich(started(), 6000, 0);
    expect(refused(r, { t: 'build', building: 'front-shop', district: 'cerulean' })).toContain('district you hold');
    r = go(r, { t: 'build', building: 'front-shop', district: 'pewter' });
    expect(slotsFree(blk(r))).toBe(3);
    expect(refused(r, { t: 'launder', amount: 1000 })).toContain('No Front');
    r = night(r);
    expect(blk(r).report.join(' ')).toContain('₽150 clean');
    const clean0 = hqOf(blk(r)).clean;
    r = go(r, { t: 'launder', amount: 2000 });
    expect(hqOf(blk(r)).wash[0]!.net).toBe(1800);
    r = go(go(r, { t: 'toDay' }), { t: 'endDay' });
    r = night(r);
    expect(hqOf(blk(r)).clean).toBeGreaterThanOrEqual(clean0 + 1800 + 150);
    expect(heldDistricts(blk(r))).toContain('pewter');
  });
  it('a Safehouse cools its district once and adds Control there every week', () => {
    let r = withRun(rich(started(), 6000), (b) => { b.field.districts.pewter!.heat = 40; });
    r = night(go(r, { t: 'build', building: 'safehouse', district: 'pewter' }));
    expect(blk(r).report.join(' ')).toContain('Heat there −15');
  });
});

describe('DOMINION D5: going broke and loans (A22)', () => {
  it('broke at the weekly bill: the costliest room shuts, Defense drops; paid up, it opens again', () => {
    let r = night(go(rich(started(), 5000), { t: 'build', building: 'training-room', district: null }));
    const b = structuredClone(blk(r));
    b.funds = -100;
    b.day = 7;
    const lines = hqStep(b);
    expect(lines.join(' ')).toContain('Broke');
    expect(b.hq!.broke).toBe(true);
    expect(b.hq!.rooms[0]!.shut).toBe(true);
    expect(hqFx(b).trainXp).toBe(0);
    expect(defense(b)).toBe(0);
    b.funds = 500;
    b.day = 8;
    expect(hqStep(b).join(' ')).toContain('opens again');
    expect(b.hq!.broke).toBe(false);
    r = withRun(r, () => undefined);
    expect(blk(r).hq!.broke).toBe(false);
  });
  it('a Fence lends up to ₽5,000 x HQ level (boundary), 20% a week, and takes a Front after four weeks', () => {
    let r = rich(started(), 6000);
    r = go(r, { t: 'build', building: 'front-shop', district: 'pewter' });
    r = go(r, { t: 'loan', amount: 9000 });
    expect(hqOf(blk(r)).loan!.owed).toBe(5000);
    expect(refused(r, { t: 'loan', amount: 1 })).toContain('up to ₽5000');
    const b = structuredClone(blk(r));
    for (let w = 1; w <= 3; w++) {
      b.day = 7 * w;
      hqStep(b);
    }
    expect(b.hq!.loan!.owed).toBe(Math.round(Math.round(Math.round(5000 * 1.2) * 1.2) * 1.2));
    b.day = 28;
    expect(hqStep(b).join(' ')).toContain('takes the Front Shop');
    expect(b.hq!.loan).toBeNull();
    expect(b.hq!.rooms.some((x) => x.id === 'front-shop')).toBe(false);
    const paid = go(r, { t: 'repay', amount: 5000 });
    expect(hqOf(blk(paid)).loan).toBeNull();
  });
  it('let a member go (they take their Pokémon); never the last one', () => {
    let r = go(rich(started(), 6000), { t: 'hire', index: 0 });
    expect(blk(r).members).toHaveLength(2);
    r = go(r, { t: 'letGo', member: blk(r).members[1]!.id });
    expect(blk(r).members).toHaveLength(1);
    expect(blk(r).crew!.gone.at(-1)!.why).toBe('let go');
    expect(refused(r, { t: 'letGo', member: blk(r).members[0]!.id })).toContain('last member');
  });
  it('the stores hold 20 Pokémon (more with Pokémon Storage): the rest are let go and the report says so', () => {
    const r = withRun(started(), (b) => {
      const run = started();
      for (let i = 0; i < 22; i++) b.crew!.stores.push(newMon(content, run, 'rattata', 3, 'p'));
      b.crew!.pending.push({ k: 'item', id: 'potion', n: 1 });
    });
    const out = settleCrew(content, r);
    expect(blk(out).crew!.stores).toHaveLength(20);
    expect(blk(out).report.at(-1)).toContain('2 Pokémon had to be let go');
  });
});

describe('DOMINION D5: screens and saves', () => {
  it('the HQ menu model (mockup 6): LV CAP on the top bar, a cell per slot, the blueprint in the first empty slot', () => {
    const r = go(rich(started(), 6000), { t: 'build', building: 'bunk-room', district: null });
    const m = baseModel(blk(r), 100, 0, null, null);
    expect(m.top.regionLabel).toBe('LV CAP');
    expect(m.top.region).toBe('15');
    expect(m.top.sub).toBe('THE WAREHOUSE · LV. 1');
    expect(m.cells.reduce((a, c) => a + c.span, 0)).toBe(3);
    expect(m.cells.find((c) => c.state === 'blueprint')!.name).toBe('TRAINING ROOM');
    expect(m.cells[0]!.state).toBe('work');
    expect(m.build.rows[0]!.def.id).toBe('training-room');
    expect(m.next.to).toBe(2);
    expect(shortFx(buildingDef('barracks')!, 1)).toBe('2 slots · crew +6');
    expect(shortFx(buildingDef('treasury')!, 3)).toBe('₽30k safe');
    expect(assetsModel(blk(r), 0).rows).toHaveLength(1);
    expect(moneyModel(blk(r), 0, 0).rows.map((x) => x.id)).toContain('borrow');
    expect(upgradeInfo(blk(r), 100).needs[0]!.label).toContain('clean');
  });
  it('saves and reloads through a week with rooms, a loan and money in the wash', () => {
    let r = rich(started('save5'), 9000, 0);
    r = go(r, { t: 'build', building: 'front-shop', district: 'pewter' });
    r = go(r, { t: 'build', building: 'bunk-room', district: null });
    r = go(r, { t: 'loan', amount: 1000 });
    r = go(go(night(r), { t: 'toDay' }), { t: 'launder', amount: 500 });
    r = go(r, { t: 'endDay' });
    const storage = new MemoryStorageProvider();
    for (let i = 0; i < 8; i++) {
      new SaveManager(storage, content).saveRun(r);
      const loaded = new SaveManager(storage, content).loadRun();
      expect(loaded.status).toBe('ok');
      if (loaded.status !== 'ok') return;
      expect(loaded.data).toEqual(r);
      r = round(loaded.data);
    }
    expect(hqOf(blk(r)).loan!.weeks).toBe(1);
  });
  it('a damaged HQ does not pass the schema (failure)', () => {
    const b = blk(go(started(), { t: 'build', building: 'bunk-room', district: null }));
    const bad = structuredClone(b);
    bad.hq!.rooms[0]!.cond = 140;
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
    const bad2 = structuredClone(b);
    bad2.hq!.rooms[0]!.tier = 9;
    expect(DominionBlockSchema.safeParse(bad2).success).toBe(false);
  });
});
