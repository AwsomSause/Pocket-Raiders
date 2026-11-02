// On-screen pad (catalog #125): arrows and Confirm/Back buttons that send the same key events as the keyboard,
// so every screen works by touch. Shown only on touch devices and narrow windows. Presentation only.

import { padJustify } from '../core/presentation/uiPrefs';
import type { Settings } from '../core/state';
import { padMode, showRotateHint, type Viewport } from '../core/presentation/touchLayout';

const BUTTONS: { label: string; code: string; keyCode: number; grid: string }[] = [
  { label: '▲', code: 'ArrowUp', keyCode: 38, grid: '1 / 2' },
  { label: '◀', code: 'ArrowLeft', keyCode: 37, grid: '2 / 1' },
  { label: '▼', code: 'ArrowDown', keyCode: 40, grid: '2 / 2' },
  { label: '▶', code: 'ArrowRight', keyCode: 39, grid: '2 / 3' },
  { label: 'OK', code: 'Enter', keyCode: 13, grid: '1 / 5' },
  { label: 'Back', code: 'Escape', keyCode: 27, grid: '2 / 5' },
  { label: 'Map', code: 'KeyM', keyCode: 77, grid: '3 / 5' },
];

const viewport = (): Viewport => ({ width: window.innerWidth, height: window.innerHeight, coarse: (window.matchMedia?.('(pointer: coarse)').matches ?? false) || new URLSearchParams(location.search).get('touch') === '1' });

function send(type: 'keydown' | 'keyup', code: string, keyCode: number): void {
  window.dispatchEvent(new KeyboardEvent(type, { code, key: code, keyCode, which: keyCode, bubbles: true } as KeyboardEventInit));
}

function press(code: string, keyCode: number): void {
  send('keydown', code, keyCode);
  send('keyup', code, keyCode);
}

/** One-handed layout (Settings > Controls): bunches the pad's two clusters to one edge. */
export function setTouchLayout(mode: Settings['oneHanded']): void {
  const pad = typeof document === 'undefined' ? null : document.getElementById('touch-pad');
  if (pad) pad.style.justifyContent = padJustify(mode);
}

