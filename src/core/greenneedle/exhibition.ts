// Greenneedle gn.47, The Pokémon League Exhibition (doc GREENNEEDLE_REWORKED_PLACED_10.md lines 271–360).
// The player watches a famous match from the stands: backs one side on air, makes three small choices while it runs, and the
// winner may reward them, or invite them down. The match is a real CPU-versus-CPU battle, six on six, fought on the battle engine
// with its own seeded stream (core/exhibition.ts `fight`); the commentary and the winner come from that battle.
// Ripples: in a later stage, a trainer talks about it and has copied a move they saw (10% less accurate for them).
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { fnv1a } from '../expansion/hash';
import { featuredRival } from '../rivals/living';
import { logOf } from './allstar';
import { fight, type ExhibitionTeam } from '../exhibition';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const cast = (run: RunState, name: string, id: string): void => {
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(`ev:cast-${name}:`)) delete run.story.flags[k];
  if (id) run.story.flags[`ev:cast-${name}:${id}`] = 1;
};
const castOf = (run: Pick<RunState, 'story'>, name: string): string | undefined =>
  Object.keys(run.story.flags).find((k) => k.startsWith(`ev:cast-${name}:`))?.slice(`ev:cast-${name}:`.length);

export interface Matchup {
  id: string;
  /** Boss ids. */
  a: string;
  b: string;
  what: string;
  /** What the match looks like, in three parts (the third ends it); `{winner}` / `{loser}` are filled in. */
  phases: [string, string, string];
  /** What a close watcher sees, one per part: a move they used. */
  seen: [string, string, string];
}
export const MATCHUPS: Matchup[] = [
  { id: 'red-blue', a: 'red', b: 'blue', what: 'One who never speaks, and one who never stops.', seen: ['thunderbolt', 'psychic', 'hydro-pump'], phases: [
    'Blue talks from the first second. To the crowd, to Red, to his own Pokémon. Red doesn\'t say a word. His Pikachu doesn\'t need him to.',
    'Blue is still talking. Red adjusts his cap, once. That\'s all.',
    'The last exchange. {winner} takes it. At the end, Red says one word. The microphones don\'t catch it. Blue goes quiet.',
  ] },
  { id: 'lance-steven', a: 'lance', b: 'steven', what: 'Dragons against steel. Two people far too polite to say they want this badly.', seen: ['dragon-dance', 'meteor-mash', 'extreme-speed'], phases: [
    'They bow. They bow again, because the other one bowed. The crowd laughs. Then Dragonite comes out, and nobody laughs.',
    'Steven\'s Metagross takes a hit meant to end it, and stays up. Lance applauds. With his cape still on.',
    'It goes the distance. {winner} wins it, and both of them pretend it didn\'t matter that much.',
  ] },
  { id: 'cynthia-iris', a: 'cynthia', b: 'iris', what: 'A champion, and the child who\'ll be one. Iris isn\'t afraid. Cynthia\'s delighted that she isn\'t.', seen: ['dragon-claw', 'earthquake', 'outrage'], phases: [
    'Iris runs to her side of the field. Cynthia walks. Garchomp and Haxorus look at each other like they\'ve met before.',
    'Iris\'s Haxorus goes down. Iris doesn\'t cry. Cynthia kneels, to be at her height, before she says anything.',
    'Iris fights on with everything she has left. {winner} wins. Afterwards, they leave the field holding hands.',
  ] },
  { id: 'leon-diantha', a: 'leon', b: 'diantha', what: 'A stadium against a stage. Both play to the crowd; only one of them knows it.', seen: ['air-slash', 'moonblast', 'heat-wave'], phases: [
    'Leon walks out to music. Diantha walks out to silence, and somehow that\'s louder.',
    'Leon strikes his pose. Diantha, deadpan, strikes it back. The stadium loses its mind.',
    'The last of it, under every light the stadium has. {winner} takes the final hit and the final bow.',
  ] },
  { id: 'wallace-alder', a: 'wallace', b: 'alder', what: 'Elegance against a man who\'s laughing too hard to be elegant.', seen: ['scald', 'quiver-dance', 'recover'], phases: [
    'Wallace arrives in a cape that catches the light. Alder arrives eating something. He waves with it.',
    'Alder\'s so pleased by a move of Wallace\'s that he forgets to give his next order. His Volcarona waits, patiently.',
    'Down to the last of them. {winner} wins it. Alder laughs louder than anyone, win or lose.',
  ] },
];
const BY_ID = new Map(MATCHUPS.map((m) => [m.id, m]));
export const matchupOf = (run: Pick<RunState, 'story'>): Matchup | undefined => BY_ID.get(castOf(run, 'ex-matchup') ?? '');

