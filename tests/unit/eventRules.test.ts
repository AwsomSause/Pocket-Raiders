import { describe, expect, it } from 'vitest';
import { eventRuleEnd, itemProblem, switchProblem } from '../../src/core/battle/engine';
import { moveBlockReason } from '../../src/core/battle/moveBlock';
import { EventBattleSchema, EventRuleSchema } from '../../src/core/contentSchema';
import { chooseEvent, eventBattleWon } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';
import b4 from '../../src/data/events/trainer-b4.json';
import b3 from '../../src/data/events/trainer-b3.json';

const battle = (rule: object, turn = 1) => ({ eventRule: rule, outcome: null, turn, needsSwitch: false, activeIndex: 0, kind: 'trainer' }) as never;
const party = [{ hp: 10 }, { hp: 10 }] as never;

describe('event fight rules (run events B batch 3)', () => {
  it('accepts every rule field and rejects unknown stages', () => {
    expect(EventRuleSchema.safeParse({ noSwitch: true, stages: { atk: 2 } }).success).toBe(true);
    expect(EventRuleSchema.safeParse({ stages: { acc: 1 } }).success).toBe(false);
    expect(EventRuleSchema.safeParse({ turnLimit: 0 }).success).toBe(false);
  });
  it('the batch 3 events parse and use only valid battle data', () => {
    const fights = (b3 as { events: { choices: { success: { battle?: unknown } }[] }[] }).events.flatMap((e) => e.choices.flatMap((c) => (c.success.battle ? [c.success.battle] : [])));
    expect(fights.length).toBe(9);
    for (const f of fights) expect(EventBattleSchema.safeParse(f).success).toBe(true);
  });
  it('noSwitch blocks a voluntary switch but not a forced one', () => {
    const b = battle({ noSwitch: true });
    expect(switchProblem({ battle: b, party }, 1)).toMatch(/no switching/);
    (b as { needsSwitch: boolean }).needsSwitch = true;
    expect(switchProblem({ battle: b, party }, 1)).toBeNull();
    expect(switchProblem({ battle: battle({}), party }, 1)).toBeNull();
  });
  it('surviveTurns wins once the turns have passed, not before', () => {
    const early = battle({ surviveTurns: 8 }, 8);
    eventRuleEnd(early, []);
    expect((early as { outcome: unknown }).outcome).toBeNull();
    const done = battle({ surviveTurns: 8 }, 9);
    eventRuleEnd(done, []);
    expect((done as { outcome: unknown }).outcome).toBe('win');
  });
  it('suddenDeath: the first faint decides, a foe faint wins', () => {
    const foe = battle({ suddenDeath: true });
    eventRuleEnd(foe, [{ type: 'faint', side: 'enemy', uid: 'x', participants: [] }]);
    expect((foe as { outcome: unknown }).outcome).toBe('win');
    const you = battle({ suddenDeath: true });
    eventRuleEnd(you, [{ type: 'faint', side: 'player', uid: 'y', participants: [] }]);
    expect((you as { outcome: unknown }).outcome).toBe('lose');
    const none = battle({ suddenDeath: true });
    eventRuleEnd(none, []);
    expect((none as { outcome: unknown }).outcome).toBeNull();
  });
  it('noAttacks blocks attacks only while a status move has PP', () => {
    const content = { moves: new Map([['tackle', { id: 'tackle', category: 'physical', flags: [] }], ['growl', { id: 'growl', category: 'status', flags: [] }]]) } as never;
    const b = { ...(battle({ noAttacks: true }) as object), playerVolatile: { taunt: 0, throat: 0, disabled: null, torment: false } } as never;
    const mon = (pp: number) => ({ moves: [{ id: 'tackle', pp: 5 }, { id: 'growl', pp }] }) as never;
    expect(moveBlockReason(content, b, mon(5), 0)).toMatch(/Pacifist/);
    expect(moveBlockReason(content, b, mon(5), 1)).toBeNull();
    expect(moveBlockReason(content, b, mon(0), 0)).toBeNull();
  });
  const start = (eventId: string) => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'r', seed: 'rb3', archetypeId: 'red' }), 0));
    const node = run.stage!.map.nodes[0]!;
    run.stage!.current = node.id;
    run.stage!.visited = [node.id];
    node.sides.push({ id: 'duel', kind: 'event', used: false, eventId });
    return chooseEvent(content, run, 'duel', 0).run;
  };
  it('starting each fight puts its rule on the battle, and it survives a save round trip', () => {
    for (const id of ['backwards-battle', 'handicap-match', 'sudden-death-duel', 'sleepwalker-brawl', 'pizza-delivery-duel', 'bodybuilder-beach', 'pacifist-challenge', 'speedrun-trial', 'honor-duel']) {
      const run = start(id);
      expect(run.battle?.eventRule, id).toBeDefined();
      expect(RunStateSchema.parse(JSON.parse(JSON.stringify(run))).battle?.eventRule).toEqual(run.battle?.eventRule);
    }
    expect(start('sleepwalker-brawl').battle!.enemyTeam.every((m) => m.status?.id === 'slp')).toBe(true);
    expect(start('bodybuilder-beach').battle).toMatchObject({ playerStages: { atk: 2 }, enemyStages: { atk: 2 } });
  });
  it('a slow win pays the slowWin effects', () => {
    const run = start('pizza-delivery-duel');
    const money = run.money;
    eventBattleWon(content, run, run.battle!.event!, 6);
    expect(run.money - money).toBe(350);
    const fast = start('pizza-delivery-duel');
    const m2 = fast.money;
    eventBattleWon(content, fast, fast.battle!.event!, 5);
    expect(fast.money - m2).toBe(700);
  });
  it('batch 4: every event is in the content, its fights parse, and the exam bans bag items', () => {
    const events = (b4 as { events: { id: string; choices: { success: { battle?: unknown }; failure?: { battle?: unknown } }[] }[] }).events;
    expect(events).toHaveLength(14);
    for (const e of events) {
      expect(content.events.get(e.id), e.id).toBeDefined();
      for (const c of e.choices) for (const b of [c.success.battle, c.failure?.battle]) if (b) expect(EventBattleSchema.safeParse(b).success, e.id).toBe(true);
    }
    const run = start('mentors-examination');
    expect(run.battle?.eventRule?.noItems).toBe(true);
    expect(itemProblem({ content, battle: run.battle!, party: run.party, inventory: { potion: 1 } as never }, 'potion')).toMatch(/forbids/);
  });
  it('weatherCycle rotates the weather each turn and starts on the first entry', () => {
    const b = battle({ weatherCycle: ['rain', 'sun', 'hail'] }, 2) as { weather: { id: string } | null; turn: number; outcome: null };
    eventRuleEnd(b as never, []);
    expect(b.weather?.id).toBe('sun');
    b.turn = 3;
    eventRuleEnd(b as never, []);
    expect(b.weather?.id).toBe('hail');
    expect(start('weather-rival').battle?.weather?.id).toBe('rain');
    expect(start('underground-duel').battle?.weather?.id).toBe('sand');
  });
  it('batch 6: cursed hat swaps statuses, contrary and pinch hitter ride on the battle', () => {
    const mine = { hp: 10, status: { id: 'brn', turns: 0 } };
    const foe = { hp: 10, status: null };
    const b = { ...(battle({ cursedHat: true }) as object), enemyTeam: [foe], enemyIndex: 0 } as never;
    const ev: never[] = [];
    eventRuleEnd(b, ev, [mine] as never);
    expect(mine.status).toBeNull();
    expect((foe.status as { id: string } | null)?.id).toBe('brn');
    expect(ev.length).toBe(1);
    for (const [id, key] of [['the-contrarian', 'contrary'], ['pinch-hitter', 'pinchHitter'], ['cursed-hat-trainer', 'cursedHat']] as const) {
      expect(start(id).battle?.eventRule?.[key], id).toBe(true);
    }
  });
  it('batch 7: fan club boosts the side that scored the KO, beginner\'s luck heals you', () => {
    const b = { ...(battle({ fanClub: true }) as object), playerStages: { atk: 0 }, enemyStages: { atk: 0 } } as never as { playerStages: { atk: number }; enemyStages: { atk: number } };
    eventRuleEnd(b as never, [{ type: 'faint', side: 'enemy', uid: 'x', participants: [] }]);
    expect(b.playerStages.atk).toBe(1);
    expect(b.enemyStages.atk).toBe(0);
    eventRuleEnd(b as never, [{ type: 'faint', side: 'player', uid: 'y', participants: [] }]);
    expect(b.enemyStages.atk).toBe(1);
    for (const [id, key] of [['fan-club-tournament', 'fanClub'], ['beginners-luck', 'beginnersLuck']] as const) expect(start(id).battle?.eventRule?.[key], id).toBe(true);
    const run = start('beginners-luck');
    const lead = run.party[run.battle!.activeIndex]!;
    lead.hp = 1;
    eventRuleEnd(run.battle!, [], run.party, content);
    expect(lead.hp).toBeGreaterThan(1);
  });
});
