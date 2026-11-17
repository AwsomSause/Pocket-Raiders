// Greenneedle gn.45, The Champion's Training Session (doc GREENNEEDLE_REWORKED_PLACED_10.md lines 99–193).
// The region's Champion, off duty: a lesson (three of theirs at A−1, every decision explained), a montage (one of yours singled
// out: +10% to its lowest stat and Bond +1), and an optional exam (six at A+2). Passing it teaches the ace one of four exclusive
// moves; at the real Champion battle, that Champion opens with the move they taught. Pure rules: no RNG, no Phaser.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { calcStats, maxHp } from '../pokemon';
import { bondLevel, MAX_BOND_LEVEL } from '../co/who';
import { aceOf } from './frontier';

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

/** The four exclusive moves, one per Champion's style. */
export const LESSON_MOVES = { power: 'summit', patience: 'the-long-game', trust: 'with-you', reading: 'seen-it' } as const;
export type LessonMove = (typeof LESSON_MOVES)[keyof typeof LESSON_MOVES];
/** Marks the Pokémon the Champion taught the move to (the real Champion battle opens with it against this one). */
export const TAUGHT = 'lesson-taught';
/** Marks the Pokémon the Champion singled out. */
export const PUPIL = 'lesson-pupil';

/** The region's Champion: the one cast for this region if the League has been cast, else the region's own first Champion. */
export function lessonChampion(content: Content, run: RunState, region: string): string {
  const cast = run.roleCast.find((c) => c.role === 'champion' && c.regionIndex === run.regionIndex)?.id;
  const own = content.regions.get(region)?.champions.find((id) => content.bosses.has(id));
  return [cast, own, 'cynthia'].find((id): id is string => !!id && content.bosses.has(id))!;
}

/** Arrives: the Champion is cast (the lesson, the exam and the real Champion battle all read it). */
export function lessonArrive(content: Content, run: RunState, region: string): string {
  set(run, 'champ-lesson', 1);
  cast(run, 'lesson-champion', lessonChampion(content, run, region));
  return '';
}

/** gn rules `champlesson` (3, `A−1`) and `champexam` (6, `A+2`): the Champion's own signature team, at the levels the event set. */
export function lessonStart(content: Content, run: RunState, battle: BattleState, make: (speciesId: string, level: number, uid: string) => PokemonInstance): void {
  const id = castOf(run, 'lesson-champion');
  const boss = id ? content.bosses.get(id) : undefined;
  if (!boss) return;
  const sig = boss.signature.filter((s) => content.species.has(s));
  battle.enemyTeam = battle.enemyTeam.map((m, i) => (sig[i] ? make(sig[i]!, m.level, m.uid) : m));
  battle.enemyIndex = 0;
  if (battle.trainer) battle.trainer = { ...battle.trainer, name: boss.name, spriteBoss: boss.id };
}

// ---------- The lesson: the Champion's true lines, each once ----------
const LINE = {
  switch: 'It can take that hit. I don\'t want it to. Those aren\'t the same thing.',
  status: 'You\'re waiting for me to attack. So I won\'t.',
  stay: 'It asked to stay. Look at it. That\'s asking.',
  belt: 'You looked at your belt. Everyone looks at their belt.',
  good: 'That was good. I let you have it. Do you know why? ...No. Think about it tonight.',
} as const;
type Ev = { type: string; side?: string; moveId?: string | null; amount?: number };
const has = (b: BattleState, s: string): boolean => b.storyEffects.includes(s);
const count = (b: BattleState, prefix: string): number => b.storyEffects.filter((s) => s.startsWith(prefix)).length;

/** How the player fights, answered while the lesson runs (each once). */
const STYLE = {
  careful: 'You\'re careful with them. Be careful you\'re not careful *at* them.',
  trust: 'You trust it to stay standing. Does it know that\'s trust, and not forgetting?',
  fast: 'Yes. You can do that. So can a rockslide.',
} as const;
/** Turns without a switch before the Champion remarks on it; a win this quick is "fast". */
const NO_SWITCH_TURNS = 4;
const FAST_TURNS = 6;

/**
 * Each lesson turn: before the Champion's move, a true line about what they are doing (it is put in front of their move in the
 * turn's events; the same line is never said two turns running). The player's own style is answered as it shows. The lesson ends
 * once all three of theirs have been out.
 */
