// New UI run end, ported from the mock-ups' `over` template (defeat and victory), the run card (`card` template) and
// the full report as paged text over the page. Pure drawing and pure paging; the scene keeps the state and the input.

import { act, type Area, B, bg, esc, facts, H, keys, mini, TX, W } from '../kit';
import type { ReduxCtx } from '../stage';
import { type Art, figure, pic } from '../templates';

export type Fact = readonly [string, string];

export interface OverModel {
  win: boolean;
  title: string;
  sub: string;
  /** Left window: the run in a few numbers. */
  facts: readonly Fact[];
  /** Right window: what the run paid into the profile. */
  payouts: readonly Fact[];
  /** The last party; `down` is a Pokémon that had fainted. */
  team: readonly { file: string | null; name: string; down: boolean }[];
  buttons: readonly string[];
  index: number;
  /** Extra actions, as key hints in the corner: [key, word, action]. */
  extras: readonly (readonly [string, string, string])[];
  backdrop: string | null;
  /** The Pokémon that was just tapped (it shows a small reaction), or null. */
  poked: number | null;
}

export function overView(c: ReduxCtx, d: OverModel): string {
  const v = c.v(2), side = v ? 24 : 120;
  const back = (d.backdrop ? bg(d.backdrop) : '<div class="fill" style="background:linear-gradient(#1a2030,#0b0f18)"></div>') + `<div class="shade" style="background:${d.win ? '#10204880' : '#000000b0'}"></div>${d.win ? '<div class="burst"></div>' : ''}`;
  const head = `<div class="abs col cen" style="left:0;right:0;top:${v ? 30 : 40}px;gap:6px;color:#fff"><b style="font-size:60px;line-height:1;text-shadow:5px 5px 0 #000" class="${d.win ? 'acc' : ''}">${esc(d.title)}</b><span style="text-shadow:2px 2px 0 #000">${esc(d.sub)}</span></div>`;
  const wins = `<div class="abs row" style="left:${side}px;right:${side}px;top:150px;gap:16px;align-items:stretch">${W(facts(d.facts), 'flex:1;display:flex;flex-direction:column;gap:7px;cursor:pointer', '', act('report'))}${W(`<b class="acc">Payouts</b>${facts(d.payouts)}`, 'flex:1;display:flex;flex-direction:column;gap:7px;cursor:pointer', '', act('report'))}</div>`;
  // A wiped team stays recognisable: only when some are still standing do the fallen turn to silhouettes, as in the mock-up.
  const some = d.team.some((p) => !p.down);
  const team = `<div class="abs row" style="left:0;right:0;top:346px;justify-content:center;gap:8px">${d.team.map((p, k) => `<span style="position:relative;width:64px;height:64px;cursor:pointer" title="${esc(p.name)}"${act('poke', k)}>${p.file ? `<span${!d.win && p.down ? (some ? ' class="sil"' : ' style="filter:grayscale(.7) brightness(.7)"') : ''}>${mini(p.file, 64)}</span>` : ''}${d.poked === k ? `<b class="rx-pop" style="position:absolute;left:0;right:0;top:-18px;text-align:center;font-size:20px;color:${d.win ? '#ff7a9a' : '#fff'}">${d.win ? '♥' : '…'}</b>` : ''}</span>`).join('')}</div>`;
  const buttons = `<div class="abs row" style="left:0;right:0;bottom:24px;justify-content:center;gap:12px">${d.buttons.map((t, k) => B(esc(t), k === d.index, '', '', `${act('pick', k)} data-over="over"`)).join('')}</div>`;
  const extras = d.extras.length ? `<div class="keys" style="color:#fff;text-shadow:1px 1px 0 #000">${d.extras.map(([k, t, a]) => `<span style="cursor:pointer"${act(a)}><kbd>${esc(k)}</kbd>${esc(t)}</span>`).join('')}</div>` : '';
  return back + head + wins + team + buttons + extras;
}

export interface RunCardModel {
  title: string;
  /** The big name on the card: "Run 128". */
  name: string;
  /** The tag beside it: "Win" or "Loss". */
  rank: string;
  facts: readonly Fact[];
  /** The Trainer's picture. */
  trainer: Art | null;
  /** Badges won, out of the eight discs on the card. */
  badges: number;
  team: readonly (string | null)[];
  text: string;
  hints: readonly Fact[];
  /** The header band's colour (the run card is a run-end page; the hub's Trainer Card is a hub page). */
  area?: Area;
  /** False for a card that cannot be saved as a picture: a click on it does nothing. */
  save?: boolean;
}

const BADGE_COLORS = ['#e8622a', '#3d8bea', '#3fae5a', '#d8a810', '#7a5ad8', '#d8483a', '#2aa6a0', '#c85aa8'] as const;

