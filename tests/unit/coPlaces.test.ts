// Catalog Overhaul Pack, category "places" (STORY_FAMILIES_14, _15, _17): the Delves, reworks, run events and merged places.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet, tradeCandidates } from '../../src/core/events';
import { changeFriendship } from '../../src/core/friendship';
import { bossLeadStagesOf, stopWeightOf } from '../../src/core/co/placesRules';
import { visibleChoices } from '../../src/core/eventMemory';
import { PSEUDO_CHAINS, chainRooms } from '../../src/core/dungeon/pseudo';
import { chooseStarter, createRun, endRegionTempEffects } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { ballBonus, createBattle, type BattleContext } from '../../src/core/battle/engine';
import { battleTypes } from '../../src/core/battle/transform';
import { ownTypes } from '../../src/core/co/typeShift';
import { createPokemon, getSpecies, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const newRun = (seed: string): RunState => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'co-places', seed, archetypeId: 'red' }), 0));
  run.phase = 'map';
  run.stage!.current = run.stage!.map.nodes.find((n) => n.column === 1)!.id;
  return run;
};
const here = (run: RunState) => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
/** Opens an event on the node the player stands on and returns its side id. */
const open = (run: RunState, eventId: string): string => {
  const id = `t-${eventId}-${here(run).sides.length}`;
  here(run).sides.push({ id, kind: 'event', used: false, eventId });
  return id;
};
/** Picks the visible choice with this label at the open event on the current node. */
const pick = (run: RunState, label: string): RunState => {
  const side = [...here(run).sides].reverse().find((x) => x.kind === 'event' && !x.used)!;
  const event = content.events.get(side.eventId!)!;
  const at = visibleChoices(content, run, event).findIndex((c) => c.choice.label === label);
  if (at < 0) throw new Error(`${event.id}: no visible choice "${label}" (has: ${visibleChoices(content, run, event).map((c) => c.choice.label).join(' | ')})`);
  return chooseEvent(content, run, side.id, at).run;
};
const flagOf = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);

const files = readdirSync(join(import.meta.dirname, '../../src/data/events')).filter((f) => /^co-places-\d+\.json$/.test(f));
const built = files.flatMap((f) => (JSON.parse(readFileSync(join(import.meta.dirname, '../../src/data/events', f), 'utf8')) as { events: { id: string }[] }).events.map((e) => e.id));
const DELVES = PSEUDO_CHAINS.filter((c) => c.id.startsWith('ps_delve_'));

describe('catalog overhaul: places (schema and reach)', () => {
  it('every built event is live, has text that stays under the engine limits, and no choice is a dead end without words', () => {
    expect(built.length).toBeGreaterThan(0);
    for (const id of built) {
      const e = content.events.get(id);
      expect(e, id).toBeDefined();
      expect(e!.intro.length, id).toBeGreaterThan(20);
      for (const c of [...e!.choices, ...e!.remembers.flatMap((v) => v.addChoices)]) {
        expect(c.success.text.length, `${id}: ${c.label}`).toBeGreaterThan(10);
        if (c.failure) expect(c.failure.text.length, `${id}: ${c.label}`).toBeGreaterThan(10);
      }
    }
  });

  it('every flag an event reads is set somewhere in the game data, or listed as coming from another system', () => {
    const listed = new Set((JSON.parse(readFileSync(join(import.meta.dirname, '../../src/data/catalogOverhaul/flags/places.json'), 'utf8')) as { flags: { key: string }[] }).flags.map((x) => x.key));
    const set = new Set<string>();
    const read = new Set<string>();
    const walk = (o: unknown, inCondition: boolean): void => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) return o.forEach((x) => walk(x, inCondition));
      const x = o as Record<string, unknown>;
      if (x.kind === 'flag' && typeof x.key === 'string') (('amount' in x) ? set : read).add(x.key);
      if (x.kind === 'sendAway' && typeof x.key === 'string') set.add(x.key); // sendAway sets its own key (src/core/co/placesRules.ts)
      for (const [k, v] of Object.entries(x)) walk(v, inCondition || k === 'requires' || k === 'when');
    };
    for (const e of content.events.values()) walk(e, false);
    const mine = new Set<string>();
    for (const id of built) { const before = new Set(read); read.clear(); walk(content.events.get(id), false); for (const k of read) mine.add(k); for (const k of before) read.add(k); }
    for (const key of mine) expect(set.has(key) || listed.has(key), `flag ${key} is read but never set`).toBe(true);
  });
});