export function lessonTurn(content: Content, battle: BattleState, mine: PokemonInstance | undefined, events: Ev[], push: (text: string, at?: number) => void, hpOf: (m: PokemonInstance) => number): void {
  const name = battle.trainer?.name ?? 'The Champion';
  // Where the Champion's own action starts in this turn's events: their line goes just before it.
  const before = (): number | undefined => {
    const i = events.findIndex((e) => e.side === 'enemy' && (e.type === 'move' || e.type === 'switch'));
    return i >= 0 ? i : undefined;
  };
  const last = battle.storyEffects.find((s) => s.startsWith('lesson-last:'))?.slice('lesson-last:'.length);
  let saidNow = '';
  const say = (k: keyof typeof LINE): void => {
    if (saidNow || last === k) return;
    saidNow = k;
    if (!has(battle, `lesson-said:${k}`)) battle.storyEffects.push(`lesson-said:${k}`);
    push(`${name}: "${LINE[k]}"`, before());
  };
  const style = (k: keyof typeof STYLE): void => {
    if (battle.storyEffects.some((s) => s.startsWith('lesson-style:'))) return;
    battle.storyEffects.push(`lesson-style:${k}`);
    push(`${name}: "${STYLE[k]}"`);
  };
  const first = !has(battle, 'lesson-t1');
  if (first) battle.storyEffects.push('lesson-t1');
  const foe = battle.enemyTeam[battle.enemyIndex];
  // They switched out.
  const sw = count(battle, 'lesson-sw');
  if (battle.enemySwitches > sw) {
    for (let i = sw; i < battle.enemySwitches; i++) battle.storyEffects.push('lesson-sw');
    say('switch');
  }
  // A status move on turn one.
  if (first && events.some((e) => e.type === 'move' && e.side === 'enemy' && content.moves.get(e.moveId ?? '')?.category === 'status')) say('status');
  // You switched, and they hit the one coming in.
  const was = battle.storyEffects.find((s) => s.startsWith('lesson-me:'));
  if (mine && was && was !== `lesson-me:${mine.uid}`) {
    battle.storyEffects.push('lesson-pswitch');
    if (events.some((e) => e.type === 'damage' && e.side === 'player')) say('belt');
  }
  battle.storyEffects = battle.storyEffects.filter((s) => !s.startsWith('lesson-me:') && !s.startsWith('lesson-last:'));
  if (mine) battle.storyEffects.push(`lesson-me:${mine.uid}`);
  // A big hit, let through.
  if (foe && events.some((e) => e.type === 'damage' && e.side === 'enemy' && (e.amount ?? 0) * 5 >= hpOf(foe) * 2)) say('good');
  // Hurt, and left in anyway.
  if (foe && foe.hp > 0 && foe.hp * 2 < hpOf(foe) && has(battle, `lesson-out:${foe.uid}`) && events.some((e) => e.type === 'move' && e.side === 'enemy')) say('stay');
  if (saidNow) battle.storyEffects.push(`lesson-last:${saidNow}`);
  // The player's own choices are answered, too.
  const switches = count(battle, 'lesson-pswitch');
  const down = battle.enemyTeam.filter((m) => m.hp <= 0).length;
  if (switches >= 3) style('careful');
  else if (down >= 2 && battle.turn <= FAST_TURNS) style('fast');
  else if (switches === 0 && battle.turn >= NO_SWITCH_TURNS) style('trust');
  // All three have been out: the turn after the last one came out, the lesson is over.
  const total = Math.min(3, battle.enemyTeam.length);
  if (has(battle, 'lesson-all')) {
    battle.outcome = 'win';
    push(`${name} calls their Pokémon back. "That's enough. That's the lesson."`);
    return;
  }
  if (foe && !has(battle, `lesson-out:${foe.uid}`)) battle.storyEffects.push(`lesson-out:${foe.uid}`);
  if (count(battle, 'lesson-out:') >= total) battle.storyEffects.push('lesson-all');
}

/** After the lesson, win or lose: the Champion answers how you fought, and singles one of yours out. */
export function lessonEnd(content: Content, run: RunState): string {
  const b = run.battle;
  // The Champion answers how you fought during the lesson; if nothing was said then, it is said now.
  const answered = !!b && b.storyEffects.some((s) => s.startsWith('lesson-style:'));
  const switches = b ? count(b, 'lesson-pswitch') : 0;
  const fast = !!b && b.enemyTeam.every((m) => m.hp <= 0) && b.turn <= FAST_TURNS;
  const line = answered ? '' : fast ? STYLE.fast : switches >= 3 ? STYLE.careful : switches === 0 ? STYLE.trust : '';
  const pupil = lessonPupil(content, run);
  for (const m of [...run.party, ...run.box]) m.gn = (m.gn ?? []).filter((t) => t !== PUPIL);
  if (pupil) {
    pupil.gn = [...(pupil.gn ?? []), PUPIL];
    cast(run, 'lesson-pupil', pupil.speciesId);
  }
  set(run, 'lesson-why', !pupil ? 0 : pupil === byBond(content, run) ? 1 : pupil === byFaints(run) ? 2 : 3);
  return line ? `"${line}"` : '';
}

