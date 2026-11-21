// The Pocket look's Memories shelf (mock-up `pt-memories`) and Legacy Gallery (mock-up `pt-gallery`): the shelf is a card
// per kind of memory with a Pokémon on it and how many there are; the gallery is one past Trainer at a time, their team
// and Ace, how the run ended, Relive the moment or the whole team. They draw what MemoriesScene and LegacyGalleryScene
// hand them. Presentation only: reading never changes a run.

import type { Art } from '../../redux/templates';
import { frontArt, monArt } from '../art';
import { act, esc, hdr, keys, page, type PkKey, spr } from '../kit';
import { fit, fitPic, pkArtOf } from '../templates';

/** The Pokémon on each shelf card (the mock-up's own picks, by National Dex number). */
const SHELF_MON: Record<string, number> = { chronicle: 3, journal: 6, hall: 9, lane: 25, fallen: 94, replays: 130, heirlooms: 448, lost: 52 };
export const shelfMon = (id: string): number => SHELF_MON[id] ?? 133;

export interface PkMemoriesModel {
  shelves: readonly { id: string; label: string; count: string }[];
  index: number;
}

/** The Memories shelf: a card per kind of memory, the lit one opens. Four across when there are more than six. */
export function pkMemories(d: PkMemoriesModel): string {
  const n = d.shelves.length, index = Math.max(0, Math.min(n - 1, d.index)), q = n > 6 ? 4 : 3;
  const head = hdr('Memories', { area: 'town', crumb: ['Hub', 'Memories'], pills: ['Read only'] });
  const w = q === 4 ? 196 : 270;
  const cards = d.shelves.map((s, i) => `<div class="pn${i === index ? ' on' : ''}" data-key="mem-${s.id}"${act('pick', i, 'over')}><i>${spr(frontArt(shelfMon(s.id)), 1)}</i><b style="font-size:${fit(s.label, w, 18, 12, 0.56)}px">${esc(s.label)}</b><p>${esc(s.count)}</p></div>`).join('');
  return page('pt-memories', 51, `<div class="scr nrun pg39 gx-mem" data-key="pt-memories">${head}<div class="gr39 q${q} ph39" data-key="mem-grid">${cards}</div>${keys([['←→↑↓', 'shelf'], ['Enter', 'open', 'pick', index], ['Esc', 'back to the Hub', 'back']])}</div>`);
}

export interface PkGalleryModel {
  at: number;
  count: number;
  /** "Champion · Kanto to Hoenn". */
  tag: string;
  name: string;
  art: Art | null;
  /** The Trainer panel's colour (gold for a Champion, slate for a run that fell). */
  colour: string;
  team: readonly { file: string | null; ace: boolean; shiny: boolean }[];
  ace: string;
  ended: string;
  /** How many moments there are to relive (0: the button is dimmed). */
  moments: number;
  /** Relive the moment: the one showing, of how many (null: not reliving). */
  relive?: { label: string; text: string; file: string | null; at: number; count: number } | null;
}

/** The Legacy Gallery: one past Trainer, the team with the Ace lit, how it ended, Relive the moment or Whole team. */
export function pkGallery(d: PkGalleryModel): string {
  const head = hdr('Legacy Gallery', { area: 'town', crumb: ['Memories', 'Legacy Gallery'], pills: [`Run ${d.at + 1} of ${d.count}`] });
  const pic = d.art ? fitPic(pkArtOf(d.art), 200, 360, 'gx-lg-tr', 4) : '';
  const team = d.team.slice(0, 6).map((m) => `<i class="${m.ace ? 'ace' : ''}${m.shiny ? ' gx-lg-shiny' : ''}">${m.file ? fitPic(monArt(m.file), 70, 64, '', 3) : ''}</i>`).join('');
  const card = `<div class="lgc39 pn" data-key="lg-card"><em>${esc(d.tag)}</em><b style="font-size:${fit(d.name, 560, 52, 28, 0.62)}px">${esc(d.name)}</b><div class="lgt39">${team}</div><p><u>Ace</u>${esc(d.ace)}</p><p><u>Ended</u><span style="font-size:${fit(d.ended, 480, 15, 11, 0.55)}px">${esc(d.ended)}</span></p><div class="go"><div class="btn on${d.moments ? '' : ' gx-tr-off'}"${act('relive')}><b>Relive the moment</b></div><div class="btn sm"${act('team')}><b>Whole team</b></div></div></div>`;
  const rl = d.relive;
  if (rl) {
    const say = `<i class="gx-lg-dim" data-nocheck${act('rlNext')}></i><div class="pn gx-lg-rl" data-key="lg-relive"${act('rlNext')}><em>${esc(rl.label)}</em><i>${rl.file ? fitPic(monArt(rl.file), 180, 150, 'gx-lg-rm', 3) : ''}</i><p style="font-size:${fit(rl.text, 900, 20, 14, 0.5)}px">${esc(rl.text)}</p><small>${rl.at + 1} of ${rl.count}</small></div>`;
    return page('pt-gallery', 51, `<div class="scr nrun pg39 lg39" data-key="pt-gallery">${head}<div class="lgw39" style="--c:${d.colour}" data-key="lg-trainer">${pic}</div>${card}${say}${keys([['Enter', rl.at + 1 < rl.count ? 'next moment' : 'done', 'rlNext'], ['Esc', 'stop', 'rlStop']])}</div>`);
  }
  const ks: PkKey[] = [...(d.count > 1 ? [['←→', 'another run', 'step', 1] as PkKey] : []), ['Enter', 'relive', 'relive'], ['T', 'team', 'team'], ['Esc', 'back', 'back']];
  return page('pt-gallery', 51, `<div class="scr nrun pg39 lg39" data-key="pt-gallery">${head}<div class="lgw39" style="--c:${d.colour}" data-key="lg-trainer">${pic}</div>${card}${keys(ks)}</div>`);
}
