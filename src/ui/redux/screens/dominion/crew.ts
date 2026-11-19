// DOMINION slice D3 screens: mockup 2 (the Morning: report, Assign Task, Grunt Info, the crew strip) and mockup 5
// (the Crew File), ported from plans/evil-mode-rework/mockups-redesign/index.html sections s2 and s5, plus the talk
// card, the hire list and the leads in the same skin. Plain data in from core/dominion/crewScreens.ts.

import { monName } from '../../../../core/dominion/crew';
import type { FileModel, HireRow, LeadRow, MorningModel, TalkModel } from '../../../../core/dominion/crewScreens';
import { act, esc, mini, tall } from '../../kit';
import { rxUrl } from '../../assets';
import { warehouseUrl } from './paint';
import { stage, tabs, topBar } from './views';

const img = (f: string): string => rxUrl(`dominion/${f}.png`);
const ALERT: Record<string, [string, string, string]> = {
  crew: ['g', 'g-card-key', 'CREW'], money: ['y', 'g-relic-gold', 'FRONTS'], rival: ['r', 'g-meteorite', 'RIVALS'],
  police: ['b', 'g-silph-scope', 'POLICE'], hero: ['v', 'g-comet-shard', 'HERO'], world: ['b', 'g-journal', 'NEWS'],
};
export const OPEN_TABS = [0, 1, 2] as const;

/** A member's picture: a plain png (Rook's) or a trainer atlas, cropped into a box. */
function face(look: string, h: number, style: string): string {
  return look.endsWith('.png')
    ? `<img class="px" src="${rxUrl(look)}" alt="" style="${style}">`
    : `<div style="${style};display:flex;align-items:flex-end;justify-content:center;overflow:hidden">${tall(look, h)}</div>`;
}

export function talkCard(t: TalkModel, at: number): string {
  const rows = t.choices.map((c, i) => `<div class="row sp${i === at ? ' ants' : ''}" style="padding:5px 9px;border-radius:6px;${i === at ? 'background:linear-gradient(90deg,#3a5a9e,#2a3f72);box-shadow:0 0 0 2px #8cc0ff,0 0 14px rgba(79,163,255,.45)' : 'background:#2b375a'}"${act('talk', i)} data-over="talkOver" data-testid="dom-talk-${i}">${i === at ? '▶ ' : ''}${esc(c)}</div>`).join('');
  return `<div class="a" style="inset:0;background:rgba(6,9,19,.55);z-index:30"></div>
  <div class="pnl gild" style="left:250px;top:130px;width:460px;z-index:31" data-testid="dom-talk"><span class="brk"></span>
    <div class="hd y"><img class="ic" src="${img('g-soothe-bell')}" alt="">${esc(t.title.toUpperCase())}<span class="r">${esc(t.name)}</span></div>
    <div style="font-size:17px;line-height:1.35;margin-bottom:10px">${esc(t.text)}</div>
    <div class="col" style="gap:5px;font-size:16px">${rows}</div>
    <div class="row xs mu" style="margin-top:8px;gap:6px"><span class="kc">▲▼</span>choose<span class="kc">Enter</span>answer</div>
  </div>`;
}

// ---------- mockup 2: the Morning ----------

