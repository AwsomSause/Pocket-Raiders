// Copies the VS screen art from the Pokémon Memories repo
// (AwsomSause/Pokemon-Memories, Graphics/Transitions) for the bosses the game
// has: HGSS-style cards (hgss_vs_*), Black/White-style cards (vsTrainer_*),
// the Elite Four / Champion bar (vsE4_*), the champion set (champion_vs_*),
// and the shared bars, VS letters, flash and champion backdrop. Pixels are
// unchanged.
//
//   node tools/memories/import-vs-screens.ts "<Pokemon Memories folder>"
//
// Prints the boss → style table for `VS_CARDS` in src/assets/catalog.ts.
// Afterwards run `npm run assets:manifest`.

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const [game] = process.argv.slice(2);
const src = game ? join(game, 'Graphics', 'Transitions') : '';
if (!game || !existsSync(src)) {
  console.error('Usage: node tools/memories/import-vs-screens.ts "<Pokemon Memories folder>"');
  process.exit(1);
}
const root = join(import.meta.dirname, '..', '..');
const bosses = readdirSync(join(root, 'public', 'assets', 'images', 'bosses'))
  .filter((f) => f.endsWith('.png'))
  .map((f) => f.slice(0, -4));
const out = join(root, 'public', 'assets', 'images', 'packs', 'memories', 'vs');
for (const d of ['cards', 'bars', 'shared']) mkdirSync(join(out, d), { recursive: true });

/** Essentials trainer names → our boss picture names where they differ. */
const ALIAS: Record<string, string> = {
  surge: 'ltsurge',
  wake: 'crasherwake',
  rocketboss: 'giovanni-rocketboss',
};
/** Our bosses for an Essentials trainer type ("LEADER_Brock" → brock): the same name, else every picture of that person ("cynthia-…"). */
function bossesFor(trType: string): string[] {
  const raw = (trType.includes('_') ? trType.slice(trType.indexOf('_') + 1) : trType).toLowerCase();
  const name = ALIAS[raw] ?? raw;
  if (bosses.includes(name)) return [name];
  return bosses.filter((b) => b.startsWith(`${name}-`));
}

// The stronger style wins when a trainer has more than one card.
const STYLES = [
  ['champion', 'champion_vs_'],
  ['e4', 'vsE4_'],
  ['bw', 'vsTrainer_'],
  ['hgss', 'hgss_vs_'],
] as const;
const cards: Record<string, string> = {};
const bars: string[] = [];
const files = readdirSync(src);
for (const [style, prefix] of STYLES) {
  for (const file of files) {
    if (!file.startsWith(prefix) || !file.endsWith('.png')) continue;
    const trType = file.slice(prefix.length, -4);
    for (const name of bossesFor(trType)) {
      if (cards[name]) continue;
      cards[name] = style;
      copyFileSync(join(src, file), join(out, 'cards', `${name}.png`));
      // A trainer's own bar (HGSS Kanto leaders, BW rivals), else the shared one.
      const ownBar = style === 'hgss' ? `hgss_vsBar_${trType}.png` : style === 'bw' ? `vsBar_${trType}.png` : null;
      if (ownBar && files.includes(ownBar)) {
        copyFileSync(join(src, ownBar), join(out, 'bars', `${name}.png`));
        bars.push(name);
      }
    }
  }
}
const SHARED: Record<string, string> = {
  hgss_bar: 'hgss_vsBar',
  hgss_vs1: 'hgss_vs1',
  hgss_vs2: 'hgss_vs2',
  bw_bar: 'vsBar',
  bw_vs: 'vs',
  flash: 'vsFlash',
  e4_bar: 'vsE4Bar',
  champion_bg: 'champion_vsBG',
  champion_beam: 'champion_vsBeam',
  champion_bar: 'champion_vsBar',
  champion_shine1: 'champion_vsShine1',
  champion_shine2: 'champion_vsShine2',
};
for (const [ours, theirs] of Object.entries(SHARED)) copyFileSync(join(src, `${theirs}.png`), join(out, 'shared', `${ours}.png`));
const sorted = Object.fromEntries(Object.entries(cards).sort(([a], [b]) => a.localeCompare(b)));
console.log(`${Object.keys(cards).length} VS cards, ${bars.length} own bars.`);
console.log(JSON.stringify(sorted));
console.log(JSON.stringify(bars.sort()));
