// Poli-Pond, "The Little Pokémon That Could" (Beta 0.7 miniature episode, companion story, region-wide story).
// A shy Poliwag is shoved out of the reeds and joins the party. It cannot attack in its first battle, then it is taught three lessons
// (aim, footing, standing its ground) at the rests. Each lesson it has not learned leaves one of the lead bully's tricks working in
// the rematch (gn.01: outside the rematch the only rule is that it will not attack in its first battle). The ending is Keep (Kindness), Release (it comes back as Poliwrath with allies) or Reconcile.
// No RNG anywhere: every effect is a fixed rule, so previews, saves and replays agree. State: story flags (`ev:pp-*`) and one optional
// mark on the Poliwag itself, so there is no save version change. Pure functions; run.ts and events.ts call them at their hook points.

import { z } from 'zod';
import type { Content } from '../contentSchema';
import { abilityOf, calcStats, createPokemon, getSpecies } from '../pokemon';
import { calcDamage, typeEffectiveness } from '../battle/damage';
import type { PlayerAction } from '../battle/engine';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { evilTeam } from '../evil/teams';
import { hashSeed, Rng } from '../rng';

export const LESSONS = ['aim', 'footing', 'stand'] as const;
export type PondLesson = (typeof LESSONS)[number];

/** Kindness: how many times a battle the bearer's switch-out hands the next Pokémon +1 priority. */
export const KINDNESS_USES = 2;
export const KINDNESS_ID = 'kindness';

/** The mark on the Poliwag (and on whatever it grows into). `shy`: it will not attack until its first battle is over. The three lessons are `true` once taught. */
export const PondMarkSchema = z.object({ shy: z.boolean(), aim: z.boolean(), footing: z.boolean(), stand: z.boolean(), kept: z.boolean().default(false) });
export type PondMark = z.infer<typeof PondMarkSchema>;

/**
 * The return (Release or Reconcile): a Poliwrath plus this many Poliwhirl fight beside the player for this many turns, as allies (gn.01).
 * They are real Pokémon at the party's average level and each hits with its own best move (the game's damage formula).
 * The foe is left with at least 1 HP: a hit from outside the turn cannot faint a Pokémon in this engine, so the last blow is the player's.
 */
export const POND_RETURN = {
  release: { poliwhirl: 3, turns: 3 },
  reconcile: { poliwhirl: 4, turns: 4 },
  /** The player is "losing" with this many Pokémon or fewer still standing (and at least one already down). */
  losingAt: 2,
} as const;

/** The Poliwag joins this many levels under the party's average (the lead bully, two above it, is then at the party's level: A+0). */
export const POND_JOIN_BELOW = 2;

/** gn.01's beat table: the step (1 to 19) of each scene on the stage the Poliwag joins, in order. */
export const POND_STEPS: readonly (readonly [string, number])[] = [['pp-lesson-aim', 7], ['pp-lesson-footing', 11], ['pp-pond-visit', 14], ['pp-lesson-stand', 17]];

export const FLAGS = {
  begun: 'pp-begun',
  gentle: 'pp-gentle',
  guilty: 'pp-guilty',
  lessons: 'pp-lessons',
  firstTry: 'pp-first-try',
  exceptional: 'pp-exceptional',
  rematchWon: 'pp-rematch-won',
  ending: 'pp-ending-done',
  keep: 'pp-keep',
  release: 'pp-release',
  reconcile: 'pp-reconcile',
  armed: 'pp-return-armed',
  fired: 'pp-return-fired',
  joined: 'pp-return-joined',
} as const;

const key = (k: string): string => `ev:${k}`;
export const pondFlag = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[key(k)] ?? 0);
export const setPondFlag = (run: Pick<RunState, 'story'>, k: string, v = 1): void => {
  run.story.flags[key(k)] = v;
};

/** The Pokémon carrying the Poli-Pond mark (the Poliwag, or what it grew into), if it is in the party. */
export const pondMon = (run: Pick<RunState, 'party'>): PokemonInstance | undefined => run.party.find((m) => m.pond);

