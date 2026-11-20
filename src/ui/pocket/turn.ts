// Page changes of the Pocket look, as the mock-ups do them (plans/ui-redesign/src/kit.js `swap`): the browser's
// own view transition. The leaving page lifts away, the new one settles in, and every part marked `data-m`
// (header, key row, text box, the logo, the phone) glides from its old place to its new one.
// With menu animations off, or in a browser without view transitions, pages simply change. Presentation only.

type Doc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

/** A page that has left its scene and waits a moment for the next one, so the two can change into each other. */
let ghost: { el: HTMLElement; timer: number } | null = null;
/** A change is running: a second one waits for no one and simply draws. */
let busy = false;

/** Names every `data-m` part inside `within` for the transition; a name may be used once on the whole page. */
export function pkNames(host: HTMLElement, within: HTMLElement): void {
  host.querySelectorAll<HTMLElement>('[data-m]').forEach((n) => { if (n.style.viewTransitionName) n.style.viewTransitionName = ''; });
  const seen = new Set<string>();
  within.querySelectorAll<HTMLElement>('[data-m]').forEach((n) => {
    const k = 'pk-m-' + (n.dataset.m ?? '').replace(/[^a-z0-9-]/gi, '');
    if (seen.has(k)) return;
    seen.add(k);
    n.style.viewTransitionName = k;
  });
}

function dropGhost(): void {
  if (!ghost) return;
  window.clearTimeout(ghost.timer);
  ghost.el.remove();
  ghost = null;
}

/** A full page whose scene is closing: it stays up for a moment (it takes no clicks) for the next page to change from. Returns false when it should just go. */
export function pkGhost(el: HTMLElement, calm: boolean): boolean {
  const doc = document as Doc;
  if (calm || !doc.startViewTransition || document.hidden || el.style.display === 'none') return false;
  dropGhost();
  el.style.pointerEvents = 'none';
  el.dataset.ghost = '';
  ghost = { el, timer: window.setTimeout(dropGhost, 140) };
  return true;
}

/**
 * Changes the page: `draw` puts the new page up (and takes the old one down). `from` is the element showing the old
 * page (the view itself, or a waiting ghost), `to` the view that shows the new one.
 */
export function pkTurn(host: HTMLElement, from: HTMLElement | null, to: HTMLElement, draw: () => void, calm: boolean, kind = 'page'): void {
  const doc = document as Doc;
  const done = (): void => { dropGhost(); draw(); };
  if (calm || busy || !from || !doc.startViewTransition || document.hidden) { done(); return; }
  const root = document.documentElement;
  busy = true;
  pkNames(host, from);
  from.style.viewTransitionName = 'pk-stage';
  root.dataset.pkTr = kind;
  const end = (): void => { busy = false; delete root.dataset.pkTr; to.style.viewTransitionName = ''; };
  try {
    const t = doc.startViewTransition(() => {
      from.style.viewTransitionName = '';
      done();
      to.style.viewTransitionName = 'pk-stage';
      pkNames(host, to);
    });
    t.finished.then(end, end);
  } catch {
    end();
    from.style.viewTransitionName = '';
    done();
  }
}

/** The page waiting to be changed from, if any (see `pkGhost`). */
export const pkEnter = (): HTMLElement | null => ghost?.el ?? null;
