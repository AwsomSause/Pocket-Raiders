// Evil Mode slice 19, "Sinnoh, Unova, Kalos" (build plan section 3; design Part 26b, Part 08c, Part 15a section 9, Part
// 15b sections 1 and 2). Proves: Loyalty moves by half in Sinnoh and nowhere else; Regard and Dread by double in Unova
// (losses too); Kalos's Fronts pay half as much again and a coat with no symbol lands with Regard +1; the Speech's Card
// has a fourteenth field, filled from the Ledger, on that one Card only; "Six regions" can't be chosen before six
// regions' data is present; a six-region run replays and its save's under budget; the mountain's and the light's
// second clocks start only if nobody stopped them, count three days and never end a run; the three regions' data.

import { describe, expect, it } from 'vitest';
import { foundForPlay, playRun, replay } from '../../src/core/evilMode/autoplay';
import { EVIL_DATA } from '../../src/core/evilMode/data';
import { cardFor, leftOut } from '../../src/core/evilMode/card';
import { clockActs, clockMet, clockMorning, clockOf, lastRun, stopClock } from '../../src/core/evilMode/crossing';
import { ensureNeighbour, neighbourDef } from '../../src/core/evilMode/neighbour';
import { isSpeech, methodsFor, stageRow } from '../../src/core/evilMode/board';
import { regionMoves, scaleOf } from '../../src/core/evilMode/regionRule';
import { ventureDaily } from '../../src/core/evilMode/economy';
import { lengthFor, regionsOpen, sixOpen } from '../../src/core/evilMode/runLength';
import { foundTeam, type FoundingChoice } from '../../src/core/evilMode/start';
import { EvilModeBlockSchema, type EvilModeBlock, type StoredCard } from '../../src/core/evilMode/schema';
import { SETTINGS } from '../../src/core/settingsRegistry';
import { cardCount, cardsOf, logCount, logOf, pack, unpack } from '../../src/core/evilMode/pack';
import { DEFAULT_SETTINGS } from '../../src/save/saveManager';

const choice = (over: Partial<FoundingChoice> = {}): FoundingChoice => ({ name: 'Kettle', creed: 'profit', line: 'grey', doctrine: 'swarm', patron: 'executive', region: 'kanto', ...over });
const fresh = (seed: string, region: string, over: Partial<FoundingChoice> = {}): EvilModeBlock => foundForPlay(seed, choice({ region, ...over }));
const NEW = ['sinnoh', 'unova', 'kalos'] as const;

describe('the three regions\' data', () => {
  it('each is supported, with eight stages, eight locals, eight Leaders and a neighbour', () => {
    for (const id of NEW) {
      const def = EVIL_DATA.region.regions.find((r) => r.id === id)!;
      expect(def.status, id).toBe('supported');
      for (let n = 0; n < 8; n++) expect(stageRow(def.index, n), `${id} ${n}`).toBeTruthy();
      expect(EVIL_DATA.district.locals.filter((l) => l.region === def.index), id).toHaveLength(8);
      const leaders = EVIL_DATA.gym.leaders.filter((l) => l.region === def.index);
      expect(new Set(leaders.map((l) => l.n)).size, id).toBe(8);
      expect(leaders.find((l) => l.n === 0)!.role).toBe('first');
      expect(leaders.find((l) => l.n === 7)!.role).toBe('eighth');
      expect(neighbourDef(def.index), id).toBeTruthy();
    }
    expect(neighbourDef(3)!.boss).toBe('Cyrus');
    expect(neighbourDef(4)!.boss).toBe('Ghetsis');
    expect(neighbourDef(5)!.boss).toBe('Lysandre');
  });

  it('each lays all eight stages, with its own holding (lakes, bridges, tables)', () => {
    const own = { sinnoh: 'lake', unova: 'bridge', kalos: 'table' } as const;
    for (const id of NEW) {
      const b = fresh(`lay-${id}`, id);
      expect(b.district!.holdings).toHaveLength(20);
      const kinds = EVIL_DATA.district.districts.filter((r) => r.region === b.here.region).reduce((n, r) => n + (r.layout?.[own[id]] ?? 0), 0);
      expect(kinds, id).toBeGreaterThan(0);
    }
  });

  it('a lake can\'t be held by any method but Scout; minors and canon locks are kept', () => {
    expect(methodsFor({ id: 'x', step: 1, kind: 'lake', ref: 'Lake Valor', mood: null, scouted: 0, owner: 'nobody', holds: false, tried: [] })).toEqual(['scout']);
    expect(EVIL_DATA.district.kinds.find((k) => k.id === 'table')!.methods).not.toContain('lean');
    expect(EVIL_DATA.district.kinds.find((k) => k.id === 'table')!.methods).not.toContain('take');
  });
});

