// DOMINION slice D25: chatter, news, Hero and betrayal lines (Claude API draft §5.2; mockup a10). Written lines first;
// Rotom only adds lines stored with the run. Covers the data, crew chatter, the weekly Ledger paper, the Hero's call
// (Disillusion stays hidden), traitors' parting lines, the Rotom calls and stored answers, saves and determinism.
import { describe, expect, it } from 'vitest';
import voicesRaw from '../../src/data/dominion/voices.json';
import { withCrew } from '../../src/core/dominion/crew';
import { personaModel } from '../../src/core/dominion/crewScreens';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { heroOf } from '../../src/core/dominion/hero';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import {
  chatter, heroCall, lastRotomFor, newsEnd, paperNote, printPaper, rotomAsks, rotomText, topicsOf, traitorLine, VOICES, voicesModel, voicesOf,
} from '../../src/core/dominion/voices';
import { voicesView } from '../../src/ui/redux/screens/dominion/voicesViews';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const domRun = (seed = 'dv'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dv'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return out.run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, out.notice ?? '').toBe(true);
  return out.run;
};
const answerAll = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
/** Evening -> Night -> next Morning (the World Turn ran). */
const night = (r: RunState): RunState => answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' }));
/** Morning -> Day -> Evening. */
const toEvening = (r: RunState): RunState => answerAll(go(go(r, { t: 'toDay' }), { t: 'endDay' }));
const evening1 = (seed?: string): RunState => go(started(seed), { t: 'open' });
const edit = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withCrew(structuredClone(blk(r)));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
/** A block with three members (copies of the first under new names and ids). */
const crew3 = (r: RunState): RunState => edit(r, (b) => {
  const m = b.members[0]!;
  for (const [id, name] of [['m-gus', 'GUS'], ['m-rosa', 'ROSA']] as const) b.members.push({ ...structuredClone(m), id, name, crew: m.crew ? { ...structuredClone(m.crew), card: undefined } : undefined });
});

describe('DOMINION D25: the written lines (voices.json)', () => {
  it('every trait has chatter for every topic, a reply and an aside', () => {
    for (const t of DOMINION_DATA.personality.traits) {
      expect(VOICES.chatter.topics[t.id], t.id).toBeDefined();
      expect(VOICES.chatter.reply[t.id]!.length).toBeGreaterThan(0);
      expect(VOICES.chatter.aside[t.id]).toBeTruthy();
    }
    expect(Object.keys(VOICES.hero.taunt)).toEqual(['ignores', 'foils', 'attacks', 'raids', 'allies']);
    expect(Object.keys(VOICES.traitor.lines).sort()).toEqual(['poached', 'quit', 'stole', 'stripped']);
  });
  it('players never see "Claude" or "AI": Rotom is the name', () => {
    const { _source: _, ...player } = voicesRaw;
    const text = JSON.stringify(player);
    expect(text).not.toMatch(/Claude|\bAI\b/);
    expect(VOICES.rotom.chip).toContain('Rotom');
  });
});

describe('DOMINION D25: crew chatter', () => {
  it('up to three members talk: the topic, a reply that names the first, an aside; in their quirk', () => {
    const r = crew3(evening1());
    const t = chatter(blk(r), r.seed);
    expect(t.lines).toHaveLength(3);
    expect(t.lines.map((l) => l.topic).slice(1)).toEqual(['reply', 'aside']);
    for (const l of t.lines) expect(l.text.length).toBeGreaterThan(2);
    expect(new Set(t.lines.map((l) => l.id)).size).toBe(3);
    expect(t.lines.every((l) => l.rotom === null)).toBe(true);
  });
  it('one member: one line; nobody present (all out): no lines', () => {
    const r = evening1();
    expect(chatter(blk(r), r.seed).lines).toHaveLength(1);
    const out = edit(r, (b) => { for (const m of b.members) m.crew!.out = { why: 'hurt', days: 2 }; });
    expect(chatter(blk(out), out.seed).lines).toHaveLength(0);
  });
  it('same state and seed = same lines; another seed may differ; the block is never changed', () => {
    const r = crew3(evening1());
    const before = JSON.stringify(blk(r));
    expect(chatter(blk(r), r.seed)).toEqual(chatter(blk(r), r.seed));
    voicesModel(blk(r), r.seed, {});
    expect(JSON.stringify(blk(r))).toBe(before);
  });
  it('topics: a bad night, a good night, the Hero, high Heat and memories come up', () => {
    const r = evening1();
    expect(topicsOf(blk(r)).at(-1)).toBe('quiet');
    const hot = edit(r, (b) => {
      b.members[0]!.crew!.last = 'caught';
      b.heat = 80;
      Object.assign(heroOf(b), { met: true });
      b.members[0]!.crew!.memory.push({ day: 1, line: 'The night the cell door shut.' });
      b.day = 3;
    });
    expect(topicsOf(blk(hot))).toEqual(['loss', 'hero', 'heat', 'memory', 'quiet']);
    const won = edit(r, (b) => { b.members[0]!.crew!.last = 'big'; });
    expect(topicsOf(blk(won))[0]).toBe('win');
  });
});

