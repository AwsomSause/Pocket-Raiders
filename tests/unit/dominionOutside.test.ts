// DOMINION D10 follow-up, part 2: the street meetings of sections B (Shops), C (Police), D (Gyms), E (Trainers),
// H (Labs), I (Wild Pokémon) and K (Crime World) play (growthOutside.ts + town.json), and the rival teams' five Gym moves
// and "Turn your Pokémon against you" (rival actions 53, 62, 69, 79, 128, 130) run.
import { describe, expect, it } from 'vitest';
import trainersRaw from '../../src/data/trainers.json';
import { empireOf } from '../../src/core/dominion/book';
import { chairOf } from '../../src/core/dominion/chair';
import { crewOf, withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { card, settle } from '../../src/core/dominion/field';
import { beginDominionFight } from '../../src/core/dominion/fight';
import { growthOf } from '../../src/core/dominion/growth';
import { courtOf } from '../../src/core/dominion/growthCourt';
import { answerCard, forceAction, rivalsOf, stageIndex, withRivals } from '../../src/core/dominion/rivals';
import { DominionBlockSchema, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { answerMeet, maybeMeet } from '../../src/core/dominion/town';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const TW = DOMINION_DATA.town;
const HQ = DOMINION_DATA.field.hq; // Pewter: Brock's Gym
const T = 'rocket';
const SECTIONS = ['B', 'C', 'D', 'E', 'H', 'I', 'K'];
const domRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'out'): RunState => startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 }).run;
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const edit = (r: RunState, f: (b: DominionBlock, r: RunState) => void): RunState => {
  const out = structuredClone(r);
  const b = withRivals(withCrew(out.expansion!.dominion!));
  f(b, out);
  return { ...out, expansion: { ...out.expansion, dominion: DominionBlockSchema.parse(b) } };
};
/** A block with the street meeting `row` waiting in `district`. */
const meeting = (row: string, district = HQ, seed = 'out', f: (b: DominionBlock) => void = () => {}): DominionBlock => {
  const b = withRivals(withCrew(structuredClone(blk(started(seed)))));
  b.funds = 5000;
  Object.assign(empireOf(b), { peak: 1, meet: { row, district, day: b.day }, met: [row], metDay: b.day });
  f(b);
  return b;
};
/** The same, through the session (what needs the Bag settles after the step). */
const meetInRun = (row: string, choice: number, f: (b: DominionBlock, r: RunState) => void = () => {}, district = HQ): RunState => {
  const r = edit(started(`run-${row}`), (b, run) => {
    b.funds = 5000;
    Object.assign(empireOf(b), { peak: 1, meet: { row, district, day: b.day }, met: [row], metDay: b.day });
    f(b, run);
  });
  const out = stepInRun(content, r, { t: 'townMeet', choice });
  expect(out.ok, out.notice ?? '').toBe(true);
  return out.run;
};
const rivalsAt = (tension: number, seed = 'rgym'): DominionBlock => {
  const b = withRivals(withCrew(structuredClone(blk(started(seed)))));
  b.rivals!.teams[T]!.tension = tension;
  b.rivals!.teams[T]!.stage = stageIndex(tension);
  return b;
};
/** The Gym Takeover's Card in Pewter, the way given (scouted three times so Blackmail is open). */
const takeover = (b: DominionBlock, r: RunState, way = 'blackmail') => card(b, r, 'gym-takeover', null, HQ, [], way)!;
const sharp = (b: DominionBlock): void => {
  for (const k of ['brawn', 'nerve', 'wits', 'charm', 'stealth'] as const) b.field.edge.stats[k] = 10;
  empireOf(b).peak = DOMINION_DATA.empire.notoriety.steps.length - 1;
  growthOf(b).gymScout['pewter-gym'] = Math.max(3, growthOf(b).gymScout['pewter-gym'] ?? 0);
  b.phase = 'day';
  b.actions = 10;
};
/** Rivals at `tension`, with Brock's Gym the one the Boss has scouted most (so it is the one they go after). */
const aimed = (tension: number): DominionBlock => {
  const b = rivalsAt(tension);
  growthOf(b).gymScout['pewter-gym'] = 1;
  return b;
};

