// New UI battle HUD, ported from the mock-ups' `battle` template: the data boxes, the bottom tray (the text box and
// the choices), the page tabs and the small lines over the field. It is drawn over the canvas, which keeps the arena,
// the Pokémon and every animation. Pure drawing; BattleScene keeps the rules, the input and the state.

import { act, esc, facts, hpb, img, TYPE_COLORS, ty, W } from '../kit';
import type { ReduxCtx } from '../stage';
import { type Art, pic, scrollStart } from '../templates';

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
  /** The transform buttons over the move menu (Mega, Tera, Dynamax, Z-Move): the ones this Pokémon can use now. */
  gim?: readonly BattleGimmick[] | null;
  /** The info panel (I): one window per section, left of the field; a single move's details show as the mock-ups' tooltip. */
  panels?: readonly BattlePanel[] | null;
  panelAt?: 'left' | 'tip';
  /** The battle log (H): its filter tabs and the lines of the open one. */
  log?: { tabs: readonly string[]; index: number; lines: readonly string[] } | null;
}

export interface BattleGimmick {
  kind: 'mega' | 'tera' | 'dynamax' | 'zmove';
  on: boolean;
  /** Tera: the row of the Tera type's jewel on the icon sheet. */
  row?: number;
}

const GIM_NAMES: Record<BattleGimmick['kind'], string> = { mega: 'Mega', tera: 'Tera', dynamax: 'Dynamax', zmove: 'Z-Move' };
const gimIcon = (g: BattleGimmick): string =>
  g.kind === 'mega' ? img('packs/ebdx/ui/symMega.png', 0.6) : g.kind === 'dynamax' ? img('packs/dbk/dynamax/icon.png', 0.62) : g.kind === 'tera' ? img('packs/dbk/tera/types.png', 0.66, [0, Math.max(0, g.row ?? 0) * 32, 32, 32]) : '';

export interface BattlePanel {
  head: string;
  /** A mark at the right of the heading ("Special"), or ''. */
  tag?: string;
  /** Type chips under (or beside) the heading. */
  chips: readonly string[];
  /** Plain lines that come first ("Lucario Lv.50"), over the rows. */
  lead?: readonly string[];
  /** Short "name: value" rows. */
  facts: readonly (readonly [string, string])[];
  /** Everything else, as small lines. */
  lines: readonly string[];
}

/**
 * Sorts a panel column's text into the mock-ups' window parts: "Type: Fire / Flying" becomes type chips, a short
 * "name: value" line becomes a facts row, and the rest stays as lines.
 */
export function panelOf(head: string, text: string): BattlePanel {
  const chips: string[] = [], rows: [string, string][] = [], lead: string[] = [], lines: string[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^([^:]{1,18}):\s+(.+)$/.exec(line);
    if (m && /^types?$/i.test(m[1]!)) chips.push(...m[2]!.split(/\s*\/\s*/).filter(Boolean));
    else if (m && m[2]!.length <= 26) rows.push([m[1]!, m[2]!]);
    else (rows.length ? lines : lead).push(line);
  }
  // With no rows at all, everything is just lines.
  return rows.length ? { head, chips, lead, facts: rows, lines } : { head, chips, facts: rows, lines: lead };
}

const panelBody = (p: BattlePanel, tip: boolean): string =>
  `<div class="row"><b class="acc grow">${esc(p.head)}</b>${tip ? p.chips.map(ty).join('') : ''}${p.tag ? `<span class="tg" style="font-size:11px;padding:1px 6px">${esc(p.tag)}</span>` : ''}</div>${!tip && p.chips.length ? `<div class="row" style="gap:6px">${p.chips.map(ty).join('')}</div>` : ''}${(p.lead ?? []).map((t) => `<div style="font-size:14px;font-weight:700">${esc(t)}</div>`).join('')}${facts(p.facts)}${p.lines.map((t) => `<div class="sm" style="line-height:19px">${esc(t)}</div>`).join('')}`;


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
  // The info panel and the log sit over the field, clear of the tray; a click closes them.
  const room = 540 - 92 - top - 12 - (d.tabs && v !== 2 ? 34 : 0);
  const win = 'display:flex;flex-direction:column;gap:6px;padding:10px 12px;cursor:pointer';
  const panels = !d.panels?.length ? ''
    : d.panelAt === 'tip'
      ? W(panelBody(d.panels[0]!, true), `position:absolute;right:60px;bottom:${Math.max(150, top + (d.tabs ? 42 : 8) + 34)}px;width:330px;${win};padding:10px 14px;z-index:8`, '', act('info'))
      : `<div class="abs" style="left:20px;top:92px;height:${room}px;display:flex;flex-direction:column;flex-wrap:wrap;align-content:flex-start;gap:8px 6px;z-index:8"${act('info')}>${d.panels.map((p) => W(panelBody(p, false), `width:${d.panels!.length > 2 ? 284 : 310}px;${win}`)).join('')}</div>`;
  const log = d.log ? W(`<div class="tabs" style="margin-bottom:6px">${d.log.tabs.map((t, k) => `<span class="${k === d.log!.index ? 'on' : ''}" style="cursor:pointer"${act('log', k)}>${esc(t)}</span>`).join('')}</div>${d.log.lines.length ? d.log.lines.map((l) => `<span class="sm">${esc(l)}</span>`).join('') : '<span class="sm" style="opacity:.7">Nothing here yet.</span>'}`, `position:absolute;left:20px;top:92px;width:430px;max-height:${room}px;overflow:hidden;${win.replace(';cursor:pointer', '')};z-index:8`) : '';
  // The transform buttons sit over the tray, across from the page tabs.
  const gimAt = v === 2 ? 'right:40px;bottom:132px' : v === 3 ? `right:20px;bottom:${Math.max(222, top + 8) + 42}px` : `left:20px;bottom:${Math.max(v === 1 ? 138 : 128, top + 8)}px`;
  const gim = d.gim?.length ? `<div class="abs row" style="${gimAt};gap:8px;z-index:3">${d.gim.map((g, k) => `<div class="btn${g.on ? ' on' : ''}" style="height:34px;font-size:14px;padding:0 10px"${act('gim', k)}>${gimIcon(g)}${GIM_NAMES[g.kind]}</div>`).join('')}</div>` : '';
  return head + tray + tabs + gim + header + momentum + status + note + pin + panels + log;
}

