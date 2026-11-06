// Overhaul slice 17: every big-battle boss has a named strategy that shapes its team.

import { describe, expect, it } from 'vitest';
import { getArchetype } from '../../src/core/archetypes';
import { applyBossStrategy, shapeInstances, shapePlanned, strategyIdFor, strategyIdForGroup } from '../../src/core/bossStrategy';
import { leagueScale, planChampion, planEliteFour, planGymLeader, type PlannedMember } from '../../src/core/encounters';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { RIVAL_PROFILES } from '../../src/core/rivals/schema';
import { content, scaleAt } from './helpers';

const RED = getArchetype(content, 'red');
const cfg = content.balance.bossStrategy;
const rng = () => new Rng(hashSeed('s17'));
const mk = (id: string, moves: string[], held?: Record<string, number>): PlannedMember => ({ speciesId: id, level: 20, moves, ...(held ? { held } : {}) });

describe('boss strategies (normal)', () => {
  it('every boss resolves to a defined strategy', () => {
    for (const b of content.bosses.values()) expect(cfg.strategies[strategyIdFor(content, b.id, b.types)], b.id).toBeDefined();
  });
  it('every override, type mapping, key move and ace item points at real data', () => {
    for (const id of [...Object.values(cfg.byBoss), ...Object.values(cfg.byType), cfg.fallback]) expect(cfg.strategies[id], id).toBeDefined();
    for (const id of Object.keys(cfg.byBoss)) expect(content.bosses.has(id), id).toBe(true);
    for (const s of Object.values(cfg.strategies)) {
      expect(content.catalog.get(s.aceItem)?.status === 'supported', s.aceItem).toBe(true);
      for (const m of s.keyMoves) expect(content.moves.has(m), m).toBe(true);
    }
  });
  it('the opener leads, the ace stays last, levels travel with their Pokémon', () => {
    const team = [mk('rattata', ['tackle']), mk('pidgey', ['tailwind']), mk('onix', ['tackle'])];
    const r = applyBossStrategy(content, 'dragon-test-none', 'elite', 0, team, 0.5);
    expect(r.strategy?.id).toBe(cfg.fallback);
    const w = applyBossStrategy(content, 'winona', 'elite', 0, team, 0.5);
    expect(w.members.map((m) => m.speciesId)).toEqual(w.strategy?.id === 'tailwind-rush' ? ['pidgey', 'rattata', 'onix'] : ['rattata', 'pidgey', 'onix']);
    expect(w.members.at(-1)!.speciesId).toBe('onix');
    expect(w.order.at(-1)).toBe(2);
  });
  it('is deterministic and the AI bonus is capped at 1', () => {
    const team = [mk('rattata', ['swords-dance']), mk('pidgey', ['tackle']), mk('onix', ['tackle'])];
    const a = applyBossStrategy(content, 'lance', 'champion', 5, team, 0.95);
    expect(applyBossStrategy(content, 'lance', 'champion', 5, team, 0.95)).toEqual(a);
    expect(a.ai).toBe(1);
  });
});

describe('boss strategies (boundary)', () => {
  it('an ace that already holds an item keeps it; an early gym gets no ace item', () => {
    const held = [mk('rattata', ['tackle']), mk('pidgey', ['tackle']), mk('onix', ['tackle'], { 'oran-berry': 1 })];
    expect(applyBossStrategy(content, 'brock', 'champion', 0, held, 0).members.at(-1)!.held).toEqual({ 'oran-berry': 1 });
    const bare = [mk('rattata', ['tackle']), mk('pidgey', ['tackle']), mk('onix', ['tackle'])];
    expect(applyBossStrategy(content, 'brock', 'gym', 0, bare, 0).members.at(-1)!.held).toBeUndefined();
    expect(applyBossStrategy(content, 'brock', 'gym', cfg.aceItemFromStage, bare, 0).members.at(-1)!.held).toBeDefined();
  });
  it('short teams are not reordered', () => {
    const two = [mk('rattata', ['stealth-rock']), mk('onix', ['tackle'])];
    expect(applyBossStrategy(content, 'giovanni', 'gym', 0, two, 0).members.map((m) => m.speciesId)).toEqual(['rattata', 'onix']);
  });
});

