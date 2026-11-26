// DOMINION redesign R0: the HQ hub (mockup page `hq`, kind hub11), the Start menu over it (`start`, kind start25) and the
// Boss Menu as Rotom's phone (`menu`, kind ph13), at pass 50 of plans/evil-mode-rework/redesign-50. Live data in, HTML
// out; the scene keeps the cursors and does the acts. Every data-testid the old views had is kept.

import type { BossMenuModel } from '../../../../../core/dominion/bossMenu';
import type { Threat } from '../../../../../core/dominion/rivalScreens';
import type { HqModel } from '../../../../../core/dominion/screens';
import { art, bg, esc, faceOf, foot, keys, map, NAV, page, pn, SP, spr, tabs, top, type R5Cta, type R5Key, type R5Run } from './kit';

/** One room of the building (core/dominion/hqScreens CellModel, as much as the hub needs). */
export interface R5Room {
  name: string; icon: string | null; sprite: string | null; fx: string; row: number; span: number; state: string;
  /** R2 (floors): a figure to draw instead of the sprite, and the HQ page a tap opens (r5go). State 'fix' is the floor's
   *  fixture, 'sale' a plot for sale, 'staff' the Staff Office desk. */
  fig?: string; go?: string;
}

export interface R5HubExtras {
  rooms: readonly R5Room[];
  rows: number;
  /** R2: the open floors top to bottom ([tag, name, r5go id]); without it the rows are named as R0 did. */
  floors?: readonly [string, string, string][];
  level: number;
  /** The HQ's level name (the Hideout, the Fortress) and the building's own name. */
  levelName: string;
  hqName: string;
  /** The next HQ level (or the one being built): name, cost and the day it's ready. */
  next: { name: string; cost: number; ready: number | null; building: boolean } | null;
  /** The member on duty: their face picture, ring colour and the test id the old view gave their picture. */
  member: { name: string; pic: string; colour: string; /** Their armband, for screen readers ("blank armband"). */ band: string };
  /** The Boss in the lift car. */
  boss: string;
  threat: Threat | null;
  desk: number | null;
  paper: string | null;
  notice: string | null;
  at: number;
}

const title = (s: string): string => s.toLowerCase().replace(/(^|[\s·-])\S/g, (x) => x.toUpperCase());
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;

/** Floor names, top to bottom (mockup: 2F, G, B1). */
function floorNames(n: number): [string, string][] {
  return Array.from({ length: n }, (_, r) => {
    const k = n - 1 - r;
    if (n >= 3 && k === 0) return ['B1', 'The Cellar'];
    const g = n >= 3 ? k - 1 : k;
    return g === 0 ? ['G', 'Ground Floor'] : [`${g + (n >= 3 ? 1 : 0)}F`, 'Upper Floor'];
  });
}

