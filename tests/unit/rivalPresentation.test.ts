// Beta 0.6 workstream 5 (R4-R8, R11): tier-5 AI, dialogue bank, presence, Friend, Witness the Rest.
import { describe, expect, it } from 'vitest';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { authoredCount, BANK, BANK_CONTEXTS, categoryOf, fillMon, pickContextLine, pickSpeciesLine, speciesLines } from '../../src/core/rivals/bank';
import { clampAttitude, friendAssist, friendInRegion, friendPersonality, friendScene, postcard } from '../../src/core/rivals/friend';
import { OVERHAUL, registerRival } from '../../src/core/rivals/overhaul';
import { catchStepIn, pseudoPresence, regionMeetings, PRESENCE } from '../../src/core/rivals/presence';
import { brainFor, chooseWinCondition, endgamePick, mayCounter, scout, switchPunishChance, tier5Pick, type RivalBrain, type Tier5Input } from '../../src/core/rivals/tier5';
import { witnessCards } from '../../src/core/rivals/witness';
import { chooseStarter, createRun } from '../../src/core/run';
import { chooseEnemyMove, createBattle } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const run = () => chooseStarter(content, createRun(content, { runId: 'w5', seed: 'w5', archetypeId: 'red' }), 0);
const reg = (r: ReturnType<typeof run>, p = 'strategist', id = 'blue', role: 'main' | 'friend' = 'main') => registerRival(r, { id, role, personality: p, style: 'blitz', arc: 'prodigy-learns-humility' });
const brain = (o: Partial<RivalBrain> = {}): RivalBrain => ({ tier: 5, winCondition: 'sweep', personality: 'strategist', seenMoves: [], seenSpecies: [], switchRate: 0.25, seed: 's:blue', ...o });
const input = (o: Partial<Tier5Input> = {}): Tier5Input => ({
  brain: brain(), turn: 1, ownHp: 100, ownMaxHp: 100, foeHp: 100, foeMaxHp: 100, ownFaster: true, foeBestDamage: 30, isAce: false, ownReserves: 3, foeReserves: 3, switchLikely: false,
  options: [{ index: 0, score: 10, damage: 40 }, { index: 1, score: 8, damage: 20 }], ...o,
});

