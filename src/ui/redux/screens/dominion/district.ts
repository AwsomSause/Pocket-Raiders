// DOMINION slice D29: the District file page, ported from round-4 mockup m4 (plans/evil-mode-rework/mockups-v4,
// src/i1.py "m4 District"). Plain data in from core/dominion/districtScreen.ts; the scene keeps D2's map cursor.

import type { DistrictModel } from '../../../../core/dominion/districtScreen';
import { act, esc, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { skylineDayUrl } from './paint';
import { stage, WHEEL_KEY } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

/** A target's or the banner's picture: a `dominion/*.png` file or a trainer atlas. */
function pic(look: string, w: number, h: number): string {
  if (look.endsWith('.png')) return `<img class="px" src="${rxUrl(look)}" alt="" style="width:${w}px;height:${h}px;object-fit:contain;flex:none">`;
  return `<span style="display:inline-block;flex:none;width:${w}px;height:${h}px;overflow:hidden">${tall(look, h)}</span>`;
}

const dial = (v: number, c: string, label: string, id: string): string => `<div class="col" style="align-items:center;gap:6px"><div class="dial" style="--v:${Math.max(0, Math.min(100, v))};--c:${c};width:68px;height:68px"><b style="width:50px;height:50px;font-size:24px" data-testid="dom-df-${id}">${v}</b></div><span class="xs caps">${esc(label)}</span></div>`;

export function districtView(m: DistrictModel, notice: string | null): string {
  const targets = m.targets.map((t, i) => `<div class="task${t.on ? ' on' : ''}" style="padding:4px 10px;cursor:pointer"${act('dfTarget', i)} data-testid="dom-df-target-${t.id}"><div class="row" style="gap:10px">${pic(t.look, 40, 42)}
      <div class="col" style="gap:0;min-width:0;line-height:1.15"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.name)}</b><span class="xs y" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.pays)}</span><span class="xs dm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.note)}</span></div></div></div>`).join('');
  const cols = m.columns.map((c) => `<div><div class="grp" style="--c:${c.colour}">${esc(c.name)}</div><div class="col" style="gap:6px">${c.acts.map((a) => `<div class="act${a.on ? ' on' : ''}${a.dim ? ' no' : ''}" style="cursor:pointer;white-space:nowrap"${act('dfAct', a.slot)} data-testid="dom-df-act-${a.id}"><img class="ic s" src="${img(a.icon)}" alt=""><span style="overflow:hidden;text-overflow:ellipsis">${esc(a.label)}${a.night ? ' ☾' : ''}</span><span class="kc">${a.key}</span></div>`).join('')}</div></div>`).join('');
  const pager = m.pages > 1 ? `<span class="row xs" style="margin-left:10px;gap:4px;white-space:nowrap" data-testid="dom-df-pager"><span class="y" style="max-width:150px;overflow:hidden;text-overflow:ellipsis">${esc(m.section)}</span><span class="kc"${act('dfPage', -1)}>[</span>${m.page + 1}/${m.pages}<span class="kc"${act('dfPage', 1)}>]</span></span>` : '';
  const banner = m.banner ? `<div class="bnr" style="left:50%;transform:translateX(-50%);top:66px;font-size:18px;padding:5px 34px;white-space:nowrap;background:linear-gradient(180deg,#ff8a7a,#d8402f);color:#fff;filter:drop-shadow(0 4px 0 #4a0d08) drop-shadow(0 0 16px rgba(255,90,79,.6))" data-testid="dom-df-banner">${m.banner.look ? pic(m.banner.look, 20, 34) : ''}${esc(m.banner.text)}</div>` : '';
  return stage(`<img class="cv" src="${skylineDayUrl()}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:saturate(.9) brightness(.85)">
  <div class="layer" style="background:linear-gradient(180deg,rgba(10,14,40,.1),rgba(10,14,40,.55) 45%,rgba(10,14,40,.9))"></div>
  <div class="ttl" style="--t1:#1f6fd0;--t2:#38b6d8" data-testid="dom-df-title">${esc(m.name)} <span class="sub">· District file</span></div>
  <div class="keys"><span class="crumb">Region Map <i>›</i> <b>${esc(m.name)}</b></span>${WHEEL_KEY}<span class="key"${act('back')}>Esc</span><span>Back</span></div>
  ${banner}
  <div class="stamp" style="left:770px;top:74px;color:${m.stamp.colour};text-shadow:0 0 8px ${m.stamp.colour};font-size:18px" data-testid="dom-df-stamp">${esc(m.stamp.word)}</div>
  <div class="pnl glass" style="left:16px;top:118px;width:300px;height:172px" data-testid="dom-df-dials">
    <div class="row" style="justify-content:space-around;margin-top:4px">${dial(m.control, '#ffd23f', 'Your control', 'control')}${dial(m.heat, '#ff7a3c', 'Heat here', 'heat')}${dial(m.rival, '#ef4a3a', `${m.rivalName} grip`, 'rival')}</div>
    <div class="xs mu" style="margin-top:6px;text-align:center" data-testid="dom-df-goal">${esc(m.goal)}</div>
    <div class="row xs" style="justify-content:center;gap:14px;margin-top:3px"><span style="color:#ff9ab0" title="Regard">♥ ${m.regard}</span><span style="color:#b9a0ff" title="Dread">✊ ${m.dread}</span></div>
  </div>
  <div class="a col" style="left:16px;top:302px;width:300px;gap:6px;z-index:6" data-testid="dom-df-targets">
    <div class="grp" style="--c:#ffd23f">TARGETS<span class="kc" style="margin-left:4px">T</span></div>
    ${targets}
  </div>
  <div class="pnl" style="left:332px;top:118px;width:612px;height:300px" data-testid="dom-df-acts">
    <div class="hd"><img class="ic" src="${img('g-machine-part')}" alt="">What will you do here?${pager}<span class="r" data-testid="dom-df-left">${esc(m.left)}</span></div>
    <div class="a" style="left:14px;right:14px;top:58px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${cols}</div>
    <div class="a xs dm" style="left:14px;right:14px;bottom:12px">${esc(m.hint)}</div>
  </div>
  ${m.cta ? `<div class="cta shine" style="left:332px;top:432px;width:612px;height:56px;font-size:${m.cta.length > 34 ? 18 : 22}px"${act('dfCard')} data-testid="dom-df-cta">${esc(m.cta)} ▶ <span class="kc">Enter</span></div>` : ''}
  ${notice ? `<div class="a" style="left:332px;width:612px;top:370px;z-index:40;background:rgba(10,14,30,.92);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3"${act('dismiss')} data-testid="dom-notice">${esc(notice)}</div>` : ''}
  <div class="haze" aria-hidden="true" style="--hz:#9fd0ff;--hz2:#ffd23f"></div><div class="grade" aria-hidden="true" style="--g1:#9fd0ff;--g2:#ffd23f"></div><div class="edgeglow" aria-hidden="true" style="--eg:#9fd0ff"></div><div class="orn" aria-hidden="true"></div>`, '', 'kl-cold vign grain');
}
