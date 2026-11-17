// Evil Mode slice 12, "the fires and the last room" (build plan section 3): the other three on the road, the temper, the
// four fires for all eight personalities, "And you?" and the lie, the notebook, the mother's letters, the Reckoning's
// rooms and the last room's assembly. Proves: four rivals, always, none discarded; a fire missed is gone and the last
// room's first line changes; liedToHero's read at the end; the last room has text for every Creed and Wall state; no
// action can touch a child on the road (canDo, enumerated).

import { describe, expect, it } from 'vitest';
import { foundForPlay, playRegion, replay } from '../../src/core/evilMode/autoplay';
import { canDo } from '../../src/core/evilMode/canDo';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { checkOwn, fireChoices, fireMissed, fireN, flameAt, liedToHero, ownList, slots } from '../../src/core/evilMode/fires';
import { makeHero } from '../../src/core/evilMode/hero';
import { assembleSpeech, finishRoom, openingLine, roomOptions, wallState } from '../../src/core/evilMode/reckoning';
import { makeRoad, motherWrites } from '../../src/core/evilMode/road';
import { EvilModeBlockSchema, PERSONALITIES, type EvilModeBlock, type Personality } from '../../src/core/evilMode/schema';
import { foundTeam, type FoundingChoice } from '../../src/core/evilMode/start';
import { ensureRoad } from '../../src/core/evilMode/session';
import { roadChoice, roadForced, roadModel } from '../../src/core/evilMode/roadScreens';
import { fileModel } from '../../src/core/evilMode/heroScreens';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto', ...over });
const act = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(`${a.type}: ${JSON.stringify(r.cues)}`);
  return r.block;
};
const tryAct = (b: EvilModeBlock, a: EvilAction) => step(b, a);

/** A team in District 3 (stage 4) on the fire's day, at the In person beat, with the Hero and the other three. */
function atFire(p: Personality = 'protector', over: Partial<FoundingChoice> = {}, seed = 'fire-1', region = 0): EvilModeBlock {
  const r = foundTeam(choice(over), { boss: 'red', length: 'three', seed, stage: 4 });
  if (!r.ok) throw new Error(r.problem);
  let b = r.block;
  const hero = { ...makeHero(seed, b.district!, null).hero, personality: p };
  b = { ...b, hero, road: makeRoad(seed, hero, b.district!, 'red').road };
  return { ...b, here: { ...b.here, region, day: (b.district!.from ?? 1) + EVIL_DATA.fires.rules.day - 1, beat: 'inPerson' } };
}

/** Sits and answers the first choice of every exchange, then a line of your own. */
function wholeFire(b0: EvilModeBlock, own: EvilAction = { type: 'fireOwn', text: 'Look after that one.' }, pick = 0): EvilModeBlock {
  let b = act(b0, { type: 'sitFire' });
  for (let i = 0; i < 8 && b.fire && b.fire.step !== 'own' && b.fire.step !== 'done'; i++) {
    const c = fireChoices(b);
    b = act(b, { type: 'fireAnswer', id: c[Math.min(pick, c.length - 1)]!.id });
    if (b.fight) b = act(b, { type: 'battleResult', won: true });
  }
  if (b.fire?.step === 'own') b = act(b, own);
  return b;
}

describe('the data: every fire for all eight, every Creed and Wall in the last room', () => {
  it('four fires (first, second, third, last) with three exchanges for each of the eight personalities, and eight middles', () => {
    for (const p of PERSONALITIES) for (const n of ['first', 'second', 'third', 'last'] as const) {
      const f = EVIL_DATA.fires.personalities[p][n];
      expect(f.open.length, `${p} ${n}`).toBeGreaterThan(0);
      expect(f.ex1).toHaveLength(3);
      expect(f.ex3).toHaveLength(3);
      expect(f.ask.length).toBeGreaterThan(0);
    }
    expect(EVIL_DATA.fires.middle).toHaveLength(8);
  });
  it('every slot a fire reads has a fallback: a fresh run fills every first fire with no brace left over', () => {
    for (const p of PERSONALITIES) {
      const b = act(atFire(p), { type: 'sitFire' });
      for (const l of b.fire!.lines) expect(l, `${p}: ${l}`).not.toMatch(/\{\w+\}/);
      for (const c of fireChoices(b)) expect(c.say).not.toMatch(/\{\w+\}/);
    }
  });
  it('the list of your own: two always there, six by Creed, six by Line; silence is offered too', () => {
    const b = act(atFire('protector', { creed: 'spite', line: 'whatever' }), { type: 'sitFire' });
    expect(ownList(b)).toHaveLength(14);
    expect(ownList(b)).toContain(EVIL_DATA.fires.own.creed.spite[0]);
    expect(ownList(b)).toContain(EVIL_DATA.fires.own.line.whatever[0]);
  });
});

