// New UI battle HUD, ported from the mock-ups' `battle` template: the data boxes, the bottom tray (the text box and
// the choices), the page tabs and the small lines over the field. It is drawn over the canvas, which keeps the arena,
// the Pokémon and every animation. Pure drawing; BattleScene keeps the rules, the input and the state.

import { act, esc, hpb, TYPE_COLORS, W } from '../kit';
import type { ReduxCtx } from '../stage';

export interface BattleBox {
  name: string;
  /** "Lv 50", or "Lv ?" for a hidden foe. */
  level: string;
  /** HP on screen, 0 to 1 (the scene animates it down). */
  hp: number;
  /** "163 / 163" for your own Pokémon; '' for a foe. */
  hpText: string;
  /** Exp towards the next level, 0 to 1; null leaves the strip out (a foe). */
  xp: number | null;
  /** Short marks beside the name: a status, Tera, Dynamax, a raid role. */
  tags: readonly string[];
  /** The foe Trainer's team as balls: how many, and how many have fainted. Null for a wild Pokémon or your side. */
  team: { n: number; out: number } | null;
}

export interface BattleOption { label: string; sub?: string; type?: string; off?: boolean }

export interface BattleModel {
  /** One box per Pokémon on the field, in field order (one in a single battle, up to three). */
  foes: readonly BattleBox[];
  mine: readonly BattleBox[];
  /** The text box ('' while nothing is said and no menu needs it). */
  text: string;
  menu: { options: readonly BattleOption[]; index: number } | null;
  /** The page tabs: Attack, Party, Item, then Auto and Info. Null while they are hidden. */
  tabs: { labels: readonly string[]; index: number; auto: boolean; autoOff: boolean } | null;
  /** Small lines over the field: the run header (top right), a status line and a flash note (top left). */
  header: string;
  status: string;
  momentum: string;
  note: string;
  /** Auto-Battle is playing: the AUTO pin shows. */
  auto: boolean;
  /** Your own party as balls (the top-bar layout shows them under your name): how many, and how many have fainted. */
  party: { n: number; out: number } | null;
}

const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
const pct = (r: number): number => Math.max(0, Math.min(100, Math.round(r * 100)));
const balls = (n: number, out: number, b: number): string => `<div class="row" style="gap:5px">${Array.from({ length: Math.max(0, Math.min(6, n)) }, (_, k) => `<i class="ball${k >= n - out ? ' out' : ''}" style="--b:${b}px"></i>`).join('')}</div>`;
const tags = (b: BattleBox): string => b.tags.map((t) => `<span class="tg" style="font-size:11px;padding:1px 6px">${esc(t)}</span>`).join('');
/** HP colour by what is left: green, yellow under half, red under a fifth (the mock-ups' bar). */
const bar = (r: number): string => hpb(pct(r));

/** One data box: name and level, the HP bar, and for your own Pokémon the HP numbers and the Exp strip. */
function box(b: BattleBox, foe: boolean, st: string, small = false): string {
  const mine = foe ? '' : `${b.hpText ? `<div class="row sm"><span class="grow">${esc(b.hpText)}</span></div>` : ''}${b.xp === null ? '' : hpb(pct(b.xp), 0, ' xp')}`;
  return W(`<div class="row" style="gap:6px"><b class="grow" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis${small ? ';font-size:14px' : ''}">${esc(b.name)}</b>${tags(b)}<span class="sm">${esc(b.level)}</span></div><div class="row" style="gap:6px"><span style="font-size:12px;font-weight:700">HP</span>${bar(b.hp)}</div>${small ? '' : mine}`, `position:absolute;width:${small ? 240 : 290}px;padding:${small ? '5px 10px' : '8px 12px'};display:flex;flex-direction:column;gap:5px;${st}`, 'glass');
}

