// Node Event Menus P7: a small bot sim for the special entries. A bot plays seeded runs with menus on and always
// takes a special card when one is offered. Checks the numbers stay in the plan's bounds (no flood, rivals capped).

import { scaledCap } from '../../src/core/stageLength';
import { describe, expect, it } from 'vitest';
import { currentMenu, ensureNodeMenu } from '../../src/core/nodeMenu/flow';
import { playSpecialEntry } from '../../src/core/nodeMenu/special/menu';
import { SPECIAL } from '../../src/core/nodeMenu/special/data';
import type { RunState } from '../../src/core/state';
import { autoplay } from './autoplay';
import { content } from './helpers';

const SEEDS = 12;

describe('special entries sim (P7)', () => {
  it('specials are occasional, play cleanly, and rival spoils stay capped', () => {
    let menus = 0, specials = 0, played = 0, last: RunState | null = null;
    const finals: RunState[] = [];
    for (let i = 0; i < SEEDS; i++) {
      last = null;
      autoplay({ seed: `nmsim-${i}`, steps: 700, smart: true, healOnMap: true, expansion: { nodeMenus: true }, onStep: (r) => {
        if (r.phase !== 'map' || r.stage?.kind !== 'stage' || !r.stage.current) { last = r; return undefined; }
        let run = ensureNodeMenu(content, r);
        const menu = currentMenu(run);
        if (!menu) { last = run; return run; }
        if (run !== r) menus++;
        const card = menu.entries.find((e) => e.kind === 'special' && !e.done && menu.picked.length < menu.picks);
        if (card && run !== r) specials++;
        if (card) {
          run = playSpecialEntry(content, run, card.id).run;
          played++;
        }
        last = run;
        return run;
      } });
      if (last) finals.push(last);
    }
    const spoils = finals.map((r) => r.expansion?.nodeMenuSpecial?.spoils.length ?? 0);
    const rate = specials / Math.max(1, menus);
    console.log(`[node-menu-special sim] runs ${SEEDS}, menus ${menus}, menus with a new special ${specials} (${(rate * 100).toFixed(1)}%), played ${played}, spoils per run max ${Math.max(...spoils)}`);
    expect(menus).toBeGreaterThan(50);
    expect(played).toBeGreaterThan(0);
    // The plan: specials season menus, they never take them over.
    expect(rate).toBeGreaterThan(0.08);
    expect(rate).toBeLessThan(0.3);
    for (const r of finals) {
      const st = r.expansion?.nodeMenuSpecial;
      if (!st) continue;
      const byStage: Record<string, number> = {};
      for (const s of st.spoils) byStage[s.stage] = (byStage[s.stage] ?? 0) + 1;
      for (const n of Object.values(byStage)) expect(n).toBeLessThanOrEqual(scaledCap(SPECIAL.rules.rivalTakes.maxPerStage, r));
      expect(new Set(st.done).size).toBe(st.done.length);
    }
  }, 600_000);
});
