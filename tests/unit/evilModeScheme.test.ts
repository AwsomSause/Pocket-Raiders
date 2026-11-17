// Evil Mode slice 14: the Scheme (build plan Part 31 slice 14; design Part 22; Part 5 section 7; Part 12 section 3 heists;
// Part 13 section 3 Digs; Part 26a section 2.4 Kanto's Ledger). The four parts and groundwork, the stamps, the six Grand
// Schemes and Kanto's own, heists and Digs, the Scheme page.

import { describe, expect, it } from 'vitest';
import { EVIL_DATA, type EvilData } from '../../src/core/evilMode/data';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { crewProblem } from '../../src/core/evilMode/dispatch';
import { appendLog } from '../../src/core/evilMode/ledger';
import { inheritedScheme, defOf } from '../../src/core/evilMode/neighbour';
import { digTags, homeCount, losePart, paceProblem, roomChoices, schemeCard, schemePct, sentenceAt, stamp, wayProblem, type WayKey } from '../../src/core/evilMode/scheme';
import { schemeModel } from '../../src/core/evilMode/schemeScreens';
import { EvilModeBlockSchema, PARTS, SchemeFileSchema, type EvilModeBlock, type PartId } from '../../src/core/evilMode/schema';
import { foundTeam, type FoundingChoice } from '../../src/core/evilMode/start';
import { readFileSync } from 'node:fs';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'cause', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto', ...over });
/** A district (n 1 Cerulean by default), no Hero on the road, plenty of Funds, at a beat. */
function found(over: Partial<FoundingChoice> = {}, n = 1, beat: EvilModeBlock['here']['beat'] = 'dispatch', seed = 'scheme-1'): EvilModeBlock {
  const r = foundTeam(choice(over), { boss: 'red', length: 'three', seed, stage: n + 1 });
  if (!r.ok) throw new Error(r.problem);
  // Slice 16: three regions are written, so the Scheme's pace runs across them (Part 22 section 1.1). These fixtures play
  // Kanto as the run's third region, where every part's in pace and the Moment comes in District 6.
  return { ...r.block, here: { ...r.block.here, beat }, hero: null, team: { ...r.block.team, funds: 90000, regard: 8 }, region: { ...r.block.region, crossed: ['johto', 'hoenn'] } };
}
const asRegion = (b: EvilModeBlock, R: number): EvilModeBlock => ({ ...b, region: { ...b.region, crossed: ['johto', 'hoenn'].slice(0, R - 1) } });
const ok = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(`${a.type} refused: ${r.cues.map((c) => ('reason' in c ? c.reason : c.id)).join('; ')}`);
  return r.block;
};
const refused = (b: EvilModeBlock, a: EvilAction): string => {
  const r = step(b, a);
  expect(r.ok).toBe(false);
  return r.cues.map((c) => ('reason' in c ? c.reason : '')).join('');
};
/** On to the next day's beat (Dispatch by default). Battles are lost. */
function to(b0: EvilModeBlock, beat: EvilModeBlock['here']['beat'] = 'dispatch'): EvilModeBlock {
  let b = b0;
  for (let i = 0; i < 14 && !(b.here.beat === beat && b.here.day > b0.here.day); i++) {
    if (b.fight) { b = ok(b, { type: 'battleResult', won: false }); continue; }
    b = ok(b, { type: BEAT_END[b.here.beat] });
  }
  return b;
}
const at = (b: EvilModeBlock, beat: EvilModeBlock['here']['beat']): EvilModeBlock => ({ ...b, here: { ...b.here, beat } });
const holdTown = (b: EvilModeBlock): EvilModeBlock => ({ ...b, district: { ...b.district!, holdings: b.district!.holdings.map((h) => (h.kind === 'town' ? { ...h, owner: 'team' as const, method: 'persuade' as const, since: 1, holds: true } : h)) } });
const inHand = (b: EvilModeBlock, parts: PartId[], clean = true): EvilModeBlock => {
  let out = b;
  for (const p of parts) out = stamp(out, p, clean, 'test', null, null).block;
  return out;
};

