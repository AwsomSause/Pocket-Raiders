// The Legendary Blessing opening ("Side Plinth", Kice's pick): shown once after the starter is chosen, when the run has a blessing.
// Black screen, the blessing's item on a slim plinth to the left in a cone of light, the passage on the right a line at a time.
// Confirm finishes the sequence at once, a second confirm goes on to the briefing. Outcomes never depend on this screen:
// the blessing was rolled at run start. Respects the animation setting (off = everything shown at once).

import Phaser from 'phaser';
import { getBlessing } from '../core/blessings';
import { services } from '../game/services';
import { playCry } from '../ui/audio';
import { onInputAction } from '../ui/input';
import { loadAssets } from '../ui/lazyAssets';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';

const TIER_LABEL = { lesser: 'LESSER', greater: 'GREATER', divine: 'DIVINE', primordial: 'PRIMORDIAL', origin: 'ORIGIN' } as const;

export class BlessingScene extends Phaser.Scene {
  private shown: Phaser.GameObjects.GameObject[] = [];
  private finished = false;
  private leaving = false;
  private timers: Phaser.Time.TimerEvent[] = [];

  constructor() {
    super('Blessing');
  }

  create(): void {
    const { session } = services();
    const run = session.run!;
    const state = run.expansion?.blessing;
    const def = state ? getBlessing(state.id) : undefined;
    if (!state || !def) return void this.scene.start('Briefing');
    this.shown = [];
    this.finished = false;
    this.leaving = false;
    this.timers = [];
    const motion = session.settings.battleAnimations;
    const fast = motion !== 'full';
    this.cameras.main.setBackgroundColor(0x000000);

    // Light cone and a slim plinth on the left; the item floats above it.
    const px = 250;
    const cone = this.add.graphics().setAlpha(0);
    cone.fillStyle(0xfff2c0, 0.16);
    cone.fillTriangle(px, 40, px - 150, GAME_HEIGHT - 120, px + 150, GAME_HEIGHT - 120);
    this.add.rectangle(px, GAME_HEIGHT - 110, 120, 16, 0x2a2430).setStrokeStyle(2, 0x6a5f78);
    this.add.rectangle(px, GAME_HEIGHT - 70, 60, 64, 0x1d1824).setStrokeStyle(2, 0x4a4058);
    const itemImg = this.add.image(px, 250, '__DEFAULT').setAlpha(0).setVisible(false);
    void loadAssets(this, [def.item]).then(() => {
      if (!this.sys.isActive() || !this.textures.exists(def.item)) return;
      itemImg.setTexture(def.item).setScale(8).setVisible(true);
      if (!fast) this.tweens.add({ targets: itemImg, y: 238, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    const x = 470;
    const w = GAME_WIDTH - x - 40;
    const tier = this.add.text(x, 64, `${TIER_LABEL[state.tier]} BLESSING`, textStyle(16, '#c8b8e8')).setAlpha(0);
    const title = this.add.text(x, 88, def.name.toUpperCase(), textStyle(34, '#fff2c0', { wordWrap: { width: w } })).setAlpha(0);
    const passage = this.add.text(x, 150, `“${def.passage}”`, textStyle(19, '#e8e0f4', { wordWrap: { width: w }, lineSpacing: 6, fontStyle: 'italic' })).setAlpha(0);
    const blessed = this.add.text(x, 330, `${def.legendary} has blessed your journey.`, textStyle(20, '#f0d890')).setAlpha(0);
    const head = this.add.text(x, 372, def.headline, textStyle(26, '#ffffff', { wordWrap: { width: w } })).setAlpha(0);
    const sum = this.add.text(x, 412, def.summary, textStyle(19, '#d8d0e8', { wordWrap: { width: w } })).setAlpha(0);
    const prompt = this.add.text(GAME_WIDTH - 24, GAME_HEIGHT - 28, 'Enter to continue', textStyle(14, '#8a7f96')).setOrigin(1, 0).setAlpha(0);

    const fade = (target: Phaser.GameObjects.GameObject, ms: number, to = 1) => {
      if (motion === 'off') return void (target as unknown as { setAlpha(n: number): void }).setAlpha(to);
      this.tweens.add({ targets: target, alpha: to, duration: fast ? Math.min(ms, 250) : ms });
    };
    // [delay in ms (full motion), what to show]. Quiet, unhurried: the whole thing is about 13 seconds.
    const steps: Array<[number, () => void]> = [
      [600, () => { fade(cone, 1600); fade(itemImg, 1600); }],
      [1700, () => { const sp = def.speciesId && session.content.species.get(def.speciesId); if (sp) playCry(this, sp, 70); }],
      [2600, () => { fade(tier, 900); fade(title, 900); }],
      [4200, () => fade(passage, 1800)],
      [8200, () => fade(blessed, 900)],
      [9600, () => { fade(head, 900); fade(sum, 900); }],
      [11500, () => fade(prompt, 600)],
    ];
    // Every faded object is known up front, so a first Confirm can show them all without replaying the cry.
    this.shown = [cone, itemImg, tier, title, passage, blessed, head, sum, prompt];
    if (motion === 'off') {
      this.finish();
      if (def.speciesId) { const sp = session.content.species.get(def.speciesId); if (sp) playCry(this, sp, 70); }
    } else {
      steps.forEach(([delay, fn], i) => this.timers.push(this.time.delayedCall(fast ? delay / 3 : delay, () => { fn(); if (i === steps.length - 1) this.finished = true; })));
    }

    const next = () => {
      if (this.leaving) return;
      if (!this.finished) return this.finish();
      this.leaving = true;
      if (run.expansion?.blessing) run.expansion.blessing.seen = true;
      session.saveRunNow();
      this.scene.start('Briefing');
    };
    onInputAction(this, (a) => { if (a === 'confirm' || a === 'back') next(); });
    this.input.on('pointerdown', next);
  }

  /** Shows everything at once (a first Confirm, or animations off). */
  private finish(): void {
    for (const t of this.timers) t.remove(false);
    this.timers = [];
    this.tweens.killAll();
    for (const o of this.shown) (o as unknown as { setAlpha(n: number): void }).setAlpha(1);
    this.finished = true;
  }
}