/** The matchup drawn here: one not yet seen this run, fixed by the seed and the region (no roll). */
export function nextMatchup(run: RunState): Matchup | undefined {
  const fresh = MATCHUPS.filter((m) => f(run, `ex-used-${m.id}`) === 0);
  return fresh[fnv1a(`exhibition:${run.seed}:${run.regionIndex}`) % Math.max(1, fresh.length)];
}
const bossName = (content: Content, id: string): string => content.bosses.get(id)?.name ?? id;
/** The level both sides fight at: a Champion's exhibition level. */
export const MATCH_LEVEL = 60;
export interface Played { winner: 1 | 2; lines: string[] }
const played = new WeakMap<Content, Map<string, Played>>();
/**
 * The match itself: both Champions' own six, played by the AI on the real battle engine (its own stream from the run's seed and
 * the matchup, so it is the same every time it is asked for and uses no gameplay roll). Returns who won (1 = a, 2 = b) and the
 * commentary, one line per knockout.
 */
export function playMatch(content: Content, run: Pick<RunState, 'seed'>, m: Matchup): Played {
  const key = `${run.seed}::${m.id}`;
  let cache = played.get(content);
  if (!cache) played.set(content, (cache = new Map()));
  const hit = cache.get(key);
  if (hit) return hit;
  const team = (id: string): ExhibitionTeam => {
    const boss = content.bosses.get(id);
    const six = (boss?.signature ?? []).filter((sp) => content.species.has(sp)).slice(0, 6);
    return { trainer: bossName(content, id), fighters: (six.length ? six : ['pikachu']).map((sp) => ({ speciesId: sp, name: content.species.get(sp)?.name ?? sp, level: MATCH_LEVEL })) };
  };
  const r = fight(content, run.seed, `gn47:${m.id}`, team(m.a), team(m.b));
  const out: Played = { winner: r.winner === 0 ? 1 : 2, lines: r.lines.slice(1, -1) };
  cache.set(key, out);
  return out;
}
/** Who wins: decided by the battle. 1 = a, 2 = b. */
export const winnerOf = (content: Content, run: Pick<RunState, 'seed'>, m: Matchup): 1 | 2 => playMatch(content, run, m).winner;
/** The commentary for part `n` (1 to 3) of the match: that third of the knockouts, in order. */
export function commentary(content: Content, run: Pick<RunState, 'seed'>, m: Matchup, n: number): string[] {
  const lines = playMatch(content, run, m).lines;
  const cut = (i: number): number => Math.round((lines.length * i) / 3);
  return lines.slice(cut(n - 1), cut(n));
}

/** Joins the queue: the matchup is cast, the per-visit counts reset. */
export function exDraw(content: Content, run: RunState): string {
  const m = nextMatchup(run);
  if (!m) return '';
  cast(run, 'ex-matchup', m.id);
  set(run, `ex-used-${m.id}`, 1);
  for (const k of ['ex-backed', 'ex-reason', 'ex-watched', 'ex-outcome', 'ex-invite']) set(run, k, 0);
  set(run, 'ex-winner', winnerOf(content, run, m));
  return '';
}

/** Backs one on air (1 = a, 2 = b, 0 = neither). Nobody is in two matchups and nothing is remembered across runs, so the reporter
 *  remembers a player who picked a side on air at an earlier Exhibition this run, and picks one again. */
export function exBack(run: RunState, side: number): string {
  const m = matchupOf(run);
  if (!m) return '';
  set(run, 'ex-backed', side);
  set(run, 'ex-again', 0);
  if (side === 0) return '';
  const who = side === 1 ? m.a : m.b;
  set(run, 'ex-again', f(run, 'ex-backed-times') > 0 ? 1 : 0);
  set(run, 'ex-backed-times', f(run, 'ex-backed-times') + 1);
  set(run, `ex-backed-${who}`, f(run, `ex-backed-${who}`) + 1);
  return '';
}

/** One of the three moments while it runs: cheer, watch closely (a free tutor move later), or look at the crowd. */
export function exWatch(content: Content, run: RunState, phase: number, choice: string): string {
  const m = matchupOf(run);
  if (!m) return '';
  const backed = f(run, 'ex-backed');
  if (choice === 'cheer') {
    const who = backed === 1 ? m.a : backed === 2 ? m.b : '';
    return who ? `${bossName(content, who)} glances up at the stands. They heard that.` : 'You cheer for both of them. Nobody can tell, which is the point.';
  }
  if (choice === 'watch') {
    const move = m.seen[phase - 1] ?? m.seen[0];
    set(run, 'ex-watched', f(run, 'ex-watched') + 1);
    set(run, `ex-seen:${move}`, 1);
    return `You watch the timing of ${content.moves.get(move)?.name ?? move}, exactly. You could teach that. A move tutor will show one of yours, for free.`;
  }
  const rival = featuredRival(run)?.name;
  const met = logOf(run).at(-1)?.n;
  const face = phase === 1 && rival ? `${rival}, three rows down` : phase === 2 && met ? `${met}, three rows down` : 'a Gym Leader out of uniform, three rows down';
  return `You look at the crowd instead. ${face}. They see you, and wave.`;
}

