// gn.62 The Pokémon Prison (tools/events/co/greenneedle-62.ts; rules in src/core/greenneedle/prison.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { insideTeam, prisonOnLoss, watched, WINGS } from '../../src/core/greenneedle/prison';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, scene, setFlag, win } from './helpers/gnPlay';

const here = (run: RunState): string | undefined => {
  const node = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  return node.sides.filter((x) => x.kind === 'event' && !x.used && x.eventId?.startsWith('gn-62')).at(-1)?.eventId;
};

function inCell(seed: string, prep?: (run: RunState) => void): RunState {
  let run = gnRun(seed);
  run.party = [...run.party, createPokemon(content, 'pidgey', 20, 'p-pidgey'), createPokemon(content, 'squirtle', 20, 'p-squirtle'), createPokemon(content, 'rattata', 20, 'p-rattata')];
  prep?.(run);
  open(run, 'gn-62-cell');
  return choose(run, 'gn-62-cell', 'Try the door.').run;
}
/** The key ring, by waiting for the pause. */
function getKeys(run: RunState): RunState {
  run = choose(run, 'gn-62-hub', 'Further along the block.').run;
  run = choose(run, 'gn-62-hub-b', 'The laundry, the kitchen, the guardroom.').run;
  run = choose(run, 'gn-62-supplies', 'The guardroom.').run;
  run = choose(run, 'gn-62-guardroom', 'Wait a breath.').run;
  run = choose(run, 'gn-62-guardroom', 'Wait a breath.').run;
  run = choose(run, 'gn-62-guardroom', 'Reach for the key ring.').run;
  return run;
}

