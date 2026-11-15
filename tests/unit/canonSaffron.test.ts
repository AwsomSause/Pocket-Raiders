import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { chooseEvent, conditionMet, eventBattleLost, eventBattleWon } from '../../src/core/events';
import { createPokemon, abilityOf } from '../../src/core/pokemon';
import { chooseStarter, createRun, debugForceEvent } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import { applyCanonEffect, ghostReturnEvent, ghostReturns, labRetryEvent, leaveCanonStash, nearestBst, restoreStash, ruleEvolution } from '../../src/core/expansion/canonSaffron';
import { falseSlotFor } from '../../src/core/expansion/labyrinth';
import { tourneyBracket, TOURNEY_ROUNDS } from '../../src/core/expansion/tourney';
import { evolutionTarget } from '../../src/core/evolution';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const begin = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { kantoCanon: true } }), 0);
const P = 'cs-kanto-saffron-';
const room = (id: string) => content.events.get(P + id)!;
const eff = (run: ReturnType<typeof begin>, action: string, extra: object = {}, seed = 'e') => applyCanonEffect(content, run, { kind: 'canon', action, species: [], ...extra } as never, new Rng(hashSeed(seed)));
const withParty = (seed: string, species: string[]) => {
  const run = begin(seed);
  run.party = species.map((s, i) => { const m = createPokemon(content, s, 30, `t${i}`); m.hp = 999; return m; });
  return run;
};
const targets = (id: string): string[] => room(id).choices.flatMap((c) => [c.success, c.failure]).flatMap((o) => [...(o?.effects ?? []), ...(o?.battle?.win ?? []), ...(o?.battle && 'lose' in o.battle ? o.battle.lose ?? [] : [])]).flatMap((x) => (x.kind === 'addEvent' ? [x.eventId] : x.kind === 'addEventFrom' ? x.ids : []));

describe('Saffron canon: the event graph', () => {
  it('every addEvent target exists, and every room is reached from a gate', () => {
    const ids = [...content.events.keys()].filter((id) => id.startsWith(P)).map((id) => id.slice(P.length));
    const gates = ['r25', 'tournament', 'dojo', 'copycat', 'silph', 'train', 'labyrinth', 'return-shuppet', 'return-duskull', 'return-drifloon', 'return-gastly', 'rival-return'];
    const reach = new Set<string>(gates);
    for (let again = true; again;) { again = false; for (const id of [...reach]) for (const t of targets(id)) { expect(content.events.has(t), `${id} -> ${t}`).toBe(true); if (!reach.has(t.slice(P.length))) { reach.add(t.slice(P.length)); again = true; } } }
    expect([...reach].sort()).toEqual(ids.sort());
  });
  it('the gates carry the catalog ids', () => {
    for (const [id, canon] of [['r25', 'route25'], ['tournament', 'tournament'], ['dojo', 'dojo'], ['copycat', 'copycat'], ['silph', 'silph'], ['train', 'train'], ['labyrinth', 'labyrinth']] as const) expect(room(id).canon).toBe(`cs.kanto.saffron.${canon}`);
  });
});

