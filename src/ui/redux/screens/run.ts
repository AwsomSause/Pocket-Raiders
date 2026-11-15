// New UI screens for starting a run, ported from the mock-ups' `form`, `starter` and `brief` templates.

import { act, B, bg, esc, facts, foot, H, mini, mon, nodeDot, TX, ty, TYPE_COLORS, W, type Area } from '../kit';
import type { ReduxCtx } from '../stage';

export interface FormModel {
  title: string;
  area?: Area;
  heading: string;
  /** Buttons under the keys: label, action argument, and which one is lit. */
  buttons: readonly (readonly [string, string])[];
  primary: number;
  /** The key drawn lit (the last one typed), if any. */
  lit?: string;
  text: string;
  hints?: readonly (readonly [string, string])[];
}

const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
const over = (_i: number): string => ' data-over="over"';

export const FORM_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123'.split('');

/** The mock-ups' `form` template. The value box is left empty: the scene lays its real text box over `.rx-field`. */
export function formView(_c: ReduxCtx, d: FormModel): string {
  return H(d.title, d.area ?? 'run', d.hints) + `<div class="abs col cen" style="left:0;right:0;top:86px;gap:16px"><b style="font-size:21px">${esc(d.heading)}</b>${W('<b style="font-size:26px;line-height:40px;letter-spacing:.12em;visibility:hidden">X</b>', 'width:520px;display:flex;justify-content:center;gap:4px;padding:14px', 'rx-field')}<div style="display:grid;grid-template-columns:repeat(10,34px);gap:7px">${FORM_KEYS.map((ch) => `<span class="key"${ch === d.lit ? ' style="background:var(--acc);color:#14161e"' : ''}${act('key', ch)}>${ch}</span>`).join('')}</div><div class="row">${d.buttons.map(([label, arg], k) => B(esc(label), k === d.primary, '', '', act('btn', arg))).join('')}</div></div>` + TX(esc(d.text));
}

export interface StarterPick { name: string; file: string | null; types: readonly string[]; stats: string; moves: string }
export interface StarterModel {
  title: string;
  picks: readonly StarterPick[];
  on: number;
  /** Silhouettes named "???" (the mock-ups' Blind Draft). */
  blind?: boolean;
  /** The line under the header in the old UI: trainer and seed. */
  sub: string;
  hints?: readonly (readonly [string, string])[];
}

/** The mock-ups' `starter` template: A three balls on the lab table, B three cards, C the three out on the grass. */
export function starterView(c: ReduxCtx, d: StarterModel): string {
  const v = c.v(3), S = d.picks, on = d.on, cur = S[on]!, blind = !!d.blind;
  const head = H(d.title, 'run', d.hints ?? [['←→', 'look'], ['Enter', 'take'], ['Esc', 'menu']]);
  const pic = (p: StarterPick, k: number, play: boolean): string => (p.file ? mon(p.file, k, blind ? 'sil' : '', play) : '');
  const types = (p: StarterPick): string => `<div class="row" style="gap:4px">${p.types.map(ty).join('')}</div>`;
  const kind = (p: StarterPick): string => p.types.map(cap).join(' and ');
  const yesNo = (bottom: number): string => `<div class="abs col" style="right:30px;bottom:${bottom}px;gap:8px;width:120px">${B('Yes', true, '', '', act('yes'))}${B('No', false, '', '', act('no'))}</div>`;
  if (v === 1) {
    return head + `<div class="abs row" style="left:40px;right:40px;top:80px;gap:22px">${S.map((p, k) => W(`<div class="cell" style="width:150px;height:150px;background:${TYPE_COLORS[cap(p.types[0] ?? '')] ?? '#888'}40">${pic(p, 2.4, k === on)}</div><b style="font-size:22px">${blind ? '???' : esc(p.name)}</b>${blind ? '<span class="sm">Blind Draft</span>' : types(p)}<span class="sm" style="text-align:center">${blind ? 'Revealed after you choose' : esc(p.moves)}</span>${blind ? '' : `<div class="row sm" style="gap:8px">${esc(p.stats)}</div>`}`, 'flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;min-width:0', k === on ? 'sel' : '', act('pick', k) + over(k))).join('')}</div>` + TX(blind ? 'Three hidden partners. Trust your gut.' : `${esc(cur.name)}, the ${esc(kind(cur))} Pokémon. Take this one?`);
  }
  if (v === 2) {
    return bg('arenas/grass_bg.png') + S.map((p, k) => `<div${act('pick', k) + over(k)}>${foot(240 + k * 240, 330, pic(p, 3, true))}<div class="abs plate" style="left:${240 + k * 240}px;top:344px;transform:translateX(-50%);${k === on ? 'background:var(--acc);color:#14161e' : ''}">${blind ? '???' : esc(p.name)}</div></div>`).join('') + head
      + `<div class="abs col" style="left:24px;top:70px;gap:5px;max-width:300px">${blind ? '' : `${types(cur)}<span class="sm" style="color:#fff;text-shadow:1px 1px 0 #000">${esc(cur.stats)}</span><span class="sm" style="color:#fff;text-shadow:1px 1px 0 #000">${esc(cur.moves)}</span>`}</div>`
      + TX(`${blind ? 'One of these' : esc(cur.name)} is looking right at you. Take ${blind ? 'it' : esc(cur.name)}?`, 'Prof. Vance') + yesNo(120);
  }
  return head + `<div class="abs" style="left:190px;right:190px;top:250px;height:150px;background:#8a5a34;border-radius:10px;box-shadow:inset 0 0 0 6px #5a3820,0 0 0 4px var(--l),0 10px 0 4px #0005"><div class="abs" style="left:16px;right:16px;top:16px;bottom:16px;background:#3a6a4a;border-radius:6px;box-shadow:inset 0 5px 0 #0004"></div></div>${S.map((_p, k) => `<div class="abs" style="left:${310 + k * 170}px;top:${k === on ? 280 : 300}px;transform:translateX(-50%)"${act('pick', k) + over(k)}><i class="ball" style="--b:60px${k === on ? ';box-shadow:0 0 0 3px #14161e,0 0 0 7px var(--acc)' : ''}"></i></div>`).join('')}<div class="abs" style="left:480px;top:70px;width:180px;height:180px;margin-left:-90px;border-radius:50%;background:${TYPE_COLORS[cap(cur.types[0] ?? '')] ?? '#888'}55;box-shadow:0 0 0 4px var(--f)"></div>${foot(480, 240, pic(cur, 3, true))}<div class="abs col" style="left:40px;top:90px;gap:6px;width:280px"><b style="font-size:24px">${blind ? '???' : esc(cur.name)}</b>${blind ? '' : types(cur)}<span class="sm">${blind ? 'Blind Draft' : esc(cur.stats)}</span>${blind ? '' : `<span class="sm">${esc(cur.moves)}</span>`}</div>`
    + TX(blind ? 'The balls are unmarked. Pick one.' : `${esc(cur.name)}, the ${esc(kind(cur))} Pokémon. Will you take this Pokémon?`) + yesNo(112);
}

