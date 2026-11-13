// Beta 0.6 wide formats (E4): the shared registry and the Breather.
import { describe, expect, it } from 'vitest';
import { breatherShare } from '../../src/core/formats/breather';
import { battleEnded, cardOf, chooseOption, closeFormat, formatOver, startFormat } from '../../src/core/formats/registry';
import { currentFormat } from '../../src/core/formats/store';
import { switchProblem } from '../../src/core/battle/engine';
import { maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

const mk = (seed = 'fm1') => {
  const r = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
  const base = r.party[0]!;
  r.party = Array.from({ length: 4 }, (_, i) => ({ ...structuredClone(base), uid: `m${i}` }));
  return r;
};
const ctxOf = (run: ReturnType<typeof mk>) => ({ content, run });

describe('Breather', () => {
  it('heals the ones still up by 50% of max HP and brings back exactly the one chosen', () => {
    const run = mk();
    const max = maxHp(content, run.party[0]!);
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    run.party[2]!.hp = 0;
    expect(startFormat('breather', ctxOf(run))).toBe(true);
    const card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['m1', 'm2']);
    chooseOption(ctxOf(run), 'm2');
    expect(run.party[0]!.hp).toBe(Math.min(max, 1 + Math.ceil(max * 0.5)));
    expect(run.party[2]!.hp).toBe(Math.max(1, Math.ceil(maxHp(content, run.party[2]!) * 0.5)));
    expect(run.party[1]!.hp).toBe(0);
    expect(run.party[3]!.hp).toBe(maxHp(content, run.party[3]!));
    expect(formatOver(ctxOf(run))).toBe(true);
    expect(run.expansion!.cut!.checkpoint).toBe('breather');
  });

  it('with nobody down it offers a plain Rest', () => {
    const run = mk();
    run.party[0]!.hp = 2;
    startFormat('breather', ctxOf(run));
    const card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['rest']);
    chooseOption(ctxOf(run), 'rest');
    expect(run.party[0]!.hp).toBeGreaterThan(2);
  });

  it('never applies twice: choosing again, or starting again, changes nothing', () => {
    const run = mk();
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    startFormat('breather', ctxOf(run));
    chooseOption(ctxOf(run), 'm1');
    const after = JSON.stringify(run.party);
    chooseOption(ctxOf(run), 'm0');
    expect(JSON.stringify(run.party)).toBe(after);
    closeFormat(ctxOf(run));
    expect(startFormat('breather', ctxOf(run))).toBe(false);
  });

  it('a wrong uid revives nobody but still heals once', () => {
    const run = mk();
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    startFormat('breather', ctxOf(run));
    chooseOption(ctxOf(run), 'nope');
    expect(run.party[1]!.hp).toBe(0);
    expect(run.party[0]!.hp).toBeGreaterThan(1);
  });

  it('heals 35% when the poisoned gate was lost (boundary)', () => {
    expect(breatherShare([])).toBe(0.5);
    expect(breatherShare(['kanto.west-gate'])).toBe(0.35);
    expect(breatherShare(['any.cliff-stair', 'x'])).toBe(0.35);
    const run = mk();
    const max = maxHp(content, run.party[0]!);
    run.party[0]!.hp = 1;
    run.expansion = { siege: { lost: ['kanto.west-gate'] } };
    startFormat('breather', ctxOf(run));
    chooseOption(ctxOf(run), 'rest');
    expect(run.party[0]!.hp).toBe(Math.min(max, 1 + Math.ceil(max * 0.35)));
  });

  it('survives save and reload at both points; a damaged slot is dropped, not thrown on', () => {
    const run = mk();
    run.party[0]!.hp = 1;
    run.party[1]!.hp = 0;
    startFormat('breather', ctxOf(run));
    let loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(cardOf(ctxOf(loaded as typeof run))!.over).toBe(false);
    chooseOption(ctxOf(loaded as typeof run), 'm1');
    loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(loaded)));
    expect(cardOf(ctxOf(loaded as typeof run))!.over).toBe(true);
    expect(startFormat('breather', ctxOf(loaded as typeof run))).toBe(false);
    const bad = mk();
    bad.expansion = { cut: { format: { id: 'bogus', state: 3 } } };
    expect(currentFormat(bad)).toBeNull();
    expect(cardOf(ctxOf(bad))).toBeNull();
  });

  it('formats without a battle hook ignore battle results', () => {
    const run = mk();
    startFormat('breather', ctxOf(run));
    expect(battleEnded(ctxOf(run), true)).toBe(true);
    expect(startFormat('convoy', ctxOf(run))).toBe(false);
  });
});

