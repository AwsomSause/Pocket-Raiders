// Pokédex set browser (screens redesign group E): the species list drawn the way each picked look's
// mock-up shows it (aero encyclopedia, DS Pokédex, sticker album, Wii channel, ink scroll). The Hub keeps
// the data (tabs, what Enter opens); this draws the grid or list, the focused species' page beside it,
// and moves the focus.
import Phaser from 'phaser';
import type { Content } from '../core/contentSchema';
import { dexPage } from '../core/presentation/dexInfo';
import type { Profile } from '../core/state';
import { dexState } from '../core/presentation/dexInfo';
import { fitBlock, fitLine } from './fitText';
import { paintSkinBackdrop, SKINS, type MotionLevel } from './screenSkins';
import { pokemonIcon, pokemonVisual } from './sprites';
import { GAME_HEIGHT as H, GAME_WIDTH as W, textStyle } from './theme';

type Layout = 'gridLeft' | 'gridRight' | 'list';
const LOOKS: Record<string, { layout: Layout; title: string }> = {
  aero: { layout: 'gridLeft', title: 'Aero Encyclopedia' },
  wii: { layout: 'gridLeft', title: 'Dex Channel' },
  sticker: { layout: 'gridLeft', title: 'Sticker Album' },
  ds: { layout: 'gridRight', title: 'INFO   AREA   FORMS' },
  ink: { layout: 'list', title: '図鑑' },
};
export const hasDexLook = (id: string): boolean => id in LOOKS;

const COLS = 4;
const ROWS = 3;