describe('Sinnoh: Loyalty moves half as far, both ways, and nowhere else', () => {
  const s = fresh('sinnoh-1', 'sinnoh');
  const k = fresh('sinnoh-k', 'kanto');
  const moved = (b: EvilModeBlock, by: number[]): EvilModeBlock => ({ ...b, crew: b.crew.map((c, i) => ({ ...c, loyalty: Math.max(0, Math.min(10, c.loyalty + (by[i] ?? 0))) })) });

  it('halves each change toward nothing', () => {
    const base = { ...s, crew: s.crew.map((c) => ({ ...c, loyalty: 5 })) };
    expect(base.crew.length).toBeGreaterThanOrEqual(5);
    const r = regionMoves(base, moved(base, [3, -3, 1, -1, 2]));
    expect(r.crew.slice(0, 5).map((c) => c.loyalty)).toEqual([6, 4, 5, 5, 6]);
    expect(scaleOf(base, 'loyaltyMove')).toBe(0.5);
  });

  it('leaves Kanto, Unova and Kalos alone', () => {
    for (const b of [k, fresh('sinnoh-u', 'unova'), fresh('sinnoh-x', 'kalos')]) {
      const base = { ...b, crew: b.crew.map((c) => ({ ...c, loyalty: 5 })) };
      const after = moved(base, [3, -3]);
      expect(regionMoves(base, after)).toBe(after);
    }
  });

  it('isn\'t applied across the water', () => {
    const base = { ...s, crew: s.crew.map((c) => ({ ...c, loyalty: 5 })) };
    const after = { ...moved(base, [4]), here: { ...base.here, region: 0 } };
    expect(regionMoves(base, after).crew[0]!.loyalty).toBe(9);
  });
});

describe('Unova: Regard and Dread move twice as far, losses too', () => {
  const u = fresh('unova-1', 'unova');
  const at = (b: EvilModeBlock, regard: number, dread: number): EvilModeBlock => ({ ...b, team: { ...b.team, regard, dread } });

  it('doubles each change, capped 0 to 10', () => {
    expect(regionMoves(at(u, 3, 3), at(u, 4, 2)).team).toMatchObject({ regard: 5, dread: 1 });
    expect(regionMoves(at(u, 9, 1), at(u, 10, 0)).team).toMatchObject({ regard: 10, dread: 0 });
    expect(regionMoves(at(u, 3, 3), at(u, 3, 3)).team).toMatchObject({ regard: 3, dread: 3 });
  });

  it('nowhere else', () => {
    const s = fresh('unova-s', 'sinnoh');
    const after = at(s, 4, 2);
    expect(regionMoves(at(s, 3, 3), after).team).toMatchObject({ regard: 4, dread: 2 });
  });

  it('a step in Unova is doubled end to end (the hook is on `step`)', () => {
    expect(scaleOf(u, 'standingMove')).toBe(2);
    expect(scaleOf(fresh('unova-k', 'kanto'), 'standingMove')).toBe(1);
  });
});

describe('the Speech: the fourteenth field', () => {
  const u = fresh('speech-1', 'unova');
  const town = u.district!.holdings.find((h) => h.kind === 'town')!;

  it('Unova\'s Town is a square, where the Speech is Persuade; no other region\'s is', () => {
    expect(isSpeech(town, 'persuade')).toBe(true);
    expect(methodsFor(town)).toContain('persuade');
    for (const id of ['kanto', 'sinnoh', 'kalos']) {
      const t = fresh(`speech-${id}`, id).district!.holdings.find((h) => h.kind === 'town')!;
      expect(isSpeech(t), id).toBe(false);
      expect(methodsFor(t), id).not.toContain('persuade');
    }
  });

  it('appears on the Speech\'s Card and on no other Card', () => {
    const squad = u.crew.filter((c) => c.where === 'in').slice(0, 1).map((c) => c.id);
    const card = cardFor(u, { holdingId: town.id, method: 'persuade', squad });
    expect(card.fields).toHaveLength(14);
    expect(card.fields[13]!.label).toBe(EVIL_DATA.region.speech!.label);
    expect(card.fields[13]!.text).toBe(EVIL_DATA.region.speech!.empty);
    const local = u.district!.holdings.find((h) => h.kind === 'local')!;
    expect(cardFor(u, { holdingId: local.id, method: 'persuade', squad }).fields).toHaveLength(13);
    expect(cardFor(u, { holdingId: town.id, method: 'scout', squad }).fields).toHaveLength(13);
  });

  it('is filled from the Ledger: empty only when nothing\'s left out', () => {
    expect(leftOut(u)).toBeNull();
    const dirty: StoredCard = { id: 'c1', day: 1, region: u.here.region, district: 0, holdingId: 's1', method: 'lean', clean: false, fields: Array.from({ length: 13 }, (_, i) => (i === 11 ? 'Leaned on the ice-cream cart.' : `f${i}`)) };
    const b = { ...u, cards: [dirty] };
    expect(leftOut(b)).toBe('Leaned on the ice-cream cart.');
    const squad = b.crew.filter((c) => c.where === 'in').slice(0, 1).map((c) => c.id);
    expect(cardFor(b, { holdingId: town.id, method: 'persuade', squad }).fields[13]!.text).toBe('Leaned on the ice-cream cart.');
    // A dirty card from another region isn't this region's other half.
    expect(leftOut({ ...u, cards: [{ ...dirty, region: 0 }] })).toBeNull();
  });
});

