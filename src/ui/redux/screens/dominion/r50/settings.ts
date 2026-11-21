// DOMINION redesign R9 (pass 50 of plans/evil-mode-rework/redesign-50): Settings, Rotom and the Menu's own pages.
// The Settings home (mockup `set`), one page per category (`setdom`, `rotom`, `seteff`, `setsnd`, `access`, `hud`, and
// the game's own Display, Battle, Runs and Controls lists in the same layout), Save and quit (`save`), Controls
// (`controls`), Options (`options`), Calm mode (`calm`), Colour assist (`colours`), Read aloud (`readaloud`), Button feel
// (`feel`), Region skin (`skins`), Ambience (`ambience`) and the Key-Card vault (`vault`). Live data in, HTML out: the
// Boss Menu controller keeps the cursors and changes the settings.

import { esc, face, faceOf, foot, keys, map, page, pn, rep, SP, spr, st, bg, top, type R5Cta, type R5Group, type R5Key, type R5Run } from './kit';

const SR = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
const act = (name: string, arg: string | number = ''): string => `data-act="${esc(name)}" data-arg="${esc(String(arg))}"`;

// ---------- rows ----------

/** A row's control: a segmented choice, a switch, a slider (0-1), a single value (‹ X ›) or a button. */
export type R5Ctl =
  | { k: 'seg'; opts: readonly { label: string; on: boolean; lock?: boolean; testid?: string }[] }
  | { k: 'sw'; on: boolean }
  | { k: 'sld'; v: number; text: string }
  | { k: 'val'; text: string }
  | { k: 'btn'; text: string };
export interface R5Row { label: string; sub?: string; ctl: R5Ctl; lock?: boolean }

function ctl(c: R5Ctl, i: number): string {
  if (c.k === 'seg') return `<span class="seg">${map(c.opts, (o, j) => `<i class="${o.on ? 'on' : ''}"${o.lock ? ' style="opacity:.45"' : ` ${act('setPick', `${i}:${j}`)}`}${o.testid ? ` data-testid="${o.testid}"` : ''}>${esc(o.label)}${o.lock ? ' 🔒' : ''}</i>`)}</span>`;
  if (c.k === 'sw') return `<span class="sw${c.on ? ' on' : ''}" ${act('setRow', i)} data-testid="dom-set-sw-${i}"><i></i><b>${c.on ? 'On' : 'Off'}</b></span>`;
  if (c.k === 'sld') return `<span class="sld" style="--v:${Math.max(0, Math.min(1, c.v))}"><i ${act('setLeft', i)}><u></u><s></s></i><b ${act('setRight', i)}>${esc(c.text)}</b></span>`;
  if (c.k === 'btn') return `<span class="seg"><i class="on" ${act('setRow', i)}>${esc(c.text)} ›</i></span>`;
  return `<span class="seg"><i class="on"><span ${act('setLeft', i)}>‹</span> ${esc(c.text)} <span ${act('setRight', i)}>›</span></i></span>`;
}

/** The rows of a list, `per` at a time around the cursor (the rest scroll in), with their test ids. */
export function rowsHtml(rows: readonly R5Row[], sel: number, per: number): string {
  const top0 = Math.max(0, Math.min(rows.length - per, sel - Math.floor(per / 2)));
  const more = (t: string): string => `<p class="mr9" style="margin:0;text-align:center;font:800 11px/14px var(--fb);color:var(--mut)">${t}</p>`;
  return (top0 > 0 ? more('▲ more') : '') + map(rows.slice(top0, top0 + per), (r, k) => {
    const i = top0 + k;
    return `<div class="srow${i === sel ? ' on' : ''}" ${act('setAt', i)} data-testid="dom-set-row-${i}" style="--i:${k};--d:${k * 70}ms${r.lock ? ';opacity:.55' : ''}"><span class="sl"><b>${esc(r.label)}</b>${r.sub ? `<em>${esc(r.sub)}</em>` : ''}</span>${ctl(r.ctl, i)}</div>`;
  }) + (top0 + per < rows.length ? more('▼ more') : '');
}

