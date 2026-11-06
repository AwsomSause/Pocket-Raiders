// Hub Town's minimap and district banner (Kice 2026-11-02: "easy to understand, possibility of minimap").
// M cycles the map: small (corner), large (with building names and a district key), hidden. The choice lasts for the
// session. Walking into a new district shows its name on a DS-style sign for a moment. Presentation only: both are on
// the screen camera, read the town's tile, and hide while a page is open.

import Phaser from 'phaser';
import { districtAt, teleportSpot, type HubDistrict } from '../../core/hubTown/world';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import type { HubTownView } from './townView';

export type MinimapMode = 'small' | 'large' | 'hidden';
const NEXT: Record<MinimapMode, MinimapMode> = { small: 'large', large: 'hidden', hidden: 'small' };
/** The minimap mode this session (it survives the Hub reopening after a page). */
let sessionMode: MinimapMode = 'small';

const COLOR: Record<string, number> = { '.': 0x78c850, '=': 0xe0d0a8, o: 0xf0e6cc, '~': 0x58a8f0, '#': 0xc8604c, T: 0x3a7a3e };
const DEPTH = 800_000;
/** Short names that fit over a building on the large map (the full name is on the door prompt). */
const SHORT: Record<string, string> = {
  achievements: 'Achievements', dojo: 'Dojo', arena: 'Arena', memories: 'Memories', events: 'Events', boutique: 'Boutique', post: 'Post',
  center: 'Center', bank: 'Bank', hq: 'HQ', nook: 'Nook', prep: 'Run Prep', merchant: 'Merchant', institute: 'Institute',
  gate: 'Departure Gate', pocket: 'Pocket Town', board: 'Board', sanctuary: 'Sanctuary',
};

const hex = (c: string): number => parseInt(c.replace('#', ''), 16);

export class HubMinimap {
  private mode: MinimapMode = sessionMode;
  private readonly small: Phaser.GameObjects.Container;
  private readonly large: Phaser.GameObjects.Container;
  private readonly dotSmall: Phaser.GameObjects.Arc;
  private readonly dotLarge: Phaser.GameObjects.Arc;
  private readonly banner: DistrictBanner;
  private district: string | null = null;
  private readonly map;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly town: HubTownView,
    private readonly opts: { busy(): boolean; motion: 'full' | 'reduced' | 'off'; title?: string },
  ) {
    this.map = town.map;
    const [W, H] = this.map.size;
    // Small: 2 px a tile in the bottom-right corner.
    const s = 2;
    const sx = GAME_WIDTH - W * s - 14;
    const sy = GAME_HEIGHT - H * s - 30;
    this.small = scene.add.container(sx, sy).setDepth(DEPTH).setName('hubtown-minimap');
    this.small.add(scene.add.rectangle(-4, -4, W * s + 8, H * s + 8, 0x10203a, 0.78).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.8));
    this.small.add(this.paint(s, false));
    this.dotSmall = scene.add.circle(0, 0, 3, 0xffffff).setStrokeStyle(1, 0xe03040);
    this.small.add([this.dotSmall, scene.add.text(W * s, H * s + 6, 'M map', textStyle(12, '#ffffff', { stroke: '#10203a', strokeThickness: 3 })).setOrigin(1, 0)]);

    // Large: 7 px a tile in the middle, with names and a key.
    const l = 7;
    const lx = Math.round((GAME_WIDTH - W * l) / 2) - 70;
    const ly = Math.round((GAME_HEIGHT - H * l) / 2) + 6;
    this.large = scene.add.container(lx, ly).setDepth(DEPTH + 1).setName('hubtown-minimap-large');
    this.large.add(scene.add.rectangle(-10, -34, W * l + 20 + 170, H * l + 44, 0x10203a, 0.9).setOrigin(0).setStrokeStyle(3, 0xffffff, 0.85));
    this.large.add(scene.add.text(0, -28, opts.title ?? 'Hub Town', textStyle(18, '#ffe08a')));
    this.large.add(this.paint(l, true));
    for (const pl of this.map.places) {
      // Teleporters (S467): click a place name on the large map to jump to its door.
      const label = scene.add.text(pl.door.x * l + l / 2, pl.door.y * l - (pl.kind === 'building' ? 10 : 2), SHORT[pl.id] ?? pl.name, textStyle(11, '#ffffff', { stroke: '#10203a', strokeThickness: 3, align: 'center' })).setOrigin(0.5, 1);
      label.setInteractive({ useHandCursor: true }).setName(`hubtown-teleport-${pl.id}`);
      label.on('pointerover', () => label.setColor('#ffe08a'));
      label.on('pointerout', () => label.setColor('#ffffff'));
      label.on('pointerdown', () => this.teleport(pl.id));
      this.large.add(label);
    }
    this.map.districts.forEach((d, i) => {
      const y = 8 + i * 64;
      this.large.add(scene.add.rectangle(W * l + 18, y, 14, 14, hex(d.color)).setOrigin(0).setStrokeStyle(1, 0xffffff));
      this.large.add(scene.add.text(W * l + 38, y - 3, d.name, textStyle(13, '#ffffff')));
      this.large.add(scene.add.text(W * l + 38, y + 14, d.blurb, textStyle(10, '#c8d8f0', { wordWrap: { width: 128 } })));
    });
    this.dotLarge = scene.add.circle(0, 0, 5, 0xffffff).setStrokeStyle(2, 0xe03040);
    this.large.add([this.dotLarge, scene.add.text(W * l, H * l + 4, 'M: hide map', textStyle(12, '#c8d8f0')).setOrigin(1, 0)]);
    if (opts.motion === 'full') scene.tweens.add({ targets: [this.dotSmall, this.dotLarge], scale: 1.4, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.banner = new DistrictBanner(scene, opts.motion);
    this.district = districtAt(town.tile())?.id ?? null;
    scene.input.keyboard?.on('keydown-M', this.onKey);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.keyboard?.off('keydown-M', this.onKey);
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    });
    this.update();
  }

  get current(): MinimapMode {
    return this.mode;
  }

  /** Small, large, hidden, small... */
  cycle(): MinimapMode {
    this.mode = sessionMode = NEXT[this.mode];
    this.update();
    return this.mode;
  }

  /** Jump to a place's door from the large map, then close the map. */
  teleport(placeId: string): void {
    if (this.opts.busy() || this.mode !== 'large') return;
    const spot = teleportSpot(placeId, this.map);
    if (!spot) return;
    this.town.moveTo(spot);
    this.mode = sessionMode = 'small';
    this.update();
  }

  private readonly onKey = (): void => {
    if (!this.opts.busy()) this.cycle();
  };

  /** One rectangle per tile, then each district's edge in its colour. */
  private paint(size: number, outlines: boolean): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics();
    this.map.minimap.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) g.fillStyle(COLOR[row[x]!] ?? COLOR['.']!, 1).fillRect(x * size, y * size, size, size);
    });
    if (outlines)
      for (const d of this.map.districts) {
        const [x, y, w, h] = d.rect;
        g.fillStyle(hex(d.color), 0.14).fillRect(x * size, y * size, w * size, h * size);
        g.lineStyle(2, hex(d.color), 0.95).strokeRect(x * size, y * size, w * size, h * size);
      }
    return g;
  }

  private update(): void {
    const busy = this.opts.busy();
    this.small.setVisible(!busy && this.mode === 'small');
    this.large.setVisible(!busy && this.mode === 'large');
    const t = this.town.tile();
    this.dotSmall.setPosition(t.x * 2 + 1, t.y * 2 + 1);
    this.dotLarge.setPosition(t.x * 7 + 3.5, t.y * 7 + 3.5);
    const d = districtAt(t, this.map);
    if (this.mode === 'large' || busy) this.banner.hide();
    else if (d && d.id !== this.district) this.banner.show(d);
    if (d) this.district = d.id;
  }
}

