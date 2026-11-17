// The Event Director (Electric §2C): story-aware eligibility and remembered choices.

import { describe, expect, it } from 'vitest';
import { conditionMet, eligibleEvents } from '../../src/core/events';
import { createPokemon } from '../../src/core/pokemon';
import { registerRival } from '../../src/core/rivals/overhaul';
import { mainRival } from '../../src/core/rivals/questlines';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

function late(seed: string) {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  run.regionIndex = Math.min(3, run.regionOrder.length - 1);
  return run;
}
const ids = (run: ReturnType<typeof late>) => eligibleEvents(content, run).map((e) => e.id);

describe('Event Director conditions', () => {
  it('a legendary in the party makes the researcher eligible; nobody else sees it', () => {
    const run = late('dir-ev-a');
    expect(ids(run)).not.toContain('researcher-recognizes-legendary');
    const legend = [...content.species.values()].find((s) => s.tags.includes('legendary'))!;
    run.party.push(createPokemon(content, legend.id, 30, 'legend'));
    expect(ids(run)).toContain('researcher-recognizes-legendary');
  });

  it('a bond, a fought rival and the region focus each unlock their own event', () => {
    const run = late('dir-ev-b');
    expect(ids(run)).not.toContain('quiet-bond');
    expect(ids(run)).not.toContain('old-rival-old-friend');
    run.story.relationships.push({ open: true, kind: 'bond', a: { kind: 'pokemon', id: 'a' }, b: { kind: 'pokemon', id: 'b' } } as never);
    run.story.rivals.push({ id: 'blue', encounters: 3 } as never);
    expect(ids(run)).toContain('quiet-bond');
    // Catalog batch 5: the old rival is now a rival beat, gated by the rival's feelings too (respect 3+).
    expect(ids(run)).not.toContain('old-rival-old-friend');
    registerRival(run, { id: 'blue', role: 'main', personality: 'underdog', style: 'blitz', arc: 'prodigy-learns-humility' }).feelings.respect = 3;
    expect(mainRival(run)?.id).toBe('blue');
    // Its stage comes from the catalog placement and its turn from the rival slot (a due questline beat goes first; covered in
    // rivalQuestlines.test.ts), so check the rival gates themselves here.
    const gates = content.events.get('old-rival-old-friend')!.requires.filter((c) => !(c.kind === 'rivalQuest' && c.slotFree));
    expect(gates.every((c) => conditionMet(content, run, c))).toBe(true);
    run.expansion!.rival!.blue!.feelings.respect = 2;
    expect(gates.every((c) => conditionMet(content, run, c))).toBe(false);
  });

  it('the Overdrive unusual events are rare', () => {
    for (const id of ['doesnt-want-to-fight', 'it-saw-what-you-did', 'this-place-remembers']) expect(content.events.get(id)!.rarity).toBe('rare');
  });
});

describe('a rival who became a friend (left-out 2.2)', () => {
  it('only an allied rival offers a gift or a swap, and the gift adds a Pokémon', () => {
    const run = late('dir-ev-ally');
    run.party.push(createPokemon(content, 'rattata', 5, 'extra'));
    run.story.rivals.push({ encounters: 3, state: 'recurring' } as never);
    run.story.rivals[0]!.state = 'ally';
    // Catalog Overhaul row 12: the ally's gift merged into R15's gift (rival-trap-gift) and is retired, never drawn;
    // the swap is now R7's finale (Borrowed Team), drawn only by the rival questline schedule.
    expect(content.events.get('rival-gift')!.disabled).toBe(true);
    expect(ids(run)).not.toContain('rival-gift');
    expect(ids(run)).not.toContain('rival-swap');
    expect(content.events.get('rival-swap')!.requires).toContainEqual({ kind: 'rivalQuest', beat: 'R7.finale' });
  });
});
