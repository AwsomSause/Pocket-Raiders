// Galar Gym Challenge stadium presentation (Beta 0.5 M8): the Champion host, crowd banners and brief camera cuts during a Galar gym battle.
// Presentation only: it reads the finished turn's events, decides with core/galarStadium.ts (own seeded streams, never gameplay RNG)
// and draws; a failure here is swallowed so the battle never waits on it.

import type Phaser from 'phaser';
import type { RunEvent } from '../../core/run';
import { defaultMoment, planMoment } from '../../core/cinematic/moments';
import { GALAR_STADIUM, crowdReaction, pickCameraCut, type CrowdBeat } from '../../core/galarStadium';
import { fillHype, pickHype, type GalarScope, type HypeMoment, type HypeSpeaker, type HypeTrigger } from '../../core/galarCrowd';
import { GAME_WIDTH, textStyle } from '../theme';
import { playMoment } from '../cinematic/momentPlayer';
import commentaryJson from '../../data/galarCommentary.json';
import { CUT_ART_PRELOAD, drawCutArt, playBandCard, playIntroCard, type CutArtKit } from './cutArt';

const COMMENTARY = (commentaryJson as { beats: Record<string, string[]> }).beats;

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
  /** Draws a trainer portrait / the Dynamax Band art for the intro cards (null = use the drawn fallback). */
  portrait?: (spriteId: string, x: number, y: number) => Phaser.GameObjects.GameObject | null;
  bandArt?: (x: number, y: number) => Phaser.GameObjects.GameObject | null;
  /** Crowd sound for a cue (crowd.roar, crowd.hush, crowd.swell, crowd.murmur). Optional; sound only, never changes the battle. */
  crowdSound?: (cue: string, intensity: number) => void;
  /** Real trainer art for the camera cuts: a picture if it is loaded (else null), a loader for the crowd pictures, and who the host / opponent / rival are. */
  /** The news reporter's opening lines, as trainer text with the reporter's own sprite (falls back to the plain message box). */
  announce?: (text: string) => Promise<void>;
  /** The opponent's own words as trainer text with their picture. */
  opponentSays?: (name: string, assetId: string, text: string) => Promise<void>;
  /** Hype moments and the favour bar (Galar only). */
  hype?: {
    flags?: () => ReadonlySet<string>;
    scope: GalarScope;
    /** Crowd favour 5-95 (50 even, above 50 favours the player), read from the battle state. */
    favor: () => number | null;
    /** Names for the lines: player, foe, foeMon, myMon, host, rival, leader. */
    facts: () => Record<string, string>;
    /** Who can speak right now (a rival only when one is watching, ...). */
    available: () => ReadonlySet<HypeSpeaker>;
    /** Who this speaker is for this moment: display name and picture id (a seeded pick for crowd members). */
    cast: (speaker: HypeSpeaker, seed: string) => { name: string; assetId: string };
    /** Shows the line as trainer text with that speaker's own sprite. */
    say: (name: string, assetId: string, text: string) => Promise<void>;
    /** The foe's active Pokémon HP share (0-1). */
    foeShare: () => number;
  };
  art?: {
    sprite: (assetId: string, x: number, y: number, scale: number) => Phaser.GameObjects.GameObject | null;
    preload: (ids: readonly string[]) => Promise<void>;
    cast: () => { host: string; opponent: string; rival: string };
  };
}

