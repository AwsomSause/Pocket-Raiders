// DOMINION redesign R1 (pass 50 of plans/evil-mode-rework/redesign-50): the Guide group. How much help (mockup `tut`),
// the Lesson Book (`lessons`), Rotom's X-ray over the HQ (`xray`), the Style sheet (`style`), the Motion sheet
// (`motion`) and How pages connect (`board`, the Boss's board). Display only; the scene and its controllers keep the
// cursors and do the acts.

import { act } from '../../../kit';
import { bg, esc, foot, keys, map, page, pn, SP, st, top, type R5Key, type R5Run } from './kit';

// ---------- How much help? (`tut`) ----------

export interface R5HelpOption { id: string; label: string; line: string; tag?: string }

const HELP_ICON: Record<string, string> = { full: 'p-rotom', tips: 'g-journal', off: 'g-dark-gem' };
const HELP_DET: Record<string, readonly string[]> = {
  full: ['Rotom pops up for each new idea, once.', 'You can replay any lesson from the Boss Menu.'],
  tips: ['One line the first time each page opens.', 'Nothing blocks you; the Lesson Book keeps every lesson.'],
  off: ['No help at all.', 'Lessons stay in the Lesson Book if you want them.'],
};

export function r5Help(opts: readonly R5HelpOption[], at: number, run: R5Run): string {
  const rows = map(opts, (o, i) => `<button class="row${i === at ? ' on' : ''}" ${act('tutHelp', i)} data-testid="dom-tut-help-${esc(o.id)}" ${st(i)}>${SP(HELP_ICON[o.id] ?? 'g-journal', o.id === 'full' ? 63 : 30, 'ico')}<span class="row-t"><b>${esc(o.label)}</b><em>${esc(o.line)}</em></span>${o.tag ? `<i class="tag">${esc(o.tag)}</i>` : ''}</button>`);
  const o = opts[at] ?? opts[0]!;
  const det = `<div class="plinth">${SP(HELP_ICON[o.id] ?? 'g-journal', 110, 'dspr')}</div><b class="det-t">${esc(o.label)}</b>${map(HELP_DET[o.id] ?? [], (l) => `<p>${esc(l)}</p>`)}<p>Change this later in Settings, Dominion.</p>`
    + `<button class="cta on" ${act('tutHelp', at)} data-testid="dom-tut-go">${o.id === 'off' ? 'Straight to the setup' : 'Start with Rotom'}</button>`;
  return page({ id: 'tut', g: 'Guide', kind: 'list', body: bg('hq', 'Guide', run) + top('Guide', { title: 'How much help?', id: 'tut' }, run)
    + `\n  <section class="pn l-main" data-m="panel" data-testid="dom-tut-help"><h3><i>Rotom: “First time running a crime empire? Bzzt!”</i></h3>${rows}</section>`
    + `\n  <section class="pn l-det" data-m="det">${det}</section>\n  `
    + keys([['Enter', 'Choose'], ['Esc', 'Back']], 'Guide', run) });
}

// ---------- the Lesson Book (`lessons`) ----------

export interface R5LessonsModel {
  lessons: readonly { id: string; name: string; seen: boolean }[];
  at: number;
  /** The tutorial setting (Full, Tips only, Off) and its three choices. */
  mode: string;
  modes: readonly (readonly [string, string])[];
  /** The X-ray needs a run to draw the HQ under it. */
  xray: boolean;
}

