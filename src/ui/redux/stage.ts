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
  /** A full-screen card (a versus card, a cutscene card): notifications and toasts wait until it leaves. */
  card?: boolean;
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
/** How many full-screen cards are up (see `ReduxOptions.card`). */
let cards = 0;
/** A full-screen card is up: the overlay keeps its notifications back. */
export const reduxCardUp = (): boolean => cards > 0;
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
  const box = `${r.left}|${r.top}|${r.width}|${r.height}|${canvas.style.filter}|${document.body.className}|${reduxOn()}`;
  if (box === lastBox) return;
  lastBox = box;
  // A phone held upright turns the game a quarter turn (ui/portraitRotate.ts): the layer turns with it, about the
  // canvas's own top-left corner, which then sits at the top right of the box on screen.
  const turned = document.body.classList.contains('rot-portrait');
  host.style.left = `${turned ? r.right : r.left}px`;
  host.style.top = `${r.top}px`;
  host.style.transformOrigin = '0 0';
  host.style.transform = turned ? 'rotate(90deg)' : '';
  host.style.setProperty('--s', String((turned ? r.height : r.width) / 960));
  host.style.filter = canvas.style.filter;
  // The on-screen pad lies over the game on a phone held sideways; it must stay above the layer to be pressed.
  document.body.classList.toggle('rx-on', reduxOn());
  // Evil Mode slice 22 (Part 29 section 17): a narrow window (a phone in landscape) gets thumb-sized tap targets.
  document.body.classList.toggle('rx-phone', (turned ? r.height : r.width) < 820);
  document.body.style.setProperty('--rxs', String((turned ? r.height : r.width) / 960));
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
  // Springy buttons: a button-sized clickable gets .sp (redux.css) when the pointer reaches it. Whole-screen click
  // areas and big panels stay put, like the canvas rule in wiiMotion.ts.
  const spring = (e: Event): void => {
    const t = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-act]') : null;
    if (!t || t.classList.contains('sp') || t.classList.contains('off')) return;
    if (t.offsetWidth <= 420 && t.offsetHeight <= 300) t.classList.add('sp');
  };
  host.addEventListener('pointerover', spring, true);
  host.addEventListener('pointerdown', spring, true);
  // A springing button lifts a pixel or two, so a press can land beside where the hover began. Where the pointer
  // last moved or pressed is where it rests: a view that opens under it there has not been hovered (see `overAt`).
  // A real move still counts, because the browser sends pointerover before the pointermove of the same step.
  const rest = (e: PointerEvent): void => { overAt = `${e.clientX},${e.clientY}`; };
  window.addEventListener('pointermove', rest, true);
  window.addEventListener('pointerdown', rest, true);
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


// A press that began on the layer (it ends with the release, wherever that lands).
let pressOnLayer = false;
let pressWatch = false;

/**
 * Keeps a press on the layer from also pressing the canvas under it. Phaser listens on the window for presses and
 * releases outside its canvas (so a drag can end anywhere) and would press whatever canvas button lies at that spot:
 * a click on the log window over the title used to choose a title entry too. A release is only kept back when its
 * press began on the layer, so a drag that began on the canvas still ends.
 */
function shield(el: HTMLElement): void {
  if (!pressWatch && typeof window !== 'undefined') {
    pressWatch = true;
    // Capture runs first; the flag drops after the release has been handled by the layer.
    for (const ev of ['mouseup', 'touchend', 'touchcancel'] as const) window.addEventListener(ev, () => setTimeout(() => { pressOnLayer = false; }, 0), true);
  }
  for (const ev of ['pointerdown', 'mousedown', 'touchstart'] as const) el.addEventListener(ev, (e) => { pressOnLayer = true; e.stopPropagation(); });
  for (const ev of ['mouseup', 'touchend'] as const) el.addEventListener(ev, (e) => { if (pressOnLayer) e.stopPropagation(); });
}

/**
 * One layer over every scene's view, for what belongs to no screen: notifications, toasts, the interaction log.
 * It lives as long as the game, wears the current look, takes clicks only on `[data-act]`, and draws nothing in Old.
 */
export function mountOverlay(game: Phaser.Game, o: Pick<ReduxOptions, 'render' | 'acts'>): { refresh(): void; readonly el: HTMLElement } {
  const root = ensureHost(game);
  const el = document.createElement('div');
  el.dataset.scene = 'overlay';
  el.style.zIndex = '60';
  el.style.display = 'none';
  root.append(el);
  let last = '';
  const redraw = (): void => {
    const k = reduxSkinIndex(services().session.settings.reduxSkin);
    el.className = `${skinClass(k)} clear noin`;
    const html = reduxOn() ? o.render({ k, skin: REDUX_SKINS[k]!, v: (n) => reduxLayout(k, n) }) : '';
    if (html === last) return;
    last = html;
    el.innerHTML = html;
    el.style.display = html ? '' : 'none';
  };
  el.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    const fn = t && el.contains(t) ? o.acts?.[t.dataset.act!] : undefined;
    if (fn) fn(t!.dataset.arg ?? '');
  });
  shield(el);
  views.add({ redraw });
  lastBox = '';
  place();
  redraw();
  return { refresh: redraw, el };
}

/**
 * An empty see-through layer over every view, for a tool that builds its own DOM (the debug panel's form). It lives as
 * long as the game and wears the current look; only its `.hit` children and `[data-act]` take the pointer.
 */
export function mountTool(game: Phaser.Game, name: string): HTMLElement {
  const root = ensureHost(game);
  const el = document.createElement('div');
  el.dataset.scene = name;
  el.style.zIndex = '70';
  root.append(el);
  const redraw = (): void => {
    el.className = `${skinClass(reduxSkinIndex(services().session.settings.reduxSkin))} clear noin`;
  };
  shield(el);
  views.add({ redraw });
  lastBox = '';
  place();
  redraw();
  return el;
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
  // Animations keep their place across redraws (every redraw replaces the view's HTML): a looping one runs on the
  // view's own clock (--now, a negative delay since the view opened), and a one-shot marked data-once="key" runs from
  // when that key first showed (--t0). A key that leaves the view and comes back plays again.
  const born = performance.now();
  let firstSeen = new Map<string, number>();
  const redraw = (): void => {
    queued = false;
    if (dead) return;
    dress();
    const html = o.render(ctx);
    if (html === last) return;
    last = html;
    const now = performance.now();
    el.style.setProperty('--now', `${Math.round(born - now)}ms`);
    el.innerHTML = html;
    if (!html.includes('data-once="')) { firstSeen.clear(); return; }
    const seen = new Map<string, number>();
    el.querySelectorAll<HTMLElement>('[data-once]').forEach((n) => {
      const key = n.dataset.once!, t = firstSeen.get(key) ?? now;
      seen.set(key, t);
      if (t < now) n.style.setProperty('--t0', `${Math.round(t - now)}ms`);
    });
    firstSeen = seen;
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
  shield(el);

  const hide = (): void => { el.style.display = 'none'; };
  const show = (): void => { el.style.display = ''; };
  const destroy = (): void => {
    if (dead) return;
    dead = true;
    views.delete(view);
    if (o.card) {
      cards -= 1;
      views.forEach((v) => v.redraw());
    }
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
  if (o.card) {
    cards += 1;
    views.forEach((v) => v.redraw());
  } else redraw();
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