/** The small one-line rows of the special pages (mockups' `srow` with `<i>‹ X ›</i>`). */
function lineRows(rows: readonly R5Row[], sel: number, d = 70): string {
  return map(rows, (r, i) => {
    const v = r.ctl.k === 'sw' ? (r.ctl.on ? 'On' : 'Off') : r.ctl.k === 'seg' ? (r.ctl.opts.find((o) => o.on)?.label ?? '') : r.ctl.k === 'sld' ? r.ctl.text : r.ctl.text;
    return `<div class="srow${i === sel ? ' on' : ''}" ${act('setAt', i)} data-testid="dom-set-row-${i}" ${st(i, d)}><b>${esc(r.label)}</b><i><span ${act('setLeft', i)}>‹</span> ${esc(v)} <span ${act('setRight', i)}>›</span></i></div>`;
  });
}

const KEYS_ROWS: R5Key[] = [['↑↓', 'row'], ['←→', 'change'], ['Esc', 'back']];

// ---------- the Settings home (mockup `set`, kind sethome) ----------

export interface R5Tile { id: string; name: string; icon: string; about: string }

export function r5SetHome(tiles: readonly R5Tile[], at: number, run: R5Run): string {
  const cur = tiles[at];
  const grid = map(tiles, (t, i) => `<button class="sh-t${i === at ? ' on' : ''}" ${act('setTile', i)} data-over="setTileOver" data-testid="r5-set-tile-${t.id}" ${st(i, 50)}><span class="sh-i">${spr(t.icon, 2.6)}</span><b>${esc(t.name)}</b><em>${esc(t.about)}</em></button>`);
  const line = at >= 4 ? '“Bzzt! Access and Controls work for the whole game.”' : '“Bzzt! The first four are Dominion’s own. The rest match the main game.”';
  const ctas: R5Cta[] = cur ? [[`Open ${cur.name}`, 'setTile', at, 'r5-set-open']] : [];
  return page({ id: 'set', g: 'Settings', kind: 'sethome', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: 'Settings', id: 'set', crumb: null }, run)}<span data-testid="dom-set-title" style="${SR}">Settings</span>
  <section class="sh-grid" data-m="panel" data-testid="r5-set-grid">${grid}</section>
  ${foot({ name: 'Rotom', k: 'p-rotom' }, line, ctas, 'Settings', run)}${keys([['←→↑↓', 'category'], ['Enter', 'open'], ['Esc', 'back']], 'Settings', run)}` });
}

// ---------- one category (mockups setdom, rotom, seteff, setsnd, access, hud: kind settings) ----------

export interface R5Cat { id: string; name: string; icon: string }

export interface R5SetModel {
  cats: readonly R5Cat[];
  cat: number;
  rows: readonly R5Row[];
  row: number;
  /** The Preview panel's inside (built by previewOf). */
  preview: string;
  /** The page id the mockups use (setdom, rotom, seteff, ...), for the page clock and the test id. */
  pid: string;
  notice: string | null;
}

/** The left rail as the mockups draw it: the categories from the first down to the open one (at least four, at most
 *  six, so the later ones scroll the top off), then All settings. */
function rail(m: R5SetModel): string {
  const n = Math.max(4, Math.min(6, m.cat + 1)), first = Math.max(0, m.cat + 1 - n);
  return `<nav class="s5-cat" data-m="tab" data-testid="dom-set-cats">${map(m.cats.slice(first, first + n), (c, k) => {
    const i = first + k;
    return `<button class="${i === m.cat ? 'on' : ''}" ${act('setCat', i)} data-testid="dom-set-cat-${c.id}">${c.icon ? spr(c.icon, 1) : ''}<b>${esc(c.name)}</b></button>`;
  })}<button ${act('r9go', 'set')} data-testid="dom-set-all"><b>All settings</b></button></nav>`;
}

export function r5SetPage(m: R5SetModel, run: R5Run): string {
  const cat = m.cats[m.cat]!;
  const ks: R5Key[] = [['↑↓', 'row'], ['←→', 'change'], ['Tab', 'category'], ['D', 'reset'], ['Esc', 'back']];
  return page({ id: m.pid, g: 'Settings', kind: 'set5', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: cat.name, sub: 'Settings', id: m.pid, crumb: ['Settings', 'set'] }, run)}<span data-testid="dom-set-title" style="${SR}">Settings · ${esc(cat.name)}</span>
  ${rail(m)}
  ${pn('s5-rows', '', rowsHtml(m.rows, m.row, 5), 'panel').replace('<section class="pn s5-rows"', `<section class="pn s5-rows" data-testid="dom-set-list"`)}
  ${pn('s5-prev', 'Preview', m.preview, 'det').replace('<section class="pn s5-prev"', '<section class="pn s5-prev" data-testid="dom-set-preview"')}
  ${m.notice ? `<div class="sd25" ${act('setNoticeOff')} data-testid="dom-set-notice">${esc(m.notice)}<i class="nx23">▼</i></div>` : ''}
  ${keys(ks, 'Settings', run, { testid: 'dom-set-keys' })}` });
}