describe('DOMINION D10 follow-up: the street meetings of sections B-E, H, I and K (data)', () => {
  const rows = DOMINION_DATA.outside.filter((r) => SECTIONS.includes(r.section));
  it('all 180 play: each choice of each row has an effect; a limited row says what it leaves out', () => {
    expect(rows).toHaveLength(180);
    for (const r of rows) {
      expect(r.status, r.id).not.toBe('disabled');
      expect(r.waits, r.id).toBeUndefined();
      if (r.status === 'limited') expect(r.note, r.id).toBeTruthy();
      expect(TW.rows[r.id], r.id).toHaveLength(r.choices.length);
    }
    expect(DOMINION_DATA.outside.filter((r) => r.status === 'disabled').map((r) => r.section).every((s) => s === 'G' || s === 'L')).toBe(true);
  });
  it('every foe is a real trainer class with real species; every item and Pokémon a choice gives exists', () => {
    const classes = new Set((trainersRaw as { id: string }[]).map((t) => t.id));
    for (const [k, f] of Object.entries(TW.foes)) {
      if (!f.wild) expect(classes.has(f.cls), `${k}: ${f.cls}`).toBe(true);
      for (const s of f.species) expect(content.species.has(s), `${k}: ${s}`).toBe(true);
    }
    for (const [id, cs] of Object.entries(TW.rows)) {
      for (const c of cs) for (const fx of [c, c.fail ?? {}, c.lose ?? {}]) {
        if (fx.item) expect(content.items.has(fx.item), `${id}: ${fx.item}`).toBe(true);
        if (fx.mon && fx.mon !== 'local') expect(content.species.has(fx.mon), `${id}: ${fx.mon}`).toBe(true);
        if (fx.contact) expect(DOMINION_DATA.growth.specialists.some((s) => s.id === fx.contact), `${id}: ${fx.contact}`).toBe(true);
      }
    }
  });
  it('the town file refuses a fight with no foe (failure)', async () => {
    const { TownFileSchema } = await import('../../src/core/dominion/schema');
    const bad = structuredClone(TW) as typeof TW;
    bad.rows.O111 = [{ fight: 'nobody' }, {}];
    expect(TownFileSchema.safeParse(bad).success).toBe(false);
  });
});

