import { describe, expect, it } from 'vitest';
import type { TableLook } from '../../src/core/evil/screens';
import { tableView, type TableModel } from '../../src/ui/redux/screens/evilLooks';

const count = (html: string, bit: string): number => html.split(bit).length - 1;
const look = (team: 'magma' | 'aqua' = 'magma'): TableLook => ({
  kind: 'table', team,
  seats: [{ name: 'Leader Maxie', sprite: 'maxie' }, { name: 'Admin Tabitha', sprite: 'tabitha' }, { name: 'Admin Courtney', sprite: '' }],
  pins: [{ label: 'Fallarbor', x: 22, y: 22 }, { label: 'Slateport', x: 34, y: 60 }, { label: 'Lilycove', x: 74, y: 18 }],
});
const choice = (label: string): TableModel['choices'][number] => ({ label, sub: '', chance: '', locked: false });
const table = (over: Partial<TableModel> = {}): TableModel => ({
  look: look(),
  choices: [
    choice('Move The Ash Round’s pin off Fallarbor’s ash, out to the empty hills. (30% chance it’s noticed)'),
    choice('Move The Ferry Dues’s pin off Slateport’s boats, out to the empty hills. (45% chance it’s noticed)'),
    choice('Move The Recruiting Drive’s pin off Lilycove’s bored, out to the empty hills. (30% chance it’s noticed)'),
    choice('Leave the pins where they are.'),
  ],
  index: 0, files: [null, null, null], text: 'A table with a map of Hoenn on it.', ...over,
});

describe('Leader’s Table (war room)', () => {
  it('seats the Leader and both lieutenants by name, and leaves the player’s chair empty', () => {
    const html = tableView(table());
    for (const name of ['Leader Maxie', 'Admin Tabitha', 'Admin Courtney']) expect(html).toContain(name);
    expect(count(html, 'your chair')).toBe(1);
    expect(html).toContain('A table with a map of Hoenn on it.');
  });
  it('every plan is a pin on the map with its town’s name', () => {
    const html = tableView(table({ index: 3 }));
    for (const town of ['Fallarbor', 'Slateport', 'Lilycove']) expect(html).toContain(town);
    expect(count(html, 'class="abs wr-pin ')).toBe(3);
    expect(html).not.toContain('wr-bob');
  });
  it('the plan under the cursor shows its pin marching out to the empty hills; leaving the pins shows no move', () => {
    const moving = tableView(table({ index: 1 }));
    expect(count(moving, 'class="wr-march"')).toBe(1);
    expect(count(moving, 'wr-bob')).toBe(1);
    expect(count(moving, 'class="abs wr-pin ')).toBe(3);
    expect(moving).toContain('text-decoration:line-through">Slateport');
    expect(count(tableView(table({ index: 3 })), 'class="wr-march"')).toBe(0);
  });
  it('the chance of being noticed is a gauge with the choice’s own number, and is cut from the words', () => {
    const html = tableView(table());
    expect(html).toContain('--r:30%');
    expect(html).toContain('--r:45%');
    expect(html).toContain('45%');
    expect(html).not.toContain('chance it’s noticed');
    expect(count(html, 'class="wr-risk"')).toBe(3);
  });
  it('one card per choice, each with its own click, and only the one under the cursor is lit', () => {
    const html = tableView(table({ index: 2 }));
    expect(count(html, 'wr-card')).toBe(4);
    for (const k of [0, 1, 2, 3]) expect(html).toContain(`data-act="pick" data-arg="${k}"`);
    expect(count(html, 'wr-card on"')).toBe(1);
  });
  it('wears the team’s colours: Magma and Aqua do not look the same', () => {
    expect(tableView(table())).not.toBe(tableView(table({ look: look('aqua') })));
  });
  it('never injects text as HTML', () => {
    const html = tableView(table({
      look: { ...look(), seats: [{ name: '<b>l</b>', sprite: '' }, { name: '<i>a</i>', sprite: '' }, { name: '<u>c</u>', sprite: '' }], pins: [{ label: '<s>p</s>', x: 10, y: 10 }] },
      choices: [choice('<em>c</em>')], index: 0, text: '<p>x</p>',
    }));
    for (const tag of ['<b>l</b>', '<i>a</i>', '<u>c</u>', '<s>p</s>', '<em>c</em>', '<p>x</p>']) expect(html).not.toContain(tag);
  });
});
