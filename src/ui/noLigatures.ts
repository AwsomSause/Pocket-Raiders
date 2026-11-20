// The New look's font (Pixelify Sans) joins "fi" into one glyph, so "Finished" read as "Anished" and "final" as "anal".
// HTML pages turn ligatures off in redux.css; canvas text has no CSS, so every 2D context draws and measures with
// textRendering "optimizeSpeed", which skips ligatures (pixel fonts need no kerning either). Presentation only.

export function turnOffCanvasLigatures(): void {
  const proto = typeof CanvasRenderingContext2D === 'undefined' ? null : CanvasRenderingContext2D.prototype;
  if (!proto || !('textRendering' in proto) || (proto as unknown as { __noLig?: boolean }).__noLig) return;
  (proto as unknown as { __noLig?: boolean }).__noLig = true;
  for (const name of ['fillText', 'strokeText', 'measureText'] as const) {
    const original = proto[name] as (...args: unknown[]) => unknown;
    (proto as unknown as Record<string, unknown>)[name] = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
      if (this.textRendering !== 'optimizeSpeed') this.textRendering = 'optimizeSpeed';
      return original.apply(this, args);
    };
  }
}
