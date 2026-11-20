// The Pocket look's Pokédex entry (mock-up page `dex-entry`): the Pokémon large on a foil card at the left, its number,
// name, types, size and note with the seen and caught counts, then two panels: the evolution line and its base
// stats (the second page swaps them for its data facts and level-up moves). An unknown species shows a "?" and how
// to find it. It draws what the Pokédex room hands it (ui/redux/screens/dex.ts). Presentation only.

import type { DexModel } from '../../redux/screens/dex';
import { statPct } from '../../redux/screens/dex';
import { gridStart } from '../../redux/templates';
import { ballArt, monArt } from '../art';
import { act, esc, hdr, keys, page, type PkKey, spr, typeColour } from '../kit';
import { fit, fitBody, fitPic } from '../templates';
import { tyChip } from './party';

const SIZE = /^(height|weight)$/i;
/** Level-up moves stand two columns wide in a 222 x 124 panel: the longest one and the row count set the size. */
export const movesSize = (list: readonly string[]): number => {
  const longest = Math.max(1, ...list.map((m) => m.length)), rows = Math.ceil(list.length / 2);
  return Math.max(8, Math.min(12, 104 / (longest * 0.6), 124 / (Math.max(1, rows) * 1.3)));
};

export function pkDex(d: DexModel): string {
  const k = d.card, known = k.state !== 'unknown';
  const t1 = typeColour(k.types[0]), t2 = typeColour(k.types[1] ?? k.types[0]);
  const ks: PkKey[] = known ? [['←→', d.page ? 'species page' : 'data page', 'flip'], ['Esc', 'back', 'back']] : [['Esc', 'back', 'back']];
  const head = hdr('Pokédex', { area: 'dex', crumb: ['Pokédex', k.name], pills: [`#${k.no.replace(/^No\. /, '').replace(/^0(?=\d{3})/, '')}`] });
  const art = `<div class="de-art" data-key="dex-art"><i class="kc-foil"></i>${known && d.art ? fitPic(monArt(d.art), 270, 380, '', 6) : '<b class="gx-de-q">?</b>'}</div>`;
  const size = k.facts.filter(([l]) => SIZE.test(l)).map(([, v]) => v).join(' · ');
  const chips = k.facts.filter(([l]) => !SIZE.test(l)).map(([l, v]) => `<span>${esc(l)} <b>${esc(v)}</b></span>`).join('');
  const main = `<div class="de-main pn" data-key="dex-main"><em>${esc(k.no)}${known ? ` · ${esc(k.state === 'caught' ? 'Caught' : 'Seen')}` : ''}</em><b style="font-size:${fit(k.name, 560, 46, 28, 0.5)}px">${esc(k.name)}</b>${known ? `<div class="tyrow">${k.types.map(tyChip).join('')}${size ? `<span>${esc(size)}</span>` : ''}</div>` : ''}<p style="font-size:${fitBody(k.note, 560, known ? 66 : 120, [15, 14, 13, 12], 1.45)}px">${esc(k.note)}</p>${chips ? `<div class="de-row">${chips}</div>` : ''}</div>`;
  if (!known) return page('dex-entry', 26, `<div class="scr dexe" data-key="dex">${head}${art}${main}${keys(ks)}</div>`);
  let left: string, right: string;
  if (d.page === 1) {
    const facts = d.data.facts.map((f) => { const at = f.indexOf(': '); return at < 0 ? `<p><span>${esc(f)}</span></p>` : `<p><em>${esc(f.slice(0, at))}</em><span>${esc(f.slice(at + 2))}</span></p>`; }).join('');
    // The data page lays its moves out in padded rows; the panel lists them one by one, two columns wide.
    const list = d.data.moves.flatMap((m) => m.split(/\s{3,}/)).map((m) => m.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const moves = list.map((m) => `<span>${esc(m)}</span>`).join('');
    left = `<div class="de-evo pn gx-de-facts" data-key="dex-facts"><b>${esc(d.data.title || 'Data')}</b><div style="font-size:${fitBody(d.data.facts.join('\n'), 200, 124, [12, 11, 10, 9.5, 9], 1.3)}px">${facts}</div></div>`;
    right = `<div class="de-forms pn gx-de-moves" data-key="dex-moves"><b>Level-up moves</b><div style="font-size:${movesSize(list)}px">${moves || '<span>None</span>'}</div></div>`;
  } else {
    const line = k.line.map((e, i) => { const f = d.line[i]; return `<i class="${e.here ? 'on' : ''}${e.met ? '' : ' gx-sil'}">${f ? fitPic(monArt(f), 64, 64, '', 2) : '<b>?</b>'}</i>`; }).join('<em></em>');
    left = `<div class="de-evo pn" data-key="dex-evo"><b>Evolution</b><div${k.line.length < 3 ? ' class="gx-de-short"' : ''}>${line}</div>${k.next ? `<small class="gx-de-next">${esc(k.next)}</small>` : ''}</div>`;
    right = `<div class="de-forms pn gx-de-stats" data-key="dex-stats"><b>Base stats</b><div>${k.stats.map((s) => `<p><span>${esc(s.label)}</span><b>${s.value}</b><i><u style="width:${statPct(s.value)}%"></u></i></p>`).join('')}</div></div>`;
  }
  return page('dex-entry', 26, `<div class="scr dexe" style="--t:${t1};--t2:${t2}" data-key="dex">${head}${art}${main}${left}${right}<div class="gx-de-flip"${act('flip')}></div>${keys(ks)}</div>`);
}

/** One square of the Pokédex wall, as the Pokédex room says it (ui/HubScene openDexSet). */
export interface PkDexCell { file: string | null; title: string; body: string; off?: boolean; sil?: boolean; got?: boolean }
export interface PkDexWallModel {
  /** The set's name ("Kanto"). */
  title: string;
  n: number;
  index: number;
  cell: (i: number) => PkDexCell | undefined;
  /** The lit square's line: "Charizard: fire / flying. Enter opens its page." */
  hint: string;
  tabs?: { labels: readonly string[]; index: number } | null;
  back: boolean;
}

/** The wall shows four rows of ten. */
export const PK_DEX_COLS = 10;
export const PK_DEX_SIZE = 40;
const TAB_C = ['#e3350d', '#4f7fe0', '#c99700', '#c2185b'];
/** "No. 0006" → "#006". */
export const dexNo = (s: string): string => { const m = /No\.\s*0*(\d+)/.exec(s); return m ? `#${m[1]!.padStart(3, '0')}` : ''; };
const caughtOf = (x: PkDexCell): number => Number(/Caught (\d+)/.exec(x.body)?.[1] ?? 0);
const isGot = (x: PkDexCell): boolean => x.got ?? caughtOf(x) > 0;

/** The Pocket look's Pokédex wall (mock-up page `dex`): the set's tabs, a grid of ten across, the lit one's bar. */
export function pkDexWall(d: PkDexWallModel): string {
  const n = Math.max(0, d.n), index = Math.max(0, Math.min(n - 1, d.index));
  const all = Array.from({ length: n }, (_, i) => d.cell(i));
  const seen = all.filter((x) => x && !x.off).length, caught = all.filter((x) => x && !x.off && isGot(x)).length;
  const s = gridStart(n, index, PK_DEX_SIZE, PK_DEX_COLS);
  const pills = [`Seen ${seen}`, `Caught ${caught}`, ...(n > PK_DEX_SIZE ? [`${s + 1}–${Math.min(n, s + PK_DEX_SIZE)} of ${n}`] : [])];
  const head = hdr('Pokédex', { area: 'dex', crumb: ['Pokédex', d.title.replace(/^Generation (\d+) Pok[eé]dex$/i, 'Gen $1')], pills });
  const tabs = d.tabs ? `<div class="dx-tabs" data-key="dex-tabs">${d.tabs.labels.map((t, k) => `<span class="${k === d.tabs!.index ? 'on' : ''}" style="--c:${TAB_C[k % TAB_C.length]}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';
  const cells = all.slice(s, s + PK_DEX_SIZE).map((x, q) => {
    const i = s + q, on = i === index ? ' on' : '';
    if (!x) return `<div class="dx unk${on}"${act('pick', i, 'over')}><b>?</b></div>`;
    const no = `<em>${esc(dexNo(x.title) || dexNo(x.body))}</em>`;
    if (x.off) return `<div class="dx unk${x.sil ? ' gx-dx-sil' : ''}${on}" data-key="dex-c-${i}"${act('pick', i, 'over')}>${no}${x.sil && x.file ? fitPic(monArt(x.file), 56, 52, '', 1) : '<b>?</b>'}</div>`;
    const got = isGot(x);
    return `<div class="dx ${got ? 'got' : 'seen'}${on}" data-key="dex-c-${i}"${act('pick', i, 'over')}>${no}${x.file ? fitPic(monArt(x.file), 56, 52, '', 1) : ''}${got ? spr(ballArt('pb'), 1, 'dx-b') : ''}</div>`;
  }).join('');
  const cur = all[index];
  let info = '';
  if (cur && !cur.off) {
    const types = /:\s*([a-z]+(?:\s*\/\s*[a-z]+)?)\./i.exec(d.hint)?.[1]?.split(/\s*\/\s*/) ?? [];
    const sc = /Seen (\d+)/.exec(cur.body)?.[1] ?? '0';
    info = `<div class="dx-info pn" data-key="dex-info"${act('pick', index)}><b style="font-size:${fit(`${dexNo(cur.body)} ${cur.title}`, 300, 18, 13, 0.55)}px">${esc(`${dexNo(cur.body)} ${cur.title}`)}</b>${types.map(tyChip).join('')}<span>Caught ${caughtOf(cur)} · Seen ${esc(sc)}</span><em><kbd>Enter</kbd> full entry</em></div>`;
  } else if (cur) {
    info = `<div class="dx-info pn gx-dx-unk" data-key="dex-info"><b>${esc(dexNo(cur.title) || cur.title)} ???</b><span style="font-size:${fit(cur.body, 640, 13, 11, 0.5)}px">${esc(cur.body)}</span></div>`;
  }
  const ks: PkKey[] = [['←→↑↓', 'move'], ['Enter', 'full entry', 'pick', index], ...(d.back ? [['Esc', 'back', 'back'] as PkKey] : [])];
  return page('dex', 26, `<div class="scr dex gx-dexw" data-key="dex-wall">${head}${tabs}<div class="dx-grid${d.tabs ? '' : ' gx-notab'}" data-key="dex-grid">${cells}</div>${info}${keys(ks)}</div>`);
}
