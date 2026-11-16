// Catalog Overhaul Pack (legends): Whole Run Events (co-legends-11.json, co-legends-12.json) and MY11 Arceus (co-legends-7.json).
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { activeVariant } from '../../src/core/eventMemory';
import { chooseEvent, conditionMet, eligibleEvents } from '../../src/core/events';
import { syncLegendFlags } from '../../src/core/legends/signs';
import { drawWholeRun, WHOLE_RUN_CHANCE, WHOLE_RUN_EVENTS, wholeRunFor, wholeRunOf } from '../../src/core/legends/wholeRun';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import eleven from '../../src/data/events/co-legends-11.json';
import twelve from '../../src/data/events/co-legends-12.json';
import status from '../../src/data/catalogOverhaul/status/legends.json';
import placement from '../../src/data/catalogOverhaul/placement/legends.json';
import { content } from './helpers';

const PREFIX = { giratina: 'gg', weather: 'ww', made: 'mo', seven: 'sd', flower: 'wf' } as const;
function at(eventId: string, seed: string, setup?: (run: RunState) => void): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'wre', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'x', kind: 'event', used: false, eventId } as never);
  setup?.(run);
  return run;
}
const f = (run: RunState, key: string) => run.story.flags[`ev:${key}`] ?? 0;
const set = (run: RunState, flags: Record<string, number>) => { for (const [k, v] of Object.entries(flags)) run.story.flags[`ev:${k}`] = v; };
const pick = (run: RunState, eventId: string, choice: number): RunState => {
  const side = run.stage!.map.nodes[0]!.sides.find((s) => s.kind === 'event' && !s.used && (s as { eventId?: string }).eventId === eventId)!;
  return chooseEvent(content, run, side.id, choice).run;
};
/** Indexes of the choices whose own `requires` hold. */
const open = (run: RunState, eventId: string): number[] =>
  content.events.get(eventId)!.choices.flatMap((c, i) => ((c.requires ?? []).every((r) => conditionMet(content, run, r)) ? [i] : []));

