// The Trade page (slice 11): Rackets, Fronts and Works offered in this district, each on its Honest Card (thirteen fields,
// the button under field 13), and what's running, with the Boss's hand on it (waive, end, make honest, the back room) and,
// when the team's bankrupt, the three ways out. Decides nothing: actions go through `step`.

import { holdingName, streetName } from './board';
import { EVIL_DATA, type EvilData } from './data';
import { brokeStage, bustCard, bustProblem, cardDef, econOn, frontHoldings, goingStraight, heldStreets, honestCard, offered, streetMood, tradeCard, tradeReqProblem, ventureDaily, ventureProblem, type BustWay, type TradeReq, type VentureAct } from './economy';
import { fill, money } from './ledger';
import type { EvilModeBlock, Venture } from './schema';

export interface TradeSel { tab: number; row: number; pick: number }
export const newTrade = (tab = 0): TradeSel => ({ tab, row: 0, pick: 0 });

export type TradeDo = { type: 'trade'; req: TradeReq } | { type: 'venture'; id: string; act: VentureAct } | { type: 'bust'; way: BustWay; id?: string };
export interface TradeButton { label: string; act: TradeDo; problem: string | null }
export interface TradeRowModel { key: string; name: string; word: string; open: boolean; sel: boolean }

export interface TradeModel {
  title: string;
  tabs: { name: string; sel: boolean; count: number }[];
  rows: TradeRowModel[];
  /** The street or holding a Card's for (tap or S to change), or null. */
  pick: { label: string; value: string; of: number } | null;
  /** The chosen row's Card (thirteen fields) or its status lines. */
  card: { label: string; text: string; unknown: boolean }[];
  buttons: TradeButton[];
  status: string[];
  empty: string | null;
  hint: string;
}

const W = (k: string, data: EvilData): string => {
  const w = data.economy.words[k];
  return Array.isArray(w) ? w[0]! : w ?? k;
};

type Row = { key: string; name: string; word: string; card: () => TradeModel['card']; buttons: () => TradeButton[] };

function patienceWord(block: EvilModeBlock, v: Venture, data: EvilData): string {
  if (v.honest) return 'Honest. It holds, for good.';
  if (v.patience === null) return "Its patience is the Roster's.";
  const R = data.economy.rules.racket;
  if (block.team.dread >= R.dreadFreeze) return 'Sullen, and stays there (Dread 6+).';
  return v.patience <= R.warnAt ? 'Sullen.' : `${(streetMood(block, v.street ?? 0, data) ?? 'wary').replace(/^./, (c) => c.toUpperCase())}.`;
}

