// DOMINION slice D2: the Boss's hands (plans/evil-mode-rework BUILD_SLICES.md): the Region Map, the nine actions and the
// rest of the list D2 plays, the Card, the Edge and mastery, district Heat and the police ladder, travel and vehicles,
// battles through the fight bridge, and the block's v1 -> v2 migration.
import { describe, expect, it } from 'vitest';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { actionDef, actionStatus, card, edgeXp, hops, masteryLevel, policeStep, statusOf, travel, wanted, worldStep } from '../../src/core/dominion/field';
import { cardModel, gridPages, mapModel, newCursor } from '../../src/core/dominion/fieldScreens';
import { beginDominionFight } from '../../src/core/dominion/fight';
import { dominionFightOn, endDominionFight } from '../../src/core/dominion/fightEnd';
import { migrateDominion } from '../../src/core/dominion/migrate';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, settleStaleFight, startInRun, stepInRun } from '../../src/core/dominion/session';
import { hqModel } from '../../src/core/dominion/screens';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { CURRENT_VERSIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const FD = DOMINION_DATA.field;
const domRun = (seed = 'dm2'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dm2'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return out.run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, out.notice ?? '').toBe(true);
  return out.run;
};
const tryStep = (r: RunState, a: DominionAction) => stepInRun(content, r, a);
/** Day 2, the Day phase, 4 actions (rested). */
const day = (seed?: string): RunState => go(go(go(go(started(seed), { t: 'open' }), { t: 'toNight' }), { t: 'rest' }), { t: 'toDay' });
const withBlock = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const out = structuredClone(r);
  f(out.expansion!.dominion!);
  return out;
};
const act = (action: string, target: string | null, district: string, bring: string[] = []): DominionAction => ({ t: 'act', action, target, district, bring });
const envelope = (record: string, v: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record, schemaVersion: v, savedAt: '', data });

describe('DOMINION D2: the data', () => {
  it('carries all 150 Boss actions from the list; each is played now or names the slice that opens it', () => {
    const all = DOMINION_DATA.actions.actions;
    expect(all).toHaveLength(150);
    expect(all.map((a) => a.n)).toEqual(Array.from({ length: 150 }, (_, i) => i + 1));
    const played = all.filter((a) => actionStatus(a).play);
    expect(played.length).toBe(42);
    for (const a of all) {
      const s = actionStatus(a);
      expect(s.play || /^D\d+$/.test(s.slice ?? ''), a.id).toBe(true);
    }
    expect(actionStatus(actionDef('recruit')!).slice).toBe('D3');
    expect(actionStatus(actionDef('buy-out')!).slice).toBe('D5');
  });
  it('the starting nine are the mockup\'s nine, in order; every played action has a row', () => {
    expect(FD.starting).toEqual(['extort', 'take', 'steal', 'thieve', 'attack', 'recruit', 'scout', 'catch', 'lay-low']);
    for (const id of Object.keys(FD.play)) expect(actionDef(id), id).toBeDefined();
  });
  it('every species, item, trainer class and wild theme the field data names exists in the game', () => {
    const species = new Set<string>([...FD.foes.ghost, ...FD.police.jenny.species, ...FD.police.looker.species, ...FD.police.raid.species]);
    const classes = new Set<string>([FD.foes.member, FD.police.jenny.cls, FD.police.looker.cls, FD.police.raid.cls]);
    for (const d of FD.districts) {
      expect(content.themes.has(d.wild), d.wild).toBe(true);
      for (const t of d.targets) {
        t.foe.species.forEach((s) => species.add(s));
        classes.add(t.foe.cls);
      }
    }
    for (const s of species) expect(content.species.has(s), s).toBe(true);
    for (const c of classes) expect(content.trainers.has(c), c).toBe(true);
    for (const c of Object.values(FD.crates)) for (const [i] of c.items) expect(content.items.has(i), i).toBe(true);
    for (const [a, b] of [...FD.routes, ...FD.water]) expect(FD.districts.some((d) => d.id === a) && FD.districts.some((d) => d.id === b)).toBe(true);
  });
});

