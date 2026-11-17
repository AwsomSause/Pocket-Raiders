// Greenneedle gn.new.11, The Night Parade: the Spirit Market (doc GREENNEEDLE_PLACED_1.md §11). "Six actions before the lanterns burn
// down. A counter on screen shows the lanterns left." Four stalls: the Masked Banette (a move for a move, three shown), the Sableye
// with scales (a Notebook line for a Rare item), the Mismagius (a nickname for a secret on this stage), the Old Dusclops (any one egg
// move for a move the Pokémon knows). A trade is one action. The Misdreavus rings its bell at the fifth. After the sixth the gate
// asks: leave now, or stay (and wake with one item swapped). Played as an event-only minigame (`gn-spirit-market`), so a half-spent
// night is in the save. This file is only the market's own steps; what a trade does to the run is spiritMarketEnd.ts (applied at once by
// core/minigame/flow.ts after every press).

import type { BaseState, Cell, MinigameModule, MinigameView } from '../minigame/games';

export const MARKET_ID = 'gn-spirit-market';
export const MARKET_LANTERNS = 6;
/** The action the Misdreavus rings its bell at. */
export const MARKET_BELL = 5;

export const STALLS = ['banette', 'sableye', 'mismagius', 'dusclops'] as const;
export type Stall = (typeof STALLS)[number];
export const STALL_NAME: Record<Stall, string> = { banette: 'The Masked Banette', sableye: 'The Sableye with scales', mismagius: 'The Mismagius', dusclops: 'The Old Dusclops' };
export const STALL_TRADE: Record<Stall, string> = {
  banette: 'A move for a move. Three shown.',
  sableye: 'A memory, erased, for a Rare item.',
  mismagius: 'A nickname for a secret on this stage.',
  dusclops: 'Any one egg move, for a move it knows.',
};

export interface MarketMove { id: string; name: string; type: string }
/** One party Pokémon as the stalls see it. */
export interface MarketMon {
  uid: string;
  name: string;
  speciesId: string;
  /** The name it was given, or ''. */
  nickname: string;
  moves: MarketMove[];
  /** The egg moves of its line it does not know: what the Old Dusclops can teach it. */
  lessons: MarketMove[];
}

/** A trade the player has just agreed to. flow.ts hands it to spiritMarketEnd.ts, which does it and clears it. */
export type MarketTrade =
  | { stall: 'banette' | 'dusclops'; uid: string; take: string; give: string }
  | { stall: 'sableye' }
  | { stall: 'mismagius'; uid: string }
  | { stall: 'wake' };

export interface MarketState extends BaseState {
  /** Lanterns at the start (the doc's six) and lanterns still burning. */
  max: number;
  lanterns: number;
  /** Where the player stands: in the lanes, at a stall, at the gate on the way out, or in the dark after the last lantern. */
  at: 'lanes' | Stall | 'gate' | 'dark';
  /** How far into a stall's trade: 0, then 1 and 2 where a trade needs more than one answer. */
  step: number;
  /** What was answered so far at this stall: the move to take (Banette, Dusclops) and the Pokémon. */
  take: string;
  uid: string;
  /** The party, the three moves on the Banette's cloth, the Notebook line the Sableye would erase ('' when the Notebook is empty) and how many hidden stops this stage still has: written by spiritMarketEnd.ts from the run. */
  party: MarketMon[];
  cloth: MarketMove[];
  memory: string;
  secrets: number;
  todo: MarketTrade | null;
  /** Trades done, by stall and in all. */
  used: Record<Stall, number>;
  trades: number;
  /** The bell has rung. */
  bell: boolean;
  /** How the night ended: left with lanterns burning, left at the last one, or stayed past it. */
  ended: '' | 'early' | 'time' | 'stayed';
  /** What each trade did, in order (the outcome shows them). */
  log: string[];
  /** The stop that opens when the market closes (the curtain, in the last region), set when it ends. */
  room?: string;
}

const monOf = (s: MarketState, uid: string): MarketMon | undefined => s.party.find((m) => m.uid === uid);
/** Why a stall can't trade right now, or ''. */
export function stallShut(s: MarketState, stall: Stall): string {
  if (stall === 'banette') return s.cloth.length === 0 ? 'The cloth is empty.' : !s.party.some((m) => m.moves.length > 0) ? 'No Pokémon has a move to give.' : '';
  if (stall === 'sableye') return s.memory ? '' : 'Your Notebook has no line to give.';
  if (stall === 'mismagius') return !s.party.some((m) => m.nickname) ? 'None of your Pokémon has a nickname.' : s.secrets <= 0 ? 'Nothing on this stage is hidden.' : '';
  return s.party.some((m) => m.lessons.length > 0 && m.moves.length > 0) ? '' : 'None of your Pokémon has an egg move left to learn.';
}

