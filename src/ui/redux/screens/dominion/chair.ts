// DOMINION slice D12: the Chair (Evening court), ported from the round-4 mockups (plans/evil-mode-rework/mockups-v4,
// figures c1 a visitor at the Chair, c2 Hand it off, c3 the Tally), plus the Chair settings card in the same skin.
// Plain data in from core/dominion/chairScreens.ts; the controller (scenes/dominion/chairController.ts) keeps the
// cursors. Speed Fast drops the walk-in and the reactions; reduced motion is handled by dominion.css.
// Not here yet: the Q command wheel chip and the round-4 livery classes (sig4, vl4): D26 adds both.

import { monName } from '../../../../core/dominion/crew';
import type { Chip, Face, HandModel, TallyModel, VisitorModel } from '../../../../core/dominion/chairScreens';
import { act, esc, mini, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { warehouseUrl } from './paint';
import { stage } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
export type MonFile = (species: string) => string | null;

/** Anyone at the Chair: a plain png, a Pokémon (`mon:species`) or a trainer atlas, bottom-aligned in a box. */
function figure(look: string, mon: MonFile, box: string, h: number, cls = '', flip = false): string {
  const tr = flip ? 'transform:scaleX(-1);' : '';
  if (look.endsWith('.png')) return `<img class="spr ${cls}" src="${rxUrl(look)}" alt="" style="${box};${tr}object-fit:contain;object-position:bottom">`;
  const inner = look.startsWith('mon:') ? (mon(look.slice(4)) ? mini(mon(look.slice(4))!, h) : '') : tall(look, h);
  return `<div class="a ${cls}" style="${box};${tr}display:flex;align-items:flex-end;justify-content:center">${inner}</div>`;
}

/** A small face for a table row or a crew card. */
function faceImg(look: string, mon: MonFile, size: number): string {
  if (look.endsWith('.png')) return `<img src="${rxUrl(look)}" alt="">`;
  const file = look.startsWith('mon:') ? mon(look.slice(4)) : null;
  return `<span style="display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%">${look.startsWith('mon:') ? (file ? mini(file, size) : '') : tall(look, size * 1.6)}</span>`;
}

function pokemon(species: string | null, mon: MonFile, box: string, cls = '', flip = false): string {
  const file = species ? mon(species) : null;
  if (!file) return '';
  return `<div class="a ${cls}" style="${box};${flip ? 'transform:scaleX(-1);' : ''}display:flex;align-items:flex-end;justify-content:center">${mini(file, 96)}</div>`;
}

/** A line someone says: the card's straight quotes become curly ones; narration stays as it is. */
const said = (t: string): string => (t.startsWith('"') ? `“${esc(t.replace(/^"|"$/g, ''))}”` : esc(t));
const chip = (c: Chip): string => `<span class="fx ${c.cls}">${esc(c.text)}</span>`;
const keysStrip = (t: VisitorModel['top'], extra = ''): string =>
  `<div class="keys" data-testid="dom-chair-top"><span class="key">${esc(t.funds)}</span><span class="key" style="color:#ff9a8f">Heat ${t.heat}</span><span class="key" style="color:#7fe0a0">♥ ${t.regard}</span><span class="key" style="color:#c9a6ff">✊ ${t.dread}</span>${extra}</div>`;
const tagPill = (f: Face, style: string): string =>
  f.tag ? `<div class="a pill ${f.tag === 'grudge' ? 'r' : 'g'}" style="${style};z-index:7;font-size:14px" data-testid="dom-chair-tag">${f.tag === 'grudge' ? 'GRUDGE' : 'FAVOUR'}</div>` : '';

function overlays(key: string, key2: string, focus: string, rays: string, parts: string): string {
  return `<div class="haze" style="--hz:${key};--hz2:${key2}" aria-hidden="true"></div>
  <div class="pts" aria-hidden="true">${parts}</div>
  <div class="grade" aria-hidden="true" style="--g1:${key};--g2:${key2}"></div>
  ${focus}
  <div class="edgeglow" aria-hidden="true" style="--eg:${key}"></div>
  <div class="orn" aria-hidden="true"></div>
  ${rays}`;
}

const EMBERS: [number, number, number, number][] = [[568, 192, -2, 3.7], [579, 192, -4.6, 5.5], [593, 166, 0, 5.7], [581, 216, -4, 3.1], [599, 162, -2, 4.4], [566, 169, -4.7, 3.9]];
const STARS: [number, number, number, number][] = [[531, 62, -3.7, 3.6], [444, 73, -3.9, 3.9], [557, 106, -3.7, 2.9], [490, 155, -0.8, 5.2], [462, 62, -1.1, 3.4], [522, 73, -4.8, 3.9]];

/** The Chair's settings (Chair length, numbers, speed), a card over the screen. */
export function chairOptsCard(o: VisitorModel['opts']): string {
  const rows: [string, string, string, string][] = [
    ['1', 'Chair length', o.length, 'Off skips the Chair. Short brings fewer visitors, Long brings more.'],
    ['2', 'Chair numbers', o.numbers, 'Arrows show which way a number moves. Exact shows how much.'],
    ['3', 'Chair speed', o.speed, 'Fast drops the walk-in and the reactions.'],
  ];
  const keys = ['length', 'numbers', 'speed'];
  return `<div class="a" style="inset:0;background:rgba(6,9,19,.6);z-index:30"></div>
  <div class="pnl gild" style="left:250px;top:120px;width:460px;z-index:31" data-testid="dom-chair-opts"><span class="brk"></span>
    <div class="hd y"><img class="ic" src="${img('g-machine-part')}" alt="">CHAIR SETTINGS</div>
    <div class="col" style="gap:8px">${rows.map(([k, l, v, why], i) => `<div class="row sp" style="padding:6px 10px;border-radius:6px;background:#2b375a"${act('chairOpt', keys[i]!)} data-testid="dom-chair-opt-${keys[i]}"><span><span class="kc" style="margin-right:8px">${k}</span>${l}<br><span class="xs mu">${why}</span></span><b class="y">${esc(v[0]!.toUpperCase() + v.slice(1))}</b></div>`).join('')}</div>
    <div class="row xs mu" style="margin-top:8px;gap:6px"><span class="kc">1</span><span class="kc">2</span><span class="kc">3</span>change<span class="kc">O</span>close</div>
  </div>`;
}

// ---------- c1: a visitor at the Chair ----------

export function visitorView(m: VisitorModel, mon: MonFile, initial: string, notice: string | null, opts: boolean): string {
  const fast = m.opts.speed === 'fast';
  const still = fast ? 'animation:none;' : '';
  const v = m.visitor;
  const answers = m.answers.map((a, i) => {
    const stripe = i === 0 ? '#ef4a3a' : '#7b3fa0';
    const dim = m.result ? 'opacity:.5;' : '';
    return `<div class="ch${a.on && !m.result ? ' on' : ''}" style="--stripe:${stripe};display:flex;flex-direction:column;gap:7px;justify-content:center;${dim}"${act('court', i)} data-over="courtOver" data-testid="dom-chair-a${i}" title="${esc(a.does)}"><span class="kc">${i + 1}</span><span style="font-size:${a.label.length > 26 ? 17 : 21}px;padding-right:26px">${esc(a.label)}</span><div class="row" style="gap:6px;flex-wrap:wrap">${a.chips.map(chip).join('')}</div></div>`;
  }).join('');
  const hand = m.hand.can && !m.result
    ? `<div class="ch${m.hand.on ? ' on' : ''}" style="--stripe:#2bb3a5;display:flex;flex-direction:column;gap:5px;justify-content:center;align-items:flex-start"${act('court', 2)} data-over="courtOver" data-testid="dom-chair-hand"><span class="kc">3</span><span style="font-size:18px">Hand it off</span><span class="xs mu">${m.hand.left} left tonight</span></div>`
    : `<div class="ch" style="--stripe:#3a4466;display:flex;flex-direction:column;gap:5px;justify-content:center;align-items:flex-start;opacity:.45" data-testid="dom-chair-hand"><span style="font-size:18px">Hand it off</span><span class="xs mu">${m.crisis ? 'not for a crisis' : m.hand.left ? 'nobody can' : 'used tonight'}</span></div>`;
  const text = m.result
    ? `<div class="tbox" style="left:16px;top:350px;width:928px;height:78px;padding:12px 22px;font-size:17px;line-height:1.3;${still}" data-testid="dom-chair-result"><span class="who">${esc(v.name.toUpperCase())}</span>${m.result.map(esc).join(' ')}<span class="more row" style="gap:6px;color:#5b6aa0"><span class="kc">Enter</span>next</span></div>`
    : `<div class="tbox" style="left:16px;top:350px;width:928px;height:78px;padding:14px 22px;font-size:${m.ask.length > 110 ? 16 : 19}px;line-height:1.3;${still}" data-testid="dom-chair-ask"><span class="who">${esc(v.name.toUpperCase())}</span>${said(m.ask)}<span class="more blink">▼</span></div>`;
  const react = !fast && m.lead && m.result && m.lead.react
    ? `<div class="a xs" style="left:500px;top:300px;width:200px;z-index:9;text-align:center;color:#ffe2a8;text-shadow:0 2px 0 #000" data-testid="dom-chair-react">${esc(m.lead.react.replace('{mon}', monName(m.lead.species)))}</div>${m.lead.mood === 'happy' ? '<span class="heart" style="left:600px;top:200px">♥</span><span class="heart" style="left:620px;top:190px;animation-delay:-1.1s;font-size:14px">♥</span>' : ''}`
    : '';
  const whisper = m.whisper && !m.result
    ? `${figure(m.whisper.look, mon, 'left:836px;top:100px;width:120px;height:180px;z-index:4', 170, '', true)}
  <div class="bub" style="left:600px;top:68px;width:250px;--tx:206px" data-testid="dom-chair-whisper">${esc(m.whisper.name)}: “${esc(m.whisper.text)}”</div>`
    : m.whisper ? figure(m.whisper.look, mon, 'left:836px;top:100px;width:120px;height:180px;z-index:4', 170, '', true) : '';
  const puffs = fast ? '' : `<div class="puff" style="left:100px;top:150px;width:40px;height:40px;z-index:5;--fc:rgba(230,220,120,.45);--dx:-20px"></div><div class="puff" style="left:160px;top:130px;width:34px;height:34px;z-index:5;--fc:rgba(230,220,120,.4);animation-delay:-1.6s"></div>`;
  const parts = EMBERS.map(([x, y, dl, t], i) => `<i class="pt ember f" style="left:${x}px;top:${y}px;--dl:${dl}s;--t:${t}s;--c:${i % 2 ? '#fff' : '#ff9a7a'}"></i>`).join('');
  const sub = `${m.sub}${m.openHouse ? ' · Open House' : ''}${m.crisis ? ' · Crisis' : ''}`;
  return stage(`<img class="cv" src="${warehouseUrl(false)}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.55) saturate(.8)">
  <div class="layer" style="background:radial-gradient(340px 260px at 250px 200px,rgba(255,90,79,.28),transparent 70%),radial-gradient(360px 280px at 760px 220px,rgba(123,63,160,.4),transparent 70%)"></div>
  <div class="ttl" style="--t1:#1f8f86;--t2:#2bb3a5" data-testid="dom-chair">${esc(m.title)} <span class="sub">· ${esc(sub)}</span></div>
  ${keysStrip(m.top, `<span class="key"${act('chairOpts')}>O</span><span>Settings</span>${m.canClose ? `<span class="key"${act('closeDoors')} data-testid="dom-chair-close">C</span><span>Close doors</span>` : ''}`)}
  <div class="pool flick" style="left:300px;top:200px;width:260px;height:120px;z-index:6;--pc:rgba(255,190,90,.4)"></div>
  <div class="cone" style="left:150px;top:-20px;width:260px;height:320px;z-index:2;--cc:rgba(255,110,100,.25)"></div>
  ${pokemon(m.mon, mon, 'left:90px;top:120px;width:120px;height:110px;z-index:4', fast ? '' : 'float')}
  ${figure(v.look, mon, `left:220px;top:92px;width:88px;height:192px;z-index:4`, 188)}
  <div class="rib" style="left:150px;top:68px;${still}" data-testid="dom-chair-visitor">${esc(v.name.toUpperCase())} <span class="lt">· ${esc(v.role)}</span></div>
  ${tagPill(v, 'left:332px;top:110px')}
  <div class="banner" style="left:468px;top:56px;--w:76px;--h:160px;opacity:.92">${esc(initial)}</div>
  ${m.lead ? pokemon(m.lead.species, mon, 'left:540px;top:198px;width:100px;height:96px;z-index:4', m.lead.mood === 'growl' && !fast ? 'bob' : '', true) : ''}
  ${whisper}
  <div class="a" style="left:-20px;top:268px;width:1000px;height:90px;z-index:5;background:repeating-linear-gradient(90deg,#4a2c18 0 120px,#42271450 120px 122px,#55331d 122px 240px),linear-gradient(180deg,#5a3720,#2e1b0e);border-top:6px solid #e3b955;box-shadow:0 -3px 0 #7a5208,0 -12px 24px rgba(0,0,0,.45)"></div>
  <div class="a" style="left:420px;top:226px;width:16px;height:46px;z-index:6;background:linear-gradient(90deg,#e9dcc0,#fff6df 40%,#cdbd9a);border-radius:3px;box-shadow:0 0 0 2px #1a0f08"></div>
  <div class="a flick" style="left:419px;top:204px;width:18px;height:24px;z-index:6;border-radius:50% 50% 40% 40%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#fff8d0,#ffd23f 40%,#ff7a1c 75%,transparent);box-shadow:0 0 26px 10px rgba(255,180,60,.45)"></div>
  <div class="a" style="left:640px;top:150px;width:200px;height:210px;z-index:7;filter:drop-shadow(0 0 2px #d9bfff) drop-shadow(0 0 14px rgba(166,120,255,.7))" data-testid="dom-chair-seat" title="${esc(m.chair)}">
    <div style="position:absolute;left:28px;top:0;width:144px;height:140px;background:linear-gradient(180deg,#0d0620,#05020c);clip-path:polygon(52px 22px,48px 4px,62px 16px,68px 0,78px 14px,86px 2px,92px 18px,104px 8px,100px 26px,108px 40px,104px 62px,140px 92px,144px 140px,0 140px,4px 92px,40px 62px,36px 40px)"></div>
    <div style="position:absolute;left:0;top:96px;width:200px;height:114px;border-radius:14px 14px 4px 4px;background:linear-gradient(180deg,#3a2458,#22143a);box-shadow:0 0 0 3px var(--ink),inset 0 0 0 3px #5a3a88;display:grid;place-items:center;font:800 54px/1 var(--logo);font-style:italic;color:#c9a6ff;text-shadow:0 0 14px rgba(201,166,255,.8),2px 2px 0 #1a0a30">${esc(initial)}</div>
  </div>
  ${text}
  <div class="a" style="left:16px;top:438px;width:928px;height:88px;display:grid;grid-template-columns:1fr 1fr 168px;gap:12px;z-index:8" data-testid="dom-chair-answers">${answers}${hand}</div>
  ${puffs}
  <div class="bnr" style="left:640px;top:330px;font-size:18px;padding:5px 34px;${still}">${m.result ? 'DONE' : m.crisis ? 'CRISIS, BOSS' : 'YOUR CALL, BOSS'}</div>
  ${react}
  ${overlays('#ff9a7a', '#ffd38a', '<div class="focus" aria-hidden="true" style="left:264px;top:160px;--r:150px;--fc:255,120,100"></div>', fast ? '' : '<div class="rays turn finale" aria-hidden="true" style="left:99px;top:-5px;width:330px;height:330px;--rc:rgba(255,120,100,.30)"></div><i class="glint fg" style="left:346px;top:70px;--g:20px"></i>', parts)}
  ${notice ? `<div class="a" style="left:330px;width:300px;top:120px;z-index:20;background:rgba(10,14,30,.9);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3" data-testid="dom-notice"${act('dismiss')}>${esc(notice)}</div>` : ''}
  ${opts ? chairOptsCard(m.opts) : ''}`, '', 'kl-red vign grain');
}

// ---------- c2: Hand it off ----------

const ROWS = 4;

export function handView(m: HandModel, mon: MonFile, notice: string | null): string {
  const at = Math.max(0, m.rows.findIndex((r) => r.on));
  const start = Math.max(0, Math.min(m.rows.length - ROWS, at - 1));
  const shown = m.rows.slice(start, start + ROWS);
  const rows = shown.map((r, j) => {
    const i = start + j;
    const stripe = r.lean === 'Money' ? '#ef4a3a' : r.lean === 'Regard' ? '#43cf78' : r.lean === 'Dread' ? '#7b3fa0' : '#2bb3a5';
    if (!r.can) {
      return `<div class="ch" style="--stripe:#3a4466;padding:9px 14px 9px 24px;margin-top:${j ? 12 : 0}px;opacity:.45;filter:grayscale(1)" data-testid="dom-hand-${i}">
      <div class="row" style="gap:12px"><span class="face" style="width:46px;height:52px">${faceImg(r.look, mon, 46)}</span>
        <div class="col" style="gap:3px;flex:1"><div class="row sp"><b style="font-size:20px">${esc(r.name)} <span class="sub">· ${esc(r.rank)}</span></b><span class="sm">${esc(r.why ?? '')}</span></div><span class="sm" style="font-weight:500">${r.why === 'named on this card' ? 'Can\'t decide their own case.' : 'Can\'t take this one.'}</span></div></div></div>`;
    }
    const pills = r.traits.map((t, k) => `<span class="pill ${k ? 'b' : 'g'}">${esc(t)}</span>`).join('');
    return `<div class="ch${r.on ? ' on' : ''}" style="--stripe:${stripe};padding:9px 14px 9px 24px;margin-top:${j ? 12 : 0}px"${act('handPick', i)} data-over="handOver" data-testid="dom-hand-${i}">
      <div class="row" style="gap:12px"><span class="face" style="width:46px;height:64px">${faceImg(r.look, mon, 46)}</span>
        <div class="col" style="gap:4px;flex:1;min-width:0">
          <div class="row sp"><b style="font-size:20px"><span class="kc" style="position:static;margin-right:6px">${i + 1}</span>${esc(r.name)} <span class="sub">· ${esc(r.rank)}</span></b><span class="sm">Loyalty ${r.loyalty}</span></div>
          <div class="row" style="gap:6px;font-weight:500;font-size:14.5px;flex-wrap:wrap">${pills}leans <b>${esc(r.lean)}</b>${r.likely ? `: will likely pick “${esc(r.likely)}”` : ''}</div>
          <div class="lean" style="--p:${r.bar}"><i></i></div>
        </div></div></div>`;
  }).join('');
  const onY = 152 + Math.max(0, at - start) * 98;
  return stage(`<img class="cv" src="${warehouseUrl(false)}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.4) saturate(.7) blur(1.5px)">
  <div class="ttl" style="--t1:#1f8f86;--t2:#2bb3a5" data-testid="dom-chair">The Chair <span class="sub">· ${esc(m.sub)}</span></div>
  ${keysStrip(m.top)}
  <div class="cone" style="left:20px;top:40px;width:290px;height:330px;z-index:2;--cc:rgba(255,200,130,.38)"></div>
  <div class="embers" style="left:40px;top:120px;width:240px;height:240px;z-index:6;--ec:#ffe2a8;background-size:240px 120px"></div>
  <div class="a" style="left:40px;top:330px;width:250px;height:50px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,170,80,.55),transparent);z-index:3"></div>
  ${figure(m.visitor.look, mon, 'left:70px;top:150px;width:120px;height:200px;z-index:4', 190)}
  ${pokemon(m.mon, mon, 'left:176px;top:268px;width:100px;height:88px;z-index:5', 'bob')}
  <div class="bub" style="left:30px;top:76px;width:260px;--tx:90px;font-size:${m.ask.length > 90 ? 13 : 15}px">${said(m.ask)}</div>
  <div class="rib" style="left:16px;top:398px;font-size:16px">${esc(m.visitor.name.toUpperCase())} <span class="lt">· ${esc(m.visitor.role)}</span></div>
  <div class="pnl gild" style="left:318px;top:72px;width:626px;height:452px;padding:14px 20px" data-testid="dom-hand"><span class="brk" style="inset:-12px"></span>
    <div class="row sp"><b style="font:800 30px var(--logo);font-style:italic;color:#fff;text-shadow:0 3px 0 #0f4a44">Hand it off</b><span class="pill y">1 per sitting</span></div>
    <div class="sm mu" style="margin:4px 0 12px">${esc(m.label[0])} or ${esc(m.label[1])}? Who decides?</div>
    ${rows}
    <div class="al v" style="position:absolute;left:20px;right:20px;bottom:14px;font-size:14.5px"><img class="ic" src="${img('g-soothe-bell')}" alt=""><span>Their pick counts toward their personality, and they gain <b>Loyalty +2</b>. <span class="kc">Esc</span> back</span></div>
  </div>
  <div class="a" style="left:170px;top:226px;z-index:8;transform:rotate(8deg);background:#f3e8cb;color:#3a2a18;padding:4px 10px 4px 16px;font:700 14px var(--ui);box-shadow:0 0 0 2px #2a1c0c,0 4px 6px rgba(0,0,0,.4);clip-path:polygon(10px 0,100% 0,100% 100%,10px 100%,0 50%)">CASE ${esc(m.sub.toUpperCase())}</div>
  <span class="heart" style="left:220px;top:260px">♥</span><span class="heart" style="left:250px;top:250px;animation-delay:-1.1s;font-size:14px">♥</span>
  ${m.rows[at]?.can ? `<div class="chipf" style="left:850px;top:${onY - 20}px">♥ +2</div>` : ''}
  ${overlays('#ffd9a0', '#ff9ac0', '<div class="focus" aria-hidden="true" style="left:180px;top:260px;--r:150px;--fc:255,205,140"></div>', '', STARS.map(([x, y, dl, t]) => `<i class="pt star f" style="left:${x - 100}px;top:${y + 60}px;--dl:${dl}s;--t:${t}s;--c:#ffd9a0"></i>`).join(''))}
  ${notice ? `<div class="a" style="left:330px;width:300px;top:470px;z-index:20;background:rgba(10,14,30,.9);border:2px solid #8cc0ff;border-radius:8px;padding:6px 10px;font-size:14px" data-testid="dom-notice">${esc(notice)}</div>` : ''}`, '', 'kl-warm vign grain');
}

// ---------- c3: the Tally ----------

export function tallyView(m: TallyModel, mon: MonFile): string {
  const cls = (c: Chip): string => (c.cls === 'dn' ? 'rd' : c.text.startsWith('✊') ? 'vi' : 'gn');
  const rows = m.rows.slice(-6).map((r) => `<div class="trow" data-testid="dom-tally-row"><span class="face">${faceImg(r.face.look, mon, 48)}</span><span><b>${esc(r.face.name)}</b> · ${esc(r.face.role)}${r.face.tag ? ` <span class="pill ${r.face.tag === 'grudge' ? 'r' : 'g'}">${r.face.tag.toUpperCase()}</span>` : ''}</span><span>${esc(r.answer)}</span><span>${r.chips.map(chip).join('') || '<span class="xs mu">nothing yet</span>'}</span></div>`).join('');
  const net = m.net.map((c) => {
    const wk = c.text.endsWith('/wk');
    return `<span class="net ${cls(c)}">${esc(wk ? c.text.slice(0, -3) : c.text)}${wk ? '<small>/wk</small>' : ''}</span>`;
  }).join('') || '<span class="sm mu">Nothing moved tonight.</span>';
  const who = m.lock.split(' ')[0]!.toUpperCase();
  const door = m.back
    ? `<div class="a" style="left:842px;top:150px;width:60px;height:184px;z-index:4;background:#05060e;clip-path:polygon(35% 0,65% 0,72% 14%,66% 24%,92% 34%,100% 100%,0 100%,8% 34%,34% 24%,28% 14%)"></div>
  <div class="a xs" style="left:812px;top:340px;width:120px;text-align:center;z-index:4;color:#9fb2e6;font-style:italic" data-testid="dom-tally-back">Someone will be back…</div>`
    : '';
  const parts = STARS.map(([x, y, dl, t], i) => `<i class="pt star f" style="left:${x}px;top:${y}px;--dl:${dl}s;--t:${t}s;--c:${i % 2 ? '#ffd23f' : '#cfe0ff'}"></i>`).join('');
  return stage(`<img class="cv" src="${warehouseUrl(false)}" alt="" style="position:absolute;inset:0;width:960px;height:540px;filter:brightness(.45) saturate(.75)">
  <div class="layer" style="background:linear-gradient(180deg,rgba(10,8,30,.2),rgba(10,8,30,.6))"></div>
  <div class="ttl" style="--t1:#1f8f86;--t2:#2bb3a5" data-testid="dom-tally">The Tally <span class="sub">· Day ${m.day}</span></div>
  <div class="keys" style="right:96px"><span class="key">☾ Night next</span></div>
  <div class="a" style="left:700px;top:334px;width:300px;height:130px;z-index:2;background:linear-gradient(180deg,rgba(150,180,255,.35),transparent);clip-path:polygon(38% 0,78% 0,100% 100%,0 100%);mix-blend-mode:screen"></div>
  <div class="a" style="left:812px;top:84px;width:120px;height:250px;z-index:3;background:linear-gradient(180deg,#2a3a78,#141c3e);box-shadow:0 0 0 4px #0b0f1e,inset 0 0 40px rgba(120,160,255,.35)"></div>
  <div class="moon" style="left:850px;top:100px;width:44px;height:44px;z-index:3"></div>
  ${door}
  <div class="pnl gild" style="left:24px;top:72px;width:772px;height:356px;padding:14px 20px">
    <div class="row sp"><b style="font:800 28px var(--logo);font-style:italic;color:#fff;text-shadow:0 3px 0 #0f4a44">Tonight at the Chair</b><span class="sm mu">${m.count} visitor${m.count === 1 ? '' : 's'}</span></div>
    <div class="trow hd2"><span></span><span>VISITOR</span><span>YOUR ANSWER</span><span>WHAT CHANGED</span></div>
    <div style="max-height:220px;overflow:hidden">${rows}</div>
    <div class="row" style="position:absolute;left:20px;right:20px;bottom:14px;gap:12px;padding:10px 14px;border-radius:10px;background:rgba(0,0,0,.3);box-shadow:inset 0 0 0 2px rgba(240,207,110,.35)" data-testid="dom-tally-net">
      <b class="caps y" style="font-size:16px">Net</b>${net}
    </div>
  </div>
  <div class="tbox" style="left:24px;top:446px;width:912px;height:80px;padding:16px 22px;font-size:19px"${act('toNight')} data-testid="dom-tally-night"><span class="who">${esc(who)}</span>${esc(m.lock)}<span class="more row" style="gap:6px;color:#5b6aa0"><span class="kc">Enter</span>start the night</span></div>
  <div class="seal" style="left:744px;top:382px;--s:64px;transform:rotate(10deg)">N</div>
  <div class="a" style="left:880px;top:12px;width:60px;height:60px;z-index:31;border-radius:50%;background:radial-gradient(circle,#f3e8cb 60%,#c9b27a);box-shadow:0 0 0 4px #3a2a18,0 0 0 6px #e3b955,0 4px 10px rgba(0,0,0,.5)">
    <i style="position:absolute;left:29px;top:10px;width:3px;height:21px;background:#2a1c0c;border-radius:2px"></i>
    <i class="needle" style="position:absolute;left:29px;top:30px;width:2px;height:22px;margin-top:-22px;transform-origin:50% 100%;background:#c62a2a;animation-duration:60s"></i>
    <i style="position:absolute;left:27px;top:28px;width:6px;height:6px;border-radius:50%;background:#2a1c0c"></i></div>
  ${overlays('#cfe0ff', '#ffd23f', '<div class="focus" aria-hidden="true" style="left:870px;top:216px;--r:110px;--fc:170,205,255"></div>', '<div class="rays turn finale" aria-hidden="true" style="left:749px;top:95px;width:242px;height:242px;--rc:rgba(170,205,255,.30)"></div><i class="glint fg" style="left:930px;top:150px;--g:20px"></i>', parts)}`, '', 'kl-cold vign grain');
}
