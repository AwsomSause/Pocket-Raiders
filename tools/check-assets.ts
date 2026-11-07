// Static asset check: every file the game can ask for must exist, decode, and match its atlas.
//
//   npm run assets:check            (exit 1 if anything is broken)
//   node tools/check-assets.ts --urls out.txt   also writes every referenced path, one per line, for the live-site check
//
// Looks at: the catalog (sprites, items, trainers, arenas, UI, audio, fonts, animations),
// plus every "images/…", "audio/…", "battle-anims/…" or "fonts/…" string written in src/ code and data.
// Then decodes every PNG under public/assets, parses every JSON, and checks atlas frames fit inside their image.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative, dirname } from 'node:path';
import { inflateSync } from 'node:zlib';
import { buildCatalog, filesOf } from '../src/assets/catalog.ts';
import { readCatalogInputs } from './catalogInputs.ts';

const root = join(import.meta.dirname, '..');
const assetsDir = join(root, 'public', 'assets');
const problems = new Map<string, string[]>();
const add = (kind: string, msg: string): void => {
  if (!problems.has(kind)) problems.set(kind, []);
  problems.get(kind)!.push(msg);
};

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const typeOf = (p: string): string => {
  if (p.startsWith('audio/')) return `audio (${p.split('/')[1] ?? ''})`;
  if (p.startsWith('fonts/')) return 'fonts';
  if (p.startsWith('battle-anims/')) return 'battle-anim data';
  if (p.startsWith('images/pokemon/')) return /\/(shiny|back)\//.test(p) ? 'pokemon sprites (back/shiny)' : p.includes('/icons/') ? 'pokemon icons' : 'pokemon sprites';
  if (p.startsWith('images/items/')) return 'item pictures';
  if (p.startsWith('images/trainer/') || p.startsWith('images/bosses/')) return 'trainer/boss sprites';
  if (p.startsWith('images/overworld/')) return 'overworld/NPC';
  if (p.startsWith('images/arenas/')) return 'arenas';
  if (p.startsWith('images/ui/')) return 'ui images';
  if (p.startsWith('images/battle_anims/')) return 'battle effect images';
  if (p.startsWith('images/pokeball/')) return 'pokeball images';
  if (p.startsWith('images/packs/')) return 'pack images';
  return 'other';
};

// ---- 1. Which files are referenced? ----
const referenced = new Map<string, string>(); // path under assets -> where it was referenced
for (const entry of buildCatalog(readCatalogInputs())) for (const f of filesOf(entry)) if (!referenced.has(f)) referenced.set(f, `catalog ${entry.id}`);

const refRe = /(?:assets\/)?((?:images|audio|battle-anims|fonts)\/[A-Za-z0-9_@. \-/]+\.(?:png|json|m4a|ogg|mp3|wav|ttf|woff2?|otf|gif|webp|jpg|jpeg|svg|webm|mp4))/g;
const srcFiles = walk(join(root, 'src')).filter((f) => /\.(ts|json|html)$/.test(f));
srcFiles.push(join(root, 'index.html'));
for (const f of srcFiles) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(refRe)) {
    // Skip data files that merely name themselves (e.g. src/data/audio/story_music.json in a comment).
    if (!referenced.has(m[1]!) && !existsSync(join(root, 'src', 'data', m[1]!))) referenced.set(m[1]!, relative(root, f));
  }
}
let missingRefs = 0;
for (const [p, from] of referenced) {
  if (!existsSync(join(assetsDir, p))) {
    missingRefs++;
    add(`MISSING ${typeOf(p)}`, `${p}  (from ${from})`);
  }
}

// ---- 2. Case problems: path must match git's spelling exactly, and no two files may differ only by case ----
const tracked = new Set(
  execFileSync('git', ['ls-files', '-z', 'public/assets'], { cwd: root, maxBuffer: 1 << 28 })
    .toString()
    .split('\0')
    .filter(Boolean)
    .map((f) => f.slice('public/assets/'.length)),
);
const lower = new Map<string, string>();
for (const t of tracked) {
  const l = t.toLowerCase();
  if (lower.has(l) && lower.get(l) !== t) add('CASE collision (two files differ only by case)', `${lower.get(l)}  vs  ${t}`);
  lower.set(l, t);
}
for (const [p, from] of referenced) {
  if (!tracked.has(p) && existsSync(join(assetsDir, p))) {
    const real = lower.get(p.toLowerCase());
    add(real ? 'CASE mismatch (works on Windows, 404 on the live site)' : 'NOT COMMITTED (exists locally only)', `${p}${real ? ` -> really ${real}` : ''}  (from ${from})`);
  }
}

