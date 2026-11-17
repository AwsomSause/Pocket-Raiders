// Greenneedle part 6c: the honest trades of gn.10 (S.S. Anne) and gn.12 (Swap Alley), and gn.30 The Island of Pink Pokémon
// (tools/events/co/greenneedle-2.ts, -3.ts, -6.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { chooseEvent, eventView } from '../../src/core/events';
import { createPokemon } from '../../src/core/pokemon';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');

describe('gn.10 and gn.12: the honest trades', () => {
  const withTrader = (seed: string, eventId: string, species = 'rattata'): { run: RunState; side: string } => {
    const run = gnRun(seed);
    run.party.push(createPokemon(content, species, 15, 'p-trade'));
    return { run, side: open(run, eventId) };
  };

  it('Swap Alley shows each pick\'s card before you commit, and what comes is what the card said', () => {
    const { run, side } = withTrader('t-honest-swap', 'gn-12-swap');
    const pick = eventView(content, run, side).choices[0]!.tradePicks!.find((p) => p.uid === 'p-trade')!;
    expect(pick.card).toBeTruthy();
    expect(pick.gets).toBe(pick.card!.theirs.species);
    expect(pick.card!.yours?.species).toBe('rattata');
    const out = chooseEvent(content, run, side, 0, 'p-trade').run;
    const got = out.party.find((m) => m.speciesId === pick.card!.theirs.species && m.uid !== out.party[0]!.uid)!;
    expect(got).toBeTruthy();
    expect(got.moves.map((m) => m.id)).toEqual(pick.card!.theirs.moves);
    expect(out.party.some((m) => m.uid === 'p-trade')).toBe(false);
    expect(openSide(out)!.eventId).toBe('gn-12-nature');
  });

  it('the apprentice sets the new one\'s nature, or leaves it be', () => {
    const { run, side } = withTrader('t-honest-nature', 'gn-12-swap');
    const out = chooseEvent(content, run, side, 0, 'p-trade').run;
    // Any of the twenty changing natures: pick what it gains (two screens), then what it gives up.
    expect(scene(out, 'gn-12-nature').labels).toEqual(['Stronger (Attack).', 'Cleverer (Sp. Atk).', 'Some other way.', 'Leave it as it is.']);
    expect(scene(out, 'gn-12-nature-more').labels).toEqual(['Quicker (Speed).', 'Tougher (Defence).', 'Calmer (Sp. Def).', 'Back.']);
    const uid = String(out.story.flags['ev:last-trade-uid']);
    const gain = choose(out, 'gn-12-nature', 'Cleverer (Sp. Atk).').run;
    expect(scene(gain, 'gn-12-nature-spa').labels).toEqual(['Modest (less Attack).', 'Quiet (less Speed).', 'Mild (less Defence).', 'Rash (less Sp. Def).']);
    const after = choose(gain, 'gn-12-nature-spa', 'Modest (less Attack).').run;
    expect(after.party.find((m) => m.uid === uid)!.nature).toBe('modest');
    const far = choose(choose(choose(out, 'gn-12-nature', 'Some other way.').run, 'gn-12-nature-more', 'Calmer (Sp. Def).').run, 'gn-12-nature-spd', 'Sassy (less Speed).').run;
    expect(far.party.find((m) => m.uid === uid)!.nature).toBe('sassy');
    const before = out.party.find((m) => m.uid === uid)!.nature;
    const left = choose(out, 'gn-12-nature', 'Leave it as it is.').run;
    expect(left.party.find((m) => m.uid === uid)!.nature).toBe(before);
  });

  it('an ordinary honest swap doesn\'t send your held item with it', () => {
    const { run, side } = withTrader('t-honest-held', 'gn-12-swap');
    run.party[1]!.held = { 'mystic-water': 1 };
    const out = chooseEvent(content, run, side, 0, 'p-trade').run;
    expect(out.party.slice(1).some((m) => m.held?.['mystic-water'])).toBe(false);
  });

  it('the S.S. Anne region trade shows its card: the regional form, at the same level', () => {
    const { run, side } = withTrader('t-honest-region', 'gn-10-tradeb-1', 'pikachu');
    const pick = eventView(content, run, side).choices[0]!.tradePicks!.find((p) => p.uid === 'p-trade')!;
    expect(pick.card!.theirs.species).toBe('raichu-alola');
    expect(pick.card!.theirs.level).toBe(15);
  });
});

