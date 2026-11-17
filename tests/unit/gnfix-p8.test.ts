// Greenneedle fix pass, part 8 (gn.new.01-19 against GREENNEEDLE_PLACED_1.md): the differences the audit listed, one block per event.
import { describe, expect, it } from 'vitest';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { createPokemon, calcStats } from '../../src/core/pokemon';
import { createBattle, highestSchool, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { hashSeed, Rng } from '../../src/core/rng';
import { worthyStat } from '../../src/core/greenneedle/worthy';
import { worthyStart } from '../../src/core/greenneedle/duelist';
import { tyrogueMon, tyrogueTurn } from '../../src/core/greenneedle/tyrogue';
import { banetteCloth, dusclopsLessons, paradeRare } from '../../src/core/greenneedle/parade';
import { resolveDecision } from '../../src/core/run';
import { fatesOf } from '../../src/core/greenneedle/left';
import { gnTokens } from '../../src/core/greenneedle';
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
    // Reads the status and clears it, so each turn's hit is judged by itself.
    const hit = (): string | null => {
      resolveTurn(ctx, { kind: 'move', index: 0 });
      const id = (pory as PokemonInstance).status?.id ?? null;
      pory.status = null;
      return id;
    };
    const first = hit();
    const second = hit();
    return { first, second, third: hit(), used: ctx.battle.storyEffects.includes('debug:p-dbg') };
  };
  it('the first hit lands its effect, the second hit by the same move does not, and it works once a battle', () => {
    expect(run('debug')).toEqual({ first: 'par', second: null, third: 'par', used: true });
  });
  it('without Debug every hit paralyses; Debug no longer guards stat drops', () => {
    expect(run(undefined)).toEqual({ first: 'par', second: 'par', third: 'par', used: false });
    expect(content.abilities.get('debug')!.description).toMatch(/second time/);
  });
});

describe('gn.new.09 The Last Stop (fixes): the ride', () => {
  it('"Get off early." is offered in every carriage; nothing follows, and the platform does not come back', () => {
    for (const id of ['gn-new-09-dining', 'gn-new-09-sleeper', 'gn-new-09-mail']) expect(content.events.get(id)!.choices.map((c) => c.label), id).toContain('Get off early.');
    const run = at('lsfix-off', 'gn-new-09-sleeper', { 'last-stop-boarded': 1 });
    const r = choose(run, 'gn-new-09-sleeper', 'Get off early.');
    expect(flagOf(r.run, 'last-stop-off-early')).toBe(1);
    expect(flagOf(r.run, 'last-stop-ticket')).toBe(0);
    expect(joined(r.run, 'drifloon')).toBeUndefined();
    setFlag(r.run, 'ls-date', stageNumber(content, r.run));
    expect(content.events.get('gn-new-09-return')!.requires.every((c) => conditionMet(content, r.run, c))).toBe(false);
  });
  it('the return visit needs no night and takes any three-node column, so the ticket\'s date is not lost', () => {
    const p = placement('gn-new-09-return');
    expect(p.tags).toEqual([]);
    expect([p.home, p.sits, p.window]).toEqual([13, 'side-branch', [2, 19]]);
    expect(placement('gn-new-09-door').tags).toEqual(['night']);
    expect(placement('gn-new-09-door').window).toEqual([8, 13]);
  });
});

