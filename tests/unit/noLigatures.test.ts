import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { turnOffCanvasLigatures } from '../../src/ui/noLigatures';
import { GAME_UPDATE_ID, UPDATE_LOG } from '../../src/core/tutorial';

// The New look's font joined "fi" into one glyph ("Finished" read "Anished"). Both the HTML pages and canvas text turn ligatures off.
describe('no "fi" ligatures', () => {
  it('the New UI stage turns font ligatures off', () => {
    const css = readFileSync('src/ui/redux/redux.css', 'utf8');
    const stage = /\.rx \.stage\{position:absolute[^}]*\}/.exec(css)?.[0] ?? '';
    expect(stage).toContain('font-variant-ligatures:none');
    expect(stage).toContain('"liga" 0');
  });

  it('canvas text draws and measures with optimizeSpeed (no ligatures), and the patch applies once', () => {
    const calls: string[] = [];
    class Ctx { declare textRendering: string; fillText() { calls.push(`fill:${this.textRendering}`); } strokeText() { calls.push(`stroke:${this.textRendering}`); } measureText() { calls.push(`measure:${this.textRendering}`); return { width: 1 }; } }
    const g = globalThis as unknown as { CanvasRenderingContext2D?: unknown };
    const before = g.CanvasRenderingContext2D;
    (Ctx.prototype as { textRendering: string }).textRendering = 'auto';
    g.CanvasRenderingContext2D = Ctx;
    try {
      turnOffCanvasLigatures();
      turnOffCanvasLigatures();
      const c = new Ctx();
      c.fillText(); c.strokeText(); c.measureText();
      expect(calls).toEqual(['fill:optimizeSpeed', 'stroke:optimizeSpeed', 'measure:optimizeSpeed']);
    } finally {
      g.CanvasRenderingContext2D = before;
    }
  });

  it('does nothing where there is no canvas (Node tools)', () => {
    expect(() => turnOffCanvasLigatures()).not.toThrow();
  });

  it("What's New shows the current update, not Beta 0.4", () => {
    expect(GAME_UPDATE_ID).not.toBe('beta-0.4');
    expect(UPDATE_LOG[0]!.title).not.toContain('0.4');
  });
});
