// Beta 0.6 E1 part 7: Kanto's nine signature traits in battle.
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
const lost = (es: Events, side: 'player' | 'enemy') => es.reduce((n, e) => (e.type === 'damage' && e.side === side ? n + e.amount : n), 0);
const texts = (es: Events) => es.filter((e) => e.type === 'raid').map((e) => (e as { text: string }).text);

describe('registry and assignment', () => {
  it('nine traits, each tied to a dossier row that exists', () => {
    expect(TRAIT_IDS).toHaveLength(9);
    const ids = new Set(expansionData.specialPokemon.map((p) => p.id));
    for (const t of TRAIT_IDS) expect(ids.has(TRAIT_CAST[t].dossier), t).toBe(true);
  });
  it('species map to traits only for the right team and region', () => {
    expect(traitForSpecies('rocket', 'kanto', 'persian')).toBe('seat-at-the-table');
    expect(traitForSpecies('rocket', 'johto', 'persian')).toBeNull();
    expect(traitForSpecies('aqua', 'kanto', 'persian')).toBeNull();
    expect(traitForSpecies('rocket-remnants', 'kanto', 'meowth')).toBe('translator');
    expect(traitForSpecies('rocket', 'kanto', 'meowth')).toBeNull();
  });
  it('Grunts never carry a trait; Specialists and up do', () => {
    const mons = ['persian', 'electrode'].map((s, i) => createPokemon(content, s, 30, `x${i}`));
    expect(assignEvilTraits({}, mons, { teamId: 'rocket', regionId: 'kanto', rank: 'grunt' })).toEqual([]);
    const t = {};
    expect(assignEvilTraits(t, mons, { teamId: 'rocket', regionId: 'kanto', rank: 'leader' })).toHaveLength(2);
    expect(Object.values(t).map((v) => (v as { trait: string }).trait).sort()).toEqual(['lights-out', 'seat-at-the-table']);
  });
  it('traits survive a save and old battles still load', () => {
    const d = duel({ enemy: ['persian'], trait: 'seat-at-the-table' });
    d.go();
    const back = BattleStateSchema.parse(JSON.parse(JSON.stringify(d.battle)));
    expect(back.extra.traits[d.enemies[0]!.uid]?.trait).toBe('seat-at-the-table');
    const old = JSON.parse(JSON.stringify(duel({ enemy: ['persian'] }).battle));
    delete old.extra.traits; delete old.extra.darkTurns; delete old.extra.payout;
    const parsed = BattleStateSchema.parse(old);
    expect(parsed.extra.traits).toEqual({});
    expect(parsed.extra.darkTurns).toBe(0);
    expect(parsed.extra.payout).toBe(false);
  });
  it('a battle with no traits is unchanged', () => {
    const a = duel({ enemy: ['persian'], pMove: 'tackle', eMove: 'tackle' }), b = duel({ enemy: ['persian'], pMove: 'tackle', eMove: 'tackle' });
    expect(JSON.stringify(a.go())).toBe(JSON.stringify(b.go()));
  });
});

