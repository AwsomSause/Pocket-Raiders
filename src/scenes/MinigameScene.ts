// The one screen every minigame uses: a HUD, a prompt and a grid of choices drawn from the game's view (core/minigame).
// Timed games advance on a timer; "S" slows it and "T" pauses it (the accessibility options). Rewards are paid by the
// rules code the moment the game ends; this screen only shows the outcome.

import Phaser from 'phaser';
import { getMinigame, minigameView, parkDoorSide, parkEventSide, parkWaiting } from '../core/minigame/flow';
import { SAFARI_ID } from '../core/greenneedle/safari';
import { isZone } from '../core/greenneedle/zone';
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
import { monFile } from '../ui/redux/game';
import { useLookFont } from '../ui/redux/canvasFont';
import type { Board, MinigameView } from '../core/minigame/games';
import type { MinigameDef } from '../core/minigame/schema';
import type { RunState } from '../core/state';
import { jigsawView } from '../ui/redux/screens/jigsaw';
import { JIGSAW_ID, type JigsawState } from '../core/greenneedle/jigsaw';

/** gn.41: the fossil in the slab, by the museum's collection (the first the packs have a sprite for is used). */
const JIGSAW_FOSSILS = ['rampardos', 'aerodactyl', 'tyrantrum'] as const;

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
    // gn.19, gn.20: the Deep Savanna and the Lush Jungle are walked on the same screen, each with its own look.
    if (reduxOn() && !skin && (run.minigame.id === SAFARI_ID || isZone(run.minigame.id)) && !outcome) {
      openPark(this, { title: def.name, onDone: () => this.scene.restart({ focus: 0 }), onEvent: (sideId) => this.scene.start('Event', { sideId }), onLeft: () => this.scene.start(sceneForRun(session.run!), { notice: '', focus: 0 }) });
      return;
    }
    this.add.text(GAME_WIDTH / 2, 22, `${def.name}  ·  ${def.difficultyTiers[run.minigame.tier]!.label}`, textStyle(30, COLORS.textLight)).setOrigin(0.5);
    // A game with a drawn play field (the Arcade Cabinet) keeps this screen open and redraws it in place.
    if (view.board && !outcome) return this.playBoard(def, view, motion, Boolean(skin), data?.focus);
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
    // gn.41, the Museum's jigsaw: its own screen (the sandbox and the tray), the same in both UI styles; the menu above keeps the input.
    if (run.minigame.id === JIGSAW_ID) {
      const s = run.minigame.state as unknown as JigsawState;
      const want = JIGSAW_FOSSILS[(s.skull - 1) % JIGSAW_FOSSILS.length]!;
      const file = [want, ...JIGSAW_FOSSILS].map((id) => monFile(this, id, 'front')).find((f) => f) ?? null;
      const jig = mountRedux(this, {
        render: (c) =>
          jigsawView(c, {
            title: def.name, hud: view0.hud, prompt: view0.prompt, cols: s.cols, rows: s.rows, tray: s.tray, placed: s.placed, held: s.held,
            index: this.menu.index, file, skull: s.skull, // (The story's own lines say what was paid; the framework's score and "+₽0" lines are left out.)
            outcome: outcome ? { lines: outcome.lines.filter((l) => !/^Score \d|^\+₽0/.test(l)), medal: outcome.medal } : null,
            hints: outcome ? [['Enter', 'done']] : [['Arrows', 'move'], ['Enter', s.held >= 0 ? 'set down' : 'pick up'], ['Esc', 'leave it']],
          }),
        acts: { pick: (i) => { if (options[Number(i)]?.disabled) return; this.menu.focus(Number(i), false); this.menu.confirm(); } },
        overs: { over: (i) => { if (!options[Number(i)]?.disabled) this.menu.focus(Number(i), false); } },
      });
      this.menu.onFocus = () => jig.refresh();
      return;
    }
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

  /**
   * A game with a play field: arrow keys and Enter press the game's own cells (`view.keys`), the clock ticks without rebuilding
   * the screen, and the field is redrawn after every press and tick. The rules stay in core; this only draws and sends presses.
   */
  private playBoard(def: MinigameDef, first: MinigameView, motion: 'full' | 'reduced' | 'off', skinned: boolean, focus?: number): void {
    const { session } = services();
    useLookFont(this);
    let v = first;
    const shape = (x: MinigameView): string => x.cells.map((c) => c.id).join(',');
    const built = shape(first);
    drawPanel(this, 16, 48, GAME_WIDTH - 32, 60, { fill: COLORS.panelDark, border: COLORS.borderMuted, thin: true });
    const hud = this.add.text(28, 54, '', textStyle(18, '#f0e0a0', { wordWrap: { width: GAME_WIDTH - 56 } }));
    const said = this.add.text(28, 80, '', textStyle(15, COLORS.textLight, { wordWrap: { width: GAME_WIDTH - 56 } }));
    const field = this.add.graphics();
    const title = this.add.text(440, 124, '', textStyle(20, '#f5c842'));
    const text = this.add.text(440, 152, '', textStyle(15, COLORS.textLight, { wordWrap: { width: GAME_WIDTH - 470 }, lineSpacing: 3 }));
    const table = this.add.text(440, 0, '', textStyle(16, '#3be08a', { lineSpacing: 4 })).setOrigin(0, 1).setY(GAME_HEIGHT - 110);
    const draw = (): void => {
      hud.setText(v.hud.filter(Boolean).join('   ·   '));
      said.setText(v.prompt === v.board!.text ? '' : v.prompt);
      title.setText(v.board!.title);
      text.setText(v.board!.text);
      table.setText(v.board!.table.join('\n'));
      paintBoard(field, v.board!, 30, 120, 390, 300);
    };
    draw();

    let rx: { refresh(): void } | null = null;
    const after = (run: RunState): void => {
      const next = run.minigame ? minigameView(session.content, run) : null;
      if (!next || run.minigame!.outcome || shape(next) !== built) {
        playSfx(this, MEDAL_SFX[run.minigame?.outcome?.medal ?? 'pending'] ?? 'se.exp', 0.7);
        this.scene.restart({ slow: this.slow, paused: this.paused });
        return;
      }
      v = next;
      draw();
      rx?.refresh();
    };
    const press = (id: string): void => {
      if (this.paused && v.keys) return;
      after(session.minigameAct(id));
    };
    const itemW = Math.floor((GAME_WIDTH - 48) / Math.max(1, first.cells.length));
    this.menu = new Menu(this, {
      x: 24, y: GAME_HEIGHT - 92, columns: Math.max(1, first.cells.length), itemWidth: itemW, itemHeight: 52, fontSize: 19, color: COLORS.textLight,
      options: first.cells.map((c) => ({ label: c.label, detail: c.detail, disabled: c.disabled })),
      onSelect: (i) => {
        const cell = first.cells[i];
        if (cell && !cell.disabled) press(cell.id);
      },
      onBack: () => this.leave(),
    });
    if (focus !== undefined) this.menu.index = Math.min(focus, Math.max(0, first.cells.length - 1));

    const tickMs = def.uiConfiguration.tickMs;
    if (tickMs > 0) {
      this.time.addEvent({
        delay: tickMs * (this.slow ? def.accessibilityOptions.slowFactor : 1), loop: true,
        callback: () => { if (!this.paused && !v.waiting && session.run?.minigame && !session.run.minigame.outcome) after(session.minigameTick()); },
      });
    }
    const hints = ['Arrows move', 'Enter act', 'Esc walk away', this.slow ? 'Q normal speed' : 'Q slow down'];
    if (def.accessibilityOptions.noTimerOption) hints.push(this.paused ? 'T resume' : 'T pause');
    this.add.text(16, GAME_HEIGHT - 22, hints.join('  ·  '), textStyle(14, '#8a7f96'));
    this.input.keyboard?.on('keydown-T', () => {
      if (def.accessibilityOptions.noTimerOption) this.scene.restart({ focus: this.menu.index, slow: this.slow, paused: !this.paused });
    });
    // S is also "down" (WASD), so the speed switch sits on Q here.
    this.input.keyboard?.on('keydown-Q', () => this.scene.restart({ focus: this.menu.index, slow: !this.slow, paused: this.paused }));
    onInputAction(this, (a) => {
      const id = a === 'back' ? undefined : v.keys?.[a];
      if (id) press(id);
      else this.menu.handle(a);
    });
    if (reduxOn() && !skinned) {
      const bird = monFile(this, 'porygon', 'front');
      const rxHints: (readonly [string, string])[] = [['Q', this.slow ? 'normal' : 'slow'], ['Arrows', 'move'], ['Enter', 'act'], ['Esc', 'walk away']];
      if (def.accessibilityOptions.noTimerOption) rxHints.unshift(['T', this.paused ? 'resume' : 'pause']);
      const view = mountRedux(this, {
        render: (c) =>
          gameView(c, {
            title: def.name,
            hud: this.paused ? [...v.hud, 'Paused'] : v.hud,
            best: null,
            prompt: v.prompt,
            medal: null,
            art: null,
            party: [],
            cols: Math.max(1, first.cells.length),
            cells: first.cells.map((o) => ({ label: o.label, detail: o.detail ?? '', off: Boolean(o.disabled) })),
            index: this.menu.index,
            hints: rxHints,
            board: v.board,
            bird,
            calm: motion !== 'full',
            press: true,
          }),
        overs: { over: (i) => { if (!first.cells[Number(i)]?.disabled) this.menu.focus(Number(i), false); } },
      });
      rx = view;
      this.menu.onFocus = () => rx?.refresh();
      // The field is redrawn on every tick, so a button can be replaced between the press and the release: act on the press.
      view.el.addEventListener('pointerdown', (e) => {
        const hit = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-press]') : null;
        const cell = hit ? first.cells[Number(hit.dataset.press)] : undefined;
        if (!hit || !cell || cell.disabled) return;
        this.menu.focus(Number(hit.dataset.press), false);
        press(cell.id);
      });
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
    // A game an event opened says where its story goes on (gn.41's jigsaw: back to the Activities Desk).
    const room = finished ? (session.run!.minigame?.state as { room?: string } | undefined)?.room : undefined;
    const run = session.leaveMinigame();
    if (door) return void this.scene.start('Event', { sideId: door });
    if (room && run.phase === 'map') {
      this.scene.start('Event', { sideId: room });
      return;
    }
    this.scene.start(sceneForRun(run), { notice: finished ? '' : 'You left the minigame.', focus: 0 });
  }
}

