// The Pocket look's Bag (mock-up page `bag`): the pockets as a column of tabs with an item for each, the items of the
// open pocket as a grid of three with their counts, and the lit item's card with what it does, how many you have and
// what Enter does (Use, Give, Change holder). Under the card, who in the party it would help. It draws what
// ui/redux/pickerView.ts hands it (ui/redux/screens/bag.ts); the picker keeps the state and the keys. Presentation only.

import type { PartyChip } from '../../redux/game';
import { bagAction, bagCount, type BagModel } from '../../redux/screens/bag';
import { gridStart } from '../../redux/templates';
import { ballArt, itemArt, monArt, type PkArt } from '../art';
import { act, esc, hdr, keys, page, type PkKey } from '../kit';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';

/** Items on show at a time: three rows of three. */
export const PK_BAG_COLS = 3;
export const PK_BAG_SIZE = 9;

/** A pocket's icon, by what its name says (the mock-up's: a Potion, a Poké Ball, a Focus Sash, glasses, a map). */
export function pocketIcon(label: string): PkArt {
  const l = label.toLowerCase();
  if (/ball/.test(l)) return ballArt('pb');
  if (/medic|heal|potion/.test(l)) return itemArt('potion');
  if (/held/.test(l)) return itemArt('focus_sash');
  if (/battle/.test(l)) return itemArt('wise_glasses');
  if (/key|map/.test(l)) return itemArt('map');
  if (/candy|exp|level/.test(l)) return itemArt('rare_candy');
  return itemArt('amulet_coin');
}

export interface PkBagModel extends BagModel {
  money?: number;
  party?: readonly PartyChip[];
  /** Under each party member, what the lit item would do for it ('' for nothing). */
  notes?: readonly string[];
}

export function pkBag(d: PkBagModel): string {
  const n = Math.max(0, Math.floor(d.n)), index = Math.max(0, Math.min(n - 1, Math.floor(d.index)));
  const pills = [...(d.money !== undefined ? [`₽ ${d.money.toLocaleString('en-US')}`] : []), ...(n > PK_BAG_SIZE ? [`${gridStart(n, index, PK_BAG_SIZE, PK_BAG_COLS) + 1}–${Math.min(n, gridStart(n, index, PK_BAG_SIZE, PK_BAG_COLS) + PK_BAG_SIZE)} of ${n}`] : [])];
  const P = d.pockets, many = (P?.labels.length ?? 0) > 6;
  const pockets = P ? `<div class="pockets${many ? ' gx-many' : ''}" data-key="bag-pockets">${P.labels.map((t, k) => `<div class="pocket${k === P.index ? ' on' : ''}"${act('tab', k)}><i>${fitPic(pocketIcon(t), 32, 32, '', 2)}</i><b style="font-size:${fit(t, 120, 14, 11, 0.56)}px">${esc(t)}</b></div>`).join('')}</div>` : '';
  const ks: PkKey[] = d.hints.map(([k, t]) => [k, t] as const);
  const head = hdr(d.title, { area: 'bag', crumb: ['Menu', d.title], pills });
  if (!n) return page('bag', 26, `<div class="scr bag bg12${P ? '' : ' gx-nopk'}" data-key="bag">${head}${pockets}<div class="bg12-d pn gx-empty"><b>Nothing here yet</b><p>${esc(d.text)}</p></div>${keys(ks)}</div>`);
  const s = gridStart(n, index, PK_BAG_SIZE, PK_BAG_COLS);
  const cells = Array.from({ length: Math.max(0, Math.min(PK_BAG_SIZE, n - s)) }, (_, q) => s + q).map((i) => {
    const r = d.item(i), count = bagCount(r.tag);
    return `<div class="it12 pn${i === index ? ' on' : ''}${r.off ? ' gx-bag-off' : ''}" data-key="bag-i-${i}"${act('pick', i, 'over')}><i>${fitPic(pkArtOf(r.art), 64, 64, '', 2)}</i><b style="font-size:${fit(r.label, 116, 13.5, 10.5, 0.55)}px">${esc(r.label)}</b>${count ? `<em>${esc(count)}</em>` : ''}</div>`;
  }).join('');
  const cur = d.item(index), does = bagAction(cur.note, cur.off);
  // "Not held · Raises Speed": the words after the first dot are what it does.
  const about = cur.note.replace(/^[^·]*·\s*/, '') || cur.note;
  const count = bagCount(cur.tag).replace(/^[×x]\s*/, '');
  const rest = cur.tag.split(' · ').filter((t) => !/^[×x]\s*\d/.test(t)).join(' · ');
  const button = does
    ? `<div class="row"><div class="btn on${cur.off ? ' gx-dim' : ''}"${act('pick', index)}><b>${esc(does)}</b></div></div>`
    : `<div class="row"><span class="gx-bag-state">${esc(cur.note.split(/[·:]/)[0]!.trim())}</span></div>`;
  // The picker's line (a problem, or a hint) when it says more than the card does.
  const say = d.text.replace(`${cur.label}: `, '').replace(about, '').replace(cur.note, '').trim();
  const helps = d.party && d.notes ? d.party.map((m, k) => ({ m, note: d.notes![k] ?? '' })).filter((x) => x.note) : [];
  const party = helps.length ? `<div class="gx-bag-party" data-key="bag-party">${helps.map(({ m, note }) => `<span class="${/^(can use|holds)/i.test(note) ? 'ok' : ''}">${m.file ? fitPic(monArt(m.file), 28, 26, '', 1) : ''}<u>${esc(note)}</u></span>`).join('')}</div>` : '';
  const detail = `<div class="bg12-d pn" data-key="bag-card"><i>${fitPic(pkArtOf(cur.art), 96, 96, '', 3)}</i><b style="font-size:${fit(cur.label, 300, 28, 18, 0.5)}px">${esc(cur.label)}</b><p style="font-size:${fitBody(about, 250, 80, [14, 13, 12, 11], 1.4)}px">${esc(about)}</p><span>${count ? `You have ${esc(count)}` : ''}${rest ? `${count ? ' · ' : ''}${esc(rest)}` : ''}</span>${button}</div>`;
  return page('bag', 26, `<div class="scr bag bg12${P ? '' : ' gx-nopk'}" data-key="bag">${head}${pockets}<div class="bg-grid" data-key="bag-grid">${cells}</div>${detail}${party}`
    + (say ? `<div class="gx-bag-say"><p style="font-size:${fitBody(say, 280, 34, [13, 12, 11, 10], 1.3)}px">${esc(say)}</p></div>` : '') + `${keys(ks)}</div>`);
}
