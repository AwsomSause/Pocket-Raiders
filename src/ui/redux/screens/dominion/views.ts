// DOMINION screens in the New look, built to match the redesigned mockups (plans/evil-mode-rework/mockups-redesign):
// mockup 0 (the title card) and mockup 1 (Day 1, the HQ), plus the setup pages and the opening scene in the same skin.
// Plain data in from core/dominion/screens.ts; DominionScene keeps the state and the input. Every button is a tap
// target (data-act) with a key path. Later slices add their screens beside this file and reuse `stage`, `topBar`, `tabs`.

import './dominion.css';
import type { HqModel, SetupDraft, TopModel } from '../../../../core/dominion/screens';
import type { TeamColours } from '../../../../core/dominion/founding';
import { pngSrc, tallTeam } from './teamPic';
import { act, esc, mini, tall, TYPE_COLORS } from '../../kit';
import { rxUrl } from '../../assets';
import { grainUrl, skylineUrl, warehouseUrl } from './paint';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const cap = (t: string): string => t[0]!.toUpperCase() + t.slice(1);

/** The 960x540 stage every Dominion screen draws on (the mockups' `.st`, with the vignette and grain). */
export function stage(inner: string, style = '', cls = 'vign grain'): string {
  return `<div class="dom" style="position:absolute;left:0;top:0;width:960px;height:540px;--noise:url(${grainUrl()})"><div class="st ${cls}" style="${style}">${inner}</div></div>`;
}

/** D7: the mark's outline for each logo (the emblem on the top bar, the door, the title tower). */
const LOGO_CLIP: Record<string, string> = {
  shield: 'polygon(0 0,100% 0,100% 70%,50% 100%,0 70%)',
  diamond: 'polygon(50% 0,100% 50%,50% 100%,0 50%)',
  ring: 'circle(50% at 50% 50%)',
  fang: 'polygon(0 0,100% 0,100% 30%,62% 100%,50% 62%,38% 100%,0 30%)',
  star: 'polygon(50% 0,63% 34%,100% 36%,71% 58%,81% 100%,50% 76%,19% 100%,29% 58%,0 36%,37% 34%)',
  eye: 'ellipse(50% 36% at 50% 50%)',
};

/** The team's emblem in its colours (Part 9 A15): the mark filled with the primary, the initial in the secondary. */
export function emblem(c: TeamColours | null, w: number, h: number, fs: number, extra = ''): string {
  if (!c) return `<div class="emb" style="width:${w}px;height:${h}px;font-size:${fs}px;${extra}" data-testid="dom-emblem"></div>`;
  return `<div class="emb" style="width:${w}px;height:${h}px;font-size:${fs}px;clip-path:${LOGO_CLIP[c.logo] ?? LOGO_CLIP.shield};background:linear-gradient(180deg,color-mix(in srgb,${c.primary} 75%,#fff),${c.primary} 55%,color-mix(in srgb,${c.primary} 60%,#000));color:${c.secondary};text-shadow:0 2px 0 rgba(0,0,0,.45);${extra}" data-testid="dom-emblem">${esc(c.initial)}</div>`;
}

/** A small armband chip for a member's card: the team's band (primary, letter in secondary) or the plain grey one. */
export function bandChip(c: TeamColours | null, label: string): string {
  const band = c
    ? `<i style="width:30px;height:12px;border-radius:3px;display:grid;place-items:center;font:800 9px/1 var(--logo);font-style:normal;color:${c.secondary};background:linear-gradient(180deg,color-mix(in srgb,${c.primary} 80%,#fff),${c.primary});box-shadow:0 0 0 2px var(--ink),inset 0 0 0 1px ${c.secondary}">${esc(c.initial)}</i>`
    : '<i style="width:30px;height:12px;border-radius:3px;background:linear-gradient(180deg,#9aa0b0,#6a7080);box-shadow:0 0 0 2px var(--ink)"></i>';
  return `<span class="row xs" style="gap:5px;color:${c ? '#d4b8ff' : '#b2bde6'}" data-testid="dom-band">${band}${esc(label)}</span>`;
}