/** The Preview panels (pass 5, 20, 23): what the open category's settings look like, from the player's settings. */
export const PREVIEW = {
  dom: (rules: readonly [string, string][], siren: boolean): string => `<b class="pv-t">This run</b><dl class="facts" style="margin:4px 0 8px">${map(rules, ([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`)}</dl><b class="pv-t">Heat siren</b>${siren ? '<div class="pv-siren"><i></i><i></i></div><p>At Heat 70% the siren plays and the edges beat.</p>' : '<p>Off: no siren and no beating edges.</p>'}`,
  rotom: (quote: string, about: string): string => `${SP('p-rotom', 70)}<p class="pv-q">“${esc(quote)}”</p><p>${esc(about)}</p>`,
  eff: (wipe: string): string => `<div class="pv-blade"><i></i><b>THE CARD</b></div><p>${esc(wipe)}</p>`,
  snd: (playing: string, on: boolean): string => `<div class="pv-eq"${on ? '' : ' style="opacity:.35"'}>${rep(14, (i) => `<i style="--d:${i * 70}ms"></i>`)}</div><p>${esc(on ? `Now playing: ${playing}` : 'Sound is off.')}</p>`,
  acc: (who: string, line: string, shapes: boolean): string => `<div class="pv-txt"><b>${esc(who)}</b><p>“${esc(line)}”</p></div><div class="pv-own">${map([['Your crew', '#e0294a', '▲'], ['Foothold', '#f2b632', '■'], ['Rival team', '#6a6f86', '●'], ['Nobody yet', '#3d4256', '◆']], ([n, c, sh]) => `<span style="--c:${c}"><i>${shapes ? sh : ''}</i>${esc(n)}</span>`)}</div><p>${shapes ? 'Owners and warnings get a shape as well as a colour.' : 'Colour help is off: owners are colours only.'}</p>`,
  hud: (run: R5Run, status: string, who: string, line: string): string => `<b class="pv-t">The capsule</b>${status === 'hidden' ? '<p>Hidden: Funds, Heat and Day stay off the top bar.</p>' : `<div class="pv-cap23"${status === 'chips' ? ' style="gap:6px;background:none;border:0"' : ''}><span>${esc(run.funds)}</span><span>${run.heat}%</span><span>Day ${run.day}</span></div>`}<b class="pv-t">The text box</b><div class="pv-tb23"><b>${esc(who)}</b> “${esc(line)}”<i>▼</i></div>`,
  game: (lines: readonly string[]): string => map(lines, (l, i) => `<p${i === 0 ? ' class="pv-q"' : ''}>${esc(l)}</p>`),
};

// ---------- Save and quit (mockup `save`, kind savepg) ----------

export interface R5SaveModel { boss: string; team: string; lines: readonly string[]; crew: readonly string[]; slot: number; at: number; notice: string | null }

export const SAVE_ROWS = ['Save and go to the title', 'Save and keep playing', 'Back to the Boss Menu'] as const;

export function r5Save(m: R5SaveModel, run: R5Run): string {
  return page({ id: 'save', g: 'Settings', kind: 'save', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: 'Save and quit', id: 'save', crumb: null }, run)}
  ${pn('sv-slot', `Slot ${m.slot}`, `<div class="sv-row">${m.boss}<div><b class="det-t">${esc(m.team)}</b>${map(m.lines, (l) => `<p>${esc(l)}</p>`)}</div></div><div class="h-crew">${m.crew.join('')}</div>`, 'panel')}
  ${pn('sv-ask', 'Leave the empire?', `<p>Your run is saved after every step. The crew keep working only when you come back: nothing moves while you are away.</p>${map(SAVE_ROWS, (l, i) => `<button class="row sm${i === m.at ? ' on' : ''}" ${act('saveRow', i)} data-over="saveOver" data-testid="r5-save-${i}"><b>${esc(l)}</b></button>`)}`, 'det')}
  ${m.notice ? `<div class="sd25" data-testid="r5-save-notice">${esc(m.notice)}</div>` : ''}
  ${keys([['↑↓', 'pick'], ['Enter', 'choose'], ['Esc', 'back']], 'Settings', run)}` });
}

