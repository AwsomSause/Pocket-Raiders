// DOMINION slice D16: the Partnership page (key J from the HQ, the map, the Ledger and the Empire page). No mockup draws
// it, so it is built from the round-4 (v4) parts the Rival File uses: glass panels with the gold bracket, a crest pill
// per partner in its own colour, the leader's portrait, the cut as a big number with its meter, the choice rows with the
// coloured stripe, the Q wheel chip on the key strip. Plain data in from core/dominion/partnersScreens.ts; the scene's
// PartnersController keeps the cursor.

import './dominion.css';
import type { PartnerCard, PartnersModel } from '../../../../core/dominion/partnersScreens';
import { act, esc, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { warehouseUrl } from './paint';
import { stage, tabs, topBar, WHEEL_KEY } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const PILL: Record<PartnerCard['state'], string> = { locked: 'k', offered: 'y', active: 'g', gone: 'k', closed: 'r' };

function crest(c: PartnerCard, size: number): string {
  return `<i style="display:inline-grid;place-items:center;font-style:normal;width:${size}px;height:${size}px;flex:none;border-radius:50%;font:800 ${Math.round(size * 0.55)}px/1 var(--logo);color:#fff;background:radial-gradient(circle at 40% 35%,${c.glow},${c.colour} 60%,${c.shade});box-shadow:0 0 0 2px var(--ink),0 0 10px ${c.glowSoft}">${esc(c.crest)}</i>`;
}

function card(c: PartnerCard, x: number, w: number): string {
  const terms = ([['Gives', c.gives], ['Takes', c.takes], ['Raises', c.raises]] as const)
    .map(([k, v]) => `<div class="xs" style="line-height:1.18;margin-bottom:2px;font-size:12px"><span class="dm">${k}</span> ${esc(v)}</div>`).join('');
  const live = c.cut !== null
    ? `<div class="row sp" style="margin-top:4px"><span>Cut <span class="xs mu">${esc(c.since ?? '')}</span></span><b style="color:#ffd23f;font-size:18px" data-testid="dom-partner-cut-${c.id}">${c.cut}%</b></div>
    <div class="mt y" style="--v:${Math.min(100, c.cut * 4)}"></div>
    <div class="row sp xs" style="margin-top:4px"><span class="mu">This week</span><span data-testid="dom-partner-week-${c.id}">${esc(c.week ?? '')}</span></div>
    <div class="row sp xs"><span class="mu">Pokémon taken</span><span>${esc(c.mons ?? '')}</span></div>
    <div class="row sp xs"><span class="mu">Renegotiates</span><span>${esc(c.next ?? '')}</span></div>
    ${c.purge ? `<div class="al r" style="padding:4px 8px;margin-top:6px"><span><span class="t">PURGE</span>Next: ${esc(c.purge)}</span></div>` : ''}`
    : `<div class="xs mu" style="margin-top:8px;line-height:1.3">${c.state === 'locked' ? 'They only deal with a Syndicate.' : c.state === 'offered' ? 'They are waiting on your answer.' : c.state === 'closed' ? 'You talked to Looker. No deals this run.' : 'Done with you in this region.'}</div>`;
  return `<div class="pnl glass" style="left:${x}px;top:86px;width:${w}px;height:384px;overflow:hidden;box-shadow:inset 0 0 0 1px ${c.colour}88" data-testid="dom-partner-${c.id}"><span class="brk"></span>
    <div class="hd" style="color:${c.glow};white-space:nowrap">${crest(c, 24)}&nbsp;${esc(c.name.toUpperCase())}</div>
    <div class="row" style="gap:10px;align-items:flex-end;margin-bottom:5px">
      <div style="width:62px;height:70px;flex:none;border-radius:8px;overflow:hidden;background:radial-gradient(circle at 50% 40%,${c.colour},#0c0a14);box-shadow:0 0 0 3px ${c.colour},0 0 0 5px var(--ink);display:grid;place-items:end center">${tall(c.leaderLook, 68)}</div>
      <div class="col" style="gap:4px;min-width:0"><span class="pill ${PILL[c.state]}" style="font-size:11px" data-testid="dom-partner-state-${c.id}">${esc(c.tag)}</span><span class="pill" style="font-size:12px;background:${c.colour}">${esc(c.leader.toUpperCase())}</span></div>
      <div style="margin-left:auto;height:52px;overflow:hidden;opacity:.85">${tall(c.look, 52)}</div>
    </div>
    ${terms}
    ${live}
  </div>`;
}

export function partnersView(m: PartnersModel): string {
  const rows = m.rows.map((r, i) => {
    const stripe = r.team === 'cipher' ? '#8a4fd0' : r.team === 'snagem' ? '#9fb83a' : '#56679d';
    return `<div class="ch${r.on ? ' on' : ''}" style="padding:3px 10px 3px 20px;font-size:13px;--stripe:${stripe};${r.off ? 'opacity:.55' : ''}"${act('partnerRow', i)} data-over="partnerOver" data-testid="dom-partner-row-${esc(r.id)}">${r.on ? '▶ ' : ''}${esc(r.label)}${r.on ? `<div class="sub xs">${esc(r.sub)}</div>` : ''}</div>`;
  }).join('');
  const title = m.picking ? 'SHADOW MACHINE' : 'THREE WAYS OUT';
  return stage(`<img class="cv" src="${warehouseUrl(false)}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.42) saturate(.6)">
  <div class="layer" style="background:radial-gradient(ellipse at 18% 45%,rgba(120,140,40,.26),transparent 55%),radial-gradient(ellipse at 52% 45%,rgba(110,50,170,.28),transparent 55%),linear-gradient(180deg,rgba(14,10,24,.3),rgba(8,6,16,.62))"></div>
  ${topBar(m.top)}
  ${m.cards.map((c, i) => card(c, i === 0 ? 10 : 320, i === 0 ? 300 : 320)).join('')}
  <div class="pnl glass" style="left:650px;top:86px;width:300px;height:384px;overflow:hidden" data-testid="dom-partner-ways">
    <div class="hd y"><img class="ic" src="${img(m.picking ? 'g-dark-gem' : 'g-letter')}" alt="">${title}<span class="r">${m.rows.length}</span></div>
    <div class="col" style="gap:4px;max-height:226px;overflow:hidden">${rows || `<div class="xs mu">${m.picking ? 'Nothing to put in the machine.' : 'No partner yet. Reach Syndicate, and they come to you.'}</div>`}</div>
    ${m.both ? `<div class="al r xs" style="padding:4px 8px;margin-top:6px;line-height:1.2" data-testid="dom-partner-both"><span><span class="t">BOTH</span>${esc(m.both)}</span></div>` : ''}
    ${m.feud ? `<div class="xs" style="margin-top:4px;line-height:1.2;color:#ffb3a8" data-testid="dom-partner-feud">${esc(m.feud)}</div>` : ''}
    <div class="row sp xs" style="margin-top:6px"><span class="row" style="gap:5px"><img class="ic" src="${img('g-ball')}" alt="" style="width:16px;height:16px">Snag Balls</span><b data-testid="dom-partner-balls">${m.balls}</b></div>
  </div>
  <div class="a row" style="left:12px;top:478px;z-index:8;gap:6px;font:600 13px var(--ui);color:#dfe5ff">${WHEEL_KEY}<span class="kc">▲▼</span>choose <span class="kc">Enter</span>do it <span class="kc">${m.picking ? 'Esc' : 'J'}</span><span${act('back')} style="cursor:pointer" data-testid="dom-partner-close">${m.picking ? 'back' : 'close'}</span></div>
  ${m.notice ? `<div class="a" style="left:330px;width:300px;top:86px;z-index:20;background:rgba(10,14,30,.92);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3"${act('dismiss')} data-testid="dom-notice">${esc(m.notice)}</div>` : ''}
  ${tabs(0, [0, 1, 2, 3, 5])}`);
}
