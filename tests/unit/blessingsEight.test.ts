// Eight more Legendary Blessings: Lugia, Latias, Heatran, Thundurus, Landorus, Reshiram, Zekrom, Kyurem (expanded_notes/LEGENDARY_BLESSINGS.md).

import { describe, expect, it } from 'vitest';
import { blessingAfterBattle, blessingPerks, blessingRite, BLESSING_TIER_ODDS, BlessingStateSchema, breakVow, callCalm, calmProblem, effectBlessing, getBlessing, noteFirstBlood, swearVow, useBlessingRite } from '../../src/core/blessings';
import { eventView } from '../../src/core/events';
import { LEGEND_KEYS } from '../../src/core/legends/keys';
import { addSign } from '../../src/core/legends/signs';
import { beginBattle, chooseStarter, createRun, mapPreviews, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

const EIGHT = ['lugia', 'latias', 'heatran', 'thundurus', 'landorus', 'reshiram', 'zekrom', 'kyurem'];
const start = (seed = 'bless-eight'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { blessings: true } }), 0);
const withBlessing = (id: string, run = start()): RunState => {
  const def = getBlessing(id)!;
  run.expansion = { ...run.expansion, blessing: { id, tier: def.tier, influence: BLESSING_TIER_ODDS[def.tier].influence, seen: true, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] } };
  return run;
};
const commune = (run: RunState): RunState => { run.expansion!.blessing!.communion = true; return run; };
const battling = (id: string): RunState => toBattle(withBlessing(id));

describe('the eight new blessings', () => {
  it('are in the roster, rolled at run start, with their own Legendary and a status', () => {
    for (const id of EIGHT) {
      const def = getBlessing(id)!;
      expect(def, id).toBeDefined();
      expect(def.pool, id).toBe(true);
      expect(def.status, id).not.toBe('disabled');
      expect(content.species.has(def.speciesId), id).toBe(true);
    }
  });
  it('old blessing state (no new fields) still parses', () => {
    expect(BlessingStateSchema.parse({ id: 'lugia', tier: 'greater', influence: 2 }).calmStages).toBeUndefined();
  });
});

describe('Lugia, The Guardian of the Sea', () => {
  it('the Calm clears weather, terrain and both sides\' stat stages, once per stage', () => {
    const run = battling('lugia');
    const b = run.battle!;
    b.weather = { id: 'rain', turns: 3 };
    b.playerStages.atk = 2; b.enemyStages.def = 1; b.enemyStages.spe = -1;
    expect(calmProblem(run)).toBeNull();
    expect(callCalm(run)).toMatch(/Calm/);
    expect(b.weather).toBeNull();
    expect(b.playerStages.atk).toBe(0);
    expect(b.enemyStages.def).toBe(0);
    expect(calmProblem(run)).toBe('Once per stage.');
    expect(callCalm(run)).toBeNull();
  });
  it('in Communion the Calm keeps your own boosts (and still clears your drops)', () => {
    const run = commune(battling('lugia'));
    run.battle!.playerStages.atk = 2; run.battle!.playerStages.spe = -1; run.battle!.enemyStages.atk = 2;
    callCalm(run);
    expect(run.battle!.playerStages.atk).toBe(2);
    expect(run.battle!.playerStages.spe).toBe(0);
    expect(run.battle!.enemyStages.atk).toBe(0);
  });
  it('another blessing has no Calm', () => {
    expect(calmProblem(battling('heatran'))).not.toBeNull();
  });
});

describe('Latias, The Glass Wing', () => {
  it('shows the lead of every wild and trainer battle on the map; Communion shows the whole team', () => {
    const plain = mapPreviews(content, start('sight'));
    const run = withBlessing('latias', start('sight'));
    const seen = mapPreviews(content, run);
    const ids = Object.keys(seen).filter((k) => seen[k]!.source === 'Latias\'s sight');
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) { expect(plain[id]).toBeUndefined(); expect(seen[id]!.team.length).toBe(1); }
    const whole = mapPreviews(content, commune(withBlessing('latias', start('sight'))));
    expect(ids.some((id) => whole[id]!.team.length >= 1)).toBe(true);
  });
});

