// New UI: the prologue's pieces that are not an event page or a cutscene card: the name entry (the mock-ups' `form`
// template: a prompt, the value with a caret, an on-screen key grid, three buttons) and the helpers that turn the
// prologue's own text into speaker lines. Pure: the scene owns the typing and the story.

import { act, B, esc, H, TX, W } from '../kit';
import type { ScriptLine } from '../script';
import type { ReduxCtx } from '../stage';

/** The on-screen keys: the alphabet, then a hyphen, an apostrophe, a space and "delete" (30 keys, as the mock-up's grid). */
export const FORM_KEYS: readonly string[] = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '-', "'", ' ', '⌫'];
const KEY_FACE: Record<string, string> = { ' ': '␣' };

export interface FormModel {
  title: string;
  /** The question over the box. */
  prompt: string;
  value: string;
  /** More than one box (custom pronouns): every box's label and value, and which one is being typed in. */
  fields: { label: string; value: string }[];
  field: number;
  /** The middle button ("That is me"). */
  ok: string;
  /** The text box at the bottom: what is allowed, or what was wrong. */
  note: string;
}

/**
 * One typed key applied to a value: a printable key is added (up to `max` letters), "⌫" or Backspace takes the last
 * letter away. A key from the on-screen grid types a capital at the start of a word and a small letter after it.
 */
export function typeKey(value: string, key: string, max: number, fromGrid = false): string {
  if (key === '⌫' || key === 'Backspace') return value.slice(0, -1);
  if (key.length !== 1 || value.length >= max) return value;
  if (!fromGrid || !/[A-Z]/.test(key)) return value + key;
  return value + (value === '' || /[\s'-]$/.test(value) ? key : key.toLowerCase());
}

export function formView(_c: ReduxCtx, d: FormModel): string {
  const last = d.value.slice(-1).toUpperCase();
  const many = d.fields.length > 1;
  const chips = many ? `<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center;max-width:860px">${d.fields.map((f, k) => `<span class="tg${k === d.field ? '' : ' no'}" style="cursor:pointer"${act('field', k)}>${esc(f.label)}: ${esc(f.value || '…')}</span>`).join('')}</div>` : '';
  return H(d.title, 'sys', many ? [['Tab', 'next box'], ['Enter', 'choose'], ['Esc', 'back']] : [['Enter', 'choose'], ['Esc', 'back']])
    + `<div class="abs col cen" style="left:0;right:0;top:${many ? 64 : 86}px;gap:${many ? 12 : 16}px">${chips}<b style="font-size:21px">${esc(d.prompt)}</b>${W(`<b style="font-size:26px;letter-spacing:.12em;white-space:pre">${esc(d.value)}</b><span class="pulse acc" style="font-size:26px">▌</span>`, 'width:520px;display:flex;justify-content:center;gap:4px;padding:14px')}<div style="display:grid;grid-template-columns:repeat(10,34px);gap:7px">${FORM_KEYS.map((k) => `<span class="key"${act('key', k)} style="cursor:pointer${k !== ' ' && k === last ? ';background:var(--acc);color:#14161e' : ''}">${esc(KEY_FACE[k] ?? k)}</span>`).join('')}</div><div class="row">${B('Paste', false, '', '', act('paste'))}${B(esc(d.ok), true, '', '', act('ok'))}${B('Clear', false, '', '', act('clear'))}</div></div>`
    + TX(d.note);
}

/** "VANCE: words" and "VANCE (a recording): words" are Professor Vance speaking; anything else is telling. */
export function vanceLine(raw: string): ScriptLine {
  const m = /^VANCE(?:\s*\(([^)]*)\))?:\s*(.*)$/s.exec(raw);
  if (!m) return { who: null, text: raw };
  const words = m[2]!.trim().replace(/^"([^"]*)"$/, '$1');
  return { who: m[1] ? `Prof. Vance (${m[1]})` : 'Prof. Vance', text: words };
}

/** "Beat 3: Professor Vance" reads "Prologue 3/10" on the tag and "Professor Vance" as the scene's name. */
export function beatTag(title: string, beats: number): { tag: string; name: string } {
  const m = /^Beat (\d+):\s*(.*)$/.exec(title);
  return m ? { tag: `Prologue ${m[1]}/${beats}`, name: m[2]! } : { tag: 'Prologue', name: title };
}