export function morningView(m: MorningModel, notice: string | null, talkAt: number): string {
  const alerts = m.alerts.map((a) => {
    const [cls, ic, t0] = ALERT[a.kind] ?? ALERT.world!;
    const t = a.kind === 'rival' ? esc(m.rivalTag) : t0;
    return `<div class="al ${cls}"><img class="ic" src="${img(ic)}" alt=""><div><span class="t">${t}</span><span class="xs dm" style="float:right;margin-left:6px">${esc(a.time)}</span>${esc(a.text)}</div></div>`;
  }).join('') || '<div class="mu sm">A quiet night.</div>';
  const rows = m.tasks.map((t, i) => {
    const on = t.on && !t.locked;
    const st = on ? 'background:linear-gradient(90deg,#3a5a9e,#2a3f72);box-shadow:0 0 0 2px #8cc0ff,0 0 14px rgba(79,163,255,.45)' : t.on ? 'background:#3a3f5a;box-shadow:0 0 0 2px #6f80b8' : 'background:#2b375a';
    return `<div class="row sp${on ? ' ants' : ''}" style="padding:3px 7px;border-radius:6px;${st};${t.locked ? 'opacity:.55' : ''}"${act('task', i)} data-over="taskOver" data-testid="dom-task-${t.id}" title="${esc(t.locked ?? '')}"><span class="row">${t.icon ? `<img class="ic" src="${img(t.icon)}" alt="">` : ''}${esc(t.label)}</span><b class="${t.tone}">${esc(t.odds)}</b></div>`;
  });
  const list = m.all
    ? `<div class="col" style="gap:4px;font-size:15px;max-height:248px;overflow:hidden">${windowed(rows, m.tasks.findIndex((t) => t.on), 9).join('')}</div>`
    : `<div class="col" style="gap:4px;font-size:16px">${rows.join('')}<div class="row" style="padding:3px 7px;color:var(--muted)"${act('moreTasks')} data-testid="dom-more">More… (${m.moreCount} tasks) <span class="kc" style="margin-left:6px">M</span></div></div>`;
  const i = m.member;
  const pill = i.trait ? `<span class="pill g" style="margin-top:2px">${esc(i.trait.toUpperCase())}</span>` : `<span class="pill r" style="margin-top:2px">${esc(i.green)}</span>`;
  const band = i.armband
    ? `<span class="row xs" style="gap:4px;color:#d4b8ff"><i style="width:26px;height:10px;border-radius:3px;background:linear-gradient(180deg,#9a5ac0,#7b3fa0);box-shadow:0 0 0 2px var(--ink),inset 0 0 0 1px #e8e2ff"></i>${esc(i.armband)}</span>`
    : '<span class="row xs" style="gap:4px;color:#b2bde6"><i style="width:26px;height:10px;border-radius:3px;background:linear-gradient(180deg,#8a8f9e,#5a5f6e);box-shadow:0 0 0 2px var(--ink)"></i>Grey armband</span>';
  const strip = m.strip.slice(0, 4).map((s) => `<div class="pnl" style="position:relative;padding:6px 8px;display:flex;gap:8px;align-items:center;${s.sel ? 'border-color:#8cc0ff;box-shadow:0 0 0 3px var(--ink),0 0 16px rgba(79,163,255,.5)' : ''};${s.out ? 'opacity:.6' : ''}"${act('crewMember', m.strip.indexOf(s))} data-testid="dom-strip-${s.id}">${face(s.look, 53, 'width:36px;height:53px;object-fit:cover;object-position:top')}<div class="col xs" style="line-height:1.15;min-width:0"><b style="font-size:14px">${esc(s.name)}</b><span class="${s.sel ? 'y' : s.tone}" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.task)}${s.odds ? ` ${esc(s.odds)}` : ''}</span></div></div>`).join('');
  return stage(`<img class="cv" src="${warehouseUrl(true)}" alt="" style="position:absolute;inset:0;width:960px;height:540px">
  <div class="layer" style="background:linear-gradient(180deg,rgba(255,170,90,.16),rgba(255,120,60,.06));mix-blend-mode:screen"></div>
  <div class="a" style="left:300px;top:40px;width:120px;height:520px;transform:rotate(-24deg);transform-origin:top;background:linear-gradient(180deg,rgba(255,220,160,.35),transparent);mix-blend-mode:screen"></div>
  <div class="a" style="left:420px;top:40px;width:70px;height:520px;transform:rotate(-24deg);transform-origin:top;background:linear-gradient(180deg,rgba(255,220,160,.28),transparent);mix-blend-mode:screen"></div>
  <div class="embers" style="left:260px;top:60px;width:300px;height:420px;z-index:2;--ec:#ffe2a8;background-size:300px 210px;opacity:.85"></div>
  <div class="pool" style="left:300px;top:330px;width:380px;height:160px;z-index:1;--pc:rgba(255,200,120,.35)"></div>
  ${topBar(m.top)}
  <div class="pnl glass" style="left:10px;top:86px;width:330px;height:384px" data-testid="dom-morning-report">
    <div class="hd"><img class="ic" src="${img('g-xtransceiver')}" alt="">MORNING REPORT<span class="r">overnight</span></div>
    <div class="col" style="gap:7px;max-height:290px;overflow:hidden">${alerts}</div>
    ${m.more ? `<div class="xs mu" style="margin-top:4px">+${m.more} more in the Ledger</div>` : ''}
    <div class="row" style="position:absolute;left:0;right:0;bottom:12px;justify-content:center;gap:10px;color:${m.badge.hot ? 'var(--red)' : '#9fe0b4'};font-weight:700">⚠ <span class="${m.badge.hot ? 'pulse' : ''}" style="display:inline-block;border:2px solid ${m.badge.hot ? 'var(--red)' : '#43cf78'};border-radius:6px;padding:2px 10px;cursor:pointer;box-shadow:0 0 12px ${m.badge.hot ? 'rgba(255,90,79,.4)' : 'rgba(67,207,120,.3)'}"${act('rivalFile')} title="Rival File (R)" data-testid="dom-badge">${esc(m.badge.label)}: ${esc(m.badge.word)}</span> ⚠</div>
  </div>
  <div class="pnl glass" style="left:350px;top:86px;width:276px;height:308px" data-testid="dom-assign">
    <div class="hd"><img class="ic" src="${img('g-letter')}" alt="">ASSIGN TASK<span class="r">${esc(m.strip.find((s) => s.sel)?.name ?? '')}</span></div>
    ${list}
  </div>
  <div class="pnl glass" style="left:636px;top:86px;width:314px;height:308px" data-testid="dom-info"><span class="brk"></span>
    <div class="hd"><img class="ic" src="${img('g-member-card')}" alt="">GRUNT INFO</div>
    <div class="row" style="align-items:flex-start;gap:10px">
      <div style="width:110px;height:118px;position:relative;border-radius:8px;background:radial-gradient(circle at 50% 60%,#5a3a8a,#241a40);box-shadow:0 0 0 3px #6f80b8,0 0 0 5px var(--ink);overflow:hidden">
        ${face(i.look, 150, 'position:absolute;left:-36px;top:4px;width:172px;height:150px;object-fit:contain;object-position:top')}</div>
      <div class="col" style="gap:5px;flex:1;min-width:0"><b style="font-size:20px;letter-spacing:.05em" data-testid="dom-info-name">${esc(i.name)}</b><span class="pill k">${esc(i.rank)}</span>${pill}${band}<span class="xs mu">${esc(i.out ?? i.typeName ?? '')}</span></div>
    </div>
    <div class="col" style="gap:4px;margin-top:10px;font-size:15px">
      <div class="row sp"><span>Loyalty</span><b class="gn">${i.loyalty}%</b></div><div class="mt g" style="--v:${i.loyalty}"></div>
      <div class="row sp"><span>Skill</span><b class="cy">${i.skill}</b></div><div class="mt c" style="--v:${i.skill}"></div>
      <div class="row sp"><span>Personality</span><b data-testid="dom-personality">${esc(i.personality)}</b><span class="xs mu">${i.forming ? 'forming' : 'formed'}</span></div>
    </div>
  </div>
  <div class="a" style="left:350px;top:404px;width:444px;height:66px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;z-index:6" data-testid="dom-strip">${strip}</div>
  <div class="rays turn" style="left:757px;top:317px;width:240px;height:240px;z-index:19;--rc:rgba(255,200,90,.45)"></div>
  <div class="cta shine" style="left:804px;top:404px;width:146px;height:66px;font-size:19px;line-height:1.05;text-align:center;display:grid;place-items:center"${act('next')} data-testid="dom-next">${m.phase === 'morning' ? 'Start the day ▶' : 'Done ▶'}</div>
  ${tabs(0, OPEN_TABS)}
  <div class="glint" style="left:862px;top:392px;--g:22px"></div>
  ${notice ? `<div class="a" style="left:350px;width:276px;top:300px;z-index:20;background:rgba(10,14,30,.9);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3" data-testid="dom-notice">${esc(notice)}</div>` : ''}
  ${m.talk ? talkCard(m.talk, talkAt) : ''}`);
}

