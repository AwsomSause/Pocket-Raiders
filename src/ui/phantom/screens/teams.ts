// Phantom UI: the team's own moments (HOENN_TEAMS part 7): the Mission Briefing, the Leader's Table, the Final
// Choice, the filed Result and the Rank-Up (the mock-up's `rankup` page). Pure functions from the New UI's own models
// (ui/redux/screens/evilLooks.ts) to HTML; EventScene keeps the state, the input, the hold and the outcome.

import type { RankUpLook, ResultLook } from '../../../core/evil/screens';
import type { PhantomVersion } from '../../../core/presentation/phantom';
import { type BriefingModel, type FinalModel, type TableModel, warChart } from '../../redux/screens/evilLooks';
import { type Art, figure } from '../../redux/templates';
import { act, esc, keys, page, ransom } from '../kit';

/** Each team's two colours: the band and the mark. */
const TEAM = { magma: ['#c8321e', '#f0b020', 'Team Magma'], aqua: ['#1f6fd0', '#7fd8ff', 'Team Aqua'] } as const;
const vars = (team: 'magma' | 'aqua'): string => `--tc:${TEAM[team][0]};--tm:${TEAM[team][1]}`;
const other = (team: 'magma' | 'aqua'): 'magma' | 'aqua' => (team === 'magma' ? 'aqua' : 'magma');

