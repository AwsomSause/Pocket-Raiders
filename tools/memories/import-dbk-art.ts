// Copies the Deluxe Battle Kit Z-Power, Terastallization and Dynamax art from
// the Pokémon Memories repo (AwsomSause/Pokemon-Memories) into the game, with
// unchanged pixels: one title card per Z-Move (named by our move id), the
// Z-Power particle, the Tera crystal kit, one Tera pattern per type, the Tera
// type icons, the Dynamax patterns and icons, the Mega Ring picture, and the
// two Mega Evolution sounds (converted to .m4a with ffmpeg).
//
//   node tools/memories/import-dbk-art.ts "<Pokemon Memories folder>"
//
// Afterwards run `npm run assets:manifest`.

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const [game] = process.argv.slice(2);
const src = game ? join(game, 'Graphics', 'Plugins', 'Deluxe Battle Kit', 'Z-Power') : '';
if (!game || !existsSync(join(src, 'Z-Titles'))) {
  console.error('Usage: node tools/memories/import-dbk-art.ts "<Pokemon Memories folder>"');
  process.exit(1);
}
const root = join(import.meta.dirname, '..', '..');
const out = join(root, 'public', 'assets', 'images', 'packs', 'dbk', 'zpower');
mkdirSync(join(out, 'titles'), { recursive: true });

const essKey = (id: string) => id.replace(/[^a-z0-9]/g, '').toUpperCase();
const moves = JSON.parse(readFileSync(join(root, 'src', 'data', 'moves.json'), 'utf8')) as { id: string }[];
const byKey = new Map(moves.map((m) => [essKey(m.id), m.id]));
byKey.set('TENMILLIONVOLTTHUNDERBOLT', '10-000-000-volt-thunderbolt'); // Essentials spells the number out
const copied: string[] = [];
const missed: string[] = [];
for (const file of readdirSync(join(src, 'Z-Titles'))) {
  const id = byKey.get(file.replace(/\.png$/i, ''));
  if (!id) {
    missed.push(file);
    continue;
  }
  copyFileSync(join(src, 'Z-Titles', file), join(out, 'titles', `${id}.png`));
  copied.push(id);
}
copyFileSync(join(src, 'particle.png'), join(out, 'particle.png'));
// Terastallization: the crystal kit, the patterns (named by type), the type icons.
const plugins = join(game, 'Graphics', 'Plugins');
const tera = join(root, 'public', 'assets', 'images', 'packs', 'dbk', 'tera');
mkdirSync(join(tera, 'patterns'), { recursive: true });
for (const n of ['crystal_1', 'crystal_2', 'crystal_3', 'crystal_4', 'icon', 'pulse', 'shine']) copyFileSync(join(plugins, 'Deluxe Battle Kit', 'Tera', `${n}.png`), join(tera, `${n}.png`));
for (const file of readdirSync(join(plugins, 'Terastallization', 'Patterns'))) {
  const type = file.replace(/^tera_pattern_?/, '').replace(/\.png$/, '').toLowerCase() || 'default';
  copyFileSync(join(plugins, 'Terastallization', 'Patterns', file), join(tera, 'patterns', `${type}.png`));
}
copyFileSync(join(plugins, 'Terastallization', 'tera_types.png'), join(tera, 'types.png'));
// Dynamax: the patterns (the default and Calyrex's own) and the icon.
const dmax = join(root, 'public', 'assets', 'images', 'packs', 'dbk', 'dynamax');
mkdirSync(join(dmax, 'patterns'), { recursive: true });
for (const file of readdirSync(join(plugins, 'Dynamax', 'Patterns'))) copyFileSync(join(plugins, 'Dynamax', 'Patterns', file), join(dmax, 'patterns', file.toLowerCase()));
copyFileSync(join(plugins, 'Dynamax', 'icon_dynamax.png'), join(dmax, 'icon.png'));
// Status patterns: the burn, freeze, paralysis and poison overlays a Pokémon wears while it has that status.
const statusOut = join(root, 'public', 'assets', 'images', 'packs', 'dbk', 'status');
mkdirSync(statusOut, { recursive: true });
for (const n of ['BURN', 'FROZEN', 'PARALYSIS', 'POISON']) copyFileSync(join(plugins, 'Deluxe Battle Kit', 'Status patterns', `${n}.png`), join(statusOut, `${n.toLowerCase()}.png`));
// Mega Evolution: the Mega Ring (the key item that rises in the cinematic) and the two PRSFX sounds.
copyFileSync(join(game, 'Graphics', 'Items', 'MEGARING.png'), join(root, 'public', 'assets', 'images', 'packs', 'dbk', 'mega', 'ring.png'));
const cineAudio = join(root, 'public', 'assets', 'audio', 'cine');
mkdirSync(cineAudio, { recursive: true });
for (const n of [1, 2]) {
  const wav = join(game, 'Audio', 'SE', 'Anim', `PRSFX- Mega Evolution${n}.wav`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-c:a', 'aac', '-b:a', '64k', join(cineAudio, `mega_evolution${n}.m4a`)]);
}
console.log(`${copied.length} Z-Move title cards and the particle copied.${missed.length ? ` No move for: ${missed.join(', ')}` : ''}`);
console.log(JSON.stringify(copied.sort()));