describe('DOMINION D25: traitors', () => {
  const gone = (r: RunState, why: string, ago = 0): RunState => edit(r, (b) => { b.day = 5; b.crew!.gone.push({ id: 'm-mick', name: 'MICK', day: 5 - ago, why }); });
  it('a member who quit, stole, walked out with a Pokémon or joined a rival gets a parting line and the crew talks about it', () => {
    for (const why of ['quit', 'stole', 'stripped', 'poached']) {
      const r = gone(evening1(), why);
      const t = traitorLine(blk(r), r.seed)!;
      expect(t.name).toBe('Mick');
      expect(t.text.length).toBeGreaterThan(5);
      expect(topicsOf(blk(r))[0]).toBe('gone');
      expect(chatter(blk(r), r.seed).lines[0]!.text).toMatch(/Mick|Someone|\.\.\./);
    }
  });
  it('dismissed or given away is not a betrayal; the line fades after goneDays', () => {
    expect(traitorLine(blk(gone(evening1(), 'dismissed')), 'dv')).toBeNull();
    expect(traitorLine(blk(gone(evening1(), 'quit', VOICES.chatter.goneDays - 1)), 'dv')).not.toBeNull();
    expect(traitorLine(blk(gone(evening1(), 'quit', VOICES.chatter.goneDays)), 'dv')).toBeNull();
  });
});

describe('DOMINION D25: the Hero calls', () => {
  it('no call before the Hero notices the Boss; a taunt at FOILS; none once they joined', () => {
    const r = evening1();
    expect(heroCall(blk(r), r.seed)).toBeNull();
    const foils = edit(r, (b) => { heroOf(b).threat = 25; });
    const c = heroCall(blk(foils), foils.seed)!;
    // The Boss plays Red, so Blue is the Hero (D11, Q5).
    expect(VOICES.hero.taunt.foils.some((l) => new RegExp(`^${l.replace(/[.?]/g, '\\$&').replace(/\{ace\}/g, '[A-Z][\\w ]+')}$`).test(c.text))).toBe(true);
    expect(c.text).not.toContain('{');
    expect(c.hero).toBe('Blue');
    expect(c.head).toBe('Incoming · Blue');
    const joined = edit(foils, (b) => { heroOf(b).stand = { state: 'done', day: 1, lost: 0, outcome: 'joined' }; });
    expect(heroCall(blk(joined), joined.seed)).toBeNull();
  });
  it('Disillusion is hinted by the words used (bands), never shown as a number', () => {
    const at = (disill: number) => {
      const r = edit(evening1(), (b) => { b.day = 3; Object.assign(heroOf(b), { met: true, disill }); });
      return heroCall(blk(r), r.seed)!;
    };
    expect(VOICES.hero.disillusion.low).toContain(at(0).hint);
    expect(VOICES.hero.disillusion.mid).toContain(at(VOICES.hero.bands.mid).hint);
    expect(VOICES.hero.disillusion.high).toContain(at(VOICES.hero.bands.high).hint);
    const html = voicesView(voicesModel(blk(edit(evening1(), (b) => { b.day = 3; Object.assign(heroOf(b), { met: true, disill: 47 }); })), 'dv'));
    expect(html).not.toContain('47');
    expect(html).not.toMatch(/Disillusion/i);
  });
});

