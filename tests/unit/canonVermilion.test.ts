import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, startBattle, type BattleContext } from '../../src/core/battle/engine';
import { chooseEvent } from '../../src/core/events';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun, debugForceEvent, pseudoLost } from '../../src/core/run';
import { failCanonRaid, finishCanonRaid, restoreStash } from '../../src/core/expansion/canonRun';
import { pickRaidFor } from '../../src/core/raid/raid';
import { Rng, hashSeed } from '../../src/core/rng';
import { content } from './helpers';

const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
const P = 'cs-kanto-vermilion-';
const room = (id: string) => content.events.get(id)!;
const targets = (id: string) => room(id).choices.flatMap((c) => [c.success, c.failure]).flatMap((o) => [...(o?.effects ?? []), ...(o?.battle?.win ?? [])])
  .flatMap((e) => (e.kind === 'addEvent' ? [e.eventId] : e.kind === 'addEventFrom' ? e.ids : []));

describe('Vermilion canon: the event graph', () => {
  it('every target exists and every room opens from a gate', () => {
    const ids = [...content.events.keys()].filter((id) => id.startsWith(P));
    for (const id of ids) for (const t of targets(id)) expect(content.events.has(t), `${id} -> ${t}`).toBe(true);
    const gates = ['flight', 'market', 'fishclub', 'maiden', 'ssanne'].map((g) => P + g);
    const reach = new Set<string>(gates);
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id)) if (!reach.has(t)) { reach.add(t); again = true; } }
    expect([...reach].sort()).toEqual(ids.sort());
  });
  it('the gates carry the catalog ids, and the raid is the Kaiju space', () => {
    expect(room(`${P}flight`).canon).toBe('cs.kanto.vermilion.flightnorth');
    expect(room(`${P}ssanne`).canon).toBe('cs.kanto.vermilion.ssanne');
    expect(room(`${P}maiden`).canon).toBe('cs.kanto.vermilion.maiden');
    expect(room(`${P}market`).canon).toBe('cs.kanto.vermilion.market');
    expect(room(`${P}fishclub`).canon).toBe('cs.kanto.vermilion.fishclub');
    const raid = content.raids.raids.find((r) => r.canon === 'cs.kanto.vermilion.kaiju')!;
    expect(raid.shield!.at).toHaveLength(3);
    expect(raid.rewards.gift).toMatchObject({ species: 'tentacool', ability: 'huge-power', moves: ['liquidation'] });
  });
});

describe('Flight North', () => {
  it('is a 50% check: some walks are safe, some take the party and open the stage', () => {
    let safe = 0, stolen = 0;
    for (let i = 0; i < 40; i++) {
      const { run, sideId } = debugForceEvent(content, structuredClone(begin('FN')), `${P}flight`);
      run.seed = `FN${i}`;
      const party = run.party.length;
      const out = chooseEvent(content, run, sideId, 0).run;
      if (out.expansion?.canon?.stash) { stolen++; expect(out.party).toHaveLength(0); expect(out.expansion.canon.stash).toHaveLength(party); expect(out.story.flags['ev:kanto-flight-stolen']).toBe(1); } else { safe++; expect(out.party).toHaveLength(party); }
    }
    expect(safe).toBeGreaterThan(5);
    expect(stolen).toBeGreaterThan(5);
  });
  it('the rescuer joins at level 5 with no prompt, and is the only Pokémon', () => {
    const base = begin('FN2');
    const names = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const run0 = structuredClone(base);
      run0.seed = `FNR${i}`;
      const stolen = chooseEvent(content, ...(() => { const f = debugForceEvent(content, run0, `${P}flight`); f.run.expansion!.canon!.stash = structuredClone(f.run.party); f.run.party = []; return [f.run, f.sideId, 0] as const; })()).run;
      expect(stolen.party).toHaveLength(0);
      const { run, sideId } = debugForceEvent(content, stolen, `${P}flight-n1`);
      const out = chooseEvent(content, run, sideId, 0).run;
      expect(out.party).toHaveLength(1);
      expect(out.party[0]!.level).toBe(5);
      expect(out.pending.some((p) => p.kind === 'caught')).toBe(false);
      names.add(out.party[0]!.speciesId);
    }
    expect([...names].sort()).toEqual(['caterpie', 'weedle']);
  });
  it('each line evolves by node 5 and the boss is a level 20 Venomoth with the shiny rescue rule', () => {
    for (const [k, a, b, c] of [['c', 'caterpie', 'metapod', 'butterfree'], ['w', 'weedle', 'kakuna', 'beedrill']] as const) {
      const fx = (id: string) => room(`${P}flight-${k}${id}`).choices[0]!.success.effects;
      expect(fx('3')).toContainEqual({ kind: 'formChange', from: a, to: b });
      expect(fx('5')).toContainEqual({ kind: 'formChange', from: b, to: c });
      const boss = room(`${P}flight-${k}7`).choices[0]!.success.battle as { level: number; team: string[]; rule: { shinyRescue: boolean } };
      expect(boss).toMatchObject({ level: 20, team: ['venomoth'], rule: { shinyRescue: true } });
    }
  });
  it('a lost fight or a new ordinary battle gives the stolen team back', () => {
    const run = begin('FN3');
    const team = run.party.map((m) => m.uid);
    run.expansion = { ...run.expansion, canon: { ...run.expansion!.canon!, stash: structuredClone(run.party) } };
    run.party = [createPokemon(content, 'caterpie', 5, 'x1')];
    pseudoLost(content, run);
    expect(run.party.map((m) => m.uid)).toEqual(team);
    expect(run.expansion!.canon!.stash).toBeUndefined();
    expect(restoreStash(run)).toBe(false);
  });
  it('the goodbye restores the team', () => {
    const run = begin('FN4');
    const team = run.party.map((m) => m.uid);
    run.expansion = { ...run.expansion, canon: { ...run.expansion!.canon!, stash: structuredClone(run.party) } };
    run.party = [createPokemon(content, 'butterfree', 20, 'x2')];
    const f = debugForceEvent(content, run, `${P}flight-goodbye`);
    const out = chooseEvent(content, f.run, f.sideId, 0).run;
    expect(out.party.map((m) => m.uid)).toEqual(team);
  });
  it('the shiny rescue knocks the foe out once, when the lone hero drops under a quarter HP', () => {
    const hero = createPokemon(content, 'butterfree', 20, 'p1');
    const foe = createPokemon(content, 'venomoth', 20, 'e1');
    hero.hp = Math.floor(hero.hp / 5);
    foe.moves = [{ id: 'splash', pp: 40 }];
    const battle = createBattle('trainer', [foe], 0, hero.uid, { classId: 'event', name: 'Jessie & James' });
    battle.eventRule = { shinyRescue: true };
    const ctx: BattleContext = { content, battle, party: [hero], inventory: {}, rng: new Rng(hashSeed('rescue')), captureRng: new Rng(hashSeed('rescue-c')), catchMultiplier: 1 };
    startBattle(ctx);
    const events = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(JSON.stringify(events)).toContain('shiny');
    expect(battle.outcome).toBe('win');
    expect(battle.storyEffects).toContain('shiny-rescue');
  });
});

