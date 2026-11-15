// New UI battle opening, ported from the mock-ups' `versus` template: who you are about to fight, in four layouts
// (a split screen, a name band, a letterboxed arena shot, two cards). Pure drawing; the battle decides when it shows
// and for how long. The game's Trainer pictures are cut close to the figure, so the heights here are the figure's own.

import { act, AREA, bg, esc, foot, mini } from '../kit';
import type { ReduxCtx } from '../stage';
import { type Art, figure } from '../templates';
import { CUT_BEATS } from './cut';

export interface VersusModel {
  /** The foe's name, drawn big. */
  name: string;
  /** The plate over it: "Gym Leader", "Rival", "Hiker". '' leaves the plate out. */
  role: string;
  cast: Art | null;
  /** What the foe says, without quote marks (the arena shot shows it). '' for nothing. */
  line: string;
  /** An Evil Team foe: the foe's side turns dark red. */
  evil: boolean;
  /** How many Pokémon the foe brings (shown as balls). */
  team: number;
  /** The foe's first Pokémon (the one about to come out), shown on the card layout; the rest stay as balls. */
  lead: string | null;
  player: Art | null;
  playerName: string;
  /** Your party's pictures (the card layout); its length is your ball count. */
  party: readonly (string | null)[];
  /** The arena picture behind the letterboxed shot, or null for a plain dark one. */
  backdrop: string | null;
}

const balls = (n: number, b: number): string => `<div class="row" style="gap:5px">${Array.from({ length: Math.max(0, Math.min(6, Math.floor(n))) }, () => `<i class="ball" style="--b:${b}px"></i>`).join('')}</div>`;
const letter = (h: string): string => `<div class="bars" style="top:0"></div><div class="bars" style="bottom:0"></div>${h}`;
/** A long name steps its letters down so it stays on one line. */
const fit = (name: string, px: number): number => Math.round(px * (name.length > 14 ? 0.6 : name.length > 9 ? 0.78 : 1));

/** The card, with a click anywhere moving on. */
export const versusView = (c: ReduxCtx, d: VersusModel): string => card(c, d) + `<div class="fill" style="z-index:7;cursor:pointer"${act('next')}></div>`;

function card(c: ReduxCtx, d: VersusModel): string {
  const v = c.v(4);
  const plate = (st: string): string => (d.role ? `<span class="plate" style="${st}">${esc(d.role)}</span>` : '');
  if (v === 1) {
    const back = `<div class="fill" style="background:${d.evil ? 'linear-gradient(#4a1018,#8a2a2a 34%,#b84a40 50%,#8a2a2a 66%,#4a1018)' : 'linear-gradient(#f07820,#ffd030 34%,#fff0a0 50%,#ffd030 66%,#f07820)'}"></div>`;
    return back + `<div class="abs" style="left:0;right:0;top:170px;height:200px;background:var(--p);color:var(--wink);box-shadow:0 0 0 5px var(--acc),0 0 0 10px var(--l);overflow:hidden">${foot(700, 330, figure(d.cast, 390))}<div class="abs col" style="left:50px;top:40px;gap:4px">${plate('align-self:flex-start')}<b style="font-size:${fit(d.name, 60)}px;line-height:1">${esc(d.name)}</b></div></div><div class="abs vsx" style="left:40px;top:70px">VS</div><div class="abs" style="right:40px;bottom:40px">${balls(d.team, 24)}</div>`;
  }
  if (v === 2) {
    const back = d.backdrop ? bg(d.backdrop) : '<div class="fill" style="background:linear-gradient(#1a2030,#0b0f18)"></div>';
    const strip = `<div class="beat">${CUT_BEATS.map((_, k) => `<i class="${k <= 1 ? 'on' : ''}"></i>`).join('')}<span>${CUT_BEATS[1]}</span></div>`;
    return letter(back + foot(600, 500, figure(d.cast, 390))) + `<div class="abs col" style="left:60px;top:150px;gap:8px;z-index:6;color:#fff">${plate('align-self:flex-start;background:var(--acc);color:#14161e')}<b style="font-size:${fit(d.name, 66)}px;line-height:.95;text-shadow:5px 5px 0 #000">${esc(d.name)}</b>${d.line ? `<span style="font-size:20px;max-width:380px;line-height:27px;text-shadow:2px 2px 0 #000">“${esc(d.line)}”</span>` : ''}</div><div class="abs" style="left:60px;bottom:20px;z-index:6">${strip}</div>`;
  }
  if (v === 3) {
    const rest = Math.max(0, Math.min(6, Math.floor(d.team)) - (d.lead ? 1 : 0));
    const foes = `${d.lead ? mini(d.lead, 46) : ''}${rest ? balls(rest, 20) : ''}`;
    return `<div class="abs win row" style="left:30px;right:30px;top:30px;height:190px;gap:20px">${figure(d.cast, 150)}<div class="col grow" style="gap:6px">${d.role ? `<span class="tg" style="align-self:flex-start">${esc(d.role)}</span>` : ''}<b style="font-size:${fit(d.name, 40)}px">${esc(d.name)}</b><div class="row" style="gap:4px">${foes}</div></div></div><div class="abs vsx" style="left:0;right:0;top:206px;text-align:center;font-size:76px;z-index:3">VS</div><div class="abs win row" style="left:30px;right:30px;bottom:30px;height:190px;gap:20px"><div class="col grow" style="gap:6px;align-items:flex-end"><span class="tg no">Challenger</span><b style="font-size:${fit(d.playerName, 40)}px">${esc(d.playerName)}</b><div class="row" style="gap:4px">${d.party.map((f) => (f ? mini(f, 46) : '')).join('')}</div></div>${figure(d.player, 150)}</div>`;
  }
  return `<div class="fill" style="background:${AREA.sys};clip-path:polygon(0 0,58% 0,42% 100%,0 100%)">${foot(220, 520, figure(d.player, 400))}</div><div class="fill" style="background:${d.evil ? '#3a1028' : AREA.battle};clip-path:polygon(58% 0,100% 0,100% 100%,42% 100%)">${foot(730, 520, figure(d.cast, 390))}</div><div class="abs" style="left:480px;top:0;bottom:0;width:10px;background:#fff;transform:skewX(-16deg)"></div><div class="abs vsx" style="left:0;right:0;top:200px;text-align:center;z-index:3">VS</div><div class="abs col" style="right:30px;top:30px;align-items:flex-end;gap:4px;color:#fff">${plate('')}<b style="font-size:${fit(d.name, 44)}px;text-shadow:4px 4px 0 #0008">${esc(d.name)}</b></div><div class="abs col" style="left:30px;bottom:30px;gap:4px;color:#fff"><b style="font-size:${fit(d.playerName, 36)}px;text-shadow:4px 4px 0 #0008">${esc(d.playerName)}</b>${balls(d.party.length, 20)}</div>`;
}