describe('gn.new.11 The Night Parade (fixes): the stalls', () => {
  const four = (run: RunState): void => { run.party[0]!.moves = ['tackle', 'growl', 'leer', 'scratch'].map((id) => ({ id, pp: 10 })); };
  it('the Banette shows three moves dealt by the seed, different for different leads, never one it knows', () => {
    const a = mon('gastly', 30, 'c-a', 'lick', 'hypnosis', 'spite', 'curse');
    const float = (seed: string) => { const r = new Rng(hashSeed(seed)); return () => r.float(); };
    const one = banetteCloth(content, a, float('cloth-1'));
    expect(one).toHaveLength(3);
    expect(new Set(one).size).toBe(3);
    expect(one.some((id) => a.moves.some((m) => m.id === id))).toBe(false);
    expect(banetteCloth(content, a, float('cloth-1'))).toEqual(one);
    const seen = new Set(['cloth-1', 'cloth-2', 'cloth-3', 'cloth-4', 'cloth-5'].map((x) => banetteCloth(content, a, float(x)).join()));
    expect(seen.size).toBeGreaterThan(1);
  });
  it('the trade is the player\'s: take one of the three, and choose which of the lead\'s moves goes to the cloth', () => {
    let run = at('npfix-banette', 'gn-new-11-banette', { 'parade-lanterns': 6 });
    expect(scene(run, 'gn-new-11-banette').labels).toEqual(['Trade a move.', 'Back to the lane.']);
    four(run);
    run = choose(run, 'gn-new-11-banette', 'Trade a move.').run;
    const offer = run.pending[0]!;
    expect(offer.kind).toBe('teachMove');
    const want = offer.kind === 'teachMove' ? offer.moveIds[1]! : '';
    run = resolveDecision(content, run, { kind: 'teachMove', moveIndex: 1 }).run;
    expect(run.pending[0]?.kind).toBe('learnMove');
    run = resolveDecision(content, run, { kind: 'forgetMove', moveIndex: 2 }).run;
    expect(run.party[0]!.moves.map((m) => m.id)).toEqual(['tackle', 'growl', want, 'scratch']);
    expect(flagOf(run, 'parade-lanterns')).toBe(5);
  });
  it('failure: a lead with fewer than four moves has nothing to put on the cloth', () => {
    const run = at('npfix-short', 'gn-new-11-banette', { 'parade-lanterns': 6 });
    run.party[0]!.moves = run.party[0]!.moves.slice(0, 2);
    const banette = content.events.get('gn-new-11-banette')!;
    expect(banette.choices[0]!.requires.every((c) => conditionMet(content, run, c))).toBe(false);
  });
  it('the Dusclops offers every egg move of the line, for the player to choose', () => {
    const m = mon('eevee', 30, 'c-egg', 'tackle', 'growl', 'sand-attack', 'quick-attack');
    const lessons = dusclopsLessons(content, m);
    expect(lessons.length).toBeGreaterThan(1);
    const run = at('npfix-egg', 'gn-new-11-dusclops', { 'parade-lanterns': 6 });
    run.party[0] = m;
    const r = choose(run, 'gn-new-11-dusclops', 'Trade for an egg move.').run;
    const offer = r.pending[0]!;
    expect(offer.kind === 'teachMove' && offer.moveIds).toEqual(lessons);
  });
  it('the Sableye\'s Rare item is drawn from the rare items by the seed, not always a Rare Candy', () => {
    const got = new Set<string>();
    for (const roll of [0, 0.2, 0.4, 0.6, 0.8, 0.999]) {
      const run = gnRun('npfix-rare');
      run.inventory = {};
      paradeRare(content, run, roll);
      const id = Object.keys(run.inventory)[0]!;
      expect(content.catalog.get(id)!.rarity).toBe('rare');
      expect(content.catalog.get(id)!.giftOnly).toBeFalsy();
      got.add(id);
    }
    expect(got.size).toBeGreaterThan(2);
    expect(JSON.stringify(content.events.get('gn-new-11-sableye'))).not.toMatch(/rare-candy/);
  });
});

