// Version Select (Phantom UI only): pick one of the five Phantom versions from five tall cards. Reached with V on the
// title page and from Settings > Display > Phantom version. It only changes the `phantomVersion` setting: rules,
// saves and Pokémon are the same in every version. With another UI style on, the scene goes straight back.

import Phaser from 'phaser';
import { PHANTOM_VERSION_IDS } from '../core/presentation/phantom';
import { services } from '../game/services';
import { onInputAction } from '../ui/input';
import { mountRedux, phantomOn } from '../ui/redux/stage';
import { phVersion } from '../ui/phantom/screens/version';

export interface VersionSelectData { from?: string; fromData?: object }

export class VersionSelectScene extends Phaser.Scene {
  private index = 0;
  private from = 'MainMenu';
  private fromData: object | undefined;

  constructor() {
    super('VersionSelect');
  }

  init(data?: VersionSelectData): void {
    this.from = data?.from ?? 'MainMenu';
    this.fromData = data?.fromData;
  }

  create(): void {
    const { session } = services();
    if (!phantomOn()) return void this.leave();
    this.index = Math.max(0, PHANTOM_VERSION_IDS.indexOf(session.settings.phantomVersion));
    const n = PHANTOM_VERSION_IDS.length;
    const view = mountRedux(this, {
      // Until the Phantom look has loaded there is nothing to draw; the stage redraws when it has.
      render: (c) => (c.ph ? phVersion(c.ph, { on: this.index, now: session.settings.phantomVersion }) : ''),
      acts: {
        pick: (i) => (Number(i) === this.index ? this.play() : this.focus(Number(i))),
        play: (i) => { this.focus(Number(i)); this.play(); },
        back: () => this.leave(),
      },
      overs: { over: (i) => this.focus(Number(i)) },
    });
    this.focus = (i: number): void => {
      const next = ((i % n) + n) % n;
      if (next === this.index) return;
      this.index = next;
      view.refresh();
    };
    onInputAction(this, (a) => {
      if (a === 'left' || a === 'up') this.focus(this.index - 1);
      if (a === 'right' || a === 'down') this.focus(this.index + 1);
      if (a === 'confirm') this.play();
      if (a === 'back') this.leave();
    });
  }

  private focus: (i: number) => void = () => undefined;

  /** Takes the lit version (saved with the settings) and goes back. */
  private play(): void {
    const { session } = services();
    const id = PHANTOM_VERSION_IDS[this.index]!;
    if (id !== session.settings.phantomVersion) session.saveSettings({ ...session.settings, phantomVersion: id });
    this.leave();
  }

  private leave(): void {
    this.scene.start(this.from, this.fromData);
  }
}
