// The Seed & Codes page of the Preparation Desk: type or paste a seed, or a
// share code (PR1 seed code, GH1 ghost, CC1 challenge card, TM1 team). The text
// box is a real HTML input laid over the canvas, so phones show their own keyboard.

import Phaser from 'phaser';
import { keepGhost } from '../core/ghost';
import { readSeedInput } from '../core/seedInput';
import { services } from '../game/services';
import { AERO, drawGlass, glassPanel as drawPanel } from '../ui/aero';
import { playSfx } from '../ui/audio';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import type { RunPrepData } from './RunPrepScene';

export interface RunSeedData {
  desk: RunPrepData;
}

const TINT = 0x2f80d0;
const BOX = { x: 40, y: 150, w: GAME_WIDTH - 80, h: 56 };
const BTN_Y = 226;
const BTN_H = 52;

export class RunSeedScene extends Phaser.Scene {
  private desk!: RunPrepData;
  private input_: HTMLInputElement | null = null;
  private notice!: Phaser.GameObjects.Text;

  constructor() {
    super('RunSeed');
  }

  create(data: RunSeedData): void {
    this.desk = data.desk;
    const { content } = services().session;
    this.add.text(GAME_WIDTH / 2, 22, 'Preparation Desk: Seed & Codes', textStyle(30, COLORS.textLight)).setOrigin(0.5);
    drawPanel(this, 16, 70, GAME_WIDTH - 32, 330);
    this.add.text(40, 90, 'Seed or share code', textStyle(20, '#f0e0a0'));
    this.add.text(40, 118, 'A fixed seed makes a run play out the same way again. Leave it empty for a random run.', textStyle(14, COLORS.textMuted, { wordWrap: { width: GAME_WIDTH - 80 } }));
    this.add.text(40, 296, [
      'PR1.…  seed code: sets the seed, trainer and rules',
      'GH1.…  ghost code: race a friend\'s seed and see what they did',
      'CC1.…  challenge card: seed, trainer and rules, with a score to beat',
      'TM1.…  team code: shows the team (changes nothing)',
    ].join('\n'), textStyle(15, COLORS.text));
    this.notice = this.add.text(GAME_WIDTH / 2, 420, '', textStyle(16, '#f0e0a0', { align: 'center', wordWrap: { width: GAME_WIDTH - 60 } })).setOrigin(0.5, 0);
    this.add.text(16, GAME_HEIGHT - 22, 'Enter apply  ·  Esc back to the desk', textStyle(14, '#8a7f96'));

    this.button(16, 14, 96, 38, '◂ Desk', () => this.leave(this.desk));
    const labels: [string, () => void][] = [['Apply', () => this.apply()], ['Random seed', () => this.setText('')], ['Paste', () => void this.paste()], ['Clear', () => this.setText('')]];
    const bw = (GAME_WIDTH - 80 - 3 * 12) / 4;
    labels.forEach(([label, fn], i) => this.button(40 + i * (bw + 12), BTN_Y, bw, BTN_H, label, fn, i === 0));

    // The real text box, laid over the canvas where BOX is.
    const el = document.createElement('input');
    el.type = 'text';
    el.value = this.desk.seed ?? '';
    el.placeholder = 'random';
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('aria-label', 'Seed or share code');
    el.dataset.testid = 'seed-input';
    Object.assign(el.style, { position: 'fixed', zIndex: '20', boxSizing: 'border-box', font: '16px monospace', padding: '0 12px', border: '2px solid #6fd0ff', borderRadius: '12px', background: '#10203a', color: '#ffffff', outline: 'none' } satisfies Partial<CSSStyleDeclaration>);
    el.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') this.apply();
      else if (e.key === 'Escape') this.leave(this.desk);
    });
    document.body.appendChild(el);
    this.input_ = el;
    this.place();
    this.scale.on('resize', this.place, this);
    this.events.on('postupdate', this.place, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.place, this);
      this.events.off('postupdate', this.place, this);
      el.remove();
      this.input_ = null;
    });
    void content;
    el.focus({ preventScroll: true });
  }

  private place(): void {
    const el = this.input_;
    if (!el) return;
    const rect = this.game.canvas.getBoundingClientRect();
    const k = rect.width / GAME_WIDTH;
    Object.assign(el.style, { left: `${rect.left + BOX.x * k}px`, top: `${rect.top + BOX.y * k}px`, width: `${BOX.w * k}px`, height: `${BOX.h * k}px`, fontSize: `${Math.max(16, 20 * k)}px` });
  }

  private setText(text: string): void {
    if (this.input_) this.input_.value = text;
    this.input_?.focus({ preventScroll: true });
  }

  private async paste(): Promise<void> {
    try {
      this.setText((await navigator.clipboard.readText()).trim());
    } catch {
      this.say('Paste is blocked here: long-press the box and choose Paste.');
    }
  }

  private say(text: string): void {
    playSfx(this, 'ui.error', 0.4);
    this.notice.setText(text);
  }

  private button(x: number, y: number, w: number, h: number, label: string, fn: () => void, primary = false): void {
    drawGlass(this, x, y, w, h, { tint: primary ? TINT : AERO.glassLow, alpha: primary ? 0.96 : 0.7, radius: 14, glow: primary });
    this.add.text(x + w / 2, y + h / 2, label, textStyle(19, '#ffffff')).setOrigin(0.5);
    this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerup', fn);
  }

  /** Reads the box; a seed or code goes back to the desk, a bad code or a team code stays here with a note. */
  private apply(): void {
    const { session } = services();
    const { content } = session;
    const result = readSeedInput(this.input_?.value ?? '', {
      hasArchetype: (id) => content.archetypes.has(id),
      hasSpecies: (id) => content.species.has(id),
      speciesName: (id) => content.species.get(id)?.name ?? id,
      archetypeId: this.desk.archetypeId,
    });
    if (result.kind === 'error') return this.say(result.notice);
    if (result.kind === 'info') {
      this.notice.setText(result.notice);
      return;
    }
    if (result.kind === 'seed') return this.leave({ ...this.desk, seed: result.seed });
    if (result.ghost) session.changeProfile((pr) => keepGhost(pr, result.seed, result.ghost!));
    this.leave({ ...this.desk, seed: result.seed, archetypeId: result.archetypeId, rules: result.rules, notice: result.notice });
  }

  private leave(desk: RunPrepData): void {
    this.scene.start('RunPrep', desk);
  }
}
