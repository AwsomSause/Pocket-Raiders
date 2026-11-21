// The Pocket look's reward pick (mock-up page `reward`, Pick a Reward): the cards stand in a row with their rarity
// stars over a sunburst, the lit one lifts with the rainbow rim, and the bar under them asks "Take the X?" with the
// draft items' buttons and Take it. Party and Bag sit at the top right. After the pick the result waits in the bar
// for Enter. It draws what RewardScene hands it (ui/redux/screens/stops.ts); the scene keeps the draft. Presentation only.

import type { RewardModel } from '../../redux/screens/stops';
import { act, esc, page, stars } from '../kit';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';

/** The game's three rarities as the mock-up's star tiers. */
const RARITY: Record<string, [tier: number, label: string]> = { common: [1, 'Common'], uncommon: [2, 'Uncommon'], rare: [3, 'Rare'] };
/** What a reward is, in the words the mock-up puts over its name. */
const CATEGORY: Record<string, string> = { healing: 'Medicine', consumable: 'Item', currency: 'Valuable', 'stat-buff': 'Vitamin', attribute: 'Held item', key: 'Key item', transformation: 'Tera Shard' };

export const rarityOf = (r: string | undefined): [number, string] => RARITY[(r ?? '').toLowerCase()] ?? [1, r ? r.charAt(0).toUpperCase() + r.slice(1) : 'Common'];
export const categoryWord = (c: string | undefined): string => CATEGORY[c ?? ''] ?? (c ? c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, ' ') : 'Reward');

const gone = (n: number): string => (n <= 1 ? 'Take it with you.' : n === 2 ? 'Take one. The other one is gone.' : `Take one. The other ${['', '', 'two', 'three', 'four', 'five'][n - 1] ?? n - 1} are gone.`);

export function pkReward(d: RewardModel): string {
  const R = d.cards, n = R.length, inCards = d.index < n, lit = R[Math.min(d.index, n - 1)];
  const w = (895 - 20 * (n - 1)) / Math.max(1, n);
  const cards = R.map((r, k) => {
    const [tier, word] = rarityOf(r.rarity), on = inCards && k === d.index, note = r.notes.join(' · ');
    return `<div class="rw r${tier}${on ? ' on' : ''}" data-key="rw-${k}"${act('pick', k, 'over')}><i class="rw-art"></i><span class="rw-ic">${fitPic(pkArtOf(r.art), 96, 96, '', 3)}</span><em class="rw-rar">${stars(tier)}${esc(word)}</em><small>${esc(categoryWord(r.category))}</small><b style="font-size:${fit(r.name, w - 32, 32, 18, 0.5)}px">${esc(r.name)}</b><p style="font-size:${fitBody(r.text, (w - 32) * 0.9, (note ? 38 : 70) + (n > 3 ? 26 : 0), [13.5, 12.5, 11.5, 10.5], 1.35)}px">${esc(r.text)}</p>${note ? `<p class="gx-rw-note" style="font-size:${fitBody(note, (w - 32) * 0.8, n > 3 ? 40 : 30, [11.5, 10.5, 10, 9.5], 1.25)}px">${esc(note)}</p>` : ''}</div>`;
  }).join('');
  const btn = (label: string, k: number, cls = 'nx2'): string => `<div class="btn ${cls}${d.index === n + k ? ' on' : ''}"${act('pick', n + k, 'over')}><b>${esc(label)}</b></div>`;
  // Party and Bag go top right; the draft items (Re-roll, Lock, Wish) stand in the bar beside Take it.
  const top = d.buttons.slice(0, 2).map((b, k) => btn(b, k, 'sm gx-rw-tab')).join('');
  const items = d.buttons.slice(2).map((b, k) => btn(b, k + 2)).join('');
  const ask = d.notice ? esc(d.notice) : lit ? `Take the <b>${esc(lit.name)}</b>?` : '';
  const askText = d.notice || (lit ? `Take the ${lit.name}?` : '');
  const bar = d.result
    ? `<div class="vs-say gx-rw-done" data-m="tb" data-key="rw-tb"${act('done')}><p style="font-size:${fitBody(d.result.filter(Boolean).join(' '), 720, 80, [18, 16, 14, 13], 1.35)}px">${d.result.filter(Boolean).map(esc).join('<br>')}</p><div class="btn on nx"${act('done')}><b>Next</b></div></div>`
    : `<div class="vs-say" data-m="tb" data-key="rw-tb"><p style="font-size:${fitBody(askText, 880 - 150 * (d.buttons.length - 1), 80, [18, 16, 14, 13], 1.35)}px">${ask}</p>${items}<div class="btn nx${inCards ? ' on' : ''}"${act('take')}><b>Take it</b></div></div>`;
  return page('reward', 26, `<div class="scr res rwd${d.result ? ' gx-rw-picked' : ''}" style="--c:#ffcb05" data-key="reward"><i class="glow"></i>`
    + `<div class="rs-h"><b>Pick a Reward</b><span>${esc(gone(n))}</span></div>${top ? `<div class="gx-rw-top">${top}</div>` : ''}`
    + `<div class="rw-row${n > 3 ? ' gx-many' : ''}" style="grid-template-columns:repeat(${Math.max(1, n)},1fr)" data-key="rw-row">${cards}</div>${bar}</div>`);
}
