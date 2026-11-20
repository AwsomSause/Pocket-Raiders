// Phantom UI: the map's pop pages. The Rival Report is the mock-ups' `rivals` page (a list, the rival's bust and
// a file); the Dossier, Field Notes, Notebook and Town Roll have no mock-up of their own, so they are drawn from the
// same parts: slanted tabs, lit blades, tilted paper and cut-out titles. They draw the New UI pop-ups' models
// (ui/redux/screens/popups.ts) and call the same handlers (`pop`, `popTab`, `popPick`). Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxAtlas } from '../../redux/assets';
import { figure } from '../../redux/templates';
import { leadLine, listWindow, type BookModel, type DossierModel, type DossierPerson, type ReportModel, type RollCard, type RollModel, type TrackModel } from '../../redux/screens/popups';
import { act, esc, keys, mon, page, ransom } from '../kit';

/** A sprite fitted inside a square box, or scaled to a height. */
const boxed = (file: string, box: number, cls = ''): string => { const a = rxAtlas(file); return a ? mon(file, Math.round((box / Math.max(a.sw, a.sh)) * 100) / 100, cls) : ''; };
const high = (file: string, h: number, cls = '', st = ''): string => { const a = rxAtlas(file); return a ? mon(file, Math.round((h / Math.max(1, a.f[0]?.[3] ?? a.sh)) * 100) / 100, cls, st) : ''; };
/** A click anywhere off the panels closes the pop page, as in the New UI. */
const shut = `<div class="ph-pop-shut"${act('pop')}></div>`;
const ground = (cp: string, x: number, y: number): string => `<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(${cp});inset:0" aria-hidden="true"></div><div class="burst" style="--x:${x}%;--y:${y}%" aria-hidden="true"></div>`;
const head = (small: string, title: string): string => `<div class="hd"><small>${esc(small)}</small>${esc(title)}</div>`;
const dl = (f: readonly (readonly [string, string])[]): string => `<dl class="ph-dl">${f.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>`;
const pips = (n: number, of: number): string => `<span class="pips" aria-label="${n} of ${of}">${Array.from({ length: of }, (_, k) => `<i class="${k < n ? 'f' : ''}"></i>`).join('')}</span>`;
const tabs = (names: readonly string[], on: number): string => `<div class="pockets ph-tabs ph-pop-tabs">${names.map((t, k) => `<span class="${k === on ? 'on' : ''}"${act('popTab', k)}>${esc(t)}</span>`).join('')}</div>`;

// ---------- Rival Report ----------

