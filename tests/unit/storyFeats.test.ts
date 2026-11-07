import { describe, expect, it } from 'vitest';
import { createBattle, type PlayerAction } from '../../src/core/battle/engine';
import { makeDoubles } from '../../src/core/battle/doubles';
import { createPokemon } from '../../src/core/pokemon';
import { openHistory } from '../../src/core/story/record';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import { RunStateSchema, type RunState } from '../../src/core/state';
import { armFeat, featCharged, featGate, featLines, FEATS, FEAT_IDS, gainCharge, keystoneFeat, memoryPhrase, recordFeat } from '../../src/core/story2/feats';
import { StoryV2Schema } from '../../src/core/story2/schema';
import type { Content } from '../../src/core/contentSchema';
import { content } from './helpers';

const BOSSES = ['gym-leader', 'elite-four', 'champion'] as const;

function storyRun(seed = 'feat'): { run: RunState; uid: string } {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  // A fixed partner (Charmander, Scratch only) so every scenario starts the same.
  // Fixed IVs too (W5): best for the partner, none for the foes, so speed order never depends on a roll.
  const lead = { ...createPokemon(content, 'charmander', 15, run.party[0]!.uid), moves: [{ id: 'scratch', pp: 99 }], ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } };
  run.party[0] = lead;
  openHistory(content, run, lead.uid, lead.speciesId, 'starter');
  const v2 = StoryV2Schema.parse({ mode: 'story_run' });
  v2.heartbond.partner = lead.uid;
  run.story.v2 = v2;
  return { run, uid: lead.uid };
}

function bossBattle(run: RunState, classId: string, foe = 'rattata', level = 5): RunState {
  run.battle = createBattle('trainer', [{ ...createPokemon(content, foe, level, 'e1'), ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } }], 0, run.party[0]!.uid, { classId, name: 'Boss', leaderId: null });
  run.battle.turn = 4;
  run.phase = 'battle';
  return run;
}

const feats = (run: RunState) => run.story.v2!.feats;

describe('Resolve Charge', () => {
  it('banks one Feat at 100, keeps the rest at 100, and banks two once Heartbond 9 is latched', () => {
    const { run } = storyRun();
    for (let b = 0; b < 4; b += 1) {
      run.encountersCompleted = b;
      expect(gainCharge(content, run, 'survive_disadvantage').gained).toBe(25);
    }
    expect(feats(run)).toMatchObject({ banked: 1, charge: 0 });
    for (let b = 4; b < 8; b += 1) { run.encountersCompleted = b; gainCharge(content, run, 'survive_disadvantage'); }
    expect(feats(run)).toMatchObject({ banked: 1, charge: 100 });
    run.story.v2!.heartbond.latched.push(9);
    run.encountersCompleted = 9;
    expect(gainCharge(content, run, 'protect_ally').banked).toBe(true);
    expect(feats(run).banked).toBe(2);
  });

  it('caps each source per battle, per Act and per beat; a repeat pays nothing', () => {
    const { run } = storyRun();
    expect(gainCharge(content, run, 'survive_disadvantage').gained).toBe(25);
    expect(gainCharge(content, run, 'survive_disadvantage').gained).toBe(0);
    expect(gainCharge(content, run, 'protect_ally').gained).toBe(20);
    expect(gainCharge(content, run, 'protect_ally').gained).toBe(20);
    expect(gainCharge(content, run, 'protect_ally').gained).toBe(0);
    run.encountersCompleted = 5;
    expect(gainCharge(content, run, 'return_after_loss').gained).toBe(30);
    run.encountersCompleted = 6;
    expect(gainCharge(content, run, 'return_after_loss').gained).toBe(0); // once per Act
    expect(gainCharge(content, run, 'arc_beat', 'arc_x:0').gained).toBe(20);
    expect(gainCharge(content, run, 'arc_beat', 'arc_x:0').gained).toBe(0);
    expect(gainCharge(content, run, 'nonsense').gained).toBe(0);
  });

  it('gains nothing with Dramatic Moments Off, in Hardcore, in a Classic run, or without a partner', () => {
    const { run } = storyRun();
    run.story.v2!.dramatic = 'off';
    expect(gainCharge(content, run, 'survive_disadvantage').gained).toBe(0);
    const hard = storyRun().run;
    hard.rules = { ...hard.rules!, modeId: 'hardcore-nuzlocke' };
    expect(gainCharge(content, hard, 'survive_disadvantage').gained).toBe(0);
    const classic = storyRun().run;
    delete classic.story.v2;
    expect(gainCharge(content, classic, 'survive_disadvantage').gained).toBe(0);
  });

  it('the Keystone Memory banks one Feat once a run', () => {
    const { run } = storyRun();
    expect(keystoneFeat(content, run)).toBe(true);
    expect(keystoneFeat(content, run)).toBe(false);
    expect(feats(run).banked).toBe(1);
    expect(featCharged(run)).toBe(true);
  });
});

