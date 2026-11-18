// Evil Mode slice 5 ("the Hero walks"): the Hero made by the rival system's parts, the home street, the reason from the
// Log's first loud entry, the road by personality, Hold and Outplay-in-person as real battles, and the File.
// Part 31's proofs: the party's read from the rival record, not copied; the road's a pure function of the Log and the map;
// a lost battle costs a holding and never the run; their loss never removes them; the File shows blanks.
import { describe, expect, it } from 'vitest';
import { cardFor } from '../../src/core/evilMode/card';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { BEAT_END, step, type EvilAction } from '../../src/core/evilMode/day';
import { beginEvilFight, heroParty, kitFor, kitSpecies } from '../../src/core/evilMode/fight';
import { endEvilFight, heroRival } from '../../src/core/evilMode/fightEnd';
import { heroField, heroReason, holdResult, likelyRoad, makeHero, stepsOn, walkHero } from '../../src/core/evilMode/hero';
import { fileModel } from '../../src/core/evilMode/heroScreens';
import { EVIL_MODE_ID, ensureEvil, foundInRun, stepInRun } from '../../src/core/evilMode/session';
import { EvilModeBlockSchema, type EvilModeBlock, type Holding } from '../../src/core/evilMode/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun, healParty, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const choice = { name: 'Kettle', creed: 'profit', line: 'whatever' as const, doctrine: 'swarm' };
const evilRun = (seed = 'h1'): RunState => {
  const r = foundInRun(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0), choice, 'three', 2);
  if (r.problem) throw new Error(r.problem);
  return r.run;
};
const B = (r: RunState): EvilModeBlock => r.expansion!.evilMode!;
const go = (r: RunState, a: EvilAction): RunState => {
  const out = stepInRun(r, a);
  if (!out.ok) throw new Error(JSON.stringify(out.cues));
  return out.run;
};
const setBlock = (r: RunState, f: (b: EvilModeBlock) => EvilModeBlock): RunState => ({ ...r, expansion: { ...r.expansion, evilMode: f(B(r)) } });
const setHoldings = (b: EvilModeBlock, f: (h: Holding) => Holding): EvilModeBlock => ({ ...b, district: { ...b.district!, holdings: b.district!.holdings.map(f) } });
const ours = (h: Holding, holds: boolean): Holding => ({ ...h, owner: 'team', method: holds ? 'persuade' : 'pay', since: 1, holds });
/** To the Hero's beat of the same day. */
const toHeroBeat = (r: RunState): RunState => {
  while (B(r).here.beat !== 'hero') r = go(r, { type: BEAT_END[B(r).here.beat] });
  return r;
};
const species = (id: string) => content.species.get(id)?.name ?? id;

describe('the Hero is made (Part 18 section 2)', () => {
  it('at founding, from the run\'s seed: the same seed, the same Hero; another seed, often another', () => {
    const a = B(evilRun('h1')).hero!;
    expect(a).toEqual(B(evilRun('h1')).hero);
    const names = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((s) => `${B(evilRun(s)).hero!.name}/${B(evilRun(s)).hero!.personality}`));
    expect(names.size).toBeGreaterThan(1);
  });
  it('a record in the rival system, never retired; the block holds no party', () => {
    const r = evilRun();
    const rival = heroRival(r, B(r))!;
    expect(rival.id).toBe(EVIL_DATA.hero.rivalId);
    expect(rival.state).not.toBe('retired');
    expect(rival.memory!.lastBattle.team).toHaveLength(2);
    expect(Object.keys(B(r).hero!)).not.toContain('team');
    expect(JSON.stringify(B(r).hero)).not.toContain(rival.memory!.lastBattle.team[0]!);
  });
  it('a starter from one of three regions, never the Boss\'s own; a Route 1 opener from home', () => {
    for (const seed of ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']) {
      const d = B(evilRun(seed)).district!;
      const made = makeHero(seed, d, 'bulbasaur');
      expect(made.team[0]).not.toBe('bulbasaur');
      expect(EVIL_DATA.hero.openers.Kanto).toContain(made.team[1]);
      expect(content.species.has(made.team[0]!)).toBe(true);
    }
  });
  it('their home is the Town\'s street, and they set out from the Town', () => {
    const b = B(evilRun());
    const town = b.district!.holdings.find((h) => h.kind === 'town')!;
    expect(b.hero!.at).toBe(town.step);
    expect(b.hero!.home.holdings).toHaveLength(EVIL_DATA.district.rules.townStreet);
  });
  it('making the Hero draws from no gameplay stream', () => {
    const base = chooseStarter(content, createRun(content, { runId: 'g', seed: 'g', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: EVIL_MODE_ID } }), 0);
    const r = foundInRun(base, choice, 'three', 2).run;
    expect(r.rng).toEqual(base.rng);
    expect(B(r).draws).toEqual(Object.fromEntries(Object.keys(B(r).draws).map((k) => [k, k === 'evil-people' ? B(r).draws['evil-people'] : 0])));
  });
});

