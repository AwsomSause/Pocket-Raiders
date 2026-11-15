import { describe, expect, it } from 'vitest';
import { canonKanto } from '../../src/data/expansion';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { buildTownMenu } from '../../src/core/expansion/canonSpaces';
import { chooseStarter, createRun, debugForceEvent, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const P = 'cs-kanto-fuchsia-';
const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
const room = (id: string) => content.events.get(P + id)!;
const play = (run: RunState, id: string, choice: number) => { const f = debugForceEvent(content, structuredClone(run), P + id); return { ...chooseEvent(content, f.run, f.sideId, choice), sideId: f.sideId }; };
const flag = (run: RunState, key: string) => Number(run.story.flags[`ev:${key}`] ?? 0);

describe('Fuchsia canon: the event graph', () => {
  const ids = [...content.events.keys()].filter((id) => id.startsWith(P) && !content.events.get(id)!.disabled);
  const targets = (id: string) => [...content.events.get(id)!.choices, ...content.events.get(id)!.remembers.flatMap((v) => v.addChoices)].flatMap((c) => [c.success, c.failure]).flatMap((o) => [...(o?.effects ?? []), ...(o?.battle?.win ?? []), ...(o?.battle && 'lose' in o.battle ? o.battle.lose ?? [] : [])]).filter((e) => e.kind === 'addEvent').map((e) => (e as { eventId: string }).eventId);
  it('every target exists and every room is reachable from a gate', () => {
    for (const id of ids) for (const t of targets(id)) expect(content.events.has(t), `${id} -> ${t}`).toBe(true);
    // Gates, plus the follow-up placed at a later visit (the Tauros that looked back).
    const gates = [...ids.filter((id) => content.events.get(id)!.canon), `${P}tauros-back`];
    const reach = new Set<string>(gates);
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id)) if (!reach.has(t)) { reach.add(t); again = true; } }
    expect([...reach].sort()).toEqual(ids.sort());
  });
  it('the gates carry catalog ids, and each Fuchsia space with a play-through has one', () => {
    const wanted = ['factory', 'safari', 'savanna', 'jungle', 'warden', 'tauros', 'zoo', 'snag'];
    for (const w of wanted) {
      const id = `cs.kanto.fuchsia.${w}`;
      expect(canonKanto.spaces.some((s) => s.id === id)).toBe(true);
      expect(ids.some((e) => content.events.get(e)!.canon === id), id).toBe(true);
    }
  });
  it('the Fuchsia menu rolls three optional spaces, at most two of them Pseudo Stages', () => {
    for (let i = 0; i < 40; i++) {
      const menu = buildTownMenu(canonKanto, { seed: `FM${i}`, slot: 'stage-5', flags: new Set(), completed: new Set() });
      expect(menu.length).toBe(3);
      expect(menu.filter((m) => /factory|savanna|jungle/.test(m)).length).toBeLessThanOrEqual(2);
    }
  });
});

