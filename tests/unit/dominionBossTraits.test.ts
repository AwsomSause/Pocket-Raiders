// DOMINION R1 follow-up: Boss stats and traits, the Hall of Infamy and Boss title, and the sign's paper. Each rule is
// real: the traits move the run start, Debate and Edge XP; a finished run is kept on the profile; the Founding's news
// moves Dread and Regard in the HQ's district.
import { describe, expect, it } from 'vitest';
import { applyBossStart, bossStart, bossTitle, bossTraits, traitConviction, withLearn } from '../../src/core/dominion/bossTraits';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { startConviction } from '../../src/core/dominion/debate';
import { found, foundingPaper, newDraft } from '../../src/core/dominion/founding';
import { addToHall, hallEntry, titleOf } from '../../src/core/dominion/hall';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import { STAT_IDS, type DominionBlock } from '../../src/core/dominion/schema';
import { createProfile } from '../../src/core/profile';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { ProfileSchema, type DominionHallEntry, type RunState } from '../../src/core/state';
import { content } from './helpers';

const start = (archetypeId: string): { run: RunState; b: DominionBlock } => {
  const run = chooseStarter(content, createRun(content, { runId: `bt-${archetypeId}`, seed: 'bt', archetypeId, rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return { run: out.run, b: out.run.expansion!.dominion! };
};

describe('Boss stats and traits', () => {
  it('every Boss starts with 10 Edge points and two known traits; others use the default', () => {
    for (const id of ['red', 'blue', 'green', 'hilda', 'nate', 'someone-else']) {
      const s = bossStart(id);
      expect(STAT_IDS.reduce((n, k) => n + s.edge[k], 0)).toBe(10);
      expect(s.traits.length).toBeGreaterThan(0);
    }
    expect(bossStart('someone-else')).toEqual(bossStart(''));
    expect(bossStart('nate').traits.map((t) => t.name)).toEqual(['Silver Tongue', 'Old Grudge']);
  });
  it('a run starts with its Boss: Edge spread, traits, and the start-time traits applied', () => {
    const red = start('red').b, nate = start('nate').b, blue = start('blue').b, green = start('green').b;
    expect(nate.boss).toEqual({ id: 'nate', traits: ['silver-tongue', 'old-grudge'] });
    expect(nate.field.edge.stats).toEqual(bossStart('nate').edge);
    // Old Grudge: every rival team starts 5 Tension higher than Red's.
    for (const [id, t] of Object.entries(nate.rivals!.teams)) expect(t.tension).toBe(red.rivals!.teams[id]!.tension + 5);
    // Loud Mouth +5 Heat, Clean Record -5 (never below 0).
    expect(blue.heat).toBe(red.heat + 5);
    expect(green.heat).toBe(Math.max(0, red.heat - 5));
  });
  it('Silver Tongue: the Boss (not an Admin) starts a Debate 10 points up', () => {
    const red = start('red').b, nate = start('nate').b;
    const team = Object.keys(red.rivals!.teams)[0]!;
    nate.rivals!.teams[team]!.tension = red.rivals!.teams[team]!.tension;
    expect(traitConviction(nate)).toBe(10);
    expect(startConviction(nate, team)).toBe(startConviction(red, team) + 10);
    expect(startConviction(nate, team, 'admin')).toBe(startConviction(red, team, 'admin'));
  });
  it('a learn trait adds 1 XP to its stat only when that stat grows; a run without a Boss has no traits', () => {
    const red = start('red').b;
    expect(withLearn(red, 'stealth', 2)).toBe(3);
    expect(withLearn(red, 'brawn', 2)).toBe(2);
    expect(withLearn(red, 'stealth', 0)).toBe(0);
    const old = structuredClone(red);
    delete old.boss;
    expect(bossTraits(old)).toEqual([]);
    expect(withLearn(old, 'stealth', 2)).toBe(2);
  });
  it('applyBossStart keeps Heat and Tension inside 0-100', () => {
    const b = start('red').b;
    b.heat = 98;
    for (const t of Object.values(b.rivals!.teams)) t.tension = 99;
    applyBossStart(b, 'blue');
    expect(b.heat).toBe(100);
    applyBossStart(b, 'nate');
    for (const t of Object.values(b.rivals!.teams)) expect(t.tension).toBe(100);
  });
});

describe('Hall of Infamy and the Boss title', () => {
  it('a finished run is kept once, newest first, at most ten; the newest gives the title', () => {
    const { run, b } = start('nate');
    b.teamName = 'Team Venom';
    const e = hallEntry(run, b);
    expect(e).toMatchObject({ runId: run.runId, team: 'Team Venom', region: 'Kanto', boss: 'nate' });
    expect(e.crew[0]!.name).toBe(b.members[0]!.name);
    expect(e.ace?.speciesId).toBe(run.party[0]!.speciesId);
    let hall: DominionHallEntry[] = [];
    hall = addToHall(hall, e);
    expect(addToHall(hall, e)).toHaveLength(1);
    for (let i = 0; i < 12; i++) hall = addToHall(hall, { ...e, runId: `r${i}`, region: i === 11 ? 'Johto' : 'Kanto' });
    expect(hall).toHaveLength(10);
    expect(titleOf(hall)).toBe('Boss of Johto');
    expect(titleOf([])).toBeNull();
    expect(bossTitle('Kanto')).toBe('Boss of Kanto');
  });
  it('older profiles load with an empty Hall', () => {
    const fresh = createProfile(content, 'p') as Record<string, unknown>;
    expect(fresh.dominionHall).toEqual([]);
    delete fresh.dominionHall;
    expect(ProfileSchema.parse(fresh).dominionHall).toEqual([]);
  });
});

describe('the paper on the sign', () => {
  it('the Founding runs the story: Dread up and Regard down in the HQ district, shown on the clipping', () => {
    const { b } = start('red');
    b.stepsDone = ['earn-500', 'contact'];
    b.empire = { ...(b.empire ?? {}), peak: 1 } as DominionBlock['empire'];
    const hq = DOMINION_DATA.field.hq;
    const before = { ...b.field.districts[hq]! };
    const out = found(b, newDraft(b, null));
    expect(out.ok).toBe(true);
    const P = DOMINION_DATA.founding.paper;
    expect(out.block.field.districts[hq]!.dread).toBe(before.dread + P.dread);
    expect(out.block.field.districts[hq]!.regard).toBe(before.regard + P.regard);
    const clip = foundingPaper(out.block);
    expect(clip.masthead).toMatch(/Ledger · Day \d+/);
    expect(clip.headline).toBe(clip.headline.toUpperCase());
    expect(clip.headline).toContain(clip.district.toUpperCase());
    expect(clip.fx).toBe(`Dread +${P.dread} · Regard −${-P.regard}`);
  });
});