export const freshMark = (): PondMark => ({ shy: true, aim: false, footing: false, stand: false, kept: false });

/** How a lesson was learned (flag `pp-lesson-<lesson>`): on the second retry (1), on the first retry (2), or the shortcut way, weaker (3). */
export const LESSON_RESULT = { second: 1, first: 2, weak: 3 } as const;

/**
 * Lesson counters after one lesson: how many were taught, and how many on the first retry; all three on the first retry is Exceptional.
 * `weak` (the shortcut response): learned, but in the rematch it cancels the bully's trick only half the time.
 */
export function recordLesson(run: Pick<RunState, 'story' | 'party'>, lesson: PondLesson, firstTry: boolean, weak = false): void {
  const mon = pondMon(run);
  if (mon?.pond) mon.pond[lesson] = true;
  if (pondFlag(run, `pp-lesson-${lesson}`) > 0) return;
  setPondFlag(run, `pp-lesson-${lesson}`, weak ? LESSON_RESULT.weak : firstTry ? LESSON_RESULT.first : LESSON_RESULT.second);
  firstTry = firstTry && !weak;
  setPondFlag(run, FLAGS.lessons, pondFlag(run, FLAGS.lessons) + 1);
  if (firstTry) setPondFlag(run, FLAGS.firstTry, pondFlag(run, FLAGS.firstTry) + 1);
  if (pondFlag(run, FLAGS.lessons) >= LESSONS.length && pondFlag(run, FLAGS.firstTry) >= LESSONS.length) setPondFlag(run, FLAGS.exceptional, 1);
}

export const lessonsTaught = (run: Pick<RunState, 'story'>): number => pondFlag(run, FLAGS.lessons);

type Cue = { type: 'spectacle'; kind: 'arena'; side: 'player' | 'enemy'; text: string; uid?: string };
const cue = (side: 'player' | 'enemy', text: string, uid?: string): Cue => ({ type: 'spectacle', kind: 'arena', side, text, ...(uid ? { uid } : {}) });

const nameOf = (content: Content, mon: PokemonInstance): string => content.species.get(mon.speciesId)?.name ?? mon.speciesId;

/** Which fight it is: the rematch (the bully's tricks) or any other. */
const inRematch = (battle: BattleState): boolean => battle.event?.eventId.startsWith('pp-rematch') === true;

/**
 * Before the player's command is played. gn.01: "It won't attack in its first battle. It's sent out; it looks at the ground; its turn
 * passes." That is the only rule outside the rematch; in the rematch the lead bully's tricks apply (each lesson cancels one).
 * Returns the action to play and the lines to show first. Never touches the RNG.
 */
export function pondShape(content: Content, run: RunState, action: PlayerAction): { action: PlayerAction; events: Cue[] } {
  const battle = run.battle;
  const mon = battle ? run.party[battle.activeIndex] : undefined;
  const mark = mon?.pond;
  if (!battle || !mon || !mark || mark.kept || action.kind !== 'move' || battle.needsSwitch) return { action, events: [] };
  const name = nameOf(content, mon);
  if (inRematch(battle)) return rematchShape(run, battle, name, mon, action);
  if (mark.shy) return { action: { kind: 'idle' }, events: [cue('player', `${name} is looking at the ground.`, mon.uid)] };
  return { action, events: [] };
}

/**
 * The rematch (gn.01): Burl's three tricks, each cancelled by one lesson.
 *  - Splash-Blind (Aim): the Poliwag's first two moves (turns 1 and 2) miss.
 *  - Shove (Footing): a flinch every other turn (even turns).
 *  - The Slap (Standing its ground): on turn 3 it turns to run, loses the turn, and turns back.
 * A lesson learned the shortcut way cancels its trick only half the time: a coin per trick and turn on its own seeded stream
 * (`pond-weak`), so a replay gives the same coins and no other roll moves.
 */