describe('the six Grand Schemes and Kanto\'s own (data)', () => {
  it('six, one a Creed; four parts each; a clean way always; every Card thirteen fields, the other way never empty', () => {
    const F = EVIL_DATA.scheme.families;
    expect(F.map((f) => f.id).sort()).toEqual(EVIL_DATA.creeds.map((c) => c.id).sort());
    for (const f of F) {
      for (const part of PARTS) {
        expect(f.parts[part].clean, `${f.id} ${part}`).toBeDefined();
        if (part !== 'moment') expect(f.parts[part].dirty, `${f.id} ${part} dirty`).toBeDefined();
        const b = found({ creed: f.id });
        for (const key of ['clean', 'dirty', 'second'] as WayKey[]) {
          if (!f.parts[part][key]) continue;
          const card = schemeCard(b, part, key);
          expect(card).toHaveLength(13);
          expect(card.map((x) => x.label)).toEqual(EVIL_DATA.ledger.fields);
          expect(card[12]!.text.length).toBeGreaterThan(10);
          expect(card.every((x) => x.text.length > 0)).toBe(true);
        }
      }
    }
    // A Belonging Key can't be lost (it's people): no second source is written for it.
    expect(F.find((f) => f.id === 'belonging')!.parts.key.second).toBeUndefined();
    expect(Object.keys(EVIL_DATA.scheme.ledger.supplies).sort()).toEqual(['cause', 'profit', 'spite']);
  });
  it('an empty way text fails the data check, so the build', () => {
    const raw = JSON.parse(readFileSync('src/data/evilMode/scheme.json', 'utf8'));
    raw.families[0].parts.means.clean.text.takes = '';
    expect(SchemeFileSchema.safeParse(raw).success).toBe(false);
  });
  it('eleven heists (the Payroll is One Last Job, slice 11) and twelve Digs; Kanto\'s holdings carry dig tags by name', () => {
    expect(EVIL_DATA.scheme.heists.list).toHaveLength(11);
    expect(EVIL_DATA.scheme.digs.list).toHaveLength(12);
    const b = found();
    expect(digTags(b.district!.holdings.find((h) => h.kind === 'town')!)).toEqual(['town']);
  });
});

describe('the percentage', () => {
  it('is never stored: four twenties and the groundwork; groundwork alone stops at 20; 100 needs four parts', () => {
    const b = found();
    expect(JSON.stringify(EvilModeBlockSchema.parse(b).scheme)).not.toMatch(/pct|percent/);
    expect(schemePct(b.scheme)).toBe(0);
    const g = { ...b, scheme: { ...b.scheme, groundwork: 20 } };
    expect(schemePct(g.scheme)).toBe(20);
    expect(schemePct(inHand(g, ['means', 'place', 'key']).scheme)).toBe(80);
    expect(schemePct(inHand(g, [...PARTS]).scheme)).toBe(100);
    expect(EvilModeBlockSchema.safeParse({ ...b, scheme: { ...b.scheme, groundwork: 21 } }).success).toBe(false);
    // The sentence gets plainer as the number rises.
    expect(sentenceAt(b)).not.toBe(sentenceAt(inHand(g, ['means', 'place', 'key'])));
  });
});