/** A person `px` tall, or a plain silhouette when the art is missing. */
const who = (a: Art | null | undefined, px: number): string => (a ? figure(a, px) : '') || `<i class="ph-tm-sil" style="width:${Math.round(px * 0.55)}px;height:${px}px"></i>`;
/** "Standing +2" as its words and its number. */
const split = (x: string): [string, string] => { const name = x.replace(/ [+−-]?₽?\d.*$/, ''); return [name, x.slice(name.length).trim()]; };
/** The plan's risk, read from the choice's own words ("30% chance it's noticed"). */
const riskOf = (label: string): { text: string; noticed: number | null } => {
  const m = /\s*\((\d+)% chance it[’']s noticed\)\s*$/.exec(label);
  return m ? { text: label.slice(0, m.index), noticed: Number(m[1]) } : { text: label, noticed: null };
};
const fit = (text: string, big: number, small: number, at: number): number => Math.max(small, Math.min(big, Math.round(big * Math.sqrt(at / Math.max(1, text.length)))));

/** 7.3: the order as a sheet of cards, one per way of doing it, every number first; a double agent's tip stands apart in the other team's colour. */
export function phBriefing(_ph: PhantomVersion, d: BriefingModel): string {
  const L = d.look, n = d.choices.length;
  const cards = d.choices.map((c, k) => {
    const tip = L.tip !== null && k >= L.tip;
    const rows = (L.numbers[k] ?? (tip ? ['Suspicion +2', 'Kindness +1'] : [])).map(split);
    const r = riskOf(c.label);
    const risk = r.noticed === null ? '' : `<div class="ph-tm-risk"><span>Noticed</span><i style="--p:${Math.min(100, r.noticed)}%"></i><b>${r.noticed}%</b></div>`;
    return `<div class="ph-bf-c${k === d.index ? ' on' : ''}${c.locked ? ' off' : ''}${tip ? ' tip' : ''}" data-key="bf${k}" style="--i:${k};--r:${((k - (n - 1) / 2) * 1.6).toFixed(1)}deg${tip ? `;${vars(other(L.team))}` : ''}"${act('pick', k, 'over')}>`
      + `<kbd>${k + 1}</kbd>${tip ? '<em>The other side</em>' : ''}<b style="font-size:${fit(r.text, 30, 20, 34)}px">${esc(r.text)}</b>`
      + `<p style="font-size:${c.sub.length > 90 ? 14 : 16}px">${esc(c.sub)}</p>${risk}`
      + `<dl>${rows.map(([a, b]) => `<dt>${esc(a)}</dt><dd class="${/^[−-]/.test(b) ? 'bad' : ''}">${esc(b)}</dd>`).join('')}</dl></div>`;
  }).join('');
  return page('brief', `<div class="ph-tm ${L.team}" style="${vars(L.team)}"><div class="bgk"></div><div class="shard" style="--c:var(--tc);--cp:polygon(0 0,34% 0,22% 100%,0 100%);inset:0" aria-hidden="true"></div>`
    + `<div class="hd"><small>Order ${String(L.order).padStart(2, '0')} · issued by ${esc(L.by)}</small>${esc(L.title)}</div>`
    + `<div class="pn lt tilt ph-bf-q" style="--r:2deg"><p class="txt" style="font-size:${fit(L.quote, 24, 16, 70)}px">“${esc(L.quote)}”</p><span class="lab">${esc(L.by)}</span></div>`
    + `<div class="ph-bf-cols">${cards}</div>`
    + `<div class="pn ph-bf-say"><span class="lab">The order</span><p class="txt" style="font-size:${d.text.length > 330 ? 15 : d.text.length > 200 ? 17 : 19}px">${esc(d.text)}</p>${L.withYou ? `<p class="ph-bf-with"><b>With you</b>${esc(L.withYou)}</p>` : ''}</div>`
    + keys(['◀▶', 'Choose'], ['Enter', 'Confirm', 'pick', d.index]) + '</div>');
}

/** 7.6: the war room. The map of Hoenn with the plans as pins, the leader at the head of the table, the lieutenants beside, and your empty chair. */
export function phTable(_ph: PhantomVersion, d: TableModel): string {
  const L = d.look, moving = d.index < L.pins.length ? d.index : -1;
  const pin = (x: number, y: number, label: string, cls = ''): string => `<div class="ph-tb-pin ${cls}" style="left:${x}%;top:${y}%"><i></i><span>${esc(label)}</span></div>`;
  const pins = L.pins.map((p, i) => pin(p.x, p.y, p.label, i === moving ? 'gone' : '')).join('') + (moving >= 0 ? pin(50, 50, 'the empty hills', 'to') : '<em class="ph-tb-hills">the empty hills</em>');
  const seat = (i: number, px: number, role: string): string => `<div class="ph-tb-seat s${i}" style="--i:${i}">${who(d.files[i], px)}<span>${role ? `<b>${role}</b>` : ''}${esc(L.seats[i]?.name ?? '')}</span></div>`;
  const plans = d.choices.map((c, k) => {
    const r = riskOf(c.label);
    return `<div class="ph-tb-plan${k === d.index ? ' on' : ''}${c.locked ? ' off' : ''}${k < L.pins.length ? '' : ' plain'}" data-key="tb${k}" style="--i:${k};--r:${-3 + k}deg;font-size:${fit(r.text, 26, 17, 22)}px"${act('pick', k, 'over')}>${esc(r.text)}${r.noticed === null ? '' : `<div class="ph-tm-risk"><span>Noticed</span><i style="--p:${Math.min(100, r.noticed)}%"></i><b>${r.noticed}%</b></div>`}</div>`;
  }).join('');
  return page('table', `<div class="ph-tm ${L.team}" style="${vars(L.team)}"><div class="bgk"></div><div class="ph-tb-lamp" aria-hidden="true"></div><div class="shard" style="--c:var(--tc);--cp:polygon(64% 0,100% 0,100% 100%,74% 100%);inset:0" aria-hidden="true"></div>`
    + `<div class="hd"><small>${TEAM[L.team][2]} · the war room</small>The Leader’s Table</div>`
    + `<div class="ph-tb-seats">${seat(0, 150, 'Leader')}${seat(1, 120, '')}${seat(2, 120, '')}</div>`
    + `<div class="pn lt tilt ph-tb-map" style="--r:-2deg"><div class="ph-tb-chart">${warChart(L, moving, TEAM[L.team][0])}${pins}</div></div>`
    + '<div class="ph-tb-chair"><i></i><span>your chair</span></div>'
    + `<div class="ph-tb-plans"><span class="lab">Next week’s work · one change</span>${plans}</div>`
    + `<div class="pn ph-tb-say"><p class="txt" style="font-size:${d.text.length > 260 ? 15 : d.text.length > 150 ? 17 : 19}px">${esc(d.text)}</p></div>`
    + keys(['▲▼', 'Choose'], ['Enter', 'Confirm', 'pick', d.index]) + '</div>');
}

/** 7.7 / 7.14: the page falls away. Black, the orb (or the sky from the bottom of a well), four corners, a ring of faces, and a hold that fills. */
export function phFinal(_ph: PhantomVersion, d: FinalModel): string {
  const L = d.look, pct = Math.round(Math.max(0, Math.min(1, d.hold)) * 100);
  const corners = d.choices.slice(0, 4).map((c, k) => {
    const on = k === d.index;
    return `<div class="ph-fc-c c${k}${on ? ' on' : ''}${c.locked ? ' off' : ''}" data-key="fc${k}" data-over="over" data-arg="${k}" data-hold="${k}"${on ? ' data-on="1"' : ''}><b style="font-size:${fit(c.label, 34, 20, 16)}px">${esc(c.label.replace(/\.$/, ''))}</b><p>${esc(L.says[k] ?? '')}</p>${c.locked ? `<small>Needs: ${esc(c.sub)}</small>` : ''}</div>`;
  }).join('');
  const n = L.faces.length;
  const ring = L.faces.map((f, i) => {
    const a = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2, k = f.apart ? 1.12 : 1;
    const x = 640 + Math.cos(a) * 250 * k, y = 352 + Math.sin(a) * 262 * k;
    return `<div class="ph-fc-f ${f.react[d.index] ?? ''}${f.apart ? ' apart' : ''}" style="left:${Math.round(x)}px;top:${Math.round(y)}px;--lx:${((640 - x) * 0.08).toFixed(1)}px;--ly:${((352 - y) * 0.08).toFixed(1)}px">${who(d.files[i], 72)}<span>${esc(f.name)}</span></div>`;
  }).join('');
  const centre = L.centre === 'sky' ? '<div class="ph-fc-orb sky"><i></i></div>' : `<div class="ph-fc-orb ${L.centre}"></div><div class="ph-fc-stand"></div>`;
  return page('final', `<div class="ph-fc" style="--h:${pct / 100}"><div class="ph-fc-black"></div><div class="ph-fc-title">${esc(d.title)}</div>`
    + `<div class="ph-fc-ringbar" style="--p:${pct}%" aria-hidden="true"></div>${centre}${ring}${corners}`
    + `<div class="ph-fc-hold${pct > 0 ? ' go' : ''}">${pct > 0 ? `Holding… ${pct}%` : 'Hold <kbd>Enter</kbd> (or press and hold) to choose. Letting go cancels.'}</div></div>`, false);
}

/** 7.4: the report as filed: what was done, what changed, and one human line in plain black on white. It stays until an input. */
export function phFiled(_ph: PhantomVersion, r: ResultLook, next: string): string {
  const magma = r.team === 'magma';
  return page('filed', `<div class="ph-tm ${r.team}" style="${vars(r.team)}"><div class="bgk"></div><div class="shard" style="--c:var(--tc);--cp:polygon(58% 0,100% 0,100% 100%,42% 100%);inset:0" aria-hidden="true"></div><div class="ph-fill"${act('next')}></div>`
    + `<div class="hd"><small>${TEAM[r.team][2]}</small>${magma ? 'Mission report' : 'Ship’s log'}</div>`
    + `<div class="pn lt tilt ph-fd-paper" style="--r:-2deg"${act('next')}><span class="lab">Done</span><p class="txt ph-fd-done" style="font-size:${fit(r.done, 30, 19, 60)}px">${esc(r.done)}</p>`
    + `<span class="lab">Changed</span><div class="ph-fd-ch">${(r.changed.length ? r.changed : ['nothing']).map((t, i) => `<span style="--i:${i}">${esc(t)}</span>`).join('')}</div>`
    + `<div class="ph-fd-stamp" aria-hidden="true">${magma ? 'Filed' : 'Logged'}</div></div>`
    + (r.voice ? `<div class="ph-fd-voice"${act('next')}><p style="font-size:${fit(r.voice, 24, 17, 90)}px">${esc(r.voice)}</p></div>` : '')
    + `<div class="sy-wait ph-ev-stay"${act('next')}><i aria-hidden="true"></i><kbd>Z</kbd><span>Stays until you press Z</span></div>`
    + keys(['Z', next, 'next']) + '</div>');
}

/** 7.2: the rank-up as the mock-up's RANK UP page: who pins it on, the new rank over the old, what it opens, and the team in rows behind (rank 6 is the leader's office: no crowd). */
export function phTeamRank(_ph: PhantomVersion, r: RankUpLook, files: { leader: Art | null; lt: Art | null; grunt: Art | null }, next: string): string {
  const giver = r.byLeader || r.office ? files.leader : files.lt;
  const conf = Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 71) % 100}%;--d:${((i * 0.37) % 0.9).toFixed(2)}s;--r:${i * 47}deg"></i>`).join('');
  const crowd = r.office ? '' : `<div class="ph-ru-crowd" aria-hidden="true">${Array.from({ length: 3 }, (_, row) => `<div style="--row:${row}">${Array.from({ length: 9 + row * 2 }, (_, i) => `<span class="${row === 0 && i === 1 && r.bunkFront ? 'mate' : ''}" style="--i:${i}">${who(files.grunt, 76 - row * 10)}</span>`).join('')}</div>`).join('')}</div>`;
  const max = Math.max(6, r.rank);
  const how = r.office ? 'In the leader’s office' : r.byLeader ? 'Pinned by the leader' : 'Pinned by the lieutenant';
  return page('rankup', `<div class="ph-tm" style="--tc:${esc(r.color)}"><div class="bgr"></div><div class="burst" style="--x:62%;--y:50%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div><div class="shard" style="--c:var(--tc);--cp:polygon(0 0,44% 0,24% 100%,0 100%);inset:0" aria-hidden="true"></div>`
    + `<div class="ph-fill"${act('next')}></div><div class="ru-conf" aria-hidden="true">${conf}</div>${crowd}`
    + `<div class="ru-t">${ransom('RANK', 3)}${ransom('UP!', 11)}</div>`
    + `<div class="ru-card tilt" style="--r:6deg"><span class="lab">${esc(r.team)}</span><div class="ru-pic">${who(giver, 250)}</div><h3 class="tl1" style="font-size:${fit(r.title, 34, 20, 14)}px">${esc(r.title)}</h3><span class="pips" aria-label="rank ${r.rank} of ${max}">${Array.from({ length: max }, (_, k) => `<i class="${k < r.rank ? 'f' : ''}"></i>`).join('')}</span></div>`
    + `<div class="ru-n"><s>${Math.max(0, r.rank - 1)}</s><b>${r.rank}</b></div>`
    + `<div class="pn ru-say tilt ph-ru-say" style="--r:-1.5deg"${act('next')}><span class="lab">${how}${r.bunkFront ? ' · your bunkmate in the front row' : ''}</span>${r.unlocks.length ? `<ul>${r.unlocks.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : '<p class="txt">The team looks at you a little differently now.</p>'}<em aria-hidden="true">▼</em></div>`
    + keys(['Z', next, 'next']) + '</div>');
}
