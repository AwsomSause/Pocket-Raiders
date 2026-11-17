// The one screen every minigame uses: a HUD, a prompt and a grid of choices drawn from the game's view (core/minigame).
// Timed games advance on a timer; "S" slows it and "T" pauses it (the accessibility options). Rewards are paid by the
// rules code the moment the game ends; this screen only shows the outcome.

import Phaser from 'phaser';
import { getMinigame, minigameView, parkDoorSide, parkEventSide, parkWaiting } from '../core/minigame/flow';
import { SAFARI_ID } from '../core/greenneedle/safari';
import { openPark } from './safariPark';
import { services } from '../game/services';
import { paintSkinBackdrop, skinFor } from '../ui/screenSkins';
import { aeroBackdrop, bounceIn, floatIdle } from '../ui/aero';
import { onInputAction } from '../ui/input';
import { playSfx } from '../ui/audio';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { Menu } from '../ui/widgets';
import { glassPanel as drawPanel } from '../ui/aero';
import { sceneForRun } from './routing';
import { arenaFor, getTheme } from '../core/themes';
import { artOf, partyChips } from '../ui/redux/game';
import { mountRedux, reduxOn } from '../ui/redux/stage';
import { bestMedalWord, gameView } from '../ui/redux/screens/minigame';

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
    // gn.18: back from an event inside Safari Land. Its next room plays first; otherwise the visit is on again.
    if (parkWaiting(session.run!)) {
      const next = session.continuePark();
      if (next) {
        this.scene.start('Event', { sideId: next });
        return;
      }
    }
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
    const view0 = view;
    const outcome = run.minigame.outcome;
    // gn.18 in the New UI: the park is a grid you walk (scenes/safariPark.ts) until the visit ends; the outcome uses this screen.
    if (reduxOn() && !skin && run.minigame.id === SAFARI_ID && !outcome) {
      openPark(this, { title: def.name, onDone: () => this.scene.restart({ focus: 0 }), onEvent: (sideId) => this.scene.start('Event', { sideId }) });
      return;
    }
    this.add.text(GAME_WIDTH / 2, 22, `${def.name}  ·  ${def.difficultyTiers[run.minigame.tier]!.label}`, textStyle(30, COLORS.textLight)).setOrigin(0.5);
    drawPanel(this, 16, 48, GAME_WIDTH - 32, 96, { fill: COLORS.panelDark, border: COLORS.borderMuted, thin: true });
    this.add.text(28, 54, view.hud.filter((h) => h.length > 0).join('   ·   '), textStyle(18, '#f0e0a0', { wordWrap: { width: GAME_WIDTH - 56 } }));
    this.add.text(28, 98, outcome ? outcome.lines.join(' ') : view.prompt, textStyle(20, outcome ? '#a0f0a0' : COLORS.textLight, { wordWrap: { width: GAME_WIDTH - 56 } }));

    if (outcome) this.showMedal(outcome.medal, motion);
    const fr = session.content.minigames.economy.frontier;
    const prizes = outcome && fr.games.includes(run.minigame.id) ? fr.prizes : [];
    const options = outcome
      ? [
          { label: 'Done', detail: prizes.length ? `${run.minigames.frontierPoints} Frontier Points` : 'back to the map', disabled: false },
          ...prizes.map((p) => ({ label: p.name, detail: `${p.cost} FP`, disabled: run.minigames.frontierPoints < p.cost })),
        ]
      : view.cells.map((c) => ({ label: c.label, detail: c.detail, disabled: c.disabled }));
    const cols = outcome ? (prizes.length ? 2 : 1) : Math.max(1, view.cols);
    const rows = Math.ceil(options.length / cols);
    const itemH = Math.min(52, Math.floor((GAME_HEIGHT - 190 - 30) / rows));
    this.menu = new Menu(this, {
      x: 24, y: 156, columns: cols, itemWidth: Math.floor((GAME_WIDTH - 48) / cols), itemHeight: itemH, fontSize: itemH < 40 ? 16 : 19, color: COLORS.textLight,
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
        const cell = view.cells[i]!;
        if (cell.disabled) return;
        playSfx(this, 'ui.select');
        const after = session.minigameAct(cell.id);
        // gn.18: an event inside the park opens (the visit waits for it).
        const inside = parkEventSide(after);
        if (inside) return void this.scene.start('Event', { sideId: inside });
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
    // New UI: the mock-up minigame screen (score windows, the field, the choices) unless a minigame look is picked.
    if (reduxOn() && !skin) {
      const theme = run.stage ? getTheme(session.content, run.stage.themeId) : undefined;
      const art = artOf(this, theme ? arenaFor(session.content, theme) : undefined)?.file ?? null;
      const party = partyChips(this).flatMap((p) => (p.file ? [p.file] : []));
      const rxHints: (readonly [string, string])[] = [['Enter', 'choose'], ['Esc', outcome ? 'leave' : 'forfeit']];
      if (tickMs > 0) rxHints.unshift(['S', this.slow ? 'normal' : 'slow']);
      if (tickMs > 0 && def.accessibilityOptions.noTimerOption) rxHints.unshift(['T', this.paused ? 'resume' : 'pause']);
      const view = mountRedux(this, {
        render: (c) =>
          gameView(c, {
            title: `${def.name} · ${def.difficultyTiers[run.minigame!.tier]!.label}`,
            hud: view0.hud,
            best: bestMedalWord(run.minigames.best[def.id]),
            prompt: outcome ? outcome.lines.join(' ') : view0.prompt,
            medal: outcome ? outcome.medal : null,
            art,
            party,
            cols,
            cells: options.map((o) => ({ label: o.label, detail: o.detail ?? '', off: Boolean(o.disabled) })),
            index: this.menu.index,
            hints: rxHints,
          }),
        acts: { pick: (i) => { if (options[Number(i)]?.disabled) return; this.menu.focus(Number(i), false); this.menu.confirm(); } },
        overs: { over: (i) => { if (!options[Number(i)]?.disabled) this.menu.focus(Number(i), false); } },
      });
      this.menu.onFocus = () => view.refresh();
    }
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
    // gn.18: the door taken at Safari Land's far gate opens as soon as the visit is over.
    const door = parkDoorSide(session.run!);
    const run = session.leaveMinigame();
    if (door) return void this.scene.start('Event', { sideId: door });
    this.scene.start(sceneForRun(run), { notice: finished ? '' : 'You left the minigame.', focus: 0 });
  }
}
