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

/** Tells every open view that a picture has been measured (also used by the Pocket look's own cut pictures, ui/pocket/art.ts). */
export function rxArrived(): void { arrived(); }

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

const trims = new Map<string, [number, number, number, number] | null>();
/** Where a plain picture's drawing sits inside its file: x, y, width, height of everything that is not see-through. Undefined until it has loaded and been measured. */
export function rxTrim(file: string): [number, number, number, number] | undefined {
  const hit = trims.get(file);
  if (hit !== undefined) return hit ?? undefined;
  const key = 'trim:' + file;
  if (pending.has(key) || typeof Image === 'undefined') return undefined;
  pending.add(key);
  const im = new Image();
  const done = (box: [number, number, number, number] | null): void => { trims.set(file, box); pending.delete(key); arrived(); };
  im.onerror = () => done(null);
  im.onload = () => {
    try {
      const w = im.naturalWidth, h = im.naturalHeight, c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true })!;
      g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, w, h).data;
      let x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      done(x1 < 0 ? [0, 0, w, h] : [x0, y0, x1 - x0 + 1, y1 - y0 + 1]);
    } catch {
      done(null);
    }
  };
  im.src = rxUrl(file);
  return undefined;
}

let byId: Map<string, { file: string; atlas: boolean }> | null = null;
/** The file behind one of the game's asset ids (a Phaser texture key), read from the asset manifest. Null when it is not a picture. */
export function rxFileOf(manifest: { assets: { id: string; kind: string; path: string }[] } | null | undefined, assetId: string): { file: string; atlas: boolean } | null {
  if (!byId) {
    if (!manifest) return null;
    byId = new Map();
    for (const a of manifest.assets) if ((a.kind === 'atlas' || a.kind === 'image') && a.path.startsWith('images/')) byId.set(a.id, { file: a.kind === 'atlas' ? a.path.slice(7).replace(/\.png$/, '') : a.path.slice(7), atlas: a.kind === 'atlas' });
  }
  return byId.get(assetId) ?? null;
}
