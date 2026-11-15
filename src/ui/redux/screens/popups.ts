// New UI map pop-ups, ported from the mock-ups' Beta 0.6 templates (redux-06.js): the Dossier (case folders with the
// org pyramid), Field Notes (the book), the Notebook's track page and the Rival Report. Pure drawing: MapScene keeps
// the state and the input, and the words come from the same core views the old pop-ups read.

import { act, esc, facts, H, hpb, mini, tall, TX, W } from '../kit';
import type { ReduxCtx } from '../stage';

const paper = (h: string, st = ''): string => `<div style="background:var(--pa);color:var(--pai);padding:16px 18px;box-shadow:0 0 0 3px var(--l),6px 6px 0 #0005;${st}">${h}</div>`;
const pips = (n: number, of = 3): string => `<span style="flex:none">${Array.from({ length: of }, (_, k) => `<i style="display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:4px;background:${k < n ? 'var(--acc)' : '#0000'};box-shadow:0 0 0 2px var(--tf)"></i>`).join('')}</span>`;
const clip = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0';
const back = (name: string): string => `<div class="fill"${act(name)}></div>`;

/** The rows of a long list that show around the picked one. */
export function listWindow(count: number, pick: number, rows: number): { from: number; to: number } {
  const from = Math.max(0, Math.min(count - rows, pick - Math.floor(rows / 2)));
  return { from, to: Math.min(count, from + rows) };
}

// ---------- Dossier ----------

export interface DossierPerson { name: string; rank: string; file: string | null }
export interface DossierModel {
  tabs: string[];
  tab: number;
  /** The open folder's people, highest rank first. */
  people: DossierPerson[];
  /** The chain of command: one row per rank that has someone, top rank first; numbers index `people`. */
  rows: { label: string; people: number[] }[];
  pick: number;
  file: { name: string; mark: string; facts: [string, string][]; voice: string; noteTitle: string; note: string };
  /** A trainer picture drawn as a dark shape for people the game has no picture of. */
  shade: string | null;
}

export const DOSSIER_ROWS = 6;

/** How big the pyramid's faces are, so every rank row fits between the tabs and the text box. */
export function pyramidFace(rows: number, widest: number): { face: number; cell: number; names: boolean } {
  const byHeight = Math.floor((330 - 10 * Math.max(0, rows - 1)) / Math.max(1, rows)) - 26;
  const cell = Math.min(86, Math.floor((500 - 10 * Math.max(0, widest - 1)) / Math.max(1, widest)));
  const face = Math.max(16, Math.min(44, byHeight, cell - 12));
  return { face, cell, names: face >= 30 && cell >= 64 };
}