describe('Blackout', () => {
  const sealed = (run: ReturnType<typeof mk>) => run.battle!.eventRule;

  it('launches an anchor fight under the Seal and breaks it after two anchors', () => {
    const run = mk('bo1');
    expect(startFormat('blackout', ctxOf(run), { triad: false })).toBe(true);
    const card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['a1', 'a2', 'a3']);
    chooseOption(ctxOf(run), 'a1');
    expect(run.phase).toBe('battle');
    expect(run.battle!.event!.eventId).toBe('format:blackout');
    expect(sealed(run)).toEqual({ noSwitchFirstTurn: true, typeBoost: { type: 'psychic', pct: 10 } });
    expect(run.battle!.enemyTeam.every((m) => m.speciesId === 'mr-mime')).toBe(true);
    expect(switchProblem({ battle: run.battle!, party: run.party }, 1)).toMatch(/Seal/);
    run.battle!.turn = 2;
    expect(switchProblem({ battle: run.battle!, party: run.party }, 1)).toBeNull();
    // won: first anchor beaten
    battleEnded(ctxOf(run), true);
    run.battle = null;
    run.phase = 'map';
    chooseOption(ctxOf(run), 'a2');
    expect(sealed(run)).toBeDefined(); // one beaten: Seal still holds
    battleEnded(ctxOf(run), true);
    run.battle = null;
    run.phase = 'map';
    // two beaten and no Triad: over, Seal gone
    expect(formatOver(ctxOf(run))).toBe(true);
    expect(run.expansion!.cut!.done).toContain('blackout');
    expect(run.expansion!.cut!.checkpoint).toBe('blackout');
  });

  it('a lost fight records the loss and leaves the anchor up (no double count)', () => {
    const run = mk('bo2');
    startFormat('blackout', ctxOf(run), { triad: false });
    chooseOption(ctxOf(run), 'a1');
    battleEnded(ctxOf(run), false);
    battleEnded(ctxOf(run), true); // no fight pending: ignored
    run.battle = null;
    run.phase = 'map';
    const card = cardOf(ctxOf(run))!;
    expect(card.options.map((o) => o.id)).toEqual(['a1', 'a2', 'a3']);
    expect(card.lines.join(' ')).toMatch(/lost: 1/);
  });

  it('with the Triad, Sabrina is the third anchor, waits for the others, and the third fight has no Seal', () => {
    const run = mk('bo3');
    startFormat('blackout', ctxOf(run), { triad: true });
    const opts = cardOf(ctxOf(run))!.options;
    expect(opts.find((o) => o.id === 'a3')!.enabled).toBe(false);
    chooseOption(ctxOf(run), 'a3'); // not allowed yet
    expect(run.phase).not.toBe('battle');
    for (const id of ['a1', 'a2']) {
      chooseOption(ctxOf(run), id);
      battleEnded(ctxOf(run), true);
      run.battle = null;
      run.phase = 'map';
    }
    expect(formatOver(ctxOf(run))).toBe(false);
    chooseOption(ctxOf(run), 'a3');
    expect(run.battle!.trainer!.name).toBe('Oracle Sabrina');
    expect(run.battle!.eventRule).toBeUndefined();
    battleEnded(ctxOf(run), true);
    expect(formatOver(ctxOf(run))).toBe(true);
  });

  it('is deterministic and survives save and reload mid-format', () => {
    const a = mk('bo4');
    const b = mk('bo4');
    for (const r of [a, b]) {
      startFormat('blackout', ctxOf(r), { triad: false });
      chooseOption(ctxOf(r), 'a2');
    }
    expect(a.battle!.enemyTeam.map((m) => [m.speciesId, m.level])).toEqual(b.battle!.enemyTeam.map((m) => [m.speciesId, m.level]));
    const loaded = RunStateSchema.parse(JSON.parse(JSON.stringify(a)));
    expect(currentFormat(loaded)!.state.pending).toBe('a2');
    expect(loaded.battle!.eventRule!.typeBoost).toEqual({ type: 'psychic', pct: 10 });
  });
});
