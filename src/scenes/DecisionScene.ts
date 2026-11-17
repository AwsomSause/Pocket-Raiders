// Choices the run waits on between battles, one at a time:
//   - a Pokémon wants to learn a move but already knows four
//   - a Pokémon was caught: add it, replace a party member, or release it
// Replacing, releasing and forgetting can't be undone, so each asks to confirm.

import { getMutator } from '../core/mutators';
import { fixedDamageLabel } from '../ui/battleText';
import Phaser from 'phaser';
import { fitBlock } from '../ui/fitText';
import { EGG_TIERS, eggTier } from '../core/eggs';
import { catchSummary } from '../core/catchSummary';
import { masteryPreview } from '../core/mastery';
import { candiesForRelease } from '../core/encounters';
import { partyCapacity, releaseLimitReached } from '../core/run';
import { runPerks } from '../core/archetypes';
import { boxCapacity } from '../core/trainerPerks';
import { joinProblem } from '../core/rules';
import type { Content } from '../core/contentSchema';
import { calcStats, getSpecies, MAX_PP_UPS, maxPp } from '../core/pokemon';
import type { DecisionChoice } from '../core/run';
import { pathName, type MentorPath } from '../core/story/mentorship';
import { mentorAccepts } from '../core/story/returnProtege';
import { playMentorMoment } from '../ui/cinematic/mentorMoments';
import { TYPE_NAMES, TYPE_BLURB } from '../core/story/mentorBond';
import type { MentorType } from '../core/story/schema';
import { askLeadText } from '../core/story/askLead';

const PATH_BLURB: Record<MentorPath, string> = {
  guardian: 'protecting allies and standing firm under pressure',
  striker: 'timing attacks and finishing blows',
  strategist: 'exploiting weaknesses and countering setups',
  survivor: 'enduring the hardest battles',
  challenger: 'facing stronger opponents head on',
  bonded: 'fighting beside a specific teammate',
};
import type { MoveSlot, PendingDecision, PokemonInstance } from '../core/state';
import { services } from '../game/services';
import { playMusic, playSfx, playMusicLazy } from '../ui/audio';
import { raidCaptureTrack } from '../core/presentation/battleMusic';
import { onInputAction, type InputAction } from '../ui/input';
import { partyRows, Picker } from '../ui/partyPanel';
import { fitHeight } from '../ui/showcase';
import { pokemonVisual, trainerVisual } from '../ui/sprites';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TYPE_COLORS, textStyle } from '../ui/theme';
import { Menu } from '../ui/widgets';
import { glassPanel as drawPanel } from '../ui/aero';
import { sceneForRun } from './routing';
import { partySpecies, preloadPokemon, queueAssets } from '../ui/lazyAssets';
import { moveFullDescription } from '../core/battle/moveText';
import { artOf, monFile, partyChips } from '../ui/redux/game';
import { mountConfirm } from '../ui/redux/confirm';
import { mountRedux, reduxOn, type ReduxView } from '../ui/redux/stage';
import { decisionView, type DecisionModel, type DecisionOption } from '../ui/redux/screens/decision';
import { counterView } from '../ui/redux/screens/ops';

/** The EBDX art the Egg hatch uses (loaded only when an Egg is hatching). */
const HATCH_ASSETS = ['pack.ebdx.egg', 'pack.ebdx.eggCracks', 'pack.ebdx.hatch.hatchbg', 'pack.ebdx.hatch.line', 'pack.ebdx.hatch.overlay', 'pack.ebdx.hatch.shine6', 'pack.ebdx.hatch.shine7', 'se.egg_get'];

function describeMove(content: Content, id: string): string {
  const m = content.moves.get(id)!;
  const power = m.power ?? fixedDamageLabel(m.effects.fixedDamage);
  return `${m.type.toUpperCase()} · ${m.category} · Pow ${power} · Acc ${m.accuracy ?? '—'} · PP ${m.pp}`;
}

/** What a builder tells the New UI to draw; the cursor, the detail sheet and the result line are the scene's. */
type RxSpec = Omit<DecisionModel, 'index' | 'more' | 'result' | 'hints'> & { more?: string[]; hints?: DecisionModel['hints'] };
const capWord = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
/** A move as a New UI button: "Special · 90 · PP 12/15" with the type's stripe. */
function rxMove(content: Content, id: string, pp?: number, slot?: MoveSlot): DecisionOption {
  const m = content.moves.get(id)!;
  const power = m.power ?? fixedDamageLabel(m.effects.fixedDamage);
  return { label: m.name, small: `${capWord(m.category)} · ${power || '—'} · PP ${pp ?? m.pp}/${slot ? maxPp(content, slot) : m.pp}`, type: m.type, off: false };
}
/** What a move does, in one line: the "In this game: ..." part of its full description when it has one. */
const moveBrief = (text: string): string => { const cut = /In this game: (.*)$/s.exec(text); return cut ? capWord(cut[1]!) : text; };
const plain = (label: string, small = '', off = false): DecisionOption => ({ label, small, type: null, off });

export class DecisionScene extends Phaser.Scene {
  private menu: Menu | null = null;
  private picker: Picker | null = null;
  private confirmMenu: Menu | null = null;
  private confirmLayer: Phaser.GameObjects.Container | null = null;
  private done = false;
  /** New UI: the mock-up decision screen over the canvas, the Yes/No box above it, and what they show. */
  private rx: ReduxView | null = null;
  private rxConfirm: ReduxView | null = null;
  private rxSpec: (() => RxSpec) | null = null;
  private rxMore = false;
  private rxResult: string | null = null;
  /** The Egg hatch is playing; input waits until the Pokémon is shown. */
  private hatching = false;

  constructor() {
    super('Decision');
  }

  private raidTier(): number | null {
    const d = services().session.run?.pending[0];
    return d?.kind === 'caught' && d.raidTier ? d.raidTier : null;
  }

  preload(): void {
    const { session } = services();
    const caught = (session.run?.pending ?? []).flatMap((d) => (d.kind === 'caught' || d.kind === 'reunion' ? (session.content.species.get(d.mon.speciesId) ?? []) : []));
    preloadPokemon(this, [...partySpecies(), ...caught], { front: true, shiny: true, icon: true });
    if (session.run?.pending.some((d) => d.kind === 'caught' && d.mon.hatched)) queueAssets(this, HATCH_ASSETS);
    const tier = this.raidTier();
    if (tier) queueAssets(this, [raidCaptureTrack(tier)]);
  }

