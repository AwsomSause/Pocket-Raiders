// DOMINION slice D22 screen: Confront, the spy on the crew (Rotom mockup a6, ported from
// plans/evil-mode-rework/mockups-v4/index.html #k6 with the round-3 passes from mockups-v3): the back room under a
// swinging bulb, the member at the table with the evidence (their photo beside the rival Boss's, the intercepted note),
// red string from the Suspicion log, the Suspicion panel (big red 3D number, HIGH tag, the newest clues), "The talk",
// the tell stamped over their head, the ✦ Rotom chip, the four endings "picked by the rules", and the line you type.
// Plain data in from core/dominion/spyScreens.ts; the scene's SpyController keeps the cursor and the typed draft.
// The round-4 Nova livery (sig4, vl4, q4 key) is D26's re-port: this screen uses the v3 classes like the others.

import './dominion.css';
import './claude.css';
import type { SpyModel } from '../../../../core/dominion/spyScreens';
import { act, esc, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { stage } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

const OVERLAYS = `<div class="haze" style="--hz:#fff0c0;--hz2:#ff7ab8" aria-hidden="true"></div>
  <div class="bokeh" aria-hidden="true" style="background:radial-gradient(circle 27px at 917px 401px,color-mix(in srgb,#ff7ab8 34%,transparent),color-mix(in srgb,#ff7ab8 18%,transparent) 70%,transparent 100%),radial-gradient(circle 50px at 53px 470px,color-mix(in srgb,#fff0c0 34%,transparent),color-mix(in srgb,#fff0c0 18%,transparent) 70%,transparent 100%),radial-gradient(circle 20px at 105px 81px,color-mix(in srgb,#ff7ab8 34%,transparent),color-mix(in srgb,#ff7ab8 18%,transparent) 70%,transparent 100%),radial-gradient(circle 42px at 579px 70px,color-mix(in srgb,#fff0c0 34%,transparent),color-mix(in srgb,#fff0c0 18%,transparent) 70%,transparent 100%),radial-gradient(circle 38px at 774px 159px,color-mix(in srgb,#ff7ab8 34%,transparent),color-mix(in srgb,#ff7ab8 18%,transparent) 70%,transparent 100%),radial-gradient(circle 44px at 146px 200px,color-mix(in srgb,#fff0c0 34%,transparent),color-mix(in srgb,#fff0c0 18%,transparent) 70%,transparent 100%)"></div>
  <div class="pts" aria-hidden="true"><i class="pt mote f" style="left:590px;top:90px;--dl:-0.7s;--t:4.9s;--c:#fff"></i><i class="pt mote f" style="left:687px;top:274px;--dl:-4.2s;--t:3.2s;--c:#ff7ab8"></i><i class="pt mote f" style="left:494px;top:81px;--dl:-0.7s;--t:4.4s;--c:#fff"></i><i class="pt mote f" style="left:531px;top:241px;--dl:-2.0s;--t:5.2s;--c:#fff"></i><i class="pt mote f" style="left:622px;top:295px;--dl:-4.0s;--t:3.5s;--c:#fff0c0"></i><i class="pt mote f" style="left:564px;top:243px;--dl:-0.6s;--t:3.1s;--c:#fff"></i><i class="pt mote f" style="left:629px;top:127px;--dl:-3.2s;--t:4.6s;--c:#fff0c0"></i><i class="pt mote f" style="left:492px;top:174px;--dl:-3.9s;--t:3.7s;--c:#fff0c0"></i></div>
  <div class="grade" aria-hidden="true" style="--g1:#fff0c0;--g2:#ff7ab8"></div>
  <div class="focus" aria-hidden="true" style="left:486px;top:216px;--r:160px;--fc:255,205,140"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#fff0c0"></div>
  <div class="orn" aria-hidden="true"></div>
  <div class="rays turn finale" aria-hidden="true" style="left:310px;top:40px;width:352px;height:352px;--rc:rgba(255,205,140,.30)"></div><i class="glint fg" style="left:574px;top:120px;--g:20px"></i><i class="glint fg" style="left:374px;top:272px;--g:14px;animation-delay:-1.4s"></i>`;

function figure(look: string, name: string): string {
  return look.endsWith('.png')
    ? `<img class="spr bob" src="${rxUrl(look)}" alt="${esc(name)}" style="left:420px;top:150px;width:126px;height:214px;z-index:4" data-testid="dom-spy-member">`
    : `<div class="a bob" style="left:383px;top:140px;width:200px;height:224px;z-index:4;display:flex;align-items:flex-end;justify-content:center;overflow:hidden" data-testid="dom-spy-member">${tall(look, 214)}</div>`;
}
function thumb(look: string, left: number, w: number): string {
  return look.endsWith('.png')
    ? `<img class="spr" src="${rxUrl(look)}" alt="" style="left:${left}px;top:2px;width:${w}px;height:48px;filter:brightness(.8)">`
    : `<div class="a" style="left:${left - 10}px;top:2px;width:${w + 20}px;height:48px;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;filter:brightness(.8)">${tall(look, 48)}</div>`;
}

/** `draft`: what the player is typing (kept by the controller); `at`: the picked quick question or ending row. */
export function spyView(m: SpyModel, draft: string, at: number, notice: string | null): string {
  const U = m.ui;
  const levelCls = m.level === 'high' ? 'r' : m.level === 'mid' ? 'y' : 'b';
  const clues = m.clues.map((c) => `<div class="al ${c.hot ? 'r' : 'y'}" style="font-size:13px;padding:5px 8px" data-testid="dom-spy-clue"><span><span class="t">D${c.day}</span>${esc(c.text)}</span></div>`).join('')
    || `<div class="xs mu">${esc(U.empty!)}</div>`;
  const turns = m.turns.slice(-2).map((t) => `<div style="background:#0b1020;border-radius:8px;padding:6px 9px;box-shadow:0 0 0 2px #56679d">${esc(U.you!)}: “${esc(t.you)}”</div>
      <div class="${t.rotom ? 'typing' : ''}" style="background:#2a1a14;border-radius:8px;padding:6px 9px;box-shadow:0 0 0 2px ${t.rotom ? '#ff9a62' : '#c4532a'}" data-testid="dom-spy-reply">${esc(m.name)}: “${esc(t.them)}”</div>`).join('')
    || `<div class="xs mu" style="line-height:1.35">${esc(U.empty!)}</div>`;
  const qs = m.questions.map((q, i) => `<div class="ch${at === i ? ' on' : ''}" style="--stripe:${q.off ? '#56679d' : '#ffd23f'};padding:5px 10px;font-size:15px;${q.off ? 'opacity:.5' : ''}"${act('spyRow', i)} data-over="spyOver" data-testid="dom-spy-q-${esc(q.id)}">${esc(q.label)}<div class="sub">${esc(q.sub)}</div></div>`).join('');
  const ends = m.ends.map((e) => `<div class="ch" style="--stripe:${e.colour};padding:5px 10px;font-size:15px" data-testid="dom-spy-end-${esc(e.id)}">${esc(e.label)}<div class="sub">${esc(e.sub)}</div></div>`).join('');
  const n = m.questions.length;
  const decide = `<div class="ch${at === n ? ' on' : ''}" style="--stripe:#ef4a3a;padding:5px 10px;font-size:15px"${act('spyRow', n)} data-over="spyOver" data-testid="dom-spy-accuse">${esc(U.accuse!)}<div class="sub">${esc(U.truth!)}</div></div>
      <div class="ch${at === n + 1 ? ' on' : ''}" style="--stripe:#56679d;padding:5px 10px;font-size:15px"${act('spyRow', n + 1)} data-over="spyOver" data-testid="dom-spy-drop">${esc(U.drop!)}<div class="sub">Suspicion −15</div></div>`;
  return stage(`<div class="a" style="left:0;top:0;width:960px;height:330px;z-index:1;background:repeating-linear-gradient(90deg,#1c1824 0 46px,#18141f 46px 48px),linear-gradient(180deg,#141018,#221c2c)"></div>
  <div class="a" style="left:0;top:330px;width:960px;height:210px;z-index:1;background:linear-gradient(180deg,#2a2230,#16121c)"></div>
  <div class="a swing" style="left:452px;top:0;width:56px;height:96px;z-index:6">
    <i class="a" style="left:27px;top:0;width:2px;height:62px;background:#111"></i><i class="a" style="left:6px;top:60px;width:44px;height:20px;border-radius:22px 22px 4px 4px;background:#3a3f4a;box-shadow:0 0 0 2px var(--ink)"></i><i class="a" style="left:20px;top:78px;width:16px;height:8px;border-radius:0 0 8px 8px;background:#fff3c4;box-shadow:0 0 18px 6px rgba(255,230,160,.6)"></i></div>
  <div class="cone flick" style="left:300px;top:80px;width:360px;height:420px;z-index:3;--cc:rgba(255,230,160,.30)"></div>
  <div class="ttl" style="--t1:#7a1c2c;--t2:#c43a52" data-testid="dom-spy-title">${esc(U.title!)} <span class="sub">· ${esc(m.name)}</span></div>
  <div class="keys"><span class="key">▲▼</span><span>Choose</span><span class="key">Enter</span><span>Ask</span><span class="key"${act('back')}>Esc</span><span>${esc(U.end!)}</span></div>

  <div class="shd" style="left:410px;top:380px;width:150px;height:22px"></div>
  ${figure(m.look, m.name)}
  <div class="a" style="left:530px;top:176px;width:8px;height:12px;z-index:5;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#9fd6ff;box-shadow:0 0 6px #9fd6ff"></div>
  <div class="a" style="left:250px;top:330px;width:460px;height:34px;z-index:5;border-radius:6px;background:linear-gradient(180deg,#5a4a3a,#3a2e22);box-shadow:0 0 0 3px var(--ink),0 10px 20px rgba(0,0,0,.6)"></div>
  <div class="doc" style="left:280px;top:300px;width:92px;height:62px;z-index:7;transform:rotate(-8deg);padding:4px" data-testid="dom-spy-photo"><div style="width:100%;height:100%;background:linear-gradient(180deg,#4a5578,#2a3150);position:relative;overflow:hidden">${thumb(m.look, 14, 28)}${thumb(`dominion/${m.bossLook}`, 50, 26)}</div></div>
  <div class="doc" style="left:572px;top:296px;width:118px;height:66px;z-index:7;transform:rotate(6deg);font-size:11px" data-testid="dom-spy-note"><div class="dh" style="font-size:9.5px"><img class="ic s" src="${img('g-xtransceiver')}" alt="">${esc(U.intercepted!)}</div>“${esc(m.note)}”</div>

  <div class="pnl" style="left:16px;top:76px;width:246px;height:272px;padding:10px 12px" data-testid="dom-spy-suspicion">
    <div class="hd" style="font-size:15px;color:#ff8a9a"><img class="ic s" src="${img('g-silph-scope')}" alt="">${esc(U.suspicion!)}</div>
    <div class="row" style="align-items:baseline;gap:6px"><span class="num rd pulse n3d" style="font-size:44px;line-height:.9" data-testid="dom-spy-sus">${m.sus}</span><span class="mu">/ 100</span><span class="pill ${levelCls}" style="margin-left:auto;font-size:11px">${esc(m.levelWord)}</span></div>
    <div class="mt r" style="--v:${m.sus};height:14px;margin:6px 0 10px"></div>
    <div class="col" style="gap:5px">${clues}</div>
  </div>

  <div class="pnl" style="left:698px;top:76px;width:246px;height:272px;padding:10px 12px" data-testid="dom-spy-talk">
    <div class="hd" style="font-size:15px"><img class="ic s" src="${img('g-mic')}" alt="">${esc(U.talk!)}<span class="xs mu" style="margin-left:auto">${m.left} left</span></div>
    <div class="col" style="gap:7px;font-size:13.5px;line-height:1.3;max-height:212px;overflow:hidden">${turns}</div>
  </div>
  ${m.tell ? `<div class="tell jolt" style="left:280px;top:106px;--tc:${m.tell.colour};font-size:19px" data-testid="dom-spy-tell">${esc(m.tell.word)}</div>` : ''}
  ${m.chip ? `<div class="aichip" style="left:706px;top:316px;z-index:33" data-testid="dom-spy-chip"><i></i>${esc(m.chip)}</div>` : ''}
  ${m.waiting ? `<div class="aichip" style="left:706px;top:316px;z-index:33" data-testid="dom-spy-wait"><i></i>${esc(U.thinking!)}</div>` : ''}
  <div class="embers" style="left:330px;top:100px;width:300px;height:300px;z-index:4;--ec:#fff3c4;opacity:.6"></div>
  <svg class="a" style="left:0;top:0;z-index:8;pointer-events:none" width="960" height="540" viewBox="0 0 960 540"><path d="M250 210 C 300 260, 300 290, 318 316" fill="none" stroke="#e02a2a" stroke-width="3"/><path d="M250 300 C 400 380, 520 360, 600 320" fill="none" stroke="#e02a2a" stroke-width="3"/><circle cx="318" cy="316" r="5" fill="#ffd23f" stroke="#2a1a0c" stroke-width="2"/><circle cx="600" cy="320" r="5" fill="#ffd23f" stroke="#2a1a0c" stroke-width="2"/></svg>

  <div class="a" style="left:16px;top:372px;width:928px;z-index:8">
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px">${qs}${decide}</div>
    <div class="caps xs mu" style="letter-spacing:.14em;margin:6px 0 4px">${esc(U.truth!)}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${ends}</div>
  </div>
  <div class="row" style="position:absolute;left:16px;top:494px;width:928px;z-index:8;gap:10px">
    <input data-testid="dom-spy-type" maxlength="120" autocomplete="off" spellcheck="false" placeholder="${esc(U.typeHint!)}" value="${esc(draft)}" style="flex:1;height:38px;border-radius:9px;background:#0b1020;border:3px solid #56679d;box-shadow:0 0 0 3px var(--ink);padding:0 12px;font:15px var(--ui);color:#e8ecff;outline:none">
    <div class="bt y" style="font-size:16px"${act('spySay')} data-testid="dom-spy-say">${esc(U.say!)} <span class="kc">Enter</span></div>
  </div>
  ${notice ? `<div class="a" style="left:300px;width:360px;top:120px;z-index:40;background:rgba(10,14,30,.94);border:2px solid #ff8a9a;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3"${act('dismiss')} data-testid="dom-notice">${esc(notice)}</div>` : ''}
  ${OVERLAYS}`, 'background:#0e0c14', 'kl-spot vign grain');
}
