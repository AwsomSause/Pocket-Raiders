// The evolution scene (both looks): "What? X is evolving!", the white silhouette flickering between the old and the
// new form faster and faster, a flash, the new form in colour and its cry, then "Congratulations!". Played after the
// rules have already evolved the Pokémon (a battle's end, an evolution item, a reward, a hub lesson), so it only
// shows what happened. Every line stays until the player presses a key or clicks; a press during the flicker
// jumps to the reveal. Old UI draws it in Phaser, New UI as a full-screen card. A drawing failure resolves quietly.

import Phaser from 'phaser';
import { animSettingsFrom, animationTimeScale } from '../core/accessibility';
import { resolveAnim } from '../core/presentation/animRegistry';
import { evolutionLines, evolutionTimeline, evolutionsSince, partyLooks, type EvoMotion, type EvoTimeline } from '../core/presentation/evolutionScene';
import { transformAnimId } from '../core/presentation/transformAnims';
import type { Content } from '../core/contentSchema';
import { services } from '../game/services';
import { playCry, playCue, playSfxLazy } from './audio';
import { loadAssets, pokemonArtIds } from './lazyAssets';
import { monFile } from './redux/game';
import { esc, foot, mon, TX } from './redux/kit';
import { mountRedux, reduxOn } from './redux/stage';
import { pokemonVisual, type Visual } from './sprites';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PIXEL_SCALE, textStyle } from './theme';

export interface EvolutionShow {
  from: string;
  to: string;
  shiny?: boolean;
  /** Names of the moves learned on evolving, one line each. */
  learned?: readonly string[];
}

const CONFIRM = new Set(['Enter', ' ', 'z', 'Z', 'x', 'X', 'Escape', 'Backspace']);
/** A press this soon after a line shows is the press that opened it, not a new one. */
const GUARD_MS = 220;

/** True when `to` is reached from `from` by evolving (one or more steps). */
export function isEvolutionOf(content: Content, from: string, to: string): boolean {
  let level = [from];
  for (let depth = 0; depth < 4 && level.length; depth++) {
    const next = level.flatMap((id) => content.species.get(id)?.evolutions.map((e) => e.to) ?? []);
    if (next.includes(to)) return true;
    level = next;
  }
  return false;
}

function motionNow(): { motion: EvoMotion; speed: number; flash: number } {
  const s = services().session.settings;
  const plan = resolveAnim(transformAnimId('evolve'), animSettingsFrom(s));
  if (!plan?.play) return { motion: 'off', speed: 1, flash: 0 };
  return { motion: plan.reduced ? 'reduced' : 'full', speed: 1 / animationTimeScale(s), flash: plan.flash };
}

/** The run's party species, taken before an action that may evolve someone. */
export const partyBefore = (): Map<string, string> => partyLooks(services().session.run?.party ?? []);

/** Who evolved since `before` (party order), ready for `playEvolutions`. */
export function evolutionsAfter(before: ReadonlyMap<string, string>): EvolutionShow[] {
  const { session } = services();
  return evolutionsSince(before, session.run?.party ?? [], (a, b) => isEvolutionOf(session.content, a, b));
}

/**
 * Runs `action` (which changes the run and returns a message), then plays the scene for every party Pokémon that
 * evolved because of it, then calls `then` with the message. Use around any out-of-battle action that can evolve.
 */
export function withEvolutionScene(scene: Phaser.Scene, action: () => string, then: (message: string) => void): void {
  const before = partyBefore();
  const message = action();
  const seen = evolutionsAfter(before);
  if (!seen.length) return then(message);
  void playEvolutions(scene, seen).then(() => then(message));
}

/** Plays the scene for each evolution in turn. */
export async function playEvolutions(scene: Phaser.Scene, shows: readonly EvolutionShow[]): Promise<void> {
  for (const s of shows) await playEvolution(scene, s);
}

/** Plays one evolution. Resolves once the last line is dismissed (at once if the scene is gone). */
export async function playEvolution(scene: Phaser.Scene, show: EvolutionShow): Promise<void> {
  const content = services().session.content;
  const fromSp = content.species.get(show.from);
  const toSp = content.species.get(show.to);
  if (!fromSp || !toSp || !scene.sys.isActive()) return;
  const lines = evolutionLines(fromSp.name, toSp.name, show.learned);
  const feel = motionNow();
  const tl = evolutionTimeline(feel.motion, feel.speed);
  try {
    if (reduxOn()) await playCard(scene, show, lines, tl, feel.flash);
    else {
      // The art first (with a short limit), so the flicker starts on real sprites.
      await Promise.race([loadAssets(scene, pokemonArtIds([fromSp, toSp], { front: true, shiny: !!show.shiny, cry: true })), new Promise((r) => setTimeout(r, 2500))]).catch(() => undefined);
      if (!scene.sys.isActive()) return;
      await playCanvas(scene, show, lines, tl, feel.flash);
    }
  } catch (e) {
    console.warn('Evolution scene failed', e);
  }
}

