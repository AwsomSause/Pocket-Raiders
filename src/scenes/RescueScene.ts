// The Rival Rescue Plan screen (Beta 0.6 R9): the rival's offer, the plan choice with readiness words (never numbers),
// the three beats and the complication, the result and the reunion. Launched on top of the map at a quiet node
// (`this.scene.launch('Rescue', data)`); it calls the core rescue rules and never rolls anything itself (the one roll
// happens inside `finishPlan`). All the words come from core/evil/rescueView.ts. Esc on the offer is "not now".

import Phaser from 'phaser';
import { acceptOffer, abandonPlan, answerBeat, answerComplication, BEATS, declineOffer, exchangeLine, finishPlan, holdOf, holdState, RESCUE, rescueOf, siteOf, type Offer, type RescueCtx, type RescueOutcome } from '../core/evil/rescue';
import { fightAfterAnswer, pendingFight, startRescueFight, type FightSpot } from '../core/evil/rescueFights';
import { exchangeView, nextBeatView, offerView, resultView, type BeatView, type OfferView } from '../core/evil/rescueView';
import { rivalReport } from '../core/rivals/report';
import { services } from '../game/services';
import { drawGlass } from '../ui/aero';
import { fitBlock } from '../ui/fitText';
import { onInputAction, type InputAction } from '../ui/input';
import { rivalArt } from '../ui/redux/game';
import { rescueView, type RescueModel, type RescueOption } from '../ui/redux/screens/ops';
import { pageLines, type ScriptLine, type ScriptPage } from '../ui/redux/script';
import { mountRedux, reduxOn, type ReduxView } from '../ui/redux/stage';
import type { Art } from '../ui/redux/templates';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import { Menu } from '../ui/widgets';

export interface RescueSceneData {
  /** The offer to show; absent when a running plan resumes (after a guard fight or a reload). */
  offer?: Offer;
  resume?: boolean;
  ctx: RescueCtx;
  node: number;
  names: { player: string; mon: string };
  /** The scene that opened this one (resumed when the screen closes). */
  from: string;
  /** Called with the outcome (or null when the offer was declined / not now). */
  onDone?: (out: RescueOutcome | null) => void;
}

/** New UI: one step of the screen (the offer, a beat, a guard, the result): the lines to read, then the choices. */
interface RescueCard {
  lines: ScriptLine[];
  /** Each choice, and what the text box says while the cursor rests on it (a plan's pitch, or why it is closed). */
  options: (RescueOption & { say?: ScriptLine })[];
  clock: RescueModel['clock'];
  stamp?: { text: string; good: boolean };
  onSelect: (i: number) => void;
  onBack?: () => void;
}
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
/** New UI: the text box holds two rows, so longer talk is read a page at a time. */
const RX_PAGE = 150;

const GOLD = '#ffe08a';
const SKY = '#cfefff';

export class RescueScene extends Phaser.Scene {
  private data0!: RescueSceneData;
  private layer: Phaser.GameObjects.GameObject[] = [];
  private menu: Menu | null = null;
  private exchangeStep: 0 | 1 | 2 = 0;
  private site = '';
  /** New UI: the mock-ups' Rescue page over the canvas, the step on show, its pages and the cursor. */
  private rx: ReduxView | null = null;
  private card: RescueCard | null = null;
  private pages: ScriptPage[] = [];
  private pageAt = 0;
  private pick = 0;
  /** The cursor has moved since the choices came up: the text box now speaks for the choice under it. */
  private moved = false;
  private slip: Pick<RescueModel, 'head' | 'held' | 'notes' | 'slip' | 'stamp'> = { head: '', held: [], notes: [], slip: '', stamp: '' };
  private rival: { name: string; art: Art | null } = { name: 'Rival', art: null };

  constructor() {
    super('Rescue');
  }

  init(data: RescueSceneData): void {
    this.data0 = data;
    this.exchangeStep = 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1a2a');
    this.rx = null;
    this.card = null;
    if (reduxOn()) {
      const id = Object.entries(this.run.expansion?.rival ?? {}).find(([, r]) => r.role === 'main')?.[0];
      const story = this.run.story.rivals.find((x) => x.id === id);
      this.rival = { name: story?.name ?? rivalReport(this.run).find((r) => r.id === id)?.name ?? 'Rival', art: rivalArt(this, story) };
      this.rx = mountRedux(this, {
        render: (c) => rescueView(c, this.model()),
        acts: {
          page: () => this.key('confirm'),
          pick: (k) => {
            if (!this.card || this.pageAt < this.pages.length - 1) return;
            this.hover(Number(k));
            this.key('confirm');
          },
        },
        overs: { over: (k) => this.hover(Number(k)) },
      });
    }
    onInputAction(this, (a) => (this.rx ? this.key(a) : this.menu?.handle(a)));
    if (this.data0.resume) return this.afterFight();
    this.showOffer();
  }

