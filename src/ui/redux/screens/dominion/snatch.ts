// DOMINION slice D23 screen: the Holding Cell's questioning room (Rotom mockup a7), ported from the round-4 copy
// (plans/evil-mode-rework/mockups-v4/index.html #k7: the Nova livery, sigil and villain light come from dominion.css and stage()).
// Plain data in from core/dominion/snatchScreens.ts; the scene's SnatchController keeps the typing box and the input.
// Every button is a tap target with a key: ◀ ▶ / I E the Goal and Enter to start, 1-5 the approaches, T your own words,
// Esc stop; then 1 Release, 2 Recruit, 3 Ransom, Esc keep them in the cell. Talk only: no violence is shown.

import type { RoomModel } from '../../../../core/dominion/snatchScreens';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { stage, WHEEL_KEY } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const sign = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '±0');
const PILL: Record<string, string> = { r: 'r', y: 'y', b: 'b', g: 'g', v: 'v', k: 'k', m: 'v' };

const ROOM_FX = `<div class="haze" style="--hz:#cfe0ff;--hz2:#ffd23f" aria-hidden="true"></div>
  <div class="bokeh" aria-hidden="true" style="background:radial-gradient(circle 22px at 770px 117px,color-mix(in srgb,#ffd23f 34%,transparent),color-mix(in srgb,#ffd23f 18%,transparent) 70%,transparent 100%),radial-gradient(circle 49px at 893px 160px,color-mix(in srgb,#cfe0ff 34%,transparent),color-mix(in srgb,#cfe0ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 24px at 843px 77px,color-mix(in srgb,#ffd23f 34%,transparent),color-mix(in srgb,#ffd23f 18%,transparent) 70%,transparent 100%),radial-gradient(circle 46px at 34px 475px,color-mix(in srgb,#cfe0ff 34%,transparent),color-mix(in srgb,#cfe0ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 42px at 535px 92px,color-mix(in srgb,#ffd23f 34%,transparent),color-mix(in srgb,#ffd23f 18%,transparent) 70%,transparent 100%),radial-gradient(circle 31px at 48px 88px,color-mix(in srgb,#cfe0ff 34%,transparent),color-mix(in srgb,#cfe0ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 38px at 179px 175px,color-mix(in srgb,#ffd23f 34%,transparent),color-mix(in srgb,#ffd23f 18%,transparent) 70%,transparent 100%),radial-gradient(circle 33px at 107px 503px,color-mix(in srgb,#cfe0ff 34%,transparent),color-mix(in srgb,#cfe0ff 18%,transparent) 70%,transparent 100%)"></div>
  <div class="pts" aria-hidden="true"><i class="pt drop f" style="left:435px;top:101px;--dl:-5.6s;--t:4.5s;--c:#fff"></i><i class="pt drop f" style="left:411px;top:120px;--dl:-5.8s;--t:3.1s;--c:#ffd23f"></i><i class="pt star f" style="left:630px;top:54px;--dl:-5.6s;--t:4.9s;--c:#fff"></i><i class="pt star f" style="left:612px;top:74px;--dl:-6.0s;--t:2.6s;--c:#cfe0ff"></i><i class="pt star f" style="left:626px;top:98px;--dl:-1.3s;--t:3.6s;--c:#cfe0ff"></i><i class="pt star f" style="left:696px;top:88px;--dl:-5.4s;--t:5.3s;--c:#ffd23f"></i><i class="pt star f" style="left:563px;top:77px;--dl:-4.5s;--t:3.5s;--c:#ffd23f"></i></div>
  <div class="grade" aria-hidden="true" style="--g1:#cfe0ff;--g2:#ffd23f"></div>
  <div class="focus" aria-hidden="true" style="left:474px;top:276px;--r:150px;--fc:170,205,255"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#cfe0ff"></div>
  <div class="orn" aria-hidden="true"></div>
  <div class="rays turn finale" aria-hidden="true" style="left:309px;top:111px;width:330px;height:330px;--rc:rgba(170,205,255,.30)"></div><i class="glint fg" style="left:556px;top:186px;--g:20px"></i><i class="glint fg" style="left:369px;top:328px;--g:14px;animation-delay:-1.4s"></i>`;

export interface RoomUi { typing: boolean; busy: boolean; notice: string | null; pick: number }

