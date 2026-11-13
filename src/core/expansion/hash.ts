// FNV-1a string hash for the expansion's pure rules. A local copy of core/story/moments.ts `fnv1a` so these files can be
// imported from state.ts without a cycle. Same values.
export function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}