describe('DOMINION D10 follow-up: street meetings in play', () => {
  it('a Gym row only comes up in a town with a Gym (Pallet has none; boundary)', () => {
    const gymRows = new Set(Object.entries(TW.needs).filter(([, n]) => n.gym).map(([id]) => id));
    const base = withRivals(withCrew(structuredClone(blk(started('nogym')))));
    empireOf(base).peak = 1;
    let met = 0;
    for (let i = 0; i < 300; i++) {
      const out = maybeMeet(base, 'pallet', `g-${i}`, false);
      const row = out.block.empire?.meet?.row;
      if (row) met += 1;
      expect(gymRows.has(row ?? '')).toBe(false);
    }
    expect(met).toBeGreaterThan(0);
  });
  it('Extort the Poké Mart clerk: money now and a weekly racket on the town\'s shop', () => {
    const b = meeting('O031');
    const funds = b.funds, n = b.field.rackets.length;
    const out = answerMeet(b, 0, 's');
    expect(out.ok).toBe(true);
    expect(out.block.funds).toBe(funds + 120);
    expect(out.block.field.rackets).toHaveLength(n + 1);
    expect(out.block.field.rackets.at(-1)).toMatchObject({ district: HQ, kind: 'racket' });
    expect(out.notice).toMatch(/pays you ₽\d+ a week/);
  });
  it('Bribe the Leader\'s assistant: ₽300 and one more scouting point on Brock\'s Gym; short of money is refused', () => {
    const out = answerMeet(meeting('O089'), 0, 's');
    expect(growthOf(out.block).gymScout['pewter-gym']).toBe(1);
    expect(answerMeet(meeting('O089', HQ, 'out', (b) => (b.funds = 100)), 0, 's').ok).toBe(false);
  });
  it('Challenge the Gym Leader in the square: a battle with Brock himself; a win shakes him', () => {
    const b = meeting('O086');
    const out = answerMeet(b, 1, 's');
    expect(out.fight).toBe(true);
    expect(out.block.field.fight).toMatchObject({ why: 'town', foe: 'town', target: 'leader:pewter-gym' });
    const r = edit(started('out'), (x) => Object.assign(x, structuredClone(out.block)));
    const f = beginDominionFight(content, r)!;
    expect(f.battle?.trainer).toMatchObject({ name: 'Brock', classId: 'gym-leader', leaderId: 'brock' });
    const won = structuredClone(out.block);
    settle(content, won, r, 'win', null);
    expect(growthOf(won).shaken['pewter-gym']).toBeGreaterThan(won.day);
  });
  it('a wild foe is a wild battle: the Snorlax on the bridge', () => {
    const out = answerMeet(meeting('O217'), 0, 's');
    expect(out.block.field.fight).toMatchObject({ foe: 'town', target: 'snorlax' });
    const r = edit(started('out'), (x) => Object.assign(x, structuredClone(out.block)));
    const f = beginDominionFight(content, r)!;
    expect(f.battle?.trainer ?? null).toBeNull();
    expect(f.battle?.enemyTeam[0]?.speciesId).toBe('snorlax');
  });
  it('Take the abandoned Egg: a Pokémon from the region goes to the Stores after the step', () => {
    const r0 = started('run-O220');
    const n = blk(r0).crew?.stores.length ?? 0;
    const r = meetInRun('O220', 0);
    expect(blk(r).crew!.stores.length).toBe(n + 1);
    expect(chairOf(blk(r)).give).toEqual([]);
  });
  it('the Fence\'s fair price sells the hot goods at 60% after the step; with none, nothing is sold', () => {
    const r = meetInRun('O252', 0, (b, run) => {
      growthOf(b).hot = { 'super-potion': 2 };
      run.inventory['super-potion'] = 2;
    });
    expect(r.inventory['super-potion'] ?? 0).toBe(0);
    expect(courtOf(blk(r)).sell).toEqual([]);
    expect(JSON.stringify(blk(r).report)).toMatch(/60%/);
    const none = answerMeet(meeting('O252'), 0, 's');
    expect(none.notice).toMatch(/no hot goods/);
  });
  it('the heist crew\'s job pays out a crate and cash after the step', () => {
    const r = meetInRun('O270', 0);
    expect(blk(r).funds).toBeGreaterThanOrEqual(5000 + DOMINION_DATA.growth.court.heistCash);
    expect(courtOf(blk(r)).heist).toBe(0);
    expect(JSON.stringify(blk(r).report)).toMatch(/joint heist pays out/);
  });
  it('Rent a safehouse; hire the back-street medic; the forger\'s papers', () => {
    expect(growthOf(answerMeet(meeting('O257'), 0, 's').block).safehouses).toContain(HQ);
    expect(growthOf(answerMeet(meeting('O263'), 1, 's').block).contacts).toContain('medic');
    expect(growthOf(answerMeet(meeting('O255'), 0, 's').block).papers).toBe(1);
  });
  it('Court date: only with someone in a cell; bail walks them out', () => {
    const base = withRivals(withCrew(structuredClone(blk(started('bail')))));
    empireOf(base).peak = 1;
    for (let i = 0; i < 300; i++) expect(maybeMeet(base, 'viridian', `b-${i}`, false).block.empire?.meet?.row).not.toBe('O071');
    const b = meeting('O071', HQ, 'out', (x) => (crewOf(x.members[0]!).out = { why: 'jail', days: 3 }));
    const out = answerMeet(b, 0, 's');
    expect(crewOf(out.block.members[0]!).out).toBeNull();
    expect(out.notice).toMatch(/walks out of jail/);
  });
  it('a test of a stat: the casino cheat passes on a sharp crew and fails on a dull one', () => {
    const sharpB = meeting('O045', HQ, 'out', (x) => x.members.forEach((m) => (m.stats.stealth = 20)));
    const dull = meeting('O045', HQ, 'out', (x) => x.members.forEach((m) => (m.stats.stealth = 0)));
    expect(answerMeet(sharpB, 1, 's').block.funds).toBe(sharpB.funds + 700);
    expect(answerMeet(dull, 1, 's').block.funds).toBe(dull.funds - 200);
  });
  it('the same seed gives the same answer (determinism)', () => {
    expect(answerMeet(meeting('O213'), 0, 'x').block).toEqual(answerMeet(meeting('O213'), 0, 'x').block);
  });
});

