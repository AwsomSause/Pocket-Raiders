// The ending credits after a won run. Enter, Esc or a click leaves; the roll
// is only decoration, so Reduced motion / Off shows it all at once.
// Look: the moving Aero sky (main.ts), a glass column behind the roll, the winning party
// hopping along the bottom, drifting gold motes, and "PWT Victor!" (bgm.credits)
// looping underneath.

import Phaser from 'phaser';
import { assetCreditLines, buildCredits } from '../core/credits';
import { services } from '../game/services';
import { onInputAction } from '../ui/input';
import { AERO, drawGlass, type MotionLevel } from '../ui/aero';
import { playMusic } from '../ui/audio';
import { partySpecies, preloadPokemon } from '../ui/lazyAssets';
import { pokemonIcon } from '../ui/sprites';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { mountRedux, reduxOn, type ReduxView } from '../ui/redux/stage';
import { creditsView, type CreditsRow } from '../ui/redux/screens/boot';
import { monFile } from '../ui/redux/game';

/** New UI: how fast the credits roll, in pixels a second (the same pace as the Old roll). */
const ROLL_SPEED = 1000 / 28;

export class CreditsScene extends Phaser.Scene {
  /** Settings > Asset credits: only the credits page (assetCredits.json), and leaving goes back to Settings. */
  private assets: { from: string } | null = null;
  /** New UI: the mock-up page, and how far its roll has come (pixels; null when the page stands still). */
  private rx: ReduxView | null = null;
  private rollY: number | null = null;
  /** Where the rolling column sits now (pixels down from the top), so a redraw puts it back in the same place. */
  private rollAt = 600;

  constructor() {
    super('Credits');
  }

  init(data?: { assets?: boolean; from?: string }): void {
    this.assets = data?.assets ? { from: data.from ?? 'MainMenu' } : null;
  }

  preload(): void {
    preloadPokemon(this, partySpecies(), { icon: true });
  }

  create(): void {
    const { session } = services();
    const run = session.run;
    const motion = session.settings.battleAnimations as MotionLevel;
    playMusic(this, 'bgm.credits');
    this.rx = null;
    this.rollY = null;
    if (reduxOn()) return this.createRx();
    drawGlass(this, 60, -20, GAME_WIDTH - 120, GAME_HEIGHT + 40, { tint: AERO.glassLow, alpha: 0.22, glow: false, radius: 30 });
    if (!this.assets) this.parade(motion);
    if (motion === 'full') this.motes();
    const lines = this.assets ? [{ kind: 'title' as const, text: 'Asset credits' }, ...assetCreditLines(session.content)] : run ? buildCredits(session.content, run) : [];
    const roll = !this.assets && session.settings.battleAnimations === 'full';
    const style: Record<string, [number, string]> = { title: [40, '#f0d060'], heading: [26, '#7ff3ff'], text: [20, '#ffffff'], gap: [20, '#ffffff'] };
    let y = roll ? GAME_HEIGHT + 20 : 24;
    const step = roll ? 34 : 17;
    const items: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
    for (const l of lines) {
      if (l.kind === 'mons') {
        const ids = l.species ?? [];
        ids.forEach((id, i) => {
          const sp = session.content.species.get(id);
          if (sp) items.push(pokemonIcon(this, sp, GAME_WIDTH / 2 + (i - (ids.length - 1) / 2) * 56, y + 20, 1) as Phaser.GameObjects.Image);
        });
        y += 48;
        continue;
      }
      if (l.kind !== 'gap') {
        const [size, color] = style[l.kind]!;
        items.push(this.add.text(GAME_WIDTH / 2, y, l.text, textStyle(roll ? size : Math.min(size, 15), color, { align: 'center', wordWrap: { width: GAME_WIDTH - 80 } })).setOrigin(0.5, 0));
      }
      y += l.kind === 'gap' ? step : step + (l.kind === 'title' ? 14 : 0);
    }
    if (roll) {
      const last = items[items.length - 1];
      const distance = y + 40;
      this.tweens.add({ targets: items, y: `-=${distance}`, duration: distance * 28, ease: 'Linear', onComplete: () => last && this.leave() });
    }
    this.add.text(GAME_WIDTH - 12, GAME_HEIGHT - 8, 'Enter: skip', textStyle(14, '#a8c8e8')).setOrigin(1, 1).setDepth(10);
    let ready = false;
    this.time.delayedCall(400, () => (ready = true));
    onInputAction(this, (a) => {
      if (ready && (a === 'confirm' || a === 'back')) this.leave();
    });
    this.input.on('pointerdown', () => ready && this.leave());
  }

