// Greenneedle gn.new.11, the Spirit Market: what the market reads from the run and what a trade does to it. core/minigame/flow.ts
// calls marketSync when the market opens and after every press (so a trade is done the moment it is agreed, once, and a reload can
// never do it twice), marketFinish when the night ends, and marketLeave if the game is closed half-way. Kept apart from spiritMarket.ts so
// the minigame registry never loads the event rules. The trades themselves are the older rooms' rules (parade.ts).

import type { Content } from '../contentSchema';
import { displayName } from '../care';
import { hashSeed, Rng } from '../rng';
import type { PokemonInstance, RunState } from '../state';
import { MARKET_BELL, STALL_NAME, type MarketMove, type MarketState, type MarketTrade, type Stall } from './spiritMarket';
import { banetteCloth, dusclopsLessons, leastMemory, paradeAll, paradeForget, paradeRare, paradeSecret, paradeWake } from './parade';

/** The room behind the curtain (the last region, for a player who joined every parade). */
export const MARKET_CURTAIN = 'gn-new-11-curtain';
export const MARKET_BELL_LINE = 'At the gate the Misdreavus rings its little bell. Once. That was the fifth action, and everyone in the lane heard it.';

const flag = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const setFlag = (run: RunState, key: string, n: number): void => {
  run.story.flags[`ev:${key}`] = n;
};
/** The market's own dice: one named stream per kind of roll and per trade, so nothing else in the run moves. */
const roll = (run: RunState, kind: string, n: number): Rng => new Rng(hashSeed(`${run.seed}::gn-market::${kind}::${run.regionIndex}:${run.stage?.index ?? 0}:${n}`));
const move = (content: Content, id: string): MarketMove => {
  const m = content.moves.get(id);
  return { id, name: m?.name ?? id, type: m?.type ?? 'normal' };
};
const secrets = (run: RunState): number => (run.stage?.map.nodes ?? []).filter((n) => n.sides.some((x) => x.hidden)).length;

/** What the stalls can see of the run right now. */
function look(content: Content, run: RunState, s: MarketState): void {
  s.party = run.party.map((m) => ({
    uid: m.uid, name: displayName(content, m), speciesId: m.speciesId, nickname: m.care?.nickname ?? '',
    moves: m.moves.map((x) => move(content, x.id)), lessons: dusclopsLessons(content, m).map((id) => move(content, id)),
  }));
  // The cloth is dealt again after each Banette trade: one move of the lead's own line, one Ghost, one Dark.
  const lead = run.party.find((m) => m.hp > 0) ?? run.party[0];
  const dice = roll(run, 'cloth', s.used.banette);
  s.cloth = lead ? banetteCloth(content, lead, () => dice.float()).map((id) => move(content, id)) : [];
  const at = leastMemory(run);
  s.memory = at >= 0 ? run.story.chronicle[at]!.text : '';
  s.secrets = secrets(run);
  setFlag(run, 'parade-lanterns', s.lanterns);
}

/** A move for a move: `take` goes where `give` was. Returns false when the Pokémon can't make that trade. */
function swapMove(content: Content, mon: PokemonInstance | undefined, take: string, give: string): boolean {
  const at = mon?.moves.findIndex((m) => m.id === give) ?? -1;
  const got = content.moves.get(take);
  if (!mon || at < 0 || !got || mon.moves.some((m) => m.id === take)) return false;
  mon.moves[at] = { id: got.id, pp: got.pp };
  return true;
}

