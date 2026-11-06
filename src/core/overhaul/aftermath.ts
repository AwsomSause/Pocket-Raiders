// Overhaul slice 26 (aftermath part): what is left behind when you beat a gym leader, Elite Four member or champion.
// One line per boss, picked by a hash of the run seed from the boss's voice in the pack (major_trainers.json), kept in
// `run.story.flags["after:<bossId>"]`. Run-only (no cross-run memory), no save change, no RNG stream.

import { overhaulCatalogs } from './catalogs';
import { fnv1a } from '../story/moments';
import type { RunState } from '../state';

const BY_VOICE: Record<string, string[]> = {
  gruff: ['{boss} grumbled that you were good, and meant it.', '{boss} told the others the new challenger was no joke.', 'It is said {boss} nodded once, which from {boss} is a speech.'],
  boastful: ['{boss} now tells everyone the battle was closer than it looked.', '{boss} has promised a rematch, loudly.', '{boss} is already calling you a rival.'],
  formal: ['{boss} wrote a short, polite note about your battle.', 'The records now list your victory over {boss} in full.', '{boss} has asked the league to remember your name.'],
  menacing: ['{boss} smiled in a way people remember.', 'Folks say {boss} has stopped looking over the shoulder at others and started looking at you.', '{boss} swore the next meeting will go differently.'],
  eccentric: ['{boss} has started a rumor that you lost on purpose.', '{boss} drew a picture of the battle. Nobody understands it.', '{boss} thanked a nearby tree for the match.'],
  cheerful: ['{boss} told everyone it was the best battle in weeks.', '{boss} is sending you good wishes down the road.', '{boss} cannot stop talking about your team.'],
  poetic: ['{boss} wrote a verse about the fight and left it on the wind.', 'Somewhere, {boss} is still humming the battle.', '{boss} says your team moved like a sentence worth finishing.'],
  nervous: ['{boss} is still shaking, but smiling.', '{boss} replayed the battle all night and found nothing to regret.', '{boss} told a friend, quietly, that you are very strong.'],
};
const FALLBACK = ['Word of your win over {boss} spreads along the road.'];

/** The pack's name and voice for a game boss id, or null when the pack does not know the boss. */
function packBoss(bossId: string): { name: string; voice: string } | null {
  const t = overhaulCatalogs().major_trainers.entries.find((e) => e.bossId === bossId);
  return t ? { name: t.name, voice: t.voice } : null;
}

/** One aftermath line for this boss, picked by seed; null when the pack has no such boss. */
export function aftermathLine(runSeed: string, bossId: string): string | null {
  const boss = packBoss(bossId);
  if (!boss) return null;
  const pool = BY_VOICE[boss.voice] ?? FALLBACK;
  return pool[fnv1a(`${runSeed}:after:${bossId}`) % pool.length]!.replaceAll('{boss}', boss.name);
}

/** Record the aftermath of a boss win. Once per boss per run: a repeat call changes nothing. Returns the new line or null. */
export function recordAftermath(run: RunState, bossId: string): string | null {
  const key = `after:${bossId}`;
  if (run.story.flags[key] !== undefined) return null;
  const line = aftermathLine(run.seed, bossId);
  if (!line) return null;
  run.story.flags[key] = line;
  return line;
}

/** The aftermath lines of this run, in the order the bosses were beaten (flags keep insertion order), at most `max` newest. */
export function aftermathLines(run: RunState, max = 3): string[] {
  const lines = Object.entries(run.story.flags).filter(([k]) => k.startsWith('after:')).map(([, v]) => String(v));
  return lines.slice(-max);
}