  /**
   * New UI: the mock-ups' credits page. The same lines as the Old roll, laid out as the mock-up's column over the
   * mountain backdrop, with the winning party along the bottom. With full animations the column rolls up the screen
   * and the page leaves when the last line has passed; otherwise it stands still and Up / Down (or a drag) scroll it.
   */
  private createRx(): void {
    const { session } = services();
    const run = session.run;
    const lines = this.assets ? [{ kind: 'title' as const, text: 'Asset credits' }, ...assetCreditLines(session.content)] : run ? buildCredits(session.content, run) : [];
    const rows: CreditsRow[] = lines.map((l) => (l.kind === 'mons' ? { kind: 'mons', text: '', mons: (l.species ?? []).map((id) => monFile(this, id, 'front')).filter((f): f is string => !!f) } : { kind: l.kind, text: l.text }));
    const party = this.assets || !run ? [] : run.party.map((m) => monFile(this, m.speciesId, 'front', !!m.shiny)).filter((f): f is string => !!f);
    const me = run ? run.story.v2?.protagonist?.name || session.content.archetypes.get(run.archetypeId)?.name || '' : '';
    const roll = !this.assets && session.settings.battleAnimations === 'full';
    let ready = false;
    this.time.delayedCall(400, () => (ready = true));
    const leave = (): void => { if (ready) this.leave(); };
    this.rx = mountRedux(this, {
      render: (c) => creditsView(c, { lead: !this.assets && me ? `A run by ${me}` : '', rows, party, art: 'arenas/mountain_bg.png', roll: roll ? this.rollAt : null }),
      acts: { next: leave },
    });
    this.rollY = roll ? 0 : null;
    this.rollAt = 600;
    onInputAction(this, (a) => {
      if (a === 'confirm' || a === 'back') return leave();
      const box = this.rx?.el.querySelector<HTMLElement>('.rx-credits');
      if (box && this.rollY === null && (a === 'up' || a === 'down')) box.scrollTop += a === 'up' ? -90 : 90;
    });
  }

  override update(_time: number, delta: number): void {
    if (this.rollY === null || !this.rx) return;
    // The page may be redrawn (a picture finished loading), so the column is found again each frame.
    const box = this.rx.el.querySelector<HTMLElement>('.rx-credits');
    const col = box?.querySelector<HTMLElement>('.rx-roll');
    if (!box || !col) return;
    this.rollY += (delta / 1000) * ROLL_SPEED;
    this.rollAt = Math.round(box.clientHeight - this.rollY);
    col.style.transform = `translateY(${this.rollAt}px)`;
    if (this.rollY > box.clientHeight + col.scrollHeight) {
      this.rollY = null;
      this.leave();
    }
  }

  /** The winning party along the bottom, each hopping in turn. */
  private parade(motion: MotionLevel): void {
    const species = partySpecies();
    const gap = Math.min(110, (GAME_WIDTH - 200) / Math.max(1, species.length));
    species.forEach((sp, i) => {
      const x = GAME_WIDTH / 2 + (i - (species.length - 1) / 2) * gap;
      const icon = (pokemonIcon(this, sp, x, GAME_HEIGHT - 44, 1.6) as Phaser.GameObjects.Image).setDepth(5).setName('credits-party');
      if (motion === 'full') this.tweens.add({ targets: icon, y: GAME_HEIGHT - 60, duration: 300, yoyo: true, repeat: -1, repeatDelay: 600 + species.length * 120, delay: i * 180, ease: 'Quad.easeOut' });
    });
  }

  /** Gold motes rising slowly behind the roll (presentation only, no gameplay RNG). */
  private motes(): void {
    let n = 0;
    this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        n++;
        const mote = this.add.circle((n * 173) % GAME_WIDTH, GAME_HEIGHT + 8, 2 + (n % 3), n % 2 ? 0xf0d060 : 0xffffff, 0.8).setBlendMode('ADD');
        this.tweens.add({ targets: mote, y: -10, x: mote.x + ((n * 29) % 60) - 30, alpha: 0.1, duration: 5200 + (n % 4) * 600, onComplete: () => mote.destroy() });
      },
    });
  }

  private leave(): void {
    if (this.assets) {
      this.scene.start('Settings', { from: this.assets.from });
      return;
    }
    this.scene.start('GameOver', { afterCredits: true });
  }
}
