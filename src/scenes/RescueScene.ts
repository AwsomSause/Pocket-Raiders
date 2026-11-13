// The Rival Rescue Plan screen (Beta 0.6 R9): the rival's offer, the plan choice with readiness words (never numbers),
// the three beats and the complication, the result and the reunion. Launched on top of the map at a quiet node
// (`this.scene.launch('Rescue', data)`); it calls the core rescue rules and never rolls anything itself (the one roll
// happens inside `finishPlan`). All the words come from core/evil/rescueView.ts. Esc on the offer is "not now".

import Phaser from 'phaser';
import { acceptOffer, abandonPlan, answerBeat, answerComplication, declineOffer, exchangeLine, finishPlan, type Offer, type RescueCtx, type RescueOutcome } from '../core/evil/rescue';
import { exchangeView, nextBeatView, offerView, resultView, type BeatView, type OfferView } from '../core/evil/rescueView';
import { services } from '../game/services';
import { drawGlass } from '../ui/aero';
import { fitBlock } from '../ui/fitText';
import { onInputAction } from '../ui/input';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { Menu } from '../ui/widgets';

export interface RescueSceneData {
  offer: Offer;
  ctx: RescueCtx;
  node: number;
  names: { player: string; mon: string };
  /** The scene that opened this one (resumed when the screen closes). */
  from: string;
  /** Called with the outcome (or null when the offer was declined / not now). */
  onDone?: (out: RescueOutcome | null) => void;
}

const GOLD = '#ffe08a';
const SKY = '#cfefff';

export class RescueScene extends Phaser.Scene {
  private data0!: RescueSceneData;
  private layer: Phaser.GameObjects.GameObject[] = [];
  private menu: Menu | null = null;
  private exchangeStep: 0 | 1 | 2 = 0;
  private site = '';

  constructor() {
    super('Rescue');
  }

  init(data: RescueSceneData): void {
    this.data0 = data;
    this.exchangeStep = 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1a2a');
    onInputAction(this, (a) => this.menu?.handle(a));
    this.showOffer();
  }

  private get run() {
    return services().session.run!;
  }

  private clear(): void {
    this.menu?.destroy();
    this.menu = null;
    for (const o of this.layer) o.destroy();
    this.layer = [];
  }

  private panel(title: string, body: string, side?: string): void {
    this.layer.push(drawGlass(this, 24, 20, GAME_WIDTH - 48, 250));
    this.layer.push(this.add.text(44, 30, title, textStyle(22, GOLD)));
    const t = this.add.text(44, 66, body, textStyle(15, SKY, { wordWrap: { width: GAME_WIDTH - 100 } }));
    fitBlock(t, GAME_WIDTH - 100, 190);
    this.layer.push(t);
    if (side) this.layer.push(this.add.text(GAME_WIDTH - 44, 30, side, textStyle(14, GOLD)).setOrigin(1, 0));
  }

  private finish(out: RescueOutcome | null): void {
    services().session.saveRunNow();
    this.clear();
    this.scene.stop();
    this.scene.resume(this.data0.from);
    this.data0.onDone?.(out);
  }

  // ---- offer ----

  private showOffer(): void {
    this.clear();
    const { offer, ctx, node, names } = this.data0;
    const v: OfferView = offerView(this.run, offer, ctx, node, names);
    this.site = v.site;
    const body = `${v.lines.join('\n\n')}\n\n${v.receipt ? `Receipt: ${v.receipt}\n` : ''}Held at ${v.site}. ${v.count} Pokémon. Jailer: ${v.jailer}.`;
    this.panel('The rival has a plan', body, `Clock: ${v.clock.label} (${v.clock.nodesHeld} nodes)`);
    const options = [
      ...v.plans.map((p) => ({ label: `${p.label}${p.preferred ? ' *' : ''}${p.readiness ? `  [${p.readiness}]` : ''}`, detail: p.available ? p.pitch : (p.reason ?? ''), disabled: !p.available })),
      { label: 'Not now', detail: 'The offer will come back.' },
    ];
    this.menu = new Menu(this, {
      x: 44, y: 285, options, itemWidth: GAME_WIDTH - 100, itemHeight: 38, fontSize: 18,
      onSelect: (i) => {
        if (i === v.plans.length) { declineOffer(this.run, v.holdId, node, ctx.archetype); this.finish(null); return; }
        this.startPlan(v.plans[i]!.plan, v.holdId);
      },
      onBack: () => { declineOffer(this.run, v.holdId, node, ctx.archetype); this.finish(null); },
    });
  }

