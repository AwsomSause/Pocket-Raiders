// Evil Mode slice 4 ("people"): the sixteen Founders, talents, flaws and lines; rank and wage; Loyalty per person (never
// for the team); hiring from the notice board; three ways to leave; asking anyway. Normal, boundary and failure cases.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { step, type EvilAction } from '../../src/core/evilMode/day';
import { jobProblem, swapsFor } from '../../src/core/evilMode/dispatch';
import { cardFor } from '../../src/core/evilMode/card';
import { oddsFor } from '../../src/core/evilMode/odds';
import { crossers, deckFor, foundingRoster, inRoster, jobTags, teamLoyalty, wontText } from '../../src/core/evilMode/people';
import { rosterModel, newRoster, refusalModel } from '../../src/core/evilMode/rosterScreens';
import { frameModel } from '../../src/core/evilMode/screens';
import { boardModel, newDispatch } from '../../src/core/evilMode/boardScreens';
import { EvilModeBlockSchema, migrateEvilBlock, type Crew, type EvilModeBlock } from '../../src/core/evilMode/schema';
import { foundTeam } from '../../src/core/evilMode/start';
import { arriveApplicants } from '../../src/core/evilMode/roster';

const found = (seed = 'p1', creed = 'profit'): EvilModeBlock => {
  const r = foundTeam({ name: 'Kettle', creed, line: 'grey', doctrine: 'swarm' }, { boss: 'red', length: 'three', seed, stage: 2 });
  if (!r.ok) throw new Error(r.problem);
  return r.block;
};
const go = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(JSON.stringify(r.cues));
  return r.block;
};
const said = (b: EvilModeBlock, a: EvilAction): string => {
  const r = step(b, a);
  const c = r.cues.find((x) => x.id === 'said');
  return c && 'line' in c ? c.line : '';
};
const toDispatch = (b: EvilModeBlock) => go(b, { type: 'dismissOvernight' });
const endDay = (b: EvilModeBlock) => {
  for (const t of ['send', 'stayIn', 'callItADay', 'lightsOut', 'watchRoad', 'dismissOvernight'] as const) {
    if (b.district?.end) return b;
    b = go(b, { type: t });
  }
  return b;
};
const deck = (id: string) => EVIL_DATA.people.people.find((p) => p.id === id)!;
/** A person straight from the deck, put on the Roster (for scenes that need a particular someone). */
const withPerson = (b: EvilModeBlock, id: string, patch: Partial<Crew> = {}): EvilModeBlock => {
  const d = deck(id);
  const p: Crew = { id: d.id, ref: d.id, name: d.name, age: d.age, minor: !!d.minor, talent: d.talent, flaw: d.flaw, flawFound: true, line: d.line, lineHeard: false, rank: 'grunt', loyalty: 5, where: 'in', outOn: null, jobs: 0, asked: 0, unpaid: 0, fitIn: null, ...patch };
  return { ...b, crew: [...b.crew.filter((c) => c.id !== id), p] };
};
const local = (b: EvilModeBlock) => b.district!.holdings.find((h) => h.kind === 'local' && h.mood !== 'shut' && !EVIL_DATA.district.locals.find((l) => l.id === h.ref)?.minor && EVIL_DATA.district.locals.find((l) => l.id === h.ref)?.noPrice === undefined)!;
const clearLines = (b: EvilModeBlock): string[] => inRoster(b).filter((c) => !c.minor && c.line !== 17 && c.line !== 12).map((c) => c.id);

/** Walks a model and fails on any key that would print a Loyalty as a figure. */
function noLoyaltyFigure(x: unknown, path = ''): void {
  if (!x || typeof x !== 'object') return;
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (/loyal/i.test(k)) expect(typeof v, `${path}.${k}`).not.toBe('number');
    if (typeof v === 'string') expect(v, `${path}.${k}`).not.toMatch(/loyalty\s*[:=]?\s*\d/i);
    noLoyaltyFigure(v, `${path}.${k}`);
  }
}

