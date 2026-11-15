import { describe, expect, it } from 'vitest';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

describe('gn.03 Viridian Forest', () => {
  it('draws six nodes, one per column, from its own rooms', () => {
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_forest')!;
    const rooms = chainRooms(content, chain);
    expect(rooms.map((r) => `${r.depth}:${r.event}`)).toEqual(['1:gn-03-eaves', '2:gn-03-gift', '3:gn-03-oak', '4:gn-03-hollow', '5:gn-03-clearing', '6:gn-03-duel']);
  });
  it('plays from the door to the duel: the caught Bug-type is the duelist, the Samurai judges it, and a win names Samurai Slash', () => {
    let run = gnRun('gn03-a');
    const parent = run.stage!.index;
    open(run, 'gn-03-door');
    run = choose(run, 'gn-03-door', 'Step under the trees.').run;
    expect(run.stage!.pseudo?.id).toBe('ps_gn_forest');
    expect(flagOf(run, 'gn-forest-in')).toBe(1);
    setFlag(run, 'gn-forest-fog', 0);
    setFlag(run, 'gn-forest-trap', 0);
    expect(openSide(run)?.eventId).toBe('gn-03-eaves');
    run = win(choose(run, 'gn-03-eaves', 'Battle Bug Catcher Arlo.').run);
    expect(openSide(run)?.eventId).toBe('gn-03-gift');
    run = win(choose(run, 'gn-03-gift', 'Part the ferns.').run, { catchIt: true });
    expect(openSide(run)?.eventId).toBe('gn-03-oak');
    expect(scene(run, 'gn-03-oak').labels).toContain('Battle the Bug Catcher in the fork.');
    expect(scene(run, 'gn-03-oak').labels).not.toContain('Walk on, deeper in.');
    run = win(choose(run, 'gn-03-oak', 'Battle the Bug Catcher in the fork.').run);
    const duelist = run.party.find((m) => m.gn?.some((t) => t.startsWith('duelist:')));
    expect(duelist).toBeTruthy();
    expect(flagOf(run, 'gn-forest-duelist')).toBe(1);
    // The voice from the trees speaks from what was counted (the duelist sat out: "luggage").
    expect(scene(run, 'gn-03-oak').intro).toMatch(/A voice/);
    run = choose(run, 'gn-03-oak', 'Walk on, deeper in.').run;
    run = win(choose(run, 'gn-03-hollow', 'Battle the Bug Catcher across the dip.').run);
    expect(openSide(run)?.eventId).toBe('gn-03-clearing');
    expect(RunStateSchema.safeParse(run).success).toBe(true);
    // Whatever he thinks of it, the stage and node count never moved.
    expect(run.stage!.index).toBe(parent);
    // He judges the duelist by how much it fought (it sat out every fight here: "a stranger").
    expect(flagOf(run, 'gn-forest-rank')).toBe(0);
    expect(scene(run, 'gn-03-clearing').intro).toMatch(/You brought me a stranger/);
    expect(scene(run, 'gn-03-clearing').labels).toEqual(['Fight one battle beside it, here, now.', 'Bow, and leave the forest.']);
    run = win(choose(run, 'gn-03-clearing', 'Fight one battle beside it, here, now.').run);
    expect(flagOf(run, 'gn-forest-rank')).toBeGreaterThanOrEqual(1);
    expect(scene(run, 'gn-03-clearing').intro).toMatch(/It'll do\. Barely\./);
    setFlag(run, 'gn-forest-rank', 2);
    expect(scene(run, 'gn-03-clearing').intro).toMatch(/I accept\./);
    expect(scene(run, 'gn-03-clearing').labels).toEqual(['Step onto the duelling ground.']);
    run = choose(run, 'gn-03-clearing', 'Step onto the duelling ground.').run;
    expect(scene(run, 'gn-03-duel').labels).toEqual(['Begin.']);
    const started = choose(run, 'gn-03-duel', 'Begin.').run;
    // One on one: the duelist leads, the Samurai sends one Pokémon at its level, no items, no switching.
    expect(started.party[started.battle!.activeIndex]!.gn?.[0]).toMatch(/^duelist:/);
    expect(started.battle!.enemyTeam).toHaveLength(1);
    expect(started.battle!.enemyTeam[0]!.level).toBe(started.party[started.battle!.activeIndex]!.level);
    expect(started.battle!.eventRule).toMatchObject({ gn: 'samurai', noSwitch: true, noItems: true, suddenDeath: true });
    // A win: he names the cut, and the forest lets go.
    const won = win(started);
    expect(flagOf(won, 'kanto-forest-samurai-won')).toBe(1);
    expect(scene(won, 'gn-03-duel').intro).toMatch(/I'm only naming it/);
    expect(scene(won, 'gn-03-duel').labels).toEqual(['Take what he names.']);
    const done = choose(won, 'gn-03-duel', 'Take what he names.').run;
    expect(done.stage!.pseudo).toBeUndefined();
    expect(done.stage!.index).toBe(parent);
    expect(done.party.some((m) => m.moves.some((x) => x.id === 'samurai-slash'))).toBe(true);
    expect(done.party.some((m) => m.gn?.some((t) => t.startsWith('duelist')))).toBe(false);
    expect(flagOf(done, 'gn-03-done')).toBe(1);
    expect(RunStateSchema.safeParse(done).success).toBe(true);
    // A duelist that evolved inside the forest also earns the egg.
    const evolved = structuredClone(won);
    setFlag(evolved, 'gn-forest-evolved', 1);
    expect(scene(evolved, 'gn-03-duel').labels).toEqual(['Take what he names, and the egg.']);
    const eggs = choose(evolved, 'gn-03-duel', 'Take what he names, and the egg.').run;
    expect(eggs.eggs?.length ?? 0).toBe((won.eggs?.length ?? 0) + 1);
    // A loss: Silver Powder, a rematch owed, the run goes on outside the forest.
    const lost = lose(started);
    expect(lost.phase).toBe('map');
    expect(lost.stage!.pseudo).toBeUndefined();
    expect(flagOf(lost, 'samurai-rematch-owed')).toBe(1);
    expect(content.events.get('gn-03-rematch')!.requires.length).toBeGreaterThan(0);
  });
  it('the door rolls fog and the hunters\' trap once, and never appears again after it was entered', () => {
    let fog = 0;
    let trap = 0;
    for (let i = 0; i < 200; i++) {
      let run = gnRun(`gn03-roll-${i}`);
      open(run, 'gn-03-door');
      run = choose(run, 'gn-03-door', 'Step under the trees.').run;
      fog += flagOf(run, 'gn-forest-fog');
      trap += flagOf(run, 'gn-forest-trap');
      if (i === 0) expect(flagOf(run, 'gn-03-entered')).toBe(1);
    }
    expect(fog).toBeGreaterThan(5);
    expect(fog).toBeLessThan(45);
    expect(trap).toBeGreaterThan(5);
    expect(trap).toBeLessThan(45);
  });
});