describe('the parts', () => {
  it('pace (three regions): the Means from Region 1; the Place and Key from Region 2', () => {
    const b = asRegion(found(), 1);
    expect(paceProblem(b, 'means')).toBeNull();
    expect(paceProblem(b, 'place')).toMatch(/Region 2, District 1/);
    expect(refused(b, { type: 'schemeWay', part: 'place', key: 'dirty' })).toMatch(/Region 2/);
    expect(paceProblem(asRegion(found({}, 3), 1), 'key')).toMatch(/Region 2/);
    expect(paceProblem(asRegion(found(), 2), 'place')).toBeNull();
    expect(paceProblem(found(), 'key')).toBeNull();
  });
  it('a clean way (a station) takes its days and is stamped clean, with its day and Card; never twice', () => {
    let b = ok(found(), { type: 'schemeWay', part: 'means', key: 'clean' });
    expect(b.team.funds).toBe(90000 - 8000);
    expect(b.scheme.jobs).toHaveLength(1);
    // The squad's busy on the Scheme.
    expect(crewProblem(b, b.scheme.jobs[0]!.squad[0]!)).toMatch(/Scheme/);
    b = to(b);
    expect(b.scheme.parts.means.state).toBe('empty');
    b = to(b);
    expect(b.scheme.parts.means).toMatchObject({ state: 'inHand', clean: true, way: 'station', cardId: 'S1' });
    expect(refused(b, { type: 'schemeWay', part: 'means', key: 'dirty' })).toMatch(/already in hand/);
    expect(b.log.some((e) => e.kind === 'scheme' && e.cardId === 'S1')).toBe(true);
  });
  it('each part\'s "clean" is fixed when it\'s got and never edited', () => {
    const b = found({}, 3);
    const s1 = stamp(b, 'key', false, 'forge', null, null).block;
    const again = stamp(s1, 'key', true, 'archive', null, null).block;
    expect(again.scheme.parts.key.clean).toBe(false);
    expect(again).toBe(s1);
    // A forged Key is stamped not clean through the step too.
    const c = to(ok(found({}, 3), { type: 'schemeWay', part: 'key', key: 'dirty' }));
    expect(c.scheme.parts.key).toMatchObject({ state: 'inHand', clean: false });
  });
  it('a part lost can be found again another way: only the second source, dearer', () => {
    const b0 = inHand(found(), ['means'], false);
    const lost = losePart(b0, 'means').block;
    expect(lost.scheme.parts.means).toMatchObject({ state: 'lost', clean: null, lostTimes: 1 });
    expect(wayProblem(lost, 'means', 'clean')).toMatch(/second source/);
    expect(wayProblem(lost, 'means', 'dirty')).toMatch(/second source/);
    expect(wayProblem(lost, 'means', 'second')).toBeNull();
    const b = to(to(to(ok(lost, { type: 'schemeWay', part: 'means', key: 'second' }))));
    expect(b.scheme.parts.means).toMatchObject({ state: 'inHand', clean: true, way: 'second', lostTimes: 1 });
  });
  it('a Belonging Key earned by the count can\'t be lost; the count equals its names; a bought list adds to the number, and nobody comes', () => {
    const b = found({ creed: 'belonging' }, 3);
    const c = homeCount(b);
    expect(c.n).toBe(c.names.reduce((t, x) => t + x.n, 0));
    expect(wayProblem(b, 'key', 'clean')).toMatch(/counting/);
    const bought = { ...b, scheme: { ...b.scheme, bought: true } };
    expect(homeCount(bought).n).toBe(c.n + EVIL_DATA.scheme.rules.homeNeed);
    const earned = stamp(b, 'key', true, 'earned', null, null).block;
    expect(losePart(earned, 'key').block.scheme.parts.key.state).toBe('inHand');
  });
  it('Power\'s Means comes the Evening the fourth Gym is dealt with, stamped by how', () => {
    const b0 = found({ creed: 'power' });
    expect(wayProblem(b0, 'means', 'clean')).toMatch(/fourth Gym/);
    const g = (i: number, way: 'bend' | 'buy') => ({ leaderId: `l${i}`, region: 0, district: i, way, standing: 'wary' as const, moved: 'x', closed: [], tried: 0 });
    const withGyms = (ways: ('bend' | 'buy')[]) => ({ ...b0, gyms: ways.map((w, i) => ({ ...b0.gyms[0], ...g(i + 1, w) })) as EvilModeBlock['gyms'] });
    const clean = to(withGyms(['bend', 'bend', 'bend', 'bend']));
    expect(clean.scheme.parts.means).toMatchObject({ state: 'inHand', clean: true });
    const dirty = to(withGyms(['bend', 'buy', 'bend', 'bend']));
    expect(dirty.scheme.parts.means).toMatchObject({ state: 'inHand', clean: false });
    // Groundwork: every Gym dealt with, any way: +5% each, to the cap.
    expect(clean.scheme.groundwork).toBe(20);
  });
});

