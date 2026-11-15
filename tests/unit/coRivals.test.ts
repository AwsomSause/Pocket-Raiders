// Catalog Overhaul row 12 (rivals): the fight rules and helpers R16 to R24 added (core/rivals/questlines.ts, battle/engine.ts).
import { describe, expect, it } from 'vitest';
import { eventRuleEnd } from '../../src/core/battle/engine';
import { EventRuleSchema } from '../../src/core/contentSchema';
import { conditionMet, isStoryEventBattle } from '../../src/core/events';
import { questBattleMeter, raceRivalColumn, starterRivalryStages } from '../../src/core/rivals/questlines';
import { chooseStarter, createRun } from '../../src/core/run';
import { circuitStrip, questMeterBar, rivalStandingPanel } from '../../src/ui/redux/screens/rivalPanels';
import { content } from './helpers';

const stages = () => ({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
const battle = (rule: object, turn = 1, enemyTeam: object[] = [{ hp: 10, speciesId: 'pikachu', level: 5 }]) =>
  ({ eventRule: rule, outcome: null, turn, storyEffects: [] as string[], enemyTeam, playerStages: stages(), enemyStages: stages() }) as never as Parameters<typeof eventRuleEnd>[0];
const hit = [{ type: 'damage', side: 'enemy', amount: 3, hpAfter: 7, effectiveness: 1, crit: false }] as never[];
const run = () => chooseStarter(content, createRun(content, { runId: 'co-rivals', seed: 'co-rivals', archetypeId: 'red' }), 0);

describe('R16 Wants to Stop (the calm rule)', () => {
  it('accepts 2 to 10 and rejects 1', () => {
    expect(EventRuleSchema.safeParse({ calm: 3 }).success).toBe(true);
    expect(EventRuleSchema.safeParse({ calm: 1 }).success).toBe(false);
  });
  it('fills only on turns the foe takes no damage, and wins at full', () => {
    const b = battle({ calm: 3 });
    eventRuleEnd(b, []);
    eventRuleEnd(b, hit as never);
    expect(b.outcome).toBeNull();
    expect(questBattleMeter(b)).toEqual({ label: 'Wants to Stop', value: 1, max: 3 });
    eventRuleEnd(b, []);
    eventRuleEnd(b, []);
    expect(b.outcome).toBe('win');
    expect(b.storyEffects).toContain('calm:done');
  });
});

describe('R18 the midnight clock', () => {
  it('counts down, then whoever has more standing wins', () => {
    const r = run();
    const early = battle({ clock: 3 }, 2);
    const events: never[] = [];
    eventRuleEnd(early, events, r.party, content);
    expect(early.outcome).toBeNull();
    expect(JSON.stringify(events)).toMatch(/minute to midnight/);
    const ahead = battle({ clock: 3 }, 3, [{ ...r.party[0]!, hp: 0 }]);
    eventRuleEnd(ahead, [], r.party, content);
    expect(ahead.outcome).toBe('win');
    const behind = battle({ clock: 3 }, 3, [r.party[0]!, r.party[0]!]);
    eventRuleEnd(behind, [], [{ ...r.party[0]!, hp: 1 }], content);
    expect(behind.outcome).toBe('lose');
  });
  it('the date condition matches only the host date', () => {
    const r = run();
    const cond = { kind: 'rivalQuest', date: '12-31' } as never;
    r.calendar.today = '12-30';
    expect(conditionMet(content, r, cond)).toBe(false);
    r.calendar.today = '12-31';
    expect(conditionMet(content, r, cond)).toBe(true);
  });
});

describe('rival questline helpers', () => {
  it('Starter Rivalry: nothing under 3, Speed at 3, Attack and Sp. Atk too at 6', () => {
    const r = run();
    const b = battle({});
    starterRivalryStages(r, b as never);
    expect(b.playerStages.spe).toBe(0);
    r.story.flags['ev:rq-starter-rivalry'] = 3;
    starterRivalryStages(r, b as never);
    expect([b.playerStages.spe, b.enemyStages.spe, b.playerStages.atk]).toEqual([1, 1, 0]);
    r.story.flags['ev:rq-starter-rivalry'] = 6;
    starterRivalryStages(r, b as never);
    expect([b.playerStages.spe, b.playerStages.atk, b.enemyStages.spa]).toEqual([2, 1, 1]);
  });
  it('the race marker is only in the race, and falls back as you clear rooms fast', () => {
    const r = run();
    expect(raceRivalColumn(r)).toBeNull();
    r.stage = { ...r.stage!, pseudo: { id: 'ps_rival_race', name: 'Race', chain: true }, visited: ['a', 'b'], map: { ...r.stage!.map, columns: 4 } } as never;
    expect(raceRivalColumn(r)).toBe(4);
    r.story.flags['ev:rq-r23-beat'] = 2;
    expect(raceRivalColumn(r)).toBe(2);
  });
  it('Kieran and the Stranger are story losses; a plain trainer is not', () => {
    for (const id of ['rq-kieran-finale', 'rq-r13-meet']) {
      const e = content.events.get(id)!;
      const i = e.choices.findIndex((c) => c.success.battle);
      expect(isStoryEventBattle(content, { eventId: id, choiceIndex: i, success: true } as never), id).toBe(true);
    }
    const race = content.events.get('rq-r23-trainer')!;
    expect(isStoryEventBattle(content, { eventId: 'rq-r23-trainer', choiceIndex: race.choices.findIndex((c) => c.success.battle), success: true } as never)).toBe(false);
  });
  it('the scenes R16 to R24 are live, and the stall choice needs all three helping choices', () => {
    for (const id of ['rq-kieran-1', 'rq-r18-year', 'rq-r19-champion', 'rival-mon-greeting', 'rq-r21-inn', 'rival-shared-drink', 'rival-race', 'rival-nickname', 'living-rival-acknowledges']) expect(content.events.get(id)?.disabled, id).toBe(false);
    expect(content.events.get('living-rival-clash-retired')!.disabled).toBe(true);
    const stall = content.events.get('rq-kieran-finale')!.choices[1]!;
    expect(stall.requires).toEqual([{ kind: 'flag', key: 'kieran-helped', atLeast: 3, atMost: 99 }]);
  });
});

describe('New UI rival panels', () => {
  it('draw the standing, the Circuit and a meter, escaping text', () => {
    expect(rivalStandingPanel({ rank: '<b>Blue</b> is 2 ahead', meters: [{ label: 'Trust', value: 4, max: 10 }] })).toContain('&lt;b&gt;Blue');
    expect(circuitStrip({ you: 3, rival: 5 })).toContain('You 3 · Rival 5');
    expect(questMeterBar({ label: 'Wants to Stop', value: 2, max: 3 })).toContain('width:67%');
  });
});
