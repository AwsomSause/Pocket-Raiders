// The Pocket look's boot page (mock-up `boot`) and credits (mock-up `credits`): the big title over the dark slant, the
// fan-game lines, the loading bar; the credits say thank you, roll the run's lines in a column on the right, walk the
// team along the bottom and offer Back. They draw what BootScene and CreditsScene hand them. Presentation only.

import type { BootModel, CreditsModel, CreditsRow } from '../../redux/screens/boot';
import { followerUrl } from '../art';
import { act, esc, keys, page } from '../kit';
import { fit } from '../templates';

const FAN = 'A fan-made Pokémon roguelike. Free, and not for sale.';
const OWNERS = 'Pokémon and its characters belong to Nintendo, Creatures and GAME FREAK.';

/** Boot: the title, the fan lines and the bar. On the update splash, "Press any key" moves on. */
export function pkBoot(d: BootModel): string {
  const pct = Math.round(Math.max(0, Math.min(1, d.progress)) * 100);
  const say = d.splash ? d.title : `${d.title.replace(/…$/, '')} · ${pct}%`;
  const note = d.note ? `<p class="gx-bt-note" style="font-size:${fit(d.note, 700, 14, 11, 0.5)}px">${esc(d.note)}</p>` : '';
  const key = d.splash ? `<div class="bt-key" data-key="bt-key"${act('next')}>Press any key</div><i class="gx-bt-any" data-nocheck${act('next')}></i>` : '';
  return page('boot', 26, `<div class="scr boot17" data-key="boot"><i class="bt-ball"><i class="gx-bt-ball"></i></i><div class="bt-big" data-key="bt-big"><b>Pocket</b><b>Raiders</b></div><p class="bt-p">${FAN}</p><p class="bt-s">${OWNERS}</p><div class="bt-load" data-key="bt-load"><i style="width:${d.splash ? 100 : pct}%"></i><span>${esc(say)}</span></div>${note}${key}</div>`);
}

/** The run's credits lines as the mock-up's groups: a small heading over bold lines; a title stands alone. */
export function pkCreditsRows(rows: readonly CreditsRow[]): string {
  const out: string[] = [];
  let group: string[] | null = null;
  const close = (): void => {
    if (group) out.push(`<div>${group.join('')}</div>`);
    group = null;
  };
  for (const r of rows) {
    if (r.kind === 'gap') close();
    else if (r.kind === 'title') {
      close();
      out.push(`<div class="gx-cr-title"><b>${esc(r.text)}</b></div>`);
    } else if (r.kind === 'heading') {
      close();
      group = [`<em>${esc(r.text)}</em>`];
    } else if (r.kind === 'mons') continue;
    else (group ??= []).push(`<b style="font-size:${fit(r.text, 360, 26, 15, 0.5)}px">${esc(r.text)}</b>`);
  }
  close();
  return out.join('');
}

/** Credits: "Thank you for playing", the roll on the right (it moves when `roll` is a number), the team, Back. */
export function pkCredits(d: CreditsModel): string {
  const walkers = d.walkers ?? [];
  const col = `<div class="rx-roll gx-cr-col"${d.roll === null ? '' : ` style="transform:translateY(${Math.round(d.roll)}px)"`}>${d.lead ? `<div><em>${esc(d.lead)}</em></div>` : ''}${pkCreditsRows(d.rows)}</div>`;
  const walk = walkers.length ? `<div class="walkrow cr-walk" data-key="cr-walk">${walkers.slice(0, 7).map((w) => `<i class="wk ${w.ko ? 'ko' : ''}" style="--s:1.25;--d:2;background-image:url(${followerUrl(w.sheet)});"></i>`).join('')}</div>` : '';
  return page('credits', 26, `<div class="scr cred17" data-key="credits"><div class="cr-big" data-key="cr-big"><b>Thank you</b><b>for playing</b></div><div class="cr-roll rx-credits gx-cr-box${d.roll === null ? ' gx-cr-still' : ''}" data-key="cr-roll" data-nocheck>${col}</div><p class="cr-legal">Pocket Raiders is a fan game. It is free and not for sale. ${OWNERS}</p>${walk}<div class="btn on cr-back"${act('next')}><b>${esc(d.back ?? 'Back')}</b></div>${keys([...(d.roll === null ? [['↑↓', 'scroll'] as const] : []), ['Enter', 'skip', 'next'], ['Esc', 'back', 'next']])}</div>`);
}