describe('Route 25: The Angry Mankey', () => {
  const win = (id: string) => (room(id).choices[0]!.success.battle as { win: object[] }).win;
  it('is five Mankey in a row with no healing: three, one, then a fifth that stands guard', () => {
    expect(room('r25').choices[0]!.success.effects).toContainEqual({ kind: 'addEvent', eventId: `${P}r25-1` });
    expect(room('r25-1').choices[0]!.success.battle).toMatchObject({ kind: 'wild', species: ['mankey'], chain: 3 });
    expect(room('r25-4').choices[0]!.success.battle).toMatchObject({ kind: 'wild', species: ['mankey'] });
    expect(room('r25-5').choices[0]!.success.battle).toMatchObject({ kind: 'wild', species: ['mankey'], rule: { foeStands: 1 } });
    for (const id of ['r25-1', 'r25-4', 'r25-5']) expect(JSON.stringify(room(id))).not.toContain('"heal"');
  });
  it("the thieves' camp is one node off the path, before or after the fight, and returns the food", () => {
    expect(room('r25').choices[1]!.success.effects).toContainEqual({ kind: 'addEvent', eventId: `${P}r25-camp` });
    expect(win('r25-camp')).toContainEqual({ kind: 'flag', key: 'r25-food', amount: 1 });
    expect(win('r25-camp-after')).toContainEqual({ kind: 'flag', key: 'r25-food', amount: 1 });
    expect(room('r25-after').choices.some((c) => c.success.effects.some((e) => e.kind === 'addEvent' && e.eventId === `${P}r25-camp-after`))).toBe(true);
  });
  it('the reward is Mankey with Swords Dance and Mach Punch; with the food returned it starts fonder (Bond +2) and the troop is in the crowd', () => {
    for (const id of ['r25-thanks', 'r25-claim']) {
      const fx = room(id).choices[0]!.success.effects;
      expect(fx).toContainEqual(expect.objectContaining({ kind: 'join', species: ['mankey'] }));
      expect(fx).toContainEqual(expect.objectContaining({ kind: 'teachMove', move: 'swords-dance', species: 'mankey' }));
      expect(fx).toContainEqual(expect.objectContaining({ kind: 'teachMove', move: 'mach-punch', species: 'mankey' }));
      expect(fx).toContainEqual({ kind: 'flag', key: 'kanto-mankey', amount: 1 });
      expect(fx).toContainEqual({ kind: 'addEvent', eventId: `${P}tournament` });
    }
    expect(room('r25-thanks').choices[0]!.success.effects.find((e) => e.kind === 'join')).toMatchObject({ friendship: 40 });
    expect(room('r25-claim').choices[0]!.success.effects.find((e) => e.kind === 'join')).not.toHaveProperty('friendship');
    expect(room('tc').choices.map((c) => c.requires![0])).toEqual([expect.objectContaining({ key: 'r25-food', atLeast: 1 }), expect.objectContaining({ key: 'r25-food', atMost: 0 })]);
  });
  it('a flawless run pays a Black Belt to the Mankey; a fainted Pokémon does not', () => {
    const run = begin('R25');
    run.pending.push({ kind: 'caught', mon: createPokemon(content, 'mankey', 10, 'm1') });
    expect(eff(run, 'flawless')).toMatch(/Black Belt/);
    expect((run.pending[0] as { mon: { held?: Record<string, number> } }).mon.held?.['black-belt']).toBe(1);
    const hurt = begin('R25b');
    hurt.party[0]!.hp = 0;
    expect(eff(hurt, 'flawless')).toBe('');
  });
  it('the fifth Mankey does not attack on the first turn, then fights', () => {
    const player = createPokemon(content, 'pikachu', 30, 'p');
    player.moves = [{ id: 'tackle', pp: 35 }];
    const enemy = createPokemon(content, 'mankey', 5, 'e');
    enemy.hp = 9999;
    const battle = createBattle('wild', [enemy], 0, player.uid, null);
    battle.eventRule = { foeStands: 1 };
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('stand')), captureRng: new Rng(hashSeed('stand-c')), catchMultiplier: 1 };
    const hp = player.hp;
    const first = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(JSON.stringify(first)).toContain('stands in front of the others');
    expect(player.hp).toBe(hp);
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(player.hp).toBeLessThan(hp);
  });
  it('a won event battle applies the flag when the reward room is played', () => {
    const { run, sideId } = debugForceEvent(content, structuredClone(begin('R25c')), `${P}r25-claim`);
    const out = chooseEvent(content, run, sideId, 0);
    expect(out.run.story.flags['ev:kanto-mankey']).toBe(1);
    expect(out.run.pending.some((p) => p.kind === 'caught' && p.mon.speciesId === 'mankey' && p.mon.moves.some((m) => m.id === 'mach-punch'))).toBe(true);
  });
});

