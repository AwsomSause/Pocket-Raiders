// Overhaul slice 11: Mega / Tera / Dynamax / Z-Move verification (data and rules only, no animation).
import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { TRANSFORM_RULES, TransformRulesSchema } from '../../src/core/battle/transformRules';
import { applyTransformations, revertTransformations, gmaxFormFor, hasKeyItem, maxMoveFor, ownedZCrystal, stoneForms, transformProblem, zMoveFor, type TransformContext } from '../../src/core/battle/transform';
import { createPokemon } from '../../src/core/pokemon';
import { TRANSFORM_KINDS, type TransformKind } from '../../src/core/contentSchema';
import { content } from './helpers';

const KEYS: Record<TransformKind, string> = { mega: 'mega-ring', tera: 'tera-orb', zmove: 'z-ring', dynamax: 'dynamax-band' };

function setup(inventory: Record<string, number>, speciesId = 'charizard') {
  const player = createPokemon(content, speciesId, 60, 'p1');
  player.moves = [{ id: 'flamethrower', pp: 15 }];
  const other = createPokemon(content, 'pikachu', 60, 'p2');
  const foe = createPokemon(content, 'snorlax', 60, 'e1');
  const battle = createBattle('trainer', [foe], 0, player.uid, { classId: 'elite-four', name: 'T', leaderId: null });
  battle.turn = 6;
  const ctx: TransformContext = { content, battle, party: [player, other], inventory };
  return { ctx, battle, player, other };
}
const ALL = { 'mega-ring': 1, 'tera-orb': 1, 'z-ring': 1, 'dynamax-band': 1, 'firium-z': 1 };
const problem = (ctx: TransformContext, kind: TransformKind) => transformProblem(ctx, { kind: kind as 'tera' | 'zmove' | 'dynamax' }, 0);

