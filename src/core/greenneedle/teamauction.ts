// Greenneedle gn.52, The Evil Team's Pokémon Auction (doc GREENNEEDLE_REWORKED_PLACED_11.md lines 289–370).
// Undercover in a masked manor: a disguise (buyer, rival team's agent or caterer) opens different rooms. Six lots, two of them
// traps; three must be won to keep a bidder's cover. The last lot is a rare Pokémon: bought, rescued, or seized in a fight.
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { RARE, rivalVoice } from './allstar';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const castOf = (run: Pick<RunState, 'story'>, name: string): string | null => {
  const hit = Object.keys(run.story.flags).find((k) => k.startsWith(`ev:cast-${name}:`) && Number(run.story.flags[k]) > 0);
  return hit ? hit.slice(`ev:cast-${name}:`.length) : null;
};
export const BUYER = 1;
export const AGENT = 2;
export const CATERER = 3;
/** Lots won needed to keep a bidder's cover (three of six). */
export const KEEP_COVER = 3;
/** Refusing this many lots in a row, as a rich buyer, draws looks. */
export const LOOKS = 3;
export const AFRAID = 'afraid-rooms:';

/** In through the door: the disguise (1 buyer, 2 agent, 3 caterer), and the rare lot, a kind the region hardly sees. */
export function taStart(content: Content, run: RunState, disguise: number, float: () => number): string {
  for (const k of ['ta-lots', 'ta-streak', 'ta-blown', 'ta-rare', 'ta-alarm', 'ta-price', 'ta-lot-now', 'ta-won', 'ta-rounds', 'ta-rounds-lot', 'ta-paid']) delete run.story.flags[`ev:${k}`];
  set(run, 'ta-disguise', disguise);
  const here = run.regionOrder[run.regionIndex] ?? '';
  const pool = Object.entries(RARE).filter(([r]) => r !== here).flatMap(([, list]) => list).filter((s) => content.species.has(s));
  const sp = pool[Math.floor(float() * pool.length)] ?? 'eevee';
  for (const k of Object.keys(run.story.flags)) if (k.startsWith('ev:cast-ta-rare:')) delete run.story.flags[k];
  run.story.flags[`ev:cast-ta-rare:${sp}`] = 1;
  return '';
}

/** A lot ends: `won` 1 (you won it) or 0 (you let it go). A buyer who refuses three in a row draws looks: the cover's blown. */
export function taLot(run: RunState, won: number): string {
  if (won > 0) {
    set(run, 'ta-lots', f(run, 'ta-lots') + 1);
    set(run, 'ta-streak', 0);
    return '';
  }
  set(run, 'ta-streak', f(run, 'ta-streak') + 1);
  if (f(run, 'ta-disguise') === BUYER && f(run, 'ta-streak') >= LOOKS && f(run, 'ta-blown') === 0) {
    set(run, 'ta-blown', 1);
    return 'Three lots in a row, and your paddle never moved. Heads turn. A rich buyer who doesn\'t buy is no buyer at all.';
  }
  return '';
}

/**
 * The bidding, lot by lot. The room opens at `open`; each time the player raises, their bid goes up by `step`. While that bid is
 * under `limit`, someone tops it (the price climbs another `step`) and the lot is still open; at `limit` or over, the room goes
 * quiet and the gavel falls at the player's bid. Lot 2 is the house's trap: its bidder keeps going far past what the case is worth.
 * Lot 5 is the other trap: it creeps up slowly and cheaply, and nobody else wants to look as if they know what it is.
 */
