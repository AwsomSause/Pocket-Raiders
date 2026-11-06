import { describe, expect, it } from 'vitest';
import { adjustBond, bondOf, shapeAction, wouldRefuse } from '../../src/core/bond';
import { createBattle } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { openHistory } from '../../src/core/story/record';
import { berryFlavor, careAction, favoriteFlavor, hatedFlavor } from '../../src/core/care';
import { chooseStarter, createRun } from '../../src/core/run';
import { HEARTBOND, heartbondTurn, heartbondVictory, heartbondCare, heartbondLabel, takeBeat, BEAT_LEVELS, recoveryScenes, clutchSurvived, heartbondLevel, heartbondScore, markRecovery, payHeartbond, refreshHeartbond, takePendingLatches } from '../../src/core/story2/heartbond';
import { StoryV2Schema } from '../../src/core/story2/schema';
import { TEMPERAMENTS, TEMPERAMENT_NAMES, temperamentOf } from '../../src/core/story2/temperament';
import { content } from './helpers';
import overhaul from '../../src/data/overhaul/personalities.json';

function setup() {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'hb', seed: 'hb', archetypeId: 'red' }), 0));
  const uid = run.party[0]!.uid;
  run.story.histories[uid] ??= { joinedBy: 'starter' } as never;
  const v2 = StoryV2Schema.parse({ mode: 'story_run' });
  v2.heartbond.partner = uid;
  run.story.v2 = v2;
  return { run, uid, v2 };
}

describe('heartbond score and levels', () => {
  it('a fresh starter scores about 42 and is level 1; the score stays in 0..100', () => {
    const { run, uid } = setup();
    const hs = heartbondScore(bondOf(run, uid));
    expect(hs).toBeGreaterThan(38);
    expect(hs).toBeLessThan(46);
    expect(heartbondLevel(hs)).toBe(1);
    expect(heartbondScore({ trust: 100, affection: 100, respect: 100, synchronization: 100, confidence: 100, strain: 0 })).toBe(90 + 10);
    expect(heartbondScore({ trust: 0, affection: 0, respect: 0, synchronization: 0, confidence: 0, strain: 100 })).toBe(0);
  });
  it('the design worked examples land on level 6 (68.75 is over the 66 line) and level 8; same inputs give the same score', () => {
    const good = { trust: 80, affection: 70, respect: 65, synchronization: 60, confidence: 70, strain: 10 };
    const great = { trust: 90, affection: 85, respect: 80, synchronization: 75, confidence: 80, strain: 5 };
    expect(heartbondScore(good)).toBeCloseTo(68.75, 2);
    expect(heartbondLevel(heartbondScore(good))).toBe(6);
    expect(heartbondLevel(heartbondScore(great))).toBe(8);
    expect(heartbondScore(good)).toBe(heartbondScore({ ...good }));
    expect(HEARTBOND.thresholds).toHaveLength(9);
  });
});

describe('latches', () => {
  it('a latched level stays after strain pulls the displayed level down, and its scene waits until a safe moment', () => {
    const { run, uid, v2 } = setup();
    adjustBond(bondOf(run, uid), { trust: 45, affection: 55, respect: 40, synchronization: 45, confidence: 40 });
    const first = refreshHeartbond(run)!;
    expect(first.level).toBeGreaterThanOrEqual(7);
    expect(first.latched).toContain(3);
    expect(v2.heartbond.pending.length).toBeGreaterThan(0);
    expect(takePendingLatches(v2)).toEqual(first.latched);
    expect(v2.heartbond.pending).toEqual([]);
    adjustBond(bondOf(run, uid), { strain: 100 });
    const later = refreshHeartbond(run)!;
    expect(later.level).toBeLessThan(first.level);
    expect(v2.heartbond.latched).toEqual(expect.arrayContaining(first.latched));
    expect(later.latched).toEqual([]);
  });
  it('level 10 latched plus a Recovery stop makes the Keystone Memory ready, once, even with Autonomy Off (pays never read settings)', () => {
    const { run, uid, v2 } = setup();
    adjustBond(bondOf(run, uid), { trust: 100, affection: 100, respect: 100, synchronization: 100, confidence: 100 });
    expect(refreshHeartbond(run)!.level).toBe(10);
    expect(v2.heartbond.keystoneReady).toBe(false);
    expect(markRecovery(v2)).toBe(true);
    expect(markRecovery(v2)).toBe(false);
  });
});

