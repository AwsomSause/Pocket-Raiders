// Greenneedle gn.new.29, The Borrowed Team (doc GREENNEEDLE_PLACED_2.md lines 313–346).
// A referee swaps the hats: the player commands the rival's real team, the rival commands the player's. Exhibition rules.
//  - gn op `borrowStart`: your own team goes to the bench (tagged `borrow-bench`); the rival's last team (their moves) joins your party,
//    tagged `borrowed`, at your average level.
//  - Battle rule `borrowed`: the other side is a copy of your benched team, led by the rival. One of the rival's looks over its shoulder
//    at you; one of yours looks at the rival (the lingerers, one-battle bonus the next time you meet).
//  - gn op `borrowEnd` (`n` 1 you won, 0 you lost): your team comes back, the borrowed one goes home. Each side now knows the other's team
//    and moves: the rival's scouting ledger gains yours (R4); flag `borrow-knows` is yours.
//  - Gate `rivalTrust` (`n`): the featured rival's Trust is at least `n`.
// Pure rules: nothing rolls (the lingerers are the first of each team by seed order).
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { featuredRival, rivalFightTeam } from '../rivals/living';
import { overhaulOf } from '../rivals/overhaul';
import { createPokemon, maxHp } from '../pokemon';
import { fnv1a } from '../expansion/hash';

type Make = (speciesId: string, level: number, uid: string) => PokemonInstance;

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
const cast = (run: RunState, name: string, id: string): void => {
  for (const k of Object.keys(run.story.flags)) if (k.startsWith(`ev:cast-${name}:`)) delete run.story.flags[k];
  if (id) run.story.flags[`ev:cast-${name}:${id}`] = 1;
};

export const BORROWED = 'borrowed';
export const BORROW_BENCH = 'borrow-bench';
const FALLBACK = ['growlithe', 'pidgeotto', 'kadabra', 'rhyhorn', 'gyarados', 'arcanine'];

/** The rival's line by personality: before the battle and after it (the doc's `[by personality]`). */
const DONT: Record<string, string> = {
  'champion-chaser': '"Don\'t break them. I\'ll want them in one piece when I beat you with them."',
  'bitter-challenger': '"Don\'t break them. ...They\'re all I\'ve got that\'s mine."',
  enthusiast: '"Don\'t break them! Okay. Break them a little. This is going to be so good."',
  idealist: '"Don\'t break them. They trust me. Please be someone they can trust too."',
  strategist: '"Don\'t break them. I have notes on every one. You\'ll find the notes are right."',
  protector: '"Don\'t break them. Not one. I mean it."',
  prodigy: '"Don\'t break them. Not that you could. Probably."',
  underdog: '"Don\'t break them. I mean, do what you like. But they\'re my whole team."',
};
const AFTER: Record<string, string> = {
  'champion-chaser': '"Yours listens before you\'ve finished the word. I didn\'t know they did that. I\'m going to find out how."',
  'bitter-challenger': '"Yours listens before you\'ve finished the word. I didn\'t know they did that. ...Mine never did, for me."',
  enthusiast: '"Yours listens before you\'ve finished the word! I didn\'t know they did that! Teach me. Please."',
  idealist: '"Yours listens before you\'ve finished the word. I didn\'t know they did that. They\'re happy. I can tell."',
  strategist: '"Yours listens before you\'ve finished the word. I didn\'t know they did that. That isn\'t on any of my notes."',
  protector: '"Yours listens before you\'ve finished the word. I didn\'t know they did that. You treat them well. Good."',
  prodigy: '"Yours listens before you\'ve finished the word. I didn\'t know they did that. ...That\'s annoying. In a good way."',
  underdog: '"Yours listens before you\'ve finished the word. I didn\'t know they did that. I thought only the strong ones got that."',
};
const personalityOf = (run: RunState): string => {
  const r = featuredRival(run);
  return (r && overhaulOf(run, r.id)?.personality) || 'champion-chaser';
};

export const rivalTrustAtLeast = (run: RunState, n: number): boolean => {
  const r = featuredRival(run);
  return !!r && (overhaulOf(run, r.id)?.feelings.trust ?? 0) >= n;
};

const nameOf = (content: Content, sp: string | undefined): string => (sp ? content.species.get(sp)?.name ?? sp : 'one of them');

/** Hats on: your team to the bench; the rival's to you. */
export function borrowStart(content: Content, run: RunState, make: Make): string {
  const rival = featuredRival(run);
  const level = Math.max(1, Math.round(run.party.reduce((a, m) => a + m.level, 0) / Math.max(1, run.party.length)));
  const last = rival?.memory?.lastBattle;
  const team = (rival ? rivalFightTeam(content, rival) : []).slice(0, 6);
  const known = team.length > 0 && last?.team.length === team.length;
  const ids = (team.length ? team : FALLBACK.filter((id) => content.species.has(id))).slice(0, team.length ? 6 : Math.max(3, Math.min(6, run.party.length)));
  for (const m of run.party) m.gn = [...(m.gn ?? []), BORROW_BENCH];
  run.box = [...run.box, ...run.party];
  const mine = run.party.map((m) => m.speciesId);
  run.party = ids.map((id, i) => {
    // Their real level and moveset from the last meeting (their habits), when it is on record.
    const mon = make(id, known ? Math.max(1, last?.levels?.[i] ?? level) : level, `p${run.nextUid + i}`);
    const real = known ? (last?.moves?.[i] ?? []).filter((m) => content.moves.has(m)) : [];
    if (real.length) mon.moves = real.map((m) => ({ id: m, pp: content.moves.get(m)!.pp }));
    mon.gn = [BORROWED];
    return mon;
  });
  run.nextUid += ids.length;
  set(run, 'borrow-met', 1);
  set(run, 'borrow-live', 1);
  // The lingerers: one of theirs stays by you, one of yours by them (seed order, no roll).
  const pick = (list: string[]): string => list[fnv1a(`${run.seed}:borrow:${list.join(',')}`) % Math.max(1, list.length)] ?? '';
  cast(run, 'borrow-rival-ling', pick(ids));
  cast(run, 'borrow-my-ling', pick(mine));
  return '';
}

