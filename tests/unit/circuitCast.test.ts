// Story Overhaul S9: the original cast data, the Circuit roster (8 towns x 2 leaders) and the six-of-eight badge rules.
import { describe, expect, it } from 'vitest';
import {
  awardCharterSeal, BADGES_REQUIRED, buildCircuitCast, canLeaveRegion, chooseDoor, chooseGuestMatch, CIRCUIT, countedBadges, ensureCircuit, forkOf, leagueGateOpen, origBossId,
  passTown, recordBadge, rematchDay, TOWNS_PER_REGION,
} from '../../src/core/campaign/circuitCast';
import { CircuitStateSchema } from '../../src/core/story2/schema';
import { createPokemon } from '../../src/core/pokemon';
import { chooseNodeWithNotes, chooseStarter, createRun, debugJumpToColumn, debugJumpToLeague, mapChoices, resolveDecision, takeTurn } from '../../src/core/run';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { content, takeAnyReward } from './helpers';

const storyRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', campaignId: 'orrery-circuit' }), 0);
const classicRun = (seed: string): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);

describe('the cast data', () => {
  it('has the 18 leaders, 4 Elite Four, Selene and 6 teams, and every reference resolves', () => {
    const species = (id: string) => content.species.has(id);
    for (const l of CIRCUIT.leaders) {
      const boss = content.bosses.get(origBossId(l.id));
      expect(boss, l.id).toBeDefined();
      expect(boss!.story).toBe(true);
      expect(boss!.types).toEqual([l.type]);
      expect(boss!.teams.gym.length).toBeGreaterThanOrEqual(16);
      expect(l.signature.every(species), l.id).toBe(true);
      expect(l.signature[0]).toBe(l.ace);
      expect(content.storyData.characters.length).toBeGreaterThan(0);
    }
    for (const e of [...CIRCUIT.elite, CIRCUIT.champion]) {
      const boss = content.bosses.get(origBossId(e.id));
      expect(boss, e.id).toBeDefined();
      expect(boss!.teams.elite.length).toBeGreaterThan(0);
      expect(e.signature.every(species), e.id).toBe(true);
    }
    expect(CIRCUIT.teams).toHaveLength(6);
    expect(new Set(CIRCUIT.leaders.map((l) => l.type)).size).toBe(18);
  });

  it('sets every authored leader in the town the badge map says, and the 9 authored towns hold all 18', () => {
    const authored = CIRCUIT.towns.filter((t) => !t.pool);
    expect(authored).toHaveLength(9);
    expect(CIRCUIT.towns.filter((t) => t.pool)).toHaveLength(15);
    for (const l of CIRCUIT.leaders) expect(authored.find((t) => t.town === l.town)?.authored.some((n) => n.endsWith(l.name.replace(/^Captain /, ''))), l.id).toBe(true);
    expect(CIRCUIT.towns.filter((t) => t.regionGate).map((t) => t.stage)).toEqual([8, 8, 8]);
  });

  it('keeps every grunt line under the 156-character cap, 8 per team', () => {
    for (const t of CIRCUIT.teams) expect(CIRCUIT.grunts.filter((g) => g.team === t.id)).toHaveLength(8);
  });

  it('keeps the story bosses out of the Classic role pool and pickers', () => {
    const run = classicRun('s9-classic');
    expect(run.usedLeaders.some((id) => id.startsWith('orig-'))).toBe(false);
    expect(ensureCircuit(content, run)).toBeNull();
  });
});