function windowed<T>(rows: T[], at: number, n: number): T[] {
  const start = Math.max(0, Math.min(rows.length - n, at - Math.floor(n / 2)));
  return rows.slice(start, start + n);
}

// ---------- mockup 5: the Crew File ----------

const WEB = [[0, -80], [76, -25], [47, 65], [-47, 65], [-76, -25]] as const;
const LABEL_AT = [[0, -86], [96, -24], [62, 84], [-62, 84], [-98, -24]] as const;

export function fileView(f: FileModel, monFile: (species: string) => string | null, notice: string | null, overlay: string, talkAt: number): string {
  const pts = f.stats.map((s, i) => {
    const k = Math.max(0.12, s.value / 10);
    return [Math.round(WEB[i]![0] * k), Math.round(WEB[i]![1] * k)] as const;
  });
  const poly = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const labels = f.stats.map((s, i) => `<text x="${LABEL_AT[i]![0]}" y="${LABEL_AT[i]![1]}">${s.label} ${s.value}</text>`).join('');
  const dots = pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('');
  const chev = Array.from({ length: f.chevrons }, () => '<i style="width:18px;height:10px;background:var(--gold);clip-path:polygon(0 0,50% 60%,100% 0,100% 40%,50% 100%,0 40%)"></i>').join('');
  const big = f.look.endsWith('.png')
    ? `<img class="spr bob" src="${rxUrl(f.look)}" alt="${esc(f.name)}" style="left:62px;top:90px;width:176px;height:260px;z-index:4;filter:drop-shadow(0 0 10px rgba(166,120,255,.6))">`
    : `<div class="a bob" style="left:62px;top:90px;width:176px;height:260px;z-index:4;display:flex;align-items:flex-end;justify-content:center;filter:drop-shadow(0 0 10px rgba(166,120,255,.6))">${tall(f.look, 250)}</div>`;
  const first = f.formed[0];
  const personality = first
    ? `<div class="row" style="gap:8px;font-size:16px"><span class="pill r" style="text-decoration:line-through;opacity:.8">${esc(f.green)}</span><b class="y" style="font-size:20px">➜</b><span class="pill g" style="font-size:15px;box-shadow:0 0 0 2px rgba(0,0,0,.35),0 0 16px rgba(67,207,120,.8)" data-testid="dom-formed">${esc(first.name)}</span>${f.grew ? '<span class="chipf" style="position:relative;font-size:12px;padding:2px 8px" data-testid="dom-grew">GREW!</span>' : ''}</div>
      <div class="sm mu" style="margin-top:5px">${esc(f.record)}</div>
      <div class="sm">${esc(first.text)}${first.live ? '' : ` <span class="xs mu">(works from ${esc(first.needs ?? 'later')})</span>`}</div>`
    : `<div class="row" style="gap:8px;font-size:16px"><span class="pill r" data-testid="dom-green">${esc(f.green)}</span><b class="mu" style="font-size:18px">➜</b><span class="pill k" style="opacity:.8">${esc(f.temperament)}?</span><span class="xs mu">forming</span></div>
      <div class="sm mu" style="margin-top:5px">${esc(f.record)}</div>
      <div class="sm">Grows at Grunt rank, member Lv 4, from what they do most and how you treat them.</div>`;
  const second = f.formed[1]
    ? `<div class="row" style="gap:8px;margin-top:9px"><span class="pill b">${esc(f.formed[1].name)}</span><span class="xs mu">2nd trait</span></div><div class="sm" style="margin-top:3px">${esc(f.formed[1].text)}</div>`
    : `<div class="row" style="gap:8px;margin-top:9px;opacity:.7"><span class="pill b" style="opacity:.6">?</span><span class="xs mu">${esc(f.second)}</span></div>`;
  const team = f.team.map((t) => {
    const file = monFile(t.species);
    return `<div class="col" style="align-items:center">${file ? mini(file, 44) : ''}<span class="xs">${esc(monName(t.species))} <b class="y">${t.level}</b></span></div>`;
  }).join('');
  const keys = f.keys.map((k) => `<span class="kc">${esc(k.key)}</span><span class="dm" style="margin-right:6px">${esc(k.label)}</span>`).join('');
  return stage(`<div class="layer" style="background:radial-gradient(420px 380px at 150px 300px,rgba(140,80,220,.45),transparent 70%)"></div>
  <div class="ttl">Crew File <span class="sub">· ${esc(f.name[0] + f.name.slice(1).toLowerCase())}</span></div>
  <div class="keys"><span class="kc"${act('flip', -1)}>◀</span><span class="dm">${f.prev ? `${esc(f.prev)} · ${esc(f.next)}` : esc(f.count)}</span><span class="kc"${act('flip', 1)}>▶</span><span class="dm" style="margin-left:8px">joined</span><span class="key">Day ${f.joined}</span></div>
  <div class="a row" style="right:16px;top:44px;z-index:9;gap:4px;font:600 12px var(--ui);color:#dfe5ff" data-testid="dom-file-keys">${keys}<span class="kc">Esc</span><span class="dm">HQ</span></div>
  <div class="drape" style="left:0;top:58px;height:482px;--w:46px;clip-path:polygon(0 0,100% 0,60% 100%,0 100%)"></div>
  <div class="drape" style="left:248px;top:58px;height:482px;--w:46px;clip-path:polygon(0 0,100% 0,100% 100%,40% 100%);box-shadow:inset 8px 0 14px rgba(0,0,0,.45)"></div>
  <div class="a" style="left:0;top:56px;width:296px;height:20px;z-index:7;background:linear-gradient(180deg,#ffe98a,#c08a2a);box-shadow:0 3px 0 #5a3c02;clip-path:polygon(0 0,100% 0,100% 60%,96% 100%,92% 60%,88% 100%,84% 60%,80% 100%,76% 60%,72% 100%,68% 60%,64% 100%,60% 60%,56% 100%,52% 60%,48% 100%,44% 60%,40% 100%,36% 60%,32% 100%,28% 60%,24% 100%,20% 60%,16% 100%,12% 60%,8% 100%,4% 60%,0 100%)"></div>
  <div class="cone" style="left:40px;top:-20px;width:220px;height:380px;z-index:2;--cc:rgba(190,150,255,.35);clip-path:polygon(30% 0,70% 0,100% 100%,0 100%)"></div>
  <div class="rays turn" style="left:0;top:60px;width:300px;height:300px;z-index:1;--rc:rgba(190,150,255,.25)"></div>
  <div class="a" style="left:40px;top:330px;width:220px;height:56px;border-radius:50%;background:radial-gradient(closest-side,#b78cff,#6a3fd0 55%,#2a1658 80%,transparent);box-shadow:0 0 40px rgba(166,120,255,.6)"></div>
  <div class="a" style="left:58px;top:340px;width:184px;height:36px;border-radius:50%;border:3px solid rgba(255,255,255,.35)"></div>
  ${big}
  <div class="pnl gild" style="left:22px;top:396px;width:256px;height:132px;text-align:center;z-index:8" data-testid="dom-file-plate">
    <div style="font:800 32px var(--logo);font-style:italic;letter-spacing:.03em;color:#fff;text-shadow:0 3px 0 #3b1a7a" data-testid="dom-file-name">${esc(f.name)}</div>
    <div class="row" style="justify-content:center;gap:6px;margin-top:4px"><span class="pill v">${esc(f.rank)} · ${f.rankN} of 15</span><span class="pill k">Lv ${f.level}</span></div>
    <div class="row" style="justify-content:center;gap:4px;margin-top:8px">${chev}<span class="sm mu" style="margin-left:6px">₽${f.wage} / week</span></div>
    <div class="xs mu" style="margin-top:4px">${esc(f.out ?? `${f.task} · ${f.taskLevel}`)}</div>
  </div>
  <div class="pnl" style="left:296px;top:72px;width:316px;height:316px" data-testid="dom-file-stats">
    <div class="hd"><img class="ic" src="${img('g-black-belt')}" alt="">STATS<span class="r">${esc(f.xp)}</span></div>
    <svg class="a" style="left:24px;top:42px" width="262" height="184" viewBox="-135 -100 270 190" aria-hidden="true">
      <g fill="none" stroke="rgba(148,166,222,.25)" stroke-width="1.5">
        <polygon points="0,-80 76,-25 47,65 -47,65 -76,-25"/><polygon points="0,-48 46,-15 28,39 -28,39 -46,-15"/><polygon points="0,-16 15,-5 9,13 -9,13 -15,-5"/>
        <path d="M0 0 L0 -80 M0 0 L76 -25 M0 0 L47 65 M0 0 L-47 65 M0 0 L-76 -25"/></g>
      <polygon points="${poly}" fill="rgba(166,120,255,.45)" stroke="#c9a6ff" stroke-width="3" style="filter:drop-shadow(0 0 8px #a678ff)"/>
      <g fill="#fff" class="twinkle" style="filter:drop-shadow(0 0 4px #c9a6ff)">${dots}</g>
      <g font-family="Pixelify Sans" font-size="14" fill="#eef1ff" text-anchor="middle">${labels}</g>
    </svg>
    <div class="a col" style="left:14px;right:14px;top:222px;gap:2px;font-size:15px">
      <div class="row sp"><span>♥ Loyalty</span><b class="gn">${f.loyalty}</b></div><div class="mt g t" style="--v:${f.loyalty}"></div>
      <div class="row sp"><span>☺ Morale</span><b class="cy">${f.morale}</b></div><div class="mt c t" style="--v:${f.morale}"></div>
      <div class="row sp xs mu" style="margin-top:2px" data-testid="dom-file-a17"><span>Motive: ${esc(f.motive)}</span><span>Fatigue ${f.fatigue}</span><span>Heat ${f.pHeat}</span></div>
    </div>
  </div>
  <div class="pnl" style="left:622px;top:72px;width:328px;height:316px" data-testid="dom-file-personality">
    <div class="hd"><img class="ic" src="${img('g-soothe-bell')}" alt="">PERSONALITY</div>
    ${personality}
    ${second}
    <div class="row" style="gap:8px;margin-top:9px;opacity:.75"><img class="ic s" src="${img('g-secret-key')}" alt=""><span class="sm">${esc(f.signature)}</span></div>
    <div class="hd" style="margin-top:12px"><img class="ic" src="${img('g-ball')}" alt="">TEAM<span class="r">${esc(f.types)}</span></div>
    <div class="row" style="gap:6px;justify-content:space-around;align-items:flex-end">${team}</div>
  </div>
  <div class="bub" style="left:300px;top:404px;width:300px;opacity:.75;--tx:24px"><b class="xs" style="color:#5d6a90;letter-spacing:.1em">DAY ${f.then.day}</b><br>“${esc(f.then.line)}”</div>
  <div class="bub" style="left:624px;top:404px;width:326px;border-color:#c9a6ff;box-shadow:0 0 0 3px var(--ink),0 0 20px rgba(166,120,255,.5);--tx:24px" data-testid="dom-file-now"><b class="xs" style="color:#5b34b0;letter-spacing:.1em">DAY ${f.now.day}</b><br>“${esc(f.now.line)}”</div>
  <div class="embers" style="left:40px;top:120px;width:220px;height:260px;z-index:5;--ec:#d4b8ff;background-size:220px 130px"></div>
  <div class="glint" style="left:200px;top:110px;--g:16px;--gc:#c9a6ff"></div>
  <div class="glint" style="left:70px;top:250px;--g:12px;--gc:#c9a6ff;animation-delay:-1.5s"></div>
  ${notice ? `<div class="a" style="left:300px;width:310px;top:300px;z-index:20;background:rgba(10,14,30,.9);border:2px solid #8cc0ff;border-radius:8px;padding:8px 10px;font-size:14px;line-height:1.3" data-testid="dom-notice">${esc(notice)}</div>` : ''}
  ${overlay}
  ${f.talk ? talkCard(f.talk, talkAt) : ''}`, '', 'check vign grain');
}