export class StadiumDirector {
  private shown = 0;
  private lastCutTurn: number | null = null;
  private turn = 0;
  private finalSides = new Set<string>();
  private banner: Phaser.GameObjects.Text | null = null;
  // Hype-moment bookkeeping (presentation only; nothing here is saved or affects the fight).
  private readonly seenHype = new Set<string>();
  private hypeShown = 0;
  private koRun = { player: 0, foe: 0 };
  private firstKo = { player: false, foe: false };
  private playerFalls = 0;
  private lastFavorSide: 'player' | 'foe' | null = null;
  private fired = new Set<string>();
  private turnHype = 0;
  private favorBar: Phaser.GameObjects.Container | null = null;
  private favorFill: Phaser.GameObjects.Rectangle | null = null;
  private favorText: Phaser.GameObjects.Text | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly h: StadiumHooks) {
    // Crowd pictures load in the background; a cut drawn before they arrive uses the drawn silhouettes.
    void this.h.art?.preload([...CUT_ART_PRELOAD, ...Object.values(this.kitIds()).filter(Boolean)]).catch(() => undefined);
  }

  private kitIds(): { host: string; opponent: string; rival: string } {
    try {
      return this.h.art?.cast() ?? { host: '', opponent: '', rival: '' };
    } catch {
      return { host: '', opponent: '', rival: '' };
    }
  }

  private kit(): CutArtKit | undefined {
    const art = this.h.art;
    return art ? { sprite: art.sprite, ...this.kitIds() } : undefined;
  }

  /** Call once per player turn, before its events play. */
  startTurn(turn: number): void {
    this.turn = turn;
    this.turnHype = 0;
    this.updateFavor();
    // The music builds: each turn the song picks up a little (up to the cap), and the crowd's cues add on top.
    this.h.setIntensity(1 + Math.min(Math.max(turn - 1, 0), 6) * 0.012);
  }

  /** The Dynamax Band handover scene (before the host's lines). Never throws. */
  async bandScene(): Promise<void> {
    try {
      if (this.h.disableAnimations()) return;
      this.h.crowdSound?.('crowd.swell', 3);
      await playBandCard(this.scene, !this.h.reduceMotion(), (x, y) => this.h.bandArt?.(x, y) ?? null);
    } catch {
      // decoration only
    }
  }

  /** The beat this event is, or null. Hits are judged by how much of the target's HP they took. */
  beatFor(e: RunEvent): CrowdBeat | null {
    if (e.type === 'damage') {
      const before = e.hpAfter + e.amount;
      const share = before > 0 ? e.amount / before : 0;
      if (e.side === 'enemy' && ((e.effectiveness > 1 && share >= 0.25) || e.crit || share >= 0.5)) return this.behind() ? 'comeback' : 'bigHit';
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
      if (beat) await this.react(beat);
      const trigger = this.hypeFor(e);
      if (trigger && this.turnHype < 2 && (await this.hype(trigger))) this.turnHype++;
      // In the Champion battle the Champion also speaks about the player's own road.
      if (this.h.hype?.scope === 'champion' && trigger && this.turnHype < 2) {
        const j: HypeTrigger | null = trigger === 'playerBigHit' ? 'journeyBig' : trigger === 'foeFirstKo' || trigger === 'foeKoStreak' ? 'journeyDown' : null;
        if (j && (await this.hype(j))) this.turnHype++;
      }
    } catch {
      // Presentation failure never touches the battle.
    }
  }

  /** After the turn: the last Pokémon on a side changes the atmosphere (once per side). */
  async afterTurn(): Promise<void> {
    try {
      this.updateFavor();
      await this.turnHypeMoments();
    } catch {
      // presentation only
    }
    try {
      const a = this.h.alive();
      for (const [side, n] of [['player', a.player], ['foe', a.foe]] as const) {
        if (n === 1 && !this.finalSides.has(side)) {
          this.finalSides.add(side);
          const r = crowdReaction('lastMon');
          this.h.setIntensity(1 + r.intensity * 0.05);
          this.h.finalMusic(r.music);
          await this.react('lastMon');
          if (this.turnHype < 3 && (await this.hype(side === 'player' ? 'playerLast' : 'foeLast'))) this.turnHype++;
          if (side === 'foe' && this.playerFalls === 0 && (await this.hype('flawless'))) this.turnHype++;
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
        drawCutArt(this.scene, cut.id, `${this.h.battleId}:${this.turn}`, cut.durationMs, !this.h.reduceMotion(), this.kit());
      } catch {
        // art is decoration; a drawing problem never blocks the battle
      }
    }
    await playMoment(this.scene, spec, plan, { title: cut.label, subtitle: cut.caption });
    await this.commentate(cut.id, beat);
  }

  /** Every camera cut has someone talking: the person on screen (or the reporter) says something about what just happened, as trainer text. */
  private async commentate(cutId: string, beat: CrowdBeat): Promise<void> {
    try {
      const hy = this.h.hype;
      if (!hy) return;
      const speaker: HypeSpeaker = ({ 'crowd-cheer': 'crowdTrainer', 'fan-group': 'crowdTrainer', 'trainers-watching': 'futureLeader', 'private-box': 'futureOpponent', commentator: 'reporter', 'opponent-closeup': 'reporter', 'champion-silhouette': 'host', 'rival-silhouette': 'rival' } as Record<string, HypeSpeaker>)[cutId] ?? 'reporter';
      const lines = COMMENTARY[beat] ?? COMMENTARY.calm ?? [];
      if (lines.length === 0) return;
      const seed = `${this.h.battleId}:${this.turn}:${cutId}`;
      const avail = hy.available();
      const who = hy.cast(avail.has(speaker) ? speaker : 'crowdTrainer', seed);
      await hy.say(who.name, who.assetId, fillHype(lines[this.pickLine(seed, lines.length)]!, hy.facts()));
    } catch {
      // commentary is decoration only
    }
  }

  /** Test/preview hook: draws one named cut's art right now (no gameplay effect). Returns whether it drew. */
  previewCut(id: string): boolean {
    const cut = GALAR_STADIUM.cameraCuts.find((c) => c.id === id);
    if (!cut) return false;
    drawCutArt(this.scene, cut.id, `preview:${id}`, 1600, !this.h.reduceMotion(), this.kit());
    return true;
  }

  private showBanner(text: string, intensity: number): void {
    this.banner?.destroy();
    const t = this.scene.add.text(GAME_WIDTH / 2, 70, text, textStyle(18 + intensity * 2, intensity >= 3 ? '#ffe060' : '#aab4c0', { stroke: '#101820', strokeThickness: 5 })).setOrigin(0.5).setDepth(1700).setAlpha(0);
    this.banner = t;
    this.scene.tweens.add({ targets: t, alpha: 1, y: 60, duration: 220, yoyo: true, hold: 650, onComplete: () => { t.destroy(); if (this.banner === t) this.banner = null; } });
  }

  /** A tournament round's opening: a round card with the opponent, their introduction, and a bigger staging for the final. Never throws. */
  async tournamentIntro(round: { round: number; name: string; opponent: string; intro: string; final: boolean; style?: string; sprite?: string }): Promise<void> {
    try {
      if (!this.h.disableAnimations()) {
        const spec = defaultMoment(round.final ? 'championIntro' : 'e4Intro', `galar-tournament-${round.round}`);
        spec.mandatory = round.final;
        if (round.final) spec.phases = { situation: 600, anticipation: 1000, moment: 1400, reaction: 800, transition: 500 };
        const plan = planMoment(spec, { reduceMotion: this.h.reduceMotion(), disableAnimations: false, seen: new Set() });
        this.h.setIntensity(round.final ? 1.2 : 1.05);
        await playMoment(this.scene, spec, plan, { title: round.final ? 'THE FINAL' : round.name, subtitle: `vs ${round.opponent}` });
        this.h.crowdSound?.(round.final ? 'crowd.roar' : 'crowd.swell', round.final ? 5 : 3);
        await playIntroCard(this.scene, { tag: round.final ? 'THE FINAL' : round.name.toUpperCase(), name: round.opponent, style: round.style ?? '', line: round.intro, sprite: round.sprite ?? '', final: round.final }, `${this.h.battleId}:${round.round}`, !this.h.reduceMotion(), (x, y) => (round.sprite ? this.h.portrait?.(round.sprite, x, y) ?? null : null));
      }
      const reporter = (text: string): Promise<void> => (this.h.announce ? this.h.announce(text) : this.h.say(text));
      await reporter(round.final ? `Ladies and gentlemen, this is it: the final! ${round.opponent} stands in the champion's circle and the whole stadium is on its feet!` : `${round.name}! Next up: ${round.opponent}${round.style ? `, ${round.style}` : ''}. The crowd is getting loud!`);
      if (this.h.opponentSays) await this.h.opponentSays(round.opponent, round.sprite ?? '', round.intro);
      else await this.h.say(round.intro);
    } catch {
      // Presentation failure never touches the battle.
    }
  }


  // ---------- crowd favour bar (Galar only) ----------

  private favorNow = 50;

  /** Draws the favour bar at the top of the battle on first use, then eases it to the crowd's current mood. */
  updateFavor(): void {
    try {
      const hy = this.h.hype;
      const favor = hy?.favor();
      if (!hy || favor === null || favor === undefined) return;
      const w = 340;
      if (!this.favorBar) {
        const c = this.scene.add.container(GAME_WIDTH / 2 - w / 2, 10).setDepth(1650).setScrollFactor(0);
        c.add(this.scene.add.rectangle(-3, -3, w + 6, 22, 0x0a1020, 0.9).setOrigin(0));
        c.add(this.scene.add.rectangle(0, 0, w, 16, 0xe05a3c, 1).setOrigin(0));
        this.favorFill = this.scene.add.rectangle(0, 0, w * 0.5, 16, 0x4aa8ff, 1).setOrigin(0);
        c.add(this.favorFill);
        c.add(this.scene.add.rectangle(w / 2 - 1, -3, 2, 22, 0xffffff, 0.8).setOrigin(0));
        c.add(this.scene.add.text(6, 8, 'YOU', textStyle(12, '#ffffff', { stroke: '#101820', strokeThickness: 3 })).setOrigin(0, 0.5));
        c.add(this.scene.add.text(w - 6, 8, 'FOE', textStyle(12, '#ffffff', { stroke: '#101820', strokeThickness: 3 })).setOrigin(1, 0.5));
        this.favorText = this.scene.add.text(w / 2, 24, '', textStyle(12, '#ffe9a8', { stroke: '#101820', strokeThickness: 3 })).setOrigin(0.5, 0);
        c.add(this.favorText);
        this.favorBar = c;
      }
      const side = favor > 55 ? 'player' : favor < 45 ? 'foe' : null;
      this.favorText?.setText(side === 'player' ? 'The crowd is with you: Hyper and Overdrive come easier' : side === 'foe' ? 'The crowd favours your opponent' : 'The crowd is split');
      if (this.favorFill) {
        if (this.h.reduceMotion()) this.favorFill.width = (w * favor) / 100;
        else this.scene.tweens.add({ targets: this.favorFill, width: (w * favor) / 100, duration: 500, ease: 'Sine.easeOut' });
      }
      this.favorNow = favor;
    } catch {
      // decoration only
    }
  }

  // ---------- hype moments (data: galarHype.json) ----------

  /** Which hype trigger an event is, and keeps the knock-out streaks. */
  private hypeFor(e: RunEvent): HypeTrigger | null {
    if (e.type === 'damage') {
      const before = e.hpAfter + e.amount;
      const share = before > 0 ? e.amount / before : 0;
      if (e.side === 'enemy' && share >= 0.3) return 'playerBigHit';
      if (e.side === 'player' && e.hpAfter > 0 && e.hpAfter / before <= 0.15) return 'comeback';
      if (e.side === 'player' && share >= 0.35) return 'foeBigHit';
      return null;
    }
    if (e.type === 'faint') {
      if (e.side === 'enemy') {
        this.koRun.player++;
        this.koRun.foe = 0;
        if (!this.firstKo.player && !this.firstKo.foe) {
          this.firstKo.player = true;
          return 'playerFirstKo';
        }
        return this.koRun.player >= 3 ? 'playerSweep' : this.koRun.player === 2 ? 'playerKoStreak' : null;
      }
      this.playerFalls++;
      this.koRun.foe++;
      this.koRun.player = 0;
      if (!this.firstKo.player && !this.firstKo.foe) {
        this.firstKo.foe = true;
        return 'foeFirstKo';
      }
      return this.koRun.foe >= 3 ? 'foeSweep' : this.koRun.foe === 2 ? 'foeKoStreak' : null;
    }
    if (e.type === 'transform') {
      if (e.kind === 'dynamax') return e.side === 'player' ? 'playerDynamax' : 'foeDynamax';
      if (e.side === 'player') return 'playerMega';
      if (e.side === 'enemy' && e.kind === 'mega' && this.fired.has('lastStand')) return 'bondMega';
      return null;
    }
    if (e.type === 'spectacle' && e.side === 'enemy' && typeof e.text === 'string' && e.text.includes('is not done!')) {
      this.fired.add('lastStand');
      return 'lastStand';
    }
    return null;
  }

  /** The between-turn moments: the first exchange (always), the middle of a long fight, a swing of the crowd, an even match, a foe on the ropes, an underdog. */
  private async turnHypeMoments(): Promise<void> {
    const hy = this.h.hype;
    if (!hy) return;
    const once = async (key: string, trigger: HypeTrigger): Promise<void> => {
      if (this.fired.has(key) || this.turnHype >= 2) return;
      this.fired.add(key);
      if (await this.hype(trigger)) this.turnHype++;
    };
    // After the first turn the battle always cuts to someone in the crowd with something to say.
    if (!this.fired.has('turn1')) {
      this.fired.add('turn1');
      if (await this.hype('turn1', true)) this.turnHype++;
    }
    const favor = this.favorNow;
    const side = favor >= 56 ? 'player' : favor <= 44 ? 'foe' : this.lastFavorSide;
    if (side && this.lastFavorSide && side !== this.lastFavorSide && this.turnHype < 2) {
      if (await this.hype(side === 'player' ? 'favorToPlayer' : 'favorToFoe')) this.turnHype++;
    }
    this.lastFavorSide = side;
    if (this.turn >= 3 && Math.abs(favor - 50) <= 6) await once('even', 'evenMatch');
    if (this.turn >= 4) await once('mid', 'midBattle');
    if (this.turn >= 9) await once('late', 'lateBattle');
    if (hy.foeShare() < 0.2) await once('lowFoe', 'lowFoe');
    if (hy.scope === 'champion') {
      if (this.turn >= 2) await once('jOpen', 'journeyOpen');
      if (this.turn >= 5) await once('jMid', 'journeyMid');
      if (this.turn >= 9) await once('jLate', 'journeyLate');
      if (hy.foeShare() < 0.3) await once('jLow', 'journeyFoeLow');
    }
    const a = this.h.alive();
    if (this.turn >= 3 && a.player < a.foe) await once('underdog', 'underdog');
  }

  /** Plays one hype moment for a trigger (a cut to the speaker, their line as trainer text). Returns whether one played. Never throws. */
  private async hype(trigger: HypeTrigger, always = false): Promise<boolean> {
    try {
      const hy = this.h.hype;
      if (!hy || this.h.disableAnimations()) return false;
      if (!always && this.hypeShown >= 16) return false;
      const m = pickHype(trigger, { runSeed: this.h.runSeed, battleId: this.h.battleId, turn: this.turn, scope: hy.scope, seen: this.seenHype, available: hy.available(), flags: hy.flags?.() });
      if (!m) return false;
      this.seenHype.add(m.id);
      this.hypeShown++;
      await this.playHype(m);
      return true;
    } catch {
      return false;
    }
  }

  private async playHype(m: HypeMoment, artId = 'speaker'): Promise<void> {
    const hy = this.h.hype!;
    this.h.crowdSound?.(m.cue, 4);
    this.showBanner(m.title, 4);
    const seed = `${this.h.battleId}:${m.id}`;
    const who = hy.cast(m.speaker, seed);
    let layer: Phaser.GameObjects.Container | null = null;
    try {
      layer = drawCutArt(this.scene, artId, seed, 120000, !this.h.reduceMotion(), { ...(this.kit() ?? { sprite: () => null, host: '', opponent: '', rival: '' }), speaker: who.assetId });
    } catch {
      layer = null;
    }
    const text = fillHype(m.lines[this.pickLine(seed, m.lines.length)]!, hy.facts());
    try {
      await hy.say(who.name, who.assetId, text);
    } finally {
      const l = layer;
      if (l) this.scene.tweens.add({ targets: l, alpha: 0, duration: 220, onComplete: () => l.destroy() });
    }
  }

  private pickLine(seed: string, n: number): number {
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % Math.max(1, n);
  }

  /** Test / preview hook: plays one named hype moment now. Returns whether it exists. */
  async previewHype(moment: HypeMoment): Promise<void> {
    await this.playHype(moment);
  }

  get musicTrack(): string {
    return GALAR_STADIUM.music.battle;
  }
}
