import { describe, expect, it } from 'vitest';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import { RunStateSchema } from '../../src/core/state';
import { conditionMet } from '../../src/core/events';
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

describe('gn.04 Mt. Moon', () => {
  const enter = (seed: string) => {
    let run = gnRun(seed);
    open(run, 'gn-04-door');
    run = choose(run, 'gn-04-door', 'Go in.').run;
    return run;
  };
  const toDance = (seed: string) => {
    let run = enter(seed);
    run = choose(run, 'gn-04-mouth', 'Follow the lamp in.').run;
    const label = scene(run, 'gn-04-tunnels').labels[0]!;
    run = win(choose(run, 'gn-04-tunnels', label).run); // a chain of two fights
    for (const m of run.party) m.hp = 1;
    run = choose(run, 'gn-04-camp', 'Rest by the fire.').run;
    expect(run.party.every((m) => m.hp > 1)).toBe(true);
    return run;
  };
  it('draws seven nodes, one per column', () => {
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_moon')!;
    expect(chainRooms(content, chain).map((r) => `${r.depth}:${r.event}`)).toEqual([
      '1:gn-04-mouth', '2:gn-04-tunnels', '3:gn-04-camp', '4:gn-04-dance', '5:gn-04-fossil', '6:gn-04-mine', '7:gn-04-far',
    ]);
  });
  it('the moon phase comes from the stage number, and the door opens the cave', () => {
    const run = enter('gn04-door');
    expect(run.stage!.pseudo?.id).toBe('ps_gn_moon');
    expect(flagOf(run, 'gn-moon-phase')).toBe(1); // stage 1: new moon
    expect(openSide(run)?.eventId).toBe('gn-04-mouth');
  });
  it('three right answers: a Clefairy joins knowing Moonblast; the dance stays one node', () => {
    let run = toDance('gn04-dance');
    const node = run.stage!.current;
    run = choose(run, 'gn-04-dance', 'Keep to the shadows, and watch.').run;
    setFlag(run, 'gn-moon-mistaken', 0);
    setFlag(run, 'gn-moon-secret', 0);
    run = choose(run, 'gn-04-dance-1', 'Stay still.').run;
    run = choose(run, 'gn-04-dance-2', 'Stay quiet, and offer a Berry back.').run;
    const looked = choose(run, 'gn-04-dance-3', 'Look up, too.');
    expect(looked.text).toMatch(/The moon is exactly over the hole/);
    run = looked.run;
    expect(run.stage!.current).toBe(node);
    expect(flagOf(run, 'gn-moon-right')).toBe(3);
    expect(scene(run, 'gn-04-dance-end').labels).toEqual(['Let it come with you.']);
    const before = run.party.length + (run.box?.length ?? 0);
    run = win(choose(run, 'gn-04-dance-end', 'Let it come with you.').run); // the join prompt is accepted
    const clef = [...run.party, ...(run.box ?? [])].find((m) => m.speciesId === 'clefairy');
    expect(clef?.moves.some((m) => m.id === 'moonblast')).toBe(true);
    expect(run.party.length + (run.box?.length ?? 0)).toBe(before + 1);
    expect(flagOf(run, 'kanto-moon-clefairy')).toBe(1);
    expect(openSide(run)?.eventId).toBe('gn-04-fossil');
  });
  it('clapping ends the dance: they do not come back, a shard is left', () => {
    let run = toDance('gn04-clap');
    run = choose(run, 'gn-04-dance', 'Keep to the shadows, and watch.').run;
    setFlag(run, 'gn-moon-mistaken', 1);
    run = choose(run, 'gn-04-dance-1', 'Clap.').run;
    expect(flagOf(run, 'gn-moon-mistaken')).toBe(0);
    expect(scene(run, 'gn-04-dance-end').labels).toEqual(['Pick up the shard.']);
    run = choose(run, 'gn-04-dance-end', 'Pick up the shard.').run;
    expect(openSide(run)?.eventId).toBe('gn-04-fossil');
  });
  it('two right at full moon is enough; two right otherwise is a Moon Stone', () => {
    const run = toDance('gn04-full');
    setFlag(run, 'gn-moon-right', 2);
    setFlag(run, 'gn-moon-phase', 3);
    expect(scene(run, 'gn-04-dance-end').labels).toEqual(['Let it come with you.']);
    setFlag(run, 'gn-moon-phase', 1);
    expect(scene(run, 'gn-04-dance-end').labels).toEqual(['Pick up the Moon Stone.']);
  });
  it('the mistaken Clefairy (20%) and then the secret dance (25% with a Clefairy along) come before the fossils', () => {
    let run = toDance('gn04-secret');
    run = choose(run, 'gn-04-dance', 'Keep to the shadows, and watch.').run;
    setFlag(run, 'gn-moon-mistaken', 1);
    setFlag(run, 'gn-moon-secret', 1);
    run = choose(run, 'gn-04-dance-1', 'Join in.').run;
    run = choose(run, 'gn-04-dance-2', 'Take it.').run;
    run = choose(run, 'gn-04-dance-3', 'Shoo it back.').run;
    run = choose(run, 'gn-04-dance-end', 'Pick up the shard.').run;
    expect(openSide(run)?.eventId).toBe('gn-04-dance-mistaken');
    const lead = run.party[0]!.friendship;
    run = choose(run, 'gn-04-dance-mistaken', 'Let it dance one round.').run;
    expect(run.party[0]!.friendship).toBe(Math.min(255, lead + 5));
    expect(openSide(run)?.eventId).toBe('gn-04-dance-secret');
    const eggs = run.eggs?.length ?? 0;
    run = choose(run, 'gn-04-dance-secret', 'Watch until the end.').run;
    expect(run.eggs?.length ?? 0).toBe(eggs + 1);
    expect(openSide(run)?.eventId).toBe('gn-04-fossil');
  });
  it('without a Clefairy or Clefable along, the secret never shows', () => {
    let run = toDance('gn04-noclef');
    run = choose(run, 'gn-04-dance', 'Keep to the shadows, and watch.').run;
    expect(flagOf(run, 'gn-moon-clef')).toBe(0);
    expect(flagOf(run, 'gn-moon-secret')).toBe(0);
  });
  it('fossils: the third one is free; a raid lost puts Crowe on the payroll at +1', () => {
    let run = toDance('gn04-fossil');
    run = choose(run, 'gn-04-dance', 'Leave them to it, and go on.').run;
    expect(scene(run, 'gn-04-fossil').labels).toEqual(['Battle Dr. Crowe.', 'Battle Dr. Larkin.', 'Can I have the third one?']);
    const raid = structuredClone(run);
    setFlag(raid, 'team-raid-moon-lost', 1);
    expect(scene(raid, 'gn-04-fossil').intro).toMatch(/payroll/);
    const crowe = choose(raid, 'gn-04-fossil', 'Battle Dr. Crowe.').run;
    const larkin = choose(structuredClone(run), 'gn-04-fossil', 'Battle Dr. Larkin.').run;
    expect(crowe.battle!.enemyTeam[0]!.level).toBe(larkin.battle!.enemyTeam[0]!.level + 1);
    expect(crowe.battle!.enemyTeam.map((m) => m.speciesId).sort()).toEqual(['koffing', 'magnemite', 'voltorb'].map((s) => crowe.battle!.enemyTeam.find((m) => m.speciesId.startsWith(s.slice(0, 4)))?.speciesId ?? s).sort());
    const third = choose(run, 'gn-04-fossil', 'Can I have the third one?');
    expect(third.text).toMatch(/laugh/);
    expect(flagOf(third.run, 'moon-third-fossil')).toBe(1);
    expect(openSide(third.run)?.eventId).toBe('gn-04-mine');
  });
  it('the mine: three swings, each behind a guardian; with no breaking move, the pickaxe for ₽200', () => {
    let run = toDance('gn04-mine');
    run = choose(run, 'gn-04-dance', 'Leave them to it, and go on.').run;
    run = win(choose(run, 'gn-04-fossil', 'Can I have the third one?').run);
    for (const m of run.party) m.moves = m.moves.filter((x) => !['fighting', 'steel', 'ground'].includes(content.moves.get(x.id)!.type));
    expect(run.phase).toBe('map');
    expect(scene(run, 'gn-04-mine').labels).toEqual(['Walk on to the far side.', 'Rent the pickaxe and swing. (₽200)']);
    run.money = 1000;
    for (let i = 0; i < 3; i++) run = win(choose(run, 'gn-04-mine', 'Rent the pickaxe and swing. (₽200)').run); // a held find asks who keeps it
    expect(run.money).toBe(400);
    expect(flagOf(run, 'gn-moon-swings')).toBe(3);
    expect(flagOf(run, 'gn-moon-find')).toBeGreaterThanOrEqual(1);
    expect(scene(run, 'gn-04-mine').labels).toEqual(['Walk on to the far side.']);
    // With a Fighting move: a Rock-type guardian first.
    const fighter = structuredClone(run);
    setFlag(fighter, 'gn-moon-swings', 0);
    fighter.party[0]!.moves[0] = { id: 'karate-chop', pp: 25 };
    const swing = choose(fighter, 'gn-04-mine', 'Swing at the ore face. (a Fighting move)');
    expect(swing.battle).toBe(true);
    expect(content.species.get(swing.run.battle!.enemyTeam[0]!.speciesId)!.types).toContain('rock');
    const after = win(swing.run);
    expect(flagOf(after, 'gn-moon-swings')).toBe(1);
    expect(openSide(after)?.eventId).toBe('gn-04-mine');
    // The far side counts what you found and lets you out.
    run = choose(run, 'gn-04-mine', 'Walk on to the far side.').run;
    const out = choose(run, 'gn-04-far', 'Count it.');
    expect(out.text + out.changes.join(' ')).toMatch(/cracked fossil/);
    expect(out.run.stage!.pseudo).toBeUndefined();
  });
});