export function dossierView(c: ReduxCtx, d: DossierModel): string {
  const v = c.v(2);
  const face = (p: DossierPerson, size: number): string => (p.file ? mini(p.file, size) : d.shade ? mini(d.shade, size, 'sil') : '');
  const sel = d.people[d.pick] ?? d.people[0];
  const small = d.tabs.join('').length > 56;
  const tabs = `<div class="abs tabs" style="left:24px;top:62px;max-width:912px;overflow:hidden">${d.tabs.map((t, k) => `<span class="${k === d.tab ? 'on' : ''}" style="cursor:pointer;white-space:nowrap${small ? ';font-size:12px;padding:6px 8px' : ''}"${act('popTab', k)}>${esc(t)}</span>`).join('')}</div>`;
  const f = d.file;
  const file = sel
    ? paper(
        `<div class="row" style="align-items:flex-start;gap:16px"><div style="width:120px;height:120px;flex:none;background:#0002;display:flex;align-items:center;justify-content:center;overflow:hidden">${face(sel, 110)}</div><div class="col grow" style="gap:6px;min-width:0"><div class="row" style="min-width:0"><b style="font-size:${f.name.length > 14 ? 18 : 24}px;${clip}">${esc(f.name)}</b><span class="tg">${esc(f.mark)}</span></div>${facts(f.facts)}</div></div><div style="margin-top:10px;font-style:italic;line-height:22px">Overheard: “${esc(f.voice)}”</div>${f.note ? `<div style="margin-top:8px;font-size:12px;line-height:17px;border-left:4px solid var(--tf);padding-left:8px"><b>${esc(f.noteTitle)}</b><br>${esc(f.note)}</div>` : ''}`,
        'transform:rotate(.6deg)',
      )
    : '';
  const head = back('pop') + H('Dossier', 'map', [['◀ ▶', 'folder'], ['▲ ▼', 'person'], ['D', 'close']]) + tabs;
  if (v === 1) {
    const widest = Math.max(1, ...d.rows.map((r) => r.people.length));
    const s = pyramidFace(d.rows.length, widest);
    const rows = d.rows.map((r) => `<div class="row" style="gap:${s.cell < 40 ? 4 : 10}px">${r.people.map((i) => { const p = d.people[i]!; return W(`${face(p, s.face)}${s.names ? `<span style="font-size:12px;max-width:100%;${clip}">${esc(p.name)}</span>` : ''}`, `width:${s.cell}px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px;cursor:pointer;overflow:hidden`, i === d.pick ? 'sel' : '', act('popPick', i)); }).join('')}</div>`).join('');
    return head + `<div class="abs col cen" style="left:24px;width:500px;top:106px;gap:10px">${rows}<span class="sm">${esc(d.rows.map((r) => r.label).join(' · '))}</span></div><div class="abs" style="left:548px;right:26px;top:112px">${file}</div>` + TX('The pyramid fills in as you meet people. A dark shape is someone the files have no picture of.');
  }
  const w = listWindow(d.people.length, d.pick, DOSSIER_ROWS);
  const list = d.people.slice(w.from, w.to).map((p, k) => { const i = w.from + k; return `<div class="btn${i === d.pick ? ' on' : ''}" style="height:46px"${act('popPick', i)}>${face(p, 38)}<span class="grow" style="${clip}">${esc(p.name)}</span><small>${esc(p.rank)}</small></div>`; }).join('');
  const more = d.people.length > DOSSIER_ROWS ? `<span class="sm" style="text-align:right">${d.pick + 1} of ${d.people.length}</span>` : '';
  return head + `<div class="abs col" style="left:24px;top:104px;width:330px;gap:7px">${list}${more}</div><div class="abs" style="left:386px;right:28px;top:110px">${file}</div>` + TX('One folder per team. Each case file keeps status, rank, an overheard line and the ace.');
}

// ---------- Field Notes ----------

export interface BookEntry { name: string; file: string | null; known: boolean; badge: string; lines: string[]; pips: number | null; obtain: string }
export interface BookModel {
  tabs: { name: string; short: string; count: string }[];
  tab: number;
  entries: BookEntry[];
  pick: number;
  /** The open tab draws the Shadow ring (purple) instead of the team ring. */
  shadow: boolean;
  help: string;
  /** What the left page says when the tab has no entry. */
  empty: string;
}

export const bookRows = (c: Pick<ReduxCtx, 'v'>): number => (c.v(2) ? 7 : 6);

