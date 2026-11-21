// The Pocket look's Pause menu (mock-up page `menu`, Kice's pick: pass 24): the Rotom Phone. Its screen holds the
// day, the road so far, the next stop, the apps and a line from Rotom; beside it stand the Trainer's chip, the party
// and this run's card. Every app is an action the map already has. Presentation only.

import type { ConfirmModel } from '../../redux/screens/saves';
import { type PkArt, badgeArt, ballArt, itemArt, pkPic } from '../art';
import { act, back, esc, frontRotom, keys, mm, page, type PkRoad, ribbon, spr, STREET, typeColour } from '../kit';
import { fit, fitPic, pkConfirm } from '../templates';

/** The apps of the phone, by the name the map knows them by: picture, its size and the ring colour. */
const APP: Record<string, readonly [PkArt, number, string]> = {
  Party: [ballArt('pb'), 3, '#e3350d'], Bag: [itemArt('potion'), 1.5, '#e8791a'], 'Pokédex': [itemArt('scanner'), 1.5, '#d9365e'], 'Trainer Card': [itemArt('master_ribbon'), 1.5, '#b97f00'],
  Journal: [itemArt('exp_charm'), 1.5, '#7a4fd0'], 'Type Chart': [badgeArt('fire'), 1, '#2a75bb'], Save: [itemArt('calendar'), 1.5, '#2f9e44'], Settings: [itemArt('metal_coat'), 1.5, '#56627f'],
  'PC Box': [itemArt('linking_cord'), 1.5, '#d9365e'], Rivals: [itemArt('black_glasses'), 1.5, '#b97f00'], 'End run': [itemArt('map'), 1.5, '#2a75bb'],
};
/** Apps across the phone's screen: the arrows move the same way. */
export const PK_PAUSE_COLS = 4;
/** Apps on one screen of the phone (two lines of four); more go on a second screen, as on a phone. */
export const PK_PAUSE_PAGE = 8;

export interface PkPause {
  /** The bar along the top of the phone's screen. */
  when: string; where: string; money: string; saved: string;
  road: PkRoad | null;
  /** The stop the map's cursor is on. */
  next: string;
  apps: readonly { label: string; off?: boolean }[];
  index: number;
  rotom: string;
  hero: { art: PkArt | null; name: string; chips: readonly string[] };
  party: readonly { art: PkArt | null; name: string; level: number; hp: number; type: string }[];
  run: readonly string[];
  /** The "End this run?" box, over the page. */
  ask: ConfirmModel | null;
}

export function pkPause(d: PkPause): string {
  const pg = Math.floor(Math.max(0, d.index) / PK_PAUSE_PAGE), pages = Math.ceil(d.apps.length / PK_PAUSE_PAGE);
  const dots = pages > 1 ? `<div class="gx-rp-dots">${Array.from({ length: pages }, (_, q) => `<u class="${q === pg ? 'on' : ''}"${act('pausePage', q * PK_PAUSE_PAGE)}></u>`).join('')}</div>` : '';
  const apps = d.apps.map((a, k) => { const [art, sc, colour] = APP[a.label] ?? APP.Settings!; return `<div class="rapp${k === d.index ? ' on' : ''}${a.off ? ' gx-off' : ''}" style="--a:${colour}" data-key="a${k}"${act('pause', k, 'pauseOver')}><i>${spr(art, sc)}</i><span>${esc(a.label)}</span></div>`; }).slice(pg * PK_PAUSE_PAGE, (pg + 1) * PK_PAUSE_PAGE).join('');
  const face = d.hero.art ? pkPic(d.hero.art) : undefined;
  const party = d.party.map((m) => `<div class="pkm${m.hp <= 0 ? ' fnt' : ''}" style="--t:${typeColour(m.type)}"><i>${fitPic(m.art, 70, 52, '', 1)}</i><b style="font-size:${fit(m.name, 78, 12, 9)}px">${esc(m.name)}</b><span>Lv ${m.level}</span><u class="${m.hp > 50 ? 'ok' : m.hp > 20 ? 'mid' : 'low'}" style="--w:${Math.max(0, Math.min(100, m.hp))}%"></u></div>`).join('');
  return page('menu', 24, `<div class="scr mn24 mn23 mn22 mn21 mn18 mn17 mn16 mn15 menu mn14">${back(STREET, 'ar-bg dim')}`
    + `<div class="rphone" ${mm('phone')}><i class="rp-ear"></i><i class="rp-eyes"><u></u><u></u></i>`
    + `<div class="rp-scr"><div class="rp-bar" style="font-size:${fit(d.when + d.where + d.money + d.saved, 440, 12, 9.5, 0.56)}px"><b>${esc(d.when)}</b><span>${esc(d.where)}</span><span>${esc(d.money)}</span><em>${esc(d.saved)}</em></div>${ribbon(d.road, 'ph')}`
    + `<div class="rp-note"><em>Next stop</em><b style="font-size:${fit(d.next, 380, 24, 14, 0.47)}px">${esc(d.next)}</b></div>`
    + `<div class="rp-apps">${apps}</div>${dots}<div class="rp-ask">${spr(frontRotom, 1, 'rot')}<p style="font-size:${fit(d.rotom, 760, 14, 11, 0.5)}px"><b>Rotom</b>${esc(d.rotom)}</p></div></div></div>`
    + `<div class="mn-id"><i${face ? ` style="background-image:url(${face.url});background-size:auto 69px"` : ''}></i><b>${esc(d.hero.name)}</b>${d.hero.chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>`
    + `<div class="rp-hand">${party}</div><div class="runc23"><b>This run</b>${d.run.map((l) => `<span style="font-size:${fit(l, 236, 13, 10, 0.52)}px">${esc(l)}</span>`).join('')}</div>`
    + keys([['←→↑↓', 'app'], ['Enter', 'open', 'pauseGo'], ['Esc', 'resume', 'pause', -1]])
    + (d.ask ? pkConfirm(d.ask) : '') + '</div>');
}