function rematchShape(run: RunState, battle: BattleState, name: string, mon: PokemonInstance, action: PlayerAction): { action: PlayerAction; events: Cue[] } {
  const t = battle.turn;
  const fires = (lesson: PondLesson): boolean => {
    const v = pondFlag(run, `pp-lesson-${lesson}`);
    if (v === LESSON_RESULT.first || v === LESSON_RESULT.second) return false;
    if (v === LESSON_RESULT.weak) return new Rng(hashSeed(`${run.seed}::pond-weak::${lesson}::${t}`)).float() < 0.5;
    return true;
  };
  const lost = (text: string): { action: PlayerAction; events: Cue[] } => ({ action: { kind: 'idle' }, events: [cue('enemy', text, mon.uid)] });
  if (t <= 2 && fires('aim')) return lost(`Splash-Blind! Burl slaps a sheet of water into ${name}'s eyes. Its attack misses.`);
  if (t % 2 === 0 && fires('footing')) return lost(`Shove! Burl shoulders ${name} off its feet. It flinches and loses the turn.`);
  if (t === 3) {
    if (fires('stand')) return lost(`The Slap! Burl slaps the water. ${name} turns to run... then turns back. The turn is gone.`);
    return { action, events: [cue('enemy', `Burl slaps the water. Every other Poliwhirl flinches. ${name} doesn't. Burl looks at his own hand.`, mon.uid)] };
  }
  return { action, events: [] };
}

/** True when the battle is a place the Poliwrath's return can happen: a Champion, an Evil Team leader, or a climax. */
export function pondReturnPlace(content: Content, run: RunState): boolean {
  const battle = run.battle;
  if (!battle || battle.kind !== 'trainer' || battle.event?.eventId.startsWith('pp-')) return false;
  const node = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
  if (node?.kind === 'champion' || battle.event?.eventId === 'format:climax') return true;
  const team = evilTeam(content, run);
  return !!team && battle.trainer?.name === team.ranks.leader.name;
}

const returnKind = (run: Pick<RunState, 'story'>): 'release' | 'reconcile' | null => (pondFlag(run, FLAGS.reconcile) > 0 ? 'reconcile' : pondFlag(run, FLAGS.release) > 0 ? 'release' : null);

/**
 * After a turn: clears the Poliwag's shyness once its first battle is over, ends the rematch as a loss if the Poliwag went down (it is a
 * duel), and runs the return. The return starts when the player is losing a Champion, Evil Team leader or climax fight, then the
 * allies fight beside the player for their turns (each hits with its own move at the end of the turn). Returns lines to show.
 */