describe('the other three on the road', () => {
  it('four, always: the Hero and three more, none sharing the Hero\'s personality, all minors; Kanto\'s Rival is the Professor\'s grandson', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      const b = atFire('enthusiast', {}, seed);
      expect(b.road.map((t) => t.role)).toEqual(['rival', 'friend', 'stray']);
      expect(b.road.every((t) => t.personality !== 'enthusiast' && t.minor && t.state === 'on')).toBe(true);
      expect(new Set(b.road.map((t) => t.personality)).size).toBe(3);
      expect(b.road[0]!.name).toBe('Blue');
    }
  });
  it('a Boss who is Blue meets a generated Rival instead', () => {
    const b = atFire();
    const road = makeRoad('x', b.hero!, b.district!, 'blue').road;
    expect(road[0]!.name).not.toBe('Blue');
  });
  it('as rival records: ensureRoad adds three to the rival system once, and a Friend gone home keeps their record (none discarded)', () => {
    const b = atFire();
    const run = { seed: 's', archetypeId: 'red', story: { rivals: [{ id: 'evil-hero', memory: { lastBattle: { team: ['charmander'] } } }] }, expansion: { evilMode: { ...b, road: [] } } } as never;
    const out = ensureRoad(run) as unknown as { story: { rivals: { id: string }[] }; expansion: { evilMode: EvilModeBlock } };
    expect(out.story.rivals.map((r) => r.id).sort()).toEqual(['evil-friend', 'evil-hero', 'evil-rival', 'evil-stray']);
    expect(ensureRoad(out as never)).toBe(out);
    // The Friend's family's holding is Leaned on: they go home. The record stays; the road still lists four.
    const blk = out.expansion.evilMode;
    const f = blk.road.find((t) => t.role === 'friend')!;
    const leaned = { ...blk, here: { ...blk.here, beat: 'evening' as const }, log: [...blk.log, { id: 'Lx', day: blk.here.day, region: 0, district: 3, kind: 'job' as const, who: [], to: f.family!, method: 'lean' as const, result: 'went' as const, text: 'x' }] };
    const after = act({ ...leaned, here: { ...leaned.here, beat: 'inPerson' } }, { type: 'stayIn' });
    expect(after.road.find((t) => t.role === 'friend')!.state).toBe('home');
    expect(after.road).toHaveLength(3);
    expect(after.hero!.temperWhy.some((w) => w.includes('Friend'))).toBe(true);
  });
  it('each walks one line a day, hashed from the seed and the day (no stream moves); help, talk, mislead, once a day', () => {
    let b = atFire();
    b = { ...b, here: { ...b.here, beat: 'hero' } };
    const draws = b.draws;
    const one = act(b, { type: 'watchRoad' });
    const two = act(b, { type: 'watchRoad' });
    expect(one.road.map((t) => t.today)).toEqual(two.road.map((t) => t.today));
    expect(one.road.every((t) => !!t.today)).toBe(true);
    // The road's lines move no stream: the draws match a day watched with nobody on the road.
    expect(one.draws).toEqual(act({ ...b, road: [] }, { type: 'watchRoad' }).draws);
    expect(draws).toBeDefined();
    let c = act(atFire(), { type: 'roadDo', who: 'evil-friend', what: 'help' });
    expect(tryAct(c, { type: 'roadDo', who: 'evil-friend', what: 'talk' }).ok).toBe(false);
    c = act(c, { type: 'roadDo', who: 'evil-rival', what: 'mislead' });
    expect(c.hero!.lies.map((l) => l.kind)).toEqual(['mislead']);
    const s = act(atFire(), { type: 'roadDo', who: 'evil-stray', what: 'mislead' });
    expect(s.hero!.lies).toEqual([]);
  });
});