const battles = (run: RunState, m: PokemonInstance): number => run.story.histories[m.uid]?.battles ?? 0;
/** 1. The highest Bond (a Bond level of 1 or more) that has fought the least. */
function byBond(content: Content, run: RunState): PokemonInstance | undefined {
  const bonded = run.party.filter((m) => bondLevel(content, m) >= 1);
  return bonded.reduce<PokemonInstance | undefined>((a, m) => {
    if (!a) return m;
    const d = bondLevel(content, m) - bondLevel(content, a);
    return d > 0 || (d === 0 && battles(run, m) < battles(run, a)) ? m : a;
  }, undefined);
}
/** 2. The one that has fainted most this run. */
function byFaints(run: RunState): PokemonInstance | undefined {
  return run.party.reduce<PokemonInstance | undefined>((a, m) => {
    const n = run.story.histories[m.uid]?.knockoutsTaken ?? 0;
    return n > 0 && (!a || n > (run.story.histories[a.uid]?.knockoutsTaken ?? 0)) ? m : a;
  }, undefined);
}
/** Not the strongest: the highest Bond that has fought least, else the one fainted most, else the newest. */
export function lessonPupil(content: Content, run: RunState): PokemonInstance | undefined {
  return byBond(content, run) ?? byFaints(run) ?? run.party[run.party.length - 1];
}

/** The montage's bonus: +10% to its lowest stat, permanently, and Bond +1. */
export function lessonBonus(content: Content, run: RunState): string {
  const mon = run.party.find((m) => m.gn?.includes(PUPIL));
  if (!mon) return '';
  const stats = calcStats(content, mon);
  const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
  const low = keys.reduce((a, k) => (stats[k] < stats[a] ? k : a), 'hp' as (typeof keys)[number]);
  mon.eventBoosts = { ...mon.eventBoosts, [low]: (mon.eventBoosts?.[low] ?? 0) + 10 };
  mon.friendship = Math.min(content.balance.friendship.max, mon.friendship + 5);
  const NAMES = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' } as const;
  const name = mon.care?.nickname || (content.species.get(mon.speciesId)?.name ?? mon.speciesId);
  return `${name}'s ${NAMES[low]} rose by 10%, for good. Bond +1.`;
}

/** The move the Champion picks for the ace: the one that suits how it actually fights. */
export function lessonMoveFor(content: Content, mon: PokemonInstance): LessonMove {
  if (bondLevel(content, mon) >= 4) return LESSON_MOVES.trust;
  const s = calcStats(content, mon);
  if (s.spe >= Math.max(s.atk, s.spa, s.def, s.spd, s.hp)) return LESSON_MOVES.reading;
  if (s.def + s.spd + s.hp >= (s.atk + s.spa) * 1.5) return LESSON_MOVES.patience;
  return LESSON_MOVES.power;
}

/** Passed the exam: the ace learns the move (a full moveset gives up its weakest move). */
export function lessonTeach(content: Content, run: RunState): string {
  const ace = aceOf(run);
  if (!ace) return '';
  const id = lessonMoveFor(content, ace);
  const move = content.moves.get(id);
  if (!move) return '';
  set(run, 'champ-exam-passed', 1);
  cast(run, 'lesson-move', id);
  cast(run, 'lesson-ace', ace.speciesId);
  for (const m of [...run.party, ...run.box]) m.gn = (m.gn ?? []).filter((t) => t !== TAUGHT);
  ace.gn = [...(ace.gn ?? []), TAUGHT];
  if (!ace.moves.some((m) => m.id === id)) {
    const slot = { id, pp: move.pp };
    if (ace.moves.length < 4) ace.moves.push(slot);
    else {
      const weakest = ace.moves.reduce((a, m, i) => ((content.moves.get(m.id)?.power ?? 0) < (content.moves.get(ace.moves[a]!.id)?.power ?? 0) ? i : a), 0);
      ace.moves[weakest] = slot;
    }
  }
  const name = ace.care?.nickname || (content.species.get(ace.speciesId)?.name ?? ace.speciesId);
  return `${name} learned ${move.name}!`;
}

