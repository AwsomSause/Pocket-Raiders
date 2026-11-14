// Epilogue director (Beta 0.7 E11 + D1): plays the Citadark finale and then the Region of Doom after the run is won.
// It is the one place that starts an epilogue, takes its next step whenever the map opens, and hears how each fight ended.
// State lives in `run.expansion.cut.epilogue` (a loose record, so no save bump); results go to `run.expansion.epilogue`.
// The epilogue is a side chapter of a WON run: a loss, a "Never" or "Leave" ends the chapter and the run stays won. Pure rules, no Phaser, no gameplay RNG.

import { launchFormatBattle } from '../formats/battle';
import { startFormat } from '../formats/registry';
import { beginCut, currentFormat, cutOf, markCheckpoint } from '../formats/store';
import { freeHandedOverRival } from '../arc/standWithExtended';
import { annexTargets, doomAnnexCard, doomAvailable, doomEnterCard, doomEpitaph, planDoom } from '../grandArc/doom';
import { earnRom } from '../grandArc';
import { apexTaken, epilogueOf, finaleAvailable, finaleCard, finaleEndedEarly, planFinale, reservoirBattles, xd001Locks, XD001_RAID, type EpiCard, type EpiStep } from '../grandArc/finale';
import type { Content } from '../contentSchema';
import type { RunState } from '../state';

export type Track = 'finale' | 'doom';
export interface Dir { active: boolean; track: Track; idx: number; steps: EpiStep[]; /** The step whose card or format was started (a closed one means the step is done). */ started?: number; fought?: number; need?: number; locks?: number }

const isDir = (d: unknown): d is Dir => !!d && typeof d === 'object' && Array.isArray((d as Dir).steps) && typeof (d as Dir).idx === 'number' && ((d as Dir).track === 'finale' || (d as Dir).track === 'doom');
export const dirOf = (run: Pick<RunState, 'expansion'>): Dir | null => { const d = run.expansion?.cut?.epilogue; return isDir(d) ? d : null; };
const save = (run: RunState, d: Dir): void => { cutOf(run).epilogue = d; };
/** True while an epilogue is running (the run is won, the map is open for it). */
export const epilogueActive = (run: Pick<RunState, 'expansion'>): boolean => dirOf(run)?.active === true;

const ensureEp = (run: RunState) => {
  run.expansion = run.expansion ?? {};
  run.expansion.epilogue = run.expansion.epilogue ?? { finale: false, doom: false, picks: {}, marks: 0, taken: [] };
  return run.expansion.epilogue;
};

function begin(run: RunState, track: Track): boolean {
  beginCut(run);
  const steps = track === 'finale' ? planFinale(run) : planDoom(run);
  const ep = ensureEp(run);
  if (track === 'finale') ep.rainbow = apexTaken(run) ? 'open' : 'empty';
  save(run, { active: true, track, idx: 0, steps });
  run.battle = null;
  run.draft = null;
  run.phase = 'map';
  return true;
}

/**
 * The run was just won. Starts the finale (if offered) or the Region of Doom (if on) and returns true; false means the run ends now
 * as it always did. Needs a stage to stand in, since the fights are ordinary map fights.
 */
export function startEpilogue(run: RunState): boolean {
  if (!run.stage || epilogueActive(run)) return false;
  if (finaleAvailable(run)) return begin(run, 'finale');
  if (doomAvailable(run)) return begin(run, 'doom');
  return false;
}

/** The finale or the Doom visit ends early: the rest of its plan is dropped for one closing card. */
function cutToEnd(run: RunState, d: Dir, result: 'declined' | 'sold' | 'silent'): void {
  const ep = ensureEp(run);
  if (d.track === 'finale') ep.finaleResult = result;
  else ep.doomResult = result === 'silent' ? 'fled' : 'declined';
  d.steps = [{ t: 'card', id: d.track === 'finale' ? 'early-end' : 'doom-end' }];
  d.idx = 0;
  delete d.started; delete d.fought; delete d.need; delete d.locks;
}

function cardFor(run: RunState, d: Dir, id: string): EpiCard {
  const ep = epilogueOf(run);
  if (id === 'early-end') return finaleEndedEarly((ep?.finaleResult === 'sold' ? 'sold' : ep?.finaleResult === 'declined' ? 'declined' : 'silent'));
  if (id === 'doom-enter') return doomEnterCard(run);
  if (id === 'doom-annex') return doomAnnexCard(run);
  if (id === 'doom-end') {
    const e = ensureEp(run);
    if (e.doomResult === undefined) e.doomResult = e.marks >= 8 ? 'cleared' : 'fled';
    return { title: e.doomResult === 'cleared' ? 'The Margin: cleared' : e.doomResult === 'declined' ? 'The Margin: left alone' : 'The Margin: you walk out', lines: doomEpitaph(run), options: [] };
  }
  void d;
  return finaleCard(run, id);
}

