// Beta 0.7 Node Event Menus P1-P4: tags, composer, flow, micro entries.

import { afterEach, describe, expect, it } from 'vitest';
import { composeNodeMenu, isKeepEvent, menuKinds } from '../../src/core/nodeMenu/compose';
import { nodeMenuData } from '../../src/core/nodeMenu/data';
import { closeNodeMenu, currentMenu, ensureNodeMenu, entryLocked, menuBlocker, menuSideIds, nodeMenusAllowed, nodeMenuView, pickMenuEntry } from '../../src/core/nodeMenu/flow';
import { clearNodeMenuHooks, registerNodeMenuHooks } from '../../src/core/nodeMenu/hooks';
import { MENU_CATEGORIES } from '../../src/core/nodeMenu/state';
import { eventCategory } from '../../src/core/nodeMenu/tags';
import { isGiftable } from '../../src/core/events';
import { findNode } from '../../src/core/map';
import { chooseNode, createRun, mapChoices } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { RunStateSchema } from '../../src/core/state';
import { EXPANSION_SETTINGS_DEFAULTS } from '../../src/core/expansion/schema';
import { autoplay } from './autoplay';
import { content } from './helpers';

/** Plays a seeded run with menus on until the player stands on a stage node (after its battle). */
function onNode(seed: string, nodeMenus = true): RunState {
  let found: RunState | null = null;
  autoplay({ seed, steps: 400, smart: true, healOnMap: true, expansion: { nodeMenus }, onStep: (r) => {
    if (!found && r.phase === 'map' && r.stage?.kind === 'stage' && r.stage.current && findNode(r.stage.map, r.stage.current).kind !== 'gym') found = r;
    return found ?? undefined;
  } });
  if (!found) throw new Error(`no node reached for ${seed}`);
  return found;
}

afterEach(() => clearNodeMenuHooks());

describe('node menus P1: categories', () => {
  it('gives every event a valid category, and every category but one is used', () => {
    const counts: Record<string, number> = {};
    for (const e of content.events.values()) {
      const c = eventCategory(e);
      expect(MENU_CATEGORIES, e.id).toContain(c);
      counts[c] = (counts[c] ?? 0) + 1;
    }
    expect(Object.keys(counts).length).toBeGreaterThanOrEqual(MENU_CATEGORIES.length - 1);
    // No single category swallows the catalog.
    expect(Math.max(...Object.values(counts)) / content.events.size).toBeLessThan(0.5);
  });

  it('data: micro entries give real items, and overrides name real events', () => {
    const data = nodeMenuData();
    for (const m of data.micro) for (const fx of m.effects) if (fx.kind === 'itemFrom') for (const id of fx.ids) expect(isGiftable(content, id), `${m.id}: ${id}`).toBe(true);
    for (const id of Object.keys(data.tagOverrides)) expect(content.events.has(id), id).toBe(true);
  });
});

