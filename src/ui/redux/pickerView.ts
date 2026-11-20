// New UI for the shared Picker list (ui/partyPanel.ts): every hub room, archive and run menu built on it is drawn
// with the mock-ups' menu, grid or board template. The Picker stays the controller; this reads what each row drew
// (its words and its picture) and lays it out again. Presentation only.

import { PK_DEX_COLS, pkDexWall } from '../pocket/screens/dex';
import Phaser from 'phaser';
import type { AssetManifest } from '../../assets/catalog';
import { rxFileOf } from './assets';
import { mountRedux, type ReduxCtx, type ReduxView } from './stage';
import { act, type Area, chipsLeft, esc, H, isArtPlaceholder, TX, W } from './kit';
import { areaOf, pickerBand, pickerKind, type PickerKind } from './pickerNames';
import { boardProgress, type BoardRow, boardView, type GridModel, gridStart, gridView, menuView, scrollStart, tabsBar } from './templates';
import { bagCols, bagUseNote, bagView } from './screens/bag';
import { battleListView, windowTitle } from './screens/battle';
import { monFile, partyChips, partyStrip } from './game';
import { services } from '../../game/services';
import { itemUseProblem } from '../../core/items';
import { phChips, phEmpty, phInto, phSheet, phTabs } from '../phantom/picker';
import { phBag } from '../phantom/screens/bag';
import { phBox } from '../phantom/screens/box';
import { AREA_WORD } from '../phantom/templates';

export interface PickerBridge {
  title: string;
  rows: number;
  index: () => number;
  /** The row's container as the Picker drew it. */
  box: (i: number) => Phaser.GameObjects.Container | undefined;
  problem: (i: number) => string | null;
  hint: (i: number) => string;
  /** A Pokémon row's look, HP left (0 to 1) and short mark, for the battle windows. */
  mon?: (i: number) => { speciesId: string; shiny: boolean; hp: number; mark: string } | undefined;
  /** A board row said outright (Bonds): its line, bar and tag are not read off the canvas row. */
  board?: (i: number) => { title: string; sub: string; pct: number | null; tag: string } | undefined;
  /** A menu row said outright (Camp): the words at its right, the detail card's text and picture. */
  menu?: (i: number) => { label: string; note: string; detail: string; sprite?: string | null; facts?: readonly (readonly [string, string])[] } | undefined;
  /** A grid cell said outright (the Pokédex): its picture, and the detail card's title and line. */
  cell?: (i: number) => { file: string | null; title: string; body: string; off?: boolean; sil?: boolean; got?: boolean } | undefined;
  /** The item a row stands for, if any (Bag). */
  item?: (i: number) => string | undefined;
  /** A row's picture by asset id, for rows that draw none themselves (the Berry Bestiary's icons). */
  art?: (i: number) => string | undefined;
  tabs?: { labels: readonly string[]; index: number; onChange: (index: number) => void };
  canBack: boolean;
  backLabel?: string;
  /** The room's own page, drawn in place of the rows (the Trainer Card). Its `back` clicks close the room. */
  page?: (c: ReduxCtx, index: number) => string;
  /** The header band's colour, when the title alone would pick the wrong one. */
  area?: Area;
  /** Columns the cursor moves across on the room's own page (1 unless said). */
  pageCols?: number;
  /** The battle window's top edge, when it is not the usual one. */
  top?: number;
  /** The small window sits in the middle of the screen (a map stop's quick choice), and `lead` heads it. */
  center?: boolean;
  lead?: string;
  /** The quick-summary text while it is open (I), else null. */
  summary: () => string | null;
  /** More buttons for a row beside what Enter does (the Phantom PC's Summary and Give item), and a click on one. */
  extras?: (i: number) => { label: string; key: string; off: boolean }[];
  extra?: (k: number) => void;
  pick: (i: number) => void;
  hover: (i: number) => void;
  back: () => void;
}

export { areaOf, pickerBand, pickerKind, type PickerKind } from './pickerNames';

/** How many columns the cursor moves across in each template and layout (the Picker steers by this in the New UI). */
export function pickerCols(kind: PickerKind, c: Pick<ReduxCtx, 'v'>): number {
  if (kind === 'grid') return c.v(2) === 1 ? 5 : 6;
  if (kind === 'bag') return bagCols(c);
  if (kind === 'window') return 1;
  if (kind === 'board') return c.v(2) === 1 ? 2 : 1;
  const v = c.v(3);
  return v === 1 ? 2 : 1;
}

