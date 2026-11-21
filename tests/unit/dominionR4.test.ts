// DOMINION redesign R4 (pass 50): the Jobs and Trainers pages keep the old test ids, draw the run's own numbers, and the
// Pick the crew cursor only changes what Do it will bring (normal, boundary and refused picks).
import { describe, expect, it } from 'vitest';
import type { CardModel } from '../../src/core/dominion/fieldScreens';
import type { JobModel, OrderModel } from '../../src/core/dominion/moments';
import type { InterruptModel } from '../../src/core/dominion/heroScreens';
import { DOMINION_MODE_ID, startInRun } from '../../src/core/dominion/session';
import type { DominionBlock } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import { CrewPick, r5Botched, r5Card, r5CardLesson, r5CrewPick, r5Done, r5HeroHit, r5Order, type R5Person } from '../../src/ui/redux/screens/dominion/r50/jobs';
import { r5BossCard } from '../../src/ui/redux/screens/dominion/r50/trainers';
import { r5RunOf } from '../../src/ui/redux/screens/dominion/r50/run';
import { content } from './helpers';

const block = (): DominionBlock => {
  const run = chooseStarter(content, createRun(content, { runId: 'r4', seed: 'r4', archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
  return startInRun(content, run, { types: ['poison', 'dark'], member: 'grunt', look: 0 }).run.expansion!.dominion!;
};
const run = () => r5RunOf(block(), []);
const person = (name: string): R5Person => ({ pic: `<img alt="${name}">`, face: (sz) => `<img data-sz="${sz}">`, name, role: 'Grunt', colour: '#3f7fd9' });

const card = (o: Partial<CardModel> = {}): CardModel => ({
  title: 'Extort', sub: 'Pewter Mart', slotLine: 'Action 1 of 4', pays: 'Pays <b>₽150–600</b>, then <b>₽120/wk</b>', roll: true, chance: 47, dial: '47%', bar: 47, exact: true,
  parts: [['Boss Nerve 2', 16], ['Heat in Pewter', -1]], heat: 5, failHeat: 12, regard: -2, dread: 3, hurt: { name: "Who's hurt", look: '', line: 'The Mart clerk.' },
  see: { name: 'Who might see', look: '', line: 'Nobody who matters.' }, battle: { chance: 40, always: false, species: 'geodude', line: 'The clerk’s brother.' },
  win: '₽150–600', lose: 'Heat +12', travel: '', level: 'Rookie · Lv 1 of 5', blocked: null, brought: [], opts: [], opt: null, note: '', squad: 1, ...o,
});

describe('redesign R4: the Card', () => {
  it('draws the ring, the odds and who is there, with the old test ids and plain pay text', () => {
    const h = r5Card(card(), { who: [], speaker: null, line: 'Say the word, Boss.', showOdds: true }, run());
    for (const id of ['r5-card', 'dom-card', 'dom-card-chance', 'dom-card-total', 'dom-card-pays', 'dom-card-slot', 'dom-doit', 'dom-bring', 'dom-card-back']) expect(h).toContain(`data-testid="${id}"`);
    expect(h).toContain('--p:47');
    expect(h).toContain('Battle? 40%');
    expect(h).toContain("Who&#39;s hurt");
    expect(h).toMatch(/data-testid="dom-card-pays">₽150–600, then ₽120\/wk</);
    expect(h).not.toContain('&lt;b&gt;');
  });
  it('an unscouted range is written in the ring; hidden odds show "?" and no parts', () => {
    expect(r5Card(card({ dial: '35–55%', exact: false }), { who: [], speaker: null, line: '', showOdds: true }, run())).toMatch(/class="cnt txt4" data-testid="dom-card-chance">35–55%</);
    const hid = r5Card(card(), { who: [], speaker: null, line: '', showOdds: false }, run());
    expect(hid).toContain('dom-card-odds-hidden');
    expect(hid).toMatch(/data-testid="dom-card-chance">\?</);
    expect(hid).not.toContain('Boss Nerve 2');
  });
  it('a blocked Card says why in the text box and dims Do it; choices and their note show', () => {
    const h = r5Card(card({ blocked: "That's a Night action.", opts: [{ id: 'beat', label: 'Beat them' }, { id: 'buy', label: 'Buy out' }], opt: 'beat', note: 'Brock (rock)' }), { who: [], speaker: null, line: '', showOdds: true }, run());
    expect(h).toMatch(/data-testid="dom-card-blocked"[^>]*>That&#39;s a Night action\.</);
    expect(h).toContain('cta rc13 on off4');
    expect(h).toContain('data-testid="dom-opt-beat"');
    expect(h).toContain('data-testid="dom-card-note">Brock (rock)');
  });
  it('the lesson coach sits inside the page with the tutorial acts', () => {
    const ov = r5CardLesson({ lesson: 'The Card', n: 6, of: 15, step: 0, steps: 1, items: [['1', 'The odds.']] });
    expect(ov.startsWith('<div data-r5in')).toBe(true);
    expect(ov).toContain('Lesson 6 of 15 · The Card');
    expect(ov).toContain('data-act="tutNext"');
    const h = r5Card(card(), { who: [], speaker: null, line: '', showOdds: true }, run(), ov);
    expect(h.indexOf('coach21')).toBeLessThan(h.lastIndexOf('</div></div>'));
  });
});

describe('redesign R4: Pick the crew', () => {
  it('solo jobs swap the one member; squads add up to the limit and refuse one more; a pick drops on a second press', () => {
    expect(CrewPick.toggle([], 'a', 1)).toEqual({ bring: ['a'], full: false });
    expect(CrewPick.toggle(['a'], 'b', 1)).toEqual({ bring: ['b'], full: false });
    expect(CrewPick.toggle(['a'], 'a', 1)).toEqual({ bring: [], full: false });
    expect(CrewPick.toggle(['a'], 'b', 2)).toEqual({ bring: ['a', 'b'], full: false });
    expect(CrewPick.toggle(['a', 'b'], 'c', 2)).toEqual({ bring: ['a', 'b'], full: true });
  });
  it('the cursor moves on a three-wide grid and stops at the edges', () => {
    const c = new CrewPick();
    c.open();
    c.move('left', 5);
    expect(c.at).toBe(0);
    c.move('right', 5);
    c.move('down', 5);
    expect(c.at).toBe(4);
    c.move('down', 5);
    expect(c.at).toBe(4);
    c.move('up', 0);
    expect(c.at).toBe(4);
  });
  it('draws every member with their pick mark', () => {
    const h = r5CrewPick({ job: 'Extort', most: 2, stat: 'Nerve', at: 1, note: null, cells: [
      { id: 'a', name: 'Rook', pic: '', colour: '#000', stars: 1, line: 'Nerve 1 · +3%', picked: true, tag: null },
      { id: 'b', name: 'Bram', pic: '', colour: '#000', stars: 2, line: 'Nerve 4 · in jail', picked: false, tag: 'Out' },
    ] }, run());
    expect(h).toContain('Extort · pick up to 2 · Nerve job');
    expect(h).toMatch(/data-testid="dom-crewpick-0"[\s\S]*✓/);
    expect(h).toMatch(/class="cell on" [^>]*data-testid="dom-crewpick-1"/);
    expect(h).toContain('<i class="tag">Out</i>');
  });
});

const job = (o: Partial<JobModel> = {}): JobModel => ({
  kind: 'done', big: false, title: 'Extort · Pewter Mart', rolled: 'rolled 2 under 47', stamp: 'PAID IN FULL', take: 600,
  changes: [{ ic: 'g-amulet-coin', label: 'Funds', from: '₽1,000 → ₽1,600', d: '+₽600', cls: 'up' }, { ic: 'g-fire-stone', label: 'Heat in Pewter', from: '2 → 7', d: '+5', cls: 'dn' }],
  weekly: 'Pewter Mart now pays ₽120 every week', member: { name: 'Rook', look: '' }, caught: null, held: null, head: 'Rook got away. What now?', quote: null, lines: 'The clerk pays.', ...o,
});
const TEXTS = { police: 'Face the police', policeSub: 'They want a word', map: 'Back to the Map', mapSub: 'Lie low', next: 'Try the next action', nextSub: 'On to the next action' };
const extras = (o: Partial<Parameters<typeof r5Botched>[1]> = {}) => ({ member: person('Rook'), day: 2, place: 'Pewter Mart', at: 0, note: null, held: null, texts: TEXTS, ...o });

describe('redesign R4: the job moments', () => {
  it('the order cut-in names the order for screen readers and shows both lines', () => {
    const m: OrderModel = { verb: 'EXTORT', sub: 'PEWTER MART · 47%', boss: 'Look them in the eye.', crew: { name: 'Rook', look: '', line: 'On it, Boss!' } };
    const h = r5Order(m, person('Red'), person('Rook'), run());
    expect(h).toContain('ORDER: EXTORT');
    expect(h).toMatch(/data-testid="dom-order-boss"[^>]*>.*THE BOSS: /);
    expect(h).toContain('Rook: “On it, Boss!”');
    expect(h).toContain('data-act="jobSkip"');
  });
  it('Job done: the take, the stamp, the roll, every change and the weekly pay', () => {
    const h = r5Done(job(), extras(), run());
    expect(h).toMatch(/data-testid="dom-job-take">\+₽600</);
    expect(h).toMatch(/data-testid="dom-job-stamp">PAID IN FULL</);
    expect(h).toContain('rolled 2 under 47');
    expect(h).toContain('Heat in Pewter');
    expect(h).toContain('data-testid="dom-job-weekly"');
    expect(h).toContain('data-testid="dom-job-map"');
  });
  it('Job botched: two ways on when nobody was caught, one when the Boss was, three for a held member', () => {
    const none = r5Botched(job({ kind: 'botched', stamp: 'BOTCHED', take: 0 }), extras(), run());
    expect(none).toContain('dom-job-choice-1');
    expect(none).toContain('On to the next action');
    const boss = r5Botched(job({ kind: 'botched', stamp: 'BOTCHED', take: 0, caught: 'You', held: 'boss' }), extras(), run());
    expect(boss).toContain('Face the police');
    expect(boss).not.toContain('dom-job-choice-1');
    const held = r5Botched(job({ kind: 'botched', stamp: 'BOTCHED', take: 0, caught: 'Rook', held: 'member' }), extras({ at: 1, held: [
      { id: 'bail', label: 'Pay Rook’s bail', sub: '₽500', on: false }, { id: 'break', label: 'Break Rook out', sub: '40%', on: true }, { id: 'leave', label: 'Leave Rook', sub: 'Free', on: true },
    ] }), run());
    expect(held).toContain('dom-job-choice-2');
    expect(held).toMatch(/class="cta rc13 off4" [^>]*data-testid="dom-job-choice-0"/);
    expect(held).toMatch(/class="cta rc13 on" [^>]*data-testid="dom-job-choice-1"/);
    expect(held).toContain('CAUGHT');
  });
  it('the Hero shows up: three answers, the cursor lit, Smoke Ball dimmed without one', () => {
    const m: InterruptModel = { hero: 'Blue', look: 'bosses/blue.png', threat: 30, member: 'Rook', job: 'Lay Low', smoke: 0, smokeChance: 45, runHeat: 2 };
    const h = r5HeroHit(m, person('Rook'), person('Blue'), 1, null, run());
    expect(h).toMatch(/data-testid="dom-interrupt"[\s\S]*BLUE/);
    expect(h).toMatch(/class="ch on" [^>]*data-testid="dom-interrupt-1"/);
    expect(h).toMatch(/class="ch dim4" [^>]*data-testid="dom-interrupt-2"[^>]*>.*You have no Smoke Ball/);
    expect(h).toContain('Threat 30');
  });
});

describe('redesign R4: the Boss card', () => {
  it('front and back from the run, a Back button', () => {
    const h = r5BossCard({
      name: 'Red', idNo: '03142', pic: '', facts: [['Name', 'RED'], ['Money', '₽1,000']], goal: { pct: 12, label: '12% · Takeover' },
      gyms: [{ k: 'bd-rock', who: 'nova', name: 'Brock' }, { k: 'bd-water', who: 'next', name: 'Misty' }], back: [['Hero', 'Blue · Threat 30']], speaker: null, line: '“Hi.”',
    }, run());
    expect(h).toContain('data-testid="r5-tcard"');
    expect(h).toContain('ID No. 03142');
    expect(h).toContain('width:12%');
    expect(h).toContain('class="g-nova"');
    expect(h).toContain('data-act="tcardBack"');
  });
});
