// Copies the animated trainer sprites from the Pokémon Memories repo
// (AwsomSause/Pokemon-Memories, Graphics/Trainers) for the bosses the game
// already has a still picture of, plus the Gen 4 / Gen 5 back sprites (the
// player's throwing pose). Pixels are unchanged; each strip gets an atlas
// file so the game can play it.
//
//   node tools/memories/import-trainer-anims.ts "<Pokemon Memories folder>"
//
// Front strips are square frames side by side; back strips are five frames.
// Afterwards run `npm run assets:manifest`.

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [game] = process.argv.slice(2);
const src = game ? join(game, 'Graphics', 'Trainers') : '';
if (!game || !existsSync(src)) {
  console.error('Usage: node tools/memories/import-trainer-anims.ts "<Pokemon Memories folder>"');
  process.exit(1);
}
const root = join(import.meta.dirname, '..', '..');
const bosses = join(root, 'public', 'assets', 'images', 'bosses');
const have = new Set(readdirSync(bosses).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)));
/** Essentials names → our boss picture names where they differ. */
const ALIAS: Record<string, string> = { surge: 'ltsurge', wake: 'crasherwake' };

const size = (file: string) => {
  const b = readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

function atlas(file: string, out: string, name: string, frameW: number, frameH: number): number {
  const { w, h } = size(file);
  const count = Math.floor(w / frameW);
  copyFileSync(file, join(out, `${name}.png`));
  const frames = Array.from({ length: count }, (_, i) => ({
    filename: `${String(i + 1).padStart(4, '0')}.png`,
    rotated: false,
    trimmed: false,
    sourceSize: { w: frameW, h: frameH },
    spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH },
    frame: { x: i * frameW, y: 0, w: frameW, h: frameH },
  }));
  writeFileSync(join(out, `${name}.json`), `${JSON.stringify({ textures: [{ image: `${name}.png`, format: 'RGBA8888', size: { w, h }, scale: 1, frames }] })}\n`);
  return count;
}

const front: string[] = [];
const frontOut = join(bosses, 'anim');
mkdirSync(frontOut, { recursive: true });
for (const file of readdirSync(src).sort()) {
  const base = file.replace(/\.png$/i, '');
  if (base === file || !base.includes('_') || /_back$/i.test(base)) continue;
  const raw = base.slice(base.indexOf('_') + 1).toLowerCase();
  const name = ALIAS[raw] ?? raw;
  if (!have.has(name)) continue;
  const { w, h } = size(join(src, file));
  // Square frames; one strip (Cheryl) is a pixel taller than its frames are wide.
  const count = Math.round(w / h);
  if (count < 2 || front.includes(name)) continue; // a still picture, or a second copy (Cheren is a leader and a trainer)
  atlas(join(src, file), frontOut, name, w % count === 0 ? w / count : h, h);
  front.push(name);
}

const back: string[] = [];
const backOut = join(bosses, 'back');
mkdirSync(backOut, { recursive: true });
for (const dir of ['Gen 4 Back sprites', 'Gen 5 Back sprites']) {
  for (const file of readdirSync(join(src, dir)).sort()) {
    const m = /^[A-Z]+_([A-Za-z0-9]+?)(?:_1)?_back\.png$/.exec(file);
    if (!m || /_1_back/.test(file)) continue; // the "_1" copies are alternate outfits; the plain one is used
    const raw = m[1]!.toLowerCase();
    const name = ALIAS[raw] ?? raw;
    if (!have.has(name) || back.includes(name)) continue;
    const { w, h } = size(join(src, dir, file));
    atlas(join(src, dir, file), backOut, name, w / 5, h);
    back.push(name);
  }
}
console.log(`${front.length} animated fronts, ${back.length} backs.`);
console.log(JSON.stringify(front));
console.log(JSON.stringify(back));
