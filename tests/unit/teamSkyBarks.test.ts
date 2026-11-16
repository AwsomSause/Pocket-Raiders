// Row 9 follow-up: Team Sky run by the player (core/evil/teamSky.ts), barks and the Radio (core/evil/barks.ts),
// Hoenn pay, the double agent's Tip Them Off and the wrong orb's 40% notice.
import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { evilOf, evilStageStart } from '../../src/core/evil/teams';
import { missionChance, nextRankNeeds, SKY, skyAct, skyCaps, skyNodeTick, skyStageStart, teamSkyOf, doctrinePreview, doctrineMatchups } from '../../src/core/evil/teamSky';
import { BARKS, barkLine, barkPool } from '../../src/core/evil/barks';
import { content } from './helpers';

const set = (run: RunState, k: string, n = 1) => { run.story.flags[`ev:${k}`] = n; };
function base(seed = 'sky-1'): RunState {
  return chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
}
function founded(seed?: string): RunState {
  const run = base(seed);
  set(run, 'sky-founded');
  set(run, 'sky-base-tower');
  skyStageStart(content, run);
  return run;
}
function inTeam(team: string, where: string): RunState {
  const run = base(`bark-${team}`);
  while (!evilOf(run).teamId) evilStageStart(content, run);
  const s = evilOf(run);
  s.teamId = team;
  s.region = run.regionIndex;
  run.regionOrder[run.regionIndex] = where;
  set(run, `team-${team}-inside`);
  return run;
}

