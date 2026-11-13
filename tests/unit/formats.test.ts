// Beta 0.6 wide formats (E4): the shared registry and the Breather.
import { describe, expect, it } from 'vitest';
import { breatherShare } from '../../src/core/formats/breather';
import { battleEnded, cardOf, chooseOption, closeFormat, formatOver, startFormat } from '../../src/core/formats/registry';
import { currentFormat } from '../../src/core/formats/store';
import { canReach } from '../../src/core/battle/triples';
import { targetChoices } from '../../src/core/battle/fieldMenu';
import { switchProblem } from '../../src/core/battle/engine';
import { maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const mk = (seed = 'fm1') => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
  const base = r.party[0]!;
  r.party = Array.from({ length: 4 }, (_, i) => ({ ...structuredClone(base), uid: `m${i}` }));
  return r;
};
const ctxOf = (run: ReturnType<typeof mk>) => ({ content, run });

describe('Breather', () => {
  it('heals the ones still up by 50% of max HP and brings back exactly the one chosen', () => {
    const run = mk();
    const max = maxHp(content, run.party[0]!);
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    run.party[2]!.hp = 0;
    expect(startFormat('breather', ctxOf(run))).toBe(true);
    const card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['m1', 'm2']);
    chooseOption(ctxOf(run), 'm2');
    expect(run.party[0]!.hp).toBe(Math.min(max, 1 + Math.ceil(max * 0.5)));
    expect(run.party[2]!.hp).toBe(Math.max(1, Math.ceil(maxHp(content, run.party[2]!) * 0.5)));
    expect(run.party[1]!.hp).toBe(0);
    expect(run.party[3]!.hp).toBe(maxHp(content, run.party[3]!));
    expect(formatOver(ctxOf(run))).toBe(true);
    expect(run.expansion!.cut!.checkpoint).toBe('breather');
  });

  it('with nobody down it offers a plain Rest', () => {
    const run = mk();
    run.party[0]!.hp = 2;
    startFormat('breather', ctxOf(run));
    const card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['rest']);
    chooseOption(ctxOf(run), 'rest');
    expect(run.party[0]!.hp).toBeGreaterThan(2);
  });

  it('never applies twice: choosing again, or starting again, changes nothing', () => {
    const run = mk();
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    startFormat('breather', ctxOf(run));
    chooseOption(ctxOf(run), 'm1');
    const after = JSON.stringify(run.party);
    chooseOption(ctxOf(run), 'm0');
    expect(JSON.stringify(run.party)).toBe(after);
    closeFormat(ctxOf(run));
    expect(startFormat('breather', ctxOf(run))).toBe(false);
  });

  it('a wrong uid revives nobody but still heals once', () => {
    const run = mk();
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    startFormat('breather', ctxOf(run));
    chooseOption(ctxOf(run), 'nope');
    expect(run.party[1]!.hp).toBe(0);
    expect(run.party[0]!.hp).toBeGreaterThan(1);
  });

  it('heals 35% when the poisoned gate was lost (boundary)', () => {
    expect(breatherShare([])).toBe(0.5);
    expect(breatherShare(['kanto.west-gate'])).toBe(0.35);
    expect(breatherShare(['any.cliff-stair', 'x'])).toBe(0.35);
    const run = mk();
    const max = maxHp(content, run.party[0]!);
    run.party[0]!.hp = 1;
    run.expansion = { siege: { lost: ['kanto.west-gate'] } };
    startFormat('breather', ctxOf(run));
    chooseOption(ctxOf(run), 'rest');
    expect(run.party[0]!.hp).toBe(Math.min(max, 1 + Math.ceil(max * 0.35)));
  });

  it('survives save and reload at both points; a damaged slot is dropped, not thrown on', () => {
    const run = mk();
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    startFormat('breather', ctxOf(run));
    let loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(cardOf(ctxOf(loaded as typeof run))!.over).toBe(false);
    chooseOption(ctxOf(loaded as typeof run), 'm1');
    loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(loaded)));
    expect(cardOf(ctxOf(loaded as typeof run))!.over).toBe(true);
    expect(startFormat('breather', ctxOf(loaded as typeof run))).toBe(false);
    const bad = mk();
    bad.expansion = { cut: { format: { id: 'bogus', state: 3 } } };
    expect(currentFormat(bad)).toBeNull();
    expect(cardOf(ctxOf(bad))).toBeNull();
  });

  it('formats without a battle hook ignore battle results', () => {
    const run = mk();
    startFormat('breather', ctxOf(run));
    expect(battleEnded(ctxOf(run), true)).toBe(true);
    expect(startFormat('convoy', ctxOf(run))).toBe(false);
  });
});

