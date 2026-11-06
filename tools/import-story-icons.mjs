// Copies the Story Overhaul asset pack's 107 generated icons (Pokemon_Roguelike_Asset_Pack/02_PixelLab_Generated_Sprites)
// into public/assets/images/packs/story/<group>/<slug>.png. Usage: node tools/import-story-icons.mjs <pack folder>
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const src = join(process.argv[2] ?? '.', '02_PixelLab_Generated_Sprites');
const groups = { emote: 'Emote Bubble - ', tone: 'Choice Tone Icon - ', snack: 'Snack Icon - ', heart: 'Bond Heart - Level ', elite: 'Elite Token ', trophy: 'Champion Trophy', badge: 'Gym Badge - ', keepsake: 'Keepsake Accessory - ', ballfx: 'Ball Exit Effect - ' };
let n = 0;
for (const dir of readdirSync(src, { withFileTypes: true }).filter((d) => d.isDirectory() && /^0\d_/.test(d.name))) {
  for (const f of readdirSync(join(src, dir.name)).filter((x) => x.endsWith('.png'))) {
    const [group, prefix] = Object.entries(groups).find(([, p]) => f.startsWith(p)) ?? [];
    if (!group) throw new Error(`unknown icon ${f}`);
    const slug = f.slice(prefix.length).replace(/ \(\d+x\d+\)\.png$/, '').trim().toLowerCase().replace(/\s+/g, '_') || 'champion';
    mkdirSync(`public/assets/images/packs/story/${group}`, { recursive: true });
    copyFileSync(join(src, dir.name, f), `public/assets/images/packs/story/${group}/${slug}.png`);
    n++;
  }
}
console.log(`${n} icons copied`);