/** The Rival Report (mock-up `rivals`): every rival on your trail, the picked one's bust, the lead and what they feel. */
export function phReport(_ph: PhantomVersion, d: ReportModel): string {
  const n = d.rivals.length;
  const list = d.rivals.map((name, k) => `<div class="rv pn${k === d.pick ? ' lt on' : ''}" style="--i:${k}" data-key="rv${k}"${act('popPick', k)}><span class="av ph-rv-av">${esc(name.charAt(0))}</span><b>${esc(name)}</b><span>${k === d.pick ? esc(d.tag) : 'Rival'}</span></div>`).join('');
  const bust = d.art ? `<div class="rv-bust ph-rv-bust" data-key="bust${d.pick}" aria-hidden="true">${high(d.art, 520, 'sh', 'position:absolute;left:14px;top:12px')}${high(d.art, 520, 'ol', 'position:relative')}</div>` : '';
  const meter = `<div class="ph-lead" aria-label="${esc(leadLine(d.name, d.lead))}">${[-3, -2, -1, 0, 1, 2, 3].map((v) => `<i class="${v === d.lead ? 'on' : ''}${v < 0 ? ' me' : v > 0 ? ' them' : ''}"><b>${v > 0 ? '+' + v : v}</b></i>`).join('')}</div><div class="ph-lead-k"><span>You lead</span><span>Rival leads</span></div>`;
  const info = `<div class="rv-info pn ph-rv-info" data-key="info${d.pick}"><span class="lab">Rival · ${esc(d.tag)}</span><h3 class="tl1" style="font-size:${d.name.length > 9 ? 40 : 58}px">${esc(d.name)}</h3><p class="rv-q">${esc(leadLine(d.name, d.lead))}</p>${meter}${dl(d.facts)}<p class="txt rv-n">Losing to a rival never ends your run.</p></div>`;
  const feel = d.feelings.map(([name, p]) => `<div class="ph-feel"><span>${esc(name)}</span><i><b style="width:${Math.max(0, Math.min(100, Math.round(p)))}%"></b></i></div>`).join('');
  const marks = d.marks.length ? d.marks.map((t) => `<em>${esc(t)}</em>`).join('') : '<small>No marks yet</small>';
  const more = `<div class="pn lt ph-rv-more" data-key="more${d.pick}"><div><span class="lab">Feelings</span>${feel}</div><div><span class="lab">Meetings</span>${dl(d.meetings)}<div class="ph-marks">${marks}</div></div></div>`;
  return page('rivals', ground('36% 0,72% 0,60% 100%,30% 100%', 52, 55) + shut
    + head(`${n} ${n === 1 ? 'rival is' : 'rivals are'} on your trail`, 'Rival Report')
    + `<div class="rv-big" aria-hidden="true">${n}</div>${bust}<div class="rv-list ph-rv-list">${list}</div>${info}${more}`
    + keys(...(n > 1 ? [['▲▼', 'Rival'] as const] : []), ['R', 'Close', 'pop']));
}

// ---------- Dossier ----------

/** The Dossier: one folder per team as tabs, the chain of command as rows of faces, and the picked person's case file. */
export function phDossier(_ph: PhantomVersion, d: DossierModel): string {
  const widest = Math.max(1, ...d.rows.map((r) => r.people.length));
  const cell = Math.max(40, Math.min(116, Math.floor(600 / widest) - 10, Math.floor(430 / Math.max(1, d.rows.length)) - 34));
  const face = (p: DossierPerson, size: number): string => (p.file ? figure(p.file, size) : d.shade ? boxed(d.shade, size, 'ph-sil') : '');
  const rows = d.rows.map((r, q) => `<div class="ph-dos-rank" style="--i:${q}"><small>${esc(r.label)}</small><div>${r.people.map((i) => { const p = d.people[i]!; return `<div class="ph-dos-p${i === d.pick ? ' on' : ''}" style="width:${cell}px" title="${esc(p.name)}"${act('popPick', i)}><i style="height:${cell}px">${face(p, cell - 8)}</i>${cell >= 60 ? `<b>${esc(p.name)}</b>` : ''}</div>`; }).join('')}</div></div>`).join('');
  const sel = d.people[d.pick] ?? d.people[0];
  const f = d.file;
  const file = sel
    ? `<div class="pn lt tilt ph-dos-file" style="--r:1.2deg" data-key="file${d.tab}:${d.pick}"><div class="ph-dos-top"><i>${face(sel, 130)}</i><div><h3 class="tl1" style="font-size:${f.name.length > 16 ? 26 : f.name.length > 10 ? 34 : 44}px">${esc(f.name)}</h3><span class="ph-stamp">${esc(f.mark)}</span></div></div>${dl(f.facts)}<p class="ph-dos-q">Overheard: “${esc(f.voice)}”</p>${f.note ? `<p class="ph-dos-n"><b>${esc(f.noteTitle)}</b> ${esc(f.note)}</p>` : ''}</div>`
    : '';
  return page('dossier', ground('0 0,30% 0,46% 100%,0 100%', 30, 60) + shut
    + head(`${d.people.length} on file · ${d.tabs[d.tab] ?? ''}`, 'Dossier') + tabs(d.tabs, d.tab)
    + `<div class="ph-dos-chain" data-key="chain${d.tab}">${rows}</div>${file}`
    + keys(...(d.tabs.length > 1 ? [['◀▶', 'Folder'] as const] : []), ['▲▼', 'Person'], ['D', 'Close', 'pop']));
}

