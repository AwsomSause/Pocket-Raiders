// A Trade Stop (trade stops redesign, Kice 2026-11-02): the Trade Post service and the Plaza's specialist
// traders, drawn in one of twelve anime/manga styles (ui/tradeStyles; "random" alternates them per stop).
// This scene keeps state, input and the real trade (useService / usePlaza, unchanged); the style only draws.
// The trade moment is presentation: the party has already changed when it plays.

import Phaser from 'phaser';
import { periodOf } from '../core/clock';
import { pickTradeStyle, tradeSalt, type TradeStyleId } from '../core/presentation/tradeStyles';
import { eventBackdrop } from '../core/presentation/eventStyles';
import { getTheme } from '../core/themes';
import { tradeView, type TradeOffer, type TradeSource, type TradeView } from '../core/trade/view';
import { pokemonAssetIds } from '../assets/catalog';
import { services } from '../game/services';
import { playMusicLazy, playSfx } from '../ui/audio';
import { onInputAction, type InputAction } from '../ui/input';
import { loadAssets } from '../ui/lazyAssets';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { styleFor } from '../ui/tradeStyles';
import type { RowWidget, TradeCtx, TradeRow, TradeStyle } from '../ui/tradeStyles/types';
import { sceneForRun } from './routing';
import { ensureNarration, partyNarration } from '../core/overhaul/partyNarration';

export interface TradeSceneData {
  source: TradeSource;
  sideId: string;
  /** Where to go back to: the map, or the plaza (with its district focus). */
  back: { scene: 'Map' | 'Plaza'; focus?: number };
}

const PLAYER_ART = 'trainer.red';

export class TradeScene extends Phaser.Scene {
  private data0!: TradeSceneData;
  private view!: TradeView;
  private rows: TradeRow[] = [];
  private style!: TradeStyle;
  private styleId: TradeStyleId | 'original' = 'manga';
  private ctx!: TradeCtx;
  private widgets: RowWidget[] = [];
  private first = 0;
  private index = 0;
  private phase: 'loading' | 'choose' | 'moment' | 'done' = 'loading';
  private notice = '';

  constructor() {
    super('Trade');
  }

  create(data: TradeSceneData): void {
    const { session, assets } = services();
    const run = session.run!;
    const content = session.content;
    this.data0 = data;
    this.phase = 'loading';
    this.widgets = [];
    this.first = 0;
    this.index = 0;
    this.notice = '';
    this.view = tradeView(content, run, data.source, data.sideId);
    this.rows = [
      ...this.view.offers.map((o): TradeRow => ({ title: o.give ? `${o.give.name} for ${o.get.name}` : `${o.trader.name}: wants ${o.note.replace(/^Wants /, '')}`, sub: `${data.source === 'plaza' ? `${o.trader.name} · ` : ''}${o.cost > 0 ? `₽${o.cost} · ` : ''}Lv${o.get.level} ${o.get.types.join('/')}`, problem: o.problem, offer: o })),
      { title: data.source === 'service' ? 'Not today' : 'Maybe later', sub: 'Leave', problem: null, offer: null },
    ];
    // Presentation pick: a hash of the run seed, the stop and trades made, never gameplay RNG.
    this.styleId = pickTradeStyle(session.settings.screenStyles, tradeSalt(run.seed, data.sideId, run.log.counters.tradesMade ?? 0));
    this.style = styleFor(this.styleId === 'original' ? 'manga' : this.styleId);
    const theme = run.stage ? getTheme(content, run.stage.themeId) : undefined;
    const bd = `pack.memories.eventbg.${eventBackdrop(theme?.types ?? [], 'Merchants and deals', periodOf(run))}`;
    const calm = session.settings.battleAnimations !== 'full' || session.settings.disableAllAnimations;
    const layers = { back: this.add.container(0, 0).setDepth(0), stage: this.add.container(0, 0).setDepth(10), list: this.add.container(0, 0).setDepth(20), top: this.add.container(0, 0).setDepth(40) };
    this.ctx = { scene: this, view: this.view, calm, backdrop: bd, player: PLAYER_ART, species: (id) => content.species.get(id)!, layers };
    playMusicLazy(this, 'bgm.shop');
    this.cameras.main.setBackgroundColor('#101018');

    // Everything the style can draw is loaded first, so sprites appear at once (no placeholder pop).
    const sides = this.view.offers.flatMap((o) => [o.get, ...(o.give ? [o.give] : [])]);
    const ids = new Set<string>([bd, PLAYER_ART, ...this.view.offers.map((o) => o.trader.art)]);
    for (const s of sides) {
      const a = pokemonAssetIds(content.species.get(s.speciesId)!.assets);
      ids.add(a.front);
      ids.add(a.back);
    }
    const wanted = [...ids].filter((id) => assets.has(id));
    void loadAssets(this, wanted).then(() => {
      if (this.ctx.layers.back.active) this.build();
    });
    onInputAction(this, (a) => this.handle(a));
  }

