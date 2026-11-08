import { describe, expect, it } from 'vitest';
import { GALAR_HYPE, HYPE_SPEAKERS, HYPE_TRIGGERS, crowdBoost, crowdFavor, fillHype, galarScope, pickCounterSpecies, pickHype, type HypeContext } from '../../src/core/galarCrowd';
import { stoneForms } from '../../src/core/battle/transform';
import { getContent } from '../../src/data';
import { chooseStarter, createRun } from '../../src/core/run';

const ctx = (over: Partial<HypeContext> = {}): HypeContext => ({ runSeed: 'S', battleId: 'b1', turn: 3, scope: 'gym', seen: new Set(), available: new Set(HYPE_SPEAKERS), ...over });

describe('Galar hype moments and crowd favour', () => {
  it('ships at least 50 moments, each with a known trigger and speaker, and every trigger has one', () => {
    expect(GALAR_HYPE.length).toBeGreaterThanOrEqual(50);
    expect(new Set(GALAR_HYPE.map((h) => h.id)).size).toBe(GALAR_HYPE.length);
    for (const t of HYPE_TRIGGERS) expect(GALAR_HYPE.some((h) => h.trigger === t), t).toBe(true);
  });

  it('picks the same moment for the same battle and never repeats one already seen', () => {
    const a = pickHype('playerBigHit', ctx())!;
    expect(pickHype('playerBigHit', ctx())!.id).toBe(a.id);
    const seen = new Set<string>();
    const ids: string[] = [];
    for (let i = 0; i < 20; i++) {
      const m = pickHype('playerBigHit', ctx({ seen }));
      if (!m) break;
      seen.add(m.id);
      ids.push(m.id);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(1);
  });

  it('only casts speakers that are available, and keeps Champion-only moments to Champion battles', () => {
    const noRival = new Set(HYPE_SPEAKERS.filter((s) => s !== 'rival'));
    for (let t = 1; t < 30; t++) expect(pickHype('comeback', ctx({ turn: t, available: noRival }))?.speaker).not.toBe('rival');
    expect(pickHype('lastStand', ctx({ scope: 'gym' }))).toBeNull();
    expect(pickHype('lastStand', ctx({ scope: 'tournament' }))).toBeNull();
    expect(pickHype('lastStand', ctx({ scope: 'champion' }))).not.toBeNull();
    expect(pickHype('bondMega', ctx({ scope: 'champion' }))).not.toBeNull();
  });

  it('fills names into lines', () => {
    expect(fillHype('{foe} sent {foeMon}! {FOE}!', { foe: 'Raihan', foeMon: 'Duraludon' })).toBe('Raihan sent Duraludon! RAIHAN!');
  });

  it('has no favour bar, no scope and no boost outside Galar major battles', () => {
    const content = getContent();
    const run = chooseStarter(content, createRun(content, { runId: 'gc', seed: 'galar-crowd-test', archetypeId: 'red' }), 0);
    expect(galarScope(content, run)).toBeNull();
    expect(crowdFavor(content, run)).toBeNull();
    expect(crowdBoost(content, run)).toBe(1);
  });

  it("the Champion's last stand counters the player's Pokémon with a Mega-capable species", () => {
    const content = getContent();
    const run = chooseStarter(content, createRun(content, { runId: 'gc', seed: 'galar-crowd-test', archetypeId: 'red' }), 0);
    const target = run.party[0]!;
    const id = pickCounterSpecies(content, target, 'a')!;
    expect(id).toBeTruthy();
    expect(stoneForms(content, id, false).length).toBeGreaterThan(0);
    expect(pickCounterSpecies(content, target, 'a')).toBe(id);
  });
});

describe('Champion journey lines', () => {
  it('has many Champion-only journey lines, and flagged ones only play when the flag is true', async () => {
    const { GALAR_HYPE, pickHype } = await import('../../src/core/galarCrowd');
    const journey = GALAR_HYPE.filter((h) => h.trigger.startsWith('journey'));
    expect(journey.length).toBeGreaterThanOrEqual(50);
    expect(journey.every((h) => h.scopes.length === 1 && h.scopes[0] === 'champion' && h.speaker === 'host')).toBe(true);
    const base = { runSeed: 'S', battleId: 'b', turn: 2, scope: 'champion' as const, seen: new Set<string>(), available: new Set(['host', 'reporter', 'crowdTrainer'] as const) };
    for (let t = 0; t < 40; t++) {
      const m = pickHype('journeyOpen', { ...base, turn: t, flags: new Set() });
      expect(m?.needs ?? []).toEqual([]);
    }
    const seen = new Set<string>();
    for (let t = 0; t < 80; t++) seen.add(pickHype('journeyOpen', { ...base, turn: t, flags: new Set(['starterAlive']) })!.id);
    expect([...seen].some((id) => GALAR_HYPE.find((h) => h.id === id)!.needs.includes('starterAlive'))).toBe(true);
    expect(pickHype('journeyOpen', { ...base, scope: 'gym' })).toBeNull();
  });
});

describe('Galar interviews and shouts', () => {
  it('has plenty of shouts and interviews, all from friendly characters', async () => {
    const { GALAR_HYPE } = await import('../../src/core/galarCrowd');
    const interviews = (await import('../../src/data/galarInterviews.json')).default as { pre: unknown[]; postWin: unknown[]; postLose: unknown[] };
    expect(GALAR_HYPE.filter((h) => h.trigger === 'shout').length).toBeGreaterThanOrEqual(40);
    expect(interviews.pre.length).toBeGreaterThanOrEqual(20);
    expect(interviews.postWin.length).toBeGreaterThanOrEqual(15);
    expect(interviews.postLose.length).toBeGreaterThanOrEqual(15);
    const { CROWD_SPRITES } = await import('../../src/ui/galar/cutArt');
    expect(CROWD_SPRITES.length).toBeGreaterThanOrEqual(60);
    expect(CROWD_SPRITES.some((id) => /grunt|rocket|magma|aqua|galactic|plasma|flare|skull|macro|aether|star_|victor|victoria|rival_|red$|blue$|green$|hilda|nate/.test(id))).toBe(false);
  });
});