describe('gn.30 The Island of Pink Pokémon', () => {
  const landed = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-30-door');
    return choose(run, 'gn-30-door', 'Row across.').run;
  };
  /** Walks the island without a fight to the hilltop, giving the doc's answers (or wrong ones). */
  const toHill = (run0: RunState, right = true): RunState => {
    let run = choose(run0, 'gn-30-landing', 'Walk up the beach.').run;
    run = choose(run, 'gn-30-orchard', 'Walk on.').run;
    run = choose(run, 'gn-30-stream', 'Walk on.').run;
    run = choose(run, 'gn-30-grove', 'Put down my own food, and step back.').run;
    run = choose(run, 'gn-30-high', 'Answer its questions.').run;
    run = choose(run, 'gn-30-q1', right ? 'The fruit.' : 'The water.').run;
    run = choose(run, 'gn-30-q2', right ? 'The fruit\'s stones, ground down.' : 'Coral.').run;
    return choose(run, 'gn-30-q3', right ? 'Not yet. It takes time.' : 'Yes, from the egg.').run;
  };

  it('a door at step 11 needing water (A6, once a run) into five nodes', () => {
    expect(content.coPlacement!.get('gn-30-door')).toMatchObject({ home: 11, window: [9, 14], sits: 'optional', attaches: 'instead', earliest: 6, tags: ['water'] });
    const run = landed('t30-door');
    expect(openSide(run)!.eventId).toBe('gn-30-landing');
    expect(flagOf(run, 'pink-entered')).toBe(1);
  });

  it('things you noticed are counted once each, and the stone room goes back where it was', () => {
    let run = landed('t30-notice');
    expect(scene(run, 'gn-30-landing').labels).toEqual(['Look at the sand.', 'Walk up the beach.', 'Battle the Rhyhorn.']);
    run = choose(run, 'gn-30-landing', 'Look at the sand.').run;
    expect(flagOf(run, 'pink-noticed')).toBe(1);
    expect(scene(run, 'gn-30-landing').labels).toEqual(['Walk up the beach.', 'Battle the Rhyhorn.']);
  });

  it('the grove: put down your food, and the Kangaskhan\'s young one gives three fruit', () => {
    let run = landed('t30-grove');
    for (const [id, label] of [['gn-30-landing', 'Walk up the beach.'], ['gn-30-orchard', 'Walk on.'], ['gn-30-stream', 'Walk on.']] as const) run = choose(run, id, label).run;
    expect(scene(run, 'gn-30-grove').labels).toEqual(['Battle through.', 'Put down my own food, and step back.', 'Go round.']);
    const r = choose(run, 'gn-30-grove', 'Put down my own food, and step back.');
    expect(flagOf(r.run, 'pink-fruit')).toBe(3);
    expect(openSide(r.run)!.eventId).toBe('gn-30-high');
  });

  it('fighting on the way makes the islanders keep away, and the Slowking says you trampled its study', () => {
    let run = landed('t30-fight');
    run = choose(run, 'gn-30-landing', 'Battle the Rhyhorn.').run;
    expect(flagOf(run, 'pink-battled')).toBe(1);
    setFlag(run, 'pink-battled');
    expect(scene(run, 'gn-30-high').intro).toMatch(/trampled/);
  });

  it('three right answers: the Slowking fights with half its moves, and it says you looked', () => {
    const run = toHill(landed('t30-quiz'));
    expect(flagOf(run, 'pink-quiz')).toBe(3);
    expect(scene(run, 'gn-30-after').intro).toMatch(/You looked\. So few look\./);
    const fight = choose(run, 'gn-30-after', 'Fight, as is customary.').run;
    const king = fight.battle!.enemyTeam.find((m) => m.speciesId === 'slowking')!;
    const wrong = choose(toHill(landed('t30-quiz'), false), 'gn-30-after', 'Fight, as is customary.').run.battle!.enemyTeam.find((m) => m.speciesId === 'slowking')!;
    expect(king.moves.length).toBe(Math.max(1, Math.ceil(wrong.moves.length / 2)));
  });

  it('leaving: a pink islander joins with its mark, or your lead eats the fruit and keeps the colour', () => {
    const run = choose(toHill(landed('t30-gift')), 'gn-30-after', 'Decline, politely.').run;
    expect(scene(run, 'gn-30-gift').labels).toEqual(['A pink islander comes with you.', 'Let your lead try the fruit.']);
    const joined = choose(run, 'gn-30-gift', 'A pink islander comes with you.').run;
    const pink = [...joined.party, ...joined.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.marks?.includes('pink from the island fruit'));
    expect(pink).toBeTruthy();
    expect(flagOf(joined, 'pink-done')).toBe(1);
    const ate = choose(run, 'gn-30-gift', 'Let your lead try the fruit.');
    expect(ate.run.party[0]!.marks).toContain('pink from the island fruit');
    expect(said(ate)).toMatch(/very pale pink/);
  });
});