const toLanes = (s: MarketState): void => {
  s.at = s.lanterns > 0 ? 'lanes' : 'dark';
  s.step = 0;
  s.take = '';
  s.uid = '';
};

/** A trade is agreed: one lantern goes out, the bell rings at the fifth action, and the last one ends in the dark. */
function spend(s: MarketState, stall: Stall, trade: MarketTrade): void {
  s.todo = trade;
  s.lanterns -= 1;
  s.trades += 1;
  s.used[stall] += 1;
  if (s.max - s.lanterns === MARKET_BELL && s.lanterns > 0) s.bell = true;
  toLanes(s);
}

const back = (label = 'Back to the lane.'): Cell => ({ id: 'back', label, detail: 'No lantern is spent.', tone: 'dim' });
const moveCell = (prefix: string, m: MarketMove, detail: string, off = false): Cell => ({ id: `${prefix}:${m.id}`, label: m.name, detail: off ? detail : `${m.type.charAt(0).toUpperCase()}${m.type.slice(1)}. ${detail}`, tone: 'info', disabled: off });

/** The choices the player has right now. */
function cells(s: MarketState): Cell[] {
  if (s.done) return [];
  if (s.at === 'lanes') {
    return [
      ...STALLS.map((id): Cell => {
        const shut = stallShut(s, id);
        return { id: `stall:${id}`, label: STALL_NAME[id], detail: shut || STALL_TRADE[id], tone: shut ? 'dim' : 'info', disabled: !!shut };
      }),
      { id: 'leave', label: 'Leave the market.', detail: 'The lanterns you have left are not kept.', tone: 'dim' },
    ];
  }
  if (s.at === 'gate') return [{ id: 'go', label: 'Leave the market.', detail: `${s.lanterns} of ${s.max} lanterns still burn. They are not kept.`, tone: 'hot' }, back('Back to the stalls.')];
  if (s.at === 'dark') return [{ id: 'go', label: 'Leave now.', detail: 'Out through the gate, on time.', tone: 'good' }, { id: 'stay', label: 'Stay.', detail: 'You wake at the next step with one item swapped for another of the same tier.', tone: 'hot' }];
  if (s.at === 'sableye') return [{ id: 'yes', label: 'Trade the memory.', detail: 'The line is erased from your Notebook. You get a Rare item.', tone: 'hot', disabled: !s.memory }, back()];
  if (s.at === 'mismagius') {
    return [...s.party.filter((m) => m.nickname).map((m): Cell => ({ id: `mon:${m.uid}`, label: `Give up "${m.nickname}".`, detail: 'The name is gone. One "?" on this stage shows what it is.', tone: 'hot', disabled: s.secrets <= 0 })), back()];
  }
  const egg = s.at === 'dusclops';
  const mon = monOf(s, s.uid);
  if (egg ? s.step === 0 : s.step === 1) {
    // Which Pokémon. The Banette asks after the move is chosen; the Dusclops asks first (its lessons differ by Pokémon).
    return [
      ...s.party.map((m): Cell => {
        const why = m.moves.length === 0 ? 'It knows no move to give.' : egg ? (m.lessons.length === 0 ? 'Its line has no egg move left to learn.' : '') : m.moves.some((x) => x.id === s.take) ? 'It already knows that move.' : '';
        return { id: `mon:${m.uid}`, label: m.name, detail: why || (egg ? `${m.lessons.length} egg move${m.lessons.length === 1 ? '' : 's'} to choose from.` : 'It will learn the move, and give one of its own.'), tone: 'info', disabled: !!why };
      }),
      back(),
    ];
  }
  if (egg ? s.step === 1 : s.step === 0) {
    const shown = egg ? (mon?.lessons ?? []) : s.cloth;
    return [...shown.map((m) => moveCell('take', m, egg ? 'An egg move of its line.' : 'On the cloth.')), back()];
  }
  // The last answer: which of its own moves goes to the stall.
  return [...(mon?.moves ?? []).map((m) => moveCell('give', m, 'It forgets this one. This spends a lantern.')), back()];
}

