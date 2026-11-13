import { describe, expect, it } from 'vitest';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { addCanonStops, canonEventFor } from '../../src/core/expansion/canonRun';
import { addFinaleCanonStops, addOpeningCanonStops, addRouteCanonStops } from '../../src/core/expansion/canonEnds';
import { canonRoutesKanto } from '../../src/data/expansion';
import { generateLeagueMap } from '../../src/core/map';
import { chooseStarter, createRun, debugForceEvent } from '../../src/core/run';
import { content } from './helpers';

const begin = (seed: string, on = true) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(on ? { expansion: { kantoCanon: true } } : {}) }), 0);
const kantoSeeds = (() => { const out: string[] = []; for (let i = 0; out.length < 30 && i < 400; i++) if (begin(`K${i}`, false).regionOrder[0] === 'kanto') out.push(`K${i}`); return out; })();
const mine = [...content.events.values()].filter((e) => /^cs-kanto-(viridian|indigo|route|cast)-/.test(e.id));
const stops = (run: ReturnType<typeof begin>, prefix: string) => run.stage!.map.nodes.flatMap((n) => n.sides.filter((s) => s.id.startsWith(prefix)).map((s) => s.eventId!));
const nexts = (id: string) => content.events.get(id)!.choices.flatMap((c) => [c.success, c.failure]).flatMap((o) => [...(o?.effects ?? []), ...(o?.battle?.win ?? []), ...(o?.battle && 'lose' in o.battle ? o.battle.lose ?? [] : [])]).flatMap((x) => (x.kind === 'addEvent' ? [x.eventId] : []));

describe('Viridian, Indigo, road and cast events: data', () => {
  it('has the events, every addEvent target exists, and canon events are never random stops', () => {
    expect(mine.length).toBeGreaterThanOrEqual(45);
    for (const e of mine) for (const t of nexts(e.id)) expect(content.events.has(t), `${e.id} -> ${t}`).toBe(true);
    for (const e of mine) if (!e.room) expect(e.canon, e.id).not.toBeNull();
  });
  it('every road entry names a real event with a stage window', () => {
    for (const r of canonRoutesKanto.routes) expect(content.events.has(r.event), r.event).toBe(true);
    expect(canonRoutesKanto.routes.filter((r) => r.event.startsWith('cs-kanto-route-')).length).toBe(16);
  });
  it('Cerulean Cave only opens from the top of Victory Road, and the road is seven nodes', () => {
    const into = mine.filter((e) => nexts(e.id).includes('cs-kanto-indigo-cave')).map((e) => e.id);
    expect(into).toEqual(['cs-kanto-indigo-road-n7']);
    let at = 'cs-kanto-indigo-road-n1', n = 1;
    while (nexts(at).some((t) => /road-n\d/.test(t))) { at = nexts(at).find((t) => /road-n\d/.test(t))!; n++; }
    expect(n).toBe(7);
  });
  it('Stage 8 uses the Route 22 rematch, every other slot the first meeting', () => {
    expect(canonEventFor(content, 'cs.kanto.viridian.route22', 'stage-8')!.id).toBe('cs-kanto-viridian-route22-return');
    expect(canonEventFor(content, 'cs.kanto.viridian.route22', 'interlude-0')!.id).toBe('cs-kanto-viridian-route22');
  });
});

describe('Viridian, Indigo, road and cast events: references', () => {
  it('every item, species, move and ability they name exists', () => {
    const bad: string[] = [];
    const itemOk = (id: string) => content.items.has(id) || content.catalog.has(id);
    const walk = (o: unknown, where: string) => {
      if (Array.isArray(o)) return o.forEach((x) => walk(x, where));
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      if ((r.kind === 'item' || r.kind === 'bagItem') && typeof r.id === 'string' && !itemOk(r.id)) bad.push(`${where}: item ${r.id}`);
      if (r.kind === 'itemFrom') for (const id of r.ids as string[]) if (!itemOk(id)) bad.push(`${where}: item ${id}`);
      for (const k of ['species', 'team', 'lineup'] as const) {
        const v = r[k];
        if (Array.isArray(v)) for (const id of v) if (typeof id === 'string' && !content.species.has(id)) bad.push(`${where}: species ${id}`);
        if (typeof v === 'string' && r.kind !== 'tradeAway' && !content.species.has(v)) bad.push(`${where}: species ${v}`);
      }
      if (r.kind === 'teachMove' && typeof r.move === 'string' && !content.moves.has(r.move)) bad.push(`${where}: move ${r.move}`);
      if (typeof r.ability === 'string' && !content.abilities.has(r.ability)) bad.push(`${where}: ability ${r.ability}`);
      for (const v of Object.values(r)) walk(v, where);
    };
    for (const e of mine) walk(e.choices, e.id);
    expect(bad).toEqual([]);
  });
});

