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
import { gymAct, gymEvening, gymResult } from './gym';
import { recall, goOn, tallyOf, toRoad } from './region';
import { bust, trade, ventureAct, type BustWay, type TradeReq, type VentureAct } from './economy';
import { answerPost, chairAct, chairResult, legendAct, legendResult, neighbourDistrictEnd, neighbourEvening, neighbourMorning, putOnTable, rise, sitAnswer, sitDown } from './neighbour';
import { EVIL_DATA } from './data';
import { callOffHeist, endDig, giveBack, goHeist, heistBattle, heistRoom, ledgerStep, planHeist, reckoningLost, schemeEvening, schemeMorning, setPlan, startDig, takeUpScheme, takeWay, type PlanSlot, type RoomChoice, type WayKey } from './scheme';
import { baseDistrict, baseEvening, build, enlarge, guard, moveRoom, pickSite, place, sellRoom, setLatch, staff, standAtWindow, unplace, walkBase, type PieceDraft } from './base';
import { closeWalk, walkedLine, walkIt, walkResult } from './walk';
import { bail, raidDone, raidDoor, raidEvening, raidOffice, raidOn, raidOrder, raidQueue, raidResult, raidTurn, visit, warnChoice } from './raid';
import { closeFire, fireAnswer, fireMissed, fireOwn, practiceResult, sitFire, writeNotebook } from './fires';
import { friendCheck, keepLetter, motherWrites, openLetter, roadDay, roadDo, writeMother, type RoadWhat } from './road';
import { lastDay, nightBefore, roomAct, roomResult, type LastDay, type RoomOption } from './reckoning';
import { eveningTemper } from './temper';
import { canDo } from './canDo';
import { askStay, openQuests, pinLoyalty, questStep, type StayReason } from './quest';
import { feed, moleAnswer, moleDistrictEnd, moleNight, nameThem, patronWarns, type MoleAnswer } from './mole';
import { checkEndings, endAct, endBattle, pressEnding } from './endings';
import { regionMoves } from './regionRule';
import { afterGym, l3DistrictEnd, l3Evening, l3Morning, regionAct, starLocks } from './lastThree';
import { beginCrossing, carryLetter, clockMet, clockMorning, cross, keptWarmth, stopClock, type CrossAct } from './crossing';
import { BEATS, type Beat, type EvilModeBlock, type GymWay, type LineId, type OrderId, type PartId, type Question, type RoomType, type TableThing, type WingId } from './schema';

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
  | { type: 'battleResult'; won: boolean; fielded?: string[]; caught?: string; turns?: number }
  /** Slice 7: the door (0..2 an answer, 3 "(Not tonight.)"), the Night's one action, and taking something off the Wall. */
  | { type: 'answerKnock'; answer: number }
  | { type: 'nightAction'; action: NightAction; id?: string }
  | { type: 'takeDown'; index: number }
  /** Slice 6: move the Line, once a region, at Night (Part 3 section 7.1). */
  | { type: 'moveLine'; to: LineId }
  /** Slice 8: one of the Gym's five ways, at the In person beat (Part 8a). */
  | { type: 'gymWay'; way: GymWay }
  /** Slice 9: after a district, the tally's read; on the Road, an Officer's left (or nobody) and the team goes on; or one's recalled. */
  | { type: 'toRoad' }
  | { type: 'goOn'; stay: string | null }
  | { type: 'recall'; id: string }
  /** Slice 16: the Crossing's answers, in order; Hoenn's letters (In person) and stopping its second clock. */
  | ({ type: 'cross' } & CrossAct)
  | { type: 'letter' }
  | { type: 'stopClock'; how: 'boss' | 'hero' }
  /** Slice 20: Alola, Galar and Paldea's In person acts (the loan, the handshake, Aether, the bag, a Star Visit), by code. */
  | { type: 'regionAct'; code: string }
  /** Slice 11: a Racket, a Front or a Work from its Card (at Dispatch); the Boss's hand on something running; a way out of bankruptcy. */
  | { type: 'trade'; req: TradeReq }
  | { type: 'venture'; id: string; act: VentureAct }
  | { type: 'bust'; way: BustWay; id?: string }
  /** Slice 13: the neighbour. A Sit-Down (called at In person, three exchanges, then the table), the Chair, the cave, and answering a message. */
  | { type: 'sitDown' }
  | { type: 'sitAnswer'; i: number }
  | { type: 'table'; thing: TableThing; personId?: string }
  | { type: 'rise' }
  | { type: 'chair' }
  | { type: 'legend' }
  | { type: 'answerPost'; id: string; i: number }
  /** Slice 14: the Scheme. A part's way (from its Card); Kanto's Ledger, a step; a heist planned, filled, played room by room, called off; a Dig begun and ended; a take given back; a fallen team's Scheme taken up. */
  | { type: 'schemeWay'; part: PartId; key: WayKey; holdingId?: string }
  | { type: 'ledgerStep'; key: 'clean' | 'dirty' }
  | { type: 'heist'; id: string }
  | { type: 'heistPlan'; slot: PlanSlot; value: string | null }
  | { type: 'heistGo' }
  | { type: 'heistRoom'; choice: RoomChoice }
  | { type: 'heistOff' }
  | { type: 'dig'; id: string; holdingId?: string }
  | { type: 'digEnd'; holdingId: string; back: boolean }
  | { type: 'giveBack'; id: string }
  | { type: 'takeUpScheme' }
  /** Slice 10: the base (Part 16): a site, rooms at Night, staffing, Defend's pieces and people, the latch, the Night's walk and window. */
  | { type: 'pickSite'; site: string }
  | { type: 'build'; room: RoomType; at: string }
  | { type: 'enlarge'; id: string }
  | { type: 'moveRoom'; id: string; to: string }
  | { type: 'sellRoom'; id: string }
  | { type: 'staff'; id: string; who: string }
  | { type: 'place'; piece: PieceDraft }
  | { type: 'unplace'; id: string }
  | { type: 'guard'; who: string; at: string | null }
  | { type: 'latch'; on: boolean }
  | { type: 'walkBase' }
  | { type: 'window' }
  /** Slice 10: Walk it (Part 17 section 4), at the In person beat; closed when it's done. */
  | { type: 'walkIt' }
  | { type: 'closeWalk' }
  /** Slice 10: the warning and the Raid (Part 17 section 9), bail and visits. */
  | { type: 'warnChoice'; choice: 'move' | 'empty' | 'hold' | 'station' }
  | { type: 'raidDoor'; open: boolean }
  | { type: 'raidOrder'; wing: WingId; order: OrderId }
  | { type: 'raidQueue'; queue: string[] }
  | { type: 'raidTurn' }
  | { type: 'raidOffice'; choice: 'battle' | 'charge' | 'pen' | 'window' }
  | { type: 'raidDone' }
  | { type: 'bail'; id: string }
  | { type: 'visit'; id: string }
  /** Slice 12: the fire (Part 19), the other three and the letters (Part 20), the last day and the last room (Part 21). */
  | { type: 'sitFire' }
  | { type: 'fireAnswer'; id: string }
  | { type: 'fireOwn'; text?: string; pick?: number; silence?: boolean }
  | { type: 'closeFire' }
  | { type: 'writeNotebook'; text: string }
  | { type: 'roadDo'; who: string; what: RoadWhat }
  | { type: 'openLetter'; id: string }
  | { type: 'keepLetter' }
  | { type: 'writeMother'; opening: number }
  | { type: 'lastDay'; what: LastDay }
  | { type: 'roomAct'; what: RoomOption['what']; kind?: string; who?: string }
  | { type: 'dismissOvernight' }
  | { type: 'send' }
  | { type: 'stayIn' }
  | { type: 'callItADay' }
  | { type: 'lightsOut' }
  | { type: 'watchRoad' }
  /** Slice 15: the endings (Part 23). One answer to the scene on screen, or a pressed ending. */
  | { type: 'endAct'; choice?: string | null; text?: string | null }
  | { type: 'endPress'; what: 'straight' | 'handOff' | 'walkIn'; heir?: string; line?: string; ledger?: boolean }
  /** Slice 17: a quest's next step (the last one with its ending); Ask them to stay; the Office: name, feed, answer. */
  | { type: 'questStep'; id: string; ending?: string }
  | { type: 'askStay'; id: string; reason: StayReason | null }
  | { type: 'nameThem'; id: string }
  | { type: 'feed'; id: string }
  | { type: 'moleAnswer'; answer: MoleAnswer };

