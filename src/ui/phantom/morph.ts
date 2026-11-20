// Redraws a Phantom view by changing only what differs, where the New UI swaps the whole picture. An element that
// is still there keeps its place in time, so an entrance animation plays once (not on every cursor move) and a
// cursor that moves from one row to the next glides with a CSS transition. Presentation only.

const isEl = (n: Node): n is Element => n.nodeType === 1;

/** Two nodes may be made into one another: same kind, same tag, same `data-key` (a new key means a new thing: it is put in fresh and plays its entrance). */
function alike(a: Node, b: Node): boolean {
  if (a.nodeType !== b.nodeType) return false;
  if (!isEl(a) || !isEl(b)) return true;
  return a.tagName === b.tagName && a.getAttribute('data-key') === b.getAttribute('data-key');
}

function attrs(a: Element, b: Element): void {
  for (const { name } of [...a.attributes]) if (!b.hasAttribute(name)) a.removeAttribute(name);
  for (const { name, value } of [...b.attributes]) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
}

function kids(a: Node, b: Node): void {
  let x = a.firstChild, y = b.firstChild;
  while (y) {
    const ny = y.nextSibling;
    if (!x) a.appendChild(y);
    else if (alike(x, y)) { node(x, y); x = x.nextSibling; }
    else { const nx = x.nextSibling; a.replaceChild(y, x); x = nx; }
    y = ny;
  }
  while (x) { const nx = x.nextSibling; a.removeChild(x); x = nx; }
}

function node(a: Node, b: Node): void {
  if (!isEl(a) || !isEl(b)) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  // A playing sprite is stepped through its frames by the stage's timer: leave it alone while it shows the same sheet.
  if (a.hasAttribute('data-play') && b.hasAttribute('data-play') && a.getAttribute('data-a') === b.getAttribute('data-a') && a.getAttribute('data-k') === b.getAttribute('data-k') && a.className === b.className) return;
  attrs(a, b);
  kids(a, b);
}

/** Makes `root`'s contents match `html`. */
export function morph(root: HTMLElement, html: string): void {
  const t = document.createElement('template');
  t.innerHTML = html;
  kids(root, t.content);
}
