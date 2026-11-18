// Evil Mode slice 22 ("other beginnings"): the nine Charters and the Turn (design Part 28, its twenty-one tests), the
// remaining settings, and the phone's Dispatch methods (Part 29).
import { describe, expect, it } from 'vitest';
import chartersRaw from '../../src/data/evilMode/charters.json';
import { CHARTERS, charterAct, charterMoves, charterRefuses, chartersOpen, charterTabModel, halves, houseActs, houseLine, questionLine, returnCost, rollFigure, takeCharter } from '../../src/core/evilMode/charters';
import { step } from '../../src/core/evilMode/day';
import { boardModel, methodsShown, newDispatch } from '../../src/core/evilMode/boardScreens';
import { teamLoyalty } from '../../src/core/evilMode/people';
import { charterInRun, EVIL_MODE_ID } from '../../src/core/evilMode/session';
import { EvilModeBlockSchema, type EvilModeBlock } from '../../src/core/evilMode/schema';
import { assignRoles, regionsLeft, TURN_ANSWERED, turnOffer, turnRun, walkAway, wonTakeover } from '../../src/core/evilMode/turn';
import { runRegions } from '../../src/core/evilMode/runLength';
import { EXPANSION_SETTINGS_DEFAULTS } from '../../src/core/expansion/schema';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { RivalSchema } from '../../src/core/story/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { changeSetting, SETTINGS } from '../../src/core/settingsRegistry';
import { DEFAULT_SETTINGS } from '../../src/save/saveManager';
import { content } from './helpers';

const opts = { boss: 'red', length: 'three' as const, seed: 'charter-seed' };
const take = (id: string): EvilModeBlock => {
  const out = takeCharter(id, opts);
  if (!out.ok) throw new Error(out.problem);
  return out.block;
};
const at = (b: EvilModeBlock, beat: EvilModeBlock['here']['beat'], day = b.here.day): EvilModeBlock => ({ ...b, here: { ...b.here, beat, day } });