describe('DOMINION D2: the Card (Part 1 §3.3, mockup 4)', () => {
  it('Day 1 Extort at the Pewter Mart: base + Boss Nerve x8 + trait, Outsider -10, unscouted shows a range', () => {
    const r = day();
    const c = card(blk(r), r, 'extort', 'pewter-mart', 'pewter')!;
    expect(c.blocked).toBeNull();
    // Day 2: the start's 5 Heat at the HQ cooled to 2 overnight (-1%).
    expect(c.parts).toEqual([['Boss Nerve 2', 16], ['Heat in Pewter', -1], ['Outsider here', -10], ['Owner is “Timid”', 5]]);
    expect(c.chance).toBe(25 + 16 - 1 - 10 + 5);
    expect(c.exact).toBe(false);
    expect(c.range).toEqual([c.chance - 10, c.chance + 10]);
    expect(c.pay).toEqual([150, 600]);
    expect(c.weekly).toBe(120);
    expect(c.heat).toBe(5);
    expect(c.cost).toBe(1);
  });
  it('scouting adds +15 and shows the exact odds; Heat takes 1% per 2; a brought member adds their stat x3', () => {
    const r = withBlock(day(), (b) => {
      b.field.scouted['pewter-mart'] = b.day + 5;
      b.field.districts.pewter!.heat = 19;
    });
    const c = card(blk(r), r, 'extort', 'pewter-mart', 'pewter', [blk(r).members[0]!.id])!;
    expect(c.exact).toBe(true);
    expect(c.parts).toContainEqual(['Scouted', 15]);
    expect(c.parts).toContainEqual(['Heat in Pewter', -9]);
    expect(c.parts).toContainEqual(['Rook brought along', 1 * 3]);
  });
  it('odds stay between 5% and 95% (boundary)', () => {
    const hi = withBlock(day(), (b) => { b.field.edge.stats.nerve = 10; b.field.districts.pewter!.control = 90; b.field.scouted['pewter-mart'] = 99; });
    expect(card(blk(hi), hi, 'extort', 'pewter-mart', 'pewter')!.chance).toBe(95);
    const lo = withBlock(day(), (b) => { b.field.edge.stats.nerve = 1; b.field.districts.saffron!.heat = 100; b.field.districts.saffron!.rival = 100; });
    expect(card(blk(lo), lo, 'take', 'silph-co', 'saffron')).not.toBeNull();
    expect(card(blk(lo), lo, 'count-the-guards', 'silph-co', 'saffron')!.chance).toBeGreaterThanOrEqual(5);
  });
  it('refuses what can\'t be done: wrong place, wrong phase, not yet, a later slice, no money (failure)', () => {
    const r = day();
    const b = blk(r);
    expect(card(b, r, 'extort', 'route-3', 'pewter')!.blocked).toBe(FD.lines.notHere);
    expect(card(b, r, 'steal', 'pewter-mart', 'pewter')!.blocked).toBe(FD.lines.wrongPhase.night);
    expect(card(b, r, 'workout', null, 'pewter')!.blocked).toBe(FD.lines.wrongPhase.evening);
    expect(card(b, r, 'ambush-a-patrol', 'pewter-mart', 'pewter')!.blocked).toBe('Opens on Day 5.');
    expect(card(b, r, 'recruit', null, 'pewter')!.blocked).toContain('D3');
    const ev = withBlock(go(r, { t: 'endDay' }), (x) => { x.funds = 0; });
    expect(card(blk(ev), ev, 'change-clothes', null, 'pewter')!.blocked).toBe('Not enough money: it costs ₽100.');
  });
  it('mastery: XP 5/15/30/55 make levels 2-5, and Practiced adds +5%', () => {
    expect([0, 4, 5, 14, 15, 30, 55, 999].map(masteryLevel)).toEqual([1, 1, 2, 2, 3, 4, 5, 5]);
    const r = withBlock(day(), (b) => { b.field.mastery.extort = 5; });
    expect(card(blk(r), r, 'extort', 'pewter-mart', 'pewter')!.parts).toContainEqual(['Practiced (Lv 2)', 5]);
  });
  it('the Card model shows the mockup\'s lines (pays, dial, who\'s hurt, who might see, battle)', () => {
    const r = day();
    const m = cardModel(blk(r), r, 'extort', 'bike-shop', 'cerulean')!;
    expect(m.title).toBe('Extort');
    expect(m.sub).toBe('Cerulean Bike Shop');
    expect(m.pays).toContain('₽180–720');
    expect(m.pays).toContain('₽140/wk');
    expect(m.hurt?.line).toContain('Mr. Bicycle');
    expect(m.battle?.line).toMatch(/^His nephew's Machop, Lv \d+\.$/);
    expect(m.battle?.chance).toBe(40);
    expect(m.travel).toBe('On foot: 1 action');
    expect(m.slotLine).toBe('Action 1 of 4');
  });
});

describe('DOMINION D2: travel (Part 9 A20)', () => {
  it('on foot is 1 action a step; Cinnabar needs a Boat; the Bike gives one free trip a day', () => {
    const r = day();
    const b = blk(r);
    expect(hops(b.field, 'pewter', 'cerulean')).toBe(1);
    expect(hops(b.field, 'pewter', 'pallet')).toBe(2);
    expect(hops(b.field, 'pewter', 'cinnabar')).toBeNull();
    expect(travel(b, r, 'cinnabar').ok).toBe(false);
    expect(card(b, r, 'extort', 'pewter-mart', 'pewter')!.cost).toBe(1);
    expect(card(b, r, 'extort', 'viridian-mart', 'viridian')!.cost).toBe(2);
    const boat = withBlock(r, (x) => { x.field.vehicles.push('boat'); });
    expect(hops(blk(boat).field, 'pewter', 'cinnabar')).toBe(3);
    const bike = withBlock(r, (x) => { x.field.free = 1; });
    expect(travel(blk(bike), bike, 'cerulean')).toMatchObject({ ok: true, cost: 0, how: 'free' });
  });
  it('doing an action moves the Boss there and spends the trip; the next morning he is back at the HQ', () => {
    let r = go(day(), act('scout', 'bike-shop', 'cerulean'));
    expect(blk(r).field.at).toBe('cerulean');
    expect(blk(r).actions).toBe(4 - 2);
    expect(blk(r).field.visited).toContain('cerulean');
    r = go(go(go(go(r, { t: 'endDay' }), { t: 'toNight' }), { t: 'rest' }), { t: 'toDay' });
    expect(blk(r).field.at).toBe(FD.hq);
  });
  it('buying a vehicle: the Bike costs ₽1,000; not twice; the Airship needs HQ Lv. 5', () => {
    // D3's crew step runs overnight (a thief can take a little), so start the Day with exactly ₽1,000.
    let r = withBlock(day(), (b) => { b.funds = 1000; });
    r = go(r, { t: 'buy', vehicle: 'bike' });
    expect(blk(r).funds).toBe(1000 - 1000);
    expect(blk(r).field.vehicles).toEqual(['bike']);
    expect(tryStep(r, { t: 'buy', vehicle: 'bike' }).ok).toBe(false);
    const rich = withBlock(r, (b) => { b.funds = 1_000_000; });
    expect(tryStep(rich, { t: 'buy', vehicle: 'airship' }).notice).toBe('Needs HQ Lv. 5.');
  });
});

describe('DOMINION D2: doing actions', () => {
  it('Lay Low: no roll, Heat -10 in the district, a Day action spent', () => {
    const r0 = withBlock(day(), (b) => { b.field.districts.pewter!.heat = 30; });
    const r = go(r0, act('lay-low', null, 'pewter'));
    expect(blk(r).field.districts.pewter!.heat).toBe(20);
    expect(blk(r).actions).toBe(3);
  });
  it('Scout: a success marks the target scouted for a week; the odds become exact', () => {
    // Find a seed whose first roll passes (60% + Stealth 2 x8).
    let r: RunState | null = null;
    for (let i = 0; i < 20 && !r; i++) {
      const out = tryStep(day(`sc${i}`), act('scout', 'pewter-mart', 'pewter'));
      if (out.ok && !out.fight && blk(out.run).field.scouted['pewter-mart']) r = out.run;
    }
    expect(r).not.toBeNull();
    const b = blk(r!);
    expect(b.field.scouted['pewter-mart']).toBe(b.day + FD.odds.scoutDays);
    expect(card(b, r!, 'extort', 'pewter-mart', 'pewter')!.exact).toBe(true);
  });
  it('Extort: a win pays inside the Card\'s range, makes a Racket and adds Control; a loss adds the fail Heat', () => {
    let wins = 0, losses = 0;
    for (let i = 0; i < 40; i++) {
      const r0 = day(`ex${i}`);
      const c = card(blk(r0), r0, 'extort', 'pewter-mart', 'pewter')!;
      const out = tryStep(r0, act('extort', 'pewter-mart', 'pewter'));
      expect(out.ok).toBe(true);
      const b = blk(out.run);
      if (out.fight) {
        expect(b.field.fight).toMatchObject({ why: expect.stringMatching(/fail|police/), begun: false });
        continue;
      }
      if (b.field.rackets.length) {
        wins++;
        const got = b.funds - blk(r0).funds;
        expect(got).toBeGreaterThanOrEqual(c.pay![0]);
        expect(got).toBeLessThanOrEqual(c.pay![1]);
        expect(b.field.rackets[0]).toMatchObject({ target: 'pewter-mart', district: 'pewter', weekly: 120, kind: 'racket' });
        expect(b.field.districts.pewter!.control).toBe(10 + 8);
        expect(b.field.districts.pewter!.dread).toBe(3);
      } else {
        losses++;
        expect(b.field.districts.pewter!.heat).toBe(blk(r0).field.districts.pewter!.heat + 12);
      }
    }
    expect(wins).toBeGreaterThan(0);
    expect(losses).toBeGreaterThan(0);
  });
  it('the Edge: Infamy XP raises a stat at stat x4 XP, to the cap of 10', () => {
    const b = blk(day());
    expect(edgeXp(b.field, 'nerve', 7)).toBeNull();
    expect(edgeXp(b.field, 'nerve', 1)).toBe('Boss Nerve 3.');
    expect(b.field.edge.xp.nerve).toBe(0);
    edgeXp(b.field, 'nerve', 10_000);
    expect(b.field.edge.stats.nerve).toBe(10);
    expect(edgeXp(b.field, 'nerve', 50)).toBeNull();
  });
  it('Evening actions: once each an evening; Workout gives Brawn XP; Change Clothes halves the next job\'s Heat', () => {
    let r = go(day(), { t: 'endDay' });
    r = go(r, act('workout', null, 'pewter'));
    expect(blk(r).field.edge.xp.brawn).toBe(3);
    expect(tryStep(r, act('workout', null, 'pewter')).notice).toBe(FD.lines.doneTonight);
    r = go(r, act('change-clothes', null, 'pewter'));
    expect(blk(r).field.disguise).toBe(true);
    const c = card(blk(r), r, 'steal', 'pewter-mart', 'pewter')!;
    expect(c.failHeat).toBe(Math.ceil(15 / 2));
  });
  it('Night: Steal needs the crowbar and spends the night; Turn in ends it without Rest', () => {
    let r = go(go(day(), { t: 'endDay' }), { t: 'toNight' });
    const noBar = withBlock(r, (b) => { b.keyItems = []; });
    expect(tryStep(noBar, act('steal', 'pewter-mart', 'pewter')).notice).toBe('Needs a crowbar.');
    const out = tryStep(r, act('steal', 'pewter-mart', 'pewter'));
    expect(out.ok).toBe(true);
    r = out.run;
    expect(blk(r).nightActions).toBe(0);
    expect(card(blk(r), r, 'hide-in-the-warehouse', null, 'pewter')!.blocked).toBe(FD.lines.nightDone);
    if (!blk(r).field.fight) {
      expect(hqModel(blk(r)).next.label).toBe('Turn in');
      r = go(r, { t: 'skipNight' });
      expect(blk(r)).toMatchObject({ phase: 'morning', noRest: 1 });
    }
  });
  it('Hide in the Warehouse: Heat -10 at the HQ and the police find nothing tonight', () => {
    let r = withBlock(go(go(day(), { t: 'endDay' }), { t: 'toNight' }), (b) => { b.field.districts.pewter!.heat = 50; });
    r = go(r, act('hide-in-the-warehouse', null, 'cerulean'));
    expect(blk(r).field.districts.pewter!.heat).toBe(40);
    r = go(r, { t: 'skipNight' });
    expect(blk(r).report).toContain(FD.police.lines.hidden);
    expect(blk(r).field.patrol).toBeNull();
  });
  it('same seed and actions give the same result (determinism); the Card never rolls', () => {
    const play = (): DominionBlock => {
      let r = day('det');
      for (const a of [act('extort', 'pewter-mart', 'pewter'), act('take', 'pewter-mart', 'pewter')]) {
        const out = tryStep(r, a);
        if (out.ok) r = out.run;
      }
      return blk(r);
    };
    expect(play()).toEqual(play());
    const r = day('det');
    const before = structuredClone(blk(r));
    card(blk(r), r, 'extort', 'pewter-mart', 'pewter');
    mapModel(blk(r), r, newCursor(blk(r)));
    expect(blk(r)).toEqual(before);
  });
});

describe('DOMINION D2: battles through the fight bridge', () => {
  it('Attack always fights: the battle starts, a win pays prize money x2 and the run goes on', () => {
    let r = go(day('atk'), act('attack', 'route-3', 'pewter'));
    expect(blk(r).field.fight).toMatchObject({ why: 'always', foe: 'target', begun: false });
    const started = beginDominionFight(content, r)!;
    expect(started.battle?.kind).toBe('trainer');
    expect(started.battle?.trainer?.classId).toBe('hiker');
    expect(started.phase).toBe('battle');
    expect(dominionFightOn(started)).toBe(true);
    const won = structuredClone(started);
    const funds = blk(won).funds;
    const lines = endDominionFight(content, won, 'win');
    expect(won.battle).toBeNull();
    expect(won.phase).toBe('map');
    expect(blk(won).field.fight).toBeNull();
    expect(blk(won).funds).toBeGreaterThan(funds);
    expect(lines[0]).toMatch(/^Prize money, twice over/);
    const lost = structuredClone(started);
    endDominionFight(content, lost, 'lose');
    expect(lost.phase).toBe('map');
    expect(blk(lost).funds).toBe(funds);
    expect(blk(lost).field.districts.pewter!.heat).toBe(blk(r).field.districts.pewter!.heat + 4);
  });
  it('Catch: a wild battle from the district\'s theme; a caught Pokémon joins the team', () => {
    const r = go(day('cat'), act('catch', 'route-3', 'pewter'));
    const b = beginDominionFight(content, r)!;
    expect(b.battle?.kind).toBe('wild');
    const caught = structuredClone(b);
    const n = caught.party.length;
    endDominionFight(content, caught, 'caught');
    expect(caught.party.length).toBe(n + 1);
  });
  it('a fight with nobody able to battle can\'t start; a begun fight with no battle left settles as fled', () => {
    const r = go(day('atk'), act('attack', 'route-3', 'pewter'));
    const fainted = structuredClone(r);
    for (const m of fainted.party) m.hp = 0;
    expect(beginDominionFight(content, fainted)).toBeNull();
    const begun = beginDominionFight(content, r)!;
    const lost = { ...begun, battle: null, phase: 'map' as const };
    const out = settleStaleFight(content, lost)!;
    expect(out.lines).toEqual([FD.lines.fled]);
    expect(blk(out.run).field.fight).toBeNull();
  });
});

describe('DOMINION D2: Heat, Wanted and the police (Part 1 §3.4, Part 4 §4)', () => {
  it('Wanted is the average of the districts with Heat plus big events; Heat cools 3 a district a night', () => {
    const b = blk(day());
    b.field.districts.pewter!.heat = 30;
    b.field.districts.cerulean!.heat = 10;
    expect(wanted(b.field)).toBe(20);
    b.field.wanted = 5;
    expect(wanted(b.field)).toBe(25);
    worldStep(b);
    expect(b.field.districts.pewter!.heat).toBe(27);
    expect(b.field.wanted).toBe(4);
  });
  it('the ladder: Noticed sends a patrol to the hottest district, Wanted closes one, Hunted brings Looker for a Racket, Most Wanted a raid', () => {
    const at = (heat: number, racket = false): DominionBlock => {
      const b = structuredClone(blk(day()));
      for (const d of Object.values(b.field.districts)) d.heat = 0;
      b.field.districts.cerulean!.heat = heat;
      if (racket) b.field.rackets.push({ target: 'bike-shop', district: 'cerulean', weekly: 120, day: 2, kind: 'racket' });
      return b;
    };
    const quiet = at(10);
    expect(policeStep(quiet, 's')).toEqual([]);
    const n = at(25);
    policeStep(n, 's');
    expect(n.field.patrol).toBe('cerulean');
    expect(n.field.closed).toBeNull();
    const w = at(45);
    policeStep(w, 's');
    expect(w.field.closed).toBe('cerulean');
    expect(card(w, day(), 'extort', 'bike-shop', 'cerulean')!.blocked).toBe('Cerulean is closed to you today: a checkpoint.');
    const h = at(65, true);
    policeStep(h, 's');
    expect(h.field.fight).toMatchObject({ why: 'looker', racket: 'bike-shop' });
    const h2 = structuredClone(h);
    h2.field.fight = null;
    policeStep(h2, 's');
    expect(h2.field.fight).toBeNull(); // once a week
    const m = at(90);
    policeStep(m, 's');
    expect(m.field.fight).toMatchObject({ why: 'raid', district: FD.hq });
  });
  it('a fight at the door comes before the day; losing to Looker costs the Racket, losing a raid costs a quarter of the money', () => {
    let r = withBlock(day(), (b) => {
      b.phase = 'morning';
      b.field.rackets.push({ target: 'bike-shop', district: 'cerulean', weekly: 120, day: 2, kind: 'racket' });
      b.field.fight = { why: 'looker', foe: 'looker', begun: false, action: null, target: null, district: 'cerulean', pass: false, big: false, wager: 0, racket: 'bike-shop' };
    });
    expect(tryStep(r, { t: 'toDay' }).ok).toBe(false);
    expect(hqModel(blk(r)).next.label).toBe('Face Looker');
    r = beginDominionFight(content, r)!;
    expect(r.battle?.trainer?.name).toBe('Looker');
    endDominionFight(content, r, 'lose');
    expect(blk(r).field.rackets).toEqual([]);
    let raid = withBlock(day(), (b) => {
      b.funds = 1000;
      b.field.fight = { why: 'raid', foe: 'raid', begun: false, action: null, target: null, district: FD.hq, pass: false, big: false, wager: 0, racket: null };
    });
    raid = beginDominionFight(content, raid)!;
    endDominionFight(content, raid, 'lose');
    expect(blk(raid).funds).toBe(750);
  });
  it('Rackets pay on bill day by the district\'s Control (Outsider a quarter, Held all)', () => {
    const b = blk(day());
    b.day = 7;
    b.field.rackets.push({ target: 'pewter-mart', district: 'pewter', weekly: 120, day: 2, kind: 'racket' });
    const funds = b.funds;
    worldStep(b);
    expect(b.funds).toBe(funds + 30);
    b.field.districts.pewter!.control = 60;
    expect(statusOf(b.field.districts.pewter!)).toBe('held');
    worldStep(b);
    expect(b.funds).toBe(funds + 30 + 120);
  });
});

describe('DOMINION D2: the Region Map (mockup 3)', () => {
  it('ten districts in the mockup\'s places, the HQ in Pewter, Rocket in Celadon and Saffron, the tally bar', () => {
    const r = day();
    const m = mapModel(blk(r), r, newCursor(blk(r)));
    expect(m.districts.map((d) => d.name)).toEqual(['Pewter', 'Viridian', 'Pallet', 'Cinnabar', 'Cerulean', 'Celadon', 'Saffron', 'Lavender', 'Fuchsia', 'Vermilion']);
    expect(m.districts.find((d) => d.home)?.pill?.text).toBe('HQ · Outsider');
    expect(m.districts.filter((d) => d.cls === 'rival').map((d) => d.pill?.text)).toEqual(['Rocket', 'Rocket · Silph']);
    expect(m.districts.find((d) => d.id === 'vermilion')?.pill?.text).toBe('Police');
    expect(m.tally).toEqual([0, 0, 2, 8]);
    expect(m.grid.map((g) => g.label)).toEqual(['Extort', 'Take', 'Steal', 'Thieve', 'Attack', 'Recruit', 'Scout', 'Catch', 'Lay Low']);
    expect(m.grid.find((g) => g.id === 'steal')).toMatchObject({ night: true, dim: true });
    expect(gridPages(blk(r)).length).toBeGreaterThan(1);
  });
});

describe('DOMINION D2: saves', () => {
  it('a v1 block (saved by D1) migrates to v2: the Heat moves to the HQ district, Wanted reads the same', () => {
    const r = started();
    const v1: Record<string, unknown> = { ...blk(r), v: 1, heat: 12 };
    delete v1.field;
    const parsed = DominionBlockSchema.parse(v1);
    expect(parsed.v).toBe(2);
    expect(parsed.field.districts[FD.hq]!.heat).toBe(12);
    expect(wanted(parsed.field)).toBe(12);
    expect(parsed.field.edge.stats).toEqual({ brawn: 2, nerve: 2, wits: 2, charm: 2, stealth: 2 });
    expect(migrateDominion(null)).toBeNull();
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', envelope('run', CURRENT_VERSIONS.run, { ...r, expansion: { ...r.expansion, dominion: v1 } }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    expect(loaded.status === 'ok' && loaded.data.expansion?.dominion?.field.at).toBe(FD.hq);
  });
  it('saves and reloads mid-action, mid-fight and at night with the same state', () => {
    const storage = new MemoryStorageProvider();
    const check = (r: RunState): void => {
      new SaveManager(storage, content).saveRun(r);
      const loaded = new SaveManager(storage, content).loadRun();
      expect(loaded.status).toBe('ok');
      expect(loaded.status === 'ok' && loaded.data).toEqual(r);
    };
    let r = go(day('sv'), act('lay-low', null, 'pewter'));
    check(r);
    r = go(r, act('attack', 'route-3', 'pewter'));
    check(r);
    r = beginDominionFight(content, r)!;
    check(r);
    endDominionFight(content, r, 'win');
    check(r);
    r = go(go(r, { t: 'endDay' }), { t: 'toNight' });
    check(r);
  });
  it('a damaged field is refused (failure: never silently changed)', () => {
    const r = day();
    expect(DominionBlockSchema.safeParse({ ...blk(r), field: { ...blk(r).field, at: '' } }).success).toBe(false);
    expect(DominionBlockSchema.safeParse({ ...blk(r), v: 3 }).success).toBe(false);
  });
});