describe('Whole Run Events: the framework', () => {
  it('about 35% of seeds draw one, every one of the five turns up, and the same seed always draws the same', () => {
    const draws = Array.from({ length: 2000 }, (_, i) => wholeRunFor(`wre-seed-${i}`));
    const share = draws.filter(Boolean).length / draws.length;
    expect(share).toBeGreaterThan(WHOLE_RUN_CHANCE - 0.04);
    expect(share).toBeLessThan(WHOLE_RUN_CHANCE + 0.04);
    expect(new Set(draws.filter(Boolean))).toEqual(new Set(WHOLE_RUN_EVENTS));
    expect(wholeRunFor('wre-seed-7')).toBe(wholeRunFor('wre-seed-7'));
  });

  it('the setting draws at run start; off, nothing is drawn', () => {
    const seed = Array.from({ length: 50 }, (_, i) => `wre-on-${i}`).find((s) => wholeRunFor(s) === 'giratina')!;
    const on = createRun(content, { runId: 'a', seed, archetypeId: 'red', expansion: { wholeRunEvents: true } });
    expect([f(on, 'wre-on'), f(on, 'wre-giratina'), wholeRunOf(on)]).toEqual([1, 1, 'giratina']);
    const off = createRun(content, { runId: 'b', seed, archetypeId: 'red' });
    expect([f(off, 'wre-on'), wholeRunOf(off)]).toEqual([0, null]);
  });

  it('each story has ten placed beats (Beat 1 at Stage 2, Beat 10 before the Champion), a status line, and real species and art', () => {
    const extra = (status as { extra: Record<string, string> }).extra;
    for (const code of ['W1', 'W2', 'W3', 'W4', 'W5', 'MY11']) expect(content.events.get(extra[code]!), code).toBeDefined();
    for (const p of Object.values(PREFIX)) {
      for (let n = 1; n <= 10; n++) {
        const id = `co-wre-${p}-${n}`;
        expect(content.events.get(id), id).toBeDefined();
        expect((placement as Record<string, { home?: number }>)[id], id).toBeDefined();
      }
      expect((placement as unknown as Record<string, { home: number }>)[`co-wre-${p}-1`]!.home).toBe(2);
      expect(content.events.get(`co-wre-${p}-10`)!.requires).toContainEqual({ kind: 'regionsLeft', atMost: 0 });
    }
    const text = JSON.stringify([eleven, twelve]);
    for (const m of text.matchAll(/"pokemon":"([^"]+)"/g)) expect(content.species.has(m[1]!), m[1]).toBe(true);
    for (const m of text.matchAll(/"(?:species|team)":\[([^\]]*)\]/g)) for (const s of JSON.parse(`[${m[1]}]`) as string[]) expect(content.species.has(s), s).toBe(true);
    for (const m of text.matchAll(/"kind":"addEvent","eventId":"([^"]+)"/g)) expect(content.events.get(m[1]!)?.room, m[1]).toBe(true);
    for (const m of text.matchAll(/"(boss|trainer)\.([^"]+)"/g)) expect(existsSync(`public/assets/images/${m[1] === 'boss' ? 'bosses' : 'trainer'}/${m[2]}.png`), m[0]).toBe(true);
  });

  it('nothing ends a run: every wild fight is pseudo and every trainer fight is friendly', () => {
    const walk = (o: unknown): void => {
      if (!o || typeof o !== 'object') return;
      const b = (o as { battle?: { kind?: string; pseudo?: boolean; friendly?: boolean } }).battle;
      if (b?.kind === 'wild') expect(b.pseudo, JSON.stringify(b).slice(0, 60)).toBe(true);
      if (b?.kind === 'trainer') expect(b.friendly, JSON.stringify(b).slice(0, 60)).toBe(true);
      for (const v of Object.values(o)) walk(v);
    };
    walk([eleven, twelve]);
  });

  it('only the drawn story opens; its beats come in order', () => {
    const run = at('co-wre-gg-1', 'order', (r) => set(r, { 'wre-giratina': 1 }));
    run.stage!.index = 2;
    const ids = () => new Set(eligibleEvents(content, run).map((e) => e.id));
    expect(ids().has('co-wre-gg-1')).toBe(true);
    expect(ids().has('co-wre-gg-2')).toBe(false);
    expect(ids().has('co-wre-ww-1')).toBe(false);
    const after = pick(run, 'co-wre-gg-1', 0);
    expect([f(after, 'gg-beat'), f(after, 'gg-faith'), f(after, 'gg-stone')]).toEqual([1, 2, 1]);
  });
});

