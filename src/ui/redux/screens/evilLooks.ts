// New UI looks for the team's own moments (HOENN_TEAMS part 7): the Final Choice (7.7) and Team Sky's (7.14), the
// Mission Briefing (7.3) and Result (7.4), the Rank-Up (7.2) and the Leader's Table (7.6). EventScene keeps the state,
// the input, the hold and the outcome; this only draws what core/evil/screens.ts says.

import type { BriefingLook, FinalLook, RankUpLook, ResultLook, TableLook } from '../../../core/evil/screens';
import { act, esc, W } from '../kit';
import { figure, type Art } from '../templates';
import type { EventChoice } from './event';

/** Colour and material per team (7, "Shared style"). */
const STYLE = {
  magma: { ink: '#2a2626', paper: '#e9e2d0', head: '#8a1c1c', mark: '#e8b818', font: 'monospace' },
  aqua: { ink: '#0c2a4a', paper: '#f2ead8', head: '#14467a', mark: '#c8a070', font: 'Georgia, serif' },
} as const;
/** A person `px` tall (their trainer picture), or a plain silhouette when the art is missing. */
const art = (a: Art | null, px: number, st = ''): string => {
  const f = a ? figure(a, px) : '';
  return `<div style="display:flex;justify-content:center;align-items:flex-end;height:${px}px;${st}">${f || `<div style="width:${Math.round(px * 0.6)}px;height:${px}px;background:#fff3;border-radius:50% 50% 8px 8px"></div>`}</div>`;
};
const corner = (k: number, on: boolean, extra = ''): string => ` data-over="over" data-arg="${k}" data-hold="${k}"${on ? ' data-on="1"' : ''}${extra}`;
const pickAct = (k: number): string => `${act('pick', k)} data-over="over"`;

export interface FinalModel { look: FinalLook; choices: EventChoice[]; index: number; hold: number; files: (Art | null)[]; title: string }