export interface BriefModel {
  title: string;
  campaign: string;
  regions: readonly string[];
  /** Short label/value rows in the plan window. */
  facts: readonly (readonly [string, string])[];
  /** First stage: node kinds along the way, its description, and longer notes under it. */
  nodes: readonly string[];
  stage: string;
  notes: readonly (readonly [string, string])[];
  seed: string;
  party: readonly { name: string; file: string | null }[];
  /** 0 Depart, 1 Copy (the cursor). */
  index: number;
  text: string;
}

/** The mock-ups' `brief` template: the plan, the first stage with the seed, the party and Depart. */
export function briefView(_c: ReduxCtx, d: BriefModel): string {
  // The mock-up's plan has three regions and no notes; a long campaign or a run with events gets taller windows and the party row moves down.
  const many = d.regions.length > 4, tall = d.notes.length > 1 || many, h = tall ? 290 : 212;
  const chips = (many ? d.regions.slice(0, 3) : d.regions).map((r, k) => `<span class="tg${k ? ' no' : ''}">${k + 1}. ${esc(r)}</span>`).join('') + (many ? `<span class="tg no">+${d.regions.length - 3} more</span>` : '');
  const notes = many ? [['Region order', d.regions.join(', ')] as const, ...d.notes] : d.notes;
  const plan = W(`<b class="acc" style="font-size:21px">${esc(d.campaign)}</b><div class="row" style="gap:8px;flex-wrap:wrap">${chips}</div>${facts(d.facts)}`, `flex:1;display:flex;flex-direction:column;gap:${tall ? 7 : 10}px;min-width:0;overflow:hidden`);
  const first = W(`<b class="acc" style="font-size:21px">First stage</b><div style="position:relative;height:40px;flex:none">${d.nodes.map((kind, k) => nodeDot(kind, 22 + k * 52, 20)).join('')}</div><div class="sm" style="line-height:20px">${esc(d.stage)}</div><div class="col sm" style="gap:3px;overflow:auto;flex:1;min-height:0;line-height:17px;font-size:13px">${notes.map(([a, b]) => `<div><b class="acc">${esc(a)}</b> ${esc(b)}</div>`).join('')}</div><div class="row"><span class="sm grow">Seed</span><b>${esc(d.seed)}</b><span class="tg${d.index === 1 ? '' : ' no'}"${act('copy')}>Copy</span></div>`, `flex:1;display:flex;flex-direction:column;gap:${tall ? 7 : 10}px;min-width:0`);
  return H(d.title, 'run', [['←→', 'choose'], ['Enter', 'select']]) + `<div class="abs row" style="left:24px;right:24px;top:76px;height:${h}px;gap:20px;align-items:stretch">${plan}${first}</div><div class="abs row" style="left:24px;right:24px;top:${tall ? 392 : 330}px;gap:12px">${d.party.slice(0, 3).map((p) => W(`<div class="row">${p.file ? mini(p.file, 44) : ''}<b>${esc(p.name)}</b></div>`, 'width:232px;padding:6px 12px')).join('')}<span class="grow"></span>${B('Depart', d.index === 0, 'width:180px;justify-content:center', '', act('go'))}</div>` + TX(esc(d.text));
}