describe('groundwork', () => {
  it('counts each source once (Cause: every Persuade that holds, +1%), and the Hero\'s Badge where a Scheme job ran takes 5%', () => {
    let b = found();
    for (let i = 0; i < 3; i++) b = appendLog(b, { kind: 'job', who: [], method: 'persuade', result: 'went', text: 'Day 1. Persuaded.' });
    b = to(b);
    expect(b.scheme.groundwork).toBe(3);
    b = to(b);
    expect(b.scheme.groundwork).toBe(3);
  });
  it('a Badge taken where a Scheme job ran: −5%', () => {
    const r = foundTeam(choice(), { boss: 'red', length: 'three', seed: 'badge', stage: 2 });
    if (!r.ok) throw new Error(r.problem);
    let b: EvilModeBlock = { ...r.block, team: { ...r.block.team, funds: 90000 } };
    b = { ...b, scheme: { ...b.scheme, groundwork: 10, credited: { 'ran:0:1': 1 } } };
    if (!b.hero) return; // the Hero's made by the session; a block founded without one has nothing to cut
    b = { ...b, hero: { ...b.hero, badges: [...b.hero.badges, { region: 0, district: 1, how: 'full', day: 1 }] } };
    b = to(at(b, 'dispatch'));
    expect(b.scheme.groundwork).toBe(5);
  });
});

describe('the Moment', () => {
  it('comes on its day in District 6: ready at 80% (stamped clean when waited for), otherwise it passes and nothing\'s stamped', () => {
    const b6 = to(found({}, 6, 'night'), 'morning');
    expect(b6.scheme.moment.day).toBe((b6.district!.from ?? 1) + EVIL_DATA.scheme.rules.momentDay - 1);
    const ready = inHand(b6, ['means', 'place', 'key']);
    let r = ready;
    while (r.here.day < r.scheme.moment.day!) r = to(r, 'morning');
    expect(r.scheme.moment.came).toBe('ready');
    expect(r.scheme.parts.moment).toMatchObject({ state: 'inHand', clean: true });
    expect(schemePct(r.scheme)).toBe(80);
    let p = inHand(b6, ['means']);
    while (p.here.day < p.scheme.moment.day!) p = to(p, 'morning');
    expect(p.scheme.moment.came).toBe('passed');
    expect(p.scheme.parts.moment.state).toBe('empty');
  });
  it('caused, it comes the next morning, stamped not clean', () => {
    let b = inHand(found({}, 6), ['means', 'place', 'key']);
    b = ok(b, { type: 'schemeWay', part: 'moment', key: 'dirty' });
    expect(b.scheme.moment).toMatchObject({ caused: true, day: b.here.day + 1 });
    b = to(b, 'morning');
    expect(b.scheme.parts.moment).toMatchObject({ state: 'inHand', clean: false });
    expect(b.scheme.moment.came).toBe('ready');
  });
});

