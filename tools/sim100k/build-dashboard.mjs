// Puts the data file into the page:  node tools/sim100k/build-dashboard.mjs <data.json> <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const [data, out, artifact] = process.argv.slice(2); // third argument 'artifact' = page without the html/head/body wrapper (for publishing)
let html = readFileSync(join(import.meta.dirname, 'dashboard.html'), 'utf8');
if (artifact) html = html.replace(/<!doctype html>\n|<html[^>]*>\n|<\/?head>\n|<\/?body>\n|<\/html>\n?|<meta charset[^>]*>\n|<meta name="viewport"[^>]*>\n/g, '');
const json = readFileSync(data, 'utf8').replace(/</g, '\\u003c');
writeFileSync(out, html.replace('/*DATA*/', () => json));
console.log(`${out}: ${(html.length + json.length) / 1e6} MB`);