  private get run() {
    return services().session.run!;
  }

  // ---- New UI ----

  /** The receipt of the hold: who took what, where it is kept. Read once per step while the hold still exists. */
  private readSlip(holdId: string): void {
    const h = rescueOf(this.run).holds.find((x) => x.id === holdId);
    if (!h) return;
    const site = siteOf(h.teamId), content = services().session.content;
    const text = h.receipt ? (RESCUE.receipts[h.teamId] ?? '') : '';
    this.slip = {
      head: `${site.name.toUpperCase()} · ${h.receipt ? 'IMPOUND RECEIPT' : 'TAKEN, NO RECEIPT'}`,
      held: h.pokemon.map((p): [string, string] => [`1 × ${content.species.get(String(p.speciesId))?.name ?? 'Pokémon'}`, `Lv ${Number(p.level) || 1}`]),
      notes: [`Holding site: ${site.site}`, `Jailer: ${site.jailer}`],
      slip: text,
      stamp: holdState(h, this.data0.node).replace(/-/g, ' ').toUpperCase(),
    };
  }

  private setCard(card: RescueCard): void {
    this.card = card;
    // One speaker to a page, so the name plate always says whose words are in the box.
    const runs: ScriptLine[][] = [];
    for (const l of card.lines.filter((x) => x.text)) {
      const last = runs[runs.length - 1];
      if (last && last[0]!.who === l.who) last.push(l); else runs.push([l]);
    }
    this.pages = runs.flatMap((r) => pageLines(r, RX_PAGE));
    this.pageAt = 0;
    this.pick = Math.max(0, card.options.findIndex((o) => !o.locked));
    this.moved = false;
    this.rx?.refresh();
  }

  private model(): RescueModel {
    const card = this.card, page = this.pages[this.pageAt] ?? [], more = this.pageAt < this.pages.length - 1;
    const say = !more && this.moved ? card?.options[this.pick]?.say : undefined;
    const who = say ? say.who : (page[0]?.who ?? null);
    return {
      header: 'Rescue Plan',
      ...this.slip,
      stamp: card?.stamp?.text ?? this.slip.stamp,
      stampGood: card?.stamp?.good ?? false,
      clock: card?.clock ?? { title: 'Holding clock', steps: [], at: 0, done: false, note: '' },
      options: more || !card ? [] : card.options,
      index: this.pick,
      rival: this.rival.art,
      who,
      text: say ? say.text : page.map((l) => l.text).join(' '),
      more,
    };
  }

  private hover(k: number): void {
    if (!this.card || this.pageAt < this.pages.length - 1 || !(k >= 0 && k < this.card.options.length)) return;
    if (k === this.pick && this.moved) return;
    this.pick = k;
    this.moved = true;
    this.rx?.refresh();
  }

  private key(a: InputAction): void {
    const card = this.card;
    if (!card) return;
    if (this.pageAt < this.pages.length - 1) {
      if (a === 'confirm') { this.pageAt += 1; this.rx?.refresh(); }
      return;
    }
    if (a === 'up' || a === 'left') return this.hover((this.pick + card.options.length - 1) % card.options.length);
    if (a === 'down' || a === 'right') return this.hover((this.pick + 1) % card.options.length);
    if (a === 'back') return card.onBack?.();
    if (a === 'confirm' && card.options[this.pick] && !card.options[this.pick]!.locked) card.onSelect(this.pick);
  }

  /** The rival speaking. */
  private says(text: string): ScriptLine {
    return { who: this.rival.name, text };
  }

  /** The steps of the plan under way, the one in hand lit. */
  private planClock(steps: readonly string[], at: number, note: string): RescueModel['clock'] {
    return { title: 'The plan', steps: steps.map(cap), at, done: true, note };
  }

  // ---- shared ----

  private clear(): void {
    this.menu?.destroy();
    this.menu = null;
    for (const o of this.layer) o.destroy();
    this.layer = [];
  }

