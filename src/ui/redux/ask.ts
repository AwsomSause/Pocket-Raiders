// New UI: a typed answer on the mock-ups' `form` page (a value box, the letter keys, Paste / OK / Clear), used where
// the Old look opens the browser's own prompt box. The answer comes back when the player confirms; Esc gives null.

import type Phaser from 'phaser';
import type { Area } from './kit';
import { formView } from './screens/run';
import { mountRedux } from './stage';

export interface AskOptions {
  title: string;
  area?: Area;
  /** The line over the value box. */
  heading: string;
  /** The text box under the keys. */
  text: string;
  /** The middle button's word (Confirm). */
  ok?: string;
  /** What the box holds at first. */
  value?: string;
}

export function askText(scene: Phaser.Scene, o: AskOptions): Promise<string | null> {
  return new Promise((resolve) => {
    let lit = '', note = o.text, over = false;
    const ok = o.ok ?? 'Confirm';
    const el = document.createElement('input');
    el.type = 'text';
    el.value = o.value ?? '';
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('aria-label', o.heading);
    el.dataset.testid = 'ask-input';
    Object.assign(el.style, { position: 'fixed', zIndex: '41', boxSizing: 'border-box', border: '0', background: 'transparent', textAlign: 'center', letterSpacing: '.12em', fontWeight: '700', padding: '0', outline: 'none' } satisfies Partial<CSSStyleDeclaration>);
    const view = mountRedux(scene, {
      render: (c) => formView(c, { title: o.title, area: o.area ?? 'sys', heading: o.heading, buttons: [['Paste', 'paste'], [ok, 'ok'], ['Clear', 'clear']], primary: 1, lit, text: note, hints: [['Enter', ok.toLowerCase()], ['Esc', 'back']] }),
      acts: {
        key: (ch) => { lit = ch; set(el.value + ch); },
        btn: (b) => { if (b === 'ok') finish(el.value); else if (b === 'paste') void paste(); else { lit = ''; set(''); } },
      },
    });
    const set = (text: string): void => { el.value = text; el.focus({ preventScroll: true }); view.refresh(); };
    const paste = async (): Promise<void> => {
      try {
        set((await navigator.clipboard.readText()).trim());
      } catch {
        note = 'Paste is blocked here: long-press the box and choose Paste.';
        set(el.value);
      }
    };
    const place = (): void => {
      const field = view.el.querySelector<HTMLElement>('.rx-field');
      if (!field) return;
      const f = field.getBoundingClientRect(), look = getComputedStyle(field), k = scene.game.canvas.getBoundingClientRect().width / Math.max(1, scene.scale.width);
      Object.assign(el.style, { left: `${f.left}px`, top: `${f.top}px`, width: `${f.width}px`, height: `${f.height}px`, fontSize: `${Math.max(16, 26 * k)}px`, fontFamily: look.fontFamily, color: look.color });
    };
    const cancel = (): void => finish(null);
    function finish(answer: string | null): void {
      if (over) return;
      over = true;
      scene.events.off('postupdate', place);
      scene.events.off('shutdown', cancel);
      el.remove();
      view.destroy();
      resolve(answer);
    }
    el.addEventListener('keydown', (e) => {
      // The scene under the form must not hear the typing.
      e.stopPropagation();
      if (e.key === 'Enter') finish(el.value);
      else if (e.key === 'Escape') finish(null);
    });
    el.addEventListener('input', () => { lit = el.value.slice(-1).toUpperCase(); view.refresh(); });
    // A click beside the box must not hand the keys back to the scene under the form.
    el.addEventListener('blur', () => window.setTimeout(() => { if (!over) el.focus({ preventScroll: true }); }, 0));
    document.body.appendChild(el);
    scene.events.on('postupdate', place);
    scene.events.once('shutdown', cancel);
    place();
    el.focus({ preventScroll: true });
  });
}
