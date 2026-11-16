// Catalog Overhaul row A (legends, batch 5): Legendary keys, Mythical keys, Communion upgrades and the researcher's reactions.
import { describe, expect, it } from 'vitest';
import { visibleChoices } from '../../src/core/eventMemory';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { LEGEND_KEYS, keyFlag, noteSpirits, SPIRITS_FLAG, syncLegendKeys } from '../../src/core/legends/keys';
import { syncLegendFlags } from '../../src/core/legends/signs';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import type { BattleState, RunState } from '../../src/core/state';
import rowA from '../../src/data/events/co-legends-13.json';
import status from '../../src/data/catalogOverhaul/status/legends.json';
import { content } from './helpers';

const IDS = ['auroraticket-island', 'azure-flute-hall', 'dark-stone-zekrom', 'eon-ticket-island', 'flute-maker', 'liberty-pass-garden', 'light-stone-reshiram',
  'magma-stone-heatran', 'mysticticket-rock', 'oaks-letter-birds', 'old-collector', 'old-sea-map-island', 'rainbow-wing-tower', 'ruins-dig', 'secret-key-volcano',
  'silver-wing-islands', 'works-key-plant', 'kyurem-black', 'kyurem-white', 'landorus-mirror', 'meteorite-deoxys', 'odd-keystone-spiritomb', 'thundurus-mirror',
  'tornadus-mirror', 'researcher-recognizes-legendary', 'researcher-recognizes-mythical'];

const fresh = (seed = 'keys'): RunState => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'k', seed, archetypeId: 'red' }), 0));
  run.expansion = { ...run.expansion, promises: true };
  syncLegendFlags(run);
  return run;
};
const set = (run: RunState, key: string, v = 1) => { run.story.flags[`ev:${key}`] = v; };
const f = (run: RunState, key: string) => Number(run.story.flags[`ev:${key}`] ?? 0);
const holds = (run: RunState, id: string) => (run.inventory[id] ?? 0) + (run.passives?.[id] ?? 0);
const placeOk = (run: RunState, id: string) => content.events.get(id)!.requires.every((c) => conditionMet(content, run, c));
const at = (run: RunState, eventId: string): RunState => {
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'x', kind: 'event', used: false, eventId } as never);
  return run;
};

