import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phBriefing, phFiled, phFinal, phTable, phTeamRank } from '../../src/ui/phantom/screens/teams';
import type { BriefingModel, FinalModel, TableModel } from '../../src/ui/redux/screens/evilLooks';

// The Phantom UI's pages for the team's own moments: briefing, the Leader's Table, the Final Choice, the filed result
// and the rank-up. Pure functions from the New UI's models to HTML.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const choice = (label: string, sub = '', locked = false) => ({ label, sub, chance: '', locked });

const briefing = (over: Partial<BriefingModel> = {}): BriefingModel => ({
  look: { kind: 'briefing', team: 'magma', order: 8, title: 'The Ash Round', by: 'Admin Tabitha', quote: 'Sweep the ash.', numbers: [['Standing +3', 'Suspicion −1'], ['Standing +2', 'Kindness +1'], ['Standing −2']], withYou: 'Ottoway, who talks too much.', tip: null },
  choices: [choice('By the book.', 'Certain outcome'), choice("Quietly. (25% chance it's noticed)", 'Luck of the draw'), choice('Refuse.', 'Certain outcome', true)],
  index: 1, text: 'The order: sweep <b>Fallarbor</b>.', ...over,
});

const table = (over: Partial<TableModel> = {}): TableModel => ({
  look: { kind: 'table', team: 'aqua', seats: [{ name: 'Leader Archie', sprite: 'a' }, { name: 'Admin Shelly', sprite: 'b' }, { name: 'Admin Matt', sprite: 'c' }], pins: [{ label: 'Slateport', x: 30, y: 60 }, { label: 'Lilycove', x: 70, y: 20 }] },
  choices: [choice("Move Slateport's pin. (30% chance it's noticed)"), choice("Move Lilycove's pin. (30% chance it's noticed)"), choice('Leave the pins where they are.')],
  index: 0, files: [null, null, null], text: 'Plans are pins.', ...over,
});

const final = (over: Partial<FinalModel> = {}): FinalModel => ({
  look: { kind: 'final', centre: 'red', says: ['"Wake it."', '"No."', '"Give it to them."', '"Neither of you."'], faces: [{ name: 'Leader Maxie', sprite: 'm', react: ['hard', 'down', 'away', 'lean'], apart: false }, { name: 'Ottoway', sprite: 'o', react: ['lean', '', '', ''], apart: true }] } as FinalModel['look'],
  choices: [choice('Carry out the plan.'), choice('Turn on the team.'), choice('Side with the other team.', 'Only after an earlier choice', true), choice('Take it all.')],
  index: 0, hold: 0, files: [null, null], title: 'The Seafloor Cavern', ...over,
});

describe('Phantom team briefing', () => {
  it('deals one card per way with its numbers, lights one, marks the locked one, and reads the risk out of the label', () => {
    const html = phBriefing(ph, briefing());
    expect(pageOf(html)).toBe('brief');
    expect(count(html, /class="ph-bf-c[ "]/)).toBe(3);
    expect(html).toMatch(/class="ph-bf-c on"[^>]*data-act="pick" data-arg="1" data-over="over"/);
    expect(count(html, /class="ph-bf-c off"/)).toBe(1);
    for (const t of ['Order 08', 'issued by Admin Tabitha', 'The Ash Round', '“Sweep the ash.”', 'Standing', '+3', '−1', 'Quietly.', 'Noticed', '25%', 'With you', 'Ottoway, who talks too much.']) expect(html).toContain(t);
    expect(html).not.toContain('chance it');
    expect(html).not.toContain('<b>Fallarbor</b>');
    // A number that costs you is marked.
    expect(count(html, '<dd class="bad">')).toBe(2);
  });

  it('a double agent’s tip stands apart in the other team’s colour, and no "with you" line is drawn when nobody comes', () => {
    const html = phBriefing(ph, briefing({ look: { ...briefing().look, tip: 2, withYou: null, numbers: [['Standing +3'], ['Standing +2']] } }));
    expect(count(html, / tip"/)).toBe(1);
    expect(html).toContain('The other side');
    expect(html).toContain('Suspicion');
    expect(html).not.toContain('With you');
  });
});

describe("Phantom Leader's Table", () => {
  it('seats the leader and the lieutenants, pins the plans on the map, and moves the lit plan’s pin to the empty hills', () => {
    const html = phTable(ph, table());
    expect(pageOf(html)).toBe('table');
    for (const t of ['Team Aqua', 'Leader Archie', 'Admin Shelly', 'Admin Matt', 'your chair', 'Slateport', 'Lilycove', 'the empty hills', 'Next week’s work', 'Plans are pins.']) expect(html).toContain(t);
    expect(count(html, 'class="ph-tb-seat ')).toBe(3);
    expect(count(html, /class="ph-tb-pin gone"/)).toBe(1);
    expect(count(html, /class="ph-tb-pin to"/)).toBe(1);
    expect(count(html, /class="ph-tb-plan[ "]/)).toBe(3);
    expect(html).toMatch(/class="ph-tb-plan on"[^>]*data-act="pick" data-arg="0"/);
    expect(count(html, 'class="ph-tm-risk"')).toBe(2);
    // Missing pictures are plain silhouettes, never a hole.
    expect(count(html, 'class="ph-tm-sil"')).toBe(3);
  });

  it('on the plan that moves nothing, every pin stays and no pin is on the hills', () => {
    const html = phTable(ph, table({ index: 2 }));
    expect(html).not.toMatch(/class="ph-tb-pin gone"/);
    expect(html).not.toMatch(/class="ph-tb-pin to"/);
    expect(html).toContain('class="ph-tb-hills"');
    expect(html).toMatch(/class="ph-tb-plan on plain"/);
  });
});

