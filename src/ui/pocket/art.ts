// Art for the Pocket look. The mock-ups (plans/ui-redesign) draw every Pokémon, trainer and ball as a plain <img>
// of its first frame, cut down to the drawing; their rules size and place those <img> tags. So the game does the
// same: a sprite is cut out of its sheet once, kept as a small picture in memory, and drawn as an <img>.
// A picture that is not ready yet draws as nothing; every open view redraws when it arrives.
// Presentation only: nothing here touches game state or a random stream.

import { rxArrived, rxImage, rxUrl } from '../redux/assets';

/** A picture under assets/images. `atlas`: `file` has no extension and a .json beside its .png. */
export interface PkArt {
  file: string;
  atlas?: boolean;
  /** Keep the file whole (items, badges, backdrops). Otherwise it is cut down to its first frame's drawing. */
  whole?: boolean;
  /** One cell of a plain sheet: x, y, w, h. */
  crop?: readonly [number, number, number, number];
  /** One named frame of an atlas (the Hub Town props), instead of its first. */
  frame?: string;
}
export interface PkCut { url: string; w: number; h: number }

const cuts = new Map<string, PkCut | null>();
const pending = new Set<string>();

interface RawFrame { filename: string; frame: { x: number; y: number; w: number; h: number } }

function load(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(url));
    im.src = url;
  });
}

/** The first frame of a sheet (the mock-ups' own rule: an atlas's first frame by name; a strip's first square cell). */
async function firstFrame(a: PkArt): Promise<{ im: HTMLImageElement; box: readonly [number, number, number, number] }> {
  if (a.atlas) {
    const [json, im] = await Promise.all([fetch(rxUrl(a.file + '.json')).then((r) => (r.ok ? r.json() : Promise.reject(new Error(a.file)))), load(rxUrl(a.file + '.png'))]);
    const d = json as { textures?: { frames: RawFrame[] }[]; frames?: RawFrame[] | Record<string, Omit<RawFrame, 'filename'>> };
    const list: RawFrame[] = d.textures ? d.textures[0]!.frames : Array.isArray(d.frames) ? d.frames : Object.entries(d.frames ?? {}).map(([filename, v]) => ({ filename, ...v }));
    const f = a.frame ? list.find((x) => x.filename === a.frame) : [...list].sort((x, y) => x.filename.localeCompare(y.filename))[0];
    if (!f) throw new Error(a.file);
    return { im, box: [f.frame.x, f.frame.y, f.frame.w, f.frame.h] };
  }
  const im = await load(rxUrl(a.file));
  const w = im.naturalWidth, h = im.naturalHeight;
  return { im, box: a.crop ?? (w > h * 1.5 ? [0, 0, h, h] : [0, 0, w, h]) };
}

