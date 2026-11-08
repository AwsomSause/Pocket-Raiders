import { z } from 'zod';
import type { Content } from './contentSchema';
import type { RunState } from './state';
import tournamentJson from '../data/galarTournament.json';
import { hashSeed, Rng } from './rng';

/**
 * The Galar Champion's Tournament (Beta 0.5, section 1.3): 32 trainers, five rounds, replaces Galar's Elite Four.
 * Pure rules: who is in the bracket, who the player meets each round, how the other matches go, and what Ball Guy sells.
 * Every roll comes from a stream derived from the run seed and a fixed label, so it never moves the gameplay streams,
 * and the same seed always gives the same bracket (so a save reload shows the same tournament).
 */

const TournamentSchema = z.object({
  rounds: z.literal(5),
  entrants: z.literal(32),
  shopEvery: z.number().int().min(1),
  healBetweenRounds: z.boolean(),
  champion: z.string().min(1),
  roundNames: z.array(z.string()).length(5),
  roundLevelBonus: z.array(z.number().int()).length(5),
  introduceLine: z.string(),
  roster: z.array(z.object({ bossId: z.string().min(1), kind: z.enum(['familiar', 'guest']), strength: z.number().int().min(1).max(10), style: z.string(), intro: z.string() })).length(30),
  crowdLines: z.object({ upset: z.array(z.string()).min(1), win: z.array(z.string()).min(1), final: z.array(z.string()).min(1), watchOther: z.array(z.string()).min(1) }),
  shop: z.object({
    keeper: z.string(),
    line: z.string(),
    visits: z.array(z.object({ picks: z.number().int().min(1), offers: z.array(z.object({ id: z.string(), stock: z.number().int().min(1), price: z.number().int().min(1) })).min(4) })).min(2),
  }),
});
export type GalarTournamentData = z.infer<typeof TournamentSchema>;
export const GALAR_TOURNAMENT: GalarTournamentData = TournamentSchema.parse(tournamentJson);

export type RosterEntry = GalarTournamentData['roster'][number];
export const PLAYER_SLOT = 'player';

export interface Bracket {
  seed: string;
  champion: string;
  /** 32 slots; slot 0 is the player. Neighbouring slots meet in round 1, neighbouring pairs in round 2, and so on. */
  slots: string[];
  roster: Record<string, RosterEntry>;
  /** The rival who always reaches the player's last challenger round (round 4, just before the Champion's final). Undefined when the run has no rival. */
  lastRival?: string;
}

export interface BuildOptions {
  runSeed: string;
  /** The Galar champion of this run (defaults to the tournament's champion). Always wins the other half of the bracket. */
  championId?: string;
  /** Active rivals: they are entered into the tournament so rematches can happen. */
  rivalIds?: readonly string[];
  /** Bosses the player already beat as gym leaders; they are not rolled out of the roster, only used to fill in with the weakest first. */
  avoid?: readonly string[];
}

const GUEST_STRENGTH = 6;

function streamFor(seed: string, label: string): Rng {
  return new Rng(hashSeed(`galar-tournament:${seed}:${label}`));
}