export function bookView(c: ReduxCtx, d: BookModel): string {
  const v = c.v(2);
  const s = d.entries[d.pick];
  const w = listWindow(d.entries.length, d.pick, bookRows(c));
  const left = d.entries.length
    ? d.entries.slice(w.from, w.to).map((e, k) => { const i = w.from + k; return `<div class="row" style="gap:8px;padding:5px 8px;cursor:pointer;${i === d.pick ? 'background:var(--tf);color:#fff' : ''}"${act('popPick', i)}>${e.file ? `<span style="width:34px;height:34px;flex:none;display:flex;align-items:center;justify-content:center">${mini(e.file, 34)}</span>` : '<i style="width:34px;height:34px;flex:none;background:#0003"></i>'}<b class="grow" style="font-size:15px;${clip}${e.known ? '' : ';opacity:.7'}">${esc(e.name)}</b>${e.pips !== null ? pips(e.pips) : `<span style="font-size:12px;opacity:.8;flex:none">${esc(e.badge)}</span>`}</div>`; }).join('')
    : `<div style="padding:8px;line-height:21px">${esc(d.empty)}</div>`;
  const count = d.tabs[d.tab]?.count ?? '';
  const more = d.entries.length > bookRows(c) ? `${d.pick + 1} of ${d.entries.length}` : count;
  // A long entry (a Shadow with its clues) gets a smaller picture and tighter lines, so the page stays above the text box.
  const long = !!s && s.lines.join('').length > 110;
  const art = long ? 110 : 150;
  const right = s
    ? `<div class="col cen" style="gap:6px">${s.file ? `<div style="position:relative;height:${art}px;display:flex;align-items:flex-end;justify-content:center"><div style="position:absolute;bottom:0;width:170px;height:44px;border-radius:50%;border:5px solid ${d.shadow ? '#8a40c8' : 'var(--tf)'}"></div>${mini(s.file, art, '', true)}</div>` : `<div style="width:${long ? 70 : 110}px;height:${long ? 70 : 110}px;background:#0002"></div>`}<b style="font-size:22px;text-align:center">${esc(s.name)}</b><span class="tg">${esc(s.badge)}</span>${s.lines.map((l) => `<span style="${long ? 'font-size:13px;line-height:18px' : 'line-height:21px'};text-align:center">${esc(l)}</span>`).join('')}${s.pips !== null ? `<div class="row">Hints ${pips(s.pips)}</div>` : ''}${s.obtain ? `<span style="font-size:13px;opacity:.8;text-align:center">${esc(s.obtain)}</span>` : ''}</div>`
    : '<div class="col cen"><div style="width:110px;height:110px;background:#0002"></div></div>';
  const edge = `<div class="abs col" style="right:${v ? 24 : 46}px;top:78px;gap:6px">${d.tabs.map((t, k) => `<span style="padding:${v ? '6px 12px' : '10px 8px'};background:${k === d.tab ? 'var(--acc)' : 'var(--p2)'};color:${k === d.tab ? '#14161e' : 'var(--wink)'};font-size:13px;font-weight:700;cursor:pointer;${v ? '' : 'writing-mode:vertical-rl;'}border-radius:0 5px 5px 0"${act('popTab', k)}>${esc(v ? t.name : t.short)}</span>`).join('')}</div>`;
  const body = v
    ? `<div class="abs col" style="left:24px;top:76px;width:380px;gap:3px">${paper(left + (more ? `<div style="font-size:12px;opacity:.7;text-align:right;padding:4px 8px 0">${esc(more)}</div>` : ''), 'padding:10px')}</div><div class="abs" style="left:430px;right:190px;top:76px">${paper(right, 'max-height:352px;overflow:hidden')}</div>`
    : `<div class="abs row" style="left:60px;right:86px;top:74px;gap:0;align-items:stretch">${paper(`<div class="row"><b class="grow" style="font-size:18px">${esc(d.tabs[d.tab]?.name ?? '')}</b><span style="font-size:12px;opacity:.7">${esc(more)}</span></div><div class="col" style="gap:3px;margin-top:8px">${left}</div>`, 'flex:1;min-height:300px;min-width:0')}<div style="width:10px;background:var(--tf)"></div>${paper(right, 'flex:1;min-width:0;max-height:354px;overflow:hidden')}</div>`;
  return back('pop') + H('Field Notes', 'map', [['◀ ▶', 'tab'], ['F', 'close']]) + body + edge + TX(esc(d.help));
}

// ---------- Notebook track page ----------

