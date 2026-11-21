import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import stones from '../../tools/jet/source/stones.json';

describe('Jet Mega Stone icons', () => {
  it('every new Mega Stone has its own picture file', () => {
    expect(stones.length).toBeGreaterThanOrEqual(64);
    for (const s of stones as { id: string }[]) {
      const file = `public/assets/images/items/${s.id.replace(/-/g, '_')}.png`;
      expect(fs.existsSync(file), file).toBe(true);
      expect(fs.statSync(file).size, file).toBeGreaterThan(100);
    }
  });
});
