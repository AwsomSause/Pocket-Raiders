// New UI Pokédex species page, ported from the mock-up `dex` template (redux-explorer.js): the picture, name, types
// and four facts on the left; the note, six stat bars and the evolution line on the right. The second page (Left or
// Right) keeps the left card and shows the data page's facts and level-up moves. Presentation only.

import type { DexCard, DexDataPage } from '../../../core/presentation/dexInfo';
import { act, bg, esc, facts, H, hpb, mini, TX, ty, W } from '../kit';
import type { ReduxCtx } from '../stage';

export interface DexModel {
  card: DexCard;
  data: DexDataPage;
  page: 0 | 1;
  /** The species' front picture (atlas file), or null while it is unknown or has no art. */
  art: string | null;
  /** One picture per entry of `card.line` (null: no art). */
  line: (string | null)[];
  /** A backdrop behind the picture in the second layout (plain image file), if the room has one. */
  backdrop?: string | null;
}

/** A base stat as a bar: 160 fills it, as in the mock-up. */
export const statPct = (value: number): number => Math.max(0, Math.min(100, Math.round(value / 1.6)));

const pair = (line: string): [string, string] => {
  const at = line.indexOf(': ');
  return at < 0 ? [line, ''] : [line.slice(0, at), line.slice(at + 2)];
};

export function dexView(c: ReduxCtx, d: DexModel): string {
  const v = c.v(2), k = d.card, known = k.state !== 'unknown';
  const head = H('Pokédex', 'party', known ? [['←→', 'page'], ['Esc', 'back']] : [['Esc', 'back']]);
  const picture = known && d.art ? mini(d.art, 180, '', true) : '<b style="font-size:64px;opacity:.5">?</b>';
  const left = `<div class="abs" style="left:24px;top:76px;width:300px">${W(
    `<div class="cell" style="height:200px;aspect-ratio:auto${v ? ';background:#0000' : ''}">${picture}</div>` +
    `<div class="row"><b class="grow" style="font-size:22px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(k.name)}</b><span class="sm">${esc(k.no)}</span></div>` +
    `<div class="row" style="gap:5px;min-height:18px">${k.types.map(ty).join('')}</div>${facts(k.facts)}`,
    'display:flex;flex-direction:column;gap:7px')}</div>`;
  let right: string;
  if (!known) right = W(`<div class="sm" style="line-height:20px">${esc(k.note)}</div>`, '');
  else if (d.page === 1) {
    const moves = d.data.moves.map((m) => `<span class="sm" style="white-space:pre">${esc(m)}</span>`).join('');
    right = W(facts(d.data.facts.map(pair)), 'display:flex;flex-direction:column;gap:5px') +
      W(`<b class="acc">Level-up moves</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 16px">${moves || '<span class="sm">None</span>'}</div>`, 'display:flex;flex-direction:column;gap:6px');
  } else {
    const line = k.line.map((e, i) => { const f = d.line[i]; return f ? mini(f, e.here ? 64 : 56, e.met ? '' : 'sil') : '<b style="opacity:.5">?</b>'; }).join('<b>→</b>');
    right = W(`<div class="sm" style="line-height:20px">${esc(k.note)}</div>`, '') +
      W(k.stats.map((s) => `<div class="row"><span style="width:44px">${esc(s.label)}</span><b style="width:36px">${s.value}</b>${hpb(statPct(s.value), 0, ' gold')}</div>`).join(''), 'display:flex;flex-direction:column;gap:5px') +
      W(`<div class="row" style="justify-content:space-around">${line}<span class="sm" style="max-width:240px;line-height:17px">${esc(k.next)}</span></div>`, 'padding:8px 14px');
  }
  const text = !known ? 'Meet it in a run to fill this page.' : d.page === 1 ? 'Left or Right goes back to the species page.' : 'Abilities, breeding and its level-up moves are on the next page.';
  return head + (v && d.backdrop ? bg(d.backdrop, 'top:48px;bottom:auto;height:260px') : '') + left +
    `<div class="abs col" style="left:352px;right:24px;top:76px;gap:${d.page === 1 ? 10 : 16}px">${right}</div>` +
    `<div class="abs hit" style="left:0;top:0;width:330px;height:48px;z-index:4"${act('back')}></div>` +
    (known ? `<div class="abs hit" style="left:352px;right:24px;top:76px;height:330px;z-index:3"${act('flip')}></div>` : '') +
    TX(esc(text));
}
