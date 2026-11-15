// Catalog Overhaul Pack, rival questlines R1 to R24 (QUESTLINES_RIVALS.md, RIVALS_PLACED.md): which questlines a run
// uses, when each beat is due, the rival slot (one rival beat per stage, two questlines active at once), and the
// text tokens that put the rival's name and their [by personality] lines into a scene.
// Pure: no random draw (picks are hashes of the run seed). State is story flags `ev:rq-*`, so there is no save change.
// Data: src/data/rivalQuests.json.

import { z } from 'zod';
import json from '../../data/rivalQuests.json';
import type { Content, EventBattle, EventCondition, EventEffect, TypeName } from '../contentSchema';
import type { PokemonInstance } from '../state';
import { typeEffectiveness } from '../battle/damage';
import { familyId } from '../mastery';
import { maxHp } from '../pokemon';
import { getCampaign } from '../regions';
import type { RunState } from '../state';
import { fnv1a } from '../story/moments';
import { stageFronts } from '../world';
import type { Rival } from '../story/schema';
import { BANK, BANK_CONTEXTS, type BankContext } from './bank';
import { featuredRival } from './living';
import { addMark, overhaulOf, type FeelingKey, type RivalOverhaulState } from './overhaul';

/** The catalog group of every rival questline event (the event screen shows the rival's standing beside them). */
export const RIVAL_QUEST_GROUP = 'Rival questline';

const BeatSchema = z.object({
  /** The event that plays this beat. */
  event: z.string(),
  /** A start beat: not before this stage of the run (the doc's "A3 or later"). */
  minStage: z.number().int().min(1).optional(),
  /** A later beat: the beat it follows, and how many stages after it (0: the same stage, opened as a room). */
  after: z.string().optional(),
  offset: z.number().int().min(0).default(0),
  /** A later beat held until this point: the last stage of the region the line started in, or of the next region. */
  when: z.enum(['regionEnd', 'nextRegionEnd', 'nextRegion', 'afterNextRegion']).optional(),
  /** With `regionEnd` / `nextRegionEnd`: only on that very stage (a missed promise is broken, not postponed). */
  strict: z.boolean().default(false),
  /** Not before this stage of its region (1 = the region's first stage). */
  stageIndex: z.number().int().min(1).optional(),
  /** Still due after the line's finale (an amends beat). */
  late: z.boolean().default(false),
  /** Uses the stage's one rival slot (short beats, texts and sightings do not). */
  slot: z.boolean().default(false),
  /** Playing it ends the questline. */
  final: z.boolean().default(false),
  /** RIVALS_PLACED.md, kept for the lead thread's placement engine: step, window, shape, level offset. */
  place: z.object({ step: z.number().int().optional(), window: z.tuple([z.number().int(), z.number().int()]).optional(), shape: z.string().optional(), level: z.string().optional(), badge: z.string().optional(), attach: z.string().optional(), hidden: z.boolean().optional() }).optional(),
});
const LineSchema = z.object({
  name: z.string(),
  /** Counts toward the run's budget and the two-active limit; false for lines that run beside anything or have their own trigger. */
  managed: z.boolean().default(true),
  /** Stages after its start when an unfinished line stops counting as active. */
  span: z.number().int().min(1).default(9),
  /** Only for rivals with one of these personalities (when not the arc's "Always" line). */
  personalities: z.array(z.string()).default([]),
  beats: z.record(z.string(), BeatSchema),
});
export const RivalQuestsSchema = z.object({
  note: z.string(),
  /** Engine arc id -> pack arc. */
  arcs: z.record(z.string(), z.string()),
  /** Pack arc -> its questlines (the table at the end of QUESTLINES_RIVALS.md). */
  table: z.record(z.string(), z.object({ always: z.array(z.string()), often: z.array(z.string()), sometimes: z.array(z.string()) })),
  /** Managed lines that may fill a run up to the minimum, in no order (the run seed orders them). */
  fill: z.array(z.string()),
  budget: z.object({ min: z.number().int(), max: z.number().int(), active: z.number().int() }),
  /** What the rival calls you (R24): the first name by personality, then by the newest mark that changes it. */
  names: z.object({ first: z.record(z.string(), z.string()), marks: z.record(z.string(), z.record(z.string(), z.string())) }),
  /** R4: the three names the player may suggest for the young Pokémon (flag `rq-r4-name` 1..3; 4 is "It'll tell you"). */
  youngNames: z.array(z.string()).length(3),
  /** R1: the chance (percent) the rival wins its simulated Circuit match each stage. */
  circuit: z.object({ rivalWinPct: z.number().int().min(0).max(100) }),
  /** R3: the handshake's bonus to every stat of both aces, in percent. */
  handshakePct: z.number().int().min(0).max(10),
  lines: z.record(z.string(), LineSchema),
});
export const QUESTS = RivalQuestsSchema.parse(json);
export type QuestBeat = z.infer<typeof BeatSchema>;

