// Choose one of three first-stage starters, drawn from the Preparation Desk's
// pool and draft rule. Under the Blind Draft the three stay hidden until chosen.
// A built screen style (Settings > Display) changes the card layout; see ui/starterLayouts.ts.

import Phaser from 'phaser';
import { createPokemon, getSpecies } from '../core/pokemon';
import { services } from '../game/services';
import { onInputAction } from '../ui/input';
import { fitHeight } from '../ui/showcase';
import { pokemonVisual } from '../ui/sprites';
import { COLORS, GAME_WIDTH, TYPE_COLORS, textStyle } from '../ui/theme';
import { badge, focusFrame } from '../ui/widgets';
import { glassPanel as drawPanel, slideIn } from '../ui/aero';
import { preloadPokemon } from '../ui/lazyAssets';
import { screenStyleOf } from '../core/presentation/screenStyles';
import { dressScreen } from '../ui/screenDress';
import { STARTER_LAYOUTS, type StarterLayout } from '../ui/starterLayouts';

const ORIGINAL: StarterLayout = { head: COLORS.textLight, mode: 'cards', shape: 'glass', card: (i) => ({ x: (GAME_WIDTH - (280 * 3 + 48)) / 2 + i * 304, y: 100, w: 280, h: 400, rot: 0 }), ink: COLORS.text, muted: COLORS.textMuted };

export class StarterSelectScene extends Phaser.Scene {
  private index = 0;
  private cursors: Phaser.GameObjects.GameObject[] = [];
  private boxes: Phaser.GameObjects.Container[] = [];
  private lay: StarterLayout = ORIGINAL;
  private detail!: Phaser.GameObjects.Container;
  private chosen = false;

  constructor() {
    super('StarterSelect');
  }

  preload(): void {
    const { session } = services();
    preloadPokemon(this, (session.run?.starterChoices ?? []).flatMap((id) => session.content.species.get(id) ?? []), { front: true });
  }

  create(): void {
    this.chosen = false;
    const { session } = services();
    const run = session.run!;
    const content = session.content;
    const archetype = content.archetypes.get(run.archetypeId)!;
    this.index = 0;
    this.cursors = [];
    this.boxes = [];
    const look = screenStyleOf('starter', session.settings.screenStyles, run.seed);
    this.lay = look === 'original' ? ORIGINAL : STARTER_LAYOUTS[look] ?? ORIGINAL;
    if (look !== 'original') dressScreen(this, 'starter', look, session.settings.battleAnimations);
    const L = this.lay;
    const dark = L.ink === '#ffffff';

    this.add.text(GAME_WIDTH / 2, 36, 'Choose your starter', textStyle(44, L.head)).setOrigin(0.5).setDepth(5);
    const pool = content.starterPools.get(run.prep.poolId);
    const rule = content.draftRules.get(run.prep.draftRuleId);
    const blind = rule?.kind === 'blind';
    this.add
      .text(GAME_WIDTH / 2, 74, run.prep.note ?? `Trainer: ${archetype.name}  ·  ${pool?.name ?? ''} pool  ·  ${rule?.name ?? ''}  ·  Seed: ${run.seed}`, textStyle(18, run.prep.note ? (dark || look === 'original' ? '#f0e0a0' : '#8a5a00') : look === 'original' ? '#a69cb4' : L.head))
      .setOrigin(0.5)
      .setDepth(5);

    this.detail = this.add.container(0, 0).setDepth(6);
    run.starterChoices.forEach((speciesId, i) => {
      const species = getSpecies(content, speciesId);
      const preview = createPokemon(content, speciesId, content.balance.starterLevel, 'preview');
      const moves = preview.moves.map((m) => content.moves.get(m.id)!.name).join(', ');
      const info = { species, preview, moves, blind: !!blind };
      if (L.mode === 'focus') this.buildFocus(i, info);
      else this.buildCard(i, info, look);
    });
    this.focus(0);

    this.add.text(GAME_WIDTH / 2, 516, '←/→ choose  ·  Enter confirm  ·  Esc menu (run is saved)', textStyle(18, look === 'original' ? '#a69cb4' : L.head)).setOrigin(0.5).setDepth(5);

    onInputAction(this, (action) => {
      if (action === 'left') this.focus((this.index + 2) % 3);
      if (action === 'right') this.focus((this.index + 1) % 3);
      if (action === 'confirm') this.choose(this.index);
      if (action === 'back') this.scene.start('MainMenu');
    });
  }

