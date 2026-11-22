// Bundles tools/sim100k/sim.ts into one plain file (dist-sim/sim.mjs) so each run is as fast as the game code allows.
import { build } from 'vite';
import { join } from 'node:path';
const root = join(import.meta.dirname, '..', '..');
await build({
  configFile: false, root, logLevel: 'error', publicDir: false,
  build: { ssr: join(root, 'tools/sim100k/sim.ts'), outDir: join(root, 'dist-sim'), emptyOutDir: true, minify: false, target: 'node22', rollupOptions: { output: { entryFileNames: 'sim.mjs', inlineDynamicImports: true } } },
  ssr: { noExternal: true },
});
