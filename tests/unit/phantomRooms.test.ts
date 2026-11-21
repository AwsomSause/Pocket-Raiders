import { describe, expect, it } from 'vitest';
import { joinGroup, joinKind } from '../../src/core/presentation/joins';
import { PHANTOM_VERSIONS } from '../../src/core/presentation/phantom';
import { pageOf } from '../../src/ui/phantom/kit';
import { phEvolve } from '../../src/ui/phantom/screens/battle';
import { phWide } from '../../src/ui/phantom/screens/formats';
import { phGame, phJigsaw, phMarket } from '../../src/ui/phantom/screens/games';
import { phPark } from '../../src/ui/phantom/screens/park';
import { phLoading, phMemory, phTree } from '../../src/ui/phantom/screens/rooms';
import type { JigsawModel } from '../../src/ui/redux/screens/jigsaw';
import type { GameModel } from '../../src/ui/redux/screens/minigame';
import type { ParkModel } from '../../src/ui/redux/screens/safari';
import type { SpiritMarketModel } from '../../src/ui/redux/screens/spiritMarket';
import type { TreeModel } from '../../src/ui/redux/screens/tree';
import type { WideModel } from '../../src/ui/redux/screens/wide';

// Phantom UI, part 5: the pages for the screens the mock-ups had no page for. Each is a pure drawing of the New
// look's model, so these check the words, the handlers and the edges without a browser.

const ph = PHANTOM_VERSIONS[0]!;
const count = (html: string, re: RegExp): number => (html.match(re) ?? []).length;

describe('Phantom page changes know the new pages', () => {
  it('each new page is in a group, so it sweeps inside its group and turns into another', () => {
    for (const id of ['rescue', 'siege', 'counterpick', 'wide', 'game', 'jigsaw', 'market', 'park']) expect(joinGroup(id), id).toBe('run');
    for (const id of ['tree', 'counter', 'memory']) expect(joinGroup(id), id).toBe('town');
    expect(joinGroup('loading')).toBe('start');
    expect(joinKind('map', 'game')).toBe('sweep');
    expect(joinKind('dock', 'tree')).toBe('sweep');
    expect(joinKind('map', 'tree')).toBe('page');
    expect(joinKind('loading', 'title')).toBe('sweep');
  });
});

