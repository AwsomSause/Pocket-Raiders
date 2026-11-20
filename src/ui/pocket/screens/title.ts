// Pocket look: the Title (mock-up page "title", Kice's pick: pass 17 "Trainer Front"). The logo, the menu as a
// leaning list with the lit row as a big yellow plate, the player's trainer with a name tag, the party walking by,
// Rotom's line of news and the best-run rosette. The scene owns the menu and the choices.

import type { PocketRoad } from '../../../core/presentation/pocket';
import type { TitleModel } from '../../redux/screens/title';
import { type PkArt, followerUrl } from '../art';
import { STREET, act, back, esc, frontRotom, keys, mm, page, ribbon, spr, sprH } from '../kit';

/** What the Pocket Title shows beyond the menu itself; the scene fills it in. */
export interface PkTitle {
  hero: { art: PkArt | null; name: string; tag: string };
  /** The saved run: where it stands, for the Continue row. */
  road: PocketRoad | null;
  where: string;
  /** The party as walking sheets (Hub Town followers), last to first. */
  walkers: { sheet: string; ko: boolean }[];
  rotom: string;
  /** The rosette: a big word and a small line. */
  best: { top: string; text: string } | null;
  slot: string;
}

/** The small line beside each choice. */
function sub(label: string, p: PkTitle | undefined): string {
  if (label.startsWith('Continue')) return p?.where ?? 'Pick up where you left off';
  if (label === 'New Run') return 'Pick a trainer and a starter';
  if (label === 'Enter the Hub') return 'Shops, events, rewards';
  if (label === 'Story Run') return 'A new run that begins with the story';
  if (label === 'Save Slots') return p?.slot ?? 'Three slots';
  if (label === 'Settings') return 'Sound, display, controls';
  if (label === 'Discard damaged save') return 'A copy is kept';
  if (label === 'Export damaged save') return 'Download it to keep or send in';
  if (label === 'Copy slot') return 'Into the first empty slot';
  return '';
}

export function pkTitle(d: TitleModel): string {
  const p = d.pk;
  const rows = d.options.map((o, k) => {
    const on = k === d.index, cont = o.label.startsWith('Continue');
    return `<div class="tm${on ? ' on' : ''}${o.disabled ? ' gx-off' : ''}"${act('pick', k, 'over')}><b>${esc(cont ? 'Continue' : o.label)}</b><span>${esc(o.disabled && cont ? 'No run saved yet' : sub(o.label, p))}</span>${on && cont && !o.disabled ? ribbon(p?.road, 'tk') : ''}</div>`;
  }).join('');
  const walk = p?.walkers.length ? `<div class="walkrow tw17">${p.walkers.map((w) => `<i class="wk ${w.ko ? 'ko' : ''}" style="--s:1.25;--d:2;background-image:url(${followerUrl(w.sheet)});"></i>`).join('')}</div>` : '';
  const foot = d.notes.length ? `<div class="gx-notes">${d.notes.map(esc).join('<br>')}</div>` : '<div class="foot17">Fan game. Not for sale.</div>';
  return page('title', 17, `<div class="scr title tt17">${back(STREET, 'tt-bg')}<i class="rays16"></i><i class="tt-slab"></i>
  <div class="logo17" ${mm('logo')}><b>Pocket</b><b>Raiders</b><small>A Pokémon roguelike · ${esc(d.version)}</small></div>
  <div class="tm17${d.options.length > 6 ? ' gx-many' : ''}">${rows}</div>
  ${p ? `<div class="hero17">${sprH(p.hero.art, 345)}</div><div class="htag17"><b>${esc(p.hero.name)}</b><span>${esc(p.hero.tag)}</span></div>` : ''}
  ${walk}
  <div class="rot17">${spr(frontRotom, 2, 'rot')}<p><b>Rotom</b>${esc(p?.rotom ?? 'Bzzt! Ready when you are.')}</p></div>
  ${p?.best ? `<i class="rosette best17"><b data-nocheck>${esc(p.best.top)}</b><span data-nocheck>${esc(p.best.text)}</span></i>` : ''}
  ${foot}${keys([['↑↓', 'move'], ['Enter', 'choose', 'pick', d.index]])}</div>`);
}
