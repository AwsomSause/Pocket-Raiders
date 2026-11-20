// Phantom UI: Settings (mock-up pages "set" and "set-*"). The home page has the three one-press presets over a
// tile per page; a page has the letter rail at the left, its rows in the middle and, at the right, a small live
// screen that shows what the chosen row does. The scene owns every row, value and change.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { act, esc, keys, page } from '../kit';
import { phMenuSample } from './title';

export interface PhSettingsRow { label: string; value: string; disabled?: boolean }

export interface PhSettingsModel {
  /** `home`: presets and tiles. `page`: one page of settings. `list`: a plain list (search, the game summary, a yes/no). */
  kind: 'home' | 'page' | 'list';
  /** Where Back leads, for the small line over the title. */
  from: string;
  title: string;
  /** Home: one tile per page, then the plain entries under them (rows continue the tiles' numbering). */
  tiles: { label: string; letter: string; about: string; changed: number }[];
  presets: { n: string; about: string; meters: readonly [number, number, number] }[];
  /** The preset in use, or -1. */
  preset: number;
  /** Page: the rail (every page's letter) and where this page is on it. */
  rail: { label: string; letter: string }[];
  at: number;
  rows: PhSettingsRow[];
  index: number;
  /** The chosen row's explanation (or a notice). */
  help: string;
  /** Page: every value the chosen setting can take, and which one is set. */
  options: { list: string[]; on: number } | null;
  /** List: a line under the title (the search box). */
  sub?: string;
}

const SHARD = (y1: number, y2: number): string => `<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 ${y1}%,100% ${y2}%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>`;
const TAG = /\s+·\s+(next battle|restart needed)$/;

/** A row's value as the mock-ups draw it: a two-way switch, a bar for a percentage, or a word that cycles. */
function value(v: string): string {
  if (!v) return '';
  const tag = TAG.exec(v), main = tag ? v.slice(0, tag.index) : v, note = tag ? `<small class="ph-note">${esc(tag[1])}</small>` : '';
  if (main === 'On' || main === 'Off') return `<span class="v"><span class="tog"><i class="${main === 'On' ? 'a' : ''}">ON</i><i class="${main === 'Off' ? 'a' : ''}">OFF</i></span>${note}</span>`;
  const pct = /^(\d+)%$/.exec(main);
  if (pct) return `<span class="v"><span class="sld"><i style="width:${Math.min(100, Number(pct[1]))}%"></i></span>${esc(pct[1])}${note}</span>`;
  return `<span class="v cyc">${esc(main)}${note}</span>`;
}

/** Six rows show; the list follows the cursor. */
const SHOWN = 6;
const start = (n: number, i: number): number => Math.max(0, Math.min(n - SHOWN, i - 2));

function home(d: PhSettingsModel): string {
  const presets = d.presets.map((p, i) => `<div class="ps${i === d.preset ? ' on' : ''}" style="--i:${i}"${act('preset', i)}><b>${esc(p.n)}</b><p>${esc(p.about)}</p><div class="psm">${['Motion', 'Flashes', 'Reading'].map((l, j) => `<span>${l}<i>${[0, 1, 2].map((k) => `<u class="${k < p.meters[j]! ? 'f' : ''}"></u>`).join('')}</i></span>`).join('')}</div></div>`).join('');
  const tiles = d.tiles.map((t, i) => `<div class="c8${i === d.index ? ' on' : ''}" style="--i:${i}"${act('pick', i, 'over')}><i aria-hidden="true">${esc(t.letter)}</i><b>${esc(t.label)}</b><p>${esc(t.about)}</p>${t.changed ? `<em>${t.changed} changed</em>` : ''}</div>`).join('');
  const n = d.tiles.length;
  const more = d.rows.slice(n).map((r, k) => `<span class="key${n + k === d.index ? ' on' : ''}"${act('pick', n + k, 'over')}>${esc(r.label)}</span>`).join('');
  return page('set', `${SHARD(86, 66)}<div class="hd"><small>${esc(d.from)}</small>Settings</div>
<div class="ps8"><span class="lab">One press · presets</span><div>${presets}</div></div>
<div class="ct8 n${n}">${tiles}</div><div class="keys ph-more">${more}</div>
<p class="sh8 hub">${esc(d.help || 'A preset changes Look, Battle and Access together. Your keys, sound and saves stay as they are.')}</p>
${keys(['Enter', 'Open', 'pick', d.index], ['P', 'Use a preset', 'presetNext'], ['Esc', 'Back', 'back'])}`);
}

function rows(d: PhSettingsModel): string {
  const n = d.rows.length, s = start(n, d.index);
  const list = d.rows.slice(s, s + SHOWN).map((r, q) => `<div class="sr${s + q === d.index ? ' on' : ''}${r.disabled ? ' off' : ''}${r.label.length + r.value.length > 40 ? ' ph-long' : ''}" style="--i:${q}"${act('pick', s + q, 'over')}><span>${esc(r.label)}</span>${value(r.value)}</div>`).join('');
  const marks = n > SHOWN ? `<div class="ph-scroll" aria-hidden="true"><b style="--a:${(s / n) * 100}%;--b:${(SHOWN / n) * 100}%"></b></div><span class="ph-count">${d.index + 1} / ${n}</span>` : '';
  return `<div class="sr8">${list}</div>${marks}`;
}