export function tradeModel(block: EvilModeBlock, sel: TradeSel, data: EvilData = EVIL_DATA): TradeModel | null {
  if (!econOn(data) || !block.district) return null;
  const d = block.district;
  const tabs = (data.economy.words.tabs as string[]);
  const kinds = ['racket', 'front', 'work'] as const;
  const streets = heldStreets(block, data);
  const holds = frontHoldings(block);
  const rowsFor = (tab: number): Row[] => {
    if (tab < 3) {
      return offered(block, data).filter((c) => c.kind === kinds[tab]).map((c): Row => {
        const req: TradeReq = { cardId: c.id, ...(c.kind === 'racket' && streets.length ? { street: streets[sel.pick % streets.length]! } : {}), ...(c.kind === 'front' && holds.length ? { holdingId: holds[sel.pick % holds.length]!.id } : {}) };
        const problem = tradeReqProblem(block, req, data);
        return { key: c.id, name: c.name, word: problem ? 'Shut' : c.cost ? money(c.cost) : 'Open', card: () => tradeCard(block, req, data), buttons: () => [{ label: W('doIt', data), act: { type: 'trade', req }, problem }] };
      });
    }
    const out: Row[] = block.economy.running.map((v): Row => {
      const def = cardDef(v.cardId, data)!;
      const name = v.honest && def.honest ? def.honest.name : def.name;
      const where = v.street !== null && v.district === d.n && v.region === d.region ? streetName(d, v.street, data) : v.holdingId ? (d.holdings.find((h) => h.id === v.holdingId) ? holdingName(d.holdings.find((h) => h.id === v.holdingId)!, data) : `District ${v.district}`) : '';
      const btn = (label: string, act: VentureAct): TradeButton => ({ label, act: { type: 'venture', id: v.id, act }, problem: ventureProblem(block, v.id, act, data) });
      if (v.kind === 'racket') {
        return {
          key: v.id, name: `${name}${where ? ` · ${where}` : ''}`, word: patienceWord(block, v, data),
          card: () => (!v.honest && def.honest ? honestCard(block, v.id, data) : [{ label: 'Since', text: `Day ${v.since}.`, unknown: false }, { label: 'Pays', text: `${money(ventureDaily(block, v, data))} a day.`, unknown: false }]),
          buttons: () => [btn(`Make it honest${def.honest ? `: ${def.honest.name}` : ''}`, 'honest'), btn('Waive today', 'waive'), btn('End it', 'end')],
        };
      }
      if (v.kind === 'front') {
        const p = block.crew.find((c) => c.id === v.person);
        return {
          key: v.id, name: `${name}${where ? ` · ${where}` : ''}`, word: v.backRoom === null ? 'No back room' : v.backRoom ? 'Back room open' : 'Back room shut',
          card: () => [
            { label: 'Runs it', text: p?.name ?? '—', unknown: false },
            { label: 'Pays', text: def.daily > 0 ? `${money(def.daily)} a day, clean.` : fill(def.text.gives, {}), unknown: false },
            { label: 'The back room', text: v.backRoom === null ? W('noBackRoom', data) : v.backRoom ? 'Open.' : 'Shut.', unknown: false },
            { label: 'Going Straight', text: v.straight.length ? `In profit with the back room shut for ${v.straight.length} whole district${v.straight.length === 1 ? '' : 's'}.` : 'Not yet: a whole district in profit with the back room shut.', unknown: false },
          ],
          buttons: () => [btn(v.backRoom ? 'Shut the back room' : 'Open the back room', 'backRoom')],
        };
      }
      return { key: v.id, name, word: def.running ? 'Running' : v.done ? 'Built' : `Building, done day ${v.doneOn}`, card: () => [{ label: 'Gives', text: def.text.gives, unknown: false }, { label: 'Moves', text: def.text.moves, unknown: false }], buttons: () => [] };
    });
    if (brokeStage(block) > 0) {
      const ways: [BustWay, string][] = [['lastJob', data.economy.bust.lastJob.name], ['sell', data.economy.bust.sell.name], ['whip', data.economy.bust.whip.name]];
      for (const [way, name] of ways) {
        const problem = bustProblem(block, way, null, data);
        out.push({ key: way, name, word: problem ? 'Shut' : 'Open', card: () => bustCard(block, way, null, data), buttons: () => [{ label: W('doIt', data), act: { type: 'bust', way }, problem }] });
      }
    }
    return out;
  };
  const tab = Math.max(0, Math.min(3, sel.tab));
  const rows = rowsFor(tab);
  const at = Math.max(0, Math.min(rows.length - 1, sel.row));
  const chosen = rows[at];
  const def = chosen && tab < 3 ? cardDef(chosen.key, data) : undefined;
  const pick = def?.kind === 'racket' && def.id !== 'tithe' && streets.length ? { label: W('street', data), value: streetName(d, streets[sel.pick % streets.length]!, data), of: streets.length } : def?.kind === 'front' && holds.length ? { label: 'Holding', value: holdingName(holds[sel.pick % holds.length]!, data), of: holds.length } : null;
  const status: string[] = [];
  const st = brokeStage(block);
  if (st > 0) status.push(fill(W('bankrupt', data), { n: block.economy.broke, stage: (data.economy.words.stages as string[])[st - 1]! }));
  const gs = goingStraight(block);
  if (gs > 0) status.push(fill(W('straight', data), { n: gs, of: data.economy.rules.front.straightNeeds }));
  return {
    title: `${W('title', data)} · ${d.holdings.find((h) => h.kind === 'town')?.ref ?? ''}`,
    tabs: tabs.map((name, i) => ({ name, sel: i === tab, count: rowsFor(i).length })),
    rows: rows.map((r, i) => ({ key: r.key, name: r.name, word: r.word, open: r.word !== 'Shut', sel: i === at })),
    pick,
    card: chosen ? chosen.card() : [],
    buttons: chosen ? chosen.buttons() : [],
    status,
    empty: rows.length ? null : tab === 3 ? 'Nothing running yet.' : 'Nothing of this kind is offered here.',
    hint: W('hint', data),
  };
}