describe('the Phantom Research Tree', () => {
  const tree = (over: Partial<TreeModel> = {}): TreeModel => ({
    title: 'Research Tree', chips: ['3 Research Points'], cols: 2, index: 1, text: 'Pick a node.',
    rows: [{ name: 'Field', cells: [{ label: 'Scout', state: 'owned' }, { label: 'Tracker', state: 'open' }] }, { name: 'Lab', cells: [{ label: 'Notes', state: 'locked' }] }],
    card: { name: 'Tracker', line: 'See one more stop ahead.', facts: [['Cost', '2 RP']], button: 'Unlock', ready: true },
    ...over,
  });

  it('draws a node for every cell, pads a short branch, lights the cursor and puts Unlock on the card', () => {
    const html = phTree(ph, tree());
    expect(pageOf(html)).toBe('tree');
    expect(count(html, /class="pn ph-res-n /g)).toBe(3);
    expect(count(html, /class="ph-res-gap"/g)).toBe(1);
    expect(html).toContain('class="pn ph-res-n open lt on"');
    expect(html).toContain('data-act="pick" data-arg="1" data-over="over"');
    expect(html).toMatch(/<div class="blade on" [^>]*data-act="pick" data-arg="1">Unlock<\/div>/);
  });

  it('a node that cannot be bought yet has a dimmed blade, and names are escaped', () => {
    const html = phTree(ph, tree({ card: { name: 'A<b>', line: 'x & y', facts: [], button: 'Locked', ready: false } }));
    expect(html).toMatch(/<div class="blade on off"/);
    expect(html).toContain('A&lt;b&gt;');
    expect(html).toContain('x &amp; y');
  });
});

describe('the Phantom mini-game page', () => {
  const game = (over: Partial<GameModel> = {}): GameModel => ({
    title: 'Pokémon Memory', hud: ['Moves left 14', 'Pairs: 0/6', 'No match.'], best: 'None yet', prompt: 'Flip two tiles to find a pair.', medal: null, art: null, party: [],
    cols: 4, cells: Array.from({ length: 12 }, () => ({ label: '?', detail: '', off: false })), index: 5, hints: [['Enter', 'choose'], ['Esc', 'forfeit']],
    ...over,
  });

  it('shows the score tiles (a tile with only a word shows the word), the prompt and one tile per choice', () => {
    const html = phGame(ph, game());
    expect(pageOf(html)).toBe('game');
    expect(html).toContain('<small>Moves left</small>');
    expect(html).toContain('<small>Pairs</small>');
    expect(html).toContain('<small>Best</small>');
    expect(html).not.toContain('<small>No match.</small>');
    expect(html).toMatch(/<div class="pn ph-mg-st"><b [^>]*>No match\.<\/b><\/div>/);
    expect(html).toContain('Flip two tiles to find a pair.');
    expect(count(html, /data-act="pick"/g)).toBe(12);
    expect(count(html, /ph-mg-c lt on/g)).toBe(1);
    expect(html).toContain('data-key="c5" data-act="pick" data-arg="5" data-over="over"');
  });

  it('a game that answers the press itself gets press marks instead of click handlers', () => {
    const html = phGame(ph, game({ press: true, cells: [{ label: '←', detail: '', off: false }, { label: '→', detail: '', off: false }], cols: 2, index: 0 }));
    expect(count(html, /data-press="/g)).toBe(2);
    expect(html).not.toContain('data-act="pick"');
  });

  it('with no choices and no party it still draws, and the medal shows once the game is over', () => {
    const html = phGame(ph, game({ cells: [], hud: [], best: null, medal: 'gold', prompt: 'A <b>bold</b> end.' }));
    expect(html).not.toContain('data-act="pick"');
    expect(html).toContain('class="ph-mg-medal gold"');
    expect(html).toContain('A &lt;b&gt;bold&lt;/b&gt; end.');
  });
});

describe('the Phantom jigsaw and Spirit Market pages', () => {
  const jig = (over: Partial<JigsawModel> = {}): JigsawModel => ({
    title: 'Fossil Restoration', hud: ['Pieces: 0/4', 'Forced: 0', 'In hand: none'], prompt: 'Pick up a piece from the tray first.', cols: 2, rows: 2,
    tray: [2, 0, 3, 1], placed: [false, false, false, false], held: -1, index: 0, file: null, skull: 1, outcome: null, hints: [['Enter', 'pick up']],
    ...over,
  });

  it('keeps the game’s own board with a place to press for every sandbox and tray place', () => {
    const html = phJigsaw(ph, jig());
    expect(pageOf(html)).toBe('jigsaw');
    expect(count(html, /data-cell="/g)).toBe(8);
    expect(html).toContain('The sandbox');
    expect(html).toContain('Pick up a piece from the tray first.');
    expect(html).not.toContain('>Done<');
  });

  it('when the last piece sits, the result is read and Done closes it', () => {
    const html = phJigsaw(ph, jig({ placed: [true, true, true, true], outcome: { lines: ['The skull is *whole*.'], medal: 'gold' } }));
    expect(html).toContain('The skull is <i>whole</i>.');
    expect(html).toMatch(/<div class="blade on" data-act="pick" data-arg="0">Done<\/div>/);
  });

  const market = (over: Partial<SpiritMarketModel> = {}): SpiritMarketModel => ({
    title: 'The Spirit Market', lanterns: 6, max: 6, bell: false, at: 'lanes', gate: null, prompt: 'Paper lanterns, burning low.',
    stalls: [{ id: 'banette', name: 'The Masked Banette', trade: 'A move for a move.', shut: '', used: 0, file: null }, { id: 'mismagius', name: 'The Mismagius', trade: 'A nickname.', shut: 'None of your Pokémon has a nickname.', used: 0, file: null }],
    cells: [{ label: 'The Masked Banette', detail: 'A move for a move.', off: false }, { label: 'The Mismagius', detail: 'None of your Pokémon has a nickname.', off: true }, { label: 'The gate', detail: 'Leave.', off: false }],
    cols: 1, index: 0, outcome: null, hints: [['Enter', 'go to the stall']],
    ...over,
  });

  it('in the lanes the stalls themselves are pressed (a shut one is not), and the lit stall is named under them', () => {
    const html = phMarket(ph, market());
    expect(pageOf(html)).toBe('market');
    expect(html).toContain('data-lanterns="6"');
    expect(count(html, /data-act="pick"/g)).toBe(2); // the open stall and the gate
    expect(html).toContain('<b>The Masked Banette</b> A move for a move.');
  });

  it('at a stall the answers are tiles, a closed one takes no click, and the end shows what each trade did', () => {
    const at = phMarket(ph, market({ at: 'banette', cells: [{ label: 'Curse', detail: 'Ghost.', off: false }, { label: 'Hex', detail: '', off: true }], cols: 1, index: 0 }));
    expect(count(at, /class="pn ph-mg-c sm/g)).toBe(2);
    expect(count(at, /ph-mg-c sm[^>]*data-act="pick"/g)).toBe(1);
    const end = phMarket(ph, market({ lanterns: 0, at: 'dark', cells: [], outcome: { lines: ['The lanterns go out.'], log: ['Banette: Curse for Tackle.'] } }));
    expect(end).toContain('The lanterns go out.');
    expect(end).toContain('Banette: Curse for Tackle.');
    expect(end).toContain('>Done<');
  });
});

describe('the Phantom walkable zone page', () => {
  const park = (over: Partial<ParkModel> = {}): ParkModel => ({
    title: 'Safari Land', look: 'park', area: 'The Gatehouse Plain', areaIndex: 0, rows: ['TTT', 'G.,', 'TTT'], player: { x: 1, y: 1, file: null, size: 64, row: 0 }, sprites: [],
    dark: false, tag: null, stats: [['Steps', 500], ['Safari Balls', 30]], meter: { label: 'Quiet', value: 3, max: 10, word: 'They bolt', tone: 'lo' },
    note: { sheet: null, who: 'Warden', text: 'Watch.' }, msg: '', prompt: 'The grass is long.', walking: true, running: false,
    pad: { third: ['Wait', 'wait'], more: [{ label: 'Use the binoculars', detail: '5 steps', arg: 'scope' }], help: 'One tile is one step.' },
    cells: [], index: 0, picture: null, step: null, hints: [['Arrows', 'walk']],
    ...over,
  });

  it('while walking: the field takes a click on every tile, the pad has its six keys and the zone’s own buttons', () => {
    const html = phPark(ph, park());
    expect(pageOf(html)).toBe('park');
    expect(count(html, /data-act="tile"/g)).toBe(9);
    for (const a of ['data-act="run"', 'data-act="go" data-arg="up"', 'data-act="go" data-arg="left"', 'data-act="go" data-arg="down"', 'data-act="go" data-arg="right"', 'data-act="do" data-arg="wait"', 'data-act="do" data-arg="scope"']) expect(html, a).toContain(a);
    expect(count(html, /class="pk-pip lo"/g)).toBe(3);
    expect(count(html, /class="pk-pip"/g)).toBe(7);
    // The title already names the zone, so the small word over it does not say it again.
    expect(html).toContain('<small>Mini-game</small>Safari Land');
  });

  it('while answering: the choices replace the pad and the field takes no clicks', () => {
    const html = phPark(ph, park({ walking: false, meter: null, cells: [{ id: 'a', label: 'Throw a Ball', detail: 'One Ball.', off: false }, { id: 'b', label: 'Leave it', detail: '', off: true }], index: 0, look: 'savanna', title: 'The Deep Savanna Camp' }));
    expect(html).not.toContain('data-act="tile"');
    expect(html).not.toContain('data-act="run"');
    expect(count(html, /data-act="pick"/g)).toBe(2);
    expect(html).toContain('· Throw a Ball: One Ball.');
    expect(html).toContain('<small>The Deep Savanna</small>');
  });
});

describe('the Phantom wide pages', () => {
  const base = { title: 'The Long Drive', art: null, shade: '', index: 0, text: 'In the dark.', options: [{ label: 'Fight the Tunnel', sub: '', locked: false }] };
  const chip = { name: 'Snivy', file: null, hp: 100, note: '+50% HP' };
  const bodies: WideModel['body'][] = [
    { kind: 'breather', party: [chip], down: [], note: 'Nobody is down.', room: { title: 'The quiet room', text: 'Rest.', facts: [['Heal', '50%']] } },
    { kind: 'blackout', anchors: [{ name: 'Anchor', art: null, dark: true, state: 'Standing', fallen: false, option: 0 }], seal: { title: 'The violet Seal', count: 'Anchors fallen 0 / 2', text: '' } },
    { kind: 'convoy', caption: 'Three legs.', legs: [{ name: 'The Pass', note: 'Cleared', state: 'done' }, { name: 'The Tunnel', note: 'Now', state: 'now' }], party: [chip] },
    { kind: 'front', lanes: [{ name: 'Lane 1', sub: 'Giovanni', foe: null, foeHp: 0, you: null, youHp: 80, won: true }] },
    { kind: 'debate', who: { art: null, name: 'Harrow', sub: 'Exchange 1 of 3', won: 1, of: 3, score: 'you lead 1–0' }, claim: { tag: 'The claim', text: '"No record."' }, next: { tag: 'The rebuttal', text: 'Later.' } },
    { kind: 'plate', mon: null, name: 'M2 in armor', plate: { title: 'Blueprint', rows: [['Shield at 75%', 75]], note: 'Ten turns.' }, lines: ['This is a raid.'] },
    { kind: 'plain', lines: ['A quiet card.'] },
  ];

  it('every kind is one page with its title, its text and a choice for each option', () => {
    for (const body of bodies) {
      const html = phWide(ph, { ...base, body });
      expect(pageOf(html), body.kind).toBe('wide');
      expect(html, body.kind).toContain('The Long Drive');
      expect(html, body.kind).toContain('In the dark.');
      expect(count(html, /data-act="pick" data-arg="0" data-over="over"/g), body.kind).toBe(1);
      expect(html, body.kind).toContain(`class="ph-wd ${body.kind}"`);
    }
  });

  it('a closed choice is dimmed, a fallen anchor takes no click, and the phase list key shows only in a longer climax', () => {
    const locked = phWide(ph, { ...base, options: [{ label: 'Wait', sub: 'Not yet', locked: true }], body: bodies[6]! });
    expect(locked).toContain('class="pn ph-wd-o lt on off"');
    expect(locked).toContain('<small>Not yet</small>');
    const fallen = phWide(ph, { ...base, options: [], body: { kind: 'blackout', anchors: [{ name: 'Anchor', art: null, dark: true, state: 'Fallen', fallen: true, option: null }], seal: { title: 'Seal', count: '1 / 2', text: 'It holds.' } } });
    expect(fallen).toContain('class="pn ph-wd-card off"');
    expect(fallen).not.toContain('data-act="pick"');
    expect(phWide(ph, { ...base, body: bodies[6]! })).not.toContain('data-act="phases"');
    expect(phWide(ph, { ...base, body: bodies[6]! }, true)).toContain('data-act="phases"');
  });

  it('with no options, no text and odd words it still draws, escaped', () => {
    const html = phWide(ph, { title: 'A<b>', art: null, shade: '', index: 0, text: '', options: [], body: { kind: 'plain', lines: ['x & <y>'] } });
    expect(html).toContain('A&lt;b&gt;');
    expect(html).toContain('x &amp; &lt;y&gt;');
    expect(html).not.toContain('ph-wd-say');
    expect(html).not.toContain('data-act="pick"');
  });
});

describe('the Phantom loading screen, memory entry and evolution scene', () => {
  it('the loading bar is clamped to 0–100% and the splash takes a click anywhere', () => {
    expect(phLoading(ph, { title: 'Loading the region…', progress: 0.256, note: 'Tip: rest.', splash: null })).toContain('<b class="ph-ld-pct">26%</b>');
    expect(phLoading(ph, { title: 'Loading', progress: 7, note: '', splash: null })).toContain('aria-valuenow="100"');
    expect(phLoading(ph, { title: 'Loading', progress: -1, note: '', splash: null })).toContain('<i style="width:0%"></i>');
    const plain = phLoading(ph, { title: 'Loading', progress: 0.5, note: '', splash: null });
    expect(pageOf(plain)).toBe('loading');
    expect(plain).not.toContain('data-act="next"');
    expect(phLoading(ph, { title: 'Beta is here', progress: 1, note: 'New things.', splash: 'splash/update.png' })).toContain('data-act="next"');
  });

  it('a memory entry shows its title and lines (an empty line is a gap) and closes on a click', () => {
    const html = phMemory(ph, 'Run 12 <Kanto>', ['Won at the League.', '', 'Lost nobody.']);
    expect(pageOf(html)).toBe('memory');
    expect(html).toContain('Run 12 &lt;Kanto&gt;');
    expect(count(html, /<p>/g)).toBe(2);
    expect(count(html, /<p class="gap">/g)).toBe(1);
    expect(count(html, /data-act="close"/g)).toBeGreaterThanOrEqual(2);
  });

  it('the evolution scene’s page says Evolved only once the new form is out, and moves on at a click', () => {
    const before = phEvolve({ from: null, to: null, done: false, sil: false, tap: true }, 'What? Pidove is evolving!');
    expect(pageOf(before)).toBe('evolve');
    expect(before).toContain('What? Pidove is evolving!');
    expect(before).not.toContain('EVOLVED!');
    expect(before).toContain('data-act="next"');
    const after = phEvolve({ from: null, to: null, done: true, tap: true }, '');
    expect(after).toContain('aria-label="EVOLVED!"');
    // The battle's own evolve page (no scene behind it) takes no click of its own.
    expect(phEvolve({ from: null, to: null, done: true }, '')).not.toContain('data-act="next"');
  });

  it('once out, the evolve page is the mock-up\'s: cut-out EVOLVED!, the old name, the gains card and the names in bold', () => {
    const gain = { level: 36, types: ['fire', 'flying'], fresh: ['flying'], stats: [['HP', 12], ['Attack', 9], ['Speed', -1]] as const };
    const html = phEvolve({ from: 'pokemon/5', to: 'pokemon/6', done: true, tap: true, names: { from: 'Charmeleon', to: 'Charizard' }, gain }, 'Your Charmeleon evolved into Charizard!');
    expect(html).toContain('class="ev-t"><span class="rs');
    expect(html).toContain('<span class="lab">Charmeleon</span>');
    expect(html).toContain('Charizard · Lv.36');
    expect(html).toContain('<em>New type</em>');
    expect(html).toMatch(/<dt>HP<\/dt><dd style="--i:0">\+12<\/dd>/);
    expect(html).toContain('<dd style="--i:2">-1</dd>');
    expect(html).toContain('Your <b>Charmeleon</b> evolved into <b>Charizard</b>!');
    expect(html).toContain('class="cine"');
    // One thing moves it on (the whole page), so a click never lands on two.
    expect(html.split('data-act="next"').length - 1).toBe(1);
    // No new type, no mark; no gains (a foe), no card.
    expect(phEvolve({ from: null, to: null, done: true, names: { from: 'A', to: 'B' }, gain: { ...gain, fresh: [] } }, '')).not.toContain('New type');
    expect(phEvolve({ from: null, to: null, done: true, names: { from: 'A', to: 'B' }, gain: null }, '')).not.toContain('ev-up');
    // The stop key shows only while it glows, and only when it can still be stopped.
    expect(phEvolve({ from: null, to: null, done: false, tap: true, stop: true }, 'What?')).toContain('Stops it while it glows');
    expect(phEvolve({ from: null, to: null, done: false, tap: true }, 'What?')).not.toContain('Stops it');
    expect(phEvolve({ from: null, to: null, done: true, tap: true, stop: true }, '')).not.toContain('Stops it');
    // Names are escaped like the rest of the words.
    const odd = phEvolve({ from: null, to: null, done: true, names: { from: '<i>', to: 'B' } }, 'x <i> y');
    expect(odd).not.toContain('x <i>');
    expect(odd).toContain('x <b>&lt;i&gt;</b> y');
  });
});