describe('the deck and the Founders (people.json, faces.json)', () => {
  it('sixteen Founders and twelve in Kanto, each with a talent, a flaw, a line and a face that exists', () => {
    const P = EVIL_DATA.people.people;
    expect(P.filter((p) => p.deck === 'founders')).toHaveLength(16);
    expect(P.filter((p) => p.deck === 'kanto')).toHaveLength(12);
    expect(new Set(P.map((p) => p.id)).size).toBe(P.length);
    for (const p of P) {
      const f = EVIL_DATA.faces.find((x) => x.ref === p.id);
      expect(f, p.id).toBeTruthy();
      const path = `public/assets/images/trainer/${f!.sprite.replace(/^trainer\./, '')}.png`;
      expect(existsSync(path), path).toBe(true);
      expect(f!.provenance.length).toBeGreaterThan(5);
      // Grunt pictures are kept for the nameless: no named person is drawn as a Grunt.
      expect(f!.sprite).not.toMatch(/grunt/);
    }
    expect(P.filter((p) => p.minor).map((p) => p.id).sort()).toEqual(['beatriz', 'sooah']);
  });
  it('thirty-six lines, numbered once each; every person\'s line exists', () => {
    expect(EVIL_DATA.people.lines.map((l) => l.n)).toEqual(Array.from({ length: 36 }, (_, i) => i + 1));
  });
});

describe('founding a Roster', () => {
  it('the Creed\'s count, from the Founders only, of at least two talents, and never a minor', () => {
    for (const creed of ['profit', 'cause', 'power', 'wonder', 'belonging', 'spite']) for (const seed of ['a', 'b', 'c', 'd']) {
      const b = found(seed, creed);
      const n = EVIL_DATA.creeds.find((c) => c.id === creed)!.start.roster;
      expect(b.crew).toHaveLength(n);
      expect(b.crew.every((c) => deck(c.id).deck === 'founders' && !c.minor && c.rank === 'grunt')).toBe(true);
      if (n > 1) expect(new Set(b.crew.map((c) => c.talent)).size).toBeGreaterThan(1);
      expect(b.crew.every((c) => c.loyalty === EVIL_DATA.creeds.find((x) => x.id === creed)!.start.loyalty)).toBe(true);
    }
  });
  it('the same seed founds the same people; the draws are counted on evil-people only', () => {
    expect(found('s').crew).toEqual(found('s').crew);
    const b = found('s');
    expect(b.draws['evil-dispatch']).toBe(0);
    expect(b.draws['evil-people']).toBeGreaterThan(0);
    expect(foundingRoster('s', 'profit').crew).toEqual(b.crew);
  });
  it('the Founders turn up only in the first region; an empty deck sends nobody', () => {
    expect(deckFor(1, []).length).toBe(0);
    expect(deckFor(0, EVIL_DATA.people.people.map((p) => p.id))).toHaveLength(0);
  });
});

describe('Loyalty: per person, never the team\'s, never a figure on screen', () => {
  it('Team Loyalty is never in a save: no key holds it; it is worked out from the people', () => {
    const b = found();
    const json = JSON.parse(JSON.stringify(b));
    expect('loyalty' in json.team).toBe(false);
    expect(Object.keys(json).some((k) => /loyal/i.test(k))).toBe(false);
    const lowered = { ...b, crew: b.crew.map((c) => ({ ...c, loyalty: 2 })) };
    expect(teamLoyalty(lowered)).toBe(2);
    expect(frameModel(lowered, 'Red').strip.loyalty.name).toBe('Leaving');
  });
  it('no view prints a Loyalty as a figure (frame, board, roster, both tabs)', () => {
    let b = found();
    noLoyaltyFigure(frameModel(b, 'Red'));
    noLoyaltyFigure(boardModel(b, newDispatch()));
    noLoyaltyFigure(rosterModel(b, newRoster(0)));
    noLoyaltyFigure(rosterModel(b, newRoster(1)));
    b = { ...b, crew: b.crew.map((c, i) => ({ ...c, loyalty: [10, 0, 4, 7][i % 4]! })) };
    noLoyaltyFigure(rosterModel(b, { ...newRoster(0), act: 0 }));
  });
  it('one cause never moves a person more than two', () => {
    let b = toDispatch(found());
    const h = local(b);
    const ids = clearLines(b);
    b = go(b, { type: 'confirmCard', job: { holdingId: h.id, method: 'persuade', squad: ids.slice(0, 2) } });
    b = endDay(b);
    for (const c of b.crew) expect(Math.abs(c.loyalty - 5)).toBeLessThanOrEqual(2);
  });
});

