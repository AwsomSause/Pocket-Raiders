import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { expansionData } from '../../src/data/expansion';
import { EVENT_MEETINGS, TRACK_MEETINGS_BY_REGION, meetFromEvent, meetFromTrack } from '../../src/core/expansion/cast/meet';
import { JOHTO_UNOVA_EVENT_MEETINGS, JOHTO_UNOVA_TRACK_MEETINGS } from '../../src/core/expansion/cast/meetJohtoUnova';
import { CAST_SPRITES } from '../../src/core/expansion/cast/sprites';

const ids = new Set(expansionData.characters.map((c) => c.id));
const run = (): any => ({ encountersCompleted: 3, expansion: undefined });

describe('Johto and Unova cast meetings', () => {
  it('only names cast ids, and the tables are wired in', () => {
    for (const list of Object.values(JOHTO_UNOVA_EVENT_MEETINGS)) for (const id of list) expect(ids.has(id)).toBe(true);
    for (const tab of Object.values(JOHTO_UNOVA_TRACK_MEETINGS)) for (const list of Object.values(tab)) for (const id of list) expect(ids.has(id)).toBe(true);
    for (const e of Object.keys(JOHTO_UNOVA_EVENT_MEETINGS)) expect(EVENT_MEETINGS[e]).toBeDefined();
    expect(TRACK_MEETINGS_BY_REGION.johto).toBeDefined();
  });
  it('puts every Johto Commander in the Dossier by track step 5', () => {
    const r = run();
    meetFromTrack(r, 'johto', 5);
    for (const n of ['attila', 'hun', 'sebastian', 'tyson', 'marauder']) expect(r.expansion.dossier[`sc.rocket-return.${n}`]).toBeDefined();
  });
  it('puts the Plasma Sages in the Dossier by track step 4', () => {
    const r = run();
    meetFromTrack(r, 'unova', 4);
    for (const n of ['gorm', 'bronius', 'ryoku']) expect(r.expansion.dossier[`sc.plasma.${n}`]).toBeDefined();
  });
  it('an event meeting records its person', () => {
    const r = run();
    meetFromEvent(r, { id: 'xe.johto.dragon-tamer' });
    expect(r.expansion.dossier['sc.rocket-return.lance']).toBeDefined();
  });
  it('the three Sages share one sprite, and the art file exists', () => {
    expect(new Set(['gorm', 'bronius', 'ryoku'].map((n) => CAST_SPRITES[`sc.plasma.${n}`]![0])).size).toBe(1);
    expect(existsSync('public/assets/images/bosses/cast-sage.png')).toBe(true);
  });
  it('sprite table only names cast ids', () => {
    for (const id of Object.keys(CAST_SPRITES)) expect(ids.has(id)).toBe(true);
  });
  it('every cast-art file the table names is in the repo', () => {
    for (const list of Object.values(CAST_SPRITES)) for (const id of list) if (id.startsWith('boss.cast-')) expect(existsSync(`public/assets/images/bosses/${id.slice(5)}.png`)).toBe(true);
    expect(existsSync('public/assets/images/bosses/cast-butch.png')).toBe(true);
  });
});