// ---------- Field Notes ----------

export const PH_BOOK_ROWS = 8;

/** Field Notes: the tabs along the top, the entries as a list of blades, and the picked entry's page. */
export function phBook(_ph: PhantomVersion, d: BookModel): string {
  const s = d.entries[d.pick];
  const w = listWindow(d.entries.length, d.pick, PH_BOOK_ROWS);
  const list = d.entries.length
    ? d.entries.slice(w.from, w.to).map((e, k) => { const i = w.from + k; return `<div class="ph-nb-row${i === d.pick ? ' on' : ''}${e.known ? '' : ' unk'}" style="--i:${k}" data-key="nb${d.tab}:${i}"${act('popPick', i)}><i>${e.file ? boxed(e.file, 40) : '<s>?</s>'}</i><b>${esc(e.name)}</b><small>${esc(e.badge)}</small></div>`; }).join('')
    : `<div class="pn ph-nb-none"><p class="txt">${esc(d.empty)}</p></div>`;
  const count = d.tabs[d.tab]?.count ?? '';
  const more = d.entries.length > PH_BOOK_ROWS ? `<div class="ph-nb-more">${d.pick + 1} of ${d.entries.length}</div>` : '';
  const long = !!s && s.lines.join('').length > 150;
  const card = s
    ? `<div class="pn lt ph-nb-card" data-key="card${d.tab}:${d.pick}"><div class="ph-nb-pic${d.shadow ? ' sh' : ''}">${s.file ? boxed(s.file, long ? 120 : 170) : '<s>?</s>'}</div><h3 class="tl1" style="font-size:${s.name.length > 14 ? 30 : 42}px">${esc(s.name)}</h3><span class="lab">${esc(s.badge)}</span>${s.lines.map((t) => `<p class="txt" style="font-size:${long ? 16 : 19}px">${esc(t)}</p>`).join('')}${s.pips !== null ? `<div class="ph-nb-pips"><small>Clues</small>${pips(s.pips, 3)}</div>` : ''}${s.obtain ? `<p class="ph-nb-get">${esc(s.obtain)}</p>` : ''}</div>`
    : '';
  return page('notes', ground('58% 0,100% 0,100% 100%,70% 100%', 76, 40) + shut
    + head(`${d.tabs[d.tab]?.name ?? ''} · ${count}`, 'Field Notes') + tabs(d.tabs.map((t) => t.short), d.tab)
    + `<div class="ph-nb-list" data-key="list${d.tab}">${list}${more}</div>${card}<div class="pn ph-nb-help"><p class="txt">${esc(d.help)}</p></div>`
    + keys(['◀▶', 'Tab'], ['▲▼', 'Entry'], ['F', 'Close', 'pop']));
}

// ---------- Notebook track page ----------

