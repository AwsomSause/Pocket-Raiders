// Event Indicators over Hub Town (Pokemon-Memories' "Event Indicators" art by wrigty12 and Luka S.J.): little flairs
// that say what is worth walking up to. Keepers show what they offer (the Merchant an item while there is stock left
// today, the Gatekeeper the "!" of the Departure Gate), the Arena door bounces a quest mark while a trainer is ready
// to claim, signs and pedestals show a "?", and wandering trainers and Pokémon show a talk bubble or a Poké Ball when
// you are close. Presentation only; they bob only with full motion.

import Phaser from 'phaser';
import { OVERWORLD_INDICATORS, overworldAssetIds, type OverworldIndicator } from '../../assets/catalog';
import { HUB_TOWN } from '../../core/hubTown/schema';
import type { HubCrowd } from './crowd';
import type { HubTownView } from './townView';

const T = HUB_TOWN.tile;
/** How close (tiles) a wanderer has to be before its flair shows. */
const NEAR = 4;
const DEPTH = 900_000 - 2;

/** Every indicator picture, for preloading. */
export function indicatorAssets(): string[] {
  return [...OVERWORLD_INDICATORS.map((n) => overworldAssetIds.indicator(n)), overworldAssetIds.indicator('quest_available_simple_anim')];
}

export interface IndicatorPlan {
  /** Keeper id -> its flair (null: none right now). */
  keepers: Record<string, OverworldIndicator | null>;
  /** Place ids whose door shows the bouncing quest mark. */
  quests: string[];
  /** How many Legacy Display pedestals hold someone. */
  pedestals: number;
}

export class HubIndicators {
  /** Every flair made, by a name for tests (keeper:merchant, place:arena, pad:0, crowd:<id>). */
  readonly shown = new Map<string, Phaser.GameObjects.Image | Phaser.GameObjects.Sprite>();
  private readonly near: { flair: Phaser.GameObjects.Image; sprite: Phaser.GameObjects.Sprite; at: { x: number; y: number } }[] = [];

  constructor(
    private readonly town: HubTownView,
    private readonly scene: Phaser.Scene,
    plan: IndicatorPlan,
    keepers: Map<string, Phaser.GameObjects.Sprite>,
    crowd: HubCrowd | null,
    private readonly motion: 'full' | 'reduced' | 'off',
  ) {
    town.world(() => {
      for (const [id, sprite] of keepers) {
        const kind = plan.keepers[id];
        if (kind) this.over(`keeper:${id}`, kind, sprite.x, sprite.y - sprite.displayHeight + 6);
      }
      for (const id of plan.quests) {
        const pl = HUB_TOWN.places.find((p) => p.id === id);
        if (!pl) continue;
        const key = overworldAssetIds.indicator('quest_available_simple_anim');
        if (!scene.textures.exists(key)) continue;
        const s = scene.add.sprite(pl.door.x * T + T / 2, pl.door.y * T - 6, key, 0).setOrigin(0.5, 1).setDepth(DEPTH).setName(`hubtown-ind-place:${id}`);
        if (motion === 'full') {
          if (!scene.anims.exists(key)) scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
          s.play(key);
        }
        this.bob(s);
        this.shown.set(`place:${id}`, s);
      }
      for (const pl of HUB_TOWN.places) if (pl.kind === 'sign') this.over(`place:${pl.id}`, 'flair_question', pl.door.x * T + T / 2, pl.door.y * T - 4);
      HUB_TOWN.pads.slice(0, plan.pedestals).forEach(([x, y], i) => this.over(`pad:${i}`, 'event_question', x * T + T / 2, y * T - 50));
      for (const w of crowd?.walkers ?? []) {
        const f = this.over(`crowd:${w.w.id}`, w.w.kind === 'trainer' ? 'flair_talk' : 'flair_pokeball', w.sprite.x, w.sprite.y);
        if (!f) continue;
        f.setVisible(false);
        this.near.push({ flair: f, sprite: w.sprite, at: w.at });
      }
    });
    if (this.near.length) {
      scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this));
    }
  }

  /** One flair image with its bottom at (x, y). */
  private over(name: string, kind: OverworldIndicator, x: number, y: number): Phaser.GameObjects.Image | null {
    const key = overworldAssetIds.indicator(kind);
    if (!this.scene.textures.exists(key)) return null;
    const img = this.scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(DEPTH).setName(`hubtown-ind-${name}`);
    this.bob(img);
    this.shown.set(name, img);
    return img;
  }

  private bob(target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject): void {
    if (this.motion === 'full') this.scene.tweens.add({ targets: target, scale: { from: 1, to: 1.12 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Wanderers' flairs follow them and show only when you are close. */
  private update(): void {
    const you = this.town.tile();
    for (const n of this.near) {
      const close = Math.abs(n.at.x - you.x) + Math.abs(n.at.y - you.y) <= NEAR;
      n.flair.setVisible(close);
      if (close) n.flair.setPosition(n.sprite.x, n.sprite.y - n.sprite.displayHeight + 4);
    }
  }
}
