// Greenneedle gn.43, the Pokémon Auction: six lots, live bidding in hundreds, four bidders with rules you can read, and one stolen lot.
//  - gn op `auctionArrive`: the catalogue (index.ts picks the lots from the lead and the region): each lot's thing (cast as
//    `auction-lot-<n>`), its fair value (`auction-fair-<n>`), the stolen lot (`auction-stolen`, 1 to 5) and the Collector's lot.
//  - gn op `auctionOpen` (`n` the lot): the price opens at 60% of the fair value; the bidders who want it sit up.
//  - gn op `auctionRound` (`key` bid / hold / out): one round. The price goes up a hundred; each bidder stays or drops by their rule.
//    Ends with `auction-done` 1 and, when the player wins, `auction-won` the price paid (the caller hands the lot over).
// The bidders: Mrs. Roundell never goes past a round number; Mr. Dabb bids on everything and never wins (he drops when he'd be left
// holding it, and the lot goes back to the bid before his); Mr. Quayle wants one lot and will overpay; Odalie Lachance bids on the stolen
// lot only, with someone else's limit.
import type { PokemonInstance, RunState } from '../state';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
export const STEP = 100;
export const PLAYER = 1;
export const ROUNDELL = 2;
export const DABB = 3;
export const QUAYLE = 4;
export const ODALIE = 5;
const WHO = ['', 'you', 'Mrs. Roundell', 'Mr. Dabb', 'Mr. Quayle', 'the young woman'];
const money = (n: number): string => `₽${n.toLocaleString('en-GB')}`;

/** The fair values, by lot: a held item, a stone, a fossil, an egg, a regional variant, an unusual Pokémon. */
export const FAIR = [1200, 1000, 1500, 1600, 2000, 2400];
/** Where each lot came from (the stolen one says "a private collection" instead). */
const PROVENANCE = ['From the estate of Mrs. Anwen Price, of the Lakeside Breeders\' Guild.', 'Consigned by the Mt. Moon Mining Co-operative.', 'Excavated under licence by the Pewter Museum, deaccessioned 1998.', 'From the Day-Care Village, with the parents\' names.', 'Bred by the Hartley ranch; papers in order.', 'From Captain Ferreira, retired, who would like it to see the world.'];
const MARK = ['A small brass tag on its box, half rubbed out: *R. Okonjo*.', 'A notch filed into the base, the kind a collector uses to mark their pieces.', 'A faded blue ribbon, tied the way a family ties it.', 'A name written on the shell in pencil, and rubbed at.', 'A collar tag, not in the description: *Return to M. Adeyemi*.'];

export interface Lot { n: number; thing: string }
/** The catalogue for this auction. `lots[i]` is cast as `auction-lot-<i+1>` (an item id, or a species for the egg and the Pokémon). */
export function auctionArrive(run: RunState, lots: readonly string[], float: () => number, oddKind: number): string {
  const visits = f(run, 'auction-visits') + 1;
  set(run, 'auction-visits', visits);
  lots.forEach((thing, i) => {
    for (const k of Object.keys(run.story.flags)) if (k.startsWith(`ev:cast-auction-lot-${i + 1}:`)) delete run.story.flags[k];
    run.story.flags[`ev:cast-auction-lot-${i + 1}:${thing}`] = 1;
    set(run, `auction-fair-${i + 1}`, FAIR[i]!);
    set(run, `auction-sold-${i + 1}`, 0);
  });
  // The Collector wants the held item, the stone or the egg (in turn, by auction): the lot that suits your lead.
  const quayle = [1, 2, 4][(visits - 1) % 3]!;
  set(run, 'auction-quayle', quayle);
  // The stolen lot: one of the first five, never the Collector's.
  const options = [1, 2, 3, 4, 5].filter((n) => n !== quayle);
  set(run, 'auction-stolen', options[Math.floor(float() * options.length)]!);
  set(run, 'auction-odd', oddKind);
  for (const k of ['auction-spotted', 'auction-suspect', 'auction-return-intent', 'auction-bought-stolen', 'auction-won', 'auction-done']) set(run, k, 0);
  // The silent one: at the next auction, Pryde has found out. He won't take your first bid.
  if (f(run, 'auction-silent') > 0 && f(run, 'auction-silent-visit') < visits && f(run, 'auction-snubbed') === 0) set(run, 'auction-snub', 1);
  return '';
}

