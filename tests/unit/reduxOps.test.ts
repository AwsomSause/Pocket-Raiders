import { describe, expect, it } from 'vitest';
import { ODDS_COLORS, SIEGE_COLORS, rescueView, siegeCost, siegeMapView, type RescueModel, type SiegeDistrict, type SiegeMapModel } from '../../src/ui/redux/screens/ops';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// New UI: the Rescue screen and the Siege map, drawn on the mock-ups' Beta 0.6 pages. Each is a pure function from a
// model to HTML, so what the player must always be told is checked here without a browser.

const ctx = (layout: number): ReduxCtx => ({ k: layout, skin: {} as ReduxCtx['skin'], v: (n) => layout % n });
const count = (html: string, bit: string): number => html.split(bit).length - 1;

describe('Rescue screen', () => {
  const plan = (label: string, tag = '', locked = false) => ({ label, tag, locked });
  const rescue = (over: Partial<RescueModel> = {}): RescueModel => ({
    header: 'Rescue Plan', head: 'TEAM ROCKET · IMPOUND RECEIPT', held: [['1 × Gyarados', 'Lv 51'], ['1 × Gengar', 'Lv 49']],
    notes: ['Holding site: Celadon Hideout B2F', 'Jailer: Proton'], slip: 'A numbered claim ticket.', stamp: 'LOGGED', stampGood: false,
    clock: { title: 'Holding clock', steps: ['Logged', 'Processed', 'Assigned', 'Held too long'], at: 0, done: false, note: '3 nodes in. Processed at 5.' },
    options: [plan('Quiet Extraction', 'Likely'), plan('Loud Grab', 'Even'), plan('The Deal', 'Safe'), plan('The Inside Job', 'Risky', true), plan('Wait for a better day', '—')],
    index: 0, rival: null, who: 'Kieran', text: 'They took two of yours.', more: false, ...over,
  });

  for (const layout of [0, 1]) {
    describe(`layout ${layout}`, () => {
      it('shows the receipt, the clock, every plan with its odds word, and the rival speaking', () => {
        const html = rescueView(ctx(layout), rescue());
        for (const bit of ['TEAM ROCKET · IMPOUND RECEIPT', '1 × Gyarados', 'Lv 51', '1 × Gengar', 'Lv 49', 'Holding site: Celadon Hideout B2F', 'Jailer: Proton', 'A numbered claim ticket.', 'LOGGED']) expect(html).toContain(bit);
        for (const bit of ['Holding clock', 'Logged', 'Processed', 'Assigned', 'Held too long', '3 nodes in. Processed at 5.']) expect(html).toContain(bit);
        for (const bit of ['Quiet Extraction', 'Loud Grab', 'The Deal', 'The Inside Job', 'Wait for a better day', 'Likely', 'Even', 'Safe', 'Risky']) expect(html).toContain(bit);
        expect(count(html, 'data-act="pick"')).toBe(5);
        expect(html).toContain('Kieran');
        expect(html).toContain('They took two of yours.');
      });
      it('colours each odds word; a dash is grey', () => {
        const html = rescueView(ctx(layout), rescue());
        for (const word of ['Likely', 'Even', 'Safe', 'Risky']) expect(html).toContain(`background:${ODDS_COLORS[word]};color:#fff`);
        expect(html).toContain('background:#888;color:#fff');
      });
      it('a closed plan is dimmed; a plan with no odds word has no tag', () => {
        expect(count(rescueView(ctx(layout), rescue()), 'opacity:.5')).toBe(1);
        const html = rescueView(ctx(layout), rescue({ options: [plan('Fight')] }));
        expect(html).not.toContain('class="tg"');
      });
      it('while text waits, the choices stay away and a click anywhere turns the page', () => {
        const html = rescueView(ctx(layout), rescue({ more: true }));
        expect(html).not.toContain('data-act="pick"');
        expect(count(html, 'data-act="page"')).toBe(1);
        expect(html).toContain('▼');
        expect(rescueView(ctx(layout), rescue())).not.toContain('data-act="page"');
      });
      it('never injects text as HTML', () => {
        const html = rescueView(ctx(layout), rescue({ head: '<b>h</b>', held: [['<i>m</i>', '<u>l</u>']], notes: ['<s>n</s>'], slip: '<em>s</em>', who: '<q>w</q>', text: '<p>t</p>', options: [plan('<a>o</a>', '<c>g</c>')] }));
        for (const bit of ['<b>h</b>', '<i>m</i>', '<u>l</u>', '<s>n</s>', '<em>s</em>', '<q>w</q>', '<p>t</p>', '<a>o</a>', '<c>g</c>']) expect(html).not.toContain(bit);
      });
    });
  }

  it('the stamp is red, or green for good news; no stamp when there is none', () => {
    expect(rescueView(ctx(0), rescue())).toContain('border:3px solid #d8483a');
    expect(rescueView(ctx(0), rescue({ stamp: 'HOME', stampGood: true }))).toContain('border:3px solid #3fae5a');
    expect(rescueView(ctx(0), rescue({ stamp: '' }))).not.toContain('border:3px solid');
  });
  it('the clock lights the step in hand; a plan under way also marks the steps behind it', () => {
    const lit = 'background:var(--acc)"', past = 'background:var(--acc);opacity:.45';
    const hold = rescueView(ctx(0), rescue({ clock: { title: 'Holding clock', steps: ['A', 'B', 'C'], at: 2, done: false, note: '' } }));
    expect(count(hold, lit)).toBe(1);
    expect(hold).not.toContain(past);
    const under = rescueView(ctx(0), rescue({ clock: { title: 'The plan', steps: ['A', 'B', 'C'], at: 2, done: true, note: '' } }));
    expect(count(under, lit)).toBe(1);
    expect(count(under, past)).toBe(2);
  });
  it('answers that are sentences get buttons that grow with their words', () => {
    const long = rescueView(ctx(0), rescue({ options: [plan('Try the window. There is always a window. It is always alarmed'), plan('Pick the lock')] }));
    expect(long).toContain('white-space:normal');
    expect(rescueView(ctx(0), rescue())).not.toContain('white-space:normal');
  });
});

