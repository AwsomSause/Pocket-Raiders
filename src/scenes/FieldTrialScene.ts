// Story Overhaul Beat 9: the Field Trial, a scripted tutorial spar with the main rival (design O.4). The script, names and the rival's
// reaction come from core/story2/fieldTrial.ts; this screen only plays them. Nothing here rolls dice or changes the battle rules, and
// the Trial can't be lost: HP follows the script table. The player must pick the option the arrow points at to go on.

import Phaser from 'phaser';
import { trialView, type TrialMenu, type TrialStepView, type TrialView } from '../core/story2/fieldTrial';
import { services } from '../game/services';
import { onInputAction, type InputAction } from '../ui/input';
import { preloadPokemon } from '../ui/lazyAssets';
import { pokemonVisual, type Visual } from '../ui/sprites';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';

const MENU: { id: TrialMenu | 'run'; label: string }[] = [
  { id: 'fight', label: 'Fight' },
  { id: 'pokemon', label: 'Pokémon' },
  { id: 'bag', label: 'Bag' },
  { id: 'run', label: 'Run' },
];

interface Side { name: Phaser.GameObjects.Text; bar: Phaser.GameObjects.Rectangle; sprite: Visual | null; width: number }

export class FieldTrialScene extends Phaser.Scene {
  private view!: TrialView;
  private speaker!: Phaser.GameObjects.Text;
  private body!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private menuRows: Phaser.GameObjects.Text[] = [];
  private chart: Phaser.GameObjects.Text | null = null;
  private player!: Side;
  private foe!: Side;
  private wait: ((a: InputAction) => void) | null = null;
  private quick = false;

  constructor() {
    super('FieldTrial');
  }

  preload(): void {
    const { session } = services();
    const view = session.run ? trialView(session.content, session.run, false) : null;
    if (!view) return;
    const sp = (id: string) => session.content.species.get(id) ? [session.content.species.get(id)!] : [];
    preloadPokemon(this, [...sp(view.cast.starter), ...sp(view.cast.loaner)], { back: true });
    preloadPokemon(this, sp(view.cast.rival), { front: true });
  }