/** A lot comes up: the price opens at 60% of the fair value, in hundreds; the bidders who want it sit up. */
export function auctionOpen(run: RunState, n: number): string {
  const fair = f(run, `auction-fair-${n}`);
  set(run, 'auction-lot', n);
  const opening = Math.max(STEP, Math.round((fair * 0.6) / STEP) * STEP);
  set(run, 'auction-price', opening);
  // Mrs. Roundell's ceiling: the first round number (a thousand) at or above the opening price.
  set(run, 'auction-roundell-cap', Math.ceil(opening / 1000) * 1000);
  set(run, 'auction-high', 0);
  set(run, 'auction-prev', 0);
  set(run, 'auction-prev-price', 0);
  set(run, 'auction-done', 0);
  set(run, 'auction-won', 0);
  set(run, 'auction-in-player', 1);
  set(run, `auction-in-${ROUNDELL}`, n === 6 ? 0 : 1);
  set(run, `auction-in-${DABB}`, 1);
  set(run, `auction-in-${QUAYLE}`, f(run, 'auction-quayle') === n ? 1 : 0);
  set(run, `auction-in-${ODALIE}`, f(run, 'auction-stolen') === n ? 1 : 0);
  // The stolen lot, and you've spotted it: the three choices.
  set(run, 'auction-suspect', f(run, 'auction-stolen') === n && f(run, 'auction-spotted') > 0 ? 1 : 0);
  return '';
}

/** Whether a bidder will go to `next` on this lot (and the tell you can read). */
function willing(run: RunState, k: number, next: number, fair: number): boolean {
  if (f(run, `auction-in-${k}`) === 0) return false;
  if (k === ROUNDELL) return next <= f(run, 'auction-roundell-cap');
  if (k === DABB) return next <= Math.round(fair * 1.15);
  // Refused three times on the S.S. Anne: this once, on principle, he will go higher than you can.
  if (k === QUAYLE) return next <= Math.round(fair * 1.6) || (f(run, 'ssanne-collector-refused') >= 3 && f(run, 'auction-quayle-gift') === 0 && next <= run.money + STEP);
  if (k === ODALIE) return next <= Math.round(fair * 1.4);
  return false;
}
const tell = (k: number, next: number): string =>
  k === ROUNDELL ? (next % 1000 === 0 ? 'Mrs. Roundell taps her paddle, once, before she raises it.' : 'Mrs. Roundell raises her paddle.')
    : k === DABB ? 'Mr. Dabb\'s paddle is up before the number\'s out.'
      : k === QUAYLE ? 'Mr. Quayle sits very still. And then he doesn\'t.'
        : 'The young woman checks a note inside her glove, and bids.';
const drop = (k: number): string =>
  k === ROUNDELL ? 'Mrs. Roundell lowers her paddle onto her lap, and folds her hands over it. A round number. She\'s done.'
    : k === DABB ? 'Mr. Dabb is examining the ceiling.'
      : k === QUAYLE ? 'Mr. Quayle sighs, and looks at his gloves.'
        : 'The young woman reaches her limit. She looks at the door.';

/** One round of a lot. `choice`: the player's bid / hold / out. Returns Pryde's words. */
export function auctionRound(run: RunState, choice: string): string {
  const n = f(run, 'auction-lot');
  const fair = f(run, `auction-fair-${n}`);
  const lines: string[] = [];
  let mine = choice;
  // Say nothing: you sit out the stolen lot, knowing.
  if (mine === 'silent') {
    set(run, 'auction-silent', 1);
    set(run, 'auction-silent-visit', f(run, 'auction-visits'));
    mine = 'out';
  }
  if (mine === 'out') set(run, 'auction-in-player', 0);
  // Out: the room bids on without you, to the end.
  for (let guard = 0; guard < 60 && f(run, 'auction-done') === 0; guard += 1) {
    const price = f(run, 'auction-price');
    const high = f(run, 'auction-high');
    const next = price + STEP;
    const bidders: number[] = [];
    if (f(run, 'auction-in-player') > 0 && mine === 'bid') {
      if (high === PLAYER) lines.push('**Pryde:** "The bid is already yours. Restraint, please."');
      else if (run.money < next) lines.push('You count what you have. Not enough.');
      else if (f(run, 'auction-snub') > 0) {
        set(run, 'auction-snub', 0);
        set(run, 'auction-snubbed', 1);
        lines.push('Your paddle goes up. Pryde\'s eyes slide past it, as if it were part of the wall. He doesn\'t mention anything. He doesn\'t need to.');
      } else bidders.push(PLAYER);
    }
    for (const k of [ROUNDELL, DABB, QUAYLE, ODALIE]) {
      if (k === high || f(run, `auction-in-${k}`) === 0) continue;
      if (willing(run, k, next, fair)) bidders.push(k);
      else {
        set(run, `auction-in-${k}`, 0);
        lines.push(drop(k));
      }
    }
    const npcs = bidders.filter((k) => k !== PLAYER);
    if (bidders.length === 0) {
      // Nobody goes higher. Mr. Dabb never wins: if the lot is his, it goes back to the bid before his.
      let winner = high;
      let paid = price;
      if (winner === DABB) {
        lines.push(`**Pryde:** "${money(price)} with Mr. Dabb. Of course it is. Mr. Dabb? ...Mr. Dabb is examining the ceiling."`);
        winner = f(run, 'auction-prev');
        paid = f(run, 'auction-prev-price');
      }
      sold(run, n, winner, paid, fair, lines);
      break;
    }
    const top = bidders.includes(PLAYER) ? PLAYER : npcs[0]!;
    set(run, 'auction-prev', high);
    set(run, 'auction-prev-price', price);
    set(run, 'auction-high', top);
    set(run, 'auction-price', next);
    lines.push(top === PLAYER ? `**Pryde:** "${money(next)}, with the trainer at the back."` : `${tell(top, next)} **Pryde:** "${money(next)}, with ${WHO[top]}."`);
    // You're in this round and the room is still bidding: back to you.
    if (f(run, 'auction-in-player') > 0) break;
    mine = 'out';
  }
  return lines.join(' ');
}

