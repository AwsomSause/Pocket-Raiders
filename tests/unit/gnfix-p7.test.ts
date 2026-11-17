// Fixes for gn.54–gn.59 against the docs (GREENNEEDLE_REWORKED_PLACED_12.md and _13.md). The bigger ones have their own files:
// gnfix-61.test.ts (the Final Reunion), and blocks at the end of gn-57, gn-58, gn-60 and gn-62.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { OLD_MOVES, ferrisCatch } from '../../src/core/greenneedle/ferris';
import { gathering } from '../../src/core/greenneedle/reunion';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const text = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');

describe('gn.54 The Magikarp Convention: the poster', () => {
  it('is in every later region after a convention, whether or not one of them evolved', () => {
    const req = JSON.stringify(content.events.get('gn-54-poster')!.requires);
    expect(req).toContain('kc-visits');
    expect(req).not.toContain('kc-evolved');
  });
});

describe('gn.56 The Slowpoke Detective Agency', () => {
  const atTruth = (seed: string): RunState => {
    const run = gnRun(seed);
    setFlag(run, 'slowpoke-case', 2);
    open(run, 'gn-56-c3-truth');
    return run;
  };

  it('case 3 gives a badge the player sees: Honorary Slowpoke Detective', () => {
    const r = choose(atTruth('p7-56-badge'), 'gn-56-c3-truth', 'Carry him home.');
    expect(text(r)).toContain('HONORARY SLOWPOKE DETECTIVE');
    expect(flagOf(r.run, 'slowpoke-honorary')).toBe(1);
  });

  it('asked how they knew, the Chief only yawns (no translated answer)', () => {
    const r = choose(atTruth('p7-56-yawn'), 'gn-56-c3-truth', 'Ask the Slowpoke how they knew.');
    expect(text(r)).toContain('Four minutes pass. It yawns.');
    expect(text(r)).not.toContain('translates');
  });

  it('case 2 offers the Dratini or the Dragon Scale, and nothing else', () => {
    expect(content.events.get('gn-56-c2-truth')!.choices.map((c) => c.label)).toEqual(['Take the Dratini.', 'Take the Dragon Scale, and leave it be.']);
  });

  it('no clue read right: the Slowpoke consider you one of them, and that is all (no Bond)', () => {
    const run = atTruth('p7-56-zero');
    setFlag(run, 'slowpoke-read', 0);
    const before = run.party.map((m) => m.friendship);
    const r = choose(run, 'gn-56-c3-truth', 'Carry him home.');
    expect(text(r)).toContain('consider you one of them');
    expect(r.run.party.slice(0, before.length).map((m) => m.friendship)).toEqual(before);
  });
});

describe('gn.59 The Former Champion', () => {
  it('the one that goes on travelling brings a move no Pokémon of its kind learns any more', () => {
    for (const [id, move] of Object.entries(OLD_MOVES)) {
      expect(content.moves.has(move), move).toBe(true);
      let sp = content.species.get(id);
      while (sp) {
        expect(sp.learnset.some((l) => l.move === move), `${sp.id} learns ${move}`).toBe(false);
        sp = sp.evolvesFrom ? content.species.get(sp.evolvesFrom) : undefined;
      }
    }
    expect(JSON.stringify(content.events.get('gn-59-clip'))).toContain(OLD_MOVES.arcanine);
  });

  it('Ferris is "they" throughout, as the doc has it', () => {
    const all = [...content.events.values()].filter((e) => e.id.startsWith('gn-59-')).map((e) => JSON.stringify(e)).join(' ');
    expect(all).not.toMatch(/\b(He|he|His|his|him|himself)\b/);
    expect(all).toContain('They hand you a cup');
  });

  it('"What\'s the empty clip?" is asked only before the last region', () => {
    const run = gnRun('p7-59-clip');
    setFlag(run, 'ferris-last', 0);
    expect(scene(run, 'gn-59-after').labels).toContain('What\'s the empty clip?');
    setFlag(run, 'ferris-last', 1);
    expect(scene(run, 'gn-59-after').labels).not.toContain('What\'s the empty clip?');
  });

  it('a lost battle still counts as battled, so one of the five may come at the end', () => {
    const fire = JSON.stringify(content.events.get('gn-59-after'));
    expect(fire).toMatch(/"lose":\[[^\]]*ferris-battled/);
  });

  it('3rd region: the double catch chance is for one Pokémon, and is spent when it is caught', () => {
    const run = gnRun('p7-59-bite');
    run.regionIndex = 2;
    setFlag(run, 'ferris-advice-3', 1);
    const mon = structuredClone(run.party[0]!);
    const slow = { ...structuredClone(mon), level: 1 };
    const fast = { ...structuredClone(mon), level: 100 };
    run.party = [slow];
    const battle = { kind: 'wild', trainer: null, enemyTeam: [fast], enemyIndex: 0, activeIndex: 0 } as never;
    expect(ferrisCatch(content, run, battle)).toBe(2);
    setFlag(run, 'ferris-advice-3-used', 1);
    expect(ferrisCatch(content, run, battle)).toBe(1);
  });
});

describe('gn.60 and gn.new.13 at the Final Reunion', () => {
  it('the one that followed you home knows the one that walked into the woods', () => {
    const run = gnRun('p7-woods');
    run.story.flags['left:fates'] = 'pidgey:woods,rattata:camp';
    run.party[0]!.gn = [...(run.party[0]!.gn ?? []), 'followed-home'];
    open(run, 'gn-61-field');
    const after = choose(run, 'gn-61-field', 'Walk down into the field.').run;
    const woods = gathering(after)!.att.find((a) => a.id === 'left-woods')!;
    expect(woods.line).toContain('The two know each other. They have been on the same road.');
    // Without the follower in the team, the line is not there.
    const plain = gnRun('p7-woods-2');
    plain.story.flags['left:fates'] = 'pidgey:woods';
    open(plain, 'gn-61-field');
    const p = choose(plain, 'gn-61-field', 'Walk down into the field.').run;
    expect(gathering(p)!.att.find((a) => a.id === 'left-woods')!.line).not.toContain('same road');
  });
});
