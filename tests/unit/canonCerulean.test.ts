import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { abilityOf, createPokemon, lookSpecies } from '../../src/core/pokemon';
import { chooseStarter, createRun, debugForceEvent } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import { conditionMet as met } from '../../src/core/events';
import { finishCanonSpace } from '../../src/core/expansion/canonSpaces';
import { canonKanto } from '../../src/data/expansion';
import { content } from './helpers';
import { choose, open, scene, win } from './helpers/gnPlay';

const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
const heldCount = (run: ReturnType<typeof begin>, id: string) => (run.inventory[id] ?? 0) + run.party.reduce((n, m) => n + (m.held?.[id] ?? 0), 0);
const room = (id: string) => content.events.get(id)!;
const P = 'cs-kanto-cerulean-';

describe('Cerulean canon: the event graph', () => {
  it('every room opens from a gate, and every addEvent / addEventFrom target exists', () => {
    const ids = [...content.events.values()].filter((e) => e.id.startsWith(P) && !e.disabled).map((e) => e.id);
    const targets = (id: string) => room(id).choices.flatMap((c) => [c.success, c.failure]).flatMap((o) => [...(o?.effects ?? []), ...(o?.battle?.win ?? []), ...(o?.battle && 'lose' in o.battle ? o.battle.lose ?? [] : [])]).flatMap((e) => (e.kind === 'addEvent' ? [e.eventId] : e.kind === 'addEventFrom' ? e.ids : []));
    for (const id of ids) for (const t of targets(id)) expect(content.events.has(t), `${id} -> ${t}`).toBe(true);
    const reach = new Set<string>([`${P}bridge`, `${P}squad`, `${P}damian`, `${P}burglary`, `${P}rain`, `${P}bill`, `${P}daycare`]);
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id)) if (!reach.has(t)) { reach.add(t); again = true; } }
    expect([...reach].filter((id) => id.startsWith(P)).sort()).toEqual(ids.sort());
  });
  it('the gates carry the catalog ids', () => {
    expect(room(`${P}bridge`).canon).toBe('cs.kanto.cerulean.bridge');
    expect(room(`${P}squad`).canon).toBe('cs.kanto.cerulean.squad');
    expect(room(`${P}damian`).canon).toBe('cs.kanto.cerulean.damian');
    expect(room(`${P}burglary`).canon).toBe('cs.kanto.cerulean.burglary');
  });
});

// The bridge, the Hidden Village, the Squirtle Squad and Cold Night's Rain were rebuilt as Greenneedle gn.06–gn.08 (catalog overhaul row 15).
// Their Kanto canon gates (bridge, squad, rain) now open those events; the old rooms are retired. Tests: tests/unit/greenneedle2.test.ts.
describe('Cool Shades', () => {
  const setup = (shades: boolean, seed: string) => {
    const player = createPokemon(content, 'snorlax', 40, 'p');
    player.moves = [{ id: 'growl', pp: 40 }];
    if (shades) player.held = { 'cool-shades': 1 };
    const enemy = createPokemon(content, 'gyarados', 40, 'e');
    enemy.fixedAbility = 'intimidate';
    enemy.moves = [{ id: 'splash', pp: 40 }];
    const battle = createBattle('wild', [enemy], 0, player.uid, null);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
    return { battle, ctx };
  };
  it('blocks Intimidate', () => {
    const bare = setup(false, 'cs1'); resolveTurn(bare.ctx, { kind: 'move', index: 0 });
    const shaded = setup(true, 'cs1'); resolveTurn(shaded.ctx, { kind: 'move', index: 0 });
    expect(bare.battle.playerStages.atk).toBe(-1);
    expect(shaded.battle.playerStages.atk).toBe(0);
  });
  it('lets a slow holder use a status move first, only the first time', () => {
    const order = (shades: boolean, turn: number) => {
      const { ctx } = setup(shades, 'cs2');
      let ev = resolveTurn(ctx, { kind: 'move', index: 0 });
      for (let t = 1; t <= turn; t++) ev = resolveTurn(ctx, { kind: 'move', index: 0 });
      return ev.filter((e) => e.type === 'move').map((e) => (e as { side: string }).side)[0];
    };
    expect(order(false, 0)).toBe('enemy');
    expect(order(true, 0)).toBe('player');
    expect(order(true, 1)).toBe('enemy');
  });
});

