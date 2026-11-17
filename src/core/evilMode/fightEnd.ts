// Evil Mode: a battle the day was waiting on has ended (design Part 30 section 6.2 `battleResult`). Called by the battle
// rules (run.ts takeTurn) for an Evil Mode run, before any of the main game's after-battle steps: no prize, no node, and
// a loss never ends the run (Part 1: a loss costs a holding, never the run). Doesn't import run.ts (it's called from there).

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { EVIL_DATA } from './data';
import { step } from './day';
import { counterDue } from './hero';
import { isEvilRun } from './session';
import type { EvilModeBlock } from './schema';

/** True while an Evil Mode run's battle is one the day is waiting on. */
export const evilFightOn = (run: RunState): boolean => isEvilRun(run) && !!run.expansion?.evilMode?.fight?.begun && !!run.battle;

/** The Hero's rival record (the rival system's own: party, traits, voice). Read, never copied into the block. */
export const heroRival = (run: Pick<RunState, 'story'>, block: EvilModeBlock | undefined) =>
  (block?.hero ? run.story.rivals.find((r) => r.id === block.hero!.rivalId) : undefined);

/** Puts the Boss's party back after a posted person's kit fought, in the order it was. Mutates `run`. */
export function giveBackParty(run: RunState, lent: readonly string[]): void {
  if (!lent.length) return;
  const back = lent.map((uid) => (run.box ?? []).find((m) => m.uid === uid)).filter((m): m is NonNullable<typeof m> => !!m);
  run.box = (run.box ?? []).filter((m) => !lent.includes(m.uid));
  run.party = back;
}

/**
 * The battle's over: the party's healed and given back, the battle's gone, the run's back on the day, and the result's
 * stepped into the block. Returns the lines the battle screen reads out. Mutates `run` (it's the battle rules' copy).
 */
export function endEvilFight(content: Content, run: RunState, won: boolean, heal: (content: Content, run: RunState) => void): string[] {
  const block = run.expansion!.evilMode!;
  const f = block.fight!;
  const fielded = f.kind === 'hold' ? [...new Set((run.battle?.enemyTeam ?? []).map((m) => m.speciesId))] : [];
  giveBackParty(run, f.lent ?? []);
  heal(content, run);
  run.battle = null;
  run.phase = 'map';
  const r = step(block, { type: 'battleResult', won, fielded });
  let out = r.block;
  // The counter: caught after the third battle with the team (Part 18 section 6.1), by the team's Doctrine. In the record.
  const rival = heroRival(run, out);
  const counter = EVIL_DATA.hero.counters[out.team.doctrine];
  const team = rival?.memory?.lastBattle?.team;
  if (rival && team && out.hero && counter && counterDue(out.hero) && !team.includes(counter) && content.species.has(counter)) team.push(counter);
  run.expansion = { ...(run.expansion ?? {}), evilMode: out };
  const lines: string[] = [];
  for (const c of r.cues) if (c.id === 'said') lines.push(c.line);
  if (out.district?.end) lines.push(out.evening.at(-1) ?? '');
  return lines.filter(Boolean);
}

