import { describe, expect, it } from 'vitest';
import { getContent } from '../../src/data';

const IDS = ['galar-kubfu-disciple', 'galar-kubfu-tower', 'galar-swordbert-shieldbert', 'galar-runaway-wooloo', 'galar-lost-pokemon', 'galar-dynamax-investigator', 'galar-gigantamax-sighting', 'galar-local-tournament', 'galar-autograph-fans', 'galar-dynamax-disturbance'];

describe('Galar events', () => {
  const content = getContent();
  it('loads all ten and only in Galar', () => {
    for (const id of IDS) {
      const e = content.events.get(id);
      expect(e, id).toBeDefined();
      expect(e!.requires.some((r) => r.kind === 'region' && r.ids.includes('galar')), id).toBe(true);
    }
  });
  it('Kubfu: joins via trial or trust, then the tower gives either Urshifu style', () => {
    const disciple = JSON.stringify(content.events.get('galar-kubfu-disciple'));
    expect(disciple).toContain('"eventId":"galar-kubfu-tower"');
    const tower = content.events.get('galar-kubfu-tower')!;
    expect(tower.room).toBe(true);
    const forms = JSON.stringify(tower).match(/"to":"([a-z-]+)"/g);
    expect(forms).toEqual(['"to":"urshifu"', '"to":"urshifu-rapid-strike"']);
  });
  it('every species, boss and item an event names exists', () => {
    for (const id of IDS) {
      const text = JSON.stringify(content.events.get(id));
      for (const m of text.matchAll(/"(?:species|from|to)":("[a-z0-9-]+"|\[[^\]]*\])/g)) for (const s of m[1]!.match(/[a-z0-9-]+/g) ?? []) expect(content.species.has(s), `${id}: ${s}`).toBe(true);
      for (const m of text.matchAll(/"bossId":"([a-z0-9-]+)"/g)) expect(content.bosses.has(m[1]!), `${id}: ${m[1]}`).toBe(true);
      for (const m of text.matchAll(/"kind":"item","id":"([a-z0-9-]+)"/g)) expect(content.items.has(m[1]!), `${id}: ${m[1]}`).toBe(true);
    }
  });
});
