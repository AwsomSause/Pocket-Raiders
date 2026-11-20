import { describe, expect, it } from 'vitest';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phGimmickPick, phPhase, phSide, type GimmickModel, type GimmickSlot, type PhaseModel, type SideModel } from '../../src/ui/phantom/screens/moments';

// The Phantom UI's gimmick picker, the card for a fight that changes gear (a boss's last stand, a raid's next phase)
// and the card that opens a fight inside an event (a side stage).

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, bit: string | RegExp): number => html.split(bit).length - 1;
const cutOut = (html: string): string[] => [...html.matchAll(/class="rs[^"]*" aria-label="([^"]*)"/g)].map((m) => m[1]!);

const slots = (): GimmickSlot[] => [
  { kind: 'mega', ready: true, armed: false, foot: 'READY · Charizardite X' },
  { kind: 'tera', ready: true, armed: false, foot: 'READY · Tera type: Dragon', row: 15 },
  { kind: 'dynamax', ready: true, armed: false, foot: 'READY · 3 turns' },
  { kind: 'zmove', ready: false, armed: false, foot: 'You need a Z-Ring to use a Z-Move.' },
];
const gimmick = (over: Partial<GimmickModel> = {}): GimmickModel => ({ name: 'Charizard', slots: slots(), index: 1, other: 'Silver has 1 gimmick left and has not used one yet.', backdrop: null, ...over });
const phase = (over: Partial<PhaseModel> = {}): PhaseModel => ({ lab: 'Champion Lance · Stage 30', word: 'LAST STAND', line: 'You have earned this. See my true strength!', face: null, mon: null, meter: { at: 2, of: 2 }, left: { alive: 2, total: 6 }, chips: ['1 gimmick not used yet'], go: 'Face the champion', ...over });
const side = (over: Partial<SideModel> = {}): SideModel => ({ event: "Oak's request", backdrop: null, mon: null, person: false, foe: { name: 'Dragonite', level: 60, types: ['dragon', 'flying'], tag: 'Catchable' }, stage: { no: 14, of: 30 }, ...over });

describe('the Phantom gimmick picker', () => {
  it('shows all four, lights the one under the cursor, greys the one that is not ready and says why', () => {
    const html = phGimmickPick(ph, gimmick());
    expect(pageOf(html)).toBe('gimmick');
    expect(count(html, 'class="gm-c ')).toBe(4);
    expect(html).toContain('gm-c gm-tera on');
    expect(html).toContain('gm-c gm-z off');
    expect(count(html, ' off"')).toBe(1);
    expect(html).toContain('CHARIZARD · ONE GIMMICK PER BATTLE');
    expect(html).toContain('READY · Tera type: Dragon');
    expect(html).toContain('You need a Z-Ring to use a Z-Move.');
    expect(html).toContain('Silver has 1 gimmick left');
    expect(html).toContain('>Use it<');
    for (let i = 0; i < 4; i += 1) expect(html).toContain(`data-act="pick" data-arg="${i}"`);
    expect(html).toContain('data-act="back"');
  });

  it('the key says what Z does: nothing on one that is not ready, and it takes an armed one off', () => {
    expect(phGimmickPick(ph, gimmick({ index: 3 }))).toContain('>Not ready<');
    const armed = slots().map((g, i) => (i === 0 ? { ...g, armed: true } : g));
    const html = phGimmickPick(ph, gimmick({ slots: armed, index: 0 }));
    expect(html).toContain('>Take it off<');
    expect(html).toContain('ON · Charizardite X');
    expect(phGimmickPick(ph, gimmick({ other: '' }))).not.toContain('gm-note');
  });

  it('escapes names', () => {
    const html = phGimmickPick(ph, gimmick({ name: '<b>Zard</b>', other: 'A <wild> one' }));
    expect(html).not.toContain('<b>Zard</b>');
    expect(html).toContain('A &lt;wild&gt; one');
  });
});

describe('the Phantom phase card', () => {
  it('a last stand: the cut-out words, the line, which phase it is, who is left, and a key to go on', () => {
    const html = phPhase(ph, phase());
    expect(pageOf(html)).toBe('phase');
    expect(cutOut(html)).toEqual(['LAST STAND']);
    expect(html).toContain('Champion Lance · Stage 30');
    expect(html).toContain('See my true strength!');
    expect(html).toContain('aria-label="phase 2 of 2"');
    expect(html).toContain('2 of 2');
    expect(count(html, 'class="ph-vs-ball"')).toBe(2);
    expect(count(html, 'class="ph-vs-ball out"')).toBe(4);
    expect(html).toContain('2 Pokémon left');
    expect(html).toContain('1 gimmick not used yet');
    expect(html).toContain('Face the champion');
    expect(html).toContain('data-act="next"');
  });

  it('a raid phase inside a turn: no key row, no team, and no meter when the fight does not count phases', () => {
    const html = phPhase(ph, phase({ word: 'PHASE 2', meter: { at: 2, of: 3 }, left: null, chips: [], go: null }));
    expect(cutOut(html)).toEqual(['PHASE 2']);
    expect(html).toContain('aria-label="phase 2 of 3"');
    expect(html).not.toContain('class="keys"');
    expect(html).not.toContain('lp-ch');
    expect(html).toContain('data-act="next"');
    const plain = phPhase(ph, phase({ meter: null }));
    expect(plain).not.toContain('lp-m"');
    expect(phPhase(ph, phase({ meter: { at: 1, of: 1 } }))).not.toContain('lp-m"');
  });

  it('a long rule gets smaller letters', () => {
    const long = phPhase(ph, phase({ line: 'x'.repeat(160) }));
    expect(long).toContain('font-size:20px');
    expect(phPhase(ph, phase())).toContain('font-size:30px');
  });
});

describe('the Phantom side stage card', () => {
  it('names the event, says it uses no stage up, and shows who waits', () => {
    const html = phSide(ph, side());
    expect(pageOf(html)).toBe('side');
    expect(cutOut(html)).toEqual(['SIDE', 'STAGE']);
    expect(html).toContain('Part of Oak&#39;s request');
    expect(html).toContain('does <b>not</b> use one up');
    expect(html).toContain('<b>14 of 30</b>');
    expect(html).toContain('aria-label="step 3 of 5"');
    expect(html).toContain('<u>14</u><i>+ side</i>');
    expect(html).toContain('<u>13</u>');
    expect(html).toContain('<u>16</u>');
    expect(html).toContain('Lv.60');
    expect(html).toContain('Catchable');
    expect(html).toContain('>Fight<');
  });

  it('the first and the last stage keep the line on the page; a Trainer shows no level', () => {
    const first = phSide(ph, side({ stage: { no: 1, of: 30 } }));
    expect(first).not.toContain('<u>0</u>');
    expect(first).toContain('<u>3</u>');
    const last = phSide(ph, side({ stage: { no: 30, of: 30 } }));
    expect(last).not.toContain('<u>31</u>');
    expect(last).toContain('<u>29</u>');
    const none = phSide(ph, side({ stage: null }));
    expect(none).not.toContain('sy-line');
    expect(none).not.toContain('You are still on stage');
    const who = phSide(ph, side({ person: true, foe: { name: 'Team Rocket Grunt', level: null, types: [], tag: '3 Pokémon' } }));
    expect(who).not.toContain('Lv.');
    expect(who).toContain('3 Pokémon');
    expect(who).toContain('ph-sy-mon who');
  });
});
