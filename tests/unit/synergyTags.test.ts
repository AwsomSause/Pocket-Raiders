import { describe, expect, it } from 'vitest';
import { ALL_TAGS, teamTags } from '../../src/core/synergyTags';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';

const party = (ids: string[]) => ({ party: ids.map((id, i) => createPokemon(content, id, 10, `t${i}`)) });

describe('Team Synergy Tags (S65)', () => {
  it('a mixed team has no tag', () => {
    expect(teamTags(content, party(['pidgey', 'rattata', 'caterpie']))).toEqual([]);
  });
  it('three fire/grass Pokémon with a Fire among them make a Sun Team', () => {
    expect(teamTags(content, party(['charmander', 'bulbasaur', 'oddish'])).map((t) => t.id)).toContain('sun');
    expect(teamTags(content, party(['bulbasaur', 'oddish', 'bellsprout'])).map((t) => t.id)).not.toContain('sun');
  });
  it('rain, sand, snow and trick-room teams are found', () => {
    expect(teamTags(content, party(['squirtle', 'pikachu', 'psyduck'])).map((t) => t.id)).toContain('rain');
    expect(teamTags(content, party(['geodude', 'onix', 'sandshrew'])).map((t) => t.id)).toContain('sand');
    expect(teamTags(content, party(['jynx', 'lapras'])).map((t) => t.id)).toContain('snow');
    expect(teamTags(content, party(['slowpoke', 'shuckle', 'snorlax'])).map((t) => t.id)).toContain('trickRoom');
  });
  it('every tag names a story trigger that has a moment definition', () => {
    for (const tag of ALL_TAGS) expect(content.story.definitions.some((d) => d.triggerConditions.trigger === tag.trigger)).toBe(true);
  });
});