interface Scraped { label: string; note: string; tag: string; art: { file: string; atlas: boolean } | null }

const fileOf = (scene: Phaser.Scene, key: string): { file: string; atlas: boolean } | null => rxFileOf(scene.cache.json.get('manifest') as AssetManifest | undefined, key);

/** Reads a drawn row: its biggest text is the label, right-aligned text the tag, the rest the note, the first known picture the art. */
export function scrapeRow(scene: Phaser.Scene, box: Phaser.GameObjects.Container | undefined): Scraped {
  const texts: { t: string; size: number; right: boolean }[] = [];
  let art: Scraped['art'] = null;
  const walk = (c: Phaser.GameObjects.Container): void => {
    for (const o of c.list) {
      if (o instanceof Phaser.GameObjects.Container) walk(o);
      else if (o instanceof Phaser.GameObjects.Text) {
        if (o.visible && o.text.trim() && !isArtPlaceholder(o.text)) texts.push({ t: o.text.trim(), size: parseInt(String(o.style.fontSize), 10) || 16, right: o.originX === 1 });
      } else if (!art && (o instanceof Phaser.GameObjects.Image || o instanceof Phaser.GameObjects.Sprite) && o.visible) art = fileOf(scene, o.texture.key);
    }
  };
  if (box) walk(box);
  const left = texts.filter((x) => !x.right);
  const top = left.reduce<(typeof texts)[number] | null>((m, x) => (!m || x.size > m.size ? x : m), null) ?? texts[0] ?? null;
  const flat = (s: string): string => s.replace(/\s*\n\s*/g, ' · ');
  // A row written as one line "Name  ·  what it is" splits into the label and its note.
  const [first, ...more] = (top?.t ?? '').replace(/\s{2,}·\s{2,}/, '\n').split('\n');
  return {
    label: first ?? '',
    tag: flat(texts.filter((x) => x.right && x !== top).map((x) => x.t).join(' · ')),
    note: flat([more.join('\n'), ...left.filter((x) => x !== top).map((x) => x.t)].filter(Boolean).join(' · ')),
    art,
  };
}

/** Who in the party the focused Bag item would help, one short note each ('' for no note). */
function bagNotes(itemId: string | undefined): string[] | undefined {
  const { content, run } = services().session;
  const item = itemId ? content.items.get(itemId) : undefined;
  if (!run || !item) return undefined;
  const regionId = run.regionOrder[run.regionIndex];
  return run.party.map((m) => bagUseNote(m.held?.[item.id] ?? 0, !!item.usableOutside, item.usableOutside ? itemUseProblem(content, item, m, regionId) : null, m.hp));
}

/** A Pokédex wall: its squares are said outright and carry a number ("No. 0006"). */
const isDexWall = (p: PickerBridge): boolean => { const x = p.cell?.(0); return !!x && /No\.\s*\d/.test(`${x.title} ${x.body}`); };

/** The header band is a Back button for the mouse and touch. */
const BACK_HIT = `<div class="abs hit" style="left:0;top:0;width:330px;height:48px;z-index:4"${act('back')}></div>`;

