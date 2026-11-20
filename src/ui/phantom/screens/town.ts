// Phantom UI: the dock of a town (Hub Town's menu and a Plaza's districts), built from the mock-ups' `pause` page:
// the version's trainer standing at the right, the places as slanted words down the left, the money and rank as
// tabs at the top right, and the crowd gathered at the trainer's feet. It takes the New UI dock's model
// (../../redux/screens/hub.ts); the scene keeps the cursor and the input. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxAtlas } from '../../redux/assets';
import type { DockFigure, DockModel } from '../../redux/screens/hub';
import { pic as rxPic } from '../../redux/templates';
import { act, esc, hero, mon, page } from '../kit';
import { phHead, phKeys } from '../templates';

/** A chip of the dock ("₽ 1,200", "Rank 3", "Regular (12)") as a labelled fact. */
export function dockFact(chip: string): [string, string] {
  if (/^₽/.test(chip)) return ['Money', chip.replace(/^₽\s*/, '₽')];
  const m = /^([A-Za-z]+)\s+(\d[\d,]*)$/.exec(chip);
  if (m) return [m[1]!, m[2]!];
  const r = /^(.*)\s+\((\d+)\)$/.exec(chip);
  return r ? [r[1]!, r[2]!] : ['', chip];
}

/** One of the crowd at its size on the Phantom stage (a third larger than the New UI's). */
function stand(a: DockFigure): string {
  if (!a.art.atlas) return rxPic(a.art, Math.round(104 * a.scale));
  const at = rxAtlas(a.art.file), h = at?.f[0]?.[3] ?? 0;
  return mon(a.art.file, a.px && h ? (a.px * 1.33) / h : a.scale * 1.25, 'ol', '', true);
}

export function phDock(ph: PhantomVersion, d: DockModel): string {
  const n = d.buttons.length;
  const back = '<div class="bgr"></div><div class="burst" style="--x:75%;--y:60%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 0,40% 0,22% 100%,0 100%);inset:0" aria-hidden="true"></div>';
  const me = `<div class="hero ph-dk-hero">${hero(ph.hero, 11, 'sh', 'position:absolute;left:30px;top:24px')}${hero(ph.hero, 11, 'ol', 'position:relative')}</div>`;
  const tabs = d.tabs.length > 1 ? `<div class="pockets ph-dk-tabs">${d.tabs.map((t, k) => `<span class="${k === d.tab ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';
  const rows = d.buttons.map((b, k) => `<div class="h${k === d.index ? ' on' : ''}${b.off ? ' off' : ''}" style="--i:${k};--r:${[-5, -2, -4, -1, -3][k % 5]}deg;--ml:${[0, 40, 14, 56, 26, 6, 44][k % 7]}px" data-key="b${k}"${act('pick', k, 'over')}>${esc(b.label)}${b.small ? `<small>${esc(b.small)}</small>` : ''}</div>`).join('');
  const facts = `<div class="facts">${d.chips.map((c) => { const [a, b] = dockFact(c); return `<span>${a ? `<b>${esc(a.toUpperCase())}</b>` : ''}${esc(b)}</span>`; }).join('')}</div>`;
  // Centre first, then right and left by turns: the same order the New UI stands them in.
  const crowd = d.lineup.slice(0, 9).map((a, r) => `<i style="order:${(r % 2 ? 1 : -1) * Math.ceil(r / 2)};z-index:${20 - r};--i:${r}">${stand(a)}</i>`).join('');
  const say = d.say ? `<div class="pn lt ph-say ph-dk-say" data-key="say"><p class="txt">${esc(d.say)}</p></div>` : '';
  const note = d.note ? `<div class="pn ph-dk-note" data-key="n${d.index}"><p class="txt">${esc(d.note)}</p></div>` : '';
  return page('dock', back + me + phHead(d.town, d.tabs[d.tab] ?? 'Town') + tabs + `<div class="hub ph-dk${n > 7 ? ' many' : ''}" data-key="t${d.tab}">${rows}</div>` + facts + `<div class="ph-crowd">${crowd}</div>` + say + note
    + phKeys(d.hints.length ? d.hints : [['▲▼', 'move'], ...(d.tabs.length > 1 ? [['◀▶', 'tab'] as const] : []), ['Enter', 'open']]));
}
