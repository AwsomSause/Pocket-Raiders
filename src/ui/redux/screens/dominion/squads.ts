// DOMINION slice D8 screen: mockup 13 (Roster · Squads), ported from plans/evil-mode-rework/mockups-v4/index.html
// section s13: squad cards under their Marks (Family cards in gold brackets), the New Squad builder with the armband
// preview, and the round-3/4 overlays. Plain data in from core/dominion/squadScreens.ts. The order and Squad Trait
// pickers use the same panel skin over the builder.

import type { BuilderModel, PickerModel, SquadCardModel, SquadsModel } from '../../../../core/dominion/squadScreens';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { face } from './crew';
import { stage } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const POS = [[16, 70], [290, 70], [16, 300], [290, 300]] as const;

/** Mockup 13's overlays (passes 4, 7, 9, 10, 17, 18, 20, 25 and the v4 sigil + vignette); no clicks, calm with motion off. */
const FX = `<div class="haze" style="--hz:#c9a0ff;--hz2:#ffd23f" aria-hidden="true"></div>
  <div class="bokeh" aria-hidden="true" style="background:radial-gradient(circle 34px at 152px 468px,color-mix(in srgb,#ffd23f 34%,transparent),color-mix(in srgb,#ffd23f 18%,transparent) 70%,transparent 100%),radial-gradient(circle 26px at 801px 398px,color-mix(in srgb,#c9a0ff 34%,transparent),color-mix(in srgb,#c9a0ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 32px at 854px 143px,color-mix(in srgb,#ffd23f 34%,transparent),color-mix(in srgb,#ffd23f 18%,transparent) 70%,transparent 100%),radial-gradient(circle 25px at 744px 149px,color-mix(in srgb,#c9a0ff 34%,transparent),color-mix(in srgb,#c9a0ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 24px at 107px 169px,color-mix(in srgb,#ffd23f 34%,transparent),color-mix(in srgb,#ffd23f 18%,transparent) 70%,transparent 100%),radial-gradient(circle 18px at 59px 110px,color-mix(in srgb,#c9a0ff 34%,transparent),color-mix(in srgb,#c9a0ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 25px at 188px 103px,color-mix(in srgb,#ffd23f 34%,transparent),color-mix(in srgb,#ffd23f 18%,transparent) 70%,transparent 100%),radial-gradient(circle 51px at 918px 143px,color-mix(in srgb,#c9a0ff 34%,transparent),color-mix(in srgb,#c9a0ff 18%,transparent) 70%,transparent 100%)"></div>
  <div class="pts" aria-hidden="true"><i class="pt star f" style="left:473px;top:267px;--dl:-3.3s;--t:2.5s;--c:#fff"></i><i class="pt star f" style="left:472px;top:229px;--dl:-4.8s;--t:5.5s;--c:#ffd23f"></i><i class="pt star f" style="left:428px;top:236px;--dl:-1.8s;--t:4.5s;--c:#fff"></i><i class="pt star f" style="left:442px;top:224px;--dl:-1.5s;--t:4.7s;--c:#fff"></i><i class="pt star f" style="left:466px;top:241px;--dl:-4.9s;--t:3.9s;--c:#c9a0ff"></i><i class="pt star f" style="left:423px;top:270px;--dl:-4.4s;--t:3.4s;--c:#c9a0ff"></i></div>
  <div class="grade" aria-hidden="true" style="--g1:#c9a0ff;--g2:#ffd23f"></div>
  <div class="focus" aria-hidden="true" style="left:648px;top:474px;--r:90px;--fc:200,150,255"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#c9a0ff"></div>
  <div class="orn" aria-hidden="true"></div>
  <div class="rays turn finale" aria-hidden="true" style="left:549px;top:375px;width:198px;height:198px;--rc:rgba(200,150,255,.30)"></div><i class="glint fg" style="left:697px;top:420px;--g:20px"></i><i class="glint fg" style="left:586px;top:505px;--g:14px;animation-delay:-1.4s"></i>
  <div class="sig4" aria-hidden="true"></div><div class="vl4" aria-hidden="true"></div>`;