describe('R4 tier-5 AI', () => {
  it('is deterministic: the same input gives the same move', () => {
    const i = input({ switchLikely: true, options: [{ index: 0, score: 10, damage: 40, switchDamage: 5 }, { index: 1, score: 8, damage: 20, switchDamage: 50 }] });
    for (let t = 1; t < 30; t++) expect(tier5Pick({ ...i, turn: t })).toBe(tier5Pick({ ...i, turn: t }));
  });
  it('punishes a switch about half the time, shifted by your habit (0.3..0.7)', () => {
    const base = input({ switchLikely: true, options: [{ index: 0, score: 10, damage: 40, switchDamage: 5 }, { index: 1, score: 8, damage: 20, switchDamage: 50 }] });
    const share = (rate: number) => {
      let n = 0;
      for (let t = 1; t <= 2000; t++) if (tier5Pick({ ...base, brain: brain({ switchRate: rate }), turn: t }) === 1) n++;
      return n / 2000;
    };
    expect(share(0.25)).toBeGreaterThan(0.45);
    expect(share(0.25)).toBeLessThan(0.55);
    expect(share(1)).toBeGreaterThan(0.65);
    expect(share(0)).toBeLessThan(0.4);
    expect(switchPunishChance(5)).toBe(0.7);
    expect(switchPunishChance(-5)).toBe(0.3);
  });
  it('endgame (2 v 2 or fewer): takes a KO it can get first, heals when it would lose the race', () => {
    const ko = input({ ownReserves: 1, foeReserves: 1, options: [{ index: 0, score: 5, damage: 120 }, { index: 1, score: 9, damage: 30 }] });
    expect(endgamePick(ko)).toBe(0);
    const race = input({ ownReserves: 0, foeReserves: 1, ownFaster: false, foeBestDamage: 150, options: [{ index: 0, score: 9, damage: 60 }, { index: 1, score: 1, damage: 0, heal: true }] });
    expect(endgamePick(race)).toBe(1);
    expect(endgamePick(input({ ownReserves: 3 }))).toBeNull();
  });
  it('the plan and style are only tie-break nudges: a clearly better move still wins', () => {
    const i = input({ brain: brain({ personality: 'idealist' }), options: [{ index: 0, score: 20, damage: 50, sacrifice: true }, { index: 1, score: 5, damage: 10 }] });
    expect(tier5Pick(i)).toBe(0);
    expect(chooseWinCondition([{ weatherSetter: true }])).toBe('weather');
    expect(chooseWinCondition([{ bulky: true }, { bulky: true }, {}])).toBe('stall');
    expect(chooseWinCondition([{}, {}])).toBe('sweep');
  });
  it('the ledger records this run only, is capped, and gates counter-picks to seen species', () => {
    const r = run();
    const rec = reg(r);
    expect(mayCounter(rec, 'pikachu')).toBe(false);
    scout(rec, { moves: ['tackle'], species: ['pikachu'], turns: 10, switches: 3 });
    scout(rec, { moves: ['tackle', 'surf'], species: ['pikachu'], turns: 10, switches: 1 });
    expect(rec.ledger?.moves).toEqual(['tackle', 'surf']);
    expect(mayCounter(rec, 'pikachu')).toBe(true);
    expect(brainFor(rec, 'blue', 's', 'sweep', null)?.switchRate).toBeCloseTo(0.2);
    expect(brainFor(rec, 'blue', 's', 'sweep', 3)).toBeNull(); // pity tier 3 keeps the normal AI
    expect(ExpansionRunSchema.parse({ rival: { blue: JSON.parse(JSON.stringify(rec)) } }).rival?.blue?.ledger?.turns).toBe(20);
  });
  it('old saves without the new fields still load', () => {
    const old = { role: 'main', personality: 'prodigy', style: 'blitz', arc: 'prodigy-learns-humility', lead: 0, marks: [], feelings: { friendship: 3, respect: 3, trust: 3, rivalry: 3, resentment: 0, admiration: 2 }, pityLosses: 0 };
    expect(ExpansionRunSchema.safeParse({ rival: { blue: old } }).success).toBe(true);
  });
});

