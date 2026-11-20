// DOMINION D15 screens, ported from the round-4 mockups (plans/evil-mode-rework/mockups-v4/index.html): s10 "The Empire
// across regions" (one card per region over a night sea, joined by the sailing route; the held ones with their Holder,
// Stability, weekly betrayal chance, Boon and answers; the one you play now with the member you brought), plus the
// Leaving page (who holds the region, standing orders, who comes along) and the standing-orders sheet. Plain data in
// from core/dominion/regionsScreens.ts; the scene's EmpireController keeps the input.

import './dominion.css';
import type { EmpireModel, LeaveModel, RealmCard } from '../../../../core/dominion/regionsScreens';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { face } from './crew';
import { stage, WHEEL_KEY } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

const notePanel = (notice: string | null): string =>
  notice ? `<div class="a pnl" style="left:180px;top:200px;width:600px;padding:14px 18px;z-index:40;font-size:16px;line-height:1.35"${act('dismiss')} data-testid="dom-notice">${esc(notice)} <span class="kc">Enter</span></div>` : '';

const portrait = (c: RealmCard, boss: string | null): string => {
  const look = c.who?.look ?? (c.who?.rank === 'THE BOSS' || c.state === 'here' ? boss : null);
  const pic = look ? face(look, 96, 'position:absolute;left:0;top:2px;width:86px;height:98px;object-fit:contain;object-position:bottom') : `<b style="position:absolute;inset:0;display:grid;place-items:center;font:800 42px var(--logo);color:rgba(255,255,255,.55)">${esc(c.crest)}</b>`;
  return `<div style="position:relative;width:86px;height:100px;flex:none;border-radius:8px;overflow:hidden;background:radial-gradient(circle at 50% 80%,rgba(${c.glow},.55),${c.shade} 70%);box-shadow:0 0 0 3px var(--ink)"${c.state === 'here' ? ' class="bob"' : ''}>${pic}</div>`;
};

function card(c: RealmCard, i: number, m: EmpireModel, boss: string | null): string {
  const left = 16 + i * 316, on = i === m.at;
  const glow = c.state === 'here' ? `border-color:#7fe0ff;box-shadow:0 0 0 3px var(--ink),0 0 28px rgba(${c.glow},.45)` : c.rows.some((r) => r.blink) || c.state === 'seceded' || c.state === 'sellout'
    ? `border-color:#ff8a7a;box-shadow:0 0 0 3px var(--ink),0 0 24px rgba(255,90,79,.35)` : '';
  const ring = on ? ';outline:3px solid #ffd23f;outline-offset:3px' : '';
  const dim = c.state === 'later' || c.state === 'lost' ? ';filter:saturate(.45) brightness(.8)' : '';
  const who = c.who
    ? `<div class="row" style="gap:12px;margin-top:6px">${portrait(c, boss)}
      <div class="col" style="gap:3px;font-size:15px;min-width:0"><span class="xs mu">${esc(c.who.label)}</span><b style="font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.who.name)}</b>${c.who.rank ? `<span class="pill ${c.state === 'held' && c.who.rank !== 'USURPED' ? 'v' : 'k'}" style="font-size:12px">${esc(c.who.rank)}</span>` : ''}<span class="xs ${c.who.lineTone || 'mu'}" style="margin-top:3px">${esc(c.who.line)}</span></div>
    </div>`
    : `<div class="row" style="gap:12px;margin-top:6px">${portrait(c, null)}<div class="col xs mu" style="gap:3px">${c.state === 'next' ? 'Across the water. Take this region first.' : 'Further on.'}</div></div>`;
  const rows = c.rows.map((r) => `<div class="row sp"${r.meter !== undefined ? '' : ''}><span>${esc(r.label)}</span><b class="${r.tone}${r.blink ? ' blink' : ''}">${esc(r.value)}</b></div>${r.meter !== undefined ? `<div class="mt ${r.tone === 'gn' ? 'g' : r.tone === 'rd' ? 'r' : 'y'}" style="--v:${r.meter}"></div>` : ''}`).join('');
  const boon = c.boon ? `<div class="row" style="gap:6px"><img class="ic s" src="${img(c.boon.icon)}" alt="">Boon: <b class="${c.boon.weak && c.state !== 'next' && c.state !== 'later' ? 'rd' : 'y'}">${esc(c.boon.name)}</b></div>` : '';
  const btns = c.buttons.length
    ? `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:9px">${c.buttons.map((b, k) => `<span class="bt${b.tone ? ` ${b.tone}` : ''}${on && k === m.buttonAt ? ' on' : ''}" style="justify-content:center;font-size:13px;padding:4px 2px${on && k === m.buttonAt ? ';box-shadow:0 0 0 2px #ffd23f' : ''}"${act('emBtn', `${i}:${k}`)} data-testid="dom-empire-${c.id}-${b.op}">${esc(b.label)}</span>`).join('')}</div>`
    : '';
  return `<div class="pnl${c.state === 'held' && !glow ? ' gild' : ''}" style="left:${left}px;top:70px;width:296px;height:318px;padding:12px 14px;overflow:hidden;${glow}${ring}${dim}"${act('emCard', i)} data-testid="dom-empire-card-${c.id}">
    <div class="row sp"><b style="font:800 28px var(--logo);font-style:italic;color:#fff;text-shadow:0 3px 0 ${c.shade}">${esc(c.name)}</b><span class="pill ${c.pillTone}" style="margin-right:44px">${esc(c.pill)}</span></div>
    ${c.rib ? `<div class="corner-rib" style="right:-38px;bottom:16px;width:136px;font-size:12px;transform:rotate(-38deg)">${esc(c.rib)}</div>` : ''}
    ${who}
    <div class="col" style="gap:4px;margin-top:10px;font-size:15px">${rows}${boon}</div>
    ${btns}
  </div>
  <div class="crest-rim" style="left:${left + 235}px;top:52px;--s:48px;filter:drop-shadow(0 4px 0 rgba(0,0,0,.45)) drop-shadow(0 0 12px rgba(${c.glow},.6))"></div><div class="crest" style="left:${left + 240}px;top:57px;--s:48px;background:linear-gradient(180deg,${c.colour},${c.colour} 55%,${c.shade})">${esc(c.crest)}</div>`;
}

