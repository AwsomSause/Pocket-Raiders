// DOMINION slice D29: the Assign a task page, ported from round-4 mockup m3 (plans/evil-mode-rework/mockups-v4,
// src/i1.py "m3 Assign"). Plain data in from core/dominion/assignScreen.ts; the crew controller keeps the cursor.

import type { AssignModel } from '../../../../core/dominion/assignScreen';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { face } from './crew';
import { bandChip, stage, tabs, topBar, WHEEL_KEY } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

export function assignView(m: AssignModel, notice: string | null): string {
  const i = m.member;
  const cards = m.cards.map((c, k) => {
    const odd = c.locked ? '—' : c.odds === 'sure' ? 'sure' : `${esc(c.odds.replace('%', ''))}<small>%</small>`;
    const rb = c.best ? '<span class="rb">BEST FIT</span>' : c.current ? '<span class="rb" style="background:linear-gradient(180deg,#b9f5cf,#43cf78)">ON IT</span>' : '';
    return `<div class="task${c.on ? ' on' : ''}${c.locked ? ' no' : ''}"${act('asTask', k)} data-over="asOver" data-testid="dom-as-task-${c.id}" title="${esc(c.locked ?? '')}">${rb}
      <div class="nm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;gap:6px">${c.icon ? `<img class="ic" src="${img(c.icon)}" alt="">` : ''}${esc(c.label)}</div>
      <div class="od ${c.tone}" data-testid="dom-as-odds-${c.id}">${odd}</div>
      <div class="ln"><span class="y" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.pay)}</span><span class="rd" style="white-space:nowrap">${esc(c.heat)}</span></div>
      <div class="ln"><span class="dm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.locked ?? `${c.uses} · ${c.risk}`)}</span></div></div>`;
  }).join('');
  const others = m.others.slice(0, 4).map((o) => `<div class="row" style="cursor:pointer"${act('asMember', o.i)} data-testid="dom-as-other-${o.id}">${face(o.look, 40, 'width:40px;height:40px;object-fit:cover;object-position:top', m.colours)}<span style="min-width:0"><b>${esc(o.name)}</b><br><span class="xs ${o.tone}" style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:104px">${esc(o.task)}</span></span></div>`).join('')
    || '<div class="xs dm">Nobody else yet.</div>';
  const traitPill = i.trait ? `<span class="pill g" style="margin-left:auto">${esc(i.trait.toUpperCase())}</span>` : `<span class="pill r" style="margin-left:auto">${esc(i.green)}</span>`;
  const forming = i.formed
    ? `<div class="xs dm caps">Personality</div><div class="row sm" style="gap:6px;margin-top:4px"><span class="pill g">${esc(i.formed.name)}</span><span class="dm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(i.formed.text)}</span></div>`
    : `<div class="xs dm caps">Personality forming</div><div class="row sm" style="gap:6px;margin-top:4px"><span class="pill k">${esc(i.temperament)}?</span><span class="dm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(i.record)}</span></div>`;
  const pager = m.pages > 1 ? `<span class="kc">▲▼</span><span data-testid="dom-as-page">${m.page + 1}/${m.pages}</span>` : '';
  const more = `<div class="a row xs" style="left:292px;top:440px;width:470px;gap:6px;color:#dfe5ff;z-index:6;white-space:nowrap" data-testid="dom-as-more">
    <span${act('asAll')} style="cursor:pointer"><span class="kc">M</span> ${m.all ? 'Quick six' : `More… (${m.moreCount} tasks)`}</span>
    ${m.where ? `<span${act('asWhere')} style="cursor:pointer;margin-left:10px" data-testid="dom-as-where"><span class="kc">P</span> <b class="y">${esc(m.where)}</b></span>` : ''}
    <span style="margin-left:auto;gap:6px" class="row">${pager}<span class="row" style="gap:6px;font-size:13px">${WHEEL_KEY}<span class="key">Esc</span><span>Morning</span></span></span></div>`;
  return stage(`${topBar(m.top)}
  <div class="layer" style="top:72px;background:radial-gradient(300px 300px at 150px 300px,rgba(160,90,255,.35),transparent 70%),linear-gradient(180deg,#1a1430,#100c22)"></div>
  <div class="pool" style="left:20px;top:330px;width:260px;height:80px;--pc:rgba(190,140,255,.5)"></div>
  <div class="a bob" style="left:44px;top:190px;width:216px;height:180px;z-index:3;display:flex;align-items:flex-end;justify-content:center" data-testid="dom-as-pic">${face(i.look, 180, 'width:216px;height:180px;object-fit:contain;object-position:bottom', m.colours)}</div>
  <div class="bub" style="left:170px;top:196px;width:132px;--tx:18px;font-size:13px;z-index:5" data-testid="dom-as-line">${esc(i.name.split(' ')[0]![0] + i.name.split(' ')[0]!.slice(1).toLowerCase())}: “${esc(i.line)}”</div>
  <div class="pnl glass" style="left:14px;top:84px;width:262px;height:96px;padding:10px 14px" data-testid="dom-as-member">
    <div class="row" style="gap:8px"><b style="font-size:22px;letter-spacing:.06em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px" data-testid="dom-as-name">${esc(i.name)}</b><span class="pill v">${esc(i.rank)}</span>${traitPill}</div>
    <div class="row xs mu" style="gap:6px;margin-top:4px;white-space:nowrap;overflow:hidden">${bandChip(m.colours, '')}<span style="overflow:hidden;text-overflow:ellipsis">${esc(i.role)}</span></div>
    <div class="row xs" style="gap:8px;margin-top:6px"><span>Loyalty <b class="gn">${i.loyalty}</b></span><span>Skill <b class="cy">${i.skill}</b></span><span>${esc(i.stat.label)} <b class="vi">${i.stat.value}</b></span></div>
  </div>
  <div class="pnl glass" style="left:14px;top:388px;width:262px;height:80px;padding:8px 12px" data-testid="dom-as-forming">${forming}</div>
  <div class="a" style="left:292px;top:96px;width:470px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px 12px;z-index:5" data-testid="dom-as-grid">${cards}</div>
  ${more}
  <div class="pnl dim" style="left:776px;top:84px;width:170px;height:288px;padding:10px" data-testid="dom-as-others">
    <div class="hd" style="font-size:14px">The crew</div>
    <div class="col" style="gap:8px;font-size:14px">${others}<div class="row xs dm"><span${act('asFlip', -1)} style="cursor:pointer">◀</span> <span${act('asFlip', 1)} style="cursor:pointer">▶</span> switch member</div></div>
  </div>
  <div class="cta shine" style="left:776px;top:384px;width:170px;height:78px;flex-direction:column;gap:2px;font-size:19px"${act('asGive')} data-testid="dom-as-give">${esc(m.cta)}<span class="kc">Enter</span></div>
  ${tabs(2, [0, 1, 2, 3, 5])}
  ${notice ? `<div class="a" style="left:292px;width:470px;top:360px;z-index:20;background:rgba(10,14,30,.92);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3"${act('dismiss')} data-testid="dom-notice">${esc(notice)}</div>` : ''}
  <div class="haze" aria-hidden="true" style="--hz:#c9a0ff;--hz2:#ffd23f"></div><div class="grade" aria-hidden="true" style="--g1:#c9a0ff;--g2:#ffd23f"></div><div class="edgeglow" aria-hidden="true" style="--eg:#c9a0ff"></div><div class="orn" aria-hidden="true"></div>`, '', 'kl-violet vign grain');
}
