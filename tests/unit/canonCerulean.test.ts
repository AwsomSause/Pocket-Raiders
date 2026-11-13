import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { abilityOf, createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun, debugForceEvent } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
const heldCount = (run: ReturnType<typeof begin>, id: string) => (run.inventory[id] ?? 0) + run.party.reduce((n, m) => n + (m.held?.[id] ?? 0), 0);
const room = (id: string) => content.events.get(id)!;
const P = 'cs-kanto-cerulean-';

describe('Cerulean canon: the event graph', () => {
  it('every room opens from a gate, and every addEvent / addEventFrom target exists', () => {
    const ids = [...content.events.keys()].filter((id) => id.startsWith(P));
    const targets = (id: string) => room(id).choices.flatMap((c) => [c.success, c.failure]).flatMap((o) => [...(o?.effects ?? []), ...(o?.battle?.win ?? []), ...(o?.battle && 'lose' in o.battle ? o.battle.lose ?? [] : [])]).flatMap((e) => (e.kind === 'addEvent' ? [e.eventId] : e.kind === 'addEventFrom' ? e.ids : []));
    for (const id of ids) for (const t of targets(id)) expect(content.events.has(t), `${id} -> ${t}`).toBe(true);
    const reach = new Set<string>([`${P}bridge`, `${P}squad`, `${P}damian`, `${P}burglary`]);
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id)) if (!reach.has(t)) { reach.add(t); again = true; } }
    expect([...reach].sort()).toEqual(ids.sort());
  });
  it('the gates carry the catalog ids, and the Hidden Village is tagged as its own space', () => {
    expect(room(`${P}bridge`).canon).toBe('cs.kanto.cerulean.bridge');
    expect(room(`${P}village`).canon).toBe('cs.kanto.cerulean.hidden-village');
    expect(room(`${P}squad`).canon).toBe('cs.kanto.cerulean.squad');
    expect(room(`${P}damian`).canon).toBe('cs.kanto.cerulean.damian');
    expect(room(`${P}burglary`).canon).toBe('cs.kanto.cerulean.burglary');
  });
});

describe('Bridge Crossing', () => {
  it('is a 50% fall: both outcomes turn up, and a fall opens the Hidden Village and sets the story flag', () => {
    let safe = 0, fell = 0;
    for (let i = 0; i < 40; i++) {
      const { run, sideId } = debugForceEvent(content, structuredClone(begin('BR')), `${P}bridge`);
      run.seed = `BR${i}`;
      const out = chooseEvent(content, run, sideId, 0).run;
      if (out.story.flags['ev:kanto-bridge-fell']) { fell++; expect(out.expansion!.canon!.flags).toContain('kanto.bridge.fell'); } else safe++;
    }
    expect(safe).toBeGreaterThan(5);
    expect(fell).toBeGreaterThan(5);
  });
  it('Nugget Bridge is five trainers, and refusing the Grunt pays a Nugget and Intel', () => {
    const chains = [`${P}bridge-n1`, `${P}bridge-n2`].map((id) => room(id).choices[0]!.success.battle!.kind === 'trainer' ? (room(id).choices[0]!.success.battle as { chain: number }).chain : 0);
    expect(chains.reduce((a, b) => a + b, 0)).toBe(5);
    const before = begin('NB');
    const intel = (before.attributeModifiers.intelligence ?? 0);
    const { run, sideId } = debugForceEvent(content, structuredClone(before), `${P}bridge-n3`);
    const out = chooseEvent(content, run, sideId, 0).run;
    expect(out.money + heldCount(out, 'nugget') * 100).toBeGreaterThanOrEqual(before.money + 100);
    expect(out.attributeModifiers.intelligence).toBe(intel + 1);
  });
  it('accepting the Grunt is a trap: a free fight, a Nugget, and the recruit hook flag', () => {
    const win = room(`${P}bridge-n3`).choices[1]!.success.battle!.win;
    expect(win).toContainEqual({ kind: 'item', id: 'nugget', count: 1 });
    expect(win).toContainEqual({ kind: 'flag', key: 'rocket-recruit-offered', amount: 1 });
  });
});

