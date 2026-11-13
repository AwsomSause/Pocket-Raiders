// The one screen every minigame uses: a HUD, a prompt and a grid of choices drawn from the game's view (core/minigame).
// Timed games advance on a timer; "S" slows it and "T" pauses it (the accessibility options). Rewards are paid by the
// rules code the moment the game ends; this screen only shows the outcome.

import Phaser from 'phaser';
import { getMinigame, minigameView } from '../core/minigame/flow';
import { services } from '../game/services';
import { paintSkinBackdrop, skinFor } from '../ui/screenSkins';
import { aeroBackdrop, bounceIn, floatIdle } from '../ui/aero';
import { onInputAction } from '../ui/input';
import { playSfx } from '../ui/audio';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { Menu } from '../ui/widgets';
import { glassPanel as drawPanel } from '../ui/aero';
import { sceneForRun } from './routing';
import { loadAssets } from '../ui/lazyAssets';
import { pokemonIcon } from '../ui/sprites';

const TONE_FILL: Record<string, number> = { good: 0x2f7a4a, bad: 0x8a3a3a, info: 0x3a5f8a, hot: 0xc9962a, dim: 0x22303a };

const MEDAL_SFX: Record<string, string> = { gold: 'se.shiny', silver: 'se.level_up', bronze: 'se.level_up', none: 'ui.error' };
const MEDAL_COLOR: Record<string, number> = { gold: 0xf5c842, silver: 0xd0d8e0, bronze: 0xd08848, none: 0x707080 };

export class MinigameScene extends Phaser.Scene {
  private menu!: Menu;
  private slow = false;
  private paused = false;

  constructor() {
    super('Minigame');
  }

  create(data?: { focus?: number; slow?: boolean; paused?: boolean }): void {
    const { session } = services();
    const run = session.run!;
    const motion = session.settings.battleAnimations;
    if (run.phase !== 'minigame' || !run.minigame) {
      this.scene.start(sceneForRun(run), { notice: '', focus: 0 });
      return;
    }
    this.slow = data?.slow ?? false;
    this.paused = data?.paused ?? false;
    const skin = skinFor('minigame', `${run.seed}:${run.minigame.id}`);
    if (skin) paintSkinBackdrop(this, skin, motion);
    else aeroBackdrop(this, motion, 0x58c0e8);
    const def = getMinigame(session.content, run.minigame.id);
    const view = minigameView(session.content, run);
    const outcome = run.minigame.outcome;
    this.add.text(GAME_WIDTH / 2, 22, `${def.name}  ·  ${def.difficultyTiers[run.minigame.tier]!.label}`, textStyle(30, COLORS.textLight)).setOrigin(0.5);
    drawPanel(this, 16, 48, GAME_WIDTH - 32, 96, { fill: COLORS.panelDark, border: COLORS.borderMuted, thin: true });
    this.add.text(28, 54, view.hud.filter((h) => h.length > 0).join('   ·   '), textStyle(18, '#f0e0a0', { wordWrap: { width: GAME_WIDTH - 56 } }));
    this.add.text(28, 98, outcome ? outcome.lines.join(' ') : view.prompt, textStyle(20, outcome ? '#a0f0a0' : COLORS.textLight, { wordWrap: { width: GAME_WIDTH - 56 } }));

    if (outcome) this.showMedal(outcome.medal, motion);
    const fr = session.content.minigames.economy.frontier;
    const prizes = outcome && fr.games.includes(run.minigame.id) ? fr.prizes : [];
    const controls = view.cells.filter((c) => !c.board);
    const options = outcome
      ? [
          { label: 'Done', detail: prizes.length ? `${run.minigames.frontierPoints} Frontier Points` : 'back to the map', disabled: false },
          ...prizes.map((p) => ({ label: p.name, detail: `${p.cost} FP`, disabled: run.minigames.frontierPoints < p.cost })),
        ]
      : controls.map((c) => ({ label: c.label, detail: c.detail, disabled: c.disabled }));
    const board = outcome ? [] : view.cells.filter((c) => c.board);
    const cols = outcome ? (prizes.length ? 2 : 1) : board.length ? Math.min(4, Math.max(1, controls.length)) : Math.max(1, view.cols);
    const rows = Math.ceil(options.length / cols);
    const rail = outcome ? 0 : this.drawPortraits(view.portraits ?? []);
    const boardH = rail + (board.length ? this.drawBoard(board, view.cols, 156 + rail) : 0);
    const itemH = Math.min(52, Math.floor((GAME_HEIGHT - 190 - 30 - boardH) / rows));
    this.menu = new Menu(this, {
      x: 24, y: 156 + boardH, columns: cols, itemWidth: Math.floor((GAME_WIDTH - 48) / cols), itemHeight: itemH, fontSize: itemH < 40 ? 16 : 19, color: COLORS.textLight,
      options,
      onSelect: (i) => {
        if (outcome) {
          const prize = prizes[i - 1];
          if (!prize) return this.leave();
          if (run.minigames.frontierPoints < prize.cost) return;
          playSfx(this, 'ui.select');
          session.buyFrontierPrize(prize.id);
          this.scene.restart({ focus: i, slow: this.slow, paused: this.paused });
          return;
        }
        const cell = controls[i]!;
        if (cell.disabled) return;
        playSfx(this, 'ui.select');
        const after = session.minigameAct(cell.id);
        playSfx(this, MEDAL_SFX[after.minigame?.outcome?.medal ?? 'pending'] ?? 'se.exp', 0.7);
        this.scene.restart({ focus: i, slow: this.slow, paused: this.paused });
      },
      onBack: () => this.leave(),
    });
    if (data?.focus !== undefined) this.menu.index = Math.min(data.focus, options.length - 1);

    const tickMs = def.uiConfiguration.tickMs;
    if (!outcome && tickMs > 0 && !view.done) {
      const delay = tickMs * (this.slow ? def.accessibilityOptions.slowFactor : 1);
      if (!this.paused) {
        this.time.delayedCall(delay, () => {
          session.minigameTick();
          this.scene.restart({ focus: this.menu.index, slow: this.slow, paused: this.paused });
        });
      }
    }
    const hints = ['Enter choose', 'Esc leave (forfeits)'];
    if (tickMs > 0) hints.push(this.slow ? 'S normal speed' : 'S slow down');
    if (tickMs > 0 && def.accessibilityOptions.noTimerOption) hints.push(this.paused ? 'T resume' : 'T pause');
    this.add.text(16, GAME_HEIGHT - 22, hints.join('  ·  '), textStyle(14, '#8a7f96'));
    this.input.keyboard?.on('keydown-S', () => this.scene.restart({ focus: this.menu.index, slow: !this.slow, paused: this.paused }));
    this.input.keyboard?.on('keydown-T', () => {
      if (def.accessibilityOptions.noTimerOption) this.scene.restart({ focus: this.menu.index, slow: this.slow, paused: !this.paused });
    });
    onInputAction(this, (a) => this.menu.handle(a));
  }