async function cutOut(a: PkArt): Promise<PkCut> {
  const { im, box } = await firstFrame(a);
  const [bx, by, bw, bh] = box;
  const c = document.createElement('canvas');
  c.width = bw; c.height = bh;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(im, bx, by, bw, bh, 0, 0, bw, bh);
  // Cut down to what is not see-through (a cropped cell is kept as it is, like the mock-ups' type icons).
  let x0 = 0, y0 = 0, x1 = bw - 1, y1 = bh - 1;
  if (!a.crop) {
    const d = g.getImageData(0, 0, bw, bh).data;
    x0 = bw; y0 = bh; x1 = -1; y1 = -1;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) if (d[(y * bw + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { x0 = 0; y0 = 0; x1 = bw - 1; y1 = bh - 1; }
  }
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  out.getContext('2d')!.drawImage(c, x0, y0, w, h, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error(a.file);
  return { url: URL.createObjectURL(blob), w, h };
}

const keyOf = (a: PkArt): string => `${a.file}|${a.atlas ? 'a' : ''}|${a.crop?.join(',') ?? ''}|${a.frame ?? ''}`;

/** A picture cut down to its drawing. Undefined until it is ready (and for good when its file is missing). */
export function pkCut(a: PkArt): PkCut | undefined {
  const key = keyOf(a);
  const hit = cuts.get(key);
  if (hit !== undefined) return hit ?? undefined;
  if (pending.has(key) || typeof Image === 'undefined' || typeof document === 'undefined') return undefined;
  pending.add(key);
  cutOut(a).then((c) => cuts.set(key, c), () => cuts.set(key, null)).finally(() => { pending.delete(key); rxArrived(); });
  return undefined;
}

/** The picture's file was looked for and is not there. */
export const pkGone = (a: PkArt): boolean => !a.whole && cuts.get(keyOf(a)) === null;

/** The URL and size to draw a picture with: the whole file, or its cut-out. Undefined until measured. */
export function pkPic(a: PkArt | null | undefined): PkCut | undefined {
  if (!a) return undefined;
  if (a.whole) { const d = rxImage(a.file); return d ? { url: rxUrl(a.file), w: d[0], h: d[1] } : undefined; }
  return pkCut(a);
}

// ---- The game's files behind the mock-ups' picture names ----
export const monArt = (file: string): PkArt => ({ file, atlas: true });
/** A Pokémon's front sprite by its art id (`6`, `6-mega-x`). */
export const frontArt = (id: string | number): PkArt => ({ file: `pokemon/${id}`, atlas: true });
export const backArt = (id: string | number): PkArt => ({ file: `pokemon/back/${id}`, atlas: true });
export const itemArt = (id: string): PkArt => ({ file: `items/${id}.png`, whole: true });
export const ballArt = (id = 'pb'): PkArt => ({ file: `pokeball/${id}.png` });
export const badgeArt = (type: string): PkArt => ({ file: `packs/story/badge/${type.toLowerCase()}.png`, whole: true });
const TERA_TYPES = ['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'];
/** The crystal type icon (the mock-ups' `ty-<type>`). */
export const typeArt = (type: string): PkArt => ({ file: 'packs/dbk/tera/types.png', crop: [0, Math.max(0, TERA_TYPES.indexOf(type.toLowerCase())) * 32, 32, 32] });
/** A Hub Town building or prop by its frame name (the mock-ups' `tw-<name>`). */
export const propArt = (name: string): PkArt => ({ file: 'overworld/hubtown_props', atlas: true, frame: name });
/** A walking sheet of the Hub Town (four rows of four 64 px steps): a Pokémon follower by its sheet name. */
export const followerUrl = (name: string): string => rxUrl(`overworld/followers/${name}.png`);
/** A walking sheet of a town person (`NPC_B2W2_Lass`). */
export const walkerUrl = (name: string): string => rxUrl(`overworld/trainers/${name}.png`);

/** Pictures the mock-ups' rules name (`url(sprites/<key>.png)`), as CSS variables on the Pocket layer. */
const CSS_FILES: Record<string, string> = {
  'a-grass-bg': 'arenas/grass_bg.png', 'a-plains-bg': 'arenas/plains_bg.png', ball256: 'packs/ebdx/transitions/ball.png',
  'fx-burst': 'packs/dbk/burst.png', 'fx-max': 'packs/raid/max/bg.png', 'fx-spiral': 'packs/raid/max/spiral.png', 'fx-tera': 'packs/raid/tera/bg.png',
  'map-region1': 'packs/memories/townmap/region1.png', 'town-ground': 'ui/pocket/town-ground.png', 'town-street': 'ui/pocket/town-street.png',
  'z-inferno': 'packs/dbk/zpower/titles/inferno-overdrive.png',
};
const CSS_CUTS: Record<string, PkArt> = { 'b-pb': ballArt('pb'), 't-red': { file: 'trainer/red', atlas: true } };

const cssSet = new Map<string, string>();
/** Sets the picture variables on the layer; the cut-out ones are filled in when they are ready (call again on every redraw). */
export function pkCssArt(host: HTMLElement): void {
  const put = (k: string, url: string): void => {
    if (cssSet.get(k) === url) return;
    cssSet.set(k, url);
    host.style.setProperty(`--pk-u-${k}`, `url(${url})`);
  };
  // A relative url() inside a variable is read against the stylesheet that uses it (in the built game, assets/): make it whole.
  for (const [k, f] of Object.entries(CSS_FILES)) put(k, new URL(rxUrl(f), document.baseURI).href);
  for (const [k, a] of Object.entries(CSS_CUTS)) { const c = pkCut(a); if (c) put(k, c.url); }
}
