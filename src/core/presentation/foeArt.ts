// Who to draw for an event's Trainer when the event names nobody to draw (about a quarter of event battles: "Sailor Dobbs-Leary",
// "Floor 3 Trainer", "Rocket Grunt", "Meowth"). Presentation only: read from the Trainer's name, never from gameplay RNG, and the same
// name always gets the same picture. Returns a picture asset id, or a species to draw with its own front sprite.

export interface FoeArtContent {
  trainers: { values(): Iterable<{ id: string; name: string; spriteAssetId: string }>; get(id: string): { spriteAssetId: string } | undefined };
  bosses: { values(): Iterable<{ name: string; sprites: { default: string } }> };
  species: { values(): Iterable<{ id: string; name: string }> };
}

export type FoeArt = { assetId: string } | { speciesId: string };

/** Everyday Trainer classes a nameless foe is dealt from, by the letters of its name. */
export const FOE_ART_POOL = ['ace-trainer-m', 'ace-trainer-f', 'youngster', 'lass', 'backpacker', 'veteran', 'ranger', 'hiker'] as const;

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const EVIL = /\b(grunts?|executives?|admins?|lieutenant|rocket|operatives?)\b/;

/**
 * @param name the Trainer's name as the battle shows it
 * @param gruntSprite the run's Evil Team grunt picture, if a team is about (else a Rocket Grunt stands in)
 */
export function fallbackFoeArt(content: FoeArtContent, name: string, gruntSprite?: string | null): FoeArt | null {
  const n = norm(name);
  if (!n) return null;
  for (const b of content.bosses.values()) if (norm(b.name) === n) return { assetId: b.sprites.default };
  for (const s of content.species.values()) if (norm(s.name) === n) return { speciesId: s.id };
  // The longest class name found in the Trainer's name as whole words ("Bug Catcher Wade", "Gambler Rich").
  let best: { len: number; assetId: string } | null = null;
  const padded = ` ${n} `;
  for (const t of content.trainers.values()) {
    const c = norm(t.name);
    if (c.length > (best?.len ?? 0) && padded.includes(` ${c} `)) best = { len: c.length, assetId: t.spriteAssetId };
  }
  if (best) return { assetId: best.assetId };
  if (EVIL.test(n)) {
    const grunt = gruntSprite ?? content.trainers.get('rocket-grunt-m')?.spriteAssetId;
    if (grunt) return { assetId: grunt };
  }
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  for (let k = 0; k < FOE_ART_POOL.length; k++) {
    const pick = content.trainers.get(FOE_ART_POOL[(h + k) % FOE_ART_POOL.length]!);
    if (pick) return { assetId: pick.spriteAssetId };
  }
  return null;
}
