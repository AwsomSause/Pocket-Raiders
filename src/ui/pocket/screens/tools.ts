// The Pocket look's Tools room (mock-up `pt-tools`): a numbered card per tool, four across and two down, a page at a
// time. It draws the list the Hub's Tools room hands it. Presentation only.

import { act, esc, hdr, keys, page } from '../kit';
import { fit } from '../templates';

/** Cards on one page (four across, two down, as the mock-up). */
export const PK_TOOLS_PAGE = 8;
export const PK_TOOLS_COLS = 4;

/** The short line under each tool's name (the mock-up's words where it has them); others keep their own first clause. */
const SHORT: Record<string, string> = {
  "What's new": "This update's notes", 'Berry Bestiary': 'Every berry and how it grows', 'Content status': 'What works, what is limited',
  'My stats': 'Runs, wins, catches', 'Seed board': 'Seeds worth sharing', 'Mod packs': 'Extra lines and seeds',
  'Tournament bracket': 'Set up a bracket', 'Check a save file': 'Is it healthy?', 'Speedrun timer': 'Splits per region',
  'RNG streams (debug)': 'What the dice roll next', 'Achievements showcase': 'Pick what your card shows', 'Photo contest': "This week's theme",
  'Trade board': 'Swap with a friend by code', 'Report a bug': 'Copy a report', 'Seed leaderboard': 'Your runs on one seed',
  'Co-op draft': 'Draft a team together', 'Hot-seat versus': 'Two players, one device', 'Replay viewer': 'Step through a past run',
  'Pack voting': 'Feature packs with friends', 'Fan art frame': 'Your own posters', 'Feature flags': 'Optional parts on or off',
  'Balance dashboard (dev)': 'Who wins most', 'Bot report (dev)': 'Read a playtest log', 'Replay diff (dev)': 'Where two runs differ',
  'Asset sources (dev)': 'Who to credit', 'Back up my save': 'How to keep saves safe',
};
export const toolShort = (label: string, sub: string): string => SHORT[label] ?? sub.split(/[.:;]/)[0]!.trim();

export interface PkToolsModel {
  items: readonly { label: string; sub: string; /** "Due" on the backup card. */ tag?: string }[];
  index: number;
}

export function pkTools(d: PkToolsModel): string {
  const n = d.items.length, index = Math.max(0, Math.min(n - 1, d.index));
  const pages = Math.max(1, Math.ceil(n / PK_TOOLS_PAGE)), at = Math.floor(index / PK_TOOLS_PAGE), first = at * PK_TOOLS_PAGE;
  const head = hdr('Tools', { area: 'town', crumb: ['Hub', 'Tools'], pills: [...(pages > 1 ? [`Page ${at + 1} of ${pages}`] : []), `${n} tools`] });
  const cards = d.items.slice(first, first + PK_TOOLS_PAGE).map((x, k) => {
    const i = first + k, line = toolShort(x.label, x.sub);
    return `<div class="pn${i === index ? ' on' : ''}" data-key="tl-${i}"${act('pick', i, 'over')}><u>${i + 1}</u><b style="font-size:${fit(x.label, 196, 18, 12, 0.56)}px">${esc(x.label)}</b><p style="font-size:${fit(line, 180, 13, 10, 0.5)}px">${esc(line)}</p>${x.tag ? `<em class="gx-tl-tag">${esc(x.tag)}</em>` : ''}</div>`;
  }).join('');
  return page('pt-tools', 51, `<div class="scr nrun pg39" data-key="pt-tools">${head}<div class="gr39 q4 tz39" data-key="tl-grid">${cards}</div><div class="nt39">These tools live on this device. Nothing is sent anywhere.</div>${keys([['←→↑↓', 'move'], ['Enter', 'open', 'pick', index], ['Esc', 'back to the Hub', 'back']])}</div>`);
}