const flagOf = (run: Pick<RunState, 'story'>, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const setFlag = (run: Pick<RunState, 'story'>, key: string, value: number): void => {
  run.story.flags[`ev:${key}`] = value;
};
const beatFlag = (ref: string): string => `rq-${ref.toLowerCase().replace('.', '-')}`;

/** "R2.open" -> its line id, beat key and definition. */
export function beatOf(ref: string): { line: string; key: string; beat: QuestBeat } {
  const [line, key] = ref.split('.') as [string, string];
  const beat = QUESTS.lines[line]?.beats[key];
  if (!beat) throw new Error(`Unknown rival questline beat ${ref}`);
  return { line, key, beat };
}

/** The run's main rival: the one registered as `main`, else the featured rival. Locked for the run once registered. */
export function mainRival(run: Pick<RunState, 'story' | 'expansion'>): Rival | null {
  const live = run.story.rivals.filter((r) => r.state !== 'retired');
  return live.find((r) => run.expansion?.rival?.[r.id]?.role === 'main') ?? featuredRival(run);
}
/** The second rival (R11): the strongest other live rival, or null. */
export function secondRival(run: Pick<RunState, 'story' | 'expansion'>): Rival | null {
  const main = mainRival(run);
  const rest = run.story.rivals.filter((r) => r.state !== 'retired' && r.id !== main?.id);
  return [...rest].sort((a, b) => b.rivalPotential - a.rivalPotential || a.id.localeCompare(b.id))[0] ?? null;
}
const recOf = (run: RunState, rival: Rival | null): RivalOverhaulState | undefined => (rival ? overhaulOf(run, rival.id) : undefined);

/** The pack arc of the main rival ("race", "fall", ...), or null with no registered rival. */
export function packArc(run: RunState): string | null {
  const rec = recOf(run, mainRival(run));
  return rec ? QUESTS.arcs[rec.arc] ?? null : null;
}

/**
 * The managed questlines this run uses: the arc's Always line, its Often lines, its Sometimes line on a coin flip,
 * then seed-ordered fill lines up to the minimum; never more than the maximum. Lines for other personalities are left out
 * unless they are the arc's Always line.
 */
export function runQuestlines(run: RunState): string[] {
  const rec = recOf(run, mainRival(run));
  const arc = packArc(run);
  if (!rec || !arc) return [];
  const row = QUESTS.table[arc]!;
  const managed = (id: string): boolean => QUESTS.lines[id]?.managed === true;
  const fits = (id: string): boolean => {
    const p = QUESTS.lines[id]!.personalities;
    return p.length === 0 || p.includes(rec.personality);
  };
  const picks: string[] = [];
  const add = (id: string): void => {
    if (managed(id) && !picks.includes(id) && picks.length < QUESTS.budget.max) picks.push(id);
  };
  row.always.forEach(add);
  row.often.filter(fits).forEach(add);
  row.sometimes.filter(fits).filter((id) => fnv1a(`${run.seed}::rq-sometimes::${id}`) % 2 === 0).forEach(add);
  const fill = QUESTS.fill.filter(fits).sort((a, b) => fnv1a(`${run.seed}::rq-fill::${a}`) - fnv1a(`${run.seed}::rq-fill::${b}`) || a.localeCompare(b));
  for (const id of fill) if (picks.length < QUESTS.budget.min) add(id);
  return picks;
}

/** Whether the run uses this questline (unmanaged lines always run; their own triggers gate them). */
export function lineOn(run: RunState, line: string): boolean {
  const def = QUESTS.lines[line];
  if (!def) return false;
  return def.managed ? runQuestlines(run).includes(line) : true;
}

const stagesPerRegion = (content: Content, run: RunState): number => getCampaign(content, run.campaignId).stagesPerRegion;
const stageNow = (content: Content, run: RunState): number => run.regionIndex * stagesPerRegion(content, run) + (run.stage?.index ?? 0) + 1;

/** The stage a line started on (0: not started) and whether it is still running. */
export function lineState(content: Content, run: RunState, line: string): { started: number; over: boolean; active: boolean } {
  const started = flagOf(run, `rq-${line.toLowerCase()}-start`);
  const over = flagOf(run, `rq-${line.toLowerCase()}-end`) > 0 || (started > 0 && stageNow(content, run) > started + QUESTS.lines[line]!.span);
  return { started, over, active: started > 0 && !over };
}
/** Managed lines running now. */
export function activeLines(content: Content, run: RunState): string[] {
  return Object.keys(QUESTS.lines).filter((id) => QUESTS.lines[id]!.managed && lineState(content, run, id).active);
}
/** The stage a beat was played on (0: not yet). */
export const beatDoneAt = (run: Pick<RunState, 'story'>, ref: string): number => flagOf(run, beatFlag(ref));

/** Due by the schedule alone (the line is on, the stage is right, the beat before it was played), ignoring the rival slot. */
export function beatScheduled(content: Content, run: RunState, ref: string): boolean {
  const { line, beat } = beatOf(ref);
  if (!lineOn(run, line) || beatDoneAt(run, ref) > 0) return false;
  const now = stageNow(content, run);
  const st = lineState(content, run, line);
  if (st.over && !beat.late) return false;
  if (beat.stageIndex && (run.stage?.index ?? 0) + 1 < beat.stageIndex) return false;
  if (!beat.after) {
    if (now < (beat.minStage ?? 1)) return false;
    // A managed line starts only while fewer than two are running.
    return !QUESTS.lines[line]!.managed || st.started > 0 || activeLines(content, run).length < QUESTS.budget.active;
  }
  const prev = beatDoneAt(run, `${line}.${beat.after}`);
  if (prev === 0 || now < prev + beat.offset) return false;
  if (beat.when) {
    const per = stagesPerRegion(content, run);
    const startRegion = Math.floor((st.started - 1) / per);
    const region = beat.when === 'regionEnd' ? startRegion : startRegion + 1;
    if (beat.when === 'nextRegion') return run.regionIndex >= region;
    if (beat.when === 'afterNextRegion') return run.regionIndex > region;
    // The region's last stage, or (unless strict) any later stage if that one was missed.
    return beat.strict ? now === region * per + per : now >= region * per + per;
  }
  return true;
}

/** The one slot-using beat this stage may show: finales first, then the line that started earliest. Null once the slot was used. */
export function slotHolder(content: Content, run: RunState, holds: (eventId: string) => boolean = () => true): string | null {
  if (flagOf(run, 'rq-slot') === stageNow(content, run)) return null;
  const due: { ref: string; final: boolean; started: number }[] = [];
  for (const [line, def] of Object.entries(QUESTS.lines)) {
    for (const [key, beat] of Object.entries(def.beats)) {
      const ref = `${line}.${key}`;
      if (beat.slot && beatScheduled(content, run, ref) && holds(beat.event)) due.push({ ref, final: beat.final, started: lineState(content, run, line).started || 9999 });
    }
  }
  due.sort((a, b) => Number(b.final) - Number(a.final) || a.started - b.started || a.ref.localeCompare(b.ref));
  return due[0]?.ref ?? null;
}

type QuestCondition = Extract<EventCondition, { kind: 'rivalQuest' }>;
type QuestEffect = Extract<EventEffect, { kind: 'rivalQuest' }>;

/** The `rivalQuest` condition. `met` checks another condition of an event (used to see which due beats could really show). */
export function questConditionMet(content: Content, run: RunState, c: QuestCondition, met: (c: EventCondition) => boolean): boolean {
  const main = mainRival(run);
  const rec = recOf(run, main);
  if (!main || !rec) return false;
  if (c.personality && !c.personality.includes(rec.personality)) return false;
  if (c.arc && !c.arc.includes(packArc(run) ?? '')) return false;
  if (c.second !== undefined && (secondRival(run) !== null) !== c.second) return false;
  if (c.feeling) {
    const who = c.feeling.who === 'second' ? recOf(run, secondRival(run)) : rec;
    if (!who) return false;
    const v = who.feelings[c.feeling.key];
    if (v < (c.feeling.atLeast ?? 0) || v > (c.feeling.atMost ?? 10)) return false;
  }
  if (c.line && !lineOn(run, c.line)) return false;
  if (c.active !== undefined && (c.line ? lineState(content, run, c.line).active : activeLines(content, run).length > 0) !== c.active) return false;
  if (c.mark && !rec.marks.includes(c.mark)) return false;
  if (c.noMark && rec.marks.includes(c.noMark)) return false;
  if (c.stale && flagOf(run, c.stale) === stageNow(content, run)) return false;
  if (c.hpBelow !== undefined) {
    const max = run.party.reduce((n, m) => n + maxHp(content, m), 0);
    if (max === 0 || run.party.reduce((n, m) => n + m.hp, 0) / max >= c.hpBelow) return false;
  }
  if (c.weather && !stageFronts(content, run).some((f) => c.weather!.includes(f.weather))) return false;
  if (c.lastStage !== undefined && ((run.stage?.index ?? 0) + 1 >= stagesPerRegion(content, run)) !== c.lastStage) return false;
  if (c.circuit) {
    const board = circuitBoard(content, run);
    if (!board) return false;
    const gap = board.you - board.rival;
    if (c.circuit.rungNot === board.you || board.rival < (c.circuit.rivalRungAtLeast ?? 1)) return false;
    if (board.you < (c.circuit.rungAtLeast ?? 1) || board.you > (c.circuit.rungAtMost ?? 16) || gap < (c.circuit.gapAtLeast ?? -16) || gap > (c.circuit.gapAtMost ?? 16)) return false;
  }
  if (c.beat) {
    if (!beatScheduled(content, run, c.beat)) return false;
    const { beat } = beatOf(c.beat);
    if (beat.slot) {
      // The other conditions of a rival-slot event decide whether it could show; `rivalQuest` ones are the schedule itself.
      const holds = (eventId: string): boolean => (content.events.get(eventId)?.requires ?? []).every((r) => r.kind === 'rivalQuest' || met(r));
      if (slotHolder(content, run, holds) !== c.beat) return false;
    }
  }
  return true;
}

/** The `rivalQuest` effect: records a played beat (and the slot, the line's start and end), and moves the second rival's feelings. */
export function applyQuestEffect(content: Content, run: RunState, e: QuestEffect): string {
  const now = stageNow(content, run);
  let words = '';
  if (e.done) {
    const { line, beat } = beatOf(e.done);
    setFlag(run, beatFlag(e.done), now);
    if (flagOf(run, `rq-${line.toLowerCase()}-start`) === 0) setFlag(run, `rq-${line.toLowerCase()}-start`, now);
    if (beat.slot) setFlag(run, 'rq-slot', now);
    if (beat.final) setFlag(run, `rq-${line.toLowerCase()}-end`, now);
  }
  if (e.end) setFlag(run, `rq-${e.end.toLowerCase()}-end`, now);
  if (e.stamp) setFlag(run, e.stamp, now);
  if (e.set) setFlag(run, e.set.key, e.set.value);
  for (const id of e.again ?? []) if (run.itemCounters) delete run.itemCounters[`event-seen:${id}`];
  if (e.circuit === 'win') setFlag(run, 'circuit-rung', Math.min(CIRCUIT_RUNGS, flagOf(run, 'circuit-rung') + 1));
  else if (e.circuit) {
    if (flagOf(run, 'circuit-open-at') === 0) setFlag(run, 'circuit-open-at', now);
    if (e.circuit !== 'open') setFlag(run, 'circuit-rung', e.circuit === 'late' ? Math.max(1, circuitRivalRung(content, run) - 2) : 1);
  }
  if (e.lost) {
    // R4: the Pokémon the rival lost is one of their team that is not the ace (the same one every time the scene is read).
    const lost = lostFamily(content, run);
    if (lost) run.story.flags['rq:r4-lost'] = lost;
  }
  const target = e.who === 'second' ? recOf(run, secondRival(run)) : recOf(run, mainRival(run));
  if (target) {
    for (const [k, d] of Object.entries(e.feelings ?? {})) target.feelings[k as FeelingKey] = Math.min(10, Math.max(0, target.feelings[k as FeelingKey] + (d ?? 0)));
    if (e.mark) addMark(target, e.mark);
  }  if (e.handshake) {
    // R3: the handshake gives both aces +3% to every stat for the run (yours now; theirs whenever a questline fight builds their team).
    const ace = [...run.party].sort((x, y) => y.level - x.level)[0];
    if (ace && flagOf(run, 'rq-handshake') === 0) {
      ace.statBoosts = Object.fromEntries(STATS.map((k) => [k, (ace.statBoosts?.[k] ?? 0) + QUESTS.handshakePct])) as PokemonInstance['statBoosts'];
      setFlag(run, 'rq-handshake', 1);
      words = `${content.species.get(ace.speciesId)?.name ?? 'Your ace'}: every stat +${QUESTS.handshakePct}% for the run`;
    }
  }
  if (e.learn) {
    // R3 "Join in": your lead learns one move the rival's lead knows by level-up, if it can learn that move itself.
    const rival = featuredRival(run);
    const lead = run.party.find((m) => m.hp > 0);
    const theirs = content.species.get((rival?.memory?.lastBattle?.team ?? [])[0] ?? '');
    if (lead && theirs) {
      const mine = new Set([...(content.learnables.get(lead.speciesId) ?? []), ...(content.species.get(lead.speciesId)?.learnset ?? []).map((l) => l.move)]);
      const shared = theirs.learnset.map((l) => l.move).filter((id) => mine.has(id) && content.moves.has(id) && !lead.moves.some((m) => m.id === id));
      const id = shared[fnv1a(`${run.seed}::rq-learn::${lead.speciesId}`) % Math.max(1, shared.length)];
      const move = id ? content.moves.get(id) : undefined;
      if (move) {
        if (lead.moves.length < 4) lead.moves.push({ id: move.id, pp: move.pp });
        else lead.moves[3] = { id: move.id, pp: move.pp };
        words = `${content.species.get(lead.speciesId)?.name ?? lead.speciesId} learned ${move.name}!`;
      }
    }
  }
  return words;
}

/** R4: the family of the Pokémon the rival lost: fixed once the stone is found, before that the one it will be (a team member that is not their ace). */
export function lostFamily(content: Content, run: RunState): string | null {
  const fixed = run.story.flags['rq:r4-lost'];
  if (typeof fixed === 'string') return fixed;
  const rival = featuredRival(run);
  const roster = (rival?.memory?.lastBattle?.team ?? []).filter((id) => content.species.has(id) && familyId(content, id) !== rival?.ace);
  return roster.length > 0 ? familyId(content, roster[fnv1a(`${run.seed}::rq-r4-lost`) % roster.length]!) : null;
}

// ---------- text ----------

/** What the rival calls the player now (R24): by personality at first, then by the newest mark that changes it. */
export function calledName(content: Content, run: RunState): string {
  const rec = recOf(run, mainRival(run));
  const player = content.archetypes.get(run.archetypeId)?.name ?? 'you';
  if (!rec) return player;
  if (flagOf(run, 'rival-name-known') > 0) return player;
  const fill = (t: string): string => t.replaceAll('{player}', player).replaceAll('{short}', player.slice(0, Math.max(2, Math.ceil(player.length / 2))));
  for (const mark of [...rec.marks].reverse()) {
    const row = QUESTS.names.marks[mark];
    if (row) return fill(row[rec.personality] ?? row['*'] ?? player);
  }
  return fill(QUESTS.names.first[rec.personality] ?? 'you');
}

const CONTEXTS = new Set<string>(BANK_CONTEXTS);
const RUNG_WORDS = ['one', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'];

/**
 * Fills a scene's tokens. `{rival}` `{rival2}` `{player}` `{called}` (what the rival calls you) `{lead}` (your lead Pokémon)
 * `{young}` (R4's young Pokémon). `{say ctx||personality::line||personality::line}` is a [by personality] line: the rival's own
 * personality's line when the doc wrote one, else a line of that context from the dialogue bank (picked by a hash, so it is
 * the same every time the scene is read).
 */
export function questText(content: Content, run: RunState, eventId: string, text: string): string {
  if (!text.includes('{')) return text;
  const main = mainRival(run);
  const rec = recOf(run, main);
  const second = secondRival(run);
  const lead = run.party.find((p) => p.hp > 0) ?? run.party[0];
  const simple: Record<string, string> = {
    rival: main?.name ?? 'your rival',
    rival2: second?.name ?? 'the other rival',
    player: content.archetypes.get(run.archetypeId)?.name ?? 'you',
    called: calledName(content, run),
    lead: lead ? lead.care?.nickname || (content.species.get(lead.speciesId)?.name ?? 'your lead') : 'your lead',
    young: QUESTS.youngNames[flagOf(run, 'rq-r4-name') - 1] ?? 'the little one',
    rung: RUNG_WORDS[flagOf(run, 'circuit-rung')] ?? 'one',
    lost: content.species.get(lostFamily(content, run) ?? '')?.name ?? 'a name you cannot quite read',
  };
  let n = 0;
  return text.replace(/\{say ([a-z0-9]+)((?:\|\|[^{}]*)*)\}/g, (_m, ctx: string, rest: string) => {
    n += 1;
    const own = rest.split('||').filter(Boolean).map((p) => p.split('::') as [string, string]);
    const mine = own.find(([k]) => k === rec?.personality);
    if (mine) return mine[1];
    const lines = rec && CONTEXTS.has(ctx) ? (BANK.personalities[rec.personality] as unknown as Record<BankContext, string[]>)[ctx as BankContext] : undefined;
    if (lines?.length) return lines[fnv1a(`${run.seed}::rq-say::${eventId}::${n}`) % lines.length]!;
    return own[0]?.[1] ?? '';
  }).replace(/\{(rival|rival2|player|called|lead|young|lost|rung)\}/g, (_m, k: string) => simple[k]!);
}

// ---------- the pack's Marks (RIVAL_SYSTEM_OVERHAUL.md 3.3) ----------

export interface PackBattleFacts {
  rivalWon: boolean;
  /** The most rival Pokémon knocked out by one of yours, and the most of yours knocked out by one of theirs. */
  playerSweep: number;
  rivalSweep: number;
  /** HP share of the winner's last Pokémon when only one was left standing (else null). */
  winnerLastShare: number | null;
  /** The rival's ace fainted before any other of its Pokémon. */
  aceDownFirst: boolean;
  /** Knockouts scored by the losing side. */
  loserKos: number;
  /** You won and your highest-level Pokémon never fought. */
  heldBack: boolean;
}

const INSULTED = ['bitter-challenger', 'prodigy'];
const bump = (rec: RivalOverhaulState, k: FeelingKey, d: number): void => {
  rec.feelings[k] = Math.min(10, Math.max(0, rec.feelings[k] + d));
};

/** Leaves the battle's Marks on the rival (First Blood, Swept, By a Thread, Ace Down First, No Contest, You Held Back) and what each changes. */
export function recordPackMarks(content: Content, run: RunState, rivalId: string, f: PackBattleFacts): string[] {
  const rec = overhaulOf(run, rivalId);
  if (!rec) return [];
  const got: string[] = [];
  const give = (mark: string): void => {
    addMark(rec, mark);
    got.push(mark);
  };
  if (flagOf(run, `rq-fought-${rivalId}`) === 0) give('first-blood');
  setFlag(run, `rq-fought-${rivalId}`, flagOf(run, `rq-fought-${rivalId}`) + 1);
  if (f.playerSweep >= 4 || f.rivalSweep >= 4) give('swept');
  if (f.winnerLastShare !== null && f.winnerLastShare < 0.2) {
    give('by-a-thread');
    bump(rec, 'respect', 2);
    // One for the Road (R22) and the Promise (R3) open from a close battle.
    setFlag(run, 'rq-thread', flagOf(run, 'rq-thread') + 1);
    setFlag(run, 'rq-thread-won', f.rivalWon ? 0 : 1);
    openBeatHere(content, run, 'R3.open');
  }
  if (f.aceDownFirst) give('ace-down-first');
  if (f.loserKos === 0) {
    give('no-contest');
    // The loser knocked out nobody: a proud rival resents it (either way round); the others admire the winner.
    bump(rec, INSULTED.includes(rec.personality) || rec.personality === 'champion-chaser' ? 'resentment' : 'admiration', 1);
  }
  if (f.heldBack && !f.rivalWon) {
    give('you-held-back');
    if (INSULTED.includes(rec.personality)) bump(rec, 'resentment', 1);
    if (rec.personality === 'enthusiast') bump(rec, 'admiration', 1);
  }
  return got;
}

// ---------- the standing panel (New UI event screen) ----------

/** The main rival's standing for the event screen's side panel: what they call you, and Trust, Friendship and Respect. */
export function rivalStanding(content: Content, run: RunState): { rank: string; meters: { label: string; value: number; max: number }[] } | null {
  const main = mainRival(run);
  const rec = recOf(run, main);
  if (!main || !rec) return null;
  const lead = rec.lead > 0 ? `${main.name} is ${rec.lead} ahead` : rec.lead < 0 ? `You are ${-rec.lead} ahead` : 'Level with you';
  return { rank: lead, meters: [{ label: 'Trust', value: rec.feelings.trust, max: 10 }, { label: 'Friendship', value: rec.feelings.friendship, max: 10 }, { label: 'Respect', value: rec.feelings.respect, max: 10 }] };
}

// ---------- the Circuit (R1) ----------

export const CIRCUIT_RUNGS = 16;
/** The rival's rung: on rung 1 when the board opens, then one rung for each later stage whose simulated match they won. */
export function circuitRivalRung(content: Content, run: RunState): number {
  const open = flagOf(run, 'circuit-open-at');
  if (open === 0) return 1;
  let rung = 1;
  for (let s = open + 1; s <= stageNow(content, run); s++) if (fnv1a(`${run.seed}::circuit::${s}`) % 100 < QUESTS.circuit.rivalWinPct) rung += 1;
  return Math.min(CIRCUIT_RUNGS, rung);
}
/** The board for the map header: your rung and the rival's (null until the board has opened; `you` is 0 before you sign up). */
export function circuitBoard(content: Content, run: RunState): { you: number; rival: number } | null {
  if (flagOf(run, 'circuit-open-at') === 0 && flagOf(run, 'circuit-rung') === 0) return null;
  return { you: flagOf(run, 'circuit-rung'), rival: circuitRivalRung(content, run) };
}

// ---------- the rival's team in a questline fight ----------

type RivalPlan = NonNullable<Extract<EventBattle, { kind: 'trainer' }>['quest']>;
const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
const TYPE_NAMES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'] as const;

/** The rival's ace on a roster: the member of the ace's family, else the last (it is levelled highest). */
export function aceOf(content: Content, rival: Rival, roster: readonly string[]): string | undefined {
  return roster.find((id) => familyId(content, id) === rival.ace) ?? roster[roster.length - 1];
}
/** The Pokémon the rival lends for a tag battle beside them: their ace. */
export function rivalAllySpecies(content: Content, run: RunState): string | undefined {
  const rival = featuredRival(run);
  if (!rival) return undefined;
  const roster = (rival.memory?.lastBattle?.team ?? []).filter((id) => content.species.has(id));
  return rival.aceLog?.speciesId && content.species.has(rival.aceLog.speciesId) ? rival.aceLog.speciesId : aceOf(content, rival, roster);
}
/**
 * The rival's team for a questline fight. Entries are species ids, or `type:<type>` for a slot the caller fills with a
 * Pokémon of that type. `young`: R4's young Pokémon opens. `counter: 'lead'`: the first slot that is not the ace is aimed at
 * your lead's weakness. `aceFirst`: the ace opens. `full`: six Pokémon (missing slots take the types the team already has).
 */
export function planRivalTeam(content: Content, run: RunState, rival: Rival, roster: readonly string[], plan: RivalPlan, lead: PokemonInstance): string[] {
  let team = [...roster];
  const ace = aceOf(content, rival, team);
  if (plan.full) for (let i = 0; team.length < 6 && roster.length > 0; i++) team.splice(Math.max(0, team.length - 1), 0, `type:${content.species.get(roster[i % roster.length]!)!.types[0]}`);
  // R2's finale: no counter slot if you helped, one aimed at your lead if you walked past, the usual one otherwise.
  const counter = plan.counter === 'owed' ? (flagOf(run, 'rival-helped') > 0 ? 'none' : flagOf(run, 'rival-abandoned') > 0 ? 'lead' : 'seen') : plan.counter;
  if (counter === 'lead' || counter === 'seen') {
    // 'seen': a Pokémon of yours this rival has already fought (their ledger), never one they have not met.
    const known = overhaulOf(run, rival.id)?.ledger?.species ?? [];
    const target = counter === 'lead' ? lead : run.party.find((p) => known.includes(p.speciesId));
    const types = (target ? content.species.get(target.speciesId)?.types ?? [] : []) as TypeName[];
    const strong = TYPE_NAMES.filter((t) => typeEffectiveness(content.typeChart, t, types) > 1);
    const slot = team.findIndex((id) => id !== ace);
    if (target && strong.length > 0 && slot >= 0) team[slot] = `type:${strong[fnv1a(`${run.seed}::rq-counter::${rival.id}::${target.speciesId}`) % strong.length]}`;
  }
  if (plan.aceFirst && ace) team = [ace, ...team.filter((id) => id !== ace)];
  if (plan.guard) {
    // R4's cautious stage: their weakest Pokémon (lowest base stat total) is kept back behind everything else.
    const bst = (id: string): number => Object.values(content.species.get(id)?.baseStats ?? {}).reduce((n, v) => n + v, 0);
    const real = team.filter((id) => !id.startsWith('type:'));
    const weakest = [...real].sort((x, y) => bst(x) - bst(y) || x.localeCompare(y))[0];
    if (weakest && real.length > 1) team = [...team.filter((id) => id !== weakest), weakest];
  }
  const lost = run.story.flags['rq:r4-lost'];
  if (plan.young && typeof lost === 'string' && content.species.has(lost)) team = [lost, ...team.filter((id) => id.startsWith('type:') || familyId(content, id) !== lost)].slice(0, 6);
  return team;
}

/** After a questline fight's rival team is built: the handshake (R3) also lifts their ace. */
export function shapeRivalMons(content: Content, run: RunState, rival: Rival, team: PokemonInstance[]): void {
  if (flagOf(run, 'rq-handshake') === 0) return;
  const ace = team.find((m) => familyId(content, m.speciesId) === rival.ace) ?? team[team.length - 1];
  if (ace) ace.statBoosts = Object.fromEntries(STATS.map((k) => [k, (ace.statBoosts?.[k] ?? 0) + QUESTS.handshakePct])) as PokemonInstance['statBoosts'];
}

/** Opens a due beat's scene on the node the player is standing on (R3's promise comes straight after the close battle). */
export function openBeatHere(content: Content, run: RunState, ref: string): boolean {
  const { beat } = beatOf(ref);
  const stage = run.stage;
  const node = stage && stage.current !== null ? stage.map.nodes.find((n) => n.id === stage.current) : undefined;
  if (!node || !content.events.has(beat.event) || run.itemCounters?.[`event-seen:${beat.event}`] || !beatScheduled(content, run, ref)) return false;
  if (stage!.map.nodes.some((n) => n.sides.some((x) => x.eventId === beat.event && !x.used))) return false;
  node.sides.push({ id: `event-${node.sides.length + 1}-${node.id}`, kind: 'event', used: false, eventId: beat.event });
  return true;
}