function building(x: R5HubExtras): string {
  const names = x.floors ? x.floors.map(([t, n]) => [t, n] as [string, string]) : floorNames(x.rows);
  const tall = x.rows > 3;
  // The ground floor sits on the dirt line (mockup: 2F, G, B1 in slots f0-f2): fewer floors fill the lower slots.
  const slot = (r: number): number => (x.rows === 1 ? 1 : r);
  const topOf = (r: number): number => (tall ? 62 + Math.round((r * 250) / x.rows) : [62, 146, 232][slot(r)]!);
  const top0 = topOf(0);
  const floors = names.map(([f, sub], r) => {
    const rooms = x.rooms.filter((c) => c.row === r);
    const pos = tall ? `top:${topOf(r)}px;height:${Math.round(250 / x.rows) - 4}px;` : '';
    return `<div class="fl11 f${Math.min(slot(r), 2)}" style="--i:${r};--d:${r * 140}ms;${pos}"><button class="ft11" ${x.floors ? act(NAV, x.floors[r]![2]) : act('base')}><b>${esc(f)}</b><em>${esc(sub)}</em></button>
    ${map(rooms, (c, j) => {
      const empty = c.state === 'empty';
      const plot = empty || c.state === 'sale';
      const pic = c.fig ? c.fig : c.sprite ? art(c.sprite, 38, 'who11') : c.icon ? art(c.icon, 26, 'pi') : SP('g-card-key', 26, 'pi');
      const fix = x.floors ? c.state === 'fix' : j === 0;
      return `<span class="rm11${plot ? ' plot' : fix ? ' fix' : ''}" style="--j:${j}${c.span > 1 ? `;flex:${c.span}` : ''}" ${c.go ? act(NAV, c.go) : act('base')}>${pic}<b>${esc(empty ? 'Free slot' : c.state === 'sale' ? 'Plot for sale' : x.floors ? c.name : title(c.name))}</b><em>${esc(empty ? 'Build here' : c.fx)}</em></span>`;
    })}</div>`;
  }).join('');
  const built = x.rooms.filter((c) => c.state !== 'empty' && c.state !== 'sale' && c.state !== 'fix' && c.state !== 'staff').length, free = x.rooms.filter((c) => c.state === 'empty').length;
  const roofTop = top0 - 30;
  const scaf = x.next ? `<div class="scaf11" style="top:${roofTop - 32}px"><b>${esc(x.next.name)}</b><em>${esc(x.next.building ? `Building · ready Day ${x.next.ready ?? '?'}` : `HQ Lv ${x.level + 1} · ${money(x.next.cost)}`)}</em></div>` : '';
  return `<section class="bld11" data-m="panel" data-testid="dom-building">${scaf}
  <div class="roof11" style="top:${roofTop}px" ${act('base')}><b>${esc(x.hqName.toUpperCase())}</b><em>${esc(`${built} room${built === 1 ? '' : 's'} · ${free} free`)}</em></div><div class="shaft11" data-nocheck="" style="top:${top0}px;height:${312 - top0}px"><span class="car11">${faceOf(x.boss, 30, '#e0294a')}</span></div>
  ${floors}
  <div class="dirt11" data-nocheck=""></div></section>`;
}

const act = (name: string, arg: string | number = ''): string => `data-act="${esc(name)}" data-arg="${esc(String(arg))}"`;

function side(m: HqModel, x: R5HubExtras): string {
  const row = (i: number, label: string, a: string, arg: string | number, o: { tag?: string; on?: boolean; tid?: string; over?: boolean } = {}): string =>
    `<button class="row sm${o.on ? ' on' : ''}" ${act(a, arg)}${o.over ? ` data-over="orderOver"` : ''}${o.tid ? ` data-testid="${o.tid}"` : ''} style="--i:${i};--d:${i * 60}ms"><b>${esc(label)}</b>${o.tag ? `<i class="tag">${esc(o.tag)}</i>` : ''}</button>`;
  let head = 'Tonight', body = '', tid = 'dom-night';
  if (m.panel === 'orders') {
    head = m.phase === 'evening' ? 'Plan tomorrow' : 'Today’s orders';
    tid = 'dom-orders';
    body = m.orders.length
      ? map(m.orders, (o, i) => row(i, o.label, 'order', i, { on: i === x.at, tid: `dom-order-${o.id}`, over: true, tag: o.planned && m.phase === 'evening' ? '✓' : undefined }))
      : '';
    body += `<p class="nt11" data-testid="dom-orders-note">${esc(m.ordersNote)}</p>`;
  } else if (m.panel === 'report') {
    head = 'Night report';
    tid = 'dom-report';
    body = map(m.report, (l, i) => `<div class="row sm" style="--i:${i};--d:${i * 60}ms"><b>${esc(l)}</b></div>`);
  } else {
    body = m.next.label === 'Turn in'
      ? '<div class="row sm"><b>Tonight’s action is done. Turn in: no Rest tonight.</b></div>'
      : `<button class="row sm" ${act(NAV, 'rest')} data-testid="r5-rest-open"><b>Rest: your Pokémon heal for free, the crew’s Morale +5, and +1 action tomorrow.</b></button>`+'<div class="row sm"><b>Or one Night action on the Region Map (key 2).</b></div>';
  }
  const extra = [
    x.desk === null ? '' : `<button class="row sm" ${act('desk')} data-testid="dom-desk"><b>APPLICATIONS · ${esc(x.desk ? `${x.desk} in the rain` : 'queue empty')}</b><i class="tag">I</i></button>`,
    m.hero ? `<button class="row sm" ${act('heroFile')} data-testid="dom-hero-chip"><b>THE HERO · ${esc(m.hero.word)} · Threat ${m.hero.threat}</b><i class="tag">H</i></button>` : '',
  ].join('');
  const steps = m.steps?.find((s) => !s.done);
  const nf = steps
    ? `<div class="nf11" data-testid="dom-steps">${SP('g-star-piece', 30)}<span><b>First steps · ${m.steps!.filter((s) => s.done).length} of ${m.steps!.length}</b><em>${esc(steps.label)}</em></span></div>`
    : x.next ? `<div class="nf11" ${act('base')}>${SP('g-black-belt', 30)}<span><b>${esc(x.next.building ? `Building · ${x.next.name}` : `Next floor · ${x.next.name}`)}</b><em>${esc(x.next.building ? `Ready Day ${x.next.ready ?? '?'}` : `Upgrade · ${money(x.next.cost)}`)}</em></span></div>` : '';
  return `<section class="pn side11" data-m="det" data-testid="${tid}"><h3><i>${esc(head)}</i></h3>${body}${extra}${nf}</section>`;
}