/** Builds the bracket: the roster (rivals swapped in for the weakest entrants) is placed weakest first with some noise, so early rounds are gentler. */
export function buildBracket(opts: BuildOptions): Bracket {
  const champion = opts.championId ?? GALAR_TOURNAMENT.champion;
  const base = GALAR_TOURNAMENT.roster.filter((r) => r.bossId !== champion);
  const entries: RosterEntry[] = [...base];
  for (const rival of opts.rivalIds ?? []) {
    if (rival === champion || entries.some((e) => e.bossId === rival)) continue;
    const weakest = entries.reduce((lo, e, i) => (e.strength < entries[lo]!.strength ? i : lo), 0);
    entries[weakest] = { bossId: rival, kind: 'familiar', strength: GUEST_STRENGTH, style: 'Rival', intro: 'A familiar face grins from the other side of the field.' };
  }
  // The roster is exactly 30 once the champion is not in it; if the champion was in the roster, top up with the avoided names.
  const roster = entries.slice(0, 30);
  const rng = streamFor(opts.runSeed, 'seeding');
  const ordered = roster.map((e) => ({ e, key: e.strength + rng.float() * 4 })).sort((a, b) => a.key - b.key || a.e.bossId.localeCompare(b.e.bossId)).map((x) => x.e.bossId);
  // The first active rival is always the last challenger: seated in the block of eight the player meets in round 4, and unbeatable there (see playMatch).
  const lastRival = (opts.rivalIds ?? []).find((r) => r !== champion && roster.some((e) => e.bossId === r));
  const rest = lastRival ? ordered.filter((id) => id !== lastRival) : ordered;
  const slots = new Array<string>(32);
  slots[0] = PLAYER_SLOT;
  let next = 0;
  for (let i = 1; i < 32; i++) {
    if (i === 16) slots[i] = champion;
    else if (i === 8 && lastRival) slots[i] = lastRival;
    else slots[i] = rest[next++]!;
  }
  const byId: Record<string, RosterEntry> = {};
  for (const e of roster) byId[e.bossId] = e;
  return { seed: opts.runSeed, champion, slots, roster: byId, lastRival };
}

function strengthOf(b: Bracket, id: string): number {
  if (id === b.champion) return 10;
  return b.roster[id]?.strength ?? GUEST_STRENGTH;
}

export interface Match { round: number; a: string; b: string; winner: string; upset: boolean }

/** Plays one match between two non-player entrants. The champion always wins; otherwise the stronger entrant is favoured but upsets happen. */
function playMatch(b: Bracket, round: number, index: number, a: string, c: string): Match {
  let winner: string;
  if (a === b.champion) winner = a;
  else if (c === b.champion) winner = c;
  else if (a === b.lastRival) winner = a; // the rival always reaches round 4
  else if (c === b.lastRival) winner = c;
  else {
    const sa = strengthOf(b, a) ** 2;
    const sc = strengthOf(b, c) ** 2;
    winner = streamFor(b.seed, `r${round}m${index}`).float() < sa / (sa + sc) ? a : c;
  }
  const loser = winner === a ? c : a;
  return { round, a, b: c, winner, upset: strengthOf(b, winner) + 2 <= strengthOf(b, loser) };
}

/** The winner of every non-player block at the end of round `round` (a block is 2^round slots). The player's block is skipped (null). */
function blockWinners(b: Bracket, upTo: number): { winners: (string | null)[]; matches: Match[] } {
  let alive: (string | null)[] = b.slots.map((s) => (s === PLAYER_SLOT ? null : s));
  const matches: Match[] = [];
  for (let round = 1; round <= upTo; round++) {
    const nextAlive: (string | null)[] = [];
    for (let i = 0; i < alive.length; i += 2) {
      const left = alive[i]!;
      const right = alive[i + 1]!;
      if (left === null || right === null) {
        nextAlive.push(null); // the player's side: resolved by the player's own battle, not simulated
        continue;
      }
      const m = playMatch(b, round, i / 2, left, right);
      matches.push(m);
      nextAlive.push(m.winner);
    }
    alive = nextAlive;
  }
  return { winners: alive, matches };
}

/** The opponent the player meets in `round` (1 to 5): the winner of the sibling block. Round 5 is always the champion. */
export function opponentFor(b: Bracket, round: number): string {
  if (round < 1 || round > GALAR_TOURNAMENT.rounds) throw new Error(`Round ${round} is not in the tournament`);
  const { winners } = blockWinners(b, round - 1);
  // After round-1 rounds, player is in block 0 (null) and the sibling block is block 1.
  return winners[1]!;
}

/** The player's five opponents, in order. */
export function playerPath(b: Bracket): string[] {
  return Array.from({ length: GALAR_TOURNAMENT.rounds }, (_, i) => opponentFor(b, i + 1));
}

