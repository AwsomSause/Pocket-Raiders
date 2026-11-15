// Poli-Pond, "The Little Pokémon That Could" (Beta 0.7 miniature episode, companion story, region-wide story).
// A shy Poliwag is shoved out of the reeds and joins the party. It cannot attack in its first battle, then it is taught three lessons
// (aim, footing, standing its ground) at the rests. Each lesson it has not learned is a nerve (in a normal battle) or one of the lead
// bully's tricks (in the rematch). The ending is Keep (Kindness), Release (it comes back as Poliwrath with allies) or Reconcile.
// No RNG anywhere: every effect is a fixed rule, so previews, saves and replays agree. State: story flags (`ev:pp-*`) and one optional
// mark on the Poliwag itself, so there is no save version change. Pure functions; run.ts and events.ts call them at their hook points.

import { z } from 'zod';
import type { Content } from '../contentSchema';
import { abilityOf, maxHp } from '../pokemon';
import type { PlayerAction } from '../battle/engine';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { evilTeam } from '../evil/teams';

export const LESSONS = ['aim', 'footing', 'stand'] as const;
export type PondLesson = (typeof LESSONS)[number];

/** Kindness: how many times a battle the bearer's switch-out hands the next Pokémon +1 priority. */
export const KINDNESS_USES = 2;
export const KINDNESS_ID = 'kindness';

/** The mark on the Poliwag (and on whatever it grows into). `shy`: it will not attack until its first battle is over. The three lessons are `true` once taught. */
export const PondMarkSchema = z.object({ shy: z.boolean(), aim: z.boolean(), footing: z.boolean(), stand: z.boolean(), kept: z.boolean().default(false) });
export type PondMark = z.infer<typeof PondMarkSchema>;

/** The return (Release or Reconcile): Poliwrath plus this many Poliwhirl take the field for this many turns. Their hits never finish the foe (that is yours). */
export const POND_RETURN = {
  release: { poliwhirl: 3, turns: 3 },
  reconcile: { poliwhirl: 4, turns: 4 },
  /** Share of the foe's full HP each one takes off at the end of a turn. */
  wrathShare: 0.08,
  whirlShare: 0.03,
  /** The player is "losing" when the Pokémon in front is under this share of its HP. */
  losingBelow: 0.4,
} as const;

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

/** Lesson counters after one lesson: how many were taught, and how many on the first retry; all three on the first retry is Exceptional. */
export function recordLesson(run: Pick<RunState, 'story' | 'party'>, lesson: PondLesson, firstTry: boolean): void {
  const mon = pondMon(run);
  if (mon?.pond) mon.pond[lesson] = true;
  if (pondFlag(run, `pp-lesson-${lesson}`) > 0) return;
  setPondFlag(run, `pp-lesson-${lesson}`, firstTry ? 2 : 1);
  setPondFlag(run, FLAGS.lessons, pondFlag(run, FLAGS.lessons) + 1);
  if (firstTry) setPondFlag(run, FLAGS.firstTry, pondFlag(run, FLAGS.firstTry) + 1);
  if (pondFlag(run, FLAGS.lessons) >= LESSONS.length && pondFlag(run, FLAGS.firstTry) >= LESSONS.length) setPondFlag(run, FLAGS.exceptional, 1);
}

export const lessonsTaught = (run: Pick<RunState, 'story'>): number => pondFlag(run, FLAGS.lessons);

type Cue = { type: 'spectacle'; kind: 'arena'; side: 'player' | 'enemy'; text: string; uid?: string };
const cue = (side: 'player' | 'enemy', text: string, uid?: string): Cue => ({ type: 'spectacle', kind: 'arena', side, text, ...(uid ? { uid } : {}) });

const nameOf = (content: Content, mon: PokemonInstance): string => content.species.get(mon.speciesId)?.name ?? mon.speciesId;

/** Which fight it is: the rematch (the bully's tricks) or any other (the Poliwag's own nerves). */
const inRematch = (battle: BattleState): boolean => battle.event?.eventId.startsWith('pp-rematch') === true;

