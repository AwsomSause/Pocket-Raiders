// New UI system overlays, ported from the mock-ups' `overlay` template: the notification stack, the achievement
// toast, the interaction log and the song caption. Pure drawing; `ui/redux/system.ts` keeps what is showing.

import { act, esc, icon, W } from '../kit';
import type { ReduxCtx } from '../stage';

export interface NoticeRow { id: number; head: string; text: string }
export interface ToastRow { id: number; kicker: string; title: string; art: string | null; /** Shown once the toast is tapped open. */ lines: readonly string[]; open: boolean }
export interface LogRow { text: string; when: string }
export interface OverlayModel { notices: readonly NoticeRow[]; toasts: readonly ToastRow[]; log: readonly LogRow[] | null; caption: string }

/** "Rival: Kieran beat Gym 2." reads as a head and its line; a plain line gets the head "Notice". */
export function noticeOf(text: string): { head: string; text: string } {
  const m = /^([A-Z][^:\n]{0,17}):\s+(\S[\s\S]*)$/.exec(text.trim());
  return m ? { head: m[1]!, text: m[2]! } : { head: 'Notice', text: text.trim() };
}

/** How long ago, in the log's short words. */
export function agoWord(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 10) return 'just now';
  if (s < 60) return `${s} s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} h ago`;
}

export const LOG_EMPTY = 'Nothing yet. Your recent choices and results show up here.';

export function overlayView(_c: ReduxCtx, d: OverlayModel): string {
  const toasts = d.toasts.map((t) => W(`<div class="row">${t.art ? icon(t.art, 38) : ''}<div class="col grow" style="gap:2px;min-width:0"><span class="sm">${esc(t.kicker)}</span><b class="acc">${esc(t.title)}</b></div></div>${t.open ? t.lines.map((l) => `<div class="sm" style="line-height:19px;margin-top:4px">${esc(l)}</div>`).join('') : ''}`, 'width:320px;align-self:flex-end;padding:9px 14px', '', act('toast', t.id)));
  // The newest notice is the bright one; older ones fade back, as in the mock-up.
  const notices = d.notices.map((n, q) => W(`<b class="${q ? '' : 'acc'}" style="font-size:14px">${esc(n.head)}</b><div class="sm">${esc(n.text)}</div>`, `padding:7px 12px;opacity:${Math.max(0.4, 1 - q * 0.2)}`, '', act('notice', n.id)));
  const stack = toasts.length || notices.length ? `<div class="abs col" style="right:20px;top:20px;width:330px;gap:8px;z-index:9">${toasts.join('')}${notices.join('')}</div>` : '';
  const log = d.log ? W(`<b class="acc">Interaction log</b>${d.log.length ? d.log.map((l) => `<div class="row sm" style="align-items:flex-start;gap:10px"><span class="grow" style="min-width:0">${esc(l.text)}</span><span style="white-space:nowrap;opacity:.8">${esc(l.when)}</span></div>`).join('') : `<div class="sm" style="opacity:.8">${LOG_EMPTY}</div>`}`, 'position:absolute;left:20px;top:20px;bottom:20px;width:340px;display:flex;flex-direction:column;gap:7px;padding:12px 14px;overflow:hidden;z-index:9', '', act('log')) : '';
  const caption = d.caption ? `<div class="abs" style="left:0;right:0;bottom:14px;text-align:center;color:#ffe9a8;font-size:18px;text-shadow:2px 2px 0 #201020,-1px -1px 0 #201020;pointer-events:none;z-index:9">♪ ${esc(d.caption)} ♪</div>` : '';
  return stack + log + caption;
}