export interface BattleListRow {
  label: string;
  art: Art | null;
  /** HP left, 0 to 1, for a Pokémon; null for an item. */
  hp: number | null;
  /** A short mark for a Pokémon ("IN BATTLE", "FNT", "✔ +20 HP"), or the count of an item ("×3"). */
  tag: string;
  off: boolean;
}

export interface BattleListModel {
  /** The window's first line ("Switch to…"); left out when it has pocket tabs. */
  title: string;
  /** A small line under the rows (a key hint), or ''. */
  note: string;
  tabs: { labels: readonly string[]; index: number } | null;
  n: number;
  row: (i: number) => BattleListRow;
  index: number;
  /** Where the window's top edge sits (under the foe's box; lower when several foes are out). */
  top?: number;
  /** The player can step back out of it (a small Back line shows). */
  back?: boolean;
}

/** "Bag  (P pins to the hotbar)": the title, and the words in brackets as a small note. */
export function windowTitle(title: string): { title: string; note: string } {
  const m = /^(.*?)\s*\((.*)\)\s*$/.exec(title);
  return m ? { title: m[1]!.trim(), note: m[2]!.trim() } : { title: title.trim(), note: '' };
}

/** Rows the battle's Party and Item windows show at once. */
export const BATTLE_LIST_ROWS = 6;

/** "×3" reads as "× 3", the way the mock-ups write a count. */
const countText = (t: string): string => t.replace(/^[×x]\s*(\d+)$/, '× $1');

/** The battle's Party and Item windows (the mock-ups' overlays): a small window over the field, left of the arena. */
export function battleListView(_c: ReduxCtx, d: BattleListModel): string {
  const n = Math.max(0, d.n), index = Math.max(0, Math.min(n - 1, d.index));
  const s = scrollStart(n, index, BATTLE_LIST_ROWS), end = Math.min(n, s + BATTLE_LIST_ROWS);
  const items = d.tabs !== null;
  const tabs = d.tabs ? `<div class="tabs" style="margin-bottom:6px;flex-wrap:wrap">${d.tabs.labels.map((t, k) => `<span class="${k === d.tabs!.index ? 'on' : ''}" style="cursor:pointer"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';
  const rows = Array.from({ length: end - s }, (_, q) => {
    const i = s + q, r = d.row(i);
    const right = r.hp === null ? (r.tag ? `<span class="sm">${esc(countText(r.tag))}</span>` : '') : `${r.tag ? `<span class="tg" style="font-size:11px;padding:1px 6px;white-space:nowrap">${esc(r.tag)}</span>` : ''}${hpb(pct(r.hp), r.tag.length > 10 ? 54 : 90)}`;
    return `<div class="row" style="gap:8px;margin:0 -6px;padding:0 6px;border-radius:5px;cursor:pointer;${i === index ? 'background:var(--p2);box-shadow:0 0 0 2px var(--acc);' : ''}${r.off ? 'opacity:.5;' : ''}"${act('pick', i)} data-over="over">${pic(r.art, items ? 30 : 34)}<b class="grow" style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.label)}</b>${right}</div>`;
  }).join('');
  const none = n ? '' : '<div class="sm" style="opacity:.7">Nothing here.</div>';
  const where = n > BATTLE_LIST_ROWS ? `${s + 1}–${end} of ${n}` : '';
  const foot = where || d.note || d.back ? `<div class="row sm" style="gap:8px;opacity:.8"><span class="grow">${esc([where, d.note].filter(Boolean).join(' · '))}</span>${d.back ? `<span style="cursor:pointer"${act('back')}><kbd>Esc</kbd>back</span>` : ''}</div>` : '';
  return W(`${tabs}${d.title && !items ? `<b class="acc">${esc(d.title)}</b>` : ''}${rows}${none}${foot}`, `position:absolute;left:20px;top:${d.top ?? 92}px;width:330px;display:flex;flex-direction:column;gap:${items ? 7 : 5}px;padding:10px 12px;z-index:4`);
}
