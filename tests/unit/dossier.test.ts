import { describe, expect, it } from 'vitest';
import { castMark, castTier, dossierFolders, meetTeamHeads, recordCast } from '../../src/core/expansion/cast/dossier';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { EventEffectSchema } from '../../src/core/contentSchema';

const run = (): any => ({ encountersCompleted: 7, expansion: undefined });

describe('Dossier', () => {
  it('reads tier and mark from the data text', () => {
    expect(castTier('Executive (5)')).toBe(5);
    expect(castTier('Ally or Leader-designate (7)')).toBe(7);
    expect(castTier('Civilian')).toBe(0);
    expect(castMark('canon (anime)')).toBe('canon');
    expect(castMark('what-if (manga-inspired)')).toBe('what-if');
    expect(castMark('original')).toBe('original');
  });
  it('is empty until someone is met', () => {
    expect(dossierFolders(run())).toEqual([]);
  });
  it('meets once, keeps first meeting, and changes status only when told', () => {
    const r = run();
    expect(recordCast(r, 'sc.rocket.triad-sabrina')).toBe(true);
    expect(r.expansion.dossier['sc.rocket.triad-sabrina']).toEqual({ status: 'at large', metAt: 7 });
    r.encountersCompleted = 20;
    recordCast(r, 'sc.rocket.triad-sabrina');
    expect(r.expansion.dossier['sc.rocket.triad-sabrina'].metAt).toBe(7);
    recordCast(r, 'sc.rocket.triad-sabrina', 'turned');
    expect(r.expansion.dossier['sc.rocket.triad-sabrina'].status).toBe('turned');
  });
  it('ignores an unknown id and starts allies as allies', () => {
    const r = run();
    expect(recordCast(r, 'sc.nobody.nothing')).toBe(false);
    expect(r.expansion).toBeUndefined();
    recordCast(r, 'sc.rocket.blaine');
    expect(r.expansion.dossier['sc.rocket.blaine'].status).toBe('ally');
  });
  it('groups by team with a full 8-row pyramid and hides the ace until beaten', () => {
    const r = run();
    meetTeamHeads(r, 'rocket');
    const f = dossierFolders(r);
    expect(f.map((x) => x.team)).toEqual(['rocket']);
    expect(f[0]!.rows).toHaveLength(8);
    expect(f[0]!.rows[0]!.tier).toBe(7);
    const sab = f[0]!.entries.find((e) => e.id === 'sc.rocket.triad-sabrina')!;
    expect(sab.mark).toBe('what-if');
    expect(sab.noteTitle).toBe('WHAT-IF NOTE');
    expect(sab.ace).toBe('???');
    recordCast(r, sab.id, 'beaten');
    expect(dossierFolders(r)[0]!.entries.find((e) => e.id === sab.id)!.ace).not.toBe('???');
    expect(meetTeamHeads(r, 'rocket')).toEqual([]);
  });
  it('saves and loads: the run block and the event effect validate, bad status is rejected', () => {
    const r = run();
    recordCast(r, 'sc.rocket.matori');
    expect(ExpansionRunSchema.parse(r.expansion).dossier).toEqual(r.expansion.dossier);
    expect(ExpansionRunSchema.parse({}).dossier).toBeUndefined();
    expect(() => ExpansionRunSchema.parse({ dossier: { x: { status: 'dead', metAt: 0 } } })).toThrow();
    expect(EventEffectSchema.safeParse({ kind: 'cast', id: 'sc.rocket.matori', status: 'beaten' }).success).toBe(true);
    expect(EventEffectSchema.safeParse({ kind: 'cast', id: 'nope' }).success).toBe(false);
  });
});
