// The plain screen for Beta 0.6 wide formats (Breather, Blackout, Convoy, Debate...). It only shows the running format's
// card (core/formats) and passes the player's choice back; it decides nothing itself. Launched on top of the map
// (`this.scene.launch('Format', { from: 'Map' })`). The Siege Map and Colossus get their own picked screens later.

import Phaser from 'phaser';
import { climaxBoard } from '../core/arc/climaxExtended';
import { cardOf, chooseOption, closeFormat, formatOver } from '../core/formats/registry';
import { services } from '../game/services';
import { drawGlass } from '../ui/aero';
import { fitBlock } from '../ui/fitText';
import { onInputAction, type InputAction } from '../ui/input';
import { wideView } from '../ui/redux/screens/wide';
import { mountRedux, reduxOn, type ReduxCtx, type ReduxView } from '../ui/redux/stage';
import { boardView } from '../ui/redux/templates';
import { widePage } from '../ui/redux/wideModel';
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
  /** New UI: the format's mock-up page over the canvas, and the choice under the cursor. */
  private rx: ReduxView | null = null;
  private at = 0;
  /** New UI: the Extended Cut phase list is open over the page (X), and its cursor. */
  private phases: number | null = null;

  constructor() {
    super('Format');
  }

  init(data: FormatSceneData): void {
    this.data0 = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1a2a');
    this.rx = null;
    if (reduxOn()) {
      if (!cardOf(this.ctx())) return this.finish();
      this.at = this.firstOpen();
      this.rx = mountRedux(this, {
        render: (c) => {
          if (this.phases !== null) return this.phaseList(c);
          const page = widePage(this, this.ctx(), this.at);
          return page ? wideView(c, page.model, !!climaxBoard(this.ctx().run)) : '';
        },
        acts: {
          pick: (k) => {
            if (this.phases !== null) return this.phaseFocus(Number(k));
            this.focus(Number(k));
            this.choose();
          },
          phases: () => this.phaseToggle(),
        },
        overs: { over: (k) => (this.phases !== null ? this.phaseFocus(Number(k)) : this.focus(Number(k))) },
      });
      this.phases = null;
      this.input.keyboard?.on('keydown-P', () => this.phaseToggle());
      onInputAction(this, (a) => this.key(a));
      return;
    }
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

  // ---- New UI ----

  private firstOpen(): number {
    return Math.max(0, widePage(this, this.ctx(), 0)?.open.indexOf(true) ?? 0);
  }

  private focus(k: number): void {
    const n = widePage(this, this.ctx(), this.at)?.open.length ?? 0;
    if (!(k >= 0 && k < n) || k === this.at) return;
    this.at = k;
    this.rx?.refresh();
  }

  /** Opens or closes the Extended Cut phase list (only while that climax runs). It reads the run; it changes nothing. */
  private phaseToggle(): void {
    const board = climaxBoard(this.ctx().run);
    if (!this.rx || (this.phases === null && !board)) return;
    this.phases = this.phases === null ? Math.max(0, board!.rows.findIndex((r) => r.state === 'now')) : null;
    this.rx.refresh();
  }

  private phaseFocus(k: number): void {
    const n = climaxBoard(this.ctx().run)?.rows.length ?? 0;
    if (this.phases === null || !(k >= 0 && k < n) || k === this.phases) return;
    this.phases = k;
    this.rx?.refresh();
  }

  private phaseList(c: ReduxCtx): string {
    const board = climaxBoard(this.ctx().run);
    if (!board) return '';
    const region = `${board.region.charAt(0).toUpperCase()}${board.region.slice(1)}`;
    const left = board.tries - board.shots;
    const shot = board.shots === 0 ? 'Second Shot: the first loss retries from the last save point.' : left > 0 ? 'Second Shot is used: the next loss ends the climax, and the run goes on.' : '';
    return boardView(c, {
      title: 'Extended Cut: phase list',
      area: 'battle',
      rows: board.rows.map((r) => ({ title: r.name, sub: r.sub, tag: r.state === 'done' ? 'Done' : r.state === 'now' ? 'Now' : r.state === 'next' ? 'Next' : 'Ahead', pct: r.pct })),
      index: this.phases ?? 0,
      text: `The longer ${region} climax, in order. ${shot}`.trim(),
      hints: [['Esc', 'back']],
    });
  }

  private key(a: InputAction): void {
    if (this.phases !== null) {
      if (a === 'back' || a === 'confirm') return this.phaseToggle();
      const n = climaxBoard(this.ctx().run)?.rows.length ?? 0;
      if (n) this.phaseFocus(Math.max(0, Math.min(n - 1, this.phases + (a === 'up' || a === 'left' ? -1 : 1))));
      return;
    }
    if (a === 'confirm') return this.choose();
    const n = widePage(this, this.ctx(), this.at)?.open.length ?? 0;
    if (!n || a === 'back') return;
    this.focus((this.at + (a === 'up' || a === 'left' ? n - 1 : 1)) % n);
  }

  private choose(): void {
    const ctx = this.ctx();
    const page = widePage(this, ctx, this.at);
    if (!page || !page.ids.length) return this.finish();
    const id = page.ids[this.at];
    if (id === undefined || !page.open[this.at]) return;
    chooseOption(ctx, id);
    services().session.saveRunNow();
    // A format fight was launched: the battle screen takes over, and the map shows this screen again afterwards.
    if (ctx.run.phase === 'battle') {
      this.scene.stop(this.data0.from);
      this.scene.start('Battle');
      return;
    }
    this.at = this.firstOpen();
    this.rx?.refresh();
  }

  // ---- Old UI ----

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