function render(c: ReduxCtx, scene: Phaser.Scene, p: PickerBridge, kind: PickerKind): string {
  if (kind === 'window') {
    const sum = p.summary();
    const over = sum === null ? '' : '<div class="shade" style="z-index:8"></div>' + W(`<div style="white-space:pre-wrap;line-height:22px;font-size:16px">${esc(sum)}</div><div class="sm acc">Press I, Enter or Esc to go back to the list</div>`, 'position:absolute;left:120px;right:120px;top:40px;bottom:50px;display:flex;flex-direction:column;gap:10px;padding:16px 20px;overflow:hidden;z-index:9', '', act('back'));
    const t = windowTitle(p.title);
    const list = battleListView(c, {
      ...t, tabs: p.tabs ? { labels: p.tabs.labels, index: p.tabs.index } : null, n: p.rows, index: p.index(), top: p.top, back: p.canBack, center: p.center, lead: p.lead,
      row: (i) => {
        const r = scrapeRow(scene, p.box(i)), m = p.mon?.(i), file = m ? monFile(scene, m.speciesId, 'front', m.shiny) : null, said = p.menu?.(i);
        const art = file ? { file, atlas: true } : said?.sprite ? { file: said.sprite, atlas: true } : m ? null : r.art;
        return { label: said?.label ?? r.label, art, hp: m ? m.hp : null, tag: m ? m.mark : said?.note ?? r.tag, off: p.problem(i) !== null };
      },
    });
    return c.ph ? phInto(list, phSheet(sum)) : list + over;
  }
  // "Bank · 0 credits · 0 candies": the name goes in the band, the rest becomes chips beside it.
  const { name, chips: extra } = pickerBand(p.title);
  const n = p.rows, index = p.index(), area = p.area ?? areaOf(name);
  const chips = extra.length ? `<div class="abs row" style="left:${chipsLeft(name)}px;top:13px;gap:6px;z-index:4">${extra.map((x, k) => `<span class="tg${k ? ' no' : ''}">${esc(x)}</span>`).join('')}</div>` : '';
  const hints: [string, string][] = [['Enter', 'choose'], ...(p.tabs ? [['←→', 'tab'] as [string, string]] : []), ...(p.canBack ? [['Esc', p.backLabel ?? 'back'] as [string, string]] : [])];
  const row = (i: number): Scraped => {
    const r = scrapeRow(scene, p.box(i)), id = r.art ? undefined : p.art?.(i);
    return id ? { ...r, art: fileOf(scene, id) } : r;
  };
  const text = n ? p.problem(index) ?? p.hint(index) : p.canBack ? 'Nothing here yet. Press Esc to go back.' : 'Nothing here yet.';
  // The Bag draws its pockets as its own row of tabs under the header.
  const tabs = p.tabs && kind !== 'bag' ? tabsBar(p.tabs.labels, p.tabs.index) : '';
  const back = p.canBack ? BACK_HIT : '';
  const sum = p.summary();
  const over = sum === null ? '' : '<div class="shade" style="z-index:8"></div>' + W(`<div style="white-space:pre-wrap;line-height:22px;font-size:16px">${esc(sum)}</div><div class="sm acc">Press I, Enter or Esc to go back to the list</div>`, 'position:absolute;left:120px;right:120px;top:40px;bottom:50px;display:flex;flex-direction:column;gap:10px;padding:16px 20px;overflow:hidden;z-index:9', '', act('back'));
  // The Pokédex wall (its squares carry their numbers) has the Pocket look's own page, whatever the set is called.
  if (c.pk && n && isDexWall(p)) return pkDexWall({ title: name, n, index, cell: (i) => p.cell?.(i), hint: p.hint(index), tabs: p.tabs ? { labels: p.tabs.labels, index: p.tabs.index } : null, back: p.canBack }) + back;
  let body: string;
  if (n === 0 && kind !== 'bag' && c.ph) body = phEmpty(name, AREA_WORD[area], text, hints);
  else if (n === 0 && kind !== 'bag') body = H(name, area, hints) + `<div class="abs cen" style="left:0;right:0;top:220px;display:flex;font-size:26px;opacity:.6">Nothing here yet</div>` + TX(esc(text));
  else if (kind === 'grid') {
    // A cell the room said outright (the Pokédex) is not read off the canvas row.
    const said = p.cell?.(index), on = (i: number): boolean => { const x = p.cell?.(i); return x ? !x.off : p.problem(i) === null; };
    const cur = said ? null : row(index), found = Array.from({ length: n }, (_, i) => on(i)).filter(Boolean).length;
    const artOf = (file: string | null): { file: string; atlas: boolean } | null => (file ? { file, atlas: true } : null);
    const detail = said ? { title: said.title, body: said.body, art: said.off ? null : artOf(said.file) } : { title: cur!.label, body: cur!.note, facts: cur!.tag ? [['', cur!.tag] as const] : [], art: cur!.art };
    const wall: GridModel = { title: name, area, hints, n, cell: (i) => { const x = p.cell?.(i); if (x) return { art: artOf(x.file), label: x.off ? '' : x.title, off: x.off, sil: x.sil }; const r = row(i); return { art: r.art, label: r.label, off: p.problem(i) !== null }; }, index, detail, found, total: n, text };
    body = c.ph && /^PC\b/.test(name) ? phBox(c.ph, { ...wall, party: partyChips(scene), extras: p.extras?.(index) ?? [] }) : gridView(c, wall);
  } else if (kind === 'bag') {
    const inRun = !!services().session.run, notes = bagNotes(p.item?.(index));
    const bag = { title: name, hints, pockets: p.tabs ? { labels: p.tabs.labels, index: p.tabs.index } : null, n, item: (i: number) => ({ ...row(i), off: p.problem(i) !== null }), index, text };
    body = c.ph
      ? phBag(c.ph, { ...bag, strip: '', party: inRun ? partyChips(scene) : [], notes })
      : c.pk
        ? bagView(c, { ...bag, strip: '', ...(inRun ? { party: partyChips(scene), money: services().session.run!.money, ...(notes ? { notes } : {}) } : {}) })
        : bagView(c, { ...bag, strip: inRun ? partyStrip(partyChips(scene), 'left:24px;right:24px;bottom:100px', notes) : '' });
  } else if (kind === 'board') {
    // Only the rows near the cursor are on screen, so only those are read.
    const near = (i: number): boolean => Math.abs(i - index) < 8;
    const rows = Array.from({ length: n }, (_, i): BoardRow => {
      if (!near(i)) return { title: '', sub: '' };
      const said = p.board?.(i);
      if (said) return { ...said, off: p.problem(i) !== null };
      const r = row(i), prog = boardProgress(r.tag);
      // A count ("2/5") becomes the mock-ups' progress bar, a state tag and the count in words under the title.
      return prog
        ? { title: r.label, sub: [prog.count, r.note].filter(Boolean).join(' · '), tag: prog.state, pct: prog.pct, art: r.art, off: p.problem(i) !== null }
        : { title: r.label, sub: r.note, tag: r.tag, art: r.art, off: p.problem(i) !== null };
    });
    body = boardView(c, { title: name, area, rows, index, text, hints });
  } else {
    // menu: only the rows on screen are read.
    const v = c.v(3), size = v === 1 ? 8 : 7, s = v === 2 ? 0 : v === 1 ? gridStart(n, index, 8, 2) : scrollStart(n, index, 7);
    const near = (i: number): boolean => (v === 2 ? Math.min(Math.abs(i - index), n - Math.abs(i - index)) <= 1 : i >= s && i < s + size);
    const items = Array.from({ length: n }, (_, i) => {
      if (!near(i)) return { label: '' };
      const m = p.menu?.(i);
      if (m) return { label: m.label, note: m.note, disabled: p.problem(i) !== null };
      const r = row(i);
      return { label: r.label, note: v === 0 ? r.tag : [r.note, r.tag].filter(Boolean).join(' · '), disabled: p.problem(i) !== null };
    });
    const saidRow = p.menu?.(index), cur = saidRow ? null : row(index);
    const detail = saidRow ? { title: saidRow.label, body: saidRow.detail, sprite: saidRow.sprite ?? undefined, facts: saidRow.facts } : { title: cur!.label, body: [cur!.note, cur!.tag].filter(Boolean).join(' · ') || p.hint(index), sprite: cur!.art?.atlas ? cur!.art.file : undefined };
    body = menuView(c, { title: name, area, hints, items, index, detail, text });
  }
  // A Phantom page carries the chips, the tabs and the sheet inside itself; its Esc key hint is the Back button.
  if (c.ph) return phInto(body, phChips(extra) + (kind === 'bag' ? '' : phTabs(p.tabs)) + phSheet(sum));
  return body + chips + tabs + back + over;
}

export interface PickerView extends ReduxView { cols: number }

/** Mounts the New UI picture of a Picker. The Picker calls `refresh()` when its cursor, tab or summary changes. */
export function mountPickerView(scene: Phaser.Scene, p: PickerBridge, kind: PickerKind = pickerKind(pickerBand(p.title).name)): PickerView {
  let cols = 1;
  const tab = (k: string): void => { if (p.tabs && Number(k) !== p.tabs.index) p.tabs.onChange(Number(k)); };
  const view = mountRedux(scene, {
    render: (c) => {
      // A room's own page has no list to steer across: the cursor steps one row at a time.
      cols = p.page ? p.pageCols ?? 1 : c.pk && kind !== 'window' && isDexWall(p) ? PK_DEX_COLS : pickerCols(kind, c);
      return p.page ? p.page(c, p.index()) + (p.canBack ? BACK_HIT : '') : render(c, scene, p, kind);
    },
    acts: { pick: (i) => p.pick(Number(i)), tab, bracketPage: tab, back: () => p.back(), extra: (k) => p.extra?.(Number(k)) },
    overs: { over: (i) => p.hover(Number(i)) },
    clear: kind === 'window',
  });
  return Object.assign(view, { get cols() { return cols; } }) as PickerView;
}

