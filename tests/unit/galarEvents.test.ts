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

import { chooseStarter, createRun } from '../../src/core/run';
import { chooseEvent, eventView } from '../../src/core/events';

describe('Galar events spawn on the map', () => {
  const content = getContent();
  const galarIds = new Set(['galar-kubfu-disciple', 'galar-swordbert-shieldbert', 'galar-runaway-wooloo', 'galar-lost-pokemon', 'galar-dynamax-investigator', 'galar-gigantamax-sighting', 'galar-local-tournament', 'galar-autograph-fans', 'galar-dynamax-disturbance']);
  const seen = (region: string, seed: string): string[] => {
    let run = createRun(content, { runId: 'r', seed, archetypeId: 'red' });
    run.regionOrder = [region, ...run.regionOrder.filter((r) => r !== region)];
    run.regionIndex = 0;
    run = chooseStarter(content, run, 0);
    return run.stage!.map.nodes.flatMap((n) => n.sides).filter((s) => s.kind === 'event').map((s) => s.eventId ?? '');
  };
  it('turn up in Galar and never elsewhere', () => {
    let inGalar = 0;
    for (let i = 0; i < 80; i++) {
      inGalar += seen('galar', `G${i}`).filter((id) => galarIds.has(id)).length;
      expect(seen('kanto', `G${i}`).filter((id) => id.startsWith('galar-'))).toEqual([]);
    }
    expect(inGalar).toBeGreaterThan(8); // stage 1 only has the early ones; later stages add the rest
  });
});

describe('Galar events 1-4 play through', () => {
  const content = getContent();
  const first4 = ['galar-kubfu-disciple', 'galar-swordbert-shieldbert', 'galar-runaway-wooloo', 'galar-lost-pokemon'];
  // Finds a Galar run whose first stage offers this event, standing at the event's side stop.
  const findRun = (eventId: string) => {
    for (let i = 0; i < 600; i++) {
      let run = createRun(content, { runId: 'r', seed: `P${i}`, archetypeId: 'red' });
      // Galar as the third region, so the later stage gates (Kubfu from stage 3, Swordbert from 2) are open.
      const others = run.regionOrder.filter((r) => r !== 'galar');
      run.regionOrder = [others[0]!, others[1]!, 'galar', ...others.slice(2)];
      run.regionIndex = 2;
      run = chooseStarter(content, run, 0);
      for (const n of run.stage!.map.nodes) {
        const side = n.sides.find((s) => s.kind === 'event' && s.eventId === eventId);
        if (side) return { run, sideId: side.id, nodeId: n.id };
      }
    }
    return null;
  };
  for (const id of first4) {
    it(`${id} shows up on a map and every choice resolves`, () => {
      const found = findRun(id);
      expect(found, `${id} never appeared in 600 Galar runs`).not.toBeNull();
      const start = structuredClone(found!.run);
      start.stage!.current = found!.nodeId;
      const view = eventView(content, start, found!.sideId);
      expect(view.choices.length).toBeGreaterThan(0);
      let resolved = 0;
      for (const [c, choice] of view.choices.entries()) {
        if (choice.locked) continue; // needs an item, money or a Pokemon this run lacks
        const res = chooseEvent(content, structuredClone(start), found!.sideId, c);
        expect(res.text.length).toBeGreaterThan(0);
        resolved++;
      }
      expect(resolved).toBeGreaterThan(0);
    });
  }
});