export const LOTS: Record<number, { open: number; step: number; limit: number }> = {
  1: { open: 200, step: 200, limit: 1200 },
  2: { open: 300, step: 300, limit: 3000 },
  3: { open: 250, step: 250, limit: 1500 },
  4: { open: 250, step: 150, limit: 1000 },
  5: { open: 100, step: 100, limit: 600 },
  6: { open: 750, step: 750, limit: 4500 },
};
/** Dropping out of lot 2 after this many of your own bids is no longer "early": the room has seen your pockets. */
export const EARLY = 2;
/** The price the room stands at for lot `n` (someone else's bid), and what the player's next bid would be. */
export const taPrice = (run: Pick<RunState, 'story'>, n: number): number => (f(run, 'ta-lot-now') === n && f(run, 'ta-price') > 0 ? f(run, 'ta-price') : LOTS[n]?.open ?? 0);
export const taNext = (run: Pick<RunState, 'story'>, n: number): number => taPrice(run, n) + (LOTS[n]?.step ?? 0);
export const taCanBid = (run: Pick<RunState, 'story' | 'money'>, n: number): boolean => run.money >= taNext(run, n);
/** The player raises on lot `n`. Sets `ta-won` (1: the gavel fell at the player's bid, which is paid here; 0: topped, still open). */
export function taBid(run: RunState, n: number, host: { apply: (e: unknown) => string }): string {
  const lot = LOTS[n];
  if (!lot || !taCanBid(run, n)) {
    set(run, 'ta-won', 0);
    return '';
  }
  const mine = taNext(run, n);
  set(run, 'ta-lot-now', n);
  set(run, 'ta-rounds', (f(run, 'ta-rounds-lot') === n ? f(run, 'ta-rounds') : 0) + 1);
  set(run, 'ta-rounds-lot', n);
  if (mine >= lot.limit) {
    set(run, 'ta-won', 1);
    set(run, 'ta-price', 0);
    set(run, 'ta-paid', mine);
    host.apply({ kind: 'money', amount: -mine });
    return `"₽${mine.toLocaleString('en-US')}. Any more? No?" The gavel comes down, at ₽${mine.toLocaleString('en-US')}. ${WON[n] ?? ''}`.trim();
  }
  set(run, 'ta-won', 0);
  set(run, 'ta-price', mine + lot.step);
  return `You: ₽${mine.toLocaleString('en-US')}. ${TOPPED[n] ?? 'Another paddle goes up.'} ₽${(mine + lot.step).toLocaleString('en-US')}, against you.`;
}
const WON: Record<number, string> = {
  1: 'The fox mask lets you have it. Fair\'s fair.',
  2: 'You win. Everyone in the room now knows exactly how much money you have. Including the man by the pillar.',
  3: 'Yours, at a fair price. It\'s heavier than it looks.',
  4: 'You win it. The vase is warm from the lights. You carry it carefully, the way people carry things they paid for.',
  5: 'You bid like you\'re bored. It\'s yours for almost nothing. The man by the pillar doesn\'t look up.',
  6: 'It\'s handed to you in its cage. Nobody\'s the wiser. The team has your money.',
};
const TOPPED: Record<number, string> = {
  1: 'The fox mask tops it without looking round.',
  2: 'The house\'s paddle goes up before yours is down. The auctioneer doesn\'t look away from you.',
  3: 'A man in a heron mask tops it, gently.',
  4: 'The fox mask tops it, as if she knows something.',
  5: 'Somebody yawns, and tops it by almost nothing.',
  6: 'The fox mask pushes it higher.',
};
/** The player's own bids on the lot they're on (lot 2: dropping out at `EARLY` or fewer is early). */
export const taRounds = (run: Pick<RunState, 'story'>, n: number): number => (f(run, 'ta-rounds-lot') === n ? f(run, 'ta-rounds') : 0);