/** How tall the tray's choices stand over the bottom edge, so the player's box and the tabs can sit above them. */
export function trayHeight(v: number, n: number): number {
  if (n === 0) return v === 1 ? 128 : 116;
  if (v === 2) return 70;
  if (v === 3) return 16 + n * (n > 4 ? 34 : 44) + (n - 1) * (n > 4 ? 6 : 8);
  const rows = Math.ceil(n / 2), cell = rows > 2 ? 34 : 44, gap = rows > 2 ? 6 : v === 1 ? 8 : 12;
  return Math.max(v === 1 ? 128 : 116, (v === 1 ? 28 : 16) + rows * cell + (rows - 1) * gap);
}

export function battleView(c: ReduxCtx, d: BattleModel): string {
  const v = c.v(4), opts = d.menu?.options ?? [], n = opts.length, on = d.menu?.index ?? -1;
  const many = v === 3 ? n > 4 : Math.ceil(n / 2) > 2;
  const cell = (o: BattleOption, k: number, st = ''): string => {
    const tc = o.type ? TYPE_COLORS[cap(o.type)] : undefined;
    return `<div class="btn${k === on ? ' on' : ''}${tc ? ' mv' : ''}" style="${tc ? `--tc:${tc};` : ''}${o.off ? 'opacity:.5;' : ''}${many ? 'font-size:15px;' : ''}min-width:0;${st}"${act('pick', k)} data-over="over"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">${esc(o.label)}</span>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</div>`;
  };
  const msg = esc(d.text).replace(/\n/g, '<br>');
  const h = many ? 34 : 44;
  let tray: string;
  if (v === 2) {
    tray = (d.text ? `<div class="abs txt" style="left:180px;right:180px;bottom:${n ? 84 : 20}px;text-align:center;padding:6px 16px">${msg}</div>` : '')
      + (n ? `<div class="abs row" style="left:40px;right:40px;bottom:20px;gap:${n > 5 ? 6 : 12}px">${opts.map((o, k) => cell(o, k, `flex:1;height:50px${n > 5 ? ';font-size:13px;padding:0 6px' : ''}`)).join('')}</div>` : '');
  } else if (v === 3) {
    tray = (d.text ? `<div class="abs txt" style="left:20px;width:${n ? 600 : 920}px;bottom:16px">${msg}</div>` : '')
      + (n ? `<div class="abs col" style="right:20px;bottom:16px;width:250px;gap:${many ? 6 : 8}px">${opts.map((o, k) => cell(o, k, many ? `height:${h}px` : '')).join('')}</div>` : '');
  } else if (v === 1) {
    const tall = trayHeight(1, n);
    tray = `<div class="abs win" style="left:0;right:0;bottom:0;height:${tall}px;padding:0"><div class="abs" style="left:22px;top:18px;width:${n ? 470 : 900}px;font-size:20px;line-height:27px">${msg}</div>${n ? `<div class="abs" style="right:16px;top:14px;width:410px;display:grid;grid-template-columns:1fr 1fr;gap:${many ? 6 : 8}px">${opts.map((o, k) => cell(o, k, many ? `height:${h}px` : '')).join('')}</div>` : ''}</div>`;
  } else {
    tray = (d.text || n ? `<div class="abs txt" style="left:20px;${n ? 'width:480px' : 'right:20px'};bottom:16px;height:100px">${msg}</div>` : '')
      + (n ? `<div class="abs" style="right:20px;bottom:16px;width:410px;display:grid;grid-template-columns:1fr 1fr;gap:${many ? '6px' : '12px 10px'}">${opts.map((o, k) => cell(o, k, `height:${h}px`)).join('')}</div>` : '');
  }
  const top = trayHeight(v, n);
  // The player's box sits over the tray; a tall menu pushes it up.
  const mineAt = v === 3 ? 'left:20px;bottom:' + Math.max(104, d.text ? 104 : 0) + 'px' : `right:20px;bottom:${Math.max(v === 1 ? 140 : 136, v === 2 ? 0 : top + 20 + (d.tabs ? 34 : 0))}px`;
  let head: string;
  const duo = d.foes.length > 1 || d.mine.length > 1;
  if (duo) {
    const gy = Math.max(v === 1 ? 138 : v === 2 ? 148 : 128, top + (d.tabs ? 34 : 0));
    head = d.foes.map((b, k) => box(b, true, `left:20px;top:${20 + k * 58}px`, true)).join('') + d.mine.map((b, k) => box(b, false, `right:20px;bottom:${gy + 12 + (d.mine.length - 1 - k) * 58}px`, true)).join('');
  } else if (v === 2) {
    const me = d.mine[0], foe = d.foes[0];
    const half = (b: BattleBox | undefined, flip: boolean): string => {
      if (!b) return '<span class="grow"></span>';
      const parts = [`<b style="white-space:nowrap">${esc(b.name)}</b>`, tags(b), `<span class="sm" style="white-space:nowrap">${esc(b.level)}</span>`, `<div class="grow">${bar(b.hp)}</div>`];
      return (flip ? parts.reverse() : parts).join('');
    };
    head = `<div class="abs win row" style="left:0;right:0;top:0;height:64px;padding:0 20px;gap:14px">${half(me, false)}<span class="vsx" style="font-size:34px">VS</span>${half(foe, true)}</div><div class="abs row" style="left:20px;top:72px;gap:10px">${d.party ? balls(d.party.n, d.party.out, 18) : ''}${me?.hpText ? `<span class="sm" style="color:#fff;text-shadow:1px 1px 0 #000">${esc(me.hpText)}</span>` : ''}</div>${foe?.team ? `<div class="abs" style="right:20px;top:72px">${balls(foe.team.n, foe.team.out, 18)}</div>` : ''}`;
  } else {
    const foe = d.foes[0], me = d.mine[0];
    head = (foe ? box(foe, true, `left:20px;top:${v === 3 ? 20 : 26}px`) + (foe.team ? `<div class="abs" style="left:30px;top:${v === 3 ? 82 : 88}px">${balls(foe.team.n, foe.team.out, 14)}</div>` : '') : '') + (me ? box(me, false, mineAt) : '');
  }
  const tabsAt = v === 3 ? `right:20px;bottom:${Math.max(222, top + 8)}px` : v === 2 ? 'left:40px;bottom:132px' : `right:20px;bottom:${Math.max(v === 1 ? 138 : 128, top + 8)}px`;
  const tabs = d.tabs ? `<div class="abs tabs" style="${tabsAt};z-index:3">${d.tabs.labels.map((t, k) => { const auto = t === 'Auto'; return `<span class="${k === d.tabs!.index || (auto && d.tabs!.auto) ? 'on' : ''}" style="cursor:pointer${auto && d.tabs!.autoOff ? ';opacity:.45' : ''}"${act('tab', k)}>${esc(t)}</span>`; }).join('')}</div>` : '';
  const line = 'color:#fff;text-shadow:2px 2px 0 #000,-1px -1px 0 #000;pointer-events:none';
  const top2 = v === 2 && !duo ? 70 : 0;
  const header = d.header ? `<div class="abs sm" style="right:16px;top:${8 + top2}px;text-align:right;white-space:pre-line;${line}">${esc(d.header)}</div>` : '';
  const momentum = d.momentum ? `<div class="abs sm" style="right:16px;top:${duo ? 8 : 236}px;text-align:right;white-space:pre-line;${line}">${esc(d.momentum)}</div>` : '';
  const status = d.status ? `<div class="abs sm" style="left:20px;top:${duo ? 20 + d.foes.length * 58 : v === 2 ? 98 : 120}px;max-width:470px;white-space:pre-line;${line}">${esc(d.status)}</div>` : '';
  const note = d.note ? `<div class="abs" style="left:50%;top:${v === 2 && !duo ? 100 : 60}px;transform:translateX(-50%);max-width:560px;z-index:5;pointer-events:none"><span class="tg" style="white-space:normal">${esc(d.note)}</span></div>` : '';
  const pin = d.auto ? `<div class="abs btn on" style="left:50%;top:${v === 2 && !duo ? 76 : 20}px;transform:translateX(-50%);height:32px;font-size:14px"${act('auto')}>AUTO ▶▶</div>` : '';
  return head + tray + tabs + header + momentum + status + note + pin;
}