function ordersSheet(m: EmpireModel): string {
  const o = m.orders;
  if (!o) return '';
  const rows = o.rows.map((r) => `<div class="ch${r.on ? ' on' : ''}" style="padding:6px 12px;font-size:16px;--stripe:${r.on ? '#ffd23f' : '#56679d'}"${act('emOrderRow', r.key)} data-testid="dom-orders-${r.key}">
      <div class="row sp"><span>${r.on ? '▶ ' : ''}<b>${esc(r.name)}</b></span><span class="row" style="gap:8px"><span class="kc"${act('emOrderPrev', r.key)}>◀</span><b class="y">${esc(r.options[r.at]!.name)}</b><span class="kc"${act('emOrderNext', r.key)}>▶</span></span></div>
    </div>`).join('');
  return `<div class="a" style="inset:0;background:rgba(6,9,19,.6);z-index:30"></div>
  <div class="pnl gild" style="left:200px;top:110px;width:560px;z-index:31;padding:14px 16px" data-testid="dom-orders"><span class="brk"></span>
    <div class="hd y"><img class="ic" src="${img('g-letter')}" alt="">STANDING ORDERS · ${esc(o.region.toUpperCase())}</div>
    <div class="col" style="gap:6px;margin-top:6px">${rows}</div>
    <div class="row xs mu" style="margin-top:10px;gap:6px"><span class="kc">▲▼</span>order<span class="kc">◀▶</span>change<span class="kc"${act('emOrdersSave')}>Enter</span>send them<span class="kc"${act('emOrdersClose')}>Esc</span>keep the old ones</div>
  </div>`;
}

