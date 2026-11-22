// Puts the data file into the page:  node tools/sim100k/build-dashboard.mjs <data.json> <out.html> [artifact]
// With "artifact": writes the page without the html/head/body wrapper (for publishing) and the data as three files next to it
// (core.json, tables-a.json, tables-b.json), because a published page may not be larger than 16 MB.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
const [data, out, artifact] = process.argv.slice(2);
let html = readFileSync(join(import.meta.dirname, 'dashboard.html'), 'utf8');
if (!artifact) {
  const json = readFileSync(data, 'utf8').replace(/</g, '\\u003c');
  writeFileSync(out, html.replace('/*DATA*/', () => json));
  console.log(`${out}: ${(html.length + json.length) / 1e6} MB`);
} else {
  const d = JSON.parse(readFileSync(data, 'utf8'));
  const names = Object.keys(d.tables).sort((a, b) => JSON.stringify(d.tables[b]).length - JSON.stringify(d.tables[a]).length);
  const parts = [{}, {}]; const size = [0, 0];
  for (const n of names) { const i = size[0] <= size[1] ? 0 : 1; parts[i][n] = d.tables[n]; size[i] += JSON.stringify(d.tables[n]).length; }
  const dir = dirname(out); const { tables, ...core } = d; void tables;
  const files = { 'core.json': core, 'tables-a.json': parts[0], 'tables-b.json': parts[1] };
  for (const [f, v] of Object.entries(files)) { const s = JSON.stringify(v); writeFileSync(join(dir, f), s); console.log(`${f}: ${(s.length / 1e6).toFixed(1)} MB`); }
  const rep = (a, b) => { if (!html.includes(a)) throw new Error(`template changed: ${a.slice(0, 40)}`); html = html.replace(a, () => b); };
  html = html.replace(/<!doctype html>\n|<html[^>]*>\n|<\/?head>\n|<\/?body>\n|<\/html>\n?|<meta charset[^>]*>\n|<meta name="viewport"[^>]*>\n/g, '');
  rep('<script id="data" type="application/json">/*DATA*/</script>\n', '');
  rep("<script>\n'use strict';", "<script>\n(async () => {\ndocument.getElementById('main').textContent = 'Loading the run data…';");
  rep("const DATA = JSON.parse(document.getElementById('data').textContent);", "const [core, ta, tb] = await Promise.all(['core.json', 'tables-a.json', 'tables-b.json'].map((u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); })));\nconst DATA = { ...core, tables: { ...ta, ...tb } };");
  const end = html.lastIndexOf('</script>');
  html = html.slice(0, end) + "})().catch((e) => { document.getElementById('main').textContent = 'Could not load the run data: ' + e; });\n" + html.slice(end);
  writeFileSync(out, html);
  console.log(`${out}: ${(html.length / 1e3).toFixed(0)} KB`);
}
