import { z } from 'zod';
import type { Content } from './contentSchema';
import type { RunState } from './state';
import tournamentJson from '../data/galarTournament.json';
import { hashSeed, Rng } from './rng';
import { simulateMatch, type SimResult } from './galarSim';

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
  /** The other matches are played for real (core/galarSim.ts): both teams at this level; a match that runs out of turns goes to the judges; how often a seeded champion or last rival may replay a lost match (the second half with a level edge) before their win is simply taken. */
  sim: z.object({ level: z.number().int().min(1).max(100), maxTurns: z.number().int().min(10), retries: z.number().int().min(1) }),
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
  /** Set when the other matches are simulated battles. */
  sim?: { content: Content; teamIndex: number };
}

export interface BuildOptions {
  runSeed: string;
  /** The Galar champion of this run (defaults to the tournament's champion). Always wins the other half of the bracket. */
  championId?: string;
  /** Active rivals: they are entered into the tournament so rematches can happen. */
  rivalIds?: readonly string[];
  /** Bosses the player already beat as gym leaders; they are not rolled out of the roster, only used to fill in with the weakest first. */
  avoid?: readonly string[];
  /** Given content, the other matches are real simulated battles (core/galarSim.ts) with each boss's team for this region; without it, a strength roll (old saves, quick tests). */
  content?: Content;
  /** Which of each boss's Elite Four teams the simulation uses (the run's region index). */
  teamIndex?: number;
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
  return { seed: opts.runSeed, champion, slots, roster: byId, lastRival, ...(opts.content ? { sim: { content: opts.content, teamIndex: opts.teamIndex ?? 0 } } : {}) };
}

function strengthOf(b: Bracket, id: string): number {
  if (id === b.champion) return 10;
  return b.roster[id]?.strength ?? GUEST_STRENGTH;
}

export interface Match { round: number; a: string; b: string; winner: string; upset: boolean; /** The simulated battle (when the bracket is simulated): Pokémon left, turn count and the play-by-play. */ sim?: SimResult }

const simCache = new Map<string, SimResult>();

/** A real simulated battle between two entrants. A seeded champion or last rival who loses replays (fresh rolls, then a level edge) until they win: the bracket promises them their place. */
function simMatch(b: Bracket, round: number, index: number, a: string, c: string, forced: string | null): SimResult {
  const { content, teamIndex } = b.sim!;
  const key = `${b.seed}|${b.champion}|${b.lastRival ?? ''}|${teamIndex}|${round}|${index}|${a}|${c}`;
  const hit = simCache.get(key);
  if (hit) return hit;
  const cfg = GALAR_TOURNAMENT.sim;
  const name = (id: string): string => content.bosses.get(id)?.name ?? id;
  const side = (id: string, edge: number) => ({ bossId: id, name: name(id), level: Math.min(100, cfg.level + roundLevelBonus(round) + edge), teamIndex, role: id === b.champion ? 'champion' as const : 'elite' as const });
  let result: SimResult | null = null;
  for (let tryNo = 0; tryNo < (forced ? cfg.retries : 1); tryNo++) {
    const edge = forced && tryNo >= cfg.retries / 2 ? 5 + 5 * Math.floor((tryNo - cfg.retries / 2) / 4) : 0;
    result = simulateMatch(content, side(a, forced === a ? edge : 0), side(c, forced === c ? edge : 0), `${b.seed}:r${round}m${index}:${tryNo}`, cfg.maxTurns);
    if (!forced || (result.winner === 'a' ? a : c) === forced) break;
  }
  if (forced && (result!.winner === 'a' ? a : c) !== forced) result = { ...result!, winner: forced === a ? 'a' : 'b' };
  if (simCache.size > 2000) simCache.clear();
  simCache.set(key, result!);
  return result!;
}

/** Plays one match between two non-player entrants. The champion always wins; otherwise the stronger entrant is favoured but upsets happen. */
function playMatch(b: Bracket, round: number, index: number, a: string, c: string): Match {
  let winner: string;
  if (b.sim) {
    const forced = a === b.champion || c === b.champion ? b.champion : a === b.lastRival || c === b.lastRival ? b.lastRival! : null;
    const sim = simMatch(b, round, index, a, c, forced);
    winner = sim.winner === 'a' ? a : c;
    const loser = winner === a ? c : a;
    return { round, a, b: c, winner, upset: strengthOf(b, winner) + 2 <= strengthOf(b, loser), sim };
  }
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
  const bracket = buildBracket({ runSeed: run.seed, championId: champion, rivalIds: rivalIdsOf(content, run), content, teamIndex: run.regionIndex });
  const four = playerPath(bracket).slice(0, 4).map((id) => (content.bosses.has(id) ? id : GALAR_TOURNAMENT.roster[0]!.bossId));
  run.roleCast = run.roleCast.map((c) => (c.role === 'elite' && c.regionIndex === run.regionIndex ? { ...c, id: four[c.slot] ?? c.id } : c));
  return four;
}

