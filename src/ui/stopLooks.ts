// Raid and Totem stop screens (screens redesign group E): the boss card before the fight, drawn like
// each picked mock-up (Max Den, Shonen Squad, Tera Episode, Ink Ruler). MapScene keeps the data and what
// choosing does; this only draws the card and moves the focus. Presentation only.
import Phaser from 'phaser';
import type { Species } from '../core/contentSchema';
import { fitBlock, fitLine } from './fitText';
import type { MotionLevel } from './screenSkins';
import { pokemonVisual } from './sprites';
import { GAME_HEIGHT as H, GAME_WIDTH as W, textStyle } from './theme';

export type StopLook = 'maxden' | 'shonen' | 'tera' | 'ink';

export interface StopOption {
  label: string;
  detail: string;
  /** Why it can't be chosen (shown instead of the detail), or null. */
  problem: string | null;
}

export interface StopData {
  kicker: string;
  title: string;
  species: Species;
  level: number;
  /** Lines of mechanics, rewards and so on. */
  info: string[];
  options: StopOption[];
}

export class StopCard {
  private readonly root: Phaser.GameObjects.Container;
  private layer: Phaser.GameObjects.Container;
  private index = 0;
  private closed = false;
  readonly isStopCard = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly look: StopLook,
    private readonly data: StopData,
    private readonly motion: MotionLevel,
    private readonly cb: { onSelect(i: number): void; onBack(): void },
  ) {
    this.root = scene.add.container(0, 0).setDepth(100);
    this.root.add(scene.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0).setInteractive());
    this.layer = scene.add.container(0, 0);
    this.root.add(this.layer);
    this.draw();
  }

  handle(action: string): void {
    const n = this.data.options.length;
    if (action === 'back') return this.cb.onBack();
    if (action === 'confirm') {
      if (!this.data.options[this.index]?.problem) this.cb.onSelect(this.index);
      return;
    }
    const step = action === 'up' || action === 'left' ? -1 : action === 'down' || action === 'right' ? 1 : 0;
    if (!step || n === 0) return;
    this.index = (this.index + step + n) % n;
    this.draw();
  }

  close(): void {
    this.closed = true;
    this.root.destroy();
  }

  private draw(): void {
    if (this.closed) return;
    this.layer.removeAll(true);
    const { scene, look, data } = this;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => (this.layer.add(o), o);
    const g = add(scene.add.graphics());
    const full = this.motion === 'full';
    const bossX = look === 'ink' ? 600 : 690;
    const bossY = look === 'tera' ? 400 : 380;

    // Backdrop per look.
    if (look === 'maxden') {
      g.fillGradientStyle(0xd8104a, 0xd8104a, 0x5a0a50, 0x5a0a50, 1, 1, 1, 1).fillRect(0, 0, W, H);
      for (let i = 0; i < 9; i++) g.lineStyle(14, 0xff5a8a, 0.16).strokeCircle(bossX, 230, 60 + i * 56);
    } else if (look === 'shonen') {
      g.fillStyle(0x2a52e8, 1).fillRect(0, 0, W, H).fillStyle(0xffc828, 1).fillTriangle(W * 0.42, 0, W, 0, W, H).fillTriangle(W * 0.42, 0, W, H, W * 0.15, H);
      for (let i = 0; i < 30; i++) g.fillStyle(0xffffff, 0.08).fillTriangle(W * 0.6, H * 0.45, ((i * 53) % W), 0, ((i * 53 + 20) % W), 0);
    } else if (look === 'tera') {
      g.fillGradientStyle(0xe8f2ff, 0xfff0f8, 0xd8e8ff, 0xffe8f0, 1, 1, 1, 1).fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) {
        const x = (i * 211) % W;
        const y = (i * 97) % H;
        g.fillStyle([0xa8d0ff, 0xffc8e0, 0xc8f0e0, 0xfff0a8][i % 4]!, 0.5).fillTriangle(x, y, x + 140, y + 30, x + 40, y + 120);
      }
    } else {
      g.fillStyle(0xf4ead0, 1).fillRect(0, 0, W, H);
      g.fillStyle(0x16100a, 1).fillPoints([new Phaser.Geom.Point(330, 110), new Phaser.Geom.Point(880, 70), new Phaser.Geom.Point(900, 400), new Phaser.Geom.Point(350, 440)], true);
    }

    // The boss.
    const v = pokemonVisual(scene, data.species, 'front', bossX, bossY, 5, false) as unknown as Phaser.GameObjects.Sprite;
    if (look === 'ink') (v as unknown as { setTintFill?: (c: number) => void }).setTintFill?.(0xffffff);
    add(v);
    if (full) scene.tweens.add({ targets: v, y: bossY - 10, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Title.
    if (look === 'maxden') {
      g.fillStyle(0xd8b050, 1).fillRoundedRect(20, 20, 330, 56, 12).lineStyle(3, 0xfff0b0, 1).strokeRoundedRect(20, 20, 330, 56, 12);
      add(scene.add.text(40, 48, data.kicker, textStyle(20, '#5a3a10')).setOrigin(0, 0.5));
      add(fitLine(scene.add.text(40, 100, `${data.title}`, textStyle(26, '#ffffff', { stroke: '#3a0a30', strokeThickness: 5 })), 560));
    } else if (look === 'shonen') {
      add(scene.add.text(30, 22, 'RAID BOSS!', textStyle(44, '#ffffff', { stroke: '#10206a', strokeThickness: 7 })).setAngle(-3));
      add(fitLine(scene.add.text(34, 84, `${data.title}`, textStyle(16, '#e8f0ff')), 380));
    } else if (look === 'tera') {
      g.fillStyle(0xffffff, 1).fillRect(30, 28, 470, 84).lineStyle(4, 0xe83a3a, 1).lineBetween(30, 112, 500, 112);
      add(scene.add.text(46, 40, data.kicker, textStyle(13, '#e83a3a')));
      add(fitLine(scene.add.text(46, 62, data.title, textStyle(26, '#16203a')), 440));
    } else {
      add(scene.add.text(46, 50, '主', textStyle(80, '#16100a')));
      add(scene.add.text(52, 150, 'TOTEM', textStyle(14, '#b02a2a')));
      add(fitLine(scene.add.text(52, 176, data.title, textStyle(20, '#16100a')), 270));
    }

    // Info lines.
    const infoInk = look === 'tera' || look === 'ink' ? '#16203a' : '#ffffff';
    const infoBox = look === 'maxden' ? { x: 440, y: 340, w: 480, h: 110 } : look === 'tera' ? { x: 30, y: 440, w: 560, h: 70 } : look === 'shonen' ? { x: 30, y: 330, w: 330, h: 130 } : { x: 52, y: 210, w: 270, h: 90 };
    if (look === 'maxden') g.fillStyle(0x08162a, 0.9).fillRoundedRect(infoBox.x, infoBox.y, infoBox.w, infoBox.h, 8).lineStyle(2, 0x20e0e8, 1).strokeRoundedRect(infoBox.x, infoBox.y, infoBox.w, infoBox.h, 8);
    if (look === 'tera') g.fillStyle(0x16203a, 0.92).fillRect(infoBox.x, infoBox.y, infoBox.w, infoBox.h);
    add(fitBlock(scene.add.text(infoBox.x + 12, infoBox.y + 8, `${data.species.name} Lv ${data.level}\n${data.info.join('\n')}`, textStyle(13, look === 'tera' ? '#ffffff' : infoInk, { wordWrap: { width: infoBox.w - 24 } })), infoBox.w - 24, infoBox.h - 14));

    // Options: the choices, as the look's own buttons.
    data.options.forEach((o, i) => {
      const on = i === this.index;
      const ink = look === 'ink' ? '#16100a' : '#ffffff';
      let x: number, y: number, w: number, h: number;
      if (look === 'maxden') { x = 450 + (i % 3) * 150; y = 462 + Math.floor(i / 3) * 34; w = 140; h = 30; }
      else if (look === 'shonen') { x = 24 + i * 14; y = 150 + i * 46; w = 330; h = 40; }
      else if (look === 'tera') { x = 620 + (i % 2) * 150; y = 450 + Math.floor(i / 2) * 36; w = 140; h = 30; }
      else { x = 52; y = 320 + i * 40; w = 280; h = 34; }
      const b = add(scene.add.graphics());
      if (look === 'maxden') b.fillStyle(on ? 0x20e0e8 : 0x0a2a4a, 1).fillRoundedRect(x, y, w, h, 4).lineStyle(2, 0x20e0e8, 1).strokeRoundedRect(x, y, w, h, 4);
      else if (look === 'shonen') b.fillStyle(on ? 0xe83a3a : 0x10206a, 1).fillPoints([new Phaser.Geom.Point(x + 10, y), new Phaser.Geom.Point(x + w, y), new Phaser.Geom.Point(x + w - 10, y + h), new Phaser.Geom.Point(x, y + h)], true);
      else if (look === 'tera') b.fillStyle(on ? 0xe83a3a : 0xffffff, 1).fillRect(x, y, w, h).lineStyle(2, 0x16203a, 1).strokeRect(x, y, w, h);
      else { b.lineStyle(2, 0x16100a, 1).lineBetween(x, y + h, x + w, y + h); if (on) b.fillStyle(0xb02a2a, 1).fillRect(x - 10, y + 4, 5, h - 8); }
      const tcol = look === 'tera' ? (on ? '#ffffff' : '#16203a') : look === 'maxden' && on ? '#06202a' : ink;
      add(fitLine(scene.add.text(x + 10, y + h / 2, o.label, textStyle(look === 'maxden' ? 12 : 14, o.problem ? '#9a9aaa' : tcol)).setOrigin(0, 0.5), w - 20));
      const z = scene.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        if (i === this.index) this.handle('confirm');
        else {
          this.index = i;
          this.draw();
        }
      });
      this.layer.add(z);
    });
    // The focused option's detail (or why it can't be picked).
    const cur = data.options[this.index];
    if (cur) {
      const ink = look === 'tera' || look === 'ink' ? '#16203a' : '#ffffff';
      add(fitLine(scene.add.text(look === 'ink' ? 52 : 30, H - 22, cur.problem ?? cur.detail, textStyle(13, cur.problem ? '#ff9090' : ink)), W - 80));
    }
    add(scene.add.text(W - 24, 14, 'Enter choose · Esc back', textStyle(12, look === 'tera' || look === 'ink' ? '#4a5a78' : '#e8f0ff')).setOrigin(1, 0));
  }
}