/** 7.7 / 7.14: the UI falls away; black, the orb (or the sky from the bottom of a well), four corners, a ring of faces. */
export function finalView(d: FinalModel): string {
  const { look } = d;
  const glow = 0.35 + d.hold * 0.65;
  const centre = look.centre === 'sky'
    ? `<div class="abs" style="left:330px;top:120px;width:300px;height:300px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 40px #141018,0 0 0 90px #0b0910,inset 0 0 60px #000;background:radial-gradient(circle at 50% 40%,hsl(200 60% ${40 + d.hold * 40}%),#203040 75%)"><div class="rx-wyrm" style="position:absolute;left:-40%;top:42%;width:180%;height:26px;border-radius:13px;background:linear-gradient(90deg,transparent,#1d3a28 30%,#2c5a3a 60%,transparent);opacity:.75;filter:blur(2px)"></div></div>`
    : `<div class="abs" style="left:380px;top:150px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle at 40% 35%,${look.centre === 'red' ? '#ffd0a0,#e03018 45%,#5a0808' : '#d0f0ff,#2070e0 45%,#081a5a'});box-shadow:0 0 ${40 + d.hold * 120}px ${look.centre === 'red' ? '#ff4020' : '#3080ff'};filter:brightness(${glow + 0.4})"></div><div class="abs" style="left:440px;top:356px;width:80px;height:44px;border-radius:30px 30px 6px 6px;background:linear-gradient(#b08060,#5a3a28);opacity:.8"></div>`;
  const spots = [[60, 70], [640, 70], [60, 400], [640, 400]] as const;
  const cornerHtml = d.choices.slice(0, 4).map((c, k) => {
    const [x, y] = spots[k]!;
    const on = k === d.index;
    return `<div class="abs" style="left:${x}px;top:${y}px;width:260px;padding:8px 10px;cursor:${c.locked ? 'not-allowed' : 'pointer'};text-align:${k % 2 ? 'right' : 'left'};opacity:${c.locked ? 0.4 : 1};${on ? 'text-shadow:0 0 12px #fff8' : ''}"${corner(k, on)}><b style="font-size:20px;letter-spacing:.06em;color:${on ? '#fff' : '#cfcfcf'}">${esc(c.label.replace(/\.$/, '').toUpperCase())}</b><div style="font-size:15px;color:#bbb">${esc(look.says[k] ?? '')}</div>${c.locked ? `<div class="sm" style="color:#aaa;margin-top:4px">░ needs: ${esc(c.sub)} ░</div>` : ''}</div>`;
  }).join('');
  const n = look.faces.length;
  const ring = look.faces.map((f, i) => {
    const a = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2;
    const k = f.apart ? 1.12 : 1;
    const x = 480 + Math.cos(a) * 175 * k, y = 262 + Math.sin(a) * 205 * k;
    const react = f.react[d.index] ?? '';
    const t = react === 'down' ? 'translateY(6px) rotate(8deg)' : react === 'hard' ? 'scale(1.05)' : react === 'lean' ? `translate(${(480 - x) * 0.08}px,${(270 - y) * 0.08}px) scale(1.15)` : react === 'away' ? 'scaleX(-1)' : 'none';
    const filt = react === 'hard' ? 'contrast(1.4) brightness(.8)' : react === 'down' ? 'brightness(.7)' : 'none';
    return `<div class="abs" style="left:${Math.round(x) - 22}px;top:${Math.round(y) - 30}px;width:44px;text-align:center;transition:transform .4s;transform:${t};filter:${filt};opacity:${f.apart ? 0.6 : 1}" title="${esc(f.name)}">${art(d.files[i] ?? null, 44)}<div style="font-size:9px;color:#999;white-space:nowrap">${esc(f.name)}</div></div>`;
  }).join('');
  const breath = `<div class="abs sm" style="left:0;right:0;bottom:14px;text-align:center;color:#888">${d.hold > 0 ? `Holding… ${Math.round(d.hold * 100)}%` : 'Hold <kbd>Enter</kbd> (or press and hold) to choose. Letting go cancels.'}</div>`;
  return `<div class="fill" style="background:#000"></div><div class="fill rx-breathe" style="background:radial-gradient(circle at 50% 50%,#ffffff08,transparent 60%)"></div>${centre}${ring}${cornerHtml}<div class="abs sm" style="left:0;right:0;top:4px;text-align:center;color:#666;letter-spacing:.2em">${esc(d.title.toUpperCase())}</div>${breath}<style>.rx-breathe{animation:rxb 4.2s ease-in-out infinite}.rx-breathe+*{animation:rxb 3.7s ease-in-out infinite}@keyframes rxb{50%{opacity:.6}}.rx-wyrm{animation:rxw 9s linear infinite}@keyframes rxw{from{transform:translateX(-30%)}to{transform:translateX(30%)}}.calm .rx-breathe,.calm .rx-wyrm{animation:none}</style>`;
}

export interface BriefingModel { look: BriefingLook; choices: EventChoice[]; index: number; text: string }

/** 7.3: three columns, always (a fourth, narrower, in the other team's colour for a double agent); every number first. */
export function briefingView(d: BriefingModel): string {
  const st = STYLE[d.look.team];
  const other = STYLE[d.look.team === 'magma' ? 'aqua' : 'magma'];
  const cols = d.choices.map((c, k) => {
    const tip = d.look.tip !== null && k >= d.look.tip;
    const nums = (d.look.numbers[k] ?? (tip ? ['Suspicion +2', 'Kindness +1'] : [])).map((x) => `<div style="display:flex;justify-content:space-between"><span>${esc(x.replace(/ [+−-]?₽?\d.*$/, ''))}</span><b>${esc(x.slice(x.replace(/ [+−-]?₽?\d.*$/, '').length))}</b></div>`).join('');
    const on = k === d.index;
    return `<div style="flex:${tip ? 0.7 : 1};min-width:0;padding:10px 12px;border-left:2px solid ${st.ink}33;background:${tip ? other.head + '22' : on ? st.mark + '44' : 'transparent'};cursor:pointer;${c.locked ? 'opacity:.45' : ''}"${pickAct(k)}><b style="font-size:15px;color:${tip ? other.head : st.head}">${esc(c.label.replace(/ \(\d+% chance it's noticed\)/, '').toUpperCase())}</b><div style="font-size:12px;margin:4px 0 8px;min-height:30px">${esc(c.sub)}</div><div style="font-size:13px;display:flex;flex-direction:column;gap:2px">${nums}</div></div>`;
  }).join('');
  return `<div class="fill" style="background:${d.look.team === 'magma' ? 'repeating-linear-gradient(0deg,#3a3434 0 2px,#2e2a2a 2px 24px)' : 'radial-gradient(circle at 70% 30%,#20507a,#0a2440)'}"></div><div class="abs" style="left:60px;right:60px;top:40px;bottom:40px;background:${st.paper};color:${st.ink};font-family:${st.font};box-shadow:0 0 0 4px ${st.head},8px 8px 0 #0006;display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between;align-items:baseline;padding:12px 16px;border-bottom:2px solid ${st.ink}"><b style="font-size:20px">ORDER ${String(d.look.order).padStart(2, '0')} ─ ${esc(d.look.title)}</b><span style="font-size:13px">issued by ${esc(d.look.by.toUpperCase())}</span></div><div style="padding:8px 16px;font-style:italic;font-size:15px">"${esc(d.look.quote)}"</div><div style="padding:0 16px 8px;font-size:12px;line-height:1.35;max-height:72px;overflow:hidden">${esc(d.text)}</div><div style="display:flex;flex:1;border-top:2px solid ${st.ink}">${cols}</div>${d.look.withYou ? `<div style="padding:8px 16px;border-top:2px solid ${st.ink};font-size:14px"><b>WITH YOU:</b> ${esc(d.look.withYou)}</div>` : ''}</div>`;
}

