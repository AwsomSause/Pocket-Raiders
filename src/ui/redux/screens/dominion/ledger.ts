// DOMINION D6: the Empire Ledger (mockup 7), drawn as the team's own book open on the Boss's desk by candlelight.
// Spread 1 is the mockup's (Money | Empire); the index tabs turn to Territory | Notoriety and Crew | Stores.
// Plain data in from core/dominion/ledgerScreens.ts; the scene keeps the spread and the keys (◀ ▶ page, L close).

import './dominion.css';
import type { LedgerModel } from '../../../../core/dominion/ledgerScreens';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { stage } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const INK = '#3a2a18', RED = '#a8322a', GREEN = '#2d7a3e', VIOLET = '#5b34b0', BLUE = '#2f63b8', HEAD = '#5a1e14', SOFT = '#7a6040';

const pageHead = (title: string, n: number): string =>
  `<div class="row sp" style="border-bottom:2px solid #8a6a3a;padding-bottom:4px"><b style="font:700 22px var(--regal);letter-spacing:.06em;color:${HEAD}">${esc(title)}</b><span style="font-size:14px;color:${SOFT}">page ${n}</span></div>`;
const row = (l: string, r: string, style = ''): string => `<div class="row sp"><span>${l}</span><b style="${style}">${r}</b></div>`;
const LEFT = `left:78px;top:80px;width:402px;height:420px;z-index:5;border-radius:10px 4px 4px 10px;background:linear-gradient(90deg,#e6d6ae,#f4e9cc 10%,#f2e6c6 88%,#cdb88a);box-shadow:inset 0 0 0 2px #b79f6c;color:${INK};padding:18px 26px 16px 30px;overflow:hidden`;
const RIGHT = `left:482px;top:80px;width:402px;height:420px;z-index:5;border-radius:4px 10px 10px 4px;background:linear-gradient(90deg,#cdb88a,#f2e6c6 12%,#f4e9cc 90%,#e6d6ae);box-shadow:inset 0 0 0 2px #b79f6c;color:${INK};padding:18px 30px 16px 26px;overflow:hidden`;

function moneyPage(m: LedgerModel): string {
  const g = m.money;
  const pts = (p: [number, number][]): string => p.map(([x, y]) => `${x},${y}`).join(' ');
  const last = g.clean6.at(-1) ?? [340, 96];
  const lines = g.lines.map((l) => `<div class="row sp"><span>${esc(l.label)}${l.due ? ` <i style="font-size:12px;color:${SOFT}">${esc(l.due)}</i>` : ''}</span><b style="color:${l.plus ? GREEN : RED}">${esc(l.n)}</b></div>`).join('')
    || `<div class="row sp" style="color:${SOFT}"><span>Nothing in or out yet</span><b>₽0</b></div>`;
  return `<div class="a" style="${LEFT}" data-testid="dom-ledger-money">
    ${pageHead('Money', m.pages[0])}
    <div class="row" style="gap:18px;margin-top:8px;font-size:17px">
      <span class="row" style="gap:6px"><img class="ic" src="${img('g-amulet-coin')}" alt="">Clean <b class="num" style="font-size:26px;color:${GREEN}" data-testid="dom-ledger-clean">${esc(g.clean)}</b></span>
      <span class="row" style="gap:6px"><img class="ic" src="${img('g-big-nugget')}" alt="">Dirty <b class="num" style="font-size:26px;color:${RED}" data-testid="dom-ledger-dirty">${esc(g.dirty)}</b></span>
    </div>
    <svg width="344" height="108" viewBox="0 0 344 108" style="display:block;margin-top:6px" aria-hidden="true">
      <g stroke="#cdb88a" stroke-width="1"><line x1="0" y1="24" x2="344" y2="24"/><line x1="0" y1="52" x2="344" y2="52"/><line x1="0" y1="80" x2="344" y2="80"/></g>
      <polygon points="${pts(g.clean6)} ${last[0]},96 ${g.clean6[0]?.[0] ?? 0},96" fill="rgba(45,122,62,.14)"/>
      <polyline points="${pts(g.clean6)}" fill="none" stroke="${GREEN}" stroke-width="3" stroke-linejoin="round"/>
      <polyline points="${pts(g.dirty6)}" fill="none" stroke="${RED}" stroke-width="2.5" stroke-dasharray="6 4"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="5" fill="${GREEN}"/>
      <g font-family="Pixelify Sans" font-size="12" fill="${SOFT}"><text x="0" y="108">${esc(g.from)}</text><text x="322" y="108">${esc(g.to)}</text></g>
    </svg>
    <b style="display:block;margin-top:8px;font:700 15px var(--regal);letter-spacing:.08em;color:${HEAD}">THIS WEEK</b>
    <div class="col" style="gap:3px;margin-top:4px;font-size:15px" data-testid="dom-ledger-lines">
      ${lines}
      <div class="row sp" style="border-top:2px solid ${INK};padding-top:3px;font-size:16px"><b>Net</b><b class="num" style="font-size:22px;color:${g.netPlus ? GREEN : RED}" data-testid="dom-ledger-net">${esc(g.net)}</b></div>
    </div>
  </div>`;
}

