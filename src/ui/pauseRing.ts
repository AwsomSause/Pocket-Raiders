// The pause menu's pages as a ring (Phantom UI, the mock-ups' crumb "Pause › Party   Q Settings · Bag E"):
// a page opened from the pause menu shows where it is, and Q / E turn to the page before or after it.
// Presentation only: each page is opened and shut by the scene that owns it, through `go`.

import { esc } from './phantom/kit';

/** The ring's order, as the mock-ups' crumbs give it. */
export const PAUSE_RING = ['Party', 'Bag', 'Pokédex', 'Trainer card', 'Save', 'Settings'] as const;
export type RingPage = (typeof PAUSE_RING)[number];

interface Ring {
  page: RingPage;
  /** Deeper steps after the page ("Settings › Sound"). */
  trail: readonly string[];
  /** Opens another page of the ring (the owner shuts the one that is open first). */
  go: (to: RingPage) => void;
  /** True while the open page uses Q and E itself (a Settings page, the Pokédex's regions). */
  busy?: () => boolean;
}

let ring: Ring | null = null;
let installed = false;

/** The page before and after one in the ring. */
export function ringNeighbours(page: RingPage): [RingPage, RingPage] {
  const k = PAUSE_RING.indexOf(page), n = PAUSE_RING.length;
  return [PAUSE_RING[(k + n - 1) % n]!, PAUSE_RING[(k + 1) % n]!];
}

/** Marks a ring page as open (null: none is). */
export function setRing(next: Ring | null): void {
  ring = next;
  if (!installed && typeof window !== 'undefined') {
    installed = true;
    window.addEventListener('keydown', (e) => {
      if (!ring || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (e.code !== 'KeyQ' && e.code !== 'KeyE') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (ring.busy?.()) return;
      ringStep(e.code === 'KeyE' ? 1 : -1);
    });
  }
}

/** The open ring page's deeper steps change (a Settings page opens or shuts). */
export function setRingTrail(trail: readonly string[]): void {
  if (ring) ring = { ...ring, trail };
}

export function ringPage(): RingPage | null {
  return ring?.page ?? null;
}

/** Q (-1) or E (+1): the page before or after the open one. */
export function ringStep(dir: 1 | -1): void {
  if (!ring) return;
  const [prev, next] = ringNeighbours(ring.page);
  ring.go(dir > 0 ? next : prev);
}

/** The crumb at the page's foot: where you are, and the Q / E pages while those keys turn the ring. Empty off the ring. */
export function crumbHtml(): string {
  if (!ring) return '';
  const [prev, next] = ringNeighbours(ring.page);
  const steps = [ring.page, ...ring.trail];
  const keys = ring.busy?.() ? '' : `<em><kbd>Q</kbd>${esc(prev)}<i>·</i>${esc(next)}<kbd>E</kbd></em>`;
  return `<nav class="crumb" aria-label="where you are"><span>Pause</span>${steps.slice(0, -1).map((s) => `<span>${esc(s)}</span>`).join('')}<b>${esc(steps.at(-1)!)}</b>${keys}</nav>`;
}
