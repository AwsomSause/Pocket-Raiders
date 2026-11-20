// Phantom UI: the minigame screens the mock-ups had no page for. The shared game page (score tiles, the play field
// with the prompt over the stage's scenery and the party watching, the choices as slanted tiles; the Arcade
// Cabinet's drawn screen sits in the same field). It takes the New UI's model (ui/redux/screens/minigame.ts), so
// MinigameScene keeps the rules, the timer and the input. The Museum's jigsaw and the Night Parade's Spirit Market keep
// their own drawings (the slab and its shards; the lanterns and the stalls), laid on a Phantom page with Phantom
// tiles, text and keys around them. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { rxUrl } from '../../redux/assets';
import { jigsawBoard, type JigsawModel } from '../../redux/screens/jigsaw';
import { boardView, hudStat, type GameModel } from '../../redux/screens/minigame';
import { marketScene, type SpiritMarketModel } from '../../redux/screens/spiritMarket';
import { act, esc, mon, page } from '../kit';
import { fit, phHead, phKeys } from '../templates';

/** The New look draws the cabinet's screen on a 912 px wide field; the Phantom field is this much bigger. */
const BOARD_ZOOM = 1.28;
const MEDAL_WORD: Record<string, string> = { gold: 'Gold', silver: 'Silver', bronze: 'Bronze', none: 'No medal' };

/** The score tiles at the top right. A tile with only a word ("No match.") shows the word alone. */
const tiles = (hud: readonly (readonly [string, string])[]): string =>
  `<div class="ph-mg-hud">${hud.map(([a, b]) => `<div class="pn ph-mg-st">${b ? `<small>${esc(a)}</small><b style="font-size:${fit(b, 190, 26, 13)}px">${esc(b)}</b>` : `<b style="font-size:${fit(a, 190, 22, 13)}px">${esc(a)}</b>`}</div>`).join('')}</div>`;
const BACK = '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,30% 0,14% 100%,0 100%);inset:0" aria-hidden="true"></div>';
/** Words with the game's own marks: *soft* and **strong**. */
const rich = (t: string): string => esc(t).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');
const size = (n: number, room: number): number => (n > room * 2.4 ? 15 : n > room * 1.6 ? 17 : n > room ? 19 : n > room / 2 ? 22 : 25);

export function phGame(_ph: PhantomVersion, d: GameModel): string {
  const n = d.cells.length, cols = Math.max(1, Math.min(d.cols, n || 1)), rows = Math.ceil(n / cols);
  // The field gives up height to a tall grid of choices.
  const rowH = Math.max(34, Math.min(62, Math.floor((250 - (rows - 1) * 8) / Math.max(1, rows))));
  const small = rowH < 52 || cols > 4;
  const gridH = rows * rowH + Math.max(0, rows - 1) * 8;
  const focus = d.cells[d.index], line = small && focus?.detail ? `${focus.label}: ${focus.detail}` : '';
  const fieldH = 720 - 132 - gridH - 14 - 70 - (line ? 30 : 0);
  const stats = tiles([...d.hud.filter(Boolean).map(hudStat), ...(d.best ? [['Best', d.best] as const] : [])]);
  const crowd = d.party.slice(0, 3).map((f, i) => `<div class="ph-mg-mon" style="--i:${i}">${mon(f, fieldH > 300 ? 2 : 1.4, '', '', true)}</div>`).join('');
  const long = d.prompt.length;
  const medal = d.medal ? `<div class="ph-mg-medal ${esc(d.medal)}" data-key="medal"><b>${d.medal === 'none' ? '–' : '★'}</b>${MEDAL_WORD[d.medal] ?? ''}</div>` : '';
  const field = d.board
    ? `<div class="ph-mg-field cab" style="height:${fieldH}px"><div class="ph-old ph-mg-board" style="width:912px;height:${Math.floor(fieldH / BOARD_ZOOM)}px;transform:scale(${BOARD_ZOOM})">${boardView(d, d.board, Math.floor(fieldH / BOARD_ZOOM))}</div></div>`
    : `<div class="ph-mg-field" style="height:${fieldH}px">${d.art ? `<div class="ph-mg-art" style="background-image:url(${rxUrl(d.art)})" aria-hidden="true"></div>` : ''}<div class="ph-mg-crowd">${crowd}</div>`
      + `<div class="pn lt tilt ph-mg-say" style="--r:-1deg"><p class="txt" style="font-size:${long > 220 ? 16 : long > 150 ? 18 : long > 70 ? 22 : 28}px">${esc(d.prompt)}</p></div>${medal}</div>`;
  const cells = d.cells.map((c, i) => `<div class="pn ph-mg-c${i === d.index ? ' lt on' : ''}${c.off ? ' off' : ''}${small ? ' sm' : ''}" style="height:${rowH}px" data-key="c${i}"${d.press ? ` data-press="${i}" data-arg="${i}" data-over="over"` : act('pick', i, 'over')}><b style="font-size:${fit(c.label, Math.floor(1100 / cols) - 30, small ? 22 : 28, 12)}px">${esc(c.label)}</b>${!small && c.detail ? `<small>${esc(c.detail)}</small>` : ''}</div>`).join('');
  return page('game', BACK
    + phHead(d.title, 'Mini-game') + stats + field
    + `<div class="ph-mg-cells" style="grid-template-columns:repeat(${cols},1fr);top:${132 + fieldH + 14}px">${cells}</div>`
    + (line ? `<div class="ph-mg-line" style="top:${132 + fieldH + 14 + gridH + 8}px">${esc(line)}</div>` : '') + phKeys(d.hints));
}