describe('The Hidden Village', () => {
  const T = [['bulbasaur', 'skull-bash'], ['chikorita', 'ancient-power'], ['treecko', 'crunch'], ['turtwig', 'superpower'], ['snivy', 'dragon-pulse'], ['chespin', 'pin-missile'], ['rowlet', 'defog'], ['grookey', 'power-whip'], ['sprigatito', 'leech-seed']] as const;
  it('picks one of nine trials, each 1 in 9 (addEventFrom lists all nine)', () => {
    const e = room(`${P}hv-pick`).choices[0]!.success.effects.find((x) => x.kind === 'addEventFrom') as { ids: string[] };
    expect(e.ids).toEqual(T.map((_, i) => `${P}hv-t${i + 1}`));
  });
  it('every trial pays its Grass starter with the egg move on a win, and a Miracle Seed on a failure', () => {
    T.forEach(([sp, mv], i) => {
      const r = room(`${P}hv-t${i + 1}`);
      const outs = r.choices.flatMap((c) => [c.success, c.failure]).filter(Boolean);
      const wins = outs.flatMap((o) => [...o!.effects, ...(o!.battle?.win ?? [])]);
      expect(wins).toContainEqual(expect.objectContaining({ kind: 'join', species: [sp] }));
      expect(wins).toContainEqual(expect.objectContaining({ kind: 'teachMove', move: mv, species: sp }));
      const seed = [...outs.flatMap((o) => o!.effects), ...outs.flatMap((o) => (o!.battle && 'lose' in o!.battle ? o!.battle.lose ?? [] : []))];
      expect(seed).toContainEqual(expect.objectContaining({ kind: 'item', id: 'miracle-seed' }));
    });
  });
  it('a won trial adds the starter (with its move) waiting to join; a failed one gives a Miracle Seed', () => {
    let won = 0, lost = 0;
    for (let i = 0; i < 60 && (!won || !lost); i++) {
      const { run, sideId } = debugForceEvent(content, structuredClone(begin('HV')), `${P}hv-t2`);
      run.seed = `HV${i}`;
      const out = chooseEvent(content, run, sideId, 0).run;
      const pend = out.pending.flatMap((p) => (p.kind === 'caught' && p.mon.speciesId === 'chikorita' ? [p.mon] : []))[0];
      if (pend) { won++; expect(pend.moves.some((m) => m.id === 'ancient-power')).toBe(true); } else { lost++; expect(heldCount(out, 'miracle-seed')).toBe(1); }
    }
    expect(won).toBeGreaterThan(0);
    expect(lost).toBeGreaterThan(0);
  });
});

describe('Squirtle Squad', () => {
  it('Blastoise is fought only when your best Pokémon is 3+ levels over the stage', () => {
    const run = begin('SQ');
    const strong = structuredClone(run);
    strong.party[0]!.level = 99;
    const weak = structuredClone(run);
    weak.party[0]!.level = 1;
    expect(conditionMet(content, strong, { kind: 'partyLevelOver', over: 3 })).toBe(true);
    expect(conditionMet(content, weak, { kind: 'partyLevelOver', over: 3 })).toBe(false);
    expect(conditionMet(content, weak, { kind: 'partyLevelOver', over: 3, absent: true })).toBe(true);
  });
  it('the reward is a Squirtle with Contrary, Swagger and Hex, plus Cool Shades', () => {
    const { run, sideId } = debugForceEvent(content, structuredClone(begin('SQR')), `${P}squad-reward`);
    const out = chooseEvent(content, run, sideId, 0).run;
    const sq = out.pending.flatMap((p) => (p.kind === 'caught' && p.mon.speciesId === 'squirtle' ? [p.mon] : []))[0]!;
    expect(abilityOf(content, sq)).toBe('contrary');
    expect(sq.moves.map((m) => m.id)).toEqual(expect.arrayContaining(['swagger', 'hex']));
    expect(out.story.flags['ev:kanto-squad-joined']).toBe(1);
    expect(heldCount(out, 'cool-shades')).toBe(1);
  });
  it('is 65% the pranksters and 35% a standoff', () => {
    const c = room(`${P}squad`).choices[0]!;
    expect(c.chance).toBe(0.65);
  });
});

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