// ---------- Hire Grunt and the leads (Part 6 §3, Part 2 §6) ----------

export function hireOverlay(m: { rows: HireRow[]; room: string; funds: number }, at: number): string {
  const rows = m.rows.map((r, i) => `<div class="row sp${i === at ? ' ants' : ''}" style="padding:6px 9px;border-radius:6px;${i === at ? 'background:linear-gradient(90deg,#3a5a9e,#2a3f72);box-shadow:0 0 0 2px #8cc0ff' : 'background:#2b375a'};${r.sold ? 'opacity:.45' : ''}"${act('hire', i)} data-over="pickOver" data-testid="dom-hire-${i}">
      <div class="col" style="gap:2px"><b>${esc(r.name)} <span class="xs mu">${esc(r.type)} · ${esc(r.rarity)}</span></b><span class="xs"><span class="pill r" style="font-size:11px;padding:1px 6px">${esc(r.green)}</span> ${esc(r.temperament)} · best at ${esc(r.best)}</span></div>
      <b class="${r.sold ? 'mu' : 'y'}">${r.sold ? 'HIRED' : `₽${r.price}`}</b></div>`).join('');
  return `<div class="a" style="inset:0;background:rgba(6,9,19,.55);z-index:24"></div>
  <div class="pnl glass" style="left:230px;top:96px;width:500px;z-index:25" data-testid="dom-hire"><span class="brk"></span>
    <div class="hd y"><img class="ic" src="${img('g-member-card')}" alt="">HIRE GRUNT<span class="r">Roster ${esc(m.room)} · ₽${m.funds.toLocaleString('en-US')}</span></div>
    <div class="col" style="gap:6px;font-size:16px">${rows || '<div class="mu sm">Nobody looking for work today.</div>'}</div>
    <div class="row xs mu" style="margin-top:8px;gap:6px"><span class="kc">Enter</span>hire<span class="kc">Esc</span>close · A new list every morning. They start as Recruits on ₽60 a week.</div>
  </div>`;
}