export type EvilCue = { id: 'beat'; beat: Beat } | { id: 'newDay'; day: number } | { id: 'refused'; reason: string } | { id: 'queued'; holdingId: string } | { id: 'districtEnd'; how: 'held' | 'taken' | 'arrival' | 'reckoning' } | { id: 'filed'; text: string } | { id: 'asked'; line: string } | { id: 'said'; line: string } | { id: 'refusal' } | { id: 'fight' } | { id: 'road'; lines: string[] } | { id: 'ending' } | { id: 'knock'; n: number } | { id: 'moved'; line: string };

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
  // Slice 15: once an ending has begun, only its scenes (and its battle) move anything.
  if (block0.ending) return stepEnding(block0, action);
  let r = stepInner(block0, action);
  // Slice 13: the neighbour's Morning (messages, and each tick on its day) comes with every Morning, however it's reached.
  if (!r.ok) return r;
  // Slice 16: Hoenn's second clock (each Reckoning Morning; they meet if the Reckoning ends with it running).
  // Slice 17: the mole's district end (report, tells, a poach) comes first, once.
  const md = moleDistrictEnd(r.block);
  let b = l3Morning(clockMorning(schemeMorning(neighbourMorning(settleRegion(clockMet(keptWarmth(l3DistrictEnd(neighbourDistrictEnd(md.block)))))))));
  // Slice 17: a finished quest pins Loyalty at 10; a failed one caps it at 7; two wrong accusations cap the Roster at 8.
  b = pinLoyalty(b);
  if (md.lines.length) r = { ...r, cues: [...r.cues, ...md.lines.map((line) => ({ id: 'said' as const, line }))] };
  // Slice 14: the Reckoning lost (the Hero reached the base) costs the Scheme groundwork, once a region.
  if (b.district?.end?.how === 'reckoning' && b.scheme) b = reckoningLost(b).block;
  // Slice 19: Sinnoh halves every Loyalty change; Unova doubles every Regard and Dread change (Part 26b sections 1.1, 2.1).
  b = regionMoves(block0, b);
  // Slice 20: Team Star can't stand at War, Rivals, Front or Merger, whatever path tried (Part 15b section 5.1).
  b = starLocks(b);
  // Slice 15: the endings are checked after every step, in their order (Part 23 section 1.1).
  b = checkEndings(block0, b);
  // Slice 16: a region that isn't the run's last ends at the Crossing.
  b = beginCrossing(b);
  return { ...r, block: b, cues: b.ending && !block0.ending ? [...r.cues, { id: 'ending' as const }] : r.cues };
}