  private buildCard(i: number, info: Info, look: string): void {
    const L = this.lay;
    const { species, preview, moves, blind } = info;
    const g = L.card(i);
    const motion = services().session.settings.battleAnimations;
    const box = this.add.container(g.x + g.w / 2, g.y + g.h / 2).setAngle(g.rot);
    this.boxes.push(box);
    const lx = -g.w / 2;
    const ly = -g.h / 2;
    const body = this.add.graphics();
    const frame = this.add.graphics();
    const focusRing = (): void => {
      frame.clear().lineStyle(5, look === 'original' ? 0xf8d030 : 0xffd23a, 1);
      if (L.shape === 'egg') frame.strokeEllipse(0, 0, g.w + 8, g.h + 8);
      else if (L.shape === 'none') frame.strokeRoundedRect(lx - 4, ly - 4, g.w + 8, g.h + 8, 14);
      else frame.strokeRoundedRect(lx - 3, ly - 3, g.w + 6, g.h + 6, 12);
    };
    focusRing();
    switch (L.shape) {
      case 'glass': {
        if (look === 'original') box.add(drawPanel(this, lx, ly, g.w, g.h));
        else body.fillStyle(0xffffff, 0.55).fillRoundedRect(lx, ly, g.w, g.h, 22).lineStyle(3, 0xffffff, 0.95).strokeRoundedRect(lx, ly, g.w, g.h, 22);
        break;
      }
      case 'plain':
        body.fillStyle(0xffffff, 1).fillRoundedRect(lx, ly, g.w, g.h, 14).lineStyle(2, 0xc9d3de, 1).strokeRoundedRect(lx, ly, g.w, g.h, 14);
        break;
      case 'gold':
        body.fillStyle(0xf6d65a, 1).fillRoundedRect(lx, ly, g.w, g.h, 14).fillStyle(0xfdf4d6, 1).fillRoundedRect(lx + 10, ly + 10, g.w - 20, g.h - 20, 8).lineStyle(3, 0xb88a1a, 1).strokeRoundedRect(lx, ly, g.w, g.h, 14);
        break;
      case 'egg':
        body.fillStyle(0xfff6e6, 1).fillEllipse(0, 0, g.w, g.h).lineStyle(3, 0xf0d8c0, 1).strokeEllipse(0, 0, g.w, g.h);
        break;
      case 'column':
        body.fillStyle(L.fills?.[i] ?? 0xffffff, 1).fillRect(lx, ly, g.w, g.h).lineStyle(6, 0x111111, 1).strokeRect(lx, ly, g.w, g.h);
        break;
      case 'dark':
        body.fillStyle(0x0c1a34, 0.92).fillRoundedRect(lx, ly, g.w, g.h, 10).lineStyle(2, 0x3a5a9a, 1).strokeRoundedRect(lx, ly, g.w, g.h, 10);
        break;
      case 'none':
        body.fillStyle(0x0a1a3a, 0.78).fillRoundedRect(lx + 10, ly + g.h - 92, g.w - 20, 84, 10);
        break;
    }
    box.add(body);
    box.add(frame);
    this.cursors.push(frame);
    slideIn(this, box, 0, 24 + i * 8, motion);

    const compact = L.brief || g.h < 340;
    const cy = L.shape === 'egg' ? -g.h * 0.12 : L.shape === 'none' ? ly + g.h - 130 : ly + g.h * 0.4;
    if (blind) {
      box.add(this.add.text(0, cy, '?', textStyle(110, L.ink === '#ffffff' ? COLORS.textMuted : L.muted)).setOrigin(0.5));
      box.add(this.add.text(0, cy + 100, 'A hidden starter', textStyle(24, L.ink)).setOrigin(0.5, 0));
    } else {
      const vis = fitHeight(this, pokemonVisual(this, species, 'front', 0, cy, 3.5), 150 * (L.spriteK ?? 1)) as unknown as Phaser.GameObjects.GameObject;
      if (L.circle) box.add(this.add.circle(0, cy - 10, 84, [0xffb27a, 0x9ad0ff, 0xb6f0a0][i] ?? 0xffffff, 0.75).setStrokeStyle(3, 0xffffff, 0.9));
      box.add(vis);
      const ty = L.shape === 'egg' ? cy + 100 : L.shape === 'none' ? ly + g.h - 84 : cy + 90;
      box.add(this.add.text(0, ty, species.name, textStyle(compact ? 28 : 32, L.ink)).setOrigin(0.5, 0));
      let bx = -(species.types.length * 68) / 2;
      for (const t of species.types) {
        box.add(badge(this, bx, ty + (compact ? 34 : 40), t, TYPE_COLORS[t] ?? 0x888888));
        bx += 72;
      }
      if (compact) box.add(this.add.text(0, ty + 66, moves, textStyle(14, L.muted, { align: 'center', wordWrap: { width: g.w - 40 } })).setOrigin(0.5, 0));
      else {
        const b = species.baseStats;
        box.add(this.add.text(lx + 18, ty + 80, `HP ${b.hp}  Atk ${b.atk}  Def ${b.def}\nSpA ${b.spa}  SpD ${b.spd}  Spe ${b.spe}`, textStyle(17, L.muted)));
        box.add(this.add.text(lx + 18, ty + 136, `Lv ${preview.level} moves:\n${moves}`, textStyle(17, L.ink, { wordWrap: { width: g.w - 36 } })));
      }
    }
    const hit = this.add.zone(0, 0, g.w, g.h).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => this.focus(i));
    hit.on('pointerdown', () => {
      this.focus(i);
      this.choose(i);
    });
    box.add(hit);
  }

  /** Spotlight and Type Triangle: three Pokémon on the stage, one detail panel for the focused one. */
  private buildFocus(i: number, info: Info): void {
    const L = this.lay;
    const { species, preview, moves, blind } = info;
    const s = { ...L.spot!(L.circle ? i : i), k: 1 };
    const box = this.add.container(s.x, s.y).setDepth(4);
    this.boxes.push(box);
    if (L.circle) {
      const r = 70 * s.k;
      box.add(this.add.circle(0, -r * 0.6, r, 0xffffff, 0.28).setStrokeStyle(4, 0xffffff, 0.8));
    } else box.add(this.add.ellipse(0, 0, 150 * s.k, 24 * s.k, 0x000000, 0.35));
    if (blind) box.add(this.add.text(0, -60 * s.k, '?', textStyle(Math.round(90 * s.k), COLORS.textMuted)).setOrigin(0.5));
    else {
      const vis = fitHeight(this, pokemonVisual(this, species, 'front', 0, -10 * s.k, 3.5), 130 * s.k) as unknown as Phaser.GameObjects.GameObject;
      box.add(vis);
    }
    const hit = this.add.zone(0, -50 * s.k, 170 * s.k, 150 * s.k).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => this.focus(i));
    hit.on('pointerdown', () => {
      this.focus(i);
      this.choose(i);
    });
    box.add(hit);
    // Detail text is rebuilt on focus; keep the data on the box.
    box.setData('info', { name: blind ? '???' : species.name, types: blind ? [] : species.types, stats: species.baseStats, moves, level: preview.level });
  }

  private focus(i: number): void {
    this.index = i;
    this.cursors.forEach((c, n) => (c as unknown as Phaser.GameObjects.Graphics).setVisible?.(n === i));
    const L = this.lay;
    if (L.mode !== 'focus') return;
    const motion = services().session.settings.battleAnimations;
    this.boxes.forEach((b, n) => {
      const at = L.circle ? L.spot!(n) : L.spot!((n - i + 3) % 3);
      const k = L.circle ? (n === i ? at.k : at.k * 0.85) : at.k;
      const target = { scale: k, alpha: n === i ? 1 : 0.6, x: at.x, y: at.y };
      if (motion === 'off') b.setScale(k).setAlpha(target.alpha).setPosition(at.x, at.y);
      else this.tweens.add({ targets: b, ...target, duration: 260, ease: 'Back.easeOut' });
    });
    const info = this.boxes[i]!.getData('info') as { name: string; types: string[]; stats: Record<string, number>; moves: string; level: number };
    this.detail.removeAll(true);
    const p = L.panel!;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRoundedRect(p.x, p.y, p.w, p.h, 12).lineStyle(2, 0xffffff, 0.7).strokeRoundedRect(p.x, p.y, p.w, p.h, 12);
    this.detail.add(g);
    this.detail.add(this.add.text(p.x + 16, p.y + 10, info.name, textStyle(30, '#ffffff')));
    let bx = p.x + 16;
    for (const t of info.types) {
      this.detail.add(badge(this, bx, p.y + 50, t, TYPE_COLORS[t] ?? 0x888888));
      bx += 72;
    }
    const b = info.stats;
    this.detail.add(this.add.text(p.x + 16, p.y + 84, `HP ${b.hp}  Atk ${b.atk}  Def ${b.def}  SpA ${b.spa}  SpD ${b.spd}  Spe ${b.spe}\nLv ${info.level} moves: ${info.moves}`, textStyle(16, '#e8f0ff', { wordWrap: { width: p.w - 32 } })));
  }

  private choose(i: number): void {
    // Mashed presses arrive before the scene switch finishes (#122): only the first counts.
    if (this.chosen) return;
    this.chosen = true;
    services().session.chooseStarter(i);
    this.scene.start('Briefing');
  }
}

interface Info {
  species: ReturnType<typeof getSpecies>;
  preview: ReturnType<typeof createPokemon>;
  moves: string;
  blind: boolean;
}
