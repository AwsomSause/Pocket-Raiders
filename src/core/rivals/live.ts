// Live wiring for the rival presentation (Beta 0.6 R5/R6/R4 caps): the lines a registered rival says when a battle starts,
// meeting counts, and how many counter-picks it may make. Deterministic (hashes only); touches only the rival's own record.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { pickContextLine, pickSpeciesLine, useNickname, type BankContext } from './bank';
import { changeFeelings, overhaulOf, pityFor, registerRival } from './overhaul';
import { noteMeeting, PRESENCE, pseudoPresence } from './presence';
import { maxHp } from '../pokemon';
import { emit } from '../story/record';
import { fnv1a } from '../story/moments';
import { friendInRegion, friendPersonality, friendScene, postcard, type FriendScene } from './friend';
import { counterSlots } from './tier5';

export type RivalNodeKind = 'trainer' | 'gym' | 'elite' | 'champion' | string;

const CTX_BY_NODE: Partial<Record<string, BankContext>> = { gym: 'gym', elite: 'elite', champion: 'champion' };

/** Which encounter this is for counter-pick limits: the 1st meeting 'first', then 'mid', 'finale' from the 4th, 'league' at E4/Champion. */
export function encounterOf(meetings: number, node: RivalNodeKind): 'first' | 'mid' | 'finale' | 'league' {
  if (node === 'elite' || node === 'champion') return 'league';
  return meetings <= 1 ? 'first' : meetings <= 3 ? 'mid' : 'finale';
}

export const totalMeetings = (run: RunState, id: string): number => Object.values(overhaulOf(run, id)?.presence ?? {}).reduce((n, p) => n + p.meetings, 0);

/** Counter-picks the rival may make this meeting (0 for the first fight; never more than its normal cap). */
export function counterCap(run: RunState, id: string, node: RivalNodeKind, normalCap: number): number {
  if (!overhaulOf(run, id)) return normalCap;
  return Math.min(normalCap, counterSlots(encounterOf(totalMeetings(run, id) + 1, node)));
}

/**
 * Counts the meeting and returns the rival's lines for the start of the battle: at most one Pokémon line (about your
 * lead), the pity advice when pity is active, and a gym/Elite Four/Champion line. Empty for an unregistered rival.
 */
export function rivalBattleLines(content: Content, run: RunState, rivalId: string, node: RivalNodeKind, leadMonIndex: number): string[] {
  const rec = overhaulOf(run, rivalId);
  if (!rec) return [];
  const meeting = noteMeeting(rec, run.regionIndex);
  const seed = `${run.seed}:${rivalId}`;
  const lines: string[] = [];
  const mon = run.party[leadMonIndex];
  const sp = mon ? content.species.get(mon.speciesId) : undefined;
  if (mon && sp) lines.push(pickSpeciesLine(rec, seed, meeting, sp, useNickname(rec) ? mon.care?.nickname : undefined));
  if (pityFor(run, rivalId).advice) lines.push(pickContextLine(rec, seed, 'pity', meeting));
  const ctx = CTX_BY_NODE[node];
  if (ctx) lines.push(pickContextLine(rec, seed, ctx, meeting));
  return lines;
}

/** After the battle: the rival's reaction line (won or lost). */
export function rivalResultLine(run: RunState, rivalId: string, rivalWon: boolean): string | null {
  const rec = overhaulOf(run, rivalId);
  if (!rec) return null;
  return pickContextLine(rec, `${run.seed}:${rivalId}`, rivalWon ? 'won' : 'lost', totalMeetings(run, rivalId));
}

// ---------- Friend scenes and Pseudo Stage beats (R6/R8) ----------

const friendId = (run: RunState): string => `friend-${run.seed}`;

