// Builds tools/sim100k/showdown-usage.json from Pokémon Showdown's public monthly usage stats
// (https://www.smogon.com/stats/<month>/chaos/<format>.json). Download the files into one folder first, then:
//   node tools/sim100k/showdown-usage.mjs <folder> <month>
// Output per species (ids lower-case letters and digits only): u = strength score 0..1, m = share of sets using each move,
// i = share of sets holding each item. Plus items = how common each held item is overall.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const [dir, month] = process.argv.slice(2);
const TIER = [[/ubers|vgc|champions(bss|vgc|ou|mega)/, 1], [/doublesou|gen9ou|nationaldex-/, 0.9], [/championsuu|gen9uu/, 0.7], [/ru/, 0.55], [/nu/, 0.45], [/pu/, 0.35], [/zu/, 0.3], [/nfe/, 0.2], [/lc/, 0.15]];
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const sp = {}; const items = {}; let itemTotal = 0; const formats = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const d = JSON.parse(readFileSync(join(dir, f), 'utf8')); const tier = (TIER.find(([re]) => re.test(f)) ?? [0, 0.5])[1];
  formats.push(`${d.info.metagame} (${d.info.cutoff}+, ${d.info['number of battles']} battles)`);
  for (const [name, x] of Object.entries(d.data)) {
    const w = Object.values(x.Abilities).reduce((a, b) => a + b, 0); if (!w || x['Raw count'] < 50) continue;
    const e = (sp[norm(name)] ??= { u: 0, w: 0, m: {}, i: {} });
    // Strength: the tier's weight, lifted by how often the Pokémon is picked inside that tier.
    e.u = Math.max(e.u, tier * (0.5 + 0.5 * Math.min(1, x.usage / 0.15)));
    const rc = x['Raw count']; e.w += rc;
    for (const [k, v] of Object.entries(x.Moves)) if (k) e.m[k] = (e.m[k] ?? 0) + (v / w) * rc;
    for (const [k, v] of Object.entries(x.Items)) if (k && k !== 'nothing') { e.i[k] = (e.i[k] ?? 0) + (v / w) * rc; items[k] = (items[k] ?? 0) + v; itemTotal += v; }
  }
}
const top = (o, w, n, min) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +(v / w).toFixed(3)]).filter(([, v]) => v >= min).sort((a, b) => b[1] - a[1]).slice(0, n));
const species = Object.fromEntries(Object.entries(sp).sort().map(([k, e]) => [k, { u: +e.u.toFixed(3), m: top(e.m, e.w, 14, 0.03), i: top(e.i, e.w, 6, 0.05) }]));
const out = { source: 'Pokémon Showdown usage stats, https://www.smogon.com/stats/ (public)', month, formats, items: top(items, itemTotal, 60, 0.002), species };
writeFileSync(join(import.meta.dirname, 'showdown-usage.json'), JSON.stringify(out));
console.log(Object.keys(species).length, 'species', Object.keys(out.items).length, 'items');
