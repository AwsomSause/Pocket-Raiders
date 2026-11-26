// DOMINION redesign R8: the Empire at pass 50 of plans/evil-mode-rework/redesign-50. Takeover night (mockup `takeover`,
// kind tk48), the Holdings (`fronts`, a list page), the hijacked broadcast (`broadcast`, kind tv), the Empire across
// regions (`regions`, a card grid) and one region's own page, the World (`world`, kind wd22), Pick the Holder (`holder`)
// and Sail (`sail`, kind sail22), the standing orders, Arrival in a new region (`johto`, kind jo37), the Underworld
// (`underworld`, kind uw31), the Gym case (`gymcase`, kind gy44), the Ending (`ending`, kind en48), the Credits
// (`credits`, kind cr48) and the Hall of Infamy (`infamy`, kind hi30). Live data in; the controllers keep the cursors.

import './r8.css';
import type { EndingModel, Journey } from '../../../../../core/dominion/ending';
import type { GymCaseModel, UnderworldModel } from '../../../../../core/dominion/r8Pages';
import type { EmpireModel, LeaveModel, RealmCard } from '../../../../../core/dominion/regionsScreens';
import type { BroadcastModel, HoldingsModel, TakeoverModel } from '../../../../../core/dominion/takeoverScreens';
import type { R5Pics } from './chairR8';
import { art, bg, esc, faceOf, foot, frame, go, keys, map, page, pn, SP, spr, top, type R5Cta, type R5Key, type R5Run, type R5Speaker } from './kit';
import { R5_SIZES } from './sizes';