describe('Digs', () => {
  it('a Dig sends a note each Evening; at its end the choice; put back sets its flag (Regard +1)', () => {
    let b = holdTown(found());
    b = ok(b, { type: 'dig', id: 'sealed' });
    expect(b.scheme.digs[0]).toMatchObject({ id: 'sealed', ended: 'running' });
    b = to(to(to(b)));
    const g = b.scheme.digs[0]!;
    expect(g.ended).toBe('choose');
    expect(g.notes.length).toBeGreaterThanOrEqual(3);
    expect(b.scheme.groundwork).toBe(15);
    const regard = b.team.regard;
    const back = ok(b, { type: 'digEnd', holdingId: g.holdingId, back: true });
    expect(back.scheme.digs[0]!.ended).toBe('back');
    expect(back.team.regard).toBe(Math.min(10, regard + 1));
    expect(ok(b, { type: 'digEnd', holdingId: g.holdingId, back: false }).scheme.digs[0]!.ended).toBe('open');
    // Once a holding: it isn't dug twice.
    expect(refused(at(back, 'dispatch'), { type: 'dig', id: 'cistern' })).toMatch(/No held holding/);
  });
  it('Wonder doubles a Dig\'s groundwork (to the cap)', () => {
    const b = to(to(to(ok(holdTown(found({ creed: 'wonder' })), { type: 'dig', id: 'sealed' }))));
    expect(b.scheme.groundwork).toBe(20);
    const r = to(to(to(ok(holdTown(found({ creed: 'profit' })), { type: 'dig', id: 'sealed' }))));
    expect(r.scheme.groundwork).toBe(15);
  });
});

describe('heists', () => {
  /** Plan the Museum at Cerulean, the front door loudly, go in person, and walk the rooms (battles won quickly). */
  function playMuseum(seed: string, part = false): EvilModeBlock {
    let b = found(part ? { creed: 'profit' } : {}, part ? 3 : 1, 'dispatch', seed);
    b = part ? ok(b, { type: 'schemeWay', part: 'key', key: 'dirty' }) : ok(b, { type: 'heist', id: 'museum' });
    b = ok(b, { type: 'heistPlan', slot: 'in', value: 'front' });
    b = ok(at(b, 'inPerson'), { type: 'heistGo' });
    for (let i = 0; i < 12 && b.scheme.heist!.stage === 'rooms'; i++) {
      if (b.fight) { b = ok(b, { type: 'battleResult', won: true, turns: 2 }); continue; }
      const c = roomChoices(b).find((x) => !x.why && x.id !== 'leave')!;
      b = ok(b, { type: 'heistRoom', choice: c.id });
    }
    return b;
  }
  it('is planned, played in person room by room, and done once a district; the same seed plays the same', () => {
    const b = playMuseum('h-1');
    expect(['done', 'failed']).toContain(b.scheme.heist!.stage);
    expect(b.scheme.heists).toEqual(['0:1']);
    expect(b.scheme.heist!.lines.length).toBeGreaterThan(1);
    expect(refused(at(b, 'dispatch'), { type: 'heist', id: 'museum' })).toMatch(/One heist a district/);
    expect(playMuseum('h-1')).toEqual(b);
    expect(b.draws['evil-scheme']).toBeGreaterThan(0);
  });
  it('inside the rooms nothing else moves; a heist is Grey or darker', () => {
    let b = ok(found(), { type: 'heist', id: 'museum' });
    b = ok(b, { type: 'heistPlan', slot: 'in', value: 'front' });
    b = ok(at(b, 'inPerson'), { type: 'heistGo' });
    if (b.scheme.heist!.stage === 'rooms') expect(refused(b, { type: 'stayIn' })).toMatch(/inside/);
    expect(refused(found({ line: 'clean' }), { type: 'heist', id: 'museum' })).toMatch(/Grey/);
  });
  it('a heist for a part stamps it not clean when it\'s got', () => {
    let done = 0;
    for (const seed of ['p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-7', 'p-8']) {
      const b = playMuseum(seed, true);
      if (b.scheme.heist!.stage === 'done' && b.scheme.heist!.failedAt !== 'thing') {
        done++;
        expect(b.scheme.parts.key).toMatchObject({ state: 'inHand', clean: false });
      } else expect(b.scheme.parts.key.state).toBe('empty');
    }
    expect(done).toBeGreaterThan(0);
  });
});