/** The Museum's fossil restoration: the sandbox and the tray as the game draws them, the words and the keys in Phantom. */
export function phJigsaw(_ph: PhantomVersion, d: JigsawModel): string {
  const b = jigsawBoard(d);
  const k = Math.min(1168 / b.w, 402 / b.h, 1.3), w = Math.round(b.w * k), h = Math.round(b.h * k) + 22, left = Math.round((1280 - w) / 2), top = 126;
  const said = d.outcome ? d.outcome.lines.join(' ') : d.prompt;
  const under = top + h + 16, room = 720 - under - 62;
  return page('jigsaw', BACK + phHead(d.title, 'Mini-game') + tiles(d.hud.filter(Boolean).map(hudStat))
    + `<div class="ph-jg-bed" style="left:${left}px;top:${top}px;width:${w}px;height:${h}px"><div class="ph-old" style="width:${b.w}px;height:${b.h}px;transform:scale(${k.toFixed(3)}) translate(${-b.x}px,${-b.y}px)">${b.html}</div>`
    + `<span class="lab ph-jg-l" style="left:18px">The sandbox</span><span class="lab ph-jg-l" style="right:18px">The tray</span></div>`
    + `<div class="pn lt ph-jg-say" style="top:${under}px;height:${room}px;right:${d.outcome ? 250 : 56}px"><p class="txt" style="font-size:${size(said.length, room > 80 ? 190 : 120)}px">${rich(said)}</p></div>`
    + (d.outcome ? `<div class="ph-jg-done" style="top:${under + Math.max(0, Math.round((room - 52) / 2))}px"><div class="blade on"${act('pick', 0)}>Done</div></div>` : '')
    + phKeys(d.hints));
}

/** The Night Parade's Spirit Market: the lanterns and the lane as the game draws them; what is said and the answers in Phantom. */
export function phMarket(_ph: PhantomVersion, d: SpiritMarketModel): string {
  const K = 1.28, top = 118, under = top + Math.round(260 * K) + 18, room = 720 - under - 62;
  const scene = `<div class="ph-old ph-sk-scene" style="left:${Math.round((1280 - 912 * K) / 2)}px;top:${top}px;width:912px;height:260px;transform:scale(${K}) translate(-24px,-62px)">${marketScene(d)}</div>`;
  const inLanes = d.at === 'lanes' && !d.outcome, focus = d.cells[d.index];
  let body: string;
  if (d.outcome) {
    const said = d.outcome.lines.join(' '), total = said.length + d.outcome.log.join(' ').length;
    const log = d.outcome.log.length && total <= 900 ? `<p class="ph-sk-log">${d.outcome.log.map((l) => esc(l)).join('<br>')}</p>` : '';
    body = `<div class="pn lt ph-jg-say" style="top:${under}px;height:${room}px;right:250px"><p class="txt" style="font-size:${total > 620 ? 14 : size(said.length, 170)}px">${rich(said)}</p>${log}</div>`
      + `<div class="ph-jg-done" style="top:${under + Math.round((room - 52) / 2)}px"><div class="blade on"${act('pick', 0)}>Done</div></div>`;
  } else if (inLanes) {
    body = `<div class="pn lt ph-jg-say" style="top:${under}px;height:${room}px"><p class="txt" style="font-size:${size(d.prompt.length, 230)}px">${rich(d.prompt)}</p>${focus ? `<p class="ph-sk-log"><b>${esc(focus.label)}</b> ${esc(focus.detail)}</p>` : ''}</div>`;
  } else {
    const cols = Math.max(1, d.cols), rows = Math.ceil(d.cells.length / cols);
    const rowH = Math.max(26, Math.min(46, Math.floor((room - (rows - 1) * 6) / Math.max(1, rows))));
    const cells = d.cells.map((c, i) => `<div class="pn ph-mg-c sm${i === d.index ? ' lt on' : ''}${c.off ? ' off' : ''}" style="height:${rowH}px" data-cell="${i}" data-key="c${i}"${c.off ? '' : act('pick', i, 'over')}><b style="font-size:${fit(c.label, Math.floor(640 / cols), rowH < 34 ? 17 : 22, 12)}px">${esc(c.label)}</b></div>`).join('');
    body = `<div class="pn lt ph-jg-say" style="top:${under}px;height:${room}px;right:auto;width:470px"><p class="txt" style="font-size:${size(d.prompt.length, 110)}px">${rich(d.prompt)}</p>${focus?.detail ? `<p class="ph-sk-log">${esc(focus.detail)}</p>` : ''}</div>`
      + `<div class="ph-mg-cells" style="left:548px;grid-template-columns:repeat(${cols},1fr);top:${under}px;gap:6px 10px">${cells}</div>`;
  }
  return page('market', BACK + phHead(d.title, 'Night Parade') + scene + body + phKeys(d.hints));
}