function rivalIdsOf(content: Content, run: RunState): string[] {
  return run.story.rivals.map((r) => r.name.toLowerCase()).filter((id) => content.bosses.has(id));
}

/**
 * The run's bracket. Tournaments are simulated battles; a run saved mid-tournament before that (its cast Elite Four matches the old
 * strength-roll bracket, not the simulated one) keeps its old bracket, so the screen always shows the fights the run really has.
 */
export function runBracket(content: Content, run: RunState, champion: string = run.stage?.leaderId ?? GALAR_TOURNAMENT.champion): Bracket {
  const rivalIds = rivalIdsOf(content, run);
  const sim = buildBracket({ runSeed: run.seed, championId: champion, rivalIds, content, teamIndex: run.regionIndex });
  const cast = run.roleCast.filter((c) => c.role === 'elite' && c.regionIndex === run.regionIndex).sort((x, y) => x.slot - y.slot).map((c) => c.id);
  if (cast.length < 4) return sim;
  const four = (b: Bracket): boolean => playerPath(b).slice(0, 4).every((id, i) => !content.bosses.has(id) || cast[i] === id);
  if (four(sim)) return sim;
  const legacy = buildBracket({ runSeed: run.seed, championId: champion, rivalIds });
  return four(legacy) ? legacy : sim;
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
export function currentTournamentRound(content: Content, run: RunState): { round: number; name: string; opponent: string; intro: string; final: boolean; style: string; sprite: string; /** Who they beat to get here, with the score ('Milo 4–1'); null in round 1. */ via: string | null } | null {
  const stage = run.stage;
  if (!stage || stage.kind !== 'league' || run.regionOrder[run.regionIndex] !== 'galar' || !stage.map.nodes.some((n) => n.sides.length > 0)) return null;
  const view = bracketView(content, run);
  const r = view.rounds[Math.min(view.wins, GALAR_TOURNAMENT.rounds - 1)]!;
  // How they got here: their win in the round before (a real simulated match), for the reporter.
  const last = r.round > 1 ? otherMatches(runBracket(content, run), r.round - 1).find((m) => m.winner === r.opponent.id) : undefined;
  const via = last ? `${content.bosses.get(last.winner === last.a ? last.b : last.a)?.name ?? '?'}${scoreText(last)}` : null;
  return { round: r.round, name: r.name, opponent: r.opponent.name, intro: r.opponent.intro, final: r.round === GALAR_TOURNAMENT.rounds, style: r.opponent.style, sprite: content.bosses.get(r.opponent.id)?.sprites.default ?? '', via };
}

// ---------- the bracket screen's data (pure) ----------

export interface BracketRound {
  round: number;
  name: string;
  state: 'won' | 'next' | 'later';
  opponent: { id: string; name: string; style: string; intro: string; /** Their type speciality, picture id and best known Pokémon (up to six), for the bracket screen. */ types: string[]; sprite: string; team: string[] };
  /** How many levels stronger this round's field is than the first. */
  levelBonus: number;
  /** Entrants still in after this round (names, the player as "You"). */
  remaining: string[];
  /** Other matches of the round that were upsets (winner beat a stronger entrant). Shown once the round is won. */
  upsets: string[];
  crowd: string | null;
  shopAfter: boolean;
  /** Once the round is won: its big-screen match in a few words with the score ("Bede beat Milo 4–1"), else null. */
  headline: string | null;
  /** How many other matches the round has (15, 7, 3, 1, 0). */
  others: number;
}

export interface FeaturedMatch { round: number; text: string; upset: boolean }
export interface BracketView { rounds: BracketRound[]; wins: number; standing: string[]; /** One other match per won round, for "watching another battle". */ featured: FeaturedMatch[] }

/** What the bracket screen draws: five rounds, the player's opponent and the field. `wins` = rounds the player has won. */
export function bracketView(content: Content, run: RunState): BracketView {
  const stage = run.stage;
  const b = runBracket(content, run);
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
      levelBonus: roundLevelBonus(round),
      opponent: { id, name: name(id), types: content.bosses.get(id)?.types ?? [], sprite: content.bosses.get(id)?.sprites.default ?? '', team: (content.bosses.get(id)?.signature ?? []).slice(0, 6), style: id === b.champion ? 'Galar Champion' : (entry?.style ?? 'Challenger'), intro: id === b.champion ? `${name(id)} raises a hand to the roaring stadium.` : (entry?.intro ?? GALAR_TOURNAMENT.introduceLine.replace('{name}', name(id))) },
      remaining: remaining(b, round).map(name),
      upsets: won ? otherMatches(b, round).filter((m) => m.upset).map((m) => `${name(m.winner)} beat ${name(m.winner === m.a ? m.b : m.a)}${scoreText(m)}`) : [],
      crowd: won ? crowdLine(b, round) : null,
      shopAfter: shopOpenAfter(round),
      headline: won && round < GALAR_TOURNAMENT.rounds ? headlineOf(b, otherMatches(b, round), name) : null,
      others: 2 ** (GALAR_TOURNAMENT.rounds - round) - 1,
    });
  }
  const featured: FeaturedMatch[] = [];
  for (let round = 1; round <= wins && round < GALAR_TOURNAMENT.rounds; round++) {
    const matches = otherMatches(b, round);
    const pick = featuredMatch(b, matches);
    const loser = pick.winner === pick.a ? pick.b : pick.a;
    featured.push({ round, upset: pick.upset, text: pick.upset ? `On the big screen: ${name(pick.winner)} stuns ${name(loser)}${scoreText(pick)}!` : `On the big screen: ${name(pick.winner)} edges out ${name(loser)}${scoreText(pick)} in a close one.` });
  }
  return { rounds, wins, standing: remaining(b, wins).map(name), featured };
}

