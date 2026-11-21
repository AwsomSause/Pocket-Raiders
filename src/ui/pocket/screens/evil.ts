// The Pocket look's Evil Team pages (mock-ups `et-*`): the Case File, opened with J from a team's stop. The facts come
// from core/evil/teams.ts evilCaseFile; this page only draws them. Presentation only.

import type { EvilCaseFile, EvilCaseStop } from '../../../core/evil/teams';
import type { PkArt } from '../art';
import { esc, keys, page } from '../kit';
import { fit, fitPic } from '../templates';

/** The Case File as the page draws it: the core facts and the team's boss picture. */
export interface PkEtFileModel { file: EvilCaseFile; boss: PkArt | null }

/** The seven stops by what they are (every team's story has these seven, in this order). */
const STOP = ['Suspicious trainers', 'Evidence', 'Recognition', 'An executive', 'The executive returns', 'The real plan', 'The hideout'];
const TILT = [-2, 1.5, -1, 2, -1.5, 1, -2];
const plural = (n: number, w: string): string => `${n} ${w}${n === 1 ? '' : 's'}`;

/** A stop's small line and its tag: what it was, or when it comes. */
function when(s: EvilCaseStop, ended: boolean): [string, string] {
  if (s.state === 'done') return [s.name ?? 'Played', 'Done'];
  if (s.atLeague) return ['When you reach the League', s.state === 'now' ? 'Next' : 'Not yet'];
  if (s.state === 'now') return s.due ? [`In ${plural(s.due, 'stop')}`, 'Next'] : [s.name ?? 'This stop', 'Now'];
  return [ended || s.due === null ? 'The story is over' : `About ${plural(s.due, 'stop')} on`, 'Not yet'];
}

/** The Case File (mock-up `et-file`): the seven stops pinned on a board, the Boss, and the Heat with its two marks. */
export function pkEtFile(m: PkEtFileModel): string {
  const f = m.file, letter = f.team.replace(/^Team\s+/i, '').charAt(0).toUpperCase();
  const cards = f.stops.map((s, k) => {
    const [sub, tag] = when(s, f.ended);
    return `<p class="${s.state === 'now' ? 'now' : s.state === 'done' ? 'done' : ''}${k === 6 ? ' last' : ''}" style="--r:${TILT[k]}deg" data-key="et-stop-${k}"><u>${s.no}</u><b>${STOP[k]}</b><span style="font-size:${fit(sub, 180, 13, 10, 0.55)}px">${esc(sub)}</span><i>${tag}</i></p>`;
  }).join('');
  const seen = f.boss.met > 0 ? `Met ${f.boss.met} · beaten ${f.boss.won}` : 'Not seen yet';
  const pin = `<div class="pin36${f.boss.met ? ' seen' : ''}" data-key="et-boss"><em>${esc(f.team)}</em><span>${fitPic(m.boss, 40, 66, '', 2)}</span><b style="font-size:${fit(f.boss.name, 160, 22, 13, 0.55)}px">${esc(f.boss.name)}</b><i>${seen}</i></div>`;
  const heat = Array.from({ length: f.heatMax }, (_, i) => `<li class="${i < f.heat ? 'on' : ''}${i + 1 === f.ambushAt ? ' amb' : ''}${i + 1 === f.reinforceAt ? ' rnf' : ''}">${i + 1}</li>`).join('');
  const sub = `One team per run. You cross them seven times, about every ${plural(f.every, 'stop')}.`;
  return page('et-file', 51, `<div class="scr sz20 ar28 a-et pg28" data-key="et-file"><div class="sz-h" data-m="hdr"><i class="emb28 et hd" data-nocheck>${esc(letter)}</i><b>Case file</b><span>${esc(sub)}</span></div>`
    + `<div class="board36" data-key="et-board">${cards}${pin}</div>`
    + `<div class="heatb36" data-key="et-heat"><b>Heat</b><ol>${heat}</ol><span><i class="a"></i>Ambush at ${f.ambushAt}</span><span><i class="r"></i>Reinforcements at ${f.reinforceAt}</span></div>`
    + `${keys([['J', 'close', 'file'], ['Esc', 'back', 'file']])}</div>`);
}