describe('Charters (Part 28 sections 2 to 13)', () => {
  it('1. a Charter reads no profile data: same Charter and seed, the same first Morning, desk and house', () => {
    for (const c of CHARTERS.charters) expect(JSON.stringify(take(c.id))).toBe(JSON.stringify(take(c.id)));
    // A different seed may draw a different Roster, but the desk, the house rule and the numbers are the Charter's.
    const a = take('rocket');
    const b = takeCharter('rocket', { ...opts, seed: 'other' });
    expect(b.ok && b.block.team.funds).toBe(a.team.funds);
    expect(b.ok && b.block.log.filter((l) => l.kind === 'charter').map((l) => l.text)).toEqual(a.log.filter((l) => l.kind === 'charter').map((l) => l.text));
  });

  it('2. all nine Charters are open on a profile that has never played the mode, and nothing unlocks them', () => {
    expect(chartersOpen()).toHaveLength(9);
    for (const c of chartersOpen()) expect(takeCharter(c.id, opts).ok).toBe(true);
    expect(takeCharter('nope', opts).ok).toBe(false);
    expect(takeCharter('rocket', opts, undefined, { ...CHARTERS, on: false }).ok).toBe(false);
  });

  it('3. every Charter start block passes the schema; every Founder on it has a talent, a flaw and a line', () => {
    for (const c of CHARTERS.charters) {
      const b = take(c.id);
      expect(() => EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)))).not.toThrow();
      expect(b.from).toBe('charter');
      expect(b.charter?.id).toBe(c.id);
      expect(b.team.funds).toBe(c.start.funds);
      expect(b.team.heat).toBe(c.start.heat);
      expect(b.crew[0]!.name).toBe(c.patron.name);
      for (const p of b.crew) { expect(p.talent).toBeTruthy(); expect(p.flaw).toBeTruthy(); }
      for (const p of b.crew.slice(1)) expect(p.line).not.toBeNull();
      expect(b.crew.length).toBeLessThanOrEqual(8);
    }
  });

  it('4. inherited Loyalty is 4 (6 in the Staff Room); the first seven days count double and the eighth does not', () => {
    for (const c of CHARTERS.charters) for (const p of take(c.id).crew) expect(p.loyalty).toBe(c.id === 'staff-room' ? 6 : 4);
    const b = take('rocket');
    const bump = (day: number) => {
      const before = at(b, 'evening', day);
      const after = { ...before, crew: before.crew.map((p, i) => (i === 1 ? { ...p, loyalty: p.loyalty + 1 } : p)) };
      return charterMoves(before, after).crew[1]!.loyalty;
    };
    expect(bump(1)).toBe(6);
    expect(bump(7)).toBe(6);
    expect(bump(8)).toBe(5);
    // Down counts double too, and never below 0.
    const before = at(b, 'evening', 2);
    const after = { ...before, crew: before.crew.map((p) => ({ ...p, loyalty: p.loyalty - 3 })) };
    expect(charterMoves(before, after).crew[0]!.loyalty).toBe(0);
  });

  it('5. the roll is a pure function of Loyalty and changes no other number', () => {
    expect(rollFigure(150, 4)).toBe(60);
    expect(rollFigure(300, 10)).toBe(300);
    expect(rollFigure(200, 0)).toBe(0);
    const b = take('rocket-return');
    const line = houseLine(b)!;
    expect(line).toContain('The roll: 60');
    expect(b.team).toEqual(take('rocket-return').team);
  });

  it('6. Rocket: a return costs exactly the valuation, Regard +1, never Funds up or Heat down; one an Evening', () => {
    const b = at(take('rocket'), 'evening');
    const cost = returnCost(b);
    const r = charterAct(b, { what: 'return' });
    expect(r.problem).toBeNull();
    expect(r.block.team.funds).toBe(b.team.funds - cost);
    expect(r.block.team.regard).toBe(b.team.regard + 1);
    expect(r.block.team.heat).toBe(b.team.heat);
    expect(r.block.given).toBe(b.given + cost);
    expect(r.block.charter!.returned).toBe(1);
    expect(charterAct(r.block, { what: 'return' }).problem).toMatch(/One thing an Evening/);
    expect(charterAct(at(b, 'morning'), { what: 'return' }).problem).toMatch(/Evening/);
    expect(charterAct({ ...b, team: { ...b.team, funds: cost - 1 } }, { what: 'return' }).problem).toMatch(/hasn't got it/);
    // Through the day's step, with its button.
    expect(houseActs(b)[0]!.problem).toBeNull();
    const s = step(b, { type: 'charterAct', act: { what: 'return' } });
    expect(s.ok).toBe(true);
    expect(questionLine(s.block, 'Red')).toContain("What's a ledger for?");
    expect(questionLine(s.block, 'Red')).toContain('Returned: 1');
  });

  it("8. Rocket's Return: seven answered mornings give Loyalty +1 once a region, and no more; a missed day breaks the run", () => {
    let b = at(take('rocket-return'), 'morning', 1);
    const loyal = () => b.crew.map((p) => p.loyalty);
    const first = loyal();
    for (let d = 1; d <= 7; d++) {
      b = at(b, 'morning', d);
      const r = charterAct(b, { what: 'answer' });
      expect(r.problem).toBeNull();
      b = r.block;
      expect(charterAct(b, { what: 'answer' }).problem).toMatch(/Already/);
    }
    expect(loyal()).toEqual(first.map((x) => x + 1));
    for (let d = 8; d <= 15; d++) b = charterAct(at(b, 'morning', d), { what: 'answer' }).block;
    expect(loyal()).toEqual(first.map((x) => x + 1));
    // A day that isn't answered: the run of days breaks and the roll falls ten.
    const before = at(b, 'night', 16);
    const after = charterMoves(before, at(before, 'morning', 17));
    expect(after.charter!.streak).toBe(0);
    expect(after.charter!.missed).toBe(1);
  });

  it('9. the Joint Command: team Loyalty is the lower half; the Hall votes only at 6 and 6', () => {
    const b = take('joint');
    const h = halves(b)!;
    expect(h.red).toBe(4);
    expect(h.blue).toBe(4);
    const blue = new Set(b.charter!.blue);
    expect(blue.size).toBeGreaterThan(0);
    const up = (red: number, bl: number): EvilModeBlock => ({ ...b, crew: b.crew.map((p) => ({ ...p, loyalty: blue.has(p.id) ? bl : red })) });
    expect(teamLoyalty(up(9, 3))).toBe(3);
    expect(teamLoyalty(up(2, 8))).toBe(2);
    const name = CHARTERS.jointName.names[0]!;
    expect(charterAct(up(6, 5), { what: 'name', name }).problem).toMatch(/both halves/);
    expect(charterAct(up(5, 6), { what: 'name', name }).problem).toMatch(/both halves/);
    expect(houseActs(up(6, 5))).toEqual([]);
    const named = charterAct(up(6, 6), { what: 'name', name });
    expect(named.problem).toBeNull();
    expect(named.block.team.name).toBe(name.replace(/^Team /, ''));
    expect(charterAct(named.block, { what: 'name', name }).problem).toMatch(/named/);
    // Loyalty is never a figure on screen: the halves are band words.
    expect(houseLine(b)).not.toMatch(/\d/);
  });

  it('12. Flare: members pay dues every seven days, once', () => {
    const b = take('flare');
    const before = at(b, 'night', 7);
    const after = charterMoves(before, at(before, 'morning', 8));
    const members = Math.min(CHARTERS.flareMembers, b.crew.length);
    expect(after.team.funds).toBe(b.team.funds + members * CHARTERS.flareDues);
    expect(charterMoves(before, at(after, 'morning', 8)).charter!.duesOn).toEqual([7]);
    expect(charterMoves(at(b, 'night', 6), at(b, 'morning', 7)).team.funds).toBe(b.team.funds);
  });

  it('15. the Staff Room: Take and Lean absent; no Line control; Dread 0 after any sequence; Heat stops at 3; no minor', () => {
    const b = take('staff-room');
    const ids = methodsShown(b).map((m) => m.id);
    expect(ids).not.toContain('take');
    expect(ids).not.toContain('lean');
    expect(ids).toHaveLength(5);
    expect(methodsShown(take('rocket'))).toHaveLength(7);
    const m = boardModel(at(b, 'dispatch'), newDispatch());
    expect(m.lineFixed).toBe(true);
    expect(boardModel(at(take('rocket'), 'dispatch'), newDispatch()).lineFixed).toBe(false);
    expect(step(at(b, 'night'), { type: 'moveLine', to: 'grey' }).ok).toBe(false);
    expect(charterRefuses(b, { type: 'queueJob', job: { method: 'take' } })).toMatch(/never offered/);
    expect(charterRefuses(b, { type: 'queueJob', job: { method: 'scout' } })).toBeNull();
    const hot = charterMoves(b, { ...b, team: { ...b.team, dread: 4, heat: 9 } });
    expect(hot.team.dread).toBe(0);
    expect(hot.team.heat).toBe(3);
    expect(b.team.dread).toBe(0);
    expect(b.crew.some((p) => p.minor)).toBe(false);
  });

  it('20. save and reload on a Charter day 1 gives the same state', () => {
    for (const c of CHARTERS.charters) {
      const b = take(c.id);
      expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)))).toEqual(b);
    }
  });

  it('21. no Charter text remembers an earlier run', () => {
    const text = JSON.stringify(chartersRaw.charters).toLowerCase();
    for (const bad of ['last time', ' again', 'last run', 'previous run', 'your ending', 'took it all']) expect(text).not.toContain(bad);
  });

  it('the Charters tab prints every page, the desk and the trouble on day three', () => {
    const m = charterTabModel(0, false);
    expect(m.tabs).toHaveLength(9);
    expect(m.sel.desk).toHaveLength(3);
    expect(m.sel.dayThree).toBeTruthy();
    expect(m.sel.rows.map((r) => r[0])).toEqual(['Name', 'Creed', 'Line', 'Doctrine', 'Motto', 'First region', 'The house', 'Starts at']);
    expect(charterTabModel(8, true).sel.rows[2]![1]).toContain("can't be moved");
  });
});