  create(): void {
    const { session } = services();
    this.quick = session.profile.story.prologue.mode === 'quick';
    const view = session.run ? trialView(session.content, session.run, this.quick) : null;
    if (!view) {
      this.scene.start('Map');
      return;
    }
    this.view = view;
    this.menuRows = [];
    this.chart = null;
    this.wait = null;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x5d9b4a).setOrigin(0);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.32, 0x9fd3f0).setOrigin(0);
    this.add.text(GAME_WIDTH / 2, 36, 'Field Trial', textStyle(28, '#ffd860')).setOrigin(0.5).setName('trial-title');
    this.add.ellipse(GAME_WIDTH * 0.72, GAME_HEIGHT * 0.36, 300, 70, 0x4a7f3b);
    this.add.ellipse(GAME_WIDTH * 0.28, GAME_HEIGHT * 0.6, 340, 80, 0x4a7f3b);
    this.foe = this.side(60, 80, view.cast.rival, 'front', GAME_WIDTH * 0.72, GAME_HEIGHT * 0.3);
    this.player = this.side(GAME_WIDTH - 470, GAME_HEIGHT - 320, view.cast.starter, 'back', GAME_WIDTH * 0.28, GAME_HEIGHT * 0.55);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 120, GAME_WIDTH - 60, 200, COLORS.panel, 0.96).setStrokeStyle(4, COLORS.border).setName('trial-box');
    this.speaker = this.add.text(60, GAME_HEIGHT - 205, '', textStyle(22, '#ffb745')).setName('trial-speaker');
    this.body = this.add.text(60, GAME_HEIGHT - 172, '', textStyle(22, COLORS.text, { wordWrap: { width: GAME_WIDTH - 420 } })).setName('trial-body');
    this.hint = this.add.text(GAME_WIDTH - 50, GAME_HEIGHT - 36, '', textStyle(16, '#a8a0b0')).setOrigin(1, 0.5);
    onInputAction(this, (a) => this.wait?.(a));
    this.input.on('pointerdown', () => this.wait?.('confirm'));
    this.cameras.main.fadeIn(session.settings.battleAnimations === 'full' ? 300 : 1);
    void this.play();
  }

  private side(x: number, y: number, speciesId: string, face: 'front' | 'back', sx: number, sy: number): Side {
    const { content } = services().session;
    const species = content.species.get(speciesId);
    this.add.rectangle(x, y, 400, 74, COLORS.panel, 0.92).setOrigin(0).setStrokeStyle(3, COLORS.border);
    const name = this.add.text(x + 16, y + 8, `${species?.name ?? speciesId}  Lv5`, textStyle(22, COLORS.text));
    this.add.rectangle(x + 16, y + 46, 360, 14, 0x303030).setOrigin(0, 0.5);
    const bar = this.add.rectangle(x + 16, y + 46, 360, 14, 0x4fd15a).setOrigin(0, 0.5);
    const sprite = species ? pokemonVisual(this, species, face, sx, sy, face === 'back' ? 3 : 2.5) : null;
    return { name, bar, sprite, width: 360 };
  }

  private setHp(side: Side, pct: number): void {
    const w = Math.max(0, (side.width * pct) / 100);
    side.bar.setFillStyle(pct > 50 ? 0x4fd15a : pct > 20 ? 0xf2c230 : 0xe04a3a);
    if (services().session.settings.battleAnimations === 'full') this.tweens.add({ targets: side.bar, width: w, duration: 350 });
    else side.bar.width = w;
  }

  private swap(speciesId: string): void {
    const species = services().session.content.species.get(speciesId);
    if (!species) return;
    const { x, y } = this.player.sprite ? (this.player.sprite as Phaser.GameObjects.Sprite) : { x: GAME_WIDTH * 0.28, y: GAME_HEIGHT * 0.55 };
    this.player.sprite?.destroy();
    this.player.sprite = pokemonVisual(this, species, 'back', x, y, 3);
    this.player.name.setText(`${species.name}  Lv5`);
  }

  /** Shows one line and waits for confirm. */
  private say(speaker: string | null, text: string): Promise<void> {
    this.speaker.setText(speaker ?? '');
    this.body.setText(text);
    this.hint.setText('Enter: next');
    return new Promise((resolve) => {
      this.wait = (a) => {
        if (a !== 'confirm') return;
        this.wait = null;
        resolve();
      };
    });
  }

  /** Shows the battle menu with the arrow on one option; only that option goes on. */
  private pickMenu(want: TrialMenu): Promise<void> {
    let at = MENU.findIndex((m) => m.id === want);
    const draw = (): void => {
      for (const r of this.menuRows) r.destroy();
      this.menuRows = MENU.map((m, i) => {
        const hinted = m.id === want;
        const label = `${i === at ? '▶ ' : '   '}${m.label}${hinted ? '  ←' : ''}`;
        return this.add.text(GAME_WIDTH - 330 + (i % 2) * 150, GAME_HEIGHT - 190 + Math.floor(i / 2) * 44, label, textStyle(22, hinted ? '#ffd860' : '#8a8494')).setName(`trial-menu-${m.id}`);
      });
    };
    this.speaker.setText('');
    this.body.setText(want === 'fight' ? 'What will you do? (Pick Fight.)' : want === 'pokemon' ? 'What will you do? (Pick Pokémon.)' : 'What will you do? (Pick Bag.)');
    this.hint.setText('Arrows: move · Enter: choose');
    draw();
    return new Promise((resolve) => {
      this.wait = (a) => {
        if (a === 'left' || a === 'right') at = (at % 2 === 0 ? at + 1 : at - 1);
        else if (a === 'up' || a === 'down') at = (at + 2) % 4;
        else if (a === 'confirm' && MENU[at]!.id === want) {
          this.wait = null;
          for (const r of this.menuRows) r.destroy();
          this.menuRows = [];
          resolve();
          return;
        } else if (a === 'confirm') this.body.setText('Not now. Follow the arrow this time.');
        draw();
      };
    });
  }

  private choose(text: string, options: { id: string; label: string }[]): Promise<string> {
    let at = 0;
    const rows: Phaser.GameObjects.Text[] = [];
    const draw = (): void => {
      rows.splice(0).forEach((r) => r.destroy());
      options.forEach((o, i) => rows.push(this.add.text(GAME_WIDTH - 330, GAME_HEIGHT - 200 + i * 40, `${i === at ? '▶ ' : '   '}${o.label}`, textStyle(22, i === at ? '#ffd860' : COLORS.text)).setName(`trial-choice-${o.id}`)));
    };
    this.speaker.setText('');
    this.body.setText(text);
    this.hint.setText('Up/Down · Enter: choose');
    draw();
    return new Promise((resolve) => {
      this.wait = (a) => {
        if (a === 'up' || a === 'down') {
          at = (at + (a === 'down' ? 1 : options.length - 1)) % options.length;
          draw();
        } else if (a === 'confirm') {
          this.wait = null;
          rows.forEach((r) => r.destroy());
          resolve(options[at]!.id);
        }
      };
    });
  }

  private async step(s: TrialStepView): Promise<void> {
    const linesFirst = s.teach === 'switch' || s.teach === 'items';
    if (!linesFirst && s.menu) await this.pickMenu(s.menu);
    if (s.teach === 'moves') this.chart = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, this.view.chart, textStyle(20, '#ffffff', { backgroundColor: '#1d1a2b', padding: { x: 14, y: 10 }, wordWrap: { width: 640 } })).setOrigin(0.5).setName('trial-chart');
    for (const l of s.lines) await this.say(l.speaker, l.text);
    this.chart?.destroy();
    this.chart = null;
    if (linesFirst && s.menu) await this.pickMenu(s.menu);
    const wasActive = this.activeNow;
    this.activeNow = s.active;
    if (s.active !== wasActive) this.swap(s.active === 'starter' ? this.view.cast.starter : this.view.cast.loaner);
    this.setHp(this.player, s.active === 'starter' ? s.playerHp : s.loanerHp);
    this.setHp(this.foe, s.rivalHp);
    if (s.teach === 'items') await this.say(null, this.view.used);
  }

  private activeNow: 'starter' | 'loaner' = 'starter';

  private async play(): Promise<void> {
    this.activeNow = 'starter';
    await this.say(null, this.view.intro);
    for (const s of this.view.steps) await this.step(s);
    for (const line of this.view.reaction.lines) await this.say(this.view.reaction.speaker, line);
    const dramatic = (await this.choose(this.view.ask.text, this.view.ask.options)) as 'full' | 'quiet' | 'off';
    for (const tip of this.view.tips) await this.say(null, tip);
    services().session.finishFieldTrial(dramatic);
    this.cameras.main.fadeOut(200);
    this.time.delayedCall(210, () => this.scene.start('Map'));
  }
}
