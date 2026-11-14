// Beta 0.7 Node Event Menus P4: pacing sims. Plays seeded bot runs twice, with menus off and on (stage pacing on in
// both), and prints what the menus offered and how run length moved.
//   npm run sim:node-menus -- [runs=30] [out.json]
// Bot policy with menus on: on every node, play one micro entry if there is one (the cheapest pick), and clear a
// required entry by taking its first choice. Side stops the bot can't play (shops, raids...) are left alone, as before.

import { writeFileSync } from 'node:fs';
import type * as Auto from '../tests/unit/autoplay.ts';
import type * as Data from '../src/data/index.ts';
import type * as Flow from '../src/core/nodeMenu/flow.ts';
import type * as Events from '../src/core/events.ts';
import type * as State from '../src/core/state.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const { autoplay } = await loadModule<typeof Auto>('/tests/unit/autoplay.ts');
const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const flow = await loadModule<typeof Flow>('/src/core/nodeMenu/flow.ts');
const { chooseEvent } = await loadModule<typeof Events>('/src/core/events.ts');
await closeModules();

type RunState = State.RunState;
const content = buildContent();
const RUNS = Number(process.argv[2] ?? 30);
const OUT = process.argv[3];
const STEPS = 2500;

interface Row { seed: string; menus: boolean; steps: number; battles: number; regions: number; stages: number; error?: string }
interface MenuStats { menus: number; entries: number; sizes: Record<number, number>; kinds: Record<number, number>; categories: Record<string, number>; side: number; micro: number; keep: number; required: number; dropped: number; dry: number; picks: number; bonusPicks: number }

const ms: MenuStats = { menus: 0, entries: 0, sizes: {}, kinds: {}, categories: {}, side: 0, micro: 0, keep: 0, required: 0, dropped: 0, dry: 0, picks: 0, bonusPicks: 0 };
const bump = (o: Record<string | number, number>, k: string | number) => (o[k] = (o[k] ?? 0) + 1);

function botMenu(run: RunState): RunState {
  if (run.phase !== 'map') return run;
  let next = flow.ensureNodeMenu(content, run);
  const view = flow.nodeMenuView(next);
  if (!view) return next;
  const menu = view.menu;
  if (next !== run) {
    // A new menu: count it once.
    const body = menu.entries.filter((e) => e.kind !== 'encounter');
    ms.menus++;
    ms.entries += body.length;
    bump(ms.sizes, body.length);
    const cats = new Set(body.map((e) => e.category));
    bump(ms.kinds, cats.size);
    for (const e of body) bump(ms.categories, e.category);
    ms.side += body.filter((e) => e.kind === 'side').length;
    ms.micro += body.filter((e) => e.kind === 'micro').length;
    ms.keep += body.filter((e) => e.keep).length;
    ms.required += menu.entries.filter((e) => e.required && e.kind !== 'encounter').length;
    ms.dropped += menu.dropped.length;
    if (!body.some((e) => e.kind === 'side')) ms.dry++;
    ms.picks += menu.picks;
    if (menu.picks > 1) ms.bonusPicks++;
    const micro = view.entries.find((v) => v.entry.kind === 'micro' && !v.done && !v.locked);
    if (micro) next = flow.pickMenuEntry(content, next, micro.entry.id).run;
  }
  // Clear required entries so the bot can move on.
  for (let guard = 0; guard < 3; guard++) {
    const open = flow.currentMenu(next)?.entries.find((e) => e.required && e.sideId && !flow.entryDone(next, e));
    if (!open) break;
    try {
      next = chooseEvent(content, next, open.sideId!, 0).run;
    } catch {
      next = structuredClone(next);
      const side = next.stage!.map.nodes.flatMap((n) => n.sides).find((s) => s.id === open.sideId);
      if (side) side.used = true;
    }
    if (next.phase !== 'map') break;
  }
  return next;
}

const rows: Row[] = [];
for (let i = 0; i < RUNS; i++) {
  for (const menus of [false, true]) {
    const seed = `nm${i}`;
    const row: Row = { seed, menus, steps: 0, battles: 0, regions: 0, stages: 0 };
    try {
      const run = autoplay({ seed, steps: STEPS, smart: true, healOnMap: true, expansion: { stagePacing: true, nodeMenus: menus }, onStep: (r) => {
        row.steps++;
        return menus ? botMenu(r) : undefined;
      } });
      row.battles = run.encountersCompleted;
      row.regions = run.regionsCleared.length;
      row.stages = run.usedThemes.length;
    } catch (e) {
      row.error = (e as Error).message.slice(0, 160);
    }
    rows.push(row);
  }
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const side = (m: boolean) => rows.filter((r) => r.menus === m && !r.error);
const pct = (n: number, d: number) => `${d ? Math.round((n / d) * 1000) / 10 : 0}%`;
const off = side(false);
const on = side(true);
console.log(`Node menu sim: ${RUNS} seeds x (off, on), ${STEPS} steps max, stage pacing on`);
console.log(`errors: off ${rows.filter((r) => !r.menus && r.error).length}, on ${rows.filter((r) => r.menus && r.error).length}`);
for (const r of rows.filter((x) => x.error).slice(0, 5)) console.log(`  ${r.seed} ${r.menus ? 'on' : 'off'}: ${r.error}`);
console.log(`run length (battles): off ${avg(off.map((r) => r.battles)).toFixed(1)}, on ${avg(on.map((r) => r.battles)).toFixed(1)}`);
console.log(`stages reached: off ${avg(off.map((r) => r.stages)).toFixed(2)}, on ${avg(on.map((r) => r.stages)).toFixed(2)}; regions: off ${avg(off.map((r) => r.regions)).toFixed(2)}, on ${avg(on.map((r) => r.regions)).toFixed(2)}`);
console.log(`menus ${ms.menus}; entries per menu ${(ms.entries / Math.max(1, ms.menus)).toFixed(2)}; sizes ${JSON.stringify(ms.sizes)}; kinds per menu ${JSON.stringify(ms.kinds)}`);
console.log(`entries: side stops ${pct(ms.side, ms.entries)}, micro ${pct(ms.micro, ms.entries)}, keep ${pct(ms.keep, ms.entries)}; required story entries ${ms.required}; menus with no side stop (micro only) ${pct(ms.dry, ms.menus)}`);
console.log(`side stops trimmed ${ms.dropped} (${(ms.dropped / Math.max(1, ms.menus)).toFixed(2)} per menu); picks per menu ${(ms.picks / Math.max(1, ms.menus)).toFixed(2)}, bonus-pick menus ${pct(ms.bonusPicks, ms.menus)}`);
console.log(`categories ${JSON.stringify(ms.categories)}`);
if (OUT) writeFileSync(OUT, JSON.stringify({ rows, menus: ms }, null, 2));
