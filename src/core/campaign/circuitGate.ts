// Story Overhaul S9b: the Gym Fork, passing a town, make-up fights and Rematch Day of the Orrery Circuit, as run decisions.
// Pure helpers; run.ts calls them from the gym node, the gym-win tail and `resolveDecision`. No gameplay RNG.
import type { Content } from '../contentSchema';
import type { PendingDecision, RunState } from '../state';
import {
  canLeaveRegion, chooseGuestMatch, CIRCUIT, ensureCircuit, origBossId, PASSES_PER_REGION, rematchDay, TOWNS_PER_REGION, townAt,
} from './circuitCast';
import { isStoryCampaign } from './circuit';

type CircuitDecision = Extract<PendingDecision, { kind: 'circuit' }>;
const keyOf = (region: number, index: number): string => String(region * TOWNS_PER_REGION + index);

function describe(content: Content, id: string): { label: string; description: string } {
  const boss = content.bosses.get(id);
  const authored = CIRCUIT.leaders.find((l) => origBossId(l.id) === id);
  const types = (boss?.types ?? []).map((t) => t[0]!.toUpperCase() + t.slice(1)).join('/');
  const name = authored ? authored.name : boss?.name ?? id;
  const cap = (w: string): string => w[0]!.toUpperCase() + w.slice(1);
  const ace = boss?.signature[0] ? ` Ace: ${cap(boss.signature[0])}.` : '';
  return {
    label: types ? `${name} (${types})` : name,
    description: authored ? `${authored.persona}. Ace: ${cap(authored.ace)}. ${authored.hook.split(';')[0]}.` : `${types ? `A ${types.toLowerCase()} specialist.` : 'A mixed-team trainer.'}${ace}`,
  };
}

/** The Fork Gate for a gym stage, or null when this town is decided already (or the run is not a Story Run). */
export function forkDecision(content: Content, run: RunState, region: number, index: number): CircuitDecision | null {
  const c = ensureCircuit(content, run);
  const doors = c?.cast[region * TOWNS_PER_REGION + index]?.doors;
  if (!c || !doors) return null;
  const key = keyOf(region, index);
  if (c.chosen[key] || c.passed.includes(key)) return null;
  const used = c.passed.filter((k) => Math.floor(Number(k) / TOWNS_PER_REGION) === region).length;
  const left = PASSES_PER_REGION - used;
  const options: CircuitDecision['options'] = doors.map((id, i) => ({ ...describe(content, id), action: i === 0 ? 'door0' as const : 'door1' as const, leaderId: id }));
  if (left > 0) options.push({ label: 'Pass this town', description: `Take no fight here; both Leaders are passed over. ${left} pass${left === 1 ? '' : 'es'} left in this region.`, action: 'pass' });
  return { kind: 'circuit', step: 'fork', region, index, title: `${townAt(region, index)?.town ?? 'The gym'}: two Leaders hold this gym. Choose a door.`, options };
}

/** The next gym town to play after `after`: the next undecided one, else a make-up fight while the region has fewer than 6 badges, else null. */
export function nextGymIndex(content: Content, run: RunState, region: number, after: number): number | null {
  const c = ensureCircuit(content, run);
  if (!c) return after + 1 < TOWNS_PER_REGION ? after + 1 : null;
  for (let i = after + 1; i < TOWNS_PER_REGION; i++) if (!c.chosen[keyOf(region, i)] && !c.passed.includes(keyOf(region, i))) return i;
  if (canLeaveRegion(c, region)) return null;
  for (let i = 0; i < TOWNS_PER_REGION; i++) {
    const doors = c.cast[region * TOWNS_PER_REGION + i]!.doors;
    if (c.badges.some((b) => b.counted && doors.includes(b.leaderId))) continue;
    delete c.chosen[keyOf(region, i)];
    c.passed = c.passed.filter((k) => k !== keyOf(region, i));
    return i;
  }
  return null;
}