/** The Notebook: an evil team's plan as numbered steps on a line, how much of it you have seen, and what moves next. */
export function phTrack(_ph: PhantomVersion, d: TrackModel): string {
  const cur = Math.max(0, d.steps.findIndex((s) => s.state === 'now'));
  const now = d.steps[cur];
  const steps = d.steps.map((s, k) => `<div class="ph-tk-s ${s.state}" style="--i:${k}"><i><u>${s.n}</u></i><b>${esc(s.name || '???')}</b></div>`).join('');
  const fill = d.steps.length > 1 ? Math.round((cur / (d.steps.length - 1)) * 100) : 0;
  const scales = d.scales.map((s) => `<div class="ph-tk-sc${s.seen ? '' : ' no'}"><b>${esc(s.head)}</b><em>${s.seen ? 'Seen' : 'Not yet'}</em>${s.seen && s.text ? `<span>${esc(s.text)}</span>` : ''}</div>`).join('');
  return page('track', ground('0 0,100% 0,100% 34%,0 52%', 50, 30) + shut
    + head(d.kicker, 'Notebook')
    + `<div class="ph-tk-ttl">${ransom(d.title.toUpperCase().slice(0, 22), 5)}</div>`
    + `<div class="pn lt ph-tk-line"><div class="ph-tk-bar"><i style="width:${fill}%"></i></div><div class="ph-tk-steps">${steps}</div></div>`
    + `<div class="pn ph-tk-a"><div class="ph-tk-seen"><span class="lab">How much you’ve seen</span>${pips(d.seen, 5)}</div>${scales}</div>`
    + `<div class="pn lt tilt ph-tk-b" style="--r:-1.2deg"><span class="lab">${now ? `Step ${now.n}` : 'Quiet'}</span><h3 class="tl1">${now ? esc(now.name || '???') : 'Nothing has moved yet'}</h3>${now?.rule ? `<p class="txt">${esc(now.rule)}</p>` : ''}${d.civilian ? `<p class="ph-tk-civ"><b>Civilians say</b> ${esc(d.civilian)}</p>` : ''}</div>`
    + `<div class="pn ph-tk-next"><p class="txt">${esc(d.next)}</p></div>`
    + keys(['T', 'Close', 'pop']));
}

// ---------- Town Roll ----------

const ROLL_WORD: Record<RollCard['state'], string> = { star: 'Always here', dice: 'Rolled', open: 'Unlocked', off: 'Not this run' };
const DICE = '⚄⚁⚅⚂⚀⚃';

/** The Town Roll: a card per space the town has this run (starred, rolled or unlocked) and the ones left out as dim tags. */
export function phRoll(_ph: PhantomVersion, d: RollModel): string {
  let die = 0;
  const glyph = d.cards.map((c) => (c.state === 'star' ? '★' : c.state === 'dice' ? DICE[die++ % DICE.length]! : c.state === 'open' ? '!' : '·'));
  const on = d.cards.map((card, k) => ({ card, k })).filter((x) => x.card.state !== 'off' || d.cards.length <= 4);
  const off = d.cards.map((card, k) => ({ card, k })).filter((x) => x.card.state === 'off' && d.cards.length > 4);
  const mid = (on.length - 1) / 2, slim = on.length > 4;
  const cards = on.map(({ card, k }, q) => `<div class="ph-rl-c ${card.state}${k === d.index ? ' on' : ''}${slim ? ' slim' : ''}" style="--i:${q};--r:${((q % 4 - Math.min(3, mid)) * (slim ? 1 : 2.5)).toFixed(1)}deg" data-key="rl${k}"${act('popPick', k, 'popOver')}><i>${glyph[k]}</i><b>${esc(card.name)}</b><em>${ROLL_WORD[card.state]}</em><span>${esc(card.note)}</span></div>`).join('');
  const left = off.length ? `<div class="ph-rl-off"><small>${ROLL_WORD.off}</small>${off.map(({ card, k }) => `<span class="${k === d.index ? 'on' : ''}"${act('popPick', k, 'popOver')}>${esc(card.name)}</span>`).join('')}</div>` : '';
  const count = `${d.rolled} of ${d.optional} optional spaces placed on the map`;
  return page('roll', ground('0 62%,100% 40%,100% 100%,0 100%', 50, 45)
    + head(`${d.town}${d.page ? ` · Town ${d.page[0]} of ${d.page[1]}` : ''}`, 'Town Roll')
    + `<div class="ph-rl-ttl">${ransom('THE ROLL', 11)}</div>`
    + `<div class="ph-rl-cs${slim ? ' two' : ''}" style="--n:${Math.min(4, Math.max(1, on.length))}">${cards}</div>${left}`
    + `<div class="ph-rl-count">${esc(count)}</div><div class="pn lt ph-rl-say"><p class="txt" style="font-size:${d.text.length > 150 ? 16 : 20}px">${esc(d.text)}</p></div>`
    + keys(['◀▶', 'Space'], ['Enter', 'To the map', 'pop']));
}