/** The rival behind the tray, by personality. */
const HUSH = {
  proud: '"Don\'t. Say. Anything." They hold the tray like a trophy somebody made them carry.',
  warm: '"Don\'t. Say. Anything." Then, because they can\'t help it: "...Pastry? They\'re actually good."',
  quiet: '"Don\'t. Say. Anything." They\'re already looking somewhere else.',
  plain: '"Don\'t. Say. Anything."',
} as const;
/** The contact in the hedge: Officer Jenny, or the Ranger the player fetched to the smugglers' yard (gn.51). */
export const taContact = (run: Pick<RunState, 'story'>): string => (f(run, 'smuggle-entry') === 4 ? 'The head Ranger from the warehouse' : 'Officer Jenny');
/** What the viewing room has shown so far (every lot can be looked at up close). */
function viewed(run: Pick<RunState, 'story'>): string {
  const seen = [
    f(run, 'ta-viewed-near') > 0 ? 'The held item is what it says it is: about ₽1,200 of it. The case of Balls has the house\'s own seal under the lid: it\'s their lot, and they\'ll bid on it themselves.' : '',
    f(run, 'ta-viewed-far') > 0 ? 'The fossil is real, and worth about ₽1,500. The egg is warm, and heavy, and worth far more than anyone here will admit to knowing.' : '',
    f(run, 'ta-viewed') > 0 ? 'The antique\'s glaze is still tacky. Somebody made it last week.' : '',
  ].filter(Boolean);
  return seen.length > 0 ? seen.join(' ') : 'A steward hovers, in case you\'d like anything up close.';
}
/** Tokens: {ta:price:N}, {ta:next:N} (lot N's standing price and the player's next bid), {ta:hush}, {ta:contact}. */
export function taTokens(run: Pick<RunState, 'story'>, text: string): string {
  return text
    .replace(/\{ta:price:([1-6])\}/g, (_, n: string) => taPrice(run, Number(n)).toLocaleString('en-US'))
    .replace(/\{ta:next:([1-6])\}/g, (_, n: string) => taNext(run, Number(n)).toLocaleString('en-US'))
    .replaceAll('{ta:viewed}', viewed(run))
    .replaceAll('{ta:hush}', HUSH[rivalVoice(run)])
    .replaceAll('{ta:contact}', taContact(run));
}

/** The rare Pokémon is yours (1 bought, 2 rescued, 3 seized when the alarm went up). It's afraid of rooms for one stage. */
export function taRare(run: RunState, how: number, stage: number, host: { apply: (e: unknown) => string }): string {
  const sp = castOf(run, 'ta-rare');
  if (!sp || f(run, 'ta-rare') > 0) return '';
  set(run, 'ta-rare', how);
  return host.apply({ kind: 'join', recall: false, species: [sp], types: [], levelBonus: -2, shinyMultiplier: 1, shadow: false, blissful: false, hiddenAbility: false, moves: [], direct: true, alpha: false, starterType: false, asIs: true, mark: `${AFRAID}${stage}` });
}

/** The night is over: was the cover kept (a File: the ledger), and were both traps avoided? */
export function taEnd(run: RunState, host: { apply: (e: unknown) => string }): string {
  const d = f(run, 'ta-disguise');
  const kept = f(run, 'ta-alarm') === 0 && f(run, 'ta-blown') === 0 && (d === CATERER || f(run, 'ta-lots') >= KEEP_COVER);
  set(run, 'ta-cover', kept ? 1 : 0);
  if (f(run, 'ta-trap-balls') > 0 && f(run, 'ta-trap-egg') > 0) set(run, 'ta-traps', 1);
  set(run, 'ta-done', 1);
  if (!kept) return '';
  host.apply({ kind: 'evil', beat: false, heat: 0, defect: false, mark: 'files' });
  return 'Nobody knows you were there. In your bag: the ledger, with every buyer\'s name in it.';
}

/** At a Pokémon Center that stage: the rescued one waits outside, and isn't healed with the rest. */
export function taRoomsAfraid(content: Content, run: RunState, before: number[], stage: number): string {
  let line = '';
  run.party.forEach((m, i) => {
    if (!m.gn?.includes(`${AFRAID}${stage}`)) return;
    m.hp = before[i] ?? m.hp;
    line = `${content.species.get(m.speciesId)?.name ?? 'It'} won't come inside. It waits by the door, looking at the room the way something looks at weather.`;
  });
  return line;
}

/** At a shop that stage: the rescued one waits outside (a line; the shop is open as usual). */
export function taShopLine(content: Content, run: Pick<RunState, 'party'>, stage: number): string {
  const m = run.party.find((x) => x.gn?.includes(`${AFRAID}${stage}`));
  return m ? `${content.species.get(m.speciesId)?.name ?? 'It'} won't come into the shop. It sits on the step outside, and watches the door until you come out.` : '';
}