describe('Team Sky, run by the player', () => {
  it('stays off before the founding, then starts with the first three, funds and the default doctrine', () => {
    const run = base();
    skyStageStart(content, run);
    expect(teamSkyOf(run)).toBeNull();
    expect(skyAct(content, run, { kind: 'hire', id: 'x' })).toMatch(/not been founded/);
    const sky = founded();
    const s = teamSkyOf(sky)!;
    expect(s.grunts.map((g) => g.name)).toEqual(['Marlo', 'Dr. Tuff', 'Lowen']);
    expect(s.funds).toBe(SKY.startFunds);
    expect(s.doctrine.types).toEqual(SKY.defaultTypes);
    expect(s.candidates.length).toBeGreaterThanOrEqual(3);
    expect(s.candidates.length).toBeLessThanOrEqual(5);
    expect(s.missions.length).toBeGreaterThanOrEqual(3);
    expect(s.missions.length).toBeLessThanOrEqual(6);
    // The freed spy comes instead of Lowen.
    const spyRun = base('sky-spy');
    set(spyRun, 'hoenn-freed-spy');
    set(spyRun, 'sky-founded');
    skyStageStart(content, spyRun);
    expect(teamSkyOf(spyRun)!.grunts[2]!.name).toBe('The freed spy');
  });

  it('is deterministic for a seed and refreshes each stage', () => {
    const a = founded('sky-det');
    const b = founded('sky-det');
    expect(teamSkyOf(a)!.candidates).toEqual(teamSkyOf(b)!.candidates);
    const before = JSON.stringify(teamSkyOf(a)!.missions);
    skyStageStart(content, a);
    expect(JSON.stringify(teamSkyOf(a)!.missions)).not.toBe(before);
    expect(teamSkyOf(a)!.tick).toBe(1);
  });

  it('hires within the cap and the chest, and the interview is once per candidate', () => {
    const run = founded('sky-hire');
    const s = teamSkyOf(run)!;
    s.funds = 99999;
    const c = s.candidates[0]!;
    const first = skyAct(content, run, { kind: 'ask', id: c.id, q: 'why' });
    expect(first).toContain(c.name);
    expect(skyAct(content, run, { kind: 'ask', id: c.id, q: 'wont' })).toBe(first);
    expect(skyCaps(run, s).grunts).toBe(3); // Renown 0: three grunts
    expect(skyAct(content, run, { kind: 'hire', id: c.id })).toMatch(/No room/);
    skyAct(content, run, { kind: 'build', room: 'roost' });
    expect(skyCaps(run, s).grunts).toBe(7);
    expect(skyAct(content, run, { kind: 'hire', id: c.id })).toMatch(/scarf/);
    expect(s.grunts).toHaveLength(4);
  });

  it('shows the success chance with who moved it, sends a squad and brings a report back after the nodes', () => {
    const run = founded('sky-send');
    const s = teamSkyOf(run)!;
    const m = s.missions[0]!;
    const squad = s.grunts.filter((g) => !(g.flaw === 'old-loyalties' && m.against)).slice(0, 2);
    const ch = missionChance(s, m, squad, 'bold');
    expect(ch.parts.some((p) => p.who === squad[0]!.name || p.who === squad[1]!.name)).toBe(true);
    expect(ch.chance).toBeGreaterThanOrEqual(5);
    expect(ch.chance).toBeLessThanOrEqual(95);
    expect(missionChance(s, m, [], 'quiet').chance).toBe(0);
    expect(skyAct(content, run, { kind: 'send', mission: m.id, squad: squad.map((g) => g.id), how: 'bold' })).toMatch(/set out/);
    expect(s.away).toHaveLength(1);
    expect(skyAct(content, run, { kind: 'send', mission: s.missions[0]!.id, squad: [s.grunts[2]!.id], how: 'quiet' })).toMatch(/Every squad is out/);
    for (let i = 0; i < 3; i++) skyNodeTick(content, run);
    expect(s.away).toHaveLength(0);
    expect(s.reports).toHaveLength(1);
    expect(squad.every((g) => g.missions === 1)).toBe(true);
  });

  it('promotes only when ready, says what is missing, and a cracked grunt leaves a stage later', () => {
    const run = founded('sky-promo');
    const s = teamSkyOf(run)!;
    const g = s.grunts[0]!;
    expect(nextRankNeeds(run, s, g)).toBe('needs 2 more missions');
    expect(skyAct(content, run, { kind: 'promote', id: g.id })).toMatch(/needs 2 more/);
    g.missions = 2;
    expect(skyAct(content, run, { kind: 'promote', id: g.id })).toMatch(/Flyer/);
    expect(g.rank).toBe(1);
    const low = s.grunts[2]!;
    low.loyalty = 1;
    skyStageStart(content, run);
    expect(low.cracked).toBeGreaterThan(0);
    // Talking with the line their flaw wants mends it.
    const line = SKY.talk.works[low.flaw]!;
    expect(skyAct(content, run, { kind: 'talk', id: low.id, line })).toMatch(/Loyalty \+2/);
    expect(low.cracked).toBe(0);
    expect(skyAct(content, run, { kind: 'talk', id: low.id, line })).toMatch(/this stage/);
    low.loyalty = 1;
    skyStageStart(content, run);
    skyStageStart(content, run);
    expect(s.grunts.some((x) => x.id === low.id)).toBe(false);
  });

  it('sets the doctrine (free first, then it costs), previews real species and rates matchups', () => {
    const run = founded('sky-doc');
    const s = teamSkyOf(run)!;
    expect(skyAct(content, run, { kind: 'types', types: ['fire', 'water'] })).toMatch(/three/);
    expect(skyAct(content, run, { kind: 'types', types: ['water', 'grass', 'ground'] })).toMatch(/set\./);
    expect(doctrinePreview(content, s).every((r) => r.length > 0)).toBe(true);
    expect(doctrineMatchups(content, s).magma).toBe('strong');
    s.funds = 0;
    expect(skyAct(content, run, { kind: 'arch', arch: 'flock' })).toMatch(/costs ₽2000/);
    s.funds = 5000;
    expect(skyAct(content, run, { kind: 'arch', arch: 'flock' })).toMatch(/₽2000/);
    expect(s.funds).toBe(3000);
  });

  it('keeps the line count for the Sky\'s Choice', () => {
    const run = founded('sky-line');
    expect(Number(run.story.flags['ev:sky-loyal-line'])).toBe(1); // Lowen comes at Loyalty 8
    for (const g of teamSkyOf(run)!.grunts) g.loyalty = 9;
    skyStageStart(content, run);
    expect(Number(run.story.flags['ev:sky-loyal-line'])).toBe(3);
    expect(content.events.get('sky-between')!.remembers.map((r) => r.id)).toEqual(['line-many', 'line-few', 'line-none']);
  });
});

describe('Barks and the Radio', () => {
  it('every bark line names a team that has an inside route', () => {
    for (const l of BARKS.lines) expect(['galactic', 'plasma']).toContain(l.team);
  });

  it('the squad speaks by Standing and Suspicion while inside, and nothing outside', () => {
    const run = inTeam('galactic', 'sinnoh');
    const pool = barkPool(content, run, 'rest');
    expect(pool).toContain(`Greer: "Don't ask me things."`);
    run.story.flags['ev:team-galactic-suspicion'] = 8;
    expect(barkPool(content, run, 'rest')).toContain(`Lior: "He knows. He's logging it as weather."`);
    delete run.story.flags['ev:team-galactic-inside'];
    expect(barkPool(content, run, 'rest')).toEqual([]);
  });

  it('the leader at your side speaks after a win only once the rank is earned; the same moment gives the same line', () => {
    const run = inTeam('plasma', 'unova');
    expect(barkLine(content, run, 'win', 'x')).toBeNull();
    set(run, 'plasma-n-confided');
    expect(barkLine(content, run, 'win', 'x')).toMatch(/^N: /);
    expect(barkLine(content, run, 'faint', 'y')).toBe(barkLine(content, run, 'faint', 'y'));
  });

  it("Hoenn's Radio tells of refused jobs done by somebody else", () => {
    const run = inTeam('magma', 'hoenn');
    set(run, 'hoenn-refused-ash-round');
    expect(barkPool(content, run, 'rest')).toContain('Radio: The Ash Round went ahead without you. Somebody else did it By the Book.');
  });
});

