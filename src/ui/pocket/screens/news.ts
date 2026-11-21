// The Pocket look's News page (mock-up `news`, the Hub's notice board): a row per piece of news (the game event, the
// run's forecast, your rivals, your record), the lit one framed, and Rotom's line. Enter opens the row's page. It draws
// what HubScene hands it. Presentation only.

import { act, esc, frontRotom, hdr, keys, page, spr } from '../kit';
import { fit } from '../templates';

export interface PkNewsRow { tag: string; colour: string; title: string; text: string }
export interface PkNewsModel { rows: readonly PkNewsRow[]; index: number; say: string }

export function pkNews(d: PkNewsModel): string {
  const head = hdr('News', { area: 'guide', crumb: ['Hub', 'News'], pills: [`${d.rows.length} new`] });
  const rows = d.rows.map((r, k) => `<div class="nw${k === d.index ? ' on' : ''}" style="--c:${r.colour}" data-key="nw-${k}"${act('pick', k, 'over')}><em>${esc(r.tag)}</em><b style="font-size:${fit(r.title, 300, 22, 14, 0.62)}px">${esc(r.title)}</b><span style="font-size:${fit(r.text, 520, 14, 11, 0.5)}px">${esc(r.text)}</span><u data-nocheck>›</u></div>`).join('');
  return page('news', 26, `<div class="scr nw23" data-key="news">${head}<div class="nws" data-key="nws">${rows}</div><div class="nw-rot" data-key="nw-rot">${spr(frontRotom, 1, 'rot')}<p><b>Rotom</b>${esc(d.say)}</p></div>${keys([['↑↓', 'move'], ['Enter', 'open'], ['Esc', 'back']])}</div>`);
}