export function pondAfterTurn(content: Content, run: RunState): Cue[] {
  const battle = run.battle;
  if (!battle) return [];
  const out: Cue[] = [];
  const mon = pondMon(run);
  if (battle.outcome && mon?.pond?.shy && battle.participants.includes(mon.uid)) mon.pond.shy = false;
  if (battle.eventRule?.pondDuel && mon && mon.hp <= 0 && !battle.outcome) battle.outcome = 'lose';
  if (battle.outcome || battle.kind !== 'trainer') return out;
  const kind = returnKind(run);
  const foe = battle.enemyTeam[battle.enemyIndex];
  if (!kind || !foe || foe.hp <= 0 || pondFlag(run, FLAGS.armed) < 1 || pondFlag(run, FLAGS.joined) > 0) return out;
  const cfg = POND_RETURN[kind];
  const mark = battle.storyEffects.find((e) => e.startsWith('pond-return:'));
  if (!mark) {
    const lead = run.party[battle.activeIndex];
    const standing = run.party.filter((m) => m.hp > 0).length;
    if (pondFlag(run, FLAGS.fired) > 0 || !lead || lead.hp <= 0 || standing > POND_RETURN.losingAt || standing === run.party.length || !pondReturnPlace(content, run)) return out;
    battle.storyEffects.push(`pond-return:${cfg.turns}`);
    setPondFlag(run, FLAGS.fired, 1);
    // The doc's name for it (`poli.returned`), for any other event that asks.
    setPondFlag(run, 'poli-returned', 1);
    out.push(cue('player', 'A cry from off the field. Your lead turns its head before you do.'));
    out.push(cue('player', 'A Poliwrath walks onto the field. It looks at you. It recognises you first.'));
    out.push(cue('player', `Behind it, ${cfg.poliwhirl === 4 ? 'four Poliwhirl, Burl among them' : 'three Poliwhirl'}. They take the field beside you, as allies.`));
  }
  const left = Number((battle.storyEffects.find((e) => e.startsWith('pond-return:')) ?? '').split(':')[1] ?? 0);
  if (left <= 0) return out;
  const foeName = nameOf(content, foe);
  const allies = pondAllies(content, run, kind);
  const wrath = pondAllyHit(content, battle, allies[0]!, foe);
  if (wrath) {
    foe.hp = Math.max(1, foe.hp - wrath.damage);
    out.push(cue('enemy', `Poliwrath uses ${wrath.move} on ${foeName}.`, foe.uid));
  }
  const whirl = pondAllyHit(content, battle, allies[1]!, foe);
  if (whirl) {
    foe.hp = Math.max(1, foe.hp - whirl.damage * cfg.poliwhirl);
    out.push(cue('enemy', `The ${cfg.poliwhirl === 4 ? 'four' : 'three'} Poliwhirl follow, one after another: ${whirl.move}.`, foe.uid));
  }
  if (left === 1) out.push(cue('player', 'The pond steps back to the edge of the field. The rest is yours.'));
  battle.storyEffects = battle.storyEffects.map((e) => (e.startsWith('pond-return:') ? `pond-return:${left - 1}` : e));
  return out;
}

/** The pond's allies at the return: a Poliwrath, then the Poliwhirl, all at the party's average level. Rebuilt the same every time (no RNG). */
export function pondAllies(content: Content, run: Pick<RunState, 'party' | 'story'>, kind: 'release' | 'reconcile'): PokemonInstance[] {
  const level = Math.max(1, run.party.length ? Math.round(run.party.reduce((n, m) => n + m.level, 0) / run.party.length) : 20);
  return ['poliwrath', ...Array.from({ length: POND_RETURN[kind].poliwhirl }, () => 'poliwhirl')].map((sp, i) => createPokemon(content, sp, level, `pond-ally-${i}`));
}

/** One ally's hit: its strongest damaging move against this foe, by the game's damage formula (no critical hit, a full roll). */
export function pondAllyHit(content: Content, battle: BattleState, ally: PokemonInstance, foe: PokemonInstance): { move: string; damage: number } | null {
  const mine = calcStats(content, ally);
  const theirs = calcStats(content, foe);
  const foeTypes = getSpecies(content, foe.speciesId).types;
  const best = ally.moves
    .map((m) => content.moves.get(m.id))
    .filter((m): m is NonNullable<typeof m> => !!m && m.category !== 'status' && (m.power ?? 0) > 0)
    .map((move) => {
      const physical = move.category === 'physical';
      const damage = calcDamage(content.ruleset, {
        level: ally.level, power: move.power ?? 0, attack: physical ? mine.atk : mine.spa, defense: physical ? theirs.def : theirs.spd, attackStage: 0,
        defenseStage: battle.enemyStages[physical ? 'def' : 'spd'] ?? 0, stab: getSpecies(content, ally.speciesId).types.includes(move.type),
        effectiveness: typeEffectiveness(content.typeChart, move.type, foeTypes), crit: false, burned: false, physical, randomFactor: 100,
      });
      return { move: move.name, id: move.id, damage };
    })
    .sort((a, b) => b.damage - a.damage || a.id.localeCompare(b.id))[0];
  return best && best.damage > 0 ? { move: best.move, damage: best.damage } : null;
}

/** Only ever the named abilities get a description; Kindness is data in abilities.json. */
export const hasKindness = (content: Content, mon: PokemonInstance): boolean => abilityOf(content, mon) === KINDNESS_ID;
