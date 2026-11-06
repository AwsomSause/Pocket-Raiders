// The ACTION tab above the move menu (DBK/Essentials style): a small dark tab
// with a gear/jewel icon and the word ACTION that turns red-orange while a
// special action (Tera, Z-Move, Dynamax) is switched on. Presentation only;
// the scene decides what clicking does. Shared by Tera, Z-Move and Dynamax.
import Phaser from 'phaser';

export interface ActionTab {
  container: Phaser.GameObjects.Container;
  destroy(): void;
}

export function actionTab(scene: Phaser.Scene, x: number, y: number, opts: { on: boolean; label?: string; icon?: { key: string; frame?: number }; onClick: () => void }): ActionTab {
  const w = 132;
  const h = 26;
  const g = scene.add.graphics();
  const fill = opts.on ? 0xe04a1c : 0x1c2030;
  const edge = opts.on ? 0xffb070 : 0x8a90a8;
  g.fillStyle(fill, 1).fillRoundedRect(0, 0, w, h, { tl: 10, tr: 10, bl: 0, br: 0 });
  g.lineStyle(2, edge, 1).strokeRoundedRect(0, 0, w, h, { tl: 10, tr: 10, bl: 0, br: 0 });
  const parts: Phaser.GameObjects.GameObject[] = [g];
  if (opts.icon && scene.textures.exists(opts.icon.key)) {
    const ic = scene.add.image(18, h / 2, opts.icon.key, opts.icon.frame).setScale(0.55);
    parts.push(ic);
  }
  parts.push(scene.add.text(34, h / 2, opts.label ?? 'ACTION', { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: opts.on ? '#ffffff' : '#c8ccdc' }).setOrigin(0, 0.5));
  const container = scene.add.container(x, y, parts).setDepth(60);
  container.setSize(w, h).setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
  container.input!.cursor = 'pointer';
  container.on('pointerdown', opts.onClick);
  return { container, destroy: () => container.destroy() };
}