describe("gn.05 Damian's Unofficial Gym", () => {
  const barn = (seed: string) => {
    const run = gnRun(seed);
    run.regionIndex = 0;
    open(run, 'gn-05-barn');
    return run;
  };
  it('asking gets "It\'s got a sign."; walking past costs nothing', () => {
    const run = barn('gn05-ask');
    const asked = choose(run, 'gn-05-barn', "Ask if it's a real Gym.");
    expect(asked.text).toMatch(/It's got a sign\./);
    expect(scene(asked.run, 'gn-05-barn').labels).toEqual(['Challenge the Gym.', 'Walk on.']);
    const passed = choose(run, 'gn-05-barn', 'Walk on.');
    expect(passed.changes).toEqual([]);
    expect(passed.run.money).toBe(run.money);
  });
  it('Tully Splashes twice, Bex hunts for the button, and Damian\'s ace is the one he trained', () => {
    let run = choose(barn('gn05-fights'), 'gn-05-barn', 'Challenge the Gym.').run;
    expect(flagOf(run, 'damian-theme')).toBeGreaterThanOrEqual(1);
    const tully = choose(run, 'gn-05-tully', 'Battle Tully.').run;
    expect(tully.battle!.storyEffects.filter((x) => x.includes('Splash'))).toHaveLength(2);
    expect(tully.battle!.enemyTeam).toHaveLength(2);
    run = win(tully);
    const bex = choose(run, 'gn-05-bex', 'Battle Bex.').run;
    expect(bex.battle!.storyEffects.some((x) => x.includes('TOP LEFT'))).toBe(true);
    run = win(bex);
    const damian = choose(run, 'gn-05-damian', 'Battle Damian.').run;
    const team = damian.battle!.enemyTeam;
    expect(team).toHaveLength(4);
    const ace = team[3]!;
    expect(ace.level).toBeGreaterThan(Math.max(...team.slice(0, 3).map((m) => m.level)));
    expect(Object.keys(ace.held ?? {})).toHaveLength(1);
    run = win(damian);
    expect(scene(run, 'gn-05-won').intro).toMatch(/Ha! HA! Good!/);
    run = choose(run, 'gn-05-won', 'Take the Bottle-Cap Badge.').run;
    expect(flagOf(run, 'damian-meetings')).toBe(1);
    expect(flagOf(run, 'kanto-cerulean-damian-won')).toBe(1);
    expect(RunStateSchema.safeParse(run).success).toBe(true);
  });
  it('a loss is never the end: the speech, then he is glad you came back', () => {
    let run = choose(barn('gn05-lose'), 'gn-05-barn', 'Challenge the Gym.').run;
    run = lose(choose(run, 'gn-05-tully', 'Battle Tully.').run);
    expect(run.phase).toBe('map');
    expect(flagOf(run, 'damian-lost-once')).toBe(1);
    expect(scene(run, 'gn-05-lost').intro).toMatch(/Losing's just winning that hasn't finished yet/);
    run = choose(run, 'gn-05-lost', 'Go again.').run;
    expect(openSide(run)?.eventId).toBe('gn-05-barn');
    expect(scene(run, 'gn-05-barn').intro).toMatch(/You came back! Nobody comes back!/);
  });
  it('he comes back in the next region, not this one; "Closed. Thinking." if the rain came first', () => {
    const run = barn('gn05-later');
    setFlag(run, 'damian-meetings', 1);
    setFlag(run, 'damian-region', 1);
    const hall = content.events.get('gn-05-hall')!;
    const holds = (r: typeof run) => hall.requires.every((c) => conditionMet(content, r, c));
    expect(holds(run)).toBe(false);
    run.regionIndex = 1;
    expect(holds(run)).toBe(true);
    const rain = barn('gn05-rain');
    setFlag(rain, 'rain-damian-beaten', 1);
    expect(scene(rain, 'gn-05-barn').intro).toMatch(/Closed\. Thinking\./);
    expect(scene(rain, 'gn-05-barn').labels).toEqual(['Walk on.']);
    const walked = choose(rain, 'gn-05-barn', 'Walk on.').run;
    expect(flagOf(walked, 'damian-closed-thinking')).toBe(1);
    expect(flagOf(walked, 'damian-meetings')).toBe(1);
  });
});