describe('gn.new.13 The Ones You Left (fixes): the script fits the Pokémon left this run', () => {
  const camp = (seed: string, ledger: string): RunState => { const run = gnRun(seed); run.story.flags['left:ledger'] = ledger; open(run, 'gn-new-13-door'); return run; };
  const text = (run: RunState, id: string): string => gnTokens(content, run, scene(run, id).intro);
  it('no fixed "six Poké Balls", no lost team, no "Tomorrow, the Gym": the door counts the Balls that are there', () => {
    const raw = JSON.stringify(['gn-new-13-door', 'gn-new-13-pick-a', 'gn-new-13-pick-b', 'gn-new-13-goodbye'].map((id) => content.events.get(id)));
    expect(raw).not.toMatch(/six Poké Balls|Six Poké Balls|Tomorrow, the Gym|losing with|team I lost|Two go with|Two stay/);
    const two = text(camp('leftfix-two', 'pidgey:12|rattata:11'), 'gn-new-13-door');
    expect(two).toContain('A cold fire. A bedroll, still rolled. Two Poké Balls in a row on a log, and beside them, a notebook in your own handwriting.');
    expect(two).toContain('the ones you left on this road, by name: Rattata and Pidgey.');
    expect(two).toContain('The Balls open by themselves. They have been waiting.');
    const one = text(camp('leftfix-one', 'pidgey:12'), 'gn-new-13-door');
    expect(one).toContain('One Poké Ball on a log, and beside it, a notebook');
    expect(one).toContain('The Ball opens by itself. It has been waiting.');
    expect(text(camp('leftfix-six', 'raichu:38|pidgeot:39|venusaur:40|blastoise:41|charizard:42|snorlax:37'), 'gn-new-13-door')).toContain('Six Poké Balls in a row');
  });
  it('one left and taken: nobody else decides, and nobody walks into the woods', () => {
    let run = camp('leftfix-take-one', 'pidgey:12');
    run = choose(run, 'gn-new-13-door', 'Take one.').run;
    expect(text(run, 'gn-new-13-pick-a')).toContain('The only one on the log: Pidgey (Lv 12).');
    expect(scene(run, 'gn-new-13-pick-a').labels).toHaveLength(1);
    run = choose(run, 'gn-new-13-pick-a', scene(run, 'gn-new-13-pick-a').labels[0]!).run;
    expect(fatesOf(run)).toHaveLength(0);
    const morning = text(run, 'gn-new-13-goodbye');
    expect(morning).toContain('There is nobody else left to decide.');
    expect(morning).not.toMatch(/woods|passing trainer/);
  });
  it('two left, none taken: one walks into the woods, one goes with the trainer, in the singular', () => {
    let run = camp('leftfix-bury-two', 'pidgey:12|rattata:11');
    run = choose(run, 'gn-new-13-door', 'Take none. Bury the notebook.').run;
    const morning = text(run, 'gn-new-13-goodbye');
    expect(morning).toMatch(/One walks into the woods, (Pidgey|Rattata), and does not look back\./);
    expect(morning).toMatch(/(Pidgey|Rattata) goes with a passing trainer, who calls out, "A good one, this\. I'll look after it\."/);
    expect(morning).not.toMatch(/stay at the camp|stays at the camp/);
  });
  it('a boxed Pokémon that is not taken is still yours: it waits, it never leaves with a trainer or into the woods', () => {
    let run = gnRun('leftfix-boxed');
    run.box = [createPokemon(content, 'pikachu', 14, 'p-boxed-a'), createPokemon(content, 'oddish', 12, 'p-boxed-b')];
    open(run, 'gn-new-13-door');
    run = choose(run, 'gn-new-13-door', 'Take none. Bury the notebook.').run;
    expect(fatesOf(run).map((x) => x.fate)).toEqual(['wait', 'wait']);
    expect(run.box).toHaveLength(2);
    const morning = text(run, 'gn-new-13-goodbye');
    expect(morning).toMatch(/go back into their Balls by themselves\. They are still yours\./);
    expect(morning).not.toMatch(/woods|passing trainer/);
  });
});

describe('gn.new.14 The Arcade Cabinet (fixes): the score table', () => {
  it('shows again in every later region, not once a run', () => {
    const board = content.events.get('gn-new-14-board')!;
    const run = atStage('arcadefix', 5);
    setFlag(run, 'arcade-stage', 2); setFlag(run, 'arcade-cleared', 1);
    const fits = (): boolean => board.requires.every((c) => conditionMet(content, run, c));
    expect(fits()).toBe(true);
    open(run, 'gn-new-14-board');
    const after = choose(run, 'gn-new-14-board', 'Read it.').run;
    expect(board.requires.every((c) => conditionMet(content, after, c))).toBe(false); // read in this region
    after.regionIndex += 1;
    expect(board.requires.every((c) => conditionMet(content, after, c))).toBe(true); // the next region's arcade
    expect(placement('gn-new-14-board').often).toBe('region');
  });
});

describe('gn.new.16 The Thing in the Well (fixes)', () => {
  it('"Leave it its bucket.": the best pebble comes up, and the Feebas stays in its well', () => {
    const r = choose(at('wellfix', 'gn-new-16-choose', { 'well-seen': 1 }), 'gn-new-16-choose', 'Leave it its bucket.');
    expect(joined(r.run, 'feebas')).toBeUndefined();
    expect(said(r)).toMatch(/Smooth Rock/); // a held item goes straight onto a Pokémon
    expect(r.run.party.some((m) => (m.held?.['smooth-rock'] ?? 0) > 0)).toBe(true);
    expect(flagOf(r.run, 'well-left')).toBe(1);
    expect(flagOf(r.run, 'well-lifted')).toBe(0);
    const lifted = choose(at('wellfix-lift', 'gn-new-16-choose', { 'well-seen': 1 }), 'gn-new-16-choose', 'Lift it out.');
    expect(joined(lifted.run, 'feebas')?.fixedAbility).toBe('unlooked-for');
    expect(placement('gn-new-16-well').window).toEqual([5, 15]);
  });
});

