// Run-end showcases (screens redesign, Group D): each look lays the run out like its mock-up (party
// presentation, stat tiles, buttons). The scene keeps every outcome and the full detail panels; the
// showcase is a layer over them, with a Details button to read the long text.
import Phaser from 'phaser';
import type { Species } from '../core/contentSchema';
import type { ScreenStyleId } from '../core/presentation/screenStyles';
import { RUNEND_SKINS, hex, paintBackdrop, type Skin } from './dSkins';
import { loadAssets } from './lazyAssets';
import { pokemonVisual, trainerVisual } from './sprites';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from './theme';

export interface ShowCtx {
  species: { sp: Species; level: number; shiny?: boolean }[];
  /** The trainer's sprite asset (the player's trainer art). */
  trainerSprite?: string;
  won: boolean;
  trainer: string;
  runNo: string;
  stats: [string, string][];
  buttons: string[];
  choose: (i: number) => void;
  details: () => void;
  calm: boolean;
}

type G = Phaser.GameObjects.Graphics;

/** Tints a sprite, or the sprite inside a loading placeholder. */
function tintAll(v: Phaser.GameObjects.GameObject, tint: number): void {
  if (v instanceof Phaser.GameObjects.Container) v.list.forEach((o) => tintAll(o, tint));
  else if ('setTint' in v) (v as Phaser.GameObjects.Sprite).setTint(tint);
}
const W = GAME_WIDTH;
const H = GAME_HEIGHT;

