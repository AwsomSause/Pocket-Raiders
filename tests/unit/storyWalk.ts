// Story Overhaul S19: walks a Story Run on the real engine with a bot choosing the route.
// The lead is a level-500 cheat and every foe is left at 1 HP, so the walk measures the story (Stops, Acts, ending), not the fights.

import { isStoryCampaign } from '../../src/core/campaign/circuit';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseNodeWithNotes, chooseStarter, createRun, debugHealParty, mapChoices, resolveDecision, takeTurn } from '../../src/core/run';
import { botPick, type BotKind, type BotNode } from '../../src/core/story2/bots';
import type { RunState } from '../../src/core/state';
import { content, takeAnyReward } from './helpers';

export interface WalkResult {
  run: RunState;
  bot: BotKind;
  seed: string;
  /** Stops played / planned, nodes walked, and the loop's action count. */
  played: number;
  planned: number;
  nodes: number;
  actions: number;
  /** The run reached the Champion's end and the Epilogue Stop played. */
  ending: boolean;
  error?: string;
}

export function walkStoryRun(bot: BotKind, seed: string, archetypeId = 'red'): WalkResult {
  const rng = new Rng(hashSeed(`${seed}::bot::${bot}`));
  let run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId, campaignId: 'orrery-circuit' }), 0);
  if (!isStoryCampaign(content, run.campaignId)) throw new Error('not a story campaign');
  const lead = createPokemon(content, 'houndoom', 500, run.party[0]!.uid);
  lead.moves = [{ id: 'flamethrower', pp: 64 }, { id: 'crunch', pp: 64 }];
  run.party[0] = lead;
  // Three reserves, so a surprise knock-out (a foe's lucky first strike) switches in a healthy Pokémon instead of ending the walk.
  for (let i = 1; i <= 3; i++) {
    const reserve = createPokemon(content, 'houndoom', 500, `${lead.uid}-r${i}`);
    reserve.moves = [{ id: 'flamethrower', pp: 64 }, { id: 'crunch', pp: 64 }];
    run.party.push(reserve);
  }
  let nodes = 0;
  let actions = 0;
  let error: string | undefined;
  try {
    for (; actions < 20000 && run.phase !== 'over'; actions++) {
      if (run.phase === 'map') {
        const choices = mapChoices(content, run);
        if (choices.length === 0) { error = `no map choices at stage ${run.stage?.index}`; break; }
        const done = new Set(run.story.v2?.stops.done ?? []);
        const stops = new Map((run.story.v2?.blueprint?.stops ?? []).map((s) => [s.id, s]));
        const view: BotNode[] = choices.map((n) => {
          const on = (n.storyStops ?? []).flatMap((id) => (stops.has(id) ? [stops.get(id)!] : []));
          return { kind: n.kind, harder: n.harder, stops: on, unplayed: on.filter((s) => !done.has(s.id)) };
        });
        run = chooseNodeWithNotes(content, debugHealParty(content, run), choices[botPick(bot, view, rng)]!.id).run;
        nodes++;
      } else if (run.phase === 'battle') {
        if (run.battle!.needsSwitch) {
          const next = run.party.findIndex((m) => m.hp > 0);
          if (next < 0) { error = 'whole party fainted'; break; }
          run = takeTurn(content, run, { kind: 'switch', partyIndex: next }).run;
          continue;
        }
        // Foes are left at 1 HP with no PP (they can only Struggle), so no foe can end the walk.
        for (const m of run.battle!.enemyTeam) { m.hp = Math.min(m.hp, 1); for (const mv of m.moves) mv.pp = 0; }
        const active = run.party[run.battle!.activeIndex]!;
        if (active.hp > 0) active.hp = maxHp(content, active);
        for (const mv of active.moves) mv.pp = Math.max(mv.pp, 32);
        run = takeTurn(content, run, { kind: 'move', index: 1 }).run;
      } else if (run.phase === 'reward') run = takeAnyReward(run);
      else if (run.phase === 'decision') run = resolveDecision(content, run, run.pending[0]!.kind === 'caught' ? { kind: 'release' } : { kind: 'skipMove' }).run;
      else { error = `stuck in phase ${run.phase}`; break; }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const v2 = run.story.v2;
  const epilogue = v2?.blueprint?.stops.find((s) => s.slotTags.includes('epilogue'));
  return {
    run, bot, seed, nodes, actions, error,
    played: v2?.stops.done.length ?? 0, planned: v2?.stops.planned ?? 0,
    ending: !!epilogue && !!v2?.stops.done.includes(epilogue.id),
  };
}