describe('Guidance of Giratina', () => {
  it('Beat 1 LEAVE curses; LISTEN with the Renegade blessing starts Faith higher', () => {
    const left = pick(at('co-wre-gg-1', 'g1', (r) => set(r, { 'wre-giratina': 1 })), 'co-wre-gg-1', 1);
    expect(f(left, 'gg-curse')).toBe(2);
    const blessed = pick(at('co-wre-gg-1', 'g2', (r) => set(r, { 'wre-giratina': 1, 'blessing-giratina': 1 })), 'co-wre-gg-1', 0);
    expect(f(blessed, 'gg-faith')).toBe(4);
  });

  it('Beat 3: NEITHER appears only with a name, the stone or Doubt 2; giving the Pokémon takes one from the party', () => {
    const base = { 'wre-giratina': 1, 'gg-beat': 2 };
    const ev = content.events.get('co-wre-gg-3')!;
    expect(ev.choices.map((c) => c.label)).not.toContain('NEITHER.');
    expect(activeVariant(content, at('co-wre-gg-3', 'g3', (r) => set(r, base)), ev)).toBeFalsy();
    expect(activeVariant(content, at('co-wre-gg-3', 'g3d', (r) => set(r, { ...base, 'gg-doubt': 2 })), ev)?.addChoices[0]!.label).toBe('NEITHER.');
    const named = at('co-wre-gg-3', 'g3b', (r) => { set(r, { ...base, 'gg-deacon-name': 1 }); r.party.push(structuredClone(r.party[0]!)); });
    const spared = pick(named, 'co-wre-gg-3', 2);
    expect([f(spared, 'gg-spared'), f(spared, 'gg-rift')]).toEqual([1, 1]);
    const two = at('co-wre-gg-3', 'g3c', (r) => { set(r, base); r.party.push(structuredClone(r.party[0]!)); });
    const before = two.party.length;
    const gave = pick(two, 'co-wre-gg-3', 0);
    expect(gave.party.length).toBe(before - 1);
    expect(f(gave, 'gg-lost')).toBe(1);
  });

  it('the climax: Doubt decides Phase 1, each act takes three turns off ten, and exactly one ending is open', () => {
    for (const [doubt, choice] of [[0, 0], [3, 1], [6, 2], [9, 3]] as const) {
      expect(open(at('co-wre-gg-10', `d${doubt}`, (r) => set(r, { 'wre-giratina': 1, 'gg-b1': 1, 'gg-doubt': doubt })), 'co-wre-gg-10'), `doubt ${doubt}`).toEqual([choice]);
    }
    const turns = content.events.get('co-wre-gg-10-endure')!.choices.map((c) => (c.success.battle as { rule?: { surviveTurns?: number } } | undefined)?.rule?.surviveTurns);
    expect(turns).toEqual([10, 7, 4, 1]);
    for (let acts = 0; acts <= 3; acts++) {
      expect(open(at('co-wre-gg-10-endure', `a${acts}`, (r) => set(r, { 'gg-act': acts })), 'co-wre-gg-10-endure')).toEqual([acts]);
      for (const mercy of [0, 1]) {
        const ends = open(at('co-wre-gg-end', `e${acts}${mercy}`, (r) => set(r, { 'gg-act': acts, 'gg-mercy': mercy })), 'co-wre-gg-end');
        expect(ends, `acts ${acts} mercy ${mercy}`).toHaveLength(1);
      }
    }
    const sealed = pick(at('co-wre-gg-end', 'seal', (r) => set(r, { 'gg-act': 3 })), 'co-wre-gg-end', 0);
    expect([f(sealed, 'gg-done'), f(sealed, 'gg-end-sealed')]).toEqual([1, 1]);
    expect(sealed.perkEffects.some((m) => m.kind === 'bossDamageMultiplier')).toBe(true);
  });

  it('the Usurper takes the seventh chair instead of the climb', () => {
    const run = at('co-wre-gg-10', 'usurp', (r) => set(r, { 'wre-giratina': 1, 'gg-b1': 1, 'gg-usurper': 1 }));
    const after = pick(run, 'co-wre-gg-10', 0); // the variant hides the four climbs: its chair is the only choice shown
    expect([f(after, 'gg-end-usurper'), f(after, 'gg-done')]).toEqual([1, 1]);
  });
});