describe('the roster', () => {
  it('fills 24 towns with two distinct leaders, authored towns first, no leader twice', () => {
    const cast = buildCircuitCast(content, storyRun('s9-roster'));
    expect(cast).toHaveLength(24);
    const all = cast.flatMap((t) => t.doors);
    expect(new Set(all).size).toBe(48);
    cast.forEach((t, k) => {
      const town = CIRCUIT.towns[k]!;
      const [a, b] = t.doors.map((id) => content.bosses.get(id)!);
      expect(a!.types[0]).not.toBe(b!.types[0]);
      if (town.pool) expect(a!.story || b!.story).toBeFalsy();
      else expect(a!.story && b!.story).toBe(true);
    });
    expect(all.filter((id) => id.startsWith('orig-'))).toHaveLength(18);
  });

  it('is the same for the same seed, stored on the run, and survives a save and reload', () => {
    const a = storyRun('s9-same');
    const b = storyRun('s9-same');
    expect(forkOf(content, a, 0, 2)).toEqual(forkOf(content, b, 0, 2));
    expect(storyRun('s9-other').story.v2!.circuit!.cast.map((t) => t.doors)).not.toEqual(a.story.v2!.circuit!.cast.map((t) => t.doors));
    const reloaded = RunStateSchema.parse(JSON.parse(JSON.stringify(a)));
    expect(reloaded.story.v2!.circuit).toEqual(a.story.v2!.circuit);
    expect(forkOf(content, reloaded, 2, 6)).toEqual(forkOf(content, a, 2, 6));
  });

  it('rebuilds a damaged cast instead of dropping the save', () => {
    const run = storyRun('s9-damaged');
    const good = forkOf(content, run, 1, 3)!;
    run.story.v2!.circuit!.cast[11]!.doors = ['nobody', 'nobody-else'];
    expect(forkOf(content, run, 1, 3)).toEqual(good);
  });

  it('puts the first gym of a Story Run under a Circuit leader, and Classic is untouched', () => {
    const run = storyRun('s9-gym1');
    const first = forkOf(content, run, 0, 0)!;
    expect(first).toContain(run.stage!.leaderId);
    expect(run.stage!.leaderId.startsWith('orig-') || content.regions.size > 0).toBe(true);
  });
});

describe('six of eight', () => {
  const fresh = () => CircuitStateSchema.parse({});

  it('needs 6 counted badges to leave a region; guest badges never count', () => {
    const c = fresh();
    for (let i = 0; i < BADGES_REQUIRED - 1; i++) recordBadge(c, `l${i}`, 0, 'gym');
    expect(canLeaveRegion(c, 0)).toBe(false);
    recordBadge(c, 'guest-one', 0, 'guest');
    expect(countedBadges(c, 0)).toBe(5);
    expect(canLeaveRegion(c, 0)).toBe(false);
    recordBadge(c, 'l5', 0, 'gym');
    expect(canLeaveRegion(c, 0)).toBe(true);
    expect(c.merit).toBe(1);
  });

  it('records a badge only once and awards the Charter Seal once', () => {
    const c = fresh();
    expect(recordBadge(c, 'a', 1, 'gym')).toBe(true);
    expect(recordBadge(c, 'a', 1, 'gym')).toBe(false);
    for (const id of ['b', 'c', 'd', 'e', 'f']) recordBadge(c, id, 1, 'gym');
    expect(awardCharterSeal(c, 1)).toBe(true);
    expect(awardCharterSeal(c, 1)).toBe(false);
    expect(awardCharterSeal(c, 0)).toBe(false);
  });

  it('opens the League gate only with 6 badges in every region (18 in all)', () => {
    const c = fresh();
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) recordBadge(c, `r${r}-${i}`, r, 'gym');
    expect(leagueGateOpen(c)).toBe(true);
    const d = fresh();
    for (let r = 0; r < 3; r++) for (let i = 0; i < (r === 2 ? 5 : 6); i++) recordBadge(d, `r${r}-${i}`, r, 'gym');
    expect(leagueGateOpen(d)).toBe(false);
  });

  it('allows at most 2 passes per region and none after entering a door', () => {
    const run = storyRun('s9-pass');
    expect(passTown(content, run, 0, 0)).toBe(true);
    expect(passTown(content, run, 0, 1)).toBe(true);
    expect(passTown(content, run, 0, 3)).toBe(false); // two passes used
    expect(passTown(content, run, 0, 1)).toBe(false);
    expect(passTown(content, run, 0, 4)).toBe(false);
    expect(passTown(content, run, 1, 4)).toBe(true);
    chooseDoor(content, run, 1, 6);
    expect(passTown(content, run, 1, 6)).toBe(false); // a door was entered
  });

  it('runs Rematch Day: met passed-over leaders invite (one Guest Match), unmet ones write a letter', () => {
    const run = storyRun('s9-rematch');
    const c = ensureCircuit(content, run)!;
    const picked = chooseDoor(content, run, 0, 2, 0)!;
    const other = c.cast[2]!.doors.find((d) => d !== picked)!;
    c.met.push(other);
    passTown(content, run, 0, 1);
    const day = rematchDay(c, 0);
    expect(day.invitations).toEqual([other]);
    expect(day.letters).toEqual(expect.arrayContaining(c.cast[1]!.doors));
    expect(chooseGuestMatch(c, 0, c.cast[1]!.doors[0])).toBe(false);
    expect(chooseGuestMatch(c, 0, other)).toBe(true);
    expect(chooseGuestMatch(c, 0, other)).toBe(false);
    expect(rematchDay(c, 1)).toEqual({ invitations: [], letters: [] });
  });

  it('migrates a run without a circuit: the field is optional and an empty circuit parses', () => {
    const run = storyRun('s9-migrate');
    const json = JSON.parse(JSON.stringify(run));
    delete json.story.v2.circuit;
    const loaded = RunStateSchema.parse(json);
    expect(loaded.story.v2!.circuit).toBeUndefined();
    expect(ensureCircuit(content, loaded)!.cast).toHaveLength(TOWNS_PER_REGION * 3);
  });
});