export function leadsOverlay(m: { rows: LeadRow[]; actions: number; phase: string }, at: number, pitch: number): string {
  const l = m.rows[at];
  const list = m.rows.map((r, i) => `<div class="row sp" style="padding:4px 8px;border-radius:6px;${i === at ? 'background:linear-gradient(90deg,#3a5a9e,#2a3f72);box-shadow:0 0 0 2px #8cc0ff' : 'background:#2b375a'}"${act('lead', i)} data-over="pickOver" data-testid="dom-lead-${i}"><span>${esc(r.name)} <span class="xs mu">${esc(r.cls)}</span></span><span class="xs ${r.waiting ? 'gn' : 'mu'}">${r.waiting ? 'waiting' : `${r.days}d`}</span></div>`).join('');
  const file = l ? `<div class="row" style="gap:10px;align-items:flex-end">${face(l.look, 110, 'width:80px;height:110px')}<div class="col sm" style="gap:3px;line-height:1.3">
      <b style="font-size:18px">${esc(l.name)}</b><span>${esc(l.cls)}</span><span>Wants: <b class="gn">${esc(l.motive)}</b></span><span>Hates: <b class="rd">${esc(l.hates)}</b></span><span class="xs"><span class="pill r" style="font-size:11px;padding:1px 6px">${esc(l.green)}</span></span>${l.role ? `<span class="xs y">${esc(l.role)}</span>` : ''}</div></div>
    ${l.waiting
      ? `<div class="sm gn" style="margin-top:10px">Said yes. Waiting for room at the HQ (${l.days} days left).</div><div class="cta" style="position:relative;margin-top:8px;font-size:16px;padding:6px 12px"${act('admit')} data-testid="dom-admit">Make room: let them in ▶</div>`
      : `<div class="col" style="gap:4px;margin-top:10px">${l.odds.map((o, i) => `<div class="row sp" style="padding:3px 8px;border-radius:6px;${i === pitch ? 'background:linear-gradient(90deg,#5a3a9e,#3a2a72);box-shadow:0 0 0 2px #c9a6ff' : 'background:#2b375a'}"${act('pitch', i)} data-testid="dom-pitch-${o.id}"><span>${esc(o.name)}</span><b class="${o.odds >= 60 ? 'gn' : o.odds >= 35 ? 'y' : 'rd'}">${o.odds}%</b></div>`).join('')}</div>
      <div class="xs mu" style="margin-top:6px">${m.phase === 'day' ? `Recruit is a Day action (${m.actions} left), Heat +1.` : 'Recruit in the Day.'}${l.notBefore ? ` Not before Day ${l.notBefore}.` : ''}</div>`}` : '<div class="mu sm">No leads. Put someone on Recruit a Trainer.</div>';
  return `<div class="a" style="inset:0;background:rgba(6,9,19,.55);z-index:24"></div>
  <div class="pnl glass" style="left:150px;top:90px;width:660px;height:360px;z-index:25" data-testid="dom-leads"><span class="brk"></span>
    <div class="hd y"><img class="ic" src="${img('g-vs-seeker')}" alt="">RECRUIT<span class="r">leads from your crew</span></div>
    <div class="row" style="gap:14px;align-items:flex-start"><div class="col" style="gap:4px;width:240px;font-size:15px">${list}</div><div style="flex:1">${file}</div></div>
    <div class="row xs mu" style="position:absolute;left:14px;bottom:10px;gap:6px"><span class="kc">▲▼</span>lead<span class="kc">◀▶</span>pitch<span class="kc">Enter</span>pitch them<span class="kc">Esc</span>close</div>
  </div>`;
}