describe('The other four stories', () => {
  it('every climax and ending room leaves at least one way out, whatever the Threads', () => {
    const rooms = ['co-wre-ww-end', 'co-wre-mo-10', 'co-wre-mo-end', 'co-wre-sd-10', 'co-wre-wf-end'];
    const threads = ['ww-sky', 'ww-trust', 'mo-tools', 'mo-kindness', 'mo-leash', 'sd-wishes', 'wf-flower'];
    for (const id of rooms) for (const v of [0, 1, 2, 3, 5]) {
      const run = at(id, `${id}-${v}`, (r) => set(r, Object.fromEntries(threads.map((t) => [t, v]))));
      expect(open(run, id).length, `${id} at ${v}`).toBeGreaterThan(0);
    }
  });

  it('the Weather War: the third answer at the dam needs both leaders; Balance needs the Sky and Trust', () => {
    const dam = content.events.get('co-wre-ww-3')!;
    expect(dam.choices[2]!.requires).toEqual([expect.objectContaining({ key: 'ww-archie' }), expect.objectContaining({ key: 'ww-maxie' })]);
    expect(open(at('co-wre-ww-end', 'b0', (r) => set(r, { 'ww-sky': 2, 'ww-trust': 1 })), 'co-wre-ww-end')).toEqual([1]);
    const bal = pick(at('co-wre-ww-end', 'b1', (r) => set(r, { 'ww-sky': 2, 'ww-trust': 2 })), 'co-wre-ww-end', 0);
    expect(f(bal, 'ww-end-balance')).toBe(1);
  });

  it('the Made One: a player who used Pokémon as tools faces it; a kind one may ask it to stay', () => {
    expect(open(at('co-wre-mo-10', 'm1', (r) => set(r, { 'mo-tools': 2 })), 'co-wre-mo-10')).toEqual([1]);
    expect(open(at('co-wre-mo-10', 'm2', (r) => set(r, { 'mo-tools': 0 })), 'co-wre-mo-10')).toEqual([0]);
    expect(open(at('co-wre-mo-end', 'm3', (r) => set(r, { 'mo-kindness': 3 })), 'co-wre-mo-end')).toEqual([0, 1]);
    expect(JSON.stringify(content.events.get('co-wre-mo-end')!.choices[1]!.success.effects)).toContain('"mewtwo"');
  });

  it('the Seven Days: the Blank Tag needs a blank tag and no wishes; a wish names who paid', () => {
    expect(open(at('co-wre-sd-10', 's1', (r) => set(r, { 'sd-blank': 1 })), 'co-wre-sd-10')).toContain(0);
    expect(open(at('co-wre-sd-10', 's2', (r) => set(r, { 'sd-blank': 1, 'sd-wishes': 1 })), 'co-wre-sd-10')).not.toContain(0);
    const w = pick(at('co-wre-sd-2', 's3', (r) => set(r, { 'wre-seven': 1, 'sd-beat': 1 })), 'co-wre-sd-2', 0);
    expect([f(w, 'sd-wishes'), f(w, 'sd-paid-lillipup')]).toEqual([1, 1]);
  });

  it('the Weapon and the Flower: Buried needs the Flower found twice', () => {
    expect(open(at('co-wre-wf-end', 'w1', (r) => set(r, { 'wf-flower': 1 })), 'co-wre-wf-end')).toEqual([3]);
    expect(open(at('co-wre-wf-end', 'w2', (r) => set(r, { 'wf-flower': 2 })), 'co-wre-wf-end')).toEqual([0, 3]);
  });
});

describe('MY11 Arceus: the Sixteen Pedestals (same-run version)', () => {
  it('comes only in the last region, to a Guest whose Promise was never broken', () => {
    const req = content.events.get('co-my11-pedestals')!.requires;
    expect(req).toContainEqual({ kind: 'regionsLeft', atMost: 0 });
    expect(req).toContainEqual(expect.objectContaining({ key: 'guest-true', atLeast: 1 }));
    const run = at('co-my11-pedestals', 'ar0');
    run.expansion = { ...run.expansion, promises: true, promise: { tellings: {}, visited: 'mew', guest: { id: 'mew', forgiven: false }, kept: [], left: [] } } as RunState['expansion'];
    syncLegendFlags(run);
    expect(f(run, 'guest-true')).toBe(1);
    run.expansion!.promise!.guest = { id: 'mew', forgiven: true };
    syncLegendFlags(run);
    expect(f(run, 'guest-true')).toBe(0);
  });

  it('"My Pokémon" is refused and asked again; the Judgment gives the starter its Plate and lays down the commandments', () => {
    let run = at('co-my11-pedestals', 'ar1');
    run = pick(run, 'co-my11-pedestals', 1);
    run = pick(run, 'co-my11-again', 1);
    const before = run.party.map((p) => p.level);
    run = pick(run, 'co-my11-judgment-light', 1);
    expect(f(run, 'arceus-judged')).toBe(1);
    expect(run.party.map((p) => p.level)).toEqual(before.map((l) => l + 3));
    const table = (content.events.get('co-my11-judgment-light')!.choices[1]!.success.effects.find((e) => e.kind === 'typeItem') as { table: Record<string, string> }).table;
    for (const id of Object.values(table)) expect(content.items.has(id) || content.catalog.get(id)?.status === 'supported', id).toBe(true);
    expect(run.perkEffects.filter((m) => m.kind === 'healingMultiplier' || m.kind === 'priceMultiplier' || m.kind === 'captureMultiplier')).toHaveLength(2);
  });
});