describe('Feat gate (when a banked Feat may fire)', () => {
  const banked = (classId = 'gym-leader') => {
    const { run } = storyRun();
    feats(run).banked = 1;
    return bossBattle(run, classId);
  };

  it('needs a bank, a significant battle and a late enough turn', () => {
    expect(featGate(content, banked())?.allowed).toContain('not_yet');
    const none = storyRun().run;
    expect(featGate(content, bossBattle(none, 'gym-leader'))).toBeNull();
    const wild = banked();
    wild.battle = createBattle('wild', [createPokemon(content, 'rattata', 3, 'w')], 0, wild.party[0]!.uid);
    wild.battle.turn = 5;
    expect(featGate(content, wild)).toBeNull();
    const early = banked();
    early.battle!.turn = 1;
    expect(featGate(content, early)).toBeNull();
  });

  it('respects the setting: Off and Hardcore stop it, Prompt waits to be armed', () => {
    const off = banked();
    off.story.v2!.dramatic = 'off';
    expect(featGate(content, off)).toBeNull();
    const prompt = banked();
    prompt.story.v2!.dramatic = 'prompt';
    expect(featGate(content, prompt)).toBeNull();
    expect(armFeat(prompt)).toBe(true);
    expect(featGate(content, prompt)).not.toBeNull();
    const quiet = banked();
    quiet.story.v2!.dramatic = 'quiet';
    expect(armFeat(quiet)).toBe(false);
    expect(featGate(content, quiet)).not.toBeNull();
  });

  it('applies the run caps: 1 a battle, 2 an Act, 6 a run, the same Feat twice, once-a-run Feats once', () => {
    const run = banked();
    feats(run).banked = 2;
    recordFeat(content, run, 'not_yet');
    expect(featGate(content, run)).toBeNull(); // one this battle
    run.encountersCompleted += 1;
    expect(featGate(content, run)?.allowed).toContain('not_yet');
    recordFeat(content, run, 'not_yet');
    run.encountersCompleted += 1;
    feats(run).banked = 1;
    expect(featGate(content, run)).toBeNull(); // two this Act
    feats(run).used = feats(run).used.map((u) => ({ ...u, act: 0 }));
    expect(featGate(content, run)?.allowed).not.toContain('not_yet'); // same Feat twice
    feats(run).used = Array.from({ length: 6 }, (_, i) => ({ id: 'blind_strike', battle: `x${i}`, act: 0 }));
    expect(featGate(content, run)).toBeNull(); // six a run
  });

  it('per-Feat rules: Refuse to Fall only in the final fight, Read the Room needs Intelligent or Heartbond 8, Elite answer-lock', () => {
    expect(featGate(content, banked())?.allowed).not.toContain('refuse_to_fall');
    expect(featGate(content, banked('champion'))?.allowed).toContain('refuse_to_fall');
    const flagged = banked();
    flagged.story.v2!.facts['final_battle'] = true;
    expect(featGate(content, flagged)?.allowed).toContain('refuse_to_fall');
    const l8 = banked();
    l8.story.v2!.heartbond.latched.push(8);
    expect(featGate(content, l8)?.allowed).toContain('read_the_room');
    const locked = banked('elite-four');
    locked.story.v2!.facts['answer_lock'] = true;
    expect(featGate(content, locked)).toBeNull();
    // Limited Feats (no engine hook yet) are never offered.
    expect(featGate(content, banked('champion'))!.allowed.every((id) => FEATS.find((f) => f.id === id)!.status === 'supported')).toBe(true);
  });
});

