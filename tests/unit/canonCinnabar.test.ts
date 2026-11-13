import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet, eventView } from '../../src/core/events';
import { abilityOf, calcStats, createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun, debugForceEvent } from '../../src/core/run';
import { buildTownMenu } from '../../src/core/expansion/canonSpaces';
import { canonKanto } from '../../src/data/expansion';
import itemCatalog from '../../src/data/itemCatalog.json';
import { content } from './helpers';

const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
const held = (run: ReturnType<typeof begin>, id: string) => (run.inventory[id] ?? 0) + run.party.reduce((n, m) => n + (m.held?.[id] ?? 0), 0);
const room = (id: string) => content.events.get(id)!;
const P = 'cs-kanto-cinnabar-';
const play = (id: string, choice: number, seed = 'CB', tweak?: (r: ReturnType<typeof begin>) => void, trade?: string) => {
  const base = begin(seed);
  tweak?.(base);
  const { run, sideId } = debugForceEvent(content, structuredClone(base), `${P}${id}`);
  return chooseEvent(content, run, sideId, choice, trade).run;
};
const effectsOf = (id: string) => room(`${P}${id}`).choices.flatMap((c) => [c.success, c.failure]).filter(Boolean).flatMap((o) => [...o!.effects, ...(o!.battle?.win ?? [])]);
const targets = (id: string) => effectsOf(id).flatMap((e) => (e.kind === 'addEvent' ? [e.eventId] : e.kind === 'addEventFrom' ? e.ids : []));

describe('Cinnabar canon: the event graph', () => {
  it('every addEvent target exists, and every room opens from a gate', () => {
    const ids = [...content.events.keys()].filter((id) => id.startsWith(P));
    const gates = ['lab', 'mansion', 'seafoam', 'newisland', 'volcano'];
    expect(ids.length).toBeGreaterThan(40);
    const reach = new Set<string>(gates.map((g) => `${P}${g}`));
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id.slice(P.length))) { expect(content.events.has(t), `${id} -> ${t}`).toBe(true); if (!reach.has(t)) { reach.add(t); again = true; } } }
    expect([...reach].sort()).toEqual(ids.sort());
  });
  it('the gates carry the catalog ids', () => {
    expect(room(`${P}lab`).canon).toBe('cs.kanto.cinnabar.lab');
    expect(room(`${P}mansion`).canon).toBe('cs.kanto.cinnabar.mansion');
    expect(room(`${P}seafoam`).canon).toBe('cs.kanto.cinnabar.seafoam');
    expect(room(`${P}newisland`).canon).toBe('cs.kanto.cinnabar.newisland');
    expect(room(`${P}volcano`).canon).toBe('cs.kanto.cinnabar.volcano');
  });
  it('the Cinnabar stage always has the Lab, and every space on its menu has an event', () => {
    for (let i = 0; i < 30; i++) {
      const menu = buildTownMenu(canonKanto, { seed: `T${i}`, slot: 'stage-7', flags: new Set(), completed: new Set() });
      expect(menu).toContain('cs.kanto.cinnabar.lab');
      for (const id of menu) expect([...content.events.values()].some((e) => e.canon === id), id).toBe(true);
    }
  });
});