describe('Blackout', () => {
  const sealed = (run: ReturnType<typeof mk>) => run.battle!.eventRule;

  it('launches an anchor fight under the Seal and breaks it after two anchors', () => {
    const run = mk('bo1');
    expect(startFormat('blackout', ctxOf(run), { triad: false })).toBe(true);
    const card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['a1', 'a2', 'a3']);
    chooseOption(ctxOf(run), 'a1');
    expect(run.phase).toBe('battle');
    expect(run.battle!.event!.eventId).toBe('format:blackout');
    expect(sealed(run)).toEqual({ noSwitchFirstTurn: true, typeBoost: { type: 'psychic', pct: 10 } });
    expect(run.battle!.enemyTeam.every((m) => m.speciesId === 'mr-mime')).toBe(true);
    expect(switchProblem({ battle: run.battle!, party: run.party }, 1)).toMatch(/Seal/);
    run.battle!.turn = 2;
    expect(switchProblem({ battle: run.battle!, party: run.party }, 1)).toBeNull();
    // won: first anchor beaten
    battleEnded(ctxOf(run), true);
    run.battle = null;
    run.phase = 'map';
    chooseOption(ctxOf(run), 'a2');
    expect(sealed(run)).toBeDefined(); // one beaten: Seal still holds
    battleEnded(ctxOf(run), true);
    run.battle = null;
    run.phase = 'map';
    // two beaten and no Triad: over, Seal gone
    expect(formatOver(ctxOf(run))).toBe(true);
    expect(run.expansion!.cut!.done).toContain('blackout');
    expect(run.expansion!.cut!.checkpoint).toBe('blackout');
  });

  it('a lost fight records the loss and leaves the anchor up (no double count)', () => {
    const run = mk('bo2');
    startFormat('blackout', ctxOf(run), { triad: false });
    chooseOption(ctxOf(run), 'a1');
    battleEnded(ctxOf(run), false);
    battleEnded(ctxOf(run), true); // no fight pending: ignored
    run.battle = null;
    run.phase = 'map';
    const card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['a1', 'a2', 'a3']);
    expect(card.lines.join(' ')).toMatch(/lost: 1/);
  });

  it('with the Triad, Sabrina is the third anchor, waits for the others, and the third fight has no Seal but has her Foresight Tax', () => {
    const run = mk('bo3');
    startFormat('blackout', ctxOf(run), { triad: true });
    const opts = cardOf(ctxOf(run))!.options;
    expect(opts.find((o) => o.id === 'a3')!.enabled).toBe(false);
    chooseOption(ctxOf(run), 'a3'); // not allowed yet
    expect(run.phase).not.toBe('battle');
    for (const id of ['a1', 'a2']) {
      chooseOption(ctxOf(run), id);
      battleEnded(ctxOf(run), true);
      run.battle = null;
      run.phase = 'map';
    }
    expect(formatOver(ctxOf(run))).toBe(false);
    chooseOption(ctxOf(run), 'a3');
    expect(run.battle!.trainer!.name).toBe('Oracle Sabrina');
    expect(run.battle!.eventRule).toEqual({ foresight: true }); // no Seal, but her Foresight Tax
    battleEnded(ctxOf(run), true);
    expect(formatOver(ctxOf(run))).toBe(true);
  });

  it('is deterministic and survives save and reload mid-format', () => {
    const a = mk('bo4');
    const b = mk('bo4');
    for (const r of [a, b]) {
      startFormat('blackout', ctxOf(r), { triad: false });
      chooseOption(ctxOf(r), 'a2');
    }
    expect(a.battle!.enemyTeam.map((m) => [m.speciesId, m.level])).toEqual(b.battle!.enemyTeam.map((m) => [m.speciesId, m.level]));
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(a)));
    expect(currentFormat(loaded)!.state.pending).toBe('a2');
    expect(loaded.battle!.eventRule!.typeBoost).toEqual({ type: 'psychic', pct: 10 });
  });
});