function sqCard(c: SquadCardModel, i: number): string {
  const [left, top] = POS[i]!;
  const brk = c.family ? '<span class="brk" style="inset:-11px;z-index:20"></span>' : '';
  const leader = c.leader
    ? `${face(c.leader.look, 50, 'width:34px;height:50px;flex:none')}<div class="col" style="gap:2px"><span class="sm">Leader <b>${esc(c.leader.name)}</b></span><span class="pill ${c.kind === 'Unit' ? 'v' : 'k'}" style="font-size:11.5px;align-self:flex-start">${esc(c.leader.rank)}</span></div>`
    : '<div class="col" style="gap:2px"><span class="sm rd">No leader</span><span class="xs mu">Pick one: E</span></div>';
  const faces = c.faces.map((f) => face(f, 34, 'width:22px;height:34px;margin-left:-6px;filter:drop-shadow(1px 0 0 var(--ink))')).join('');
  const sel = c.sel ? '<div class="cursor" style="left:-30px;top:84px"></div>' : '';
  return `<div class="sq${c.family ? ' fam' : ''}${c.sel ? ' on' : ''}" style="--c:${c.color};left:${left}px;top:${top}px;${c.family || c.sel ? 'overflow:visible;' : ''}${c.sel ? 'outline:3px solid #ff5a4f;outline-offset:4px;' : ''}"${act('sqCard', i)} data-over="sqCardOver" data-testid="dom-squad-${c.id}">${brk}${sel}
    <div class="sqh"><span class="mk">${esc(c.mark)}</span><b>${esc(c.codeName)}</b><span class="n">${esc(c.n)}</span></div>
    <div class="row" style="gap:8px">${leader}<div class="mem">${faces}</div></div>
    <div class="row sp sm"><span>Incentive</span><b>${esc(c.incentive)}</b></div>
    <div class="row sp sm"><span>Cohesion ${c.cohesion}</span><span class="pill ${c.pill}">${esc(c.band)}</span></div><div class="mt g t" style="--v:${c.cohesion}"></div>
    <div class="xs ${c.traitTone}">${esc(c.trait)}${c.group ? ` <span class="mu">· ${esc(c.group)}</span>` : ''}</div>
    <div class="today"><img class="ic s" src="${img(c.today.icon)}" alt="">${esc(c.today.text)}${c.today.live ? '<i class="live"></i>' : ''}</div>
  </div>`;
}

const rowMark = (m: BuilderModel, r: string): string => (m.active && m.row === r ? 'box-shadow:inset 3px 0 0 #ffd23f;background:linear-gradient(90deg,rgba(255,210,63,.16),transparent 70%);' : '');
const label = (t: string): string => `<span style="width:84px;flex:none">${esc(t)}</span>`;

