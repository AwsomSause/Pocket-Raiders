// DOMINION redesign R9 follow-up: the Rotom Phone's presentation services, kept beside DominionScene. Captions (sounds
// in words over the page, the music's name), the Jukebox's heard tracks, quiet while the tab is away, button clicks,
// the browser's voices for Read aloud, and Photo mode's snap (a picture saved to the player's device). Nothing here
// touches the run: the look settings are the only thing written, through the session.

import type Phaser from 'phaser';
import type { DominionLook } from '../../core/dominion/schema';
import { TOWN } from '../../core/town/schema';
import { services } from '../../game/services';
import { musicNow, playMusicLazy, playSfx, setAudioWatch } from '../../ui/audio';

/** Sounds worth a caption (cursor ticks are left out: they would never stop). */
export const SFX_WORDS: Readonly<Record<string, string>> = {
  'ui.select': 'Click', 'ui.error': 'Buzz', 'ui.buy': 'Cash register', 'se.level_up': 'Level-up fanfare', 'se.exp': 'EXP ticking up',
  'se.shiny': 'Sparkle', 'se.faint': 'A Pokémon faints', 'se.ball_release': 'Poké Ball pops open', zmove: 'Z-Power roars', tera: 'Crystal shatters',
};

/** The game's songs (the Town jukebox's list): id and name. */
export const TRACKS: readonly { id: string; name: string; where: string }[] = TOWN.tracks.map((t) => ({ id: t.id, name: t.name, where: t.unlock.startsWith('free') ? 'Heard around the game' : 'A rarer track' }));
const trackName = (id: string): string => TRACKS.find((t) => t.id === id)?.name ?? id.replace(/^bgm\./, '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

const look = (): DominionLook => services().session.settings.expansion.dominionPrefs.look;
function setLook(p: Partial<DominionLook>): void {
  const s = services().session;
  const d = s.settings.expansion.dominionPrefs;
  s.saveSettings({ ...s.settings, expansion: { ...s.settings.expansion, dominionPrefs: { ...d, look: { ...d.look, ...p } } } });
}

/** Records a song as heard (once). */
export function hear(id: string): void {
  if (!TRACKS.some((t) => t.id === id) || look().heard.includes(id)) return;
  setLook({ heard: [...look().heard, id].slice(-200) });
}

let capTimer: ReturnType<typeof setTimeout> | null = null;
/** Shows a caption over the Dominion page (in the game's layer, never over the canvas). */
export function caption(text: string, music = false): void {
  if (typeof document === 'undefined') return;
  const host = document.getElementById('rx');
  if (!host) return;
  let el = document.getElementById('r9cap');
  if (!el) { el = document.createElement('div'); el.id = 'r9cap'; host.appendChild(el); }
  el.className = `r9cap cs-${look().capSize}${music ? ' mus' : ''}`;
  el.textContent = music ? `♪ ${text}` : `[${text}]`;
  el.dataset.testid = 'r9-caption';
  el.setAttribute('data-testid', 'r9-caption');
  if (capTimer) clearTimeout(capTimer);
  capTimer = setTimeout(() => el?.remove(), 2400);
}

let away: (() => void) | null = null;
/** Starts the services while the Dominion scene runs; returns the stop. */
export function startPhone(scene: Phaser.Scene, onDominion: () => boolean): () => void {
  setAudioWatch({
    sfx: (id) => { const w = SFX_WORDS[id]; if (w && onDominion() && look().captions) caption(w); },
    music: (id) => { hear(id); if (onDominion() && look().captions && look().musicNames) caption(trackName(id), true); },
  });
  const now = musicNow();
  if (now) hear(now);
  const vis = (): void => { if (look().awayMute) scene.sound.mute = document.hidden || services().session.settings.muted; };
  if (typeof document !== 'undefined') { document.addEventListener('visibilitychange', vis); away = () => document.removeEventListener('visibilitychange', vis); }
  return () => { setAudioWatch(null); away?.(); away = null; };
}

/** A click on a press, when Button sounds is on. */
export function click(scene: Phaser.Scene): void {
  if (look().clicks) playSfx(scene, 'ui.select', 0.6);
}

/** Plays a heard track (the Jukebox's Enter). */
export function playTrack(scene: Phaser.Scene, id: string): boolean {
  if (!look().heard.includes(id)) return false;
  playMusicLazy(scene, id);
  return true;
}

/** The browser's voices (names), for Read aloud's Voice row; empty where there is no speech. */
export function voices(): string[] {
  try { return typeof speechSynthesis === 'undefined' ? [] : speechSynthesis.getVoices().map((v) => v.name).slice(0, 12); } catch { return []; }
}

/** Photo mode's snap: draws the shot (sky, skyline, the people in it, the frame and filter) on a canvas and saves the
 *  picture to the player's device. Returns false when there is no canvas (tests in Node). */
export async function snap(o: { pics: readonly string[]; caption: string; filter: string; frame: string; stickers: number }): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const W = 640, H = 400;
  const c = document.createElement('canvas');
  c.width = W; c.height = H + (o.frame === 'polaroid' ? 60 : 0);
  const g = c.getContext('2d');
  if (!g) return false;
  const filt: Record<string, string> = { sunset: 'sepia(.35) saturate(1.3)', night: 'brightness(.7) hue-rotate(200deg)', mono: 'grayscale(1)', none: 'none' };
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#f7b267'); sky.addColorStop(1, '#f25c54');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a1b3d';
  [40, 70, 52, 90, 34, 62, 80, 46, 74, 38, 58, 66].forEach((h, i) => g.fillRect(i * (W / 12), H - 60 - h, W / 12 - 4, h + 60));
  const imgs = await Promise.all(o.pics.map((src) => new Promise<HTMLImageElement | null>((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; })));
  g.filter = filt[o.filter] ?? 'none';
  imgs.forEach((im, i) => {
    if (!im) return;
    const h = 170, w = (im.width / im.height) * h, x = 60 + (i * (W - 160)) / Math.max(1, imgs.length - 1 || 1);
    g.imageSmoothingEnabled = false;
    g.drawImage(im, x - w / 2 + 40, H - h - 10, w, h);
  });
  g.filter = 'none';
  g.fillStyle = '#1a1020'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center';
  if (o.stickers > 0) g.fillText('★', 600, 40);
  if (o.stickers > 1) g.fillText('N', 40, 40);
  if (o.stickers > 2) g.fillText('SMILE!', W / 2, 40);
  if (o.frame === 'polaroid') g.fillText(o.caption, W / 2, H + 38);
  else { g.strokeStyle = '#e0294a'; g.lineWidth = 12; g.strokeRect(6, 6, W - 12, H - 12); }
  const url = c.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url; a.download = `${o.caption.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'photo'}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setLook({ photos: look().photos + 1 });
  return true;
}
