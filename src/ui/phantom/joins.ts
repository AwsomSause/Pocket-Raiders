// The Phantom UI's page changes, played on the page's own layer (mock-ups pass 20: Slash, Flare, Drop, Turn, Sweep,
// and Carry on top of each). The page that left stays for a moment as a still copy (its "ghost") under the new page
// and plays the way out while the new page plays the way in. Presentation only: the new page takes input at once,
// a ghost takes none, and nothing waits for an animation to end.
import type { JoinKind, JoinMotion } from '../../core/presentation/joins';

type Frames = Record<string, string | number | undefined>[];
type Play = { frames: (w: number, h: number) => Frames; ms: number; ease: string };

const IN: Record<JoinKind, Play> = {
  slash: { frames: () => [{ clipPath: 'polygon(60% 0,60% 0,40% 100%,40% 100%)' }, { clipPath: 'polygon(-40% 0,160% 0,140% 100%,-60% 100%)' }], ms: 500, ease: 'cubic-bezier(.3,0,.2,1)' },
  iris: { frames: () => [{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(80% at 50% 50%)' }], ms: 450, ease: 'cubic-bezier(.3,0,.2,1)' },
  drop: { frames: (_w, h) => [{ translate: `0 ${-h}px`, easing: 'cubic-bezier(.2,.9,.3,1)' }, { translate: `0 ${h * 0.02}px`, offset: 0.6, easing: 'cubic-bezier(.2,.9,.3,1)' }, { translate: '0 0' }], ms: 450, ease: 'linear' },
  page: { frames: (w) => [{ translate: `${w}px 0` }, { translate: '0 0' }], ms: 420, ease: 'cubic-bezier(.2,.9,.2,1)' },
  sweep: { frames: () => [{ clipPath: 'polygon(0 0,0 0,-40% 100%,-40% 100%)' }, { clipPath: 'polygon(0 0,140% 0,100% 100%,0 100%)' }], ms: 420, ease: 'cubic-bezier(.2,.8,.2,1)' },
};
/** The way out: [filter at the end, how much it grows, how far it slides (of its width), ms, easing]. */
const OUT: Record<JoinKind, { filter: string; grow: number; slide: number; ms: number; ease: string }> = {
  slash: { filter: 'brightness(3) saturate(0)', grow: 1.08, slide: 0, ms: 300, ease: 'ease' },
  iris: { filter: 'brightness(2.4)', grow: 1.12, slide: 0, ms: 300, ease: 'ease' },
  drop: { filter: 'brightness(.3) blur(3px)', grow: 0.96, slide: 0, ms: 450, ease: 'ease' },
  page: { filter: 'brightness(.4)', grow: 1, slide: -0.3, ms: 420, ease: 'ease' },
  sweep: { filter: 'brightness(.4)', grow: 1.04, slide: 0.04, ms: 300, ease: 'cubic-bezier(.5,0,.9,.4)' },
};
const FADE = 250;
/** What glides from its old spot to its new one (the mock-ups' shared parts), first match on each page. */
const CARRIED = [
  '.hd', '.day', '.keys', '.wallet', '.stp', '.crumb', '.stack,.mini,.pager',
  '[data-vt=mon],.bx-pic,.cp-pic,.de-mon,.ev-new,.ko-mon,.ln-mon,.sn-me,.wl-mon',
  '[data-vt=hero],.rv-bust,.ru-pic,.champ,.vs-p.l,.s-pause .hero,.s-title .me,.s-menu .who',
];
const CARRY_MS = 420, CARRY_EASE = 'cubic-bezier(.2,1.2,.3,1)';

const can = (el: HTMLElement): boolean => typeof el.animate === 'function';

/** Until when each page is still coming in. */
const coming = new WeakMap<HTMLElement, number>();
/**
 * True while a page's way in still plays. The page slides under a pointer that is resting, and that is not a hover:
 * the cursor stays where the keys put it.
 */
export const joinBusy = (el: HTMLElement): boolean => (coming.get(el) ?? 0) > performance.now();

/** Ghosts that no new page has taken up yet (a page closed; the next one may open in a moment). */
let waiting: { el: HTMLElement; id: string; at: number }[] = [];
/** The page that closed last, for the page that opens after a short load. */
let left: { id: string; at: number } | null = null;

/** A still copy of a Phantom view, put right under it: it takes no input and no test or handler can find it by the view's marks. */
function copy(el: HTMLElement): HTMLElement | null {
  if (!el.parentElement || !can(el)) return null;
  const g = el.cloneNode(true) as HTMLElement;
  for (const a of ['data-scene', 'data-scr']) g.removeAttribute(a);
  g.setAttribute('data-ghost', '');
  g.setAttribute('data-calm', '');
  g.setAttribute('aria-hidden', 'true');
  g.classList.add('still');
  g.style.pointerEvents = 'none';
  for (const n of g.querySelectorAll<HTMLElement>('[data-act],[data-over],[data-tip]')) {
    for (const a of ['data-act', 'data-over', 'data-tip']) n.removeAttribute(a);
  }
  el.before(g);
  // A list that was scrolled stays where it was.
  const from = el.querySelectorAll<HTMLElement>('*'), to = g.querySelectorAll<HTMLElement>('*');
  from.forEach((n, i) => { if ((n.scrollTop || n.scrollLeft) && to[i]) { to[i].scrollTop = n.scrollTop; to[i].scrollLeft = n.scrollLeft; } });
  g.querySelectorAll('.wipe').forEach((n) => n.remove());
  return g;
}

function leave(g: HTMLElement, kind: JoinKind | null, motion: JoinMotion): void {
  const done = (): void => g.remove();
  if (motion === 'off') return done();
  const r = g.getBoundingClientRect();
  let frames: Frames, ms: number, ease: string;
  if (motion === 'reduced' || kind === null) {
    // A page that closed onto the game (or a fade-only setting): a short fade.
    frames = [{ opacity: 1 }, { opacity: 0 }];
    ms = kind === null ? 180 : FADE;
    ease = 'ease';
  } else {
    const o = OUT[kind];
    // The view is scaled from its own corner: growing "from the middle" needs a slide back by half of what it grew.
    const cs = getComputedStyle(g).transformOrigin.split(' ').map((v) => parseFloat(v) || 0);
    const b = g.offsetWidth ? r.width / g.offsetWidth : 1;
    const dx = (1 - o.grow) * (r.width / 2 - b * (cs[0] ?? 0)) + o.slide * r.width, dy = (1 - o.grow) * (r.height / 2 - b * (cs[1] ?? 0));
    frames = [{ filter: 'none', scale: 1, translate: '0 0' }, { filter: o.filter, scale: o.grow, translate: `${dx}px ${dy}px` }];
    ms = o.ms;
    ease = o.ease;
  }
  const a = g.animate(frames, { duration: ms, easing: ease, fill: 'forwards' });
  a.onfinish = done;
  a.oncancel = done;
  // A tab in the background does not run animations: the ghost still goes.
  setTimeout(done, ms + 400);
}

/** Where a node's box lies inside `root`, by layout (so a running entrance does not move the answer). */
function spot(n: HTMLElement, root: HTMLElement): { x: number; y: number; w: number; h: number } | null {
  let x = 0, y = 0;
  for (let p: HTMLElement | null = n; p && p !== root; p = p.offsetParent as HTMLElement | null) {
    if (!root.contains(p)) return null;
    x += p.offsetLeft;
    y += p.offsetTop;
  }
  return n.offsetWidth && n.offsetHeight ? { x, y, w: n.offsetWidth, h: n.offsetHeight } : null;
}

/** Carry: each shared part of the new page starts where the old page had it and glides home. */
function carry(old: HTMLElement, el: HTMLElement): void {
  for (const sel of CARRIED) {
    const a = old.querySelector<HTMLElement>(sel), b = el.querySelector<HTMLElement>(sel);
    if (!a || !b) continue;
    const A = spot(a, old), B = spot(b, el);
    if (!A || !B) continue;
    const dx = A.x + A.w / 2 - (B.x + B.w / 2), dy = A.y + A.h / 2 - (B.y + B.h / 2);
    const fit = (v: number): number => Math.max(0.5, Math.min(2, v));
    const sx = fit(A.w / B.w), sy = fit(A.h / B.h);
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) { a.style.visibility = 'hidden'; continue; }
    a.style.visibility = 'hidden';
    b.animate([{ translate: `${dx}px ${dy}px`, scale: `${sx} ${sy}` }, { translate: '0 0', scale: '1 1' }], { duration: CARRY_MS, easing: CARRY_EASE });
  }
}

function enter(el: HTMLElement, kind: JoinKind, motion: JoinMotion): void {
  if (motion === 'off' || !can(el)) return;
  if (motion === 'reduced') return void el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE, easing: 'ease' });
  const r = el.getBoundingClientRect(), p = IN[kind];
  coming.set(el, performance.now() + p.ms);
  el.animate(p.frames(r.width, r.height) as Keyframe[], { duration: p.ms, easing: p.ease });
}