function builder(m: BuilderModel): string {
  const lead = m.leader
    ? `${face(m.leader.look, 30, 'width:18px;height:30px;flex:none')}<b>${esc(m.leader.name)}</b><span class="pill k" style="font-size:11.5px">${esc(m.leader.rank)}</span><span class="xs mu">${esc(m.leader.max)}</span>`
    : `<span class="xs rd">${m.kind === 'group' ? 'No Admin or higher yet' : 'No Corporal or higher free'}</span>`;
  const incs = m.incentives.map((x) => `<span class="bt${x.on ? ' y' : ''}" style="font-size:12.5px;padding:3px 8px"${act('sqInc', x.id)}>${esc(x.name)}</span>`).join('') + (m.more ? `<span class="bt ghost" style="font-size:12.5px;padding:3px 8px"${act('sqIncMore')}>+${m.more}</span>` : '');
  const extra = m.kind === 'squad'
    ? `<div class="row" style="gap:8px;font-size:15px;margin-top:7px;${rowMark(m, 'target')}"${act('sqRow', 'target')} data-testid="dom-sq-extra">${label(m.extra.label)}${m.extra.look ? `<img class="px" src="${rxUrl(m.extra.look)}" alt="" style="width:22px;height:30px;object-fit:cover;object-position:top">` : ''}<b>${esc(m.extra.name)}</b><span class="xs mu">${esc(m.extra.text)}</span></div>
    <div class="row" style="gap:8px;font-size:15px;margin-top:7px;${rowMark(m, 'mark')}"${act('sqRow', 'mark')}>${label('Mark')}
      <div class="row" style="gap:4px">${m.marks.map((k) => `<span class="mkp${k.on ? ' on pulse' : ''}">${esc(k.ch)}</span>`).join('')}</div><span class="xs mu">${esc(m.focus)}</span></div>`
    : '';
  const alert = m.alert ? `<div class="al ${m.alert.tone}" style="margin-top:9px;font-size:13.5px;padding:5px 8px" data-testid="dom-sq-alert"><span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(m.alert.text)}</span></div>` : '';
  const picked = m.picked.map((p) => {
    const glow = p.clash && p.on ? 'filter:drop-shadow(0 0 4px #ff5a4f);' : p.cand ? 'filter:drop-shadow(0 0 4px #ffd23f);' : '';
    return face(p.look, 34, `width:24px;height:34px;flex:none;${p.on ? '' : 'opacity:.45;'}${glow}${p.cand ? 'outline:2px dashed #ffd23f;outline-offset:1px;' : ''}`);
  }).join('');
  const note = m.row === 'members' && m.active && m.cand ? `<span class="xs y" style="margin-left:auto">${esc(m.cand)} · Enter</span>` : m.pickNote ? `<span class="xs" style="margin-left:auto;color:${m.pickNote === 'All fit' ? '#8ef0b0' : '#ff9a8f'}">${esc(m.pickNote)}</span>` : '';
  return `<div class="pnl" style="left:572px;top:70px;width:372px;height:458px;padding:12px 14px" data-testid="dom-sq-builder">
    <div class="hd y"><img class="ic" src="${img('g-choice-band')}" alt="">${esc(m.title)}<span class="r" data-testid="dom-sq-picked">${esc(m.right)}</span></div>
    <div class="row" style="gap:8px;font-size:15px;${rowMark(m, 'name')}"${act('sqRow', 'name')}>${label('Code Name')}<span class="field" style="position:relative" data-testid="dom-sq-name"${act('sqName')}>${esc(m.codeName)}<b class="blink" style="color:var(--gold)">▌</b><span class="xs dm" style="position:absolute;right:8px;top:4px">${esc(m.count)}</span></span></div>
    ${m.ideas.length ? `<div class="xs mu" style="margin:3px 0 0 92px">Ideas: ${m.ideas.map(esc).join(' · ')}</div>` : '<div class="xs mu" style="margin:3px 0 0 92px">&nbsp;</div>'}
    <div class="row" style="gap:8px;font-size:15px;margin-top:7px;${rowMark(m, 'leader')}"${act('sqRow', 'leader')} data-testid="dom-sq-leader">${label('Leader')}${lead}</div>
    <div class="row" style="gap:8px;font-size:15px;margin-top:7px;align-items:flex-start;${rowMark(m, 'incentive')}"${act('sqRow', 'incentive')}><span style="width:84px;flex:none;padding-top:3px">Incentive</span>
      <div class="row" style="flex-wrap:wrap;gap:5px" data-testid="dom-sq-incentive">${incs}</div></div>
    ${extra}
    ${alert}
    <div class="row" style="gap:6px;margin-top:10px;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.28);box-shadow:inset 0 0 0 2px rgba(178,140,255,.35);${rowMark(m, 'members')}"${act('sqRow', 'members')} data-testid="dom-sq-members"><span class="xs mu" style="margin-right:4px">${m.kind === 'group' ? 'SQUADS' : 'PICKED'}</span>${picked}${note}</div>
    <div class="row" style="gap:12px;position:absolute;left:14px;right:14px;bottom:12px">
      <div class="col" style="align-items:center;gap:3px;position:relative"><div class="rays turn" style="left:-30px;top:-46px;width:180px;height:140px;--rc:rgba(200,160,255,.4)"></div><div class="armband" style="position:relative;box-shadow:0 0 0 3px var(--ink),inset 0 0 0 3px #e8e2ff,inset 0 -6px 0 rgba(0,0,0,.2),0 0 22px rgba(190,140,255,.75)" data-testid="dom-sq-armband"><span>${esc(m.armband.initial)}</span><i style="color:${m.armband.colour}">${esc(m.armband.mark)}</i></div><span class="xs mu">Purple · Lilac</span></div>
      <div class="cta${m.cta.ok ? ' shine' : ''}" style="position:relative;flex:1;height:56px;font-size:18px;white-space:nowrap;padding:0 10px;${m.cta.ok ? '' : 'filter:saturate(.3);opacity:.75'}"${act('sqForm')} data-testid="dom-sq-form">${esc(m.cta.text)} ▶ <span class="kc">Enter</span></div>
    </div>
  </div>`;
}