describe('Fighting Tournament', () => {
  it('only Mankey or Primeape may enter, and entering stashes everyone else', () => {
    const run = withParty('T1', ['mankey', 'pikachu', 'eevee']);
    expect(room('tournament').choices[0]!.requires).toEqual([{ kind: 'partySpecies', species: 'mankey' }]);
    expect(conditionMet(content, run, { kind: 'partySpecies', species: 'mankey' })).toBe(true);
    expect(conditionMet(content, run, { kind: 'partySpecies', species: 'primeape' })).toBe(false);
    eff(run, 'solo', { species: ['mankey', 'primeape'] });
    expect(run.party.map((m) => m.speciesId)).toEqual(['mankey']);
    expect(run.expansion!.canon!.stash).toHaveLength(2);
    expect(restoreStash(run)).toBe(true);
    expect(run.party.map((m) => m.speciesId)).toEqual(['mankey', 'pikachu', 'eevee']);
    expect(run.expansion!.canon!.solo).toBeUndefined();
  });
  it('walking away from the node brings the party back', () => {
    const run = withParty('T2', ['pikachu', 'primeape', 'eevee']);
    eff(run, 'solo', { species: ['mankey', 'primeape'] });
    leaveCanonStash(run);
    expect(run.party.map((m) => m.speciesId)).toEqual(['pikachu', 'primeape', 'eevee']);
  });
  it('is five 1-on-1 rounds (Machop, Hawlucha, Throh, Hitmonchan, then a rival); prizes match the table; the foe is matched in level and stat total', () => {
    const rounds = ['t1', 't2', 't3', 't4', 't5a'].map((id) => room(id).choices[0]!.success.battle as never as { size: number; species?: string[]; rule: object; win: { kind: string; id?: string }[]; lose: object[]; mirror?: boolean });
    expect(rounds.every((r) => r.size === 1)).toBe(true);
    expect(rounds.slice(0, 4).map((r) => r.win.find((w) => w.kind === 'item')!.id)).toEqual(['muscle-band', 'protein', 'focus-sash', 'black-belt']);
    expect(rounds.slice(0, 4).every((r) => (r.rule as { matchLead: boolean; bstMatch: boolean }).matchLead && (r.rule as { bstMatch: boolean }).bstMatch)).toBe(true);
    expect(rounds[4]!.mirror).toBe(true);
    expect((rounds[4]!.rule as { evolveMid: boolean }).evolveMid).toBe(true);
    for (const r of rounds) expect(r.lose).toContainEqual(expect.objectContaining({ kind: 'canon', action: 'unsolo' }));
    const mankey = createPokemon(content, 'mankey', 20, 'x');
    expect(nearestBst(content, ['machoke', 'poliwrath'], mankey)).toBe('machoke');
    expect(['t1', 't2', 't3', 't4'].map((id) => (room(id).choices[0]!.success.battle as { species: string[] }).species[0])).toEqual(['machop', 'hawlucha', 'throh', 'hitmonchan']);
  });
  it('has a training montage between rounds (Power, Guard or Footwork) and a rival final with its own reason', () => {
    for (const n of [1, 2, 3, 4]) {
      const m = room(`tm${n}`);
      expect(m.choices.map((c) => c.label)).toEqual(['Power', 'Guard', 'Footwork']);
      for (const c of m.choices) expect(c.success.effects).toContainEqual(expect.objectContaining({ kind: 'tempEffect', battles: 5 - n }));
    }
    expect(room('tm4').choices[0]!.success.effects).toContainEqual({ kind: 'addEventFrom', ids: [`${P}t5a`, `${P}t5b`, `${P}t5c`] });
    expect(new Set(['t5a', 't5b', 't5c'].map((id) => room(id).intro)).size).toBe(3);
  });
  it('the title leaves a rival who returns in the next region wearing a home-made belt, once', () => {
    const run = withParty('T5', ['mankey']);
    eff(run, 'champion', { species: ['mankey'] });
    expect(run.expansion!.canon!.rival).toMatchObject({ species: 'mankey', returned: false });
    expect(room('rival-return')).toBeTruthy();
  });
  it('losing a round gives the party back', () => {
    const run = withParty('T3', ['mankey', 'pikachu']);
    eff(run, 'solo', { species: ['mankey'] });
    const lose = eventBattleLost(content, run, { eventId: `${P}t2`, choiceIndex: 0, sideId: 's', success: true });
    expect(lose.join(' ')).toMatch(/gathers/);
    expect(run.party).toHaveLength(2);
  });
  it("the title gives Champion's Entrance, Dynamic Punch, the belt and no Annihilape, ever", () => {
    const run = withParty('T4', ['primeape']);
    run.party[0]!.level = 80;
    expect(evolutionTarget(content, run.party[0]!)).toBe('annihilape');
    eff(run, 'champion', { species: ['mankey', 'primeape'] });
    const champ = run.party[0]!;
    expect(abilityOf(content, champ)).toBe('champions-entrance');
    expect(champ.moves.map((m) => m.id)).toContain('dynamic-punch');
    expect(champ.champion).toBe(true);
    expect(champ.look).toBe('champion');
    expect(evolutionTarget(content, champ)).toBeNull();
  });
});