  /** Draws the picture board (tiles, with game art where it exists) and returns the height it used. */
  private drawBoard(cells: { label: string; tone?: string; art?: string }[], cols: number, top = 156): number {
    const rows = Math.ceil(cells.length / cols);
    const size = Math.max(20, Math.min(64, Math.floor(250 / rows), Math.floor((GAME_WIDTH - 48) / cols)));
    const x0 = Math.floor((GAME_WIDTH - size * cols) / 2);
    const art = [...new Set(cells.map((c) => c.art).filter((a): a is string => !!a))];
    cells.forEach((c, i) => {
      const x = x0 + (i % cols) * size;
      const y = top + Math.floor(i / cols) * size;
      this.add.rectangle(x + size / 2, y + size / 2, size - 2, size - 2, TONE_FILL[c.tone ?? 'dim'] ?? TONE_FILL.dim!, 1).setStrokeStyle(1, 0x000000, 0.35);
      const label = this.add.text(x + size / 2, y + size / 2, c.label.trim(), textStyle(Math.max(10, Math.floor(size / 3)), '#ffffff')).setOrigin(0.5);
      if (c.art && this.textures.exists(c.art)) {
        label.setVisible(false);
        this.add.image(x + size / 2, y + size / 2, c.art).setDisplaySize(size - 8, size - 8);
      }
    });
    // Load the art in the background; the next redraw (every tick) uses it. Missing art keeps the text label.
    if (art.length) void loadAssets(this, art);
    return rows * size + 8;
  }

  /** A row of small Pokémon icons (performers, patients) above the game. Species the content does not have are skipped. */
  private drawPortraits(ids: string[]): number {
    const { session } = services();
    const species = ids.flatMap((id) => (session.content.species.has(id) ? [session.content.species.get(id)!] : []));
    if (species.length === 0) return 0;
    const step = Math.min(72, Math.floor((GAME_WIDTH - 48) / species.length));
    const x0 = Math.floor((GAME_WIDTH - step * species.length) / 2) + step / 2;
    species.forEach((sp, i) => pokemonIcon(this, sp, x0 + i * step, 176, 1.2));
    return 44;
  }

  /** A glossy medal that bounces in when the game ends (still when motion is off). */
  private showMedal(medal: string, motion: 'full' | 'reduced' | 'off'): void {
    const g = this.add.container(GAME_WIDTH - 70, 96);
    const disc = this.add.graphics();
    disc.fillStyle(MEDAL_COLOR[medal] ?? 0x707080, 1).fillCircle(0, 0, 30);
    disc.lineStyle(4, 0xffffff, 0.9).strokeCircle(0, 0, 30);
    disc.fillStyle(0xffffff, 0.35).fillEllipse(-8, -12, 24, 12);
    g.add([disc, this.add.text(0, 0, medal === 'none' ? '–' : '★', textStyle(28, '#ffffff')).setOrigin(0.5)]);
    bounceIn(this, g, motion);
    floatIdle(this, g, motion, 3);
  }

  private leave(): void {
    const { session } = services();
    const finished = session.run!.minigame?.outcome != null;
    const run = session.leaveMinigame();
    this.scene.start(sceneForRun(run), { notice: finished ? '' : 'You left the minigame.', focus: 0 });
  }
}