/** The Friend's record, registered the first time a region has them. Needs the main rival and the rivalFriend setting. */
function friendRecord(run: RunState) {
  const all = run.expansion?.rival;
  if (!all) return undefined;
  const id = friendId(run);
  if (all[id]) return all[id];
  const main = Object.values(all).find((r) => r.role === 'main');
  if (!main) return undefined;
  return registerRival(run, { id, role: 'friend', personality: friendPersonality(run.seed, main.personality), style: main.style, arc: 'rivals-become-friends' });
}

export const friendName = (run: RunState): string => PRESENCE.friend.names[fnv1a(`${run.seed}:friend-name`) % PRESENCE.friend.names.length]!;

/**
 * Called when a stage starts. In regions that have the Friend, one scene (Meet, Mid, Errand, Eve) plays every second
 * stage; a postcard arrives at the start of the next region. Returns the scene text, or null. Once per stage.
 */
export function friendStageBeat(content: Content, run: RunState): string | null {
  if (!run.expansion?.rival || !run.stage) return null;
  const key = `friend:beat:${run.regionIndex}:${run.stage.index}`;
  if (run.story.flags[key] !== undefined) return null;
  run.story.flags[key] = true;
  const name = friendName(run);
  const counter = `friend:stages:${run.regionIndex}`;
  const inRegion = Number(run.story.flags[counter] ?? 0) + 1;
  run.story.flags[counter] = inRegion;
  const lines: string[] = [];
  if (run.regionIndex > 0 && inRegion === 1 && friendInRegion(run.seed, run.regionIndex - 1) && run.expansion.rival[friendId(run)]) lines.push(postcard(run.seed, run.regionIndex, name));
  if (friendInRegion(run.seed, run.regionIndex) && inRegion % PRESENCE.friend.sceneEvery === 0) {
    const rec = friendRecord(run);
    const shown = Number(run.story.flags[`friend:scenes:${run.regionIndex}`] ?? 0);
    const scene = PRESENCE.friend.scenes[shown] as FriendScene | undefined;
    if (rec && scene) {
      run.story.flags[`friend:scenes:${run.regionIndex}`] = shown + 1;
      const s = friendScene(rec, run.seed, scene, name, shown + 1);
      changeFeelings(rec, 'assisted');
      lines.push(`${s.text} "${s.voice}"`);
    }
  }
  if (lines.length === 0) return null;
  const text = lines.join(' ');
  emit(content, run, 'storyMoment', { actors: [], data: { def: 'friend-beat', suppressed: false }, importance: 40, text });
  return text;
}

/** Entering a Pseudo Stage: the main rival (65%) or the Friend appears in one of four forms. Text and feelings only. */
export function pseudoRivalBeat(content: Content, run: RunState): string | null {
  const all = run.expansion?.rival;
  if (!all) return null;
  const main = Object.entries(all).find(([, r]) => r.role === 'main');
  if (!main) return null;
  const total = run.party.reduce((n, m) => n + maxHp(content, m), 0);
  const left = run.party.reduce((n, m) => n + m.hp, 0);
  const friendHere = friendInRegion(run.seed, run.regionIndex) && !!all[friendId(run)];
  const p = pseudoPresence(run.seed, run.regionIndex, run.stage?.index ?? 0, { friendHere, partyHpShare: total > 0 ? left / total : 1 });
  if (!p.who || !p.form) return null;
  const rec = p.who === 'main' ? main[1] : all[friendId(run)]!;
  const id = p.who === 'main' ? main[0] : friendId(run);
  const name = p.who === 'main' ? (run.story.rivals.find((r) => r.id === id)?.name ?? 'Your rival') : friendName(run);
  noteMeeting(rec, run.regionIndex);
  if (p.form === 'alreadyThere') changeFeelings(rec, rec.lead > 0 ? 'rivalWon' : 'rivalLost');
  const line = `${PRESENCE.pseudo.text[p.form]!.replace('{who}', name)} "${pickContextLine(rec, `${run.seed}:${id}`, 'pseudo', totalMeetings(run, id))}"`;
  emit(content, run, 'storyMoment', { actors: [], data: { def: 'pseudo-rival', suppressed: false }, importance: 45, text: line });
  return line;
}
