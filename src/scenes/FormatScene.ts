// The plain screen for Beta 0.6 wide formats (Breather, Blackout, Convoy, Debate...). It only shows the running format's
// card (core/formats) and passes the player's choice back; it decides nothing itself. Launched on top of the map
// (`this.scene.launch('Format', { from: 'Map' })`). The Siege Map and Colossus get their own picked screens later.

import Phaser from 'phaser';
import { cardOf, chooseOption, closeFormat, formatOver } from '../core/formats/registry';
import { services } from '../game/services';
import { drawGlass } from '../ui/aero';
import { fitBlock } from '../ui/fitText';
import { onInputAction } from '../ui/input';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { Menu } from '../ui/widgets';

export interface FormatSceneData {
  from: string;
  onDone?: () => void;
}

export class FormatScene extends Phaser.Scene {
  private data0!: FormatSceneData;
  private layer: Phaser.GameObjects.GameObject[] = [];
  private menu: Menu | null = null;

  constructor() {
    super('Format');
  }

  init(data: FormatSceneData): void {
    this.data0 = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1a2a');
    onInputAction(this, (a) => this.menu?.handle(a));
    this.render();
  }

  private ctx() {
    const s = services();
    return { content: s.session.content, run: s.session.run! };
  }

  private clear(): void {
    this.menu?.destroy();
    this.menu = null;
    for (const o of this.layer) o.destroy();
    this.layer = [];
  }

  private render(): void {
    this.clear();
    const ctx = this.ctx();
    const card = cardOf(ctx);
    if (!card) return this.finish();
    this.layer.push(drawGlass(this, 24, 20, GAME_WIDTH - 48, Math.min(250, GAME_HEIGHT - 120)));
    this.layer.push(this.add.text(44, 30, card.title, textStyle(22, '#ffe08a')));
    const body = this.add.text(44, 66, card.lines.join('\n\n'), textStyle(15, '#cfefff', { wordWrap: { width: GAME_WIDTH - 100 } }));
    fitBlock(body, GAME_WIDTH - 100, 190);
    this.layer.push(body);
    const over = card.over || formatOver(ctx);
    const options = over
      ? [{ label: 'Continue' }]
      : card.options.map((o) => ({ label: o.label, detail: o.note ?? '', disabled: !o.enabled }));
    this.menu = new Menu(this, {
      x: 44, y: 285, options, itemWidth: GAME_WIDTH - 100, itemHeight: 38, fontSize: 18,
      onSelect: (i) => {
        if (over) return this.finish();
        chooseOption(ctx, card.options[i]!.id);
        services().session.saveRunNow();
        // A format fight was launched: the battle screen takes over, and the map shows this screen again afterwards.
        if (ctx.run.phase === 'battle') {
          this.clear();
          this.scene.stop(this.data0.from);
          this.scene.start('Battle');
          return;
        }
        this.render();
      },
    });
  }

  private finish(): void {
    const ctx = this.ctx();
    if (formatOver(ctx) || !cardOf(ctx)) closeFormat(ctx);
    services().session.saveRunNow();
    this.clear();
    this.scene.stop(this.data0.from);
    this.scene.start(this.data0.from);
    this.data0.onDone?.();
  }
}
