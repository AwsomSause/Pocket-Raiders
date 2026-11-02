// Legacy gallery layouts (screens redesign group E, Kice's picks): the run list drawn the way each
// mock-up shows it: museum frames, sunset polaroids, manga panels, timeline nodes, binder cards, a
// "previously on" trio, a bond bloom, an aero shelf, an ink list, a Wii photo channel, a hall of legends.
// The scene keeps the data and what Enter does; this only draws the runs and moves the focus.
import Phaser from 'phaser';
import type { Species } from '../core/contentSchema';
import { SKINS, paintSkinBackdrop, type MotionLevel } from './screenSkins';
import { pokemonIcon } from './sprites';
import { GAME_HEIGHT as H, GAME_WIDTH as W, textStyle } from './theme';
import { fitLine } from './fitText';

export interface GalleryItem {
  title: string;
  sub: string;
  species?: Species;
  memorable: boolean;
}

type Layout = 'row' | 'grid' | 'panels' | 'nodes' | 'trio' | 'bloom' | 'list' | 'duo';
type CardKind = 'frame' | 'polaroid' | 'card' | 'glass' | 'panel' | 'node' | 'photo' | 'plain' | 'bubble' | 'legend';
interface Look { layout: Layout; card: CardKind; page: number; heading: string; kicker: string; tilt?: boolean }

const LOOKS: Record<string, Look> = {
  museum: { layout: 'row', card: 'frame', page: 5, heading: 'Legacy Gallery', kicker: 'Museum Gallery' },
  polaroids: { layout: 'row', card: 'polaroid', page: 5, heading: 'Legacy Gallery', kicker: 'Photos from your runs', tilt: true },
  manga: { layout: 'panels', card: 'panel', page: 4, heading: 'LEGACY', kicker: 'Manga Volumes' },
  timeline: { layout: 'nodes', card: 'node', page: 5, heading: '// TIMELINE ARCHIVE', kicker: 'every run is a branch' },
  cards: { layout: 'row', card: 'card', page: 5, heading: 'Legacy binder', kicker: 'Every run becomes a card' },
  previously: { layout: 'trio', card: 'photo', page: 3, heading: 'Previously on Pocket Raiders...', kicker: 'RECAP' },
  bloom: { layout: 'bloom', card: 'bubble', page: 7, heading: 'Bond Memory Bloom', kicker: 'saved forever' },
  aero: { layout: 'row', card: 'glass', page: 5, heading: 'Legacy Gallery', kicker: 'your runs and champions' },
  ink: { layout: 'list', card: 'plain', page: 5, heading: '伝説', kicker: 'LEGACY' },
  wii: { layout: 'grid', card: 'glass', page: 10, heading: 'Photo Channel', kicker: 'Memories' },
  hall: { layout: 'duo', card: 'legend', page: 2, heading: 'HALL OF LEGENDS', kicker: 'Champions' },
};

export const hasGalleryLook = (id: string): boolean => id in LOOKS;