export function installTouchControls(): void {
  if (typeof document === 'undefined' || document.getElementById('touch-pad')) return;
  const style = document.createElement('style');
  style.textContent = `
    #touch-pad{position:fixed;left:0;right:0;bottom:0;display:none;justify-content:space-between;align-items:center;padding:8px calc(14px + env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) calc(14px + env(safe-area-inset-left));gap:10px;background:rgba(20,16,30,.88);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;z-index:5}
    #touch-pad .dpad,#touch-pad .acts{display:grid;gap:6px}
    #touch-pad .dpad{grid-template-columns:repeat(3,48px);grid-template-rows:repeat(2,48px)}
    #touch-pad .acts{grid-template-columns:repeat(1,96px);grid-template-rows:repeat(2,48px)}
    #touch-pad button{font:600 18px system-ui,sans-serif;color:#fff;background:linear-gradient(#6fb7ff,#2f7fd8);border:0;border-radius:14px;min-width:48px;min-height:48px;touch-action:none;-webkit-tap-highlight-color:transparent}
    #touch-pad button:active{filter:brightness(1.25)}
    body.touch-pad-side #touch-pad{background:transparent;pointer-events:none;align-items:flex-end;padding-bottom:calc(10px + env(safe-area-inset-bottom))}
    body.touch-pad-side #touch-pad .dpad,body.touch-pad-side #touch-pad .acts{pointer-events:auto}
    body.touch-pad-side #touch-pad button{opacity:.55;box-shadow:0 2px 8px rgba(0,0,0,.45)}
    body.touch-pad-side.pad-min #touch-pad .dpad,body.touch-pad-side.pad-min #touch-pad .acts button:first-child{display:none}
    body.touch-pad-side.pad-min #touch-pad .acts{margin-left:auto;grid-template-rows:repeat(1,44px)}
    body.touch-pad-side #touch-pad .acts{grid-template-columns:repeat(1,84px);grid-template-rows:repeat(2,44px)}
    body.touch-pad-side #touch-pad .dpad{margin-left:56px;grid-template-columns:repeat(3,44px);grid-template-rows:repeat(2,44px)}
    body.touch-pad-side #touch-pad button{min-width:44px;min-height:44px}
    #touch-toggle{position:fixed;left:calc(10px + env(safe-area-inset-left));bottom:calc(10px + env(safe-area-inset-bottom));width:44px;height:44px;display:none;z-index:6;border:0;border-radius:12px;background:rgba(47,127,216,.7);color:#fff;font:600 20px system-ui,sans-serif;touch-action:none;-webkit-tap-highlight-color:transparent}
    #touch-pad .hub-only{display:none}
    body.in-hub #touch-pad .hub-only{display:block}
    body.touch-pad-side #touch-pad .acts{grid-template-rows:none;grid-auto-rows:44px}
    body.touch-pad-side #touch-pad{transition:opacity .4s}
    body.touch-pad-side.pad-idle #touch-pad{opacity:.45}
    #touch-fs{position:fixed;top:calc(6px + env(safe-area-inset-top));right:calc(6px + env(safe-area-inset-right));width:44px;height:44px;display:none;z-index:6;border:0;border-radius:12px;background:rgba(20,16,30,.6);color:#fff;font:600 20px system-ui,sans-serif;opacity:.7;touch-action:none;-webkit-tap-highlight-color:transparent}
    #rotate-hint{position:fixed;top:calc(6px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);display:none;background:rgba(20,16,30,.9);color:#fff;font:14px system-ui,sans-serif;padding:6px 12px;border-radius:12px;z-index:5;max-width:80vw;text-align:center}
    body.touch-pad-bottom #game{align-items:flex-start!important;height:calc(100vh - 120px - env(safe-area-inset-bottom));height:calc(100dvh - 120px - env(safe-area-inset-bottom))}`;
  document.head.appendChild(style);
  const pad = document.createElement('div');
  pad.id = 'touch-pad';
  const dpad = document.createElement('div');
  dpad.className = 'dpad';
  const acts = document.createElement('div');
  acts.className = 'acts';
  for (const b of BUTTONS) {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = b.label;
    el.setAttribute('aria-label', b.label);
    const isAct = b.code !== 'ArrowUp' && b.code !== 'ArrowDown' && b.code !== 'ArrowLeft' && b.code !== 'ArrowRight';
    if (!isAct) el.style.gridArea = b.grid;
    if (b.code === 'KeyM') el.classList.add('hub-only');
    if (isAct) {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        press(b.code, b.keyCode);
      });
    } else {
      // Arrows are held keys (the Hub walks while one is down); released on lift, cancel or leaving the button.
      let down = false;
      const release = (): void => {
        if (!down) return;
        down = false;
        send('keyup', b.code, b.keyCode);
      };
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { el.setPointerCapture?.(e.pointerId); } catch { /* synthetic event */ }
        if (down) return;
        down = true;
        send('keydown', b.code, b.keyCode);
      });
      for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, release);
    }
    (isAct ? acts : dpad).appendChild(el);
  }
  pad.append(dpad, acts);
  const hint = document.createElement('div');
  hint.id = 'rotate-hint';
  hint.textContent = 'Turn your phone sideways for a bigger view';
  const fs = document.createElement('button');
  fs.id = 'touch-fs';
  fs.type = 'button';
  fs.textContent = '⛶';
  fs.setAttribute('aria-label', 'Full screen');
  fs.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const root = document.documentElement;
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void root.requestFullscreen?.().then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape')).catch(() => undefined);
  });
  const tog = document.createElement('button');
  tog.id = 'touch-toggle';
  tog.type = 'button';
  tog.textContent = '🎮';
  tog.setAttribute('aria-label', 'Show or hide the on-screen pad');
  const stored = (): boolean => {
    try { return localStorage.getItem('pkr.padMin') === '1'; } catch { return false; }
  };
  document.body.classList.toggle('pad-min', stored());
  tog.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const min = document.body.classList.toggle('pad-min');
    try { localStorage.setItem('pkr.padMin', min ? '1' : '0'); } catch { /* private window */ }
  });
  document.body.append(pad, hint, fs, tog);
  const update = () => {
    const v = viewport();
    const mode = padMode(v);
    pad.style.display = mode === 'off' ? 'none' : 'flex';
    document.body.classList.toggle('touch-pad-on', mode !== 'off');
    document.body.classList.toggle('touch-pad-side', mode === 'side');
    document.body.classList.toggle('touch-pad-bottom', mode === 'bottom');
    tog.style.display = mode === 'side' ? 'block' : 'none';
    fs.style.display = mode !== 'off' && !!document.documentElement.requestFullscreen ? 'block' : 'none';
    hint.style.display = showRotateHint(v) ? 'block' : 'none';
  };
  let idle: ReturnType<typeof setTimeout> | undefined;
  const wake = (): void => {
    document.body.classList.remove('pad-idle');
    clearTimeout(idle);
    idle = setTimeout(() => document.body.classList.add('pad-idle'), 3000);
  };
  window.addEventListener('pointerdown', wake, true);
  wake();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  update();
}
