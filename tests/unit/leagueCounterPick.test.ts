// Beta 0.6 B7: the League's counter-pick. Only registered Pokémon are answered; the cap holds; the swap works once.

import { describe, expect, it } from 'vitest';
import { counterPickMembers, counterTargets } from '../../src/core/campaign/counterPick';
import { applyLeagueDoorChoice, leagueDoorDecision } from '../../src/core/campaign/leagueDoor';
import { chooseNode, chooseStarter, createRun, debugJumpToLeague, mapChoices, resolveDecision } from '../../src/core/run';
import { createPokemon } from '../../src/core/pokemon';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

function leagueRun(seed: string, on = true): RunState {
  const run = debugJumpToLeague(content, chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(on ? { expansion: { leagueCounterPick: true } } : {}) }), 0));
  return run;
}
const eliteBoss = (run: RunState) => content.bosses.get(run.stage!.eliteFour[0]!)!;
const plain = (run: RunState) => eliteBoss(run).teams.elite[0]!.members.map((m) => ({ speciesId: m.speciesId, level: 50, moves: m.moves, training: m.training }));

describe('League counter-pick (B7)', () => {
  it('never answers a Pokémon that was not registered', () => {
    const run = leagueRun('cp1');
    const members = plain(run);
    expect(counterPickMembers(content, eliteBoss(run).id, 'elite', members, [], 4)).toEqual(members);
    run.expansion = { ...run.expansion, league: { registered: [], swapped: false } };
    expect(counterTargets(content, run, 'elite')).toEqual([]);
  });

  it('changes at most `cap` members, keeps the ace and the species count, and is deterministic', () => {
    const run = leagueRun('cp2');
    const boss = eliteBoss(run);
    // Eight registered Pokémon of many types, so plenty could be answered.
    const targets = ['onix', 'gyarados', 'charizard', 'venusaur', 'alakazam', 'gengar', 'dragonite', 'machamp'].filter((id) => content.species.has(id)).map((id, i) => createPokemon(content, id, 60, `t${i}`));
    const base = plain(run);
    for (const cap of [0, 1, 2, 4]) {
      const a = counterPickMembers(content, boss.id, 'elite', base, targets, cap);
      const b = counterPickMembers(content, boss.id, 'elite', base, targets, cap);
      expect(a).toEqual(b);
      expect(a).toHaveLength(base.length);
      expect(a.at(-1)).toEqual(base.at(-1));
      expect(a.filter((m, i) => m.speciesId !== base[i]!.speciesId).length).toBeLessThanOrEqual(cap);
    }
  });

  it('really answers registered Pokémon for most bosses (the feature is not a no-op)', () => {
    const targets = ['onix', 'charizard', 'gengar'].map((id, i) => createPokemon(content, id, 60, `t${i}`));
    let changed = 0;
    for (const [id, boss] of content.bosses) {
      if (!boss.teams.elite?.length) continue;
      const base = boss.teams.elite[0]!.members.map((m) => ({ speciesId: m.speciesId, level: 50 }));
      changed += counterPickMembers(content, id, 'elite', base, targets, 4).filter((m, i) => m.speciesId !== base[i]!.speciesId).length;
    }
    expect(changed).toBeGreaterThan(50);
  });

  it('the Champion answers only your top two', () => {
    const run = leagueRun('cp3');
    const mons = ['charizard', 'venusaur', 'blastoise', 'gengar'].map((id, i) => createPokemon(content, id, 40 + i * 10, `c${i}`));
    run.party = mons;
    run.expansion = { ...run.expansion, league: { registered: mons.map((m) => m.uid), swapped: false } };
    expect(counterTargets(content, run, 'champion').map((m) => m.level)).toEqual([70, 60]);
  });

  it('the League door registers the party and offers one swap that really moves the Pokémon', () => {
    const run = leagueRun('cp4');
    run.box = [createPokemon(content, 'pikachu', 30, 'boxed')];
    const door = leagueDoorDecision(content, run);
    expect(run.expansion?.league?.registered.length).toBe(run.party.length);
    expect(door).not.toBeNull();
    const out = door!.outUid;
    applyLeagueDoorChoice(content, run, door!, 1);
    expect(run.party.some((m) => m.uid === 'boxed')).toBe(true);
    expect(run.party.some((m) => m.uid === out)).toBe(false);
    expect(run.box.some((m) => m.uid === out)).toBe(true);
    expect(run.expansion?.league?.swapped).toBe(true);
    // The swapped-in Pokémon was never registered, so it can never be answered.
    expect(run.expansion?.league?.registered).not.toContain('boxed');
  });

  it('keeping the team changes nothing, and a stale swap is ignored', () => {
    const run = leagueRun('cp5');
    run.box = [createPokemon(content, 'pikachu', 30, 'boxed')];
    const door = leagueDoorDecision(content, run)!;
    const before = JSON.stringify(run.party);
    applyLeagueDoorChoice(content, run, door, 0);
    expect(JSON.stringify(run.party)).toBe(before);
    run.box = [];
    applyLeagueDoorChoice(content, run, door, 1);
    expect(JSON.stringify(run.party)).toBe(before);
  });

  it('stepping to the first Elite Four node shows the door once, and a run without the flag skips it', () => {
    const on = leagueRun('cp6');
    on.box = [createPokemon(content, 'pikachu', 30, 'boxed')];
    const first = mapChoices(content, on)[0]!;
    const door = chooseNode(content, on, first.id);
    expect(door.phase).toBe('decision');
    expect(door.pending[0]?.kind).toBe('leagueDoor');
    const after = resolveDecision(content, door, { kind: 'circuit', optionIndex: 0 }).run;
    expect(after.phase).toBe('map');
    expect(chooseNode(content, after, first.id).phase).not.toBe('decision');
    const off = leagueRun('cp7', false);
    off.box = [createPokemon(content, 'pikachu', 30, 'boxed')];
    expect(chooseNode(content, off, mapChoices(content, off)[0]!.id).pending).toHaveLength(0);
  });
});