/** A card was answered (or closed). May cut the track short. */
function applyPick(run: RunState, d: Dir, id: string, pick: string | undefined): void {
  const ep = ensureEp(run);
  if (pick) ep.picks[id] = pick;
  if (id === 'letter' && pick === 'never') cutToEnd(run, d, 'declined');
  else if (id === 'greevil' && pick === 'number') cutToEnd(run, d, 'sold');
  else if (id === 'doom-enter' && pick === 'leave') cutToEnd(run, d, 'declined');
  else if (id === 'doom-annex' && pick === 'skip') ep.picks['annex'] = 'skip';
}

export type TickResult = 'idle' | 'wait' | 'battle' | 'over';

/**
 * Called whenever the map opens. Shows the next card, rest or fight of the running epilogue. 'wait': a card or rest is on screen.
 * 'battle': a fight was launched (the battle screen takes over). 'over': the epilogue is finished and the run ends as won. 'idle': nothing to do.
 */
export function epilogueTick(content: Content, run: RunState): TickResult {
  const d = dirOf(run);
  if (!d?.active || run.phase !== 'map') return 'idle';
  for (let guard = 0; guard < 80; guard++) {
    const step = d.steps[d.idx];
    if (!step) {
      if (d.track === 'finale' && doomAvailable(run)) { begin(run, 'doom'); return epilogueTick(content, run); }
      d.active = false;
      save(run, d);
      freeHandedOverRival(run);
      run.draft = null;
      run.phase = 'over';
      return 'over';
    }
    const next = (): void => { d.idx += 1; delete d.started; delete d.fought; delete d.need; delete d.locks; };
    if (step.t === 'card' || step.t === 'breather') {
      if (currentFormat(run)) { save(run, d); return 'wait'; }
      if (d.started === d.idx) {
        const pick = cutOf(run).cardPick as string | undefined;
        delete cutOf(run).cardPick;
        const before = d.idx;
        if (step.t === 'card') applyPick(run, d, step.id, pick);
        else markCheckpoint(run, 'breather');
        if (d.idx === before && d.steps[d.idx] === step) next();
        continue;
      }
      const ok = step.t === 'breather'
        ? startFormat('breather', { content, run })
        : startFormat('card', { content, run }, cardFor(run, d, step.id));
      if (!ok) { next(); continue; }
      d.started = d.idx;
      save(run, d);
      return 'wait';
    }
    if (step.t === 'battles') {
      d.need = d.need ?? (step.n === 'banks' ? reservoirBattles(run) : step.n === 'annex' ? (epilogueOf(run)?.picks['annex'] === 'skip' ? 0 : annexTargets(run).length) : step.n);
      const fought = d.fought ?? 0;
      if (fought >= d.need) { next(); continue; }
      const greevilNine = step.key === 'greevil' && epilogueOf(run)?.picks['greevil'] === 'nine';
      const ok = launchFormatBattle(content, run, d.track, {
        key: `${step.key}.${fought}`, name: step.name, size: greevilNine ? Math.max(1, step.size - 1) : step.size,
        ...(step.evil ? { evil: step.evil } : {}), ...(step.team ? { evilTeam: step.team } : {}), ...(step.types ? { types: step.types as never } : {}), ...(step.levelBonus ? { levelBonus: step.levelBonus } : {}),
      });
      if (!ok) { next(); continue; } // nobody standing or no stage: skip rather than stick
      d.fought = fought;
      save(run, d);
      return 'battle';
    }
    // XD001: a Colossus behind the locks still standing; no lock means no fight.
    d.locks = d.locks ?? xd001Locks(run);
    if (d.locks <= 0) { ensureEp(run).finaleResult = 'sung'; next(); continue; }
    const ok = content.raids.raids.some((r) => r.id === XD001_RAID) && launchFormatBattle(content, run, 'finale', { key: 'xd001', name: 'XD001', size: 1, raid: { raidId: XD001_RAID } });
    if (!ok) { cutToEnd(run, d, 'silent'); continue; }
    const raid = run.battle?.raid;
    // The raid format allows three shields: every three locks standing is one shield (1-3 locks: one, 4-6: two, 7-9: three).
    if (raid) raid.pendingShields = raid.pendingShields.slice(Math.max(0, 3 - Math.ceil(d.locks / 3)));
    save(run, d);
    return 'battle';
  }
  return 'idle';
}

/** A fight the epilogue launched ended (called from the battle-end code in run.ts). A win moves on; a loss ends the chapter, never the run. */
export function epilogueBattleEnded(run: RunState, won: boolean): void {
  const d = dirOf(run);
  if (!d?.active) return;
  const step = d.steps[d.idx];
  if (!step) return;
  if (!won) { cutToEnd(run, d, 'silent'); save(run, d); return; }
  const ep = ensureEp(run);
  if (step.t === 'xd001') {
    ep.finaleResult = 'sung';
    d.idx += 1; delete d.started; delete d.locks;
  } else if (step.t === 'battles') {
    d.fought = (d.fought ?? 0) + 1;
    if (step.rom) earnRom(run, step.rom, true);
    if (step.n === 'annex') {
      const next = annexTargets(run)[0];
      if (next && !ep.taken.includes(next)) ep.taken.push(next);
    }
    if (step.district) {
      if (!ep.taken.includes(step.district)) ep.taken.push(step.district);
      ep.marks = Math.min(8, ep.marks + 1);
    }
  }
  save(run, d);
}