// ---- The Turn ----

const mainRun = (): RunState => chooseStarter(content, createRun(content, { runId: 't1', seed: 't1', archetypeId: 'red', rules: STANDARD_CHOICE }), 0);
const rival = (id: string, encounters: number, setbacks: number, potential: number) => RivalSchema.parse({
  id, classId: 'youngster', name: `Kid ${id}`, archetype: 'idealist', style: 'balanced', traits: { ambition: 50, pride: 50, empathy: 50, adaptability: 50, vindictiveness: 50, resilience: 50 }, rivalPotential: potential, state: 'recurring',
  memory: { lastBattle: { eventId: 'x', result: 'win', hpLeftShare: 1, turns: 0, team: [], foes: [] } },
  encounters, setbacks, origin: { eventId: 'x', where: { region: 0, stage: 1, level: 5, node: null, battle: null, turn: null }, path: 'x' },
});
const flagged = (run: RunState, team = 'galactic'): RunState => ({ ...run, money: 12500, badges: ['a', 'b', 'c', 'd', 'e'], story: { ...run.story, flags: { ...run.story.flags, [`ev:evil-start-${team}`]: 1 }, rivals: [rival('r4', 1, 0, 50), rival('r1', 5, 0, 60), rival('r2', 2, 6, 80), rival('r3', 2, 1, 10)] } });