/** The other matches of a round (everything but the player's), with upsets marked; for "watch another battle" and crowd reactions. */
export function otherMatches(b: Bracket, round: number): Match[] {
  return blockWinners(b, round).matches.filter((m) => m.round === round);
}

/** Who is still in the tournament after `wins` rounds. The player is listed while they have not lost. */
export function remaining(b: Bracket, wins: number, playerOut = false): string[] {
  const { winners } = blockWinners(b, wins);
  return winners.map((w) => w ?? (playerOut ? null : PLAYER_SLOT)).filter((x): x is string => x !== null);
}

export function roundName(round: number): string {
  return GALAR_TOURNAMENT.roundNames[round - 1] ?? `Round ${round}`;
}

/** The enemy team's level bonus for a round (added to the stage's normal level). */
export function roundLevelBonus(round: number): number {
  return GALAR_TOURNAMENT.roundLevelBonus[round - 1] ?? 0;
}

/** After the player wins `round`, is Ball Guy's shop open? After every `shopEvery` battles, never after the final. */
export function shopOpenAfter(round: number): boolean {
  return round < GALAR_TOURNAMENT.rounds && round % GALAR_TOURNAMENT.shopEvery === 0;
}

export interface ShopOffer { id: string; stock: number; price: number }

/** Ball Guy's rotating stock for a shop visit (0 = after round 2, 1 = after round 4). A fixed, limited pick of the visit's pool: stock and prices stop it from trivialising the next rounds. */
export function shopOffers(runSeed: string, visit: number): ShopOffer[] {
  const visits = GALAR_TOURNAMENT.shop.visits;
  const pool = visits[Math.min(visit, visits.length - 1)]!;
  const rng = streamFor(runSeed, `shop${visit}`);
  return rng.shuffle(pool.offers).slice(0, pool.picks).map((o) => ({ ...o }));
}

/** A crowd line for the end of a round: surprise upsets get their own gasp. */
export function crowdLine(b: Bracket, round: number): string {
  const lines = GALAR_TOURNAMENT.crowdLines;
  const rng = streamFor(b.seed, `crowd${round}`);
  if (round === GALAR_TOURNAMENT.rounds) return rng.pick(lines.final);
  return rng.pick(otherMatches(b, round).some((m) => m.upset) ? lines.upset : lines.win);
}

// ---------- wiring helpers: the League stage of a Galar run becomes this tournament ----------

/** Rounds after which Ball Guy's shop opens as a side stop on the League map (columns of the League line). */
export const GALAR_SHOP_COLUMNS: readonly number[] = [2, 4].filter(shopOpenAfter);

/** The Galar League is the tournament: not in a Story or Daily run (they cast their own League). */
export function usesGalarTournament(regionId: string, story: boolean, daily: boolean): boolean {
  return regionId === 'galar' && !story && !daily;
}

/**
 * The tournament's first four opponents replace the cast Elite Four (round 5 is the cast champion, who always wins the other half). Rewrites the
 * Elite Four casting record to match. Uses its own seeded stream, so no gameplay roll moves. Returns the new Elite Four ids (battle order).
 */
export function galarEliteFour(content: Content, run: RunState, champion: string): string[] {
  const rivalIds = run.story.rivals.map((r) => r.name.toLowerCase()).filter((id) => content.bosses.has(id));
  const bracket = buildBracket({ runSeed: run.seed, championId: champion, rivalIds });
  const four = playerPath(bracket).slice(0, 4).map((id) => (content.bosses.has(id) ? id : GALAR_TOURNAMENT.roster[0]!.bossId));
  run.roleCast = run.roleCast.map((c) => (c.role === 'elite' && c.regionIndex === run.regionIndex ? { ...c, id: four[c.slot] ?? c.id } : c));
  return four;
}

/** Ball Guy's stock for the current visit, minus what this visit already sold out. */
export function ballGuyStock(runSeed: string, visit: number, sold: Readonly<Record<string, number>> = {}): { item: string; price: number; minBadges: number }[] {
  return shopOffers(runSeed, visit).filter((o) => (sold[o.id] ?? 0) < o.stock).map((o) => ({ item: o.id, price: o.price, minBadges: 0 }));
}

