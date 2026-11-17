import { describe, expect, it } from 'vitest';
import { wideView, type WideChip, type WideModel, type WideOption } from '../../src/ui/redux/screens/wide';
import type { ReduxCtx } from '../../src/ui/redux/stage';

// New UI: the wide-format pages (Breather, Blackout, Convoy, Front, Debate, the Colossus plate and the plain page),
// drawn on the mock-ups' `wide` template. Each is a pure function from a model to HTML. (Pictures need the loaded
// sprite sheets, so the browser tests look at those.)

const ctx: ReduxCtx = { k: 0, skin: {} as ReduxCtx['skin'], v: () => 0 };
const count = (html: string, bit: string): number => html.split(bit).length - 1;
const opt = (label: string, sub = '', locked = false): WideOption => ({ label, sub, locked });
const chip = (name: string, hp = 100, note = ''): WideChip => ({ name, file: `pokemon/${name.toLowerCase()}.png`, hp, note });
const base = (over: Partial<WideModel> = {}): Omit<WideModel, 'body'> => ({ title: 'Breather', art: 'packs/memories/eventbg/indoor.png', shade: '#0007', options: [opt('Rest')], index: 0, text: 'Sit. Eat something.', ...over });
const picks = (html: string): number => count(html, 'data-act="pick"');

describe('Wide pages: what every one has', () => {
  const page = (over: Partial<WideModel> = {}): string => wideView(ctx, { ...base(over), body: { kind: 'plain', lines: ['One.', 'Two.'] } });

  it('the header, the text box, the backdrop with its shade, and a button per choice', () => {
    const html = page({ options: [opt('Go'), opt('Stay', 'Not yet', true)] });
    for (const bit of ['Breather', 'Sit. Eat something.', 'One.', 'Two.', 'Go', 'Stay', 'Not yet', 'indoor.png', 'background:#0007']) expect(html).toContain(bit);
    expect(picks(html)).toBe(2);
    expect(count(html, 'opacity:.5')).toBe(1);
    expect(count(html, 'class="btn on"')).toBe(1);
  });
  it('no backdrop and no shade when the page has none', () => {
    const html = page({ art: null, shade: '' });
    expect(html).not.toContain('class="fill" style="background:');
  });
  it('no choices: no buttons', () => {
    expect(picks(page({ options: [] }))).toBe(0);
  });
  it('never injects text as HTML', () => {
    const html = wideView(ctx, { ...base({ title: '<b>t</b>', text: '<p>x</p>', options: [opt('<a>o</a>', '<c>s</c>')] }), body: { kind: 'plain', lines: ['<i>l</i>'] } });
    for (const bit of ['<b>t</b>', '<p>x</p>', '<a>o</a>', '<c>s</c>', '<i>l</i>']) expect(html).not.toContain(bit);
  });
});

describe('Breather', () => {
  const room = { title: 'The quiet room', text: 'Everyone still standing heals.', facts: [['Heal', '50%'], ['Save', 'When you rest']] as const };
  const body = (over: Partial<Extract<WideModel['body'], { kind: 'breather' }>> = {}): WideModel['body'] => ({ kind: 'breather', party: [chip('Abra', 40, '+50% HP')], down: [], note: 'Nobody is down.', room, ...over });

  it('nobody down: the party with its heal notes, the note, the room facts and one Rest button', () => {
    const html = wideView(ctx, { ...base(), body: body() });
    for (const bit of ['Abra', '+50% HP', 'Bring one back', 'Nobody is down.', 'The quiet room', 'Everyone still standing heals.', 'Heal', '50%', 'Save', 'When you rest', 'Rest']) expect(html).toContain(bit);
    expect(picks(html)).toBe(1);
  });
  it('one down: its dark picture and one wide Revive button', () => {
    const html = wideView(ctx, { ...base({ options: [opt('Revive Pikachu')] }), body: body({ down: [{ file: 'pokemon/pikachu.png', name: 'Pikachu', sub: 'Fainted · Lv 12' }] }) });
    for (const bit of ['Pikachu', 'Fainted · Lv 12', 'Revive Pikachu']) expect(html).toContain(bit);
    expect(html).not.toContain('Nobody is down.');
    expect(picks(html)).toBe(1);
  });
  it('several down: a small button beside each', () => {
    const down = [{ file: null, name: 'Pikachu', sub: 'Fainted · Lv 12' }, { file: null, name: 'Gengar', sub: 'Fainted · Lv 30' }];
    const html = wideView(ctx, { ...base({ options: [opt('Revive Pikachu'), opt('Revive Gengar')], index: 1 }), body: body({ down }) });
    expect(picks(html)).toBe(2);
    expect(count(html, 'height:34px')).toBe(2);
    expect(html.indexOf('Revive Gengar')).toBeGreaterThan(html.indexOf('Fainted · Lv 30'));
  });
  it('a small party keeps its chips narrow; a full one lets them fill the row', () => {
    expect(wideView(ctx, { ...base(), body: body() })).toContain('max-width:220px');
    const six = wideView(ctx, { ...base(), body: body({ party: ['A', 'B', 'C', 'D', 'E', 'F'].map((n) => chip(n)) }) });
    expect(count(six, 'max-width:400px')).toBe(6);
  });
  it('a Pokémon with no note shows a dash; with the notes off there is no note line', () => {
    expect(wideView(ctx, { ...base(), body: body({ party: [chip('Abra', 0, '')] }) })).toContain('—');
    expect(wideView(ctx, { ...base(), body: { kind: 'convoy', caption: '', legs: [], party: [chip('Abra', 0, '')] } })).not.toContain('—');
  });
});