describe('anti-double-pay', () => {
  it('one payer per turn: a Feat beats a clutch survive and a signature finish, which are folded', () => {
    const { run, uid } = setup();
    const before = { ...bondOf(run, uid) };
    const r = payHeartbond(run, uid, 'battle1', 3, ['clutch_survive', 'feat', 'signature_clutch']);
    expect(r.paid).toEqual(['feat']);
    expect(r.folded.sort()).toEqual(['clutch_survive', 'signature_clutch']);
    const b = bondOf(run, uid);
    expect(b.trust - before.trust).toBe(3);
    expect(b.confidence - before.confidence).toBe(3);
    expect(b.synchronization).toBe(before.synchronization);
  });
  it('rank order: story beat > milestone win > feat > hyper/overdrive > clutch survive > signature > guard > underdog', () => {
    const order = ['story_beat', 'milestone_win', 'feat', 'hyper_moment', 'clutch_survive', 'signature_clutch', 'guard_ally', 'underdog_win'];
    for (let i = 0; i < order.length - 1; i++) {
      const { run, uid } = setup();
      expect(payHeartbond(run, uid, 'b', 1, [order[i + 1]!, order[i]!]).paid).toEqual([order[i]]);
    }
  });
  it('a replayed turn cannot pay the same ledger key twice, and per-battle caps hold', () => {
    const { run, uid } = setup();
    expect(payHeartbond(run, uid, 'b', 1, ['guard_ally']).paid).toEqual(['guard_ally']);
    const once = { ...bondOf(run, uid) };
    expect(payHeartbond(run, uid, 'b', 1, ['guard_ally']).paid).toEqual([]);
    expect(bondOf(run, uid)).toEqual(once);
    expect(payHeartbond(run, uid, 'b', 2, ['guard_ally']).paid).toEqual(['guard_ally']);
    expect(payHeartbond(run, uid, 'b', 3, ['guard_ally']).paid).toEqual([]);
  });
  it('hyper and overdrive pay once as one source; unranked care sources pay beside a ranked one', () => {
    const { run, uid } = setup();
    expect(payHeartbond(run, uid, 'b', 1, ['hyper_moment', 'overdrive_moment', 'care_touch']).paid.sort()).toEqual(['care_touch', 'hyper_moment']);
  });
  it('without a Story Run nothing is paid', () => {
    const { run, uid } = setup();
    run.story.v2 = undefined;
    expect(payHeartbond(run, uid, 'b', 1, ['feat'])).toEqual({ paid: [], folded: [] });
  });
});

describe('core temperaments', () => {
  it('every one of the 58 personalities maps to exactly one of the 16 Temperaments, and nothing extra is mapped', () => {
    const ids = (overhaul as { entries: { id: string }[] }).entries.map((e) => e.id);
    const mapped = Object.values(TEMPERAMENTS).flat();
    expect(Object.keys(TEMPERAMENTS)).toHaveLength(16);
    expect(new Set(mapped).size).toBe(mapped.length);
    expect([...mapped].sort()).toEqual([...ids].sort());
    for (const id of ids) expect(temperamentOf(id), id).toBeDefined();
    for (const tm of Object.keys(TEMPERAMENTS)) expect(TEMPERAMENT_NAMES[tm as keyof typeof TEMPERAMENTS]).toBeTruthy();
    expect(temperamentOf('nope')).toBeUndefined();
  });
});

describe('battle hooks', () => {
  it('a partner Hyper moment pays once through the ledger; other Pokémon and replays pay nothing', () => {
    const { run, uid } = setup();
    const before = bondOf(run, uid).synchronization;
    const ev = [{ type: 'hyper', side: 'player', uid }, { type: 'hyper', side: 'player', uid: 'other' }];
    expect(heartbondTurn(run, 'b1', 2, ev).paid).toEqual(['hyper_moment']);
    expect(bondOf(run, uid).synchronization - before).toBe(3);
    expect(heartbondTurn(run, 'b1', 2, ev).paid).toEqual([]);
  });
  it('a milestone win pays only for a boss or rival fight, and only once', () => {
    const { run, uid } = setup();
    expect(heartbondVictory(run, 'b1', false).paid).toEqual([]);
    expect(heartbondVictory(run, 'b1', true).paid).toEqual(['milestone_win']);
    expect(heartbondVictory(run, 'b1', true).paid).toEqual([]);
    expect(bondOf(run, uid).respect).toBeGreaterThan(0);
  });
  it('without a Story Run the hooks do nothing', () => {
    const { run } = setup();
    run.story.v2 = undefined;
    expect(heartbondTurn(run, 'b', 1, [{ type: 'hyper', side: 'player', uid: 'x' }]).paid).toEqual([]);
  });
});

