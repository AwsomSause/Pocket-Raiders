// Evil Teams (spec §16) and Permanent Run Choices (spec §17).
import { describe, expect, it } from 'vitest';
import { BETRAYAL_FLAG, chooseEvent, conditionMet, continueEventChain, eligibleEvents } from '../../src/core/events';
import { chooseStarter, createRun, resolveDecision } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { evilBattle, evilOf, evilStageStart, evilSummary, evilTeam, villainLine } from '../../src/core/evil/teams';
import { choiceHistory, choiceMade, recordChoice } from '../../src/core/evil/choices';
import { evilEventId } from '../../src/core/evil/content';
import { freshEvil } from '../../src/core/evil/schema';
import { MemoryStorageProvider } from '../../src/save/storage';
import { SaveManager } from '../../src/save/saveManager';
import { content } from './helpers';

function newRun(seed = 'evil'): RunState {
  return chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
}

/** Stands the run on the first node with this event beside it. */
function atEvent(run: RunState, eventId: string, sideId = 'test-event'): RunState {
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: sideId, kind: 'event', used: false, eventId });
  return run;
}

/** A run whose team has been picked (as if `firstStage` stages had begun). */
function withTeam(seed = 'evil'): RunState {
  const run = newRun(seed);
  while (!evilOf(run).teamId) evilStageStart(content, run);
  return run;
}

const pickChoice = (run: RunState, eventId: string, label: string) => {
  const ev = content.events.get(eventId)!;
  const index = ev.choices.findIndex((c) => c.label === label);
  expect(index, `${eventId}: ${label}`).toBeGreaterThanOrEqual(0);
  return chooseEvent(content, atEvent(run, eventId), 'test-event', index);
};