export function runCardView(c: ReduxCtx, d: RunCardModel): string {
  const v = c.v(2), side = v ? 60 : 150, cell = v ? 190 : 170;
  const lit = Math.max(0, Math.min(8, Math.floor(d.badges)));
  const discs = `<div class="row" style="gap:6px;margin-top:4px">${Array.from({ length: 8 }, (_, k) => `<i style="width:26px;height:26px;border-radius:50%;background:${k < lit ? BADGE_COLORS[k] : 'var(--p2)'};box-shadow:0 0 0 2px var(--l)"></i>`).join('')}</div>`;
  const team = v ? `<div class="col" style="gap:6px">${d.team.slice(0, 3).map((f) => (f ? mini(f, 60) : '')).join('')}</div>` : '';
  const card = W(`<div class="row" style="gap:22px;align-items:flex-start"><div class="cell" style="width:${cell}px;height:${cell}px;flex:none;overflow:hidden">${figure(d.trainer, Math.round(cell * 0.85))}</div><div class="col grow" style="gap:9px"><div class="row"><b class="acc" style="font-size:26px">${esc(d.name)}</b><span class="tg">${esc(d.rank)}</span></div>${facts(d.facts)}${discs}</div>${team}</div>`, d.save === false ? 'padding:20px 24px' : 'padding:20px 24px;cursor:pointer', '', d.save === false ? '' : act('save'));
  return `<div class="fill"${act('back')}></div>` + H(d.title, d.area ?? 'end', d.hints) + `<div class="abs" style="left:${side}px;right:${side}px;top:78px">${card}</div>` + TX(esc(d.text));
}

/** A short line that ends with a colon heads the lines under it ("Run timeline:"). */
const HEADING = /^[A-Z][^.!?]{0,40}:$/;

/** Rows a line takes in a box `width` letters wide (a blank line takes one). */
const rowsOf = (line: string, width: number): number => Math.max(1, Math.ceil(line.length / Math.max(1, width)));

/**
 * Cuts the report into pages of at most `rows` rows, counting a long line as the rows it wraps to. A page never
 * starts or ends with a blank line, a heading never ends a page alone (it moves on with what it heads), and a line
 * longer than a whole page gets a page to itself.
 */
export function reportPages(lines: readonly string[], rows = 17, width = 90): string[][] {
  const pages: string[][] = [];
  let page: string[] = [];
  const used = (): number => page.reduce((n, t) => n + rowsOf(t, width), 0);
  const trim = (): void => {
    while (page.length && !page[page.length - 1]!.trim()) page.pop();
    while (page.length && !page[0]!.trim()) page.shift();
  };
  const flush = (): void => {
    const carry: string[] = [];
    trim();
    while (page.length > 1 && HEADING.test(page[page.length - 1]!.trim())) {
      carry.unshift(page.pop()!);
      trim();
    }
    if (page.length) pages.push(page);
    page = carry;
  };
  for (const line of lines) {
    const blank = !line.trim();
    if (blank && page.length === 0) continue;
    if (page.length && used() + rowsOf(line, width) > rows) {
      flush();
      if (blank && page.length === 0) continue;
    }
    page.push(line);
  }
  trim();
  if (page.length) pages.push(page);
  return pages;
}

export interface ReportModel { title: string; pages: readonly (readonly string[])[]; page: number; art?: Art | null }

/** The full report as a window over the run end page: one page of lines, with where the reader is. */
export function reportView(_c: ReduxCtx, d: ReportModel): string {
  const n = d.pages.length, p = Math.max(0, Math.min(n - 1, Math.floor(d.page)));
  const lines = d.pages[p] ?? [];
  // A line that ends with a colon or stands alone before a list reads as a heading.
  const row = (t: string): string => (!t.trim() ? '<div style="height:10px"></div>' : `<div${HEADING.test(t.trim()) ? ' class="acc" style="font-weight:700"' : ''}>${esc(t)}</div>`);
  const where = n > 1 ? `<span class="sm">${p + 1} / ${n}</span>` : '';
  const hint = n > 1 && p < n - 1 ? keys([['Enter', 'next page'], ['Esc', 'close']]) : keys([['Esc', 'close']]);
  return '<div class="shade" style="z-index:8"></div>'
    + W(`<div class="row" style="justify-content:space-between">${d.art ? pic(d.art, 28) : ''}<b class="acc grow" style="font-size:21px">${esc(d.title)}</b>${where}</div><div style="flex:1;min-height:0;overflow:hidden;font-size:15px;line-height:21px">${lines.map(row).join('')}</div><div class="row sm" style="justify-content:flex-end;gap:12px">${hint}</div>`, 'position:absolute;left:90px;right:90px;top:34px;bottom:34px;display:flex;flex-direction:column;gap:10px;padding:16px 22px;z-index:9;cursor:pointer', '', act('page'));
}