// ---------- Controls (mockup `controls`, kind ctrl20) ----------

/** Every action the Dominion pages read, on the keyboard, a controller and touch (what the game really does). */
export const CONTROLS: readonly [string, string, string, string][] = [
  ['Choose', 'Enter', 'A', 'Tap'],
  ['Back', 'Esc', 'B', 'Tap ‹ Back'],
  ['Wheel (hold)', 'Q', 'Y', 'Tap the Q chip'],
  ['Boss Menu', 'Esc', 'B', 'Start › Rotom Phone'],
  ['Next tab', 'Tab', 'R', 'Tap a tab'],
  ['Reset a Settings tab', 'D', '−', 'Settings › D'],
];

export function r5Controls(at: number, run: R5Run): string {
  const pad = (p: string): string => `<i class="pad20 p-${p === '−' ? 'm' : p}">${p}</i>`;
  return page({ id: 'controls', g: 'Settings', kind: 'ctrl20', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: 'Controls', sub: 'Keys, pad and touch', id: 'controls', crumb: ['Settings', 'set'] }, run)}
  <div class="pad20x" data-nocheck=""><i class="dpad"></i><span class="fb"><i class="p-Y">Y</i><i class="p-X">X</i><i class="p-B">B</i><i class="p-A">A</i></span><i class="sh l">L</i><i class="sh r">R</i></div>
  ${pn('ct20', 'Every action, three ways', `<div class="ctr hd"><b>Action</b><b>Keyboard</b><b>Pad</b><b>Touch</b></div>${map(CONTROLS, ([a, k, p, t], i) => `<div class="ctr${i === at ? ' on' : ''}" ${st(i, 50)} data-testid="r5-ctrl-${i}"><b>${esc(a)}</b><span><kbd>${esc(k)}</kbd></span><span>${pad(p)}</span><em>${esc(t)}</em></div>`)}`, 'panel')}
  ${foot({ name: 'Rotom', k: 'p-rotom' }, '“Bzzt! Every key works on every Dominion page. The game’s own control settings are one step away.”', [['Control settings', 'r9go', 'setcontrols', 'r5-ctrl-settings'], ['Back', 'r9go', 'set']], 'Settings', run)}${keys([['↑↓', 'action'], ['Enter', 'control settings'], ['Esc', 'back']], 'Settings', run)}` });
}

// ---------- Options, the quick ones (mockup `options`, kind opt25) ----------

export const FRAMES: readonly [string, string, string][] = [['nova', 'Nova', '#e0294a'], ['gold', 'Gold', '#e8b23a'], ['night', 'Night', '#2860c9'], ['jade', 'Jade', '#16938a'], ['plum', 'Plum', '#8e2bd1'], ['ash', 'Ash', '#8a8296']];

export function r5Options(rows: readonly R5Row[], at: number, frame: string, who: { name: string; line: string }, run: R5Run): string {
  const fi = Math.max(0, FRAMES.findIndex(([id]) => id === frame));
  const body = map(rows, (r, i) => {
    if (r.label === 'Frame') return `<div class="or25 fr${i === at ? ' on' : ''}" ${act('setAt', i)} data-testid="dom-set-row-${i}"><b>Frame</b><span class="fp25">${map(FRAMES, ([, n, c], j) => `<i class="${j === fi ? 'on' : ''}" style="--fc:${c}" title="${n}" ${act('setPick', `${i}:${j}`)}>${j + 1}</i>`)}</span></div>`;
    const opts = r.ctl.k === 'seg' ? r.ctl.opts : [{ label: r.ctl.k === 'sw' ? (r.ctl.on ? 'On' : 'Off') : 'text' in r.ctl ? r.ctl.text : '', on: true }];
    return `<div class="or25${i === at ? ' on' : ''}" ${act('setAt', i)} data-testid="dom-set-row-${i}" ${st(i, 60)}><b>${esc(r.label)}</b><span>${map(opts, (o, j) => `<i class="${o.on ? 'on' : ''}" ${act('setPick', `${i}:${j}`)}>${esc(o.label)}</i>`)}</span></div>`;
  });
  const [, fname, fc] = FRAMES[fi]!;
  return page({ id: 'options', g: 'Settings', kind: 'opt25', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: 'Options', sub: 'The quick ones', id: 'options', crumb: ['Settings', 'set'] }, run)}
  ${pn('op25', 'Options', body, 'panel')}
  ${pn('fv25', `Frame ${fi + 1} · ${fname}`, `<div class="fx25" style="border-color:${fc}"><b>${esc(who.name)}</b><p>“${esc(who.line)}”</p><i class="nx23">▼</i></div><p class="fn25">Every Dominion window uses this frame.</p><div class="fg25">${map(FRAMES, ([, n, c], j) => `<i class="${j === fi ? 'on' : ''}" style="--fc:${c};--d:${j * 60}ms">${n}</i>`)}</div>`, 'det')}
  ${foot({ name: 'Rotom', k: 'p-rotom' }, '“Bzzt! Every other setting lives in All settings.”', [['All settings', 'r9go', 'set', 'r5-opt-all'], ['Done', 'r9go', 'close']], 'Settings', run)}${keys(KEYS_ROWS, 'Settings', run)}` });
}