  private startPlan(plan: Parameters<typeof acceptOffer>[2], holdId: string): void {
    const { ctx, node } = this.data0;
    try {
      acceptOffer(this.run, holdId, plan, ctx, node);
    } catch (e) {
      this.add.text(44, 262, String((e as Error).message), textStyle(14, '#ff9a9a'));
      return;
    }
    if (plan === 'deal') return this.finishNow();
    if (plan === 'exchange') return this.showExchange();
    this.showBeat();
  }

  // ---- beats ----

  private showBeat(): void {
    this.clear();
    const bv: BeatView | null = nextBeatView(this.run, this.data0.ctx);
    if (!bv) return this.finishNow();
    const title = bv.kind === 'beat' ? `${bv.title[0]!.toUpperCase()}${bv.title.slice(1)} (${bv.index + 1} of ${bv.total})` : `Complication: ${bv.title}`;
    this.panel(title, [bv.scene, bv.hint ? `"${bv.hint}"` : null].filter(Boolean).join('\n\n'));
    this.menu = new Menu(this, {
      x: 44, y: 285, options: bv.choices.map((c) => ({ label: c.text })), itemWidth: GAME_WIDTH - 100, itemHeight: 40, fontSize: 18,
      onSelect: (i) => {
        const c = bv.choices[i]!;
        if (bv.kind === 'beat') answerBeat(this.run, c.rating);
        else answerComplication(this.run, c.rating === 'good' ? 'good' : 'poor');
        this.showBeat();
      },
      onBack: () => { abandonPlan(this.run, this.data0.node); this.finish(null); },
    });
  }

  // ---- the Exchange ----

  private showExchange(): void {
    this.clear();
    const ev = exchangeView(this.run, this.exchangeStep);
    this.panel(`The Exchange: ${ev.title}`, 'A trade on neutral ground. The rival watches the exits.');
    this.menu = new Menu(this, {
      x: 44, y: 285, options: ev.choices.map((c) => ({ label: c.text })), itemWidth: GAME_WIDTH - 100, itemHeight: 40, fontSize: 18,
      onSelect: (i) => {
        const r = exchangeLine(this.run, ev.choices[i]!.wrong);
        if (r.fallback) return this.showBeat();
        if (r.done) return this.finishNow();
        this.exchangeStep = Math.min(2, this.exchangeStep + 1) as 0 | 1 | 2;
        this.showExchange();
      },
    });
  }

  // ---- result and reunion ----

  private finishNow(): void {
    const { ctx, node, names } = this.data0;
    const out = finishPlan(this.run, ctx, node);
    this.clear();
    const rv = resultView(out, ctx.archetype, { ...names, site: this.site });
    const extra = out.cellmate ? `\n\nA Pokémon from the next cage follows you out: ${out.cellmate.speciesId}${out.cellmate.shadow ? ' (Shadow)' : ''}.` : '';
    this.panel(rv.headline, `${rv.lines.join('\n\n')}\n\nBack with you: ${rv.returned}. Still held: ${rv.stillHeld}.${out.moneySpent ? `\nPaid: ${out.moneySpent}.` : ''}${extra}`);
    this.menu = new Menu(this, { x: 44, y: 285, options: [{ label: 'Continue' }], itemWidth: 300, onSelect: () => this.finish(out) });
  }
}
