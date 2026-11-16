// Greenneedle fix pass, part 8 (gn.new.01-19 against GREENNEEDLE_PLACED_1.md): the differences the audit listed, one block per event.
import { describe, expect, it } from 'vitest';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { createPokemon, calcStats } from '../../src/core/pokemon';
import { createBattle, highestSchool, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { hashSeed, Rng } from '../../src/core/rng';
import { worthyStat } from '../../src/core/greenneedle/worthy';
import { worthyStart } from '../../src/core/greenneedle/duelist';
import { tyrogueMon, tyrogueTurn } from '../../src/core/greenneedle/tyrogue';
import { content } from './helpers';
import { addEventStops, stageNumber } from '../../src/core/events';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';
import { conditionMet } from '../../src/core/events';
import { ballAnswer } from '../../src/core/greenneedle/ball';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const at = (seed: string, eventId: string, flags: Record<string, number> = {}): RunState => {
  const run = gnRun(seed);
  for (const [k, v] of Object.entries(flags)) setFlag(run, k, v);
  open(run, eventId);
  return run;
};
/** A fresh run moved to absolute stage `n` (same region), so stamps `n` stages back can be tested. */
const atStage = (seed: string, n: number): RunState => { const run = gnRun(seed); run.stage!.index = n - 1; return run; };
const onMap = (run: RunState, eventId: string): number => run.stage!.map.nodes.filter((n) => n.sides.some((s) => s.eventId === eventId)).length;
const placement = (id: string) => content.coPlacement!.get(id)!;
const joined = (run: RunState, species: string) => [...run.party, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === species);

describe('gn.new.02 The Dog at the Station (fixes)', () => {
  it('only the platform needs a city; the later beats fit any stage', () => {
    expect(placement('gn-new-02-platform').tags).toEqual(['city']);
    for (const id of ['gn-new-02-porter', 'gn-new-02-landlady', 'gn-new-02-clinic', 'gn-new-02-last', 'gn-new-02-last-sit']) expect(placement(id).tags, id).toEqual([]);
    expect(placement('gn-new-02-platform').window).toEqual([5, 15]);
  });

  it('asking around puts the porter on the map ahead, in the same stage', () => {
    const run = atStage('dogfix-porter', 3); open(run, 'gn-new-02-platform');
    expect(onMap(run, 'gn-new-02-porter')).toBe(0);
    const r = choose(run, 'gn-new-02-platform', 'Ask around town.');
    expect(onMap(r.run, 'gn-new-02-porter')).toBe(1);
  });

  it('only ever sat: two stages on, the last visit is placed on the map (must-see) and gives the Growlithe with Vigil', () => {
    const run = atStage('dogfix-sit', 4);
    const now = stageNumber(content, run);
    setFlag(run, 'dog-open', 1); setFlag(run, 'dog-seen', 1); setFlag(run, 'dog-station-sat', 1); setFlag(run, 'dog-at', now - 2);
    addEventStops(content, run);
    expect(onMap(run, 'gn-new-02-last-sit')).toBeGreaterThan(0);
    expect(onMap(run, 'gn-new-02-last')).toBe(0);
    const scn = scene(run, 'gn-new-02-last-sit');
    expect(scn.labels).toEqual(['Sit one more time.']);
    expect(scn.intro).not.toMatch(/Ward two|Emlyn/);
    open(run, 'gn-new-02-last-sit');
    const r = choose(run, 'gn-new-02-last-sit', 'Sit one more time.');
    expect(joined(r.run, 'growlithe')?.fixedAbility).toBe('vigil');
    expect(flagOf(r.run, 'dog-chose-player')).toBe(1);
  });

  it('boundary: one stage on is too early; fed or led has no last visit at all', () => {
    const early = atStage('dogfix-early', 4);
    setFlag(early, 'dog-open', 1); setFlag(early, 'dog-station-sat', 1); setFlag(early, 'dog-at', stageNumber(content, early) - 1);
    addEventStops(content, early);
    expect(onMap(early, 'gn-new-02-last-sit')).toBe(0);
    for (const key of ['dog-fed', 'dog-led']) {
      const run = atStage(`dogfix-${key}`, 4);
      setFlag(run, 'dog-open', 1); setFlag(run, key, 1); setFlag(run, 'dog-at', stageNumber(content, run) - 2);
      addEventStops(content, run);
      expect(onMap(run, 'gn-new-02-last-sit') + onMap(run, 'gn-new-02-last'), key).toBe(0);
    }
    expect(JSON.stringify(content.events.get('gn-new-02-last'))).not.toMatch(/Do it once more/);
  });

  it('asked around: the clinic and ward two are both placed at S(n+2), and ward two needs no clinic visit', () => {
    const run = atStage('dogfix-ask', 4);
    setFlag(run, 'dog-open', 1); setFlag(run, 'dog-asking', 1); setFlag(run, 'dog-at', stageNumber(content, run) - 2);
    addEventStops(content, run);
    expect(onMap(run, 'gn-new-02-clinic')).toBe(1);
    expect(onMap(run, 'gn-new-02-last')).toBeGreaterThan(0);
    expect(onMap(run, 'gn-new-02-landlady')).toBe(0);
    const scn = scene(run, 'gn-new-02-last');
    expect(scn.labels).toEqual(['Carry the letter.', 'Carry the Growlithe.']);
    expect(scn.intro).toMatch(/He's in ward two\. He's been ill a long time\./);
    setFlag(run, 'dog-clinic', 1);
    expect(scene(run, 'gn-new-02-last').intro).not.toMatch(/You never reached the clinic/);
  });

  it('the clerk on holiday is met only if they were reunited', () => {
    expect(JSON.stringify(content.events.get('gn-new-02-holiday')!.requires)).toMatch(/dog-reunited/);
    const r = choose(at('dogfix-holiday', 'gn-new-02-holiday', { 'dog-reunited': 1 }), 'gn-new-02-holiday', 'Sit with him.');
    expect(said(r)).toMatch(/Habit/);
  });
});

describe('gn.new.01 The Eevee Who Couldn\'t Choose (fixes)', () => {
  it('each "admirer, later" scene is placed at a step 5 town', () => {
    for (const id of ['fisherman', 'magician', 'electrician', 'nurse', 'gardener', 'guide', 'ribbon']) {
      const p = placement(`gn-new-01-after-${id}`);
      expect(p, id).toBeTruthy();
      expect([p.home, p.attaches, p.sits]).toEqual([5, 'town', 'optional']);
    }
  });
});

describe('gn.new.03 The Ball That Wouldn\'t Open (fixes)', () => {
  const again = () => content.events.get('gn-new-03-again')!;
  it('the bolted Pokémon is met 16 stages later, not before (boundary 15 / 16)', () => {
    const run = atStage('ballfix-gap', 20);
    setFlag(run, 'ball-bolted', 1);
    setFlag(run, 'ball-bolt-stage', 5);
    expect(again().requires.every((c) => conditionMet(content, run, c))).toBe(false);
    setFlag(run, 'ball-bolt-stage', 4);
    expect(again().requires.every((c) => conditionMet(content, run, c))).toBe(true);
    setFlag(run, 'ball-bolt-stage', 0);
    expect(again().requires.every((c) => conditionMet(content, run, c))).toBe(false);
    expect(JSON.stringify(again())).not.toMatch(/"levelBonus":16/);
  });
  it('the find has no refuse choice', () => {
    expect(scene(gnRun('ballfix-find'), 'gn-new-03-find').labels).toEqual(['Pick it up.']);
  });
  it('a held Ball answers as soon as the battle is decided, once', () => {
    for (const [outcome, line] of [['win', /warm/], ['lose', /rocks once/]] as const) {
      const run = gnRun(`ballfix-held-${outcome}`);
      setFlag(run, 'ball-found', 1); setFlag(run, 'ball-held', 1);
      const battle = { outcome, storyEffects: [] } as never;
      expect(ballAnswer(run, battle)).toMatch(line);
      expect(ballAnswer(run, battle)).toBe('');
      expect(ballAnswer(run, { outcome: null, storyEffects: [] } as never)).toBe('');
    }
    expect(ballAnswer(gnRun('ballfix-not-held'), { outcome: 'win', storyEffects: [] } as never)).toBe('');
  });
});

const mon = (species: string, level: number, uid: string, ...moves: string[]): PokemonInstance => {
  const m = createPokemon(content, species, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};
const fightCtx = (party: PokemonInstance[], foes: PokemonInstance[], seed: string): BattleContext => {
  const battle = createBattle('trainer', foes, 0, party[0]!.uid);
  return { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
};

describe('gn.new.04 The Tyrogue Who Wanted All Three (fixes)', () => {
  it('Three Schools is 70 power, Fighting, and hits with the highest of Attack, Defense or Speed', () => {
    const m = content.moves.get('three-schools')!;
    expect([m.power, m.type, m.accuracy, m.effects.attackFrom, m.effects.hits]).toEqual([70, 'fighting', 100, 'highest', undefined]);
    expect(highestSchool({ atk: 50, def: 80, spe: 60 }, { atk: 0, def: 0, spe: 0 })).toBe('def');
    expect(highestSchool({ atk: 50, def: 50, spe: 50 }, { atk: 0, def: 0, spe: 0 })).toBe('atk');
    // Stat stages count: Speed at +2 doubles, and passes a higher Defense.
    expect(highestSchool({ atk: 50, def: 80, spe: 60 }, { atk: 0, def: 0, spe: 2 })).toBe('spe');
    expect(highestSchool({ atk: 90, def: 80, spe: 60 }, { atk: -2, def: 0, spe: 0 })).toBe('def');
  });
  it('in battle: a high-Defense user hits harder with Three Schools than the same move from its Attack', () => {
    const dealt = (moveId: string): number => {
      const user = mon('shuckle', 50, 'p-ts', moveId);
      const foe = mon('snorlax', 50, 'e-ts', 'splash');
      const ctx = fightCtx([user], [foe], 'three-schools-same');
      const before = foe.hp;
      resolveTurn(ctx, { kind: 'move', index: 0 });
      return before - foe.hp;
    };
    // Brick Break is 75 power from Shuckle's tiny Attack; Three Schools is 70 power from its huge Defense.
    expect(dealt('three-schools')).toBeGreaterThan(dealt('brick-break') * 3);
  });
  it('the masters only speak: one choice, no lesson, no count from talking', () => {
    for (const n of [1, 2, 3]) {
      const e = content.events.get(`gn-new-04-road-${n}`)!;
      expect(e.choices.map((c) => c.label)).toEqual(['Leave them to it.']);
      expect(JSON.stringify(e)).not.toMatch(/tyrTally|teachMove/);
      expect(placement(`gn-new-04-road-${n}`).sits).toBe('must-see');
    }
  });
  it('the Tyrogue arrives knowing a kick, a punch and a spin; a battle\'s count joins the tally only when it is won', () => {
    const start = gnRun('tyrfix');
    open(start, 'gn-new-04-door');
    const run = choose(start, 'gn-new-04-door', 'Travel with me for the stage.').run;
    const t = tyrogueMon(run)!;
    expect(t.moves.map((m) => m.id)).toEqual(expect.arrayContaining(['low-kick', 'mach-punch', 'rapid-spin']));
    const turn = (events: { type: string; side?: string; moveId?: string }[], outcome: 'win' | 'lose' | null): void => {
      run.battle = { activeIndex: run.party.indexOf(t), outcome } as RunState['battle'];
      tyrogueTurn(run, events);
    };
    turn([{ type: 'move', side: 'player', moveId: 'low-kick' }], null);
    expect(flagOf(run, 'tyr-kick')).toBe(0); // not decided yet
    turn([{ type: 'move', side: 'player', moveId: 'low-kick' }], 'win');
    expect(flagOf(run, 'tyr-kick')).toBe(2);
    turn([{ type: 'move', side: 'player', moveId: 'mach-punch' }], 'lose');
    expect(flagOf(run, 'tyr-punch')).toBe(0); // a lost battle counts for nothing
    expect(flagOf(run, 'tyr-now-punch')).toBe(0);
  });
});

describe('gn.new.06 The Duelist (fixes): Worthy Opponent', () => {
  it('+1 to its highest stat on entry when the foe is at full HP; nothing against a hurt foe or without the mark', () => {
    const lead = mon('alakazam', 40, 'p-w', 'splash');
    const foe = mon('rattata', 5, 'e-w', 'splash');
    expect(worthyStat(content, lead, foe)).toBeNull();
    lead.marks = ['Worthy Opponent'];
    const stats = calcStats(content, lead);
    const best = (['atk', 'def', 'spa', 'spd', 'spe'] as const).reduce((b, k) => (stats[k] > stats[b] ? k : b), 'atk' as 'atk' | 'def' | 'spa' | 'spd' | 'spe');
    expect(worthyStat(content, lead, foe)).toBe(best);
    foe.hp -= 1;
    expect(worthyStat(content, lead, foe)).toBeNull();
  });
  it('at the start of a battle the lead\'s highest stat is one stage up, whatever the foe\'s level', () => {
    const lead = mon('alakazam', 40, 'p-w2', 'splash');
    lead.marks = ['Worthy Opponent'];
    const foe = mon('rattata', 5, 'e-w2', 'splash');
    const battle = createBattle('wild', [foe], 0, lead.uid);
    worthyStart(content, { party: [lead] } as never, battle);
    expect(Object.values(battle.playerStages).reduce((a, b) => a + b, 0)).toBe(1);
    expect(battle.playerStages[worthyStat(content, lead, foe)!]).toBe(1);
  });
  it('on switching in against a full-HP foe it triggers again', () => {
    const a = mon('rattata', 30, 'p-a', 'splash');
    const b = mon('alakazam', 40, 'p-b', 'splash');
    b.marks = ['Worthy Opponent'];
    const foe = mon('snorlax', 30, 'e-w3', 'splash');
    const ctx = fightCtx([a, b], [foe], 'worthy-switch');
    const r = resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(JSON.stringify(r)).toMatch(/Worthy Opponent/);
    expect(ctx.battle.playerStages[worthyStat(content, b, foe)!]).toBe(1);
  });
});

describe('gn.new.09 The Last Stop (fixes): the move', () => {
  it('is 60 power, Ghost, and a knock-out lets the user switch out for free', () => {
    const m = content.moves.get('last-stop')!;
    expect([m.power, m.type, m.effects.switchOutOnKo]).toEqual([60, 'ghost', true]);
    const user = mon('drifloon', 50, 'p-ls', 'last-stop');
    const bench = mon('rattata', 50, 'p-ls2', 'splash');
    const weak = mon('abra', 5, 'e-ls', 'splash');
    weak.hp = 1;
    const ctx = fightCtx([user, bench], [weak, mon('snorlax', 50, 'e-ls2', 'splash')], 'last-stop-ko');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(weak.hp).toBe(0);
    expect(user.hp).toBeGreaterThan(0);
    expect(ctx.battle.needsSwitch).toBe(true); // the free switch: the player picks who comes in
  });
  it('no knock-out, no switch', () => {
    const user = mon('drifloon', 20, 'p-ls3', 'last-stop');
    const foe = mon('snorlax', 60, 'e-ls3', 'splash');
    const ctx = fightCtx([user, mon('rattata', 50, 'p-ls4', 'splash')], [foe], 'last-stop-no');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(foe.hp).toBeGreaterThan(0);
    expect(ctx.battle.needsSwitch).toBeFalsy();
    expect(ctx.battle.playerVolatile.pivot).toBeFalsy();
  });
});

describe('gn.new.14 The Arcade Cabinet (fixes): Debug', () => {
  // Nuzzle always paralyses (100% secondary effect).
  const run = (ability: string | undefined) => {
    const pory = mon('porygon', 50, 'p-dbg', 'splash');
    if (ability) pory.fixedAbility = ability;
    pory.hp = 9999;
    const foe = mon('pikachu', 20, 'e-dbg', 'nuzzle');
    const ctx = fightCtx([pory], [foe], 'debug-same');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    const first = pory.status?.id ?? null;
    pory.status = null;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    const second = pory.status?.id ?? null;
    pory.status = null;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    return { first, second, third: pory.status?.id ?? null, used: ctx.battle.storyEffects.includes('debug:p-dbg') };
  };
  it('the first hit lands its effect, the second hit by the same move does not, and it works once a battle', () => {
    expect(run('debug')).toEqual({ first: 'par', second: null, third: 'par', used: true });
  });
  it('without Debug every hit paralyses; Debug no longer guards stat drops', () => {
    expect(run(undefined)).toEqual({ first: 'par', second: 'par', third: 'par', used: false });
    expect(content.abilities.get('debug')!.description).toMatch(/second time/);
  });
});
