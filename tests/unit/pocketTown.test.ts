// Walkable Pocket Town (Appendix S.5): the second map on the Hub Town engine. Every building has a door you can walk
// to from the entrance, ids match core/town, and the gate leads back to Hub Town.
import { describe, expect, it } from 'vitest';
import { POCKET_TOWN } from '../../src/core/hubTown/schema';
import { WalkGrid, ahead, placeAhead } from '../../src/core/hubTown/world';
import { TOWN } from '../../src/core/town';

const [W, H] = POCKET_TOWN.size;
const grid = new WalkGrid(POCKET_TOWN);

describe('Pocket Town map', () => {
  it('has full layers and every place inside the map with a walkable stand', () => {
    expect(POCKET_TOWN.ground).toHaveLength(W * H);
    expect(POCKET_TOWN.overlay).toHaveLength(W * H);
    for (const p of POCKET_TOWN.places) {
      expect(grid.inside(p.door.x, p.door.y), p.id).toBe(true);
      expect(grid.isSolid(p.stand.x, p.stand.y), `${p.id} stand`).toBe(false);
    }
  });

  it('has exactly one door for every Pocket Town building, with the same ids', () => {
    const doors = POCKET_TOWN.places.filter((p) => p.kind === 'building').map((p) => p.id).sort();
    const ids = TOWN.buildings.filter((b) => b.id !== 'square').map((b) => b.id).sort();
    expect(doors).toEqual(ids);
    expect(POCKET_TOWN.places.find((p) => p.id === 'square')?.rooms).toEqual(['square']);
  });

  it('can walk from the entrance to every door and face it (flood fill)', () => {
    const seen = new Set<number>([POCKET_TOWN.spawn.y * W + POCKET_TOWN.spawn.x]);
    const queue = [{ x: POCKET_TOWN.spawn.x, y: POCKET_TOWN.spawn.y }];
    while (queue.length) {
      const t = queue.shift()!;
      for (const f of ['up', 'down', 'left', 'right'] as const) {
        const n = ahead(t, f);
        const k = n.y * W + n.x;
        if (seen.has(k) || grid.isSolid(n.x, n.y)) continue;
        seen.add(k);
        queue.push(n);
      }
    }
    for (const p of POCKET_TOWN.places) {
      if (p.kind === 'gate') expect(seen.has(p.door.y * W + p.door.x), p.id).toBe(true);
      else {
        expect(seen.has(p.stand.y * W + p.stand.x), `${p.id} stand reachable`).toBe(true);
        expect(placeAhead(p.stand, p.stand.facing, POCKET_TOWN)?.id, `${p.id} faced from its stand`).toBe(p.id);
      }
    }
  });

  it('has four districts of twelve doors each', () => {
    for (const d of POCKET_TOWN.districts.filter((x) => x.id !== 'plaza')) {
      const [x, y, w, h] = d.rect;
      const inside = POCKET_TOWN.places.filter((p) => p.kind === 'building' && p.door.x >= x && p.door.x < x + w && p.door.y >= y && p.door.y < y + h);
      expect(inside, d.id).toHaveLength(12);
    }
  });
});