describe('Feat lines', () => {
  it('quotes the most memorable memory', () => {
    const { run, uid } = storyRun();
    run.story.histories[uid]!.memories = [
      { eventId: 'a', seq: 1, type: 'storyMoment', importance: 40, text: 'A quiet walk.', where: { region: 0, stage: 0 }, emotions: [] },
      { eventId: 'b', seq: 2, type: 'storyMoment', importance: 90, text: 'The rockfall!', where: { region: 0, stage: 1 }, emotions: [] },
    ] as never;
    expect(memoryPhrase(run, uid)).toBe('the rockfall');
    expect(featLines(content.storyData.text, 'not_yet', 'Machop', 'the rockfall')).toEqual(['Machop will not fall. Not yet!', 'Machop remembered the rockfall.']);
    for (const id of FEAT_IDS) expect(content.storyData.text[`feat.${id}.line`], id).toBeTruthy();
  });
});

// ---------- scenario suite: force each supported Feat in each boss fight; no softlock, valid state ----------

type Setup = (run: RunState, c: { content: Content; classId: string; first?: PlayerAction; expect?: string }) => void;
const backstory = (r: RunState, id: string) => { r.story.v2!.protagonist = { look: 'a', name: 'Kai', pronouns: 'they', backstory: id }; };
const mon = (species: string, level: number, uid: string, moves: string[]) => ({ ...createPokemon(content, species, level, uid), moves: moves.map((id) => ({ id, pp: 99 })) });
/** A double battle: the partner (made sturdy) beside a frail ally, against two foes. */
function duo(r: RunState, classId: string, foes: [string, number]): void {
  const uid = r.party[0]!.uid;
  r.party = [mon('charmander', 60, uid, ['scratch']), mon('rattata', 30, 'ally', ['tackle'])];
  r.battle = createBattle('trainer', [mon(foes[0], foes[1], 'e1', ['tackle']), mon(foes[0], foes[1], 'e2', ['tackle'])], 0, uid, { classId, name: 'Boss', leaderId: null });
  r.battle.turn = 4;
  makeDoubles(r.battle, r.party);
}
const half = (run: RunState) => { const m = run.party[0]!; m.hp = Math.max(1, Math.floor(m.hp / 2)); };
const SETUPS: Record<string, { foe: string; level: number; setup: Setup; check: (before: RunState, after: RunState) => void }> = {
  not_yet: { foe: 'machamp', level: 70, setup: half, check: (_b, a) => {
    expect(a.party[0]!.hp).toBe(1);
    // Rule 4: the Feat and a clutch survive in one turn pay Heartbond once (the Feat).
    const keys = a.story.v2!.heartbond.ledger;
    expect(keys.some((k) => k.includes(':feat:'))).toBe(true);
    expect(keys.some((k) => k.includes(':clutch_survive:'))).toBe(false);
  } },
  refuse_to_fall: { foe: 'machamp', level: 70, setup: (r) => { r.story.v2!.facts['final_battle'] = true; }, check: (_b, a) => expect(a.party[0]!.hp).toBeGreaterThan(1) },
  through_the_numbness: { foe: 'snorlax', level: 5, setup: (r, c) => { r.party[0]!.status = { id: 'par', turns: 0 } as never; c.content = { ...c.content, ruleset: { ...c.content.ruleset, fullParalysisChance: 1 } }; }, check: () => {} },
  faster_than_fear: { foe: 'jolteon', level: 60, setup: half, check: () => {} },
  against_the_odds: { foe: 'blastoise', level: 40, setup: (r) => { r.battle!.enemyTeam[0]!.moves = [{ id: 'water-gun', pp: 30 }]; }, check: () => {} },
  blind_strike: { foe: 'snorlax', level: 5, setup: (r) => { r.battle!.playerStages.acc = -6; }, check: () => {} },
  read_the_room: { foe: 'snorlax', level: 30, setup: (r) => { half(r); r.story.v2!.heartbond.latched.push(8); }, check: () => {} },
  crack_the_barrier: { foe: 'snorlax', level: 10, setup: (r) => { half(r); r.battle!.sideEffects.enemy.reflect = 5; }, check: (_b, a) => expect(a.battle?.sideEffects.enemy.reflect ?? 0).toBe(0) },
  between_them_and_it: { foe: 'machop', level: 30, setup: (r, c) => { duo(r, c.classId, ['machop', 30]); r.party[1]!.hp = 1; }, check: (b, a) => expect(a.party[0]!.hp).toBeLessThan(b.party[0]!.hp) },
  spark_shared: { foe: 'snorlax', level: 10, setup: (r, c) => { duo(r, c.classId, ['snorlax', 10]); half(r); r.battle!.sideEffects.enemy.reflect = 5; c.expect = 'crack_the_barrier'; }, check: (_b, a) => expect(a.battle!.doubles!.player.stages.atk).toBe(1) },
  break_the_rule: { foe: 'misdreavus', level: 10, setup: (r) => { r.party[0]!.moves = [{ id: 'mud-slap', pp: 99 }]; }, check: (_b, a) => expect(a.story.v2!.feats.gains).toContain('brk:levitate') },
  unmask_the_illusion: { foe: 'mimikyu', level: 10, setup: () => {}, check: (_b, a) => expect(a.battle?.extra.brokenFace ?? ['e1']).toContain('e1') },
  call_of_the_wild: { foe: 'snorlax', level: 30, setup: (r) => { backstory(r, 'bs_viridian'); half(r); }, check: (b, a) => expect(a.battle!.enemyTeam[0]!.hp).toBeLessThan(b.battle!.enemyTeam[0]!.hp) },
  old_tactics: { foe: 'snorlax', level: 10, setup: (r, c) => {
    backstory(r, 'bs_ex_criminal');
    const partner = r.party[0]!;
    r.party = [mon('rattata', 10, 'lead', ['tackle']), partner];
    r.battle = createBattle('trainer', [mon('snorlax', 10, 'e1', ['tackle'])], 0, 'lead', { classId: c.classId, name: 'Boss', leaderId: null });
    r.battle.turn = 4;
    r.battle.sideEffects.player.spikes = 3;
    r.battle.sideEffects.player.stealthRock = true;
    c.first = { kind: 'switch', partyIndex: 1 };
  }, check: (b, a) => expect(a.party[1]!.hp).toBeGreaterThan(0) },
  resonance_pulse: { foe: 'snorlax', level: 10, setup: (r) => { backstory(r, 'bs_aether'); r.battle!.enemyTeam[0]!.moves = [{ id: 'thunder-wave', pp: 99 }]; }, check: (_b, a) => expect(a.party[0]!.status).toBeNull() },
  old_style_surge: { foe: 'snorlax', level: 30, setup: (r) => { backstory(r, 'bs_hisui'); half(r); }, check: () => {} },
};