describe('Cinnabar Lab', () => {
  it('offers the fossil machine, trades, the display and a way out', () => {
    expect(room(`${P}lab`).choices.map((c) => c.label)).toEqual(['Fossil machine', 'Lab trades', 'Fusion display', 'Leave']);
  });
  it('a Fossil Fragment comes from the Mt. Moon log (once), a second half costs ₽400, and two halves open the revival pages', () => {
    const log = play('lab-fossil', 0, 'LF', (r) => { r.story.flags['ev:xk-fossil-registered'] = 1; });
    expect(log.story.flags['ev:kanto-fossil-fragment']).toBe(1);
    expect(log.story.flags['ev:kanto-lab-fragment']).toBe(1);
    const noLog = begin('LF0');
    expect(conditionMet(content, noLog, room(`${P}lab-fossil`).choices[0]!.requires[0]!)).toBe(false);
    const again = structuredClone(log);
    expect(conditionMet(content, again, room(`${P}lab-fossil`).choices[0]!.requires[1]!)).toBe(false);
    const rich = play('lab-fossil', 1, 'LF2', (r) => { r.money = 1000; r.story.flags['ev:kanto-fossil-fragment'] = 1; });
    expect(rich.money).toBe(600);
    expect(rich.story.flags['ev:kanto-fossil-fragment']).toBe(2);
    const made = play('lab-fossil', 2, 'LF3', (r) => { r.story.flags['ev:kanto-fossil-fragment'] = 2; });
    expect(made.story.flags['ev:kanto-fossil-fragment']).toBe(0);
    expect(made.stage!.map.nodes.some((n) => n.sides.some((s) => s.eventId === `${P}lab-fossil-1`))).toBe(true);
  });
  it('revives Helix into Omanyte, and every fossil in the game has a revival choice', () => {
    const out = play('lab-fossil-1', 0, 'LB1');
    expect(out.pending.some((p) => p.kind === 'caught' && p.mon.speciesId === 'omanyte')).toBe(true);
    const fossils = itemCatalog.filter((i: { effect?: { kind: string } }) => i.effect?.kind === 'fossil') as { id: string; effect: { species: string } }[];
    const revived = [...content.events.keys()].filter((id) => id.startsWith(`${P}lab-fossil-`)).flatMap((id) => room(id).choices.flatMap((c) => c.success.effects.flatMap((e) => (e.kind === 'join' ? e.species : []))));
    expect(fossils.length).toBeGreaterThan(20);
    for (const f of fossils) expect(revived, f.id).toContain(f.effect.species);
  });
  it('the Lab trades a Pokémon for a Voltorb, an Electrode or a Porygon at a fair stage', () => {
    const wants = room(`${P}lab-trade`).choices.slice(0, 3).map((c) => c.success.effects.map((e) => (e.kind === 'tradeAway' ? e.want.stage : e.kind === 'join' ? e.species[0] : null)).filter(Boolean));
    expect(wants).toEqual([[1, 'voltorb'], [2, 'electrode'], [3, 'porygon']]);
  });
});

describe('Pokémon Mansion', () => {
  it('is a 6-step burned-out ruin: Fire/Poison/Electric fights, four diary pages worth Intel +2, a three-switch puzzle and a Rocket scientist', () => {
    const intel = [...content.events.keys()].filter((id) => id.startsWith(`${P}mansion`)).flatMap((id) => effectsOf(id.slice(P.length))).filter((e) => e.kind === 'attribute' && e.key === 'intelligence' && e.amount === 2);
    expect(intel.length).toBe(4);
    const boss = room(`${P}mansion-n6`).choices[0]!.success.battle!;
    expect(boss).toMatchObject({ kind: 'trainer', name: 'Rocket Scientist', species: ['muk', 'weezing'] });
    expect(boss.win).toContainEqual({ kind: 'item', id: 'secret-key', count: 1 });
  });
  it('the switch wall has exactly one right switch: the wrong ones hurt and reset', () => {
    for (let v = 1; v <= 3; v++) {
      const r = room(`${P}mansion-sw-s1-v${v}`);
      expect(r.choices).toHaveLength(3);
      const right = r.choices.filter((c) => c.success.effects.every((e) => e.kind !== 'damage'));
      expect(right).toHaveLength(1);
    }
    const base = begin('SW');
    const wrong = play('mansion-sw-s1-v1', 1, 'SW');
    expect(wrong.party[0]!.hp).toBeLessThan(base.party[0]!.hp);
    expect(wrong.party[0]!.hp).toBeGreaterThan(0);
  });
  it('reading a diary page is optional and pays Intel +2', () => {
    const before = begin('DP').attributeModifiers.intelligence ?? 0;
    const read = play('mansion-n2', 0, 'DP');
    const skip = play('mansion-n2', 1, 'DP');
    expect(read.attributeModifiers.intelligence).toBe(before + 2);
    expect(skip.attributeModifiers.intelligence ?? 0).toBe(before);
  });
  it('the locker gives the TM Fire Spin or a Fire-type fossil, not both', () => {
    const [tm, fossil] = room(`${P}mansion-n8`).choices;
    expect(tm!.success.effects).toContainEqual(expect.objectContaining({ kind: 'teachMove', move: 'fire-spin' }));
    expect(fossil!.success.effects).toContainEqual(expect.objectContaining({ kind: 'itemFrom' }));
  });
});

