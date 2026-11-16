// New UI: the Honest Trade Card (Catalog Overhaul, TRADES.md 1.1) on the mock-ups' `trade` page: your Pokémon at the
// left, the trader's at the right, the swap sign and the buttons between them, the trader's words in the text box.
// Both sides show the same lines: species, level, nature, ability, the four moves, quirk, history, and one fair value.

import { act, B, esc, facts, H, mini, TX, W } from '../kit';
import type { ReduxCtx } from '../stage';
import { scrollStart } from '../templates';

export interface HonestSide {
  name: string;
  /** Picture file under assets/images (null: none). */
  file: string | null;
  level: number;
  nature: string;
  ability: string | null;
  hidden: boolean;
  moves: string[];
  quirk: { name: string; line: string } | null;
  /** History marks ("hatched on a ferry"). */
  marks: string[];
  held: string | null;
  /** It evolves the moment it is traded, into this. */
  evolvesTo: string | null;
  value: number;
  shiny: boolean;
}

export interface HonestModel {
  /** The trader's name over their side and the text box. */
  trader: string;
  /** Why they trade it, in their words. */
  why: string;
  /** What they ask for ("Any Water type"). */
  wants: string;
  yours: HonestSide | null;
  theirs: HonestSide;
  warn: 'worse' | 'much-better' | null;
  gift: boolean;
  /** The player's Pokémon that fit, and the one shown at the left. Empty: the card is only being read. */
  picks: string[];
  at: number;
  /** The trader has said theirs is worth less and waits for a second yes. */
  asking: boolean;
}

/** The word between the two sides: how the fair values compare. */
export function honestVerdict(d: Pick<HonestModel, 'yours' | 'theirs' | 'warn' | 'gift'>): string {
  if (d.gift) return 'A gift';
  if (!d.yours) return 'Their offer';
  if (d.warn === 'worse' || d.yours.value > d.theirs.value) return 'You give more';
  if (d.warn === 'much-better') return 'You get much more';
  return d.theirs.value > d.yours.value ? 'You get more' : 'Fair trade';
}

/** What the trader says in the text box: the warning while they wait for a second yes, else why they trade. */
export function honestLine(d: Pick<HonestModel, 'why' | 'asking'>): string {
  return d.asking ? 'Mine’s worth less than yours. You sure?' : d.why;
}

const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

function side(owner: string, s: HonestSide): string {
  const moves = s.moves.length ? s.moves.slice(0, 4).map((m) => `<span class="tg no" style="flex:1 1 40%;min-width:0;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m)}</span>`).join('') : '<span class="sm">No moves</span>';
  const rows: [string, string][] = [['Nature', cap(s.nature)], ['Ability', s.ability ? `${s.ability}${s.hidden ? ' (hidden)' : ''}` : 'None']];
  if (s.held) rows.push(['Holds', s.held]);
  if (s.evolvesTo) rows.push(['On arrival', `Evolves into ${s.evolvesTo}`]);
  const note = (label: string, text: string): string => `<div class="sm" style="line-height:16px;max-height:48px;overflow:hidden"><b>${label}</b> ${esc(text)}</div>`;
  return W(
    `<div class="row"><b class="grow" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(owner)}</b><span class="sm">Value</span><b class="acc" style="font-size:20px" data-value>${s.value}</b></div>` +
    `<div class="cell" style="height:78px;aspect-ratio:auto;align-self:stretch">${s.file ? mini(s.file, 72, '', true) : '<b style="font-size:34px;opacity:.6">?</b>'}</div>` +
    `<b style="font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${s.shiny ? '★ ' : ''}${esc(s.name)} <span class="sm">Lv ${s.level}</span></b>` +
    `<div style="align-self:stretch;display:flex;flex-direction:column;gap:3px">${facts(rows)}</div>` +
    `<div class="row" style="align-self:stretch;flex-wrap:wrap;gap:4px">${moves}</div>` +
    `<div style="align-self:stretch;display:flex;flex-direction:column;gap:3px">${note('Quirk', s.quirk ? `${s.quirk.name}: ${s.quirk.line}` : 'None')}${note('History', s.marks.length ? s.marks.map(cap).join(' · ') : 'Nothing yet')}</div>`,
    'flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px',
  );
}

/** The empty left side: a gift asks for nothing; before a Pokémon is picked it says what the trader wants. */
const noSide = (d: HonestModel): string => W(
  `<b>You</b><div class="cell" style="height:78px;aspect-ratio:auto;align-self:stretch"><b style="font-size:34px;opacity:.6">${d.gift ? '—' : '?'}</b></div><b style="font-size:19px">${d.gift ? 'Nothing asked' : 'Your Pokémon'}</b><div class="sm" style="text-align:center;line-height:18px">${esc(d.gift ? 'This one is a gift.' : `They want: ${d.wants}. Your side shows when you choose to trade.`)}</div>`,
  'flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px',
);

export function honestView(_c: ReduxCtx, d: HonestModel): string {
  const n = d.picks.length, size = 6, from = scrollStart(n, d.at, size), reading = n === 0;
  const picks = d.picks.slice(from, from + size).map((t, q) => B(`<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d.asking && from + q === d.at ? 'Yes, trade' : t)}</span>`, from + q === d.at, 'height:30px;font-size:14px;justify-content:center', '', `${act('trade', from + q)} data-over="tradeOver"`)).join('');
  const mid = `<div class="col cen" style="gap:7px;width:196px;flex:none"><b class="acc" style="font-size:40px;line-height:40px">⇄</b><span class="tg${d.warn === 'worse' ? '' : ' no'}"${d.warn === 'worse' ? ' style="background:#e84838;color:#fff"' : ''}>${esc(honestVerdict(d))}</span>` +
    (reading ? '' : `<span class="sm" style="text-align:center;line-height:16px">They want: ${esc(d.wants)}</span>`) +
    `<div class="col" style="gap:5px;align-self:stretch">${reading ? B('Close', true, 'height:30px;font-size:14px;justify-content:center', '', act('tradeBack')) : picks}</div>` +
    (n > size ? `<span class="sm">${d.at + 1} of ${n}</span>` : '') + '</div>';
  return H('Trade', 'story', reading ? [['T', 'close'], ['Esc', 'close']] : [['Enter', d.asking ? 'yes, trade' : 'trade'], ['Esc', 'back']]) +
    `<div class="abs row" style="left:24px;right:24px;top:70px;gap:14px;align-items:stretch">${d.yours ? side('You', d.yours) : noSide(d)}${mid}${side(d.trader, d.theirs)}</div>` +
    TX(esc(honestLine(d)), d.trader);
}