describe('the party is read from the rival record, not copied', () => {
  it('a change in the record is what the next fight fields; the File reads the record too', () => {
    let r = evilRun();
    const before = heroParty(content, r, B(r)).map((x) => x.species);
    const rival = heroRival(r, B(r))!;
    rival.memory!.lastBattle.team = ['pikachu', ...rival.memory!.lastBattle.team];
    r = setBlock(r, (b) => ({ ...b, hero: { ...b.hero!, seen: ['pikachu'] } }));
    expect(heroParty(content, r, B(r)).map((x) => x.species)).toEqual(['pikachu', ...before].slice(0, 3));
    const f = fileModel(B(r), 1, rival.memory!.lastBattle.team, species)!;
    expect(f.slots![0]).toMatchObject({ species: 'pikachu', name: 'Pikachu' });
  });
  it('the tier sets the size and level: tier 0 is three at A-2', () => {
    const r = evilRun();
    const p = heroParty(content, r, B(r));
    expect(p.length).toBeLessThanOrEqual(3);
    expect(new Set(p.map((x) => x.level)).size).toBe(1);
  });
});

describe('the road (Part 18 section 7.2): a pure function of the Log and the map', () => {
  it('the same block walks the same road; steps by personality', () => {
    const r = toHeroBeat(evilRun());
    const b = B(r);
    expect(walkHero(b)).toEqual(walkHero(b));
    const w = walkHero(b);
    expect(w.hero!.at).toBe(Math.min(20, b.hero!.at + stepsOn(b.hero!, 1)));
    expect(w.hero!.walked).toBe(1);
    expect(walkHero(w)).toBe(w);
    expect(likelyRoad(b)).toEqual(Array.from({ length: stepsOn(b.hero!, 1) }, (_, i) => b.hero!.at + i + 1).filter((s) => s <= 20));
  });
  it('every personality\'s steps are 1 to 3, and Strategist alternates', () => {
    const b = B(evilRun()).hero!;
    for (const p of EVIL_DATA.hero.personalities) for (const d of [1, 2, 3]) expect([1, 2, 3]).toContain(stepsOn({ ...b, personality: p.id }, d));
    expect([1, 2].map((d) => stepsOn({ ...b, personality: 'strategist' }, d))).toEqual([1, 3]);
  });
  it('a holding that would turn, turns as they pass; one that holds is a wave; the map decides, no roll', () => {
    const r = toHeroBeat(evilRun());
    const at = B(r).hero!.at;
    const next = (b: EvilModeBlock) => b.district!.holdings.find((h) => h.step === at + 1)!;
    const turning = setHoldings(B(r), (h) => (h.step === at + 1 ? ours(h, false) : h));
    const w1 = walkHero({ ...turning, hero: { ...turning.hero!, personality: 'protector' } });
    expect(next(w1).owner).toBe('nobody');
    expect(w1.log.at(-1)!.kind).toBe('hero');
    const holding = setHoldings(B(r), (h) => (h.step === at + 1 ? ours(h, true) : h));
    const w2 = walkHero({ ...holding, hero: { ...holding.hero!, personality: 'protector' } });
    expect(next(w2).owner).toBe('team');
    expect(w2.draws).toEqual(holding.draws);
  });
  it('the Gym: they take the Badge, and the district is theirs', () => {
    const r = toHeroBeat(evilRun());
    const b = { ...B(r), hero: { ...B(r).hero!, at: 19, personality: 'champion-chaser' as const } };
    const w = walkHero(b);
    expect(w.district!.end?.how).toBe('taken');
    expect(w.hero!.badges).toHaveLength(1);
  });
  it('a day after a loss to a Grunt they rest; watchRoad walks them once a day', () => {
    let r = toHeroBeat(evilRun());
    r = setBlock(r, (b) => ({ ...b, hero: { ...b.hero!, restOn: b.here.day } }));
    const at = B(r).hero!.at;
    r = go(r, { type: 'watchRoad' });
    expect(B(r).hero!.at).toBe(at);
    expect(B(r).here.beat).toBe('morning');
  });
});

