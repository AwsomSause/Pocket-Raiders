// New UI: what shows over every screen (notifications, achievement toasts, the interaction log, song captions).
// It keeps the short-lived state and one overlay layer for the whole game. Presentation only: nothing here reads
// or changes game state, and nothing uses a random stream.

import type Phaser from 'phaser';
import { agoWord, noticeOf, overlayView, type LogRow, type NoticeRow, type ToastRow } from './screens/overlay';
import { mountOverlay } from './stage';

interface Toast extends ToastRow { timer: ReturnType<typeof setTimeout> | null }

const state = { notices: [] as NoticeRow[], toasts: [] as Toast[], log: null as LogRow[] | null, caption: '' };
let view: { refresh(): void } | null = null;
let nextToast = 1;
let onNotice: (id: number) => void = () => undefined;
let onLog: () => void = () => undefined;
let captionTimer: ReturnType<typeof setTimeout> | null = null;

function layer(game: Phaser.Game): { refresh(): void } {
  view ??= mountOverlay(game, {
    render: (c) => overlayView(c, { notices: state.notices, toasts: state.toasts, log: state.log, caption: state.caption }),
    acts: {
      // A tap sends a notice away.
      notice: (id) => onNotice(Number(id)),
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
    },
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
