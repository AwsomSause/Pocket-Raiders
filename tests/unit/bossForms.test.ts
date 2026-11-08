// Boss teams: custom forms on every team, Legendaries on late Champions, and Kice's named examples.
import { describe, expect, it } from 'vitest';
import customSpecies from '../../src/data/customSpecies.json';
import storySpecies from '../../src/data/storySpecies.json';
import jetSpecies from '../../src/data/jetSpecies.json';
import gimmicks from '../../src/data/bossGimmicks.json';
import { content } from './helpers';

const custom = new Set([...customSpecies, ...storySpecies.species, ...jetSpecies.species].map((s: { id: string }) => s.id));
const ids = (team: { members: { speciesId: string }[] }) => team.members.map((m) => m.speciesId);

describe('boss team forms', () => {
  it('every Gym, Elite Four and Champion team has at least one custom form', () => {
    const missing: string[] = [];
    for (const boss of content.bosses.values()) for (const role of ['gym', 'elite', 'champion'] as const) boss.teams[role].forEach((t, i) => { if (!ids(t).some((id) => custom.has(id))) missing.push(`${boss.id} ${role} ${i}`); });
    expect(missing).toEqual([]);
  });

  it('every Champion team from region 6 on has a Legendary or Mythical', () => {
    const missing: string[] = [];
    for (const boss of content.bosses.values()) boss.teams.champion.forEach((t, i) => {
      if (i >= 5 && !ids(t).some((id) => { const tags = content.species.get(id)?.tags ?? []; return tags.includes('legendary') || tags.includes('mythical'); })) missing.push(`${boss.id} ${i}`);
    });
    expect(missing).toEqual([]);
  });

  it('keeps the named examples: Steven brings Cataggron, Piers brings Vine Riff', () => {
    expect(ids(content.bosses.get('steven')!.teams.champion[9]!)).toContain('cataggron');
    expect(ids(content.bosses.get('piers')!.teams.champion[9]!)).toContain('vine-riff');
  });

  it('a designated gimmick Pokémon is still on its boss\'s late teams', () => {
    for (const boss of content.bosses.values()) {
      const all = new Set((['gym', 'elite', 'champion'] as const).flatMap((r) => boss.teams[r].flatMap(ids)));
      for (const id of Object.values((gimmicks as Record<string, { mons: Record<string, string> }>)[boss.id]?.mons ?? {})) expect(all.has(id), `${boss.id} ${id}`).toBe(true);
    }
  });
});
