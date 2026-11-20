// Phantom UI: one species' Pokédex entry, built from the mock-ups' `dexentry` page: the Pokémon on its type-coloured
// field with the turning ball behind it, its measurements and types on a tilted card, its note, the evolution line
// in boxes and the record chips. The game's second page (facts and level-up moves) keeps the same left side. It
// takes the New UI page's model (../../redux/screens/dex.ts). Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { statPct, type DexModel } from '../../redux/screens/dex';
import { act, esc, keys, mon, page, TYC, ty } from '../kit';
import { phHead } from '../templates';

const STATE_WORD = { unknown: 'Not met yet', seen: 'Met', caught: 'Caught' } as const;
const pair = (line: string): [string, string] => { const at = line.indexOf(': '); return at < 0 ? [line, ''] : [line.slice(0, at), line.slice(at + 2)]; };

export function phDex(_ph: PhantomVersion, d: DexModel): string {
  const k = d.card, known = k.state !== 'unknown';
  const tc = TYC[(k.types[0] ?? '').toLowerCase()] ?? '#666';
  const back = `<div class="bgk"></div><div class="de-bg" style="--tc:${tc}" aria-hidden="true"></div><div class="de-ball" aria-hidden="true"></div>`;
  const head = phHead(k.name, `Pokédex · ${k.no} · ${STATE_WORD[k.state]}`);
  const picture = `<div class="de-mon ph-de-mon" data-key="mon">${known && d.art ? mon(d.art, 3.6, 'ol', '', true) : '<b class="ph-de-q">?</b>'}</div>`;
  const fact = (name: string): string => k.facts.find(([a]) => a.toLowerCase() === name)?.[1] ?? '';
  const rest = k.facts.filter(([a]) => !/^(height|weight)$/i.test(a));
  const foot = d.book
    ? keys(['◀▶', 'Next entry', 'dexGo', 'stepR'], ...(known ? [['▲▼', 'Page', 'dexGo', 'flip'] as const, ['C', 'Cry', 'dexGo', 'cry'] as const] : []), ['Q', 'Type chart', 'dexGo', 'types'], ['X', 'Back', 'dexGo', 'back'])
    : keys(...(known ? [['◀▶', 'Page', 'flip'] as const] : []), ['Esc', 'Back', 'back']);
  if (!known) {
    return page('dexentry', back + head + picture + `<div class="pn de-tx ph-de-tx" style="top:200px"><p class="txt">${esc(k.note)}</p></div>` + foot);
  }
  const stats = `<div class="ph-de-stats">${k.stats.map((s) => `<div><span>${esc(s.label)}</span><b>${s.value}</b><span class="slash xp" style="--w:118px"><i style="width:${statPct(s.value)}%"></i></span></div>`).join('')}</div>`;
  let right: string;
  if (d.page === 1) {
    const facts = d.data.facts.map(pair);
    const moves = d.data.moves;
    right = `<div class="ph-de-col"><div class="pn lt de-sp ph-de-sp tilt" style="--r:1deg" data-key="p1"><span class="lab">${esc(d.data.title || 'Data')}</span>${facts.map(([a, b]) => `<div class="dm-fr"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>`
      + `<div class="pn de-tx ph-de-mv${moves.length > 24 ? ' xs' : moves.length > 14 ? ' sm' : ''}" data-key="m1"><span class="lab">Level-up moves</span><div>${moves.length ? moves.map((m) => `<span>${esc(m)}</span>`).join('') : '<span>None</span>'}</div></div></div>`;
  } else {
    const line = k.line.map((e, i) => { const f = d.line[i]; return `<i class="${e.here ? 'on' : ''}">${f ? mon(f, e.here ? 1.15 : 1.1, e.here ? 'olk' : 'ol', e.met ? '' : 'filter:brightness(0) invert(.5)') : '<b class="ph-de-q s">?</b>'}</i>`; }).join('<em></em>');
    right = `<div class="pn lt de-sp tilt" style="--r:1.5deg" data-key="p0"><span class="lab">${esc(STATE_WORD[k.state])}</span><div class="de-row"><div><small>Height</small><b>${esc(fact('height') || '?')}</b></div><div><small>Weight</small><b>${esc(fact('weight') || '?')}</b></div><div class="de-ty">${k.types.map(ty).join('')}</div></div></div>`
      + `<div class="pn de-tx ph-de-tx${k.note.length > 210 ? ' xs' : k.note.length > 120 ? ' sm' : ''}" data-key="t0"><p class="txt">${esc(k.note)}</p></div>`
      + `<div class="de-evo ph-de-evo" data-key="e0"><span class="lab">Evolution line</span><div class="de-line">${line}</div></div>`
      + `<div class="de-chips ph-de-chips" data-key="c0">${rest.map(([a, b]) => `<span><b>${esc(b)}</b>${esc(a)}</span>`).join('')}${k.next ? `<span class="w">${esc(k.next)}</span>` : ''}</div>`;
  }
  return page('dexentry', back + head + picture + stats + right + `<div class="ph-de-hit"${d.book ? act('dexGo', 'flip') : act('flip')}></div>` + foot);
}