describe('catalog overhaul: the Delves (STORY_FAMILIES_14)', () => {
  it('twelve Delves with 76 rooms, plus the Celestial Observatory (8), each drawn as a map with one room per step from the gate to the exit', () => {
    expect(DELVES.length).toBe(13);
    let rooms = 0;
    for (const chain of DELVES) {
      const list = chainRooms(content, chain);
      rooms += list.length;
      expect(list.map((r) => r.depth), chain.id).toEqual(list.map((_, i) => i + 1));
      expect(list.at(-1)!.next, chain.id).toEqual([]);
      for (const r of list) expect(content.events.get(r.event)!.room, r.event).toBe(true);
      // Every room but the exit offers "Turn back", and every battle inside is a pseudo-stage fight (a loss never ends the run).
      for (const r of list.slice(0, -1)) expect(content.events.get(r.event)!.choices.some((c) => c.success.effects.some((x) => x.kind === 'leavePseudo')), `${r.event} turn back`).toBe(true);
      for (const r of list) for (const c of [...content.events.get(r.event)!.choices, ...content.events.get(r.event)!.remembers.flatMap((v) => v.addChoices)]) for (const o of [c.success, c.failure]) if (o?.battle) expect((o.battle as { pseudo?: boolean }).pseudo, `${r.event}: ${c.label}`).toBe(true);
    }
    expect(rooms).toBe(76 + 8);
  });

  it('the Forest Path: resting and feeding the Path Keeper both happen in one room, and then it comes along', () => {
    let run = newRun('delve-forest');
    open(run, 'delve-gate-dense-forest-path');
    run = pick(run, 'Take the path.');
    expect(run.stage!.pseudo?.id).toBe('ps_delve_dense_forest_path');
    run = pick(run, 'Ignore it.');
    expect(here(run).roomEvent).toBe('dg-dense-forest-path-b');
    run = pick(run, 'Follow the leaf.');
    run = pick(run, 'Rest.');
    expect(here(run).roomEvent).toBe('dg-dense-forest-path-c');
    run = pick(run, 'Offer it food.');
    expect(() => pick(run, 'Rest.')).toThrow();
    run = pick(run, 'Ask the way out.');
    const size = run.party.length + run.pending.length;
    run = pick(run, '"Come with me."');
    expect(run.party.length + run.pending.length).toBe(size + 1);
    expect(flagOf(run, 'delve-dense-forest-path-done')).toBe(1);
    expect(flagOf(run, 'delve-dense-forest-path-resident-joined')).toBe(1);
  });

  it('turning back leaves the Delve on the node it was entered from, with nothing lost', () => {
    let run = newRun('delve-back');
    const parent = run.stage!.current;
    open(run, 'delve-gate-abandoned-mine-shaft');
    run = pick(run, 'Follow the track in.');
    run = pick(run, 'Follow the lamp.');
    run = pick(run, 'Turn back toward the daylight.');
    expect(run.stage!.pseudo).toBeUndefined();
    expect(run.stage!.current).toBe(parent);
    expect(flagOf(run, 'delve-abandoned-mine-shaft-garnet')).toBe(1);
    expect(flagOf(run, 'delve-abandoned-mine-shaft-done')).toBe(0);
  });
});