function one(ph: PhantomVersion, d: PhSettingsModel): string {
  const row = d.rows[d.index];
  const opts = d.options && d.options.list.length > 1
    ? `<div class="pv-o">${d.options.list.map((o, i) => `<div class="${i === d.options!.on ? 'on' : ''}"><b>${esc(o)}</b></div>`).join('')}</div>` : '';
  const id = `set-${d.rail[d.at]?.label.toLowerCase() ?? 'page'}`;
  return page('set-look', `${SHARD(90, 74)}<div class="hd"><small>SETTINGS · ${d.at + 1} OF ${d.rail.length}</small>${esc(d.title)}</div>
<div class="rl8 n${d.rail.length}">${d.rail.map((r, i) => `<span class="${i === d.at ? 'on' : ''}"${act('tab', i)} title="${esc(r.label)}">${esc(r.letter)}</span>`).join('')}</div>
${rows(d)}<p class="sh8">${esc(d.help)}</p>
<div class="pv" data-key="${id}"><span class="lab">What it does · ${esc(row?.label ?? '')}</span><div class="pv-st"><section class="scr s-menu">${phMenuSample(ph)}</section></div>${opts}</div>
${keys(['◀▶', 'Change'], ['Q E', 'Page'], ['R', 'Reset page', 'resetPage'], ['Esc', 'Back', 'back'])}`);
}

function list(d: PhSettingsModel): string {
  return page('set-list', `${SHARD(90, 74)}<div class="hd"><small>SETTINGS</small>${esc(d.title)}</div>
${d.sub ? `<div class="ph-find">${esc(d.sub)}</div>` : ''}<div class="ph-wide${d.sub ? ' low' : ''}">${rows(d)}</div><p class="sh8 hub">${esc(d.help)}</p>
${keys(['Enter', 'Choose', 'pick', d.index], ['Esc', 'Back', 'back'])}`);
}

export const phSettings = (ph: PhantomVersion, d: PhSettingsModel): string => (d.kind === 'home' ? home(d) : d.kind === 'page' ? one(ph, d) : list(d));

/** Settings > Look > Page changes (mock-up `reel`): the six page changes, each playing in its own small frame, and how much they move. */
export type ReelModel = { cards: { id: string; n: string; when: string; about: string }[]; index: number; motions: string[]; motion: number; help: string };
const REEL_FRAME: Record<string, string> = { slash: 'rr-slash', iris: 'rr-iris', drop: 'rr-drop', page: 'rr-page', sweep: 'rr-sweep', share: 'rr-share' };
export function phReel(d: ReelModel): string {
  const cards = d.cards.map((c, i) => `<div class="pn rr-c${i === d.index ? ' lt' : ''}" style="--i:${i}"${act('reelPick', i, 'reelOver')}><div class="rr-d ${REEL_FRAME[c.id] ?? ''}" aria-hidden="true"><i class="a"></i><i class="b"></i>${c.id === 'share' ? '<u></u>' : ''}</div><span class="lab">${esc(c.when)}</span><h3 class="tl1">${esc(c.n)}</h3><p class="txt">${esc(c.about)}</p></div>`).join('');
  const motions = d.motions.map((m, i) => `<span class="${i === d.motion ? 'on' : ''}"${act('reelMotion', i)}>${esc(m)}</span>`).join('');
  return page('reel', `${SHARD(86, 68)}<div class="hd"><small>SETTINGS · LOOK · MOTION</small>Page changes</div>
<div class="rr-g">${cards}</div>
<div class="rr-m"><b>Motion</b>${motions}</div>${d.help ? `<p class="ph-rr-say">${esc(d.help)}</p>` : ''}
${keys(['▲▼', 'Pick'], ['◀▶', 'Motion'], ['Enter', 'Play one', 'reelPlay'], ['Esc', 'Back', 'back'])}`);
}

/** Settings > Every page (mock-up `index`): the look's pages in their groups; the lit one says where it is found. */
export type PageIndexModel = { groups: { n: string; pages: { n: string; open: boolean }[] }[]; index: number; where: string };
export function phPageIndex(d: PageIndexModel): string {
  let at = 0;
  const total = d.groups.reduce((n, g) => n + g.pages.length, 0);
  const groups = d.groups.map((g) => `<div class="ix-g"><h4>${esc(g.n)}<small>${g.pages.length}</small></h4>${g.pages.map((p) => { const i = at++; return `<span class="${i === d.index ? 'on' : ''}${p.open ? ' go' : ''}"${act('ixPick', i, 'ixOver')}>${esc(p.n)}</span>`; }).join('')}</div>`).join('');
  const lit = d.groups.flatMap((g) => g.pages)[d.index];
  return page('index', `<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,100% 0,100% 9%,0 17%);inset:0" aria-hidden="true"></div>
<div class="hd"><small>${total} ${total === 1 ? 'PAGE' : 'PAGES'} · ${d.groups.length} ${d.groups.length === 1 ? 'GROUP' : 'GROUPS'}</small>Every page</div>
<div class="ix ph-ix">${groups}</div>
<p class="ph-ix-say"><b>${esc(lit?.n ?? '')}</b>${esc(d.where)}</p>
${keys(['▲▼', 'Page'], ['◀▶', 'Group'], ...(lit?.open ? [['Enter', 'Open', 'ixOpen'] as [string, string, string]] : []), ['Esc', 'Back', 'back'])}`);
}