describe('scenario suite: each Feat in each boss fight', () => {
  it('covers every supported Feat', () => {
    expect(Object.keys(SETUPS).sort()).toEqual(FEATS.filter((f) => f.status === 'supported').map((f) => f.id).sort());
  });

  for (const classId of BOSSES) {
    for (const [id, s] of Object.entries(SETUPS)) {
      it(`${id} in a ${classId} fight fires once, with no softlock`, () => {
        const { run } = storyRun(`${id}-${classId}`);
        bossBattle(run, classId, s.foe, s.level);
        // Loose Act/run caps so the other Feats can be parked as "used twice" and only this one can fire.
        const c: { content: Content; classId: string; first?: PlayerAction; expect?: string } = { classId, content: { ...content, balance: { ...content.balance, story: { ...content.balance.story, feats: { ...content.balance.story.feats, caps: { battle: 1, act: 999, run: 999, sameFeat: 2 } } } } } as Content };
        s.setup(run, c);
        const f = feats(run);
        f.banked = 1;
        for (const other of FEAT_IDS) if (other !== (c.expect ?? id)) f.used.push({ id: other, battle: 'pre', act: 99 }, { id: other, battle: 'pre2', act: 99 });
        const parked = f.used.length;
        let state = run;
        let fired = false;
        for (let t = 0; t < 30 && state.phase === 'battle' && state.battle && !state.battle.outcome; t += 1) {
          const before = state;
          const swap = state.battle.needsSwitch ? state.party.findIndex((m, i) => m.hp > 0 && i !== state.battle!.activeIndex) : -1;
          if (state.battle.needsSwitch && swap < 0) break;
          state = takeTurn(c.content, state, swap >= 0 ? { kind: 'switch', partyIndex: swap } : t === 0 && c.first ? c.first : { kind: 'move', index: 0 }).run;
          if (!fired && state.story.v2!.feats.used.length > parked) {
            fired = true;
            s.check(before, state);
          }
        }
        const used = feats(state).used.slice(parked);
        expect(used.map((u) => u.id)).toEqual([c.expect ?? id]);
        expect(feats(state).first).toBe(c.expect ?? id);
        expect(feats(state).banked).toBe(0);
        expect(() => RunStateSchema.parse(JSON.parse(JSON.stringify(state)))).not.toThrow();
      });
    }
  }
});