describe("Champion's Fury", () => {
  const setup = (seed: string) => {
    const player = createPokemon(content, 'primeape', 40, 'p');
    player.fixedAbility = 'champions-fury';
    player.moves = [{ id: 'tackle', pp: 35 }];
    const enemy = createPokemon(content, 'snorlax', 40, 'e');
    enemy.moves = [{ id: 'tackle', pp: 35 }];
    const battle = createBattle('wild', [enemy], 0, player.uid, null);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 };
    return { battle, ctx };
  };
  it('raises one stat by two on entry, and its first attack goes first', () => {
    const { battle, ctx } = setup('cf');
    const ev = resolveTurn(ctx, { kind: 'move', index: 0 });
    const raised = Object.values(battle.playerStages).filter((n) => n === 2);
    expect(raised.length).toBeGreaterThanOrEqual(1);
    expect(ev.filter((e) => e.type === 'move').map((e) => (e as { side: string }).side)[0]).toBe('player');
  });
});

describe('Heat-of-battle evolution', () => {
  it('evolves the active Pokémon once at turn 3 or at half HP, never into Annihilape', () => {
    const run = begin('EV');
    const mankey = createPokemon(content, 'mankey', 30, 'm');
    const primeape = createPokemon(content, 'primeape', 40, 'pr');
    run.party = [mankey];
    run.battle = createBattle('trainer', [primeape], 0, mankey.uid, null);
    run.battle.eventRule = { evolveMid: true };
    run.battle.turn = 1;
    expect(ruleEvolution(content, run)).toHaveLength(0);
    run.battle.turn = 3;
    const out = ruleEvolution(content, run);
    expect(out).toHaveLength(1);
    expect(mankey.speciesId).toBe('primeape');
    expect(primeape.speciesId).toBe('primeape');
    expect(ruleEvolution(content, run)).toHaveLength(0);
  });
});