export class LegacyGallery {
  private readonly root: Phaser.GameObjects.Container;
  private index: number;
  private layer: Phaser.GameObjects.Container;
  private readonly look: Look;
  private closed = false;
  /** Marks the gallery layout (tests tell it from a Picker). */
  readonly isGallery = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly styleId: string,
    private readonly items: GalleryItem[],
    private readonly motion: MotionLevel,
    private readonly cb: { onSelect(i: number): void; onBack(): void },
    start = 0,
  ) {
    this.look = LOOKS[styleId]!;
    this.index = Math.min(Math.max(start, 0), Math.max(items.length - 1, 0));
    this.root = scene.add.container(0, 0).setDepth(100);
    paintSkinBackdrop(scene, SKINS[`legacy.${styleId}`]!, motion, this.root);
    this.layer = scene.add.container(0, 0);
    this.root.add(this.layer);
    this.draw();
  }

  handle(action: string): void {
    const n = this.items.length;
    const cols = this.look.layout === 'grid' ? 5 : this.look.layout === 'panels' ? 2 : 1;
    if (action === 'back') return this.cb.onBack();
    if (n === 0) return;
    if (action === 'confirm') return this.cb.onSelect(this.index);
    const step = action === 'left' || action === 'up' && cols === 1 ? -1 : action === 'right' || action === 'down' && cols === 1 ? 1 : action === 'up' ? -cols : action === 'down' ? cols : 0;
    if (!step) return;
    this.index = Math.min(Math.max(this.index + step, 0), n - 1);
    this.draw();
  }

  close(): void {
    this.closed = true;
    this.root.destroy();
  }

  private draw(): void {
    if (this.closed) return;
    this.layer.removeAll(true);
    const { scene, look, items } = this;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => (this.layer.add(o), o);
    const skin = SKINS[`legacy.${this.styleId}`]!;
    const lt = skin.light === true;
    const ink = lt ? '#2a3448' : '#ffffff';
    // Heading and back hint
    const headStyle = textStyle(look.layout === 'duo' ? 38 : look.layout === 'list' ? 72 : 28, look.layout === 'nodes' ? '#5fd0ff' : look.layout === 'duo' ? '#fff6c0' : lt ? '#12385a' : '#ffffff', look.layout === 'duo' ? { stroke: '#7a2a10', strokeThickness: 6 } : {});
    const head = add(scene.add.text(look.layout === 'list' ? 50 : 36, look.layout === 'list' ? 50 : 22, look.heading, headStyle));
    if (look.layout === 'duo') head.setAngle(-3).setPosition(70, 36);
    if (look.layout === 'list') head.setColor('#1a1410');
    add(scene.add.text(look.layout === 'list' ? 56 : look.layout === 'duo' ? 500 : 36, look.layout === 'list' ? 150 : look.layout === 'duo' ? 64 : 56, `${look.kicker}  ·  ${items.length} run${items.length === 1 ? '' : 's'}`, textStyle(14, this.styleId === 'ink' ? '#a02a20' : lt ? '#3a5a78' : '#d8ecff')));
    add(scene.add.text(W - 24, 18, 'Enter open  ·  Esc back', textStyle(14, lt ? '#4a5a78' : '#cfe4f4')).setOrigin(1, 0));
    if (items.length === 0) {
      add(scene.add.text(W / 2, H / 2, 'Finish a run to see its Trainer here', textStyle(24, ink)).setOrigin(0.5));
      return;
    }
    const first = look.layout === 'bloom' ? 0 : Math.floor(this.index / look.page) * look.page;
    const visible = items.slice(first, first + look.page);
    const rect = (k: number): { x: number; y: number; w: number; h: number; a: number } => {
      switch (look.layout) {
        case 'row': return { x: 36 + k * 180, y: 120 + (k % 2 && look.tilt ? 18 : 0), w: 164, h: look.card === 'polaroid' ? 200 : 190, a: look.tilt ? (k % 2 ? 4 : -5) : 0 };
        case 'grid': return { x: 36 + (k % 5) * 180, y: 96 + Math.floor(k / 5) * 190, w: 164, h: 176, a: 0 };
        case 'panels': return { x: 40 + (k % 2) * 440, y: 88 + Math.floor(k / 2) * 190, w: 420, h: 176, a: 0 };
        case 'nodes': return { x: 70 + k * 170, y: k % 2 ? 220 : 150, w: 120, h: 120, a: 0 };
        case 'trio': return { x: 40 + k * 300, y: 130, w: 270, h: 250, a: 0 };
        case 'duo': return { x: 70 + k * 420, y: 120, w: 360, h: 300, a: k ? 3 : -3 };
        default: return { x: 0, y: 0, w: 0, h: 0, a: 0 };
      }
    };
    const sprite = (it: GalleryItem, x: number, y: number, scale: number): void => {
      if (!it.species) return;
      try { add(pokemonIcon(scene, it.species, x, y, scale)); } catch { /* the icon is not loaded: the card stays blank */ }
    };
    const label = (it: GalleryItem, x: number, y: number, w: number, color: string, size = 13): void => {
      add(fitLine(scene.add.text(x, y, `${it.memorable ? '★ ' : ''}${it.title}`, textStyle(size, color)), w));
    };

    if (look.layout === 'bloom') {
      const it = items[this.index]!;
      const g = add(scene.add.graphics());
      g.fillStyle(0xffffff, 0.95).fillCircle(W / 2, 220, 120).lineStyle(4, 0xff9cd0, 1).strokeCircle(W / 2, 220, 120);
      sprite(it, W / 2, 220, 5);
      add(fitLine(scene.add.text(W / 2, 360, `♥ ${it.title} ♥`, textStyle(22, '#a02a60')).setOrigin(0.5), 800));
      add(fitLine(scene.add.text(W / 2, 392, it.sub, textStyle(15, '#c04a80')).setOrigin(0.5), 800));
      visible.forEach((v, k) => {
        const x = W / 2 - ((visible.length - 1) * 56) / 2 + k * 56;
        const on = first + k === this.index;
        g.fillStyle(0xffffff, on ? 0.9 : 0.35).fillCircle(x, 460, on ? 24 : 18);
        if (on) g.lineStyle(3, 0xffd84a, 1).strokeCircle(x, 460, 24);
        sprite(v, x, 460, on ? 1.4 : 1);
      });
      return this.pointer(visible, first, (k) => ({ x: W / 2 - ((visible.length - 1) * 56) / 2 + k * 56 - 24, y: 436, w: 48, h: 48 }));
    }

    if (look.layout === 'list') {
      visible.forEach((it, k) => {
        const y = 100 + k * 78;
        const on = first + k === this.index;
        const g = add(scene.add.graphics());
        g.lineStyle(2, 0x2a2018, 1).lineBetween(330, y + 70, W - 50, y + 70);
        if (on) g.fillStyle(0xb02a2a, 1).fillRect(322, y + 4, 5, 62);
        sprite(it, 372, y + 38, 1.6);
        label(it, 420, y + 14, 480, '#1a1410', 16);
        add(fitLine(scene.add.text(420, y + 40, it.sub, textStyle(13, '#6a5a48')), 480));
      });
      return this.pointer(visible, first, (k) => ({ x: 322, y: 100 + k * 78, w: W - 372, h: 70 }));
    }

    visible.forEach((it, k) => {
      const r = rect(k);
      const on = first + k === this.index;
      const box = add(scene.add.container(r.x + r.w / 2, r.y + r.h / 2).setAngle(r.a));
      const g = scene.add.graphics();
      box.add(g);
      const hw = r.w / 2;
      const hh = r.h / 2;
      const rim = on ? 0xffd84a : skin.rowRim;
      switch (look.card) {
        case 'frame': g.fillStyle(0x6a4a2a, 1).fillRect(-hw, -hh, r.w, r.h - 40).fillStyle(0xe8dcc0, 1).fillRect(-hw + 8, -hh + 8, r.w - 16, r.h - 56).lineStyle(on ? 4 : 2, rim, 1).strokeRect(-hw, -hh, r.w, r.h - 40); break;
        case 'polaroid': g.fillStyle(0x000000, 0.25).fillRect(-hw + 3, -hh + 4, r.w, r.h).fillStyle(0xf8f4ea, 1).fillRect(-hw, -hh, r.w, r.h).fillStyle(0x6a8ab8, 1).fillRect(-hw + 8, -hh + 8, r.w - 16, r.h - 56).lineStyle(on ? 4 : 0, rim, 1).strokeRect(-hw, -hh, r.w, r.h); break;
        case 'card': g.fillStyle(0xdde6f4, 1).fillRoundedRect(-hw, -hh, r.w, r.h, 12).fillStyle(0x4a6aa8, 1).fillRoundedRect(-hw + 8, -hh + 8, r.w - 16, r.h - 70, 8).lineStyle(on ? 5 : 2, rim, 1).strokeRoundedRect(-hw, -hh, r.w, r.h, 12); break;
        case 'glass': g.fillStyle(0xf2faff, 0.9).fillRoundedRect(-hw, -hh, r.w, r.h, 18).fillStyle(0xbfe6ff, 0.5).fillRoundedRect(-hw + 4, 0, r.w - 8, hh - 4, 14).lineStyle(on ? 4 : 2, on ? 0x2a9aff : 0xffffff, 1).strokeRoundedRect(-hw, -hh, r.w, r.h, 18); break;
        case 'panel': g.fillStyle(0xe8e8e8, 1).fillRect(-hw, -hh, r.w, r.h).fillStyle(0x4a4a52, 1).fillRect(-hw + 6, -hh + 6, r.w - 12, r.h - 12).lineStyle(on ? 6 : 4, on ? 0xffd84a : 0x101010, 1).strokeRect(-hw, -hh, r.w, r.h); break;
        case 'node': g.fillStyle(0x0a1a2c, 1).fillRect(-hw, -hh, r.w, r.h).lineStyle(on ? 4 : 2, on ? 0xff5ad8 : 0x5fd0ff, 1).strokeRect(-hw, -hh, r.w, r.h); break;
        case 'photo': g.fillStyle(0xffffff, 1).fillRect(-hw, -hh, r.w, r.h).fillStyle(0x2a5a9a, 1).fillRect(-hw + 8, -hh + 8, r.w - 16, r.h - 56).lineStyle(on ? 6 : 3, on ? 0xffd84a : 0xe83030, 1).strokeRect(-hw, -hh, r.w, r.h); break;
        case 'legend': g.fillStyle(0xffffff, 1).fillRoundedRect(-hw, -hh, r.w, r.h, 18).lineStyle(on ? 8 : 5, on ? 0xffd84a : 0xe83030, 1).strokeRoundedRect(-hw, -hh, r.w, r.h, 18); break;
        default: break;
      }
      this.layer.remove(box);
      this.layer.add(box);
      const big = look.layout === 'duo' ? 5 : look.layout === 'trio' ? 4.5 : look.layout === 'panels' ? 3.4 : look.layout === 'nodes' ? 2.2 : 3;
      const ib = look.layout === 'panels' ? { x: hw - 90, y: 0 } : look.layout === 'nodes' ? { x: 0, y: 0 } : { x: 0, y: -hh + (r.h - 56) / 2 + 8 };
      if (it.species) try { box.add(pokemonIcon(scene, it.species, ib.x, ib.y, big)); } catch { /* not loaded */ }
      const txt = look.card === 'frame' || look.card === 'polaroid' || look.card === 'card' || look.card === 'photo' || look.card === 'glass' || look.card === 'legend';
      const tcol = look.card === 'frame' ? '#f0e8d0' : look.card === 'polaroid' || look.card === 'legend' || look.card === 'photo' ? '#2a2a3a' : look.card === 'glass' ? '#10304a' : '#f2f2f2';
      const ty = look.layout === 'panels' ? -hh + 12 : look.layout === 'nodes' ? hh + 6 : hh - (look.card === 'frame' ? 34 : 46);
      const t = scene.add.text(look.layout === 'panels' ? -hw + 14 : look.layout === 'nodes' ? 0 : -hw + 8, ty, `${it.memorable ? '★ ' : ''}${it.title}`, textStyle(look.layout === 'duo' ? 16 : 13, tcol));
      fitLine(t, r.w - 16);
      if (look.layout === 'nodes') t.setOrigin(0.5, 0);
      box.add(t);
      if (txt || look.layout === 'panels') {
        const s = scene.add.text(look.layout === 'panels' ? -hw + 14 : -hw + 8, ty + (look.layout === 'panels' ? 22 : 18), it.sub, textStyle(11, tcol));
        fitLine(s, look.layout === 'panels' ? 190 : r.w - 16);
        box.add(s);
      }
      if (on && this.motion === 'full') scene.tweens.add({ targets: box, y: box.y - 6, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (look.layout === 'nodes') {
        g.lineStyle(2, 0x5fd0ff, 0.6);
      }
      void label;
    });
    if (look.layout === 'nodes') {
      const g = add(scene.add.graphics());
      g.lineStyle(3, 0x5fd0ff, 0.7);
      visible.forEach((_, k) => {
        if (k === 0) return;
        const a = rect(k - 1);
        const b = rect(k);
        g.lineBetween(a.x + a.w, a.y + a.h / 2, b.x, b.y + b.h / 2);
      });
      this.layer.sendToBack(g);
    }
    // The focused run's line, in a strip along the bottom.
    const cur = items[this.index]!;
    const strip = add(scene.add.graphics());
    strip.fillStyle(skin.rowFill, 0.95).fillRoundedRect(36, H - 80, W - 72, 52, 12).lineStyle(2, skin.rowRim, 1).strokeRoundedRect(36, H - 80, W - 72, 52, 12);
    add(fitLine(scene.add.text(52, H - 72, `${cur.title}`, textStyle(17, ink)), W - 104));
    add(fitLine(scene.add.text(52, H - 50, cur.sub, textStyle(14, lt ? '#3a5a78' : '#d8ecff')), W - 104));
    this.pointer(visible, first, (k) => {
      const r = rect(k);
      return { x: r.x, y: r.y, w: r.w, h: r.h };
    });
  }

  /** Click or tap a run to focus it; click the focused one to open it. */
  private pointer(visible: GalleryItem[], first: number, at: (k: number) => { x: number; y: number; w: number; h: number }): void {
    visible.forEach((_, k) => {
      const r = at(k);
      const z = this.scene.add.zone(r.x, r.y, r.w, r.h).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => {
        if (first + k === this.index) this.cb.onSelect(this.index);
        else {
          this.index = first + k;
          this.draw();
        }
      });
      this.layer.add(z);
    });
  }
}
