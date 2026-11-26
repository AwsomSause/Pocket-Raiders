// DOMINION redesign R4: the pass-50 battle pages' own rules (core/dominion/bossFights.ts). Power gear (which powers are
// open, carrying one puts its key item in the Bag), Phase two (a rival Boss beaten at the door rallies once), the crew's
// help before a fight (team-up, steps in), and the Betrayal (the admin turns, the Legendary can be caught). No rolls.
import { describe, expect, it } from 'vitest';
import raw from '../../src/data/dominion/fights.json';
import { fightsStep, assistDue, assistKind, betrayalLevel, FIGHTS, foePreview, GEAR, helpers, phaseWaiting, powerSlots } from '../../src/core/dominion/bossFights';
import { freshChair } from '../../src/core/dominion/chair';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { endDominionFight } from '../../src/core/dominion/fightEnd';
import { freshRealm, regionsInRun } from '../../src/core/dominion/regions';
import { maxHp } from '../../src/core/pokemon';
import { teamDef } from '../../src/core/dominion/rivals';
import type { DominionAction, DominionBlock, FieldFight } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, fightInRun, startInRun, stepInRun } from '../../src/core/dominion/session';
import { itemCount } from '../../src/core/items';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { r5CrewIn, r5Gear, r5Legend, r5Phase, r5Power, r5Snap, r5TeamUp } from '../../src/ui/redux/screens/dominion/r50/fights';
import type { R5Person } from '../../src/ui/redux/screens/dominion/r50/jobs';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { content } from './helpers';

const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'fights'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  const r = structuredClone(out.run);
  r.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return r;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const step = (r: RunState, a: DominionAction) => stepInRun(content, r, a);
const go = (r: RunState, a: DominionAction): RunState => {
  const out = step(r, a);
  expect(out.ok, out.notice ?? '').toBe(true);
  return out.run;
};
/** A run with a second member (so a team-up has two) on `day`. */
function withCrew(day: number): RunState {
  const r = started();
  const b = blk(r);
  b.day = day;
  const m = structuredClone(b.members[0]!);
  b.members.push({ ...m, id: `${m.id}-2`, name: 'Bram', team: m.team.map((x) => ({ ...x, uid: `${x.uid}-2` })) });
  return r;
}
const bossRaid = (): FieldFight => ({ why: 'rival', foe: 'rival', begun: false, action: 'boss-raid', target: 'boss', district: DOMINION_DATA.field.hq, pass: false, big: false, wager: 0, racket: 'rocket' });

describe('R4 fights.json', () => {
  it('parses; the gear is real key items, the betrayal legends and admins exist', () => {
    expect(FIGHTS._source).toBe(raw._source);
    for (const g of GEAR) expect(content.items.get(g.item)?.category, g.item).toBe('key');
    for (const [team, e] of Object.entries(FIGHTS.betrayal.teams)) {
      expect(content.species.has(e.legend), e.legend).toBe(true);
      expect(teamDef(team)?.admins.some((a) => a.id === e.admin), `${team} ${e.admin}`).toBe(true);
    }
  });
});

describe('R4 power gear', () => {
  it('opens one power after Day 5 of the first region, one more each region', () => {
    const r = started(), b = blk(r);
    b.day = 5;
    expect(powerSlots(content, b)).toBe(0);
    b.day = 6;
    expect(powerSlots(content, b)).toBe(1);
    const second = regionsInRun(b)[1];
    if (second) {
      b.realm = { ...freshRealm(), at: second };
      b.day = 1;
      expect(powerSlots(content, b)).toBe(1);
      b.day = 6;
      expect(powerSlots(content, b)).toBe(2);
    }
  });
  it('carrying a power puts its key item in the Bag, swapping takes back only what Dominion gave', () => {
    let r = started();
    blk(r).day = 2;
    const shut = step(r, { t: 'power', kind: 'mega' });
    expect(shut.ok).toBe(false);
    expect(shut.notice).toContain('Day 5');
    blk(r).day = 6;
    expect(step(r, { t: 'power', kind: 'tera' }).notice).toContain('Region 2');
    r = go(r, { t: 'power', kind: 'mega' });
    expect(itemCount(r.inventory, 'mega-ring')).toBe(1);
    expect(blk(r).jobx?.power).toEqual({ kind: 'mega', item: 'mega-ring', given: true });
    r = go(r, { t: 'power', kind: 'mega' });
    expect(itemCount(r.inventory, 'mega-ring')).toBe(1);
    // Two open: swapping to Tera takes the given Mega Ring back.
    const second = regionsInRun(blk(r))[1];
    if (second) {
      // (fightsStep straight: stepping the whole run would switch the region's data too.)
      blk(r).realm = { ...freshRealm(), at: second };
      const out = fightsStep(content, r, { t: 'power', kind: 'tera' });
      expect(out.ok).toBe(true);
      expect(itemCount(r.inventory, 'mega-ring')).toBe(0);
      expect(itemCount(r.inventory, 'tera-orb')).toBe(1);
    }
  });
  it('a ring the player already had is never taken', () => {
    let r = started();
    blk(r).day = 6;
    r.inventory['mega-ring'] = 1;
    r = go(r, { t: 'power', kind: 'mega' });
    expect(blk(r).jobx?.power?.given).toBe(false);
    expect(itemCount(r.inventory, 'mega-ring')).toBe(1);
  });
});

