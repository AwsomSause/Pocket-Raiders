// Beta 4.4 bug list: battle fixes (sleep length, set aces, binding-move art, Melony's Galarian Darumaka).

import { describe, expect, it } from 'vitest';
import { bindChoice } from '../../src/core/presentation/cues';
import { moveAnims } from '../../src/data/presentation';
import { bossTeamSpecies, withSetAce } from '../../src/core/encounters';
import { getBoss } from '../../src/core/regions';
import { content } from './helpers';

const firstStage = (id: string): string => {
  let s = content.species.get(id);
  while (s?.evolvesFrom && s.evolutionStage > 1) s = content.species.get(s.evolvesFrom);
  return s?.id ?? id;
};

describe('sleep length', () => {
  it('lasts 2 to 4 turns', () => {
    expect(content.ruleset.sleepTurnsMin).toBe(2);
    expect(content.ruleset.sleepTurnsMax).toBe(4);
  });
});

describe('set aces', () => {
  it('a gym leader always sends out its signature ace last, even with Boss Remix', () => {
    for (const remix of [false, true]) {
      for (let stage = 0; stage < 8; stage++) {
        const team = bossTeamSpecies(content, 'gym', 'brock', stage, remix);
        expect(firstStage(team[team.length - 1]!)).toBe('onix');
      }
    }
  });

  it('a team without the ace borrows it from the nearest other team', () => {
    const boss = getBoss(content, 'brock');
    const members = [{ speciesId: 'geodude', moves: ['tackle'] }, { speciesId: 'rhyhorn', moves: ['tackle'] }] as Parameters<typeof withSetAce>[4];
    const out = withSetAce(content, boss, 'gym', 0, members);
    expect(firstStage(out[out.length - 1]!.speciesId)).toBe('onix');
    expect(out).toHaveLength(2);
  });
});

describe('binding moves', () => {
  const anims = moveAnims();
  it('Fire Spin, Whirlpool and Sand Tomb squeeze with their own art, not the Wrap picture', () => {
    const wrap = bindChoice(anims, 'wrap');
    for (const id of ['fire-spin', 'whirlpool', 'sand-tomb', 'magma-storm', 'infestation']) {
      const c = bindChoice(anims, id);
      expect(c.anim).toBe(anims.moves[id]!.anim);
      expect(c.anim).not.toBe(wrap.anim);
    }
  });
  it('Wrap, Bind and an unknown move keep the shared bind animation', () => {
    const base = bindChoice(anims, undefined);
    expect(bindChoice(anims, 'wrap')).toEqual(base);
    expect(bindChoice(anims, 'bind')).toEqual(base);
    expect(bindChoice(anims, 'no-such-move')).toEqual(base);
  });
});

describe('Melony', () => {
  it('uses Galarian Darumaka and Darmanitan, never the normal ones', () => {
    const all = (['gym', 'elite', 'champion'] as const).flatMap((role) => getBoss(content, 'melony').teams[role].flatMap((t) => t.members.map((m) => m.speciesId)));
    expect(all.some((id) => id.startsWith('darumaka') || id.startsWith('darmanitan'))).toBe(true);
    expect(all).not.toContain('darumaka');
    expect(all).not.toContain('darmanitan');
  });
});

describe('rivals', () => {
  it('the first rival waits on Stage 1, level 5: that whole level is trainers', async () => {
    const { createRun, chooseStarter } = await import('../../src/core/run');
    const { STANDARD_CHOICE } = await import('../../src/core/rules');
    for (const seed of ['fr1', 'fr2', 'fr3']) {
      const run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: STANDARD_CHOICE }), 0);
      const map = run.stage!.map;
      expect(map.trainerColumns).toContain(content.balance.rival.column);
      expect(map.trainerColumns).toHaveLength(2);
      expect(map.nodes.filter((n) => n.column === content.balance.rival.column).every((n) => n.kind === 'trainer')).toBe(true);
    }
  });

  it('a spark needs a later stage and passes only some of the time', async () => {
    const { RIVAL_CONFIG } = await import('../../src/core/rivals/schema');
    expect(RIVAL_CONFIG.spark.minStage).toBeGreaterThanOrEqual(2);
    expect(RIVAL_CONFIG.spark.chance).toBeLessThan(1);
  });

  it('rival characters each have a look of their own', () => {
    const names = content.trainers.get('rival')!.names;
    expect(names.length).toBeGreaterThan(10);
    const looks = names.filter((n) => content.bosses.has(n.toLowerCase()));
    expect(looks.length).toBeGreaterThan(10);
  });
});