// ---------- Calm mode (mockup `calm`, kind cm47) ----------

export function r5Calm(on: boolean, changes: readonly [string, string][], run: R5Run): string {
  return page({ id: 'calm', g: 'Settings', kind: 'cm47', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: 'Calm mode', sub: 'One switch for every effect', id: 'calm', crumb: ['Settings', 'set'] }, run)}
  <section class="cm47" data-m="panel"><button class="sw47${on ? ' on' : ''}" ${act('calmFlip')} data-testid="r5-calm-switch"><i class="kn"></i></button><b>CALM MODE</b><em data-testid="r5-calm-state">${on ? 'On · the game plays the same, it just stops moving around' : 'Off · every effect plays'}</em></section>
  ${pn('cl47', 'What it changes', map(changes, ([a, b], i) => `<div class="srow" ${st(i, 60)}><b>${esc(a)}</b><i>${esc(b)}</i></div>`), 'det')}
  ${foot({ name: 'Rotom', k: 'p-rotom' }, on ? '“Bzzt! Calm mode. I will stop spinning. …It is very hard.”' : '“Bzzt! Calm mode is off. Everything spins. Especially me.”', [['Back', 'r9go', 'set'], ['Done', 'r9go', 'set']], 'Settings', run)}${keys([['Enter', 'switch'], ['Esc', 'back']], 'Settings', run)}` });
}

// ---------- Colour assist (mockup `colours`, kind ca47) ----------

export function r5Colours(rows: readonly R5Row[], at: number, samples: readonly [string, string, string][], shapes: boolean, run: R5Run): string {
  const LEG: readonly [string, string, string][] = [['c-ok', '●', 'Good · held · safe'], ['c-bad', '▲', 'Danger · rivals · low HP'], ['c-warn', '◆', 'Careful · costs · risk'], ['c-info', '■', 'Hero · police · cold'], ['c-gold', '★', 'Yours · Boss · rare']];
  const sh: Record<string, string> = { 'c-ok': '●', 'c-bad': '▲', 'c-warn': '◆', 'c-info': '■', 'c-gold': '★' };
  return page({ id: 'colours', g: 'Settings', kind: 'ca47', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: 'Colour assist', sub: 'Every colour has a shape', id: 'colours', crumb: ['Settings', 'set'] }, run)}
  ${pn('cs47', 'Colours and shapes', map(LEG, ([c, s, l], i) => `<div class="cr47 ${c}" ${st(i, 70)}><i>${s}</i><b>${esc(l)}</b><span class="hp"><u></u></span></div>`), 'panel')}
  ${pn('cv47', 'Preview', `<div class="pv47">${map(samples, ([n, c, v]) => `<span><b>${esc(n)}</b><i class="${c}">${shapes ? `${sh[c] ?? ''} ` : ''}${esc(v)}</i></span>`)}</div>${lineRows(rows, at)}`, 'det')}
  ${foot({ name: 'Rotom', k: 'p-rotom' }, shapes ? '“Bzzt! Now danger is red and a triangle. Twice the warning.”' : '“Bzzt! Pick Shapes and every warning gets a shape too.”', [['Back', 'r9go', 'access'], ['Done', 'r9go', 'set']], 'Settings', run)}${keys(KEYS_ROWS, 'Settings', run)}` });
}