/** How many of an item Ball Guy may sell in a visit. */
export function ballGuyLimit(runSeed: string, visit: number, itemId: string): number {
  return shopOffers(runSeed, visit).find((o) => o.id === itemId)?.stock ?? 0;
}

/** The tournament round the current League battle is (1 to 5), or null outside the Galar tournament. */
export function currentTournamentRound(content: Content, run: RunState): { round: number; name: string; opponent: string; intro: string; final: boolean; style: string; sprite: string } | null {
  const stage = run.stage;
  if (!stage || stage.kind !== 'league' || run.regionOrder[run.regionIndex] !== 'galar' || !stage.map.nodes.some((n) => n.sides.length > 0)) return null;
  const view = bracketView(content, run);
  const r = view.rounds[Math.min(view.wins, GALAR_TOURNAMENT.rounds - 1)]!;
  return { round: r.round, name: r.name, opponent: r.opponent.name, intro: r.opponent.intro, final: r.round === GALAR_TOURNAMENT.rounds, style: r.opponent.style, sprite: content.bosses.get(r.opponent.id)?.sprites.default ?? '' };
}

// ---------- the bracket screen's data (pure) ----------

export interface BracketRound {
  round: number;
  name: string;
  state: 'won' | 'next' | 'later';
  opponent: { id: string; name: string; style: string; intro: string };
  /** Entrants still in after this round (names, the player as "You"). */
  remaining: string[];
  /** Other matches of the round that were upsets (winner beat a stronger entrant). Shown once the round is won. */
  upsets: string[];
  crowd: string | null;
  shopAfter: boolean;
}

export interface FeaturedMatch { round: number; text: string; upset: boolean }
export interface BracketView { rounds: BracketRound[]; wins: number; standing: string[]; /** One other match per won round, for "watching another battle". */ featured: FeaturedMatch[] }

/** What the bracket screen draws: five rounds, the player's opponent and the field. `wins` = rounds the player has won. */
export function bracketView(content: Content, run: RunState): BracketView {
  const stage = run.stage;
  const champion = stage?.leaderId ?? GALAR_TOURNAMENT.champion;
  const rivalIds = run.story.rivals.map((r) => r.name.toLowerCase()).filter((id) => content.bosses.has(id));
  const b = buildBracket({ runSeed: run.seed, championId: champion, rivalIds });
  // The node is added to `visited` when its battle starts, so during a battle the current round is not won yet.
  const wins = Math.min(GALAR_TOURNAMENT.rounds, Math.max(0, (stage?.visited.length ?? 0) - (run.battle ? 1 : 0)));
  const name = (id: string): string => (id === PLAYER_SLOT ? 'You' : (content.bosses.get(id)?.name ?? id));
  const rounds: BracketRound[] = [];
  for (let round = 1; round <= GALAR_TOURNAMENT.rounds; round++) {
    const id = opponentFor(b, round);
    const entry = b.roster[id];
    const won = round <= wins;
    rounds.push({
      round,
      name: roundName(round),
      state: won ? 'won' : round === wins + 1 ? 'next' : 'later',
      opponent: { id, name: name(id), style: id === b.champion ? 'Galar Champion' : (entry?.style ?? 'Challenger'), intro: id === b.champion ? `${name(id)} raises a hand to the roaring stadium.` : (entry?.intro ?? GALAR_TOURNAMENT.introduceLine.replace('{name}', name(id))) },
      remaining: remaining(b, round).map(name),
      upsets: won ? otherMatches(b, round).filter((m) => m.upset).map((m) => `${name(m.winner)} beat ${name(m.winner === m.a ? m.b : m.a)}`) : [],
      crowd: won ? crowdLine(b, round) : null,
      shopAfter: shopOpenAfter(round),
    });
  }
  const featured: FeaturedMatch[] = [];
  for (let round = 1; round <= wins && round < GALAR_TOURNAMENT.rounds; round++) {
    const matches = otherMatches(b, round);
    const pick = matches.find((m) => m.upset) ?? matches.reduce((best, m) => (strengthOf(b, m.winner) + strengthOf(b, m.a === m.winner ? m.b : m.a) > strengthOf(b, best.winner) + strengthOf(b, best.a === best.winner ? best.b : best.a) ? m : best), matches[0]!);
    const loser = pick.winner === pick.a ? pick.b : pick.a;
    featured.push({ round, upset: pick.upset, text: pick.upset ? `On the big screen: ${name(pick.winner)} stuns ${name(loser)}!` : `On the big screen: ${name(pick.winner)} edges out ${name(loser)} in a close one.` });
  }
  return { rounds, wins, standing: remaining(b, wins).map(name), featured };
}

