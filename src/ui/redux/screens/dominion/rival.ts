// DOMINION slice D9: the Rival File (key R from the HQ or the Morning, or a click on the Tension badge or the threat
// row). Built from the round-4 mockups' parts: glass panels, the red Tension meter (mockup 7's "Tension · Rocket"),
// the Boss's portrait pill ("GIOVANNI · ROCKET"), the threat rows (mockup 9) and the choice rows. Plain data in from
// core/dominion/rivalScreens.ts; the scene's RivalController keeps the cursor.

import './dominion.css';
import type { RivalFileModel } from '../../../../core/dominion/rivalScreens';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { warehouseUrl } from './paint';
import { stage, tabs, topBar } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const STATE: Record<string, [string, string]> = { theirs: ['r', 'THEIRS'], yours: ['g', 'YOURS'], gone: ['k', 'GONE'] };

export function rivalFileView(m: RivalFileModel): string {
  const admins = m.admins.map((a) => `<span class="pill ${a.gone ? 'k' : 'r'}" style="font-size:12px;${a.gone ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(a.name)}</span>`).join('');
  const threat = (cls: string, tag: string, text: string, id: string): string =>
    `<div class="al ${cls}" style="padding:5px 9px" data-testid="${id}"><img class="px" src="${img(m.look.replace(/\.png$/, ''))}" alt="" style="width:26px;height:30px;object-fit:cover;object-position:top"><span><span class="t">${esc(tag)}</span>${esc(text)}</span></div>`;
  const sites = m.sites.map((s) => {
    const [c, w] = STATE[s.state]!;
    return `<div class="row sp xs" style="gap:6px"><span>${esc(s.name)} <span class="mu">${esc(s.where)}</span></span><span class="pill ${c}" style="font-size:11px;padding:0 7px">${w}</span></div>`;
  }).join('');
  const rows = m.rows.map((r, i) => `<div class="ch${r.on ? ' on' : ''}" style="padding:4px 10px 4px 20px;font-size:15px;--stripe:${r.on ? '#c62a2a' : '#56679d'}"${act('rivalRow', i)} data-over="rivalOver" data-testid="dom-rival-row-${esc(r.id)}">${r.on ? '▶ ' : ''}${esc(r.label)}${r.on ? `<div class="sub xs">${esc(r.sub)}</div>` : ''}</div>`).join('');
  const log = m.log.map((l) => `<div class="xs" style="line-height:1.3"><span class="dm">Day ${l.day}</span> ${esc(l.text)}</div>`).join('') || '<div class="xs mu">Nothing yet.</div>';
  return stage(`<img class="cv" src="${warehouseUrl(false)}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.45) saturate(.7)">
  <div class="layer" style="background:radial-gradient(ellipse at 20% 40%,rgba(198,42,42,.28),transparent 60%),linear-gradient(180deg,rgba(40,6,10,.35),rgba(10,6,20,.6))"></div>
  ${topBar(m.top)}
  <div class="pnl glass" style="left:10px;top:86px;width:300px;height:384px" data-testid="dom-rival-boss"><span class="brk"></span>
    <div class="hd" style="color:#ff9a8f"><img class="ic" src="${img('g-meteorite')}" alt="">${esc(m.name.toUpperCase())}</div>
    <div class="row" style="gap:10px;align-items:flex-start">
      <div style="width:96px;height:112px;flex:none;border-radius:8px;overflow:hidden;background:radial-gradient(circle at 50% 40%,#5a1a1a,#1a0a10);box-shadow:0 0 0 3px #a8322a,0 0 0 5px var(--ink);position:relative">
        <img class="px" src="${img(m.look.replace(/\.png$/, ''))}" alt="${esc(m.boss)}" style="position:absolute;left:-12px;top:0;width:120px;height:140px;object-fit:cover;object-position:top"></div>
      <div class="col" style="gap:5px;min-width:0"><span class="pill r" style="font-size:13px">${esc(m.boss.toUpperCase())} · ${esc(m.tag)}</span>
        <span class="xs mu">Admins</span><div class="row" style="gap:4px;flex-wrap:wrap">${admins}</div></div>
    </div>
    <div class="row sp" style="margin-top:12px"><span class="row" style="gap:5px">Tension · ${esc(m.stage)}</span><b style="color:#ff6a5c;font-size:20px" data-testid="dom-rival-tension">${m.tension}</b></div>
    <div class="mt r t" style="--v:${m.tension}"></div>
    <div class="row sp" style="margin-top:6px"><span class="pill ${m.tension >= 50 ? 'r' : 'y'}" data-testid="dom-rival-stage">${esc(m.word)}</span><span class="xs mu">${esc(m.next ?? 'the top')}</span></div>
    <div class="sm" style="margin-top:8px;line-height:1.3">${esc(m.does)}</div>
  </div>
  <div class="pnl glass" style="left:320px;top:86px;width:320px;height:384px" data-testid="dom-rival-week">
    <div class="hd y"><img class="ic" src="${img('g-journal')}" alt="">THIS WEEK</div>
    <div class="xs mu">Their plan</div>
    <div class="sm" style="margin-bottom:8px;${m.seen ? 'color:#ffe28a;font-weight:700' : ''}" data-testid="dom-rival-plan">${esc(m.plan)}</div>
    <div class="col" style="gap:6px;margin-bottom:8px">${m.raid ? threat('r', `TENSION ${m.tension}`, m.raid, 'dom-rival-raid') : ''}${m.truce ? threat('g', 'TRUCE', m.truce, 'dom-rival-truce') : ''}</div>
    <div class="xs" style="margin-bottom:8px;line-height:1.3">${esc(m.spies)}</div>
    <div class="xs mu">Their sites</div>
    <div class="col" style="gap:3px">${sites}</div>
  </div>
  <div class="pnl glass" style="left:650px;top:86px;width:300px;height:384px" data-testid="dom-rival-answer">
    <div class="hd" style="color:#ff9a8f"><img class="ic" src="${img('g-letter')}" alt="">ANSWER<span class="r">${m.rows.length}</span></div>
    <div class="col" style="gap:5px;max-height:200px;overflow:hidden">${rows || '<div class="xs mu">Nothing to answer.</div>'}</div>
    <div class="xs mu" style="margin-top:8px">What they did</div>
    <div class="col" style="gap:3px;max-height:110px;overflow:hidden" data-testid="dom-rival-log">${log}</div>
  </div>
  <div class="a row" style="left:12px;top:478px;z-index:8;gap:6px;font:600 13px var(--ui);color:#dfe5ff"><span class="kc">▲▼</span>choose <span class="kc">Enter</span>answer <span class="kc">Esc</span><span${act('back')} style="cursor:pointer">back</span></div>
  ${m.notice ? `<div class="a" style="left:330px;width:300px;top:86px;z-index:20;background:rgba(10,14,30,.92);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3"${act('dismiss')} data-testid="dom-notice">${esc(m.notice)}</div>` : ''}
  ${tabs(0, [0, 1, 2, 3, 5])}`);
}