describe('gn.new.18 The Day the Center Closed (fixes)', () => {
  it('once per region: taken in one region, it is offered again in the next (and not twice in the same one)', () => {
    const door = content.events.get('gn-new-18-door')!;
    expect(door.choices.map((c) => c.label)).toEqual(['Knock on the glass.']);
    const run = at('centerfix', 'gn-new-18-door');
    const fits = (r: RunState): boolean => door.requires.every((c) => conditionMet(content, r, c));
    expect(fits(run)).toBe(true);
    const after = choose(run, 'gn-new-18-door', 'Knock on the glass.').run;
    expect(fits(after)).toBe(false);
    after.regionIndex += 1;
    expect(fits(after)).toBe(true);
    expect(placement('gn-new-18-door').often).toBe('region');
  });
  it('the parcel is bandages and a drawing: no Bond', () => {
    expect(JSON.stringify(content.events.get('gn-new-18-parcel'))).not.toMatch(/friendship/);
  });
});

describe('gn.new.19 The Snowbound Village (fixes)', () => {
  it('the grown child is met at step 5 of any stage, not only in-region stage 5', () => {
    const p = placement('gn-n19-grown');
    expect(p.stages).toEqual([]);
    expect([p.home, p.attaches]).toEqual([5, 'town']);
    expect(placement('gn-n19-door').window).toEqual([11, 16]);
  });
  const hailTurn = (warm: boolean): { mine: number; theirs: number } => {
    const me = mon('rattata', 50, 'p-hail', 'splash');
    const foe = mon('pidgey', 50, 'e-hail', 'splash');
    const ctx = fightCtx([me], [foe], 'warm-clothes');
    ctx.battle.weather = { id: 'hail', turns: 5 } as never;
    if (warm) ctx.battle.storyEffects.push('warm-clothes');
    const [a, b] = [me.hp, foe.hp];
    resolveTurn(ctx, { kind: 'move', index: 0 });
    return { mine: a - me.hp, theirs: b - foe.hp };
  };
  it('Warm Clothes: the party takes no hail damage; the foe still does; without them hail hurts', () => {
    expect(hailTurn(false).mine).toBeGreaterThan(0);
    const warm = hailTurn(true);
    expect(warm.mine).toBe(0);
    expect(warm.theirs).toBeGreaterThan(0);
  });
  it('Warm Clothes last for the region the village is in, and no longer', async () => {
    const { gnBattleStart } = await import('../../src/core/greenneedle');
    const start = (stamp: number): string[] => {
      const run = gnRun('warmfix');
      setFlag(run, 'sv-warm-region', stamp);
      const lead = run.party[0]!;
      run.battle = createBattle('wild', [mon('pidgey', 5, 'e-wr', 'splash')], 0, lead.uid);
      gnBattleStart(content, run);
      return run.battle.storyEffects;
    };
    expect(start(1)).toContain('warm-clothes'); // this region
    expect(start(2)).not.toContain('warm-clothes'); // another region's stamp
    expect(start(0)).not.toContain('warm-clothes');
  });
  const herd = (bell: boolean) => {
    const holder = mon('stantler', 50, 'p-bell', 'splash');
    if (bell) holder.held = { 'herd-bell': 1 };
    const ally = mon('rattata', 50, 'p-ally', 'splash');
    const third = mon('pidgey', 50, 'p-third', 'splash');
    const ctx = fightCtx([holder, ally, third], [mon('snorlax', 50, 'e-bell', 'splash')], 'herd-bell');
    ctx.battle.sideEffects.player.stealthRock = true;
    const swap = (i: number, m: PokemonInstance): number => { const before = m.hp; resolveTurn(ctx, { kind: 'switch', partyIndex: i }); return before - m.hp; };
    return { ctx, holder, ally, third, swap };
  };
  it('Herd Bell: the ally switching in as the holder leaves takes no hazard damage, nor the one the turn after; later ones do', () => {
    const b = herd(true);
    expect(b.swap(1, b.ally)).toBe(0); // the holder leaves: the bell rings
    expect(b.swap(2, b.third)).toBe(0); // the turn after
    expect(b.swap(1, b.ally)).toBeGreaterThan(0); // two turns on: the bell has stopped
    expect(content.catalog.get('herd-bell')!.giftOnly).toBe(true);
  });
  it('without the bell the hazards hurt every switch-in', () => {
    const b = herd(false);
    expect(b.swap(1, b.ally)).toBeGreaterThan(0);
  });
});
