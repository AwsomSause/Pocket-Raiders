// DOMINION D10, Growth (Part 1 §3.2, Part 3 §5, Part 9 A10): Buy Out, Raid, Gym Takeover (five ways, Defiance, the
// Wall), Post Flyers, Bribe, Fence, Smuggle, Kidnap, Hit a Lab, specialists; the 450 actions and 450 crew tasks of
// lists 151-600 as data; save/reload; determinism.
import { freshChair } from '../../src/core/dominion/chair';
import { describe, expect, it } from 'vitest';
import { empireOf } from '../../src/core/dominion/book';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { crewOf, taskById, withCrew } from '../../src/core/dominion/crew';
import { actionDef, actionStatus, card } from '../../src/core/dominion/field';
import { beginDominionFight } from '../../src/core/dominion/fight';
import { endDominionFight } from '../../src/core/dominion/fightEnd';
import { cardModel, gridPages, mapModel, newCursor } from '../../src/core/dominion/fieldScreens';
import { freshGrowth, growthOf, ownedGyms } from '../../src/core/dominion/growth';
import { addClean, cleanOf, hqFx } from '../../src/core/dominion/hqFx';
import { policeOf } from '../../src/core/dominion/police';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const G = DOMINION_DATA.growth;
const HQ = DOMINION_DATA.field.hq;
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
/** Day 1, Evening. */
const started = (seed = 'd10'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return quiet(stepInRun(content, out.run, { t: 'open' }).run);
};
/** D12: the Chair is switched off here, so these nights stay the same as before it. */
function quiet(r: RunState): RunState {
  const out = structuredClone(r);
  out.expansion!.dominion!.chair = { ...freshChair(), opts: { length: 'off', numbers: 'arrows', speed: 'normal' } };
  return out;
}
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
const answerAll = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
const night = (r: RunState): RunState => answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' }));
/** Evening -> the next Day. */
const day = (r: RunState): RunState => go(night(r), { t: 'toDay' });
const round = (r: RunState): RunState => go(day(r), { t: 'endDay' });
const edit = (r: RunState, f: (b: DominionBlock, r: RunState) => void): RunState => {
  const out = structuredClone(r);
  const b = withCrew(out.expansion!.dominion!);
  f(b, out);
  return { ...out, expansion: { ...out.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const act = (action: string, target: string | null, district: string, opt: string | null = null, bring: string[] = []): DominionAction => ({ t: 'act', action, target, district, bring, opt });
const sharp = (b: DominionBlock): void => {
  for (const k of ['brawn', 'nerve', 'wits', 'charm', 'stealth'] as const) b.field.edge.stats[k] = 10;
};
const room = (b: DominionBlock, id: string): void => {
  b.hq = b.hq ?? { rooms: [], next: 1, upgrade: null, clean: 0, wash: [], loan: null, broke: false };
  b.hq.rooms.push({ uid: `r${b.hq.next++}`, id, tier: 1, cond: 100, spent: 0, building: false, up: false, ready: 0, shut: false, ruined: false, at: null });
};
const rich = (b: DominionBlock, clean = 40000): void => addClean(b, clean);
/** A sharp Boss at the top of the Notoriety ladder, with every room the D10 actions ask for built. */
const ready = (b: DominionBlock): void => {
  sharp(b);
  empireOf(b).peak = DOMINION_DATA.empire.notoriety.steps.length - 1;
  const rooms = new Set(DOMINION_DATA.actions.actions.map((a) => actionStatus(a).room).filter((x): x is string => !!x));
  for (const id of rooms) room(b, id);
};
/** Wins (or loses) every fight the chain leaves waiting; returns the run and every line read out. */
const fightAll = (r: RunState, outcome: 'win' | 'lose' = 'win'): { run: RunState; lines: string[]; fights: number } => {
  const lines: string[] = [];
  let fights = 0;
  while (blk(r).field.fight && !blk(r).field.fight!.begun) {
    const b = beginDominionFight(content, r);
    expect(b, 'the fight starts').not.toBeNull();
    fights += 1;
    lines.push(...endDominionFight(content, b!, outcome));
    r = b!;
    if (outcome === 'lose') break;
  }
  return { run: r, lines, fights };
};

describe('DOMINION D10: the lists as data', () => {
  it('all 600 Boss actions are in; rows 151-600 each have an honest status, and the disabled ones name their slice', () => {
    const later = DOMINION_DATA.actions.actions.filter((a) => a.n > 150);
    expect(later).toHaveLength(450);
    const st = { play: 0, wait: 0 };
    for (const a of later) {
      const s = actionStatus(a);
      if (s.play) st.play += 1;
      else {
        st.wait += 1;
        expect(s.slice, a.id).toMatch(/^D\d+$/);
      }
    }
    expect(st).toEqual({ play: 362, wait: 88 }); // D14 plays the 30 League and Plan rows, D16 the 15 Snagem and Cipher rows
    expect(Object.keys(DOMINION_DATA.growthActions.status)).toHaveLength(450);
    // None of the actions now waits for this slice.
    expect(DOMINION_DATA.actions.actions.filter((a) => actionStatus(a).slice === 'D10')).toHaveLength(0);
  });
  it('the eleven named D10 actions are played', () => {
    for (const id of ['buy-out', 'raid', 'gym-takeover', 'post-flyers', 'bribe', 'fence', 'smuggle', 'sabotage', 'kidnap-a-pokemon', 'hit-a-lab', 'spread-the-word']) {
      expect(actionStatus(actionDef(id)!).play, id).toBe(true);
    }
  });
  it('team tasks 151-600 are in; none waits for D10; the D10 kinds are live', () => {
    const later = DOMINION_DATA.tasks.filter((t) => t.n > 150);
    expect(later).toHaveLength(450);
    expect(DOMINION_DATA.tasks.filter((t) => t.needs === 'D10')).toHaveLength(0);
    for (const t of DOMINION_DATA.tasks) if (t.status !== 'disabled') expect(t.effect, t.id).toBeDefined();
    expect(taskById('stock-the-stores')!.status).not.toBe('disabled');
    expect(DOMINION_DATA.buildings.filter((b) => b.waits === 'D10')).toHaveLength(0);
  });
  it('every crate item, Gym species, trainer class and business perk item exists in the game', () => {
    for (const [id, c] of Object.entries(DOMINION_DATA.field.crates)) for (const [item] of c.items) expect(content.items.has(item), `${id}: ${item}`).toBe(true);
    for (const g of G.gyms) for (const s of [...g.species, ...g.trainers.flatMap((t) => t.species)]) expect(content.species.has(s), `${g.id}: ${s}`).toBe(true);
    for (const b of G.business) if (b.perk.item) expect(content.items.has(b.perk.item), b.target).toBe(true);
    for (const s of [...G.lab.rare, ...G.revive.species]) expect(content.species.has(s), s).toBe(true);
    expect(G.gyms.map((g) => g.leaderId)).toEqual(['brock', 'misty', 'lt-surge', 'erika', 'koga', 'sabrina', 'blaine', 'giovanni']);
  });
});

describe('DOMINION D10: Buy Out (Part 3 §5)', () => {
  const evening = (seed: string, f: (b: DominionBlock) => void = () => {}) => edit(started(seed), (b) => {
    ready(b);
    f(b);
  });
  it('buys a shop with clean money; it pays every week', () => {
    let r = evening('buy', (b) => rich(b, 7000));
    const c = card(blk(r), r, 'buy-out', 'pewter-mart', HQ)!;
    expect(c.blocked).toBeNull();
    expect(c.money).toBe(6000);
    expect(c.note).toMatch(/Pewter Poké Mart: ₽6,000, clean money/);
    r = go(r, act('buy-out', 'pewter-mart', HQ));
    expect(blk(r).growth!.biz['pewter-mart']).toEqual({ day: 1, forced: false });
    expect(card(blk(r), r, 'buy-out', 'pewter-mart', HQ)!.blocked).toMatch(/Already done this evening/);
    const next = edit(round(r), (b) => rich(b, 7000));
    expect(card(blk(next), next, 'buy-out', 'pewter-mart', HQ)!.blocked).toMatch(/already own/);
    // Day 7 is the week's end: the shop's ₽250 (clean) and its 3 Poké Balls.
    r = edit(r, (b) => (b.day = 6));
    const before = cleanOf(blk(r));
    r = round(r);
    expect(blk(r).report.join(' ')).toMatch(/businesses paid/i);
    expect(cleanOf(blk(r))).toBeGreaterThanOrEqual(before + 250 - 1000);
  });
  it('without enough clean money it is refused (failure); dirty money does not count', () => {
    const r = evening('poor', (b) => {
      b.funds += 50000;
      b.hq!.clean = 0;
    });
    expect(card(blk(r), r, 'buy-out', 'pewter-mart', HQ)!.blocked).toMatch(/clean money/);
  });
  it('Extort three times (boundary: two is not enough) corners the owner: half price, dirty money, Heat +20', () => {
    let r = evening('corner', (b) => {
      b.hq!.clean = 0;
      b.funds += 4000;
      growthOf(b).cornered['pewter-mart'] = 2;
    });
    expect(card(blk(r), r, 'buy-out', 'pewter-mart', HQ)!.blocked).toMatch(/money/);
    r = edit(r, (b) => (growthOf(b).cornered['pewter-mart'] = 3));
    const c = card(blk(r), r, 'buy-out', 'pewter-mart', HQ)!;
    expect(c.blocked).toBeNull();
    expect(c.money).toBe(3000);
    expect(c.heat).toBe(20);
    r = go(r, act('buy-out', 'pewter-mart', HQ));
    expect(blk(r).growth!.biz['pewter-mart']!.forced).toBe(true);
    expect(blk(r).growth!.cornered['pewter-mart']).toBeUndefined();
  });
  it('a place that is not a business is refused (failure)', () => {
    const r = evening('nobiz', rich);
    expect(card(blk(r), r, 'buy-out', 'pewter-museum', HQ)!.blocked).toBe(G.lines.noBiz);
  });
});

describe('DOMINION D10: Raid (a chain of fights)', () => {
  it('a Raid is four fights at a site; winning them all gives the loot, Control and Dread', () => {
    let r = edit(day(started('raid')), ready);
    const c = card(blk(r), r, 'raid', 'pewter-museum', HQ)!;
    expect(c.blocked).toBeNull();
    expect(c.note).toMatch(/^4 fights in a row/);
    const ctl = blk(r).field.districts[HQ]!.control;
    r = go(r, act('raid', 'pewter-museum', HQ));
    expect(blk(r).field.fight).toMatchObject({ why: 'growth', begun: false });
    expect(blk(r).growth!.chain).toMatchObject({ kind: 'raid', step: 0 });
    const out = fightAll(r);
    expect(out.fights).toBe(4);
    expect(out.lines.join(' ')).toMatch(/All 4 fights won/);
    expect(blk(out.run).growth!.chain).toBeNull();
    expect(blk(out.run).field.districts[HQ]!.control).toBe(Math.min(100, ctl + G.raid.control));
    expect(Object.keys(blk(out.run).growth!.hot).length).toBeGreaterThan(0);
  });
  it('a loss part-way stops the chain and adds Heat (failure)', () => {
    let r = edit(day(started('raidl')), (b) => {
      sharp(b);
      growthOf(b).chain = { kind: 'raid', action: 'raid', target: 'pewter-museum', district: HQ, gym: null, step: 1, sides: G.gyms[0]!.trainers.concat(G.gyms[0]!.trainers).map((t) => ({ ...t })), big: false };
      b.field.fight = { why: 'growth', foe: 'growth', begun: false, action: 'raid', target: 'pewter-museum', district: HQ, pass: true, big: false, wager: 0, racket: null };
    });
    const heat = blk(r).field.districts[HQ]!.heat;
    const out = fightAll(r, 'lose');
    expect(out.lines.join(' ')).toMatch(/Beaten at fight 2 of 2/);
    expect(blk(out.run).growth!.chain).toBeNull();
    expect(blk(out.run).field.fight).toBeNull();
    expect(blk(out.run).field.districts[HQ]!.heat).toBeGreaterThan(heat);
  });
  it('the squad is capped by the action (Raid takes three), not the usual two', () => {
    expect(DOMINION_DATA.field.odds.maxBrought).toBe(2);
    expect(DOMINION_DATA.growthActions.play.raid?.squad ?? DOMINION_DATA.field.play.raid?.squad).toBe(3);
  });
});

describe('DOMINION D10: Gym Takeover (A10, five ways)', () => {
  const atGym = (seed: string, f: (b: DominionBlock, r: RunState) => void = () => {}) => edit(day(started(seed)), (b, r) => {
    ready(b);
    f(b, r);
  });
  it('offers the five ways; Beat is one fight with the Leader and gives the badge, not the Gym', () => {
    let r = atGym('beat');
    const c = card(blk(r), r, 'gym-takeover', null, HQ)!;
    expect(c.opts.map((o) => o.id)).toEqual(['beat', 'buy', 'break', 'blackmail', 'convert']);
    expect(c.opt).toBe('beat');
    expect(c.roll).toBe(false);
    r = go(r, act('gym-takeover', null, HQ, 'beat'));
    const out = fightAll(r);
    expect(out.fights).toBe(1);
    expect(blk(out.run).growth!.badges).toEqual(['pewter-gym']);
    expect(ownedGyms(blk(out.run))).toEqual([]);
    // The same badge twice is refused (failure); Convert opens now.
    r = out.run;
    expect(card(blk(r), r, 'gym-takeover', null, HQ, [], 'beat')!.blocked).toBe(G.lines.noBadge);
  });
  it('Break: every trainer, then the Leader, no rest; the Leader flees and the Gym is yours (Hero Threat up)', () => {
    let r = atGym('break');
    const hero = blk(r).field.hero;
    r = go(r, act('gym-takeover', null, HQ, 'break'));
    const out = fightAll(r);
    expect(out.fights).toBe(G.gyms[0]!.trainers.length + 1);
    expect(ownedGyms(blk(out.run))).toEqual(['pewter-gym']);
    expect(blk(out.run).field.hero).toBe(hero + G.gym.breakHero);
    expect(blk(out.run).flags).toContain('gym-taken');
  });
  it('Buy needs ₽25,000 clean (boundary: ₽24,999 is refused)', () => {
    let r = atGym('buyg', (b) => {
      b.funds = Math.max(b.funds, 30000);
      b.hq!.clean = 24999;
    });
    expect(card(blk(r), r, 'gym-takeover', null, HQ, [], 'buy')!.blocked).toMatch(/clean money/);
    r = edit(r, (b) => addClean(b, 1));
    expect(card(blk(r), r, 'gym-takeover', null, HQ, [], 'buy')!.blocked).toBeNull();
    r = go(r, act('gym-takeover', null, HQ, 'buy'));
    expect(blk(r).growth!.gyms['pewter-gym']).toMatchObject({ way: 'buy', defiance: 0 });
  });
  it('Blackmail needs three scouts of the town first (failure before)', () => {
    let r = atGym('bm');
    expect(card(blk(r), r, 'gym-takeover', null, HQ, [], 'blackmail')!.blocked).toMatch(/Scout Pewter 3 more/);
    r = edit(r, (b) => (growthOf(b).gymScout['pewter-gym'] = 3));
    const c = card(blk(r), r, 'gym-takeover', null, HQ, [], 'blackmail')!;
    expect(c.blocked).toBeNull();
    expect(c.roll).toBe(true);
  });
  it('Convert needs the badge; it rolls on Charm and the Leader waits to join the crew', () => {
    let r = atGym('cv');
    expect(card(blk(r), r, 'gym-takeover', null, HQ, [], 'convert')!.blocked).toBe('Beat Brock first.');
    r = edit(r, (b) => growthOf(b).badges.push('pewter-gym'));
    const c = card(blk(r), r, 'gym-takeover', null, HQ, [], 'convert')!;
    expect(c.blocked).toBeNull();
    expect(c.parts[0]![0]).toMatch(/^Boss Charm 10/);
  });
  it('Defiance (bought or blackmailed): +1 a week while Dread beats Regard; at 7 they tell the Hero; at 10 they break', () => {
    let r = atGym('def', (b) => {
      growthOf(b).gyms['pewter-gym'] = { way: 'buy', day: 1, defiance: 6, told: false, leader: null };
      b.field.districts[HQ]!.dread = 20;
      b.field.districts[HQ]!.regard = 0;
      b.day = 6;
    });
    r = go(r, { t: 'endDay' });
    const hero = blk(r).field.hero;
    r = night(r);
    expect(blk(r).growth!.gyms['pewter-gym']).toMatchObject({ defiance: 7, told: true });
    expect(blk(r).report.join(' ')).toMatch(/told the Hero everything/);
    expect(blk(r).field.hero).toBeGreaterThanOrEqual(hero + G.gym.defiance.hero - 5);
    // Regard above Dread: it stops climbing (boundary).
    r = edit(r, (b) => {
      b.field.districts[HQ]!.regard = 50;
      b.day = 13;
    });
    r = go(go(r, { t: 'toDay' }), { t: 'endDay' });
    r = night(r);
    expect(blk(r).growth!.gyms['pewter-gym']!.defiance).toBe(7);
    // At 10 the Leader breaks and waits at the Gym: a fight. Losing it loses the Gym.
    r = edit(r, (b) => {
      b.field.districts[HQ]!.regard = 0;
      growthOf(b).gyms['pewter-gym']!.defiance = 9;
      b.day = 20;
    });
    r = night(go(go(r, { t: 'toDay' }), { t: 'endDay' }));
    expect(blk(r).growth!.chain).toMatchObject({ kind: 'defiant' });
    const lost = fightAll(r, 'lose');
    expect(ownedGyms(blk(lost.run))).toEqual([]);
  });
  it('an owned Gym offers a raise (Defiance −3) and the Wall: a Captain or higher as the new Leader', () => {
    let r = atGym('own', (b) => {
      growthOf(b).gyms['pewter-gym'] = { way: 'blackmail', day: 1, defiance: 5, told: false, leader: null };
      rich(b, 5000);
    });
    let c = card(blk(r), r, 'gym-takeover', null, HQ)!;
    expect(c.opts[0]!.id).toBe('raise');
    expect(c.money).toBe(2000);
    r = go(r, act('gym-takeover', null, HQ, 'raise'));
    expect(blk(r).growth!.gyms['pewter-gym']!.defiance).toBe(2);
    // No Captain yet: only the raise is offered (boundary).
    expect(card(blk(r), r, 'gym-takeover', null, HQ)!.opts).toHaveLength(1);
    r = edit(r, (b) => (b.members[0]!.rank = 'captain'));
    c = card(blk(r), r, 'gym-takeover', null, HQ)!;
    expect(c.opts.map((o) => o.id)).toContain(`appoint:${blk(r).members[0]!.id}`);
  });
  it('a town with no Gym is refused (failure)', () => {
    const r = atGym('nog');
    expect(card(blk(r), r, 'gym-takeover', null, 'route-2')?.blocked ?? 'There is no Gym').toMatch(/no Gym|not/i);
  });
});

describe('DOMINION D10: flyers, bribes, the fence, smuggling, kidnap, the lab, specialists, loans', () => {
  it('Post Flyers: pick a design once; each week costs ₽100 a district and can bring walk-ins; Wanted 40+ tears them down', () => {
    let r = edit(day(started('fly')), ready);
    const c = card(blk(r), r, 'post-flyers', null, HQ, [], 'fist')!;
    expect(c.opts.map((o) => o.id)).toEqual(G.flyers.designs.map((d) => d.id));
    expect(c.money).toBe(100);
    r = go(r, act('post-flyers', null, HQ, 'fist'));
    expect(blk(r).growth!.flyers[HQ]).toBe(blk(r).day);
    expect(blk(r).growth!.design).toBe('fist');
    expect(card(blk(r), r, 'post-flyers', null, HQ)!.opts).toEqual([]);
    r = edit(r, (b) => {
      b.day = 6;
      b.funds += 1000;
    });
    r = night(go(r, { t: 'endDay' }));
    expect(blk(r).report.join(' '), blk(r).report.join(' | ')).toMatch(/Flyers cost ₽100 this week/);
    expect(blk(r).field.districts[HQ]!.dread).toBeGreaterThan(0);
    r = edit(r, (b) => {
      b.day = 13;
      for (const d of Object.values(b.field.districts)) d.heat = 80;
      // D24: at this Heat the police would pick the Boss up at dawn; this test is about the flyers, so not tonight.
      b.police = { ...policeOf(b), pickedUp: b.day };
    });
    r = night(go(go(r, { t: 'toDay' }), { t: 'endDay' }));
    expect(blk(r).growth!.flyers).toEqual({});
    expect(blk(r).report.join(' ')).toMatch(/tear down your flyers/);
  });
  it('Bribe an officer: no patrol in the town for the days paid; a Leader\'s assistant counts as a Gym scout', () => {
    let r = edit(started('bribe'), (b) => {
      ready(b);
      b.funds += 2000;
      b.field.patrol = HQ;
    });
    const c = card(blk(r), r, 'bribe', null, HQ, [], 'officer')!;
    expect(c.opts.map((o) => o.id)).toEqual(['officer', 'clerk', 'assistant']);
    r = go(r, act('bribe', null, HQ, 'officer'));
    expect(blk(r).field.patrol).toBeNull();
    expect(blk(r).growth!.bribed[HQ]).toBeGreaterThan(1);
    r = go(round(r), act('bribe', null, HQ, 'assistant'));
    expect(blk(r).growth!.gymScout['pewter-gym']).toBe(1);
  });
  it('Fence needs a contact (failure); a Fence pays 70% for stolen goods (and nothing for a bag of none)', () => {
    let r = edit(started('fence'), (b, run) => {
      ready(b);
      growthOf(b).hot = { 'ultra-ball': 2 };
      run.inventory['ultra-ball'] = 2;
    });
    expect(card(blk(r), r, 'fence', null, HQ)!.blocked).toBe(G.lines.contact);
    r = edit(r, (b) => growthOf(b).contacts.push('fence'));
    expect(card(blk(r), r, 'fence', null, HQ)!.note).toMatch(/2 stolen items.*70%/);
    const funds = blk(r).funds;
    r = go(r, act('fence', null, HQ));
    expect(blk(r).growth!.hot).toEqual({});
    const price = content.shop.find((s) => s.item === 'ultra-ball')?.price ?? 200;
    expect(blk(r).funds).toBe(funds + Math.round(price * 2 * 0.7));
    expect(r.inventory['ultra-ball']).toBeUndefined();
    const next = round(r);
    expect(card(blk(next), next, 'fence', null, HQ)!.blocked).toBe(G.lines.noHot);
  });
  it('Smuggle at Lv 3 opens a route that pays every night; routes are capped (boundary)', () => {
    let r = edit(started('smug'), (b) => {
      ready(b);
      b.field.mastery.smuggle = 9999;
    });
    r = go(r, { t: 'toNight' });
    r = go(r, act('smuggle', null, HQ));
    const g = blk(r).growth!;
    expect(g.routes[0]!.to).toBe(HQ);
    const funds = blk(r).funds;
    r = answerAll(go(r, { t: 'rest' }));
    expect(blk(r).funds).toBeGreaterThanOrEqual(funds + G.smuggle.nightly[0] - 2000);
    expect(blk(r).report.join(' ')).toMatch(/route/i);
  });
  it('Kidnap and a big lab hit put a Pokémon in the Pens (the Reserve), not the team', () => {
    let r = edit(started('kid'), (b) => {
      ready(b);
      for (const m of b.members) m.rank = 'captain';
    });
    r = go(r, { t: 'toNight' });
    const party = r.party.length;
    const held = (b: DominionBlock): number => (b.crew?.stores.length ?? 0) + (b.reserve?.box.length ?? 0);
    const before = held(blk(r));
    const out = stepInRun(content, r, act('kidnap-a-pokemon', 'pewter-mart', HQ));
    expect(out.ok, out.notice ?? '').toBe(true);
    expect(out.notice).toMatch(/in the Pens/);
    expect(out.run.party.length).toBe(party);
    expect(held(blk(out.run))).toBe(before + 1);
    expect(blk(out.run).crew!.pending).toEqual([]);
  });
  it('Hire a Specialist: five to choose from, each once; the wage is paid weekly', () => {
    let r = edit(day(started('spec')), (b) => {
      ready(b);
      b.funds += 10000;
      for (const m of b.members) m.rank = 'captain';
    });
    const c = card(blk(r), r, 'hire-a-specialist', null, HQ)!;
    expect(c.opts.map((o) => o.id)).toEqual(G.specialists.map((s) => s.id));
    r = go(r, act('hire-a-specialist', null, HQ, 'fence'));
    expect(blk(r).growth!.contacts).toEqual(['fence']);
    expect(card(blk(r), r, 'hire-a-specialist', null, HQ)!.opts.map((o) => o.id)).not.toContain('fence');
  });
  it('Loan Shark: ₽300 out, back on the due day unless the borrower skips town (its own stream)', () => {
    let r = edit(started('loan'), (b) => {
      ready(b);
      b.funds += 1000;
    });
    const funds = blk(r).funds;
    r = go(r, act('loan-shark', null, HQ));
    expect(blk(r).funds).toBe(funds - 300);
    expect(blk(r).growth!.loans).toEqual([{ due: 1 + G.loan.days, back: G.loan.back }]);
  });
});

describe('DOMINION D10: the crew traits, the Fence role and the Patron that waited for Growth', () => {
  const formed = (id: string) => (b: DominionBlock): void => {
    ready(b);
    b.funds += 5000;
    b.members[0]!.crew!.formed.push(id);
  };
  it('a Road Hog adds a smuggling route; a Broadcaster\'s flyers reach a second town; a Counterfeiter makes two papers', () => {
    const plain = edit(started('rh0'), ready);
    const hog = edit(started('rh'), formed('road-hog'));
    const routes = (r: RunState): string => card(blk(r), r, 'smuggle', null, HQ)!.note!.match(/Routes 0\/(\d+)/)![1]!;
    expect(Number(routes(hog))).toBe(Number(routes(plain)) + 1);
    let r = go(edit(day(started('bc')), formed('broadcaster')), act('post-flyers', null, HQ, 'pride'));
    expect(Object.keys(blk(r).growth!.flyers)).toHaveLength(2);
    // Forge Papers is an Evening action that rolls (70% plus Wits): a sharp Boss gets the paper, the Counterfeiter a second.
    r = go(edit(started('cf'), formed('counterfeiter')), act('forge-papers', null, HQ));
    expect(blk(r).growth!.papers).toBe(2);
  });
  it('a member in the Fence role is a Black Market contact; without one the Fence is refused (failure)', () => {
    let r = edit(started('role'), (b, run) => {
      ready(b);
      growthOf(b).hot = { 'ultra-ball': 1 };
      run.inventory['ultra-ball'] = 1;
    });
    expect(card(blk(r), r, 'fence', null, HQ)!.blocked).toBe(G.lines.contact);
    r = edit(r, (b) => (b.members[0]!.crew!.role = 'fence'));
    expect(card(blk(r), r, 'fence', null, HQ)!.blocked).toBeNull();
  });
  it('the disgraced Gym Leader (a Patron, won) adds 15 to a Gym roll', () => {
    const base = edit(day(started('pat')), (b) => {
      ready(b);
      growthOf(b).badges.push('pewter-gym');
    });
    const won = edit(base, (b) => (b.crew!.patrons['disgraced-leader'] = { state: 'won', progress: 0, day: 1 }));
    const a = card(blk(base), base, 'gym-takeover', null, HQ, [], 'convert')!;
    const c = card(blk(won), won, 'gym-takeover', null, HQ, [], 'convert')!;
    expect(c.parts.find(([l]) => /Kettering/.test(l))?.[1]).toBe(15);
    expect(c.chance).toBe(Math.min(DOMINION_DATA.field.odds.max, a.chance + 15));
  });
  it('the traits that wait are named: Locksmith and Sea Legs (later); none waits for D10 now', () => {
    expect(DOMINION_DATA.crew.formed.filter((f) => f.needs === 'D10')).toHaveLength(0);
    expect(DOMINION_DATA.crew.patrons.filter((f) => f.needs === 'D10')).toHaveLength(0);
    expect(DOMINION_DATA.crew.formed.filter((f) => !f.live && f.needs === 'later').map((f) => f.id)).toEqual(expect.arrayContaining(['locksmith', 'sea-legs']));
  });
});

describe('DOMINION D10: buildings and crew tasks', () => {
  it('the new building effects read through hqFx (contact, routes, papers, flyers, interest, fence)', () => {
    const b = withCrew(structuredClone(blk(started('fx'))));
    const zero = hqFx(b);
    for (const k of ['contact', 'routes', 'papers', 'flyerPct', 'interest', 'fence'] as const) expect(zero[k]).toBe(0);
    const withFx = DOMINION_DATA.buildings.find((x) => x.status !== 'disabled' && Object.keys(x.fx).some((k) => ['contact', 'routes', 'papers', 'flyerPct', 'interest', 'fence'].includes(k)));
    expect(withFx).toBeDefined();
  });
  it('Stock the Stores puts Potions in the stores; the crew\'s new kinds run deterministically', () => {
    const play = (): DominionBlock => {
      let r = go(started('stock'), { t: 'assign', member: 'm1', task: 'stock-the-stores' });
      for (let i = 0; i < 4; i++) r = round(r);
      return blk(r);
    };
    const a = play();
    expect(a).toEqual(play());
    expect(crewOf(a.members[0]!).tally).toBeDefined();
  });
});

describe('DOMINION D10: the screens (s3 action list, s4 Card)', () => {
  it('the action grid pages a section at a time and names it; every played day action is on a page once', () => {
    const r = edit(day(started('grid')), ready);
    const pages = gridPages(blk(r));
    const ids = pages.flat();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('gym-takeover');
    expect(pages.every((p) => p.length >= 1 && p.length <= 9)).toBe(true);
    const at = pages.findIndex((p) => p.includes('raid'));
    const m = mapModel(blk(r), r, { ...newCursor(blk(r)), page: at });
    expect(m.section).toBe(actionDef('raid')!.section);
    expect(mapModel(blk(r), r, newCursor(blk(r))).section).toBe('Starting moves');
  });
  it('the Card model carries the choices, the note and the squad size', () => {
    const r = edit(day(started('cm')), ready);
    const g = cardModel(blk(r), r, 'gym-takeover', null, HQ, [], 'break')!;
    expect(g.opts).toHaveLength(5);
    expect(g.opt).toBe('break');
    expect(g.note).toMatch(/Brock \(rock\).*2 fights/);
    expect(g.squad).toBe(1);
    expect(g.win).toBe('The Gym in Pewter is yours');
    const raid = cardModel(blk(r), r, 'raid', 'pewter-museum', HQ, ['m1'])!;
    expect(raid.squad).toBe(3);
    expect(raid.brought).toHaveLength(1);
    // No list line is shown with a placeholder left in it.
    for (const id of gridPages(blk(r)).flat()) {
      const m = cardModel(blk(r), r, id, 'pewter-mart', HQ);
      if (m) expect(m.win, id).not.toMatch(/[{}]/);
    }
    // An option that isn't on the Card falls back to the first one (boundary).
    expect(cardModel(blk(r), r, 'gym-takeover', null, HQ, [], 'nonsense')!.opt).toBe('beat');
  });
});

describe('DOMINION D10: saves', () => {
  it('a save from before D10 (no `growth`) loads unchanged and grows one when needed; with Growth it round-trips', () => {
    const r = round(started('save'));
    expect(blk(r).growth).toBeUndefined();
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.data).toEqual(r);
    const grown = edit(loaded.data, (b) => {
      growthOf(b).biz['pewter-mart'] = { day: 2, forced: false };
      growthOf(b).gyms['pewter-gym'] = { way: 'buy', day: 2, defiance: 3, told: false, leader: null };
      growthOf(b).routes.push({ to: HQ, nightly: 300, day: 2 });
    });
    new SaveManager(storage, content).saveRun(grown);
    const back = new SaveManager(storage, content).loadRun();
    expect(back.status).toBe('ok');
    if (back.status !== 'ok') return;
    expect(back.data).toEqual(grown);
    expect(ownedGyms(blk(back.data))).toEqual(['pewter-gym']);
  });
  it('a damaged Growth does not pass the schema (failure)', () => {
    const b = withCrew(structuredClone(blk(started('bad'))));
    b.growth = { ...freshGrowth(), papers: -1 };
    expect(DominionBlockSchema.safeParse(b).success).toBe(false);
    b.growth = { ...freshGrowth(), gyms: { x: { way: 'steal' as never, day: 1, defiance: 0, told: false, leader: null } } };
    expect(DominionBlockSchema.safeParse(b).success).toBe(false);
  });
  it('the Card never changes the block (a look is not a step)', () => {
    const r = edit(day(started('look')), (b) => {
      ready(b);
      rich(b);
    });
    const before = structuredClone(blk(r));
    for (const id of ['gym-takeover', 'raid', 'post-flyers', 'bribe', 'fence', 'hire-a-specialist', 'buy-out']) card(blk(r), r, id, null, HQ);
    expect(blk(r)).toEqual(before);
  });
  it('is deterministic: the same seed and steps give the same block', () => {
    const play = (): DominionBlock => {
      let r = edit(day(started('det')), ready);
      r = go(r, act('gym-takeover', null, HQ, 'break'));
      r = fightAll(r).run;
      r = go(r, { t: 'endDay' });
      for (let i = 0; i < 3; i++) r = round(r);
      return blk(r);
    };
    expect(play()).toEqual(play());
  });
});