export class DexBrowser {
  private readonly root: Phaser.GameObjects.Container;
  private layer: Phaser.GameObjects.Container;
  private index = 0;
  private closed = false;
  /** Marks the browser (tests tell it from a Picker). */
  readonly isBrowser = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly styleId: string,
    private readonly setName: string,
    private readonly ids: string[],
    private readonly content: Content,
    private readonly profile: Profile,
    private readonly tabLabel: string,
    private readonly motion: MotionLevel,
    private readonly cb: { onSelect(id: string): void; onTab(): void; onBack(): void },
  ) {
    this.root = scene.add.container(0, 0).setDepth(100);
    paintSkinBackdrop(scene, SKINS[`dex.${styleId}`]!, motion, this.root);
    this.layer = scene.add.container(0, 0);
    this.root.add(this.layer);
    this.draw();
  }

  handle(action: string): void {
    if (action === 'back') return this.cb.onBack();
    const n = this.ids.length;
    if (action === 'confirm') return n ? this.cb.onSelect(this.ids[this.index]!) : this.cb.onTab();
    if (n === 0) return;
    const list = LOOKS[this.styleId]!.layout === 'list';
    const step = list ? (action === 'up' ? -1 : action === 'down' ? 1 : 0) : action === 'left' ? -1 : action === 'right' ? 1 : action === 'up' ? -COLS : action === 'down' ? COLS : 0;
    if (!step) return;
    this.index = Math.min(Math.max(this.index + step, 0), n - 1);
    this.draw();
  }

  /** Tab key: cycle All / Seen / Owned / Mastered (the Hub rebuilds the list). */
  tab(): void {
    this.cb.onTab();
  }

  close(): void {
    this.closed = true;
    this.root.destroy();
  }

  private draw(): void {
    if (this.closed) return;
    this.layer.removeAll(true);
    const { scene, ids, content, profile } = this;
    const look = LOOKS[this.styleId]!;
    const skin = SKINS[`dex.${this.styleId}`]!;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => (this.layer.add(o), o);
    const lt = skin.light === true;
    const hi = lt ? '#12385a' : '#ffffff';
    const lo = lt ? '#3a5a78' : '#d8ecff';
    const hd = add(scene.add.graphics());
    hd.fillStyle(skin.head, 0.95).fillRoundedRect(24, 14, W - 48, 48, 14).lineStyle(2, skin.accent, 1).strokeRoundedRect(24, 14, W - 48, 48, 14);
    add(fitLine(scene.add.text(40, 38, `${this.setName}  ·  ${look.title}`, textStyle(22, hi)).setOrigin(0, 0.5), 560));
    const tab = add(scene.add.text(W - 40, 38, `Tab: ${this.tabLabel}  ·  Enter page  ·  Esc back`, textStyle(14, lo)).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));
    tab.on('pointerdown', () => this.cb.onTab());
    if (ids.length === 0) {
      add(scene.add.text(W / 2, H / 2, 'Nothing on this tab yet. Press Tab to switch.', textStyle(22, hi)).setOrigin(0.5));
      return;
    }
    const per = look.layout === 'list' ? 9 : COLS * ROWS;
    const first = Math.floor(this.index / per) * per;
    const visible = ids.slice(first, first + per);
    const cur = ids[this.index]!;
    const page = dexPage(content, profile, cur);
    const sp = content.species.get(cur)!;

    // The focused species' page.
    const dx = look.layout === 'gridLeft' ? 470 : look.layout === 'gridRight' ? 36 : 40;
    const dw = look.layout === 'list' ? 380 : 454;
    const card = add(scene.add.graphics());
    if (look.layout !== 'list') {
      const sticker = this.styleId === 'sticker';
      const light = this.styleId === 'wii';
      card.fillStyle(light ? 0xf4f8fc : sticker ? 0xfff4fa : 0xeaf6ff, 0.94).fillRoundedRect(dx, 78, dw, 380, sticker ? 20 : 16);
      if (sticker) card.lineStyle(3, 0xff7ab8, 1).strokeRoundedRect(dx + 4, 82, dw - 8, 372, 18);
      else card.lineStyle(3, skin.rowRim, 1).strokeRoundedRect(dx, 78, dw, 380, 16);
    }
    const ink = look.layout === 'list' ? '#2a2018' : '#22344a';
    const showSprite = page.state !== 'unknown';
    const sx = look.layout === 'list' ? 230 : dx + dw / 2;
    const sy = look.layout === 'list' ? 330 : 240;
    if (showSprite) {
      const v = pokemonVisual(scene, sp, 'front', sx, sy, 3, false) as unknown as Phaser.GameObjects.Sprite;
      if (look.layout === 'list') (v as unknown as { setTint?: (c: number) => void }).setTint?.(0x4a4a4a);
      add(v);
      if (this.motion === 'full') scene.tweens.add({ targets: v, y: sy - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else add(scene.add.text(sx, sy, '?', textStyle(90, ink)).setOrigin(0.5));
    const tx = look.layout === 'list' ? 40 : dx + 20;
    const ty = look.layout === 'list' ? 100 : 360;
    add(fitLine(scene.add.text(tx, ty, page.title, textStyle(22, ink)), dw - 30));
    add(fitLine(scene.add.text(tx, ty + 28, page.types, textStyle(16, look.layout === 'list' ? '#8a6a40' : '#4a6a8a')), dw - 30));
    if (look.layout !== 'list') add(fitBlock(scene.add.text(tx, ty + 52, `${page.note}\n${page.research ? `${page.research}\n` : ""}${page.stats.slice(0, 3).join("  ")}`, textStyle(14, '#33475e', { wordWrap: { width: dw - 40 } })), dw - 40, 64));

    // The grid or list.
    if (look.layout === 'list') {
      visible.forEach((id, k) => {
        const y = 90 + k * 44;
        const on = first + k === this.index;
        const s = content.species.get(id)!;
        const st = dexState(profile, id);
        const g = add(scene.add.graphics());
        g.lineStyle(2, 0x2a2018, 0.9).lineBetween(450, y + 40, W - 40, y + 40);
        if (on) g.fillStyle(0xb02a2a, 1).fillRect(442, y + 2, 5, 36);
        add(scene.add.text(460, y + 10, `${String(s.dex).padStart(4, '0')}  ${st === 'unknown' ? '-----' : s.name}`, textStyle(17, on ? '#a02a20' : ink)));
        add(scene.add.text(W - 44, y + 10, st === 'caught' ? 'Owned' : st === 'seen' ? 'Seen' : '?', textStyle(14, '#c85a4a')).setOrigin(1, 0));
        const z = scene.add.zone(442, y, W - 480, 40).setOrigin(0).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => (first + k === this.index ? this.cb.onSelect(id) : ((this.index = first + k), this.draw())));
        this.layer.add(z);
      });
      return;
    }
    const gx = look.layout === 'gridLeft' ? 36 : 500;
    visible.forEach((id, k) => {
      const col = k % COLS;
      const row = Math.floor(k / COLS);
      const x = gx + col * 108 + 54;
      const y = 124 + row * 114;
      const on = first + k === this.index;
      const s = content.species.get(id)!;
      const st = dexState(profile, id);
      const g = scene.add.graphics();
      const sticker = this.styleId === 'sticker';
      const wii = this.styleId === 'wii';
      const tilt = sticker ? (k % 2 ? 4 : -5) : 0;
      const box = scene.add.container(x, y).setAngle(tilt);
      box.add(g);
      if (sticker) g.fillStyle(0xffffff, 1).fillCircle(0, 0, 46).lineStyle(on ? 4 : 2, on ? 0xff7ab8 : 0xffd0e8, 1).strokeCircle(0, 0, 46);
      else g.fillStyle(wii ? 0xffffff : 0xf2faff, 0.95).fillRoundedRect(-48, -48, 96, 96, this.styleId === 'ds' ? 6 : 16).lineStyle(on ? 4 : 2, on ? 0xff9a2a : skin.rowRim, 1).strokeRoundedRect(-48, -48, 96, 96, this.styleId === 'ds' ? 6 : 16);
      if (st === 'unknown') {
        const sil = pokemonIcon(scene, s, 0, -4, 2) as Phaser.GameObjects.GameObject & { setTintFill?: (c: number) => void };
        sil.setTintFill?.(0x3a4254);
        box.add(sil);
      } else box.add(pokemonIcon(scene, s, 0, -4, 2));
      box.add(scene.add.text(0, 34, st === 'unknown' ? '???' : s.name, textStyle(11, '#22344a')).setOrigin(0.5));
      if (st === 'caught') box.add(scene.add.text(-40, -42, '●', textStyle(12, '#e03a3a')));
      this.layer.add(box);
      if (on && this.motion === 'full') scene.tweens.add({ targets: box, y: y - 5, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const z = scene.add.zone(x - 48, y - 48, 96, 96).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => (first + k === this.index ? this.cb.onSelect(id) : ((this.index = first + k), this.draw())));
      this.layer.add(z);
    });
  }
}