/** The battle: the rival leads a copy of your benched team. */
export function borrowBattleStart(content: Content, run: RunState, battle: BattleState): void {
  const bench = run.box.filter((m) => m.gn?.includes(BORROW_BENCH));
  if (!bench.length) return;
  battle.enemyTeam = bench.slice(0, 6).map((m, i) => {
    const copy = structuredClone(m);
    copy.uid = `borrow-foe-${i}`;
    copy.gn = [];
    copy.hp = maxHp(content, copy);
    return copy;
  });
  battle.enemyIndex = 0;
  const rival = featuredRival(run);
  if (rival && battle.trainer) battle.trainer = { ...battle.trainer, name: rival.name };
}

/** Hats off: your team returns, theirs goes home; each side learns the other's team and moves. */
export function borrowEnd(content: Content, run: RunState, won: number): string {
  const back = run.box.filter((m) => m.gn?.includes(BORROW_BENCH));
  run.box = run.box.filter((m) => !m.gn?.includes(BORROW_BENCH));
  for (const m of back) m.gn = (m.gn ?? []).filter((t) => t !== BORROW_BENCH);
  if (back.length) run.party = back;
  else run.party = run.party.filter((m) => !m.gn?.includes(BORROWED));
  set(run, 'borrow-live', 0);
  set(run, 'borrow-result', won ? 1 : 2);
  // The swap is heard about (gn.42's Foreman, the rival's later lines read it).
  set(run, 'x-rival-swapped-teams', 1);
  set(run, 'borrow-knows', 1);
  set(run, 'borrow-specific', 1);
  borrowArm(run);
  // The rival has seen your team's species, moves and abilities (their scouting ledger, this run).
  const rival = featuredRival(run);
  const rec = rival ? overhaulOf(run, rival.id) : undefined;
  if (rec) {
    const led = (rec.ledger ??= { moves: [], items: [], abilities: [], species: [], turns: 0, switches: 0 });
    const add = (list: string[], v: string, max: number): void => {
      if (v && !list.includes(v) && list.length < max) list.push(v);
    };
    for (const m of back) {
      add(led.species, m.speciesId, 60);
      for (const mv of m.moves) add(led.moves, mv.id, 60);
    }
  }
  return '';
}

/** The next time the two meet: each lingerer's side gets one battle's bonus (+1 Attack to the lead), then it is spent. */
export function borrowMeet(run: RunState, battle: BattleState): void {
  if (f(run, 'borrow-bonus') !== 1 || !(battle.rival || battle.rivalId)) return;
  set(run, 'borrow-bonus', 2);
  battle.playerStages.atk = Math.min(6, battle.playerStages.atk + 1);
  battle.enemyStages.atk = Math.min(6, battle.enemyStages.atk + 1);
  battle.storyEffects.push('A Pokémon that wore the other trainer\'s colours once is a little braver today. Attack rose on both sides!');
}

/** Called when the swap has ended: the bonus is armed for the next meeting. */
export function borrowArm(run: RunState): void {
  if (f(run, 'borrow-bonus') === 0) set(run, 'borrow-bonus', 1);
}

/** `{borrow:dont}` / `{borrow:after}` / `{borrow:name}` / `{borrow:mine}` / `{borrow:theirs}` in event text. */
export function borrowTokens(content: Content, run: RunState, text: string): string {
  const castOf = (name: string): string | undefined => Object.keys(run.story.flags).find((k) => k.startsWith(`ev:cast-${name}:`))?.slice(`ev:cast-${name}:`.length);
  return text.replace(/\{borrow:([a-z]+)\}/g, (_, part: string) => {
    if (part === 'dont') return DONT[personalityOf(run)] ?? DONT['champion-chaser']!;
    if (part === 'after') return AFTER[personalityOf(run)] ?? AFTER['champion-chaser']!;
    if (part === 'name') return featuredRival(run)?.name ?? 'Your rival';
    if (part === 'mine') return nameOf(content, castOf('borrow-my-ling'));
    if (part === 'theirs') return nameOf(content, castOf('borrow-rival-ling'));
    return '';
  });
}

/** One of the rival's Pokémon as the team viewer shows it. */
export interface TeamViewMon { speciesId: string; name: string; level: number; types: string[]; moves: string[] }
export interface TeamView { rival: string; mons: TeamViewMon[] }

/** The rival's team as you saw it from behind their hat: species, level, moves (their last meeting's, kept up to date). Null until you have borrowed it. */
export function borrowTeamView(content: Content, run: RunState): TeamView | null {
  if (f(run, 'borrow-knows') <= 0) return null;
  const rival = featuredRival(run);
  const last = rival?.memory?.lastBattle;
  if (!rival || !last?.team.length) return null;
  const mons = last.team.filter((id) => content.species.has(id)).map((id, i) => {
    const sp = content.species.get(id)!;
    const fallback = createPokemon(content, id, last.levels?.[i] ?? 20, 'view').moves.map((m) => m.id);
    const ids = (last.moves?.[i]?.length ? last.moves[i]! : fallback).filter((m) => content.moves.has(m));
    return { speciesId: id, name: sp.name, level: last.levels?.[i] ?? 0, types: [...sp.types], moves: ids.map((m) => content.moves.get(m)!.name) };
  });
  return mons.length ? { rival: rival.name, mons } : null;
}
