// Evil Mode's day as a machine (design Part 30 section 6). `step(block, action) -> { block, cues }`, pure.
// Six beats; each has one action that ends it. Slice 2 adds queueJob/clearJob inside Dispatch, fixes odds at Send and
// rolls the jobs on the way into the Evening. An action that doesn't fit changes nothing.
// Cues are what a screen may show (ids and values). Throwing them away leaves the state correct.

import { answerRefusal, askAnyway, clearJob, fixOdds, queueJob, resolveEvening, type RefusalAnswer } from './dispatch';
import { arriveApplicants, askQuestion, hire, leaveAtZero, letGo, promote, turnAway } from './roster';
import type { JobDraft } from './odds';
import { askAbout, setRate } from './ledger';
import { holdResult, post, takeBadge, unpost, walkHero } from './hero';
import { answerKnock, drawKnock, nightAction, takeDown, type NightAction } from './night';
import { heartsGo, moveLine } from './line';
import { BEATS, type Beat, type EvilModeBlock, type LineId, type Question } from './schema';

/** The action that ends each beat in slice 1 (the empty day). Later slices add more actions inside a beat. */
export const BEAT_END: Record<Beat, BeatEndType> = {
  morning: 'dismissOvernight',
  dispatch: 'send',
  inPerson: 'stayIn',
  evening: 'callItADay',
  night: 'lightsOut',
  hero: 'watchRoad',
};

export type BeatEndType = 'dismissOvernight' | 'send' | 'stayIn' | 'callItADay' | 'lightsOut' | 'watchRoad';

export type EvilAction =
  | { type: 'queueJob'; job: JobDraft }
  /** Slice 3: CONFIRM on the Honest Card. The same as queueJob: every queued job files its Card. */
  | { type: 'confirmCard'; job: JobDraft }
  | { type: 'waive'; holdingId: string }
  | { type: 'halve'; holdingId: string }
  | { type: 'askAbout'; holdingId: string }
  | { type: 'clearJob'; holdingId: string }
  /** Slice 4: an order across a line, and the Boss's answer in the yard. */
  | { type: 'askAnyway'; job: JobDraft }
  | { type: 'answerRefusal'; answer: RefusalAnswer }
  /** Slice 4: the notice board and the Office. */
  | { type: 'hire'; ref: string }
  | { type: 'question'; ref: string; q: Question }
  | { type: 'turnAway'; ref: string; rude: boolean }
  | { type: 'promote'; id: string; answer: number }
  | { type: 'letGo'; id: string; kindly: boolean }
  /** Slice 5: Hold (post somebody at a holding the Hero's about to reach), going in person, and a battle's result. */
  | { type: 'post'; holdingId: string; id: string }
  | { type: 'unpost'; holdingId: string }
  | { type: 'goYourself'; holdingId: string }
  | { type: 'battleResult'; won: boolean; fielded?: string[] }
  /** Slice 7: the door (0..2 an answer, 3 "(Not tonight.)"), the Night's one action, and taking something off the Wall. */
  | { type: 'answerKnock'; answer: number }
  | { type: 'nightAction'; action: NightAction; id?: string }
  | { type: 'takeDown'; index: number }
  /** Slice 6: move the Line, once a region, at Night (Part 3 section 7.1). */
  | { type: 'moveLine'; to: LineId }
  | { type: 'dismissOvernight' }
  | { type: 'send' }
  | { type: 'stayIn' }
  | { type: 'callItADay' }
  | { type: 'lightsOut' }
  | { type: 'watchRoad' };

export type EvilCue = { id: 'beat'; beat: Beat } | { id: 'newDay'; day: number } | { id: 'refused'; reason: string } | { id: 'queued'; holdingId: string } | { id: 'districtEnd'; how: 'held' | 'taken' } | { id: 'filed'; text: string } | { id: 'asked'; line: string } | { id: 'said'; line: string } | { id: 'refusal' } | { id: 'fight' } | { id: 'road'; lines: string[] } | { id: 'knock'; n: number } | { id: 'moved'; line: string };

export interface StepResult {
  block: EvilModeBlock;
  cues: EvilCue[];
  /** False when the action didn't fit the beat: the block is returned unchanged. */
  ok: boolean;
}

/** The beat after this one; after the Hero comes the next day's Morning. */
export const nextBeat = (beat: Beat): Beat => BEATS[(BEATS.indexOf(beat) + 1) % BEATS.length]!;

