// The Arena Lobby: the Hub drawn as a menu instead of a town (Settings > Hub style; Hub Town is the default).
// This is the tile Hub from before Hub Town (an arena stage, a Pokémon or the Legacy Rotation in the middle, and six
// raised tiles along the bottom). Each tile opens the same rooms the town's buildings open, so nothing is lost.
// Presentation only; motion follows the animation setting.

import Phaser from 'phaser';
import type { Content, Species } from '../../core/contentSchema';
import type { RotationEntry } from '../../core/legacyRuns';
import type { Profile, RunState } from '../../core/state';
import { pokemonAssetIds } from '../../assets/catalog';
import { playSfx } from '../audio';
import { fitLine } from '../fitText';
import { ArenaBackdrop, ShowcaseMon } from '../showcase';
import { itemVisual } from '../sprites';
import { COLORS, GAME_WIDTH, PIXEL_SCALE, textStyle } from '../theme';
import { WiiCursor } from '../wiiMotion';
import { paintWindow } from '../widgets';
import { drawHubProps } from './props';
import { LegacyRotationView } from './rotation';

export interface LobbyTile {
  id: string;
  label: string;
  icon: string;
  rooms: string[];
  blurb: string;
}

/** The six tiles along the bottom; a tile with several rooms opens its page. */
export const LOBBY_TILES: LobbyTile[] = [
  { id: 'settings', label: 'Settings', icon: 'item.scanner', rooms: ['options', 'hubmon', 'save', 'tools', 'back'], blurb: 'Game settings, save data, and the way back to the title screen.' },
  { id: 'trainers', label: 'Trainers', icon: 'item.leaders_crest', rooms: ['archive', 'quests'], blurb: 'Every trainer, how to unlock them, and their quest lines.' },
  { id: 'run', label: 'New Run', icon: 'ball.pb', rooms: ['run'], blurb: 'Choose a trainer and a starter, then set off.' },
  { id: 'history', label: 'Events', icon: 'item.calendar', rooms: ['events', 'history', 'fame', 'legacy', 'memories', 'codex', 'tales', 'intel', 'museum', 'seeds', 'mentors', 'nook'], blurb: "This week's event, past runs, the Hall of Fame, the Moment Codex, the Intelligence Board, the Item Museum and the Seed Shelf." },
  { id: 'unlocks', label: 'Unlocks', icon: 'item.golden_mystic_ticket', rooms: ['achievements', 'bank', 'merchant', 'lab', 'attributes', 'mastery', 'research', 'tree', 'prestige', 'network', 'moves', 'wardrobe', 'card'], blurb: 'Achievements, the Bank, the Strange Merchant, the Starter Laboratory, Attributes, Species Mastery, the Research Room and the Wardrobe.' },
  { id: 'town', label: 'Town', icon: 'item.map', rooms: ['town'], blurb: 'Pocket Town: gardens, shrine, library, capsule machine and more.' },
];

const BLURB_Y = 382;
const TILE_Y = 470;
const TILE_H = 104;
const TILE_RISE = 16;
const WIDTHS = [140, 150, 200, 140, 140, 110];

interface TileView {
  root: Phaser.GameObjects.Container;
  idle: Phaser.GameObjects.Graphics;
  lit: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.GameObject & { y: number };
  label: Phaser.GameObjects.Text;
  x: number;
  w: number;
}

/** Five random game Pokémon (not custom forms) shown behind the tiles; pick them in preload. */
export function lobbyMons(content: Content, has: (id: string) => boolean): Species[] {
  const all = [...content.species.values()].filter((sp) => !sp.id.includes('-') && has(pokemonAssetIds(sp.assets).front));
  return Phaser.Utils.Array.Shuffle(all).slice(0, LOBBY_TILES.length);
}

export class ArenaLobby {
  private readonly tiles: TileView[] = [];
  private index = 2;
  private cursor: WiiCursor | null = null;
  private readonly blurb: Phaser.GameObjects.Text;
  private readonly pill: Phaser.GameObjects.Graphics;
  private readonly showcase: ShowcaseMon;
  readonly rotation: LegacyRotationView | null;
  private readonly mons: Species[];
  private readonly busy: () => boolean;
  private readonly onTile: (tile: LobbyTile) => void;

  constructor(
    private readonly scene: Phaser.Scene,
    opts: {
      content: Content;
      profile: Profile;
      motion: 'full' | 'reduced' | 'off';
      ready: number;
      mons: Species[];
      entries: RotationEntry[];
      current: RunState | null;
      seed: string;
      busy(): boolean;
      onTile(tile: LobbyTile): void;
    },
  ) {
    this.mons = opts.mons;
    this.busy = opts.busy;
    this.onTile = opts.onTile;
    new ArenaBackdrop(scene, { platformAt: { x: GAME_WIDTH / 2, y: 350 } });
    // Darken the top (logo, counters) and the bottom (tiles) so text stays readable.
    const shade = scene.add.graphics().setDepth(-20);
    for (let i = 0; i < 12; i++) {
      shade.fillStyle(0x0e0b12, 0.5 * (1 - i / 12)).fillRect(0, i * 8, GAME_WIDTH, 8);
      shade.fillStyle(0x0e0b12, 0.75 * (i / 12)).fillRect(0, 380 + i * 14, GAME_WIDTH, 14);
    }
    drawHubProps(scene, opts.profile, opts.motion);
    this.showcase = new ShowcaseMon(scene, GAME_WIDTH / 2, 356, PIXEL_SCALE, 250);
    this.rotation = opts.entries.length > 0
      ? new LegacyRotationView(scene, opts.content, opts.entries, { x: GAME_WIDTH / 2, y: 356, motion: opts.motion, records: new Map(opts.profile.legacyRuns.map((r) => [r.runId, r])), currentSpecies: opts.current?.party.map((m) => m.speciesId) ?? [], seed: opts.seed })
      : null;
    this.pill = scene.add.graphics();
    this.blurb = scene.add.text(GAME_WIDTH / 2, BLURB_Y, '', textStyle(16, COLORS.textLight, { align: 'center' })).setOrigin(0.5, 0.5);
    this.build(opts.ready);
  }