// ---------- watching another match (a short deterministic replay) ----------

export interface ReplayBeat { text: string; hpA: number; hpB: number }
export interface MatchReplay {
  round: number;
  a: { id: string; name: string; sprite: string };
  b: { id: string; name: string; sprite: string };
  winner: 'a' | 'b';
  upset: boolean;
  beats: ReplayBeat[];
}

/** A short, presentation-only replay of the featured match of a won round: HP bars and commentary. Same bracket, same replay; never touches gameplay rolls. */
export function matchReplay(content: Content, run: RunState, round: number): MatchReplay | null {
  const stage = run.stage;
  const champion = stage?.leaderId ?? GALAR_TOURNAMENT.champion;
  const rivalIds = run.story.rivals.map((r) => r.name.toLowerCase()).filter((id) => content.bosses.has(id));
  const b = buildBracket({ runSeed: run.seed, championId: champion, rivalIds });
  const matches = otherMatches(b, round);
  if (matches.length === 0) return null;
  const pick = matches.find((m) => m.upset) ?? matches[0]!;
  const info = (id: string) => ({ id, name: content.bosses.get(id)?.name ?? id, sprite: content.bosses.get(id)?.sprites.default ?? '' });
  const winner = pick.winner === pick.a ? 'a' : 'b';
  const rng = streamFor(b.seed, `replay${round}`);
  const A = info(pick.a);
  const B = info(pick.b);
  const win = winner === 'a' ? A : B;
  const lose = winner === 'a' ? B : A;
  // HP shares (0..1) after each beat; the loser ends at 0. In an upset the eventual loser leads at first.
  const steps = pick.upset ? [[0.6, 1], [0.5, 0.6], [0.3, 0.5], [0.15, 0.2], [0, 0.1]] : [[1, 0.7], [0.8, 0.5], [0.7, 0.25], [0.55, 0.1], [0.45, 0]];
  const lines = pick.upset
    ? [`${lose.name} opens with a huge hit!`, `${win.name} hangs on by a thread.`, `The crowd gasps: ${win.name} turns it around!`, `${lose.name} is cornered.`, `${win.name} wins it! A shocking upset!`]
    : [`${win.name} takes the early lead.`, `${lose.name} fights back.`, `A clean hit from ${win.name}.`, `${lose.name} is running low.`, `${win.name} takes the round.`];
  const beats: ReplayBeat[] = steps.map(([w, l], i) => {
    const jitter = i < 4 ? (rng.float() - 0.5) * 0.06 : 0;
    const wHp = Math.min(1, Math.max(0.03, w! + jitter));
    const lHp = i === 4 && !pick.upset ? 0 : Math.max(i === steps.length - 1 ? 0 : 0.03, l! - Math.abs(jitter));
    const loserHp = i === steps.length - 1 ? 0 : lHp;
    return winner === 'a' ? { text: lines[i]!, hpA: wHp, hpB: loserHp } : { text: lines[i]!, hpA: loserHp, hpB: wHp };
  });
  return { round, a: A, b: B, winner, upset: pick.upset, beats };
}
