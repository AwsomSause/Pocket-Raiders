// DOMINION redesign R9: the hold-Q command wheel (mockup `wheel`, kind wheel5: the Nova Dial) at pass 50. Drawn over the
// page you are on, like D28's wheel; the eight places, the last pages and the pinned list are D28's (core/dominion/nav).
// Every test id of D28's wheel is kept.

import { art, esc, keys, map, type R5Run } from './kit';

export interface R5WheelSpot { name: string; icon: string; key: string; dim: boolean }
export interface R5WheelModel {
  spots: readonly R5WheelSpot[];
  at: number | null;
  hubName: string;
  hubLine: string;
  last: readonly { go: string; name: string; icon: string }[];
  pins: readonly { go: string; text: string; icon: string }[];
}

const act = (name: string, arg: string | number = ''): string => `data-act="${esc(name)}" data-arg="${esc(String(arg))}"`;

export function r5Wheel(m: R5WheelModel, run: R5Run | null): string {
  const n = m.spots.length;
  const spots = map(m.spots, (s, i) => `<button class="dl${i === m.at ? ' on' : ''}${s.dim ? ' dim4' : ''}" style="--a:${(i * 360) / n - 90}deg;--d:${i * 40}ms${s.dim ? ';opacity:.5' : ''}" ${act('navSpot', i)} data-over="navPoint" data-testid="dom-wheel-spot-${i}">${art(s.icon, 24)}<b>${esc(s.name)}</b><kbd style="margin-left:2px">${esc(s.key)}</kbd></button>`);
  const col = (side: 'l' | 'r', head: string, rows: string): string => `<section class="pn" style="${side === 'l' ? 'left:16px' : 'right:16px'};top:96px;width:200px;padding:12px 10px;z-index:3"><h3><i>${head}</i></h3>${rows}</section>`;
  const last = map(m.last, (p, i) => `<button class="row sm" ${act('navGo', p.go)} data-testid="dom-wheel-last-${i}">${art(p.icon, 20)}<b>${esc(p.name)}</b>${i === 0 ? '<i class="tag">⌫</i>' : ''}</button>`) || '<p style="color:var(--mut);font-size:13px">Nowhere yet</p>';
  const pins = map(m.pins, (p, i) => `<button class="row sm" ${act('navGo', p.go)} data-testid="dom-wheel-pin-${i}">${art(p.icon, 20)}<b>${esc(p.text)}</b></button>`) || '<p style="color:var(--mut);font-size:13px">Nothing waits</p>';
  const strip = run
    ? keys([['Q', 'hold'], ['Release', 'go']], 'Menu', run)
    : '';
  return `<div class="r50" id="r5" data-g="Menu" data-scr="wheel" data-testid="dom-wheel" style="z-index:40;background:none"><div class="scr nv k-wheel5"><div class="wh-dim" data-nocheck="" ${act('navClose')}></div>
  <div class="dial" data-m="dial"><div class="dial-ring" data-nocheck=""></div>${spots}<div class="dial-c" ${act('navClose')} data-testid="dom-wheel-hub"><span class="eye5">N</span><b>${esc(m.hubName)}</b><em>${esc(m.hubLine)}</em></div></div>
  ${col('l', 'Last pages', last)}${col('r', 'Pinned', pins)}
  <p class="w-hint5">Hold Q on any page · flick toward a word · let go · the same dial as the Boss Menu</p>
  ${strip}</div></div>`;
}
