// What the New UI screens read from the running game, in the shape the mock-up templates take.
// Read-only: nothing here changes run state or uses a random stream.

import type Phaser from 'phaser';
import { pokemonAssetIds, type AssetManifest } from '../../assets/catalog';
import { displayName } from '../../core/care';
import { maxHp } from '../../core/pokemon';
import { services } from '../../game/services';
import { rxFileOf } from './assets';
import { esc, hpb, mini, W } from './kit';
import type { Art } from './templates';

const manifestOf = (scene: Phaser.Scene): AssetManifest | undefined => scene.cache.json.get('manifest') as AssetManifest | undefined;

/** Any catalogued picture or atlas (an item icon, a trainer, a backdrop) as the templates' `Art`. */
export const artOf = (scene: Phaser.Scene, assetId: string | undefined | null): Art | null => (assetId ? rxFileOf(manifestOf(scene), assetId) : null);

/** A species' animated sprite file (no extension), or null when the pack has none. */
export function monFile(scene: Phaser.Scene, speciesId: string, side: 'front' | 'back' | 'icon' = 'front', shiny = false): string | null {
  const sp = services().session.content.species.get(speciesId);
  if (!sp) return null;
  const ids = pokemonAssetIds(sp.assets);
  const m = manifestOf(scene);
  const want = side === 'icon' ? ids.icon : side === 'front' ? (shiny ? ids.shinyFront : ids.front) : shiny ? ids.shinyBack : ids.back;
  return (rxFileOf(m, want) ?? (shiny ? rxFileOf(m, side === 'front' ? ids.front : ids.back) : null))?.file ?? null;
}

export interface PartyChip { name: string; file: string | null; hp: number; level: number; fainted: boolean }

/** The run's party, for the strips and rows the mock-ups draw. */
export function partyChips(scene: Phaser.Scene): PartyChip[] {
  const { content, run } = services().session;
  return (run?.party ?? []).map((m) => ({ name: displayName(content, m), file: monFile(scene, m.speciesId, 'front', !!m.shiny), hp: Math.round((m.hp / Math.max(1, maxHp(content, m))) * 100), level: m.level, fainted: m.hp <= 0 }));
}

/** The mock-ups' party strip: six windows in a row with a sprite, the name, an HP bar and an optional note. */
export const partyStrip = (party: readonly PartyChip[], st = '', notes?: readonly string[]): string =>
  `<div class="abs row" style="gap:8px;${st}">${party.map((p, k) => W(`${p.file ? mini(p.file, 40) : ''}<div class="col grow" style="gap:4px;min-width:0"><span style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</span>${hpb(p.hp)}${notes ? `<span style="font-size:11px" class="${notes[k] ? 'acc' : ''}">${esc(notes[k] || '—')}</span>` : ''}</div>`, `flex:1;max-width:${party.length < 4 ? 220 : 400}px;display:flex;align-items:center;gap:6px;padding:5px 8px;min-width:0`)).join('')}</div>`;
