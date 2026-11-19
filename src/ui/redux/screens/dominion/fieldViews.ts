// DOMINION D2 screens, ported from the redesigned mockups (plans/evil-mode-rework/mockups-redesign/index.html):
// mockup 3 (the Day, on the Region Map) and mockup 4 (the Card before every action), with their five passes each.
// Plain data in from core/dominion/fieldScreens.ts; DominionScene keeps the cursor and the input.

import type { CardModel, MapModel } from '../../../../core/dominion/fieldScreens';
import { act, esc, mini, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { skylineDayUrl } from './paint';
import { stage, tabs, topBar } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

/** A person's picture: a `dominion/*.png` file or a trainer atlas (`trainer/pr/...`). */
function person(look: string, w: number, h: number, cls = ''): string {
  if (!look) return `<span style="display:inline-block;width:${w}px;height:${h}px"></span>`;
  if (look.endsWith('.png')) return `<img class="px ${cls}" src="${rxUrl(look)}" alt="" style="width:${w}px;height:${h}px;object-fit:contain">`;
  return `<span class="${cls}" style="display:inline-block;width:${w}px;height:${h}px;overflow:hidden">${tall(look, h)}</span>`;
}

/** Kanto's land, roads and water, as mockup 3 draws them. */
const KANTO_SVG = `<svg class="a" style="left:0;top:0" width="590" height="378" viewBox="0 0 590 378" aria-hidden="true">
  <path d="M18 30 Q120 4 250 22 L420 14 Q560 18 572 90 L566 230 Q560 330 470 350 L300 356 Q210 372 150 340 L120 300 Q60 320 30 290 Q8 200 20 140 Z" fill="#1d3b3c" stroke="#3f7a72" stroke-width="3"/>
  <path d="M18 30 Q120 4 250 22 L420 14 Q560 18 572 90 L566 230 Q560 330 470 350 L300 356 Q210 372 150 340 L120 300 Q60 320 30 290 Q8 200 20 140 Z" fill="none" stroke="#5fb3a6" stroke-width="1" stroke-dasharray="2 6" transform="translate(0,6)" opacity=".5"/>
  <g fill="none" stroke="#e8cf8a" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 8" style="filter:drop-shadow(0 0 4px rgba(255,220,140,.8))">
    <path d="M100 272 L100 190 L100 76"/><path d="M160 76 L420 64"/><path d="M420 64 L392 188"/><path d="M304 188 L392 188 L530 188"/><path d="M392 188 L440 300"/><path d="M242 188 L290 300 L440 300"/><path d="M530 188 L520 300 L440 300"/>
  </g>
  <g fill="none" stroke="#6fb6ff" stroke-width="3" stroke-dasharray="3 7" opacity=".7"><path d="M100 300 L100 340"/><path d="M160 350 L270 330"/></g>
  <g stroke="#5f8fb8" stroke-width="2" fill="none" opacity=".45"><path d="M480 380 q8 -6 16 0 t16 0"/><path d="M20 360 q8 -6 16 0 t16 0"/><path d="M560 320 q8 -6 16 0 t16 0"/></g>
  <text x="236" y="120" fill="#7fb3a8" font-family="Pixelify Sans" font-size="13" opacity=".8">Mt. Moon</text>
  <text x="460" y="250" fill="#7fb3a8" font-family="Pixelify Sans" font-size="13" opacity=".8">Route 12</text>
</svg>`;

const flag = (x: number, y: number): string => `<div class="a" style="left:${x}px;top:${y}px;width:16px;height:30px;z-index:8"><i style="position:absolute;left:0;top:0;width:3px;height:30px;background:#ddd"></i><i class="float" style="position:absolute;left:3px;top:0;width:16px;height:12px;background:#7b3fa0;box-shadow:inset 0 0 0 2px #e8e2ff;clip-path:polygon(0 0,100% 0,75% 50%,100% 100%,0 100%)"></i></div>`;

// ---------- mockup 3: the Region Map ----------

export function mapView(m: MapModel, notice: string | null, garage: boolean): string {
  const W = (d: MapModel['districts'][number]): number => d.w ?? 124;
  const zones = m.districts.map((d) => {
    const cls = `dz ${d.cls}${d.home ? ' home' : ''}${d.sel ? ' sel' : ''}`;
    const name = d.home ? `<span class="row" style="gap:5px"><img class="ic s" src="${img('g-relic-crown')}" alt="">${esc(d.name)}</span>` : esc(d.name);
    const pill = d.pill ? `<span class="pill ${d.pill.cls}">${esc(d.pill.text)}</span>` : '';
    const boss = d.boss ? '<span class="a" style="right:-10px;top:-12px;z-index:5;font-size:14px" title="The Boss is here">◆</span>' : '';
    const closed = d.closed ? '<span class="a pill r" style="left:50%;bottom:-12px;transform:translateX(-50%);z-index:5;font-size:11px">CHECKPOINT</span>' : '';
    return `<div class="${cls}" style="left:${d.x}px;top:${d.y}px;${d.w ? `width:${d.w}px;` : ''}${d.pill ? '' : 'padding:3px'}"${act('district', d.id)} data-testid="dom-dz-${d.id}">${name}${pill}${boss}${closed}</div>`;
  }).join('');
  const sel = m.districts.find((d) => d.sel);
  const pool = sel ? `<div class="pool" style="left:${sel.x - 60}px;top:${sel.y - 64}px;width:260px;height:180px;z-index:1;--pc:rgba(255,220,120,.35)"></div>` : '';
  // Pings, the PLANNING HERE pin and the held districts' flags are drawn on the stage, over the map (10px, 84px in).
  const pings = sel ? `<div class="ping" style="left:${sel.x + 10}px;top:${sel.y + 66}px;width:${W(sel) + 26}px;height:80px;--pc:#ffd23f"></div><div class="ping" style="left:${sel.x + 10}px;top:${sel.y + 66}px;width:${W(sel) + 26}px;height:80px;--pc:#ffd23f;animation-delay:-1.2s"></div><div class="chipf" style="left:${sel.x + 30}px;top:${sel.y + 56}px;font-size:13px">▼ PLANNING HERE</div>` : '';
  const flags = m.districts.filter((d) => d.flag).map((d) => flag(d.x + W(d) - 2, d.y + 72)).join('');
  const [g, y, r, k] = m.tally;
  const tally = `<div class="a" style="left:176px;top:12px;width:140px;z-index:4">
      <div style="display:flex;height:10px;border-radius:3px;overflow:hidden;box-shadow:0 0 0 2px var(--ink)"><i style="flex:${g};background:#3fcf74"></i><i style="flex:${y};background:#f2c230"></i><i style="flex:${r};background:#ef4a3a"></i><i style="flex:${k};background:#7c87a8"></i></div>
      <div class="row sp xs" style="margin-top:3px"><span class="gn">${g}</span><span class="y">${y}</span><span class="rd">${r}</span><span class="mu">${k}</span></div>
    </div>`;
  const compass = `<div class="a" style="left:516px;top:296px;width:62px;height:62px;border-radius:50%;border:3px solid #e3b955;box-shadow:0 0 0 3px #3a2a0a,0 0 14px rgba(255,210,63,.4);background:radial-gradient(circle,#2a2410,#141b30 70%);z-index:2"><i style="position:absolute;left:50%;top:-2px;width:3px;height:54px;margin-left:-1.5px;background:#8fa3d6"></i><i style="position:absolute;top:50%;left:-2px;height:3px;width:54px;margin-top:-1.5px;background:#8fa3d6"></i><i style="position:absolute;left:19px;top:-12px;border:8px solid transparent;border-bottom:14px solid #ff5a4f"></i></div>`;
  const wanted = `<div class="a pill ${m.wanted.value >= 20 ? 'r' : 'k'}" style="left:440px;top:10px;z-index:4" data-testid="dom-wanted">${esc(m.wanted.word.toUpperCase())} · ${m.wanted.value}%</div>`;
  const f = m.file;
  const targets = f.targets.map((t, i) => `<span${act('target', i)} data-testid="dom-target-${t.id}" style="cursor:pointer">${t.on ? `<b class="y">${esc(t.name)}</b>` : esc(t.name)}</span>`).join(' · ');
  const grid = m.grid.map((bt, i) => {
    const st = `justify-content:center;font-size:14px;padding:4px;${bt.dim ? 'opacity:.45;' : ''}${bt.on ? 'box-shadow:0 0 0 3px #ffd23f,0 0 12px rgba(255,210,63,.6);' : ''}`;
    return `<span class="bt${bt.on ? ' y' : ''}" style="${st}"${act('grid', i)} data-testid="dom-act-${bt.id}">${esc(bt.label)}${bt.night ? ' ☾' : ''}</span>`;
  }).join('');
  const pager = m.pages > 1 ? `<span class="row xs" style="margin-left:auto;gap:4px"><span class="kc"${act('page', -1)}>[</span>${m.page + 1}/${m.pages}<span class="kc"${act('page', 1)}>]</span></span>` : '';
  const cta = m.cta ? `<div class="cta${m.focus === 'grid' ? ' shine' : ''}" style="left:616px;top:422px;width:334px;height:46px;font-size:${m.cta.length > 26 ? 16 : 20}px;padding:0"${act('card')} data-testid="dom-cta">${esc(m.cta)} <span class="kc">Enter</span></div>` : '';
  const garageBox = garage ? `<div class="pnl glass" style="left:616px;top:84px;width:334px;height:330px;z-index:30" data-testid="dom-garage">
      <div class="hd y"><img class="ic" src="${img('g-bicycle')}" alt="">VEHICLES<span class="r"><span class="kc">V</span> close</span></div>
      <div class="col sm" style="gap:6px">${m.vehicles.map((v) => `<div class="row sp" style="gap:8px;align-items:flex-start"${act('buy', v.id)} data-testid="dom-buy-${v.id}"><div><b>${esc(v.name)}</b> <span class="mu xs">${esc(v.does)}</span></div>${v.owned ? '<span class="pill g">OWNED</span>' : `<span class="bt" style="font-size:13px;padding:2px 8px;white-space:nowrap">${esc(v.price)}</span>`}</div>`).join('')}</div>
    </div>` : '';
  return stage(`${topBar(m.top)}
  <div class="a" style="left:10px;top:84px;width:596px;height:384px;z-index:6;pointer-events:none"><span class="brk" style="--L:30px"></span></div>
  <div class="pnl mapgrid" style="left:10px;top:84px;width:596px;height:384px;padding:0;overflow:hidden;border-color:#7f90c8" data-testid="dom-map">
    ${KANTO_SVG}
    ${pool}
    ${zones}
    ${tally}
    ${wanted}
    ${compass}
  </div>
  <div class="pnl" style="left:616px;top:84px;width:334px;height:196px" data-testid="dom-file">
    <div class="row" style="gap:10px"><b class="y" style="font-size:26px">${esc(f.name)}</b><span class="xs" style="color:#ff9ab0" data-testid="dom-regard" title="Regard">♥ ${f.regard}</span><span class="xs" style="color:#b9a0ff" data-testid="dom-dread" title="Dread">✊ ${f.dread}</span></div>
    <div class="stamp" style="right:14px;top:10px;color:${f.stamp.colour};text-shadow:0 0 8px ${f.stamp.colour}99;box-shadow:0 0 12px ${f.stamp.colour}4d">${esc(f.stamp.word)}</div>
    <div class="col" style="gap:3px;margin-top:8px;font-size:15px">
      <div class="row sp"><span>Your Control</span><b class="y" data-testid="dom-control">${f.control}</b></div><div class="mt" style="--v:${f.control}"></div>
      <div class="row sp"><span>Heat here</span><b class="rd" data-testid="dom-dheat">${f.heat}</b></div><div class="mt heat" style="--v:${f.heat}"></div>
      <div class="row sp"><span>${esc(f.rivalName)} Control</span><b class="rd">${f.rival}</b></div><div class="mt r" style="--v:${f.rival}"></div>
    </div>
    ${f.alert ? `<div class="al ${f.alert.cls}" style="margin-top:8px;font-size:14px;padding:4px 8px" data-testid="dom-alert"><img class="ic" src="${img('g-comet-shard')}" alt="">${esc(f.alert.text)}</div>` : ''}
  </div>
  <div class="pnl" style="left:616px;top:288px;width:334px;height:126px;padding:8px 10px" data-testid="dom-grid">
    <div class="row xs mu" style="margin-bottom:7px;gap:4px;white-space:nowrap;overflow:hidden"><img class="ic s" src="${img('g-relic-gold')}" alt="">${targets}${pager}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px 7px">${grid}</div>
  </div>
  ${cta}
  ${garageBox}
  ${tabs(1, [0, 1, 2, 3, 5])}
  <div class="a" style="left:12px;top:472px;z-index:8;font:600 12px var(--ui);color:#dfe5ff" data-testid="dom-map-note">${esc(m.note)} · <span class="kc">T</span> place · <span class="kc">V</span> vehicles</div>
  ${pings}
  ${flags.replace(/left:(\d+)px;top:(\d+)px/g, (_, x: string, yy: string) => `left:${Number(x) + 10}px;top:${Number(yy) + 12}px`)}
  ${notice ? `<div class="a" style="left:180px;width:300px;top:120px;z-index:40;background:rgba(10,14,30,.92);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3"${act('dismiss')} data-testid="dom-notice">${esc(notice)}</div>` : ''}`, '', 'check vign grain');
}

// ---------- mockup 4: the Card ----------

export function cardView(c: CardModel, monFile: string | null, initial: string): string {
  const pct = c.roll ? c.bar : c.chance;
  const parts = c.parts.map(([k, n]) => `<div class="row sp"><span>${esc(k)}</span><b style="color:${n >= 0 ? '#1f8a49' : '#c0392b'}">${n >= 0 ? '+' : '−'}${Math.abs(n)}</b></div>`).join('');
  const odds = c.roll ? `<b style="font-size:15px;color:#5d6a90;letter-spacing:.08em">HOW THE ODDS ARE MADE</b>${parts}
        <div class="row sp" style="border-top:2px solid #28314b;padding-top:3px"><b>Total</b><b data-testid="dom-card-total">${esc(c.dial)}</b></div>`
    : `<b style="font-size:15px;color:#5d6a90;letter-spacing:.08em">NO ROLL</b><div>A sure thing: it just takes the time.</div>`;
  const heatRow = c.heat > 0 || c.failHeat > 0 ? `<div class="row" style="gap:6px;margin-top:6px;white-space:nowrap"><img class="ic" src="${img('g-fire-stone')}" alt="">Heat <b style="color:#c0392b">+${c.heat}</b> here ${c.failHeat ? `<span style="color:#5d6a90">· +${c.failHeat} if it fails</span>` : ''}</div>`
    : c.heat < 0 ? `<div class="row" style="gap:6px;margin-top:6px"><img class="ic" src="${img('g-fire-stone')}" alt="">Heat <b style="color:#1f8a49">${c.heat}</b> here</div>` : '';
  const rd = c.regard || c.dread ? `<div class="row" style="gap:12px">${c.regard ? `<span>Regard <b style="color:${c.regard < 0 ? '#c0392b' : '#1f8a49'}">${c.regard > 0 ? '+' : '−'}${Math.abs(c.regard)}</b></span>` : ''}${c.dread ? `<span>Dread <b style="color:#5b34b0">+${c.dread}</b></span>` : ''}</div>` : '';
  const who = (pic: string, head: string, line: string): string => `<div class="row" style="gap:8px;align-items:flex-start">${pic}<div><b style="color:#b23a2e">${esc(head)}</b><br>${esc(line)}</div></div>`;
  const hurt = c.hurt ? who(person(c.hurt.look, 40, 56), c.hurt.name, c.hurt.line) : '';
  const see = who(person(c.see.look, 40, 56), 'Who might see', c.see.line);
  const fight = c.battle ? who(monFile ? `<span class="pulse" style="display:inline-block;width:40px;height:40px">${mini(monFile, 40)}</span>` : '<span style="display:inline-block;width:40px"></span>', c.battle.always ? 'Battle: always' : `Battle? ${c.battle.chance}%`, c.battle.line) : '';
  const fail = 100 - pct;
  const bar = c.roll ? `<div style="display:flex;height:22px;border-radius:6px;overflow:hidden;box-shadow:0 0 0 3px #28314b"><div style="flex:${pct};background:repeating-linear-gradient(135deg,#3fcf74 0 10px,#35b866 10px 20px);display:flex;align-items:center;padding-left:10px;font:700 14px var(--ui);color:#0c2a16;white-space:nowrap">SUCCESS ${c.exact ? `${pct}%` : `~${c.dial}`}</div><div style="flex:${fail};background:repeating-linear-gradient(135deg,#ef6a5a 0 10px,#d8503f 10px 20px);display:flex;align-items:center;justify-content:flex-end;padding-right:10px;font:700 14px var(--ui);color:#3a0a06;white-space:nowrap">${fail >= 12 ? (c.exact ? `FAIL ${fail}%` : 'FAIL ?') : ''}</div></div>`
    : `<div style="display:flex;height:22px;border-radius:6px;overflow:hidden;box-shadow:0 0 0 3px #28314b"><div style="flex:1;background:repeating-linear-gradient(135deg,#3fcf74 0 10px,#35b866 10px 20px);display:flex;align-items:center;padding-left:10px;font:700 14px var(--ui);color:#0c2a16">SURE THING</div></div>`;
  const blocked = c.blocked ? `<div class="a" style="left:96px;top:486px;z-index:13;font:700 16px var(--ui);color:#ffb4a8;text-shadow:0 2px 0 #000" data-testid="dom-card-blocked">${esc(c.blocked)}</div>` : '';
  return stage(`<img class="cv" src="${skylineDayUrl()}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:blur(2px) saturate(.9)">
  <div class="layer" style="background:linear-gradient(180deg,rgba(10,14,30,.25),rgba(10,14,30,.75))"></div>
  <div class="ttl" style="--t1:#d8a21c;--t2:#e05a2a">${esc(c.title)} <span class="sub">· ${esc(c.sub)}</span></div>
  <div class="keys"><span class="key" data-testid="dom-card-slot">${esc(c.slotLine)}</span>${c.travel ? `<span class="key">${esc(c.travel)}</span>` : ''}<span class="key">${esc(c.level)}</span></div>

  <div class="a" style="left:96px;top:74px;width:768px;height:400px;z-index:10;background:var(--paper);color:var(--paper-ink);border:4px solid var(--paper-edge);border-radius:16px;box-shadow:0 0 0 3px var(--ink),inset 0 -6px 0 #e1e7f6,0 24px 50px rgba(0,0,0,.55);padding:18px 22px" data-testid="dom-card">
    <div class="a" style="inset:8px;border:2px solid #e3b955;border-radius:10px;box-shadow:inset 0 0 0 2px #f6f7fc,inset 0 0 0 4px rgba(227,185,85,.5);pointer-events:none"></div><div class="seal" style="right:-34px;top:-34px;--s:62px;transform:rotate(-12deg)">${esc(initial || 'D')}</div>
    <div class="row sp" style="border-bottom:2px dashed #c9d3e8;padding-bottom:10px">
      <div class="row" style="gap:10px"><img class="ic l" src="${img('g-relic-gold')}" alt=""><b style="font-size:26px;color:#b23a2e;letter-spacing:.02em;white-space:nowrap">The Card</b><span style="font-size:16px;color:#5d6a90;white-space:nowrap">shown before every action</span></div>
      <div class="row" style="gap:8px;font-size:17px;white-space:nowrap" data-testid="dom-card-pays"><img class="ic" src="${img('g-amulet-coin')}" alt="">${c.pays}</div>
    </div>
    <div style="display:grid;grid-template-columns:200px 1fr 220px;gap:18px;margin-top:14px">
      <div class="col" style="align-items:center;gap:8px;position:relative">
        <div class="rays turn" style="position:absolute;left:-22px;top:-6px;width:244px;height:244px;--rc:rgba(245,180,30,.35)"></div><div style="position:relative;width:168px;height:168px;border-radius:50%;background:conic-gradient(#f5c927 0 ${pct}%,#dfe4f2 0);box-shadow:0 0 0 4px #28314b,0 0 22px rgba(245,201,39,.5);display:grid;place-items:center">
          <div style="width:124px;height:124px;border-radius:50%;background:var(--paper);box-shadow:inset 0 0 0 4px #28314b;display:grid;place-items:center;text-align:center"><div><div class="num" style="font-size:${c.dial.length > 4 ? 38 : 62}px;line-height:.9;color:#28314b" data-testid="dom-card-chance">${esc(c.dial)}</div><div style="font-size:15px;color:#5d6a90">chance</div></div></div>
        </div>
        <span class="pill ${c.exact ? 'g' : 'k'}" style="font-size:14px">${c.roll ? (c.exact ? 'SCOUTED' : 'UNSCOUTED') : 'NO ROLL'}</span>
      </div>
      <div class="col" style="gap:5px;font-size:16px">
        ${odds}
        ${heatRow}
        ${rd}
      </div>
      <div class="col" style="gap:8px;font-size:15px">${hurt}${see}${fight}</div>
    </div>
  </div>
  <div class="a" style="left:126px;top:402px;width:708px;z-index:11;color:#28314b">
    ${bar}
    <div class="row sp" style="font-size:14px;margin-top:6px"><span><b style="color:#1f8a49">Win:</b> ${esc(c.win)}</span><span><b style="color:#c0392b">Lose:</b> ${esc(c.lose)}</span></div>
  </div>
  ${blocked}
  <div class="a row" style="left:96px;top:486px;width:768px;justify-content:flex-end;gap:14px;z-index:12">
    ${c.brought.length ? `<span class="xs" style="color:#dfe5ff">Bringing ${esc(c.brought.join(', '))}</span>` : ''}
    <span class="bt" style="font-size:16px;padding:9px 14px"${act('bring')} data-testid="dom-bring"><span class="kc">B</span>Bring crew</span>
    <span class="bt" style="font-size:18px;padding:9px 18px"${act('back')} data-testid="dom-card-back"><span class="kc" style="background:linear-gradient(180deg,#5a6488,#3a4466);color:#fff;box-shadow:0 0 0 2px var(--ink)">Esc</span>Back</span>
    <div class="cta${c.blocked ? '' : ' shine'}" style="position:relative;font-size:20px;padding:9px 22px;${c.blocked ? 'opacity:.5;filter:saturate(.3)' : ''}"${act('doit')} data-testid="dom-doit">Do it ▶ <span class="kc">Enter</span></div>
  </div>
  <div class="glint" style="left:262px;top:178px;--g:24px;--gc:#ffd23f"></div>`, 'background:#7cc4f0', 'vign grain');
}
