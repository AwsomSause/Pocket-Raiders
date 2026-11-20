import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phForms, phTravel, type FormsModel, type TravelModel } from '../../src/ui/phantom/screens/travel';

const PH = PHANTOM_VERSIONS[0]!;
const travel = (over: Partial<TravelModel> = {}): TravelModel => ({
  region: 'Alola', no: 2,
  road: [{ name: 'Johto', done: true, next: false }, { name: 'Alola', done: false, next: true }, { name: 'Hoenn', done: false, next: false }],
  tagline: 'Four islands under the sun', forms: 18,
  facts: [['Level cap', '100 → 150'], ['Boss gimmicks', 'up to 2']], backdrop: null, ...over,
});
const forms = (over: Partial<FormsModel> = {}): FormsModel => ({
  region: 'Alola', name: 'Vulpix', prompt: 'Vulpix is loving the beaches of Alola. Want it to start surfing?',
  from: { file: null, types: ['fire'] }, targets: [{ name: 'Alolan Vulpix', file: null, types: ['ice'] }],
  options: [{ label: 'Yes: become Alolan Vulpix', small: 'Free.' }, { label: 'Not now', small: 'Vulpix stays as it is.' }],
  index: 0, backdrop: null, more: 0, ...over,
});

describe('Phantom UI: the Next region page', () => {
  it('shows the one ticket the run holds, the road so far and what changes', () => {
    const html = phTravel(PH, travel());
    expect(pageOf(html)).toBe('travel');
    expect(html.match(/class="tv-t on/g)).toHaveLength(1);
    expect(html).toContain('>Alola</b>');
    expect(html).toContain('<span class="d">Johto</span>');
    expect(html).toContain('<span class="on">Alola</span>');
    expect(html).toContain('18 regional forms');
    expect(html).toContain('What changes in region 2');
    expect(html).toContain('100 → 150');
    expect(html).toContain('Board');
  });

  it('boundary: no forms, one form, no tagline, and a long run keeps four regions on the road', () => {
    expect(phTravel(PH, travel({ forms: 0 }))).toContain('No regional forms');
    expect(phTravel(PH, travel({ forms: 1 }))).toContain('1 regional form<');
    expect(phTravel(PH, travel({ tagline: '' }))).not.toContain('<p></p>');
    const road = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar'].map((name, i) => ({ name, done: i < 5, next: i === 5 }));
    const html = phTravel(PH, travel({ road, region: 'Kalos', no: 6 }));
    const way = html.slice(html.indexOf('tv-way'), html.indexOf('tv-tix'));
    expect(way.match(/<span/g)).toHaveLength(4);
    expect(way).toContain('<span class="on">Kalos</span>');
    expect(way.match(/<em>…<\/em>/g)).toHaveLength(2);
  });

  it('escapes names', () => {
    expect(phTravel(PH, travel({ region: '<b>x</b>', tagline: '<i>y</i>' }))).not.toMatch(/<b>x<\/b>|<i>y<\/i>/);
  });
});

describe('Phantom UI: the Regional forms page', () => {
  it('asks the game\'s own line, shows the form beside the one it has, and offers each answer', () => {
    const html = phForms(PH, forms());
    expect(pageOf(html)).toBe('forms');
    expect(html).toContain('Vulpix is loving the beaches of Alola.');
    expect(html).toContain('Want it to start surfing?');
    expect(html.match(/class="fm-c /g)).toHaveLength(1);
    expect(html).toContain('Alolan Vulpix');
    expect(html.match(/class="ch( on)?"/g)).toHaveLength(2);
    expect(html.match(/class="ch on"/g)).toHaveLength(1);
    expect(html).toContain('data-act="form" data-arg="1"');
    expect(html).toContain('One free offer for each Pokémon in each region.');
    expect(html).not.toContain('more of your party');
  });

  it('boundary: two forms give two cards and three answers; a line with no first sentence still asks', () => {
    const two = phForms(PH, forms({ targets: [{ name: 'A', file: null, types: [] }, { name: 'B', file: null, types: [] }], options: [{ label: 'Yes: become A', small: '' }, { label: 'Yes: become B', small: '' }, { label: 'Not now', small: '' }], index: 2, more: 2 }));
    expect(two.match(/class="fm-c /g)).toHaveLength(2);
    expect(two.match(/class="ch( on)?"/g)).toHaveLength(3);
    expect(two).toContain('2 more of your party are asked after this.');
    // X is always the last answer ("Not now").
    expect(two).toContain('data-act="form" data-arg="2"');
    const plain = phForms(PH, forms({ prompt: 'Take the local form?' }));
    expect(plain).toContain('Take the local form?');
    expect(plain).toContain('Vulpix can take its Alola form.');
  });

  it('escapes names', () => {
    expect(phForms(PH, forms({ name: '<b>x</b>', prompt: '<i>y</i>' }))).not.toMatch(/<b>x<\/b>|<i>y<\/i>/);
  });
});