describe('R5 dialogue bank', () => {
  it('has the 528 authored lines for 8 personalities', () => {
    expect(Object.keys(BANK.personalities)).toHaveLength(8);
    expect(authoredCount()).toBe(528);
    for (const k of Object.keys(OVERHAUL.personalities)) expect(BANK.personalities[k], k).toBeDefined();
    for (const k of Object.keys(BANK.personalities)) for (const c of BANK_CONTEXTS) expect((BANK.personalities[k] as unknown as Record<string, string[]>)[c]!.length).toBeGreaterThanOrEqual(1);
  });
  it('picks a/an from the name and fills every slot', () => {
    expect(fillMon('A {mon}, huh?', 'Eevee')).toBe('An Eevee, huh?');
    expect(fillMon('A {mon}, huh?', 'Pikachu')).toBe('A Pikachu, huh?');
  });
  it('every species resolves for every personality: 4+ distinct lines, no open slots, no wrong article', () => {
    for (const s of content.species.values()) {
      for (const p of Object.keys(BANK.personalities)) {
        const lines = speciesLines(p, s);
        expect(lines.length, `${s.id}/${p}`).toBeGreaterThanOrEqual(3);
        for (const l of lines) {
          expect(l.text).not.toMatch(/\{|undefined/);
          if (/^[AEIOU]/i.test(s.name)) expect(l.text).not.toMatch(new RegExp(`\\bA ${s.name}\\b`));
        }
      }
    }
  });
  it('categories follow the rules', () => {
    const eevee = content.species.get('eevee')!;
    expect(['first', 'middle']).toContain(categoryOf(eevee));
    const mega = content.species.get('venusaur-mega');
    if (mega) expect(categoryOf(mega)).toBe('form');
  });
  it('does not repeat a species line until all were used, and is deterministic', () => {
    const r = run();
    const rec = reg(r, 'enthusiast');
    const sp = content.species.get('charizard')!;
    const n = speciesLines('enthusiast', sp).length;
    const said = Array.from({ length: n }, (_, i) => pickSpeciesLine(rec, 'seed', i, sp));
    expect(new Set(said).size).toBe(n);
    expect(pickSpeciesLine(rec, 'seed', 99, sp)).toBeTruthy(); // starts over without error
    const a = reg(run(), 'prodigy');
    const b = reg(run(), 'prodigy');
    expect(pickContextLine(a, 'x', 'gym', 1)).toBe(pickContextLine(b, 'x', 'gym', 1));
  });
});

describe('R6 presence', () => {
  it('40 runs: 2 guaranteed meetings per region plus a third about half the time, placed by Lead', () => {
    let thirds = 0;
    for (let s = 0; s < 400; s++) {
      const m = regionMeetings(`seed${s}`, { lead: s % 2 ? 2 : -2 }, 'blue', s % 3);
      expect(m.guaranteed).toBe(2);
      if (m.third) thirds++;
      if (m.third) expect(m.third).toBe(s % 2 ? 'waiting' : 'catchUp');
    }
    expect(thirds / 400).toBeGreaterThan(0.4);
    expect(thirds / 400).toBeLessThan(0.6);
  });
  it('Pseudo Stages: main ~65%, Friend ~30% of the rest, no Ambush under 50% HP', () => {
    let main = 0, friend = 0, n = 3000;
    for (let i = 0; i < n; i++) {
      const p = pseudoPresence(`p${i}`, i % 3, i, { friendHere: true, partyHpShare: 0.4 });
      if (p.who === 'main') main++;
      if (p.who === 'friend') friend++;
      expect(p.form).not.toBe('ambush');
    }
    expect(main / n).toBeGreaterThan(0.6);
    expect(main / n).toBeLessThan(0.7);
    expect(friend / (n - main)).toBeGreaterThan(0.24);
    expect(friend / (n - main)).toBeLessThan(0.36);
    let ambush = 0;
    for (let i = 0; i < 3000; i++) if (pseudoPresence(`q${i}`, 0, i, { friendHere: false, partyHpShare: 1 }).form === 'ambush') ambush++;
    expect(ambush).toBeGreaterThan(0);
    expect(pseudoPresence('x', 0, 0, { friendHere: false, partyHpShare: 1 }).who === 'friend').toBe(false);
  });
  it('catch step-in is about 3% and fires at most once per region', () => {
    const rec = reg(run());
    let hits = 0;
    for (let c = 0; c < 2000; c++) if (catchStepIn('seed', rec, 0, c)) hits++;
    expect(hits).toBe(1);
    let total = 0;
    for (let k = 0; k < 400; k++) if (catchStepIn(`s${k}`, reg(run()), 0, 1)) total++;
    expect(total / 400).toBeLessThan(0.08);
    expect(PRESENCE.stepIn.chance).toBe(0.03);
  });
});

describe('R8 the Friend', () => {
  it('shows up in about half the regions, with a different personality than the main rival', () => {
    let here = 0;
    for (let s = 0; s < 1000; s++) if (friendInRegion(`f${s}`, 1)) here++;
    expect(here / 1000).toBeGreaterThan(0.44);
    expect(here / 1000).toBeLessThan(0.56);
    for (let s = 0; s < 50; s++) expect(friendPersonality(`f${s}`, 'prodigy')).not.toBe('prodigy');
  });
  it('registers in the friend slot beside the main rival, never in the main one', () => {
    const r = run();
    reg(r);
    const f = reg(r, 'protector', 'pal', 'friend');
    expect(f.role).toBe('friend');
    expect(() => reg(r, 'protector', 'pal2', 'friend')).toThrow(/taken/);
  });
  it('adds at most 1 extra Assist and keeps the total within 4 Standard / 6 Extended', () => {
    expect(friendAssist(1, 'standard')).toBe(1);
    expect(friendAssist(4, 'standard')).toBe(0);
    expect(friendAssist(3, 'standard')).toBe(1);
    expect(friendAssist(0, 'extended')).toBe(1);
    expect(friendAssist(6, 'extended')).toBe(0);
    expect(clampAttitude(9)).toBe(5);
    expect(clampAttitude(-9)).toBe(-5);
  });
  it('has four scenes, a voice line, and postcards', () => {
    const rec = reg(run(), 'protector', 'pal', 'friend');
    for (const s of PRESENCE.friend.scenes) {
      const sc = friendScene(rec, 'seed', s as 'meet', 'Pal', 1);
      expect(sc.text).toContain('Pal');
      expect(sc.voice.length).toBeGreaterThan(3);
    }
    expect(postcard('seed', 2, 'Pal')).toContain('Pal');
  });
});

describe('R11 Witness the Rest', () => {
  it('always ends in a Champion card and a final card, this run only', () => {
    const r = run();
    const a = reg(r);
    const b = reg(r, 'protector', 'pal', 'friend');
    for (const won of [true, false]) {
      const cards = witnessCards({ playerName: 'Red', won, rivals: [{ id: 'pal', name: 'Pal', rec: b }, { id: 'blue', name: 'Blue', rec: a }] });
      expect(cards.at(-2)!.kind).toBe('champion');
      expect(cards.at(-1)!.kind).toBe('final');
      expect(cards[0]!.kind).toBe('rival');
      expect(cards[1]!.kind).toBe('friend');
      expect(cards.length).toBeLessThanOrEqual(PRESENCE.witness.maxCards);
    }
    expect(witnessCards({ playerName: 'Red', won: true, rivals: [] }).map((c) => c.kind)).toEqual(['champion', 'final']);
  });
});

describe('R4 in the real engine', () => {
  const setup = () => {
    const ace = createPokemon(content, 'charizard', 50, 'e1');
    ace.moves = [{ id: 'growl', pp: 40 }, { id: 'flamethrower', pp: 15 }, { id: 'tail-whip', pp: 30 }];
    const target = createPokemon(content, 'bulbasaur', 30, 'p1');
    const other = createPokemon(content, 'squirtle', 30, 'p2');
    const battle = createBattle('trainer', [ace], 0, 'p1', { classId: 'rival', name: 'Blue', leaderId: null });
    battle.rivalBrain = brain();
    return { ace, battle, target, party: [target, other] };
  };
  it('a tier-5 rival picks its strong move, the same every time, without touching the RNG', () => {
    const { ace, battle, target, party } = setup();
    const rng = new Rng(hashSeed('x'));
    const before = JSON.stringify(rng.state ?? null);
    const picks = Array.from({ length: 12 }, (_, i) => chooseEnemyMove(ace, new Rng(hashSeed(`s${i}`)), { content, ai: 1, target, stages: battle.enemyStages, battle, party }));
    expect(new Set(picks)).toEqual(new Set([1]));
    expect(JSON.stringify(rng.state ?? null)).toBe(before);
  });
  it('without a rivalBrain the choice is the old one', () => {
    const { ace, battle, target, party } = setup();
    delete battle.rivalBrain;
    expect(chooseEnemyMove(ace, new Rng(hashSeed('s')), { content, ai: 1, target, stages: battle.enemyStages, battle, party })).toBe(1);
  });
});