export function r5Lessons(m: R5LessonsModel, run: R5Run): string {
  const cells = map(m.lessons, (l, i) => `<button class="lb${l.seen ? ' seen' : ''}${i === m.at ? ' on' : ''}" ${act('tutReplay', i)} data-over="tutReplayOver" data-testid="dom-tut-lesson-${esc(l.id)}" style="--d:${i * 35}ms"><i>${i + 1}</i><b>${esc(l.name)}</b><em>${l.seen ? '✓ seen' : 'Not yet'}</em></button>`);
  const seg = map(m.modes, ([id, label]) => `<span class="${id === m.mode ? 'on' : ''}" ${act('tutMode', id)} data-testid="dom-tut-mode-${esc(id)}">${esc(label)}</span>`);
  const cur = m.lessons[m.at];
  const ks: R5Key[] = [['←→↑↓', 'lesson'], ['Enter', 'replay'], ['Esc', 'back']];
  const sheets: [string, string, string, string][] = [...(m.xray ? [['I', 'X-ray', 'guideXray', 'dom-guide-xray'] as [string, string, string, string]] : []), ['K', 'Style sheet', 'guideStyle', 'dom-guide-style'], ['M', 'Motion sheet', 'guideMotion', 'dom-guide-motion']];
  const more = map(sheets, ([k, l, a, tid]) => `<span ${act(a)} data-testid="${tid}"><kbd>${k}</kbd> ${esc(l)}</span>`);
  return page({ id: 'lessons', g: 'Guide', kind: 'book21', body: bg('hq', 'Guide', run) + top('Guide', { title: 'Lesson Book', sub: `${m.lessons.length} lessons · replay any`, id: 'lessons' }, run)
    + `\n  <section class="lb21" data-m="panel" data-testid="dom-tut-replay">${cells}</section>`
    + `\n  <div class="rbk21" data-nocheck="">${SP('p-rotom', 110)}</div><div class="r5seg"><b>Tutorial</b>${seg}<b>Guide pages</b>${more}</div>\n  `
    + foot({ name: 'Rotom', k: 'p-rotom' }, '“Bzzt! Lessons never repeat. Replay any here.”', [['Back', 'guideBack'], [`Replay ${cur?.name ?? ''}`, 'tutReplay', m.at]], 'Guide', run)
    + keys(ks, 'Guide', run) });
}

// ---------- the Motion sheet (`motion`) ----------

/** Every motion on the redesigned pages, as the pass-50 sheet lists it; "Calm" is Settings › Effects & motion › Calm. */
const MOTIONS: readonly [string, string, number, string, string, string][] = [
  ['Change page', 'Any page', 0.5, '0.5 s', 'A crimson blade wipes the new page in; money, Heat, titles and panels that exist on both pages glide to their new place', 'Quick fade'],
  ['Choose', 'Every list', 0.18, '0.18 s', 'The Nova eye hops to the new row and the row juts out with a gold edge', 'Eye jumps'],
  ['Deal cards', 'Crew, Reserve, rooms', 0.05, '50 ms each', 'Cards drop in one after another with a small spin', 'All at once'],
  ['Count up', 'Odds, money, results', 0.9, '0.9 s', 'Numbers roll up to their value; the odds ring winds round', 'Shown at once'],
  ['Text', 'Every text box', 0.03, '30 ms each', 'Words type out, then a bouncing arrow waits for a key', 'Whole line'],
  ['HP change', 'Battle', 0.6, '0.6 s', 'The bar drains and a pale ghost shows what was lost', 'Instant'],
  ['Boss order', 'Do it', 0.7, '0.7 s', 'Rays spin, the order word slams in, the crew member nods', 'Still card'],
];

export function r5Motion(run: R5Run): string {
  const rows = map(MOTIONS, ([a, w, t, tl, p, c], i) => `<div class="mo-r" style="--i:${i};--d:${i * 80}ms"><b>${esc(a)}</b><em>${esc(w)}</em><span class="mo-t"><i style="--t:${t}s"></i><b>${esc(tl)}</b></span><p>${esc(p)}</p><em>${esc(c)}</em></div>`);
  return page({ id: 'motion', g: 'Guide', kind: 'motion', body: bg('hq', 'Guide', run) + top('Guide', { title: 'Motion sheet', id: 'motion' }, run)
    + `<section class="pn mo-main" data-m="panel" data-testid="r5-motion-sheet"><h3><i>Every motion in Dominion</i></h3><div class="mo-h"><span>Motion</span><span>Where</span><span>Time</span><span>What you see</span><span>Calm mode</span></div>${rows}<p class="mo-n">Nothing waits on an animation: a key press skips it, and results are decided before anything moves.</p></section>`
    + keys([['Esc', 'back', 'guideBack']], 'Guide', run) });
}

// ---------- the Style sheet (`style`) ----------

const GROUPS: readonly [string, string][] = [['HQ', '#e0294a'], ['The Day', '#d9861c'], ['Jobs', '#8e2bd1'], ['Crew', '#16938a'], ['Pokémon', '#2f9e44'], ['Opposition', '#2860c9'],
  ['Trainers', '#d4421c'], ['Gimmicks', '#e0408a'], ['Empire', '#c8971c'], ['The Chair', '#8a1030'], ['Rotom', '#e07a10'], ['Settings', '#5c6b86']];
