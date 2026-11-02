// On-screen controls for Hub Town on phones and tablets: a four-way pad on the left (hold to walk), and on the right
// A (talk or enter), Map (the minimap) and Menu (the Esc menu). Shown on touch screens, or with `?touch=1` in the
// address (for testing on a desktop). Hidden while a page is open. Presentation only.

import Phaser from 'phaser';
import type { Facing } from '../../core/hubTown/schema';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import type { HubTownView } from './townView';

const DEPTH = 800_100;
const ARROW: Record<Facing, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };

/** True on a touch screen, or when the address asks for the touch controls. */
export function wantsTouchPad(scene: Phaser.Scene): boolean {
  const asked = typeof location !== 'undefined' && new URLSearchParams(location.search).get('touch') === '1';
  return asked || scene.sys.game.device.input.touch;
}

export class HubTouchPad {
  readonly root: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly town: HubTownView,
    private readonly opts: { busy(): boolean; menu(): void; map(): void },
  ) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setName('hubtown-touchpad');
    // The pad: three buttons wide, centred low on the left, clear of the help line.
    const cx = 96;
    const cy = GAME_HEIGHT - 132;
    const step = 58;
    const at: Record<Facing, [number, number]> = { up: [cx, cy - step], down: [cx, cy + step], left: [cx - step, cy], right: [cx + step, cy] };
    for (const dir of ['up', 'down', 'left', 'right'] as Facing[]) {
      const [x, y] = at[dir];
      const b = this.button(x, y, 26, ARROW[dir], 20);
      b.setName(`hubtown-touch-${dir}`);
      const hold = (): void => {
        if (this.opts.busy()) return;
        this.town.touchDir = dir;
        b.setAlpha(1);
      };
      const release = (): void => {
        if (this.town.touchDir === dir) this.town.touchDir = null;
        b.setAlpha(0.8);
      };
      b.on('pointerdown', hold).on('pointerover', (p: Phaser.Input.Pointer) => p.isDown && hold()).on('pointerup', release).on('pointerout', release);
    }
    // Actions on the right, above the minimap.
    const rx = GAME_WIDTH - 70;
    const a = this.button(rx, GAME_HEIGHT - 196, 32, 'A', 24).setName('hubtown-touch-a');
    a.on('pointerdown', () => !this.opts.busy() && this.town.interact());
    const map = this.button(rx - 78, GAME_HEIGHT - 168, 22, 'Map', 13).setName('hubtown-touch-map');
    map.on('pointerdown', () => !this.opts.busy() && this.opts.map());
    const menu = this.button(rx - 78, GAME_HEIGHT - 226, 22, 'Menu', 13).setName('hubtown-touch-menu');
    menu.on('pointerdown', () => !this.opts.busy() && this.opts.menu());
    scene.input.addPointer(1);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this));
  }

  /** A round glassy button with a label; returns the interactive circle. */
  private button(x: number, y: number, r: number, label: string, size: number): Phaser.GameObjects.Arc {
    const c = this.scene.add.circle(x, y, r, 0x10203a, 0.55).setStrokeStyle(2, 0xffffff, 0.85).setAlpha(0.8).setInteractive({ useHandCursor: true });
    this.root.add([c, this.scene.add.text(x, y, label, textStyle(size, '#ffffff')).setOrigin(0.5)]);
    return c;
  }

  private update(): void {
    const busy = this.opts.busy();
    this.root.setVisible(!busy);
    if (busy) this.town.touchDir = null;
  }
}
