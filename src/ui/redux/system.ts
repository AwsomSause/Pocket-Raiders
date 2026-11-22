// New UI: what shows over every screen (notifications, achievement toasts, the interaction log, song captions).
// It keeps the short-lived state and one overlay layer for the whole game. Presentation only: nothing here reads
// or changes game state, and nothing uses a random stream.

import type Phaser from 'phaser';
import { agoWord, noticeOf, overlayView, pkOverlay, type LogRow, type NoticeRow, type ToastRow } from './screens/overlay';
import { mountOverlay, pocketOn, reduxCardUp } from './stage';
import { pkHelp } from '../pocket/screens/help';
import { phLog, type PhLogModel } from '../phantom/screens/system';

interface Toast extends ToastRow { timer: ReturnType<typeof setTimeout> | null }

const state = { notices: [] as NoticeRow[], toasts: [] as Toast[], log: null as LogRow[] | null, caption: '', /** Pocket look: the Controls card is up, for this scene. */ help: null as string | null };
let view: { refresh(): void } | null = null;
let nextToast = 1;
let onNotice: (id: number) => void = () => undefined;
let onLog: () => void = () => undefined;
// Phantom UI: the run log is a whole page (mock-up `log`); the rows it draws, or null while it is shut.
let logPage: PhLogModel | null = null;
let onLogAt: (row: number) => void = () => undefined;
let captionTimer: ReturnType<typeof setTimeout> | null = null;

/** What is showing now. A versus or cutscene card fills the screen: notices and toasts wait behind it and show again when it leaves. */
const pops = (none: boolean): Pick<OverlayModel, 'notices' | 'toasts' | 'caption'> =>
  none ? { notices: [], toasts: [], caption: '' } : { notices: reduxCardUp() ? [] : state.notices, toasts: reduxCardUp() ? [] : state.toasts, caption: state.caption };

function layer(game: Phaser.Game): { refresh(): void } {
  view ??= mountOverlay(game, {
    // A versus or cutscene card fills the screen: notices and toasts wait behind it and show again when it leaves.
    // Pocket look: notices and toasts are drawn on the Pocket layer (pk below); the log and the song caption stay here.
    render: (c) => overlayView(c, { notices: reduxCardUp() || pocketOn() ? [] : state.notices, toasts: reduxCardUp() || pocketOn() ? [] : state.toasts, log: state.log, caption: state.caption }),
    pk: () => {
      const help = state.help ? pkHelp(state.help) : '';
      const stack = reduxCardUp() ? '' : pkOverlay({ notices: state.notices, toasts: state.toasts });
      return help ? (stack ? stack.replace(/<\/div>$/, `${help}</div>`) : `<div class="scr gx-over">${help}</div>`) : stack;
    },
    acts: {
      // A tap sends a notice away.
      notice: (id) => onNotice(Number(id)),
      help: () => { state.help = null; view?.refresh(); },
      // A tap opens the story behind a toast and keeps it up; a second tap closes it.
      toast: (id) => {
        const t = state.toasts.find((x) => x.id === Number(id));
        if (!t) return;
        if (t.open) state.toasts = state.toasts.filter((x) => x !== t);
        else {
          t.open = true;
          if (t.timer) clearTimeout(t.timer);
          t.timer = null;
        }
        view?.refresh();
      },
      log: () => onLog(),
      logAt: (k) => onLogAt(Number(k)),
    },
    // The run log is a whole page: the pops wait behind it and show again when it shuts.
    page: (ph) => (logPage ? phLog(ph, logPage) : phPops(ph, pops(false))),
  });
  return view;
}

/** The notification stack, newest first; `dismiss` is told when one is tapped away. */
export function rxNotices(game: Phaser.Game, list: readonly { id: number; text: string }[], dismiss: (id: number) => void): void {
  state.notices = list.map((n) => ({ id: n.id, ...noticeOf(n.text) }));
  onNotice = dismiss;
  layer(game).refresh();
}

/** An achievement toast: it leaves by itself after `ms` unless it was tapped open. */
export function rxToast(game: Phaser.Game, t: Omit<ToastRow, 'id' | 'open'>, ms: number): void {
  const toast: Toast = { ...t, id: nextToast++, open: false, timer: null };
  toast.timer = setTimeout(() => {
    state.toasts = state.toasts.filter((x) => x !== toast);
    view?.refresh();
  }, ms);
  state.toasts = [...state.toasts, toast].slice(-3);
  layer(game).refresh();
}

/** The interaction log (L): the rows to show, or null to close it. `close` is told when a click closes it. */
export function rxLog(game: Phaser.Game, rows: readonly { at: number; text: string }[] | null, close: () => void, now = Date.now()): void {
  state.log = rows ? rows.map((r) => ({ text: r.text, when: agoWord(now - r.at) })) : null;
  onLog = close;
  layer(game).refresh();
}

/** Phantom UI: the run log page, or null to shut it. `close` is told by a click beside the rows, `at` by a click on a row. */
export function rxLogPage(game: Phaser.Game, model: PhLogModel | null, close: () => void, at: (row: number) => void): void {
  logPage = model;
  onLog = close;
  onLogAt = at;
  layer(game).refresh();
}

/** A song caption at the bottom of the screen for `ms`. */
export function rxCaption(game: Phaser.Game, text: string, ms: number): void {
  state.caption = text;
  if (captionTimer) clearTimeout(captionTimer);
  captionTimer = setTimeout(() => {
    state.caption = '';
    view?.refresh();
  }, ms);
  layer(game).refresh();
}

/** Pocket look: show or put away the Controls card (mock-up `help`) for the scene on screen. True when it is now up. */
export function rxHelpToggle(game: Phaser.Game, scene: string | null): boolean {
  state.help = state.help || !scene ? null : scene;
  layer(game).refresh();
  return state.help !== null;
}
/** The Controls card is up. */
export const rxHelpUp = (): boolean => state.help !== null;
