// Phantom UI: Settings (mock-up pages "set" and "set-*"). The home page has the three one-press presets over a
// tile per page; a page has the letter rail at the left, its rows in the middle and, at the right, a small live
// screen that shows what the chosen row does. The scene owns every row, value and change.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import type { Art } from '../../redux/templates';
import { act, esc, keys, page } from '../kit';
import { phHit } from './moments';
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
  /** Page previews: what is playing now (Sound) and a Pokémon to hit (Battle). */
  music?: string | null;
  foe?: Art | null;
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

/** A sample page drawn small inside the preview (its buttons do nothing there). */
const stage = (html: string): string => `<div class="pv-st">${html.replace(/^<!--[^>]*-->/, '').replace(/ data-(?:act|arg|over)="[^"]*"/g, '')}</div>`;
const menuStage = (ph: PhantomVersion): string => stage(`<section class="scr s-menu">${phMenuSample(ph)}</section>`);
const LINE = 'A wild <em>Dragonite</em> keeps raiding the berry carts.';
const num = (v: string): number | null => (/^\d+%?$/.test(v.trim()) ? parseInt(v, 10) : null);

/** The right-hand preview, as each mock-up page draws it: the mixer (Sound), the text sizes (Text), the keys (Controls),
 *  a hit (Battle), the phone (Phone); the other pages show the main menu in the look you have. */
function preview(ph: PhantomVersion, d: PhSettingsModel, opts: string): string {
  const find = (re: RegExp): PhSettingsRow | undefined => d.rows.find((r) => re.test(r.label));
  switch (d.title) {
    case 'Sound': {
      const bars = d.rows.map((r) => ({ r, v: num(r.value) })).filter((b) => b.v !== null);
      const off = find(/^sound$/i)?.value.toLowerCase().startsWith('off');
      return `<div class="pv-mix"><div class="pv-np"><i aria-hidden="true">♪</i><b>${esc(d.music || 'Nothing playing')}</b><small>Now playing</small></div>`
        + `<div class="pv-bars">${bars.map(({ r, v }, i) => `<div style="--v:${off ? 0 : v};--i:${i}"><i><u></u></i><b>${esc(r.label.replace(/\s*volume$/i, ''))}</b><small>${v}</small></div>`).join('')}</div>`
        + `<p>${off ? 'Sound is off, so every bar is silent until you turn it back on.' : 'Each bar plays at its own number.'}</p></div>`;
    }
    case 'Text': {
      const size = (find(/^text size$/i)?.value ?? 'Normal').toLowerCase();
      const one = (cls: string, name: string, st = ''): string => `<div class="${cls}${size.startsWith(name.toLowerCase()) ? ' on' : ''}"><small>${name}</small><p${st}>${LINE}</p></div>`;
      return `<div class="pv-tx">${one('n', 'Normal')}${one('l', 'Large')}${one('h', 'Huge', ' style="font-size:32px"')}</div>`;
    }
    case 'Controls': {
      const k = (key: string, what = '', sel = false): string => `<span class="${what ? 'm' : ''}${sel ? ' sel' : ''}">${key}${what ? `<em>${what}</em>` : ''}</span>`;
      return `<div class="pv-kb"><div class="kr0">${k('Esc', 'Back')}${k('Space', 'OK')}</div>`
        + `<div class="kg">${k('Q', 'Tab')}${k('W', 'Move')}${k('E', 'Tab')}${k('R', 'Reset')}${k('T')}${k('A', 'Move')}${k('S', 'Move')}${k('D', 'Move')}${k('F')}${k('G')}${k('Z', 'OK', true)}${k('X', 'Back')}${k('C')}${k('V')}${k('B')}</div>`
        + `<div class="ka">${k('▲', ' ')}${k('◀', ' ')}${k('▼', ' ')}${k('▶', ' ')}<em>Move</em></div>`
        + '<p>Z, Enter and Space say yes; X, Esc and Backspace go back. The keyboard keys are fixed; the gamepad rows below change its buttons.</p></div>';
    }
    case 'Battle':
      return stage(phHit(ph, { words: ['SUPER', 'EFFECTIVE!'], victim: d.foe ?? null, name: 'Garchomp', damage: 142, from: 100, to: 23, by: 'Charizard', move: 'Dragon Claw' })) + opts;
    case 'Phone':
      return `<div class="pv-ph"><div class="ph-s">${menuStage(ph)}</div><div class="ph-pad" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="ph-ab" aria-hidden="true"><b>Z</b><b class="x">X</b></div><div class="ph-m" aria-hidden="true">≡</div><div class="ph-arc l" aria-hidden="true"></div><div class="ph-arc r" aria-hidden="true"></div></div>`
        + '<p class="pv-c">Every plate on screen is also a button. The pad and Z / X sit where your thumbs already rest.</p>' + opts;
    default:
      return menuStage(ph) + opts;
  }
}

function one(ph: PhantomVersion, d: PhSettingsModel): string {
  const row = d.rows[d.index];
  const opts = d.options && d.options.list.length > 1
    ? `<div class="pv-o">${d.options.list.map((o, i) => `<div class="${i === d.options!.on ? 'on' : ''}"><b>${esc(o)}</b></div>`).join('')}</div>` : '';
  const id = `set-${d.rail[d.at]?.label.toLowerCase() ?? 'page'}`;
  return page('set-look', `${SHARD(90, 74)}<div class="hd"><small>SETTINGS · ${d.at + 1} OF ${d.rail.length}</small>${esc(d.title)}</div>
<div class="rl8 n${d.rail.length}">${d.rail.map((r, i) => `<span class="${i === d.at ? 'on' : ''}"${act('tab', i)} title="${esc(r.label)}">${esc(r.letter)}</span>`).join('')}</div>
${rows(d)}<p class="sh8">${esc(d.help)}</p>
<div class="pv" data-key="${id}"><span class="lab">What it does · ${esc(row?.label ?? '')}</span>${preview(ph, d, opts)}</div>
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

