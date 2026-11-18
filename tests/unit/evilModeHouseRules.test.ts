// Evil Mode slice 22, part two: the five limited house rules made real (Part 28 sections 7.3 to 11.3), the Turn's route
// moods (14.3) and its first meeting with the Hero (15.2). Normal, boundary and failure cases.

import { describe, expect, it } from 'vitest';
import { CHARTERS, charterAct, charterMoves, houseActs, houseLine, meetingDue, meetingModel, signatureHold } from '../../src/core/evilMode/charters';
import { step } from '../../src/core/evilMode/day';
import { boardModel, newDispatch } from '../../src/core/evilMode/boardScreens';
import { oddsFor } from '../../src/core/evilMode/odds';
import { takingsScale, unasked } from '../../src/core/evilMode/charterRules';
import { charterInRun, ensureEvil, EVIL_MODE_ID } from '../../src/core/evilMode/session';
import { EvilModeBlockSchema, type EvilModeBlock } from '../../src/core/evilMode/schema';
import { liedToHero } from '../../src/core/evilMode/fires';
import { routeMoods, turnRun } from '../../src/core/evilMode/turn';
import { RivalSchema } from '../../src/core/story/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const H = CHARTERS.houseRules;
const evilRun = (id: string): EvilModeBlock => {
  const run = chooseStarter(content, createRun(content, { runId: `h-${id}`, seed: `h-${id}`, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
  return ensureEvil(charterInRun(run, id, 'three').run).expansion!.evilMode!;
};
const at = (b: EvilModeBlock, beat: EvilModeBlock['here']['beat'], day = b.here.day): EvilModeBlock => ({ ...b, here: { ...b.here, beat, day } });
const act = (b: EvilModeBlock, a: Parameters<typeof charterAct>[1]) => charterAct(b, a);

describe('Galactic: nobody has asked (7.3)', () => {
  it('a local\'s mood is "?" and its jobs roll as Easy until asked; asking shows it and never changes it', () => {
    const b = at(evilRun('galactic'), 'dispatch');
    const h = b.district!.holdings.find((x) => x.kind === 'local' && x.mood && x.mood !== 'easy')!;
    expect(unasked(b, h.id)).toBe(true);
    const job = { holdingId: h.id, method: 'persuade' as const, squad: [b.crew[0]!.id, b.crew[1]!.id, b.crew[2]!.id] };
    const before = oddsFor({ ...b, district: { ...b.district!, holdings: b.district!.holdings.map((x) => (x.id === h.id ? { ...x, scouted: 1 } : x)) } }, job);
    expect(before.terms.find((t) => t.label.startsWith('Mood: ?'))).toBeTruthy();
    const i = b.district!.holdings.indexOf(h);
    expect(boardModel({ ...b, district: { ...b.district!, holdings: b.district!.holdings.map((x) => (x.id === h.id ? { ...x, scouted: 1 } : x)) } }, { ...newDispatch(), at: i }).panel.mood).toBe('?');
    const r = act(b, { what: 'ask', holdingId: h.id });
    expect(r.problem).toBeNull();
    expect(unasked(r.block, h.id)).toBe(false);
    expect(r.block.district!.holdings.find((x) => x.id === h.id)!.mood).toBe(h.mood);
    const after = oddsFor({ ...r.block, district: { ...r.block.district!, holdings: r.block.district!.holdings.map((x) => (x.id === h.id ? { ...x, scouted: 1 } : x)) } }, job);
    expect(after.terms.find((t) => t.label.startsWith('Mood: ?'))).toBeUndefined();
    // One a day, and not twice.
    const other = b.district!.holdings.find((x) => x.mood && x.id !== h.id)!;
    expect(act(r.block, { what: 'ask', holdingId: other.id }).problem).toMatch(/One street a day/);
    expect(act(at(r.block, 'dispatch', r.block.here.day + 1), { what: 'ask', holdingId: h.id }).problem).toMatch(/asked/);
    expect(act(at(b, 'evening'), { what: 'ask', holdingId: h.id }).problem).toMatch(/Morning/);
    expect(houseActs(b)[0]!.label).toMatch(/ask/);
  });
});

describe('Plasma: the sentence gets written (8.3)', () => {
  it('takings pay nothing until whole; the four parts come by Bronius, the first win, the Boss after the first loss, and the Hall', () => {
    let b = evilRun('plasma');
    expect(takingsScale(b)).toBe(H.plasma.before);
    expect(act(at(b, 'morning'), { what: 'who' }).problem).toMatch(/Evening/);
    b = act(at(b, 'evening'), { what: 'who' }).block;
    expect(b.charter!.sentence!.who).toBe(H.plasma.who);
    const job = (result: 'went' | 'didnt'): EvilModeBlock => ({ ...b, log: [...b.log, { id: `j-${result}`, day: b.here.day, region: b.here.region, district: 0, kind: 'job', who: [], result, text: 'x' }] });
    b = charterMoves(b, job('went'));
    expect(b.charter!.sentence!.wrong).toContain(':');
    expect(act(b, { what: 'cause', pick: 0 }).problem).toMatch(/Nothing has gone wrong/);
    b = charterMoves(b, job('didnt'));
    expect(b.charter!.causeDue).toBe(true);
    expect(houseActs(b)).toHaveLength(4);
    expect(act(b, { what: 'cause', pick: 9 }).problem).toMatch(/four/);
    b = act(b, { what: 'cause', pick: 2 }).block;
    // The Hall says the fourth at the Evening (the player never chooses it).
    b = charterMoves(at(b, 'evening'), at(b, 'evening'));
    expect(b.charter!.sentence!.wont).toBe(H.plasma.wont);
    expect(takingsScale(b)).toBe(H.plasma.after);
    expect(takingsScale({ ...b, here: { ...b.here, region: b.here.region + 1 } })).toBe(1);
    expect(houseLine(b)).toMatch(/whole/);
  });

  it('a cellar return is free, Regard +1, one an Evening', () => {
    const b = at(evilRun('plasma'), 'evening');
    const r = act(b, { what: 'return' });
    expect(r.problem).toBeNull();
    expect(r.block.team.funds).toBe(b.team.funds);
    expect(r.block.team.regard).toBe(Math.min(10, b.team.regard + 1));
    expect(act(r.block, { what: 'return' }).problem).toMatch(/One a day/);
  });
});

describe('Flare: seats at the dinner (9.3)', () => {
  it('an unseated member pays no dues and loses 2 Loyalty', () => {
    const b0 = evilRun('flare');
    const who = b0.crew.find((c) => c.where === 'in')!;
    const b = act(at(b0, 'evening', 7), { what: 'seat', who: who.id }).block;
    expect(b.charter!.unseated).toEqual([who.id]);
    const after = charterMoves(at(b, 'night', 7), at(b, 'morning', 8));
    const members = Math.min(CHARTERS.flareMembers, b.crew.filter((c) => c.where === 'in').length - 1);
    expect(after.team.funds).toBe(b.team.funds + members * CHARTERS.flareDues);
    expect(after.crew.find((c) => c.id === who.id)!.loyalty).toBe(Math.max(0, who.loyalty + H.flare.unseatedLoyalty));
    // Laid for again: seated.
    expect(act(b, { what: 'seat', who: who.id }).block.charter!.unseated).toEqual([]);
    expect(act(b, { what: 'seat', who: 'nobody' }).problem).toMatch(/house/);
  });
});

describe('The Two Boards: two purses (10.3)', () => {
  it('Aether\'s ₽9,000 is its own; Faba\'s form moves money once a day for Regard, never for money', () => {
    const b = evilRun('two-boards');
    expect(b.charter!.aether).toBe(H.twoBoards.aether);
    expect(houseLine(b)).toMatch(/Aether ₽9,000/);
    const r = act(b, { what: 'form' });
    expect(r.problem).toBeNull();
    expect(r.block.team.funds).toBe(b.team.funds + H.twoBoards.form);
    expect(r.block.charter!.aether).toBe(H.twoBoards.aether - H.twoBoards.form);
    expect(r.block.team.regard).toBe(Math.max(0, b.team.regard + H.twoBoards.regard));
    expect(act(r.block, { what: 'form' }).problem).toMatch(/one form a day/);
    expect(act({ ...b, charter: { ...b.charter!, aether: 0 } }, { what: 'form' }).problem).toMatch(/empty/);
  });
});

describe('The Group: it needs a signature (11.3)', () => {
  it('a spend over ₽2,000 is held; next Morning money-makers are a yes (and free after), others a no', () => {
    const b = evilRun('group');
    const spent = { ...b, team: { ...b.team, funds: b.team.funds - 3000 } };
    expect(signatureHold(b, { type: 'trade' }, { ...b, team: { ...b.team, funds: b.team.funds - 1500 } })).toBeNull();
    expect(signatureHold(b, { type: 'callItADay' }, spent)).toBeNull();
    const held = signatureHold(b, { type: 'trade' }, spent)!;
    expect(held.block.team.funds).toBe(b.team.funds);
    expect(held.block.charter!.pending!.key).toBe('trade');
    const next = charterMoves(at(held.block, 'night'), at(held.block, 'morning', held.block.here.day + 1));
    expect(next.charter!.pending).toBeNull();
    expect(next.charter!.approved).toContain('trade');
    expect(signatureHold(next, { type: 'trade' }, { ...next, team: { ...next.team, funds: next.team.funds - 3000 } })).toBeNull();
    const clinic = signatureHold(b, { type: 'build', room: 'infirmary' }, spent)!;
    const no = charterMoves(at(clinic.block, 'night'), at(clinic.block, 'morning', clinic.block.here.day + 1));
    expect(no.charter!.approved).not.toContain('build:infirmary');
    expect(no.log.at(-1)!.text).toMatch(/no, with a memo/);
  });

  it('the Books talent writes one memo a district', () => {
    const b0 = evilRun('group');
    const b1 = { ...b0, crew: b0.crew.map((c, i) => (i === 0 ? { ...c, talent: 'books' as const } : c)) };
    const held = signatureHold(b1, { type: 'build', room: 'infirmary' }, { ...b1, team: { ...b1.team, funds: b1.team.funds - 3000 } })!.block;
    const r = act(held, { what: 'memo' });
    expect(r.problem).toBeNull();
    expect(r.block.charter!.approved).toContain('build:infirmary');
    const again = signatureHold(r.block, { type: 'trade' }, { ...r.block, team: { ...r.block.team, funds: r.block.team.funds - 3000 } })!.block;
    expect(act(again, { what: 'memo' }).problem).toMatch(/One memo a district/);
    expect(act({ ...held, crew: held.crew.map((c) => ({ ...c, talent: 'hands' as const })) }, { what: 'memo' }).problem).toMatch(/Books/);
  });
});

const mainRun = (): RunState => chooseStarter(content, createRun(content, { runId: 't9', seed: 't9', archetypeId: 'red', rules: STANDARD_CHOICE }), 0);
const rival = (id: string, encounters: number, setbacks: number, potential: number) => RivalSchema.parse({
  id, classId: 'youngster', name: `Kid ${id}`, archetype: 'idealist', style: 'balanced', traits: { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 50, resilience: 50 }, rivalPotential: potential, state: 'recurring',
  memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 1, turns: 0, team: [], foes: [] } },
  encounters, setbacks, origin: { eventId: 'x', where: { region: 0, stage: 1, level: 5, node: null, battle: null, turn: null }, path: 'x' },
});
const flagged = (run: RunState, flags: Record<string, number> = {}, evil = 0): RunState => ({
  ...run, money: 5000, badges: ['a', 'b'], attributeModifiers: { ...run.attributeModifiers, goodEvil: evil },
  story: { ...run.story, flags: { ...run.story.flags, 'ev:evil-start-galactic': 1, ...flags }, rivals: [rival('r1', 5, 0, 60), rival('r2', 2, 6, 80), rival('r3', 2, 1, 10), rival('r4', 1, 0, 50)] },
});

describe('The Turn: route moods (14.3) and the first meeting (15.2)', () => {
  it('Loyalty is 4 ± 2 by the route; Dread 2 + one per victim; never rolled', () => {
    expect(routeMoods(flagged(mainRun()))).toEqual({ loyalty: 4, dread: 2 });
    expect(routeMoods(flagged(mainRun(), { 'ev:kind-total': 30 })).loyalty).toBe(6);
    expect(routeMoods(flagged(mainRun(), { 'ev:kind-total': 3 })).loyalty).toBe(5);
    expect(routeMoods(flagged(mainRun(), {}, -30)).loyalty).toBe(2);
    expect(routeMoods(flagged(mainRun(), { 'ev:front-exposed': 1, 'ev:flare-pool-paid': 1 })).dread).toBe(4);
    const r = turnRun(flagged(mainRun(), { 'ev:kind-total': 6, 'ev:front-exposed': 1 }))!;
    const b = r.expansion!.evilMode!;
    expect(b.team.dread).toBe(3);
    expect(b.crew.every((c) => c.loyalty === 6)).toBe(true);
  });

  it('day 2, In person: the Hero stands in the road; the day waits; one answer, kept; "not what it looks like" is a lie', () => {
    let b = turnRun(flagged(mainRun()))!.expansion!.evilMode!;
    expect(meetingDue(at(b, 'inPerson', 1))).toBe(false);
    b = at(b, 'inPerson', CHARTERS.turn.meetingDay);
    expect(meetingDue(b)).toBe(true);
    const m = meetingModel(b)!;
    expect(m.line).toBe(CHARTERS.turn.meeting.lines[b.hero!.personality]);
    expect(m.answers.map((a) => a.key)).toEqual(['lie', 'true', 'silent']);
    expect(step(b, { type: 'stayIn' }).ok).toBe(false);
    const lie = step(b, { type: 'turnMeet', answer: 'lie' });
    expect(lie.ok).toBe(true);
    expect(lie.block.turn!.met).toBe('lie');
    expect(liedToHero(lie.block)).toBe(true);
    expect(meetingDue(lie.block)).toBe(false);
    expect(step(lie.block, { type: 'turnMeet', answer: 'true' }).ok).toBe(false);
    const truth = step(b, { type: 'turnMeet', answer: 'true' });
    expect(liedToHero(truth.block)).toBe(false);
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(truth.block)))).toEqual(truth.block);
    // A founded team (no Turn) never meets them this way.
    expect(meetingDue(at(evilRun('rocket'), 'inPerson', 2))).toBe(false);
  });
});
