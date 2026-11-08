// Galar Gym Challenge stadium presentation (Beta 0.5 M8): the Champion host, crowd banners and brief camera cuts during a Galar gym battle.
// Presentation only: it reads the finished turn's events, decides with core/galarStadium.ts (own seeded streams, never gameplay RNG)
// and draws; a failure here is swallowed so the battle never waits on it.

import type Phaser from 'phaser';
import type { RunEvent } from '../../core/run';
import { defaultMoment, planMoment } from '../../core/cinematic/moments';
import { GALAR_STADIUM, crowdReaction, pickCameraCut, type CrowdBeat } from '../../core/galarStadium';
import { GAME_WIDTH, textStyle } from '../theme';
import { playMoment } from '../cinematic/momentPlayer';
import { drawCutArt } from './cutArt';

export interface StadiumHooks {
  runSeed: string;
  battleId: string;
  /** Champion host: shown before the battle. */
  host: string;
  /** Does the Champion watch with interest? (the player is doing well); lets the champion silhouette cut appear. */
  impressive: boolean;
  rivalWatching: boolean;
  disableAnimations: () => boolean;
  reduceMotion: () => boolean;
  /** Music: bump the intensity, or swap to the finale track for the last Pokémon on a side. */
  setIntensity: (n: number) => void;
  finalMusic: (track: string) => void;
  /** How many Pokémon each side still has standing (read after the turn). */
  alive: () => { player: number; foe: number };
  /** Narration line (the scene's message box). */
  say: (text: string) => Promise<void>;
  /** Crowd sound for a cue (crowd.roar, crowd.hush, crowd.swell, crowd.murmur). Optional; sound only, never changes the battle. */
  crowdSound?: (cue: string, intensity: number) => void;
}

export class StadiumDirector {
  private shown = 0;
  private lastCutTurn: number | null = null;
  private turn = 0;
  private finalSides = new Set<string>();
  private banner: Phaser.GameObjects.Text | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly h: StadiumHooks) {}

  /** Call once per player turn, before its events play. */
  startTurn(turn: number): void {
    this.turn = turn;
  }

  /** The beat this event is, or null. Hits are judged by how much of the target's HP they took. */
  beatFor(e: RunEvent): CrowdBeat | null {
    if (e.type === 'damage') {
      const before = e.hpAfter + e.amount;
      const share = before > 0 ? e.amount / before : 0;
      if (e.side === 'enemy' && e.effectiveness > 1 && share >= 0.4) return this.behind() ? 'comeback' : 'bigHit';
      if (e.side === 'player' && e.hpAfter > 0 && e.hpAfter / before <= 0.15) return 'survived';
      return null;
    }
    if (e.type === 'transform' && e.kind === 'dynamax') return 'dynamax';
    if (e.type === 'faint') return 'knockOut';
    return null;
  }

  private behind(): boolean {
    const a = this.h.alive();
    return a.player < a.foe;
  }

  /** Reacts to one event of the turn. Never throws. */
  async onEvent(e: RunEvent): Promise<void> {
    try {
      const beat = this.beatFor(e);
      if (!beat) return;
      await this.react(beat);
    } catch {
      // Presentation failure never touches the battle.
    }
  }

  /** After the turn: the last Pokémon on a side changes the atmosphere (once per side). */
  async afterTurn(): Promise<void> {
    try {
      const a = this.h.alive();
      for (const [side, n] of [['player', a.player], ['foe', a.foe]] as const) {
        if (n === 1 && !this.finalSides.has(side)) {
          this.finalSides.add(side);
          const r = crowdReaction('lastMon');
          this.h.setIntensity(1 + r.intensity * 0.05);
          this.h.finalMusic(r.music);
          await this.react('lastMon');
        }
      }
    } catch {
      // see above
    }
  }

  private async react(beat: CrowdBeat): Promise<void> {
    if (this.h.disableAnimations()) return;
    const r = crowdReaction(beat);
    this.h.setIntensity(1 + r.intensity * 0.03);
    this.h.crowdSound?.(r.cue, r.intensity);
    this.showBanner(r.cue.endsWith('hush') ? 'The crowd goes quiet...' : r.cue.endsWith('swell') ? 'The crowd swells!' : r.intensity >= 4 ? 'The stadium ERUPTS!' : 'The crowd roars!', r.intensity);
    const cut = pickCameraCut({ runSeed: this.h.runSeed, battleId: this.h.battleId, turn: this.turn, beat, shown: this.shown, lastCutTurn: this.lastCutTurn, impressive: this.h.impressive, rivalWatching: this.h.rivalWatching });
    if (!cut) return;
    this.shown++;
    this.lastCutTurn = this.turn;
    const spec = defaultMoment('stadiumCut', `stadium-${cut.id}`);
    spec.phases = { situation: 150, anticipation: 200, moment: cut.durationMs - 700 > 200 ? cut.durationMs - 700 : 400, reaction: 200, transition: 150 };
    const plan = planMoment(spec, { reduceMotion: this.h.reduceMotion(), disableAnimations: false, seen: new Set() });
    if (plan.play) {
      try {
        drawCutArt(this.scene, cut.id, `${this.h.battleId}:${this.turn}`, cut.durationMs, !this.h.reduceMotion());
      } catch {
        // art is decoration; a drawing problem never blocks the battle
      }
    }
    await playMoment(this.scene, spec, plan, { title: cut.label, subtitle: cut.caption });
  }

  private showBanner(text: string, intensity: number): void {
    this.banner?.destroy();
    const t = this.scene.add.text(GAME_WIDTH / 2, 70, text, textStyle(18 + intensity * 2, intensity >= 3 ? '#ffe060' : '#aab4c0', { stroke: '#101820', strokeThickness: 5 })).setOrigin(0.5).setDepth(1700).setAlpha(0);
    this.banner = t;
    this.scene.tweens.add({ targets: t, alpha: 1, y: 60, duration: 220, yoyo: true, hold: 650, onComplete: () => { t.destroy(); if (this.banner === t) this.banner = null; } });
  }

  /** A tournament round's opening: a round card with the opponent, their introduction, and a bigger staging for the final. Never throws. */
  async tournamentIntro(round: { round: number; name: string; opponent: string; intro: string; final: boolean }): Promise<void> {
    try {
      if (!this.h.disableAnimations()) {
        const spec = defaultMoment(round.final ? 'championIntro' : 'e4Intro', `galar-tournament-${round.round}`);
        spec.mandatory = round.final;
        if (round.final) spec.phases = { situation: 600, anticipation: 1000, moment: 1400, reaction: 800, transition: 500 };
        const plan = planMoment(spec, { reduceMotion: this.h.reduceMotion(), disableAnimations: false, seen: new Set() });
        this.h.setIntensity(round.final ? 1.2 : 1.05);
        await playMoment(this.scene, spec, plan, { title: round.final ? 'THE FINAL' : round.name, subtitle: `vs ${round.opponent}` });
      }
      await this.h.say(round.intro);
      if (round.final) await this.h.say('The whole stadium is on its feet. This is the match the season has been building to.');
    } catch {
      // Presentation failure never touches the battle.
    }
  }

  get musicTrack(): string {
    return GALAR_STADIUM.music.battle;
  }
}