export function empireView(m: EmpireModel, boss: string | null, notice: string | null): string {
  const cards = m.cards.slice(0, 3).map((c, i) => card(c, i, m, boss)).join('');
  const leave = `<div class="cta${m.leave.ok ? ' shine' : ''}" style="left:600px;top:20px;width:344px;height:36px;font-size:16px;z-index:8${m.leave.ok ? '' : ';filter:saturate(.3);opacity:.85'}"${act('emLeave')} data-testid="dom-empire-leave">${esc(m.leave.label)}</div>`;
  return stage(`
  <div class="layer" style="background:linear-gradient(180deg,#0b1030,#1a2458 55%,#2a3a78)"></div>
  <div class="stars twinkle" style="height:240px"></div>
  <div class="layer" style="height:300px;background:linear-gradient(170deg,transparent 20%,rgba(80,255,200,.16) 32%,transparent 40%,rgba(170,120,255,.18) 52%,transparent 62%);filter:blur(6px)"></div>
  <div class="layer" style="top:300px;background:repeating-linear-gradient(180deg,rgba(120,170,255,.10) 0 2px,transparent 2px 12px),linear-gradient(180deg,#14306a,#0c1c44)"></div>
  <svg class="a" style="left:0;top:0;z-index:2" width="960" height="540" viewBox="0 0 960 540" aria-hidden="true"><path d="M164 398 L 796 398" fill="none" stroke="#efd690" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round" opacity=".6"/></svg>
  <div class="pool" style="left:300px;top:380px;width:360px;height:60px;z-index:1;--pc:rgba(200,220,255,.35)"></div>
  <div class="ttl" style="--t1:#8a5a14;--t2:#d39c14" data-testid="dom-empire">${esc(m.title)} <span class="sub">· ${esc(m.sub)}</span></div>
  <div class="keys">${WHEEL_KEY}<span class="key" style="color:#ffd23f" data-testid="dom-empire-tribute">${esc(m.tribute)}</span><span class="key">${esc(m.hereName)}</span><span>${esc(m.hereDay)}</span><span class="key"${act('back')}>G</span><span>close</span></div>
  ${leave}
  ${cards}
  <div class="tbox" style="left:16px;top:410px;width:928px;height:116px;font-size:18px;line-height:1.5" data-testid="dom-empire-tbox"><span class="who">${esc(m.tbox.who)}</span>${esc(m.tbox.text)}<span class="more blink">▼</span></div>
  <div class="a cross" style="left:120px;top:388px;width:46px;height:20px;z-index:2;--x:120px"><i style="position:absolute;left:0;bottom:0;width:46px;height:9px;background:#0a1230;clip-path:polygon(0 0,100% 0,82% 100%,14% 100%)"></i><i style="position:absolute;left:20px;bottom:9px;width:3px;height:16px;background:#0a1230"></i><i style="position:absolute;left:23px;bottom:10px;width:14px;height:12px;background:#d8dff5;clip-path:polygon(0 0,100% 100%,0 100%)"></i></div>
  <div class="a" style="left:700px;top:378px;width:6px;height:24px;z-index:2;background:#0a1230"></div><div class="a blink" style="left:696px;top:372px;width:14px;height:8px;z-index:2;border-radius:50%;background:#fff3a0;box-shadow:0 0 14px 6px rgba(255,240,150,.6)"></div>
  <div class="haze" style="--hz:#8fe3ff;--hz2:#b48cff" aria-hidden="true"></div>
  <div class="grade" aria-hidden="true" style="--g1:#8fe3ff;--g2:#b48cff"></div>
  <div class="focus" aria-hidden="true" style="left:${16 + Math.max(0, m.cards.findIndex((c) => c.state === 'here')) * 316 + 148}px;top:216px;--r:180px;--fc:120,215,255"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#8fe3ff"></div><div class="beam sweep" aria-hidden="true" style="left:120px;z-index:1;--a0:-30deg;--a1:14deg;background:linear-gradient(0deg,transparent,#8fe3ff 35%,transparent);opacity:.35"></div><div class="beam sweep b" aria-hidden="true" style="left:780px;z-index:1;--a0:22deg;--a1:-18deg;background:linear-gradient(0deg,transparent,#b48cff 35%,transparent);opacity:.3"></div>
  <div class="orn" aria-hidden="true"></div>
  ${ordersSheet(m)}
  ${notePanel(notice)}
  `, 'background:#0a1030', 'kl-cold vign grain');
}

// ---------- Leaving a region ----------