// ---------- Read aloud (mockup `readaloud`, kind ra47: over the HQ) ----------

export function r5ReadAloud(rows: readonly R5Row[], at: number, behind: string, who: { name: string; line: string; colour: string }, run: R5Run): string {
  const words = who.line.split(/\s+/).filter(Boolean);
  return page({ id: 'readaloud', g: 'HQ', kind: 'ra47', body: `<div class="rp21" data-nocheck="">${behind || bg('hq', 'HQ', run)}</div><i class="dm47" data-nocheck=""></i>
  <div class="rb47 ra9" data-m="box" data-testid="r5-read-box"><b class="who" style="color:${who.colour}">${esc(who.name)}</b><p>${map(words, (w, i) => `<span class="${i === 0 ? 'now' : ''}" data-w="${i}">${esc(w)}</span> `)}</p><span class="sp47">${SP('p-rotom', 44)}<i class="wv"><u></u><u></u><u></u><u></u></i></span></div>
  ${pn('ro47', 'Read aloud', lineRows(rows, at), 'det')}
  ${keys([['R', 'read again', 'readAgain', 'r5-read-again'], ['↑↓', 'option'], ['Esc', 'back']], 'HQ', run)}` });
}

// ---------- Button feel (mockup `feel`, kind fe49) ----------

export function r5Feel(rows: readonly R5Row[], at: number, cursor: string, run: R5Run): string {
  const CUR: readonly [string, string, string][] = [['arrow', '▶', 'Arrow'], ['ball', '', 'Poké Ball'], ['badge', 'N', 'N badge']];
  return page({ id: 'feel', g: 'Settings', kind: 'fe49', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: 'Button feel', sub: 'How every press answers back', id: 'feel', crumb: ['Settings', 'set'] }, run)}
  ${pn('ps49', 'Press it', `<div class="bs">${map([['', 'Rest'], ['hv', 'Pointed at'], ['dn', 'Pressed']], ([c, l], i) => `<span style="--d:${i * 120}ms"><button class="tb49 ${c}">SET SAIL</button><em>${l}</em></span>`)}</div><small>Cursor</small><div class="cu">${map(CUR, ([id, g, l], i) => `<span class="c49${id === cursor ? ' on' : ''} cv${i}" style="--d:${300 + i * 120}ms" ${act('feelCursor', id)} data-testid="r5-cursor-${id}"><i class="m"><u><i class="g">${g}</i>Jobs</u><u>Crew</u></i><em>${l}</em></span>`)}</div>`, 'panel')}
  ${pn('fo49', 'Feel', lineRows(rows, at, 60), 'det')}
  ${foot({ name: 'Rotom', k: 'p-rotom' }, '“Bzzt! Press harder, Boss. No, softer. Perfect.”', [['Back', 'r9go', 'hud'], ['Done', 'r9go', 'set']], 'Settings', run)}${keys(KEYS_ROWS, 'Settings', run)}` });
}

// ---------- Region skin (mockup `skins`, kind sk37) ----------

export interface R5SkinTile { id: string; name: string; icon: string; about: string; sky: string; open: boolean; on: boolean }

export function r5Skins(tiles: readonly R5SkinTile[], rows: readonly R5Row[], at: number, run: R5Run): string {
  const t = map(tiles, (s, i) => `<button class="sv37 sk-${s.id}${s.on ? ' on' : ''}" style="--d:${i * 110}ms${s.open ? '' : ';opacity:.5;filter:saturate(.4)'}" ${s.open ? act('skinPick', s.id) : ''} data-testid="r5-skin-${s.id}"><span class="mini"><i class="mt"><u></u><u></u></i><i class="mp"><u></u><u></u><u></u></i><i class="ms"></i></span>${spr(s.icon, 1.5, 'ic')}<b>${esc(s.name)}</b><em>${esc(s.about)}</em><small>${esc(s.open ? s.sky : 'Not drawn yet')}</small></button>`);
  return page({ id: 'skins', g: 'Settings', kind: 'sk37', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: 'Region skin', sub: 'The pages dress for the region', id: 'skins', crumb: ['Settings', 'set'] }, run)}
  <section class="sk37" data-m="panel">${t}</section>
  ${pn('so37', 'Skin', lineRows(rows, at, 80), 'det')}
  ${foot({ name: 'Rotom', k: 'p-rotom' }, '“Bzzt! New region, new paint. Johto is all gold and silver.”', [['Back', 'r9go', 'hud'], ['Done', 'r9go', 'set']], 'Settings', run)}${keys([['↑↓', 'option'], ['←→', 'change'], ['Esc', 'back']], 'Settings', run)}` });
}