describe('Siege map', () => {
  const d = (name: string, status: SiegeDistrict['status'], over: Partial<SiegeDistrict> = {}): SiegeDistrict => ({ name, status, gate: true, heldBy: '', ifLost: `${name} effect`, ...over });
  const siege = (over: Partial<SiegeMapModel> = {}): SiegeMapModel => ({
    header: 'Siege · The Long Ledger', title: 'The Long Ledger · Saffron',
    rows: [d('North Gate', 'lost'), d('East Gate', 'held', { heldBy: 'Officer Jenny' }), d('South Gate', 'contested'), d('The Center', 'contested', { gate: false, heldBy: 'Oracle Sabrina' })],
    index: 1, entered: null, tries: 0, button: 'Enter by East Gate', ready: true, text: 'Each district is Held, Contested or Lost.', ...over,
  });

  it('what a district costs: free when held, one battle otherwise, and no gate in the middle', () => {
    expect(siegeCost(d('A', 'held'))).toBe('Free');
    expect(siegeCost(d('A', 'contested'))).toBe('One battle');
    expect(siegeCost(d('A', 'lost'))).toBe('One battle');
    expect(siegeCost(d('A', 'held', { gate: false }))).toBe('No gate');
  });

  for (const layout of [0, 1]) {
    describe(`layout ${layout}`, () => {
      it('shows every district with its status in its colour, and one button to go in', () => {
        const html = siegeMapView(ctx(layout), siege());
        for (const bit of ['North Gate', 'East Gate', 'South Gate', 'The Center', 'Held', 'Contested', 'Lost', 'Each district is Held, Contested or Lost.']) expect(html).toContain(bit);
        for (const s of ['held', 'contested', 'lost'] as const) expect(html).toContain(`background:${SIEGE_COLORS[s]};color:#fff`);
        expect(count(html, 'data-act="district"')).toBe(4);
        expect(count(html, 'data-act="enter"')).toBe(1);
        expect(html).toContain('Enter by East Gate');
      });
      it('the effect of a lost district is on the page', () => {
        expect(siegeMapView(ctx(layout), siege())).toContain('North Gate effect');
      });
      it('a district with no gate dims the button', () => {
        const html = siegeMapView(ctx(layout), siege({ index: 3, button: 'No gate here', ready: false }));
        expect(html).toMatch(/opacity:\.5"[^>]*data-act="enter"/);
        expect(siegeMapView(ctx(layout), siege())).not.toMatch(/opacity:\.5"[^>]*data-act="enter"/);
      });
      it('never injects text as HTML', () => {
        const html = siegeMapView(ctx(layout), siege({ header: '<b>h</b>', title: '<i>t</i>', rows: [d('<u>n</u>', 'lost', { heldBy: '<s>w</s>', ifLost: '<em>e</em>' })], index: 0, button: '<q>b</q>', text: '<p>x</p>' }));
        for (const bit of ['<b>h</b>', '<i>t</i>', '<u>n</u>', '<s>w</s>', '<em>e</em>', '<q>b</q>', '<p>x</p>']) expect(html).not.toContain(bit);
      });
    });
  }

  it('the ledger page: the title, the facts of the district under the cursor, and the list of lost effects', () => {
    const html = siegeMapView(ctx(0), siege());
    expect(html).toContain('The Long Ledger · Saffron');
    for (const bit of ['Status', 'Cost', 'Free', 'Held by', 'Officer Jenny', 'Lost district effects', 'North Gate: North Gate effect']) expect(html).toContain(bit);
    expect(html).not.toContain('Gate fights lost');
    expect(siegeMapView(ctx(0), siege({ tries: 2 }))).toContain('Gate fights lost');
    expect(siegeMapView(ctx(0), siege({ index: 2 }))).toContain('Nobody');
  });
  it('the ledger page rings one district: the one under the cursor, or the gate gone through', () => {
    const ring = ',0 0 0 4px var(--tf)';
    expect(count(siegeMapView(ctx(0), siege()), ring)).toBe(1);
    const gone = siegeMapView(ctx(0), siege({ entered: 1, index: 0 }));
    expect(count(gone, ring)).toBe(1);
    expect(gone.indexOf(ring)).toBeGreaterThan(gone.indexOf('North Gate'));
  });
  it('with no district lost, the page says so', () => {
    expect(siegeMapView(ctx(0), siege({ rows: [d('East Gate', 'held')], index: 0 }))).toContain('No district is lost.');
  });
  it('more than six districts still fit the page: the cells get shorter', () => {
    const many = siegeMapView(ctx(0), siege({ rows: Array.from({ length: 9 }, (_, k) => d(`D${k}`, 'held')) }));
    const h = /height:(\d+)px;gap:6px/.exec(many);
    expect(h).not.toBeNull();
    expect(Number(h![1]) * 3 + 16).toBeLessThanOrEqual(340 - 32 - 36);
    expect(siegeMapView(ctx(0), siege())).toContain('height:112px;gap:6px');
  });
  it('the list page marks the chosen gate', () => {
    expect(count(siegeMapView(ctx(1), siege()), 'Chosen gate')).toBe(1);
    expect(siegeMapView(ctx(1), siege({ index: 3 }))).not.toContain('Chosen gate');
    expect(count(siegeMapView(ctx(1), siege({ entered: 1, index: 3 })), 'Chosen gate')).toBe(1);
  });
});
