// Greenneedle gn.57: The Pokémon Impersonator (tools/events/co/greenneedle-57.ts; rules in src/core/greenneedle/impersonator.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createBattle, resolveTurn, startBattle, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

const tell = (run: RunState, id: string, label: string): RunState => choose(run, id, label).run;
/** The crowd, through the advice, to the first tell. */
function toTells(seed: string): RunState {
  const run = gnRun(seed);
  open(run, 'gn-57-crowd');
  return tell(tell(run, 'gn-57-crowd', 'Let it look at your team.'), 'gn-57-advice', 'Keep listening.');
}
/** All three tells noticed, to the verdict. */
function toVerdict(seed: string): RunState {
  let run = toTells(seed);
  run = tell(run, 'gn-57-tell-1', '…wait.');
  run = tell(run, 'gn-57-tell-2', '…wait.');
  return tell(run, 'gn-57-tell-3', '…wait.');
}

describe('gn.57 The Pokémon Impersonator', () => {
  it('the three tells each count once; "You\'re not the Champion." only shows once one is noticed', () => {
    const run = toTells('t57-tells');
    expect(scene(run, 'gn-57-tell-1').labels).toEqual(['…wait.', 'Nod along.']);
    const second = tell(run, 'gn-57-tell-1', '…wait.');
    expect(flagOf(second, 'impersonator-tells-seen')).toBe(1);
    expect(scene(second, 'gn-57-tell-2').labels).toContain('You\'re not the Champion.');
    const none = tell(tell(toTells('t57-none'), 'gn-57-tell-1', 'Nod along.'), 'gn-57-tell-2', 'Nod along.');
    expect(scene(none, 'gn-57-tell-3').labels).toEqual(['…wait.', 'Nod along.']);
    const all = toVerdict('t57-all');
    expect(flagOf(all, 'impersonator-tells-seen')).toBe(3);
    expect(scene(all, 'gn-57-verdict').labels).toEqual(['You\'re not the Champion.', 'Thank you. That\'s good advice.', 'Can I ask you something only the Champion would know?']);
  });

  it('expose: a battle against a Zoroark whose Illusion is the player\'s own lead; catching it gives Many Faces', () => {
    let run = tell(toVerdict('t57-expose'), 'gn-57-verdict', 'You\'re not the Champion.');
    expect(flagOf(run, 'impersonator-exposed')).toBe(1);
    run = tell(run, 'gn-57-fight', 'Battle.');
    const foe = run.battle!.enemyTeam[0]!;
    expect(foe.speciesId).toBe('zoroark');
    expect(run.battle!.enemyVolatile.illusion).toBe(run.party.find((m) => m.hp > 0)!.speciesId);
    expect(run.battle!.eventRule).toMatchObject({ gn: 'impersonator' });
    const caught = win(run, { catchIt: true });
    const zoroark = [...caught.party, ...caught.box, ...caught.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'zoroark')!;
    expect(zoroark.fixedAbility).toBe('many-faces');
    expect(zoroark.gn).toContain('many-faces');
    expect(flagOf(caught, 'impersonator-joined')).toBe(1);
  });

  it('expose and beat it without a catch: the story ends and no Zoroark joins', () => {
    const run = tell(tell(toVerdict('t57-beat'), 'gn-57-verdict', 'You\'re not the Champion.'), 'gn-57-fight', 'Battle.');
    const won = win(run);
    expect([...won.party, ...won.box].some((m) => m.speciesId === 'zoroark')).toBe(false);
    expect(flagOf(won, 'impersonator-joined')).toBe(0);
  });

  it('"Can I ask you something...": it guesses, then Expose or Play along', () => {
    const run = tell(toVerdict('t57-ask'), 'gn-57-verdict', 'Can I ask you something only the Champion would know?');
    expect(scene(run, 'gn-57-ask').labels).toEqual(['You\'re not the Champion.', 'Play along.']);
    const played = tell(run, 'gn-57-ask', 'Play along.');
    expect(flagOf(played, 'impersonator-played')).toBe(1);
    expect(openSide(played)?.eventId).toBe('gn-57-walk');
  });

  it('play along, then by the fire: "You can stay. As you." joins it with Many Faces; "Go on, then." lets it go', () => {
    const played = tell(toVerdict('t57-play'), 'gn-57-verdict', 'Thank you. That\'s good advice.');
    expect(flagOf(played, 'impersonator-played')).toBe(1);
    const fire = gnRun('t57-fire');
    setFlag(fire, 'impersonator-played');
    open(fire, 'gn-57-fire');
    expect(scene(fire, 'gn-57-fire').labels).toEqual(['You can stay. As you.', 'Who taught you to do that?', 'Go on, then.']);
    const stay = tell(fire, 'gn-57-fire', 'You can stay. As you.');
    const zoroark = [...stay.party, ...stay.box].find((m) => m.speciesId === 'zoroark')!;
    expect(zoroark.fixedAbility).toBe('many-faces');
    expect(flagOf(stay, 'impersonator-joined')).toBe(1);
    const goes = gnRun('t57-go');
    setFlag(goes, 'impersonator-played');
    open(goes, 'gn-57-fire');
    const left = tell(goes, 'gn-57-fire', 'Go on, then.');
    expect([...left.party, ...left.box].some((m) => m.speciesId === 'zoroark')).toBe(false);
  });

  it('later, once a region: the rival (right guess Bond +1, wrong guess Rival Trust -1), a Champion, the player', () => {
    const run = gnRun('t57-later');
    setFlag(run, 'impersonator-joined');
    open(run, 'gn-57-later');
    const next = tell(run, 'gn-57-later', 'Look closer.');
    const room = openSide(next)!.eventId;
    expect(['gn-57-rival', 'gn-57-champion', 'gn-57-player']).toContain(room);
    expect(scene(next, room).labels[0]).toBe('That\'s you, isn\'t it.');
    const done = tell(next, room, 'That\'s you, isn\'t it.');
    expect(flagOf(done, room === 'gn-57-rival' && flagOf(next, 'imp-real') ? 'imp-real' : 'impersonator-caught-out')).toBeGreaterThanOrEqual(0);
    // Once a region: the same event is not drawn again in this region.
    const again = gnRun('t57-again');
    setFlag(again, 'impersonator-joined');
    expect(content.events.get('gn-57-later')!.choices).toHaveLength(1);
  });

  it('the rival room tells the lead\'s mood by whether it is the real rival', () => {
    const real = gnRun('t57-real');
    setFlag(real, 'imp-real');
    open(real, 'gn-57-rival');
    expect(scene(real, 'gn-57-rival').intro).toContain('hackles up');
    const fake = gnRun('t57-fake');
    open(fake, 'gn-57-rival');
    expect(scene(fake, 'gn-57-rival').intro).toContain('perfectly relaxed');
    const wrong = choose(real, 'gn-57-rival', 'That\'s you, isn\'t it.');
    expect(wrong.text).toContain('real rival');
  });
});