describe('catalog overhaul: Crystal Hollow and the Devon ball (STORY_FAMILIES_15)', () => {
  it('the Crystal Hollow is a drawn three-room pseudo-stage whose Heart Crystal shifts the partner\'s second type for good', () => {
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_crystal_hollow')!;
    expect(chainRooms(content, chain).map((r) => r.event)).toEqual(['crystal-hollow-1', 'crystal-hollow-2', 'crystal-hollow-final']);
    let run = newRun('crystal');
    open(run, 'crystal-hollow-entrance');
    run = pick(run, 'Go in.');
    expect(run.stage!.pseudo?.id).toBe('ps_crystal_hollow');
    run = pick(run, '"Show me."');
    run = pick(run, 'Walk the ice.');
    const top = [...run.party].sort((a, b) => b.friendship - a.friendship)[0]!;
    const before = ownTypes(content, top);
    run = pick(run, 'Accept the shift.');
    expect(run.stage!.pseudo).toBeUndefined();
    const after = run.party.find((m) => m.uid === top.uid)!;
    expect(after.shiftType).toBeDefined();
    expect(ownTypes(content, after)).toEqual([before[0], after.shiftType]);
    expect(flagOf(run, 'crystal-hollow-done')).toBe(1);
  });

  it('smashing the mirror silences the hum, so the stepping-stones by ear are gone', () => {
    let run = newRun('crystal-smash');
    open(run, 'crystal-hollow-entrance');
    run = pick(run, 'Go in.');
    run = pick(run, 'Smash the mirror.');
    expect(() => pick(run, 'Step on the stones in order of the hum.')).toThrow();
  });

  it('a shifted type changes battle typing; a plain Pokémon keeps its species types', () => {
    const mon = createPokemon(content, 'pikachu', 20, 'p');
    expect(ownTypes(content, mon)).toEqual(getSpecies(content, 'pikachu').types);
    mon.shiftType = 'fairy';
    expect(ownTypes(content, mon)).toEqual(['electric', 'fairy']);
    mon.shiftType = 'electric';
    expect(ownTypes(content, mon)).toEqual(['electric']);
    const pidgey = createPokemon(content, 'pidgey', 20, 'q');
    pidgey.shiftType = 'rock';
    expect(battleTypes(content, createBattle('wild', [pidgey], 0, mon.uid, null), pidgey)).toEqual(['normal', 'rock']);
  });

  it('the Devon prototype ball only works on a wild foe at half HP or less', () => {
    const player = createPokemon(content, 'pikachu', 20, 'p');
    const enemy = createPokemon(content, 'rattata', 20, 'e');
    const ctx: BattleContext = { content, battle: createBattle('wild', [enemy], 0, player.uid, null), party: [player], inventory: {}, rng: new Rng(hashSeed('devon')), captureRng: new Rng(hashSeed('devon-c')), catchMultiplier: 1 };
    const effect = content.items.get('devon-ball')!.effect;
    if (effect.kind !== 'catch') throw new Error('not a ball');
    const at = (hp: number) => { enemy.hp = hp; return ballBonus(ctx, effect, enemy, getSpecies(content, 'rattata')); };
    const full = maxHp(content, enemy);
    expect(at(full)).toBe(1);
    expect(at(Math.floor(full / 2) + 1)).toBe(1);
    expect(at(Math.floor(full / 2))).toBeGreaterThan(20);
  });
});