/** Afterstory: at the real Champion battle, the Champion who taught the move opens with it. Returns the line, or ''. */
export function lessonAfterstory(content: Content, run: RunState): string {
  const battle = run.battle;
  const id = castOf(run, 'lesson-move');
  const lead = battle?.enemyTeam[battle.enemyIndex];
  if (!battle || !lead || !id || f(run, 'champ-exam-passed') <= 0 || battle.eventRule) return '';
  if (!battle.trainer?.leaderId || battle.trainer.leaderId !== castOf(run, 'lesson-champion')) return '';
  if (run.stage?.kind !== 'league' || run.stage.leaderId !== battle.trainer.leaderId) return '';
  const move = content.moves.get(id);
  if (!move) return '';
  // Against the Pokémon they taught it to: if it is in the party, the Champion waits for it; if it isn't, whoever is out gets it.
  const taught = run.party.find((m) => m.gn?.includes(TAUGHT) && m.hp > 0);
  const out = run.party[battle.activeIndex];
  if (!taught || taught === out) {
    giveMove(lead, id, move.pp);
    (battle.lesson ??= {}).foeMove = id;
  } else battle.storyEffects.push(`${OPEN}${id}:${taught.uid}`);
  return `${battle.trainer.name}: "Let's see if it took."`;
}
const OPEN = 'lesson-open:';
const giveMove = (mon: PokemonInstance, id: string, pp: number): void => {
  if (mon.moves.some((m) => m.id === id)) return;
  if (mon.moves.length < 4) mon.moves.push({ id, pp });
  else mon.moves[0] = { id, pp };
};
/** The Champion was waiting for the Pokémon they taught: the first turn it is out, their Pokémon uses the move (its index), else -1. */
export function lessonOpens(content: Content, battle: BattleState, enemy: PokemonInstance, mine: PokemonInstance | undefined): number {
  const tag = battle.storyEffects.find((s) => s.startsWith(OPEN));
  if (!tag || !mine || enemy.hp <= 0) return -1;
  const [id, uid] = tag.slice(OPEN.length).split(':');
  const move = content.moves.get(id ?? '');
  if (!move || mine.uid !== uid) return -1;
  battle.storyEffects = battle.storyEffects.filter((s) => s !== tag);
  giveMove(enemy, move.id, move.pp);
  return enemy.moves.findIndex((m) => m.id === move.id && m.pp > 0);
}

// ---------- The four moves (the engine calls these by the move's `champMove` effect) ----------
const used = (battle: BattleState, uid: string): boolean => battle.storyEffects.includes(`champ-move:${uid}`);
const spend = (battle: BattleState, uid: string): void => {
  battle.storyEffects.push(`champ-move:${uid}`);
};

/** Summit: at full HP it can't miss. Once per battle, where it matters: true (and spent) only when it saves a miss. */
export function summitSaves(content: Content, battle: BattleState, mon: PokemonInstance, kind: string | undefined): boolean {
  if (kind !== 'summit' || used(battle, mon.uid) || mon.hp < maxHp(content, mon)) return false;
  spend(battle, mon.uid);
  return true;
}

/** The Long Game: +10 power for each turn on the field, to +40. With You: 85 power up to Friendly, 100 at maximum Bond. */
export function champPower(content: Content, mon: PokemonInstance, kind: string | undefined, power: number, turnsOut: number): number {
  if (kind === 'the-long-game') return power + Math.min(40, 10 * Math.max(0, turnsOut));
  if (kind === 'with-you') {
    const lv = bondLevel(content, mon);
    return lv >= MAX_BOND_LEVEL ? 100 : lv >= 4 ? 92 : power;
  }
  return power;
}

/** Seen It: it goes first if the target has only just come in. Once per battle: spent when it goes first that way. */
export function seenItFirst(battle: BattleState, mon: PokemonInstance, kind: string | undefined, foeTurnsOut: number): boolean {
  return kind === 'seen-it' && foeTurnsOut === 0 && !used(battle, mon.uid);
}
export function seenItSpend(battle: BattleState, mon: PokemonInstance, kind: string | undefined, foeTurnsOut: number): void {
  if (seenItFirst(battle, mon, kind, foeTurnsOut)) spend(battle, mon.uid);
}
