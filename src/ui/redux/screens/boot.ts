// New UI: the loading screen and the update splash (the mock-ups' `boot` template) and the ending credits (`credits`).
// Pure drawing: the scenes say how far loading is, what the tip is and which lines roll.

import { act, bg, esc, mini, mon } from '../kit';
import type { ReduxCtx } from '../stage';

export interface BootModel {
  /** "Loading the region…", or "Beta 0.7 is here" on the update splash. */
  title: string;
  /** Loading progress, 0 to 1. */
  progress: number;
  /** The small line under the bar: a tip, or what the update brings. */
  note: string;
  /** The update splash picture (under assets/images) behind everything, or null on a plain load. */
  splash: string | null;
}

/** Two layouts: a Poké Ball over the bar, or Pikachu running in place over it. On the splash a click anywhere moves on. */
export function bootView(c: ReduxCtx, d: BootModel): string {
  const v = c.v(2), pct = Math.round(Math.max(0, Math.min(1, d.progress)) * 100);
  return (d.splash ? bg(d.splash) + '<div class="shade"></div>' : '')
    + `<div class="abs col cen" style="left:0;right:0;top:${v ? 120 : 170}px;gap:20px">${v ? mon('pokemon/25', 3, '', true) : '<i class="ball" style="--b:70px"></i>'}<b style="font-size:26px">${esc(d.title)}</b><div class="hp gold" style="width:520px;height:16px"><i style="width:${pct}%"></i></div><span class="sm" style="max-width:760px;text-align:center">${esc(d.note)}</span></div>`
    + (d.splash ? `<div class="fill" style="z-index:7;cursor:pointer"${act('next')}></div>` : '');
}

export interface CreditsRow { kind: 'title' | 'heading' | 'text' | 'gap' | 'mons'; text: string; mons?: string[] }
export interface CreditsModel {
  /** The small line over the first title ("A run by Kice"); '' leaves it out. */
  lead: string;
  rows: CreditsRow[];
  /** The party along the bottom (atlas files). */
  party: string[];
  /** Backdrop under assets/images. */
  art: string;
  /** A number: the rows roll up the screen and sit this many pixels down right now (the scene moves them). Null: the page stands still and can be scrolled. */
  roll: number | null;
}

/** The rows as the mock-up's column: a small heading over bold lines, gold titles, a row of Pokémon for a team. */
export function creditsRows(rows: readonly CreditsRow[]): string {
  const out: string[] = [];
  let group: string[] | null = null;
  const close = (): void => {
    if (group) out.push(`<div class="col cen" style="gap:2px">${group.join('')}</div>`);
    group = null;
  };
  for (const r of rows) {
    if (r.kind === 'gap') close();
    else if (r.kind === 'title') {
      close();
      out.push(`<b style="font-size:38px;text-transform:uppercase" class="acc">${esc(r.text)}</b>`);
    } else if (r.kind === 'heading') {
      close();
      group = [`<span class="sm">${esc(r.text)}</span>`];
    } else if (r.kind === 'mons') (group ??= []).push(`<div class="row" style="gap:4px;justify-content:center">${(r.mons ?? []).map((f) => mini(f, 40)).join('')}</div>`);
    else (group ??= []).push(`<b style="max-width:820px;text-align:center">${esc(r.text)}</b>`);
  }
  close();
  return out.join('');
}

export function creditsView(_c: ReduxCtx, d: CreditsModel): string {
  const col = `<div class="col cen rx-roll" style="gap:12px;color:#fff;padding:40px 0${d.roll === null ? '' : `;transform:translateY(${Math.round(d.roll)}px)`}">${d.lead ? `<span class="sm">${esc(d.lead)}</span>` : ''}${creditsRows(d.rows)}</div>`;
  const low = d.party.length ? 150 : 44;
  return bg(d.art) + '<div class="shade"></div>'
    + `<div class="abs rx-credits" style="left:0;right:0;top:0;bottom:${low}px;overflow:${d.roll === null ? 'auto' : 'hidden'};cursor:pointer"${act('next')}>${col}</div>`
    + (d.party.length ? `<div class="abs row" style="left:0;right:0;bottom:70px;justify-content:center;gap:10px;pointer-events:none">${d.party.map((f) => mini(f, 64)).join('')}</div>` : '')
    + '<div class="abs sm" style="right:20px;bottom:18px;color:#fff"><kbd>Esc</kbd>skip</div>';
}