describe('Polluted Factory', () => {
  it('the gate adds the Sludge field (Poison +10%) and opens the first room', () => {
    const out = play(begin('FAC1'), 'factory', 0).run;
    expect(out.tempEffects.some((t) => JSON.stringify(t).includes('"poison"'))).toBe(true);
    expect(out.stage!.map.nodes.some((n) => n.sides.some((s) => s.eventId === `${P}factory-n1`))).toBe(true);
  });
  it('the pipes burst in about a quarter of crossings and poison the lead (Poison types are immune)', () => {
    let burst = 0;
    for (let i = 0; i < 60; i++) {
      const run = begin(`PIPE${i}`);
      const out = play(run, 'factory-n2', 0);
      expect(out.run.battle?.kind).toBe('wild');
      if (out.run.party[0]!.status?.id === 'psn') burst++;
    }
    expect(burst).toBeGreaterThan(5);
    expect(burst).toBeLessThan(30);
  });
  it('three valves: each good pick counts, and the furnace raid opens with Toxic Spikes unless all three are shut', () => {
    const fight = (valves: number) => {
      const run = begin(`FUR${valves}`);
      run.story.flags['ev:kanto-factory-valves'] = valves;
      return play(run, 'factory-n6', 0).run;
    };
    const bad = fight(2);
    expect(bad.battle!.raid!.id).toBe('magmuk');
    expect(bad.battle!.sideEffects.player.toxicSpikes).toBe(1);
    expect(fight(3).battle!.sideEffects.player.toxicSpikes).toBe(0);
  });
  it('Magmuk is a Delta Muk (Fire Cage) raid with shields, a molten hazard, and no way to catch it', () => {
    const def = content.raids.raids.find((r) => r.id === 'magmuk')!;
    expect(def.species).toEqual(['muk-delta-fire']);
    expect(def.shield?.at.length).toBeGreaterThan(0);
    expect(def.capture).toBeUndefined();
    expect(def.rewards.joinChance).toBe(0);
    expect(def.modifiers.hazard).toMatchObject({ type: 'fire', percent: 0.0625, immune: ['fire', 'poison', 'ground'] });
    expect(def.special).toBe('canon');
  });
  it('winning the raid gives Black Sludge and opens the three-way pick; losing runs the lose effects and goes on', () => {
    const fought = play(begin('FWIN'), 'factory-n6', 0).run;
    const boss = fought.battle!.enemyTeam[0]!;
    boss.hp = 1;
    fought.battle!.raid!.pendingShields = [];
    fought.battle!.raid!.shieldHp = 0;
    fought.party[0]!.moves = [{ id: 'hyper-beam', pp: 5 }];
    let res = takeTurn(content, fought, { kind: 'move', index: 0 });
    for (let i = 0; i < 6 && res.run.phase === 'battle'; i++) res = takeTurn(content, res.run, { kind: 'move', index: 0 });
    expect(res.run.phase).not.toBe('battle');
    expect(flag(res.run, 'kanto-factory-cleared')).toBe(1);
    const held = (res.run.inventory['black-sludge'] ?? 0) + res.run.party.reduce((n, m) => n + (m.held?.['black-sludge'] ?? 0), 0);
    expect(held).toBeGreaterThanOrEqual(1);
    expect(res.run.stage!.map.nodes.some((n) => n.sides.some((s) => s.eventId === `${P}factory-pick`))).toBe(true);

    const lost = play(begin('FLOSE'), 'factory-n6', 0).run;
    lost.party = [lost.party[0]!];
    lost.party[0]!.hp = 1;
    lost.party[0]!.moves = [{ id: 'growl', pp: 40 }];
    lost.battle!.enemyTeam[0]!.moves = [{ id: 'tackle', pp: 35 }];
    let r2 = takeTurn(content, lost, { kind: 'move', index: 0 });
    for (let i = 0; i < 6 && r2.run.phase === 'battle'; i++) { r2.run.party[0]!.hp = Math.min(r2.run.party[0]!.hp, 1); r2 = takeTurn(content, r2.run, { kind: 'move', index: 0 }); }
    expect(r2.run.phase).toBe('map');
    expect(flag(r2.run, 'kanto-factory-shut')).toBe(1);
  });
  it('the pick offers Alolan Grimer, Delta Grimer or Trubbish', () => {
    const species = room('factory-pick').choices.map((c) => (c.success.effects.find((e) => e.kind === 'join') as { species: string[] }).species[0]);
    expect(species).toEqual(['grimer-alola', 'grimer-delta', 'trubbish']);
  });
});

describe('Safari Land (a plain event)', () => {
  it('the entry costs ₽500, needs the money and starts a wild fight in the Safari pool', () => {
    const rich = begin('SAF1');
    rich.money = 1000;
    const f = debugForceEvent(content, structuredClone(rich), `${P}safari`);
    const r = chooseEvent(content, f.run, f.sideId, 0).run;
    expect(r.money).toBe(500);
    expect(flag(r, 'kanto-safari-balls')).toBe(30);
    expect(flag(r, 'kanto-safari-steps')).toBe(500);
    const battle = room('safari').choices[0]!.success.battle as { kind: string; species: string[] };
    expect(battle.kind).toBe('wild');
    expect(battle.species).toContain('chansey');
    for (const id of battle.species) expect(content.species.has(id)).toBe(true);
    const poor = begin('SAF2');
    poor.money = 100;
    const g = debugForceEvent(content, structuredClone(poor), `${P}safari`);
    expect(conditionMet(content, g.run, room('safari').choices[0]!.requires[0]!)).toBe(false);
  });
});