/** The district's name on a sign that drops in at the top left (like a DS town name), then lifts away. */
export class DistrictBanner {
  private readonly box: Phaser.GameObjects.Container;
  private readonly name: Phaser.GameObjects.Text;
  private readonly blurb: Phaser.GameObjects.Text;
  private readonly plate: Phaser.GameObjects.Graphics;
  private hideAt: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly motion: 'full' | 'reduced' | 'off',
  ) {
    this.plate = scene.add.graphics();
    this.name = scene.add.text(20, 10, '', textStyle(20, '#2a2840'));
    this.blurb = scene.add.text(20, 38, '', textStyle(12, '#4a4860'));
    this.box = scene.add.container(16, -80, [this.plate, this.name, this.blurb]).setDepth(DEPTH + 2).setName('hubtown-district').setVisible(false);
  }

  get text(): string {
    return this.box.visible ? this.name.text : '';
  }

  hide(): void {
    if (!this.box.visible) return;
    this.hideAt?.remove();
    this.scene.tweens.killTweensOf(this.box);
    this.box.setVisible(false);
  }

  show(d: HubDistrict): void {
    this.name.setText(d.name);
    this.blurb.setText(d.blurb);
    const w = Math.max(this.name.width, this.blurb.width) + 40;
    this.plate.clear();
    this.plate.fillStyle(0x000000, 0.25).fillRoundedRect(3, 4, w, 60, 10);
    this.plate.fillStyle(0xfdfaf0, 0.97).fillRoundedRect(0, 0, w, 60, 10);
    this.plate.fillStyle(hex(d.color), 1).fillRoundedRect(0, 0, 8, 60, { tl: 10, bl: 10, tr: 0, br: 0 });
    this.plate.lineStyle(2, hex(d.color), 1).strokeRoundedRect(0, 0, w, 60, 10);
    const y = 84;
    this.scene.tweens.killTweensOf(this.box);
    this.hideAt?.remove();
    this.box.setVisible(true);
    if (this.motion === 'off') this.box.setY(y).setAlpha(1);
    else this.scene.tweens.add({ targets: this.box, y: { from: y - 30, to: y }, alpha: { from: 0, to: 1 }, duration: 260, ease: this.motion === 'full' ? 'Back.easeOut' : 'Cubic.easeOut' });
    this.hideAt = this.scene.time.delayedCall(2200, () => {
      if (this.motion === 'off') return void this.box.setVisible(false);
      this.scene.tweens.add({ targets: this.box, y: y - 30, alpha: 0, duration: 260, onComplete: () => this.box.setVisible(false) });
    });
  }
}