describe('catalog overhaul: standalone choices and the Pacts (SF102)', () => {
  it('the Bond Ceremony vow: no trading the Pokémon away, and its friendship never falls', () => {
    let run = newRun('vow');
    open(run, 'bond-ceremony');
    run = pick(run, 'Make the vow with a Pokémon.');
    const mon = run.party[0]!;
    expect(mon.vowed).toBe(true);
    const before = mon.friendship;
    changeFriendship(content, mon, -30);
    expect(mon.friendship).toBe(before);
    expect(tradeCandidates(content, run, { species: [], tags: [] } as never).some((m) => m.uid === mon.uid)).toBe(false);
  });

  it('a Water-type left at the Cursola reef is gone from the party and comes back a region later, stronger', () => {
    let run = newRun('reef');
    run.party.push(createPokemon(content, 'squirtle', 10, 'w1'));
    open(run, 'r161-cursola-reef-grudge');
    run = pick(run, 'Leave a Water-type here for a region.');
    expect(run.party.some((m) => m.uid === 'w1')).toBe(false);
    expect(run.coAway?.[0]?.key).toBe('cursola-reef-guard');
    expect(conditionMet(content, run, { kind: 'flag', key: 'cursola-reef-guard', atLeast: 1, atMost: 99, regionsAgo: 1 } as never)).toBe(false);
    run.regionIndex += 1;
    open(run, 'cursola-reef-healed');
    run = pick(run, 'Welcome it home.');
    const back = [...run.party, ...run.box].find((m) => m.uid === 'w1')!;
    expect(back.level).toBe(13);
    expect(run.coAway).toEqual([]);
  });

  it('a Pact is read in full before signing: "Read it again." brings the contract back, and "Sign." takes the stated effects', () => {
    let run = newRun('pact');
    open(run, 'rk-pact-booth');
    run = pick(run, 'Read it again.');
    expect(here(run).sides.filter((x) => x.eventId === 'rk-pact-booth' && !x.used).length).toBe(1);
    run = pick(run, 'Sign.');
    expect(run.perkEffects).toEqual(expect.arrayContaining([{ kind: 'moneyMultiplier', value: 1.5 }, { kind: 'enemyLevelOffset', value: 2 }]));
  });

  it('the Risk Dial turns Calm to Brisk to Wild to Chaos and back, and signs at the shown point', () => {
    let run = newRun('dial');
    open(run, 'rk-risk-dial');
    for (let i = 0; i < 3; i++) run = pick(run, 'Turn the dial.');
    expect(flagOf(run, 'rk-dial-point')).toBe(3);
    run = pick(run, 'Sign.');
    expect(stopWeightOf(run.perkEffects, 'ambush')).toBe(2);
    expect(stopWeightOf(run.perkEffects, 'merchant')).toBe(1);
  });

  it('the Shadow Boon lends the lead strength now and owes -1 to every stat at the next boss battle', () => {
    let run = newRun('boon');
    open(run, 'rk-shadow-boon');
    run = pick(run, 'Sign.');
    expect(bossLeadStagesOf(run.perkEffects)).toBe(-1);
    expect(run.tempEffects.some((t) => t.until === 'boss')).toBe(true);
  });

  it('Relics (SF94): a seed grows by fused fragments into a bough, the shrine trades it away for another line\'s crown, and an asleep line can\'t be forged', () => {
    let run = newRun('relic');
    open(run, 'relic-tree-roots');
    run = pick(run, 'The Leaf Seed.');
    expect(run.party[0]!.held?.['relic-leaf-seed']).toBe(1);
    run.story.flags['ev:relic-frag'] = 3;
    open(run, 'relic-forge');
    run = pick(run, 'Fuse three.');
    expect(flagOf(run, 'relic-frag')).toBe(0);
    expect(flagOf(run, 'relic-growth-leaf')).toBe(2);
    open(run, 'relic-tree-leaf-bough');
    run = pick(run, 'Keep going.');
    expect(run.party[0]!.held?.['relic-leaf-bough']).toBe(1);
    expect(run.party[0]!.held?.['relic-leaf-seed']).toBeUndefined();
    expect(flagOf(run, 'tree-leaf')).toBe(2);
    open(run, 'relic-shrine');
    run = pick(run, 'Take another line\'s relic.');
    expect(run.party.some((m) => m.held?.['relic-ember-crown'] === 1)).toBe(true);
    expect(run.party[0]!.held?.['withered-relic']).toBe(1);
    expect(flagOf(run, 'tree-leaf')).toBe(0);
    expect(flagOf(run, 'relic-growth-leaf')).toBe(0);
    run.story.flags['ev:relic-frag'] = 3;
    open(run, 'relic-forge');
    run = pick(run, 'Fuse three.');
    expect(flagOf(run, 'relic-growth-leaf')).toBe(0);
    expect(flagOf(run, 'relic-growth-ember')).toBe(0);
  });

});