describe('Heatran, The Magma Heart', () => {
  it('the first Fire move against you is absorbed and its target gains +1 Sp. Atk; the second hits', () => {
    let run = battling('heatran');
    const foe = run.battle!.enemyTeam[run.battle!.enemyIndex]!;
    foe.moves = [{ id: 'ember', pp: 25 }] as typeof foe.moves;
    run = beginBattle(content, run).run;
    const me = run.party[run.battle!.activeIndex]!;
    const hp = me.hp;
    run = takeTurn(content, run, { kind: 'move', index: 0 }).run;
    expect(run.battle!.storyEffects).toContain('magma-heart');
    expect(run.battle!.playerStages.spa).toBe(1);
    expect(run.party.find((m) => m.uid === me.uid)!.hp).toBe(hp);
  });
});

describe('Thundurus, The Bolt', () => {
  it('status moves +1 priority on turn one (two turns in Communion)', () => {
    expect(blessingPerks(withBlessing('thundurus'))).toEqual([{ kind: 'statusPriorityTurns', turns: 1 }]);
    expect(blessingPerks(commune(withBlessing('thundurus')))).toEqual([{ kind: 'statusPriorityTurns', turns: 2 }]);
  });
  it('the Rite arms a bolt for the next trainer battle, spent once that battle ends', () => {
    const run = commune(withBlessing('thundurus'));
    expect(blessingRite(run)!.ready).toBe(true);
    useBlessingRite(content, run);
    expect(blessingRite(run)!.ready).toBe(false);
    expect(blessingPerks(run)).toContainEqual({ kind: 'foeLeadParalysed' });
    run.battle = { kind: 'trainer' } as RunState['battle'];
    blessingAfterBattle(content, run);
    expect(run.expansion!.blessing!.riteArmed).toBe(false);
  });
});

describe('Landorus, The Abundant Land', () => {
  it('lowers the opposing lead in boss and rival battles (Attack; Attack and Sp. Atk in Communion)', () => {
    expect(blessingPerks(withBlessing('landorus'))).toEqual([{ kind: 'foeLeadStages', stats: ['atk'], value: -1 }]);
    expect(blessingPerks(commune(withBlessing('landorus')))).toEqual([{ kind: 'foeLeadStages', stats: ['atk', 'spa'], value: -1 }]);
  });
  it('does nothing in an ordinary battle', () => {
    let run = battling('landorus');
    run = beginBattle(content, run).run;
    if (!run.battle!.rival && run.battle!.trainer?.classId !== 'gym-leader') expect(run.battle!.enemyStages.atk).toBe(0);
  });
});

describe('Reshiram, The Truth', () => {
  it('event choices show what they cause; Communion adds the foe move preview', () => {
    const ev = [...content.events.values()].find((e) => !e.disabled && e.requires.length === 0 && e.choices.length > 1 && e.choices.every((c) => c.requires.length === 0 && c.success.effects.length > 0))!;
    const at = (run: RunState): RunState => {
      const node = run.stage!.map.nodes[0]!;
      run.stage!.current = node.id;
      run.stage!.visited = [node.id];
      node.sides.push({ id: 'x', kind: 'event', used: false, eventId: ev.id } as never);
      return run;
    };
    expect(eventView(content, at(start()), 'x').choices.every((c) => !c.preview)).toBe(true);
    expect(eventView(content, at(withBlessing('reshiram')), 'x').choices.every((c) => !!c.preview)).toBe(true);
    expect(blessingPerks(withBlessing('reshiram'))).toEqual([]);
    expect(blessingPerks(commune(withBlessing('reshiram')))).toEqual([{ kind: 'foeMovePreview' }]);
  });
});