describe('node menus P3: composer', () => {
  it('is off by default and in speedrun, boss rush and time attack', () => {
    expect(EXPANSION_SETTINGS_DEFAULTS.nodeMenus).toBe(false);
    expect(nodeMenusAllowed([])).toBe(true);
    for (const id of ['boss-rush', 'speed-clear', 'time-attack']) expect(nodeMenusAllowed([id])).toBe(false);
    const off = createRun(content, { runId: 'r', seed: 'off', archetypeId: 'red', campaignId: 'full' });
    expect(off.expansion?.nodeMenus).toBeUndefined();
    expect(ensureNodeMenu(content, off)).toBe(off);
  });

  it('builds 2-5 entries plus the battle, mixes two kinds, caps required and picks', () => {
    const sizes: Record<number, number> = {};
    for (let i = 0; i < 12; i++) {
      const run = onNode(`menu-${i}`);
      const stage = run.stage!;
      for (const node of stage.map.nodes.filter((n) => n.kind !== 'gym')) {
        const menu = composeNodeMenu(content, run, node);
        const body = menu.entries.filter((e) => e.kind !== 'encounter');
        const keep = body.filter((e) => e.keep).length;
        expect(body.length, node.id).toBeGreaterThanOrEqual(2);
        if (keep === 0) expect(body.length, node.id).toBeLessThanOrEqual(5);
        sizes[body.length] = (sizes[body.length] ?? 0) + 1;
        expect(menuKinds(menu).length, node.id).toBeGreaterThanOrEqual(2);
        const required = menu.entries.filter((e) => e.required);
        expect(required.length).toBeLessThanOrEqual(nodeMenuData().maxRequired);
        expect(required.filter((e) => e.category === 'battle').length).toBeLessThanOrEqual(1);
        expect(menu.picks).toBeGreaterThanOrEqual(0);
        expect(menu.picks).toBeLessThanOrEqual(nodeMenuData().picks.bonus);
        // Every side stop is either in the menu or dropped; story-critical stops are never dropped.
        const listed = new Set(body.flatMap((e) => (e.sideId ? [e.sideId] : [])));
        for (const s of node.sides) {
          expect(listed.has(s.id) || menu.dropped.includes(s.id), s.id).toBe(true);
          const ev = s.eventId ? content.events.get(s.eventId) : undefined;
          if (ev && isKeepEvent(run, ev)) expect(menu.dropped).not.toContain(s.id);
        }
        // Same node, same menu.
        expect(composeNodeMenu(content, run, node)).toEqual(menu);
      }
    }
    expect(Object.keys(sizes).length).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it('lets hooks add entries and hear what was skipped', () => {
    const seen: string[] = [];
    registerNodeMenuHooks({
      addEntries: (menu) => menu.entries.push({ id: 'sp:test', kind: 'special', category: 'explore', required: false, keep: false, label: 'Test', done: false }),
      onMenuClosed: (_ctx, _menu, picked, skipped) => seen.push(`picked ${picked.length} skipped ${skipped.length}`),
    });
    const run = ensureNodeMenu(content, onNode('hook'));
    expect(currentMenu(run)!.entries.some((e) => e.id === 'sp:test')).toBe(true);
    const clone = structuredClone(run);
    closeNodeMenu(content, clone);
    expect(seen).toHaveLength(1);
    expect(currentMenu(clone)!.closed).toBe(true);
  });
});

describe('node menus: flow', () => {
  it('composes once, picks lock the rest, micro entries play, and the save round-trips', () => {
    let run = ensureNodeMenu(content, onNode('flow-1'));
    expect(ensureNodeMenu(content, run)).toBe(run);
    const view = nodeMenuView(run)!;
    expect(view.entries[0]!.entry.kind).toBe('encounter');
    for (const id of menuSideIds(run)) expect(findNode(run.stage!.map, run.stage!.current!).sides.some((s) => s.id === id)).toBe(true);
    const micro = view.entries.find((v) => v.entry.kind === 'micro' && !v.entry.keep);
    const optional = view.entries.filter((v) => !v.entry.keep && !v.entry.required);
    if (micro) {
      const res = pickMenuEntry(content, run, micro.entry.id);
      expect(res.text).toBeTruthy();
      run = res.run;
      const menu = currentMenu(run)!;
      expect(menu.entries.find((e) => e.id === micro.entry.id)!.done).toBe(true);
      expect(run.expansion!.nodeMenus!.tally.micro).toBe(1);
      if (menu.picks === 1) for (const v of optional.filter((o) => o.entry.id !== micro.entry.id)) {
        expect(entryLocked(menu, v.entry)).toBe(true);
        expect(() => pickMenuEntry(content, run, v.entry.id)).toThrow(/locked/);
      }
      expect(() => pickMenuEntry(content, run, micro.entry.id)).toThrow(/already done/);
    }
    // Save shape: the optional block survives a parse.
    const parsed = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(parsed.expansion?.nodeMenus).toEqual(run.expansion?.nodeMenus);
  });

  it('a micro entry rolls from its own stream: same seed, same result', () => {
    const base = ensureNodeMenu(content, onNode('flow-2'));
    const micro = nodeMenuView(base)!.entries.find((v) => v.entry.kind === 'micro');
    if (!micro) return;
    const a = pickMenuEntry(content, base, micro.entry.id);
    const b = pickMenuEntry(content, base, micro.entry.id);
    expect(a.run).toEqual(b.run);
  });

  it('blocks leaving while a required entry is open, then closes the menu on the move', () => {
    let run = ensureNodeMenu(content, onNode('flow-3'));
    const menu = currentMenu(run)!;
    const side = findNode(run.stage!.map, run.stage!.current!).sides[0];
    if (side) {
      // Force a required side entry to test the gate.
      const forced = structuredClone(run);
      const m = currentMenu(forced)!;
      const entry = m.entries.find((e) => e.sideId === side.id) ?? m.entries[1]!;
      entry.required = true;
      if (entry.kind === 'side') {
        expect(menuBlocker(forced)).toMatch(/before moving on/);
        expect(() => chooseNode(content, forced, mapChoices(content, forced)[0]!.id)).toThrow(/before moving on/);
      }
    }
    expect(menuBlocker(run)).toBeNull();
    run = chooseNode(content, run, mapChoices(content, run)[0]!.id);
    expect(run.expansion!.nodeMenus!.menus[menu.nodeId]!.closed).toBe(true);
  });

  it('with the setting off, the same seed plays exactly as before', () => {
    const a = autoplay({ seed: 'same-old', steps: 250, smart: true, healOnMap: true });
    const b = autoplay({ seed: 'same-old', steps: 250, smart: true, healOnMap: true, expansion: { nodeMenus: false } });
    expect(b).toEqual(a);
  });
});