describe('Fighting Dojo, Copycat, Silph Lobby, Magnet Train', () => {
  it('the Dojo offers Hitmontop as a third choice 3 times in 20 (15%)', () => {
    const ids = (room('dojo').choices[0]!.success.battle as { win: { ids: string[] }[] }).win[0]!.ids;
    expect(ids.filter((i) => i === `${P}dojo-three`)).toHaveLength(3);
    expect(ids).toHaveLength(20);
    expect(room('dojo-two').choices.map((c) => c.success.effects[0])).toEqual([expect.objectContaining({ species: ['hitmonlee'] }), expect.objectContaining({ species: ['hitmonchan'] })]);
    expect(room('dojo-three').choices).toHaveLength(3);
  });
  it('the Copycat game is four claps and pays Mimic', () => {
    const c = room('copycat').choices[0]!;
    expect(c.prompt).toEqual({ id: 'copycat-claps', needs: 'good' });
    expect(c.success.effects).toContainEqual({ kind: 'teachMove', move: 'mimic' });
    const { run, sideId } = debugForceEvent(content, structuredClone(begin('CC')), `${P}copycat`);
    const out = chooseEvent(content, run, sideId, 0, undefined, 'perfect').run;
    expect(out.party[0]!.moves.some((m) => m.id === 'mimic')).toBe(true);
  });
  it('Silph: a Lapras below 40 heat, none above', () => {
    const run = begin('SI');
    expect(conditionMet(content, run, { kind: 'evil', heatBelow: 40 })).toBe(true);
    const hunted = structuredClone(run);
    hunted.story.evil = { ...(hunted.story.evil ?? {}), teamId: 'rocket', heat: 60 } as never;
    expect(conditionMet(content, hunted, { kind: 'evil', heatBelow: 40 })).toBe(false);
    const { run: r2, sideId } = debugForceEvent(content, structuredClone(run), `${P}silph`);
    const out = chooseEvent(content, r2, sideId, 0).run;
    expect(out.pending.some((p) => p.kind === 'caught' && p.mon.speciesId === 'lapras')).toBe(true);
  });
  it('the Magnet Train jumps ahead and can be refused', () => {
    expect(room('train').choices[0]!.success.effects).toEqual([{ kind: 'skipAhead' }]);
    expect(room('train').choices).toHaveLength(2);
  });
});

