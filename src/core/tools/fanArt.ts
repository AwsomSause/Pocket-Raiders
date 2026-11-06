// Fan Art Frame (idea S216): up to three of the player's own images, shrunk to small JPEG posters and kept on this
// device only (never in a save, never sent anywhere). This file holds the rules for what may be kept; the browser
// code in `ui/files.ts` does the shrinking. Pure.

export const FRAME_SLOTS = 3;
/** A poster's data URL may not be longer than this many characters (about 110 KB of image). */
export const MAX_POSTER_CHARS = 150_000;
export const MAX_POSTER_EDGE = 256;

export interface Poster { title: string; dataUrl: string }

const JPEG = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/;

export const posterProblem = (dataUrl: string): string | null =>
  !JPEG.test(dataUrl) ? 'That is not a usable image.' : dataUrl.length > MAX_POSTER_CHARS ? 'That image is too big, even after shrinking.' : null;

export function parsePosters(raw: string | null): Poster[] {
  try {
    const v: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(v)) return [];
    return v.filter((p): p is Poster => !!p && typeof p.title === 'string' && typeof p.dataUrl === 'string' && posterProblem(p.dataUrl) === null).slice(0, FRAME_SLOTS).map((p) => ({ title: p.title.slice(0, 30), dataUrl: p.dataUrl }));
  } catch {
    return [];
  }
}

/** Adds a poster when there is a free slot. */
export function addPoster(posters: readonly Poster[], title: string, dataUrl: string): Poster[] | { problem: string } {
  if (posters.length >= FRAME_SLOTS) return { problem: `The frame holds ${FRAME_SLOTS} posters. Remove one first.` };
  const problem = posterProblem(dataUrl);
  if (problem) return { problem };
  return [...posters, { title: title.replace(/[<>]/g, '').trim().slice(0, 30) || 'Untitled', dataUrl }];
}

export const removePoster = (posters: readonly Poster[], index: number): Poster[] => posters.filter((_, i) => i !== index);

/** The size to shrink an image to: its longest side becomes at most MAX_POSTER_EDGE, never enlarged. */
export function fitSize(w: number, h: number): { w: number; h: number } {
  const scale = Math.min(1, MAX_POSTER_EDGE / Math.max(1, w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}