function empirePage(m: LedgerModel): string {
  const e = m.empire;
  const t = e.tension;
  return `<div class="a" style="${RIGHT}" data-testid="dom-ledger-empire">
    ${pageHead('Empire', m.pages[1])}
    <div class="col" style="gap:3px;margin-top:8px;font-size:15px">
      ${row('Districts held', esc(e.held))}
      ${row('Buildings', esc(e.buildings))}
      ${row('Rackets', esc(e.rackets), 'max-width:230px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}
      ${row('Pokémon', esc(e.pokemon))}
    </div>
    <div class="col" style="gap:3px;margin-top:10px;font-size:15px">
      <div class="row sp"><span>♥ Regard</span><b style="color:${GREEN}" data-testid="dom-ledger-regard">${e.regard}</b></div><div class="mt g t" style="--v:${Math.min(100, e.regard)}"></div>
      <div class="row sp"><span>✊ Dread</span><b style="color:${VIOLET}" data-testid="dom-ledger-dread">${e.dread}</b></div><div class="mt v t" style="--v:${Math.min(100, e.dread)}"></div>
      <div class="row sp"><span>Wanted · ${esc(e.wanted.word)}</span><b style="color:${RED}">${e.wanted.n}</b></div><div class="mt heat t" style="--v:${e.wanted.n}"></div>
      <div class="row sp"><span class="row" style="gap:5px"><img class="px" src="${img(t.look)}" alt="" style="width:20px;height:20px;object-fit:cover;object-position:top">Tension · ${esc(t.name)} · ${esc(t.word)}</span><b style="color:${RED}">${t.n ?? '—'}</b></div><div class="mt r t" style="--v:${t.n ?? 0}"></div>
      <div class="row sp"><span>Hero Threat · ${esc(e.hero.word)}</span><b style="color:${BLUE}">${e.hero.n}</b></div><div class="mt b t" style="--v:${e.hero.n}"></div>
    </div>
  </div>`;
}

function territoryPage(m: LedgerModel): string {
  const rows = m.territory.map((d) => `<div style="display:grid;grid-template-columns:96px 1fr 34px 34px 34px;gap:6px;align-items:center;font-size:14px;line-height:1.1;${d.here ? 'font-weight:700' : ''}">
      <span>${esc(d.name)}${d.here ? ' ★' : ''}</span>
      <span class="col" style="gap:2px"><span style="font-size:12px;white-space:nowrap;color:${d.cls === 'g' ? GREEN : d.cls === 'rd' ? RED : d.cls === 'y' ? '#8a5a14' : SOFT}">${esc(d.word)} · ${d.control}</span><span class="mt t" style="--v:${d.control};height:5px"></span></span>
      <b style="color:${GREEN};text-align:right">${d.regard}</b><b style="color:${VIOLET};text-align:right">${d.dread}</b><b style="color:${RED};text-align:right">${d.heat}</b>
    </div>`).join('');
  return `<div class="a" style="${LEFT}" data-testid="dom-ledger-territory">
    ${pageHead('Territory', m.pages[0])}
    <div style="display:grid;grid-template-columns:96px 1fr 34px 34px 34px;gap:6px;font-size:12px;color:${SOFT};margin:6px 0 2px"><span>Town</span><span>Control</span><span style="text-align:right">♥</span><span style="text-align:right">✊</span><span style="text-align:right">Heat</span></div>
    <div class="col" style="gap:3px">${rows}</div>
    <div style="margin-top:8px;font-size:12px;color:${SOFT};line-height:1.25">Held at 60, Owned at 80. A Held town needs the Boss, or a member on Hold, once a week.</div>
  </div>`;
}

