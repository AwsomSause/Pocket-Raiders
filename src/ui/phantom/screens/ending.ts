// Phantom UI: the card page (mock-up `card`). One page for the three cards of the game: the run card at a run's end
// (it can be saved as a picture), the hub's Trainer Card, and the code-name card a team hands you when you join.
// Pure functions from the New UI's own models to HTML: the scenes keep their state and their input.

import { figure } from '../../redux/templates';
import type { RunCardModel } from '../../redux/screens/over';
import type { PhantomVersion } from '../../../core/presentation/phantom';
import { act, esc, keys, mon, page, ransom } from '../kit';

/** Facts on the card itself; any more stand beside it. */
export const PH_CARD_FACTS = 5;

const AREA_WORD: Record<string, string> = { end: 'Run end', hub: 'Hub', story: 'Story' };

/** The name's letter size: a long name shrinks so it never runs under the picture. */
const nameSize = (name: string): number => (name.length <= 6 ? 96 : Math.max(46, Math.round((96 * 6.4) / name.length)));

export function phCard(_ph: PhantomVersion, d: RunCardModel): string {
  const lit = Math.max(0, Math.min(8, Math.floor(d.badges)));
  const tap = d.tap ?? 'back';
  const can = d.save !== false;
  const on = d.facts.slice(0, PH_CARD_FACTS), beside = d.facts.slice(PH_CARD_FACTS);
  const back = '<div class="bgk"></div><div class="burst" style="--x:30%;--y:50%;background:repeating-conic-gradient(color-mix(in srgb,var(--red) 50%,transparent) 0 5deg,transparent 5deg 10deg)" aria-hidden="true"></div>'
    + `<div class="ph-fill"${act(tap)}></div>`;
  const head = `<div class="hd"><small>${esc(d.small ?? AREA_WORD[d.area ?? 'end'] ?? 'Run end')}</small>${esc(d.title)}</div>`;
  const card = `<div class="tcard ph-tcard${can ? ' can' : ''}"${act(can ? 'save' : tap)}>`
    + (d.trainer ? `<div class="pic ph-tc-pic" aria-hidden="true">${figure(d.trainer, 330)}</div>` : '')
    + `<h3 style="font-size:${nameSize(d.name)}px">${ransom(d.name.toUpperCase(), d.name.length + 3)}</h3>`
    + `<div class="id">${esc(d.rank)}</div>`
    + `<dl>${on.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`
    + `<div class="badges ph-tc-badges" aria-label="${lit} of 8 badges">${Array.from({ length: 8 }, (_, k) => `<i class="${k < lit ? 'f' : ''}" style="--i:${k}"></i>`).join('')}</div>`
    + (can ? '<span class="ph-tc-stamp" aria-hidden="true">Save as picture</span>' : '')
    + '</div>';
  const team = d.team.filter((f): f is string => !!f).slice(0, 6);
  let i = 0;
  const kv = (small: string, body: string, cls = ''): string => `<div class="kv ${cls}" style="--i:${i++}"><small>${esc(small)}</small>${body}</div>`;
  const side = '<div class="tside ph-tside">'
    + beside.map(([k, v]) => kv(k, `<b>${esc(v)}</b>`)).join('')
    + (d.side ?? []).map((x) => kv(x.small, `<b>${esc(x.title)}</b>${x.text ? `<p>${esc(x.text)}</p>` : ''}`)).join('')
    + (team.length ? kv('Final team', `<div class="ph-tc-team">${team.map((f) => mon(f, 0.9)).join('')}</div>`) : '')
    + (d.text ? kv(can ? 'Share' : 'Note', `<p>${esc(d.text)}</p>`, 'ph-tc-note') : '')
    + '</div>';
  const hint = keys(...d.hints.map(([k, t]) => [k, t, /esc/i.test(k) ? tap : can ? 'save' : tap] as const));
  return page('card', back + head + card + side + hint);
}