export function buildShowcase(scene: Phaser.Scene, style: ScreenStyleId<'runend'>, c: ShowCtx): Phaser.GameObjects.Container {
  const k: Skin = RUNEND_SKINS[style];
  const box = scene.add.container(0, 0).setDepth(500).setName('runend-showcase');
  paintBackdrop(scene, box, k, c.calm);
  const g = (): G => {
    const o = scene.add.graphics();
    box.add(o);
    return o;
  };
  const txt = (x: number, y: number, s: string, size: number, color: string, o: Phaser.Types.GameObjects.Text.TextStyle = {}, origin: [number, number] = [0.5, 0.5]) => {
    const t = scene.add.text(x, y, s, textStyle(size, color, o)).setOrigin(origin[0], origin[1]);
    box.add(t);
    return t;
  };
  const plate = (x: number, y: number, w: number, h: number, fill: number, alpha: number, rim: number, r = 14) => g().fillStyle(fill, alpha).fillRoundedRect(x, y, w, h, r).lineStyle(2, rim, 0.9).strokeRoundedRect(x, y, w, h, r);
  /** Fits a sprite (or its loading placeholder) to a height, centred on x, y. */
  const fit = (v: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite | Phaser.GameObjects.Image, maxH: number): void => {
    const apply = (): void => {
      const target = v instanceof Phaser.GameObjects.Container ? ((v.list.find((o) => 'height' in o && (o as Phaser.GameObjects.Image).height > 0 && 'setScale' in o) as Phaser.GameObjects.Image | undefined) ?? null) : v;
      if (!target || !target.height) return;
      v.setScale(maxH / target.height);
      if (target !== v) target.setScale(1);
    };
    apply();
    v.once('art-ready', apply);
  };
  const mon = (i: number, x: number, y: number, s: number, tint?: number) => {
    const m = c.species[i];
    if (!m) return null;
    // The real front sprite (loaded lazily); `s` sets the size (about 30 px per unit).
    const v = pokemonVisual(scene, m.sp, 'front', x, y, 1, m.shiny) as Phaser.GameObjects.Sprite;
    fit(v, s * 30);
    if (tint !== undefined) {
      const paint = (): void => tintAll(v, tint);
      paint();
      v.once('art-ready', paint);
    }
    box.add(v);
    if (!c.calm) scene.tweens.add({ targets: v, y: y - 5, duration: 700 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 110 });
    return v;
  };
  /** A location picture (Pokemon Memories battleback) behind everything but the gradient. */
  const backdrop = (id: string, alpha: number): void => {
    const put = (): void => {
      if (!box.active) return;
      const img = scene.add.image(W / 2, H / 2, id).setDisplaySize(W, H).setAlpha(alpha);
      box.addAt(img, 1);
    };
    if (scene.textures.exists(id)) put();
    else void loadAssets(scene, [id]).then(put).catch(() => undefined);
  };
  const tiles = (x: number, y: number, w: number, cols: number, labelColor: string, valueColor: string, fill: number, alpha: number, rim: number, h = 54, gap = 8) => {
    const cw = (w - gap * (cols - 1)) / cols;
    c.stats.forEach(([label, value], i) => {
      const tx = x + (i % cols) * (cw + gap);
      const ty = y + Math.floor(i / cols) * (h + gap);
      plate(tx, ty, cw, h, fill, alpha, rim, 10);
      txt(tx + 10, ty + 8, label, 13, labelColor, {}, [0, 0]);
      txt(tx + 10, ty + 26, value, 22, valueColor, {}, [0, 0]);
    });
  };
  const buttons = (x: number, y: number, fill: number, rim: number, color: string, vertical = false) => {
    c.buttons.forEach((label, i) => {
      const bw = Math.max(130, label.length * 11 + 28);
      const bx = vertical ? x : x + c.buttons.slice(0, i).reduce((a, l) => a + Math.max(130, l.length * 11 + 28) + 10, 0);
      const by = vertical ? y + i * 44 : y;
      const b = plate(bx, by, bw, 34, fill, 0.95, rim, 17);
      const t = txt(bx + bw / 2, by + 17, label, 17, color);
      const z = scene.add.zone(bx, by, bw, 34).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerover', () => t.setScale(1.08));
      z.on('pointerout', () => t.setScale(1));
      z.on('pointerdown', () => c.choose(i));
      box.add(z);
      void b;
    });
    const dw = 110;
    const dx = vertical ? x : x + c.buttons.reduce((a, l) => a + Math.max(130, l.length * 11 + 28) + 10, 0);
    const dy = vertical ? y + c.buttons.length * 44 : y;
    plate(dx, dy, dw, 34, fill, 0.6, rim, 17);
    txt(dx + dw / 2, dy + 17, 'Details ▸', 15, color);
    const z = scene.add.zone(dx, dy, dw, 34).setOrigin(0).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => c.details());
    box.add(z);
  };
  const win = c.won;
  const line = `${c.trainer} · ${c.runNo}`;

  switch (style) {
    case 'aero': {
      txt(W / 2, 46, win ? 'HALL OF FAME' : 'RUN OVER', 44, '#ffffff', { stroke: '#2a78c8', strokeThickness: 6 });
      txt(W / 2, 92, `${line}${win ? ' · Champion!' : ''}`, 16, '#134a7a');
      c.species.forEach((m, i) => {
        const x = 40 + i * 150;
        plate(x, 112, 136, 196, 0xffffff, 0.45, 0xffffff, 18);
        mon(i, x + 68, 190, 3);
        txt(x + 68, 252, m.sp.name, 15, '#123a5a');
        txt(x + 68, 274, `Lv${m.level}`, 14, '#2a7aa8');
      });
      tiles(130, 332, 700, 3, '#2a8a6a', '#123a5a', 0xffffff, 0.55, 0xffffff, 54);
      buttons(130, 478, 0xffffff, 0x2a78c8, '#123a5a');
      break;
    }
    case 'classic': {
      txt(W / 2, 46, win ? 'Welcome to the Hall of Fame!' : 'Your run has ended', 40, '#ffd23a', { stroke: '#000000', strokeThickness: 6 });
      c.species.forEach((m, i) => mon(i, 130 + i * 140, 250 + (i % 2) * 20, 3.6, win ? undefined : 0x889099));
      plate(180, 380, 600, 44, 0xf0f0ff, 0.95, 0x6a6aa8, 6);
      txt(W / 2, 402, `${line} · ${c.stats[1]![0]} ${c.stats[1]![1]}`, 18, '#202040');
      buttons(250, 460, 0x182050, 0xf0e8c0, '#f0e8c0');
      break;
    }
    case 'finale': {
      backdrop('pack.memories.eventbg.rocky_night', 0.55);
      g().fillStyle(0xffffff, 1).fillRect(40, 36, 520, 64).lineStyle(4, 0xe83a3a, 1).strokeRect(40, 36, 520, 64);
      txt(54, 44, win ? 'FINAL EPISODE' : 'FINAL EPISODE', 12, '#c01a1a', {}, [0, 0]);
      txt(54, 62, win ? `${c.trainer}'s Journey Is Complete!` : `${c.trainer}'s Journey Ends Here...?`, 28, '#101010', {}, [0, 0]);
      c.species.forEach((m, i) => mon(i, 120 + i * 100, 420, 3, 0x778088));
      plate(560, 124, 360, 190, 0x000000, 0.6, 0x555566, 8);
      tiles(572, 134, 336, 2, '#ffd23a', '#ffffff', 0x000000, 0, 0x000000, 50, 4);
      buttons(560, 340, 0xffd23a, 0xffd23a, '#101010', true);
      break;
    }
    case 'manga': {
      g().fillStyle(0xffffff, 1).fillRect(20, 20, 600, 500).lineStyle(6, 0x000000, 1).strokeRect(20, 20, 600, 500);
      const rays = g().lineStyle(2, 0x000000, 0.35);
      for (let a = 0; a < 40; a++) rays.lineBetween(320, 300, 320 + Math.cos((a / 40) * 6.283) * 600, 300 + Math.sin((a / 40) * 6.283) * 600).setDepth(0);
      g().fillStyle(0xffffff, 1).fillRect(34, 34, 130, 92);
      txt(98, 80, '完', 78, '#000000');
      if (c.trainerSprite) {
        const tv = trainerVisual(scene, c.trainerSprite, c.trainer, 320, 330, 1) as Phaser.GameObjects.Sprite;
        fit(tv, 400);
        box.add(tv);
        tintAll(tv, 0x9a9a9a);
      }
      c.species.forEach((m, i) => mon(i, 90 + i * 88, 470, 1.6, 0x606060));
      plate(640, 20, 300, 270, 0xffffff, 1, 0x000000, 2);
      txt(656, 30, 'THE END', 28, '#000000', {}, [0, 0]);
      txt(656, 64, `of ${c.runNo}`, 16, '#000000', {}, [0, 0]);
      tiles(652, 94, 276, 2, '#e83a3a', '#000000', 0xffffff, 0, 0xffffff, 54, 4);
      buttons(640, 330, 0x000000, 0x000000, '#ffffff', true);
      break;
    }
    case 'sunset': {
      backdrop('pack.memories.eventbg.field_eve', 0.9);
      g().fillStyle(0xffd890, 0.9).fillCircle(W / 2, 330, 80);
      plate(104, 36, 752, 68, 0x4a1a3a, 0.78, 0xc07a6a, 10);
      txt(W / 2, 58, `The sun sets on ${c.runNo}`, 24, '#fff0d8');
      txt(W / 2, 86, win ? 'Your team made it to the end. They will remember.' : 'Your team gave it everything. They will remember.', 14, '#ffd8b0');
      tiles(110, 152, 740, 3, '#ffc890', '#fff0d8', 0x4a1a3a, 0.7, 0xc07a6a, 50, 4);
      c.species.forEach((m, i) => mon(i, 130 + i * 140, 420, 3.4, 0x2a1a30));
      buttons(250, 480, 0x4a1a3a, 0xffc890, '#fff0d8');
      break;
    }
    case 'cards': {
      txt(40, 36, `${c.runNo} card collection`, 26, '#f8ecc0', {}, [0, 0]);
      txt(40, 68, 'Your team is saved as cards in the Album.', 14, '#cfd8c0', {}, [0, 0]);
      c.species.forEach((m, i) => {
        const x = 90 + i * 140;
        const y = 160 + Math.abs(i - 2.5) * 6;
        const card = g().fillStyle(0xf4f4f0, 1).fillRoundedRect(x - 56, y, 112, 150, 8).lineStyle(3, i === 0 ? 0xf0d060 : 0x9a9aa8, 1).strokeRoundedRect(x - 56, y, 112, 150, 8);
        card.setAngle((i - 2.5) * 3);
        txt(x - 48, y + 8, m.sp.name, 12, '#202030', {}, [0, 0]);
        mon(i, x, y + 82, 2.8);
        txt(x - 48, y + 128, `Lv${m.level}`, 12, '#202030', {}, [0, 0]);
      });
      plate(130, 340, 700, 118, 0xffffff, 0.92, 0xcccccc, 10);
      tiles(142, 350, 676, 3, '#c07a2a', '#202030', 0xf4f4f0, 0, 0xf4f4f0, 46, 4);
      buttons(250, 478, 0x143a28, 0xf0d060, '#f8ecc0');
      break;
    }
    case 'anime': {
      const cols = [0x3ab0f0, 0xf0d23a, 0xe83a5a, 0x3ad08a];
      const rg = g();
      for (let a = 0; a < 16; a++) {
        rg.fillStyle(cols[a % 4]!, 0.85).fillTriangle(W / 2, 360, W / 2 + Math.cos((a / 16) * 6.283) * 1200, 360 + Math.sin((a / 16) * 6.283) * 1200, W / 2 + Math.cos(((a + 1) / 16) * 6.283) * 1200, 360 + Math.sin(((a + 1) / 16) * 6.283) * 1200);
      }
      const t = txt(90, 44, win ? 'CHAMPION!!' : 'NEXT TIME!!', 48, '#ffffff', { stroke: '#101010', strokeThickness: 8 }, [0, 0]);
      t.setAngle(-4);
      txt(96, 114, line, 14, '#101010', { backgroundColor: '#ffffff' }, [0, 0]);
      c.species.forEach((m, i) => mon(i, 100 + i * 150, 330, 4));
      plate(150, 392, 660, 54, 0xffffff, 0.95, 0xe83a5a, 27);
      c.stats.forEach(([l, v], i) => {
        txt(180 + i * 108, 408, l, 11, '#e83a5a', {}, [0, 0]);
        txt(180 + i * 108, 424, v, 16, '#101010', {}, [0, 0]);
      });
      buttons(250, 470, 0xffffff, 0xe83a5a, '#101010');
      break;
    }
    case 'credits': {
      txt(W / 2, 56, 'POCKET RAIDERS', 26, '#ffffff');
      const rows: [string, string][] = [['Starring', c.trainer], ['Team', c.species.map((m) => m.sp.name).join(' · ')], ['Journey', c.runNo], ['Directed by', 'You']];
      rows.forEach(([a, b], i) => {
        txt(W / 2, 120 + i * 78, a, 15, '#f0d060');
        txt(W / 2, 148 + i * 78, b, 18, '#ffffff');
      });
      c.species.forEach((m, i) => mon(i, 90 + i * 156, 440, 3.2));
      buttons(330, 488, 0x12122a, 0x8890c0, '#e8ecff');
      break;
    }
    case 'wii': {
      txt(40, 36, 'Run Results', 28, '#5a6a80', {}, [0, 0]);
      txt(40, 70, `${line}${win ? ' · Champion' : ''}`, 14, '#7a8aa0', {}, [0, 0]);
      tiles(40, 110, 880, 3, '#7a8aa0', '#3a4a60', 0xffffff, 1, 0xd0dcec, 100, 14);
      c.species.forEach((m, i) => {
        plate(40 + i * 66, 420, 58, 58, 0xffffff, 1, 0xd0dcec, 14);
        mon(i, 69 + i * 66, 452, 1.6);
      });
      buttons(560, 430, 0xffffff, 0x5aa8e8, '#3a4a60');
      break;
    }
    case 'ink': {
      txt(40, 20, win ? 'VICTORY' : 'DEFEAT', 64, '#101010', {}, [0, 0]);
      txt(44, 102, win ? 'WIN' : 'DEFEAT', 13, '#c0282a', {}, [0, 0]);
      g().fillStyle(0x101010, 1).fillPoints([new Phaser.Geom.Point(280, 70), new Phaser.Geom.Point(900, 50), new Phaser.Geom.Point(880, 360), new Phaser.Geom.Point(290, 330)], true);
      c.species.forEach((m, i) => mon(i, 340 + i * 90, 260 - (i % 2) * 30, 3.6, 0xffffff));
      g().lineStyle(2, 0x101010, 1).lineBetween(280, 420, 900, 420);
      c.stats.forEach(([l, v], i) => {
        txt(290 + (i % 3) * 210, 372 + Math.floor(i / 3) * 56, l, 12, '#c0282a', {}, [0, 0]);
        txt(290 + (i % 3) * 210, 388 + Math.floor(i / 3) * 56, v, 22, '#101010', {}, [0, 0]);
      });
      buttons(40, 470, 0x101010, 0xc0282a, '#f4ecdc');
      break;
    }
    case 'mvp': {
      const lead = c.species[0];
      g().fillStyle(0xffffff, 0.75).fillCircle(W / 2, 170, 124).lineStyle(6, 0xff8ac0, 1).strokeCircle(W / 2, 170, 124);
      mon(0, W / 2, 170, 6.4);
      txt(W / 2, 318, `MVP: ${lead?.sp.name ?? c.trainer} ♥`, 24, '#c0407a');
      plate(150, 346, 660, 90, 0xffffff, 0.9, 0xff8ac0, 14);
      c.stats.forEach(([l, v], i) => {
        txt(180 + (i % 3) * 215, 356 + Math.floor(i / 3) * 40, l, 12, '#c0407a', {}, [0, 0]);
        txt(180 + (i % 3) * 215, 370 + Math.floor(i / 3) * 40, v, 18, '#3a1a4a', {}, [0, 0]);
      });
      buttons(250, 462, 0xffffff, 0xff8ac0, '#3a1a4a');
      break;
    }
  }
  void hex;
  return box;
}
