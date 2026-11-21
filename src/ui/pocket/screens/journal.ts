// The Pocket look's Journal (mock-up page `journal`): the entries as a numbered list with an icon each, and the lit one
// read out on a page beside it (a picture strip with its kind, its title, where it stands, what happened, how far along).
// It draws the run's Story Journal and Story boards (ui/journalMenu.ts, ui/fieldMenus.ts), which keep the rows and keys.
// Presentation only.

import type { BoardModel } from '../../redux/templates';
import { scrollStart } from '../../redux/templates';
import { itemArt, type PkArt } from '../art';
import { act, back, esc, hdr, keys, page, type PkKey, STREET } from '../kit';
import { fit, fitBody, fitPic, pkArtOf } from '../templates';

export const PK_JOURNAL_ROWS = 7;

/** An entry's icon, by its tag. */
export function journalIcon(tag: string | undefined): PkArt {
  const t = (tag ?? '').toLowerCase();
  if (/rival/.test(t)) return itemArt('master_ribbon');
  if (/grudge|nemesis|enemy/.test(t)) return itemArt('black_glasses');
  if (/past|legacy|memory/.test(t)) return itemArt('exp_charm');
  if (/quest|done|open|step/.test(t)) return itemArt('calendar');
  if (/title|poster|board|news/.test(t)) return itemArt('coin_case');
  return itemArt('map');
}

/** A long entry ("Act I: Arrival in Galar. This region belongs to...") as a short title and the rest of its words. */
export function splitEntry(title: string): [string, string] {
  const at = title.indexOf('. ');
  return title.length > 44 && at > 0 && at < 60 ? [title.slice(0, at), title.slice(at + 2)] : [title, ''];
}
/** The board's stand-in line for a row with nothing more to say. */
const FILLER = /^Open quests and story threads for this run\.?$/;

export function pkJournal(d: BoardModel): string {
  const n = d.rows.length, index = Math.max(0, Math.min(n - 1, d.index)), s = scrollStart(n, index, PK_JOURNAL_ROWS);
  const rows = d.rows.slice(s, s + PK_JOURNAL_ROWS).map((r, q) => {
    const k = s + q;
    const [t] = splitEntry(r.title);
    return `<div class="jr${k === index ? ' on' : ''}${r.off ? ' gx-jr-off' : ''}" data-key="jr-${k}"${act('pick', k, 'over')}><em>${k + 1}</em><i>${fitPic(pkArtOf(r.art) ?? journalIcon(r.tag), 32, 32, '', 2)}</i><div><b style="font-size:${fit(t, 300, 15, 13, 0.55)}px">${esc(t)}</b><span>${esc(r.tag ? `${r.tag}${r.sub ? ` · ${r.sub}` : ''}` : r.sub)}</span></div></div>`;
  }).join('');
  const cur = d.rows[index];
  const [title, more] = cur ? splitEntry(cur.title) : ['', ''];
  const said = FILLER.test(d.text.trim()) ? '' : d.text;
  const happened = [more, said].filter(Boolean).join(' ');
  const line = (label: string, v: string, room: number): string => (v ? `<p><span>${esc(label)}</span><u style="font-size:${fitBody(v, 380, room, [13.5, 12.5, 11.5, 10.5], 1.4)}px">${esc(v)}</u></p>` : '');
  const bar = cur && cur.pct !== null && cur.pct !== undefined ? `<p><span>How far</span><u class="gx-jr-bar"><i style="width:${Math.max(0, Math.min(100, Math.round(cur.pct)))}%"></i><em>${Math.round(cur.pct)}%</em></u></p>` : '';
  const pageHtml = cur
    ? `<div class="jr-page pn" data-key="jr-page"><div class="jr-pic">${back(STREET, '')}<span class="gx-jr-ic">${fitPic(pkArtOf(cur.art) ?? journalIcon(cur.tag), 64, 64, '', 3)}</span><em>Entry ${index + 1}${cur.tag ? ` · ${esc(cur.tag)}` : ''}</em></div>`
      + `<b style="font-size:${fit(title, 440, 32, 18, 0.5)}px">${esc(title)}</b>${line('Where', cur.sub, 40)}${line('What happened', happened, 96)}${bar}</div>`
    : `<div class="jr-page pn gx-jr-empty" data-key="jr-page"><b>A blank page</b><p><u>${esc(d.text || 'Nothing written yet. Play on and the journal fills in.')}</u></p></div>`;
  const ks: PkKey[] = [['↑↓', 'entry'], ...(d.hints ?? []).filter(([k]) => k === 'Esc').map(([k, t]) => [k, t, 'back'] as PkKey)];
  if (!ks.some(([k]) => k === 'Esc')) ks.push(['Esc', 'back', 'back']);
  return page('journal', 26, `<div class="scr journal" data-key="journal">${hdr(d.title, { area: 'guide', crumb: ['Menu', d.title], pills: n ? [`${n} ${n === 1 ? 'entry' : 'entries'}`] : [] })}`
    + `<div class="jr-list pn" data-key="jr-list">${rows || '<div class="jr"><div><b>Nothing yet</b><span>Entries appear as the run goes on.</span></div></div>'}</div>${pageHtml}`
    + `<div class="tb" data-key="jr-tb"><p>The journal only remembers this run. A new run starts on a blank page.</p></div>${keys(ks)}</div>`);
}
