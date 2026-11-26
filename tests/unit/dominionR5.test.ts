// DOMINION redesign R5 (pass 50, the Crew group): the display models in crewR50.ts read the block and never change
// it; the pages keep the old test ids; empty and boundary cases (no suspects, no hero, a stat at the cap).
import { describe, expect, it } from 'vitest';
import { withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import {
  r5Band, r5Edge, r5Loyalty, r5Member, r5Members, r5Mole, r5Payday, r5People, r5Pull, r5RosterHead, r5Training,
} from '../../src/core/dominion/crewR50';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import type { DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import {
  r5Edge as edgeView, r5Id, r5Loyalty as loyaltyView, r5Mole as moleView, r5Payday as paydayView, r5People as peopleView,
  r5Pull as pullView, r5Roster, r5Train, type R5CrewCtx,
} from '../../src/ui/redux/screens/dominion/r50/crew';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { content } from './helpers';

const block = (): DominionBlock => {
  const run = chooseStarter(content, createRun(content, { runId: 'r5', seed: 'r5', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return withCrew(out.run.expansion!.dominion!);
};
/** A second member (test set-up only), as the e2e spec's crew. */
const two = (): DominionBlock => {
  const b = block();
  const m = structuredClone(b.members[0]!);
  Object.assign(m, { id: 't2', name: 'Gus', look: 'trainer/pr/harlequin', loyalty: 20, wage: 250 });
  b.members.push(m);
  return b;
};
const ctx = (b: DominionBlock, notice: string | null = null): R5CrewCtx => ({ run: r5RunOf(b, []), team: null, monFile: () => null, notice });

describe('redesign R5: the crew models read the block only', () => {
  it('roster, band, payday, loyalty, training, mole, pull, edge and people leave the block as it was', () => {
    const b = two();
    const before = JSON.stringify(b);
    const m = r5Member(b, b.members[0]!);
    expect(m.name).toBe(b.members[0]!.name);
    expect(m.stats).toHaveLength(5);
    expect(r5Members(b)).toHaveLength(2);
    expect(r5RosterHead(b)).toContain(String(b.rosterCap));
    r5Band(b, m);
    r5Payday(b);
    r5Training(b, 0);
    r5Mole(b);
    r5Pull(b, 't2');
    r5Edge(b);
    r5People(b);
    expect(JSON.stringify(b)).toBe(before);
  });

  it('loyalty: sorted high to low, the lowest named when under the walk-out line', () => {
    const b = two();
    const ly = r5Loyalty(b);
    expect(ly.rows.map((r) => r.loyalty)).toEqual([...ly.rows.map((r) => r.loyalty)].sort((a, z) => z - a));
    expect(ly.low).toBe(20 < DOMINION_DATA.crew.rules.disloyalAt ? 'Gus' : null);
  });

  it('training: the switched-on Training and Growth tasks, open ones first, locked ones say why', () => {
    const t = r5Training(two(), 0);
    const live = DOMINION_DATA.tasks.filter((x) => x.group === 'Training and Growth' && x.status !== 'disabled');
    expect(t.rows).toHaveLength(live.length);
    expect(t.rows.some((r) => r.id === 'read-the-bosss-manifesto')).toBe(false);
    const firstLocked = t.rows.findIndex((r) => r.locked);
    if (firstLocked >= 0) expect(t.rows.slice(firstLocked).every((r) => r.locked)).toBe(true);
    // A brand-new grunt can't teach a move (Sergeant and up).
    expect(t.rows.find((r) => r.id === 'teach-a-move')?.locked).toBeTruthy();
    // Out-of-range cursors are clamped, not thrown.
    expect(r5Training(two(), 99).member).toBe('Gus');
  });

  it('mole hunt: nobody on the wall without suspicion or clues; the most suspected first, at most three', () => {
    const b = two();
    expect(r5Mole(b).suspects).toEqual([]);
    expect(r5Mole(b).note).toBeNull();
    b.spies = { moles: [], sus: { t2: 81 }, quiet: {}, talk: null, done: [], clues: [{ member: 't2', day: 1, text: 'Paid off a debt in cash' }] };
    const w = r5Mole(b);
    expect(w.suspects[0]).toMatchObject({ id: 't2', name: 'Gus', sus: 81, clue: 'Paid off a debt in cash' });
    expect(w.note).toEqual({ text: 'Paid off a debt in cash', day: 1 });
    expect(w.suspects.length).toBeLessThanOrEqual(3);
  });

  it('new card: the best stat, beds and wage; an unknown id gives null', () => {
    const b = two();
    const p = r5Pull(b, 't2')!;
    expect(p.beds).toBe(`Barracks 2 of ${b.rosterCap} beds`);
    expect(p.best.value).toBe(Math.max(...Object.values(b.members[1]!.stats)));
    expect(p.wage).toBe(250);
    expect(r5Pull(b, 'nobody')).toBeNull();
  });

  it('boss edge: five stats with the XP to the next point; a stat at the cap reads max', () => {
    const b = block();
    const e = r5Edge(b);
    expect(e.rows.map((r) => r.label)).toEqual(['Brawn', 'Nerve', 'Wits', 'Charm', 'Stealth']);
    expect(e.rows[0]!.need).toBe(b.field.edge.stats.brawn * DOMINION_DATA.field.edge.xpPerPoint);
    b.field.edge.stats.wits = DOMINION_DATA.field.edge.cap;
    expect(r5Edge(b).rows[2]!.max).toBe(true);
  });

  it('people: the crew, the rival teams in play, the law; the Hero only once there is one', () => {
    const b = two();
    const sides = r5People(b);
    expect(sides[0]!.people.map((p) => p.i)).toEqual([0, 1]);
    expect(sides.at(-1)!.title).toBe('The law');
    expect(sides.some((s) => s.title === 'The Hero')).toBe(!!b.hero);
    const noHero = { ...b, hero: undefined } as DominionBlock;
    expect(r5People(noHero).some((s) => s.title === 'The Hero')).toBe(false);
  });
});

describe('redesign R5: the pages', () => {
  it('keep their test ids and never name the helper anything but Rotom', () => {
    const b = two();
    const x = ctx(b);
    const m = r5Member(b, b.members[0]!);
    const pages = [
      r5Roster({ members: r5Members(b), sel: 0, head: r5RosterHead(b) }, x),
      r5Id(m, 0, r5Band(b, m), x, 'Ready.'),
      loyaltyView(r5Loyalty(b).rows.map((r, i) => ({ ...r, i })), 0, x, null),
      paydayView(r5Payday(b), () => 0, 0, x, null),
      r5Train(r5Training(b, 0), 0, 0, x),
      moleView(r5Mole(b), 0, x, null),
      pullView(r5Pull(b, 't2')!, 1, ctx(b, 'Gus joined the crew.')),
      edgeView(r5Edge(b), { pic: '', name: 'Red' }, x),
      peopleView(r5People(b), 0, x),
    ];
    for (const [html, id] of pages.map((h, i) => [h, ['roster', 'idcard', 'loyalty', 'payday', 'school', 'mole', 'pull', 'levelup', 'people'][i]!] as const)) {
      expect(html, id).toContain(`data-testid="r5-${id}"`);
      expect(html, id).not.toMatch(/Claude|\bAI\b/);
    }
    expect(pages[0]).toContain('data-testid="r5-card-1"');
    expect(pages[6]).toContain('data-testid="dom-notice"');
    expect(pages[6]).toContain('joined');
    // An empty wall says so and offers no Question button.
    expect(pages[5]).toContain('No names on the wall yet');
    expect(pages[5]).not.toContain('r5-mole-ask');
  });
});