  /** The tile that holds a room (New Run when none does). */
  tileFor(room: string): LobbyTile {
    return LOBBY_TILES.find((t) => t.rooms.includes(room)) ?? LOBBY_TILES[2]!;
  }

  focus(id: string, sound = true): void {
    const i = Math.max(0, LOBBY_TILES.findIndex((t) => t.id === id));
    if (sound && i !== this.index) playSfx(this.scene, 'ui.cursor', 0.5);
    this.index = i;
    this.tiles.forEach((tile, n) => {
      const on = n === i;
      tile.idle.setVisible(!on);
      tile.lit.setVisible(on);
      tile.label.setColor(on ? COLORS.gold : COLORS.textLight);
      const h = LOBBY_TILES[n]!.id === 'run' ? TILE_H + 12 : TILE_H;
      this.scene.tweens.killTweensOf(tile.root);
      this.scene.tweens.add({ targets: tile.root, y: TILE_Y - h / 2 - (on ? TILE_RISE : 0), duration: 180, ease: 'Cubic.easeOut' });
      this.scene.tweens.killTweensOf(tile.icon);
      const iconY = LOBBY_TILES[n]!.id === 'run' ? 42 : 38;
      tile.icon.y = iconY;
      if (on) this.scene.tweens.add({ targets: tile.icon, y: iconY - 5, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    const tile = this.tiles[i]!;
    const h = LOBBY_TILES[i]!.id === 'run' ? TILE_H + 12 : TILE_H;
    const box: [number, number, number, number] = [tile.x - 6, TILE_Y - h / 2 - TILE_RISE - 6, tile.w + 12, h + 12];
    if (!this.cursor) {
      this.cursor = new WiiCursor(this.scene, null, ...box, 18);
      this.cursor.g.setDepth(5).setName('hub-cursor');
    } else this.cursor.moveTo(...box);
    this.setBlurb(LOBBY_TILES[i]!.blurb);
    const mon = this.mons[i];
    if (mon && !this.rotation) this.showcase.show(mon);
  }

  /** Arrows move along the tiles, Z (or Up on a tile with a page) opens it. Returns false for keys it leaves alone. */
  handle(a: string): boolean {
    const n = LOBBY_TILES.length;
    if (a === 'left') this.focus(LOBBY_TILES[(this.index + n - 1) % n]!.id);
    else if (a === 'right') this.focus(LOBBY_TILES[(this.index + 1) % n]!.id);
    else if (a === 'confirm' || (a === 'up' && LOBBY_TILES[this.index]!.rooms.length > 1)) this.confirm();
    else return a === 'up' || a === 'down';
    return true;
  }

  private confirm(): void {
    playSfx(this.scene, 'ui.select');
    this.onTile(LOBBY_TILES[this.index]!);
  }

  private setBlurb(text: string): void {
    this.blurb.setText(text);
    const w = this.blurb.width + 32;
    this.pill.clear().fillStyle(0x0e0b12, 0.78).fillRoundedRect(GAME_WIDTH / 2 - w / 2, BLURB_Y - 14, w, 28, 14);
  }

  private build(ready: number): void {
    const gap = (GAME_WIDTH - 32 - WIDTHS.reduce((a, b) => a + b, 0)) / (WIDTHS.length - 1);
    let x = 16;
    LOBBY_TILES.forEach((t, i) => {
      const w = WIDTHS[i]!;
      const big = t.id === 'run';
      const h = big ? TILE_H + 12 : TILE_H;
      const root = this.scene.add.container(x, TILE_Y - h / 2);
      const idle = paintWindow(this.scene.add.graphics(), 0, 0, w, h, { fill: 0x2a2431, border: big ? COLORS.border : COLORS.borderMuted, alpha: 0.94 });
      const lit = paintWindow(this.scene.add.graphics(), 0, 0, w, h, { fill: 0x3a3048, border: COLORS.accent }).setVisible(false);
      const icon = itemVisual(this.scene, t.icon, w / 2, big ? 42 : 38, big ? 3 : 2) as TileView['icon'];
      const text = t.id === 'trainers' && ready > 0 ? `${t.label} (${ready}!)` : t.label;
      const label = fitLine(this.scene.add.text(w / 2, h - (big ? 34 : 30), text, textStyle(big ? 28 : 24)).setOrigin(0.5, 0.5), w - 24);
      const zone = this.scene.add.zone(0, 0, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => !this.busy() && this.focus(t.id));
      zone.on('pointerdown', () => {
        if (this.busy()) return;
        this.focus(t.id, false);
        this.confirm();
      });
      root.add([idle, lit, icon, label, zone]);
      this.tiles.push({ root, idle, lit, icon, label, x, w });
      x += w + gap;
    });
  }
}