/** 7.4: a stamped form (Magma) or a log entry (Aqua): what was done, what changed, and one human line in plain black on white. */
export function resultView(r: ResultLook, next: string): string {
  const st = STYLE[r.team];
  const stamp = r.team === 'magma' ? `<div class="abs" style="right:40px;top:30px;transform:rotate(-12deg);border:4px solid #b01818;color:#b01818;padding:4px 12px;font:bold 26px monospace;opacity:.8">FILED</div>` : `<div class="abs" style="right:40px;top:26px;width:70px;height:70px;border-radius:50%;border:6px solid #8a5a3088;opacity:.5"></div>`;
  return `<div class="fill" style="background:${r.team === 'magma' ? '#2e2a2a' : '#0a2440'}"></div><div class="abs" style="left:140px;right:140px;top:70px;background:${st.paper};color:${st.ink};font-family:${st.font};padding:24px 28px;box-shadow:0 0 0 4px ${st.head},8px 8px 0 #0006">${stamp}<div style="font-size:13px;opacity:.7">${r.team === 'magma' ? 'MISSION REPORT' : 'SHIP\'S LOG'}</div><div style="font-size:18px;margin:8px 0"><b>Done:</b> ${esc(r.done)}</div><div style="font-size:15px"><b>Changed:</b> ${esc(r.changed.join(' · ') || 'nothing')}</div>${r.voice ? `<div style="margin-top:16px;background:#fff;color:#000;font-family:inherit;padding:10px 12px;font-size:15px">${esc(r.voice)}</div>` : ''}</div><div class="btn on" style="position:absolute;left:380px;width:200px;bottom:40px;justify-content:center"${act('next')}>${esc(next)}</div>`;
}

/** 7.2: the whole team drawn small in rows, the insignia changing hands; rank 6 stays in the leader's office, two figures. */
export function rankUpView(r: RankUpLook, files: { leader: Art | null; lt: Art | null; grunt: Art | null }, next: string): string {
  const crowd = r.office ? '' : Array.from({ length: 3 }, (_, row) => `<div style="display:flex;gap:6px;justify-content:center;opacity:${1 - row * 0.2}">${Array.from({ length: 9 + row * 2 }, (_, i) => art(files.grunt, 38 - row * 4, row === 0 && i === 4 && r.bunkFront ? 'filter:drop-shadow(0 0 4px #fff)' : '')).join('')}</div>`).join('');
  const giver = r.byLeader ? files.leader : files.lt;
  const scene = r.office
    ? `<div style="display:flex;justify-content:center;align-items:flex-end;gap:80px;margin-top:30px">${art(files.leader, 110)}<div style="width:220px;height:40px;background:#5a4030;border-radius:4px"></div><div style="width:60px;height:110px;border-radius:30px 30px 6px 6px;background:#fff3"></div></div>`
    : `<div style="display:flex;justify-content:center;margin-bottom:8px">${art(giver, 90)}</div>${crowd}`;
  return `<div class="fill" style="background:linear-gradient(${r.color},#000 80%)"></div><div class="abs" style="left:0;right:0;top:24px;text-align:center;color:#fff"><div class="sm" style="opacity:.8">${esc(r.team)}</div><b style="font-size:30px;letter-spacing:.08em">${esc(r.title.toUpperCase())}</b><div class="sm">Rank ${r.rank} · ${r.byLeader ? 'pinned by the leader' : 'pinned by the lieutenant'}${r.bunkFront ? ' · your bunkmate in the front row' : ''}</div></div><div class="abs" style="left:0;right:0;top:120px">${scene}</div><div class="abs" style="left:180px;right:180px;bottom:90px;display:flex;gap:12px">${r.unlocks.map((u) => W(`<div style="font-size:26px;text-align:center">★</div><div class="sm" style="text-align:center">${esc(u)}</div>`, 'flex:1;padding:8px')).join('')}</div><div class="btn on" style="position:absolute;left:380px;width:200px;bottom:30px;justify-content:center"${act('next')}>${esc(next)}</div>`;
}

