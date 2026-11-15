import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { createPokemon } from '../../src/core/pokemon';
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
const targets = (id: string) => effectsOf(id).flatMap((e) => (e.kind === 'addEvent' || e.kind === 'laterEvent' ? [e.eventId] : e.kind === 'addEventFrom' ? e.ids : []));
const live = (id: string) => !content.events.get(id)!.disabled;

// KANTO_PLACED_2 (catalog overhaul): the Lab hub, the Mansion, Seafoam and New Island pseudo-stages, and the Volcano, rebuilt.
describe('Cinnabar canon: the event graph', () => {
  it('every addEvent target exists, and every live room opens from a gate', () => {
    const ids = [...content.events.keys()].filter((id) => id.startsWith(P) && live(id));
    const gates = ['lab', 'mansion', 'seafoam', 'newisland', 'volcano', 'inn', 'sleeper', 'wave', 'vial'];
    expect(ids.length).toBeGreaterThan(40);
    const reach = new Set<string>(gates.map((g) => `${P}${g}`));
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id.slice(P.length))) { expect(content.events.has(t), `${id} -> ${t}`).toBe(true); expect(live(t), `${id} -> ${t} (disabled)`).toBe(true); if (!reach.has(t)) { reach.add(t); again = true; } } }
    expect([...reach].sort()).toEqual(ids.sort());
  });
  it('the gates carry the catalog ids', () => {
    for (const g of ['lab', 'mansion', 'seafoam', 'newisland', 'volcano']) expect(room(`${P}${g}`).canon).toBe(`cs.kanto.cinnabar.${g}`);
  });
  it('the Cinnabar stage always has the Lab, and every space on its menu has an event', () => {
    for (let i = 0; i < 30; i++) {
      const menu = buildTownMenu(canonKanto, { seed: `T${i}`, slot: 'stage-7', flags: new Set(), completed: new Set() });
      expect(menu).toContain('cs.kanto.cinnabar.lab');
      for (const id of menu) expect([...content.events.values()].some((e) => e.canon === id && !e.disabled), id).toBe(true);
    }
  });
});

describe('Cinnabar Lab', () => {
  it('is a hub: Fossil Revival, the Fusion Display, the Trade Wing and a way out', () => {
    expect(room(`${P}lab`).choices.map((c) => c.label)).toEqual(['Fossil Revival.', 'The Fusion Display.', 'The Trade Wing.', expect.stringMatching(/^Leave/)]);
  });
  it('revives Helix into Omanyte, and the newly woken fossil starts one Bond step higher', () => {
    const out = play('lab-revive', 0, 'LB1', (r) => { r.inventory['helix-fossil'] = 1; });
    expect(out.inventory['helix-fossil'] ?? 0).toBe(0);
    expect(out.pending.some((p) => p.kind === 'caught' && p.mon.speciesId === 'omanyte')).toBe(true);
    const bond = room(`${P}lab-wake`).choices[0]!.success.effects.filter((e) => e.kind === 'kc' && e.act === 'bond');
    expect(bond.reduce((n, e) => n + ((e as { count?: number }).count ?? 1), 0)).toBe(10); // 10 x 5 friendship = one Bond step (50)
  });
  it('every fossil in the game has a revival choice, and a fossil you lack is locked', () => {
    const fossils = itemCatalog.filter((i: { effect?: { kind: string } }) => i.effect?.kind === 'fossil') as { id: string; effect: { species: string } }[];
    const revived = [...content.events.keys()].filter((id) => id.startsWith(`${P}lab-`) && live(id)).flatMap((id) => room(id).choices.flatMap((c) => c.success.effects.flatMap((e) => (e.kind === 'join' ? e.species : []))));
    expect(fossils.length).toBeGreaterThan(20);
    for (const f of fossils) expect(revived, f.id).toContain(f.effect.species);
    const { run, sideId } = debugForceEvent(content, structuredClone(begin('LB2')), `${P}lab-revive`);
    expect(() => chooseEvent(content, run, sideId, 0)).toThrow();
  });
  it('opens the Trade Wing and the Backlog (KANTO_PLACED_4) as rooms of the Lab', () => {
    const opens = (id: string) => room(id).choices.flatMap((c) => c.success.effects.flatMap((e) => (e.kind === 'addEvent' ? [e.eventId] : [])));
    expect(opens(`${P}lab`)).toContain('cs-kanto-cinnabar-trades');
    expect(opens(`${P}lab-revive2`)).toContain('cs-kanto-cinnabar-backlog');
    expect(content.events.get(`${P}lab-trade`)?.disabled ?? true).toBe(true);
  });
});