export interface TrackStepView { n: number; name: string; rule: string; state: 'seen' | 'now' | 'next' | 'locked' }
export interface TrackModel {
  kicker: string;
  title: string;
  steps: TrackStepView[];
  /** Filled dots out of five. */
  seen: number;
  scales: { head: string; text: string; seen: boolean }[];
  civilian: string;
  next: string;
}

export function trackView(c: ReduxCtx, d: TrackModel): string {
  const v = c.v(2);
  const cur = Math.max(0, d.steps.findIndex((s) => s.state === 'now'));
  const now = d.steps[cur];
  const name = (s: TrackStepView): string => esc(s.name || '???');
  const title = `<div style="font-size:12px;opacity:.7">${esc(d.kicker)}</div><b style="font-size:24px">${esc(d.title)}</b>`;
  const seen = `<div class="row"><b class="acc grow">How much you’ve seen</b>${pips(d.seen, 5)}</div>`;
  const says = d.civilian ? `<b class="acc">Civilians say</b><div class="sm" style="line-height:18px">${esc(d.civilian)}</div>` : '';
  if (v) {
    const dots = d.steps.map((s, k) => `<div class="col cen" style="flex:1;gap:6px;min-width:0"><i style="width:34px;height:34px;border-radius:50%;background:${s.state === 'seen' || s.state === 'now' ? 'var(--tf)' : '#0002'};color:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:700;${k === cur ? 'box-shadow:0 0 0 4px var(--acc)' : ''}">${s.n}</i><span style="font-size:12px;text-align:center">${name(s)}</span></div>`).join('');
    const bar = `<div class="hp gold" style="height:10px"><i style="width:${d.steps.length > 1 ? Math.round((cur / (d.steps.length - 1)) * 100) : 0}%"></i></div>`;
    const sideA = W(`${seen}${facts(d.scales.map((s) => [s.head, s.seen ? 'Seen' : 'Not yet'] as const))}`, 'display:flex;flex-direction:column;gap:7px');
    const sideB = W(`<b class="acc">${now ? `Step ${now.n}: ${name(now)}` : 'Nothing has moved yet'}</b>${now?.rule ? `<div class="sm" style="line-height:18px">${esc(now.rule)}</div>` : ''}${says}`, 'display:flex;flex-direction:column;gap:7px');
    return back('pop') + H('Notebook', 'map', [['T', 'close']]) + `<div class="abs" style="left:40px;right:40px;top:96px">${paper(`${title}<div class="row" style="gap:0;margin:22px 0 8px;align-items:flex-start">${dots}</div>${bar}`)}</div><div class="abs" style="left:40px;width:420px;top:290px">${sideA}</div><div class="abs" style="left:480px;right:40px;top:290px">${sideB}</div>` + TX(esc(d.next));
  }
  const rows = d.steps.map((s, k) => `<div style="padding:5px 8px;${k === cur ? 'background:var(--tf);color:#fff' : s.state === 'seen' ? 'opacity:.6' : ''}"><div class="row" style="gap:10px;${s.state === 'seen' ? 'text-decoration:line-through' : ''}"><b style="width:20px">${s.n}</b><span class="grow">${name(s)}</span>${k === cur ? '<span>◀ now</span>' : ''}</div>${s.rule && s.state !== 'seen' && s.state !== 'locked' ? `<div style="font-size:12px;line-height:16px;margin-left:30px;opacity:.85">${esc(s.rule)}</div>` : ''}</div>`).join('');
  const side = W(`${seen}${d.scales.map((s) => `<div style="${s.seen ? '' : 'opacity:.5'}"><div class="row sm"><span class="grow">${esc(s.head)}</span></div>${s.seen && s.text ? `<div style="font-size:12px;line-height:16px">${esc(s.text)}</div>` : ''}</div>`).join('')}${says}`, 'display:flex;flex-direction:column;gap:7px');
  return back('pop') + H('Notebook', 'map', [['T', 'close']]) + `<div class="abs" style="left:40px;width:500px;top:74px">${paper(`${title}<div class="col" style="gap:5px;margin-top:10px">${rows}</div>`, 'transform:rotate(-.8deg)')}</div><div class="abs" style="left:580px;right:26px;top:84px">${side}</div>` + TX(esc(d.next));
}

