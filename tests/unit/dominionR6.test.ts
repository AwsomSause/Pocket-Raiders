// DOMINION redesign R6 (pass 50): the Pokémon pages (Reserve, the Card, Party, Summary, Bag) and the street meeting
// as an event (Talk, Choose, Result, Reward, Text log). Pages show data and never change the run; the meeting's odds
// on Choose are the ones the answer rolls against; the answer reports its roll and what it changed.
import { describe, expect, it } from 'vitest';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { reserveModel, RESERVE_PAGE } from '../../src/core/dominion/reserveScreens';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import type { DominionBlock } from '../../src/core/dominion/schema';
import { answerMeet, meetModel } from '../../src/core/dominion/town';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { r5EvChoose, r5EvLog, r5EvResult, r5EvReward, r5EvTalk } from '../../src/ui/redux/screens/dominion/r50/events';
import { r5Bag, r5Give, r5Party, r5Reserve, r5Summary } from '../../src/ui/redux/screens/dominion/r50/pokemon';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { content } from './helpers';

const block = (): DominionBlock => {
  const run = chooseStarter(content, createRun(content, { runId: 'r6', seed: 'r6', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  const out = startInRun(content, run, { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return out.run.expansion!.dominion!;
};
const withMeet = (row: string): DominionBlock => {
  const b = block();
  b.empire = { week: {}, weeks: [], peak: 0, press: false, visits: [], holders: [], collect: {}, guarded: [], ...(b.empire ?? {}), meet: { row, district: 'viridian', day: b.day }, met: [row], metDay: b.day } as DominionBlock['empire'];
  return b;
};
const run = (b: DominionBlock) => r5RunOf(b, []);

describe('R6: the street meeting as an event', () => {
  it('Choose shows the odds the answer rolls against (a Charm check), and no roll for a sure answer', () => {
    const b = withMeet('O015');
    const m = meetModel(b)!;
    expect(m.choices).toHaveLength(3);
    const best = Math.max(0, ...b.members.map((x) => x.stats.charm));
    const T = DOMINION_DATA.town.meet;
    expect(m.odds[2]).toEqual({ chance: Math.min(95, Math.max(5, T.checkBase + best * T.checkPer)), stat: 'charm', best, fight: false, money: 60 });
    expect(m.odds[0]!.chance).toBeNull();
    expect(m.odds[0]!.stat).toBeNull();
  });

  it('the answer reports its roll and what it changed, the same for the same seed', () => {
    const b = withMeet('O015');
    const a = answerMeet(b, 2, 'seed-a');
    const again = answerMeet(b, 2, 'seed-a');
    expect(a.ok).toBe(true);
    expect(a.roll).not.toBeNull();
    expect(a.roll!.chance).toBe(meetModel(b)!.odds[2]!.chance);
    expect(a.roll!.r).toBeGreaterThanOrEqual(1);
    expect(a.roll!.r).toBeLessThanOrEqual(100);
    expect(again.roll).toEqual(a.roll);
    expect(again.bits).toEqual(a.bits);
    // A pass pays ₽60; a miss changes nothing.
    if (a.roll!.r <= a.roll!.chance) expect(a.bits).toEqual(['+₽60']);
    else expect(a.bits).toEqual([]);
    // The meeting is answered.
    expect(a.block.empire!.meet).toBeNull();
    expect(b.empire!.meet).not.toBeNull();
  });

  it('a sure answer has no roll, and its reward is in the bits (never in the result text)', () => {
    const b = withMeet('O001');
    const out = answerMeet(b, 1, 'seed-b');
    expect(out.roll).toBeNull();
    expect(out.bits).toContain('+₽80');
  });

  it('a meeting that is gone has no model; a wrong answer index changes nothing', () => {
    expect(meetModel(block())).toBeNull();
    const b = withMeet('O001');
    const out = answerMeet(b, 9, 'seed-c');
    expect(out.ok).toBe(false);
    expect(out.block).toBe(b);
  });

  it('the event pages draw the four beats, the reward only on its own page, and the log', () => {
    const b = withMeet('O015');
    const r = run(b);
    const left = { k: 't-rich', name: 'Gentleman', sub: 'Viridian', colour: '#c9a24a' };
    const talk = r5EvTalk({ left, right: null, line: 'A rich tourist asks for directions' }, r);
    expect(talk).toContain('data-testid="r5-event"');
    expect(talk).toContain('data-testid="dom-town"');
    expect(talk).toContain('<li class="on"><i>1</i>Talk</li>');
    const choose = r5EvChoose({ left, crew: null, line: 'Your call, Boss.', at: 1, choices: [{ label: 'A', note: 'x', icon: 'g-letter', chance: '100%', how: 'No roll' }, { label: 'B', note: 'y', icon: 'g-scope-lens', chance: '46%', how: 'Charm 2' }] }, r);
    expect(choose).toContain('data-testid="dom-town-1" style');
    expect(choose).toMatch(/class="evc-c on"[^>]*data-arg="1"/);
    const res = r5EvResult({ left, right: null, art: '', roll: { stat: 'Charm 2', word: 'SUCCESS', line: 'rolled 15 · needed 46 or less', ok: true }, who: left, line: 'Charm for a tip: It works.' }, r);
    expect(res).toContain('Reward shows after this text');
    expect(res).not.toContain('r6-reward');
    const rw = r5EvReward({ big: '+₽60', cards: [{ icon: 'g-relic-crown', title: 'Regard', sub: '+1' }] }, r);
    expect(rw).toContain('data-testid="r6-reward-big">+₽60<');
    const log = r5EvLog({ lines: Array.from({ length: 8 }, (_, i) => ({ who: left, text: `line ${i}` })), first: 3, where: 'Street event' }, r);
    expect(log).toContain('line 3');
    expect(log).toContain('line 7');
    expect(log).not.toContain('line 2');
  });
});

describe('R6: the Pokémon pages', () => {
  it('the Reserve box: twelve to a page, the old test ids, drawn without changing the run', () => {
    expect(RESERVE_PAGE).toBe(12);
    const b = block();
    const before = JSON.stringify(b);
    const m = reserveModel(b, b.members[0]!.id, 0, 0, false, { party: 1, look: '' });
    const html = r5Reserve({ box: 'Box 1', count: m.count, types: 'Poison and Dark', cells: m.tiles.map((t) => ({ name: t.species, types: t.type, pic: '', stars: 2, tag: '', on: t.on, fits: t.fits })), empty: 'empty', fitsOnly: false, auto: m.auto, who: m.who.name, notice: null }, run(b));
    for (const id of ['r5-reserve', 'dom-reserve', 'dom-reserve-count', 'dom-tile-0', 'dom-who', 'dom-fits', 'dom-auto']) expect(html, id).toContain(`data-testid="${id}"`);
    expect(html).toContain('class="cells n12"');
    expect(JSON.stringify(b)).toBe(before);
    // Empty box: a line, not a grid of nothing.
    const empty = r5Reserve({ box: 'Box 1', count: '0 / 20', types: 'Poison and Dark', cells: [], empty: 'The Reserve is empty.', fitsOnly: false, auto: false, who: 'Rook', notice: 'Zubat goes to Rook.' }, run(b));
    expect(empty).toContain('The Reserve is empty.');
    expect(empty).toContain('data-testid="dom-notice"');
  });

  it('the Card: 100% when it fits, 0% and the reason when it does not', () => {
    const b = block();
    const base = { mon: 'Zubat', who: 'Rook', sub: 'Rook · BST cap 340', person: '', team: [], pick: '', focus: null, facts: [['Pay', 'Rook’s team 2 of 2']] as const, speaker: { name: 'Rook' }, line: '“Say the word, Boss.”', cta: 'Do it', notice: null };
    const ok = r5Give({ ...base, ok: true, parts: [['Zubat BST', '245', false], ['Rook’s BST cap', '340', false]] }, run(b));
    expect(ok).toContain('--p:100');
    expect(ok).toContain('data-testid="dom-give-cta"');
    expect(ok).toContain('data-testid="dom-bstcap">340<');
    const no = r5Give({ ...base, ok: false, parts: [['Golbat BST', '455', true], ['Rook’s BST cap', '340', false]] }, run(b));
    expect(no).toContain('--p:0');
    expect(no).toContain('class="neg"');
  });

  it('Party, Summary and Bag pages draw their rows, a cursor and a use target', () => {
    const b = block();
    const mon = { name: 'Shinx', level: 5, types: 'Electric', hp: 12, item: '', pic: '', big: '' };
    const party = r5Party({ mons: [mon, { ...mon, name: 'Zubat', hp: 100 }], at: 1, swap: 0, using: 'Potion', speaker: { name: 'Rotom', k: 'p-rotom' }, line: 'Who?', notice: null }, run(b));
    expect(party).toContain('data-testid="r6-party-0"');
    expect(party).toMatch(/class="pm31 on"[^>]*data-arg="1"/);
    expect(party).toContain('hp31 low');
    expect(party).toContain('Use Potion on…');
    const sum = r5Summary({ name: 'Shinx', level: 5, pic: '', line1: 'Electric', base: [45, 65, 34, 40, 34, 45], stats: [25, 9, 9, 9, 9, 10], moves: [{ name: 'Tackle', type: 'Normal', pp: 'PP 35' }], ability: 'Rivalry', item: 'None', speaker: { name: 'Rotom' }, line: 'x' }, run(b));
    expect(sum).toContain('class="mr31 t-normal"');
    expect(sum).toContain('<dt>HP</dt><dd>25</dd>');
    const items = Array.from({ length: 8 }, (_, i) => ({ name: `Item ${i}`, count: i + 1, icon: '', big: '', about: `about ${i}`, usable: i === 6 }));
    const bag = r5Bag({ pocket: 'Medicine', pockets: 2, pocketAt: 0, items, at: 6, initial: 'N', notice: null }, run(b));
    // Five rows around the cursor (3-7), the cursor's detail below.
    expect(bag).toContain('data-testid="r6-bag-3"');
    expect(bag).toContain('data-testid="r6-bag-7"');
    expect(bag).not.toContain('data-testid="r6-bag-2"');
    expect(bag).toContain('about 6');
    expect(bag).toContain('Medicine · 36 items');
  });
});