describe('S.S. Anne', () => {
  it('is 12 nodes on three decks, every one a trainer battle followed by trade offers', () => {
    for (let k = 1; k <= 12; k++) {
      const n = room(`${P}ssanne-n${k}`);
      expect(n.choices[0]!.success.battle!.kind).toBe('trainer');
      expect(room(`${P}ssanne-t${k}`).choices.filter((c) => c.success.effects.some((e) => e.kind === 'tradeFor'))).toHaveLength(3);
    }
    expect(room(`${P}ssanne-n12`).choices[0]!.success.battle!.win).toContainEqual({ kind: 'addEvent', eventId: `${P}ssanne-t12` });
  });
  it('the region trade swaps Pikachu for Alolan Raichu at the same level, keeping its item', () => {
    const run = begin('SS');
    const pika = createPokemon(content, 'pikachu', 17, 'tp');
    pika.held = { 'mystic-water': 1 };
    pika.friendship = 70;
    run.party = [run.party[0]!, pika];
    const f = debugForceEvent(content, run, `${P}ssanne-t1`);
    const out = chooseEvent(content, f.run, f.sideId, 1, 'tp').run;
    const got = out.party[1]!;
    expect(got.speciesId).toBe('raichu-alola');
    expect(got.level).toBe(17);
    expect(got.held).toEqual({ 'mystic-water': 1 });
    expect(got.friendship).toBe(71);
    expect(out.party).toHaveLength(2);
  });
  it('trade A stays within 40 base stats and picks a Nature; it is locked for a party with nothing to give', () => {
    const run = begin('SS2');
    const giving = run.party[0]!;
    const f = debugForceEvent(content, run, `${P}ssanne-t2`);
    const out = chooseEvent(content, f.run, f.sideId, 0, giving.uid).run;
    const bst = (id: string) => Object.values(content.species.get(id)!.baseStats).reduce((a, b) => a + b, 0);
    expect(out.party[0]!.level).toBe(giving.level);
    expect(Math.abs(bst(out.party[0]!.speciesId) - bst(giving.speciesId))).toBeLessThanOrEqual(40);
    expect(out.party[0]!.nature).toBeDefined();
  });
  it('the Captain, the rival and the Network Machine close the ship; the machine teaches any move', () => {
    expect(room(`${P}ssanne-reward`).choices[0]!.success.effects).toContainEqual({ kind: 'item', id: 'network-machine', count: 1 });
    expect(content.catalog.get('network-machine')!.effect).toEqual({ kind: 'teachMove', mode: 'hm' });
    expect(room(`${P}ssanne-rival`).choices[0]!.success.battle).toMatchObject({ kind: 'trainer', rival: true });
  });
});