/** A view is closing: its ghost waits a moment for the page that takes its place, and fades if none comes. */
export function joinLeave(el: HTMLElement, id: string, motion: JoinMotion): void {
  left = { id, at: performance.now() };
  if (motion === 'off') return;
  const g = copy(el);
  if (!g) return;
  const mine = { el: g, id, at: performance.now() };
  waiting.push(mine);
  setTimeout(() => {
    if (!waiting.includes(mine)) return;
    waiting = waiting.filter((w) => w !== mine);
    leave(g, null, motion);
  }, 90);
}

/** The page that just closed, if a new page is opening right after it (within a short load). */
export const joinFrom = (): string | null => (waiting.length ? waiting[waiting.length - 1]!.id : left && performance.now() - left.at < 1500 ? left.id : null);

/** A copy of a view that is about to turn to another page in place. */
export const joinGhost = (el: HTMLElement, motion: JoinMotion): HTMLElement | null => (motion === 'off' ? null : copy(el));

/**
 * Page `el` has just been drawn: play its way in, and the way out on whatever it replaces (`old`, or the ghosts of
 * the views that just closed). `kind` null means the same page opened again: nothing plays.
 */
export function joinEnter(el: HTMLElement, kind: JoinKind | null, motion: JoinMotion, old: HTMLElement | null = null): void {
  const ghosts = [...waiting.map((w) => w.el), ...(old ? [old] : [])];
  waiting = [];
  left = null;
  if (kind === null || motion === 'off') return ghosts.forEach((g) => g.remove());
  const top = ghosts[ghosts.length - 1];
  if (top && motion === 'full') carry(top, el);
  ghosts.forEach((g) => leave(g, kind, motion));
  enter(el, kind, motion);
}

/** Settings > Look > Page changes, "Play one": the open page leaves and comes back by `kind` (Carry glides its title and keys in). */
export function joinPlay(el: HTMLElement, kind: JoinKind | 'share', motion: JoinMotion): void {
  if (motion === 'off' || !can(el)) return;
  if (kind !== 'share' || motion === 'reduced') {
    const g = copy(el);
    if (g) leave(g, kind === 'share' ? 'sweep' : kind, motion);
    return enter(el, kind === 'share' ? 'sweep' : kind, motion);
  }
  const hd = el.querySelector<HTMLElement>('.hd'), keys = el.querySelector<HTMLElement>('.keys');
  hd?.animate([{ translate: '420px 260px', scale: '1.4 1.4' }, { translate: '0 0', scale: '1 1' }], { duration: CARRY_MS * 2, easing: CARRY_EASE });
  keys?.animate([{ translate: '-360px -300px', scale: '.8 .8' }, { translate: '0 0', scale: '1 1' }], { duration: CARRY_MS * 2, easing: CARRY_EASE });
}
