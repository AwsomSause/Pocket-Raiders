// Shadow II keys, scars and Named Shadows (slice E6). A key is the thing a Named Shadow's binding could not account for;
// meeting it sets the Shadow free for good (purification is never undone). Pure rules, no RNG.

import type { Content } from '../contentSchema';
import { changeFriendship } from '../friendship';
import type { PokemonInstance, RunState } from '../state';
import { keyOf, shadow2Data, type ShadowKey } from './data';

export const MAX_SCARS = 2;
const flagOf = (run: Pick<RunState, 'story'>, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);

/** Gives a heart scar. A third one is refused unless `replace` names one to swap out; returns what happened. */
export function addScar(mon: Pick<PokemonInstance, 'scars'>, id: string, replace?: string): 'added' | 'have' | 'full' | 'replaced' {
  const scars = mon.scars ?? [];
  if (scars.includes(id)) return 'have';
  if (scars.length < MAX_SCARS) {
    mon.scars = [...scars, id];
    return 'added';
  }
  if (replace && scars.includes(replace)) {
    mon.scars = scars.map((s) => (s === replace ? id : s));
    return 'replaced';
  }
  return 'full';
}
export const hasScar = (mon: Pick<PokemonInstance, 'scars'>, id: string): boolean => Boolean(mon.scars?.includes(id));
export const scarName = (id: string): string => shadow2Data.scars.find((s) => s.id === id)?.name ?? id;

/** The key of a Named Shadow that is still waiting for it (a Common Shadow, or one with a gone key, has none). */
export function activeKey(mon: Pick<PokemonInstance, 'shadow'>): ShadowKey | undefined {
  const s = mon.shadow;
  return s?.named && !s.keyGone ? keyOf(s.named) : undefined;
}

/** Ordinary soothing is half strength while a Named Shadow's key exists, except for the keys that ARE ordinary methods. */
export function sootheKeyScale(mon: Pick<PokemonInstance, 'shadow'>): number {
  const k = activeKey(mon);
  if (!k || k.when.kind === 'any' || k.when.kind === 'heartBond') return 1;
  return shadow2Data.keyHalfStrength;
}

/** The hints the player may read now (the first on arrival, the second after a won battle together, the third on the summary screen). */
export function visibleHints(mon: Pick<PokemonInstance, 'shadow'>): string[] {
  const k = activeKey(mon);
  if (!k) return [];
  return k.hints.slice(0, Math.max(1, mon.shadow!.hints ?? 1));
}
/** The summary screen shows all three hints. */
export function summaryHints(mon: Pick<PokemonInstance, 'shadow'>): string[] {
  return activeKey(mon)?.hints.slice() ?? [];
}

/** A battle won with this Shadow Pokémon in it earns the next hint (up to the second; the third is on the summary). */
export function revealHintAfterBattle(mon: PokemonInstance): void {
  if (mon.shadow?.named && (mon.shadow.hints ?? 1) < 2) mon.shadow = { ...mon.shadow, hints: 2 };
}

/** Frees a Pokémon for good: the Shadow is gone, the original Pokémon returns, it keeps a scar. Returns the scar result. */
export function purifyByKey(content: Content, mon: PokemonInstance, scarId: string): string {
  delete mon.shadow;
  changeFriendship(content, mon, 20, 1);
  const r = addScar(mon, scarId);
  return r === 'added' ? ` It keeps a heart scar: ${scarName(scarId)}.` : r === 'full' ? ' Its heart already holds two scars, so it keeps none new.' : '';
}

/** A key that was never possible in this run: the Shadow becomes Common ("What it was waiting for is gone."). */
export function markKeyGone(run: Pick<RunState, 'party' | 'box'>, flag: string): string[] {
  const names: string[] = [];
  for (const mon of [...run.party, ...run.box]) {
    const k = activeKey(mon);
    if (k && keyFlagOf(k) === flag) {
      mon.shadow = { ...mon.shadow!, keyGone: true };
      names.push(mon.uid);
    }
  }
  return names;
}
const keyFlagOf = (k: ShadowKey): string | undefined => (k.when.kind === 'flag' ? k.when.flag : k.when.kind === 'leadWinOutdoors' ? k.when.needs : undefined);

/** Looks at every Shadow in the party and box: a key set by a story flag frees it. Returns "Name: line" notes. */
export function checkFlagKeys(content: Content, run: Pick<RunState, 'party' | 'box' | 'story'>): string[] {
  const notes: string[] = [];
  for (const mon of [...run.party, ...run.box]) {
    const k = activeKey(mon);
    if (!k || k.when.kind !== 'flag' || flagOf(run, k.when.flag) < 1) continue;
    notes.push(`${content.species.get(mon.speciesId)?.name ?? mon.speciesId}: the key is met. The haze lifts for good!${purifyByKey(content, mon, k.scar)}`);
  }
  return notes;
}

/** After a won battle: a Shadow that led and won outdoors, whose precondition is met, is freed. `leadUid` is the Pokémon that led. */
export function checkLeadWinKey(content: Content, run: Pick<RunState, 'party' | 'story'>, leadUid: string | undefined, outdoors: boolean): string[] {
  const mon = run.party.find((m) => m.uid === leadUid);
  const k = mon && activeKey(mon);
  if (!mon || !k || k.when.kind !== 'leadWinOutdoors' || !outdoors || (k.when.needs && flagOf(run, k.when.needs) < 1)) return [];
  return [`${content.species.get(mon.speciesId)?.name ?? mon.speciesId}: it sees the sky and remembers it. The haze lifts for good!${purifyByKey(content, mon, k.scar)}`];
}

