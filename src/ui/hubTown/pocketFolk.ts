// Pocket Town's townsfolk (Appendix S.5): 8 to 12 people who stroll inside their district. Face one and press Z: they
// say a line that reacts to your last run (core/hubTown/chatter.ts). Presentation only: where they walk is a hash of
// who they are and the step count, never gameplay RNG, and nothing here changes the profile.

import Phaser from 'phaser';
import { overworldAssetIds } from '../../assets/catalog';
import type { Content } from '../../core/contentSchema';
import { pocketChatterFor } from '../../core/hubTown/chatter';
import { OVERWORLD, type Facing } from '../../core/hubTown/schema';
import { STEP } from '../../core/hubTown/world';
import type { Profile } from '../../core/state';
import { ensureWalkAnims, type HubTownView } from './townView';

const DIRS: Facing[] = ['up', 'down', 'left', 'right'];
const FRAME_ROW: Record<Facing, number> = { down: 0, left: 1, right: 2, up: 3 };
const ZONES = ['training', 'culture', 'home', 'play', 'plaza'];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface Folk {
  id: string;
  name: string;
  sheet: string;
  zone: string;
}

const NAMES = ['Ava', 'Bo', 'Cleo', 'Dax', 'Eli', 'Fern', 'Gus', 'Hana', 'Ivo', 'Juno', 'Kai', 'Lena'];

/** Who is out today: a stable pick of the trainer sheets, spread over the districts. Pure, so a test can read it. */
export function pocketFolk(count = 10): Folk[] {
  const sheets = OVERWORLD.trainers;
  if (sheets.length === 0) return [];
  return Array.from({ length: Math.max(0, Math.min(count, NAMES.length)) }, (_, i) => ({
    id: `folk${i}`,
    name: NAMES[i]!,
    sheet: sheets[hash(`pocket:${i}`) % sheets.length]!,
    zone: ZONES[i % ZONES.length]!,
  }));
}

export const folkAssets = (list: Folk[]): string[] => [...new Set(list.map((f) => overworldAssetIds.trainer(f.sheet)))];

interface Walker {
  folk: Folk;
  sprite: Phaser.GameObjects.Sprite;
  at: { x: number; y: number };
  tiles: { x: number; y: number }[];
  facing: Facing;
  steps: number;
  busy: boolean;
}

export class PocketFolk {
  private readonly walkers: Walker[] = [];
  private readonly clock: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly town: HubTownView,
    private readonly scene: Phaser.Scene,
    content: Content,
    profile: Profile,
    list: Folk[],
    private readonly opts: { motion: 'full' | 'reduced' | 'off'; window: string; say(line: string): void },
  ) {
    const stands = new Set(town.map.places.map((p) => `${p.stand.x},${p.stand.y}`));
    for (const folk of list) {
      const z = town.map.zones[folk.zone];
      const texture = overworldAssetIds.trainer(folk.sheet);
      if (!z || !scene.textures.exists(texture)) continue;
      // The first free tile of the zone that is not a doorstep, picked by hash.
      let start: { x: number; y: number } | null = null;
      for (let k = 0; k < 80 && !start; k++) {
        const x = z[0] + (hash(`${folk.id}:x${k}`) % z[2]);
        const y = z[1] + (hash(`${folk.id}:y${k}`) % z[3]);
        if (town.grid.canEnter(x, y, folk.id) && !stands.has(`${x},${y}`) && !this.near(x, y)) start = { x, y };
      }
      if (!start) continue;
      const facing = DIRS[hash(folk.id) % 4]!;
      ensureWalkAnims(scene, texture);
      const sprite = town.addPerson(folk.id, texture, start, facing);
      const walker: Walker = { folk, sprite, at: { ...start }, tiles: [{ ...start }], facing, steps: 0, busy: false };
      this.walkers.push(walker);
      town.addTalker({
        id: folk.id,
        name: folk.name,
        verb: 'Talk',
        tiles: walker.tiles,
        onTalk: () => opts.say(`${folk.name}: ${pocketChatterFor(content, profile, folk.id, opts.window)}`),
      });
    }
    this.stands = stands;
    if (opts.motion !== 'off') {
      this.clock = scene.time.addEvent({ delay: 700, loop: true, callback: () => this.tick() });
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clock?.remove());
    }
  }

  private readonly stands: Set<string>;

  private near(x: number, y: number): boolean {
    return this.walkers.some((w) => Math.abs(w.at.x - x) + Math.abs(w.at.y - y) < 3);
  }

  count(): number {
    return this.walkers.length;
  }

  private tick(): void {
    for (const w of this.walkers) {
      if (w.busy) continue;
      w.steps++;
      const h = hash(`${w.folk.id}:${this.opts.window}:${w.steps}`);
      if (h % 3 === 0) continue; // stand a moment
      const dir = DIRS[(h >>> 3) % 4]!;
      const next = { x: w.at.x + STEP[dir].dx, y: w.at.y + STEP[dir].dy };
      const z = this.town.map.zones[w.folk.zone]!;
      const inside = next.x >= z[0] && next.y >= z[1] && next.x < z[0] + z[2] && next.y < z[1] + z[3];
      const you = this.town.tile();
      if (!inside || this.stands.has(`${next.x},${next.y}`) || (you.x === next.x && you.y === next.y) || !this.town.grid.canEnter(next.x, next.y, w.folk.id)) continue;
      this.town.grid.claim(w.folk.id, next, w.at);
      w.at = next;
      w.tiles[0] = { ...next };
      w.facing = dir;
      w.busy = true;
      const texture = w.sprite.texture.key;
      w.sprite.anims.play({ key: `${texture}#${dir}`, frameRate: 7 }, true);
      const feet = this.town.feet(next);
      this.scene.tweens.add({
        targets: w.sprite,
        x: feet.x,
        y: feet.y,
        duration: 340,
        onUpdate: () => this.sync(w),
        onComplete: () => {
          this.sync(w);
          w.busy = false;
          w.sprite.anims.stop();
          w.sprite.setFrame(FRAME_ROW[w.facing] * 4);
        },
      });
    }
  }

  private sync(w: Walker): void {
    w.sprite.setDepth(10 + w.sprite.y);
    (w.sprite.getData('shadow') as Phaser.GameObjects.Ellipse | undefined)?.setPosition(w.sprite.x, w.sprite.y - 6).setDepth(10 + w.sprite.y - 1);
  }
}