describe('guard hook', () => {
  it('the partner guarding an ally pays guard_ally at most twice a battle', () => {
    const { run, uid } = setup();
    const ev = [{ type: 'sacrifice', side: 'player', uid }];
    expect(heartbondTurn(run, 'b1', 1, ev).paid).toEqual(['guard_ally']);
    expect(heartbondTurn(run, 'b1', 2, ev).paid).toEqual(['guard_ally']);
    expect(heartbondTurn(run, 'b1', 3, ev).paid).toEqual([]);
  });
});

describe('clutch hook', () => {
  it('survives from half HP down to 15% or less pays once; a faint or a small dip does not', () => {
    expect(clutchSurvived(60, 10, 100)).toBe(true);
    expect(clutchSurvived(60, 0, 100)).toBe(false);
    expect(clutchSurvived(60, 40, 100)).toBe(false);
    expect(clutchSurvived(30, 10, 100)).toBe(false);
    const { run, uid } = setup();
    expect(heartbondTurn(run, 'b1', 1, [{ type: 'clutch', side: 'player', uid }]).paid).toEqual(['clutch_survive']);
    expect(heartbondTurn(run, 'b1', 2, [{ type: 'clutch', side: 'player', uid }]).paid).toEqual([]);
  });
});

describe('heartbond label', () => {
  it('shows for the partner only, and notes the best level when strain pulls it down', () => {
    const { run, uid } = setup();
    expect(heartbondLabel(run, uid)).toBe('Heartbond 1');
    expect(heartbondLabel(run, 'other')).toBeNull();
    run.story.v2!.heartbond.latched.push(3);
    expect(heartbondLabel(run, uid)).toBe('Heartbond 1 (best 3)');
    run.story.v2 = undefined;
    expect(heartbondLabel(run, uid)).toBeNull();
  });
});

describe('care hooks', () => {
  it('care and rest pay the partner only, capped per stop', () => {
    const { run, uid } = setup();
    expect(heartbondCare(run, uid, 'care_touch', 'c1', 1).paid).toEqual(['care_touch']);
    expect(heartbondCare(run, uid, 'care_touch', 'c1', 1).paid).toEqual([]);
    expect(heartbondCare(run, 'other', 'care_touch', 'c1', 2).paid).toEqual([]);
    expect(heartbondCare(run, uid, 'rest_together', 'r1', 0).paid).toEqual(['rest_together']);
  });
});

describe('temperament beats', () => {
  it('every Temperament has a line for levels 3, 6 and 9', () => {
    const text = content.storyData.text;
    for (const tm of Object.keys(TEMPERAMENTS)) for (const lv of BEAT_LEVELS) expect(text[`hb.beat.${tm}.${lv}`], `${tm} ${lv}`).toContain('{pokemon}');
  });
  it('plays the oldest waiting 3/6/9 beat once, leaves other latches waiting, and skips Classic runs', () => {
    const { run, uid, v2 } = setup();
    v2.heartbond.pending = [5, 3, 6];
    const name = () => 'Pika';
    const first = takeBeat(run, content.storyData.text, name)!;
    expect(first).toContain('Pika');
    expect(v2.heartbond.pending).toEqual([5, 6]);
    expect(takeBeat(run, content.storyData.text, name)).not.toBeNull();
    expect(v2.heartbond.pending).toEqual([5]);
    expect(takeBeat(run, content.storyData.text, name)).toBeNull();
    expect(v2.heartbond.pending).toEqual([5]);
    run.story.v2 = undefined;
    expect(takeBeat(run, content.storyData.text, name)).toBeNull();
    expect(uid).toBeTruthy();
  });
});

describe('snack heartbond', () => {
  const berries = () => [...content.catalog.values()].filter((e) => e.family.startsWith('Berries')).map((e) => e.id);
  function feedSetup() {
    const { run, uid } = setup();
    run.phase = 'map';
    const mon = run.party[0]!;
    return { run, uid, mon, loved: berries().find((b) => berryFlavor(b) === favoriteFlavor(mon))!, hated: berries().find((b) => berryFlavor(b) === hatedFlavor(mon))! };
  }
  it('a loved snack pays affection +2, a hated one pays nothing', () => {
    const a = feedSetup();
    a.run.looseHeld = { [a.loved]: 1 };
    const before = bondOf(a.run, a.uid).affection;
    const after = careAction(content, a.run, 0, 'feed').run;
    expect(bondOf(after, a.uid).affection - before).toBe(2);
    const b = feedSetup();
    b.run.looseHeld = { [b.hated]: 1 };
    const beforeHated = bondOf(b.run, b.uid).affection;
    const afterHated = careAction(content, b.run, 0, 'feed').run;
    expect(bondOf(afterHated, b.uid).affection).toBe(beforeHated);
    expect(afterHated.story.v2!.heartbond.ledger).toEqual([]);
  });
});