describe('row A: Legendary keys and Communion upgrades', () => {
  it('all 26 ids are rebuilt here and marked built; every key is gift-only and opens exactly its place', () => {
    const built = (status as { built: Record<string, string> }).built;
    for (const id of IDS) {
      expect(rowA.events.some((e) => e.id === id), id).toBe(true);
      expect(built[id], id).toBeTruthy();
      expect(content.events.get(id)?.disabled, id).toBe(false);
    }
    for (const k of LEGEND_KEYS) {
      expect(content.catalog.get(k.item)?.giftOnly, k.item).toBe(true);
      const place = content.events.get(k.place)!;
      expect(place.keyItem, k.place).toBe(k.item);
      expect(place.requires.some((c) => c.kind === 'flag' && c.key === keyFlag(k.item)), k.place).toBe(true);
    }
  });

  it('a Trial earns its key once; a key that was bought opens nothing', () => {
    const run = fresh();
    expect(syncLegendKeys(content, run)).toEqual([]);
    run.passives = { ...run.passives, 'oaks-letter': 1 };
    expect(placeOk(run, 'oaks-letter-birds')).toBe(false);
    delete run.passives['oaks-letter'];
    set(run, 'birds-passed');
    syncLegendKeys(content, run);
    expect(f(run, keyFlag('oaks-letter'))).toBe(1);
    expect(holds(run, 'oaks-letter')).toBe(1);
    expect(placeOk(run, 'oaks-letter-birds')).toBe(true);
    // Used up at its place: never given again this run.
    delete run.passives!['oaks-letter'];
    delete run.inventory['oaks-letter'];
    expect(syncLegendKeys(content, run)).toEqual([]);
    expect(holds(run, 'oaks-letter')).toBe(0);
  });

  it('a wing already in the bag is not doubled, and its place waits for the Trial', () => {
    const run = fresh();
    run.passives = { ...run.passives, 'rainbow-wing': 1 };
    expect(placeOk(run, 'rainbow-wing-tower')).toBe(false);
    set(run, 'hooh-ended');
    syncLegendKeys(content, run);
    expect(holds(run, 'rainbow-wing')).toBe(1);
    expect(placeOk(run, 'rainbow-wing-tower')).toBe(true);
  });

  it('three Tellings send the Mythical key; it opens a Visit door to the Promise', () => {
    const run = fresh();
    set(run, 'believed-mew');
    syncLegendKeys(content, run);
    expect(holds(run, 'old-sea-map')).toBe(1);
    expect(placeOk(run, 'old-sea-map-island')).toBe(true);
    const out = chooseEvent(content, at(run, 'old-sea-map-island'), 'x', 1);
    expect(out.run.pending.some((p) => JSON.stringify(p).includes('co-my-mew-promise')) || JSON.stringify(out.run.stage).includes('co-my-mew-promise')).toBe(true);
    // Another Mythical has already visited: no key.
    const late = fresh('late');
    set(late, 'believed-victini');
    late.expansion!.promise = { tellings: { victini: 3 }, visited: 'mew', guest: null, kept: [], left: [] };
    syncLegendKeys(content, late);
    expect(holds(late, 'liberty-pass')).toBe(0);
  });

  it('the Meteorite comes once per region while Deoxys is the Guest, and each Forme lasts the region', () => {
    const run = fresh();
    run.expansion!.promise = { tellings: { deoxys: 3 }, visited: 'deoxys', guest: { id: 'deoxys', forgiven: false }, kept: [], left: [] };
    syncLegendKeys(content, run);
    expect(holds(run, 'meteorite')).toBe(1);
    const out = chooseEvent(content, at(run, 'meteorite-deoxys'), 'x', 1);
    expect(holds(out.run, 'meteorite')).toBe(0);
    expect(JSON.stringify(out.run)).toContain('The Meteorite: Defense Forme');
    expect(syncLegendKeys(content, out.run)).toEqual([]);
    out.run.regionIndex += 1;
    syncLegendKeys(content, out.run);
    expect(holds(out.run, 'meteorite')).toBe(1);
  });

  it('the Reveal Glass needs the Forces blessing in Communion; Kyurem fuses after the Tao Trial', () => {
    const run = fresh();
    run.party.push(createPokemon(content, 'tornadus', 30, 'tor'), createPokemon(content, 'kyurem', 30, 'ky'), createPokemon(content, 'zekrom', 30, 'ze'));
    syncLegendKeys(content, run);
    expect(holds(run, 'tornadus-therian') + holds(run, 'kyurem-black')).toBe(0);
    set(run, 'blessing-forces');
    set(run, 'blessing-communion');
    set(run, 'tao-done');
    syncLegendKeys(content, run);
    expect(holds(run, 'tornadus-therian')).toBe(1);
    expect(holds(run, 'kyurem-black')).toBe(1);
    expect(holds(run, 'thundurus-therian')).toBe(0);
    const fused = chooseEvent(content, at(run, 'kyurem-black'), 'x', 0).run;
    expect(fused.party.find((m) => m.uid === 'ky')!.speciesId).toBe('kyurem-black');
  });

  it('Ghost-type foes knocked out in a won battle are the Odd Keystone\'s spirits; it opens at 108', () => {
    const run = fresh();
    const ghost = { ...createPokemon(content, 'gastly', 10, 'g1'), hp: 0 };
    const other = { ...createPokemon(content, 'rattata', 10, 'r1'), hp: 0 };
    noteSpirits(content, run, { outcome: 'lose', enemyTeam: [ghost] } as unknown as BattleState);
    expect(f(run, SPIRITS_FLAG)).toBe(0);
    noteSpirits(content, run, { outcome: 'win', enemyTeam: [ghost, other] } as unknown as BattleState);
    expect(f(run, SPIRITS_FLAG)).toBe(1);
    syncLegendKeys(content, run);
    expect(holds(run, 'odd-keystone')).toBe(1);
    expect(placeOk(run, 'odd-keystone-spiritomb')).toBe(false);
    set(run, SPIRITS_FLAG, 108);
    expect(placeOk(run, 'odd-keystone-spiritomb')).toBe(true);
  });

  it('a Legendary already with you changes its place; the researchers react to a Legendary and to a Guest', () => {
    const run = fresh();
    set(run, keyFlag('silver-wing'));
    expect(visibleChoices(content, run, content.events.get('silver-wing-islands')!).map((c) => c.choice.label)).toContain('Step forward.');
    run.party.push(createPokemon(content, 'lugia', 40, 'lu'));
    const labels = visibleChoices(content, run, content.events.get('silver-wing-islands')!).map((c) => c.choice.label);
    expect(labels).not.toContain('Step forward.');
    expect(labels).toContain('Let Lugia go on alone.');
    expect(placeOk(run, 'researcher-recognizes-legendary')).toBe(true);
    expect(placeOk(run, 'researcher-recognizes-mythical')).toBe(false);
    run.expansion!.promise = { tellings: {}, visited: 'mew', guest: { id: 'mew', forgiven: false }, kept: [], left: [] };
    syncLegendFlags(run);
    expect(placeOk(run, 'researcher-recognizes-mythical')).toBe(true);
  });
});
