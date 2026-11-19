// DOMINION slice D21 screen: the applications desk (Rotom mockup 5, ported from plans/evil-mode-rework/mockups-v4
// #k5: the booth window with the applicant behind glass and the queue in the rain, the paperwork on the desk (ID card,
// Trainer card, team, reference letter, "Why join?"), the Inspect lens with the red string between found mismatches,
// the questions panel, the speech bubble with its tell and the ✦ Rotom chip, and the three stamps).
// Plain data in from core/dominion/desk.ts deskModel; DeskController keeps the cursors and the input.
// The round-4 livery layers (`sig4`, `vl4`) are drawn as in the mockup; their CSS arrives with D26's v4 port.

import type { DeskModel } from '../../../../core/dominion/desk';
import type { DeskField, Verdict } from '../../../../core/dominion/schema';
import { act, esc, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { stage } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

export interface DeskUi {
  mode: 'ask' | 'inspect';
  /** The picked question (the last one is Type…). */
  qAt: number;
  /** The picked field in Inspect mode. */
  fAt: number;
  /** The stamp under the pointer, if any. */
  stampAt: Verdict | null;
}

/** Round-3 mockup passes on k5 (haze, bokeh, raindrops, grade, the spotlight on the applicant, edge glow, two
 * searchlights, gold frame, sunburst, glints) plus the round-4 livery. Decoration only (pointer-events:none in the CSS). */
const OVERLAYS = `<div class="haze" style="--hz:#9fd0ff;--hz2:#ffb38a" aria-hidden="true"></div>
  <div class="bokeh" aria-hidden="true" style="background:radial-gradient(circle 30px at 127px 120px,color-mix(in srgb,#ffb38a 34%,transparent),color-mix(in srgb,#ffb38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 38px at 176px 90px,color-mix(in srgb,#9fd0ff 34%,transparent),color-mix(in srgb,#9fd0ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 29px at 153px 168px,color-mix(in srgb,#ffb38a 34%,transparent),color-mix(in srgb,#ffb38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 37px at 190px 89px,color-mix(in srgb,#9fd0ff 34%,transparent),color-mix(in srgb,#9fd0ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 31px at 856px 445px,color-mix(in srgb,#ffb38a 34%,transparent),color-mix(in srgb,#ffb38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 48px at 743px 72px,color-mix(in srgb,#9fd0ff 34%,transparent),color-mix(in srgb,#9fd0ff 18%,transparent) 70%,transparent 100%),radial-gradient(circle 29px at 12px 120px,color-mix(in srgb,#ffb38a 34%,transparent),color-mix(in srgb,#ffb38a 18%,transparent) 70%,transparent 100%),radial-gradient(circle 39px at 59px 115px,color-mix(in srgb,#9fd0ff 34%,transparent),color-mix(in srgb,#9fd0ff 18%,transparent) 70%,transparent 100%)"></div>
  <div class="pts" aria-hidden="true"><div class="pt-flash" aria-hidden="true"></div><i class="pt drop" style="left:262px;top:287px;--dl:-0.2s;--t:4.4s;--c:#fff"></i><i class="pt drop" style="left:333px;top:212px;--dl:-3.0s;--t:5.8s;--c:#9fd0ff"></i><i class="pt drop" style="left:277px;top:184px;--dl:-3.4s;--t:3.1s;--c:#ffb38a"></i><i class="pt drop" style="left:209px;top:173px;--dl:-5.7s;--t:5.2s;--c:#9fd0ff"></i><i class="pt drop" style="left:102px;top:190px;--dl:-5.9s;--t:2.9s;--c:#fff"></i><i class="pt drop" style="left:133px;top:169px;--dl:-5.2s;--t:2.7s;--c:#ffb38a"></i><i class="pt drop" style="left:178px;top:51px;--dl:-3.5s;--t:5.7s;--c:#fff"></i><i class="pt drop" style="left:126px;top:115px;--dl:-4.0s;--t:5.9s;--c:#9fd0ff"></i></div>
  <div class="grade" aria-hidden="true" style="--g1:#9fd0ff;--g2:#ffb38a"></div>
  <div class="focus" aria-hidden="true" style="left:432px;top:156px;--r:130px;--fc:170,205,255"></div>
  <div class="edgeglow" aria-hidden="true" style="--eg:#9fd0ff"></div><div class="beam sweep" aria-hidden="true" style="left:120px;z-index:1;--a0:-30deg;--a1:14deg;background:linear-gradient(0deg,transparent,#9fd0ff 35%,transparent);opacity:.35"></div><div class="beam sweep b" aria-hidden="true" style="left:780px;z-index:1;--a0:22deg;--a1:-18deg;background:linear-gradient(0deg,transparent,#ffb38a 35%,transparent);opacity:.3"></div>
  <div class="orn" aria-hidden="true"></div>
  <div class="rays turn finale" aria-hidden="true" style="left:289px;top:13px;width:286px;height:286px;--rc:rgba(170,205,255,.30)"></div><i class="glint fg" style="left:503px;top:78px;--g:20px"></i><i class="glint fg" style="left:341px;top:201px;--g:14px;animation-delay:-1.4s"></i>
  <div class="sig4" aria-hidden="true"></div><div class="vl4" aria-hidden="true"></div>`;

/** Where each field sits on the desk: its red "miss" box and the end of the red string. */
const SPOTS: Record<DeskField, { box: [number, number, number, number, number]; pin: [number, number] }> = {
  home: { box: [118, 326, 104, 26, -3], pin: [210, 336] },
  idno: { box: [118, 352, 104, 22, -3], pin: [212, 362] },
  badge: { box: [238, 350, 172, 28, 2], pin: [246, 356] },
  species: { box: [436, 298, 104, 84, -1], pin: [438, 320] },
  levels: { box: [532, 298, 64, 84, -1], pin: [560, 302] },
  stamp: { box: [226, 466, 54, 54, 1], pin: [252, 470] },
};

function person(look: string, h: number, style: string, alt = ''): string {
  const atlas = look.endsWith('.png') ? '' : tall(look, h);
  if (atlas) return `<div class="a" style="${style};display:flex;align-items:flex-end;justify-content:center">${atlas}</div>`;
  return `<img class="spr" src="${look.endsWith('.png') ? rxUrl(look) : img('t-applicant')}" alt="${esc(alt)}" style="${style}">`;
}

function booth(m: DeskModel): string {
  const shadows = [['t-hex', 610, 120, 118, 98, '.35'], ['t-biker', 720, 104, 110, 124, '.3'], ['t-backpacker', 830, 110, 104, 118, '.25']] as const;
  const queue = shadows.map(([f, x, y, w, h, br], i) => {
    const look = m.queue[i];
    if (m.state === 'open' && !look) return '';
    const filter = `filter:brightness(${br}) saturate(.5)`;
    return look ? person(look, h + 10, `left:${x}px;top:${y - 10}px;width:${w}px;height:${h + 10}px;z-index:2;${filter}`) : `<img class="spr" src="${img(f)}" alt="" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:2;${filter};opacity:${m.state === 'open' ? 1 : 0}">`;
  }).join('');
  const who = m.a ? person(m.a.look, 250, 'left:340px;top:22px;width:150px;height:254px;z-index:4', m.a.name) : '';
  return `<div class="a" style="left:0;top:0;width:960px;height:250px;z-index:1;background:linear-gradient(180deg,#141a30,#25304f)"></div>
  <div class="rain" style="left:0;top:0;width:960px;height:250px;right:auto;bottom:auto;z-index:2"></div>
  ${queue}
  <div class="a" style="left:244px;top:34px;width:342px;height:222px;z-index:3;border-radius:6px;background:linear-gradient(180deg,#e3b955,#9a6a10);box-shadow:0 0 0 3px var(--ink),0 0 24px rgba(255,210,63,.35)"></div>
  <div class="a" style="left:250px;top:40px;width:330px;height:210px;z-index:3;background:radial-gradient(260px 180px at 50% 60%,rgba(255,225,160,.35),transparent),linear-gradient(180deg,#3a3326,#2a241b);box-shadow:inset 0 0 0 6px #6a5a40,0 0 0 3px var(--ink)"></div>
  <div data-testid="desk-applicant">${who}</div>
  <div class="a" style="left:250px;top:40px;width:330px;height:210px;z-index:5;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.12) 38%,transparent 46%);box-shadow:inset 0 0 0 6px #6a5a40"></div>
  <div class="a" style="left:0;top:250px;width:960px;height:290px;z-index:5;background:repeating-linear-gradient(0deg,#5a3d24 0 3px,#4e3520 3px 22px),linear-gradient(180deg,#6a4a2c,#3e2a18);box-shadow:0 -6px 0 #2a1a0c,0 -10px 20px rgba(0,0,0,.6)"></div>`;
}

/** The red pen ring around a field: found mismatches always; the Inspect cursor while inspecting. */
function rings(m: DeskModel, ui: DeskUi): string {
  return m.fields.map((f, i) => {
    const [x, y, w, h, rot] = SPOTS[f.id].box;
    const on = ui.mode === 'inspect' && ui.fAt === i;
    if (!f.found && !on) return `<div class="a" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:11;cursor:zoom-in"${act('deskField', i)}></div>`;
    const cur = on ? `outline:3px solid #ff3b5c;outline-offset:3px;box-shadow:0 0 14px rgba(255,59,92,.8);border-radius:6px;` : '';
    return `<div class="${f.found ? 'miss' : 'a'}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${rot}deg);z-index:11;cursor:zoom-in;${cur}"${act('deskField', i)} data-testid="desk-field-${f.id}"${f.found ? ' data-found="1"' : ''}></div>`;
  }).join('');
}

function redString(m: DeskModel): string {
  const pins = m.fields.filter((f) => f.found).map((f) => SPOTS[f.id].pin);
  if (pins.length < 2) return '';
  let d = `M${pins[0]![0]} ${pins[0]![1]}`;
  for (let i = 1; i < pins.length; i++) {
    const [x0, y0] = pins[i - 1]!, [x1, y1] = pins[i]!;
    d += ` C ${x0 + 12} ${Math.min(y0, y1) - 34}, ${x1 - 12} ${Math.min(y0, y1) - 14}, ${x1} ${y1}`;
  }
  const dots = pins.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#ffd23f" stroke="#2a1a0c" stroke-width="2"/>`).join('');
  return `<svg class="a" style="left:0;top:0;z-index:9;pointer-events:none" width="960" height="540" viewBox="0 0 960 540" data-testid="desk-string"><path d="${d}" fill="none" stroke="#e02a2a" stroke-width="3"/>${dots}</svg>`;
}

function lens(m: DeskModel): string {
  const l = m.lens;
  if (!l) return '';
  const size = l.shown.length > 14 ? 13 : l.shown.length > 9 ? 17 : 23;
  const word = l.found ? `<span style="color:#e02a2a;text-decoration:underline wavy #e02a2a">${esc(l.shown)}</span>` : esc(l.shown);
  return `<div class="a" style="left:150px;top:392px;width:100px;height:100px;z-index:14;border-radius:50%;overflow:hidden;background:#f3ecd8;box-shadow:0 0 0 6px #c9a64a,0 0 0 9px var(--ink),0 10px 20px rgba(0,0,0,.6),inset 0 0 20px rgba(0,0,0,.25)" data-testid="desk-lens">
    <div class="a" style="left:4px;right:4px;top:${size > 20 ? 22 : 26}px;font:700 ${size}px var(--ui);color:#241a0c;text-align:center;line-height:1.05;word-break:break-word">${word}</div>
    <div class="a xs" style="left:10px;top:58px;color:${l.found ? '#a01818' : '#3a7a3a'};font-size:11px;line-height:1.1;text-align:center;width:80px">${esc(l.text)}</div>
    <i class="a" style="inset:0;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.55),transparent 35%)"></i></div>
  <div class="a" style="left:232px;top:478px;width:16px;height:50px;z-index:13;border-radius:6px;background:linear-gradient(90deg,#3a2a1c,#7a5a3a,#3a2a1c);transform:rotate(-40deg);transform-origin:50% 0;box-shadow:0 0 0 2px var(--ink)"></div>`;
}

function paperwork(m: DeskModel): string {
  const a = m.a!;
  const dots = a.dots.map((c) => `<i style="width:16px;height:16px;border-radius:50%;background:${c};box-shadow:0 0 0 2px #3a2e1c"></i>`).join('');
  const team = a.team.map((t) => `<div class="row" style="gap:0"><span style="width:96px">${esc(t.name)}</span><span>Lv. ${t.lv}</span></div>`).join('');
  return `<div class="doc" style="left:20px;top:268px;width:200px;height:122px;transform:rotate(-3deg)" data-testid="desk-id"><div class="dh"><img class="ic s" src="${img('g-idcard')}" alt="">ID card</div>
    <div class="row" style="gap:8px;align-items:flex-start"><div style="width:46px;height:58px;flex:none;background:#c8d4e0;border:2px solid #7a6440;position:relative;overflow:hidden">${person(a.look, 84, 'left:-4px;top:2px;width:50px;height:84px')}</div>
    <div class="col" style="font-size:12.5px;gap:1px"><b data-testid="desk-name">${esc(a.name.toUpperCase())}</b><span>Age ${a.age}</span><span>Home: <b data-testid="desk-home">${esc(a.homeShown)}</b></span><span>No. <span data-testid="desk-idno">${esc(a.idNo)}</span></span></div></div></div>
  <div class="doc" style="left:232px;top:282px;width:186px;height:120px;transform:rotate(2deg)" data-testid="desk-card"><div class="dh"><img class="ic s" src="${img('g-badgecard')}" alt="">Trainer card</div>
    <div class="col" style="font-size:12.5px;gap:3px"><span>Badges: <b>${a.badges}</b></span><div class="row" style="gap:4px;min-height:16px">${dots}</div>${a.latest ? `<span><b data-testid="desk-badge">${esc(a.latest)}</b></span><span class="xs" style="color:#7a6440">${esc(a.latestTown ?? '')}</span>` : '<span class="xs" style="color:#7a6440">No badges yet</span>'}</div></div>
  <div class="doc" style="left:430px;top:270px;width:170px;height:118px;transform:rotate(-1deg)" data-testid="desk-team"><div class="dh"><img class="ic s" src="${img('g-ball')}" alt="">Team</div>
    <div class="col" style="font-size:12.5px;gap:2px">${team}</div></div>
  <div class="doc" style="left:24px;top:404px;width:260px;height:122px;transform:rotate(1deg)" data-testid="desk-letter"><div class="dh"><img class="ic s" src="${img('g-letter')}" alt="">Reference letter</div>
    <span style="font-size:12.5px;display:block;padding-right:44px">“${esc(a.quote)}” · <b>${esc(a.writer)}, ${esc(a.wtown)}</b></span>
    <div class="a" style="right:10px;bottom:6px;width:42px;height:42px;border-radius:50%;border:3px solid #2a7de0;color:#2a7de0;display:grid;place-items:center;font:700 11px var(--ui);transform:rotate(-14deg);opacity:.8" data-testid="desk-stamp">${esc(a.stamp)}</div></div>
  <div class="doc" style="left:296px;top:414px;width:190px;height:112px;transform:rotate(-2deg)"><div class="dh"><img class="ic s" src="${img('g-journal')}" alt="">Why join?</div>
    <span style="font-size:12.5px">“${esc(a.reason)}”</span></div>`;
}

function questions(m: DeskModel, ui: DeskUi): string {
  const a = m.a!;
  const pron = 'them';
  const sel = (i: number): string => (ui.mode === 'ask' && ui.qAt === i ? ';box-shadow:0 0 0 2px #ff3b5c,0 0 12px rgba(255,59,92,.7);transform:translateY(-1px)' : '');
  const btns = m.questions.map((q, i) => `<span class="bt" style="font-size:11.5px;padding:2px 6px${q.asked ? ';opacity:.45' : ''}${sel(i)}"${act('deskAsk', i)} data-testid="desk-q-${q.id}">${esc(q.label)}</span>`).join('');
  const typeAt = m.questions.length;
  const pips = Array.from({ length: 5 }, (_, i) => `<i style="width:9px;height:9px;border-radius:50%;background:${i < a.patience ? '#ffd23f' : '#3a3326'};box-shadow:0 0 0 1px #2a1a0c"></i>`).join('');
  const you = m.last ? `You: “${esc(m.last.you)}”` : 'Ask a question, or press Tab to inspect the papers.';
  return `<div class="pnl" style="left:614px;top:262px;width:330px;height:186px;padding:10px 12px" data-testid="desk-questions">
    <div class="hd" style="font-size:14px;margin-bottom:6px;padding-bottom:5px"><img class="ic s" src="${img('g-mic')}" alt="">Question ${pron}<span class="r row" style="gap:3px" title="Patience" data-testid="desk-patience" data-n="${a.patience}">${pips}</span></div>
    <div style="background:#0b1020;border-radius:8px;padding:6px 10px;font-size:14px;box-shadow:0 0 0 2px #56679d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" data-testid="desk-you">${you}</div>
    <div class="row" style="gap:5px;margin-top:6px;flex-wrap:wrap">${btns}<span class="bt" style="font-size:11.5px;padding:2px 6px${sel(typeAt)}"${act('deskAsk', typeAt)} data-testid="desk-q-typed">Type…</span></div>
    <div class="xs dm" style="margin-top:6px;line-height:1.3;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" data-testid="desk-rotom-note">${esc(m.rotomNote)}</div>
  </div>`;
}

function answer(m: DeskModel): string {
  const l = m.last;
  if (!l) return '';
  const think = l.from === 'thinking';
  return `<div class="bub${think ? ' typing' : ''}" style="left:470px;top:66px;width:250px;z-index:20;--tx:24px;font-size:15px" data-testid="desk-reply" data-from="${l.from}">${think ? esc(l.reply) : `“${esc(l.reply)}”`}</div>
  ${think ? '' : `<div class="tell jolt" style="left:494px;top:150px;--tc:${l.tell.c}" data-testid="desk-tell" data-tell="${l.tell.id}">${esc(l.tell.label)}</div>`}
  ${l.chip ? `<div class="aichip" style="left:470px;top:202px" data-testid="desk-chip"><i></i>${esc(l.chip)}</div>` : ''}`;
}

function stamps(m: DeskModel, ui: DeskUi): string {
  const rows: [Verdict, string, string, number][] = [['accept', 'ACCEPT', '#27a356', 620], ['reject', 'REJECT', '#d8402f', 728], ['detain', 'DETAIN', '#7a46e0', 836]];
  return rows.map(([v, label, c, x]) => {
    const up = ui.stampAt === v;
    const dim = v === 'accept' && m.rosterFull ? ';opacity:.55' : '';
    return `<div class="stampb" style="left:${x}px;top:${up ? 404 : 416}px;--sc:${c}${up ? `;filter:drop-shadow(0 0 14px ${c})` : ''}${dim}"${act('deskStamp', v)} data-over="deskStampOver" data-testid="desk-stamp-${v}"><div class="h"></div><div class="f">${label}</div></div>`;
  }).join('') + `<div class="a row xs" style="left:620px;top:526px;z-index:12;gap:12px;color:#e8d8b8"><span><span class="kc" style="height:16px;font-size:10px">A</span> accept</span><span><span class="kc" style="height:16px;font-size:10px">R</span> reject</span><span><span class="kc" style="height:16px;font-size:10px">D</span> detain</span></div>`;
}

function closed(m: DeskModel): string {
  const done = m.doneToday.map((x) => `<div class="row sp"><span>${esc(x.name)}</span><b style="color:${x.verdict === 'accept' ? '#27a356' : x.verdict === 'reject' ? '#d8402f' : '#7a46e0'}">${x.verdict.toUpperCase()}</b></div>`).join('');
  return `<div class="doc" style="left:300px;top:290px;width:360px;height:200px;transform:rotate(-1deg)" data-testid="desk-closed"><div class="dh"><img class="ic s" src="${img('g-journal')}" alt="">The desk</div>
    <div style="font-size:15px;margin-bottom:8px">${esc(m.closedLine)}</div>
    <div class="col" style="gap:3px;font-size:13px">${done}</div></div>`;
}

export function deskView(m: DeskModel, ui: DeskUi, notice: string | null): string {
  const open = m.state === 'open' && m.a;
  const count = m.found ? `<div class="chipf" style="left:150px;top:256px;z-index:12;font-size:12px;background:linear-gradient(180deg,#ffb0a0,#ff5a4f);color:#fff" data-testid="desk-found">${m.found} MISMATCH${m.found === 1 ? '' : 'ES'}</div>` : '';
  const keys = open
    ? `<span class="key"${act('deskInspect')}>Tab</span><span>${ui.mode === 'inspect' ? 'Questions' : 'Inspect'}</span><span class="key"${act('deskType')}>T</span><span>Type</span><span class="key"${act('back')}>Esc</span><span>HQ</span>`
    : `<span class="key"${act('back')}>Esc</span><span>HQ</span>`;
  return stage(`${booth(m)}
  <div class="ttl" style="--t1:#8a6a2a;--t2:#c79a3a">Applications <span class="sub" data-testid="desk-sub">· Day ${m.day}${open ? ` · ${m.place}` : ''}</span></div>
  <div class="keys">${keys}</div>
  ${open ? `${paperwork(m)}${rings(m, ui)}${redString(m)}${count}${lens(m)}${questions(m, ui)}${answer(m)}${stamps(m, ui)}` : closed(m)}
  <div class="pool flick" style="left:20px;top:250px;width:520px;height:260px;z-index:6;--pc:rgba(255,220,150,.18)"></div>
  <div class="puff" style="left:690px;top:140px;width:26px;height:20px;z-index:2"></div>
  ${notice ? `<div class="a" style="left:614px;width:330px;top:214px;z-index:22;background:rgba(10,14,30,.9);border:2px solid #c9a64a;border-radius:8px;padding:6px 10px;font-size:13px;line-height:1.3" data-testid="desk-notice">${esc(notice)}</div>` : ''}
  ${OVERLAYS}`, 'background:#1a1410', 'kl-cold vign grain');
}
