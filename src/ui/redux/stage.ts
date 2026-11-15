// The New UI stage (UI mock-ups update): a 960 x 540 HTML layer laid exactly over the game canvas, drawn with the
// mock-ups' own CSS. A scene stays the controller (state, keyboard, outcomes); its view here only draws what the scene
// tells it and passes clicks back. Presentation only: nothing here reads or changes a random stream or a save.
// "Old" in Settings > Display > UI style turns this layer off and the scene's own Phaser drawing shows instead.

import './redux.css';
import type Phaser from 'phaser';
import { REDUX_SKINS, reduxLayout, reduxSkinIndex, type ReduxSkin } from '../../core/presentation/redux';
import { services } from '../../game/services';
import { onRxAssets, rxAtlas } from './assets';

export interface ReduxCtx {
  /** Index of the look in use (0 to 19). */
  k: number;
  skin: ReduxSkin;
  /** Which layout this look uses for a screen that has `layouts` of them (the mock-ups' own rule). */
  v: (layouts: number) => number;
}

export interface ReduxView {
  /** Redraws on the next frame. Call after the scene's state changes. */
  refresh(): void;
  destroy(): void;
  /** Hides the view (the scene's own Phaser picture shows through) or brings it back. */
  visible(on: boolean): void;
  readonly el: HTMLElement;
}

export interface ReduxOptions {
  render: (c: ReduxCtx) => string;
  /** Click handlers by name; an element with `data-act="name"` calls its handler with its `data-arg`. */
  acts?: Record<string, (arg: string) => void>;
  /** Pointer-over handlers by name (`data-over="name"`), for moving the cursor with the mouse. */
  overs?: Record<string, (arg: string) => void>;
  /** Tooltips: called with the `data-tip` value the pointer rests on, and with null once it is on none. */
  tip?: (arg: string | null) => void;
  /** No backdrop and clicks fall through to the canvas except on `[data-act]` (a HUD over the Phaser picture). */
  clear?: boolean;
}

const FONT_FILES: [string, number, string][] = [
  ['Cinzel', 600, 'redux/cinzel-600'], ['Cinzel', 700, 'redux/cinzel-600'], ['Jersey 15', 400, 'redux/jersey-15-400'],
  ['M PLUS Rounded 1c', 500, 'redux/m-plus-rounded-1c-500'], ['M PLUS Rounded 1c', 800, 'redux/m-plus-rounded-1c-800'],
  ['Oswald', 500, 'redux/oswald-500'], ['Oswald', 600, 'redux/oswald-500'],
  ['Pixelify Sans', 400, 'redux/pixelify-sans-400'], ['Pixelify Sans', 600, 'redux/pixelify-sans-400'], ['Pixelify Sans', 700, 'redux/pixelify-sans-400'],
  ['Rajdhani', 600, 'redux/rajdhani-600'], ['Rajdhani', 700, 'redux/rajdhani-700'], ['Tiny5', 400, 'redux/tiny5-400'],
  ['PRMain', 400, 'pokemon-emerald-pro'], ['PRBold', 400, 'pkmnems'],
];

let host: HTMLDivElement | null = null;
let canvas: HTMLCanvasElement | null = null;
const views = new Set<{ redraw: () => void }>();
let lastBox = '';
/** The scene whose view was last removed, and when: the same screen redrawing itself does not fade in again. */
let gone = { key: '', at: 0 };

/** True while the New UI is chosen (Settings > Display > UI style). */
/**
 * `?ui=new` or `?ui=old` in the address picks the style for this page load, over the saved setting (handy for
 * comparing the two). A browser driven by automation (the Playwright tests) gets Old unless it asks for New:
 * the older browser tests click and read the canvas, which the New UI layer covers. New has its own specs.
 */
const forced: 'new' | 'old' | null = (() => {
  if (typeof location === 'undefined') return null;
  const q = new URLSearchParams(location.search).get('ui');
  if (q === 'new' || q === 'old') return q;
  return typeof navigator !== 'undefined' && navigator.webdriver ? 'old' : null;
})();
export const reduxOn = (): boolean => (forced ?? services().session.settings.uiStyle) === 'new';

function skinCss(): string {
  return REDUX_SKINS.map((s, i) => {
    const pat = s.dots ? `radial-gradient(${s.p2} 2px,#0000 2px) 0 0/24px 24px,${s.g}` : s.grid ? `linear-gradient(${s.f}22 2px,#0000 2px) 0 0/32px 32px,linear-gradient(90deg,${s.f}22 2px,#0000 2px) 0 0/32px 32px,${s.g}` : `repeating-conic-gradient(#ffffff0c 0 25%,#0000 0 50%) 0 0/64px 64px,${s.g}`;
    return `.rx .sk${i}{--g:${s.g};--p:${s.p};--p2:${s.p2};--l:${s.l};--f:${s.f};--acc:${s.acc};--pa:${s.pa};--pai:${s.pai};--tf:${s.tf};--ink:${s.ink ?? '#f8f8f8'};--wink:${s.wink ?? '#f8f8f8'};--font:"${s.font}";--fs:${s.fs ?? 18}px;--fw:${s.fw ?? 400};--pat:${pat}}`;
  }).join('\n');
}

export const skinClass = (k: number): string => {
  const s = REDUX_SKINS[k]!;
  return `stage sk${k} b-${s.band} k-${s.btn} w-${s.win}${s.caps ? ' caps' : ''}`;
};

function place(): void {
  if (!host || !canvas) return;
  const r = canvas.getBoundingClientRect();
  const box = `${r.left}|${r.top}|${r.width}|${canvas.style.filter}`;
  if (box === lastBox) return;
  lastBox = box;
  host.style.left = `${r.left}px`;
  host.style.top = `${r.top}px`;
  host.style.setProperty('--s', String(r.width / 960));
  host.style.filter = canvas.style.filter;
}

