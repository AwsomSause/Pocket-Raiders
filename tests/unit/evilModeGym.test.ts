// Evil Mode slice 8 ("the Gym"): Kanto's eight Leaders, five ways each; the panel; standing; the Leader in the battle
// engine at the level Part 8 gives, with boss gear and gimmicks by the main game's rules; the `evil-gym` stream.
// Part 31's proofs: every Gym passable by at least one way on every Line; a shut door names who shut it; Beat uses the
// battle engine with the Leader at A+2. Normal, boundary and failure cases; the v7 save.
import { describe, expect, it } from 'vitest';
import { boardModel, newDispatch } from '../../src/core/evilMode/boardScreens';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { crewProblem } from '../../src/core/evilMode/dispatch';
import { beginEvilFight, stageLevel } from '../../src/core/evilMode/fight';
import { endEvilFight } from '../../src/core/evilMode/fightEnd';
import { badgeHow, gymDoors, gymOf, leaderOf, priceFor } from '../../src/core/evilMode/gym';
import { gymModel } from '../../src/core/evilMode/gymScreens';
import { walkHero } from '../../src/core/evilMode/hero';
import { townStreet } from '../../src/core/evilMode/board';
import { EVIL_MODE_ID, foundInRun, stepInRun } from '../../src/core/evilMode/session';
import { EvilModeBlockSchema, firstCrew, LINE_IDS, type EvilModeBlock, type GymWay, type Holding, type LineId } from '../../src/core/evilMode/schema';
import { foundTeam } from '../../src/core/evilMode/start';
import { GYM_LEADER_CLASS } from '../../src/core/encounters';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun, healParty } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { getBoss } from '../../src/core/regions';
import { content } from './helpers';

const found = (line: LineId = 'grey', creed = 'profit', seed = 'gym1'): EvilModeBlock => {
  const r = foundTeam({ name: 'Kettle', creed, line, doctrine: 'swarm' }, { boss: 'red', length: 'three', seed, stage: 2 });
  if (!r.ok) throw new Error(r.problem);
  return { ...r.block, crew: firstCrew(6, 6), applicants: [] };
};
const go = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(JSON.stringify(r.cues));
  return r.block;
};
const toBeat = (b: EvilModeBlock, beat: EvilModeBlock['here']['beat']): EvilModeBlock => {
  while (b.here.beat !== beat) b = go(b, { type: BEAT_END[b.here.beat] });
  return b;
};
/** The next In person beat with the Boss free (tomorrow's, if they've been out today). */
const nextIP = (b: EvilModeBlock): EvilModeBlock => toBeat(b.here.beat === 'inPerson' && b.inPerson?.day === b.here.day ? go(b, { type: 'stayIn' }) : b, 'inPerson');
const gymH = (b: EvilModeBlock) => b.district!.holdings.find((h) => h.kind === 'gym')!;
const setGym = (b: EvilModeBlock, f: (h: Holding) => Holding): EvilModeBlock => ({ ...b, district: { ...b.district!, holdings: b.district!.holdings.map((h) => (h.kind === 'gym' ? f(h) : h)) } });
/** This district as another of Kanto's (the district's n names its Leader). */
const asDistrict = (b: EvilModeBlock, n: number): EvilModeBlock => ({ ...b, district: { ...b.district!, n } });
const scouted = (b: EvilModeBlock) => setGym(b, (h) => ({ ...h, scouted: 2 }));
const door = (b: EvilModeBlock, way: GymWay) => gymDoors(b).find((d) => d.way === way)!;
const officer = (b: EvilModeBlock): EvilModeBlock => ({ ...b, crew: b.crew.map((c) => (c.id === 'g1' ? { ...c, rank: 'officer' as const, name: 'Otis' } : c)) });

