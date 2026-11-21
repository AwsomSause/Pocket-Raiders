// DOMINION tutorial and opening (plans/evil-mode-rework/tutorial-mockups, pages a1-e9; Kice 2026-11-21 "build it
// nearly exactly"). Every piece the mockups add: Rotom's tip, the spotlight, the lesson rail, the arrows and numbers,
// the reward card, the cold open, the help choice, the first week's pages and the Replay a lesson page. Plain data in;
// the scene's TutorialController keeps the state. The text is data (src/data/dominion/tutorial.json, trusted HTML with
// <b>); names that come from the run are escaped before they go in.

import { r5CardLesson } from './r50/jobs';
import './tutorial.css';
import { act, esc, TYPE_COLORS } from '../../kit';
import { rxUrl } from '../../assets';
import type { TopModel } from '../../../../core/dominion/screens';
import { TUT, type TutMode } from '../../../../core/dominion/tutorial';
import { stage, topBar, warehouseBack } from './views';
import { pngSrc, tallTeam } from './teamPic';
import { skylineRocketUrl, skylineTutUrl } from './paint';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);

/** Fills {name}, {home}... with escaped run values (the data's own HTML stays). */
export const fill = (t: string, v: Record<string, string> = {}): string => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? esc(v[k]) : m));

const fx = (k: string, a: string): string => `<div class="haze" aria-hidden="true" style="--hz:${k};--hz2:${a}"></div><div class="grade" aria-hidden="true" style="--g1:${k};--g2:${a}"></div><div class="edgeglow" aria-hidden="true" style="--eg:${k}"></div><div class="orn" aria-hidden="true"></div>`;
const keys = (...ks: [string, string][]): string => `<div class="keys">${ks.map(([k, t]) => `<span class="key">${esc(k)}</span><span>${esc(t)}</span>`).join('')}</div>`;
const cta = (label: string, style: string, a = 'tutNext'): string => `<div class="cta shine" style="${style}"${act(a)} data-testid="dom-tut-go">${esc(label)} <span class="kc">Enter</span></div>`;

// ---------- the pieces laid over a page ----------

export interface TipOpts { x: number; y: number; w: number; text: string; lesson?: string; step?: string; key?: string; more?: string }

/** Rotom's tip (the white card with Rotom on its corner). `key` '' hides the Enter chip. */
export function tip(o: TipOpts): string {
  const ls = o.lesson ? `<span class="ls">${esc(o.lesson)}</span>` : '';
  const key = o.key ?? 'Got it';
  const go = key ? `<span>${esc(key)}<span class="kc">Enter</span>${o.more ? `<span class="kc">${esc(o.more)}</span>` : ''}</span>` : '<span></span>';
  const once = `tip-${o.lesson ?? ''}-${o.step ?? ''}-${o.text.length}`.replace(/[^\w-]/g, '');
  return `<div class="tu-tip" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;pointer-events:auto"${act('tutNext')} data-once="${once}" data-testid="dom-tut-tip"><img class="rt" src="${img('p-rotom')}" alt="Rotom"><span class="nm">ROTOM</span>${ls}<div>${o.text}</div><div class="ft"><span>${esc(o.step ?? '')}</span>${go}</div></div>`;
}

export const spot = (x: number, y: number, w: number, h: number, r = 12): string => `<div class="tu-spot" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px" data-testid="dom-tut-spot"></div>`;
export const arw = (x: number, y: number, d: 'down' | 'up' | 'left' | 'right' = 'down'): string => `<div class="tu-arw ${d}" style="left:${x}px;top:${y}px"></div>`;
export const num = (n: number, x: number, y: number): string => `<div class="tu-n" style="left:${x}px;top:${y}px">${n}</div>`;

/** The lesson rail: lesson n of fifteen, the dots, and X to stop tips. */
export function rail(n: number, top: number, stop = true): string {
  const dots = TUT.lessons.map((_, i) => `<i class="${i < n - 1 ? 'd' : i === n - 1 ? 'c' : ''}"></i>`).join('');
  const name = TUT.lessons[n - 1]?.name.toUpperCase() ?? '';
  return `<div class="tu-rail" style="top:${top}px" data-testid="dom-tut-rail"><img src="${img('p-rotom')}" alt="">LESSON ${n} · ${esc(name)}<span class="dots">${dots}</span>${stop ? `<span class="kc">X</span>${esc(TUT.stop)}` : ''}</div>`;
}

/** The list inside a tip (lesson 2's five numbered lines). */
export const tipList = (rows: [string, string][]): string => `<div class="tu-list">${rows.map(([n, t]) => `<div><i>${esc(n)}</i>${t}</div>`).join('')}</div>`;
/** The inline numbers inside a tip (lesson 8). */
export const tipInline = (rows: [string, string][]): string => rows.map(([n, t]) => `<i class="tu-in">${esc(n)}</i>${t} `).join('');