describe('The Turn (Part 28 sections 14 and 15)', () => {
  it('17. offered only when evil-start-<team> is set and a region remains; a lost takeover shows no card', () => {
    const run = mainRun();
    expect(regionsLeft(run)).toBeGreaterThan(0);
    expect(turnOffer(run, { evilOn: true })).toBeNull(); // no flag: the takeover was lost, or the route ended another way
    const f = flagged(run);
    expect(wonTakeover(f)).toBe('galactic');
    const offer = turnOffer(f, { evilOn: true })!;
    expect(offer.charter).toBe('galactic');
    expect(offer.fields.map((x) => x[0])).toEqual(['What it is', 'What changes', 'What stays', "What can't be undone"]);
    expect(turnOffer(f, { evilOn: false })).toBeNull(); // Evil Mode hidden in Settings
    expect(turnOffer({ ...f, regionIndex: f.regionOrder.length - 1 }, { evilOn: true })).toBeNull(); // the last region
    expect(turnOffer({ ...f, story: { ...f.story, flags: { ...f.story.flags, 'ev:evil-start-galactic': 0 } } }, { evilOn: true })).toBeNull();
    // Team Star leads to the Staff Room, and the card says "You'll be a teacher."
    const star = turnOffer(flagged(run, 'paldea'), { evilOn: true })!;
    expect(star.charter).toBe('staff-room');
    expect(star.fields[1]![1]).toBe("You'll be a teacher.");
    // Rocket and Rocket's Return now set their flags in the Kanto and Johto routes.
    expect(turnOffer(flagged(run, 'rocket'), { evilOn: true })!.charter).toBe('rocket');
    expect(turnOffer(flagged(run, 'rocket-return'), { evilOn: true })!.charter).toBe('rocket-return');
  });

  it('17. walking away leaves the run exactly as it is, bar the answer; the card never comes back', () => {
    const f = flagged(mainRun());
    const w = walkAway(f);
    const { story: s1, ...rest1 } = w;
    const { story: s0, ...rest0 } = f;
    expect(rest1).toEqual(rest0);
    expect({ ...s1, flags: { ...s1.flags, [TURN_ANSWERED]: undefined } }).toEqual({ ...s0, flags: { ...s0.flags, [TURN_ANSWERED]: undefined } });
    expect(turnOffer(w, { evilOn: true })).toBeNull();
  });

  it('18. the conversion is deterministic and touches no RNG stream', () => {
    const f = flagged(mainRun());
    const a = turnRun(f)!;
    const b = turnRun(f)!;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.rng).toEqual(f.rng);
    expect(a.rules.modeId).toBe(EVIL_MODE_ID);
    const block = a.expansion!.evilMode!;
    expect(block.from).toBe('turn');
    expect(block.team.funds).toBe(CHARTERS.turn.fundsCap);
    expect(a.money).toBe(2500);
    expect(block.turn!.pocket).toBe(2500);
    expect(block.team.regard).toBe(2);
    expect(block.team.dread).toBe(CHARTERS.turn.dread);
    expect(runRegions(block)).toBe(Math.min(6, regionsLeft(f)));
    expect(block.log.some((l) => l.text.includes('Charon'))).toBe(true);
    expect(turnRun(a)).toBeNull(); // nothing twice
    expect(turnOffer(a, { evilOn: true })).toBeNull();
  });

  it('19. the Turn keeps four rivals and gives each role exactly once', () => {
    const f = flagged(mainRun());
    const roles = assignRoles(f.story.rivals);
    expect(roles).toEqual({ hero: 'r1', rival: 'r2', friend: 'r3', stray: 'r4' });
    expect(new Set(Object.values(roles)).size).toBe(4);
    const t = turnRun(f)!;
    const block = t.expansion!.evilMode!;
    for (const id of ['r1', 'r2', 'r3', 'r4']) expect(t.story.rivals.some((r) => r.id === id)).toBe(true);
    expect(block.hero?.name).toBe('Kid r1');
    expect(block.hero?.marks).toBe(5);
    expect(block.hero?.temper).toBe(1);
    expect(block.road.find((k) => k.role === 'rival')?.name).toBe('Kid r2');
    expect(block.road.find((k) => k.role === 'friend')?.name).toBe('Kid r3');
    expect(block.road.find((k) => k.role === 'stray')?.name).toBe('Kid r4');
  });

  it('20. save and reload on the offer and on the day after the Turn give the same state', () => {
    const f = flagged(mainRun());
    expect(turnOffer(RunStateSchema.parse(JSON.parse(JSON.stringify(f))), { evilOn: true })).toEqual(turnOffer(f, { evilOn: true }));
    const t = turnRun(f)!;
    const re = RunStateSchema.parse(JSON.parse(JSON.stringify(t)));
    expect(re.expansion!.evilMode).toEqual(t.expansion!.evilMode);
    const day = step(re.expansion!.evilMode!, { type: 'dismissOvernight' });
    const day2 = step(t.expansion!.evilMode!, { type: 'dismissOvernight' });
    expect(day.block).toEqual(day2.block);
  });
});