describe('DOMINION D25: the weekly Ledger news', () => {
  it('collects police, rival, Hero and Legendary lines and prints the paper on day 7, then clears the week', () => {
    const b = withCrew(structuredClone(blk(evening1())));
    b.day = 6;
    newsEnd(b, 'dv', { police: ['Officers swept Celadon.'], rivals: ['Team Rocket paid cash at three shops.'], crew: ['ignored'] });
    expect(voicesOf(b).week.map((e) => e.k)).toEqual(['police', 'rivals']);
    expect(voicesOf(b).papers).toHaveLength(0);
    b.day = 7;
    newsEnd(b, 'dv', { hero: ['Red won a badge in Pewter.'], police: ['A patrol stopped two Grunts.'] });
    const p = voicesOf(b).papers[0]!;
    expect(p.w).toBe(1);
    expect(p.items[0]!.k).toBe('police');
    expect(p.items[0]!.body).toEqual(['Officers swept Celadon.', 'A patrol stopped two Grunts.']);
    expect(p.items[1]!.k).toBe('hero');
    expect(voicesOf(b).week).toEqual([]);
    expect(DominionBlockSchema.parse(b).voices!.papers).toHaveLength(1);
  });
  it('a quiet week still prints; only the last few papers are kept', () => {
    const b = withCrew(structuredClone(blk(evening1())));
    for (let w = 1; w <= VOICES.news.keep + 2; w += 1) { b.day = w * 7; newsEnd(b, 'dv', {}); }
    expect(voicesOf(b).papers).toHaveLength(VOICES.news.keep);
    expect(voicesOf(b).papers[0]!.w).toBe(3);
    expect(voicesOf(b).papers.at(-1)!.items[0]!.k).toBe('quiet');
  });
  it('a traitor leaving makes the crew column', () => {
    const b = withCrew(structuredClone(blk(evening1())));
    b.day = 7;
    b.crew!.gone.push({ id: 'x', name: 'MICK', day: 7, why: 'stole' });
    newsEnd(b, 'dv', {});
    expect(voicesOf(b).papers[0]!.items[0]).toMatchObject({ k: 'crew', body: ['Mick left the crew with a pocket full of its money.'] });
  });
  it('same week and seed = same paper', () => {
    const b = withCrew(structuredClone(blk(evening1())));
    const week = [{ k: 'police' as const, d: 3, l: 'x' }];
    expect(printPaper(b, 's', 2, week)).toEqual(printPaper(b, 's', 2, week));
  });
  it('playing a week prints the paper through the World Turn, and the HQ says it is out', () => {
    let r = evening1();
    for (let i = 0; i < 6; i += 1) r = toEvening(night(r));
    expect(blk(r).day).toBe(7);
    const b = blk(r);
    expect(b.voices!.papers).toHaveLength(1);
    expect(b.voices!.papers[0]!.w).toBe(1);
    expect(paperNote(b)).toContain('The Kanto Ledger');
    const m = voicesModel(b, r.seed, {});
    expect(m.paper!.masthead).toBe('The Kanto Ledger');
    // Save and reload: the paper stays.
    expect(DominionBlockSchema.parse(JSON.parse(JSON.stringify(b))).voices).toEqual(b.voices);
  }, 60_000);
});

describe('DOMINION D25: Rotom on top', () => {
  it('stored answers show as ✦ lines; off or waiting answers do not; the written line stays', () => {
    const r = crew3(evening1());
    const t = chatter(blk(r), r.seed);
    const log = { [t.lines[0]!.id]: { s: 'ai' as const, v: 'Rotom says hi.', m: 'haiku' as const }, [t.lines[1]!.id]: { s: 'off' as const }, [t.lines[2]!.id]: { s: 'wait' as const } };
    const m = voicesModel(blk(r), r.seed, log);
    expect(m.chatter[0]!.rotom).toBe('Rotom says hi.');
    expect(m.chatter[0]!.text).toBe(t.lines[0]!.text);
    expect(m.chatter[1]!.rotom).toBeNull();
    expect(m.chatter[2]!.rotom).toBeNull();
    expect(m.rotomLines).toBe(1);
    expect(m.chip).toBe(VOICES.rotom.chip);
    expect(voicesView(m)).toContain('✦ Rotom says hi.');
    expect(rotomText(log, 'missing')).toBeNull();
  });
  it('builds a call for each line not answered yet, with the character sheet; none once all are stored', () => {
    let r = crew3(evening1());
    r = edit(r, (b) => { heroOf(b).threat = 30; b.voices = { week: [], papers: [printPaper(b, r.seed, 1, [])] }; });
    const asks = rotomAsks(blk(r), r.seed, {});
    expect(asks.map((a) => a.id.split(':')[0])).toEqual(['chatter', 'chatter', 'chatter', 'hero', 'news']);
    expect(asks[0]!.system).toContain('Traits:');
    expect(asks.at(-1)!.use).toBe('news');
    const log = Object.fromEntries(asks.map((a) => [a.id, { s: 'off' as const }]));
    expect(rotomAsks(blk(r), r.seed, log)).toEqual([]);
  });
  it("the member's card shows their newest stored Rotom chatter line", () => {
    const r = crew3(evening1());
    const id = blk(r).members[0]!.id;
    const log = { [`chatter:d1:${id}`]: { s: 'ai' as const, v: 'old' }, [`chatter:d4:${id}`]: { s: 'ai' as const, v: 'new' } };
    expect(lastRotomFor(log, id)).toEqual({ text: 'new', meta: '✦ Rotom · crew talk, Day 4' });
    expect(personaModel(blk(r), 0, r.seed, log).rotom!.text).toBe('new');
    expect(personaModel(blk(r), 0, r.seed).rotom).toBeNull();
  });
});

describe('DOMINION D25: saves', () => {
  it('a block without voices loads (older saves); a damaged paper is refused', () => {
    const b = structuredClone(blk(evening1()));
    delete b.voices;
    expect(DominionBlockSchema.safeParse(b).success).toBe(true);
    const bad = { ...b, voices: { week: [], papers: [{ w: 0, day: 7, items: [], photo: null }] } };
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
  });
});