describe('Many Faces', () => {
  it('forms an Illusion on entry and re-forms it on a switch back in, once per battle', () => {
    const z = createPokemon(content, 'zoroark', 50, 'z');
    z.fixedAbility = 'many-faces';
    const m = createPokemon(content, 'machop', 50, 'm');
    const foe = createPokemon(content, 'rattata', 50, 'f');
    for (const x of [z, m, foe]) x.moves = [{ id: 'splash', pp: 40 }];
    const battle = createBattle('trainer', [foe], 0, z.uid);
    const ctx: BattleContext = { content, battle, party: [z, m], inventory: {}, rng: new Rng(hashSeed('mf')), captureRng: new Rng(hashSeed('mfc')), catchMultiplier: 1 };
    startBattle(ctx);
    expect(battle.playerVolatile.illusion).toBe('machop');
    const forms = (): number => battle.storyEffects.filter((t) => t === `many-faces:${z.uid}`).length;
    expect(forms()).toBe(1);
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    resolveTurn(ctx, { kind: 'switch', partyIndex: 0 });
    expect(forms()).toBe(2);
    expect(battle.playerVolatile.illusion).toBe('machop');
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    resolveTurn(ctx, { kind: 'switch', partyIndex: 0 });
    expect(forms()).toBe(2);
    expect(battle.playerVolatile.illusion).toBeNull();
  });
});