function stepEnding(block: EvilModeBlock, action: EvilAction): StepResult {
  const no = (reason: string): StepResult => ({ block, cues: [{ id: 'refused', reason }], ok: false });
  const r = action.type === 'endAct' ? endAct(block, action.choice ?? null, action.text ?? null)
    : action.type === 'battleResult' && block.fight?.kind === 'ending' ? endBattle(block, action.won)
    : null;
  if (!r) return no(block.ending!.done ? "The run's over." : 'The ending is going on.');
  if (r.problem) return no(r.problem);
  return { block: r.block, cues: [...r.lines.map((line) => ({ id: 'said' as const, line })), ...(r.fight ? [{ id: 'fight' as const }] : [])], ok: true };
}

/** Slice 9: a district that's just ended is tallied once, and the region waits on the tally (Part 2 section 4.2). */
function settleRegion(block: EvilModeBlock): EvilModeBlock {
  if (!block.district?.end || block.region.phase !== 'day' || !EVIL_DATA.region.on) return block;
  return { ...block, region: { ...block.region, phase: 'tally', tallies: [...block.region.tallies, tallyOf(block)] } };
}

function stepInner(block0: EvilModeBlock, action: EvilAction): StepResult {
  let block = block0;
  const { beat } = block.here;
  const no = (reason: string): StepResult => ({ block: block0, cues: [{ id: 'refused', reason }], ok: false });
  // Slice 12: one guard asked first for every action (design Part 30 section 10): nothing harms a child on the road.
  const guard = canDo(block, action);
  if (!guard.ok) return no(guard.why);
  // Slice 15: the pressed endings, and "Walk into the station" at the warning (Part 23 section 7).
  if (action.type === 'endPress' || (action.type === 'warnChoice' && action.choice === 'station')) {
    if (action.type === 'warnChoice' && block.raid?.state !== 'warned') return no('Nobody has warned you of anything.');
    const r = action.type === 'endPress' ? pressEnding(block, action.what, action) : pressEnding(block, 'walkIn', {});
    return r.problem ? no(r.problem) : { block: r.block, cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
  }
  if (action.type === 'endAct') return no('No ending has begun.');
  const said = (r: { block: EvilModeBlock; problem: string | null; line?: string; lines?: string[]; fight?: boolean }): StepResult =>
    (r.problem ? no(r.problem) : { block: r.block, cues: [...(r.lines ?? (r.line ? [r.line] : [])).map((line) => ({ id: 'said' as const, line })), ...(r.fight ? [{ id: 'fight' as const }] : [])], ok: true });
  // Slice 16: the Crossing, once the region's over.
  if (action.type === 'cross') {
    const { type: _t, ...act } = action;
    const r = cross(block, act as CrossAct);
    if (r.problem) return no(r.problem);
    const crossed = act.what === 'go';
    return { block: r.block, cues: [...r.lines.map((line) => ({ id: 'said' as const, line })), ...(crossed ? [{ id: 'beat' as const, beat: 'morning' as const }, { id: 'newDay' as const, day: r.block.here.day }] : [])], ok: true };
  }
  // Slice 9: after a district, only the tally and the Road move anything.
  if (action.type === 'toRoad' || action.type === 'goOn' || action.type === 'recall') {
    if (action.type === 'recall') {
      const r = recall(block, action.id);
      return r.problem ? no(r.problem) : { block: r.block, cues: [{ id: 'said', line: r.line }], ok: true };
    }
    // Slice 12: leaving a district, the mother's letter for it is written, and a fire not sat at is gone.
    const pre = action.type === 'goOn' && block.region.phase === 'road' && block.district ? fireMissed(motherWrites(block), block.district.n) : block;
    const r0 = action.type === 'toRoad' ? toRoad(block) : goOn(pre, action.stay);
    const r = action.type === 'goOn' && !r0.problem ? { ...r0, block: baseDistrict(r0.block) } : r0;
    if (r.problem) return no(r.problem);
    return { block: r.block, cues: action.type === 'goOn' ? [{ id: 'beat', beat: 'morning' }, { id: 'newDay', day: r.block.here.day }] : [], ok: true };
  }
  if (block.district?.end) return no("The district's over.");
  // Slice 5: a battle the day's waiting on comes first; only its result moves anything.
  if (action.type === 'battleResult') {
    const f = block.fight;
    if (!f) return no('No battle is waiting.');
    if (f.kind === 'hold') {
      const r = holdResult(block, action.won, action.fielded ?? []);
      return { block: endIfTaken(r.block), cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
    }
    if (f.kind === 'chair' || f.kind === 'legend') {
      const r = f.kind === 'chair' ? chairResult(block, action.won) : legendResult(block, action.won, action.caught ?? null);
      return { block: r.block, cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
    }
    if (f.kind === 'heist') {
      const r = heistBattle(block, action.won, action.turns ?? 1);
      return { block: r.block, cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
    }
    if (f.kind === 'walk' || f.kind === 'raid') {
      const r = f.kind === 'walk' ? walkResult(block, action.won) : raidResult(block, action.won);
      return r.problem ? no(r.problem) : { block: r.block, cues: [...r.lines.map((line) => ({ id: 'said' as const, line })), ...('fight' in r && r.fight ? [{ id: 'fight' as const }] : [])], ok: true };
    }
    if (f.kind === 'practice' || f.kind === 'room') {
      const r = f.kind === 'practice' ? practiceResult(block) : roomResult(block, action.won);
      return { block: r.block, cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
    }
    if (f.kind === 'gym' || f.kind === 'challenge') {
      const r0 = gymResult(block, action.won);
      // Slice 20 (Galar): the match was on television; a won Beat waits on the handshake.
      const pitch = afterGym(block, r0.block, action.won);
      const r = { block: pitch.block, lines: [...r0.lines, ...pitch.lines] };
      return { block: r.block, cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
    }
    const queue = block.queue.map((j) => (j.holdingId === f.holdingId && j.method === 'outplay' ? { ...j, played: action.won ? ('won' as const) : ('lost' as const) } : j));
    return { block: { ...block, queue, fight: null }, cues: [{ id: 'said', line: action.won ? 'Won fairly. It holds, from this Evening.' : 'Lost. The party is healed; nothing ends.' }], ok: true };
  }
  if (block.fight) return no('A battle is waiting.');
  // Slice 14: inside a heist's rooms, only the rooms move anything.
  if (block.scheme?.heist?.stage === 'rooms' && action.type !== 'heistRoom') return no('The Boss is inside. Finish the rooms first.');
  if (action.type === 'schemeWay' || action.type === 'ledgerStep' || action.type === 'heist' || action.type === 'heistPlan' || action.type === 'heistGo' || action.type === 'heistRoom' || action.type === 'heistOff' || action.type === 'dig' || action.type === 'digEnd' || action.type === 'giveBack' || action.type === 'takeUpScheme') {
    if (block.refusal) return no('Somebody is waiting on an answer in the yard.');
    if (block.neighbour?.sitting) return no('A Sit-Down is going on.');
    const r = action.type === 'schemeWay' ? takeWay(block, action.part, action.key, action.holdingId)
      : action.type === 'ledgerStep' ? ledgerStep(block, action.key)
      : action.type === 'heist' ? planHeist(block, action.id, null, null, null)
      : action.type === 'heistPlan' ? setPlan(block, action.slot, action.value)
      : action.type === 'heistGo' ? goHeist(block)
      : action.type === 'heistRoom' ? heistRoom(block, action.choice)
      : action.type === 'heistOff' ? callOffHeist(block)
      : action.type === 'dig' ? startDig(block, action.id, null, action.holdingId, null)
      : action.type === 'digEnd' ? endDig(block, action.holdingId, action.back)
      : action.type === 'giveBack' ? giveBack(block, action.id)
      : takeUpScheme(block);
    if (r.problem) return no(r.problem);
    return { block: r.block, cues: [...r.lines.map((line) => ({ id: 'said' as const, line })), ...(r.block.fight && !block.fight ? [{ id: 'fight' as const }] : [])], ok: true };
  }
  // Slice 13: a message can be answered at any beat. A Sit-Down going on takes the whole In person beat.
  if (action.type === 'answerPost') {
    const r = answerPost(block, action.id, action.i);
    return r.problem ? no(r.problem) : { block: r.block, cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
  }
  if (block.neighbour?.sitting && action.type !== 'sitAnswer' && action.type !== 'table' && action.type !== 'rise') return no('A Sit-Down is going on.');
  if (action.type === 'sitDown' || action.type === 'sitAnswer' || action.type === 'table' || action.type === 'rise' || action.type === 'chair' || action.type === 'legend') {
    const r = action.type === 'sitDown' ? sitDown(block) : action.type === 'sitAnswer' ? sitAnswer(block, action.i) : action.type === 'table' ? putOnTable(block, action.thing, action.personId) : action.type === 'rise' ? rise(block) : action.type === 'chair' ? chairAct(block) : legendAct(block);
    if (r.problem) return no(r.problem);
    return { block: r.block, cues: [...r.lines.map((line) => ({ id: 'said' as const, line })), ...(r.block.fight && !block.fight ? [{ id: 'fight' as const }] : [])], ok: true };
  }
  if (action.type === 'regionAct') {
    const r = regionAct(block, action.code);
    return r.problem ? no(r.problem) : { block: r.block, cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
  }
  if (action.type === 'letter' || action.type === 'stopClock') {
    const r = action.type === 'letter' ? carryLetter(block) : stopClock(block, action.how);
    return r.problem ? no(r.problem) : { block: r.block, cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
  }
  // Slice 12: a fire and the last room hold the day until they're done.
  const s12 = stepS12(block, action);
  if (s12) return said(s12);
  if (block.fire) return no("You're at the fire.");
  if (block.reck?.room && !block.reck.room.outcome) return no("You're in the last room.");
  // Slice 10: the base, the walk and the Raid. Each refuses here what doesn't fit, not only on screen.
  const baseStep = stepBase(block, action);
  if (baseStep) return baseStep.problem ? no(baseStep.problem) : { block: baseStep.block, cues: [...baseStep.lines.map((line) => ({ id: 'said' as const, line })), ...(baseStep.fight ? [{ id: 'fight' as const }] : [])], ok: true };
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
    const walked = endIfTaken(roadDay(walkHero(block)));
    if (walked.fight) return { block: walked, cues: [{ id: 'road', lines: walked.hero!.today }, { id: 'fight' }], ok: true };
    if (walked.district?.end) return { block: walked, cues: [{ id: 'road', lines: walked.hero!.today }, { id: 'districtEnd', how: walked.district.end.how }], ok: true };
    // Slice 12: the last room holds the day until it's done.
    if (walked.reck?.room && !walked.reck.room.outcome) return { block: walked, cues: [{ id: 'road', lines: walked.hero!.today }], ok: true };
    block = walked;
  }
  // Slice 8: the Gym's five ways, refused here unless the door's open (not only on screen).
  if (action.type === 'gymWay') {
    const r = gymAct(block, action.way);
    if (r.problem) return no(r.problem);
    return { block: r.block, cues: [...r.lines.map((line) => ({ id: 'said' as const, line })), ...(r.fight ? [{ id: 'fight' as const }] : [])], ok: true };
  }
  // Slice 11: trade. Refused here, not only on screen.
  if (action.type === 'trade' || action.type === 'venture' || action.type === 'bust') {
    if (block.refusal) return no('Somebody is waiting on an answer in the yard.');
    const r = action.type === 'trade' ? trade(block, action.req) : action.type === 'venture' ? ventureAct(block, action.id, action.act) : bust(block, action.way, action.id ?? null);
    return r.problem ? no(r.problem) : { block: r.block, cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
  }
  // Slice 6: the Line moves at Night, once a region. Refused here, not only on screen.
  if (action.type === 'moveLine') {
    const r = moveLine(block, action.to);
    return r.problem ? no(r.problem) : { block: r.block, cues: [{ id: 'said', line: r.line }], ok: true };
  }
  // Slice 17: quests (their own beats, checked in quest.ts), Ask them to stay (any beat), and the Office.
  if (action.type === 'questStep' || action.type === 'askStay' || action.type === 'nameThem' || action.type === 'feed' || action.type === 'moleAnswer') {
    if (block.refusal) return no('Somebody is waiting on an answer in the yard.');
    const r = action.type === 'questStep' ? questStep(block, action.id, action.ending ?? null)
      : action.type === 'askStay' ? askStay(block, action.id, action.reason)
      : action.type === 'nameThem' ? nameThem(block, action.id)
      : action.type === 'feed' ? feed(block, action.id)
      : moleAnswer(block, action.answer);
    return r.problem ? no(r.problem) : { block: r.block, cues: r.lines.map((line) => ({ id: 'said' as const, line })), ok: true };
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
  if (raidOn(block)) return no("The Raid's on. Nothing else moves till it's over.");
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
  if (to === 'evening') out = l3Evening(friendCheck(eveningTemper(schemeEvening(neighbourEvening(raidEvening(baseEvening(gymEvening(resolveEvening(out)))))))));
  // Slice 12: the night before the walk (Part 21 section 3.2).
  if (to === 'night') out = nightBefore(out);
  // Slice 7: the knock is drawn on the way into the Night (one `evil-people` draw, even when nobody comes).
  if (to === 'night' && !out.district?.end) out = drawKnock(out);
  // Slice 17: a mole at Loyalty 8 or more comes to the Office on their own (no draw).
  if (to === 'night') out = moleNight(out);
  const cues: EvilCue[] = [...preCues, { id: 'beat', beat: to }];
  if (to === 'night' && out.night.knock) cues.push({ id: 'knock', n: out.night.knock.n });
  // Slice 4: Morning. Anyone at Loyalty 0 is gone, with a note; then the notice board (Part 30 section 6.2).
  // Slice 5: nobody stays posted overnight. The road's lines are shown at the Morning.
  if (to === 'morning') {
    out = walkedLine({ ...out, posted: [] });
    if (out.hero?.today.length) cues.push({ id: 'road', lines: out.hero.today });
  }
  // The seventh day: the Hero takes the Badge on their way through, either way (Part 2 section 4).
  out = endIfTaken(out);
  if (to === 'morning' && !out.district?.end) {
    const z = leaveAtZero(out);
    // Slice 6: after a move to Whatever it takes, every Heart goes, together, at breakfast.
    const hg = heartsGo(z.block);
    out = arriveApplicants(hg.block);
    // Slice 17: quests open at Loyalty 7; the Patron's one warning, at the first Arrival.
    const oq = openQuests(out);
    const pw = patronWarns(oq.block);
    out = pw.block;
    for (const line of [...z.notes, ...hg.notes, ...oq.lines, ...(pw.line ? [pw.line] : [])]) cues.push({ id: 'said', line });
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

/** Slice 12's actions, or null when the action isn't one of them. */
function stepS12(block: EvilModeBlock, a: EvilAction): { block: EvilModeBlock; problem: string | null; line?: string; lines?: string[]; fight?: boolean } | null {
  switch (a.type) {
    case 'sitFire': { const r = sitFire(block); return { ...r, lines: r.block.fire?.lines ?? [] }; }
    case 'fireAnswer': return fireAnswer(block, a.id);
    case 'fireOwn': return fireOwn(block, a);
    case 'closeFire': return closeFire(block);
    case 'writeNotebook': return writeNotebook(block, a.text);
    case 'roadDo': return roadDo(block, a.who, a.what);
    case 'openLetter': return openLetter(block, a.id);
    case 'keepLetter': return keepLetter(block);
    case 'writeMother': return writeMother(block, a.opening);
    case 'lastDay': return lastDay(block, a.what);
    case 'roomAct': return roomAct(block, a);
    default: return null;
  }
}

/** Slice 10's actions, or null when the action isn't one of them. */
function stepBase(block: EvilModeBlock, a: EvilAction): { block: EvilModeBlock; problem: string | null; lines: string[]; fight?: boolean } | null {
  const one = (r: { block: EvilModeBlock; problem: string | null; line: string }) => ({ block: r.block, problem: r.problem, lines: r.line ? [r.line] : [] });
  if (block.raid && raidOn(block) && !['raidDoor', 'raidOrder', 'raidQueue', 'raidTurn', 'raidOffice'].includes(a.type) && ['pickSite', 'build', 'enlarge', 'moveRoom', 'sellRoom', 'staff', 'place', 'unplace', 'guard', 'walkBase', 'window', 'walkIt', 'warnChoice'].includes(a.type)) return { block, problem: "The Raid's on.", lines: [] };
  switch (a.type) {
    case 'pickSite': return one(pickSite(block, a.site));
    case 'build': return one(build(block, a.room, a.at));
    case 'enlarge': return one(enlarge(block, a.id));
    case 'moveRoom': return one(moveRoom(block, a.id, a.to));
    case 'sellRoom': return one(sellRoom(block, a.id));
    case 'staff': return one(staff(block, a.id, a.who));
    case 'place': return one(place(block, a.piece));
    case 'unplace': return one(unplace(block, a.id));
    case 'guard': return one(guard(block, a.who, a.at));
    case 'latch': return one(setLatch(block, a.on));
    case 'walkBase': return one(walkBase(block));
    case 'window': return one(standAtWindow(block));
    case 'walkIt': return walkIt(block);
    case 'closeWalk': return closeWalk(block);
    case 'warnChoice': return warnChoice(block, a.choice);
    case 'raidDoor': return raidDoor(block, a.open);
    case 'raidOrder': return raidOrder(block, a.wing, a.order);
    case 'raidQueue': return raidQueue(block, a.queue);
    case 'raidTurn': return raidTurn(block);
    case 'raidOffice': return raidOffice(block, a.choice);
    case 'raidDone': return raidDone(block);
    case 'bail': return bail(block, a.id);
    case 'visit': return visit(block, a.id);
    default: return null;
  }
}