describe('Pokémon Mansion', () => {
  it('four diary pages pay Intel, the Rocket Scientist holds the Secret Key, and sparing him is Kindness', () => {
    const intel = [...content.events.keys()].filter((id) => id.startsWith(`${P}mansion`) && live(id)).flatMap((id) => effectsOf(id.slice(P.length))).filter((e) => e.kind === 'flag' && e.key === 'intel');
    expect(intel.length).toBeGreaterThanOrEqual(8);
    const boss = room(`${P}mansion-n6`).choices[0]!;
    expect(boss.success.battle).toMatchObject({ kind: 'trainer', name: 'Rocket Scientist', team: ['muk'] });
    expect(boss.failure!.battle).toMatchObject({ kind: 'trainer', name: 'Rocket Scientist', team: ['weezing'] });
    expect(boss.success.battle!.win).toContainEqual({ kind: 'item', id: 'secret-key', count: 1 });
    const spare = room(`${P}mansion-n6`).choices[2]!.success.effects;
    expect(spare).toContainEqual({ kind: 'item', id: 'secret-key', count: 1 });
    expect(spare.some((e) => e.kind === 'flag' && e.key === 'kind-total')).toBe(true);
  });
  it('reading a diary page twice pays Intel +2', () => {
    const read = play('mansion-n2', 1, 'DP');
    expect(read.story.flags['ev:intel']).toBe(2);
  });
  it('the reward room gives the TM Fire Spin or a Fire-type fossil, not both', () => {
    const [tm, fossil] = room(`${P}mansion-reward`).choices;
    expect(tm!.success.effects).toContainEqual(expect.objectContaining({ kind: 'teachMove', move: 'fire-spin' }));
    expect(fossil!.success.effects.some((e) => e.kind === 'item')).toBe(true);
    expect(room(`${P}mansion-reward`).choices).toHaveLength(2);
  });
});

describe('Seafoam Islands', () => {
  it('has three boulders: Strength sets one at once, otherwise a push and a battle, and the current may carry you back', () => {
    for (const n of ['n2', 'n4']) {
      const [strength, push, wade] = room(`${P}seafoam-${n}`).choices;
      expect(strength!.requires).toContainEqual(expect.objectContaining({ move: 'strength' }));
      expect(push!.success.battle).toMatchObject({ kind: 'wild' });
      expect(wade!.chance).toBe(0.5);
    }
    expect(room(`${P}seafoam-n3`).choices.some((c) => c.success.effects.some((e) => e.kind === 'join' && e.species[0] === 'slowpoke'))).toBe(true);
  });
  it('the bottom is a 35% Articuno (a Galarian one about 10% of the time), else a Dewgong horde', () => {
    const look = room(`${P}seafoam-n6`).choices[0]!;
    const bird = room(`${P}seafoam-pillar`).choices[0]!;
    expect(look.chance! * bird.chance!).toBeCloseTo(0.35, 2);
    expect(look.chance! * (1 - bird.chance!)).toBeCloseTo(0.1, 1);
    expect(bird.success.battle).toMatchObject({ species: ['articuno'] });
    expect(bird.failure!.battle).toMatchObject({ species: ['articuno-galar'] });
    expect(look.failure!.battle).toMatchObject({ kind: 'wild', species: ['dewgong'], chain: 3 });
    for (const b of [bird.success.battle!, bird.failure!.battle!, look.failure!.battle!]) {
      expect(b.win).toContainEqual(expect.objectContaining({ kind: 'item', id: 'nevermeltice' }));
      expect(b.win).toContainEqual(expect.objectContaining({ kind: 'item', id: 'icy-rock' }));
    }
  });
});

describe('New Island', () => {
  it('the Clone Battle is three copies of your own Pokémon in the rain, and losing it wakes you on the dock (never ends the run)', () => {
    const b = room(`${P}newisland-n5`).choices[0]!.success.battle!;
    expect(b).toMatchObject({ kind: 'trainer', mirror: true, clone: true, size: 3, weather: 'rain' });
    expect('lose' in b && b.lose).toContainEqual(expect.objectContaining({ kind: 'flag', key: 'kanto-newisland-dock' }));
    const out = play('newisland-n5', 0, 'NI', (r) => { r.party.push(createPokemon(content, 'pikachu', 12, 'p')); });
    expect(out.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(out.party.slice(0, out.battle!.enemyTeam.length).map((m) => m.speciesId));
  });
  it('after the fight the Clone Core copies your lead\'s moves onto your lowest-level Pokémon', () => {
    const setup = (r: ReturnType<typeof begin>) => { r.party.push(createPokemon(content, 'pidgey', 20, 'p'), createPokemon(content, 'rattata', 3, 'p')); r.party[0]!.moves = [{ id: 'ember', pp: 25 }, { id: 'scratch', pp: 35 }]; };
    const out = play('newisland-after', 1, 'CC', setup);
    expect(out.party[2]!.moves.map((m) => m.id)).toEqual(['ember', 'scratch']);
    expect(out.party[1]!.moves.map((m) => m.id)).not.toEqual(['ember', 'scratch']);
  });
  it('Mew shows up 10% of the time, once', () => {
    const c = room(`${P}newisland-end`).choices[0]!;
    expect(c.chance).toBe(0.1);
    expect(room(`${P}newisland-mew`).choices[0]!.success.battle).toMatchObject({ kind: 'wild', species: ['mew'] });
  });
});

describe('Cinnabar Volcano', () => {
  it('each of the three climbs has a 1 in 16 burn, and the top is a fire fight or a gift', () => {
    for (const id of ['volcano', 'volcano-s2', 'volcano-s3']) {
      const climb = room(`${P}${id}`).choices[0]!;
      expect(climb.chance).toBeCloseTo(15 / 16);
      expect(climb.failure!.effects).toContainEqual(expect.objectContaining({ kind: 'status', status: 'burn' }));
    }
    expect(room(`${P}volcano-top`).choices[0]!.success.battle).toMatchObject({ species: ['magmar', 'charmeleon', 'ponyta'] });
  });
});