describe('Blackout', () => {
  const anchor = (name: string, state: string, fallen: boolean, option: number | null, dark = true) => ({ name, art: { file: 'trainer/worker', atlas: true }, dark, state, fallen, option });
  const model = (index = 0): WideModel => ({
    ...base({ title: 'The Streets', options: [opt('Petrel at the cordon'), opt('Sabrina at Silph', 'She waits', true)], index }),
    body: { kind: 'blackout', anchors: [anchor('Anchor: Proton', 'Fallen', true, null), anchor('Anchor: Petrel', 'Standing · the cordon', false, 0), anchor('Oracle Sabrina', 'Standing · waits for the others', false, 1, false)], seal: { title: 'The violet Seal', count: 'Anchors fallen 1 / 2', text: 'No switching on the first turn.' } },
  });

  it('a card for every anchor, the Seal and its count; only standing anchors can be picked', () => {
    const html = wideView(ctx, model());
    for (const bit of ['Anchor: Proton', 'Fallen', 'Anchor: Petrel', 'Standing · the cordon', 'Oracle Sabrina', 'Standing · waits for the others', 'The violet Seal', 'Anchors fallen 1 / 2', 'No switching on the first turn.']) expect(html).toContain(bit);
    expect(picks(html)).toBe(2);
  });
  it('the fallen anchor is dimmed, the one under the cursor is lit, nameless guards are dark shapes', () => {
    const html = wideView(ctx, model());
    expect(count(html, 'dim')).toBe(1);
    expect(count(html, ' sel"')).toBe(1);
    expect(count(html, 'class="sil"')).toBe(2);
    expect(wideView(ctx, model(1)).indexOf(' sel"')).toBeGreaterThan(html.indexOf(' sel"'));
  });
  it('a choice with no anchor (the way on, once the streets are open) gets a button under the Seal', () => {
    const m = model();
    const html = wideView(ctx, { ...m, options: [opt('Continue')], body: { ...m.body, anchors: [anchor('Anchor: Proton', 'Fallen', true, null)] } as WideModel['body'] });
    expect(picks(html)).toBe(1);
    expect(html.indexOf('Continue')).toBeGreaterThan(html.indexOf('The violet Seal'));
  });
});

describe('Convoy', () => {
  const legs = [{ name: 'Rocket Escort', note: 'Cleared', state: 'done' as const }, { name: 'Captain Rudd', note: 'Now', state: 'now' as const }, { name: 'LEDGER', note: 'Ahead', state: 'ahead' as const }];
  it('the road, a truck per leg in its colour, the party and the fight button', () => {
    const html = wideView(ctx, { ...base({ title: 'The Long Drive', options: [opt('Fight Captain Rudd')] }), body: { kind: 'convoy', caption: 'Leg 2 of 3.', legs, party: [chip('Sobble', 80)] } });
    for (const bit of ['Rocket Escort', 'Cleared', 'Captain Rudd', 'Now', 'LEDGER', 'Ahead', 'Leg 2 of 3.', 'Sobble', 'Fight Captain Rudd']) expect(html).toContain(bit);
    expect(count(html, 'border-radius:6px 16px 4px 4px')).toBe(3);
    expect(count(html, 'background:#3fae5a;box-shadow')).toBe(1);
    expect(count(html, 'background:var(--acc);box-shadow')).toBe(1);
    expect(picks(html)).toBe(1);
  });
});

