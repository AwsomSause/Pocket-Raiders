// Builds src/data/expansion/canonSpacesKanto.json from tools/sources/expansion/CANON_SPACES_KANTO.md (Beta 0.6 workstream 18).
// Run: node tools/build-canon-spaces.ts            (add --check to fail instead of writing when the file would change)
// Reads each town's space table (kind, appears), the spec block under every `cs.kanto.*` heading (level, length, flags)
// and the route events in section 13.1. Never edit the generated JSON by hand.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CanonSpacesFileSchema, canonSpaceGaps } from '../src/core/expansion/canonSpaces.ts';
import type { CanonSpace, CanonSpacesFile } from '../src/core/expansion/canonSpaces.ts';

const root = join(import.meta.dirname, '..');
const SRC = join(root, 'tools', 'sources', 'expansion', 'CANON_SPACES_KANTO.md');
const OUT = join(root, 'src', 'data', 'expansion', 'canonSpacesKanto.json');
const problems: string[] = [];
const lines = readFileSync(SRC, 'utf8').split('\n');
const strip = (s: string) => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\*([^*]+)\*/g, '$1').trim();
const key = (s: string) => strip(s).toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9]/g, '');
const cells = (l: string) => l.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());

const TOWNS: [number, string, string][] = [[2, 'viridian', 'Viridian City'], [3, 'pewter', 'Pewter City'], [4, 'cerulean', 'Cerulean City'], [5, 'vermilion', 'Vermilion City'], [6, 'lavender', 'Lavender Town'], [7, 'celadon', 'Celadon City'], [8, 'fuchsia', 'Fuchsia City'], [9, 'saffron', 'Saffron City'], [10, 'cinnabar', 'Cinnabar Island'], [11, 'indigo', 'Indigo Plateau']];
// Stage slots (section 0.4): the town placed in each slot. Stage 8 is Viridian's return, which replays only Route 22.
const SLOTS = [['interlude-0', 'viridian', 0], ['stage-1', 'pewter', 1], ['stage-2', 'cerulean', 2], ['stage-3', 'vermilion', 3], ['interlude-3', 'lavender', 3], ['stage-4', 'celadon', 4], ['stage-5', 'fuchsia', 5], ['stage-6', 'saffron', 6], ['stage-7', 'cinnabar', 7], ['stage-8', 'viridian', 8], ['finale', 'indigo', 8]] as const;
// What the spec text says in words, written as data: what a space needs, and which one-time rewards retire it.
const REQUIRES: Record<string, { flags?: string[]; spaces?: string[] }> = {
  'cs.kanto.vermilion.ssanne': { flags: ['kanto.ssanne.ticket'] },
  'cs.kanto.cerulean.hidden-village': { flags: ['kanto.bridge.fell'] },
  'cs.kanto.saffron.tournament': { flags: ['kanto.mankey'] },
  'cs.kanto.fuchsia.warden': { spaces: ['cs.kanto.fuchsia.safari'] },
  'cs.kanto.fuchsia.tauros': { spaces: ['cs.kanto.fuchsia.safari'] },
  'cs.kanto.cerulean.cave': { spaces: ['cs.kanto.indigo.road'] },
};
const UNIQUE: Record<string, string> = { 'cs.kanto.vermilion.maiden': 'kanto.maiden.zcrystal', 'cs.kanto.cerulean.hidden-village': 'kanto.hidden.done' };
const TOWN_OF: Record<string, string> = { 'cs.kanto.cerulean.cave': 'indigo' }; // listed under Cerulean, played after Victory Road

// Table rows the pack lists but never specifies (no id, beats or reward). Left out until the director writes them; see the update note.
const UNSPECIFIED = new Set(["Haunter's Prank"]);

