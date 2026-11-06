// Validates src/data/story/*.json with the Zod schemas and writes src/data/story/hash.json (a content hash of the data).
// Authoring sources (CSV / design-doc tables) plug in here in later slices; F0 has none, so the JSON files are the source.
// Run with: npm run data:story  (exits non-zero on any schema error; `--check` only verifies hash.json is current)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type * as Files from '../src/data/story/files.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';
import { readStory, storedHash, storyDir } from './lib/storyFiles.ts';

const { storyDataFromFiles } = await loadModule<typeof Files>('/src/data/story/files.ts');
await closeModules();
const { raw, text, hash } = readStory();
try {
  storyDataFromFiles({ ...raw, text, hash } as never);
} catch (e) {
  console.error(`data:story failed:\n${(e as Error).message}`);
  process.exit(1);
}
if (process.argv.includes('--check')) {
  if (storedHash() !== hash) {
    console.error('src/data/story/hash.json is out of date: run npm run data:story');
    process.exit(1);
  }
} else {
  writeFileSync(join(storyDir, 'hash.json'), JSON.stringify({ hash }) + '\n');
}
console.log(`data:story ok (hash ${hash})`);
