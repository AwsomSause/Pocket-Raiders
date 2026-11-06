// Hub Town's day and night and its sounds (spec §9). The light follows the player's local clock
// (core/hubTown/daylight.ts): a colour laid over the town, and after dark the street lamps glow. The sound is
// synthesised (ui/audio.ts): a wind bed with birds in the morning, crickets in the evening and hoots at night, plus a
// fountain that gets louder as you walk up to it. Presentation only; motion and sound settings are respected.

import Phaser from 'phaser';
import { overworldAssetIds } from '../../assets/catalog';
import type { Period } from '../../core/clock';
import { HUB_LIGHT } from '../../core/hubTown/daylight';
import { HUB_TOWN } from '../../core/hubTown/schema';
import { startAmbient, startFountain } from '../audio';
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import type { HubTownView } from './townView';

const T = HUB_TOWN.tile;
/** The fountain's tile (the middle of the plaza fountain) and how far its sound carries (tiles). */
const FOUNTAIN = { x: 32, y: 19 };
const HEARD = 12;

/** Lays the time of day over the town and lights the lamps after dark. Returns how many lamps glow. */
export function drawDaylight(town: HubTownView, scene: Phaser.Scene, period: Period, motion: 'full' | 'reduced' | 'off'): number {
  const light = HUB_LIGHT[period];
  if (light.alpha > 0) {
    // On the screen layer under every page and label: the world camera draws first, so this tints only the town.
    scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, light.tint, 1).setOrigin(0).setAlpha(light.alpha).setDepth(-50).setName('hubtown-daylight');
  }
  if (!light.lamps) return 0;
  let lit = 0;
  town.world(() => {
    for (const [name, px, py, depth] of town.map.props) {
      if (!name.startsWith('lamp')) continue;
      const frame = scene.textures.getFrame(overworldAssetIds.props, name);
      const w = frame?.width ?? T;
      const x = px + w / 2;
      const y = py + 10;
      const pool = scene.add.ellipse(x, depth - 4, 4 * T, 1.4 * T, 0xffd890, 0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(9);
      const halo = scene.add.circle(x, y, 24, 0xffe8a0, 0.65).setBlendMode(Phaser.BlendModes.ADD).setDepth(10 + depth + 1);
      if (motion === 'full') scene.tweens.add({ targets: [halo, pool], alpha: '-=0.12', duration: 1300 + lit * 110, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      lit++;
    }
  });
  return lit;
}

/** Starts the town's sounds; the fountain follows how close you stand. */
export function startTownSound(town: HubTownView, scene: Phaser.Scene, period: Period, at: { x: number; y: number } = FOUNTAIN): void {
  startAmbient(scene, period);
  const fountain = startFountain(scene);
  if (!fountain) return;
  const update = (): void => {
    const t = town.tile();
    fountain(1 - Math.hypot(t.x - at.x, t.y - at.y) / HEARD);
  };
  update();
  scene.events.on(Phaser.Scenes.Events.UPDATE, update);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, update));
}
