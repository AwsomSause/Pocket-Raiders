// DOMINION redesign R5: the simple rules behind the seven Crew pages that had no mechanic (evening off, storm night,
// dressing room, Boss skills, team tag, bonds, card binder), and their pages. Normal, boundary and failure cases; every
// rule leaves the input block alone (copy on write) and rolls nothing.
import { describe, expect, it } from 'vitest';
import { crewOf, withCrew } from '../../src/core/dominion/crew';
import {
  binderOf, bondsOf, cantLearn, downtime, offIn, outfitOf, pagesOf, shelter, skillPoints, spray, sprayIn, stormTonight, wear, learn,
} from '../../src/core/dominion/crewPages';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { hqFx } from '../../src/core/dominion/hqFx';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { r5Binder, r5Bonds, r5CrewMenu, r5Disguise, r5Downtime, r5Graffiti, r5Shelter, r5Skills } from '../../src/ui/redux/screens/dominion/r50/crewMore';
import { r5File } from '../../src/ui/redux/screens/dominion/r50/crew';
import { r5Member } from '../../src/core/dominion/crewR50';
import { fileModel } from '../../src/core/dominion/crewScreens';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { content } from './helpers';

const P = DOMINION_DATA.crewPages;
const block = (): DominionBlock => {
  const run = chooseStarter(content, createRun(content, { runId: 'cp', seed: 'cp', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const b = withCrew(startInRun(content, run, { types: ['poison', 'dark'], member: 'grunt', look: 0 }).run.expansion!.dominion!);
  for (const [id, name, day] of [['t2', 'Gus', 2], ['t3', 'Rosa', 3]] as const) {
    const m = structuredClone(b.members[0]!);
    Object.assign(m, { id, name, joinedDay: day });
    b.members.push(m);
  }
  b.funds = 5000;
  return b;
};
const evening = (day = P.shelter.from): DominionBlock => Object.assign(block(), { phase: 'evening', day });
const frozen = (b: DominionBlock) => JSON.stringify(b);

describe('Evening off', () => {
  it('sends a member to a place: Morale, cost, a cooldown; the input block is not changed', () => {
    const b = evening();
    const before = frozen(b);
    const gc = P.downtime.places.find((p) => p.id === 'game-corner')!;
    const out = downtime(b, 't2', 'game-corner');
    expect(out.ok).toBe(true);
    expect(frozen(b)).toBe(before);
    const m = out.block.members.find((x) => x.id === 't2')!;
    expect(m.morale).toBe(Math.min(100, b.members[1]!.morale + gc.morale));
    expect(out.block.funds).toBeLessThanOrEqual(b.funds - gc.cost);
    expect(offIn(out.block, 't2')).toBe(P.downtime.cooldown);
    // Boundary: again the same evening is refused; after the cooldown it is open.
    expect(downtime(out.block, 't2', 'pokemon-tower').ok).toBe(false);
    expect(offIn({ ...out.block, day: out.block.day + P.downtime.cooldown }, 't2')).toBe(0);
  });
  it('refuses outside the Evening, without money, or for an unknown place', () => {
    expect(downtime({ ...evening(), phase: 'morning' }, 't2', 'game-corner').ok).toBe(false);
    expect(downtime({ ...evening(), funds: 0 }, 't2', 'game-corner').ok).toBe(false);
    expect(downtime(evening(), 't2', 'the-moon').ok).toBe(false);
    expect(downtime(evening(), 'nobody', 'game-corner').ok).toBe(false);
    // A free place works with no money.
    expect(downtime({ ...evening(), funds: 0 }, 't2', 'training-hall').ok).toBe(true);
  });
});

describe('Storm night', () => {
  it('comes on the storm evenings only, and once', () => {
    expect(stormTonight(evening(P.shelter.from))).toBe(true);
    expect(stormTonight(evening(P.shelter.from + 1))).toBe(false);
    expect(stormTonight(evening(P.shelter.from + P.shelter.every))).toBe(true);
    expect(stormTonight({ ...evening(), phase: 'day' })).toBe(false);
    expect(shelter(evening(P.shelter.from + 1), 'keep').ok).toBe(false);
  });
  it('keep: the newest member\'s Loyalty and the food money; the storm is answered', () => {
    const b = evening();
    const keep = P.shelter.choices.find((c) => c.id === 'keep')!;
    const out = shelter(b, 'keep');
    expect(out.ok).toBe(true);
    const rosa = out.block.members.find((m) => m.id === 't3')!;
    expect(rosa.loyalty).toBe(Math.min(100, b.members[2]!.loyalty + keep.loyalty));
    expect(out.block.funds).toBeLessThanOrEqual(b.funds - keep.cost);
    expect(out.notice).toContain('Rosa');
    expect(stormTonight(out.block)).toBe(false);
    expect(shelter(out.block, 'feed').ok).toBe(false);
    expect(shelter(evening(), 'adopt-it-twice').ok).toBe(false);
  });
});

describe('Dressing room', () => {
  it('an outfit costs money and gives its effect once, however many wear it', () => {
    const b = evening();
    const base = hqFx(b).heatDay;
    const clown = P.outfits.find((o) => o.id === 'clown')!;
    const one = wear(b, 't2', 'clown');
    expect(one.ok).toBe(true);
    expect(outfitOf(one.block, 't2')).toBe('clown');
    expect(one.block.funds).toBe(b.funds - clown.cost);
    expect(hqFx(one.block).heatDay).toBe(base + clown.n);
    const two = wear(one.block, 't3', 'clown');
    expect(hqFx(two.block).heatDay).toBe(base + clown.n);
    // Back to team colours drops the entry.
    const back = wear(two.block, 't2', 'colours');
    expect(pagesOf(back.block).outfits.t2).toBeUndefined();
  });
  it('refuses an unknown outfit or without money', () => {
    expect(wear(evening(), 't2', 'ball-gown').ok).toBe(false);
    expect(wear({ ...evening(), funds: 0 }, 't2', 'lady').ok).toBe(false);
  });
});

describe('Boss skills', () => {
  it('one point per Edge point earned; learned in order down a branch; the effect counts', () => {
    const b = evening();
    expect(skillPoints(b)).toEqual({ earned: 0, spent: 0, free: 0 });
    expect(learn(b, 'glare').ok).toBe(false);
    b.field.edge.stats.brawn += 2;
    expect(skillPoints(b).free).toBe(2);
    expect(cantLearn(b, 'make-an-example')).toMatch(/Needs Glare/);
    const one = learn(b, 'glare');
    expect(one.ok).toBe(true);
    expect(hqFx(one.block).raidDef).toBe(hqFx(b).raidDef + 5);
    expect(cantLearn(one.block, 'glare')).toBe('Learned.');
    const two = learn(one.block, 'make-an-example');
    expect(two.ok).toBe(true);
    // Boundary: no points left.
    expect(skillPoints(two.block).free).toBe(0);
    expect(learn(two.block, 'skim').ok).toBe(false);
    expect(learn(two.block, 'no-such-skill').ok).toBe(false);
  });
});

describe('Team tag', () => {
  it('saved with no district; sprayed on owned districts adds Dread, costs paint, then waits a week', () => {
    const b = evening();
    const none = spray(b, 'bolt', '#e0294a', 'We were here');
    expect(none.ok).toBe(true);
    expect(pagesOf(none.block).tag).toEqual({ symbol: 'bolt', colour: '#e0294a', slogan: 'We were here' });
    expect(none.block.funds).toBe(b.funds);
    expect(sprayIn(none.block)).toBe(0);
    const id = Object.keys(b.field.districts).sort().find((k) => k !== DOMINION_DATA.field.hq) ?? Object.keys(b.field.districts)[0]!;
    b.field.districts[id]!.control = 100;
    b.field.districts[id]!.rival = 0;
    const dread = b.field.districts[id]!.dread;
    const out = spray(b, 'crown', '#ffd75a', 'Kanto is ours');
    expect(out.ok).toBe(true);
    expect(out.block.field.districts[id]!.dread).toBe(dread + P.graffiti.dread);
    expect(out.block.funds).toBeLessThan(b.funds);
    expect(sprayIn(out.block)).toBe(P.graffiti.every);
    expect(spray(out.block, 'crown', '#ffd75a', 'Kanto is ours').ok).toBe(false);
  });
  it('refuses a bad symbol, colour or slogan', () => {
    expect(spray(evening(), 'skull', '#e0294a', 'x').ok).toBe(false);
    expect(spray(evening(), 'bolt', 'red', 'x').ok).toBe(false);
    expect(spray(evening(), 'bolt', '#e0294a', '   ').ok).toBe(false);
  });
});

describe('Bonds and the binder (read only)', () => {
  it('squad mates over the line are best friends; a personality clash is a clash', () => {
    const b = evening();
    const t = (m: DominionBlock['members'][number], task: string, formed: string[]) => Object.assign(crewOf(m), { task, formed });
    t(b.members[0]!, 'rest', ['loyal']);
    t(b.members[1]!, 'patrol', ['schemer']);
    t(b.members[2]!, 'guard-hq', []);
    b.squads = { ...(b.squads ?? {}), list: [{ members: [b.members[0]!.id, b.members[2]!.id], cohesion: P.bonds.bestAt }] } as never;
    const before = frozen(b);
    const bonds = bondsOf(b);
    expect(frozen(b)).toBe(before);
    expect(bonds).toContainEqual(expect.objectContaining({ a: b.members[0]!.id, b: 't3', kind: 'best' }));
    expect(bonds).toContainEqual(expect.objectContaining({ a: b.members[0]!.id, b: 't2', kind: 'clash' }));
    expect(bonds.some((x) => x.a === 't2' && x.b === 't3')).toBe(false);
  });
  it('the crew page has everyone; rival cards wait to be met; a set needs every card', () => {
    const b = evening();
    const pages = binderOf(b);
    expect(pages[0]!.cards.map((c) => c.name)).toEqual(b.members.map((m) => m.name));
    expect(pages[0]!.cards.every((c) => c.met && c.lv !== null)).toBe(true);
    const rival = pages.find((p) => p.set?.label === P.binder.sets[0]!.label);
    if (rival) {
      expect(rival.set!.done).toBe(rival.cards.every((c) => c.met));
      expect(rival.cards.some((c) => !c.met)).toBe(true);
    }
    expect(pages.at(-1)!.title).toBe('Town');
  });
});

describe('saving', () => {
  it('a block with the new state parses back the same; an old block without it still parses', () => {
    let b = evening();
    b.field.edge.stats.brawn += 1;
    b = shelter(downtime(b, 't2', 'game-corner').block, 'keep').block;
    b = learn(wear(b, 't3', 'lady').block, 'glare').block;
    b = spray(b, 'eye', '#5ad1ff', 'We were here').block;
    const back = DominionBlockSchema.parse(JSON.parse(JSON.stringify(b)));
    expect(back.crewPages).toEqual(b.crewPages);
    const old = JSON.parse(JSON.stringify(evening()));
    delete old.crewPages;
    expect(DominionBlockSchema.parse(old).crewPages).toBeUndefined();
  });
});

describe('the pages', () => {
  it('keep their test ids, never change the block and never name the helper anything but Rotom', () => {
    const b = evening();
    const before = frozen(b);
    const x = { run: r5RunOf(b, []), team: null, monFile: () => null, notice: null };
    const pages: [string, string][] = [
      ['crewmenu', r5CrewMenu([{ id: 'bonds', label: 'Bonds', sub: 'Who likes whom', icon: 'g-letter', off: null }], 0, x)],
      ['binder', r5Binder(binderOf(b), 0, 0, x)],
      ['bonds', r5Bonds(b, 0, x)],
      ['downtime', r5Downtime(b, 0, 0, x)],
      ['shelter', r5Shelter(b, 0, x)],
      ['disguise', r5Disguise(b, 0, 0, x)],
      ['skills', r5Skills(b, 0, 0, { name: 'Red' }, x)],
      ['graffiti', r5Graffiti(b, { symbol: 0, colour: 0, slogan: 0 }, x)],
    ];
    for (const [id, html] of pages) {
      expect(html, id).toContain(`data-testid="r5-${id}"`);
      expect(html, id).not.toMatch(/Claude|\bAI\b/);
    }
    expect(pages[3]![1]).toContain('data-testid="r5-off-send"');
    expect(pages[4]![1]).toContain('data-testid="r5-storm-keep"');
    expect(pages[6]![1]).toContain('data-testid="r5-skill-glare"');
    expect(pages[7]![1]).toContain('data-testid="r5-tag-spray"');
    // Out-of-range cursors are clamped, not thrown.
    expect(r5Binder(binderOf(b), 99, 99, x)).toContain('r5-binder');
    expect(r5Skills(b, 99, 99, { name: 'Red' }, x)).toContain('r5-skill-');
    expect(frozen(b)).toBe(before);
  });
  it('the Crew File offers Let go, and asks again before it happens', () => {
    const b = evening();
    const x = { run: r5RunOf(b, []), team: null, monFile: () => null, notice: null };
    const m = r5Member(b, b.members[1]!);
    expect(r5File(fileModel(b, 1), m, 1, x)).toContain('data-testid="r5-letgo"');
    expect(r5File(fileModel(b, 1), m, 1, x, true)).toContain('Yes, let Gus go');
  });
});