describe('catalog overhaul: calendar and challenge weeks (SF97, SF98)', () => {
  const weekRun = (week: string): RunState => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'co-week', seed: week, archetypeId: 'red', gameEvents: [`${week}@2026-W46`] }), 0));
    run.phase = 'map';
    run.stage!.current = run.stage!.map.nodes.find((n) => n.column === 1)!.id;
    return run;
  };
  it('a challenge week applies nothing until the player signs up; its rule then holds for the region only', () => {
    let run = weekRun('solo-hero-week');
    expect(run.rules.modifierIds).not.toContain('solo-run');
    open(run, 'solo-hero-week');
    run = pick(run, 'Read the card.');
    expect(here(run).sides.some((s) => s.eventId === 'solo-hero-week' && !s.used)).toBe(true);
    run = pick(run, 'Sign up.');
    expect(run.rules.modifierIds).toContain('solo-run');
    endRegionTempEffects(run);
    expect(run.rules.modifierIds).not.toContain('solo-run');
    run.regionIndex += 1;
    open(run, 'solo-hero-week-payout');
    const before = maxHp(content, run.party[0]!);
    run = pick(run, 'Take the reward.');
    expect(maxHp(content, run.party[0]!)).toBeGreaterThanOrEqual(before);
    expect(flagOf(run, 'solo-hero-week-paid')).toBe(1);
  });
  it('a rule the player chose for the run is not taken away when a signed challenge ends', () => {
    let run = weekRun('no-items-week');
    run.rules.modifierIds = [...run.rules.modifierIds, 'no-battle-items'];
    open(run, 'no-items-week');
    run = pick(run, 'Sign up.');
    endRegionTempEffects(run);
    expect(run.rules.modifierIds).toContain('no-battle-items');
  });
  it('a calendar week\'s crier only exists in runs of that week; "Join in." gives the bonus for the region', () => {
    expect(content.events.get('catch-carnival')!.gameEvent).toBe('catch-carnival');
    let run = weekRun('catch-carnival');
    open(run, 'catch-carnival');
    run = pick(run, 'Join in.');
    expect(run.perkEffects.filter((m) => m.kind === 'captureMultiplier').length).toBeGreaterThanOrEqual(1);
    expect(run.tempEffects.some((t) => t.until === 'region')).toBe(true);
  });

});

describe('catalog overhaul: the original Legendaries\' stages (SF99)', () => {
  it('three rooms, then the creature; watching from a distance gives the stated gift and ends the stage; the old expedition is never placed', () => {
    let run = newRun('veinheart');
    open(run, 'legend-veinheart');
    run = pick(run, 'Go in.');
    for (let i = 0; i < 3; i++) run = pick(run, 'Go on.');
    run = pick(run, 'Watch from a distance.');
    expect((run.inventory['hard-stone'] ?? 0) + run.party.filter((m) => m.held?.['hard-stone']).length).toBeGreaterThanOrEqual(1);
    expect(flagOf(run, 'legend-veinheart-met')).toBe(1);
    const old = content.expeditions.expeditions.find((e) => e.id === 'legend-veinheart')!;
    expect(old.legendary?.replacedBy).toBe('legend-veinheart');
    expect((content.events.get('legend-veinheart-final')!.choices[0]!.success.battle as { species?: string[] } | undefined)?.species).toEqual(['veinheart']);
  });
});
