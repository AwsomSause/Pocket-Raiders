// Evil Mode slice 7 ("the Night"): the Office, the first forty knocks, the picker's eleven rules, "(Not tonight.)",
// echoes, Hear someone out with its mood wrappers, the one action, and the Wall. Normal, boundary and failure cases.
import { describe, expect, it } from 'vitest';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { step, type EvilAction } from '../../src/core/evilMode/day';
import { answerKnock, deckTonight, drawKnock, hearLine, knockDef, LIVE_NEED_IDS, needMet, nightAction, takeDown, wallState } from '../../src/core/evilMode/night';
import { newNight, nightModel } from '../../src/core/evilMode/nightScreens';
import { inRoster } from '../../src/core/evilMode/people';
import { EvilModeBlockSchema, emptyNight, MOODS, type EvilModeBlock } from '../../src/core/evilMode/schema';
import { foundTeam } from '../../src/core/evilMode/start';

const found = (seed = 'n1', creed = 'belonging'): EvilModeBlock => {
  const r = foundTeam({ name: 'Kettle', creed, line: 'grey', doctrine: 'swarm' }, { boss: 'red', length: 'three', seed });
  if (!r.ok) throw new Error(r.problem);
  return r.block;
};
const go = (b: EvilModeBlock, a: EvilAction): EvilModeBlock => {
  const r = step(b, a);
  if (!r.ok) throw new Error(JSON.stringify(r.cues));
  return r.block;
};
/** From a day's Morning to its Night (the knock is drawn on the way in). */
const toNight = (b: EvilModeBlock): EvilModeBlock => {
  for (const t of ['dismissOvernight', 'send', 'stayIn', 'callItADay'] as const) b = go(b, { type: t });
  return b;
};
/** A block at Night on a given day, the knock not yet drawn. */
const atNight = (b: EvilModeBlock, day: number, patch: Partial<EvilModeBlock['night']> = {}): EvilModeBlock => ({ ...b, here: { ...b.here, day, beat: 'night' }, applied: b.applied.filter((k) => !k.startsWith('night:')), night: { ...b.night, knock: null, ...patch } });
const NUMBERS = ['regard', 'dread', 'heat', 'funds', 'corruption'] as const;