// ---------- Rival Report ----------

export interface ReportModel {
  /** Every rival in the report; more than one shows as name chips to switch between. */
  rivals: string[];
  pick: number;
  name: string;
  tag: string;
  art: string | null;
  facts: [string, string][];
  /** -3 (you lead) to +3 (the rival leads). */
  lead: number;
  /** Strongest first, each 0 to 100. */
  feelings: [string, number][];
  marks: string[];
  meetings: [string, string][];
}

export const leadLine = (name: string, lead: number): string => (lead === 0 ? 'Level' : lead > 0 ? `${name} is ahead by ${lead}` : `You lead by ${-lead}`);

export function reportView(c: ReduxCtx, d: ReportModel): string {
  const v = c.v(2);
  const chips = d.rivals.length > 1 ? `<div class="row" style="gap:5px;flex-wrap:wrap;margin-top:2px">${d.rivals.map((n, k) => `<span class="tg${k === d.pick ? '' : ' no'}" style="cursor:pointer"${act('popPick', k)}>${esc(n)}</span>`).join('')}</div>` : '';
  const card = W(`<div class="cell" style="height:150px;aspect-ratio:auto">${d.art ? tall(d.art, 130) : ''}</div><b style="font-size:22px;${clip}">${esc(d.name)}</b><span class="tg">${esc(d.tag)}</span>${facts(d.facts)}${chips}`, 'display:flex;flex-direction:column;gap:7px;align-items:stretch');
  const lead = W(`<div class="row"><b class="grow">Lead</b><span class="acc">${esc(leadLine(d.name, d.lead))}</span></div><div class="row" style="gap:4px">${[-3, -2, -1, 0, 1, 2, 3].map((n) => `<div class="col cen" style="flex:1;gap:3px"><i style="width:100%;height:12px;background:${n === d.lead ? 'var(--acc)' : 'var(--p2)'}"></i><span style="font-size:12px">${n > 0 ? '+' + n : n}</span></div>`).join('')}</div><div class="row sm"><span class="grow">You lead</span><span>Rival leads</span></div>`, 'display:flex;flex-direction:column;gap:6px');
  const feel = W(`<b class="acc">Feelings</b>${d.feelings.map(([n, p]) => `<div class="row"><span style="width:${v ? 86 : 96}px;${clip}">${esc(n)}</span>${hpb(p, 0, ' gold')}</div>`).join('')}<div class="row" style="gap:5px;flex-wrap:wrap;margin-top:2px">${d.marks.length ? d.marks.map((t) => `<span class="tg no">${esc(t)}</span>`).join('') : '<span class="sm">No marks yet</span>'}</div>`, 'flex:1;display:flex;flex-direction:column;gap:6px;min-width:0');
  const meet = W(`<b class="acc">Meetings</b>${d.meetings.map(([a, b]) => `<div class="row sm"><span class="grow">${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}`, 'flex:1;display:flex;flex-direction:column;gap:6px;min-width:0');
  return back('pop') + H('Rival Report', 'story', d.rivals.length > 1 ? [['◀ ▶', 'rival'], ['R', 'close']] : [['R', 'close']]) + `<div class="abs" style="left:24px;top:76px;width:${v ? 250 : 290}px">${card}</div><div class="abs col" style="left:${v ? 300 : 340}px;right:24px;top:76px;gap:16px">${lead}<div class="row" style="gap:16px;align-items:stretch">${feel}${meet}</div></div>` + TX('Lead goes from −3 to +3. A rival win is +1, a rival loss is −1. Marks and feelings come from your choices.');
}