function ladderPage(m: LedgerModel): string {
  const l = m.ladder;
  const steps = l.steps.map((s) => `<div class="row sp" style="font-size:14px;padding:2px 6px;border-radius:5px;${s.on ? `background:rgba(168,50,42,.14);box-shadow:inset 0 0 0 2px ${RED}` : ''};${s.done ? '' : 'opacity:.55'}"><span><b style="color:${s.on ? RED : INK}">${esc(s.word)}</b> <i style="font-size:12px;color:${SOFT}">${esc(s.calls)}</i></span><b>${s.min}+</b></div>`).join('');
  const p = l.parts;
  return `<div class="a" style="${RIGHT}" data-testid="dom-ledger-ladder">
    ${pageHead('Notoriety', m.pages[1])}
    <div class="row sp" style="margin-top:6px;font-size:15px"><span>Towns ${p.towns} · Holdings ${p.holdings} · Crew ${p.members}</span><b class="num" style="font-size:22px;color:${RED}" data-testid="dom-ledger-notoriety">${p.total}</b></div>
    <div class="col" style="gap:2px;margin-top:6px">${steps}</div>
    <b style="display:block;margin-top:8px;font:700 14px var(--regal);letter-spacing:.08em;color:${HEAD}">${l.next ? `${esc(l.next.word.toUpperCase())} IN ${l.next.need}` : 'AT THE TOP'}</b>
    <div style="font-size:13px;line-height:1.3;margin-top:2px">${l.opens.map((o) => `· ${esc(o)}`).join('<br>')}</div>
  </div>`;
}

function crewPage(m: LedgerModel): string {
  const c = m.crew;
  const ranks = c.ranks.map(([w, n]) => `${esc(w)} ${n}`).join(' · ');
  const members = c.members.map((x) => `<div class="row sp" style="font-size:14px"><span><b>${esc(x.name)}</b> <i style="font-size:12px;color:${SOFT}">${esc(x.rank)} · ${esc(x.task)}</i></span><b style="color:${x.loyalty < 20 ? RED : GREEN}">${x.loyalty}</b></div>`).join('');
  return `<div class="a" style="${LEFT}" data-testid="dom-ledger-crew">
    ${pageHead('Crew', m.pages[0])}
    <div class="col" style="gap:3px;margin-top:8px;font-size:15px">
      ${row('Members', esc(c.count))}
      ${row('By rank', esc(ranks))}
      ${row('Wages a week', esc(c.wages), `color:${RED}`)}
    </div>
    <div class="row sp" style="margin-top:10px;font-size:12px;color:${SOFT}"><span>Name · rank · task</span><span>Loyalty</span></div>
    <div class="col" style="gap:3px">${members}</div>
  </div>`;
}

function storesPage(m: LedgerModel): string {
  const s = m.stores;
  return `<div class="a" style="${RIGHT}" data-testid="dom-ledger-stores">
    ${pageHead('Pokémon and stores', m.pages[1])}
    <div class="col" style="gap:3px;margin-top:8px;font-size:15px">${s.rows.map(([l, r]) => row(esc(l), esc(r))).join('')}</div>
    <b style="display:block;margin-top:10px;font:700 14px var(--regal);letter-spacing:.08em;color:${HEAD}">KEY ITEMS</b>
    <div style="font-size:14px;line-height:1.3">${s.keyItems.length ? s.keyItems.map((k) => esc(k.replace(/-/g, ' '))).join(' · ') : '—'}</div>
  </div>`;
}

/** Round-3 overlays (mockup s7, passes 4, 7, 9, 10, 17, 18, 20, 25): haze, bokeh, embers and stars, the colour grade,
 * the edge glow and the gold frame; on the money spread, the spotlight and sunburst on the week's net. None take clicks. */
