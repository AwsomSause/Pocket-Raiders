import { describe, expect, it } from 'vitest';
import { WX_CHIP, WX_GRADE, WX_KINDS, wxChipText } from '../../src/core/presentation/motionWeather';
import { WEATHERS } from '../../src/core/contentSchema';

// Animation redesign pass 8 (Rain, Harsh Sunlight, Sandstorm, Snow, Weather Clears): the numbers the mockups use.
describe('weather look', () => {
  it('draws rain, sun, sand and snow; hail keeps the older layer', () => {
    expect([...WX_KINDS]).toEqual(['rain', 'sun', 'sand', 'snow']);
    for (const k of WX_KINDS) expect(WEATHERS).toContain(k);
    expect((WX_KINDS as readonly string[]).includes('hail')).toBe(false);
  });
  it('grades the arena as the mockups do', () => {
    expect(WX_GRADE.rain).toEqual({ br: 0.68, sat: 0.85, hue: 12 });
    expect(WX_GRADE.sun).toEqual({ br: 1.2, sat: 1.3, hue: -6 });
    expect(WX_GRADE.sand).toEqual({ br: 0.9, sat: 0.55, hue: -14 });
    expect(WX_GRADE.snow).toEqual({ br: 1.05, sat: 0.55, hue: 14 });
  });
  it('the chip counts the turns left; one turn is singular; lasting weather has no count', () => {
    expect(wxChipText('rain', 5)).toBe('☂ RAIN · 5 turns');
    expect(wxChipText('sand', 1)).toBe('≋ SANDSTORM · 1 turn');
    expect(wxChipText('sun', 0)).toBe('☀ SUN · 0 turns');
    expect(wxChipText('snow', null)).toBe('❄ SNOW');
    expect(wxChipText('rain', 999)).toBe('☂ RAIN');
    expect(WX_CHIP.sand.fill).toBe('#e2c98a');
  });
});