/** One action. The input block is never changed; a new one is returned. */
export function step(block0: EvilModeBlock, action: EvilAction): StepResult {
  let block = block0;
  const { beat } = block.here;
  const no = (reason: string): StepResult => ({ block: block0, cues: [{ id: 'refused', reason }], ok: false });
  if (block.district?.end) return no("The district's over.");
  // Slice 5: a battle the day's waiting on comes first; only its result moves anything.
  if (action.type === 'battleResult') {
    const f = block.fight;
    if (!f) return no('No battle is waiting.');
    if (f.kind === 'hold') {
      const r = holdResult(block, action.won, action.fielded ?? []);
      return { block: endIfTaken(r.block), cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
    }
    const queue = block.queue.map((j) => (j.holdingId === f.holdingId && j.method === 'outplay' ? { ...j, played: action.won ? ('won' as const) : ('lost' as const) } : j));
    return { block: { ...block, queue, fight: null }, cues: [{ id: 'said', line: action.won ? 'Won fairly. It holds, from this Evening.' : 'Lost. The party is healed; nothing ends.' }], ok: true };
  }
  if (block.fight) return no('A battle is waiting.');
  if (action.type === 'post' || action.type === 'unpost') {
    if (beat !== 'dispatch') return no(`${action.type} does nothing at ${beat}`);
    if (action.type === 'unpost') return { block: unpost(block, action.holdingId), cues: [], ok: true };
    const r = post(block, action.holdingId, action.id);
    return r.problem ? no(r.problem) : { block: r.block, cues: [], ok: true };
  }
  if (action.type === 'goYourself') {
    if (beat !== 'inPerson') return no(`goYourself does nothing at ${beat}`);
    if (block.inPerson?.day === block.here.day) return no('The Boss has already been out today.');
    const j = block.queue.find((x) => x.holdingId === action.holdingId);
    if (!j) return no('Nothing is queued there today.');
    if (j.method !== 'outplay') return no('In person, only an Outplay is played yet. The rest come with a later build.');
    return { block: { ...block, inPerson: { day: block.here.day, holdingId: j.holdingId }, fight: { kind: 'outplay', holdingId: j.holdingId, begun: false } }, cues: [{ id: 'fight' }], ok: true };
  }
  // Slice 5: watching the road walks the Hero first; a fight on the way stops the walk, and the beat waits on it.
  if (action.type === 'watchRoad' && beat === 'hero' && block.hero && block.hero.walked !== block.here.day) {
    const walked = endIfTaken(walkHero(block));
    if (walked.fight) return { block: walked, cues: [{ id: 'road', lines: walked.hero!.today }, { id: 'fight' }], ok: true };
    if (walked.district?.end) return { block: walked, cues: [{ id: 'road', lines: walked.hero!.today }, { id: 'districtEnd', how: walked.district.end.how }], ok: true };
    block = walked;
  }
  // Slice 6: the Line moves at Night, once a region. Refused here, not only on screen.
  if (action.type === 'moveLine') {
    const r = moveLine(block, action.to);
    return r.problem ? no(r.problem) : { block: r.block, cues: [{ id: 'said', line: r.line }], ok: true };
  }
  // Slice 4: the notice board and the Office, at any beat.
  if (action.type === 'hire' || action.type === 'question' || action.type === 'turnAway' || action.type === 'promote' || action.type === 'letGo') {
    const r = action.type === 'hire' ? hire(block, action.ref) : action.type === 'question' ? askQuestion(block, action.ref, action.q) : action.type === 'turnAway' ? turnAway(block, action.ref, action.rude) : action.type === 'promote' ? promote(block, action.id, action.answer) : letGo(block, action.id, action.kindly);
    return r.problem ? no(r.problem) : { block: r.block, cues: [{ id: 'said', line: r.line }], ok: true };
  }
  // An order across a line waits on its answer: nothing else in Dispatch moves until the Boss answers.
  if (action.type === 'answerRefusal') {
    const r = answerRefusal(block, action.answer);
    return r.problem ? no(r.problem) : { block: r.block, cues: [{ id: 'said', line: r.line }], ok: true };
  }
  if (block.refusal && (action.type === 'queueJob' || action.type === 'confirmCard' || action.type === 'clearJob' || action.type === 'askAnyway' || action.type === 'send')) return no('Somebody is waiting on an answer in the yard.');
  if (action.type === 'askAnyway') {
    if (beat !== 'dispatch') return no(`askAnyway does nothing at ${beat}`);
    const r = askAnyway(block, action.job);
    return r.problem ? no(r.problem) : { block: r.block, cues: [{ id: 'refusal' }, { id: 'filed', text: r.block.log.filter((e) => e.kind === 'card').at(-1)!.text }], ok: true };
  }
  // Slice 2: inside Dispatch, jobs are queued and cleared. Checked here, not only on screen.
  if (action.type === 'queueJob' || action.type === 'confirmCard' || action.type === 'clearJob') {
    if (beat !== 'dispatch') return no(`${action.type} does nothing at ${beat}`);
    if (action.type === 'clearJob') return { block: clearJob(block, action.holdingId), cues: [], ok: true };
    const r = queueJob(block, action.job);
    if (r.problem) return no(r.problem);
    return { block: r.block, cues: [{ id: 'queued', holdingId: action.job.holdingId }, { id: 'filed', text: r.block.log[r.block.log.length - 1]!.text }], ok: true };
  }
  // Slice 3: the Ledger's income lines can be pressed at any beat (from the next Evening on). The Log only grows.
  if (action.type === 'waive' || action.type === 'halve') {
    const r = setRate(block, action.holdingId, action.type);
    return r.problem ? no(r.problem) : { block: r.block, cues: [], ok: true };
  }
  if (action.type === 'askAbout') {
    const r = askAbout(block, action.holdingId);
    return r.problem ? no(r.problem) : { block: r.block, cues: [{ id: 'asked', line: r.line }], ok: true };
  }
  // Slice 7: the Night. The door's answered first; then one action; the Wall at any beat.
  if (action.type === 'answerKnock' || action.type === 'nightAction' || action.type === 'takeDown') {
    const r = action.type === 'answerKnock' ? answerKnock(block, action.answer) : action.type === 'nightAction' ? nightAction(block, action.action, action.id ?? null) : takeDown(block, action.index);
    if (r.problem) return no(r.problem);
    const cues: EvilCue[] = [{ id: 'said', line: r.line }];
    if (r.moved) cues.push({ id: 'moved', line: r.moved });
    return { block: r.block, cues, ok: true };
  }
  if (BEAT_END[beat] !== action.type) return no(`${action.type} does nothing at ${beat}`);
  // Lights out with somebody still at the door is "(Not tonight.)" (Part 24a section 1.5), unless they can't be shut out.
  let pre = block;
  const preCues: EvilCue[] = [];
  if (action.type === 'lightsOut' && block.night.knock) {
    const r = answerKnock(block, 3);
    if (r.problem) return no(r.problem);
    pre = r.block;
    if (r.moved) preCues.push({ id: 'moved', line: r.moved });
  }
  const to = nextBeat(beat);
  const day = to === 'morning' ? pre.here.day + 1 : pre.here.day;
  let out: EvilModeBlock = { ...pre, here: { ...pre.here, day, beat: to } };
  // "Send them" fixes the odds; going into the Evening rolls every job once (design Part 30 section 5.2).
  if (action.type === 'send') out = fixOdds(out);
  if (to === 'evening') out = resolveEvening(out);
  // Slice 7: the knock is drawn on the way into the Night (one `evil-people` draw, even when nobody comes).
  if (to === 'night' && !out.district?.end) out = drawKnock(out);
  const cues: EvilCue[] = [...preCues, { id: 'beat', beat: to }];
  if (to === 'night' && out.night.knock) cues.push({ id: 'knock', n: out.night.knock.n });
  // Slice 4: Morning. Anyone at Loyalty 0 is gone, with a note; then the notice board (Part 30 section 6.2).
  // Slice 5: nobody stays posted overnight. The road's lines are shown at the Morning.
  if (to === 'morning') {
    out = { ...out, posted: [] };
    if (out.hero?.today.length) cues.push({ id: 'road', lines: out.hero.today });
  }
  // The seventh day: the Hero takes the Badge on their way through, either way (Part 2 section 4).
  out = endIfTaken(out);
  if (to === 'morning' && !out.district?.end) {
    const z = leaveAtZero(out);
    // Slice 6: after a move to Whatever it takes, every Heart goes, together, at breakfast.
    const hg = heartsGo(z.block);
    out = arriveApplicants(hg.block);
    for (const line of [...z.notes, ...hg.notes]) cues.push({ id: 'said', line });
  }
  if (to === 'morning') cues.push({ id: 'newDay', day });
  if (out.district?.end) cues.push({ id: 'districtEnd', how: out.district.end.how });
  return { block: out, cues, ok: true };
}

/** A district that's ended gives the Hero its Badge once (on the seventh day, on their way through). */
function endIfTaken(block: EvilModeBlock): EvilModeBlock {
  return block.district?.end && block.hero ? takeBadge(block, 'day7') : block;
}

/** The beats already done today, the one lit now, and those still to come (the beat strip, design Part 29 section 2.2). */
export function beatStrip(block: EvilModeBlock): { beat: Beat; state: 'done' | 'now' | 'later' }[] {
  const at = BEATS.indexOf(block.here.beat);
  return BEATS.map((beat, i) => ({ beat, state: i < at ? 'done' : i === at ? 'now' : 'later' }));
}