/** The text box of a scene (the New-look event box). */
function tbox(who: string, lines: string[], more: string, b = 24, h = 140): string {
  return `<div class="tbox" style="left:60px;width:840px;bottom:${b}px;min-height:${h}px"${act('tutNext')} data-testid="dom-tut-text">${who ? `<span class="who">${esc(who)}</span>` : ''}${lines.map((l) => `<div>${l}</div>`).join('')}<span class="more">${esc(more)}</span></div>`;
}

/** The gold reward card. Every reward shows only after its text is closed, and stays until Enter. */
export function reward(x: number, y: number, w: number, head: string, items: [string, string, string][], key: string, note = ''): string {
  const rows = items.map(([ic, lb, amt], i) => `<div class="it" style="--i:${i}"><img src="${ic.startsWith('assets/') || ic.startsWith('data:') ? ic : img(ic)}" alt="">${lb}<b>${amt}</b></div>`).join('');
  return `<div class="tu-rw" style="left:${x}px;top:${y}px;width:${w}px" data-once="rw-${esc(head).replace(/[^\w-]/g, '')}" data-testid="dom-tut-reward"><div class="rh">${esc(head)}</div><div class="col" style="gap:8px">${rows}</div>${note ? `<div class="nt">${note}</div>` : ''}
    ${cta(key, 'position:relative;margin:14px auto 0;width:max-content')}</div>`;
}

const letterbox = (cap = '', big = ''): string => `<div class="tu-lb t"></div><div class="tu-lb b"></div>${cap || big ? `<div class="tu-cap">${esc(cap)}<b>${esc(big)}</b></div>` : ''}`;
const typeChip = (t: string): string => `<span class="type" style="--c:${TYPE_COLORS[t[0]!.toUpperCase() + t.slice(1)] ?? '#888'}">${esc(t.toUpperCase())}</span>`;

/** A layer over a built page: its own 960x540 stage so the tip, spotlight and rail sit on top of it. */
export function overlay(inner: string): string {
  return `<div class="dom" style="position:absolute;left:0;top:0;width:960px;height:540px;pointer-events:none;z-index:60" data-testid="dom-tut"><div class="st" style="background:none;pointer-events:none">${inner}</div></div>`;
}

/** The member as drawn on the warehouse floor (Rook by default). */
export function memberPic(m: { look: string; atlas: boolean }, x = 404, y = 266, h = 195): string {
  return `<div class="shd" style="left:${x - 8}px;top:${y + h - 7}px;width:150px;height:22px"></div>${m.atlas ? `<div class="a" style="left:${x}px;top:${y}px;z-index:4">${tallTeam(m.look, h, null)}</div>` : `<img class="spr bob" src="${pngSrc(m.look, null)}" alt="" style="left:${x}px;top:${y}px;width:${Math.round(h * 0.646)}px;height:${h}px;z-index:4">`}`;
}

// ---------- A1: the title's FIRST TIME tag ----------

export function titleTip(): string {
  return overlay(`<div class="tu-new" style="left:226px;top:316px" data-testid="dom-tut-first">${esc(TUT.help.firstTime)}</div>${tip({ x: 352, y: 262, w: 320, text: TUT.help.titleTip, key: '' })}`);
}

// ---------- A2: how much help? ----------

export function helpView(at: number): string {
  const h = TUT.help;
  const rows = h.options.map((o, i) => {
    const on = i === at;
    return `<div class="ch${on ? ' on' : ''}" style="--stripe:${o.stripe};font-size:${on ? 20 : 19}px;padding:14px 16px 14px 26px;cursor:pointer"${act('tutHelp', i)} data-testid="dom-tut-help-${o.id}">${on ? '<span class="brk"></span>' : ''}${esc(o.label)}${o.tag ? `<span class="pill" style="--c:#c25a1a;margin-left:10px">${esc(o.tag)}</span>` : ''}<span class="xs${on ? '' : ' mu'}" style="display:block;font-weight:500;margin-top:4px">${esc(o.line)}</span><span class="kc" style="position:absolute;right:12px;top:14px">${i + 1}</span></div>`;
  }).join('');
  return stage(`<img class="cv" src="${skylineTutUrl()}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.55)">
  <div class="layer" style="background:radial-gradient(circle at 480px 250px,rgba(255,138,61,.18),rgba(6,3,12,.8) 65%)"></div>
  <div class="ttl" style="--t1:#5b34b0;--t2:#c9338f">${esc(h.title)}<span class="sub">${esc(h.sub)}</span></div>
  ${keys(['Esc', 'back'], ['▲▼', 'choose'], ['Enter', 'pick'])}
  <div class="tu-phone" style="left:92px;top:118px"><img class="spr float" src="${img('p-rotom')}" alt="Rotom" style="left:22px;top:30px;width:150px;height:150px"><div class="scr">${h.phone.split('|').map(esc).join('<br>')}</div></div>
  <div class="bub" style="left:66px;top:356px;width:260px;font-size:16px">${esc(h.rotom)}</div>
  <div class="a col" style="left:380px;top:110px;width:540px;gap:14px;z-index:10" data-testid="dom-tut-help">${rows}</div>
  <div class="a xs mu" style="left:380px;top:448px;width:540px;z-index:10">${esc(h.foot)}</div>
  ${fx('#ffb38a', '#c9338f')}`, 'background:#0b0618', 'kl-violet vign grain');
}