describe('Kalos: money and taste', () => {
  const x = fresh('kalos-1', 'kalos');
  const k = fresh('kalos-k', 'kanto');

  it('a Front pays half as much again; a Racket doesn\'t', () => {
    const v = { cardId: 'cafe', honest: true, books: false, kind: 'front' as const };
    expect(ventureDaily(x, v)).toBe(Math.floor(ventureDaily(k, v) * 1.5));
    const racket = EVIL_DATA.economy.cards.find((c) => c.kind === 'racket' && c.id !== 'tithe')!;
    const r = { cardId: racket.id, honest: false, books: false, kind: 'racket' as const };
    expect(ventureDaily({ ...x, team: { ...x.team, creed: 'cause' } }, r)).toBe(ventureDaily({ ...k, team: { ...k.team, creed: 'cause' } }, r));
  });

  it('a coat with no symbol lands at Regard +1; any symbol doesn\'t', () => {
    const L = EVIL_DATA.region.look;
    const look = (symbol: string) => ({ a: L.a[0]![1], b: L.b[0]![1], symbol, cut: L.cuts[0]!, head: L.heads[0]!, motto: [L.motto[0][0]!, L.motto[1][0]!, ''] as [string, string, string] });
    const found = (region: string, symbol: string) => {
      const r = foundTeam(choice({ region, look: look(symbol) }), { boss: 'red', length: 'three', seed: 'logo' });
      if (!r.ok) throw new Error(r.problem);
      return r.block.team.regard;
    };
    const none = L.symbols[L.symbols.length - 1]!;
    expect(found('kalos', none)).toBe(found('kalos', L.symbols[0]!) + 1);
    expect(found('kanto', none)).toBe(found('kanto', L.symbols[0]!));
  });
});

describe('the Run length setting: Six regions', () => {
  it('can\'t be chosen before six regions\' data is present', () => {
    const three = EVIL_DATA.region.regions.map((r) => ({ status: ['kanto', 'johto', 'hoenn'].includes(r.id) ? 'supported' : 'disabled' }));
    expect(regionsOpen(three)).toBe(3);
    expect(sixOpen(three)).toBe(false);
    expect(lengthFor('six', three)).toBe('three');
    const data = { ...EVIL_DATA, region: { ...EVIL_DATA.region, regions: EVIL_DATA.region.regions.map((r) => (['kanto', 'johto', 'hoenn'].includes(r.id) ? r : { ...r, status: 'disabled' as const })) } };
    const r = foundTeam(choice(), { boss: 'red', length: 'six', seed: 'len' }, data);
    expect(r.ok && r.block.settings.length).toBe('three');
  });

  it('is selectable now: nine regions exist (slice 20 opened Alola, Galar and Paldea)', () => {
    expect(regionsOpen()).toBe(9);
    expect(sixOpen()).toBe(true);
    expect(lengthFor('six')).toBe('six');
    for (const id of ['alola', 'galar', 'paldea']) expect(EVIL_DATA.region.regions.find((r) => r.id === id)!.status).toBe('supported');
    const def = SETTINGS.find((s) => s.id === 'evilRunLength')!;
    const s0 = DEFAULT_SETTINGS;
    expect(def.disabled?.(s0)).toBe(false);
    const s1 = def.next(s0);
    expect(s1.expansion.evilRunLength).toBe('six');
    expect(def.show(s1)).toBe('Six');
    expect(def.next(s1).expansion.evilRunLength).toBe('three');
  });
});