describe('Front', () => {
  const lane = (name: string, won: boolean, youHp: number) => ({ name, sub: 'Giovanni · M2', foe: 'pokemon/mewtwo.png', foeHp: won ? 0 : 100, you: 'pokemon/back/abra.png', youHp, won });
  it('a window per lane with its leader; a won lane is tagged', () => {
    const html = wideView(ctx, { ...base({ title: 'The Rainbow Door', options: [opt('Continue')] }), body: { kind: 'front', lanes: [lane('Lane 1', false, 60), lane('Lane 2', true, 100), lane('Lane 3', false, 0)] } });
    for (const bit of ['Lane 1', 'Lane 2', 'Lane 3', 'Giovanni · M2']) expect(html).toContain(bit);
    expect(count(html, 'Lane won')).toBe(1);
    expect(picks(html)).toBe(1);
  });
  it('a lane with nobody of yours keeps its place empty', () => {
    const html = wideView(ctx, { ...base({ options: [] }), body: { kind: 'front', lanes: [{ name: 'Lane 1', sub: '', foe: null, foeHp: 100, you: null, youHp: 0, won: false }] } });
    expect(count(html, '<i style="height:80px"></i>')).toBe(2);
  });
});

describe('Debate', () => {
  const who = { art: null, name: 'Harrow', sub: 'Exchange 2 of 3 · Evidence 1/6', won: 1, of: 3, score: 'you lead 1–0' };
  const args = [opt('The deletion log', 'Evidence'), opt('Ask how many filed a report.', 'Reasoning'), opt('Say they deserved it.', 'Reasoning')];
  const model = (options: WideOption[], next: { tag: string; text: string } | null): WideModel => ({ ...base({ title: 'The Assembly', options }), body: { kind: 'debate', who, claim: { tag: 'The claim', text: '"Team Star extorted travellers."' }, next } });

  it('the opponent with the score, the claim, every argument with its kind, and what comes next', () => {
    const html = wideView(ctx, model(args, { tag: 'The rebuttal', text: 'Appears after your argument.' }));
    for (const bit of ['Harrow', 'Exchange 2 of 3 · Evidence 1/6', 'you lead 1–0', 'The claim', 'Team Star extorted travellers.', 'The deletion log', 'Evidence', 'Reasoning', 'The rebuttal', 'Appears after your argument.']) expect(html).toContain(bit);
    expect(picks(html)).toBe(3);
    expect(count(html, 'background:var(--acc)')).toBe(1);
    expect(count(html, 'border-radius:50%')).toBe(3);
  });
  it('more than four arguments: shorter buttons, and the "what comes next" window makes room', () => {
    const many = [...args, opt('A fourth'), opt('A fifth')];
    const html = wideView(ctx, model(many, { tag: 'The rebuttal', text: 'Appears after your argument.' }));
    expect(picks(html)).toBe(5);
    expect(count(html, 'height:32px')).toBe(5);
    expect(html).not.toContain('Appears after your argument.');
  });
});

describe('Colossus plate', () => {
  const model = (plate: { title: string; rows: (readonly [string, number])[]; note: string }): WideModel => ({ ...base({ title: 'XD002 · The Roof', options: [opt('Face M2')] }), body: { kind: 'plate', mon: 'pokemon/mewtwo.png', name: 'M2', plate, lines: ['This is a raid.'] } });
  it('the Apex, the briefing, and the Blueprint with a bar per shield', () => {
    const html = wideView(ctx, model({ title: 'Blueprint', rows: [['Shield at 75%', 75], ['Shield at 50%', 50], ['Shield at 25%', 25]], note: 'Ten turns.' }));
    for (const bit of ['M2', 'This is a raid.', 'Blueprint', 'Shield at 75%', 'Shield at 50%', 'Shield at 25%', 'Ten turns.', 'Face M2']) expect(html).toContain(bit);
    expect(picks(html)).toBe(1);
  });
  it('no shields to show: no Blueprint, and the briefing takes its room', () => {
    const html = wideView(ctx, model({ title: 'XD001', rows: [], note: '' }));
    expect(html).not.toContain('#12305a');
    expect(html).toContain('right:24px;top:76px;display:flex;flex-direction:column;gap:8px');
  });
});

describe('wide page header during an Extended Cut climax', () => {
  const plain = { ...base(), body: { kind: 'plain' as const, lines: ['One.'] } };
  it('offers the phase list as a key hint that can also be clicked', () => {
    const html = wideView(ctx, plain, true);
    expect(html).toContain('data-act="phases"');
    expect(html).toContain('<kbd>P</kbd>phases');
    expect(html).toContain('<kbd>Enter</kbd>choose');
  });
  it('has no such hint outside the climax', () => {
    for (const html of [wideView(ctx, plain), wideView(ctx, plain, false)]) {
      expect(html).not.toContain('data-act="phases"');
      expect(html).not.toContain('phases');
    }
  });
});