describe('evil team data', () => {
  it('has at least ten distinct teams with a full hierarchy, rule, spoils and operations', () => {
    const teams = content.evilTeams.teams;
    expect(teams.length).toBeGreaterThanOrEqual(10);
    expect(new Set(teams.map((t) => t.style))).toEqual(new Set(['open', 'secret', 'front']));
    for (const t of teams) {
      for (const rank of ['grunt', 'specialist', 'executive', 'leader'] as const) expect(t.ranks[rank].species.length, `${t.id} ${rank}`).toBeGreaterThanOrEqual(4);
      expect(t.ops.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('expands every storyline beat and operation into a map event for every team', () => {
    for (const t of content.evilTeams.teams) {
      for (const id of ['suspicious', 'evidence', 'recognized', 'rising-star', 'nemesis', 'the-plan', 'hideout', 'ambush', 'legend']) expect(content.events.has(evilEventId(t.id, id)), `${t.id} ${id}`).toBe(true);
      for (const op of t.ops) expect(content.events.has(evilEventId(t.id, 'op', op.id)), `${t.id} ${op.id}`).toBe(true);
      expect(content.events.has(evilEventId(t.id, 'disguise'))).toBe(t.style !== 'open');
      const intro = content.events.get(evilEventId(t.id, 'rising-star'))!.intro;
      expect(intro).toContain(t.ranks.executive.name);
      // Catalog Overhaul SF13: only the words that are known when the scene plays ({starter}, {lead}) are left as tokens.
      expect(intro).not.toMatch(/\{(?!starter\}|lead\})\w+\}/);
    }
  });
});

describe('evil team progression', () => {
  it('picks the same team for the same seed, and none before the first beat stage', () => {
    const run = newRun('pick');
    expect(evilOf(run).stages).toBeLessThan(content.evilTeams.config.firstStage);
    expect(evilOf(run).teamId).toBeNull();
    expect(withTeam('pick').story.evil.teamId).toBe(withTeam('pick').story.evil.teamId);
  });

  it('runs one team per region: The Plan starts all four Operations, and the ones left behind when the region ends happen', () => {
    const run = withTeam('ops');
    const s = evilOf(run);
    const team = evilTeam(content, run)!;
    expect(s.region).toBe(run.regionIndex);
    expect(s.ops).toHaveLength(0);
    s.beat = 5;
    const planned = pickChoice(run, evilEventId(team.id, 'the-plan'), `Stop ${team.ops[0]!.name} first.`).run;
    const ps = evilOf(planned);
    expect(ps.ops.map((o) => o.outcome)).toEqual(['running', 'running', 'running', 'running']);
    expect(ps.planFirst).toBe(team.ops[0]!.id);
    planned.regionIndex += 1;
    evilStageStart(content, planned);
    // The team is archived with the region; its Operations happened, and their remembered flags stay for the run.
    expect(ps.past.map((p) => p.teamId)).toContain(team.id);
    for (const op of team.ops) expect(Number(planned.story.flags[`ev:team-op-done-${op.id}`] ?? 0)).toBe(1);
    expect(choiceHistory(planned).some((c) => c.pick === 'succeeded')).toBe(true);
    // A region's lasting effects end with the region.
    expect(ps.mods.every((m) => m.region === planned.regionIndex)).toBe(true);
  });

  it('opens the first beat only for the run team, and moves the story one beat per choice, paced by stages', () => {
    const run = withTeam('beats');
    const team = evilTeam(content, run)!;
    const open = eligibleEvents(content, run).map((e) => e.id);
    expect(open).toContain(evilEventId(team.id, 'suspicious'));
    expect(open.filter((id) => id.startsWith('evil-') && id.endsWith('-suspicious'))).toHaveLength(1);
    const after = pickChoice(run, evilEventId(team.id, 'suspicious'), 'Walk past.').run;
    expect(after.story.evil.beat).toBe(1);
    // SF13: one step per stage, so the next step waits for the next stage.
    expect(eligibleEvents(content, after).map((e) => e.id)).not.toContain(evilEventId(team.id, 'evidence'));
    evilStageStart(content, after);
    expect(eligibleEvents(content, after).map((e) => e.id)).toContain(evilEventId(team.id, 'evidence'));
  });

  it('stopping an Operation another way leaves nothing behind, once, and records the choice', () => {
    const run = withTeam('foil');
    const team = evilTeam(content, run)!;
    evilOf(run).beat = 5;
    const op = team.ops.find((o) => content.events.get(evilEventId(team.id, 'op', o.id))!.choices[1]!.requires.length === 0 && !content.events.get(evilEventId(team.id, 'op', o.id))!.choices[1]!.prompt && !content.events.get(evilEventId(team.id, 'op', o.id))!.choices[1]!.chance && !content.events.get(evilEventId(team.id, 'op', o.id))!.choices[1]!.success.battle) ?? team.ops[0]!;
    const planned = pickChoice(run, evilEventId(team.id, 'the-plan'), `Stop ${op.name} first.`).run;
    const before = planned.perkEffects?.length ?? 0;
    const event = content.events.get(evilEventId(team.id, 'op', op.id))!;
    const res = chooseEvent(content, atEvent(planned, event.id, 'op-event'), 'op-event', 1);
    if (res.success && !res.run.battle) {
      expect(evilOf(res.run).ops.find((o) => o.id === op.id)!.outcome).toBe('infiltrated');
      expect(res.run.perkEffects?.length ?? 0).toBe(before);
      expect(Number(res.run.story.flags[`ev:team-op-stopped-${op.id}`])).toBe(1);
      expect(choiceHistory(res.run).some((c) => c.pick === 'infiltrated')).toBe(true);
    }
  });

  it('letting an Operation happen leaves its lasting effect on the region', () => {
    const run = withTeam('leave');
    const team = evilTeam(content, run)!;
    evilOf(run).beat = 5;
    const def = team.ops[0]!;
    const planned = pickChoice(run, evilEventId(team.id, 'the-plan'), `Stop ${def.name} first.`).run;
    const op = content.events.get(evilEventId(team.id, 'op', def.id))!;
    const r = chooseEvent(content, atEvent(planned, op.id, 'op-event'), 'op-event', op.choices.findIndex((c) => c.label === 'Let it happen.')).run;
    expect(evilOf(r).ops.find((o) => o.id === def.id)!.outcome).toBe('succeeded');
    expect(def.lasting).toBeDefined();
    if (def.lasting!.effects.length) expect(r.perkEffects).toEqual(expect.arrayContaining(def.lasting!.effects));
    expect(Number(r.story.flags[`ev:team-op-done-${def.id}`])).toBe(1);
  });

  it('recurring villains remember meetings: their teams grow and their lines change', () => {
    const run = withTeam('villain');
    const team = evilTeam(content, run)!;
    const b = { kind: 'trainer', name: 'x', evil: 'executive', size: 3, levelBonus: 2, shadow: 0, types: [], chain: 1, win: [], ghost: false, retired: false, rival: false } as const;
    expect(villainLine(team, 'executive', undefined)).toBe(team.ranks.executive.lines.first);
    const first = evilBattle(content, run, { ...b, types: [], win: [] })!;
    expect(villainLine(team, 'executive', evilOf(run).villains.executive)).toBe(team.ranks.executive.lines.winning);
    const second = evilBattle(content, run, { ...b, types: [], win: [] })!;
    expect(second.levelBonus).toBeGreaterThan(first.levelBonus);
    expect(second.size).toBeGreaterThanOrEqual(first.size);
    expect(first.name).toBe(team.ranks.executive.name);
    evilOf(run).villains.executive = { met: 3, won: 2, lost: 1, last: 'won' };
    expect(villainLine(team, 'executive', evilOf(run).villains.executive)).toBe(team.ranks.executive.lines.respect);
  });

  it('heat adds levels and reinforcements', () => {
    const run = withTeam('heat');
    const b = { kind: 'trainer', name: 'x', evil: 'grunt', size: 2, levelBonus: 0, shadow: 0, types: [], chain: 1, win: [], ghost: false, retired: false, rival: false } as const;
    const calm = evilBattle(content, run, { ...b, types: [], win: [] })!;
    evilOf(run).heat = content.evilTeams.config.heatMax;
    const hot = evilBattle(content, run, { ...b, types: [], win: [] })!;
    expect(hot.levelBonus).toBeGreaterThan(calm.levelBonus);
    expect(hot.size).toBe(Math.min(6, calm.size + 1));
  });

  it('the Hideout entry steps into the team\'s own Hideout map, and the Operations still running happen at the door', () => {
    const run = withTeam('expose');
    const team = evilTeam(content, run)!;
    const s = evilOf(run);
    s.beat = 6;
    s.ops = team.ops.map((o) => ({ id: o.id, region: run.regionIndex, outcome: 'running' as const }));
    const r = pickChoice(run, evilEventId(team.id, 'hideout'), 'Go in.').run;
    expect(r.stage?.pseudo).toMatchObject({ id: `ps_evil_hideout_${team.id}`, chain: true });
    const rooms = r.stage!.map.nodes.map((n) => n.roomEvent);
    expect(rooms).toContain(`evil-${team.id}-hideout-boss`);
    expect(rooms).toContain(evilEventId(team.id, 'rescue'));
    expect(evilOf(r).ops.every((o) => o.outcome === 'succeeded')).toBe(true);
  });
});

describe('rescue missions and infighting', () => {
  it('the Holding Pen is a Hideout room: never drawn on the map, and opening it brings back what the team took', () => {
    const run = withTeam('rescue');
    const team = evilTeam(content, run)!;
    const pen = content.events.get(evilEventId(team.id, 'rescue'))!;
    expect(pen.room).toBe(true);
    expect(eligibleEvents(content, run).map((e) => e.id)).not.toContain(pen.id);
    const label = pen.choices[0]!.label;
    const r = pickChoice(run, pen.id, label).run;
    expect(Number(r.story.flags[`ev:team-${team.id}-pen-open`])).toBe(1);
  });

  it('siding with the specialist in a team feud wins an inside source (a defector for the hideout)', () => {
    const run = withTeam('feud');
    const team = evilTeam(content, run)!;
    evilOf(run).beat = 4;
    const feud = content.events.get(evilEventId(team.id, 'infighting'))!;
    const r = chooseEvent(content, atEvent(run, feud.id), 'test-event', 1).run;
    expect(r.story.evil.defector).toBe(true);
    expect(Number(r.story.flags[`ev:team-${team.id}-defector-colleague`])).toBe(1);
    // The boss's "Your people are leaving you" needs the defector and the lieutenant out of the way.
    const boss = content.events.get(`evil-${team.id}-hideout-boss`)!;
    const leaving = boss.choices[2]!;
    expect(leaving.requires.every((c) => conditionMet(content, r, c))).toBe(false);
    r.story.flags[`ev:team-${team.id}-lt-out`] = 1;
    expect(leaving.requires.every((c) => conditionMet(content, r, c))).toBe(true);
  });
});

describe('permanent choices', () => {
  it('keeps the first answer, and opens or closes follow-ups', () => {
    const run = newRun('choices');
    run.money = 5000;
    const r = pickChoice(run, 'stranded-trainer', 'Take their Poké Balls').run;
    expect(choiceMade(r, 'stranded-trainer', 'robbed')).toBe(true);
    const opens = (id: string) => content.events.get(id)!.requires.every((c) => conditionMet(content, r, c));
    expect(opens('stranded-trainer-revenge')).toBe(true);
    expect(opens('stranded-trainer-friend')).toBe(false);
    expect(recordChoice(content, r, { id: 'stranded-trainer', pick: 'helped', text: 'x', weight: 1 })).toBe('');
    expect(choiceMade(r, 'stranded-trainer', 'helped')).toBe(false);
  });

  it('a path choice changes the rest of the run (its modifiers stay) and is run-defining', () => {
    // Catalog Overhaul places (SF102): the fork is now three towns; the Gym road's relic stays for the run.
    const r = pickChoice(newRun('fork'), 'road-fork', 'The Gym town.').run;
    expect(r.story.flags['relic:road-gym']).toBe(true);
    expect(choiceHistory(r)[0]).toMatchObject({ id: 'road-fork', pick: 'gym', weight: 3 });
  });

  it('a rescued Pokémon can come back to join later', () => {
    const run = newRun('riolu');
    recordChoice(content, run, { id: 'ledge-riolu', pick: 'rescued', text: 'x', weight: 2 });
    run.story.flags['ev:riolu-seen-2'] = 1; // Catalog Overhaul (SF52): the Riolu comes back after you have seen it twice
    const r = pickChoice(run, 'ledge-riolu-return', 'Come with me.');
    expect(r.changes.join(' ')).toMatch(/wants to join you/);
  });
});

describe('run save v32', () => {
  it('a version 31 run loads with no Evil Team and no choice history', () => {
    const storage = new MemoryStorageProvider();
    const run = structuredClone(newRun('v28'));
    const { evil: _e, choices: _c, ...story } = run.story;
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 31, savedAt: '', data: { ...run, story } }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(31);
    expect(loaded.data.story.evil).toEqual(freshEvil());
    expect(loaded.data.story.choices).toEqual([]);
  });

  it('a version 27 run (before the day counter) also loads through both upgrades', () => {
    const storage = new MemoryStorageProvider();
    const run = structuredClone(newRun('v27'));
    const { evil: _e, choices: _c, ...story } = run.story;
    const { clock: _k, ...old } = run;
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 27, savedAt: '', data: { ...old, story } }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(27);
    expect(loaded.data.story.evil).toEqual(freshEvil());
  });

  it('a version 28 run (before Auto-Battle) loads too', () => {
    const storage = new MemoryStorageProvider();
    const run = structuredClone(newRun('v28'));
    const { evil: _e, choices: _c, ...story } = run.story;
    storage.set('pkr.run', JSON.stringify({ format: 'pkmn-roguelike', record: 'run', schemaVersion: 28, savedAt: '', data: { ...run, story } }));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') expect(loaded.data.story.choices).toEqual([]);
  });

  it('version 9 settings (before Auto-Battle) still load', () => {
    const storage = new MemoryStorageProvider();
    const manager = new SaveManager(storage, content);
    manager.saveSettings(manager.loadSettings());
    const env = JSON.parse(storage.get('pkr.settings')!);
    const { autoBattle: _a, autoExplain: _x, ...old } = env.data;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 9, savedAt: '', data: old }));
    const settings = new SaveManager(storage, content).loadSettings() as unknown as { autoBattle: boolean };
    expect(settings.autoBattle).toBe(false);
  });

  it('Evil Team progress and choices survive a save and reload unchanged', () => {
    const storage = new MemoryStorageProvider();
    const manager = new SaveManager(storage, content);
    const run = withTeam('reload');
    recordChoice(content, run, { id: 'road-fork', pick: 'coast', text: 'Took the coast road', weight: 3 });
    evilOf(run).heat = 4;
    manager.saveRun(run);
    const loaded = manager.loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.data.story.evil).toEqual(run.story.evil);
    expect(loaded.data.story.choices).toEqual(run.story.choices);
  });
});

