// DOMINION redesign R2: the HQ's floors and plots, the Staff Office posts and gear, and the HQ pages' view models
// (core/dominion/floors.ts, staff.ts, floorScreens.ts). Normal, boundary and failure cases.
import { describe, expect, it } from 'vitest';
import { freshChair } from '../../src/core/dominion/chair';
import { buildModel, floorModel, gearModel, launderModel, newFloorModel, plotModel, postModel, shortWhy } from '../../src/core/dominion/floorScreens';
import { buyPlot, firstFit, floorDue, floorName, floorsOpen, freeOn, layout, plotPrice, plotsOn, seeFloor, totalPlots, usedOn } from '../../src/core/dominion/floors';
import { hqFx } from '../../src/core/dominion/hqFx';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { buyGear, post, postHolder, setRule, skillOf, staffNight, staffOf } from '../../src/core/dominion/staff';
import { DominionBlockSchema, type DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const started = (seed = 'r2f'): RunState => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, r, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  const run = structuredClone(stepInRun(content, out.run, { t: 'open' }).run);
  run.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const room = (uid: string, id: string, floor?: number) => ({ uid, id, tier: 1, cond: 100, spent: 1000, building: false, up: false, ready: 0, shut: false, ruined: false, at: null, ...(floor ? { floor } : {}) });
/** A block at HQ level `lv` with `funds`. */
const at = (lv: number, funds = 1000): DominionBlock => ({ ...structuredClone(blk(started())), hqLevel: lv, funds });

describe('floors and plots', () => {
  it('one floor per HQ level, with its free plots and fixture', () => {
    const b = at(1);
    expect(floorsOpen(b)).toBe(1);
    expect(plotsOn(b, 1)).toBe(3);
    expect(plotsOn(b, 2)).toBe(0);
    expect(totalPlots(b)).toBe(3);
    const b3 = at(3);
    expect(totalPlots(b3)).toBe(3 + 3 + 4);
    // The fixtures add to the HQ's numbers: the Loading Dock's storage, the Lookout Post's Defense.
    expect(hqFx(b3).defense).toBeGreaterThanOrEqual(hqFx(at(2)).defense + 1);
    expect(floorsOpen(at(9))).toBe(6);
    expect(floorName(2)).toBe('the Cellar');
    expect(floorName(3)).toBe('the Upper Floor');
  });

  it('old rooms without a floor are packed from the ground up; set floors stay', () => {
    const b = at(2);
    b.hq!.rooms = [room('a', 'bunk-room'), room('b', 'bunk-room'), room('c', 'bunk-room'), room('d', 'bunk-room'), room('e', 'treasury', 1)];
    const l = layout(b);
    expect(l.get('e')).toBe(1);
    expect([l.get('a'), l.get('b'), l.get('c'), l.get('d')]).toEqual([1, 1, 2, 2]);
    expect(usedOn(b, 1)).toBe(3);
    expect(freeOn(b, 1)).toBe(0);
    expect(firstFit(b, 1)).toBe(2);
    expect(firstFit(b, 4)).toBeNull();
  });

  it('buys a plot: price steps up 50% each, dirty money first, refused when locked, sold out or short', () => {
    const b = at(2, 10_000);
    expect(plotPrice(b, 2)).toBe(2500);
    const one = buyPlot(b, 2);
    expect(one.ok).toBe(true);
    expect(one.block.funds).toBe(7500);
    expect(plotsOn(one.block, 2)).toBe(4);
    expect(one.notice).toContain('the Cellar');
    expect(plotPrice(one.block, 2)).toBe(3750);
    const two = buyPlot(one.block, 2);
    expect(two.ok).toBe(true);
    // The Cellar sells two: none left.
    expect(plotPrice(two.block, 2)).toBeNull();
    const none = buyPlot(two.block, 2);
    expect(none.ok).toBe(false);
    expect(none.block).toBe(two.block);
    expect(buyPlot(b, 3).ok).toBe(false);
    expect(buyPlot(b, 3).notice).toMatch(/Lv/);
    expect(buyPlot(at(2, 100), 2).notice).toContain('Not enough money');
    expect(buyPlot(b, 0).ok).toBe(false);
    expect(buyPlot(b, 1.5).ok).toBe(false);
    // The bought block still passes the save schema.
    expect(DominionBlockSchema.safeParse(two.block).success).toBe(true);
  });

  it('the New floor page is due once after an upgrade opens a floor; old saves never see it', () => {
    const b = at(3);
    b.hq!.floorSeen = 2;
    expect(floorDue(b)).toBe(3);
    expect(floorDue(seeFloor(b).block)).toBeNull();
    const old = at(3);
    delete old.hq!.floorSeen;
    expect(floorDue(old)).toBeNull();
    expect(newFloorModel(b)?.title).toContain('Upper Floor');
  });

  it('a room is built on the floor you pick, and refused there when it is full', () => {
    let r = started();
    blk(r).funds = 5000;
    blk(r).hqLevel = 2;
    const ok = stepInRun(content, r, { t: 'build', building: 'bunk-room', district: null, floor: 1 });
    expect(ok.ok, ok.notice ?? '').toBe(true);
    r = ok.run;
    expect(blk(r).hq!.rooms.at(-1)!.floor).toBe(1);
    blk(r).hq!.rooms.push(room('f1', 'bunk-room', 1), room('f2', 'bunk-room', 1));
    const full = stepInRun(content, r, { t: 'build', building: 'bunk-room', district: null, floor: 1 });
    expect(full.ok).toBe(false);
    expect(full.notice).toContain('No room on the Ground Floor');
  });
});

describe('the Staff Office', () => {
  it('posts a member, moves them between posts, and clears a post', () => {
    const b = at(3);
    const id = b.members[0]!.id;
    const p = post(b, 'checker', id);
    expect(p.ok).toBe(true);
    expect(postHolder(p.block, 'checker')?.id).toBe(id);
    const moved = post(p.block, 'books', id);
    expect(postHolder(moved.block, 'checker')).toBeNull();
    expect(postHolder(moved.block, 'books')?.id).toBe(id);
    expect(postHolder(post(moved.block, 'books', null).block, 'books')).toBeNull();
    expect(post(b, 'checker', 'nobody').ok).toBe(false);
  });

  it('gear costs money, tops out at 5, and skill = gear + half the stat', () => {
    let b = at(3, 1_000_000);
    const id = b.members[0]!.id;
    b = post(b, 'checker', id).block;
    expect(skillOf(b, 'checker')).toBe(0);
    const g1 = buyGear(b, 'checker');
    expect(g1.ok).toBe(true);
    expect(g1.block.funds).toBe(1_000_000 - 1500);
    expect(skillOf(g1.block, 'checker')).toBe(1 + Math.floor(b.members[0]!.stats.wits / 2));
    let x = g1.block;
    for (let i = 0; i < 4; i++) x = buyGear(x, 'checker').block;
    expect(staffOf(x).checker.gear).toBe(5);
    expect(buyGear(x, 'checker').ok).toBe(false);
    expect(buyGear(at(3, 100), 'books').notice).toContain('Not enough money');
  });

  it('rules cycle both ways and wrap', () => {
    const b = at(3);
    const up = setRule(b, 'budget', undefined, 1).block;
    expect(staffOf(up).budget).toBe((staffOf(b).budget + 1) % 5);
    const down = setRule(b, 'beds', undefined, -1).block;
    expect(staffOf(down).beds).toBe((staffOf(b).beds + 3) % 4);
    const off = setRule(b, 'on', 'care', 1).block;
    expect(staffOf(off).care.on).toBe(!staffOf(b).care.on);
    expect(setRule(b, 'on', undefined, 1).ok).toBe(false);
  });

  it('nothing happens at night without a geared, posted holder', () => {
    const b = at(3);
    expect(staffNight(b)).toEqual([]);
    const posted = post(b, 'books', b.members[0]!.id).block;
    expect(staffNight(posted)).toEqual([]);
  });
});

describe('the HQ pages (view models)', () => {
  it('a floor shows its fixture, rooms, the Staff Office on its floor, free plots and one for sale', () => {
    const b = at(3);
    b.hq!.rooms = [room('a', 'bunk-room', 3)];
    const m = floorModel(b, 3, 0);
    expect(m.tiles.map((t) => t.kind)).toEqual(['fix', 'room', 'staff', 'free', 'free', 'free', 'sale']);
    expect(m.head).toBe('Upper Floor · 1 of 4 plots used · 2 for sale');
    expect(floorModel(b, 1, 0).tiles.some((t) => t.kind === 'staff')).toBe(false);
  });

  it('Buy a plot lists the open floors and the next one locked', () => {
    const m = plotModel(at(2, 99_999), 0);
    expect(m.rows.map((r) => r.f)).toEqual([1, 2, 3]);
    expect(m.rows[2]!.locked).toBe(true);
  });

  it('Build a room puts what you can build first and says why the rest can not, in a few words', () => {
    const m = buildModel(at(1, 1000), 1, 0);
    expect(m.head).toMatch(/^What goes on the new Ground Floor plot\? · 1\/\d+$/);
    expect(m.cells[0]!.ok).toBe(true);
    const all = Array.from({ length: m.pages }, (_, p) => buildModel(at(1, 1000), 1, p * 6).cells).flat();
    const firstNo = all.findIndex((c) => !c.ok);
    expect(all.slice(firstNo).every((c) => !c.ok)).toBe(true);
    expect(all[firstNo]!.sub).toMatch(/not enough money|needs HQ Lv \d/);
    expect(shortWhy('No room on the Cellar for that (2 plots needed). Pick another floor (F) or buy a plot (P).')).toBe('no free plot here');
    expect(shortWhy('Needs HQ Lv. 3.')).toBe('needs HQ Lv 3');
    // A page past the end clamps to the last room.
    expect(buildModel(at(1), 1, 10_000).page).toBe(m.pages - 1);
  });

  it('a post file, the gear columns and the Laundromat read the block without changing it', () => {
    const b = at(3);
    const snap = structuredClone(b);
    expect(postModel(b, 'checker', 0).facts.length).toBeGreaterThan(0);
    expect(gearModel(b).length).toBe(3);
    expect(launderModel(b, 0).opt).toBe('w500');
    expect(launderModel(b, -1).opt).toBe('repayAll');
    expect(b).toEqual(snap);
  });
});
