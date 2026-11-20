// DOMINION slice D27: the Boss Menu (v4 mockup m1) and Settings (m2: the Dominion tab, Effects & motion, and the game's
// other categories in the same list). Ported from plans/evil-mode-rework/mockups-v4/index.html #m1 and #m2; the classes
// (.blade, .seg, .tg, .srow, .cat, .tile, .quote, .throne) are in dominion.css. Plain data in; the controller keeps the
// cursors and changes the settings.

import './fx.css';
import type { BossMenuModel } from '../../../../core/dominion/bossMenu';
import { act, esc, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { stage, WHEEL_KEY } from './views';
import { warehouseUrl } from './paint';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const ic = (f: string, cls = 'ic'): string => `<img class="${cls}" src="${img(f)}" alt="">`;

/** Overlays every v4 stage ends with (mockup m1/m2): haze, grade, edge glow, ornament. */
const DRESS = '<div class="haze" aria-hidden="true" style="--hz:#c9a0ff;--hz2:#ff7ab8"></div><div class="grade" aria-hidden="true" style="--g1:#c9a0ff;--g2:#ff7ab8"></div><div class="edgeglow" aria-hidden="true" style="--eg:#c9a0ff"></div><div class="orn" aria-hidden="true"></div>';

function noticeBox(n: string | null): string {
  return n ? `<div class="a" style="left:300px;top:44px;width:620px;z-index:30;background:rgba(14,6,28,.92);border:2px solid #c9a0ff;border-radius:8px;padding:6px 12px;font-size:14px;line-height:1.3" data-act="dismiss" data-testid="dom-menu-notice">${esc(n)}</div>` : '';
}

// ---------- m1: the Boss Menu ----------

export function bossMenuView(m: BossMenuModel, boss: string | null): string {
  const g = m.glance;
  const blades = m.blades.map((b, i) => `<div class="blade${i === m.at ? ' on' : ''}${b.dim ? ' dim' : ''}"${act('menuBlade', i)} data-over="menuOver" data-testid="dom-blade-${b.id}" style="cursor:pointer"><span class="bi">${ic(b.icon)}</span><span class="bl">${esc(b.label)}${b.sub ? `<small>${esc(b.sub)}</small>` : ''}</span><span class="kc">${esc(b.key)}</span></div>`).join('');
  const hero = g.hero ? `<div class="row sp"><span class="row" style="gap:6px"><img src="${rxUrl(g.hero.look)}" alt="" style="width:20px;height:22px;object-fit:cover;object-position:top" class="px">Hero · ${esc(g.hero.name)}</span><b class="rd">Threat ${g.hero.threat}</b></div>` : '<div class="row sp"><span class="mu">The Hero</span><b class="mu">not yet</b></div>';
  const alert = g.alert ? `<div class="al ${g.alert.hot ? 'r' : 'y'}" style="margin-top:4px">${ic('g-meteorite')}<div><span class="t">${esc(g.alert.tag)}</span>${esc(g.alert.text)}</div></div>` : '';
  return stage(`<img class="cv" src="${warehouseUrl(false)}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.3) saturate(.6) blur(2px)">
  <div class="layer" style="background:radial-gradient(380px 420px at 150px 330px,rgba(160,90,255,.35),transparent 70%),linear-gradient(90deg,rgba(10,4,24,.2),rgba(10,4,24,.75) 55%,rgba(10,4,24,.85))"></div>
  <div class="cone" style="left:40px;top:0;width:230px;height:520px;--cc:rgba(190,140,255,.42)"></div>
  <div class="crest-rim" style="left:96px;top:96px;--s:110px"></div><div class="crest" style="left:101px;top:101px;--s:110px;opacity:.9">${esc(m.top.initial || 'N')}</div>
  <div class="throne" style="left:56px;top:196px;width:182px;height:300px"></div><img class="spr" src="${img('p-persian')}" alt="Persian" style="left:196px;top:410px;width:97px;height:87px;z-index:7"><div class="shd" style="left:64px;top:478px;width:230px;height:30px"></div>
  ${boss ? `<div class="a" style="left:84px;top:236px;z-index:6" data-testid="dom-menu-boss">${tall(boss, 245)}</div>` : ''}
  <div class="ttl" style="--t1:#5b1fb0;--t2:#c9338f" data-testid="dom-menu-title">Boss Menu <span class="sub">· Paused</span></div>
  <div class="keys" data-testid="dom-menu-keys">${WHEEL_KEY}<span class="key">Esc</span><span>Back to the game</span></div>
  <div class="a col" style="left:300px;top:76px;width:300px;gap:6px;z-index:20" data-testid="dom-blades">${blades}</div>
  <div class="pnl gild" style="left:630px;top:78px;width:314px;height:330px" data-testid="dom-glance">
    <div class="hd y">${ic('g-relic-crown')}Empire at a glance</div>
    <div class="col" style="gap:7px;font-size:15px">
      <div class="row sp"><span class="mu">${esc(g.when)}</span><b class="y num" style="font-size:22px" data-testid="dom-glance-funds">${esc(g.funds)}</b></div>
      <div class="row sp"><span>Heat</span><b class="rd">${g.heat}%</b></div><div class="mt heat t" style="--v:${g.heat}"></div>
      <div class="row sp"><span>♥ Regard · Dread</span><b><span class="gn">${g.regard}</span> · <span class="vi">${g.dread}</span></b></div>
      <div class="row sp"><span>${esc(g.goal)}</span><b class="y">${g.goalPct}%</b></div><div class="mt v t" style="--v:${g.goalPct}"></div>
      ${hero}
      ${alert}
    </div>
  </div>
  <div class="pnl dim" style="left:630px;top:420px;width:314px;height:62px;padding:8px 14px" data-testid="dom-menu-slot">
    <div class="row sp" style="font-size:14px"><span class="row" style="gap:8px">${ic('g-storage-key')}<span><b>${esc(m.slot.line)}</b><br><span class="xs dm">${esc(m.slot.sub)}</span></span></span><span class="pill g">SAFE</span></div>
  </div>
  <div class="quote" style="left:300px;top:500px;width:620px" data-testid="dom-menu-quote">“${esc(m.quote)}” <b>— the Boss</b></div>
  ${noticeBox(m.notice)}
  ${DRESS}`, 'background:#0b0618', 'kl-violet vign grain');
}

// ---------- m2: Settings ----------

export interface SegOpt { label: string; on: boolean; lock?: boolean }
export interface SetRowView {
  label: string;
  sub?: string;
  /** seg: a segmented choice; tg: a switch; val: the game's own setting (its value, ◀ ▶ cycles); btn: press Enter. */
  kind: 'seg' | 'tg' | 'val' | 'btn' | 'pill';
  opts?: SegOpt[];
  on?: boolean;
  value?: string;
  lock?: boolean;
}
export interface SettingsCat { id: string; label: string; icon: string }
export interface SettingsPageModel {
  cats: SettingsCat[];
  cat: number;
  /** Where the arrows are: the category list or the rows. */
  focus: 'cats' | 'rows';
  row: number;
  /** The Dominion tab: the run rows (left panel) and the Effects & motion rows (right panel) share one cursor. */
  run?: SetRowView[];
  fx: { level: 'full' | 'lighter' | 'calm'; rows: SetRowView[]; linked: boolean; why: string[]; now: string };
  /** Any other tab: one list of rows (scrolled to keep the cursor in view). */
  rows?: SetRowView[];
  head: string;
  headNote: string;
  side?: string[];
  notice: string | null;
}

function control(r: SetRowView, i: number): string {
  if (r.kind === 'seg') return `<span class="seg">${(r.opts ?? []).map((o, j) => `<span class="${o.on ? 'on' : ''}"${o.lock ? ' style="opacity:.45"' : act('setPick', `${i}:${j}`)}>${esc(o.label)}${o.lock ? ' 🔒' : ''}</span>`).join('')}</span>`;
  if (r.kind === 'tg') return `<span class="tg${r.on ? ' on' : ''}"${act('setRow', i)} style="cursor:pointer"></span>`;
  if (r.kind === 'pill') return `<span class="pill v">${esc(r.value ?? '')}</span>`;
  if (r.kind === 'btn') return `<span class="pill y"${act('setRow', i)} style="cursor:pointer">${esc(r.value ?? 'Enter')}</span>`;
  return `<span class="row" style="gap:6px"><span class="kc"${act('setLeft', i)} style="cursor:pointer">◀</span><b class="y" style="min-width:90px;text-align:center">${esc(r.value ?? '')}</b><span class="kc"${act('setRight', i)} style="cursor:pointer">▶</span></span>`;
}

function rowsHtml(rows: SetRowView[], sel: number, base = 0): string {
  return rows.map((r, k) => {
    const i = base + k;
    return `<div class="srow${i === sel ? ' sel' : ''}${r.lock ? ' lock' : ''}"${act('setAt', i)} data-testid="dom-set-row-${i}"><span>${esc(r.label)}${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</span>${control(r, i)}</div>`;
  }).join('');
}

const TILES: [string, string, string, string][] = [
  ['full', 'Full show', 'every effect', 'radial-gradient(circle at 30% 30%,#ffd23f 0 4px,transparent 5px),radial-gradient(circle at 70% 60%,#ff7ab8 0 3px,transparent 4px),linear-gradient(150deg,#7a3cf0,#1a0f3a)'],
  ['lighter', 'Lighter', 'no particles', 'radial-gradient(circle at 30% 30%,#ffd23f 0 3px,transparent 4px),linear-gradient(150deg,#4a2a90,#1a0f3a)'],
  ['calm', 'Calm', 'no motion', 'linear-gradient(180deg,#2a3352,#1a2038)'],
];

function tiles(level: string, sel: boolean, big: boolean): string {
  const h = big ? 132 : 100, mw = big ? 110 : 72, mh = big ? 62 : 42;
  return TILES.map(([id, name, sub, bg]) => `<div class="tile${id === level ? ' on' : ''}" style="height:${h}px;justify-content:flex-start;padding-top:6px;cursor:pointer${sel ? ';box-shadow:0 0 0 3px var(--ink),0 0 0 6px rgba(255,210,63,.55)' : ''}"${act('fxLevel', id)} data-testid="dom-fx-${id}"><div class="mini" style="width:${mw}px;height:${mh}px;background:${bg}"></div><b>${name}</b><span>${sub}</span></div>`).join('');
}

/** A small live preview: coins, sparks, a siren and a jolt, each turned down by the same classes as the real screens. */
const PREVIEW = `<div class="a" style="left:14px;right:14px;top:58px;height:150px;border-radius:10px;overflow:hidden;background:linear-gradient(160deg,#2a1450,#0b0618);box-shadow:0 0 0 3px var(--ink)" data-testid="dom-fx-preview">
  <i class="pt coin" style="left:30px;--t:2.6s;--dl:-.4s"></i><i class="pt coin" style="left:90px;--t:3.1s;--dl:-1.6s"></i><i class="pt coin" style="left:160px;--t:2.2s;--dl:-.9s"></i>
  <i class="pt spark" style="left:60px;top:40px;--t:1.8s;--dl:-.3s"></i><i class="pt spark" style="left:200px;top:80px;--t:2.4s;--dl:-1.1s"></i>
  <div class="sirenL" style="left:0;top:0;width:50%;height:100%"></div><div class="sirenR" style="left:50%;top:0;width:50%;height:100%"></div>
  <img class="spr jolt" src="${img('p-persian')}" alt="" style="left:96px;top:64px;width:78px;height:70px">
</div>`;

export function settingsPageView(m: SettingsPageModel): string {
  // Ten tabs (D28 added Controls) are a row more than the mockup's list holds above its footer: draw them a little tighter.
  const tight = m.cats.length > 9 ? ';padding:4px 10px' : '';
  const cats = m.cats.map((c, i) => `<div class="cat${i === m.cat ? ' on' : ''}"${act('setCat', i)} style="cursor:pointer${tight}" data-testid="dom-set-cat-${c.id}">${ic(c.icon, 'ic s')}${esc(c.label)}</div>`).join('');
  const catPanel = `<div class="pnl dim" style="left:16px;top:76px;width:196px;height:448px;padding:10px${m.focus === 'cats' ? ';box-shadow:0 0 0 3px var(--ink),0 0 0 6px rgba(255,210,63,.45)' : ''}" data-testid="dom-set-cats">
    <div class="col" style="gap:${tight ? 2 : 5}px">${cats}</div>
    <div class="a xs dm" style="left:12px;right:12px;bottom:12px;line-height:1.35">Changes save at once. <span class="kc">D</span> resets this tab.</div>
  </div>`;
  const cat = m.cats[m.cat]!;
  const rowSel = m.focus === 'rows' ? m.row : -1;
  let body = '';
  if (m.run) {
    const nRun = m.run.length;
    const fxSel = rowSel >= nRun ? rowSel - nRun : -1;
    body = `<div class="pnl" style="left:228px;top:76px;width:390px;height:448px" data-testid="dom-set-run">
      <div class="hd">${ic('g-relic-crown')}Your run<span class="r">new runs only</span></div>
      ${rowsHtml(m.run, rowSel)}
    </div>
    <div class="pnl gild" style="left:632px;top:76px;width:312px;height:448px" data-testid="dom-set-fx">
      <div class="hd y">${ic('g-star-piece')}Effects &amp; motion</div>
      <div class="a" style="left:14px;right:14px;top:58px;display:grid;grid-template-columns:repeat(3,1fr);gap:9px">${tiles(m.fx.level, fxSel === 0, false)}</div>
      <div class="a col tight" style="left:14px;right:14px;top:170px">
        ${rowsHtml(m.fx.rows.slice(1), rowSel, nRun + 1)}
        <div class="srow" style="border:0"><span>Follows the game's Motion setting${m.fx.linked ? `<small>${esc(m.fx.why.join(' '))}</small>` : ''}</span><span class="pill v" data-testid="dom-fx-linked">${m.fx.linked ? 'LINKED · ON' : 'LINKED'}</span></div>
      </div>
    </div>`;
  } else if (cat.id === 'fx') {
    body = `<div class="pnl gild" style="left:228px;top:76px;width:390px;height:448px" data-testid="dom-set-fx">
      <div class="hd y">${ic('g-star-piece')}Effects &amp; motion<span class="r">${esc(m.fx.now)}</span></div>
      <div class="a" style="left:14px;right:14px;top:58px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${tiles(m.fx.level, rowSel === 0, true)}</div>
      <div class="a col tight" style="left:14px;right:14px;top:206px">${rowsHtml(m.fx.rows.slice(1), rowSel, 1)}</div>
    </div>
    <div class="pnl" style="left:632px;top:76px;width:312px;height:448px">
      <div class="hd">${ic('g-scope-lens')}Preview</div>
      ${PREVIEW}
      <div class="a col" style="left:14px;right:14px;top:222px;gap:6px;font-size:14px;line-height:1.35">
        <div class="row sp"><span>Follows the game's Motion setting</span><span class="pill v" data-testid="dom-fx-linked">${m.fx.linked ? 'LINKED · ON' : 'LINKED'}</span></div>
        ${(m.fx.why.length ? m.fx.why : ["The game's Motion, Flash and Particle settings allow every effect."]).map((w) => `<div class="mu">${esc(w)}</div>`).join('')}
        <div class="xs dm">Effects never change what happens: a skipped cut-in or a still screen plays the same day.</div>
      </div>
    </div>`;
  } else {
    const rows = m.rows ?? [];
    const per = 10;
    const top = Math.max(0, Math.min(rows.length - per, (m.focus === 'rows' ? m.row : 0) - 4));
    body = `<div class="pnl" style="left:228px;top:76px;width:${m.side ? 450 : 716}px;height:448px" data-testid="dom-set-list">
      <div class="hd">${ic(cat.icon)}${esc(m.head)}<span class="r">${esc(m.headNote)}</span></div>
      ${top > 0 ? '<div class="xs dm" style="text-align:center">▲ more</div>' : ''}
      ${rowsHtml(rows.slice(top, top + per), rowSel, top)}
      ${top + per < rows.length ? '<div class="xs dm" style="text-align:center">▼ more</div>' : ''}
    </div>
    ${m.side ? `<div class="pnl gild" style="left:692px;top:76px;width:252px;height:448px"><div class="col" style="gap:8px;font-size:14px;line-height:1.35">${m.side.map((l, i) => `<div${i === 0 ? ' class="y"' : ''}>${esc(l)}</div>`).join('')}</div></div>` : ''}`;
  }
  return stage(`<div class="layer" style="background:radial-gradient(560px 320px at 700px 200px,rgba(160,90,255,.22),transparent 70%),radial-gradient(500px 360px at 100px 520px,rgba(201,51,143,.18),transparent 70%)"></div>
  <div class="ttl" style="--t1:#5b1fb0;--t2:#c9338f" data-testid="dom-set-title">Settings <span class="sub">· ${esc(cat.label)}</span></div>
  <div class="keys" data-testid="dom-set-keys">${WHEEL_KEY}<span class="key">▲ ▼</span><span>${m.focus === 'cats' ? 'Category' : 'Pick'}</span><span class="key">◀ ▶</span><span>${m.focus === 'cats' ? 'Open' : 'Change'}</span><span class="key">Esc</span><span>Back</span></div>
  ${catPanel}
  ${body}
  ${m.notice ? `<div class="a" style="left:228px;top:40px;width:716px;z-index:30;background:rgba(14,6,28,.92);border:2px solid #c9a0ff;border-radius:8px;padding:5px 12px;font-size:14px" data-testid="dom-set-notice">${esc(m.notice)}</div>` : ''}
  ${DRESS}`, '', 'kl-violet check vign grain');
}