// Every space id with a spec block: headings "### 3.2 Name (`id`...)" and bold bullets "- **Name** (`id`)".
interface Found { id: string; name: string; section: string; start: number; end: number }
const found: Found[] = [];
const headingAt = (i: number) => /^#{2,4} /.test(lines[i]!);
for (let i = 0; i < lines.length; i++) {
  const l = lines[i]!;
  const h = /^#{3,4} ([\d.]+) (.+?) \(`(cs\.kanto\.[a-z0-9.-]+)`/.exec(l);
  if (h) {
    let j = i + 1;
    while (j < lines.length && !headingAt(j)) j++;
    found.push({ id: h[3]!, name: h[2]!, section: h[1]!, start: i, end: j });
    continue;
  }
  const b = /^(?:- |\| )\*\*([^*]+)\*\* \(`(cs\.kanto\.[a-z0-9.-]+)`/.exec(l);
  if (b) found.push({ id: b[2]!, name: b[1]!, section: lines.slice(0, i).reverse().find((x) => /^#{3} /.test(x))?.match(/^### ([\d.]+)/)?.[1] ?? '', start: i, end: i + 1 });
}
// The Snag Test's id sits inside a bold phrase the patterns above do not read (line 800 of the pack file).
const snagLine = lines.findIndex((l) => l.includes('`cs.kanto.fuchsia.snag`'));
if (snagLine >= 0) found.push({ id: 'cs.kanto.fuchsia.snag', name: 'The Snag Test', section: '12.2', start: snagLine, end: snagLine + 1 });
const byId = new Map<string, Found>();
for (const f of found) if (!byId.has(f.id)) byId.set(f.id, f); // Cerulean Cave has two headings; the first one counts

const num = (s: string) => Number(s.replace('−', '-').replace('+', ''));
function specOf(f: Found) {
  const block = lines.slice(f.start, f.end).join('\n');
  let level: CanonSpace['level'] = null;
  const lv = /\*\*Level:\*\*\s*([^·\n]+)/.exec(block);
  if (lv) {
    const t = lv[1]!.trim();
    const rel = /^previous stage(?:\s*([−+-]\s*\d+))?/.exec(t);
    const fix = /^(\d+)[–-](\d+)/.exec(t);
    if (rel) level = { mode: 'relative', offset: rel[1] ? num(rel[1].replace(/\s/g, '')) : 0 };
    else if (fix) level = { mode: 'fixed', min: Number(fix[1]), max: Number(fix[2]) };
  }
  const len = /\*\*Length:\*\*\s*(\d+) nodes/.exec(block);
  const flags = new Set<string>();
  for (const fl of block.matchAll(/\*\*Flags:\*\*([^\n]*)/g)) for (const m of fl[1]!.matchAll(/`(kanto\.[a-z0-9.-]+)`/g)) flags.add(m[1]!);
  const kind = /\*\*Kind:\*\*\s*`(PS|MC|EV|HUB|SHOP|CUT)`/.exec(block)?.[1];
  return { level, length: len ? Number(len[1]) : null, flags: [...flags], kind };
}

const spaces: CanonSpace[] = [];
const seen = new Set<string>();
function push(id: string, town: string, name: string, kind: CanonSpace['kind'], appears: CanonSpace['appears'], f: Found) {
  if (seen.has(id)) return;
  seen.add(id);
  const sp = specOf(f);
  const parent = [...byId.keys()].filter((p) => id.startsWith(p + '.')).sort((a, b) => b.length - a.length)[0] ?? null;
  const rq = REQUIRES[id] ?? {};
  spaces.push({ id, town: TOWN_OF[id] ?? town, parent, name: strip(name), kind, appears, requires: { flags: rq.flags ?? [], spaces: rq.spaces ?? [] }, uniqueRewardFlag: UNIQUE[id] ?? null, level: sp.level, length: sp.length, flags: sp.flags, section: f.section });
}

// 1. The town tables.
const sections = lines.map((l, i) => [l, i] as const).filter(([l]) => /^## \d+\. /.test(l));
for (const [num_, town] of TOWNS) {
  const at = sections.find(([l]) => l.startsWith(`## ${num_}. `));
  if (!at) { problems.push(`no section ${num_}`); continue; }
  const next = sections.find(([, i]) => i > at[1]);
  const body = lines.slice(at[1], next ? next[1] : lines.length);
  const hdr = body.findIndex((l) => /^\| Space \| Kind \| Appears \|/.test(l));
  const rows: string[][] = [];
  if (hdr >= 0) for (let j = hdr + 2; j < body.length && /^\|/.test(body[j]!); j++) rows.push(cells(body[j]!));
  const inSection = found.filter((f) => f.start >= at[1] && f.start < (next ? next[1] : lines.length));
  for (const r of rows) {
    const name = strip(r[0]!);
    if (UNSPECIFIED.has(name)) continue;
    const f = inSection.find((x) => key(x.name) === key(name)) ?? inSection.find((x) => key(x.name).includes(key(name)) || key(name).includes(key(x.name))) ?? found.find((x) => key(x.name) === key(name));
    if (!f) { problems.push(`${town}: no id found for table row "${name}"`); continue; }
    const kind = /(PS|MC|EV|HUB|SHOP|CUT)/.exec(r[1]!)?.[1] as CanonSpace['kind'] | undefined;
    const word = strip(r[2]!).split(/[\s(]/)[0]!.toLowerCase();
    if (!kind) { problems.push(`${f.id}: bad kind "${r[1]}"`); continue; }
    if (!['always', 'roll', 'trigger', 'locked'].includes(word)) { problems.push(`${f.id}: bad appears "${r[2]}"`); continue; }
    push(f.id, town, f.name.replace(/\s*\(with the Samurai\)/, ''), kind, word as CanonSpace['appears'], f);
  }
  // Spaces with a spec block but no table row: sub-spaces ride with their parent (always), the rest are Indigo's two.
  for (const f of inSection) {
    if (seen.has(f.id)) continue;
    const sp = specOf(f);
    const parent = [...byId.keys()].some((p) => f.id.startsWith(p + '.'));
    const kind = (sp.kind ?? (town === 'indigo' ? 'PS' : 'EV')) as CanonSpace['kind'];
    push(f.id, town, f.name, kind, parent ? 'always' : town === 'indigo' ? 'always' : 'roll', f);
  }
}
// 2. The Cerulean Cave table row is "Locked"; section 11.3 gives its heading too. 3. Route events (13.1).
for (const f of found.filter((x) => x.id.startsWith('cs.kanto.route.'))) push(f.id, 'route', f.name, 'EV', 'route', f);
const forced = spaces.find((s) => s.id === 'cs.kanto.cerulean.cave');
if (forced) forced.appears = 'locked';

const file: CanonSpacesFile = {
  region: 'kanto',
  townRoll: { early: 2, late: 3, maxPseudoStages: 2 },
  towns: TOWNS.map(([, id, name]) => ({ id, name })),
  slots: SLOTS.map(([slot, town, stage]) => ({ slot, town, stage, always: slot === 'stage-8' ? ['cs.kanto.viridian.route22'] : null })),
  spaces,
};
const parsed = CanonSpacesFileSchema.safeParse(file);
if (!parsed.success) problems.push(`schema: ${parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
else problems.push(...canonSpaceGaps(parsed.data));
if (problems.length) { console.error('canon spaces: PROBLEMS\n  ' + problems.join('\n  ')); process.exit(1); }

const text = JSON.stringify(parsed.data, null, 1) + '\n';
if (process.argv.includes('--check')) {
  if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== text) { console.error('canon spaces: canonSpacesKanto.json is stale; run npm run data:canon-spaces'); process.exit(1); }
} else writeFileSync(OUT, text);
console.log(`canon spaces: ${spaces.length} spaces, ${TOWNS.length} towns, ${SLOTS.length} slots`);
