// Greenneedle gn.new.22 The Alley Court (tools/events/co/greenneedle-new-22.ts; rule and ability in src/core/greenneedle/alley.ts).
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { FAIR_SHARE_DUE, fairShare } from '../../src/core/greenneedle/alley';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { choose, flagOf, gnRun, lose, open, openSide, win } from './helpers/gnPlay';
import { askDue } from '../../src/core/greenneedle/ask';
import { takeTurn } from '../../src/core/run';

const meowth = (run: ReturnType<typeof gnRun>) => run.party.find((m) => m.speciesId === 'meowth');
const E = 'gn-new-22-court';
const through = (run: ReturnType<typeof gnRun>, ...labels: string[]) => {
  let r = run;
  for (const l of labels) {
    const s = openSide(r)!;
    r = choose(r, s.eventId, l).run;
  }
  return r;
};

describe('gn.new.22 The Alley Court', () => {
  it('rule for the Persian: order holds, stolen goods, the Meowth joins with Fair Share', () => {
    const run = gnRun('alley-persian');
    open(run, E);
    const r = choose(run, E, '"Rule for the Persian."').run;
    expect(flagOf(r, 'court-persian')).toBe(1);
    expect(flagOf(r, 'bought-stolen')).toBe(1);
    expect(flagOf(r, 'court-done')).toBe(1);
    expect(meowth(r)?.fixedAbility).toBe('fair-share');
  });

  it('the kittens vote: the fish is shared and the Meowth joins', () => {
    const run = gnRun('alley-kittens');
    open(run, E);
    const r = choose(run, E, '"Ask what the kittens think."').run;
    expect(flagOf(r, 'court-kittens')).toBe(1);
    expect(flagOf(r, 'court-meowth')).toBe(0);
    expect(meowth(r)).toBeTruthy();
  });

  it('rule for the Meowth: straight to the challenge; a win and a loss both end with the Meowth', () => {
    for (const fight of [win, lose]) {
      const run = gnRun(`alley-meowth-${fight.name}`);
      open(run, E);
      let r = choose(run, E, '"Rule for the Meowth."').run;
      expect(flagOf(r, 'court-meowth')).toBe(1);
      r = choose(r, openSide(r)!.eventId, 'Let them fight.').run;
      expect(r.phase).toBe('battle');
      expect(r.battle!.enemyTeam[0]!.speciesId).toBe('persian');
      r = fight(r);
      r = through(r, 'Take the Meowth home.');
      expect(flagOf(r, 'court-done')).toBe(1);
      expect(flagOf(r, fight === win ? 'court-meowth-won' : 'court-meowth-lost')).toBe(1);
      expect(meowth(r)).toBeTruthy();
    }
  });

  it('three calls during the fight, asked at the start of turns 1, 3 and 5: Attack +1, Speed +1, a quarter back', () => {
    const run = gnRun('alley-calls');
    open(run, E);
    let r = choose(run, E, '"Rule for the Meowth."').run;
    r = choose(r, openSide(r)!.eventId, 'Let them fight.').run;
    // turn 1: the first call is asked before any command; answering uses no turn
    let ask = askDue(content, r)!;
    expect(ask.id).toBe('call-1');
    expect(ask.options.map((o) => o.label)).toEqual(['"Pounce!"', '"Dodge!"', '"Steady!"']);
    r = takeTurn(content, r, { kind: 'answer', ask: 'call-1', option: 0 }).run;
    expect(r.battle!.turn).toBe(1);
    expect(r.battle!.playerStages.atk).toBe(1);
    expect(askDue(content, r)).toBeNull();
    // the second call waits for turn 3, the third for turn 5
    r = structuredClone(r);
    r.battle!.turn = 2;
    expect(askDue(content, r)).toBeNull();
    r.battle!.turn = 3;
    ask = askDue(content, r)!;
    expect(ask.id).toBe('call-2');
    r = takeTurn(content, r, { kind: 'answer', ask: 'call-2', option: 1 }).run;
    expect(r.battle!.playerStages.spe).toBe(1);
    r = structuredClone(r);
    r.battle!.turn = 5;
    const mon = r.party[r.battle!.activeIndex]!;
    expect(mon.speciesId).toBe('meowth');
    mon.hp = 1;
    expect(askDue(content, r)!.id).toBe('call-3');
    r = takeTurn(content, r, { kind: 'answer', ask: 'call-3', option: 2 }).run;
    expect(r.party[r.battle!.activeIndex]!.hp).toBe(1 + Math.max(1, Math.floor(maxHp(content, mon) / 4)));
    expect(askDue(content, r)).toBeNull();
    // a call can't be made twice
    expect(() => takeTurn(content, r, { kind: 'answer', ask: 'call-3', option: 0 })).toThrow();
  });

  it('Fair Share: the Meowth joins with it and with Thief; a stolen item heals the next Pokémon sent in by 10%, once', () => {
    const run = gnRun('alley-share');
    open(run, E);
    const r = choose(run, E, '"Rule for the Persian."').run;
    const m = meowth(r)!;
    expect(m.fixedAbility).toBe('fair-share');
    expect(m.moves.some((x) => x.id === 'thief')).toBe(true);
    // the heal itself: 10% of max HP, never past full, nothing for a fainted Pokémon
    const other = createPokemon(content, 'snorlax', 30, 'ally');
    other.hp = 1;
    expect(fairShare(content, other)).toBe(Math.floor(maxHp(content, other) / 10));
    other.hp = maxHp(content, other);
    expect(fairShare(content, other)).toBe(0);
    other.hp = 0;
    expect(fairShare(content, other)).toBe(0);
    expect(fairShare(content, undefined)).toBe(0);
    // in battle: Thief takes the foe's item, and the Pokémon sent in next gets its share
    const thief = createPokemon(content, 'meowth', 30, 'thief');
    thief.fixedAbility = 'fair-share';
    thief.moves = [{ id: 'thief', pp: 20 }];
    thief.held = {};
    const ally = createPokemon(content, 'snorlax', 30, 'ally2');
    ally.hp = 10;
    const foe = createPokemon(content, 'snorlax', 60, 'foe');
    foe.moves = [{ id: 'splash', pp: 40 }];
    foe.held = { 'embers-collar': 1 };
    const battle = createBattle('wild', [foe], 0, thief.uid);
    const ctx: BattleContext = { content, battle, party: [thief, ally], inventory: {}, rng: new Rng(hashSeed('fs')), captureRng: new Rng(hashSeed('fs-c')), catchMultiplier: 1 };
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.storyEffects).toContain(FAIR_SHARE_DUE);
    const ev = resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(ally.hp).toBe(10 + Math.floor(maxHp(content, ally) / 10));
    expect(ev.some((e) => e.type === 'raid' && e.text.startsWith('Fair Share'))).toBe(true);
    expect(battle.storyEffects).not.toContain(FAIR_SHARE_DUE);
    // nothing more on the next switch
    const hp = thief.hp;
    resolveTurn(ctx, { kind: 'switch', partyIndex: 0 });
    expect(thief.hp).toBe(hp);
  });

  it('the afterstory coins come back on later stages of the same region only after the court', () => {
    const ev = content.events.get('gn-new-22-coin-5')!;
    expect(ev.callback).toBe(true);
    expect(ev.choices).toHaveLength(1);
  });
});
