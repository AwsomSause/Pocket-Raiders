// Evil Mode view models for the Honest Card overlay and the Ledger (design Part 29 sections 6 and 8), as plain data.
// The scene keeps the cursor (`LedgerDraft`) and the Card's gate; these work out what to draw and decide nothing.

import { cardFor, confirmLit, otherWay, type CardGate } from './card';
import { EVIL_DATA, type EvilData } from './data';
import { byPerson, money, runLines, todayPages, type RunMark } from './ledger';
import type { JobDraft } from './odds';
import type { EvilModeBlock, StoredCard } from './schema';

export interface CardModel {
  fields: { n: number; label: string; text: string; unknown: boolean }[];
  /** A clean Card's edge is plain (Part 29 section 6.2). */
  clean: boolean;
  /** 'confirm': a job being chosen; 'read': a kept Card, opened from the Ledger. */
  mode: 'confirm' | 'read';
  lit: boolean;
  /** Field 13's button, where there's another way to swap to. */
  swap: string | null;
  day: number;
}

export function cardModel(block: EvilModeBlock, open: { job: JobDraft; gate: CardGate } | { read: StoredCard }, data: EvilData = EVIL_DATA): CardModel {
  if ('read' in open) return { fields: open.read.fields.map((f, i) => ({ n: i + 1, ...f })), clean: open.read.clean, mode: 'read', lit: false, swap: null, day: open.read.day };
  const c = cardFor(block, open.job, data);
  const other = otherWay(open.job, data);
  return { fields: c.fields.map((f, i) => ({ n: i + 1, ...f })), clean: c.clean, mode: 'confirm', lit: confirmLit(open.gate), swap: other ? 'Swap to that' : null, day: c.day };
}

export interface LedgerDraft {
  tab: number;
  row: number;
  /** On Today, the action strip under a line: 0 Waive, 1 Halve, 2 Ask about; null when closed. */
  act: number | null;
}

export const newLedger = (): LedgerDraft => ({ tab: 0, row: 0, act: null });

export const LEDGER_ACTS = ['waive', 'halve', 'askAbout'] as const;

const MARK: Record<RunMark, string> = { went: '✓', didnt: '✗', 'called off': '–', pending: '·' };

export interface LedgerModel {
  tabs: { name: string; sel: boolean }[];
  tab: number;
  today: null | {
    in: { holdingId: string; text: string; sel: boolean; acts: { id: string; name: string; on: boolean; sel: boolean }[] | null }[];
    inTotal: string;
    out: { text: string }[];
    outTotal: string;
  };
  run: null | { cardId: string; text: string; mark: string; note: string; sel: boolean }[];
  person: null | { name: string; lines: string[] }[];
  totals: null | { given: number; taken: number; note: string };
  rows: number;
}

export function ledgerModel(block: EvilModeBlock, d: LedgerDraft, data: EvilData = EVIL_DATA): LedgerModel {
  const tabs = data.ledger.tabs.map((name, i) => ({ name, sel: i === d.tab }));
  const m: LedgerModel = { tabs, tab: d.tab, today: null, run: null, person: null, totals: null, rows: 0 };
  if (d.tab === 0) {
    const t = todayPages(block, data);
    m.today = {
      in: t.in.map((l, i) => ({
        holdingId: l.holdingId, text: l.text, sel: i === d.row,
        acts: i === d.row && d.act !== null ? [
          { id: 'waive', name: 'Waive', on: l.canWaive, sel: d.act === 0 },
          { id: 'halve', name: 'Halve', on: l.canHalve, sel: d.act === 1 },
          { id: 'askAbout', name: 'Ask about', on: l.canAsk, sel: d.act === 2 },
        ] : null,
      })),
      inTotal: money(t.inTotal),
      out: t.out.map((o) => ({ text: `${o.text} · ${money(o.amount)}` })),
      outTotal: money(t.outTotal),
    };
    m.rows = t.in.length;
  } else if (d.tab === 1) {
    const lines = runLines(block);
    m.run = lines.map((l, i) => ({ cardId: l.cardId, text: l.text, mark: MARK[l.mark], note: l.unseen ? data.ledger.card.unseen : '', sel: i === d.row }));
    m.rows = lines.length;
  } else if (d.tab === 2) m.person = byPerson(block);
  else m.totals = { given: block.given, taken: block.taken, note: data.ledger.givenTaken };
  return m;
}
