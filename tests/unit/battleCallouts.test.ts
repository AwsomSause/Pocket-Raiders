import { describe, expect, it } from 'vitest';
import { WIRED_LINES } from '../../src/core/expansion/variantLines';
import { variantRule } from '../../src/core/expansion/variantInfo';
import { TRAIT_IDS } from '../../src/core/expansion/traits';
import { foresightRule, keepsCallout, rallyLine, shadowLines, traitLine, type CalloutEvent } from '../../src/ui/redux/battleCallouts';

const brace: CalloutEvent = { type: 'spectacle', kind: 'rally', side: 'enemy', text: 'Persian steels itself to stop the winning streak!' };
const up = (stat: string, change = 1, side = 'enemy'): CalloutEvent => ({ type: 'stat', side, stat, change });

describe('Rally line', () => {
  it('names the stats the brace raised, joined the way a sentence would', () => {
    expect(rallyLine([brace, up('def'), up('spd')], 0)).toBe('RALLY · the foe braces: Def and Sp. Def +1');
    expect(rallyLine([brace, up('def'), up('spd'), up('spe')], 0)).toBe('RALLY · the foe braces: Def, Sp. Def and Speed +1');
    expect(rallyLine([brace, up('def', 2)], 0)).toBe('RALLY · the foe braces: Def +2');
  });
  it('says each amount when they differ', () => {
    expect(rallyLine([brace, up('def', 2), up('spd', 1)], 0)).toBe('RALLY · the foe braces: Def +2 and Sp. Def +1');
  });
  it('a brace that raised nothing (already at the ceiling) still shows', () => {
    expect(rallyLine([brace], 0)).toBe('RALLY · the foe braces');
    expect(rallyLine([brace, { type: 'move', side: 'player' }, up('def')], 0)).toBe('RALLY · the foe braces');
  });
  it('stops at the first line that is not one of its rises', () => {
    expect(rallyLine([brace, up('def'), up('atk', -1), up('spd')], 0)).toBe('RALLY · the foe braces: Def +1');
    expect(rallyLine([brace, up('def'), up('spd', 1, 'player')], 0)).toBe('RALLY · the foe braces: Def +1');
  });
  it('is not the player\'s own Momentum lines, the other enemy rally lines, or any other event', () => {
    expect(rallyLine([{ ...brace, side: 'player', text: 'Momentum surges! Lucario unleashes a Surge Strike!' }], 0)).toBeNull();
    expect(rallyLine([{ ...brace, text: 'Persian refuses to leave the fight!' }], 0)).toBeNull();
    expect(rallyLine([up('def')], 0)).toBeNull();
    expect(rallyLine([brace], 3)).toBeNull();
  });
  it('a stat line keeps the callout before it; other lines do not', () => {
    expect(keepsCallout(up('def'))).toBe(true);
    expect(keepsCallout({ type: 'move' })).toBe(false);
  });
});

describe('Signature trait line', () => {
  it('reads the trait and its sentence from the line the engine says', () => {
    expect(traitLine('Seat at the Table: the foe\'s boosts are swept away.')).toEqual({ name: 'Seat at the Table', text: 'The foe\'s boosts are swept away.' });
    expect(traitLine('Translator: "Thunderbolt!" is coming.')).toEqual({ name: 'Translator', text: '"Thunderbolt!" is coming.' });
  });
  it('every trait id is recognised by its spoken name', () => {
    for (const id of TRAIT_IDS) expect(traitLine(`${id.replace(/-/g, ' ')}: it happens.`)?.text).toBe('It happens.');
  });
  it('other lines with a colon are not traits', () => {
    expect(traitLine('Foresight Tax: Sabrina sees your move before she chooses (ember).')).toBeNull();
    expect(traitLine('Joey: "Crush them!"')).toBeNull();
    expect(traitLine('No colon here.')).toBeNull();
    expect(traitLine('')).toBeNull();
  });
});

describe('Shadow line and Foresight rule', () => {
  it('splits the preview into the tier line and the plan', () => {
    expect(shadowLines('Shadow · Fallen (tier 4) · Sealed 100/100\nThe shadow tightens: it will use Shadow Rush.')).toEqual({ head: 'Shadow · Fallen (tier 4) · Sealed 100/100', plan: 'The shadow tightens: it will use Shadow Rush.' });
    expect(shadowLines('Shadow · Veiled (tier 1) · Opening 20/100')).toEqual({ head: 'Shadow · Veiled (tier 1) · Opening 20/100', plan: '' });
    expect(shadowLines(null)).toBeNull();
    expect(shadowLines('')).toBeNull();
  });
  it('the Foresight Tax banner names the trainer, and is off when the rule is', () => {
    expect(foresightRule(true, 'Sabrina')).toEqual({ name: 'Foresight Tax', text: 'Sabrina sees the first move you choose this turn.' });
    expect(foresightRule(true, null)?.text).toBe('Sabrina sees the first move you choose this turn.');
    expect(foresightRule(false, 'Sabrina')).toBeNull();
  });
});

describe('Variant rule for the Info panel', () => {
  it('every wired line has a name and one sentence, without the team in brackets or the announced line', () => {
    for (const line of WIRED_LINES) {
      const r = variantRule(line);
      expect(r, line).not.toBeNull();
      expect(r!.name.length).toBeGreaterThan(2);
      expect(r!.text).toMatch(/^[A-Z].*\.$/s);
      expect(r!.text).not.toContain('(announced');
      expect(r!.text.startsWith('(')).toBe(false);
    }
  });
  it('Tagged reads as the script says', () => {
    expect(variantRule('tagged')).toEqual({ name: 'Tagged', text: 'A Black-Label Pokémon cannot be forced to switch out, and the first hit it takes in each battle does 20% less damage.' });
  });
  it('an unknown line has no rule', () => {
    expect(variantRule('')).toBeNull();
    expect(variantRule('nope')).toBeNull();
  });
});