describe('Phantom Final Choice', () => {
  it('has four corners to hold, a ring of faces that react to the lit corner, and says how to choose', () => {
    const html = phFinal(ph, final());
    expect(pageOf(html)).toBe('final');
    expect(count(html, 'data-hold="')).toBe(4);
    expect(html).toMatch(/class="ph-fc-c c0 on"[^>]*data-hold="0" data-on="1"/);
    expect(html).toMatch(/class="ph-fc-c c2 off"/);
    for (const t of ['Carry out the plan', '&quot;Wake it.&quot;', 'Needs: Only after an earlier choice', 'Leader Maxie', 'Ottoway', 'The Seafloor Cavern', 'Letting go cancels']) expect(html).toContain(t);
    expect(html).toMatch(/class="ph-fc-f hard"/);
    expect(html).toMatch(/class="ph-fc-f lean apart"/);
    expect(html).toContain('class="ph-fc-orb red"');
    expect(html).toContain('--p:0%');
  });

  it('the hold fills the ring and is clamped, the faces follow the cursor, and Team Sky’s is the sky from a well', () => {
    const held = phFinal(ph, final({ hold: 0.7, index: 1 }));
    expect(held).toContain('--p:70%');
    expect(held).toContain('Holding… 70%');
    expect(held).toMatch(/class="ph-fc-f down"/);
    expect(phFinal(ph, final({ hold: 4 }))).toContain('--p:100%');
    const sky = phFinal(ph, final({ look: { ...final().look, centre: 'sky' } as FinalModel['look'] }));
    expect(sky).toContain('class="ph-fc-orb sky"');
    expect(sky).not.toContain('ph-fc-stand');
  });
});

describe('Phantom filed result and rank-up', () => {
  it('the report says what was done and what changed, keeps the human line apart, and every part closes it', () => {
    const html = phFiled(ph, { team: 'magma', done: 'Refuse.', changed: ['Standing -2 (0/10)', '<i>x</i>'], voice: 'The ash keeps falling, for everybody.' }, 'Continue');
    expect(pageOf(html)).toBe('filed');
    for (const t of ['Mission report', 'Refuse.', 'Standing -2 (0/10)', 'Filed', 'The ash keeps falling', 'Stays until you press Z', 'Continue']) expect(html).toContain(t);
    expect(html).not.toContain('<i>x</i>');
    expect(count(html, 'data-act="next"')).toBe(5);
    const log = phFiled(ph, { team: 'aqua', done: 'Dive.', changed: [], voice: null }, 'Battle!');
    for (const t of ['Ship’s log', 'Logged', 'nothing', 'Battle!']) expect(log).toContain(t);
    expect(log).not.toContain('ph-fd-voice');
  });

  it('the rank-up shows the new rank over the old, who pins it, what it opens, and the team in rows (none in the office)', () => {
    const up = { team: 'Team Magma', color: '#8a1c1c', title: 'Field Agent', rank: 3, office: false, byLeader: false, unlocks: ['Missions', 'Team shop'], bunkFront: true, leader: 'l', lt: 't', grunt: 'g' };
    const html = phTeamRank(ph, up, { leader: null, lt: null, grunt: null }, 'Continue');
    expect(pageOf(html)).toBe('rankup');
    for (const t of ['Team Magma', 'Field Agent', 'Pinned by the lieutenant', 'your bunkmate in the front row', 'Missions', 'Team shop', 'aria-label="rank 3 of 6"', '<s>2</s><b>3</b>']) expect(html).toContain(t);
    expect(count(html, '<i class="f"></i>')).toBe(3);
    expect(count(html, 'class="mate"')).toBe(1);
    expect(count(html, /<span class="(?:mate)?" style="--i:\d+">/)).toBe(9 + 11 + 13);
    const office = phTeamRank(ph, { ...up, rank: 6, office: true, byLeader: true, unlocks: [], bunkFront: false }, { leader: null, lt: null, grunt: null }, 'Continue');
    expect(office).toContain('In the leader’s office');
    expect(office).not.toContain('ph-ru-crowd');
    expect(office).toContain('<s>5</s><b>6</b>');
  });
});
