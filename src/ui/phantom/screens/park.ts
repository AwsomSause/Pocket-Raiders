// Phantom UI: the walkable zones (Safari Land, The Deep Savanna, The Lush Jungle), which the mock-ups had no page for.
// The field is the game's own drawing (ui/redux/screens/safari.ts: the ground, the props, the overworld sheets),
// laid larger on a Phantom page; the numbers, the notes, the pad and the choices are Phantom tiles. It takes the New
// UI's model, so scenes/safariPark.ts keeps the input and the rules. Presentation only.

import type { PhantomVersion } from '../../../core/presentation/phantom';
import { img, tall } from '../../redux/kit';
import { parkField, parkGround, type ParkModel } from '../../redux/screens/safari';
import { act, esc, page } from '../kit';
import { fit, phHead, phKeys } from '../templates';

const K = 1.3, LEFT = 44, TOP = 132, FW = Math.round(600 * K), FH = Math.round(280 * K), SIDE = LEFT + FW + 26;
const LOOK_WORD: Record<ParkModel['look'], string> = { park: 'Safari Land', savanna: 'The Deep Savanna', jungle: 'The Lush Jungle' };

export function phPark(_ph: PhantomVersion, d: ParkModel): string {
  const g = parkGround(d);
  const field = `<div class="ph-zn-bed" style="left:${LEFT}px;top:${TOP}px;width:${FW}px;height:${FH}px"><div class="ph-old" style="width:600px;height:280px;transform:scale(${K}) translate(-24px,-60px)">${parkField(d)}</div></div>`;
  const stats = `<div class="ph-zn-stats" style="left:${SIDE}px;top:${TOP}px">${d.stats.map(([a, b]) => `<div class="pn ph-mg-st"><small>${esc(a)}</small><b style="font-size:${fit(String(b), 120, 24, 13)}px">${esc(b)}</b></div>`).join('')}</div>`;
  const m = d.meter;
  const meter = m ? `<div class="pn ph-zn-meter" style="left:${SIDE}px;top:${TOP + 74}px"><div class="ph-zn-mrow"><small>${esc(m.label)}</small><b>${m.value}/${m.max}</b><span>${esc(m.word)}</span></div><div class="ph-old ph-zn-pips">${Array.from({ length: m.max }, (_, i) => `<i class="pk-pip${i < m.value ? ` ${m.tone}` : ''}"></i>`).join('')}</div></div>` : '';
  const sideTop = TOP + (m ? 152 : 74), sideH = TOP + FH - sideTop;
  const side = d.picture
    ? `<div class="pn lt ph-zn-note" style="left:${SIDE}px;top:${sideTop}px;height:${sideH}px"><span class="lab">${esc(d.picture.title)}</span><div class="ph-old"><div class="pk-photo" style="height:${Math.max(84, sideH - 96)}px;background:linear-gradient(${g[0]} 55%,${g[2]} 55%)">${d.picture.file ? `<div class="pk-shot">${tall(d.picture.file, Math.max(74, sideH - 120))}</div>` : ''}</div><div class="pk-plate">${esc(d.picture.plate)}</div></div></div>`
    : `<div class="pn lt ph-zn-note" style="left:${SIDE}px;top:${sideTop}px;height:${sideH}px">${d.note.sheet ? `<div class="ph-old ph-zn-face">${img(d.note.sheet, 1, [0, 0, 64, 64])}</div>` : ''}<span class="lab">${esc(d.note.who)}</span><p class="txt" style="font-size:${d.note.text.length > 200 ? 15 : d.note.text.length > 110 ? 17 : 20}px">${esc(d.note.text)}</p></div>`;
  const said = [d.msg, d.prompt].filter(Boolean).join(' ');
  const focus = d.walking ? null : d.cells[d.index];
  const sayTop = TOP + FH + 16;
  const message = `<div class="pn ph-zn-say" style="left:${LEFT}px;top:${sayTop}px"><p class="txt" style="font-size:${said.length + (focus?.detail.length ?? 0) > 230 ? 14 : said.length > 150 ? 16 : 18}px">${d.msg ? `<b>${esc(d.msg)}</b> ` : ''}${esc(d.prompt)}${focus?.detail ? ` <span>· ${esc(focus.label)}: ${esc(focus.detail)}</span>` : ''}</p></div>`;
  const ctlTop = sayTop + 64, ctlH = 720 - ctlTop - 56;
  let controls: string;
  if (d.walking) {
    const pad = (label: string, name: string, arg: string, on = false): string => `<div class="pn ph-zn-b${on ? ' lt on' : ''}"${act(name, arg)}><b style="font-size:${fit(label, 96, 20, 12)}px">${esc(label)}</b></div>`;
    const dpad = `<div class="ph-zn-pad" style="left:${LEFT}px;top:${ctlTop}px;height:${ctlH}px">${pad(d.running ? 'Running' : 'Run', 'run', '', d.running)}${pad('▲', 'go', 'up')}${pad(d.pad.third[0], 'do', d.pad.third[1])}${pad('◀', 'go', 'left')}${pad('▼', 'go', 'down')}${pad('▶', 'go', 'right')}</div>`;
    const buttons = d.pad.more.map((b) => `<div class="pn ph-zn-b wide"${act('do', b.arg)}><b style="font-size:${fit(b.label, 200, 19, 12)}px">${esc(b.label)}</b>${b.detail ? `<small>${esc(b.detail)}</small>` : ''}</div>`).join('');
    controls = dpad + `<div class="ph-zn-more" style="left:${LEFT + 330}px;top:${ctlTop}px;width:${FW - 330}px;height:${ctlH}px">${buttons ? `<div class="ph-zn-two">${buttons}</div>` : ''}<p>${esc(d.pad.help)}</p></div>`;
  } else {
    const n = d.cells.length, cols = n > 3 ? 3 : Math.max(1, n), rows = Math.ceil(n / cols);
    const rowH = Math.max(24, Math.min(40, Math.floor((ctlH - (rows - 1) * 6) / Math.max(1, rows))));
    controls = `<div class="ph-zn-cells" style="left:${LEFT}px;top:${ctlTop}px;width:${FW}px;grid-template-columns:repeat(${cols},1fr)">${d.cells.map((c, i) => `<div class="pn ph-zn-b${i === d.index ? ' lt on' : ''}${c.off ? ' off' : ''}" style="height:${rowH}px" data-key="c${i}"${act('pick', i, 'over')}><b style="font-size:${fit(c.label, Math.floor(FW / cols) - 30, rowH < 32 ? 16 : 20, 11)}px">${esc(c.label)}</b></div>`).join('')}</div>`;
  }
  return page('park', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(62% 0,100% 0,100% 100%,74% 100%);inset:0" aria-hidden="true"></div>'
    + phHead(d.title, LOOK_WORD[d.look] === d.title ? 'Mini-game' : LOOK_WORD[d.look]) + field + stats + meter + side + message + controls + phKeys(d.hints));
}
