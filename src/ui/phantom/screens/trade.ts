// Phantom UI: trades. The quick trade (a trader's offers) and the Honest Trade Card (both sides told in full before
// you agree) share one page: your side on tilted white paper, the trader's on black, the swap between them, and the
// trader's words in a box that waits. They draw the New UI models (ui/redux/screens/stops.ts) and call the same
// handlers (`accept`, `decline` or `back`, `step`, `done`). Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxAtlas } from '../../redux/assets';
import { honestLine, honestVerdict, type HonestModel, type HonestSide, type TradeModel, type TradeMon } from '../../redux/screens/stops';
import { figure, type Art } from '../../redux/templates';
import { act, esc, keys, mon, page, ransom, ty } from '../kit';

const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;
const fit = (file: string, box: number, cls = ''): string => { const f = rxAtlas(file)?.f[0]; return mon(file, f ? Math.round(Math.min(2.6, box / Math.max(1, f[3]), (box * 1.5) / Math.max(1, f[2])) * 100) / 100 : 1, cls, '', true); };
const ground = '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,54% 0,40% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:50%;--y:46%" aria-hidden="true"></div>';
const who = (name: string, art: Art | null): string => `<div class="ph-tr-who"><i>${figure(art, 60) || `<u>${esc(name.charAt(0))}</u>`}</i><b>${esc(name)}</b></div>`;
const swap = (done: boolean): string => `<div class="ph-tr-x${done ? ' done' : ''}" aria-hidden="true"><i>▶</i><i>◀</i></div>`;
const nav = (at: number, count: number): string => `<div class="ph-tr-nav"><span${act('step', -1)}>◀</span><b>${at + 1} / ${count}</b><span${act('step', 1)}>▶</span></div>`;
const button = (label: string, on: boolean, name: string, over: string, off = false): string => `<div class="blade${on ? ' on' : ''}${off ? ' off' : ''}" style="--sh:#000;--r:${on ? -3 : 0}deg"${act(name, '', over)}>${esc(label)}</div>`;

/** A trader's offer: what leaves, what comes, what it costs. After the trade the two have swapped and the page waits. */
export function phTrade(_ph: PhantomVersion, d: TradeModel): string {
  const swapped = d.done !== null;
  const mine = swapped ? d.get : d.give, theirs = swapped ? d.give : d.get;
  const card = (cls: string, r: number, name: string, art: Art | null, m: TradeMon | null, empty: string): string =>
    `<div class="pn ${cls} tilt ph-tr-card" style="--r:${r}deg" data-key="tr-${cls}-${swapped ? 'done' : d.at}">${who(name, art)}`
    + (m ? `<div class="ph-tr-mon${swapped ? ' pop' : ''}">${m.file ? fit(m.file, 190) : ''}</div><h3 class="tl1" style="font-size:${m.name.length > 11 ? 32 : 44}px">${esc(m.name)}</h3><div class="ph-tr-ty"><em>Lv ${m.level}</em>${m.types.map(ty).join('')}</div>` : `<p class="ph-tr-none">${esc(empty)}</p>`)
    + '</div>';
  const ok = !d.bad && d.give !== null;
  const mid = `<div class="ph-tr-mid"><div class="ph-tr-ttl" data-key="ttl${swapped ? 1 : 0}">${ransom(swapped ? 'TRADED!' : 'TRADE?', swapped ? 9 : 4)}</div>${swap(swapped)}`
    + (swapped ? '' : `<span class="ph-tr-v${d.bad ? ' bad' : ''}">${esc(d.verdict)}</span>${d.cost > 0 ? `<span class="ph-tr-cost">Costs ${money(d.cost)}</span>` : ''}`)
    + `<div class="ph-tr-btn">${swapped ? button('Continue', true, 'done', '') : button('Accept', d.focus === 0, 'accept', 'acc', !ok) + button('Decline', d.focus === 1, 'decline', 'dec')}</div>`
    + (d.count > 1 && !swapped ? nav(d.at, d.count) : '') + '</div>';
  const line = swapped ? d.done ?? '' : d.line;
  return page('trade', ground
    + `<div class="hd"><small>${esc(d.trader)}</small>${esc(d.title)}</div><div class="wallet"><small>MONEY</small>${money(d.money)}</div>`
    + card('lt', -2, 'You', d.you, mine, 'Nothing this trader wants') + mid + card('dk', 2, d.trader, d.traderArt, theirs, 'No offer')
    + (line ? `<div class="pn lt ph-tr-say" data-key="say${swapped ? 1 : 0}"${swapped ? act('done') : ''}><span class="lab">${esc(d.trader)}</span><p class="txt" style="font-size:${line.length > 150 ? 16 : 20}px">${esc(line)}</p></div>` : '')
    + (swapped ? keys(['Enter', 'Continue', 'done']) : keys(['Enter', 'Choose'], ...(d.count > 1 ? [['◀▶', 'Offers'] as const] : []), ['Esc', 'Back', 'decline'])));
}