  private build(): void {
    this.style.frame(this.ctx);
    this.phase = 'choose';
    const start = this.rows.findIndex((r) => !r.problem);
    this.index = start < 0 ? this.rows.length - 1 : start;
    this.drawList();
    this.drawStage();
    if (!this.ctx.calm) this.cameras.main.fadeIn(250);
  }

  /** The style id this stop drew with (tests read it). */
  get drawnStyle(): string {
    return this.styleId;
  }

  private drawList(): void {
    const per = this.style.rows;
    if (this.index < this.first) this.first = this.index;
    if (this.index >= this.first + per) this.first = this.index - per + 1;
    this.ctx.layers.list.removeAll(true);
    this.widgets = this.style.list(this.ctx, this.rows.slice(this.first, this.first + per), this.first, { focus: (i) => this.focus(i), pick: (i) => this.pick(i) });
    if (this.rows.length > per) {
      const more = `${this.first + 1}-${Math.min(this.rows.length, this.first + per)} of ${this.rows.length}`;
      this.ctx.layers.list.add(this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 6, more, textStyle(13, '#ffffff', { stroke: '#000000', strokeThickness: 3 })).setOrigin(1, 1));
    }
    this.widgets.forEach((w, i) => w.focus(this.first + i === this.index));
  }

  private drawStage(): void {
    this.ctx.layers.stage.removeAll(true);
    this.tweens.killTweensOf(this.ctx.layers.stage.list);
    this.style.stage(this.ctx, this.rows[this.index]!.offer);
  }

  private focus(i: number, sound = true): void {
    if (this.phase !== 'choose' || i === this.index || i < 0 || i >= this.rows.length) return;
    this.index = i;
    if (sound) playSfx(this, 'ui.move', 0.5);
    const paged = i < this.first || i >= this.first + this.style.rows;
    if (paged) this.drawList();
    else this.widgets.forEach((w, k) => w.focus(this.first + k === i));
    this.drawStage();
  }

  private handle(action: InputAction): void {
    if (this.phase === 'done') {
      if (action === 'confirm' || action === 'back') this.leave();
      return;
    }
    if (this.phase !== 'choose') return;
    if (action === 'up' || action === 'left') this.focus((this.index - 1 + this.rows.length) % this.rows.length);
    else if (action === 'down' || action === 'right') this.focus((this.index + 1) % this.rows.length);
    else if (action === 'confirm') this.pick(this.index);
    else if (action === 'back') this.leave();
  }

  private pick(i: number): void {
    if (this.phase !== 'choose') return;
    const row = this.rows[i]!;
    if (!row.offer) return this.leave();
    if (row.problem || !row.offer.give) return playSfx(this, 'ui.error', 0.5);
    const { session } = services();
    try {
      this.notice = this.data0.source === 'service' ? session.useService(this.data0.sideId, row.offer.id) : session.usePlaza(this.data0.sideId, 'traders', row.offer.id).message;
      // The pack's trade reaction from the party (text only; the file loads on request).
      void ensureNarration().catch(() => undefined);
      const run = session.run;
      const nameOf = (m: { speciesId: string }) => session.content.species.get(m.speciesId)?.name ?? m.speciesId;
      const react = run ? partyNarration(run.party, 'trade', `${run.runId}:${run.encountersCompleted}:${row.offer.id}`, nameOf, (m) => session.content.species.get(m.speciesId)?.types ?? []) : null;
      if (react) this.notice = `${this.notice} ${react}`;
    } catch (err) {
      playSfx(this, 'ui.error', 0.5);
      this.notice = String(err instanceof Error ? err.message : err);
      return;
    }
    playSfx(this, 'ui.select');
    this.phase = 'moment';
    this.ctx.view.money = session.run!.money;
    this.ctx.layers.list.removeAll(true);
    this.ctx.layers.stage.setVisible(false);
    const offer = row.offer as TradeOffer & { give: NonNullable<TradeOffer['give']> };
    const ms = this.style.moment(this.ctx, offer);
    this.time.delayedCall(this.ctx.calm ? Math.min(ms, 300) : ms, () => {
      this.phase = 'done';
      const tip = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 14, '▼ Continue', textStyle(16, '#ffffff', { stroke: '#000000', strokeThickness: 4 })).setOrigin(0.5, 1).setDepth(60);
      if (!this.ctx.calm) this.tweens.add({ targets: tip, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
      this.input.once('pointerdown', () => this.leave());
    });
  }

  private leave(): void {
    if (this.phase === 'loading') return;
    this.phase = 'loading';
    const { session } = services();
    const run = session.run!;
    const notice = this.notice || undefined;
    // Fade first so the key that closed this screen is not read again by the next one.
    this.cameras.main.fadeOut(this.ctx.calm ? 1 : 220);
    this.time.delayedCall(this.ctx.calm ? 30 : 240, () => {
      if (run.phase !== 'map') this.scene.start(sceneForRun(run));
      else if (this.data0.back.scene === 'Plaza') this.scene.start('Plaza', { sideId: this.data0.sideId, notice, focus: this.data0.back.focus ?? 0 });
      else this.scene.start('Map', { notice, focus: 0 });
    });
  }
}