/**
 * Before the player's command is played: the Poliwag's nerves (or, in the rematch, the lead bully's tricks). Each is a fixed rule and each
 * lesson cancels one of them. Returns the action to play and the lines to show first. Never touches the RNG.
 *  - shy: it will not attack in its first battle; it looks at the ground.
 *  - aim (not taught): every third turn its attack wobbles wide.
 *  - footing (not taught): the first turn after it comes out, it flinches.
 *  - stand (not taught): under half its HP it tries to run, once per battle (it steps back for a teammate when there is one).
 */
export function pondShape(content: Content, run: RunState, action: PlayerAction): { action: PlayerAction; events: Cue[] } {
  const battle = run.battle;
  const mon = battle ? run.party[battle.activeIndex] : undefined;
  const mark = mon?.pond;
  if (!battle || !mon || !mark || mark.kept || action.kind !== 'move' || battle.needsSwitch) return { action, events: [] };
  const name = nameOf(content, mon);
  const rematch = inRematch(battle);
  const say = (own: string, bully: string): { action: PlayerAction; events: Cue[] } => ({ action: { kind: 'idle' }, events: [cue('player', rematch ? bully : own, mon.uid)] });
  if (mark.shy && !rematch) return say(`${name} looks at the ground. It is not ready to hurt anyone yet.`, '');
  if (!mark.aim && battle.turn % 3 === 0) return say(`${name} swings and the attack wobbles wide. It was aiming at nothing.`, `The bully weaves and grins. ${name}'s attack goes wide: it never learned to aim.`);
  if (!mark.footing && battle.playerVolatile.turnsOut === 0) return say(`${name} flinches as it steps out, and loses the turn.`, `The bully shoves ${name} on the way in. It stumbles and flinches: it never found its footing.`);
  const bench = run.party.findIndex((m, i) => i !== battle.activeIndex && m.hp > 0 && !m.pond);
  if (!mark.stand && mon.hp * 2 < maxHp(content, mon) && !battle.storyEffects.includes(`pond-ran:${mon.uid}`)) {
    battle.storyEffects.push(`pond-ran:${mon.uid}`);
    if (bench >= 0 && !rematch && !battle.eventRule?.noSwitch) return { action: { kind: 'switch', partyIndex: bench }, events: [cue('player', `${name} panics and tries to run! Someone else steps up.`, mon.uid)] };
    return say(`${name} backs away from the fight, shaking. It almost ran.`, `The bully stares ${name} down. It freezes and almost runs: it never learned to stand its ground.`);
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
 * allies strike at the end of each of their turns; they never knock the foe out. Returns lines to show.
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
    if (pondFlag(run, FLAGS.fired) > 0 || !lead || lead.hp <= 0 || lead.hp < 1 || lead.hp >= maxHp(content, lead) * POND_RETURN.losingBelow || !pondReturnPlace(content, run)) return out;
    battle.storyEffects.push(`pond-return:${cfg.turns}`);
    setPondFlag(run, FLAGS.fired, 1);
    out.push(cue('player', 'A cry comes from somewhere off the field. Small. Familiar. It knows you before you know it.'));
    out.push(cue('player', `${cfg.poliwhirl + 1} shapes break the reeds of the arena: a Poliwrath, and ${cfg.poliwhirl} Poliwhirl behind it. They have come to stand with you.`));
  }
  const left = Number((battle.storyEffects.find((e) => e.startsWith('pond-return:')) ?? '').split(':')[1] ?? 0);
  if (left <= 0) return out;
  const share = POND_RETURN.wrathShare + cfg.poliwhirl * POND_RETURN.whirlShare;
  const hit = Math.min(foe.hp - 1, Math.max(0, Math.round(maxHp(content, foe) * share)));
  if (hit > 0) foe.hp -= hit;
  out.push(cue('enemy', left === 1 ? `The pond's last turn: they hit ${nameOf(content, foe)} together, and step back. The rest is yours.` : `The pond answers: Poliwrath and its Poliwhirl hit ${nameOf(content, foe)} together.`, foe.uid));
  battle.storyEffects = battle.storyEffects.map((e) => (e.startsWith('pond-return:') ? `pond-return:${left - 1}` : e));
  return out;
}

/** Only ever the named abilities get a description; Kindness is data in abilities.json. */
export const hasKindness = (content: Content, mon: PokemonInstance): boolean => abilityOf(content, mon) === KINDNESS_ID;
