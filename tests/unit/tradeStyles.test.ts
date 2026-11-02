import { describe, expect, it } from 'vitest';
import { TRADE_STYLE_IDS, TRADE_STYLES_READY, pickTradeStyle, tradeSalt, useTradeScreen } from '../../src/core/presentation/tradeStyles';
import { nextScreenChoice, screenChoice } from '../../src/core/presentation/screenStyles';
import { sectionView, usePlaza } from '../../src/core/plaza/flow';
import { chooseStarter, createRun } from '../../src/core/run';
import { useService } from '../../src/core/services/flow';
import type { RunState } from '../../src/core/state';
import { tradeView, TRADER_ART } from '../../src/core/trade/view';
import { PLAZA } from '../../src/core/plaza/schema';
import { DEFAULT_SETTINGS } from '../../src/save/saveManager';
import { content } from './helpers';

function baseRun(seed: string): RunState {
  return structuredClone(chooseStarter(content, createRun(content, { runId: 'ts', seed, archetypeId: 'red' }), 0));
}

function postRun(): RunState {
  const run = baseRun('trade-view');
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides = [{ id: 'tp', kind: 'service', serviceId: 'trade', used: false }];
  run.stage!.current = node.id;
  run.money = 5000;
  return run;
}

function plazaRun(): { run: RunState; sideId: string } {
  const run = baseRun('trade-plaza');
  const middle = Math.ceil(run.stage!.map.columns / 2);
  const node = run.stage!.map.nodes.find((n) => n.column === middle)!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  run.money = 20000;
  run.badges = ['a', 'b'] as never;
  return { run, sideId: node.sides.find((s) => s.kind === 'plaza')!.id };
}

describe('trade stop styles setting', () => {
  it('lists all twelve looks as the trade screen of the shared screen-style setting', () => {
    expect(TRADE_STYLE_IDS).toHaveLength(12);
    for (const id of TRADE_STYLES_READY) expect(TRADE_STYLE_IDS).toContain(id);
    expect(DEFAULT_SETTINGS.screenStyles.trade).toBeUndefined();
  });

  it('Settings cycles Random, every built style, Original, then Random again', () => {
    let saved: Record<string, string> = { trade: 'random' };
    const seen: string[] = [];
    for (let i = 0; i < TRADE_STYLES_READY.length + 2; i++) {
      seen.push(screenChoice('trade', saved));
      saved = { trade: nextScreenChoice('trade', saved) };
    }
    expect(seen).toEqual(['random', ...TRADE_STYLES_READY, 'original']);
    expect(screenChoice('trade', saved)).toBe('random');
  });

  it('random is stable for one visit, varies across stops and only draws built styles; a pinned style or Original wins', () => {
    const R = { trade: 'random' };
    expect(pickTradeStyle(R, tradeSalt('s', 'a', 0))).toBe(pickTradeStyle(R, tradeSalt('s', 'a', 0)));
    const picks = new Set(Array.from({ length: 300 }, (_, i) => pickTradeStyle(R, tradeSalt('seed', `side-${i}`, 0))));
    for (const p of picks) expect(TRADE_STYLES_READY).toContain(p);
    expect(picks.size).toBe(TRADE_STYLES_READY.length);
    expect(pickTradeStyle({ trade: TRADE_STYLES_READY[1]! }, 'x')).toBe(TRADE_STYLES_READY[1]);
    expect(useTradeScreen({ trade: 'original' }, 'x')).toBe(false);
    expect(useTradeScreen(R, 'x')).toBe(true);
    expect(useTradeScreen({}, 'x')).toBe(false);
  });
});

describe('trade view', () => {
  it('Trade Post offers name both sides and pick the same trade as the old list', () => {
    const run = postRun();
    const view = tradeView(content, run, 'service', 'tp');
    expect(view.place).toBe('TRADE POST');
    expect(view.offers.length).toBeGreaterThan(0);
    const o = view.offers[0]!;
    const mon = run.party[0]!;
    expect(o.give).toMatchObject({ speciesId: mon.speciesId, level: mon.level });
    expect(o.get.level).toBe(mon.level);
    expect(o.trader.art).toBe(TRADER_ART['post-clerk']);
    // Reading the view changes nothing; the same option id still trades.
    expect(tradeView(content, run, 'service', 'tp')).toEqual(view);
    const out = useService(content, run, 'tp', o.id);
    expect(out.run.party.some((m) => m.speciesId === o.get.speciesId && m.level === o.get.level)).toBe(true);
    expect(tradeView(content, out.run, 'service', 'tp').offers.every((x) => x.problem)).toBe(true);
  });

  it('Plaza offers match the traders section, and the trader gives exactly what the view promised', () => {
    const { run, sideId } = plazaRun();
    for (const t of PLAZA.traders) expect(TRADER_ART[t.id], t.id).toBeTruthy();
    // Give the party something every common trader wants.
    const tpl = run.party[0]!;
    run.party = ['squirtle', 'eevee', 'onix', 'snorlax'].map((sp, i) => ({ ...structuredClone(tpl), uid: `${tpl.uid}-${i}`, speciesId: sp, level: 20 }));
    const view = tradeView(content, run, 'plaza', sideId);
    expect(view.offers.map((o) => o.id)).toEqual(sectionView(content, run, sideId, 'traders').options.map((o) => o.id));
    const open = view.offers.find((o) => o.give && !o.problem);
    expect(open).toBeDefined();
    const out = usePlaza(content, run, sideId, 'traders', open!.id);
    expect(out.run.party.some((m) => m.speciesId === open!.get.speciesId && m.level === open!.get.level)).toBe(true);
  });

  it('a trader you have nothing for shows as a locked offer with no Pokémon given', () => {
    const { run, sideId } = plazaRun();
    run.party = [run.party[0]!];
    const view = tradeView(content, run, 'plaza', sideId);
    for (const o of view.offers.filter((x) => !x.give)) expect(o.problem).toMatch(/Needs/);
  });
});