/** Mockup a7: the questioning. */
export function roomView(m: RoomModel, t: RoomUi): string {
  const pct = Math.round((m.resolve / 100) * 100);
  const lost = Math.max(0, m.hit);
  const crack = m.got > 0 ? `<svg class="a" style="left:0;top:0" width="408" height="22" viewBox="0 0 408 22"><path d="M${Math.round(pct * 4.08) - 4} 0 L${Math.round(pct * 4.08) - 10} 8 L${Math.round(pct * 4.08)} 12 L${Math.round(pct * 4.08) - 8} 22${m.got > 1 ? ` M${Math.round(pct * 4.08) + 70} 0 L${Math.round(pct * 4.08) + 78} 9 L${Math.round(pct * 4.08) + 66} 13 L${Math.round(pct * 4.08) + 74} 22` : ''}" fill="none" stroke="#fff" stroke-width="2"/></svg>` : '';
  const hitNum = m.hit ? `<div class="a num jolt n3d" style="left:${Math.max(110, Math.min(330, Math.round((pct + lost / 2) * 4.08) - 30))}px;top:-14px;font-size:40px;color:${m.hit > 0 ? '#ff8a2a' : '#9fd6ff'}" data-testid="dom-s-hit">${sign(-m.hit)}</div>` : '';
  const goals = m.goals.map((g, i) => {
    const on = m.phase === 'goal' ? t.pick === i : g.on;
    const stripe = g.id === 'info' ? '#4fa3ff' : '#ffb238';
    return `<div class="ch${on ? ' on' : ''}" style="--stripe:${stripe};font-size:15px;padding:6px 10px 6px 20px${on ? '' : ';opacity:.6'}"${m.phase === 'goal' ? act('sGoal', g.id) : ''} data-testid="dom-s-goal-${g.id}">${g.label}<div class="sub">${esc(g.sub)}</div></div>`;
  }).join('');
  const traits = m.traits.map((x) => `<span class="pill ${PILL[x.tone] ?? 'k'}">${esc(x.name.toUpperCase())}</span>`).join('');
  const talk = m.phase === 'talk';
  const pips = m.pips.map((p) => `<span class="row" style="gap:5px"${talk ? act('sSay', p.approach) : ''} data-testid="dom-s-say-${p.approach}"><span class="kc" style="height:15px;font-size:10px;min-width:15px;padding:0 3px;${talk ? '' : 'opacity:.45'}">${p.key}</span>${esc(p.label)}</span><span class="pips" style="--n:${p.n};width:70px"></span>`).join('');
  const ex = m.exchange;
  const exchange = ex
    ? `<span class="mu">You:</span> “${esc(ex.said)}”
    <div class="row" style="gap:8px;margin-top:6px;font-size:13px"><span class="pill ${PILL[ex.tone] ?? 'b'}" data-testid="dom-s-approach">${esc(ex.approach)}</span><span class="pill k">strength ${ex.strength}</span><span class="y">▶</span><span class="fx ${ex.hit >= 0 ? 'dn' : 'up'}" data-testid="dom-s-delta">Resolve ${sign(-ex.hit)}</span><span class="fx ${ex.fear <= 0 ? 'dn' : 'up'}">${ex.fear <= 0 ? `Fear +${-ex.fear}` : `Trust +${ex.fear}`}</span></div>`
    : m.phase === 'goal'
      ? `<span class="mu">Pick a Goal first:</span> <b>Info</b> (what they know) or <b>Extortion</b> (what they can pay). <span class="kc">◀ ▶</span> then <span class="kc">Enter</span>.`
      : `<span class="mu">Your move.</span> Press <b>1</b>-<b>5</b> for an approach, or <b>T</b> and say it in your own words.`;
  const box = t.busy ? '<span style="color:#ffb38a">Rotom is listening…</span>' : t.notice ? `<span class="rd">${esc(t.notice)}</span>` : '';
  const ending = m.phase === 'end';
  const ends = m.ends.map((e) => `<div class="ch${ending ? '' : ' off'}" style="--stripe:${e.tone};flex:1;font-size:15px${ending ? '' : ';opacity:.5'}"${ending ? act('sEnd', e.how) : ''} data-testid="dom-s-end-${e.how}">${e.label}<span class="kc" style="position:absolute;right:8px;top:8px;height:18px;font-size:11px">${e.key}</span><div class="sub">${esc(e.sub)}</div></div>`).join('');
  const keys = m.phase === 'goal'
    ? `${WHEEL_KEY}<span class="key"${act('sGoalPick', 'prev')}>◀▶</span><span class="key"${act('sGoalGo')} data-testid="dom-s-enter">Enter</span><span>Goal</span>`
    : m.phase === 'talk'
      ? `${WHEEL_KEY}<span class="key"${act('sType')} data-testid="dom-s-type">T</span><span>Type</span><span class="key"${act('sStop')} data-testid="dom-s-stop">Esc</span><span>Stop</span>`
      : `${WHEEL_KEY}<span class="key">1-3</span><span>End</span><span class="key"${act('sEnd', 'keep')} data-testid="dom-s-keep">Esc</span><span>Keep</span>`;
  return stage(`<div class="a" style="left:0;top:0;width:960px;height:360px;z-index:1;background:repeating-linear-gradient(0deg,#2a2a30 0 38px,#202026 38px 40px),repeating-linear-gradient(90deg,transparent 0 78px,#202026 78px 80px),#2a2a30;background-blend-mode:multiply"></div>
  <div class="a" style="left:0;top:360px;width:960px;height:180px;z-index:1;background:linear-gradient(180deg,#24222a,#141218)"></div>
  <div class="a" style="left:740px;top:220px;width:90px;height:140px;z-index:2;background:linear-gradient(180deg,#6b4d30,#4a3420);box-shadow:0 0 0 2px #2a1a0c;filter:brightness(.6)"></div>
  <div class="a" style="left:800px;top:280px;width:110px;height:80px;z-index:2;background:linear-gradient(180deg,#6b4d30,#4a3420);box-shadow:0 0 0 2px #2a1a0c;filter:brightness(.5)"></div>
  <div class="a" style="left:120px;top:250px;width:100px;height:110px;z-index:2;background:linear-gradient(180deg,#3a4a5c,#2a3440);box-shadow:0 0 0 2px #10141a;filter:brightness(.55)"></div>
  <div class="a swing" style="left:452px;top:0;width:56px;height:96px;z-index:6">
    <i class="a" style="left:27px;top:0;width:2px;height:66px;background:#111"></i><i class="a" style="left:20px;top:64px;width:16px;height:20px;border-radius:50% 50% 45% 45%;background:radial-gradient(circle at 50% 40%,#fff,#ffe9a0 50%,#e0a030);box-shadow:0 0 30px 12px rgba(255,220,140,.55)"></i></div>
  <div class="cone flick" style="left:290px;top:80px;width:380px;height:440px;z-index:3;--cc:rgba(255,220,150,.32)"></div>

  <div class="ttl" style="--t1:#3a3f4a;--t2:#6a7386" data-testid="dom-s-title">Questioning <span class="sub">· ${esc(m.title)}</span></div>
  <div class="keys">${keys}</div>

  <div class="embers" style="left:330px;top:90px;width:300px;height:300px;z-index:4;--ec:#fff3c4;opacity:.55"></div>
  ${m.needle < 0 || m.hit > 0 ? `<div class="a" style="left:510px;top:176px;width:8px;height:12px;z-index:6;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#9fd6ff;box-shadow:0 0 6px #9fd6ff"></div>
  <div class="a" style="left:418px;top:170px;width:10px;height:14px;z-index:6;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#9fd6ff;box-shadow:0 0 6px #9fd6ff"></div>` : ''}
  <div class="shd" style="left:400px;top:340px;width:160px;height:24px"></div>
  <img class="spr" src="${img(m.sprite)}" alt="${esc(m.name)}" style="left:428px;top:150px;width:104px;height:162px;z-index:5;object-fit:contain;object-position:bottom" data-testid="dom-s-captive">

  <div class="a" style="left:276px;top:72px;width:408px;z-index:8" data-testid="dom-s-resolve">
    <div class="row sp" style="margin-bottom:4px"><b class="caps" style="font-size:15px;letter-spacing:.12em">Resolve</b><span class="num" style="font-size:24px"><span data-testid="dom-s-resolve-n">${m.resolve}</span><span class="mu" style="font-size:16px"> / 100</span></span></div>
    <div style="position:relative;height:22px;border-radius:6px;background:#0a0f20;box-shadow:0 0 0 3px var(--ink),inset 0 2px 0 rgba(0,0,0,.5);overflow:hidden">
      <i class="a" style="left:0;top:0;bottom:0;width:${pct}%;background:linear-gradient(180deg,#9fd6ff,#4fa3ff 60%,#2a6ad0);box-shadow:0 0 12px #4fa3ff;transition:width .4s"></i>
      ${lost ? `<i class="a" style="left:${pct}%;top:0;bottom:0;width:${Math.min(100 - pct, lost)}%;background:repeating-linear-gradient(135deg,#ffd23f 0 6px,#ff8a2a 6px 12px);opacity:.85"></i>` : ''}
      ${crack}</div>
    ${hitNum}
  </div>

  <div class="pnl" style="left:16px;top:76px;width:248px;height:264px;padding:10px 12px" data-testid="dom-s-goal">
    <div class="hd" style="font-size:14px"><img class="ic s" src="${img('g-secret-key')}" alt="">Goal</div>
    <div class="col" style="gap:6px">${goals}</div>
    <div class="caps xs dm" style="margin:10px 0 4px;letter-spacing:.12em">Their card</div>
    <div class="row" style="gap:6px" data-testid="dom-s-card">${traits}</div>
    <div class="xs mu" style="margin-top:6px;line-height:1.35">${esc(m.blurb)}</div>
  </div>

  <div class="pnl" style="left:696px;top:76px;width:248px;height:150px;padding:10px 12px" data-testid="dom-s-needle">
    <div class="hd" style="font-size:14px;margin-bottom:4px">Fear · Trust</div>
    <div class="gauge wob" style="--w:160px;margin:0 auto"><i class="nd" style="--a:${m.angle}deg"></i><i class="hub"></i></div>
    <div class="row sp xs" style="margin-top:-2px"><b class="rd">FEAR</b><b class="gn">TRUST</b></div>
  </div>

  <div class="pnl" style="left:696px;top:234px;width:248px;height:118px;padding:8px 12px" data-testid="dom-s-pips">
    <div class="caps xs dm" style="letter-spacing:.12em;margin-bottom:4px">How hard each hits them</div>
    <div class="bars" style="position:static;height:auto;background:none;font-size:13px;gap:2px 8px;grid-template-columns:auto 1fr">${pips}</div>
  </div>

  <div class="a" style="left:16px;top:356px;width:568px;z-index:8;background:#0b1020;border-radius:9px;box-shadow:0 0 0 3px var(--ink),inset 0 0 0 2px #56679d;padding:8px 12px;font-size:15px;line-height:1.35;max-height:76px;overflow:hidden" data-testid="dom-s-exchange">
    ${exchange}${box ? `<div class="xs" style="margin-top:4px">${box}</div>` : ''}
  </div>
  ${m.reply ? `<div class="bub" style="left:548px;top:132px;width:220px;--tx:18px;font-size:15px;z-index:20" data-testid="dom-s-reply">“${esc(m.reply)}”</div>` : ''}
  ${m.chip ? `<div class="aichip" style="left:490px;top:226px" data-testid="dom-s-chip"><i></i>${esc(m.chip)}</div>` : ''}
  ${m.banner ? `<div class="bnr" style="left:600px;top:362px;width:344px;height:62px;font-size:19px;flex-direction:column;gap:0;clip-path:polygon(0 0,100% 0,96% 50%,100% 100%,0 100%,4% 50%)" data-testid="dom-s-banner">${esc(m.banner.title)}<small style="font-size:14px">${esc(m.banner.sub)}</small></div>
  <span class="glint" style="left:924px;top:360px;--g:18px"></span>` : `<div class="a xs mu" style="left:604px;top:372px;width:336px;z-index:8;text-align:right" data-testid="dom-s-turn">Line ${m.turn} of ${m.turns}</div>`}

  <div class="a xs dm" style="left:16px;top:516px;z-index:8">Talk only, as in the games: pressure, bluffs, bribes and promises. No violence is shown.</div>
  <div class="a row" style="left:16px;top:440px;width:928px;z-index:8;gap:10px" data-testid="dom-s-ends">
    ${ends}
    <div class="col" style="gap:4px;width:200px;font-size:13px"><div class="row sp"><span>Heat</span><b class="rd" data-testid="dom-s-heat">${m.heat}%</b></div><div class="mt heat" style="--v:${m.heat};height:10px"></div><span class="xs mu" data-testid="dom-s-risk">Police check risk ${m.risk}%</span></div>
  </div>
  ${ROOM_FX}`, 'background:#100e12', 'kl-cold vign grain');
}