describe('recovery and keystone', () => {
  it('every Temperament has a Keystone line', () => {
    for (const tm of Object.keys(TEMPERAMENTS)) expect(content.storyData.text[`hb.keystone.${tm}`], tm).toContain('{pokemon}');
  });
  it('level 10 latched plus a Recovery stop plays the Keystone Memory once; a waiting beat plays first', () => {
    const { run, v2 } = setup();
    const text = content.storyData.text;
    const name = () => 'Pika';
    expect(recoveryScenes(run, text, name)).toEqual([]);
    v2.heartbond.latched.push(10);
    v2.heartbond.pending = [3];
    const first = recoveryScenes(run, text, name);
    expect(first).toHaveLength(2);
    expect(first.every((l) => l.includes('Pika'))).toBe(true);
    expect(v2.heartbond.keystoneReady).toBe(true);
    expect(recoveryScenes(run, text, name)).toEqual([]);
    run.story.v2 = undefined;
    expect(recoveryScenes(run, text, name)).toEqual([]);
  });
});

describe('autonomy and override', () => {
  function refuser() {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'ov', seed: 'ov', archetypeId: 'red' }), 0));
    const lead = run.party[0]!;
    openHistory(content, run, lead.uid, lead.speciesId, 'starter');
    run.party.push(createPokemon(content, 'rattata', 5, 'spare'));
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 10, 'e1')], 0, lead.uid, null);
    run.phase = 'battle';
    lead.moves = [{ id: 'explosion', pp: 5 }, { id: 'tackle', pp: 5 }];
    Object.assign(bondOf(run, lead.uid), { autonomy: 80, trust: 20 });
    run.story.v2 = StoryV2Schema.parse({ mode: 'story_run' });
    return { run, lead };
  }
  it('Autonomy Off or Flavor never offers a refusal; Full does', () => {
    const { run, lead } = refuser();
    expect(wouldRefuse(content, run, lead, 'explosion')).toBe(true);
    for (const mode of ['off', 'flavor'] as const) {
      run.story.v2!.autonomy = mode;
      expect(wouldRefuse(content, run, lead, 'explosion')).toBe(false);
      expect(shapeAction(content, run, { kind: 'move', index: 0 }).action).toEqual({ kind: 'move', index: 0 });
    }
  });
  it('your last conscious Pokémon never refuses', () => {
    const { run, lead } = refuser();
    run.party[1]!.hp = 0;
    expect(wouldRefuse(content, run, lead, 'explosion')).toBe(false);
  });
  it('an override sends the command through, costs trust and respect, counts, and is free from the third on', () => {
    const { run, lead } = refuser();
    const before = { ...bondOf(run, lead.uid) };
    const out = shapeAction(content, run, { kind: 'move', index: 0, override: true });
    expect(out.action).toMatchObject({ kind: 'move', index: 0 });
    expect(out.events).toEqual([]);
    expect(bondOf(run, lead.uid).trust - before.trust).toBe(-2);
    expect(bondOf(run, lead.uid).respect - before.respect).toBe(-2);
    expect(run.story.v2!.heartbondOverrides).toBe(1);
    // Not refused again this battle, so a second insist is just a normal command.
    expect(shapeAction(content, run, { kind: 'move', index: 0, override: true }).action).toMatchObject({ kind: 'move' });
    expect(run.story.v2!.heartbondOverrides).toBe(1);
    // The cap: only two pays a battle.
    for (const t of [2, 3]) expect(payHeartbond(run, lead.uid, `b${run.encountersCompleted}`, t, ['override_cost']).paid.length).toBe(t === 2 ? 1 : 0);
  });
  it('Classic runs still refuse as before, and ignore the override flag', () => {
    const { run } = refuser();
    run.story.v2 = undefined;
    expect(shapeAction(content, run, { kind: 'move', index: 0, override: true }).action).toEqual({ kind: 'idle' });
  });
});
