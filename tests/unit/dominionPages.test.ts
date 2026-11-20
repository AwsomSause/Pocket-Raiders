// DOMINION D29: the Assign a task page (round-4 mockup m3) and the District file page (m4), split out of the Morning and
// the Region Map. The pages only re-show D3's and D2/D6's numbers: these tests pin that they match, plus the grouping.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assignCount, assignModel, assignTaskAt, ASSIGN_PAGE } from '../../src/core/dominion/assignScreen';
import { cantTake, taskById, withCrew } from '../../src/core/dominion/crew';
import { morningModel, taskIds } from '../../src/core/dominion/crewScreens';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { districtModel, districtOrder, groupOf } from '../../src/core/dominion/districtScreen';
import { gridPages, mapModel, newCursor, type MapCursor } from '../../src/core/dominion/fieldScreens';
import { freshHero, heroAt } from '../../src/core/dominion/hero';
import { freshChair } from '../../src/core/dominion/chair';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import type { DominionAction, DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const F = DOMINION_DATA.field;
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
const started = (seed = 'd29'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  const r = structuredClone(stepInRun(content, out.run, { t: 'open' }).run);
  r.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return r;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const answerAll = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
/** The Morning of Day 2 (talks answered), where the crew is given its orders. */
const morning = (seed?: string): RunState => answerAll(go(go(started(seed), { t: 'toNight' }), { t: 'rest' }));
const day = (seed?: string): RunState => go(morning(seed), { t: 'toDay' });
const at = (b: DominionBlock, district: string, extra: Partial<MapCursor> = {}): MapCursor => ({ ...newCursor(b), district, ...extra });

describe('DOMINION D29: the District file groups', () => {
  it('every action list section has a group, and the groups are Money, Muscle and Shadow', () => {
    const sections = new Set(DOMINION_DATA.actions.actions.map((a) => a.section));
    for (const s of sections) expect(F.file.sections[s], s).toBeDefined();
    expect(F.file.groups.map((g) => g.id)).toEqual(['money', 'muscle', 'shadow']);
    for (const id of Object.keys(F.file.byAction)) expect(DOMINION_DATA.actions.actions.some((a) => a.id === id), id).toBe(true);
  });

  it('every icon the page draws exists', () => {
    const icons = [...Object.values(F.file.icons), ...Object.values(F.file.kindIcons), ...F.file.groups.map((g) => g.icon)];
    for (const ic of icons) expect(existsSync(`public/assets/images/dominion/${ic}.png`), ic).toBe(true);
  });

  it('the starting nine read as the mockup: Money, Muscle, Shadow, three each', () => {
    const r = day();
    const b = blk(r);
    const page = gridPages(b)[0]!;
    const order = districtOrder(b, 0).map((slot) => page[slot]);
    expect(order).toEqual(['extort', 'take', 'catch', 'steal', 'thieve', 'attack', 'recruit', 'scout', 'lay-low']);
    const m = districtModel(b, r, at(b, 'cerulean'));
    expect(m.columns.map((c) => [c.group, c.acts.map((a) => a.key)])).toEqual([['money', [1, 2, 3]], ['muscle', [4, 5, 6]], ['shadow', [7, 8, 9]]]);
    expect(groupOf('take')).toBe('money');
    expect(groupOf('attack')).toBe('muscle');
  });

  it('every page shows each of its actions once, keys 1 to n in shown order', () => {
    const r = day();
    const b = blk(r);
    const pages = gridPages(b);
    for (let p = 0; p < pages.length; p++) {
      const order = districtOrder(b, p);
      expect([...order].sort((x, y) => x - y)).toEqual(pages[p]!.map((_, i) => i));
      const m = districtModel(b, r, at(b, 'pewter', { page: p, at: order[0]! }));
      expect(m.columns.flatMap((c) => c.acts.map((a) => a.key))).toEqual(order.map((_, i) => i + 1));
      expect(m.columns.flatMap((c) => c.acts).filter((a) => a.on)).toHaveLength(1);
    }
  });
});

describe('DOMINION D29: the District file shows D2 and D6 numbers', () => {
  it('dials, Regard and Dread, the stamp and the button match the map for the same cursor', () => {
    const r = day();
    const b = blk(r);
    const c = at(b, 'cerulean', { at: 0, focus: 'grid' });
    const map = mapModel(b, r, c);
    const m = districtModel(b, r, c);
    expect([m.control, m.heat, m.rival, m.regard, m.dread]).toEqual([map.file.control, map.file.heat, map.file.rival, map.file.regard, map.file.dread]);
    expect(m.stamp).toEqual(map.file.stamp);
    expect(m.cta).toBe(map.cta);
    expect(m.cta).toBe('Extort the Bike Shop');
    expect(m.targets.map((t) => t.id)).toEqual(F.districts.find((d) => d.id === 'cerulean')!.targets.map((t) => t.id));
    expect(m.targets[0]!.pays).toMatch(/^Pays ₽/);
    expect(m.targets[0]!.note).toBe('Stubborn · guard: His nephew');
    expect(m.goal).toBe(`Reach ${F.control.held} control to make Cerulean Held.`);
    expect(m.left).toMatch(/actions? left today/);
    expect(m.top.region).toBe('Map › Cerulean');
    expect(m.banner).toBeNull();
  });

  it('a held district says how to keep it; a district the Hero is in has the red banner', () => {
    const r = day();
    const b = structuredClone(blk(r));
    b.field.districts.cerulean!.control = F.control.held + 5;
    expect(districtModel(b, r, at(b, 'cerulean')).goal).toBe(`Cerulean is yours: keep Control over ${F.control.held} to hold it.`);
    b.hero = { ...freshHero(b.day, DOMINION_DATA.hero.heroes[0]!.id), met: true };
    const where = heroAt(b);
    const m = districtModel(b, r, at(b, where));
    expect(m.banner?.text).toMatch(/ IS IN .* TODAY$/);
  });

  it('an unknown district falls back to the HQ, and reading the page changes nothing', () => {
    const r = day();
    const before = structuredClone(blk(r));
    const m = districtModel(blk(r), r, at(blk(r), 'nowhere'));
    expect(m.id).toBe(F.hq);
    expect(blk(r)).toEqual(before);
  });
});

describe('DOMINION D29: the Assign a task page shows D3 numbers', () => {
  it('the quick six are the Morning list with the same odds; the top bar says where you are', () => {
    const r = morning();
    const b = blk(r);
    const am = assignModel(b, 0, 0, false);
    const mm = morningModel(b, 0, 0, false);
    expect(am.cards.map((c) => [c.id, c.odds])).toEqual(mm.tasks.map((t) => [t.id, t.odds]));
    expect(am.cards).toHaveLength(ASSIGN_PAGE);
    expect(am.top.region).toBe('Morning › Assign');
    expect(am.cards.filter((c) => c.on).map((c) => c.id)).toEqual([DOMINION_DATA.crew.quick[0]]);
    expect(am.cta).toBe('Give the order');
  });

  it('Best fit is the open task with the best real odds; sure things and locked tasks never are', () => {
    const r = morning();
    const b = withCrew(blk(r));
    for (let sel = 0; sel < b.members.length; sel++) {
      const am = assignModel(b, sel, 0, false);
      const best = am.cards.filter((c) => c.best);
      expect(best.length).toBeLessThanOrEqual(1);
      const open = am.cards.filter((c) => !c.locked && c.odds !== 'sure');
      if (!open.length) expect(best).toHaveLength(0);
      else expect(Number.parseInt(best[0]!.odds, 10)).toBe(Math.max(...open.map((c) => Number.parseInt(c.odds, 10))));
      for (const c of am.cards) if (c.locked) expect(c.best).toBe(false);
    }
  });

  it('the cards carry each task\'s pay, Heat, stat and risk from tasks.json', () => {
    const am = assignModel(blk(morning()), 0, 0, false);
    const sd = am.cards.find((c) => c.id === 'shake-down')!;
    const t = taskById('shake-down')!;
    expect(sd.pay).toBe(`₽${t.effect!.funds![0]}–${t.effect!.funds![1]}`);
    expect(sd.heat).toBe(`Heat +${t.effect!.heat}`);
    expect(sd.uses).toBe('uses Nerve');
    expect(sd.risk).toBe(t.risk);
    const rest = am.cards.find((c) => c.id === 'rest')!;
    expect([rest.odds, rest.heat, rest.risk]).toEqual(['sure', 'no Heat', 'no risk']);
  });

  it('the full list pages six at a time; the cursor picks the page; out of range gives nothing', () => {
    const b = blk(morning());
    const m = withCrew(b).members[0]!;
    const n = taskIds(m).length;
    expect(assignCount(b, 0, true)).toBe(n);
    const last = n - 1;
    const am = assignModel(b, 0, last, true);
    expect(am.pages).toBe(Math.ceil(n / ASSIGN_PAGE));
    expect(am.page).toBe(Math.floor(last / ASSIGN_PAGE));
    expect(am.cards.find((c) => c.on)!.id).toBe(taskIds(m)[last]);
    expect(assignTaskAt(b, 0, true, last)).toBe(taskIds(m)[last]);
    expect(assignTaskAt(b, 0, true, n)).toBeNull();
    // Locked tasks keep D3's reason.
    const locked = assignModel(b, 0, n - 1, true).cards.filter((c) => c.locked);
    for (const c of locked) expect(c.locked).toBe(cantTake(m, taskById(c.id)!));
  });

  it('giving the order is D3\'s assign step: the card then says ON IT and the crew strip moves on', () => {
    let r = morning();
    const b = withCrew(blk(r));
    const id = assignTaskAt(b, 0, false, DOMINION_DATA.crew.quick.indexOf('rest'))!;
    expect(id).toBe('rest');
    r = go(r, { t: 'assign', member: b.members[0]!.id, task: id });
    const am = assignModel(blk(r), 0, 0, false);
    expect(am.cards.find((c) => c.id === 'rest')!.current).toBe(true);
    expect(am.member.role).toContain('Rest');
    expect(am.others.every((o) => o.id !== b.members[0]!.id)).toBe(true);
  });
});