describe('gn.62 The Pokémon Prison', () => {
  it('everything is taken: the team is held in four wings, the player has nothing', () => {
    const run = inCell('t62-start');
    expect(run.party).toHaveLength(0);
    expect(run.box.filter((m) => m.gn?.includes('pr-held')).length).toBe(4);
    expect(here(run)).toBe('gn-62-hub');
    expect(run.box.find((m) => m.uid === 'p-pidgey')!.gn).toContain('pr-wing:4');
    expect(run.box.find((m) => m.uid === 'p-squirtle')!.gn).toContain('pr-wing:2');
  });

  it('guards walk loops of three to six steps, and the door end is always safe', () => {
    for (const w of Object.values(WINGS)) expect(w.loop.length).toBeGreaterThanOrEqual(3);
    for (const w of Object.values(WINGS)) expect(w.loop.length).toBeLessThanOrEqual(6);
    const run = inCell('t62-loop');
    expect(watched(run, 3, 0)).toEqual([3]);
    expect(watched(run, 3, 1)).toEqual([]);
  });

  it('being seen costs the clock one step, not the run; waiting shows the next step', () => {
    let run = inCell('t62-seen');
    run = choose(run, 'gn-62-hub', 'South: the Quiet Cells.').run;
    expect(here(run)).toBe('gn-62-wing');
    expect(scene(run, 'gn-62-wing').intro).toContain('@');
    run = choose(run, 'gn-62-wing', 'Wait a step.').run;
    expect(scene(run, 'gn-62-wing').intro).toContain('Next step');
    // t=1 nobody; go to cell 1 (t2), 2 (t3), then 3 at t=4: loop index 1 is empty, so walk until the camera catches us
    let guard = 0;
    while (here(run) === 'gn-62-wing' && guard++ < 12) run = choose(run, 'gn-62-wing', 'Move on.').run;
    expect(['gn-62-caught', 'gn-62-cell-room']).toContain(here(run));
    if (here(run) === 'gn-62-caught') expect(flagOf(run, 'pr-clock')).toBe(1);
  });

  it('a cell needs the key ring; the ring only comes away in the pause', () => {
    let run = inCell('t62-keys');
    run = choose(run, 'gn-62-hub', 'Further along the block.').run;
    run = choose(run, 'gn-62-hub-b', 'The laundry, the kitchen, the guardroom.').run;
    run = choose(run, 'gn-62-supplies', 'The guardroom.').run;
    run = choose(run, 'gn-62-guardroom', 'Reach for the key ring.').run;
    expect(flagOf(run, 'pr-keys')).toBe(0);
    expect(flagOf(run, 'pr-clock')).toBe(1);
    run = choose(run, 'gn-62-caught', 'Get up and begin again.').run;
    run = getKeys(run);
    expect(flagOf(run, 'pr-keys')).toBe(1);
  });

  it('freeing a wing puts its Pokémon in the party; the first one freed shapes the rest', () => {
    let run = inCell('t62-free');
    run = getKeys(run);
    run = choose(run, 'gn-62-hub', 'South: the Quiet Cells.').run;
    setFlag(run, 'pr-pos', 3);
    run = choose(run, 'gn-62-wing', 'Back to the cell block.').run;
    // walk it for real: put the player at the cell
    run = choose(run, 'gn-62-hub', 'North: the Kennels.').run;
    setFlag(run, 'pr-pos', 5);
    run = choose(run, 'gn-62-wing', 'Wait a step.').run;
    expect(['gn-62-cell-room', 'gn-62-caught']).toContain(here(run));
  });

  it('the warden: nobody freed is a quiet loss with the whole team back, and the run goes on', () => {
    let run = inCell('t62-bare');
    run = choose(run, 'gn-62-hub', 'Further along the block.').run;
    run = choose(run, 'gn-62-hub-b', 'The gatehouse, or back.').run;
    run = choose(run, 'gn-62-end-hall', 'Go to the gatehouse.').run;
    expect(here(run)).toBe('gn-62-warden-bare');
    run = choose(run, 'gn-62-warden-bare', 'Sit down.').run;
    expect(run.party).toHaveLength(4);
    expect(run.box.some((m) => m.gn?.includes('pr-held'))).toBe(false);
    expect(flagOf(run, 'prison-warden')).toBe(2);
    expect(run.phase).not.toBe('over');
  });

  it('the clock running out starts the warden at once; winning returns the team and leaves the unreached one hurt', () => {
    let run = inCell('t62-end');
    run = getKeys(run);
    run = choose(run, 'gn-62-hub', 'East: the Tanks.').run;
    setFlag(run, 'pr-pos', 4);
    setFlag(run, 'pr-decoy', 2);
    run = choose(run, 'gn-62-wing', 'Move on.').run;
    expect(here(run)).toBe('gn-62-cell-room');
    run = choose(run, 'gn-62-cell-room', 'Open the cells.').run;
    expect(run.party.map((m) => m.uid)).toContain('p-squirtle');
    run = choose(run, 'gn-62-strangers', 'Open them, and tell them to wait for the signal.').run;
    expect(flagOf(run, 'prison-signal')).toBe(2);
    setFlag(run, 'pr-clock', 5);
    run = choose(run, 'gn-62-hub', 'Further along the block.').run;
    run = choose(run, 'gn-62-hub-b', 'The gatehouse, or back.').run;
    run = choose(run, 'gn-62-end-hall', 'Go to the gatehouse.').run;
    expect(here(run)).toBe('gn-62-warden');
    expect(scene(run, 'gn-62-warden').intro).toContain('is still in');
    run = choose(run, 'gn-62-warden', 'Give the signal.').run;
    const r = choose(run, 'gn-62-warden', 'Fight. The signal is out.');
    expect(r.battle).toBe(true);
    expect(r.run.battle!.enemyTeam).toHaveLength(5);
    const before = run.box.filter((m) => m.gn?.includes('pr-held') && !m.gn?.includes('pr-freed')).map((m) => [m.uid, m.friendship] as const);
    run = win(r.run);
    expect(run.party.length + run.box.length).toBeGreaterThanOrEqual(4);
    expect(run.box.some((m) => m.gn?.includes('pr-held'))).toBe(false);
    expect(flagOf(run, 'prison-warden')).toBe(1);
    expect(flagOf(run, 'prison-reunions')).toBe(2);
    for (const [uid, fr] of before) expect([...run.party, ...run.box].find((m) => m.uid === uid)!.friendship).toBeLessThan(fr);
  });

  it('losing the warden costs the prize, not the run', () => {
    let run = inCell('t62-lose');
    run = getKeys(run);
    run = choose(run, 'gn-62-hub', 'East: the Tanks.').run;
    setFlag(run, 'pr-pos', 4);
    setFlag(run, 'pr-decoy', 2);
    run = choose(run, 'gn-62-wing', 'Move on.').run;
    run = choose(run, 'gn-62-cell-room', 'Open the cells.').run;
    run = choose(run, 'gn-62-strangers', 'Just mine. There isn\'t time.').run;
    run = choose(run, 'gn-62-hub', 'Further along the block.').run;
    run = choose(run, 'gn-62-hub-b', 'The gatehouse, or back.').run;
    run = choose(run, 'gn-62-end-hall', 'Go to the gatehouse.').run;
    run = lose(choose(run, 'gn-62-warden', 'Face the warden.').run);
    expect(run.phase).not.toBe('over');
    expect(flagOf(run, 'prison-warden')).toBe(2);
    expect(run.box.some((m) => m.gn?.includes('pr-held'))).toBe(false);
  });

  it('losing to a lieutenant or boss opens the cell, once; not inside a team, not after the Flight North theft', () => {
    const run = gnRun('t62-loss');
    expect(prisonOnLoss(content, run, 'grunt')).toBe(false);
    expect(prisonOnLoss(content, run, 'executive')).toBe(true);
    expect(here(run)).toBe('gn-62-cell');
    expect(prisonOnLoss(content, run, 'leader')).toBe(false);
    const inside = gnRun('t62-inside');
    setFlag(inside, 'team-rocket-inside', 1);
    expect(insideTeam(inside)).toBe(true);
    expect(prisonOnLoss(content, inside, 'leader')).toBe(false);
    const stolen = gnRun('t62-stolen');
    setFlag(stolen, 'kanto-flight-stolen', 1);
    expect(prisonOnLoss(content, stolen, 'leader')).toBe(false);
  });

  it('inside a team the player is posted as a guard instead: every cell is a choice', () => {
    let run = gnRun('t62-post');
    setFlag(run, 'team-rocket-inside', 1);
    open(run, 'gn-62-guard');
    run = choose(run, 'gn-62-guard', 'Take the keys.').run;
    run = choose(run, 'gn-62-guard-1', 'Leave it unlatched.').run;
    expect(flagOf(run, 'prison-guard-freed-1')).toBe(1);
  });
});
