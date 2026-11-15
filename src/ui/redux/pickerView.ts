// New UI for the shared Picker list (ui/partyPanel.ts): every hub room, archive and run menu built on it is drawn
// with the mock-ups' menu, grid or board template. The Picker stays the controller; this reads what each row drew
// (its words and its picture) and lays it out again. Presentation only.

import Phaser from 'phaser';
import type { AssetManifest } from '../../assets/catalog';
import { rxFileOf } from './assets';
import { mountRedux, type ReduxCtx, type ReduxView } from './stage';
import { act, type Area, esc, H, TX, W } from './kit';
import { gridView, menuView, pic, scrollStart, tabsBar } from './templates';

export interface PickerBridge {
  title: string;
  rows: number;
  index: () => number;
  /** The row's container as the Picker drew it. */
  box: (i: number) => Phaser.GameObjects.Container | undefined;
  problem: (i: number) => string | null;
  hint: (i: number) => string;
  tabs?: { labels: readonly string[]; index: number; onChange: (index: number) => void };
  canBack: boolean;
  backLabel?: string;
  /** The quick-summary text while it is open (I), else null. */
  summary: () => string | null;
  pick: (i: number) => void;
  hover: (i: number) => void;
  back: () => void;
}

export type PickerKind = 'menu' | 'grid' | 'board';

/** Which template a list uses, by its title: the mock-ups' own rule for hub rooms (redux-07.js `kind`). */
const KIND_BY_NAME: [RegExp, PickerKind][] = [
  // The mock-up catalogue names these screens outright (redux-explorer.js SETS); the rule below covers the rest.
  [/^(lore|story|remembrance) archive|^tales|^run history|^trainer quests|^event hall|^content status|^seed board|run journal|memory lane|fallen trainers|battle replays|leaderboard|^bonds|story journal|^rival|^people|relationships|field notes|^notes/i, 'board'],
  [/^bank|^mentors|^mod packs|district|preparation desk|^camp|in this run|raid prep|^menu$/i, 'menu'],
  [/^trainer (archive|select)|species mastery|keepsakes|character database|moment codex|wardrobe|legacy gallery|berry bestiary|hall of memories|heirlooms|pok[eé]dex|^pc\b|^album/i, 'grid'],
];

export function pickerKind(title: string): PickerKind {
  for (const [re, kind] of KIND_BY_NAME) if (re.test(title)) return kind;
  if (/archive|gallery|museum|wardrobe|album|codex|dex|mastery|keepsake|heirloom|bestiary|database|legacy/i.test(title)) return 'grid';
  if (/achiev|quest|history|journal|news|event|leader|status|replay|memor|fallen|seed|hall|contract|bounty|mentor/i.test(title)) return 'board';
  return 'menu';
}

/** Header colour by title: run menus teal, party green, shop orange, the rest hub blue. */
function areaOf(title: string): Area {
  if (/party|pok[eé]mon|team|summary|bond/i.test(title)) return 'party';
  if (/shop|mart|merchant|exchange|bank/i.test(title)) return 'shop';
  if (/bag|item|camp|map|route|journal|notes/i.test(title)) return 'run';
  return 'hub';
}