/** The top bar on every Dominion screen (Part 6 §2; mockup 1). */
export function topBar(t: TopModel): string {
  const ph = `color:${t.phaseColour};text-shadow:0 0 10px ${t.phaseColour}99`;
  return `<div class="top" data-testid="dom-top">
    <div class="team">${emblem(t.colours, 46, 40, 30)}<div><div class="nm" data-testid="dom-team">${esc(t.team)}</div><div class="s">${esc(t.sub)}</div></div></div>
    <div><img class="ic l" src="${img('g-calendar')}" alt=""><div><span class="l" data-testid="dom-day">${esc(t.day)}</span><span class="v" style="${ph}" data-testid="dom-phase">${esc(t.phaseWord)}</span></div></div>
    <div><img class="ic l" src="${img('g-amulet-coin')}" alt=""><div><span class="l">FUNDS</span><span class="v y" data-testid="dom-funds">${esc(t.funds)}</span></div></div>
    <div><img class="ic l" src="${img('g-fire-stone')}" alt=""><div><span class="l">HEAT</span><span class="v rd" data-testid="dom-heat">${esc(t.heat)}</span></div></div>
    <div><img class="ic l" src="${img('g-fame-checker')}" alt=""><div><span class="l">ROSTER</span><span class="v" data-testid="dom-roster">${esc(t.roster)}</span></div></div>
    <div style="flex:1"><img class="ic l" src="${img('g-town-map')}" alt=""><div><span class="l">REGION:</span><span class="v cy">${esc(t.region)}</span></div></div>
  </div>`;
}

const TABS: [string, string][] = [['g-card-key', 'HQ'], ['g-town-map', 'REGION MAP'], ['g-fame-checker', 'ROSTER'], ['g-ball', 'POKÉMON'], ['g-machine-part', 'OPERATIONS'], ['g-journal', 'LEDGER']];

/** The six tabs (keys 1-6). Tabs whose slice isn't built yet are dimmed and say so on a press. */
export function tabs(on: number, open: readonly number[] = [0]): string {
  return `<div class="tabs">${TABS.map(([ic, name], i) => {
    const locked = !open.includes(i);
    return `<div class="${i === on ? 'on' : ''}"${act('tab', i)} data-testid="dom-tab-${i + 1}" style="${locked ? 'opacity:.55;filter:saturate(.4)' : ''}"><img class="ic" src="${img(ic)}" alt="">${name}<span class="k">${i + 1}</span></div>`;
  }).join('')}</div>`;
}

// ---------- mockup 0: the title card ----------

export interface TitleModel { at: number; started: boolean; cont: string | null; colours?: TeamColours | null }