export interface TableModel { look: TableLook; choices: EventChoice[]; index: number; files: (Art | null)[]; text: string }

/** The team's mark for the banner and the map's corner: a peak for Magma, a wave for Aqua (plain shapes, not the games' logos). */
const emblem = (team: 'magma' | 'aqua', size: number, color: string): string =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="display:block">${team === 'magma'
    ? `<path d="M2 21 8 6l4 8 4-8 6 15z" fill="${color}"/><path d="M8 6l2 4-2 2-2-2z" fill="#0004"/>`
    : `<path d="M2 14c3-6 6-6 9 0s6 6 11 0v7H2z" fill="${color}"/><circle cx="12" cy="6" r="3" fill="${color}"/>`}</svg>`;

/** The plan's risk, read from the choice's own words ("30% chance it's noticed"): the label without it, and the number. */
function riskOf(label: string): { text: string; noticed: number | null } {
  const m = /\s*\((\d+)% chance it[’']s noticed\)\s*$/.exec(label);
  return m ? { text: label.slice(0, m.index), noticed: Number(m[1]) } : { text: label, noticed: null };
}

/**
 * 7.6: the war room. A long table under a lamp with a drawn map of Hoenn on it; the leader at the head under the team's
 * banner, the lieutenants each side, and an empty chair for you. Plans are pins: the plan under the cursor lifts its
 * pin and a thread runs out to the empty hills.
 */
export function tableView(d: TableModel): string {
  const st = STYLE[d.look.team];
  const glow = d.look.team === 'magma' ? '#6a2416' : '#16385e';
  const moving = d.index < d.look.pins.length ? d.index : -1;
  const pin = (x: number, y: number, label: string, cls = '', head = ''): string =>
    `<div class="abs wr-pin ${cls}" style="left:${x}%;top:${y}%"><div class="wr-head" style="${head}"></div><div class="wr-needle"></div><div class="wr-tag">${esc(label)}</div></div>`;
  const pins = d.look.pins.map((p, i) => (i === moving
    ? `<div class="abs" style="left:${p.x}%;top:${p.y}%;width:18px;height:18px;margin:-20px 0 0 -9px;border-radius:50%;border:2px dashed ${st.head};opacity:.7"></div><div class="abs wr-tag" style="left:${p.x}%;top:${p.y}%;transform:translate(-50%,-2px);opacity:.6;text-decoration:line-through">${esc(p.label)}</div>`
    : pin(p.x, p.y, p.label))).join('');
  const from = moving >= 0 ? d.look.pins[moving]! : null;
  // Threads between the pins (the plans as they stand), and the one move under the cursor.
  const threads = d.look.pins.map((p, i) => { const q = d.look.pins[(i + 1) % d.look.pins.length]!; return `<line x1="${p.x}" y1="${p.y - 6}" x2="${q.x}" y2="${q.y - 6}" stroke="${st.head}" stroke-width="1.2" opacity=".35" vector-effect="non-scaling-stroke"/>`; }).join('');
  const move = from ? `<line class="wr-march" x1="${from.x}" y1="${from.y - 6}" x2="50" y2="46" stroke="${st.head}" stroke-width="2.5" stroke-dasharray="8 6" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : '';
  const target = from
    ? `<div class="abs wr-pulse" style="left:50%;top:50%;width:34px;height:34px;margin:-27px 0 0 -17px;border-radius:50%;box-shadow:0 0 0 2px ${st.head},0 0 14px 4px #fff"></div>${pin(50, 50, 'the empty hills', 'wr-bob', 'box-shadow:0 0 0 2px #fff,0 0 10px 3px #fff')}`
    : '<div class="abs" style="left:50%;top:50%;transform:translate(-50%,-50%);font-size:11px;color:#6b5a3a;font-style:italic">the empty hills</div>';
  // The map: sea, the land of Hoenn in a few strokes, its volcano, a grid and a compass rose.
  const land = '<path d="M7 31 16 16 31 12 40 20 51 14 62 18 71 30 68 46 71 60 62 75 51 70 43 80 31 75 23 84 14 75 9 55z" fill="#b9c78e" stroke="#6f7f4c" stroke-width="1" vector-effect="non-scaling-stroke"/><path d="M79 35 85 29 91 37 89 49 82 50zM81 65 87 62 92 71 86 80 80 76zM36 88 42 85 45 92 40 97z" fill="#b9c78e" stroke="#6f7f4c" stroke-width="1" vector-effect="non-scaling-stroke"/><path d="M20 30 24 20 28 30z" fill="#a0683c" stroke="#6b3e1c" stroke-width="1" vector-effect="non-scaling-stroke"/><path d="M40 44 44 37 48 44zM47 46 50 40 53 46z" fill="#8fa06a" stroke="#6f7f4c" stroke-width=".8" vector-effect="non-scaling-stroke"/>';
  const waves = [[6, 8], [70, 8], [88, 18], [4, 92], [58, 92], [74, 88], [94, 56]].map(([x, y]) => `<path d="M${x} ${y}q1.5-3 3 0t3 0" fill="none" stroke="#5b8fb0" stroke-width="1" opacity=".7" vector-effect="non-scaling-stroke"/>`).join('');
  const chart = `<svg class="fill" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="100" fill="#9cc4d8" opacity=".38"/>${[20, 40, 60, 80].map((v) => `<path d="M${v} 0V100M0 ${v}H100" stroke="#6b4a1c" stroke-width=".6" opacity=".25" vector-effect="non-scaling-stroke"/>`).join('')}${waves}${land}${threads}${move}</svg>`;
  const rose = `<svg class="abs" style="right:8px;bottom:6px" width="40" height="40" viewBox="-20 -20 40 40" aria-hidden="true"><circle r="13" fill="none" stroke="#6b4a1c" stroke-width="1.5" opacity=".7"/><path d="M0-18 4-4 18 0 4 4 0 18-4 4-18 0-4-4z" fill="#6b4a1c" opacity=".8"/><path d="M0-18 4-4-4-4z" fill="${st.head}"/></svg>`;
  const seat = (i: number, x: number, y: number, px: number, role: string): string =>
    `<div class="abs" style="left:${x}px;top:${y}px;width:120px;text-align:center"><div class="abs wr-chair" style="left:${60 - px * 0.36}px;top:${px * 0.22}px;width:${px * 0.72}px;height:${px * 0.82}px"></div>${i === 0 ? `<div class="abs wr-aura wr-pulse" style="left:${60 - px * 0.8}px;top:${-px * 0.2}px;width:${px * 1.6}px;height:${px * 1.4}px"></div>` : ''}<div style="position:relative">${art(d.files[i] ?? null, px)}</div><div style="position:relative;margin-top:2px"><span class="wr-plaque">${role ? `<b>${role}</b> · ` : ''}${esc(d.look.seats[i]?.name ?? '')}</span></div></div>`;
  const candle = (x: number, y: number): string => `<div class="abs" style="left:${x}px;top:${y}px;width:10px"><div class="wr-flame" style="margin:auto"></div><div style="width:8px;height:16px;margin:auto;background:linear-gradient(90deg,#f4ecd8,#cfc2a0);box-shadow:0 2px 0 #0006"></div></div>`;
  const cards = d.choices.map((c, k) => {
    const r = riskOf(c.label), isPin = k < d.look.pins.length;
    const risk = r.noticed === null ? '' : `<div class="wr-risk"><span>Noticed</span><i style="--r:${Math.min(100, r.noticed)}%"></i><b>${r.noticed}%</b></div>`;
    return `<div class="btn wr-card${k === d.index ? ' on' : ''}" style="--wh:${isPin ? st.head : '#7a7468'}"${pickAct(k)}>${esc(r.text)}${risk}</div>`;
  }).join('');
  const TX0 = 112, TY0 = 100, TW = 480, TH = 246;
  return (
    `<div class="fill wr-room" style="--wg:${glow};--wh:${st.head};--wm:${st.mark}"></div><div class="fill wr-boards"></div>` +
    // The wall behind the head of the table: the team's banner between two smaller ones, and two lamps.
    `<div class="abs wr-banner" style="left:${TX0 + TW / 2 - 62}px;top:0;width:124px;height:104px;--wh:${st.head};--wm:${st.mark}"></div>` +
    [TX0 + 34, TX0 + TW - 34 - 70].map((x) => `<div class="abs wr-banner" style="left:${x}px;top:0;width:70px;height:88px;--wh:${st.head};--wm:${st.mark}"><div style="display:flex;justify-content:center;padding-top:14px">${emblem(d.look.team, 38, st.mark)}</div></div>`).join('') +
    [TX0 - 34, TX0 + TW + 20].map((x) => `<div class="abs" style="left:${x}px;top:26px;width:14px"><div class="wr-flame" style="margin:auto"></div><div style="width:14px;height:6px;background:#c9a25a;box-shadow:0 2px 0 #0008"></div></div>`).join('') +
    `<div class="abs wr-rug" style="left:${TX0 - 54}px;top:${TY0 + 8}px;width:${TW + 108}px;height:${TH + 66}px;--wh:${st.head};--wm:${st.mark}"></div>` +
    seat(0, TX0 + TW / 2 - 60, 0, 80, 'LEADER') +
    `<div class="abs wr-table" style="left:${TX0}px;top:${TY0}px;width:${TW}px;height:${TH}px;--wh:${st.head};--wm:${st.mark}"><div class="abs wr-map" style="left:34px;top:30px;right:34px;bottom:30px">${chart}<div class="abs" style="left:8px;top:6px;opacity:.5">${emblem(d.look.team, 22, st.head)}</div>${rose}${pins}${target}</div></div>` +
    candle(TX0 + 12, TY0 + 4) + candle(TX0 + TW - 22, TY0 + TH - 40) +
    `<div class="abs wr-lamp" style="left:${TX0 - 60}px;top:${TY0 - 50}px;width:${TW + 120}px;height:${TH + 100}px"></div>` +
    seat(1, TX0 - 122, TY0 + 62, 76, '') + seat(2, TX0 + TW + 2, TY0 + 62, 76, '') +
    `<div class="abs" style="left:${TX0 + TW / 2 - 50}px;top:${TY0 + TH + 6}px;width:100px;text-align:center"><div class="wr-chair wr-pulse" style="width:74px;height:40px;margin:auto;box-shadow:inset 0 0 0 2px ${st.mark},0 0 14px 3px ${st.mark}88"></div><div style="margin-top:3px"><span class="wr-plaque">your chair</span></div></div>` +
    [[150, 300, 0], [240, 150, 2.1], [330, 330, 4.4], [420, 200, 1.2], [520, 310, 3.3], [600, 170, 5.6], [90, 210, 6.4], [470, 120, 7.3]].map(([x, y, dl]) => `<i class="abs wr-mote" style="left:${x}px;top:${y}px;--d:-${dl}s;--wm:${d.look.team === 'magma' ? '#ffb060' : '#bfe6ff'}"></i>`).join('') +
    '<div class="fill wr-vig"></div>' +
    `<div class="abs col" style="left:716px;right:16px;top:52px;gap:8px"><div class="wr-ribbon" style="align-self:flex-start;font-size:13px;line-height:18px;white-space:nowrap"><b>Next week’s work</b> · one change</div>${cards}</div>` +
    `<div class="abs txt" style="left:20px;right:260px;bottom:10px;font-size:14px">${esc(d.text)}</div>`
  );
}
