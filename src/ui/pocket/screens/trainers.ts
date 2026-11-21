// The Pocket look's Trainers page (mock-up `trainers`): the lit Trainer on a big card (who they are, their runs, their
// best run), the next ones as tall cards beside it. A Trainer still locked stands as a shadow with how to unlock them.
// It draws what TrainerSelectScene hands it. Presentation only.

import type { Art } from '../../redux/templates';
import { act, esc, hdr, keys, page } from '../kit';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';

/** The cards' colours, in turn (the mock-up's five). */
const COLOURS = ['#e3350d', '#2a75bb', '#2f9e44', '#d9468f', '#e8791a', '#7a4fc8', '#1a9aa0', '#b8462f'];
export const trainerColour = (i: number): string => COLOURS[((i % COLOURS.length) + COLOURS.length) % COLOURS.length]!;

/** Cards beside the big one. */
export const PK_TRAINER_SIDE = 4;

export interface PkTrainerCard { name: string; art: Art | null; locked: boolean; /** "4 runs", or how it unlocks. */ line: string }
export interface PkTrainersModel {
  cards: readonly PkTrainerCard[];
  index: number;
  /** The lit Trainer: their title, a line of who they are, runs, best run, or why they are locked. */
  lit: { title: string; about: string; runs: number; best: string; locked: string | null };
  /** "Default ▲": the sort Tab changes. */
  sort: string;
}

export function pkTrainers(d: PkTrainersModel): string {
  const n = d.cards.length, index = Math.max(0, Math.min(n - 1, d.index)), cur = d.cards[index];
  const owned = d.cards.filter((c) => !c.locked).length;
  const head = hdr('Trainers', { area: 'card', crumb: ['Hub', 'Trainers'], pills: [`${index + 1} of ${n}`, `${owned} unlocked`] });
  const art = (c: PkTrainerCard | undefined, w: number, h: number): string => (c?.art ? fitPic(pkArtOf(c.art), w, h, c.locked ? 'gx-tr-sil' : '', 4) : '');
  const L = d.lit;
  const info = cur ? `<div class="tr-info"><em>${L.locked ? 'Locked' : 'Playing as'}</em><b style="font-size:${fit(cur.locked ? '???' : cur.name, 210, 56, 26, 0.62)}px">${esc(cur.locked ? '???' : cur.name)}</b><span>${esc(L.title)}</span><p style="font-size:${fitBody(L.locked ?? L.about, 210, 64, [13, 12, 11], 1.35)}px">${esc(L.locked ?? L.about)}</p>${L.locked ? '' : `<div class="tr-st"><u><b>${L.runs}</b>run${L.runs === 1 ? '' : 's'}</u><u><b style="font-size:${fit(L.best, 76, 16, 11, 0.6)}px">${esc(L.best)}</b>best run</u></div>`}</div>` : '';
  const big = cur ? `<div class="trb on${cur.locked ? ' gx-tr-lock' : ''}" style="--c:${trainerColour(index)}" data-key="tr-${index}"${act('pick', index)}><i class="tr-art">${art(cur, 190, 300)}</i>${info}</div>` : '';
  const side = Array.from({ length: Math.min(PK_TRAINER_SIDE, n - 1) }, (_, k) => {
    const i = (index + 1 + k) % n, c = d.cards[i]!;
    return `<div class="trb${c.locked ? ' gx-tr-lock' : ''}" style="--c:${trainerColour(i)}" data-key="tr-${i}"${act('pick', i, 'over')}><i class="tr-art">${art(c, 100, 200)}</i><b style="font-size:${fit(c.locked ? '???' : c.name, 100, 18, 11, 0.6)}px">${esc(c.locked ? '???' : c.name)}</b><span>${esc(c.line)}</span></div>`;
  }).join('');
  return page('trainers', 26, `<div class="scr nrun" data-key="trainers">${head}<div class="tr-row" data-key="tr-row">${big}${side}</div>${keys([['←→', 'trainer'], ['Enter', cur?.locked ? 'how to unlock' : 'play as', 'pick', index], ['Tab', `sort: ${d.sort}`, 'sort'], ['Esc', 'back to the street', 'back']])}</div>`);
}