export function titleView(m: TitleModel): string {
  const rows = [
    { label: 'New run', sub: 'Start with one Grunt and a warehouse', on: !m.started, stripe: '#ff3d8a' },
    { label: 'Continue', sub: m.cont ?? 'No Dominion yet', on: m.started, stripe: '#a678ff' },
  ];
  const menu = rows.map((r, i) => {
    const sel = i === m.at;
    return `<div class="ch${sel ? ' on' : ''}" style="--stripe:${r.stripe};font-size:${sel ? 20 : 18}px;${r.on ? '' : 'opacity:.5'}"${act('title', i)} data-testid="dom-title-${i}">${sel ? '<span class="brk"></span><span class="kc" style="position:absolute;right:10px;top:10px">Enter</span>▶ ' : ''}${r.label}<div class="sub">${esc(r.sub)}</div></div>`;
  }).join('');
  return stage(`<img class="cv" src="${skylineUrl()}" alt="" style="position:absolute;inset:0;width:960px;height:540px">
  <div class="stars twinkle" style="height:240px"></div>
  <div class="moon" style="left:604px;top:30px;width:96px;height:96px"></div>
  <div class="beam sweep" style="left:150px;--a0:-30deg;--a1:12deg;transform:rotate(-12deg)"></div>
  <div class="beam sweep b" style="left:820px;--a0:18deg;--a1:-22deg;transform:rotate(14deg)"></div>
  <div class="a" style="left:832px;top:112px;width:78px;height:440px;background:linear-gradient(90deg,#120a26,#24154a 60%,#0c0619);box-shadow:0 0 0 2px #070312"></div>
  <div class="a" style="left:868px;top:66px;width:6px;height:50px;background:#120a26"></div>
  <div class="a blink" style="left:867px;top:60px;width:8px;height:8px;background:#ff3b3b;box-shadow:0 0 10px #ff3b3b"></div>
  <div class="a flick" style="left:842px;top:130px;width:58px;height:58px;display:grid;place-items:center;font:800 42px/1 var(--logo);font-style:italic;color:#ff4f9a;border:3px solid #ff4f9a;border-radius:8px;text-shadow:0 0 12px #ff3d8a,0 0 26px #ff3d8a;box-shadow:0 0 16px #ff3d8a,inset 0 0 12px rgba(255,61,138,.6)${m.colours ? `;color:${m.colours.secondary};border-color:${m.colours.primary};text-shadow:0 0 12px ${m.colours.primary},0 0 26px ${m.colours.primary};box-shadow:0 0 16px ${m.colours.primary},inset 0 0 12px ${m.colours.primary}` : ''}" data-testid="dom-tower">${m.colours ? esc(m.colours.initial) : 'D'}</div>
  <div class="a" style="left:430px;bottom:0;width:400px;height:360px;z-index:3;filter:drop-shadow(0 0 2px #d9bfff) drop-shadow(0 0 18px rgba(166,120,255,.75))">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,#0d0620,#05020c 40%);clip-path:polygon(150px 40px,140px 10px,170px 30px,178px 0,198px 26px,214px 2px,226px 30px,252px 12px,246px 44px,262px 60px,256px 92px,240px 132px,264px 122px,302px 94px,292px 150px,350px 180px,386px 232px,398px 360px,2px 360px,14px 232px,50px 180px,108px 150px,98px 94px,136px 122px,160px 132px,144px 92px,138px 60px)"></div>
  </div>
  <div class="a" style="left:0;right:0;bottom:0;height:120px;background:linear-gradient(180deg,transparent,rgba(10,4,24,.9));z-index:2"></div>
  <div class="rays turn" style="left:-40px;top:-60px;width:720px;height:520px;z-index:4;--rc:rgba(200,160,255,.22)"></div>
  <div class="a" style="left:54px;top:86px;z-index:10">
    <div style="font:700 18px var(--ui);letter-spacing:.32em;color:var(--gold);text-shadow:0 2px 0 #4a2c00;display:flex;align-items:center;gap:12px"><i style="width:34px;height:4px;background:linear-gradient(90deg,transparent,#ffd23f)"></i>POCKET RAIDERS · EVIL MODE<i style="width:34px;height:4px;background:linear-gradient(90deg,#ffd23f,transparent)"></i></div>
    <div data-testid="dom-logo" style="display:flex;align-items:center;font:800 104px/1 var(--logo);font-style:italic;letter-spacing:-.01em;margin-top:6px;color:#fff;background:linear-gradient(180deg,#ffffff 35%,#e2d2ff 60%,#b38cff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(5px 5px 0 #3b1a7a) drop-shadow(0 0 2px #2a1060) drop-shadow(0 0 22px rgba(166,120,255,.6))">D<span style="display:inline-block;width:78px;height:78px;margin:0 2px 0 -2px;border-radius:50%;background:linear-gradient(180deg,#ff4f6a 0 46%,#151018 46% 54%,#f4f1ff 54%);box-shadow:inset -8px -8px 0 rgba(0,0,0,.18),0 0 0 4px #151018;position:relative;transform:translateY(4px)"><i style="position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px;border-radius:50%;background:#f4f1ff;box-shadow:0 0 0 5px #151018,0 0 14px #fff"></i></span>MINION</div>
    <div style="font:700 30px var(--ui);color:#efe6ff;margin-top:8px;letter-spacing:.03em;text-shadow:0 3px 0 #2a1060">Build. Conquer. Rule.</div><div style="margin-top:6px;width:330px;height:6px;background:linear-gradient(90deg,#ffd23f,#ff3d8a 60%,transparent);border-radius:3px;box-shadow:0 0 12px rgba(255,61,138,.6)"></div>
  </div>
  <div class="a col" style="left:54px;top:330px;width:290px;gap:12px;z-index:10">${menu}</div>
  <div class="a" style="right:40px;top:372px;z-index:10;text-align:right;font:700 25px/1.35 var(--ui);color:#f3eaff;text-shadow:0 3px 0 #1a0838">“From a single grunt...<br><span style="color:#ff5fa2;text-shadow:0 0 14px rgba(255,61,138,.7)">to a global empire.”</span></div>
  <div class="a" style="right:40px;bottom:26px;z-index:10;font:500 17px var(--ui);color:#cdb8ff">It's not just a game... <span class="mg">it's a takeover.</span></div>
  <div class="embers" style="left:0;top:280px;width:960px;height:260px;z-index:9;--ec:#ff8fd0;opacity:.8"></div>
  <div class="glint" style="left:236px;top:128px;--g:26px"></div>
  <div class="glint" style="left:684px;top:40px;--g:16px;animation-delay:-1.4s"></div>
  <div class="glint" style="left:150px;top:350px;--g:14px;animation-delay:-2.2s"></div>
  <img class="spr cross" src="${img('p-golbat')}" alt="" style="left:520px;top:60px;width:70px;height:55px;z-index:2;filter:brightness(0) drop-shadow(0 0 2px #b38cff);--x:260px">
  <div class="a blink" style="left:54px;top:488px;z-index:10;font:700 16px var(--ui);letter-spacing:.24em;color:#ffe98a;text-shadow:0 0 10px rgba(255,210,63,.8)">PRESS ENTER</div>
  <div class="sticker pulse" style="left:470px;top:200px;transform:rotate(-8deg)">EVIL MODE!</div>`, 'background:#12082a');
}