describe('Hoenn effects made real', () => {
  it('the uniform pays each stage by rank', () => {
    const run = inTeam('aqua', 'hoenn');
    const before = run.money;
    evilStageStart(content, run);
    expect(run.money - before).toBe(100);
  });

  it('a double agent gets Tip Them Off on Operations; the wrong orb is noticed 40% of the time', () => {
    const op = content.events.get('mg-op-ash-round')!;
    expect(op.remembers[0]!.addChoices?.[0]?.label).toMatch(/Tip Them Off/);
    const pyre = content.events.get('mg-act4')!;
    const wrong = pyre.choices.find((c) => c.label.startsWith('Take the wrong orb'))!;
    expect(wrong.label).toMatch(/40%/);
    expect(wrong.chance).toBeCloseTo(0.6);
  });
});

describe('HOENN_TEAMS 7: the screens say what to draw', () => {
  it('the Final Choice: the orb, four sayings, a ring of faces that react; Team Sky has the sky and its own team', async () => {
    const { evilLook } = await import('../../src/core/evil/screens');
    const run = inTeam('magma', 'hoenn');
    const look = evilLook(content, run, 'mg-final-choice')!;
    expect(look.kind).toBe('final');
    if (look.kind !== 'final') return;
    expect(look.centre).toBe('red');
    expect(look.says).toEqual(['"Wake it."', '"No."', '"Give it to them."', '"Neither of you."']);
    expect(look.faces.find((f) => f.name === 'Ottoway')!.react[0]).toBe('down'); // the bunkmate looks down at "Carry out the plan"
    expect(look.faces.find((f) => f.name === 'Quince')!.react[3]).toBe('lean');
    const sky = founded('sky-final');
    const s = evilLook(content, sky, 'sky-climax')!;
    expect(s.kind === 'final' && s.centre).toBe('sky');
    expect(s.kind === 'final' && s.faces[0]!.react[1]).toBe('away'); // Zinnia turns away at "Call it for us"
    expect(s.kind === 'final' && s.faces.length).toBe(4);
  });

  it('a Briefing lists every number under its column before you pick; the Result has a human line', async () => {
    const { evilLook, resultLook } = await import('../../src/core/evil/screens');
    const run = inTeam('magma', 'hoenn');
    const b = evilLook(content, run, 'mg-op-ash-round')!;
    expect(b.kind).toBe('briefing');
    if (b.kind !== 'briefing') return;
    expect(b.numbers[0]).toEqual(['Standing +3', 'Suspicion −1']);
    expect(b.numbers[1]).toContain('Noticed? 25%');
    expect(b.tip).toBeNull();
    set(run, 'hoenn-double-agent');
    const b2 = evilLook(content, run, 'mg-op-ash-round')!;
    expect(b2.kind === 'briefing' && b2.tip).toBe(3);
    expect(resultLook(content, 'mg-op-ash-round', 1, 'Quietly: sweep it for the glassblower.', ['Standing +2'], '')!.voice).toMatch(/glassblower/);
    expect(resultLook(content, 'sky-climax', 0, 'x', [], '')).toBeNull();
  });

  it("the Rank-Up reads the rank from the changes; the Leader's Table moves one pin", async () => {
    const { evilLook, rankUpLook } = await import('../../src/core/evil/screens');
    const run = inTeam('aqua', 'hoenn');
    const up = rankUpLook(content, run, ['Standing +6 (25/60)', 'you are Admin now (Rank 5)'])!;
    expect(up.rank).toBe(5);
    expect(up.byLeader).toBe(true);
    expect(up.unlocks).toHaveLength(3);
    expect(rankUpLook(content, run, ['Standing +1 (2/60)'])).toBeNull();
    expect(evilLook(content, run, 'aq-table')!.kind).toBe('table');
    const table = content.events.get('aq-table')!;
    expect(table.choices).toHaveLength(4);
    expect(table.choices[0]!.chance).toBeCloseTo(0.7);
  });

  it('the Radio can be muted', () => {
    const run = inTeam('magma', 'hoenn');
    expect(barkPool(content, run, 'rest').some((l) => l.startsWith('Radio:'))).toBe(true);
    set(run, 'hoenn-radio-muted');
    expect(barkPool(content, run, 'rest').some((l) => l.startsWith('Radio:'))).toBe(false);
  });
});