describe('Convoy', () => {
  const next = (run: ReturnType<typeof mk>, id: string, won: boolean) => {
    chooseOption(ctxOf(run), id);
    expect(run.phase).toBe('battle');
    expect(run.battle!.event!.eventId).toBe('format:convoy');
    battleEnded(ctxOf(run), won);
    run.battle = null;
    run.phase = 'map';
  };

  it('three legs, no healing between; winning the car with "You\'re a list" gives the ledger', () => {
    const run = mk('cv1');
    startFormat('convoy', ctxOf(run), { short: false });
    expect(currentFormat(run)!.state.legs).toHaveLength(3);
    next(run, 'fight', true);
    next(run, 'fight', true);
    expect(cardOf(ctxOf(run))!.options.map((o) => o.id)).toEqual(['list', 'witness']);
    next(run, 'list', true);
    expect(formatOver(ctxOf(run))).toBe(true);
    expect(run.expansion!.cut!.ledger).toBe('won');
    expect(run.expansion!.cut!.done).toContain('convoy');
  });

  it('"You\'re a witness" skips the last battle and LEDGER joins', () => {
    const run = mk('cv2');
    startFormat('convoy', ctxOf(run), { short: false });
    next(run, 'fight', true);
    next(run, 'fight', true);
    chooseOption(ctxOf(run), 'witness');
    expect(run.phase).not.toBe('battle');
    expect(formatOver(ctxOf(run))).toBe(true);
    expect(run.expansion!.cut!.ledger).toBe('joined');
  });

  it('a Raid 4 Triumph makes it one leg shorter', () => {
    const run = mk('cv3');
    run.expansion = { raids: { n4: { id: 'pr.kanto.x', result: 'triumph', node: 0, os: -3 } } };
    startFormat('convoy', ctxOf(run));
    expect((currentFormat(run)!.state.legs as { id: string }[]).map((l) => l.id)).toEqual(['van', 'car']);
  });

  it('losing a leg fails the Convoy, loses only the ledger, and applies once', () => {
    const run = mk('cv4');
    startFormat('convoy', ctxOf(run), { short: false });
    next(run, 'fight', false);
    expect(formatOver(ctxOf(run))).toBe(true);
    expect(run.expansion!.cut!.ledger).toBe('none');
    const before = JSON.stringify(run.expansion);
    chooseOption(ctxOf(run), 'fight');
    battleEnded(ctxOf(run), true);
    expect(JSON.stringify(run.expansion)).toBe(before);
  });

  it('survives save and reload with a leg running', () => {
    const run = mk('cv5');
    startFormat('convoy', ctxOf(run), { short: false });
    chooseOption(ctxOf(run), 'fight');
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(currentFormat(loaded)!.state.pending).toBe(true);
    battleEnded(ctxOf(loaded as typeof run), true);
    expect(currentFormat(loaded)!.state.index).toBe(1);
  });
});