const PTS: [string, number, number, number, number, string][] = [
  ['ember', 27, 348, -5.2, 4.1, '#ffdf9a'], ['ember', 59, 414, -5.9, 3.8, '#fff'], ['ember', 24, 343, -5.8, 5.9, '#ffdf9a'],
  ['ember', 43, 409, -1.6, 4.2, '#fff'], ['ember', 66, 393, -4.2, 4.6, '#fff'], ['ember', 64, 343, -2.2, 3.7, '#ffdf9a'],
  ['ember', 24, 413, -0.3, 3.1, '#ffdf9a'], ['ember', 56, 382, -0.8, 5.2, '#ffdf9a'], ['star', 711, 434, -5.1, 3.2, '#ffc070'],
  ['star', 657, 450, -0.6, 4.6, '#ffc070'], ['star', 682, 409, -0.5, 3.7, '#ffdf9a'], ['star', 723, 429, -3.0, 4.6, '#fff'],
];
const BOKEH = 'radial-gradient(circle 46px at 106px 428px,color-mix(in srgb,#ffdf9a 34%,transparent),color-mix(in srgb,#ffdf9a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 50px at 313px 155px,color-mix(in srgb,#ffc070 34%,transparent),color-mix(in srgb,#ffc070 18%,transparent) 70%,transparent 100%),radial-gradient(circle 51px at 123px 194px,color-mix(in srgb,#ffdf9a 34%,transparent),color-mix(in srgb,#ffdf9a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 23px at 841px 135px,color-mix(in srgb,#ffc070 34%,transparent),color-mix(in srgb,#ffc070 18%,transparent) 70%,transparent 100%),radial-gradient(circle 31px at 467px 173px,color-mix(in srgb,#ffdf9a 34%,transparent),color-mix(in srgb,#ffdf9a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 38px at 88px 137px,color-mix(in srgb,#ffc070 34%,transparent),color-mix(in srgb,#ffc070 18%,transparent) 70%,transparent 100%),radial-gradient(circle 52px at 54px 146px,color-mix(in srgb,#ffdf9a 34%,transparent),color-mix(in srgb,#ffdf9a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 24px at 229px 183px,color-mix(in srgb,#ffc070 34%,transparent),color-mix(in srgb,#ffc070 18%,transparent) 70%,transparent 100%)';

function overlays(money: boolean): string {
  const pts = PTS.map(([k, x, y, dl, t, c]) => `<i class="pt ${k} f" style="left:${x}px;top:${y}px;--dl:${dl}s;--t:${t}s;--c:${c}"></i>`).join('');
  return `<div class="haze" style="--hz:#ffc070;--hz2:#ffdf9a" aria-hidden="true"></div>
  <div class="bokeh" aria-hidden="true" style="background:${BOKEH}"></div>
  <div class="pts" aria-hidden="true">${pts}</div>
  <div class="grade" aria-hidden="true" style="--g1:#ffc070;--g2:#ffdf9a"></div>
  ${money ? '<div class="focus" aria-hidden="true" style="left:414px;top:444px;--r:100px;--fc:255,215,90" data-testid="dom-ledger-focus"></div>' : ''}
  <div class="edgeglow" aria-hidden="true" style="--eg:#ffc070"></div>
  <div class="orn" aria-hidden="true"></div>
  ${money ? `<div class="rays turn finale" aria-hidden="true" style="left:304px;top:334px;width:220px;height:220px;--rc:rgba(255,215,90,.30)"></div><i class="glint fg" style="left:469px;top:384px;--g:20px"></i><i class="glint fg" style="left:344px;top:479px;--g:14px;animation-delay:calc(var(--now,0s) - 1.4s)"></i>` : ''}`;
}