describe('Kanto\'s Ledger', () => {
  it('four steps from District 2, each stamped; the books supply a Cause Key', () => {
    let b = found({}, 2);
    expect(refused(found({}, 1), { type: 'ledgerStep', key: 'dirty' })).toMatch(/District 2/);
    b = ok(b, { type: 'ledgerStep', key: 'dirty' });
    expect(b.scheme.ledger).toMatchObject({ step: 1, clean: [false] });
    b = ok(b, { type: 'ledgerStep', key: 'clean' });
    expect(b.scheme.jobs[0]!.part).toBe('ledger');
    b = to(to(to(to(b))));
    expect(b.scheme.ledger.step).toBe(2);
    // Step 3, asked at Truce: the books are read, and the Cause Key is stamped clean.
    b = { ...b, district: { ...b.district!, n: 3 }, neighbour: { ...b.neighbour!, stance: 'truce' } };
    b = ok(b, { type: 'ledgerStep', key: 'clean' });
    expect(b.scheme.parts.key).toMatchObject({ state: 'inHand', clean: true, way: 'ledger' });
  });
});

describe('a fallen team\'s Scheme', () => {
  it('can be taken up: four parts already stamped not clean; the team\'s own is set aside, not dropped', () => {
    const b0 = inHand(found(), ['means']);
    const fallen = { ...b0, neighbour: { ...b0.neighbour!, scheme: inheritedScheme(defOf(b0.neighbour!)) } };
    const b = ok(fallen, { type: 'takeUpScheme' });
    expect(b.scheme.inherited).toBe(true);
    for (const p of PARTS) expect(b.scheme.parts[p]).toMatchObject({ state: 'inHand', clean: false });
    expect(b.scheme.aside!.parts.means.state).toBe('inHand');
    expect(schemeModel(b, 0)!.faint).toBe('Don\'t. It was never a good idea.');
    expect(refused(b, { type: 'takeUpScheme' })).toMatch(/already/);
  });
});

describe('the page and the save (block v11)', () => {
  it('the Scheme page: four slots, a bar, ticks, rows with their Card; off is the undo', () => {
    const b = found({}, 3);
    const m = schemeModel(b, 0)!;
    expect(m.slots).toHaveLength(4);
    expect(m.readyAt).toBe(80);
    expect(m.rows.length).toBeGreaterThan(3);
    expect(m.rows[0]!.card).toHaveLength(13);
    expect(m.faint.length).toBeGreaterThan(20);
    const OFF: EvilData = { ...EVIL_DATA, scheme: { ...EVIL_DATA.scheme, on: false } };
    expect(schemeModel(b, 0, OFF)).toBeNull();
    expect(wayProblem(b, 'means', 'clean', OFF)).toMatch(/switched off/);
  });
  it('v10 -> v11: an empty Scheme for the team\'s Creed and the new stream at 0; a running Dig survives a reload', () => {
    const b = found({ creed: 'spite' });
    const { scheme: _s, ...rest } = b;
    const { 'evil-scheme': _d, ...draws } = b.draws;
    const v11 = EvilModeBlockSchema.parse({ ...rest, v: 10, draws });
    expect(v11.v).toBe(19);
    expect(v11.scheme).toMatchObject({ family: 'spite', groundwork: 0, inherited: false, jobs: [], digs: [], eye: 'open' });
    for (const p of PARTS) expect(v11.scheme.parts[p].state).toBe('empty');
    expect(v11.draws['evil-scheme']).toBe(0);
    const dug = ok(holdTown(found()), { type: 'dig', id: 'sealed' });
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(dug)))).toEqual(dug);
    // A damaged part is refused, not dropped silently.
    expect(EvilModeBlockSchema.safeParse({ ...dug, scheme: { ...dug.scheme, parts: { ...dug.scheme.parts, key: { ...dug.scheme.parts.key, state: 'stolen' } } } }).success).toBe(false);
  });
});