const RULES: readonly [string, string][] = [['One thing pulses at a time', 'the most urgent'], ['Text waits for a key', 'then rewards appear'], ['Every colour has a shape', 'for colour assist'],
  ['Calm mode stops all motion', 'one switch'], ['Two steps from the HQ', 'no page is deeper'], ['Nothing is cut off', 'checked on every page']];

export function r5Style(run: R5Run): string {
  const sw = map(GROUPS, ([n, c], i) => `<span style="--c:${c};--d:${i * 40}ms"><i></i>${esc(n)}</span>`);
  const pieces = `<div class="ty50"><b>DOMINION</b><em>Display · titles and names</em><p>Body text is 15px and never smaller than 11px.</p></div>
    <div class="tb50"><b class="who">Rook</b>“The Lookout can see all of Viridian.”<i>▼</i></div>
    <div class="kc50"><span><i class="pad20 p-A">A</i><kbd>Enter</kbd>go on</span><span><i class="pad20 p-B">B</i><kbd>Esc</kbd>back</span><span class="ch">SIEGE IN 3 DAYS</span></div>`;
  const rules = map(RULES, ([b, e], i) => `<div class="ru50" style="--i:${i};--d:${i * 60}ms"><i>${i + 1}</i><b>${esc(b)}</b><em>${esc(e)}</em></div>`);
  return page({ id: 'style', g: 'Guide', kind: 'ss50', body: bg('hq', 'Guide', run) + top('Guide', { title: 'Style sheet', sub: 'The whole kit on one page', id: 'style' }, run)
    + `\n  ${pn('sc50', 'Group colours', `<div class="sg50">${sw}</div>`, 'panel')}\n  ${pn('sp50', 'Pieces', pieces, 'det')}\n  ${pn('rl50', 'Rules', rules, 'det')}\n  `
    + foot({ name: 'Rotom', k: 'p-rotom' }, '“Bzzt! Fifty passes, one look. This is the whole kit.”', [['Back', 'guideBack'], ['Motion sheet', 'guideMotion']], 'Guide', run)
    + keys([['Esc', 'back', 'guideBack']], 'Guide', run) });
}

// ---------- Rotom's X-ray (`xray`) ----------

type Part = readonly [x: number, y: number, name: string, what: string, lx: number, ly: number];
/** Two parts, as passes 35 and 45 drew them: the chrome's big pieces, then the small ones. */
export const XRAY: readonly (readonly Part[])[] = [
  [[40, 26, 'Team emblem', 'Goal ring · opens the World', 70, 100], [800, 26, 'Status pill', 'Funds, Heat, Day', 640, 110], [480, 56, 'War line', 'Your team against the rival', 470, 150],
    [170, 525, 'Start', 'The menu for everything', 150, 380], [365, 525, 'Your party', 'HP rings · opens Party', 360, 300], [800, 440, 'Choice box', '▶ on the button Enter presses', 640, 330]],
  [[52, 40, 'HQ level', 'The number on the emblem', 70, 100], [200, 46, 'Goal bar', 'Fills as the run goes well', 230, 150], [60, 56, 'Region gems', 'Lit for each region you hold', 40, 210],
    [240, 56, 'Hero’s ping', 'Where the Hero was seen', 420, 110], [900, 56, 'Rival chip', 'Days until their raid', 700, 140], [480, 488, 'Rail tabs', 'The train is the page you are on', 560, 330]],
];

export function r5Xray(hub: string, part: number, run: R5Run): string {
  const p = XRAY[part % XRAY.length]!;
  return page({ id: 'xray', g: 'Guide', kind: 'xr35', body: `<div class="rp21" data-nocheck="">${hub}</div><i class="xs35" data-nocheck=""></i>
  <svg class="xl35" viewBox="0 0 960 540" data-nocheck="">${map(p, ([x, y, , , lx, ly]) => `<path d="M${x},${y} L${lx + 90},${ly + 20}"></path><circle cx="${x}" cy="${y}" r="6"></circle>`)}</svg>
  ${map(p, ([, , n, d, lx, ly], i) => `<div class="xc35" style="left:${lx}px;top:${ly}px;--d:${i * 120}ms" data-testid="r5-xray-${i}"><b>${esc(n)}</b><em>${esc(d)}</em></div>`)}
  ${keys([['Enter', `next part (${(part % XRAY.length) + 1} of ${XRAY.length})`, 'guideXray'], ['Esc', 'close', 'guideBack']], 'Guide', run)}` });
}

