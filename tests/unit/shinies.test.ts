import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// Every Pokémon sprite (canon, custom, Jet, Delta...) must have a shiny that looks different from the normal art.
// New sprites without one: run `npm run shinies:fill`, then commit the new shiny files.
describe('shiny sprites', () => {
  const probe = spawnSync('python3', ['-c', 'import PIL, numpy']);
  it.skipIf(probe.status !== 0)('every sprite has a distinct shiny', () => {
    const r = spawnSync('python3', ['tools/generate-shinies.py', '--check'], { encoding: 'utf8' });
    expect(r.stdout, 'run npm run shinies:fill').toContain('needs shiny: 0');
  }, 60000);
});
