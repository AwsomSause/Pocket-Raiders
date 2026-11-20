// Phantom UI: the parts a Picker adds around its page (ui/redux/pickerView.ts): the chips beside the title, the
// page tabs, the "more about this row" sheet, and the page of a list with nothing in it. They are placed inside the
// Phantom page so the page's own rules style them. Presentation only.

import { esc } from '../redux/kit';
import { act, page } from './kit';
import { phHead, phKeys } from './templates';

/** Puts `extra` inside a Phantom page (before its closing tag), so it is drawn on the page and morphs with it. */
export const phInto = (html: string, extra: string): string => (extra ? html.replace(/<\/section>$/, `${extra}</section>`) : html);

/** The chips a Picker's title carries ("0 credits", "0 candies"), as a row of slanted tabs under the page tabs. */
export const phChips = (chips: readonly string[]): string =>
  chips.length ? `<div class="ph-xchips">${chips.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : '';

/** Page tabs at the top right; a click calls the `tab` handler. */
export const phTabs = (tabs: { labels: readonly string[]; index: number } | null | undefined): string =>
  tabs ? `<div class="pockets ph-tabs">${tabs.labels.map((t, k) => `<span class="${k === tabs.index ? 'on' : ''}"${act('tab', k)}>${esc(t)}</span>`).join('')}</div>` : '';

/** The sheet a Picker opens with I: everything about the lit row, over the dimmed page. */
export const phSheet = (text: string | null): string =>
  text === null ? '' : `<div class="ph-shade" data-key="sheet"${act('back')}></div><div class="pn lt ph-sheet${text.length > 900 ? ' xs' : text.length > 520 ? ' sm' : ''}" data-key="sheetp"><span class="lab">More</span><p class="txt">${esc(text)}</p><span class="ph-sheet-k">Press I, Enter or Esc to go back to the list</span></div>`;

/** A list with nothing in it. */
export function phEmpty(title: string, small: string, text: string, hints: readonly (readonly [string, string])[]): string {
  return page('list', '<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(48% 0,100% 0,100% 100%,56% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:85%;--y:40%" aria-hidden="true"></div>'
    + phHead(title, small) + '<div class="ph-none">Nothing here yet</div>' + (text ? `<div class="pn ph-say ph-say-m"><p class="txt">${esc(text)}</p></div>` : '') + phKeys(hints));
}
