// Summarises playtest JSONL from the deep bot: where runs ended (region and stage) and who ended them.
//   node tools/playtest.ts 0 24 out.jsonl --deep --heal --full --par=40 ; node tools/late-report.mjs out.jsonl [more.jsonl]
import { readFileSync } from 'node:fs';
const rows = process.argv.slice(2).flatMap((f) => readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l)));
const by = {}; let won = 0, bad = 0;
for (const r of rows) {
  if (r.error || r.stuck || r.bad) bad++;
  if (r.phase === 'over' && !r.by) won++;
  const k = `R${r.region}`; (by[k] ||= { n: 0, lvl: 0, foe: 0, last: {} }).n++; by[k].lvl += r.maxLevel ?? 0; by[k].foe += r.by?.level ?? 0;
  const s = r.by ? `${r.by.trainer}` : 'cleared'; by[k].last[s] = (by[k].last[s] ?? 0) + 1;
}
console.log(`runs ${rows.length}, cleared ${won}, errors/stuck ${bad}`);
for (const [k, v] of Object.entries(by).sort()) console.log(`${k}: ${v.n} runs ended (${Math.round((100 * v.n) / rows.length)}%), avg party max level ${Math.round(v.lvl / v.n)}, avg killer level ${Math.round(v.foe / v.n)}, top killers: ${Object.entries(v.last).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([a, b]) => `${a} x${b}`).join(', ')}`);