// ---------- A3-A6: the cold open and its reward ----------

export function coldView(i: number): string {
  const c = TUT.cold, beat = c.beats[i]!, last = i === c.beats.length - 1;
  const skip = `<div class="a" style="right:24px;top:20px;z-index:37;font:600 14px var(--ui);color:#cfd6f2;pointer-events:auto;cursor:pointer"${act('tutSkip')} data-testid="dom-tut-skip"><span class="kc">Esc</span> ${esc(c.skip)}</div>`;
  const text = tbox('', beat.lines.map(esc), last ? 'Enter ▶' : '▼', 80, beat.paper ? 96 : 110);
  if (beat.id === 'night') {
    return stage(`<img class="cv" src="${skylineTutUrl()}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.7) saturate(.8)">
    <div class="rain" style="left:0;top:0;width:960px;height:540px;right:auto;bottom:auto;opacity:.8"></div>
    <div class="a" style="left:560px;top:250px;width:250px;height:150px;background:linear-gradient(180deg,#1a1430,#0c0818);box-shadow:0 0 0 3px #060913;clip-path:polygon(0 30%,50% 0,100% 30%,100% 100%,0 100%);z-index:3"></div>
    <div class="a blink" style="left:664px;top:330px;width:22px;height:18px;background:#ffd36b;box-shadow:0 0 18px #ffd36b;z-index:4"></div>
    ${letterbox(beat.cap, beat.big)}${skip}${text}${fx('#9fc4ff', '#b48cff')}`, 'background:#070a1c', 'kl-cold vign grain');
  }
  if (beat.paper) {
    const p = beat.paper;
    return stage(`<div class="a" style="inset:0;filter:brightness(.4) saturate(.7) blur(2px)">${warehouseBack()}</div>
    <div class="paper" style="left:250px;top:72px;width:460px;height:300px;padding:12px 20px" data-testid="dom-tut-paper">
      <div style="font:700 40px/1 Cinzel,serif;text-align:center;border-bottom:3px double #231a10;padding-bottom:6px">${esc(p.name)}</div>
      <div class="row sp xs" style="margin:4px 0 10px;font-family:serif">${esc(p.edition)}<span>${esc(p.weather)}</span><span>${esc(p.price)}</span></div>
      <div style="font:700 26px/1.1 serif">${esc(p.head)}</div>
      <div class="row" style="gap:14px;margin-top:10px;align-items:flex-start"><div style="flex:none;width:120px;height:140px;background:#cfc29f;box-shadow:inset 0 0 0 2px #231a10;position:relative;overflow:hidden;filter:grayscale(1) contrast(1.2)"><img class="spr" src="${img('t-giovanni')}" alt="Giovanni" style="left:-6px;top:4px;width:132px;height:170px"></div>
      <div style="font:15px/1.35 serif">${p.body}</div></div></div>
    ${letterbox()}${skip}${text}${fx('#ffd9a0', '#9fc4ff')}`, 'background:#120a05', 'kl-warm vign grain');
  }
  return stage(`<div class="a" style="inset:0;filter:brightness(.55) saturate(.8)">${warehouseBack()}</div>
  <div class="a" style="left:330px;top:300px;width:300px;height:90px;background:linear-gradient(180deg,#6a4a2a,#3a2614);box-shadow:0 0 0 3px #060913;z-index:4"></div>
  <img class="spr" src="${img('g-storage-key')}" alt="" style="left:420px;top:262px;width:48px;height:48px;z-index:5">
  <img class="spr" src="${img('g-letter')}" alt="" style="left:490px;top:266px;width:44px;height:44px;z-index:5;transform:rotate(12deg)">
  <div class="a flick" style="left:330px;top:150px;width:300px;height:300px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,214,140,.22),transparent);mix-blend-mode:screen;z-index:3"></div>
  ${letterbox()}${skip}${text}${fx('#ffd9a0', '#ff8a3d')}`, 'background:#120a05', 'kl-warm vign grain');
}

export function coldRewardView(): string {
  const r = TUT.cold.reward;
  return stage(`<div class="a" style="inset:0;filter:brightness(.35) saturate(.6) blur(2px)">${warehouseBack()}</div>
  <div class="rays4" style="z-index:30"></div>
  ${reward(300, 110, 360, r.head, r.items.map(([a, b, c]) => [a, esc(b), esc(c)]), r.key, r.note ? esc(r.note) : '')}
  ${fx('#ffd23f', '#ff8a3d')}`, 'background:#1a0e05', 'kl-gold vign grain');
}