describe('Viridian before Stage 1, the Plateau finale and the road events in a run', () => {
  it('a Kanto run with canon on starts with the Old Man and Route 22 on the stage 1 map', () => {
    for (const seed of kantoSeeds.slice(0, 10)) {
      const run = begin(seed);
      const open = stops(run, 'cx-open');
      expect(open).toContain('cs-kanto-viridian-oldman');
      expect(open).toContain('cs-kanto-viridian-route22');
      expect(open.length).toBeLessThanOrEqual(4);
      expect(run.expansion!.canon!.menus['interlude-0']!.slice(0, 2)).toEqual(['cs.kanto.viridian.oldman', 'cs.kanto.viridian.route22']);
    }
  });
  it('with the setting off, nothing from these areas is added', () => {
    const run = begin(kantoSeeds[0]!, false);
    expect(stops(run, 'cx-')).toEqual([]);
  });
  it('road events are capped, reproducible, and each is a real event', () => {
    let seen = 0;
    for (const seed of kantoSeeds) {
      const a = stops(begin(seed), 'cx-route');
      expect(a).toEqual(stops(begin(seed), 'cx-route'));
      expect(a.length).toBeLessThanOrEqual(canonRoutesKanto.maxPerStage);
      for (const id of a) expect(content.events.get(id)!.canon).not.toBeNull();
      seen += a.length;
    }
    expect(seen).toBeGreaterThan(5);
  });
  it('the Stage 8 visit puts the Route 22 rematch on the map', () => {
    const run = structuredClone(begin(kantoSeeds[0]!));
    run.stage!.index = 7;
    addCanonStops(content, run);
    expect(stops(run, 'canon-')).toContain('cs-kanto-viridian-route22-return');
  });
  it('the League of a canon Kanto run carries Victory Road on its first fight', () => {
    const run = structuredClone(begin(kantoSeeds[0]!));
    run.stage = { ...run.stage!, kind: 'league', map: generateLeagueMap(4) };
    addFinaleCanonStops(content, run);
    const first = run.stage!.map.nodes.find((n) => n.column === 1)!;
    expect(first.sides.map((s) => s.eventId)).toEqual(['cs-kanto-indigo-road']);
    addOpeningCanonStops(content, run); // not a stage: adds nothing
    addRouteCanonStops(content, run);
    expect(stops(run, 'cx-open')).toEqual([]);
    expect(stops(run, 'cx-route')).toEqual([]);
  });
});

describe('Viridian, Indigo, road and cast events: playing them', () => {
  it('every choice of every event can be taken without an error', () => {
    for (const e of mine) {
      e.choices.forEach((c, i) => {
        const start = structuredClone(begin(kantoSeeds[0]!));
        start.money = 5000;
        start.inventory['poke-flute'] = 1;
        for (const [n, sp] of [[1, 'pidgeotto'], [2, 'pikachu']] as const) start.party.push({ ...structuredClone(start.party[0]!), uid: `extra${n}`, speciesId: sp });
        const { run, sideId } = debugForceEvent(content, start, e.id);
        if (!(c.requires ?? []).every((q) => conditionMet(content, run, q))) return;
        expect(() => chooseEvent(content, run, sideId, i), `${e.id} choice ${i}`).not.toThrow();
      });
    }
  });
  it('the Old Man gives five Poké Balls, a Weedle (or a fight for it) and the seed flag', () => {
    let lesson = 0, coffee = 0;
    for (let i = 0; i < 40; i++) {
      const before = structuredClone(begin(kantoSeeds[0]!));
      before.seed = `OM${i}`;
      const { run, sideId } = debugForceEvent(content, before, 'cs-kanto-viridian-oldman');
      const out = chooseEvent(content, run, sideId, 0).run;
      if (out.battle) { coffee++; expect(out.battle.kind).toBe('wild'); } else {
        lesson++;
        expect((out.inventory['poke-ball'] ?? 0) - (before.inventory['poke-ball'] ?? 0)).toBe(5);
        expect(out.pending.some((x) => x.kind === 'caught' && x.mon.speciesId === 'weedle')).toBe(true);
        expect(out.expansion!.canon!.flags).toContain('kanto.weedle.seed');
      }
    }
    expect(lesson).toBeGreaterThan(20);
    expect(coffee).toBeGreaterThan(1);
  });
  it('Route 22 is a rival fight that records the flag before the battle, so a loss still writes it', () => {
    const { run, sideId } = debugForceEvent(content, structuredClone(begin(kantoSeeds[0]!)), 'cs-kanto-viridian-route22');
    const out = chooseEvent(content, run, sideId, 0).run;
    expect(out.battle?.kind).toBe('trainer');
    expect(out.expansion!.canon!.flags).toContain('kanto.route22.fought');
  });
});