function picker(p: PickerModel): string {
  const rows = p.rows.slice(p.start, p.start + 9).map((r, j) => {
    const i = p.start + j;
    const on = i === p.at;
    return `<div class="row sp${on ? ' ants' : ''}" style="padding:5px 9px;border-radius:6px;gap:8px;${on ? 'background:linear-gradient(90deg,#3a5a9e,#2a3f72);box-shadow:0 0 0 2px #8cc0ff' : 'background:#2b375a'};${r.locked ? 'opacity:.55' : ''}"${act('sqPick', i)} data-over="sqPickOver" data-testid="dom-pick-${i}"><span>${on ? '▶ ' : ''}${r.on ? '● ' : ''}${esc(r.label)}</span><span class="xs ${r.locked ? 'rd' : 'y'}" style="text-align:right">${esc(r.note)}</span></div>`;
  }).join('');
  return `<div class="pnl gild" style="left:572px;top:70px;width:372px;height:458px;padding:12px 14px;z-index:31" data-testid="dom-sq-picker"><span class="brk"></span>
    <div class="hd y"><img class="ic" src="${img(p.kind === 'order' ? 'g-machine-part' : 'g-star-piece')}" alt="">${esc(p.title)}<span class="r">${esc(p.right)}</span></div>
    <div class="col" style="gap:5px;font-size:14.5px">${rows}</div>
    <div class="row xs mu" style="position:absolute;left:14px;bottom:12px;gap:5px"><span class="kc">▲▼</span>pick<span class="kc">Enter</span>${p.kind === 'order' ? 'give the order' : 'take it'}<span class="kc">Esc</span>back</div>
  </div>`;
}

export function squadsView(m: SquadsModel, notice: string | null): string {
  const cards = m.cards.map((c, i) => sqCard(c, i)).join('');
  const empty = m.empty ? `<div class="pnl" style="left:16px;top:70px;width:538px;padding:16px" data-testid="dom-sq-empty"><div class="hd"><img class="ic" src="${img('g-fame-checker')}" alt="">SQUADS</div><div class="sm" style="line-height:1.4">${esc(m.empty)}</div></div>` : '';
  const groups = m.groups.length ? `<div class="a xs" style="left:16px;top:52px;z-index:9;color:#e8e2ff" data-testid="dom-sq-groups">Groups: ${m.groups.map(esc).join(' · ')}</div>` : '';
  const paging = m.pages > 1 ? `<span class="kc"${act('sqCardPage', -1)}>[</span><span class="dm">${m.page + 1}/${m.pages}</span><span class="kc"${act('sqCardPage', 1)}>]</span>` : '';
  const msg = notice ? `<div class="al y" style="position:absolute;left:16px;top:486px;width:538px;z-index:35;font-size:13px" data-testid="dom-notice"><img class="ic" src="${img('g-soothe-bell')}" alt=""><span>${esc(notice)}</span></div>` : '';
  const keys = `<div class="a row xs" style="left:16px;bottom:4px;gap:4px;z-index:9;color:#dfe5ff" data-testid="dom-sq-keys"><span class="kc">←↑↓→</span>squad<span class="kc">Enter</span>order<span class="kc">E</span>edit<span class="kc">T</span>trait<span class="kc">X</span>break up<span class="kc">Tab</span>builder<span class="kc">G</span>group<span class="kc">N</span>name<span class="kc">F</span>focus<span class="kc">Esc</span>back</div>`;
  return stage(`<div class="layer" style="background:radial-gradient(420px 300px at 280px 300px,rgba(123,63,160,.3),transparent 70%)"></div>
  <div class="ttl" style="--t1:#7b3fa0;--t2:#b04ad0">Roster <span class="sub">· Squads</span></div>
  <div class="keys"><span class="key q4">Q</span><span>Wheel</span>${paging}<span class="key" data-testid="dom-sq-count">${esc(m.count)}</span><span class="key">${esc(m.hq)}</span></div>
  ${groups}
  ${cards}${empty}
  ${m.picker ? picker(m.picker) : builder(m.builder)}
  ${msg}
  ${keys}
  ${FX}`, '', 'kl-violet check vign grain');
}
