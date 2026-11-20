// Phantom UI: the Bag, built from the mock-ups' `bag` page: pockets as slanted tabs, the items as a list, the lit
// item on its white card with its name across it, and the team along the bottom saying who the item would help.
// It takes the New UI Bag's model (../../redux/screens/bag.ts) plus the team itself, since the New UI's own strip
// arrives already drawn. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import type { PartyChip } from '../../redux/game';
import { bagAction, bagCount, type BagModel } from '../../redux/screens/bag';
import { pic as rxPic, scrollStart } from '../../redux/templates';
import { act, esc, mon, page } from '../kit';
import { phHead, phKeys } from '../templates';

export interface PhBagModel extends BagModel {
  /** The run's team (empty outside a run). */
  party: readonly PartyChip[];
  /** One short note per team member for the lit item ('' for none). */
  notes?: readonly string[];
}

/** The team row under the item card: who holds the lit item, who can use it, who cannot. */
export function useOn(party: readonly PartyChip[], notes: readonly string[] | undefined, label = 'Use on'): string {
  if (party.length === 0) return '';
  return `<div class="useon ph-useon"><b>${esc(label.toUpperCase())}</b>${party.map((p, k) => {
    const note = notes?.[k] ?? '', lit = /^(can use|holds)/i.test(note);
    return `<div class="u${lit ? ' on' : ''}" style="--i:${k}"><div class="pic">${p.file ? mon(p.file, 0.6, '', p.fainted ? 'filter:grayscale(1)' : '') : ''}</div><span class="slash ${p.hp <= 20 ? 'low' : p.hp <= 50 ? 'mid' : ''}"><i style="width:${Math.max(0, Math.min(100, p.hp))}%"></i></span>${notes ? `<small>${esc(note || '·')}</small>` : ''}</div>`;
  }).join('')}</div>`;
}

export function phBag(_ph: PhantomVersion, d: PhBagModel): string {
  const n = Math.max(0, Math.floor(d.n));
  const back = '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(48% 0,100% 0,100% 100%,56% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:85%;--y:40%" aria-hidden="true"></div>';
  const np = d.pockets?.labels.length ?? 0;
  const pockets = d.pockets ? `<div class="pockets ph-pk${np > 7 ? ' many' : np > 5 ? ' some' : ''}">${d.pockets.labels.map((t, k) => `<span class="${k === d.pockets!.index ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';
  const head = phHead(d.title, d.party.length ? 'On the road' : 'Items');
  const foot = phKeys(d.hints);
  if (n === 0) return page('bag', back + head + pockets + '<div class="ph-none">Nothing here yet</div>' + useOn(d.party, undefined, 'Team') + (d.text ? `<div class="pn ph-say ph-say-m"><p class="txt">${esc(d.text)}</p></div>` : '') + foot);
  const index = Math.max(0, Math.min(n - 1, Math.floor(d.index)));
  const cur = d.item(index), does = bagAction(cur.note, cur.off);
  // "Not held · Raises Speed": the words before the first dot are its state, the rest is what it does.
  const cut = cur.note.indexOf('·'), state = cut < 0 ? '' : cur.note.slice(0, cut).trim(), about = cut < 0 ? cur.note : cur.note.slice(cut + 1).trim();
  const chips = [...cur.tag.split(' · ').filter(Boolean), state].filter(Boolean);
  const words = about || d.text;
  // The game's line often repeats the name and the card's words; only what it adds is shown, as a second line on the card.
  let more = d.text.startsWith(`${cur.label}: `) ? d.text.slice(cur.label.length + 2) : d.text;
  if (words && more.startsWith(words)) more = more.slice(words.length).trim();
  const card = `<div class="idet ph-idet" data-key="d${index}"><div class="big">${rxPic(cur.art, 132)}</div><h3 style="font-size:${Math.max(26, Math.min(58, Math.floor(330 / Math.max(1, cur.label.length * 0.5))))}px">${esc(cur.label)}</h3><p${words.length > 190 ? ' class="xs"' : words.length > 110 ? ' class="sm"' : ''}>${esc(words)}</p>${more ? `<p class="ph-why">${esc(more)}</p>` : ''}<div class="lim">${chips.map((x) => `<span>${esc(x.toUpperCase())}</span>`).join('')}</div>${does ? `<div class="blade on ph-do${cur.off ? ' off' : ''}" style="--sh:#000;--r:-3deg"${act('pick', index)}>${esc(does)}</div>` : ''}</div>`;
  const size = 7, s = scrollStart(n, index, size);
  const rows = Array.from({ length: Math.min(size, n - s) }, (_, q) => {
    const i = s + q, r = d.item(i), room = 400 - bagCount(r.tag).length * 16;
    return `<div class="it ph-bi${i === index ? ' on' : ''}${r.off ? ' off' : ''}" style="--i:${q};font-size:${Math.max(17, Math.min(32, Math.floor(room / Math.max(1, r.label.length * 0.56))))}px" data-key="r${i}"${act('pick', i, 'over')}>${rxPic(r.art, 44) || '<i></i>'}<div>${esc(r.label)}</div><span>${esc(bagCount(r.tag))}</span></div>`;
  }).join('');
  const where = n > size ? `<div class="ph-more2" style="left:74px;top:${146 + size * 68}px">${s > 0 ? '▲ ' : ''}${s + 1}–${Math.min(n, s + size)} of ${n}${s + size < n ? ' ▼' : ''}</div>` : '';
  return page('bag', back + head + pockets + `<div class="items ph-items">${rows}</div>` + where + card + useOn(d.party, d.notes, does === 'Give' || does === 'Change holder' ? 'Held by' : 'Use on') + foot);
}
