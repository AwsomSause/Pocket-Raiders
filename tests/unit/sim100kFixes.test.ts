// Crash-level bugs the 100,000-run sim survey found (tools/sim100k), each pinned so it can't come back.
import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { duelReady } from '../../src/core/greenneedle/duelist';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import ssanne from '../../src/data/events/co-greenneedle-2.json';
import duelist from '../../src/data/events/co-greenneedle-new-06.json';
import { content } from './helpers';

type Cond = { kind: string; key?: string; atLeast?: number; atMost?: number; test?: string };
type Ev = { id: string; choices: { label: string; showIf?: Cond[]; requires?: Cond[] }[] };
const events = (j: unknown): Ev[] => ((j as { events?: Ev[] }).events ?? (j as Ev[]));

describe('sim100k fixes', () => {
  it('a caught Alpha never keeps more HP than its max once the fight-only boost is gone', () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'sk', seed: 'sim100k-alpha', archetypeId: 'red' }), 0));
    run.inventory['master-ball'] = 1;
    const foe = createPokemon(content, 'snorlax', 20, 'e1');
    foe.alpha = true;
    foe.statBoosts = { ...foe.statBoosts, hp: 100 };
    foe.hp = maxHp(content, foe);
    run.battle = createBattle('wild', [foe], 0, run.party[0]!.uid, null);
    run.phase = 'battle';
    const caught = takeTurn(content, run, { kind: 'item', itemId: 'master-ball' }).run.pending.find((d) => d.kind === 'caught');
    expect(caught?.kind).toBe('caught');
    const mon = caught!.kind === 'caught' ? caught!.mon : null;
    expect(mon!.hp).toBeGreaterThan(0);
    expect(mon!.hp).toBeLessThanOrEqual(maxHp(content, mon!));
  });

  it('The Duelist: accepting needs the chosen one still standing (it can faint at the node battle after the stop shows)', () => {
    const doors = events(duelist).filter((e) => e.choices.some((c) => c.label === 'Accept the duel.'));
    expect(doors.length).toBeGreaterThan(0);
    for (const e of doors) {
      const accept = e.choices.find((c) => c.label === 'Accept the duel.')!;
      expect(accept.requires?.some((c) => c.kind === 'gn' && c.test === 'duelReady'), e.id).toBe(true);
      // "Not now" stays open, so the stop can always be left.
      expect(e.choices.some((c) => c.label === 'Not now.' && !c.requires && !c.showIf), e.id).toBe(true);
    }
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'sd', seed: 'sim100k-duel', archetypeId: 'green' }), 0));
    expect(duelReady(run)).toBe(false);
    run.party[0]!.gn = ['duel-chosen'];
    expect(duelReady(run)).toBe(true);
    run.party[0]!.hp = 0;
    expect(duelReady(run)).toBe(false);
  });

  it('S.S. Anne deck rooms: every value of ssanne-at shows at least one choice (no softlock out of order)', () => {
    const decks = events(ssanne).filter((e) => /^gn-10-deck-\d+$/.test(e.id));
    expect(decks).toHaveLength(12);
    const holds = (c: Cond, v: number) => c.kind !== 'flag' || c.key !== 'ssanne-at' || (v >= (c.atLeast ?? 1) && v <= (c.atMost ?? 99));
    for (const e of decks) {
      for (let v = 0; v <= 14; v++) {
        expect(e.choices.some((c) => (c.showIf ?? []).every((cond) => holds(cond, v))), `${e.id} with ssanne-at ${v}`).toBe(true);
      }
    }
  });

  it('S.S. Anne cabin rooms: after the fourth room every room still shows a way on (the Collector had none, playtest pt32)', () => {
    const rooms = events(ssanne).filter((e) => e.choices.some((c) => (c.showIf ?? []).some((x) => x.key === 'ssanne-rooms')));
    expect(rooms.length).toBeGreaterThanOrEqual(11);
    const holds = (c: Cond, v: number) => c.kind !== 'flag' || c.key !== 'ssanne-rooms' || (v >= (c.atLeast ?? 1) && v <= (c.atMost ?? 99));
    for (const e of rooms) {
      for (let v = 0; v <= 12; v++) {
        expect(e.choices.some((c) => (c.showIf ?? []).every((cond) => holds(cond, v))), `${e.id} with ssanne-rooms ${v}`).toBe(true);
      }
    }
  });
});
