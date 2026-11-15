// An event ("?" stop) as a small animated scene, drawn by the event style the
// player picked (ui/eventStyles: Diorama, Storybook...), plus the event's
// signature effect and an outcome panel whose gains bounce in one by one. Everything that moves is presentation only: the
// outcome is decided by core/events.ts before any of it plays. Reduced or
// off battle animations calm the motion down.
//
// Visual Bible "Event choice screens": one reusable glass illustration frame
// whose motif (rim colour, group pill, sparkle) comes from the event's data,
// cards that say what each option costs and what kind of risk it carries
// (core choiceRisk), and an outcome that visibly lands: chips pop with a
// burst and the money pill counts to the new total.

import { stopArtFor } from '../ui/stopArt';
import Phaser from 'phaser';
import { clockLabel, periodOf, PERIOD_LOOK, seasonOf, specialDateToday } from '../core/clock';
import { eventView, type ChoiceView, type EventResult } from '../core/events';
import { promptById, type Grade } from '../core/interaction/prompt';
import { runInteractionPrompt } from '../ui/interactionPrompt';
import { arenaFor, getTheme } from '../core/themes';
import { services } from '../game/services';
import { playMusic, playSfx, playMusicLazy, startAmbient } from '../ui/audio';
import { onInputAction, type InputAction } from '../ui/input';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PIXEL_SCALE, textStyle } from '../ui/theme';
import { AERO, paintGlass } from '../ui/aero';
import { eventBackdrop, eventStyleOf } from '../core/presentation/eventStyles';
import { layoutFor } from '../ui/eventStyles';
import type { ChoiceWidget, EventCtx, EventLayoutHandles, Rect } from '../ui/eventStyles/types';
import { sceneForRun } from './routing';
import { tourneyBracket } from '../core/expansion/tourney';
import { drawChampionStage, drawTourneyPanel, drawTourneyStrip } from '../ui/tourneyBracket';
import { artOf, monFile } from '../ui/redux/game';
import { mountRedux, reduxOn, type ReduxView } from '../ui/redux/stage';
import { eventView as rxEventView } from '../ui/redux/screens/event';


const BOTTOM_H = 168;
const PICK_W = 420;

interface Card {
  box: Phaser.GameObjects.Container;
  view: ChoiceView;
  widget: ChoiceWidget;
}

export class EventScene extends Phaser.Scene {
  private sideId = '';
  private cards: Card[] = [];
  private index = 0;
  private phase: 'choose' | 'pick' | 'outcome' = 'choose';
  private busy = false;
  private outcomeStep: 'text' | 'rewards' = 'text';
  private inputReady = false;
  private leaving = false;
  private outcomeBox: Phaser.GameObjects.Container | null = null;
  private outcomeHint: Phaser.GameObjects.Text | null = null;
  private picker: { box: Phaser.GameObjects.Container; rows: Phaser.GameObjects.Text[]; picks: { uid: string; label: string }[]; at: number } | null = null;
  private result: EventResult | null = null;
  private calm = false;
  private moneyText: Phaser.GameObjects.Text | null = null;
  private layout: EventLayoutHandles | null = null;
  private bracketPanel: Phaser.GameObjects.Container | null = null;
  /** New UI: the mock-up event screen drawn over the canvas (default event style only). */
  private rx: ReduxView | null = null;
  private rxClock = '';
  private rxLeft = 0;

  constructor() {
    super('Event');
  }