describe('Seafoam Islands', () => {
  it('has a boulder puzzle, wild water and ice fights, and a 35% Articuno at the bottom (else a Dewgong horde)', () => {
    expect(room(`${P}seafoam-n5`).choices[0]!.chance).toBe(0.35);
    expect(room(`${P}seafoam-n6b`).choices[0]!.success.battle).toMatchObject({ kind: 'wild', species: ['dewgong'], chain: 3 });
    expect(room(`${P}seafoam-bd-s1-v1`).choices).toHaveLength(2);
  });
  it('a Galarian Articuno takes the place of Articuno 10% of the time', () => {
    const c = room(`${P}seafoam-n6a`).choices[0]!;
    expect(c.chance).toBe(0.1);
    expect(c.success.battle).toMatchObject({ species: ['articuno-galar'] });
    expect(c.failure!.battle).toMatchObject({ species: ['articuno'] });
  });
  it('the way out pays Never-Melt Ice and an Icy Rock', () => {
    const out = play('seafoam-n7', 0, 'SF');
    expect(held(out, 'nevermeltice')).toBe(1);
    expect(held(out, 'icy-rock')).toBe(1);
  });
});

describe('New Island', () => {
  it('the Clone Battle fields clones of your own Pokémon: same species, no ability, no items, +10% stats', () => {
    const out = play('newisland-n3', 0, 'NI', (r) => { r.party.push(createPokemon(content, 'pikachu', 12, 'p')); });
    const foes = out.battle!.enemyTeam;
    expect(foes.map((m) => m.speciesId)).toEqual(out.party.slice(0, foes.length).map((m) => m.speciesId));
    expect(foes.length).toBeGreaterThanOrEqual(2);
    for (const f of foes) {
      expect(abilityOf(content, f)).toBeNull();
      expect(f.held ?? {}).toEqual({});
      const plain = { ...f, statBoosts: undefined };
      expect(calcStats(content, f).atk).toBeGreaterThan(calcStats(content, plain).atk);
    }
    expect(room(`${P}newisland-n3`).choices[0]!.success.battle).toMatchObject({ mirror: true, clone: true });
  });
  it('the Clone Core copies your lead\'s moves onto the Pokémon you pick (the lowest-level one if none is picked)', () => {
    const setup = (r: ReturnType<typeof begin>) => { r.party.push(createPokemon(content, 'pidgey', 20, 'p'), createPokemon(content, 'rattata', 3, 'p')); r.party[0]!.moves = [{ id: 'ember', pp: 25 }, { id: 'scratch', pp: 35 }]; };
    const base = begin('CC'); setup(base);
    const { run, sideId } = debugForceEvent(content, structuredClone(base), `${P}newisland-n4`);
    const picks = eventView(content, run, sideId).choices[0]!.tradePicks?.map((p) => p.uid);
    expect(picks).toEqual([run.party[1]!.uid, run.party[2]!.uid]);
    const picked = chooseEvent(content, structuredClone(run), sideId, 0, run.party[1]!.uid).run;
    expect(picked.party[1]!.moves.map((m) => m.id)).toEqual(['ember', 'scratch']);
    expect(picked.party[2]!.moves.map((m) => m.id)).not.toEqual(['ember', 'scratch']);
    expect(() => chooseEvent(content, structuredClone(run), sideId, 0, run.party[0]!.uid)).toThrow();
    const auto = play('newisland-n4', 0, 'CC', setup);
    expect(auto.party[2]!.moves.map((m) => m.id)).toEqual(['ember', 'scratch']);
  });
  it('the Clone Core is locked with only one Pokémon', () => {
    const { run, sideId } = debugForceEvent(content, structuredClone(begin('CC1')), `${P}newisland-n4`);
    expect(() => chooseEvent(content, run, sideId, 0)).toThrow(/2 Pokémon/);
  });
  it('Mew shows up 10% of the time', () => {
    const c = room(`${P}newisland-n5`).choices[0]!;
    expect(c.chance).toBe(0.1);
    expect(c.success.battle).toMatchObject({ kind: 'wild', species: ['mew'] });
  });
});

describe('Cinnabar Volcano', () => {
  it('each climb room has a 1 in 16 burn, and the top pays a Fire Stone and a Heat Rock', () => {
    expect(room(`${P}volcano-n1`).choices[0]!.chance).toBeCloseTo(15 / 16);
    expect(room(`${P}volcano-n1`).choices[0]!.failure!.effects).toContainEqual(expect.objectContaining({ kind: 'status', status: 'burn' }));
    const out = play('volcano-n6', 0, 'VO');
    expect(held(out, 'fire-stone')).toBe(1);
    expect(held(out, 'heat-rock')).toBe(1);
    expect(room(`${P}volcano-n5`).choices[0]!.success.battle).toMatchObject({ species: ['magmar', 'charmeleon', 'ponyta'] });
  });
});