// ---------- B1-B3: the setup tips (lesson 1) ----------

export function setupTip(page: string, types: number, problem: boolean, stop: boolean): string {
  const s = TUT.setup, ls = `Lesson 1 · ${TUT.lessons[0]!.name}`;
  if (page === 'boss') return overlay(tip({ x: 520, y: 302, w: 400, text: s.boss, lesson: ls, step: '1 of 3' }) + rail(1, 60, stop));
  if (page === 'types' && problem && types === 1) return overlay(arw(748, 128, 'down') + tip({ x: 600, y: 372, w: 330, text: s.typesOne, lesson: ls, step: '2 of 3', key: 'OK' }));
  if (page === 'types') return overlay(spot(612, 88, 316, 266) + tip({ x: 70, y: 400, w: 500, text: s.types, lesson: ls, step: '2 of 3' }) + rail(1, 60, stop));
  if (page === 'member') return overlay(tip({ x: 200, y: 420, w: 480, text: s.member, lesson: ls, step: '3 of 3' }) + rail(1, 60, stop));
  return '';
}

// ---------- C3: the starting kit ----------

export function kitView(member: { look: string; atlas: boolean; name: string; grunt: boolean }): string {
  const k = TUT.kit;
  const note = member.grunt ? esc(k.note) : fill(k.noteAdmin!, { name: member.name });
  return stage(`<div class="a" style="inset:0;filter:brightness(.5) saturate(.7)">${warehouseBack()}</div>${memberPic(member)}
  <div class="rays4" style="z-index:30"></div>
  ${reward(560, 96, 360, k.head, k.items.map(([a, b, c]) => [a, esc(b), esc(c)]), k.key, note)}
  ${fx('#ffd23f', '#ff8a3d')}`, '', 'kl-gold vign grain');
}

// ---------- C4-C10, D3, D7-D10, E2-E5: the lessons laid over a built page ----------

export interface LessonDraw { id: string; lesson: string; step: number; full: boolean; vars: Record<string, string> }