function prompt(s: MarketState): string {
  if (s.msg) return s.msg;
  const mon = monOf(s, s.uid);
  switch (s.at) {
    case 'lanes':
      return 'Paper lanterns, burning low. Stalls with no prices. Nothing here is sold for money. A trade is one action.';
    case 'gate':
      return 'The Misdreavus holds the gate open with one small hand. "Leaving so soon? The market will not be here when you look back."';
    case 'dark':
      return 'The last lantern gutters. The Misdreavus is at the gate, ringing its bell, and ringing it. "Out, please. Now, please. Nobody has ever been sorry to leave on time."';
    case 'banette':
      return s.step === 0 ? 'Three moves on a cloth, face up. "A move for a move," says the Banette. "Fair is fair. Take one. Only one."' : s.step === 1 ? '"And who is it for?"' : `"And what does ${mon?.name ?? 'it'} put on the cloth?"`;
    case 'sableye':
      return s.memory ? `"One line. The one you'd miss least. Gone." The Sableye taps a page: "${s.memory}"` : '"No pages," says the Sableye. "Come back when something has happened to you."';
    case 'mismagius':
      return '"A name you gave. Give it back. I give you a secret in exchange, and a good one."';
    default:
      return s.step === 0 ? '"Teach me what yours knows. I will teach it what its grandparents knew. Sit. Who learns?"' : s.step === 1 ? `Every move ${mon?.name ?? 'its'} grandparents knew is laid out. "Any one," says the Dusclops.` : `"And what does ${mon?.name ?? 'it'} teach me?"`;
  }
}

const market: MinigameModule<MarketState> = {
  start(_c, p, rs) {
    const max = Math.max(1, Math.round(p.lanterns ?? MARKET_LANTERNS));
    return {
      rs, done: false, tick: 0, msg: '',
      max, lanterns: max, at: 'lanes', step: 0, take: '', uid: '', party: [], cloth: [], memory: '', secrets: 0, todo: null,
      used: { banette: 0, sableye: 0, mismagius: 0, dusclops: 0 }, trades: 0, bell: false, ended: '', log: [],
    };
  },
  view(_c, s): MinigameView {
    const list = cells(s);
    return {
      hud: [`Lanterns: ${s.lanterns}/${s.max}`, `Trades: ${s.trades}`, s.bell ? 'The bell has rung' : `Bell: at action ${Math.min(MARKET_BELL, s.max)}`],
      prompt: prompt(s),
      // In the lanes the stalls and the gate stand in one row; a stall's answers are a list (a long one, the egg moves, in columns of seven).
      cols: s.at === 'lanes' ? list.length : Math.max(1, Math.ceil(list.length / 7)), cells: list, done: s.done,
      // Esc steps back out of a stall; in the lanes it walks to the gate (where leaving is asked once more).
      back: s.done || s.at === 'dark' ? undefined : s.at === 'lanes' ? 'leave' : 'back',
    };
  },
  act(_c, s, cellId) {
    if (s.done || s.todo) return;
    const cell = cells(s).find((c) => c.id === cellId);
    if (!cell || cell.disabled) return;
    s.msg = '';
    const [kind, arg = ''] = cellId.split(':');
    if (kind === 'leave') return void (s.at = 'gate');
    if (kind === 'go') {
      s.ended = s.at === 'dark' ? 'time' : 'early';
      s.done = true;
      return;
    }
    if (kind === 'stay') {
      s.todo = { stall: 'wake' };
      s.ended = 'stayed';
      s.done = true;
      return;
    }
    if (kind === 'back') {
      // One step back inside a stall; from its first step (or the gate), back to the lanes.
      if (s.at === 'gate' || s.step === 0) return toLanes(s);
      s.step -= 1;
      return;
    }
    if (kind === 'stall') {
      s.at = arg as Stall;
      s.step = 0;
      return;
    }
    const stall = s.at as Stall;
    if (kind === 'yes') return spend(s, 'sableye', { stall: 'sableye' });
    if (kind === 'mon') {
      if (stall === 'mismagius') return spend(s, 'mismagius', { stall: 'mismagius', uid: arg });
      s.uid = arg;
      s.step += 1;
      return;
    }
    if (kind === 'take') {
      s.take = arg;
      s.step += 1;
      return;
    }
    if (kind === 'give' && (stall === 'banette' || stall === 'dusclops')) spend(s, stall, { stall, uid: s.uid, take: s.take, give: arg });
  },
  // The market gives no medal worth having: the count of trades, out of the lanterns there were.
  result: (s) => ({ score: s.trades, max: s.max }),
};

export const MARKET_GAMES: Record<string, MinigameModule<never>> = { [MARKET_ID]: market as never };