describe('Warden, Tauros, Zoo and the Snag Test (KANTO_PLACED_2)', () => {
  it('the tooth search finds them in the Center 40%, Area 2 35%, Area 3 25%, and pays TM Strength and ten Safari Balls', () => {
    const c1 = room('warden').choices[0]!.chance!;
    const c2 = room('warden-elsewhere').choices[0]!.chance!;
    expect(c1).toBeCloseTo(0.4);
    expect((1 - c1) * c2).toBeCloseTo(0.35, 2);
    expect((1 - c1) * (1 - c2)).toBeCloseTo(0.25, 2);
    for (const r of ['warden-center', 'warden-area2']) {
      const found = room(r).choices[0]!.success.effects;
      expect(found).toContainEqual({ kind: 'teachMove', move: 'strength' });
      expect(found).toContainEqual({ kind: 'item', id: 'safari-ball', count: 10 });
    }
    // Area 3 is a choice, never a battle; waiting costs one Safari step.
    expect(room('warden-area3').choices.every((c) => !c.success.battle)).toBe(true);
    expect(room('warden-area3').choices[2]!.success.effects).toContainEqual({ kind: 'loseItem', id: 'safari-ball', count: 1 });
  });
  it('Tauros: dodging is safe, bait is 40% a ball for six throws, rock 25% and costs two; extras become Tauros Charms', () => {
    expect(room('tauros').choices[0]!.success.battle).toBeUndefined();
    expect(room('tauros-bait').choices[0]!.chance).toBe(0.4);
    expect(room('tauros-bait').remembers[0]!.when).toEqual([{ kind: 'flag', key: 'kanto-tauros-throws', atLeast: 6, atMost: 99 }]);
    const rock = room('tauros-rock').choices[0]!;
    expect(rock.chance).toBe(0.25);
    expect(rock.failure!.effects).toContainEqual({ kind: 'loseItem', id: 'safari-ball', count: 2 });
    expect(room('tauros-more').choices[0]!.success.effects).toContainEqual({ kind: 'item', id: 'tauros-charm', count: 1 });
    const run = begin('TAU'); run.inventory['safari-ball'] = 3;
    const out = play(run, 'tauros-back', 0).run;
    expect(out.pending.some((p) => p.kind === 'caught' && p.mon.speciesId === 'tauros') || out.party.some((m) => m.speciesId === 'tauros')).toBe(true);
    expect(out.inventory['safari-ball']).toBe(2);
  });
  it('the Zoo sells one Rare Candy for ₽10,000', () => {
    const run = begin('ZOO');
    run.money = 12000;
    const out = play(run, 'zoo', 3).run;
    expect(out.money).toBe(2000);
    expect(room('zoo').choices[3]!.success.effects).toContainEqual({ kind: 'item', id: 'rare-candy', count: 1 });
  });
  it('the Snag Test is a two-on-one with the snagged Rhyhorn on their side; winning gives the Snag Ball', () => {
    const b = room('snag').choices[0]!.success.battle!;
    expect(b.kind === 'trainer' && b.team).toContain('rhyhorn');
    expect(b.kind === 'trainer' && b.format).toBe('doubles');
    expect(b.win).toContainEqual({ kind: 'item', id: 'snag-ball', count: 1 });
    expect(room('snag').choices[1]!.success.effects).toContainEqual({ kind: 'flag', key: 'intel', amount: 1 });
    const out = play(begin('SNAG'), 'snag', 0).run;
    expect(out.battle).toBeTruthy();
  });
  it('Deep Savanna starts a sandstorm on the first turn and the Jungle is humid', () => {
    const sav = play(begin('SAV'), 'savanna', 0).run;
    expect(JSON.stringify(sav.tempEffects)).toContain('sand');
    const jun = play(begin('JUN'), 'jungle', 0).run;
    expect(JSON.stringify(jun.tempEffects)).toContain('"grass"');
    expect(JSON.stringify(jun.tempEffects)).toContain('"fire"');
  });
});
