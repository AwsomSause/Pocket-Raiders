import { describe, expect, it } from 'vitest';
import { foldForCheck, freshMoveName, nameMove, officialNames, sanitizeMoveName, suggestNames, usedLine, type NameCheck } from '../../src/core/story2/moveName';
import blocklist from '../../src/data/story/nameBlocklist.json';
import { content } from './helpers';

const check: NameCheck = {
  blocklist,
  official: officialNames([...[...content.moves.values()].map((m) => m.name), ...[...content.species.values()].map((s) => s.name)]),
};
const ok = (s: string) => sanitizeMoveName(s, check);

describe('move-name sanitizer', () => {
  it('trims, collapses spaces and keeps good names', () => {
    expect(ok('  Never   Surrender ')).toEqual({ ok: true, display: 'Never Surrender' });
    expect(ok("Kai's Last-Stand")).toEqual({ ok: true, display: "Kai's Last-Stand" });
    expect(ok('Ｓｅｃｏｎｄ Wind 2')).toEqual({ ok: true, display: 'Second Wind 2' }); // full-width folds to ASCII
  });

  it('enforces 3 to 20 characters and the allowed characters; markup never gets through', () => {
    expect(ok('ab')).toMatchObject({ ok: false, problem: 'length' });
    expect(ok('a'.repeat(21))).toMatchObject({ ok: false, problem: 'length' });
    expect(ok('a'.repeat(20))).toMatchObject({ ok: true });
    expect(ok('<b>Bold</b>')).toMatchObject({ ok: false, problem: 'characters' });
    expect(ok('Move {pokemon}')).toMatchObject({ ok: false, problem: 'characters' });
    expect(ok('Fire!')).toMatchObject({ ok: false, problem: 'characters' });
    expect(ok('1234')).toMatchObject({ ok: false, problem: 'characters' });
    expect(ok('Zero​Width')).toMatchObject({ ok: false, problem: 'characters' });
    expect(ok('   ')).toMatchObject({ ok: false, problem: 'empty' });
  });

  it('blocks profanity through look-alikes, number swaps, accents and repeats, without blocking innocent words', () => {
    for (const bad of ['Fuck Punch', 'FUUUCK', 'Sh1t Storm', 'Ѕhіt Kick', 'f u c k', 'Shït Fist', 'Dumb Ass', 'Big 455']) expect(ok(bad), bad).toMatchObject({ ok: false, problem: 'blocked' });
    for (const good of ['Grass Pass', 'Peacock Dance', 'Grapevine', 'Classic Strike', 'Spicy Ember', 'Nightfall', 'Cockatoo Call']) expect(ok(good), good).toMatchObject({ ok: true });
    expect(foldForCheck('H3LL0')).toBe('hello');
  });

  it('rejects official move and Pokémon names in any spelling', () => {
    expect(ok('Thunderbolt')).toMatchObject({ ok: false, problem: 'official' });
    expect(ok('thunder-bolt')).toMatchObject({ ok: false, problem: 'official' });
    expect(ok('PIKACHU')).toMatchObject({ ok: false, problem: 'official' });
    expect(ok('Pikachu Punch')).toMatchObject({ ok: true });
  });
});

describe('naming a move', () => {
  it('keeps raw and display apart, allows one free rename a run, and keeps the old name on failure', () => {
    let rec = freshMoveName('Second Wind');
    let r = nameMove(rec, '  Never  Surrender', check);
    rec = r.rec;
    expect(rec).toEqual({ defaultName: 'Second Wind', raw: '  Never  Surrender', display: 'Never Surrender', renamed: false });
    r = nameMove(rec, 'Sh1t', check);
    expect(r.rec).toBe(rec);
    expect(r.message).toMatch(/kept its name/);
    r = nameMove(rec, 'Iron Promise', check);
    expect(r.rec).toMatchObject({ display: 'Iron Promise', renamed: true });
    expect(nameMove(r.rec, 'Third Try', check).message).toMatch(/already renamed/);
    expect(usedLine('Machop', r.rec)).toBe('Machop used Iron Promise!');
  });

  it('"keep default" on the first prompt does not spend the rename', () => {
    const r = nameMove(freshMoveName('Second Wind'), null, check);
    expect(r.rec).toMatchObject({ display: 'Second Wind', renamed: false });
  });

  it('suggests three names, the same every time', () => {
    const words = { tm_brave: ['Bold', 'Iron', 'Steady'], rockfall: ['Stone', 'Boulder'] };
    const a = suggestNames('Second Wind', 'tm_brave', ['rockfall'], words);
    expect(a).toEqual(['Bold Wind', 'Iron Wind', 'Steady Wind']);
    expect(suggestNames('Second Wind', 'tm_brave', ['rockfall'], words)).toEqual(a);
    for (const s of a) expect(ok(s)).toMatchObject({ ok: true });
  });
});