/** How many columns the cursor moves across in each template and layout (the Picker steers by this in the New UI). */
export function pickerCols(kind: PickerKind, c: Pick<ReduxCtx, 'v'>): number {
  if (kind === 'grid') return c.v(2) === 1 ? 5 : 6;
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
        if (o.visible && o.text.trim()) texts.push({ t: o.text.trim(), size: parseInt(String(o.style.fontSize), 10) || 16, right: o.originX === 1 });
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

const attr = (k: number): string => `${act('pick', k)} data-over="over"`;
const more = (n: number, s: number, size: number, st: string): string => (n > size ? `<div class="abs sm" style="${st}">${s > 0 ? '▲' : ''} ${s + 1}–${Math.min(n, s + size)} of ${n} ${s + size < n ? '▼' : ''}</div>` : '');

function render(c: ReduxCtx, scene: Phaser.Scene, p: PickerBridge, kind: PickerKind): string {
  // "Bank · 0 credits · 0 candies": the name goes in the band, the rest becomes chips beside it.
  const [name = '', ...extra] = p.title.split(/\s+·\s+/);
  const n = p.rows, index = p.index(), area = areaOf(name);
  const chips = extra.length ? `<div class="abs row" style="left:350px;top:13px;gap:6px;z-index:4">${extra.map((x, k) => `<span class="tg${k ? ' no' : ''}">${esc(x)}</span>`).join('')}</div>` : '';
  const hints: [string, string][] = [['Enter', 'choose'], ...(p.tabs ? [['←→', 'tab'] as [string, string]] : []), ...(p.canBack ? [['Esc', p.backLabel ?? 'back'] as [string, string]] : [])];
  const row = (i: number): Scraped => scrapeRow(scene, p.box(i));
  const text = n ? p.problem(index) ?? p.hint(index) : p.canBack ? 'Nothing here yet. Press Esc to go back.' : 'Nothing here yet.';
  const tabs = p.tabs ? tabsBar(p.tabs.labels, p.tabs.index) : '';
  const back = p.canBack ? `<div class="abs hit" style="left:0;top:0;width:330px;height:48px;z-index:4"${act('back')}></div>` : '';
  const sum = p.summary();
  const over = sum === null ? '' : '<div class="shade" style="z-index:8"></div>' + W(`<div style="white-space:pre-wrap;line-height:22px;font-size:16px">${esc(sum)}</div><div class="sm acc">Press I, Enter or Esc to go back to the list</div>`, 'position:absolute;left:120px;right:120px;top:40px;bottom:50px;display:flex;flex-direction:column;gap:10px;padding:16px 20px;overflow:hidden;z-index:9', '', act('back'));
  let body: string;
  if (n === 0) body = H(name, area, hints) + `<div class="abs cen" style="left:0;right:0;top:220px;display:flex;font-size:26px;opacity:.6">Nothing here yet</div>` + TX(esc(text));
  else if (kind === 'grid') {
    const cur = row(index), found = Array.from({ length: n }, (_, i) => p.problem(i) === null).filter(Boolean).length;
    body = gridView(c, { title: name, area, hints, n, cell: (i) => { const r = row(i); return { art: r.art, label: r.label, off: p.problem(i) !== null }; }, index, detail: { title: cur.label, body: cur.note, facts: cur.tag ? [['', cur.tag]] : [], art: cur.art }, found, total: n, text });
  } else if (kind === 'board') {
    if (c.v(2) === 1) {
      const s = scrollStart(n, index, 6) & ~1;
      body = H(name, area, hints) + `<div class="abs" style="left:24px;right:24px;top:70px;display:grid;grid-template-columns:1fr 1fr;gap:18px">${Array.from({ length: Math.min(6, n - s) }, (_, q) => { const i = s + q, r = row(i); return W(`<div class="row">${pic(r.art, 30)}<b class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.label)}</b>${r.tag ? `<span class="tg${i === index ? '' : ' no'}">${esc(r.tag)}</span>` : ''}</div><div class="sm" style="line-height:19px;max-height:38px;overflow:hidden">${esc(r.note)}</div>`, 'display:flex;flex-direction:column;gap:6px;padding:10px 14px;min-width:0', i === index ? 'sel' : p.problem(i) ? 'dim' : '', attr(i)); }).join('')}</div>` + more(n, s, 6, 'right:28px;top:438px') + TX(esc(text));
    } else {
      const s = scrollStart(n, index, 5);
      body = H(name, area, hints) + `<div class="abs col" style="left:24px;right:24px;top:72px;gap:15px">${Array.from({ length: Math.min(5, n - s) }, (_, q) => { const i = s + q, r = row(i); return W(`${pic(r.art, 36)}<div class="col grow" style="gap:4px"><b style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.label)}</b><span class="sm" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.note)}</span></div>${r.tag ? `<span class="tg${i === index ? '' : ' no'}">${esc(r.tag)}</span>` : ''}`, 'display:flex;align-items:center;gap:14px;padding:9px 16px', i === index ? 'sel' : p.problem(i) ? 'dim' : '', attr(i)); }).join('')}</div>` + more(n, s, 5, 'right:28px;top:446px') + TX(esc(text));
    }
  } else {
    // menu: only the rows on screen are read.
    const v = c.v(3), size = v === 1 ? 8 : 7, s = v === 2 ? 0 : v === 1 ? scrollStart(n, index, 8) & ~1 : scrollStart(n, index, 7);
    const near = (i: number): boolean => (v === 2 ? Math.min(Math.abs(i - index), n - Math.abs(i - index)) <= 1 : i >= s && i < s + size);
    const items = Array.from({ length: n }, (_, i) => { if (!near(i)) return { label: '' }; const r = row(i); return { label: r.label, note: v === 0 ? r.tag : [r.note, r.tag].filter(Boolean).join(' · '), disabled: p.problem(i) !== null }; });
    const cur = row(index);
    body = menuView(c, { title: name, area, hints, items, index, detail: { title: cur.label, body: [cur.note, cur.tag].filter(Boolean).join(' · ') || p.hint(index), sprite: cur.art?.atlas ? cur.art.file : undefined }, text });
  }
  return body + chips + tabs + back + over;
}

export interface PickerView extends ReduxView { cols: number }

/** Mounts the New UI picture of a Picker. The Picker calls `refresh()` when its cursor, tab or summary changes. */
export function mountPickerView(scene: Phaser.Scene, p: PickerBridge, kind: PickerKind = pickerKind(p.title.split(/\s+·\s+/)[0] ?? '')): PickerView {
  let cols = 1;
  const view = mountRedux(scene, {
    render: (c) => {
      cols = pickerCols(kind, c);
      return render(c, scene, p, kind);
    },
    acts: { pick: (i) => p.pick(Number(i)), tab: (k) => p.tabs && Number(k) !== p.tabs.index && p.tabs.onChange(Number(k)), back: () => p.back() },
    overs: { over: (i) => p.hover(Number(i)) },
  });
  return Object.assign(view, { get cols() { return cols; } }) as PickerView;
}

