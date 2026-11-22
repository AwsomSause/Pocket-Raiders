// The Pocket look's "Use on" page (mock-up `bag-use`): the item big at the left with what it does and how many are
// left, the party as cards with their HP bar and what the item would do to each (or why it can't). The Bag's own
// picker decides what Enter does; this only draws it. Presentation only.

import type { Art } from '../../redux/templates';
import { act, esc, hdr, keys, page } from '../kit';
import { monArt } from '../art';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';

export interface PkBagUseModel {
  item: { name: string; art: Art | null; text: string; left: number };
  mons: readonly { name: string; file: string | null; hp: number; short: string; ok: boolean; type: string }[];
  index: number;
  say: string;
}

export function pkBagUse(d: PkBagUseModel, colour: (t: string) => string): string {
  const head = hdr(`Use ${d.item.name}`, { area: 'bag', crumb: ['Bag', d.item.name], pills: [`×${d.item.left} left`] });
  const art = pkArtOf(d.item.art);
  const item = `<div class="bu-item pn" data-key="bu-item"><i>${art ? fitPic(art, 96, 96, '', 3) : ''}</i><b style="font-size:${fit(d.item.name, 200, 26, 16, 0.5)}px">${esc(d.item.name)}</b><span style="font-size:${fitBody(d.item.text, 200, 60, [14, 13, 12, 11], 1.3)}px;text-align:center">${esc(d.item.text)}</span></div>`;
  const list = d.mons.map((m, k) => `<div class="bu pn${m.ok ? '' : ' no'}${k === d.index ? ' on' : ''}" style="--t:${colour(m.type)}" data-key="bu-${k}"${act('pick', k, 'over')}><i>${m.file ? fitPic(monArt(m.file), 64, 64, '', 2) : ''}</i><b style="font-size:${fit(m.name, 200, 18, 12, 0.55)}px">${esc(m.name)}</b><span class="hp2"><u style="width:${Math.max(0, Math.min(100, m.hp))}%"></u></span><em style="font-size:${fit(m.short, 220, 13.5, 10, 0.55)}px">${esc(m.short)}</em></div>`).join('');
  return page('bag-use', 26, `<div class="scr bag bu12" data-key="bag-use">${head}${item}<div class="bu-list" data-key="bu-list">${list}</div><div class="gx-bu-say pn"><span style="font-size:${fit(d.say, 640, 14, 11, 0.5)}px">${esc(d.say)}</span></div>${keys([['←→↑↓', 'Pokémon'], ['Enter', 'use', 'pick', d.index], ['Esc', 'back']])}</div>`);
}
