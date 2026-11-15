// Test helper for the Greenneedle events: opens an event on the node the player stands on, picks choices by their label
// and fights the battles through the real engine (the foe is weakened so the test decides who wins, not the dice).
import { chooseEvent, eventView } from '../../../src/core/events';
import { effectiveEvent } from '../../../src/core/eventMemory';
import { maxHp } from '../../../src/core/pokemon';
import { chooseStarter, createRun, takeTurn } from '../../../src/core/run';
import type { RunState } from '../../../src/core/state';
import { step } from '../autoplay';
import { content } from '../helpers';

export const gnRun = (seed: string): RunState => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  run.stage!.current = run.stage!.map.nodes.find((n) => n.column === 1)!.id;
  return run;
};

export const flagOf = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
export const setFlag = (run: RunState, key: string, n = 1): void => {
  run.story.flags[`ev:${key}`] = n;
};

/** Puts an event stop on the node the player stands on and returns its side id. */
export function open(run: RunState, eventId: string): string {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  const id = `t-${here.sides.length + 1}-${eventId}`;
  here.sides.push({ id, kind: 'event', used: false, eventId });
  return id;
}

/** The unused event stop on the current node (the room the story just opened). */
export function openSide(run: RunState): { id: string; eventId: string } | undefined {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current);
  const side = here?.sides.find((s) => s.kind === 'event' && !s.used && s.eventId);
  return side ? { id: side.id, eventId: side.eventId! } : undefined;
}

/** What the player sees at an event: its intro and the labels of the listed choices. */
export function scene(run: RunState, eventId: string): { intro: string; labels: string[] } {
  const e = effectiveEvent(content, run, content.events.get(eventId)!);
  return { intro: e.intro, labels: e.choices.map((c) => c.label) };
}

/** Picks a choice by its label at the open stop of `eventId`. */
export function choose(run: RunState, eventId: string, label: string): { run: RunState; text: string; changes: string[]; battle: boolean; success: boolean } {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current);
  const side = here?.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === eventId);
  if (!side) throw new Error(`no open stop for ${eventId} (open: ${openSide(run)?.eventId ?? 'none'})`);
  const labels = scene(run, eventId).labels;
  const index = labels.indexOf(label);
  if (index < 0) throw new Error(`${eventId} has no choice "${label}" (has: ${labels.join(' | ')})`);
  return chooseEvent(content, run, side.id, index);
}

/** Fights the open battle to a win (foes held at 1 HP, your Pokémon kept healthy), then clicks through to the map. */
export function win(current: RunState, o: { catchIt?: boolean } = {}): RunState {
  let run = current;
  let guard = 0;
  while (run.phase !== 'map' && run.phase !== 'over' && guard++ < 400) {
    if (run.phase === 'battle') {
      const b = run.battle!;
      run = structuredClone(run);
      for (const foe of run.battle!.enemyTeam) if (foe.hp > 1) foe.hp = 1;
      for (const mon of run.party) if (mon.hp > 0) mon.hp = maxHp(content, mon);
      if (o.catchIt && b.kind === 'wild') {
        run.inventory['master-ball'] = 1;
        run = takeTurn(content, run, { kind: 'item', itemId: 'master-ball' }).run;
        continue;
      }
    }
    run = step(content, run).run;
  }
  if (run.phase !== 'map') throw new Error(`stuck in phase ${run.phase}`);
  return run;
}

/** Loses the open battle (your Pokémon are dropped to 1 HP and the foe is made sturdy), then clicks through to the map. */
export function lose(current: RunState): RunState {
  let run = current;
  let guard = 0;
  while (run.phase !== 'map' && run.phase !== 'over' && guard++ < 400) {
    if (run.phase === 'battle') {
      run = structuredClone(run);
      for (const mon of run.party) if (mon.hp > 1) mon.hp = 1;
      for (const foe of run.battle!.enemyTeam) if (foe.hp > 0) foe.hp = maxHp(content, foe);
    }
    run = step(content, run).run;
  }
  return run;
}

void eventView;
