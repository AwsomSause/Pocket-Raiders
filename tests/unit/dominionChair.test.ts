// DOMINION slice D12: the Chair (Evening court; plans/evil-mode-rework/lists/end-of-day-court.md, cards in
// lists/dilemmas.md; mockups c1-c3). The 150 cards as data, the Docket (Crisis first, follow-ups, Regulars, the draw),
// answers and what they move, Hand it off, the whisper, Close the doors, the Tally, deals, fights at the door, and
// save/reload in the middle of a sitting.
import { describe, expect, it } from 'vitest';
import trainersRaw from '../../src/data/trainers.json';
import {
  atDoor, canDraw, cardById, cardStatus, chairOf, courtFightEnd, handOffCrew, leanOf, openSitting, redZones, rightHand, visitorsTonight, whisper, wouldPick,
} from '../../src/core/dominion/chair';
import { crewOf, withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { notorietyOf } from '../../src/core/dominion/empire';
import { chairModel } from '../../src/core/dominion/chairScreens';
import { DominionBlockSchema, type CourtFx, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const CARDS = DOMINION_DATA.court;
const HQ = DOMINION_DATA.field.hq;
const domRun = (seed = 'dm12'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dm12'): RunState => {
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
const edit = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withCrew(structuredClone(blk(r)));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const answerTalks = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
/** Sits through the Chair answering `pick` every time, reads the Tally and goes to the Night. */
const sit = (r: RunState, pick = 0): RunState => {
  r = go(r, { t: 'toNight' });
  while (blk(r).chair?.open) {
    if (atDoor(blk(r))) r = go(go(r, { t: 'court', choice: pick }), { t: 'courtNext' });
    else r = go(r, { t: 'toNight' });
  }
  expect(blk(r).phase).toBe('night');
  return r;
};
/** Night -> the next Evening: Rest, talks answered, a fight at the door waved off (its own tests are below), odd jobs. */
const morning = (r: RunState): RunState => {
  r = answerTalks(go(r, { t: 'rest' }));
  if (blk(r).field.fight) r = edit(r, (b) => void ((b.field.fight = null), (b.chair!.stake = null)));
  return go(go(r, { t: 'toDay' }), { t: 'endDay' });
};
/** Evening to the next Evening. */
const round = (r: RunState, pick = 0): RunState => morning(sit(r, pick));
const day2 = (seed = 'dm12'): RunState => {
  // The run opens on Day 1's Evening.
  let r = go(started(seed), { t: 'toNight' });
  expect(blk(r).phase).toBe('night'); // Day 1: no Chair (the guided first day)
  r = answerTalks(go(r, { t: 'rest' }));
  return go(go(r, { t: 'toDay' }), { t: 'endDay' });
};

const walk = (fx: CourtFx[], f: (e: CourtFx) => void): void => {
  for (const e of fx) {
    f(e);
    if (e.k === 'chance') walk([...e.yes, ...e.no], f);
    if (e.k === 'later') walk(e.fx, f);
    if (e.k === 'fight') walk([...e.win, ...e.lose], f);
  }
};

describe('DOMINION D12: the 150 cards', () => {
  it('all 150 dilemmas are in, word for word, in their eleven sections', () => {
    expect(CARDS).toHaveLength(150);
    expect(CARDS.map((c) => c.id)).toEqual(Array.from({ length: 150 }, (_, i) => i + 1));
    expect(cardById(76)!.ask).toBe('"The Boss sends his regards. Viridian, or your teeth?"');
    expect(cardById(76)!.b.label).toBe('Smile and say no');
    expect(cardById(145)!.crisis).toBe('money');
    expect(CARDS.filter((c) => c.regular).length).toBe(12);
    const n = (s: string) => CARDS.filter((c) => c.sect === s).length;
    expect([n('crew'), n('town'), n('money'), n('law'), n('rival'), n('hero'), n('gyms'), n('pokemon'), n('empire'), n('regular'), n('crisis')]).toEqual([22, 22, 14, 12, 16, 10, 12, 14, 10, 12, 6]);
  });
  it('every card has a status: 113 play now (some limited), 37 wait and name the slice', () => {
    const st = CARDS.map(cardStatus);
    expect(st.filter((s) => s !== 'disabled')).toHaveLength(113);
    expect(st.filter((s) => s === 'supported').length).toBeGreaterThan(50);
    for (const c of CARDS.filter((x) => x.wait)) expect(c.wait).toMatch(/^(D\d+|quiz)$/);
  });
  it('items, Pokémon and foes exist; no visitor or target is a minor (minors lock)', () => {
    const classes = new Set((trainersRaw as unknown as { classes?: { id: string }[] }).classes?.map((c) => c.id) ?? (trainersRaw as unknown as { id: string }[]).map((c) => c.id));
    for (const c of CARDS) {
      expect(c.look).not.toMatch(/school_kid|preschooler|youngster|rich_kid_f|twins/);
      walk([...c.a.fx, ...c.b.fx], (e) => {
        // Rare Candy is the Dominion's member-level gift (session.ts gift), not a battle item.
        if (e.k === 'item' && e.id !== '*' && !e.held && e.id !== 'rare-candy') expect(content.items.has(e.id), `${c.id} ${e.id}`).toBe(true);
      });
      if (c.foe) {
        expect(classes.has(c.foe.cls), `${c.id} ${c.foe.cls}`).toBe(true);
        for (const s of c.foe.species) expect(content.species.has(s), `${c.id} ${s}`).toBe(true);
      }
    }
    for (const s of DOMINION_DATA.courtRules.stray) expect(content.species.has(s)).toBe(true);
  });
});

describe('DOMINION D12: the sitting', () => {
  it('Day 1 has no Chair; Day 2 brings one scripted visitor: the first member\'s mum (normal)', () => {
    let r = day2();
    expect(blk(r).phase).toBe('evening');
    r = go(r, { t: 'toNight' });
    const b = blk(r);
    expect(b.phase).toBe('evening');
    expect(b.chair!.open).toBe(true);
    expect(b.chair!.docket.map((d) => d.card)).toEqual([1]);
    expect(b.chair!.docket[0]!.member).toBe(b.members[0]!.id);
    expect(Object.keys(b.chair!.regulars)).toEqual(['1', '2', '3', '4']);
    const m = chairModel(b, r, 0, null);
    expect(m.kind).toBe('visitor');
    expect(m.kind === 'visitor' && m.ask).toContain('recycling plant');
    // Answer A: Regard +3, the member's Loyalty +8, the mum is back in 6 days.
    const loy = b.members[0]!.loyalty;
    r = go(r, { t: 'court', choice: 0 });
    expect(blk(r).field.districts[HQ]!.regard).toBe(3);
    expect(blk(r).members[0]!.loyalty).toBe(Math.min(100, loy + 8));
    expect(blk(r).chair!.follow).toEqual([{ card: 2, day: 8, member: b.members[0]!.id }]);
    expect(blk(r).chair!.result!.length).toBeGreaterThan(0);
    // The result holds the screen until Enter; then the Tally; then the Night.
    expect(stepInRun(content, r, { t: 'toNight' }).ok).toBe(false);
    r = go(r, { t: 'courtNext' });
    expect(chairModel(blk(r), r, 0, null).kind).toBe('tally');
    r = go(r, { t: 'toNight' });
    expect(blk(r).phase).toBe('night');
    expect(blk(r).chair!.open).toBe(false);
    // Once a day: tonight's Chair is done.
    expect(blk(r).chair!.day).toBe(2);
  });
  it('the mum comes back on day 8 as a follow-up, and card 1 never again', () => {
    let r = sit(day2());
    for (let i = 0; i < 6; i++) r = morning(r), (r = i < 5 ? sit(r) : r);
    expect(blk(r).day).toBe(8);
    r = go(r, { t: 'toNight' });
    const cards = blk(r).chair!.docket.map((d) => d.card);
    expect(cards).toContain(2);
    expect(cards).not.toContain(1);
  });
  it('the same seed and answers give the same Docket; another seed differs somewhere (determinism)', () => {
    const play = (seed: string) => {
      let r = sit(day2(seed));
      const days: number[][] = [];
      for (let i = 0; i < 5; i++) {
        r = go(morning(r), { t: 'toNight' });
        days.push(blk(r).chair!.docket.map((d) => d.card));
        while (blk(r).chair?.open) r = atDoor(blk(r)) ? go(go(r, { t: 'court', choice: 1 }), { t: 'courtNext' }) : go(r, { t: 'toNight' });
      }
      return days;
    };
    const a = play('same');
    expect(play('same')).toEqual(a);
    expect(a.every((d) => d.length >= 1)).toBe(true);
    expect(play('other')).not.toEqual(a);
  });
  it('visitors by HQ tier, +1 on Open House, -1 Exhausted, and the length setting (boundary)', () => {
    const b = withCrew(blk(started()));
    b.day = 3;
    expect(visitorsTonight(b)).toBe(2);
    b.hqLevel = 6;
    expect(visitorsTonight(b)).toBe(6);
    b.day = 7;
    expect(visitorsTonight(b)).toBe(7);
    b.noRest = 3;
    expect(visitorsTonight(b)).toBe(6);
    b.hqLevel = 1;
    b.day = 3;
    b.noRest = 0;
    chairOf(b).opts.length = 'short';
    expect(visitorsTonight(b)).toBe(1);
    b.noRest = 3;
    expect(visitorsTonight(b)).toBe(1); // never below one
    chairOf(b).opts.length = 'long';
    b.noRest = 0;
    expect(visitorsTonight(b)).toBe(3);
    chairOf(b).opts.length = 'off';
    expect(visitorsTonight(b)).toBe(0);
  });
  it('cooldown 14 days, once cards once, tier gates, follow-up-only and switched-off cards never drawn', () => {
    const b = withCrew(blk(started()));
    b.day = 20;
    const c = cardById(26)!;
    expect(canDraw(b, c)).toBe(true);
    chairOf(b).seen['26'] = 10;
    expect(canDraw(b, c)).toBe(false);
    chairOf(b).seen['26'] = 6;
    expect(canDraw(b, c)).toBe(true);
    expect(canDraw(b, cardById(125)!)).toBe(false); // Tower card in a Warehouse
    b.hqLevel = 5;
    expect(canDraw(b, cardById(125)!)).toBe(true);
    b.hqLevel = 4;
    expect(canDraw(b, cardById(23)!)).toBe(false); // shopkeeper stops after Compound (and needs a Racket)
    expect(canDraw(b, cardById(2)!)).toBe(false);
    expect(canDraw(b, cardById(93)!)).toBe(false);
    expect(canDraw(b, cardById(145)!)).toBe(false);
  });
  it('a red zone puts its Crisis card first; no Hand it off, no Close the doors (Kice: a red zone never ends the run)', () => {
    let r = sit(day2());
    r = morning(r);
    r = edit(r, (b) => {
      b.funds = -50;
    });
    expect(redZones(blk(r))).toEqual(['money']);
    r = go(r, { t: 'toNight' });
    const door = atDoor(blk(r))!;
    expect(door.card.id).toBe(145);
    expect(handOffCrew(blk(r), door.card, door)).toEqual([]);
    expect(stepInRun(content, r, { t: 'closeDoors' }).ok).toBe(false);
    expect(stepInRun(content, r, { t: 'handOff', member: blk(r).members[0]!.id }).ok).toBe(false);
    r = go(r, { t: 'court', choice: 0 });
    expect(blk(r).funds).toBe(0);
    expect(redZones(blk(r))).not.toContain('money');
  });
  it('every Crisis answer pulls its number out of the red zone', () => {
    const base = withCrew(blk(day2()));
    const setups: Record<number, (b: DominionBlock) => void> = {
      145: (b) => void (b.funds = -400),
      146: (b) => void (b.field.districts[HQ]!.heat = 95),
      147: (b) => b.members.forEach((m) => void (m.morale = 3)),
      148: (b) => Object.assign(b.field.districts[HQ]!, { regard: 2, dread: 70 }),
      149: (b) => void (b.members[0]!.loyalty = 4),
    };
    for (const [id, set] of Object.entries(setups)) {
      for (const pick of [0, 1]) {
        let b = structuredClone(base);
        set(b);
        const zone = redZones(b)[0]!;
        expect(cardById(Number(id))!.crisis).toBe(zone);
        b.phase = 'evening';
        b = openSitting(b, 'crisis');
        expect(b.chair!.docket[0]!.card).toBe(Number(id));
        const r: RunState = { ...domRun(), expansion: { dominion: b } };
        const out = stepInRun(content, r, { t: 'court', choice: pick });
        expect(out.ok, `${id}/${pick}`).toBe(true);
        expect(redZones(blk(out.run)), `${id}/${pick}`).not.toContain(zone);
      }
    }
  });
  it('Close the doors: the rest go home (Regard -1 each), the Tally lists them; then the Night', () => {
    let r = morning(sit(day2()));
    for (let i = 0; i < 6; i++) r = round(r);
    r = go(r, { t: 'toNight' });
    const n = blk(r).chair!.docket.length;
    expect(n).toBeGreaterThanOrEqual(2);
    const reg = blk(r).field.districts[HQ]!.regard;
    r = go(r, { t: 'closeDoors' });
    expect(blk(r).field.districts[HQ]!.regard).toBe(Math.max(0, reg - n));
    expect(blk(r).chair!.tally.every((t) => t.pick === -1)).toBe(true);
    expect(chairModel(blk(r), r, 0, null).kind).toBe('tally');
    expect(go(r, { t: 'toNight' }).expansion!.dominion!.phase).toBe('night');
  });
  it('wrong moves are refused (failure)', () => {
    let r = day2();
    expect(stepInRun(content, r, { t: 'court', choice: 0 }).ok).toBe(false); // no sitting
    r = go(r, { t: 'toNight' });
    expect(stepInRun(content, r, { t: 'court', choice: 2 }).ok).toBe(false);
    expect(stepInRun(content, r, { t: 'courtNext' }).ok).toBe(false); // nothing answered yet
    expect(stepInRun(content, r, { t: 'rest' }).ok).toBe(false); // still Evening
    expect(stepInRun(content, r, { t: 'handOff', member: 'nobody' }).ok).toBe(false);
    r = go(r, { t: 'court', choice: 1 });
    expect(stepInRun(content, r, { t: 'court', choice: 0 }).ok).toBe(false); // answered once
  });
  it('Chair Off: only a Crisis comes; the length setting cycles', () => {
    let r = go(day2(), { t: 'chairOpt', key: 'length' });
    expect(blk(r).chair!.opts.length).toBe('long');
    r = go(go(go(r, { t: 'chairOpt', key: 'length' }), { t: 'chairOpt', key: 'length' }), { t: 'chairOpt', key: 'length' });
    expect(blk(r).chair!.opts.length).toBe('normal');
    r = go(go(go(r, { t: 'chairOpt', key: 'length' }), { t: 'chairOpt', key: 'length' }), { t: 'chairOpt', key: 'numbers' });
    expect(blk(r).chair!.opts).toEqual({ length: 'off', numbers: 'exact', speed: 'normal' });
    expect(go(r, { t: 'toNight' }).expansion!.dominion!.phase).toBe('night');
    r = edit(r, (b) => void (b.funds = -10));
    r = go(r, { t: 'toNight' });
    expect(blk(r).chair!.docket.map((d) => d.card)).toEqual([145]);
  });
});

describe('DOMINION D12: Hand it off and the whisper', () => {
  const withTwo = (): RunState => edit(day2(), (b) => {
    const m = structuredClone(b.members[0]!);
    m.id = 'm9';
    m.name = 'Dale';
    m.loyalty = 62;
    m.crew = { ...crewOf(m), green: 'greedy', formed: [] };
    b.members.push(m);
    b.members[0]!.loyalty = 30;
  });
  it('a member picks by their lean (Greedy: the money), gains Loyalty +2, once a sitting; never the named member', () => {
    let r = go(withTwo(), { t: 'toNight' });
    const door = atDoor(blk(r))!;
    const dale = blk(r).members.find((m) => m.name === 'Dale')!;
    expect(leanOf(dale)).toBe('money');
    expect(handOffCrew(blk(r), door.card, door).map((m) => m.id)).toEqual(['m9']);
    expect(stepInRun(content, r, { t: 'handOff', member: blk(r).members[0]!.id }).ok).toBe(false); // the mum's own son
    const want = wouldPick(blk(r), door.card, dale, null);
    r = go(r, { t: 'handOff', member: 'm9' });
    const row = blk(r).chair!.tally[0]!;
    expect(row.by).toBe('m9');
    expect(row.pick).toBe(want);
    expect(blk(r).members.find((m) => m.id === 'm9')!.loyalty).toBe(64);
    expect(crewOf(blk(r).members.find((m) => m.id === 'm9')!).tally.front).toBe(1);
    expect(blk(r).chair!.handed).toBe(true);
  });
  it('the whisper: the most loyal member; honest at 50+, money-minded at 20-49, selfish below 20', () => {
    const b = withCrew(blk(withTwo()));
    const c = cardById(25)!; // the landlord: pay (-₽, Heat -3) or lean on him (Dread +5, Heat +6)
    expect(rightHand(b)!.name).toBe('Dale');
    expect(whisper(b, c, null)!.pick).not.toBeNull();
    b.members[1]!.loyalty = 35;
    const mid = whisper(b, c, null)!;
    expect(mid.who.name).toBe('Dale');
    expect(mid.pick).toBe(1); // money: leaning on him keeps the cash (and 50%: rent drops)
    b.members[1]!.loyalty = 10;
    b.members[0]!.loyalty = 5;
    expect(whisper(b, c, null)!.text.length).toBeGreaterThan(0);
    expect(whisper(b, cardById(145)!, null)).toBeNull(); // nobody whispers at a Crisis
  });
});

describe('DOMINION D12: what answers do over time', () => {
  it('a weekly deal pays every 7th morning, with its Heat (the smuggler, card 50)', () => {
    let r = sit(day2());
    r = edit(r, (b) => {
      b.chair!.deals.push({ card: 50, n: 400, clean: false, heat: 3, risk: 0, wanted: 0, mon: 0, item: null, itemN: 0, ten: 0 });
    });
    const before = blk(r);
    let funds = before.funds;
    while (blk(r).day < 7) {
      funds = blk(r).funds;
      if (blk(r).day + 1 < 7) r = sit(morning(r));
      else r = answerTalks(go(r, { t: 'rest' }));
    }
    expect(blk(r).report.some((l) => l.includes('deals this week'))).toBe(true);
    expect(blk(r).empire!.weeks.at(-1)?.lines.chair ?? blk(r).empire!.week.chair).toBeDefined();
    void funds;
  });
  it('a Chair fight waits at the door; a win pays its stakes (the fisherman, card 31)', () => {
    let r = day2();
    r = go(r, { t: 'toNight' });
    r = edit(r, (b) => {
      b.chair!.docket = [{ card: 31, member: null, second: null }];
    });
    r = go(r, { t: 'court', choice: 0 });
    const f = blk(r).field.fight!;
    expect(f).toMatchObject({ why: 'court', foe: 'court', target: '31', action: '0', begun: false });
    const b = structuredClone(blk(r));
    const reg = b.field.districts[HQ]!.regard;
    b.field.fight = null;
    const lines = courtFightEnd(b, 'win', 'seed');
    expect(lines[0]).toContain('poacher');
    expect(b.field.districts[HQ]!.regard).toBe(reg + 6);
    expect(b.chair!.tags.fisherman).toBe('favour');
    expect(b.chair!.stake).toBeNull();
  });
  it('numbers later slices build are kept (Tension for D9, Threat for D11); press adds to Notoriety', () => {
    let r = day2();
    r = go(r, { t: 'toNight' });
    r = edit(r, (b) => {
      b.chair!.docket = [{ card: 76, member: null, second: null }, { card: 125, member: null, second: null }];
    });
    r = go(go(go(r, { t: 'court', choice: 1 }), { t: 'courtNext' }), { t: 'court', choice: 0 });
    const ch = blk(r).chair!;
    expect(ch.owed.ten).toBe(10);
    expect(ch.follow.some((f) => f.card === 77)).toBe(true);
    expect(ch.fame).toBe(8);
    expect(notorietyOf(blk(r)).press).toBe(8);
    expect(ch.tally[0]!.back).toBe(true);
  });
  it('a joiner waits on the Leads list (crew cap still applies)', () => {
    let r = day2();
    r = go(r, { t: 'toNight' });
    r = edit(r, (b) => void (b.chair!.docket = [{ card: 139, member: null, second: null }]));
    r = go(r, { t: 'court', choice: 0 });
    const lead = blk(r).crew!.leads.find((l) => l.name === 'Pops')!;
    expect(lead).toMatchObject({ waiting: true, foundBy: 'chair', green: 'lazy' });
  });
  it('items and Pokémon a card gives reach the Bag and the Stores', () => {
    let r = day2();
    r = go(r, { t: 'toNight' });
    r = edit(r, (b) => void (b.chair!.docket = [{ card: 58, member: null, second: null }, { card: 109, member: null, second: null }]));
    const candy = r.inventory['rare-candy'] ?? 0;
    const stores = blk(r).crew!.stores.length;
    r = go(go(go(r, { t: 'court', choice: 1 }), { t: 'courtNext' }), { t: 'court', choice: 1 });
    expect(r.inventory['rare-candy']).toBe(candy + 3);
    expect(blk(r).crew!.stores.length).toBe(stores + 2);
    expect(blk(r).chair!.tags['courier-boss']).toBe('grudge');
  });
});

describe('DOMINION D12: saves', () => {
  it('save and reload mid-sitting: the same visitor is still at the door; a D6 save without `chair` loads', () => {
    let r = go(day2(), { t: 'toNight' });
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.data).toEqual(r);
    expect(atDoor(blk(loaded.data))!.card.id).toBe(1);
    r = go(loaded.data, { t: 'court', choice: 0 });
    new SaveManager(storage, content).saveRun(r);
    const mid = new SaveManager(storage, content).loadRun();
    if (mid.status !== 'ok') throw new Error('load');
    expect(mid.data.expansion!.dominion!.chair!.result).toEqual(blk(r).chair!.result);
    const old = structuredClone(day2());
    delete old.expansion!.dominion!.chair;
    new SaveManager(storage, content).saveRun(old);
    const back = new SaveManager(storage, content).loadRun();
    expect(back.status).toBe('ok');
    if (back.status !== 'ok') return;
    expect(back.data.expansion!.dominion!.chair).toBeUndefined();
    expect(blk(go(back.data, { t: 'toNight' })).chair!.docket[0]!.card).toBe(1);
  });
  it('a damaged Chair does not pass the schema (failure)', () => {
    const b = structuredClone(blk(go(day2(), { t: 'toNight' })));
    (b.chair as unknown as { at: number }).at = -1;
    expect(DominionBlockSchema.safeParse(b).success).toBe(false);
    const c = structuredClone(blk(go(day2(), { t: 'toNight' })));
    (c.chair!.opts as unknown as { length: string }).length = 'forever';
    expect(DominionBlockSchema.safeParse(c).success).toBe(false);
  });
});
