// The Pocket look's Achievement Hall (mock-up `achieve`, the Hub's Achievement Hall): six achievement cards a page,
// earned ones lit with their reward, the rest grey with their progress (a hidden one stays "???"), and how far each
// kind has come at the right. Achievements count by themselves; Enter still cycles the title on show. Presentation only.

import { act, esc, hdr, keys, page, spr } from '../kit';
import { ballArt, itemArt, type PkArt } from '../art';
import { fit, fitBody } from '../templates';

export interface PkAchievement {
  name: string;
  text: string;
  category: string;
  earned: boolean;
  hidden: boolean;
  /** "3/10" while it is not earned. */
  progress: string;
  reward: string;
}

export interface PkAchieveModel {
  list: readonly PkAchievement[];
  index: number;
  /** By kind: its label, earned and how many there are. */
  kinds: readonly (readonly [string, number, number])[];
  title: string | null;
  say: string;
}

export const PK_ACHIEVE_PAGE = 6;
const ICON: Record<string, readonly [PkArt, number]> = {
  campaign: [itemArt('master_ribbon'), 2], collection: [ballArt('pb'), 2.6], battle: [itemArt('muscle_band'), 2], exploration: [itemArt('map'), 2], economy: [itemArt('amulet_coin'), 2],
  roguelike: [itemArt('quick_claw'), 2], relationship: [itemArt('soothe_bell'), 2], secret: [itemArt('scanner'), 2], endgame: [ballArt('master'), 2.6],
};

export function pkAchieve(d: PkAchieveModel): string {
  const n = d.list.length, got = d.list.filter((a) => a.earned).length, first = Math.floor(Math.max(0, d.index) / PK_ACHIEVE_PAGE) * PK_ACHIEVE_PAGE;
  const head = hdr('Achievement Hall', { area: 'card', crumb: ['Hub', 'Achievements'], pills: [`${got} of ${n}`, `Page ${first / PK_ACHIEVE_PAGE + 1} of ${Math.max(1, Math.ceil(n / PK_ACHIEVE_PAGE))}`] });
  const cards = d.list.slice(first, first + PK_ACHIEVE_PAGE).map((a, q) => {
    const i = first + q, secret = a.hidden && !a.earned, [art, sc] = ICON[a.category] ?? ICON.campaign!;
    const name = secret ? '???' : a.name, text = secret ? 'A hidden achievement. Keep playing to find it.' : a.text;
    const em = a.earned ? `Earned · ${a.reward}` : secret ? 'Hidden' : `${a.progress} · ${a.reward}`;
    return `<div class="ac pn${a.earned ? ' new' : ''}${i === d.index ? ' on' : ''}" data-key="ac-${i}"${act('pick', i, 'over')}><i class="ac-ic">${spr(art, sc)}</i><div><b style="font-size:${fit(name, 200, 17, 12, 0.55)}px">${esc(name)}</b><span style="font-size:${fitBody(text, 200, 52, [13, 12, 11, 10], 1.3)}px">${esc(text)}</span></div><em style="font-size:${fit(em, 200, 13, 9.5, 0.55)}px">${esc(em)}</em></div>`;
  }).join('');
  const kinds = d.kinds.filter(([, , m]) => m > 0).map(([label, k, m]) => `<p><span>${esc(label)} <small>${k} of ${m}</small></span><i class="pips">${Array.from({ length: 5 }, (_, q) => `<u class="${q < Math.round((k / m) * 5) ? 'on' : ''}"></u>`).join('')}</i></p>`).join('');
  const side = `<div class="ach-side pn" data-key="ach-side"><b>By kind</b><div class="gx-ach-kinds">${kinds}</div><small>Achievements count by themselves. Rewards go to your Bank; they never change a run in progress.${d.title ? ` On show: "${esc(d.title)}".` : ''}</small></div>`;
  return page('achieve', 26, `<div class="scr ach" data-key="achieve">${head}<div class="ach-grid" data-key="ach-grid">${cards}</div>${side}<div class="gx-ach-say"><span>${esc(d.say)}</span></div>${keys([['←→↑↓', 'move'], ['Enter', 'change title', 'pick', d.index], ['Esc', 'back']])}</div>`);
}