export function ledgerView(m: LedgerModel, notice: string | null): string {
  const [left, right] = m.spread === 1 ? [territoryPage(m), ladderPage(m)] : m.spread === 2 ? [crewPage(m), storesPage(m)] : [moneyPage(m), empirePage(m)];
  const tabs = m.tabs.map((t, i) => `<div class="idx" style="left:896px;top:${200 + i * 62}px;background:${t.colour};${t.on ? 'transform:translateX(8px);box-shadow:0 0 0 3px #1a0f08,0 0 12px rgba(255,220,150,.5)' : ''}"${act('ledgerTab', i)} data-testid="dom-ledger-tab-${i}">${esc(t.word)}</div>`).join('');
  const scribble = m.spread === 0 && m.money.scribble
    ? `<svg class="a" style="left:356px;top:420px;z-index:9" width="118" height="46" viewBox="0 0 118 46" aria-hidden="true"><path d="M8 26 C 6 8, 104 2, 112 20 S 40 46, 14 34 Q 6 30, 22 12" fill="none" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/></svg>
      <div class="a" style="left:300px;top:466px;z-index:9;font:700 14px var(--ui);color:#c0392b;transform:rotate(-4deg)" data-testid="dom-ledger-scribble">${esc(m.money.scribble)}</div>`
    : '';
  return stage(`
  <div class="layer" style="background:repeating-linear-gradient(180deg,#4a2e1a 0 46px,#3f2715 46px 48px,#523320 48px 92px,#3a2414 92px 94px);"></div>
  <div class="layer" style="background:radial-gradient(520px 340px at 480px 300px,rgba(255,190,110,.28),transparent 70%),radial-gradient(260px 260px at 40px 470px,rgba(255,170,80,.35),transparent 70%)"></div>
  <div class="ttl" style="--t1:#8a5a14;--t2:#c98a2a" data-testid="dom-ledger">Ledger <span class="sub">· Week ${m.week}</span></div>
  <div class="keys"><span class="kc"${act('ledgerPage', -1)}>◀</span><span>page</span><span class="kc"${act('ledgerPage', 1)}>▶</span><span class="key" style="margin-left:8px"${act('back')}>L</span><span>close</span></div>

  <div class="a" style="left:18px;top:388px;width:34px;height:110px;z-index:12;background:linear-gradient(90deg,#e9dcc0,#fff6df 40%,#cdbd9a);border-radius:6px 6px 3px 3px;box-shadow:0 0 0 3px #1a0f08"></div>
  <div class="a" style="left:10px;top:490px;width:50px;height:14px;z-index:12;border-radius:50%;background:#b08a3a;box-shadow:0 0 0 3px #1a0f08"></div>
  <div class="a flick" style="left:24px;top:350px;width:22px;height:40px;z-index:13;border-radius:50% 50% 40% 40%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#fff8d0,#ffd23f 40%,#ff7a1c 75%,transparent);box-shadow:0 0 30px 12px rgba(255,180,60,.45)"></div>

  <div class="a" style="left:58px;top:64px;width:844px;height:452px;z-index:8;pointer-events:none"><span class="brk" style="inset:0;--L:34px;--k:#e3b955"></span></div>
  <div class="a" style="left:64px;top:70px;width:832px;height:440px;border-radius:16px;background:linear-gradient(180deg,#6a1e1e,#4a1212);box-shadow:0 0 0 3px #1a0808,0 26px 50px rgba(0,0,0,.6);z-index:4"></div>
  ${left}
  <div class="a" style="left:476px;top:80px;width:10px;height:420px;z-index:6;background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,.05),rgba(0,0,0,.35))"></div>
  ${right}
  <div class="stamp" style="left:684px;top:98px;color:${RED};text-shadow:none;box-shadow:none;font-size:20px;transform:rotate(8deg);z-index:9;background:rgba(244,233,204,.6);${m.spread === 0 ? '' : 'display:none'}" data-testid="dom-ledger-stamp">${esc(m.stamp)}</div>
  <div class="a" style="left:858px;top:64px;width:22px;height:74px;z-index:9;background:linear-gradient(90deg,#8a1414,#c62a2a,#8a1414);clip-path:polygon(0 0,100% 0,100% 100%,50% 82%,0 100%)"></div>
  <img class="spr" src="${img('g-nugget')}" alt="" style="left:892px;top:466px;width:32px;height:32px;z-index:12">
  <img class="spr" src="${img('g-amulet-coin')}" alt="" style="left:910px;top:446px;width:34px;height:34px;z-index:12">
  <div class="pool flick" style="left:-120px;top:240px;width:520px;height:340px;z-index:11;--pc:rgba(255,170,70,.28)"></div>
  <div class="glint" style="left:916px;top:448px;--g:18px"></div>
  <div class="glint" style="left:166px;top:150px;--g:14px;animation-delay:-1.6s;--gc:#7fe0a0"></div>
  <div class="puff" style="left:22px;top:330px;width:26px;height:26px;z-index:13;--fc:rgba(220,210,200,.4)"></div>
  <div class="puff" style="left:22px;top:330px;width:26px;height:26px;z-index:13;--fc:rgba(220,210,200,.4);animation-delay:-2s;--dx:-12px"></div>
  <div class="a" style="left:904px;top:150px;width:44px;height:40px;z-index:12;border-radius:10px 10px 14px 14px;background:radial-gradient(circle at 35% 30%,#4a5a8a,#141a30 70%);box-shadow:0 0 0 3px #0a0d18"></div>
  <div class="a" style="left:912px;top:40px;width:18px;height:130px;z-index:13;transform:rotate(16deg);background:linear-gradient(90deg,#f4efe4,#d8cdb4);clip-path:polygon(50% 0,100% 30%,70% 100%,30% 100%,0 30%);filter:drop-shadow(1px 1px 0 #3a2a18)"></div>
  ${scribble}
  ${tabs}
  <div class="a" style="left:850px;top:466px;width:34px;height:34px;z-index:7;background:linear-gradient(135deg,transparent 50%,#d8c597 50%,#f4e9cc);box-shadow:-2px -2px 4px rgba(0,0,0,.2)"></div>
  ${overlays(m.spread === 0)}
  ${notice ? `<div class="a" style="left:120px;top:516px;width:720px;z-index:14;text-align:center;font:600 14px var(--ui);color:#ffe9b0;text-shadow:0 1px 0 #000"${act('dismiss')} data-testid="dom-notice">${esc(notice)}</div>` : ''}
  `, 'background:#2a1a10', 'kl-warm vign grain');
}