// ---------- Ambience (mockup `ambience`, kind am40) ----------

/** Which moving layers each group's pages show (r50.css's pass-40 budget: two layers a page at most). */
export const AMBIENCE: readonly [string, readonly number[]][] = [['HQ', [0, 4]], ['The Day', [0, 1]], ['Jobs', [3, 4]], ['Crew', [0, 4]], ['Opposition', [3]], ['Events', [1, 2]], ['Empire', [1, 2]], ['The Chair', [3]]];

export function r5Ambience(rows: readonly R5Row[], at: number, on: boolean, run: R5Run): string {
  const head = `<div class="ah40"><b></b>${map(['Skyline', 'Lanterns', 'Fireworks', 'Storm', 'Walkers'], (h) => `<b>${h}</b>`)}</div>`;
  const grid = map(AMBIENCE, ([g, ls], i) => `<div class="ar40" ${st(i, 60)}><b>${esc(g)}</b>${rep(5, (j) => `<i class="${on && ls.includes(j) ? 'y' : ''}"></i>`)}</div>`);
  return page({ id: 'ambience', g: 'Settings', kind: 'am40', body: `${bg('hq', 'Settings', run)}${top('Settings', { title: 'Ambience', sub: 'Two layers a page, at most', id: 'ambience', crumb: ['Settings', 'set'] }, run)}
  <section class="am40" data-m="panel" data-testid="r5-amb-grid">${head}${grid}</section>
  ${pn('ao40', 'Ambience', `${lineRows(rows, at, 80)}<p class="ao40t">${on ? 'Opposition pages get the storm. Events and Empire pages get lanterns and fireworks. Home pages get the skyline. Nothing else stacks on top.' : 'Off: no walkers, lanterns, fireworks or rain behind any page.'}</p>`, 'det')}
  ${foot({ name: 'Rotom', k: 'p-rotom' }, '“Bzzt! Two layers a page. Any more and you couldn’t read the menus.”', [['Back', 'r9go', 'hud'], ['Calm', 'r9go', 'calm']], 'Settings', run)}${keys([['↑↓', 'option'], ['←→', 'change'], ['Esc', 'back']], 'Settings', run)}` });
}

// ---------- the Key-Card vault (mockup `vault`, kind grid) ----------

export interface R5VaultCard { id: string; name: string; orb: string; legend: string; state: string; inUse: boolean; usedUp: boolean }

export function r5Vault(cards: readonly R5VaultCard[], at: number, run: R5Run): string {
  const cells = map(cards, (c, i) => `<button class="cell${i === at ? ' on' : ''}" style="--pc:#3a2a34;--i:${i};--d:${i * 50}ms${c.usedUp ? ';filter:grayscale(.8)' : ''}" ${act('vaultCard', i)} data-over="vaultOver" data-testid="r5-vault-${c.id}"><i class="rr14">${c.inUse ? '★★' : '★'}</i><span class="cs">${SP(`p-${c.legend}`, 64)}</span><b>${esc(c.name)}</b><em>${esc(c.state)}</em></button>`);
  return page({ id: 'vault', g: 'Rotom', kind: 'grid g-cards', body: `${bg('hq', 'Rotom', run)}${top('Rotom', { title: 'Key-Card vault', id: 'vault', crumb: ['Rotom', 'rotom'] }, run)}
  <section class="pn g-main" data-m="panel" data-testid="r5-vault-grid"><h3><i>Five Key-Cards · pick one</i></h3><div class="cells n5">${cells}</div></section>
  ${keys([['Enter', 'Choose'], ['Esc', 'Back']], 'Rotom', run)}` });
}

export { face, faceOf };
export type { R5Group };