  create(data: { sideId: string }): void {
    const { session } = services();
    const run = session.run!;
    const content = session.content;
    this.sideId = data.sideId;
    this.cards = [];
    this.index = 0;
    this.phase = 'choose';
    this.outcomeStep = 'text';
    this.picker = null;
    this.result = null;
    this.leaving = false;
    this.fullLayer = null;
    this.outcomeBox = null;
    this.outcomeHint = null;
    this.calm = session.settings.battleAnimations !== 'full';
    playMusicLazy(this, 'bgm.event');
    const view = eventView(content, run, this.sideId);
    const scene = view.event.scene;

    // The chosen event style draws the scene (run events redesign); this scene keeps state, input and the outcome.
    const theme = run.stage ? getTheme(content, run.stage.themeId) : undefined;
    const backdrop = `pack.memories.eventbg.${eventBackdrop(theme?.types ?? [], view.event.group, periodOf(run))}`;
    const arenaId = theme ? arenaFor(content, theme) : undefined;
    const arena = services().assets.has(backdrop) ? backdrop : arenaId;
    // An event that names no cast or Pokémon borrows the picture its map stop shows (never the scene backdrop or an item).
    const picked = scene.cast.some((id) => services().assets.has(id)) || scene.pokemon ? null : stopArtFor(content, view.event, (id) => services().assets.has(id));
    const fallback = picked && (picked.kind === 'trainer' || picked.kind === 'pokemon') ? picked : null;
    const tint = Phaser.Display.Color.HexStringToColor(scene.tint ?? '#1d1a24').color;
    const layers = { back: this.add.container(0, 0).setDepth(0), fx: this.add.container(0, 0).setDepth(5), front: this.add.container(0, 0).setDepth(10) };
    let area: Rect = { x: 0, y: 0, w: GAME_WIDTH, h: GAME_HEIGHT };
    const ctx: EventCtx = {
      scene: this,
      view,
      calm: this.calm,
      rim: COLORS.rarity[view.event.rarity] ?? AERO.rim,
      tint,
      arena: arena && services().assets.has(arena) ? arena : undefined,
      castIds: scene.cast.filter((id) => services().assets.has(id)).length ? scene.cast.filter((id) => services().assets.has(id)) : fallback?.kind === 'trainer' ? [fallback.assetId] : [],
      species: scene.pokemon ? content.species.get(scene.pokemon) : fallback?.kind === 'pokemon' ? content.species.get(fallback.species) : undefined,
      introSeen: session.settings.skipSeenDialogue && session.profile.npcMemory.seenEvents.includes(view.event.id),
      layers,
      dress: (r) => {
        area = r;
        const shade = this.add.rectangle(r.x, r.y, r.w, r.h, tint, 0.45).setOrigin(0);
        layers.back.add(shade);
        if (!this.calm) this.tweens.add({ targets: shade, alpha: 0.3, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        // Camp changes with the hour: a wash of the time of day.
        if (view.event.group === 'Camp') {
          const look = PERIOD_LOOK[periodOf(run)];
          if (look.alpha > 0) layers.back.add(this.add.rectangle(r.x, r.y, r.w, r.h, look.tint, look.alpha).setOrigin(0).setName('time-wash'));
        }
      },
    };
    this.layout = layoutFor(eventStyleOf(session.settings.eventStyle))(ctx, { focus: (i) => this.focus(i), pick: (i) => this.confirm(i) });
    if (view.event.group === 'Camp') {
      const look = PERIOD_LOOK[periodOf(run)];
      startAmbient(this, periodOf(run));
      this.add.text(GAME_WIDTH - 24, 56, `${clockLabel(run)}  ·  ${seasonOf(content, run)}${specialDateToday(content, run) ? `  ·  ${specialDateToday(content, run)!.label}` : ''}  ·  ${look.ambient}`, textStyle(16, '#f4ecd0', { stroke: '#101010', strokeThickness: 3 })).setOrigin(1, 0).setName('camp-clock').setDepth(30);
    }
    this.moneyPill(run.money, this.layout.moneyAt);
    // Beta 0.7 Fighting Tournament: the bracket strip on every tournament event, B for the full bracket, the podium at the end.
    this.bracketPanel = null;
    if (scene.tourney !== undefined) {
      const tv = tourneyBracket(content, run, scene.tourney);
      const toggle = (): void => {
        if (this.bracketPanel) { this.bracketPanel.destroy(); this.bracketPanel = null; return; }
        this.bracketPanel = drawTourneyPanel(this, content, tv, toggle);
      };
      drawTourneyStrip(this, tv, toggle);
      this.input.keyboard?.on('keydown-B', toggle);
      if (scene.tourney === 6) {
        const champ = run.party.find((m) => m.champion) ?? run.party.find((m) => m.speciesId === 'primeape' || m.speciesId === 'mankey');
        drawChampionStage(this, content, champ?.speciesId ?? 'primeape', Number(run.story.flags['ev:r25-food'] ?? 0) > 0, this.calm);
      }
    }
    this.rx = null;
    this.rxClock = '';
    if (reduxOn() && eventStyleOf(session.settings.eventStyle) === 'diorama' && scene.tourney === undefined) {
      const pct = (c: ChoiceView): string => (c.chance === null ? '' : `${Math.round(c.chance * 100)}%`);
      const sub = (c: ChoiceView): string => c.locked ?? [c.cost, c.preview ?? c.risk].filter(Boolean).join(' · ');
      const cast = artOf(this, ctx.castIds[0]);
      const star = ctx.species ? monFile(this, ctx.species.id) : null;
      const tag = `${view.event.group} · ${view.event.rarity.charAt(0).toUpperCase()}${view.event.rarity.slice(1)}`;
      this.rx = mountRedux(this, {
        render: (c) => {
          const r = this.result;
          const out = this.phase === 'outcome' && r ? { step: this.outcomeStep, ok: r.success, changes: r.changes, next: r.battle ? 'Battle!' : 'Continue' } : null;
          return rxEventView(c, {
            name: view.event.name,
            tag,
            line: out ? (out.step === 'rewards' ? 'Here is what changed.' : r!.text) : view.event.intro,
            art: artOf(this, ctx.arena)?.file ?? null,
            tint: scene.tint ?? null,
            fx: this.calm ? null : scene.effect,
            cast,
            mon: star,
            choices: view.choices.map((x) => ({ label: x.label, sub: sub(x), chance: pct(x), locked: x.locked !== null })),
            index: this.index,
            money: (r?.run ?? run).money,
            outcome: out,
            pick: this.picker ? { labels: this.picker.picks.map((x) => x.label), at: this.picker.at } : null,
            countdown: this.rxClock,
            timer: this.rxClock && view.event.countdown ? this.rxLeft / view.event.countdown : null,
          });
        },
        acts: {
          pick: (k) => this.confirm(Number(k)),
          next: () => this.advanceOutcome(),
          trade: (k) => { const uid = this.picker?.picks[Number(k)]?.uid; if (uid) void this.commit(uid); },
        },
        overs: { over: (k) => this.focus(Number(k)), tradeOver: (k) => this.pickAt(Number(k)) },
      });
      const rx = this.rx;
      // Timed prompts (press on the beat, hold...) are drawn by the game canvas: step aside while one plays.
      const sync = (): void => rx.visible(!this.busy);
      this.events.on('postupdate', sync);
      this.events.once('shutdown', () => this.events.off('postupdate', sync));
    } else this.offerFullText(view.event.intro);
    if (!this.calm) this.ambient(scene.effect, area, layers.fx);
    if (area.w < GAME_WIDTH || area.h < GAME_HEIGHT) layers.fx.setMask(this.make.graphics({}, false).fillRect(area.x, area.y, area.w, area.h).createGeometryMask());
    this.cards = this.layout.widgets.map((w, i) => ({ box: w.box, view: view.choices[i]!, widget: w }));
    this.focus(Math.max(0, view.choices.findIndex((c) => !c.locked)), false);
    onInputAction(this, (action) => this.handle(action));
    this.cameras.main.fadeIn(this.calm ? 1 : 300);
    // Split-second choice (ideas W1): a countdown when timed prompts are on; at zero the fallback option is taken.
    const seconds = view.event.countdown;
    if (seconds && session.settings.skillPrompts) {
      let left = seconds;
      this.rxClock = `Decide! ${left}`;
      this.rxLeft = left;
      this.rx?.refresh();
      const clock = this.add.text(GAME_WIDTH / 2, 20, `Decide! ${left}`, textStyle(26, '#ffe060', { stroke: '#181818', strokeThickness: 5 })).setOrigin(0.5).setDepth(50);
      this.time.addEvent({
        delay: 1000,
        repeat: seconds - 1,
        callback: () => {
          if (this.phase !== 'choose') return clock.destroy();
          left -= 1;
          this.rxClock = left > 0 ? `Decide! ${left}` : '';
          this.rxLeft = left;
          this.rx?.refresh();
          clock.setText(`Decide! ${left}`).setColor(left <= 3 ? '#ff6a6a' : '#ffe060');
          if (left > 0) return;
          clock.destroy();
          const open = view.choices.map((c, i) => (c.locked ? -1 : i)).filter((i) => i >= 0);
          const pick = view.event.timeoutChoice !== undefined && open.includes(view.event.timeoutChoice) ? view.event.timeoutChoice : open[open.length - 1];
          if (pick !== undefined) {
            this.focus(pick, false);
            this.confirm();
          }
        },
      });
    }
  }

  /** If the style's text card had to cut the intro, a "Read all" button opens the full text (nothing is ever hidden for good). */
  private offerFullText(intro: string): void {
    const all: Phaser.GameObjects.Text[] = [];
    const walk = (list: Phaser.GameObjects.GameObject[]) => list.forEach((o) => {
      if (o.type === 'Text') all.push(o as Phaser.GameObjects.Text);
      const kids = (o as Phaser.GameObjects.Container).list;
      if (kids) walk(kids);
    });
    walk(this.children.list);
    const flat = (t: string) => t.replace(/\s+/g, ' ').trim();
    const full = flat(intro);
    const cut = all.some((t) => {
      const shown = flat(t.text);
      return shown.endsWith('...') && shown.length > 12 && full.startsWith(shown.slice(0, -3).trimEnd()) && shown.length < full.length;
    });
    if (!cut) return;
    const btn = this.add.text(16, GAME_HEIGHT - 14, 'Read full text  (R)', textStyle(14, '#f8e8a0', { stroke: '#101010', strokeThickness: 3 })).setOrigin(0, 1).setDepth(45).setName('event-read-all');
    btn.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.toggleFull(intro));
    this.input.keyboard?.on('keydown-R', () => this.toggleFull(intro));
  }

  private fullLayer: Phaser.GameObjects.Container | null = null;

  private toggleFull(intro: string): void {
    if (this.fullLayer) {
      this.fullLayer.destroy();
      this.fullLayer = null;
      return;
    }
    if (this.phase !== 'choose') return;
    const layer = this.add.container(0, 0).setDepth(80);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8).setOrigin(0).setInteractive();
    shade.on('pointerdown', () => this.toggleFull(intro));
    const body = this.add.text(GAME_WIDTH / 2, 40, intro, textStyle(20, COLORS.textLight, { align: 'center', wordWrap: { width: GAME_WIDTH - 140 } })).setOrigin(0.5, 0);
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'Enter / click: close', textStyle(14, COLORS.textMuted)).setOrigin(0.5, 1);
    layer.add([shade, body, hint]);
    this.fullLayer = layer;
  }

  private handle(action: InputAction): void {
    if (this.bracketPanel) {
      this.bracketPanel.destroy();
      this.bracketPanel = null;
      return;
    }
    if (this.fullLayer) {
      if (action === 'confirm' || action === 'back') this.toggleFull('');
      return;
    }
    if (this.phase === 'outcome') {
      if (action === 'confirm' || action === 'back') this.advanceOutcome();
      return;
    }
    if (this.phase === 'pick') {
      this.handlePick(action);
      return;
    }
    const n = this.cards.length;
    if (action === 'left' || action === 'up') this.focus((this.index - 1 + n) % n);
    else if (action === 'right' || action === 'down') this.focus((this.index + 1) % n);
    else if (action === 'confirm') this.confirm();
  }

  /** The focused option lifts (each style draws its own focus); the details follow it. */
  private focus(i: number, sound = true): void {
    if (this.phase !== 'choose') return;
    if (sound && i !== this.index) playSfx(this, 'ui.select', 0.3);
    this.index = i;
    this.cards.forEach((c, j) => c.widget.focus(j === i));
    this.layout?.detail(this.cards[i]?.view);
    this.rx?.refresh();
  }

  private confirm(at?: number): void {
    if (this.phase !== 'choose' || this.busy) return;
    if (at !== undefined) this.index = at;
    const card = this.cards[this.index];
    if (!card) return;
    if (card.view.locked) {
      playSfx(this, 'ui.error', 0.5);
      if (!this.calm) this.shake(card.box, 300);
      return;
    }
    // A trade with more than one fitting Pokémon: the player picks which one goes.
    const picks = card.view.tradePicks;
    if (picks && picks.length > 1) this.openPicker(picks);
    else this.commit(picks?.[0]?.uid);
  }

  /** The party Pokémon the partner would take, as a list over the option column. */
  private openPicker(picks: { uid: string; label: string }[]): void {
    this.phase = 'pick';
    playSfx(this, 'ui.select', 0.5);
    const w = PICK_W;
    const rowH = Math.min(26, Math.floor((BOTTOM_H - 40) / picks.length));
    const box = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(40);
    const bg = this.add.graphics();
    paintGlass(bg, -w / 2, -BOTTOM_H / 2, w, BOTTOM_H, { tint: AERO.glassLow, glow: false, alpha: 0.98, radius: 14 });
    box.add(bg);
    box.add(this.add.text(0, -BOTTOM_H / 2 + 12, 'Pick a Pokémon (Esc: back)', textStyle(12, '#f8e8a0')).setOrigin(0.5, 0.5));
    const rows = picks.map((p, i) => {
      const t = this.add.text(0, -BOTTOM_H / 2 + 34 + i * rowH, p.label, textStyle(14, COLORS.textLight)).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.pickAt(i));
      t.on('pointerdown', () => this.commit(p.uid));
      box.add(t);
      return t;
    });
    this.picker = { box, rows, picks, at: 0 };
    this.pickAt(0);
    this.rx?.refresh();
  }

  private pickAt(i: number): void {
    const pk = this.picker;
    if (!pk) return;
    pk.at = i;
    pk.rows.forEach((t, j) => t.setColor(j === i ? '#f8e8a0' : COLORS.textLight).setText(`${j === i ? '▶ ' : ''}${pk.picks[j]!.label}`));
    this.rx?.refresh();
  }

  private handlePick(action: InputAction): void {
    const pk = this.picker;
    if (!pk) return;
    const n = pk.picks.length;
    if (action === 'up' || action === 'left') this.pickAt((pk.at - 1 + n) % n);
    else if (action === 'down' || action === 'right') this.pickAt((pk.at + 1) % n);
    else if (action === 'confirm') this.commit(pk.picks[pk.at]!.uid);
    else if (action === 'back') {
      pk.box.destroy();
      this.picker = null;
      this.phase = 'choose';
      this.rx?.refresh();
    }
  }

  private async commit(tradeUid?: string): Promise<void> {
    if (this.busy) return;
    this.picker?.box.destroy();
    this.picker = null;
    const { session } = services();
    // Ideas W5: a choice with a skill prompt plays it first; the grade alone decides the outcome.
    const def = eventView(session.content, session.run!, this.sideId).event.choices[this.index]?.prompt;
    let grade: Grade | undefined;
    if (def) {
      this.busy = true;
      try {
        grade = (await runInteractionPrompt(this, promptById(def.id), { motion: session.settings.battleAnimations, assist: { skipGrade: 'good' }, mic: session.settings.expansion.micInput })).grade;
      } catch {
        grade = 'ok';
      }
      this.busy = false;
    }
    this.result = session.chooseEvent(this.sideId, this.index, tradeUid, grade);
    this.phase = 'outcome';
    playSfx(this, 'ui.select', 0.6);
    const wait = this.layout?.picked(this.index) ?? 10;
    this.time.delayedCall(wait, () => this.showOutcome());
  }

  /**
   * The outcome plays in two beats, each waiting for the player: the outcome text first (it stays until Enter/click),
   * then, once that text is gone, the rewards pop in (they stay until Enter/click, which leaves the scene).
   */
  private showOutcome(): void {
    const r = this.result!;
    playSfx(this, r.success ? 'se.level_up' : 'ui.error', 0.5);
    this.outcomeStep = 'text';
    this.inputReady = false;
    this.rxClock = '';
    this.rx?.refresh();
    this.time.delayedCall(this.calm ? 0 : 450, () => (this.inputReady = true));
    this.input.on('pointerdown', () => this.advanceOutcome());
    const chips = r.changes;
    const lastHint = r.battle ? 'Enter: battle!' : 'Enter: continue';
    const text = this.add.text(0, 0, r.text, textStyle(18, COLORS.textLight, { align: 'center', wordWrap: { width: 720 } })).setOrigin(0.5, 0);
    const head = r.success ? '' : 'It didn’t go your way…';
    const h = Math.max(164, text.height + 98);
    const box = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT + h).setDepth(30);
    const g = this.add.graphics();
    paintGlass(g, -380, -h / 2, 760, h, { rim: r.success ? 0x60d070 : 0xf07070, radius: 20 });
    box.add(g);
    box.add(this.add.text(0, -h / 2 + 20, head, textStyle(15, COLORS.bad)).setOrigin(0.5, 0));
    text.setPosition(0, -h / 2 + 42);
    box.add(text);
    this.outcomeBox = box;
    this.tweens.add({ targets: box, y: GAME_HEIGHT - h / 2 - 30, duration: this.calm ? 1 : 520, ease: 'Back.easeOut' });
    const hint = this.add.text(GAME_WIDTH - 52, GAME_HEIGHT - 20, chips.length ? 'Enter: continue' : lastHint, textStyle(15, COLORS.textMuted, { stroke: '#101010', strokeThickness: 3 })).setOrigin(1, 1).setDepth(31);
    if (!this.calm) this.tweens.add({ targets: hint, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    this.outcomeHint = hint;
  }

  /** One input moves the outcome on: text -> rewards -> leave. Ignored until the panel has settled. */
  private advanceOutcome(): void {
    if (this.phase !== 'outcome' || !this.inputReady) return;
    const r = this.result!;
    if (this.outcomeStep === 'text' && r.changes.length) {
      this.outcomeStep = 'rewards';
      this.inputReady = false;
      this.rx?.refresh();
      playSfx(this, 'ui.select', 0.4);
      const old = this.outcomeBox;
      if (old) {
        this.tweens.add({ targets: old, y: GAME_HEIGHT + 260, duration: this.calm ? 1 : 260, ease: 'Quad.easeIn', onComplete: () => old.destroy() });
      }
      this.time.delayedCall(this.calm ? 0 : 280, () => this.showRewards());
      return;
    }
    this.leave();
  }

  /** Rewards only: they appear after the text is gone and stay until the next input. */
  private showRewards(): void {
    const r = this.result!;
    const chips = r.changes;
    const per = Math.min(4, Math.max(1, chips.length));
    const rows = Math.ceil(chips.length / per);
    const h = 70 + rows * 32;
    const box = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT + h).setDepth(30);
    const g = this.add.graphics();
    paintGlass(g, -380, -h / 2, 760, h, { rim: r.success ? 0x60d070 : 0xf07070, radius: 20 });
    box.add(g);
    box.add(this.add.text(0, -h / 2 + 12, 'Results', textStyle(14, COLORS.textMuted)).setOrigin(0.5, 0));
    this.outcomeBox = box;
    this.tweens.add({ targets: box, y: GAME_HEIGHT - h / 2 - 30, duration: this.calm ? 1 : 360, ease: 'Back.easeOut' });
    const baseY = -h / 2 + 52;
    chips.forEach((text, i) => {
      const cx = ((i % per) - (per - 1) / 2) * 180;
      const cy = baseY + Math.floor(i / per) * 32;
      const good = !/^(−|Lost|party loses|party (poisoned|burned|paralysed|asleep)|Evil|Rage)/.test(text);
      const chip = this.add.text(cx, cy, text, textStyle(15, good ? COLORS.good : COLORS.bad, { backgroundColor: '#0c2a44', padding: { x: 10, y: 3 } })).setOrigin(0.5).setName('event-chip');
      chip.setScale(this.calm ? 1 : 0);
      box.add(chip);
      this.tweens.add({
        targets: chip,
        scale: 1,
        duration: 320,
        delay: 360 + i * 160,
        ease: 'Back.easeOut',
        onStart: () => playSfx(this, 'se.exp', 0.3),
        onComplete: () => {
          if (this.calm) return;
          this.chipAck(box, cx, cy, good);
          if (good) this.flyGain(text, GAME_WIDTH / 2 + cx, GAME_HEIGHT - h / 2 - 30 + cy);
        },
      });
    });
    // The money pill counts to the new total once the chips have landed.
    const money = r.run.money;
    this.time.delayedCall(this.calm ? 0 : 360 + chips.length * 160, () => this.countMoney(money));
    this.outcomeHint?.setText(r.battle ? 'Enter: battle!' : 'Enter: continue');
    // Wait for the chips to land (and a beat to read them) before Enter can leave.
    this.time.delayedCall(this.calm ? 0 : 360 + chips.length * 160 + 300, () => (this.inputReady = true));
  }

  private moneyPill(money: number, at = { x: GAME_WIDTH - 172, y: 14 }): void {
    const g = this.add.graphics().setDepth(30);
    paintGlass(g, at.x, at.y, 148, 34, { radius: 17, glow: false });
    this.moneyText = this.add.text(at.x + 74, at.y + 17, `₽${money}`, textStyle(17)).setOrigin(0.5).setName('event-money').setDepth(30);
  }

  /** The money pill rolls to the new total and pulses (green up, red down). */
  private countMoney(to: number): void {
    const text = this.moneyText;
    if (!text) return;
    const from = Number(text.text.slice(1));
    if (from === to) return;
    text.setColor(to > from ? COLORS.good : COLORS.bad);
    if (this.calm) {
      text.setText(`₽${to}`);
      return;
    }
    playSfx(this, 'se.exp', 0.3);
    const roll = { v: from };
    this.tweens.add({ targets: roll, v: to, duration: 600, ease: 'Quad.easeOut', onUpdate: () => text.setText(`₽${Math.round(roll.v)}`), onComplete: () => text.setText(`₽${to}`) });
    this.tweens.add({ targets: text, scale: 1.25, duration: 160, yoyo: true, repeat: 1, ease: 'Sine.easeOut' });
  }

  /** A gain gets a ring of sparkles; a loss gives a short shudder. */
  /** A gain flies from its chip to where it lands: money to the purse, attributes to the bars, Pokémon changes to the party, anything else to the Bag. */
  private flyGain(text: string, x: number, y: number): void {
    const toMoney = /₽|money/i.test(text);
    const toAttr = /(Strength|Intelligence|Speed|Charisma|Luck|Love|Rage|Peace|Good|Evil)\b/.test(text);
    const toParty = /friendship|level|heal|HP|move|egg/i.test(text);
    const [tx, ty] = toMoney ? [GAME_WIDTH - 90, 28] : toAttr ? [70, 28] : toParty ? [90, GAME_HEIGHT - 30] : [GAME_WIDTH - 90, GAME_HEIGHT - 30];
    const orb = this.add.circle(x, y, 7, toMoney ? 0xf8d030 : toAttr ? 0x80d0ff : toParty ? 0xf08098 : 0xa0f0a0, 1).setStrokeStyle(2, 0xffffff, 0.9).setDepth(50);
    this.tweens.add({ targets: orb, x: tx, y: ty, scale: 0.4, duration: 650, ease: 'Cubic.easeIn', onComplete: () => orb.destroy() });
  }

  private chipAck(box: Phaser.GameObjects.Container, x: number, y: number, good: boolean): void {
    if (!good) {
      this.tweens.add({ targets: box, x: box.x + 4, duration: 50, yoyo: true, repeat: 2 });
      return;
    }
    for (let k = 0; k < 6; k++) {
      const a = (Math.PI * 2 * k) / 6;
      const star = this.add.star(x, y, 4, 1.5, 5, 0xfff4a0, 1);
      box.add(star);
      this.tweens.add({ targets: star, x: x + Math.cos(a) * 46, y: y + Math.sin(a) * 18, alpha: 0, angle: 120, duration: 520, ease: 'Quad.easeOut', onComplete: () => star.destroy() });
    }
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    const run = services().session.run!;
    this.cameras.main.fadeOut(this.calm ? 1 : 260);
    this.time.delayedCall(this.calm ? 10 : 270, () => this.scene.start(sceneForRun(run)));
  }

  private shake(target: Phaser.GameObjects.GameObject, every: number): void {
    this.tweens.add({ targets: target, angle: { from: -6, to: 6 }, duration: 70, yoyo: true, repeat: 3, repeatDelay: 0, loop: -1, loopDelay: every });
  }

  /** The event's signature effect, drawn from simple shapes so it needs no art. */
  private ambient(effect: string, r: Rect, fx: Phaser.GameObjects.Container): void {
    const spawn = (make: () => Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.AlphaSingle, fall: number, drift: number, life: number, every: number) => {
      this.time.addEvent({
        delay: every,
        loop: true,
        callback: () => {
          const o = make();
          fx.add(o);
          this.tweens.add({ targets: o, y: o.y + fall, x: o.x + Phaser.Math.Between(-drift, drift), alpha: 0, angle: Phaser.Math.Between(-90, 90), duration: life, ease: 'Sine.easeIn', onComplete: () => o.destroy() });
        },
      });
    };
    const rnd = (a: number, b: number) => Phaser.Math.Between(a, b);
    switch (effect) {
      case 'rain':
        return spawn(() => this.add.rectangle(rnd(r.x, r.x + r.w), rnd(r.y - 40, r.y), 2, 14, 0x9cc8f8, 0.7), 340, 30, 700, 30);
      case 'snow':
        return spawn(() => this.add.circle(rnd(r.x, r.x + r.w), rnd(r.y - 20, r.y), rnd(2, 4), 0xffffff, 0.9), 320, 60, 2600, 90);
      case 'fire':
        return spawn(() => this.add.circle(rnd(r.x + r.w * 0.08, r.x + r.w * 0.92), rnd(r.y + r.h * 0.52, r.y + r.h * 0.56), rnd(3, 6), Phaser.Math.RND.pick([0xf8a030, 0xf86030, 0xf8d050]), 0.9), -220, 40, 1400, 70);
      case 'hearts':
        return spawn(() => this.add.text(rnd(r.x + r.w * 0.12, r.x + r.w * 0.88), rnd(r.y + r.h * 0.44, r.y + r.h * 0.54), '♥', textStyle(rnd(16, 26), "#f87898")), -200, 40, 1800, 260);
      case 'sparkle':
      case 'glint':
        return spawn(() => this.add.star(rnd(r.x + r.w * 0.1, r.x + r.w * 0.9), rnd(r.y + r.h * 0.17, r.y + r.h * 0.52), 4, 2, rnd(5, 9), 0xfff4a0, 1), -20, 10, 900, effect === 'glint' ? 240 : 120);
      case 'confetti':
        return;
      case 'fog':
        return spawn(() => this.add.ellipse(rnd(r.x - 60, r.x + r.w), rnd(r.y + r.h * 0.3, r.y + r.h * 0.56), rnd(120, 220), rnd(30, 50), 0xd8d8e8, 0.18), 0, 160, 4000, 500);
      case 'float':
        return spawn(() => this.add.circle(rnd(r.x + r.w * 0.1, r.x + r.w * 0.9), rnd(r.y + r.h * 0.46, r.y + r.h * 0.56), rnd(2, 5), 0xc8a0f8, 0.8), -180, 20, 2400, 180);
      case 'flicker': {
        const dark = this.add.rectangle(r.x, r.y, r.w, r.h, 0x000000, 0).setOrigin(0);
        fx.add(dark);
        this.time.addEvent({ delay: 1600, loop: true, callback: () => this.tweens.add({ targets: dark, alpha: { from: 0.55, to: 0 }, duration: 90, yoyo: true, repeat: 2 }) });
        return;
      }
      case 'spin': {
        const wheel = this.add.star(r.x + r.w / 2, r.y + r.h * 0.35, 8, 30, 70, 0xf8d030, 0.85);
        fx.add(wheel);
        this.tweens.add({ targets: wheel, angle: 360, duration: 1400, repeat: -1 });
        return;
      }
      case 'net': {
        const net = this.add.grid(r.x + r.w - 300, r.y - 160, 300, 160, 20, 20, undefined, 0, 0xd8d8d8, 0.8);
        fx.add(net);
        this.tweens.add({ targets: net, y: r.y + r.h * 0.37, duration: 700, delay: 600, ease: 'Bounce.easeOut' });
        return;
      }
      default:
        return;
    }
  }
}