  create(): void {
    const { session } = services();
    const run = session.run!;
    const decision = run.pending[0]!;
    this.menu = null;
    this.picker = null;
    this.confirmMenu = null;
    this.confirmLayer = null;
    this.done = false;
    this.dismiss = null;
    this.rx = null;
    this.rxConfirm = null;
    this.rxSpec = null;
    this.rxMore = false;
    this.rxResult = null;
    this.doorKey = null;
    // A beaten raid boss asking to join plays that tier's capture jingle (Raid Battles pack).
    const tier = this.raidTier();
    if (tier) playMusic(this, raidCaptureTrack(tier));
    else playMusicLazy(this, 'bgm.event');

    onInputAction(this, (a) => this.handleInput(a));
    if (decision.kind === 'learnMove') this.buildLearnMove(decision.uid, decision.moveId);
    else if (decision.kind === 'caught' && decision.mon.hatched) this.playHatch(decision.mon);
    else if (decision.kind === 'caught') this.buildCaught(decision.mon);
    else if (decision.kind === 'reunion') this.buildCaught(decision.mon, decision.hallOfFame);
    else if (decision.kind === 'teachMove') this.buildTeachMove(decision.uid, decision.itemName, decision.moveIds);
    else if (decision.kind === 'signature') this.buildSignature(decision.title, decision.options);
    else if (decision.kind === 'mutator') this.buildMutator(decision.choices);
    else if (decision.kind === 'circuit') this.buildCircuit(decision.title, decision.options);
    else if (decision.kind === 'leagueDoor') reduxOn() ? this.buildLeagueDoor(decision) : this.buildSignature(decision.title, decision.options, 'circuit');
    else if (decision.kind === 'mythicalVisit') this.buildSignature(decision.title, decision.options, 'circuit');
    else if (decision.kind === 'mentorship') this.buildMentorship(decision.mentorUid, decision.proteUid, decision.path, decision.types);
    else if (decision.kind === 'askLead') this.buildAskLead(decision.uid, decision.reason);
    else if (decision.kind === 'returnProtege') this.buildReturn(decision.mon, decision.mentorUid, decision.reason);
    else this.buildPpUp(decision.uid, decision.itemName, decision.ups);
  }

  private dismiss: (() => void) | null = null;
  /** New UI: the League door page takes the keys itself (it has a list and two buttons, not one menu). */
  private doorKey: ((a: InputAction) => void) | null = null;
  private compareStep?: (d: number) => void;

  /** New UI: draws this decision with the mock-up screen (the first call mounts it; later calls swap what it shows). */
  private rxShow(spec: () => RxSpec): void {
    if (!reduxOn()) return;
    this.rxSpec = spec;
    if (this.menu) this.menu.onFocus = () => this.rx?.refresh();
    if (this.rx) return this.rx.refresh();
    const busy = (): boolean => this.done || this.confirmMenu !== null || this.picker !== null || this.rxMore;
    this.rx = mountRedux(this, {
      render: (c) => {
        const d = this.rxSpec!();
        return decisionView(c, { ...d, index: this.menu?.index ?? 0, more: this.rxMore ? (d.more ?? null) : null, result: this.rxResult, hints: d.hints ?? [['Enter', 'choose'], ...(d.more ? ([['I', 'details']] as const) : [])] });
      },
      acts: {
        pick: (i) => {
          if (busy() || this.rxSpec?.().options[Number(i)]?.off) return;
          this.menu?.focus(Number(i), false);
          this.menu?.confirm();
        },
        more: () => this.rxToggleMore(),
        done: () => this.dismiss?.(),
      },
      overs: { over: (i) => { if (!busy() && !this.rxSpec?.().options[Number(i)]?.off) this.menu?.focus(Number(i), false); } },
    });
    this.input.keyboard?.on('keydown-I', () => this.rxToggleMore());
  }

  private rxToggleMore(): void {
    if (!this.rx || this.done || this.confirmMenu || this.picker || !this.rxSpec?.().more) return;
    this.rxMore = !this.rxMore;
    this.rx.refresh();
  }

  private handleInput(action: InputAction): void {
    if (this.rxMore) {
      if (action === 'confirm' || action === 'back') this.rxToggleMore();
      return;
    }
    if (this.done) {
      if (this.dismiss && (action === 'confirm' || action === 'back')) this.dismiss();
      return;
    }
    if (this.hatching) return;
    if (this.doorKey) return this.doorKey(action);
    if (!this.confirmMenu && !this.picker && (action === 'left' || action === 'right')) this.compareStep?.(action === 'left' ? -1 : 1);
    if (this.confirmMenu) this.confirmMenu.handle(action);
    else if (this.picker) this.picker.handle(action);
    else this.menu?.handle(action);
  }