describe('the forty knocks, as data', () => {
  const K = EVIL_DATA.night.knocks;
  it('are numbered 1 to 40, three answers each, every one with a status', () => {
    expect(K.map((k) => k.n)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    for (const k of K) expect(k.answers).toHaveLength(3);
  });
  it("every echo's target exists: a Wall thing, a flag with somewhere it's read, a person for person echoes", () => {
    const wall = new Set(EVIL_DATA.night.wall.map((w) => w.id));
    const flags = new Set(EVIL_DATA.night.flags.map((f) => f.id));
    for (const k of K) for (const a of k.answers) for (const e of a.echo) {
      if (e.t === 'wall') expect(wall.has(e.item), `knock ${k.n} wall ${e.item}`).toBe(true);
      if (e.t === 'flag') expect(flags.has(e.id), `knock ${k.n} flag ${e.id}`).toBe(true);
      // Echoes on "self" need a speaker from the Roster: never on a knock from outside or from nobody.
      if (['mood', 'loyalty', 'hush', 'leave'].includes(e.t)) expect(!!(k.who.outside || k.who.nobody), `knock ${k.n} ${e.t} needs a person`).toBe(false);
    }
    for (const f of EVIL_DATA.night.flags) expect(f.readBy.length).toBeGreaterThan(0);
  });
  it('no answer moves a number by more than one (and moves at most one person a step)', () => {
    for (const k of K) for (const a of k.answers) {
      const by: Record<string, number> = {};
      for (const e of a.echo) {
        const key = e.t === 'team' ? e.stat : e.t === 'regardOrDread' ? 'regard|dread' : e.t === 'loyalty' ? 'loyalty' : e.t === 'mood' ? 'mood' : null;
        if (key) by[key] = (by[key] ?? 0) + Math.abs('by' in e ? e.by : 1);
      }
      for (const [key, v] of Object.entries(by)) expect(v, `knock ${k.n} "${a.say}" ${key}`).toBeLessThanOrEqual(1);
    }
  });
  it("every need is declared; the live ones have code; a knock is disabled exactly when a need waits on a later slice", () => {
    const needs = new Map(EVIL_DATA.night.needs.map((n) => [n.id, n]));
    for (const n of EVIL_DATA.night.needs) {
      if (n.live) expect(LIVE_NEED_IDS.includes(n.id) || n.id.startsWith('flag:'), n.id).toBe(true);
      else expect(n.waits, n.id).toBeTruthy();
    }
    for (const k of K) {
      for (const id of [...k.needs, ...k.answers.flatMap((a) => a.needs ?? [])]) expect(needs.has(id), `knock ${k.n} need ${id}`).toBe(true);
      const waits = k.needs.some((id) => !needs.get(id)!.live);
      expect(k.status === 'disabled', `knock ${k.n}`).toBe(waits);
    }
    expect(K.filter((k) => k.status !== 'disabled').length).toBe(17);
  });
  it('only the knocks the design says can be shut out can be: the summons (38), the mother (29), the mole found (34) cannot', () => {
    expect(K.filter((k) => !k.shut).map((k) => k.n)).toEqual([29, 34, 38]);
  });
});

describe('the picker', () => {
  it('the first Night is always knock 1 or knock 2, for every Creed and many seeds', () => {
    for (const creed of EVIL_DATA.creeds.map((c) => c.id)) for (let i = 0; i < 15; i++) {
      const b = toNight(found(`f${i}`, creed));
      expect(b.here.beat).toBe('night');
      expect([1, 2]).toContain(b.night.knock?.n);
    }
  });
  it("the draw is taken on `evil-people` once a Night, even when nobody knocks, and no other stream moves", () => {
    const b = toNight(found());
    const before = go(go(go(found(), { type: 'dismissOvernight' }), { type: 'send' }), { type: 'stayIn' });
    expect(b.draws['evil-people']).toBe(before.draws['evil-people']! + 1);
    for (const s of ['evil-dispatch', 'evil-mole', 'evil-gym', 'evil-neighbour'] as const) expect(b.draws[s]).toBe(before.draws[s]);
    // Every live knock already had: nobody qualifies, the door doesn't go, and the draw is still taken.
    const all = EVIL_DATA.night.knocks.map((k) => k.n);
    const empty = drawKnock(atNight(b, 3, { had: all }));
    expect(empty.night.knock).toBeNull();
    expect(empty.draws['evil-people']).toBe(b.draws['evil-people']! + 1);
    // Drawn once a Night: a second call on the same Night changes nothing.
    expect(drawKnock(empty)).toBe(empty);
  });
  it('the seventh day draws only ☼ knocks', () => {
    for (let i = 0; i < 30; i++) {
      const b = drawKnock(atNight(found(`s${i}`), 7, { had: [1] }));
      if (b.night.knock) expect(knockDef(b.night.knock.n)!.sun).toBe(true);
    }
  });
  it('nobody knocks two Nights running, unless a line ordered across today sends them (rule 4)', () => {
    const b0 = toNight(found());
    const someone = inRoster(b0).find((p) => p.rank === 'grunt')!;
    for (let i = 0; i < 20; i++) {
      const b = drawKnock(atNight({ ...b0, district: { ...b0.district!, seed: `x${i}` } }, 3, { had: [1], last: { who: someone.id, day: 2 } }));
      expect(b.night.knock?.who).not.toBe(someone.id);
    }
    // Asked across their line today: they're at the door tonight, whoever knocked last night.
    const asked = { ...b0, log: [...b0.log, { id: 'Lx', day: 3, region: 0, district: b0.district!.n, kind: 'asked' as const, who: [someone.id], text: 'asked anyway' }] };
    const forced = drawKnock(atNight(asked, 3, { had: [1], last: { who: someone.id, day: 2 } }));
    expect(forced.night.knock).toMatchObject({ who: someone.id, rule: 4 });
  });
  it('passed over yesterday: they knock tonight (rule 6)', () => {
    const b0 = toNight(found());
    const p = inRoster(b0).at(-1)!;
    const b = drawKnock(atNight(b0, 4, { had: [1], passed: [{ id: p.id, day: 3 }] }));
    expect(b.night.knock).toMatchObject({ who: p.id, rule: 6 });
  });
  it("needs: knock 27 (the detective) only at Heat 5, 38 (the summons) only at 6, 32 only after a handshake", () => {
    const b = toNight(found());
    expect(deckTonight(atNight(b, 3, { had: [1] })).some((c) => c.n === 27)).toBe(false);
    const hot = { ...b, team: { ...b.team, heat: 6 } };
    const ns = deckTonight(atNight(hot, 3, { had: [1] })).map((c) => c.n);
    expect(ns).toEqual(expect.arrayContaining([27, 38]));
    expect(needMet(b, 'flag:handshake')).toBe(false);
    expect(needMet({ ...b, night: { ...b.night, flags: ['handshake'] } }, 'flag:handshake')).toBe(true);
  });
  it('Corruption 2 takes one ☼ knock out of the deck a district', () => {
    const b = toNight(found());
    const c = drawKnock(atNight({ ...b, team: { ...b.team, corruption: 2 } }, 3, { had: [1] }));
    expect(c.night.removed).toHaveLength(1);
    expect(knockDef(Number(c.night.removed[0]!.split(':').at(-1)))!.sun).toBe(true);
  });
});

describe('a whole run of Nights', () => {
  it('no knock repeats, every answer writes exactly one Log line, and one draw a Night: twenty seeds, twenty Nights each', () => {
    for (let s = 0; s < 20; s++) {
      let b = toNight(found(`r${s}`, EVIL_DATA.creeds[s % 6]!.id));
      b = { ...b, team: { ...b.team, heat: 6, regard: 5 } };
      const seen: number[] = [];
      for (let day = 1; day <= 20; day++) {
        if (day > 1) b = drawKnock(atNight(b, day));
        const k = b.night.knock;
        const logBefore = b.log.length;
        if (k) {
          // Answer 0..2, or "(Not tonight.)" where allowed; the first shut-out comes back once.
          const def = knockDef(k.n)!;
          const i = (s + day) % 5 === 0 && def.shut ? 3 : (s + day) % 3;
          const r = answerKnock(b, i);
          if (r.problem) {
            const r2 = answerKnock(b, (i + 1) % 3);
            expect(r2.problem).toBeNull();
            b = r2.block;
          } else b = r.block;
          expect(b.log.length).toBe(logBefore + 1);
          if (b.night.echoes.at(-1)!.answer !== 3) {
            expect(seen).not.toContain(k.n);
            seen.push(k.n);
          }
        }
        expect(b.night.knock).toBeNull();
      }
      expect(new Set(b.night.had).size).toBe(b.night.had.length);
      expect(seen.length).toBeGreaterThanOrEqual(5);
    }
  });
  it('same seed, same answers, same Nights (determinism)', () => {
    const run = () => {
      let b = toNight(found('d1'));
      for (let day = 2; day <= 12; day++) {
        if (b.night.knock) b = answerKnock(b, 0).block.night.knock === null ? answerKnock(b, 0).block : b;
        b = drawKnock(atNight(b, day));
      }
      return JSON.stringify(b.night);
    };
    expect(run()).toBe(run());
  });
});

describe('answers, echoes and "(Not tonight.)"', () => {
  const firstNight = () => toNight(found());
  it('an answer is kept, its echo applied, and what moved is one line', () => {
    let b = firstNight();
    const k = b.night.knock!;
    const r = answerKnock(b, 2);
    expect(r.problem).toBeNull();
    b = r.block;
    expect(b.night.echoes.at(-1)).toMatchObject({ n: k.n, answer: 2, day: 1 });
    expect(b.night.had).toContain(k.n);
    expect(r.moved.length).toBeGreaterThan(0);
    expect(b.log.at(-1)!.kind).toBe('knock');
  });
  it("knock 1's lie: their mood steps to Wary and the first lie is remembered", () => {
    let b = firstNight();
    b = { ...b, night: { ...b.night, knock: { n: 1, who: inRoster(b)[0]!.id, day: 1, rule: 11 } } };
    const r = answerKnock(b, 1);
    const p = r.block.crew.find((c) => c.id === inRoster(b)[0]!.id)!;
    expect(p.mood).toBe('wary');
    expect(r.block.night.flags).toContain('firstLie');
  });
  it('"(Not tonight.)": the knock returns once; twice and it\'s gone; slept through counted; their mood a step down', () => {
    let b = firstNight();
    const k = b.night.knock!;
    const mood = b.crew.find((c) => c.id === k.who)!.mood;
    b = answerKnock(b, 3).block;
    expect(b.night.sleptThrough).toBe(1);
    expect(b.night.had).not.toContain(k.n);
    expect(b.crew.find((c) => c.id === k.who)!.mood).toBe(MOODS[MOODS.indexOf(mood) + 1]);
    b = { ...b, night: { ...b.night, knock: { ...k, day: 2 } } };
    b = answerKnock(b, 3).block;
    expect(b.night.had).toContain(k.n);
    expect(b.night.sleptThrough).toBe(2);
  });
  it("the summons can't be shut out, and Lights out can't skip it", () => {
    const b0 = firstNight();
    const b = { ...b0, team: { ...b0.team, heat: 6 }, night: { ...b0.night, knock: { n: 38, who: null, day: 1, rule: 11 } } };
    expect(answerKnock(b, 3).problem).toBeTruthy();
    expect(step(b, { type: 'lightsOut' }).ok).toBe(false);
    const burnt = answerKnock(b, 2).block;
    expect(burnt.team.heat).toBe(7);
  });
  it('Lights out with somebody at the door is "(Not tonight.)"', () => {
    const b = firstNight();
    const out = go(b, { type: 'lightsOut' });
    expect(out.night.sleptThrough).toBe(1);
    expect(out.here.beat).toBe('hero');
  });
  it('knock 25: whatever the answer, a minor stays a minor', () => {
    const b0 = firstNight();
    const minor = EVIL_DATA.people.people.find((p) => p.minor)!;
    const withMinor: EvilModeBlock = { ...b0, crew: [...b0.crew, { id: minor.id, ref: minor.id, name: minor.name, age: minor.age, minor: true, talent: minor.talent, flaw: minor.flaw, flawFound: true, line: minor.line, lineHeard: false, rank: 'grunt', loyalty: 5, where: 'in', outOn: null, jobs: 0, asked: 0, unpaid: 0, fitIn: null, mood: 'easy', knocks: 0 }] };
    for (const i of [0, 1, 2, 3]) {
      const b = { ...withMinor, night: { ...withMinor.night, knock: { n: 25, who: minor.id, day: 1, rule: 11 } } };
      const out = answerKnock(b, i).block;
      expect(out.crew.find((c) => c.id === minor.id)).toMatchObject({ minor: true, where: 'in' });
    }
  });
  it("knock 31's handshake: they leave, logged with how; the coat: they leave and it hangs by the door", () => {
    const b0 = firstNight();
    const p = inRoster(b0)[1]!;
    const b = { ...b0, crew: b0.crew.map((c) => (c.id === p.id ? { ...c, loyalty: 2 } : c)), night: { ...b0.night, knock: { n: 31, who: p.id, day: 1, rule: 11 } } };
    const shake = answerKnock(b, 0).block;
    expect(shake.crew.find((c) => c.id === p.id)).toMatchObject({ where: 'left', left: { how: 'handshake' } });
    expect(shake.night.flags).toContain('handshake');
    const coat = answerKnock(b, 2).block;
    expect(coat.crew.find((c) => c.id === p.id)!.left?.how).toBe('coat');
    expect(coat.night.wall.map((w) => w.item)).toContain('coat');
  });
  it("an answer whose own need isn't met is refused, and nothing changes", () => {
    const b0 = firstNight();
    const b = { ...b0, night: { ...b0.night, knock: { n: 11, who: inRoster(b0)[0]!.id, day: 1, rule: 11 } } };
    const r = answerKnock(b, 0);
    expect(r.problem).toMatch(/Front/);
    expect(r.block).toBe(b);
  });
  it('answers only at Night, and only with somebody at the door', () => {
    const b = found();
    expect(answerKnock(b, 0).problem).toBeTruthy();
    const quiet = { ...toNight(found()), night: { ...toNight(found()).night, knock: null } };
    expect(answerKnock(quiet, 0).problem).toBeTruthy();
  });
});

describe('the one action: Hear someone out', () => {
  it('waits for the door, moves nothing, and is one a Night', () => {
    let b = toNight(found());
    const p = inRoster(b)[0]!;
    expect(nightAction(b, 'hear', p.id).problem).toBeTruthy();
    b = answerKnock(b, 0).block;
    const r = nightAction(b, 'hear', p.id);
    expect(r.problem).toBeNull();
    expect(r.block.crew).toEqual(b.crew);
    expect(r.block.team).toEqual(b.team);
    expect(r.line).toContain(p.name);
    expect(nightAction(r.block, 'sleep', null).problem).toBeTruthy();
  });
  it('the five moods: Warm says more, Wary half, Sullen the fact, Shut nothing', () => {
    const b = toNight(found());
    const p = inRoster(b).find((c) => c.ref && EVIL_DATA.night.hear.byPerson[c.ref])!;
    const easy = hearLine(b, { ...p, mood: 'easy' });
    expect(easy).toBe(EVIL_DATA.night.hear.byPerson[p.ref!]);
    expect(hearLine(b, { ...p, mood: 'warm' }).length).toBeGreaterThan(easy.length);
    expect(hearLine(b, { ...p, mood: 'wary' })).toContain('watch how you take it');
    expect(hearLine(b, { ...p, mood: 'sullen' })).toContain('Flatly');
    expect(hearLine(b, { ...p, mood: 'shut' })).toBe(EVIL_DATA.night.text.hearShut);
  });
  it('every Founder and every Kanto person has an ordinary-day line', () => {
    for (const p of EVIL_DATA.people.people) expect(EVIL_DATA.night.hear.byPerson[p.id], p.id).toBeTruthy();
  });
});

describe('the Wall', () => {
  const withWall = (): EvilModeBlock => {
    const b = toNight(found());
    return { ...b, night: { ...b.night, wall: [{ item: 'mug', day: 1, down: null }, { item: 'crayon', day: 1, down: null }, { item: 'summons', day: 2, down: null }] } };
  };
  it('taking down leaves a gap: the thing stays in its place, marked down', () => {
    const b = withWall();
    const r = takeDown(b, 1);
    expect(r.problem).toBeNull();
    expect(r.block.night.wall).toHaveLength(3);
    expect(r.block.night.wall[1]).toMatchObject({ item: 'crayon', down: b.here.day });
    const m = nightModel(r.block, { ...newNight(), pane: 'wall' });
    expect(m.wall!.items[1]!.down).toBe(true);
    expect(takeDown(r.block, 1).problem).toBeTruthy();
  });
  it("desk things don't come down", () => {
    expect(takeDown(withWall(), 0).problem).toBeTruthy();
  });
  it('its four states: kept, took down the kind ones, edited, bare', () => {
    const b = withWall();
    expect(wallState(b)).toBe('kept');
    expect(wallState(takeDown(b, 1).block)).toBe('kind');
    expect(wallState(takeDown(b, 2).block)).toBe('edited');
    expect(wallState(takeDown(takeDown(b, 1).block, 2).block)).toBe('bare');
  });
});

describe('the Office screen', () => {
  it('the door shows four answers, the fourth "(Not tonight.)"; no Loyalty figure anywhere', () => {
    const b = toNight(found());
    const m = nightModel(b, newNight());
    expect(m.door!.answers).toHaveLength(4);
    expect(m.door!.answers[3]!.name).toBe('(Not tonight.)');
    expect(JSON.stringify(m)).not.toMatch(/loyalty/i);
  });
});

describe('saves', () => {
  it('to v20 (slice 7\'s reserved number) from any block without a Night: an empty Night, everyone Easy; save and reload keeps a knock at the door', () => {
    const b = toNight(found());
    const { night: _n, ...rest } = b;
    const crew = b.crew.map(({ mood: _m, knocks: _k, ...c }) => c);
    // v9 (slice 10's block, today's last before the Night) and v15 (a block saved by slices that land before this one).
    for (const v of [9, 15]) {
      const out = EvilModeBlockSchema.parse(JSON.parse(JSON.stringify({ ...rest, v, crew })));
      expect(out.v).toBe(20);
      expect(out.night).toEqual(emptyNight());
      expect(out.crew.every((c) => c.mood === 'easy' && c.knocks === 0)).toBe(true);
    }
    // A block that already has its Night keeps it.
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify({ ...b, v: 15 }))).night).toEqual(b.night);
    // An older block goes through every step to v20.
    const { base: _b, raid: _r, law: _l, ...older } = rest as typeof rest & { base?: unknown; raid?: unknown; law?: unknown };
    expect(EvilModeBlockSchema.parse(JSON.parse(JSON.stringify({ ...older, v: 8, crew }))).v).toBe(20);
    const again = EvilModeBlockSchema.parse(JSON.parse(JSON.stringify(b)));
    expect(again).toEqual(b);
  });
  it('a damaged Night is refused', () => {
    const b = toNight(found());
    expect(EvilModeBlockSchema.safeParse({ ...b, night: { ...b.night, sleptThrough: -1 } }).success).toBe(false);
  });
  it("numbers stay in range whatever's answered", () => {
    let b = toNight(found());
    b = { ...b, team: { ...b.team, heat: 10 }, night: { ...b.night, knock: { n: 38, who: null, day: 1, rule: 11 } } };
    const out = answerKnock(b, 2).block;
    for (const k of NUMBERS) expect(out.team[k]).toBeGreaterThanOrEqual(0);
    expect(out.team.heat).toBe(10);
  });
});