/** Rematch Day at the Region Gate: the decision to take the region's one Guest Match, or null (nothing to offer, or already answered). */
export function rematchDecision(content: Content, run: RunState, region: number): CircuitDecision | null {
  const c = ensureCircuit(content, run);
  if (!c || !canLeaveRegion(c, region) || c.guest[String(region)]) return null;
  const day = rematchDay(c, region);
  const flag = `circuit-letters:${region}`;
  if (!run.story.flags[flag]) {
    run.story.flags[flag] = true;
    for (const id of day.letters) run.journal.push(`${content.bosses.get(id)?.name ?? id} sent a letter after you passed their town.`);
  }
  if (day.invitations.length === 0) return null;
  const options: CircuitDecision['options'] = day.invitations.map((id) => {
    const town = c.cast.findIndex((t) => t.doors.includes(id)) % TOWNS_PER_REGION;
    return { label: `Guest Match: ${describe(content, id).label}`, description: `${townAt(region, town)?.town ?? 'Their town'}: one optional rematch for a Guest Badge and +1 Circuit Merit.`, action: 'guest' as const, leaderId: id };
  });
  options.push({ label: 'Move on', description: 'Decline every invitation and leave the region.', action: 'skip' });
  return { kind: 'circuit', step: 'rematch', region, index: 0, title: 'Rematch Day: the Leaders you passed over have sent invitations.', options };
}

export interface CircuitOutcome {
  message: string;
  /** What run.ts does next: nothing, advance past the (passed) gym, or play the stage of a Guest Match. */
  next: 'none' | 'advance' | { stage: number };
}

/** Applies the player's pick (an auto-player's non-circuit answer is mapped by run.ts: the first door, or "Move on"). */
export function applyCircuitChoice(content: Content, run: RunState, d: CircuitDecision, optionIndex: number): CircuitOutcome {
  const c = ensureCircuit(content, run);
  const opt = d.options[optionIndex] ?? d.options[0]!;
  if (!c) return { message: '', next: 'none' };
  if (d.step === 'fork') {
    const doors = c.cast[d.region * TOWNS_PER_REGION + d.index]!.doors;
    const key = keyOf(d.region, d.index);
    if (opt.action === 'pass') {
      const used = c.passed.filter((k) => Math.floor(Number(k) / TOWNS_PER_REGION) === d.region).length;
      if (used >= PASSES_PER_REGION) throw new Error('No passes left in this region');
      c.passed.push(key);
      for (const id of doors) if (!c.passedOver.includes(id)) c.passedOver.push(id);
      return { message: `You pass through ${townAt(d.region, d.index)?.town ?? 'the town'} without a fight.`, next: 'advance' };
    }
    const id = opt.leaderId ?? doors[0]!;
    c.chosen[key] = id;
    for (const other of doors) if (other !== id && !c.passedOver.includes(other)) c.passedOver.push(other);
    // Both leaders were seen at the Fork Gate: the one not entered may invite you to Rematch Day.
    for (const m of doors) if (!c.met.includes(m)) c.met.push(m);
    const stage = run.stage;
    if (stage && stage.index === d.index && run.regionIndex === d.region && stage.leaderId !== id) {
      run.usedLeaders = run.usedLeaders.filter((u) => u !== stage.leaderId);
      run.usedLeaders.push(id);
      stage.leaderId = id;
    }
    return { message: `You enter ${content.bosses.get(id)?.name ?? 'the gym'}'s door.`, next: 'none' };
  }
  if (opt.action === 'guest' && opt.leaderId && chooseGuestMatch(c, d.region, opt.leaderId)) {
    const town = c.cast.findIndex((t) => t.doors.includes(opt.leaderId!)) % TOWNS_PER_REGION;
    c.chosen[keyOf(d.region, town)] = opt.leaderId;
    c.passed = c.passed.filter((k) => k !== keyOf(d.region, town));
    return { message: `${content.bosses.get(opt.leaderId)?.name ?? 'The Leader'} is waiting for your Guest Match.`, next: { stage: town } };
  }
  c.guest[String(d.region)] = 'declined';
  return { message: 'You leave the invitations unanswered.', next: 'none' };
}

export const isCircuitRun = (content: Content, run: Pick<RunState, 'campaignId'>): boolean => isStoryCampaign(content, run.campaignId);