/** The result, by who you backed and why (1 they're stronger, 2 more to prove, 3 how they treat their Pokémon, 4 I want to see it). */
export function exResult(content: Content, run: RunState): string {
  const m = matchupOf(run);
  if (!m) return '';
  const backed = f(run, 'ex-backed');
  const reason = f(run, 'ex-reason');
  const win = f(run, 'ex-winner');
  const outcome = backed === 0 ? 5 : backed !== win ? 4 : reason === 2 ? 2 : reason === 3 ? 3 : 1;
  set(run, 'ex-outcome', outcome);
  const loser = win === 1 ? m.b : m.a;
  const w = bossName(content, win === 1 ? m.a : m.b);
  if (outcome === 2) set(run, `ex-seen:${m.seen[2]}`, 1);
  // Ripples: the next stage's trainers talk about it, and one copies a move. The poster goes up in the next Center.
  set(run, 'ex-ripple', run.regionIndex * 100 + (run.stage?.index ?? 0) + 1);
  set(run, 'ex-ripple-done', 0);
  set(run, 'ex-talk', 0);
  set(run, 'ex-poster', 1);
  set(run, 'ex-quoted', outcome === 5 ? 1 : 0);
  cast(run, 'ex-ripple-match', m.id);
  cast(run, 'ex-ripple-move', m.seen[1]);
  cast(run, 'ex-ripple-loser', loser);
  if (outcome === 1) return `${w} wins. They look up at your seat, and nod. A Rare item is sent up to you.`;
  if (outcome === 2) return `${w} wins, and finds you after. "You saw that? Most people didn't." They show you ${content.moves.get(m.seen[2])?.name ?? 'it'}; any move tutor will teach it free.`;
  if (outcome === 3) return `${w} wins. Their ace comes over to the barrier, and looks at your lead for a long time.`;
  if (outcome === 4) return `${bossName(content, backed === 1 ? m.a : m.b)} loses, and finds you after. "You backed me. On air. That was either kind or foolish."`;
  return `${w} wins. Both of them wave at your row. You're quoted in the paper next stage: "I don't mind who wins. I want to see it."`;
}

/** gn rule `exhibition`: the winner's own three, at the event's level (`A+2`). */
export function exStart(content: Content, run: RunState, battle: BattleState, make: (speciesId: string, level: number, uid: string) => PokemonInstance): void {
  const m = matchupOf(run);
  if (!m) return;
  const boss = content.bosses.get(f(run, 'ex-winner') === 1 ? m.a : m.b);
  if (!boss) return;
  const sig = boss.signature.filter((s) => content.species.has(s));
  battle.enemyTeam = battle.enemyTeam.map((x, i) => (sig[i] ? make(sig[i]!, x.level, x.uid) : x));
  battle.enemyIndex = 0;
  if (battle.trainer) battle.trainer = { ...battle.trainer, name: boss.name, spriteBoss: boss.id };
}

/** Moves seen closely and not yet taught: free at any move tutor, once each. */
export const exSeenMoves = (run: Pick<RunState, 'story'>): string[] =>
  Object.keys(run.story.flags).filter((k) => k.startsWith('ev:ex-seen:') && Number(run.story.flags[k]) > 0).map((k) => k.slice('ev:ex-seen:'.length)).sort();
export function exSeenTaught(run: Pick<RunState, 'story'>, move: string): void {
  run.story.flags[`ev:ex-seen:${move}`] = 0;
}

/** Tokens: {ex:a}, {ex:b}, {ex:what}, {ex:phase-1..3}, {ex:winner}, {ex:result-who}. */
export function exTokens(content: Content, run: RunState, text: string): string {
  const m = matchupOf(run) ?? nextMatchup(run);
  if (!m) return text;
  const win = f(run, 'ex-winner') || winnerOf(content, run, m);
  const winner = bossName(content, win === 1 ? m.a : m.b);
  const loser = bossName(content, win === 1 ? m.b : m.a);
  return text
    .replaceAll('{ex:a}', bossName(content, m.a))
    .replaceAll('{ex:b}', bossName(content, m.b))
    .replaceAll('{ex:what}', m.what)
    .replace(/\{ex:phase-([1-3])\}/g, (_, n: string) => {
      // The commentary box calls the knockouts of this part of the real match; then the small moment the crowd will remember.
      const calls = commentary(content, run, m, Number(n));
      const box = calls.length ? `*Commentary:* ${calls.join(' ')}\n\n` : '';
      return box + m.phases[Number(n) - 1]!.replaceAll('{winner}', winner).replaceAll('{loser}', loser);
    })
    .replaceAll('{ex:winner}', winner);
}