describe("Maiden's Peak", () => {
  it('has five sightings, each with a left and a right, and a reachable summit', () => {
    for (let i = 1; i <= 5; i++) expect(room(`${P}maiden-n${i}`).choices.map((c) => c.label)).toEqual(['Run left', 'Run right']);
    expect([...new Set(targets(`${P}maiden-n5`))]).toEqual([`${P}maiden-top`]);
  });
  it('the TM Hall rotates 8 boards of 3 moves (24 moves) and teaches the bought move', () => {
    const boards = (room(`${P}maiden-square-a`).choices[1]!.success.effects[0] as { ids: string[] }).ids;
    expect(boards).toHaveLength(8);
    const moves = boards.flatMap((b) => room(b).choices.flatMap((c) => c.success.effects.filter((e) => e.kind === 'teachMove').map((e) => (e as { move: string }).move)));
    expect(new Set(moves).size).toBe(24);
    const run = begin('TM');
    run.money = 5000;
    const f = debugForceEvent(content, run, boards[1]!);
    const out = chooseEvent(content, f.run, f.sideId, 0).run;
    expect(out.money).toBeLessThan(5000);
    expect(out.party.some((m) => m.moves.some((mv) => mv.id === 'surf'))).toBe(true);
  });
  it('the summit pays Fairium Z on the long route, plus a Feather and a Tea House heal stop on the lucky one; HMs for an owner', () => {
    const at = (turns: number, owns: boolean) => {
      const run = begin('MP');
      run.story.flags['ev:kanto-maiden-turn'] = turns;
      if (owns) run.inventory['fairium-z'] = 1;
      return run;
    };
    const play = (turns: number, owns: boolean, index: number) => {
      const f = debugForceEvent(content, at(turns, owns), `${P}maiden-top`);
      return chooseEvent(content, f.run, f.sideId, index).run;
    };
    expect(play(1, false, 0).inventory['fairium-z']).toBe(1);
    const blessed = play(2, false, 1);
    expect(blessed.inventory['fairium-z']).toBe(1);
    expect((blessed.inventory['fairy-feather'] ?? 0) + blessed.party.reduce((n, m) => n + (m.held?.['fairy-feather'] ?? 0), 0)).toBeGreaterThanOrEqual(1);
    // HMs are applied the way drafts apply them: to a Pokémon that can learn a Fairy move, else sold. Three are handed over either way.
    const f = debugForceEvent(content, at(0, true), `${P}maiden-top`);
    const owner = chooseEvent(content, f.run, f.sideId, 2);
    expect(owner.changes.join(' ').match(/HM \(Fairy\)/g)).toHaveLength(3);
    expect(owner.run.inventory['fairium-z']).toBe(1);
  });
});

describe('Kaiju, the market and the Fan Club', () => {
  it('Tentacool arrives with Huge Power and Liquidation when the raid is won', () => {
    const gift = content.raids.raids.find((r) => r.id === 'kaiju-tentacruel')!.rewards.gift!;
    expect(content.moves.get(gift.moves[0]!)).toBeDefined();
    expect(content.species.get(gift.species)!.abilities.normal.concat(content.species.get(gift.species)!.abilities.hidden ?? [])).not.toContain('huge-power');
  });
  it('the Hero\'s stock opens only after the Kaiju flag', () => {
    expect(room(`${P}market`).choices[1]!.requires).toEqual([{ kind: 'flag', key: 'kanto-kaiju-won', atLeast: 1, atMost: 99 }]);
  });
  it('the Fan Club teaches fishing for a Good Rod', () => {
    const e = room(`${P}fishclub`).choices[0]!;
    expect(e.prompt).toEqual({ id: 'shout-tap', needs: 'good' });
    expect(e.success.effects).toContainEqual({ kind: 'item', id: 'good-rod', count: 1 });
    expect(e.failure!.effects).toContainEqual({ kind: 'item', id: 'good-rod', count: 1 });
  });
});

describe('Kaiju raid hooks', () => {
  it('winning finishes the space and sets the story flag the Harbor Market reads', () => {
    const run = begin('KR');
    finishCanonRaid(run, 'cs.kanto.vermilion.kaiju');
    expect(run.expansion!.canon!.completed).toContain('cs.kanto.vermilion.kaiju');
    expect(run.expansion!.canon!.flags).toContain('kanto.kaiju.won');
    expect(run.story.flags['ev:kanto-kaiju-won']).toBe(1);
  });
  it('losing shuts the Harbor Market stop for the stage', () => {
    const run = begin('KR2');
    const node = run.stage!.map.nodes[0]!;
    node.sides.push({ id: 'm', kind: 'event', used: false, eventId: `${P}market` });
    failCanonRaid(content, run, 'cs.kanto.vermilion.kaiju');
    expect(node.sides.find((sd) => sd.id === 'm')!.used).toBe(true);
  });
  it('the Kaiju den is never drawn as an ordinary raid', () => {
    for (let i = 0; i < 200; i++) expect(pickRaidFor(content, { seed: `k${i}`, regionIndex: 0 }, `${i}`).id).not.toBe('kaiju-tentacruel');
  });
});