describe('R4 the crew helps before a fight', () => {
  it('a team-up away, steps in at the HQ, nothing for a street foe', () => {
    expect(assistKind({ ...bossRaid() })).toBe('crewin');
    expect(assistKind({ ...bossRaid(), phase: 2 })).toBe('teamup');
    expect(assistKind({ ...bossRaid(), why: 'raid', foe: 'raid', action: null })).toBe('crewin');
    expect(assistKind({ ...bossRaid(), why: 'hero', foe: 'hero', action: 'scout' })).toBe('teamup');
    expect(assistKind({ ...bossRaid(), why: 'fail', foe: 'target', action: 'scout' })).toBeNull();
    expect(assistKind({ ...bossRaid(), begun: true })).toBeNull();
  });
  it('steps in: the member\'s Pokémon pays for it, the foe lead starts hurt; once a fight', () => {
    let r = withCrew(6);
    blk(r).field.fight = bossRaid();
    expect(assistDue(blk(r))).toBe('crewin');
    expect(foePreview(blk(r), r)?.count).toBeGreaterThan(0);
    const id = helpers(blk(r))[1]!.m.id, before = helpers(blk(r))[1]!.mon.hp;
    r = go(r, { t: 'assist', by: [id] });
    const f = blk(r).field.fight!;
    expect(f.assist?.by).toEqual([id]);
    expect(f.assist!.cut).toBeGreaterThan(0);
    expect(blk(r).members.find((m) => m.id === id)!.team.find((x) => x.hp > 0)!.hp).toBeLessThan(before);
    expect(assistDue(blk(r))).toBeNull();
    expect(step(r, { t: 'assist', by: [] }).ok).toBe(false);
    const fought = fightInRun(content, r)!;
    const lead = fought.battle!.enemyTeam[fought.battle!.enemyIndex]!;
    expect(lead.hp).toBeLessThan(maxOf(lead));
  });
  it('not now: no help, the fight is unchanged', () => {
    let r = withCrew(6);
    blk(r).field.fight = bossRaid();
    r = go(r, { t: 'assist', by: [] });
    expect(blk(r).field.fight!.assist).toBeNull();
    const fought = fightInRun(content, r)!;
    const lead = fought.battle!.enemyTeam[fought.battle!.enemyIndex]!;
    expect(lead.hp).toBe(maxOf(lead));
  });
});

const maxOf = (m: Parameters<typeof maxHp>[1]): number => maxHp(content, m);

describe('R4 phase two and the Betrayal', () => {
  it('the Boss rallies once, with the crew\'s team-up and Attack up; then the admin turns and the Legendary waits', () => {
    let r = withCrew(6);
    blk(r).field.fight = bossRaid();
    r = go(r, { t: 'assist', by: [] });
    r = fightInRun(content, r)!;
    expect(r.battle).toBeTruthy();
    // Gym Leaders and Bosses follow the main game's rule: Day 6 of the first region gives Giovanni one power.
    expect(Object.keys(r.battle!.transform.bossPlan).length).toBeLessThanOrEqual(powerSlots(content, blk(r)));
    let lines = endDominionFight(content, r, 'win');
    expect(lines.join(' ')).toContain('Phase two');
    expect(blk(r).field.fight).toMatchObject({ why: 'rival', action: 'boss-raid', phase: 2, begun: false });
    expect(phaseWaiting(blk(r))).toBe(true);
    // Turned down once: phase two offers a team-up again.
    expect(assistDue(blk(r))).toBe('teamup');
    r = go(r, { t: 'assist', by: ['x'] });
    expect(blk(r).field.fight!.assist!.by).toHaveLength(2);
    expect(blk(r).field.fight!.assist!.cut).toBe(Math.min(FIGHTS.assist.teamup.max, 2 * FIGHTS.assist.teamup.per));
    r = fightInRun(content, r)!;
    expect(r.battle!.enemyStages.atk).toBe(FIGHTS.phase.atk);
    lines = endDominionFight(content, r, 'win');
    const f = blk(r).field.fight!;
    expect(f).toMatchObject({ why: 'betrayal', foe: 'betrayal', target: 'mewtwo', racket: 'rocket', begun: false });
    expect(blk(r).jobx?.betrayed).toEqual(['rocket']);
    expect(blk(r).jobx?.snap).toBeTruthy();
    r = fightInRun(content, r)!;
    const legend = r.battle!.enemyTeam[0]!;
    expect(legend.speciesId).toBe('mewtwo');
    expect(legend.level).toBe(betrayalLevel(FIGHTS.betrayal.teams.rocket!, r.party));
    expect(r.battle!.trainer ?? null).toBeNull();
    lines = endDominionFight(content, r, 'lose');
    expect(lines.join(' ')).toContain('Mewtwo');
    expect(blk(r).field.fight).toBeNull();
  });
  it('a lost phase one settles as a lost raid; the Betrayal comes once a team', () => {
    let r = withCrew(6);
    blk(r).field.fight = bossRaid();
    r = go(r, { t: 'assist', by: [] });
    r = fightInRun(content, r)!;
    endDominionFight(content, r, 'lose');
    expect(blk(r).field.fight).toBeNull();
    // Already betrayed: a second fall queues nothing.
    r = withCrew(6);
    blk(r).jobx = { called: null, album: [], snap: null, betrayed: ['rocket'] };
    blk(r).field.fight = { ...bossRaid(), phase: 2 };
    r = go(r, { t: 'assist', by: [] });
    r = fightInRun(content, r)!;
    endDominionFight(content, r, 'win');
    expect(blk(r).field.fight).toBeNull();
  });
});

