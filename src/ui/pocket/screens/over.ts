// The Pocket look's run end (mock-up `gameover`): the title over the striped night, where the run stopped, the road
// drawn to there, the last team, what you keep, then the buttons. A win is the same page in gold. The full report
// opens as a window over it. It draws what GameOverScene hands it. Presentation only.

import type { OverModel } from '../../redux/screens/over';
import { monArt } from '../art';
import { act, esc, keys, page, ribbon } from '../kit';
import { fit, fitPic } from '../templates';

/** "+ 1,240 Bank Credits" for a sum, "Mastery: No new rank" for words. */
export const keepLine = (k: string, v: string): string => (/^[+\d]/.test(v.trim()) ? `${v} ${k}` : `${k}: ${v}`).trim();

export function pkOver(d: OverModel): string {
  const title = d.win ? 'Champion!' : 'The journey ends';
  const team = d.team.slice(0, 6).map((m, i) => `<i class="${m.down ? 'gx-ov-down' : ''}" data-key="ov-mon-${i}"${act('poke', i)}>${m.file ? fitPic(monArt(m.file), 84, 76, d.poked === i ? 'gx-ov-poke' : '', 2) : ''}</i>`).join('');
  const keep = d.payouts.length ? `<div class="ov-keep" data-key="ov-keep"><b>You keep</b>${d.payouts.slice(0, 4).map(([k, v]) => `<span>${esc(keepLine(k, v))}</span>`).join('')}</div>` : '';
  const road = d.road && d.road.of > 1 ? ribbon({ n: d.road.of, at: Math.min(d.road.of - 1, d.road.done), gyms: [] }, 'big') : '';
  const btns = `<div class="ov-btns" data-key="ov-btns">${d.buttons.map((b, i) => `<div class="btn${i === d.index ? ' on' : ''}" data-key="ov-b-${i}"${act('pick', i, 'over')}><b>${esc(b)}</b></div>`).join('')}</div>`;
  const R = d.report;
  const report = R ? `<i class="gx-ov-dim" data-nocheck${act('back')}></i><div class="pn gx-ov-rep" data-key="ov-report"${act('page')}><b>${esc(R.title)}</b><span>Page ${R.page + 1} of ${R.pages}</span><div>${R.lines.map((l) => (l ? `<p>${esc(l)}</p>` : '<p class="gap"></p>')).join('')}</div></div>` : '';
  const ks = R
    ? keys([['←→', 'page', 'page'], ['Esc', 'close', 'back']])
    : keys([['←→', 'move'], ['Enter', 'choose', 'pick', d.index], ...d.extras.map(([k, w, a]) => [k, w, a] as const)]);
  const facts = d.facts.length ? `<div class="gx-ov-facts" data-key="ov-facts">${d.facts.slice(0, 5).map(([k, v]) => `<span><u>${esc(k)}</u>${esc(v)}</span>`).join('')}</div>` : '';
  return page('gameover', 26, `<div class="scr res overp${d.win ? ' gx-ov-win' : ''}" style="--c:${d.win ? '#f2a900' : '#56627f'}" data-key="gameover"><i class="glow"></i>${d.win ? '<i class="confetti"></i>' : ''}<div class="ov-t" data-key="ov-title"><small>${esc(d.where || d.sub)}</small><b style="font-size:${fit(title, 820, 84, 48, 0.62)}px">${esc(title)}</b><span>${esc(d.line || d.sub)}</span></div>${road}${facts}<div class="ov-team" data-key="ov-team">${team}</div>${keep}${btns}${report}${ks}</div>`);
}