describe('a six-region run', () => {
  const b0 = foundForPlay('six-run', choice(), EVIL_DATA, 'six');
  const run = playRun(b0, 'mix');

  it('plays six regions, never one twice, to an ending', () => {
    expect(b0.settings.length).toBe('six');
    expect(lastRun(b0)).toBe(5);
    expect(run.finished).toBe(true);
    const all = [...run.block.region.crossed, run.block.region.id];
    expect(all).toHaveLength(6);
    expect(new Set(all).size).toBe(6);
    expect(run.block.ending?.done).toBe(true);
  });

  it('replays from its action list to the same block', () => {
    expect(JSON.stringify(replay(b0, run.actions))).toBe(JSON.stringify(run.block));
  });

  it('what\'s older than two regions is packed, never dropped: the whole Log and every Card still read in order', () => {
    const b = run.block;
    expect(b.archive).toBeTruthy();
    const log = logOf(b);
    expect(log).toHaveLength(logCount(b));
    expect(log.map((e) => e.id)).toEqual(log.map((_, i) => `L${i + 1}`));
    expect(cardsOf(b).map((c) => c.id)).toEqual(Array.from({ length: cardCount(b) }, (_, i) => `C${i + 1}`));
    // Day 2 can still be read at the end (Part 30 section 7.4).
    expect(log.some((e) => e.day === 2)).toBe(true);
    const loose = new Set(b.log.map((e) => e.region));
    expect(loose.size).toBeLessThanOrEqual(3);
  });

  it('its save is under the 300 KB budget, and reloads whole', () => {
    const json = JSON.stringify(run.block);
    expect(json.length).toBeLessThan(300_000);
    expect(EvilModeBlockSchema.parse(JSON.parse(json))).toEqual(JSON.parse(json));
  });
});

describe('the second clocks: the mountain and the light', () => {
  const reckoning = (b: EvilModeBlock): EvilModeBlock => ({ ...b, here: { ...b.here, stage: 8, beat: 'morning' }, district: { ...b.district!, from: b.here.day } });
  const at = (id: string) => ensureNeighbour(fresh(`clock-${id}`, id));

  it('Sinnoh and Kalos have one; Unova doesn\'t', () => {
    expect(clockOf(at('sinnoh'))?.region).toBe('sinnoh');
    expect(clockOf(at('kalos'))?.region).toBe('kalos');
    expect(clockOf(at('unova'))).toBeUndefined();
    expect(clockMorning(reckoning(at('unova'))).region.clock).toBeNull();
  });

  for (const id of ['sinnoh', 'kalos'] as const) {
    it(`${id}: starts at the Reckoning's first morning, counts three days, costs holdings at nought and never ends the run`, () => {
      const b = at(id);
      expect(clockMorning(b).region.clock).toBeNull();
      let r = clockMorning(reckoning(b));
      expect(r.region.clock).toMatchObject({ left: 3, stopped: null });
      expect(clockActs(r).map((c) => c.code)).toEqual(['stop:boss', 'stop:hero']);
      r = clockMorning({ ...r, here: { ...r.here, day: r.here.day + 1 } });
      r = clockMorning({ ...r, here: { ...r.here, day: r.here.day + 1 } });
      expect(r.region.clock!.left).toBe(1);
      const held = r.district!.holdings.map((h) => (h.kind === 'gym' ? h : { ...h, owner: 'team' as const, holds: true }));
      const ended = { ...r, district: { ...r.district!, holdings: held, end: { how: 'reckoning' as const, day: r.here.day, count: 0 } } };
      const met = clockMet(ended);
      expect(met.region.clock).toMatchObject({ left: 0, stopped: 'met' });
      const ours = (x: EvilModeBlock) => x.district!.holdings.filter((h) => h.owner === 'team').length;
      expect(ours(met)).toBe(Math.floor(ours(ended) / 2));
      expect(met.ending).toBeNull();
      expect(stopClock(r, 'hero').block.region.clock!.stopped).toBe('hero');
    });

    it(`${id}: never starts when the neighbour's tick was stopped before the Reckoning`, () => {
      const b = at(id);
      const tick = clockOf(b)!.before!;
      const stopped = { ...b, neighbour: { ...b.neighbour!, ticks: b.neighbour!.ticks.map((t) => (t.n === tick ? { ...t, state: 'stopped' as const } : t)) } };
      const r = clockMorning(reckoning(stopped));
      expect(r.region.clock?.stopped).toBe('before');
      expect(clockActs(r)).toEqual([]);
    });
  }
});

describe('the packing (Part 30 section 7.4)', () => {
  it('is lossless for any text, and tighter for a Log', () => {
    for (const t of ['', 'a', 'aaaaaaa', 'abababababab', '₽1,500 · “quotes” \\ "q" \u0001 é 🙂 ok', JSON.stringify({ x: [1, 2, 3], s: 'Day 3. Carrow. Asked them. They said yes.' })]) expect(unpack(pack(t))).toBe(t);
    const big = JSON.stringify(Array.from({ length: 400 }, (_, i) => ({ id: `L${i}`, day: i, kind: 'job', text: `Day ${i}. Rahel Tesfaye. Looked at a local at step ${i % 20}, Water Street.` })));
    expect(unpack(pack(big))).toBe(big);
    expect(JSON.stringify(pack(big)).length).toBeLessThan(big.length / 3);
  });
});
