// Title backdrop: the director's six animated scenes, shown one at a time with a slow crossfade.
// Old look: Phaser videos on the canvas. New look: <video> tags in their own view under the menu.
// Presentation only. A browser that cannot play the clips keeps the picture that was there before.

import Phaser from 'phaser';
import { clipAt, CLIP_FADE, CLIP_HOLD, TITLE_CLIPS } from '../core/presentation/titleClips';
import { GAME_HEIGHT, GAME_WIDTH } from './theme';

let playable: boolean | null = null;
/** Whether this browser plays H.264 MP4 (every current browser does; some test browsers do not). */
export function clipsPlayable(): boolean {
  if (playable === null) playable = typeof document !== 'undefined' && document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"') !== '';
  return playable;
}

const firstClip = (): number => Math.floor(Math.random() * TITLE_CLIPS.length);

/** Old look: the clips on the canvas at `depth`, covering the screen. `still` shows each clip paused (motion off). */
export function titleClipsOnCanvas(scene: Phaser.Scene, depth: number, still: boolean): void {
  if (!clipsPlayable()) return;
  const start = firstClip();
  let step = 0, cur: Phaser.GameObjects.Video | null = null, broken = false;
  const next = (): void => {
    if (broken) return;
    const v = scene.add.video(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(depth).setAlpha(0);
    v.once(Phaser.GameObjects.Events.VIDEO_CREATED, (_v: unknown, w: number, h: number) => {
      v.setScale(Math.max(GAME_WIDTH / w, GAME_HEIGHT / h));
      v.texture?.setFilter(Phaser.Textures.FilterMode.NEAREST);
      if (still) v.pause();
      const old = cur;
      cur = v;
      scene.tweens.add({ targets: v, alpha: 1, duration: old ? CLIP_FADE : 500, ease: 'Sine.easeInOut', onComplete: () => old?.destroy() });
    });
    v.once(Phaser.GameObjects.Events.VIDEO_ERROR, () => { broken = true; v.destroy(); });
    v.loadURL(TITLE_CLIPS[clipAt(start, step)]!, true);
    v.play(true);
    step += 1;
  };
  next();
  scene.time.addEvent({ delay: CLIP_HOLD, loop: true, callback: next });
}

/** New look: the markup for the clips (inside a view that never redraws, so they keep playing). */
export const titleClipsHtml = (): string => `<div class="tclips">${TITLE_CLIPS.map((src) => `<video muted loop playsinline preload="none" data-src="${src}"></video>`).join('')}</div>`;

/** New look: runs the crossfade over the videos under `root` for as long as the scene lives. */
export function runTitleClips(scene: Phaser.Scene, root: HTMLElement, still: boolean): void {
  const vids = [...root.querySelectorAll<HTMLVideoElement>('.tclips video')];
  if (vids.length === 0 || !clipsPlayable()) return;
  const start = firstClip();
  let step = 0, cur: HTMLVideoElement | null = null, z = 1;
  const next = (): void => {
    const v = vids[clipAt(start, step, vids.length)]!;
    step += 1;
    if (v === cur) return;
    const show = (): void => {
      if (!scene.sys.isActive() || !v.isConnected) return;
      const old = cur;
      cur = v;
      v.style.zIndex = String(z++);
      v.classList.add('on');
      if (still) v.pause();
      if (old) scene.time.delayedCall(CLIP_FADE, () => { old.classList.remove('on'); old.pause(); });
    };
    v.addEventListener('loadeddata', show, { once: true });
    v.muted = true;
    if (!v.src) v.src = v.dataset.src!;
    else if (v.readyState >= 2) { v.removeEventListener('loadeddata', show); show(); }
    void v.play().catch(() => undefined);
  };
  next();
  scene.time.addEvent({ delay: CLIP_HOLD, loop: true, callback: next });
}