describe('Zekrom, The Ideal', () => {
  it('a sworn, kept vow gives +10% to every stat (15% in Communion); none before swearing', () => {
    const run = withBlessing('zekrom');
    expect(blessingPerks(run)).toEqual([]);
    expect(swearVow(run, 'no-one-behind')).toBe(true);
    expect(swearVow(run, 'strike-no-one-first')).toBe(false);
    expect(blessingPerks(run)).toHaveLength(5);
    expect(blessingPerks(run)[0]).toEqual({ kind: 'statMultiplier', stat: 'atk', value: 1.1 });
    commune(run);
    expect(blessingPerks(run)[0]).toEqual({ kind: 'statMultiplier', stat: 'atk', value: 1.15 });
  });
  it('breaking the vow ends the bonus; in Communion the Rite holds it once', () => {
    const run = withBlessing('zekrom');
    swearVow(run, 'no-one-behind');
    expect(breakVow(run, 'strike-no-one-first')).toBeNull();
    expect(breakVow(run, 'no-one-behind')).toMatch(/broken/);
    expect(blessingPerks(run)).toEqual([]);
    const held = commune(withBlessing('zekrom'));
    swearVow(held, 'no-one-behind');
    expect(breakVow(held, 'no-one-behind')).toMatch(/holds/);
    expect(blessingPerks(held)).toHaveLength(5);
    expect(breakVow(held, 'no-one-behind')).toMatch(/broken/);
  });
  it('Strike no one first breaks when your side deals the first damage of a trainer battle', () => {
    const run = withBlessing('zekrom');
    swearVow(run, 'strike-no-one-first');
    run.battle = { kind: 'trainer', storyEffects: [] } as unknown as RunState['battle'];
    expect(noteFirstBlood(run, [{ type: 'damage', side: 'player' }, { type: 'damage', side: 'enemy' }])).toBeNull();
    expect(run.expansion!.blessing!.vowBroken).toBeUndefined();
    const other = withBlessing('zekrom');
    swearVow(other, 'strike-no-one-first');
    other.battle = { kind: 'trainer', storyEffects: [] } as unknown as RunState['battle'];
    expect(noteFirstBlood(other, [{ type: 'damage', side: 'enemy' }])).toMatch(/broken/);
  });
});

describe('Kyurem, The Empty Vessel', () => {
  it('is empty until the first Sign of another Legendary, then a weaker copy of that blessing', () => {
    const run = withBlessing('kyurem');
    expect(effectBlessing(run)).toBeUndefined();
    expect(blessingPerks(run)).toEqual([]);
    const lines = addSign(run, 'regidrago', 1);
    expect(lines.join(' ')).toMatch(/Empty Vessel fills/);
    expect(run.expansion!.blessing!.copy).toBe('regidrago');
    expect(blessingPerks(run)).toEqual([{ kind: 'damageMultiplier', type: 'dragon', value: 1.075 }]);
    // A second Sign of someone else changes nothing.
    addSign(run, 'zacian', 1);
    expect(run.expansion!.blessing!.copy).toBe('regidrago');
  });
  it('never copies Zekrom\'s vow; a group Sign takes its first member with a blessing', () => {
    const run = withBlessing('kyurem');
    addSign(run, 'zekrom', 1);
    expect(run.expansion!.blessing!.copy).toBeUndefined();
    addSign(run, 'forces', 1);
    expect(run.expansion!.blessing!.copy).toBe('tornadus');
  });
  it('its own Signs raise Influence; Communion with Kyurem gives the copy\'s Rite, not its Communion form', () => {
    const run = withBlessing('kyurem');
    const before = run.expansion!.blessing!.influence;
    addSign(run, 'kyurem', 2);
    expect(run.expansion!.blessing!.influence).toBe(before + 2);
    addSign(run, 'thundurus', 1);
    commune(run);
    expect(blessingPerks(run)).toEqual([{ kind: 'statusPriorityTurns', turns: 1 }]);
    expect(blessingRite(run)!.label).toBe('A Bolt on Request');
  });
});

describe('Legendary keys for the new blessings', () => {
  it('the Trials of Thundurus and Kyurem earn keys at Influence 5', () => {
    const earns = (item: string, legend: string) => LEGEND_KEYS.find((k) => k.item === item)!.earn.some((g) => g.some((c) => c.kind === 'flag' && c.key === `blessing-${legend}`));
    expect(earns('works-key', 'thundurus')).toBe(true);
    expect(earns('light-stone', 'kyurem')).toBe(true);
    expect(earns('dark-stone', 'kyurem')).toBe(true);
    for (const [item, legend] of [['silver-wing', 'lugia'], ['magma-stone', 'heatran'], ['light-stone', 'reshiram'], ['dark-stone', 'zekrom'], ['eon-ticket', 'eon']] as const) expect(earns(item, legend), item).toBe(true);
  });
});