/** The Honest Trade Card: nature, ability, all four moves, the quirk, the history and one fair-value number, on both sides. */
export function phHonest(_ph: PhantomVersion, d: HonestModel): string {
  const verdict = honestVerdict(d), ok = d.gift || d.give !== null;
  const row = (label: string, value: string): string => `<dt>${label}</dt><dd>${value}</dd>`;
  const facts = (m: HonestSide): string =>
    `<h3 class="tl1" style="font-size:${m.name.length > 11 ? 26 : 34}px">${m.shiny ? '<s>✦</s> ' : ''}${esc(m.name)} <small>Lv ${m.level}</small></h3>`
    + `<div class="ph-tr-ty">${m.types.map(ty).join('')}<em class="val">Fair value ${m.value}</em></div>`
    + `<dl class="ph-tr-dl">${row('Nature', esc(m.nature))}${row('Ability', m.ability ? esc(m.ability) + (m.hidden ? ' <s>(Hidden)</s>' : '') : '—')}${m.held ? row('Holds', esc(m.held)) : ''}</dl>`
    + `<div class="ph-tr-mv">${[0, 1, 2, 3].map((k) => `<span>${esc(m.moves[k] ?? '—')}</span>`).join('')}</div>`
    + (m.quirk ? `<p class="ph-tr-q"><b>${esc(m.quirk.name)}</b> ${esc(m.quirk.line)}</p>` : '')
    + (m.marks.length ? `<p class="ph-tr-mk">${m.marks.map(esc).join(' · ')}</p>` : '')
    + (m.evolvesTo ? `<p class="ph-tr-evo">Evolves into ${esc(m.evolvesTo)} when traded</p>` : '');
  const card = (cls: string, r: number, name: string, art: Art | null, m: HonestSide | null, empty: string): string =>
    `<div class="pn ${cls} tilt ph-tr-card full" style="--r:${r}deg" data-key="ht-${cls}-${d.at}"><div class="ph-tr-top">${who(name, art)}${m?.file ? `<div class="ph-tr-mon">${fit(m.file, 124)}</div>` : ''}</div>${m ? facts(m) : `<p class="ph-tr-none">${esc(empty)}</p>`}</div>`;
  const mid = `<div class="ph-tr-mid full"><div class="ph-tr-ttl">${ransom(d.gift ? 'GIFT' : 'TRADE?', 4)}</div>${swap(false)}<span class="ph-tr-v${verdict.bad ? ' bad' : ''}">${esc(verdict.text)}</span>`
    + `<div class="ph-tr-btn">${d.readOnly ? button('Close', true, 'back', '') : button(d.asking ? 'Yes, trade' : 'Trade', d.focus === 0, 'accept', 'acc', !ok) + button('Back', d.focus === 1, 'back', 'dec')}</div>`
    + (d.count > 1 && !d.readOnly && !d.asking ? nav(d.at, d.count) : '') + '</div>';
  const line = honestLine(d);
  return page('trade', ground
    + `<div class="hd"><small>${esc(d.trader)}</small>${esc(d.title)}</div>`
    + card('lt', -1, 'You', d.you, d.give, d.gift ? 'Nothing asked in return' : `Nothing in your party fits: ${d.wants}`) + mid + card('dk', 1, d.trader, d.traderArt, d.get, '')
    + (line ? `<div class="pn lt ph-tr-say full${d.asking ? ' ask' : ''}" data-key="say${d.asking ? 1 : 0}"><span class="lab">${esc(d.trader)}</span><p class="txt" style="font-size:${line.length > 150 ? 15 : 18}px">${esc(line)}</p></div>` : '')
    + (d.readOnly ? keys(['Enter', 'Close', 'back']) : keys(['Enter', 'Choose'], ...(d.count > 1 && !d.asking ? [['◀▶', 'Your Pokémon'] as const] : []), ['Esc', 'Back', 'back'])));
}
