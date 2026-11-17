// New UI decision screens, ported from the mock-ups' `decision` template: "wants to learn a move" (small portrait card
// + the moves as type-striped buttons) and "caught" (big portrait card + where it goes + the party strip). The other
// decisions the game asks (TM, PP Up, a Pokémon asking to lead, mentorship, a trainer's signature pick) reuse the same
// two cards. DecisionScene keeps the state and the input; this only draws.

import { act, B, esc, H, mini, mon, tall, TX, TYPE_COLORS, ty, W, type Area } from '../kit';
import type { ReduxCtx } from '../stage';
import { type Art } from '../templates';
import { partyStrip, type PartyChip } from '../game';

export interface DecisionOption { label: string; small: string; /** A move's type: the button gets that type's stripe. */ type: string | null; off: boolean; art?: Art | null }
export interface DecisionCard {
  /** Big: the caught Pokémon in a frame. Small: a portrait beside "wants to learn". */
  big: boolean;
  file: string | null;
  /** A second, smaller Pokémon in the corner of a big card (the protégé beside its mentor). */
  second?: string | null;
  name: string;
  level: string;
  tag: string;
  sub: string;
  accent: string;
  types: string[];
  lines: string[];
}
export interface DecisionModel {
  title: string;
  area?: Area;
  card: DecisionCard | null;
  options: DecisionOption[];
  index: number;
  /** Small print under the options (stats, a comparison, a rule). */
  details: string[];
  text: string;
  party: PartyChip[] | null;
  /** The full detail sheet (I), over everything. */
  more: string[] | null;
  /** The result line once the choice is made; it stays until the next input. */
  result: string | null;
  hints: readonly (readonly [string, string])[];
}

const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
const small = (lines: readonly string[], st = ''): string => lines.filter(Boolean).map((t) => `<div class="sm" style="line-height:${st ? 16 : 20}px;${st}">${esc(t)}</div>`).join('');

export function decisionView(_c: ReduxCtx, d: DecisionModel): string {
  const k = d.card, n = d.options.length;
  const pick = (i: number): string => `${act('pick', i)} data-over="over"`;
  const dim = (o: DecisionOption): string => (o.off ? 'opacity:.5;' : '');
  let card = '';
  if (k?.big) {
    card = W(`<div class="cell" style="width:170px;height:150px">${k.file ? mon(k.file, 2.6, '', true) : ''}${k.second ? `<div class="abs" style="right:2px;bottom:2px">${mini(k.second, 56)}</div>` : ''}</div><b style="font-size:22px;text-align:center">${esc(k.name)}${k.level ? ` <span class="sm">${esc(k.level)}</span>` : ''}${k.tag ? ` <span class="tg">${esc(k.tag)}</span>` : ''}</b>${k.types.length ? `<div class="row" style="gap:4px">${k.types.map(ty).join('')}</div>` : ''}${k.sub ? `<span class="sm" style="text-align:center;line-height:18px">${esc(k.sub)}</span>` : ''}${small(k.lines, 'font-size:12px;text-align:center')}`, 'width:320px;display:flex;flex-direction:column;align-items:center;gap:8px');
  } else if (k) {
    card = W(`<div class="row">${k.file ? mini(k.file, 72) : ''}<div class="col" style="gap:3px;min-width:0"><b style="font-size:20px">${esc(k.name)}</b><span class="sm">${esc(k.sub)}</span><b class="acc" style="font-size:20px">${esc(k.accent)}</b></div></div>${k.types.length === 1 ? ty(k.types[0]!) : k.types.length ? `<div class="row" style="gap:4px">${k.types.map(ty).join('')}</div>` : ''}${small(k.lines)}`, 'width:330px;display:flex;flex-direction:column;gap:9px');
  }
  // Many moves (an HM's long list): two columns of shorter buttons so the last one stays on screen.
  const wide = n > 7, h = wide || n > 5 ? 40 : 0;
  const btn = (o: DecisionOption, i: number): string => {
    const size = h ? `height:${h}px;font-size:15px;` : '';
    if (o.type) return `<div class="btn mv${i === d.index ? ' on' : ''}" style="--tc:${TYPE_COLORS[cap(o.type)] ?? '#888'};${size}${dim(o)}"${pick(i)}><span class="grow">${esc(o.label)}</span><small>${esc(o.small)}</small></div>`;
    return B(esc(o.label), i === d.index, size + dim(o), esc(o.small), pick(i));
  };
  const strip = d.party ? partyStrip(d.party, 'left:24px;right:24px;bottom:100px') : '';
  const lines = d.details.length ? `<div class="win" style="padding:8px 12px;display:flex;flex-direction:column;gap:1px">${small(d.details, 'font-size:12px')}</div>` : '';
  let body: string;
  if (!k) {
    // No Pokémon to show (a trainer's signature pick, a modifier, a fork in the road): the choices as cards, each with its words.
    body = `<div class="abs col" style="left:120px;right:120px;top:76px;gap:10px">${d.options.map((o, i) => W(`<div class="row">${o.art?.atlas ? tall(o.art.file, 44) : ''}<div class="col grow" style="gap:3px"><b style="font-size:${n > 4 ? 15 : 18}px">${esc(o.label)}</b>${o.small ? `<span class="sm" style="line-height:${n > 4 ? 15 : 18}px;${n > 4 ? 'font-size:12px' : ''}">${esc(o.small)}</span>` : ''}</div></div>`, `padding:${n > 4 ? 6 : 10}px 14px;${dim(o)}`, i === d.index ? 'sel' : '', pick(i))).join('')}${lines}</div>`;
  } else {
    body = `<div class="abs row" style="left:24px;right:24px;top:76px;gap:20px;align-items:${k.big ? 'stretch' : 'flex-start'}">${card}<div class="grow" style="display:${wide ? 'grid' : 'flex'};${wide ? 'grid-template-columns:1fr 1fr;align-content:start' : 'flex-direction:column'};gap:${k.big ? 9 : 8}px;min-width:0">${d.options.map(btn).join('')}${wide ? '' : lines}</div></div>`;
  }
  const more = d.more ? `<div class="shade"${act('more')}></div>` + W(`<b style="font-size:19px">Details</b>${small(d.more, 'font-size:13px;white-space:pre-wrap')}<span class="sm"><kbd>I</kbd>close</span>`, 'position:absolute;left:120px;right:120px;top:40px;display:flex;flex-direction:column;gap:2px;padding:16px 20px;z-index:12', '', act('more')) : '';
  const result = d.result !== null ? `<div class="shade"${act('done')}></div>` + TX(esc(d.result), '', 'z-index:12') + `<div class="abs sm" style="right:36px;bottom:24px;z-index:13"${act('done')}><kbd>Enter</kbd>continue</div>` : '';
  return H(d.title, d.area ?? 'party', d.hints) + body + strip + TX(esc(d.text)) + more + result;
}