describe('DOMINION D10 follow-up: the rival teams go after your Gym plans', () => {
  it('the six actions are live with their kinds', () => {
    const byN = (n: number) => DOMINION_DATA.rivalActions.actions.find((a) => a.n === n)!;
    expect([53, 62, 69, 79, 128, 130].map((n) => [byN(n).status, byN(n).kind])).toEqual([
      ['supported', 'gymSmear'], ['supported', 'gymRefuse'], ['supported', 'gymFrame'], ['supported', 'gymAnnex'], ['supported', 'gymWeaken'], ['supported', 'turned'],
    ]);
  });
  it('Smear campaign: the Leader thinks you a thug, and the takeover odds drop; courting them again clears it', () => {
    const r = started('smear');
    const b = rivalsAt(60);
    growthOf(b).courted = ['pewter-gym'];
    const { block, lines } = forceAction(b, T, 'smear-campaign', 's');
    expect(growthOf(block).foes!.cold['pewter-gym']).toBeGreaterThan(0);
    expect(lines.join(' ')).toMatch(/Brock now hears of you as a thug/);
    sharp(block);
    const c = takeover(block, r);
    expect(c.parts.find(([l]) => l === DOMINION_DATA.growth.lines.coldOdds)?.[1]).toBeLessThan(0);
  });
  it('Pay a Gym Leader: no takeover there until the weeks are up (failure), then open again (boundary)', () => {
    const r = started('pay');
    const { block } = forceAction(aimed(60), T, 'pay-a-gym-leader', 's');
    const until = growthOf(block).foes!.refuse['pewter-gym']!;
    expect(until).toBeGreaterThanOrEqual(block.day + DOMINION_DATA.start.clock.weekLength);
    sharp(block);
    expect(takeover(block, r, 'beat').blocked).toMatch(/won't see you until Day/);
    block.day = until + 1;
    expect(takeover(block, r, 'beat').blocked ?? '').not.toMatch(/won't see you/);
  });
  it('Frame your Gym ally: needs an ally (nothing happens without one); with one, the way in is gone and Heat rises', () => {
    expect(forceAction(rivalsAt(80), T, 'frame-your-gym-ally', 's').lines).toEqual([]);
    const b = rivalsAt(80);
    growthOf(b).courted = ['pewter-gym'];
    const heat = b.field.districts[HQ]!.heat;
    const { block, lines } = forceAction(b, T, 'frame-your-gym-ally', 's');
    expect(growthOf(block).courted).toEqual([]);
    expect(block.field.districts[HQ]!.heat).toBeGreaterThan(heat);
    expect(lines.join(' ')).toMatch(/arrested/);
  });
  it('Annex a gym town: Blackmail there needs more scouting', () => {
    const r = started('annex');
    const { block } = forceAction(aimed(80), T, 'annex-a-gym-town', 's');
    sharp(block);
    expect(takeover(block, r).blocked).toMatch(/Blackmail needs \d+ more scouting in Pewter/);
    growthOf(block).gymScout['pewter-gym'] = 3 + growthOf(block).foes!.annex['pewter-gym']!;
    expect(takeover(block, r).blocked).toBeNull();
    expect(takeover(block, r).parts.some(([l, n]) => l === DOMINION_DATA.growth.lines.annexOdds && n < 0)).toBe(true);
  });
  it('Weaken your gym ally\'s Pokémon: the takeover odds drop for a week', () => {
    const r = started('weak');
    const b = rivalsAt(70);
    growthOf(b).courted = ['pewter-gym'];
    const { block } = forceAction(b, T, 'weaken-your-gym-allys-pok-mon', 's');
    const [day, n] = growthOf(block).foes!.weak['pewter-gym']!;
    sharp(block);
    expect(takeover(block, r).parts.find(([l]) => l === DOMINION_DATA.growth.lines.weakOdds)?.[1]).toBe(-n);
    block.day = day + 1;
    expect(takeover(block, r).parts.some(([l]) => l === DOMINION_DATA.growth.lines.weakOdds)).toBe(false);
  });
  it('Turn your Pokémon against you: a fight card where your own strongest Pokémon fights you', () => {
    const run = started('turn');
    const { block } = forceAction(rivalsAt(80), T, 'turn-your-pok-mon-against-you', 's');
    const i = rivalsOf(block).cards.findIndex((c) => c.ref === 'turn-your-pok-mon-against-you');
    expect(i).toBeGreaterThanOrEqual(0);
    const out = answerCard(block, i, 0, 's');
    expect(out.fight).toBe(true);
    const r = edit(run, (x) => Object.assign(x, structuredClone(out.block)));
    const best = [...r.party].sort((x, y) => y.level - x.level)[0]!;
    const f = beginDominionFight(content, r)!;
    expect(f.battle?.trainer?.name).toMatch(/with your own/);
    const mon = f.battle!.enemyTeam[0]!;
    expect([mon.speciesId, mon.level]).toEqual([best.speciesId, best.level]);
  });
  it('what they did survives save/reload; a save from before loads', () => {
    const { block } = forceAction(aimed(60), T, 'pay-a-gym-leader', 's');
    expect(DominionBlockSchema.parse(JSON.parse(JSON.stringify(block))).growth!.foes).toEqual(block.growth!.foes);
    const old = structuredClone(block);
    delete old.growth!.foes;
    expect(() => DominionBlockSchema.parse(old)).not.toThrow();
  });
});
