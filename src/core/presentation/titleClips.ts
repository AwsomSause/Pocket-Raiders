// Title backdrop clips: which files, how long each stays, and the play order. Presentation only (ui/titleClips.ts draws).

export const TITLE_CLIPS: readonly string[] = [1, 2, 3, 4, 5, 6].map((n) => `assets/video/title/title-${n}.mp4`);
/** How long one clip stays up, and how long the fade to the next takes (ms). */
export const CLIP_HOLD = 9000;
export const CLIP_FADE = 1500;

/** The order the clips play in from a starting clip: each once, then around again. */
export const clipAt = (start: number, step: number, count = TITLE_CLIPS.length): number => (((start + step) % count) + count) % count;
