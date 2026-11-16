import { afterEach, describe, expect, it } from 'vitest';
import { REDUX_SKINS } from '../../src/core/presentation/redux';
import { pixelFont, setLookFont, setTextPrefs, textStyle } from '../../src/ui/theme';

// New look: screens still drawn on the canvas write in the skin's font (ui/redux/canvasFont.ts sets it while they are up).
describe('canvas text in the skin font', () => {
  afterEach(() => { setLookFont(null); setTextPrefs(1, null); });

  it('uses the game fonts until a screen asks for the skin font, and again after', () => {
    expect(pixelFont(34)).toEqual({ family: expect.stringMatching(/^"PokemonBold"/), size: 24, grid: 3 });
    expect(pixelFont(14).family).toMatch(/^"PokemonMain"/);
    setLookFont({ family: 'Pixelify Sans', weight: 400, scale: 1 });
    expect(pixelFont(34)).toEqual({ family: expect.stringMatching(/^"Pixelify Sans", "PokemonMain"/), size: 31, grid: 1 });
    setLookFont(null);
    expect(pixelFont(34).family).toMatch(/^"PokemonBold"/);
  });

  it('keeps small print readable and follows the skin\'s own size and weight', () => {
    setLookFont({ family: 'Jersey 15', weight: 400, scale: 21 / 18 });
    expect(pixelFont(10).size).toBeGreaterThanOrEqual(13);
    expect(pixelFont(20).size).toBe(21);
    expect(textStyle(20).fontStyle).toBeUndefined();
    setLookFont({ family: 'Rajdhani', weight: 700, scale: 1 });
    expect(textStyle(20).fontStyle).toBe('700');
    // A style that asks for its own (italic) keeps it.
    expect(textStyle(20, '#fff', { fontStyle: 'italic' }).fontStyle).toBe('italic');
  });

  it('the reading font (dyslexia setting) still wins', () => {
    setTextPrefs(1, '"OpenDyslexic", sans-serif');
    setLookFont({ family: 'Pixelify Sans', weight: 700, scale: 1 });
    expect(pixelFont(20).family).toBe('"OpenDyslexic", sans-serif');
    expect(textStyle(20).fontStyle).toBeUndefined();
  });

  it('every skin names a font', () => {
    for (const s of REDUX_SKINS) expect(s.font.length, s.id).toBeGreaterThan(0);
  });
});