describe('The Betrayal', () => {
  it('a pending Betrayal starts a wild Legendary battle straight away, once', () => {
    const run = withTeam('betrayal');
    const team = evilTeam(content, run)!;
    const species = team.legendary.find((id) => content.species.has(id))!;
    run.story.flags[BETRAYAL_FLAG] = `pending:${species}:30`;
    continueEventChain(content, run);
    expect(run.battle?.kind).toBe('wild');
    expect(run.battle?.enemyTeam[0]?.speciesId).toBe(species);
    expect(run.story.flags[BETRAYAL_FLAG]).toBe(`done:${species}`);
  });
  it('a Betrayal that waits behind a move-learning prompt still leaves the run in a battle (it used to stay on "decision" with nothing to decide)', () => {
    const run = withTeam('betrayal-after-prompt');
    const team = evilTeam(content, run)!;
    const species = team.legendary.find((id) => content.species.has(id))!;
    run.story.flags[BETRAYAL_FLAG] = `pending:${species}:30`;
    // The state right after the leader falls and a Pokémon wants a new move: the prompt comes first, the Legendary after it.
    const lead = run.party[0]!;
    const moveId = [...content.moves.keys()].find((id) => !lead.moves.some((m) => m.id === id))!;
    run.battle = null;
    run.pending = [{ kind: 'learnMove', uid: lead.uid, moveId }];
    run.afterDecisions = 'eventChain';
    run.phase = 'decision';
    const after = resolveDecision(content, run, { kind: 'skipMove' }).run;
    expect(after.pending).toEqual([]);
    expect(after.battle?.kind).toBe('wild');
    expect(after.battle?.enemyTeam[0]?.speciesId).toBe(species);
    expect(after.phase).toBe('battle');
    // And the save of that moment loads.
    const manager = new SaveManager(new MemoryStorageProvider(), content);
    manager.saveRun(after);
    expect(manager.loadRun().status).toBe('ok');
  });
});