describe("Sabrina's Labyrinth", () => {
  it('starts with a ghost of the four, alone in the party, with everyone else stashed', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const run = withParty(`L${i}`, ['pikachu', 'eevee', 'mankey']);
      eff(run, 'ghostStart', {}, `g${i}`);
      expect(run.party).toHaveLength(1);
      expect(run.expansion!.canon!.stash).toHaveLength(3);
      seen.add(run.party[0]!.speciesId);
    }
    expect([...seen].sort()).toEqual(['drifloon', 'duskull', 'gastly', 'shuppet']);
  });
  it('levels along the road and evolves each line by its level, from L10 to L40', () => {
    const want: Record<string, string> = { shuppet: 'banette', drifloon: 'drifblim' };
    for (const base of ['shuppet', 'drifloon', 'duskull', 'gastly']) {
      const run = withParty(`LV${base}`, ['pikachu']);
      eff(run, 'ghostStart', {}, 'x');
      const ghost = run.party[0]!;
      run.party[0] = Object.assign(ghost, { speciesId: base });
      run.expansion!.canon!.lab!.ghost = base;
      for (const lv of [15, 20, 25, 30, 37, 40]) eff(run, 'ghostLevel', { level: lv });
      const final = run.party[0]!.speciesId;
      if (want[base]) expect(final).toBe(want[base]);
      if (base === 'duskull') expect(final).toBe('dusclops');
      if (base === 'gastly') expect(final).toBe('haunter');
      expect(run.party[0]!.level).toBe(40);
    }
  });
  it('never levels down after a loss', () => {
    const run = withParty('LD', ['pikachu']);
    eff(run, 'ghostStart');
    eff(run, 'ghostLevel', { level: 30 });
    eff(run, 'ghostLevel', { level: 15 });
    expect(run.party[0]!.level).toBe(30);
  });
  it('each lantern frees one of your Pokémon, and the end gives them all back and owes the ghost', () => {
    const run = withParty('LF', ['pikachu', 'eevee']);
    eff(run, 'ghostStart');
    expect(eff(run, 'ghostFree')).toMatch(/freed/);
    expect(eff(run, 'ghostFree')).toMatch(/freed/);
    expect(eff(run, 'ghostFree')).toMatch(/empty/);
    expect(eff(run, 'ghostEnd')).toMatch(/farewell/);
    expect(run.party.map((m) => m.speciesId)).toEqual(['pikachu', 'eevee']);
    expect(run.party.every((m) => m.hp > 0)).toBe(true);
    expect(run.expansion!.canon!.lab).toMatchObject({ active: false, done: true, owed: true, returned: false });
    expect(run.expansion!.canon!.solo).toBeUndefined();
  });
  it('walking away abandons the Labyrinth with no reward', () => {
    const run = withParty('LA', ['pikachu', 'eevee']);
    eff(run, 'ghostStart');
    leaveCanonStash(run);
    expect(run.party.map((m) => m.speciesId)).toEqual(['pikachu', 'eevee']);
    expect(run.expansion!.canon!.lab).toBeUndefined();
  });
  it('the finale rescues you instead of losing: the foe goes down and you win', () => {
    const run = begin('LR');
    const ghost = createPokemon(content, 'gengar', 40, 'gh');
    ghost.moves = [{ id: 'tackle', pp: 35 }];
    ghost.hp = 1;
    const alakazam = createPokemon(content, 'alakazam', 80, 'al');
    alakazam.moves = [{ id: 'psychic', pp: 10 }];
    const battle = createBattle('trainer', [alakazam], 0, ghost.uid, null);
    battle.eventRule = { ghostRescue: true };
    const ctx: BattleContext = { content, battle, party: [ghost], inventory: {}, rng: new Rng(hashSeed('rescue')), captureRng: new Rng(hashSeed('rescuec')), catchMultiplier: 1 };
    for (let i = 0; i < 4 && !battle.outcome; i++) resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.outcome).toBe('win');
    expect(ghost.hp).toBeGreaterThan(0);
    expect(run.party.length).toBeGreaterThan(0);
  });
  it('the ghost returns at the parallel stage of the next region, holding its stone and knowing Haunting', () => {
    const run = withParty('LRT', ['pikachu']);
    eff(run, 'ghostStart', {}, 'x');
    run.expansion!.canon!.lab!.ghost = 'gastly';
    eff(run, 'ghostEnd');
    const lab = run.expansion!.canon!.lab!;
    run.regionIndex = lab.regionIndex + 1;
    run.stage = { ...run.stage!, kind: 'stage', index: lab.stageIndex };
    expect(ghostReturnEvent(content, run)).toBe(`${P}return-gastly`);
    run.stage = { ...run.stage!, index: lab.stageIndex + 1 };
    expect(ghostReturnEvent(content, run)).toBeNull();
    expect(ghostReturns(content, run, 45)).toMatch(/join/);
    const mon = (run.pending.find((p) => p.kind === 'caught') as { mon: ReturnType<typeof createPokemon> }).mon;
    expect(mon.speciesId).toBe('gengar');
    expect(mon.held).toEqual({ gengarite: 1 });
    expect(mon.moves.map((m) => m.id)).toContain('haunting');
    expect(ghostReturns(content, run, 45)).toBe('');
  });
});