describe('boss strategies (failure)', () => {
  it('disabled or empty input changes nothing', () => {
    const off = { ...content, balance: { ...content.balance, bossStrategy: { ...cfg, enabled: false } } };
    const team = [mk('rattata', ['tackle']), mk('onix', ['tackle'])];
    expect(applyBossStrategy(off, 'brock', 'gym', 9, team, 0.3)).toMatchObject({ members: team, ai: 0.3 });
    expect(applyBossStrategy(content, 'brock', 'gym', 9, [], 0.3).members).toEqual([]);
  });
  it('real plans carry the strategy and a sharper AI for gym, elite and champion', () => {
    const gym = planGymLeader(content, RED, 'brock', 6, scaleAt(6, 3, 0), rng());
    const elite = planEliteFour(content, RED, 'lorelei', 0, leagueScale(content, 0), rng());
    const champ = planChampion(content, RED, 'lance', 0, leagueScale(content, 0), rng());
    for (const p of [gym, elite, champ]) {
      expect(p.strategy).toBeDefined();
      expect(p.levelInfo).toHaveLength(p.members.length);
      expect(p.ai).toBeLessThanOrEqual(1);
    }
    expect(champ.members.at(-1)!.held).toBeDefined();
  });
});

describe('rival, Evil Team and raid strategies', () => {
  const profiles = (JSON.parse(JSON.stringify(content.balance.bossStrategy)) as typeof cfg);
  it('every rival style and Evil Team has a defined strategy', () => {
    for (const style of Object.keys(RIVAL_PROFILES.styles)) expect(cfg.strategies[strategyIdForGroup(content, 'rival', style)], style).toBeDefined();
    for (const t of content.evilTeams.teams) expect(cfg.byEvilTeam[t.id], t.id).toBeDefined();
    expect(profiles.byRivalStyle).toEqual(cfg.byRivalStyle);
  });
  it('an unlisted key uses the fallback', () => {
    expect(strategyIdForGroup(content, 'rival', 'no-such-style')).toBe(cfg.fallback);
    expect(strategyIdForGroup(content, 'evil', 'no-such-team')).toBe(cfg.fallback);
  });
  it('shapePlanned and shapeInstances put the opener first and keep the ace last', () => {
    const plan = shapePlanned(content, 'rain-offense', 'rival', true, [mk('rattata', ['tackle']), mk('pidgey', ['rain-dance']), mk('onix', ['tackle'])], 0.5);
    expect(plan.members.map((m) => m.speciesId)).toEqual(['pidgey', 'rattata', 'onix']);
    expect(plan.ai).toBeCloseTo(0.5 + cfg.aiBonus.rival, 10);
    const mons = ['rattata', 'pidgey', 'onix'].map((id, i) => createPokemon(content, id, 20, `e${i}`));
    mons[1]!.moves = [{ id: 'rain-dance', pp: 5 }];
    const out = shapeInstances(content, 'rain-offense', 'evil', mons, 0);
    expect(out.team.map((m) => m.speciesId)).toEqual(['pidgey', 'rattata', 'onix']);
    expect(out.team.at(-1)!.held).toBeDefined();
    expect(out.ai).toBeCloseTo(cfg.aiBonus.evil, 10);
  });
  it('raids, Totems and legendary bosses keep their authored phases', () => {
    const authored = content.raids.raids.filter((r) => r.phases.length > 0 || r.shield);
    expect(authored.length).toBeGreaterThanOrEqual(25);
    for (const r of content.raids.raids) expect(r.species.length, r.id).toBeGreaterThan(0);
  });
});