export function leaveView(m: LeaveModel, notice: string | null): string {
  const col = (k: 0 | 1 | 2): string => (m.col === k ? ';box-shadow:0 0 0 3px var(--ink),0 0 0 6px #ffd23f' : '');
  const holders = m.holders.map((h, i) => `<div class="ch${i === m.holderAt ? ' on' : ''}" style="padding:5px 10px;font-size:15px;--stripe:${i === m.holderAt ? '#ffd23f' : '#56679d'}"${act('lvHolder', i)} data-testid="dom-leave-holder-${esc(h.id)}">
      <div class="row" style="gap:8px">${h.look ? face(h.look, 36, 'width:30px;height:36px;object-fit:cover;object-position:top') : '<span style="width:30px"></span>'}<span>${i === m.holderAt ? '▶ ' : ''}<b>${esc(h.name)}</b> <span class="xs mu">${esc(h.rank ?? (h.kind === 'self' ? 'the Boss' : ''))}</span></span></div>
    </div>`).join('');
  const orders = m.orders.map((o, i) => `<div class="ch${m.col === 1 && i === m.orderAt ? ' on' : ''}" style="padding:5px 10px;font-size:15px;--stripe:${m.col === 1 && i === m.orderAt ? '#ffd23f' : '#56679d'}"${act('lvOrder', i)} data-testid="dom-leave-order-${o.key}">
      <div class="xs mu">${esc(o.name.toUpperCase())}</div><div class="row sp"><b class="y">${esc(o.pick)}</b><span class="kc">▶</span></div><div class="xs mu">${esc(o.text)}</div>
    </div>`).join('');
  const bring = m.bring.map((b, i) => `<div class="ch${i === m.bringAt ? ' on' : ''}" style="padding:5px 10px;font-size:15px;--stripe:${i === m.bringAt ? '#ffd23f' : '#56679d'}"${act('lvBring', i)} data-testid="dom-leave-bring-${esc(b.id || 'nobody')}">
      <div class="row" style="gap:8px">${b.look ? face(b.look, 36, 'width:30px;height:36px;object-fit:cover;object-position:top') : '<span style="width:30px"></span>'}<span>${i === m.bringAt ? '▶ ' : ''}<b>${esc(b.name)}</b> <span class="xs mu">${esc(b.rank)}</span></span></div>
    </div>`).join('');
  const L = (t: string, ic: string): string => `<div class="hd y"><img class="ic" src="${img(ic)}" alt="">${esc(t)}</div>`;
  return stage(`
  <div class="layer" style="background:linear-gradient(180deg,#0b1030,#1a2458 55%,#2a3a78)"></div>
  <div class="stars twinkle" style="height:200px"></div>
  <div class="layer" style="top:330px;background:repeating-linear-gradient(180deg,rgba(120,170,255,.10) 0 2px,transparent 2px 12px),linear-gradient(180deg,#14306a,#0c1c44)"></div>
  <div class="ttl" style="--t1:#8a5a14;--t2:#d39c14" data-testid="dom-leave">${esc(m.title)} <span class="sub">· ${esc(m.next)}</span></div>
  <div class="keys">${WHEEL_KEY}<span class="key">◀▶</span><span>column</span><span class="key">▲▼</span><span>choose</span><span class="key"${act('back')}>Esc</span><span>stay</span></div>
  <div class="pnl gild" style="left:16px;top:70px;width:296px;height:300px;padding:10px 12px;overflow:hidden${col(0)}" data-testid="dom-leave-holders">${L('WHO HOLDS IT', 'g-relic-crown')}<div class="col" style="gap:4px;margin-top:4px">${holders}</div></div>
  <div class="pnl" style="left:332px;top:70px;width:296px;height:300px;padding:10px 12px;overflow:hidden${col(1)}" data-testid="dom-leave-orders">${L('STANDING ORDERS', 'g-letter')}<div class="col" style="gap:4px;margin-top:4px">${orders}</div></div>
  <div class="pnl" style="left:648px;top:70px;width:296px;height:300px;padding:10px 12px;overflow:hidden${col(2)}" data-testid="dom-leave-bring">${L('WHO COMES WITH YOU', 'g-member-card')}<div class="xs mu" style="margin:2px 0 4px">One member, any rank. They keep everything.</div><div class="col" style="gap:4px">${bring}</div></div>
  <div class="tbox" style="left:16px;top:384px;width:600px;height:142px;font-size:16px;line-height:1.4" data-testid="dom-leave-notes"><span class="who">THE DOCKS</span>${m.notes.filter(Boolean).map((n) => `<div>${esc(n)}</div>`).join('')}</div>
  <div class="cta${m.why ? '' : ' shine'}" style="left:640px;top:440px;width:304px;height:56px;font-size:20px${m.why ? ';filter:saturate(.3)' : ''}"${act('lvGo')} data-testid="dom-leave-go">⚓ ${esc(m.go)} <span class="kc">L</span></div>
  <div class="haze" style="--hz:#8fe3ff;--hz2:#b48cff" aria-hidden="true"></div>
  <div class="orn" aria-hidden="true"></div>
  ${notePanel(notice)}
  `, 'background:#0a1030', 'kl-cold vign grain');
}