describe('Haunting and Haunted', () => {
  const setup = (seed: string, trainer = false) => {
    const player = createPokemon(content, 'gengar', 50, 'p');
    player.moves = [{ id: 'haunting', pp: 5 }, { id: 'splash', pp: 40 }];
    const enemy = createPokemon(content, 'wailord', 100, 'e');
    enemy.moves = [{ id: 'splash', pp: 40 }];
    const battle = createBattle(trainer ? 'trainer' : 'wild', [enemy], 0, player.uid, trainer ? { classId: 'gym-leader', name: 'Sabrina', leaderId: null } : null);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 };
    return { battle, ctx, enemy, player };
  };
  it('is an 80-power special Ghost hit that starts the Haunted cycle', () => {
    const m = content.moves.get('haunting')!;
    expect([m.type, m.category, m.power]).toEqual(['ghost', 'special', 80]);
    const { battle, ctx, enemy } = setup('hh');
    const ev = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(ev.some((e) => e.type === 'damage' && (e as { side: string }).side === 'enemy')).toBe(true);
    expect(enemy.hp).toBeLessThan(createPokemon(content, 'wailord', 100, 'z').hp);
    expect(battle.enemyVolatile.hauntedTurns).toBe(4);
  });
  it('lasts exactly four turns, then ends and cannot be re-applied for two turns', () => {
    const { battle, ctx } = setup('hh2');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.enemyVolatile.haunted).toBe(2);
    resolveTurn(ctx, { kind: 'move', index: 1 });
    resolveTurn(ctx, { kind: 'move', index: 1 });
    expect(battle.enemyVolatile.haunted).toBe(4);
    resolveTurn(ctx, { kind: 'move', index: 1 });
    expect(battle.enemyVolatile.haunted).toBe(0);
    expect(battle.enemyVolatile.hauntLock).toBe(2);
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.enemyVolatile.haunted, `locked, outcome ${battle.outcome} hp ${ctx.battle.enemyTeam[0]!.hp}`).toBe(0);
    resolveTurn(ctx, { kind: 'move', index: 1 });
    expect(battle.outcome, 'still running').toBeNull();
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.enemyVolatile.haunted).toBe(2);
  });
  it('a boss is Haunted for two turns only', () => {
    const { battle, ctx } = setup('hh3', true);
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.enemyVolatile.hauntedTurns).toBe(2);
    resolveTurn(ctx, { kind: 'move', index: 1 });
    expect(battle.enemyVolatile.haunted).toBe(0);
  });
});

describe("Sabrina's Labyrinth rebuilt", () => {
  const ids = ['lab-lost', 'lab-n1', 'lab-n2', 'lab-n3', 'lab-n4', 'lab-n5', 'lab-n6', 'lab-final'];
  it('has the six rooms and the finale, every one with a way on', () => {
    for (const id of ids) expect(content.events.has(P + id), id).toBe(true);
    for (const id of ids.slice(0, -1)) expect(targets(id).length, id).toBeGreaterThan(0);
  });
  it('the finale is the false-slot fight with the ghost rescue, and a loss sends you back', () => {
    const b = room('lab-final').choices[0]!.success.battle as unknown as { rule: Record<string, boolean>; lose: object[] };
    expect(b.rule).toMatchObject({ falseSlot: true, ghostRescue: true });
    expect(b.lose).toContainEqual(expect.objectContaining({ action: 'labRetry' }));
  });
  it('the false slot is stable, hidden until every second turn, and never points at itself', () => {
    for (let turn = 1; turn < 30; turn++) {
      const a = falseSlotFor(turn, 'u1', 4)!;
      expect(a).toEqual(falseSlotFor(turn, 'u1', 4));
      expect(a.to).not.toBe(a.slot);
      expect(a.seen).toBe(turn % 2 === 0);
    }
    expect(falseSlotFor(1, 'u1', 1)).toBeNull();
  });
  it('a false slot uses another move; a seen one shows nothing different in the engine', () => {
    const player = createPokemon(content, 'gengar', 50, 'p');
    player.moves = [{ id: 'shadow-ball', pp: 15 }, { id: 'splash', pp: 40 }];
    const enemy = createPokemon(content, 'wailord', 100, 'e');
    enemy.moves = [{ id: 'splash', pp: 40 }];
    const battle = createBattle('trainer', [enemy], 0, player.uid, { classId: 'gym-leader', name: 'Sabrina', leaderId: null });
    battle.eventRule = { falseSlot: true } as never;
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('fs')), captureRng: new Rng(hashSeed('fsc')), catchMultiplier: 1 };
    const lie = falseSlotFor(battle.turn, player.uid, 2, [true, true])!;
    const ev = resolveTurn(ctx, { kind: 'move', index: lie.slot });
    expect(ev.some((e) => e.type === 'raid' && /twists/.test((e as { text: string }).text))).toBe(true);
    expect(player.moves[lie.to]!.pp).toBeLessThan(player.moves[lie.to]!.id === 'splash' ? 40 : 15);
  });
  it('a loss resets the Labyrinth, or resumes at the room reached with the accessibility setting', () => {
    const run = withParty('LR', ['pikachu', 'eevee']);
    eff(run, 'ghostStart');
    eff(run, 'ghostFree');
    eff(run, 'labRoom', { level: 3 });
    expect(labRetryEvent(content, run)).toBe(P + 'lab-n1');
    expect(run.expansion!.canon!.lab!.freed).toEqual([]);
    eff(run, 'ghostFree');
    eff(run, 'labRoom', { level: 3 });
    run.expansion!.canon!.labResume = true;
    expect(labRetryEvent(content, run)).toBe(P + 'lab-n4');
    expect(run.expansion!.canon!.lab!.freed).toHaveLength(1);
  });
});