type Who = { name: string; pic: string; colour: string } | null;
const who5 = (w: Who): R5Speaker | null => (w ? { name: w.name, pic: w.pic, colour: w.colour } : null);
const cap = (s: string): string => s.charAt(0) + s.slice(1).toLowerCase();
const money = (n: number): string => `₽${n.toLocaleString('en-US')}`;
/** A picture under assets/images (the Hero's portrait, a rival Boss's png) at a height; the mockup's sprite when it had one. */
export function imgAt(path: string, h: number): string {
  const k = path.replace(/^.*\//, '').replace(/\.png$/, '');
  for (const c of [k, `t-${k}`]) if (R5_SIZES[c]) return SP(c, h);
  return `<img class="px" src="assets/images/${esc(path)}" alt="" style="height:${h}px;width:auto">`;
}
/** Region crests in the mockups' sprites. */
export const CREST: Record<string, string> = { kanto: 'g-relic-crown', johto: 'g-red-orb', hoenn: 'g-blue-orb', sinnoh: 'g-adamant-orb', unova: 'g-dark-gem', kalos: 'g-star-piece', alola: 'g-comet-shard', galar: 'g-dmax', paldea: 'g-tera' };

// ---------- Takeover night (mockup `takeover`) ----------

const PATH_ICON: Record<string, string> = { 'i-leaders_crest': 'g-meteorite' };

export function r5Takeover(m: TakeoverModel, x: { who: Who; notice: string | null }, run: R5Run): string {
  const cards = map(m.cards, (c, i) => {
    const rows = c.rows.slice(0, 2);
    return `<button class="pl48${c.lead ? ' lead on' : ''}${c.dial === 0 && !c.lead ? ' cold' : ''}" style="--p:${c.dial};--d:${i * 140}ms" data-testid="dom-path-${c.id}"><span class="ic">${art(PATH_ICON[c.icon] ?? c.icon, 40)}</span><b>${esc(cap(c.name))}</b>${c.pill ? `<i class="tg8 ${c.pillTone === 'y' ? '' : c.pillTone}">${esc(c.pill)}</i>` : ''}<span class="mt"><i></i><u>100%</u></span><strong>${c.dial}%</strong>${map(rows, (r) => `<em class="r8">${r.ok ? '✓ ' : ''}${esc(r.text)}</em>`)}</button>`;
  });
  const alert = m.alerts[0];
  const r: R5Run = alert ? { ...run, tip: `${alert.title} · ${alert.text}`, tipTestid: 'dom-takeover-alerts' } : { ...run, tip: undefined };
  const alerts = `<span data-testid="${alert ? 'dom-takeover-alerts-all' : 'dom-takeover-alerts'}" class="sr8">${esc(m.alerts.map((a) => `${a.title} ${a.text}`).join(' · ') || 'QUIET Nothing is closing in yet.')}</span>`;
  const tp = m.tp ? `<i class="dim8" data-nocheck=""></i><section class="pn tp8" ${go('tpSeen')} data-testid="dom-turning-point"><small>TURNING POINT · ${esc(m.tp.track.toUpperCase())} STAGE ${m.tp.stage}</small><b>${esc(m.tp.name)}</b><p><b style="font-size:18px">${esc(m.tp.title)}</b></p><p>${esc(m.tp.scene)}.</p><p class="nt8"><kbd>Enter</kbd> go on</p></section>` : '';
  const ctas: R5Cta[] = [['Back', 'back', '', 'dom-takeover-back'], [m.cta.label.replace(/[▶▦⚑★⚓⚔]/g, '').trim(), 'tkCta', '', 'dom-takeover-cta']];
  return frame({ id: 'takeover', g: 'Empire', kind: 'tk48', bg: 'night', top: { title: 'Takeover night', sub: `${m.region} · ${m.held} held`, subTestid: 'dom-takeover' }, run: r,
    body: `<section class="tk48" data-m="panel">${cards}</section>${alerts}`,
    who: x.notice ? null : who5(x.who), line: x.notice ?? `“${m.rib}”`, ctas, footOpts: { testid: x.notice ? 'dom-notice' : 'dom-takeover-rib', lineAct: x.notice ? 'dismiss' : undefined },
    over: tp, keys: [['P', 'Holdings', 'tkHoldings'], ['Enter', 'start', 'tkCta'], ['Esc', 'back', 'back']] });
}

// ---------- the Holdings (mockup `fronts`) ----------

const KIND_ICON: Record<string, string> = { 'Buy out': 'g-big-nugget', Buy: 'g-storage-key', Infiltrate: 'g-smoke-ball', Seize: 'g-dark-gem', Raid: 'g-choice-band', 'Annex the town': 'g-town-map', 'Take the Gym': 'g-badgecard', 'Beat the League': 'g-relic-gold' };
const STATE: Record<string, string> = { held: 'YOURS', seizing: 'SEIZING', open: 'TAKE', locked: 'LOCKED' };

export function r5Holdings(m: HoldingsModel, run: R5Run): string {
  const n = 6;
  const from = Math.max(0, Math.min(m.rows.length - n, m.at - 2));
  const rows = map(m.rows.slice(from, from + n), (r, j) => {
    const i = from + j, on = i === m.at;
    const right = r.state === 'held' || r.state === 'seizing' ? `${r.cond ?? 100}%` : r.state === 'open' && r.cost ? money(r.cost) : '';
    return `<button class="row${on ? ' on' : ''}" ${go('tkRow', i)} data-over="tkOver" data-testid="dom-holding-${esc(r.id.split(':')[1] ?? r.id)}" style="--i:${j};--d:${j * 60}ms${r.state === 'locked' ? ';opacity:.6' : ''}">${spr(KIND_ICON[r.kind] ?? 'g-nugget', 1, 'ico')}<span class="row-t"><b>${esc(r.place)}</b><em>${esc(`${r.town} · ${r.kind} · ${r.size}`)}</em></span><i class="tag${right && r.state !== 'held' ? ' num' : ''}">${esc(r.state === 'held' ? STATE.held : right || STATE[r.state])}</i></button>`;
  });
  const cur = m.rows[m.at];
  const det = cur
    ? `<div class="plinth">${spr(KIND_ICON[cur.kind] ?? 'g-nugget', 3, 'dspr')}</div><b class="det-t">${esc(cur.bonus)}</b><p>${esc(cur.text)}</p>${cur.limited ? `<p class="nt8">In this version: ${esc(cur.limited)}</p>` : ''}<p data-testid="dom-holding-why">${esc(cur.state === 'open' ? `${cur.kind}${cur.cost ? ` · ${money(cur.cost)}` : ''} · one Boss action` : cur.state === 'held' ? 'Yours. Its bonus pays each week.' : cur.state === 'seizing' ? 'Hold on: your crew is still seizing it.' : cur.why ?? '')}</p>${cur.state === 'open' ? `<button class="cta on" ${go('tkRow', m.at)}>Take it</button>` : ''}`
    : '<b class="det-t">No Holdings here</b>';
  const body = pn('l-main tight', `Your Holdings · ${m.weekly >= 0 ? '' : '−'}${money(Math.abs(m.weekly))} a week`, rows, 'panel') + pn('l-det', '', det, 'det')
    + (m.notice ? `<p class="nc8" ${go('dismiss')} data-testid="dom-notice">${esc(m.notice)}</p>` : '');
  return frame({ id: 'fronts', g: 'Empire', kind: 'list', bg: 'hq', top: { title: 'Holdings', sub: `${m.region} · ${m.held} held`, subTestid: 'dom-holdings' }, body, run, keys: [['↑↓', 'pick'], ['Enter', 'Choose'], ['Esc', 'Back'], ['Q', 'Wheel']] });
}

// ---------- the hijacked broadcast (mockup `broadcast`) ----------

export function r5Broadcast(m: BroadcastModel, x: { boss: string }, run: R5Run): string {
  const parts = map(m.ticker.slice(0, 5), (t, i) => `<div class="part" style="--i:${i};--d:${i * 60}ms"><span>${esc(t)}</span></div>`);
  return page({ id: 'broadcast', g: 'Empire', kind: 'tv', body: `${bg('night', 'Empire', run)}<section class="tv" data-m="panel" data-testid="dom-broadcast"><div class="tv-in">${x.boss}<span class="onair">● ${esc(m.onAir.replace(/^●\s*/, ''))}</span><div class="low3" data-testid="dom-broadcast-head"><b>${esc(m.head)}</b><em>${esc(m.small)}</em></div></div></section>
  <section class="pn tv-side" data-m="det"><h3><i>Across ${esc(m.region ? 'the region' : 'Kanto')}</i></h3>${parts}<p class="q" data-testid="dom-broadcast-say">“${esc(m.say.replace(/^“|”$/g, ''))}”</p></section>
  ${keys([['Enter', 'next', 'tkSkip'], ['Esc', 'back', 'tkSkip']], 'Empire', run)}` });
}

// ---------- the Empire across regions (mockup `regions`) ----------

const STARS: Record<string, string> = { held: '★★★', here: '★★', next: '★', later: '', seceded: '', sellout: '', lost: '' };

/** One line for a region card: who holds it and how steady, or what waits there. */
export function realmLine(c: RealmCard): string {
  if (c.state === 'held') return `Yours · Holder: ${c.who?.name ?? '?'} · Stability ${c.rows[0]?.value ?? '?'}`;
  if (c.state === 'here') return `You are here · ${c.rows.find((r) => /rival/i.test(r.label))?.value ?? cap(c.pill)}`;
  if (c.state === 'next') return `${c.rows[0]?.value ?? 'Rivals'} · sail next`;
  if (c.state === 'later') return 'Locked · one region at a time';
  return `${cap(c.pill)}${c.who ? ` · ${c.who.line}` : ''}`;
}

/** Up to four regions: the run's, then the ones this run won't reach (locked), as the mockup shows four. */
export function regionCards(m: EmpireModel, more: readonly string[]): { id: string; name: string; state: string; line: string; card: RealmCard | null }[] {
  const out: { id: string; name: string; state: string; line: string; card: RealmCard | null }[] = m.cards.map((c) => ({ id: c.id, name: cap(c.name), state: c.state as string, line: realmLine(c), card: c as RealmCard | null }));
  for (const id of more) if (out.length < 4 && !out.some((x) => x.id === id)) out.push({ id, name: cap(id), state: 'lock', line: 'Locked', card: null });
  return out;
}

export function r5Regions(m: EmpireModel, x: { more: readonly string[]; notice: string | null }, run: R5Run): string {
  const cs = regionCards(m, x.more);
  const taken = m.cards.filter((c) => c.state === 'held').length;
  const cells = map(cs, (c, i) => `<button class="cell${i === m.at ? ' on' : ''}" ${c.card ? go('emCard', i) : ''} data-testid="dom-empire-card-${c.id}" style="--pc:#3a2a34;--i:${i};--d:${i * 50}ms${c.state === 'lock' || c.state === 'later' ? ';opacity:.7' : ''}"><i class="rr14">${STARS[c.state] ?? ''}</i><span class="cs">${SP(CREST[c.id] ?? 'g-star-piece', 64)}</span><b>${esc(c.name)}</b><em>${esc(c.line)}</em></button>`);
  const body = pn('g-main', `The Empire · ${taken} region${taken === 1 ? '' : 's'} taken`, `<div class="cells n${Math.max(3, cs.length)}" data-testid="dom-empire">${cells}</div>`, 'panel')
    + (x.notice ? `<p class="nc8" ${go('dismiss')} data-testid="dom-notice">${esc(x.notice)}</p>` : '');
  const ks: R5Key[] = [['Enter', 'open'], ['L', m.leave.label.replace(/\s*\(L\)$/, '').replace(/^Leave for /, ''), 'emLeave', 'dom-empire-leave'], ['W', 'world', 'r8World'], ['U', 'teams', 'r8Under'], ['Y', 'gyms', 'r8Gyms']];
  return frame({ id: 'regions', g: 'Empire', kind: 'grid g-cards', bg: 'hq', top: { title: 'Empire across regions', sub: m.tribute, subTestid: 'dom-empire-tribute' }, body, run, keys: ks });
}

// ---------- one region's page (the regions card opened) ----------

export function r5Realm(c: RealmCard, x: { at: number; i: number; holder: string; notice: string | null }, run: R5Run): string {
  const rows = map(c.buttons, (b, k) => `<button class="row${k === x.at ? ' on' : ''}" ${go('emBtn', `${x.i}:${k}`)} data-testid="${b.op === 'tribute' ? `dom-empire-${c.id}-tribute` : `dom-empire-${c.id}-${b.op}`}" style="--i:${k};--d:${k * 50}ms">${SP(b.op === 'tribute' ? 'g-big-nugget' : b.op === 'orders' ? 'g-journal' : b.op === 'spy' ? 'g-scope-lens' : b.op === 'visit' ? 'g-town-map' : 'g-idcard', 30)}<span class="row-t"><b>${esc(b.op === 'tribute' ? `Tribute · ${b.label}` : b.label)}</b></span>${b.tone ? `<i class="tag">${b.tone === 'r' ? '!' : '•'}</i>` : ''}</button>`)
    || `<div class="row"><span class="row-t"><b>Nothing to do here now</b><em>${esc(realmLine(c))}</em></span></div>`;
  const det = `<div class="plinth">${x.holder}</div><b class="det-t">${esc(c.who?.name ?? c.name)}</b><p>${esc([c.who?.rank, c.who?.line].filter(Boolean).join(' · '))}</p>${map(c.rows, (r) => `<p><b>${esc(r.label)}</b> ${esc(r.value)}</p>`)}${c.boon ? `<p class="nt8">${esc(c.boon.name)}${c.boon.weak ? ' (weak)' : ''}</p>` : ''}`;
  const body = pn('l-main', `${cap(c.name)} · ${c.pill}`, rows, 'panel') + pn('l-det', '', det, 'det')
    + (x.notice ? `<p class="nc8" ${go('dismiss')} data-testid="dom-notice">${esc(x.notice)}</p>` : '');
  return frame({ id: 'realm', g: 'Empire', kind: 'list', bg: 'hq', top: { title: cap(c.name), sub: 'Held region', crumb: ['Empire', 'regions'] }, body, run, keys: [['↑↓', 'pick'], ['Enter', 'Choose'], ['Esc', 'Back']] });
}

// ---------- the standing orders (a held region's, or the ones left behind when sailing) ----------

export function r5Orders(o: { region: string; rows: { key: string; name: string; pick: string; text: string; on: boolean }[] }, x: { prev: string; next: string; save: string; back: string }, run: R5Run): string {
  const rows = map(o.rows, (r, i) => `<button class="row${r.on ? ' on' : ''}" ${go(x.next, r.key)} data-testid="dom-orders-${r.key}" style="--i:${i};--d:${i * 60}ms">${SP('g-journal', 30)}<span class="row-t"><b>${esc(r.name)}</b><em>${esc(r.text || 'No change')}</em></span><i class="tag">${esc(r.pick)}</i></button>`);
  const cur = o.rows.find((r) => r.on) ?? o.rows[0];
  const det = cur ? `<div class="plinth">${spr('g-journal', 3, 'dspr')}</div><b class="det-t">${esc(cur.name)}</b><p>${esc(cur.pick)}</p><p>${esc(cur.text)}</p><button class="cta on" ${go(x.save)}>Save the orders</button>` : '';
  return frame({ id: 'orders', g: 'Empire', kind: 'list', bg: 'hq', top: { title: 'Standing orders', sub: o.region, crumb: ['Empire', 'regions'], subTestid: 'dom-orders' }, body: pn('l-main', `Orders for ${esc(o.region)}`, rows, 'panel') + pn('l-det', '', det, 'det'), run, keys: [['↑↓', 'order'], ['←→', 'change'], ['Enter', 'save'], ['Esc', 'back', x.back]] });
}

// ---------- the World (mockup `world`) ----------

export function r5World(m: EmpireModel, x: { order: readonly string[]; at: number; who: Who; notice: string | null }, run: R5Run): string {
  const cs = regionCards(m, x.order).slice(0, 4);
  const ISL = ['kanto', 'johto', 'hoenn', 'sinnoh'];
  const isl = map(cs, (c, i) => {
    const cls = c.state === 'held' || c.state === 'here' ? 'held' : c.state === 'next' ? 'next' : 'lock';
    return `<button class="isl22 i-${ISL[i]} ${cls}${i === x.at ? ' on' : ''}" ${c.card ? go('r8Island', i) : ''} data-testid="r8-island-${c.id}" style="--d:${i * 160}ms"><span class="land"><i class="crest">${SP(CREST[c.id] ?? 'g-star-piece', 30)}</i></span><b>${esc(c.name)}</b><em>${esc(c.line)}</em></button>`;
  });
  const sel = cs[x.at];
  const ctas: R5Cta[] = [];
  if (sel?.card?.state === 'held') ctas.push([`Open ${sel.name}`, 'r8Island', x.at]);
  ctas.push([m.leave.ok ? 'Pick the Holder' : 'Region page', m.leave.ok ? 'emLeave' : 'r8Regions'], [m.leave.label.replace(/\s*\(L\)$/, ''), 'emLeave', '', 'dom-world-leave']);
  return frame({ id: 'world', g: 'Empire', kind: 'wd22', bg: 'night', top: { title: 'The World', sub: `${m.cards.filter((c) => c.state === 'held').length + 1} of ${m.cards.length} regions` }, run,
    body: `<div class="sea22" data-nocheck=""></div><svg class="rt22" viewBox="0 0 960 540" data-nocheck=""><path d="M300,250 C340,180 380,150 430,140"></path><path class="lk" d="M610,140 C680,140 730,170 760,200"></path><path class="lk" d="M760,310 C740,340 700,350 680,340"></path></svg><i class="ship22" data-nocheck=""></i>${isl}`,
    who: x.notice ? null : who5(x.who), line: x.notice ?? `“${m.tbox.text}”`, ctas: ctas.slice(-2), footOpts: { testid: x.notice ? 'dom-notice' : 'dom-empire-tbox', lineAct: x.notice ? 'dismiss' : undefined },
    keys: [['←→', 'region'], ['Enter', 'open'], ['Esc', 'back']] });
}

// ---------- Pick the Holder (mockup `holder`) ----------

/** A Holder card's short line (the full rule is the card's tooltip). */
const HOLD_LINE: Record<string, string> = { self: 'Never betrays · come back every 14 days', usurped: 'The old Boss · knows the region' };

export function r5Holder(m: LeaveModel, x: { pics: R5Pics; boss: string; notice: string | null }, run: R5Run): string {
  const n = Math.min(4, m.holders.length);
  const from = Math.max(0, Math.min(m.holders.length - n, m.holderAt - 1));
  const cells = map(m.holders.slice(from, from + n), (h, j) => {
    const i = from + j;
    const pic = h.kind === 'self' ? x.boss : h.look ? x.pics.body(h.look, 64) : SP('t-grunt', 64);
    return `<button class="cell${i === m.holderAt ? ' on' : ''}" ${go('lvHolder', i)} data-testid="dom-leave-holder-${esc(h.id)}" style="--pc:${h.kind === 'self' ? '#e0294a' : '#6f9a3a'};--i:${j};--d:${j * 50}ms"><i class="rr14">${h.rank ? '★★' : '★★★'}</i><span class="cs">${pic}</span><b>${esc(h.name)}</b><em title="${esc(h.note)}">${esc(HOLD_LINE[h.kind] ?? `${cap(h.rank ?? 'crew')} · runs it their way`)}</em>${i === m.holderAt ? '<i class="tag">✓</i>' : ''}</button>`;
  });
  const body = pn('g-main', `Who runs ${esc(m.region)} while you are away?`, `<div class="cells n${Math.max(3, n)}" data-testid="dom-leave-holders">${cells}</div>`, 'panel')
    + `<span data-testid="dom-leave" class="sr8">${esc(m.title)}</span>` + (x.notice ? `<p class="nc8" ${go('dismiss')} data-testid="dom-notice">${esc(x.notice)}</p>` : '');
  return frame({ id: 'holder', g: 'Empire', kind: 'grid g-cards', bg: 'hq', top: { title: 'Pick the Holder', sub: m.region }, body, run, keys: [['Enter', 'Choose'], ['Esc', 'Back'], ['Q', 'Wheel']] });
}

// ---------- Sail (mockup `sail`) ----------

export function r5Sail(m: LeaveModel, x: { pics: R5Pics; boss: string; who: Who; harbour: string; day: number; notice: string | null }, run: R5Run): string {
  const holder = m.holders[m.holderAt];
  const brought = m.bring[m.bringAt];
  const crew = [x.boss, ...(brought?.id ? [x.pics.body(brought.look, 64)] : [])].join('');
  const bring = `<span class="bc8" data-testid="dom-leave-bring">${map(m.bring, (b, i) => `<button class="${i === m.bringAt ? 'on' : ''}" ${go('lvBring', i)} data-testid="dom-leave-bring-${esc(b.id || 'nobody')}">${b.id ? faceOf(x.pics.face(b.look, 20), 20, '#3f7fd9') : ''}${esc(b.name)}</button>`)}</span>`;
  const o = m.orders[m.orderAt];
  const orders = `<span class="bc8" data-testid="dom-leave-orders">${o ? `<button class="on" ${go('lvOrder', m.orderAt)} data-testid="dom-leave-order-${o.key}" title="${esc(o.text)}">${esc(`${o.name}: ${o.pick}`)}</button>` : ''}<button ${go('r8OrderRow')} data-testid="r8-leave-next-order">${m.orderAt + 1}/${m.orders.length} ▸</button></span>`;
  const rows = [
    `<div class="chg up" style="--i:0;--d:0ms"><i>▲</i><b>Comes</b>${bring}</div>`,
    `<div class="chg up" style="--i:1;--d:60ms"><i>▲</i><b>Comes</b><em>${esc(m.notes[0] ?? '')}</em></div>`,
    `<div class="chg dn" style="--i:2;--d:120ms"><i>▼</i><b>Stays</b><em>${esc(m.notes[1] ?? '')}</em></div>`,
    `<div class="chg dn" style="--i:3;--d:180ms"><i>▼</i><b>Orders</b>${orders}</div>`,
  ].join('');
  const line = x.notice ?? m.why ?? `“New region, new rivals. ${m.next || 'The next region'} is waiting.”`;
  return page({ id: 'sail', g: 'Empire', kind: 'sail22', body: `${bg('roof', 'Empire', run)}<div class="dusk22" data-nocheck=""></div><div class="wave22" data-nocheck=""><i></i><i></i></div><div class="boat22" data-nocheck=""><i class="hull"></i><i class="flag"></i><span class="crew">${crew}</span></div>
  <div class="sh22" data-m="ttl" data-testid="dom-leave"><small>${esc(x.harbour)} · Day ${x.day}</small><b>TO ${esc(m.next.toUpperCase() || 'THE END')}</b><em>The Empire sails</em></div>
  ${pn('carry22', 'What comes with you', rows, 'det')}
  ${foot(x.notice || m.why ? null : who5(x.who), line, [['Not yet', 'r8Holder'], [m.go.replace(/\s*\(L\)$/, '').replace(/[▶⚓]/g, '').trim(), 'lvGo', '', 'dom-leave-go']], 'Empire', run, { testid: x.notice ? 'dom-notice' : 'dom-leave-notes' })}
  ${keys([['Enter', 'set sail', 'lvGo'], ['Esc', 'not yet', 'r8Holder'], ['←→', 'orders']], 'Empire', run)}` });
}

// ---------- Arrival in a new region (mockup `johto`) ----------

export interface ArrivalX { region: string; id: string; place: string; day: number; crew: string[]; ace: string; aceName: string; funds: string; heat: number; size: string; runs: { face: string; name: string; role: string; tag: string }[]; who: Who; line: string; more: boolean }

export function r5Arrival(x: ArrivalX, run: R5Run): string {
  const crew = map(x.crew, (c, i) => `<i style="--i:${i}">${c}</i>`) + (x.ace ? `<i class="ace" style="--i:${x.crew.length}">${x.ace}</i>` : '');
  const st = map([[x.funds, 'Start money'], [`${x.heat}%`, 'Heat'], [x.size, 'Crew'], [x.aceName || '—', 'Your ace, first form']], ([b, e], i) => `<u style="--i:${i};--d:${i * 90}ms"><b>${esc(b)}</b><em>${esc(e)}</em></u>`);
  const runs = map(x.runs.slice(0, 4), (r, i) => `<div class="jr37" style="--i:${i};--d:${i * 100}ms">${r.face}<span><b>${esc(r.name)}</b><em>${esc(r.role)}</em></span><i>${esc(r.tag)}</i></div>`);
  const sk = x.id === 'johto' ? ' sk-johto' : '';
  const body = `<section class="jw37" data-m="panel"><i class="sun" data-nocheck=""></i><b class="wl">WELCOME TO ${esc(x.region.toUpperCase())}</b><em class="ws">${esc(x.place)} · Day ${x.day}</em><span class="crew" data-nocheck="">${crew}</span><span class="st37">${st}</span></section>
  ${pn('jp37', `Who runs ${esc(x.region)}`, runs, 'det')}`;
  const p = frame({ id: 'johto', g: 'Empire', kind: `jo37${sk}`, bg: 'roof', top: { title: x.region, sub: `Day ${x.day} · a new region` }, body, run, noTabs: true,
    who: who5(x.who), line: x.line, ctas: [[x.more ? 'Next' : 'Find a base', 'more', '', 'dom-opening-next']], footOpts: { testid: 'dom-opening', lineAct: 'more' }, keys: [['Enter', x.more ? 'next' : 'find a base']] });
  return p;
}

// ---------- the Underworld (mockup `underworld`) ----------

export function r5Underworld(m: UnderworldModel, x: { at: number; who: Who; line: string }, run: R5Run): string {
  const cols = map(m.teams, (t, i) => `<button class="sy31 ${t.state}${i === x.at ? ' on' : ''}" ${go('r8Team', i)} data-testid="r8-team-${t.id}" style="--d:${i * 70}ms"><span class="sp">${SP(t.sprite, 76)}</span><b>${esc(t.name)}</b><small>${esc(t.where)}</small><em>${esc(t.line)}</em></button>`);
  return frame({ id: 'underworld', g: 'Empire', kind: 'uw31', bg: 'night', top: { title: 'The Underworld', sub: `${m.teams.length} teams · ${m.met} met` }, run,
    body: `<section class="ug31" data-m="panel" data-testid="r8-underworld">${cols}</section>`,
    who: who5(x.who), line: x.line, ctas: [['Back', 'r8Regions'], ['Rival file', 'rivalFile']], keys: [['←→', 'team'], ['Enter', 'file'], ['Esc', 'back']] });
}

// ---------- the Gym case (mockup `gymcase`) ----------

export function r5GymCase(m: GymCaseModel, x: { at: number; who: Who }, run: R5Run): string {
  const cls: Record<string, string> = { nova: 'g-nova', rival: 'g-rocket', next: 'g-next', free: 'g-free' };
  const gyms = map(m.gyms, (g, i) => `<button class="gs44 ${cls[g.who]}${i === x.at ? ' on' : ''}" ${go('r8Gym', i)} data-testid="r8-gym-${g.id}" style="--d:${i * 80}ms"><span class="slot">${SP(`bd-${g.type}`, 64)}</span><b>${esc(g.town)}</b><em>${esc(g.leader)}</em><i>${esc(g.word)}</i></button>`);
  const cur = m.gyms[x.at];
  const next = m.gyms.find((g) => g.who === 'next');
  const line = `“${m.mine ? `${m.mine} Gym${m.mine === 1 ? '' : 's'} pay us.` : 'No Gym pays us yet.'}${next ? ` ${next.town} is next, and ${next.leader} is waiting.` : ''}”`;
  return frame({ id: 'gymcase', g: 'Empire', kind: 'gy44', bg: 'night', top: { title: 'Gym case', sub: `${m.mine} of ${m.gyms.length} Gyms are yours` }, run,
    body: `<section class="gy44" data-m="panel" data-testid="r8-gymcase"><i class="lid" data-nocheck=""></i>${gyms || '<b>No Gyms in this region</b>'}</section>`,
    who: who5(x.who), line, ctas: [['Back', 'r8Regions'], ...(cur ? [[`Plan ${cur.town}`, 'r8GymPlan', x.at, 'r8-gym-plan'] as R5Cta] : [])], keys: [['←→↑↓', 'Gym'], ['Enter', 'plan'], ['Esc', 'back']] });
}

// ---------- the Ending (mockup `ending`) ----------

const CITY48 = [70, 120, 90, 150, 60, 110, 80, 0, 0, 100, 140, 70, 125, 85, 105, 65];
const FIRE48: [number, number, string, number][] = [[14, 22, '#ffd75a', 150], [34, 12, '#ff5d8a', 110], [70, 16, '#5ad1ff', 140], [88, 30, '#ffb86a', 100], [56, 6, '#b98aff', 90]];

export function r5Ending(m: EndingModel, x: { crew: string[]; boss: string; initial: string; notice: string | null }, run: R5Run): string {
  const l = x.crew.slice(0, 3), r = x.crew.slice(3, 6);
  const stats = map(m.pay, ([k, v], i) => `<span style="--i:${i};--d:${i * 120}ms"><em>${esc(k)}</em><b>${esc(v)}</b></span>`);
  return page({ id: 'ending', g: 'Empire', kind: 'en48', body: `${bg('night', 'Empire', run)}<div class="fk48" data-nocheck="">${map(FIRE48, ([px, py, c, z], i) => `<i style="--x:${px}%;--y:${py}%;--c:${c};--z:${z}px;--d:${i * 0.55}s"></i>`)}</div>
  <div class="city48" data-nocheck="">${map(CITY48, (h) => `<i style="--h:${h}px"></i>`)}</div><div class="tw48" data-nocheck=""><i class="wn"></i><i class="bn48"><b>${esc(x.initial)}</b></i><i class="sl">SILPH CO.</i></div>
  <div class="hd48" data-m="ttl" data-testid="dom-ending"><small>${esc(m.sub)}</small><b>${esc(m.title.toUpperCase())}</b><em>${esc(m.line)}</em></div>
  <div class="cw48 l" data-nocheck="">${map(l, (c, i) => `<span style="--d:${700 + i * 120}ms">${c}</span>`)}</div><div class="bs48" data-nocheck="">${x.boss}</div><div class="cw48 r" data-nocheck="">${map(r, (c, i) => `<span style="--d:${1000 + i * 120}ms">${c}</span>`)}</div>
  <div class="ss48" data-testid="dom-end-pay">${stats}<button class="cta on" ${go('r8Credits')} data-testid="r8-credits-open">Credits</button></div>
  ${x.notice ? `<p class="nc8" ${go('dismiss')} data-testid="dom-notice">${esc(x.notice)}</p>` : ''}
  ${keys([['Enter', 'credits', 'r8Credits'], ['H', 'hall of infamy', 'r8Infamy'], ['Esc', 'back']], 'Empire', run)}` });
}

// ---------- the Credits (mockup `credits`) ----------

export function r5Credits(x: { team: string; boss: string; bossName: string; took: string; crew: (Journey & { pic: string })[]; also: { pic: string; name: string; line: string }[]; page: number; pages: number; notice: string | null }, run: R5Run): string {
  const cards = map(x.crew, (j, i) => `<div class="cc48" style="--d:${300 + i * 140}ms" data-testid="dom-end-member-${esc(j.id)}"><span class="sp">${j.pic}</span><b>${esc(j.name)}</b><i>${esc(cap(j.rank))}${j.where ? ` · ${esc(j.where)}` : ''}</i><em>${esc(j.last)}</em></div>`);
  const also = map(x.also.slice(0, 3), (a, i) => `<div style="--d:${1200 + i * 140}ms"><span class="sp">${a.pic}</span><b>${esc(a.name)}</b><em>${esc(a.line)}</em></div>`);
  return page({ id: 'credits', g: 'Empire', kind: 'cr48', body: `<i class="gr48" data-nocheck=""></i><div class="ct48" data-m="ttl"><small>Pocket Raiders · Dominion${x.pages > 1 ? ` · ${x.page + 1} of ${x.pages}` : ''}</small><b>THE CREW OF ${esc(x.team.toUpperCase())}</b></div>
  <section class="ln48" data-m="panel"><span class="sp">${x.boss}</span><small>Starring</small><b>${esc(x.bossName.toUpperCase())}</b><em>${esc(x.took)}</em></section>
  <section class="cg48" data-testid="dom-end-crew">${cards}</section>
  ${also ? `<section class="as48"><small>Also starring</small>${also}</section>` : ''}
  <div class="cb48"><button class="cta" ${go('r8Infamy')}>Hall of Infamy</button><button class="cta on" ${go('endClose')} data-testid="dom-end-close">Next Dominion</button></div>
  ${x.notice ? `<p class="nc8" ${go('dismiss')} data-testid="dom-notice">${esc(x.notice)}</p>` : ''}
  ${keys([['Enter', 'next', 'endClose'], ['←→', 'page'], ['Esc', 'skip']], 'Empire', run)}` });
}

// ---------- the Hall of Infamy (mockup `infamy`) ----------

/** `o` (R1 follow-up): the Hall opened from the next run's pages, with its own text box buttons and keys. */
export function r5Infamy(x: { region: string; day: number; peds: { pic: string; name: string; role: string; top?: boolean }[] }, run: R5Run, o?: { team: string; ctas: R5Cta[]; keys: R5Key[] }): string {
  const peds = map(x.peds.slice(0, 5), (p, i) => `<div class="ped30${p.top ? ' top' : ''}" style="--d:${i * 160}ms"><span class="sp">${p.pic}</span><i class="base"></i><b>${esc(p.name)}</b><em>${esc(p.role)}</em></div>`);
  return frame({ id: 'infamy', g: 'Empire', kind: 'hi30', bg: 'night', top: { title: 'Hall of Infamy', sub: `${x.region} taken · Day ${x.day}` }, run,
    body: `<i class="spot30" data-nocheck=""></i><section class="hall30" data-m="panel" data-testid="r8-infamy">${peds}</section>`,
    who: { name: 'Rotom', k: 'p-rotom' }, line: o ? `“Bzzt! ${o.team}, the team that took ${x.region}. Saved for good.”` : `“Bzzt! Saved to the Hall. ${x.region} will remember. ${x.region} will not forgive.”`,
    ctas: o?.ctas ?? [['Credits', 'r8Credits'], ['Next Dominion', 'endClose']], keys: o?.keys ?? [['Enter', 'continue', 'r8Credits']] });
}

export { top };
