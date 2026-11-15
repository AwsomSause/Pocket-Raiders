// Early-game NPC trainers (tools/build-npc-trainers.ts): count, early unlocks, art, teams, sorting.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { trainerGame, trainerRegion } from '../../src/core/trainerSort';
import { createProfile } from '../../src/core/profile';
import { applyRunToProfile } from '../../src/core/progress';
import { applyEffect } from '../../src/core/events';
import { hashSeed, Rng } from '../../src/core/rng';
import { createRun } from '../../src/core/run';
import { defaultPrep } from '../../src/core/runPrep';
import { content } from './helpers';

const npcs = [...content.archetypes.values()].filter((a) => a.id.startsWith('npc-'));

describe('early-game NPC trainers', () => {
  it('has at least 50, all locked behind small early feats', () => {
    expect(npcs.length).toBeGreaterThanOrEqual(50);
    for (const a of npcs) {
      expect(a.unlockedByDefault, a.id).toBe(false);
      expect(a.unlock?.kind, a.id).toBe('total');
      expect(a.unlockCost, a.id).toBeLessThanOrEqual(300);
      expect(a.modifiers.length, a.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('has its own art, a 5-species team in a matching starter pool, and a game and region', () => {
    const sprites = new Set<string>();
    for (const a of npcs) {
      sprites.add(a.spriteAssetId);
      const file = join(__dirname, '../../public/assets/images/bosses', `${a.spriteAssetId.slice('boss.'.length)}.png`);
      expect(existsSync(file), a.id).toBe(true);
      expect(a.signatureSpecies, a.id).toHaveLength(5);
      expect(trainerRegion(a)).not.toBe('Other');
      expect(trainerGame(a)).not.toBe('Other');
    }
    expect(sprites.size).toBe(npcs.length);
  });
});

describe('NPC trainer origins', () => {
  it('tags each class with the game and region it debuted in', () => {
    const o = (id: string) => [trainerGame(content.archetypes.get(id)!), trainerRegion(content.archetypes.get(id)!)];
    expect(o('npc-youngster-joey')).toEqual(['Red/Blue/Yellow', 'Kanto']);
    expect(o('npc-tuber-pip')).toEqual(['Ruby/Sapphire/Emerald', 'Hoenn']);
    expect(o('npc-pokemon-ranger-hal')).toEqual(['Diamond/Pearl/Platinum', 'Sinnoh']);
    expect(o('npc-cool-couple-leon-and-sky')).toEqual(['Black/White', 'Unova']);
  });
});

describe('NPC trainer recruit events', () => {
  // Catalog Overhaul (ROAD_ROSTER.md): each NPC's meet event is now a three-meeting arc (`npc-meet-<x>`, `-m2`, `-m3`, plus side scenes);
  // finishing the arc is what recruits them (tools/events/co/_people.ts, withRecruit).
  const recruitsIn = (e: { choices: { success: { effects: unknown[]; battle?: { win?: unknown[]; lose?: unknown[] } } }[]; remembers?: { addChoices: { success: { effects: unknown[]; battle?: { win?: unknown[]; lose?: unknown[] } } }[] }[] }, trainer: string) => {
    const all = [...e.choices, ...(e.remembers ?? []).flatMap((v) => v.addChoices)];
    return all.flatMap((c, i) => [...c.success.effects, ...(c.success.battle?.win ?? []), ...(c.success.battle?.lose ?? [])].some((x) => JSON.stringify(x) === JSON.stringify({ kind: 'recruit', trainer })) ? [i] : []);
  };

  it('every NPC has a meet arc, and finishing it recruits them (by battle or by talking)', () => {
    for (const a of npcs) {
      const base = `npc-meet-${a.id.slice('npc-'.length)}`;
      expect(content.events.get(base), a.id).toBeDefined();
      const arc = [...content.events.values()].filter((e) => e.id === base || e.id.startsWith(`${base}-`));
      expect(arc.some((e) => recruitsIn(e as never, a.id).length > 0), a.id).toBe(true);
      // The first meeting never recruits on its own: the arc does.
      expect(recruitsIn(content.events.get(base)! as never, a.id), a.id).toEqual([]);
    }
  });

  it('finishing the arc recruits the trainer for good when the run ends, once', () => {
    const joey = content.archetypes.get('npc-youngster-joey')!;
    const run = createRun(content, { runId: 'r', seed: 'recruit', archetypeId: 'red', prep: defaultPrep(content) });
    // Joey's last meeting: the Rattata Club fight; finishing it (the outcome that sets `roster-joey-done`) carries the recruit.
    const finale = content.events.get('npc-meet-youngster-joey-m3')!;
    const recruit = finale.choices.flatMap((c) => [...c.success.effects, ...(c.success.battle?.win ?? [])]).find((x) => x.kind === 'recruit')!;
    expect(recruit).toEqual({ kind: 'recruit', trainer: 'npc-youngster-joey' });
    applyEffect(content, run, recruit, new Rng(hashSeed('recruit')));
    applyEffect(content, run, recruit, new Rng(hashSeed('recruit')));
    expect(run.itemCounters?.['recruit:npc-youngster-joey']).toBe(1);
    const profile = createProfile(content, 'p');
    expect(profile.unlockedArchetypes).not.toContain(joey.id);
    applyRunToProfile(content, profile, run, '2026-10-30');
    applyRunToProfile(content, profile, run, '2026-10-30');
    expect(profile.unlockedArchetypes.filter((id) => id === joey.id)).toHaveLength(1);
  });
});

describe('NPC trainer movesets and trainer classes', () => {
  it('every NPC trainer has a fixed supported moveset for each signature species it can start with', () => {
    for (const a of npcs) {
      for (const id of a.signatureSpecies) {
        const set = a.signatureMovesets[id];
        expect(set, `${a.id} ${id}`).toBeTruthy();
        for (const m of set!) expect(content.moves.get(m)?.supported, `${a.id} ${id} ${m}`).toBe(true);
      }
    }
  });
  it('picking a signature species starts with exactly that moveset', async () => {
    const { chooseStarter } = await import('../../src/core/run');
    const a = npcs[0]!;
    const species = a.signatureSpecies[0]!;
    const run = createRun(content, { runId: 'm', seed: 'm', archetypeId: a.id, prep: defaultPrep(content) });
    run.starterChoices = [species, ...run.starterChoices.slice(1)];
    const started = chooseStarter(content, run, 0);
    expect(started.party[0]!.moves.map((m) => m.id)).toEqual(a.signatureMovesets[species]);
  });
  it('has at least 25 trainer classes with a style, personality and lines', () => {
    const classes = [...content.trainers.values()];
    expect(classes.length).toBeGreaterThanOrEqual(25);
    for (const c of classes) {
      expect(c.personality.length, c.id).toBeGreaterThan(0);
      expect(c.lines?.intro, c.id).toBeTruthy();
    }
  });
});