/** The hub's `.scr` (the Start menu draws it again under its own panel). */
export function hubScr(m: HqModel, x: R5HubExtras, run: R5Run): string {
  const says = `“${m.says}”`;
  const ctas: R5Cta[] = [];
  if (m.top.founding) ctas.push(['★ The Founding', 'founding', '', 'dom-founding-ready']);
  ctas.push([m.next.label, 'next', '', 'dom-next']);
  // A notice is narration, but the member on duty stays in the box (their face carries the team's armband).
  const who = { name: x.notice ? '' : title(x.member.name), pic: x.member.pic, colour: x.member.colour };
  const line = x.notice ?? says;
  const ks: R5Key[] = [['B', 'HQ menu', 'base', 'dom-hq-open'], ['R', 'Rivals', 'rivalFile', 'dom-rival-open'], ['V', x.paper ? 'Crew talk · NEW LEDGER' : 'Crew talk', 'voicesOpen', 'dom-voices-open'], ['Enter', m.orders.length && m.panel === 'orders' ? (m.phase === 'day' ? 'do the order' : 'plan it') : m.next.label]];
  const r: R5Run = x.threat ? { ...run, tip: `${x.threat.tag} · ${x.threat.text}`, tipAct: 'rivalFile', tipTestid: 'dom-threat' } : run;
  return `<div class="scr nv k-hub11">${bg('hq', 'HQ', r)}<div class="sky11" data-nocheck=""><i class="moon"></i></div>${top('HQ', { title: x.hqName, sub: m.top.team, subTestid: 'dom-team', sub2: `HQ Lv ${x.level}`, id: 'hq' }, r)}
  ${building(x)}
  ${side(m, x)}
  ${foot(who, line, ctas, 'HQ', r, { testid: x.notice ? 'dom-notice' : 'dom-says', lineAct: x.notice ? 'dismiss' : undefined, sr: ['dom-band', x.member.band] })}${tabs('HQ', r)}${keys(ks, 'HQ', r)}</div>`;
}

export function r5Hq(m: HqModel, x: R5HubExtras, run: R5Run): string {
  const inner = hubScr(m, x, run);
  // page() adds its own .scr; the hub brings its own, so take the inside of it.
  return page({ id: 'hq', g: 'HQ', kind: 'hub11', body: inner.slice('<div class="scr nv k-hub11">'.length, -'</div>'.length) });
}