function sold(run: RunState, n: number, winner: number, paid: number, fair: number, lines: string[]): void {
  set(run, 'auction-done', 1);
  set(run, `auction-sold-${n}`, winner);
  if (winner === 0 || paid <= 0) {
    lines.push('**Pryde:** "No sale. It goes back in the box. It\'s used to it."');
    return;
  }
  // The Collector refused three times on the S.S. Anne: he outbids you once, on principle, and sends the lot over as a gift.
  if (winner === QUAYLE && f(run, 'ssanne-collector-refused') >= 3 && f(run, 'auction-quayle-gift') === 0) {
    set(run, 'auction-quayle-gift', 1);
    set(run, 'auction-won', -1);
    lines.push(`**Pryde:** "Sold, to Mr. Quayle, ${money(paid)}." A porter brings it to your seat a minute later, with his card. *I simply wanted to win something.*`);
    return;
  }
  if (winner !== PLAYER) {
    lines.push(`**Pryde:** "Going once. Going twice. Sold, to ${WHO[winner]}, ${money(paid)}."`);
    if (winner === ODALIE) lines.push('She pays in cash, from an envelope that isn\'t hers, and doesn\'t wait for a receipt.');
    return;
  }
  run.money -= paid;
  set(run, 'auction-won', paid);
  set(run, 'auction-wins', f(run, 'auction-wins') + 1);
  if (f(run, 'auction-stolen') === n) {
    set(run, 'auction-bought-stolen', 1);
    set(run, 'auction-paid-stolen', paid);
  }
  const over = paid - fair;
  lines.push(`**Pryde:** "Sold, to the trainer at the back, ${money(paid)}."${over > 0 ? ` That's ${money(over)} over the fair value.` : over < 0 ? ` ${money(-over)} under the fair value.` : ''}`);
}

/** The catalogue lines, read by text tokens: `{lot:<n>:prov}` where it came from, `{lot:<n>:photo}` what a second look at the photograph shows. */
export function lotToken(run: Pick<RunState, 'story'>, n: number, part: string): string {
  const stolen = f(run, 'auction-stolen') === n;
  if (part === 'prov') return stolen ? 'From a private collection.' : PROVENANCE[n - 1] ?? '';
  if (part === 'photo') return stolen ? MARK[n - 1] ?? '' : 'Nothing the description leaves out.';
  return '';
}

/** Buy it and return it: the owner (the tag gives a name) pays back what they can, which isn't all of it. */
export function auctionReturn(run: RunState): string {
  const paid = f(run, 'auction-paid-stolen');
  const back = Math.round((paid * 0.6) / STEP) * STEP;
  run.money += back;
  set(run, 'auction-returned', 1);
  return back > 0 ? `They press ${money(back)} into your hand. It's what they have. They apologise that it isn't more.` : '';
}

// ---------- The gavel (the secret lot): the holder's first move in a battle can't be interrupted by flinching or confusion. ----------
export const GAVEL = 'gavel';
export const GAVEL_NOW = 'gavel-now';
/** At each battle's start: the gavel's holder (in the party) is ready again. */
export function gavelStart(run: RunState): void {
  for (const mon of [...run.party, ...run.box]) {
    if (!mon.gn?.length) continue;
    mon.gn = mon.gn.filter((t) => t !== GAVEL_NOW);
    if (mon.gn.includes(GAVEL) && run.party.includes(mon)) mon.gn = [...mon.gn, GAVEL_NOW];
  }
}
/** Its first move has not been made yet this battle. */
export const gavelFirst = (mon: Pick<PokemonInstance, 'gn'>): boolean => !!mon.gn?.includes(GAVEL_NOW);
/** Its first move is made. */
export function gavelSpent(mon: Pick<PokemonInstance, 'gn'>): void {
  if (mon.gn?.includes(GAVEL_NOW)) mon.gn = mon.gn.filter((t) => t !== GAVEL_NOW);
}
