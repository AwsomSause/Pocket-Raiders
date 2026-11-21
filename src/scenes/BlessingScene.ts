// The Legendary Blessing opening: shown once after the starter is chosen, when the run has a blessing.
// The original cutscene (black screen, the blessing's item on the left, the passage on the right), kept in its order
// and made holy (Kice 2026-11-19, animation redesign pass 15): a bell tolls three times in the dark, light comes down
// through a rose window, the object descends in it under a halo and the Legendary appears behind it, vast and pale.
// The passage is written like scripture, a line at a time after an illuminated letter. Candles light, feathers fall,
// and at the end the light comes down on your partner, who bows under its own small halo.
// Confirm finishes the sequence at once, a second confirm goes on to the briefing. Outcomes never depend on this screen:
// the blessing was rolled at run start. Respects the animation settings: Reduced shows each part with a short fade and
// no flashes, particles or drifting; Off shows everything at once.

import Phaser from 'phaser';
import { BLESSINGS, getBlessing, reliquary, VOWS, type BlessingDef, type BlessingState } from '../core/blessings';
import { services } from '../game/services';
import { playCry } from '../ui/audio';
import { candle, feather, glint, halo, lightRays, lightShaft, riteRnd, RITE, roseWindow, tollRing } from '../ui/blessingRite';
import { onInputAction } from '../ui/input';
import { loadAssets, pokemonArtIds } from '../ui/lazyAssets';
import { playBellToll } from '../ui/procAudio';
import { useLookFont } from '../ui/redux/canvasFont';
import { monFile } from '../ui/redux/game';
import { mountRedux, phantomOn, pocketOn, reduxOn, type ReduxView } from '../ui/redux/stage';
import { pkBlessing } from '../ui/pocket/screens/run';
import { BLESSING_ROWS, phBlessing } from '../ui/phantom/screens/ending';
import { pokemonVisual } from '../ui/sprites';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';

const TIER_LABEL = { lesser: 'LESSER', greater: 'GREATER', divine: 'DIVINE', primordial: 'PRIMORDIAL', origin: 'ORIGIN' } as const;

/** One beat of the opening: when it starts (ms at full motion), what it plays, and how it stands once it is over. */
interface Step {
  at: number;
  start: () => void;
  end: () => void;
}

type Fades = Phaser.GameObjects.GameObject & { alpha: number; setAlpha(n: number): unknown };

export class BlessingScene extends Phaser.Scene {
  private steps: Step[] = [];
  /** Slow endless motion (the bob, the turning window, the flames), started again after a skip. */
  private loops: Array<() => void> = [];
  /** Things that fly once and remove themselves (rings, feathers, motes): a skip clears them. */
  private passing: Phaser.GameObjects.GameObject[] = [];
  private finished = false;
  private leaving = false;
  private timers: Phaser.Time.TimerEvent[] = [];

  constructor() {
    super('Blessing');
  }