describe('the fire', () => {
  it('lit in District 3 on its day at the In person beat; once a region; never at Past talking', () => {
    const b = atFire();
    expect(flameAt(b)).toBe(b.hero!.at);
    expect(flameAt({ ...b, here: { ...b.here, day: b.here.day + 2 } })).toBeNull();
    expect(flameAt({ ...b, hero: { ...b.hero!, temper: 4 } })).toBeNull();
    expect(tryAct({ ...b, hero: { ...b.hero!, temper: 4 } }, { type: 'sitFire' }).ok).toBe(false);
    const done = act(wholeFire(b), { type: 'closeFire' });
    expect(flameAt({ ...done, here: { ...done.here, day: done.here.day + 1, beat: 'inPerson' }, inPerson: null })).toBeNull();
  });
  it('three exchanges, "And you?", their question, then your own words, kept exactly; it uses the in-person slot', () => {
    const b = wholeFire(atFire('protector'), { type: 'fireOwn', text: '  Go   home, and   mind your feet.  ' });
    expect(b.fire!.step).toBe('done');
    expect(b.inPerson).toMatchObject({ holdingId: 'fire' });
    const f = b.hero!.fires.at(-1)!;
    expect(f).toMatchObject({ region: 0, n: 'first', own: 'Go home, and mind your feet.', missed: false });
    expect(f.picks.map((p) => p.split(':')[0])).toEqual(['ex1', 'andYou', 'ex3']);
    expect(b.fire!.lines).toContain(EVIL_DATA.fires.andYou.ask);
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)))).toEqual(b);
  });
  it('typed words never touch a roll: two fires that differ only in the words differ only in the words', () => {
    const a = wholeFire(atFire(), { type: 'fireOwn', text: 'Look after that one.' });
    const z = wholeFire(atFire(), { type: 'fireOwn', text: 'Something else entirely.' });
    expect(a.draws).toEqual(z.draws);
    const strip = (x: EvilModeBlock) => JSON.stringify({ ...x, fire: null, hero: { ...x.hero!, fires: x.hero!.fires.map((f) => ({ ...f, own: '' })) } });
    expect(strip(a)).toBe(strip(z));
    expect(checkOwn('x'.repeat(121)).ok).toBe(false);
    expect(checkOwn('<b>hi</b>').ok).toBe(false);
  });
  it('listened more than talked: temper −1 (from Uneasy); the Strategist\'s "Ask them." −1 whatever the count', () => {
    const b0 = atFire('protector');
    const up = { ...b0, hero: { ...b0.hero!, temper: 1 } };
    // ex1 "What would you say to them?" (listen), andYou "I look after some people." (talk), ex3 "Why d'you ask?" (listen).
    let b = act(up, { type: 'sitFire' });
    b = act(b, { type: 'fireAnswer', id: 'ex1:0' });
    b = act(b, { type: 'fireAnswer', id: 'andYou:0' });
    b = act(b, { type: 'fireAnswer', id: 'ex3:2' });
    b = act(b, { type: 'fireOwn', silence: true });
    expect(b.hero!.temper).toBe(0);
    expect(b.hero!.fires.at(-1)!.own).toBe('');
    const s0 = atFire('strategist');
    let s = act({ ...s0, hero: { ...s0.hero!, temper: 2 } }, { type: 'sitFire' });
    s = act(s, { type: 'fireAnswer', id: 'ex1:0' });
    s = act(s, { type: 'fireAnswer', id: 'andYou:1' });
    s = act(s, { type: 'fireAnswer', id: 'ex3:2' });
    s = act(s, { type: 'fireOwn', pick: 0 });
    expect(s.hero!.temper).toBe(1);
  });
  it('"I just work there" is kept as a lie; nothing happens when it\'s said; liedToHero reads it at the end and it never clears', () => {
    let b = act(atFire(), { type: 'sitFire' });
    b = act(b, { type: 'fireAnswer', id: 'ex1:2' });
    const t0 = b.hero!.temper;
    b = act(b, { type: 'fireAnswer', id: 'andYou:2' });
    expect(b.fire!.step).toBe('justWork');
    expect(b.hero!.temper).toBe(t0);
    expect(liedToHero(b)).toBe(true);
    b = act(b, { type: 'fireAnswer', id: 'justWork:0' });
    b = act(b, { type: 'fireAnswer', id: 'ex3:2' });
    b = act(b, { type: 'fireOwn', pick: 1 });
    expect(liedToHero(act(b, { type: 'closeFire' }))).toBe(true);
    // "Business." isn't a lie; nor is saying nothing.
    let c = act(atFire(), { type: 'sitFire' });
    c = act(c, { type: 'fireAnswer', id: 'ex1:0' });
    c = act(c, { type: 'fireAnswer', id: 'andYou:1' });
    expect(liedToHero(c)).toBe(false);
  });
  it('the third fire\'s extra choice: "I\'m the one in charge" tells them, and the last fire doesn\'t happen', () => {
    let b = act(atFire('protector', {}, 'third', 2), { type: 'sitFire' });
    expect(b.fire!.n).toBe('last');
    // In a three-region run region 2 is the last; a six-region run's region 2 is the third.
    b = act({ ...atFire('protector', {}, 'third', 2), settings: { length: 'six' } }, { type: 'sitFire' });
    expect(b.fire!.n).toBe('third');
    b = act(b, { type: 'fireAnswer', id: 'ex1:0' });
    b = act(b, { type: 'fireAnswer', id: 'andYou:0' });
    expect(fireChoices(b).map((c) => c.id)).toEqual(['third:0', 'third:1', 'third:2', 'third:3']);
    b = act(b, { type: 'fireAnswer', id: 'third:3' });
    expect(b.hero!.told).toBe(true);
    expect(b.fire!.lines).toContain(EVIL_DATA.fires.personalities.protector.third.told);
    const last = { ...b, fire: null, hero: { ...b.hero!, fires: [] }, here: { ...b.here, region: 5 } };
    expect(fireN(last)).toBe('last');
    expect(flameAt(last)).toBeNull();
  });
  it('the Underdog\'s practice: a no-stakes battle, one mark either way, then your own words', () => {
    let b = act(atFire('underdog'), { type: 'sitFire' });
    b = act(b, { type: 'fireAnswer', id: 'ex1:0' });
    b = act(b, { type: 'fireAnswer', id: 'andYou:0' });
    const marks = b.hero!.marks;
    b = act(b, { type: 'fireAnswer', id: 'ex3:2' });
    expect(b.fight).toMatchObject({ kind: 'practice' });
    b = act(b, { type: 'battleResult', won: false });
    expect(b.hero!.marks).toBe(marks + 1);
    expect(b.hero!.practiced).toBe(true);
    expect(b.fire!.step).toBe('own');
  });
  it('a fire missed is gone: the File says so, and the last room opens "So you\'re what one looks like."', () => {
    const b = atFire();
    const m = fireMissed(b, 3);
    expect(m.hero!.fires.at(-1)).toMatchObject({ missed: true, own: null });
    expect(m.hero!.learned).toContain(EVIL_DATA.fires.flame.missed);
    expect(flameAt(m)).toBeNull();
    expect(openingLine(m)).toBe(EVIL_DATA.lastRoom.open.noFire);
    expect(openingLine(wholeFire(b))).toBe(EVIL_DATA.lastRoom.open.fire);
  });
  it('the Office notebook: one line on the Night after a fire, kept', () => {
    let b = wholeFire(atFire());
    b = act(b, { type: 'closeFire' });
    expect(tryAct(b, { type: 'writeNotebook', text: 'Too early.' }).ok).toBe(false);
    b = { ...b, here: { ...b.here, beat: 'night' } };
    b = act(b, { type: 'writeNotebook', text: 'They had a Charmander. I gave it a Potion.' });
    expect(b.hero!.notebook).toEqual(['They had a Charmander. I gave it a Potion.']);
    expect(tryAct(b, { type: 'writeNotebook', text: 'Again.' }).ok).toBe(false);
  });
  it('the Strategist reads the run back from the Ledger, with a fallback when it\'s all one kind', () => {
    const b = atFire('strategist');
    expect(slots(b).ledger).toBe(EVIL_DATA.fires.slots.ledgerNone);
    const s = act(b, { type: 'sitFire' });
    expect(s.fire!.lines.join(' ')).toContain(EVIL_DATA.fires.slots.ledgerNone);
  });
});