describe('the lines, and asking anyway', () => {
  const sundayOutplay = () => {
    let b = toDispatch(found());
    b = withPerson(b, 'otis');
    b = withPerson(b, 'faye');
    return b;
  };
  it('the matcher names every person whose line a job crosses, and nobody else', () => {
    const b = sundayOutplay();
    const h = local(b);
    const job = { holdingId: h.id, method: 'outplay' as const, squad: ['otis', 'faye'] };
    expect(jobTags(b, job)).toContain('fightLocal');
    expect(crossers(b, job).map((c) => c.id)).toEqual(['otis']);
    expect(wontText(b, job)).toBe('Otis Blackthorn ("won\'t fight anyone who\'s not ready").');
    expect(cardFor(b, job).fields[7]!.text).toBe(wontText(b, job));
    expect(crossers(b, { ...job, method: 'persuade' })).toEqual([]);
    expect(cardFor(b, { ...job, method: 'persuade' }).fields[7]!.text).toBe('Nobody.');
    // Sundays: Jun-seo won't, on the seventh day.
    const sun = withPerson({ ...b, here: { ...b.here, day: 7 } }, 'junseo');
    expect(crossers(sun, { holdingId: h.id, method: 'persuade', squad: ['junseo', 'faye'] }).map((c) => c.id)).toEqual(['junseo']);
  });
  it('an order across a line can\'t simply be confirmed: step refuses it and says "Ask anyway"', () => {
    const b = sundayOutplay();
    const r = step(b, { type: 'confirmCard', job: { holdingId: local(b).id, method: 'outplay', squad: ['otis', 'faye'] } });
    expect(r.ok).toBe(false);
    expect(JSON.stringify(r.cues)).toMatch(/Ask anyway/);
  });
  for (const answer of ['withdraw', 'swap', 'insist'] as const) {
    it(`asked anyway, then "${answer}": the asking costs whether or not they go`, () => {
      const b0 = sundayOutplay();
      const h = local(b0);
      const job = { holdingId: h.id, method: 'outplay' as const, squad: ['otis', 'faye'] };
      const b1 = go(b0, { type: 'askAnyway', job });
      const otis1 = b1.crew.find((c) => c.id === 'otis')!;
      // The asking itself: counted, the line heard by everyone, a Card filed saying who was asked.
      expect(otis1.asked).toBe(1);
      expect(otis1.lineHeard).toBe(true);
      expect(b1.refusal?.who).toEqual(['otis']);
      expect(b1.cards.at(-1)!.fields[11]!.text).toMatch(/Asked Otis Blackthorn anyway\.$/);
      expect(b1.log.filter((e) => e.kind === 'card').at(-1)!.text).toBe(b1.cards.at(-1)!.fields[11]!.text);
      expect(rosterModel(b1, newRoster(0)).wont.lines.join(' ')).toMatch(/fight anyone who's not ready/);
      expect(refusalModel(b1)!.people[0]!.name).toBe('Otis Blackthorn');
      // Nothing else in Dispatch moves until it's answered.
      expect(step(b1, { type: 'send' }).ok).toBe(false);
      const b2 = go(b1, { type: 'answerRefusal', answer });
      const otis = b2.crew.find((c) => c.id === 'otis')!;
      const faye = b2.crew.find((c) => c.id === 'faye')!;
      expect(b2.refusal).toBeNull();
      expect(otis.asked).toBe(1);
      if (answer === 'withdraw') {
        expect(otis.loyalty).toBe(7);
        expect(faye.loyalty).toBe(6);
        expect(b2.queue).toHaveLength(0);
      } else if (answer === 'swap') {
        expect(otis.loyalty).toBe(4);
        expect(b2.queue).toHaveLength(1);
        expect(b2.queue[0]!.squad).not.toContain('otis');
        expect(b2.queue[0]!.squad).toContain('faye');
      } else {
        // Insisted: gone on the spot, still on the list; the two nearest in rank −2; the job's not done today.
        expect(otis.where).toBe('left');
        expect(otis.left?.how).toBe('line');
        expect(b2.crew.some((c) => c.id === 'otis')).toBe(true);
        expect(b2.crew.filter((c) => c.where === 'in' && c.loyalty === 3)).toHaveLength(2);
        expect(b2.queue).toHaveLength(0);
        expect(jobProblem(b2, { ...job, squad: ['otis', 'faye'] })).toMatch(/has left/);
        expect(rosterModel(b2, newRoster(0)).people!.find((p) => p.id === 'otis')!.left).toMatch(/over their line/);
      }
      // The Log only grew.
      expect(b2.log.length).toBeGreaterThan(b1.log.length);
      expect(b2.log.slice(0, b1.log.length)).toEqual(b1.log);
    });
  }
  it('a swap needs someone free whose line is clear', () => {
    let b = sundayOutplay();
    b = { ...b, crew: b.crew.filter((c) => c.id === 'otis' || c.id === 'faye') };
    b = go(b, { type: 'askAnyway', job: { holdingId: local(b).id, method: 'outplay', squad: ['otis', 'faye'] } });
    expect(swapsFor(b)).toBeNull();
    expect(step(b, { type: 'answerRefusal', answer: 'swap' }).ok).toBe(false);
  });
  it('asking anyway with nobody across a line is refused', () => {
    const b = toDispatch(found());
    const r = step(b, { type: 'askAnyway', job: { holdingId: local(b).id, method: 'persuade', squad: clearLines(b).slice(0, 2) } });
    expect(r.ok).toBe(false);
  });
});

describe('a minor can\'t be queued for a job with Heat', () => {
  it('Beatriz may scout; every other method is refused by step, not only on screen', () => {
    let b = withPerson(toDispatch(found()), 'beatriz');
    const h = local(b);
    const other = clearLines(b)[0]!;
    for (const method of ['persuade', 'pay', 'outplay'] as const) {
      expect(EVIL_DATA.district.methods[method].heat !== undefined).toBe(true);
      const job = { holdingId: h.id, method, squad: [other, 'beatriz'], ...(method === 'pay' ? { offer: 100 } : {}) };
      expect(jobProblem(b, job)).toMatch(/Beatriz Carvalho is 16\. Scouting only\./);
      expect(step(b, { type: 'confirmCard', job }).ok).toBe(false);
      expect(step(b, { type: 'askAnyway', job }).ok).toBe(false);
    }
    b = go(b, { type: 'confirmCard', job: { holdingId: h.id, method: 'scout', squad: ['beatriz'] } });
    expect(b.queue).toHaveLength(1);
  });
  it('and can\'t be swapped in for one', () => {
    let b = toDispatch(found());
    b = { ...b, crew: [] };
    b = withPerson(withPerson(withPerson(b, 'otis'), 'faye'), 'beatriz');
    b = go(b, { type: 'askAnyway', job: { holdingId: local(b).id, method: 'outplay', squad: ['otis', 'faye'] } });
    expect(swapsFor(b)).toBeNull();
  });
});

describe('the notice board: applicants, the one question, hiring, saying no', () => {
  it('one applicant a day while the Town isn\'t held; they wait two days; nobody is drawn twice in a run', () => {
    let b = found();
    expect(b.applicants).toHaveLength(1);
    const seen = new Set<string>([...b.crew.map((c) => c.id), ...b.applicants.map((a) => a.ref)]);
    b = toDispatch(b);
    for (let d = 0; d < 5; d++) {
      b = endDay(b);
      if (b.district?.end) break;
      for (const a of b.applicants) expect(b.here.day - a.day).toBeLessThan(EVIL_DATA.people.rules.waitDays);
      for (const a of b.applicants.filter((x) => x.day === b.here.day)) {
        expect(seen.has(a.ref)).toBe(false);
        seen.add(a.ref);
      }
    }
    expect(new Set(b.drawn).size).toBe(b.drawn.length);
  });
  it('a held Town brings three', () => {
    let b = found();
    b = { ...b, district: { ...b.district!, holdings: b.district!.holdings.map((h) => (h.kind === 'town' ? { ...h, owner: 'team' as const, holds: true } : h)) } };
    b = arriveApplicants({ ...b, here: { ...b.here, day: 2 } });
    expect(b.applicants.filter((a) => a.day === 2)).toHaveLength(3);
    // Once a day: the same Morning twice draws nobody more.
    expect(arriveApplicants(b)).toEqual(b);
  });
  it('the one question: once each; "Who sent you?" is always "Nobody."; "What won\'t you do?" means the line\'s heard on hiring', () => {
    let b = found();
    const ref = b.applicants[0]!.ref;
    expect(said(b, { type: 'question', ref, q: 'who' })).toMatch(/"Nobody\."$/);
    b = go(b, { type: 'question', ref, q: 'wont' });
    expect(step(b, { type: 'question', ref, q: 'why' }).ok).toBe(false);
    expect(said(b, { type: 'hire', ref })).toMatch(/puts on the armband/);
    b = go(b, { type: 'hire', ref });
    const p = b.crew.find((c) => c.id === ref)!;
    expect(p.lineHeard).toBe(true);
    expect(p.flawFound).toBe(true);
    expect(b.applicants.some((a) => a.ref === ref)).toBe(false);
    expect(b.log.at(-1)!.kind).toBe('hire');
  });
  it('the Roster is capped; saying no rudely costs Regard', () => {
    let b = found();
    const ref = b.applicants[0]!.ref;
    const full = { ...b, crew: [...b.crew, ...EVIL_DATA.people.people.filter((p) => p.deck === 'kanto').slice(0, 8 - b.crew.length).map((p) => ({ ...b.crew[0]!, id: p.id, ref: p.id, name: p.name }))] };
    expect(step(full, { type: 'hire', ref }).ok).toBe(false);
    b = { ...b, team: { ...b.team, regard: 2 } };
    expect(go(b, { type: 'turnAway', ref, rude: true }).team.regard).toBe(1);
    expect(go(b, { type: 'turnAway', ref, rude: false }).team.regard).toBe(2);
  });
});

describe('ranks and wages', () => {
  it('wage by rank: a Lead costs ₽300 at the Evening; under Cause, half', () => {
    let b = toDispatch(found());
    const id = b.crew[0]!.id;
    b = { ...b, crew: b.crew.map((c) => (c.id === id ? { ...c, jobs: 3 } : c)) };
    b = go(b, { type: 'promote', id, answer: 1 });
    expect(b.crew.find((c) => c.id === id)!.rank).toBe('lead');
    expect(b.crew.find((c) => c.id === id)!.loyalty).toBe(6);
    const before = b.team.funds;
    b = endDay(b);
    expect(before - b.team.funds).toBe(300 + 150 * (b.crew.length - 1));
  });
  it('Grunt to Lead needs three jobs done; above Lead says what it needs', () => {
    const b = found();
    const id = b.crew[0]!.id;
    expect(step(b, { type: 'promote', id, answer: 0 }).ok).toBe(false);
    const lead = { ...b, crew: b.crew.map((c) => (c.id === id ? { ...c, rank: 'lead' as const } : c)) };
    expect(JSON.stringify(step(lead, { type: 'promote', id, answer: 0 }).cues)).toMatch(/room/);
  });
  it('a Lead leading adds +5, a fitting talent +20, in that order, by name', () => {
    let b = toDispatch(found());
    b = withPerson(withPerson(b, 'sioned', { rank: 'lead' }), 'faye');
    const o = oddsFor(b, { holdingId: local(b).id, method: 'persuade', squad: ['sioned', 'faye'] });
    const labels = o.terms.map((t) => t.label);
    expect(labels).toContain('Rolls on Voice: Sioned Prys leads');
    expect(labels.indexOf('Rolls on Voice: Sioned Prys leads')).toBeLessThan(labels.indexOf('Sioned Prys is a Lead'));
  });
});

describe('leaving: three of the nine ways; a leaver stays in the list', () => {
  it('Loyalty 0: gone by morning, with a note by flaw', () => {
    let b = toDispatch(found());
    const id = b.crew[0]!.id;
    b = { ...b, crew: b.crew.map((c) => (c.id === id ? { ...c, loyalty: 0 } : c)) };
    b = endDay(b);
    const p = b.crew.find((c) => c.id === id)!;
    expect(p.where).toBe('left');
    expect(p.left?.how).toBe('loyalty');
    expect(b.log.some((e) => e.kind === 'leave' && e.who.includes(id))).toBe(true);
  });
  it('let go kindly costs a month\'s wage; coldly, Heat +1; both stay on the list', () => {
    const b = found();
    const id = b.crew[0]!.id;
    const kind = go(b, { type: 'letGo', id, kindly: true });
    expect(b.team.funds - kind.team.funds).toBe(150 * 30);
    expect(kind.crew.find((c) => c.id === id)!.left).toMatchObject({ how: 'letGo', kindly: true });
    const cold = go(b, { type: 'letGo', id, kindly: false });
    expect(cold.team.heat).toBe(Math.min(10, b.team.heat + 1));
    expect(cold.crew).toHaveLength(b.crew.length);
    expect(step(cold, { type: 'letGo', id, kindly: false }).ok).toBe(false);
  });
  it('no path removes a person without a leaving logged', () => {
    let b = toDispatch(found());
    const ids = b.crew.map((c) => c.id);
    b = go(b, { type: 'letGo', id: ids[0]!, kindly: false });
    b = endDay(b);
    for (const id of ids) {
      const p = b.crew.find((c) => c.id === id);
      expect(p).toBeTruthy();
      if (p!.where === 'left') expect(b.log.some((e) => e.kind === 'leave' && e.who.includes(id))).toBe(true);
    }
  });
});

describe('saves', () => {
  it('v3 -> v4: the four Grunts stay, nameless, at the Creed\'s Loyalty; save and reload', () => {
    const b = found('m', 'belonging');
    const { applicants: _a, drawn: _d, refusal: _r, ...rest } = b;
    const v3 = { ...rest, v: 3, crew: [1, 2, 3, 4].map((i) => ({ id: `g${i}`, name: `Grunt ${i}`, outOn: null })) };
    const out = EvilModeBlockSchema.parse(v3);
    expect(out.v).toBe(11);
    expect(out.crew.map((c) => [c.id, c.name, c.ref, c.loyalty])).toEqual([1, 2, 3, 4].map((i) => [`g${i}`, `Grunt ${i}`, null, 8]));
    expect(out.applicants).toEqual([]);
    expect(out.refusal).toBeNull();
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(out)))).toEqual(out);
    expect(migrateEvilBlock(out)).toEqual(out);
  });
  it('a damaged person is refused, not dropped silently', () => {
    const b = found();
    expect(() => EvilModeBlockSchema.parse({ ...b, crew: [{ ...b.crew[0]!, loyalty: 11 }] })).toThrow();
    expect(() => EvilModeBlockSchema.parse({ ...b, crew: [{ ...b.crew[0]!, talent: 'charm' }] })).toThrow();
  });
});