describe('the reason (Part 18 section 4): the Log\'s first loud entry', () => {
  const withEntry = (b: EvilModeBlock, to: string): EvilModeBlock => ({ ...b, log: [...b.log, { id: `L${b.log.length + 1}`, day: 1, region: 0, district: 1, kind: 'job', who: [], to, method: 'outplay', result: 'went', text: 'Day 1. It went.' }] });
  it('blank while nothing loud has happened; a loud job on their street is reason 2; elsewhere reason 7', () => {
    const b = B(evilRun());
    expect(heroReason(b)).toBeNull();
    const street = b.hero!.home.holdings[0]!;
    const off = b.district!.holdings.find((h) => h.kind === 'local' && !b.hero!.home.holdings.includes(h.id))!.id;
    expect(heroReason(withEntry(b, street))!.reason.n).toBe(2);
    expect(heroReason(withEntry(b, off))!.reason.n).toBe(7);
    expect(heroReason(withEntry(withEntry(b, off), street))!.reason.n).toBe(7);
  });
  it('a quiet district that\'s over gives reason 7', () => {
    const b = B(evilRun());
    expect(heroReason({ ...b, district: { ...b.district!, end: { how: 'taken', day: 7, count: 0 } } })!.reason.n).toBe(7);
  });
  it('sixteen reasons, each with a status; the unbuilt ones disabled', () => {
    expect(EVIL_DATA.hero.reasons.map((r) => r.n)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    expect(EVIL_DATA.hero.reasons.filter((r) => r.status !== 'disabled').map((r) => r.n)).toEqual([2, 7]);
  });
});

describe('the home street (Part 18 section 3): the Card says whose street it is', () => {
  it('field 10 on their street, and off it', () => {
    let b = B(evilRun());
    b = setHoldings(b, (h) => ({ ...h, scouted: 2 }));
    const street = b.district!.holdings.find((h) => h.id === b.hero!.home.holdings[0])!;
    expect(heroField(b, street)).toMatch(/This is their street/);
    const crew = b.crew.filter((c) => !c.minor).slice(0, 2).map((c) => c.id);
    expect(cardFor(b, { holdingId: street.id, method: 'persuade', squad: crew }).fields[9]!.text).toMatch(/their street/);
    const off = b.district!.holdings.find((h) => h.kind === 'local' && !b.hero!.home.holdings.includes(h.id))!;
    expect(heroField(b, off)).toMatch(/Not their street/);
  });
});

/** A run at Dispatch with step (Hero + 1) yours, `holds`, and somebody posted there. */
function posted(holds: boolean): RunState {
  let r = go(evilRun(), { type: 'dismissOvernight' });
  const at = B(r).hero!.at;
  r = setBlock(r, (b) => ({ ...setHoldings(b, (h) => (h.step === at + 1 ? ours(h, holds) : h)), hero: { ...b.hero!, personality: 'protector' } }));
  const target = B(r).district!.holdings.find((h) => h.step === at + 1)!;
  const who = B(r).crew.find((c) => !c.minor)!;
  return go(r, { type: 'post', holdingId: target.id, id: who.id });
}

describe('Hold: a real battle at beat 6 (Part 2 section 3.2)', () => {
  it('the walk stops at the person posted and waits on the fight; nothing else moves', () => {
    let r = posted(true);
    r = toHeroBeat(r);
    r = go(r, { type: 'watchRoad' });
    expect(B(r).fight).toMatchObject({ kind: 'hold', begun: false });
    expect(B(r).here.beat).toBe('hero');
    expect(stepInRun(r, { type: 'watchRoad' }).ok).toBe(false);
  });
  it('posting is refused for a minor, off a holding that is yours, and outside Dispatch', () => {
    const r = go(evilRun(), { type: 'dismissOvernight' });
    const minor = B(r).crew.find((c) => c.minor);
    const free = B(r).district!.holdings.find((h) => h.owner === 'nobody' && h.step > B(r).hero!.at)!;
    expect(stepInRun(r, { type: 'post', holdingId: free.id, id: B(r).crew[0]!.id }).ok).toBe(false);
    if (minor) {
      const mine = setBlock(r, (b) => setHoldings(b, (h) => (h.id === free.id ? ours(h, true) : h)));
      expect(stepInRun(mine, { type: 'post', holdingId: free.id, id: minor.id }).ok).toBe(false);
    }
    expect(stepInRun(evilRun(), { type: 'post', holdingId: free.id, id: B(r).crew[0]!.id }).ok).toBe(false);
  });
  it('the battle: the posted person\'s kit against the Hero\'s party; the Boss\'s party waits in the box', () => {
    let r = go(toHeroBeat(posted(true)), { type: 'watchRoad' });
    const party = r.party.map((m) => m.uid);
    const started = beginEvilFight(content, r)!;
    expect(started.phase).toBe('battle');
    expect(started.party.map((m) => m.speciesId)).toEqual(kitSpecies(content, kitFor(B(r), B(r).fight!.personId!)));
    expect(started.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(heroParty(content, r, B(r)).map((x) => x.species));
    expect(started.box.map((m) => m.uid)).toEqual(expect.arrayContaining(party));
    r = started;
    // A lost battle costs the holding, never the run; the party's given back, healed.
    const target = B(r).fight!.holdingId;
    const lines = endEvilFight(content, r, false, healParty);
    expect(r.phase).toBe('map');
    expect(r.battle).toBeNull();
    expect(r.party.map((m) => m.uid)).toEqual(party);
    expect(B(r).district!.holdings.find((h) => h.id === target)!.owner).toBe('nobody');
    expect(B(r).fight).toBeNull();
    expect(lines.length).toBeGreaterThan(0);
  });
  it('a battle played through the engine to a loss ends in the map, never "over"', () => {
    let r = beginEvilFight(content, go(toHeroBeat(posted(true)), { type: 'watchRoad' }))!;
    r.party.forEach((m, i) => { m.hp = i === 0 ? 1 : 0; });
    for (let i = 0; i < 8 && r.phase === 'battle'; i++) {
      const res = takeTurn(content, r, { kind: 'move', index: 0 });
      r = res.run;
      if (res.evilFight) expect(res.defeated).toBe(false);
    }
    expect(r.phase).toBe('map');
    expect(B(r).fight).toBeNull();
  });
  it('won by the person posted: the Hero steps back and rests a day, two marks; they\'re never removed', () => {
    const r = go(toHeroBeat(posted(true)), { type: 'watchRoad' });
    const b = B(r);
    const h = b.district!.holdings.find((x) => x.id === b.fight!.holdingId)!;
    const out = holdResult(b, true, ['pidgey']).block;
    expect(out.hero).not.toBeNull();
    expect(out.hero!.at).toBe(h.step - 1);
    expect(out.hero!.restOn).toBe(b.here.day + 1);
    expect(out.hero!.marks).toBe(EVIL_DATA.hero.marks.lostToGrunt);
    expect(out.district!.holdings.find((x) => x.id === h.id)!.owner).toBe('team');
    expect(heroRival(r, out)!.state).not.toBe('retired');
    // Many losses: still on the road.
    let many = out;
    for (let i = 0; i < 12; i++) many = holdResult({ ...many, fight: b.fight }, true, []).block;
    expect(many.hero).not.toBeNull();
    expect(many.hero!.marks).toBe(EVIL_DATA.hero.marks.max);
  });
  it('the counter joins the record after the third battle with the team', () => {
    let r = go(toHeroBeat(posted(true)), { type: 'watchRoad' });
    r = setBlock(r, (b) => ({ ...b, hero: { ...b.hero!, battlesWithTeam: 2 } }));
    r = beginEvilFight(content, r)!;
    endEvilFight(content, r, true, healParty);
    expect(heroRival(r, B(r))!.memory!.lastBattle.team).toContain(EVIL_DATA.hero.counters.swarm);
  });
});

describe('Outplay in person (Part 7 section 5.3): played, not rolled', () => {
  const queued = (): RunState => {
    let r = go(evilRun(), { type: 'dismissOvernight' });
    const h = B(r).district!.holdings.find((x) => x.kind === 'local')!;
    const squad = B(r).crew.filter((c) => !c.minor && c.line === null).slice(0, 2).map((c) => c.id);
    const squad2 = squad.length === 2 ? squad : B(r).crew.filter((c) => !c.minor).slice(0, 2).map((c) => c.id);
    r = setBlock(r, (b) => ({ ...b, crew: b.crew.map((c) => ({ ...c, line: null })) }));
    r = go(r, { type: 'queueJob', job: { holdingId: h.id, method: 'outplay', squad: squad2 } });
    return go(r, { type: 'send' });
  };
  it('only at In person, only an Outplay, once a day', () => {
    const r = queued();
    const id = B(r).queue[0]!.holdingId;
    expect(stepInRun(go(evilRun(), { type: 'dismissOvernight' }), { type: 'goYourself', holdingId: id }).ok).toBe(false);
    const went = go(r, { type: 'goYourself', holdingId: id });
    expect(B(went).fight).toMatchObject({ kind: 'outplay', holdingId: id });
    expect(B(went).inPerson).toEqual({ day: 1, holdingId: id });
  });
  it('the Boss\'s own party against the local\'s; won, the Evening takes the holding without a roll', () => {
    let r = queued();
    const id = B(r).queue[0]!.holdingId;
    r = beginEvilFight(content, go(r, { type: 'goYourself', holdingId: id }))!;
    expect(r.battle!.enemyTeam.length).toBeGreaterThan(0);
    endEvilFight(content, r, true, healParty);
    expect(B(r).queue[0]!.played).toBe('won');
    const draws = B(r).draws['evil-dispatch'];
    r = go(r, { type: 'stayIn' });
    expect(B(r).district!.holdings.find((h) => h.id === id)!.owner).toBe('team');
    expect(B(r).draws['evil-dispatch']).toBe(draws);
    expect(B(r).sheets[0]!.played).toBe(true);
  });
  it('lost: nothing ends; the holding stays nobody\'s', () => {
    let r = queued();
    const id = B(r).queue[0]!.holdingId;
    r = beginEvilFight(content, go(r, { type: 'goYourself', holdingId: id }))!;
    endEvilFight(content, r, false, healParty);
    expect(r.phase).toBe('map');
    r = go(r, { type: 'stayIn' });
    expect(B(r).district!.holdings.find((h) => h.id === id)!.owner).toBe('nobody');
  });
});

describe('the File (Part 18 section 11): blanks for what isn\'t known', () => {
  it('a fresh Hero: personality, reason and every slot blank; the slice-12 lists start empty', () => {
    const r = evilRun();
    const team = heroRival(r, B(r))!.memory!.lastBattle.team;
    const report = fileModel(B(r), 0, team, species)!;
    expect(report.rows.find((x) => x.label === 'Personality')!.blank).toBe(true);
    expect(report.rows.find((x) => x.label === 'The reason')!.blank).toBe(true);
    const notebook = fileModel(B(r), 1, team, species)!;
    expect(notebook.slots!.every((s) => s.species === null && s.name === EVIL_DATA.hero.file.blank)).toBe(true);
    expect(notebook.badges!.every((b) => b.how === null)).toBe(true);
    const dossier = fileModel(B(r), 2, team, species)!;
    expect(dossier.lists.every((l) => l.lines.length === 0)).toBe(true);
  });
  it('a slot fills once a Grunt has seen it, with where it came from', () => {
    const r = evilRun();
    const team = heroRival(r, B(r))!.memory!.lastBattle.team;
    const b = { ...B(r), hero: { ...B(r).hero!, seen: [team[0]!], met: true } };
    const f = fileModel(b, 1, team, species)!;
    expect(f.slots![0]!.species).toBe(team[0]);
    expect(f.slots![0]!.line).toMatch(/The starter/);
    expect(f.slots![1]!.species).toBeNull();
    expect(fileModel(b, 0, team, species)!.rows.find((x) => x.label === 'Personality')!.blank).toBe(false);
  });
});

describe('saves', () => {
  it('v4 -> v5: no Hero until the session makes one; then save and reload the same', () => {
    const r = evilRun();
    const { hero: _h, fight: _f, posted: _p, inPerson: _i, ...rest } = B(r);
    const v4 = EvilModeBlockSchema.parse({ ...rest, v: 4 });
    expect(v4).toMatchObject({ v: 21, hero: null, fight: null, posted: [], inPerson: null });
    const old: RunState = { ...r, story: { ...r.story, rivals: [] }, expansion: { ...r.expansion, evilMode: v4 } };
    const made = ensureEvil(old);
    expect(B(made).hero).toEqual(B(r).hero);
    expect(ensureEvil(made)).toBe(made);
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(made);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') expect(loaded.data).toEqual(made);
  });
  it('a damaged Hero is refused, not silently dropped', () => {
    const b = B(evilRun());
    expect(EvilModeBlockSchema.safeParse({ ...b, hero: { ...b.hero!, at: 21 } }).success).toBe(false);
  });
  it('a battle in progress saves and reloads (it reopens as the game already does)', () => {
    const r = beginEvilFight(content, go(toHeroBeat(posted(true)), { type: 'watchRoad' }))!;
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status === 'ok' ? 'ok' : (loaded as { reason: string }).reason).toBe('ok');
    if (loaded.status === 'ok') expect(B(loaded.data).fight).toMatchObject({ begun: true });
  });
});

it('step itself: battleResult with no fight is refused', () => {
  expect(step(B(evilRun()), { type: 'battleResult', won: true }).ok).toBe(false);
});

it('every trainer class the battles draw is one the game knows (a save checks them)', () => {
  for (const c of Object.values(EVIL_DATA.hero.classes)) expect(content.trainers.has(c)).toBe(true);
});