/** Does the trade on the run. Returns what happened, or '' when it could not be done (nothing is changed then). */
function trade(content: Content, run: RunState, s: MarketState, t: MarketTrade): string {
  if (t.stall === 'banette' || t.stall === 'dusclops') {
    const mon = run.party.find((m) => m.uid === t.uid);
    const offered = t.stall === 'banette' ? s.cloth.some((m) => m.id === t.take) : !!mon && dusclopsLessons(content, mon).includes(t.take);
    if (!offered || !swapMove(content, mon, t.take, t.give)) return '';
    const [took, gave, who] = [move(content, t.take).name, move(content, t.give).name, displayName(content, mon!)];
    return t.stall === 'banette'
      ? `The Banette lifts its hand. ${who} takes ${took} from the cloth and leaves ${gave} on it.`
      : `The lesson takes no time at all, and all night. ${who} learns ${took}, as its grandparents did, and ${gave} stays with the Dusclops.`;
  }
  if (t.stall === 'sableye') {
    const gone = paradeForget(run);
    if (!gone) return '';
    return `A page curls and drops to ash. ${gone} ${paradeRare(content, run, roll(run, 'rare', s.used.sableye).float())}`.trim();
  }
  if (t.stall === 'mismagius') return secrets(run) > 0 ? paradeSecret(content, run, t.uid) : '';
  // Staying past six: one item is swapped for another of the same tier.
  return paradeWake(content, run, roll(run, 'wake', 0).float()) || 'Your bag is as it was: there was nothing in it to swap.';
}

/** A trade that could not be done gives its lantern back. */
function refund(s: MarketState, stall: Stall): void {
  s.lanterns += 1;
  s.trades -= 1;
  s.used[stall] -= 1;
  if (s.max - s.lanterns < MARKET_BELL) s.bell = false;
  if (s.at === 'dark') s.at = 'lanes';
}

/** When the market opens and after every press: the agreed trade (if any) is done, once, and the stalls look at the run again. */
export function marketSync(content: Content, run: RunState, s: MarketState): void {
  const t = s.todo;
  s.todo = null;
  if (t) {
    const line = trade(content, run, s, t);
    if (line) {
      s.log.push(t.stall === 'wake' ? line : `${STALL_NAME[t.stall]}: ${line}`);
      s.msg = t.stall !== 'wake' && s.bell && s.max - s.lanterns === MARKET_BELL ? `${line} ${MARKET_BELL_LINE}` : line;
    } else if (t.stall !== 'wake') {
      refund(s, t.stall);
      s.msg = `${STALL_NAME[t.stall]} has nothing to trade for that. No lantern is spent.`;
    }
  }
  look(content, run, s);
}

/** The market closes: in the last region, for a player who joined every parade, the curtain's room opens beside the node. */
function close(run: RunState, s: MarketState): void {
  const all = paradeAll(run, flag(run, 'parade-joined'));
  setFlag(run, 'parade-all', all ? 1 : 0);
  setFlag(run, 'parade-lanterns', s.lanterns);
  setFlag(run, 'parade-trades', s.trades);
  const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
  if (!all || !here || s.room) return;
  s.room = `event-room-${here.sides.length + 1}-${here.id}`;
  here.sides.push({ id: s.room, kind: 'event', used: false, eventId: MARKET_CURTAIN });
  if (run.itemCounters) delete run.itemCounters[`event-seen:${MARKET_CURTAIN}`];
}

/** The night is over (left early, left on time, or stayed): the lines the player reads, and the curtain if it is owed. */
export function marketFinish(content: Content, run: RunState, s: MarketState): string[] {
  if (content.events.has(MARKET_CURTAIN)) close(run, s);
  const how = s.ended === 'stayed'
    ? 'You stay. The dark is soft, and then it is not there. You wake at the next step.'
    : s.ended === 'time'
      ? 'You step out through the gate as the last light goes. Behind you the market folds up like a letter.'
      : 'You turn your back on the lanterns. The line closes behind you without a sound. The market is gone before you reach the road.';
  const wake = s.ended === 'stayed' ? s.log.at(-1) ?? '' : '';
  return [how, wake, s.trades === 0 ? 'You traded nothing.' : `Trades made: ${s.trades} of ${s.max}.`, s.room ? 'On the road, the palanquin has stopped.' : ''].filter(Boolean);
}

/** The game is closed with lanterns still burning: the same as walking out through the gate. */
export function marketLeave(run: RunState, s: MarketState): void {
  s.ended = 'early';
  close(run, s);
}
