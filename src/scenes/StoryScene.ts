// Story Overhaul S5: a backstory scene (intro, event, echo or ending) shown between Map stops. Confirm turns the page; a scene with
// choices ends on a choice list (up/down/confirm). The outcome is decided by core/story2/module.ts when the choice is made, never by
// how this screen plays, so reduced motion and skipping change nothing. Space/Enter on the last page of a choice-less scene continues.

import Phaser from 'phaser';
import type { StoryScene as View } from '../core/story2/module';
import { services } from '../game/services';
import { playStorySfx } from '../ui/audio';
import { onInputAction, type InputAction } from '../ui/input';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { sceneForRun } from './routing';

export class StoryScene extends Phaser.Scene {
  private view!: View;
  private next = 'Map';
  private page = 0;
  private choice = 0;
  private body!: Phaser.GameObjects.Text;
  private speaker!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.Text[] = [];
  private done = false;

  constructor() {
    super('Story');
  }

  create(data: { next?: string } = {}): void {
    const { session } = services();
    const view = session.storyScene();
    if (!view) {
      this.scene.start(data.next ?? sceneForRun(session.run!));
      return;
    }
    this.view = view;
    this.next = data.next ?? sceneForRun(session.run!);
    this.page = 0;
    this.choice = 0;
    this.done = false;
    this.rows = [];
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.background).setOrigin(0);
    const box = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 150, GAME_WIDTH - 80, 230, COLORS.panel, 0.96).setStrokeStyle(4, COLORS.border);
    box.setName('story-box');
    this.add.text(GAME_WIDTH / 2, 70, view.kicker, textStyle(30, '#ffd860')).setOrigin(0.5).setName('story-kicker');
    this.speaker = this.add.text(70, GAME_HEIGHT - 250, '', textStyle(24, '#ffb745')).setName('story-speaker');
    this.body = this.add.text(70, GAME_HEIGHT - 215, '', textStyle(24, COLORS.text, { wordWrap: { width: GAME_WIDTH - 140 } })).setName('story-body');
    this.hint = this.add.text(GAME_WIDTH - 70, GAME_HEIGHT - 55, '', textStyle(18, '#a8a0b0')).setOrigin(1, 0.5);
    this.show();
    onInputAction(this, (a) => this.handle(a));
    this.input.on('pointerdown', () => this.handle('confirm'));
    this.cameras.main.fadeIn(session.settings.battleAnimations === 'full' ? 300 : 1);
  }

  private show(): void {
    const line = this.view.lines[this.page];
    const last = this.page >= this.view.lines.length - 1;
    this.speaker.setText(line?.speaker ?? '');
    this.body.setText(line?.text ?? '');
    this.hint.setText(last && this.view.choices.length > 0 ? '' : last ? 'Enter: continue' : 'Enter: next');
    for (const r of this.rows) r.destroy();
    this.rows = [];
    if (last && this.view.choices.length > 0) {
      this.view.choices.forEach((c, i) => {
        const t = this.add.text(110, GAME_HEIGHT - 150 + i * 32, `${i === this.choice ? '▶ ' : '   '}${c.text}`, textStyle(22, i === this.choice ? '#ffd860' : COLORS.text, { wordWrap: { width: GAME_WIDTH - 220 } })).setName(`story-choice-${c.id}`);
        this.rows.push(t);
      });
      this.body.setY(GAME_HEIGHT - 235);
      this.body.setFontSize(20);
    }
  }

  private handle(action: InputAction): void {
    if (this.done) return;
    const last = this.page >= this.view.lines.length - 1;
    if (!last && this.view.lines.length > 0) {
      if (action === 'confirm') {
        playStorySfx(this, 'se_page_flip', 0.6);
        this.page += 1;
        this.show();
      }
      return;
    }
    if (this.view.choices.length > 0) {
      if (action === 'up' || action === 'down') {
        this.choice = (this.choice + (action === 'down' ? 1 : this.view.choices.length - 1)) % this.view.choices.length;
        playStorySfx(this, 'se_choice_hover', 0.6);
        this.show();
      } else if (action === 'confirm') this.finish(this.view.choices[this.choice]!.id);
      return;
    }
    if (action === 'confirm') this.finish();
  }

  private finish(choiceId?: string): void {
    const { session } = services();
    if (!session.finishStoryScene(choiceId)) return;
    if (choiceId) playStorySfx(this, 'se_choice_confirm');
    this.done = true;
    // Another scene may be waiting (never two in one Stop today, but a saved run may carry one).
    const again = session.storyScene();
    this.cameras.main.fadeOut(200);
    this.time.delayedCall(210, () => this.scene.start(again ? 'Story' : this.next, again ? { next: this.next } : undefined));
  }
}