/** The shared driver: input, the flicker clock, the lines. The look draws through `draw`. */
interface Drawer {
  text(t: string): void;
  form(show: 'from' | 'to', silhouette: boolean): void;
  reveal(): void;
  close(): void;
}

function drive(scene: Phaser.Scene, show: EvolutionShow, lines: ReturnType<typeof evolutionLines>, tl: EvoTimeline, d: Drawer, pointer: (fn: () => void) => () => void): Promise<void> {
  const content = services().session.content;
  return new Promise((resolve) => {
    let over = false;
    let waiting: (() => void) | null = null;
    let shownAt = 0;
    const timers: Phaser.Time.TimerEvent[] = [];
    let skipFlicker: (() => void) | null = null;
    const press = (): void => {
      if (performance.now() - shownAt < GUARD_MS) return;
      if (waiting) {
        const w = waiting;
        waiting = null;
        w();
      } else skipFlicker?.();
    };
    // Captured on the window first, so the screen underneath never sees the presses meant for this scene.
    const onKey = (e: KeyboardEvent): void => {
      e.stopImmediatePropagation();
      e.preventDefault();
      if (!e.repeat && CONFIRM.has(e.key)) press();
    };
    window.addEventListener('keydown', onKey, true);
    // Tests (and screens) can see a line of this scene is waiting for a press.
    scene.data?.set('evolutionScene', true);
    const offPointer = pointer(press);
    const finish = (): void => {
      if (over) return;
      over = true;
      window.removeEventListener('keydown', onKey, true);
      scene.data?.set('evolutionScene', false);
      offPointer();
      timers.forEach((t) => t.remove(false));
      try {
        d.close();
      } catch {
        /* the scene may be gone */
      }
      resolve();
    };
    scene.events.once('shutdown', finish);
    const say = (t: string): Promise<void> =>
      new Promise((r) => {
        if (over) return r();
        d.text(t);
        shownAt = performance.now();
        waiting = r;
      });
    const flicker = (): Promise<void> =>
      new Promise((r) => {
        if (over || tl.revealAt <= 0) return r();
        playSfxLazy(scene, 'me.evo_start', 0.9);
        for (const b of tl.beats) timers.push(scene.time.delayedCall(b.at, () => !over && d.form(b.show, true)));
        const end = scene.time.delayedCall(tl.revealAt, () => r());
        timers.push(end);
        skipFlicker = () => {
          skipFlicker = null;
          timers.forEach((t) => t.remove(false));
          r();
        };
      });
    void (async () => {
      try {
        d.form('from', false);
        await say(lines.intro);
        if (tl.revealAt > 0) d.form('from', true);
        d.text('');
        await flicker();
        skipFlicker = null;
        if (over) return;
        d.form('to', false);
        d.reveal();
        playCue(scene, 'st_evolution_moment', 'me.evo_success');
        const sp = content.species.get(show.to);
        if (sp) scene.time.delayedCall(500, () => !over && playCry(scene, sp));
        for (const l of lines.outro) await say(l);
      } catch {
        /* a presentation failure never blocks the game */
      }
      finish();
    })();
  });
}

