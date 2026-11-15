// Art for the New UI: the game's own files under public/assets, measured once and then drawn by CSS.
// A sprite that is not measured yet draws as nothing and asks for its file; every open view redraws when it arrives.
// Presentation only. Nothing here touches game state or a random stream.

export interface RxAtlas {
  /** Sheet size. */
  w: number; h: number;
  /** Untrimmed frame size, so feet and centre never drift between frames. */
  sw: number; sh: number;
  /** Frames in play order: x, y, w, h, trim x, trim y. */
  f: [number, number, number, number, number, number][];
}

const atlases = new Map<string, RxAtlas | null>();
const images = new Map<string, [number, number] | null>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
let queued = false;

/** URL of a file under public/assets/images (document-relative, like the game's own loader). */
export const rxUrl = (file: string): string => `assets/images/${file}`;

export function onRxAssets(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function arrived(): void {
  if (queued) return;
  queued = true;
  // One redraw for a burst of files.
  setTimeout(() => {
    queued = false;
    listeners.forEach((fn) => fn());
  }, 30);
}

interface RawFrame { filename: string; frame: { x: number; y: number; w: number; h: number }; sourceSize?: { w: number; h: number }; spriteSourceSize?: { x: number; y: number } }

function size(url: string): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve([im.naturalWidth, im.naturalHeight]);
    im.onerror = () => reject(new Error(url));
    im.src = url;
  });
}

/** An animated atlas (`pokemon/6`, `trainer/red`: no extension). Undefined until it has loaded. */
export function rxAtlas(file: string): RxAtlas | undefined {
  const hit = atlases.get(file);
  if (hit !== undefined) return hit ?? undefined;
  if (pending.has(file)) return undefined;
  pending.add(file);
  void (async () => {
    try {
      const [json, dim] = await Promise.all([fetch(rxUrl(file + '.json')).then((r) => (r.ok ? r.json() : Promise.reject(new Error(file)))), size(rxUrl(file + '.png'))]);
      const d = json as { textures?: { frames: RawFrame[] }[]; frames?: RawFrame[] | Record<string, Omit<RawFrame, 'filename'>> };
      const list: RawFrame[] = d.textures ? d.textures[0]!.frames : Array.isArray(d.frames) ? d.frames : Object.entries(d.frames ?? {}).map(([filename, v]) => ({ filename, ...v }));
      list.sort((a, b) => a.filename.localeCompare(b.filename));
      const first = list[0];
      if (!first) throw new Error(file);
      const s = first.sourceSize ?? { w: first.frame.w, h: first.frame.h };
      atlases.set(file, { w: dim[0], h: dim[1], sw: s.w, sh: s.h, f: list.map((q) => [q.frame.x, q.frame.y, q.frame.w, q.frame.h, q.spriteSourceSize?.x ?? 0, q.spriteSourceSize?.y ?? 0]) });
    } catch {
      atlases.set(file, null);
    }
    pending.delete(file);
    arrived();
  })();
  return undefined;
}

/** A plain picture's size (`items/potion.png`). Undefined until it has loaded. */
export function rxImage(file: string): [number, number] | undefined {
  const hit = images.get(file);
  if (hit !== undefined) return hit ?? undefined;
  if (pending.has(file)) return undefined;
  pending.add(file);
  size(rxUrl(file)).then((d) => images.set(file, d), () => images.set(file, null)).finally(() => {
    pending.delete(file);
    arrived();
  });
  return undefined;
}