describe('Siege Map', () => {
  const rec = (result: string) => ({ id: 'pr.kanto.x', result, node: 0, os: 0 });
  const withRaids = (run: ReturnType<typeof mk>, raids: Record<string, unknown>, flags: Record<string, number | boolean> = {}) => {
    run.expansion = { raids };
    Object.assign(run.story.flags, flags);
  };
  const st = (run: ReturnType<typeof mk>) => Object.fromEntries((currentFormat(run)!.state.districts as { id: string; status: string }[]).map((d) => [d.id, d.status]));

  it('works the statuses out from the raids and flags, and never loses the Center', () => {
    const run = mk('sg1');
    withRaids(run, { n3: rec('triumph'), n4: rec('failure'), n5: rec('partial') });
    startFormat('siege', ctxOf(run));
    expect(st(run)).toEqual({ 'north-gate': 'contested', 'east-gate': 'held', 'south-gate': 'lost', 'west-gate': 'contested', center: 'contested' });
    const run2 = mk('sg2');
    withRaids(run2, { n5: rec('success') }, { 'rocket.x.wire': 1, 'rocket.x.surge-down': 1 });
    run2.expansion!.cut = { rivalRole: 'help' };
    startFormat('siege', ctxOf(run2));
    expect(st(run2)).toMatchObject({ 'north-gate': 'held', 'east-gate': 'held', 'south-gate': 'held', 'west-gate': 'held' });
  });
  it('reads the flags that Kanto run events write (ev:rocket-wire, ev:rocket-surge-down)', () => {
    const run = mk('sg-ev');
    withRaids(run, {}, { 'ev:rocket-wire': 1, 'ev:rocket-surge-down': 1 });
    startFormat('siege', ctxOf(run));
    expect(st(run)).toMatchObject({ 'east-gate': 'held', 'south-gate': 'held', 'west-gate': 'contested' });
  });

  it('a Held gate is a free entry and writes the lost list; a lost West Gate makes the Breather heal 35%', () => {
    const run = mk('sg3');
    withRaids(run, { n3: rec('triumph'), n5: rec('declined') });
    startFormat('siege', ctxOf(run));
    chooseOption(ctxOf(run), 'east-gate');
    expect(run.phase).not.toBe('battle');
    expect(formatOver(ctxOf(run))).toBe(true);
    expect(run.expansion!.siege!.lost).toEqual(['kanto.west-gate']);
    expect(run.expansion!.siege!.entered).toBe('kanto.east-gate');
    expect(run.expansion!.cut!.checkpoint).toBe('siege');
    closeFormat(ctxOf(run));
    run.party[0]!.hp = 1;
    const max = maxHp(content, run.party[0]!);
    startFormat('breather', ctxOf(run));
    chooseOption(ctxOf(run), 'rest');
    expect(run.party[0]!.hp).toBe(Math.min(max, 1 + Math.ceil(max * 0.35)));
  });

  it('a Contested gate costs one battle; losing it lets the player try again; winning it enters', () => {
    const run = mk('sg4');
    startFormat('siege', ctxOf(run));
    chooseOption(ctxOf(run), 'west-gate');
    expect(run.phase).toBe('battle');
    expect(run.battle!.event!.eventId).toBe('format:siege');
    battleEnded(ctxOf(run), false);
    run.battle = null;
    run.phase = 'map';
    expect(formatOver(ctxOf(run))).toBe(false);
    expect(currentFormat(run)!.state.tries).toBe(1);
    chooseOption(ctxOf(run), 'north-gate');
    battleEnded(ctxOf(run), true);
    expect(formatOver(ctxOf(run))).toBe(true);
    expect(currentFormat(run)!.state.entered).toBe('north-gate');
  });

  it('the Center is not a gate, an unknown region cannot start, and a reload keeps the map', () => {
    const run = mk('sg5');
    expect(startFormat('siege', ctxOf(run), { region: 'johto' })).toBe(false);
    expect(startFormat('siege', ctxOf(run), { region: 'kanto' })).toBe(true);
    chooseOption(ctxOf(run), 'center');
    expect(run.phase).not.toBe('battle');
    expect(cardOf(ctxOf(run))!.options.map((o) => o.id)).toEqual(['north-gate', 'east-gate', 'south-gate', 'west-gate']);
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(currentFormat(loaded)!.state.districts).toEqual(currentFormat(run)!.state.districts);
  });
});