function ensureHost(game: Phaser.Game): HTMLDivElement {
  if (host) return host;
  canvas = game.canvas;
  const style = document.createElement('style');
  style.id = 'rx-skins';
  style.textContent = FONT_FILES.map(([fam, w, f]) => `@font-face{font-family:"${fam}";font-style:normal;font-weight:${w};font-display:swap;src:url("assets/fonts/${f}.woff2") format("woff2")}`).join('\n') + '\n' + skinCss();
  document.head.append(style);
  host = document.createElement('div');
  host.id = 'rx';
  host.className = 'rx';
  document.body.append(host);
  // The canvas moves and resizes with the window and with Settings > Screen size; follow it.
  window.addEventListener('resize', place);
  game.scale.on('resize', place);
  window.setInterval(place, 250);
  // Plays the atlas frames of every sprite marked data-play (the mock-ups' own 95 ms step).
  window.setInterval(() => {
    if (!host || document.hidden || !services().session.settings.spriteAnimations) return;
    host.querySelectorAll<HTMLElement>('.an[data-play]').forEach((el) => {
      const a = rxAtlas(el.dataset.a!);
      if (!a || a.f.length < 2) return;
      const n = ((Number(el.dataset.i) || 0) + 1) % a.f.length;
      el.dataset.i = String(n);
      const k = Number(el.dataset.k), [x, y, w, h, ox, oy] = a.f[n]!, b = (el.firstChild as HTMLElement).style;
      b.left = `${ox * k}px`; b.top = `${oy * k}px`; b.width = `${w * k}px`; b.height = `${h * k}px`; b.backgroundPosition = `${-x * k}px ${-y * k}px`;
    });
  }, 95);
  onRxAssets(() => views.forEach((v) => v.redraw()));
  return host;
}

/** Draws a scene's New UI view over the canvas until the scene shuts down. Call only when `reduxOn()`. */
/** Where the pointer was at the last hover any view took (shared, so a view opening under a resting pointer does not count either). */
let overAt = '';

export function mountRedux(scene: Phaser.Scene, o: ReduxOptions): ReduxView {
  const root = ensureHost(scene.game);
  const el = document.createElement('div');
  el.dataset.scene = scene.scene.key;
  const again = gone.key === scene.scene.key && performance.now() - gone.at < 400;
  let k = -1;
  let ctx!: ReduxCtx;
  // The look can change while a screen is open (Settings > UI theme): read it at every draw.
  const dress = (): void => {
    const settings = services().session.settings;
    root.classList.toggle('calm', !settings.menuAnimations || settings.disableAllAnimations);
    const now = reduxSkinIndex(settings.reduxSkin);
    if (now === k) return;
    k = now;
    ctx = { k, skin: REDUX_SKINS[k]!, v: (n) => reduxLayout(k, n) };
    el.className = skinClass(k) + (o.clear ? ' clear' : '') + (again ? ' noin' : '');
  };
  dress();
  root.append(el);
  lastBox = '';
  place();

  let last = '', queued = false, dead = false;
  const redraw = (): void => {
    queued = false;
    if (dead) return;
    dress();
    const html = o.render(ctx);
    if (html === last) return;
    last = html;
    el.innerHTML = html;
  };
  const view = { redraw };
  const pick = (e: Event, attr: 'act' | 'over', table?: Record<string, (arg: string) => void>): void => {
    const t = (e.target as HTMLElement).closest<HTMLElement>(`[data-${attr}]`);
    if (!t || !el.contains(t) || !table) return;
    const fn = table[t.dataset[attr]!];
    if (fn) fn(t.dataset.arg ?? '');
  };
  el.addEventListener('click', (e) => pick(e, 'act', o.acts));
  el.addEventListener('pointerover', (e) => {
    // A redraw puts a new element under a pointer that is resting; only a pointer that moved is a hover, or the
    // cursor would snap back to the mouse on every key press.
    const at = `${e.clientX},${e.clientY}`;
    if (at === overAt) return;
    overAt = at;
    pick(e, 'over', o.overs);
  });
  // Tooltips follow the pointer anywhere on the page, so leaving an element (onto the canvas too) is noticed.
  let tipAt: string | null = null;
  const onTip = (e: PointerEvent): void => {
    const t = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-tip]') : null;
    const now = t && el.contains(t) ? t.dataset.tip ?? null : null;
    if (now === tipAt) return;
    tipAt = now;
    o.tip?.(now);
  };
  if (o.tip) window.addEventListener('pointermove', onTip);
  // A press on the stage must not also reach whatever page element sits under it.
  el.addEventListener('pointerdown', (e) => e.stopPropagation());

  const hide = (): void => { el.style.display = 'none'; };
  const show = (): void => { el.style.display = ''; };
  const destroy = (): void => {
    if (dead) return;
    dead = true;
    views.delete(view);
    gone = { key: scene.scene.key, at: performance.now() };
    window.removeEventListener('pointermove', onTip);
    el.remove();
    scene.events.off('shutdown', destroy);
    scene.events.off('destroy', destroy);
    scene.events.off('sleep', hide);
    scene.events.off('wake', show);
  };
  scene.events.once('shutdown', destroy);
  scene.events.once('destroy', destroy);
  scene.events.on('sleep', hide);
  scene.events.on('wake', show);
  views.add(view);
  redraw();
  return {
    el,
    destroy,
    visible: (on) => (on ? show() : hide()),
    refresh: () => {
      if (queued || dead) return;
      queued = true;
      requestAnimationFrame(redraw);
    },
  };
}
