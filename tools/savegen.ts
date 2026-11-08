// Save generator CLI. `node tools/savegen.ts <spec.json | preset-name> [out.json]` builds a save file you can load with
// Settings > "Import save from a file". `node tools/savegen.ts --list` lists presets; `--schema` prints every field.
// Field list and how to add more: tools/savegen/README.md.
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type * as Gen from '../src/save/saveGenerator.ts';
import type * as Data from '../src/data/index.ts';
import { closeModules, loadModule, root } from './lib/gameModules.ts';

const presetDir = join(root, 'tools', 'savegen', 'presets');
const presets = () => readdirSync(presetDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
const [arg, out] = process.argv.slice(2);
if (!arg || arg === '--list') {
  console.log('Usage: node tools/savegen.ts <spec.json | preset> [out.json]\nPresets: ' + presets().join(', '));
  process.exit(0);
}
const readSpec = (nameOrPath: string): Record<string, unknown> => {
  const file = existsSync(nameOrPath) ? nameOrPath : join(presetDir, `${nameOrPath}.json`);
  if (!existsSync(file)) { console.error(`No spec or preset "${nameOrPath}". Presets: ${presets().join(', ')}`); process.exit(1); }
  const spec = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  if (typeof spec.preset === 'string') {
    const { preset, ...rest } = spec;
    const base = readSpec(preset);
    // This spec wins; objects merge one level deep, lists and values replace.
    const merged: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(rest)) merged[k] = v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' ? { ...(base[k] as object), ...v } : v;
    return merged;
  }
  return spec;
};
const gen = await loadModule<typeof Gen>('/src/save/saveGenerator.ts');
const data = await loadModule<typeof Data>('/src/data/index.ts');
await closeModules();
if (arg === '--schema') {
  const { z } = await import('zod');
  console.log(JSON.stringify(z.toJSONSchema(gen.SaveSpecSchema), null, 1));
  process.exit(0);
}
try {
  const result = gen.generateSave(data.buildContent(), readSpec(arg));
  const dest = out ?? `savegen-${arg.replace(/.*[\\/]/, '').replace(/\.json$/, '')}.json`;
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, result.file);
  console.log(result.report.join('\n') + `\nWrote ${dest}. Load it: Settings > Import save from a file, then Continue.`);
} catch (err) {
  console.error('Save not generated:\n' + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
}