/** You've met one of them before: Coffee with Cynthia, Red on the Mountain, or the Champion's Training Session. */
export function exKnown(run: RunState): boolean {
  const m = matchupOf(run);
  if (!m) return false;
  const seen = (id: string): boolean => (run.itemCounters?.[`event-seen:${id}`] ?? 0) > 0;
  const met = new Set<string>();
  if (seen('face-champion-coffee')) met.add('cynthia');
  if (seen('red-on-the-mountain')) met.add('red');
  const taught = castOf(run, 'lesson-champion');
  if (taught && f(run, 'champ-lesson') > 0) met.add(taught);
  return met.has(m.a) || met.has(m.b);
}

/** What the next stage's trainers say about the match, by matchup (`{loser}` is filled in). */
const TALK: Record<string, string[]> = {
  'red-blue': ['"Did you hear what Red said, at the end? No. Nobody did. That\'s the point."', '"Blue talked for a whole match and one word shut him up. I want to know the word."'],
  'lance-steven': ['"Lance clapped. With the cape on. I\'ve been practising that all morning."', '"That Metagross took a hit meant to end it. Did you see? It just stood there."'],
  'cynthia-iris': ['"Did you see Iris? She didn\'t even cry."', '"Cynthia knelt down to talk to her. In front of everyone. I\'d have cried."'],
  'leon-diantha': ['"Diantha did his pose back at him. Deadpan. I nearly fell out of my seat."', '"Everyone\'s doing the pose today. Don\'t. I\'ve seen you thinking about it."'],
  'wallace-alder': ['"Alder forgot to give an order. Because he was *enjoying himself.* Imagine."', '"Did you see the Exhibition? {loser} lost, and still bowed first."'],
};
/** Ripples: every ordinary trainer of the next stage talks about the match; the first has also copied a move from it. Returns the line. */
export function exRipple(content: Content, run: RunState): string {
  const at = f(run, 'ex-ripple');
  const battle = run.battle;
  if (!at || !battle || battle.kind !== 'trainer' || battle.event || battle.trainer?.leaderId || battle.rival || battle.rivalId) return '';
  const now = run.regionIndex * 100 + (run.stage?.index ?? 0);
  if (now < at) return '';
  const loser = castOf(run, 'ex-ripple-loser');
  const who = battle.trainer?.name ?? 'The trainer';
  const talk = TALK[castOf(run, 'ex-ripple-match') ?? ''] ?? ['"Did you see the Exhibition? {loser} lost, and still bowed first."'];
  if (f(run, 'ex-ripple-done') > 0) {
    // The copy is made; the rest of that stage's trainers just talk.
    if (now !== at) return '';
    const n = f(run, 'ex-talk') + 1;
    set(run, 'ex-talk', n);
    return `${who}: ${talk[n % talk.length]!.replaceAll('{loser}', bossName(content, loser ?? ''))}`;
  }
  const move = castOf(run, 'ex-ripple-move');
  const lead = battle.enemyTeam[battle.enemyIndex];
  const mv = move ? content.moves.get(move) : undefined;
  if (!lead || !mv) return '';
  set(run, 'ex-ripple-done', 1);
  if (!lead.moves.some((x) => x.id === mv.id)) {
    if (lead.moves.length < 4) lead.moves.push({ id: mv.id, pp: mv.pp });
    else lead.moves[3] = { id: mv.id, pp: mv.pp };
  }
  battle.storyEffects.push(`ex-copied:${lead.uid}:${mv.id}`);
  const said = talk[0]!.replaceAll('{loser}', bossName(content, loser ?? ''));
  // "I don't mind who wins": the player is quoted in the paper next stage.
  const paper = f(run, 'ex-quoted') > 0 && now === at ? ' They have this morning\'s paper folded under one arm. You\'re in it: *"I don\'t mind who wins. I want to see it."*' : '';
  if (paper) set(run, 'ex-quoted', 0);
  return `${who}: ${said} Their ${content.species.get(lead.speciesId)?.name ?? 'Pokémon'} knows ${mv.name} now. They're very proud. It doesn't quite work yet.${paper}`;
}

/** Afterstory: a poster of the match in the next Center the player rests at, once. */
export function exPoster(run: RunState): string {
  const at = f(run, 'ex-ripple');
  if (f(run, 'ex-poster') <= 0 || !at || run.regionIndex * 100 + (run.stage?.index ?? 0) < at) return '';
  set(run, 'ex-poster', 0);
  return 'A poster of the Exhibition is up on the Center\'s wall. Somebody\'s drawn a small figure in row nine.';
}