describe("Damian's gym and the Burglary", () => {
  it('Damian: two friends, then Damian, who pays the Unofficial Badge, Water Pulse and sets the win flag', () => {
    expect(room(`${P}damian-n1`).choices[0]!.success.battle).toMatchObject({ kind: 'trainer', classId: 'swimmer' });
    expect(room(`${P}damian-n2`).choices[0]!.success.battle).toMatchObject({ kind: 'trainer', classId: 'firebreather' });
    const win = room(`${P}damian-n3`).choices[0]!.success.battle!.win;
    expect(win).toContainEqual({ kind: 'item', id: 'unofficial-badge', count: 1 });
    expect(win).toContainEqual(expect.objectContaining({ kind: 'teachMove', move: 'water-pulse' }));
    expect(content.catalog.get('unofficial-badge')).toBeTruthy();
  });
  it('the Burglary pays Dig and cools Rocket heat', () => {
    const win = room(`${P}burglary`).choices[0]!.success.battle!.win;
    expect(win).toContainEqual(expect.objectContaining({ kind: 'teachMove', move: 'dig' }));
    expect(win).toContainEqual(expect.objectContaining({ kind: 'evil', heat: -1 }));
  });
});

describe("Bill's Lighthouse (Kanto gate) and the Day-Care", () => {
  // Bill's Lighthouse was rebuilt as Greenneedle gn.09 (tests/unit/greenneedle2.test.ts); its Kanto gate opens the new lighthouse.
  it('the Kanto gate plays the Greenneedle lighthouse, and its ending copies the canon flags', () => {
    let run = structuredClone(begin('BILL2'));
    run.stage!.current = run.stage!.map.nodes.find((n) => n.column === 1)!.id;
    open(run, `${P}bill`);
    run = choose(run, `${P}bill`, 'Look for the lighthouse.').run;
    expect(run.stage!.pseudo?.id).toBe('ps_gn_lighthouse');
    for (let i = 1; i <= 3; i++) {
      run = choose(run, 'gn-09-search', 'Read the next sign.').run;
      run = choose(run, `gn-09-clue-${i}`, scene(run, `gn-09-clue-${i}`).labels[0]!).run;
    }
    run = choose(run, 'gn-09-search', 'Follow the beacon.').run;
    run = choose(run, 'gn-09-shore', 'Go up to the lighthouse.').run;
    run = choose(run, 'gn-09-cottage', 'Leave them.').run;
    run = choose(run, 'gn-09-stairs', 'Climb to the lamp room.').run;
    run = choose(run, 'gn-09-lamp', 'Press the button.').run;
    for (const n of [1, 2, 3]) run = choose(run, `gn-09-signal-${n}`, 'A rising song.').run;
    run = choose(run, 'gn-09-lamp', 'Go out onto the gallery.').run;
    run = choose(run, 'gn-09-gallery', 'Watch the water.').run;
    const out = win(choose(run, 'gn-09-dawn', 'Answer it, one more time.').run);
    const have = (id: string) => (out.inventory[id] ?? 0) + (out.passives?.[id] ?? 0);
    expect(have('ss-ticket')).toBeGreaterThan(0);
    expect(out.expansion!.canon!.flags).toEqual(expect.arrayContaining(['kanto.bill.pc', 'kanto.ssanne.ticket']));
    expect(out.expansion!.canon!.completed).toContain('cs.kanto.cerulean.bill');
  });
  it('a space finished by its first event still copies flags a later event sets', () => {
    const run = { expansion: { canon: { flags: [], completed: [], menus: {} } } };
    finishCanonSpace(canonKanto, run, 'cs.kanto.cerulean.bill', []);
    finishCanonSpace(canonKanto, run, 'cs.kanto.cerulean.bill', ['kanto.bill.pc']);
    finishCanonSpace(canonKanto, run, 'cs.kanto.cerulean.bill', ['kanto.bill.pc']);
    expect(run.expansion.canon).toEqual({ flags: ['kanto.bill.pc'], completed: ['cs.kanto.cerulean.bill'], menus: {} });
  });
  it('the Day-Care trains the weakest for 150 and sells an Egg for 300', () => {
    const base = begin('DC');
    base.money = 1000;
    const weakest = Math.min(...base.party.map((m) => m.level));
    const { run, sideId } = debugForceEvent(content, structuredClone(base), `${P}daycare`);
    const out = chooseEvent(content, run, sideId, 0).run;
    expect(out.money).toBe(850);
    expect(Math.min(...out.party.map((m) => m.level))).toBeGreaterThanOrEqual(weakest + 1);
  });
});
