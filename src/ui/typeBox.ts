// A one-line text box over the New look's layer (Dominion slice D21: "Type…" at the applications desk; reusable by the
// later talk slices). While it is open every key press belongs to it (a window capture listener, as in the Key-Card
// vault), so typing "a" or "d" never stamps the papers behind it. Enter sends, Esc cancels. The text is handed back as
// typed; the caller clamps it and wraps it before it ever reaches a Rotom prompt.

let open: { close: () => void } | null = null;

export const typeBoxOpen = (): boolean => !!open;

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface TypeBoxOpts {
  title: string;
  placeholder?: string;
  maxChars: number;
  onSend: (text: string) => void;
  onClose?: () => void;
}

export function openTypeBox(o: TypeBoxOpts): void {
  if (open) return;
  const host = document.getElementById('rx');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'stage';
  el.style.zIndex = '60';
  el.style.background = 'none';
  el.dataset.testid = 'type-box';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', o.title);
  el.innerHTML = `<div class="dom" style="position:absolute;left:0;top:0;width:960px;height:540px"><div class="a" style="inset:0;background:rgba(6,8,18,.55)" data-tb="close"></div>
    <div class="pnl" style="left:200px;top:180px;width:560px;height:150px;padding:12px 14px;z-index:2">
      <div class="hd" style="font-size:15px;margin-bottom:8px">${esc(o.title)}</div>
      <input type="text" maxlength="${o.maxChars}" placeholder="${esc(o.placeholder ?? '')}" autocomplete="off" spellcheck="false" data-testid="type-box-input"
        style="width:100%;box-sizing:border-box;background:#0b1020;color:#eef1ff;border:0;border-radius:8px;padding:8px 10px;font:600 16px var(--ui);box-shadow:0 0 0 2px #56679d;outline:none">
      <div class="row xs" style="gap:10px;margin-top:10px;color:#c9d2f0"><span class="kc">Enter</span>ask<span class="kc">Esc</span>cancel<span class="r" data-tb="count"></span></div>
    </div></div>`;
  const input = el.querySelector('input') as HTMLInputElement;
  const count = el.querySelector('[data-tb="count"]') as HTMLElement;
  const draw = (): void => { count.textContent = `${input.value.length} / ${o.maxChars}`; };
  const close = (): void => {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', swallow, true);
    el.remove();
    open = null;
    o.onClose?.();
  };
  function swallow(e: KeyboardEvent): void { e.stopPropagation(); }
  function onKey(e: KeyboardEvent): void {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); return close(); }
    if (e.key === 'Enter' || e.key === 'NumpadEnter') {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      close();
      o.onSend(text);
    }
  }
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('keyup', swallow, true);
  input.addEventListener('input', draw);
  el.addEventListener('click', (e) => { if ((e.target as HTMLElement).dataset.tb === 'close') close(); });
  host.append(el);
  open = { close };
  draw();
  input.focus();
}

/** Closes the box without sending (a scene that shuts down). */
export function closeTypeBox(): void {
  open?.close();
}
