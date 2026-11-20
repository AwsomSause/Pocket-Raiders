// Phantom UI: rooms of the hub that the mock-ups had no page for, built from the mock-ups' own parts (the slanted
// panels, the Bag's list, the blades): the Research Tree and the Exchange Counter. They take the New UI's models
// (ui/redux/screens/tree.ts, counter.ts), so the Hub scene steers them exactly as before. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxUrl } from '../../redux/assets';
import type { BootModel } from '../../redux/screens/boot';
import type { CounterModel } from '../../redux/screens/counter';
import type { TreeModel } from '../../redux/screens/tree';
import { pic as rxPic } from '../../redux/templates';
import { act, esc, keys, page } from '../kit';
import { phChips } from '../picker';
import { AREA_WORD, backK, factRows, fit, phHead, say } from '../templates';

const STATE_WORD = { owned: 'Researched', open: 'Open', locked: 'Locked', none: '' } as const;

/** The Research Tree: a line of nodes per branch, the lit node's card with what it costs, and the Unlock blade. */
export function phTree(_ph: PhantomVersion, d: TreeModel): string {
  const rows = d.rows.map((r, ri) => {
    const cells = Array.from({ length: d.cols }, (_, ci) => {
      const k = ri * d.cols + ci, cell = r.cells[ci];
      if (!cell || cell.state === 'none') return '<div class="ph-res-gap"></div>';
      const on = k === d.index;
      return `<div class="pn ph-res-n ${cell.state}${on ? ' lt on' : ''}" style="--i:${ri * 2 + ci}" data-key="n${k}"${act('pick', k, 'over')}><small>${STATE_WORD[cell.state]}</small><b style="font-size:${fit(cell.label, 150, 24, 14)}px">${esc(cell.label)}</b></div>`;
    }).join('');
    return `<div class="ph-res-row" style="--n:${d.cols}"><span class="lab">${esc(r.name)}</span>${cells}</div>`;
  }).join('');
  const c = d.card;
  const card = `<div class="pn lt tilt ph-res-card" style="--r:1.2deg" data-key="c${d.index}"><span class="lab">${esc(AREA_WORD[d.area ?? 'hub'])}</span><h3 class="tl1" style="font-size:${fit(c.name, 360, 44, 24)}px">${esc(c.name)}</h3><p class="txt">${esc(c.line)}</p>${factRows(c.facts)}`
    + `<div class="ph-res-go"><div class="blade on${c.ready ? '' : ' off'}" style="--sh:#000;--r:-3deg"${act('pick', d.index)}>${esc(c.button)}</div></div></div>`;
  return page('tree', backK('polygon(60% 0,100% 0,100% 100%,68% 100%)', 84, 46) + phHead(d.title, AREA_WORD[d.area ?? 'hub']) + phChips(d.chips)
    + `<div class="ph-res">${rows}</div>` + card + say(d.text, 'ph-say-w') + keys(['▲▼◀▶', 'Move'], ['Enter', c.button, 'pick', d.index], ['Esc', 'Back', 'back']));
}

/** The Exchange Counter: the offers as the Bag's list, the lit offer's card with one blade per lot size, what the player holds as chips. */
export function phCounter(_ph: PhantomVersion, d: CounterModel): string {
  const nb = Math.max(1, d.buttons.length), n = d.offers.length;
  const at = Math.max(0, Math.min(n * nb - 1, d.index)), oi = Math.floor(at / nb), bi = at % nb, cur = d.offers[oi];
  const stop = (o: number, b: number): string => act('pick', o * nb + b, 'over');
  const head = backK() + phHead(d.title, AREA_WORD.shop) + phChips(d.chips);
  const foot = say(d.text, 'ph-say-m') + keys(['Enter', 'Exchange', 'pick', at], ['◀▶', 'How many'], ['Esc', 'Back', 'back']);
  if (!cur) return page('counter', head + '<div class="ph-none">Nothing here yet</div>' + foot);
  const rows = d.offers.slice(0, 7).map((o, k) => `<div class="it ph-it${k === oi ? ' on' : ''}${o.problems.every(Boolean) ? ' off' : ''}" style="--i:${k};font-size:${fit(o.name, 330 - o.price.length * 9, 32, 17)}px" data-key="r${k}"${stop(k, k === oi ? bi : 0)}><i class="ph-no">${String(k + 1).padStart(2, '0')}</i><div>${esc(o.name)}</div><span>${esc(o.price)}</span></div>`).join('');
  const blades = d.buttons.map((t, j) => `<div class="blade${j === bi ? ' on' : ''}${cur.problems[j] ? ' off' : ''}" style="--i:${j};--sh:#000;--r:${-3 + j * 2}deg" data-key="b${j}"${stop(oi, j)}>${esc(t)}</div>`).join('');
  const card = `<div class="ph-det ph-xc-det${cur.art ? ' pic' : ''}" data-key="d${oi}">${cur.art ? `<div class="big">${rxPic(cur.art, 96)}</div>` : ''}<div class="pn lt tilt" style="--r:1.2deg"><span class="lab">${esc(d.clerk || AREA_WORD.shop)}</span><h3 class="tl1" style="font-size:${fit(cur.name, 440, 40, 22)}px">${esc(cur.name)}</h3><p class="txt">${esc(cur.text)}</p><div class="dm-fr"><span>You hold</span><b>${esc(cur.have.replace(/^You have\s*/i, ''))}</b></div><div class="ph-xc-go">${blades}</div></div></div>`;
  return page('counter', head + `<div class="items ph-items">${rows}</div>` + card + foot);
}

/** The loading screen (and the update splash while it plays): the word, a slanted bar that fills, the tip on a note. */
export function phLoading(_ph: PhantomVersion, d: BootModel): string {
  const pct = Math.round(Math.max(0, Math.min(1, d.progress)) * 100);
  return page('loading', (d.splash ? `<div class="ph-ld-art" style="background-image:url(${rxUrl(d.splash)})" aria-hidden="true"></div><div class="ph-ld-shade" aria-hidden="true"></div>` : backK('polygon(0 0,38% 0,20% 100%,0 100%)', 70, 45))
    + `<div class="ph-ld"><h1 style="font-size:${fit(d.title, 900, 86, 40)}px">${esc(d.title)}</h1>`
    + `<div class="ph-ld-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><b class="ph-ld-pct">${pct}%</b>`
    + (d.note ? `<div class="pn lt tilt ph-ld-note" style="--r:-1deg"><p class="txt" style="font-size:${d.note.length > 150 ? 17 : 20}px">${esc(d.note)}</p></div>` : '') + '</div>'
    + (d.splash ? `<div class="ph-ld-any"${act('next')}></div>` : ''));
}