describe('the nine traits', () => {
  it('Seat at the Table clears the foe boosts on entry', () => {
    const d = duel({ enemy: ['persian'], trait: 'seat-at-the-table' });
    d.battle.playerStages.atk = 3;
    d.battle.playerStages.spe = -2;
    const es = d.go();
    expect(d.battle.playerStages.atk).toBe(0);
    expect(d.battle.playerStages.spe).toBe(-2); // drops stay
    expect(texts(es).some((t) => t.startsWith('Seat at the Table'))).toBe(true);
    const plain = duel({ enemy: ['persian'] });
    plain.battle.playerStages.atk = 3;
    plain.go();
    expect(plain.battle.playerStages.atk).toBe(3);
  });
  it('Drill Through: the first Ground or Rock move ignores Protect and screens, once', () => {
    const base = duel({ enemy: ['rhydon'], eMove: 'earthquake', pMove: 'protect' });
    expect(lost(base.go(), 'player')).toBe(0);
    const d = duel({ enemy: ['rhydon'], trait: 'drill-through', eMove: 'earthquake', pMove: 'protect' });
    const first = d.go();
    expect(lost(first, 'player')).toBeGreaterThan(0);
    expect(texts(first)).toContain('Drill Through: nothing stops it.');
    expect(d.battle.extra.traits[d.enemies[0]!.uid]!.flags.drilled).toBe(1);
    // Screens: the first hit is not halved, the same hit without the trait is.
    const screen = (trait: boolean) => {
      const x = duel({ enemy: ['rhydon'], ...(trait ? { trait: 'drill-through' as const } : {}), eMove: 'earthquake', pMove: 'splash' });
      x.battle.sideEffects.player.reflect = 5;
      return lost(x.go(), 'player');
    };
    expect(screen(true) / screen(false)).toBeGreaterThan(1.6);
  });
  it('The House Wins: the survivor gains +1 Attack and +1 Special Defense when its partner faints', () => {
    const d = duel({ enemy: ['nidoking', 'nidoqueen'], trait: 'house-wins', both: true, pMove: 'tackle', playerLevel: 100, enemyLevel: 5 });
    const es = d.go();
    expect(d.battle.enemyIndex).toBe(1);
    expect(d.battle.enemyStages.atk).toBe(1);
    expect(d.battle.enemyStages.spd).toBe(1);
    expect(texts(es)).toContain('The House Wins.');
  });
  it('Double Entry copies the foe stat change once', () => {
    const d = duel({ enemy: ['porygon'], trait: 'double-entry', pMove: 'swords-dance' });
    const first = d.go();
    expect(d.battle.playerStages.atk).toBe(2);
    expect(d.battle.enemyStages.atk).toBe(2);
    expect(texts(first)).toContain('Double Entry: it copies the change.');
    d.go();
    expect(d.battle.playerStages.atk).toBe(4);
    expect(d.battle.enemyStages.atk).toBe(2);
  });
  it('Collections: a biting move takes the target Berry', () => {
    const d = duel({ enemy: ['raticate'], trait: 'collections', eMove: 'bite', pHeld: { 'oran-berry': 1 }, pMove: 'splash' });
    d.go();
    expect(d.player.held?.['oran-berry'] ?? 0).toBe(0);
    expect(d.enemies[0]!.held?.['oran-berry']).toBe(1);
    const plain = duel({ enemy: ['raticate'], eMove: 'bite', pHeld: { 'oran-berry': 1 }, pMove: 'splash' });
    plain.go();
    expect(plain.enemies[0]!.held?.['oran-berry'] ?? 0).toBe(0);
  });
  it('Fed and Paid heals 1/8 each turn until its food is knocked away', () => {
    const d = duel({ enemy: ['snorlax'], trait: 'fed-and-paid', pMove: 'splash' });
    const max = d.enemies[0]!.hp;
    d.enemies[0]!.hp = Math.floor(max / 2);
    d.go();
    expect(d.enemies[0]!.hp).toBe(Math.floor(max / 2) + Math.floor(max / 8));
    const k = duel({ enemy: ['snorlax'], trait: 'fed-and-paid', pMove: 'knock-off' });
    k.enemies[0]!.hp = Math.floor(k.enemies[0]!.hp / 2);
    const es = k.go();
    expect(texts(es)).toContain('Its food is knocked away.');
    const after = k.enemies[0]!.hp;
    k.player.moves = [{ id: 'splash', pp: 10 }];
    k.go();
    expect(k.enemies[0]!.hp).toBe(after);
  });
  it('Payout: knocking out a foe doubles the prize (flag)', () => {
    const d = duel({ enemy: ['dratini'], trait: 'payout', eMove: 'tackle', pMove: 'splash', enemyLevel: 60 });
    expect(d.battle.extra.payout).toBe(false);
    d.player.hp = 1;
    d.go();
    expect(d.battle.extra.payout).toBe(true);
    const none = duel({ enemy: ['dratini'], eMove: 'tackle', pMove: 'splash', enemyLevel: 60 });
    none.player.hp = 1;
    none.go();
    expect(none.battle.extra.payout).toBe(false);
  });
  it('Lights Out: fainting darkens the field for 3 turns (accuracy -10%)', () => {
    const d = duel({ enemy: ['voltorb', 'voltorb'], trait: 'lights-out', pMove: 'tackle', playerLevel: 100, enemyLevel: 5 });
    const es = d.go();
    expect(texts(es)).toContain('Lights Out: the field goes dark.');
    expect(d.battle.extra.darkTurns).toBe(2); // 3 set on the faint, one turn counted
    d.player.moves = [{ id: 'splash', pp: 10 }];
    d.go();
    d.go();
    expect(d.battle.extra.darkTurns).toBe(0);
    const misses = (dark: number) => {
      let n = 0;
      for (let i = 0; i < 300; i++) {
        const x = duel({ enemy: ['snorlax'], pMove: 'tackle', seed: `m${i}` });
        x.battle.extra.darkTurns = dark;
        if (x.go().some((e) => e.type === 'miss' && e.side === 'player')) n++;
      }
      return n;
    };
    const lit = misses(0), dark = misses(3);
    expect(dark).toBeGreaterThan(lit + 10);
  });
  it('Translator reveals the foe next move once per battle', () => {
    const d = duel({ enemy: ['meowth'], trait: 'translator', pMove: 'tackle' });
    expect(texts(d.go()).some((t) => t.startsWith('Translator: "Tackle!"'))).toBe(true);
    expect(texts(d.go()).some((t) => t.startsWith('Translator'))).toBe(false);
  });
});
