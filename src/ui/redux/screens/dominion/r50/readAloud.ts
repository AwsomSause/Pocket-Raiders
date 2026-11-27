// DOMINION redesign R9: Read aloud (Settings · Access · Read aloud, mockup `readaloud`). The browser's own voice reads
// each new text box line on a Dominion page; with Highlight words on, the word being read is marked. Presentation only:
// it reads what the page already shows and never touches the run. Without speech in the browser it does nothing.

import type { DominionLook } from '../../../../../core/dominion/schema';

let last = '';
const RATE = { slow: 0.8, normal: 1, fast: 1.3 } as const;

/** The line on screen: the Read aloud page's box first, else the page's text box (its words, not the speaker's tab). */
function lineOf(root: HTMLElement | null): HTMLElement | null {
  return root?.querySelector<HTMLElement>('#r5 .rb47 p') ?? root?.querySelector<HTMLElement>('#r5 .foot p') ?? null;
}

function textOf(p: HTMLElement): string {
  const c = p.cloneNode(true) as HTMLElement;
  c.querySelectorAll('b, .nx23, .rt46, [style*="clip"]').forEach((n) => n.remove());
  return (c.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Wraps the line's own words in spans (once), so a word can be marked while it is read. */
function words(p: HTMLElement): HTMLElement[] {
  const have = [...p.querySelectorAll<HTMLElement>('[data-w]')];
  if (have.length) return have;
  const out: HTMLElement[] = [];
  for (const n of [...p.childNodes]) {
    if (n.nodeType !== 3 || !(n.textContent ?? '').trim()) continue;
    const frag = document.createDocumentFragment();
    for (const part of (n.textContent ?? '').split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.append(part); continue; }
      const s = document.createElement('span');
      s.dataset.w = String(out.length);
      s.textContent = part;
      out.push(s);
      frag.append(s);
    }
    n.replaceWith(frag);
  }
  p.classList.add('ra9');
  return out;
}

function speak(p: HTMLElement, look: DominionLook): void {
  const text = textOf(p);
  if (!text || typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = RATE[look.voiceRate];
  u.volume = look.voiceVol;
  // Voice: a browser voice by name; Rotom (empty) is the browser's own first voice.
  if (look.voice) { const v = speechSynthesis.getVoices().find((x) => x.name === look.voice); if (v) u.voice = v; }
  if (look.highlight) {
    const ws = words(p);
    const starts: number[] = [];
    let at = 0;
    for (const w of ws) { const i = text.indexOf(w.textContent ?? '', at); starts.push(i); at = i + (w.textContent ?? '').length; }
    p.closest('.rb47')?.classList.add('ra9');
    u.onboundary = (e) => {
      let k = 0;
      for (let i = 0; i < starts.length; i++) if (starts[i]! <= e.charIndex) k = i;
      ws.forEach((w, i) => w.classList.toggle('now', i === k));
    };
    u.onend = () => ws.forEach((w) => w.classList.remove('now'));
  }
  speechSynthesis.speak(u);
}

/** After a draw: reads the text box when its line is new. */
export function readAloud(root: HTMLElement | null, look: DominionLook): void {
  if (!look.readAloud) { last = ''; return; }
  const p = lineOf(root);
  if (!p) return;
  const t = textOf(p);
  if (!t || t === last) return;
  last = t;
  speak(p, look);
}

/** R on the Read aloud page (and turning it on): reads the line on screen again. */
export function readAloudNow(root: HTMLElement | null, look: DominionLook): void {
  const p = lineOf(root);
  if (!p) return;
  last = textOf(p);
  speak(p, look);
}