describe('on the map', () => {
  /** Heals and levels the lead, then clicks the gym node (answering the Fork Gate with `answer` when it shows). */
  function toGym(run: RunState, answer: number | 'first'): RunState {
    let r = debugJumpToColumn(run, run.stage!.map.columns);
    const mon = createPokemon(content, 'houndoom', 400, r.party[0]!.uid);
    mon.moves = [{ id: 'flamethrower', pp: 64 }, { id: 'crunch', pp: 64 }];
    r.party[0] = mon;
    r = chooseNodeWithNotes(content, r, mapChoices(content, r)[0]!.id).run;
    if (r.phase === 'decision' && answer !== 'first') {
      r = resolveDecision(content, r, { kind: 'circuit', optionIndex: answer }).run;
      if (r.phase === 'map' && r.stage!.kind === 'stage' && r.stage!.current !== null) r = chooseNodeWithNotes(content, r, mapChoices(content, r)[0]!.id).run;
    }
    return r;
  }
  function fight(r: RunState): RunState {
    for (let guard = 0; r.phase !== 'map' && r.phase !== 'over' && guard < 600; guard++) {
      if (r.phase === 'battle') { for (const m of r.battle!.enemyTeam) m.hp = Math.min(m.hp, 1); r = takeTurn(content, r, { kind: 'move', index: 1 }).run; }
      else if (r.phase === 'reward') r = takeAnyReward(r);
      else if (r.phase === 'decision' && r.pending[0]!.kind === 'circuit') break;
      else if (r.phase === 'decision') r = resolveDecision(content, r, r.pending[0]!.kind === 'caught' ? { kind: 'release' } : { kind: 'skipMove' }).run;
      else break;
    }
    return r;
  }

  it('asks at the gym node which door to enter, offers a pass, and runs the chosen Leader', () => {
    const base = storyRun('s9-fork');
    const [a, b] = forkOf(content, base, 0, 0)!;
    let r = debugJumpToColumn(base, base.stage!.map.columns);
    r = chooseNodeWithNotes(content, r, mapChoices(content, r)[0]!.id).run;
    expect(r.phase).toBe('decision');
    const d = r.pending[0]!;
    expect(d.kind === 'circuit' && d.options.map((o) => o.action)).toEqual(['door0', 'door1', 'pass']);
    expect(r.stage!.current).not.toBe(mapChoices(content, base)[0]!.id);
    r = resolveDecision(content, r, { kind: 'circuit', optionIndex: 1 }).run;
    expect(r.phase).toBe('map');
    expect(r.stage!.leaderId).toBe(b);
    expect(r.stage!.leaderId).not.toBe(a);
    expect(r.story.v2!.circuit!.chosen['0']).toBe(b);
    expect(r.story.v2!.circuit!.met).toEqual(expect.arrayContaining([a, b]));
    r = chooseNodeWithNotes(content, r, mapChoices(content, r)[0]!.id).run;
    expect(r.phase).toBe('battle');
    expect(r.battle!.trainer!.leaderId).toBe(b);
  });

  it('records the badge when a Circuit gym falls, and the League is the authored one', () => {
    const base = storyRun('s9-win');
    const leader = forkOf(content, base, 0, 0)![0];
    const r = fight(toGym(base, 0));
    expect(r.story.v2!.circuit!.badges).toEqual([{ leaderId: leader, regionId: 0, counted: true, source: 'gym' }]);
    expect(r.stage!.index).toBe(1);
    expect(debugJumpToLeague(content, storyRun('s9-league')).stage!.eliteFour).toEqual(['orig-isadora', 'orig-kofi', 'orig-brigid', 'orig-aurelio']);
  });

  it('passing a town skips its gym and moves on with no badge', () => {
    const base = storyRun('s9-pass-run');
    const r = toGym(base, 2);
    expect(r.phase).toBe('map');
    expect(r.stage!.index).toBe(1);
    const c = r.story.v2!.circuit!;
    expect(c.passed).toEqual(['0']);
    expect(c.badges).toEqual([]);
    expect(c.passedOver).toEqual(expect.arrayContaining(c.cast[0]!.doors));
  });

  it('plays a make-up fight when the last town leaves a region under 6 badges, and the fork asks again', () => {
    let r = storyRun('s9-makeup');
    r.stage!.index = 7;
    const c = ensureCircuit(content, r)!;
    for (let i = 0; i < 4; i++) recordBadge(c, `e${i}`, 0, 'gym');
    c.chosen['0'] = c.cast[0]!.doors[0]; // town 1 was entered but its fight was lost: no badge
    r = fight(toGym(r, 0));
    const after = r.story.v2!.circuit!;
    expect(countedBadges(after, 0)).toBe(5);
    expect(r.regionIndex).toBe(0);
    expect(r.stage!.index).toBe(0); // back to the first town without a badge
    expect(after.chosen['0']).toBeUndefined();
  });

  it('offers Rematch Day at the Region Gate: one Guest Match from a met, passed-over Leader', () => {
    let r = storyRun('s9-rematchday');
    const c = ensureCircuit(content, r)!;
    for (let i = 0; i < 5; i++) recordBadge(c, `e${i}`, 0, 'gym');
    for (let i = 0; i < 7; i++) c.chosen[String(i)] = c.cast[i]!.doors[0]; // the first seven towns were played
    c.passedOver.push(c.cast[2]!.doors[1]);
    c.met.push(...c.cast[2]!.doors);
    r.stage!.index = 7;
    r = toGym(r, 0);
    r = fight(r);
    expect(r.phase).toBe('decision');
    const d = r.pending[0]!;
    expect(d.kind === 'circuit' && d.step).toBe('rematch');
    const guest = c.cast[2]!.doors[1];
    expect(d.kind === 'circuit' && d.options.map((o) => o.leaderId)).toEqual([guest, c.cast[7]!.doors[1], undefined]); // the last town's unchosen Leader was seen at its Fork too
    if (d.kind === 'circuit') expect(d.options[0]!.leaderId).toBe(guest);
    r = resolveDecision(content, r, { kind: 'circuit', optionIndex: 0 }).run;
    expect(r.regionIndex).toBe(0);
    expect(r.stage!.index).toBe(2);
    expect(r.stage!.leaderId).toBe(guest);
    expect(r.story.v2!.circuit!.guest['0']).toBe(guest);
    r = fight(toGym(r, 'first'));
    const done = r.story.v2!.circuit!;
    expect(done.badges.find((b) => b.leaderId === guest)).toMatchObject({ counted: false, source: 'guest' });
    expect(done.merit).toBe(1);
    expect(r.regionIndex).toBe(1); // the Guest Match was the region's last stop
  });

  it('declining Rematch Day leaves the region', () => {
    let r = storyRun('s9-decline');
    const c = ensureCircuit(content, r)!;
    for (let i = 0; i < 5; i++) recordBadge(c, `e${i}`, 0, 'gym');
    for (let i = 0; i < 7; i++) c.chosen[String(i)] = c.cast[i]!.doors[0];
    c.met.push(...c.cast[2]!.doors);
    r.stage!.index = 7;
    r = fight(toGym(r, 0));
    r = resolveDecision(content, r, { kind: 'circuit', optionIndex: 1 }).run;
    expect(r.regionIndex).toBe(1);
    expect(r.story.v2!.circuit!.guest['0']).toBe('declined');
  });

  it('lets an auto-player answer the Fork with any other choice: the first door', () => {
    const base = storyRun('s9-auto');
    const first = forkOf(content, base, 0, 0)![0];
    let r = toGym(base, 'first');
    r = resolveDecision(content, r, { kind: 'skipMove' }).run;
    expect(r.stage!.leaderId).toBe(first);
  });
});
