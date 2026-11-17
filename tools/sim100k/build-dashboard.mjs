// Puts the data file into the page:  node tools/sim100k/build-dashboard.mjs <data.json> <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const [data, out] = process.argv.slice(2);
const html = readFileSync(join(import.meta.dirname, 'dashboard.html'), 'utf8');
const json = readFileSync(data, 'utf8').replace(/</g, '\\u003c');
writeFileSync(out, html.replace('/*DATA*/', () => json));
console.log(`${out}: ${(html.length + json.length) / 1e6} MB`);