describe('Saved shapes', () => {
  it('a run with a stash and a Labyrinth record still parses', () => {
    const run = withParty('SV', ['pikachu', 'eevee']);
    eff(run, 'ghostStart');
    expect(RunStateSchema.safeParse(JSON.parse(JSON.stringify(run))).success).toBe(true);
  });
});

describe('Fighting Tournament bracket and winning cutscene', () => {
  const run = () => withParty('TB', ['mankey']);
  it('every tournament event shows the bracket strip; the win beats show the champion podium', () => {
    const now = (id: string) => room(id).scene.tourney;
    expect(['tournament', 'tc'].map(now)).toEqual([0, 0]);
    expect([1, 2, 3, 4].map((n) => now(`t${n}`))).toEqual([1, 2, 3, 4]);
    expect([1, 2, 3, 4].map((n) => now(`tm${n}`))).toEqual([2, 3, 4, 5]);
    expect(['t5a', 't5b', 't5c'].map(now)).toEqual([5, 5, 5]);
    expect(['t-win1', 't-win2', 't-win3'].map(now)).toEqual([6, 6, 6]);
  });
  it('the final leads into the winning cutscene, three beats, after the title is given', () => {
    const win = (room('t5a').choices[0]!.success.battle as unknown as { win: { kind: string; eventId?: string }[] }).win;
    expect(win.findIndex((w) => w.kind === 'canon')).toBeLessThan(win.findIndex((w) => w.eventId === `${P}t-win1`));
    expect(targets('t-win1')).toEqual([`${P}t-win2`]);
    expect(targets('t-win2')).toEqual([`${P}t-win3`, `${P}t-win3`]);
  });
  it('the bracket has 32 entrants, you at the top, the named competitors in order, and the same every time', () => {
    const a = tourneyBracket(content, run(), 1);
    const b = tourneyBracket(content, run(), 1);
    expect(a.entrants).toHaveLength(32);
    expect(a.entrants[0]).toMatchObject({ you: true, species: 'mankey' });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.survivors.map((c) => c.length)).toEqual([32, 16, 8, 4, 2, 1]);
    expect(a.opponents.map((o) => o?.species)).toEqual(['machop', 'hawlucha', 'throh', 'hitmonchan', 'mankey']);
    expect(a.opponents[4]).toMatchObject({ named: true, name: 'Rival Mankey' });
    expect(TOURNEY_ROUNDS).toHaveLength(5);
  });
  it('rounds already played show who is out; the champion is the one left', () => {
    const v = tourneyBracket(content, run(), 3);
    expect(v.entrants.filter((e) => e.outIn > 0 && e.outIn <= 2)).toHaveLength(32 - 8);
    const done = tourneyBracket(content, run(), 6);
    expect(done.survivors[5]![0]).toMatchObject({ you: true });
  });
});
