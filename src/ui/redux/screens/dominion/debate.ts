// DOMINION slice D13: the Debate (mockup 8, round 4: plans/evil-mode-rework/mockups-v4/index.html, figure s8), ported
// nearly line for line: the gold-rimmed Leader's Table, the two spot-lit sides with their crests and candles, the judge's
// last verdict on five marks, the Conviction tug bar along the table edge, the Boss's text box, the four stance cards
// fanned like a hand (keys 1-4), the argument box and Argue (Enter). Offline, the argument box holds one of the stance's
// three set lines (▲▼ to change it). The results overlay reuses the mockup's gilded panel and banner. Plain data in from
// core/dominion/debateScreens.ts; the scene's DebateController keeps the cursor.

import './dominion.css';
import type { DebateModel } from '../../../../core/dominion/debateScreens';
import { act, esc } from '../../kit';
import { rxUrl } from '../../assets';
import { stage, WHEEL_KEY } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const signed = (n: number): string => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n)}`;
/** −100..+100 as a left % along the bar. */
const at = (c: number): number => 50 + c / 2;
const TILT = ['rotate(-3deg) translateY(2px)', 'rotate(-1deg)', 'rotate(1.5deg)', 'rotate(3deg) translateY(2px)'];

export function debateView(m: DebateModel): string {
  const c = m.conviction;
  const fill = c >= 0 ? `left:50%;width:${c / 2}%` : `left:${at(c)}%;width:${-c / 2}%`;
  const stances = m.stances.map((s, i) => {
    const t = s.on ? 'rotate(1.5deg) translateY(-8px) scale(1.06);z-index:2' : TILT[i]!;
    return `<div class="ch${s.on ? ' on' : ''}" style="--stripe:${s.stripe};padding:6px 8px 6px 18px;font-size:15px;transform:${t};${s.left ? '' : 'opacity:.45'}"${act('debStance', i)} data-testid="dom-debate-stance-${s.id}">${esc(s.name)}<span class="kc" style="top:6px;right:6px;min-width:18px;height:18px;font-size:11px">${s.key}</span></div>`;
  }).join('');
  const line = m.lines.find((x) => x.on) ?? m.lines[0]!;
  const li = m.lines.indexOf(line);
  const dots = m.lines.map((x, i) => `<i${act('debLine', i)} style="display:inline-block;width:9px;height:9px;border-radius:50%;cursor:pointer;background:${x.on ? 'var(--gold)' : x.used ? '#3a4466' : '#8090c0'};box-shadow:0 0 0 2px var(--ink)"></i>`).join('');
  const prev = line.preview ? `<span class="a xs" style="right:10px;top:4px;color:var(--gold)" data-testid="dom-debate-preview">${signed(line.preview.move)}</span>` : '';
  const verdict = m.verdict
    ? m.verdict.marks.map((x) => `<div class="row sp"><span>${esc(x.name)}</span><span class="pips" style="--n:${x.n}"></span></div>`).join('')
    : `<div class="xs mu" style="line-height:1.35">Round ${esc(m.round.num)} · ${esc(m.round.name)}: ${esc(m.round.what)}.</div><div class="xs mu" style="margin-top:6px">They start at ${signed(m.start)} Conviction.</div>`;
  const pic = m.portrait
    ? `<img class="spr" src="${img(m.portrait)}" alt="${esc(m.boss)}" style="left:76px;top:0;width:234px;height:156px">`
    : `<div class="crest" style="left:110px;top:30px;--s:96px;background:linear-gradient(180deg,${m.colour},#5a0e0e)">${esc(m.crest)}</div>`;
  const results = m.result ? resultView(m) : '';
  return stage(`
  <div class="layer" style="background:radial-gradient(460px 320px at 150px 150px,rgba(123,63,160,.55),transparent 70%),radial-gradient(460px 320px at 810px 150px,rgba(200,40,40,.45),transparent 70%)"></div>
  <div class="a" style="left:-20px;top:284px;width:1000px;height:280px;z-index:1;background:repeating-linear-gradient(90deg,#4a2c18 0 120px,#42271450 120px 122px,#55331d 122px 240px),linear-gradient(180deg,#5a3720,#2e1b0e);border-top:6px solid #e3b955;box-shadow:0 -3px 0 #7a5208,0 -16px 30px rgba(0,0,0,.5)"></div>
  <div class="ttl" style="--t1:#1f8f86;--t2:#2bb3a5" data-testid="dom-debate-title">The Debate <span class="sub">· vs. ${esc(m.boss)}</span></div>
  <div class="keys">${WHEEL_KEY}<span class="key">Round ${esc(m.round.num)}</span><span data-testid="dom-debate-round">${esc(m.round.name)}</span><span class="key">${m.turn}/${m.turns}</span><span class="key"${act('back')} style="cursor:pointer">Esc</span><span>Walk out</span></div>
  <div class="cone" style="left:24px;top:-30px;width:300px;height:330px;z-index:2;--cc:rgba(190,140,255,.38)"></div>
  <div class="cone" style="left:636px;top:-30px;width:300px;height:330px;z-index:2;--cc:rgba(255,120,110,.34)"></div>
  <div class="pool flick" style="left:330px;top:250px;width:300px;height:110px;z-index:2;--pc:rgba(255,200,110,.45)"></div>
  <div class="a" style="left:24px;top:72px;width:300px;height:156px;z-index:5;border-radius:10px;overflow:hidden;background:#120c1c;box-shadow:0 0 0 3px #c9a6ff,0 0 0 6px var(--ink),0 0 26px rgba(166,120,255,.55)">
    <img class="spr" src="${img('v-nate')}" alt="The Boss" style="left:-4px;top:0;width:312px;height:156px"></div>
  <div class="a pill v" style="left:36px;top:214px;z-index:6;font-size:14px">THE BOSS · ${esc(m.myTag)}</div>
  <div class="a" style="left:636px;top:72px;width:300px;height:156px;z-index:5;border-radius:10px;overflow:hidden;background:#0d0d10;box-shadow:0 0 0 3px #ff8a7a,0 0 0 6px var(--ink),0 0 26px rgba(255,90,79,.5)">
    ${pic}</div>
  ${m.mon ? `<img class="spr" src="${img(m.mon)}" alt="" style="left:640px;top:150px;width:92px;height:82px;z-index:6">` : ''}
  <div class="a pill r" style="left:772px;top:214px;z-index:6;font-size:14px">${esc(m.boss.toUpperCase())} · ${esc(m.tag)}</div>
  <div class="pnl gild" style="left:340px;top:72px;width:280px;height:186px;padding:12px 18px" data-testid="dom-debate-verdict">
    <div class="row sp" style="margin-top:2px"><b class="caps" style="font-size:15px;color:var(--ribbon)">Last verdict</b><b class="num y" style="font-size:30px;line-height:.8" data-testid="dom-debate-move">${m.verdict ? signed(m.verdict.move) : '—'}</b></div>
    <div class="col" style="gap:5px;margin-top:8px;font-size:15px">${verdict}</div>
  </div>
  <div class="a" style="left:24px;top:258px;width:912px;z-index:6">
    <div style="position:relative;height:18px;border-radius:6px;background:linear-gradient(90deg,#5a1818,#2a2440 38%,#2a2440 62%,#1c4a2c);box-shadow:0 0 0 3px var(--ink),inset 0 2px 0 rgba(0,0,0,.4)">
      <i class="flow" style="position:absolute;${fill};top:0;bottom:0;background:repeating-linear-gradient(90deg,#ffd23f 0 14px,#ffe98a 14px 28px);box-shadow:0 0 14px #ffd23f;transition:left .5s,width .5s"></i>
      <i style="position:absolute;left:${at(c)}%;top:-6px;width:3px;height:30px;margin-left:-1px;background:#fff;transition:left .5s" data-testid="dom-debate-marker"></i>
      <i style="position:absolute;left:80%;top:-5px;width:3px;height:28px;background:#43cf78"></i>
      <i style="position:absolute;left:62.5%;top:-3px;width:2px;height:24px;background:#9fe8b4;opacity:.7"></i>
      <i style="position:absolute;left:37.5%;top:-3px;width:2px;height:24px;background:#ff9a8f;opacity:.7"></i>
    </div>
  </div>
  <div class="a row" style="left:24px;top:272px;width:912px;z-index:6;justify-content:center"><span class="bnr" style="position:relative;font-size:20px;padding:4px 30px" data-testid="dom-debate-conviction">Conviction ${signed(c)}</span></div>
  <div class="tbox" style="left:24px;top:320px;width:912px;height:92px;padding:16px 22px" data-testid="dom-debate-said"><span class="who">${esc(m.boss.toUpperCase())}</span>“${esc(m.said)}”<span class="more blink">▼</span></div>
  <div class="a" style="left:24px;top:424px;width:640px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;z-index:8">${stances}</div>
  <div class="a" style="left:24px;top:470px;width:640px;height:58px;z-index:8;background:#0b1020;border:3px solid #56679d;border-radius:9px;box-shadow:0 0 0 3px var(--ink);padding:6px 12px;font-size:14.5px;line-height:1.3;color:#e8ecff;${line.used ? 'text-decoration:line-through;opacity:.55' : ''}" data-testid="dom-debate-line">${esc(line.text)}<b class="blink" style="color:var(--gold)">▌</b>${prev}<span class="a xs dm" style="right:10px;bottom:4px">${line.text.length} / 600</span></div>
  <div class="a row" style="left:24px;top:530px;z-index:8;gap:5px;transform:translateY(-6px)">${dots}<span class="xs dm" style="margin-left:4px">Line ${li + 1} of 3 <span class="kc" style="min-width:16px;height:14px;font-size:9px">▲▼</span></span></div>
  <div class="cta shine" style="left:680px;top:424px;width:256px;height:58px;font-size:24px"${act('debArgue')} data-testid="dom-debate-argue">Argue ▶ <span class="kc">Enter</span></div>
  <div class="a xs mu" style="left:680px;top:490px;width:256px;z-index:8;line-height:1.3">No Key-Card? Each stance has 3 set lines with fixed scores. <span class="dm">${esc(m.aims)}.</span></div>
  <div class="crest-rim" style="left:6px;top:58px;--s:44px"></div><div class="crest" style="left:11px;top:63px;--s:44px">${esc(m.myCrest)}</div>
  <div class="crest-rim" style="left:900px;top:58px;--s:44px;filter:drop-shadow(0 4px 0 rgba(0,0,0,.45)) drop-shadow(0 0 12px rgba(255,90,79,.6))"></div><div class="crest" style="left:905px;top:63px;--s:44px;background:linear-gradient(180deg,${m.colour},#b02a20 55%,#5a0e0e)">${esc(m.crest)}</div>
  <div class="a" style="left:110px;top:296px;width:14px;height:24px;z-index:6;background:linear-gradient(90deg,#e9dcc0,#fff6df 40%,#cdbd9a);border-radius:3px;box-shadow:0 0 0 2px #1a0f08"></div>
  <div class="a flick" style="left:109px;top:280px;width:16px;height:20px;z-index:6;border-radius:50% 50% 40% 40%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#fff8d0,#ffd23f 40%,#ff7a1c 75%,transparent);box-shadow:0 0 22px 8px rgba(255,180,60,.45)"></div>
  <div class="a" style="left:836px;top:296px;width:14px;height:24px;z-index:6;background:linear-gradient(90deg,#e9dcc0,#fff6df 40%,#cdbd9a);border-radius:3px;box-shadow:0 0 0 2px #1a0f08"></div>
  <div class="a flick" style="left:835px;top:280px;width:16px;height:20px;z-index:6;border-radius:50% 50% 40% 40%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#fff8d0,#ffd23f 40%,#ff7a1c 75%,transparent);box-shadow:0 0 22px 8px rgba(255,180,60,.45);animation-delay:-1.7s"></div>
  <div class="haze" style="--hz:#ff8a8a;--hz2:#b48cff" aria-hidden="true"></div>
  <div class="grade" aria-hidden="true" style="--g1:#ff8a8a;--g2:#b48cff"></div>
  <div class="focus" aria-hidden="true" style="left:${Math.round(24 + (912 * at(c)) / 100)}px;top:292px;--r:160px;--fc:255,215,90"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#ff8a8a"></div>
  <div class="orn" aria-hidden="true"></div>
  <div class="rays turn finale" aria-hidden="true" style="left:${Math.round(24 + (912 * at(c)) / 100) - 176}px;top:116px;width:352px;height:352px;--rc:rgba(255,215,90,.30)"></div>
  ${results}
  ${m.notice ? `<div class="a" style="left:330px;width:300px;top:86px;z-index:60;background:rgba(10,14,30,.94);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3"${act('dismiss')} data-testid="dom-notice">${esc(m.notice)}</div>` : ''}`, 'background:#140f1e', 'kl-red vign grain', 'l');
}

/** The end of the Debate: the result's banner, what it does, and the Convinced choice (Merger or a loyal Branch). */
function resultView(m: DebateModel): string {
  const r = m.result!;
  const buttons = m.phase === 'choose'
    ? `<div class="row" style="gap:12px;margin-top:12px"><div class="ch on" style="--stripe:#4fa3ff;padding:6px 12px 6px 20px;font-size:16px"${act('debDeal', 'merger')} data-testid="dom-debate-merger">Merger<span class="kc" style="top:6px;right:6px">1</span><div class="sub xs">Their Admins join; their sites are yours</div></div><div class="ch" style="--stripe:#3fcf74;padding:6px 12px 6px 20px;font-size:16px"${act('debDeal', 'branch')} data-testid="dom-debate-branch">Loyal Branch<span class="kc" style="top:6px;right:6px">2</span><div class="sub xs">They keep their name and pay tribute</div></div></div>`
    : `<div class="cta shine" style="position:relative;left:auto;top:auto;margin:14px auto 0;width:220px;height:46px;font-size:20px"${act('debDone')} data-testid="dom-debate-done">Back to HQ <span class="kc">Enter</span></div>`;
  return `<div class="a" style="inset:0;z-index:50;background:rgba(6,4,14,.62)"></div>
  <div class="pnl gild" style="left:250px;top:110px;width:460px;min-height:250px;z-index:51;padding:16px 22px;text-align:center" data-testid="dom-debate-result">
    <div class="row" style="justify-content:center"><span class="bnr" style="position:relative;font-size:28px;padding:4px 34px;${r.good ? '' : 'filter:hue-rotate(-40deg) saturate(1.3)'}" data-testid="dom-debate-word">${esc(r.word)}</span></div>
    <div style="margin-top:10px;font-size:15px;color:var(--ribbon)">${esc(m.boss)} · Conviction ${signed(m.conviction)}</div>
    <div class="sm" style="margin-top:8px;line-height:1.35">${esc(r.text)}</div>
    ${r.outcome.length ? `<div class="sm" style="margin-top:8px;line-height:1.35;color:#ffe28a" data-testid="dom-debate-outcome">${esc(r.outcome.join(' '))}</div>` : ''}
    ${buttons}
  </div>`;
}