describe('the mother\'s letters', () => {
  it('one a district, from stored state; Shut or kept back is no letter: temper +1 and a day lost', () => {
    const b = atFire();
    const one = motherWrites(b);
    expect(one.hero!.mother.letters).toHaveLength(1);
    expect(motherWrites(one)).toBe(one);
    const shut = motherWrites({ ...b, hero: { ...b.hero!, mother: { ...b.hero!.mother, mood: 'shut' } } });
    expect(shut.hero!.mother.letters[0]!.mood).toBe('none');
    expect(shut.hero!.temper).toBe(1);
    expect(shut.hero!.lostDays).toBe(b.hero!.lostDays + 1);
    const night = { ...b, here: { ...b.here, beat: 'night' as const } };
    expect(tryAct({ ...night, team: { ...night.team, line: 'clean' } }, { type: 'keepLetter' }).ok).toBe(false);
    const kept = motherWrites(act(night, { type: 'keepLetter' }));
    expect(kept.hero!.mother.letters[0]).toMatchObject({ mood: 'none', keptBack: true });
  });
  it('opening one asks for a Large Listening Post; writing to her is once a region, and her reply is by her mood', () => {
    const b = motherWrites(atFire());
    const id = b.hero!.mother.letters[0]!.id;
    expect(tryAct(b, { type: 'openLetter', id }).ok).toBe(false);
    const night = { ...b, here: { ...b.here, beat: 'night' as const } };
    const w = act(night, { type: 'writeMother', opening: 3 });
    expect(w.hero!.mother.replies[0]).toBe(EVIL_DATA.road.mother.write.wary[3]);
    expect(tryAct(w, { type: 'writeMother', opening: 0 }).ok).toBe(false);
  });
});