// ---- 3. Decode every PNG, parse every JSON, sanity-check audio/fonts ----
const pngSize = new Map<string, [number, number]>();
function checkPng(abs: string, rel: string): void {
  const b = readFileSync(abs);
  const sig = b.subarray(0, 8).toString('hex');
  if (b.length < 45 || sig !== '89504e470d0a1a0a') return void add(`BROKEN ${typeOf(rel)}`, `${rel}  not a PNG (${b.length} bytes)`);
  let off = 8, w = 0, h = 0, depth = 0, ctype = 0, inter = 0, ended = false;
  const idat: Buffer[] = [];
  while (off + 12 <= b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString('latin1', off + 4, off + 8);
    if (off + 12 + len > b.length) return void add(`BROKEN ${typeOf(rel)}`, `${rel}  truncated PNG`);
    const d = b.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]!; ctype = d[9]!; inter = d[12]!; }
    else if (type === 'IDAT') idat.push(d);
    else if (type === 'IEND') { ended = true; break; }
    off += 12 + len;
  }
  if (!ended || w === 0 || h === 0) return void add(`BROKEN ${typeOf(rel)}`, `${rel}  no IEND/IHDR`);
  pngSize.set(rel, [w, h]);
  try {
    const raw = inflateSync(Buffer.concat(idat));
    if (inter === 0) {
      const ch = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[ctype] ?? 1;
      const expect = h * (1 + Math.ceil((w * ch * depth) / 8));
      if (raw.length !== expect) add(`BROKEN ${typeOf(rel)}`, `${rel}  pixel data ${raw.length} bytes, expected ${expect}`);
    }
  } catch (e) {
    add(`BROKEN ${typeOf(rel)}`, `${rel}  ${(e as Error).message}`);
  }
}
const audioMagic = (b: Buffer): boolean =>
  b.toString('latin1', 4, 8) === 'ftyp' || b.toString('latin1', 0, 4) === 'OggS' || b.toString('latin1', 0, 3) === 'ID3' || b.toString('latin1', 0, 4) === 'RIFF' || (b[0] === 0xff && (b[1]! & 0xe0) === 0xe0) || b.toString('latin1', 0, 4) === 'fLaC';

const all = walk(assetsDir);
const jsons: string[] = [];
let pngCount = 0, audioCount = 0;
for (const abs of all) {
  const rel = relative(assetsDir, abs).split('\\').join('/');
  if (rel === 'manifest.json') continue;
  const size = statSync(abs).size;
  if (size === 0) { add(`BROKEN ${typeOf(rel)}`, `${rel}  empty file`); continue; }
  if (rel.endsWith('.png')) { pngCount++; checkPng(abs, rel); }
  else if (rel.endsWith('.json')) jsons.push(rel);
  else if (/\.(m4a|ogg|mp3|wav|flac)$/.test(rel)) {
    audioCount++;
    const fd = readFileSync(abs).subarray(0, 16);
    if (!audioMagic(fd)) add(`BROKEN ${typeOf(rel)}`, `${rel}  not a recognised audio file`);
  }
}

// ---- 4. JSON files: parse, and for atlases check the images and frames ----
let atlasCount = 0;
for (const rel of jsons) {
  let data: any;
  try { data = JSON.parse(readFileSync(join(assetsDir, rel), 'utf8')); }
  catch (e) { add(`BROKEN ${typeOf(rel)}`, `${rel}  bad JSON: ${(e as Error).message}`); continue; }
  const textures: any[] | undefined = data?.textures;
  if (!Array.isArray(textures)) continue;
  atlasCount++;
  for (const t of textures) {
    const imgRel = join(dirname(rel), t.image).split('\\').join('/');
    const size = pngSize.get(imgRel);
    if (!existsSync(join(assetsDir, imgRel))) { add(`ATLAS image missing`, `${rel} -> ${imgRel}`); continue; }
    if (!size) continue; // already reported as broken
    if (t.size && (t.size.w !== size[0] || t.size.h !== size[1])) add('ATLAS size mismatch (.json vs .png)', `${rel}: json says ${t.size.w}x${t.size.h}, ${imgRel} is ${size[0]}x${size[1]}`);
    for (const fr of t.frames ?? []) {
      const f = fr.frame;
      if (f && (f.x < 0 || f.y < 0 || f.x + f.w > size[0] || f.y + f.h > size[1])) { add('ATLAS frame outside image', `${rel}: "${fr.filename}" ${f.x},${f.y} ${f.w}x${f.h} in ${size[0]}x${size[1]}`); break; }
    }
  }
}

// ---- report ----
const out = process.argv.indexOf('--urls');
if (out > 0) writeFileSync(process.argv[out + 1]!, [...new Set([...referenced.keys(), ...all.map((a) => relative(assetsDir, a).split('\\').join('/')).filter((r) => r !== 'manifest.json')])].sort().join('\n') + '\n');
console.log(`Checked ${referenced.size} referenced paths, ${all.length} files (${pngCount} PNG, ${audioCount} audio, ${atlasCount} atlases).`);
let total = 0;
for (const [kind, list] of [...problems].sort()) {
  total += list.length;
  console.log(`\n${kind}: ${list.length}`);
  for (const l of list.slice(0, 25)) console.log(`  ${l}`);
  if (list.length > 25) console.log(`  … and ${list.length - 25} more`);
}
console.log(total === 0 ? '\nAll assets OK.' : `\n${total} problem(s).`);
process.exit(total === 0 ? 0 : 1);