// ---------- How pages connect (`board`, the Boss's board) ----------

export interface R5BoardRow { id: string; name: string; how: string; key: string; kind: string; colour: string; jump: boolean }

export function r5Board(rows: readonly R5BoardRow[], at: number, sheet: string, other: string, run: R5Run): string {
  const cells = map(rows, (r, i) => `<div class="fl50${i === at ? ' on on4' : ''}${r.jump ? '' : ' off'}" style="--c:${r.colour};--d:${i * 40}ms" ${act('navPin', i)} data-over="navPinOver" data-testid="dom-pin-${esc(r.id)}"><kbd>${esc(r.key)}</kbd><b>${esc(r.name)}</b><i>${esc(r.kind)}</i><em>${esc(r.how)}</em></div>`);
  return page({ id: 'board', g: 'Guide', kind: 'bd50', body: bg('hq', 'Guide', run) + top('Guide', { title: 'How pages connect', sub: sheet, id: 'board', icon: 'g-town-map' }, run)
    + `\n  ${pn('dr50', 'Every page is one or two steps from the HQ', `<div class="dg50">${cells}</div>`, 'panel')}\n  `
    + keys([['Tab', other, 'navFlip'], ['Enter', 'go'], ['Esc', 'back', 'navBoardClose']], 'Guide', run, { testid: 'dom-board-keys' }) });
}

/** The board's pages as pass-50 rows: the key that opens each, its group and the group's colour. */
const PIN_GROUP: Record<string, [string, string]> = {
  title: ['Start', '#e0294a'], menu: ['Menu', '#6a5a80'], settings: ['Settings', '#5c6b86'], rotom: ['Rotom', '#e07a10'], desk: ['Rotom', '#e07a10'],
  hq: ['HQ', '#e0294a'], base: ['HQ', '#e0294a'], founding: ['Start', '#e0294a'], morning: ['The Day', '#d9861c'], map: ['The Day', '#d9861c'], district: ['The Day', '#d9861c'],
  assign: ['Crew', '#16938a'], crew: ['Crew', '#16938a'], persona: ['Crew', '#16938a'], pyramid: ['Crew', '#16938a'], squads: ['Crew', '#16938a'], voices: ['Crew', '#16938a'],
  reserve: ['Pokémon', '#2f9e44'], card: ['Jobs', '#8e2bd1'], ledger: ['Empire', '#c8971c'], takeover: ['Empire', '#c8971c'], empire: ['Empire', '#c8971c'], partners: ['Empire', '#c8971c'],
  chair: ['The Chair', '#8a1030'], rival: ['Opposition', '#2860c9'], hero: ['Opposition', '#2860c9'], interrupt: ['Opposition', '#2860c9'], police: ['Opposition', '#2860c9'],
  debate: ['Opposition', '#2860c9'], spy: ['Opposition', '#2860c9'],
};
const HOW_KEY: Record<string, string> = { start: 'Title', 'from the Menu': 'Menu', 'each day': 'Day', 'Enter on a grunt': 'Enter', 'from Settings': 'Set', 'click a town': 'Map', 'pick an action': 'Card', 'control 50+': '50+', 'every evening': 'Eve', 'comes to you': '—' };

export function boardRows(pins: readonly { id: string; name: string; how: string; reach: string }[]): R5BoardRow[] {
  return pins.map((p) => {
    const g = PIN_GROUP[p.id] ?? ['HQ', '#e0294a'];
    const tab = /^tab (\d)/.exec(p.how)?.[1];
    const key = tab ?? HOW_KEY[p.how] ?? (/^(Esc|[A-Z])\b/.exec(p.how)?.[1] ?? p.how.split(' ')[0]!);
    return { id: p.id, name: p.name, how: p.how[0]!.toUpperCase() + p.how.slice(1), key, kind: p.reach === 'jump' ? g[0] : 'Comes to you', colour: g[1], jump: p.reach === 'jump' };
  });
}