describe('Front', () => {
  const lane = (id: string, species: string) => ({ id, region: id, leader: `Leader ${id}`, species, apex: species });
  const trio = [lane('a', 'mewtwo'), lane('b', 'lugia'), lane('c', 'groudon')];
  const withTriples = (on: boolean, f: () => void) => {
    const was = content.balance.triples.enabled;
    content.balance.triples.enabled = on;
    try { f(); } finally { content.balance.triples.enabled = was; }
  };
  const three = (seed: string) => {
    const run = mk(seed);
    run.party = Array.from({ length: 3 }, (_, i) => ({ ...structuredClone(run.party[0]!), uid: `t${i}` }));
    return run;
  };

  it('with no lost Apex, Giovanni steps through alone: no battle; with Kanto M2 taken there is one lane', () => {
    const run = mk('fr1');
    startFormat('front', ctxOf(run));
    expect(currentFormat(run)!.state.result).toBe('none');
    expect(cardOf(ctxOf(run))!.over).toBe(true);
    const run2 = mk('fr2');
    run2.story.flags['rocket.x.m2'] = 'taken';
    startFormat('front', ctxOf(run2));
    expect(currentFormat(run2)!.state.lanes).toHaveLength(1);
    chooseOption(ctxOf(run2), 'begin');
    expect(run2.phase).toBe('battle');
    expect(run2.battle!.doubles).toBeUndefined(); // one lane = a plain fight
    expect(run2.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['mewtwo']);
  });

  it('three lanes are one triple battle with the lane rule; the lineup is exact', () => {
    withTriples(true, () => {
      const run = three('fr3');
      startFormat('front', ctxOf(run), { lanes: trio });
      chooseOption(ctxOf(run), 'begin');
      expect(run.battle!.doubles!.trio).toBeDefined();
      expect(run.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['mewtwo', 'lugia', 'groudon']);
      expect(run.battle!.eventRule!.lanes).toBe(true);
    });
  });

  it('a fourth lane waits off the field and steps in when a lane falls', () => {
    withTriples(true, () => {
      const run = three('fr4');
      startFormat('front', ctxOf(run), { lanes: [...trio, lane('d', 'rayquaza')] });
      chooseOption(ctxOf(run), 'begin');
      const b = run.battle!;
      expect(b.enemyTeam).toHaveLength(4);
      const onField = new Set([b.enemyIndex, ...b.doubles!.trio!.enemy.map((s) => s.index)].filter((i) => i >= 0));
      expect(onField.size).toBe(3);
      expect(onField.has(3)).toBe(false);
    });
  });

  it('while the triple battle is switched off it falls back to a double battle (the rest wait)', () => {
    withTriples(false, () => {
      const run = three('fr5');
      startFormat('front', ctxOf(run), { lanes: trio });
      chooseOption(ctxOf(run), 'begin');
      expect(run.battle!.doubles).toBeDefined();
      expect(run.battle!.doubles!.trio).toBeUndefined();
      expect(run.battle!.eventRule!.lanes).toBe(true);
    });
  });

  it('the lane rule: only the foe in your own lane while it stands; free again once that lane is empty', () => {
    expect(canReach(3, { side: 'player', spot: 0 }, { side: 'enemy', spot: 0 }, { id: 'tackle' }, true)).toBe(true);
    expect(canReach(3, { side: 'player', spot: 0 }, { side: 'enemy', spot: 1 }, { id: 'tackle' }, true)).toBe(false);
    expect(canReach(3, { side: 'player', spot: 0 }, { side: 'enemy', spot: 2 }, { id: 'aerial-ace' }, true)).toBe(false);
    expect(canReach(3, { side: 'player', spot: 0 }, { side: 'player', spot: 1 }, { id: 'heal-pulse' }, true)).toBe(false);
    withTriples(true, () => {
      const run = three('fr6');
      startFormat('front', ctxOf(run), { lanes: trio });
      chooseOption(ctxOf(run), 'begin');
      const b = run.battle!;
      const view = { battle: b, party: run.party } as never;
      const move = { id: 'tackle', type: 'normal', power: 40 } as never;
      const tgt = (spot: 0 | 1 | 2) => targetChoices(view, null, spot, move).filter((t) => !t.ally).map((t) => t.target.spot);
      expect(tgt(0)).toEqual([0]);
      expect(tgt(1)).toEqual([1]);
      expect(tgt(2)).toEqual([2]);
      // lane 1's foe is down: spot 1 may now aim at its neighbours (ordinary triple reach)
      const slot = b.doubles!.trio!.enemy[1]!;
      b.enemyTeam[slot.index]!.hp = 0;
      expect(tgt(1)).toEqual([0, 2]);
      expect(tgt(0)).toEqual([0]);
    });
  });

  it('results are written once: held on a win, lost on a loss', () => {
    for (const [won, want] of [[true, 'held'], [false, 'lost']] as const) {
      const run = mk(`fr7${want}`);
      startFormat('front', ctxOf(run), { lanes: [lane('a', 'mewtwo')] });
      chooseOption(ctxOf(run), 'begin');
      battleEnded(ctxOf(run), won);
      expect(run.story.flags['finale.x.front']).toBe(want);
      battleEnded(ctxOf(run), !won);
      expect(run.story.flags['finale.x.front']).toBe(want);
    }
  });
});

