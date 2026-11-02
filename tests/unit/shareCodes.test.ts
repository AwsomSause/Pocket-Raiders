import { describe, expect, it } from 'vitest';
import { cardGhost, decodeChallengeCard, decodeTeamCode, encodeChallengeCard, encodeTeamCode } from '../../src/core/shareCodes';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { encodeSeedCode } from '../../src/core/seedCode';
import { ghostLines } from '../../src/core/ghost';

const parts = { seed: 'abc.1', archetypeId: 'youngster', rules: STANDARD_CHOICE };
const score = { from: 'Mia', title: 'Youngster run', victory: false, badges: 3, encounters: 41 };

describe('share codes', () => {
  it('round-trips a team and drops unknown species', () => {
    const code = encodeTeamCode([{ speciesId: 'pikachu', level: 12, shiny: true }, { speciesId: 'nope', level: 5, shiny: false }]);
    const r = decodeTeamCode(code, (id) => id === 'pikachu');
    expect(r).toMatchObject({ ok: true, team: [{ speciesId: 'pikachu', level: 12, shiny: true }] });
    expect(r.ok && r.note).toContain('1 Pokémon');
  });
  it('rejects damaged or empty team codes', () => {
    expect(decodeTeamCode('TM1.@@', () => true).ok).toBe(false);
    expect(decodeTeamCode('XX1.a', () => true).ok).toBe(false);
    expect(decodeTeamCode(encodeTeamCode([{ speciesId: 'x', level: 1, shiny: false }]), () => false).ok).toBe(false);
  });
  it('round-trips a challenge card, seed with a dot included', () => {
    const r = decodeChallengeCard(encodeChallengeCard(parts, score));
    expect(r).toMatchObject({ ok: true, parts, score });
  });
  it('rejects damaged cards and plain seed codes', () => {
    expect(decodeChallengeCard('CC1.x.y').ok).toBe(false);
    expect(decodeChallengeCard(encodeSeedCode(parts)).ok).toBe(false);
    expect(decodeChallengeCard('CC1.' + encodeURIComponent(encodeSeedCode(parts)).replace(/\./g, '%2E') + '.!!').ok).toBe(false);
  });
  it('a card becomes a ghost that compares at the end', () => {
    const lines = ghostLines(cardGhost(score), { victory: false, badges: 4, encounters: 50 }, (i) => i);
    expect(lines.join('\n')).toContain('You got further');
    expect(lines.join('\n')).not.toContain('Their team');
  });
});
