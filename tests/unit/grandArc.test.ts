// Grand Arc start (slice E7): Data ROMs, the Stock track, roaming evil teams.

import { describe, expect, it } from 'vitest';
import { conditionMet, applyEffect } from '../../src/core/events';
import { evilBattle, evilBattleWon, evilOf, plannedEvilTeamId } from '../../src/core/evil/teams';
import { earnRom, finaleOffered, gainStock, grandArcData, grandArcOf, leaveRegion, romsHeld, startGrandArc, stockLevel, stockStep } from '../../src/core/grandArc';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { content } from './helpers';

const fresh = (seed: string, grandArc = true) => structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(grandArc ? { expansion: { grandArc: true } } : {}) }), 0));
const rng = () => new Rng(hashSeed('ga'));

describe('ROMs and the Stock track', () => {
  it('a run without the setting has no arc and nothing changes', () => {
    const run = fresh('off', false);
    expect(grandArcOf(run)).toBeNull();
    expect(earnRom(run, 'K')).toBe(false);
    expect(gainStock(run, 1)).toBe(false);
    expect(leaveRegion(run, 'kanto')).toBeNull();
    expect(stockLevel(run)).toBe(0);
    expect(run.expansion?.grandArc).toBeUndefined();
  });
  it('a ROM is earned once and never lost', () => {
    const run = fresh('rom');
    expect(earnRom(run, 'K')).toBe(true);
    expect(earnRom(run, 'K')).toBe(false);
    expect(earnRom(run, 'Z')).toBe(false);
    expect(grandArcOf(run)!.roms).toEqual(['K']);
    expect(earnRom(run, 'J', true)).toBe(true);
    expect(romsHeld(grandArcOf(run)!)).toEqual(['K', 'J']);
  });
  it('every three ROMs remove one Stock step; the finale needs three', () => {
    const run = fresh('stock');
    for (const s of [1, 2, 3]) gainStock(run, s);
    expect(stockLevel(run)).toBe(3);
    expect(stockStep(run)?.name).toBe('Three Beasts');
    expect(finaleOffered(run)).toBe(false);
    for (const id of ['K', 'J']) earnRom(run, id);
    expect(stockLevel(run)).toBe(3);
    earnRom(run, 'H');
    expect(finaleOffered(run)).toBe(true);
    expect(stockLevel(run)).toBe(2);
    for (const id of ['S', 'U', 'X']) earnRom(run, id);
    expect(stockLevel(run)).toBe(1);
    for (const id of ['A', 'G', 'P']) earnRom(run, id);
    expect(stockLevel(run)).toBe(0);
    expect(stockStep(run)).toBeNull();
    expect(gainStock(run, 2)).toBe(false);
    expect(gainStock(run, 9)).toBe(false);
  });
  it('a liaison nobody beat leaves with a sample, once; a beaten one does not', () => {
    const run = fresh('left');
    expect(leaveRegion(run, 'kanto')).toContain('Ein');
    expect(leaveRegion(run, 'kanto')).toBeNull();
    expect(grandArcOf(run)!.stock).toEqual([1]);
    const run2 = fresh('beat');
    earnRom(run2, 'K');
    expect(leaveRegion(run2, 'kanto')).toBeNull();
    expect(grandArcOf(run2)!.stock).toEqual([]);
    expect(leaveRegion(run2, 'no-such-region')).toBeNull();
  });
  it('the data lists nine ROMs for nine regions and the state survives its schema', () => {
    expect(new Set(grandArcData.roms.map((r) => r.region)).size).toBe(9);
    const run = fresh('save');
    earnRom(run, 'K');
    gainStock(run, 4);
    const back = ExpansionRunSchema.parse(JSON.parse(JSON.stringify(run.expansion)));
    expect(back.grandArc).toEqual(run.expansion!.grandArc);
    expect(ExpansionRunSchema.parse({}).grandArc).toBeUndefined();
    startGrandArc(run);
    expect(grandArcOf(run)!.roms).toEqual([]);
  });
});

describe('events and effects', () => {
  it('Ein appears only in Kanto with the arc on and no ROM K yet', () => {
    const run = fresh('ein');
    const cond = { kind: 'grandArc', missingRom: 'K' } as const;
    expect(conditionMet(content, run, cond)).toBe(true);
    applyEffect(content, run, { kind: 'grandArcRom', rom: 'K' }, rng());
    expect(conditionMet(content, run, cond)).toBe(false);
    expect(conditionMet(content, fresh('ein2', false), cond)).toBe(false);
  });
  it('the ROM effect says what you hold, and grandArcStock gains a step', () => {
    const run = fresh('fx');
    expect(applyEffect(content, run, { kind: 'grandArcRom', rom: 'K' }, rng())).toContain('Rig Pulse');
    applyEffect(content, run, { kind: 'grandArcStock', step: 2 }, rng());
    expect(grandArcOf(run)!.stock).toEqual([2]);
  });
});

describe('roaming evil teams', () => {
  it('Cipher, Rocket Remnants and Snag\'em exist, are roaming, and are never a run\'s team', () => {
    const roaming = content.evilTeams.teams.filter((t) => t.roaming).map((t) => t.id).sort();
    expect(roaming).toEqual(['cipher', 'rocket-remnants', 'snagem']);
    for (let i = 0; i < 300; i++) {
      for (const story of [false, true]) {
        const id = plannedEvilTeamId(content, { seed: `seed${i}`, perkEffects: [], story: { v2: story ? {} : undefined } } as never);
        expect(roaming).not.toContain(id);
      }
    }
  });
  it('a battle with a roaming team uses its own ranks and rule and its own records', () => {
    const run = fresh('roam');
    const battle = { kind: 'trainer', evil: 'grunt', evilTeam: 'cipher', name: 'x', size: 2, levelBonus: 0, shadow: 0, chain: 1, win: [] } as never;
    const plan = evilBattle(content, run, battle)!;
    expect(plan.name).toBe('Cipher Peon');
    expect(plan.shadow).toBe(1);
    expect(plan.size).toBe(2);
    expect(evilOf(run).villains['cipher:grunt']?.met).toBe(1);
    expect(evilOf(run).villains['grunt']).toBeUndefined();
    evilBattleWon(run, battle);
    expect(evilOf(run).villains['cipher:grunt']?.last).toBe('won');
  });
});