describe('R4 the battle pages (display only)', () => {
  const run = () => r5RunOf(blk(started()), []);
  const person = (name: string): R5Person => ({ pic: '<i></i>', face: () => '<i></i>', name, role: 'r', colour: '#fff' });
  it('Power gear and Pick a power: four rows and cards, the cursor on one, locked ones marked', () => {
    const rows = GEAR.map((g, i) => ({ gear: g.gear, sub: g.name, tag: i ? `Region ${i + 1}` : 'Ready', icon: g.pic, ready: !i, carried: false }));
    const gear = r5Gear({ rows, at: 1, open: 1, pic: '', lines: ['a', 'b', 'c'], note: null }, run());
    expect(gear.match(/data-testid="dom-gear-\d"/g)).toHaveLength(4);
    expect(gear).toContain('Power gear · 1 of 4 unlocked');
    expect(gear).toContain('data-testid="dom-gear-pick"');
    const cards = GEAR.map((g, i) => ({ kind: g.kind, name: g.name, about: g.about, tag: 'x', icon: g.pic, art: '', ready: !i }));
    const power = r5Power({ cards, at: 0, sub: 'No gear carried', line: 'Bzzt!', verb: 'Mega Evolve' }, run());
    expect(power.match(/class="pwc [^"]*lock/g)).toHaveLength(3);
    expect(power.match(/class="pwc [^"]* on"/g)).toHaveLength(1);
    expect(power).toContain('data-testid="dom-power-use"');
  });
  it('Phase two, the team-up, Who steps in, the Betrayal and the Snapshot keep their test ids', () => {
    const r = run();
    expect(r5Phase({ boss: 'Giovanni', role: 'Boss', pic: '', word: 'Phase two', sub: 's', changes: FIGHTS.phase.changes, speaker: { name: 'Giovanni' }, line: 'l' }, r)).toContain('data-testid="dom-phase2-go"');
    const tu = r5TeamUp({ word: 'Nova Assault', sub: 's', crew: [{ name: 'Rosa', pic: '', mon: '' }], speaker: null, line: 'l', cut: 12 }, r);
    for (const id of ['dom-teamup', 'dom-assist-yes', 'dom-assist-no', 'dom-teamup-cut']) expect(tu, id).toContain(`data-testid="${id}"`);
    const ci = r5CrewIn({ foe: null, trainer: null, clock: { label: 'HQ raid', n: 3, unit: 'u' }, me: null, rows: [{ name: 'Rosa', mon: 'Weavile', face: '', colour: '#fff', text: 't', hp: 50 }, { name: 'Rook', mon: 'Houndour', face: '', colour: '#fff', text: 't', hp: 100 }], at: 1, head: 'Who steps in?', about: 'a' }, r);
    expect(ci.match(/class="cw on"/g)).toHaveLength(1);
    expect(ci).toContain('data-testid="dom-crewin-1"');
    const lg = r5Legend({ small: 's', word: 'Betrayal', boss: person('Giovanni'), legend: person('Mewtwo'), admin: person('Archer'), line: 'l', face: 'Face Mewtwo' }, r);
    expect(lg).toContain('BETRAYAL');
    expect(lg).toContain('data-testid="dom-legend-go"');
    const sn = r5Snap({ mine: '', foe: '', text: 'Houndoom vs Charizard · Day 18', count: 12, max: 40, note: 'n', line: 'l' }, r);
    expect(sn).toContain('Album · 12 of 40');
    expect(sn.match(/class="new"/g)).toHaveLength(1);
    expect(sn).toContain('data-testid="dom-snap-keep"');
  });
});