  private resolve(choice: DecisionChoice): void {
    if (this.done) return;
    this.done = true;
    const result = services().session.resolveDecision(choice);
    this.closeConfirm();
    this.picker?.close();
    this.picker = null;
    // New UI: the result line sits in the mock-up text box until the next input (a decision with nothing to draw still gets it).
    if (reduxOn()) {
      this.rxMore = false;
      this.rxResult = result.message;
      if (this.rx) this.rx.refresh();
      else this.rxShow(() => ({ title: 'Decision', card: null, options: [], details: [], text: '', party: null }));
    }
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setOrigin(0).setDepth(150);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, result.message, textStyle(30, COLORS.textLight, { align: 'center', wordWrap: { width: GAME_WIDTH - 120 } }))
      .setOrigin(0.5)
      .setDepth(151);
    // The result stays until the player gives an input (a short beat first so the choosing key does not dismiss it).
    const hint = this.add.text(GAME_WIDTH - 40, GAME_HEIGHT - 24, 'Enter: continue', textStyle(15, COLORS.textMuted)).setOrigin(1, 1).setDepth(151);
    let leaving = false;
    const go = (): void => {
      if (leaving) return;
      leaving = true;
      this.scene.start(sceneForRun(result.run));
    };
    this.time.delayedCall(300, () => {
      this.dismiss = go;
      this.input.once('pointerdown', go);
      this.tweens.add({ targets: hint, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    });
  }

  /** A Yes/No box over the screen. */
  private confirm(text: string, onYes: (i?: number) => void, labels: readonly string[] = ['Yes', 'No']): void {
    const layer = this.add.container(0, 0).setDepth(120);
    layer.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    layer.add(drawPanel(this, 160, 170, GAME_WIDTH - 320, 200));
    layer.add(this.add.text(GAME_WIDTH / 2, 190, text, textStyle(26, COLORS.text, { align: 'center', wordWrap: { width: GAME_WIDTH - 380 } })).setOrigin(0.5, 0));
    this.confirmLayer = layer;
    this.confirmMenu = new Menu(this, {
      x: GAME_WIDTH / 2 - 140,
      y: 310,
      options: labels.map((label) => ({ label })),
      columns: labels.length === 2 ? 2 : 1,
      itemWidth: labels.length === 2 ? 160 : 520,
      fontSize: 30,
      onSelect: (i) => (labels.length > 2 || i === 0 ? onYes(i) : this.closeConfirm()),
      onBack: () => this.closeConfirm(),
    });
    this.confirmMenu.container.setDepth(121);
    // Default to "No" for choices that can't be undone.
    this.confirmMenu.focus(labels.length === 2 ? 1 : 0, false);
    if (reduxOn()) this.rxConfirm = mountConfirm(this, text, this.confirmMenu, labels);
  }

  private closeConfirm(): void {
    this.confirmMenu?.destroy();
    this.confirmMenu = null;
    this.confirmLayer?.destroy();
    this.confirmLayer = null;
    this.rxConfirm?.destroy();
    this.rxConfirm = null;
  }

  // ---------- learning a move ----------

  private buildLearnMove(uid: string, moveId: string): void {
    const { session } = services();
    const content = session.content;
    const mon = session.run!.party.find((p) => p.uid === uid);
    const newMove = content.moves.get(moveId)!;
    if (!mon) {
      this.resolve({ kind: 'skipMove' });
      return;
    }
    const name = getSpecies(content, mon.speciesId).name;
    pokemonVisual(this, getSpecies(content, mon.speciesId), 'front', 150, 260, 3, mon.shiny);
    this.add.text(300, 40, `${name} wants to learn ${newMove.name}!`, textStyle(34, COLORS.textLight));
    // A free move slot (a move found in battle by a Pokémon with fewer than four): learning it forgets nothing.
    const room = mon.moves.length < 4 ? 1 : 0;
    this.add.text(300, 86, room ? 'It has room for another move. Learn it?' : 'But it already knows four moves. Forget one to make room?', textStyle(22, '#d8d0e0'));
    const describe = (id: string, pp?: number, slot?: MoveSlot) => {
      const m = content.moves.get(id)!;
      const power = m.power ?? fixedDamageLabel(m.effects.fixedDamage);
      return `${m.type.toUpperCase()} · ${m.category} · Pow ${power} · Acc ${m.accuracy ?? '—'} · PP ${pp ?? m.pp}/${slot ? maxPp(content, slot) : m.pp}`;
    };
    drawPanel(this, 300, 124, 620, 70, { fill: COLORS.panelDark, border: TYPE_COLORS[newMove.type] ?? 0x808080 });
    this.add.text(320, 132, `NEW: ${newMove.name}`, textStyle(24, COLORS.textLight));
    this.add.text(320, 162, describe(moveId), textStyle(18, '#d8d0e0'));

    const options = [
      ...(room ? [{ label: `Learn ${newMove.name}`, detail: 'Fills a free move slot. No move is forgotten.' }] : []),
      ...mon.moves.map((slot) => ({ label: content.moves.get(slot.id)!.name, detail: describe(slot.id, slot.pp, slot) })),
      { label: `Don't learn ${newMove.name}` },
    ];
    drawPanel(this, 300, 210, 620, 310);
    // Beta 4.4: the full description of the focused move (the new one on "Don't learn").
    const full = (i: number) => {
      const slot = mon.moves[i - room];
      const m = content.moves.get(slot ? slot.id : moveId)!;
      return `${slot ? m.name : `NEW: ${m.name}`}: ${moveFullDescription(m)}`;
    };
    const about = this.add.text(24, 360, full(0), textStyle(18, '#d8d0e0', { wordWrap: { width: 260 }, lineSpacing: 2 }));
    this.menu = new Menu(this, {
      x: 316,
      y: 222,
      options,
      itemHeight: 58,
      itemWidth: 600,
      fontSize: 24,
      onFocus: (i) => about.setText(full(i)),
      onSelect: (pick) => {
        if (room && pick === 0) {
          this.resolve({ kind: 'forgetMove', moveIndex: mon.moves.length });
          return;
        }
        const i = pick - room;
        if (i >= mon.moves.length) {
          this.confirm(`Give up on learning ${newMove.name}?`, () => this.resolve({ kind: 'skipMove' }));
          return;
        }
        const old = content.moves.get(mon.moves[i]!.id)!;
        this.confirm(`${name} will forget ${old.name} and learn ${newMove.name}. OK?`, () => this.resolve({ kind: 'forgetMove', moveIndex: i }));
      },
    });
    const file = monFile(this, mon.speciesId, 'icon', mon.shiny) ?? monFile(this, mon.speciesId, 'front', mon.shiny);
    const newPower = newMove.power ?? fixedDamageLabel(newMove.effects.fixedDamage);
    this.rxShow(() => {
      const i = (this.menu?.index ?? 0) - room;
      const slot = mon.moves[i];
      const old = slot ? content.moves.get(slot.id)! : null;
      return {
        title: 'New move',
        card: { big: false, file, name, level: '', tag: '', sub: 'wants to learn', accent: newMove.name, types: [newMove.type], lines: [`${capWord(newMove.category)}${newMove.power ? ` · Power ${newPower}` : ''} · PP ${newMove.pp}. ${moveBrief(moveFullDescription(newMove))}`] },
        options: [...(room ? [plain(`Learn ${newMove.name}`, 'Free move slot')] : []), ...mon.moves.map((m) => rxMove(content, m.id, m.pp, m)), plain(`Do not learn ${newMove.name}`)],
        details: [],
        party: null,
        text: old
          ? `${room ? 'It has room for another move, or p' : 'P'}ick a move to forget${room ? '' : `, or keep the ${mon.moves.length} it knows`}. ${old.name} would be replaced. ${moveBrief(moveFullDescription(old))}`
          : room && i < 0
            ? 'It has room for another move. Learning it forgets nothing.'
            : `Keep the moves it knows and give up on ${newMove.name}.`,
      };
    });
  }

  // ---------- a trainer's signature mechanic (core/signature.ts) ----------

  private buildSignature(title: string, options: { label: string; description: string; sprite?: string }[], kind: 'signature' | 'mutator' | 'circuit' = 'signature', notes: string[] = []): void {
    this.add.text(GAME_WIDTH / 2, 60, title, textStyle(34, COLORS.textLight, { align: 'center', wordWrap: { width: 800 } })).setOrigin(0.5, 0);
    // The Circuit's Fork Gate and Rematch Day have long leader lines: a wider panel.
    const wide = kind === 'circuit';
    drawPanel(this, wide ? 60 : 220, 170, wide ? 840 : 520, 70 * options.length + 30);
    this.menu = new Menu(this, {
      x: wide ? 176 : 236,
      y: 184,
      options: options.map((o) => ({ label: o.label, detail: o.description })),
      itemHeight: 70,
      itemWidth: wide ? 708 : 488,
      fontSize: wide ? 24 : 26,
      // Beta 4.4: the modifier pick answers as a 'mutator' choice (it used to send 'signature', which the run refused).
      onSelect: (i) => this.resolve({ kind, optionIndex: i }),
    });
    const arts = options.map((o) => (o.sprite ? artOf(this, o.sprite) : null));
    this.rxShow(() => ({
      title: kind === 'mutator' ? 'Modifier' : kind === 'circuit' ? 'The road ahead' : 'Signature',
      area: 'run',
      card: null,
      options: options.map((o, i) => ({ label: o.label, small: o.description, type: null, off: false, art: arts[i] })),
      details: notes,
      party: null,
      text: title,
    }));
  }

  /** New UI: the League door as the mock-up counter-pick page: the registered party, the boxed Pokémon and two buttons. */
  private buildLeagueDoor(d: Extract<PendingDecision, { kind: 'leagueDoor' }>): void {
    const { session } = services();
    const run = session.run!, content = session.content;
    const nameOf = (speciesId: string): string => content.species.get(speciesId)?.name ?? speciesId;
    const registered = new Set(run.expansion?.league?.registered ?? []);
    const out = run.party.find((m) => m.uid === d.outUid);
    const outName = out ? nameOf(out.speciesId) : 'it';
    // The page is read once: after a swap the party has changed, and the result line is about the team that was registered.
    const party = run.party.map((m) => ({ name: nameOf(m.speciesId), file: monFile(this, m.speciesId, 'front', !!m.shiny), types: content.species.get(m.speciesId)?.types ?? [], state: m.uid === d.outUid ? ('answer' as const) : registered.has(m.uid) ? ('registered' as const) : ('out' as const) }));
    const bench = d.swapIns.map((uid) => run.box.find((m) => m.uid === uid)).map((m) => (m ? { name: nameOf(m.speciesId), file: monFile(this, m.speciesId, 'front', !!m.shiny), sub: `Lv ${m.level}` } : { name: '???', file: null, sub: '' }));
    const n = bench.length;
    // The cursor starts on the swap button with the first boxed Pokémon marked, as on the mock-up.
    let pick = 0, at = n, moved = false;
    const choose = (): void => {
      if (at < n) {
        pick = at;
        at = n;
        this.rx?.refresh();
      } else this.resolve({ kind: 'circuit', optionIndex: at === n ? pick + 1 : 0 });
    };
    const go = (k: number): void => {
      if (this.done || !(k >= 0 && k <= n + 1) || k === at) return;
      at = k;
      moved = true;
      this.rx?.refresh();
    };
    this.doorKey = (a) => {
      if (a === 'confirm') return choose();
      if (a === 'back') return go(n + 1);
      go(at + (a === 'up' || a === 'left' ? -1 : 1));
    };
    this.rx = mountRedux(this, {
      render: (c) => counterView(c, {
        party, bench, pick, at,
        swap: `Swap ${outName} out`,
        keep: d.options[0]?.label ?? 'Keep my team',
        who: 'Registrar',
        text: !moved ? `Your party is registered. The League has studied ${outName} most. You may swap that one before the doors close.` : (d.options[at === n + 1 ? 0 : (at < n ? at : pick) + 1]?.description ?? ''),
        result: this.rxResult,
      }),
      acts: {
        pick: (k) => {
          if (this.done) return;
          go(Number(k));
          choose();
        },
        done: () => this.dismiss?.(),
      },
      overs: { over: (k) => go(Number(k)) },
    });
  }

  /** The Circuit's Fork Gate and Rematch Day: the menu with each Leader's portrait beside their row. */
  private buildCircuit(title: string, options: { label: string; description: string; sprite?: string }[]): void {
    this.buildSignature(title, options, 'circuit');
    options.forEach((o, i) => {
      if (o.sprite) trainerVisual(this, o.sprite, o.label, 118, 184 + 70 * i + 38, 0.6).setDepth(5);
    });
  }

  /** Modifier Run: pick 1 of 3 blessings/curses. */
  private buildMutator(ids: string[]): void {
    const options = ids.flatMap((id) => getMutator(id) ?? []).map((m) => ({ label: `${m.kind === 'blessing' ? '✦' : '☠'} ${m.name}`, description: m.blurb }));
    const picked = (services().session.run?.mutators ?? []).flatMap((id) => getMutator(id)?.name ?? []);
    this.buildSignature('Pick a modifier for the rest of the run', options, 'mutator', picked.length > 0 ? [`Active: ${picked.join(', ')}`] : []);
    if (picked.length > 0) this.add.text(GAME_WIDTH / 2, 470, `Active: ${picked.join(', ')}`, textStyle(18, '#d8d0e0', { align: 'center', wordWrap: { width: 800 } })).setOrigin(0.5, 0);
  }

  // ---------- a TM or HM from the reward draft ----------

  private buildTeachMove(uid: string, itemName: string, moveIds: string[]): void {
    const { session } = services();
    const content = session.content;
    const mon = session.run!.party.find((p) => p.uid === uid);
    if (!mon) {
      this.resolve({ kind: 'skipMove' });
      return;
    }
    const species = getSpecies(content, mon.speciesId);
    pokemonVisual(this, species, 'front', 150, 260, 3, mon.shiny);
    this.add.text(300, 40, `The ${itemName}: which move should ${species.name} learn?`, textStyle(30, COLORS.textLight, { wordWrap: { width: 640 } }));
    this.add.text(300, 120, mon.moves.length < 4 ? '' : 'It knows four moves, so it will forget one.', textStyle(20, '#d8d0e0'));
    // An HM can offer many moves: two columns of names then (up to 15 moves).
    const wide = moveIds.length > 7;
    const shown = moveIds.slice(0, wide ? 15 : 7);
    drawPanel(this, 300, 150, 620, 380);
    const about = this.add.text(24, 360, shown[0] ? moveFullDescription(content.moves.get(shown[0])!) : '', textStyle(18, '#d8d0e0', { wordWrap: { width: 260 }, lineSpacing: 2 }));
    this.menu = new Menu(this, {
      x: 316,
      y: 160,
      options: [
        ...shown.map((id) => ({ label: content.moves.get(id)!.name, detail: wide ? undefined : describeMove(content, id) })),
        { label: "Don't teach a move" },
      ],
      columns: wide ? 2 : 1,
      itemHeight: 46,
      itemWidth: wide ? 300 : 600,
      fontSize: 22,
      // Beta 4.4: the focused move's full description under the list.
      onFocus: (i) => about.setText(shown[i] ? moveFullDescription(content.moves.get(shown[i]!)!) : ''),
      onSelect: (i) => {
        if (i >= shown.length) this.confirm(`Throw away the ${itemName}?`, () => this.resolve({ kind: 'skipMove' }));
        else this.resolve({ kind: 'teachMove', moveIndex: i });
      },
    });
    const file = monFile(this, mon.speciesId, 'icon', mon.shiny) ?? monFile(this, mon.speciesId, 'front', mon.shiny);
    this.rxShow(() => {
      const id = shown[this.menu?.index ?? 0];
      const m = id ? content.moves.get(id)! : null;
      return {
        title: itemName,
        card: { big: false, file, name: species.name, level: '', tag: '', sub: 'can learn a move from the', accent: itemName, types: m ? [m.type] : [], lines: [m ? `${m.name}: ${moveBrief(moveFullDescription(m))}` : `Keep the ${itemName} unused.`] },
        options: [...shown.map((x) => rxMove(content, x)), plain("Don't teach a move")],
        details: [],
        party: null,
        text: `Which move should ${species.name} learn?${mon.moves.length < 4 ? '' : ' It knows four moves, so it will forget one.'}`,
      };
    });
  }

  // ---------- a veteran offers to mentor a teammate ----------

  private buildAskLead(uid: string, reason: 'leftOut' | 'campfire'): void {
    const { session } = services();
    const content = session.content;
    const run = session.run!;
    const mon = run.party.find((p) => p.uid === uid);
    if (!mon) {
      this.resolve({ kind: 'askLead', accept: false });
      return;
    }
    const sp = getSpecies(content, mon.speciesId);
    pokemonVisual(this, sp, 'front', 150, 330, 3, mon.shiny);
    this.add.text(300, 60, askLeadText(content, run, { uid, reason }), textStyle(28, COLORS.textLight, { wordWrap: { width: 640 } }));
    this.add.text(300, 190, 'Letting it lead puts it first in the party and grows its friendship. It will fight at the front next battle.', textStyle(18, '#a69cb4', { wordWrap: { width: 640 } }));
    drawPanel(this, 300, 270, 620, 150);
    this.menu = new Menu(this, {
      x: 316,
      y: 284,
      options: [{ label: `Let ${sp.name} lead` }, { label: 'Not now' }],
      itemHeight: 56,
      itemWidth: 580,
      fontSize: 26,
      onSelect: (i) => this.resolve({ kind: 'askLead', accept: i === 0 }),
    });
    const file = monFile(this, mon.speciesId, 'front', mon.shiny);
    const party = partyChips(this);
    this.rxShow(() => ({
      title: 'A request',
      card: { big: true, file, name: sp.name, level: `Lv ${mon.level}`, tag: '', sub: '', accent: '', types: sp.types, lines: [] },
      options: [plain(`Let ${sp.name} lead`, 'Goes first next battle'), plain('Not now')],
      details: ['Letting it lead puts it first in the party and grows its friendship.', 'It will fight at the front next battle.'],
      party,
      text: askLeadText(content, run, { uid, reason }),
    }));
  }

  private buildMentorship(mentorUid: string, proteUid: string, path: MentorPath, types: readonly MentorType[] = []): void {
    const { session } = services();
    const content = session.content;
    const party = session.run!.party;
    const mentor = party.find((p) => p.uid === mentorUid);
    const prote = party.find((p) => p.uid === proteUid);
    if (!mentor || !prote) {
      this.resolve({ kind: 'mentor', accept: false });
      return;
    }
    const m = getSpecies(content, mentor.speciesId);
    const p = getSpecies(content, prote.speciesId);
    pokemonVisual(this, m, 'front', 150, 260, 3, mentor.shiny);
    pokemonVisual(this, p, 'front', 150, 460, 2, prote.shiny);
    this.add.text(300, 40, `${p.name} looks up to ${m.name}.`, textStyle(30, COLORS.textLight, { wordWrap: { width: 640 } }));
    this.add.text(300, 110, `${pathName(path)}: ${PATH_BLURB[path]}`, textStyle(22, '#d8d0e0', { wordWrap: { width: 640 } }));
    const why = types.length ? types.map((t) => `${TYPE_NAMES[t]}: ${TYPE_BLURB[t]}`).join('\n') : '';
    this.add.text(300, 150, `${why}${why ? '\n' : ''}Chemistry grows with every win together: it shifts the protégé's stats toward its mentor, unlocks mentor moves, and lets the mentor step in once per battle. When the protégé catches up, the pair can hold a graduation spar.`, textStyle(16, '#a69cb4', { wordWrap: { width: 640 } }));
    drawPanel(this, 300, 270, 620, 150);
    this.menu = new Menu(this, {
      x: 316,
      y: 284,
      options: [{ label: `Let ${m.name} mentor ${p.name}` }, { label: 'Not now' }],
      itemHeight: 56,
      itemWidth: 580,
      fontSize: 26,
      onSelect: (i) => this.resolve({ kind: 'mentor', accept: i === 0 }),
    });
    const files = [monFile(this, mentor.speciesId, 'front', mentor.shiny), monFile(this, prote.speciesId, 'icon', prote.shiny) ?? monFile(this, prote.speciesId, 'front', prote.shiny)];
    this.rxShow(() => ({
      title: 'Mentorship',
      card: { big: true, file: files[0]!, second: files[1], name: `${m.name} & ${p.name}`, level: '', tag: '', sub: pathName(path), accent: '', types: [], lines: [PATH_BLURB[path]] },
      options: [plain(`Let ${m.name} mentor ${p.name}`), plain('Not now')],
      details: [...types.map((t) => `${TYPE_NAMES[t]}: ${TYPE_BLURB[t]}`), "Chemistry grows with every win together: it shifts the protégé's stats toward its mentor, unlocks mentor moves, and lets the mentor step in once per battle.", 'When the protégé catches up, the pair can hold a graduation spar.'],
      party: null,
      text: `${p.name} looks up to ${m.name}.`,
    }));
  }

  /** M5: a Pokémon you defeated comes back and asks to be taught. Unskippable: no back button, one button per beat. */
  private buildReturn(foe: PokemonInstance, mentorUid: string, reason: string): void {
    const { session } = services();
    const content = session.content;
    const run = session.run!;
    const mentor = run.party.find((p) => p.uid === mentorUid);
    if (!mentor) {
      this.resolve({ kind: 'returnProtege' });
      return;
    }
    const m = getSpecies(content, mentor.speciesId);
    const f = getSpecies(content, foe.speciesId);
    const accepts = mentorAccepts(run, mentorUid, foe.speciesId);
    const beats = [
      `A ${f.name} steps out of the grass. It looks right at ${m.name}.`,
      reason,
      `${f.name} wants to get stronger. It asks ${m.name} to teach it.`,
      accepts ? `${m.name} looks it over, then nods. ${f.name} will join as its protégé.` : `${m.name} turns away. It is not ready to teach anyone.`,
    ];
    // The mandatory return moment (cannot be skipped) plays first; then the lines, one button per beat.
    void playMentorMoment(this, content, 'protegeReturn', mentor, foe, { title: 'A familiar face', subtitle: `${f.name} returns`, caption: beats[0]! }).then(() => {
      if (this.done) return;
      pokemonVisual(this, m, 'front', 150, 260, 3, mentor.shiny);
      pokemonVisual(this, f, 'front', 150, 470, 2, foe.shiny);
      const text = this.add.text(300, 60, beats[0]!, textStyle(28, COLORS.textLight, { wordWrap: { width: 640 } }));
      drawPanel(this, 300, 270, 620, 150);
      let step = 0;
      this.menu = new Menu(this, {
        x: 316,
        y: 284,
        options: [{ label: 'Continue' }],
        itemHeight: 56,
        itemWidth: 580,
        fontSize: 26,
        onSelect: () => {
          step += 1;
          if (step < beats.length) text.setText(beats[step]!);
          else this.resolve({ kind: 'returnProtege' });
          this.rx?.refresh();
        },
      });
      const files = [monFile(this, mentor.speciesId, 'front', mentor.shiny), monFile(this, foe.speciesId, 'icon', foe.shiny) ?? monFile(this, foe.speciesId, 'front', foe.shiny)];
      this.rxShow(() => ({
        title: 'A familiar face',
        card: { big: true, file: files[0]!, second: files[1], name: `${m.name} & ${f.name}`, level: '', tag: '', sub: `${f.name} returns`, accent: '', types: [], lines: [] },
        options: [plain('Continue')],
        details: [],
        party: null,
        text: beats[Math.min(step, beats.length - 1)]!,
      }));
    });
  }

  // ---------- a PP Up or PP Max ----------

  private buildPpUp(uid: string, itemName: string, ups: number): void {
    const { session } = services();
    const content = session.content;
    const mon = session.run!.party.find((p) => p.uid === uid)!;
    const species = getSpecies(content, mon.speciesId);
    pokemonVisual(this, species, 'front', 150, 260, 3, mon.shiny);
    this.add.text(300, 40, `Use the ${itemName} on which of ${species.name}'s moves?`, textStyle(30, COLORS.textLight, { wordWrap: { width: 640 } }));
    this.add.text(300, 120, `Each PP Up adds a fifth of the move's PP (at most ${MAX_PP_UPS}).${ups > 1 ? ` This counts as ${ups}.` : ''}`, textStyle(20, '#d8d0e0'));
    drawPanel(this, 300, 160, 620, 280);
    this.menu = new Menu(this, {
      x: 316,
      y: 172,
      options: mon.moves.map((slot) => ({
        label: content.moves.get(slot.id)!.name,
        detail: `PP ${slot.pp}/${maxPp(content, slot)} · PP Ups ${slot.ppUps ?? 0}/${MAX_PP_UPS}`,
        disabled: (slot.ppUps ?? 0) >= MAX_PP_UPS,
      })),
      itemHeight: 58,
      itemWidth: 600,
      fontSize: 24,
      onSelect: (i) => this.resolve({ kind: 'ppUpMove', moveIndex: i }),
    });
    const file = monFile(this, mon.speciesId, 'icon', mon.shiny) ?? monFile(this, mon.speciesId, 'front', mon.shiny);
    this.rxShow(() => ({
      title: itemName,
      card: { big: false, file, name: species.name, level: '', tag: '', sub: 'gets more PP from the', accent: itemName, types: [], lines: [`Each PP Up adds a fifth of the move's PP (at most ${MAX_PP_UPS}).${ups > 1 ? ` This counts as ${ups}.` : ''}`] },
      options: mon.moves.map((slot) => ({ ...rxMove(content, slot.id, slot.pp, slot), small: `PP ${slot.pp}/${maxPp(content, slot)} · PP Ups ${slot.ppUps ?? 0}/${MAX_PP_UPS}`, off: (slot.ppUps ?? 0) >= MAX_PP_UPS })),
      details: [],
      party: null,
      text: `Use the ${itemName} on which of ${species.name}'s moves?`,
    }));
  }

  // ---------- a caught Pokémon ----------

  /** A caught Pokémon, or one from a past run that wants to join (`reunion` set: true if it won a past run with you). */
  /**
   * The Egg hatches (EBDX art): it wobbles and cracks a little more each time, bursts in a white
   * flash and shines, then the usual join screen shows the Pokémon. Motion "off" skips straight to it.
   */
  private playHatch(mon: PokemonInstance): void {
    const motion = services().session.settings.battleAnimations;
    const has = (id: string) => this.textures.exists(id);
    if (motion === 'off' || !has('pack.ebdx.egg')) {
      this.buildCaught(mon);
      return;
    }
    this.hatching = true;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 + 10;
    const layer = this.add.container(0, 0).setDepth(200);
    layer.add(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a1830).setOrigin(0));
    if (has('pack.ebdx.hatch.hatchbg')) layer.add(this.add.image(cx, GAME_HEIGHT / 2, 'pack.ebdx.hatch.hatchbg').setDisplaySize(GAME_WIDTH, GAME_HEIGHT));
    if (has('pack.ebdx.hatch.line')) {
      const line = this.add.tileSprite(cx, cy + 96, GAME_WIDTH, 38, 'pack.ebdx.hatch.line').setAlpha(0.8);
      layer.add(line);
      this.tweens.add({ targets: line, tilePositionX: 512, duration: 4000, repeat: -1 });
    }
    const shadow = this.add.ellipse(cx, cy + 70, 120, 22, 0x000000, 0.3);
    const egg = this.add.image(cx, cy, 'pack.ebdx.egg').setScale(4.6);
    const cracks = has('pack.ebdx.eggCracks') ? this.add.image(cx, cy, 'pack.ebdx.eggCracks', 0).setScale(4.6) : null;
    const tier = eggTier(mon.eggTier);
    if (tier.id !== 'ordinary') {
      egg.setTint(Phaser.Display.Color.HexStringToColor(tier.color).color);
    }
    const caption = this.add.text(cx, 64, tier.line, textStyle(tier.line.length > 22 ? 26 : 32, COLORS.textLight)).setOrigin(0.5).setAlpha(0);
    layer.add([shadow, egg, ...(cracks ? [cracks] : []), caption]);
    if (has('pack.ebdx.hatch.overlay')) layer.add(this.add.image(cx, GAME_HEIGHT / 2, 'pack.ebdx.hatch.overlay').setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.5));
    this.tweens.add({ targets: caption, alpha: 1, y: 80, duration: 400, ease: 'Back.easeOut' });
    // Idle bob while it gathers itself.
    this.tweens.add({ targets: [egg, cracks].filter(Boolean), y: cy - 10, duration: 420, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    const sparkle = (n: number) => {
      if (!has('pack.ebdx.hatch.shine6')) return;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
        const s = this.add.image(cx, cy - 60, 'pack.ebdx.hatch.shine6').setScale(1.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(201);
        this.tweens.add({ targets: s, x: cx + Math.cos(a) * 170, y: cy - 60 + Math.sin(a) * 140, scale: 0.3, alpha: 0, angle: 180, duration: 700, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
      }
    };
    // Three wobbles, each a little wilder, each leaving more cracks.
    const wobble = (i: number) => {
      if (i >= 3) return burst();
      const swing = 10 + i * 6;
      this.tweens.chain({
        targets: [egg, cracks].filter(Boolean),
        tweens: [
          { angle: -swing, duration: 110 - i * 15, ease: 'Sine.easeOut' },
          { angle: swing, duration: 180 - i * 25, ease: 'Sine.easeInOut', yoyo: true, repeat: 1 },
          { angle: 0, duration: 120, ease: 'Back.easeOut' },
        ],
        onComplete: () => {
          cracks?.setFrame(Math.min(4, i + 2));
          this.cameras.main.shake(90, 0.004 + i * 0.002);
          sparkle(4 + i * 2);
          this.time.delayedCall(260 + (2 - i) * 120, () => wobble(i + 1));
        },
      });
    };
    const burst = () => {
      const flash = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0).setOrigin(0).setDepth(210);
      this.tweens.add({ targets: [egg, cracks].filter(Boolean), scaleX: 5.4, scaleY: 3.8, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
      this.tweens.add({
        targets: flash,
        alpha: 1,
        duration: 260,
        delay: 120,
        onComplete: () => {
          layer.destroy();
          this.cameras.main.setBackgroundColor(0x000000);
          playSfx(this, 'se.egg_get');
          this.hatching = false;
          this.buildCaught(mon);
          if (has('pack.ebdx.hatch.shine7')) {
            const ring = this.add.image(200, 220, 'pack.ebdx.hatch.shine7').setBlendMode(Phaser.BlendModes.ADD).setDepth(205).setScale(1.2);
            this.tweens.add({ targets: ring, scale: 4.5, alpha: 0, angle: 90, duration: 900, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
          }
          sparkle(10 + EGG_TIERS.findIndex((t) => t.id === tier.id) * 6);
          this.tweens.add({ targets: flash, alpha: 0, duration: 520, ease: 'Sine.easeIn', onComplete: () => flash.destroy() });
        },
      });
    };
    this.time.delayedCall(900, () => wobble(0));
  }

  private buildCaught(caught: PokemonInstance, reunion?: boolean): void {
    const { session } = services();
    const content = session.content;
    const run = session.run!;
    const species = getSpecies(content, caught.speciesId);
    const candies = candiesForRelease(content, caught.level);
    const partyMax = partyCapacity(content, run);
    const full = run.party.length >= partyMax;
    const boxRoom = !reunion && run.box.length < boxCapacity(runPerks(content, run));
    const blocked = joinProblem(content, run, caught.speciesId);

    // A soft spotlight for the new Pokémon to stand on.
    const spot = this.add.graphics();
    spot.fillStyle(0x0e0b12, 0.55).fillEllipse(200, 300, 240, 44);
    spot.fillStyle(0x4a3f5c, 0.9).fillEllipse(200, 298, 200, 32);
    fitHeight(this, pokemonVisual(this, species, 'front', 200, 300, 3.5, caught.shiny), 240);
    const past = reunion !== undefined;
    const title = !past ? (caught.hatched ? `${species.name} hatched from ${caught.eggTier && caught.eggTier !== 'ordinary' ? `a ${eggTier(caught.eggTier).name} Egg` : 'the Egg'}!` : `You caught ${species.name}!`) : reunion ? `${species.name} never forgot you!` : `${species.name} from a past run is here!`;
    this.add.text(400, 40, title, textStyle(past ? 32 : 40, COLORS.textLight));
    const profile = session.profile;
    const extras = {
      compact: session.settings.catchDetail === 'compact',
      firstDiscovery: !past && !profile.speciesCaught.includes(caught.speciesId),
      source: past ? undefined : caught.hatched ? `Hatched from ${caught.eggTier && caught.eggTier !== 'ordinary' ? `a ${eggTier(caught.eggTier).name} Egg` : 'an Egg'}` : 'Caught on this run',
    };
    const summaryText = this.add.text(400, 92, '', textStyle(16, '#d8d0e0', { lineSpacing: 4, wordWrap: { width: 560 } }));
    let compareIdx = 0;
    const drawSummary = (): void => {
      const other = run.party[compareIdx];
      let lines = [...catchSummary(content, caught, other, extras), masteryPreview(content, profile, run, caught)];
      // The full detail runs under the menu on a small screen: use the compact lines when it would not fit.
      if (!extras.compact) {
        summaryText.setText(lines.join('\n'));
        if (summaryText.height > 232) lines = [...catchSummary(content, caught, other, { ...extras, compact: true }), masteryPreview(content, profile, run, caught)];
      }
      const hint = run.party.length > 1 ? `(Left/Right: compare with ${other ? getSpecies(content, other.speciesId).name : 'nobody'})` : '';
      fitBlock(summaryText, 560, 245, [...lines, hint, blocked ? `${blocked}.` : full ? `Your party is full (${partyMax}).` : `Party: ${run.party.length}/${partyMax}`].join('\n'));
    };
    drawSummary();
    this.compareStep = (d: number): void => {
      if (run.party.length < 2) return;
      compareIdx = (compareIdx + d + run.party.length) % run.party.length;
      drawSummary();
      this.rx?.refresh();
    };

    const candyText = `${candies} cand${candies === 1 ? 'y' : 'ies'}`;
    const keepsake = candies * content.balance.reunion.keepsakeCandyMultiplier;
    const keepsakeText = `${keepsake} cand${keepsake === 1 ? 'y' : 'ies'}`;
    const options = [
      { label: blocked ? "Can't join" : full ? 'Replace a party Pokémon' : 'Add to party', disabled: blocked !== null && !past },
      ...(boxRoom ? [{ label: `Send to the PC (${run.box.length}/${boxCapacity(runPerks(content, run))})` }] : []),
      ...(past ? [{ label: `Take a keepsake (+${keepsakeText})` }, { label: 'Let it go on its journey' }] : releaseLimitReached(content, session.run!) && !blocked ? [] : [{ label: `Release it (+${candyText})` }]),
    ];
    drawPanel(this, 400, 345, 520, past ? 170 : 130 + (boxRoom ? 52 : 0));
    this.menu = new Menu(this, {
      x: 420,
      y: 365,
      options,
      itemWidth: 480,
      itemHeight: past ? 46 : 52,
      fontSize: 28,
      onSelect: (i) => {
        if (i === 0 && blocked && !past) return;
        if (i === 0 && !full) this.resolve({ kind: 'addToParty' });
        else if (i === 0) this.openReplace(caught);
        else if (boxRoom && i === 1) this.resolve({ kind: 'sendToBox' });
        else if (past && i === 1) this.resolve({ kind: 'keepsake' });
        else if (past) this.resolve({ kind: 'release' });
        else
          this.confirm(`Release ${species.name}? You'll get ${candyText}. This can't be undone.`, () => {
            this.closeConfirm();
            // Greenneedle gn.58: it is asked once, and remembered; no answer is judged.
            this.confirm('Why are you letting it go?', (r) => {
              playSfx(this, 'se.ball_release');
              this.resolve({ kind: 'release', reason: ((r ?? 3) + 1) as 1 | 2 | 3 | 4 });
            }, ['"It\'ll be happier here."', '"I\'ve no room."', '"It wasn\'t strong enough."', '(No reason.)']);
          });
      },
    });
    const note = past ? 'It wants to join you again. It kept its moves; it meets you at this battle\'s level.' : 'Candies are kept after the run ends.';
    const file = monFile(this, caught.speciesId, 'front', caught.shiny);
    const chips = partyChips(this);
    // "Send to the PC (3/30)" reads as the button and its small print in the mock-up.
    const split = (label: string, off = false): DecisionOption => { const cut = /^(.*?) \((.*)\)$/.exec(label); return plain(cut ? cut[1]! : label, cut ? cut[2]! : '', off); };
    this.rxShow(() => {
      const other = run.party[compareIdx];
      const brief = catchSummary(content, caught, other, { ...extras, compact: true }).slice(1);
      const ability = /Ability: (.*)$/.exec(brief.find((l) => l.startsWith('Type:')) ?? '')?.[1] ?? '';
      const nature = (brief.find((l) => l.startsWith('Nature:')) ?? '').replace('Nature: ', '');
      return {
        title: past ? 'Reunion' : caught.hatched ? 'Hatched!' : 'Caught!',
        card: { big: true, file, name: `${species.name}${caught.shiny ? ' ★' : ''}`, level: `Lv ${caught.level}`, tag: extras.firstDiscovery ? 'NEW' : '', sub: [ability, nature].filter(Boolean).join(' · '), accent: '', types: species.types, lines: [] },
        options: options.map((o, i) => (i === 0 ? plain(o.label, blocked ?? (full ? `Party is full (${partyMax})` : `Party ${run.party.length}/${partyMax}`), Boolean(o.disabled)) : split(o.label))),
        details: [...brief.filter((l) => !l.startsWith('Type:') && !l.startsWith('Nature:')), masteryPreview(content, profile, run, caught)],
        party: chips,
        text: `${title} Where should it go? ${note}`,
        more: [...catchSummary(content, caught, other, { ...extras, compact: false }), masteryPreview(content, profile, run, caught)],
        hints: [['Enter', 'choose'], ...(run.party.length > 1 ? ([['←→', `compare: ${other ? getSpecies(content, other.speciesId).name : 'nobody'}`]] as const) : []), ['I', 'details']],
      };
    });
    this.add.text(GAME_WIDTH / 2, past ? 520 : 500, note, textStyle(18, '#a69cb4')).setOrigin(0.5);
  }

  private openReplace(caught: PokemonInstance): void {
    const { session } = services();
    const content = session.content;
    const run = session.run!;
    const newName = getSpecies(content, caught.speciesId).name;
    this.picker = new Picker(this, {
      glass: true,
      title: `Which Pokémon leaves to make room for ${newName}?`,
      columns: 2,
      rowHeight: 78,
      rows: partyRows(content, run.party, () => null, undefined, () => 'It will be gone for good, and gives no candies.'),
      onSelect: (i) => {
        const old = run.party[i]!;
        const oldName = getSpecies(content, old.speciesId).name;
        this.confirm(`Send away ${oldName}${old.shiny ? ' ★' : ''} (Lv${old.level}) and keep ${newName}? This can't be undone.`, () =>
          this.resolve({ kind: 'replace', partyIndex: i }),
        );
      },
      onBack: () => {
        this.picker?.close();
        this.picker = null;
      },
    });
  }
}