function headlineOf(b: Bracket, matches: Match[], name: (id: string) => string): string | null {
  if (matches.length === 0) return null;
  const m = featuredMatch(b, matches);
  return `${name(m.winner)} beat ${name(m.winner === m.a ? m.b : m.a)}${scoreText(m)}`;
}

/** " 4–1": Pokémon left on each side of a simulated match (winner first); empty for a strength-roll match. */
export function scoreText(m: Match): string {
  if (!m.sim) return '';
  const w = m.sim.winner === 'a' ? m.sim.leftA : m.sim.leftB;
  const l = m.sim.winner === 'a' ? m.sim.leftB : m.sim.leftA;
  return ` ${w}–${l}`;
}

/** The match of a round the big screen shows: an upset first, else (simulated) the closest finish, else the strongest pairing. */
function featuredMatch(b: Bracket, matches: Match[]): Match {
  const up = matches.find((m) => m.upset);
  if (up) return up;
  if (matches[0]?.sim) return matches.reduce((best, m) => (Math.abs(m.sim!.leftA - m.sim!.leftB) < Math.abs(best.sim!.leftA - best.sim!.leftB) ? m : best), matches[0]);
  return matches.reduce((best, m) => (strengthOf(b, m.winner) + strengthOf(b, m.a === m.winner ? m.b : m.a) > strengthOf(b, best.winner) + strengthOf(b, best.a === best.winner ? best.b : best.a) ? m : best), matches[0]!);
}

export interface BracketTreeSlot { id: string; name: string; you: boolean; /** Their best-known Pokémon (species id; the player's lead), or null. */ ace: string | null }
export interface BracketTree {
  /** Rounds the player has won (0 to 5). */
  wins: number;
  /** Who stands after 0, 1, ... `wins` rounds, in bracket order: 32, 16, 8, 4, 2 and, once the final is won, the champion. */
  lines: BracketTreeSlot[][];
}

/** The whole bracket as a tree, for the New UI's bracket screen. Only rounds already played are listed; read only. */
export function bracketTree(content: Content, run: RunState): BracketTree {
  const stage = run.stage;
  const b = runBracket(content, run);
  const wins = Math.min(GALAR_TOURNAMENT.rounds, Math.max(0, (stage?.visited.length ?? 0) - (run.battle ? 1 : 0)));
  const slot = (id: string): BracketTreeSlot => ({ id, name: id === PLAYER_SLOT ? 'You' : (content.bosses.get(id)?.name ?? id), you: id === PLAYER_SLOT, ace: id === PLAYER_SLOT ? (run.party[0]?.speciesId ?? null) : (content.bosses.get(id)?.signature?.[0] ?? null) });
  return { wins, lines: Array.from({ length: wins + 1 }, (_, c) => remaining(b, c).map(slot)) };
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
  const b = runBracket(content, run);
  const matches = otherMatches(b, round);
  if (matches.length === 0) return null;
  const pick = featuredMatch(b, matches);
  const info = (id: string) => ({ id, name: content.bosses.get(id)?.name ?? id, sprite: content.bosses.get(id)?.sprites.default ?? '' });
  const winner = pick.winner === pick.a ? 'a' : 'b';
  // A simulated match replays its own play-by-play: the opening, every knock-out (with the next Pokémon), and the result.
  if (pick.sim) {
    const beats: ReplayBeat[] = [];
    pick.sim.beats.forEach((x, i) => {
      const last = beats.at(-1);
      if (i > 0 && last && beats.length > 1 && x.text.includes('sends out') && !last.text.includes('sends out')) beats[beats.length - 1] = { text: `${last.text} ${x.text}`, hpA: x.hpA, hpB: x.hpB };
      else beats.push({ ...x });
    });
    return { round, a: info(pick.a), b: info(pick.b), winner, upset: pick.upset, beats };
  }
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
