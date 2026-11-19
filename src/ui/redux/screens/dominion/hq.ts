// DOMINION slice D5: the HQ menu, drawn as mockup 6 ("The HQ, three weeks later"): the building cut open with its
// rooms, the yard with its guard dogs, the next upgrade and the Buy Room list; plus the View Assets and Money overlays
// in the same skin. Plain data in from core/dominion/hqScreens.ts; the scene's HqController keeps the cursors.

import './dominion.css';
import type { AssetsModel, BaseModel, CellModel, MoneyModel } from '../../../../core/dominion/hqScreens';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { skylineUrl } from './paint';
import { stage, tabs, topBar } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

/** The building's room grid area (mockup 6: 50..582 x 170..370). */
const GX = 50, GY = 170, GW = 532, GH = 200;

function cell(c: CellModel, cols: number, rows: number): string {
  const cw = GW / cols, ch = GH / rows;
  const x = GX + c.col * cw, y = GY + c.row * ch, w = cw * c.span, h = ch - 2;
  const small = rows > 2 || cols > 5;
  const font = small ? 'font-size:10px;' : '';
  const style = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;z-index:3;${font}`;
  if (c.state === 'empty') return `<div class="room empty" style="${style}" data-testid="dom-slot-empty"><span style="opacity:.7">EMPTY</span><span class="e" style="color:#9fb2e6">${esc(c.fx)}</span></div>`;
  const icon = c.icon ? `<img class="ic ${small ? '' : 'xl'}" src="${img(c.icon)}" alt=""${c.state === 'blueprint' ? ' style="opacity:.55;filter:grayscale(1) brightness(1.6) sepia(1) hue-rotate(160deg)"' : ''}>` : '';
  if (c.state === 'blueprint') return `<div class="room empty blueprint" style="${style}" data-testid="dom-blueprint">${icon}${esc(c.name)}<span class="e" style="color:#bfe8ff">${esc(c.fx)}</span></div>`;
  const spr = c.sprite ? `<img class="spr" src="${img(c.sprite)}" alt="" style="left:${(w / 2 - 24).toFixed(0)}px;top:8px;width:48px;height:42px">` : '';
  const crew = c.crew && !small && c.span > 1 ? `<img class="spr" src="${img('c-gruntb')}" alt="" style="left:16px;bottom:6px;width:27px;height:42px"><img class="spr" src="${img('c-rook')}" alt="" style="right:16px;bottom:6px;width:27px;height:42px">` : '';
  const dim = c.state === 'shut' || c.state === 'ruined' ? 'filter:grayscale(.85) brightness(.6);' : '';
  const work = c.state === 'work' || c.state === 'up' ? '<div class="a" style="inset:0;background:repeating-linear-gradient(135deg,rgba(255,210,63,.18) 0 8px,transparent 8px 16px);pointer-events:none"></div>' : '';
  const fxc = c.state === 'ruined' || c.state === 'shut' ? 'color:#ff8f8f' : c.state === 'work' || c.state === 'up' ? 'color:#ffe28a' : '';
  return `<div class="room" style="${style}--w1:${c.w1};--w2:${c.w2};${dim}"${act('room', c.uid ?? '')} data-testid="dom-room-${esc(c.uid ?? '')}">${work}${spr}${icon}${c.sprite ? `<span style="margin-top:42px">${esc(c.name)}</span>` : esc(c.name)}<span class="e" style="${fxc}">${esc(c.fx)}</span>${crew}</div>`;
}

function building(m: BaseModel): string {
  const [r1, r2] = m.roof, [w1] = m.wall;
  const warehouse = m.level === 1;
  const sign = m.initial
    ? `<div class="a" style="left:268px;top:112px;width:96px;height:42px;display:grid;place-items:center;font:800 30px/1 var(--logo);font-style:italic;color:#e8e2ff;background:#7b3fa0;border:3px solid #e8e2ff;border-radius:6px;box-shadow:0 0 0 4px #e3b955,0 0 0 7px #3a2a0a,0 0 22px rgba(166,120,255,.9);z-index:3">${'' + m.initial}</div>`
    : `<div class="a" style="left:268px;top:112px;width:96px;height:42px;display:grid;place-items:center;font:700 13px/1.1 var(--ui);letter-spacing:.08em;color:#cfd6f5;background:#3a3550;border:3px solid #8f86a8;border-radius:6px;box-shadow:0 0 0 4px #2a2244;z-index:3;text-align:center">${esc(m.name.toUpperCase())}</div>`;
  const up = m.upgrading
    ? `<div class="a" style="left:46px;top:166px;width:540px;height:206px;z-index:6;background:repeating-linear-gradient(135deg,rgba(255,210,63,.16) 0 10px,transparent 10px 22px);box-shadow:inset 0 0 0 3px #ffd23f;pointer-events:none"></div>
       <div class="pill y" style="position:absolute;left:206px;top:340px;z-index:7;font-size:14px" data-testid="dom-upgrading">UNDER WORK: ${esc(m.upgrading.to.toUpperCase())} · ready Day ${m.upgrading.ready}</div>`
    : '';
  const drip = warehouse ? '<div class="a drip" style="left:301px;top:150px;width:3px;height:9px;background:#9cc4ff;border-radius:2px;--d:180px;box-shadow:0 0 6px #9cc4ff;z-index:5"></div>' : '';
  return `${m.level >= 2 ? '<div class="bulbs" style="left:56px;top:150px;width:520px"></div>' : ''}
  <div class="a" style="left:22px;top:96px;width:588px;height:70px;background:linear-gradient(180deg,${r1},${r2});clip-path:polygon(6% 100%,50% 0,94% 100%);z-index:2"></div>
  ${sign}
  <div class="a" style="left:46px;top:166px;width:540px;height:206px;background:#0b0f1e;z-index:2;box-shadow:0 0 0 4px ${w1}"></div>
  ${m.cells.map((c) => cell(c, m.cols, m.rows)).join('')}
  ${up}${drip}`;
}

/** Round-3 look (mockups-v3, screen 6): haze, bokeh, stars, colour grade, edge glow, two sky searchlights, gold frame. */
const FX_BACK = `<div class="haze" style="--hz:#ffd38a;--hz2:#a678ff" aria-hidden="true"></div>
  <div class="bokeh" aria-hidden="true" style="background:radial-gradient(circle 37px at 157px 119px,color-mix(in srgb,#a678ff 34%,transparent),color-mix(in srgb,#a678ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 18px at 884px 500px,color-mix(in srgb,#ffd38a 34%,transparent),color-mix(in srgb,#ffd38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 21px at 82px 159px,color-mix(in srgb,#a678ff 34%,transparent),color-mix(in srgb,#a678ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 46px at 238px 148px,color-mix(in srgb,#ffd38a 34%,transparent),color-mix(in srgb,#ffd38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 37px at 183px 488px,color-mix(in srgb,#a678ff 34%,transparent),color-mix(in srgb,#a678ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 44px at 216px 153px,color-mix(in srgb,#ffd38a 34%,transparent),color-mix(in srgb,#ffd38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 24px at 936px 188px,color-mix(in srgb,#a678ff 34%,transparent),color-mix(in srgb,#a678ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 27px at 888px 84px,color-mix(in srgb,#ffd38a 34%,transparent),color-mix(in srgb,#ffd38a 18%,transparent) 70%,transparent 100%)"></div>
  <div class="pts" aria-hidden="true"><i class="pt star" style="left:709px;top:77px;--dl:-4.4s;--t:5.3s;--c:#fff"></i><i class="pt star" style="left:98px;top:103px;--dl:-0.8s;--t:2.5s;--c:#ffd38a"></i><i class="pt star" style="left:497px;top:132px;--dl:-5.8s;--t:3.3s;--c:#ffd38a"></i><i class="pt star" style="left:798px;top:127px;--dl:-4.3s;--t:2.6s;--c:#fff"></i><i class="pt star" style="left:572px;top:114px;--dl:-4.1s;--t:4.3s;--c:#ffd38a"></i><i class="pt star" style="left:771px;top:82px;--dl:-4.6s;--t:5.0s;--c:#a678ff"></i><i class="pt star" style="left:198px;top:115px;--dl:-1.7s;--t:6.0s;--c:#ffd38a"></i><i class="pt star" style="left:781px;top:82px;--dl:-1.9s;--t:3.6s;--c:#ffd38a"></i><i class="pt star" style="left:637px;top:88px;--dl:-1.9s;--t:3.9s;--c:#a678ff"></i><i class="pt star" style="left:439px;top:119px;--dl:-4.9s;--t:5.7s;--c:#a678ff"></i><i class="pt star" style="left:922px;top:100px;--dl:-3.8s;--t:4.4s;--c:#ffd38a"></i><i class="pt star" style="left:695px;top:81px;--dl:-2.9s;--t:3.3s;--c:#fff"></i><i class="pt shoot" style="left:380px;top:99px;--dl:-1.1s;--t:4.1s;--c:#a678ff"></i></div>
  <div class="grade" aria-hidden="true" style="--g1:#ffd38a;--g2:#a678ff"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#ffd38a"></div><div class="beam sweep" aria-hidden="true" style="left:120px;z-index:1;--a0:-30deg;--a1:14deg;background:linear-gradient(0deg,transparent,#ffd38a 35%,transparent);opacity:.35"></div><div class="beam sweep b" aria-hidden="true" style="left:780px;z-index:1;--a0:22deg;--a1:-18deg;background:linear-gradient(0deg,transparent,#a678ff 35%,transparent);opacity:.3"></div>
  <div class="orn" aria-hidden="true"></div>`;

/** Pass 17 and 25: a spotlight, sunburst and two glints on the blueprint (mockup 6 centres them on it, 528,318). */
function blueprintFx(m: BaseModel): string {
  const c = m.cells.find((x) => x.state === 'blueprint');
  if (!c) return '';
  const cw = GW / m.cols, ch = GH / m.rows;
  const cx = Math.round(GX + c.col * cw + (cw * c.span) / 2), cy = Math.round(GY + c.row * ch + ch / 2);
  return `<div class="focus" aria-hidden="true" style="left:${cx}px;top:${cy}px;--r:100px;--fc:120,215,255"></div>
  <div class="rays turn finale" aria-hidden="true" style="left:${cx - 110}px;top:${cy - 110}px;width:220px;height:220px;--rc:rgba(120,215,255,.30)"></div><i class="glint fg" style="left:${cx + 55}px;top:${cy - 60}px;--g:20px"></i><i class="glint fg" style="left:${cx - 70}px;top:${cy + 35}px;--g:14px;animation-delay:-1.4s"></i>`;
}

function nextPanel(m: BaseModel): string {
  const n = m.next;
  const hd = m.upgrading ? `UPGRADING: LV. ${m.level + 1} ${m.upgrading.to.toUpperCase()}` : n.to ? `NEXT: LV. ${n.to} ${n.name.toUpperCase()}` : `LV. ${m.level} ${m.name.toUpperCase()} · TOP`;
  const rows = n.needs.slice(0, 4).map((x, i) => {
    const pct = Math.max(0, Math.min(100, Math.round((x.have / Math.max(1, x.need)) * 100)));
    const bool = x.need === 1 && i > 0;
    return bool
      ? `<div class="row sp"><span>${esc(x.label)}</span><b class="${x.ok ? 'gn' : 'rd'}">${x.ok ? '✓' : '✗'}</b></div>`
      : `<div class="row sp"><span>${esc(x.label)}</span><b class="${x.ok ? 'gn' : 'y'}">${pct}%</b></div><div class="mt t" style="--v:${pct}"></div>`;
  }).join('');
  const r = n.raises;
  const raise = n.to ? `<div class="xs mu">Lv cap ${r.cap[0]} → ${r.cap[1] ?? '?'} · crew ${r.crew[0]} → ${r.crew[1]} · rooms ${r.slots[0]} → ${r.slots[1]}</div>` : `<div class="xs mu">${esc(m.look)}</div>`;
  const ready = m.upgrading ? `<div class="xs y">Ready Day ${m.upgrading.ready}. Defense is halved until then.</div>` : '';
  return `<div class="pnl" style="left:620px;top:84px;width:330px;height:172px" data-testid="dom-next-lv">
    <div class="hd"><img class="ic" src="${img('g-relic-statue')}" alt="">${esc(hd)}${n.to && !m.upgrading ? `<span class="kc" style="margin-left:auto"${act('upgrade')} data-testid="dom-upgrade">U</span>` : ''}</div>
    <div class="col" style="gap:4px;font-size:15px">${rows}${ready}${raise}</div>
  </div>`;
}

function buildPanel(m: BaseModel): string {
  const rows = m.build.rows.map((r) => {
    const stripe = r.on ? '#7b3fa0' : '#56679d';
    const cost = r.def.status === 'disabled' ? '<span class="mu">later</span>' : `<span class="${r.ok ? (r.on ? '' : 'y') : 'rd'}">₽${r.cost.toLocaleString('en-US')}</span>`;
    const name = `${esc(r.def.name)}${r.def.slots > 1 && !r.outside ? ` · ${r.def.slots} slots` : ''}${r.outside ? ' · outside' : ''}`;
    const sub = r.on ? `<div class="sub" style="font-size:12.5px;line-height:1.2">${r.outside ? `In ${esc(r.where ?? 'a held district')} ◀ ▶ · ` : ''}${esc(r.sub)}</div>` : '';
    return `<div class="ch${r.on ? ' on' : ''}" style="padding:${r.on ? 5 : 4}px 10px ${r.on ? 5 : 4}px 20px;--stripe:${stripe};${r.def.status === 'disabled' || !r.ok ? 'opacity:.6;' : ''}"${act('pickRoom', r.idx)} data-testid="dom-build-${esc(r.def.id)}"><div class="row sp"><span>${name}</span>${cost}</div>${sub}</div>`;
  }).join('');
  return `<div class="pnl" style="left:620px;top:264px;width:330px;height:204px" data-testid="dom-build">
    <div class="hd"><img class="ic" src="${img('g-storage-key')}" alt="">BUILD A ROOM<span class="r">${m.free} slot${m.free === 1 ? '' : 's'} free</span><span class="kc" style="margin-left:6px">B</span></div>
    <div class="col" style="gap:6px;font-size:15px;max-height:128px;overflow:hidden">${rows}</div>
    <div class="xs mu" style="position:absolute;right:12px;bottom:4px">${m.build.at + 1}/${m.build.total} · ▲▼ Enter</div>
  </div>`;
}

export function baseView(m: BaseModel, overlay: string): string {
  const menu = m.menu.filter((x) => x.id !== 'build').map((x) => `<span${act('menu', x.id)} data-testid="dom-menu-${x.id}" style="cursor:pointer"><span class="kc">${esc(x.key)}</span> ${esc(x.label)}</span>`).join(' ');
  const dogs = m.dogs
    ? `<div class="shd" style="left:64px;top:446px;width:70px;height:12px"></div><img class="spr" src="${img('p-houndour')}" alt="" style="left:76px;top:410px;width:44px;height:48px;z-index:4">
       <div class="shd" style="left:500px;top:446px;width:70px;height:12px"></div><img class="spr" src="${img('p-houndour')}" alt="" style="left:512px;top:410px;width:44px;height:48px;z-index:4;transform:scaleX(-1)">`
    : '';
  const fence = m.level >= 3
    ? `<div class="a" style="left:10px;top:380px;width:600px;height:46px;background:repeating-linear-gradient(90deg,#4a4f66 0 3px,transparent 3px 14px);opacity:.7;z-index:1"></div>
       <div class="a" style="left:10px;top:384px;width:600px;height:3px;background:#4a4f66;z-index:1"></div>`
    : '';
  return stage(`<div class="layer" style="background:linear-gradient(180deg,#0b1030,#1d1648 60%,#2a1c4a)"></div>
  <div class="stars twinkle" style="height:200px"></div>
  <img class="cv" src="${skylineUrl()}" alt="" style="position:absolute;inset:0;width:960px;height:540px;opacity:.6">
  ${topBar(m.top)}
  ${building(m)}
  <div class="pool" style="left:40px;top:350px;width:560px;height:90px;z-index:2;--pc:rgba(255,200,120,.38)"></div>
  ${m.level >= 3 ? '<div class="beam sweep" style="left:296px;top:-80px;height:540px;--a0:150deg;--a1:210deg;transform-origin:50% 0;opacity:.6;z-index:2"></div>' : ''}
  <div class="a" style="left:10px;top:372px;width:600px;height:96px;background:linear-gradient(180deg,#2a2a3a,#1c1c28);z-index:1"></div>
  ${fence}${dogs}
  <div class="a row" style="left:96px;top:448px;width:516px;z-index:8;gap:7px;flex-wrap:nowrap;white-space:nowrap;justify-content:center;font:600 11px var(--ui);color:#dfe5ff" data-testid="dom-hq-menu">${menu}</div>
  <div class="a xs" style="left:16px;top:378px;z-index:8;color:#cfd6f5" data-testid="dom-defense">DEFENSE ${m.defense}</div>
  ${nextPanel(m)}
  ${buildPanel(m)}
  ${m.notice ? `<div class="a" style="left:120px;width:400px;top:86px;z-index:30;background:rgba(10,14,30,.92);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3"${act('dismiss')} data-testid="dom-notice">${esc(m.notice)}</div>` : ''}
  ${tabs(0, [0, 1, 2, 5])}
  <div class="a" style="left:500px;top:96px;width:26px;height:50px;z-index:1;background:linear-gradient(90deg,${m.roof[0]},${m.roof[1]});box-shadow:0 0 0 3px #1a1430"></div>
  <div class="puff" style="left:494px;top:70px;width:36px;height:36px"></div>
  <div class="puff" style="left:494px;top:70px;width:36px;height:36px;animation-delay:-1.4s;--dx:24px"></div>
  <div class="puff" style="left:494px;top:70px;width:36px;height:36px;animation-delay:-2.7s;--dx:-6px"></div>
  ${FX_BACK}
  ${blueprintFx(m)}
  ${overlay}`, 'background:#0d1430', 'kl-warm vign grain');
}

const BOX = 'left:60px;top:84px;width:840px;height:384px;z-index:40';

export function assetsOverlay(m: AssetsModel): string {
  const sum = m.summary.map(([k, v]) => `<div class="col" style="gap:0"><span class="xs mu">${k}</span><b style="font-size:15px">${esc(v)}</b></div>`).join('');
  const start = Math.max(0, Math.min(m.at - 3, m.rows.length - 7));
  const rows = m.rows.slice(start, start + 7).map((r, j) => {
    const i = start + j, on = i === m.at;
    return `<div class="ch${on ? ' on' : ''}" style="padding:4px 10px 4px 20px;--stripe:${on ? '#7b3fa0' : '#56679d'}"${act('asset', i)} data-testid="dom-asset-${esc(r.uid)}">
      <div class="row sp"><span>${esc(r.name)} <span class="mu xs">${esc(r.tier)} · ${esc(r.where)}</span></span><span class="xs">${esc(r.state)} · Cond ${r.cond}%</span></div>
      ${on ? `<div class="sub xs">${r.up ? `<span class="kc">U</span> ${esc(r.up)} · ` : ''}<span class="kc">S</span> sell ₽${r.sell.toLocaleString('en-US')}${r.rebuild !== null ? ` · <span class="kc">R</span> rebuild ₽${r.rebuild.toLocaleString('en-US')}` : ''}</div>` : ''}
    </div>`;
  }).join('');
  return `<div class="pnl glass" style="${BOX}" data-testid="dom-assets">
    <div class="hd y"><img class="ic" src="${img('g-big-nugget')}" alt="">VIEW ASSETS<span class="r">Esc close</span></div>
    <div class="row sp" style="gap:10px;margin-bottom:8px">${sum}</div>
    <div class="col" style="gap:5px;font-size:15px">${rows || '<div class="mu">No buildings yet. Build one with B.</div>'}</div>
  </div>`;
}

export function moneyOverlay(m: MoneyModel): string {
  const rows = m.rows.map((r, i) => `<div class="ch${i === m.at ? ' on' : ''}" style="padding:4px 10px 4px 20px;--stripe:${i === m.at ? '#7b3fa0' : '#56679d'};${r.ok ? '' : 'opacity:.55'}"${act('money', i)} data-testid="dom-money-${r.id}">${esc(r.label)}</div>`).join('');
  return `<div class="pnl glass" style="${BOX}" data-testid="dom-money">
    <div class="hd y"><img class="ic" src="${img('g-amulet-coin')}" alt="">MONEY<span class="r">Esc close</span></div>
    <div class="row" style="gap:28px;align-items:flex-start">
      <div class="col" style="gap:6px;width:330px;font-size:15px">
        <div class="row sp"><span>Clean</span><b class="gn" data-testid="dom-clean">₽${m.clean.toLocaleString('en-US')}</b></div>
        <div class="row sp"><span>Dirty</span><b class="rd" data-testid="dom-dirty">₽${m.dirty.toLocaleString('en-US')}</b></div>
        <div class="xs mu">Upgrades take clean money only. Launder through: ${esc(m.front)}</div>
        ${m.wash.length ? `<div class="xs y">In the wash: ${m.wash.map(esc).join('; ')}</div>` : ''}
        <div class="xs" style="margin-top:6px">${esc(m.loan)}</div>
        ${m.broke ? '<div class="xs rd">Broke: a room is shut and Defense is down until the bills are paid.</div>' : ''}
      </div>
      <div class="col" style="gap:5px;flex:1;font-size:15px">${rows}</div>
    </div>
  </div>`;
}