const TILE: Record<string, number> = { '#': 0x14553a, o: 0x5a4a10, x: 0xf5c842, '1': 0xf06a8a, '2': 0x58b8f0, '3': 0xf5c842, '=': 0x3be08a, q: 0xe04848 };

/** The play field drawn with plain shapes (the Old look, and a New look with a minigame style picked): tiles, then the bird as a blocky pink and blue shape. */
function paintBoard(g: Phaser.GameObjects.Graphics, b: Board, x: number, y: number, w: number, h: number): void {
  const cell = Math.floor(Math.min(w / b.w, h / b.h));
  const ox = x + Math.floor((w - cell * b.w) / 2), oy = y + Math.floor((h - cell * b.h) / 2);
  g.clear();
  g.fillStyle(0x0b0f1a, 1).fillRect(x - 6, y - 6, w + 12, h + 12);
  g.lineStyle(2, 0x3be08a, 0.8).strokeRect(x - 6, y - 6, w + 12, h + 12);
  [...b.tiles].forEach((t, i) => {
    const cx = ox + (i % b.w) * cell, cy = oy + Math.floor(i / b.w) * cell;
    if (t === '|') g.fillStyle(0xffffff, 0.9).fillRect(cx + cell / 2 - 1, cy, 3, cell);
    else if (t === '=') g.fillStyle(TILE[t]!, 1).fillRect(cx, cy, cell, 3);
    else if (TILE[t] !== undefined) {
      g.fillStyle(TILE[t]!, 1).fillRect(cx + 1, cy + 1, cell - 2, cell - 2);
      if (t === '#') g.lineStyle(1, 0x3be08a, 1).strokeRect(cx + 1, cy + 1, cell - 2, cell - 2);
    }
  });
  for (const s of b.sprites) {
    const cx = ox + s.x * cell, cy = oy + s.y * cell, u = cell / 8;
    g.fillStyle(0xf07898, 1).fillRect(cx + u, cy + 3 * u, 5 * u, 4 * u);
    g.fillStyle(0x58b8f0, 1).fillRect(cx + 4 * u, cy + u, 3 * u, 3 * u).fillRect(cx + u, cy + 6 * u, 2 * u, u);
    g.fillStyle(0xffffff, 1).fillRect(cx + 5.5 * u, cy + 1.6 * u, u, u);
    if (s.k === 'P') g.lineStyle(2, 0xff4040, 1).strokeRect(cx, cy, cell, cell);
  }
}
