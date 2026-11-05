import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { createProfile } from '../../src/core/profile';
import { acceptOffer, cancelOffer, logPhoto, postOffer, readOffer, redeemReply, showcaseOf, toggleShowcase, weekId, weekTheme } from '../../src/core/social';
import { legacyOf } from '../../src/core/legacy';
import { ProfileSchema, type PastPokemon, type Profile } from '../../src/core/state';

const mon = (speciesId: string): PastPokemon => ({ speciesId, level: 20, shiny: false, abilitySlot: 0, moves: ['tackle'], runId: 'r1', hallOfFame: false });
const make = (id: string, mons: string[]): Profile => ({ ...createProfile(content, id), pastPokemon: mons.map(mon) });

describe('achievements showcase', () => {
  it('only earned ones, at most 3, toggling off frees a slot', () => {
    let p = createProfile(content, 'a');
    expect('problem' in toggleShowcase(p, 'first-steps')).toBe(true);
    p = { ...p, achievements: { a: { earnedAt: 'x' }, b: { earnedAt: 'x' }, c: { earnedAt: 'x' }, d: { earnedAt: 'x' } } };
    for (const id of ['a', 'b', 'c']) p = (toggleShowcase(p, id) as { profile: Profile }).profile;
    expect(showcaseOf(p)).toEqual(['a', 'b', 'c']);
    expect('problem' in toggleShowcase(p, 'd')).toBe(true);
    p = (toggleShowcase(p, 'b') as { profile: Profile }).profile;
    expect(showcaseOf(p)).toEqual(['a', 'c']);
  });
});

describe('photo contest', () => {
  it('week ids and themes are stable, and one entry per week', () => {
    expect(weekId('2026-11-05')).toBe('2026-W45');
    expect(weekId('2026-11-02')).toBe(weekId('2026-11-08'));
    expect(weekId('2026-11-09')).not.toBe(weekId('2026-11-08'));
    expect(weekTheme('2026-11-03')).toBe(weekTheme('2026-11-07'));
    let p = createProfile(content, 'a');
    p = logPhoto(p, '2026-11-03', 'first', 3);
    p = logPhoto(p, '2026-11-05', 'second', 9);
    expect(legacyOf(p).photos).toHaveLength(1);
    expect(legacyOf(p).photos[0]).toMatchObject({ note: 'second', stars: 5 });
  });
});

describe('trade board', () => {
  it('a full swap: post, accept, redeem, each code once', () => {
    const a = make('a', ['pikachu', 'eevee']);
    const b = make('b', ['rattata', 'pidgey']);
    const posted = postOffer(a, 0, 'rattata', 'Ann', 't1');
    if (!posted.ok) throw new Error(posted.reason);
    expect(posted.profile.pastPokemon.map((m) => m.speciesId)).toEqual(['eevee']);
    expect(legacyOf(posted.profile).tradeBoard).toHaveLength(1);
    expect(acceptOffer(b, posted.code, 1, 't2').ok).toBe(false); // wrong species
    expect(acceptOffer(b, posted.code, null, 't2').ok).toBe(false);
    const taken = acceptOffer(b, posted.code, 0, 't2');
    if (!taken.ok) throw new Error(taken.reason);
    expect(taken.profile.pastPokemon.map((m) => m.speciesId)).toEqual(['pikachu', 'pidgey']);
    expect(acceptOffer(taken.profile, posted.code, 1, 't3').ok).toBe(false); // already taken
    const back = redeemReply(posted.profile, taken.reply, 't4');
    if (!back.ok) throw new Error(back.reason);
    expect(back.profile.pastPokemon.map((m) => m.speciesId)).toEqual(['rattata', 'eevee']);
    expect(legacyOf(back.profile).tradeBoard).toHaveLength(0);
    expect(redeemReply(back.profile, taken.reply, 't5').ok).toBe(false);
    expect(ProfileSchema.safeParse(back.profile).success).toBe(true);
  });
  it('a gift needs nothing back; cancelling returns it; own offers cannot be taken', () => {
    const a = make('a', ['pikachu']);
    const posted = postOffer(a, 0, null, 'Ann', 't1');
    if (!posted.ok) throw new Error(posted.reason);
    expect(acceptOffer(posted.profile, posted.code, null, 't2').ok).toBe(false);
    const gift = acceptOffer(make('b', []), posted.code, null, 't2');
    expect(gift.ok && gift.profile.pastPokemon[0]?.speciesId).toBe('pikachu');
    const id = legacyOf(posted.profile).tradeBoard[0]!.id;
    const cancelled = cancelOffer(posted.profile, id);
    expect(cancelled.ok && cancelled.profile.pastPokemon).toHaveLength(1);
  });
  it('rejects junk codes and a full board', () => {
    expect(readOffer('nope').ok).toBe(false);
    expect(readOffer('TB1.@@').ok).toBe(false);
    expect(redeemReply(make('a', []), 'TR1.@@', 't').ok).toBe(false);
    let p = make('a', Array.from({ length: 11 }, () => 'pikachu'));
    for (let i = 0; i < 10; i++) { const r = postOffer(p, 0, null, 'A', `t${i}`); if (!r.ok) throw new Error(r.reason); p = r.profile; }
    expect(postOffer(p, 0, null, 'A', 'tx').ok).toBe(false);
  });
});

describe('older profiles', () => {
  it('load without social fields and get empty ones', () => {
    const p = createProfile(content, 'a');
    const parsed = ProfileSchema.parse({ ...p, legacy: { prestige: 0, tree: [], contacts: [], museum: [], regionIntel: {}, seedShelf: [], boards: {}, ghosts: {} } });
    expect(legacyOf(parsed)).toMatchObject({ showcase: [], photos: [], tradeBoard: [] });
  });
});
