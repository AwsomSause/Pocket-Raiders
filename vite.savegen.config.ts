// Builds only the Save Creator page (savegen.html) into dist-savegen/. Kept out of the game's own build so the game's chunks stay as they were.
// `npm run build:savegen`; during development `npm run dev` already serves /savegen.html.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2022', outDir: 'dist-savegen', emptyOutDir: true, chunkSizeWarningLimit: 6000, rolldownOptions: { input: fileURLToPath(new URL('./savegen.html', import.meta.url)), checks: { pluginTimings: false } } },
});