// ---------- the Start menu (pass 25) ----------

export interface R5StartItem { id: string; icon: string; label: string; about: string }

/** Rows of the Start menu that lead somewhere real (mockup: Bag, Boss card and Photo mode wait for their slices). */
export const START_ITEMS: readonly R5StartItem[] = [
  { id: 'menu', icon: 'g-xtransceiver', label: 'Rotom Phone', about: 'The Boss Menu: apps, the news and Settings' },
  { id: 'roster', icon: 'g-idcard', label: 'Crew', about: 'Your crew, their files and squads' },
  { id: 'reserve', icon: 'g-ball', label: 'Pokémon', about: 'The Reserve and the Pyramid' },
  { id: 'tcard', icon: 'g-badgecard', label: 'Boss card', about: 'Your card: level, money, gyms, the Hero' },
  { id: 'map', icon: 'g-town-map', label: 'Region map', about: 'Districts, targets and tonight’s jobs' },
  { id: 'rivals', icon: 'g-scope-lens', label: 'Rivals', about: 'The other teams in Kanto' },
  { id: 'save', icon: 'g-journal', label: 'Save', about: 'The game saves every step' },
  { id: 'options', icon: 'g-machine-part', label: 'Options', about: 'Settings for Dominion and the game' },
  { id: 'close', icon: '', label: 'Close', about: 'Back to the HQ' },
];


export function r5Start(hub: string, items: readonly R5StartItem[], at: number, boss: { name: string; pic: string; funds: string }, run: R5Run): string {
  const cur = items[Math.max(0, Math.min(at, items.length - 1))];
  const rows = map(items, (it, i) => `<button class="si25${i === at ? ' on' : ''}${it.id === 'close' ? ' x' : ''}" ${act('r5start', i)} data-over="r5startOver" data-testid="r5-start-${it.id}" style="--d:${i * 45}ms">${it.icon ? spr(it.icon, 1) : ''}<b>${esc(it.label)}</b></button>`);
  const ks: R5Key[] = [['↑↓', 'pick'], ['Enter', 'open'], ['Esc', 'close']];
  return page({ id: 'start', g: 'Menu', kind: 'start25', body: `<div class="rp21" data-nocheck="">${hub}</div><i class="dim25" data-nocheck=""></i>
  <section class="sm25" data-m="panel" data-testid="r5-start-panel"><div class="sh">${faceOf(boss.pic, 40, '#e0294a')}<span><b>${esc(boss.name.toUpperCase())}</b><em>Boss · ${esc(boss.funds)}</em></span></div>
    ${rows}</section>
  <div class="sd25" data-nocheck=""><b>${esc(cur?.label ?? '')}</b> ${esc(cur?.about ?? '')}<i class="nx23">▼</i></div>
  ${keys(ks, 'Menu', run)}` });
}

// ---------- the Boss Menu as Rotom's phone (pass 13) ----------

/** The phone's short app names (the blades' long names stay as each app's tooltip). */
const APP: Record<string, string> = { hq: 'HQ', roster: 'Crew', reserve: 'Pokémon', ops: 'Jobs', ledger: 'Ledger', rotom: 'Rotom', settings: 'Settings', lessons: 'Lessons', hide: 'Hide' };