describe('slice 22 run entry and settings', () => {
  it('charterInRun takes a Charter once on an Evil Mode run', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'c1', seed: 'c1', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
    const out = charterInRun(run, 'plasma', 'three');
    expect(out.problem).toBeNull();
    expect(out.run.expansion!.evilMode!.charter!.id).toBe('plasma');
    expect(charterInRun(out.run, 'rocket', 'three').run).toBe(out.run);
    expect(charterInRun(mainRun(), 'rocket', 'three').problem).toMatch(/not an Evil Mode run/);
  });

  it('the remaining settings: rolls with the seed, the fire reminder, and Card speed shown greyed', () => {
    expect(EXPANSION_SETTINGS_DEFAULTS.evilRollSeed).toBe(false);
    expect(EXPANSION_SETTINGS_DEFAULTS.evilFireReminder).toBe(true);
    const seed = changeSetting(DEFAULT_SETTINGS, 'evilRollSeed');
    expect(seed.expansion.evilRollSeed).toBe(true);
    expect(changeSetting(DEFAULT_SETTINGS, 'evilFireReminder').expansion.evilFireReminder).toBe(false);
    const card = SETTINGS.find((r) => r.id === 'evilCardSpeed')!;
    expect(card.disabled?.(DEFAULT_SETTINGS)).toBe(true);
    expect(changeSetting(DEFAULT_SETTINGS, 'evilCardSpeed')).toEqual(DEFAULT_SETTINGS);
  });
});