describe('the Reckoning and the last room', () => {
  const played = playRegion(foundForPlay('room-1', choice()), 'mix');
  const k = played.actions.findIndex((a) => a.type === 'roomAct');
  const atRoom = replay(foundForPlay('room-1', choice()), played.actions.slice(0, k));

  it('Kanto plays to the last room on the Reckoning\'s third day; it ends the region and never the run', () => {
    expect(played.finished).toBe(true);
    expect(k).toBeGreaterThan(0);
    expect(atRoom.here.stage).toBe(8);
    expect(atRoom.reck!.room).toMatchObject({ outcome: null });
    expect(atRoom.reck!.walk[0]).toBe(EVIL_DATA.lastRoom.walk.start);
    expect(played.block.reck!.room!.outcome).toBe('talked');
    expect(played.block.district!.end!.how).toBe('reckoning');
    expect(played.block.region.phase).toBe('over');
    expect(played.block.hero!.pages).toHaveLength(1);
    expect(replay(foundForPlay('room-1', choice()), played.actions)).toEqual(played.block);
  });
  it('the room holds the day; recruitment\'s refused kindly in Region 1; asking stays in the room', () => {
    expect(tryAct(atRoom, { type: 'watchRoad' }).ok).toBe(false);
    const o = act(atRoom, { type: 'roomAct', what: 'offer' });
    expect(o.reck!.room!.lines.at(-1)).toMatch(/Ask me again when I know more|isn't open/);
    expect(o.reck!.room!.outcome).toBeNull();
    const angry = { ...atRoom, hero: { ...atRoom.hero!, temper: 3 } };
    expect(roomOptions(angry)[0]!.what).toBe('battle');
    expect(roomOptions(atRoom).at(-1)!.what).toBe('battle');
  });
  it('line 31: the Boss winning with someone on the Roster who won\'t stand by is a draw; without, the Boss wins', () => {
    const b = act(atRoom, { type: 'roomAct', what: 'battle' });
    expect(b.fight).toMatchObject({ kind: 'room' });
    const plain = act({ ...b, crew: b.crew.map((c) => ({ ...c, line: c.line === 31 ? null : c.line })) }, { type: 'battleResult', won: true });
    expect(plain.reck!.room!.outcome).toBe('bossWon');
    const id = b.crew.find((c) => c.where === 'in')!.id;
    const drew = act({ ...b, crew: b.crew.map((c) => (c.id === id ? { ...c, line: 31 } : c)) }, { type: 'battleResult', won: true });
    expect(drew.reck!.room!.outcome).toBe('draw');
    expect(drew.crew.find((c) => c.id === id)!.loyalty).toBe(10);
    const lost = act(b, { type: 'battleResult', won: false });
    expect(lost.reck!.room!.outcome).toBe('heroWon');
    expect(lost.base).toBeNull();
    expect(lost.region.phase).toBe('tally');
  });
  it('a lie in the room: they know, and it starts the battle', () => {
    const b = act(atRoom, { type: 'roomAct', what: 'answer', kind: 'lie' });
    expect(b.fight).toMatchObject({ kind: 'room' });
    expect(liedToHero(b)).toBe(true);
  });
  it('the last room has text for every Creed and every Wall state, with no slot left unfilled', () => {
    for (const creed of ['profit', 'cause', 'power', 'wonder', 'belonging', 'spite']) for (const [regard, dread] of [[0, 0], [6, 0], [0, 6], [6, 6]]) {
      const b = { ...atRoom, team: { ...atRoom.team, creed, regard: regard!, dread: dread! } };
      const speech = assembleSpeech(b, ['Seen.'], [], EVIL_DATA);
      expect(speech).toContain(EVIL_DATA.lastRoom.wall[wallState(b)]);
      expect(speech.join(' ')).toContain(EVIL_DATA.lastRoom.creed[creed as 'profit'].door);
      for (const l of speech) expect(l).not.toMatch(/\{\w+\}/);
      const fin = finishRoom({ ...b, reck: { ...b.reck!, room: { ...b.reck!.room!, answer: 'For them.' } } }, 'talked');
      for (const l of [...fin.evening, ...fin.hero!.pages.at(-1)!]) expect(l).not.toMatch(/\{\w+\}/);
    }
    expect(Object.keys(EVIL_DATA.lastRoom.wall).sort()).toEqual(['bare', 'both', 'drawings', 'posters']);
  });
  it('the Boss can not be there: "Leave" on the last day, and the room opens empty', () => {
    const r = played.actions.findIndex((a, i) => i > 0 && a.type === 'stayIn' && replay(foundForPlay('room-1', choice()), played.actions.slice(0, i)).here.stage === 8);
    expect(r).toBeGreaterThan(0);
  });
});

describe('canDo: no action can touch a child on the road', () => {
  it('every action that names a person, forced through step with a child\'s id, is refused and changes nothing', () => {
    const b = atFire();
    const kids = ['evil-hero', 'evil-rival', 'evil-friend', 'evil-stray'];
    const job = { holdingId: b.district!.holdings[1]!.id, method: 'lean', squad: [] as string[], offer: 0 };
    for (const id of kids) {
      const forced: EvilAction[] = [
        { type: 'post', holdingId: job.holdingId, id }, { type: 'hire', ref: id }, { type: 'question', ref: id, q: 'why' as never },
        { type: 'turnAway', ref: id, rude: true }, { type: 'promote', id, answer: 0 }, { type: 'letGo', id, kindly: true },
        { type: 'goOn', stay: id }, { type: 'recall', id }, { type: 'staff', id: 'r1', who: id }, { type: 'guard', who: id, at: 'a1' },
        { type: 'bail', id }, { type: 'visit', id }, { type: 'raidQueue', queue: [id] },
        { type: 'queueJob', job: { ...job, squad: [id] } as never }, { type: 'confirmCard', job: { ...job, squad: [id] } as never }, { type: 'askAnyway', job: { ...job, squad: [id] } as never },
        { type: 'roomAct', what: 'show', kind: 'someone', who: id },
        { type: 'roadDo', who: id, what: 'lean' as never }, { type: 'roadDo', who: id, what: 'take' as never }, { type: 'roadDo', who: id, what: 'fight' as never },
      ];
      for (const a of forced) {
        expect(canDo(b, a).ok, `${a.type} ${id}`).toBe(false);
        const r = step(b, a);
        expect(r.ok, `${a.type} ${id}`).toBe(false);
        expect(r.block).toBe(b);
      }
    }
    expect(canDo(b, { type: 'roadDo', who: 'evil-friend', what: 'help' }).ok).toBe(true);
  });
  it('a thousand steps of a seeded region never remove the Hero or any of the three', () => {
    const p = playRegion(foundForPlay('kids-2', choice({ line: 'whatever' })), 'mix');
    expect(p.block.hero).not.toBeNull();
    expect(p.block.road.map((t) => t.id)).toEqual(['evil-rival', 'evil-friend', 'evil-stray']);
  });
});

describe('saves: block v10', () => {
  it('v9 -> v10: the Hero starts Curious with no fires and a mother at Wary; no road yet, no fire, no Reckoning', () => {
    const b = atFire();
    const { starter: _s, temper: _t, temperWhy: _w, fires: _f, lies: _l, told: _o, heroLine: _h, notebook: _n, practiced: _p, mother: _m, pages: _g, ...old } = b.hero!;
    const { road: _r, fire: _x, reck: _k, ...rest } = b;
    const v9 = JSON.parse(JSON.stringify({ ...rest, v: 12, hero: old }));
    const out = EvilModeBlockSchema.parse(v9);
    expect(out.v).toBe(13);
    expect(out.hero).toMatchObject({ temper: 0, fires: [], lies: [], told: false, starter: '', mother: { mood: 'wary', letters: [] } });
    expect(out).toMatchObject({ road: [], fire: null, reck: null });
    expect(() => EvilModeBlockSchema.parse({ ...v9, v: 13 })).toThrow();
  });
});

describe('the screens\' data (New look): the Road page, the fire and the last room', () => {
  const pickAll = (b0: EvilModeBlock): EvilModeBlock => {
    // Play a whole fire only through the page's own choice ids, as a player pressing them would.
    let b = b0;
    for (let i = 0; i < 12; i++) {
      const m = roadModel(b)!;
      if (m.mode === 'road') {
        const sit = m.choices.find((c) => c.id === 'sit');
        if (!sit) return b;
        b = act(b, roadChoice(sit.id)!);
        continue;
      }
      if (m.own) { b = act(b, roadChoice(m.own.id, 'Mind the road.')!); continue; }
      const c = m.choices[0]!;
      if (c.id === 'fight') { b = act(b, { type: 'battleResult', won: true }); continue; }
      b = act(b, roadChoice(c.id)!);
    }
    return b;
  };
  it('the fire\'s day shows the flame and "Sit at the fire"; every choice id maps to a real action; the fire holds the screen until closed', () => {
    const b = atFire();
    const m = roadModel(b)!;
    expect(m.mode).toBe('road');
    expect(m.forced).toBe(false);
    expect(m.choices[0]!.id).toBe('sit');
    expect(m.lines[0]).toMatch(/small flame/);
    const lit = act(b, roadChoice('sit')!);
    expect(roadForced(lit)).toBe(true);
    const f = roadModel(lit)!;
    expect(f.mode).toBe('fire');
    expect(f.choices.every((c) => roadChoice(c.id) !== null)).toBe(true);
    const done = pickAll(b);
    expect(done.fire).toBeNull();
    expect(roadForced(done)).toBe(false);
    expect(done.hero!.fires.at(-1)!.own).toBe('Mind the road.');
  });
  it('a refused id changes nothing; an unknown id is no action', () => {
    expect(roadChoice('nonsense')).toBeNull();
    expect(roadChoice('lo:letter:0:2')).toEqual({ type: 'openLetter', id: 'letter:0:2' });
    expect(roadChoice('ra:show:someone:c4')).toEqual({ type: 'roomAct', what: 'show', kind: 'someone', who: 'c4' });
    expect(roadChoice('ra:nothing::')).toEqual({ type: 'roomAct', what: 'nothing' });
    const b = atFire();
    const r = step(b, roadChoice('close')!);
    expect(r.ok).toBe(false);
    expect(r.block).toBe(b);
  });
  it('the File: the temper word, the line said at the fire word for word, the other three once seen', () => {
    const b = pickAll(atFire());
    const met = { ...b, hero: { ...b.hero!, met: true } };
    const report = fileModel(met, 0, [], (x) => x)!;
    expect(report.rows.find((r) => r.label === 'Temper')!.blank).toBe(false);
    expect(report.rows.find((r) => r.label === 'Temper')!.text).toMatch(new RegExp(EVIL_DATA.road.temper.words[met.hero!.temper]!));
    const dossier = fileModel(met, 2, [], (x) => x)!;
    expect(dossier.lists.find((l) => l.title === "What you've said to them")!.lines.join(' ')).toContain('"Mind the road."');
  });
  it('the last room: every option it shows is an id the step accepts, and Close shows once it\'s over', () => {
    const played = playRegion(foundForPlay('room-2', choice()), 'mix');
    const b = played.block;
    if (!b.reck?.room) return expect(EVIL_DATA.lastRoom.on).toBe(false);
    const m = roadModel(b)!;
    expect(m.mode).toBe('room');
    if (b.reck.room.outcome) expect(m.choices.map((c) => c.id)).toEqual(['roomDone']);
    else for (const c of m.choices) if (c.id !== 'fight') expect(step(b, roadChoice(c.id)!).ok, c.id).toBe(true);
    expect(m.lines).toContain(b.reck.room.open);
    expect(roadModel(b, true)!.mode).toBe('road');
  });
});