export function r5BossMenu(m: BossMenuModel, boss: string, run: R5Run, wheelKey: string): string {
  const g = m.glance;
  // Nine apps on the phone; the first blade (Back to work) is the phone's bottom bar, as Esc.
  const apps = map(m.blades, (b, i) => (b.id === 'back' ? '' : `<button class="ap13${i === m.at ? ' on' : ''}${b.dim ? ' dim' : ''}" ${act('menuBlade', i)} data-over="menuOver" data-testid="dom-blade-${b.id}" style="--d:${i * 40}ms" title="${esc(b.label)}${b.sub ? ` · ${esc(b.sub)}` : ''}"><span class="api">${art(b.icon, 30)}</span><b>${esc(APP[b.id] ?? b.label)}</b></button>`));
  const bi = m.blades.findIndex((b) => b.id === 'back');
  const back = bi < 0 ? '' : `<button class="bk50${bi === m.at ? ' on' : ''}" ${act('menuBlade', bi)} data-over="menuOver" data-testid="dom-blade-back"><b>◀ ${esc(m.blades[bi]!.label)}</b><em>${esc(m.blades[bi]!.sub ?? '')}</em></button>`;
  const nt = (i: number, pic: string, colour: string, head: string, sub: string, right: string, a = '', tid = ''): string =>
    `<button class="nt" ${a ? act(a) : ''}${tid ? ` data-testid="${tid}"` : ''} style="--i:${i};--d:${i * 90}ms">${faceOf(pic, 38, colour)}<span><b>${esc(head)}</b><em>${esc(sub)}</em></span><i>${esc(right)}</i></button>`;
  const rotom = SP('p-rotom', 30);
  const heroPic = g.hero ? `<img class="px" src="assets/images/${esc(g.hero.look)}" alt="" style="height:46px;width:auto;margin-top:2px">` : SP('t-redbig', 34);
  const notes = [
    g.alert ? nt(0, rotom, '#ff8a1c', 'Rotom', g.alert.text, g.alert.tag) : nt(0, rotom, '#ff8a1c', 'Rotom', 'Bzzt! All quiet for now.', ''),
    nt(1, SP('bd-fire', 30), '#e0294a', `Heat ${g.heat}%`, `♥ Regard ${g.regard} · Dread ${g.dread}`, ''),
    nt(2, SP('g-relic-crown', 30), '#e8b23a', g.goal, `${g.goalPct}% of the way`, ''),
    g.hero ? nt(3, heroPic, '#ef3b2c', `Hero · ${g.hero.name}`, `Threat ${g.hero.threat}`, '', 'heroFile') : nt(3, heroPic, '#ef3b2c', 'The Hero', 'not yet', ''),
  ].join('');
  const slot = `<button class="nt" style="--i:4;--d:360ms" data-testid="dom-menu-slot">${faceOf(SP('g-storage-key', 30), 38, '#3aa86a')}<span><b>${esc(m.slot.line)}</b><em>${esc(m.slot.sub)}</em></span><i>SAFE</i></button>`;
  const ks: R5Key[] = [['←→↑↓', 'app'], ['Enter', 'open'], ['Esc', 'back']];
  return page({ id: 'menu', g: 'Menu', kind: 'ph13', body: `${bg('street', 'Menu', run)}<div class="dim13" data-nocheck=""></div>
  <div class="boss13" data-nocheck="" data-testid="dom-menu-boss">${boss}</div>
  <div class="ph13x" data-m="dial"><div class="eyes13" data-nocheck=""><i></i><i></i></div><div class="bar13"><b>${esc(g.when)}</b><span data-testid="dom-glance-funds">${esc(g.funds)}</span></div>
    <p class="pt13" data-m="ttl" data-testid="dom-menu-title">Boss Menu</p><div class="apps13" data-testid="dom-blades">${apps}</div>
    ${back}<p class="q13" data-testid="dom-menu-quote">“${esc(m.quote)}”</p></div>
  <section class="pn nt13" data-m="det" data-testid="dom-glance"><h3><i>Notifications</i></h3>${notes}${slot}</section>
  ${m.notice ? `<div class="sd25" ${act('dismiss')} data-testid="dom-menu-notice">${esc(m.notice)}</div>` : ''}
  ${keys(ks, 'Menu', run, { testid: 'dom-menu-keys', pre: `<span>${wheelKey.replace('<span>Wheel</span>', '')}</span>` })}` });
}

export { NAV, pn };