  private panel(title: string, body: string, side?: string, h = 250): void {
    this.layer.push(drawGlass(this, 24, 20, GAME_WIDTH - 48, h));
    this.layer.push(this.add.text(44, 30, title, textStyle(22, GOLD)));
    const t = this.add.text(44, 66, body, textStyle(17, SKY, { wordWrap: { width: GAME_WIDTH - 100 } }));
    fitBlock(t, GAME_WIDTH - 100, h - 60);
    this.layer.push(t);
    if (side) this.layer.push(this.add.text(GAME_WIDTH - 44, 30, side, textStyle(14, GOLD)).setOrigin(1, 0));
  }

  private finish(out: RescueOutcome | null): void {
    services().session.saveRunNow();
    this.clear();
    // Start the map again so the party and bench show what came back.
    this.scene.stop(this.data0.from);
    this.scene.start(this.data0.from);
    this.data0.onDone?.(out);
  }

  // ---- offer ----

  private showOffer(): void {
    this.clear();
    const { ctx, node, names } = this.data0;
    const v: OfferView = offerView(this.run, this.data0.offer!, ctx, node, names);
    this.site = v.site;
    const decline = (): void => { declineOffer(this.run, v.holdId, node, ctx.archetype); this.finish(null); };
    if (this.rx) {
      this.readSlip(v.holdId);
      const T = RESCUE.tuning, states = ['logged', 'processed', 'assigned', 'held-too-long'];
      const nextAt = v.clock.state === 'logged' ? ` Processed at ${T.processedAt}.` : v.clock.state === 'processed' ? ` Assigned at ${T.assignedAt}.` : '';
      return this.setCard({
        lines: v.lines.map((t) => this.says(t)),
        options: [
          // The Deal has no roll: paying always brings them home, so its word is Safe.
          ...v.plans.map((p) => ({ label: `${p.label}${p.preferred ? ' ★' : ''}`, tag: p.readiness ?? (p.available && p.plan === 'deal' ? 'Safe' : ''), locked: !p.available, say: p.available ? this.says(p.pitch) : { who: null, text: p.reason ?? 'This plan is closed.' } })),
          { label: 'Wait for a better day', tag: '—', locked: false, say: { who: null, text: 'Not now. The offer will come back.' } },
        ],
        clock: { title: 'Holding clock', steps: ['Logged', 'Processed', 'Assigned', 'Held too long'], at: states.indexOf(v.clock.state), done: false, note: `${v.clock.nodesHeld} ${v.clock.nodesHeld === 1 ? 'node' : 'nodes'} in.${nextAt}` },
        onSelect: (i) => (i === v.plans.length ? decline() : this.startPlan(v.plans[i]!.plan, v.holdId)),
        onBack: decline,
      });
    }
    const body = `${v.lines.join('\n\n')}\n\n${v.receipt ? `Receipt: ${v.receipt}\n` : ''}Held at ${v.site}. ${v.count} Pokémon. Jailer: ${v.jailer}.`;
    this.panel('The rival has a plan', body, `Clock: ${v.clock.label} (${v.clock.nodesHeld} nodes)`, 190);
    const options = [
      ...v.plans.map((p) => ({ label: `${p.label}${p.preferred ? ' *' : ''}${p.readiness ? `  [${p.readiness}]` : ''}`, detail: p.available ? p.pitch : (p.reason ?? ''), disabled: !p.available })),
      { label: 'Not now', detail: 'The offer will come back.' },
    ];
    this.menu = new Menu(this, {
      x: 44, y: 220, options, itemWidth: GAME_WIDTH - 100, itemHeight: 50, fontSize: 16,
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
      if (this.rx && this.card) {
        // New UI: the reason takes the text box; the plans stay up.
        this.card.options[this.pick]!.say = { who: null, text: String((e as Error).message) };
        this.moved = true;
        this.rx.refresh();
        return;
      }
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
    const answer = (i: number): void => {
      const c = bv.choices[i]!;
      if (bv.kind !== 'beat') { answerComplication(this.run, c.rating === 'good' ? 'good' : 'poor'); this.showBeat(); return; }
      answerBeat(this.run, c.rating);
      // The one checkpoint of PS-RESCUE is at the Door: a reload here resumes the plan.
      if (bv.title === 'door') services().session.saveRunNow();
      const spot = fightAfterAnswer(this.run);
      if (spot) this.showFight(spot); else this.showBeat();
    };
    const leave = (): void => { abandonPlan(this.run, this.data0.node); this.finish(null); };
    if (this.rx) {
      const pr = rescueOf(this.run).active;
      if (pr) this.readSlip(pr.holdId);
      const steps = pr && pr.plan !== 'deal' && pr.plan !== 'exchange' ? BEATS[pr.plan] : ['approach', 'door', 'cage'];
      return this.setCard({
        // The plan window shows which step this is; the box keeps to what is seen and what the rival says.
        lines: [{ who: null, text: bv.kind === 'beat' ? (bv.scene ?? (bv.hint ? '' : `${cap(bv.title)}.`)) : `Complication: ${bv.title}. ${bv.scene ?? ''}` }, ...(bv.hint ? [this.says(bv.hint)] : [])],
        options: bv.choices.map((c) => ({ label: c.text, tag: '', locked: false })),
        clock: this.planClock(steps, bv.kind === 'beat' ? bv.index : steps.length, bv.kind === 'beat' ? 'Your answers decide how ready the plan is.' : 'Something has gone wrong.'),
        onSelect: answer,
        onBack: leave,
      });
    }
    this.panel(title, [bv.scene, bv.hint ? `"${bv.hint}"` : null].filter(Boolean).join('\n\n'));
    this.menu = new Menu(this, {
      x: 44, y: 285, options: bv.choices.map((c) => ({ label: c.text })), itemWidth: GAME_WIDTH - 100, itemHeight: 40, fontSize: 18,
      onSelect: answer,
      onBack: leave,
    });
  }

  // ---- the annex: a guard fight at a beat ----

  /** The annex as three stops (Approach, Door, Cage) with the guards you have beaten so far. */
  private drawAnnex(current: number): void {
    const pr = rescueOf(this.run).active;
    const stops = ['Approach', 'Door', 'Cage'];
    const y = 252;
    stops.forEach((label, i) => {
      const x = 80 + i * 150;
      if (i > 0) this.layer.push(this.add.rectangle(x - 75, y, 100, 3, 0x4a7aa0).setOrigin(0.5));
      this.layer.push(this.add.circle(x, y, 9, i < current ? 0x7fe08a : i === current ? 0xffe08a : 0x2a4a68).setStrokeStyle(2, 0xcfefff));
      this.layer.push(this.add.text(x, y + 14, label, textStyle(12, SKY)).setOrigin(0.5, 0));
    });
    const beaten = pr?.fights.filter((f) => f === 'won').length ?? 0;
    this.layer.push(this.add.text(GAME_WIDTH - 44, y, `Guards beaten: ${beaten}`, textStyle(13, GOLD)).setOrigin(1, 0.5));
  }

  private showFight(spot: FightSpot): void {
    this.clear();
    const pr = rescueOf(this.run).active!;
    const site = siteOf(holdOf(rescueOf(this.run), pr.holdId).teamId);
    const title = { approach: 'The Approach', door: 'The Door', cage: 'The Cage' }[spot];
    const place = { approach: site.approach, door: site.door, cage: site.cage }[spot];
    const rival = pr.plan === 'loud' ? '\n\nYour rival steps in beside you.' : '';
    const fight = (): void => {
      startRescueFight(services().session.content, this.run);
      services().session.saveRunNow();
      this.clear();
      this.scene.stop(this.data0.from);
      this.scene.start('Battle');
    };
    const leave = (): void => { abandonPlan(this.run, this.data0.node); this.finish(null); };
    if (this.rx) {
      this.readSlip(pr.holdId);
      const beaten = pr.fights.filter((f) => f === 'won').length;
      return this.setCard({
        lines: [{ who: null, text: `${title}: a guard. ${site.site}.` }, { who: null, text: `${place}. A guard of ${site.name} blocks the way.${pr.plan === 'loud' ? ' Your rival steps in beside you.' : ''}` }],
        options: [{ label: 'Fight', tag: '', locked: false }],
        clock: this.planClock(['approach', 'door', 'cage'], ['approach', 'door', 'cage'].indexOf(spot), `Guards beaten: ${beaten}`),
        onSelect: fight,
        onBack: leave,
      });
    }
    this.panel(`${title}: a guard`, `${site.site}.\n\n${place}.\n\nA guard of ${site.name} blocks the way.${rival}`, undefined, 270);
    this.drawAnnex(['approach', 'door', 'cage'].indexOf(spot));
    this.menu = new Menu(this, {
      x: 44, y: 285, options: [{ label: 'Fight' }], itemWidth: 300, itemHeight: 40, fontSize: 18,
      onSelect: fight,
      onBack: leave,
    });
  }

  /** Back from a guard fight (or a reload): a lost fight ends the plan as a Fail, a waiting guard is faced, otherwise the next beat. */
  private afterFight(): void {
    const pr = rescueOf(this.run).active;
    if (!pr) return this.finish(null);
    this.site = siteOf(holdOf(rescueOf(this.run), pr.holdId).teamId).site;
    if (pr.wiped) return this.finishNow();
    const waiting = pendingFight(this.run);
    if (waiting) return this.showFight(waiting);
    if (pr.plan === 'exchange') return this.showExchange();
    this.showBeat();
  }

  // ---- the Exchange ----

  private showExchange(): void {
    this.clear();
    const ev = exchangeView(this.run, this.exchangeStep);
    const say = (i: number): void => {
      const r = exchangeLine(this.run, ev.choices[i]!.wrong);
      if (r.fallback) return this.showBeat();
      if (r.done) return this.finishNow();
      this.exchangeStep = Math.min(2, this.exchangeStep + 1) as 0 | 1 | 2;
      this.showExchange();
    };
    if (this.rx) {
      const pr = rescueOf(this.run).active;
      if (pr) this.readSlip(pr.holdId);
      return this.setCard({
        lines: [{ who: null, text: `The Exchange: ${ev.title}. A trade on neutral ground. The rival watches the exits.` }],
        options: ev.choices.map((c) => ({ label: c.text, tag: '', locked: false })),
        clock: this.planClock(['opening', 'middle', 'close'], this.exchangeStep, 'A wrong word and the trade is off.'),
        onSelect: say,
      });
    }
    this.panel(`The Exchange: ${ev.title}`, 'A trade on neutral ground. The rival watches the exits.');
    this.menu = new Menu(this, {
      x: 44, y: 285, options: ev.choices.map((c) => ({ label: c.text })), itemWidth: GAME_WIDTH - 100, itemHeight: 40, fontSize: 18,
      onSelect: say,
    });
  }

  // ---- result and reunion ----

  private finishNow(): void {
    const { ctx, node, names } = this.data0;
    const before = rescueOf(this.run).active;
    if (this.rx && before) this.readSlip(before.holdId);
    const out = finishPlan(this.run, ctx, node, { wiped: rescueOf(this.run).active?.wiped });
    this.clear();
    const rv = resultView(out, ctx.archetype, { ...names, site: this.site });
    const extra = out.cellmate ? `\n\nA Pokémon from the next cage follows you out: ${out.cellmate.speciesId}${out.cellmate.shadow ? ' (Shadow)' : ''}.` : '';
    if (this.rx) {
      const last = this.card?.clock ?? this.planClock(['approach', 'door', 'cage'], 3, '');
      const home = out.result === 'full' || out.result === 'deal';
      return this.setCard({
        lines: [
          { who: null, text: rv.headline }, ...rv.lines.map((t) => this.says(t)),
          { who: null, text: `Back with you: ${rv.returned}. Still held: ${rv.stillHeld}.${out.moneySpent ? ` Paid: ${out.moneySpent}.` : ''}` },
          ...(out.cellmate ? [{ who: null, text: extra.trim() }] : []),
        ],
        options: [{ label: 'Continue', tag: '', locked: false }],
        clock: { ...last, at: home ? last.steps.length : last.at, done: true, note: `Back with you: ${rv.returned}. Still held: ${rv.stillHeld}.` },
        stamp: { text: home ? 'HOME' : out.result === 'partial' ? 'SOME HOME' : 'STILL HELD', good: home },
        onSelect: () => this.finish(out),
      });
    }
    this.panel(rv.headline, `${rv.lines.join('\n\n')}\n\nBack with you: ${rv.returned}. Still held: ${rv.stillHeld}.${out.moneySpent ? `\nPaid: ${out.moneySpent}.` : ''}${extra}`);
    this.menu = new Menu(this, { x: 44, y: 285, options: [{ label: 'Continue' }], itemWidth: 300, onSelect: () => this.finish(out) });
  }
}