function playCanvas(scene: Phaser.Scene, show: EvolutionShow, lines: ReturnType<typeof evolutionLines>, tl: EvoTimeline, flash: number): Promise<void> {
  const content = services().session.content;
  const depth = 6000;
  const cx = GAME_WIDTH / 2;
  const cy = 330;
  const root = scene.add.container(0, 0).setDepth(depth).setName('cine-evolve');
  const shade = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050a14, 0.95).setOrigin(0).setInteractive();
  const glow = scene.add.graphics();
  for (let i = 6; i >= 1; i--) {
    glow.fillStyle(0x9fe8ff, 0.05 * (7 - i));
    glow.fillCircle(cx, cy - 70, 36 * i);
  }
  glow.setAlpha(0.35);
  root.add([shade, glow]);
  const make = (id: string): Visual => pokemonVisual(scene, content.species.get(id)!, 'front', cx, cy, PIXEL_SCALE * 1.4, !!show.shiny);
  const from = make(show.from);
  const to = make(show.to).setVisible(false);
  root.add([from, to]);
  // Light motes rising during the flicker (fixed places: no randomness).
  const motes: Phaser.GameObjects.Arc[] = [];
  for (let i = 0; i < 12; i++) {
    const m = scene.add.circle(cx + ((i % 6) - 2.5) * 46, cy + 30, 3 + (i % 3), 0xdff8ff, 0).setBlendMode(Phaser.BlendModes.ADD);
    motes.push(m);
    root.add(m);
  }
  const box = scene.add.rectangle(24, GAME_HEIGHT - 116, GAME_WIDTH - 48, 96, COLORS.panelDark, 0.96).setOrigin(0).setStrokeStyle(3, 0x9fe8ff, 0.9);
  const words = scene.add.text(48, GAME_HEIGHT - 100, '', textStyle(24, COLORS.textLight, { wordWrap: { width: GAME_WIDTH - 110 } }));
  const more = scene.add.text(GAME_WIDTH - 52, GAME_HEIGHT - 44, '▼', textStyle(18, COLORS.textLight)).setOrigin(0.5);
  scene.tweens.add({ targets: more, y: more.y + 4, duration: 400, yoyo: true, repeat: -1 });
  root.add([box, words, more]);
  const tint = (v: Visual, sil: boolean): void => {
    if (v instanceof Phaser.GameObjects.Sprite) {
      if (sil) v.setTintFill(0xffffff);
      else v.clearTint();
    }
  };
  let flickering = false;
  return drive(
    scene,
    show,
    lines,
    tl,
    {
      text: (t) => {
        words.setText(t);
        box.setVisible(!!t);
        more.setVisible(!!t);
      },
      form: (which, sil) => {
        from.setVisible(which === 'from');
        to.setVisible(which === 'to');
        tint(which === 'from' ? from : to, sil);
        if (sil && !flickering && tl.beats.length > 1) {
          flickering = true;
          scene.tweens.add({ targets: glow, alpha: 1, duration: tl.revealAt * 0.8 });
          motes.forEach((m, i) => scene.tweens.add({ targets: m, y: cy - 260, fillAlpha: { from: 0.9, to: 0 }, duration: 900, delay: (i * 140) % 1100, repeat: -1 }));
        }
      },
      reveal: () => {
        motes.forEach((m) => {
          scene.tweens.killTweensOf(m);
          m.setFillStyle(0xdff8ff, 0);
        });
        glow.setAlpha(0.5);
        if (flash > 0 && tl.flashMs > 0) {
          const white = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, Math.min(1, flash)).setOrigin(0);
          root.add(white);
          scene.tweens.add({ targets: white, alpha: 0, duration: tl.flashMs, onComplete: () => white.destroy() });
        }
        if (tl.revealAt > 0) scene.tweens.add({ targets: to, scale: { from: to.scale * 1.15, to: to.scale }, duration: 260, ease: 'Back.easeOut' });
      },
      close: () => root.destroy(),
    },
    (fn) => {
      shade.on('pointerdown', fn);
      return () => shade.off('pointerdown', fn);
    },
  );
}

function playCard(scene: Phaser.Scene, show: EvolutionShow, lines: ReturnType<typeof evolutionLines>, tl: EvoTimeline, flash: number): Promise<void> {
  const files = { from: monFile(scene, show.from, 'front', !!show.shiny), to: monFile(scene, show.to, 'front', !!show.shiny) };
  const st = { text: '', which: 'from' as 'from' | 'to', sil: false, flicker: false, revealed: false };
  const view = mountRedux(scene, {
    card: true,
    render: () => {
      const f = files[st.which];
      const pic = f ? mon(f, 3.4, st.sil ? 'evo-w' : '', !st.sil) : '';
      return (
        '<div class="fill" style="background:radial-gradient(circle at 50% 46%,var(--p2),#000 70%)"></div>' +
        (st.flicker && !st.revealed ? '<div class="evo-glow"></div>' : '') +
        (st.revealed ? '<div class="burst"></div>' : '') +
        foot(480, 350, pic) +
        (st.revealed && flash > 0 && tl.flashMs > 0 ? `<div class="fill evo-flash" data-once="evo-flash" style="--fl:${Math.min(1, flash)};--fm:${tl.flashMs}ms"></div>` : '') +
        (st.text ? TX(`${esc(st.text)} <span class="evo-more">▼</span>`) : '')
      );
    },
  });
  return drive(
    scene,
    show,
    lines,
    tl,
    {
      text: (t) => {
        st.text = t;
        view.refresh();
      },
      form: (which, sil) => {
        st.which = which;
        st.sil = sil;
        if (sil && tl.beats.length > 1) st.flicker = true;
        view.refresh();
      },
      reveal: () => {
        st.revealed = true;
        view.refresh();
      },
      close: () => view.destroy(),
    },
    (fn) => {
      view.el.addEventListener('click', fn);
      return () => view.el.removeEventListener('click', fn);
    },
  );
}