// ---------- setup pages (Part 1 §1.1, Part 7 §1.1) ----------

export interface SetupFiles {
  boss: { name: string; file: string | null };
  starters: { name: string; file: string | null; level: number }[];
  types: { allowed: string[]; banned: string[]; bannedLine: string; hint: string[] };
  grunt: { name: string; pitch: string; facts: string[] };
  admin: { pitch: string; facts: string[]; looks: { file: string; name: string; cls: string }[] };
}

const typeChip = (t: string, extra = ''): string => `<span class="type" style="--c:${TYPE_COLORS[cap(t)] ?? '#888'};${extra}">${cap(t).toUpperCase()}</span>`;

function warehouseBack(morning = false): string {
  return `<img class="cv" src="${warehouseUrl(morning)}" alt="" style="position:absolute;inset:0;width:960px;height:540px">
  <div class="rain" style="left:40px;top:192px;width:268px;height:176px;right:auto;bottom:auto;opacity:.9"></div>
  <div class="rain" style="left:304px;top:16px;width:376px;height:62px;right:auto;bottom:auto"></div>`;
}

export function setupView(d: SetupDraft, f: SetupFiles): string {
  const pages = ['THE BOSS', 'THE COLOURS OF THE TEAM', 'THE FIRST MEMBER'];
  const pi = d.page === 'boss' ? 0 : d.page === 'types' ? 1 : 2;
  const head = `<div class="ttl" style="--t1:#5b34b0;--t2:#c9338f">NEW RUN<span class="sub">· ${pages[pi]} · ${pi + 1} of 3</span></div>
    <div class="keys"><span class="key">Esc</span>back<span class="key">Enter</span>next</div>`;
  let body = '';
  if (d.page === 'boss') {
    body = `<div class="pnl glass" style="left:40px;top:96px;width:420px;height:330px" data-testid="dom-setup-boss">
        <div class="hd y"><img class="ic" src="${img('g-member-card')}" alt="">THE BOSS</div>
        <div class="row" style="gap:16px;align-items:flex-end;height:200px;justify-content:center">${f.boss.file ? tall(f.boss.file, 190) : ''}</div>
        <div class="col" style="gap:4px;margin-top:8px"><b style="font-size:24px">${esc(f.boss.name)}</b><span class="mu sm">You. You fight your own battles. The Boss never wears the uniform.</span></div>
      </div>
      <div class="pnl glass" style="left:490px;top:96px;width:430px;height:330px">
        <div class="hd"><img class="ic" src="${img('g-ball')}" alt="">YOUR THREE POKÉMON</div>
        <div class="row" style="gap:10px;justify-content:space-around">${f.starters.map((s) => `<div class="col" style="align-items:center;gap:4px;width:126px">${s.file ? mini(s.file, 110) : ''}<b>${esc(s.name)}</b><span class="mu sm">Lv ${s.level}</span></div>`).join('')}</div>
        <div class="mu sm" style="margin-top:14px;line-height:1.4">The starter you picked, and the other two that were offered. The Boss has no type rule: any Pokémon under the level cap.</div>
      </div>`;
  } else if (d.page === 'types') {
    const grid = [...f.types.allowed, ...f.types.banned].map((t, i) => {
      const banned = f.types.banned.includes(t), picked = d.types.includes(t), sel = i === d.at;
      return `<div class="row" style="justify-content:center;padding:6px;border-radius:8px;${sel ? 'box-shadow:0 0 0 3px #ffd23f,0 0 14px rgba(255,210,63,.5);' : ''}${picked ? 'background:rgba(255,210,63,.18);' : ''}${banned ? 'opacity:.4;filter:grayscale(.8);' : ''}"${act('type', i)} data-over="typeOver" data-testid="dom-type-${t}">${typeChip(t, 'width:112px;justify-content:center')}${picked ? '<b class="y" style="margin-left:-4px">✓</b>' : ''}</div>`;
    }).join('');
    body = `<div class="pnl glass" style="left:40px;top:96px;width:560px;height:380px" data-testid="dom-setup-types">
        <div class="hd y"><img class="ic" src="${img('g-star-piece')}" alt="">PICK TWO TEAM TYPES<span class="r">${d.types.length} of 2</span></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${grid}</div>
      </div>
      <div class="pnl glass" style="left:620px;top:96px;width:300px;height:380px">
        <div class="hd"><img class="ic" src="${img('g-letter')}" alt="">THE RULE</div>
        <div class="col sm" style="gap:8px;line-height:1.35">
          <div>Every Grunt's Pokémon must have one of your two types. Admins and Executives get one Ace of any type. The Boss has no rule.</div>
          <div class="row" style="gap:6px;min-height:28px">${d.types.map((t) => typeChip(t)).join('') || '<span class="mu">None picked yet</span>'}</div>
          <div class="mu xs" style="line-height:1.4">${f.types.hint.map(esc).join('<br>')}</div>
          ${d.problem ? `<div class="rd b7" data-testid="dom-problem">${esc(d.problem)}</div>` : `<div class="mu xs">Dragon and Fairy can't be picked.</div>`}
        </div>
      </div>`;
  } else {
    const card = (i: 0 | 1): string => {
      const grunt = i === 0, on = (d.member === 'grunt') === grunt;
      const look = f.admin.looks[d.look] ?? f.admin.looks[0]!;
      const pic = grunt ? `<img class="px" src="${img('c-rook0')}" alt="" style="width:84px;height:130px">` : tall(look.file, 130);
      const facts = (grunt ? f.grunt.facts : f.admin.facts).map((x) => `<div>· ${esc(x)}</div>`).join('');
      return `<div class="pnl ${on ? 'gild' : 'glass dim'}" style="left:${grunt ? 40 : 490}px;top:96px;width:430px;height:350px"${act('member', i)} data-testid="dom-member-${grunt ? 'grunt' : 'admin'}">
        ${on ? '<span class="brk"></span>' : ''}<div class="hd ${on ? 'y' : ''}">${grunt ? 'A GRUNT' : 'AN ADMIN'}<span class="r">${grunt ? esc(f.grunt.name) : `${esc(look.name)} · ${esc(look.cls)}`}</span></div>
        <div class="row" style="gap:14px;align-items:flex-end"><div style="width:120px;height:140px;display:flex;align-items:flex-end;justify-content:center">${pic}</div>
          <div class="col sm" style="gap:4px;line-height:1.3">${facts}</div></div>
        <div style="margin-top:12px;font-style:italic;color:#efe6ff">“${esc(grunt ? f.grunt.pitch : f.admin.pitch)}”</div>
        ${!grunt && on ? `<div class="row xs mu" style="margin-top:10px;gap:6px"><span class="kc">◀</span><span class="kc">▶</span>another Admin (${d.look + 1} of ${f.admin.looks.length})</div>` : ''}
      </div>`;
    };
    body = card(0) + card(1) + (d.problem ? `<div class="a rd b7" style="left:40px;top:458px;z-index:9">${esc(d.problem)}</div>` : '');
  }
  const next = d.page === 'member' ? 'Begin' : 'Next';
  return stage(`${warehouseBack()}<div class="a" style="inset:0;background:rgba(6,9,19,.55);z-index:4"></div>${head}${body}
    <div class="cta shine" style="right:40px;bottom:30px"${act('next')} data-testid="dom-next">${next} ▶ <span class="kc">Enter</span></div>`);
}

// ---------- the opening scene (Part 1 §1.3) ----------

export function openingView(lines: string[], shown: number, member: { look: string; atlas: boolean }): string {
  const text = lines.slice(0, shown).map((l) => `<div>${esc(l)}</div>`).join('');
  const pic = member.atlas ? `<div class="a" style="left:404px;top:266px;z-index:4">${tallTeam(member.look, 195, null)}</div>` : `<img class="spr bob" src="${pngSrc(member.look, null)}" alt="" style="left:404px;top:266px;width:126px;height:195px;z-index:4">`;
  return stage(`${warehouseBack()}
    <div class="cone flick" style="left:330px;top:70px;width:300px;height:400px;z-index:2;--cc:rgba(255,214,140,.30)"></div>
    <div class="shd" style="left:396px;top:454px;width:150px;height:22px"></div>${pic}
    <div class="tbox" style="left:60px;right:60px;bottom:24px;min-height:140px" data-testid="dom-opening"${act('more')}><span class="who">THE WAREHOUSE</span>${text}<span class="more">${shown < lines.length ? '▼' : 'Enter ▶'}</span></div>`);
}

// ---------- mockup 1: the HQ ----------

export function hqView(m: HqModel, notice: string | null, at: number, member: { look: string; atlas: boolean }): string {
  const sel = 'background:linear-gradient(90deg,#3a5a9e,#2a3f72);border-radius:6px;padding:5px 8px;box-shadow:0 0 0 2px #8cc0ff,0 0 14px rgba(79,163,255,.45)';
  let left = '';
  if (m.panel === 'orders') {
    const rows = m.orders.map((o, i) => `<div style="${i === at ? sel : 'padding:4px 8px 4px 26px'}"${act('order', i)} data-over="orderOver" data-testid="dom-order-${o.id}">${i === at ? '▶ ' : ''}${esc(o.label)}${o.planned && m.phase === 'evening' ? ' <b class="y">✓</b>' : ''}</div>`).join('');
    left = `<div class="pnl glass" style="left:10px;top:86px;width:290px;height:158px" data-testid="dom-orders"><span class="tape" style="left:-14px;top:-8px;transform:rotate(-24deg)"></span><span class="tape" style="right:-16px;top:-6px;transform:rotate(18deg)"></span>
      <div class="hd"><img class="ic" src="${img('g-letter')}" alt="">TODAY'S ORDERS</div>
      <div class="col" style="gap:4px;font-size:18px">${rows || `<div class="mu sm" style="padding:4px 8px">${esc(m.ordersNote)}</div>`}</div>
    </div>
    <div class="a row" style="left:12px;top:256px;z-index:8;gap:6px;font:600 13px var(--ui);color:#dfe5ff">${m.orders.length ? `<span class="kc">Enter</span>${m.phase === 'day' ? 'do the order' : 'plan the order'} · ` : ''}<span data-testid="dom-orders-note">${esc(m.ordersNote)}</span></div>`;
  } else if (m.panel === 'report') {
    left = `<div class="pnl glass" style="left:10px;top:86px;width:340px;height:300px" data-testid="dom-report"><span class="tape" style="left:-14px;top:-8px;transform:rotate(-24deg)"></span>
      <div class="hd y"><img class="ic" src="${img('g-journal')}" alt="">NIGHT REPORT<span class="r">overnight</span></div>
      <div class="col sm" style="gap:7px;line-height:1.3">${m.report.map((l) => `<div>${esc(l)}</div>`).join('')}</div></div>`;
  } else {
    left = `<div class="pnl glass" style="left:10px;top:86px;width:290px;height:170px" data-testid="dom-night">
      <div class="hd" style="color:#9fc4ff"><img class="ic" src="${img('g-letter')}" alt="">TONIGHT</div>
      <div class="col sm" style="gap:6px;line-height:1.35">${m.next.label === 'Turn in' ? '<div>Tonight\'s action is done. Turn in: no Rest tonight.</div>' : '<div><b>Rest:</b> your Pokémon heal for free, the crew\'s Morale +5, and +1 action tomorrow.</div><div class="mu xs">Or one Night action on the Region Map (key 2): Steal, Hide in the Warehouse...</div>'}</div></div>`;
  }
  const tc = m.top.colours;
  const pic = member.atlas ? `<div class="a bob" style="left:404px;top:266px;z-index:4">${tallTeam(member.look, 195, tc)}</div>` : `<img class="spr bob" src="${pngSrc(member.look, tc)}" alt="${esc(m.member.name)}" style="left:404px;top:266px;width:126px;height:195px;z-index:4" data-testid="dom-hq-pic">`;
  const face = member.atlas ? `<div style="position:absolute;left:-8px;top:-4px">${tallTeam(member.look, 210, tc)}</div>` : `<img class="spr" src="${pngSrc(member.look, tc)}" alt="" style="left:-58px;top:-10px;width:210px;height:325px">`;
  const steps = m.steps ? `<div class="pnl glass" style="left:652px;top:358px;width:298px;height:112px" data-testid="dom-steps">
      <div class="hd y"><img class="ic" src="${img('g-star-piece')}" alt="">FIRST STEPS</div>
      <div class="col" style="gap:6px;font-size:17px">${m.steps.map((s) => `<div class="row"${s.done ? ' style="color:#9fe0b4"' : ''}><span style="width:16px;height:16px;border:2px solid ${s.done ? '#43cf78' : '#b2bde6'};border-radius:3px;display:grid;place-items:center;font-size:12px;line-height:1">${s.done ? '✓' : ''}</span>${s.done ? `<s>${esc(s.label)}</s>` : esc(s.label)}</div>`).join('')}</div>
    </div>` : '';
  const night = m.phase === 'night';
  return stage(`${warehouseBack(m.morning)}
  ${night ? '<div class="a" style="inset:0;background:rgba(10,20,60,.45);z-index:2"></div>' : ''}
  <div class="a flick" style="left:330px;top:150px;width:300px;height:300px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,214,140,.22),transparent);mix-blend-mode:screen"></div>
  <div class="cone flick" style="left:330px;top:70px;width:300px;height:400px;z-index:2;--cc:rgba(255,214,140,.30)"></div>
  <div class="embers" style="left:380px;top:120px;width:200px;height:300px;z-index:3;--ec:#ffe2a8;background-size:200px 150px;opacity:.7"></div>
  <div class="a drip" style="left:491px;top:96px;width:3px;height:9px;background:#9cc4ff;border-radius:2px;--d:360px;box-shadow:0 0 6px #9cc4ff"></div>
  <img class="spr" src="${img('g-ball')}" alt="" style="left:236px;top:404px;width:26px;height:26px">
  <div class="shd" style="left:396px;top:454px;width:150px;height:22px"></div>
  ${pic}
  <div class="bub" style="left:490px;top:192px;width:150px;--tx:20px;font-size:14px" data-testid="dom-says">${esc(m.member.name[0] + m.member.name.slice(1).toLowerCase())}: “${esc(m.says)}”</div>
  ${topBar(m.top)}
  ${left}
  <div class="pnl glass" style="left:652px;top:86px;width:298px;height:262px" data-testid="dom-member">
    <div class="hd"><img class="ic" src="${img('g-member-card')}" alt="">${esc(m.member.title)}</div>
    <div class="row" style="gap:12px;align-items:flex-start">
      <div style="width:104px;height:104px;border-radius:8px;overflow:hidden;background:linear-gradient(180deg,#4a5578,#2a3150);box-shadow:0 0 0 3px #6f80b8,0 0 0 5px var(--ink);position:relative">${face}</div>
      <div class="col" style="gap:4px"><b style="font-size:24px;letter-spacing:.06em">${esc(m.member.name)}</b><span class="mu" style="font-size:18px;letter-spacing:.06em">${esc(m.member.rank)}</span>${m.member.untrained ? '<span class="pill v" style="font-size:16px;padding:3px 10px;margin-top:4px">UNTRAINED</span>' : ''}<span style="margin-top:3px">${bandChip(tc, tc ? `${m.top.team.toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase())} armband` : 'blank armband')}</span></div>
    </div>
    <div class="col" style="gap:3px;margin-top:12px;padding-top:9px;border-top:2px solid rgba(148,166,222,.28);font-size:18px;letter-spacing:.04em">
      ${m.member.skills.map(([k, v]) => `<div class="row sp"><span>${k}</span><b class="${v === 'POOR' ? 'rd' : v === 'FAIR' ? 'y' : 'gn'}">${v}</b></div>`).join('')}
    </div>
  </div>
  ${steps}
  <div class="cta${m.phase === 'morning' ? ' shine' : ''}" style="left:10px;width:${m.panel === 'report' ? 340 : 290}px;top:${m.panel === 'report' ? 398 : m.panel === 'night' ? 270 : 286}px;font-size:20px;padding:9px 18px"${act('next')} data-testid="dom-next">${esc(m.next.label)} ▶ <span class="kc">${esc(m.next.hint)}</span></div>
  ${notice ? `<div class="a" style="left:330px;width:300px;top:86px;z-index:20;background:rgba(10,14,30,.88);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3" data-testid="dom-notice">${esc(notice)}</div>` : ''}
  ${tabs(0, [0, 1, 2, 5])}
  <div class="ping" style="left:120px;top:400px;width:40px;height:14px;--pc:rgba(160,200,255,.7)"></div>
  <div class="ping" style="left:200px;top:420px;width:34px;height:12px;--pc:rgba(160,200,255,.6);animation-delay:-1.1s"></div>
  <img class="spr bob" src="${img('p-rattata')}" alt="" style="left:96px;top:424px;width:46px;height:40px;z-index:4">
  ${m.panel === 'orders' && m.orders.length ? '<div class="qmark" style="left:450px;top:150px">!</div>' : ''}
  ${m.top.founding ? foundingBanner() : ''}`);
}

/** D7: the HQ's gold banner while the Founding waits (key O or a tap opens it). */
export function foundingBanner(): string {
  return `<div class="chipf pulse" style="position:absolute;left:330px;top:44px;z-index:21;font-size:15px;padding:5px 14px;cursor:pointer"${act('founding')} data-testid="dom-founding-ready">★ THE FOUNDING <span class="kc" style="margin-left:6px">O</span></div>`;
}