/** The tip, spotlight and rail of one lesson step. Full: everything, the page waits. Tips: the one line only. */
export function lessonOverlay(d: LessonDraw): string {
  const def = TUT.lessons.find((l) => l.id === d.lesson);
  if (!def) return '';
  const n = TUT.lessons.indexOf(def) + 1, ls = `Lesson ${n} · ${def.name}`;
  const steps = def.steps ?? [], st = steps[Math.max(0, d.step)];
  const of = `${Math.max(0, d.step) + 1} of ${Math.max(1, steps.length)}`;
  const text = st ? (st.list ? tipList(st.list as [string, string][]) : st.inline ? tipInline(st.inline as [string, string][]) : fill(st.text ?? '', d.vars)) : '';
  const t = (x: number, y: number, w: number, key?: string, more?: string): string => tip({ x, y, w, text, lesson: ls, step: of, ...(key !== undefined ? { key } : {}), ...(more ? { more } : {}) });
  if (!d.full) return overlay(tip({ x: 590, y: 330, w: 350, text: d.id === 'welcome' ? fill(TUT.welcome.text) : text, lesson: d.id === 'welcome' ? TUT.welcome.title : ls, step: 'any key closes it', key: '' }));
  if (d.id === 'welcome') {
    const w = TUT.welcome;
    return overlay(`<div class="layer" style="background:rgba(5,3,14,.74);z-index:40"></div>
      <img class="spr float" src="${img('p-rotom')}" alt="Rotom" style="left:150px;top:120px;width:190px;height:190px;z-index:46;filter:drop-shadow(0 0 22px rgba(255,150,80,.85))">
      <div class="tu-zap" style="left:120px;top:100px"></div>
      ${tip({ x: 360, y: 150, w: 460, text: w.text, lesson: w.title, step: w.step, key: w.key, more: 'X' })}
      <div class="a" style="left:360px;top:330px;z-index:46;font:600 14px var(--ui);color:#ffd9bf"><span class="kc">X</span> ${esc(w.foot)}</div>`);
  }
  switch (d.lesson) {
    case 'top': return overlay(spot(4, 2, 952, 74, 10) + num(1, 345, 64) + num(2, 495, 64) + num(3, 630, 64) + num(4, 750, 64) + num(5, 880, 64) + rail(2, 470) + t(180, 150, 600));
    case 'orders': return overlay(spot(4, 80, 302, 170) + (d.step === 0 ? arw(314, 110, 'left') : '') + rail(3, 470) + t(350, 110, 400, st?.key));
    case 'steps': return overlay(spot(646, 352, 310, 124) + `<div class="a col" style="left:880px;top:396px;gap:12px;z-index:42"><span class="pill" style="--c:#c9900c">+₽100</span><span class="pill" style="--c:#c9900c">+₽100</span></div>` + rail(4, 104) + t(300, 300, 330));
    case 'tasks': return d.step === 0
      ? overlay(spot(646, 80, 310, 270) + arw(600, 200, 'right') + rail(5, 470) + t(150, 210, 430, st?.key))
      : overlay(spot(292, 92, 636, 76) + t(300, 330, 470, st?.key));
    case 'night': return overlay(rail(6, 470) + t(420, 320, 500, st?.key));
    // Redesign R4 (mockup `lessonjob`): Rotom's coach over the pass-50 Card; the scene draws it inside the page.
    case 'card': return r5CardLesson({ lesson: def.name, n, of: TUT.lessons.length, step: Math.max(0, d.step), steps: steps.length, items: (st?.inline ?? []) as [string, string][] });
    case 'heat': {
      const lad = (def.ladder ?? []).map(([a, b], i) => `<div class="${i === 0 ? 'on' : ''}"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('');
      return overlay(spot(584, 4, 118, 70, 10) + `<div class="tu-ladder" style="left:500px;top:100px">${lad}</div>` + arw(626, 78, 'up') + rail(9, 470) + t(30, 120, 380));
    }
    case 'map': return overlay(spot(42, 120, 136, 66) + rail(10, 300) + t(616, 330, 334));
    case 'wheel': return overlay(rail(11, 470) + t(20, 130, 250));
    case 'menu': return overlay(t(600, 300, 340));
    case 'rivals': return overlay(rail(14, 470) + t(300, 300, 420));
    case 'founding': return overlay(rail(15, 56) + tip({ x: 40, y: 410, w: 460, text, lesson: ls, step: `${Math.max(0, d.step) + 1} of 5` }));
    default: return overlay(t(300, 300, 400));
  }
}

// ---------- C11: the night ----------

export function nightView(top: TopModel, day: string, full: boolean): string {
  const def = TUT.lessons.find((l) => l.id === 'night')!, st = def.steps![0]!;
  const dial = [['MORNING', '0deg', '#ffd23f'], ['DAY', '90deg', '#ffffff'], ['EVENING', '180deg', '#b48cff'], ['NIGHT', '270deg', '#6fa8ff']]
    .map(([w, a, c]) => `<i class="${w === 'NIGHT' ? 'on' : ''}" style="--a:${a};--c:${c}">${w}</i>`).join('');
  return stage(`<img class="cv" src="${skylineTutUrl()}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.6)">${topBar(top)}
  <div class="tu-dial" style="left:70px;top:120px" data-testid="dom-tut-dial">${dial}<b>${esc(day)}</b></div>
  <div class="a col" style="left:420px;top:120px;width:500px;gap:14px;z-index:10">
    <div class="ch on" style="--stripe:#6fa8ff;font-size:20px;padding:14px 16px 14px 26px"${act('tutNext')}><span class="brk"></span>Rest<span class="xs" style="display:block;font-weight:500">Pokémon healed · +1 action tomorrow · Heat cools 3</span></div>
    <div class="ch" style="--stripe:#ff4d63;font-size:19px;padding:14px 16px 14px 26px;opacity:.55">Night action 🔒<span class="xs mu" style="display:block;font-weight:500">Opens on Day 2. Pays more, more Heat.</span></div></div>
  ${full ? rail(6, 470) : ''}
  ${tip({ x: 420, y: 320, w: 500, text: st.text!, lesson: `Lesson 6 · ${def.name}`, step: '1 of 1', key: st.key ?? 'Rest' })}
  ${fx('#6fa8ff', '#b48cff')}`, 'background:#070a1c', 'kl-cold vign grain');
}

// ---------- D1-D2: the first morning and the Rattata ----------

export function giftView(top: TopModel, member: { look: string; atlas: boolean; name: string }, stageNo: 0 | 1, full: boolean): string {
  const g = TUT.rattata, def = TUT.lessons.find((l) => l.id === 'mornings')!, ls = `Lesson 7 · ${def.name}`;
  const back = `${warehouseBack(true)}${topBar(top)}`;
  if (stageNo === 0) {
    return stage(`${back}${memberPic(member, 404, 212)}
    <img class="spr bob" src="${img('p-rattata')}" alt="Rattata" style="left:560px;top:360px;width:56px;height:48px;z-index:5">
    <div class="qmark" style="left:576px;top:310px">!</div>
    ${full ? rail(7, 84) : ''}
    ${tip({ x: 560, y: 140, w: 360, text: def.steps![0]!.text!, lesson: ls, step: '1 of 2', key: '' })}
    ${tbox('MORNING REPORT', g.lines.map((l) => fill(l, { name: member.name })), '▼')}
    ${fx('#ffd23f', '#ff8a3d')}`, '', 'kl-warm vign grain');
  }
  return stage(`${back}<div class="rays4" style="z-index:30"></div>
  <div class="tu-rw" style="left:300px;top:150px;width:360px" data-once="rw-gift" data-testid="dom-tut-reward"><div class="rh">${esc(g.head)}</div><div class="row" style="justify-content:center"><img class="px" src="${img('p-rattata')}" alt="" style="height:110px"></div>
    <div class="row" style="justify-content:center;gap:8px;margin-top:6px"><b style="font-size:22px">RATTATA</b><span class="mu">Lv ${g.level}</span>${typeChip('normal')}</div>
    <div class="it" style="margin-top:10px"><img src="${img('g-ball')}" alt="">${esc(g.sent)} <b style="margin-left:4px;color:#ffd23f">${esc(g.where)}</b></div>
    ${cta('OK', 'position:relative;margin:14px auto 0;width:max-content')}</div>
  ${full ? rail(7, 470) : ''}
  ${tip({ x: 680, y: 230, w: 260, text: fill(def.steps![1]!.text!, { name: member.name }), lesson: ls, step: '2 of 2' })}
  ${fx('#ffd23f', '#ff8a3d')}`, '', 'kl-gold vign grain');
}

// ---------- D6: a First Step done ----------

export function stepView(top: TopModel, steps: { label: string; done: boolean; reward: number; progress: string }[], stamp: string): string {
  const s = TUT.step;
  const rows = steps.map((x) => `<div class="it"${x.done ? '' : ' style="opacity:.7"'}><span class="tu-box${x.done ? ' on' : ''}">${x.done ? '✓' : ''}</span>${esc(x.label)}<b${x.done ? '' : ' class="mu"'}>${x.done ? `+₽${x.reward}` : esc(x.progress)}</b></div>`).join('');
  return stage(`<div class="a" style="inset:0;filter:brightness(.35) blur(2px)">${warehouseBack()}</div>${topBar(top)}
  <div class="rays4" style="z-index:30"></div>
  <div class="tu-rw" style="left:250px;top:110px;width:460px" data-once="rw-step" data-testid="dom-tut-reward"><div class="rh">${esc(s.head)}</div><div class="col" style="gap:8px">${rows}</div>
    <div class="bigstamp" style="position:relative;display:block;width:max-content;margin:14px auto 0;font-size:28px;color:#43cf78">${esc(stamp)}</div>
    ${cta('OK', 'position:relative;margin:18px auto 0;width:max-content')}</div>
  ${fx('#ffd23f', '#43cf78')}`, 'background:#1a0e05', 'kl-gold vign grain');
}

// ---------- D11: the first bills ----------

export function billsView(top: TopModel, member: { look: string; atlas: boolean; name: string }, rows: [string, number][], lines: string[], full: boolean): string {
  const b = TUT.bills, def = TUT.lessons.find((l) => l.id === 'bills')!;
  const total = rows.reduce((n, [, v]) => n + v, 0);
  return stage(`${warehouseBack(true)}${topBar(top)}${memberPic(member, 404, 232)}
  <div class="paper" style="left:620px;top:150px;width:300px;padding:14px 18px;transform:rotate(3deg)" data-testid="dom-tut-bills"><div style="font:700 22px serif;border-bottom:2px solid #231a10">${esc(b.head)}</div>
    ${rows.map(([l, v], i) => `<div class="row sp" style="font:16px serif${i === 0 ? ';margin-top:8px' : ''}">${esc(l)}<b>₽${v.toLocaleString('en-US')}</b></div>`).join('')}
    <div class="row sp" style="font:700 17px serif;border-top:2px solid #231a10;margin-top:6px;padding-top:4px">${esc(b.total)}<b>₽${total.toLocaleString('en-US')}</b></div></div>
  ${full ? rail(13, 84) : ''}
  ${tip({ x: 40, y: 120, w: 360, text: def.steps![0]!.text!, lesson: `Lesson 13 · ${def.name}`, step: '1 of 1', key: '' })}
  ${tbox(b.who, lines, 'Enter ▶')}
  ${fx('#ffd23f', '#ff8a3d')}`, '', 'kl-warm vign grain');
}

// ---------- D12: Rocket notices you ----------

export function rivalView(): string {
  const r = TUT.rival;
  return stage(`<img class="cv" src="${skylineRocketUrl()}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.7)">
  <div class="layer" style="background:radial-gradient(circle at 480px 200px,rgba(194,24,58,.3),rgba(8,2,6,.85) 65%)"></div>
  <img class="spr" src="${img('v-giovanni')}" alt="Giovanni" style="left:340px;top:40px;width:280px;height:300px;z-index:5;filter:brightness(.8) contrast(1.1)">
  <img class="spr" src="${img('p-persian')}" alt="" style="left:560px;top:230px;width:110px;height:100px;z-index:6;filter:brightness(.6)">
  <div class="a" style="left:40px;top:40px;z-index:10;font:700 15px var(--ui);letter-spacing:.3em;color:#ff4d63" data-testid="dom-tut-rival">${esc(r.label)}</div>
  ${tbox(r.who, r.lines.map(esc), 'Enter ▶')}
  ${fx('#ff4d63', '#c2183a')}`, 'background:#0a0410', 'kl-red vign grain');
}

// ---------- D13: the Week 1 Ledger ----------

export interface WeekRows { funds: [number, number]; crew: string; roster: string; mons: number; caught: string[]; heat: [number, number]; steps: number; paid: number }

export function weekView(w: WeekRows, stepsOf: number): string {
  const k = TUT.week, p = (n: number): string => `₽${n.toLocaleString('en-US')}`, sg = (n: number): string => (n >= 0 ? `+${n}` : String(n));
  const df = w.funds[1] - w.funds[0];
  const caught = w.caught.length ? w.caught.map((c) => `+ ${c[0]!.toUpperCase()}${c.slice(1)}`).join(', ') : '—';
  return stage(`<div class="a" style="inset:0;filter:brightness(.3) blur(2px)">${warehouseBack()}</div>
  <div class="ttl" style="--t1:#8a5a08;--t2:#ffd23f">${esc(k.title)}<span class="sub">${esc(k.sub)}</span></div>
  <div class="pnl gild" style="left:40px;top:96px;width:430px;height:300px" data-testid="dom-tut-week"><div class="hd y"><img class="ic" src="${img('g-journal')}" alt="">${esc(k.head)}</div><div class="col" style="gap:7px">
    <div class="chg y"><img class="ic" src="${img('g-amulet-coin')}" alt="">Funds<span style="margin-left:auto">${p(w.funds[0])} → ${p(w.funds[1])}</span><b>${df >= 0 ? '+' : '−'}${p(Math.abs(df))}</b></div>
    <div class="chg up"><img class="ic" src="${img('g-fame-checker')}" alt="">Crew<span style="margin-left:auto">${esc(w.crew)}</span><b>${esc(w.roster)}</b></div>
    <div class="chg up"><img class="ic" src="${img('g-ball')}" alt="">Pokémon<span style="margin-left:auto">${esc(caught)}</span><b>${w.mons}</b></div>
    <div class="chg dn"><img class="ic" src="${img('g-fire-stone')}" alt="">Heat<span style="margin-left:auto">${w.heat[0]}% → ${w.heat[1]}%</span><b>${sg(w.heat[1] - w.heat[0])}</b></div>
    <div class="chg y"><img class="ic" src="${img('g-star-piece')}" alt="">First Steps<span style="margin-left:auto">${w.steps} of ${stepsOf} done</span><b>+${p(w.paid)}</b></div></div></div>
  <div class="pnl glass" style="left:500px;top:96px;width:420px;height:200px"><div class="hd y"><img class="ic" src="${img('g-star-piece')}" alt="">${esc(k.next)}<span class="r">new</span></div><div class="col" style="gap:8px;font-size:17px">
    ${k.nextSteps.map((s) => `<div class="row"><span class="tu-box"></span>${esc(s)}</div>`).join('')}</div></div>
  ${tip({ x: 500, y: 320, w: 420, text: k.tip, key: k.key })}
  ${fx('#ffd23f', '#ff8a3d')}`, 'background:#1a0e05', 'kl-gold vign grain');
}

// ---------- E1: Street Gang ----------

export function gangView(): string {
  const g = TUT.gang;
  const lad = g.ladder.map(([a, b], i) => `<div class="${i === 0 ? 'was' : i === 1 ? 'on' : ''}"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('');
  return stage(`<div class="a" style="inset:0;filter:brightness(.45)">${warehouseBack()}</div>
  <div class="tu-ladder big" style="left:90px;top:80px" data-testid="dom-tut-gang">${lad}</div>
  <div class="bigstamp" style="left:560px;top:120px;color:#ffd23f;font-size:34px">${esc(g.stamp)}</div>
  <div class="sticker pulse" style="left:620px;top:220px;transform:rotate(-6deg)">${esc(g.sticker)}</div>
  ${tbox(g.who, g.lines.map(esc), 'Enter ▶')}
  ${fx('#ffd23f', '#ff4d63')}`, 'background:#1a0e05', 'kl-gold vign grain');
}

// ---------- E7: the team is founded ----------

export function foundedRewardView(top: TopModel, team: string, items: [string, string, string][]): string {
  const f = TUT.founded;
  return stage(`<div class="a" style="inset:0;filter:brightness(.35) blur(2px)">${warehouseBack()}</div>${topBar(top)}
  <div class="rays4" style="z-index:30"></div>
  ${reward(300, 100, 360, fill(f.head, { name: team.toUpperCase() }), items.map(([a, b, c]) => [a, esc(b), esc(c)]), f.key)}
  ${fx('#c9a0ff', '#ffd23f')}`, 'background:#1a0e05', 'kl-gold vign grain');
}

// ---------- E8: Rotom signs off (over the HQ) ----------

export function doneOverlay(team: string): string {
  const d = TUT.done;
  return overlay(`<div class="layer" style="background:rgba(5,3,14,.6);z-index:40"></div>
    <img class="spr float" src="${img('p-rotom')}" alt="Rotom" style="left:120px;top:150px;width:170px;height:170px;z-index:46;filter:drop-shadow(0 0 22px rgba(255,150,80,.85))">
    <div class="bigstamp" style="left:330px;top:110px;color:#ff8a3d;font-size:30px;z-index:46" data-testid="dom-tut-done">${esc(d.stamp)}</div>
    <div class="tu-rail" style="top:470px"><img src="${img('p-rotom')}" alt="">${esc(d.rail)}<span class="dots">${'<i class="d"></i>'.repeat(TUT.lessons.length)}</span></div>
    ${tip({ x: 320, y: 250, w: 520, text: fill(d.text, { team }), key: d.key })}`);
}

// ---------- E9: Replay a lesson (Boss Menu) ----------

export function replayView(at: number, mode: TutMode, done: boolean[]): string {
  const r = TUT.replay;
  const rows = TUT.lessons.map((l, k) => `<div class="ch${k === at ? ' on' : ''}" style="font-size:16px;padding:6px 12px 6px 22px;cursor:pointer"${act('tutReplay', k)} data-over="tutReplayOver" data-testid="dom-tut-lesson-${l.id}">${k === at ? '<span class="brk"></span>' : ''}<span class="mu xs" style="margin-right:8px">${k + 1}</span>${esc(l.name)}${done[k] ? '<span style="position:absolute;right:10px;top:6px" class="gn">✓</span>' : ''}</div>`).join('');
  const seg = r.modes.map(([id, label]) => `<span class="${id === mode ? 'on' : ''}"${act('tutMode', id)} style="cursor:pointer" data-testid="dom-tut-mode-${id}">${esc(label)}</span>`).join('');
  return stage(`<div class="a" style="inset:0;filter:brightness(.25) blur(3px)">${warehouseBack()}</div>
  <div class="ttl" style="--t1:#c25a1a;--t2:#ff8a3d">${esc(r.title)}<span class="sub">${esc(r.sub)}</span></div>${keys(['Esc', 'back'], ['▲▼', 'lesson'], ['◀▶', 'tutorial'], ['Enter', 'play'])}
  <img class="spr float" src="${img('p-rotom')}" alt="Rotom" style="left:40px;top:120px;width:150px;height:150px;z-index:6">
  <div class="a col" style="left:230px;top:90px;width:690px;z-index:10;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(8,auto);grid-auto-flow:column;gap:6px 14px" data-testid="dom-tut-replay">${rows}</div>
  <div class="a row" style="left:230px;top:440px;z-index:10;gap:10px;font-size:16px"><span class="mu">${esc(r.setting)}</span><span class="seg">${seg}</span></div>
  ${fx('#ffb38a', '#c9338f')}`, 'background:#0b0618', 'kl-violet vign grain');
}

/** A replayed lesson: its steps one at a time, over the page it was picked from (drawn only; the run is not changed). */
export function replayOverlay(lesson: string, step: number, vars: Record<string, string>): string {
  const def = TUT.lessons.find((l) => l.id === lesson);
  if (!def) return '';
  const n = TUT.lessons.indexOf(def) + 1;
  const steps = lessonSteps(lesson, vars);
  const text = steps[step] ?? '';
  return overlay(`<div class="layer" style="background:rgba(5,3,14,.6);z-index:40"></div>${rail(n, 470, false)}${tip({ x: 250, y: 170, w: 460, text, lesson: `Lesson ${n} · ${def.name}`, step: `${step + 1} of ${steps.length}`, key: step + 1 < steps.length ? 'Next' : 'Done' })}`);
}

/** Every tip of a lesson as HTML (lesson 1's are the three setup tips; lesson 9 adds its ladder). */
export function lessonSteps(lesson: string, vars: Record<string, string>): string[] {
  if (lesson === 'setup') return [TUT.setup.boss, TUT.setup.types, TUT.setup.member];
  const def = TUT.lessons.find((l) => l.id === lesson);
  const out = (def?.steps ?? []).map((st) => (st.list ? tipList(st.list as [string, string][]) : st.inline ? tipInline(st.inline as [string, string][]) : fill(st.text ?? '', vars)));
  if (def?.ladder) out.push(`<div class="tu-list">${def.ladder.map(([a, b]) => `<div><b>${esc(a)}</b> ${esc(b)}</div>`).join('')}</div>`);
  return out;
}