describe('Debate', () => {
  const start = (seed: string, flags: Record<string, string | boolean> = {}) => {
    const run = mk(seed);
    Object.assign(run.story.flags, flags);
    expect(startFormat('debate', ctxOf(run))).toBe(true);
    return run;
  };
  const say = (run: ReturnType<typeof mk>, picks: string[]) => picks.forEach((p) => chooseOption(ctxOf(run), p));
  // The right rebuttal for each argument, from the script: evidence in exchange 1 meets denial, 2 smear, 3 authority;
  // the apt arguments meet denial, authority, denial.
  const FULL = { 'star.x.deletion-log': true, 'star.x.wrong-boots': true, 'star.x.first-engine': true };

  it('evidence carries an exchange even when the rebuttal is answered wrongly; three wins: no battle, evidence kept', () => {
    const run = start('db1', FULL);
    expect(currentFormat(run)!.state.held).toHaveLength(3);
    say(run, ['arg:deletion-log', 'reb:authority', 'arg:boots', 'reb:authority', 'arg:engine', 'reb:authority']);
    expect(run.phase).not.toBe('battle');
    expect(run.story.flags['star.x.debate']).toBe('clean');
    expect(run.story.flags['star.x.deletion-log']).toBe(true);
    expect(cardOf(ctxOf(run))!.over).toBe(true);
  });

  it('each exchange is an argument, then a rebuttal to answer, then the next exchange', () => {
    const run = start('db1b');
    let card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['arg:apt', 'arg:weak', 'arg:bluster']);
    say(run, ['arg:apt']);
    card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['reb:denial', 'reb:smear', 'reb:authority']);
    expect(card.lines.join(' ')).toMatch(/Harrow:/);
    say(run, ['reb:denial']);
    expect(currentFormat(run)!.state.index).toBe(1);
    expect(currentFormat(run)!.state.won).toBe(1);
  });

  it('ordinary play wins: the apt argument plus the right rebuttal; a wrong answer or a weak argument loses it', () => {
    const run = start('db2');
    say(run, ['arg:apt', 'reb:denial', 'arg:apt', 'reb:authority', 'arg:apt', 'reb:smear']);
    expect(currentFormat(run)!.state.won).toBe(2);
    expect(run.story.flags['star.x.debate']).toBe('objection');
    expect(run.phase).not.toBe('battle');
    const run2 = start('db2b');
    say(run2, ['arg:weak', 'reb:smear', 'arg:bluster', 'reb:smear', 'arg:apt', 'reb:denial']);
    expect(currentFormat(run2)!.state.won).toBe(1);
  });

  it('fewer than two wins is one battle against the opponent; winning it settles the matter', () => {
    const run = start('db3');
    say(run, ['arg:weak', 'reb:smear', 'arg:weak', 'reb:smear', 'arg:weak', 'reb:smear']);
    expect(cardOf(ctxOf(run))!.options.map((o) => o.id)).toEqual(['battle']);
    chooseOption(ctxOf(run), 'battle');
    expect(run.phase).toBe('battle');
    expect(run.battle!.event!.eventId).toBe('format:debate');
    battleEnded(ctxOf(run), true);
    expect(run.story.flags['star.x.debate']).toBe('settled');
    expect(formatOver(ctxOf(run))).toBe(true);
  });

  it('losing the battle is recorded and does not end the run', () => {
    const run = start('db4');
    say(run, ['arg:bluster', 'reb:smear', 'arg:bluster', 'reb:smear', 'arg:bluster', 'reb:smear']);
    chooseOption(ctxOf(run), 'battle');
    battleEnded(ctxOf(run), false);
    expect(run.story.flags['star.x.debate']).toBe('lost');
  });

  it('cannot use evidence you do not hold; wrong evidence wins nothing; a Key Item counts; runs once, Paldea only', () => {
    const run = start('db5');
    chooseOption(ctxOf(run), 'arg:engine');
    expect(currentFormat(run)!.state.stage).toBe('argue');
    const run2 = mk('db6');
    run2.inventory['nascour-brochure'] = 1;
    run2.story.flags['star.x.deletion-log'] = true;
    startFormat('debate', ctxOf(run2));
    expect(currentFormat(run2)!.state.held).toEqual(['deletion-log', 'brochure']);
    say(run2, ['arg:brochure', 'reb:denial']); // the brochure does not answer exchange 1
    expect(currentFormat(run2)!.state.won).toBe(0);
    expect(startFormat('debate', ctxOf(mk('db7')), { region: 'kanto' })).toBe(false);
  });

  it('is deterministic and survives save and reload mid-debate', () => {
    const a = start('db8', FULL);
    say(a, ['arg:deletion-log']);
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(a)));
    say(a, ['reb:denial']);
    say(loaded, ['reb:denial']);
    expect(currentFormat(loaded)!.state).toEqual(currentFormat(a)!.state);
  });

  it('a format battle can name the character it is drawn as (Sabrina, Giovanni)', () => {
    const run = mk('db9');
    startFormat('blackout', ctxOf(run), { triad: true });
    for (const id of ['a1', 'a2']) {
      chooseOption(ctxOf(run), id);
      battleEnded(ctxOf(run), true);
      run.battle = null;
      run.phase = 'map';
    }
    chooseOption(ctxOf(run), 'a3');
    expect(run.battle!.trainer!.spriteBoss).toBe('sabrina');
    expect(content.bosses.get('sabrina')!.sprites.default).toBe('boss.sabrina-lgpe');
  });
});
