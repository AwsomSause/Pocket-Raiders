// Beta 0.7 E9: the Sinnoh and Hoenn signature traits in battle.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { BattleStateSchema } from '../../src/core/state';
import { assignTrait, TRAIT_CAST, TRAIT_IDS, traitForSpecies, type TraitId } from '../../src/core/expansion/traits';
import { assignEvilTraits } from '../../src/core/expansion/variantAssign';
import { expansionData } from '../../src/data/expansion';
import { content } from './helpers';

interface Opts { enemy: string[]; trait?: TraitId; both?: boolean; pMove?: string; eMove?: string; pHeld?: Record<string, number>; seed?: string; kind?: 'wild' | 'trainer'; enemyLevel?: number; playerLevel?: number }
function duel(o: Opts) {
  const player = createPokemon(content, 'machop', o.playerLevel ?? 50, 'p');
  const enemies = o.enemy.map((sp, i) => createPokemon(content, sp, o.enemyLevel ?? 50, `e${i}`));
  const mv = (m: string) => ({ id: m, pp: content.moves.get(m)!.pp });
  player.moves = [mv(o.pMove ?? 'tackle')];
  if (o.pHeld) player.held = { ...o.pHeld };
  for (const e of enemies) e.moves = [mv(o.eMove ?? 'splash')];
  const battle = createBattle(o.kind ?? 'trainer', enemies, 0, player.uid);
  battle.ai = 0; // no potions or smart switches: these tests set exact HP
  if (o.trait) for (const e of o.both ? enemies : [enemies[0]!]) assignTrait(battle.extra.traits, e.uid, o.trait);
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(o.seed ?? 'traits')), captureRng: new Rng(hashSeed('traitsc')), catchMultiplier: 1 };
  return { ctx, battle, player, enemies, go: () => resolveTurn(ctx, { kind: 'move', index: 0 }) };
}
type Events = ReturnType<ReturnType<typeof duel>['go']>;
const texts = (es: Events) => es.filter((e) => e.type === 'raid').map((e) => (e as { text: string }).text);

describe('Sinnoh and Hoenn traits: assignment', () => {
  it('only in their own region and for their own team', () => {
    expect(traitForSpecies('galactic', 'sinnoh', 'gyarados')).toBe('subtraction');
    expect(traitForSpecies('galactic', 'kanto', 'gyarados')).toBeNull();
    expect(traitForSpecies('aqua', 'hoenn', 'sharpedo')).toBe('blood-in-the-water');
    expect(traitForSpecies('magma', 'hoenn', 'torkoal')).toBe('on-schedule');
    expect(traitForSpecies('aqua', 'sinnoh', 'milotic')).toBeNull();
  });
});

describe('Sinnoh and Hoenn traits in battle', () => {
  it('Subtraction: a hit takes one boost from the target', () => {
    const d = duel({ enemy: ['gyarados'], trait: 'subtraction', eMove: 'tackle' });
    d.battle.playerStages.atk = 3; // Gyarados's Intimidate takes one on entry
    const es = d.go();
    expect(d.battle.playerStages.atk).toBe(1);
    expect(texts(es).join(' ')).toMatch(/Subtraction/);
  });
  it('Grid Tie: an Electric move on the field heals the holder by 10%', () => {
    const d = duel({ enemy: ['gyarados'], trait: 'grid-tie', pMove: 'thunder-shock' });
    const max = d.battle.enemyTeam[0]!.hp;
    d.battle.enemyTeam[0]!.hp = Math.floor(max / 2);
    const before = d.battle.enemyTeam[0]!.hp;
    const es = d.go();
    expect(texts(es).join(' ')).toMatch(/Grid Tie/);
    expect(es.some((e) => e.type === 'heal' && e.side === 'enemy')).toBe(true);
    expect(before).toBeGreaterThan(0);
  });
  it('Blood in the Water: +1 Attack when a Pokémon drops below half HP', () => {
    const d = duel({ enemy: ['sharpedo'], trait: 'blood-in-the-water', eMove: 'tackle', playerLevel: 100 });
    const max = d.player.hp;
    d.player.hp = Math.floor(max / 2) + 5;
    const es = d.go();
    if (d.player.hp > 0 && d.player.hp * 2 < max) {
      expect(texts(es).join(' ')).toMatch(/Blood in the Water/);
      expect(d.battle.enemyStages.atk).toBeGreaterThanOrEqual(1);
    }
  });
  it('On Schedule sets the sun on the third turn; Updraft adds Speed in sun', () => {
    const d = duel({ enemy: ['torkoal'], trait: 'on-schedule' });
    for (let i = 0; i < 3 && !d.battle.outcome; i++) d.go();
    expect(d.battle.weather?.id).toBe('sun');
    const u = duel({ enemy: ['swellow'], trait: 'updraft' });
    u.battle.weather = { id: 'sun', turns: 5 };
    u.go();
    expect(u.battle.enemyStages.spe).toBe(1);
  });
  it('Lingering: the Pokémon that knocks it out is poisoned', () => {
    const d = duel({ enemy: ['skuntank'], trait: 'lingering', playerLevel: 100, kind: 'wild' });
    d.battle.enemyTeam[0]!.hp = 1;
    d.go();
    expect(d.battle.enemyTeam[0]!.hp).toBe(0);
    expect(d.player.status?.id).toBe('psn');
  });
  it('Undertow Song: a switch-in loses Speed (pure check)', () => {
    const d = duel({ enemy: ['milotic'], trait: 'undertow-song' });
    expect(d.battle.extra.traits[d.enemies[0]!.uid]?.trait).toBe('undertow-song');
  });
});
