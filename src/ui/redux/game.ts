// What the New UI screens read from the running game, in the shape the mock-up templates take.
// Read-only: nothing here changes run state or uses a random stream.

import type Phaser from 'phaser';
import { pokemonAssetIds, type AssetManifest } from '../../assets/catalog';
import { displayName } from '../../core/care';
import { lookSpecies, maxHp } from '../../core/pokemon';
import { services } from '../../game/services';
import { rxFileOf } from './assets';
import { esc, hpb, mini, W } from './kit';
import type { Art } from './templates';
import type { PartyCard } from './screens/party';
import { summaryInfo } from '../summaryLook';

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

/** The run's party as the Party page's cards (the run end's final team; no pick, nothing dimmed but the fainted). */
export function partyCards(scene: Phaser.Scene): PartyCard[] {
  const { content, run } = services().session;
  if (!run) return [];
  return run.party.map((m, i) => {
    const info = summaryInfo(content, run, m);
    const held = info.held.length ? `${info.held[0]!.name}${info.held.length > 1 ? ` +${info.held.length - 1}` : ''}` : '';
    return { name: info.name, file: monFile(scene, lookSpecies(content, m).id, 'front', !!m.shiny), level: m.level, hp: m.hp, maxHp: maxHp(content, m), held, tag: i === 0 ? 'LEAD' : m.hp <= 0 ? 'FNT' : '', types: info.types, ability: info.ability?.name ?? '-', nature: info.nature?.split(' (')[0] ?? '-', moves: info.moves.map((x) => ({ name: x.name, type: x.type })), off: false };
  });
}

/** A rival's picture: a named character's own sprite when the game has one, otherwise their Trainer class. */
export function rivalArt(scene: Phaser.Scene, rival: { classId: string; name: string } | undefined | null): Art | null {
  if (!rival) return null;
  const content = services().session.content;
  const character = rival.classId === 'rival' ? content.bosses.get(rival.name.toLowerCase()) : undefined;
  return artOf(scene, character ? character.sprites.default : content.trainers.get(rival.classId)?.spriteAssetId);
}
