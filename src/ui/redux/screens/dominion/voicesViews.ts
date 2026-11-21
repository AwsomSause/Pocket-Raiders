// DOMINION slice D25: the Evening voices scene, ported from Claude API mockup a10 "Chatter, news and the Hero"
// (plans/claude-api/mockups/index.html #k10) in the round-4 look: the crew talking under the warm bulb, the taped Ledger
// paper with a grainy photo of the Hero, the Hero's call on a shaking X-transceiver, and a traitor's parting line.
// Written lines always show; a ✦ line under one is Rotom's (stored with the run). Plain data in from
// core/dominion/voices.ts; DominionScene keeps the input (V or Esc closes).

import './dominion.css';
import './claude.css';
import type { ChatLine, VoicesModel } from '../../../../core/dominion/voices';
import { act, esc, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { stage, warehouseBack, WHEEL_KEY } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const AI = 'color:#ffb38a;text-shadow:0 0 8px rgba(255,138,74,.5)';

// Where each speaker stands and where their bubble goes (mockup a10).
const SPOTS = [
  { x: 300, y: 300, w: 94, h: 146, bub: { l: 206, t: 196, w: 210, tx: 120 } },
  { x: 420, y: 296, w: 88, h: 150, bub: { l: 416, t: 120, w: 210, tx: 40 } },
  { x: 520, y: 312, w: 90, h: 136, bub: { l: 526, t: 252, w: 160, tx: 40 } },
] as const;

function person(look: string, name: string, s: (typeof SPOTS)[number]): string {
  return look.endsWith('.png')
    ? `<img class="spr bob" src="${rxUrl(look)}" alt="${esc(name)}" style="left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;z-index:4;object-fit:contain;object-position:bottom">`
    : `<div class="a bob" style="left:${s.x}px;top:${s.y}px;z-index:4">${tall(look, s.h)}</div>`;
}

function bubble(l: ChatLine, i: number): string {
  const s = SPOTS[i]!;
  const rot = l.rotom ? `<div style="${AI};margin-top:5px;font-size:13px" data-testid="dom-chat-rotom-${i}">✦ ${esc(l.rotom)}</div>` : '';
  return `${person(l.look, l.who, s)}
  <div class="bub" style="left:${s.bub.l}px;top:${s.bub.t - (l.rotom ? 26 : 0)}px;width:${s.bub.w}px;--tx:${s.bub.tx}px;font-size:14px" data-testid="dom-chat-${i}"><b>${esc(l.who)}:</b> “${esc(l.text)}”${rot}</div>
  ${l.rotom ? `<span class="spark a" style="left:${s.bub.l + s.bub.w - 14}px;top:${s.bub.t - 32}px;z-index:19;--z:16px;--sc:#ff8a4a"></span>` : ''}`;
}

function paperView(m: VoicesModel): string {
  const p = m.paper;
  const shell = (inner: string) => `<span class="tape" style="left:780px;top:66px;z-index:9;transform:rotate(-4deg)"></span>
  <div class="a" style="left:690px;top:76px;width:254px;height:340px;z-index:8;background:#efe9da;color:#2a2418;border-radius:3px;box-shadow:0 0 0 2px #2a2014,4px 8px 0 rgba(0,0,0,.35),0 16px 30px rgba(0,0,0,.5);padding:10px 12px;transform:rotate(2deg);overflow:hidden" data-testid="dom-paper">${inner}</div>`;
  if (!p) return shell(`<div style="font:700 22px var(--regal);text-align:center;border-bottom:3px double #2a2418;padding-bottom:3px">The Ledger</div><div style="font-size:13px;line-height:1.35;margin-top:10px" data-testid="dom-paper-empty">${esc(m.empty)}</div>`);
  const [lead, second] = p.items;
  const story = (it: NonNullable<typeof lead>, big: boolean) => `<div style="font:700 ${big ? 17 : 14}px/1.15 var(--ui);margin:${big ? '7px 0 4px' : '8px 0 3px'};${big ? '' : 'border-top:1px solid #2a2418;padding-top:5px'}" data-testid="dom-paper-head-${big ? 0 : 1}">${esc(it.head)}</div>
    <div style="font-size:${big ? 12.5 : 12}px;line-height:1.3">${it.body.map(esc).join(' ')}</div>`;
  const photo = p.photo ? `<div class="row" style="gap:8px;margin-top:8px;border-top:1px solid #2a2418;padding-top:5px" data-testid="dom-paper-photo"><div style="width:44px;height:44px;flex:none;background:#c9c2b0;position:relative;overflow:hidden;box-shadow:0 0 0 1px #2a2418"><img class="spr" src="${rxUrl(p.photo.look)}" alt="" style="left:2px;top:0;width:40px;height:60px;object-fit:cover;object-position:top;filter:grayscale(1) contrast(1.2)"></div><div style="font:700 13px/1.15 var(--ui)">${esc(p.photo.text)}</div></div>` : '';
  const rot = p.rotom ? `<div style="margin-top:7px;border-top:1px dashed #8a5a3a;padding-top:4px;font-size:12px;line-height:1.3;color:#7a3a14" data-testid="dom-paper-rotom">✦ ${esc(p.rotom)}</div>` : '';
  return shell(`<div style="font:700 20px var(--regal);text-align:center;letter-spacing:.02em;white-space:nowrap;border-bottom:3px double #2a2418;padding-bottom:3px" data-testid="dom-paper-name">${esc(p.masthead)}</div>
    <div class="row sp xs" style="border-bottom:1px solid #2a2418;padding:2px 0;color:#5a4a30"><span data-testid="dom-paper-week">Week ${p.w}</span><span>${esc(p.price)}</span></div>
    ${lead ? story(lead, true) : ''}${second ? story(second, false) : ''}${photo}${rot}`);
}

export function voicesView(m: VoicesModel): string {
  const call = m.call ? `<div class="pnl" style="left:16px;top:76px;width:300px;padding:10px 12px;border-color:#ff8a7a;box-shadow:0 0 0 3px var(--ink),0 0 24px rgba(255,90,79,.5);z-index:12" data-testid="dom-hero-call">
    <div class="row" style="gap:10px;align-items:flex-start"><img class="ic xl ring2" src="${img('g-xtransceiver')}" alt=""><div class="col" style="gap:3px;min-width:0"><b class="caps" style="font-size:13px;letter-spacing:.1em;color:#ff8a7a">${esc(m.call.head)}</b><span style="font-size:14px;line-height:1.3" data-testid="dom-hero-call-text">“${esc(m.call.text)}”${m.call.hint ? ` <i class="mu">${esc(m.call.hint)}</i>` : ''}</span>${m.call.rotom ? `<span style="${AI};font-size:13px" data-testid="dom-hero-call-rotom">✦ ${esc(m.call.rotom)}</span>` : ''}</div></div>
  </div>` : '';
  const traitor = m.traitor ? `<div class="pnl" style="left:16px;top:auto;bottom:52px;width:300px;padding:9px 12px;border-color:#b28cff;box-shadow:0 0 0 3px var(--ink),0 0 18px rgba(178,140,255,.4);z-index:12" data-testid="dom-traitor">
    <b class="caps" style="font-size:12px;letter-spacing:.1em;color:#c9b0ff">${esc(m.traitor.head)}</b>
    <div style="font-size:14px;line-height:1.3;margin-top:3px" data-testid="dom-traitor-text">“${esc(m.traitor.text)}”</div>
    ${m.traitor.rotom ? `<div style="${AI};font-size:13px;margin-top:3px" data-testid="dom-traitor-rotom">✦ ${esc(m.traitor.rotom)}</div>` : ''}
    <div class="xs mu" style="margin-top:4px">${esc(m.traitor.boss)}</div>
  </div>` : '';
  const crew = m.chatter.length ? m.chatter.map(bubble).join('') : '<div class="bub" style="left:330px;top:250px;width:300px;font-size:14px" data-testid="dom-chat-none">The warehouse is empty tonight.</div>';
  return stage(`<div style="position:absolute;inset:0;filter:brightness(.8)">${warehouseBack(false)}</div>
  <div class="cone flick" style="left:330px;top:70px;width:300px;height:400px;z-index:2;--cc:rgba(255,214,140,.30)"></div>
  <div class="ttl" style="--t1:#5b34b0;--t2:#a678ff" data-testid="dom-voices">${esc(m.title)} <span class="sub">${esc(m.sub)}</span></div>
  <div class="keys">${WHEEL_KEY}<span class="key"${act('voicesClose')} style="cursor:pointer">V</span><span>Back</span><span class="key"${act('voicesClose')} style="cursor:pointer">Esc</span></div>
  <div class="shd" style="left:300px;top:446px;width:320px;height:24px"></div>
  ${crew}
  <div class="pool flick" style="left:300px;top:380px;width:360px;height:110px;z-index:2;--pc:rgba(255,200,120,.35)"></div>
  <div class="embers" style="left:380px;top:120px;width:200px;height:300px;z-index:3;--ec:#ffe2a8;opacity:.6"></div>
  ${paperView(m)}
  ${call}
  ${traitor}
  <div class="aichip" style="left:16px;top:500px" data-testid="dom-voices-chip"><i></i>${esc(m.chip)}${m.rotomLines ? ` <span class="dm2">· ${m.rotomLines} ✦</span>` : ''}</div>`);
}
