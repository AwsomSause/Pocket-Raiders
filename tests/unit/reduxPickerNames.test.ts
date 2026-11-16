import { describe, expect, it } from 'vitest';
import { areaOf, pickerBand, pickerKind } from '../../src/ui/redux/pickerNames';

// The New UI reads a list's title to name its header band, pick its mock-up template and its band colour.

describe('New UI list header band', () => {
  it('splits "Name · extra · extra" into the name and chips', () => {
    expect(pickerBand('Bank  ·  120 credits  ·  3 candies')).toEqual({ name: 'Bank', chips: ['120 credits', '3 candies'] });
    expect(pickerBand('Mentors')).toEqual({ name: 'Mentors', chips: [] });
  });
  it('a count written into the name becomes a chip', () => {
    expect(pickerBand('Lore Archive 3 / 24 known')).toEqual({ name: 'Lore Archive', chips: ['3 / 24 known'] });
    expect(pickerBand('Story Archive 5 scenes')).toEqual({ name: 'Story Archive', chips: ['5 scenes'] });
    expect(pickerBand('Remembrance Archive 0 / 83')).toEqual({ name: 'Remembrance Archive', chips: ['0 / 83'] });
    expect(pickerBand('Moment Codex (2/20)')).toEqual({ name: 'Moment Codex', chips: ['2/20'] });
  });
  it('the Cast list is the Character Database', () => {
    expect(pickerBand('Cast 3 met / 34  Complete 1')).toEqual({ name: 'Character Database', chips: ['3 met / 34', 'Complete 1'] });
    expect(pickerBand('Cast: meet someone first')).toEqual({ name: 'Character Database', chips: ['meet someone first'] });
  });
  it('a name that only starts like one of those is left alone', () => {
    expect(pickerBand('Castelia District')).toEqual({ name: 'Castelia District', chips: [] });
    expect(pickerBand('Lore Archive')).toEqual({ name: 'Lore Archive', chips: [] });
  });
});

describe('New UI list template by name', () => {
  it('uses the mock-up catalogue\'s template for each room', () => {
    expect(pickerKind('Character Database')).toBe('grid');
    expect(pickerKind('Moment Codex')).toBe('grid');
    expect(pickerKind('Lore Archive')).toBe('board');
    expect(pickerKind('Mentors')).toBe('menu');
    expect(pickerKind('Bag')).toBe('bag');
    expect(pickerKind('Something else')).toBe('menu');
  });
});

describe('New UI list band colour', () => {
  it('story archives and the Moment Codex are purple', () => {
    for (const t of ['Lore Archive', 'Story Archive', 'Remembrance Archive', 'Character Database', 'Character Profile', 'Moment Codex', 'Memories: Run Journal']) expect(areaOf(t)).toBe('story');
  });
  it('finished runs are gold, run tools teal, shops orange, Pokémon pages green', () => {
    expect(areaOf('Legacy Gallery')).toBe('end');
    expect(areaOf('Hall of Fame')).toBe('end');
    for (const t of ['Seed board', 'Seed leaderboard', 'Speedrun timer', 'Tournament bracket']) expect(areaOf(t)).toBe('run');
    expect(areaOf('Exchange Counter')).toBe('shop');
    // The map's menus: the Album and the Story Journal are story pages, Camp is a run menu.
    for (const t of ['Album', 'Story Journal']) expect(areaOf(t)).toBe('story');
    expect(areaOf('Camp')).toBe('run');
    expect(pickerKind('Album')).toBe('grid');
    expect(pickerKind('Story Journal')).toBe('board');
    expect(pickerKind('Camp')).toBe('menu');
    // The camp's own Photo Album keeps the hub's band: only the map's Album is a story page.
    expect(areaOf('Photo Album')).toBe('hub');
    // Rivals and People are story boards, the PC is a party wall, the Field Notebook a run menu.
    for (const t of ['Rivals', 'People']) { expect(areaOf(t)).toBe('story'); expect(pickerKind(t)).toBe('board'); }
    expect(areaOf('PC')).toBe('party');
    expect(pickerKind('PC')).toBe('grid');
    expect(areaOf('Field Notebook')).toBe('run');
    expect(pickerKind('Field Notebook')).toBe('menu');
    // A raid den's and a Totem's pages wear the battle's band.
    for (const t of ['Raid - Tier 1: Sleeping Giant', 'Totem - Totem Marowak', 'Before you go in: Sleeping Giant']) expect(areaOf(t)).toBe('battle');
    expect(areaOf('Strange Merchant')).toBe('shop');
    expect(areaOf('Bag')).toBe('shop');
    expect(areaOf('Pokédex')).toBe('party');
    expect(areaOf('Memories: Battle Replays')).toBe('battle');
  });
  it('the Bank and the other hub rooms are hub blue', () => {
    for (const t of ['Bank', 'Mentors', 'Tales & News', 'Trainer Archive', 'My stats', 'Mod packs', 'Content status', 'Berry Bestiary']) expect(areaOf(t)).toBe('hub');
  });
});
