import { describe, expect, it } from 'vitest';
import { markBeaten, castMark, castTier, dossierFolders, meetTeamHeads, recordCast } from '../../src/core/expansion/cast/dossier';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import bossesFile from '../../src/data/bosses.json';
import { BOSS_CAST, beatBoss, beatClimax, fromRaidResult, CANON_MEETINGS, EVENT_MEETINGS, TRACK_MEETINGS, meetFromEvent, meetFromJoin, meetFromTrack } from '../../src/core/expansion/cast/meet';
import { expansionData } from '../../src/data/expansion';
import { EventEffectSchema } from '../../src/core/contentSchema';

const run = (): any => ({ encountersCompleted: 7, expansion: undefined });

const bosses: { id: string }[] = Array.isArray(bossesFile) ? bossesFile : (bossesFile as any).bosses;

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
  it('every meeting table names a real cast character', () => {
    const ids = new Set(expansionData.characters.map((c) => c.id));
    for (const [leader, id] of Object.entries(BOSS_CAST)) {
      expect(ids.has(id)).toBe(true);
      expect(bosses.some((b: { id: string }) => b.id === leader)).toBe(true);
    }
    for (const t of [EVENT_MEETINGS, CANON_MEETINGS, TRACK_MEETINGS])
      for (const list of Object.values(t)) for (const m of list) expect(ids.has(typeof m === 'string' ? m : m[0])).toBe(true);
  });
  it('fills from events, canon spaces, the Kanto track and joining Rocket, once each', () => {
    const r = run();
    meetFromEvent(r, { id: 'xe.kanto.appointment' });
    meetFromEvent(r, { id: 'x', canon: 'cs.kanto.fuchsia.safari' });
    meetFromEvent(r, { id: 'xe.kanto.appointment' });
    meetFromTrack(r, 'kanto', 3);
    meetFromTrack(r, 'johto', 5);
    meetFromJoin(r, 'rocket');
    meetFromJoin(r, 'aqua');
    expect(Object.keys(r.expansion.dossier).sort()).toEqual(['sc.rocket.matori', 'sc.rocket.player-agent', 'sc.rocket.rudd', 'sc.rocket.triad-koga', 'sc.rocket.triad-surge', 'sc.rocket.vesper']);
    expect(r.expansion.dossier['sc.rocket.matori'].metAt).toBe(7);
  });
  it('sets beaten from boss wins, won raids and the climax, and never undoes an ally or a turn', () => {
    const r = run();
    beatBoss(r, 'sabrina');
    beatBoss(r, 'nobody');
    expect(r.expansion.dossier['sc.rocket.triad-sabrina'].status).toBe('beaten');
    recordCast(r, 'sc.rocket.blaine');
    beatBoss(r, 'blaine');
    expect(r.expansion.dossier['sc.rocket.blaine'].status).toBe('ally');
    const q = run();
    fromRaidResult(q, 'rocket', 'failure', meetTeamHeads);
    expect(q.expansion.dossier['sc.rocket.matori'].status).toBe('at large');
    fromRaidResult(q, 'rocket', 'success', meetTeamHeads);
    expect(q.expansion.dossier['sc.rocket.matori'].status).toBe('beaten');
    expect(q.expansion.dossier['sc.rocket.madame-boss'].status).toBe('at large');
    const c = run();
    c.story = { evil: { teamId: 'rocket' } };
    beatClimax(c);
    expect(c.expansion.dossier['sc.rocket.triad-koga'].status).toBe('beaten');
    fromRaidResult(run(), 'rocket', 'declined', meetTeamHeads);
  });
});