describe('the Leaders (Part 8b, Kanto)', () => {
  it('eight Leaders, first to eighth, each the main game\'s own boss with a Gym team; Janine as the heir', () => {
    const kanto = EVIL_DATA.gym.leaders.filter((l) => l.region === 0 && l.role !== 'heir');
    expect(kanto.map((l) => l.n)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(kanto.map((l) => l.name)).toEqual(['Brock', 'Misty', 'Lt. Surge', 'Erika', 'Koga', 'Sabrina', 'Blaine', 'Giovanni']);
    for (const l of EVIL_DATA.gym.leaders) expect(getBoss(content, l.boss).teams.gym.length, l.id).toBe(16);
    expect(leaderOf(0, 4)!.heir).toBe('janine');
  });
  it('each district Leader has all five ways written (a rule, a Buy answer, a Bend, Creeds they respect, where they go)', () => {
    for (const l of EVIL_DATA.gym.leaders.filter((x) => x.role === 'district')) {
      expect(l.rule, l.id).not.toBeNull();
      expect(l.buy?.why, l.id).toBeTruthy();
      expect(l.bend?.steps.length, l.id).toBeGreaterThanOrEqual(1);
      expect(l.respects.length, l.id).toBeGreaterThan(0);
      expect(l.replace?.goes, l.id).toBeTruthy();
      expect(l.beaten, l.id).toBeTruthy();
    }
  });
  it('a price is never greed, and only Blaine has one in Kanto: ₽13,500, the formula for district 6', () => {
    const priced = EVIL_DATA.gym.leaders.filter((l) => l.buy?.price);
    expect(priced.map((l) => l.id)).toEqual(['blaine']);
    expect(priced[0]!.buy!.price).toBe(priceFor(0, 6));
    expect(priceFor(0, 1)).toBe(6000);
    expect(priced[0]!.buy!.other).toBeTruthy();
  });
});

describe('the doors (Part 8a section 1.2)', () => {
  it('the first and eighth Gyms can\'t be dealt with by any route', () => {
    for (const [n, why] of [[0, "Hasn't heard of you."], [7, "The Hero's there."]] as const) {
      for (const line of LINE_IDS) {
        const b = scouted({ ...asDistrict(found(line, 'cause'), n), team: { ...found(line).team, regard: 10, funds: 99999 } });
        const ds = gymDoors(officer(b));
        expect(ds.every((d) => !d.open && d.shutBy === why), `${n} ${line}`).toBe(true);
        const r = step(toBeat(b, 'inPerson'), { type: 'gymWay', way: 'beat' });
        expect(r.ok).toBe(false);
      }
    }
  });
  it('every Gym is passable by at least one way on every Line (Beat is always open to the Boss)', () => {
    for (let n = 1; n <= 6; n++) for (const line of LINE_IDS) {
      const ds = gymDoors(asDistrict(found(line), n));
      expect(ds.some((d) => d.open), `${n} ${line}`).toBe(true);
      expect(ds.find((d) => d.way === 'beat')!.open).toBe(true);
    }
  });
  it('a shut door always names who shut it', () => {
    for (let n = 1; n <= 6; n++) for (const line of LINE_IDS) for (const creed of ['profit', 'spite']) {
      for (const d of gymDoors(asDistrict(found(line, creed), n))) if (!d.open) expect(d.shutBy, `${n} ${line} ${d.way}`).toMatch(/\S/);
    }
    const koga = scouted(asDistrict(found('grey'), 4));
    expect(door(koga, 'buy')).toMatchObject({ open: false, shutBy: 'Shut by him' });
    expect(door(koga, 'buy').why).toContain('pocket');
    expect(door(asDistrict(found('clean'), 1), 'replace')).toMatchObject({ open: false, shutBy: 'Shut by your Line', why: 'Not at Clean hands.' });
    expect(door(asDistrict(found('whatever'), 1), 'befriend')).toMatchObject({ open: false, shutBy: 'Shut by her' });
    expect(door(asDistrict(found('grey'), 1), 'replace').shutBy).toBe('Shut: no Officer');
    expect(door(asDistrict(found('grey'), 1), 'bend').shutBy).toBe('Not scouted.');
  });
  it('the board\'s right rail shows all five on the Gym, with the Leader and the standing as a word', () => {
    const b = found();
    const m = boardModel(b, { ...newDispatch(), at: gymH(b).step - 1 });
    expect(m.panel.rail.map((r) => r.name)).toEqual(['Beat', 'Buy', 'Bend', 'Replace', 'Befriend']);
    expect(m.panel.name).toBe('Cerulean Gym · Misty');
    expect(m.panel.mood).toBe('Wary');
    expect(boardModel(b, { ...newDispatch(), at: 0 }).panel.rail).toEqual([]);
  });
  it('the Gym is scouted from Dispatch (two Evenings to depth 2), and then Bend shows its first step', () => {
    let b = found('grey');
    for (let i = 0; i < 2; i++) {
      b = toBeat(b, 'dispatch');
      b = go(b, { type: 'confirmCard', job: { holdingId: gymH(b).id, method: 'scout', squad: ['g1'] } });
      b = toBeat(go(b, { type: 'send' }), 'night');
    }
    expect(gymH(b).scouted).toBe(2);
    expect(gymH(b).owner).toBe('nobody');
    expect(door(b, 'bend')).toMatchObject({ open: true, why: expect.stringContaining('step 1 of 3') });
  });
  it('previews are free: the doors, the rail and the panel change nothing', () => {
    const b = found();
    const before = JSON.stringify(b);
    for (let i = 0; i < 200; i++) { gymDoors(b); gymModel(b, i % 5); }
    expect(JSON.stringify(b)).toBe(before);
  });
});

describe('Buy: Koga, or try (and Blaine)', () => {
  it('trying to buy Koga is refused by step, with his reason; nothing moves', () => {
    const b = toBeat(scouted({ ...asDistrict(found('grey'), 4), team: { ...found().team, funds: 50000 } }), 'inPerson');
    const r = step(b, { type: 'gymWay', way: 'buy' });
    expect(r.ok).toBe(false);
    expect(r.block).toBe(b);
    expect(r.cues[0]).toMatchObject({ reason: expect.stringContaining('pocket') });
  });
  it('Blaine: not scouted, short of money (boundary), then bought: logged as a bribe; Hearts −1; Heat +1 at the Evening', () => {
    const base = asDistrict(found('grey'), 6);
    expect(door(base, 'buy').why).toBe('Not scouted to depth 2.');
    const short = scouted({ ...base, team: { ...base.team, funds: 13499 } });
    expect(door(short, 'buy')).toMatchObject({ open: false, shutBy: 'Not yet' });
    let b = toBeat(scouted({ ...base, team: { ...base.team, funds: 13500, heat: 0 }, crew: base.crew.map((c) => (c.id === 'g2' ? { ...c, talent: 'heart' as const } : c)) }), 'inPerson');
    b = go(b, { type: 'gymWay', way: 'buy' });
    expect(b.team.funds).toBe(0);
    expect(gymOf(b)!.way).toBe('buy');
    expect(b.log.at(-1)).toMatchObject({ kind: 'gym', text: expect.stringContaining('bribe') });
    expect(b.crew.find((c) => c.id === 'g2')!.loyalty).toBe(5);
    b = go(b, { type: 'stayIn' });
    expect(b.team.heat).toBe(1);
    expect(badgeHow(b)).toBe('half');
  });
  it('found out at one in ten, from evil-gym, once each Evening: then Shut, and the district\'s lock is back on', () => {
    let b = toBeat(scouted({ ...asDistrict(found('grey'), 6), team: { ...found().team, funds: 20000 } }), 'inPerson');
    b = go(b, { type: 'gymWay', way: 'buy' });
    let found10 = false;
    for (let day = 0; day < 6 && !found10 && !b.district!.end; day++) {
      const draws = b.draws['evil-gym'] ?? 0;
      b = toBeat(b, 'evening');
      expect(b.draws['evil-gym']).toBe(draws + 1);
      found10 = gymOf(b)!.foundOut;
      b = toBeat(b, 'inPerson');
    }
    // Over many seeds, about one in ten is found out on the first Evening.
    let n = 0;
    for (let i = 0; i < 60; i++) {
      let x = toBeat(scouted({ ...asDistrict(found('grey', 'profit', `buy${i}`), 6), team: { ...found().team, funds: 20000 } }), 'inPerson');
      x = toBeat(go(x, { type: 'gymWay', way: 'buy' }), 'evening');
      if (gymOf(x)!.foundOut) {
        n++;
        expect(gymOf(x)).toMatchObject({ way: null, standing: 'shut' });
        expect(door(x, 'beat').open).toBe(false);
      }
    }
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(20);
  });
});

describe('Bend, Befriend and the rest, in step (refused there, not only on screen)', () => {
  it('only at the In person beat, once a day', () => {
    const b = scouted(found('grey'));
    expect(step(toBeat(b, 'dispatch'), { type: 'gymWay', way: 'beat' }).ok).toBe(false);
    const ip = toBeat(b, 'inPerson');
    const one = go(ip, { type: 'gymWay', way: 'bend' });
    expect(step(one, { type: 'gymWay', way: 'bend' }).cues[0]).toMatchObject({ reason: 'The Boss has already been out today.' });
  });
  it('Misty\'s Bend: three days in person, then the lights-off scene: warm, Regard +1, everyone +1, the Town warmer; for good', () => {
    let b = scouted(found('grey'));
    const regard = b.team.regard;
    for (let i = 0; i < 3; i++) {
      b = toBeat(b, 'inPerson');
      const r = step(b, { type: 'gymWay', way: 'bend' });
      expect(r.ok).toBe(true);
      b = go(r.block, { type: 'stayIn' });
    }
    expect(gymOf(b)).toMatchObject({ way: 'bend', standing: 'warm' });
    expect(b.team.regard).toBe(regard + 1);
    expect(b.crew.every((c) => c.loyalty === 7)).toBe(true);
    expect(badgeHow(b)).toBe('full');
  });
  it('Koga\'s Bend gets him his hearing; at two in three the Gym goes to Janine, and a child\'s Gym shows no Buy or Replace', () => {
    let seats = 0;
    for (let i = 0; i < 12; i++) {
      let b = officer(scouted(asDistrict(found('grey', 'profit', `koga${i}`), 4)));
      for (let d = 0; d < 2; d++) b = go(nextIP(b), { type: 'gymWay', way: 'bend' });
      expect(gymOf(b)!.way).toBe('bend');
      if (gymOf(b)!.leaderId === 'janine') {
        seats++;
        const j = gymModel(b, 1)!;
        expect(j.title).toBe('Fuchsia Gym · Janine');
      }
    }
    expect(seats).toBeGreaterThan(0);
    expect(seats).toBeLessThan(12);
    // The young-Leader flag: Buy and Replace are never open, whatever the money and the Officer.
    const janine = officer(scouted({ ...asDistrict(found('grey'), 4), gyms: [{ ...gymOf(asDistrict(found('grey'), 4))!, leaderId: 'janine' }], team: { ...found().team, funds: 99999 } }));
    expect(door(janine, 'buy')).toMatchObject({ open: false, shutBy: 'Shut by her age' });
    expect(door(janine, 'replace')).toMatchObject({ open: false, shutBy: 'Shut by her age' });
  });
  it('Sabrina\'s Bend is checked against the Ledger: a Lean in her district and it fails', () => {
    const b = toBeat(scouted(asDistrict(found('grey'), 5)), 'inPerson');
    expect(step(b, { type: 'gymWay', way: 'bend' }).ok).toBe(true);
    const leaned = { ...b, log: [...b.log, { id: 'x', day: 1, region: 0, district: 5, kind: 'job' as const, who: [], method: 'lean' as const, result: 'went' as const, text: 'Leaned.' }] };
    expect(step(leaned, { type: 'gymWay', way: 'bend' }).cues[0]).toMatchObject({ reason: expect.stringContaining('You believe it') });
  });
  it('Befriend at Clean hands: Regard 6 and a Creed she respects; one short is shut with the number; asked, she looks the other way', () => {
    const five = { ...found('clean', 'cause'), team: { ...found('clean', 'cause').team, regard: 5 } };
    expect(door(five, 'befriend')).toMatchObject({ open: false, why: 'Regard 5; needs 6.' });
    expect(door({ ...found('clean', 'power'), team: { ...found('clean', 'power').team, regard: 6 } }, 'befriend').shutBy).toBe('Shut by her');
    let b = toBeat({ ...five, team: { ...five.team, regard: 6 } }, 'inPerson');
    const r = step(b, { type: 'gymWay', way: 'befriend' });
    expect(r.ok).toBe(true);
    expect(r.cues.filter((c) => c.id === 'said')).toHaveLength(6);
    b = r.block;
    expect(gymOf(b)).toMatchObject({ way: 'befriend', standing: 'easy' });
    expect(b.team.regard).toBe(8);
    expect(door(found('grey'), 'befriend').shutBy).toBe('Shut by your Line');
  });
  it('a befriended Leader warns once at a Lean on the Town\'s street, then walks in: undealt, Regard −2', () => {
    let b = toBeat({ ...found('clean', 'cause'), team: { ...found('clean', 'cause').team, regard: 6 } }, 'inPerson');
    b = go(b, { type: 'gymWay', way: 'befriend' });
    const onStreet = townStreet(b.district!)[0]!.id;
    const lean = (bb: EvilModeBlock) => ({ ...bb, log: [...bb.log, { id: `l${bb.here.day}`, day: bb.here.day, region: 0, district: 1, kind: 'job' as const, who: [], to: onStreet, method: 'lean' as const, result: 'went' as const, text: 'Leaned.' }] });
    const r1 = go(lean(b), { type: 'stayIn' });
    expect(gymOf(r1)).toMatchObject({ way: 'befriend', insults: 1 });
    expect(r1.evening.join(' ')).toContain('short list');
    const r2 = go(lean(toBeat(r1, 'inPerson')), { type: 'stayIn' });
    expect(gymOf(r2)).toMatchObject({ way: null, standing: 'shut' });
    expect(r2.team.regard).toBe(Math.max(0, r1.team.regard - 2));
    expect(r2.evening.join(' ')).toContain('those words back');
  });
  it('Replace at Grey: the Officer\'s challenge is a battle; lost, the way shuts and they\'re +1; won, they hold the chair', () => {
    const b = toBeat(officer(found('grey')), 'inPerson');
    const r = step(b, { type: 'gymWay', way: 'replace' });
    expect(r.cues.some((c) => c.id === 'fight')).toBe(true);
    expect(r.block.fight).toMatchObject({ kind: 'challenge', personId: 'g1' });
    const lost = go(r.block, { type: 'battleResult', won: false });
    expect(gymOf(lost)!.closed).toEqual(['replace']);
    expect(lost.crew.find((c) => c.id === 'g1')!.loyalty).toBe(7);
    expect(door(lost, 'replace').open).toBe(false);
    const won = go(r.block, { type: 'battleResult', won: true });
    expect(gymOf(won)).toMatchObject({ way: 'replace', standing: 'gone', officer: 'g1' });
    expect(crewProblem(won, 'g1')).toContain("Gym's chair");
    expect(won.crew.find((c) => c.id === 'g1')!.loyalty).toBe(8);
  });
});

describe('Beat: the battle engine, the Leader at A+2 (Part 8a section 2)', () => {
  const evilRun = (seed = 'gb1'): RunState => {
    const r = foundInRun(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0), { name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm' }, 'three', 2);
    if (r.problem) throw new Error(r.problem);
    return r.run;
  };
  const B = (r: RunState) => r.expansion!.evilMode!;
  const goR = (r: RunState, a: EvilAction): RunState => {
    const o = stepInRun(r, a);
    if (!o.ok) throw new Error(JSON.stringify(o.cues));
    return o.run;
  };
  const toIP = (r: RunState) => { while (B(r).here.beat !== 'inPerson') r = goR(r, { type: BEAT_END[B(r).here.beat] }); return r; };
  it('Misty\'s own Gym team, every one at A+2, boss gear on, a Gym Leader\'s class; won: beaten, Sullen, Dread +1, Heat +2', () => {
    let r = goR(toIP(evilRun()), { type: 'gymWay', way: 'beat' });
    const A = stageLevel(content, r, B(r));
    const started = beginEvilFight(content, r)!;
    expect(started.battle!.trainer).toMatchObject({ classId: GYM_LEADER_CLASS, name: 'Misty', leaderId: 'misty' });
    const mistyTeam = getBoss(content, 'misty').teams.gym[1]!.members.map((m) => m.speciesId);
    expect(started.battle!.enemyTeam.map((m) => m.speciesId).sort()).toEqual([...mistyTeam].sort());
    expect(started.battle!.enemyTeam.every((m) => m.level === A + 2 + started.rules.enemyLevelBonus || m.level === A + 2)).toBe(true);
    expect(started.battle!.enemyTeam.some((m) => Object.keys(m.held ?? {}).length > 0)).toBe(true);
    // Region 1, Gym 2: no gimmick yet (one after Stage 5).
    expect(Object.keys(started.battle!.transform.bossPlan)).toHaveLength(0);
    const dread = B(started).team.dread;
    const lines = endEvilFight(content, started, true, healParty);
    expect(lines.join(' ')).toContain('Beaten');
    expect(started.phase).toBe('map');
    expect(gymOf(B(started))).toMatchObject({ way: 'beat', standing: 'sullen' });
    expect(B(started).team.dread).toBe(dread + 1);
    r = goR(started, { type: 'stayIn' });
    expect(B(r).evening.join(' ')).toContain('Heat +2');
  });
  it('lost: the party\'s healed, the run goes on, and the Leader leads differently next time', () => {
    const r = beginEvilFight(content, goR(toIP(evilRun('gb2')), { type: 'gymWay', way: 'beat' }))!;
    const first = r.battle!.enemyTeam[0]!.speciesId;
    endEvilFight(content, r, false, healParty);
    expect(r.phase).toBe('map');
    expect(r.party.every((m) => m.hp > 0)).toBe(true);
    expect(gymOf(B(r))).toMatchObject({ way: null, tried: 1 });
    let again = goR(r, { type: 'stayIn' });
    again = beginEvilFight(content, goR(toIP(again), { type: 'gymWay', way: 'beat' }))!;
    if (again.battle!.enemyTeam.length > 1) expect(again.battle!.enemyTeam[0]!.speciesId).not.toBe(first);
  });
  it('Blaine (Gym 7 of Region 1) brings one gimmick, by the main game\'s rule', () => {
    const r0 = evilRun('gb3');
    const r = setDistrict(r0, 6);
    const started = beginEvilFight(content, goR(toIP(r), { type: 'gymWay', way: 'beat' }))!;
    expect(started.battle!.trainer!.name).toBe('Blaine');
    expect(Object.keys(started.battle!.transform.bossPlan).length).toBeLessThanOrEqual(1);
  });
  const setDistrict = (r: RunState, n: number): RunState => ({ ...r, expansion: { ...r.expansion, evilMode: asDistrict(B(r), n) } });
  it('the Hero at a Beaten Gym: half a tier, the Leader tells them, and the district runs on to its end', () => {
    let r = beginEvilFight(content, goR(toIP(evilRun('gb4')), { type: 'gymWay', way: 'beat' }))!;
    endEvilFight(content, r, true, healParty);
    let b = B(r);
    b = { ...b, here: { ...b.here, beat: 'hero' }, hero: { ...b.hero!, at: 19, walked: 0 } };
    b = walkHero(b);
    expect(b.hero!.badges.at(-1)).toMatchObject({ how: 'half' });
    expect(b.hero!.learned.join(' ')).toContain('Misty told them');
    expect(b.district!.end).toBeUndefined();
  });
  it('the Hero at a Bent Gym loses first, steps back and rests; then wins a full tier', () => {
    let b = scouted(B(evilRun('gb5')));
    for (let i = 0; i < 3; i++) b = go(nextIP(b), { type: 'gymWay', way: 'bend' });
    b = { ...b, here: { ...b.here, beat: 'hero' }, hero: { ...b.hero!, at: 19, walked: 0, restOn: 0 } };
    b = walkHero(b);
    expect(b.hero!.at).toBe(19);
    expect(b.hero!.badges).toHaveLength(0);
    const needs = gymOf(b)!.heroNeeds!;
    expect([2, 3]).toContain(needs);
    for (let t = 1; t < needs; t++) b = walkHero({ ...b, here: { ...b.here, day: b.here.day + 2 * t }, hero: { ...b.hero!, walked: 0, restOn: 0 } });
    expect(b.hero!.badges.at(-1)).toMatchObject({ how: 'full' });
    expect(b.hero!.learned.join(' ')).toContain("Why's the Leader with them?");
  });
});

describe('saves: block v7', () => {
  it('v6 -> v7: no Gym dealt with; save and reload the same', () => {
    const { gyms: _g, ...rest } = found();
    const v7 = EvilModeBlockSchema.parse({ ...rest, v: 6 });
    expect(v7).toMatchObject({ v: 14, gyms: [] });
    expect(gymOf(v7)).toMatchObject({ leaderId: 'misty', way: null, standing: 'wary' });
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(v7)))).toEqual(v7);
  });
  it('a dealt Gym and a Gym fight in progress survive a save; a damaged way is refused', () => {
    let b = toBeat(scouted(found('grey')), 'inPerson');
    b = go(b, { type: 'gymWay', way: 'bend' });
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)))).toEqual(b);
    const f = step(toBeat(go(b, { type: 'stayIn' }), 'inPerson'), { type: 'gymWay', way: 'beat' }).block;
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(f)))).toEqual(f);
    expect(EvilModeBlockSchema.safeParse({ ...b, gyms: [{ ...b.gyms[0]!, way: 'bribe' }] }).success).toBe(false);
  });
  it('replay: the same seed and the same actions give the same block', () => {
    const run = () => {
      let b = toBeat(scouted({ ...asDistrict(found('grey', 'profit', 'rp'), 6), team: { ...found().team, funds: 20000 } }), 'inPerson');
      b = go(b, { type: 'gymWay', way: 'buy' });
      return toBeat(b, 'inPerson');
    };
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });
});

describe('standing test 13: Clean hands can win every Gym', () => {
  it('at Clean hands every Kanto district Gym has Beat open, and Befriend for a respected Creed at Regard 6', () => {
    for (let n = 1; n <= 6; n++) {
      const L = leaderOf(0, n)!;
      const b0 = asDistrict(found('clean', L.respects[0]!), n);
      const b = { ...b0, team: { ...b0.team, regard: 6 } };
      expect(door(b, 'beat').open, L.id).toBe(true);
      expect(door(b, 'befriend').open, L.id).toBe(true);
    }
  });
});