  create(): void {
    useLookFont(this);
    const { session } = services();
    const run = session.run!;
    const state = run.expansion?.blessing;
    const def = state ? getBlessing(state.id) : undefined;
    if (!state || !def) return void this.scene.start('Briefing');
    this.steps = [];
    this.loops = [];
    this.passing = [];
    this.finished = false;
    this.leaving = false;
    this.timers = [];
    const st = session.settings;
    const motion = st.disableAllAnimations ? 'off' : st.battleAnimations;
    const full = motion === 'full';
    const flashK = st.reducedFlash ? 0 : st.effectIntensity;
    const particles = full && !st.reduceParticles;
    this.cameras.main.setBackgroundColor(RITE.night);
    // Phantom UI: the opening is the mock-ups' `blessing` page (the same beats, the same vow, the same way on).
    if (reduxOn() && (phantomOn() || pocketOn())) return this.createPhantom(state, def);

    const X = 250;
    const Y = 214;
    /** A beat. Reduced motion shows its end state with a short fade of `calm` instead of playing it. */
    const add = (at: number, start: () => void, end: () => void, calm: Fades[] = []): void => {
      const quiet = (): void => {
        end();
        for (const o of calm) {
          const a = o.alpha;
          o.setAlpha(0);
          this.tweens.add({ targets: o, alpha: a, duration: 250 });
        }
      };
      this.steps.push({ at, start: full ? start : quiet, end });
    };
    const appear = (at: number, o: Fades, ms: number, alpha = 1): void => add(at, () => void this.tweens.add({ targets: o, alpha, duration: ms }), () => void o.setAlpha(alpha), [o]);
    const once = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.passing.push(o);
      return o;
    };
    const flash = (color: number, alpha: number, ms: number): void => {
      if (alpha * flashK <= 0.01) return;
      const r = once(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, color, alpha * flashK).setDepth(40));
      this.tweens.add({ targets: r, alpha: 0, duration: ms, ease: 'Quad.easeIn', onComplete: () => r.destroy() });
    };
    const loop = (fn: () => void): (() => void) => {
      if (full) this.loops.push(fn);
      return full ? fn : () => undefined;
    };

    // A bell tolls three times in the dark: a ring of light spreads from above with each toll.
    [300, 1500, 2700].forEach((at, i) =>
      add(at, () => {
        playBellToll(this, 1 - i * 0.12);
        once(tollRing(this, X, -20, 10, 620, 2200, RITE.gold, 0.5 - i * 0.1).setDepth(3));
        flash(RITE.gold, 0.06 + i * 0.02, 500);
      }, () => undefined),
    );

    // Light comes down from above through a rose window.
    const shaft = lightShaft(this, X).setDepth(3).setAlpha(0).setName('rite.shaft');
    const breatheShaft = loop(() => void this.tweens.add({ targets: shaft, alpha: 0.75, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    add(600, () => {
      shaft.setScale(0.15, 1);
      this.tweens.add({ targets: shaft, alpha: 1, duration: 500 });
      this.tweens.add({ targets: shaft, scaleX: 1, delay: 500, duration: 1400, ease: 'Cubic.easeOut', onComplete: breatheShaft });
    }, () => void shaft.setAlpha(1).setScale(1, 1), [shaft]);
    const glass = roseWindow(this, X, Y).setDepth(1).setAlpha(0).setName('rite.window');
    loop(() => void this.tweens.add({ targets: glass, angle: glass.angle + 360, duration: 540_000, repeat: -1 }))();
    appear(1200, glass, 1600, 0.3);
    const rays = lightRays(this, X, Y).setDepth(2).setAlpha(0).setName('rite.rays');
    loop(() => void this.tweens.add({ targets: rays, angle: rays.angle - 360, duration: 108_000, repeat: -1 }))();
    appear(2600, rays, 1000, 0.3);
    // Motes of light rise in the shaft.
    const motes = loop(() => {
      if (!particles) return;
      for (let i = 0; i < 26; i++) {
        const y0 = riteRnd(120, 480);
        const rise = riteRnd(60, 140);
        const m = once(this.add.circle(X + riteRnd(-120, 120), y0, 2, RITE.pale).setDepth(5).setAlpha(0));
        const k = { u: 0 };
        this.tweens.add({ targets: k, u: 1, delay: riteRnd(0, 3000), duration: riteRnd(3000, 6000), repeat: -1, onUpdate: () => m.active && m.setY(y0 - rise * k.u).setAlpha(0.8 * Math.sin(Math.PI * k.u)) });
      }
    });
    add(1000, motes, () => undefined);

    // Candles stand in the dark on both sides; they are lit when the blessing is given.
    const candles = ([[60, 46], [108, 70], [156, 54], [344, 54], [392, 70], [440, 46]] as const).map(([x, h]) => candle(this, x, 500, h));
    candles.forEach((c) => {
      c.stick.setDepth(6).setAlpha(0);
      c.glow.setDepth(6);
      c.flame.setDepth(7);
      appear(1400, c.stick, 1200, 0.5);
    });

    // The object descends in the light under a halo, then floats.
    const itemImg = this.add.image(X, Y, '__DEFAULT').setAlpha(0).setVisible(false).setDepth(8);
    const itemGlow = this.add.circle(X, Y, 70, RITE.pale, 0.16).setBlendMode(Phaser.BlendModes.ADD).setDepth(7).setAlpha(0);
    const ring = halo(this, X, Y - 96, 150, 40).setDepth(9).setAlpha(0).setName('rite.halo');
    // Whatever stands for the object (its picture, or the stand-in orb) moves as one with the halo and the glow.
    const body: Array<Fades & { y: number }> = [itemImg];
    const follow = (): void => {
      ring.setY(itemImg.y - 96).setAlpha(itemImg.alpha);
      itemGlow.setY(itemImg.y);
      for (const o of body) if (o !== itemImg && o.active) (o as unknown as Phaser.GameObjects.Components.Transform).setY(itemImg.y);
    };
    this.events.on(Phaser.Scenes.Events.UPDATE, follow);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.UPDATE, follow));
    const bob = loop(() => void this.tweens.add({ targets: itemImg, y: Y - 12, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    add(1600, () => {
      itemImg.setY(-60).setAlpha(1);
      this.tweens.add({ targets: itemImg, y: Y, duration: 1700, ease: 'Cubic.easeOut', onComplete: bob });
    }, () => void itemImg.setY(Y).setAlpha(1), [itemImg]);
    add(3200, () => {
      this.tweens.add({ targets: itemGlow, alpha: 1, duration: 500 });
      flash(RITE.pale, 0.25, 500);
    }, () => void itemGlow.setAlpha(1), [itemGlow]);
    const showItem = (): boolean => {
      if (!this.sys.isActive() || !this.textures.exists(def.item)) return false;
      itemImg.setTexture(def.item).setScale(6.5).setVisible(true);
      return true;
    };
    // Missing art must never leave the left half empty: a plain glowing orb with the Legendary's initial stands in.
    const stand = (): void => {
      if (!this.sys.isActive() || itemImg.visible) return;
      const orb = this.add.circle(X, itemImg.y, 64, 0xc8b8e8, 0.35).setDepth(8).setAlpha(0);
      const letter = this.add.text(X, itemImg.y, def.legendary.charAt(0).toUpperCase(), textStyle(64, '#fff2c0')).setOrigin(0.5).setDepth(8).setAlpha(0);
      body.push(orb, letter);
      this.tweens.add({ targets: [orb, letter], alpha: 1, duration: 600 });
    };
    // Load the picture; if it did not arrive (a failed request), ask once more with a fresh address, then use the stand-in.
    void loadAssets(this, [def.item]).then(async () => {
      if (showItem()) return;
      const key = def.item;
      await new Promise<void>((done) => {
        if (!this.sys.isActive() || this.textures.exists(key)) return done();
        this.load.once(Phaser.Loader.Events.COMPLETE, () => done());
        this.load.image(key, `assets/images/items/${key.replace(/^item\./, '')}.png?r=${Date.now() % 100000}`);
        if (!this.load.isLoading()) this.load.start();
      });
      if (!showItem()) stand();
    });

    // The Legendary appears behind it, vast and pale, and breathes.
    const legend = def.speciesId ? session.content.species.get(def.speciesId) : undefined;
    let vision: Phaser.GameObjects.Sprite | null = null;
    let visionOn = false;
    const breatheVision = loop(() => vision && void this.tweens.add({ targets: vision, y: vision.y - 12, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    add(3400, () => {
      visionOn = true;
      if (vision) {
        this.tweens.add({ targets: vision, alpha: 0.22, y: vision.y - 20, duration: 1600, ease: 'Quad.easeOut', onComplete: breatheVision });
      }
      for (let i = 0; i < 3; i++) this.timers.push(this.time.delayedCall(200 + i * 350, () => void once(tollRing(this, X, Y, 60, 330, 1400, RITE.sky, 0.5).setDepth(4))));
    }, () => {
      visionOn = true;
      vision?.setAlpha(0.22).setY(Y + 190);
    }, []);
    add(1700, () => { if (legend) playCry(this, legend, 70); }, () => undefined);
    if (legend) {
      void loadAssets(this, pokemonArtIds([legend], { front: true, cry: true })).then(() => {
        if (!this.sys.isActive()) return;
        const v = pokemonVisual(this, legend, 'front', X, Y + 210, 1);
        if (!(v instanceof Phaser.GameObjects.Sprite)) return void v.destroy();
        v.setScale(400 / Math.max(1, v.height)).setTintFill(0xffffff).setDepth(4).setAlpha(0).setName('rite.vision');
        vision = v;
        if (!visionOn) return;
        // It arrived late: it fades in where it would be standing by now.
        v.setY(Y + 190);
        if (motion === 'off') v.setAlpha(0.22);
        else this.tweens.add({ targets: v, alpha: 0.22, duration: 400 });
      });
    }

    // The words, on the right: the tier, the name over a gold rule, then the passage like scripture.
    const x = 470;
    const w = GAME_WIDTH - x - 40;
    const fit = (t: Phaser.GameObjects.Text, max = w): Phaser.GameObjects.Text => (t.width > max ? t.setScale(max / t.width) : t);
    const tier = this.add.text(x + 22, 58, `${TIER_LABEL[state.tier]} BLESSING`, textStyle(16, '#c8b8e8')).setAlpha(0).setDepth(20);
    const tierMarks = [glint(this, x + 8, 58 + tier.height / 2, 14), glint(this, x + 36 + tier.width, 58 + tier.height / 2, 14)].map((g) => g.setFillStyle(0xc8b8e8).setDepth(20).setAlpha(0));
    const title = fit(this.add.text(x, 82, def.name.toUpperCase(), textStyle(40, '#fff2c0')).setAlpha(0).setDepth(20));
    const rule = this.add.rectangle(x, 134, w, 2, RITE.gold).setOrigin(0, 0.5).setDepth(20).setScale(0, 1);
    appear(2600, tier, 900);
    tierMarks.forEach((g) => appear(2600, g, 900));
    add(2900, () => {
      title.setY(92);
      this.tweens.add({ targets: title, alpha: 1, y: 82, duration: 900, ease: 'Quad.easeOut' });
    }, () => void title.setAlpha(1).setY(82), [title]);
    add(3300, () => void this.tweens.add({ targets: rule, scaleX: 1, duration: 900, ease: 'Cubic.easeOut' }), () => void rule.setScale(1, 1));

    // An illuminated first letter, then the passage a line at a time.
    const words = def.passage.trim();
    const cap = this.add.container(x + 23, 177, [this.add.rectangle(0, 0, 46, 50, RITE.gold).setStrokeStyle(2, 0xfff7d8, 0.6), this.add.text(0, 0, words.charAt(0).toUpperCase(), textStyle(40, '#1c1440', { shadow: undefined })).setOrigin(0.5)]).setDepth(20).setAlpha(0);
    const lineStyle = textStyle(18, '#e8e0f4', { fontStyle: 'italic' });
    const probe = this.add.text(0, 0, '', { ...lineStyle, wordWrap: { width: w - 58 } }).setVisible(false);
    const narrow = probe.getWrappedText(words.slice(1));
    probe.setWordWrapWidth(w);
    const rows = [...narrow.slice(0, 2), ...(narrow.length > 2 ? probe.getWrappedText(narrow.slice(2).join(' ')) : [])];
    probe.destroy();
    const lines = rows.map((row, i) => this.add.text(i < 2 ? x + 58 : x, 158 + i * 28, row, lineStyle).setDepth(20).setAlpha(0));
    add(4200, () => {
      cap.setScale(0.6);
      this.tweens.add({ targets: cap, alpha: 1, scale: 1, duration: 500, ease: 'Back.easeOut' });
    }, () => void cap.setAlpha(1).setScale(1), [cap]);
    lines.forEach((line, i) =>
      add(4700 + i * 800, () => {
        // Written on from the left, like a pen crossing the page.
        const k = { u: 0 };
        line.setAlpha(1).setCrop(0, 0, 0, line.height);
        this.tweens.add({ targets: k, u: 1, duration: 900, onUpdate: () => line.setCrop(0, 0, line.width * k.u, line.height), onComplete: () => line.setCrop() });
      }, () => void line.setAlpha(1).setCrop(), [line]),
    );

    // It has blessed your journey: the light flares, the candles catch one by one from the middle out, feathers fall.
    const B = Math.max(8000, 4700 + lines.length * 800 + 500);
    const blessedY = Math.max(290, 158 + lines.length * 28 + 16);
    const blessed = fit(this.add.text(x, blessedY, `${def.legendary} has blessed your journey.`, textStyle(20, '#f0d890')).setAlpha(0).setDepth(20));
    add(B, () => {
      this.tweens.add({ targets: blessed, alpha: 1, duration: 900 });
      flash(RITE.pale, 0.3, 800);
      for (let i = 0; i < 3; i++) this.timers.push(this.time.delayedCall(i * 200, () => void once(tollRing(this, X, Y, 40, 300 + i * 80, 1200, RITE.pale, 0.6, 3).setDepth(9))));
      if (!particles) return;
      for (let i = 0; i < 18; i++) {
        const fx = riteRnd(40, 920);
        const f = once(feather(this, fx, -30, i % 2 === 1).setDepth(30).setAngle(riteRnd(0, 90)));
        const k = { u: 0 };
        const spin = riteRnd(200, 500);
        const a0 = f.angle;
        this.tweens.add({ targets: k, u: 1, delay: riteRnd(0, 2500), duration: riteRnd(3000, 4500), onUpdate: () => f.active && f.setPosition(fx + 36 * Math.sin(k.u * 10 + i), -30 + 610 * k.u).setAngle(a0 + spin * k.u), onComplete: () => f.destroy() });
      }
    }, () => void blessed.setAlpha(1), [blessed]);
    candles.forEach((c, i) => {
      const flicker = loop(() => void this.tweens.add({ targets: c.flame, scaleY: 1.2, angle: 5, duration: 250 + i * 35, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
      add(B + 200 + Math.abs(i - 2.5) * 220, () => {
        this.tweens.add({ targets: c.stick, alpha: 1, duration: 400 });
        this.tweens.add({ targets: c.flame, scale: 1, duration: 250, ease: 'Back.easeOut', onComplete: flicker });
        this.tweens.add({ targets: c.glow, alpha: 1, duration: 300 });
      }, () => {
        c.stick.setAlpha(1);
        c.flame.setScale(1).setAngle(0);
        c.glow.setAlpha(1);
      }, [c.glow]);
    });

    // What the blessing does, on a panel that unrolls.
    const panelY = blessedY + 34;
    const head = fit(this.add.text(x, panelY + 14, def.headline, textStyle(26, '#ffffff')).setAlpha(0).setDepth(20));
    const sum = this.add.text(x, panelY + 50, def.summary, textStyle(19, '#d8d0e8', { wordWrap: { width: w }, lineSpacing: 4 })).setAlpha(0).setDepth(20);
    // A long effect still ends above the prompt.
    const room = 498 - sum.y;
    if (sum.height > room) sum.setScale(Math.max(0.7, room / sum.height)).setWordWrapWidth(w / Math.max(0.7, room / sum.height));
    const vowRoom = def.effect.kind === 'vow' && !state.vow ? VOWS.length * 30 + 4 : 0;
    const panelH = Math.min(GAME_HEIGHT - 8 - panelY, Math.max(sum.y + sum.displayHeight + 14 - panelY, vowRoom ? 446 + vowRoom - panelY : 0));
    const panel = this.add.rectangle(x - 14, panelY, w + 28, panelH, 0x1c1440, 0.8).setOrigin(0, 0).setStrokeStyle(2, RITE.gold, 0.4).setDepth(19).setScale(1, 0).setName('rite.panel');
    add(B + 1400, () => void this.tweens.add({ targets: panel, scaleY: 1, duration: 500, ease: 'Cubic.easeOut' }), () => void panel.setScale(1, 1), [panel]);
    appear(B + 1700, head, 700);
    appear(B + 2000, sum, 700);

    // At the end the light comes down on your partner, who bows under its own small halo.
    const P = B + 2800;
    const pal = run.party[0];
    const palSpecies = pal ? session.content.species.get(pal.speciesId) : undefined;
    let partner: Phaser.GameObjects.Sprite | null = null;
    let partnerOn = false;
    let bowed = false;
    const small = halo(this, X, 366, 86, 22, 4).setDepth(9).setAlpha(0).setName('rite.partnerHalo');
    const haloY = (): number => (partner ? 492 - partner.displayHeight * 0.82 : 366);
    const bow = (): void => {
      bowed = true;
      partner?.setScale(partner.scaleX, Math.abs(partner.scaleX) * 0.9).setAngle(5);
    };
    const floatHalo = loop(() => void this.tweens.add({ targets: small, y: haloY() - 5, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    add(P, () => {
      partnerOn = true;
      if (partner) this.tweens.add({ targets: partner, alpha: 1, duration: 700 });
    }, () => {
      partnerOn = true;
      partner?.setAlpha(1);
    });
    add(P + 600, () => {
      const mote = once(this.add.circle(X, Y, 7, 0xffffff).setStrokeStyle(6, RITE.gold, 0.5).setDepth(10));
      this.tweens.add({ targets: mote, y: haloY() + 6, duration: 800, ease: 'Sine.easeInOut', onComplete: () => this.tweens.add({ targets: mote, alpha: 0, scale: 3, duration: 200, onComplete: () => mote.destroy() }) });
    }, () => undefined);
    add(P + 1400, () => {
      small.setY(haloY() - 36).setScale(2);
      this.tweens.add({ targets: small, alpha: 1, scale: 1, y: haloY(), duration: 400, ease: 'Cubic.easeOut', onComplete: floatHalo });
      flash(RITE.pale, 0.2, 500);
      if (partner) this.tweens.add({ targets: partner, scaleY: Math.abs(partner.scaleX) * 0.9, angle: 5, delay: 100, duration: 500, ease: 'Sine.easeInOut', onComplete: () => (bowed = true) });
      else bowed = true;
      if (!particles) return;
      for (let i = 0; i < 8; i++) {
        const g = once(glint(this, X + riteRnd(-80, 80), 420 + riteRnd(-60, 50)).setDepth(10).setScale(0));
        this.tweens.add({ targets: g, scale: 1, angle: 90, delay: 100 + i * 80, duration: 250, yoyo: true, onComplete: () => g.destroy() });
      }
    }, () => {
      small.setAlpha(1).setScale(1).setY(haloY());
      bow();
    }, [small]);
    if (palSpecies) {
      void loadAssets(this, pokemonArtIds([palSpecies], { front: true, shiny: Boolean(pal?.shiny) })).then(() => {
        if (!this.sys.isActive()) return;
        const v = pokemonVisual(this, palSpecies, 'front', X, 492, 3, Boolean(pal?.shiny));
        if (!(v instanceof Phaser.GameObjects.Sprite)) return void v.destroy();
        if (v.displayHeight > 170) v.setScale((v.scaleX * 170) / v.displayHeight);
        v.setDepth(8).setAlpha(partnerOn ? 1 : 0).setName('rite.partner');
        partner = v;
        if (bowed) bow();
        if (small.alpha > 0) small.setY(haloY());
      });
    }

    const prompt = this.add.text(GAME_WIDTH - 24, GAME_HEIGHT - 28, 'Enter to continue', textStyle(14, '#8a7f96')).setOrigin(1, 0).setAlpha(0).setDepth(20);
    const blink = loop(() => void this.tweens.add({ targets: prompt, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 }));
    add(P + 2200, () => void this.tweens.add({ targets: prompt, alpha: 1, duration: 500, onComplete: blink }), () => void prompt.setAlpha(1), [prompt]);

    if (motion === 'off') {
      this.finish();
      if (legend) playCry(this, legend, 70);
    } else {
      const last = Math.max(...this.steps.map((s) => s.at));
      for (const s of this.steps) {
        this.timers.push(this.time.delayedCall(full ? s.at : s.at / 3, () => {
          s.start();
          if (s.at === last) this.finished = true;
        }));
      }
    }

    // Zekrom's blessing: swear one vow before the run goes on (a choice; the bonus itself is a battle perk).
    let vowAt = -1;
    let vowRows: Phaser.GameObjects.Text[] = [];
    const drawVows = () => vowRows.forEach((t, i) => t.setColor(i === vowAt ? '#fff2c0' : '#a898c0').setText(`${i === vowAt ? '▶ ' : '   '}${VOWS[i]!.label}: ${VOWS[i]!.text}`));
    const askVow = (): boolean => {
      if (def.effect.kind !== 'vow' || run.expansion?.blessing?.vow) return false;
      if (vowAt < 0) {
        vowAt = 0;
        sum.setText('Swear one vow for the run:');
        prompt.setText('Up/Down to choose, Enter to swear');
        vowRows = VOWS.map((_, i) => this.add.text(x, 446 + i * 30, '', textStyle(17, '#a898c0', { wordWrap: { width: w } })).setDepth(20).setInteractive({ useHandCursor: true }).on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, e: Phaser.Types.Input.EventData) => { e.stopPropagation(); vowAt = i; next(); }));
        drawVows();
        return true;
      }
      session.swearVow(VOWS[vowAt]!.id);
      return false;
    };
    const next = () => {
      if (this.leaving) return;
      if (!this.finished) return this.finish();
      if (askVow()) return;
      this.leaving = true;
      if (run.expansion?.blessing) run.expansion.blessing.seen = true;
      session.saveRunNow();
      this.scene.start('Briefing');
    };
    onInputAction(this, (a) => {
      if (vowAt >= 0 && (a === 'up' || a === 'down')) { vowAt = (vowAt + (a === 'up' ? VOWS.length - 1 : 1)) % VOWS.length; drawVows(); return; }
      if (a === 'confirm' || (a === 'back' && vowAt < 0)) next();
    });
    this.input.on('pointerdown', next);
  }

  /**
   * Phantom UI (and the Pocket look): the blessing as a page of its own. The beats arrive on the same clock as the canvas opening (a first
   * Confirm shows all of it), a Vow is sworn before going on, and C reads the Reliquary: every blessing found so far.
   */
  private createPhantom(state: BlessingState, def: BlessingDef): void {
    const { session } = services();
    const run = session.run!;
    const motion = session.settings.battleAnimations;
    const fast = motion !== 'full';
    const roman = (n: number): string => [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]].reduce((out, [s, v]) => { while (n >= (v as number)) { out += s; n -= v as number; } return out; }, '');
    const cry = (): void => { const sp = def.speciesId && session.content.species.get(def.speciesId); if (sp) playCry(this, sp, 70); };
    const all = reliquary(session.profile.blessings);
    const pages = Math.max(1, Math.ceil(all.length / BLESSING_ROWS));
    // The Pocket look deals the card in one move (its own CSS), so it starts with every beat shown.
    const still = motion === 'off' || pocketOn();
    let step = still ? 5 : 0, vowAt = -1, book = -1;
    let view: ReduxView | null = null;
    const draw = (): void => view?.refresh();
    const steps: [number, number][] = [[600, 1], [2600, 2], [4200, 3], [8200, 4], [11500, 5]];
    if (still) cry();
    else {
      for (const [delay, to] of steps) this.timers.push(this.time.delayedCall(fast ? delay / 3 : delay, () => { step = Math.max(step, to); draw(); }));
      this.timers.push(this.time.delayedCall(fast ? 1700 / 3 : 1700, cry));
    }
    const needsVow = (): boolean => def.effect.kind === 'vow' && !run.expansion?.blessing?.vow;
    const next = (): void => {
      if (this.leaving || book >= 0) return;
      if (step < 5) {
        for (const t of this.timers) t.remove(false);
        this.timers = [];
        step = 5;
        return draw();
      }
      if (needsVow()) {
        if (vowAt < 0) { vowAt = 0; return draw(); }
        session.swearVow(VOWS[vowAt]!.id);
      }
      this.leaving = true;
      if (run.expansion?.blessing) run.expansion.blessing.seen = true;
      session.saveRunNow();
      this.scene.start('Briefing');
    };
    const toggleBook = (): void => { book = book >= 0 ? -1 : Math.max(0, Math.floor(all.findIndex((b) => b.id === state.id) / BLESSING_ROWS)); draw(); };
    view = mountRedux(this, {
      render: (c) => (c.pk ? pkBlessing({
        tier: state.tier[0]!.toUpperCase() + state.tier.slice(1), name: def.name, legendary: def.legendary,
        mon: def.speciesId ? monFile(this, def.speciesId, 'front') : null, headline: def.headline, summary: def.summary, passage: def.passage,
        vows: vowAt >= 0 ? VOWS.map((v) => ({ label: v.label, text: v.text })) : null, vowAt,
        book: book >= 0 ? { rows: all.slice(book * BLESSING_ROWS, (book + 1) * BLESSING_ROWS).map((b) => ({ name: b.name, tier: b.tier, text: b.text, found: b.found, mine: b.id === state.id })), page: book, pages, found: all.filter((b) => b.found).length, of: all.length } : null,
      }) : c.ph ? phBlessing(c.ph, {
        tier: state.tier[0]!.toUpperCase() + state.tier.slice(1),
        name: def.name,
        legendary: def.legendary,
        mon: def.speciesId ? monFile(this, def.speciesId, 'front') : null,
        number: roman(BLESSINGS.indexOf(def) + 1),
        passage: def.passage,
        headline: def.headline,
        summary: def.summary,
        step,
        vows: vowAt >= 0 ? VOWS.map((v) => ({ label: v.label, text: v.text })) : null,
        vowAt,
        book: book >= 0 ? { rows: all.slice(book * BLESSING_ROWS, (book + 1) * BLESSING_ROWS).map((b) => ({ name: b.name, legendary: b.legendary, tier: b.tier, text: b.text, found: b.found, mine: b.id === state.id })), page: book, pages, found: all.filter((b) => b.found).length, of: all.length } : null,
      }) : ''),
      acts: { next, book: toggleBook, vow: (i) => { if (vowAt < 0) return; if (Number(i) === vowAt) next(); else { vowAt = Number(i); draw(); } } },
      overs: { over: (i) => { if (vowAt >= 0 && Number(i) !== vowAt) { vowAt = Number(i); draw(); } } },
    });
    this.input.keyboard?.on('keydown-C', toggleBook);
    onInputAction(this, (a) => {
      if (book >= 0) {
        if (a === 'back' || a === 'confirm') toggleBook();
        else { book = (book + (a === 'left' || a === 'up' ? pages - 1 : 1)) % pages; draw(); }
        return;
      }
      if (vowAt >= 0 && (a === 'up' || a === 'down')) { vowAt = (vowAt + (a === 'up' ? VOWS.length - 1 : 1)) % VOWS.length; return draw(); }
      if (a === 'confirm' || (a === 'back' && vowAt < 0)) next();
    });
    this.events.once('shutdown', () => { try { view?.destroy(); } catch { /* already gone */ } });
  }

  /** Shows everything at once (a first Confirm, or animations off): every beat in its end state, then the slow idle motion. */
  private finish(): void {
    for (const t of this.timers) t.remove(false);
    this.timers = [];
    this.tweens.killAll();
    for (const o of this.passing) if (o.active) o.destroy();
    this.passing = [];
    for (const s of this.steps) s.end();
    for (const start of this.loops) start();
    this.finished = true;
  }
}