describe('transformation rules table', () => {
  it('validates, and its key items are real key items for that mechanic', () => {
    expect(TransformRulesSchema.safeParse(TRANSFORM_RULES).success).toBe(true);
    for (const k of TRANSFORM_KINDS) {
      const rule = TRANSFORM_RULES.mechanics[k];
      expect(rule.keyItem).toBe(KEYS[k]);
      const item = content.items.get(rule.keyItem)!;
      expect(item.effect).toMatchObject({ kind: 'keyItem', mechanic: k });
      expect(rule.consumesResource).toBe(false);
    }
  });

  it('exclusions are symmetric between the one-per-Pokémon mechanics', () => {
    const m = TRANSFORM_RULES.mechanics;
    for (const a of ['tera', 'zmove', 'dynamax'] as const) for (const b of ['tera', 'zmove', 'dynamax'] as const) if (a !== b) expect(m[a].excludes, `${a}/${b}`).toContain(b);
    expect(m.mega.excludes).toEqual(['dynamax']);
    expect(m.dynamax.excludes).toContain('mega');
  });

  it('the engine needs the key item, allows one use per side, and one mechanic per Pokémon', () => {
    for (const k of ['tera', 'zmove', 'dynamax'] as const) {
      const none = setup({});
      expect(problem(none.ctx, k), `${k} without key`).toMatch(/need|You need/i);
      const ok = setup(ALL);
      expect(problem(ok.ctx, k), `${k} with key`).toBeNull();
      ok.battle.transform.used.player.push(k);
      expect(problem(ok.ctx, k), `${k} used`).toMatch(/already/);
      const exclusive = setup(ALL);
      exclusive.battle.transform.mechanics[exclusive.player.uid] = k === 'tera' ? 'zmove' : 'tera';
      expect(problem(exclusive.ctx, k), `${k} after another`).toMatch(/already transformed/);
    }
  });

  it('a Mega Evolved or Primal Pokémon cannot Dynamax, and a switched-off mechanic is refused', () => {
    const s = setup(ALL);
    s.battle.transform.forms[s.player.uid] = { kind: 'mega', from: 'charizard' };
    expect(problem(s.ctx, 'dynamax')).toMatch(/can't Dynamax/);
    for (const k of ['tera', 'zmove', 'dynamax'] as const) {
      const off = setup(ALL);
      off.ctx.disabledMechanics = [k];
      expect(problem(off.ctx, k)).toMatch(/switched off/);
    }
  });
});

describe('Mega, Primal and Gigantamax data', () => {
  const forms = [...content.species.values()].filter((s) => s.form && ['mega', 'primal', 'gigantamax'].includes(s.form.kind));

  it('every form has a real base, valid typing, an ability, and a better total than its base', () => {
    expect(forms.length).toBeGreaterThan(100);
    for (const s of forms) {
      const base = content.species.get(s.form!.base);
      expect(base, s.id).toBeTruthy();
      expect(s.types.length, s.id).toBeGreaterThan(0);
      expect(s.abilities, `${s.id} has abilities`).toBeTruthy();
      expect(s.abilities.normal.length + (s.abilities.hidden ? 1 : 0), s.id).toBeGreaterThan(0);
      if (s.form!.kind === 'mega') {
        const total = (x: typeof s) => Object.values(x.baseStats).reduce((a, b) => a + b, 0);
        expect(total(s), s.id).toBeGreaterThan(total(base!));
      }
    }
  });

  it('every Mega and Primal form that is reachable has a stone, and the unreachable ones are the known three', () => {
    const reachable = new Set<string>();
    for (const item of content.items.values()) if (item.effect.kind === 'megaStone') for (const f of Object.values(item.effect.forms)) reachable.add(f);
    const orphans = forms.filter((s) => ['mega', 'primal'].includes(s.form!.kind) && !reachable.has(s.id)).map((s) => s.id).sort();
    // Documented limit: these Z-A forms have no Mega Stone in the game yet, so they are never reached.
    expect(orphans).toEqual([]);
    for (const id of reachable) expect(content.species.has(id), id).toBe(true);
  });

  it('every stone form lists its base species and the stone finds it', () => {
    for (const item of content.items.values()) {
      if (item.effect.kind !== 'megaStone') continue;
      for (const [base, form] of Object.entries(item.effect.forms)) {
        expect(content.species.get(form)?.form?.kind, `${item.id}: ${form}`).toMatch(/^(mega|primal)$/);
        expect(stoneForms(content, base, item.effect.primal).some((o) => o.formId === form), `${item.id} -> ${form}`).toBe(true);
      }
    }
  });

  it('every Gigantamax form has a G-Max Move, and every G-Max Move names real Gigantamax forms', () => {
    const covered = new Set(Object.values(content.maxMoves.gmax).flatMap((g) => g.forms));
    for (const s of forms.filter((x) => x.form!.kind === 'gigantamax')) {
      expect(covered.has(s.id), s.id).toBe(true);
      expect(gmaxFormFor(content, s.form!.base), s.id).toBeTruthy();
    }
    for (const id of covered) expect(content.species.get(id)?.form?.kind, id).toBe('gigantamax');
    for (const [id, g] of Object.entries(content.maxMoves.gmax)) { expect(content.moves.has(id), id).toBe(true); expect(g.type, id).toBeTruthy(); }
  });
});

describe('forms revert', () => {
  it('Mega Evolution happens by itself with the stone and Ring, Tera still works after it, and everything reverts', () => {
    const s = setup({ 'mega-ring': 1, 'tera-orb': 1, 'charizardite-x': 1 });
    const events: never[] = [];
    applyTransformations(s.ctx, undefined, events);
    expect(s.player.speciesId).toBe('charizard-mega-x');
    expect(problem(s.ctx, 'tera')).toBeNull(); // Mega and Tera may coexist (table: mega excludes only dynamax)
    revertTransformations(content, s.battle, s.ctx.party);
    expect(s.player.speciesId).toBe('charizard');
    const no = setup({ 'charizardite-x': 1 });
    applyTransformations(no.ctx, undefined, []);
    expect(no.player.speciesId).toBe('charizard'); // no Mega Ring, no Mega
  });
});

describe('Z-Move and Max Move data', () => {
  const TYPES = Object.keys(content.zMoves.byType) as (keyof typeof content.zMoves.byType)[];

  it('has one Z-Crystal per type, named and typed alike, and one Z-Move per type of that type', () => {
    expect(TYPES).toHaveLength(18);
    for (const type of TYPES) {
      const crystals = [...content.items.values()].filter((i) => i.effect.kind === 'zCrystal' && i.effect.type === type);
      expect(crystals, type).toHaveLength(1);
      expect(crystals[0]!.description, crystals[0]!.id).not.toMatch(/ a [AEIOU]/);
      expect(content.moves.get(content.zMoves.byType[type]!)!.type, type).toBe(type);
      expect(ownedZCrystal(content, { [crystals[0]!.id]: 1 }, type), type).toBe(crystals[0]!.id);
      expect(ownedZCrystal(content, {}, type)).toBeNull();
    }
  });

  it('Z power values are in range and every entry is a real damaging move; status entries are real status moves', () => {
    for (const [id, power] of Object.entries(content.zMoves.power)) {
      const m = content.moves.get(id)!;
      expect(m.category, id).not.toBe('status');
      expect(power, id).toBeGreaterThanOrEqual(100);
      expect(power, id).toBeLessThanOrEqual(220);
    }
    for (const id of Object.keys(content.zMoves.status)) expect(content.moves.get(id)!.category, id).toBe('status');
  });

  it('a Z-Move keeps the move\'s type and category, never misses, and a Max Move does too', () => {
    const flame = content.moves.get('flamethrower')!;
    const z = zMoveFor(content, flame)!;
    expect(z).toMatchObject({ type: 'fire', category: 'special', accuracy: null, priority: 0 });
    expect(z.power).toBe(content.zMoves.power.flamethrower);
    expect(zMoveFor(content, z)).toBeNull();
    const max = maxMoveFor(content, 'charizard', flame)!;
    expect(max).toMatchObject({ type: 'fire', accuracy: null, priority: 0 });
    expect(maxMoveFor(content, 'charizard', max)).toBeNull();
    expect(hasKeyItem(content, ALL, 'zmove')).toBe(true);
  });
});
